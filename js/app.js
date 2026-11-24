/* PlayBay · app shell, hash router, global wiring */
import { subscribe, initials, getSettings } from './store.js';
import { findGame } from './catalog.js';
import { net } from './net.js';
import { audio } from './audio.js';
import { hydrateIcons } from './ui.js';
import { mount as mountHome, refreshHome, onStatsChanged } from './screens/home.js';
import { mount as mountLibrary } from './screens/library.js';
import { mount as mountDetails } from './screens/details.js';
import { mount as mountSettings } from './screens/settings.js';
import { mount as mountMultiplayer } from './screens/multiplayer.js';
import { mount as mountPlayer } from './screens/player.js';

const ALLOWED_MODES = new Set(['cpu', 'local', 'host', 'guest']);
const view = document.getElementById('view');
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');

let routeGeneration = 0;
let routeTimer = 0;
let currentCleanup = null;
let currentHomeStatsCleanup = null;
let gamepadFrame = 0;
let gamepadLastDirection = 0;
let gamepadNextMoveAt = 0;
let booted = false;

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/home';
  const queryIndex = raw.indexOf('?');
  const path = queryIndex < 0 ? raw : raw.slice(0, queryIndex);
  const query = new URLSearchParams(queryIndex < 0 ? '' : raw.slice(queryIndex + 1));
  return { parts: path.split('/').filter(Boolean), query };
}

function resolve(parts, query) {
  const section = parts[0] || 'home';
  if (section === 'library') return { name: 'library' };
  if (section === 'settings') return { name: 'settings' };
  if (section === 'multiplayer') return { name: 'multiplayer' };
  if (section === 'game') {
    const game = findGame(parts[1] || 'neon-pong');
    return game ? { name: 'details', id: game.id } : { name: 'home' };
  }
  if (section === 'play') {
    const game = findGame(parts[1] || 'neon-pong');
    const requestedMode = query.get('mode') || 'cpu';
    if (!game || !game.available || !ALLOWED_MODES.has(requestedMode)) return { name: 'home' };
    return { name: 'player', id: game.id, mode: requestedMode };
  }
  return { name: 'home' };
}

function disposeCurrentScreen() {
  if (routeTimer) {
    clearTimeout(routeTimer);
    routeTimer = 0;
  }
  const cleanups = [currentCleanup, currentHomeStatsCleanup];
  currentCleanup = null;
  currentHomeStatsCleanup = null;
  for (const cleanup of cleanups) {
    if (typeof cleanup === 'function') {
      try { cleanup(); } catch (error) { console.error('[playbay] screen cleanup failed', error); }
    }
  }
}

function renderRoute() {
  const generation = ++routeGeneration;
  const { parts, query } = parseHash();
  const route = resolve(parts, query);
  const desiredHash = route.name === 'details' ? `#/game/${route.id}`
    : route.name === 'player' ? `#/play/${route.id}?mode=${route.mode}`
    : `#/${route.name}`;

  if (window.location.hash !== desiredHash && (route.name === 'home' && parts[0] && !['home', ''].includes(parts[0]))) {
    window.location.hash = desiredHash;
    return;
  }

  const leaving = view.querySelector('.screen');
  if (leaving) leaving.classList.add('is-leaving');
  disposeCurrentScreen();

  routeTimer = window.setTimeout(() => {
    routeTimer = 0;
    if (generation !== routeGeneration) return;
    view.replaceChildren();
    const screen = document.createElement('section');
    screen.className = `screen ${route.name}`;
    view.appendChild(screen);

    let cleanup = () => {};
    try {
      if (route.name === 'home') {
        cleanup = mountHome(screen);
        currentHomeStatsCleanup = onStatsChanged(() => refreshHome(screen));
      } else if (route.name === 'library') cleanup = mountLibrary(screen);
      else if (route.name === 'details') cleanup = mountDetails(screen, { id: route.id });
      else if (route.name === 'settings') cleanup = mountSettings(screen);
      else if (route.name === 'multiplayer') {
        cleanup = mountMultiplayer(screen, { intent: query.get('intent'), auto: query.get('auto'), code: query.get('code') });
      } else if (route.name === 'player') cleanup = mountPlayer(screen, { id: route.id, mode: route.mode });
      currentCleanup = typeof cleanup === 'function' ? cleanup : () => {};
      hydrateIcons(view);
      view.focus?.({ preventScroll: true });
    } catch (error) {
      console.error('[playbay] route mount failed', error);
      screen.textContent = 'This screen could not be opened. Return to the home screen and try again.';
    }
  }, 140);
}

function navigateTo(hash) {
  const next = hash.startsWith('#') ? hash : `#${hash}`;
  if (window.location.hash === next) return;
  window.location.hash = next;
}

function setActiveNav(path) {
  const key = ['game', 'play', ''].includes(path) ? 'home' : path;
  document.querySelectorAll('[data-nav-link]').forEach((el) => {
    const href = el.getAttribute('href') || '#/home';
    const target = href.replace(/^#\//, '').split('?')[0] || 'home';
    el.classList.toggle('is-active', target === key);
  });
}

function focusables() {
  return Array.from(view.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
    .filter((el) => el.offsetParent !== null);
}

function moveFocus(delta) {
  const items = focusables();
  if (!items.length) return;
  let index = items.indexOf(document.activeElement);
  if (index < 0) index = 0;
  items[(index + delta + items.length) % items.length]?.focus();
}

function onViewKeyDown(event) {
  if (event.defaultPrevented || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (view.querySelector('.player')) return;
  if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    moveFocus(event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1);
  }
}

function startGamepadNav() {
  const poll = (now) => {
    const gamepad = Array.from(navigator.getGamepads?.() || []).find((item) => item?.connected);
    if (gamepad && !view.querySelector('.player')) {
      const x = gamepad.axes?.[0] || 0;
      const y = gamepad.axes?.[1] || 0;
      const direction = gamepad.buttons?.[14]?.pressed || x < -0.65 ? -1
        : gamepad.buttons?.[15]?.pressed || x > 0.65 ? 1
        : gamepad.buttons?.[12]?.pressed || y < -0.65 ? -2
        : gamepad.buttons?.[13]?.pressed || y > 0.65 ? 2 : 0;
      const justPressed = direction && direction !== gamepadLastDirection;
      const repeat = direction && direction === gamepadLastDirection && now >= gamepadNextMoveAt;
      if (justPressed || repeat) {
        const key = direction === -1 ? 'ArrowLeft'
          : direction === 1 ? 'ArrowRight'
          : direction === -2 ? 'ArrowUp' : 'ArrowDown';
        view.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
        gamepadNextMoveAt = now + 210;
      }
      gamepadLastDirection = direction;
      if (gamepad.buttons?.[0]?.pressed && !gamepadLastA) document.activeElement?.click?.();
      if (gamepad.buttons?.[1]?.pressed && !gamepadLastB) {
        if (window.location.hash !== '#/home') navigateTo('#/home');
      }
      gamepadLastA = Boolean(gamepad.buttons?.[0]?.pressed);
      gamepadLastB = Boolean(gamepad.buttons?.[1]?.pressed);
    } else {
      gamepadLastDirection = 0;
      gamepadLastA = false;
      gamepadLastB = false;
    }
    gamepadFrame = requestAnimationFrame(poll);
  };
  gamepadFrame = requestAnimationFrame(poll);
}
let gamepadLastA = false;
let gamepadLastB = false;

function bindGlobalWiring() {
  view.addEventListener('keydown', onViewKeyDown);
  document.addEventListener('pointerdown', () => audio.unlock(), { once: true });
  document.querySelectorAll('[data-nav-link]').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      navigateTo(el.getAttribute('href') || '#/home');
    });
  });
  subscribe((event) => {
    if (event.type !== 'settings') return;
    const settings = event.settings;
    if (profileAvatar) profileAvatar.textContent = initials(settings.name);
    if (profileName) profileName.textContent = settings.name;
  });
}

function boot() {
  if (booted) return;
  booted = true;
  bindGlobalWiring();
  window.addEventListener('hashchange', () => {
    const { parts } = parseHash();
    setActiveNav(parts[0] || 'home');
    renderRoute();
  });
  const { parts } = parseHash();
  setActiveNav(parts[0] || 'home');
  const currentSettings = getSettings();
  if (profileAvatar) profileAvatar.textContent = initials(currentSettings.name);
  if (profileName) profileName.textContent = currentSettings.name;
  renderRoute();
  startGamepadNav();
}

window.addEventListener('pagehide', () => {
  disposeCurrentScreen();
  if (gamepadFrame) cancelAnimationFrame(gamepadFrame);
}, { once: true });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
