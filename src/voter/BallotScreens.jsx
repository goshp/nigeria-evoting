// ─── voter/BallotScreens.jsx ──────────────────────────────────────────────────
// Contains three screens used after the voter has authenticated:
//
//   ElectionPickerScreen  – list of active elections; voter selects one to vote in
//   BallotScreen          – multi-step ballot (one step per ballot question) + review step
//   ReceiptScreen         – post-submission confirmation with encrypted receipt code

// ── ElectionPickerScreen ──────────────────────────────────────────────────────
// Shows all active elections. Marks elections the voter has already voted in.
export function ElectionPickerScreen({ elections, hasVoted, voter, onPick }) {
  return (
    <div className="vote-portal">
      <div className="vote-hero">
        <div className="vote-seal">🇳🇬</div>
        <h1>Your Ballot Portal</h1>
        <p>Authenticated as {voter.name} · Select an election to vote</p>
      </div>

      <div className="vote-step">
        {elections.length === 0 && (
          <div className="alert alert-info">
            <span>ℹ️</span> No active elections at this time.
          </div>
        )}

        {elections.map(el => (
          <div
            key={el.id}
            className="card mb-3"
            style={{ border: `2px solid ${hasVoted[el.id] ? "var(--gray-light)" : "var(--green)"}` }}
          >
            <div className="card-header">
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--green)", marginBottom: 4 }}>
                  {el.type} election
                </div>
                <div className="card-header-title">{el.title}</div>
              </div>
              {hasVoted[el.id]
                ? <span className="badge badge-closed">Voted ✓</span>
                : <span className="badge badge-active">Open</span>
              }
            </div>

            <div className="card-body">
              <div className="flex gap-3 mb-3" style={{ flexWrap: "wrap" }}>
                <span className="text-sm text-gray">📅 {el.date}</span>
                <span className="text-sm text-gray">⏰ {el.time_open}–{el.time_close}</span>
                <span className="text-sm text-gray">🗂 {el.ballots.length} ballot{el.ballots.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex gap-1" style={{ flexWrap: "wrap" }}>
                {el.ballots.map(b => <span key={b.id} className="chip">{b.title}</span>)}
              </div>
            </div>

            <div style={{ padding: "0.8rem 1.5rem", background: "#fafaf8", borderTop: "1px solid var(--gray-light)" }}>
              {hasVoted[el.id]
                ? <span className="text-sm text-gray">✅ You have already cast your vote in this election. Your receipt was issued.</span>
                : <button className="btn btn-primary" onClick={() => onPick(el)}>🗳️ Cast Your Vote</button>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BallotScreen ──────────────────────────────────────────────────────────────
// Walks the voter through each ballot question (one per step).
// Final step is a review screen before the encrypted submission.
export function BallotScreen({ el, voter, draftVotes, setDraftVotes, step, setStep, onSubmit, onBack, isOnline }) {
  const ballot  = el.ballots[step];
  const isLast  = step === el.ballots.length - 1;
  const isReview = step === el.ballots.length;
  const totalSteps = el.ballots.length + 1; // ballots + review

  function selectCandidate(ballotId, candidateId) {
    setDraftVotes(v => ({ ...v, [ballotId]: candidateId }));
  }

  return (
    <div className="vote-portal">
      <div className="vote-hero">
        <div className="vote-seal">🗳️</div>
        <h1>{el.title}</h1>
        <p>{voter.name} · {isReview ? "Review your selections" : `Ballot ${step + 1} of ${el.ballots.length}`}</p>
      </div>

      <div className="vote-step">
        {/* Progress bar */}
        <div className="vote-progress mb-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`vote-progress-step ${i < step ? "done" : i === step ? "active" : ""}`} />
          ))}
        </div>

        {/* ── Ballot question step ── */}
        {!isReview && ballot && (
          <div className="ballot">
            <div className="ballot-header">
              <div className="ballot-seal">🇳🇬</div>
              <h2>{ballot.title}</h2>
              <p>{ballot.description}</p>
            </div>
            <div className="ballot-instructions">
              <span>📋</span>
              <span>Vote for <strong>ONE</strong> candidate only. Your selection will be encrypted before submission.</span>
            </div>
            <div className="ballot-section">
              <div className="ballot-section-title">{el.date} · INEC Official Ballot</div>
              <div className="ballot-question">{ballot.title}</div>
              {ballot.candidates.map(c => (
                <div
                  key={c.id}
                  className={`candidate-option ${draftVotes[ballot.id] === c.id ? "selected" : ""}`}
                  onClick={() => selectCandidate(ballot.id, c.id)}
                >
                  <div className="candidate-avatar">{c.acronym}</div>
                  <div style={{ flex: 1 }}>
                    <div className="candidate-name">{c.name}</div>
                    <div className="candidate-party">{c.party}</div>
                  </div>
                  <div className="candidate-radio" />
                </div>
              ))}
            </div>
            <div className="ballot-footer">
              <button className="btn btn-secondary" onClick={onBack}>← Back</button>
              <button className="btn btn-primary" disabled={!draftVotes[ballot.id]} onClick={() => setStep(s => s + 1)}>
                {isLast ? "Review Votes" : "Next Ballot"} →
              </button>
            </div>
          </div>
        )}

        {/* ── Review step ── */}
        {isReview && (
          <div className="ballot">
            <div className="ballot-header">
              <div className="ballot-seal">✅</div>
              <h2>Review Your Votes</h2>
              <p>Verify your selections before final submission</p>
            </div>
            <div className="ballot-instructions">
              <span>🔒</span>
              <span>Once submitted, your votes are <strong>encrypted and final</strong>. You cannot change them.</span>
            </div>

            {/* Offline notice */}
            {!isOnline && (
              <div style={{ background: "#1a1500", borderBottom: "1px solid #c9a84c", padding: "0.8rem 1.5rem", display: "flex", alignItems: "center", gap: 10, fontSize: "0.82rem", color: "#f0c674" }}>
                <span>📵</span>
                <span>You are currently <strong>offline</strong>. Your vote will be stored securely on this device and automatically transmitted to the server when connectivity is restored. You will still receive your receipt code.</span>
              </div>
            )}

            {el.ballots.map((b, i) => {
              const chosen = b.candidates.find(c => c.id === draftVotes[b.id]);
              return (
                <div className="ballot-section" key={b.id}>
                  <div className="ballot-section-title">Ballot {i + 1}</div>
                  <div className="ballot-question" style={{ marginBottom: "0.5rem" }}>{b.title}</div>
                  {chosen
                    ? (
                      <div className="candidate-option selected">
                        <div className="candidate-avatar">{chosen.acronym}</div>
                        <div>
                          <div className="candidate-name">{chosen.name}</div>
                          <div className="candidate-party">{chosen.party}</div>
                        </div>
                        <span>✓</span>
                      </div>
                    )
                    : <div className="alert alert-warning"><span>⚠️</span>No candidate selected for this ballot.</div>
                  }
                </div>
              );
            })}

            <div className="ballot-footer">
              <button className="btn btn-secondary" onClick={() => setStep(0)}>← Revise</button>
              <button
                className="btn btn-primary btn-lg"
                onClick={onSubmit}
                disabled={el.ballots.some(b => !draftVotes[b.id])}
              >
                🗳️ Submit Encrypted Vote
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ReceiptScreen ──────────────────────────────────────────────────────────────
// Displayed after a successful vote submission. Shows the receipt code.
export function ReceiptScreen({ receipt, onDone, isOnline }) {
  return (
    <div className="vote-portal">
      <div className="vote-hero">
        <div className="vote-seal">✅</div>
        <h1>Vote Submitted Successfully</h1>
        <p>Your encrypted ballot has been securely recorded</p>
      </div>

      <div className="vote-step">
        <div className="receipt">
          <div className="receipt-icon">🧾</div>
          <div className="receipt-title">Official Voting Receipt</div>
          <p className="text-sm text-gray">Keep this receipt code to verify your vote after results are published.</p>
          <div className="receipt-code">{receipt.code}</div>
          <div className="text-sm text-gray mb-2">Election: <strong>{receipt.electionTitle}</strong></div>
          <div className="text-sm text-gray mb-2 text-mono">{new Date(receipt.timestamp).toLocaleString()}</div>
          <div className="divider" />

          {/* Offline sync note */}
          {!isOnline ? (
            <div style={{ background: "#fff3cd", border: "1px solid #f0c674", borderRadius: "var(--radius)", padding: "0.8rem 1rem", marginBottom: "1rem", fontSize: "0.8rem", color: "#6b4f00", display: "flex", gap: 8 }}>
              <span>📵</span>
              <span>Your vote is saved locally and will automatically sync to the central server once your connection is restored. No action needed.</span>
            </div>
          ) : (
            <div style={{ background: "#d4edda", border: "1px solid #c3e6cb", borderRadius: "var(--radius)", padding: "0.8rem 1rem", marginBottom: "1rem", fontSize: "0.8rem", color: "#155724", display: "flex", gap: 8 }}>
              <span>✅</span>
              <span>Your vote has been transmitted and confirmed by the central server.</span>
            </div>
          )}

          <div className="receipt-note">
            🔒 Your vote is encrypted and completely anonymous. Your receipt code links
            to your ballot without revealing your identity.<br /><br />
            You can verify your vote was counted by entering this code on the public Results page
            after the election concludes.
          </div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: "1.5rem" }} onClick={onDone}>
            ← Return to Portal
          </button>
        </div>
      </div>
    </div>
  );
}
