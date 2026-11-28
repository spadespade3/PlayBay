// Navigation + interactions
(function () {
  'use strict';

  const screens = ['home', 'library', 'lobby', 'profile', 'settings'];

  function switchScreen(name) {
    document.querySelectorAll('.nav-item[data-screen], .mobile-nav button[data-screen]').forEach((x) => {
      const isActive = x.dataset.screen === name;
      x.classList.toggle('active', isActive);
      if (x.classList.contains('nav-item')) {
        x.setAttribute('aria-current', isActive ? 'page' : 'false');
      }
    });
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const target = document.getElementById('screen-' + name);
    if (target) target.classList.add('active');
  }

  document.querySelectorAll('.nav-item[data-screen], .mobile-nav button[data-screen]').forEach((btn) => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
  });

  // Keyboard activation for game cards and genre tiles
  function activateCard(el) {
    el.classList.toggle('selected');
  }
  document.querySelectorAll('.game, .lib, .genre').forEach((el) => {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateCard(el);
      }
    });
    el.addEventListener('click', () => activateCard(el));
  });

  // Filters
  document.querySelectorAll('.filter').forEach((f) => {
    f.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach((x) => {
        x.classList.remove('active');
        x.setAttribute('aria-pressed', 'false');
      });
      f.classList.add('active');
      f.setAttribute('aria-pressed', 'true');
    });
  });

  // Toggles
  document.querySelectorAll('.toggle').forEach((t) => {
    t.setAttribute('role', 'switch');
    t.setAttribute('aria-checked', t.classList.contains('on') ? 'true' : 'false');
    t.addEventListener('click', () => {
      const on = t.classList.toggle('on');
      t.setAttribute('aria-checked', String(on));
    });
  });

  // Search: client-side filter of game cards and library items
  const searchInput = document.querySelector('.search input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      document.querySelectorAll('.game, .lib').forEach((el) => {
        const name = (el.querySelector('.game-name, .lib-name') || el).textContent.toLowerCase();
        el.style.display = !q || name.includes(q) ? '' : 'none';
      });
    });
  }

  // Disabled-state honesty for backend-dependent actions
  document.querySelectorAll('[data-requires-backend]').forEach((btn) => {
    btn.setAttribute('disabled', '');
    btn.setAttribute('aria-disabled', 'true');
    btn.title = 'Not available in this build (requires a game session/backend)';
  });

  // Share link: copy connect code to clipboard
  const shareBtn = document.querySelector('[data-action="share"]');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const code = document.querySelector('.code-value')?.textContent?.replace(/\s/g, '') || '';
      try {
        await navigator.clipboard.writeText('https://playbay.app/join/' + code);
        shareBtn.textContent = 'Copied!';
        setTimeout(() => { shareBtn.textContent = 'Share link'; }, 1500);
      } catch (e) {
        shareBtn.title = 'Clipboard unavailable';
      }
    });
  }

  // Save / Reset (localStorage-backed demo persistence)
  const saveBtn = document.querySelector('[data-action="save"]');
  const resetBtn = document.querySelector('[data-action="reset"]');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const state = {};
      document.querySelectorAll('.toggle').forEach((t, i) => { state['toggle_' + i] = t.classList.contains('on'); });
      document.querySelectorAll('select').forEach((s, i) => { state['select_' + i] = s.value; });
      try { localStorage.setItem('playbay-settings', JSON.stringify(state)); } catch (e) {}
      saveBtn.textContent = 'Saved';
      setTimeout(() => { saveBtn.textContent = 'Save'; }, 1200);
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.querySelectorAll('.toggle').forEach((t) => t.classList.remove('on'));
      document.querySelectorAll('select').forEach((s) => { s.selectedIndex = 0; });
      try { localStorage.removeItem('playbay-settings'); } catch (e) {}
      resetBtn.textContent = 'Reset';
    });
  }
})();