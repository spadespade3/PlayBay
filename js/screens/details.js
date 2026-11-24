/* PlayBay · Game Details screen */

import { findGame, coverArt } from '../catalog.js';
import { esc, hydrateIcons } from '../ui.js';

const MODE_ACCENT = {
  cpu: '',
  local: 'mode-btn__icon--lime',
  host: 'mode-btn__icon--magenta',
  guest: '',
};

export function launchMode(gameId, mode) {
  if (mode === 'host') return '#/multiplayer?intent=host&auto=1';
  if (mode === 'guest') return '#/multiplayer?intent=join';
  return `#/play/${gameId}?mode=${mode}`;
}

export function mount(root, params = {}) {
  const id = params.id || 'neon-pong';
  const game = findGame(id);

  const modesMarkup = game && game.available
    ? (game.modes || [])
        .map(
          (mode) => `
      <button type="button" class="mode-btn" data-mode="${mode.id}">
        <span class="mode-btn__icon ${MODE_ACCENT[mode.id] || ''}"><span data-icon="${mode.icon}"></span></span>
        <span class="mode-btn__body">
          <span class="mode-btn__name">${esc(mode.name)}</span>
          <span class="mode-btn__desc">${esc(mode.desc)}</span>
        </span>
        <span class="mode-btn__arrow"><span data-icon="arrow-right"></span></span>
      </button>`
        )
        .join('')
    : '';

  root.innerHTML = `
    <section class="screen detail">
      <div class="detail">
        <div class="detail__art">
          <div class="detail__art-inner">${coverArt(id)}</div>
          <div class="detail__art-bar">
            ${game?.available ? '<span><span data-icon="monitor"></span>Local + LAN</span>' : '<span><span data-icon="clock"></span>Development preview</span>'}
            <span><span data-icon="clock"></span>v${esc(game?.version || '1.0')} · updated ${esc(game?.updated || '2026-11-20')}</span>
          </div>
        </div>
        <div class="detail__body">
          <div class="detail__badges">
            <span class="badge badge--cyan">${esc(game?.category || 'Arcade')}</span>
            <span class="badge">${esc(game?.players || '1-2')} players</span>
            ${game?.available ? `<span class="badge badge--lime">Playable</span>` : `<span class="badge badge--amber">In development</span>`}
          </div>
          <h1 class="detail__title">${esc(game?.title || 'Game')}</h1>
          <p class="detail__desc">${esc(game?.description || game?.summary || '')}</p>
          ${modesMarkup ? `<div class="mode-list">${modesMarkup}</div>` : `<div class="detail__how"><h3>Modes</h3><p>This build is in development. The finished game ships with every mode below.</p></div>`}
          ${game?.id === 'neon-pong' && game.available
            ? '<div class="detail__how"><h3>Controls</h3><div class="control-line"><span class="key-row"><span class="keycap">W</span><span class="keycap">S</span></span><span>Move your paddle</span></div><div class="control-line"><span class="keycap">P / ESC</span><span>Pause or resume</span></div><div class="control-line"><span class="keycap">R</span><span>Restart match</span></div><div class="control-line"><span class="keycap">MOUSE</span><span>Hold and drag · touch supported</span></div><p>Gamepad D-pad or left stick is also supported. First to seven takes the set.</p></div>'
            : '<div class="detail__how"><h3>Controls</h3><p>Controls and supported modes will be published when this game becomes playable.</p></div>'}
        </div>
      </div>
    </section>`;

  const modeList = root.querySelector('.mode-list');
  if (modeList) {
    modeList.querySelectorAll('.mode-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const mode = button.dataset.mode;
        window.location.hash = launchMode(game?.id || id, mode);
      });
    });
  }

  hydrateIcons(root);
  return () => {};
}
