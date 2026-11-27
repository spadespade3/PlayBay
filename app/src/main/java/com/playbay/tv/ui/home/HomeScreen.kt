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
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.playbay.tv.data.Game
import com.playbay.tv.data.PlayBayCatalog
import com.playbay.tv.ui.components.Eyebrow
import com.playbay.tv.ui.components.GearGlyph
import com.playbay.tv.ui.components.TvButton
import com.playbay.tv.ui.components.PlayBayBackdrop
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
                    .height(36.dp),
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
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                )
                Spacer(Modifier.width(16.dp))
                Box(
                    Modifier
                        .size(32.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(PlayBayColors.White.copy(alpha = 0.06f))
                        .clickable(onClick = onOpenSettings),
                    contentAlignment = Alignment.Center,
                ) {
                    GearGlyph(
                        tint = PlayBayColors.White.copy(alpha = 0.7f),
                        size = 16.dp,
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            // Info panel (no artwork — driven by focused game)
            Column(
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(
                    text = "Choose your game",
                    color = PlayBayColors.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = state.focused.tagline,
                    color = PlayBayColors.Muted,
                    fontSize = 13.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Eyebrow(text = state.focused.genre, color = PlayBayColors.White.copy(alpha = 0.6f))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = state.focused.players,
                        color = PlayBayColors.Muted,
                        fontSize = 11.sp,
                    )
                    Spacer(Modifier.weight(1f))
                    Box(Modifier.onFocusChanged { playFocused = it.isFocused }) {
                        TvButton(
                            text = "Play",
                            onClick = { onPlay(state.focused) },
                            focusRequester = playFocus,
                            showPlayGlyph = true,
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // Single game carousel
            Text(
                text = "Games",
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

            // Message toast
            if (state.message != null) {
                Spacer(Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(PlayBayColors.InkRaised, RoundedCornerShape(12.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp),
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
}