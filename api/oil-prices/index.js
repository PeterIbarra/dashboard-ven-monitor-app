// /api/oil-prices — Petroleum spot prices
// Primary: EIA API v2 (free, unlimited) — EIA_API_KEY
// Fallback: OilPriceAPI (500 req/month) — OILPRICE_API_KEY
// Returns: { brent, wti, natgas, brentHistory[], histPeriod, fetchedAt, source }

const EIA_BASE = "https://api.eia.gov/v2/petroleum/pri/spt/data/";

// EIA series IDs
const EIA_SERIES = {
  brent: "RBRTE",    // Europe Brent Spot Price FOB ($/bbl)
  wti: "RWTC",       // Cushing OK WTI Spot Price FOB ($/bbl)
  natgas: "RNGWHHD", // Henry Hub Natural Gas Spot Price ($/MMBtu)
};

module.exports = async function handler(req, res) {
  const eiaKey = process.env.EIA_API_KEY;
  const oilKey = process.env.OILPRICE_API_KEY;

  if (!eiaKey && !oilKey) {
    return res.status(500).json({ error: "No oil API key configured. Set EIA_API_KEY (free) or OILPRICE_API_KEY." });
  }

  try {
    let result = null;

    // ── Try EIA first (free, unlimited) ──
    if (eiaKey) {
      try {
        result = await fetchEIA(eiaKey);
      } catch (e) {
        console.error("EIA error:", e.message);
      }
    }

    // ── Fallback to OilPriceAPI ──
    if (!result && oilKey) {
      try {
        result = await fetchOilPriceAPI(oilKey);
      } catch (e) {
        console.error("OilPriceAPI error:", e.message);
      }
    }

    if (!result) {
      return res.status(502).json({ error: "All oil price APIs failed.", fetchedAt: new Date().toISOString() });
    }

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=120");
    return res.status(200).json({ ...result, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(502).json({ error: e.message, fetchedAt: new Date().toISOString() });
  }
};

// ── EIA API v2 ──
async function fetchEIA(apiKey) {
  // Fetch latest prices for Brent, WTI, and Natural Gas (last 1 data point each)
  const buildUrl = (series, length = 1) =>
    `${EIA_BASE}?api_key=${apiKey}&frequency=daily&data[0]=value&facets[series][]=${series}&sort[0][column]=period&sort[0][direction]=desc&length=${length}`;

  const [brentRes, wtiRes, gasRes, histRes] = await Promise.all([
    fetchJson(buildUrl(EIA_SERIES.brent, 1)),
    fetchJson(buildUrl(EIA_SERIES.wti, 1)),
    fetchJson(buildUrl(EIA_SERIES.natgas, 1)),
    // Brent history: last 365 days
    fetchJson(buildUrl(EIA_SERIES.brent, 365), 15000),
  ]);

  const extractLatest = (res) => {
    const d = res?.response?.data?.[0];
    if (!d) return null;
    return { price: parseFloat(d.value), created_at: d.period + "T00:00:00Z" };
  };

  const brent = extractLatest(brentRes);
  const wti = extractLatest(wtiRes);
  const natgas = extractLatest(gasRes);

  if (!brent && !wti) return null; // EIA failed

  // Build Brent history
  let brentHistory = [];
  const histData = histRes?.response?.data;
  if (Array.isArray(histData) && histData.length > 0) {
    brentHistory = histData
      .filter(d => d.value != null)
      .map(d => ({ price: parseFloat(d.value), time: d.period + "T00:00:00Z" }))
      .sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  return {
    brent, wti, natgas,
    brentHistory,
    histPeriod: "year",
    source: "eia",
  };
}

// ── OilPriceAPI (fallback) ──
async function fetchOilPriceAPI(apiKey) {
  const API_BASE = "https://api.oilpriceapi.com/v1";
  const headers = { Authorization: `Token ${apiKey}`, "Content-Type": "application/json" };

  const [brentRes, wtiRes, gasRes] = await Promise.all([
    fetchJson(`${API_BASE}/prices/latest?by_code=BRENT_CRUDE_USD`, 8000, headers),
    fetchJson(`${API_BASE}/prices/latest?by_code=WTI_USD`, 8000, headers),
    fetchJson(`${API_BASE}/prices/latest?by_code=NATURAL_GAS_USD`, 8000, headers),
  ]);

  const brent = brentRes?.data || null;
  const wti = wtiRes?.data || null;
  const natgas = gasRes?.data || null;

  if (!brent && !wti) return null;

  // Brent history with fallback
  let brentHistoryRes = await fetchJson(`${API_BASE}/prices/past_year?by_code=BRENT_CRUDE_USD`, 15000, headers);
  let histPeriod = "year";
  if (!brentHistoryRes?.data?.prices?.length) {
    brentHistoryRes = await fetchJson(`${API_BASE}/prices/past_month?by_code=BRENT_CRUDE_USD`, 10000, headers);
    histPeriod = "month";
  }

  let brentHistory = [];
  const histData = brentHistoryRes?.data?.prices || brentHistoryRes?.data;
  if (Array.isArray(histData) && histData.length > 0) {
    const byDay = new Map();
    histData.filter(p => p.price != null).forEach(p => {
      const day = p.created_at?.split("T")[0] || "";
      if (day) byDay.set(day, { price: p.price, time: p.created_at });
    });
    brentHistory = Array.from(byDay.values()).sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  return { brent, wti, natgas, brentHistory, histPeriod, source: "oilpriceapi" };
}

async function fetchJson(url, timeout = 8000, headers = {}) {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeout) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
