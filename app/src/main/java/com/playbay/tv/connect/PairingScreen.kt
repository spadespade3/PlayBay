package com.playbay.tv.connect

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.playbay.tv.ui.theme.PlayBayColors

private val ConnectedGreen = Color(0xFF68E6A2)

@Composable
fun PairingScreen(
    ipAddress: String?,
    pairingCode: String,
    serverStatus: String,
    connected: Boolean,
    retryable: Boolean,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = PlayBayColors.Ink,
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 72.dp, vertical = 48.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                text = "PLAYBAY CONNECT",
                color = PlayBayColors.Red,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 5.sp,
            )
            Spacer(Modifier.height(18.dp))
            Text(
                text = "Connect your phone",
                color = PlayBayColors.White,
                fontSize = 42.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = "Open PlayBay Connect on your phone, enter the TV address " +
                    "and the pairing code, then tap Connect.",
                color = PlayBayColors.Muted,
                fontSize = 18.sp,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(34.dp))

            Surface(
                modifier = Modifier.fillMaxWidth(0.72f),
                color = PlayBayColors.InkRaised,
                shape = RoundedCornerShape(24.dp),
            ) {
                Column(
                    modifier = Modifier.padding(28.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        text = "TV ADDRESS",
                        color = PlayBayColors.Dim,
                        fontSize = 13.sp,
                        letterSpacing = 3.sp,
                    )
                    Text(
                        text = ipAddress ?: "No Wi-Fi address found — check TV network settings",
                        color = PlayBayColors.White,
                        fontSize = 27.sp,
                        fontWeight = FontWeight.SemiBold,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(Modifier.height(22.dp))
                    Text(
                        text = "PAIRING CODE",
                        color = PlayBayColors.Dim,
                        fontSize = 13.sp,
                        letterSpacing = 3.sp,
                    )
                    Text(
                        text = pairingCode,
                        color = PlayBayColors.Red,
                        fontSize = 54.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 10.sp,
                    )
                    Spacer(Modifier.height(18.dp))
                    Text(
                        text = if (connected) "PHONE CONNECTED" else "WAITING FOR CONNECTION",
                        color = if (connected) ConnectedGreen else PlayBayColors.Muted,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp,
                    )
                }
            }

            Spacer(Modifier.height(24.dp))
            Text(
                text = serverStatus,
                color = PlayBayColors.Dim,
                fontSize = 13.sp,
                textAlign = TextAlign.Center,
            )

            if (retryable) {
                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = onRetry,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = PlayBayColors.Red,
                        contentColor = PlayBayColors.White,
                    ),
                ) {
                    Text("RETRY SERVER", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                }
            }
        }
    }
}

/** Slim, non-blocking strip shown when the phone drops while the launcher is running. */
@Composable
fun ReconnectBar(
    pairingCode: String,
    onRetryServer: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier
            .padding(bottom = 24.dp)
            .border(1.dp, PlayBayColors.RedDeep, RoundedCornerShape(14.dp)),
        color = PlayBayColors.InkRaised,
        shape = RoundedCornerShape(14.dp),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "Phone disconnected",
                color = PlayBayColors.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = "   ·   reconnect with code ",
                color = PlayBayColors.Muted,
                fontSize = 14.sp,
            )
            Text(
                text = pairingCode,
                color = PlayBayColors.Red,
                fontSize = 15.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 2.sp,
            )
            Text(
                text = "   ·   the remote still works",
                color = PlayBayColors.Muted,
                fontSize = 14.sp,
            )
            Spacer(Modifier.width(14.dp))
            Text(
                text = "RESTART HOST",
                color = PlayBayColors.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                modifier = Modifier
                    .clickable(onClick = onRetryServer)
                    .background(PlayBayColors.InkSoft, RoundedCornerShape(8.dp))
                    .padding(horizontal = 10.dp, vertical = 6.dp),
            )
        }
    }
}
