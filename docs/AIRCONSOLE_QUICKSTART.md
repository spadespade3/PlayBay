# AirConsole Integration Research

**Reviewed:** 2026-11-26  
**Status:** Documentation research only — no runtime integration implemented.

## Source documentation

AirConsole's developer docs are split across linked chapters/pages, all reachable from the developer documentation site:

- [Quick Start](https://developers.airconsole.com/quick-start)
- [JavaScript API reference](https://airconsole.github.io/airconsole-api/)
- [Device IDs and state](https://developers2.airconsole.com/device-ids-and-state)
- [Pong walkthrough](https://developers2.airconsole.com/pong-example)
- [Testing with your phone](https://developers2.airconsole.com/testing-with-your-phone)
- [Tunneling guide](https://developers2.airconsole.com/tunneling)

## 1. AirConsole's actual model

AirConsole is a browser-based screen + browser-based phone-controller platform:

- `screen.html` runs on the large display.
- `controller.html` runs on each phone.
- Both include the AirConsole JavaScript API.
- The screen is opened through AirConsole's URL flow; phones join with the displayed code.
- A local web server can host both files during development.

Quick Start currently shows API script version `airconsole-1.11.0.js`. The older Pong walkthrough uses 1.7.0; use the current Quick Start/API reference rather than copying the old version blindly.

**Important for PlayBay:** our current product is a native Kotlin/Jetpack Compose Android TV app. AirConsole's documented API is a JavaScript API intended for browser-hosted screen/controller pages. It is not a drop-in Android/Kotlin SDK. Using it inside PlayBay would require a browser/WebView-based AirConsole game surface and the AirConsole hosting/session flow. That is a significant product/architecture choice, not just adding a dependency.

## 2. Core messaging API

Create an instance on both sides:

```js
const airconsole = new AirConsole();
```

Controller sends a serializable payload to the screen:

```js
airconsole.message(AirConsole.SCREEN, {
  type: "input",
  button: "jump",
  pressed: true
});
```

Screen receives it:

```js
airconsole.onMessage = (deviceId, data) => {
  // Validate the payload and map it to game input.
};
```

The screen can reply to one controller using `airconsole.message(deviceId, payload)`; `broadcast(data)` sends to all connected devices. The API's `onMessage(device_id, data)` callback receives the sender ID and serializable payload.

Do not blindly trust arbitrary payloads. Validate message type, allowed button/action names, numeric ranges, and controller ownership before forwarding input to a game.

## 3. Connection lifecycle and device IDs

Relevant callbacks and methods:

- `onReady(code)`: game console is ready; provides the join code. It also triggers connection/state callbacks for devices already present.
- `onConnect(device_id)`: a device connected and loaded the game.
- `onDisconnect(device_id)`: a device left the game.
- `onDeviceStateChange(device_id, user_data)`: broad device-state callback; `user_data` is undefined if the device left.
- `getControllerDeviceIds()`: currently connected controllers that loaded the game.
- `getDeviceId()`: this device's ID.

**Never hardcode controller IDs.** Screen is ID 0 / `AirConsole.SCREEN`, but controller IDs are not guaranteed to start at 1 or be consecutive. Within a session, a device retains its ID after reconnecting, and IDs are reserved for that device during that session.

For player slots, use the screen-side active-player helpers:

- `setActivePlayers(maxPlayers)`
- `getActivePlayerDeviceIds()`
- `convertPlayerNumberToDeviceId(playerNumber)`
- `convertDeviceIdToPlayerNumber(deviceId)`
- `onActivePlayersChange(playerNumber)`

Player numbers are zero-based and consecutive; device IDs are not. The screen can call `setActivePlayers()` when a round begins, and `setActivePlayers(0)` when the round ends. The Pong example also demonstrates clearing active players after a participating controller disconnects.

## 4. Persistent device state

Custom state is useful for controller UI and late joiners:

- `setCustomDeviceState(object)` replaces this device's custom state.
- `setCustomDeviceStateProperty(key, value)` updates one property.
- `getCustomDeviceState(deviceId)` reads another device's custom state.
- `onCustomDeviceStateChange(deviceId, customData)` notifies other devices when it changes.

Unlike transient messages, custom device state is available to devices that join later. Example use: a phone sets its selected controller layout or player color, and the screen can read it.

The API also has `getNickname()`, `getProfilePicture()`, and `getUID()` helpers. Treat profile identity as optional; the controller system should still work without login/profile data.

## 5. Motion, vibration, and phone capabilities

The constructor accepts a `device_motion` interval in milliseconds. With it enabled, controller devices receive `onDeviceMotion(data)` with accelerometer fields `x/y/z` and gyroscope fields `alpha/beta/gamma`.

- Motion callback is controller-only.
- The docs note browser iframe restrictions for direct sensor access; AirConsole's callback is the intended route for its environment.
- `vibrate(options)` is controller-only; supports a duration or vibration pattern (with platform-specific behavior).
- `setOrientation(AirConsole.ORIENTATION_PORTRAIT | LANDSCAPE)` can request phone orientation.
- `getUserMedia({ audio: true })` requests microphone access on controllers only; it does not support video. Stop media tracks when finished.

Motion should be opt-in per game, not always enabled. Normalize sensor data and provide calibration/dead-zone handling in a game-specific layer.

## 6. Constructor configuration and lifecycle cleanup

The API reference lists these constructor options:

- `orientation`: portrait or landscape.
- `synchronize_time`: enables `getServerTime()` after `onReady`.
- `setup_document`: controls document setup (default true).
- `device_motion`: callback interval in milliseconds.
- `translation`: load a translation file.
- `silence_inactive_players`: can prevent new devices joining as active players during a round; default behavior is documented as enabled unless the game uses an automatically upgrading API version.

Call `destroy()` when an AirConsole instance is no longer needed in a single-page app; it releases resources/listeners and pending media timeout state.

## 7. Testing and development flow

Quick Start's local flow:

1. Serve the game directory with a local web server.
2. Make both `/screen.html` and `/controller.html` accessible to devices on the network.
3. Open the screen using the AirConsole URL flow (the base game URL, not a URL ending in `screen.html`).
4. Join from a phone using the code shown on screen.
5. Use the simulator route (append `/simulator`) to view a screen and two controller views during development.
6. If HTTPS/mixed-content rules block local HTTP content, follow the official tunneling guide.

The Pong walkthrough demonstrates the full message loop, player assignment, and disconnect handling. Use it as a learning/reference sample, not as PlayBay production architecture.

## 8. What this means for PlayBay

Keep two concerns separate:

### A. PlayBay's native input system

The Android TV app should own a normalized input model for native controllers:

- Android TV remote / keyboard key events
- Bluetooth HID gamepads through Android's native input APIs
- Future supported controller sources

Games should consume stable PlayBay actions/axes and connection/player events, not device-specific Android key codes.

### B. Phone-controller transport

AirConsole could be one phone-controller option, but its official flow assumes browser-hosted AirConsole screen/controller pages and AirConsole session/pairing. It should be treated as an optional adapter/prototype until we decide whether the product should depend on AirConsole's platform.

A future PlayBay mobile app could instead use a PlayBay-owned pairing and transport protocol. That would be a separate implementation and should not be assumed to be compatible with AirConsole.

## 9. Proposed normalized input contract (design proposal, not implemented)

A transport-neutral event shape could look like:

```json
{
  "source": "airconsole",
  "deviceId": "session-device-id",
  "playerIndex": 0,
  "sequence": 42,
  "timestampMs": 123456789,
  "type": "button",
  "control": "jump",
  "value": 1
}
```

Suggested event families:

- Button: pressed/released (or normalized 0/1).
- Axis: normalized -1.0 to +1.0.
- Motion: normalized sensor values, only when a game requests it.
- Lifecycle: connected, disconnected, assigned, unassigned.
- Haptics: game requests feedback; adapter decides whether source supports it.

The schema above is our proposal, not an AirConsole-defined message format. AirConsole's `device_id` is session-scoped and must not be treated as a permanent PlayBay hardware identifier. The adapter should map it to an internal connection/session identity.

## 10. Security, reliability, and product caveats

- Validate every incoming message before dispatch.
- Do not treat a controller's claimed player index as authoritative; the screen/session manager owns assignment.
- Handle late joins, disconnects, reconnects, and stale input.
- Clear held buttons/axes when a controller disconnects to avoid stuck input.
- Avoid sending high-frequency sensor streams unless needed; rate-limit/coalesce continuous input.
- AirConsole persistent data and high scores are documented as public/not secure and should not store secrets or sensitive information.
- AirConsole is not the native Bluetooth gamepad API. Xbox/PlayStation/Bluetooth support in PlayBay must be implemented and tested separately through Android input handling.

## 11. Decisions still required

1. Is AirConsole an optional supported platform, a prototype, or only a reference for our own controller app?
2. Does PlayBay launch web-based games through a browser surface, or remain a native game launcher?
3. What is the first supported phone-to-TV transport if we own pairing?
4. What input capabilities must the first normalized API support (buttons/axes first; motion/haptics later)?
5. What are our initial player-count and reconnect policies?

## References

- [AirConsole Quick Start](https://developers.airconsole.com/quick-start)
- [AirConsole JavaScript API reference](https://airconsole.github.io/airconsole-api/)
- [Device IDs and state guide](https://developers2.airconsole.com/device-ids-and-state)
- [Pong walkthrough](https://developers2.airconsole.com/pong-example)
- [Testing with your phone](https://developers2.airconsole.com/testing-with-your-phone)
- [Tunneling guide](https://developers2.airconsole.com/tunneling)
