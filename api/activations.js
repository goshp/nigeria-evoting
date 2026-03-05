// ─── api/activations.js ───────────────────────────────────────────────────────
// Vercel Serverless Function — /api/activations
//
// GET  /api/activations?nin=   — check if a NIN is activated
// POST /api/activations        — activate a voter account (set password)
//
// Passwords are stored as a simple hash (demo).
// Production should use bcrypt via a proper auth provider.

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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
    "Prefer":        "return=representation",
  };

  // ── GET — check activation status for a NIN ───────────────────────────────────
  if (req.method === "GET") {
    const { nin } = req.query;
    if (!nin) return res.status(400).json({ error: "Missing NIN." });

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/voter_activations?nin=eq.${encodeURIComponent(nin)}&select=nin,activated_at`,
        { headers }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Query failed");

      if (!data || data.length === 0) {
        return res.status(200).json({ activated: false });
      }
      return res.status(200).json({ activated: true, activated_at: data[0].activated_at });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST — activate account or verify password ────────────────────────────────
  // Body: { nin, password, action: "activate" | "verify" }
  if (req.method === "POST") {
    const { nin, password, action } = req.body || {};

    if (!nin || !password) {
      return res.status(400).json({ error: "Missing nin or password." });
    }

    const passwordHash = simpleHash(password);

    // ── verify: check password matches stored hash ──────────────────────────────
    if (action === "verify") {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/voter_activations?nin=eq.${encodeURIComponent(nin)}&select=nin,password_hash`,
          { headers }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Query failed");

        if (!data || data.length === 0) {
          return res.status(200).json({ valid: false, reason: "not_activated" });
        }
        if (data[0].password_hash !== passwordHash) {
          return res.status(200).json({ valid: false, reason: "wrong_password" });
        }
        return res.status(200).json({ valid: true });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }

    // ── activate: insert new activation record ──────────────────────────────────
    if (action === "activate") {
      try {
        // Check not already activated
        const checkRes = await fetch(
          `${SUPABASE_URL}/rest/v1/voter_activations?nin=eq.${encodeURIComponent(nin)}&select=nin`,
          { headers }
        );
        const existing = await checkRes.json();
        if (existing && existing.length > 0) {
          return res.status(409).json({ error: "already_activated" });
        }

        // Insert activation
        const insertRes = await fetch(
          `${SUPABASE_URL}/rest/v1/voter_activations`,
          {
            method:  "POST",
            headers,
            body:    JSON.stringify({
              nin,
              password_hash: passwordHash,
              activated_at:  new Date().toISOString(),
            }),
          }
        );
        const inserted = await insertRes.json();
        if (!insertRes.ok) throw new Error(inserted.message || "Insert failed");
        return res.status(200).json({ success: true, activated_at: inserted[0]?.activated_at });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }

    return res.status(400).json({ error: "Invalid action. Use 'activate' or 'verify'." });
  }

  return res.status(405).json({ error: `Method ${req.method} not allowed.` });
}
