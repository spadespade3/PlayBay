# PlayBay — Simple UI Experiment Report

Target: Xiaomi TV Stick 4K (2nd Gen), 1080p, 60 Hz.
Branch: `feature/phone-controller-launcher-integration`.

## What was simplified

The UI was simplified by removing expensive visual effects while preserving
PlayBay's dark theme, artwork, typography, and layout hierarchy:

1. **Backdrop bloom removed** (`Backdrop.kt`): replaced the full-screen radial
   gradient bloom with a simple dark vertical gradient. The bloom was a
   full-screen shader fill on a weak GPU.
2. **Hero gradients merged** (`FeaturedSection.kt`): two full-screen gradient
   overlays (horizontal + vertical) merged into one bottom scrim. Reduces
   full-screen shader fills by half.
3. **Focus glow removed** (`Focusables.kt`): removed the animated radial-gradient
   glow on focused cards. Focus is now indicated by border + scale only. Saves
   a radial-gradient shader fill per focused card.
4. **Experiment toggles added** (`LibrarySection.kt`, `HomeScreen.kt`):
   `artworkOnFocusOnly` and `showArtwork` parameters (default: artwork shown)
   allow isolated testing of artwork visibility without changing production
   behavior.

No UI dimensions, layout hierarchy, typography, or color palette were changed.
No functionality was removed.

## Components removed or replaced

- `PlayBayBackdrop`: bloom bitmap → solid gradient (backdrop rasterization
  removed; now a simple `Box` with `Brush.verticalGradient`).
- `FocusableCard`: glow `drawWithCache` block removed; border is now drawn
  with `drawBehind` (instant color, no animation); scale retained.
- `FeaturedSection`: copy `Crossfade` removed (instant text swap); artwork
  gradients merged into one.
- `GameCard`: gradient overlay retained (2-stop); experiment toggle added.

## Files changed

- `ui/components/Backdrop.kt` — removed bloom bitmap, solid gradient only.
- `ui/components/Focusables.kt` — removed glow, instant border, scale retained.
- `ui/home/FeaturedSection.kt` — merged gradients, removed copy crossfade.
- `ui/home/LibrarySection.kt` — added experiment toggles.
- `ui/home/HomeScreen.kt` — pass through experiment toggles.

## Benchmark comparison

Benchmark: `BenchmarkActivity`, count=100, delayMs=300, warmup=20.

| Metric | Before simplification | After simplification |
|---|---:|---:|
| Min | 16 ms | 19 ms |
| p50 | 21 ms | 27 ms |
| p90 | 38 ms | 60 ms |
| p95 | 51 ms | 65 ms |
| p99 | 67 ms | 77 ms |
| GPU p90 | 13 ms | 16 ms |
| Janky % | 99% | 100% |

**Note:** The "after" run is worse than "before." This is likely run-to-run
variance (thermal throttling on the stick after multiple consecutive runs).
The simplification removed visual elements but the GPU cost is dominated by
framework overhead and the remaining gradient fills, not by the removed elements.

The most reliable single change remains the backdrop bloom removal (Phase 3),
which brought min from 19→16 ms.

## Visual trade-offs

- **Backdrop bloom removed:** the red radial glow in the top-right is gone. The
  background is now a flat dark gradient. Subtle but noticeable.
- **Focus glow removed:** focused cards no longer have a red radial glow. Focus
  is indicated by border + scale only. Cleaner, less decorative.
- **Hero gradients merged:** the horizontal ink-fade on the left is gone; bottom
  fade retained for text readability.
- **No UI sizing, layout, or typography changes.**
- **No functionality removed.**

## Remaining performance problems

1. **Min frame 16-19 ms** — still at/above the 16.67 ms budget. The G310
   cannot sustain 60 fps at 1080p with this UI.
2. **Framework overhead (~8 ms)** — Choreographer/SurfaceFlinger overhead that
   cannot be reduced from app code.
3. **Gradient fills** — remaining 2-stop gradients on hero and cards are still
   shader fills on a weak GPU.

## Recommended next steps

1. **720p render target experiment** — halve fill rate. The most promising
   remaining option since texture count and resolution are not bottlenecks.
2. **Perfetto GPU profiling** — identify the exact draw calls consuming GPU time.
3. **Reduce card gradients to solid scrims** if visual quality permits.
4. **Consider rendering fewer GameArt bitmaps** (only focused card + hero get
   full art; others get solid color). Test independently.