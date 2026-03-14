// /api/news — Venezuela news + fact-check aggregator + Government Cohesion Index
// Routes: default → RSS news, ?source=cohesion → ICG engine

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

// ═══════════════════════════════════════════════════════════════
// COHESION INDEX ENGINE — ?source=cohesion
// ═══════════════════════════════════════════════════════════════

const ACTORS = [
  { id: "delcy", name: "Delcy Rodríguez", queries: ["Delcy Rodriguez Venezuela", "Delcy Rodriguez gobierno"] },
  { id: "jrodriguez", name: "Jorge Rodríguez", queries: ["Jorge Rodriguez Asamblea Venezuela", "Jorge Rodriguez AN Venezuela"] },
  { id: "cabello", name: "Diosdado Cabello", queries: ["Diosdado Cabello Venezuela", "Cabello PSUV"] },
  { id: "fanb", name: "Fuerza Armada Nacional Bolivariana (FANB)", queries: ["FANB Venezuela militar", "Fuerza Armada Nacional Bolivariana"] },
  { id: "padrino", name: "Vladimir Padrino López", queries: ["Vladimir Padrino Lopez Venezuela", "Padrino Lopez FANB ministro defensa"] },
  { id: "arreaza", name: "Jorge Arreaza", queries: ["Jorge Arreaza Venezuela", "Arreaza gobierno Venezuela"] },
  { id: "maduroguerra", name: "Nicolás Maduro Guerra", queries: ["Nicolas Maduro Guerra Venezuela", "Nicolasito Maduro hijo Venezuela"] },
  { id: "an", name: "Asamblea Nacional", queries: ["Asamblea Nacional Venezuela ley", "AN Venezuela legislativa"] },
];

// Google News RSS per actor
async function fetchActorNews(actor) {
  const articles = [];
  for (const q of actor.queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=es-419&gl=VE&ceid=VE:es-419`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(6000),
        headers: { "User-Agent": "PNUD-Monitor/1.0", Accept: "application/rss+xml, text/xml" },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const items = parseRSSSimple(xml);
      articles.push(...items.slice(0, 5));
    } catch { continue; }
  }
  const seen = new Set();
  return articles.filter(a => {
    const key = a.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
}

function parseRSSSimple(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = (content.match(/<title><!\[CDATA\[(.*?)\]\]>/) || content.match(/<title>(.*?)<\/title>/) || [])[1] || "";
    const link = (content.match(/<link>(.*?)<\/link>/) || [])[1] || "";
    const pubDate = (content.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";
    const desc = (content.match(/<description><!\[CDATA\[(.*?)\]\]>/) || content.match(/<description>(.*?)<\/description>/) || [])[1] || "";
    if (title) {
      items.push({
        title: title.replace(/<[^>]*>/g, "").trim(),
        link: link.trim(),
        date: pubDate,
        desc: desc.replace(/<[^>]*>/g, "").substring(0, 500).trim(),
      });
    }
  }
  return items;
}

// Mistral AI classification — uses titles + descriptions (more reliable than full article fetch)
async function classifyWithMistral(actorName, articles) {
  if (!MISTRAL_API_KEY || articles.length === 0) return null;

  // Use titles + descriptions — more reliable than trying to fetch full articles through Google News redirects
  const articlesText = articles.slice(0, 5).map((a, i) =>
    `${i + 1}. "${a.title}"${a.desc ? `\n   ${a.desc}` : ""}`
  ).join("\n\n");

  const prompt = `Eres un analista político especializado en Venezuela 2026. Delcy Rodríguez es la líder interina del gobierno tras la captura de Maduro en enero 2026.

Analiza estos titulares/artículos recientes sobre "${actorName}" y clasifica su ALINEACIÓN con el gobierno de Delcy Rodríguez.

ARTÍCULOS RECIENTES:
${articlesText}

Responde SOLO con un JSON válido (sin markdown, sin backticks):
{"alignment":"ALINEADO","confidence":0.8,"evidence":"razón principal","signals":["señal1","señal2"]}

Criterios:
- ALINEADO: Acciones coordinadas con el ejecutivo, declaraciones de apoyo, participación activa en gestión gubernamental
- NEUTRO: Sin señales claras, silencio parcial, declaraciones ambiguas, perfil bajo
- TENSION: Contradicciones públicas, ausencias notables, declaraciones divergentes, señales de distancia con Delcy`;

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error("Mistral error:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    // Normalize
    return {
      alignment: ["ALINEADO", "NEUTRO", "TENSION"].includes(parsed.alignment) ? parsed.alignment : "NEUTRO",
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
      evidence: parsed.evidence || null,
      signals: Array.isArray(parsed.signals) ? parsed.signals.slice(0, 3) : [],
    };
  } catch (e) {
    console.error("Mistral classification error:", e.message);
    return null;
  }
}

// GDELT Tone per actor
async function fetchGdeltToneForActor(actorName) {
  try {
    // Use simpler query without quotes for better matching
    const shortName = actorName.split("(")[0].trim(); // Remove parentheticals like "(FANB)"
    const query = encodeURIComponent(`${shortName} venezuela`);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=timelinetone&timespan=7d&format=csv`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const csv = await res.text();
    const lines = csv.trim().split("\n").slice(1);
    if (lines.length === 0) return null;
    let sum = 0, count = 0;
    for (const line of lines) {
      const val = parseFloat(line.split(",").pop());
      if (!isNaN(val)) { sum += val; count++; }
    }
    return count > 0 ? sum / count : null;
  } catch {
    return null;
  }
}

// GDELT mention count — use timelinevol (more reliable than artlist JSON)
async function fetchGdeltMentionCount(actorName) {
  try {
    const shortName = actorName.split("(")[0].trim();
    const query = encodeURIComponent(`${shortName} venezuela`);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=timelinevol&timespan=7d&format=csv`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return 0;
    const csv = await res.text();
    const lines = csv.trim().split("\n").slice(1);
    let total = 0;
    for (const line of lines) {
      const val = parseFloat(line.split(",").pop());
      if (!isNaN(val)) total += val;
    }
    return Math.round(total);
  } catch {
    return 0;
  }
}

// Polymarket — try multiple Venezuela-related slugs
async function fetchPolymarketSignal() {
  const slugs = [
    "will-delcy-rodrguez-be-the-leader-of-venezuela-end-of-2026",
    "delcy-rodrguez-out-as-leader-of-venezuela-by",
    "venezuela-leader-end-of-2026",
  ];
  for (const slug of slugs) {
    try {
      const res = await fetch(
        `https://gamma-api.polymarket.com/events?slug=${slug}`,
        { signal: AbortSignal.timeout(5000), headers: { Accept: "application/json" } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const market = data?.[0]?.markets?.[0];
      if (market) {
        const price = parseFloat(market.lastTradePrice) || parseFloat(market.bestBid) || null;
        if (price != null) {
          return {
            price,
            slug: market.slug || slug,
            question: market.question || data?.[0]?.title || "Delcy líder",
          };
        }
      }
    } catch { continue; }
  }
  return null;
}

// ── HEURISTIC STATUS — when Mistral doesn't classify ──
function heuristicStatus(mentions, tone) {
  if (mentions === 0) return "SILENCIO";
  // Tone: negative = conflictive coverage, but for government actors negative tone is normal
  // High mentions + very negative tone = potential tension
  if (mentions > 20 && tone != null && tone < -5) return "TENSION";
  if (mentions > 10) return "ALINEADO"; // Active in media = likely participating in government
  if (mentions > 0 && tone != null && tone > -3) return "NEUTRO";
  return "NEUTRO";
}

// ── SCORING ENGINE ──
function computeCohesionScore(actorResults, gdeltTones, gdeltMentions, polymarket, sitrepOverride) {
  // === 1. AI Alignment Score (30%) ===
  let aiScore = 50;
  const classifications = actorResults.filter(a => a.classification);
  if (classifications.length > 0) {
    const alignmentValues = { ALINEADO: 100, NEUTRO: 50, TENSION: 0 };
    const total = classifications.reduce((sum, a) => {
      const val = alignmentValues[a.classification.alignment] ?? 50;
      const conf = a.classification.confidence ?? 0.5;
      return sum + val * conf;
    }, 0);
    const totalConf = classifications.reduce((s, a) => s + (a.classification.confidence ?? 0.5), 0);
    aiScore = totalConf > 0 ? total / totalConf : 50;
  } else {
    // Fallback: use heuristic status from mentions + tone
    const heuristics = actorResults.map(a => heuristicStatus(a.mentions, a.tone));
    const hValues = { ALINEADO: 100, NEUTRO: 50, TENSION: 0, SILENCIO: 30 };
    const hTotal = heuristics.reduce((s, h) => s + (hValues[h] ?? 50), 0);
    aiScore = hTotal / heuristics.length;
  }

  // === 2. GDELT Tone Divergence (15%) ===
  let toneDivScore = 75;
  const toneValues = Object.values(gdeltTones).filter(v => v !== null);
  if (toneValues.length >= 2) {
    const maxTone = Math.max(...toneValues);
    const minTone = Math.min(...toneValues);
    const divergence = maxTone - minTone;
    toneDivScore = Math.max(0, Math.min(100, 100 - divergence * 10));
  }

  // === 3. Mention Count / Silence (15%) ===
  let silenceScore = 75;
  const mentionValues = Object.entries(gdeltMentions);
  if (mentionValues.length > 0) {
    const avgMentions = mentionValues.reduce((s, [, v]) => s + v, 0) / mentionValues.length;
    const threshold = Math.max(avgMentions * 0.15, 3); // at least 3 mentions to not be "silent"
    const silentActors = mentionValues.filter(([, v]) => v < threshold).length;
    silenceScore = Math.max(20, 100 - silentActors * 12);
  }

  // === 4. Polymarket Delta (10%) ===
  let polyScore = 50;
  if (polymarket?.price != null) {
    polyScore = polymarket.price * 100;
  }

  // === 5. SITREP Override (30%) ===
  const sitrepScore = sitrepOverride ?? null;

  // === COMPOSITE ===
  let composite;
  if (sitrepScore !== null) {
    composite = aiScore * 0.30 + sitrepScore * 0.30 + toneDivScore * 0.15 + silenceScore * 0.15 + polyScore * 0.10;
  } else {
    composite = aiScore * 0.43 + toneDivScore * 0.21 + silenceScore * 0.21 + polyScore * 0.15;
  }

  return {
    composite: Math.round(Math.max(0, Math.min(100, composite))),
    components: {
      aiAlignment: { score: Math.round(aiScore), weight: sitrepScore !== null ? 0.30 : 0.43 },
      gdeltToneDivergence: { score: Math.round(toneDivScore), weight: sitrepScore !== null ? 0.15 : 0.21 },
      mentionSilence: { score: Math.round(silenceScore), weight: sitrepScore !== null ? 0.15 : 0.21 },
      polymarketDelta: { score: Math.round(polyScore), weight: sitrepScore !== null ? 0.10 : 0.15 },
      sitrepValidation: sitrepScore !== null ? { score: sitrepScore, weight: 0.30 } : null,
    },
    hasSitrep: sitrepScore !== null,
  };
}

// ── MAIN COHESION HANDLER ──
async function handleCohesion(req, res) {
  const sitrepOverride = req.query.sitrep ? parseInt(req.query.sitrep) : null;
  const skipAI = req.query.skipai === "true";

  try {
    const actorPromises = ACTORS.map(async (actor) => {
      const [news, tone, mentions] = await Promise.all([
        fetchActorNews(actor),
        fetchGdeltToneForActor(actor.name),
        fetchGdeltMentionCount(actor.name),
      ]);

      // Classify with Mistral (even when skipai, use heuristic)
      let classification = null;
      if (!skipAI && MISTRAL_API_KEY && news.length > 0) {
        classification = await classifyWithMistral(actor.name, news);
      }

      return {
        actor: actor.id,
        name: actor.name,
        newsCount: news.length,
        topHeadlines: news.slice(0, 3).map(n => ({ title: n.title, link: n.link, date: n.date })),
        tone,
        mentions,
        classification,
      };
    });

    const [actorResults, polymarket] = await Promise.all([
      Promise.all(actorPromises),
      fetchPolymarketSignal(),
    ]);

    const gdeltTones = {};
    const gdeltMentions = {};
    for (const r of actorResults) {
      gdeltTones[r.actor] = r.tone;
      gdeltMentions[r.actor] = r.mentions;
    }

    const scoring = computeCohesionScore(actorResults, gdeltTones, gdeltMentions, polymarket, sitrepOverride);

    // Build actor semaphore — use Mistral if available, else heuristic
    const actorSemaphore = actorResults.map(r => {
      let status;
      if (r.classification) {
        status = r.classification.alignment;
      } else {
        status = heuristicStatus(r.mentions, r.tone);
      }
      return {
        actor: r.actor,
        name: r.name,
        status,
        confidence: r.classification?.confidence ?? null,
        evidence: r.classification?.evidence ?? (r.mentions > 0 ? `${r.mentions} menciones en 7d · tono ${r.tone?.toFixed(1) ?? "N/A"}` : "Sin cobertura mediática detectada"),
        signals: r.classification?.signals ?? [],
        mentions: r.mentions,
        tone: r.tone != null ? parseFloat(r.tone.toFixed(2)) : null,
        topHeadlines: r.topHeadlines,
      };
    });

    res.setHeader("Cache-Control", "public, s-maxage=600, must-revalidate");
    return res.status(200).json({
      index: scoring.composite,
      level: scoring.composite >= 75 ? "ALTA" : scoring.composite >= 50 ? "MEDIA" : scoring.composite >= 25 ? "BAJA" : "CRITICA",
      components: scoring.components,
      hasSitrep: scoring.hasSitrep,
      actors: actorSemaphore,
      polymarket: polymarket ? { price: polymarket.price, question: polymarket.question } : null,
      fetchedAt: new Date().toISOString(),
      engine: skipAI ? "gdelt+heuristic" : (MISTRAL_API_KEY ? "mistral+gdelt" : "gdelt+heuristic"),
    });
  } catch (e) {
    console.error("Cohesion handler error:", e);
    return res.status(502).json({ error: e.message, index: null });
  }
}

// ═══════════════════════════════════════════════════════════════
// ORIGINAL NEWS/RSS ENGINE — default route
// ═══════════════════════════════════════════════════════════════

const RSS_SOURCES = [
  { name:"Efecto Cocuyo", feed:"https://efectococuyo.com/feed/", lang:"es", type:"news" },
  { name:"El Pitazo", feed:"https://elpitazo.net/feed/", lang:"es", type:"news" },
  { name:"Runrunes", feed:"https://runrun.es/feed/", lang:"es", type:"news" },
  { name:"Tal Cual", feed:"https://talcualdigital.com/feed/", lang:"es", type:"news" },
  { name:"El Estímulo", feed:"https://elestimulo.com/feed/", lang:"es", type:"news" },
  { name:"Caracas Chronicles", feed:"https://www.caracaschronicles.com/feed/", lang:"en", type:"news" },
  { name:"Reuters VE", feed:"https://news.google.com/rss/search?q=venezuela+reuters&hl=en", type:"news" },
  { name:"BBC Lat Am", feed:"https://feeds.bbci.co.uk/news/world/latin_america/rss.xml", type:"news" },
  { name:"NYT World", feed:"https://rss.nytimes.com/services/xml/rss/nyt/World.xml", type:"news" },
  { name:"Al Jazeera", feed:"https://www.aljazeera.com/xml/rss/all.xml", type:"news" },
  { name:"The Guardian VE", feed:"https://www.theguardian.com/world/venezuela/rss", type:"news" },
  { name:"Infobae", feed:"https://www.infobae.com/feeds/rss/", type:"news" },
  { name:"El País", feed:"https://elpais.com/rss/elpais/portada.xml", type:"news" },
  { name:"France24", feed:"https://www.france24.com/es/am%C3%A9rica-latina/rss", type:"news" },
  { name:"Google News VE", feed:"https://news.google.com/rss/search?q=venezuela", type:"news" },
  { name:"Google News VE Economía", feed:"https://news.google.com/rss/search?q=venezuela+economia", type:"news" },
  { name:"Google News VE Política", feed:"https://news.google.com/rss/search?q=venezuela+politica", type:"news" },
  { name:"Cocuyo Chequea", feed:"https://efectococuyo.com/cocuyo-chequea/feed/", lang:"es", type:"factcheck" },
  { name:"Cotejo.info", feed:"https://cotejo.info/feed/", lang:"es", type:"factcheck" },
  { name:"EsPaja", feed:"https://espaja.com/feed/", lang:"es", type:"factcheck" },
  { name:"Cazamos Fake News", feed:"https://www.cazadoresdefakenews.info/feed/", lang:"es", type:"factcheck" },
  { name:"Provea", feed:"https://provea.org/feed/", lang:"es", type:"factcheck" },
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
  "Internacional": /EE\.UU|Trump|Rubio|Blinken|UE|Europa|Uni[oó]n Europea|ONU|Colombia|Petro|China|Rusia|sanci[oó]n|diplom|embajad|fronter|migra|SOUTHCOM|geopo/i,
};

function tagScenario(title, description) {
  const text = `${title} ${description}`;
  const scenarios = [], dims = [];
  for (const [esc, pattern] of Object.entries(SCENARIO_TAGS)) { if (pattern.test(text)) scenarios.push(esc); }
  for (const [dim, pattern] of Object.entries(DIM_TAGS)) { if (pattern.test(text)) dims.push(dim); }
  return { scenarios: scenarios.length > 0 ? scenarios : ["E3"], dims: dims.length > 0 ? dims : ["Político"] };
}

function parseRSS(xml, sourceName) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = (content.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/) || [])[1] || (content.match(/<title>(.*?)<\/title>/) || [])[1] || "";
    const link = (content.match(/<link>(.*?)<\/link>/) || [])[1] || "";
    const desc = (content.match(/<description><!\[CDATA\[(.*?)\]\]>|<description>(.*?)<\/description>/) || [])[1] || "";
    const pubDate = (content.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";
    if (title) {
      items.push({
        title: title.replace(/<[^>]*>/g, "").trim(),
        link: link.trim(),
        desc: desc.replace(/<[^>]*>/g, "").substring(0, 200).trim(),
        date: pubDate,
        source: sourceName,
        ...tagScenario(title.replace(/<[^>]*>/g, ""), desc.replace(/<[^>]*>/g, "")),
      });
    }
  }
  return items;
}

async function handleNews(req, res) {
  try {
    const results = await Promise.all(
      RSS_SOURCES.map(async (src) => {
        try {
          const response = await fetch(src.feed, {
            signal: AbortSignal.timeout(6000),
            headers: { "User-Agent": "PNUD-Monitor/1.0", Accept: "application/rss+xml, application/xml, text/xml" },
          });
          if (!response.ok) return [];
          const xml = await response.text();
          return parseRSS(xml, src.name).slice(0, 5).map(item => ({ ...item, type: src.type }));
        } catch { return []; }
      })
    );
    const all = results.flat().sort((a, b) => new Date(b.date) - new Date(a.date));
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=300");
    return res.status(200).json({
      news: all.filter(i => i.type === "news").slice(0, 25),
      factcheck: all.filter(i => i.type === "factcheck").slice(0, 15),
      sources: RSS_SOURCES.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(502).json({ error: e.message, news: [], factcheck: [] });
  }
}

// ═══════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════

module.exports = async function handler(req, res) {
  const { source } = req.query;
  if (source === "cohesion") return handleCohesion(req, res);
  return handleNews(req, res);
};
