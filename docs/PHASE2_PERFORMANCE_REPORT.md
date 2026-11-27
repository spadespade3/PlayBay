# PlayBay — Phase 2 Performance Report

Target: Xiaomi TV Stick 4K (2nd Gen), 1080p, 60 Hz.
Branch: `feature/phone-controller-launcher-integration`.

## 1. Benchmark implementation

A new debug-only activity `com.playbay.tv.bench.BenchmarkActivity` composes the
real `HomeScreen` (bypassing the pairing gate) and drives `count` consecutive
focus moves, collecting per-frame metrics via `android.view.FrameMetrics`.

**How to run:**
```
adb shell am start -n com.playbay.tv/.bench.BenchmarkActivity --ei count 100 --el delayMs 300 --ei warmup 20
adb logcat -s PlayBayBench
```
Parameters (intent extras):
- `warmup` (int, default 20) — warmup focus moves (discarded).
- `count` (int, default 100) — measured focus moves.
- `delayMs` (long, default 100) — delay between moves.

Each run logs:
```
FRAMES n=... min=... p50=... p90=... p95=... p99=... max=... janky(>16ms)=... (..%)
LAYOUT min=... p50=... p90=... p99=... max=...
DRAW   min=... p50=... p90=... p99=... max=...
GPU    min=... p50=... p90=... p99=... max=...
```

`TOTAL_DURATION` = full frame (vsync → presentation). `LAYOUT_MEASURE_DURATION`,
`DRAW_DURATION`, `GPU_DURATION` break down where the time goes.

**Note on the benchmark harness:** it drives `moveFocus` directly (no network),
so it measures the TV render path in isolation. This is more representative
than the earlier WebSocket harness, which produced only ~20 frames per run.

## 2. Measured bottlenecks (ranked by severity)

### Critical: GPU saturation (8–14 ms p90, 100% of frames janky)
FrameMetrics breakdown (500 ms delay run, 1455 frames):
- LAYOUT: p50=0 ms, p90=0 ms → layout is NOT the bottleneck.
- DRAW (CPU): p50=4 ms, p90=8 ms → CPU draw is modest.
- GPU: p50=10 ms, p90=14 ms, p99=31 ms → **GPU is the bottleneck.**
- TOTAL: p50=22 ms, p90=54 ms → total exceeds the 16.67 ms budget on every frame.

Even the fastest frame (min 20 ms) exceeds 16.67 ms. The G310 GPU cannot
render this UI at 60 fps. The gap between CPU draw (4 ms) and total (22 ms)
is GPU queue back-pressure: each frame waits for the previous frame's GPU work.

### High: per-frame gradient fills
The hero had two full-screen gradients (horizontal + vertical) and each card
had a 3-stop vertical gradient. Full-screen gradient fills are expensive on
the G310's fill rate.

### Medium: (already addressed) vector artwork redraws
Rasterized in the previous phase; now a cached `ImageBitmap` per (style, size).

### Medium: (already addressed) focus animations at composition scope
Moved `scale`/`border`/`glow` reads into `graphicsLayer`/`drawWithCache`.

### Low: HomeScreen-level recomposition
`HomeScreen` still recomposes on every `focusedId` change, but its children
now skip (verified by the flat LAYOUT metric — 0 ms). The remaining cost is
the draw/GPU pass, not composition.

## 3. Profiling findings

- **Composition:** not the bottleneck. LAYOUT_MEASURE_DURATION is ~0 ms on
  99% of frames. `@Immutable` + isolated rows successfully eliminated
  unnecessary layout work.
- **CPU draw:** 2–8 ms (p90). Acceptable.
- **GPU:** 8–14 ms (p90). This is where the budget is consumed.
- **Overdraw:** the hero had two full-screen gradient overlays on top of the
  artwork; each card had a gradient overlay. These are full-screen/card-sized
  shader fills on a weak GPU.
- **Input-to-render latency:** not separately measured (would require a
  hardware trigger or frame-timestamp correlation). The benchmark drives
  `moveFocus` directly, so network/remote latency is excluded by design.
  Remote and phone paths converge at `moveFocus`, so the render bottleneck
  affects both equally.

## 4. Files changed (this phase)

- `app/src/main/java/com/playbay/tv/bench/BenchmarkActivity.kt` (new) —
  FrameMetrics benchmark harness.
- `app/src/main/AndroidManifest.xml` — register `BenchmarkActivity`.
- `app/src/main/java/com/playbay/tv/ui/home/FeaturedSection.kt` — merged
  two full-screen gradient overlays into one.
- `app/src/main/java/com/playbay/tv/ui/home/LibrarySection.kt` — simplified
  card gradient (3 stops → 2).

## 5. Optimizations implemented and why

- **Merged hero gradients** (horizontal + vertical → single vertical): removes
  one full-screen shader fill per frame. Measured: GPU p90 14→12 ms, frame
  p90 54→39 ms (-28%).
- **Simplified card gradient** (3 stops → 2): minor fill-rate reduction.
- **Benchmark harness**: enables repeatable, statistically meaningful
  measurement (100+ frames, warmup, per-frame breakdown).

## 6. Before/after results (same benchmark: count=100, delayMs=300, warmup=20)

| Metric | Before (69c54ae) | After (ca507f8) |
|---|---:|---:|
| Frames | 1465 | 1474 |
| Min | 20 ms | 19 ms |
| p50 | 22 ms | 22 ms |
| p90 | 54 ms | 39 ms |
| p95 | 56 ms | 52 ms |
| p99 | 70 ms | 68 ms |
| Max | 92 ms | 85 ms |
| GPU p90 | 14 ms | 12 ms |
| Janky % | 100% | 100% |

Modest improvement. The GPU is still the bottleneck: min frame is 19–20 ms,
above the 16.67 ms budget, on every frame.

## 7. Remaining bottlenecks

1. **GPU fill rate.** The G310 cannot render this UI at 60 fps even with
   cached textures and reduced gradients. The per-frame GPU cost is 7–14 ms
   (p90), and the total frame is 19–22 ms (min). Further GPU reduction
   requires either:
   - Fewer textured quads (reduce card/recent artwork, or lower texture
     resolution).
   - Simpler shaders (remove remaining gradients, use solid scrims).
   - Rendering at a lower resolution and upscaling (significant change).
2. **Framework overhead (~8 ms).** Even with GPU at 7 ms and CPU draw at 2 ms,
   the total is 19 ms. The ~8 ms gap is Choreographer/SurfaceFlinger overhead
   on this device.
3. **No input-to-visible-response measurement.** The benchmark drives
   `moveFocus` directly, excluding network/remote latency. A hardware-triggered
   measurement would be needed for true input latency.

## 8. Recommended next steps

1. **Reduce GPU workload further:** try removing per-card GameArt on non-focused
   cards (show a solid color, swap to art only on focus) — measure if min drops
   below 16 ms. If yes, the texture count was the bottleneck.
2. **Consider 720p render target:** render the Compose tree at 1280×720 and
   let the display upscale. This halves fill rate. Trade-off: slight softness
   on a 4K TV. Measure first.
3. **Remove remaining gradients:** the recent-tile and any remaining overlays.
   Each full-screen/card-sized gradient is a shader fill.
4. **Add Macrobenchmark with `FrameTimingMetric`** for CI regression detection
   (the in-app harness is sufficient for investigation but not for CI).
5. **Profile with Perfetto GPU counters** to identify the exact draw calls
   consuming GPU time (requires `adb shell perfetto` with gpu counters).

**Bottom line:** PlayBay's remaining sluggishness is a **GPU fill-rate problem**
on the G310, not a Compose recomposition problem (layout is 0 ms). The CPU
side is already efficient. Further gains require reducing per-frame GPU work
(fewer quads, simpler shaders, or lower render resolution). The design can be
preserved while reducing GPU load, but the G310 may simply not sustain 60 fps
at 1080p with this many textured elements.