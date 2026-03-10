module.exports = async function handler(req, res) {
  const days = parseInt(req.query.days) || 90;
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  
  const fmt = (d) => d.toISOString().slice(0,10).replace(/-/g,"");
  const url = `https://www.pizzint.watch/api/gdelt?pair=usa_venezuela&method=gpr&dateStart=${fmt(start)}&dateEnd=${fmt(end)}`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "PNUD-Monitor/1.0" },
    });

    if (!response.ok) {
      return res.status(502).json({ error: `PizzINT returned ${response.status}`, data: [] });
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(502).json({ error: "Empty response from PizzINT", data: [] });
    }

    const latest = [...data].reverse().find(d => !d.interpolated) || data[data.length - 1];
    const v = latest.v || 0;
    const level = v > 2.0 ? "CRITICAL" : v > 1.0 ? "HIGH" : v > 0.5 ? "ELEVATED" : v > 0 ? "MODERATE" : "LOW";

    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=900");
    return res.status(200).json({
      latest: { ...latest, level },
      history: data.map(d => ({ t: d.t, v: d.v, sentiment: d.sentiment, conflict: d.conflictCount, total: d.totalArticles, interp: d.interpolated })),
      count: data.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(502).json({ error: e.message, data: [] });
  }
};
