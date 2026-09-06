import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WorldSession, parseSnapshot } from '../lib/world-session.ts';
import {
  BLOCK,
  HOTBAR,
  BUILDABLE_BLOCKS,
  VoxelWorld,
  voxelRay,
} from '../lib/voxel-world.ts';
import { loadBrowserWorld } from '../lib/world-storage.ts';

const player = { pos: { x: -5.5, y: 2, z: 9.5 }, yaw: 0.02, pitch: -0.06 };
const away = { x: 20.5, y: 2, z: 20.5 };
const snapshot = (s: WorldSession) => s.snapshot(player, HOTBAR, 0);

void test('export and restore preserve removed blocks, new materials, player and hotbar', () => {
  const s = new WorldSession();
  assert.ok(s.edit(-4, 2, 7, 0, away)); // Existing pumpkin.
  assert.ok(s.edit(0, 14, 0, BLOCK.log, away));
  const slots = [...HOTBAR];
  slots[2] = BLOCK.pumpkin;
  const saved = s.snapshot(player, slots, 2);
  const { session: restored, snapshot: data } = WorldSession.restore(
    JSON.parse(JSON.stringify(saved)),
  );
  assert.deepEqual(
    [...restored.world.blocks].sort((a, b) => a[0].localeCompare(b[0])),
    [...s.world.blocks].sort((a, b) => a[0].localeCompare(b[0])),
  );
  assert.deepEqual(data.player, player);
  assert.deepEqual(data.hotbar, slots);
  assert.equal(data.selected, 2);
  assert.equal(restored.canUndo, false);
});

void test('undo and redo restore original material and compact unchanged world deltas', () => {
  const s = new WorldSession();
  s.edit(-4, 2, 7, 0, away);
  assert.equal(s.world.get(-4, 2, 7), 0);
  assert.ok(s.undo(away));
  assert.equal(s.world.get(-4, 2, 7), BLOCK.pumpkin);
  assert.deepEqual(snapshot(s).edits, []);
  assert.ok(s.redo(away));
  assert.equal(s.world.get(-4, 2, 7), 0);
  s.undo(away);
  s.edit(0, 14, 0, BLOCK.wood, away);
  assert.equal(s.canRedo, false);
});

void test('blocked history operations retain the command until the player moves away', () => {
  const s = new WorldSession();
  s.edit(-4, 2, 7, 0, away);
  const inside = { x: -3.5, y: 2, z: 7.5 };
  assert.equal(s.undo(inside), null);
  assert.equal(s.canUndo, true);
  assert.equal(s.world.get(-4, 2, 7), 0);
  assert.ok(s.undo(away));
  s.edit(0, 14, 0, BLOCK.glass, away);
  s.undo(away);
  assert.equal(s.redo({ x: 0.5, y: 14, z: 0.5 }), null);
  assert.equal(s.canRedo, true);
});

void test('negative boundary can be repaired while bedrock and out-of-bounds edits stay protected', () => {
  const s = new WorldSession();
  const old = s.world.get(-30, 1, 0);
  assert.ok(old);
  assert.ok(s.edit(-30, 1, 0, 0, away));
  assert.ok(s.edit(-30, 1, 0, old, away));
  for (const [x, y, z] of [
    [30, 2, 0],
    [-31, 2, 0],
    [0, 25, 0],
    [0, -4, 0],
    [0.5, 2, 0],
  ])
    assert.equal(s.edit(x, y, z, BLOCK.stone, away), null);
  assert.equal(s.edit(0, 14, 0, BLOCK.bedrock, away), null);
  assert.equal(s.edit(0, -4, 0, 0, away), null);
});

void test('every editable material can be selected, placed, saved and restored', () => {
  for (const block of BUILDABLE_BLOCKS) {
    const s = new WorldSession();
    assert.ok(s.edit(0, 14, 0, block, away));
    const { session } = WorldSession.restore(snapshot(s));
    assert.equal(session.world.get(0, 14, 0), block);
  }
  const w = new VoxelWorld(false);
  w.set(0, 24, 0, BLOCK.wood);
  assert.equal(w.top(0, 0), 25);
});

void test('invalid or newer files are rejected atomically without altering the current world', () => {
  const s = new WorldSession();
  s.edit(0, 14, 0, BLOCK.wood, away);
  const base = snapshot(s);
  const invalid = [
    null,
    {},
    { ...base, version: 2 },
    { ...base, worldVersion: 2 },
    { ...base, edits: [[0, -4, 0, 0]] },
    { ...base, edits: [[30, 2, 0, 1]] },
    { ...base, edits: [[0, 14, 0, 99]] },
    { ...base, edits: [[0, 14, 0, BLOCK.bedrock]] },
    {
      ...base,
      edits: [
        [0, 14, 0, 1],
        [0, 14, 0, 2],
      ],
    },
    { ...base, hotbar: [1] },
    { ...base, hotbar: [...HOTBAR.slice(1), 99] },
    { ...base, selected: 6 },
    { ...base, player: { ...player, pos: { x: Infinity, y: 2, z: 2 } } },
    { ...base, player: { ...player, pitch: 4 } },
  ];
  for (const bad of invalid) assert.throws(() => WorldSession.restore(bad));
  assert.deepEqual(snapshot(s), base);
});

void test('snapshots do not share mutable arrays or player objects with the running session', () => {
  const s = new WorldSession();
  s.edit(0, 14, 0, BLOCK.wood, away);
  const exported = snapshot(s);
  const parsed = parseSnapshot(exported);
  parsed.edits[0][3] = BLOCK.stone;
  parsed.hotbar[0] = BLOCK.glass;
  parsed.player.pos.x = 0;
  assert.equal(exported.edits[0][3], BLOCK.wood);
  assert.equal(exported.hotbar[0], HOTBAR[0]);
  assert.equal(player.pos.x, -5.5);
  assert.equal(s.world.get(0, 14, 0), BLOCK.wood);
});

void test('unavailable browser storage returns a disabled save state without throwing', async () => {
  assert.equal(typeof globalThis.indexedDB, 'undefined');
  assert.deepEqual(await loadBrowserWorld(), {
    revision: 0,
    snapshot: null,
    available: false,
  });
});

void test('water can be targeted for editing without becoming a solid collision block', () => {
  const world = new VoxelWorld(false);
  world.set(1, 1, 0, BLOCK.water);
  world.set(2, 1, 0, BLOCK.stone);
  const origin = { x: 0.5, y: 1.5, z: 0.5 },
    direction = { x: 1, y: 0, z: 0 };
  assert.equal(voxelRay(world, origin, direction)?.block, BLOCK.stone);
  assert.equal(voxelRay(world, origin, direction, 6, true)?.block, BLOCK.water);
});

void test('history is bounded while older edits remain saved', () => {
  const s = new WorldSession();
  for (let i = 0; i < 201; i++)
    assert.ok(
      s.edit(-10 + (i % 20), 14, -10 + Math.floor(i / 20), BLOCK.wood, away),
    );
  for (let i = 0; i < 200; i++) assert.ok(s.undo(away));
  assert.equal(s.canUndo, false);
  assert.equal(snapshot(s).edits.length, 1);
  assert.equal(
    WorldSession.restore(snapshot(s)).session.world.get(-10, 14, -10),
    BLOCK.wood,
  );
});
