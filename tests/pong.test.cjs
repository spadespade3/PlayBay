'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../js/games/pong.js'), 'utf8');
const moduleUrl = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');

let PongEngine;
let PONG;

test('load the standalone Pong simulation module', async () => {
  ({ PongEngine, PONG } = await import(moduleUrl));
  assert.equal(typeof PongEngine, 'function');
});

test('a valid engine snapshot is accepted', () => {
  const engine = new PongEngine({ mode: 'cpu' });
  assert.equal(engine.applySnapshot(engine.snapshot()), true);
});

test('maximum rally history is carried in multiplayer snapshots', () => {
  const host = new PongEngine({ mode: 'cpu' });
  host.rally = 4;
  host.maxRally = 12;
  const guest = new PongEngine({ mode: 'guest' });
  assert.equal(guest.applySnapshot(host.snapshot()), true);
  assert.equal(guest.rally, 4);
  assert.equal(guest.maxRally, 12);
});

test('malformed snapshots are rejected without changing the score', () => {
  const engine = new PongEngine({ mode: 'guest' });
  engine.scores = [3, 2];
  const bad = { ...engine.snapshot(), b: [Number.NaN, 200] };
  assert.equal(engine.applySnapshot(bad), false);
  assert.deepEqual(engine.scores, [3, 2]);
});

test('measured pointer velocity is kept separate from target-follow speed', () => {
  const engine = new PongEngine({ mode: 'cpu' });
  engine.setPaddleTarget(0, 700, 1800);
  engine.movePaddle(engine.p1, 0.01);
  assert.equal(engine.p1.vy, 1800);
  assert.ok(engine.p1.y > PONG.H / 2);
  assert.ok(engine.p1.pointerSpeed <= 1800);
});

test('ball velocity remains under the configured maximum after a fast hit', () => {
  const engine = new PongEngine({ mode: 'cpu' });
  engine.ball.speed = PONG.MAX_SPEED;
  engine.p1.vy = 2600;
  engine.bounce(engine.p1, 1);
  const totalSpeed = Math.hypot(engine.ball.vx, engine.ball.vy);
  assert.ok(totalSpeed <= PONG.MAX_SPEED + 0.001);
  assert.ok(Number.isFinite(engine.ball.vx));
  assert.ok(Number.isFinite(engine.ball.vy));
});

test('restart always resumes a paused game', () => {
  const engine = new PongEngine({ mode: 'cpu' });
  engine.togglePause(true);
  assert.equal(engine.paused, true);
  engine.restart();
  assert.equal(engine.paused, false);
  assert.equal(engine.phase, 'countdown');
});
