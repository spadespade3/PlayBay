package com.playbay.tv.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.playbay.tv.ui.theme.PlayBayColors

@Composable
fun Eyebrow(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = PlayBayColors.Muted,
) {
    Text(
        text = text.uppercase(),
        modifier = modifier,
        color = color,
        fontSize = 12.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 2.6.sp,
        maxLines = 1,
    )
}

@Composable
fun PlayGlyph(
    tint: Color,
    size: Dp,
    modifier: Modifier = Modifier,
) {
    Canvas(modifier = modifier.size(size)) {
        val w = this.size.width
        val h = this.size.height
        val path = Path().apply {
            moveTo(w * 0.24f, h * 0.10f)
            lineTo(w * 0.92f, h * 0.50f)
            lineTo(w * 0.24f, h * 0.90f)
            close()
        }
        drawPath(path = path, color = tint)
    }
}

@Composable
fun GearGlyph(
    tint: Color,
    size: Dp,
    modifier: Modifier = Modifier,
) {
    Canvas(modifier = modifier.size(size)) {
        val extent = this.size.minDimension
        val strokeWidth = extent * 0.085f
        repeat(8) { index ->
            rotate(degrees = index * 45f) {
                drawLine(
                    color = tint,
                    start = Offset(center.x, center.y - extent * 0.46f),
                    end = Offset(center.x, center.y - extent * 0.30f),
                    strokeWidth = strokeWidth,
                    cap = StrokeCap.Round,
                )
            }
        }
        drawCircle(
            color = tint,
            radius = extent * 0.27f,
            center = center,
            style = Stroke(width = strokeWidth),
        )
        drawCircle(
            color = tint,
            radius = extent * 0.045f,
            center = center,
        )
    }
}

@Composable
fun PlayerAvatar(
    modifier: Modifier = Modifier,
    size: Dp = 36.dp,
) {
    Canvas(modifier = modifier.size(size)) {
        val extent = this.size.minDimension
        drawCircle(
            brush = Brush.linearGradient(
                colors = listOf(PlayBayColors.Red, PlayBayColors.RedDeep),
                start = Offset(0f, 0f),
                end = Offset(extent, extent),
            ),
            radius = extent / 2f,
            center = center,
        )
        drawCircle(
            color = Color.Black.copy(alpha = 0.30f),
            radius = extent * 0.33f,
            center = center,
        )
        val glyph = Path().apply {
            moveTo(extent * 0.43f, extent * 0.35f)
            lineTo(extent * 0.67f, extent * 0.50f)
            lineTo(extent * 0.43f, extent * 0.65f)
            close()
        }
        drawPath(path = glyph, color = PlayBayColors.White)
        drawCircle(
            color = PlayBayColors.White.copy(alpha = 0.18f),
            radius = extent / 2f - extent * 0.025f,
            center = center,
            style = Stroke(width = extent * 0.035f),
        )
    }
}
