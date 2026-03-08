// /api/news — Venezuela news + fact-check aggregator from RSS feeds

const RSS_SOURCES = [
  { name:"Efecto Cocuyo", feed:"https://efectococuyo.com/feed/", lang:"es", type:"news" },
  { name:"El Pitazo", feed:"https://elpitazo.net/feed/", lang:"es", type:"news" },
  { name:"Runrunes", feed:"https://runrun.es/feed/", lang:"es", type:"news" },
  { name:"Tal Cual", feed:"https://talcualdigital.com/feed/", lang:"es", type:"news" },
  { name:"El Estímulo", feed:"https://elestimulo.com/feed/", lang:"es", type:"news" },
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

export default async function handler(req, res) {
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
