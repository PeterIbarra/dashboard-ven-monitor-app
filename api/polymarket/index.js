// /api/polymarket — Fetch live prices from Polymarket Gamma API (no auth needed)

const SLUGS = [
  "will-venezuela-become-51st-state",
  "will-mara-corina-machado-enter-venezuela-by-march-31-426-698-771",
  "will-delcy-rodrguez-be-the-leader-of-venezuela-end-of-2026",
  "will-the-us-embassy-in-venezuela-reopen-by-march-31",
  "venezuela-leader-end-of-2026",
  "will-venezuelan-crude-oil-production-reach-barrels-per-day-in-2026",
  "nicols-maduro-released-from-custody-by",
  "maduro-prison-time-527",
  "maduro-guilty-of-all-counts",
  "venezuela-coup-attempt-by-january-31-428",
  "venezuela-presidential-election-scheduled-by",
];

module.exports = async function handler(req, res) {
  try {
    const results = [];

    // Fetch events in parallel (batch of 3 to avoid rate limits)
    for (let i = 0; i < SLUGS.length; i += 3) {
      const batch = SLUGS.slice(i, i + 3);
      const fetches = batch.map(async (slug) => {
        try {
          const r = await fetch(`https://gamma-api.polymarket.com/events?slug=${slug}`, {
            signal: AbortSignal.timeout(8000),
            headers: { "User-Agent": "PNUD-Monitor/1.0" },
          });
          if (!r.ok) return null;
          const data = await r.json();
          if (!Array.isArray(data) || data.length === 0) return null;
          const event = data[0];
          const markets = (event.markets || []).map(m => ({
            question: m.question || "",
            price: m.outcomePrices ? JSON.parse(m.outcomePrices)[0] : null,
            volume: m.volume || 0,
          })).filter(m => m.price !== null);
          
          // For single-outcome events, take the first market
          // For multi-outcome, take the most interesting (highest volume)
          const best = markets.length === 1 ? markets[0] : 
            markets.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))[0];
          
          if (!best) return null;
          return {
            slug,
            title: event.title || best.question,
            question: best.question,
            price: Math.round(parseFloat(best.price) * 100),
            volume: parseFloat(event.volume || best.volume || 0),
          };
        } catch { return null; }
      });
      const batchResults = await Promise.all(fetches);
      results.push(...batchResults.filter(Boolean));
    }

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=120");
    return res.status(200).json({ markets: results, count: results.length, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(502).json({ error: e.message, markets: [] });
  }
};
