import { parseSnapshot, type WorldSnapshot } from './world-session.ts';

export type SavedWorld = {
  revision: number;
  snapshot: WorldSnapshot | null;
  available: boolean;
};
export type SaveStatus =
  | 'ready'
  | 'unsaved'
  | 'saving'
  | 'saved'
  | 'unavailable'
  | 'conflict';
export class SaveConflict extends Error {}
const DB_NAME = 'my-minecraft-world';
const STORE = 'saves';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    let finished = false;
    const fail = () => {
      if (!finished) {
        finished = true;
        reject(new Error('Storage unavailable'));
      }
    };
    const timeout = setTimeout(fail, 3000);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE))
        request.result.createObjectStore(STORE);
    };
    request.onerror = request.onblocked = () => {
      clearTimeout(timeout);
      fail();
    };
    request.onsuccess = () => {
      clearTimeout(timeout);
      if (finished) request.result.close();
      else {
        finished = true;
        resolve(request.result);
      }
    };
  });
}

export async function loadBrowserWorld(): Promise<SavedWorld> {
  let db: IDBDatabase | undefined;
  try {
    db = await openDatabase();
    const record: unknown = await new Promise((resolve, reject) => {
      const tx = db!.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get('current');
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = tx.onerror = () => reject(tx.error);
    });
    if (record === undefined)
      return { revision: 0, snapshot: null, available: true };
    const r = record as { revision?: number; snapshot?: unknown };
    if (!Number.isSafeInteger(r.revision) || r.revision! < 1)
      throw new Error('Invalid save');
    return {
      revision: r.revision!,
      snapshot: parseSnapshot(r.snapshot),
      available: true,
    };
  } catch {
    // Never overwrite an unreadable or newer-format save with an empty world.
    return { revision: 0, snapshot: null, available: false };
  } finally {
    db?.close();
  }
}

export async function saveBrowserWorld(
  snapshot: WorldSnapshot,
  revision: number,
): Promise<number> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      let conflict = false;
      const request = store.get('current');
      request.onsuccess = () => {
        const current = request.result as { revision?: number } | undefined;
        if (
          (current !== undefined &&
            (!Number.isSafeInteger(current?.revision) ||
              current.revision! < 1)) ||
          (current?.revision ?? 0) !== revision
        ) {
          conflict = true;
          tx.abort();
          return;
        }
        store.put({ revision: revision + 1, snapshot }, 'current');
      };
      tx.oncomplete = () => resolve(revision + 1);
      tx.onabort = tx.onerror = () =>
        reject(
          conflict
            ? new SaveConflict('World changed in another tab')
            : tx.error,
        );
    });
  } finally {
    db.close();
  }
}
