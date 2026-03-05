// ─── App.jsx ──────────────────────────────────────────────────────────────────
// Elections now load from Supabase and poll every 10 seconds.
// All browsers share the same election state.

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

function AppInner() {
  const { user, isInec, isVoter, isGuest, commitVote, didVote, markVoted } = useAuth();

  const defaultView = isInec ? "manager" : "voter";
  const [view, setView] = useState(defaultView);

  const { isOnline, syncStatus, queueStats, submitVote } = useOfflineSync();

  // ── Elections — loaded from Supabase, polled every 10s ───────────────────────
  const [elections,    setElections]    = useState([]);
  const [electionsLoading, setElectionsLoading] = useState(true);
  const pollRef = useRef(null);

  const fetchElections = useCallback(async () => {
    try {
      const res  = await fetch("/api/elections");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setElections(data);
      }
    } catch (err) {
      console.warn("[elections] Fetch failed:", err.message);
    } finally {
      setElectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchElections();
    pollRef.current = setInterval(fetchElections, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchElections]);

  // ── Voter session state ───────────────────────────────────────────────────────
  const [voterAuth,            setVoterAuth]            = useState({ done: false, voter: null });
  const [currentVoterElection, setCurrentVoterElection] = useState(null);
  const [draftVotes,           setDraftVotes]           = useState({});
  const [receipt,              setReceipt]              = useState(null);
  const [ballotStep,           setBallotStep]           = useState(0);
  const [receipts,             setReceipts]             = useState([]);
  const [verifyCode,           setVerifyCode]           = useState("");
  const [verifyResult,         setVerifyResult]         = useState(null);

  // Reset voter session when user changes
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

  function didVoteForElection(electionId) {
    return didVote(electionId);
  }

  // ── INEC election management — POST/PATCH to Supabase via API ────────────────
  async function handleAddElection(newEl) {
    if (!isInec) return;
    try {
      const res  = await fetch("/api/elections", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...newEl, created_by: user.staffId }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchElections(); // refresh immediately
      } else {
        console.error("Create election failed:", data.error);
      }
    } catch (err) {
      console.error("Create election error:", err.message);
    }
  }

  async function handlePublish(id) {
    if (!isInec) return;
    try {
      await fetch(`/api/elections?id=${encodeURIComponent(id)}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: "active" }),
      });
      await fetchElections();
    } catch (err) {
      console.error("Publish error:", err.message);
    }
  }

  async function handleClose(id) {
    if (!isInec) return;
    try {
      await fetch(`/api/elections?id=${encodeURIComponent(id)}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: "closed" }),
      });
      await fetchElections();
    } catch (err) {
      console.error("Close error:", err.message);
    }
  }

  // ── Vote submission ───────────────────────────────────────────────────────────
  async function handleVoteSubmit() {
    if (!isVoter || !user?.nin) return;
    const el   = currentVoterElection;
    const code = generateReceiptCode();

    const newReceipt = {
      code,
      electionId:    el.id,
      electionTitle: el.title,
      votes:         { ...draftVotes },
      timestamp:     new Date().toISOString(),
      voterNin:      user.nin.slice(-4).padStart(11, "*"),
    };

    const hash            = commitVote(newReceipt);
    const receiptWithHash = { ...newReceipt, hash };

    await submitVote(receiptWithHash);
    markVoted(user.nin, el.id);

    setReceipts(prev => [...prev, receiptWithHash]);
    setReceipt(receiptWithHash);

    // Update votes_cast in Supabase
    const current = elections.find(e => e.id === el.id);
    if (current) {
      const newCount = (current.votes_cast || 0) + 1;
      const newTurnout = parseFloat((newCount / current.registered_voters * 100).toFixed(2));
      await fetch(`/api/elections?id=${encodeURIComponent(el.id)}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ votes_cast: newCount, turnout: newTurnout }),
      });
      await fetchElections();
    }
  }

  // ── Receipt verification ──────────────────────────────────────────────────────
  async function handleVerify(code) {
    const trimmed = code.trim().toUpperCase();
    const local   = receipts.find(r => r.code === trimmed);
    if (local) { setVerifyResult({ valid: true, receipt: local }); return; }

    try {
      const res  = await fetch(`/api/votes?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (data.valid) {
        setVerifyResult({ valid: true, receipt: { code: data.receipt_code, electionTitle: data.election_title, timestamp: data.timestamp } });
      } else {
        setVerifyResult({ valid: false });
      }
    } catch {
      setVerifyResult({ valid: false });
    }
  }

  if (isGuest) return <LandingPage />;

  return (
    <div className="app">
      <style>{globalStyles}</style>
      <Nav view={view} setView={setView} isOnline={isOnline} queueStats={queueStats} />
      <ConnectivityBar isOnline={isOnline} syncStatus={syncStatus} queueStats={queueStats} />

      {electionsLoading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#666", fontFamily: "var(--font-sans)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⏳</div>
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
              />
            </ProtectedRoute>
          )}

          {view === "voter" && (
            <ProtectedRoute role="voter">
              <VoterView
                elections={elections}
                voterAuth={voterAuth}                        setVoterAuth={setVoterAuth}
                currentVoterElection={currentVoterElection}  setCurrentVoterElection={setCurrentVoterElection}
                draftVotes={draftVotes}                      setDraftVotes={setDraftVotes}
                didVote={didVoteForElection}
                receipt={receipt}                            setReceipt={setReceipt}
                ballotStep={ballotStep}                      setBallotStep={setBallotStep}
                onVoteSubmit={handleVoteSubmit}
                isOnline={isOnline}
              />
            </ProtectedRoute>
          )}

          {view === "results" && (
            <ResultsView
              elections={elections}
              verifyCode={verifyCode}      setVerifyCode={setVerifyCode}
              verifyResult={verifyResult}  onVerify={handleVerify}
              readOnly={!isInec}
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
