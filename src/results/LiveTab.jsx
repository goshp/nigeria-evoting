// ─── results/LiveTab.jsx ──────────────────────────────────────────────────────
// Displays real-time vote counts and turnout for all currently active elections.
// Uses the shared ElectionReport component for per-ballot result bars.

import { StatBox, ElectionReport } from "../shared/components.jsx";

export default function LiveTab({ elections }) {
  const activeElections = elections.filter(e => e.status === "active");

  return (
    <>
      <div className="alert alert-info mb-3">
        <span>📡</span>
        <span>
          Results are transmitted from polling units in real-time as votes are cast.
          Final certified results are published after the close of polls.
        </span>
      </div>

      {activeElections.length === 0 && (
        <div className="alert alert-warning">
          <span>ℹ️</span> No elections are currently active. Check the Published Results tab for closed elections.
        </div>
      )}

      {activeElections.map(el => (
        <div key={el.id}>
          <div className="section-title">{el.title}</div>
          <div className="stats-grid mb-3">
            <StatBox val={el.registered_voters.toLocaleString()} label="Registered Voters" />
            <StatBox val={el.votes_cast.toLocaleString()}        label="Votes Cast" />
            <StatBox val={el.turnout + "%"}                       label="Current Turnout" />
            <StatBox val="Live"                                   label="Status" />
          </div>
          <ElectionReport el={el} />
        </div>
      ))}
    </>
  );
}
