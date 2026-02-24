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

import globalStyles                              from "./shared/styles.js";
import { INITIAL_ELECTIONS, generateReceiptCode } from "./shared/data.js";
import { useOfflineSync }                        from "./shared/useOfflineSync.js";
import ConnectivityBar                           from "./shared/ConnectivityBar.jsx";

import Nav          from "./Nav.jsx";
import ManagerView  from "./manager/ManagerView.jsx";
import VoterView    from "./voter/VoterView.jsx";
import ResultsView  from "./results/ResultsView.jsx";

export default function App() {
  // ── Module routing ────────────────────────────────────────────────────────
  const [view, setView] = useState("manager");

  // ── Offline sync engine ───────────────────────────────────────────────────
  // submitVote writes to IndexedDB first, then attempts server sync.
  // If offline, vote stays queued and auto-syncs when connectivity returns.
  const { isOnline, syncStatus, queueStats, submitVote } = useOfflineSync();

  // ── Elections state ───────────────────────────────────────────────────────
  const [elections, setElections] = useState(INITIAL_ELECTIONS);

  // ── Voter session state ───────────────────────────────────────────────────
  const [voterAuth,            setVoterAuth]            = useState({ done: false, voter: null });
  const [currentVoterElection, setCurrentVoterElection] = useState(null);
  const [draftVotes,           setDraftVotes]           = useState({});
  const [hasVoted,             setHasVoted]             = useState({});
  const [receipt,              setReceipt]              = useState(null);
  const [ballotStep,           setBallotStep]           = useState(0);

  // ── Results / verify state ────────────────────────────────────────────────
  const [receipts,     setReceipts]     = useState([]);
  const [verifyCode,   setVerifyCode]   = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  // ── Election Manager actions ──────────────────────────────────────────────
  function handleAddElection(newEl) {
    setElections(prev => [...prev, { ...newEl, votes_cast: 0, turnout: 0 }]);
  }

  function handlePublish(id) {
    setElections(prev => prev.map(e =>
      e.id === id && e.status === "draft" ? { ...e, status: "active" } : e
    ));
  }

  function handleClose(id) {
    setElections(prev => prev.map(e =>
      e.id === id ? { ...e, status: "closed" } : e
    ));
  }

  // ── Voter Portal actions ──────────────────────────────────────────────────
  async function handleVoteSubmit() {
    const el   = currentVoterElection;
    const code = generateReceiptCode();

    const newReceipt = {
      code,
      electionId:    el.id,
      electionTitle: el.title,
      votes:         { ...draftVotes },
      timestamp:     new Date().toISOString(),
    };

    // Always write to IndexedDB first — guaranteed local persistence.
    // Sync engine handles transmission to server (now or when back online).
    await submitVote(newReceipt);

    // Update in-memory state for immediate UI feedback
    setReceipts(prev => [...prev, newReceipt]);
    setReceipt(newReceipt);
    setHasVoted(prev => ({ ...prev, [el.id]: true }));
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

  // ── Results actions ───────────────────────────────────────────────────────
  function handleVerify(code) {
    const found = receipts.find(r => r.code === code.trim().toUpperCase());
    setVerifyResult(found ? { valid: true, receipt: found } : { valid: false });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <style>{globalStyles}</style>

      <Nav view={view} setView={setView} isOnline={isOnline} queueStats={queueStats} />

      {/* Sticky connectivity / sync status bar */}
      <ConnectivityBar isOnline={isOnline} syncStatus={syncStatus} queueStats={queueStats} />

      {view === "manager" && (
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
      )}

      {view === "voter" && (
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
      )}

      {view === "results" && (
        <ResultsView
          elections={elections}
          verifyCode={verifyCode}      setVerifyCode={setVerifyCode}
          verifyResult={verifyResult}  onVerify={handleVerify}
        />
      )}
    </div>
  );
}
