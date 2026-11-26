package com.playbay.tv.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.playbay.tv.ui.theme.PlayBayColors

/**
 * Static backdrop: near-black vertical gradient, one low-alpha red bloom and a
 * floor vignette. No animation, no blur layers, so it costs one cheap draw.
 */
@Composable
fun PlayBayBackdrop(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.background(
            Brush.verticalGradient(
                colors = listOf(Color(0xFF09090C), PlayBayColors.Ink),
            ),
        ),
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
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
    }
}
