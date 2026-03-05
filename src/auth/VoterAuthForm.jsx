// ─── auth/VoterAuthForm.jsx ───────────────────────────────────────────────────
// Combined voter login + registration form with two tabs.
// Login:    NIN + Password
// Register: NIN + Full name + State + LGA + Ward + Password + Confirm password

import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";

const STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara",
];

export default function VoterAuthForm() {
  const { loginVoter, registerVoter, authError, setAuthError } = useAuth();
  const [tab, setTab] = useState("login"); // "login" | "register"

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display: "flex", borderBottom: "2px solid #eee" }}>
        {[["login", "Log In"], ["register", "Register"]].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setAuthError(null); }} style={{
            flex: 1, padding: "0.9rem", border: "none", background: "none",
            fontWeight: tab === key ? 700 : 400,
            color: tab === key ? "#004d29" : "#888",
            borderBottom: tab === key ? "3px solid #006837" : "3px solid transparent",
            cursor: "pointer", fontSize: "0.9rem", fontFamily: "inherit",
          }}>{label}</button>
        ))}
      </div>

      {tab === "login"    && <LoginTab    loginVoter={loginVoter}     authError={authError} setAuthError={setAuthError} />}
      {tab === "register" && <RegisterTab registerVoter={registerVoter} authError={authError} setAuthError={setAuthError} />}
    </div>
  );
}

// ── Login tab ─────────────────────────────────────────────────────────────────
function LoginTab({ loginVoter, authError, setAuthError }) {
  const [nin,      setNin]      = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  async function handleLogin() {
    if (!nin.trim() || !password) { setAuthError("Please enter your NIN and password."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    loginVoter(nin.trim(), password);
    setLoading(false);
  }

  return (
    <div style={formWrap}>
      <p style={hint}>Demo: NIN <strong>12345678901</strong> / Password <strong>Voter1234</strong></p>
      {authError && <ErrorBox msg={authError} />}

      <Field label="National Identification Number (NIN)" value={nin} onChange={v => { setAuthError(null); setNin(v); }}
        placeholder="11-digit NIN" maxLength={11} onEnter={handleLogin} />

      <label style={labelStyle}>Password</label>
      <div style={{ position: "relative" }}>
        <input style={{ ...inputStyle, paddingRight: "3rem" }} type={showPw ? "text" : "password"}
          placeholder="Your password" value={password}
          onChange={e => { setAuthError(null); setPassword(e.target.value); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()} />
        <button onClick={() => setShowPw(p => !p)}
          style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
          {showPw ? "🙈" : "👁️"}
        </button>
      </div>

      <button style={submitBtn(loading)} onClick={handleLogin} disabled={loading}>
        {loading ? "Verifying…" : "🗳️  Log In to Vote"}
      </button>
    </div>
  );
}

// ── Register tab ──────────────────────────────────────────────────────────────
function RegisterTab({ registerVoter, authError, setAuthError }) {
  const [form, setForm] = useState({ nin: "", name: "", state: "", lga: "", ward: "", password: "", confirm: "" });
  const [loading, setLoading]   = useState(false);
  const [showPw,  setShowPw]    = useState(false);

  function update(field, value) { setAuthError(null); setForm(f => ({ ...f, [field]: value })); }

  async function handleRegister() {
    if (!form.nin || !form.name || !form.state || !form.lga || !form.ward || !form.password) {
      setAuthError("All fields are required."); return;
    }
    if (form.password !== form.confirm) {
      setAuthError("Passwords do not match."); return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    registerVoter(form.nin.trim(), form.password, form.name.trim(), form.state, form.lga.trim(), form.ward.trim());
    setLoading(false);
  }

  return (
    <div style={formWrap}>
      <p style={hint}>Your NIN is your permanent voter identity. Use your NIMC-issued 11-digit number.</p>
      {authError && <ErrorBox msg={authError} />}

      <Field label="National Identification Number (NIN) *" value={form.nin}
        onChange={v => update("nin", v)} placeholder="11-digit NIN" maxLength={11} />
      <Field label="Full Legal Name *" value={form.name}
        onChange={v => update("name", v)} placeholder="As it appears on your NIMC slip" />

      <label style={labelStyle}>State of Registration *</label>
      <select style={inputStyle} value={form.state} onChange={e => update("state", e.target.value)}>
        <option value="">— Select state —</option>
        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <Field label="Local Government Area (LGA) *" value={form.lga}
        onChange={v => update("lga", v)} placeholder="Your LGA" />
      <Field label="Ward *" value={form.ward}
        onChange={v => update("ward", v)} placeholder="Your polling ward" />

      <label style={labelStyle}>Create Password *</label>
      <div style={{ position: "relative" }}>
        <input style={{ ...inputStyle, paddingRight: "3rem" }} type={showPw ? "text" : "password"}
          placeholder="Min 8 characters" value={form.password}
          onChange={e => update("password", e.target.value)} />
        <button onClick={() => setShowPw(p => !p)}
          style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
          {showPw ? "🙈" : "👁️"}
        </button>
      </div>

      <Field label="Confirm Password *" value={form.confirm}
        onChange={v => update("confirm", v)} placeholder="Repeat password"
        type="password" onEnter={handleRegister} />

      <button style={submitBtn(loading)} onClick={handleRegister} disabled={loading}>
        {loading ? "Registering…" : "✅  Register & Continue to Portal"}
      </button>

      <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#888", marginTop: "1rem" }}>
        By registering, you confirm you are a Nigerian citizen eligible to vote. False registration is a criminal offence under the Electoral Act.
      </p>
    </div>
  );
}

// ── Shared field component ────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, maxLength, type = "text", onEnter }) {
  return (
    <>
      <label style={labelStyle}>{label}</label>
      <input style={inputStyle} type={type} placeholder={placeholder} value={value} maxLength={maxLength}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onEnter?.()}
      />
    </>
  );
}

function ErrorBox({ msg }) {
  return <div style={{ background: "#fff3cd", border: "1px solid #f0c674", borderRadius: "8px", padding: "0.6rem 0.9rem", fontSize: "0.82rem", color: "#6b4f00", marginBottom: "1rem", display: "flex", gap: "0.5rem" }}><span>⚠️</span>{msg}</div>;
}

const formWrap   = { padding: "1.6rem 2rem 2rem" };
const hint       = { background: "#e8f5ee", border: "1px solid #c3e6cb", borderRadius: "8px", padding: "0.6rem 0.9rem", fontSize: "0.8rem", color: "#155724", marginBottom: "1rem" };
const labelStyle = { display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#333", marginBottom: "0.35rem", marginTop: "0.9rem" };
const inputStyle = { width: "100%", boxSizing: "border-box", border: "1.5px solid #ddd", borderRadius: "8px", padding: "0.65rem 0.9rem", fontSize: "0.9rem", outline: "none", fontFamily: "inherit" };
const submitBtn  = (loading) => ({ width: "100%", marginTop: "1.5rem", background: loading ? "#aaa" : "linear-gradient(135deg, #004d29, #006837)", color: "#fff", border: "none", borderRadius: "10px", padding: "0.85rem", fontSize: "0.95rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" });
