/* PlayBay · Home screen */

import { getStats, getTotals, subscribe } from '../store.js';
import { playableGames, findGame, coverArt } from '../catalog.js';
import { icon, esc, hydrateIcons } from '../ui.js';
import { mountGameCards } from '../cards.js';

const TICKER_GROUPS = [
  ['NEON PONG', 'first to seven'],
  ['RALLY', 'speed climbs'],
  ['LOCAL', 'one screen, two players'],
  ['LAN', 'room codes on your network'],
];

function tickerGroup(items) {
  return `<div class="ticker__group"><b>${items[0]}</b> · ${items[1]}</div>`;
}

function heroCourt() {
  return `
    <div class="court" aria-hidden="true">
      <div class="court__grid"></div>
      <div class="court__scan"></div>
      <div class="court__mid"></div>
      <div class="court__score court__score--l">0</div>
      <div class="court__score court__score--r">0</div>
      <div class="paddle paddle--p1"></div>
      <div class="paddle paddle--p2"></div>
      <div class="court__ball"></div>
      <div class="court__trail"></div>
      <div class="court__tag"><span class="dot"></span>First to seven</div>
    </div>`;
}

function quickStatsMarkup(totals) {
  const rows = [
    ['Plays', `${totals.plays}`, 'total'],
    ['Wins', `${totals.wins}`, ''],
    ['Win rate', `${Math.round(totals.winRate * 100)}`, '%'],
    ['Best rally', `${totals.bestRally}`, ''],
  ];
  return rows
    .map(
      ([label, value, unit]) => `
      <div class="quick-stats__row">
        <span class="quick-stats__label">${label}</span>
        <span class="quick-stats__value">${value}<span>${unit}</span></span>
      </div>`
    )
    .join('');
}

function continueMarkup(lastGameId, lastMode) {
  const last = lastGameId ? findGame(lastGameId) : null;
  if (!last) {
    return `
      <div class="continue-card__art">${coverArt('neon-pong')}</div>
      <div class="continue-card__body">
        <h3>Neon Pong</h3>
        <p>No runs yet — first to seven awaits</p>
        <div class="continue-card__actions">
          <a class="btn btn--primary btn--sm" href="#/play/neon-pong?mode=cpu" data-icon="play">Start</a>
          <a class="btn btn--ghost btn--sm" href="#/library">Browse</a>
        </div>
      </div>`;
  }
  return `
      <div class="continue-card__art">${coverArt(last.id)}<span class="continue-card__badge"><span class="badge badge--cyan"><span class="badge__dot"></span>Last played</span></span></div>
      <div class="continue-card__body">
        <h3>${last.title}</h3>
        <p>Mode · ${lastMode || 'cpu'}</p>
        <div class="continue-card__actions">
          <a class="btn btn--primary btn--sm" href="#/play/${last.id}?mode=${lastMode || 'cpu'}" data-icon="play">Resume</a>
          <a class="btn btn--ghost btn--sm" href="#/library">Browse</a>
        </div>
      </div>`;
}

export function mount(root) {
  const totals = getTotals();
  const stats = getStats();
  const featured = playableGames()[0];

  root.innerHTML = `
    <section class="screen home">
      <div class="home">
        <section class="hero">
          <div class="hero__copy">
            <span class="eyebrow">The local arcade</span>
            <h1 class="hero__title">
              <span class="line">NEON</span>
              <span class="line"><span class="glitch" data-text="PONG" data-icon="bolt">PONG</span></span>
            </h1>
            <p class="hero__lede">Two paddles. One ball. A court that never stops accelerating. Neon Pong is the arcade classic rebuilt with substepped physics, a rally-driven speed curve and host-authoritative LAN play.</p>
            <div class="hero__actions">
              <a class="btn btn--primary" href="#/play/neon-pong?mode=cpu" data-icon="play">Play Neon Pong</a>
              <a class="btn btn--magenta" href="#/multiplayer" data-icon="users">Host a room</a>
            </div>
            <div class="hero__meta">
              <span><strong>Neon Pong</strong> v1.0</span>
              <span class="sep"></span>
              <span>First to <strong>7</strong></span>
              <span class="sep"></span>
              <span><strong>Substepped</strong> physics</span>
            </div>
          </div>
          <div class="hero-art" aria-hidden="true">
            <div class="hero-art__halo"></div>
            ${heroCourt()}
            <div class="hero-art__float hero-art__float--a">
              <span class="float-icon"><span data-icon="bolt"></span></span>
              <div><strong>6.2x</strong>Rally speed</div>
            </div>
            <div class="hero-art__float hero-art__float--b">
              <span class="float-icon float-icon--magenta"><span data-icon="trophy"></span></span>
              <div><strong>7</strong>First to seven</div>
            </div>
          </div>
        </section>

        <div class="ticker" aria-hidden="true">
          <div class="ticker__track">
            ${[0, 1].map((copy) => TICKER_GROUPS.map((g) => tickerGroup(g)).join('')).join('')}
          </div>
        </div>

        <section class="home-section">
          <div class="home-split">
            <a class="continue-card" href="#/game/neon-pong">
              <div class="continue-card__art">
                ${coverArt('neon-pong')}
                <span class="continue-card__badge"><span class="badge badge--cyan"><span class="badge__dot"></span>Last played</span></span>
              </div>
              <div class="continue-card__body">
                <h3>Neon Pong</h3>
                <p>${stats.lastGame ? `Last run · ${stats.lastMode || 'cpu'}` : 'No runs yet — first to seven awaits'}</p>
                <div class="continue-card__actions">
                  <a class="btn btn--primary btn--sm" href="#/play/neon-pong?mode=${stats.lastMode || 'cpu'}" data-icon="play">Resume</a>
                  <a class="btn btn--ghost btn--sm" href="#/library">Browse</a>
                </div>
              </div>
            </a>
            <div class="quick-stats">${quickStatsMarkup(totals)}</div>
          </div>
        </section>

        <section class="home-section">
          <div class="section-head">
            <div>
              <h2>Featured</h2>
            </div>
            <a class="section-link" href="#/library">View all <span data-icon="arrow-right"></span></a>
          </div>
          <div class="game-grid game-grid--feature" id="homeFeatured"></div>
        </section>

        <section class="home-section">
          <div class="section-head">
            <div>
              <h2>Why the arcade</h2>
            </div>
          </div>
          <div class="feature-grid">
            <div class="feature">
              <span class="feature__icon"><span data-icon="users"></span></span>
              <h3>Couch co-op</h3>
              <p>Two players, one screen, one keyboard or two gamepads. Neon Pong runs local and online from the same court.</p>
            </div>
            <div class="feature">
              <span class="feature__icon feature__icon--magenta"><span data-icon="wifi"></span></span>
              <h3>LAN rooms</h3>
              <p>Host a room on your network, drop a code on the second device, and run a host-authoritative duel.</p>
            </div>
            <div class="feature">
              <span class="feature__icon feature__icon--lime"><span data-icon="music"></span></span>
              <h3>Synth arcade</h3>
              <p>Synthesized impact sounds, paddle sparks and screen shake. The cabinet needed no asset pipeline.</p>
            </div>
          </div>
        </section>

        <section class="home-cta">
          <div class="home-cta__copy">
            <h2>One more player. One room code.</h2>
            <p>Host a LAN match from this device and join from any other phone or laptop on the same network.</p>
          </div>
          <div class="btn-row">
            <a class="btn btn--magenta btn--lg" href="#/multiplayer" data-icon="users">Host a room</a>
            <a class="btn btn--ghost btn--lg" href="#/game/neon-pong?mode=local" data-icon="users">Local 2P</a>
          </div>
        </section>
      </div>
    </section>`;

  const featuredGrid = root.querySelector('#homeFeatured');
  if (featured) {
    mountGameCards(featuredGrid, [
      featured,
      findGame('hyper-drift') || featured,
      findGame('block-storm') || featured,
    ]);
  }
  hydrateIcons(root);
  return () => {};
}

export function refreshHome(root) {
  const totals = getTotals();
  const stats = getStats();
  const quick = root.querySelector('.quick-stats');
  const continueCard = root.querySelector('.continue-card');
  if (quick) quick.innerHTML = quickStatsMarkup(totals);
  if (continueCard) continueCard.innerHTML = continueMarkup(stats.lastGame, stats.lastMode);
  hydrateIcons(root);
}

export function onStatsChanged(refresh) {
  return subscribe((event) => {
    if (event && event.type === 'stats') refresh();
  });
}
