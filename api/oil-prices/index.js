// /api/oil-prices — Petroleum spot prices (hybrid)
// Live prices: Yahoo Finance (free, ~15min delay) → OilPriceAPI (key) → EIA (daily, delayed)
// Historical chart: EIA API v2 (daily, 365 days, free) — EIA_API_KEY
// Returns: { brent, wti, natgas, brentHistory[], histPeriod, source, fetchedAt }

const EIA_BASE = "https://api.eia.gov/v2/petroleum/pri/spt/data/";
const OIL_BASE = "https://api.oilpriceapi.com/v1";

// Yahoo Finance quote endpoint — no key needed, ~15min delay
const YAHOO_SYMBOLS = {
  brent: "BZ=F",   // Brent Crude Futures
  wti: "CL=F",     // WTI Crude Futures
  natgas: "NG=F",  // Natural Gas Futures
};

async function fetchYahooFinance() {
  try {
    const symbols = Object.values(YAHOO_SYMBOLS).join(",");
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketTime,shortName`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "PNUD-Monitor/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const quotes = data?.quoteResponse?.result || [];
    const find = (sym) => {
      const q = quotes.find(r => r.symbol === sym);
      if (!q?.regularMarketPrice) return null;
      return {
        price: q.regularMarketPrice,
        created_at: new Date(q.regularMarketTime * 1000).toISOString(),
      };
    };
    const brent = find(YAHOO_SYMBOLS.brent);
    const wti = find(YAHOO_SYMBOLS.wti);
    const natgas = find(YAHOO_SYMBOLS.natgas);
    if (brent || wti) return { brent, wti, natgas, source: "yahoo" };
    return null;
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  const eiaKey = process.env.EIA_API_KEY;
  const oilKey = process.env.OILPRICE_API_KEY;

  try {
    // ── 1. Live prices — cascade: Yahoo Finance → OilPriceAPI → EIA ──
    let brent = null, wti = null, natgas = null, liveSource = "static";

    // 1a. Yahoo Finance (free, no key, ~15min delay)
    const yahoo = await fetchYahooFinance();
    if (yahoo) {
      brent = yahoo.brent;
      wti = yahoo.wti;
      natgas = yahoo.natgas;
      liveSource = "yahoo";
    }

    // 1b. Supabase cached prices fallback (from daily cron, free, no API usage)
    if (!brent && !wti) {
      const sbUrl = process.env.SUPABASE_URL;
      const sbKey = process.env.SUPABASE_ANON_KEY;
      if (sbUrl && sbKey) {
        try {
          const sbRes = await fetch(
            `${sbUrl}/rest/v1/daily_readings?select=brent,wti,date&order=date.desc&limit=1`,
            { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` }, signal: AbortSignal.timeout(5000) }
          );
          if (sbRes.ok) {
            const rows = await sbRes.json();
            if (rows.length > 0 && rows[0].brent) {
              brent = { price: rows[0].brent, created_at: rows[0].date + "T06:00:00Z" };
              if (rows[0].wti) wti = { price: rows[0].wti, created_at: rows[0].date + "T06:00:00Z" };
              liveSource = "supabase-cached";
            }
          }
        } catch {}
      }
    }

    // 1c. OilPriceAPI fallback (if key exists and Yahoo + Supabase failed)
    if (!brent && !wti && oilKey) {
      const headers = { Authorization: `Token ${oilKey}`, "Content-Type": "application/json" };
      let oilApiDebug = [];
      const fetchOil = async (url) => {
        try {
          const response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
          if (!response.ok) { oilApiDebug.push(`${url.split('by_code=')[1]}: HTTP ${response.status}`); return null; }
          return await response.json();
        } catch (e) { oilApiDebug.push(`${url.split('by_code=')[1]}: ${e.message}`); return null; }
      };
      const [bR, wR, gR] = await Promise.all([
        fetchOil(`${OIL_BASE}/prices/latest?by_code=BRENT_CRUDE_USD`),
        fetchOil(`${OIL_BASE}/prices/latest?by_code=WTI_USD`),
        fetchOil(`${OIL_BASE}/prices/latest?by_code=NATURAL_GAS_USD`),
      ]);
      brent = bR?.data || null;
      wti = wR?.data || null;
      natgas = gR?.data || null;
      if (brent || wti) liveSource = "oilpriceapi";
      else if (oilApiDebug.length > 0) liveSource = `oilpriceapi-fail (${oilApiDebug.join(", ")})`;
    }

    // 1d. EIA fallback (delayed but always works)
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

    // ── 4. STEO Forecast (monthly, free) ──
    let steoForecast = [];
    if (eiaKey) {
      try {
        const steoUrl = `https://api.eia.gov/v2/steo/data/?api_key=${eiaKey}&frequency=monthly&data[0]=value&facets[seriesId][]=BREPUUS&start=${new Date().toISOString().slice(0,7)}&end=2027-12&sort[0][column]=period&sort[0][direction]=asc&length=24`;
        const steoRes = await fetchJson(steoUrl, 10000);
        const steoData = steoRes?.response?.data;
        if (Array.isArray(steoData) && steoData.length > 0) {
          steoForecast = steoData
            .filter(d => d.value != null)
            .map(d => ({ price: parseFloat(d.value), time: d.period + "-15T00:00:00Z" }))
            .sort((a, b) => new Date(a.time) - new Date(b.time));
        }
      } catch {}
    }

    // ── 5. Venezuela crude oil production (EIA International / OPEC secondary) ──
    let venProduction = [];
    if (eiaKey) {
      try {
        const venUrl = `https://api.eia.gov/v2/international/data/?api_key=${eiaKey}&frequency=monthly&data[0]=value&facets[activityId][]=1&facets[productId][]=57&facets[countryRegionId][]=VEN&facets[unit][]=TBPD&sort[0][column]=period&sort[0][direction]=desc&length=120`;
        const venRes = await fetchJson(venUrl, 12000);
        const venData = venRes?.response?.data;
        if (Array.isArray(venData) && venData.length > 0) {
          venProduction = venData
            .filter(d => d.value != null && d.value > 0)
            .map(d => ({ value: parseFloat(d.value), time: d.period + "-15T00:00:00Z" }))
            .sort((a, b) => new Date(a.time) - new Date(b.time));
        }
      } catch {}
    }

    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=600");
    return res.status(200).json({
      brent, wti, natgas,
      brentHistory, steoForecast, venProduction, histPeriod,
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
