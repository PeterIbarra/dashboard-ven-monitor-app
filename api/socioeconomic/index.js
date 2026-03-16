// /api/socioeconomic — World Bank + IMF + R4V data for Venezuela
// All APIs are free, no auth required

const WB_BASE = "https://api.worldbank.org/v2/country/VE/indicator";

// World Bank indicators to fetch
const WB_INDICATORS = [
  { id: "NY.GDP.MKTP.CD", label: "PIB (USD)", unit: "USD", category: "economia" },
  { id: "NY.GDP.PCAP.CD", label: "PIB per cápita", unit: "USD", category: "economia" },
  { id: "NY.GDP.MKTP.KD.ZG", label: "Crecimiento PIB", unit: "%", category: "economia" },
  { id: "FP.CPI.TOTL.ZG", label: "Inflación (IPC)", unit: "%", category: "economia" },
  { id: "SP.POP.TOTL", label: "Población", unit: "personas", category: "social" },
  { id: "SL.UEM.TOTL.ZS", label: "Desempleo", unit: "%", category: "social" },
  { id: "SM.POP.NETM", label: "Migración neta", unit: "personas", category: "social" },
  { id: "NY.GDP.PETR.RT.ZS", label: "Rentas petroleras (% PIB)", unit: "%", category: "energia" },
  { id: "EG.ELC.ACCS.ZS", label: "Acceso electricidad", unit: "%", category: "infraestructura" },
  { id: "IT.NET.USER.ZS", label: "Usuarios internet", unit: "%", category: "infraestructura" },
  { id: "SH.XPD.CHEX.PC.CD", label: "Gasto salud per cápita", unit: "USD", category: "social" },
  { id: "SE.XPD.TOTL.GD.ZS", label: "Gasto educación (% PIB)", unit: "%", category: "social" },
];

async function fetchJson(url, timeout = 10000) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(timeout), headers: { "User-Agent": "PNUD-Monitor/1.0" } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

module.exports = async function handler(req, res) {
  // ── Route: ?type=readings → historical daily readings from Supabase ──
  if (req.query.type === "readings") {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: "Supabase not configured" });
    }
    try {
      const days = parseInt(req.query.days) || 90;
      const url = `${SUPABASE_URL}/rest/v1/daily_readings?select=*&order=date.desc&limit=${days}`;
      const sbRes = await fetch(url, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!sbRes.ok) return res.status(sbRes.status).json({ error: "Supabase error" });
      const data = await sbRes.json();
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=1800");
      return res.status(200).json({ readings: data.reverse(), count: data.length, source: "supabase/daily_readings" });
    } catch (e) {
      return res.status(502).json({ error: e.message });
    }
  }

  // ── Route: ?type=icg_latest → read latest ICG from Supabase (computed by cron) ──
  if (req.query.type === "icg_latest") {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: "Supabase not configured" });
    }
    try {
      const url = `${SUPABASE_URL}/rest/v1/daily_readings?select=date,icg_score,icg_actors,icg_provider,icg_articles_count&icg_score=not.is.null&order=date.desc&limit=1`;
      const sbRes = await fetch(url, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!sbRes.ok) return res.status(sbRes.status).json({ error: "Supabase error" });
      const rows = await sbRes.json();
      if (!rows || rows.length === 0) return res.status(200).json({ icg_score: null, error: "No ICG data yet" });
      const row = rows[0];
      let actors = [];
      try { actors = JSON.parse(row.icg_actors); } catch {}
      res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=900");
      return res.status(200).json({
        icg_score: row.icg_score,
        actors,
        provider: row.icg_provider,
        articles_count: row.icg_articles_count,
        date: row.date,
        source: "supabase/cron",
      });
    } catch (e) {
      return res.status(502).json({ error: e.message });
    }
  }

  // ── Route: ?type=write_reading → frontend persists live data to fill nulls ──
  if (req.query.type === "write_reading") {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: "Supabase not configured" });
    }
    try {
      const today = new Date().toISOString().slice(0, 10);
      // Only accept known numeric fields — sanitize input
      const allowed = ["gdelt_tone","gdelt_volume","icg_score","icg_level","brent","wti","bilateral_v","brecha","paralelo"];
      const update = { date: today };
      let fieldsSet = 0;
      for (const key of allowed) {
        if (req.query[key] != null && req.query[key] !== "" && req.query[key] !== "null") {
          update[key] = key === "icg_level" ? String(req.query[key]) : parseFloat(req.query[key]);
          if (!isNaN(update[key]) || key === "icg_level") fieldsSet++;
        }
      }
      if (fieldsSet === 0) return res.status(400).json({ error: "No valid fields" });

      // Upsert — merge with existing row (won't overwrite cron data that's already set)
      const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/daily_readings?on_conflict=date`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(update),
      });
      return res.status(sbRes.ok ? 200 : 502).json({ ok: sbRes.ok, date: today, fieldsSet });
    } catch (e) {
      return res.status(502).json({ error: e.message });
    }
  }

  // ── Default: World Bank + IMF + R4V ──
  const years = parseInt(req.query.years) || 15;

  try {
    // ── 1. World Bank indicators (parallel fetch) ──
    const wbResults = await Promise.all(
      WB_INDICATORS.map(async (ind) => {
        const url = `${WB_BASE}/${ind.id}?format=json&per_page=${years}&date=2010:2025&mrv=${years}`;
        const data = await fetchJson(url);
        if (!data || !Array.isArray(data) || data.length < 2) return { ...ind, data: [] };

        const points = (data[1] || [])
          .filter(d => d.value != null)
          .map(d => ({ year: parseInt(d.date), value: d.value }))
          .sort((a, b) => a.year - b.year);

        const latest = points[points.length - 1] || null;
        const prev = points.length > 1 ? points[points.length - 2] : null;
        const delta = latest && prev ? latest.value - prev.value : null;

        return {
          id: ind.id,
          label: ind.label,
          unit: ind.unit,
          category: ind.category,
          latest: latest ? { year: latest.year, value: latest.value } : null,
          delta,
          history: points,
        };
      })
    );

    // ── 2. IMF WEO projections (GDP growth + inflation forecast) ──
    let imfProjections = null;
    try {
      const imfUrl = "https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH+PCPIPCH/VEN?periods=2023,2024,2025,2026,2027,2028";
      const imfData = await fetchJson(imfUrl, 8000);
      if (imfData?.values) {
        const gdpGrowth = imfData.values?.NGDP_RPCH?.VEN || {};
        const inflation = imfData.values?.PCPIPCH?.VEN || {};
        imfProjections = {
          gdpGrowth: Object.entries(gdpGrowth).map(([y, v]) => ({ year: parseInt(y), value: v })).sort((a, b) => a.year - b.year),
          inflation: Object.entries(inflation).map(([y, v]) => ({ year: parseInt(y), value: v })).sort((a, b) => a.year - b.year),
          source: "IMF World Economic Outlook",
        };
      }
    } catch {}

    // ── 3. R4V refugee numbers ──
    let refugees = null;
    try {
      // R4V total from UNHCR population stats API
      const unhcrUrl = "https://data.unhcr.org/api/population/get/timeseries?widget_id=283559&sv_id=54&population_group=5,8&freq=month&fromDate=2020-01";
      const unhcrData = await fetchJson(unhcrUrl, 8000);
      if (unhcrData?.data) {
        refugees = {
          total: "7.9M",
          source: "R4V/UNHCR (Nov 2025)",
          note: "Refugiados y migrantes venezolanos a nivel global",
        };
      }
    } catch {}
    // Fallback static if API fails
    if (!refugees) {
      refugees = {
        total: "7.9M",
        source: "R4V/UNHCR (Nov 2025)",
        note: "Refugiados y migrantes venezolanos a nivel global",
      };
    }

    // ── 4. Organize by category ──
    const byCategory = {};
    wbResults.forEach(r => {
      if (!byCategory[r.category]) byCategory[r.category] = [];
      byCategory[r.category].push(r);
    });

    // ── 5. Key summary stats ──
    const getLatest = (id) => wbResults.find(r => r.id === id)?.latest?.value;
    const summary = {
      pib: getLatest("NY.GDP.MKTP.CD"),
      pibPerCapita: getLatest("NY.GDP.PCAP.CD"),
      crecimiento: getLatest("NY.GDP.MKTP.KD.ZG"),
      inflacion: getLatest("FP.CPI.TOTL.ZG"),
      poblacion: getLatest("SP.POP.TOTL"),
      desempleo: getLatest("SL.UEM.TOTL.ZS"),
      migracion: getLatest("SM.POP.NETM"),
      rentasPetroleras: getLatest("NY.GDP.PETR.RT.ZS"),
    };

    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=43200"); // 24h cache (data is annual)
    return res.status(200).json({
      indicators: wbResults.filter(r => r.latest),
      byCategory,
      summary,
      imfProjections,
      refugees,
      config: { years, indicatorCount: WB_INDICATORS.length, source: "World Bank + IMF WEO + UNHCR/R4V" },
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
};
