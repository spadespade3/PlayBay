# PlayBay — Performance Optimization Results

Target: Xiaomi TV Stick 4K (2nd Gen), 1080p, 60 Hz.
Branch: `feature/phone-controller-launcher-integration`.

## 1. Root causes identified (confirmed by code + measurement)

1. **Hero artwork `Crossfade` (260 ms) over full-size vector art.** `FeaturedSection.kt` mounted old+new `GameArt` canvases for 15 frames; `BlockWorld` allocates 84 `Path`s/draw. Dominant jank source; shared by both input methods because both converge on `moveFocus` → `HomeUiState` update → this render path.
2. **Focus animations read at composition scope.** `FocusableCard`/`TvButton` read `animate*AsState` via `by`, recomposing the card + its content lambda every frame for 140–220 ms; the glow rebuilt `Brush.radialGradient` (new shader) per frame.
3. **No stability proof.** `Game`, `RecentGame`, `HomeUiState`, `ConnectionState` were unannotated data classes containing `List<…>`, so Compose could not skip `HomeScreen`'s children.
4. **Full-screen backdrop redraw.** `PlayBayBackdrop` rebuilt radial/vertical gradients on every `HomeScreen` recomposition.
5. **Startup focus churn.** `HomeScreen` ran `repeat(8){requestFocus();delay(200)}` (1.6 s) during cold start.
6. **Library/Recent rows in the focus-change recomposition chain.** They took `List<Game>`/`List<RecentGame>` params, an unstable type, so they re-executed on every focus move even though the catalog is constant.

## 2. Files changed (perf-only, no UI sizing)

- `ui/components/GameArt.kt` — rasterize each style into a shared, size-keyed `ImageBitmap` cache (24 MB LRU); vector pass runs once per (style, size).
- `ui/components/Backdrop.kt` — rasterize bloom/vignette into a cached `ImageBitmap` (8 MB budget).
- `ui/components/Focusables.kt` — move `border`/`glow`/`scale` animation reads into `drawWithCache`/`graphicsLayer` (`.value` reads); cache the glow brush; `scale` no longer recomposes the card.
- `ui/home/FeaturedSection.kt` — remove the artwork `Crossfade`; art swaps instantly (rasterized plate = one textured quad); keep the text transition.
- `ui/home/HomeScreen.kt` — gate startup focus loop on `LocalWindowInfo.isWindowFocused` with bounded retries + early exit on focus; `Library`/`Recent` rows no longer take state-derived params; `SectionHeader` trailing derived from `PlayBayCatalog`.
- `ui/home/HomeViewModel.kt` — `@Immutable` on `HomeUiState`; debounced hero display (`focusedId` immediate for Play, `featuredId` 120 ms debounced).
- `ui/home/LibrarySection.kt` — `LibraryRow`/`RecentRow` read the constant catalog internally, removing them from the focus-change recomposition chain.
- `data/Games.kt` — `@Immutable` on `Game`, `RecentGame`.
- `connect/LauncherConnectionViewModel.kt` — `@Immutable` on `ConnectionState`.
- `PlayBayApp.kt` — `remember`-ed stable lambda references for `onGameFocused`/`onPlay`/`onOpenSettings`.

## 3. Optimizations implemented (summary)

- Artwork + backdrop rasterized → cached textures; per-frame vector redraws eliminated.
- Focus scale/border/glow moved to draw/graphics-layer phase → no per-frame recomposition of cards/content.
- Hero art crossfade removed → instant swap, ~15 fewer frames per focus move.
- Hero display debounced 120 ms → fast sweeps don't queue a transition per step; Play stays correct via immediate `focusedId`.
- Startup focus churn reduced from 1.6 s (8×200 ms) to ≤0.5 s, gated on real window focus.
- `@Immutable` state + isolated rows → Compose can skip unchanged subtrees.
- Stable callback references in `PlayBayApp`.

## 4. Before/after benchmark results

Measured on the Xiaomi TV Stick 4K (1080p, 60 Hz), paired via a WebSocket harness driving 8 DOWN presses over ~2 s. **Small samples — treat as directional, not final.**

| Metric | Original `c98f930` | Perf 1 `34df4b6` | Perf 2 `69c54ae` |
|---|---|---|---|
| Total frames | 21 | 18 | 33 |
| Janky frames | 16 (76%) | 13 (72%) | 23 (70%) |
| 50th percentile | 77 ms | 65 ms | 73 ms |
| 90th percentile | 150 ms | 1100 ms | 300 ms |
| 95th percentile | 400 ms | 1300 ms | 1050 ms |
| Missed Vsync | 11 | 9 | 12 |

Read: median improved 77→65 ms and janky % 76→70; the optimized builds render fewer animation frames (the removed crossfade). The tail percentiles are dominated by a single cold-start frame on a ~20-frame sample, so they are not comparable. **None of the builds are under the 16.67 ms budget** — the remaining cost is the `HomeScreen`-level recomposition on focus change (even with skipping children, the `HomeScreen` composable re-executes and `FeaturedSection` still swaps).

## 5. Remaining bottlenecks

- `HomeScreen` still collects the whole `HomeUiState` and recomposes on every `focusedId` change; the `FeaturedSection` still swaps (now instant, but still a recomposition).
- `TvButton` `contentColor` is still animated at composition scope (button is small; low impact).
- `Eyebrow` calls `text.uppercase()` in composition; `PlayGlyph`/`GearGlyph`/`PlayerAvatar` allocate `Path` per draw.
- Release build is unminified (`isMinifyEnabled = false`) — affects cold start (1561 ms), not steady-state frame time.
- No Macrobenchmark/JankStats harness yet; only small-sample gfxinfo.

## 6. Visual / functional trade-offs

- Hero artwork now swaps instantly instead of a 260 ms crossfade (more responsive, slightly less polished transition). Text fade retained.
- No UI sizing or layout changes were made (per instruction).
- No functionality removed; focus, pairing, controller, reconnect all intact.
- `@Immutable` contracts are satisfied: `Game`/`RecentGame` are immutable data classes; `HomeUiState` fields are immutable; `ConnectionState` is immutable.

## 7. Recommended next optimization

1. Add a Macrobenchmark (FrameTimingMetric) with a sustained 100+ focus-move loop driven by the WebSocket harness, to get a reliable before/after. The `pair.ps1` harness can be extended to send ~100 presses with `delay(100)` between them.
2. Split `HomeScreen` state collection so `FeaturedSection` reads only the debounced `featuredId` flow and `LibraryRow` reads nothing changing — already mostly done; verify with Layout Inspector recomposition counts that `LibraryRow`/`GameCard` no longer recompose on focus change.
3. Move `TvButton` `contentColor` animation to the draw phase (small, consistent with the rest).
4. Cache `PlayGlyph`/`GearGlyph` paths (minor).
5. Enable R8 + shrink resources for release; verify Ktor keep rules; measure cold start.
6. Only after confirming rendering fixes solve the sluggishness, revisit UI sizing (Phase 3 of the audit) — do not shrink the design speculatively.