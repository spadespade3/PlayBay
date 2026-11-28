// Accessible navigation and client-side demo interactions.
(function () {
  'use strict';

  const screens = ['home', 'library', 'lobby', 'profile', 'settings'];
  const navButtons = [...document.querySelectorAll('[data-screen]')];
  const screenNodes = [...document.querySelectorAll('.screen')];

  function switchScreen(name) {
    if (!screens.includes(name)) return;
    navButtons.forEach((button) => {
      const active = button.dataset.screen === name;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    screenNodes.forEach((screen) => {
      const active = screen.id === 'screen-' + name;
      screen.classList.toggle('active', active);
      screen.hidden = !active;
    });
  }

  navButtons.forEach((button) => button.addEventListener('click', () => switchScreen(button.dataset.screen)));
  switchScreen('home');

  // These are content cards in this prototype, not fake buttons.
  document.querySelectorAll('.game, .lib, .genre').forEach((card) => {
    card.removeAttribute('tabindex');
    if (card.getAttribute('role') === 'button') card.removeAttribute('role');
    card.classList.remove('selected');
  });

  const searchInput = document.querySelector('.search input');
  const libraryCards = [...document.querySelectorAll('.lib')];
  const recentCards = [...document.querySelectorAll('.game')];
  const filters = [...document.querySelectorAll('.filter')];
  const emptyState = document.querySelector('[data-library-empty]');

  let activeFilter = 'all';
  function applyLibraryView() {
    const query = (searchInput?.value || '').trim().toLocaleLowerCase();
    let visibleCount = 0;
    libraryCards.forEach((card) => {
      const matchesQuery = !query || card.textContent.toLocaleLowerCase().includes(query);
      const matchesFilter = activeFilter === 'all' || card.dataset[activeFilter] === 'true';
      const visible = matchesQuery && matchesFilter;
      card.hidden = !visible;
      if (visible) visibleCount++;
    });
    if (emptyState) emptyState.hidden = visibleCount !== 0;
  }

  function applyRecentSearch() {
    const query = (searchInput?.value || '').trim().toLocaleLowerCase();
    recentCards.forEach((card) => {
      card.hidden = !!query && !card.textContent.toLocaleLowerCase().includes(query);
    });
  }

  searchInput?.addEventListener('input', () => {
    applyLibraryView();
    applyRecentSearch();
  });

  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      activeFilter = filter.dataset.filter || 'all';
      filters.forEach((item) => {
        const active = item === filter;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      applyLibraryView();
    });
  });

  // Native buttons already provide keyboard support; keep switch state in sync.
  document.querySelectorAll('.toggle').forEach((toggle) => {
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-checked', String(toggle.classList.contains('on')));
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('on');
      toggle.setAttribute('aria-checked', String(toggle.classList.contains('on')));
    });
  });

  // Backend-dependent actions are genuinely unavailable in this static prototype.
  document.querySelectorAll('[data-requires-backend]').forEach((button) => {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
    button.title = 'Unavailable in this demo: requires a PlayBay game session.';
  });

  const shareButton = document.querySelector('[data-action="share"]');
  shareButton?.addEventListener('click', async () => {
    const url = window.PlayBaySession?.joinUrl;
    if (!url) {
      shareButton.textContent = 'Link unavailable';
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const field = document.createElement('textarea');
        field.value = url;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('Copy command failed');
      }
      shareButton.textContent = 'Copied!';
      shareButton.setAttribute('aria-live', 'polite');
      window.setTimeout(() => { shareButton.textContent = 'Share link'; }, 1600);
    } catch (_) {
      shareButton.textContent = 'Copy unavailable';
      shareButton.title = 'Clipboard permission was denied by this browser.';
    }
  });

  const storageKey = 'playbay-settings';
  const toggles = [...document.querySelectorAll('.toggle')];
  const selects = [...document.querySelectorAll('select')];
  const defaults = {
    toggles: toggles.map((toggle) => toggle.classList.contains('on')),
    selects: selects.map((select) => select.options[0]?.value ?? select.options[0]?.textContent ?? '')
  };

  function applySettings(state) {
    toggles.forEach((toggle, index) => {
      const enabled = typeof state.toggles?.[index] === 'boolean' ? state.toggles[index] : defaults.toggles[index];
      toggle.classList.toggle('on', enabled);
      toggle.setAttribute('aria-checked', String(enabled));
    });
    selects.forEach((select, index) => {
      const value = state.selects?.[index];
      if (typeof value === 'string' && [...select.options].some((option) => option.value === value || option.textContent === value)) {
        select.value = value;
      } else {
        select.selectedIndex = 0;
      }
    });
  }

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) applySettings(JSON.parse(stored));
  } catch (_) {
    // Private browsing, disabled storage, or invalid saved data: keep safe defaults.
  }

  const saveButton = document.querySelector('[data-action="save"]');
  const resetButton = document.querySelector('[data-action="reset"]');
  saveButton?.addEventListener('click', () => {
    const state = {
      toggles: toggles.map((toggle) => toggle.classList.contains('on')),
      selects: selects.map((select) => select.value)
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      saveButton.textContent = 'Saved';
      window.setTimeout(() => { saveButton.textContent = 'Save'; }, 1400);
    } catch (_) {
      saveButton.textContent = 'Storage unavailable';
      window.setTimeout(() => { saveButton.textContent = 'Save'; }, 1800);
    }
  });
  resetButton?.addEventListener('click', () => {
    applySettings(defaults);
    try { localStorage.removeItem(storageKey); } catch (_) {}
    resetButton.textContent = 'Defaults restored';
    window.setTimeout(() => { resetButton.textContent = 'Reset'; }, 1400);
  });
})();