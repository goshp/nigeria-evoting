// ─── auth/AuthContext.jsx ──────────────────────────────────────────────────────
// Global authentication context.
//
// VOTER REGISTRATION MODEL:
//   Registration = activation only. INEC pre-loads the approved voter roll.
//   A visitor cannot create a new voter account — they can only activate an
//   existing INEC-approved record by providing their NIN and choosing a password.
//
//   Roll statuses:
//     "pending"   — on the INEC roll, not yet activated (no password set)
//     "active"    — activated (password set), can log in
//
//   Registration flow:
//     1. Visitor enters NIN
//     2. System checks INEC_VOTER_ROLL
//     3. Not found          → "NIN not on electoral register — contact LGA"
//     4. Found, "active"    → "Already activated — please log in"
//     5. Found, "pending"   → Allow password creation → status → "active"

import { createContext, useContext, useState, useCallback, useRef } from "react";

// ── INEC Staff accounts ───────────────────────────────────────────────────────
const INEC_STAFF = [
  { staffId: "INEC-001", password: "Admin1234", name: "Mahmood Yakubu",  title: "INEC Chairman",         zone: "National HQ" },
  { staffId: "INEC-002", password: "Admin1234", name: "Ruth Oriaran",    title: "Director ICT",          zone: "National HQ" },
  { staffId: "INEC-003", password: "Admin1234", name: "Festus Okoye",    title: "National Commissioner", zone: "South-South" },
];

// ── INEC Pre-approved Voter Roll ──────────────────────────────────────────────
// This is the authoritative list. Only NIns listed here can ever register.
// INEC uploads this roll before elections open — voters cannot add themselves.
// Status "pending" = approved but not yet activated.
// Status "active"  = password has been set, voter can log in.
//
// In production this data lives in a secured backend database, not the client.
// It is loaded here for demo purposes only.
const INEC_VOTER_ROLL = [
  // Pre-activated demo accounts (already have passwords set)
  { nin: "12345678901", name: "Amara Okafor",   state: "Lagos",   lga: "Ikeja",        ward: "Ward 3",  pollingUnit: "PU/LA/001", status: "active",  password: "Voter1234" },
  { nin: "23456789012", name: "Bello Musa",      state: "Kano",    lga: "Kano Mun.",    ward: "Ward 7",  pollingUnit: "PU/KN/034", status: "active",  password: "Voter1234" },
  { nin: "34567890123", name: "Chioma Eze",      state: "Enugu",   lga: "Enugu North",  ward: "Ward 1",  pollingUnit: "PU/EN/012", status: "active",  password: "Voter1234" },
  { nin: "45678901234", name: "Danladi Usman",   state: "Kaduna",  lga: "Kaduna North", ward: "Ward 5",  pollingUnit: "PU/KD/007", status: "active",  password: "Voter1234" },
  { nin: "56789012345", name: "Efua Mensah",     state: "Rivers",  lga: "Port Harcourt",ward: "Ward 2",  pollingUnit: "PU/RV/019", status: "active",  password: "Voter1234" },

  // Pending accounts — on the roll but not yet activated (no password)
  // These voters can register by entering their NIN and setting a password
  { nin: "67890123456", name: "Fatima Al-Hassan", state: "Borno",   lga: "Maiduguri",   ward: "Ward 4",  pollingUnit: "PU/BO/022", status: "pending", password: null },
  { nin: "78901234567", name: "Gbenga Adeyemi",   state: "Oyo",     lga: "Ibadan North", ward: "Ward 9", pollingUnit: "PU/OY/055", status: "pending", password: null },
  { nin: "89012345678", name: "Hauwa Suleiman",   state: "Katsina", lga: "Katsina",      ward: "Ward 6", pollingUnit: "PU/KT/031", status: "pending", password: null },
  { nin: "90123456789", name: "Ikenna Okonkwo",   state: "Anambra", lga: "Onitsha",      ward: "Ward 11",pollingUnit: "PU/AN/044", status: "pending", password: null },
  { nin: "01234567890", name: "Jumoke Adesanya",  state: "Lagos",   lga: "Lagos Island", ward: "Ward 3", pollingUnit: "PU/LA/088", status: "pending", password: null },
];

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

  // Use a ref for the voter roll so mutations (activation) are immediate
  // without triggering re-renders of the entire tree
  const voterRoll = useRef(INEC_VOTER_ROLL.map(v => ({ ...v })));

  // ── Audit logger ─────────────────────────────────────────────────────────────
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
    const record = voterRoll.current.find(v => v.nin === nin);

    if (!record) {
      setAuthError(
        "This NIN is not on the INEC electoral register. " +
        "Please visit your Local Government Area (LGA) INEC office to verify your registration."
      );
      return false;
    }

    if (record.status === "pending") {
      setAuthError("Your account has not been activated yet. Please use the Register tab to set your password.");
      return false;
    }

    if (record.password !== password) {
      setAuthError("Incorrect password. Please try again.");
      return false;
    }

    const u = { role: "voter", nin: record.nin, name: record.name, state: record.state, lga: record.lga, ward: record.ward, pollingUnit: record.pollingUnit };
    setUser(u);
    appendAudit({ action: "VOTER_LOGIN", actor: nin.slice(-4).padStart(11, "*"), detail: record.name });
    return true;
  }, [appendAudit]);

  // ── Voter activation (registration) ──────────────────────────────────────────
  // Does NOT create a new voter. Only activates an existing INEC-approved record.
  const activateVoter = useCallback((nin, password, confirmPassword) => {
    setAuthError(null);

    // NIN format check
    if (!/^\d{11}$/.test(nin)) {
      setAuthError("NIN must be exactly 11 digits with no spaces or dashes.");
      return false;
    }

    // Check INEC roll
    const record = voterRoll.current.find(v => v.nin === nin);

    if (!record) {
      setAuthError(
        "NIN not found on the electoral register. " +
        "If you believe this is an error, please visit your nearest INEC LGA office with your original NIMC slip."
      );
      return false;
    }

    if (record.status === "active") {
      setAuthError("This NIN is already activated. Please log in with your password instead.");
      return false;
    }

    // Password strength
    if (password.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return false;
    }

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match. Please re-enter.");
      return false;
    }

    // Activate the record — set password and mark active
    record.password = password;
    record.status   = "active";
    record.activatedAt = new Date().toISOString();

    const u = { role: "voter", nin: record.nin, name: record.name, state: record.state, lga: record.lga, ward: record.ward, pollingUnit: record.pollingUnit };
    setUser(u);
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

  // ── NIN lookup (used by activation step 1) ──────────────────────────────────
  const lookupVoterNin = useCallback((nin) => {
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

  // ── Roll stats (for INEC dashboard) ──────────────────────────────────────────
  const getRollStats = useCallback(() => {
    const roll = voterRoll.current;
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
