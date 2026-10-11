import test from 'node:test';
import assert from 'node:assert/strict';
import { Adventure, RELICS, parseAdventure } from '../lib/adventure.ts';
import { parseSnapshot, WorldSession } from '../lib/world-session.ts';
import { HOTBAR } from '../lib/voxel-world.ts';
const target = { x: 0, y: 2.9, z: 0 };
const player = { x: 0, y: 2, z: 0 };
void test('relics require proximity and cannot be farmed repeatedly', () => {
  const a = new Adventure();
  assert.equal(a.collect(0, { ...player, x: 10 }, target), false);
  assert.equal(a.collect(0, player, target), true);
  assert.equal(a.collect(0, player, target), false);
  assert.equal(a.collect(-1, player, target), false);
});
void test('upgrades, completion, personal best and repeat runs survive serialization', () => {
  const a = new Adventure();
  a.data.elapsed = 100;
  for (let i = 0; i < RELICS.length; i++) {
    a.collect(i, player, target);
    assert.equal(a.boost, i >= 2);
    assert.equal(a.doubleJump, i >= 4);
  }
  const b = new Adventure(JSON.parse(JSON.stringify(a.data)));
  assert.equal(b.complete, true);
  assert.equal(b.data.best, 100);
  assert.equal(b.restart(), true);
  assert.equal(b.boost && b.doubleJump, true);
  assert.equal(b.restart(), false);
  b.data.elapsed = 80;
  for (let i = 0; i < RELICS.length; i++) b.collect(i, player, target);
  assert.equal(b.data.best, 80);
});
void test('old worlds stay compatible and malformed adventure data is rejected', () => {
  const snapshot = new WorldSession().snapshot(
    { pos: player, yaw: 0, pitch: 0 },
    HOTBAR,
    0,
  );
  assert.deepEqual(parseSnapshot(snapshot), snapshot);
  const data = new Adventure().data;
  assert.deepEqual(
    parseSnapshot({ ...snapshot, adventure: data }).adventure,
    data,
  );
  for (const patch of [
    { collected: [0, 0] },
    { elapsed: NaN },
    { best: -1 },
    { rounds: 0.5 },
  ])
    assert.throws(() => parseAdventure({ ...data, ...patch }));
});
