// ─── api/votes.js ─────────────────────────────────────────────────────────────
// Vercel Serverless Function — POST /api/votes
//
// Receives encrypted vote receipts from the client offline queue and
// persists them to Supabase Postgres. The service role key is used
// server-side only — it never reaches the browser.
//
// Endpoints:
//   POST /api/votes        — submit a single vote or batch of votes
//   GET  /api/votes?code=  — verify a receipt code exists

export default async function handler(req, res) {
  // ── CORS headers ────────────────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ── Environment check ────────────────────────────────────────────────────────
  const SUPABASE_URL      = process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Server misconfiguration — missing Supabase credentials." });
  }

  const supabaseHeaders = {
    "Content-Type":  "application/json",
    "apikey":        SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    "Prefer":        "return=minimal",
  };

  // ── GET /api/votes?code=XXXX-XXXX-XXXX-XXXX ─────────────────────────────────
  // Public receipt verification — checks if a code exists in the database
  if (req.method === "GET") {
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({ error: "Missing receipt code." });
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/votes?receipt_code=eq.${encodeURIComponent(code)}&select=receipt_code,election_title,created_at`,
        { headers: { ...supabaseHeaders, "Prefer": "return=representation" } }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Supabase query failed");
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ valid: false, message: "Receipt code not found." });
      }

      return res.status(200).json({
        valid:          true,
        receipt_code:   data[0].receipt_code,
        election_title: data[0].election_title,
        timestamp:      data[0].created_at,
      });

    } catch (err) {
      return res.status(500).json({ error: "Verification failed.", detail: err.message });
    }
  }

  // ── POST /api/votes ──────────────────────────────────────────────────────────
  // Accepts a single vote object or an array (batch flush from offline queue)
  if (req.method === "POST") {
    const body = req.body;

    if (!body) {
      return res.status(400).json({ error: "Empty request body." });
    }

    // Normalise to array — supports single vote or batch
    const votes = Array.isArray(body) ? body : [body];

    if (votes.length === 0) {
      return res.status(400).json({ error: "No votes provided." });
    }

    // Validate each vote has required fields
    for (const vote of votes) {
      if (!vote.code || !vote.electionId || !vote.votes || !vote.timestamp) {
        return res.status(400).json({
          error: "Invalid vote payload — missing required fields.",
          required: ["code", "electionId", "votes", "timestamp"],
        });
      }
    }

    // Map client payload to database columns
    const rows = votes.map(vote => ({
      receipt_code:   vote.code,
      election_id:    vote.electionId,
      election_title: vote.electionTitle || "Unknown Election",
      votes_data:     vote.votes,
      voter_nin:      vote.voterNin     || "ANON",
      hash:           vote.hash         || "",
      synced_at:      new Date().toISOString(),
    }));

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/votes`,
        {
          method:  "POST",
          headers: supabaseHeaders,
          body:    JSON.stringify(rows),
        }
      );

      // 409 Conflict = receipt code already exists (duplicate submission)
      // Treat as success — the vote is already safely stored
      if (response.status === 409) {
        return res.status(200).json({
          success:   true,
          synced:    votes.length,
          duplicate: true,
          message:   "Vote already recorded — no duplicate created.",
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Supabase error ${response.status}`);
      }

      return res.status(200).json({
        success: true,
        synced:  votes.length,
        message: `${votes.length} vote(s) successfully recorded.`,
      });

    } catch (err) {
      console.error("[/api/votes] POST error:", err.message);
      return res.status(500).json({
        error:  "Failed to record vote(s).",
        detail: err.message,
      });
    }
  }

  // ── Method not allowed ───────────────────────────────────────────────────────
  return res.status(405).json({ error: `Method ${req.method} not allowed.` });
}
