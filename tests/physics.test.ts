import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VoxelWorld,
  BLOCK,
  collides,
  voxelRay,
  overlapsPlayer,
  stepBody,
  type Body,
} from '../lib/voxel-world.ts';
const flat = () => {
  const w = new VoxelWorld(false);
  for (let x = -10; x < 10; x++)
    for (let z = -10; z < 10; z++) w.set(x, 0, z, BLOCK.stone);
  return w;
};
test('generated cabin has accessible doorway, floor, river, bridge, and clear spawn', () => {
  const w = new VoxelWorld();
  assert.ok(w.blocks.size > 20000);
  assert.equal(w.get(-6, 4, -2), 0);
  assert.equal(w.get(-6, 5, -2), 0);
  assert.equal(w.get(-6, 3, -2), BLOCK.stone);
  assert.equal(w.get(2, 2, 2), BLOCK.wood);
  assert.equal(collides(w, { x: -5.5, y: 2, z: 9.5 }), false);
  assert.equal(w.get(2, 1, 4), BLOCK.water);
});
test('gravity lands on floor and remains stable without sinking', () => {
  const w = flat();
  const b: Body = {
    pos: { x: 0.5, y: 8, z: 0.5 },
    velocity: 0,
    grounded: false,
  };
  for (let i = 0; i < 300; i++) stepBody(w, b, 0, 0, false, 1 / 60);
  assert.ok(Math.abs(b.pos.y - 1) < 0.002);
  assert.equal(b.grounded, true);
  assert.equal(collides(w, b.pos), false);
});
test('jump clears one block but cannot double-jump in the air', () => {
  const w = flat(),
    b: Body = { pos: { x: 0.5, y: 1, z: 0.5 }, velocity: 0, grounded: true };
  let highest = 1;
  for (let i = 0; i < 120; i++) {
    stepBody(w, b, 0, 0, i < 30, 1 / 60);
    highest = Math.max(highest, b.pos.y);
  }
  assert.ok(highest > 2.35 && highest < 2.6);
  assert.ok(Math.abs(b.pos.y - 1) < 0.002);
});
test('running into wall stops without tunneling and can slide along it', () => {
  const w = flat();
  for (let z = -5; z < 8; z++)
    for (let y = 1; y < 5; y++) w.set(2, y, z, BLOCK.wood);
  const b: Body = {
    pos: { x: 0.5, y: 1, z: 0.5 },
    velocity: 0,
    grounded: true,
  };
  for (let i = 0; i < 60; i++) stepBody(w, b, 7, 1, false, 1 / 60);
  assert.ok(b.pos.x < 1.712 && b.pos.x > 1.69);
  assert.ok(b.pos.z > 1.49);
  assert.equal(collides(w, b.pos), false);
});
test('ceiling prevents head from passing through solids', () => {
  const w = flat();
  w.set(0, 3, 0, BLOCK.stone);
  const b: Body = {
    pos: { x: 0.5, y: 1, z: 0.5 },
    velocity: 0,
    grounded: true,
  };
  let highest = 1;
  for (let i = 0; i < 60; i++) {
    stepBody(w, b, 0, 0, i === 0, 1 / 60);
    highest = Math.max(highest, b.pos.y);
  }
  assert.ok(highest <= 1.282);
});
test('water is passable while bedrock and glass remain solid', () => {
  const w = new VoxelWorld(false);
  w.set(0, 1, 0, BLOCK.water);
  assert.equal(collides(w, { x: 0.5, y: 1, z: 0.5 }), false);
  w.set(0, 1, 0, BLOCK.glass);
  assert.equal(collides(w, { x: 0.5, y: 1, z: 0.5 }), true);
});
test('raycast returns nearest cube and outward placement face', () => {
  const w = new VoxelWorld(false);
  w.set(2, 2, 0, BLOCK.wood);
  w.set(4, 2, 0, BLOCK.stone);
  const hit = voxelRay(w, { x: 0.5, y: 2.5, z: 0.5 }, { x: 1, y: 0, z: 0 });
  assert.deepEqual(hit?.normal, { x: -1, y: 0, z: 0 });
  assert.equal(hit?.x, 2);
  assert.equal(hit?.distance, 1.5);
  w.set(2, 2, 0, 0);
  assert.equal(
    voxelRay(w, { x: 0.5, y: 2.5, z: 0.5 }, { x: 1, y: 0, z: 0 })?.x,
    4,
  );
});
test('raycast handles negative coordinates and exact grid planes', () => {
  const w = new VoxelWorld(false);
  w.set(-2, 0, 0, BLOCK.stone);
  assert.equal(
    voxelRay(w, { x: 0, y: 0.5, z: 0.5 }, { x: -1, y: 0, z: 0 })?.x,
    -2,
  );
  assert.equal(
    voxelRay(w, { x: 0, y: 0.5, z: 0.5 }, { x: 1, y: 0, z: 0 }),
    null,
  );
  assert.equal(
    voxelRay(w, { x: 0, y: 0.5, z: 0.5 }, { x: 0, y: 0, z: 0 }),
    null,
  );
});
test('selection cannot reach beyond six blocks', () => {
  const w = new VoxelWorld(false);
  w.set(8, 1, 0, BLOCK.stone);
  assert.equal(
    voxelRay(w, { x: 0.5, y: 1.5, z: 0.5 }, { x: 1, y: 0, z: 0 }),
    null,
  );
});
test('placement is rejected when it would trap the player', () => {
  const p = { x: 0.5, y: 1, z: 0.5 };
  assert.equal(overlapsPlayer(p, 0, 1, 0), true);
  assert.equal(overlapsPlayer(p, 0, 2, 0), true);
  assert.equal(overlapsPlayer(p, 0, 3, 0), false);
  assert.equal(overlapsPlayer(p, 1, 1, 0), false);
});
