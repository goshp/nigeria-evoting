// ─── shared/offlineSync.js ────────────────────────────────────────────────────
// Offline-first vote queue with IndexedDB persistence.
//
// Every vote is written to IndexedDB FIRST — before any network call.
// When online, votes are immediately transmitted to /api/votes (Vercel
// serverless → Supabase Postgres). When offline, votes stay queued and
// auto-flush the moment connectivity is restored.
//
// Server sync is now a real fetch() POST — not simulated.

const DB_NAME    = "evoting_offline";
const DB_VERSION = 1;
const STORE_NAME = "vote_queue";
const API_URL    = "/api/votes";

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db    = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "code" });
        store.createIndex("synced",    "synced",    { unique: false });
        store.createIndex("enqueuedAt","enqueuedAt",{ unique: false });
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function dbPut(db, record) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(record);
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

function dbGetAll(db) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = e => resolve(e.target.result || []);
    req.onerror   = e => reject(e.target.error);
  });
}

function dbGetUnsynced(db) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readonly");
    const index = tx.objectStore(STORE_NAME).index("synced");
    const req   = index.getAll(IDBKeyRange.only(false));
    req.onsuccess = e => resolve(e.target.result || []);
    req.onerror   = e => reject(e.target.error);
  });
}

function dbMarkSynced(db, code) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.get(code);
    req.onsuccess = e => {
      const record = e.target.result;
      if (record) {
        record.synced   = true;
        record.syncedAt = new Date().toISOString();
        store.put(record).onsuccess = () => resolve();
      } else {
        resolve();
      }
    };
    req.onerror = e => reject(e.target.error);
  });
}

export function dbClear(db) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).clear();
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

// ── Real server sync via fetch() POST to /api/votes ───────────────────────────
async function syncToServer(votes) {
  const response = await fetch(API_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(votes),
  });

  // 409 = already recorded (duplicate receipt or already_voted) — treat as success
  if (response.status === 409) {
    return { success: true, duplicate: true };
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server responded with ${response.status}`);
  }

  return await response.json();
}

// ── Public API ────────────────────────────────────────────────────────────────

let _onStatusChange = null;

function emitStatus(status, detail = {}) {
  if (_onStatusChange) _onStatusChange(status, detail);
}

/**
 * Enqueue a vote: write to IndexedDB first, then attempt immediate server sync.
 * If offline or server unreachable, vote stays queued safely.
 */
export async function enqueueVote(receipt, onStatusChange) {
  _onStatusChange = onStatusChange || _onStatusChange;

  const record = {
    ...receipt,
    synced:     false,
    enqueuedAt: new Date().toISOString(),
    syncedAt:   null,
  };

  // Step 1 — always write to IndexedDB first
  const db = await openDB();
  await dbPut(db, record);
  emitStatus("queued");

  // Step 2 — attempt immediate sync if online
  if (navigator.onLine) {
    try {
      emitStatus("syncing");
      await syncToServer([record]);
      await dbMarkSynced(db, record.code);
      emitStatus("synced");
    } catch (err) {
      console.warn("[offlineSync] Immediate sync failed — vote queued:", err.message);
      emitStatus("sync_failed");
    }
  } else {
    emitStatus("offline_queued");
  }
}

/**
 * Flush all unsynced votes to the server.
 * Called automatically on reconnection and manually from SyncMonitorTab.
 */
export async function flushQueue(onStatusChange) {
  _onStatusChange = onStatusChange || _onStatusChange;

  const db       = await openDB();
  const unsynced = await dbGetUnsynced(db);

  if (unsynced.length === 0) return { synced: 0, failed: 0 };

  emitStatus("syncing");

  let synced = 0;
  let failed = 0;

  // Send as a batch — one POST for all pending votes
  try {
    await syncToServer(unsynced);
    // Mark all as synced in IndexedDB
    await Promise.all(unsynced.map(v => dbMarkSynced(db, v.code)));
    synced = unsynced.length;
    emitStatus("synced", { synced });
  } catch (err) {
    // Batch failed — try one by one so partial success is recorded
    console.warn("[offlineSync] Batch sync failed, retrying individually:", err.message);
    for (const vote of unsynced) {
      try {
        await syncToServer([vote]);
        await dbMarkSynced(db, vote.code);
        synced++;
      } catch (e) {
        console.error("[offlineSync] Individual sync failed for", vote.code, e.message);
        failed++;
      }
    }
    if (failed === 0) {
      emitStatus("synced", { synced });
    } else {
      emitStatus("sync_failed", { synced, failed });
    }
  }

  return { synced, failed };
}

/**
 * Returns queue statistics from IndexedDB.
 */
export async function getQueueStats() {
  try {
    const db      = await openDB();
    const records = await dbGetAll(db);
    return {
      total:   records.length,
      pending: records.filter(r => !r.synced).length,
      synced:  records.filter(r =>  r.synced).length,
      records,
    };
  } catch {
    return { total: 0, pending: 0, synced: 0, records: [] };
  }
}

/**
 * Clear all records from the queue (admin action).
 */
export async function clearQueue() {
  const db = await openDB();
  await dbClear(db);
}

/**
 * Register the window online/offline event listeners.
 * Auto-flushes the queue when connectivity is restored.
 * Returns a cleanup function to remove the listeners.
 */
export function registerOnlineListener(onStatusChange) {
  _onStatusChange = onStatusChange;

  async function handleOnline() {
    emitStatus("reconnected");
    await flushQueue(onStatusChange);
  }

  function handleOffline() {
    emitStatus("went_offline");
  }

  window.addEventListener("online",  handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online",  handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
