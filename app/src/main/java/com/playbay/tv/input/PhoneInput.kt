package com.playbay.tv.input

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

enum class InputDirection {
    Up,
    Down,
    Left,
    Right,
}

enum class InputState {
    Pressed,
    Released,
}

enum class InputSource {
    /** Normalized event that arrived over the LAN WebSocket from the phone. */
    Phone,

    /** Locally synthesized release, e.g. on disconnect or lifecycle pause. */
    Local,
}

data class InputEvent(
    val direction: InputDirection,
    val state: InputState,
    val sequence: Long,
    val source: InputSource,
)

/**
 * The single normalized boundary between input sources and the launcher.
 *
 * Phone input is decoded and validated by [com.playbay.tv.connect.TvPairingServer]
 * and handed here; physical remote and gamepad input reach the launcher through
 * the platform focus system directly. Both end at the same navigation call, so
 * the launcher UI never knows where a direction came from.
 *
 * Sequence bookkeeping lives here and nowhere else. Two counters is how you get
 * inputs silently dropped after the first direction change.
 */
object InputDispatcher {

    private val _events = MutableSharedFlow<InputEvent>(
        replay = 0,
        extraBufferCapacity = 32,
        onBufferOverflow = BufferOverflow.DROP_OLDEST,
    )

    val events: SharedFlow<InputEvent> = _events.asSharedFlow()

    @Volatile
    private var lastSequence: Long = 0L

    /**
     * Accepts a phone-supplied event. Returns false when [sequence] is not strictly
     * newer than the last accepted one, which drops replayed, duplicated, and
     * out-of-order frames before they can move focus twice.
     */
    fun submit(direction: InputDirection, state: InputState, sequence: Long): Boolean {
        if (sequence <= lastSequence) return false
        lastSequence = sequence
        return _events.tryEmit(InputEvent(direction, state, sequence, InputSource.Phone))
    }

    /**
     * Synthesizes a release for a direction we believe is held. Used when the phone
     * drops off or the host pauses; it carries no phone sequence number and never
     * advances [lastSequence], so a later phone frame cannot be rejected because of it.
     */
    fun releaseLocally(direction: InputDirection) {
        _events.tryEmit(InputEvent(direction, InputState.Released, lastSequence, InputSource.Local))
    }

    /**
     * The phone restarts its counter at 1 on every connection, so the accepted
     * high-water mark has to restart with it.
     */
    fun resetSequence() {
        lastSequence = 0L
    }
}
