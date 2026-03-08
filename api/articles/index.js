// /api/articles — Read articles from Supabase
// Query params: type=news|factcheck, limit=N, scenario=E1|E2|E3|E4

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const { type, limit = "30", scenario } = req.query;

  let url = `${SUPABASE_URL}/rest/v1/articles?select=*&order=published_at.desc&limit=${limit}`;
  if (type) url += `&type=eq.${type}`;
  if (scenario) url += `&scenarios=cs.{${scenario}}`;

  try {
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Supabase: ${response.statusText}` });
    }

    const articles = await response.json();

    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=60");
    return res.status(200).json({ articles, total: articles.length });
  } catch (e) {
    return res.status(502).json({ error: e.message, articles: [] });
  }
}
