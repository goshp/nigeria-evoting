// ─── manager/AuditTab.jsx ─────────────────────────────────────────────────────
// Reads votes directly from Supabase via /api/votes?audit=1
// Shows anonymised receipt codes, election titles, timestamps.

import { useState, useEffect } from "react";

export default function AuditTab() {
  const [votes,   setVotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  async function loadVotes() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/votes?audit=1");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setVotes(data.votes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadVotes(); }, []);

  function exportCSV() {
    const csv = [
      "Receipt Code,Election,Timestamp,Status",
      ...votes.map(v => `${v.receipt_code},"${v.election_title}",${v.created_at},Valid`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "audit-log.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="section-title">Audit Log</div>

      <div className="alert alert-info mb-3">
        <span>🔒</span>
        <span>All votes are encrypted end-to-end. The audit log contains only anonymised receipt codes, timestamps, and election IDs — never voter identities.</span>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
        <span style={{ fontSize:"0.82rem", color:"#888" }}>{votes.length} vote{votes.length !== 1 ? "s" : ""} recorded</span>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={loadVotes}>↻ Refresh</button>
          {votes.length > 0 && <button className="btn btn-secondary btn-sm" onClick={exportCSV}>⬇ Export CSV</button>}
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Receipt Code</th>
              <th>Election</th>
              <th>Timestamp</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} style={{ textAlign:"center", padding:"2.5rem", color:"#888" }}>Loading votes from server…</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={5} style={{ textAlign:"center", padding:"2.5rem", color:"#c00" }}>❌ {error}</td></tr>
            )}
            {!loading && !error && votes.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign:"center", padding:"2.5rem", color:"var(--gray)" }}>No votes recorded yet. Receipts will appear here as voters cast their ballots.</td></tr>
            )}
            {!loading && votes.map((v, i) => (
              <tr key={v.receipt_code}>
                <td className="text-gray text-sm">{i + 1}</td>
                <td className="text-mono" style={{ fontSize:"0.78rem", color:"var(--green)", letterSpacing:"0.08em" }}>{v.receipt_code}</td>
                <td style={{ fontSize:"0.85rem" }}>{v.election_title}</td>
                <td className="text-mono text-sm text-gray">{new Date(v.created_at).toLocaleString()}</td>
                <td><span className="badge badge-active">Valid</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
