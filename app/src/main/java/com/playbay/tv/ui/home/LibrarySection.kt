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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.playbay.tv.data.Game
import com.playbay.tv.data.RecentGame
import com.playbay.tv.ui.components.Eyebrow
import com.playbay.tv.ui.components.FocusableCard
import com.playbay.tv.ui.components.GameArt
import com.playbay.tv.ui.components.PlayGlyph
import com.playbay.tv.ui.theme.PlayBayColors

/**
 * The library viewport carries 8 dp of padding above and below the cards so the
 * focused card's scale and glow are not clipped by the lazy row. The -8 dp offset
 * keeps the first card aligned to the 56 dp page edge.
 */
@Composable
fun LibraryRow(
    games: List<Game>,
    onGameFocused: (String) -> Unit,
    onPlay: (Game) -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(172.dp),
    ) {
        LazyRow(
            modifier = Modifier
                .fillMaxSize()
                .offset(x = (-8).dp),
            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            items(items = games, key = { it.id }) { game ->
                GameCard(
                    game = game,
                    modifier = Modifier.size(width = 208.dp, height = 156.dp),
                    onFocused = { onGameFocused(game.id) },
                    onClick = { onPlay(game) },
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
) {
    FocusableCard(
        onClick = onClick,
        onFocusChanged = { isFocused -> if (isFocused) onFocused() },
        modifier = modifier,
        shape = RoundedCornerShape(6.dp),
        focusedScale = 1.045f,
    ) { focused ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(PlayBayColors.InkSoft),
        ) {
            GameArt(style = game.artStyle, modifier = Modifier.fillMaxSize())
            Box(
                Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            0f to Color.Transparent,
                            0.38f to Color.Transparent,
                            1f to PlayBayColors.Ink.copy(alpha = 0.92f),
                        ),
                    ),
            )
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(horizontal = 14.dp, vertical = 12.dp),
            ) {
                Eyebrow(
                    text = game.genre,
                    color = if (focused) PlayBayColors.Red else PlayBayColors.Muted,
                )
                Spacer(Modifier.height(3.dp))
                Text(
                    text = game.title,
                    color = PlayBayColors.White,
                    fontSize = 16.sp,
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
    recentlyPlayed: List<RecentGame>,
    onPlay: (Game) -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        recentlyPlayed.forEach { recent ->
            RecentTile(
                recent = recent,
                modifier = Modifier
                    .weight(1f)
                    .height(52.dp),
                onClick = { onPlay(recent.game) },
            )
        }
    }
}

@Composable
private fun RecentTile(
    recent: RecentGame,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    FocusableCard(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(5.dp),
        focusedScale = 1.012f,
        borderColor = PlayBayColors.White.copy(alpha = 0.06f),
    ) { focused ->
        Row(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    if (focused) {
                        PlayBayColors.White.copy(alpha = 0.06f)
                    } else {
                        PlayBayColors.White.copy(alpha = 0.025f)
                    },
                )
                .padding(horizontal = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .width(58.dp)
                    .height(36.dp)
                    .clip(RoundedCornerShape(3.dp)),
            ) {
                GameArt(style = recent.game.artStyle, modifier = Modifier.fillMaxSize())
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = recent.game.title,
                    color = PlayBayColors.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(1.dp))
                Text(
                    text = recent.playedLabel,
                    color = PlayBayColors.Muted,
                    fontSize = 11.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Spacer(Modifier.width(8.dp))
            PlayGlyph(
                tint = if (focused) PlayBayColors.Red else PlayBayColors.Dim,
                size = 9.dp,
            )
            Spacer(Modifier.width(4.dp))
        }
    }
}
