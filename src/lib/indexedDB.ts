'use client';

/**
 * IndexedDB backup layer — secondary local storage for all RFP state.
 * Used as a fallback when localStorage is full or corrupted.
 * All operations are async and non-blocking; failures are swallowed
 * because IDB is a backup, not the primary store.
 */

const DB_NAME = 'rfp-workbook-backup';
const DB_VERSION = 1;
const STORE = 'state';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IDB write failures are non-critical; localStorage is primary
  }
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/** Mirror a full state snapshot to IDB (fire-and-forget). */
export function idbMirrorState(snapshot: Record<string, unknown>): void {
  idbSet('rfp-full-state', { ...snapshot, _mirrored: Date.now() });
}

/** Retrieve the most recent full-state mirror from IDB. */
export async function idbGetStateMirror(): Promise<Record<string, unknown> | null> {
  return idbGet<Record<string, unknown>>('rfp-full-state');
}
