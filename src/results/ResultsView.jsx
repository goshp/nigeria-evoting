// ─── results/ResultsView.jsx ──────────────────────────────────────────────────
// Top-level orchestrator for the Results Centre module.
// Renders the dark results banner and delegates to three sub-tabs:
//   LiveTab       – real-time vote counts for active elections
//   PublishedTab  – official certified results for closed elections
//   VerifyTab     – public receipt code verification tool

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
}) {
  const [activeTab, setActiveTab] = useState("live");

  return (
    <div>
      {/* ── BANNER ── */}
      <div className="results-banner">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="results-live">● LIVE</div>
          <h1>Election Results Centre</h1>
          <p>Real-time tabulation and public transparency · Independent National Electoral Commission</p>
        </div>
      </div>

      {/* ── PAGE ── */}
      <div className="page">
        {/* Tab navigation */}
        <div className="tabs">
          {TAB_LABELS.map((label, i) => (
            <div
              key={TAB_KEYS[i]}
              className={`tab ${activeTab === TAB_KEYS[i] ? "active" : ""}`}
              onClick={() => setActiveTab(TAB_KEYS[i])}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "live"      && <LiveTab      elections={elections} />}
        {activeTab === "published" && <PublishedTab elections={elections} />}
        {activeTab === "verify"    && (
          <VerifyTab
            verifyCode={verifyCode}
            setVerifyCode={setVerifyCode}
            verifyResult={verifyResult}
            onVerify={onVerify}
          />
        )}
      </div>
    </div>
  );
}
