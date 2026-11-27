package com.playbay.tv.connect

import android.app.Application
import androidx.compose.runtime.Immutable
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Immutable
data class ConnectionState(
    val phoneConnected: Boolean = false,
    /** True once a phone has paired at least once this process, so we stop showing the gate. */
    val hasPaired: Boolean = false,
    val serverStatus: String = "Starting local server…",
)

/**
 * Owns the LAN server for the lifetime of the launcher. Scoped to the activity's
 * ViewModel store, so an orientation or theme change does not tear the socket down
 * and does not lose the pairing code.
 */
class LauncherConnectionViewModel(application: Application) : AndroidViewModel(application) {

    private val server = TvPairingServer(
        onConnectionChanged = { connected ->
            viewModelScope.launch(Dispatchers.Main.immediate) {
                _state.update { current ->
                    current.copy(
                        phoneConnected = connected,
                        hasPaired = current.hasPaired || connected,
                    )
                }
            }
        },
        onError = { /* surfaced through [ConnectionState.serverStatus] */ },
    )

    private val _state = MutableStateFlow(ConnectionState())
    val state: StateFlow<ConnectionState> = _state.asStateFlow()

    val pairingCode: String = server.pairingCode

    /** Resolved once; a DHCP lease change mid-session is out of scope for this increment. */
    val ipAddress: String? = localIpv4Address()

    init {
        startServer()
    }

    private fun startServer() {
        viewModelScope.launch(Dispatchers.IO) {
            server.start()
            server.status.collect { status ->
                withContext(Dispatchers.Main.immediate) {
                    _state.update { it.copy(serverStatus = status) }
                }
            }
        }
    }

    /** Rebind the port after a failed start, without losing the pairing code. */
    fun retryServer() {
        viewModelScope.launch(Dispatchers.IO) { server.restart() }
    }

    override fun onCleared() {
        server.stop()
        super.onCleared()
    }
}
