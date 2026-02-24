// ─── voter/VoterView.jsx ──────────────────────────────────────────────────────
// Top-level orchestrator for the Voter Portal module.
// Manages the voter state machine:
//   not authenticated → AuthScreen
//   authenticated, no election selected → ElectionPickerScreen
//   election selected, voting → BallotScreen
//   vote submitted → ReceiptScreen

import AuthScreen from "./AuthScreen.jsx";
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
  const activeElections = elections.filter(e => e.status === "active");

  // ── Reset the entire voter session (called from ReceiptScreen) ────────────
  function handleSessionReset() {
    setReceipt(null);
    setVoterAuth({ done: false, voter: null });
    setCurrentVoterElection(null);
    setBallotStep(0);
    setDraftVotes({});
  }

  // ── Pick an election to vote in ───────────────────────────────────────────
  function handlePickElection(el) {
    setCurrentVoterElection(el);
    setBallotStep(0);
    setDraftVotes({});
  }

  // ── State machine routing ─────────────────────────────────────────────────
  if (receipt) {
    return <ReceiptScreen receipt={receipt} onDone={handleSessionReset} isOnline={isOnline} />;
  }

  if (!voterAuth.done) {
    return (
      <AuthScreen
        elections={activeElections}
        onAuth={voter => setVoterAuth({ done: true, voter })}
      />
    );
  }

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
