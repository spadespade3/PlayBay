package com.playbay.tv.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.playbay.tv.ui.theme.PlayBayColors

/**
 * Simple solid background. No gradients, bloom, or decorative effects.
 */
@Composable
fun PlayBayBackdrop(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(PlayBayColors.Ink),
    )
}