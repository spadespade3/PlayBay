/* PlayBay · Game Library screen */

import { GAMES, playableGames } from '../catalog.js';
import { esc, hydrateIcons } from '../ui.js';
import { mountGameCards } from '../cards.js';

const ALL = 'All';

function chips(categories) {
  const list = [ALL, ...categories];
  return list.map((category) =>
    `<button type="button" class="chip${category === ALL ? ' is-active' : ''}" data-cat="${esc(category)}" aria-pressed="${category === ALL}">${esc(category)}</button>`
  ).join('');
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

  const readySection = document.createElement('section');
  readySection.className = 'lib-section';
  readySection.innerHTML = '<div class="lib-section__head"><h2>Ready to play</h2><span class="rule"></span></div><div class="game-grid" data-library-grid="ready"></div>';
  mountGameCards(readySection.querySelector('.game-grid'), playableGames());
  const lockedSection = document.createElement('section');
  lockedSection.className = 'lib-section';
  lockedSection.innerHTML = '<div class="lib-section__head"><h2>In development</h2><span class="rule"></span></div><div class="game-grid" data-library-grid="locked"></div>';
  mountGameCards(lockedSection.querySelector('.game-grid'), GAMES, { locked: true });
  sections.replaceChildren(readySection, lockedSection);
  const note = document.createElement('div');
  note.className = 'lib-note';
  note.innerHTML = '<span data-icon="info"></span><span>In-development entries are roadmap previews, not playable games yet.</span>';
  sections.appendChild(note);

  const apply = () => {
    const query = (root.querySelector('#librarySearch')?.value || '').trim().toLowerCase();
    const category = chipsRow.querySelector('.chip.is-active')?.dataset.cat || ALL;
    let shown = 0;
    root.querySelectorAll('#librarySections .game-card').forEach((card) => {
      const text = (card.textContent || '').toLowerCase();
      const categoryMatch = category === ALL || (card.dataset.category || '') === category;
      const textMatch = !query || text.includes(query);
      const visible = categoryMatch && textMatch;
      card.hidden = !visible;
      if (visible) shown += 1;
    });
    root.querySelectorAll('#librarySections .lib-section').forEach((section) => {
      const hasVisibleCard = Array.from(section.querySelectorAll('.game-card')).some((card) => !card.hidden);
      section.hidden = !hasVisibleCard;
    });
    if (count) count.textContent = `${shown} game${shown === 1 ? '' : 's'} found`;
  };

  const onInput = () => apply();
  const onChip = (event) => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    chipsRow.querySelectorAll('.chip').forEach((item) => {
      const active = item === chip;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    apply();
  };

  root.querySelector('#librarySearch').addEventListener('input', onInput);
  chipsRow.addEventListener('click', onChip);

  return () => {
    root.querySelector('#librarySearch').removeEventListener('input', onInput);
    chipsRow.removeEventListener('click', onChip);
  };
}
