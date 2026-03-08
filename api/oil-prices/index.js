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
    // Fetch latest prices
    const [brentRes, wtiRes, gasRes] = await Promise.all([
      fetchJson(`${API_BASE}/prices/latest?by_code=BRENT_CRUDE_USD`, headers),
      fetchJson(`${API_BASE}/prices/latest?by_code=WTI_USD`, headers),
      fetchJson(`${API_BASE}/prices/latest?by_code=NATURAL_GAS_USD`, headers),
    ]);

    const brent = brentRes?.data || null;
    const wti = wtiRes?.data || null;
    const natgas = gasRes?.data || null;

    // Fetch Brent history with fallback: past_year → past_month → past_week
    let brentHistoryRes = await fetchJson(`${API_BASE}/prices/past_year?by_code=BRENT_CRUDE_USD`, headers, 15000);
    let histPeriod = "year";
    if (!brentHistoryRes?.data?.prices?.length) {
      brentHistoryRes = await fetchJson(`${API_BASE}/prices/past_month?by_code=BRENT_CRUDE_USD`, headers, 10000);
      histPeriod = "month";
    }
    if (!brentHistoryRes?.data?.prices?.length) {
      brentHistoryRes = await fetchJson(`${API_BASE}/prices/past_week?by_code=BRENT_CRUDE_USD`, headers);
      histPeriod = "week";
    }

    let brentHistory = [];
    const histData = brentHistoryRes?.data?.prices || brentHistoryRes?.data;
    if (Array.isArray(histData) && histData.length > 0) {
      const raw = histData
        .filter(p => p.price != null)
        .map(p => ({ price: p.price, time: p.created_at }))
        .sort((a, b) => new Date(a.time) - new Date(b.time));

      // Downsample server-side: group by date, take last price per day
      const byDay = new Map();
      raw.forEach(p => {
        const day = p.time ? p.time.split("T")[0] : "";
        if (day) byDay.set(day, p);
      });
      brentHistory = Array.from(byDay.values());
    }

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=120");
    return res.status(200).json({ brent, wti, natgas, brentHistory, histPeriod, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(502).json({ error: e.message, fetchedAt: new Date().toISOString() });
  }
}

async function fetchJson(url, headers, timeout = 8000) {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeout) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
