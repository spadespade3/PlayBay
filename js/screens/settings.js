/* PlayBay · Settings screen */

import { getSettings, saveSettings, resetSettings, resetStats, subscribe } from '../store.js';
import { esc, hydrateIcons, confirmDialog } from '../ui.js';

const DIFFICULTIES = ['chill', 'normal', 'insane'];

export function mount(root) {
  let settings = getSettings();

  const render = () => {
    settings = getSettings();
    root.innerHTML = `
      <section class="screen settings">
        <div class="page-head">
          <div class="page-head__copy">
            <span class="eyebrow">Preferences</span>
            <h1>Settings</h1>
          </div>
        </div>

        <div class="settings">
          <div class="panel panel--pad">
            <div class="panel__head"><span class="panel__title">Player</span></div>
            <div class="field">
              <label class="field__label" for="settingsName">Callsign</label>
              <input class="input" id="settingsName" maxlength="16" value="${esc(settings.name)}" />
              <p class="field__hint">Shown to opponents in LAN rooms.</p>
            </div>
            <div class="name-preview">
              <span class="avatar avatar--cyan">${esc((settings.name || 'P').trim().charAt(0).toUpperCase())}</span>
              <div class="name-preview__body">
                <span class="name-preview__name">${esc(settings.name)}</span>
                <span class="name-preview__hint">Preview of how you appear in rooms and leaderboards.</span>
              </div>
            </div>
            <hr class="divider" />
            <div class="setting-row">
              <div class="setting-row__text">
                <span class="setting-row__title">Motion</span>
                <span class="setting-row__desc">Full motion, or reduced for low-power cabinets.</span>
              </div>
              <div class="setting-row__control">
                <label class="toggle">
                  <span class="toggle__text">
                    <span class="toggle__title">Motion</span>
                    <span class="toggle__desc">Animations and ambience</span>
                  </span>
                  <input type="checkbox" data-setting="motion" ${settings.motion === 'full' ? 'checked' : ''} />
                  <span class="toggle__switch"></span>
                </label>
              </div>
            </div>
            <div class="setting-row">
              <div class="setting-row__text">
                <span class="setting-row__title">CRT scanline</span>
                <span class="setting-row__desc">Subtle phosphor curvature and scanlines.</span>
              </div>
              <div class="setting-row__control">
                <label class="toggle">
                  <span class="toggle__text">
                    <span class="toggle__title">CRT</span>
                    <span class="toggle__desc">Scanlines and curvature</span>
                  </span>
                  <input type="checkbox" data-setting="crt" ${settings.crt ? 'checked' : ''} />
                  <span class="toggle__switch"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="panel panel--pad">
            <div class="panel__head"><span class="panel__title">Audio</span></div>
            ${[
              ['volume', 'Master', settings.master],
              ['volume', 'SFX', settings.sfx],
              ['music', 'Music', settings.music],
            ]
              .map(
                ([iconName, label, value]) => `
            <div class="volume-row">
              <span class="volume-row__icon"><span data-icon="${iconName}"></span></span>
              <div class="volume-row__body">
                <div class="volume-row__label"><span>${label}</span><span class="range-value">${Math.round(value * 100)}%</span></div>
                <input class="range" type="range" min="0" max="1" step="0.01" value="${value}" data-vol="${label.toLowerCase()}" />
              </div>
            </div>`
              )
              .join('')}
          </div>

          <div class="panel panel--pad">
            <div class="panel__head"><span class="panel__title">Gameplay</span></div>
            <div class="setting-row" style="border-bottom:0;">
              <div class="setting-row__text">
                <span class="setting-row__title">CPU difficulty</span>
                <span class="setting-row__desc">Rally-driven speed curve and return angles.</span>
              </div>
              <div class="setting-row__control">
                <div class="segmented" id="difficultySegmented">
                  ${DIFFICULTIES.map((d) => `<button type="button" class="segmented__btn${settings.difficulty === d ? ' is-active' : ''}" data-diff="${d}">${d === 'chill' ? 'Chill' : d === 'normal' ? 'Normal' : 'Insane'}</button>`).join('')}
                </div>
              </div>
            </div>
            <div class="setting-row" style="border-bottom:0;">
              <div class="setting-row__text">
                <span class="setting-row__title">HUD</span>
                <span class="setting-row__desc">Show scores and phase markers in the cabinet.</span>
              </div>
              <div class="setting-row__control">
                <label class="toggle">
                  <span class="toggle__text">
                    <span class="toggle__title">HUD</span>
                    <span class="toggle__desc">Show gameplay HUD</span>
                  </span>
                  <input type="checkbox" data-setting="showHud" ${settings.showHud ? 'checked' : ''} />
                  <span class="toggle__switch"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="panel panel--pad panel--wide">
            <div class="panel__head"><span class="panel__title">Data</span></div>
            <div class="setting-row" style="border-bottom:0;">
              <div class="setting-row__text">
                <span class="setting-row__title">Career stats</span>
                <span class="setting-row__desc">Local play only. Resets every recorded match.</span>
              </div>
              <div class="setting-row__control">
                <button type="button" class="btn btn--danger" data-action="reset-stats">Reset stats</button>
              </div>
            </div>
            <div class="setting-row" style="border-bottom:0;">
              <div class="setting-row__text">
                <span class="setting-row__title">Preferences</span>
                <span class="setting-row__desc">Restore defaults for callsign, audio and motion.</span>
              </div>
              <div class="setting-row__control">
                <button type="button" class="btn btn--ghost" data-action="reset-settings">Reset defaults</button>
              </div>
            </div>
            <hr class="divider" />
            <div class="settings-about">
              <p>Kenney UI Pack audio and fonts (CC0) · synthesized game audio · PlayBay cabinet renders. Start the relay with <code>node server.js</code>.</p>
              <div class="credits">
                <span>Assets: <a href="https://kenney.nl" target="_blank" rel="noreferrer">kenney.nl</a> UI Pack (CC0)</span>
                <span>Fonts: <a href="https://kenney.nl/assets" target="_blank" rel="noreferrer">Kenney Future</a> family (CC0)</span>
              </div>
            </div>
          </div>
        </div>
      </section>`;
  };

  const applySettings = () => {
    settings = getSettings();
    const nameInput = root.querySelector('#settingsName');
    if (nameInput && document.activeElement !== nameInput) nameInput.value = settings.name;
    const previewName = root.querySelector('.name-preview__name');
    if (previewName) previewName.textContent = settings.name || 'Player';
    const previewAvatar = root.querySelector('.name-preview .avatar');
    if (previewAvatar) previewAvatar.textContent = (settings.name || 'P').trim().charAt(0).toUpperCase();
    root.querySelectorAll('[data-setting]').forEach(input => input.checked = Boolean(settings[input.dataset.setting]));
    root.querySelectorAll('[data-vol]').forEach(input => {
      input.value = String(settings[input.dataset.vol] ?? 0);
      const value = input.closest('.volume-row')?.querySelector('.range-value');
      if (value) value.textContent = Math.round(Number(input.value) * 100) + '%';
    });
    root.querySelectorAll('[data-diff]').forEach(button => button.classList.toggle('is-active', button.dataset.diff === settings.difficulty));
  };

  const onName = (event) => {
    saveSettings({ name: event.target.value });
    const previewName = root.querySelector('.name-preview__name');
    if (previewName) previewName.textContent = event.target.value || 'Player';
    const previewAvatar = root.querySelector('.name-preview .avatar');
    if (previewAvatar) previewAvatar.textContent = (event.target.value || 'P').trim().charAt(0).toUpperCase();
  };
  const onToggle = (event) => {
    const input = event.target;
    if (!input || input.type !== 'checkbox') return;
    const key = input.dataset.setting;
    saveSettings({ [key]: key === 'motion' ? (input.checked ? 'full' : 'reduced') : input.checked });
  };
  const onVolume = (event) => {
    const input = event.target;
    if (!input || input.type !== 'range') return;
    saveSettings({ [input.dataset.vol]: Number(input.value) });
  };
  const onAction = async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.action === 'reset-stats') {
      const ok = await confirmDialog({
        title: 'Reset career stats',
        message: 'Wipe every recorded play across all games? This cannot be undone.',
        confirm: 'Reset stats',
        danger: true,
      });
      if (ok) resetStats();
    } else if (button.dataset.action === 'reset-settings') {
      const ok = await confirmDialog({
        title: 'Reset preferences',
        message: 'Restore callsign, audio levels, motion and difficulty to defaults?',
        confirm: 'Reset defaults',
        danger: true,
      });
      if (ok) resetSettings();
    }
  };

  root.addEventListener('input', (event) => {
    const target = event.target;
    if (target.id === 'settingsName') onName({ target });
    else if (target.dataset.vol) {
      onVolume({ target });
      const value = target.closest('.volume-row')?.querySelector('.range-value');
      if (value) value.textContent = Math.round(Number(target.value) * 100) + '%';
    }
  });
  root.addEventListener('change', (event) => {
    const target = event.target;
    if (target.dataset.setting) onToggle({ target });
  });
  root.addEventListener('click', (event) => {
    const segmented = event.target.closest('.segmented__btn');
    if (segmented) {
      saveSettings({ difficulty: segmented.dataset.diff });
      return;
    }
    const action = event.target.closest('[data-action]');
    if (action) onAction({ target: action });
  });

  render();
  const off = subscribe(() => applySettings());
  return () => off();
}
