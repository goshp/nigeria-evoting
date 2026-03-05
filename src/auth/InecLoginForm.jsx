// ─── auth/InecLoginForm.jsx ───────────────────────────────────────────────────
// Staff ID + Password login form for INEC officials.
// Demo credentials: INEC-001 / Admin1234

import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";

export default function InecLoginForm() {
  const { loginInec, authError, setAuthError } = useAuth();
  const [staffId,  setStaffId]  = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  async function handleSubmit() {
    if (!staffId.trim() || !password) {
      setAuthError("Please enter both Staff ID and password.");
      return;
    }
    setLoading(true);
    // Simulate 600ms auth round-trip
    await new Promise(r => setTimeout(r, 600));
    loginInec(staffId.trim().toUpperCase(), password);
    setLoading(false);
  }

  return (
    <div style={formWrap}>
      <p style={hint}>
        Demo credentials: <strong>INEC-001</strong> / <strong>Admin1234</strong>
      </p>

      {authError && <div style={errorBox}><span>⚠️</span> {authError}</div>}

      <label style={labelStyle}>Staff ID</label>
      <input
        style={inputStyle}
        placeholder="e.g. INEC-001"
        value={staffId}
        onChange={e => { setAuthError(null); setStaffId(e.target.value); }}
        onKeyDown={e => e.key === "Enter" && handleSubmit()}
        autoFocus
      />

      <label style={labelStyle}>Password</label>
      <div style={{ position: "relative" }}>
        <input
          style={{ ...inputStyle, paddingRight: "3rem" }}
          type={showPw ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={e => { setAuthError(null); setPassword(e.target.value); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
        />
        <button
          onClick={() => setShowPw(p => !p)}
          style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}
        >{showPw ? "🙈" : "👁️"}</button>
      </div>

      <button
        style={submitBtn(loading)}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Verifying…" : "🏛️  Sign In as INEC Official"}
      </button>

      <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#888", marginTop: "1rem" }}>
        Authorised INEC staff only. All access is logged and audited.
      </p>
    </div>
  );
}

const formWrap  = { padding: "1.8rem 2rem 2rem" };
const hint      = { background: "#e8f5ee", border: "1px solid #c3e6cb", borderRadius: "8px", padding: "0.6rem 0.9rem", fontSize: "0.8rem", color: "#155724", marginBottom: "1.2rem" };
const errorBox  = { background: "#fff3cd", border: "1px solid #f0c674", borderRadius: "8px", padding: "0.6rem 0.9rem", fontSize: "0.82rem", color: "#6b4f00", marginBottom: "1rem", display: "flex", gap: "0.5rem" };
const labelStyle = { display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#333", marginBottom: "0.35rem", marginTop: "1rem" };
const inputStyle = {
  width: "100%", boxSizing: "border-box",
  border: "1.5px solid #ddd", borderRadius: "8px",
  padding: "0.65rem 0.9rem", fontSize: "0.92rem",
  outline: "none", fontFamily: "inherit",
};
const submitBtn = (loading) => ({
  width: "100%", marginTop: "1.5rem",
  background: loading ? "#aaa" : "linear-gradient(135deg, #004d29, #006837)",
  color: "#fff", border: "none", borderRadius: "10px",
  padding: "0.85rem", fontSize: "0.95rem", fontWeight: 700,
  cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.02em",
});
