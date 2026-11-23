/* PlayBay · Neon Pong
   Pure simulation. Rendering and input live here too, but the engine has no DOM
   dependency beyond a 2D context passed into render(). */

export const PONG = {
  W: 1600,
  H: 900,
  PADDLE_W: 18,
  PADDLE_H: 152,
  PADDLE_X: 68,
  BALL_R: 15,
  TARGET: 7,
  BASE_SPEED: 640,
  MAX_SPEED: 1560,
  STEP: 1 / 240,
  COUNTDOWN: 3.2,
  POINT_PAUSE: 1.05,
  RESET_COUNTDOWN: 2.1,
};

export const DIFFICULTY = {
  chill: { speed: 470, jitter: 74, returnRatio: 0.18, label: 'Chill' },
  normal: { speed: 690, jitter: 34, returnRatio: 0.3, label: 'Normal' },
  insane: { speed: 900, jitter: 10, returnRatio: 0.45, label: 'Insane' },
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export class PongEngine {
  constructor({ mode = 'cpu', difficulty = 'normal', target = PONG.TARGET, names = ['P1', 'P2'] } = {}) {
    this.mode = mode;
    this.difficulty = DIFFICULTY[difficulty] ? difficulty : 'normal';
    this.target = target;
    this.names = names;
    this.epoch = 0;
    this.hasState = mode !== 'guest';
    this.snapBuffer = [];
    this.lastSnap = null;
    this.events = [];
    this.reset(true);
  }

  /* ------------------------------------------------------------------ setup */

  reset(initial = false) {
    this.scores = [0, 0];
    this.winner = -1;
    this.phase = 'countdown';
    this.countdown = PONG.COUNTDOWN;
    this.pointTimer = 0;
    this.paused = false;
    this.rally = 0;
    this.maxRally = 0;
    this.elapsed = 0;
    this.shake = 0;
    this.flash = null;
    this.events = [];
    this.trail = [];
    this.particles = [];
    this.epoch += 1;
    this.serveDir = Math.random() < 0.5 ? -1 : 1;
    this.lastCount = Math.ceil(this.countdown);

    this.p1 = {
      y: PONG.H / 2,
      h: PONG.PADDLE_H,
      dir: 0,
      target: null,
      vy: 0,
      speed: 1040,
    };
    this.p2 = {
      y: PONG.H / 2,
      h: PONG.PADDLE_H,
      dir: 0,
      target: null,
      vy: 0,
      speed: this.mode === 'cpu' || this.mode === 'host' ? DIFFICULTY[this.difficulty].speed : 1040,
    };
    this.ball = {
      x: PONG.W / 2,
      y: PONG.H / 2,
      vx: 0,
      vy: 0,
      r: PONG.BALL_R,
      speed: 0,
    };
    if (!initial) this.snapBuffer = [];
    this.hasState = this.mode !== 'guest';
  }

  setPaddleTarget(side, y) {
    const paddle = side === 0 ? this.p1 : this.p2;
    paddle.dir = 0;
    paddle.target = clamp(Number(y) || 0, paddle.h / 2, PONG.H - paddle.h / 2);
  }

  setPaddleDir(side, dir) {
    const paddle = side === 0 ? this.p1 : this.p2;
    const next = Math.sign(dir || 0);
    paddle.dir = next;
    if (next !== 0) paddle.target = null;
  }

  event(name, data = {}) {
    this.events.push({ name, ...data });
    if (this.events.length > 32) this.events.shift();
  }

  drainEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }

  /* -------------------------------------------------------------- simulation */

  update(dt) {
    dt = Math.min(Math.max(dt, 0), 0.06);
    if (this.mode === 'guest') {
      this.guestUpdate(dt);
      this.updateFx(dt);
      return;
    }
    if (this.paused) {
      this.updateFx(dt);
      return;
    }

    this.elapsed += dt;
    this.updateFx(dt);

    if (this.phase === 'countdown') {
      this.movePaddle(this.p1, dt);
      this.movePaddle2(dt);
      const before = Math.ceil(this.countdown);
      this.countdown -= dt;
      const after = Math.ceil(this.countdown);
      if (after !== before && after >= 1 && after <= 3) this.event('count');
      if (this.countdown <= 0) this.launch();
      return;
    }

    if (this.phase === 'point') {
      this.movePaddle(this.p1, dt);
      this.movePaddle2(dt);
      this.pointTimer -= dt;
      if (this.pointTimer <= 0) this.afterPoint();
      return;
    }

    if (this.phase === 'over') {
      return;
    }

    /* play */
    this.movePaddle(this.p1, dt);
    this.movePaddle2(dt);

    let remaining = dt;
    while (remaining > 0 && this.phase === 'play') {
      const step = Math.min(PONG.STEP, remaining);
      this.step(step);
      remaining -= step;
    }

    if (this.rally > this.maxRally) this.maxRally = this.rally;
  }

  movePaddle2(dt) {
    if (this.mode === 'cpu') this.cpuUpdate(dt);
    else if (this.mode === 'local' || this.mode === 'host') this.movePaddle(this.p2, dt);
  }

  movePaddle(paddle, dt) {
    if (paddle.dir) {
      paddle.vy = paddle.dir * paddle.speed;
      paddle.y += paddle.vy * dt;
      paddle.target = null;
    } else if (paddle.target != null) {
      const diff = paddle.target - paddle.y;
      const step = paddle.speed * 1.9 * dt;
      if (Math.abs(diff) <= step) {
        paddle.y = paddle.target;
        paddle.vy = 0;
      } else {
        paddle.vy = Math.sign(diff) * paddle.speed * 1.9;
        paddle.y += paddle.vy * dt;
      }
    } else {
      paddle.vy *= 0.82;
    }

    const min = paddle.h / 2;
    const max = PONG.H - paddle.h / 2;
    if (paddle.y <= min) {
      paddle.y = min;
      paddle.vy = 0;
    } else if (paddle.y >= max) {
      paddle.y = max;
      paddle.vy = 0;
    }
  }

  cpuUpdate(dt) {
    const p = this.p2;
    const cfg = DIFFICULTY[this.difficulty];
    p.speed = cfg.speed;
    const ball = this.ball;
    let target = PONG.H / 2;

    if (this.phase === 'play' && ball.vx > 0) {
      const faceX = PONG.W - PONG.PADDLE_X - PONG.PADDLE_W;
      const time = (faceX - ball.x) / Math.max(60, ball.vx);
      let y = ball.y + ball.vy * time;
      const span = PONG.H - ball.r * 2;
      let folded = ((y - ball.r) % (span * 2) + span * 2) % (span * 2);
      if (folded > span) folded = span * 2 - folded;
      y = ball.r + folded;
      target = y + Math.sin(this.elapsed * 2.1 + 0.7) * cfg.jitter;
    } else if (this.phase === 'play') {
      target = PONG.H / 2 + (ball.y - PONG.H / 2) * cfg.returnRatio * 0.4;
    }

    p.target = clamp(target, p.h / 2, PONG.H - p.h / 2);
    this.movePaddle(p, dt);
  }

  step(dt) {
    const b = this.ball;

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.y - b.r < 0 && b.vy < 0) {
      b.y = b.r;
      b.vy = Math.abs(b.vy);
      this.wallHit(b.x, 0);
    } else if (b.y + b.r > PONG.H && b.vy > 0) {
      b.y = PONG.H - b.r;
      b.vy = -Math.abs(b.vy);
      this.wallHit(b.x, PONG.H);
    }

    /* left paddle */
    if (b.vx < 0) {
      const px = PONG.PADDLE_X;
      const top = this.p1.y - this.p1.h / 2;
      const bottom = this.p1.y + this.p1.h / 2;
      if (b.x - b.r <= px + PONG.PADDLE_W && b.x + b.r >= px && b.y + b.r >= top && b.y - b.r <= bottom) {
        b.x = px + PONG.PADDLE_W + b.r;
        this.bounce(this.p1, 1);
      }
    } else if (b.vx > 0) {
      const px = PONG.W - PONG.PADDLE_X - PONG.PADDLE_W;
      const top = this.p2.y - this.p2.h / 2;
      const bottom = this.p2.y + this.p2.h / 2;
      if (b.x + b.r >= px && b.x - b.r <= px + PONG.PADDLE_W && b.y + b.r >= top && b.y - b.r <= bottom) {
        b.x = px - b.r;
        this.bounce(this.p2, -1);
      }
    }

    if (b.x < -b.r * 3) this.scorePoint(1);
    else if (b.x > PONG.W + b.r * 3) this.scorePoint(0);
  }

  bounce(paddle, dir) {
    const b = this.ball;
    const rel = clamp((b.y - paddle.y) / (paddle.h / 2 + b.r), -1, 1);
    const angle = rel * 1.02;
    const nextSpeed = Math.min(PONG.MAX_SPEED, Math.max(PONG.BASE_SPEED, b.speed * 1.055 + 14));
    b.speed = nextSpeed;
    b.vx = Math.cos(angle) * nextSpeed * dir;
    b.vy = Math.sin(angle) * nextSpeed + paddle.vy * 0.16;
    const maxVy = nextSpeed * 0.92;
    b.vy = clamp(b.vy, -maxVy, maxVy);
    this.rally += 1;
    this.shake = Math.min(10, 3 + nextSpeed / 260);
    this.event('paddle', { side: dir > 0 ? 0 : 1, speed: Math.round(nextSpeed) });
    this.spawnSparks(b.x, b.y, dir > 0 ? '#2ee7ff' : '#ff2d95', 8, dir);
  }

  wallHit(x, y) {
    this.shake = Math.max(this.shake, 2.6);
    this.event('wall');
    this.spawnSparks(x, y, '#8df4ff', 5, 0);
  }

  spawnSparks(x, y, color, count, dir) {
    for (let i = 0; i < count; i++) {
      const angle = dir === 0 ? Math.random() * Math.PI * 2 : (dir > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 2.2;
      const power = 90 + Math.random() * 330;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * power + (dir > 0 ? -120 : dir < 0 ? 120 : 0),
        vy: Math.sin(angle) * power,
        life: 0.35 + Math.random() * 0.4,
        max: 0.75,
        size: 2 + Math.random() * 4,
        color,
      });
    }
  }

  launch() {
    this.phase = 'play';
    this.countdown = 0;
    this.ball.x = PONG.W / 2;
    this.ball.y = PONG.H / 2 + (Math.random() * 160 - 80);
    this.ball.speed = PONG.BASE_SPEED;
    const angle = (Math.random() * 0.44 - 0.22);
    this.ball.vx = Math.cos(angle) * PONG.BASE_SPEED * this.serveDir;
    this.ball.vy = Math.sin(angle) * PONG.BASE_SPEED;
    this.epoch += 1;
    this.event('serve');
  }

  scorePoint(scorer) {
    if (this.phase !== 'play') return;
    this.scores[scorer] += 1;
    this.phase = 'point';
    this.pointTimer = PONG.POINT_PAUSE;
    this.ball.speed = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.shake = 15;
    const edgeX = scorer === 0 ? PONG.W - 30 : 30;
    this.spawnSparks(edgeX, this.ball.y, scorer === 0 ? '#ff2d95' : '#2ee7ff', 26, scorer === 0 ? -1 : 1);
    this.event('score', { side: scorer });

    if (this.scores[scorer] >= this.target) {
      this.winner = scorer;
      this.phase = 'over';
      this.event('win', { winner: scorer });
    } else {
      this.serveDir = scorer === 0 ? 1 : -1;
    }
  }

  afterPoint() {
    if (this.winner >= 0) return;
    this.rally = 0;
    this.phase = 'countdown';
    this.countdown = PONG.RESET_COUNTDOWN;
    this.lastCount = Math.ceil(this.countdown);
    this.ball.x = PONG.W / 2;
    this.ball.y = PONG.H / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.speed = 0;
    this.epoch += 1;
  }

  togglePause(force) {
    if (this.phase === 'over' || this.mode === 'guest') return this.paused;
    this.paused = typeof force === 'boolean' ? force : !this.paused;
    if (this.paused) this.event('pause');
    return this.paused;
  }

  restart() {
    const wasPaused = this.paused;
    this.reset(false);
    this.paused = wasPaused;
  }

  updateFx(dt) {
    this.shake = Math.max(0, this.shake - dt * 44);
    if (this.flash) {
      this.flash.life -= dt;
      if (this.flash.life <= 0) this.flash = null;
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.965;
      p.vy = p.vy * 0.965 + 120 * dt;
    }
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt * 3.4;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
    if (this.mode !== 'guest' && this.phase === 'play' && !this.paused) {
      this.trail.push({ x: this.ball.x, y: this.ball.y, life: 1 });
      if (this.trail.length > 26) this.trail.shift();
    }
  }

  /* --------------------------------------------------------------- snapshot */

  snapshot() {
    return {
      b: [Math.round(this.ball.x * 10) / 10, Math.round(this.ball.y * 10) / 10],
      p1: Math.round(this.p1.y * 10) / 10,
      s: [this.scores[0], this.scores[1]],
      ph: this.phase,
      cd: Math.round(this.countdown * 100) / 100,
      rl: this.rally,
      w: this.winner,
      pz: this.paused,
      e: this.epoch,
      v: Math.round(this.ball.speed),
    };
  }

  applySnapshot(snap) {
    if (!snap || !Array.isArray(snap.b)) return;
    this.hasState = true;
    this.lastSnap = snap;
    this.snapBuffer.push({ t: performance.now(), snap });
    if (this.snapBuffer.length > 60) this.snapBuffer.shift();

    this.scores = [Number(snap.s[0]) || 0, Number(snap.s[1]) || 0];
    this.phase = snap.ph;
    this.countdown = Number(snap.cd) || 0;
    this.winner = typeof snap.w === 'number' ? snap.w : -1;
    this.rally = Number(snap.rl) || 0;
    this.paused = Boolean(snap.pz);
    this.ball.speed = Number(snap.v) || 0;
  }

  guestUpdate(dt) {
    this.elapsed += dt;
    this.movePaddle(this.p2, dt);

    const buf = this.snapBuffer;
    if (!buf.length) return;

    const now = performance.now();
    const renderTime = now - 95;
    while (buf.length > 2 && buf[1].t < renderTime) buf.shift();

    let a = null;
    let b = null;
    for (let i = 0; i < buf.length - 1; i++) {
      if (buf[i].t <= renderTime && buf[i + 1].t >= renderTime) {
        a = buf[i];
        b = buf[i + 1];
        break;
      }
    }
    if (!a) {
      a = buf[buf.length - 1];
      b = a;
    }

    const span = b.t - a.t;
    const k = span > 0 ? clamp((renderTime - a.t) / span, 0, 1) : 1;
    const A = a.snap;
    const B = b.snap;

    if (A.e === B.e) {
      this.ball.x = lerp(A.b[0], B.b[0], k);
      this.ball.y = lerp(A.b[1], B.b[1], k);
    } else {
      this.ball.x = B.b[0];
      this.ball.y = B.b[1];
    }
    this.p1.y = lerp(A.p1, B.p1, k);

    if (this.phase === 'play') {
      this.trail.push({ x: this.ball.x, y: this.ball.y, life: 1 });
      if (this.trail.length > 26) this.trail.shift();
    }
  }

  /* ----------------------------------------------------------------- render */

  render(ctx, opts = {}) {
    const { W, H } = PONG;
    const showHud = opts.showHud !== false;

    ctx.save();
    if (this.shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#081027');
    bg.addColorStop(0.55, '#060b1c');
    bg.addColorStop(1, '#04060f');
    ctx.fillStyle = bg;
    ctx.fillRect(-30, -30, W + 60, H + 60);

    const glowL = ctx.createRadialGradient(W * 0.18, H * 0.5, 0, W * 0.18, H * 0.5, W * 0.5);
    glowL.addColorStop(0, 'rgba(46,231,255,0.11)');
    glowL.addColorStop(1, 'rgba(46,231,255,0)');
    ctx.fillStyle = glowL;
    ctx.fillRect(0, 0, W, H);

    const glowR = ctx.createRadialGradient(W * 0.82, H * 0.5, 0, W * 0.82, H * 0.5, W * 0.5);
    glowR.addColorStop(0, 'rgba(255,45,149,0.09)');
    glowR.addColorStop(1, 'rgba(255,45,149,0)');
    ctx.fillStyle = glowR;
    ctx.fillRect(0, 0, W, H);

    /* grid */
    ctx.strokeStyle = 'rgba(46,231,255,0.055)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 100; x < W; x += 100) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = 100; y < H; y += 100) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();

    /* border */
    ctx.strokeStyle = 'rgba(46,231,255,0.22)';
    ctx.lineWidth = 3;
    ctx.strokeRect(22, 22, W - 44, H - 44);

    /* centre line */
    ctx.save();
    ctx.strokeStyle = 'rgba(141,244,255,0.18)';
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 26]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 48);
    ctx.lineTo(W / 2, H - 48);
    ctx.stroke();
    ctx.restore();

    /* centre ring */
    ctx.strokeStyle = 'rgba(141,244,255,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 92, 0, Math.PI * 2);
    ctx.stroke();

    if (showHud) this.drawScores(ctx);

    /* paddles */
    this.drawPaddle(ctx, PONG.PADDLE_X, this.p1.y, this.p1.h, '#2ee7ff', 'rgba(46,231,255,0.5)');
    this.drawPaddle(
      ctx,
      W - PONG.PADDLE_X - PONG.PADDLE_W,
      this.p2.y,
      this.p2.h,
      '#ff2d95',
      'rgba(255,45,149,0.5)'
    );

    /* trail */
    for (const t of this.trail) {
      ctx.globalAlpha = Math.max(0, t.life) * 0.26;
      ctx.fillStyle = '#8df4ff';
      ctx.beginPath();
      ctx.arc(t.x, t.y, PONG.BALL_R * (0.25 + t.life * 0.55), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* ball */
    ctx.save();
    ctx.shadowColor = '#2ee7ff';
    ctx.shadowBlur = 34;
    ctx.fillStyle = '#eaffff';
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, PONG.BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.ball.x - 2, this.ball.y - 2, PONG.BALL_R * 0.44, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* particles */
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.max);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.phase === 'countdown') this.drawCountdown(ctx);
    if (this.phase === 'point') this.drawPointFlag(ctx);
    if (this.paused) this.drawPaused(ctx);

    ctx.restore();
  }

  drawPaddle(ctx, x, y, h, color, glow) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 28;
    ctx.fillStyle = color;
    roundRect(ctx, x, y - h / 2, PONG.PADDLE_W, h, PONG.PADDLE_W / 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    const grad = ctx.createLinearGradient(x, y - h / 2, x + PONG.PADDLE_W, y + h / 2);
    grad.addColorStop(0, 'rgba(255,255,255,0.7)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = grad;
    roundRect(ctx, x, y - h / 2, PONG.PADDLE_W, h, PONG.PADDLE_W / 2);
    ctx.fill();
    ctx.strokeStyle = glow;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  drawScores(ctx) {
    const { W } = PONG;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '84px "Kenney Future", "Segoe UI", sans-serif';

    ctx.shadowColor = 'rgba(46,231,255,0.6)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = 'rgba(210,252,255,0.72)';
    ctx.fillText(String(this.scores[0]), W / 2 - 128, 118);

    ctx.shadowColor = 'rgba(255,45,149,0.6)';
    ctx.fillStyle = 'rgba(255,214,234,0.72)';
    ctx.fillText(String(this.scores[1]), W / 2 + 128, 118);

    ctx.shadowBlur = 0;
    ctx.font = '13px "Kenney Future Narrow", "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(164,176,214,0.6)';
    ctx.fillText(`FIRST TO ${this.target}`, W / 2, 172);

    ctx.textAlign = 'left';
    ctx.font = '16px "Kenney Future Narrow", "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(46,231,255,0.55)';
    ctx.fillText(this.names?.[0] || 'P1', 56, 58);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,45,149,0.55)';
    ctx.fillText(this.names?.[1] || 'P2', W - 56, 58);
    ctx.restore();
  }

  drawCountdown(ctx) {
    const { W, H } = PONG;
    const n = Math.max(1, Math.ceil(this.countdown));
    const frac = this.countdown % 1;
    const scale = 1 + (1 - Math.abs(frac - 0.5) * 2) * 0.08;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '150px "Kenney Future", "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(234,255,255,0.9)';
    ctx.shadowColor = 'rgba(46,231,255,0.9)';
    ctx.shadowBlur = 60;
    ctx.fillText(String(n), 0, 10);
    ctx.shadowBlur = 0;
    ctx.font = '16px "Kenney Future Narrow", "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(141,244,255,0.7)';
    ctx.fillText('GET READY', 0, -110);
    ctx.restore();
  }

  drawPointFlag(ctx) {
    const { W, H } = PONG;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '24px "Kenney Future Narrow", "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('POINT', W / 2, H / 2 - 150);
    ctx.restore();
  }

  drawPaused(ctx) {
    const { W, H } = PONG;
    ctx.save();
    ctx.fillStyle = 'rgba(3,5,14,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '44px "Kenney Future", "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(238,242,255,0.8)';
    ctx.fillText('PAUSED', W / 2, H / 2);
    ctx.restore();
  }
}
