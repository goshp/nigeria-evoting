// ─── shared/offlineSync.js ────────────────────────────────────────────────────
// Offline-first vote queue with IndexedDB persistence and background sync.
//
// Architecture:
//   1. Every submitted vote is ALWAYS written to IndexedDB first (offline-safe).
//   2. If online, the sync engine immediately attempts to flush the queue to the
//      server (simulated here — swap simulateServerSync for a real fetch() call).
//   3. If offline, votes sit in the queue. A listener on window "online" event
//      triggers an automatic flush the moment connectivity is restored.
//   4. The queue is never lost — IndexedDB persists across page refreshes,
//      browser restarts, and power cycles.
//
// DB schema:
//   Database : "evoting_offline"
//   Store    : "vote_queue"
//     key    : receipt code (unique string)
//     value  : { code, electionId, electionTitle, votes, timestamp, synced }

const DB_NAME    = "evoting_offline";
const DB_VERSION = 1;
const STORE_NAME = "vote_queue";

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db    = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "code" });
        store.createIndex("synced",     "synced",     { unique: false });
        store.createIndex("electionId", "electionId", { unique: false });
      }
    };

    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function dbPut(db, record) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror   = e  => reject(e.target.error);
  });
}

function dbGetAll(db) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function dbGetUnsynced(db) {
  return new Promise((resolve, reject) => {
    const tx      = db.transaction(STORE_NAME, "readonly");
    const store   = tx.objectStore(STORE_NAME);
    const index   = store.index("synced");
    const req     = index.getAll(0); // synced === 0 means pending
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function dbMarkSynced(db, code) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(code);
    getReq.onsuccess = e => {
      const record      = e.target.result;
      if (!record) { resolve(); return; }
      record.synced     = 1;
      record.syncedAt   = new Date().toISOString();
      const putReq      = store.put(record);
      putReq.onsuccess  = () => resolve();
      putReq.onerror    = ev => reject(ev.target.error);
    };
    getReq.onerror = e => reject(e.target.error);
  });
}

function dbClear(db) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.clear();
    req.onsuccess = () => resolve();
    req.onerror   = e  => reject(e.target.error);
  });
}

// ── Server sync simulation ────────────────────────────────────────────────────
// Replace this function with a real fetch() POST to your backend API.
// Expected server endpoint: POST /api/votes  { votes: [...] }
async function simulateServerSync(pendingVotes) {
  // Simulate 800ms–1.5s network round-trip
  await new Promise(r => setTimeout(r, 800 + Math.random() * 700));

  // Simulate 5% random server failure to demonstrate retry logic
  if (Math.random() < 0.05) {
    throw new Error("Server temporarily unavailable (503)");
  }

  // In production, replace with:
  // const res = await fetch("/api/votes", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ votes: pendingVotes }),
  // });
  // if (!res.ok) throw new Error(`Server error ${res.status}`);

  return { accepted: pendingVotes.length };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Enqueue a vote for offline-safe storage and attempt immediate sync.
 *
 * @param {object} voteRecord  – { code, electionId, electionTitle, votes, timestamp }
 * @param {function} onStatus  – callback(statusObject) for UI updates
 * @returns {Promise<void>}
 */
export async function enqueueVote(voteRecord, onStatus) {
  const db = await openDB();

  // Always persist locally first
  const record = { ...voteRecord, synced: 0, enqueuedAt: new Date().toISOString() };
  await dbPut(db, record);

  onStatus({ type: "queued", code: voteRecord.code });

  // Attempt immediate sync if online
  if (navigator.onLine) {
    await flushQueue(db, onStatus);
  } else {
    onStatus({ type: "offline_queued", code: voteRecord.code });
  }
}

/**
 * Flush all unsynced votes to the server.
 * Called automatically on enqueue (if online) and on window "online" event.
 *
 * @param {IDBDatabase} db
 * @param {function} onStatus
 */
export async function flushQueue(db, onStatus) {
  const pending = await dbGetUnsynced(db);
  if (pending.length === 0) return;

  onStatus({ type: "syncing", count: pending.length });

  try {
    await simulateServerSync(pending);

    // Mark each as synced
    for (const vote of pending) {
      await dbMarkSynced(db, vote.code);
    }

    onStatus({ type: "synced", count: pending.length });
  } catch (err) {
    onStatus({ type: "sync_failed", error: err.message, count: pending.length });
    // Will retry on next "online" event or next vote submission
  }
}

/**
 * Get full queue stats for display in the UI.
 * @returns {Promise<{ total, pending, synced }>}
 */
export async function getQueueStats() {
  try {
    const db      = await openDB();
    const all     = await dbGetAll(db);
    const pending = all.filter(r => !r.synced);
    return {
      total:   all.length,
      pending: pending.length,
      synced:  all.length - pending.length,
      records: all,
    };
  } catch {
    return { total: 0, pending: 0, synced: 0, records: [] };
  }
}

/**
 * Clear entire queue (admin action — use only after confirmed server sync).
 */
export async function clearQueue() {
  const db = await openDB();
  await dbClear(db);
}

/**
 * Register the window "online" event listener for automatic background sync.
 * Call once at app startup. Pass the same onStatus callback used elsewhere.
 *
 * @param {function} onStatus
 * @returns {function} cleanup – call on unmount to remove the listener
 */
export function registerOnlineListener(onStatus) {
  async function handleOnline() {
    onStatus({ type: "reconnected" });
    try {
      const db = await openDB();
      await flushQueue(db, onStatus);
    } catch (err) {
      onStatus({ type: "sync_failed", error: err.message });
    }
  }

  window.addEventListener("online",  handleOnline);
  window.addEventListener("offline", () => onStatus({ type: "went_offline" }));

  return () => {
    window.removeEventListener("online",  handleOnline);
    window.removeEventListener("offline", () => {});
  };
}
