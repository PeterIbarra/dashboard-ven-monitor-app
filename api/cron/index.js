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
  { name:"Bitácora Económica", feed:"https://bitacoraeconomica.com/feed/", type:"news" },
  { name:"Contrapunto", feed:"https://contrapunto.com/feed/", type:"news" },
  { name:"Descifrado", feed:"https://descifrado.com/feed/", type:"news" },
  // ── Google News aggregator ──
  { name:"Google News VE", feed:"https://news.google.com/rss/search?q=venezuela", type:"news" },
  { name:"Google News VE Economía", feed:"https://news.google.com/rss/search?q=venezuela+economia", type:"news" },
  { name:"Google News VE Política", feed:"https://news.google.com/rss/search?q=venezuela+politica", type:"news" },
  // ── Fact-checkers ──
  { name:"Cocuyo Chequea", feed:"https://efectococuyo.com/cocuyo-chequea/feed/", type:"factcheck" },
  { name:"El Diario Chequéalo", feed:"https://eldiario.com/categoria/chequealo/feed/", type:"factcheck" },
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

// ── AI cascade for news classification ──
const AI_CASCADE = [
  { name: "mistral", key: "MISTRAL_API_KEY", url: "https://api.mistral.ai/v1/chat/completions", model: "mistral-small-latest" },
  { name: "gemini", key: "GEMINI_API_KEY", url: null, model: "gemini-1.5-flash" },
  { name: "groq", key: "GROQ_API_KEY", url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile" },
  { name: "openrouter", key: "OPENROUTER_API_KEY", url: "https://openrouter.ai/api/v1/chat/completions", model: "meta-llama/llama-3.1-8b-instruct:free" },
];

async function callAICascade(prompt, maxTokens = 800) {
  for (const prov of AI_CASCADE) {
    const apiKey = process.env[prov.key];
    if (!apiKey) continue;
    try {
      let text = null;
      if (prov.name === "gemini") {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${prov.model}:generateContent?key=${apiKey}`;
        const r = await fetch(url, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 } }),
          signal: AbortSignal.timeout(25000),
        });
        if (r.ok) { const d = await r.json(); text = d.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n"); }
      } else {
        const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
        if (prov.name === "openrouter") {
          headers["HTTP-Referer"] = "https://dashboard-ven-monitor-app.vercel.app";
          headers["X-Title"] = "PNUD Monitor Alerts Cron";
        }
        const r = await fetch(prov.url, {
          method: "POST", headers,
          body: JSON.stringify({ model: prov.model, messages: [{ role: "user", content: prompt }], max_tokens: maxTokens, temperature: 0.3 }),
          signal: AbortSignal.timeout(25000),
        });
        if (r.ok) { const d = await r.json(); text = d.choices?.[0]?.message?.content?.trim(); }
      }
      if (text && text.length > 50) return { text, provider: prov.name };
    } catch {}
  }
  return null;
}

// ── News Alerts: classify recent headlines with AI and save to Supabase ──
async function classifyNewsAlerts(errors) {
  // 1. Fetch recent articles from Supabase (last 8h)
  const since = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
  const articlesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?type=eq.news&published_at=gte.${since}&order=published_at.desc&limit=40`,
    { headers: { apikey: SUPABASE_SECRET, Authorization: `Bearer ${SUPABASE_SECRET}` }, signal: AbortSignal.timeout(8000) }
  );
  let articles = [];
  if (articlesRes.ok) articles = await articlesRes.json();

  // 2. Also try Google News RSS for fresh headlines
  let googleHeadlines = [];
  try {
    const gRes = await fetch("https://news.google.com/rss/search?q=venezuela&hl=es-419&gl=VE&ceid=VE:es-419", {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "PNUD-Monitor/1.0", Accept: "application/rss+xml, text/xml" },
    });
    if (gRes.ok) {
      const xml = await gRes.text();
      const regex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<source[^>]*>(.*?)<\/source>[\s\S]*?<\/item>/gi;
      let m;
      while ((m = regex.exec(xml)) !== null && googleHeadlines.length < 15) {
        const t = m[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]*>/g, "").trim();
        const s = m[2].replace(/<[^>]*>/g, "").trim();
        if (t.length > 20) googleHeadlines.push({ title: t, source: s });
      }
    }
  } catch {}

  // 3. Source classification
  const INTL_SOURCES = ["reuters", "bloomberg", "wsj", "wall street journal", "washington post", "cnn", "bbc", "abc", "associated press", "ap news", "france 24", "el país", "elpais", "nyt", "new york times", "the guardian", "financial times", "dw", "al jazeera", "mercopress"];
  const NAC_GOB = ["vtv", "correo del orinoco", "rnv", "telesur", "últimas noticias", "la iguana", "avn", "aporrea", "canal8"];
  const NAC_IND = ["efecto cocuyo", "el pitazo", "runrunes", "tal cual", "armando.info", "crónica uno", "prodavinci", "el estímulo", "caracas chronicles", "contrapunto", "provea"];

  function tagSource(source) {
    const s = (source || "").toLowerCase();
    if (INTL_SOURCES.some(p => s.includes(p))) return "INTL";
    if (NAC_GOB.some(p => s.includes(p))) return "NAC-GOB";
    if (NAC_IND.some(p => s.includes(p))) return "NAC-IND";
    return "NAC";
  }

  // 4. Merge headlines — Supabase articles + Google News, deduplicate, tag sources
  const allHeadlines = [];
  const seen = new Set();
  for (const a of articles) {
    const key = (a.title || "").toLowerCase().slice(0, 50);
    const tag = tagSource(a.source);
    if (!seen.has(key) && a.title?.length > 15) { seen.add(key); allHeadlines.push({ text: `[${tag}] "${a.title}" [${a.source}]`, tag }); }
  }
  for (const g of googleHeadlines) {
    const key = g.title.toLowerCase().slice(0, 50);
    const tag = tagSource(g.source);
    if (!seen.has(key)) { seen.add(key); allHeadlines.push({ text: `[${tag}] "${g.title}" [${g.source}]`, tag }); }
  }

  // Sort: INTL first, then NAC-IND, then NAC-GOB, then NAC
  const tagOrder = { "INTL": 0, "NAC-IND": 1, "NAC-GOB": 2, "NAC": 3 };
  allHeadlines.sort((a, b) => (tagOrder[a.tag] || 3) - (tagOrder[b.tag] || 3));

  if (allHeadlines.length < 5) {
    errors.push(`Alerts: Only ${allHeadlines.length} headlines found (need 5+)`);
    return { saved: false, provider: null, count: 0 };
  }

  // 5. Build prompt with source hierarchy context
  const prompt = `Eres un sistema de alerta del PNUD Venezuela. Tu ÚNICA función es identificar y clasificar noticias DIRECTAMENTE relacionadas con Venezuela.

REGLA CRÍTICA DE FILTRADO:
- SOLO incluye noticias donde Venezuela, un actor venezolano, o una institución venezolana sea el SUJETO PRINCIPAL del titular.
- DESCARTA COMPLETAMENTE: noticias sobre otros países (Colombia, Ecuador, Irán, Rusia, China, etc.) aunque mencionen la región, noticias de entretenimiento, deportes internacionales, farándula, sucesos locales sin relevancia política, y cualquier titular que no tenga impacto directo en la situación política, económica o social de Venezuela.
- En caso de duda sobre si un titular es relevante para Venezuela, NO lo incluyas. Es preferible devolver 3 alertas buenas que 8 con ruido.

JERARQUÍA DE FUENTES:
- [INTL] = Medios internacionales de referencia (Reuters, BBC, Bloomberg, WSJ, CNN). Si un medio [INTL] cubre algo de Venezuela, es casi seguro relevante.
- [NAC-IND] = Medios independientes venezolanos (Efecto Cocuyo, El Pitazo, Runrunes). Confiables para hechos en terreno y señales de tensión.
- [NAC-GOB] = Medios oficialistas (VTV, TeleSUR, Correo del Orinoco). Revelan la narrativa oficial — su cobertura o silencio es señal.
- [NAC] = Otros medios nacionales o regionales.
- Si un evento aparece en [INTL] + [NAC-IND], señal fuerte de relevancia.
- Si [NAC-GOB] y [NAC-IND] cubren el mismo evento con narrativas opuestas, considéralo para 🔴 (fractura informativa).

TITULARES:
${allHeadlines.slice(0, 25).map((h, i) => `${i + 1}. ${h.text}`).join("\n")}

INSTRUCCIONES:
1. Responde SOLO en formato JSON válido, sin markdown ni backticks.
2. Aplica el filtro estricto: si el titular no tiene a Venezuela como sujeto principal, EXCLÚYELO.
3. Cada alerta: "nivel" (🔴/🟡/🟢), "titular" (copia exacta del titular original, sin la etiqueta de fuente), "fuente" (nombre del medio), "dimension" (POLÍTICO/ECONÓMICO/INTERNACIONAL/DDHH/ENERGÍA), "impacto" (1 frase de por qué importa para Venezuela).
4. Niveles: 🔴 = Evento que podría mover escenarios (E1-E4) o requiere acción inmediata. 🟡 = Desarrollo relevante para seguimiento analítico. 🟢 = Contexto informativo útil.
5. Máximo 8 alertas, mínimo 2. Si hay pocas noticias relevantes, devuelve pocas — no llenes con ruido.
6. Ordena por relevancia: 🔴 primero, luego 🟡, luego 🟢.
7. Formato exacto:
[{"nivel":"🔴","titular":"...","fuente":"...","dimension":"...","impacto":"..."}]`;

  // 5. Call AI cascade
  const result = await callAICascade(prompt, 800);
  if (!result) {
    errors.push("Alerts: No AI provider responded");
    return { saved: false, provider: null, count: 0 };
  }

  // 6. Parse response
  let parsed = null;
  try {
    const clean = result.text.replace(/```json\s?|```/g, "").trim();
    const jsonMatch = clean.match(/\[[\s\S]*\]/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);
  } catch (e) {
    errors.push(`Alerts: JSON parse failed — ${e.message}`);
    return { saved: false, provider: result.provider, count: 0 };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    errors.push("Alerts: AI returned empty or invalid array");
    return { saved: false, provider: result.provider, count: 0 };
  }

  // 7. Save to Supabase — news_alerts table (upsert by date-slot)
  const now = new Date();
  const slot = `${now.toISOString().slice(0, 10)}-${String(Math.floor(now.getHours() / 6)).padStart(2, "0")}`; // e.g. "2026-03-17-02" = 3rd 6h slot
  const alertRecord = {
    slot,
    alerts: JSON.stringify(parsed.slice(0, 8)),
    provider: result.provider,
    headlines_count: allHeadlines.length,
    classified_at: now.toISOString(),
  };

  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/news_alerts?on_conflict=slot`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SECRET,
      Authorization: `Bearer ${SUPABASE_SECRET}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(alertRecord),
  });

  if (!upsertRes.ok) {
    const errText = await upsertRes.text().catch(() => "");
    errors.push(`Alerts Supabase: ${upsertRes.status} — ${errText}`);
    return { saved: false, provider: result.provider, count: parsed.length };
  }

  return { saved: true, provider: result.provider, count: parsed.length };
}

module.exports = async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SECRET) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  // ── Task routing: ?task=alerts runs ONLY news alerts classification ──
  const task = (req.query?.task || "").toLowerCase();
  if (task === "alerts") {
    const errors = [];
    try {
      const result = await classifyNewsAlerts(errors);
      return res.status(200).json({ task: "alerts", ...result, errors: errors.length > 0 ? errors : null, fetchedAt: new Date().toISOString() });
    } catch (e) {
      return res.status(500).json({ task: "alerts", error: e.message });
    }
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

  // ── 4. ICG via AI — 1 prompt for all 13 actors with article content ──
  let icgSaved = false;
  let icgProvider = null;
  try {
    // Fetch recent articles from Supabase (last 24h, Venezuela-focused)
    const since = new Date(Date.now() - 24*60*60*1000).toISOString();
    const articlesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?type=eq.news&published_at=gte.${since}&order=published_at.desc&limit=50`,
      { headers: { apikey: SUPABASE_SECRET, Authorization: `Bearer ${SUPABASE_SECRET}` }, signal: AbortSignal.timeout(8000) }
    );

    let articles = [];
    if (articlesRes.ok) articles = await articlesRes.json();

    if (articles.length >= 5) {
      // Build article summaries — title + first 300 chars of description, with source
      const OFICIALISTAS = ["VTV","Correo del Orinoco","RNV","TeleSUR","VTV Canal8","Últimas Noticias","La Iguana TV","AVN","Aporrea"];
      
      // Sort: oficialistas first (they reveal internal cohesion dynamics)
      articles.sort((a, b) => {
        const aOf = OFICIALISTAS.includes(a.source) ? 0 : 1;
        const bOf = OFICIALISTAS.includes(b.source) ? 0 : 1;
        return aOf - bOf;
      });

      const articleTexts = articles.slice(0, 40).map((a, i) => {
        const bias = OFICIALISTAS.includes(a.source) ? "[OFICIALISTA]" : "[INDEPENDIENTE]";
        const desc = a.description ? a.description.substring(0, 300) : "";
        return `${i+1}. ${bias} [${a.source}] "${a.title}"${desc ? "\n   " + desc : ""}`;
      }).join("\n\n");

      const ICG_ACTORS = [
        "Delcy Rodríguez (líder interina)",
        "Jorge Rodríguez (AN)",
        "Diosdado Cabello",
        "FANB",
        "Vladimir Padrino López",
        "Jorge Arreaza",
        "Nicolás Maduro Guerra (hijo)",
        "Asamblea Nacional",
        "PSUV (partido)",
        "Chavismo (movimiento)",
        "Colectivos",
        "Gobernadores chavistas",
        "Sector militar amplio",
      ];

      const prompt = `Eres analista senior de riesgo político del PNUD Venezuela. Tu tarea es evaluar la COHESIÓN INTERNA del gobierno de Delcy Rodríguez post-captura de Maduro (enero 2026).

ARTÍCULOS DE LAS ÚLTIMAS 24 HORAS (${articles.length} noticias):
${articleTexts}

INSTRUCCIONES:
1. PRIORIZA las fuentes marcadas [OFICIALISTA] — son las que mejor revelan dinámicas internas de cohesión, lealtad y posibles fracturas dentro del sistema de poder. VTV elogiando o ignorando a un actor es señal poderosa.
2. Las fuentes [INDEPENDIENTE] complementan con señales externas de presión, pero las oficialistas son el indicador primario.
3. Para CADA uno de estos 13 actores, evalúa su alineación:

${ICG_ACTORS.map((a, i) => `${i+1}. ${a}`).join("\n")}

4. Responde SOLO con un JSON array válido (sin markdown, sin backticks, sin explicaciones fuera del JSON):
[{"actor":"Delcy Rodríguez","alignment":"ALINEADO","confidence":0.9,"evidence":"razón corta","signals":["señal1","señal2"]},...]

Criterios:
- ALINEADO: Acciones coordinadas, declaraciones de apoyo, participación activa, mencionado positivamente en medios oficialistas
- NEUTRO: Sin señales claras, silencio parcial, perfil bajo, no mencionado
- TENSION: Contradicciones, ausencias notables, declaraciones divergentes, omitido de medios oficialistas cuando debería aparecer`;

      // Call AI cascade
      const AI_CASCADE = [
        { name: "mistral", key: "MISTRAL_API_KEY", url: "https://api.mistral.ai/v1/chat/completions", model: "mistral-small-latest", format: "openai" },
        { name: "groq", key: "GROQ_API_KEY", url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile", format: "openai" },
        { name: "openrouter", key: "OPENROUTER_API_KEY", url: "https://openrouter.ai/api/v1/chat/completions", model: "meta-llama/llama-3.1-8b-instruct:free", format: "openai" },
      ];

      let aiText = null;
      for (const prov of AI_CASCADE) {
        const apiKey = process.env[prov.key];
        if (!apiKey) continue;
        try {
          const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
          if (prov.name === "openrouter") {
            headers["HTTP-Referer"] = "https://dashboard-ven-monitor-app.vercel.app";
            headers["X-Title"] = "PNUD Monitor ICG Cron";
          }
          const aiRes = await fetch(prov.url, {
            method: "POST",
            headers,
            body: JSON.stringify({
              model: prov.model,
              messages: [{ role: "user", content: prompt }],
              max_tokens: 1500,
              temperature: 0.1,
            }),
            signal: AbortSignal.timeout(25000),
          });
          if (aiRes.ok) {
            const data = await aiRes.json();
            const text = data.choices?.[0]?.message?.content?.trim();
            if (text && text.length > 50) {
              aiText = text;
              icgProvider = prov.name;
              break;
            }
          }
        } catch (e) {
          errors.push(`ICG ${prov.name}: ${e.message}`);
        }
      }

      if (aiText) {
        try {
          const clean = aiText.replace(/```json|```/g, "").trim();
          // Extract JSON array
          const jsonMatch = clean.match(/\[[\s\S]*\]/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);

          if (Array.isArray(parsed) && parsed.length > 0) {
            // Compute composite ICG score
            const ALIGN_SCORES = { "ALINEADO": 90, "NEUTRO": 50, "TENSION": 15 };
            let totalScore = 0, totalWeight = 0;
            const actorScores = parsed.map(a => {
              const score = ALIGN_SCORES[a.alignment] || 50;
              const weight = a.confidence || 0.5;
              totalScore += score * weight;
              totalWeight += weight;
              return {
                actor: a.actor,
                alignment: a.alignment,
                confidence: a.confidence,
                evidence: a.evidence,
                signals: a.signals,
              };
            });
            const compositeICG = totalWeight > 0 ? Math.round(totalScore / totalWeight) : null;

            // Save to daily_readings
            const today = new Date().toISOString().slice(0, 10);
            const icgData = {
              date: today,
              icg_score: compositeICG,
              icg_actors: JSON.stringify(actorScores),
              icg_provider: icgProvider,
              icg_articles_count: articles.length,
            };
            const icgUpsert = await fetch(`${SUPABASE_URL}/rest/v1/daily_readings?on_conflict=date`, {
              method: "POST",
              headers: {
                apikey: SUPABASE_SECRET,
                Authorization: `Bearer ${SUPABASE_SECRET}`,
                "Content-Type": "application/json",
                Prefer: "resolution=merge-duplicates,return=minimal",
              },
              body: JSON.stringify(icgData),
            });
            icgSaved = icgUpsert.ok;
            if (!icgUpsert.ok) errors.push(`ICG Supabase: ${icgUpsert.status}`);
          }
        } catch (e) {
          errors.push(`ICG parse: ${e.message}`);
        }
      } else {
        errors.push("ICG: No AI provider responded");
      }
    } else {
      errors.push(`ICG: Only ${articles.length} articles found (need 5+)`);
    }
  } catch (e) {
    errors.push(`ICG: ${e.message}`);
  }

  // ── 5. News Alerts — Classify headlines with AI ──
  let alertsResult = { saved: false, provider: null, count: 0 };
  try {
    alertsResult = await classifyNewsAlerts(errors);
  } catch (e) {
    errors.push(`Alerts: ${e.message}`);
  }

  return res.status(200).json({
    inserted: totalInserted,
    ratesSaved,
    readingsSaved,
    icgSaved,
    icgProvider,
    alertsSaved: alertsResult.saved,
    alertsProvider: alertsResult.provider,
    alertsCount: alertsResult.count,
    sources: RSS_SOURCES.length,
    errors: errors.length > 0 ? errors : null,
    fetchedAt: new Date().toISOString(),
  });
}
