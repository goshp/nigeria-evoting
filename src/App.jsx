// ─── App.jsx ──────────────────────────────────────────────────────────────────
// - Elections load from Supabase, poll every 10s
// - Active elections auto-close when date+time_close passes
// - Closed elections fetch live tallied results from /api/results
// - Once all elections are closed, everyone gets read-only access

import { useState, useEffect, useRef, useCallback } from "react";

import globalStyles                               from "./shared/styles.js";
import { generateReceiptCode }                    from "./shared/data.js";
import { useOfflineSync }                         from "./shared/useOfflineSync.js";
import ConnectivityBar                            from "./shared/ConnectivityBar.jsx";
import { AuthProvider, useAuth }                  from "./auth/AuthContext.jsx";
import LandingPage                                from "./auth/LandingPage.jsx";
import ProtectedRoute                             from "./auth/ProtectedRoute.jsx";

import Nav         from "./Nav.jsx";
import ManagerView from "./manager/ManagerView.jsx";
import VoterView   from "./voter/VoterView.jsx";
import ResultsView from "./results/ResultsView.jsx";

const POLL_INTERVAL = 10000; // 10 seconds

// ── Helpers ───────────────────────────────────────────────────────────────────

// Returns true if an active election's close time has passed
function isExpired(election) {
  if (election.status !== "active") return false;
  try {
    const closeStr = `${election.date}T${election.time_close}:00`;
    return new Date(closeStr) < new Date();
  } catch { return false; }
}

function AppInner() {
  const { user, isInec, isVoter, isGuest, commitVote, didVote, markVoted } = useAuth();

  const defaultView = isInec ? "manager" : "voter";
  const [view, setView] = useState(defaultView);

  const { isOnline, syncStatus, queueStats, submitVote } = useOfflineSync();

  // ── Elections from Supabase ───────────────────────────────────────────────────
  const [elections,         setElections]         = useState([]);
  const [electionsLoading,  setElectionsLoading]  = useState(true);
  const pollRef = useRef(null);

  // Auto-close any active election whose time has passed, then fetch tallied results
  const autoCloseExpired = useCallback(async (els) => {
    const expired = els.filter(isExpired);
    for (const el of expired) {
      await fetch(`/api/elections?id=${encodeURIComponent(el.id)}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: "closed" }),
      });
    }
    return expired.length > 0; // true = need a fresh fetch
  }, []);

  // Fetch live tallied results for all closed elections from /api/results
  const enrichWithResults = useCallback(async (els) => {
    const closed = els.filter(e => e.status === "closed");
    if (closed.length === 0) return els;

    const enriched = await Promise.all(
      closed.map(async (el) => {
        try {
          const res  = await fetch(`/api/results?electionId=${encodeURIComponent(el.id)}`);
          const data = await res.json();
          return res.ok ? data : el;
        } catch { return el; }
      })
    );

    const enrichedMap = Object.fromEntries(enriched.map(e => [e.id, e]));
    return els.map(e => enrichedMap[e.id] || e);
  }, []);

  const fetchElections = useCallback(async () => {
    try {
      const res  = await fetch("/api/elections");
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) return;

      // Auto-close any expired elections first
      const didClose = await autoCloseExpired(data);

      // If we closed something, do one more fetch to get updated statuses
      let latest = data;
      if (didClose) {
        const res2  = await fetch("/api/elections");
        const data2 = await res2.json();
        if (res2.ok && Array.isArray(data2)) latest = data2;
      }

      // Enrich closed elections with live tallied results
      const enriched = await enrichWithResults(latest);
      setElections(enriched);
    } catch (err) {
      console.warn("[elections] Fetch failed:", err.message);
    } finally {
      setElectionsLoading(false);
    }
  }, [autoCloseExpired, enrichWithResults]);

  useEffect(() => {
    fetchElections();
    pollRef.current = setInterval(fetchElections, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchElections]);

  // ── Global read-only lock ─────────────────────────────────────────────────────
  // True when there is at least one election AND every election is closed.
  // In this state no one can create, vote, or modify anything.
  const allClosed = elections.length > 0 && elections.every(e => e.status === "closed");
  const isReadOnly = allClosed; // extend with role checks if needed

  // ── Voter session ─────────────────────────────────────────────────────────────
  const [voterAuth,            setVoterAuth]            = useState({ done: false, voter: null });
  const [currentVoterElection, setCurrentVoterElection] = useState(null);
  const [draftVotes,           setDraftVotes]           = useState({});
  const [receipt,              setReceipt]              = useState(null);
  const [ballotStep,           setBallotStep]           = useState(0);
  const [receipts,             setReceipts]             = useState([]);
  const [verifyCode,           setVerifyCode]           = useState("");
  const [verifyResult,         setVerifyResult]         = useState(null);
  const [voteError,            setVoteError]            = useState(null);

  const prevNinRef = useRef(null);
  useEffect(() => {
    const currentNin = user?.nin ?? null;
    if (prevNinRef.current !== null && prevNinRef.current !== currentNin) {
      setVoterAuth({ done: false, voter: null });
      setCurrentVoterElection(null);
      setDraftVotes({});
      setReceipt(null);
      setBallotStep(0);
    }
    prevNinRef.current = currentNin;
  }, [user?.nin]);

  function didVoteForElection(electionId) { return didVote(electionId); }

  // ── INEC election management ──────────────────────────────────────────────────
  async function handleAddElection(newEl) {
    if (!isInec || isReadOnly) return;
    const res  = await fetch("/api/elections", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...newEl, created_by: user.staffId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save election");
    await fetchElections();
  }

  async function handlePublish(id) {
    if (!isInec || isReadOnly) return;
    await fetch(`/api/elections?id=${encodeURIComponent(id)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    await fetchElections();
  }

  async function handleClose(id) {
    if (!isInec) return;
    await fetch(`/api/elections?id=${encodeURIComponent(id)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    await fetchElections();
  }

  // ── Vote submission ───────────────────────────────────────────────────────────
  async function handleVoteSubmit() {
    if (!isVoter || !user?.nin || isReadOnly) return;
    const el = currentVoterElection;

    if (didVoteForElection(el.id)) {
      setVoteError("You have already voted in this election."); return;
    }

    setVoteError(null);
    const code        = generateReceiptCode();
    const newReceipt  = {
      code,
      electionId:    el.id,
      electionTitle: el.title,
      votes:         { ...draftVotes },
      timestamp:     new Date().toISOString(),
      voterNin:      user.nin.slice(-4).padStart(11, "*"),
    };

    const hash            = commitVote(newReceipt);
    const receiptWithHash = { ...newReceipt, hash };

    const res = await fetch("/api/votes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(receiptWithHash),
    });

    if (res.status === 409) {
      markVoted(user.nin, el.id);
      setVoteError("Your vote for this election has already been recorded."); return;
    }
    if (!res.ok) {
      setVoteError("Failed to submit vote — please check your connection and try again."); return;
    }

    markVoted(user.nin, el.id);
    setReceipts(prev => [...prev, receiptWithHash]);
    setReceipt(receiptWithHash);

    // Update votes_cast tally
    const current    = elections.find(e => e.id === el.id);
    const newCount   = (current?.votes_cast || 0) + 1;
    const newTurnout = current?.registered_voters
      ? parseFloat((newCount / current.registered_voters * 100).toFixed(2))
      : 0;
    await fetch(`/api/elections?id=${encodeURIComponent(el.id)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votes_cast: newCount, turnout: newTurnout }),
    });
    await fetchElections();
  }

  // ── Receipt verification ──────────────────────────────────────────────────────
  async function handleVerify(code) {
    const trimmed = code.trim().toUpperCase();
    const local   = receipts.find(r => r.code === trimmed);
    if (local) { setVerifyResult({ valid: true, receipt: local }); return; }
    try {
      const res  = await fetch(`/api/votes?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setVerifyResult(data.valid
        ? { valid: true, receipt: { code: data.receipt_code, electionTitle: data.election_title, timestamp: data.timestamp } }
        : { valid: false });
    } catch { setVerifyResult({ valid: false }); }
  }

  if (isGuest) return <LandingPage />;

  return (
    <div className="app">
      <style>{globalStyles}</style>
      <Nav view={view} setView={setView} isOnline={isOnline} queueStats={queueStats} />
      <ConnectivityBar isOnline={isOnline} syncStatus={syncStatus} queueStats={queueStats} />

      {/* Global read-only banner — shown to everyone when all elections are closed */}
      {isReadOnly && !electionsLoading && (
        <div style={{ background:"#004d29", color:"#fff", textAlign:"center", padding:"0.6rem 1rem", fontSize:"0.82rem", letterSpacing:"0.03em" }}>
          🔒 All elections have closed. Results are now officially published. This system is in read-only mode.
        </div>
      )}

      {electionsLoading && (
        <div style={{ textAlign:"center", padding:"3rem", color:"#666", fontFamily:"var(--font-sans)" }}>
          <div style={{ fontSize:"2rem", marginBottom:"0.75rem" }}>⏳</div>
          <div>Loading elections from INEC server…</div>
        </div>
      )}

      {!electionsLoading && (
        <>
          {view === "manager" && (
            <ProtectedRoute role="inec">
              <ManagerView
                elections={elections}
                onAddElection={handleAddElection}
                onPublish={handlePublish}
                onClose={handleClose}
                receipts={receipts}
                isOnline={isOnline}
                syncStatus={syncStatus}
                queueStats={queueStats}
                readOnly={isReadOnly}
              />
            </ProtectedRoute>
          )}

          {view === "voter" && (
            <ProtectedRoute role="voter">
              {isReadOnly
                ? (
                  // Voting is over — redirect voter straight to results
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", padding:"2rem", fontFamily:"var(--font-sans)" }}>
                    <div style={{ textAlign:"center", maxWidth:500 }}>
                      <div style={{ fontSize:"3.5rem", marginBottom:"1rem" }}>🗳️</div>
                      <h2 style={{ color:"#004d29", marginBottom:"0.5rem" }}>Voting Has Closed</h2>
                      <p style={{ color:"#666", lineHeight:1.7, marginBottom:"1.5rem" }}>
                        All elections have ended. Official results are now published.
                      </p>
                      <button className="btn btn-primary" onClick={() => setView("results")}>
                        📊 View Official Results →
                      </button>
                    </div>
                  </div>
                )
                : (
                  <VoterView
                    elections={elections}
                    voterAuth={voterAuth}                        setVoterAuth={setVoterAuth}
                    currentVoterElection={currentVoterElection}  setCurrentVoterElection={setCurrentVoterElection}
                    draftVotes={draftVotes}                      setDraftVotes={setDraftVotes}
                    didVote={didVoteForElection}
                    receipt={receipt}                            setReceipt={setReceipt}
                    ballotStep={ballotStep}                      setBallotStep={setBallotStep}
                    onVoteSubmit={handleVoteSubmit}
                    voteError={voteError}                        setVoteError={setVoteError}
                    isOnline={isOnline}
                  />
                )
              }
            </ProtectedRoute>
          )}

          {view === "results" && (
            <ResultsView
              elections={elections}
              verifyCode={verifyCode}      setVerifyCode={setVerifyCode}
              verifyResult={verifyResult}  onVerify={handleVerify}
              readOnly={true}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
