# PlayBay phone controller

The PlayBay Android TV launcher (`:app`) is paired with the PlayBay Connect phone app
(`:connect-mobile`) over the local network. The phone becomes a D-pad that drives the
launcher's own focus navigation, exactly as a physical remote does.

No cloud service, no accounts, no accessibility service, no coordinate injection.

## Modules

| Module | Role |
| --- | --- |
| `:app` | Android TV launcher. Hosts the LAN WebSocket server, shows the pairing gate, runs the existing home screen. |
| `:connect-mobile` | Phone D-pad controller. Connects to the TV, sends normalized directional input. |
| `:connect-tv` | Standalone prototype host from the connectivity spike. Superseded by `:app`; kept for reference. |

## Startup and pairing flow

1. `PlayBayActivity` starts and composes `PlayBayApp`.
2. `LauncherConnectionViewModel` is created and, off the main thread, calls
   `TvPairingServer.start()`, which binds `0.0.0.0:8765`.
3. `ConnectionState.hasPaired` is false, so `PairingScreen` is displayed: TV IPv4
   address, six-digit pairing code, server status, and the connection instructions.
4. The phone enters the address and code and opens
   `ws://<tv-ip>:8765/connect?code=<code>`.
5. The TV compares the supplied code with the one it generated. A mismatch closes the
   socket with `VIOLATED_POLICY`; a match sends `CONNECTED`.
6. `hasPaired` flips to true and `HomeScreen` composes. The launcher was never replaced;
   it is the same composable tree as before, mounted once the gate opens.
7. From then on the launcher stays mounted. If the phone disconnects, `ReconnectBar`
   appears at the bottom with the same pairing code and the server keeps listening for a
   new socket. Focus, scroll position, featured selection, and open settings survive.

The pairing code is generated once per process. Activity recreation reuses the existing
ViewModel, so neither the code nor the listening socket is lost on a configuration change.

## Controller protocol, version 1

Every message is a single JSON text frame.

```json
{"v":1,"type":"INPUT","action":"UP","state":"PRESSED","sequence":41}
```

| Field | Type | Rule |
| --- | --- | --- |
| `v` | int | Must be `1`. Any other value is dropped. |
| `type` | string | Must be `"INPUT"`. |
| `action` | string | One of `UP`, `DOWN`, `LEFT`, `RIGHT`. |
| `state` | string | `PRESSED` or `RELEASED`. |
| `sequence` | long | Strictly increasing, starting at 1 per connection. |

TV validation, in order: JSON parses → version matches → type matches → action known →
state known → sequence is positive and greater than the last accepted sequence. A frame
failing any check is discarded without touching the launcher.

### Sequencing

`InputDispatcher` holds the only high-water mark. A frame is accepted only if its
sequence is strictly greater than the last accepted one, which drops duplicates,
replays, and out-of-order delivery. The counter resets when a phone connects, because
the phone restarts at 1 for every session.

Using one counter in one place matters: a second counter anywhere in the path silently
drops input the first time the direction changes.

### Liveness without per-input ACKs

Directional input is high frequency, so it is not acknowledged individually.

- The TV installs a WebSocket ping every 15s with a 30s timeout. An unresponsive phone
  is closed by the engine.
- The phone drains its inbound channel in a coroutine. A TV-side close, a failed ping,
  or a dead socket ends that loop and immediately flips the app to a disconnected state,
  rather than waiting for the next tap to fail.
- Write failures on the phone also mark the session dead.

### Hold and repeat

The phone owns the repeat rate. A press emits `PRESSED` immediately, waits 300 ms, then
emits `PRESSED` every 110 ms while held. Release emits `RELEASED`. The TV treats every
`PRESSED` as one navigation step and ignores `RELEASED` for navigation; releases exist
so a held direction can be cleared and so the state is explicit on the wire.

Only one direction can be held at a time. A non-snapshot compare-and-set guards the
hold, so two fingers landing in the same frame cannot both win.

## Input normalization architecture

```
phone  ──WebSocket──▶ TvPairingServer ──▶ InputDispatcher ──▶ PhoneNavigationEffect ──┐
                                                                                      ├──▶ FocusManager.moveFocus()
TV remote / gamepad ──────────────────▶ platform focus system ────────────────────────┘
```

- `com.playbay.tv.input.InputDirection`, `InputState`, `InputSource`, `InputEvent` — the
  vocabulary. No networking types, no Compose types.
- `InputDispatcher` — the boundary. Accepts validated phone events, holds sequence
  bookkeeping, and emits `InputEvent`s on a `SharedFlow` with a 32-slot buffer and
  `DROP_OLDEST`. Emission is `tryEmit`, so the WebSocket receive loop never waits on UI
  work.
- `PhoneNavigationEffect` — the only place input meets the UI. It maps a `Pressed` event
  to `FocusDirection` and calls `LocalFocusManager.moveFocus`.

Physical remote and gamepad input are not routed through the dispatcher. They already
arrive at the same focus system natively, so a phone press and a remote press land on
the same `moveFocus` call. That is why the launcher UI is untouched and why physical
controllers keep working with the phone connected, disconnected, or absent entirely.

Adding a new source later means emitting into the same dispatcher, or feeding the same
`FocusManager` — the launcher needs no change either way.

## Lifecycle and failure handling

| Event | Behaviour |
| --- | --- |
| Phone disconnects | Server `finally` releases any held direction, resets the sequence, reports disconnected. Launcher stays mounted; `ReconnectBar` shows. |
| Phone reconnects | Same code, new socket, `resetSequence()`, `ReconnectBar` disappears. |
| Phone backgrounded or locked | `ON_PAUSE`/`ON_STOP` sends `RELEASED` for the held direction before the socket idles. |
| Phone app closed | Socket closes; TV releases the held direction; the phone's receive loop ends. |
| TV activity recreated | ViewModel survives, so the server and pairing code survive. |
| TV process killed | Server gone; the phone's receive loop ends and shows the lost-connection state. |
| Port bind fails | `PairingScreen` shows the reason and a **Retry server** action. |

## Build

```sh
./gradlew :app:assembleDebug
./gradlew :connect-mobile:assembleDebug
```

Outputs:

- `app/build/outputs/apk/debug/app-debug.apk` — TV launcher
- `connect-mobile/build/outputs/apk/debug/connect-mobile-debug.apk` — phone controller

## Manual test

1. Install the launcher on the TV and the controller on the phone.
2. Put both on the same Wi-Fi network.
3. Launch the launcher. The pairing screen shows the TV IP and a six-digit code.
4. Enter both in the phone app and tap **Connect**.
5. The TV switches to the launcher; the phone shows **Controlling your TV**.
6. Tap a direction once — focus moves one step. Hold it — focus repeats.
7. Move it far enough that focus wraps between sections, to confirm the launcher's own
   navigation rules are what is being driven.
8. Press the TV remote — navigation still works with the phone connected.
9. Background the phone mid-hold. The TV must not keep moving.
10. Close the phone app. `ReconnectBar` appears on the TV; the remote still works.
11. Reconnect with the same code. The launcher is still where it was.

## Known limitations

- **No BACK or OK action.** Only the four directions are mapped. The phone cannot open a
  game, close the settings panel, or dismiss the launcher; the physical remote is needed
  for those. Adding the actions is a protocol change, deliberately out of scope here.
- **One phone at a time.** The host accepts a single active socket.
- **Port conflict with the prototype.** `:connect-tv` also binds `8765`. Do not run both
  TV apps at once; the second to start fails to bind and reports it on the pairing screen.
- **Manual address entry.** No discovery, no QR pairing.
- **No pairing persistence.** The code is per process; the phone must re-enter it after
  the TV app is killed.
- **Not authentication.** The six-digit code is a pairing gate for a trusted LAN. It is
  not a credential. Anyone on the LAN who learns the code can drive the launcher.
- **Foreground-visible only.** The pairing screen must be on screen when pairing. The
  server runs while the activity's ViewModel lives.
- **Cleartext traffic.** The transport is `ws://` over the LAN, permitted by
  `android:usesCleartextTraffic="true"` on the phone module.
- **No hold semantics in the launcher.** Repeats are just repeated one-step moves.
- **Android 16 local network permission.** Not yet requested; see
  `CONNECT_PROTOTYPE.md`. If the TV or phone runs a build that enforces it, the socket
  will fail until it is added.
