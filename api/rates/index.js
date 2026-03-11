// /api/rates — Read exchange rate history from Supabase

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;

module.exports = async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const { limit = "90" } = req.query;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rates?select=*&order=date.asc&limit=${limit}`,
      {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        signal: AbortSignal.timeout(6000),
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: `Supabase: ${response.statusText}` });
    }

    const rates = await response.json();

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=120");
    return res.status(200).json({ rates, total: rates.length });
  } catch (e) {
    return res.status(502).json({ error: e.message, rates: [] });
  }
}
