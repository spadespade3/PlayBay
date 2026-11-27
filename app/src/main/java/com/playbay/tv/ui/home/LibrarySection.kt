package com.playbay.tv.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.playbay.tv.data.Game
import com.playbay.tv.data.PlayBayCatalog
import com.playbay.tv.data.RecentGame
import com.playbay.tv.ui.components.FocusableCard
import com.playbay.tv.ui.components.GameArt
import com.playbay.tv.ui.components.PlayGlyph
import com.playbay.tv.ui.theme.PlayBayColors

@Composable
fun LibraryRow(
    onGameFocused: (String) -> Unit,
    onPlay: (Game) -> Unit,
    artworkOnFocusOnly: Boolean = false,
) {
    val games = PlayBayCatalog.games
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(140.dp),
    ) {
        LazyRow(
            modifier = Modifier
                .fillMaxSize()
                .offset(x = (-4).dp),
            contentPadding = PaddingValues(horizontal = 4.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            items(items = games, key = { it.id }) { game ->
                GameCard(
                    game = game,
                    modifier = Modifier.size(width = 160.dp, height = 120.dp),
                    onFocused = { onGameFocused(game.id) },
                    onClick = { onPlay(game) },
                    artworkOnFocusOnly = artworkOnFocusOnly,
                )
            }
        }
    }
}

@Composable
private fun GameCard(
    game: Game,
    modifier: Modifier = Modifier,
    onFocused: () -> Unit,
    onClick: () -> Unit,
    artworkOnFocusOnly: Boolean = false,
) {
    FocusableCard(
        onClick = onClick,
        onFocusChanged = { isFocused -> if (isFocused) onFocused() },
        modifier = modifier,
        shape = RoundedCornerShape(8.dp),
        focusedScale = 1.04f,
    ) { focused ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(PlayBayColors.InkSoft),
        ) {
            if (!artworkOnFocusOnly || focused) {
                GameArt(style = game.artStyle, modifier = Modifier.fillMaxSize())
            }
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(horizontal = 10.dp, vertical = 8.dp),
            ) {
                Text(
                    text = game.title,
                    color = PlayBayColors.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@Composable
fun RecentRow(
    onPlay: (Game) -> Unit,
    showArtwork: Boolean = true,
) {
    val recentlyPlayed = PlayBayCatalog.recentlyPlayed
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        recentlyPlayed.forEach { recent ->
            RecentTile(
                recent = recent,
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp),
                onClick = { onPlay(recent.game) },
                showArtwork = showArtwork,
            )
        }
    }
}

@Composable
private fun RecentTile(
    recent: RecentGame,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
    showArtwork: Boolean = true,
) {
    FocusableCard(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(6.dp),
        focusedScale = 1.02f,
        borderColor = PlayBayColors.White.copy(alpha = 0.06f),
    ) { focused ->
        Row(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    if (focused) PlayBayColors.White.copy(alpha = 0.06f)
                    else PlayBayColors.White.copy(alpha = 0.025f),
                )
                .padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .width(52.dp)
                    .height(32.dp)
                    .clip(RoundedCornerShape(3.dp)),
            ) {
                if (showArtwork) {
                    GameArt(style = recent.game.artStyle, modifier = Modifier.fillMaxSize())
                }
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = recent.game.title,
                    color = PlayBayColors.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = recent.playedLabel,
                    color = PlayBayColors.Muted,
                    fontSize = 10.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Spacer(Modifier.width(6.dp))
            PlayGlyph(
                tint = if (focused) PlayBayColors.Red else PlayBayColors.Dim,
                size = 8.dp,
            )
            Spacer(Modifier.width(2.dp))
        }
    }
}