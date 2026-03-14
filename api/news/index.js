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

// Google News RSS per actor — fetches recent headlines mentioning each actor
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
  // Deduplicate by title similarity
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
        desc: desc.replace(/<[^>]*>/g, "").substring(0, 300).trim(),
      });
    }
  }
  return items;
}

// Fetch full article text via a simple extraction
async function fetchArticleText(url) {
  try {
    // Follow Google News redirects
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PNUD-Monitor/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Extract text from <p> tags — simple but effective
    const paragraphs = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let m;
    while ((m = pRegex.exec(html)) !== null) {
      const text = m[1].replace(/<[^>]*>/g, "").trim();
      if (text.length > 40) paragraphs.push(text);
    }
    return paragraphs.join("\n\n").substring(0, 3000); // Cap at 3000 chars
  } catch {
    return null;
  }
}

// Mistral AI classification of actor alignment
async function classifyWithMistral(actorName, articles) {
  if (!MISTRAL_API_KEY || articles.length === 0) return null;

  const articlesText = articles.map((a, i) =>
    `Artículo ${i + 1}: "${a.title}"\n${a.fullText || a.desc || "(sin texto)"}`
  ).join("\n\n---\n\n");

  const prompt = `Eres un analista político especializado en Venezuela. Analiza los siguientes artículos recientes que mencionan a "${actorName}" y clasifica su ALINEACIÓN con el gobierno de Delcy Rodríguez.

ARTÍCULOS:
${articlesText}

Responde SOLO con un objeto JSON válido (sin markdown, sin backticks), con esta estructura exacta:
{
  "actor": "${actorName}",
  "alignment": "ALINEADO" | "NEUTRO" | "TENSION",
  "confidence": 0.0-1.0,
  "evidence": "Una oración con la evidencia clave",
  "signals": ["señal1", "señal2"]
}

Criterios:
- ALINEADO: Declaraciones de apoyo, acciones coordinadas con el ejecutivo, sin contradicciones públicas
- NEUTRO: Sin señales claras en ninguna dirección, silencio parcial, declaraciones ambiguas
- TENSION: Contradicciones públicas, ausencias notables, declaraciones divergentes, señales de distancia`;

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
        max_tokens: 500,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Mistral error:", res.status, err);
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    // Parse JSON — strip any markdown fences
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("Mistral classification error:", e.message);
    return null;
  }
}

// GDELT Tone per actor — divergence signal
async function fetchGdeltToneForActor(actorName) {
  try {
    const query = encodeURIComponent(`"${actorName}" venezuela`);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=timelinetone&timespan=7d&format=csv`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const csv = await res.text();
    const lines = csv.trim().split("\n").slice(1);
    if (lines.length === 0) return null;
    // Average tone across the period
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

// GDELT mention count per actor — silence detection
async function fetchGdeltMentionCount(actorName) {
  try {
    const query = encodeURIComponent(`"${actorName}" venezuela`);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=100&timespan=7d&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.articles?.length || 0;
  } catch {
    return 0;
  }
}

// Polymarket delta signal
async function fetchPolymarketSignal() {
  try {
    const res = await fetch(
      "https://gamma-api.polymarket.com/events?slug=will-delcy-rodrguez-be-the-leader-of-venezuela-end-of-2026",
      { signal: AbortSignal.timeout(6000), headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const market = data?.[0]?.markets?.[0];
    if (!market) return null;
    return {
      price: parseFloat(market.lastTradePrice) || parseFloat(market.bestBid) || null,
      slug: market.slug || "delcy-leader",
      question: market.question || "Delcy líder fin de 2026",
    };
  } catch {
    return null;
  }
}

// ── SCORING ENGINE ──
function computeCohesionScore(actorResults, gdeltTones, gdeltMentions, polymarket, sitrepOverride) {
  // === 1. AI Alignment Score (30%) ===
  let aiScore = 50; // default neutral
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
  }

  // === 2. GDELT Tone Divergence (15%) ===
  let toneDivScore = 75; // default = moderate cohesion
  const toneValues = Object.values(gdeltTones).filter(v => v !== null);
  if (toneValues.length >= 2) {
    const maxTone = Math.max(...toneValues);
    const minTone = Math.min(...toneValues);
    const divergence = maxTone - minTone; // 0 = perfect alignment, >5 = high divergence
    // Map: 0 divergence → 100, 10+ divergence → 0
    toneDivScore = Math.max(0, Math.min(100, 100 - divergence * 10));
  }

  // === 3. Mention Count / Silence (15%) ===
  let silenceScore = 75; // default
  const mentionValues = Object.entries(gdeltMentions);
  if (mentionValues.length > 0) {
    const avgMentions = mentionValues.reduce((s, [, v]) => s + v, 0) / mentionValues.length;
    const silentActors = mentionValues.filter(([, v]) => v < avgMentions * 0.2).length;
    // If actors are silent relative to others, cohesion signal drops
    // 0 silent → 100, all silent → 20
    silenceScore = Math.max(20, 100 - silentActors * 20);
  }

  // === 4. Polymarket Delta (10%) ===
  let polyScore = 50; // neutral default
  if (polymarket?.price != null) {
    // Higher price for "Delcy leader" = more stability = higher cohesion
    polyScore = polymarket.price * 100; // price is 0-1
  }

  // === 5. SITREP Override (30%) ===
  // This comes from manual weekly input — use override if provided
  const sitrepScore = sitrepOverride ?? null;

  // === COMPOSITE ===
  let composite;
  if (sitrepScore !== null) {
    composite = aiScore * 0.30 + sitrepScore * 0.30 + toneDivScore * 0.15 + silenceScore * 0.15 + polyScore * 0.10;
  } else {
    // Without SITREP, redistribute weight to automatic signals
    // AI: 43%, Tone: 21%, Silence: 21%, Poly: 15%
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
  const skipAI = req.query.skipai === "true"; // For testing without Mistral

  try {
    // 1. Fetch news per actor + GDELT signals in parallel
    const actorPromises = ACTORS.map(async (actor) => {
      const [news, tone, mentions] = await Promise.all([
        fetchActorNews(actor),
        fetchGdeltToneForActor(actor.name),
        fetchGdeltMentionCount(actor.name),
      ]);

      // 2. For top 3 articles, fetch full text
      let enrichedNews = news;
      if (!skipAI) {
        enrichedNews = await Promise.all(
          news.slice(0, 3).map(async (article) => {
            const fullText = await fetchArticleText(article.link);
            return { ...article, fullText };
          })
        );
      }

      // 3. Classify with Mistral
      let classification = null;
      if (!skipAI && MISTRAL_API_KEY) {
        classification = await classifyWithMistral(actor.name, enrichedNews);
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

    // Polymarket in parallel
    const [actorResults, polymarket] = await Promise.all([
      Promise.all(actorPromises),
      fetchPolymarketSignal(),
    ]);

    // Build tone/mention maps
    const gdeltTones = {};
    const gdeltMentions = {};
    for (const r of actorResults) {
      gdeltTones[r.actor] = r.tone;
      gdeltMentions[r.actor] = r.mentions;
    }

    // 4. Compute composite score
    const scoring = computeCohesionScore(actorResults, gdeltTones, gdeltMentions, polymarket, sitrepOverride);

    // 5. Build actor semaphore
    const actorSemaphore = actorResults.map(r => {
      let status = "NEUTRO";
      if (r.classification) {
        status = r.classification.alignment;
      } else if (r.mentions === 0) {
        status = "SILENCIO";
      }
      return {
        actor: r.actor,
        name: r.name,
        status,
        confidence: r.classification?.confidence ?? null,
        evidence: r.classification?.evidence ?? null,
        signals: r.classification?.signals ?? [],
        mentions: r.mentions,
        tone: r.tone != null ? parseFloat(r.tone.toFixed(2)) : null,
        topHeadlines: r.topHeadlines,
      };
    });

    // Cache for 10 min (automatic signals change slowly)
    res.setHeader("Cache-Control", "public, s-maxage=600, must-revalidate");
    return res.status(200).json({
      index: scoring.composite,
      level: scoring.composite >= 75 ? "ALTA" : scoring.composite >= 50 ? "MEDIA" : scoring.composite >= 25 ? "BAJA" : "CRITICA",
      components: scoring.components,
      hasSitrep: scoring.hasSitrep,
      actors: actorSemaphore,
      polymarket: polymarket ? { price: polymarket.price, question: polymarket.question } : null,
      fetchedAt: new Date().toISOString(),
      engine: skipAI ? "gdelt-only" : "mistral+gdelt",
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
  // ── International ──
  { name:"Reuters VE", feed:"https://news.google.com/rss/search?q=venezuela+reuters&hl=en", type:"news" },
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
  // ── Especializados ──
  { name:"Venezuela Analysis", feed:"https://venezuelanalysis.com/feed/", type:"news" },
  { name:"Banca y Negocios", feed:"https://www.bancaynegocios.com/feed/", type:"news" },
  { name:"Contrapunto", feed:"https://contrapunto.com/feed/", type:"news" },
  { name:"Descifrado", feed:"https://descifrado.com/feed/", type:"news" },
  // ── Google News aggregator ──
  { name:"Google News VE", feed:"https://news.google.com/rss/search?q=venezuela", type:"news" },
  { name:"Google News VE Economía", feed:"https://news.google.com/rss/search?q=venezuela+economia", type:"news" },
  { name:"Google News VE Política", feed:"https://news.google.com/rss/search?q=venezuela+politica", type:"news" },
  // ── Fact-checkers ──
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
  const scenarios = [];
  for (const [esc, pattern] of Object.entries(SCENARIO_TAGS)) {
    if (pattern.test(text)) scenarios.push(esc);
  }
  const dims = [];
  for (const [dim, pattern] of Object.entries(DIM_TAGS)) {
    if (pattern.test(text)) dims.push(dim);
  }
  return {
    scenarios: scenarios.length > 0 ? scenarios : ["E3"],
    dims: dims.length > 0 ? dims : ["Político"],
  };
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
      const cleanTitle = title.replace(/<[^>]*>/g, "").trim();
      const cleanDesc = desc.replace(/<[^>]*>/g, "").substring(0, 200).trim();
      items.push({
        title: cleanTitle,
        link: link.trim(),
        desc: cleanDesc,
        date: pubDate,
        source: sourceName,
        ...tagScenario(cleanTitle, cleanDesc),
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
        } catch {
          return [];
        }
      })
    );

    const all = results.flat().sort((a, b) => new Date(b.date) - new Date(a.date));
    const news = all.filter(i => i.type === "news").slice(0, 25);
    const factcheck = all.filter(i => i.type === "factcheck").slice(0, 15);

    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=300");
    return res.status(200).json({
      news,
      factcheck,
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

  if (source === "cohesion") {
    return handleCohesion(req, res);
  }

  // Default: news RSS aggregator
  return handleNews(req, res);
};
