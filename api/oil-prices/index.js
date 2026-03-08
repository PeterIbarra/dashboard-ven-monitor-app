const API_BASE = "https://api.oilpriceapi.com/v1/prices";

export default async function handler(req, res) {
  const apiKey = process.env.OILPRICE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "OILPRICE_API_KEY not configured" });
  }

  try {
    // Fetch latest prices for all commodities
    const [brentRes, wtiRes, gasRes] = await Promise.all([
      fetchPrice(apiKey, "BRENT_CRUDE_USD"),
      fetchPrice(apiKey, "WTI_USD"),
      fetchPrice(apiKey, "NATURAL_GAS_USD"),
    ]);

    const data = {
      brent: brentRes,
      wti: wtiRes,
      natgas: gasRes,
      fetchedAt: new Date().toISOString(),
    };

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=120");
    return res.status(200).json(data);
  } catch (e) {
    // Fallback: try the /latest endpoint which returns all at once
    try {
      const response = await fetch(`${API_BASE}/latest`, {
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const json = await response.json();
        res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=120");
        return res.status(200).json({
          brent: json.data?.price ? { price: json.data.price, code: "BRENT_CRUDE_USD" } : null,
          wti: null,
          natgas: null,
          raw: json.data,
          fetchedAt: new Date().toISOString(),
        });
      }
    } catch {}

    return res.status(502).json({ error: e.message, fetchedAt: new Date().toISOString() });
  }
}

async function fetchPrice(apiKey, code) {
  try {
    const response = await fetch(`${API_BASE}/latest?by_code=${code}`, {
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return null;
    const json = await response.json();
    return json.data || null;
  } catch {
    return null;
  }
}
