/* PlayBay · persistent settings and career stats */

import { GAMES } from './catalog.js';

const SETTINGS_KEY = 'playbay.settings.v2';
const STATS_KEY = 'playbay.stats.v2';

export const DEFAULT_SETTINGS = Object.freeze({
  name: 'Player One',
  master: 0.8,
  sfx: 0.85,
  music: 0.22,
  motion: 'full',
  crt: true,
  difficulty: 'normal',
  showHud: true,
});

const listeners = new Set();

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked - session keeps working in memory */
  }
}

function clamp01(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}

function sanitizeName(value) {
  const name = String(value == null ? '' : value)
    .replace(/[\u0000-\u001f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 16);
  return name || DEFAULT_SETTINGS.name;
}

function sanitizeSettings(input) {
  const source = input && typeof input === 'object' ? input : {};
  return {
    name: sanitizeName(source.name),
    master: clamp01(source.master, DEFAULT_SETTINGS.master),
    sfx: clamp01(source.sfx, DEFAULT_SETTINGS.sfx),
    music: clamp01(source.music, DEFAULT_SETTINGS.music),
    motion: source.motion === 'reduced' ? 'reduced' : 'full',
    crt: source.crt !== false,
    difficulty: ['chill', 'normal', 'insane'].includes(source.difficulty)
      ? source.difficulty
      : DEFAULT_SETTINGS.difficulty,
    showHud: source.showHud !== false,
  };
}

let settings = sanitizeSettings({ ...DEFAULT_SETTINGS, ...(readJSON(SETTINGS_KEY) || {}) });

function emptyGameStats() {
  return {
    plays: 0,
    wins: 0,
    losses: 0,
    bestRally: 0,
    bestScore: 0,
    seconds: 0,
    lastPlayed: 0,
  };
}

function emptyStats() {
  const games = {};
  for (const game of GAMES) games[game.id] = emptyGameStats();
  return { games, lastGame: null, lastMode: null };
}

function sanitizeStats(input) {
  const base = emptyStats();
  if (!input || typeof input !== 'object') return base;
  if (input.games && typeof input.games === 'object') {
    for (const game of GAMES) {
      const row = input.games[game.id];
      if (!row || typeof row !== 'object') continue;
      base.games[game.id] = {
        plays: Math.max(0, Math.floor(Number(row.plays) || 0)),
        wins: Math.max(0, Math.floor(Number(row.wins) || 0)),
        losses: Math.max(0, Math.floor(Number(row.losses) || 0)),
        bestRally: Math.max(0, Math.floor(Number(row.bestRally) || 0)),
        bestScore: Math.max(0, Math.floor(Number(row.bestScore) || 0)),
        seconds: Math.max(0, Math.floor(Number(row.seconds) || 0)),
        lastPlayed: Math.max(0, Number(row.lastPlayed) || 0),
      };
    }
  }
  base.lastGame = typeof input.lastGame === 'string' ? input.lastGame : null;
  base.lastMode = typeof input.lastMode === 'string' ? input.lastMode : null;
  return base;
}

let stats = sanitizeStats(readJSON(STATS_KEY));

function applyDocumentSettings() {
  const root = document.documentElement;
  root.dataset.motion = settings.motion;
  root.dataset.crt = settings.crt ? 'on' : 'off';
  root.style.setProperty('--sfx', String(settings.sfx));
}

export function getSettings() {
  return { ...settings };
}

export function saveSettings(patch) {
  if (!patch || typeof patch !== 'object') return getSettings();
  settings = sanitizeSettings({ ...settings, ...patch });
  writeJSON(SETTINGS_KEY, settings);
  applyDocumentSettings();
  emit({ type: 'settings', settings: getSettings() });
  return getSettings();
}

export function resetSettings() {
  settings = sanitizeSettings(DEFAULT_SETTINGS);
  writeJSON(SETTINGS_KEY, settings);
  applyDocumentSettings();
  emit({ type: 'settings', settings: getSettings() });
  return getSettings();
}

export function getStats() {
  return JSON.parse(JSON.stringify(stats));
}

export function getGameStats(gameId) {
  return { ...(stats.games[gameId] || emptyGameStats()) };
}

export function recordMatch({ gameId, mode, result, score, rally, seconds }) {
  if (!stats.games[gameId]) {
    stats.games[gameId] = emptyGameStats();
  }
  const row = stats.games[gameId];
  row.plays += 1;
  if (result === 'win') row.wins += 1;
  if (result === 'loss') row.losses += 1;
  row.bestRally = Math.max(row.bestRally, Math.floor(Number(rally) || 0));
  row.bestScore = Math.max(row.bestScore, Math.floor(Number(score) || 0));
  row.seconds += Math.max(0, Math.floor(Number(seconds) || 0));
  row.lastPlayed = Date.now();
  stats.lastGame = gameId;
  stats.lastMode = mode || null;
  writeJSON(STATS_KEY, stats);
  emit({ type: 'stats', stats: getStats() });
  return { ...row };
}

export function recordPlay({ gameId, mode }) {
  if (!stats.games[gameId]) return;
  const row = stats.games[gameId];
  row.lastPlayed = Date.now();
  stats.lastGame = gameId;
  stats.lastMode = mode || null;
  writeJSON(STATS_KEY, stats);
  emit({ type: 'stats', stats: getStats() });
}

export function resetStats() {
  stats = emptyStats();
  writeJSON(STATS_KEY, stats);
  emit({ type: 'stats', stats: getStats() });
}

export function getTotals() {
  let plays = 0;
  let wins = 0;
  let losses = 0;
  let bestRally = 0;
  for (const row of Object.values(stats.games)) {
    plays += row.plays;
    wins += row.wins;
    losses += row.losses;
    bestRally = Math.max(bestRally, row.bestRally);
  }
  return { plays, wins, losses, bestRally, winRate: plays ? wins / plays : 0 };
}

export function displayName() {
  return settings.name;
}

export function initials(name = settings.name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'P';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(event) {
  for (const fn of listeners) {
    try {
      fn(event);
    } catch (err) {
      console.error('[playbay] store listener failed', err);
    }
  }
}

applyDocumentSettings();
