// ─── App.jsx ──────────────────────────────────────────────────────────────────
// Root component. Owns all shared application state and wires the three
// top-level modules together.
//
// Import tree:
//   App.jsx
//   ├── Nav.jsx
//   ├── shared/styles.js
//   ├── shared/data.js
//   ├── shared/useOfflineSync.js       ← offline queue hook
//   ├── shared/ConnectivityBar.jsx     ← sticky connectivity status bar
//   ├── manager/ManagerView.jsx
//   │   ├── ElectionsTab.jsx
//   │   ├── CreateElectionTab.jsx
//   │   ├── ReportsTab.jsx
//   │   ├── AuditTab.jsx
//   │   └── SyncMonitorTab.jsx         ← offline queue monitor
//   ├── voter/VoterView.jsx
//   │   ├── AuthScreen.jsx
//   │   └── BallotScreens.jsx
//   └── results/ResultsView.jsx
//       ├── LiveTab.jsx
//       ├── PublishedTab.jsx
//       └── VerifyTab.jsx

import { useState } from "react";

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

  const [elections, setElections] = useState(INITIAL_ELECTIONS);
  const [voterAuth,            setVoterAuth]            = useState({ done: false, voter: null });
  const [currentVoterElection, setCurrentVoterElection] = useState(null);
  const [draftVotes,           setDraftVotes]           = useState({});
  const [hasVoted,             setHasVoted]             = useState({});
  const [receipt,              setReceipt]              = useState(null);
  const [ballotStep,           setBallotStep]           = useState(0);
  const [receipts,     setReceipts]     = useState([]);
  const [verifyCode,   setVerifyCode]   = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  // INEC-only mutations — silently blocked for other roles
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

  // Vote submission — immutably committed once cast
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
    await submitVote(newReceipt);
    commitVote(newReceipt); // lock with hash — immutable from this point
    setReceipts(prev => [...prev, newReceipt]);
    setReceipt(newReceipt);
    setHasVoted(prev => ({ ...prev, [el.id]: true }));
    setElections(prev => prev.map(e =>
      e.id === el.id
        ? { ...e, votes_cast: e.votes_cast + 1, turnout: parseFloat(((e.votes_cast + 1) / e.registered_voters * 100).toFixed(2)) }
        : e
    ));
  }

  function handleVerify(code) {
    const found = receipts.find(r => r.code === code.trim().toUpperCase());
    setVerifyResult(found ? { valid: true, receipt: found } : { valid: false });
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
            hasVoted={hasVoted}
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