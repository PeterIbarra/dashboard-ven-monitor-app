// /api/oil-prices — Petroleum spot prices (hybrid)
// Live prices: OilPriceAPI (intradía) — OILPRICE_API_KEY
// Historical chart: EIA API v2 (daily, 365 days, free) — EIA_API_KEY
// Returns: { brent, wti, natgas, brentHistory[], histPeriod, source, fetchedAt }

const EIA_BASE = "https://api.eia.gov/v2/petroleum/pri/spt/data/";
const OIL_BASE = "https://api.oilpriceapi.com/v1";

module.exports = async function handler(req, res) {
  const eiaKey = process.env.EIA_API_KEY;
  const oilKey = process.env.OILPRICE_API_KEY;

  try {
    // ── 1. Live prices from OilPriceAPI (intradía) ──
    let brent = null, wti = null, natgas = null, liveSource = "static";

    if (oilKey) {
      const headers = { Authorization: `Token ${oilKey}`, "Content-Type": "application/json" };
      const [bR, wR, gR] = await Promise.all([
        fetchJson(`${OIL_BASE}/prices/latest?by_code=BRENT_CRUDE_USD`, 8000, headers),
        fetchJson(`${OIL_BASE}/prices/latest?by_code=WTI_USD`, 8000, headers),
        fetchJson(`${OIL_BASE}/prices/latest?by_code=NATURAL_GAS_USD`, 8000, headers),
      ]);
      brent = bR?.data || null;
      wti = wR?.data || null;
      natgas = gR?.data || null;
      if (brent || wti) liveSource = "oilpriceapi";
    }

    // Fallback live prices from EIA if OilPriceAPI unavailable
    if (!brent && !wti && eiaKey) {
      const buildUrl = (series) =>
        `${EIA_BASE}?api_key=${eiaKey}&frequency=daily&data[0]=value&facets[series][]=${series}&sort[0][column]=period&sort[0][direction]=desc&length=1`;
      const [bR, wR, gR] = await Promise.all([
        fetchJson(buildUrl("RBRTE")),
        fetchJson(buildUrl("RWTC")),
        fetchJson(buildUrl("RNGWHHD")),
      ]);
      const extract = (r) => {
        const d = r?.response?.data?.[0];
        return d ? { price: parseFloat(d.value), created_at: d.period + "T00:00:00Z" } : null;
      };
      brent = extract(bR);
      wti = extract(wR);
      natgas = extract(gR);
      if (brent || wti) liveSource = "eia";
    }

    // ── 2. Historical chart from EIA (365 days, free, unlimited) ──
    let brentHistory = [];
    let histPeriod = "year";

    if (eiaKey) {
      const histUrl = `${EIA_BASE}?api_key=${eiaKey}&frequency=daily&data[0]=value&facets[series][]=RBRTE&sort[0][column]=period&sort[0][direction]=desc&length=365`;
      const histRes = await fetchJson(histUrl, 15000);
      const histData = histRes?.response?.data;
      if (Array.isArray(histData) && histData.length > 0) {
        brentHistory = histData
          .filter(d => d.value != null)
          .map(d => ({ price: parseFloat(d.value), time: d.period + "T00:00:00Z" }))
          .sort((a, b) => new Date(a.time) - new Date(b.time));
      }
    }

    // ── 3. Append today's live price to history ──
    if (brent?.price && brentHistory.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const lastHistDate = brentHistory[brentHistory.length - 1]?.time?.slice(0, 10);
      if (lastHistDate !== today) {
        brentHistory.push({ price: brent.price, time: today + "T12:00:00Z" });
      } else {
        brentHistory[brentHistory.length - 1].price = brent.price;
      }
    }

    // Fallback history from OilPriceAPI if no EIA
    if (brentHistory.length === 0 && oilKey) {
      const headers = { Authorization: `Token ${oilKey}`, "Content-Type": "application/json" };
      let histRes = await fetchJson(`${OIL_BASE}/prices/past_year?by_code=BRENT_CRUDE_USD`, 15000, headers);
      if (!histRes?.data?.prices?.length) {
        histRes = await fetchJson(`${OIL_BASE}/prices/past_month?by_code=BRENT_CRUDE_USD`, 10000, headers);
        histPeriod = "month";
      }
      const hd = histRes?.data?.prices || histRes?.data;
      if (Array.isArray(hd) && hd.length > 0) {
        const byDay = new Map();
        hd.filter(p => p.price != null).forEach(p => {
          const day = p.created_at?.split("T")[0] || "";
          if (day) byDay.set(day, { price: p.price, time: p.created_at });
        });
        brentHistory = Array.from(byDay.values()).sort((a, b) => new Date(a.time) - new Date(b.time));
      }
    }

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=120");
    return res.status(200).json({
      brent, wti, natgas,
      brentHistory, histPeriod,
      source: liveSource,
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(502).json({ error: e.message, fetchedAt: new Date().toISOString() });
  }
};

async function fetchJson(url, timeout = 8000, headers = {}) {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeout) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
