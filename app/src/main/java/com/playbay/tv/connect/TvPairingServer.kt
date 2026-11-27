package com.playbay.tv.connect

import com.playbay.tv.input.InputDirection
import com.playbay.tv.input.InputDispatcher
import com.playbay.tv.input.InputState
import io.ktor.server.application.install
import io.ktor.server.cio.CIO
import io.ktor.server.engine.EmbeddedServer
import io.ktor.server.engine.embeddedServer
import io.ktor.server.routing.routing
import io.ktor.server.websocket.WebSockets
import io.ktor.server.websocket.webSocket
import io.ktor.websocket.CloseReason
import io.ktor.websocket.Frame
import io.ktor.websocket.close
import io.ktor.websocket.readText
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject
import java.net.Inet4Address
import java.net.NetworkInterface
import java.security.SecureRandom
import java.util.concurrent.atomic.AtomicBoolean

/** Protocol revision carried on every message. Bump only on an incompatible change. */
const val PROTOCOL_VERSION = 1

/** Port and path are unchanged from the prototype so paired phones keep working. */
private const val SERVER_PORT = 8765
private const val CONNECT_PATH = "/connect"

private val VALID_ACTIONS = mapOf(
    "UP" to InputDirection.Up,
    "DOWN" to InputDirection.Down,
    "LEFT" to InputDirection.Left,
    "RIGHT" to InputDirection.Right,
)

/**
 * LAN WebSocket host. Owns the pairing code, validates every frame, and pushes
 * accepted input into [InputDispatcher]. It holds no reference to the launcher UI
 * and no reference to Compose, so it can be started, stopped, and restarted
 * independently of the activity.
 */
class TvPairingServer(
    private val onConnectionChanged: (Boolean) -> Unit,
    private val onError: (String) -> Unit,
) {
    private val random = SecureRandom()
    val pairingCode: String = (100000 + random.nextInt(900000)).toString()

    private var engine: EmbeddedServer<*, *>? = null

    /** Guards against a second `start()` racing the first one in. */
    private val running = AtomicBoolean(false)

    private val _status = MutableStateFlow("Starting local server…")
    val status: StateFlow<String> = _status.asStateFlow()

    fun start() {
        if (!running.compareAndSet(false, true)) return
        try {
            engine = embeddedServer(CIO, host = "0.0.0.0", port = SERVER_PORT) {
                install(WebSockets) {
                    // Application-level ping is the liveness check. It costs one
                    // tiny control frame every 15s instead of an ACK per input.
                    pingPeriodMillis = 15_000L
                    timeoutMillis = 30_000L
                }
                routing {
                    webSocket(CONNECT_PATH) {
                        val suppliedCode = call.request.queryParameters["code"]
                        if (suppliedCode != pairingCode) {
                            close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Invalid pairing code"))
                            return@webSocket
                        }

                        // A fresh phone session restarts its sequence counter at 1.
                        InputDispatcher.resetSequence()
                        var heldDirection: InputDirection? = null

                        send(Frame.Text("CONNECTED"))
                        onConnectionChanged(true)
                        _status.value = "Phone connected"

                        try {
                            for (frame in incoming) {
                                if (frame !is Frame.Text) continue
                                val event = parseInput(frame.readText()) ?: continue

                                // tryEmit inside dispatch: the receive loop never
                                // waits on the UI thread or on focus work.
                                val accepted = InputDispatcher.submit(
                                    direction = event.direction,
                                    state = event.state,
                                    sequence = event.sequence,
                                )
                                if (!accepted) continue

                                heldDirection = when (event.state) {
                                    InputState.Pressed -> event.direction
                                    InputState.Released ->
                                        if (heldDirection == event.direction) null else heldDirection
                                }
                            }
                        } finally {
                            // Disconnect, host shutdown, or a dead socket: never leave
                            // a direction latched in the launcher.
                            heldDirection?.let(InputDispatcher::releaseLocally)
                            heldDirection = null
                            InputDispatcher.resetSequence()
                            onConnectionChanged(false)
                            _status.value = "Waiting for phone"
                        }
                    }
                }
            }.start(wait = false)

            _status.value = "Listening on port $SERVER_PORT"
        } catch (error: Exception) {
            running.set(false)
            engine = null
            val message = error.message ?: error::class.simpleName ?: "unknown error"
            _status.value = "Server failed to start: $message"
            onError(message)
        }
    }

    fun stop() {
        if (!running.compareAndSet(true, false)) return
        engine?.stop(gracePeriodMillis = 250, timeoutMillis = 1_000)
        engine = null
    }

    /** Stop, then bind again. Used when the first bind lost a port race. */
    fun restart() {
        stop()
        start()
    }
}

/**
 * Validates one frame. Anything malformed, of the wrong version, or carrying an
 * unknown action/state returns null and is dropped without touching the launcher.
 */
private fun parseInput(raw: String): IncomingInput? {
    val payload = runCatching { JSONObject(raw) }.getOrNull() ?: return null
    if (payload.optInt("v", -1) != PROTOCOL_VERSION) return null
    if (payload.optString("type") != "INPUT") return null

    val direction = VALID_ACTIONS[payload.optString("action")] ?: return null
    val state = when (payload.optString("state")) {
        "PRESSED" -> InputState.Pressed
        "RELEASED" -> InputState.Released
        else -> return null
    }
    val sequence = payload.optLong("sequence", -1L)
    if (sequence <= 0L) return null

    return IncomingInput(direction, state, sequence)
}

private data class IncomingInput(
    val direction: InputDirection,
    val state: InputState,
    val sequence: Long,
)

/** First site-local IPv4 address, i.e. the one a phone on the same LAN can reach. */
fun localIpv4Address(): String? = try {
    NetworkInterface.getNetworkInterfaces().toList()
        .asSequence()
        .filter { it.isUp && !it.isLoopback }
        .flatMap { it.inetAddresses.toList().asSequence() }
        .filterIsInstance<Inet4Address>()
        .firstOrNull { it.isSiteLocalAddress && !it.isLoopbackAddress }
        ?.hostAddress
} catch (_: Exception) {
    null
}
