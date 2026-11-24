/* PlayBay · Neon Pong player screen */
import { getSettings, recordMatch, recordPlay } from '../store.js';
import { net } from '../net.js';
import { audio } from '../audio.js';
import { confetti, icon } from '../ui.js';
import { PongEngine, PONG } from '../games/pong.js';

const W = PONG.W;
const H = PONG.H;
const MODE_LABEL = { cpu: 'VS CPU', local: 'Local 2P', host: 'Host Online', guest: 'Join Online' };
const ALLOWED_MODES = new Set(Object.keys(MODE_LABEL));

export function mount(root, params = {}) {
  const mode = ALLOWED_MODES.has(params.mode) ? params.mode : 'cpu';
  const gameId = params.id === 'neon-pong' ? params.id : 'neon-pong';
  if ((mode === 'host' && (!net.inRoom || !net.isHost)) || (mode === 'guest' && (!net.inRoom || net.isHost))) {
    window.location.hash = '#/multiplayer';
    return () => {};
  }

  const settings = getSettings();
  const difficulty = ['chill', 'normal', 'insane'].includes(settings.difficulty) ? settings.difficulty : 'normal';
  const names = mode === 'local' ? ['P1', 'P2'] : [settings.name || 'Player One', 'Opponent'];
  const engine = new PongEngine({ mode, difficulty, target: PONG.TARGET, names });

  root.innerHTML = `
    <div class="player-top">
      <div class="player-top__title"><strong>Neon Pong</strong><span>${MODE_LABEL[mode]}</span></div>
      <div class="player-actions">
        <button type="button" class="btn btn--icon" data-action="pause" data-icon="pause" aria-label="Pause"></button>
        <button type="button" class="btn btn--icon" data-action="restart" data-icon="restart" aria-label="Restart"></button>
        <button type="button" class="btn btn--icon" data-action="menu" data-icon="x" aria-label="Menu"></button>
      </div>
      <div class="player-meta"><span class="net-pill" data-state="local">Local play</span></div>
    </div>
    <div class="stage">
      <div class="stage__frame"><canvas id="pongCanvas" class="stage__canvas" aria-label="Neon Pong game field"></canvas></div>
      <div class="stage__overlay" style="display:none">
        <div class="overlay-card">
          <span class="overlay-card__icon"><span data-icon="info"></span></span>
          <h2 id="overlayTitle">Get ready</h2>
          <p id="overlayText">First to seven takes the set.</p>
          <div class="overlay-score" id="overlayScore" style="display:none"><span>0</span><em>-</em><span class="p2">0</span></div>
          <div class="btn-row" id="overlayActions"></div>
        </div>
      </div>
    </div>
    <div class="player-foot">
      <span class="hint">${mode === 'local' ? 'P1: W/S · P2: ↑/↓' : 'W/S or ↑/↓ move'} · P/Esc pause · R restart · Mouse/touch drag</span>
      <span class="hint"><span data-icon="gamepad"></span> Gamepad supported</span>
    </div>
  `;

  const canvas = root.querySelector('#pongCanvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) {
    root.textContent = 'Your browser could not create a 2D canvas for Neon Pong.';
    return () => {};
  }
  const frame = root.querySelector('.stage__frame');
  const overlay = root.querySelector('.stage__overlay');
  const overlayIcon = root.querySelector('.overlay-card__icon');
  const overlayTitle = root.querySelector('#overlayTitle');
  const overlayText = root.querySelector('#overlayText');
  const overlayScore = root.querySelector('#overlayScore');
  const overlayActions = root.querySelector('#overlayActions');
  const playerTitle = root.querySelector('.player-top__title');
  const netPill = root.querySelector('.net-pill');

  let raf = 0;
  let last = performance.now();
  let lastPhase = engine.phase;
  let overlayKind = null;
  let overlaySignature = '';
  let lastSent = 0;
  let networkError = '';
  let pointerDragging = false;
  let pointerId = null;
  let lastPointerY = 0;
  let lastPointerAt = 0;
  const pressedKeys = new Set();
  let gamepadDirection = 0;

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    canvas.width = Math.max(2, Math.round(rect.width * dpr));
    canvas.height = Math.max(2, Math.round(rect.height * dpr));
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  };
  resize();
  const ro = new ResizeObserver(resize);
  if (frame) ro.observe(frame);

  const showOverlay = (kind, title, message, { score = null, iconName = 'info', actions = [] } = {}) => {
    const signature = JSON.stringify({ kind, title, message, score, iconName, actions });
    if (signature === overlaySignature) return;
    overlaySignature = signature;
    overlayKind = kind;
    overlay.style.display = kind ? 'grid' : 'none';
    if (overlayIcon) overlayIcon.innerHTML = icon(iconName);
    if (overlayTitle) overlayTitle.textContent = title;
    if (overlayText) overlayText.textContent = message;
    if (overlayScore) overlayScore.style.display = score ? 'flex' : 'none';
    if (overlayScore && score) {
      overlayScore.replaceChildren();
      const left = document.createElement('span');
      const separator = document.createElement('em');
      const right = document.createElement('span');
      left.textContent = String(score[0]);
      separator.textContent = '-';
      right.className = 'p2';
      right.textContent = String(score[1]);
      overlayScore.append(left, separator, right);
    }
    if (overlayActions) {
      overlayActions.innerHTML = actions.map((action) =>
        `<button type="button" class="btn ${action.primary ? 'btn--primary' : 'btn--ghost'}" data-overlay-action="${action.action}">${action.label}</button>`
      ).join('');
    }
  };

  const hideOverlay = () => {
    if (!overlayKind && overlay.style.display === 'none') return;
    overlay.style.display = 'none';
    overlayKind = null;
    overlaySignature = '';
  };

  const updateNetPill = () => {
    if (!netPill) return;
    netPill.dataset.state = net.state !== 'open' ? 'local' : net.inRoom ? 'room' : 'online';
    netPill.textContent = net.state !== 'open' ? 'Local play' : net.inRoom ? (net.isHost ? 'Host · room' : 'Guest · room') : 'Online';
  };

  const playerSide = mode === 'guest' ? 1 : 0;
  const pointerSide = playerSide;
  const paddleFor = (side) => side === 0 ? engine.p1 : engine.p2;

  const firePause = () => {
    if (engine.phase === 'over') return;
    if (mode === 'guest') net.control(engine.paused ? 'resume' : 'pause');
    else engine.togglePause();
  };
  const fireResume = () => {
    if (mode === 'guest') net.control('resume');
    else engine.togglePause(false);
  };
  const fireRestart = () => {
    if (mode === 'guest') net.control('restart');
    else engine.restart();
    audio.play('start');
  };
  const fireMenu = () => {
    if (net.inRoom) net.leave();
    window.location.hash = '#/game/neon-pong';
  };

  const onOverlayClick = (event) => {
    const button = event.target.closest('[data-overlay-action]');
    if (!button) return;
    const action = button.dataset.overlayAction;
    if (action === 'resume') fireResume();
    else if (action === 'rematch') fireRestart();
    else if (action === 'menu') fireMenu();
  };
  overlay.addEventListener('click', onOverlayClick);

  root.querySelector('[data-action="pause"]')?.addEventListener('click', firePause);
  root.querySelector('[data-action="restart"]')?.addEventListener('click', fireRestart);
  root.querySelector('[data-action="menu"]')?.addEventListener('click', fireMenu);

  const syncOverlays = () => {
    if (networkError) {
      showOverlay('network-error', 'Connection lost', networkError, {
        iconName: 'alert',
        actions: [{ action: 'menu', label: 'Back to lobby' }],
      });
    } else if (engine.phase === 'over') {
      const userWon = engine.winner === playerSide;
      showOverlay('over', userWon ? 'Victory' : 'Defeat',
        userWon ? 'You took the set. The rally went long.' : 'The rally ran out. The arcade keeps score.',
        {
          score: [engine.scores[0], engine.scores[1]],
          iconName: userWon ? 'trophy' : 'flag',
          actions: [{ action: 'rematch', label: 'Rematch' }, { action: 'menu', label: 'Menu' }],
        });
    } else if (engine.paused) {
      showOverlay('paused', 'Paused', 'Court frozen. Ball, paddles and score all hold.', {
        iconName: 'pause',
        actions: [{ action: 'resume', label: 'Resume' }, { action: 'menu', label: 'Menu' }],
      });
    } else {
      hideOverlay();
    }
  };

  const offState = net.on('state', (state) => {
    if (mode === 'guest') engine.applySnapshot(state);
  });
  const offInput = net.on('input', ({ y, dir, velocity, release }) => {
    if (mode !== 'host') return;
    const paddle = engine.p2;
    if (release) {
      paddle.target = null;
      paddle.pointerSpeed = null;
      paddle.vy = 0;
    } else if (dir === -1 || dir === 0 || dir === 1) {
      engine.setPaddleDir(1, dir);
    } else if (Number.isFinite(y)) {
      engine.setPaddleTarget(1, y, Number.isFinite(velocity) ? velocity : null);
    }
  });
  const offControl = net.on('control', (action) => {
    if (action === 'pause') engine.togglePause(true);
    else if (action === 'resume') engine.togglePause(false);
    else if (action === 'restart') engine.restart();
  });
  const offEvent = net.on('event', (name) => audio.play(name));
  const offError = net.on('error', (message) => {
    if (net.inRoom) networkError = message || 'The room rejected the request.';
  });
  const offClosed = net.on('closed', ({ wasRoom }) => {
    if (wasRoom) networkError = 'The host or guest connection was closed. Return to the lobby.';
  });
  const offPeerLeft = net.on('peer-left', ({ reason }) => {
    if (reason === 'host' || reason === 'timeout') networkError = 'The host left the room. Return to the lobby.';
    else if (mode === 'host') networkError = 'The guest left the room. Return to the lobby or start a new session.';
  });
  const offRoom = net.on('room', updateNetPill);
  const offPlayers = net.on('players', updateNetPill);

  const keyDirection = (side) => {
    if (side === 1) {
      const up = pressedKeys.has('ArrowUp');
      const down = pressedKeys.has('ArrowDown');
      return up === down ? 0 : up ? -1 : 1;
    }
    const up = pressedKeys.has('KeyW');
    const down = pressedKeys.has('KeyS');
    return up === down ? 0 : up ? -1 : 1;
  };
  const applyKeyMovement = (side) => {
    const direction = keyDirection(side);
    if (mode === 'guest') {
      engine.setPaddleDir(1, direction);
      net.sendInput(undefined, { dir: direction });
    } else {
      engine.setPaddleDir(side, direction);
    }
  };

  const onKeyDown = (event) => {
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.code === 'KeyP' || event.code === 'Escape' || event.code === 'Space') {
      event.preventDefault();
      if (!event.repeat) firePause();
      return;
    }
    if (event.code === 'KeyR') {
      event.preventDefault();
      if (!event.repeat) fireRestart();
      return;
    }
    const movementCode = ['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown'].includes(event.code);
    if (!movementCode) return;
    event.preventDefault();
    if (event.repeat) return;
    pressedKeys.add(event.code);
    audio.play('click');
    if (mode === 'local') {
      applyKeyMovement(event.code.startsWith('Arrow') ? 1 : 0);
    } else {
      const side = mode === 'guest' ? 1 : 0;
      if (event.code.startsWith('Arrow')) {
        // Arrow keys are also valid for single-player/guest input; local P2 remains independent.
        if (mode === 'local') applyKeyMovement(1);
        else applyKeyMovement(side);
      } else applyKeyMovement(side);
    }
  };
  const onKeyUp = (event) => {
    if (!['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown'].includes(event.code)) return;
    pressedKeys.delete(event.code);
    if (mode === 'local') {
      applyKeyMovement(event.code.startsWith('Arrow') ? 1 : 0);
    } else {
      applyKeyMovement(mode === 'guest' ? 1 : 0);
    }
  };
  const onWindowBlur = () => {
    pressedKeys.clear();
    engine.setPaddleDir(playerSide, 0);
    if (mode === 'guest') net.sendInput(undefined, { dir: 0 });
  };

  let pointerDragging = false;
  let pointerId = null;
  let lastPointerY = 0;
  let lastPointerAt = 0;
  const pointerY = (event) => {
    const rect = canvas.getBoundingClientRect();
    return ((event.clientY - rect.top) / Math.max(1, rect.height)) * H;
  };
  const onPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    pointerDragging = true;
    pointerId = event.pointerId;
    canvas.setPointerCapture?.(pointerId);
    const y = pointerY(event);
    const paddle = paddleFor(pointerSide);
    lastPointerY = y;
    lastPointerAt = performance.now();
    const clamped = Math.min(H - paddle.h / 2, Math.max(paddle.h / 2, y));
    engine.setPaddleTarget(pointerSide, clamped);
    if (mode === 'guest') net.sendInput(clamped);
  };
  const onPointerMove = (event) => {
    if (!pointerDragging || (pointerId !== null && event.pointerId !== pointerId)) return;
    const y = pointerY(event);
    const now = performance.now();
    const dt = Math.max(0.008, (now - lastPointerAt) / 1000);
    const velocity = Math.max(-2600, Math.min(2600, (y - lastPointerY) / dt));
    lastPointerY = y;
    lastPointerAt = now;
    const paddle = paddleFor(pointerSide);
    const clamped = Math.min(H - paddle.h / 2, Math.max(paddle.h / 2, y));
    engine.setPaddleTarget(pointerSide, clamped, velocity);
    if (mode === 'guest') net.sendInput(clamped, { velocity });
  };
  const onPointerUp = (event) => {
    if (!pointerDragging || (pointerId !== null && event.pointerId !== pointerId)) return;
    pointerDragging = false;
    try { if (pointerId !== null) canvas.releasePointerCapture?.(pointerId); } catch {}
    pointerId = null;
    const paddle = paddleFor(pointerSide);
    paddle.pointerSpeed = null;
    paddle.target = null;
    paddle.vy = 0;
    if (mode === 'guest') net.sendInput(paddle.y, { release: true });
  };

  const readGamepad = () => {
    const gamepad = Array.from(navigator.getGamepads?.() || []).find((item) => item?.connected);
    let direction = 0;
    if (gamepad) {
      const yAxis = gamepad.axes?.[1] || 0;
      if (gamepad.buttons?.[12]?.pressed || yAxis < -0.35) direction = -1;
      else if (gamepad.buttons?.[13]?.pressed || yAxis > 0.35) direction = 1;
    }
    if (direction !== gamepadDirection) {
      gamepadDirection = direction;
      if (mode === 'guest') {
        engine.setPaddleDir(1, direction);
        net.sendInput(undefined, { dir: direction });
      } else engine.setPaddleDir(0, direction);
    }
  };

  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onWindowBlur);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('lostpointercapture', onPointerUp);

  const renderFrame = (now) => {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    readGamepad();
    engine.update(dt);

    const events = engine.drainEvents();
    for (const event of events) {
      const name = typeof event === 'string' ? event : event.name;
      audio.play(name, typeof event === 'object' ? event : {});
      if (mode === 'host' && name) net.sendEvent(name);
    }

    if (engine.phase === 'over' && lastPhase !== 'over') {
      const isWin = engine.winner === playerSide;
      recordMatch({
        gameId,
        mode,
        result: isWin ? 'win' : 'loss',
        score: isWin ? engine.scores[playerSide] : engine.scores[1 - playerSide],
        rally: engine.maxRally || 0,
        seconds: engine.elapsed || 0,
      });
      confetti();
    }
    lastPhase = engine.phase;

    if (mode === 'host' && net.inRoom && net.isHost && now - lastSent >= 33) {
      net.sendState(engine.snapshot());
      lastSent = now;
    }

    ctx.save();
    engine.render(ctx, { showHud: getSettings().showHud });
    ctx.restore();
    syncOverlays();
    raf = requestAnimationFrame(renderFrame);
  };

  recordPlay({ gameId, mode });
  updateNetPill();
  overlay.style.display = 'none';
  raf = requestAnimationFrame(renderFrame);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    pressedKeys.clear();
    if (pointerDragging) onPointerUp({ pointerId });
    root.removeEventListener('keydown', onKeyDown);
    root.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onWindowBlur);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    canvas.removeEventListener('lostpointercapture', onPointerUp);
    overlay.removeEventListener('click', onOverlayClick);
    net.off('state', offState);
    net.off('input', offInput);
    net.off('control', offControl);
    net.off('event', offEvent);
    net.off('error', offError);
    net.off('closed', offClosed);
    net.off('peer-left', offPeerLeft);
    net.off('room', offRoom);
    net.off('players', offPlayers);
  };
}
