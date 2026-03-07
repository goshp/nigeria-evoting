// ─── results/PublishedTab.jsx ─────────────────────────────────────────────────
// Shows tallied results for closed elections. Candidate votes come from
// /api/results which counts directly from the Supabase votes table.

import { ElectionReport } from "../shared/components.jsx";

export default function PublishedTab({ elections }) {
  const closedElections = elections.filter(e => e.status === "closed");

  function downloadResultsCSV(el) {
    const rows = el.ballots.flatMap(b =>
      b.candidates.map(c => `"${b.title}","${c.name}","${c.party}",${c.votes || 0}`)
    );
    const csv  = `Ballot,Candidate,Party,Votes\n${rows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${el.id}-results.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (closedElections.length === 0) {
    return (
      <div className="alert alert-info">
        <span>ℹ️</span> No published results yet. Results are released automatically when an election closes.
      </div>
    );
  }

  return (
    <>
      {closedElections.map(el => {
        const totalVotes = el.votes_cast || 0;
        return (
          <div key={el.id} style={{ marginBottom: "2rem" }}>
            <div className="section-title" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.5rem" }}>
              <span>{el.title}</span>
              <span className="badge badge-closed" style={{ fontSize:"0.68rem" }}>✅ OFFICIAL RESULTS</span>
            </div>

            <div className="stats-grid mb-3">
              <StatCard label="Registered Voters" value={(el.registered_voters || 0).toLocaleString()} />
              <StatCard label="Total Votes Cast"  value={totalVotes.toLocaleString()} />
              <StatCard label="Turnout"           value={`${el.turnout || 0}%`} />
              <StatCard label="Election Date"     value={el.date || "—"} />
            </div>

            {el.ballots.map(ballot => {
              const sorted    = [...ballot.candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
              const ballotTotal = sorted.reduce((s, c) => s + (c.votes || 0), 0);
              const winner    = ballotTotal > 0 ? sorted[0] : null;

              return (
                <div key={ballot.id} style={{ background:"#fff", border:"1px solid #e5e0d8", borderRadius:"12px", marginBottom:"1.2rem", overflow:"hidden" }}>
                  <div style={{ background:"#004d29", color:"#fff", padding:"0.8rem 1.2rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontWeight:700, fontSize:"0.95rem" }}>{ballot.title}</span>
                    {winner && (
                      <span style={{ background:"#f0c674", color:"#3a2800", borderRadius:"20px", padding:"0.2rem 0.8rem", fontSize:"0.72rem", fontWeight:700 }}>
                        🏆 Winner: {winner.name}
                      </span>
                    )}
                  </div>
                  <div style={{ padding:"1rem 1.2rem" }}>
                    {ballotTotal === 0 && (
                      <div style={{ color:"#999", fontSize:"0.85rem", padding:"0.5rem 0" }}>No votes recorded for this ballot.</div>
                    )}
                    {sorted.map((c, i) => {
                      const pct     = ballotTotal > 0 ? ((c.votes || 0) / ballotTotal * 100) : 0;
                      const isWinner = i === 0 && ballotTotal > 0;
                      return (
                        <div key={c.id} style={{ marginBottom:"0.9rem" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.3rem" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
                              <span style={{ width:22, height:22, borderRadius:"50%", background: isWinner ? "#006837" : "#e5e0d8", color: isWinner ? "#fff" : "#666", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:"0.72rem", fontWeight:700, flexShrink:0 }}>{i+1}</span>
                              <span style={{ fontWeight:600, fontSize:"0.9rem" }}>{c.name}</span>
                              <span style={{ color:"#888", fontSize:"0.8rem" }}>{c.party}</span>
                              {isWinner && <span style={{ fontSize:"0.75rem" }}>🏆</span>}
                            </div>
                            <div style={{ textAlign:"right", fontSize:"0.85rem" }}>
                              <span style={{ fontWeight:700, color: isWinner ? "#006837" : "#333" }}>{(c.votes || 0).toLocaleString()}</span>
                              <span style={{ color:"#999", marginLeft:"0.4rem" }}>({pct.toFixed(1)}%)</span>
                            </div>
                          </div>
                          <div style={{ height:8, background:"#f0ece4", borderRadius:4, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${pct}%`, background: isWinner ? "#006837" : "#b8dfc9", borderRadius:4, transition:"width 0.5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                    {ballotTotal > 0 && (
                      <div style={{ fontSize:"0.75rem", color:"#aaa", marginTop:"0.4rem", textAlign:"right" }}>
                        {ballotTotal.toLocaleString()} valid votes counted
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <button className="btn btn-secondary btn-sm" onClick={() => downloadResultsCSV(el)}>
              ⬇ Download Official Results CSV
            </button>
          </div>
        );
      })}
    </>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background:"#f5f3ee", borderRadius:"10px", padding:"0.9rem 1rem", textAlign:"center" }}>
      <div style={{ fontSize:"1.3rem", fontWeight:700, color:"#004d29" }}>{value}</div>
      <div style={{ fontSize:"0.72rem", color:"#888", marginTop:"0.2rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</div>
    </div>
  );
}
