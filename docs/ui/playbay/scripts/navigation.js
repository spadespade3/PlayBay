// Navigation + interactions
(function () {
  'use strict';
  const items = document.querySelectorAll('.nav-item[data-screen]');
  items.forEach((btn) => {
    btn.addEventListener('click', () => {
      items.forEach((x) => x.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
      const target = document.getElementById('screen-' + btn.dataset.screen);
      if (target) target.classList.add('active');
    });
  });

  document.querySelectorAll('.filter').forEach((f) => {
    f.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach((x) => x.classList.remove('active'));
      f.classList.add('active');
    });
  });

  document.querySelectorAll('.toggle').forEach((t) => {
    t.addEventListener('click', () => {
      const on = t.classList.toggle('on');
      t.setAttribute('aria-pressed', String(on));
    });
    t.setAttribute('role', 'switch');
    t.setAttribute('aria-checked', t.classList.contains('on') ? 'true' : 'false');
    t.addEventListener('click', () => t.setAttribute('aria-checked', t.classList.contains('on') ? 'true' : 'false'));
  });
})();