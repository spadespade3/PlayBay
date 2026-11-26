package com.playbay.tv.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import com.playbay.tv.data.GameArtStyle
import com.playbay.tv.ui.theme.PlayBayColors

/**
 * Original placeholder artwork, drawn from primitives at the size it lands in.
 * Nothing here is a bitmap, so it stays sharp on every panel and adds no APK weight.
 */
@Composable
fun GameArt(
    style: GameArtStyle,
    modifier: Modifier = Modifier,
) {
    Canvas(modifier = modifier) {
        when (style) {
            GameArtStyle.Demo -> drawDemoArt()
            GameArtStyle.Arcade -> drawArcadeArt()
            GameArtStyle.BlockWorld -> drawBlockWorldArt()
            GameArtStyle.Racing -> drawRacingArt()
        }
    }
}

private fun DrawScope.drawDemoArt() {
    drawRect(
        brush = Brush.linearGradient(
            colors = listOf(Color(0xFF1C0B0D), Color(0xFF07070A)),
            start = Offset(0f, 0f),
            end = Offset(size.width, size.height),
        ),
    )

    val sunCenter = Offset(size.width * 0.64f, size.height * 0.57f)
    val sunRadius = size.minDimension * 0.26f
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(PlayBayColors.Red.copy(alpha = 0.45f), Color.Transparent),
            center = sunCenter,
            radius = sunRadius * 2.4f,
        ),
        radius = sunRadius * 2.4f,
        center = sunCenter,
    )
    drawCircle(
        color = PlayBayColors.Red.copy(alpha = 0.92f),
        radius = sunRadius,
        center = sunCenter,
    )

    val horizon = size.height * 0.70f
    repeat(9) { index ->
        val y = horizon + (size.height - horizon) * (index / 9f)
        drawLine(
            color = PlayBayColors.White.copy(alpha = 0.11f - index * 0.009f),
            start = Offset(0f, y),
            end = Offset(size.width, y),
            strokeWidth = 1f,
        )
    }
    repeat(13) { index ->
        val x = size.width * index / 12f
        val vanishingX = size.width * 0.64f
        drawLine(
            color = PlayBayColors.White.copy(alpha = 0.06f),
            start = Offset(vanishingX, horizon),
            end = Offset(x, size.height),
            strokeWidth = 1f,
        )
    }
    drawLine(
        color = PlayBayColors.White.copy(alpha = 0.22f),
        start = Offset(0f, horizon),
        end = Offset(size.width, horizon),
        strokeWidth = 1.5f,
    )
}

private fun DrawScope.drawArcadeArt() {
    drawRect(
        brush = Brush.linearGradient(
            colors = listOf(Color(0xFF191013), Color(0xFF08080B)),
            start = Offset(0f, 0f),
            end = Offset(size.width, size.height),
        ),
    )

    val ringCenter = Offset(size.width * 0.68f, size.height * 0.50f)
    val ringRadius = size.minDimension * 0.33f
    drawCircle(
        color = PlayBayColors.White.copy(alpha = 0.05f),
        radius = ringRadius * 1.55f,
        center = ringCenter,
    )
    drawCircle(
        color = PlayBayColors.White.copy(alpha = 0.12f),
        radius = ringRadius,
        center = ringCenter,
        style = Stroke(width = ringRadius * 0.09f),
    )
    drawArc(
        color = PlayBayColors.Red,
        startAngle = -110f,
        sweepAngle = 150f,
        useCenter = false,
        topLeft = Offset(ringCenter.x - ringRadius, ringCenter.y - ringRadius),
        size = Size(ringRadius * 2f, ringRadius * 2f),
        style = Stroke(width = ringRadius * 0.09f, cap = StrokeCap.Round),
    )

    var x = size.width * 0.09f
    val bars = listOf(0.045f, 0.022f, 0.068f, 0.018f, 0.052f)
    bars.forEachIndexed { index, widthFraction ->
        val barWidth = size.width * widthFraction
        val barHeight = size.height * (0.56f - index * 0.055f)
        drawRect(
            color = if (index == 1 || index == 3) {
                PlayBayColors.Red.copy(alpha = 0.9f)
            } else {
                PlayBayColors.White.copy(alpha = 0.78f - index * 0.09f)
            },
            topLeft = Offset(x, size.height * 0.5f - barHeight / 2f),
            size = Size(barWidth, barHeight),
        )
        x += barWidth + size.width * 0.022f
    }
}

private fun DrawScope.drawBlockWorldArt() {
    drawRect(
        brush = Brush.linearGradient(
            colors = listOf(Color(0xFF0F0F15), Color(0xFF07070A)),
            start = Offset(0f, 0f),
            end = Offset(size.width, size.height),
        ),
    )

    val halfWidth = size.minDimension * 0.085f
    val stepX = halfWidth * 1.62f
    val stepY = halfWidth * 0.94f
    val startX = size.width * 0.27f
    val startY = size.height * 0.26f

    for (row in 0 until 4) {
        for (column in 0 until 7) {
            val cubeX = startX + column * stepX + if (row % 2 == 0) 0f else stepX / 2f
            val cubeY = startY + row * stepY
            val accent = row == 2 && column == 4
            drawIsoCube(
                centerX = cubeX,
                centerY = cubeY,
                halfWidth = halfWidth,
                topColor = if (accent) PlayBayColors.Red.copy(alpha = 0.88f) else PlayBayColors.White.copy(alpha = 0.15f),
                leftColor = if (accent) PlayBayColors.RedDeep else PlayBayColors.White.copy(alpha = 0.07f),
                rightColor = if (accent) Color(0xFF5C0E12) else Color(0xFF1B1B23),
            )
        }
    }
}

private fun DrawScope.drawIsoCube(
    centerX: Float,
    centerY: Float,
    halfWidth: Float,
    topColor: Color,
    leftColor: Color,
    rightColor: Color,
) {
    val halfHeight = halfWidth * 0.58f
    val depth = halfHeight * 1.4f

    val top = Path().apply {
        moveTo(centerX, centerY - halfHeight)
        lineTo(centerX + halfWidth, centerY)
        lineTo(centerX, centerY + halfHeight)
        lineTo(centerX - halfWidth, centerY)
        close()
    }
    drawPath(top, topColor)

    val left = Path().apply {
        moveTo(centerX - halfWidth, centerY)
        lineTo(centerX, centerY + halfHeight)
        lineTo(centerX, centerY + halfHeight + depth)
        lineTo(centerX - halfWidth, centerY + depth)
        close()
    }
    drawPath(left, leftColor)

    val right = Path().apply {
        moveTo(centerX + halfWidth, centerY)
        lineTo(centerX, centerY + halfHeight)
        lineTo(centerX, centerY + halfHeight + depth)
        lineTo(centerX + halfWidth, centerY + depth)
        close()
    }
    drawPath(right, rightColor)
}

private fun DrawScope.drawRacingArt() {
    drawRect(
        brush = Brush.verticalGradient(
            colors = listOf(Color(0xFF11111A), Color(0xFF060608)),
        ),
    )

    val horizon = size.height * 0.47f
    val vanishingX = size.width * 0.54f

    repeat(11) { index ->
        val bottomX = size.width * index / 10f
        drawLine(
            color = PlayBayColors.White.copy(alpha = 0.07f),
            start = Offset(vanishingX, horizon),
            end = Offset(bottomX, size.height),
            strokeWidth = 1.2f,
        )
    }
    repeat(8) { index ->
        val progress = index / 8f
        val y = horizon + (size.height - horizon) * progress * progress
        drawLine(
            color = PlayBayColors.White.copy(alpha = 0.08f),
            start = Offset(0f, y),
            end = Offset(size.width, y),
            strokeWidth = 1f,
        )
    }

    drawRect(
        color = PlayBayColors.Red.copy(alpha = 0.8f),
        topLeft = Offset(0f, horizon),
        size = Size(size.width, size.height * 0.012f),
    )
    drawCircle(
        color = PlayBayColors.Red,
        radius = size.minDimension * 0.032f,
        center = Offset(vanishingX, horizon),
    )

    repeat(4) { index ->
        val y = size.height * (0.18f + index * 0.12f)
        drawLine(
            color = PlayBayColors.White.copy(alpha = 0.30f - index * 0.05f),
            start = Offset(size.width * 0.07f, y),
            end = Offset(size.width * (0.30f + index * 0.03f), y),
            strokeWidth = 2f,
        )
    }
    drawLine(
        color = PlayBayColors.Red.copy(alpha = 0.55f),
        start = Offset(size.width * 0.82f, size.height * 0.14f),
        end = Offset(size.width * 0.96f, size.height * 0.86f),
        strokeWidth = 3f,
    )
}
