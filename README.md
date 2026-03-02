# Nod.i

OpenClaw companion app. Single codebase targeting PWA, iOS, Android, macOS, and Windows via Tauri 2.0 + React.

## Prerequisites

- Node.js >= 22
- pnpm
- Rust (for Tauri native builds)
- Xcode (for iOS/macOS)
- Android Studio (for Android)

## Setup

```bash
pnpm install
```

## Development

### Web (PWA)
```bash
pnpm dev
```

### Desktop (macOS/Windows/Linux)
```bash
pnpm tauri dev
```

### iOS
```bash
pnpm tauri ios dev
```

### Android
```bash
pnpm tauri android dev
```

## Build

### Web
```bash
pnpm build
```

### Desktop
```bash
pnpm tauri build
```

### iOS
```bash
pnpm tauri ios build
```

### Android
```bash
pnpm tauri android build
```

## Architecture

- **Frontend**: React 19 + TypeScript + TailwindCSS v4 + Zustand
- **Backend**: Tauri 2.0 (Rust) with `tauri-plugin-http` for CORS-free mDNS requests
- **Communication**: HTTP POST to OpenClaw webhooks (`/hooks/pair`, `/hooks/wake`, `/hooks/agent`)

## Pairing

The app uses OpenClaw's native pairing code system instead of QR scanning:

1. Generate a pairing code on the OpenClaw device (shown on TFT screen)
2. Enter the device address and pairing code in the app
3. The app sends `POST /hooks/pair` with the code
4. On success, receives an auth token and connects

Codes are 6-8 uppercase alphanumeric characters (no 0/O/I to avoid confusion), expire after 1 hour, with a max of 3 attempts.
