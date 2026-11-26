package com.playbay.connect.tv

import android.app.Activity
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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.ktor.server.cio.CIO
import io.ktor.server.engine.EmbeddedServer
import io.ktor.server.engine.embeddedServer
import io.ktor.server.websocket.WebSockets
import io.ktor.server.websocket.webSocket
import io.ktor.websocket.CloseReason
import io.ktor.websocket.Frame
import io.ktor.websocket.close
import io.ktor.websocket.readText
import io.ktor.websocket.send
import io.ktor.server.routing.routing
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.Inet4Address
import java.net.NetworkInterface
import java.security.SecureRandom

private const val SERVER_PORT = 8765

class MainActivity : ComponentActivity() {
    private var connected by mutableStateOf(false)
    private var response by mutableStateOf("Waiting for a phone to connect…")
    private var serverStatus by mutableStateOf("Starting local server…")
    private var socketServer: TvSocketServer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val server = TvSocketServer(
            onConnectionChanged = { isConnected ->
                runOnUiThread { connected = isConnected }
            },
            onMessage = { message ->
                runOnUiThread { response = message }
            },
            onError = { error ->
                runOnUiThread { serverStatus = error }
            },
        )
        socketServer = server
        server.start()
        serverStatus = "Server listening on port $SERVER_PORT"

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF09090D),
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
                            color = Color(0xFFFF4057),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 5.sp,
                        )
                        Spacer(Modifier.height(18.dp))
                        Text(
                            text = "Connect a phone",
                            color = Color.White,
                            fontSize = 42.sp,
                            fontWeight = FontWeight.Bold,
                        )
                        Spacer(Modifier.height(12.dp))
                        Text(
                            text = "Connect your phone to the same Wi-Fi network, then enter these details in PlayBay Connect.",
                            color = Color(0xFFB5B5C2),
                            fontSize = 18.sp,
                            textAlign = TextAlign.Center,
                        )
                        Spacer(Modifier.height(34.dp))
                        Surface(
                            modifier = Modifier.fillMaxWidth(0.72f),
                            color = Color(0xFF17171F),
                            shape = RoundedCornerShape(24.dp),
                        ) {
                            Column(
                                modifier = Modifier.padding(28.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                            ) {
                                Text("TV ADDRESS", color = Color(0xFF9292A2), fontSize = 13.sp, letterSpacing = 3.sp)
                                Text(
                                    text = localIpv4Address() ?: "Find TV IP in network settings",
                                    color = Color.White,
                                    fontSize = 27.sp,
                                    fontWeight = FontWeight.SemiBold,
                                )
                                Spacer(Modifier.height(22.dp))
                                Text("PAIRING CODE", color = Color(0xFF9292A2), fontSize = 13.sp, letterSpacing = 3.sp)
                                Text(
                                    text = server.pairingCode,
                                    color = Color(0xFFFF4057),
                                    fontSize = 54.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    letterSpacing = 10.sp,
                                )
                                Spacer(Modifier.height(18.dp))
                                Text(
                                    text = if (connected) "PHONE CONNECTED" else "WAITING FOR CONNECTION",
                                    color = if (connected) Color(0xFF68E6A2) else Color(0xFFB5B5C2),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 2.sp,
                                )
                            }
                        }
                        Spacer(Modifier.height(28.dp))
                        Text(
                            text = response,
                            modifier = Modifier
                                .background(Color(0xFF17171F), RoundedCornerShape(16.dp))
                                .padding(horizontal = 32.dp, vertical = 22.dp),
                            color = if (response == "Full of pixels!") Color(0xFF68E6A2) else Color.White,
                            fontSize = 30.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center,
                        )
                        Spacer(Modifier.height(16.dp))
                        Text(serverStatus, color = Color(0xFF777786), fontSize = 13.sp)
                    }
                }
            }
        }
    }

    override fun onDestroy() {
        socketServer?.stop()
        socketServer = null
        super.onDestroy()
    }
}

private fun localIpv4Address(): String? = try {
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

private class TvSocketServer(
    private val onConnectionChanged: (Boolean) -> Unit,
    private val onMessage: (String) -> Unit,
    private val onError: (String) -> Unit,
) {
    private val random = SecureRandom()
    val pairingCode: String = (100000 + random.nextInt(900000)).toString()
    private var engine: EmbeddedServer<*, *>? = null

    fun start() {
        try {
            engine = embeddedServer(CIO, host = "0.0.0.0", port = SERVER_PORT) {
                install(WebSockets)
                routing {
                    webSocket("/connect") {
                        val suppliedCode = call.request.queryParameters["code"]
                        if (suppliedCode != pairingCode) {
                            close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Invalid pairing code"))
                            return@webSocket
                        }

                        send(Frame.Text("CONNECTED"))
                        onConnectionChanged(true)
                        try {
                            for (frame in incoming) {
                                if (frame is Frame.Text) {
                                    val payload = JSONObject(frame.readText())
                                    if (payload.optString("type") == "HOW_ARE_YOU") {
                                        withContext(Dispatchers.Main) {
                                            onMessage("Full of pixels!")
                                        }
                                    }
                                }
                            }
                        } finally {
                            onConnectionChanged(false)
                        }
                    }
                }
            }.start(wait = false)
        } catch (error: Exception) {
            onError("Could not start local server: ${error.message ?: "unknown error"}")
        }
    }

    fun stop() {
        engine?.stop(gracePeriodMillis = 250, timeoutMillis = 1_000)
        engine = null
    }
}
