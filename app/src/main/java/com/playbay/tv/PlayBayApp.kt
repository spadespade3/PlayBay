package com.playbay.tv

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.playbay.tv.ui.home.HomeScreen
import com.playbay.tv.ui.home.HomeViewModel
import com.playbay.tv.ui.home.SettingsPanel

@Composable
fun PlayBayApp(viewModel: HomeViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsState()
    var settingsOpen by rememberSaveable { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
        HomeScreen(
            state = state,
            onGameFocused = viewModel::onGameFocused,
            onPlay = viewModel::onPlayPressed,
            onOpenSettings = { settingsOpen = true },
        )
        if (settingsOpen) {
            SettingsPanel(onClose = { settingsOpen = false })
        }
    }
}
