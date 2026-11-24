/* PlayBay · Neon Pong player screen */

import { getSettings, recordMatch } from '../store.js';
import { net } from '../net.js';
import { audio } from '../audio.js';
import { confetti, icon } from '../ui.js';
import { PongEngine, PONG } from '../games/pong.js';

const W = PONG.W;
const H = PONG.H;

const MODE_LABEL = {
  cpu: 'VS CPU',
  local: 'Local 2P',
  host: 'Host Online',
  guest: 'Join Online',
};

export function mount(root, params = {}) {
  const gameId = params.id || 'neon-pong';
  const mode = params.mode || 'cpu';
  const settings = getSettings();
  const difficulty = ['chill', 'normal', 'insane'].includes(settings.difficulty) ? settings.difficulty : 'normal';
  const names = mode === 'local' ? ['P1', 'P2'] : [settings.name || 'Player One', 'Opponent'];

  const engine = new PongEngine({ mode, difficulty, target: PONG.TARGET, names });

  root.innerHTML = `
    <div class="player-top">
      <div class="player-top__title"><strong>Neon Pong</strong><span>${MODE_LABEL[mode] || mode}</span></div>
      <div class="player-actions">
        <button type="button" class="btn btn--icon" data-action="pause" data-icon="pause" aria-label="Pause"></button>
        <button type="button" class="btn btn--icon" data-action="restart" data-icon="restart" aria-label="Restart"></button>
        <button type="button" class="btn btn--icon" data-action="menu" data-icon="x" aria-label="Menu"></button>
      </div>
      <div class="player-meta">
        <span class="net-pill" data-state="local">Local play</span>
      </div>
    </div>

    <div class="stage">
      <div class="stage__frame">
        <canvas id="pongCanvas" class="stage__canvas"></canvas>
      </div>
      <div class="stage__overlay" style="display:none">
        <div class="overlay-card">
          <span class="overlay-card__icon"><span data-icon="info"></span></span>
          <h2 id="overlayTitle">Get ready</h2>
          <p id="overlayText">The ball is loading. First to seven takes the set.</p>
          <div class="overlay-score" id="overlayScore" style="display:none"><span>0</span><em>-</em><span class="p2">0</span></div>
          <div class="btn-row" id="overlayActions"></div>
        </div>
      </div>
    </div>

    <div class="player-foot">
      <span class="hint">W/S move · Space serve · Mouse / touch</span>
      <span class="hint"><span data-icon="gamepad"></span> Controller supported</span>
    </div>
  `;

  const canvas = root.querySelector('#pongCanvas');
  const ctx = canvas.getContext('2d');
  const frame = root.querySelector('.stage__frame');
  const overlay = root.querySelector('.stage__overlay');
  const overlayIcon = root.querySelector('.overlay-card__icon');
  const overlayTitle = root.querySelector('#overlayTitle');
  const overlayText = root.querySelector('#overlayText');
  const overlayScore = root.querySelector('#overlayScore');
  const overlayActions = root.querySelector('#overlayActions');
  const netPill = root.querySelector('.net-pill');
  const playerTitle = root.querySelector('.player-top__title');
  const playerFoot = root.querySelector('.player-foot');

  let raf = 0;
  let last = performance.now();
  let lastPhase = engine.phase;
  let overlayKind = null;
  let lastSent = 0;

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(2, Math.round(rect.width * dpr));
    canvas.height = Math.max(2, Math.round(rect.height * dpr));
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  };
  resize();
  const ro = new ResizeObserver(resize);
  if (frame) ro.observe(frame);

  const showOverlay = (kind, title, text, { score = null, iconName = 'info', actions = [] } = {}) => {
    overlayKind = kind;
    overlay.style.display = kind ? 'grid' : 'none';
    if (overlayIcon) overlayIcon.innerHTML = icon(iconName);
    if (overlayTitle) overlayTitle.textContent = title;
    if (overlayText) overlayText.textContent = text;
    if (overlayScore) overlayScore.style.display = score ? 'flex' : 'none';
    if (overlayScore && score) {
      overlayScore.innerHTML = `<span>${score[0]}</span><em>-</em><span class="p2">${score[1]}</span>`;
    }
    if (overlayActions) {
      overlayActions.innerHTML = actions
        .map(
          (a) =>
            `<button type="button" class="btn ${a.primary ? 'btn--primary' : 'btn--ghost'}" data-overlay-action="${a.action}">${a.label}</button>`
        )
        .join('');
    }
  };

  const fireOverlayAction = (event) => {
    const button = event.target.closest('[data-overlay-action]');
    if (!button) return;
    const action = button.dataset.overlayAction;
    if (action === 'rematch') {
      engine.restart();
      audio.play('start');
    } else if (action === 'menu') {
      if (net.inRoom) net.leave();
      window.location.hash = '#/game/neon-pong';
    }
  };
  overlay.addEventListener('click', fireOverlayAction);
  overlayActions?.addEventListener('click', fireOverlayAction);

  const firePause = () => {
    if (engine.phase === 'over') return;
    if (mode === 'guest') net.control('pause');
    else engine.togglePause();
  };
  const fireRestart = () => {
    if (mode === 'guest') net.control('restart');
    else engine.restart();
  };
  const fireMenu = () => {
    if (net.inRoom) net.leave();
    window.location.hash = '#/game/neon-pong';
  };

  const pauseButton = root.querySelector('[data-action="pause"]');
  const restartButton = root.querySelector('[data-action="restart"]');
  const menuButton = root.querySelector('[data-action="menu"]');
  pauseButton?.addEventListener('click', firePause);
  restartButton?.addEventListener('click', fireRestart);
  menuButton?.addEventListener('click', fireMenu);

  const syncNetPill = () => {
    const el = root.querySelector('.net-pill');
    if (!el) return;
    const online = net.state === 'open';
    const inRoom = net.inRoom;
    el.dataset.state = !online ? 'local' : inRoom ? 'room' : 'online';
    el.textContent = !online ? 'Local play' : inRoom ? net.isHost ? 'Host · room' : 'Guest · room' : 'Online';
  };

  const syncOverlays = () => {
    if (engine.phase === 'over') {
      const winnerSide = engine.winner;
      showOverlay(
        'over',
        winnerSide === 0 ? 'Victory' : 'Defeat',
        winnerSide === 0 ? 'You took the set. The rally went long.' : 'The rally ran out. The arcade keeps score.',
        {
          score: [engine.scores[0], engine.scores[1]],
          iconName: winnerSide === 0 ? 'trophy' : 'flag',
          actions: [
            { action: 'rematch', label: 'Rematch' },
            { action: 'menu', label: 'Menu' },
          ],
        }
      );
      if (lastPhase !== 'over') {
        const isWin = winnerSide === 0;
        recordMatch({
          gameId,
          mode,
          result: isWin ? 'win' : 'loss',
          score: isWin ? engine.scores[0] : engine.scores[1],
          rally: engine.maxRally || 0,
          seconds: engine.elapsed || 0,
        });
        confetti();
      }
    } else if (engine.paused) {
      showOverlay(
        'paused',
        'Paused',
        'Court frozen. Ball, paddles and score all hold.',
        {
          iconName: 'pause',
          actions: [
            { action: 'rematch', label: 'Resume' },
            { action: 'menu', label: 'Menu' },
          ],
        }
      );
    } else if (overlayKind) {
      overlay.style.display = 'none';
      overlayKind = null;
    }
  };

  const offState = net.on('state', (state) => {
    if (mode === 'guest') engine.applySnapshot(state);
  });
  const offInput = net.on('input', ({ y }) => {
    if (mode !== 'guest') return;
    engine.setPaddleTarget(1, Number(y));
  });
  const offControl = net.on('control', (action) => {
    if (action === 'pause') engine.togglePause(true);
    if (action === 'restart') engine.restart();
  });
  const offEvent = net.on('event', (name, data) => {
    audio.play(name, data || {});
  });
  const offError = net.on('error', (message) => {
    if (net.inRoom) {
      showOverlay('error', 'Connection lost', message || 'The room link dropped.', {
        iconName: 'alert',
        actions: [{ action: 'menu', label: 'Back to lobby' }],
      });
    }
  });
  const offClosed = net.on('closed', ({ wasRoom }) => {
    if (wasRoom || net.inRoom) {
      showOverlay('error', 'Connection lost', 'The host left or the room dropped. Return to the lobby.', {
        iconName: 'alert',
        actions: [{ action: 'menu', label: 'Back to lobby' }],
      });
    }
  });
  const offRoom = net.on('room', syncNetPill);
  const offPlayers = net.on('players', syncNetPill);

  const paddleFor = (side) => (side === 0 ? engine.p1 : engine.p2);

  const onKeyDown = (event) => {
    const key = event.key;
    const dir = key === 'ArrowUp' || key === 'KeyW' ? -1 : key === 'ArrowDown' || key === 'KeyS' ? 1 : 0;
    if (dir === 0) return;
    event.preventDefault();
    audio.play('click');
    if (mode === 'guest') {
      engine.setPaddleDir(1, dir > 0 ? 1 : -1);
      net.sendInput(engine.p2.y);
    } else {
      const side = mode === 'local' ? (key.startsWith('Arrow') ? 1 : 0) : 0;
      engine.setPaddleDir(side, dir > 0 ? 1 : -1);
    }
  };
  const onKeyUp = (event) => {
    const key = event.key;
    const dir = key === 'ArrowUp' || key === 'KeyW' ? -1 : key === 'ArrowDown' || key === 'KeyS' ? 1 : 0;
    if (dir === 0) return;
    if (mode === 'guest') {
      engine.setPaddleDir(1, 0);
      net.sendInput(engine.p2.y);
    } else {
      const side = mode === 'local' ? (key.startsWith('Arrow') ? 1 : 0) : 0;
      engine.setPaddleDir(side, 0);
    }
  };
  let pointerDragging = false;
  let lastPointerY = 0;
  let lastPointerAt = 0;
  const pointerSide = () => (mode === 'guest' ? 1 : 0);
  const pointerY = event => {
    const rect = canvas.getBoundingClientRect();
    return ((event.clientY - rect.top) / Math.max(1, rect.height)) * H;
  };
  const onPointerDown = event => {
    if (event.button !== undefined && event.button !== 0) return;
    pointerDragging = true;
    canvas.setPointerCapture?.(event.pointerId);
    const y = pointerY(event), paddle = paddleFor(pointerSide());
    lastPointerY = y; lastPointerAt = performance.now();
    const clamped = Math.min(H - paddle.h / 2, Math.max(paddle.h / 2, y));
    engine.setPaddleTarget(pointerSide(), clamped);
    if (mode === 'guest') net.sendInput(clamped);
  };
  const onPointerMove = event => {
    if (!pointerDragging) return;
    const y = pointerY(event), now = performance.now();
    const dt = Math.max(0.008, (now - lastPointerAt) / 1000);
    const velocity = (y - lastPointerY) / dt;
    lastPointerY = y; lastPointerAt = now;
    const paddle = paddleFor(pointerSide());
    const clamped = Math.min(H - paddle.h / 2, Math.max(paddle.h / 2, y));
    engine.setPaddleTarget(pointerSide(), clamped, velocity);
    if (mode === 'guest') net.sendInput(clamped);
  };
  const onPointerUp = event => {
    pointerDragging = false;
    try { canvas.releasePointerCapture?.(event.pointerId); } catch {}
    const paddle = paddleFor(pointerSide());
    paddle.pointerSpeed = 0;
    paddle.target = null;
    paddle.vy = 0;
    paddle.speed = 1040;
  };
  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  const renderFrame = (now) => {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    engine.update(dt);
    for (const ev of engine.drainEvents()) audio.play(typeof ev === 'string' ? ev : ev.name, typeof ev === 'object' ? ev : {});

    if (engine.phase === 'over' && lastPhase !== 'over') {
      const isWin = engine.winner === 0;
      recordMatch({
        gameId,
        mode,
        result: isWin ? 'win' : 'loss',
        score: isWin ? engine.scores[0] : engine.scores[1],
        rally: engine.maxRally || 0,
        seconds: engine.elapsed || 0,
      });
      confetti();
    }
    lastPhase = engine.phase;

    if (mode !== 'guest' && net.inRoom && net.isHost) {
      const nowT = performance.now();
      if (nowT - lastSent > 33) {
        net.sendState(engine.snapshot());
        lastSent = nowT;
      }
    }

    ctx.save();
    engine.render(ctx, { showHud: getSettings().showHud });
    ctx.restore();

    syncOverlays();
    raf = requestAnimationFrame(renderFrame);
  };

  const start = () => {
    raf = requestAnimationFrame(renderFrame);
  };
  overlay.style.display = 'none';
  start();

  if (playerTitle) {
    playerTitle.innerHTML = `<strong>Neon Pong</strong><span>${MODE_LABEL[mode] || mode}</span>`;
  }
  if (playerFoot) {
    playerFoot.innerHTML = mode === 'guest'
      ? '<span class="hint">Host runs the sim · you send inputs</span>'
      : '<span class="hint">W/S move · Space serve · Mouse / touch</span>';
  }

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    root.removeEventListener('keydown', onKeyDown);
    root.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    overlay.removeEventListener('click', fireOverlayAction);
    overlayActions?.removeEventListener('click', fireOverlayAction);
    pauseButton?.removeEventListener('click', firePause);
    restartButton?.removeEventListener('click', fireRestart);
    menuButton?.removeEventListener('click', fireMenu);
    net.off('state', offState);
    net.off('input', offInput);
    net.off('control', offControl);
    net.off('event', offEvent);
    net.off('error', offError);
    net.off('closed', offClosed);
    net.off('room', offRoom);
    net.off('players', offPlayers);
  };
}
