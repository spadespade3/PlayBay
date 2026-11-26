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
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import com.playbay.tv.data.Game
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
    modifier: Modifier = Modifier,
) {
    val playFocus = remember { FocusRequester() }
    LaunchedEffect(playFocus, state.featured) {
        if (state.featured == null) return@LaunchedEffect
        // Retry only during the startup handoff, and stop as soon as focus lands.
        repeat(8) {
            val acquired = try {
                playFocus.requestFocus()
            } catch (_: IllegalStateException) {
                false
            }
            if (acquired) return@LaunchedEffect
            delay(150)
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

            state.featured?.let { featured ->
                FeaturedSection(
                    game = featured,
                    onPlay = { onPlay(featured) },
                    playFocus = playFocus,
                )
            } ?: EmptyLibraryMessage()

            Spacer(Modifier.height(20.dp))
            SectionHeader(
                title = "Library",
                trailing = state.games.size.toString().padStart(2, '0') + " titles",
            )
            Spacer(Modifier.height(12.dp))
            if (state.games.isNotEmpty()) {
                LibraryRow(
                    games = state.games,
                    onGameFocused = onGameFocused,
                    onPlay = onPlay,
                )
            }

            Spacer(Modifier.height(18.dp))
            SectionHeader(title = "Recently played", trailing = "Preview")
            Spacer(Modifier.height(10.dp))
            if (state.recentlyPlayed.isNotEmpty()) {
                RecentRow(recentlyPlayed = state.recentlyPlayed, onPlay = onPlay)
            }
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


@Composable
private fun EmptyLibraryMessage() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(268.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(PlayBayColors.InkRaised)
            .padding(28.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "Your library is empty. Add games to get started.",
            color = PlayBayColors.Muted,
            fontSize = 18.sp,
        )
    }
}
