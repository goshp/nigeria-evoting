// ─── api/elections.js ─────────────────────────────────────────────────────────
// Vercel Serverless Function — /api/elections
//
// GET  /api/elections          — fetch all elections (voters + INEC)
// POST /api/elections          — INEC creates a new election
// PATCH /api/elections?id=     — INEC updates status (publish / close)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const SUPABASE_URL     = process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Missing Supabase credentials." });
  }

  const headers = {
    "Content-Type":  "application/json",
    "apikey":        SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
  };

  // ── GET — fetch all elections ordered by created_at desc ─────────────────────
  if (req.method === "GET") {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/elections?select=*&order=created_at.desc`,
        { headers: { ...headers, "Prefer": "return=representation" } }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Fetch failed");
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST — create a new election ──────────────────────────────────────────────
  if (req.method === "POST") {
    const election = req.body;
    if (!election?.id || !election?.title) {
      return res.status(400).json({ error: "Missing required fields: id, title." });
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/elections`,
        {
          method:  "POST",
          headers: { ...headers, "Prefer": "return=representation" },
          body:    JSON.stringify({
            id:                election.id,
            title:             election.title,
            type:              election.type              || "federal",
            date:              election.date,
            time_open:         election.time_open         || "08:00",
            time_close:        election.time_close        || "18:00",
            status:            election.status            || "draft",
            auth_method:       election.auth_method       || [],
            registered_voters: election.registered_voters || 0,
            votes_cast:        0,
            turnout:           0,
            ballots:           election.ballots           || [],
            created_by:        election.created_by        || null,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Insert failed");
      return res.status(200).json(data[0] || data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PATCH — update election status (publish / close) ──────────────────────────
  if (req.method === "PATCH") {
    const { id } = req.query;
    const updates = req.body;

    if (!id) return res.status(400).json({ error: "Missing election id in query." });

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/elections?id=eq.${encodeURIComponent(id)}`,
        {
          method:  "PATCH",
          headers: { ...headers, "Prefer": "return=representation" },
          body:    JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Update failed");
      return res.status(200).json(data[0] || data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} not allowed.` });
}
