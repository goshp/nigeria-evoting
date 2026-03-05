// ─── auth/AuthContext.jsx ──────────────────────────────────────────────────────
// Global authentication context.
//
// PERSISTENCE:
//   Activated voter accounts are stored in localStorage under "inec_activations"
//   so that a voter who activates on one browser/tab can log in from any other.
//
//   Voted state is stored in localStorage under "inec_voted" keyed by
//   "nin:electionId" so it persists across page refreshes and is isolated
//   per voter.

import { createContext, useContext, useState, useCallback, useRef } from "react";

// ── Storage helpers ───────────────────────────────────────────────────────────
const LS_ACTIVATIONS = "inec_activations"; // { [nin]: { password, activatedAt } }
const LS_VOTED       = "inec_voted";       // { ["nin:electionId"]: true }

function lsGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── INEC Staff accounts ───────────────────────────────────────────────────────
const INEC_STAFF = [
  { staffId: "INEC-001", password: "Admin1234", name: "Mahmood Yakubu",  title: "INEC Chairman",         zone: "National HQ" },
  { staffId: "INEC-002", password: "Admin1234", name: "Ruth Oriaran",    title: "Director ICT",          zone: "National HQ" },
  { staffId: "INEC-003", password: "Admin1234", name: "Festus Okoye",    title: "National Commissioner", zone: "South-South" },
];

// ── INEC Pre-approved Voter Roll (seed) ───────────────────────────────────────
// "active" accounts have a default password baked in.
// "pending" accounts have no password — they must activate via the Register tab.
// Activations are persisted to localStorage so they survive page refresh / new tabs.
const INEC_VOTER_ROLL_SEED = [
  { nin: "12345678901", name: "Amara Okafor",    state: "Lagos",   lga: "Ikeja",         ward: "Ward 3",  pollingUnit: "PU/LA/001", status: "active",  password: "Voter1234" },
  { nin: "23456789012", name: "Bello Musa",       state: "Kano",    lga: "Kano Mun.",     ward: "Ward 7",  pollingUnit: "PU/KN/034", status: "active",  password: "Voter1234" },
  { nin: "34567890123", name: "Chioma Eze",       state: "Enugu",   lga: "Enugu North",   ward: "Ward 1",  pollingUnit: "PU/EN/012", status: "active",  password: "Voter1234" },
  { nin: "45678901234", name: "Danladi Usman",    state: "Kaduna",  lga: "Kaduna North",  ward: "Ward 5",  pollingUnit: "PU/KD/007", status: "active",  password: "Voter1234" },
  { nin: "56789012345", name: "Efua Mensah",      state: "Rivers",  lga: "Port Harcourt", ward: "Ward 2",  pollingUnit: "PU/RV/019", status: "active",  password: "Voter1234" },
  { nin: "67890123456", name: "Fatima Al-Hassan", state: "Borno",   lga: "Maiduguri",     ward: "Ward 4",  pollingUnit: "PU/BO/022", status: "pending", password: null },
  { nin: "78901234567", name: "Gbenga Adeyemi",   state: "Oyo",     lga: "Ibadan North",  ward: "Ward 9",  pollingUnit: "PU/OY/055", status: "pending", password: null },
  { nin: "89012345678", name: "Hauwa Suleiman",   state: "Katsina", lga: "Katsina",       ward: "Ward 6",  pollingUnit: "PU/KT/031", status: "pending", password: null },
  { nin: "90123456789", name: "Ikenna Okonkwo",   state: "Anambra", lga: "Onitsha",       ward: "Ward 11", pollingUnit: "PU/AN/044", status: "pending", password: null },
  { nin: "01234567890", name: "Jumoke Adesanya",  state: "Lagos",   lga: "Lagos Island",  ward: "Ward 3",  pollingUnit: "PU/LA/088", status: "pending", password: null },
];

// Merge seed with any persisted activations from localStorage.
// Returns a mutable array — activations mutate entries in place and are saved back.
function buildVoterRoll() {
  const activations = lsGet(LS_ACTIVATIONS); // { [nin]: { password, activatedAt } }
  return INEC_VOTER_ROLL_SEED.map(v => {
    const activation = activations[v.nin];
    if (activation) {
      return { ...v, status: "active", password: activation.password, activatedAt: activation.activatedAt };
    }
    return { ...v };
  });
}

// ── Simple hash (demo — use SHA-256 + salt in production) ────────────────────
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
  const [user,        setUser]        = useState(null);
  const [authError,   setAuthError]   = useState(null);
  const [lockedVotes, setLockedVotes] = useState({});
  const [auditTrail,  setAuditTrail]  = useState([]);

  // Voter roll: seed merged with localStorage activations, rebuilt on mount
  const voterRoll = useRef(buildVoterRoll());

  // ── Audit logger ──────────────────────────────────────────────────────────────
  const appendAudit = useCallback((entry) => {
    setAuditTrail(prev => [...prev, {
      ...entry,
      timestamp: new Date().toISOString(),
      id: Date.now(),
    }]);
  }, []);

  // ── INEC login ────────────────────────────────────────────────────────────────
  const loginInec = useCallback((staffId, password) => {
    setAuthError(null);
    const staff = INEC_STAFF.find(s => s.staffId === staffId && s.password === password);
    if (!staff) {
      setAuthError("Invalid Staff ID or password. Please try again.");
      return false;
    }
    setUser({ role: "inec", staffId: staff.staffId, name: staff.name, title: staff.title, zone: staff.zone });
    appendAudit({ action: "INEC_LOGIN", actor: staff.staffId, detail: staff.name });
    return true;
  }, [appendAudit]);

  // ── Voter login ───────────────────────────────────────────────────────────────
  const loginVoter = useCallback((nin, password) => {
    setAuthError(null);

    // Always re-merge with localStorage in case another tab activated since mount
    voterRoll.current = buildVoterRoll();

    const record = voterRoll.current.find(v => v.nin === nin);

    if (!record) {
      setAuthError("This NIN is not on the INEC electoral register. Please visit your Local Government Area (LGA) INEC office to verify your registration.");
      return false;
    }
    if (record.status === "pending") {
      setAuthError("Your account has not been activated yet. Please use the Activate Account tab to set your password.");
      return false;
    }
    if (record.password !== password) {
      setAuthError("Incorrect password. Please try again.");
      return false;
    }

    setUser({ role: "voter", nin: record.nin, name: record.name, state: record.state, lga: record.lga, ward: record.ward, pollingUnit: record.pollingUnit });
    appendAudit({ action: "VOTER_LOGIN", actor: nin.slice(-4).padStart(11, "*"), detail: record.name });
    return true;
  }, [appendAudit]);

  // ── Voter activation ──────────────────────────────────────────────────────────
  // Activates an existing INEC-approved pending record.
  // Persists the activation to localStorage so it works across browsers/tabs.
  const activateVoter = useCallback((nin, password, confirmPassword) => {
    setAuthError(null);

    if (!/^\d{11}$/.test(nin)) {
      setAuthError("NIN must be exactly 11 digits with no spaces or dashes.");
      return false;
    }

    // Re-merge with localStorage before checking
    voterRoll.current = buildVoterRoll();
    const record = voterRoll.current.find(v => v.nin === nin);

    if (!record) {
      setAuthError("NIN not found on the electoral register. If you believe this is an error, please visit your nearest INEC LGA office with your original NIMC slip.");
      return false;
    }
    if (record.status === "active") {
      setAuthError("This NIN is already activated. Please log in with your password instead.");
      return false;
    }
    if (password.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      setAuthError("Passwords do not match. Please re-enter.");
      return false;
    }

    // Persist activation to localStorage — survives page refresh and new tabs
    const activations = lsGet(LS_ACTIVATIONS);
    activations[nin]  = { password, activatedAt: new Date().toISOString() };
    lsSet(LS_ACTIVATIONS, activations);

    // Update in-memory roll too
    record.password    = password;
    record.status      = "active";
    record.activatedAt = activations[nin].activatedAt;

    setUser({ role: "voter", nin: record.nin, name: record.name, state: record.state, lga: record.lga, ward: record.ward, pollingUnit: record.pollingUnit });
    appendAudit({ action: "VOTER_ACTIVATED", actor: nin.slice(-4).padStart(11, "*"), detail: record.name });
    return true;
  }, [appendAudit]);

  // ── Logout ────────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    if (user) {
      appendAudit({ action: "LOGOUT", actor: user.staffId || user.nin?.slice(-4).padStart(11, "*"), detail: user.name });
    }
    setUser(null);
    setAuthError(null);
  }, [user, appendAudit]);

  // ── Vote immutability ─────────────────────────────────────────────────────────
  const commitVote = useCallback((receipt) => {
    const hash = hashVote(receipt);
    setLockedVotes(prev => ({ ...prev, [receipt.code]: { hash, lockedAt: new Date().toISOString() } }));
    appendAudit({ action: "VOTE_COMMITTED", actor: "SYSTEM", detail: `Receipt ${receipt.code} locked — hash ${hash}` });
    return hash;
  }, [appendAudit]);

  const verifyVoteIntegrity = useCallback((receipt) => {
    const lock = lockedVotes[receipt.code];
    if (!lock) return { valid: false, reason: "Receipt not found in lock registry" };
    const currentHash = hashVote(receipt);
    if (currentHash !== lock.hash) {
      appendAudit({ action: "INTEGRITY_VIOLATION", actor: "SYSTEM", detail: `Receipt ${receipt.code} hash mismatch` });
      return { valid: false, reason: "Vote integrity check failed — possible tampering detected" };
    }
    return { valid: true, hash: lock.hash, lockedAt: lock.lockedAt };
  }, [lockedVotes, appendAudit]);

  // ── NIN lookup (used by activation step 1) ────────────────────────────────────
  const lookupVoterNin = useCallback((nin) => {
    voterRoll.current = buildVoterRoll(); // always fresh from localStorage
    const record = voterRoll.current.find(v => v.nin === nin);
    if (!record) {
      setAuthError("NIN not found on the electoral register. If you believe this is an error, please visit your nearest INEC LGA office with your original NIMC slip.");
      return { status: "not_found" };
    }
    if (record.status === "active") {
      setAuthError("This NIN is already activated. Please use the Log In tab to access your account.");
      return { status: "active" };
    }
    return { status: "pending", name: record.name, state: record.state, lga: record.lga, ward: record.ward };
  }, []);

  // ── didVote — reads from localStorage, keyed by "nin:electionId" ──────────────
  // This is the authoritative voted check. Persists across refreshes and tabs.
  const didVote = useCallback((nin, electionId) => {
    if (!nin) return false;
    const voted = lsGet(LS_VOTED);
    return !!voted[`${nin}:${electionId}`];
  }, []);

  // ── markVoted — called after a successful vote submission ─────────────────────
  const markVoted = useCallback((nin, electionId) => {
    const voted = lsGet(LS_VOTED);
    voted[`${nin}:${electionId}`] = true;
    lsSet(LS_VOTED, voted);
  }, []);

  // ── Roll stats ────────────────────────────────────────────────────────────────
  const getRollStats = useCallback(() => {
    const roll = buildVoterRoll();
    return {
      total:   roll.length,
      active:  roll.filter(v => v.status === "active").length,
      pending: roll.filter(v => v.status === "pending").length,
    };
  }, []);

  const isInec  = user?.role === "inec";
  const isVoter = user?.role === "voter";
  const isGuest = !user;

  return (
    <AuthContext.Provider value={{
      user, isInec, isVoter, isGuest,
      authError, setAuthError,
      loginInec, loginVoter, activateVoter, logout,
      commitVote, verifyVoteIntegrity,
      didVote, markVoted,
      lockedVotes, auditTrail, getRollStats, lookupVoterNin,
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
