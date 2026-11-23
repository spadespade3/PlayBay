/* PlayBay · audio engine
   UI clicks use the local Kenney UI Pack (CC0).
   Game and feedback sounds are synthesized with WebAudio, no extra assets. */

import { getSettings, subscribe } from './store.js';

const UI_FILES = {
  click: 'kenney_ui-pack/Sounds/click-a.ogg',
  back: 'kenney_ui-pack/Sounds/click-b.ogg',
  switch: 'kenney_ui-pack/Sounds/switch-a.ogg',
  tap: 'kenney_ui-pack/Sounds/tap-a.ogg',
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.musicNodes = null;
    this.musicTimer = null;
    this.pools = new Map();
    this.lastHit = 0;
    this.unlocked = false;
    this.settings = getSettings();

    subscribe((event) => {
      if (event.type === 'settings') {
        this.settings = event.settings;
        this.applyVolumes();
        if (this.settings.music > 0.01) this.startMusic();
        else this.stopMusic();
      }
    });
  }

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.connect(this.master);
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    if (!this.unlocked) {
      this.unlocked = true;
      if (this.settings.music > 0.01) this.startMusic();
    }
  }

  applyVolumes() {
    if (!this.ctx) return;
    const s = this.settings;
    const now = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.master, now, 0.03);
    this.sfxBus.gain.setTargetAtTime(s.sfx, now, 0.03);
    this.musicBus.gain.setTargetAtTime(s.music * 0.3, now, 0.08);
  }

  /* ---------------------------------------------------------------- UI ==== */

  ui(kind = 'click', volume = 0.5) {
    this.unlock();
    if (!this.ctx || this.settings.sfx <= 0) return;
    const src = UI_FILES[kind];
    if (!src) return;
    try {
      let pool = this.pools.get(kind);
      if (!pool) {
        pool = [];
        for (let i = 0; i < 3; i++) {
          const el = new Audio(new URL(src, document.baseURI).href);
          el.preload = 'auto';
          pool.push(el);
        }
        this.pools.set(kind, pool);
      }
      const el = pool.find((a) => a.paused) || pool[0];
      el.currentTime = 0;
      el.volume = Math.min(1, this.settings.sfx * this.settings.master * volume);
      const played = el.play();
      if (played && played.catch) played.catch(() => {});
    } catch {
      /* audio element blocked - the synth still covers gameplay */
    }
  }

  /* -------------------------------------------------------------- synth ==== */

  tone({ freq = 440, to = null, dur = 0.12, type = 'sine', gain = 0.16, delay = 0, curve = 'exp' }) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to != null) {
      if (curve === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
      else osc.frequency.linearRampToValueAtTime(Math.max(20, to), t0 + dur);
    }
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(env).connect(this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  play(name, data = {}) {
    this.unlock();
    if (!this.ctx || this.settings.sfx <= 0 || this.settings.master <= 0) return;
    const now = performance.now();
    switch (name) {
      case 'paddle': {
        if (now - this.lastHit < 24) return;
        this.lastHit = now;
        const pan = data.left ? -0.25 : 0.25;
        this.tone({ freq: 540 + Math.min(360, (data.speed || 600) * 0.2), to: 940, dur: 0.075, type: 'square', gain: 0.1 });
        this.tone({ freq: 180, to: 120, dur: 0.09, type: 'sine', gain: 0.14 });
        void pan;
        break;
      }
      case 'wall':
        if (now - this.lastHit < 24) return;
        this.lastHit = now;
        this.tone({ freq: 260, to: 180, dur: 0.06, type: 'triangle', gain: 0.08 });
        break;
      case 'serve':
        this.tone({ freq: 740, to: 1180, dur: 0.09, type: 'sine', gain: 0.09 });
        break;
      case 'count':
        this.tone({ freq: 620, to: 620, dur: 0.07, type: 'sine', gain: 0.1 });
        break;
      case 'score':
        this.tone({ freq: 300, to: 110, dur: 0.34, type: 'sawtooth', gain: 0.09 });
        this.tone({ freq: 90, to: 60, dur: 0.4, type: 'sine', gain: 0.16 });
        break;
      case 'win':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
          this.tone({ freq: f, dur: 0.22, type: 'triangle', gain: 0.11, delay: i * 0.11 })
        );
        break;
      case 'lose':
        [392, 329.63, 261.63, 196].forEach((f, i) =>
          this.tone({ freq: f, dur: 0.26, type: 'triangle', gain: 0.1, delay: i * 0.13 })
        );
        break;
      case 'pause':
        this.tone({ freq: 440, to: 220, dur: 0.14, type: 'sine', gain: 0.09 });
        break;
      case 'start':
        this.tone({ freq: 523.25, dur: 0.16, type: 'triangle', gain: 0.1 });
        this.tone({ freq: 783.99, dur: 0.22, type: 'triangle', gain: 0.09, delay: 0.09 });
        break;
      case 'error':
        this.tone({ freq: 180, to: 120, dur: 0.18, type: 'square', gain: 0.08 });
        break;
      case 'join':
        this.tone({ freq: 660, to: 990, dur: 0.12, type: 'sine', gain: 0.09 });
        break;
      default:
        break;
    }
  }

  /* -------------------------------------------------------------- music ==== */

  startMusic() {
    if (!this.ctx || this.musicNodes) return;
    const ctx = this.ctx;
    const bus = ctx.createGain();
    bus.gain.value = 0;
    bus.connect(this.musicBus);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.6;
    filter.connect(bus);

    const notes = [110, 164.81, 220, 261.63];
    const oscs = notes.map((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i % 2 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      osc.detune.value = i * 3 - 4;
      gain.gain.value = i === 0 ? 0.05 : 0.022;
      osc.connect(gain).connect(filter);
      osc.start();
      return { osc, gain };
    });

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.06;
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    bus.gain.setTargetAtTime(1, ctx.currentTime, 1.6);
    this.musicNodes = { bus, filter, oscs, lfo, timer: null };

    let step = 0;
    this.musicNodes.timer = setInterval(() => {
      if (!this.ctx || this.settings.music <= 0.01) return;
      const chords = [
        [261.63, 329.63, 392],
        [220, 261.63, 329.63],
        [293.66, 349.23, 440],
        [196, 246.94, 293.66],
      ];
      const chord = chords[step++ % chords.length];
      const note = chord[Math.floor(Math.random() * chord.length)];
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = note * 2;
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.exponentialRampToValueAtTime(0.02, t0 + 0.6);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.4);
      osc.connect(env).connect(this.musicBus);
      osc.start(t0);
      osc.stop(t0 + 3.6);
    }, 6200);
  }

  stopMusic() {
    if (!this.musicNodes) return;
    const { bus, oscs, lfo, timer } = this.musicNodes;
    this.musicNodes = null;
    clearInterval(timer);
    const now = this.ctx ? this.ctx.currentTime : 0;
    try {
      bus.gain.setTargetAtTime(0, now, 0.4);
      setTimeout(() => {
        oscs.forEach(({ osc }) => {
          try {
            osc.stop();
          } catch {
            /* already stopped */
          }
        });
        try {
          lfo.stop();
        } catch {
          /* already stopped */
        }
        bus.disconnect();
      }, 1600);
    } catch {
      /* context closed */
    }
  }
}

export const audio = new AudioEngine();
