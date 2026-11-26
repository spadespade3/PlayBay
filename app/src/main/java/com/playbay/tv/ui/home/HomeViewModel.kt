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
    val featured: Game?
        get() = games.firstOrNull { it.id == featuredId } ?: games.firstOrNull()
}

class HomeViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private var messageJob: Job? = null
    private var featuredJob: Job? = null

    fun onGameFocused(gameId: String) {
        if (_uiState.value.featuredId == gameId) return
        featuredJob?.cancel()
        featuredJob = viewModelScope.launch {
            delay(180)
            _uiState.update { state ->
                if (state.games.any { it.id == gameId }) state.copy(featuredId = gameId)
                else state
            }
        }
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
