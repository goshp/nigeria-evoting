// ─── App.jsx ──────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";

import globalStyles                               from "./shared/styles.js";
import { INITIAL_ELECTIONS, generateReceiptCode } from "./shared/data.js";
import { useOfflineSync }                         from "./shared/useOfflineSync.js";
import ConnectivityBar                            from "./shared/ConnectivityBar.jsx";
import { AuthProvider, useAuth }                  from "./auth/AuthContext.jsx";
import LandingPage                                from "./auth/LandingPage.jsx";
import ProtectedRoute                             from "./auth/ProtectedRoute.jsx";

import Nav          from "./Nav.jsx";
import ManagerView  from "./manager/ManagerView.jsx";
import VoterView    from "./voter/VoterView.jsx";
import ResultsView  from "./results/ResultsView.jsx";

function AppInner() {
  const { user, isInec, isVoter, isGuest, commitVote } = useAuth();

  const defaultView = isInec ? "manager" : "voter";
  const [view, setView] = useState(defaultView);

  const { isOnline, syncStatus, queueStats, submitVote } = useOfflineSync();

  const [elections,            setElections]            = useState(INITIAL_ELECTIONS);
  const [voterAuth,            setVoterAuth]            = useState({ done: false, voter: null });
  const [currentVoterElection, setCurrentVoterElection] = useState(null);
  const [draftVotes,           setDraftVotes]           = useState({});
  const [receipt,              setReceipt]              = useState(null);
  const [ballotStep,           setBallotStep]           = useState(0);
  const [receipts,             setReceipts]             = useState([]);
  const [verifyCode,           setVerifyCode]           = useState("");
  const [verifyResult,         setVerifyResult]         = useState(null);

  // ── Fix 1: hasVoted keyed by "nin:electionId" not just electionId ────────────
  // Prevents one voter's vote from marking elections as voted for all other voters
  const [hasVoted, setHasVoted] = useState({});

  // Build a voter-scoped key
  const votedKey = (electionId) =>
    user?.nin ? `${user.nin}:${electionId}` : electionId;

  const didVote = (electionId) => !!hasVoted[votedKey(electionId)];

  // ── Reset voter session when user changes (logout/login as different voter) ──
  useEffect(() => {
    setVoterAuth({ done: false, voter: null });
    setCurrentVoterElection(null);
    setDraftVotes({});
    setReceipt(null);
    setBallotStep(0);
  }, [user?.nin]);

  // ── INEC-only mutations ───────────────────────────────────────────────────────
  function handleAddElection(newEl) {
    if (!isInec) return;
    setElections(prev => [...prev, { ...newEl, votes_cast: 0, turnout: 0 }]);
  }
  function handlePublish(id) {
    if (!isInec) return;
    setElections(prev => prev.map(e =>
      e.id === id && e.status === "draft" ? { ...e, status: "active" } : e
    ));
  }
  function handleClose(id) {
    if (!isInec) return;
    setElections(prev => prev.map(e =>
      e.id === id ? { ...e, status: "closed" } : e
    ));
  }

  // ── Fix 2: include hash in vote payload so Supabase column is populated ──────
  async function handleVoteSubmit() {
    if (!isVoter) return;
    const el   = currentVoterElection;
    const code = generateReceiptCode();

    const newReceipt = {
      code,
      electionId:    el.id,
      electionTitle: el.title,
      votes:         { ...draftVotes },
      timestamp:     new Date().toISOString(),
      voterNin:      user.nin ? user.nin.slice(-4).padStart(11, "*") : "ANON",
    };

    // Commit to immutable lock — returns the hash
    const hash = commitVote(newReceipt);

    // Include hash in the payload sent to Supabase
    const receiptWithHash = { ...newReceipt, hash };

    // Write to IndexedDB + POST to /api/votes
    await submitVote(receiptWithHash);

    // Update local state
    setReceipts(prev => [...prev, receiptWithHash]);
    setReceipt(receiptWithHash);

    // Key vote by "nin:electionId" so different voters are tracked independently
    setHasVoted(prev => ({ ...prev, [votedKey(el.id)]: true }));

    setElections(prev => prev.map(e =>
      e.id === el.id
        ? {
            ...e,
            votes_cast: e.votes_cast + 1,
            turnout: parseFloat(((e.votes_cast + 1) / e.registered_voters * 100).toFixed(2)),
          }
        : e
    ));
  }

  // ── Receipt verification — check Supabase first, fallback to local ────────────
  async function handleVerify(code) {
    const trimmed = code.trim().toUpperCase();

    // 1. Check local receipts first (instant)
    const local = receipts.find(r => r.code === trimmed);
    if (local) {
      setVerifyResult({ valid: true, receipt: local });
      return;
    }

    // 2. Check Supabase via GET /api/votes?code=
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
            hasVoted={hasVoted}                          didVote={didVote}
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
