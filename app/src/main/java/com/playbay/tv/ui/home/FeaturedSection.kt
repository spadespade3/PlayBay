package com.playbay.tv.ui.home

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.playbay.tv.data.Game
import com.playbay.tv.data.PlayBayCatalog
import com.playbay.tv.ui.components.Eyebrow
import com.playbay.tv.ui.components.GameArt
import com.playbay.tv.ui.components.TvButton
import com.playbay.tv.ui.theme.PlayBayColors

@Composable
fun FeaturedSection(
    game: Game,
    onPlay: () -> Unit,
    playFocus: FocusRequester,
    onPlayFocusChanged: ((Boolean) -> Unit)? = null,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(268.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(end = 44.dp),
        ) {
            // Instant text swap — no crossfade, no per-frame text layout churn.
            FeaturedCopy(game)
            Spacer(Modifier.height(16.dp))
            Box(Modifier.onFocusChanged { onPlayFocusChanged?.invoke(it.isFocused) }) {
                TvButton(
                    text = "Play",
                    onClick = onPlay,
                    focusRequester = playFocus,
                    showPlayGlyph = true,
                )
            }
        }

        Box(
            modifier = Modifier
                .weight(1.04f)
                .fillMaxHeight(),
        ) {
            FeaturedArt(game)
        }
    }
}

@Composable
private fun FeaturedCopy(game: Game) {
    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.height(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Eyebrow(text = "Featured", color = PlayBayColors.Red)
            Spacer(Modifier.width(10.dp))
            Box(
                Modifier
                    .width(26.dp)
                    .height(1.dp)
                    .background(PlayBayColors.Line),
            )
        }
        Spacer(Modifier.height(10.dp))
        Text(
            text = game.title,
            style = MaterialTheme.typography.displayLarge,
            color = PlayBayColors.White,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = game.tagline,
            style = MaterialTheme.typography.bodyLarge,
            color = PlayBayColors.Muted,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.fillMaxWidth(0.92f),
        )
        Spacer(Modifier.height(14.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Eyebrow(text = game.genre, color = PlayBayColors.White.copy(alpha = 0.62f))
            Spacer(Modifier.width(10.dp))
            Box(
                Modifier
                    .size(3.dp)
                    .clip(CircleShape)
                    .background(PlayBayColors.Dim),
            )
            Spacer(Modifier.width(10.dp))
            Text(
                text = game.players,
                color = PlayBayColors.Muted,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
            )
        }
    }
}

@Composable
private fun FeaturedArt(game: Game) {
    val index = PlayBayCatalog.games.indexOfFirst { it.id == game.id } + 1
    val total = PlayBayCatalog.games.size
    val label = index.toString().padStart(2, '0') + " / " + total.toString().padStart(2, '0')

    Box(
        modifier = Modifier.fillMaxSize(),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape(10.dp))
                .background(PlayBayColors.InkRaised),
        ) {
            GameArt(style = game.artStyle, modifier = Modifier.fillMaxSize())
            // Single bottom scrim: keeps text readable over the artwork.
            Box(
                Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            0f to Color.Transparent,
                            0.55f to Color.Transparent,
                            1f to PlayBayColors.Ink.copy(alpha = 0.55f),
                        ),
                    ),
            )
            Box(
                Modifier
                    .fillMaxSize()
                    .border(
                        width = 1.dp,
                        color = PlayBayColors.White.copy(alpha = 0.09f),
                        shape = RoundedCornerShape(10.dp),
                    ),
            )
            Eyebrow(
                text = label,
                color = PlayBayColors.White.copy(alpha = 0.72f),
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(16.dp),
            )
        }
    }
}
