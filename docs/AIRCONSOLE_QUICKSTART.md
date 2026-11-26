# AirConsole Integration Research (Quick Start)

Source: https://developers.airconsole.com/quick-start  
Reviewed: 2026-11-26

## What AirConsole is

AirConsole uses a browser-based **screen** and browser-based **phone controllers**. The two sides load the AirConsole JavaScript API and exchange messages. A game is hosted so both the screen and controller pages can be reached by the devices.

The Quick Start's minimal structure is:

- `screen.html`: game display
- `controller.html`: controller UI on a phone
- Include the AirConsole JavaScript API on both pages.
- Create an AirConsole instance on each side and exchange messages.
- Host the pages and open the screen through AirConsole's URL flow; phones join using the displayed pairing code.

## API concepts from the quick start

- The controller can send a message addressed to the screen.
- The screen's message handler receives a sender device ID and payload.
- The screen can reply to that sender, and the controller can listen for incoming messages.
- Do **not** assume controller device IDs are sequential (1, 2, 3, ...). Use the device/state documentation to understand IDs and connection state.

## Development/testing

- Serve the screen and controller pages from a local web server accessible to both devices.
- AirConsole's simulator can show a screen and two controller views together. The Quick Start describes appending `/simulator` to the AirConsole URL flow.
- HTTPS/mixed-content issues may require the AirConsole tunneling guidance.
- The Quick Start links to the API reference and Pong walkthrough as next steps.

## Relevance to PlayBay

AirConsole is a **possible phone-controller transport/prototype**, not the whole PlayBay controller system and not a replacement for native Android input APIs.

Keep the game-facing input model independent of its transport:

```
Controller source → adapter → normalized PlayBay input → game
```

Potential adapters:
- Android TV remote / keyboard events
- Bluetooth gamepads handled natively by Android
- AirConsole phone controller (if we choose to use its web-based flow)
- A future PlayBay mobile controller app

Games should consume normalized actions/axes rather than depend directly on AirConsole-specific messages. This keeps us free to swap transport or support multiple controller types.

## Open questions / follow-up

- Review AirConsole API reference, device/state lifecycle, disconnect handling, message format, and controller UI capabilities.
- Decide whether AirConsole is used directly, as a prototype/reference, or whether PlayBay builds its own phone-to-TV connection.
- Define a stable input schema and controller pairing/session lifecycle before game-specific controller layouts are implemented.
- Validate the integration on actual Android TV hardware and phones; this quick-start research is not implementation or testing.

## Reference

- [AirConsole Developer Quick Start](https://developers.airconsole.com/quick-start)
