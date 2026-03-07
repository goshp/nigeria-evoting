// ─── manager/ReportsTab.jsx ───────────────────────────────────────────────────
// Displays live-tallied results per election. Reads from /api/results which
// counts votes directly from the Supabase votes table.

import { useState, useEffect } from "react";

export default function ReportsTab({ elections }) {
  const [selectedId, setSelectedId] = useState(elections[0]?.id || null);
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/results?electionId=${encodeURIComponent(selectedId)}`)
      .then(r => r.json())
      .then(data => { setResult(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [selectedId]);

  function downloadCSV() {
    if (!result) return;
    const rows = result.ballots.flatMap(b =>
      b.candidates.map(c => `"${b.title}","${c.name}","${c.party}",${c.votes || 0}`)
    );
    const csv  = `Ballot,Candidate,Party,Votes\n${rows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${selectedId}-results.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="section-title">Results & Reports</div>

      <div className="form-group mb-3" style={{ maxWidth:480 }}>
        <label className="form-label">Select Election</label>
        <select className="form-control" value={selectedId || ""} onChange={e => setSelectedId(e.target.value)}>
          {elections.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      {loading && <div style={{ textAlign:"center", padding:"3rem", color:"#888" }}>⏳ Loading results…</div>}
      {error   && <div className="alert alert-warning"><span>❌</span><span>{error}</span></div>}

      {result && !loading && (
        <>
          {/* Stats */}
          <div className="stats-grid mb-3">
            {[
              ["Registered Voters", (result.registered_voters || 0).toLocaleString()],
              ["Votes Cast",        (result.votes_cast || 0).toLocaleString()],
              ["Turnout",           `${result.turnout || 0}%`],
              ["Ballots",           result.ballots.length],
            ].map(([label, val]) => (
              <div key={label} style={{ background:"#f5f3ee", borderRadius:"10px", padding:"0.9rem 1rem", textAlign:"center" }}>
                <div style={{ fontSize:"1.4rem", fontWeight:700, color:"#004d29" }}>{val}</div>
                <div style={{ fontSize:"0.72rem", color:"#888", marginTop:"0.2rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Per-ballot results */}
          {result.ballots.map(ballot => {
            const sorted      = [...ballot.candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
            const ballotTotal = sorted.reduce((s, c) => s + (c.votes || 0), 0);
            const winner      = ballotTotal > 0 ? sorted[0] : null;
            return (
              <div key={ballot.id} style={{ background:"#fff", border:"1px solid #e5e0d8", borderRadius:"12px", marginBottom:"1.2rem", overflow:"hidden" }}>
                <div style={{ background:"#004d29", color:"#fff", padding:"0.8rem 1.2rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontWeight:700 }}>{ballot.title}</span>
                  {winner
                    ? <span style={{ background:"#f0c674", color:"#3a2800", borderRadius:"20px", padding:"0.2rem 0.8rem", fontSize:"0.72rem", fontWeight:700 }}>🏆 {winner.name}</span>
                    : <span style={{ background:"rgba(255,255,255,0.15)", borderRadius:"20px", padding:"0.2rem 0.8rem", fontSize:"0.72rem" }}>Awaiting votes</span>
                  }
                </div>
                <div style={{ padding:"1rem 1.2rem" }}>
                  {sorted.map((c, i) => {
                    const pct      = ballotTotal > 0 ? ((c.votes || 0) / ballotTotal * 100) : 0;
                    const isWinner = i === 0 && ballotTotal > 0;
                    return (
                      <div key={c.id} style={{ marginBottom:"0.9rem" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.3rem" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                            <span style={{ width:22, height:22, borderRadius:"50%", background: isWinner ? "#006837" : "#e5e0d8", color: isWinner ? "#fff" : "#666", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:"0.72rem", fontWeight:700 }}>{i+1}</span>
                            <span style={{ fontWeight:600 }}>{c.name}</span>
                            <span style={{ color:"#888", fontSize:"0.8rem" }}>{c.party}</span>
                            {isWinner && <span>🏆</span>}
                          </div>
                          <span style={{ fontWeight:700, color: isWinner ? "#006837" : "#333" }}>
                            {(c.votes || 0).toLocaleString()} <span style={{ color:"#aaa", fontWeight:400 }}>({pct.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div style={{ height:8, background:"#f0ece4", borderRadius:4, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`, background: isWinner ? "#006837" : "#b8dfc9", borderRadius:4 }} />
                        </div>
                      </div>
                    );
                  })}
                  {ballotTotal > 0 && <div style={{ fontSize:"0.75rem", color:"#aaa", textAlign:"right", marginTop:"0.3rem" }}>{ballotTotal.toLocaleString()} valid votes</div>}
                </div>
              </div>
            );
          })}

          <button className="btn btn-secondary btn-sm" onClick={downloadCSV}>⬇ Download Results CSV</button>
        </>
      )}
    </div>
  );
}
