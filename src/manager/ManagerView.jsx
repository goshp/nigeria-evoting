// ─── manager/ManagerView.jsx ──────────────────────────────────────────────────
// Top-level orchestrator for the Election Manager module.
// Renders the hero banner, tab navigation, and delegates to the four sub-tabs:
//   ElectionsTab  – election cards & KPIs
//   CreateElectionTab – 4-step election wizard
//   ReportsTab    – per-election result reports
//   AuditTab      – anonymised audit trail

import { useState } from "react";
import ElectionsTab       from "./ElectionsTab.jsx";
import CreateElectionTab  from "./CreateElectionTab.jsx";
import ReportsTab         from "./ReportsTab.jsx";
import AuditTab           from "./AuditTab.jsx";
import SyncMonitorTab     from "./SyncMonitorTab.jsx";

const TAB_KEYS   = ["elections", "create", "reports", "audit", "sync"];
const TAB_LABELS = ["Elections", "Create Election", "Reports", "Audit Log", "📡 Sync Monitor"];

export default function ManagerView({ elections, onAddElection, onPublish, onClose, receipts, isOnline, syncStatus, queueStats }) {
  const [activeTab, setActiveTab] = useState("elections");

  return (
    <>
      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">INEC Electronic Voting System · Manager Console</div>
          <h1 className="hero-title">Election Manager</h1>
          <p className="hero-sub">
            Define, configure, and administer federal, state, and local government elections
            with full control over ballots, voter authentication, and result publication.
          </p>
        </div>
      </div>

      {/* ── MAIN PAGE ── */}
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
        {activeTab === "elections" && (
          <ElectionsTab
            elections={elections}
            onPublish={onPublish}
            onClose={onClose}
            onSelect={() => {}}
            setManagerTab={setActiveTab}
          />
        )}
        {activeTab === "create" && (
          <CreateElectionTab onAdd={onAddElection} />
        )}
        {activeTab === "reports" && (
          <ReportsTab elections={elections} />
        )}
        {activeTab === "audit" && (
          <AuditTab receipts={receipts} />
        )}
        {activeTab === "sync" && (
          <SyncMonitorTab isOnline={isOnline} syncStatus={syncStatus} queueStats={queueStats} />
        )}
      </div>
    </>
  );
}
