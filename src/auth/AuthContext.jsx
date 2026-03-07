// ─── auth/AuthContext.jsx ──────────────────────────────────────────────────────
// All voter activations and voted state now persist via Supabase API.
// No more localStorage — all browsers share the same source of truth.

import { createContext, useContext, useState, useCallback } from "react";

// ── INEC Staff accounts (server-side only in production) ──────────────────────
const INEC_STAFF = [
  { staffId: "INEC-001", password: "Admin1234", name: "Mahmood Yakubu",  title: "INEC Chairman",         zone: "National HQ" },
  { staffId: "INEC-002", password: "Admin1234", name: "Ruth Oriaran",    title: "Director ICT",          zone: "National HQ" },
  { staffId: "INEC-003", password: "Admin1234", name: "Festus Okoye",    title: "National Commissioner", zone: "South-South" },
];

// ── INEC Pre-approved Voter Roll (identity data only — no passwords) ───────────
// Passwords live in Supabase voter_activations table, not here.
const INEC_VOTER_ROLL = [
  { nin: "12345678901", name: "Amara Okafor",    state: "Lagos",   lga: "Ikeja",         ward: "Ward 3",  pollingUnit: "PU/LA/001", preActivated: true,  defaultPassword: "Voter1234" },
  { nin: "23456789012", name: "Bello Musa",       state: "Kano",    lga: "Kano Mun.",     ward: "Ward 7",  pollingUnit: "PU/KN/034", preActivated: true,  defaultPassword: "Voter1234" },
  { nin: "34567890123", name: "Chioma Eze",       state: "Enugu",   lga: "Enugu North",   ward: "Ward 1",  pollingUnit: "PU/EN/012", preActivated: true,  defaultPassword: "Voter1234" },
  { nin: "45678901234", name: "Danladi Usman",    state: "Kaduna",  lga: "Kaduna North",  ward: "Ward 5",  pollingUnit: "PU/KD/007", preActivated: true,  defaultPassword: "Voter1234" },
  { nin: "56789012345", name: "Efua Mensah",      state: "Rivers",  lga: "Port Harcourt", ward: "Ward 2",  pollingUnit: "PU/RV/019", preActivated: true,  defaultPassword: "Voter1234" },
  { nin: "67890123456", name: "Fatima Al-Hassan", state: "Borno",   lga: "Maiduguri",     ward: "Ward 4",  pollingUnit: "PU/BO/022", preActivated: false, defaultPassword: null },
  { nin: "78901234567", name: "Gbenga Adeyemi",   state: "Oyo",     lga: "Ibadan North",  ward: "Ward 9",  pollingUnit: "PU/OY/055", preActivated: false, defaultPassword: null },
  { nin: "89012345678", name: "Hauwa Suleiman",   state: "Katsina", lga: "Katsina",       ward: "Ward 6",  pollingUnit: "PU/KT/031", preActivated: false, defaultPassword: null },
  { nin: "90123456789", name: "Ikenna Okonkwo",   state: "Anambra", lga: "Onitsha",       ward: "Ward 11", pollingUnit: "PU/AN/044", preActivated: false, defaultPassword: null },
  { nin: "01234567890", name: "Jumoke Adesanya",  state: "Lagos",   lga: "Lagos Island",  ward: "Ward 3",  pollingUnit: "PU/LA/088", preActivated: false, defaultPassword: null },
];

// ── Simple hash (must match server-side hash in api/activations.js) ───────────
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

// ── Vote receipt hash (for immutability) ─────────────────────────────────────
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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [authError,   setAuthError]   = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [lockedVotes, setLockedVotes] = useState({});
  const [auditTrail,  setAuditTrail]  = useState([]);

  const appendAudit = useCallback((entry) => {
    setAuditTrail(prev => [...prev, { ...entry, timestamp: new Date().toISOString(), id: Date.now() }]);
  }, []);

  // ── INEC login (local — staff accounts don't need Supabase) ──────────────────
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

  // ── Voter login — verifies against Supabase voter_activations ─────────────────
  const loginVoter = useCallback(async (nin, password) => {
    setAuthError(null);
    setAuthLoading(true);

    // Find voter identity on the roll
    const record = INEC_VOTER_ROLL.find(v => v.nin === nin);
    if (!record) {
      setAuthError("This NIN is not on the INEC electoral register. Please visit your LGA INEC office to verify your registration.");
      setAuthLoading(false);
      return false;
    }

    try {
      // Check password against Supabase
      const res  = await fetch("/api/activations", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nin, password, action: "verify" }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Server error");

      if (!data.valid) {
        if (data.reason === "not_activated") {
          // Check if it's a pre-activated demo account with default password
          if (record.preActivated && password === record.defaultPassword) {
            // Seed the activation into Supabase on first login
            await fetch("/api/activations", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({ nin, password, action: "activate" }),
            });
            // Continue to login below
          } else {
            setAuthError("Your account has not been activated yet. Please use the Activate Account tab to set your password.");
            setAuthLoading(false);
            return false;
          }
        } else {
          setAuthError("Incorrect password. Please try again.");
          setAuthLoading(false);
          return false;
        }
      }

      const u = { role: "voter", nin: record.nin, name: record.name, state: record.state, lga: record.lga, ward: record.ward, pollingUnit: record.pollingUnit };
      setUser(u);
      appendAudit({ action: "VOTER_LOGIN", actor: nin.slice(-4).padStart(11, "*"), detail: record.name });

      // Load which elections this voter has already voted in from Supabase
      try {
        const votedRes  = await fetch(`/api/votes?nin=${encodeURIComponent(nin)}`);
        const votedData = await votedRes.json();
        if (votedRes.ok && votedData.voted_elections) {
          const map = {};
          votedData.voted_elections.forEach(elId => { map[`${nin}:${elId}`] = true; });
          setVotedElections(map);
        }
      } catch { /* non-fatal — will be enforced server-side anyway */ }

      setAuthLoading(false);
      return true;

    } catch (err) {
      setAuthError("Login failed — please check your connection and try again.");
      setAuthLoading(false);
      return false;
    }
  }, [appendAudit]);

  // ── NIN lookup — checks Supabase for activation status ───────────────────────
  const lookupVoterNin = useCallback(async (nin) => {
    const record = INEC_VOTER_ROLL.find(v => v.nin === nin);
    if (!record) {
      setAuthError("NIN not found on the electoral register. Please visit your nearest INEC LGA office with your original NIMC slip.");
      return { status: "not_found" };
    }

    try {
      const res  = await fetch(`/api/activations?nin=${encodeURIComponent(nin)}`);
      const data = await res.json();

      if (data.activated) {
        setAuthError("This NIN is already activated. Please use the Log In tab to access your account.");
        return { status: "active" };
      }
      return { status: "pending", name: record.name, state: record.state, lga: record.lga, ward: record.ward };
    } catch {
      // If API unreachable, fall back to checking preActivated flag
      if (record.preActivated) {
        setAuthError("This NIN is already activated. Please use the Log In tab.");
        return { status: "active" };
      }
      return { status: "pending", name: record.name, state: record.state, lga: record.lga, ward: record.ward };
    }
  }, []);

  // ── Voter activation — persists to Supabase voter_activations ────────────────
  const activateVoter = useCallback(async (nin, password, confirmPassword) => {
    setAuthError(null);

    if (!/^\d{11}$/.test(nin)) {
      setAuthError("NIN must be exactly 11 digits with no spaces or dashes.");
      return false;
    }

    const record = INEC_VOTER_ROLL.find(v => v.nin === nin);
    if (!record) {
      setAuthError("NIN not found on the electoral register. Please visit your nearest INEC LGA office with your original NIMC slip.");
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

    setAuthLoading(true);
    try {
      const res  = await fetch("/api/activations", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nin, password, action: "activate" }),
      });
      const data = await res.json();

      if (res.status === 409 || data.error === "already_activated") {
        setAuthError("This NIN is already activated. Please use the Log In tab.");
        setAuthLoading(false);
        return false;
      }
      if (!res.ok) throw new Error(data.error || "Activation failed");

      setUser({ role: "voter", nin: record.nin, name: record.name, state: record.state, lga: record.lga, ward: record.ward, pollingUnit: record.pollingUnit });
      appendAudit({ action: "VOTER_ACTIVATED", actor: nin.slice(-4).padStart(11, "*"), detail: record.name });
      setAuthLoading(false);
      return true;

    } catch (err) {
      setAuthError("Activation failed — please check your connection and try again.");
      setAuthLoading(false);
      return false;
    }
  }, [appendAudit]);

  // ── Logout ────────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    if (user) appendAudit({ action: "LOGOUT", actor: user.staffId || user.nin?.slice(-4).padStart(11, "*"), detail: user.name });
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

  // ── didVote — checks Supabase votes table ─────────────────────────────────────
  // Called as async from App.jsx; cached in local state to avoid re-fetching
  const [votedElections, setVotedElections] = useState({});

  const didVote = useCallback((electionId) => {
    if (!user?.nin) return false;
    return !!votedElections[`${user.nin}:${electionId}`];
  }, [user?.nin, votedElections]);

  const markVoted = useCallback((nin, electionId) => {
    setVotedElections(prev => ({ ...prev, [`${nin}:${electionId}`]: true }));
  }, []);

  const isInec  = user?.role === "inec";
  const isVoter = user?.role === "voter";
  const isGuest = !user;

  return (
    <AuthContext.Provider value={{
      user, isInec, isVoter, isGuest,
      authError, setAuthError, authLoading,
      loginInec, loginVoter, activateVoter, logout,
      commitVote,
      didVote, markVoted,
      lockedVotes, auditTrail,
      lookupVoterNin,
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
