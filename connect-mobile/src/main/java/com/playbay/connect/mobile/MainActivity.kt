package com.playbay.connect.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import io.ktor.client.HttpClient
import io.ktor.client.engine.okhttp.OkHttp
import io.ktor.client.plugins.websocket.DefaultClientWebSocketSession
import io.ktor.client.plugins.websocket.WebSockets
import io.ktor.client.plugins.websocket.webSocketSession
import io.ktor.websocket.Frame
import io.ktor.websocket.close
import io.ktor.websocket.readText
import io.ktor.websocket.send
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicReference

/** Protocol revision. Must match PROTOCOL_VERSION on the TV. */
private const val PROTOCOL_VERSION = 1

private const val HOLD_DELAY_MS = 300L
private const val REPEAT_MS = 110L

private val Ink = Color(0xFF09090D)
private val InkRaised = Color(0xFF17171F)
private val Red = Color(0xFFFF4057)
private val Btn = Color(0xFF1A1A22)
private val Outline = Color(0xFF42424D)
private val Done = Color(0xFF68E6A2)
private val Warn = Color(0xFFFFB347)
private val Bad = Color(0xFFFF6B6B)
private val Quiet = Color(0xFFCACAD4)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MaterialTheme { ControllerScreen() } }
    }
}

@Composable
private fun ControllerScreen() {
    val client = remember { HttpClient(OkHttp) { install(WebSockets) } }
    val scope = rememberCoroutineScope()
    val lifecycleOwner = LocalLifecycleOwner.current

    var host by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("Enter the TV address and pairing code.") }
    var statusColor by remember { mutableStateOf(Quiet) }
    var session by remember { mutableStateOf<DefaultClientWebSocketSession?>(null) }
    var connecting by remember { mutableStateOf(false) }
    var activeDirection by remember { mutableStateOf<String?>(null) }

    // Non-snapshot guard so two fingers landing in the same frame cannot both win.
    val holdGuard = remember { AtomicReference<String?>(null) }
    val repeatJob = remember { AtomicReference<Job?>(null) }
    var sequence by remember { mutableLongStateOf(0L) }

    fun sendInput(direction: String, state: String) {
        val active = session ?: return
        sequence += 1
        val frame = """{"v":$PROTOCOL_VERSION,"type":"INPUT","action":"$direction",""" +
            """"state":"$state","sequence":$sequence}"""
        scope.launch {
            try {
                active.send(Frame.Text(frame))
            } catch (_: Exception) {
                if (session === active) {
                    session = null
                    activeDirection = null
                    holdGuard.set(null)
                    status = "Connection lost while sending. Reconnect to continue."
                    statusColor = Bad
                }
            }
        }
    }

    fun releaseHeld() {
        val direction = holdGuard.getAndSet(null) ?: return
        repeatJob.getAndSet(null)?.cancel()
        activeDirection = null
        sendInput(direction, "RELEASED")
    }

    fun startHold(direction: String) {
        if (!holdGuard.compareAndSet(null, direction)) return
        activeDirection = direction
        repeatJob.getAndSet(null)?.cancel()
        repeatJob.set(
            scope.launch {
                sendInput(direction, "PRESSED")
                delay(HOLD_DELAY_MS)
                while (isActive && holdGuard.get() == direction) {
                    sendInput(direction, "PRESSED")
                    delay(REPEAT_MS)
                }
            },
        )
    }

    fun endHold(direction: String) {
        if (holdGuard.compareAndSet(direction, null)) {
            repeatJob.getAndSet(null)?.cancel()
            activeDirection = null
            sendInput(direction, "RELEASED")
        }
    }

    // A backgrounded or locked phone must not leave a direction latched on the TV.
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_PAUSE || event == Lifecycle.Event.ON_STOP) {
                releaseHeld()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            releaseHeld()
        }
    }

    DisposableEffect(client) {
        onDispose {
            val active = session
            session = null
            scope.launch { runCatching { active?.close() } }
            client.close()
        }
    }

    Surface(modifier = Modifier.fillMaxSize(), color = Ink) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 26.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                text = "PLAYBAY",
                color = Red,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 5.sp,
            )
            Text(
                text = "CONNECT",
                color = Color.White,
                fontSize = 34.sp,
                fontWeight = FontWeight.ExtraBold,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = if (session == null) "Not connected" else "Controlling your TV",
                color = Color(0xFFB5B5C2),
                fontSize = 16.sp,
            )
            Spacer(Modifier.height(26.dp))

            if (session == null) {
                ConnectForm(
                    host = host,
                    code = code,
                    connecting = connecting,
                    onHostChange = { host = it },
                    onCodeChange = { code = it },
                    onConnect = {
                        scope.launch {
                            connecting = true
                            status = "Connecting to PlayBay TV…"
                            statusColor = Warn
                            try {
                                val cleanHost = host.trim()
                                    .removePrefix("ws://")
                                    .removePrefix("http://")
                                    .trimEnd('/')
                                require(cleanHost.isNotBlank()) { "Enter the TV's IP address." }
                                require(code.length == 6) { "Enter the 6-digit pairing code." }

                                val newSession = client.webSocketSession(
                                    urlString = "ws://$cleanHost:8765/connect?code=$code",
                                )
                                val greeting = newSession.incoming.receive()
                                if (greeting !is Frame.Text || greeting.readText() != "CONNECTED") {
                                    runCatching { newSession.close() }
                                    error("The TV rejected the pairing code.")
                                }

                                sequence = 0L
                                session = newSession
                                status = "Connected. Use the D-pad."
                                statusColor = Done

                                // Drains the socket so a TV-side close or a failed
                                // ping is noticed immediately instead of on the next tap.
                                scope.launch {
                                    try {
                                        for (frame in newSession.incoming) {
                                            if (frame is Frame.Close) break
                                        }
                                    } catch (cancelled: CancellationException) {
                                        throw cancelled
                                    } catch (_: Exception) {
                                        // falls through to the cleanup below
                                    } finally {
                                        if (session === newSession) {
                                            session = null
                                            activeDirection = null
                                            holdGuard.set(null)
                                            repeatJob.getAndSet(null)?.cancel()
                                            status = "TV connection lost. Reconnect to continue."
                                            statusColor = Bad
                                        }
                                    }
                                }
                            } catch (error: CancellationException) {
                                throw error
                            } catch (error: Exception) {
                                status = error.message ?: "Connection failed."
                                statusColor = Bad
                            } finally {
                                connecting = false
                            }
                        }
                    },
                )
            } else {
                DPad(
                    activeDirection = activeDirection,
                    onPress = ::startHold,
                    onRelease = ::endHold,
                )
                Spacer(Modifier.height(20.dp))
                Button(
                    onClick = {
                        val active = session
                        session = null
                        releaseHeld()
                        scope.launch { runCatching { active?.close() } }
                        status = "Disconnected."
                        statusColor = Quiet
                    },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF292933)),
                ) {
                    Text("DISCONNECT", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                }
            }

            Spacer(Modifier.height(20.dp))
            Text(
                text = status,
                modifier = Modifier
                    .fillMaxWidth()
                    .background(InkRaised, RoundedCornerShape(14.dp))
                    .padding(16.dp),
                color = statusColor,
                textAlign = TextAlign.Center,
                fontSize = 14.sp,
            )
            Spacer(Modifier.height(14.dp))
            Text(
                text = "Both devices must be on the same Wi-Fi network.",
                color = Color(0xFF777786),
                fontSize = 12.sp,
            )
        }
    }
}

@Composable
private fun ConnectForm(
    host: String,
    code: String,
    connecting: Boolean,
    onHostChange: (String) -> Unit,
    onCodeChange: (String) -> Unit,
    onConnect: () -> Unit,
) {
    OutlinedTextField(
        value = host,
        onValueChange = { onHostChange(it.trim()) },
        modifier = Modifier.fillMaxWidth(),
        label = { Text("TV IP address") },
        placeholder = { Text("192.168.1.25") },
        singleLine = true,
        enabled = !connecting,
        colors = fieldColors(),
    )
    Spacer(Modifier.height(12.dp))
    OutlinedTextField(
        value = code,
        onValueChange = { onCodeChange(it.filter(Char::isDigit).take(6)) },
        modifier = Modifier.fillMaxWidth(),
        label = { Text("6-digit pairing code") },
        placeholder = { Text("123456") },
        singleLine = true,
        enabled = !connecting,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
        colors = fieldColors(),
    )
    Spacer(Modifier.height(18.dp))
    Button(
        onClick = onConnect,
        modifier = Modifier.fillMaxWidth().height(54.dp),
        enabled = !connecting,
        colors = ButtonDefaults.buttonColors(containerColor = Red),
    ) {
        Text(
            text = if (connecting) "CONNECTING…" else "CONNECT",
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp,
        )
    }
}

@Composable
private fun DPad(
    activeDirection: String?,
    onPress: (String) -> Unit,
    onRelease: (String) -> Unit,
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        DirectionButton("▲", "UP", activeDirection == "UP", onPress, onRelease)
        Spacer(Modifier.height(10.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            DirectionButton("◀", "LEFT", activeDirection == "LEFT", onPress, onRelease)
            Spacer(Modifier.width(10.dp))
            Box(
                modifier = Modifier
                    .size(84.dp)
                    .border(2.dp, Outline, CircleShape),
            )
            Spacer(Modifier.width(10.dp))
            DirectionButton("▶", "RIGHT", activeDirection == "RIGHT", onPress, onRelease)
        }
        Spacer(Modifier.height(10.dp))
        DirectionButton("▼", "DOWN", activeDirection == "DOWN", onPress, onRelease)
    }
}

@Composable
private fun DirectionButton(
    label: String,
    direction: String,
    active: Boolean,
    onPress: (String) -> Unit,
    onRelease: (String) -> Unit,
) {
    Box(
        modifier = Modifier
            .size(96.dp)
            .background(if (active) Red else Btn, CircleShape)
            .border(2.dp, if (active) Color.White else Outline, CircleShape)
            .pointerInput(direction) {
                awaitEachGesture {
                    awaitFirstDown(requireUnconsumed = false)
                    onPress(direction)
                    // Returns null only when the gesture is cancelled; either way
                    // the release has to go out so the TV never latches.
                    waitForUpOrCancellation()
                    onRelease(direction)
                }
            },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            color = Color.White,
            fontSize = 30.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedTextColor = Color.White,
    unfocusedTextColor = Color.White,
    focusedBorderColor = Red,
    unfocusedBorderColor = Outline,
    focusedLabelColor = Color(0xFFFF7182),
    unfocusedLabelColor = Color(0xFF9292A2),
    cursorColor = Red,
)
