# PlayBay

A native Android TV home screen for PlayBay, a controller-first local gaming console.

## What is implemented

- Kotlin and Jetpack Compose, one landscape TV home screen.
- Featured game hero with artwork, genre, player count, and Play action.
- Library row with four placeholder games: PlayBay Demo, Arcade, Block World, and Racing.
- Recently played row, settings dialog, and controller-first focus handling.
- Original Canvas-drawn artwork and a custom dark red-and-white TV theme.

The UI is authored at 1280x720 dp and rescaled for the display. All game art is local and generated in Compose; there are no web views or remote assets.

## Build

Requirements: JDK 17 or newer and the Android SDK with API 37 installed.

```sh
./gradlew :app:assembleDebug
```

The debug APK is written to `app/build/outputs/apk/debug/app-debug.apk`.

Install on a connected device or emulator:

```sh
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Controls

- D-pad: move focus.
- Enter or D-pad center: activate the focused item.
- Back: close settings or leave the app.

The Play action and game tiles currently show a placeholder message. They do not start a game.

## Phone controller

The TV app hosts a LAN WebSocket pairing gate and accepts directional input from the
PlayBay Connect phone app (`:connect-mobile`), which is normalized into the same focus
navigation the remote uses. Physical remotes and gamepads keep working either way.

See [`docs/PHONE_CONTROLLER.md`](docs/PHONE_CONTROLLER.md) for the protocol, pairing flow,
input architecture, and known limitations.

## Scope

This repository contains the home-screen slice only. Game execution, player accounts,
networking, and multiplayer are not implemented. Pairing and the phone controller exist
on `feature/phone-controller-launcher-integration`; `main` does not have them yet.

## Status

Verified on an API 37 phone emulator configured to landscape 1920x1080. Android TV hardware, a real leanback launcher, release signing, and automated tests are not yet in place. The project uses compileSdk and targetSdk 37 with minSdk 26.
