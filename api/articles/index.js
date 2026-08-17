// /api/articles — Read articles from Supabase
// Query params: type=news|factcheck, limit=N, scenario=E1|E2|E3|E4

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;

// Public, read-only dataset used by the Gacetas monitor. Keeping this route in
// /api/articles avoids consuming an additional Vercel Serverless Function.
const GACETAS_URL = "https://asbimzawahtyrhpwrrld.supabase.co";
const GACETAS_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzYmltemF3YWh0eXJocHdycmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzUzMjAsImV4cCI6MjA4NjE1MTMyMH0.sF5JDpw6RC6vb9btaw8SPt78l17hkdphz-0tMWW4MsI";
const GACETAS_HEADERS = { apikey: GACETAS_ANON, Authorization: `Bearer ${GACETAS_ANON}` };

async function fetchGacetas(req, res) {
  try {
    const batchResponse = await fetch(`${GACETAS_URL}/rest/v1/gazette_batches?select=id,uploaded_at&is_active=eq.true&order=uploaded_at.desc&limit=1`, { headers:GACETAS_HEADERS, signal:AbortSignal.timeout(10000) });
    if (!batchResponse.ok) throw new Error(`Gacetas batches: ${batchResponse.status}`);
    const [batch] = await batchResponse.json();
    if (!batch) return res.status(200).json({ records:[], total:0, external:true });

    const requestedLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const limit = Math.min(Math.max(parseInt(requestedLimit, 10) || 5000, 1), 5000);
    const fields = "id,gazette_number,gazette_type,gazette_date,decree_number,change_type,change_label,person_name,post_or_position,institution,organism,is_military_person,military_rank,is_military_post,summary";
    const records = [];
    for (let offset=0; offset<limit; offset+=1000) {
      const pageSize = Math.min(1000, limit-offset);
      const recordsResponse = await fetch(`${GACETAS_URL}/rest/v1/gazette_records?select=${fields}&batch_id=eq.${batch.id}&order=gazette_date.desc,id.desc&offset=${offset}&limit=${pageSize}`, { headers:GACETAS_HEADERS, signal:AbortSignal.timeout(15000) });
      if (!recordsResponse.ok) throw new Error(`Gacetas records: ${recordsResponse.status}`);
      const page = await recordsResponse.json();
      records.push(...page);
      if (page.length < pageSize) break;
    }
    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
    return res.status(200).json({ records, total:records.length, batchUpdatedAt:batch.uploaded_at, external:true });
  } catch (error) {
    return res.status(502).json({ error:error.message, records:[], total:0 });
  }
}

module.exports = async function handler(req, res) {
  const { type, limit = "30", scenario } = req.query;

  if (type === "gacetas") {
    if (req.method !== "GET") return res.status(405).json({ error:"Method not allowed" });
    return fetchGacetas(req, res);
  }

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  // ── Special case: fetch daily ICG history for chart ──
  if (type === "icg_history") {
    try {
      const icgRes = await fetch(
        `${SUPABASE_URL}/rest/v1/daily_readings?select=date,icg_score,icg_provider&icg_score=not.is.null&order=date.asc&limit=90`,
        { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }, signal: AbortSignal.timeout(6000) }
      );
      if (!icgRes.ok) return res.status(icgRes.status).json({ error: "Supabase ICG history fetch failed" });
      const rows = await icgRes.json();
      res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=600");
      return res.status(200).json({ readings: rows });
    } catch (e) {
      return res.status(502).json({ error: e.message, readings: [] });
    }
  }

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
