// ─── auth/LandingPage.jsx ─────────────────────────────────────────────────────
// Public landing page shown to unauthenticated guests.
// Two clear paths:
//   1. INEC Official  → Staff ID + Password login
//   2. Registered Voter → NIN + Password login OR new voter registration

import { useState } from "react";
import InecLoginForm    from "./InecLoginForm.jsx";
import VoterAuthForm    from "./VoterAuthForm.jsx";

export default function LandingPage() {
  // "choose" | "inec" | "voter"
  const [path, setPath] = useState("choose");

  return (
    <div style={{
      minHeight:       "100vh",
      background:      "linear-gradient(160deg, #004d29 0%, #006837 45%, #1a8a4a 100%)",
      display:         "flex",
      flexDirection:   "column",
      alignItems:      "center",
      justifyContent:  "center",
      padding:         "2rem 1rem",
      fontFamily:      "var(--font-sans)",
    }}>

      {/* ── Brand header ───────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>🇳🇬</div>
        <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", letterSpacing: "0.04em" }}>
          Nigeria eVoting Platform
        </div>
        <div style={{ fontSize: "0.85rem", color: "#a8e6c0", marginTop: "0.4rem", letterSpacing: "0.08em" }}>
          INDEPENDENT NATIONAL ELECTORAL COMMISSION
        </div>
      </div>

      {/* ── Card ───────────────────────────────────────────────────────── */}
      <div style={{
        background:   "#fff",
        borderRadius: "16px",
        width:        "100%",
        maxWidth:     "480px",
        boxShadow:    "0 24px 64px rgba(0,0,0,0.3)",
        overflow:     "hidden",
      }}>

        {/* Choose path */}
        {path === "choose" && <ChoosePathScreen onSelect={setPath} />}

        {/* INEC login */}
        {path === "inec" && (
          <div>
            <PathHeader title="INEC Official Login" icon="🏛️" onBack={() => setPath("choose")} />
            <InecLoginForm />
          </div>
        )}

        {/* Voter auth (login + register tabs) */}
        {path === "voter" && (
          <div>
            <PathHeader title="Voter Access" icon="🗳️" onBack={() => setPath("choose")} />
            <VoterAuthForm />
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div style={{ marginTop: "2rem", textAlign: "center", color: "#a8e6c0", fontSize: "0.75rem" }}>
        <div>© 2026 Independent National Electoral Commission (INEC) Nigeria</div>
        <div style={{ marginTop: "0.25rem", opacity: 0.7 }}>
          Secured with end-to-end encryption · All votes are immutable once cast
        </div>
      </div>
    </div>
  );
}

// ── Choose path screen ────────────────────────────────────────────────────────
function ChoosePathScreen({ onSelect }) {
  return (
    <div style={{ padding: "2.5rem 2rem" }}>
      <h2 style={{ textAlign: "center", color: "#004d29", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Welcome
      </h2>
      <p style={{ textAlign: "center", color: "#555", fontSize: "0.88rem", marginBottom: "2rem" }}>
        Select your role to continue
      </p>

      {/* INEC card */}
      <button onClick={() => onSelect("inec")} style={pathCardStyle("#004d29")}>
        <div style={{ fontSize: "2.2rem", marginBottom: "0.6rem" }}>🏛️</div>
        <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#004d29", marginBottom: "0.3rem" }}>
          INEC Official
        </div>
        <div style={{ fontSize: "0.8rem", color: "#555" }}>
          Staff login for electoral officers, returning officers, and ICT administrators
        </div>
        <div style={arrowStyle}>→</div>
      </button>

      <div style={{ textAlign: "center", color: "#aaa", fontSize: "0.8rem", margin: "1rem 0" }}>or</div>

      {/* Voter card */}
      <button onClick={() => onSelect("voter")} style={pathCardStyle("#1a8a4a")}>
        <div style={{ fontSize: "2.2rem", marginBottom: "0.6rem" }}>🗳️</div>
        <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#004d29", marginBottom: "0.3rem" }}>
          Registered Voter
        </div>
        <div style={{ fontSize: "0.8rem", color: "#555" }}>
          Log in or register with your NIN to access the Voter Portal and cast your ballot
        </div>
        <div style={arrowStyle}>→</div>
      </button>
    </div>
  );
}

// ── Path header with back button ──────────────────────────────────────────────
function PathHeader({ title, icon, onBack }) {
  return (
    <div style={{
      background:     "linear-gradient(135deg, #004d29, #006837)",
      padding:        "1.4rem 1.5rem",
      display:        "flex",
      alignItems:     "center",
      gap:            "0.75rem",
    }}>
      <button onClick={onBack} style={{
        background: "rgba(255,255,255,0.15)",
        border:     "none",
        borderRadius: "8px",
        color:      "#fff",
        cursor:     "pointer",
        padding:    "0.35rem 0.7rem",
        fontSize:   "0.85rem",
      }}>← Back</button>
      <span style={{ fontSize: "1.4rem" }}>{icon}</span>
      <span style={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem" }}>{title}</span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const pathCardStyle = (borderColor) => ({
  width:        "100%",
  background:   "#f9fafb",
  border:       `2px solid ${borderColor}20`,
  borderLeft:   `5px solid ${borderColor}`,
  borderRadius: "12px",
  padding:      "1.4rem 1.2rem",
  cursor:       "pointer",
  textAlign:    "left",
  position:     "relative",
  transition:   "all 0.2s",
  display:      "block",
});

const arrowStyle = {
  position:   "absolute",
  right:      "1.2rem",
  top:        "50%",
  transform:  "translateY(-50%)",
  color:      "#006837",
  fontSize:   "1.3rem",
  fontWeight: 700,
};
