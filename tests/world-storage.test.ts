import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import {
  loadBrowserWorld,
  saveBrowserWorld,
  SaveConflict,
} from '../lib/world-storage.ts';
import { WorldSession } from '../lib/world-session.ts';
import { HOTBAR, BLOCK } from '../lib/voxel-world.ts';

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});
const data = () =>
  new WorldSession().snapshot(
    { pos: { x: -5.5, y: 2, z: 9.5 }, yaw: 0.02, pitch: 0 },
    HOTBAR,
    0,
  );

void test('a new browser saves and reloads the complete world snapshot', async () => {
  assert.deepEqual(await loadBrowserWorld(), {
    revision: 0,
    snapshot: null,
    available: true,
  });
  const snapshot = data();
  snapshot.edits.push([0, 14, 0, BLOCK.wood]);
  const revision = await saveBrowserWorld(snapshot, 0);
  assert.equal(revision, 1);
  assert.deepEqual(await loadBrowserWorld(), {
    revision: 1,
    snapshot,
    available: true,
  });
});

void test('a stale tab cannot overwrite a newer save', async () => {
  const first = data(),
    second = data();
  first.edits.push([0, 14, 0, BLOCK.wood]);
  second.edits.push([0, 14, 0, BLOCK.stone]);
  await saveBrowserWorld(first, 0);
  await assert.rejects(saveBrowserWorld(second, 0), SaveConflict);
  assert.deepEqual((await loadBrowserWorld()).snapshot, first);
});

void test('concurrent writers serialize their revision checks in one transaction', async () => {
  const first = data(),
    second = data();
  second.selected = 1;
  const results = await Promise.allSettled([
    saveBrowserWorld(first, 0),
    saveBrowserWorld(second, 0),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  const rejected = results.find((r) => r.status === 'rejected');
  assert.ok(
    rejected?.status === 'rejected' && rejected.reason instanceof SaveConflict,
  );
  assert.equal((await loadBrowserWorld()).revision, 1);
});

void test('unsupported persisted data disables automatic saving and is left intact', async () => {
  await loadBrowserWorld();
  const future = { revision: 1, snapshot: { ...data(), version: 99 } };
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('my-minecraft-world', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('saves', 'readwrite');
    tx.objectStore('saves').put(future, 'current');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  assert.deepEqual(await loadBrowserWorld(), {
    revision: 0,
    snapshot: null,
    available: false,
  });
  const preserved = await new Promise<unknown>((resolve) => {
    const request = db.transaction('saves').objectStore('saves').get('current');
    request.onsuccess = () => resolve(request.result);
  });
  assert.deepEqual(preserved, future);
  db.close();
});
