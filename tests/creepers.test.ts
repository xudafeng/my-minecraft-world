import test from 'node:test';
import assert from 'node:assert/strict';
import { VoxelWorld, BLOCK } from '../lib/voxel-world.ts';
import {
  createCreeper,
  stepCreeper,
  blastDamage,
  seesPlayer,
} from '../lib/creepers.ts';
import { WorldSession, parseSnapshot } from '../lib/world-session.ts';
import { HOTBAR } from '../lib/voxel-world.ts';
function flat() {
  const world = new VoxelWorld(false);
  for (let x = -10; x < 20; x++)
    for (let z = -5; z < 5; z++) world.set(x, 0, z, BLOCK.stone);
  return world;
}
void test('creeper ignites nearby, explodes once and waits before respawning', () => {
  const w = flat(),
    m = createCreeper(w, 5, 0),
    p = { x: 7, y: 1, z: 0.5 };
  let blasts = 0;
  for (let i = 0; i < 40; i++) if (stepCreeper(w, m, p, 0.05)) blasts++;
  assert.equal(blasts, 1);
  assert.ok(m.cooldown > 29);
  stepCreeper(w, m, p, 30);
  assert.equal(m.health, 3);
  assert.equal(m.fuse, 0);
  assert.equal(m.cooldown, 0);
});
void test('escape defuses and cover prevents detection or damage', () => {
  const w = flat(),
    m = createCreeper(w, 5, 0),
    p = { x: 7, y: 1, z: 0.5 };
  stepCreeper(w, m, p, 0.5);
  assert.ok(m.fuse > 0);
  stepCreeper(w, m, { ...p, x: 14 }, 0.5);
  assert.equal(m.fuse, 0);
  for (let y = 1; y <= 3; y++) w.set(6, y, 0, BLOCK.stone);
  assert.equal(seesPlayer(w, m, p), false);
  stepCreeper(w, m, p, 1);
  assert.equal(m.fuse, 0);
  assert.equal(blastDamage(1, true), 0);
  assert.equal(blastDamage(5, false), 0);
  assert.ok(blastDamage(1, false) > blastDamage(3, false));
});
void test('home safe zone suppresses fuse and chase', () => {
  const w = flat(),
    m = createCreeper(w, -5, 0);
  m.pos.z = 9;
  const before = { ...m.pos };
  stepCreeper(w, m, { x: -5.5, y: 1, z: 9.5 }, 0.2);
  assert.equal(m.fuse, 0);
  assert.equal(m.pos.x, before.x);
});
void test('health survives saves; invalid health and bedrock destruction are rejected', () => {
  const s = new WorldSession(),
    player = { x: 0, y: 2, z: 0 };
  const save = s.snapshot({ pos: player, yaw: 0, pitch: 0 }, HOTBAR, 0);
  assert.equal(parseSnapshot({ ...save, health: 25 }).health, 25);
  for (const health of [-1, 101, NaN])
    assert.throws(() => parseSnapshot({ ...save, health }));
  assert.equal(s.edit(0, -4, 0, 0, player), null);
});
