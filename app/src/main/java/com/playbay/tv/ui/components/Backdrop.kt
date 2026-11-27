package com.playbay.tv.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Canvas as SkiaCanvas
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.drawscope.CanvasDrawScope
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.draw.drawWithCache
import com.playbay.tv.ui.theme.PlayBayColors
import kotlin.math.roundToInt

/**
 * Static backdrop: near-black vertical gradient, one low-alpha red bloom and a
 * floor vignette. The bloom/vignette raster is built once per pixel size and
 * replayed afterwards, so a recomposition of the launcher does not redraw the
 * full-screen gradient every frame.
 */
@Composable
fun PlayBayBackdrop(modifier: Modifier = Modifier) {
    // Experiment: solid background only, no bloom/vignette bitmap.
    Box(
        modifier = modifier.background(
            Brush.verticalGradient(
                colors = listOf(Color(0xFF09090C), PlayBayColors.Ink),
            ),
        ),
    )
}

private object BackdropRaster {
    private val plates = LinkedHashMap<Long, ImageBitmap>(4, 0.75f, true)
    private var residentBytes = 0
    private var failed = false

    fun obtain(width: Int, height: Int, density: Density, layoutDirection: LayoutDirection): ImageBitmap? {
        if (failed) return null
        val key = (width.toLong() shl 32) or height.toLong()
        plates[key]?.let { return it }
        return try {
            val bitmap = ImageBitmap(width, height)
            CanvasDrawScope().draw(
                density = density,
                layoutDirection = layoutDirection,
                canvas = SkiaCanvas(bitmap),
                size = Size(width.toFloat(), height.toFloat()),
            ) { drawBackdrop() }
            plates[key] = bitmap
            residentBytes += width * height * 4
            if (residentBytes > 8 * 1024 * 1024) {
                plates.clear()
                residentBytes = 0
                plates[key] = bitmap
                residentBytes += width * height * 4
            }
            bitmap
        } catch (error: Throwable) {
            failed = true
            null
        }
    }
}

private fun DrawScope.drawBackdrop() {
    val bloomCenter = Offset(size.width * 0.80f, -size.height * 0.18f)
    val bloomRadius = size.width * 0.58f
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(
                PlayBayColors.Red.copy(alpha = 0.11f),
                Color.Transparent,
            ),
            center = bloomCenter,
            radius = bloomRadius,
        ),
        radius = bloomRadius,
        center = bloomCenter,
    )
    drawRect(
        brush = Brush.verticalGradient(
            colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.45f)),
            startY = size.height * 0.62f,
            endY = size.height,
        ),
    )
}