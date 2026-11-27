package com.playbay.tv

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.playbay.tv.connect.LauncherConnectionViewModel
import com.playbay.tv.connect.PairingScreen
import com.playbay.tv.connect.ReconnectBar
import com.playbay.tv.input.PhoneNavigationEffect
import com.playbay.tv.ui.home.HomeScreen
import com.playbay.tv.ui.home.HomeViewModel
import com.playbay.tv.ui.home.SettingsPanel

@Composable
fun PlayBayApp(
    homeViewModel: HomeViewModel = viewModel(),
    connectionViewModel: LauncherConnectionViewModel = viewModel(),
) {
    val homeState by homeViewModel.uiState.collectAsState()
    val connection by connectionViewModel.state.collectAsState()
    var settingsOpen by rememberSaveable { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
        if (!connection.hasPaired) {
            // Startup gate: nothing of the launcher is composed until a phone has
            // paired, so the pairing code is the only thing on screen.
            PairingScreen(
                ipAddress = connectionViewModel.ipAddress,
                pairingCode = connectionViewModel.pairingCode,
                serverStatus = connection.serverStatus,
                connected = connection.phoneConnected,
                retryable = connection.serverStatus.startsWith("Server failed"),
                onRetry = connectionViewModel::retryServer,
            )
        } else {
            // From the first successful pairing onward the launcher stays composed.
            // A dropped phone does not send the viewer back to the gate and does not
            // reset focus, scroll position, or highlighted game.
            HomeScreen(
                state = homeState,
                onGameFocused = homeViewModel::onGameFocused,
                onPlay = homeViewModel::onPlayPressed,
                onOpenSettings = { settingsOpen = true },
            )

            PhoneNavigationEffect(enabled = true)

            if (!connection.phoneConnected) {
                ReconnectBar(
                    pairingCode = connectionViewModel.pairingCode,
                    onRetryServer = connectionViewModel::retryServer,
                    modifier = Modifier
                        .align(Alignment.BottomCenter),
                )
            }
        }

        if (settingsOpen) {
            SettingsPanel(onClose = { settingsOpen = false })
        }
    }
}
