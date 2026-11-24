/* PlayBay · WebSocket client for LAN rooms
   The server only relays. The host owns the simulation. */

class Bus {
  constructor() {
    this.map = new Map();
  }
  on(event, fn) {
    if (!this.map.has(event)) this.map.set(event, new Set());
    this.map.get(event).add(fn);
    return () => this.off(event, fn);
  }
  off(event, fn) {
    this.map.get(event)?.delete(fn);
  }
  emit(event, payload) {
    const set = this.map.get(event);
    if (!set) return;
    for (const fn of [...set]) {
      try {
        fn(payload);
      } catch (err) {
        console.error('[playbay] net listener failed', err);
      }
    }
  }
  clear() {
    this.map.clear();
  }
}

class NetClient {
  constructor() {
    this.bus = new Bus();
    this.ws = null;
    this.state = 'idle';
    this.error = '';
    this.room = null;
    this.role = null;
    this.playerId = null;
    this.players = [];
    this.connectPromise = null;
    this.pending = null;
    this.chatty = false;
  }

  on(event, fn) {
    return this.bus.on(event, fn);
  }

  off(event, fn) {
    this.bus.off(event, fn);
  }

  get isHost() {
    return this.role === 'host';
  }

  get inRoom() {
    return Boolean(this.room && this.room.code);
  }

  serverUrl() {
    if (location.protocol === 'file:') return 'ws://localhost:3000';
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${location.host}`;
  }

  setState(state, error = '') {
    this.state = state;
    this.error = error;
    this.bus.emit('status', { state, error });
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return Promise.resolve();
    if (this.connectPromise) return this.connectPromise;

    this.setState('connecting');
    this.connectPromise = new Promise((resolve, reject) => {
      let settled = false;
      let ws;
      try {
        ws = new WebSocket(this.serverUrl());
      } catch (err) {
        this.connectPromise = null;
        this.setState('error', 'Could not open a socket.');
        reject(err);
        return;
      }
      this.ws = ws;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.connectPromise = null;
        try {
          ws.close();
        } catch {
          /* ignore */
        }
        this.setState('error', 'The game server did not answer. Is it running?');
        reject(new Error('timeout'));
      }, 7000);

      ws.addEventListener('open', () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.connectPromise = null;
        this.setState('open');
        resolve();
      });

      ws.addEventListener('message', (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        this.handle(message);
      });

      ws.addEventListener('close', () => {
        clearTimeout(timer);
        if (this.pending) this.pending.reject(new Error('The connection closed before the room request completed.'));
        this.ws = null;
        this.connectPromise = null;
        const wasRoom = this.inRoom;
        this.room = null;
        this.role = null;
        this.players = [];
        this.playerId = null;
        if (!settled) {
          settled = true;
          this.setState('error', 'Could not reach the game server.');
          reject(new Error('closed'));
          return;
        }
        this.setState('closed', wasRoom ? 'The room connection closed.' : '');
        this.bus.emit('closed', { wasRoom });
      });

      ws.addEventListener('error', () => {
        /* close handler reports it */
      });
    });

    return this.connectPromise;
  }

  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch {
      return false;
    }
  }

  handle(message) {
    switch (message.type) {
      case 'room': {
        this.room = {
          code: String(message.code || ''),
          players: Array.isArray(message.players) ? message.players : [],
          started: Boolean(message.started),
        };
        this.players = this.room.players;
        if (typeof message.host === 'boolean') this.role = message.host ? 'host' : 'guest';
        if (message.playerId) this.playerId = String(message.playerId);
        const roomInfo = { ...this.room, role: this.role, playerId: this.playerId };
        if (this.pending) this.pending.resolve(roomInfo);
        this.bus.emit('room', roomInfo);
        break;
      }
      case 'players': {
        this.players = message.players || [];
        if (this.room) this.room.players = this.players;
        this.bus.emit('players', this.players);
        break;
      }
      case 'peer-joined':
        this.bus.emit('peer-joined', { name: message.name || 'Player' });
        break;
      case 'peer-left': {
        const reason = message.reason || 'guest';
        if (reason === 'host' || reason === 'timeout') {
          this.room = null;
          this.role = null;
          this.players = [];
          this.playerId = null;
        } else if (this.room) {
          this.room.players = Array.isArray(message.players) ? message.players : [];
          this.players = this.room.players;
          this.room.started = false;
        }
        this.bus.emit('peer-left', { reason, players: this.players });
        break;
      }
      case 'start':
        if (this.room) this.room.started = true;
        this.bus.emit('start', { code: message.code });
        break;
      case 'state':
        this.bus.emit('state', message.state);
        break;
      case 'input':
        this.bus.emit('input', {
          ...(Number.isFinite(Number(message.y)) ? { y: Number(message.y) } : {}),
          ...(message.dir === -1 || message.dir === 0 || message.dir === 1 ? { dir: message.dir } : {}),
          ...(Number.isFinite(Number(message.velocity)) ? { velocity: Number(message.velocity) } : {}),
          ...(message.release === true ? { release: true } : {}),
        });
        break;
      case 'event':
        this.bus.emit('event', message.name);
        break;
      case 'control':
        this.bus.emit('control', message.action);
        break;
      case 'error':
        this.bus.emit('error', message.message || 'The server rejected that.');
        if (this.pending) this.pending.reject(new Error(message.message || 'server error'));
        break;
      case 'left':
        this.room = null;
        this.role = null;
        this.players = [];
        this.playerId = null;
        this.bus.emit('left');
        break;
      case 'pong':
        break;
      default:
        break;
    }
  }

  awaitRoom() {
    if (this.pending) return Promise.reject(new Error('A room request is already in progress.'));
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        this.pending = null;
      };
      const timer = setTimeout(() => {
        if (this.pending) this.pending.reject(new Error('The room request timed out.'));
      }, 8000);
      this.pending = {
        resolve: (room) => { cleanup(); resolve(room); },
        reject: (error) => { cleanup(); reject(error instanceof Error ? error : new Error(String(error))); },
      };
    });
  }

  async requestRoom(message) {
    await this.connect();
    const wait = this.awaitRoom();
    if (!this.send(message)) {
      if (this.pending) this.pending.reject(new Error('Socket is not open.'));
    }
    return wait;
  }

  async createRoom(name) {
    return this.requestRoom({ type: 'create', name });
  }

  async joinRoom(code, name) {
    const normalized = String(code || '').trim().toUpperCase();
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(normalized)) throw new Error('Room codes must contain six valid characters.');
    return this.requestRoom({ type: 'join', code: normalized, name });
  }

  startMatch() {
    return this.send({ type: 'start' });
  }

  sendInput(y, options = {}) {
    const message = { type: 'input' };
    if (Number.isFinite(Number(y))) message.y = Number(y);
    if (options && (options.dir === -1 || options.dir === 0 || options.dir === 1)) message.dir = options.dir;
    if (options && Number.isFinite(Number(options.velocity))) message.velocity = Number(options.velocity);
    if (options?.release === true) message.release = true;
    return this.send(message);
  }

  sendState(state) {
    return this.send({ type: 'state', state });
  }

  sendEvent(name) {
    return this.send({ type: 'event', name });
  }

  control(action) {
    if (!['pause', 'resume', 'restart'].includes(action)) return false;
    return this.send({ type: 'control', action });
  }

  leave() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.send({ type: 'leave' });
    this.room = null;
    this.role = null;
    this.players = [];
    this.playerId = null;
  }

  close() {
    if (this.pending) this.pending.reject(new Error('Connection closed.'));
    this.leave();
    if (this.ws) {
      try {
        this.ws.close(1000, 'bye');
      } catch {
        /* ignore */
      }
    }
    this.room = null;
    this.role = null;
    this.players = [];
    this.playerId = null;
    this.setState('idle');
  }
}

export const net = new NetClient();
