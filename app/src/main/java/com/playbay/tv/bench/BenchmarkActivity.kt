package com.playbay.tv.bench

import android.app.Activity
import android.os.Bundle
import android.util.Log
import android.view.FrameMetrics
import android.view.Window
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.remember
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager
import com.playbay.tv.ui.home.HomeScreen
import com.playbay.tv.ui.home.HomeViewModel
import com.playbay.tv.ui.theme.PlayBayTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.concurrent.ConcurrentLinkedQueue

/**
 * Debug-only benchmark harness.
 *
 * Launch:
 *   adb shell am start -n com.playbay.tv/.bench.BenchmarkActivity
 * With params:
 *   adb shell am start -n com.playbay.tv/.bench.BenchmarkActivity -e count 100 -e delayMs 100 -e warmup 20
 *
 * Composes the real HomeScreen (bypassing the pairing gate) and drives
 * [count] consecutive focus moves, collecting per-frame total durations via
 * [FrameMetrics]. Results are printed to logcat with tag "PlayBayBench".
 */
class BenchmarkActivity : ComponentActivity() {

    private val frameDurationsMs = ConcurrentLinkedQueue<Long>()
    private val layoutDurationsMs = ConcurrentLinkedQueue<Long>()
    private val drawDurationsMs = ConcurrentLinkedQueue<Long>()
    private val gpuDurationsMs = ConcurrentLinkedQueue<Long>()
    private var listener: Window.OnFrameMetricsAvailableListener? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val warmup = intent.getIntExtra("warmup", 20)
        val count = intent.getIntExtra("count", 100)
        val delayMs = intent.getLongExtra("delayMs", 100L)

        listener = Window.OnFrameMetricsAvailableListener { _, frameMetrics, _ ->
            val totalNs = frameMetrics.getMetric(FrameMetrics.TOTAL_DURATION)
            val layoutNs = frameMetrics.getMetric(FrameMetrics.LAYOUT_MEASURE_DURATION)
            val drawNs = frameMetrics.getMetric(FrameMetrics.DRAW_DURATION)
            // GPU_DURATION may be 0 on some devices; record it anyway.
            val gpuNs = frameMetrics.getMetric(FrameMetrics.GPU_DURATION)
            frameDurationsMs.add(totalNs / 1_000_000L)
            layoutDurationsMs.add(layoutNs / 1_000_000L)
            drawDurationsMs.add(drawNs / 1_000_000L)
            gpuDurationsMs.add(gpuNs / 1_000_000L)
        }
        window.addOnFrameMetricsAvailableListener(listener!!, android.os.Handler(android.os.Looper.getMainLooper()))

        setContent {
            PlayBayTheme {
                BenchHome(warmup = warmup, count = count, delayMs = delayMs) { report() }
            }
        }
    }

    @Composable
    private fun BenchHome(warmup: Int, count: Int, delayMs: Long, onDone: () -> Unit) {
        val homeViewModel = remember { HomeViewModel() }
        val homeState = homeViewModel.uiState.collectAsState().value
        val focusManager = LocalFocusManager.current

        androidx.compose.runtime.LaunchedEffect(Unit) {
            delay(500)
            repeat(warmup) {
                val moved = focusManager.moveFocus(FocusDirection.Down)
                if (!moved) focusManager.moveFocus(FocusDirection.Up)
                delay(delayMs)
            }
            frameDurationsMs.clear()
            delay(200)

            val start = System.currentTimeMillis()
            repeat(count) {
                val moved = focusManager.moveFocus(FocusDirection.Down)
                if (!moved) focusManager.moveFocus(FocusDirection.Up)
                delay(delayMs)
            }
            val elapsed = System.currentTimeMillis() - start
            delay(500)
            Log.i("PlayBayBench", "run complete: count=$count delayMs=$delayMs elapsedMs=$elapsed frames=${frameDurationsMs.size}")
            onDone()
        }

        HomeScreen(
            state = homeState,
            onGameFocused = homeViewModel::onGameFocused,
            onPlay = homeViewModel::onPlayPressed,
            onOpenSettings = {},
            artworkOnFocusOnly = false,
        )
    }

    private fun report() {
        val sorted = frameDurationsMs.sorted()
        if (sorted.isEmpty()) {
            Log.w("PlayBayBench", "no frames collected")
            return
        }
        fun pct(list: List<Long>, p: Double): Long {
            val s = list.sorted()
            val idx = ((s.size - 1) * p).toInt().coerceIn(0, s.size - 1)
            return s[idx]
        }
        val janky = sorted.count { it > 16 }
        val layout = layoutDurationsMs.toList()
        val draw = drawDurationsMs.toList()
        val gpu = gpuDurationsMs.toList()
        Log.i("PlayBayBench", "FRAMES n=${sorted.size} min=${sorted.first()} p50=${pct(sorted, 0.5)} p90=${pct(sorted, 0.9)} p95=${pct(sorted, 0.95)} p99=${pct(sorted, 0.99)} max=${sorted.last()} janky(>16ms)=${janky} (${(janky * 100 / sorted.size)}%)")
        Log.i("PlayBayBench", "LAYOUT min=${layout.minOrNull()} p50=${pct(layout, 0.5)} p90=${pct(layout, 0.9)} p99=${pct(layout, 0.99)} max=${layout.maxOrNull()}")
        Log.i("PlayBayBench", "DRAW   min=${draw.minOrNull()} p50=${pct(draw, 0.5)} p90=${pct(draw, 0.9)} p99=${pct(draw, 0.99)} max=${draw.maxOrNull()}")
        Log.i("PlayBayBench", "GPU    min=${gpu.minOrNull()} p50=${pct(gpu, 0.5)} p90=${pct(gpu, 0.9)} p99=${pct(gpu, 0.99)} max=${gpu.maxOrNull()}")
    }

    override fun onDestroy() {
        listener?.let { window.removeOnFrameMetricsAvailableListener(it) }
        super.onDestroy()
    }
}
