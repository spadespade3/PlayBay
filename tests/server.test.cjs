'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const port = 18000 + Math.floor(Math.random() * 35000);
const baseUrl = 'http://127.0.0.1:' + port;
let serverProcess;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl + '/');
      if (response.ok) return;
    } catch {
      // server is still starting
    }
    await wait(100);
  }
  throw new Error('PlayBay server did not start in time');
}

function maskedTextFrame(value) {
  const payload = Buffer.from(JSON.stringify(value));
  if (payload.length >= 126) throw new Error('test frame is unexpectedly large');
  const mask = crypto.randomBytes(4);
  const frame = Buffer.alloc(2 + 4 + payload.length);
  frame[0] = 0x81;
  frame[1] = 0x80 | payload.length;
  mask.copy(frame, 2);
  for (let i = 0; i < payload.length; i++) frame[6 + i] = payload[i] ^ mask[i & 3];
  return frame;
}

function readServerFrame(buffer) {
  if (buffer.length < 2) return null;
  const opcode = buffer[0] & 0x0f;
  const masked = (buffer[1] & 0x80) !== 0;
  let length = buffer[1] & 0x7f;
  let offset = 2;
  if (length === 126) {
    if (buffer.length < 4) return null;
    length = buffer.readUInt16BE(2);
    offset = 4;
  } else if (length === 127) {
    if (buffer.length < 10) return null;
    const big = buffer.readBigUInt64BE(2);
    if (big > 65536n) throw new Error('unexpectedly large test response');
    length = Number(big);
    offset = 10;
  }
  if (masked) throw new Error('server-to-client frames must not be masked');
  if (buffer.length < offset + length) return null;
  return { opcode, text: buffer.subarray(offset, offset + length).toString('utf8'), used: offset + length };
}

function websocketRequest({ origin = baseUrl, message = null, keepOpen = false } = {}) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1');
    let buffer = Buffer.alloc(0);
    let upgraded = false;
    let sent = false;
    let settled = false;
    const timeout = setTimeout(() => finish(new Error('WebSocket test timed out')), 5000);

    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (!keepOpen || error || !result || result.status !== 101) socket.destroy();
      if (error) reject(error);
      else resolve({ ...result, socket });
    };

    socket.on('error', (error) => finish(error));
    socket.on('connect', () => {
      const key = crypto.randomBytes(16).toString('base64');
      socket.write(
        'GET / HTTP/1.1\r\n' +
        'Host: 127.0.0.1:' + port + '\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: keep-alive, Upgrade\r\n' +
        'Sec-WebSocket-Version: 13\r\n' +
        'Sec-WebSocket-Key: ' + key + '\r\n' +
        'Origin: ' + origin + '\r\n\r\n'
      );
    });
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (!upgraded) {
        const boundary = buffer.indexOf('\r\n\r\n');
        if (boundary < 0) return;
        const headers = buffer.subarray(0, boundary).toString('utf8');
        buffer = buffer.subarray(boundary + 4);
        const status = Number((headers.match(/^HTTP\/1\.1 (\d+)/) || [])[1] || 0);
        if (status !== 101) {
          finish(null, { status, headers });
          return;
        }
        upgraded = true;
        if (message && !sent) {
          sent = true;
          socket.write(maskedTextFrame(message));
        } else if (!message) {
          finish(null, { status, headers });
          return;
        }
      }
      if (upgraded && message) {
        const frame = readServerFrame(buffer);
        if (!frame) return;
        if (frame.opcode !== 0x1) return finish(new Error('expected a text response'));
        let parsed;
        try { parsed = JSON.parse(frame.text); } catch (error) { return finish(error); }
        finish(null, { status: 101, headers: 'HTTP/1.1 101', message: parsed });
      }
    });
  });
}

test.before(async () => {
  serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: repoRoot,
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForServer();
});

test.after(async () => {
  if (!serverProcess || serverProcess.killed) return;
  serverProcess.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => serverProcess.once('exit', resolve)),
    wait(2000),
  ]);
});

test('static server serves app files but refuses repository-private files', async () => {
  const app = await fetch(baseUrl + '/index.html');
  assert.equal(app.status, 200);
  const module = await fetch(baseUrl + '/js/app.js');
  assert.equal(module.status, 200);
  const packageFile = await fetch(baseUrl + '/package.json');
  assert.equal(packageFile.status, 403);
  const readme = await fetch(baseUrl + '/README.md');
  assert.equal(readme.status, 403);
  const gitFile = await fetch(baseUrl + '/.git/config');
  assert.equal(gitFile.status, 403);
});

test('WebSocket rejects cross-origin browser connections', async () => {
  const result = await websocketRequest({ origin: 'http://evil.example' });
  assert.equal(result.status, 403);
});

test('same-origin WebSocket can create and join a six-character LAN room', async () => {
  const host = await websocketRequest({
    message: { type: 'create', name: 'Host Player' },
    keepOpen: true,
  });
  try {
    assert.equal(host.status, 101);
    assert.equal(host.message.type, 'room');
    assert.match(host.message.code, /^[A-HJ-NP-Z2-9]{6}$/);

    const guest = await websocketRequest({
      message: { type: 'join', code: host.message.code, name: 'Guest Player' },
    });
    assert.equal(guest.status, 101);
    assert.equal(guest.message.type, 'room');
    assert.equal(guest.message.host, false);
    assert.equal(guest.message.players.length, 2);
  } finally {
    host.socket.destroy();
  }
});
