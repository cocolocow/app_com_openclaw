# UNBND — Architecture Produit

## Vision

Une box AI plug-and-play. L'utilisateur la branche, voit un code, l'entre dans l'app, et il parle à son agent IA personnel. Hébergé chez lui, accessible partout.

---

## Workflow utilisateur final

```
📦 Unbox
    │
    ▼
🔌 Branche la box
    │
    ▼
📺 Écran affiche un code  →  ex: A3F2B1
    │
    ▼
📱 Ouvre app.unbnd.ai
    │
    ▼
⌨️  Tape le code
    │
    ▼
✅ Pairé — parle avec ton agent
```

Temps total : **moins de 2 minutes**. Zéro config. Zéro compte à créer.

---

## Architecture technique complète

```
┌─────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE UNBND                      │
│                                                                   │
│  api.unbnd.ai          app.unbnd.ai         Cloudflare DNS       │
│  (VPS Node.js)         (React PWA)          nodi-xxxx.unbnd.ai   │
│       │                     │                      │             │
└───────┼─────────────────────┼──────────────────────┼─────────────┘
        │                     │                      │
        │                     │                      │ CNAME tunnel
        │                     │                      │
┌───────┼─────────────────────┼──────────────────────┼─────────────┐
│       │              BOX UNBND (Nodi)               │             │
│       │                                             │             │
│  provisioning         OpenClaw Gateway          cloudflared       │
│  au 1er boot     ←→  ws://localhost:18789   →→  tunnel named     │
│       │                     │                      │             │
│  pairing_server       agent IA (Claude)        écran LCD         │
│  :8766                session isolée           code pairing      │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Les 3 composants à construire

### 1. Serveur de provisioning (`api.unbnd.ai`)

Tournant sur un VPS. Responsable de :

- Enregistrer chaque nouvelle box au 1er boot
- Créer un tunnel Cloudflare via API → `nodi-xxxx.unbnd.ai`
- Faire le lien **code de pairing → URL de la box**
- Stocker les métadonnées box (id, url, statut, date activation)

**Endpoints :**

```
POST /provision
  Body: { boxId, publicKey }
  → Crée tunnel Cloudflare
  → Retourne { url: "nodi-xxxx.unbnd.ai" }

GET /resolve/:code
  → Retourne { url: "nodi-xxxx.unbnd.ai" }
  → Utilisé par l'app pour trouver la box depuis le code

POST /heartbeat
  Body: { boxId }
  → La box signale qu'elle est en ligne
```

### 2. Image SD maîtresse

Image Raspberry Pi OS Lite avec :

- OpenClaw pré-installé et configuré
- `cloudflared` pré-installé
- `pairing_server.py` en service systemd
- Script de premier boot (`/boot/first-run.sh`) qui :
  1. Génère un `BOX_ID` unique (ex: hash du numéro de série)
  2. Appelle `POST api.unbnd.ai/provision`
  3. Configure le tunnel Cloudflare avec l'URL reçue
  4. Lance le tunnel en service systemd
  5. Affiche le code sur l'écran LCD

```bash
# first-run.sh (simplifié)
BOX_ID=$(cat /proc/cpuinfo | grep Serial | sha256sum | head -c 8)
RESPONSE=$(curl -X POST https://api.unbnd.ai/provision -d "{\"boxId\":\"$BOX_ID\"}")
URL=$(echo $RESPONSE | jq -r '.url')

# Configure cloudflared avec cette URL
cloudflared tunnel route dns unbnd-$BOX_ID $URL
systemctl enable cloudflared
systemctl start cloudflared
```

### 3. App (`app.unbnd.ai`)

PWA React (+ Tauri pour iOS/Android natif).

**Flow de pairing :**

```
1. User entre le code  →  ex: A3F2B1
2. App appelle GET api.unbnd.ai/resolve/A3F2B1
3. Reçoit { url: "https://nodi-a3f2.unbnd.ai" }
4. App appelle POST https://nodi-a3f2.unbnd.ai/pair { code: "A3F2B1" }
5. Reçoit { token: "xxx" }
6. Sauvegarde { url, token } en localStorage
7. Toutes les futures requêtes → https://nodi-a3f2.unbnd.ai/message
```

L'app ne connaît jamais l'IP locale de la box. Elle passe toujours par l'URL Cloudflare.

---

## Sécurité

| Couche | Mécanisme |
|--------|-----------|
| Transport | HTTPS via Cloudflare (TLS terminé au edge) |
| Pairing | Code 8 chars + rate limit 3 essais/5min |
| Session | Token 48 chars hex, expiration 90 jours |
| Agent | Token OpenClaw jamais exposé à l'app |
| Box | Chaque box a son propre tunnel isolé |
| Provisioning | Authentification par clé publique (ed25519) |

---

## Roadmap technique

### MVP (maintenant — proof of concept) ✅
- [x] Pairing server sur le Nodi
- [x] Affichage code sur écran LCD
- [x] App React avec flow pairing → chat
- [x] Communication WebSocket → OpenClaw
- [x] Tunnel Cloudflare (temporaire)

### V1 (prêt à vendre)
- [ ] Serveur de provisioning `api.unbnd.ai`
- [ ] Tunnel Cloudflare named permanent par box
- [ ] App résout l'URL via `api.unbnd.ai/resolve/:code`
- [ ] Service systemd pour pairing_server
- [ ] Rate limiting sur /pair
- [ ] Expiration tokens
- [ ] Image SD maîtresse

### V2 (scale)
- [ ] Dashboard admin (voir toutes les boxes en ligne)
- [ ] OTA updates (mise à jour des boxes à distance)
- [ ] Session isolée par box (mémoire séparée)
- [ ] App iOS + Android (Tauri compilé)
- [ ] Onboarding guidé dans l'app

---

## Stack recommandée

| Composant | Techno | Coût |
|-----------|--------|------|
| VPS provisioning | Hetzner CAX11 (ARM) | ~4€/mois |
| DNS + Tunnels | Cloudflare | Gratuit |
| Domaine | unbnd.ai (Porkbun) | ~15$/an |
| App web | Vercel / Cloudflare Pages | Gratuit |
| Box | Raspberry Pi CM4 4GB | ~35-50€/unité |
| Écran | ST7789 1.3" | ~5€/unité |

**Coût infra pour lancer : ~20$/an + 4€/mois.**
Les tunnels Cloudflare sont gratuits peu importe le nombre de boxes.

---

## Ce qu'on a aujourd'hui (proof of concept fonctionnel)

```
Nodi (192.168.0.30)
├── OpenClaw gateway     :18789  (WebSocket, agent IA)
├── pairing_server.py    :8766   (HTTP, pairing + proxy)
├── cloudflared tunnel           (HTTPS public temporaire)
├── écran LCD ST7789             (affiche le code)
└── nginx                :80    (reverse proxy)

App (app_com_openclaw)
├── useOpenClaw.ts               (pairing + chat)
├── BOX_URL → trycloudflare URL
└── Flow: code → token → chat ✅
```
