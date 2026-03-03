# UNBND App

Application web mobile pour se connecter et communiquer avec son boîtier UNBND.
Déployée sur Vercel : https://app-com-openclaw.vercel.app

---

## Fonctionnement

1. L'utilisateur ouvre l'app sur son mobile
2. Entre le code à 6 caractères affiché sur l'écran du Nodi
3. L'app contacte Railway pour résoudre le code → URL du Nodi
4. Confirme sur l'écran tactile du Nodi
5. Chat disponible directement avec l'IA

---

## Stack

- **React** + **TypeScript**
- **Vite** (build)
- **Tailwind CSS** (styles)
- **Zustand** (state management)
- **Vercel** (déploiement)

---

## Développement

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## Déploiement

Push sur `main` → Vercel déploie automatiquement.

---

## Screens

| Screen | Description |
|--------|-------------|
| `Onboarding` | Saisie du code de pairing + attente confirmation |
| `Chat` | Interface de chat avec l'IA |
| `Settings` | Config, test connexion, code de partage, déconnexion |

---

## Flux de pairing

```
App → GET https://unbnd-server-production.up.railway.app/resolve/:code
           └── Retourne { url, pendingId }

App → POST {url}/pair { code }
           └── Retourne { pendingId, pending: true }

App poll → POST {url}/poll { pendingId }
           └── Retourne { status: "confirmed"|"rejected"|"expired", token }

App → Chat avec token
```

## Flux de message

```
App → POST {url}/message { token, message }
           └── Retourne { success: true, reply: "..." }
```

---

## Variables

L'app utilise `window.location.origin` comme base URL automatiquement quand elle est servie depuis le Nodi.

Quand elle est sur Vercel, elle utilise Railway pour résoudre le code.

---

## Repos liés

- **[unbnd-nodi](https://github.com/cocolocow/unbnd-nodi)** — scripts Raspberry Pi
- **[unbnd-server](https://github.com/cocolocow/unbnd-server)** — serveur Railway
