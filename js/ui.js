/* PlayBay · shared UI helpers: icons, toasts, modals, confetti, counters */

const PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
  play: '<path d="M6 4.2 20 12 6 19.8Z" fill="currentColor" stroke-linejoin="round"/>',
  pause: '<rect x="6" y="4" width="4.2" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="13.8" y="4" width="4.2" height="16" rx="1" fill="currentColor" stroke="none"/>',
  restart: '<path d="M3 12a9 9 0 1 0 3.2-6.9"/><path d="M3 4v5h5"/>',
  'arrow-right': '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
  'arrow-left': '<path d="M20 12H5"/><path d="m11 6-6 6 6 6"/>',
  'chevron-right': '<path d="m9 5 7 7-7 7"/>',
  'chevron-left': '<path d="m15 5-7 7 7 7"/>',
  'chevron-down': '<path d="m5 9 7 7 7-7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  x: '<path d="M6 6 18 18M18 6 6 18"/>',
  check: '<path d="m4 12.5 5 5L20 6.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
  alert: '<path d="M10.3 4.2 2.7 17.4A2 2 0 0 0 4.4 20h15.2a2 2 0 0 0 1.7-2.6L13.7 4.2a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 16h.01"/>',
  volume: '<path d="M11 5 6.5 9H3v6h3.5L11 19Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6a9 9 0 0 1 0 12"/>',
  'volume-off': '<path d="M11 5 6.5 9H3v6h3.5L11 19Z"/><path d="m16 9 5 6M21 9l-5 6"/>',
  music: '<path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  gamepad: '<path d="M7.5 6h9a5.5 5.5 0 0 1 5.4 6.6l-.7 4.1a2.6 2.6 0 0 1-4.4 1.3L14.6 16H9.4l-2.2 2a2.6 2.6 0 0 1-4.4-1.3l-.7-4.1A5.5 5.5 0 0 1 7.5 6Z"/><path d="M6 11h4M8 9v4"/><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="18.2" cy="13.4" r="1" fill="currentColor" stroke="none"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2.4"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M6.5 13.5h.01M10 13.5h.01M13.5 13.5h.01M17 13.5h.01"/><path d="M8 16.5h8"/>',
  mouse: '<rect x="7" y="2.5" width="10" height="19" rx="5"/><path d="M12 6v4"/>',
  touch: '<path d="M8 13V6.5a2 2 0 1 1 4 0V12"/><path d="M12 11.5V10a2 2 0 1 1 4 0v3"/><path d="M16 12.5a2 2 0 1 1 4 0V16a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.6-2.2L5 15.6a2 2 0 0 1 3-2.6l1.5 1.4"/>',
  wifi: '<path d="M2.5 8.5a16 16 0 0 1 19 0"/><path d="M5.5 12a11 11 0 0 1 13 0"/><path d="M8.5 15.5a6 6 0 0 1 7 0"/><circle cx="12" cy="19" r="1.1" fill="currentColor" stroke="none"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.1"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2.2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  share: '<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.4 10.8 7.2-4.2M8.4 13.2l7.2 4.2"/>',
  server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>',
  trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4"/><path d="M17 6h3v2a4 4 0 0 1-4 4"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',
  sparkles: '<path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z"/><path d="M19 14.5 19.8 17l2.2.8-2.2.8L19 21l-.8-2.4-2.2-.8 2.2-.8Z"/><path d="M5 15.5 5.7 17.5 7.5 18l-1.8.7L5 20.5l-.7-1.8L2.5 18l1.8-.5Z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.4l3.4 2"/>',
  star: '<path d="m12 3 2.8 5.9 6.2.8-4.6 4.3 1.2 6.2L12 17.3 6.4 20.2l1.2-6.2L3 9.7l6.2-.8Z"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  crown: '<path d="M3 7.5 7.5 11 12 4l4.5 7L21 7.5 19 19H5Z"/><path d="M5 19h14"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2.4"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 15v2"/>',
  cpu: '<rect x="5.5" y="5.5" width="13" height="13" rx="2.2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2v3.5M15 2v3.5M9 18.5V22M15 18.5V22M2 9h3.5M2 15h3.5M18.5 9H22M18.5 15H22"/>',
  monitor: '<rect x="2.5" y="4" width="19" height="13" rx="2.2"/><path d="M8.5 21h7M12 17v4"/>',
  smartphone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.6"/><path d="M10.5 18.5h3"/>',
  fullscreen: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  minimize: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
  send: '<path d="M21 3 10.5 13.5"/><path d="M21 3 14.5 21l-4-7.5L3 9.8Z"/>',
  shield: '<path d="M12 2.5 4.5 6v6c0 4.4 3.1 7.7 7.5 9.5 4.4-1.8 7.5-5.1 7.5-9.5V6Z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
  heart: '<path d="M12 20.5s-8-4.6-8-10a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.4-8 10-8 10Z"/>',
  disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 14h10l1-14"/><path d="M10 11v6M14 11v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  swords: '<path d="M14.5 9.5 21 3M21 3h-5M21 3v5"/><path d="M9.5 14.5 3 21M3 21h5M3 21v-5"/><path d="m5 3 16 16M19 3 3 19"/>',
  chart: '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="12" width="3" height="5" rx="1"/><rect x="12" y="8" width="3" height="9" rx="1"/><rect x="17" y="5" width="3" height="12" rx="1"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>',
  download: '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>',
  'door-exit': '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8"/><path d="M10 12h11"/><path d="m17 8 4 4-4 4"/>',
  boltCircle: '<circle cx="12" cy="12" r="9"/><path d="M12.5 7 9 12.5h3l-.5 4.5 3.5-5.5h-3Z"/>',
};

export function icon(name) {
  const body = PATHS[name] || PATHS.info;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((node) => {
    if (node.childElementCount > 0) return;
    node.innerHTML = icon(node.dataset.icon);
  });
}

export function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'P';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* -------------------------------------------------------------------------- */
/* Toasts                                                                     */
/* -------------------------------------------------------------------------- */

const TOAST_ICON = { info: 'info', success: 'check', error: 'alert', warn: 'alert' };

export function toast(message, { type = 'info', title = '', duration = 3800 } = {}) {
  const root = document.getElementById('toasts');
  if (!root) return;
  const node = document.createElement('div');
  node.className = `toast toast--${type}`;
  node.innerHTML = `${icon(TOAST_ICON[type] || 'info')}
    <div class="toast__body">
      ${title ? `<div class="toast__title">${esc(title)}</div>` : ''}
      <div class="toast__msg">${esc(message)}</div>
    </div>`;
  root.append(node);

  const remove = () => {
    if (!node.isConnected || node.classList.contains('is-leaving')) return;
    node.classList.add('is-leaving');
    setTimeout(() => node.remove(), 230);
  };
  const timer = setTimeout(remove, Math.max(1200, duration));
  node.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

let modalOpen = false;

export function confirmDialog({
  title = 'Are you sure?',
  message = '',
  confirm = 'Confirm',
  cancel = 'Cancel',
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    if (modalOpen) {
      resolve(false);
      return;
    }
    modalOpen = true;
    const root = document.getElementById('modalRoot');
    const previous = document.activeElement;
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" aria-describedby="modalMsg">
      <h2 id="modalTitle">${esc(title)}</h2>
      <p id="modalMsg">${esc(message)}</p>
      <div class="modal__actions">
        <button class="btn btn--ghost" data-modal="cancel" type="button">${esc(cancel)}</button>
        <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-modal="ok" type="button">${esc(confirm)}</button>
      </div>
    </div>`;
    root.append(backdrop);
    document.body.classList.add('is-locked');
    const focusable = backdrop.querySelectorAll('button');
    const first = backdrop.querySelector('[data-modal="cancel"]');
    const last = backdrop.querySelector('[data-modal="ok"]');
    first.focus({ preventScroll: true });

    const close = (result) => {
      if (!modalOpen) return;
      modalOpen = false;
      document.removeEventListener('keydown', onKey, true);
      backdrop.remove();
      document.body.classList.remove('is-locked');
      if (previous && typeof previous.focus === 'function') previous.focus({ preventScroll: true });
      resolve(result);
    };

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(false);
      } else if (event.key === 'Tab') {
        event.preventDefault();
        const active = document.activeElement;
        if (event.shiftKey) (active === first ? last : first).focus();
        else (active === last ? first : first).focus();
      }
    };

    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) close(false);
      const action = event.target.closest('[data-modal]')?.dataset.modal;
      if (action === 'ok') close(true);
      if (action === 'cancel') close(false);
    });
    document.addEventListener('keydown', onKey, true);
    void focusable;
  });
}

/* -------------------------------------------------------------------------- */
/* Counters                                                                   */
/* -------------------------------------------------------------------------- */

const reducedMotion = () => document.documentElement.dataset.motion === 'reduced';

export function countUp(node, value, { duration = 900, decimals = 0 } = {}) {
  if (!node) return;
  const target = Number(value) || 0;
  if (reducedMotion() || target === 0) {
    node.textContent = target.toFixed(decimals);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = (target * eased).toFixed(decimals);
    if (t < 1) requestAnimationFrame(tick);
    else node.textContent = target.toFixed(decimals);
  };
  requestAnimationFrame(tick);
}

/* -------------------------------------------------------------------------- */
/* Confetti                                                                   */
/* -------------------------------------------------------------------------- */

const fx = { canvas: null, ctx: null, parts: [], running: false, dpr: 1 };

function fxCanvas() {
  if (!fx.canvas) {
    fx.canvas = document.getElementById('fx');
    if (fx.canvas) fx.ctx = fx.canvas.getContext('2d');
    window.addEventListener('resize', sizeFx);
    sizeFx();
  }
  return fx.canvas;
}

function sizeFx() {
  if (!fx.canvas) return;
  fx.dpr = Math.min(2, window.devicePixelRatio || 1);
  fx.canvas.width = Math.floor(window.innerWidth * fx.dpr);
  fx.canvas.height = Math.floor(window.innerHeight * fx.dpr);
  if (fx.ctx) fx.ctx.setTransform(fx.dpr, 0, 0, fx.dpr, 0, 0);
}

export function confetti({ x = window.innerWidth / 2, y = window.innerHeight * 0.35, count = 70, spread = 1 } = {}) {
  if (reducedMotion()) return;
  if (!fxCanvas() || !fx.ctx) return;
  const colors = ['#2ee7ff', '#ff2d95', '#b7ff3c', '#ffd166', '#ffffff', '#8b5cff'];
  for (let i = 0; i < count; i++) {
    if (fx.parts.length > 420) break;
    const angle = Math.random() * Math.PI * 2;
    const power = (2.4 + Math.random() * 7.6) * spread;
    fx.parts.push({
      x,
      y,
      vx: Math.cos(angle) * power,
      vy: Math.sin(angle) * power - 2.2,
      w: 4 + Math.random() * 6,
      h: 3 + Math.random() * 7,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      color: colors[(Math.random() * colors.length) | 0],
      life: 1,
      decay: 0.007 + Math.random() * 0.008,
    });
  }
  if (!fx.running) {
    fx.running = true;
    requestAnimationFrame(fxTick);
  }
}

export function confettiAt(el, count = 60) {
  if (!el) return confetti({ count });
  const rect = el.getBoundingClientRect();
  return confetti({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, count, spread: 0.9 });
}

function fxTick() {
  if (!fx.ctx) {
    fx.running = false;
    return;
  }
  const ctx = fx.ctx;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  for (let i = fx.parts.length - 1; i >= 0; i--) {
    const p = fx.parts[i];
    p.vy += 0.14;
    p.vx *= 0.995;
    p.vy *= 0.995;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= p.decay;
    if (p.life <= 0 || p.y > window.innerHeight + 40) {
      fx.parts.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
  if (fx.parts.length) requestAnimationFrame(fxTick);
  else {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    fx.running = false;
  }
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                       */
/* -------------------------------------------------------------------------- */

export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function timeAgo(ts) {
  if (!ts) return 'never';
  const diff = Date.now() - ts;
  if (diff < 45_000) return 'just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
