// /api/articles — Read articles from Supabase
// Query params: type=news|factcheck, limit=N, scenario=E1|E2|E3|E4

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;

module.exports = async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const { type, limit = "30", scenario } = req.query;

  // ── Special case: fetch cached ICG from daily_readings ──
  if (type === "icg") {
    try {
      const icgRes = await fetch(
        `${SUPABASE_URL}/rest/v1/daily_readings?select=date,icg_score,icg_actors,icg_provider,icg_articles_count&icg_score=not.is.null&order=date.desc&limit=1`,
        { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }, signal: AbortSignal.timeout(6000) }
      );
      if (!icgRes.ok) return res.status(icgRes.status).json({ error: "Supabase ICG fetch failed" });
      const rows = await icgRes.json();
      if (rows.length === 0) return res.status(200).json({ icg: null, cached: false });
      const row = rows[0];
      let actors = [];
      try { actors = typeof row.icg_actors === "string" ? JSON.parse(row.icg_actors) : (row.icg_actors || []); } catch { actors = []; }
      res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=300");
      return res.status(200).json({
        icg: { index: row.icg_score, actors, provider: row.icg_provider, articles_count: row.icg_articles_count, date: row.date },
        cached: true,
      });
    } catch (e) {
      return res.status(502).json({ error: e.message, icg: null, cached: false });
    }
  }

  // ── Special case: fetch cached news alerts ──
  if (type === "alerts") {
    try {
      const alertsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/news_alerts?select=*&order=classified_at.desc&limit=1`,
        { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }, signal: AbortSignal.timeout(6000) }
      );
      if (!alertsRes.ok) return res.status(alertsRes.status).json({ error: "Supabase alerts fetch failed" });
      const rows = await alertsRes.json();
      if (rows.length === 0) return res.status(200).json({ alerts: null, cached: false });
      const row = rows[0];
      let alerts = [];
      try { alerts = typeof row.alerts === "string" ? JSON.parse(row.alerts) : row.alerts; } catch { alerts = []; }
      const age = Date.now() - new Date(row.classified_at).getTime();
      const stale = age > 8 * 60 * 60 * 1000; // >8h = stale
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=120");
      return res.status(200).json({ alerts, provider: row.provider, classified_at: row.classified_at, stale, age_hours: +(age / 3600000).toFixed(1), cached: true });
    } catch (e) {
      return res.status(502).json({ error: e.message, alerts: null, cached: false });
    }
  }

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
