// ─── results/PublishedTab.jsx ─────────────────────────────────────────────────
// Displays officially certified results for closed elections.
// Includes a CSV export button for full public transparency.
// Uses the shared ElectionReport component for per-ballot result bars.

import { ElectionReport } from "../shared/components.jsx";

export default function PublishedTab({ elections }) {
  const closedElections = elections.filter(e => e.status === "closed");

  function downloadResultsCSV(el) {
    const rows = el.ballots.flatMap(b =>
      b.candidates.map(c => `${b.title},${c.name},${c.party},${c.votes || 0}`)
    );
    const csv  = `Ballot,Candidate,Party,Votes\n${rows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${el.id}-results.csv`; a.click();
  }

  return (
    <>
      {closedElections.length === 0 && (
        <div className="alert alert-info">
          <span>ℹ️</span> No published results yet. Results are released after official INEC certification.
        </div>
      )}

      {closedElections.map(el => (
        <div key={el.id}>
          <div className="section-title">
            {el.title}
            <span className="badge badge-closed" style={{ fontSize: "0.68rem" }}>OFFICIAL RESULTS</span>
          </div>

          <ElectionReport el={el} />

          <div className="flex gap-2 mb-3">
            <button className="btn btn-secondary btn-sm" onClick={() => downloadResultsCSV(el)}>
              ⬇ Download Results CSV
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
