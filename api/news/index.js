// /api/news — Venezuela news + fact-check aggregator + Government Cohesion Index
// Routes: default → RSS news, ?source=cohesion → ICG engine

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

const { ICG_FEEDS: VEN_RSS_FEEDS, NEWS_RSS_FEEDS: RSS_SOURCES } = require("../../src/feeds.js");

// ═══════════════════════════════════════════════════════════════
// COHESION INDEX ENGINE — ?source=cohesion
// ═══════════════════════════════════════════════════════════════

const ACTORS = [
  // ── Actores Clave (individuales) ──
  { id: "delcy", name: "Delcy Rodríguez", group: "actor", queries: ["Delcy Rodriguez Venezuela", "Delcy Rodriguez gobierno"] },
  { id: "jrodriguez", name: "Jorge Rodríguez", group: "actor", queries: ["Jorge Rodriguez Asamblea Venezuela", "Jorge Rodriguez AN Venezuela"] },
  { id: "cabello", name: "Diosdado Cabello", group: "actor", queries: ["Diosdado Cabello Venezuela", "Cabello PSUV"] },
  { id: "fanb", name: "Fuerza Armada Nacional Bolivariana (FANB)", group: "actor", queries: ["FANB Venezuela militar", "Fuerza Armada Nacional Bolivariana"] },
  { id: "padrino", name: "Vladimir Padrino López", group: "actor", queries: ["Vladimir Padrino Lopez Venezuela", "Padrino Lopez FANB ministro defensa"] },
  { id: "arreaza", name: "Jorge Arreaza", group: "actor", queries: ["Jorge Arreaza Venezuela", "Arreaza gobierno Venezuela"] },
  { id: "maduroguerra", name: "Nicolás Maduro Guerra", group: "actor", queries: ["Nicolas Maduro Guerra Venezuela", "Nicolasito Maduro hijo Venezuela"] },
  { id: "an", name: "Asamblea Nacional", group: "actor", queries: ["Asamblea Nacional Venezuela ley", "AN Venezuela legislativa"] },
  // ── Cohesión Sistémica (chavismo como bloque) ──
  { id: "psuv", name: "PSUV", group: "systemic", queries: ["PSUV Venezuela partido", "PSUV congreso unidad"] },
  { id: "chavismo", name: "Chavismo (movimiento)", group: "systemic", queries: ["chavismo Venezuela", "movimiento chavista unidad fractura"] },
  { id: "colectivos", name: "Colectivos", group: "systemic", queries: ["colectivos Venezuela armados", "colectivos chavistas gobierno"] },
  { id: "gobernadores", name: "Gobernadores chavistas", group: "systemic", queries: ["gobernadores Venezuela PSUV", "gobernadores chavistas regionales"] },
  { id: "militares", name: "Sector militar amplio", group: "systemic", queries: ["militares Venezuela generales", "CEOFANB GNB Venezuela DGCIM"] },
];

// ── VENEZUELAN RSS FEEDS — local media for better actor coverage ──

// ── IN-MEMORY CACHE — last valid classification per actor ──
// Persists across warm invocations on Vercel (same lambda instance)
const classificationCache = {};

// Fetch Venezuelan RSS and filter by actor name keywords
async function fetchVenRSSForActor(actor) {
  const keywords = actor.name.toLowerCase()
    .replace(/[()]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 3 && !["venezuela", "poder", "popular", "fuerza", "nacional"].includes(w));
  
  const articles = [];
  // Only fetch 3 feeds to stay within timeout budget (6s total)
  const feedsToTry = VEN_RSS_FEEDS.slice(0, 6);
  
  await Promise.allSettled(feedsToTry.map(async (src) => {
    try {
      const res = await fetch(src.feed, {
        signal: AbortSignal.timeout(4000),
        headers: { "User-Agent": "PNUD-Monitor/1.0", Accept: "application/rss+xml, text/xml" },
      });
      if (!res.ok) return;
      const xml = await res.text();
      const items = parseRSSSimple(xml);
      // Filter items mentioning the actor
      for (const item of items.slice(0, 20)) {
        const text = (item.title + " " + item.desc).toLowerCase();
        const matches = keywords.filter(kw => text.includes(kw));
        if (matches.length >= 1) { // At least 1 keyword match
          articles.push({ ...item, source: src.name, bias: src.bias });
        }
      }
    } catch { /* timeout or error — skip */ }
  }));
  
  return articles.slice(0, 5);
}

// Google News RSS per actor + Venezuelan RSS feeds
async function fetchActorNews(actor) {
  // Fetch Google News and Venezuelan RSS in parallel
  const [googleArticles, venArticles] = await Promise.all([
    fetchGoogleNewsForActor(actor),
    fetchVenRSSForActor(actor),
  ]);
  
  // Merge and dedup
  const all = [...googleArticles, ...venArticles];
  const seen = new Set();
  return all.filter(a => {
    const key = a.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}

// Google News RSS (original function, renamed)
async function fetchGoogleNewsForActor(actor) {
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
  return articles;
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

// Polymarket — find Delcy-specific price from Venezuela events
async function fetchPolymarketSignal() {
  const slugs = [
    "venezuela-leader-end-of-2026",
    "will-delcy-rodrguez-be-the-leader-of-venezuela-end-of-2026",
    "delcy-rodrguez-out-as-leader-of-venezuela-by",
  ];
  for (const slug of slugs) {
    try {
      const res = await fetch(
        `https://gamma-api.polymarket.com/events?slug=${slug}`,
        { signal: AbortSignal.timeout(5000), headers: { Accept: "application/json" } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const event = data?.[0];
      if (!event?.markets?.length) continue;

      // For multi-outcome: find Delcy's specific market
      const delcyMarket = event.markets.find(m =>
        (m.question || m.groupItemTitle || "").toLowerCase().includes("delcy")
      );
      // For single-outcome: use first market
      const market = delcyMarket || event.markets[0];
      const price = parseFloat(market.lastTradePrice) || parseFloat(market.bestBid) || null;

      if (price != null) {
        // For "out as leader" markets, invert: high "out" price = low cohesion signal
        const isOutMarket = slug.includes("out-as-leader");
        return {
          price: isOutMarket ? 1 - price : price,
          slug: market.slug || slug,
          question: delcyMarket ? (delcyMarket.question || delcyMarket.groupItemTitle || "Delcy líder") : (market.question || event.title || "Venezuela líder"),
          raw: price,
        };
      }
    } catch { continue; }
  }
  return null;
}

// ── HEURISTIC STATUS — smarter logic using relative tone + mention patterns ──
function heuristicStatus(mentions, tone, avgTone, avgMentions) {
  if (mentions === 0) return "SILENCIO";

  // Compare actor's tone vs group average — divergence = tension signal
  const toneDelta = (tone != null && avgTone != null) ? tone - avgTone : 0;
  const mentionRatio = avgMentions > 0 ? mentions / avgMentions : 1;

  // Very negative tone AND significantly worse than group = TENSION
  if (tone != null && tone < -5 && toneDelta < -1.5) return "TENSION";
  // Dramatically fewer mentions than average = something is off
  if (mentionRatio < 0.15 && mentions < 5) return "SILENCIO";
  // Significantly less visible than peers = potential distance
  if (mentionRatio < 0.3) return "NEUTRO";
  // Much more negative than average = potential friction
  if (toneDelta < -2) return "NEUTRO";
  // Active with tone close to group norm = aligned
  if (mentionRatio > 0.5 && (toneDelta > -1.5 || tone == null)) return "ALINEADO";
  return "NEUTRO";
}

// ── SCORING ENGINE ──
function computeCohesionScore(actorResults, gdeltTones, gdeltMentions, polymarket, sitrepOverride) {
  // Split actors vs systemic for scoring
  const individualActors = actorResults.filter(a => a.group === "actor");
  const systemicActors = actorResults.filter(a => a.group === "systemic");
  // === 1. AI Alignment Score (25%) — individual actors only ===
  let aiScore = 50;
  const indClassifications = individualActors.filter(a => a.classification);

  // Compute group averages for heuristic (individual actors only)
  const indTones = individualActors.map(a => a.tone).filter(v => v !== null);
  const avgTone = indTones.length > 0 ? indTones.reduce((a,b)=>a+b,0)/indTones.length : null;
  const indMentions = individualActors.map(a => a.mentions);
  const avgMentions = indMentions.length > 0 ? indMentions.reduce((a,b)=>a+b,0)/indMentions.length : 0;

  if (indClassifications.length > 0) {
    const alignmentValues = { ALINEADO: 100, NEUTRO: 50, TENSION: 0 };
    const total = indClassifications.reduce((sum, a) => {
      const val = alignmentValues[a.classification.alignment] ?? 50;
      const conf = a.classification.confidence ?? 0.5;
      return sum + val * conf;
    }, 0);
    const totalConf = indClassifications.reduce((s, a) => s + (a.classification.confidence ?? 0.5), 0);
    aiScore = totalConf > 0 ? total / totalConf : 50;
  } else {
    const heuristics = individualActors.map(a => heuristicStatus(a.mentions, a.tone, avgTone, avgMentions));
    const hValues = { ALINEADO: 100, NEUTRO: 50, TENSION: 0, SILENCIO: 30 };
    const hTotal = heuristics.reduce((s, h) => s + (hValues[h] ?? 50), 0);
    aiScore = heuristics.length > 0 ? hTotal / heuristics.length : 50;
  }

  // === 2. GDELT Tone Divergence (15%) — individual actors ===
  let toneDivScore = 75;
  if (indTones.length >= 2) {
    const divergence = Math.max(...indTones) - Math.min(...indTones);
    toneDivScore = Math.max(0, Math.min(100, 100 - divergence * 10));
  }

  // === 3. Mention Count / Silence (10%) — individual actors ===
  let silenceScore = 75;
  if (indMentions.length > 0) {
    const threshold = Math.max(avgMentions * 0.15, 3);
    const silentActors = indMentions.filter(v => v < threshold).length;
    silenceScore = Math.max(20, 100 - silentActors * 12);
  }

  // === 4. Systemic Cohesion (10%) — chavismo bloc actors ===
  let systemicScore = 50;
  if (systemicActors.length > 0) {
    // Use Mistral classifications if available
    const sysClassified = systemicActors.filter(a => a.classification);
    if (sysClassified.length > 0) {
      const alignmentValues = { ALINEADO: 100, NEUTRO: 50, TENSION: 0 };
      const total = sysClassified.reduce((sum, a) => {
        return sum + (alignmentValues[a.classification.alignment] ?? 50) * (a.classification.confidence ?? 0.5);
      }, 0);
      const totalConf = sysClassified.reduce((s, a) => s + (a.classification.confidence ?? 0.5), 0);
      systemicScore = totalConf > 0 ? total / totalConf : 50;
    } else {
      // Heuristic from tone + mentions
      const sysTones = systemicActors.map(a => a.tone).filter(v => v !== null);
      if (sysTones.length >= 2) {
        const sysAvg = sysTones.reduce((a,b) => a+b, 0) / sysTones.length;
        systemicScore = Math.max(0, Math.min(100, (sysAvg + 8) / 8 * 100));
        const sysDivergence = Math.max(...sysTones) - Math.min(...sysTones);
        if (sysDivergence > 3) systemicScore *= 0.8;
      }
    }
    // Chavismo fracture signal
    const fracturaActor = systemicActors.find(a => a.actor === "chavismo");
    if (fracturaActor) {
      if (fracturaActor.classification?.alignment === "TENSION") systemicScore *= 0.6;
      else if (fracturaActor.tone != null && fracturaActor.tone < -6) systemicScore *= 0.7;
    }
  }

  // === 5. Polymarket Delta (10%) ===
  let polyScore = 50;
  if (polymarket?.price != null) {
    polyScore = polymarket.price * 100;
  }

  // === 6. SITREP Override (30%) ===
  const sitrepScore = sitrepOverride ?? null;

  // === COMPOSITE ===
  let composite;
  if (sitrepScore !== null) {
    // With SITREP: AI 25% + SITREP 30% + Tone 10% + Silence 5% + Systemic 10% + Poly 10% + leftover to SITREP
    composite = aiScore*0.25 + sitrepScore*0.30 + toneDivScore*0.10 + silenceScore*0.05 + systemicScore*0.10 + polyScore*0.10 + sitrepScore*0.10;
  } else {
    // Without SITREP: AI 35% + Tone 15% + Silence 10% + Systemic 15% + Poly 10% + default 50*0.15
    composite = aiScore*0.35 + toneDivScore*0.15 + silenceScore*0.10 + systemicScore*0.15 + polyScore*0.10 + 50*0.15;
  }

  return {
    composite: Math.round(Math.max(0, Math.min(100, composite))),
    components: {
      aiAlignment: { score: Math.round(aiScore), weight: sitrepScore !== null ? 0.25 : 0.35 },
      gdeltToneDivergence: { score: Math.round(toneDivScore), weight: sitrepScore !== null ? 0.10 : 0.15 },
      mentionSilence: { score: Math.round(silenceScore), weight: sitrepScore !== null ? 0.05 : 0.10 },
      systemicCohesion: { score: Math.round(systemicScore), weight: sitrepScore !== null ? 0.10 : 0.15 },
      polymarketDelta: { score: Math.round(polyScore), weight: 0.10 },
      sitrepValidation: sitrepScore !== null ? { score: sitrepScore, weight: 0.30 } : null,
    },
    hasSitrep: sitrepScore !== null,
  };
}

// ── MAIN COHESION HANDLER ──
async function handleCohesion(req, res) {
  const sitrepOverride = req.query.sitrep ? parseInt(req.query.sitrep) : null;
  const skipAI = req.query.skipai === "true";

  // Global timeout: if everything takes >25s, return partial results
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT_25S")), 25000));

  try {
    const mainWork = async () => {
    const actorPromises = ACTORS.map(async (actor) => {
      const [news, tone, mentions] = await Promise.all([
        fetchActorNews(actor),
        fetchGdeltToneForActor(actor.name),
        fetchGdeltMentionCount(actor.name),
      ]);

      // Classify with Mistral — cache valid results, fall back to cache when no data
      let classification = null;
      if (!skipAI && MISTRAL_API_KEY && news.length > 0) {
        classification = await classifyWithMistral(actor.name, news);
        // Cache valid classifications (confidence > 0.4)
        if (classification && classification.confidence > 0.4) {
          classificationCache[actor.id] = {
            ...classification,
            cachedAt: new Date().toISOString(),
            articleCount: news.length,
          };
        }
      }
      
      // Fall back to cached classification if no fresh data
      if (!classification && classificationCache[actor.id]) {
        const cached = classificationCache[actor.id];
        const ageMs = Date.now() - new Date(cached.cachedAt).getTime();
        const ageHours = ageMs / (1000 * 60 * 60);
        // Use cache if less than 48 hours old, with reduced confidence
        if (ageHours < 48) {
          classification = {
            alignment: cached.alignment,
            confidence: Math.max(0.3, cached.confidence * (1 - ageHours / 96)), // decay over 48h
            evidence: `[Cache ${Math.round(ageHours)}h] ${cached.evidence || ""}`,
            signals: cached.signals || [],
            fromCache: true,
          };
        }
      }

      return {
        actor: actor.id,
        name: actor.name,
        group: actor.group || "actor",
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

    // Compute group averages for heuristic (individual actors only)
    const indActors = actorResults.filter(a => a.group === "actor");
    const indTones = indActors.map(a => a.tone).filter(v => v !== null);
    const avgTone = indTones.length > 0 ? indTones.reduce((a,b)=>a+b,0)/indTones.length : null;
    const avgMentions = indActors.length > 0 ? indActors.reduce((s,a) => s+a.mentions, 0)/indActors.length : 0;

    const scoring = computeCohesionScore(actorResults, gdeltTones, gdeltMentions, polymarket, sitrepOverride);

    // Build actor semaphore — use Mistral if available, else heuristic
    const actorSemaphore = actorResults.map(r => {
      let status;
      if (r.classification) {
        status = r.classification.alignment;
      } else {
        status = heuristicStatus(r.mentions, r.tone, avgTone, avgMentions);
      }
      return {
        actor: r.actor,
        name: r.name,
        group: r.group,
        status,
        confidence: r.classification?.confidence ?? null,
        evidence: r.classification?.evidence ?? (r.mentions > 0 ? `${r.mentions} menciones en 7d · tono ${r.tone?.toFixed(1) ?? "N/A"}` : "Sin cobertura mediática detectada"),
        signals: r.classification?.signals ?? [],
        mentions: r.mentions,
        tone: r.tone != null ? parseFloat(r.tone.toFixed(2)) : null,
        topHeadlines: r.topHeadlines,
        fromCache: r.classification?.fromCache || false,
        newsCount: r.newsCount,
      };
    });

    // Split for response
    const actors = actorSemaphore.filter(a => a.group === "actor");
    const systemic = actorSemaphore.filter(a => a.group === "systemic");

    const cacheStats = {
      cached: actorSemaphore.filter(a => a.fromCache).length,
      fresh: actorSemaphore.filter(a => !a.fromCache && a.confidence != null).length,
      heuristic: actorSemaphore.filter(a => a.confidence == null).length,
      cacheSize: Object.keys(classificationCache).length,
    };

    res.setHeader("Cache-Control", "public, s-maxage=600, must-revalidate");
    return res.status(200).json({
      index: scoring.composite,
      level: scoring.composite >= 75 ? "ALTA" : scoring.composite >= 50 ? "MEDIA" : scoring.composite >= 25 ? "BAJA" : "CRITICA",
      components: scoring.components,
      hasSitrep: scoring.hasSitrep,
      actors,
      systemic,
      polymarket: polymarket ? { price: polymarket.price, question: polymarket.question } : null,
      fetchedAt: new Date().toISOString(),
      engine: skipAI ? "gdelt+heuristic" : (MISTRAL_API_KEY ? "mistral+gdelt+rss" : "gdelt+heuristic"),
      sources: "google_news+ven_rss+gdelt+polymarket",
      cacheStats,
    });
    }; // end mainWork

    return await Promise.race([mainWork(), timeoutPromise]);
  } catch (e) {
    if (e.message === "TIMEOUT_25S") {
      console.warn("Cohesion handler timed out at 25s — returning partial");
      return res.status(200).json({ index: null, level: "TIMEOUT", error: "Engine timed out — try ?skipai=true", fetchedAt: new Date().toISOString() });
    }
    console.error("Cohesion handler error:", e);
    return res.status(502).json({ error: e.message, index: null });
  }
}

// ═══════════════════════════════════════════════════════════════
// ORIGINAL NEWS/RSS ENGINE — default route
// ═══════════════════════════════════════════════════════════════


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
