// ─── shared/ConnectivityBar.jsx ───────────────────────────────────────────────
// Sticky status bar shown below the Nav when the device is offline or
// when votes are queued/syncing. Disappears when everything is online & synced.
//
// Props:
//   isOnline   {boolean}  – current connectivity state
//   syncStatus {object}   – latest status event from the sync engine
//   queueStats {object}   – { total, pending, synced }

export default function ConnectivityBar({ isOnline, syncStatus, queueStats }) {
  // Don't render anything if online and nothing is pending
  if (isOnline && queueStats.pending === 0 && (!syncStatus || syncStatus.type === "idle")) {
    return null;
  }

  const config = getBarConfig(isOnline, syncStatus, queueStats);
  if (!config) return null;

  return (
    <div style={{
      background:    config.bg,
      color:         config.color,
      padding:       "0.55rem 2rem",
      fontSize:      "0.8rem",
      fontFamily:    "var(--font-mono)",
      display:       "flex",
      alignItems:    "center",
      justifyContent:"space-between",
      gap:           "1rem",
      borderBottom:  `2px solid ${config.border}`,
      position:      "sticky",
      top:           60,
      zIndex:        90,
    }}>
      {/* Left: icon + message */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span style={{ fontSize: "1rem" }}>{config.icon}</span>
        <span>{config.message}</span>
      </div>

      {/* Right: queue pill */}
      {queueStats.pending > 0 && (
        <div style={{
          background:   config.pillBg,
          color:        config.pillColor,
          padding:      "0.15rem 0.7rem",
          borderRadius: "20px",
          fontSize:     "0.72rem",
          fontWeight:   700,
          letterSpacing:"0.06em",
          whiteSpace:   "nowrap",
        }}>
          {queueStats.pending} vote{queueStats.pending !== 1 ? "s" : ""} queued · {queueStats.synced} synced
        </div>
      )}

      {/* Syncing animation */}
      {syncStatus?.type === "syncing" && (
        <SyncingDots />
      )}
    </div>
  );
}

// ── Bar configuration by state ────────────────────────────────────────────────
function getBarConfig(isOnline, syncStatus, queueStats) {
  if (!isOnline) {
    return {
      bg:         "#1a1a1a",
      color:      "#f0c674",
      border:     "#c9a84c",
      pillBg:     "#c9a84c",
      pillColor:  "#0e0e0e",
      icon:       "📵",
      message:    "OFFLINE — Votes are being stored locally and will sync automatically when connectivity is restored.",
    };
  }

  if (syncStatus?.type === "syncing") {
    return {
      bg:         "#003d1f",
      color:      "#a8e6c0",
      border:     "#006837",
      pillBg:     "#006837",
      pillColor:  "#fff",
      icon:       "🔄",
      message:    `Syncing ${syncStatus.count} vote${syncStatus.count !== 1 ? "s" : ""} to central server…`,
    };
  }

  if (syncStatus?.type === "sync_failed") {
    return {
      bg:         "#2d0a0a",
      color:      "#f5b7b1",
      border:     "#c0392b",
      pillBg:     "#c0392b",
      pillColor:  "#fff",
      icon:       "⚠️",
      message:    `Sync failed — ${syncStatus.error}. Will retry automatically.`,
    };
  }

  if (syncStatus?.type === "synced" && queueStats.synced > 0) {
    return {
      bg:         "#0d2b18",
      color:      "#82e0aa",
      border:     "#1a8a4a",
      pillBg:     "#1a8a4a",
      pillColor:  "#fff",
      icon:       "✅",
      message:    `${syncStatus.count} vote${syncStatus.count !== 1 ? "s" : ""} successfully synced to central server.`,
    };
  }

  if (syncStatus?.type === "reconnected") {
    return {
      bg:         "#0d2b18",
      color:      "#82e0aa",
      border:     "#1a8a4a",
      pillBg:     "#1a8a4a",
      pillColor:  "#fff",
      icon:       "📶",
      message:    "Connection restored — syncing queued votes…",
    };
  }

  if (queueStats.pending > 0) {
    return {
      bg:         "#1a1500",
      color:      "#f0c674",
      border:     "#c9a84c",
      pillBg:     "#c9a84c",
      pillColor:  "#0e0e0e",
      icon:       "⏳",
      message:    "Votes queued locally — waiting for server sync.",
    };
  }

  return null;
}

// ── Syncing animated dots ─────────────────────────────────────────────────────
function SyncingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width:            6,
          height:           6,
          borderRadius:     "50%",
          background:       "#a8e6c0",
          animation:        `syncDot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes syncDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
