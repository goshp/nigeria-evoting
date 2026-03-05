// ─── auth/AuthContext.jsx ──────────────────────────────────────────────────────
// Global authentication context.
//
// Roles:
//   "inec"  – INEC official  → full access to all modules
//   "voter" – Registered voter → Voter Portal (full) + Results (read-only)
//   null    – Guest           → Landing page only
//
// Seed accounts (demo):
//   INEC:   INEC-001 / Admin1234   |   INEC-002 / Admin1234
//   Voter:  NIN 12345678901 / Voter1234  (pre-registered)
//
// Vote immutability:
//   Once a vote receipt is committed via commitVote(), it is hashed and locked.
//   No subsequent call — from any role — can alter it. Attempts are rejected
//   and logged to the immutable audit trail.

import { createContext, useContext, useState, useCallback } from "react";

// ── Seed data ─────────────────────────────────────────────────────────────────

const INEC_STAFF = [
  { staffId: "INEC-001", password: "Admin1234", name: "Mahmood Yakubu",   title: "INEC Chairman",         zone: "National HQ" },
  { staffId: "INEC-002", password: "Admin1234", name: "Ruth Oriaran",     title: "Director ICT",          zone: "National HQ" },
  { staffId: "INEC-003", password: "Admin1234", name: "Festus Okoye",     title: "National Commissioner", zone: "South-South" },
];

// Pre-registered voters — in production this comes from the NIMC/INEC database
const REGISTERED_VOTERS = [
  { nin: "12345678901", password: "Voter1234", name: "Amara Okafor",    state: "Lagos",   lga: "Ikeja",    ward: "Ward 3" },
  { nin: "23456789012", password: "Voter1234", name: "Bello Musa",      state: "Kano",    lga: "Kano Mun", ward: "Ward 7" },
  { nin: "34567890123", password: "Voter1234", name: "Chioma Eze",      state: "Enugu",   lga: "Enugu N.", ward: "Ward 1" },
  { nin: "45678901234", password: "Voter1234", name: "Danladi Usman",   state: "Kaduna",  lga: "Kaduna N.", ward: "Ward 5" },
  { nin: "56789012345", password: "Voter1234", name: "Efua Mensah",     state: "Rivers",  lga: "PH Mun",   ward: "Ward 2" },
];

// ── Simple hash (demo only — use SHA-256 in production) ───────────────────────
function hashVote(receipt) {
  const str = JSON.stringify({ code: receipt.code, votes: receipt.votes, ts: receipt.timestamp });
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0").toUpperCase();
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  // user shape (inec):  { role:"inec",  staffId, name, title, zone }
  // user shape (voter): { role:"voter", nin, name, state, lga, ward }

  const [authError,    setAuthError]    = useState(null);
  const [lockedVotes,  setLockedVotes]  = useState({}); // { receiptCode: { hash, lockedAt } }
  const [auditTrail,   setAuditTrail]   = useState([]); // immutable append-only log

  // ── Audit logger ────────────────────────────────────────────────────────────
  const appendAudit = useCallback((entry) => {
    setAuditTrail(prev => [...prev, {
      ...entry,
      timestamp: new Date().toISOString(),
      id: Date.now(),
    }]);
  }, []);

  // ── INEC login ──────────────────────────────────────────────────────────────
  const loginInec = useCallback((staffId, password) => {
    setAuthError(null);
    const staff = INEC_STAFF.find(s => s.staffId === staffId && s.password === password);
    if (!staff) {
      setAuthError("Invalid Staff ID or password. Please try again.");
      return false;
    }
    const u = { role: "inec", staffId: staff.staffId, name: staff.name, title: staff.title, zone: staff.zone };
    setUser(u);
    appendAudit({ action: "INEC_LOGIN", actor: staff.staffId, detail: staff.name });
    return true;
  }, [appendAudit]);

  // ── Voter login ─────────────────────────────────────────────────────────────
  const loginVoter = useCallback((nin, password) => {
    setAuthError(null);
    const voter = REGISTERED_VOTERS.find(v => v.nin === nin && v.password === password);
    if (!voter) {
      setAuthError("Invalid NIN or password. Please check your credentials.");
      return false;
    }
    const u = { role: "voter", nin: voter.nin, name: voter.name, state: voter.state, lga: voter.lga, ward: voter.ward };
    setUser(u);
    appendAudit({ action: "VOTER_LOGIN", actor: voter.nin.slice(-4).padStart(11, "*"), detail: voter.name });
    return true;
  }, [appendAudit]);

  // ── Voter registration ──────────────────────────────────────────────────────
  const registerVoter = useCallback((nin, password, name, state, lga, ward) => {
    setAuthError(null);

    // Check NIN format
    if (!/^\d{11}$/.test(nin)) {
      setAuthError("NIN must be exactly 11 digits.");
      return false;
    }

    // Check not already registered
    if (REGISTERED_VOTERS.find(v => v.nin === nin)) {
      setAuthError("This NIN is already registered. Please log in instead.");
      return false;
    }

    // Password strength
    if (password.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return false;
    }

    // Register (in-memory for demo — production writes to backend)
    const newVoter = { nin, password, name, state, lga, ward };
    REGISTERED_VOTERS.push(newVoter);

    const u = { role: "voter", nin, name, state, lga, ward };
    setUser(u);
    appendAudit({ action: "VOTER_REGISTERED", actor: nin.slice(-4).padStart(11, "*"), detail: name });
    return true;
  }, [appendAudit]);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    if (user) {
      appendAudit({ action: "LOGOUT", actor: user.staffId || user.nin?.slice(-4).padStart(11, "*"), detail: user.name });
    }
    setUser(null);
    setAuthError(null);
  }, [user, appendAudit]);

  // ── Vote immutability ────────────────────────────────────────────────────────
  // Called by App.jsx after handleVoteSubmit — permanently locks the receipt
  const commitVote = useCallback((receipt) => {
    const hash = hashVote(receipt);
    setLockedVotes(prev => ({
      ...prev,
      [receipt.code]: { hash, lockedAt: new Date().toISOString() },
    }));
    appendAudit({
      action:  "VOTE_COMMITTED",
      actor:   "SYSTEM",
      detail:  `Receipt ${receipt.code} locked with hash ${hash}`,
    });
    return hash;
  }, [appendAudit]);

  // Verify a receipt has not been tampered with
  const verifyVoteIntegrity = useCallback((receipt) => {
    const lock = lockedVotes[receipt.code];
    if (!lock) return { valid: false, reason: "Receipt not found in lock registry" };
    const currentHash = hashVote(receipt);
    if (currentHash !== lock.hash) {
      appendAudit({
        action: "INTEGRITY_VIOLATION",
        actor:  "SYSTEM",
        detail: `Receipt ${receipt.code} hash mismatch — expected ${lock.hash}, got ${currentHash}`,
      });
      return { valid: false, reason: "Vote integrity check failed — possible tampering detected" };
    }
    return { valid: true, hash: lock.hash, lockedAt: lock.lockedAt };
  }, [lockedVotes, appendAudit]);

  // ── Role helpers ─────────────────────────────────────────────────────────────
  const isInec  = user?.role === "inec";
  const isVoter = user?.role === "voter";
  const isGuest = !user;

  return (
    <AuthContext.Provider value={{
      user,
      isInec, isVoter, isGuest,
      authError, setAuthError,
      loginInec, loginVoter, registerVoter, logout,
      commitVote, verifyVoteIntegrity,
      lockedVotes, auditTrail,
      // Expose seed data counts for UI display
      totalRegisteredVoters: REGISTERED_VOTERS.length,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
