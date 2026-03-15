// /api/cron/fetch-news — Fetch RSS feeds and store in Supabase
// Trigger via Vercel Cron or manual GET request

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

const { CRON_FEEDS: RSS_SOURCES } = require("../_lib/feeds");

const SCENARIO_TAGS = {
  E1: /elecci[oó]n|electoral|voto|transici[oó]n|democra|MCM|Machado|oposici[oó]n|preso.pol[ií]tico|amnist[ií]a|excarcel/i,
  E2: /colapso|crisis|inflaci[oó]n|apag[oó]n|el[eé]ctric|salario|hambre|migra|pobreza|FMI|deuda|brecha.cambiar/i,
  E3: /petr[oó]le|PDVSA|OFAC|licencia|Chevron|exportaci|barril|EE\.UU|Trump|Delcy|cooperaci|diploma|sancion/i,
  E4: /FANB|militar|colectivo|represi[oó]n|detenci[oó]n|preso|SEBIN|DGCIM|Cabello|coerci|arma|violencia/i,
};

const DIM_TAGS = {
  "Energético": /petr[oó]le|PDVSA|crudo|barril|refiner|gas|energ|taladro|Chevron|Eni|Repsol|Shell|BP|OFAC|licencia|exportaci|bpd|OPEP|VLCC|Vitol|Trafigura/i,
  "Político": /elecci[oó]n|electoral|amnist[ií]a|excarcel|preso|pol[ií]tic|Asamblea|AN |diput|partido|oposici|oficialis|Delcy|Cabello|Rodr[ií]guez|MCM|Machado|FANB|militar|PSUV|govern/i,
  "Económico": /inflaci[oó]n|salario|bol[ií]var|d[oó]lar|cambiar|BCV|precio|econ[oó]m|PIB|FMI|deuda|canasta|pobreza|cripto|USDT|brecha|subasta|divisa/i,
  "Internacional": /EE\.UU|Trump|Rubio|UE|Europa|ONU|Colombia|Petro|China|Rusia|sanci[oó]n|diplom|embajad|fronter|migra|SOUTHCOM|geopo/i,
};

function classify(title, desc) {
  const text = `${title} ${desc}`;
  const scenarios = Object.entries(SCENARIO_TAGS).filter(([,p]) => p.test(text)).map(([k]) => k);
  const dims = Object.entries(DIM_TAGS).filter(([,p]) => p.test(text)).map(([k]) => k);
  return {
    scenarios: scenarios.length > 0 ? scenarios : ["E3"],
    dims: dims.length > 0 ? dims : ["Político"],
  };
}

function parseRSS(xml, sourceName, type) {
  const items = [];
  const regex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const c = match[1];
    const title = (c.match(/<title><!\[CDATA\[(.*?)\]\]>/) || c.match(/<title>(.*?)<\/title>/) || [])[1] || "";
    const link = (c.match(/<link>(.*?)<\/link>/) || [])[1] || "";
    const desc = (c.match(/<description><!\[CDATA\[(.*?)\]\]>/) || c.match(/<description>(.*?)<\/description>/) || [])[1] || "";
    const pubDate = (c.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";
    if (!title.trim()) continue;
    const clean = (s) => s.replace(/<[^>]*>/g, "").trim();
    const { scenarios, dims } = classify(title, desc);
    items.push({
      title: clean(title),
      link: link.trim(),
      description: clean(desc).substring(0, 300),
      source: sourceName,
      type,
      published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      scenarios,
      dims,
    });
  }
  return items;
}

async function upsertToSupabase(articles) {
  // Insert with on_conflict to handle duplicates by link
  const res = await fetch(`${SUPABASE_URL}/rest/v1/articles?on_conflict=link`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SECRET,
      Authorization: `Bearer ${SUPABASE_SECRET}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(articles),
  });
  return { ok: res.ok, status: res.status, text: res.ok ? "" : await res.text().catch(() => "") };
}

module.exports = async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SECRET) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  let totalInserted = 0;
  let errors = [];
  let ratesSaved = false;

  // ── 1. Fetch and save exchange rates ──
  try {
    const rateRes = await fetch("https://ve.dolarapi.com/v1/dolares", { signal: AbortSignal.timeout(6000) });
    if (rateRes.ok) {
      const rateData = await rateRes.json();
      const oficial = rateData.find(d => d.fuente === "oficial");
      const paralelo = rateData.find(d => d.fuente === "paralelo");
      const bcv = oficial?.promedio || null;
      const par = paralelo?.promedio || null;
      if (bcv && par) {
        const today = new Date().toISOString().slice(0, 10);
        const brecha = ((par - bcv) / bcv) * 100;
        const usdt = par * 1.02;
        const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/rates?on_conflict=date`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_SECRET,
            Authorization: `Bearer ${SUPABASE_SECRET}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify({ date: today, bcv, paralelo: par, usdt, brecha }),
        });
        ratesSaved = upsertRes.ok;
        if (!upsertRes.ok) errors.push(`Rates: Supabase ${upsertRes.status}`);
      }
    }
  } catch (e) {
    errors.push(`Rates: ${e.message}`);
  }

  // ── 2. Fetch and save RSS articles (parallel batches of 10) ──
  const BATCH_SIZE = 10;
  for (let b = 0; b < RSS_SOURCES.length; b += BATCH_SIZE) {
    const batch = RSS_SOURCES.slice(b, b + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map(async (src) => {
      try {
        const response = await fetch(src.feed, {
          signal: AbortSignal.timeout(6000),
          headers: { "User-Agent": "PNUD-Monitor/1.0", Accept: "application/rss+xml, application/xml, text/xml" },
        });
        if (!response.ok) { errors.push(`${src.name}: HTTP ${response.status}`); return 0; }
        const xml = await response.text();
        const articles = parseRSS(xml, src.name, src.type).slice(0, 8);
        if (articles.length > 0) {
          const result = await upsertToSupabase(articles);
          if (result.ok) return articles.length;
          else { errors.push(`${src.name}: Supabase ${result.status}`); return 0; }
        }
        return 0;
      } catch (e) {
        errors.push(`${src.name}: ${e.message}`);
        return 0;
      }
    }));
    results.forEach(r => { if (r.status === "fulfilled") totalInserted += r.value; });
  }

  // ── 3. Persist daily readings (GDELT tone, oil, bilateral, ICG) ──
  let readingsSaved = false;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const reading = { date: today };

    // Fetch in parallel: GDELT tone (7d avg), oil prices, bilateral, dolar (for brecha)
    const [gdeltRes, oilRes, bilRes, dolarRes] = await Promise.allSettled([
      fetch("https://api.gdeltproject.org/api/v2/doc/doc?query=Venezuela&mode=timelinetone&timespan=7d&format=csv", { signal: AbortSignal.timeout(10000) }),
      fetch("https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=" + (process.env.EIA_API_KEY || "") + "&frequency=daily&data[0]=value&facets[product][]=EPCBRENT&facets[product][]=EPCWTI&sort[0][column]=period&sort[0][direction]=desc&length=1", { signal: AbortSignal.timeout(8000) }),
      fetch("https://www.pizzint.watch/api/aggregated-data?actorA=United%20States&actorB=Venezuela&days=7", { signal: AbortSignal.timeout(10000) }),
      fetch("https://ve.dolarapi.com/v1/dolares", { signal: AbortSignal.timeout(6000) }),
    ]);

    // Parse GDELT tone (7-day average — more reliable than 1d)
    if (gdeltRes.status === "fulfilled" && gdeltRes.value.ok) {
      try {
        const csv = await gdeltRes.value.text();
        const lines = csv.trim().split("\n").slice(1);
        let sum = 0, count = 0, vol = 0;
        for (const line of lines) {
          const parts = line.split(",");
          const val = parseFloat(parts[parts.length - 1]);
          if (!isNaN(val)) { sum += val; count++; }
          if (parts.length > 1) { const v = parseInt(parts[1]); if (!isNaN(v)) vol += v; }
        }
        if (count > 0) reading.gdelt_tone = parseFloat((sum / count).toFixed(2));
        reading.gdelt_volume = vol;
      } catch {}
    }

    // Parse oil prices
    if (oilRes.status === "fulfilled" && oilRes.value.ok) {
      try {
        const data = await oilRes.value.json();
        const items = data?.response?.data || [];
        for (const item of items) {
          if (item.product === "EPCBRENT") reading.brent = parseFloat(item.value);
          if (item.product === "EPCWTI") reading.wti = parseFloat(item.value);
        }
      } catch {}
    }

    // Parse bilateral (7-day window — take latest data point)
    if (bilRes.status === "fulfilled" && bilRes.value.ok) {
      try {
        const data = await bilRes.value.json();
        const points = data?.data || [];
        if (points.length > 0) {
          const latest = points[points.length - 1];
          if (latest?.v != null) reading.bilateral_v = parseFloat(Number(latest.v).toFixed(2));
        }
      } catch {}
    }

    // Parse dolar for brecha + paralelo
    if (dolarRes.status === "fulfilled" && dolarRes.value.ok) {
      try {
        const data = await dolarRes.value.json();
        const oficial = data.find(d => d.fuente === "oficial");
        const par = data.find(d => d.fuente === "paralelo");
        if (oficial?.promedio && par?.promedio) {
          reading.paralelo = par.promedio;
          reading.brecha = parseFloat(((par.promedio - oficial.promedio) / oficial.promedio * 100).toFixed(1));
        }
      } catch {}
    }

    // Build alerts array
    const alerts = [];
    if (reading.brecha > 55) alerts.push("brecha_rojo");
    else if (reading.brecha > 45) alerts.push("brecha_amarillo");
    if (reading.brent && reading.brent < 60) alerts.push("brent_bajo_rojo");
    else if (reading.brent && reading.brent > 95) alerts.push("brent_alto_rojo");
    if (reading.bilateral_v && reading.bilateral_v > 2.0) alerts.push("bilateral_rojo");
    else if (reading.bilateral_v && reading.bilateral_v > 1.0) alerts.push("bilateral_amarillo");
    if (alerts.length > 0) reading.alerts_fired = alerts;

    // Upsert to Supabase
    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/daily_readings?on_conflict=date`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SECRET,
        Authorization: `Bearer ${SUPABASE_SECRET}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(reading),
    });
    readingsSaved = upsertRes.ok;
    if (!upsertRes.ok) errors.push(`Readings: Supabase ${upsertRes.status} — ${await upsertRes.text().catch(() => "")}`);
  } catch (e) {
    errors.push(`Readings: ${e.message}`);
  }

  return res.status(200).json({
    inserted: totalInserted,
    ratesSaved,
    readingsSaved,
    sources: RSS_SOURCES.length,
    errors: errors.length > 0 ? errors : null,
    fetchedAt: new Date().toISOString(),
  });
}
