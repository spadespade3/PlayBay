/* PlayBay · reusable game card markup */

import { esc } from './ui.js';
import { coverArt } from './catalog.js';

export function gameCardMarkup(game, { locked = false, index = 0 } = {}) {
  const version = game.version || '1.0';
  const badge = locked
    ? `<span class="badge badge--amber"><span class="badge__dot"></span>In development</span>`
    : `<span class="badge badge--cyan"><span class="badge__dot"></span>Ready</span>`;
  const sub = locked ? `${game.category} · in development` : `${game.category} · ${game.players} players`;
  const ctaIcon = locked ? 'lock' : 'play';
  const art = `
    <span class="game-card__top">
      <span>${badge}</span>
      <span class="badge">v${esc(version)}</span>
    </span>
    ${coverArt(game.id)}`;

  const meta = `
    <div>
      <h3 class="game-card__title">${esc(game.title)}</h3>
      <div class="game-card__sub">${esc(sub)}</div>
    </div>
    <span class="game-card__cta" data-icon="${ctaIcon}" aria-hidden="true"></span>`;

  const classes = locked ? 'game-card is-locked' : 'game-card';
  const category = esc(game.category || 'Arcade');
  const style = ` style="--i:${index}"`;

  const body = `
    <div class="game-card__art">
      ${art}
    </div>
    <div class="game-card__meta">
      ${meta}
    </div>`;

  if (locked) {
    return `<div class="${classes}" data-category="${category}"${style}>${body}</div>`;
  }

  return `<a class="${classes}" data-category="${category}" href="#/game/${game.id}"${style}>${body}</a>`;
}

export function mountGameCards(container, games, { locked = false, start = 0 } = {}) {
  if (!container) return;
  const list = Array.isArray(games) ? games : [];
  const visible = locked ? list.filter((g) => !g.available) : list.filter((g) => g.available);
  container.innerHTML = visible.map((game, i) => gameCardMarkup(game, { locked, index: start + i })).join('');
}
