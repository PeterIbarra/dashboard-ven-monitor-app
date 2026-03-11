// /api/news — Venezuela news + fact-check aggregator from RSS feeds
// Also handles OVCS tweets via Nitter RSS when ?source=ovcs

const RSS_SOURCES = [
  { name:"Efecto Cocuyo", feed:"https://efectococuyo.com/feed/", lang:"es", type:"news" },
  { name:"El Pitazo", feed:"https://elpitazo.net/feed/", lang:"es", type:"news" },
  { name:"Runrunes", feed:"https://runrun.es/feed/", lang:"es", type:"news" },
  { name:"Tal Cual", feed:"https://talcualdigital.com/feed/", lang:"es", type:"news" },
  { name:"El Estímulo", feed:"https://elestimulo.com/feed/", lang:"es", type:"news" },
  { name:"AlbertoNews", feed:"https://albertonews.com/feed/", lang:"es", type:"news" },
  { name:"Caracas Chronicles", feed:"https://www.caracaschronicles.com/feed/", lang:"en", type:"news" },
  // Fact-check sources
  { name:"Cocuyo Chequea", feed:"https://efectococuyo.com/cocuyo-chequea/feed/", lang:"es", type:"factcheck" },
  { name:"Cotejo.info", feed:"https://cotejo.info/feed/", lang:"es", type:"factcheck" },
  { name:"EsPaja", feed:"https://espaja.com/feed/", lang:"es", type:"factcheck" },
  { name:"Cazamos Fake News", feed:"https://www.cazadoresdefakenews.info/feed/", lang:"es", type:"factcheck" },
  { name:"Provea", feed:"https://provea.org/feed/", lang:"es", type:"factcheck" },
];

// Scenario keyword patterns
const SCENARIO_TAGS = {
  E1: /elecci[oó]n|electoral|voto|transici[oó]n|democra|MCM|Machado|oposici[oó]n|preso.pol[ií]tico|amnist[ií]a|excarcel/i,
  E2: /colapso|crisis|inflaci[oó]n|apag[oó]n|el[eé]ctric|salario|hambre|migra|pobreza|FMI|deuda|brecha.cambiar/i,
  E3: /petr[oó]le|PDVSA|OFAC|licencia|Chevron|exportaci|barril|EE\.UU|Trump|Delcy|cooperaci|diploma|sancion/i,
  E4: /FANB|militar|colectivo|represi[oó]n|detenci[oó]n|preso|SEBIN|DGCIM|Cabello|coerci|arma|violencia/i,
};

// Dimension category patterns
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

// Simple XML parser for RSS (no dependencies)
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


// ═══════════════════════════════════════════════════════════════
// OVCS MODULE — Nitter RSS for @OVCSocial
// Activated via ?source=ovcs
// ═══════════════════════════════════════════════════════════════

const NITTER_INSTANCES = [
  { name: "xcancel-rss", url: "https://rss.xcancel.com/OVCSocial/rss", ua: null },
  { name: "xcancel", url: "https://xcancel.com/OVCSocial/rss", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
  { name: "nitter", url: "https://nitter.net/OVCSocial/rss", ua: null },
  { name: "nitter-privacydev", url: "https://nitter.privacydev.net/OVCSocial/rss", ua: null },
];

const PROTEST_PATTERNS = [
  /protest[aó]s?/i, /manife?staci[oó]n/i, /concentraci[oó]n/i,
  /march[aó]/i, /cierre\s+de\s+calle/i, /trancazo/i, /tranca/i,
  /par[oó]/i, /huelga/i, /plant[oó]n/i, /cacerolazo/i,
  /conflicto\s+social/i, /movilizaci[oó]n/i, /reclam[oó]/i,
  /exig(en|ieron|imos)/i, /demanda(n|ron)?/i,
];

const NUMBER_PATTERN = /(\d[\d.,]*)\s*(protest[aó]s?|manifestaci[oó]n|acciones?\s+de\s+calle|movilizaci[oó]n|concentraci[oó]n|conflictos?\s+social)/gi;

const VE_STATES = {
  "Amazonas": /amazonas/i, "Anzoátegui": /anzo[áa]tegui/i, "Apure": /apure/i,
  "Aragua": /aragua/i, "Barinas": /barinas/i, "Bolívar": /bol[íi]var/i,
  "Carabobo": /carabobo/i, "Cojedes": /cojedes/i, "Delta Amacuro": /delta\s*amacuro/i,
  "Distrito Capital": /distrito\s*capital|caracas/i, "Falcón": /falc[oó]n/i,
  "Guárico": /gu[áa]rico/i, "Lara": /\blara\b/i, "Mérida": /m[eé]rida/i,
  "Miranda": /miranda/i, "Monagas": /monagas/i, "Nueva Esparta": /nueva\s*esparta|margarita/i,
  "Portuguesa": /portuguesa/i, "Sucre": /\bsucre\b/i, "Táchira": /t[áa]chira/i,
  "Trujillo": /trujillo/i, "Vargas": /vargas|la\s*guaira/i, "Yaracuy": /yaracuy/i,
  "Zulia": /zulia|maracaibo/i,
};

const MOTIVE_PATTERNS = {
  "Servicios básicos": /agua|electricidad|luz|gas|servicio|apag[oó]n|corte\s+de/i,
  "Laboral": /salario|trabaj|laboral|empleo|sueldo|pago|deuda\s+laboral|pensi[oó]n/i,
  "Vivienda": /vivienda|casa|terreno|desalojo|habitacional/i,
  "Salud": /salud|hospital|m[eé]dico|medicamento|insumo|cl[ií]nica/i,
  "Educación": /educa|escuela|universidad|maestro|profesor|docente|beca/i,
  "Transporte": /transporte|pasaje|bus|metro|gasolina|combustible/i,
  "Alimentación": /aliment|comida|CLAP|hambre|canasta/i,
  "Seguridad": /seguridad|inseguridad|delincuencia|robo|violencia/i,
  "Derechos políticos": /pol[ií]tic|elecci[oó]n|preso|detenci[oó]n|libertad|democra|justicia/i,
  "Tierras": /tierra|campesino|agr[ií]cola|rural/i,
  "Telecomunicaciones": /internet|telef|telecom|CANTV|conectividad/i,
  "Ambiental": /ambient|contamin|basura|desecho/i,
};

function analyzeTweet(text) {
  const isProtest = PROTEST_PATTERNS.some(p => p.test(text));

  const numbers = [];
  const numRegex = new RegExp(NUMBER_PATTERN.source, "gi");
  let numMatch;
  while ((numMatch = numRegex.exec(text)) !== null) {
    const num = parseInt(numMatch[1].replace(/[.,]/g, ""), 10);
    if (!isNaN(num) && num > 0 && num < 100000) numbers.push(num);
  }
  const standaloneNum = text.match(/\b(\d{1,5})\b/g);
  if (standaloneNum && isProtest) {
    standaloneNum.forEach(n => {
      const v = parseInt(n, 10);
      if (v > 0 && v < 50000 && !numbers.includes(v)) numbers.push(v);
    });
  }

  const states = [];
  for (const [state, pattern] of Object.entries(VE_STATES)) {
    if (pattern.test(text)) states.push(state);
  }

  const motives = [];
  for (const [motive, pattern] of Object.entries(MOTIVE_PATTERNS)) {
    if (pattern.test(text)) motives.push(motive);
  }

  return { isProtest, numbers, states, motives };
}

function parseNitterRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = (content.match(/<title><!\[CDATA\[(.*?)\]\]>/) || content.match(/<title>(.*?)<\/title>/) || [])[1] || "";
    const link = (content.match(/<link>(.*?)<\/link>/) || [])[1] || "";
    const desc = (content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/) || content.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || "";
    const pubDate = (content.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";

    if (title || desc) {
      const cleanTitle = title.replace(/<[^>]*>/g, "").trim();
      const cleanDesc = desc.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
      const fullText = `${cleanTitle} ${cleanDesc}`;
      const analysis = analyzeTweet(fullText);
      const tweetLink = link.replace(/nitter\.\w+/, "x.com").replace(/xcancel\.com/, "x.com").trim();

      items.push({
        text: cleanDesc || cleanTitle,
        link: tweetLink,
        date: pubDate,
        creator: "OVCSocial",
        ...analysis,
      });
    }
  }
  return items;
}

function computeOVCSKpis(tweets) {
  const protestTweets = tweets.filter(t => t.isProtest);
  const totalMentions = protestTweets.length;
  const totalProtests = protestTweets.reduce((sum, t) => {
    const max = t.numbers.length > 0 ? Math.max(...t.numbers) : 0;
    return sum + max;
  }, 0);

  const stateFreq = {};
  protestTweets.forEach(t => t.states.forEach(s => { stateFreq[s] = (stateFreq[s] || 0) + 1; }));
  const topStates = Object.entries(stateFreq)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([state, count]) => ({ state, count }));

  const motiveFreq = {};
  protestTweets.forEach(t => t.motives.forEach(m => { motiveFreq[m] = (motiveFreq[m] || 0) + 1; }));
  const topMotives = Object.entries(motiveFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([motive, count]) => ({ motive, count }));

  const dailyMap = {};
  protestTweets.forEach(t => {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) return;
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = (dailyMap[key] || 0) + 1;
  });
  const daily = Object.entries(dailyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  const latestNumbers = protestTweets
    .filter(t => t.numbers.length > 0).slice(0, 5)
    .map(t => ({
      number: Math.max(...t.numbers),
      text: t.text.substring(0, 200),
      date: t.date,
      states: t.states,
      motives: t.motives,
    }));

  return { totalMentions, totalProtests, topStates, topMotives, daily, latestNumbers };
}

async function handleOVCS(res) {
  const errors = [];

  for (const instance of NITTER_INSTANCES) {
    try {
      const headers = {
        Accept: "application/rss+xml, application/xml, text/xml, */*",
        "User-Agent": instance.ua || "PNUD-Monitor/1.0 (RSS Reader)",
      };
      const response = await fetch(instance.url, {
        headers, signal: AbortSignal.timeout(8000), redirect: "follow",
      });

      if (!response.ok) {
        errors.push({ instance: instance.name, status: response.status });
        continue;
      }

      const xml = await response.text();

      if (xml.includes("RSS reader not yet whitelisted") || xml.includes("Please send an email")) {
        errors.push({ instance: instance.name, error: "RSS reader not whitelisted" });
        continue;
      }
      if (!xml.includes("<item>") && !xml.includes("<entry>")) {
        errors.push({ instance: instance.name, error: "No RSS items found" });
        continue;
      }

      const tweets = parseNitterRSS(xml);
      if (tweets.length === 0) {
        errors.push({ instance: instance.name, error: "Parsed 0 tweets" });
        continue;
      }

      const kpis = computeOVCSKpis(tweets);

      res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=600");
      return res.status(200).json({
        source: instance.name,
        account: "@OVCSocial",
        totalTweets: tweets.length,
        protestTweets: tweets.filter(t => t.isProtest).length,
        kpis,
        tweets: tweets.slice(0, 30),
        fetchedAt: new Date().toISOString(),
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (e) {
      errors.push({ instance: instance.name, error: e.message });
      continue;
    }
  }

  // All instances failed
  res.setHeader("Cache-Control", "public, s-maxage=60");
  return res.status(502).json({
    error: "All Nitter instances failed",
    errors,
    source: "none",
    account: "@OVCSocial",
    totalTweets: 0,
    protestTweets: 0,
    kpis: { totalMentions: 0, totalProtests: 0, topStates: [], topMotives: [], daily: [], latestNumbers: [] },
    tweets: [],
    fetchedAt: new Date().toISOString(),
  });
}


// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER — routes by ?source= param
// ═══════════════════════════════════════════════════════════════

module.exports = async function handler(req, res) {
  const { source } = req.query || {};

  // ── OVCS MODE ──
  if (source === "ovcs") {
    return handleOVCS(res);
  }

  // ── DEFAULT: NEWS + FACTCHECK ──
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
};
