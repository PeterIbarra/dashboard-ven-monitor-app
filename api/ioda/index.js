const IODA_BASE = "https://api.ioda.inetintel.cc.gatech.edu/v2";

export default async function handler(req, res) {
  const { path, ...params } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing "path" parameter. Example: ?path=signals/raw/country/VE&from=...&until=...' });
  }

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    qs.set(key, value);
  }

  const upstreamUrl = qs.toString()
    ? `${IODA_BASE}/${path}?${qs}`
    : `${IODA_BASE}/${path}`;

  try {
    const response = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `IODA returned ${response.status} ${response.statusText}`,
      });
    }

    const data = await response.json();

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=120");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: `IODA API error: ${e.message}` });
  }
}
