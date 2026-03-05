// ─── results/ResultsView.jsx ──────────────────────────────────────────────────
// Top-level orchestrator for the Results Centre module.
// Renders the dark results banner and delegates to three sub-tabs:
//   LiveTab       – real-time vote counts for active elections
//   PublishedTab  – official certified results for closed elections
//   VerifyTab     – public receipt code verification tool

// ─── results/ResultsView.jsx ──────────────────────────────────────────────────
// Results Centre — read-only for voters, full access for INEC.
// readOnly prop is passed from App.jsx based on user role.

import { useState } from "react";
import LiveTab      from "./LiveTab.jsx";
import PublishedTab from "./PublishedTab.jsx";
import VerifyTab    from "./VerifyTab.jsx";

const TAB_KEYS   = ["live", "published", "verify"];
const TAB_LABELS = ["Live Tabulation", "Published Results", "Verify Vote"];

export default function ResultsView({
  elections,
  verifyCode, setVerifyCode,
  verifyResult, onVerify,
  readOnly = true,
}) {
  const [activeTab, setActiveTab] = useState("live");

  return (
    <div>
      <div className="results-banner">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="results-live">● LIVE</div>
          <h1>Election Results Centre</h1>
          <p>Real-time tabulation and public transparency · Independent National Electoral Commission</p>
          {readOnly && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "0.3rem 1rem", fontSize: "0.78rem", marginTop: "0.75rem", color: "#a8e6c0" }}>
              👁️ View-only mode — results are publicly visible but cannot be modified
            </div>
          )}
        </div>
      </div>

      <div className="page">
        <div className="tabs">
          {TAB_LABELS.map((label, i) => (
            <div key={TAB_KEYS[i]} className={`tab ${activeTab === TAB_KEYS[i] ? "active" : ""}`}
              onClick={() => setActiveTab(TAB_KEYS[i])}>
              {label}
            </div>
          ))}
        </div>

        {activeTab === "live"      && <LiveTab      elections={elections} readOnly={readOnly} />}
        {activeTab === "published" && <PublishedTab elections={elections} readOnly={readOnly} />}
        {activeTab === "verify"    && (
          <VerifyTab verifyCode={verifyCode} setVerifyCode={setVerifyCode}
            verifyResult={verifyResult} onVerify={onVerify} />
        )}
      </div>
    </div>
  );
}

