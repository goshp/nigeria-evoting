// ─── manager/CreateElectionTab.jsx ───────────────────────────────────────────
// 4-step wizard for creating a new election.
// Step 4 now has two submit options:
//   "Save as Draft"   → status: "draft"  (visible only to INEC)
//   "Save & Publish"  → status: "active" (voters can see and vote immediately)

import { useState } from "react";

const EMPTY_FORM = () => ({
  id:                "E" + Date.now(),
  title:             "",
  type:              "federal",
  date:              "",
  time_open:         "08:00",
  time_close:        "18:00",
  auth_method:       ["nin", "otp"],
  registered_voters: 0,
  status:            "draft",
  ballots:           [],
});

const EMPTY_BALLOT    = { title: "", description: "", candidates: [] };
const EMPTY_CANDIDATE = { name: "", party: "" };

export default function CreateElectionTab({ onAdd }) {
  const [form,         setForm]         = useState(EMPTY_FORM());
  const [newBallot,    setNewBallot]    = useState(EMPTY_BALLOT);
  const [newCandidate, setNewCandidate] = useState(EMPTY_CANDIDATE);
  const [voterFile,    setVoterFile]    = useState(null);
  const [step,         setStep]         = useState(1);
  const [saved,        setSaved]        = useState(null); // "draft" | "active"

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

  function handleSubmit(publishNow) {
    if (!form.title || !form.date || form.ballots.length === 0) return;
    const finalForm = { ...form, status: publishNow ? "active" : "draft" };
    onAdd(finalForm);
    setSaved(publishNow ? "active" : "draft");
    // Reset after short delay so INEC sees the success message
    setTimeout(() => {
      setStep(1);
      setForm(EMPTY_FORM());
      setVoterFile(null);
      setSaved(null);
    }, 3000);
  }

  const STEPS = ["Election Details", "Authentication", "Ballots & Candidates", "Review & Submit"];

  // ── Success banner ─────────────────────────────────────────────────────────
  if (saved) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"50vh", padding:"2rem", fontFamily:"var(--font-sans)" }}>
        <div style={{ textAlign:"center", maxWidth:460 }}>
          <div style={{ fontSize:"4rem", marginBottom:"1rem" }}>{saved === "active" ? "✅" : "💾"}</div>
          <h2 style={{ color:"#004d29", marginBottom:"0.5rem" }}>
            {saved === "active" ? "Election Published!" : "Election Saved as Draft"}
          </h2>
          <p style={{ color:"#555", lineHeight:1.7 }}>
            {saved === "active"
              ? "The election is now live. Registered voters can log in and cast their ballots immediately."
              : "The election has been saved. Return to the Elections tab and click Publish when you are ready to open voting."}
          </p>
          <div style={{ marginTop:"1rem", fontSize:"0.8rem", color:"#aaa" }}>Returning to wizard…</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-title">Create New Election</div>

      {/* Step pills */}
      <div style={{ display:"flex", gap:0, marginBottom:"2rem" }}>
        {STEPS.map((label, i) => (
          <div key={i} onClick={() => setStep(i + 1)} style={{
            flex:1, padding:"0.7rem 1rem", cursor:"pointer", textAlign:"center",
            fontSize:"0.8rem", fontWeight:600, transition:"all 0.2s",
            borderRight: i < 3 ? "1px solid rgba(255,255,255,0.2)" : undefined,
            background: step === i+1 ? "var(--green)" : step > i+1 ? "var(--green-dark)" : "#f5f3ee",
            color: step >= i+1 ? "var(--white)" : "var(--gray)",
          }}>
            <div style={{ fontSize:"0.7rem", opacity:0.75, marginBottom:2 }}>Step {i+1}</div>
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

// ── Step 1 ────────────────────────────────────────────────────────────────────
function Step1Details({ form, setForm, onNext }) {
  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const valid = form.title && form.date;
  return (
    <div className="card">
      <div className="card-header"><div className="card-header-title">Election Details</div></div>
      <div className="card-body">
        <div className="form-grid mb-3">
          <div className="form-group form-full">
            <label className="form-label">Election Title *</label>
            <input className="form-control" placeholder="e.g. 2027 Federal General Elections"
              value={form.title} onChange={e => f("title", e.target.value)} />
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
            <label className="form-label">Election Date *</label>
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
        <div className="flex gap-2" style={{ justifyContent:"flex-end" }}>
          <button className="btn btn-primary" onClick={onNext} disabled={!valid}>Next: Authentication →</button>
        </div>
      </div>
    </div>
  );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────
function Step2Auth({ form, toggleAuth, onBack, onNext }) {
  const AUTH_OPTIONS = [
    { key:"nin",        label:"NIN Verification",   desc:"11-digit National Identification Number checked against NIMC database" },
    { key:"otp",        label:"OTP via SMS/Email",   desc:"6-digit one-time passcode sent to registered phone or email" },
    { key:"biometric",  label:"Biometric Thumbprint",desc:"Fingerprint matched against INEC biometric register" },
    { key:"facial",     label:"Facial Recognition",  desc:"Live face match against NIMC photo database" },
  ];
  return (
    <div className="card">
      <div className="card-header"><div className="card-header-title">Voter Authentication Methods</div></div>
      <div className="card-body">
        <p className="text-sm text-gray mb-3">Select one or more methods voters must complete before accessing their ballot.</p>
        {AUTH_OPTIONS.map(opt => (
          <div key={opt.key} onClick={() => toggleAuth(opt.key)} style={{
            display:"flex", alignItems:"center", gap:"1rem", padding:"0.9rem 1rem",
            border:`2px solid ${form.auth_method.includes(opt.key) ? "var(--green)" : "var(--gray-light)"}`,
            borderRadius:"var(--radius)", marginBottom:"0.75rem", cursor:"pointer",
            background: form.auth_method.includes(opt.key) ? "#e8f5ee" : "#fafafa",
          }}>
            <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${form.auth_method.includes(opt.key) ? "var(--green)" : "#ccc"}`, background: form.auth_method.includes(opt.key) ? "var(--green)" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {form.auth_method.includes(opt.key) && <span style={{ color:"#fff", fontSize:"0.7rem" }}>✓</span>}
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:"0.9rem" }}>{opt.label}</div>
              <div style={{ fontSize:"0.78rem", color:"var(--gray)" }}>{opt.desc}</div>
            </div>
          </div>
        ))}
        <div className="flex gap-2" style={{ justifyContent:"flex-end", marginTop:"1rem" }}>
          <button className="btn btn-secondary" onClick={onBack}>← Back</button>
          <button className="btn btn-primary"   onClick={onNext} disabled={form.auth_method.length === 0}>Next: Ballots →</button>
        </div>
      </div>
    </div>
  );
}

// ── Step 3 ────────────────────────────────────────────────────────────────────
function Step3Ballots({ form, newBallot, setNewBallot, newCandidate, setNewCandidate, addCandidate, addBallot, onBack, onNext }) {
  return (
    <div className="card">
      <div className="card-header"><div className="card-header-title">Ballots & Candidates</div></div>
      <div className="card-body">
        {/* Existing ballots */}
        {form.ballots.map((b, i) => (
          <div key={b.id} style={{ background:"#f0f9f4", border:"1px solid #b8dfc9", borderRadius:"var(--radius)", padding:"0.9rem 1rem", marginBottom:"0.75rem" }}>
            <div style={{ fontWeight:700, color:"var(--green-dark)", marginBottom:"0.3rem" }}>✅ Ballot {i+1}: {b.title}</div>
            <div style={{ fontSize:"0.8rem", color:"var(--gray)" }}>{b.candidates.map(c => `${c.name} (${c.party})`).join(" · ")}</div>
          </div>
        ))}

        {/* New ballot builder */}
        <div style={{ border:"2px dashed var(--gray-light)", borderRadius:"var(--radius)", padding:"1.2rem", marginBottom:"1rem" }}>
          <div className="form-label mb-2">Add Ballot Question</div>
          <div className="form-grid mb-2">
            <div className="form-group form-full">
              <label className="form-label">Ballot Title</label>
              <input className="form-control" placeholder="e.g. Presidential Election" value={newBallot.title} onChange={e => setNewBallot(b => ({ ...b, title: e.target.value }))} />
            </div>
            <div className="form-group form-full">
              <label className="form-label">Description</label>
              <input className="form-control" placeholder="e.g. Vote for President of the Federal Republic" value={newBallot.description} onChange={e => setNewBallot(b => ({ ...b, description: e.target.value }))} />
            </div>
          </div>

          {/* Candidates */}
          {newBallot.candidates.length > 0 && (
            <div style={{ marginBottom:"0.75rem" }}>
              {newBallot.candidates.map((c, i) => (
                <span key={i} style={{ display:"inline-block", background:"var(--green-dark)", color:"#fff", borderRadius:"12px", padding:"0.2rem 0.75rem", fontSize:"0.78rem", marginRight:"0.4rem", marginBottom:"0.3rem" }}>
                  {c.name} · {c.party}
                </span>
              ))}
            </div>
          )}

          <div className="form-grid mb-2">
            <div className="form-group">
              <label className="form-label">Candidate Name</label>
              <input className="form-control" placeholder="Full name" value={newCandidate.name} onChange={e => setNewCandidate(c => ({ ...c, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Party</label>
              <input className="form-control" placeholder="APC, PDP, LP…" value={newCandidate.party} onChange={e => setNewCandidate(c => ({ ...c, party: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={addCandidate} disabled={!newCandidate.name || !newCandidate.party}>+ Add Candidate</button>
            <button className="btn btn-primary btn-sm"   onClick={addBallot}    disabled={!newBallot.title || newBallot.candidates.length < 2}>✓ Save Ballot</button>
          </div>
        </div>

        <div className="flex gap-2" style={{ justifyContent:"flex-end" }}>
          <button className="btn btn-secondary" onClick={onBack}>← Back</button>
          <button className="btn btn-primary"   onClick={onNext} disabled={form.ballots.length === 0}>Next: Review →</button>
        </div>
      </div>
    </div>
  );
}

// ── Step 4 ────────────────────────────────────────────────────────────────────
function Step4Submit({ form, setForm, voterFile, setVoterFile, onBack, onSubmit }) {
  const isReady = form.title && form.date && form.ballots.length > 0;
  return (
    <div className="card">
      <div className="card-header"><div className="card-header-title">Review & Submit</div></div>
      <div className="card-body">

        <div className="form-grid mb-3">
          <div className="form-group">
            <label className="form-label">Estimated Registered Voters</label>
            <input type="number" className="form-control" placeholder="e.g. 87000000"
              value={form.registered_voters || ""}
              onChange={e => setForm(f => ({ ...f, registered_voters: parseInt(e.target.value) || 0 }))} />
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

        <div className="upload-zone mb-3" onClick={() => setVoterFile("voters_roll.csv")}>
          <div className="upload-zone-icon">{voterFile ? "✅" : "📂"}</div>
          {voterFile
            ? <><p><strong>{voterFile}</strong></p><p className="text-sm text-green">Voter roll uploaded successfully</p></>
            : <><p><strong>Click to upload voter roll</strong></p><p className="text-sm">CSV, XLSX, or JSON — up to 100M records</p></>}
        </div>

        {/* Summary */}
        <div style={{ background:"#f5f3ee", border:"1px solid var(--gray-light)", borderRadius:"var(--radius)", padding:"1.2rem", marginBottom:"1.5rem" }}>
          <div className="form-label mb-2">Election Summary</div>
          <table style={{ width:"100%", fontSize:"0.85rem", borderCollapse:"collapse" }}>
            <tbody>
              {[
                ["Title",             form.title || "—"],
                ["Type",              form.type],
                ["Date",              form.date  || "—"],
                ["Voting Hours",      `${form.time_open} – ${form.time_close}`],
                ["Auth Methods",      form.auth_method.join(", ") || "None"],
                ["Ballots",           `${form.ballots.length} ballot(s), ${form.ballots.reduce((n,b) => n + b.candidates.length, 0)} candidates total`],
                ["Registered Voters", (form.registered_voters || 0).toLocaleString()],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding:"0.4rem 0", color:"var(--gray)", width:"40%" }}>{k}</td>
                  <td style={{ fontWeight:600 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Two submit buttons ───────────────────────────────────────────── */}
        <div style={{ background:"#fffbf0", border:"1px solid #f0c674", borderRadius:"10px", padding:"1rem 1.2rem", marginBottom:"1.2rem", fontSize:"0.84rem", color:"#5a4200" }}>
          <strong>⚠️ Publishing is immediate.</strong> Once published, registered voters can log in and cast their votes right away. Save as Draft if you need to review before going live.
        </div>

        <div className="flex gap-2" style={{ justifyContent:"flex-end" }}>
          <button className="btn btn-secondary" onClick={onBack}>← Back</button>
          <button
            className="btn btn-gold"
            onClick={() => onSubmit(false)}
            disabled={!isReady}
            title="Save as draft — only visible to INEC admins"
          >
            💾 Save as Draft
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onSubmit(true)}
            disabled={!isReady}
            title="Publish now — voters can vote immediately"
            style={{ background:"linear-gradient(135deg, #006837, #1a8a4a)", fontWeight:700 }}
          >
            🚀 Save & Publish Now
          </button>
        </div>
      </div>
    </div>
  );
}
