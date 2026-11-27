# PlayBay — Red-Team Performance Audit

Target hardware: Xiaomi TV Stick 4K (2nd Gen), Amlogic S905X5M-K, 4× Cortex-A55, ARM G310 V2, 2 GB RAM, Google TV, 4K output.
Branch audited: `feature/phone-controller-launcher-integration` @ `976d36b`.
Scope: TV app `:app` (Compose launcher + Ktor pairing host) and `:connect-mobile` phone controller.

## A. Executive verdict

PlayBay's sluggishness is **not primarily a hardware problem**. AirConsole runs smoothly on the same stick, which proves the SoC can hit 60 fps. The bottleneck is PlayBay's **rendering and recomposition behavior on the TV side**, which both input methods share.

Ranked by severity:

1. **Critical — Focus change triggers two simultaneous 260 ms `Crossfade`s over full-size vector artwork.** `FeaturedSection.kt` wraps both the hero copy and the hero art in `Crossfade(targetState = game, animationSpec = tween(260))`. During the fade, *two* full-size `GameArt` canvases composite every frame. `BlockWorld` art allocates 28 `Path`s × 3 faces = 84 `Path` objects per draw; drawn twice per frame for 15 frames = ~2,500 path allocations per focus move, on a 4× A55. This is the dominant jank source and is the reason both remote and phone feel identical — both converge on `moveFocus` → `HomeUiState` update → this render path.

2. **Critical — Focus animations run in the composition phase.** `FocusableCard` (Focusables.kt) reads `animateColorAsState`/`animateFloatAsState` via `by` at composition scope, so every animation frame recomposes the entire card *and* its `content` lambda for 140–220 ms. The glow rebuilds `Brush.radialGradient` (a new shader) on every frame. Scale is correctly isolated in `graphicsLayer`, but border/glow are not.

3. **High — `HomeUiState` / `Game` are not marked `@Immutable`/`@Stable`.** Compose cannot prove stability of a data class containing `List<Game>`, so `HomeScreen` and its children cannot skip recomposition. Every `featuredId` change re-executes `LibraryRow`'s item content for all visible cards, re-running `GameCard`'s content lambda and re-drawing each `GameArt` canvas.

4. **High — Startup focus churn.** `HomeScreen` runs `repeat(8) { requestFocus(); delay(200) }` = 1.6 s of repeated focus requests during launch, on top of the window-focus handoff. SettingsPanel repeats the pattern (6×). This delays first meaningful interaction and competes with the render thread during cold start.

5. **High — Full-screen backdrop redraws on every recomposition.** `PlayBayBackdrop` builds `Brush.radialGradient`/`Brush.verticalGradient` inside its `Canvas` draw lambda, so any recomposition of `HomeScreen` re-allocates the bloom shader for the whole 1920×1080 surface.

6. **Medium — Per-input coroutine launch on the phone.** `sendInput` does `scope.launch { active.send(...) }` for every press/repeat (≈9 launches/s at 110 ms repeat). Scheduling overhead on a mid-range phone, and it serializes behind the OkHttp dispatcher.

7. **Medium — No R8/minification.** `isMinifyEnabled = false` in `app/build.gradle.kts`. Affects startup/APK size and cold-load, not steady-state frame time, but contributes to the "slow" first impression (cold start 1561 ms measured).

8. **Low/Medium — UI oversizing.** Hero 268 dp, cards 208×156 dp, 56 dp horizontal page padding, code text 54 sp with 10 sp letter-spacing. On a 1080p TV at 3 m this is acceptable-to-large; the real cost is fill rate on the G310 (large surfaces + gradients). AirConsole's compactness is part of why it feels snappier.

## B. Complete issue register

| Sev | File:location | Problem | Evidence | Impact | Fix |
|---|---|---|---|---|---|
| Critical | `ui/home/FeaturedSection.kt:61-90` | Two `Crossfade(tween(260))` over full `GameArt` | Both crossfades mount old+new content; `GameArt` is a `Canvas` drawing 20–84 paths | ~2,500 path allocs/focus move; 250–300 ms frames | Rasterize art; shorten/remove art crossfade |
| Critical | `ui/components/Focusables.kt:68-106` | `border`/`glow` animated in composition; glow rebuilds radial gradient per frame | `val border by animateColorAsState(...)` read via `by` in composable scope; `Brush.radialGradient(...)` inside `drawBehind` | Per-frame recomposition of card+content for 140–220 ms; shader alloc/frame | Read state via `.value` inside `drawWithCache`/`onDrawBehind`; cache brush |
| High | `ui/home/HomeScreen.kt:59-67` | `repeat(8){requestFocus();delay(200)}` startup loop | 1.6 s of focus requests during cold start | Competes with render thread; delays first interaction | Gate on `LocalWindowInfo.isWindowFocused`, bounded retries |
| High | `ui/home/HomeScreen.kt:51` (signature) | `HomeScreen(state: HomeUiState, ...)` collects whole state | `PlayBayApp` does `val homeState by homeViewModel.uiState.collectAsState()` then passes whole object | Any `featuredId` change recomposes entire screen subtree | Split state; mark `@Immutable` |
| High | `data/Games.kt:7` (`Game` data class) + `HomeUiState` | No `@Immutable`/`@Stable` | Compose defaults data classes to unstable | Children cannot skip; `LibraryRow` always recomposes | Add `@Immutable` to `Game` and `HomeUiState` |
| High | `ui/components/Backdrop.kt:27-49` | `Brush.radialGradient`/`verticalGradient` built in draw lambda | Allocated on every draw invalidation | Full-screen shader alloc on every recomposition | Cache into `ImageBitmap` via `drawWithCache` |
| Medium | `connect-mobile/.../MainActivity.kt:110-128` | `scope.launch { active.send(...) }` per input | One coroutine per press/repeat (≈9/s at 110 ms) | Scheduling overhead on phone | Batch/queue sends on a single writer coroutine |
| Medium | `app/build.gradle.kts:19-25` | `isMinifyEnabled = false` | Release build unminified | Larger dex, slower cold start (1561 ms measured) | Enable R8 + shrink resources; verify Ktor keep rules |
| Medium | `ui/home/FeaturedSection.kt:80-90` | Art `Crossfade` over full-size `GameArt` | Second crossfade of a full-size canvas | Double draw during fade | Rasterize art; consider dropping art fade |
| Medium | `ui/home/HomeViewModel.kt:33-36` | `onGameFocused` updates `featuredId` on every focus move | No debounce; hero crossfade queues per step | Animation pile-up during fast D-pad | Debounce hero display (keep focus immediate for Play) |
| Low | `ui/components/Glyphs.kt:47-53, 112-118` | `Path().apply { ... }` allocated per draw | New `Path` every draw invalidation | Minor GC pressure on card redraws | `remember`/cache paths, or draw with primitives |
| Low | `ui/components/Glyphs.kt:28` | `text.uppercase()` in composition | Allocates new string per recomposition | Minor | Pre-compute or use `remember` |
| Low | `ui/home/HomeScreen.kt:88-97` (LibraryRow) | `games.size.toString().padStart(...)` in composition | String alloc per recomposition | Negligible | `remember` |
| Info | `ui/home/FeaturedSection.kt:149` | `PlayBayCatalog.games.indexOfFirst { it.id == game.id }` | O(n) per composition | Negligible (n=4) | Precompute index map (already exists as `byId`) |
| Info | `ui/home/HomeUiState.featured` getter | `games.firstOrNull { it.id == featuredId }` | O(n) per access, called several times/recomposition | Negligible | Cache or use `byId` |

## C. Rendering pipeline analysis — one focus change

Trace (physical remote or phone, both converge here):

1. Input arrives → `moveFocus(direction)` (Compose focus system, main thread).
2. Focus moves to the next `FocusableCard` → its `onFocusChanged { isFocused -> onGameFocused(id) }` fires.
3. `HomeViewModel.onGameFocused(id)` → `_uiState.update { copy(featuredId = id) }` → new `HomeUiState` instance.
4. `PlayBayApp` recomposes (collects `uiState`) → passes new `state` to `HomeScreen`.
5. `HomeScreen` recomposes its entire `Column`: `TopBar`, `FeaturedSection(game=state.featured, ...)`, `LibraryRow(games=state.games, ...)`, `RecentRow(...)`.
6. `FeaturedSection`: both `Crossfade`s detect a new target → start 260 ms animations. For 15 frames, *two* full-size `GameArt` canvases draw (old + new), each `BlockWorld` = 84 `Path` allocations.
7. Each visible `GameCard` recomposes (because `LibraryRow` cannot skip — `List<Game>` unstable). Its `content(focused)` lambda re-executes, re-drawing `GameArt` (canvas draw invalidation).
8. `FocusableCard` recomposes per animation frame because `border`/`glow` are read at composition scope → re-runs `content(focused)` → `GameArt` redraws.
9. `PlayBayBackdrop` recomposes → rebuilds radial-gradient shader over 1920×1080.

Net: a single D-pad press queues ~15 frames of double-canvas vector redraws + per-frame shader allocations + full-subtree recomposition. On a G310 at 1080p this exceeds 16.67 ms/frame → jank. AirConsole avoids this by keeping its render loop to a single canvas/game loop with no per-focus recomposition.

## D. Input pipeline analysis

**Physical remote:** `KEYCODE_DPAD_*` → Android input dispatch → Compose focus system → `moveFocus` → focus change → `onFocusChanged` → `onGameFocused` → StateFlow → recomposition → render. No queuing, no buffering, no main-thread blocking in input dispatch itself. The latency is downstream (rendering). Measured cold start 1561 ms; the input path itself is sub-millisecond.

**Phone controller:** `pointerInput` → `startHold` → `scope.launch { sendInput }` → OkHttp WebSocket → TV `incoming` (Dispatchers.IO) → `parseInput` → `InputDispatcher.submit` (tryEmit, 32-cap, DROP_OLDEST) → SharedFlow → `PhoneNavigationEffect` collect (main thread) → `moveFocus`. Liveness via 15 s ping / 30 s timeout + inbound drain loop. No per-input ACK. The receive loop never blocks on UI.

Both paths converge at `moveFocus` → `HomeUiState` update → render. **This is why both feel identical:** the shared bottleneck is the TV render path, not the input transport. Network RTT (phone) adds ~5–20 ms but is not the dominant term. The physical remote proves this — it has zero network and the same jank.

Additional phone-side cost: one `scope.launch` per press/repeat (≈9/s at 110 ms repeat) and JSON string building per frame. Minor but avoidable.

## E. UI redesign recommendations

Keep PlayBay's dark/red identity; reduce fill rate and visual noise:

- **Hero**: reduce height from 268 dp to ~220 dp; keep the 1.04 weight for art. Cap the art crossfade at 120 ms or drop it (instant swap reads as "responsive").
- **Library cards**: 208×156 dp → 184×132 dp; spacing 18 dp → 14 dp. Keeps 4 cards visible with less overdraw.
- **Page padding**: 56 dp horizontal → 48 dp; vertical 20 dp → 16 dp.
- **Recent tiles**: 52 dp → 44 dp height.
- **Typography**: keep titles 19–20 sp; reduce letter-spacing on eyebrow (2.6 sp → 1.8 sp) to reduce layout width; cap pairing code at 48 sp (currently 54 sp).
- **Settings dialog**: 620 dp → 560 dp.
- **Pairing screen**: `fillMaxWidth(0.72f)` → 0.60f; reduce code letter-spacing 10 sp → 6 sp.
- **Phone D-pad**: keep 96 dp (touch targets are correct); hollow center 84 dp → 72 dp for visual balance.
- **Clipping**: `clip(shape)` before `border` (current order) clips half the border stroke; either draw the border inside the clip with an inset (as now done) or move `border` before `clip`. Keep the inset approach.
- **Gradients**: replace full-screen `Brush.radialGradient` bloom with a cached bitmap (done) or a simpler solid + low-alpha overlay. Avoid stacking multiple gradients on large surfaces.
- **Avoid**: indiscriminate shrinking that hurts 3 m readability; do not remove the red accent or focus glow (they are the identity).

## F. Optimization roadmap

**Phase 1 — Critical (do first):**
- Rasterize `GameArt` and `PlayBayBackdrop` into cached `ImageBitmap`s (done in `976d36b`).
- Move `FocusableCard` border/glow animations to the draw phase; cache the glow brush (done).
- Remove the art `Crossfade` or shorten to ≤120 ms; keep copy fade short.
- Add `@Immutable` to `Game` and `HomeUiState`.

**Phase 2 — Rendering & navigation:**
- Debounce hero display (done: 120 ms, `focusedId` immediate for Play).
- Gate startup focus loop on window focus (done).
- Make `HomeScreen` children skip via stable params + `@Immutable` state.
- Rasterize `PlayGlyph`/`GearGlyph`/`PlayerAvatar` paths or cache them.
- Enable R8 + resource shrinking for release; add Ktor/serialization keep rules.

**Phase 3 — UI sizing & visual refinement:**
- Apply the sizing recommendations in §E.
- Audit `PairingScreen` and `SettingsPanel` for oversized surfaces.
- Verify text truncation at 1080p and 4K output modes.

**Phase 4 — Advanced:**
- Add JankStats + Macrobenchmark to CI for regression detection.
- Profile with Perfetto on the stick; verify frame times ≤ 16.67 ms at 60 Hz.
- Consider a single-canvas hero (draw the featured art + overlays in one `Canvas`) to eliminate crossfade layering entirely.

## G. Verification plan

On the Xiaomi TV Stick 4K:

1. Baseline: install the pre-optimization APK (git `c98f930`), capture `adb shell dumpsys gfxinfo com.playbay.tv` after 60 s of D-pad navigation (down/right cycles across the library). Record Total frames, Janky frames, 50th/90th/95th percentile, Missed Vsync.
2. Optimized: install `976d36b` (or later), repeat identical navigation sequence. Compare.
3. Phone path: pair phone, repeat the same library sweep via phone D-pad; capture gfxinfo. Compare to remote path — should converge.
4. Cold start: `adb shell am start -W -n com.playbay.tv/.PlayBayActivity`, record TotalTime (baseline 1561 ms).
5. Memory: `adb shell dumpsys meminfo com.playbay.tv` before/after 5 min idle; watch for GC churn in `logcat`.
6. Recomposition: run Layout Inspector → recomposition counts; verify `LibraryRow`/`GameCard` do not recompose on `featuredId`-only changes after `@Immutable`.
7. Repeat at 4K output mode (3840×2160) — fill rate doubles; jank should still be < 5%.

Note: the TV's launcher auto-resumes YouTube after ~3 s when PlayBay is launched normally. For measurement, temporarily `pm disable-user com.google.android.youtube.tv`, measure, then re-enable. This is a TV-policy issue, not an app crash.

## H. Final verdict

**What is fundamentally wrong:** PlayBay treats a TV launcher like a desktop Compose app. Every focus change re-runs the full `HomeScreen` subtree, re-allocates vector paths and shaders per frame, and animates two full-size canvases simultaneously. The input pipeline is fine; the render pipeline is not. Both remote and phone feel slow because they share that render path.

**Shortest technically sound path to AirConsole-level smoothness:**
1. Make focus changes cheap: rasterize artwork/backdrop, move focus animations to the draw phase, mark state `@Immutable`, skip unchanged children. (Mostly done in `976d36b`.)
2. Remove or shorten the hero art crossfade; an instant swap reads as responsive and costs one draw.
3. Debounce hero display (done) so fast sweeps don't queue animations.
4. Fix startup focus churn (done).
5. Measure with JankStats/Macrobenchmark and iterate until 90th-percentile frame time ≤ 16.67 ms on the stick.

The architecture (normalized input, Ktor host, Compose UI, ViewModel) does not need to be replaced. The fix is to make the render path behave like a game loop: minimal recomposition, cached draws, draw-phase animation, no per-frame allocation. That is the gap between PlayBay and AirConsole.