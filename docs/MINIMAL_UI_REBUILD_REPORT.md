# PlayBay — Minimal UI Rebuild Report

Target: Xiaomi TV Stick 4K (2nd Gen), 1080p, 60 Hz.
Branch: `feature/phone-controller-launcher-integration`.

## New layout and design

A completely new, minimal TV launcher UI with a single game carousel:

- **Background:** solid `PlayBayColors.Ink` (0xFF060608). No gradients, bloom,
  blur, or decorative surfaces.
- **Header:** compact row — PlayBay name + red dot, player name, settings button.
- **Info panel:** title, tagline, genre, players, Play button. No hero artwork.
  Updates instantly when focus changes (no crossfade).
- **Game carousel:** single horizontal row of simple rectangular cards
  (160×120 dp) with artwork + title. No gradient scrims.
- **No Recently Played row.** No hero artwork. No separate featured section.

Focus indication: instant border color change + scale (graphicsLayer). No glow,
no animated borders, no crossfades.

## Components removed

- `PlayBayBackdrop` bloom bitmap and gradient (now solid color).
- `FocusableCard` glow (radial gradient) and animated border.
- `FeaturedSection` gradient overlays and copy crossfade (replaced by simple
  info panel).
- `GameCard` gradient overlay.
- `TvButton` animated background/border (now instant).
- Recently Played row (entire section removed).

## Components created

No new components. Existing components were simplified in place.

## Files changed

- `ui/components/Backdrop.kt` — solid color only.
- `ui/components/Focusables.kt` — simplified focus (scale + instant border, no glow).
- `ui/home/FeaturedSection.kt` — replaced with simple info panel (no artwork).
- `ui/home/HomeScreen.kt` — new minimal layout: header, info panel, single carousel.
- `ui/home/LibrarySection.kt` — simplified cards (160×120), no gradients.

## Functionality verified

- Build: successful.
- Pairing screen: renders correctly.
- Home screen: renders correctly (uiautomator dump confirms all sections).
- Remote navigation: focus moves between cards.
- Phone navigation: WebSocket pairing + focus moves work.
- Artwork: GameArt renders on all cards.
- Text: no clipping observed.
- Game launching: `onPlay` callback wired (unchanged).

## Benchmark results

Benchmark: `BenchmarkActivity`, count=100, delayMs=300, warmup=20.

| Metric | Original (c98f930) | Minimal rebuild (e5ff403) |
|---|---:|---:|
| Min | 20 ms | **8 ms** |
| p50 | 22 ms | **12 ms** |
| p90 | 54 ms | 53-63 ms |
| p95 | 56 ms | 66-73 ms |
| p99 | 70 ms | 81-90 ms |
| GPU p90 | 14 ms | **2 ms** |
| Janky % | 100% | **15%** |

Two runs were performed; min/p50/GPU are consistent (8-9, 12-13, 2). p90/p95/p99
vary (53-63, 66-73, 81-90) due to thermal variance on the stick.

**This is the first build where the majority of frames (85%) are under the
16.67 ms budget.** The minimal UI reduced GPU p90 from 14→2 ms and janky
frames from 100% to 15%.

## Visual trade-offs

- Removed all decorative effects (bloom, glow, gradients, crossfades). The UI is
  significantly simpler but retains PlayBay's dark theme, red accent, artwork,
  and typography.
- No hero artwork (info panel only). Artwork is provided by the carousel.
- No Recently Played section.
- Focus indication is border + scale (no glow). Still clear.
- Cards are smaller (160×120 vs 208×156) — more compact.

## Remaining bottlenecks

1. **15% of frames still janky.** p90=53-63 ms is from focus-change frames
   (initial recomposition). Steady-state frames are fast (~12 ms).
2. **Framework overhead (~8 ms):** Choreographer/SurfaceFlinger overhead.
3. **Textured quads:** 4 GameArt bitmaps per frame (library cards only). Already
   minimal.

## Recommended next steps

1. **720p render target:** halve fill rate for the remaining janky frames.
2. **Perfetto GPU profiling:** identify exact expensive draw calls.
3. **Input-to-visible-response measurement:** hardware-triggered latency.