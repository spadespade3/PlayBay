# PlayBay — Phase 4: Texture Optimization Report

Target: Xiaomi TV Stick 4K (2nd Gen), 1080p, 60 Hz.
Branch: `feature/phone-controller-launcher-integration`.

## 1. Experiments performed

### Experiment A — Unfocused card artwork (placeholder instead of GameArt)

**Implementation:** Added `artworkOnFocusOnly: Boolean = false` to `LibraryRow`/`GameCard`.
When true, unfocused cards render a solid `InkSoft` background instead of their
`GameArt` bitmap; artwork appears when the card receives focus.

**Benchmark (count=100, delayMs=300, warmup=20):**

| Metric | Baseline (artwork always) | Experiment A (placeholder) |
|---|---:|---:|
| Min | 16 ms | 17 ms |
| p50 | 21 ms | 21 ms |
| p90 | 38 ms | 37 ms |
| p95 | 51 ms | 54 ms |
| p99 | 67 ms | 73 ms |
| GPU p90 | 13 ms | 13 ms |

**Result:** Negligible improvement (p90 38→37 ms, but p95/p99 worsened). GPU p90
unchanged. The number of textured quads is NOT the bottleneck.

**Decision:** Reverted (default `artworkOnFocusOnly = false`). Parameter retained
as an experiment toggle.

**Visual impact:** Would remove artwork from 3 of 4 cards at rest — noticeable
regression in the immersive, artwork-focused design. Not justified by the
negligible performance gain.

### Experiment B — Recent-game artwork removal

**Implementation:** Added `showArtwork: Boolean = true` to `RecentRow`/`RecentTile`.
When false, recent tiles render without their GameArt bitmap.

**Benchmark (count=100, delayMs=300, warmup=20):**

| Metric | Baseline | Experiment B (no recent art) |
|---|---:|---:|
| Min | 16 ms | 16 ms |
| p50 | 21 ms | 21 ms |
| p90 | 38 ms | 37 ms |
| p95 | 51 ms | 47 ms |
| p99 | 67 ms | 67 ms |
| GPU p90 | 13 ms | 13 ms |

**Result:** Negligible improvement. The 3 small recent tiles (58×36 dp) contribute
minimal GPU work.

**Decision:** Reverted (default `showArtwork = true`). Parameter retained as
an experiment toggle.

### Experiment C — Texture visibility and caching investigation

Findings:
- **Cached textures:** GameArt bitmaps are cached in a shared LRU (24 MB budget)
  keyed by (style, width, height). No repeated decoding during navigation.
  Cache hit rate is effectively 100% after warmup.
- **Off-screen content:** LazyRow virtualizes; only visible cards draw. No
  off-screen artwork rendering.
- **Duplicate draws:** each GameArt instance draws its own cached bitmap. The
  hero and library cards use different sizes, so no sharing occurs (different
  cache keys). No duplicate texture uploads.
- **Texture memory pressure:** 24 MB budget is well within the 2 GB device RAM.
  No eviction occurs during normal navigation.
- **Texture resolution:** Phase 3 showed 50% resolution made GPU p90 worse
  (12→14 ms). Resolution is not the bottleneck.

**Conclusion:** Texture count and caching are not significant contributors to
GPU frame time. The G310's fill rate is consumed by gradient fills and
full-screen surfaces, not by textured quads.

## 2. Measured results summary

| Experiment | Min | p50 | p90 | p95 | p99 | GPU p90 | Verdict |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline (Phase 3) | 16 | 21 | 38 | 51 | 67 | 13 | — |
| A (unfocused cards) | 17 | 21 | 37 | 54 | 73 | 13 | Revert |
| B (no recent art) | 16 | 21 | 37 | 47 | 67 | 13 | Revert |

Neither experiment produced a meaningful improvement.

## 3. Texture rendering findings

- Textured quads are NOT the bottleneck. Removing 4 library card artworks
  (Experiment A) did not reduce GPU p90 (13 ms unchanged).
- The G310's GPU time is consumed by gradient fills and full-screen surfaces,
  not by texture sampling.
- Phase 3's gradient reduction (p90 54→39 ms) was the most effective GPU
  optimization so far.
- The remaining GPU cost (~9-13 ms p90) comes from the backdrop (now removed),
  card gradients (2-stop, retained), and framework overhead.

## 4. Changes retained or reverted

**Retained:**
- All Phase 1-3 optimizations.
- Experiment toggle parameters (`artworkOnFocusOnly`, `showArtwork`) with
  defaults preserving the original design.

**Reverted (default behavior unchanged):**
- Experiment A: `artworkOnFocusOnly = false` (default).
- Experiment B: `showArtwork = true` (default).

No production behavior changed in this phase.

## 5. Remaining bottlenecks

1. **GPU fill rate (9-13 ms p90):** The G310 cannot render this UI at 60 fps
   at 1080p. The remaining cost is gradient fills and framework overhead.
2. **Framework overhead (~8 ms):** Choreographer/SurfaceFlinger overhead that
   cannot be reduced from app code.
3. **Minimum frame 16 ms:** Still at/above the 16.67 ms budget.

## 6. Whether a 720p experiment is now justified

**Yes.** Phase 4 has ruled out texture count and resolution as bottlenecks.
The remaining GPU cost is fill-rate (gradients + full-screen surfaces), which
scales directly with pixel count. A 720p internal render target would halve
the fill rate and is the most promising remaining option.

Recommendation: implement the 720p experiment as a controlled, reversible
change (render the Compose tree at 1280×720, let the display upscale) and
measure with the same benchmark. Compare visual quality on the actual TV before
deciding. If the improvement is significant and quality is acceptable, retain
it. If marginal or quality suffers, reject it.