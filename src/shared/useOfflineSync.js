// ─── shared/useOfflineSync.js ─────────────────────────────────────────────────
// React hook that wraps the offline sync engine.
// Provides connectivity status, sync status, queue stats, and the
// enqueueVote action to any component that needs them.
//
// Usage:
//   const { isOnline, syncStatus, queueStats, submitVote } = useOfflineSync();

import { useState, useEffect, useCallback } from "react";
import {
  enqueueVote,
  getQueueStats,
  registerOnlineListener,
} from "./offlineSync.js";

export function useOfflineSync() {
  const [isOnline,    setIsOnline]    = useState(navigator.onLine);
  const [syncStatus,  setSyncStatus]  = useState(null);
  // { type: "idle"|"queued"|"syncing"|"synced"|"sync_failed"|"offline_queued"|"reconnected"|"went_offline" }
  const [queueStats,  setQueueStats]  = useState({ total: 0, pending: 0, synced: 0, records: [] });

  // ── Status handler (called by the sync engine) ────────────────────────────
  const handleStatus = useCallback(async (status) => {
    setSyncStatus(status);

    if (status.type === "went_offline") setIsOnline(false);
    if (status.type === "reconnected")  setIsOnline(true);

    // Refresh queue stats after any meaningful event
    const stats = await getQueueStats();
    setQueueStats(stats);
  }, []);

  // ── Register online/offline listeners on mount ────────────────────────────
  useEffect(() => {
    const cleanup = registerOnlineListener(handleStatus);

    // Load initial state asynchronously — avoids synchronous setState in effect body
    async function init() {
      setIsOnline(navigator.onLine);
      const stats = await getQueueStats();
      setQueueStats(stats);
    }
    init();

    return cleanup;
  }, [handleStatus]);

  // ── submitVote: enqueue + attempt sync ────────────────────────────────────
  const submitVote = useCallback(async (voteRecord) => {
    await enqueueVote(voteRecord, handleStatus);
    // Re-read stats after submission
    const stats = await getQueueStats();
    setQueueStats(stats);
  }, [handleStatus]);

  return {
    isOnline,
    syncStatus,
    queueStats,
    submitVote,
  };
}
