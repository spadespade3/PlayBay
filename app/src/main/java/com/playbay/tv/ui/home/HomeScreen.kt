package com.playbay.tv.ui.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.first
import com.playbay.tv.data.Game
import com.playbay.tv.data.PlayBayCatalog
import com.playbay.tv.ui.components.Eyebrow
import com.playbay.tv.ui.components.FocusableCard
import com.playbay.tv.ui.components.GearGlyph
import com.playbay.tv.ui.components.PlayBayBackdrop
import com.playbay.tv.ui.components.PlayerAvatar
import com.playbay.tv.ui.theme.PlayBayColors

@Composable
fun HomeScreen(
    state: HomeUiState,
    onGameFocused: (String) -> Unit,
    onPlay: (Game) -> Unit,
    onOpenSettings: () -> Unit,
    artworkOnFocusOnly: Boolean = false,
    recentArtwork: Boolean = true,
    modifier: Modifier = Modifier,
) {
    val playFocus = remember { FocusRequester() }
    val windowInfo = LocalWindowInfo.current
    var playFocused by remember { mutableStateOf(false) }
    LaunchedEffect(playFocus) {
        // Ask only once the window owns input focus, then stop as soon as the
        // Play button actually receives it. The old 8 x 200 ms retry loop kept
        // hammering requestFocus() for 1.6 s after the button had already won
        // focus, which churned the focus system on every launch.
        snapshotFlow { windowInfo.isWindowFocused }.first { it }
        repeat(6) {
            if (playFocused) return@LaunchedEffect
            runCatching { playFocus.requestFocus() }
            withFrameNanos { }
            if (playFocused) return@LaunchedEffect
            delay(80)
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        PlayBayBackdrop(Modifier.fillMaxSize())

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 56.dp)
                .padding(top = 20.dp, bottom = 20.dp),
        ) {
            TopBar(onOpenSettings = onOpenSettings)
            Spacer(Modifier.height(20.dp))

            FeaturedSection(
                game = state.featured,
                onPlay = { onPlay(state.focused) },
                playFocus = playFocus,
                onPlayFocusChanged = { playFocused = it },
            )

            Spacer(Modifier.height(20.dp))
            SectionHeader(
                title = "Library",
                trailing = PlayBayCatalog.games.size.toString().padStart(2, '0') + " titles",
            )
            Spacer(Modifier.height(12.dp))
            LibraryRow(
                onGameFocused = onGameFocused,
                onPlay = onPlay,
                artworkOnFocusOnly = artworkOnFocusOnly,
            )

            Spacer(Modifier.height(18.dp))
            SectionHeader(title = "Recently played", trailing = "Local history")
            Spacer(Modifier.height(10.dp))
            RecentRow(onPlay = onPlay, showArtwork = recentArtwork)
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 26.dp),
            contentAlignment = Alignment.BottomCenter,
        ) {
            AnimatedVisibility(
                visible = state.message != null,
                enter = fadeIn(animationSpec = tween(160)) +
                    slideInVertically(animationSpec = tween(220), initialOffsetY = { it / 2 }),
                exit = fadeOut(animationSpec = tween(160)) +
                    slideOutVertically(animationSpec = tween(200), targetOffsetY = { it / 2 }),
            ) {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .background(PlayBayColors.InkRaised)
                        .padding(horizontal = 18.dp, vertical = 11.dp)
                        .semantics { liveRegion = LiveRegionMode.Polite },
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        Modifier
                            .size(6.dp)
                            .clip(CircleShape)
                            .background(PlayBayColors.Red),
                    )
                    Spacer(Modifier.width(10.dp))
                    Text(
                        text = state.message.orEmpty(),
                        color = PlayBayColors.White.copy(alpha = 0.92f),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        letterSpacing = 0.2.sp,
                    )
                }
            }
        }
    }
}

@Composable
private fun TopBar(onOpenSettings: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(44.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BrandMark()
        Spacer(Modifier.width(12.dp))
        Text(
            text = "PlayBay",
            color = PlayBayColors.White,
            fontSize = 20.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 0.2.sp,
        )
        Spacer(Modifier.width(6.dp))
        Box(
            Modifier
                .size(5.dp)
                .clip(CircleShape)
                .background(PlayBayColors.Red),
        )

        Spacer(Modifier.weight(1f))

        PlayerAvatar(size = 30.dp)
        Spacer(Modifier.width(10.dp))
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = "Player One",
                color = PlayBayColors.White,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = "Local profile",
                color = PlayBayColors.Muted,
                fontSize = 11.sp,
            )
        }
        Spacer(Modifier.width(20.dp))
        Box(
            Modifier
                .width(1.dp)
                .height(20.dp)
                .background(PlayBayColors.Line),
        )
        Spacer(Modifier.width(16.dp))
        SettingsButton(onClick = onOpenSettings)
    }
}

@Composable
private fun BrandMark() {
    Canvas(modifier = Modifier.size(26.dp)) {
        val extent = size.minDimension
        drawRoundRect(
            color = PlayBayColors.Red,
            cornerRadius = CornerRadius(extent * 0.24f),
        )
        val glyph = Path().apply {
            moveTo(extent * 0.38f, extent * 0.28f)
            lineTo(extent * 0.76f, extent * 0.50f)
            lineTo(extent * 0.38f, extent * 0.72f)
            close()
        }
        drawPath(path = glyph, color = PlayBayColors.White)
    }
}

@Composable
private fun SettingsButton(onClick: () -> Unit) {
    FocusableCard(
        onClick = onClick,
        modifier = Modifier
            .size(40.dp)
            .semantics { contentDescription = "Settings" },
        shape = RoundedCornerShape(4.dp),
        focusedScale = 1.08f,
        borderColor = PlayBayColors.White.copy(alpha = 0.12f),
    ) { focused ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    if (focused) {
                        PlayBayColors.White.copy(alpha = 0.10f)
                    } else {
                        PlayBayColors.White.copy(alpha = 0.03f)
                    },
                ),
            contentAlignment = Alignment.Center,
        ) {
            GearGlyph(
                tint = if (focused) PlayBayColors.White else PlayBayColors.White.copy(alpha = 0.55f),
                size = 19.dp,
            )
        }
    }
}

@Composable
private fun SectionHeader(title: String, trailing: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(24.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            text = title,
            color = PlayBayColors.White,
            fontSize = 19.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = (-0.2).sp,
        )
        Eyebrow(text = trailing, color = PlayBayColors.Dim)
    }
}
