const { FEEDS } = require("../config");
const { parseRSS, upsertToSupabase } = require("../utils");

async function fetchRSS(errors) {
  let totalInserted = 0;
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
  return { totalInserted };
}

module.exports = { fetchRSS };
