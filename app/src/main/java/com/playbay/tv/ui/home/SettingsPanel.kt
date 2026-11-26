package com.playbay.tv.ui.home

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import kotlinx.coroutines.delay
import com.playbay.tv.ui.components.Eyebrow
import com.playbay.tv.ui.components.TvButton
import com.playbay.tv.ui.theme.PlayBayColors

@Composable
fun SettingsPanel(onClose: () -> Unit) {
    val closeFocus = remember { FocusRequester() }
    var revealed by remember { mutableStateOf(false) }
    val alpha by animateFloatAsState(
        targetValue = if (revealed) 1f else 0f,
        animationSpec = tween(180),
        label = "settingsAlpha",
    )
    val scale by animateFloatAsState(
        targetValue = if (revealed) 1f else 0.97f,
        animationSpec = tween(200),
        label = "settingsScale",
    )

    LaunchedEffect(closeFocus) {
        revealed = true
        repeat(6) {
            val acquired = try {
                closeFocus.requestFocus()
            } catch (_: IllegalStateException) {
                false
            }
            if (acquired) return@LaunchedEffect
            delay(120)
        }
    }

    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = false,
            dismissOnBackPress = true,
            dismissOnClickOutside = true,
        ),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.66f)),
            contentAlignment = Alignment.Center,
        ) {
            Column(
                modifier = Modifier
                    .width(620.dp)
                    .graphicsLayer {
                        this.alpha = alpha
                        scaleX = scale
                        scaleY = scale
                    }
                    .clip(RoundedCornerShape(10.dp))
                    .background(PlayBayColors.InkRaised)
                    .border(
                        width = 1.dp,
                        color = PlayBayColors.White.copy(alpha = 0.10f),
                        shape = RoundedCornerShape(10.dp),
                    )
                    .padding(horizontal = 42.dp, vertical = 36.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier
                            .size(7.dp)
                            .clip(RoundedCornerShape(1.dp))
                            .background(PlayBayColors.Red),
                    )
                    Spacer(Modifier.width(10.dp))
                    Eyebrow(text = "Settings", color = PlayBayColors.Red)
                }
                Spacer(Modifier.height(12.dp))
                Text(
                    text = "PlayBay on the big screen",
                    color = PlayBayColors.White,
                    fontSize = 30.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = (-0.4).sp,
                )
                Spacer(Modifier.height(12.dp))
                Text(
                    text = "This preview ships the TV home screen. Game launch, accounts and " +
                        "syncing are not part of this build.",
                    color = PlayBayColors.Muted,
                    fontSize = 14.sp,
                    lineHeight = 21.sp,
                )
                Spacer(Modifier.height(24.dp))
                Box(
                    Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(PlayBayColors.Line),
                )
                Spacer(Modifier.height(18.dp))
                InfoRow(label = "Version", value = "0.1.0 (1)")
                InfoRow(label = "Channel", value = "Local debug preview")
                InfoRow(label = "Profile", value = "Player One · local only")
                InfoRow(label = "Artwork", value = "Generated in-app · no external assets")
                InfoRow(label = "Canvas", value = "1280 × 720 dp · density-scaled")
                Spacer(Modifier.height(26.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    TvButton(
                        text = "Close",
                        onClick = onClose,
                        primary = true,
                        focusRequester = closeFocus,
                    )
                    Spacer(Modifier.width(16.dp))
                    Text(
                        text = "BACK returns home",
                        color = PlayBayColors.Dim,
                        fontSize = 11.sp,
                        letterSpacing = 0.4.sp,
                    )
                }
            }
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Eyebrow(text = label, color = PlayBayColors.Dim)
        Spacer(Modifier.weight(1f))
        Text(
            text = value,
            color = PlayBayColors.White.copy(alpha = 0.92f),
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
        )
    }
}
