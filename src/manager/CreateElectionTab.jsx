// ─── manager/CreateElectionTab.jsx ───────────────────────────────────────────
// 4-step wizard for creating a new election:
//   Step 1 – Election Details (title, type, date, hours)
//   Step 2 – Voter Authentication methods
//   Step 3 – Ballot builder (questions + candidates)
//   Step 4 – Voter roll upload & summary submission

import { useState } from "react";

const EMPTY_FORM = () => ({
  id:                 "E" + Date.now(),
  title:              "",
  type:               "federal",
  date:               "",
  time_open:          "08:00",
  time_close:         "18:00",
  auth_method:        ["nin", "otp"],
  registered_voters:  0,
  status:             "draft",
  ballots:            [],
});

const EMPTY_BALLOT    = { title: "", description: "", candidates: [] };
const EMPTY_CANDIDATE = { name: "", party: "" };

export default function CreateElectionTab({ onAdd }) {
  const [form,         setForm]         = useState(EMPTY_FORM());
  const [newBallot,    setNewBallot]    = useState(EMPTY_BALLOT);
  const [newCandidate, setNewCandidate] = useState(EMPTY_CANDIDATE);
  const [voterFile,    setVoterFile]    = useState(null);
  const [step,         setStep]         = useState(1);

  // ── helpers ──────────────────────────────────────────────────────────────
  function toggleAuth(method) {
    setForm(f => ({
      ...f,
      auth_method: f.auth_method.includes(method)
        ? f.auth_method.filter(m => m !== method)
        : [...f.auth_method, method],
    }));
  }

  function addCandidate() {
    if (!newCandidate.name || !newCandidate.party) return;
    const acronym = newCandidate.name
      .split(" ").filter(w => /[A-Z]/.test(w[0])).map(w => w[0]).join("").slice(0, 2) || "XX";
    setNewBallot(b => ({
      ...b,
      candidates: [...b.candidates, { id: "C" + Date.now(), ...newCandidate, acronym }],
    }));
    setNewCandidate(EMPTY_CANDIDATE);
  }

  function addBallot() {
    if (!newBallot.title || newBallot.candidates.length < 2) return;
    setForm(f => ({ ...f, ballots: [...f.ballots, { ...newBallot, id: "B" + Date.now() }] }));
    setNewBallot(EMPTY_BALLOT);
  }

  function handleSubmit() {
    if (!form.title || !form.date || form.ballots.length === 0) return;
    onAdd(form);
    setStep(1);
    setForm(EMPTY_FORM());
    setVoterFile(null);
  }

  // ── step indicator ────────────────────────────────────────────────────────
  const STEPS = ["Election Details", "Authentication", "Ballots & Candidates", "Voters & Submit"];

  return (
    <div>
      <div className="section-title">Create New Election</div>

      {/* Step Pills */}
      <div style={{ display: "flex", gap: 0, marginBottom: "2rem" }}>
        {STEPS.map((label, i) => (
          <div
            key={i}
            onClick={() => setStep(i + 1)}
            style={{
              flex: 1, padding: "0.7rem 1rem", cursor: "pointer", textAlign: "center",
              fontSize: "0.8rem", fontWeight: 600, transition: "all 0.2s",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.2)" : undefined,
              background: step === i + 1 ? "var(--green)" : step > i + 1 ? "var(--green-dark)" : "#f5f3ee",
              color: step >= i + 1 ? "var(--white)" : "var(--gray)",
            }}
          >
            <div style={{ fontSize: "0.7rem", opacity: 0.75, marginBottom: 2 }}>Step {i + 1}</div>
            {label}
          </div>
        ))}
      </div>

      {step === 1 && <Step1Details    form={form} setForm={setForm} onNext={() => setStep(2)} />}
      {step === 2 && <Step2Auth       form={form} toggleAuth={toggleAuth} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && <Step3Ballots    form={form} newBallot={newBallot} setNewBallot={setNewBallot} newCandidate={newCandidate} setNewCandidate={setNewCandidate} addCandidate={addCandidate} addBallot={addBallot} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
      {step === 4 && <Step4Submit     form={form} setForm={setForm} voterFile={voterFile} setVoterFile={setVoterFile} onBack={() => setStep(3)} onSubmit={handleSubmit} />}
    </div>
  );
}

// ── Step 1 – Election Details ─────────────────────────────────────────────────
function Step1Details({ form, setForm, onNext }) {
  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  return (
    <div className="card">
      <div className="card-header"><div className="card-header-title">Election Details</div></div>
      <div className="card-body">
        <div className="form-grid mb-3">
          <div className="form-group form-full">
            <label className="form-label">Election Title</label>
            <input className="form-control" placeholder="e.g. 2027 Federal General Elections" value={form.title} onChange={e => f("title", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Election Type</label>
            <select className="form-control" value={form.type} onChange={e => f("type", e.target.value)}>
              <option value="federal">Federal</option>
              <option value="state">State / Governorship</option>
              <option value="local">Local Government</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Election Date</label>
            <input type="date" className="form-control" value={form.date} onChange={e => f("date", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Voting Opens</label>
            <input type="time" className="form-control" value={form.time_open} onChange={e => f("time_open", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Voting Closes</label>
            <input type="time" className="form-control" value={form.time_close} onChange={e => f("time_close", e.target.value)} />
          </div>
        </div>
        <div className="flex" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={onNext}>Next: Authentication →</button>
        </div>
      </div>
    </div>
  );
}

// ── Step 2 – Authentication ───────────────────────────────────────────────────
const AUTH_OPTIONS = [
  ["nin",       "🪪 NIN Verification",    "Voters enter their 11-digit National Identification Number to validate identity against NIMC records."],
  ["otp",       "📱 OTP via SMS/Email",   "A one-time passcode is sent to the voter's registered phone number or email address."],
  ["biometric", "👆 Biometric Thumbprint","Voter's thumbprint is captured and matched against INEC biometric database."],
  ["photo",     "📷 Facial Recognition",  "Selfie verification matched against the voter's registered photograph."],
];

function Step2Auth({ form, toggleAuth, onBack, onNext }) {
  return (
    <div className="card">
      <div className="card-header"><div className="card-header-title">Voter Authentication Methods</div></div>
      <div className="card-body">
        <p className="text-sm text-gray mb-3">
          Select one or more authentication layers. Voters must pass all selected checks before accessing their ballot.
        </p>
        <div className="form-grid mb-3">
          {AUTH_OPTIONS.map(([key, label, desc]) => {
            const active = form.auth_method.includes(key);
            return (
              <div
                key={key} onClick={() => toggleAuth(key)}
                style={{ border: `2px solid ${active ? "var(--green)" : "var(--gray-light)"}`, borderRadius: "var(--radius)", padding: "1rem", cursor: "pointer", background: active ? "#e8f5ee" : "#fff", transition: "all 0.15s" }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <div className="text-sm text-gray">{desc}</div>
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--green)", background: active ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {active && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                  </div>
                  <span className="text-sm" style={{ color: active ? "var(--green)" : "var(--gray)" }}>
                    {active ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="alert alert-info">
          <span>ℹ️</span>
          <span>Selected: <strong>{form.auth_method.join(", ").toUpperCase() || "None"}</strong>. At least one method required.</span>
        </div>
        <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onBack}>← Back</button>
          <button className="btn btn-primary"   onClick={onNext}>Next: Ballots →</button>
        </div>
      </div>
    </div>
  );
}

// ── Step 3 – Ballots & Candidates ─────────────────────────────────────────────
function Step3Ballots({ form, newBallot, setNewBallot, newCandidate, setNewCandidate, addCandidate, addBallot, onBack, onNext }) {
  return (
    <div>
      <div className="card mb-3">
        <div className="card-header">
          <div className="card-header-title">Define Ballot Questions</div>
          <span className="text-sm text-gray">{form.ballots.length} ballot{form.ballots.length !== 1 ? "s" : ""} added</span>
        </div>
        <div className="card-body">
          {/* Saved ballots list */}
          {form.ballots.length > 0 && (
            <div className="mb-3">
              {form.ballots.map((b, i) => (
                <div key={b.id} style={{ padding: "0.8rem 1rem", background: "#f5f3ee", border: "1px solid var(--gray-light)", borderRadius: "var(--radius)", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>#{i + 1} {b.title}</div>
                    <div className="text-sm text-gray">{b.candidates.length} candidates</div>
                  </div>
                  <span className="chip">✓ Added</span>
                </div>
              ))}
            </div>
          )}

          {/* New ballot builder */}
          <div style={{ border: "1.5px dashed var(--gray-light)", borderRadius: "var(--radius)", padding: "1.5rem" }}>
            <div className="form-group mb-2">
              <label className="form-label">Ballot Title</label>
              <input className="form-control" placeholder="e.g. Presidential Election" value={newBallot.title} onChange={e => setNewBallot(b => ({ ...b, title: e.target.value }))} />
            </div>
            <div className="form-group mb-2">
              <label className="form-label">Ballot Description / Instruction</label>
              <input className="form-control" placeholder="e.g. Vote for one candidate only" value={newBallot.description} onChange={e => setNewBallot(b => ({ ...b, description: e.target.value }))} />
            </div>

            <div className="divider" />
            <div className="form-label mb-2">Add Candidates</div>

            {/* Candidate list preview */}
            {newBallot.candidates.map(c => (
              <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700 }}>{c.acronym}</div>
                <span style={{ fontSize: "0.85rem" }}>{c.name} <span className="text-gray">· {c.party}</span></span>
              </div>
            ))}

            {/* Add candidate fields */}
            <div className="form-grid mt-1">
              <div className="form-group">
                <label className="form-label">Candidate Full Name</label>
                <input className="form-control" placeholder="Full name" value={newCandidate.name} onChange={e => setNewCandidate(c => ({ ...c, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Political Party</label>
                <input className="form-control" placeholder="APC, PDP, LP…" value={newCandidate.party} onChange={e => setNewCandidate(c => ({ ...c, party: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button className="btn btn-secondary btn-sm" onClick={addCandidate}>+ Add Candidate</button>
              <button className="btn btn-primary   btn-sm" onClick={addBallot} disabled={!newBallot.title || newBallot.candidates.length < 2}>✓ Save Ballot</button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn btn-primary"   onClick={onNext} disabled={form.ballots.length === 0}>Next: Voters →</button>
      </div>
    </div>
  );
}

// ── Step 4 – Voters & Submit ──────────────────────────────────────────────────
function Step4Submit({ form, setForm, voterFile, setVoterFile, onBack, onSubmit }) {
  return (
    <div className="card">
      <div className="card-header"><div className="card-header-title">Upload Eligible Voters & Submit</div></div>
      <div className="card-body">
        <div className="form-grid mb-3">
          <div className="form-group">
            <label className="form-label">Estimated Registered Voters</label>
            <input type="number" className="form-control" placeholder="e.g. 87000000"
              value={form.registered_voters || ""}
              onChange={e => setForm(f => ({ ...f, registered_voters: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Voter Roll Format</label>
            <select className="form-control">
              <option>CSV (NIN, Name, Phone, State)</option>
              <option>Excel (.xlsx)</option>
              <option>INEC Database Sync</option>
            </select>
          </div>
        </div>

        {/* Upload zone */}
        <div className="upload-zone mb-3" onClick={() => setVoterFile("voters_roll.csv")}>
          <div className="upload-zone-icon">{voterFile ? "✅" : "📂"}</div>
          {voterFile
            ? <><p><strong>{voterFile}</strong></p><p className="text-sm text-green">Voter roll uploaded successfully</p></>
            : <><p><strong>Click to upload voter roll</strong></p><p className="text-sm">CSV, XLSX, or JSON — up to 100M records</p></>
          }
        </div>

        <div className="alert alert-warning mb-3">
          <span>⚠️</span>
          <span>All voter data is encrypted at rest and in transit. Only authentication hashes are stored — no personal data is retained after the election.</span>
        </div>

        {/* Summary table */}
        <div style={{ background: "#f5f3ee", border: "1px solid var(--gray-light)", borderRadius: "var(--radius)", padding: "1.2rem", marginBottom: "1.5rem" }}>
          <div className="form-label mb-2">Election Summary</div>
          <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["Title",             form.title || "—"],
                ["Type",              form.type],
                ["Date",              form.date  || "—"],
                ["Voting Hours",      `${form.time_open}–${form.time_close}`],
                ["Auth Methods",      form.auth_method.join(", ") || "None"],
                ["Ballots",           form.ballots.length],
                ["Registered Voters", (form.registered_voters || 0).toLocaleString()],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: "0.4rem 0", color: "var(--gray)", width: "40%" }}>{k}</td>
                  <td style={{ fontWeight: 600 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onBack}>← Back</button>
          <button className="btn btn-gold" onClick={onSubmit} disabled={!form.title || !form.date || form.ballots.length === 0}>
            💾 Save Election as Draft
          </button>
        </div>
      </div>
    </div>
  );
}
