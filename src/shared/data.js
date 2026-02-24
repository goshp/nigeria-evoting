// ─── shared/data.js ───────────────────────────────────────────────────────────
// Seed elections data and shared utility functions used across all modules.

// ── SEED DATA ─────────────────────────────────────────────────────────────────
export const INITIAL_ELECTIONS = [
  {
    id: "E2027-FED",
    title: "2027 Federal General Elections",
    type: "federal",
    date: "2027-02-20",
    time_open: "08:00",
    time_close: "18:00",
    status: "draft",
    auth_method: ["nin", "otp", "biometric"],
    registered_voters: 87432615,
    votes_cast: 0,
    turnout: 0,
    ballots: [
      {
        id: "B1",
        title: "Presidential Election",
        description: "Vote for President of the Federal Republic of Nigeria",
        candidates: [
          { id: "C1",  name: "Aminu Waziri Tambuwal",  party: "PDP",  acronym: "AW" },
          { id: "C2",  name: "Bola Ahmed Tinubu",       party: "APC",  acronym: "BT" },
          { id: "C3",  name: "Peter Gregory Obi",        party: "LP",   acronym: "PO" },
          { id: "C4",  name: "Rabiu Musa Kwankwaso",    party: "NNPP", acronym: "RK" },
        ],
      },
      {
        id: "B2",
        title: "Senatorial Election – Abuja FCT",
        description: "Vote for your Senator – Federal Capital Territory",
        candidates: [
          { id: "C5",  name: "Philip Aduda",   party: "PDP", acronym: "PA" },
          { id: "C6",  name: "Abubakar Gana",  party: "APC", acronym: "AG" },
          { id: "C7",  name: "Ngozi Ndukwe",   party: "LP",  acronym: "NN" },
        ],
      },
      {
        id: "B3",
        title: "House of Representatives – Abuja Municipal",
        description: "Vote for your Representative in the House",
        candidates: [
          { id: "C8",  name: "Babajimi Benson",   party: "APC", acronym: "BB" },
          { id: "C9",  name: "Kayode Oladele",     party: "PDP", acronym: "KO" },
          { id: "C10", name: "Chiamaka Eze",        party: "LP",  acronym: "CE" },
        ],
      },
    ],
  },
  {
    id: "E2027-GOV",
    title: "2027 Governorship & State Assembly Elections",
    type: "state",
    date: "2027-03-06",
    time_open: "08:00",
    time_close: "18:00",
    status: "draft",
    auth_method: ["nin", "otp"],
    registered_voters: 87432615,
    votes_cast: 0,
    turnout: 0,
    ballots: [
      {
        id: "B4",
        title: "Governorship Election – Lagos State",
        description: "Vote for the Governor of Lagos State",
        candidates: [
          { id: "C11", name: "Babajide Olusola Sanwo-Olu", party: "APC", acronym: "BS" },
          { id: "C12", name: "Abdul-Azeez Adediran",        party: "PDP", acronym: "AA" },
          { id: "C13", name: "Rhodes-Vivour Gbadebo",        party: "LP",  acronym: "RV" },
        ],
      },
      {
        id: "B5",
        title: "State House of Assembly – Ikeja Constituency",
        description: "Vote for your representative in the Lagos State Assembly",
        candidates: [
          { id: "C14", name: "Tunde Braimoh",   party: "APC", acronym: "TB" },
          { id: "C15", name: "Olufemi Dawodu",  party: "PDP", acronym: "OD" },
          { id: "C16", name: "Adewale Mogaji",  party: "LP",  acronym: "AM" },
        ],
      },
    ],
  },
  {
    id: "E2023-FED",
    title: "2023 Federal General Elections",
    type: "federal",
    date: "2023-02-25",
    time_open: "08:00",
    time_close: "18:00",
    status: "closed",
    auth_method: ["nin", "otp", "biometric"],
    registered_voters: 93469008,
    votes_cast: 24210929,
    turnout: 25.9,
    ballots: [
      {
        id: "B6",
        title: "Presidential Election",
        description: "Vote for President of the Federal Republic of Nigeria",
        candidates: [
          { id: "D1", name: "Bola Ahmed Tinubu",    party: "APC",  acronym: "BT", votes: 8794726 },
          { id: "D2", name: "Atiku Abubakar",        party: "PDP",  acronym: "AA", votes: 6984520 },
          { id: "D3", name: "Peter Gregory Obi",     party: "LP",   acronym: "PO", votes: 6101533 },
          { id: "D4", name: "Rabiu Musa Kwankwaso",  party: "NNPP", acronym: "RK", votes: 1496687 },
        ],
      },
    ],
  },
];

// ── UTILITIES ─────────────────────────────────────────────────────────────────

/**
 * Generates a unique 16-character voting receipt code in XXXX-XXXX-XXXX-XXXX format.
 * Uses only unambiguous alphanumeric characters (no 0/O or 1/I confusion).
 */
export function generateReceiptCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Builds an initial draftVotes map: { [ballotId]: null } for all ballots
 * across all given elections. Used to reset voter state.
 */
export function initDraftVotes(elections) {
  const v = {};
  elections.forEach(e => e.ballots.forEach(b => { v[b.id] = null; }));
  return v;
}
