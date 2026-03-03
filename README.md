# Nod.i — App

OpenClaw companion app. Single codebase targeting PWA, iOS, Android, macOS, and Windows via Tauri 2.0 + React.

---

## Ce que fait cette app

L'app Nod.i permet de **parler avec l'agent OpenClaw** hébergé sur une box Nodi (Raspberry Pi CM4) depuis n'importe quel appareil — navigateur, mobile, desktop.

Le workflow est inspiré de l'Apple TV :

1. L'utilisateur branche sa box Nodi
2. Un **code à 6 caractères** s'affiche sur l'écran LCD de la box
3. L'utilisateur entre ce code dans l'app
4. L'app est **pairée** — elle peut maintenant envoyer des messages à l'agent et recevoir ses réponses en temps réel

---

## Stack technique

| Couche | Techno |
|--------|--------|
| UI | React + Vite |
| Desktop / Mobile natif | Tauri 2.0 |
| HTTP client | `@tauri-apps/plugin-http` (natif) ou `fetch` (web) |
| État global | Zustand (`nodStore`) |

---

## Architecture de connexion

```
┌─────────────────┐         ┌──────────────────────────────┐
│   App (React)   │  HTTP   │  Nodi (Raspberry Pi CM4)     │
│                 │────────▶│                              │
│  POST /pair     │         │  pairing_server.py :8766     │
│  { code }       │         │  ├── Valide le code          │
│                 │◀────────│  ├── Génère un token         │
│  { token }      │         │  └── Retourne le token       │
│                 │         │                              │
│  POST /message  │         │  pairing_server.py :8766     │
│  { token, msg } │────────▶│  ├── Vérifie le token        │
│                 │         │  ├── WebSocket → OpenClaw    │
│  { reply }      │◀────────│  └── Retourne la réponse     │
└─────────────────┘         └──────────────────────────────┘
                                          │
                                          │ WebSocket ws://localhost:18789
                                          ▼
                                   ┌─────────────┐
                                   │  OpenClaw   │
                                   │  Gateway    │
                                   │  (agent IA) │
                                   └─────────────┘
```

---

## Ce qu'on a modifié dans l'app

### `src/hooks/useOpenClaw.ts`

Fichier principal de communication avec le Nodi.

**Changements :**
- `BOX_URL` corrigée : `http://192.168.0.30:8766` (IP réelle du Nodi sur le réseau local)
- Endpoint de pairing : `POST /pair` avec `{ code }` → reçoit `{ success, token, name }`
- Endpoint message : `POST /message` avec `{ token, message }` → reçoit `{ success, reply }`
- Suppression de l'ancien système de parsing regex (`Token: xxx mDNS: yyy`)
- Suppression de `testConnection` (plus nécessaire)
- Le token renvoyé par `/pair` est stocké dans le store et réutilisé pour chaque message

---

## Ce qu'on a ajouté sur le Nodi

### `/tmp/pairing_server.py` — Serveur de pairing (port 8766)

Serveur HTTP Python qui tourne en permanence sur le Nodi.

**Endpoints :**

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/status` | Statut de la box (`online`, `paired`) |
| `POST` | `/pair` | Valide le code affiché sur l'écran, retourne un token de session |
| `POST` | `/message` | Envoie un message à l'agent, retourne la réponse |
| `POST` | `/unpair` | Déconnecte un appareil |

**Fonctionnement de `/message` :**
1. Vérifie que le token de session est valide
2. Ouvre une connexion **WebSocket** vers le gateway OpenClaw (`ws://localhost:18789`)
3. S'authentifie avec `method: connect`, `role: operator`, `mode: cli`
4. Envoie le message avec `method: chat.send`, `sessionKey: main`
5. Écoute les events de stream jusqu'à recevoir `event: chat` avec `state: final`
6. Retourne le texte de la réponse à l'app

**Sécurité :**
- Le code se régénère toutes les 5 minutes si non pairé
- Chaque pairing génère un token unique (48 chars hex)
- Le token OpenClaw interne n'est jamais exposé à l'app

### `/tmp/pairing_screen.py` — Affichage sur écran LCD

Affiche le code de pairing sur l'écran **ST7789 320×240** de la box avec une animation.

### Config OpenClaw (`~/.openclaw/openclaw.json`)

Webhooks activés pour permettre les appels HTTP entrants :

```json
{
  "hooks": {
    "enabled": true,
    "token": "...",
    "path": "/hooks",
    "allowedAgentIds": ["main"]
  }
}
```

### Nginx (`/etc/nginx/sites-enabled/nodi.conf`)

Proxy `/hooks/` vers le gateway OpenClaw sur `localhost:18789` :

```nginx
location /hooks/ {
    proxy_pass http://127.0.0.1:18789/hooks/;
    add_header Access-Control-Allow-Origin * always;
}
```

---

## Lancer le serveur de pairing (dev)

Sur le Nodi :

```bash
nohup python3 /tmp/pairing_server.py > /tmp/pairing.log 2>&1 &
```

Le code s'affiche dans les logs et sur l'écran LCD.

---

## TODO

- [ ] Faire tourner `pairing_server.py` en service systemd permanent
- [ ] Session dédiée par appareil (isoler du canal WhatsApp)
- [ ] Support du streaming de réponse (affichage mot par mot dans l'app)
- [ ] QR code en alternative au code manuel
