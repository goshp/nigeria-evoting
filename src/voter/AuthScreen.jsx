// ─── voter/AuthScreen.jsx ─────────────────────────────────────────────────────
// Voter authentication gate. Supports two authentication flows:
//   1. NIN + OTP  – Enter 11-digit NIN → receive & enter 6-digit SMS OTP
//   2. Biometric  – Fingerprint scanner animation → auto-authenticate
// On success, calls onAuth(voter) to advance the voter portal state machine.

import { useState } from "react";

export default function AuthScreen({ onAuth, elections }) {
  const [method,   setMethod]   = useState("nin");   // "nin" | "biometric"
  const [phase,    setPhase]    = useState("nin");   // "nin" | "otp" | "biometric"
  const [nin,      setNin]      = useState("");
  const [otp,      setOtp]      = useState(["", "", "", "", "", ""]);
  const [scanning, setScanning] = useState(false);
  const [error,    setError]    = useState("");

  // ── NIN submission ────────────────────────────────────────────────────────
  function handleNinSubmit() {
    if (nin.length !== 11) { setError("NIN must be exactly 11 digits."); return; }
    setError("");
    setPhase("otp");
  }

  // ── OTP input ─────────────────────────────────────────────────────────────
  function handleOtpChange(i, val) {
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
  }

  function handleOtpSubmit() {
    if (otp.join("").length !== 6) { setError("Enter the 6-digit OTP."); return; }
    setError("");
    onAuth({ nin, name: "Voter #" + nin.slice(-4) });
  }

  // ── Biometric ─────────────────────────────────────────────────────────────
  function handleScan() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      onAuth({ nin: "00000000000", name: "Biometric Voter" });
    }, 3500);
  }

  // ── No active elections guard ──────────────────────────────────────────────
  if (elections.length === 0) {
    return (
      <div className="auth-screen">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "0.5rem" }}>No Active Elections</h2>
          <p className="text-sm text-gray">There are no active elections at this time. Please check back later or contact INEC.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🇳🇬</div>
          <h2>Voter Authentication</h2>
          <p>Secure access to your ballot · INEC eVoting</p>
        </div>

        {/* Method toggle */}
        <div className="auth-method mb-3">
          {[["nin", "🪪 NIN + OTP"], ["biometric", "👆 Biometric"]].map(([k, l]) => (
            <button
              key={k}
              className={`auth-method-btn ${method === k ? "active" : ""}`}
              onClick={() => { setMethod(k); setPhase(k === "nin" ? "nin" : "biometric"); setError(""); }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Error alert */}
        {error && (
          <div className="alert alert-error mb-2"><span>⚠️</span>{error}</div>
        )}

        {/* ── NIN phase ── */}
        {method === "nin" && phase === "nin" && (
          <>
            <div className="form-group mb-3">
              <label className="form-label">National Identification Number (NIN)</label>
              <input
                className="form-control"
                placeholder="Enter 11-digit NIN"
                maxLength={11}
                value={nin}
                onChange={e => setNin(e.target.value.replace(/\D/g, ""))}
              />
              <div className="text-sm text-gray mt-1">Your NIN appears on your National ID card or NIMC slip.</div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleNinSubmit}>
              Verify NIN →
            </button>
          </>
        )}

        {/* ── OTP phase ── */}
        {method === "nin" && phase === "otp" && (
          <>
            <div className="alert alert-success mb-3">
              <span>✓</span> NIN verified. An OTP has been sent to your registered number (***** **34).
            </div>
            <div className="form-label text-center mb-1">Enter 6-Digit OTP</div>
            <div className="otp-inputs mb-3">
              {otp.map((v, i) => (
                <input key={i} className="otp-input" maxLength={1} value={v} onChange={e => handleOtpChange(i, e.target.value)} />
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleOtpSubmit}>
              Authenticate & Access Ballot
            </button>
            <div className="text-center mt-2">
              <span className="text-sm text-gray" style={{ cursor: "pointer", textDecoration: "underline" }}>Resend OTP</span>
            </div>
          </>
        )}

        {/* ── Biometric phase ── */}
        {method === "biometric" && (
          <>
            <p className="text-sm text-gray text-center mb-2">
              Place your thumb on the fingerprint scanner to authenticate.
            </p>
            <div className={`fingerprint-area ${scanning ? "scanning" : ""}`} onClick={handleScan}>
              {scanning ? "⏳" : "👆"}
            </div>
            <p className="text-sm text-center" style={{ color: scanning ? "var(--gold)" : "var(--gray)" }}>
              {scanning ? "Scanning… please hold still" : "Tap to scan your fingerprint"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
