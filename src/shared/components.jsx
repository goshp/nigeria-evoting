// ─── shared/components.jsx ────────────────────────────────────────────────────
// Reusable UI primitives shared by the Manager, Voter Portal, and Results modules.
// Import individual components as needed — do not import the whole file blindly.

// ── StatBox ──────────────────────────────────────────────────────────────────
// Single KPI tile used in dashboard stats grids.
export function StatBox({ val, label }) {
  return (
    <div className="stat-box">
      <div className="stat-box-val">{val}</div>
      <div className="stat-box-label">{label}</div>
    </div>
  );
}

// ── ElectionReport ────────────────────────────────────────────────────────────
// Renders per-ballot result bars for a given election object.
// Used by Manager > Reports tab and Results > Published / Live tabs.
// Pass isManager=true to show publish / export action buttons.
export function ElectionReport({ el, isManager }) {
  return (
    <div>
      <div className="stats-grid mb-3">
        <StatBox val={el.registered_voters.toLocaleString()} label="Registered Voters" />
        <StatBox val={el.votes_cast.toLocaleString()}        label="Votes Cast" />
        <StatBox val={el.turnout + "%"}                       label="Turnout" />
        <StatBox val={el.ballots.length}                      label="Ballot Questions" />
      </div>

      {el.ballots.map(ballot => {
        const hasResults        = ballot.candidates.some(c => c.votes);
        const totalBallotVotes  = ballot.candidates.reduce((a, c) => a + (c.votes || 0), 0);
        const sorted            = [...ballot.candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));

        return (
          <div className="result-card mb-3" key={ballot.id}>
            <div className="result-card-header">
              <h3>{ballot.title}</h3>
              {!hasResults && <span className="badge badge-pending">Awaiting Close</span>}
            </div>

            {sorted.map((c, i) => {
              const pct = totalBallotVotes > 0
                ? ((c.votes || 0) / totalBallotVotes * 100).toFixed(1)
                : 0;
              return (
                <div className="result-row" key={c.id}>
                  <div className={`result-rank ${i === 0 && hasResults ? "first" : ""}`}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="result-bar-label">
                      <span style={{ fontWeight: 600 }}>
                        {c.name} <span className="text-gray text-sm">· {c.party}</span>
                      </span>
                      <span>{hasResults ? `${pct}%` : "—"}</span>
                    </div>
                    <div className="result-bar">
                      <div
                        className={`result-bar-fill ${i === 0 && hasResults ? "first" : ""}`}
                        style={{ width: hasResults ? `${pct}%` : "0%" }}
                      />
                    </div>
                  </div>
                  <div className="result-votes">{c.votes ? c.votes.toLocaleString() : "—"}</div>
                </div>
              );
            })}
          </div>
        );
      })}

      {isManager && el.status === "closed" && (
        <div className="flex gap-2">
          <button className="btn btn-primary">📤 Publish Results</button>
          <button className="btn btn-secondary">⬇ Download CSV</button>
          <button className="btn btn-secondary">📄 Print Report</button>
        </div>
      )}
    </div>
  );
}
