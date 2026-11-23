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
          code: message.code,
          players: message.players || [],
          started: Boolean(message.started),
        };
        this.players = this.room.players;
        if (typeof message.host === 'boolean') this.role = message.host ? 'host' : 'guest';
        if (message.playerId) this.playerId = message.playerId;
        this.bus.emit('room', { ...this.room, role: this.role, playerId: this.playerId });
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
      case 'peer-left':
        this.bus.emit('peer-left', { reason: message.reason || 'guest' });
        break;
      case 'start':
        if (this.room) this.room.started = true;
        this.bus.emit('start', { code: message.code });
        break;
      case 'state':
        this.bus.emit('state', message.state);
        break;
      case 'input':
        this.bus.emit('input', { y: Number(message.y) });
        break;
      case 'event':
        this.bus.emit('event', message.name);
        break;
      case 'control':
        this.bus.emit('control', message.action);
        break;
      case 'error':
        this.bus.emit('error', message.message || 'The server rejected that.');
        if (this.pending) {
          this.pending.reject(new Error(message.message || 'server error'));
          this.pending = null;
        }
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
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('The room request timed out.'));
      }, 8000);
      const offRoom = this.on('room', (room) => {
        cleanup();
        resolve(room);
      });
      const offError = this.on('error', (message) => {
        cleanup();
        reject(new Error(message));
      });
      const cleanup = () => {
        clearTimeout(timer);
        offRoom();
        offError();
      };
      this.pending = {
        reject: (err) => {
          cleanup();
          reject(err);
        },
      };
    });
  }

  async createRoom(name) {
    await this.connect();
    const wait = this.awaitRoom();
    const sent = this.send({ type: 'create', name });
    if (!sent) throw new Error('Socket is not open.');
    return wait;
  }

  async joinRoom(code, name) {
    await this.connect();
    const wait = this.awaitRoom();
    const sent = this.send({ type: 'join', code, name });
    if (!sent) throw new Error('Socket is not open.');
    return wait;
  }

  startMatch() {
    return this.send({ type: 'start' });
  }

  sendInput(y) {
    return this.send({ type: 'input', y });
  }

  sendState(state) {
    return this.send({ type: 'state', state });
  }

  sendEvent(name) {
    return this.send({ type: 'event', name });
  }

  control(action) {
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
