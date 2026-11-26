package com.playbay.tv.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.playbay.tv.data.Game
import com.playbay.tv.data.PlayBayCatalog
import com.playbay.tv.data.RecentGame
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class HomeUiState(
    val games: List<Game> = PlayBayCatalog.games,
    val recentlyPlayed: List<RecentGame> = PlayBayCatalog.recentlyPlayed,
    val featuredId: String = PlayBayCatalog.games.first().id,
    val message: String? = null,
) {
    val featured: Game
        get() = games.firstOrNull { it.id == featuredId } ?: games.first()
}

class HomeViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private var messageJob: Job? = null

    fun onGameFocused(gameId: String) {
        if (_uiState.value.featuredId == gameId) return
        _uiState.update { state -> state.copy(featuredId = gameId) }
    }

    fun onPlayPressed(game: Game) {
        messageJob?.cancel()
        _uiState.update { state ->
            state.copy(message = "${game.title} · game launch arrives in a later build.")
        }
        messageJob = viewModelScope.launch {
            delay(3200)
            _uiState.update { state -> state.copy(message = null) }
        }
    }
}
