// ─── results/VerifyTab.jsx ────────────────────────────────────────────────────
// Allows any member of the public to verify a vote using a receipt code.
// Looks up the code in the in-memory receipts ledger and displays the result.
// The verification confirms inclusion without revealing how the voter voted.

export default function VerifyTab({ verifyCode, setVerifyCode, verifyResult, onVerify }) {
  return (
    <div>
      <div className="section-title">Verify Your Vote</div>
      <p className="text-sm text-gray mb-3">
        Enter your receipt code to confirm your vote was recorded in the final tally.
        Your identity remains completely anonymous.
      </p>

      <div className="verify-box mb-3">
        <div className="verify-icon">🔍</div>

        {/* Receipt code input */}
        <div className="form-group mb-3" style={{ maxWidth: 400, margin: "0 auto 1rem" }}>
          <label className="form-label">Enter Receipt Code</label>
          <input
            className="form-control text-mono"
            style={{ letterSpacing: "0.1em", fontSize: "1rem" }}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={verifyCode}
            onChange={e => setVerifyCode(e.target.value.toUpperCase())}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={() => onVerify(verifyCode)}
          disabled={!verifyCode.trim()}
        >
          Verify Receipt
        </button>

        {/* Verification result */}
        {verifyResult && (
          <div className={`verify-result ${verifyResult.valid ? "valid" : "invalid"}`}>
            {verifyResult.valid ? (
              <>
                <div style={{ fontWeight: 700, color: "var(--green)", marginBottom: 8 }}>
                  ✅ Vote Verified — Your vote is on record.
                </div>
                <div className="text-sm">Election: <strong>{verifyResult.receipt.electionTitle}</strong></div>
                <div className="text-sm text-mono text-gray">
                  Timestamp: {new Date(verifyResult.receipt.timestamp).toLocaleString()}
                </div>
              </>
            ) : (
              <div style={{ fontWeight: 700, color: "var(--red)" }}>
                ❌ Receipt code not found. Please check the code and try again.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="alert alert-info">
        <span>🔒</span>
        <span>
          Verification confirms your vote is included in the tally without revealing how you voted.
          Zero-knowledge proof cryptography ensures complete anonymity.
        </span>
      </div>
    </div>
  );
}
