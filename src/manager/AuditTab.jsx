// ─── manager/AuditTab.jsx ─────────────────────────────────────────────────────
// Displays the anonymised cryptographic audit trail of all votes cast.
// Shows receipt codes, election IDs, and timestamps — never voter identities.

export default function AuditTab({ receipts }) {
  return (
    <div>
      <div className="section-title">Audit Log</div>

      <div className="alert alert-info mb-3">
        <span>🔒</span>
        <span>
          All votes are encrypted end-to-end. The audit log contains only anonymised
          receipt codes, timestamps, and election IDs — never voter identities.
        </span>
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
            {receipts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2.5rem", color: "var(--gray)" }}>
                  No votes recorded yet. Receipts will appear here as voters cast their ballots.
                </td>
              </tr>
            ) : (
              receipts.map((r, i) => (
                <tr key={r.code}>
                  <td className="text-gray text-sm">{i + 1}</td>
                  <td className="text-mono" style={{ fontSize: "0.78rem", color: "var(--green)", letterSpacing: "0.08em" }}>{r.code}</td>
                  <td style={{ fontSize: "0.85rem" }}>{r.electionTitle}</td>
                  <td className="text-mono text-sm text-gray">{new Date(r.timestamp).toLocaleString()}</td>
                  <td><span className="badge badge-active">Valid</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {receipts.length > 0 && (
        <div className="flex gap-2 mt-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const csv = ["Receipt Code,Election,Timestamp,Status",
                ...receipts.map(r => `${r.code},${r.electionTitle},${r.timestamp},Valid`)
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement("a");
              a.href = url; a.download = "audit-log.csv"; a.click();
            }}
          >
            ⬇ Export Audit Log CSV
          </button>
        </div>
      )}
    </div>
  );
}
