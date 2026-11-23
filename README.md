# PlayBay

PlayBay is a local-multiplayer neon arcade platform. One finished game ships today: **Neon Pong** - host-authoritative, room-based multiplayer over WebSockets, with a CPU opponent, local two-player, and LAN play from any browser on the same network.

## Run

```sh
node server.js
```

- Local: http://localhost:3000
- LAN: http://<your-ip>:3000 (the server prints it on boot)

Requires Node.js >= 18. No dependencies - `npm install` is not needed.

> Do not open `index.html` via `file://`. The app is an ES-module SPA and requires the HTTP server.

## Controls (Neon Pong)

- P1: `W` / `S`
- P2: `Up` / `Down` (local mode)
- Pause: `P` or `Esc`
- Restart: `R`
- Touch: drag on the playfield
- Gamepad: D-pad / left stick, A to start/restart, Start to pause

## Screens

Home · Game Library · Game Details · Game Player · Settings · Multiplayer

## Architecture

- `server.js` - zero-dependency static host + minimal RFC 6455 WebSocket room relay
- `js/app.js` - app shell, hash router, global wiring (gamepad nav, audio)
- `js/screens/` - one module per screen
- `js/games/pong.js` - `PongEngine` (playfield, physics, AI, net sync) - pure logic, no DOM
- `js/net.js` - WebSocket client for rooms / host-authoritative state relay
- `js/store.js` - settings + stats (localStorage)
- `js/audio.js` - synth + Kenney UI sound playback
- `js/ui.js` - icon set, confetti, helpers
- `js/catalog.js` - game catalog (only Neon Pong is playable)

Multiplayer: host creates a room and gets a code; guest joins by code. Host runs the simulation (~30 Hz state snapshots); guest sends paddle position and interpolates.

## Assets

UI sounds and fonts from the [Kenney UI Pack](https://kenney.nl/assets/ui-pack) (CC0). Cover art and icons are original inline SVG/CSS.

## License

MIT