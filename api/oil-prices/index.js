const API_BASE = "https://api.oilpriceapi.com/v1";

export default async function handler(req, res) {
  const apiKey = process.env.OILPRICE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "OILPRICE_API_KEY not configured" });
  }

  const headers = {
    Authorization: `Token ${apiKey}`,
    "Content-Type": "application/json",
  };

  try {
    // Brent history: from Jan 1, 2025 to now
    const fromEpoch = Math.floor(new Date("2025-01-01").getTime() / 1000);
    const toEpoch = Math.floor(Date.now() / 1000);
    const [brentRes, wtiRes, gasRes, brentHistoryRes] = await Promise.all([
      fetchJson(`${API_BASE}/prices/latest?by_code=BRENT_CRUDE_USD`, headers),
      fetchJson(`${API_BASE}/prices/latest?by_code=WTI_USD`, headers),
      fetchJson(`${API_BASE}/prices/latest?by_code=NATURAL_GAS_USD`, headers),
      fetchJson(`${API_BASE}/prices?by_code=BRENT_CRUDE_USD&by_period[from]=${fromEpoch}&by_period[to]=${toEpoch}`, headers),
    ]);

    const brent = brentRes?.data || null;
    const wti = wtiRes?.data || null;
    const natgas = gasRes?.data || null;

    let brentHistory = [];
    if (brentHistoryRes?.data?.prices && Array.isArray(brentHistoryRes.data.prices)) {
      const raw = brentHistoryRes.data.prices
        .map(p => ({ price: p.price, time: p.created_at }))
        .sort((a, b) => new Date(a.time) - new Date(b.time));

      // Downsample to ~1 point per day (max ~400 points for ~15 months)
      if (raw.length > 400) {
        const step = Math.ceil(raw.length / 365);
        brentHistory = raw.filter((_, i) => i % step === 0);
        // Always include the last point
        if (brentHistory[brentHistory.length - 1] !== raw[raw.length - 1]) {
          brentHistory.push(raw[raw.length - 1]);
        }
      } else {
        brentHistory = raw;
      }
    }

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=120");
    return res.status(200).json({ brent, wti, natgas, brentHistory, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(502).json({ error: e.message, fetchedAt: new Date().toISOString() });
  }
}

async function fetchJson(url, headers) {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
