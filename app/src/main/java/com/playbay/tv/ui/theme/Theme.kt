package com.playbay.tv.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.sp

object PlayBayColors {
    val Ink = Color(0xFF060608)
    val InkRaised = Color(0xFF0D0D11)
    val InkSoft = Color(0xFF141419)
    val White = Color(0xFFF5F3EF)
    val Muted = Color(0xFF9C9CA6)
    val Dim = Color(0xFF62626C)
    val Line = Color(0xFF232329)
    val Red = Color(0xFFE4262C)
    val RedDeep = Color(0xFF82141A)
}

private val PlayBayColorScheme = darkColorScheme(
    primary = PlayBayColors.Red,
    onPrimary = PlayBayColors.White,
    background = PlayBayColors.Ink,
    onBackground = PlayBayColors.White,
    surface = PlayBayColors.InkRaised,
    onSurface = PlayBayColors.White,
    surfaceVariant = PlayBayColors.InkSoft,
    onSurfaceVariant = PlayBayColors.Muted,
    outline = PlayBayColors.Line,
)

private val PlayBayTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 52.sp,
        lineHeight = 56.sp,
        letterSpacing = (-1.2).sp,
    ),
    headlineLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 40.sp,
        lineHeight = 44.sp,
        letterSpacing = (-0.8).sp,
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp,
        lineHeight = 26.sp,
        letterSpacing = 0.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 18.sp,
        lineHeight = 27.sp,
        letterSpacing = 0.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        lineHeight = 22.sp,
        letterSpacing = 0.1.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 2.4.sp,
    ),
)

/**
 * The layout is authored against a 1280 x 720 dp television surface. Density is
 * rescaled from the physical height so the same proportions hold on 540p, 720p
 * and 1080p panels without a second set of dimensions.
 */
@Composable
fun PlayBayTheme(content: @Composable () -> Unit) {
    val density = LocalDensity.current
    val configuration = LocalConfiguration.current
    val factor = (configuration.screenHeightDp / 720f).coerceIn(0.6f, 1.6f)
    val scaledDensity = remember(density, factor) {
        Density(density.density * factor, density.fontScale)
    }

    CompositionLocalProvider(LocalDensity provides scaledDensity) {
        MaterialTheme(
            colorScheme = PlayBayColorScheme,
            typography = PlayBayTypography,
            content = content,
        )
    }
}
