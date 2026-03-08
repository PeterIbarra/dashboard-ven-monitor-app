// /api/cron/fetch-news — Fetch RSS feeds and store in Supabase
// Trigger via Vercel Cron or manual GET request

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

const RSS_SOURCES = [
  { name:"Efecto Cocuyo", feed:"https://efectococuyo.com/feed/", type:"news" },
  { name:"El Pitazo", feed:"https://elpitazo.net/feed/", type:"news" },
  { name:"Runrunes", feed:"https://runrun.es/feed/", type:"news" },
  { name:"Tal Cual", feed:"https://talcualdigital.com/feed/", type:"news" },
  { name:"El Estímulo", feed:"https://elestimulo.com/feed/", type:"news" },
  { name:"Caracas Chronicles", feed:"https://www.caracaschronicles.com/feed/", type:"news" },
  { name:"Cocuyo Chequea", feed:"https://efectococuyo.com/cocuyo-chequea/feed/", type:"factcheck" },
  { name:"Cotejo.info", feed:"https://cotejo.info/feed/", type:"factcheck" },
  { name:"EsPaja", feed:"https://espaja.com/feed/", type:"factcheck" },
  { name:"Cazamos Fake News", feed:"https://www.cazadoresdefakenews.info/feed/", type:"factcheck" },
  { name:"Provea", feed:"https://provea.org/feed/", type:"factcheck" },
];

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
  // Upsert by link (unique constraint)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SECRET,
      Authorization: `Bearer ${SUPABASE_SECRET}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(articles),
  });
  return { ok: res.ok, status: res.status };
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SECRET) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  let totalInserted = 0;
  let errors = [];

  for (const src of RSS_SOURCES) {
    try {
      const response = await fetch(src.feed, {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "PNUD-Monitor/1.0", Accept: "application/rss+xml, application/xml, text/xml" },
      });
      if (!response.ok) { errors.push(`${src.name}: HTTP ${response.status}`); continue; }
      const xml = await response.text();
      const articles = parseRSS(xml, src.name, src.type).slice(0, 10);
      if (articles.length > 0) {
        const result = await upsertToSupabase(articles);
        if (result.ok) totalInserted += articles.length;
        else errors.push(`${src.name}: Supabase ${result.status}`);
      }
    } catch (e) {
      errors.push(`${src.name}: ${e.message}`);
    }
  }

  return res.status(200).json({
    inserted: totalInserted,
    sources: RSS_SOURCES.length,
    errors: errors.length > 0 ? errors : null,
    fetchedAt: new Date().toISOString(),
  });
}
