package com.playbay.connect.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import io.ktor.client.HttpClient
import io.ktor.client.engine.okhttp.OkHttp
import io.ktor.client.plugins.websocket.WebSockets
import io.ktor.client.plugins.websocket.webSocketSession
import io.ktor.client.plugins.websocket.DefaultClientWebSocketSession
import io.ktor.websocket.Frame
import io.ktor.websocket.readText
import io.ktor.websocket.close
import io.ktor.websocket.send
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MaterialTheme { ControllerScreen() } }
    }
}

@Composable
private fun ControllerScreen() {
    val client = remember {
        HttpClient(OkHttp) {
            install(WebSockets)
        }
    }
    val scope = rememberCoroutineScope()
    var host by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("Enter the TV address and pairing code.") }
    var statusColor by remember { mutableStateOf(Color(0xFFCACAD4)) }
    var session by remember { mutableStateOf<DefaultClientWebSocketSession?>(null) }
    var connecting by remember { mutableStateOf(false) }
    var sending by remember { mutableStateOf(false) }

    DisposableEffect(client) {
        onDispose {
            session?.let { active -> scope.launch { active.close() } }
            client.close()
        }
    }

    Surface(modifier = Modifier.fillMaxSize(), color = Color(0xFF09090D)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 28.dp, vertical = 34.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text("PLAYBAY", color = Color(0xFFFF4057), fontSize = 15.sp, fontWeight = FontWeight.Bold, letterSpacing = 5.sp)
            Text("CONNECT", color = Color.White, fontSize = 34.sp, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(10.dp))
            Text(
                text = if (session == null) "Connect to your TV" else "You're connected",
                color = Color(0xFFB5B5C2),
                fontSize = 16.sp,
            )
            Spacer(Modifier.height(28.dp))

            OutlinedTextField(
                value = host,
                onValueChange = { host = it.trim() },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("TV IP address") },
                placeholder = { Text("192.168.1.25") },
                singleLine = true,
                enabled = session == null && !connecting,
                colors = fieldColors(),
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = code,
                onValueChange = { code = it.filter(Char::isDigit).take(6) },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("6-digit pairing code") },
                placeholder = { Text("123456") },
                singleLine = true,
                enabled = session == null && !connecting,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                colors = fieldColors(),
            )
            Spacer(Modifier.height(18.dp))

            if (session == null) {
                Button(
                    onClick = {
                        scope.launch {
                            connecting = true
                            status = "Connecting to PlayBay TV…"
                            try {
                                val cleanHost = host.trim().removePrefix("ws://").removePrefix("http://").trimEnd('/')
                                require(cleanHost.isNotBlank()) { "Enter the TV's IP address." }
                                require(code.length == 6) { "Enter the 6-digit pairing code." }
                                val newSession = client.webSocketSession(
                                    urlString = "ws://$cleanHost:8765/connect?code=$code",
                                )
                                val greeting = newSession.incoming.receive()
                                if (greeting !is Frame.Text || greeting.readText() != "CONNECTED") {
                                    newSession.close()
                                    error("The TV rejected the pairing code.")
                                }
                                session = newSession
                                status = "Connected! Send your first message."
                                statusColor = Color(0xFF68E6A2)
                            } catch (error: CancellationException) {
                                throw error
                            } catch (error: Exception) {
                                status = error.message ?: "Connection failed. Check the address and code."
                                statusColor = Color(0xFFFF6B6B)
                            } finally {
                                connecting = false
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(54.dp),
                    enabled = !connecting,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF4057)),
                ) {
                    Text(if (connecting) "CONNECTING…" else "CONNECT", fontWeight = FontWeight.Bold)
                }
            } else {
                Button(
                    onClick = {
                        scope.launch {
                            sending = true
                            status = "Sending message to PlayBay TV..."
                            statusColor = Color(0xFFFFB347)
                            try {
                                val activeSession = session ?: error("Not connected to a TV.")
                                activeSession.send(Frame.Text("""{"type":"HOW_ARE_YOU"}"""))
                                val ackFrame = withTimeoutOrNull(5_000) { activeSession.incoming.receive() }
                                if (ackFrame == null) {
                                    status = "Message failed: the TV did not acknowledge it."
                                    statusColor = Color(0xFFFF6B6B)
                                } else if (ackFrame is Frame.Text) {
                                    val ack = JSONObject(ackFrame.readText())
                                    if (ack.optString("type") == "ACK" &&
                                        ack.optString("request") == "HOW_ARE_YOU"
                                    ) {
                                        val count = ack.optInt("count", 0)
                                        status = if (count > 0) {
                                            "TV received your message! ($count)"
                                        } else {
                                            "TV received your message!"
                                        }
                                        statusColor = Color(0xFF68E6A2)
                                    } else {
                                        status = "Message failed: unexpected TV response."
                                        statusColor = Color(0xFFFF6B6B)
                                    }
                                } else {
                                    status = "Message failed: invalid TV response."
                                    statusColor = Color(0xFFFF6B6B)
                                }
                            } catch (error: CancellationException) {
                                throw error
                            } catch (error: Exception) {
                                status = "Message failed: ${error.message ?: "connection lost"}"
                                statusColor = Color(0xFFFF6B6B)
                                session = null
                            } finally {
                                sending = false
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(62.dp),
                    enabled = !sending,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF4057)),
                ) {
                    Text(if (sending) "SENDING..." else "HOW ARE YOU?", fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp)
                }
                Spacer(Modifier.height(10.dp))
                Button(
                    onClick = {
                        scope.launch {
                            session?.close()
                            session = null
                            status = "Disconnected."
                            statusColor = Color(0xFFCACAD4)
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF292933)),
                ) {
                    Text("DISCONNECT")
                }
            }

            Spacer(Modifier.height(22.dp))
            Text(
                text = status,
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF17171F), RoundedCornerShape(14.dp))
                    .padding(16.dp),
                color = statusColor,
                textAlign = TextAlign.Center,
                fontSize = 14.sp,
            )
            Spacer(Modifier.height(16.dp))
            Text("Both devices must be on the same local network.", color = Color(0xFF777786), fontSize = 12.sp)
        }
    }
}

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedTextColor = Color.White,
    unfocusedTextColor = Color.White,
    focusedBorderColor = Color(0xFFFF4057),
    unfocusedBorderColor = Color(0xFF42424D),
    focusedLabelColor = Color(0xFFFF7182),
    unfocusedLabelColor = Color(0xFF9292A2),
    cursorColor = Color(0xFFFF4057),
)
