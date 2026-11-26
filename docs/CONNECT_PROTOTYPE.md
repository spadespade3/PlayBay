# PlayBay Connect prototype

This prototype adds two independent Android applications without changing the existing PlayBay launcher:

- `:connect-tv`: Android TV host. Displays its local IPv4 address and a six-digit pairing code, then hosts a WebSocket endpoint on TCP port `8765`.
- `:connect-mobile`: Android phone client. The user enters the TV address and pairing code, connects, and sends the test message.

## First end-to-end test

1. Install and launch `connect-tv` on an Android TV device or TV emulator.
2. Put the TV and phone on the same Wi-Fi/LAN.
3. Note the IP address and six-digit code displayed by the TV.
4. Install and launch `connect-mobile` on the phone.
5. Enter the TV IP and pairing code, then tap **Connect**.
6. Tap **How are you?**.
7. The TV should display **Full of pixels!**.

## Build

```sh
./gradlew :connect-tv:assembleDebug
./gradlew :connect-mobile:assembleDebug
```

APKs:

- `connect-tv/build/outputs/apk/debug/connect-tv-debug.apk`
- `connect-mobile/build/outputs/apk/debug/connect-mobile-debug.apk`

## Message acknowledgement protocol

The phone and TV now use a small request/acknowledgement exchange over the existing WebSocket:

1. The phone sends `{"type":"HOW_ARE_YOU"}`.
2. The TV parses the message, updates its UI, and increments its received-message counter.
3. Only after that processing succeeds, the TV sends `{"type":"ACK","request":"HOW_ARE_YOU","count":N,"message":"Full of pixels!"}`.
4. The phone waits for that acknowledgement before reporting `TV received your message!`.

If the acknowledgement does not arrive within five seconds, or the connection fails, the phone reports the failure and clears the session.

## Deliberate prototype limitations

- Manual IP entry is used for the first test; automatic LAN discovery and QR pairing come later.
- The six-digit code is generated when the TV app process starts. It is a prototype pairing gate, not production-grade authentication.
- The host accepts one active test connection at a time.
- The protocol currently has one request message, `HOW_ARE_YOU`, plus its `ACK` response.
- The TV app must remain open while the phone is connected.
- This is a local-network prototype; it does not use a cloud service.

Before production use, add expiring one-time credentials, rate limiting, explicit TV approval, reconnect handling, protocol versioning, and Android-version-specific local-network permission handling.
