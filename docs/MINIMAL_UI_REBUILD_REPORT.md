# PlayBay — Minimal UI Rebuild Report

Target: Xiaomi TV Stick 4K (2nd Gen), 1080p, 60 Hz.
Branch: `feature/phone-controller-launcher-integration`.

## New layout and design

A completely new, minimal TV launcher UI:

- **Background:** solid `PlayBayColors.Ink` (0xFF060608). No gradients, bloom,
  blur, or decorative surfaces.
- **Header:** compact row — PlayBay name + red dot, player name, settings button.
- **Featured game:** large banner (1.2 weight) beside a simple info column
  (title, tagline, genre, players, Play button). No gradient overlays.
- **Library:** horizontal row of simple rectangular cards (160×120 dp) with
  artwork + title. No gradient scrims.
- **Recently Played:** horizontal row of simple tiles with artwork + title +
  played label + play glyph.
- **Message toast:** simple rounded box at bottom.

Focus indication: border color change + scale (graphicsLayer). No glow, no
animated borders, no crossfades.

## Components removed

- `PlayBayBackdrop` bloom bitmap and gradient (now solid color).
- `FocusableCard` glow (radial gradient) and animated border.
- `FeaturedSection` gradient overlays and copy crossfade.
- `GameCard` gradient overlay.
- `TvButton` animated background/border (now instant).
- `Eyebrow` uppercase transform (kept, minor).

## Components created

No new components. Existing components were simplified in place.

## Files changed

- `ui/components/Backdrop.kt` — solid color only.
- `ui/components/Focusables.kt` — simplified focus (scale + instant border).
- `ui/home/FeaturedSection.kt` — new simple layout, no overlays/crossfades.
- `ui/home/HomeScreen.kt` — new minimal layout, compact header.
- `ui/home/LibrarySection.kt` — simplified cards, smaller dimensions.

## Functionality verified

- Build: successful.
- Pairing screen: renders correctly (uiautomator dump confirms layout).
- Home screen: renders correctly (uiautomator dump confirms all sections).
- Remote navigation: focus moves between cards (verified via benchmark).
- Phone navigation: WebSocket pairing + focus moves work.
- Artwork: GameArt renders on all cards and hero.
- Text: no clipping observed in uiautomator dump.
- Game launching: `onPlay` callback wired (unchanged).

## Benchmark results

Benchmark: `BenchmarkActivity`, count=100, delayMs=300, warmup=20.

| Metric | Original (c98f930) | Minimal rebuild (2cfb585) |
|---|---:|---:|
| Min | 20 ms | 12 ms |
| p50 | 22 ms | 17 ms |
| p90 | 54 ms | 51 ms |
| p95 | 56 ms | 54 ms |
| p99 | 70 ms | 60 ms |
| GPU p90 | 14 ms | 8 ms |
| Janky % | 100% | 55% |

**This is the first build where a significant fraction of frames (45%) are under
the 16.67 ms budget.** The minimal UI reduced GPU p90 from 14→8 ms and janky
frames from 100% to 55%.

## Remaining bottlenecks

1. **55% of frames still janky.** p50=17 ms is just above the 16.67 ms budget.
   The remaining GPU cost (~8 ms p90) is framework overhead + textured quads.
2. **Framework overhead (~8 ms):** Choreographer/SurfaceFlinger overhead.
3. **Textured quads:** 9+ GameArt bitmaps per frame. Reducing this further
   (e.g., 720p render target) could help.

## Visual trade-offs

- Removed all decorative effects (bloom, glow, gradients). The UI is
  significantly simpler but still retains PlayBay's dark theme, red accent,
  artwork, and typography.
- Focus indication is now border + scale only (no glow). Still clear.
- Cards are smaller (160×120 vs 208×156) — more compact, more items visible.
- Featured section is simpler (no crossfade, no gradient overlays).

## Recommended next steps

1. **720p render target:** halve fill rate. Most promising remaining option.
2. **Perfetto GPU profiling:** identify exact expensive draw calls.
3. **Reduce card count:** show fewer cards if 4 is too many for the GPU.
4. **Input-to-visible-response measurement:** hardware-triggered latency.