package com.playbay.tv.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.playbay.tv.ui.theme.PlayBayColors

/**
 * Shared TV focus treatment: scale, border and a soft accent glow. Every
 * interactive surface in the launcher goes through this so focus always reads
 * the same from three metres away.
 */
@Composable
fun FocusableCard(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(4.dp),
    focusedScale: Float = 1.035f,
    borderColor: Color = PlayBayColors.White.copy(alpha = 0.10f),
    focusedBorderColor: Color = PlayBayColors.White,
    glowColor: Color = PlayBayColors.Red,
    focusRequester: FocusRequester? = null,
    onFocusChanged: ((Boolean) -> Unit)? = null,
    content: @Composable BoxScope.(focused: Boolean) -> Unit,
) {
    val interactionSource = remember { MutableInteractionSource() }
    val focused by interactionSource.collectIsFocusedAsState()
    // Held as a state object (not read via `by`) so the scale animation
    // invalidates only the graphics layer, not the whole composable.
    val scaleState = animateFloatAsState(
        targetValue = if (focused) focusedScale else 1f,
        animationSpec = spring(dampingRatio = 0.78f, stiffness = 520f),
        label = "focusScale",
    )
    // Simple focus: instant border (no animation), no glow (saves a radial-gradient
    // shader fill per focused card). Scale animation retained (cheap graphicsLayer).
    val border = if (focused) focusedBorderColor else borderColor

    Box(
        modifier = modifier
            .graphicsLayer {
                scaleX = scaleState.value
                scaleY = scaleState.value
            }
            .clip(shape)
            .drawBehind {
                val borderWidth = 2.dp.toPx()
                val inset = borderWidth / 2f
                val corner = 12.dp.toPx()
                drawRoundRect(
                    color = border,
                    topLeft = Offset(inset, inset),
                    size = Size(size.width - borderWidth, size.height - borderWidth),
                    cornerRadius = CornerRadius(corner - inset, corner - inset),
                    style = Stroke(width = borderWidth),
                )
            }
            .then(if (focusRequester != null) Modifier.focusRequester(focusRequester) else Modifier)
            .onFocusChanged { state -> onFocusChanged?.invoke(state.isFocused) }
            .onKeyEvent { event ->
                if (event.type == KeyEventType.KeyUp &&
                    (event.key == Key.Enter ||
                        event.key == Key.DirectionCenter ||
                        event.key == Key.Spacebar)
                ) {
                    onClick()
                    true
                } else {
                    false
                }
            }
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick,
            ),
        content = { content(focused) },
    )
}

@Composable
fun TvButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    primary: Boolean = true,
    focusRequester: FocusRequester? = null,
    showPlayGlyph: Boolean = false,
) {
    val interactionSource = remember { MutableInteractionSource() }
    val focused by interactionSource.collectIsFocusedAsState()
    val shape = RoundedCornerShape(3.dp)
    val scaleState = animateFloatAsState(
        targetValue = if (focused) 1.045f else 1f,
        animationSpec = spring(dampingRatio = 0.78f, stiffness = 520f),
        label = "buttonScale",
    )
    val backgroundState = animateColorAsState(
        targetValue = when {
            primary && focused -> PlayBayColors.White
            primary -> PlayBayColors.Red
            focused -> PlayBayColors.White.copy(alpha = 0.12f)
            else -> Color.Transparent
        },
        animationSpec = tween(durationMillis = 150),
        label = "buttonBackground",
    )
    val contentColor by animateColorAsState(
        targetValue = if (primary && focused) PlayBayColors.Ink else PlayBayColors.White,
        animationSpec = tween(durationMillis = 150),
        label = "buttonContent",
    )
    val borderColorState = animateColorAsState(
        targetValue = when {
            focused -> PlayBayColors.White
            primary -> Color.Transparent
            else -> PlayBayColors.White.copy(alpha = 0.22f)
        },
        animationSpec = tween(durationMillis = 150),
        label = "buttonBorder",
    )

    Row(
        modifier = modifier
            .graphicsLayer {
                scaleX = scaleState.value
                scaleY = scaleState.value
            }
            .height(50.dp)
            .clip(shape)
            .drawBehind {
                drawRoundRect(color = backgroundState.value, cornerRadius = CornerRadius(0f, 0f))
                val borderWidth = 2.dp.toPx()
                drawRoundRect(
                    color = borderColorState.value,
                    topLeft = Offset(borderWidth / 2f, borderWidth / 2f),
                    size = Size(size.width - borderWidth, size.height - borderWidth),
                    cornerRadius = CornerRadius(0f, 0f),
                    style = Stroke(width = borderWidth),
                )
            }
            .then(if (focusRequester != null) Modifier.focusRequester(focusRequester) else Modifier)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick,
            )
            .padding(horizontal = 26.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (showPlayGlyph) {
            PlayGlyph(tint = contentColor, size = 13.dp)
        }
        Text(
            text = text,
            color = contentColor,
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 0.6.sp,
            maxLines = 1,
        )
    }
}
