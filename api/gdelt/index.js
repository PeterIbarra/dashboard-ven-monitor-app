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
    // Fetch fresh headlines from Google News RSS (free, no API key needed)
    try {
      const url = "https://news.google.com/rss/search?q=venezuela&hl=es-419&gl=VE&ceid=VE:es-419";
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "PNUD-Monitor/1.0" },
      });
      if (!response.ok) return res.status(502).json({ error: `Google News returned ${response.status}`, articles: [] });
      const xml = await response.text();

      // Parse RSS XML manually (no dependencies)
      const articles = [];
      const items = xml.split("<item>").slice(1);
      for (const item of items) {
        const title = (item.match(/<title>(.*?)<\/title>/s) || [])[1] || "";
        const link = (item.match(/<link>(.*?)<\/link>/) || [])[1] || (item.match(/<link\/>(.*?)</) || [])[1] || "";
        const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";
        const source = (item.match(/<source[^>]*>(.*?)<\/source>/) || [])[1] || "";
        // Clean CDATA and HTML entities
        const cleanTitle = title.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
        if (cleanTitle && cleanTitle.length > 15) {
          articles.push({ title: cleanTitle, url: link.trim(), source, date: pubDate });
        }
        if (articles.length >= 12) break;
      }

      res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=900");
      return res.status(200).json({ articles, count: articles.length, source: "google-news-rss", fetchedAt: new Date().toISOString() });
    } catch (e) {
      return res.status(502).json({ error: e.message, articles: [] });
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
