// ─── manager/ElectionsTab.jsx ─────────────────────────────────────────────────
// Displays the main elections dashboard: KPI tiles, election cards grid,
// and per-card Publish / Close / View Results actions.

import { StatBox } from "../shared/components.jsx";

export default function ElectionsTab({ elections, onPublish, onClose, onSelect, setManagerTab }) {
  const stats = {
    total:  elections.length,
    active: elections.filter(e => e.status === "active").length,
    draft:  elections.filter(e => e.status === "draft").length,
    closed: elections.filter(e => e.status === "closed").length,
  };
  const totalVotes = elections.reduce((a, e) => a + e.votes_cast, 0);

  return (
    <>
      {/* ── KPI STATS ── */}
      <div className="stats-grid">
        <StatBox val={stats.total}                  label="Total Elections" />
        <StatBox val={stats.active}                 label="Active Now" />
        <StatBox val={stats.draft}                  label="Draft" />
        <StatBox val={totalVotes.toLocaleString()}  label="Total Votes Cast" />
      </div>

      {/* ── ELECTION CARDS ── */}
      <div className="section-title">All Elections</div>
      <div className="election-grid">
        {elections.map(el => (
          <ElectionCard
            key={el.id}
            el={el}
            onPublish={onPublish}
            onClose={onClose}
            onViewResults={() => { onSelect(el); setManagerTab("reports"); }}
          />
        ))}
      </div>
    </>
  );
}

// ── ElectionCard ──────────────────────────────────────────────────────────────
function ElectionCard({ el, onPublish, onClose, onViewResults }) {
  return (
    <div className="election-card">
      <div className="election-card-header">
        <div>
          <div className="election-card-type">{el.type} election</div>
          <div className="election-card-title">{el.title}</div>
        </div>
        <span className={`badge badge-${el.status}`}>{el.status}</span>
      </div>

      <div className="election-card-body">
        <div className="election-card-meta">
          <span>📅 {el.date}</span>
          <span>⏰ {el.time_open}–{el.time_close}</span>
          <span>🗂 {el.ballots.length} ballot{el.ballots.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="election-stats">
          <div className="election-card-stat">
            <div className="election-card-stat-val">{el.registered_voters.toLocaleString()}</div>
            <div className="election-card-stat-label">Registered Voters</div>
          </div>
          <div className="election-card-stat">
            <div className="election-card-stat-val">{el.votes_cast.toLocaleString()}</div>
            <div className="election-card-stat-label">Votes Cast</div>
          </div>
          <div className="election-card-stat">
            <div className="election-card-stat-val">{el.turnout}%</div>
            <div className="election-card-stat-label">Turnout</div>
          </div>
        </div>
      </div>

      <div className="election-card-actions">
        {el.status === "draft"  && <button className="btn btn-primary btn-sm" onClick={() => onPublish(el.id)}>▶ Publish</button>}
        {el.status === "active" && <button className="btn btn-danger  btn-sm" onClick={() => onClose(el.id)}>■ Close Election</button>}
        <button className="btn btn-secondary btn-sm" onClick={onViewResults}>📊 View Results</button>
      </div>
    </div>
  );
}
