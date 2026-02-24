// ─── manager/SyncMonitorTab.jsx ───────────────────────────────────────────────
// Admin view of the offline vote queue — shows all votes stored locally,
// their sync status, and allows manual re-sync trigger and queue export.
// Displayed as a fifth tab inside the Election Manager.

import { useState, useEffect } from "react";
import { getQueueStats, clearQueue } from "../shared/offlineSync.js";

export default function SyncMonitorTab({ isOnline, syncStatus }) {
  const [stats,    setStats]    = useState({ total: 0, pending: 0, synced: 0, records: [] });
  const [loading,  setLoading]  = useState(false);
  const [message,  setMessage]  = useState(null);

  async function refresh() {
    const s = await getQueueStats();
    setStats(s);
  }

  useEffect(() => { refresh(); }, [syncStatus]);

  async function handleManualSync() {
    if (!isOnline) { setMessage({ type: "error", text: "Cannot sync — device is offline." }); return; }
    setLoading(true);
    setMessage(null);
    try {
      setMessage({ type: "info", text: "Sync triggered — the connectivity bar will update with progress." });
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
    setLoading(false);
    await refresh();
  }

  async function handleClearSynced() {
    if (!window.confirm("Clear all synced votes from local queue? This cannot be undone.")) return;
    await clearQueue();
    await refresh();
    setMessage({ type: "success", text: "Local queue cleared." });
  }

  function downloadQueueCSV() {
    const rows = stats.records.map(r =>
      `${r.code},${r.electionId},${r.electionTitle},${r.enqueuedAt},${r.synced ? "Synced" : "Pending"},${r.syncedAt || ""}`
    );
    const csv  = `Receipt Code,Election ID,Election,Queued At,Status,Synced At\n${rows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "offline-queue.csv"; a.click();
  }

  const pendingRecords = stats.records.filter(r => !r.synced);
  const syncedRecords  = stats.records.filter(r => r.synced);

  return (
    <div>
      <div className="section-title">Offline Sync Monitor</div>

      {/* Connectivity badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "0.4rem 1rem", borderRadius: 20,
          background: isOnline ? "#d4edda" : "#fff3cd",
          color:      isOnline ? "#155724" : "#856404",
          fontWeight: 700, fontSize: "0.82rem",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: isOnline ? "#28a745" : "#ffc107", display: "inline-block" }} />
          {isOnline ? "Online — Server Connected" : "Offline — Local Storage Active"}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={refresh}>↻ Refresh</button>
      </div>

      {/* KPI tiles */}
      <div className="stats-grid mb-3">
        <div className="stat-box">
          <div className="stat-box-val">{stats.total}</div>
          <div className="stat-box-label">Total in Queue</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-val" style={{ color: stats.pending > 0 ? "var(--gold)" : "var(--green)" }}>{stats.pending}</div>
          <div className="stat-box-label">Pending Sync</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-val">{stats.synced}</div>
          <div className="stat-box-label">Synced to Server</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-val" style={{ color: stats.pending > 0 ? "var(--red)" : "var(--green)" }}>
            {stats.total > 0 ? Math.round((stats.synced / stats.total) * 100) : 100}%
          </div>
          <div className="stat-box-label">Sync Coverage</div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`alert alert-${message.type === "error" ? "error" : message.type === "success" ? "success" : "info"} mb-3`}>
          <span>{message.type === "error" ? "⚠️" : message.type === "success" ? "✅" : "ℹ️"}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* How it works */}
      <div className="alert alert-info mb-3">
        <span>📡</span>
        <div>
          <strong>How offline sync works:</strong> Every vote is written to the device's local IndexedDB storage
          before any network call is attempted. If the device is online, votes are immediately transmitted to the
          central server and marked synced. If offline, they remain in the local queue and are automatically
          flushed the moment connectivity is restored — with no data loss and no action required from the voter.
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-3">
        <button className="btn btn-primary btn-sm" onClick={handleManualSync} disabled={!isOnline || loading}>
          🔄 Force Sync Now
        </button>
        <button className="btn btn-secondary btn-sm" onClick={downloadQueueCSV} disabled={stats.total === 0}>
          ⬇ Export Queue CSV
        </button>
        <button className="btn btn-danger btn-sm" onClick={handleClearSynced} disabled={stats.synced === 0}>
          🗑 Clear Synced Records
        </button>
      </div>

      {/* Pending votes table */}
      {pendingRecords.length > 0 && (
        <>
          <div className="section-title" style={{ fontSize: "1rem" }}>
            ⏳ Pending Sync ({pendingRecords.length})
          </div>
          <div className="card mb-3">
            <table className="table">
              <thead>
                <tr><th>Receipt Code</th><th>Election</th><th>Queued At</th><th>Status</th></tr>
              </thead>
              <tbody>
                {pendingRecords.map(r => (
                  <tr key={r.code}>
                    <td className="text-mono" style={{ fontSize: "0.75rem", color: "var(--gold)", letterSpacing: "0.06em" }}>{r.code}</td>
                    <td style={{ fontSize: "0.85rem" }}>{r.electionTitle}</td>
                    <td className="text-mono text-sm text-gray">{new Date(r.enqueuedAt).toLocaleString()}</td>
                    <td><span className="badge badge-pending">Pending</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Synced votes table */}
      {syncedRecords.length > 0 && (
        <>
          <div className="section-title" style={{ fontSize: "1rem" }}>
            ✅ Synced ({syncedRecords.length})
          </div>
          <div className="card mb-3">
            <table className="table">
              <thead>
                <tr><th>Receipt Code</th><th>Election</th><th>Queued At</th><th>Synced At</th></tr>
              </thead>
              <tbody>
                {syncedRecords.map(r => (
                  <tr key={r.code}>
                    <td className="text-mono" style={{ fontSize: "0.75rem", color: "var(--green)", letterSpacing: "0.06em" }}>{r.code}</td>
                    <td style={{ fontSize: "0.85rem" }}>{r.electionTitle}</td>
                    <td className="text-mono text-sm text-gray">{new Date(r.enqueuedAt).toLocaleString()}</td>
                    <td className="text-mono text-sm text-gray">{r.syncedAt ? new Date(r.syncedAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {stats.total === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--gray)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📭</div>
          <div>No votes in the local queue yet.</div>
          <div className="text-sm" style={{ marginTop: 4 }}>Votes will appear here as voters cast their ballots.</div>
        </div>
      )}
    </div>
  );
}
