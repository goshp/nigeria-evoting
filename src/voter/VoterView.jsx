// ─── voter/VoterView.jsx ──────────────────────────────────────────────────────
// Voter Portal state machine.
// Auth gate removed — voter identity comes directly from global AuthContext.
// The voter is already authenticated before reaching this component.

import { useEffect } from "react";
import { useAuth }   from "../auth/AuthContext.jsx";
import { ElectionPickerScreen, BallotScreen, ReceiptScreen } from "./BallotScreens.jsx";

export default function VoterView({
  elections,
  voterAuth, setVoterAuth,
  currentVoterElection, setCurrentVoterElection,
  draftVotes, setDraftVotes,
  hasVoted,
  receipt, setReceipt,
  ballotStep, setBallotStep,
  onVoteSubmit,
  isOnline,
}) {
  const { user } = useAuth();

  // Auto-populate voterAuth from the globally logged-in user.
  // This replaces the old internal AuthScreen entirely.
  useEffect(() => {
    if (user?.role === "voter" && !voterAuth.done) {
      setVoterAuth({
        done:  true,
        voter: {
          nin:         user.nin,
          name:        user.name,
          state:       user.state,
          lga:         user.lga,
          ward:        user.ward,
          pollingUnit: user.pollingUnit,
        },
      });
    }
  }, [user, voterAuth.done, setVoterAuth]);

  const activeElections = elections.filter(e => e.status === "active");

  function handleSessionReset() {
    setReceipt(null);
    setCurrentVoterElection(null);
    setBallotStep(0);
    setDraftVotes({});
    // voterAuth stays — voter remains logged in, just resets the ballot session
  }

  function handlePickElection(el) {
    setCurrentVoterElection(el);
    setBallotStep(0);
    setDraftVotes({});
  }

  // ── Receipt screen ─────────────────────────────────────────────────────────
  if (receipt) {
    return <ReceiptScreen receipt={receipt} onDone={handleSessionReset} isOnline={isOnline} />;
  }

  // ── Brief loading tick while useEffect fires ───────────────────────────────
  if (!voterAuth.done) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
        <div style={{ textAlign:"center", color:"#666", fontFamily:"var(--font-sans)" }}>
          <div style={{ fontSize:"2rem", marginBottom:"0.75rem" }}>⏳</div>
          <div>Loading your voter profile…</div>
        </div>
      </div>
    );
  }

  // ── No active elections ────────────────────────────────────────────────────
  if (activeElections.length === 0) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", padding:"2rem", fontFamily:"var(--font-sans)" }}>
        <div style={{ textAlign:"center", maxWidth:500 }}>
          <div style={{ fontSize:"3.5rem", marginBottom:"1rem" }}>🗳️</div>
          <h2 style={{ color:"#004d29", marginBottom:"0.5rem", fontSize:"1.4rem" }}>
            No Active Elections
          </h2>
          <p style={{ color:"#666", lineHeight:1.7, marginBottom:"1.5rem" }}>
            Welcome, <strong>{user?.name}</strong>. There are no elections currently open for voting.
            INEC will publish an election when voting is ready to begin.
          </p>
          <div style={{ background:"#f0f9f4", border:"1px solid #b8dfc9", borderRadius:"12px", padding:"1.1rem 1.3rem", fontSize:"0.85rem", color:"#444", textAlign:"left" }}>
            <div style={{ fontWeight:700, color:"#004d29", marginBottom:"0.6rem" }}>Your Voter Registration</div>
            <div style={{ marginBottom:"0.3rem" }}>🪪 NIN: <strong>{user?.nin}</strong></div>
            <div style={{ marginBottom:"0.3rem" }}>📍 State: <strong>{user?.state}</strong> &nbsp;·&nbsp; LGA: <strong>{user?.lga}</strong></div>
            <div>🏠 Ward: <strong>{user?.ward}</strong> &nbsp;·&nbsp; Polling Unit: <strong>{user?.pollingUnit}</strong></div>
          </div>
          <p style={{ marginTop:"1.2rem", fontSize:"0.8rem", color:"#aaa" }}>
            Check back here after INEC publishes an election, or contact your LGA office.
          </p>
        </div>
      </div>
    );
  }

  // ── Election picker ────────────────────────────────────────────────────────
  if (!currentVoterElection) {
    return (
      <ElectionPickerScreen
        elections={activeElections}
        hasVoted={hasVoted}
        voter={voterAuth.voter}
        onPick={handlePickElection}
      />
    );
  }

  // ── Ballot ─────────────────────────────────────────────────────────────────
  return (
    <BallotScreen
      el={currentVoterElection}
      voter={voterAuth.voter}
      hasVoted={hasVoted}
      draftVotes={draftVotes}
      setDraftVotes={setDraftVotes}
      step={ballotStep}
      setStep={setBallotStep}
      onSubmit={onVoteSubmit}
      onBack={() => setCurrentVoterElection(null)}
      isOnline={isOnline}
    />
  );
}
