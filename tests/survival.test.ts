import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Survival,
  DAY_LENGTH,
  CYCLE_LENGTH,
  parseSurvival,
} from '../lib/survival.ts';
import { BLOCK, VoxelWorld, HOTBAR } from '../lib/voxel-world.ts';
import { WorldSession, parseSnapshot } from '../lib/world-session.ts';
import { createCreeper, stepCreeper } from '../lib/creepers.ts';
void test('failed crafting and depleted placement leave inventory unchanged', () => {
  const s = new Survival();
  s.data.inventory = { [BLOCK.wood]: 5, [BLOCK.stone]: 8 };
  const before = JSON.stringify(s.data);
  assert.equal(s.craft('sword'), false);
  assert.equal(JSON.stringify(s.data), before);
  assert.equal(s.spend(BLOCK.glass), false);
  s.add(BLOCK.log);
  assert.equal(s.craft('planks'), true);
  assert.equal(s.data.inventory[BLOCK.log], 0);
  assert.equal(s.craft('sword'), true);
  assert.equal(s.data.sword, true);
  assert.equal(s.craft('sword'), false);
  assert.equal(s.data.inventory[BLOCK.stone], 0);
});
void test('night transition and dawn reward happen once; save resumes the same phase', () => {
  const s = new Survival();
  s.tick(DAY_LENGTH - 1);
  assert.equal(s.night, false);
  assert.equal(s.remaining, 1);
  s.tick(1);
  assert.equal(s.night, true);
  const reloaded = new Survival(JSON.parse(JSON.stringify(s.data)));
  assert.equal(reloaded.night, true);
  assert.equal(reloaded.tick(CYCLE_LENGTH - DAY_LENGTH), true);
  assert.equal(reloaded.data.nights, 1);
  assert.equal(reloaded.data.inventory[BLOCK.pumpkin], 3);
  assert.equal(reloaded.tick(0.01), false);
  assert.equal(reloaded.data.nights, 1);
});
void test('creative building is unlimited without spending adventure resources', () => {
  const s = new Survival();
  s.data.mode = 'creative';
  const before = { ...s.data.inventory };
  assert.equal(s.spend(BLOCK.glass), true);
  assert.deepEqual(s.data.inventory, before);
  assert.equal(s.tick(CYCLE_LENGTH), false);
  assert.equal(s.data.nights, 0);
  s.data.mode = 'adventure';
  assert.equal(s.canPlace(BLOCK.glass), false);
});
void test('survival saves reject tampered materials and retain old save compatibility', () => {
  const save = new WorldSession().snapshot(
    { pos: { x: 0, y: 2, z: 0 }, yaw: 0, pitch: 0 },
    HOTBAR,
    0,
  );
  assert.deepEqual(parseSnapshot(save), save);
  const s = new Survival();
  assert.deepEqual(
    parseSnapshot({ ...save, survival: s.data }).survival,
    s.data,
  );
  for (const inventory of [
    { 999: 2 },
    { [BLOCK.wood]: -1 },
    { [BLOCK.stone]: 1.5 },
    [],
  ])
    assert.throws(() => parseSurvival({ ...s.data, inventory }));
  assert.throws(() => parseSurvival({ ...s.data, time: Infinity }));
  assert.throws(() => parseSurvival({ ...s.data, camp: 4 }));
});
void test('home protection expires at night and defeated enemies rest during daylight', () => {
  const w = new VoxelWorld(false);
  for (let x = -9; x < -2; x++)
    for (let z = 6; z < 13; z++) w.set(x, 0, z, BLOCK.stone);
  const m = createCreeper(w, -5, 9),
    p = { x: -5.5, y: 1, z: 9.5 };
  stepCreeper(w, m, p, 0.2, { adventure: true, night: false });
  assert.equal(m.fuse, 0);
  stepCreeper(w, m, p, 0.2, { adventure: true, night: true });
  assert.ok(m.fuse > 0);
  m.cooldown = 10;
  stepCreeper(w, m, p, 1, { adventure: true, night: false });
  assert.equal(m.cooldown, 10);
});
