// Real QR code generation for the lobby connect code
(function () {
  'use strict';

  // Single source of truth for this lobby session.
  const session = {
    connectCode: '137 30',
    joinUrl: 'https://playbay.app/join/13730',
  };

  const codeEl = document.querySelector('.code-value');
  if (codeEl) codeEl.textContent = session.connectCode;

  const container = document.querySelector('.qr');
  if (!container) return;

  // If the QR library failed to load, show an honest unavailable state.
  if (typeof st !== 'function') {
    container.textContent = 'QR unavailable';
    container.style.display = 'grid';
    container.style.placeItems = 'center';
    container.style.fontSize = '12px';
    container.style.color = '#7a746a';
    return;
  }

  const qr = st(0, 'H');
  qr.addData(session.joinUrl, 'Byte');
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
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'QR code for ' + session.joinUrl);

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', size);
  bg.setAttribute('height', size);
  bg.setAttribute('fill', '#f2f4f8');
  svg.appendChild(bg);

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