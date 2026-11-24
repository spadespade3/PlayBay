/* PlayBay · Multiplayer screen */

import { displayName } from '../store.js';
import { net } from '../net.js';
import { icon, hydrateIcons, toast, esc } from '../ui.js';

export function mount(root, params = {}) {
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');

  const renderLobby = () => {
    const room = net.room;
    const code = (room && room.code) || '----';
    const players = net.players && net.players.length ? net.players : room?.players || [];
    const host = net.isHost;
    const started = Boolean(room && room.started);
    const ready = players.length >= 2 && !started;

    const chars = code
      .split('')
      .map((c, i) => `<span class="code-char" style="--i:${i}">${c}</span>`)
      .join('');

    const slots = players.length
      ? players
          .map((p) => {
            const isHostPlayer = Boolean(p.host);
            const avatar = isHostPlayer ? `<span class="avatar avatar--magenta">H</span>` : `<span class="avatar avatar--cyan">P</span>`;
            return `
        <div class="player-slot">
          ${avatar}
          <span class="player-slot__meta">
            <span class="player-slot__name">${esc(p.name || 'Player')}</span>
            <span class="player-slot__role">${isHostPlayer ? 'Host' : 'Guest'}</span>
          </span>
          <span class="player-slot__side">${net.playerId === p.id ? 'You' : ''}</span>
        </div>`;
          })
          .join('')
      : `
        <div class="player-slot player-slot--empty">
          <span class="avatar avatar--empty">?</span>
          <span class="player-slot__meta">
            <span class="player-slot__name">Awaiting player</span>
            <span class="player-slot__role">Seat open</span>
          </span>
        </div>`;

    root.innerHTML = `
      <div class="room">
        <div class="room__main">
          <div class="room__label">Room code</div>
          <div class="room__code">${chars}</div>
          <div class="room__actions">
            <button type="button" class="btn btn--ghost btn--sm" data-action="room-copy"><span data-icon="copy"></span> Copy</button>
            <button type="button" class="btn btn--primary" data-action="room-start" data-icon="play" ${ready && host && !started ? '' : 'disabled'}>Start match</button>
            <button type="button" class="btn btn--danger btn--sm" data-action="room-leave"><span data-icon="x"></span> Leave</button>
          </div>
          <div class="room__status">
            <span class="dots"><span></span><span></span><span></span></span>
            <span>${started ? 'Match running' : ready ? 'Ready · waiting for start' : 'Waiting for host'}</span>
          </div>
          <div class="room__leave">
            <span>Leaving ends the session for both players.</span>
            <button type="button" class="btn btn--ghost btn--sm" data-action="room-leave2"><span data-icon="x"></span> Leave lobby</button>
          </div>
        </div>
        <div class="room__side">
          <h3>Players</h3>
          <div class="room__players">${slots}</div>
          <div class="room__share">Code <code>${code}</code> <button type="button" class="btn btn--quiet btn--sm" data-action="room-share-copy"><span data-icon="copy"></span> Copy</button></div>
          <div class="room__hint"><strong>Host:</strong> run the duel. <strong>Guest:</strong> move your paddle, watch the host move theirs.</div>
        </div>
      </div>`;
  };

  const renderForm = () => {
    root.innerHTML = `
      <section class="screen multiplayer">
        <div class="mp-intro">
          <span data-icon="info"></span>
          <span>Both players need a device on the same Wi-Fi network. Start the relay with <code>node server.js</code>.</span>
        </div>
        <div class="mp-grid">
          <div class="mp-card">
            <span class="mp-card__icon"><span data-icon="server"></span></span>
            <h2>Host a room</h2>
            <p>You run the authoritative simulation. Share the code, the second player joins from their device.</p>
            <div class="mp-card__form">
              <button type="button" class="btn btn--primary" data-action="mp-host-create" data-icon="wifi">Create room</button>
            </div>
            <div class="mp-card__foot"><span data-icon="users"></span><span>Max two players per room.</span></div>
          </div>
          <div class="mp-card mp-card--join">
            <span class="mp-card__icon"><span data-icon="link"></span></span>
            <h2>Join a room</h2>
            <p>Enter the four-character code from the host. The host owns the ball.</p>
            <div class="mp-card__form">
              <input class="input input--code" id="mpCode" type="text" maxlength="6" placeholder="______" autocomplete="off" />
              <button type="button" class="btn btn--magenta" data-action="mp-join-create" data-icon="send">Join room</button>
            </div>
            <div class="mp-card__foot"><span data-icon="shield"></span><span>Room codes are per-network. Guests relay paddle input only.</span></div>
          </div>
        </div>
      </section>`;
  };

  const render = () => {
    if (net.inRoom) renderLobby();
    else renderForm();
    hydrateIcons(root);
  };

  const onAction = async (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'mp-host-create') {
      const name = displayName();
      try {
        await net.createRoom(name);
      } catch (err) {
        toast(err?.message || 'Could not create the room.', { type: 'error' });
      }
    } else if (action === 'mp-join-create') {
      const name = displayName();
      const codeValue = (root.querySelector('#mpCode')?.value || '').trim().toUpperCase();
      if (!/^[A-HJ-NP-Z2-9]{6}$/.test(codeValue)) {
        toast('Room codes contain six valid characters.', { type: 'error' });
        return;
      }
      try {
        await net.joinRoom(codeValue, name);
      } catch (err) {
        toast(err?.message || 'Could not join the room.', { type: 'error' });
      }
    } else if (action === 'room-start') {
      await net.startMatch();
    } else if (action === 'room-leave' || action === 'room-leave2') {
      net.leave();
      if (window.location.hash.startsWith('#/play/')) return;
      window.location.hash = '#/multiplayer';
    } else if (action === 'room-copy') {
      const code = net.room?.code || '';
      if (code) {
        try {
          await navigator.clipboard.writeText(code);
          toast('Room code copied.', { type: 'success' });
        } catch {
          toast(code, { type: 'info', title: 'Room code' });
        }
      }
    } else if (action === 'room-share-copy') {
      const code = net.room?.code || '';
      if (code) {
        try {
          await navigator.clipboard.writeText(code);
          toast('Room code copied.', { type: 'success' });
        } catch {
          toast(code, { type: 'info', title: 'Room code' });
        }
      }
    }
  };
  root.addEventListener('click', onAction);

  const offNetRoom = net.on('room', render);
  const offNetPlayers = net.on('players', render);
  const offNetStart = net.on('start', () => {
    window.location.hash = `#/play/neon-pong?mode=${net.isHost ? 'host' : 'guest'}`;
  });
  const offNetLeft = net.on('left', () => render());
  const offNetPeerLeft = net.on('peer-left', ({ reason }) => {
    render();
    if (reason === 'host') toast('The host closed the room.', { type: 'error' });
    else if (reason === 'guest') toast('The other player left the room.', { type: 'info' });
    else if (reason === 'timeout') toast('The room expired after inactivity.', { type: 'info' });
  });
  const offNetError = net.on('error', (message) => toast(message || 'The room rejected the request.', { type: 'error' }));

  render();

  const intent = hashParams.get('intent');
  const auto = hashParams.get('auto');
  const codeParam = hashParams.get('code');
  if (intent === 'host' && auto === '1') {
    net.createRoom(displayName()).catch(() => {});
  }
  if (codeParam) {
    const input = root.querySelector('#mpCode');
    if (input && /^[A-HJ-NP-Z2-9]{6}$/i.test(codeParam)) input.value = codeParam.toUpperCase();
  }

  return () => {
    root.removeEventListener('click', onAction);
    net.off('room', offNetRoom);
    net.off('players', offNetPlayers);
    net.off('start', offNetStart);
    net.off('left', offNetLeft);
    net.off('peer-left', offNetPeerLeft);
    net.off('error', offNetError);
  };
}
