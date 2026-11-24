/* PlayBay · app shell, hash router, global wiring */

import { getSettings, subscribe, displayName, initials } from './store.js';
import { net } from './net.js';
import { audio } from './audio.js';
import { icon, hydrateIcons } from './ui.js';
import { mount as mountHome, refreshHome, onStatsChanged } from './screens/home.js';
import { mount as mountLibrary } from './screens/library.js';
import { mount as mountDetails } from './screens/details.js';
import { mount as mountSettings } from './screens/settings.js';
import { mount as mountMultiplayer } from './screens/multiplayer.js';
import { mount as mountPlayer } from './screens/player.js';

const NAV_ROUTES = new Set(['home', 'library', 'multiplayer', 'settings']);

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/home';
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const query = new URLSearchParams(qs || '');
  return { parts, query };
}

function resolve(parts) {
  if (parts[0] === 'library') return { name: 'library', id: null };
  if (parts[0] === 'game') return { name: 'details', id: parts[1] || 'neon-pong' };
  if (parts[0] === 'play') return { name: 'player', id: parts[1] || 'neon-pong', mode: 'cpu' };
  if (parts[0] === 'settings') return { name: 'settings', id: null };
  if (parts[0] === 'multiplayer') return { name: 'multiplayer', id: null };
  return { name: 'home', id: null };
}

const view = document.getElementById('view');
const connPill = document.getElementById('connPill');
const connText = document.getElementById('connText');
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');

let currentCleanup = null;
let currentToken = 0;
let booted = false;

function setConn(state, error = '') {
  if (connPill) {
    connPill.dataset.state = state === 'open' && error ? 'error' : state;
    if (connText) connText.textContent = state === 'open' ? 'Live · LAN' : state === 'connecting' ? 'Connecting' : state === 'error' ? 'Server offline' : 'Local play';
  }
}
setConn('local');

net.on('status', (payload) => setConn(payload.state, payload.error));

function renderRoute(token, { replace = false } = {}) {
  const { parts, query } = parseHash();
  const route = resolve(parts);
  const target = `#/${route.name === 'details' ? `game/${route.id}` : route.name === 'player' ? `play/${route.id}` : route.name}${route.mode && route.name === 'player' ? `?mode=${route.mode}` : ''}`;

  if (replace) {
    window.location.replace(window.location.pathname + window.location.search + target);
    return;
  }

  const leaving = view.querySelector('.screen');
  if (leaving) leaving.classList.add('is-leaving');
  const myToken = ++token;
  setTimeout(() => {
    if (myToken !== token) return;
    view.innerHTML = '';
    const screen = document.createElement('section');
    screen.className = `screen ${route.name}`;
    view.appendChild(screen);

    let cleanup = () => {};
    if (route.name === 'home') cleanup = mountHome(screen);
    else if (route.name === 'library') cleanup = mountLibrary(screen);
    else if (route.name === 'details') cleanup = mountDetails(screen, { id: route.id });
    else if (route.name === 'settings') cleanup = mountSettings(screen);
    else if (route.name === 'multiplayer') cleanup = mountMultiplayer(screen, { intent: query.get('intent'), auto: query.get('auto'), code: query.get('code') });
    else if (route.name === 'player') cleanup = mountPlayer(screen, { id: route.id, mode: query.get('mode') || 'cpu' });

    if (route.name === 'home') onStatsChanged(() => refreshHome(screen));

    currentCleanup = () => {
      if (typeof cleanup === 'function') cleanup();
      currentCleanup = null;
    };
    currentToken = token;
    hydrateIcons(view);
  }, 180);
}

function navigateTo(hash, { replace = false } = {}) {
  const next = hash.startsWith('#') ? hash : `#${hash}`;
  if (window.location.hash === next) return;
  if (replace) window.location.replace(window.location.pathname + window.location.search + next);
  else window.location.hash = next;
}

function setActiveNav(path) {
  document.querySelectorAll('[data-nav-link]').forEach((el) => {
    const href = el.getAttribute('href') || '#/home';
    const key = href.replace(/^#\//, '') || 'home';
    el.classList.toggle('is-active', key === path);
  });
}

function focusables() {
  return Array.from(view.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')).filter((el) => el.offsetParent !== null);
}

function moveFocus(delta) {
  const items = focusables();
  if (!items.length) return;
  const current = document.activeElement;
  let idx = items.indexOf(current);
  if (idx === -1) idx = 0;
  const next = items[(idx + delta + items.length) % items.length];
  next.focus();
}

function onViewKeyDown(event) {
  if (event.defaultPrevented) return;
  const key = event.key;
  if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'ArrowLeft' || key === 'ArrowRight') {
    event.preventDefault();
    moveFocus(key === 'ArrowDown' || key === 'ArrowRight' ? 1 : -1);
    return;
  }
  if (key === 'Enter' || key === ' ') {
    const el = document.activeElement;
    if (!el) return;
    if (el.tagName === 'A') {
      event.preventDefault();
      navigateTo(el.getAttribute('href'));
    } else if (el.tagName === 'BUTTON') {
      el.click();
    }
  }
}

function startGamepadNav() {
  let lastPressed = new Set();
  const poll = () => {
    const gp = navigator.getGamepad;
    let gamepad = null;
    if (gp) {
      for (let i = 0; i < 4; i++) {
        const candidate = navigator.getGamepads?.[i];
        if (candidate && candidate.connected) {
          gamepad = candidate;
          break;
        }
      }
    }
    if (gamepad) {
      const pressed = new Set();
      for (let i = 0; i < gamepad.buttons.length; i++) {
        if (gamepad.buttons[i].pressed) pressed.add(i);
      }
      const newOnes = [...pressed].filter((b) => !lastPressed.has(b));
      for (const b of newOnes) {
        const items = focusables();
        if (!items.length) break;
        const current = document.activeElement;
        let idx = items.indexOf(current);
        if (idx === -1) idx = 0;
        let next = items[idx];
        if (b === 0) {
          // A: activate focused
          next?.click?.();
        } else if (b === 1) {
          // B: back / menu
          if (document.querySelector('[data-nav-link]')) document.querySelector('[data-nav-link]')?.focus?.();
        }
      }
      lastPressed = pressed;
    }
    requestAnimationFrame(poll);
  };
  return poll;
}

function bindGlobalWiring() {
  view.addEventListener('keydown', onViewKeyDown);
  document.addEventListener('pointerdown', () => audio.unlock(), { once: true });

  document.querySelectorAll('[data-nav-link]').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      navigateTo(el.getAttribute('href') || '#/home');
    });
  });

  const onStore = (event) => {
    if (event.type === 'settings') {
      const s = event.settings;
      if (profileAvatar) profileAvatar.textContent = initials(s.name);
      if (profileName) profileName.textContent = s.name;
    }
  };
  const offStore = subscribe(onStore);
  return offStore;
}

function boot() {
  if (booted) return;
  booted = true;

  const offStore = bindGlobalWiring();

  window.addEventListener('hashchange', () => {
    const { parts } = parseHash();
    setActiveNav(parts[0] || 'home');
    renderRoute(0);
  });

  // initial route
  const { parts } = parseHash();
  setActiveNav(parts[0] || 'home');
  renderRoute(0);

  // connection pill initial state
  setConn('local');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
