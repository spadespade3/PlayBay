package com.playbay.tv.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.playbay.tv.data.Game
import com.playbay.tv.data.PlayBayCatalog
import com.playbay.tv.ui.components.Eyebrow
import com.playbay.tv.ui.components.GearGlyph
import com.playbay.tv.ui.components.PlayBayBackdrop
import com.playbay.tv.ui.components.PlayerAvatar
import com.playbay.tv.ui.theme.PlayBayColors
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.first

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
        snapshotFlow { windowInfo.isWindowFocused }.first { it }
        repeat(4) {
            if (playFocused) return@LaunchedEffect
            runCatching { playFocus.requestFocus() }
            withFrameNanos { }
            if (playFocused) return@LaunchedEffect
            kotlinx.coroutines.delay(80)
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        PlayBayBackdrop(Modifier.fillMaxSize())

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 48.dp, vertical = 16.dp),
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(40.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "PlayBay",
                    color = PlayBayColors.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                )
                Spacer(Modifier.width(6.dp))
                Box(
                    Modifier
                        .size(5.dp)
                        .clip(CircleShape)
                        .background(PlayBayColors.Red),
                )
                Spacer(Modifier.weight(1f))
                Text(
                    text = "Player One",
                    color = PlayBayColors.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                )
                Spacer(Modifier.width(16.dp))
                Box(
                    Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(PlayBayColors.White.copy(alpha = 0.06f))
                        .clickable(onClick = onOpenSettings),
                    contentAlignment = Alignment.Center,
                ) {
                    GearGlyph(
                        tint = PlayBayColors.White.copy(alpha = 0.7f),
                        size = 18.dp,
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            // Featured
            FeaturedSection(
                game = state.featured,
                onPlay = { onPlay(state.focused) },
                playFocus = playFocus,
                onPlayFocusChanged = { playFocused = it },
            )

            Spacer(Modifier.height(16.dp))

            // Library
            Text(
                text = "Library",
                color = PlayBayColors.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(8.dp))
            LibraryRow(
                onGameFocused = onGameFocused,
                onPlay = onPlay,
                artworkOnFocusOnly = artworkOnFocusOnly,
            )

            Spacer(Modifier.height(12.dp))

            // Recent
            Text(
                text = "Recently Played",
                color = PlayBayColors.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(8.dp))
            RecentRow(
                onPlay = onPlay,
                showArtwork = recentArtwork,
            )
        }

        // Message toast
        if (state.message != null) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 16.dp)
                    .background(PlayBayColors.InkRaised, RoundedCornerShape(20.dp))
                    .padding(horizontal = 16.dp, vertical = 8.dp),
            ) {
                Text(
                    text = state.message,
                    color = PlayBayColors.White.copy(alpha = 0.9f),
                    fontSize = 12.sp,
                )
            }
        }
    }
}