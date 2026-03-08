// /api/cron/fetch-news — Fetch RSS feeds and store in Supabase
// Trigger via Vercel Cron or manual GET request

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

const RSS_SOURCES = [
  // ── Medios oficialistas ──
  { name:"VTV", feed:"https://www.vtv.gob.ve/feed/", type:"news" },
  { name:"VTV Canal8", feed:"https://canal8.com.ve/feed/", type:"news" },
  { name:"Correo del Orinoco", feed:"https://www.correodelorinoco.gob.ve/feed/", type:"news" },
  { name:"RNV", feed:"https://www.rnv.gob.ve/feed/", type:"news" },
  { name:"TeleSUR", feed:"https://www.telesurtv.net/feed/", type:"news" },
  // ── Medios independientes / críticos ──
  { name:"Efecto Cocuyo", feed:"https://efectococuyo.com/feed/", type:"news" },
  { name:"Runrunes", feed:"https://runrun.es/feed/", type:"news" },
  { name:"El Diario", feed:"https://eldiario.com/feed/", type:"news" },
  { name:"El Pitazo", feed:"https://elpitazo.net/feed/", type:"news" },
  { name:"Armando.Info", feed:"https://armando.info/feed/", type:"news" },
  { name:"Tal Cual", feed:"https://talcualdigital.com/feed/", type:"news" },
  { name:"Tal Cual Flipboard", feed:"https://talcualdigital.com/feed-flipboard/", type:"news" },
  { name:"El Estímulo", feed:"https://elestimulo.com/feed/", type:"news" },
  { name:"Crónica Uno", feed:"https://cronica.uno/feed/", type:"news" },
  { name:"Analitica", feed:"https://analitica.com/feed/", type:"news" },
  { name:"Prodavinci", feed:"https://prodavinci.com/feed/", type:"news" },
  { name:"Caracas Chronicles", feed:"https://caracaschronicles.com/feed/", type:"news" },
  { name:"Radio Fe y Alegría", feed:"https://radiofeyalegrianoticias.com/feed/", type:"news" },
  // ── Medios generalistas ──
  { name:"El Nacional", feed:"https://www.elnacional.com/feed/", type:"news" },
  { name:"La Patilla", feed:"https://www.lapatilla.com/feed/", type:"news" },
  { name:"Caraota Digital", feed:"https://www.caraotadigital.net/feed/", type:"news" },
  { name:"Alberto News", feed:"https://albertonews.com/feed/", type:"news" },
  { name:"Maduradas", feed:"https://maduradas.com/feed/", type:"news" },
  { name:"Noticiero Digital", feed:"https://noticierodigital.com/feed/", type:"news" },
  { name:"Últimas Noticias", feed:"https://ultimasnoticias.com.ve/feed/", type:"news" },
  { name:"2001 Online", feed:"https://2001online.com/feed/", type:"news" },
  // ── Medios regionales ──
  { name:"Correo del Caroní", feed:"https://correodelcaroni.com/feed/", type:"news" },
  { name:"Nuevo Día", feed:"https://nuevodia.com.ve/feed/", type:"news" },
  { name:"Entorno Inteligente", feed:"https://entornointeligente.com/feed/", type:"news" },
  { name:"Diario La Región", feed:"https://diariolaregion.net/feed/", type:"news" },
  { name:"Diario de los Andes", feed:"https://diariodelosandes.com/feed/", type:"news" },
  { name:"Diario Avance", feed:"https://diarioavance.com/feed/", type:"news" },
  { name:"La Nación", feed:"https://lanacionweb.com/feed/", type:"news" },
  { name:"La Nación Deportes", feed:"https://lanaciondeportes.com/feed/", type:"news" },
  { name:"La Verdad de Monagas", feed:"https://laverdaddemonagas.com/feed/", type:"news" },
  { name:"Periódico de Monagas", feed:"https://elperiodicodemonagas.com.ve/feed/", type:"news" },
  { name:"El Clarín", feed:"https://elclarinweb.com/feed/", type:"news" },
  { name:"Diario La Voz", feed:"https://diariolavoz.net/feed/", type:"news" },
  { name:"La Razón", feed:"https://larazon.net/feed/", type:"news" },
  // ── Medios internacionales ──
  { name:"BBC Lat Am", feed:"https://feeds.bbci.co.uk/news/world/latin_america/rss.xml", type:"news" },
  { name:"NYT World", feed:"https://rss.nytimes.com/services/xml/rss/nyt/World.xml", type:"news" },
  { name:"Al Jazeera", feed:"https://www.aljazeera.com/xml/rss/all.xml", type:"news" },
  { name:"The Guardian VE", feed:"https://www.theguardian.com/world/venezuela/rss", type:"news" },
  { name:"Infobae", feed:"https://www.infobae.com/feeds/rss/", type:"news" },
  { name:"El País", feed:"https://elpais.com/rss/elpais/portada.xml", type:"news" },
  { name:"France24", feed:"https://www.france24.com/es/am%C3%A9rica-latina/rss", type:"news" },
  { name:"ABC Internacional", feed:"https://www.abc.es/rss/atom/internacional", type:"news" },
  { name:"MercoPress", feed:"https://en.mercopress.com/rss/latin-america", type:"news" },
  { name:"El Tiempo VE", feed:"https://www.eltiempo.com/rss/venezuela.xml", type:"news" },
  { name:"Google News Reuters VE", feed:"https://news.google.com/rss/search?q=venezuela+reuters", type:"news" },
  // ── Especializados / análisis ──
  { name:"Venezuela Analysis", feed:"https://venezuelanalysis.com/feed/", type:"news" },
  { name:"Banca y Negocios", feed:"https://www.bancaynegocios.com/feed/", type:"news" },
  { name:"Contrapunto", feed:"https://contrapunto.com/feed/", type:"news" },
  { name:"Descifrado", feed:"https://descifrado.com/feed/", type:"news" },
  // ── Google News aggregator ──
  { name:"Google News VE", feed:"https://news.google.com/rss/search?q=venezuela", type:"news" },
  { name:"Google News VE Economía", feed:"https://news.google.com/rss/search?q=venezuela+economia", type:"news" },
  { name:"Google News VE Política", feed:"https://news.google.com/rss/search?q=venezuela+politica", type:"news" },
  // ── Fact-checkers ──
  { name:"Cocuyo Chequea", feed:"https://efectococuyo.com/cocuyo-chequea/feed/", type:"factcheck" },
  { name:"Cotejo.info", feed:"https://cotejo.info/feed/", type:"factcheck" },
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

  return res.status(200).json({
    inserted: totalInserted,
    ratesSaved,
    sources: RSS_SOURCES.length,
    errors: errors.length > 0 ? errors : null,
    fetchedAt: new Date().toISOString(),
  });
}
