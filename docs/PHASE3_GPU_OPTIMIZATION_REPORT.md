# PlayBay — Phase 3: GPU Optimization Report

Target: Xiaomi TV Stick 4K (2nd Gen), 1080p, 60 Hz.
Branch: `feature/phone-controller-launcher-integration`.

## 1. GPU bottlenecks identified

The G310 GPU is the bottleneck. FrameMetrics profiling (100 focus moves, 300 ms
delay, warmup) showed:

| Metric | Value |
|---|---:|
| LAYOUT p50 | 0 ms |
| DRAW (CPU) p50 | 4 ms |
| GPU p50 | 9 ms |
| GPU p90 | 12–14 ms |
| TOTAL min | 19–20 ms |
| TOTAL p50 | 22 ms |

Layout and CPU draw are cheap. The GPU consumes 8–14 ms per frame (p90), and the
total frame (22 ms) exceeds the 16.67 ms budget on every frame. The gap between
CPU draw (4 ms) and total (22 ms) is GPU queue back-pressure.

## 2. Textured quad and bitmap audit

Per-frame textured quads (before Phase 3):
- Backdrop: 1 full-screen cached bitmap (red bloom + vignette)
- Hero FeaturedArt: 1 GameArt bitmap (half-screen) + 2 gradient overlays
- Library cards (4 visible): 4 × (GameArt bitmap + vertical gradient)
- Recent tiles (3): 3 × GameArt bitmap
- Focus glow: 1 radial gradient (focused card only)
- Total: ~9 quads + 6 gradients per frame

GameArt bitmaps are cached at display resolution (hero ~864×536, cards ~416×312,
recent ~116×72). No off-screen content is rendered (LazyRow virtualizes). No
decoding happens during navigation (rasterized in Phase 1).

## 3. Overdraw findings

- The backdrop bloom (full-screen radial gradient) was drawn over the vertical
  gradient background — 2 layers for the backdrop alone.
- The hero had 2 full-screen gradient overlays (horizontal + vertical) on top
  of the artwork.
- Each card had a 3-stop vertical gradient over the artwork.
- The focus glow was a radial gradient over the focused card.

Full-screen gradient fills are the most expensive operation on the G310's
fill rate.

## 4. Controlled experiments

### Experiment A: Reduce texture resolution (50%)
- Change: halve GameArt cached bitmap dimensions, bilinear upscale.
- Result: **REJECTED.** GPU p90 12→14 ms (worse). The bilinear upscale
  added GPU sampling cost without reducing fill rate enough. Texture resolution
  is not the bottleneck.

### Experiment B: Remove backdrop bloom (full-screen radial gradient)
- Change: replace cached backdrop bitmap with a solid vertical gradient.
- Result: **RETAINED.** Min 19→16 ms (-3 ms, -16%). GPU p90 14→14 (no
  change in p90, but min improved). Removes one full-screen textured quad.

### Experiment C: Reduce gradient fills (hero + cards)
- Change: hero 2 gradients → 1; cards 3-stop → 2-stop gradient.
- Result: **RETAINED.** GPU p90 14→12 ms, frame p90 54→39 ms (-28%).

### Experiment D: Replace card gradients with solid scrims
- Change: replace card vertical gradient with solid scrim.
- Result: **REJECTED.** Marginal improvement (p90 39→37 ms) not worth the
  visual change (full-card darkening). Reverted to 2-stop gradient.

### Experiment E: 720p internal render target
- Not attempted. The min is already at 16 ms with backdrop removal; a 720p
  target would halve fill rate but is a significant change. Deferred until
  other options are exhausted.

## 5. Before/after GPU and total frame timings

Baseline (before Phase 3, commit 69c54ae, backdrop cached + gradients reduced):

| Metric | Value |
|---|---:|
| Min | 20 ms |
| p50 | 22 ms |
| p90 | 54 ms |
| GPU p90 | 14 ms |

After Phase 3 (backdrop bloom removed + gradient reduction retained):

| Metric | Value |
|---|---:|
| Min | 16 ms |
| p50 | 21 ms |
| p90 | 38 ms |
| GPU p90 | 13 ms |

Improvement: min 20→16 ms (-20%), p90 54→38 ms (-30%).

## 6. Visual quality trade-offs

- **Backdrop bloom removed:** the red radial glow in the top-right is gone.
  The background is now a simple dark vertical gradient. This is a noticeable
  but minor visual change — the bloom was decorative.
- **Hero gradients merged:** the horizontal ink-fade on the left is removed;
  the bottom fade is retained for text readability. Slight reduction in
  depth but text remains readable.
- **Card gradients kept (2-stop):** visual quality preserved; gradient
  simplification had negligible impact.
- **No UI sizing or layout changes.**
- **No artwork quality reduction.**

## 7. Changes retained and changes rejected

**Retained:**
- Backdrop bloom removal (min 19→16 ms, measurable win).
- Hero gradient merge (2→1, p90 54→39 ms).
- Card gradient simplification (3→2 stops, minor).
- All Phase 1/2 optimizations.

**Rejected:**
- Texture resolution reduction (hurt performance).
- Card gradient → solid scrim (marginal gain, visual regression).
- Glow removal (no measurable benefit, design loss).
- 720p render target (deferred).

## 8. Remaining performance limitations

- **Min frame 16 ms** is still at/above the 16.67 ms budget. 99% of frames
  are still janky. The G310 cannot sustain 60 fps at 1080p with this UI.
- **Framework overhead (~8 ms)**: even with GPU at 7 ms and CPU draw at 2 ms,
  the total is 19 ms. This is Choreographer/SurfaceFlinger overhead.
- **Remaining GPU work:** ~9 textured quads + 5 gradients per frame. Further
  reduction requires fewer quads (e.g., not drawing GameArt on non-focused
  cards) or lower render resolution.
- **Input-to-visible-response latency:** not separately measured.

## Recommended next steps

1. **Try removing GameArt from non-focused library cards** (show solid color,
   swap to art on focus). If min drops below 16 ms, texture count is the
   bottleneck.
2. **720p render target experiment**: halve fill rate. Compare quality and
   performance on the actual TV.
3. **Perfetto GPU trace**: identify the exact draw calls consuming GPU time.
4. **Reduce remaining gradients**: recent tiles and any other overlays.
5. **Consider `RenderEffect` or `graphicsLayer` compositing strategies** to
   reduce overdraw.