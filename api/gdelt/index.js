const GDELT_BASE = "https://api.gdeltproject.org/api/v2/doc/doc";

module.exports = async function handler(req, res) {
  const { signal } = req.query;
  
  const queries = {
    instability: `${GDELT_BASE}?query=venezuela+(protest+OR+conflict+OR+crisis+OR+violence+OR+unrest)&mode=timelinevol&timespan=120d&format=csv`,
    tone: `${GDELT_BASE}?query=venezuela&mode=timelinetone&timespan=120d&format=csv`,
    artvolnorm: `${GDELT_BASE}?query=venezuela&mode=timelinevol&timespan=120d&format=csv`,
  };

  // If specific signal requested
  if (signal === "headlines") {
    // Fetch fresh headlines from Google News RSS — 6 queries covering ES + EN sources
    try {
      const gnES = "https://news.google.com/rss/search?hl=es-419&gl=VE&ceid=VE:es-419&q=";
      const gnEN = "https://news.google.com/rss/search?hl=en&gl=US&ceid=US:en&q=";
      const queries = [
        // Spanish queries
        { dim: "politica", url: gnES + encodeURIComponent("venezuela+política+OR+amnistía+OR+elecciones+OR+oposición+OR+Maduro"), max: 6 },
        { dim: "economia", url: gnES + encodeURIComponent("venezuela+petróleo+OR+economía+OR+sanciones+OR+dólar+OR+PDVSA"), max: 6 },
        { dim: "internacional", url: gnES + encodeURIComponent("venezuela+EEUU+OR+Trump+OR+internacional+OR+diplomacia+OR+petróleo"), max: 6 },
        // English queries — premium international sources
        { dim: "intl_en", url: gnEN + encodeURIComponent("venezuela"), max: 8 },
        { dim: "energy_en", url: gnEN + encodeURIComponent("venezuela oil OR sanctions OR PDVSA OR crude"), max: 5 },
        { dim: "politics_en", url: gnEN + encodeURIComponent("venezuela Maduro OR opposition OR elections OR amnesty OR Trump"), max: 5 },
      ];

      // Premium sources to prioritize
      const premiumSources = ["reuters", "bloomberg", "wsj", "wall street journal", "washington post", "cnn", "bbc", "abc", "associated press", "ap news", "france 24", "el país", "nyt", "new york times", "the guardian", "financial times", "dw"];

      function parseGnRss(xml, maxItems) {
        const articles = [];
        const items = xml.split("<item>").slice(1);
        for (const item of items) {
          const title = (item.match(/<title>(.*?)<\/title>/s) || [])[1] || "";
          const link = (item.match(/<link>(.*?)<\/link>/) || [])[1] || (item.match(/<link\/>(.*?)</) || [])[1] || "";
          const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";
          const source = (item.match(/<source[^>]*>(.*?)<\/source>/) || [])[1] || "";
          const cleanTitle = title.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
          if (cleanTitle && cleanTitle.length > 15) {
            const isPremium = premiumSources.some(ps => source.toLowerCase().includes(ps));
            articles.push({ title: cleanTitle, url: link.trim(), source, date: pubDate, premium: isPremium });
          }
          if (articles.length >= maxItems) break;
        }
        // Sort premium sources first
        return articles.sort((a, b) => (b.premium ? 1 : 0) - (a.premium ? 1 : 0));
      }

      const results = await Promise.all(
        queries.map(async (q) => {
          try {
            const r = await fetch(q.url, {
              signal: AbortSignal.timeout(10000),
              headers: { "User-Agent": "PNUD-Monitor/1.0" },
            });
            if (!r.ok) return { dim: q.dim, articles: [] };
            const xml = await r.text();
            return { dim: q.dim, articles: parseGnRss(xml, q.max) };
          } catch { return { dim: q.dim, articles: [] }; }
        })
      );

      // Merge EN results into the main dimensions
      const politicaES = results.find(r => r.dim === "politica")?.articles || [];
      const economiaES = results.find(r => r.dim === "economia")?.articles || [];
      const intlES = results.find(r => r.dim === "internacional")?.articles || [];
      const intlEN = results.find(r => r.dim === "intl_en")?.articles || [];
      const energyEN = results.find(r => r.dim === "energy_en")?.articles || [];
      const politicsEN = results.find(r => r.dim === "politics_en")?.articles || [];

      // Merge: ES first, then EN premium sources
      const politicaMerged = [...politicaES, ...politicsEN];
      const economiaMerged = [...economiaES, ...energyEN];
      const intlMerged = [...intlES, ...intlEN];

      // Deduplicate by title similarity across all
      const seen = new Set();
      const dedup = (arr) => arr.filter(a => {
        const key = a.title.toLowerCase().slice(0, 40);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const politica = dedup(politicaMerged);
      const economia = dedup(economiaMerged);
      const internacional = dedup(intlMerged);
      const allArticles = [...politica.map(a => ({...a, dim:"politica"})), ...economia.map(a => ({...a, dim:"economia"})), ...internacional.map(a => ({...a, dim:"internacional"}))];

      res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=900");
      return res.status(200).json({
        politica,
        economia,
        internacional,
        all: allArticles,
        count: allArticles.length,
        source: "google-news-rss",
        fetchedAt: new Date().toISOString(),
      });
    } catch (e) {
      return res.status(502).json({ error: e.message, politica: [], economia: [], internacional: [], all: [] });
    }
  }

  if (signal && queries[signal]) {
    try {
      const response = await fetch(queries[signal], { signal: AbortSignal.timeout(8000) });
      if (!response.ok) return res.status(502).json({ error: `GDELT returned ${response.status}` });
      const csv = await response.text();
      if (csv.includes("<!")) return res.status(502).json({ error: "GDELT returned HTML instead of CSV" });
      const data = parseCsv(csv);
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=1800");
      return res.status(200).json({ signal, data, fetchedAt: new Date().toISOString() });
    } catch (e) {
      return res.status(502).json({ error: e.message });
    }
  }

  // Fetch all three in parallel
  try {
    const [instRes, toneRes, artRes] = await Promise.all(
      [queries.instability, queries.tone, queries.artvolnorm].map(url =>
        fetch(url, { signal: AbortSignal.timeout(8000) })
          .then(r => r.ok ? r.text() : "")
          .then(t => t.includes("<!") ? new Map() : parseCsv(t))
          .catch(() => new Map())
      )
    );

    const allDates = new Set([...instRes.keys(), ...toneRes.keys(), ...artRes.keys()]);
    const merged = Array.from(allDates).sort().map(date => ({
      date,
      instability: instRes.get(date) ?? null,
      tone: toneRes.get(date) ?? null,
      artvolnorm: artRes.get(date) ?? null,
    }));

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=1800");
    return res.status(200).json({ data: merged, fetchedAt: new Date().toISOString(), error: null });
  } catch (e) {
    return res.status(502).json({ data: [], fetchedAt: new Date().toISOString(), error: e.message });
  }
}

function parseCsv(csvText) {
  const map = new Map();
  const clean = csvText.replace(/^\uFEFF/, "").trim();
  const lines = clean.split("\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    const date = parts[0]?.trim();
    const value = parseFloat(parts[parts.length - 1]?.trim());
    if (date && !isNaN(value)) map.set(date, value);
  }
  return map;
}
