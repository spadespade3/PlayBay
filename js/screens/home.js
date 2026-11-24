/* PlayBay · console dashboard */
import { getStats, getTotals, subscribe } from '../store.js';
import { GAMES, findGame, coverArt } from '../catalog.js';
import { hydrateIcons } from '../ui.js';

const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icon = (name) => `<span data-icon="${name}" aria-hidden="true"></span>`;

function gameTile(game, selected) {
  return `<button class="ps-game-tile ${selected ? 'is-selected' : ''}" type="button" data-select-game="${safe(game.id)}" aria-pressed="${selected}" aria-label="Select ${safe(game.title)}">
    <span class="ps-game-tile__art">${coverArt(game.id)}</span>
    <span class="ps-game-tile__selected-mark">${icon('check')}</span>
  </button>`;
}

function hero(game, stats) {
  const available = game.available;
  const gameIndex = Math.max(0, GAMES.findIndex((item) => item.id === game.id)) + 1;
  const lastPlayed = stats.lastGame === game.id;
  const activity = lastPlayed ? `Last played · ${safe((stats.lastMode || 'cpu').toUpperCase())}` : (available ? game.tagline : 'In development · Preview the game');
  const action = available
    ? `<a class="ps-primary-action" href="#/play/${safe(game.id)}?mode=cpu">${icon('play')}<span>PLAY GAME</span></a>`
    : `<a class="ps-primary-action" href="#/game/${safe(game.id)}">${icon('info')}<span>VIEW DETAILS</span></a>`;
  return `<section class="ps-hero" data-featured="${safe(game.id)}" aria-label="Selected game">
    <div class="ps-hero__backdrop">${coverArt(game.id)}</div>
    <div class="ps-hero__scrim"></div>
    <div class="ps-hero__ambient" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="ps-hero__content">
      <div class="ps-hero__eyebrow"><span class="ps-status-dot"></span>${available ? 'READY TO PLAY' : 'COMING SOON'} <i></i> ${safe(game.category)} <i></i> ${safe(game.players)} PLAYERS</div>
      <h1 class="ps-hero__title">${safe(game.title)}</h1>
      <p class="ps-hero__tagline">${safe(game.tagline)}</p>
      <p class="ps-hero__activity">${safe(activity)}</p>
      <div class="ps-hero__actions">${action}<a class="ps-secondary-action" href="#/game/${safe(game.id)}">GAME DETAILS</a><a class="ps-more-action" href="#/game/${safe(game.id)}" aria-label="More options">···</a></div>
    </div>
    <div class="ps-hero__side-note"><span>PLAYBAY ORIGINALS</span><strong>${String(gameIndex).padStart(2,'0')}</strong><small>/ ${String(GAMES.length).padStart(2,'0')}</small></div>
  </section>`;
}

function activityCards(totals, stats) {
  const rate = totals.plays ? Math.round(totals.winRate * 100) : 0;
  return `<section class="ps-activity-grid" aria-label="Player activity">
    <article class="ps-activity-card ps-record-card">
      <div class="ps-activity-card__head"><div><span class="ps-overline">YOUR ARCADE RECORD</span><h2>Player stats</h2></div><span class="ps-card-mark">PB / 01</span></div>
      <div class="ps-record-grid">
        <div class="ps-record-stat"><span class="ps-record-icon">✦</span><strong>${totals.plays}</strong><small>MATCHES</small></div>
        <div class="ps-record-stat"><span class="ps-record-icon">◆</span><strong>${totals.wins}</strong><small>WINS</small></div>
        <div class="ps-record-stat"><span class="ps-record-icon">◉</span><strong>${rate}%</strong><small>WIN RATE</small></div>
        <div class="ps-record-stat"><span class="ps-record-icon">↗</span><strong>${totals.bestRally}</strong><small>BEST RALLY</small></div>
      </div>
    </article>
    <article class="ps-activity-card ps-friends-card">
      <div class="ps-activity-card__head"><div><span class="ps-overline">LOCAL MULTIPLAYER</span><h2>Friends who play</h2></div><span class="ps-friends-symbol">${icon('users')}</span></div>
      <p>Turn another phone into a controller, or bring another player onto your network.</p>
      <a href="#/multiplayer" class="ps-text-link">SET UP A ROOM <span>↗</span></a>
    </article>
    <a class="ps-continue-card" href="#/play/${safe(findGame(stats.lastGame)?.id || 'neon-pong')}?mode=${safe(stats.lastMode || 'cpu')}">
      <span class="ps-continue-card__art">${coverArt(findGame(stats.lastGame)?.id || 'neon-pong')}</span>
      <span class="ps-continue-card__copy"><span class="ps-overline">CONTINUE PLAYING</span><strong>${safe(findGame(stats.lastGame)?.title || 'Neon Pong')}</strong><small>${stats.lastGame ? 'PICK UP WHERE YOU LEFT OFF' : 'YOUR FIRST MATCH IS WAITING'}</small></span>
      <span class="ps-continue-card__arrow">↗</span>
    </a>
  </section>`;
}

export function mount(root) {
  let selected = findGame('neon-pong') || GAMES[0];
  const stats = getStats();
  const renderHero = () => {
    const current = root.querySelector('.ps-hero');
    const holder = document.createElement('div');
    holder.innerHTML = hero(selected, getStats());
    if (current) current.replaceWith(holder.firstElementChild);
    hydrateIcons(root);
  };
  const renderTiles = (restoreFocus = false) => {
    const tiles = [...root.querySelectorAll('[data-select-game]')];
    tiles.forEach(tile => {
      const active = tile.dataset.selectGame === selected.id;
      tile.classList.toggle('is-selected', active);
      tile.setAttribute('aria-pressed', String(active));
    });
    const caption = root.querySelector('.ps-game-carousel__caption');
    if (caption) caption.innerHTML = `<span class="ps-platform-mark">PB</span><strong>${safe(selected.title)}</strong><small>${selected.available ? 'READY TO PLAY' : 'IN DEVELOPMENT'}</small>`;
    const activeTile = root.querySelector(`[data-select-game="${selected.id}"]`);
    activeTile?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
    if (restoreFocus || !root.contains(document.activeElement)) activeTile?.focus({ preventScroll: true });
  };
  const selectGame = (id, restoreFocus = false) => {
    const next = findGame(id);
    if (!next || next.id === selected.id) return;
    selected = next;
    renderTiles(restoreFocus);
    renderHero();
  };
  root.tabIndex = -1;
  root.innerHTML = `<section class="ps-dashboard">
    <section class="ps-game-carousel" aria-label="Your games">
      <div class="ps-game-carousel__items">${GAMES.map(game => gameTile(game, game.id === selected.id)).join('')}<a class="ps-library-tile" href="#/library" aria-label="Open full game library"><span>${icon('grid')}</span><small>GAME LIBRARY</small></a></div>
      <div class="ps-game-carousel__caption"><span class="ps-platform-mark">PB</span><strong>${safe(selected.title)}</strong><small>${selected.available ? 'READY TO PLAY' : 'IN DEVELOPMENT'}</small></div>
    </section>
    ${hero(selected, stats)}
    ${activityCards(getTotals(), stats)}
  </section>`;
  const onClick = event => {
    const tile = event.target.closest('[data-select-game]');
    if (!tile) return;
    selectGame(tile.dataset.selectGame);
  };
  const onKey = event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const tiles = [...root.querySelectorAll('[data-select-game]')];
    if (!tiles.length) return;
    event.preventDefault();
    const currentIndex = GAMES.findIndex(game => game.id === selected.id);
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + direction + GAMES.length) % GAMES.length;
    selectGame(GAMES[nextIndex].id, true);
  };
  const onFocus = (event) => {
    const tile = event.target.closest('[data-select-game]');
    if (tile) selectGame(tile.dataset.selectGame, false);
  };
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKey);
  root.addEventListener('focusin', onFocus);
  root.focus({ preventScroll: true });
  hydrateIcons(root);
  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKey);
    root.removeEventListener('focusin', onFocus);
  };
}

export function refreshHome(root) {
  const current = root.querySelector('.ps-hero');
  if (!current) return;
  const stats = getStats();
  const totals = getTotals();
  const section = root.querySelector('.ps-activity-grid');
  if (section) section.outerHTML = activityCards(totals, stats);
}
export function onStatsChanged(refresh) {
  return subscribe(event => { if (event && event.type === 'stats') refresh(); });
}
