/* PlayBay · game catalog + original inline cover art */

const P = {
  cyan: '#2ee7ff',
  cyanSoft: '#8df4ff',
  magenta: '#ff2d95',
  magentaSoft: '#ff87c2',
  lime: '#b7ff3c',
  amber: '#ffd166',
  violet: '#8b5cff',
  ink: '#eef2ff',
};

export const GAMES = [
  {
    id: 'neon-pong',
    title: 'Neon Pong',
    tagline: 'The original duel, rebuilt for the grid.',
    category: 'Arcade',
    players: '1-2',
    available: true,
    accent: P.cyan,
    accent2: P.magenta,
    version: '1.0',
    updated: '2026-11-20',
    tags: ['Arcade', 'Versus', 'Competitive', 'LAN'],
    summary:
      'Two paddles. One ball. A court that never stops accelerating. Neon Pong is the arcade classic rebuilt with substepped physics, a rally-driven speed curve and host-authoritative LAN play.',
    description:
      'Every rally adds velocity. Every edge changes the angle. The ball leaves your paddle at up to sixty degrees, so placement beats reaction. First to seven takes the set.',
    features: [
      'Substepped ball physics with paddle-angle control',
      'Rally-driven speed ramp and three CPU difficulty tiers',
      'Local two-player on one keyboard or two gamepads',
      'Host-authoritative LAN rooms with room codes',
      'Synthesized impact audio and particle feedback',
    ],
    modes: [
      { id: 'cpu', name: 'VS CPU', desc: 'Practice the angle game against the house AI.', accent: 'cyan', icon: 'cpu' },
      { id: 'local', name: 'Local 2P', desc: 'One keyboard, two players. W/S versus arrows.', accent: 'lime', icon: 'users' },
      { id: 'host', name: 'Host Online', desc: 'Create a room and play from another device.', accent: 'magenta', icon: 'wifi' },
      { id: 'guest', name: 'Join Online', desc: 'Enter a room code from a host on your network.', accent: 'violet', icon: 'link' },
    ],
  },
  {
    id: 'hyper-drift',
    title: 'Hyper Drift',
    tagline: 'Zero grip. Full send.',
    category: 'Racing',
    players: '1-4',
    available: false,
    accent: P.magenta,
    accent2: P.amber,
    tags: ['Racing', 'Split-screen', 'Party'],
    summary:
      'A four-lane synthwave sprint with drift scoring, slipstream boosts and a split-screen finish line. Currently in development.',
    features: ['Split-screen drift racing', 'Slipstream boost model', 'Four controller support'],
  },
  {
    id: 'block-storm',
    title: 'Block Storm',
    tagline: 'Stack fast. Clear clean.',
    category: 'Puzzle',
    players: '1-2',
    available: false,
    accent: P.violet,
    accent2: P.cyan,
    tags: ['Puzzle', 'Versus', 'Head-to-head'],
    summary:
      'A versus puzzler where cleared lines fire garbage at your opponent. Currently in development.',
    features: ['Garbage-line versus mode', 'Combo and back-to-back scoring', 'Two-player split board'],
  },
  {
    id: 'orbit-arena',
    title: 'Orbit Arena',
    tagline: 'Two ships. One gravity well.',
    category: 'Arcade',
    players: '2',
    available: false,
    accent: P.lime,
    accent2: P.cyan,
    tags: ['Arcade', 'Versus', 'Physics'],
    summary:
      'Twin-stick dueling around a collapsing star. Thrust, slingshot, shoot. Currently in development.',
    features: ['Gravity-assisted movement', 'Projectile leading', 'Local and LAN duels'],
  },
  {
    id: 'pixel-panic',
    title: 'Pixel Panic',
    tagline: 'Co-op chaos, one screen.',
    category: 'Party',
    players: '2-4',
    available: false,
    accent: P.amber,
    accent2: P.lime,
    tags: ['Party', 'Co-op', 'Platformer'],
    summary:
      'A couch co-op scramble where four climbers share one rope and no patience. Currently in development.',
    features: ['Four-player co-op', 'Shared-rope physics', 'Score attack mode'],
  },
  {
    id: 'bass-bounce',
    title: 'Bass Bounce',
    tagline: 'Play the drop.',
    category: 'Party',
    players: '1-2',
    available: false,
    accent: P.cyan,
    accent2: P.violet,
    tags: ['Rhythm', 'Party', 'Music'],
    summary:
      'A waveform rhythm runner keyed to a synthesized soundtrack. Currently in development.',
    features: ['Beat-mapped obstacle lanes', 'Synthesized soundtrack', 'Two-lane versus mode'],
  },
];

export function findGame(id) {
  return GAMES.find((game) => game.id === id) || null;
}

export function playableGames() {
  return GAMES.filter((game) => game.available);
}

export function gameCategories() {
  return ['All', ...new Set(GAMES.map((game) => game.category))];
}

/* --------------------------------------------------------------------------
   Cover art · original inline SVG, no external assets
   -------------------------------------------------------------------------- */

const artCache = new Map();

function shell(id, inner, bgA = '#0a1028', bgB = '#05070f') {
  return `<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/>
    </linearGradient>
    <radialGradient id="halo-${id}" cx="50%" cy="45%" r="62%">
      <stop offset="0" stop-color="${P.cyan}" stop-opacity=".18"/>
      <stop offset="1" stop-color="${P.cyan}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="250" fill="url(#bg-${id})"/>
  <rect width="400" height="250" fill="url(#halo-${id})"/>
  ${inner}
</svg>`;
}

const ART = {
  'neon-pong': () =>
    shell(
      'pong',
      `<g stroke="${P.cyan}" stroke-width="1" opacity=".16">
        <path d="M0 196 L400 196 M0 216 L400 216 M0 236 L400 236 M24 250 L150 168 M88 250 L192 168 M152 250 L234 168 M216 250 L276 168 M280 250 L318 168 M344 250 L360 168"/>
      </g>
      <line x1="200" y1="26" x2="200" y2="214" stroke="${P.cyanSoft}" stroke-width="2" stroke-dasharray="5 12" opacity=".3"/>
      <text x="126" y="98" text-anchor="middle" font-size="76" fill="#ffffff" opacity=".07">3</text>
      <text x="274" y="98" text-anchor="middle" font-size="76" fill="#ffffff" opacity=".07">5</text>
      <rect x="56" y="74" width="26" height="86" rx="13" fill="${P.cyan}" opacity=".14"/>
      <rect x="61" y="82" width="12" height="70" rx="6" fill="${P.cyan}"/>
      <rect x="319" y="98" width="26" height="86" rx="13" fill="${P.magenta}" opacity=".14"/>
      <rect x="328" y="106" width="12" height="70" rx="6" fill="${P.magenta}"/>
      <circle cx="205" cy="132" r="26" fill="${P.cyan}" opacity=".09"/>
      <circle cx="205" cy="132" r="13" fill="${P.cyan}" opacity=".22"/>
      <circle cx="205" cy="132" r="6.5" fill="#ffffff"/>
      <circle cx="186" cy="140" r="4" fill="${P.cyan}" opacity=".35"/>
      <circle cx="174" cy="145" r="2.6" fill="${P.cyan}" opacity=".2"/>`,
      '#0b1430',
      '#05070f'
    ),
  'hyper-drift': () =>
    shell(
      'drift',
      `<circle cx="200" cy="126" r="62" fill="${P.amber}" opacity=".16"/>
      <circle cx="200" cy="126" r="38" fill="${P.magenta}" opacity=".85"/>
      <g stroke="${P.cyanSoft}" stroke-width="1.4" opacity=".28">
        <path d="M0 168 L400 168 M0 190 L400 190 M0 214 L400 214 M0 240 L400 240"/>
        <path d="M200 168 L120 250 M200 168 L280 250 M200 168 L40 250 M200 168 L360 250"/>
      </g>
      <path d="M60 206 L128 206 L162 162 L234 162 L268 206 L336 206" fill="none" stroke="${P.cyan}" stroke-width="2.5" opacity=".5"/>
      <path d="M176 172 L200 152 L224 172 L200 166 Z" fill="${P.cyan}"/>
      <rect x="184" y="178" width="32" height="7" rx="3.5" fill="${P.cyan}" opacity=".85"/>
      <path d="M150 186 L182 186 M218 186 L250 186" stroke="${P.magenta}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
      '#1a0b24',
      '#07040d'
    ),
  'block-storm': () =>
    shell(
      'block',
      `<g opacity=".18" stroke="${P.violet}" stroke-width="1">
        <path d="M0 50 H400 M0 100 H400 M0 150 H400 M0 200 H400 M50 0 V250 M100 0 V250 M150 0 V250 M200 0 V250 M250 0 V250 M300 0 V250 M350 0 V250"/>
      </g>
      <g>
        <rect x="70" y="58" width="34" height="34" rx="4" fill="${P.violet}"/>
        <rect x="108" y="58" width="34" height="34" rx="4" fill="${P.violet}" opacity=".8"/>
        <rect x="146" y="58" width="34" height="34" rx="4" fill="${P.violet}" opacity=".6"/>
        <rect x="108" y="96" width="34" height="34" rx="4" fill="${P.cyan}"/>
        <rect x="146" y="96" width="34" height="34" rx="4" fill="${P.cyan}" opacity=".8"/>
        <rect x="184" y="96" width="34" height="34" rx="4" fill="${P.cyan}" opacity=".6"/>
        <rect x="238" y="140" width="30" height="30" rx="4" fill="${P.magenta}"/>
        <rect x="272" y="140" width="30" height="30" rx="4" fill="${P.magenta}" opacity=".75"/>
        <rect x="238" y="174" width="30" height="30" rx="4" fill="${P.magenta}" opacity=".55"/>
        <rect x="272" y="174" width="30" height="30" rx="4" fill="#ffffff" opacity=".25"/>
      </g>
      <path d="M40 218 H360" stroke="${P.cyanSoft}" stroke-width="2" opacity=".25"/>`,
      '#140a28',
      '#06050f'
    ),
  'orbit-arena': () =>
    shell(
      'orbit',
      `<g fill="none" stroke="${P.lime}" stroke-width="1" opacity=".25">
        <ellipse cx="200" cy="126" rx="132" ry="66"/>
        <ellipse cx="200" cy="126" rx="96" ry="44" transform="rotate(-16 200 126)"/>
        <ellipse cx="200" cy="126" rx="58" ry="26" transform="rotate(14 200 126)"/>
      </g>
      <circle cx="200" cy="126" r="22" fill="${P.lime}" opacity=".9"/>
      <circle cx="200" cy="126" r="40" fill="${P.lime}" opacity=".12"/>
      <path d="M74 74 L96 86 L74 98 L80 86 Z" fill="${P.cyan}"/>
      <path d="M74 74 L60 104 L74 98 Z" fill="${P.cyan}" opacity=".5"/>
      <path d="M326 158 L304 170 L326 182 L320 170 Z" fill="${P.magenta}"/>
      <path d="M326 158 L340 188 L326 182 Z" fill="${P.magenta}" opacity=".5"/>
      <circle cx="74" cy="86" r="20" fill="${P.cyan}" opacity=".08"/>
      <circle cx="326" cy="170" r="20" fill="${P.magenta}" opacity=".08"/>
      <circle cx="228" cy="182" r="4" fill="${P.amber}"/>
      <circle cx="252" cy="166" r="2.5" fill="${P.amber}" opacity=".55"/>`,
      '#081a16',
      '#04070d'
    ),
  'pixel-panic': () =>
    shell(
      'pixel',
      `<g fill="${P.lime}" opacity=".2">
        <rect x="0" y="206" width="400" height="44"/>
      </g>
      <g fill="${P.lime}">
        <rect x="0" y="206" width="24" height="8"/><rect x="48" y="206" width="16" height="8"/>
        <rect x="96" y="206" width="40" height="8"/><rect x="168" y="206" width="24" height="8"/>
        <rect x="224" y="206" width="56" height="8"/><rect x="312" y="206" width="24" height="8"/>
        <rect x="360" y="206" width="32" height="8"/>
      </g>
      <g fill="${P.amber}">
        <rect x="60" y="150" width="10" height="10"/><rect x="60" y="160" width="10" height="10"/>
        <rect x="70" y="160" width="10" height="10"/><rect x="50" y="160" width="10" height="10"/>
        <rect x="60" y="170" width="10" height="10"/><rect x="70" y="180" width="10" height="10"/>
      </g>
      <g fill="${P.cyan}">
        <rect x="330" y="140" width="10" height="10"/><rect x="330" y="150" width="10" height="10"/>
        <rect x="320" y="150" width="10" height="10"/><rect x="340" y="150" width="10" height="10"/>
        <rect x="330" y="160" width="10" height="10"/><rect x="320" y="170" width="10" height="10"/>
      </g>
      <path d="M60 170 C140 120 250 190 330 160" fill="none" stroke="${P.magentaSoft}" stroke-width="2" opacity=".35"/>
      <g fill="#ffffff" opacity=".5">
        <rect x="120" y="70" width="3" height="3"/><rect x="188" y="46" width="3" height="3"/>
        <rect x="252" y="84" width="3" height="3"/><rect x="300" y="56" width="3" height="3"/>
      </g>
      <circle cx="200" cy="120" r="30" fill="${P.amber}" opacity=".06"/>`,
      '#121026',
      '#06060f'
    ),
  'bass-bounce': () =>
    shell(
      'bass',
      `<g fill="${P.cyan}">
        <rect x="42" y="168" width="12" height="40" rx="4" opacity=".45"/>
        <rect x="62" y="140" width="12" height="68" rx="4" opacity=".65"/>
        <rect x="82" y="104" width="12" height="104" rx="4" opacity=".9"/>
        <rect x="102" y="128" width="12" height="80" rx="4" opacity=".7"/>
        <rect x="122" y="86" width="12" height="122" rx="4"/>
        <rect x="142" y="118" width="12" height="90" rx="4" opacity=".75"/>
        <rect x="162" y="60" width="12" height="148" rx="4" opacity=".9"/>
        <rect x="182" y="100" width="12" height="108" rx="4" opacity=".65"/>
        <rect x="202" y="132" width="12" height="76" rx="4" opacity=".8"/>
      </g>
      <g fill="${P.magenta}">
        <rect x="222" y="110" width="12" height="98" rx="4" opacity=".75"/>
        <rect x="242" y="76" width="12" height="132" rx="4" opacity=".9"/>
        <rect x="262" y="120" width="12" height="88" rx="4" opacity=".6"/>
        <rect x="282" y="96" width="12" height="112" rx="4" opacity=".8"/>
        <rect x="302" y="140" width="12" height="68" rx="4" opacity=".5"/>
        <rect x="322" y="112" width="12" height="96" rx="4" opacity=".7"/>
        <rect x="342" y="152" width="12" height="56" rx="4" opacity=".4"/>
      </g>
      <circle cx="200" cy="70" r="36" fill="none" stroke="${P.violet}" stroke-width="2" opacity=".35"/>
      <circle cx="200" cy="70" r="54" fill="none" stroke="${P.violet}" stroke-width="1" opacity=".18"/>
      <circle cx="200" cy="70" r="7" fill="${P.violet}"/>`,
      '#0a0a26',
      '#05040d'
    ),
};

export function coverArt(id) {
  if (!artCache.has(id)) {
    const fn = ART[id];
    artCache.set(id, fn ? fn() : shell('fallback', '', '#0a1028', '#05070f'));
  }
  return artCache.get(id);
}

export function modeIcon(mode) {
  switch (mode) {
    case 'cpu':
      return 'cpu';
    case 'local':
      return 'users';
    case 'host':
      return 'wifi';
    case 'guest':
      return 'link';
    default:
      return 'play';
  }
}
