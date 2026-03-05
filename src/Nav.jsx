// ─── Nav.jsx ──────────────────────────────────────────────────────────────────
// Top-level sticky navigation bar. Renders the INEC brand, three module tabs,
// an online/offline connectivity indicator, and the administrator identity chip.

// ─── Nav.jsx ──────────────────────────────────────────────────────────────────
import { useAuth } from "./auth/AuthContext.jsx";

export default function Nav({ view, setView, isOnline, queueStats }) {
  const { user, isInec, isVoter, logout } = useAuth();

  // Build tabs based on role
  const TABS = [
    ...(isInec  ? [["manager", "⚙️ Election Manager"]] : []),
    ...(isVoter ? [["voter",   "🗳️ Voter Portal"]]     : []),
    ["results", "📊 Results"],
  ];

  return (
    <nav className="nav">
      <div className="nav-brand">
        <div className="nav-brand-icon">🇳🇬</div>
        <div className="nav-brand-text">Nigeria eVoting Platform</div>
      </div>

      <div className="nav-tabs">
        {TABS.map(([key, label]) => (
          <div
            key={key}
            className={`nav-tab ${view === key ? "active" : ""}`}
            onClick={() => setView(key)}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Right side: connectivity + user identity + logout */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Connectivity dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontFamily: "var(--font-mono)", opacity: 0.9 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background:  isOnline ? "#4caf7d" : "#f0c674",
            boxShadow:   isOnline ? "0 0 0 2px rgba(76,175,125,0.35)" : "0 0 0 2px rgba(240,198,116,0.35)",
          }} />
          <span style={{ color: isOnline ? "#a8e6c0" : "#f0c674" }}>
            {isOnline ? "Online" : "Offline"}
          </span>
          {queueStats.pending > 0 && (
            <span style={{ background: "#c9a84c", color: "#0e0e0e", padding: "0.1rem 0.45rem", borderRadius: 10, fontSize: "0.65rem", fontWeight: 700 }}>
              {queueStats.pending} queued
            </span>
          )}
        </div>

        {/* User identity chip */}
        {user && (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(255,255,255,0.12)", borderRadius: "20px",
            padding: "0.3rem 0.85rem", fontSize: "0.78rem",
          }}>
            <span>{isInec ? "🏛️" : "🗳️"}</span>
            <span style={{ color: "#fff", fontWeight: 600 }}>{user.name}</span>
            <span style={{
              background: isInec ? "#c9a84c" : "#4caf7d",
              color: "#000", borderRadius: "10px",
              padding: "0.1rem 0.5rem", fontSize: "0.65rem", fontWeight: 700,
            }}>
              {isInec ? "INEC" : "VOTER"}
            </span>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "8px", color: "#fff", cursor: "pointer",
            padding: "0.3rem 0.75rem", fontSize: "0.78rem",
          }}
        >Sign Out</button>
      </div>
    </nav>
  );
}