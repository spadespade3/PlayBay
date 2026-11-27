package com.playbay.tv.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.playbay.tv.data.Game
import com.playbay.tv.ui.components.Eyebrow
import com.playbay.tv.ui.components.GameArt
import com.playbay.tv.ui.components.TvButton
import com.playbay.tv.ui.theme.PlayBayColors

@Composable
fun FeaturedSection(
    game: Game,
    onPlay: () -> Unit,
    playFocus: androidx.compose.ui.focus.FocusRequester,
    onPlayFocusChanged: ((Boolean) -> Unit)? = null,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(240.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Banner
        Box(
            modifier = Modifier
                .weight(1.2f)
                .fillMaxHeight()
                .clip(RoundedCornerShape(8.dp))
                .background(PlayBayColors.InkRaised),
        ) {
            GameArt(style = game.artStyle, modifier = Modifier.fillMaxSize())
            Box(
                Modifier
                    .fillMaxSize()
                    .border(
                        width = 1.dp,
                        color = PlayBayColors.White.copy(alpha = 0.08f),
                        shape = RoundedCornerShape(8.dp),
                    ),
            )
        }

        Spacer(Modifier.width(32.dp))

        // Info
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(end = 24.dp),
        ) {
            Eyebrow(text = "Featured", color = PlayBayColors.Red)
            Spacer(Modifier.height(8.dp))
            Text(
                text = game.title,
                color = PlayBayColors.White,
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = game.tagline,
                color = PlayBayColors.Muted,
                fontSize = 14.sp,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Eyebrow(text = game.genre, color = PlayBayColors.White.copy(alpha = 0.6f))
                Spacer(Modifier.width(8.dp))
                Text(
                    text = game.players,
                    color = PlayBayColors.Muted,
                    fontSize = 12.sp,
                )
            }
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
    }
}