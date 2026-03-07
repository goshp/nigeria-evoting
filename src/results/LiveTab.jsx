// ─── results/LiveTab.jsx ──────────────────────────────────────────────────────
// Live tabulation for active elections. Shows real-time vote counts and
// a countdown timer to close. Closed elections redirect to Published tab.

import { useState, useEffect } from "react";

function Countdown({ date, timeClose }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function tick() {
      try {
        const closeTime = new Date(`${date}T${timeClose}:00`);
        const diff      = closeTime - new Date();
        if (diff <= 0) { setRemaining("Closing…"); return; }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setRemaining(`${h}h ${m}m ${s}s remaining`);
      } catch { setRemaining(""); }
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [date, timeClose]);

  return <span style={{ fontSize:"0.8rem", color:"#f0c674" }}>⏱ {remaining}</span>;
}

export default function LiveTab({ elections }) {
  const activeElections = elections.filter(e => e.status === "active");

  return (
    <>
      <div className="alert alert-info mb-3">
        <span>📡</span>
        <span>Results are transmitted from polling units in real-time as votes are cast. Final certified results are published after the close of polls.</span>
      </div>

      {activeElections.length === 0 && (
        <div className="alert alert-warning">
          <span>ℹ️</span> No elections are currently active. Check the Published Results tab for closed elections.
        </div>
      )}

      {activeElections.map(el => (
        <div key={el.id} style={{ marginBottom:"2rem" }}>
          <div style={{ background:"#004d29", color:"#fff", borderRadius:"10px 10px 0 0", padding:"0.9rem 1.2rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontWeight:700 }}>{el.title}</span>
            <Countdown date={el.date} timeClose={el.time_close} />
          </div>
          <div style={{ border:"1px solid #e5e0d8", borderTop:"none", borderRadius:"0 0 10px 10px", padding:"1rem 1.2rem" }}>
            <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap", marginBottom:"1rem" }}>
              {[
                ["Registered", (el.registered_voters || 0).toLocaleString()],
                ["Votes Cast",  (el.votes_cast || 0).toLocaleString()],
                ["Turnout",     `${el.turnout || 0}%`],
                ["Closes",      el.time_close],
              ].map(([label, val]) => (
                <div key={label} style={{ background:"#f5f3ee", borderRadius:"8px", padding:"0.6rem 0.9rem", textAlign:"center", minWidth:90 }}>
                  <div style={{ fontWeight:700, color:"#004d29" }}>{val}</div>
                  <div style={{ fontSize:"0.7rem", color:"#888" }}>{label}</div>
                </div>
              ))}
            </div>

            {el.ballots.map(ballot => {
              const sorted      = [...ballot.candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
              const ballotTotal = sorted.reduce((s, c) => s + (c.votes || 0), 0);
              return (
                <div key={ballot.id} style={{ marginBottom:"1rem" }}>
                  <div style={{ fontWeight:600, fontSize:"0.85rem", color:"#555", marginBottom:"0.5rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>{ballot.title}</div>
                  {sorted.map((c, i) => {
                    const pct = ballotTotal > 0 ? ((c.votes || 0) / ballotTotal * 100) : 0;
                    return (
                      <div key={c.id} style={{ marginBottom:"0.5rem" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.85rem", marginBottom:"0.2rem" }}>
                          <span><strong>{c.name}</strong> <span style={{ color:"#888" }}>{c.party}</span></span>
                          <span style={{ fontWeight:600 }}>{(c.votes || 0).toLocaleString()} <span style={{ color:"#aaa", fontWeight:400 }}>({pct.toFixed(1)}%)</span></span>
                        </div>
                        <div style={{ height:6, background:"#f0ece4", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`, background: i === 0 && ballotTotal > 0 ? "#006837" : "#b8dfc9", borderRadius:3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
