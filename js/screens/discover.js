/* PlayBay · Discover screen */
import { GAMES, coverArt } from '../catalog.js';
import { hydrateIcons } from '../ui.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function mount(root) {
  root.innerHTML = `
    <section class="pb-page pb-discover">
      <header class="pb-page-head"><div><span class="pb-eyebrow">Find your next match</span><h1>Discover</h1><p>Explore the games on PlayBay, from ready-to-play favorites to what's coming next.</p></div></header>
      <section class="pb-feature-strip">
        <div class="pb-feature-strip__art">${coverArt('neon-pong')}</div>
        <div class="pb-feature-strip__copy"><span class="pb-eyebrow">FEATURED · READY TO PLAY</span><h2>Neon Pong</h2><p>One court. Two paddles. Every rally raises the stakes.</p><a class="pb-primary-action" href="#/game/neon-pong">View game <span aria-hidden="true">↗</span></a></div>
      </section>
      <div class="pb-section-heading"><div><span class="pb-eyebrow">THE PLAYBAY COLLECTION</span><h2>Browse games</h2></div><span class="pb-count">${GAMES.length} titles</span></div>
      <div class="pb-discover-grid">${GAMES.map(game => `<a class="pb-discover-card" href="#/game/${esc(game.id)}"><span class="pb-discover-card__art">${coverArt(game.id)}</span><span class="pb-discover-card__body"><span class="pb-discover-card__meta">${esc(game.category)} · ${game.available ? 'AVAILABLE' : 'COMING SOON'}</span><strong>${esc(game.title)}</strong><small>${esc(game.tagline)}</small></span><span class="pb-discover-card__arrow" aria-hidden="true">↗</span></a>`).join('')}</div>
    </section>`;
  hydrateIcons(root);
  return () => {};
}
