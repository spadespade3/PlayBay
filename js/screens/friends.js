/* PlayBay · Friends and local multiplayer hub */
import { displayName } from '../store.js';
import { hydrateIcons } from '../ui.js';

export function mount(root) {
  root.innerHTML = `
    <section class="pb-page pb-friends">
      <header class="pb-page-head"><div><span class="pb-eyebrow">Play together</span><h1>Friends</h1><p>Bring another player into your session, whether they're beside you or on the same Wi-Fi.</p></div></header>
      <section class="pb-friends-hero">
        <div class="pb-friends-hero__icon"><span data-icon="users"></span></div>
        <div class="pb-friends-hero__copy"><span class="pb-eyebrow">LOCAL MULTIPLAYER</span><h2>Make it a two-player night.</h2><p>Host a room and share its code, or join a room someone else created on your network.</p><a class="pb-primary-action" href="#/multiplayer">Open multiplayer <span aria-hidden="true">↗</span></a></div>
      </section>
      <div class="pb-friends-info-grid">
        <article class="pb-info-card"><span class="pb-info-card__icon" data-icon="radio-tower"></span><h3>Host a room</h3><p>Create a room on this device and invite another player with a six-character code.</p></article>
        <article class="pb-info-card"><span class="pb-info-card__icon" data-icon="keyboard"></span><h3>Join a room</h3><p>Enter a room code from a player on the same Wi-Fi network.</p></article>
        <article class="pb-info-card"><span class="pb-info-card__icon" data-icon="gamepad-2"></span><h3>Play your way</h3><p>Use a keyboard or supported gamepad for local matches.</p></article>
      </div>
      <p class="pb-footnote">Signed in locally as <strong>${String(displayName()).replace(/[&<>"']/g, '')}</strong>. PlayBay currently uses local-network rooms rather than online accounts.</p>
    </section>`;
  hydrateIcons(root);
  return () => {};
}
