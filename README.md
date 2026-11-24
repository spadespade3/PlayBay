# PlayBay

PlayBay is a local-multiplayer arcade platform with a console-style interface. The current playable game is **Neon Pong**, with CPU, local two-player and LAN modes.

## Run locally

Requires Node.js 18 or newer.

```sh
node server.js
```

Open the address printed by the server, normally:

- This computer: http://localhost:3000
- Another device on the same Wi-Fi: http://<host-ip>:3000

Do not open `index.html` via `file://`. The app uses ES modules and the LAN server also provides the WebSocket room relay.

## Controls — Neon Pong

- Single player / host: `W` / `S` or `↑` / `↓`
- Local two-player: Player 1 uses `W` / `S`; Player 2 uses `↑` / `↓`
- Guest: `W` / `S` or `↑` / `↓`
- Pause / resume: `P`, `Escape` or `Space`
- Restart: `R`
- Mouse / touch: hold and drag on the playfield
- Gamepad: first connected controller's D-pad or left stick

The ball launches automatically after the countdown. Paddle movement contributes to the ball's speed and direction on contact.

## LAN safety notes

- Room codes are six characters; repeated joins from one IP are rate-limited.
- The server accepts browser WebSocket connections only when the page origin matches the server host.
- The static server exposes only `index.html`, `css/`, `js/` and `kenney_ui-pack/`; repository metadata and configuration files are not served.
- This is a same-network party-game relay, not an internet-facing service. The current server uses plain HTTP/WebSocket without TLS or user accounts. Do not forward its port to the public internet or use it on an untrusted network.

## Screens

Home · Game Library · Game Details · Game Player · Settings · Multiplayer

## Architecture

- `server.js` — static asset host and WebSocket room relay
- `js/app.js` — route lifecycle, screen cleanup and global input
- `js/screens/` — one module per screen
- `js/games/pong.js` — simulation, physics, AI, rendering and snapshot validation
- `js/net.js` — WebSocket client and room state
- `js/store.js` — validated settings and local stats
- `js/audio.js` — WebAudio synth and Kenney UI sound playback
- `js/catalog.js` — game catalog

The LAN host owns the simulation. The guest sends paddle input; the host relays validated snapshots at approximately 30 updates per second.

## Development checks

```sh
npm run check
npm test
```

The checks syntax-validate the application modules and run regression tests for Pong physics, snapshot validation, static-file exposure, WebSocket origin checks and LAN room creation/joining.

## Assets and licensing

The Kenney UI Pack audio and fonts are CC0; see `kenney_ui-pack/License.txt`. PlayBay's source code is distributed under the MIT License in `LICENSE`.
