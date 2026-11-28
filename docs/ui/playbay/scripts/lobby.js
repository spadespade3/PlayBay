// Real QR code generation for the lobby connect code
(function () {
  'use strict';
  const container = document.querySelector('.qr');
  if (!container) return;

  // qrcode.lib.js exposes a global `st` constructor when loaded as a plain script
  if (typeof st !== 'function') return;

  // Encode a real, scannable payload: the join URL with the connect code.
  const code = '13730';
  const payload = 'https://playbay.app/join/' + code;

  const qr = st(0, 'H');
  qr.addData(payload, 'Byte');
  qr.make();

  const count = qr.getModuleCount();
  const cell = 4;
  const margin = 2;
  const size = count * cell + margin * 2;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('shape-rendering', 'crispEdges');

  // background
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', size);
  bg.setAttribute('height', size);
  bg.setAttribute('fill', '#f2f4f8');
  svg.appendChild(bg);

  // modules
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('fill', '#1c1914');
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', margin + c * cell);
        rect.setAttribute('y', margin + r * cell);
        rect.setAttribute('width', cell);
        rect.setAttribute('height', cell);
        g.appendChild(rect);
      }
    }
  }
  svg.appendChild(g);

  container.innerHTML = '';
  container.appendChild(svg);
})();