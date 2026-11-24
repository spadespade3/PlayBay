'use strict';

/**
 * PlayBay server
 * - static file host (no dependencies)
 * - minimal RFC 6455 WebSocket implementation for LAN rooms
 *
 * Run: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_PAYLOAD = 64 * 1024;
const MAX_CLIENTS = 64;
const MAX_ROOMS = 128;
const ROOM_CODE_LENGTH = 6;
const ROOM_IDLE_MS = 45 * 60 * 1000;
const PUBLIC_ROOTS = new Set(['index.html', 'css', 'js', 'kenney_ui-pack']);
const ipLimits = new Map();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/* ------------------------------------------------------------------ */
/* Static server                                                       */
/* ------------------------------------------------------------------ */

function isSafePublicPath(fullPath) {
  const relative = path.relative(ROOT, fullPath);
  if (!relative || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) return false;
  const parts = relative.split(path.sep);
  if (parts.some((part) => !part || part.startsWith('.'))) return false;
  if (!PUBLIC_ROOTS.has(parts[0])) return false;
  if (parts.includes('node_modules') || parts.includes('.git')) return false;
  return parts[0] !== 'index.html' || parts.length === 1;
}

function resolveFile(rawUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent((rawUrl || '/').split('?')[0]);
  } catch {
    return null;
  }
  if (pathname === '/') pathname = '/index.html';
  if (!pathname.startsWith('/')) return null;
  const full = path.resolve(ROOT, '.' + pathname);
  return isSafePublicPath(full) ? full : null;
}

function allowIpAction(ip, action, limit, windowMs = 60000) {
  const now = Date.now();
  let record = ipLimits.get(ip);
  if (!record || now - record.startedAt >= windowMs) {
    record = { startedAt: now, counts: Object.create(null) };
    ipLimits.set(ip, record);
  }
  record.counts[action] = (record.counts[action] || 0) + 1;
  return record.counts[action] <= limit;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
    return;
  }

  const file = resolveFile(req.url);
  if (!file) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.realpath(file, (realError, realFile) => {
    if (realError || !isSafePublicPath(realFile)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
      res.end('Not found');
      return;
    }
    fs.stat(realFile, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
        res.end('Not found');
        return;
      }
      const ext = path.extname(realFile).toLowerCase();
      const headers = {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Content-Length': stat.size,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'same-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      };
      res.writeHead(200, headers);
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      const stream = fs.createReadStream(realFile);
      stream.on('error', () => { if (!res.headersSent) res.writeHead(500); res.end(); });
      stream.pipe(res);
    });
  });
});

/* ------------------------------------------------------------------ */
/* WebSocket framing                                                   */
/* ------------------------------------------------------------------ */

function encodeFrame(payload, opcode) {
  const data = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload), 'utf8');
  const len = data.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  header[0] = 0x80 | (opcode || 0x1);
  return Buffer.concat([header, data]);
}

/* ------------------------------------------------------------------ */
/* Rooms                                                               */
/* ------------------------------------------------------------------ */

const rooms = new Map();
const clients = new Set();
let clientSeq = 0;

function makeRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) code += alphabet[crypto.randomInt(0, alphabet.length)];
  return code;
}

function cleanName(value) {
  const name = String(value || '')
    .replace(/[^\p{L}\p{N} _.'-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 16);
  return name || 'Player';
}

function roomPlayers(room) {
  return [...room.clients].map((c) => ({
    id: c.id,
    name: c.name,
    host: c === room.host,
  }));
}

function roomPayload(room) {
  return { code: room.code, players: roomPlayers(room), started: room.started };
}

function sendTo(room, message, except) {
  const raw = JSON.stringify(message);
  for (const client of room.clients) {
    if (client === except) continue;
    client.sendRaw(raw);
  }
}

function broadcast(room, message) {
  sendTo(room, message, null);
}

class Client {
  constructor(socket, ip) {
    this.id = 'p' + (++clientSeq).toString(36) + crypto.randomBytes(4).toString('hex');
    this.ip = ip;
    this.messageWindow = Date.now();
    this.messageCounts = Object.create(null);
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.fragments = null;
    this.fragmentOpcode = 0x1;
    this.name = 'Player';
    this.room = null;
    this.isHost = false;
    this.alive = true;
    this.closed = false;

    socket.setNoDelay(true);
    socket.on('data', (chunk) => this.onData(chunk));
    socket.on('close', () => this.onClose());
    socket.on('error', () => this.onClose());
    clients.add(this);
  }

  sendRaw(raw) {
    if (!this.alive || this.socket.destroyed) return;
    if (this.socket.writableLength > 256 * 1024) {
      this.terminate();
      return;
    }
    try {
      this.socket.write(encodeFrame(raw, 0x1));
    } catch {
      this.terminate();
    }
  }

  allowMessage(type) {
    const now = Date.now();
    if (now - this.messageWindow >= 1000) {
      this.messageWindow = now;
      this.messageCounts = Object.create(null);
    }
    const limits = { input: 120, state: 45, create: 5, join: 10, default: 30 };
    const limit = limits[type] || limits.default;
    this.messageCounts[type] = (this.messageCounts[type] || 0) + 1;
    return this.messageCounts[type] <= limit;
  }

  send(message) {
    this.sendRaw(JSON.stringify(message));
  }

  error(message) {
    this.send({ type: 'error', message });
  }

  onData(chunk) {
    if (!this.alive) return;
    this.buffer = this.buffer.length ? Buffer.concat([this.buffer, chunk]) : chunk;
    if (this.buffer.length > MAX_PAYLOAD * 2) {
      this.terminate();
      return;
    }

    for (;;) {
      const buf = this.buffer;
      if (buf.length < 2) return;

      const fin = (buf[0] & 0x80) !== 0;
      const rsv = buf[0] & 0x70;
      const opcode = buf[0] & 0x0f;
      const masked = (buf[1] & 0x80) !== 0;
      if (rsv !== 0 || ![0x0, 0x1, 0x8, 0x9, 0xa].includes(opcode)) {
        this.terminate();
        return;
      }
      let len = buf[1] & 0x7f;
      let offset = 2;

      if (len === 126) {
        if (buf.length < 4) return;
        len = buf.readUInt16BE(2);
        offset = 4;
      } else if (len === 127) {
        if (buf.length < 10) return;
        const big = buf.readBigUInt64BE(2);
        if (big > BigInt(MAX_PAYLOAD)) {
          this.terminate();
          return;
        }
        len = Number(big);
        offset = 10;
      }

      const isControl = opcode >= 0x8;
      if (!masked || len > MAX_PAYLOAD || (isControl && (!fin || len > 125))) {
        this.terminate();
        return;
      }
      if (buf.length < offset + 4 + len) return;

      const mask = buf.subarray(offset, offset + 4);
      offset += 4;
      const payload = Buffer.allocUnsafe(len);
      for (let i = 0; i < len; i++) payload[i] = buf[offset + i] ^ mask[i & 3];

      this.buffer = buf.subarray(offset + len);
      this.handleFrame(fin, opcode, payload);
    }
  }

  handleFrame(fin, opcode, payload) {
    if (opcode === 0x8) {
      try {
        this.socket.write(encodeFrame(Buffer.alloc(0), 0x8));
      } catch {
        /* socket already closing */
      }
      this.terminate();
      return;
    }
    if (opcode === 0x9) {
      try {
        this.socket.write(encodeFrame(payload, 0xa));
      } catch {
        this.terminate();
      }
      return;
    }
    if (opcode === 0xa) {
      this.alive = true;
      return;
    }

    if (opcode === 0x1) {
      if (this.fragments) { this.terminate(); return; }
      if (!fin) {
        this.fragments = [payload];
        this.fragmentOpcode = opcode;
        return;
      }
      this.onMessage(payload);
      return;
    }

    if (opcode === 0x0 && this.fragments) {
      this.fragments.push(payload);
      const total = this.fragments.reduce((n, b) => n + b.length, 0);
      if (total > MAX_PAYLOAD) {
        this.terminate();
        return;
      }
      if (fin) {
        const full = Buffer.concat(this.fragments);
        this.fragments = null;
        this.onMessage(full);
      }
      return;
    }
  }

  onMessage(payload) {
    let message;
    try {
      message = JSON.parse(payload.toString('utf8'));
    } catch {
      this.error('Malformed message.');
      return;
    }
    if (!message || typeof message.type !== 'string') return;
    if (!this.allowMessage(message.type)) {
      this.error('Too many requests. Slow down and try again.');
      return;
    }

    try {
      handleMessage(this, message);
    } catch (err) {
      console.error('[playbay] handler error:', err);
      this.error('Server could not process that request.');
    }
  }

  onClose() {
    if (this.closed) return;
    this.closed = true;
    this.alive = false;
    clients.delete(this);
    leaveRoom(this);
  }

  terminate() {
    this.onClose();
    try {
      this.socket.destroy();
    } catch {
      /* already gone */
    }
  }
}

function leaveRoom(client) {
  const room = client.room;
  if (!room) return;
  room.clients.delete(client);
  client.room = null;

  if (room.host === client) {
    for (const other of [...room.clients]) {
      other.room = null;
      other.isHost = false;
      other.send({ type: 'peer-left', reason: 'host', players: [] });
    }
    rooms.delete(room.code);
    log(`room ${room.code} closed (host left)`);
    return;
  }

  client.isHost = false;
  if (room.clients.size === 0) {
    rooms.delete(room.code);
    return;
  }
  room.started = false;
  broadcast(room, {
    type: 'peer-left',
    reason: 'guest',
    players: roomPlayers(room),
  });
  broadcast(room, { type: 'room', ...roomPayload(room) });
}

function handleMessage(client, message) {
  if (client.room) client.room.lastActivity = Date.now();
  switch (message.type) {
    case 'create': {
      if (rooms.size >= MAX_ROOMS) {
        client.error('The server is at room capacity. Try again later.');
        return;
      }
      leaveRoom(client);
      let code = makeRoomCode();
      let guard = 0;
      while (rooms.has(code) && guard++ < 50) code = makeRoomCode();
      const room = {
        code,
        clients: new Set([client]),
        host: client,
        started: false,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      rooms.set(code, room);
      client.room = room;
      client.isHost = true;
      client.name = cleanName(message.name);
      client.send({
        type: 'room',
        ...roomPayload(room),
        playerId: client.id,
        host: true,
      });
      log(`room ${code} created by ${client.name}`);
      return;
    }

    case 'join': {
      if (!allowIpAction(client.ip, 'join', 10)) {
        client.error('Too many room-code attempts. Wait a minute and try again.');
        return;
      }
      const code = String(message.code || '').trim().toUpperCase();
      if (code.length !== ROOM_CODE_LENGTH || [...code].some((char) => !'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.includes(char))) {
        client.error('Room code is invalid.');
        return;
      }
      const room = rooms.get(code);
      if (!room) {
        client.error('Room not found. Check the code and try again.');
        return;
      }
      if (room.started) {
        client.error('That match has already started.');
        return;
      }
      if (room.clients.size >= 2) {
        client.error('That room is full.');
        return;
      }
      leaveRoom(client);
      client.name = cleanName(message.name);
      room.clients.add(client);
      room.lastActivity = Date.now();
      client.room = room;
      client.isHost = false;

      client.send({
        type: 'room',
        ...roomPayload(room),
        playerId: client.id,
        host: false,
      });
      sendTo(room, { type: 'players', players: roomPlayers(room) }, client);
      sendTo(room, { type: 'peer-joined', name: client.name }, client);
      log(`${client.name} joined room ${code}`);
      return;
    }

    case 'start': {
      const room = client.room;
      if (!room) return;
      if (!client.isHost) {
        client.error('Only the host can start the match.');
        return;
      }
      if (room.clients.size < 2) {
        client.error('Waiting for a second player to join.');
        return;
      }
      room.started = true;
      room.lastActivity = Date.now();
      broadcast(room, { type: 'start', code: room.code });
      log(`room ${room.code} started`);
      return;
    }

    case 'input': {
      const room = client.room;
      if (!room || !room.started || client.isHost) return;
      const y = Number(message.y);
      const dir = Number(message.dir);
      const velocity = Number(message.velocity);
      if (message.y != null && !Number.isFinite(y)) return;
      if (message.dir != null && ![-1, 0, 1].includes(dir)) return;
      if (message.velocity != null && !Number.isFinite(velocity)) return;
      room.host.send({
        type: 'input',
        ...(message.y != null ? { y: Math.min(824, Math.max(76, y)) } : {}),
        ...(message.dir != null ? { dir } : {}),
        ...(message.velocity != null ? { velocity: Math.min(2600, Math.max(-2600, velocity)) } : {}),
        ...(message.release === true ? { release: true } : {}),
        from: client.id,
      });
      return;
    }

    case 'state': {
      const room = client.room;
      if (!room || !client.isHost) return;
      const state = message.state;
      if (!state || typeof state !== 'object' || Array.isArray(state) ||
          !Array.isArray(state.b) || state.b.length !== 2 ||
          !state.b.every((n) => Number.isFinite(n) && n >= -100 && n <= 1700) ||
          !Number.isFinite(state.p1) || state.p1 < 76 || state.p1 > 824 ||
          !Array.isArray(state.s) || state.s.length !== 2 ||
          !state.s.every((n) => Number.isInteger(n) && n >= 0 && n <= 7) ||
          !['countdown', 'point', 'play', 'over'].includes(state.ph) ||
          !Number.isFinite(state.cd) || state.cd < 0 || state.cd > 10 ||
          ![-1, 0, 1].includes(state.w) ||
          !Number.isInteger(state.rl) || state.rl < 0 || state.rl > 10000 ||
          !Number.isFinite(state.v) || state.v < 0 || state.v > 2000 ||
          !Number.isInteger(state.e) || state.e < 0) return;
      sendTo(room, { type: 'state', state }, client);
      room.lastActivity = Date.now();
      return;
    }

    case 'event': {
      const room = client.room;
      if (!room || !client.isHost) return;
      const name = String(message.name || '');
      if (!['paddle', 'wall', 'serve', 'count', 'score', 'win', 'lose', 'pause', 'start', 'join', 'error'].includes(name)) return;
      sendTo(room, { type: 'event', name }, client);
      return;
    }

    case 'control': {
      const room = client.room;
      if (!room || !room.started || client.isHost) return;
      const action = String(message.action || '');
      if (!['pause', 'resume', 'restart'].includes(action)) return;
      room.host.send({ type: 'control', action });
      return;
    }

    case 'leave': {
      client.send({ type: 'left' });
      leaveRoom(client);
      client.isHost = false;
      return;
    }

    case 'ping': {
      client.send({ type: 'pong', t: message.t });
      return;
    }

    default:
      return;
  }
}

/* ------------------------------------------------------------------ */
/* Upgrade handling                                                    */
/* ------------------------------------------------------------------ */

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  const upgrade = String(req.headers.upgrade || '').toLowerCase();
  const connection = String(req.headers.connection || '').toLowerCase().split(',').map((v) => v.trim());
  const version = String(req.headers['sec-websocket-version'] || '');
  const origin = String(req.headers.origin || '');
  const ip = req.socket.remoteAddress || 'unknown';
  let originAllowed = false;
  try {
    const parsedOrigin = new URL(origin);
    originAllowed = ['http:', 'https:'].includes(parsedOrigin.protocol) &&
      parsedOrigin.host.toLowerCase() === String(req.headers.host || '').toLowerCase();
  } catch {
    originAllowed = false;
  }
  let keyValid = false;
  try {
    const decoded = Buffer.from(String(key || ''), 'base64');
    keyValid = decoded.length === 16 && decoded.toString('base64') === key;
  } catch {
    keyValid = false;
  }
  if (req.method !== 'GET' || upgrade !== 'websocket' || !connection.includes('upgrade') ||
      version !== '13' || !keyValid || !originAllowed) {
    socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
    socket.destroy();
    return;
  }
  if (clients.size >= MAX_CLIENTS || !allowIpAction(ip, 'connect', 16)) {
    socket.write('HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n');
    socket.destroy();
    return;
  }
  const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      'Sec-WebSocket-Accept: ' + accept + '\r\n' +
      'Sec-WebSocket-Version: 13\r\n\r\n'
  );
  new Client(socket, ip);
});

/* ------------------------------------------------------------------ */
/* Housekeeping                                                        */
/* ------------------------------------------------------------------ */

setInterval(() => {
  const now = Date.now();
  for (const client of [...clients]) {
    if (!client.alive) {
      client.terminate();
      continue;
    }
    client.alive = false;
    try {
      client.socket.write(encodeFrame(Buffer.alloc(0), 0x9));
    } catch {
      client.terminate();
    }
  }
  for (const [code, room] of rooms) {
    if (!room.clients.size || now - (room.lastActivity || room.createdAt) > ROOM_IDLE_MS) {
      for (const client of [...room.clients]) {
        client.room = null;
        client.isHost = false;
        client.send({ type: 'peer-left', reason: 'timeout', players: [] });
      }
      rooms.delete(code);
    }
  }
  for (const [ip, record] of ipLimits) {
    if (now - record.startedAt > 10 * 60 * 1000) ipLimits.delete(ip);
  }
}, 25000).unref();

function log(message) {
  console.log(`[playbay] ${message}`);
}

function networkAddresses() {
  const addresses = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) addresses.push(net.address);
    }
  }
  return addresses;
}

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  PlayBay arcade server');
  console.log(`  Local:   http://localhost:${PORT}`);
  for (const address of networkAddresses()) {
    console.log(`  Network: http://${address}:${PORT}`);
  }
  console.log('  Rooms are relayed over WebSocket on the same port.');
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\n[playbay] shutting down');
  for (const client of clients) client.terminate();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
});
