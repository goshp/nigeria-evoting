// ─── api/elections.js ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const SUPABASE_URL     = process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Surface credential problems clearly
  if (!SUPABASE_URL)     return res.status(500).json({ error: "VITE_SUPABASE_URL is not set" });
  if (!SERVICE_ROLE_KEY) return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" });

  const base = `${SUPABASE_URL}/rest/v1/elections`;
  const headers = {
    "Content-Type":  "application/json",
    "apikey":        SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    "Prefer":        "return=representation",
  };

  // ── GET ───────────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const sbRes  = await fetch(`${base}?select=*&order=created_at.desc`, { headers });
    const sbData = await sbRes.json();
    if (!sbRes.ok) return res.status(sbRes.status).json({ error: sbData });
    return res.status(200).json(sbData);
  }

  // ── POST ──────────────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    const el = req.body;
    if (!el?.id || !el?.title) return res.status(400).json({ error: "Missing id or title" });

    const payload = {
      id:                el.id,
      title:             el.title,
      type:              el.type              || "federal",
      date:              el.date              || "",
      time_open:         el.time_open         || "08:00",
      time_close:        el.time_close        || "18:00",
      status:            el.status            || "draft",
      auth_method:       el.auth_method       || [],
      registered_voters: Number(el.registered_voters) || 0,
      votes_cast:        0,
      turnout:           0,
      ballots:           el.ballots           || [],
      created_by:        el.created_by        || null,
    };

    const sbRes  = await fetch(base, { method: "POST", headers, body: JSON.stringify(payload) });
    const sbData = await sbRes.json();

    // Log the full Supabase response for debugging
    console.log("[elections POST] status:", sbRes.status, "body:", JSON.stringify(sbData));

    if (!sbRes.ok) return res.status(sbRes.status).json({ error: sbData });
    return res.status(200).json(Array.isArray(sbData) ? sbData[0] : sbData);
  }

  // ── PATCH ─────────────────────────────────────────────────────────────────────
  if (req.method === "PATCH") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id in query" });

    const updates = { ...req.body, updated_at: new Date().toISOString() };
    const sbRes   = await fetch(`${base}?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH", headers, body: JSON.stringify(updates),
    });
    const sbData = await sbRes.json();

    console.log("[elections PATCH] status:", sbRes.status, "body:", JSON.stringify(sbData));

    if (!sbRes.ok) return res.status(sbRes.status).json({ error: sbData });
    return res.status(200).json(Array.isArray(sbData) ? sbData[0] : sbData);
  }

  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
