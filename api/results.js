// ─── api/results.js ───────────────────────────────────────────────────────────
// GET /api/results?electionId=  — tally votes from the votes table
// Returns election object with candidate vote counts populated

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const SUPABASE_URL     = process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return res.status(500).json({ error: "Missing credentials" });

  const headers = {
    "Content-Type":  "application/json",
    "apikey":        SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    "Prefer":        "return=representation",
  };

  if (req.method === "GET") {
    const { electionId } = req.query;
    if (!electionId) return res.status(400).json({ error: "Missing electionId" });

    // Fetch the election definition
    const elRes  = await fetch(
      `${SUPABASE_URL}/rest/v1/elections?id=eq.${encodeURIComponent(electionId)}&select=*`,
      { headers }
    );
    const elData = await elRes.json();
    if (!elRes.ok || !elData.length) return res.status(404).json({ error: "Election not found" });
    const election = elData[0];

    // Fetch all votes for this election
    const vRes  = await fetch(
      `${SUPABASE_URL}/rest/v1/votes?election_id=eq.${encodeURIComponent(electionId)}&select=votes_data`,
      { headers }
    );
    const vData = await vRes.json();
    if (!vRes.ok) return res.status(vRes.status).json({ error: vData });

    // Tally votes per candidate per ballot
    // votes_data shape: { [ballotId]: candidateId }
    const tally = {}; // { [ballotId]: { [candidateId]: count } }
    for (const row of vData) {
      const votesData = row.votes_data;
      if (!votesData) continue;
      for (const [ballotId, candidateId] of Object.entries(votesData)) {
        if (!tally[ballotId]) tally[ballotId] = {};
        tally[ballotId][candidateId] = (tally[ballotId][candidateId] || 0) + 1;
      }
    }

    // Merge tallies back into election ballots
    const ballots = election.ballots.map(ballot => ({
      ...ballot,
      candidates: ballot.candidates.map(c => ({
        ...c,
        votes: (tally[ballot.id]?.[c.id]) || 0,
      })),
    }));

    return res.status(200).json({
      ...election,
      ballots,
      votes_cast: vData.length,
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
