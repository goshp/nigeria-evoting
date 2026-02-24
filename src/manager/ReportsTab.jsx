// ─── manager/ReportsTab.jsx ───────────────────────────────────────────────────
// Displays per-election results and reports inside the Election Manager.
// Renders an election selector, then delegates to the shared ElectionReport
// component which renders ballot result bars with export actions.

import { useState } from "react";
import { ElectionReport } from "../shared/components.jsx";

export default function ReportsTab({ elections }) {
  const [selectedId, setSelectedId] = useState(elections[0]?.id || null);
  const election = elections.find(e => e.id === selectedId);

  return (
    <div>
      <div className="section-title">Results & Reports</div>

      {/* Election selector */}
      <div className="form-group mb-3" style={{ maxWidth: 480 }}>
        <label className="form-label">Select Election</label>
        <select
          className="form-control"
          value={selectedId || ""}
          onChange={e => setSelectedId(e.target.value)}
        >
          {elections.map(e => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {election
        ? <ElectionReport el={election} isManager />
        : <div className="alert alert-info"><span>ℹ️</span><span>No elections available.</span></div>
      }
    </div>
  );
}
