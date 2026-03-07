// ─── voter/VoterView.jsx ──────────────────────────────────────────────────────
import { useEffect } from "react";
import { useAuth }   from "../auth/AuthContext.jsx";
import { ElectionPickerScreen, BallotScreen, ReceiptScreen } from "./BallotScreens.jsx";

export default function VoterView({
  elections,
  voterAuth, setVoterAuth,
  currentVoterElection, setCurrentVoterElection,
  draftVotes, setDraftVotes,
  didVote,
  receipt, setReceipt,
  ballotStep, setBallotStep,
  onVoteSubmit,
  voteError, setVoteError,
  isOnline,
}) {
  const { user } = useAuth();

  // Auto-populate from global auth — runs once when user is available
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
  }

  function handlePickElection(el) {
    setCurrentVoterElection(el);
    setBallotStep(0);
    setDraftVotes({});
  }

  if (receipt) {
    return <ReceiptScreen receipt={receipt} onDone={handleSessionReset} isOnline={isOnline} />;
  }

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

  if (activeElections.length === 0) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", padding:"2rem", fontFamily:"var(--font-sans)" }}>
        <div style={{ textAlign:"center", maxWidth:500 }}>
          <div style={{ fontSize:"3.5rem", marginBottom:"1rem" }}>🗳️</div>
          <h2 style={{ color:"#004d29", marginBottom:"0.5rem", fontSize:"1.4rem" }}>No Active Elections</h2>
          <p style={{ color:"#666", lineHeight:1.7, marginBottom:"1.5rem" }}>
            Welcome, <strong>{user?.name}</strong>. There are no elections currently open for voting.
            INEC will publish an election when voting is ready to begin.
          </p>
          <div style={{ background:"#f0f9f4", border:"1px solid #b8dfc9", borderRadius:"12px", padding:"1.1rem 1.3rem", fontSize:"0.85rem", color:"#444", textAlign:"left" }}>
            <div style={{ fontWeight:700, color:"#004d29", marginBottom:"0.6rem" }}>Your Voter Registration</div>
            <div style={{ marginBottom:"0.3rem" }}>🪪 NIN: <strong>{user?.nin}</strong></div>
            <div style={{ marginBottom:"0.3rem" }}>📍 State: <strong>{user?.state}</strong> · LGA: <strong>{user?.lga}</strong></div>
            <div>🏠 Ward: <strong>{user?.ward}</strong> · Polling Unit: <strong>{user?.pollingUnit}</strong></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentVoterElection) {
    return (
      <ElectionPickerScreen
        elections={activeElections}
        didVote={didVote}
        voter={voterAuth.voter}
        onPick={handlePickElection}
      />
    );
  }

  return (
    <BallotScreen
      el={currentVoterElection}
      voter={voterAuth.voter}
      didVote={didVote}
      draftVotes={draftVotes}
      setDraftVotes={setDraftVotes}
      step={ballotStep}
      setStep={setBallotStep}
      onSubmit={onVoteSubmit}
      onBack={() => setCurrentVoterElection(null)}
      isOnline={isOnline}
      voteError={voteError}
      setVoteError={setVoteError}
    />
  );
}
