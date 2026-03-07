// ─── api/votes.js ─────────────────────────────────────────────────────────────
// POST /api/votes        — submit a vote (enforces one vote per voter per election)
// GET  /api/votes?code=  — verify a receipt code
// GET  /api/votes?nin=   — fetch all elections a voter has already voted in

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const SUPABASE_URL     = process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL)     return res.status(500).json({ error: "VITE_SUPABASE_URL is not set" });
  if (!SERVICE_ROLE_KEY) return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" });

  const sbHeaders = {
    "Content-Type":  "application/json",
    "apikey":        SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    "Prefer":        "return=representation",
  };

  // ── GET /api/votes?code=XXXX  — receipt verification ─────────────────────────
  // ── GET /api/votes?nin=XXXX   — load voted elections for a voter ──────────────
  if (req.method === "GET") {
    const { code, nin } = req.query;

    // Return list of election_ids this voter has already voted in
    if (nin) {
      const maskedNin = nin.slice(-4).padStart(11, "*");
      const sbRes  = await fetch(
        `${SUPABASE_URL}/rest/v1/votes?voter_nin=eq.${encodeURIComponent(maskedNin)}&select=election_id`,
        { headers: sbHeaders }
      );
      const data = await sbRes.json();
      if (!sbRes.ok) return res.status(sbRes.status).json({ error: data });
      return res.status(200).json({ voted_elections: data.map(r => r.election_id) });
    }

    // Receipt code lookup
    if (code) {
      const sbRes  = await fetch(
        `${SUPABASE_URL}/rest/v1/votes?receipt_code=eq.${encodeURIComponent(code)}&select=receipt_code,election_title,created_at`,
        { headers: sbHeaders }
      );
      const data = await sbRes.json();
      if (!sbRes.ok) return res.status(sbRes.status).json({ error: data });
      if (!data || data.length === 0) return res.status(404).json({ valid: false });
      return res.status(200).json({ valid: true, receipt_code: data[0].receipt_code, election_title: data[0].election_title, timestamp: data[0].created_at });
    }

    // Audit log: all votes for INEC dashboard
    const { audit } = req.query;
    if (audit) {
      const sbRes  = await fetch(
        `${SUPABASE_URL}/rest/v1/votes?select=receipt_code,election_title,created_at&order=created_at.desc`,
        { headers: sbHeaders }
      );
      const data = await sbRes.json();
      if (!sbRes.ok) return res.status(sbRes.status).json({ error: data });
      return res.status(200).json({ votes: data });
    }

    return res.status(400).json({ error: "Provide ?code= or ?nin= or ?audit=1" });
  }

  // ── POST /api/votes — submit vote ─────────────────────────────────────────────
  if (req.method === "POST") {
    const body  = req.body;
    if (!body) return res.status(400).json({ error: "Empty body" });

    const votes = Array.isArray(body) ? body : [body];

    for (const vote of votes) {
      if (!vote.code || !vote.electionId || !vote.votes || !vote.timestamp) {
        return res.status(400).json({ error: "Missing required fields: code, electionId, votes, timestamp" });
      }
    }

    const results = [];

    for (const vote of votes) {
      const voterNin       = vote.voterNin || "ANON";
      const maskedNin      = voterNin.slice(-4).padStart(11, "*");
      const electionId     = vote.electionId;

      // ── Check: has this voter already voted in this election? ─────────────────
      const checkRes  = await fetch(
        `${SUPABASE_URL}/rest/v1/votes?voter_nin=eq.${encodeURIComponent(maskedNin)}&election_id=eq.${encodeURIComponent(electionId)}&select=receipt_code`,
        { headers: sbHeaders }
      );
      const existing = await checkRes.json();

      if (existing && existing.length > 0) {
        // Already voted — reject this submission
        return res.status(409).json({
          error:        "already_voted",
          message:      "This voter has already cast a vote in this election.",
          receipt_code: existing[0].receipt_code,
        });
      }

      // ── Insert the vote ───────────────────────────────────────────────────────
      const insertRes  = await fetch(`${SUPABASE_URL}/rest/v1/votes`, {
        method:  "POST",
        headers: sbHeaders,
        body:    JSON.stringify({
          receipt_code:   vote.code,
          election_id:    electionId,
          election_title: vote.electionTitle || "Unknown Election",
          votes_data:     vote.votes,
          voter_nin:      voterNin.slice(-4).padStart(11, "*"),  // store masked for privacy
          hash:           vote.hash || "",
          synced_at:      new Date().toISOString(),
        }),
      });

      if (insertRes.status === 409) {
        // Duplicate receipt_code — already stored, treat as success
        results.push({ code: vote.code, status: "duplicate" });
        continue;
      }

      if (!insertRes.ok) {
        const errData = await insertRes.json().catch(() => ({}));
        console.error("[votes POST] Supabase error:", insertRes.status, JSON.stringify(errData));
        return res.status(insertRes.status).json({ error: errData.message || "Insert failed" });
      }

      results.push({ code: vote.code, status: "recorded" });
    }

    return res.status(200).json({ success: true, results });
  }

  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
