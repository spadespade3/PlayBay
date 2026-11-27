package com.playbay.tv.input

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager

private fun InputDirection.toFocusDirection(): FocusDirection = when (this) {
    InputDirection.Up -> FocusDirection.Up
    InputDirection.Down -> FocusDirection.Down
    InputDirection.Left -> FocusDirection.Left
    InputDirection.Right -> FocusDirection.Right
}

/**
 * Bridges normalized [InputEvent]s onto the platform focus system.
 *
 * Physical remote and gamepad input already arrive here through the platform, so
 * this is not a parallel navigation path: a phone press ends in the same
 * `moveFocus` call the platform makes for a hardware D-pad. That is why focus
 * behaves identically from either source and why the launcher UI needs no change.
 *
 * Releases are ignored on purpose — this launcher has no hold semantics, and the
 * phone controls its own repeat rate.
 */
@Composable
fun PhoneNavigationEffect(enabled: Boolean) {
    val focusManager = LocalFocusManager.current

    LaunchedEffect(enabled) {
        if (!enabled) return@LaunchedEffect
        InputDispatcher.events.collect { event ->
            if (event.state != InputState.Pressed) return@collect
            focusManager.moveFocus(event.direction.toFocusDirection())
        }
    }
}
