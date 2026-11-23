/* PlayBay · Game Library screen */

import { GAMES, playableGames } from '../catalog.js';
import { esc, hydrateIcons } from '../ui.js';
import { mountGameCards } from '../cards.js';

const ALL = 'All';

function chips(categories) {
  const list = [ALL, ...categories];
  return list
    .map((c) => `<button type="button" class="chip${c === 'All' ? ' is-active' : ''}" data-cat="${c}">${esc(c)}</button>`)
    .join('');
}

export function mount(root) {
  const categories = [...new Set(GAMES.map((g) => g.category))];

  root.innerHTML = `
    <section class="screen library">
      <div class="page-head">
        <div class="page-head__copy">
          <span class="eyebrow">The collection</span>
          <h1>Game Library</h1>
        </div>
        <div class="page-head__actions">
          <a class="btn btn--ghost" href="#/multiplayer" data-icon="users">LAN play</a>
        </div>
      </div>

      <div class="library-toolbar">
        <div class="search">
          <svg data-icon="search" aria-hidden="true"></svg>
          <input class="input" id="librarySearch" type="search" placeholder="Search the arcade" autocomplete="off" />
        </div>
        <div class="chip-row" id="libraryChips"></div>
        <span class="result-count" id="libraryResultCount"></span>
      </div>

      <div id="librarySections"></div>
    </section>`;

  const chipsRow = root.querySelector('#libraryChips');
  chipsRow.innerHTML = chips(categories);
  const count = root.querySelector('#libraryResultCount');
  const sections = root.querySelector('#librarySections');

  const readyGrid = document.createElement('div');
  readyGrid.className = 'game-grid';
  mountGameCards(readyGrid, playableGames());
  const lockedGrid = document.createElement('div');
  lockedGrid.className = 'game-grid';
  mountGameCards(lockedGrid, GAMES, { locked: true });

  sections.innerHTML = `
    <div class="lib-section">
      <div class="lib-section__head">
        <h2>Ready to play</h2>
        <span class="rule"></span>
      </div>
      ${readyGrid.innerHTML}
    </div>
    <div class="lib-section">
      <div class="lib-section__head">
        <h2>In development</h2>
        <span class="rule"></span>
      </div>
      ${lockedGrid.innerHTML}
    </div>
    <div class="lib-note">
      <span data-icon="info"></span>
      <span>Every game ships complete. In-development entries are real roadmap builds, not placeholders.</span>
    </div>`;

  const apply = () => {
    const q = (root.querySelector('#librarySearch')?.value || '').trim().toLowerCase();
    const grids = [readyGrid, lockedGrid];
    let shown = 0;
    for (const grid of grids) {
      for (const card of grid.querySelectorAll('.game-card')) {
        const text = card.textContent || '';
        const match = !q || text.toLowerCase().includes(q);
        card.style.display = match ? '' : 'none';
        if (match) shown += 1;
      }
    }
    if (count) count.textContent = `${shown} game${shown === 1 ? '' : 's'} found`;
  };

  const onInput = () => apply();
  const onChip = (event) => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    chipsRow.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    apply();
  };

  root.querySelector('#librarySearch').addEventListener('input', onInput);
  chipsRow.addEventListener('click', onChip);

  return () => {
    root.querySelector('#librarySearch').removeEventListener('input', onInput);
    chipsRow.removeEventListener('click', onChip);
  };
}
