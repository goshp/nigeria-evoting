// ─── auth/VoterAuthForm.jsx ───────────────────────────────────────────────────
// Voter Login + Account Activation form.
//
// Login:      NIN + Password (activated accounts only)
// Activation: Step 1 — enter NIN → system checks INEC roll
//             Step 2 — NIN found & pending → choose password → activated
//
// Unauthorised NIns (not on roll) → error + LGA office guidance
// Already active NIns on register tab → redirect to log in

import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";

export default function VoterAuthForm() {
  const { setAuthError } = useAuth();
  const [tab, setTab] = useState("login");

  return (
    <div>
      <div style={{ display: "flex", borderBottom: "2px solid #eee" }}>
        {[["login", "Log In"], ["register", "Activate Account"]].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setAuthError(null); }} style={{
            flex: 1, padding: "0.9rem", border: "none", background: "none",
            fontWeight: tab === key ? 700 : 400,
            color: tab === key ? "#004d29" : "#888",
            borderBottom: tab === key ? "3px solid #006837" : "3px solid transparent",
            cursor: "pointer", fontSize: "0.9rem", fontFamily: "inherit",
          }}>{label}</button>
        ))}
      </div>
      {tab === "login"    && <LoginTab />}
      {tab === "register" && <ActivateTab />}
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginTab() {
  const { loginVoter, authError, setAuthError } = useAuth();
  const [nin, setNin]         = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  async function handleLogin() {
    if (!nin.trim() || !password) { setAuthError("Please enter your NIN and password."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    loginVoter(nin.trim(), password);
    setLoading(false);
  }

  return (
    <div style={wrap}>
      <p style={hintBox}>Demo: NIN <strong>12345678901</strong> / Password <strong>Voter1234</strong></p>
      {authError && <ErrBox msg={authError} />}
      <Field label="National Identification Number (NIN)" value={nin} maxLength={11}
        onChange={v => { setAuthError(null); setNin(v); }} placeholder="11-digit NIN" onEnter={handleLogin} autoFocus />
      <label style={lbl}>Password</label>
      <div style={{ position: "relative" }}>
        <input style={{ ...inp, paddingRight: "3rem" }} type={showPw ? "text" : "password"}
          placeholder="Your password" value={password}
          onChange={e => { setAuthError(null); setPassword(e.target.value); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()} />
        <EyeBtn show={showPw} toggle={() => setShowPw(p => !p)} />
      </div>
      <Btn loading={loading} onClick={handleLogin} label="🗳️  Log In to Vote" />
    </div>
  );
}

// ── Activation — 2-step ───────────────────────────────────────────────────────
function ActivateTab() {
  const { activateVoter, lookupVoterNin, authError, setAuthError } = useAuth();
  const [step,     setStep]    = useState(1);
  const [nin,      setNin]     = useState("");
  const [voterName,setVoterName]= useState("");
  const [password, setPassword]= useState("");
  const [confirm,  setConfirm] = useState("");
  const [loading,  setLoading] = useState(false);
  const [showPw,   setShowPw]  = useState(false);

  // Step 1 — NIN lookup
  async function handleLookup() {
    setAuthError(null);
    if (!/^\d{11}$/.test(nin.trim())) {
      setAuthError("NIN must be exactly 11 digits with no spaces or dashes."); return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const result = lookupVoterNin(nin.trim());
    setLoading(false);

    if (result.status === "not_found") return; // authError already set
    if (result.status === "active")    return; // authError already set
    if (result.status === "pending") {
      setVoterName(result.name);
      setStep(2);
    }
  }

  // Step 2 — set password
  async function handleActivate() {
    setAuthError(null);
    if (!password) { setAuthError("Please choose a password."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    activateVoter(nin.trim(), password, confirm);
    setLoading(false);
  }

  return (
    <div style={wrap}>
      <div style={{ ...hintBox, background: "#e8f5ee", border: "1px solid #c3e6cb", color: "#155724" }}>
        <strong>First time?</strong> Your NIN must be on the INEC register. If it is, you simply choose a password once to activate your portal access.
      </div>

      {authError && <ActivationError msg={authError} />}

      {/* ── Step 1: NIN ── */}
      {step === 1 && (
        <>
          <Field label="National Identification Number (NIN)" value={nin} maxLength={11}
            onChange={v => { setAuthError(null); setNin(v); }}
            placeholder="Your 11-digit NIN" onEnter={handleLookup} autoFocus />
          <div style={{ fontSize: "0.75rem", color: "#888", margin: "0.3rem 0 0.6rem" }}>
            Found on your National Identity Card or NIMC slip.
          </div>
          <Btn loading={loading} onClick={handleLookup}
            label={loading ? "Checking register…" : "Check My NIN →"}
            disabled={nin.trim().length !== 11} />
          <p style={{ textAlign: "center", fontSize: "0.71rem", color: "#bbb", marginTop: "0.75rem" }}>
            Pending NIns for demo: 67890123456 · 78901234567 · 89012345678
          </p>
        </>
      )}

      {/* ── Step 2: Set password ── */}
      {step === 2 && (
        <>
          <div style={{ background: "#f0f9f4", border: "1px solid #b8dfc9", borderRadius: "9px", padding: "0.8rem 1rem", marginBottom: "1rem", fontSize: "0.85rem" }}>
            <div style={{ fontWeight: 700, color: "#004d29", marginBottom: "0.2rem" }}>✅ NIN Verified</div>
            <div>Welcome, <strong>{voterName}</strong>. Your NIN <strong>{nin}</strong> is on the INEC register. Choose a password to activate your account.</div>
          </div>
          <label style={lbl}>Choose a Password</label>
          <div style={{ position: "relative" }}>
            <input style={{ ...inp, paddingRight: "3rem" }} type={showPw ? "text" : "password"}
              placeholder="Minimum 8 characters" value={password}
              onChange={e => { setAuthError(null); setPassword(e.target.value); }} />
            <EyeBtn show={showPw} toggle={() => setShowPw(p => !p)} />
          </div>
          <Field label="Confirm Password" value={confirm} type="password"
            onChange={v => { setAuthError(null); setConfirm(v); }}
            placeholder="Repeat your password" onEnter={handleActivate} />
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.2rem" }}>
            <button onClick={() => { setStep(1); setAuthError(null); setPassword(""); setConfirm(""); }}
              style={{ flex: "0 0 auto", background: "#eee", color: "#444", border: "none", borderRadius: "10px", padding: "0.85rem 1.1rem", cursor: "pointer", fontSize: "0.88rem" }}>
              ← Back
            </button>
            <Btn loading={loading} onClick={handleActivate} label={loading ? "Activating…" : "✅  Activate & Enter Portal"} style={{ flex: 1 }} />
          </div>
          <p style={{ textAlign: "center", fontSize: "0.71rem", color: "#aaa", marginTop: "0.75rem" }}>
            Fraudulent activation is an offence under the Electoral Act 2022.
          </p>
        </>
      )}
    </div>
  );
}

// ── Activation error — handles "not found" case with LGA guidance ─────────────
function ActivationError({ msg }) {
  const isNotFound = msg.includes("not found") || msg.includes("not on") || msg.includes("NIN not");
  return (
    <div style={{
      background: "#fffbf0", borderLeft: `5px solid ${isNotFound ? "#c9a84c" : "#dc3545"}`,
      border: `1px solid ${isNotFound ? "#f0c674" : "#f5c6cb"}`,
      borderRadius: "8px", padding: "0.9rem 1rem", marginBottom: "1rem", fontSize: "0.82rem",
    }}>
      {isNotFound ? (
        <>
          <div style={{ fontWeight: 700, color: "#856404", marginBottom: "0.5rem" }}>⚠️ NIN Not Found on Electoral Register</div>
          <div style={{ color: "#555", marginBottom: "0.75rem" }}>{msg}</div>
          <div style={{ background: "#fff8e1", borderRadius: "7px", padding: "0.7rem 0.9rem", color: "#444" }}>
            <div style={{ fontWeight: 600, marginBottom: "0.4rem" }}>What to do next:</div>
            <div style={{ marginBottom: "0.25rem" }}>📍 Visit your nearest <strong>INEC LGA office</strong> with your original NIMC slip</div>
            <div style={{ marginBottom: "0.25rem" }}>📞 Call: <strong>0800-CALL-INEC (0800-2255-4632)</strong></div>
            <div>📧 Email: <strong>info@inecnigeria.org</strong></div>
          </div>
        </>
      ) : (
        <div><span style={{ marginRight: "0.4rem" }}>⚠️</span>{msg}</div>
      )}
    </div>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, maxLength, type = "text", onEnter, autoFocus }) {
  return (
    <>
      <label style={lbl}>{label}</label>
      <input style={inp} type={type} placeholder={placeholder} value={value} maxLength={maxLength}
        autoFocus={autoFocus}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onEnter?.()} />
    </>
  );
}

function EyeBtn({ show, toggle }) {
  return (
    <button onClick={toggle} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}>
      {show ? "🙈" : "👁️"}
    </button>
  );
}

function ErrBox({ msg }) {
  return (
    <div style={{ background: "#fff3cd", border: "1px solid #f0c674", borderLeft: "5px solid #c9a84c", borderRadius: "8px", padding: "0.7rem 0.9rem", fontSize: "0.82rem", color: "#6b4f00", marginBottom: "1rem" }}>
      ⚠️ {msg}
    </div>
  );
}

function Btn({ loading, onClick, label, disabled, style = {} }) {
  return (
    <button disabled={loading || disabled} onClick={onClick} style={{
      width: "100%", marginTop: "1.2rem",
      background: (loading || disabled) ? "#aaa" : "linear-gradient(135deg, #004d29, #006837)",
      color: "#fff", border: "none", borderRadius: "10px",
      padding: "0.85rem", fontSize: "0.95rem", fontWeight: 700,
      cursor: (loading || disabled) ? "not-allowed" : "pointer",
      ...style,
    }}>{label}</button>
  );
}

const wrap    = { padding: "1.6rem 2rem 2rem" };
const lbl     = { display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#333", marginBottom: "0.35rem", marginTop: "0.9rem" };
const inp     = { width: "100%", boxSizing: "border-box", border: "1.5px solid #ddd", borderRadius: "8px", padding: "0.65rem 0.9rem", fontSize: "0.9rem", outline: "none", fontFamily: "inherit" };
const hintBox = { background: "#e8f5ee", border: "1px solid #c3e6cb", borderRadius: "8px", padding: "0.6rem 0.9rem", fontSize: "0.8rem", marginBottom: "1rem" };
