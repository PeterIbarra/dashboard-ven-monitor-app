// /api/dolar — Proxy for DolarAPI Venezuela (live + historical)

module.exports = async function handler(req, res) {
  const { type = "live" } = req.query;

  const url = type === "historico"
    ? "https://ve.dolarapi.com/v1/historicos/dolares"
    : "https://ve.dolarapi.com/v1/dolares";

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "PNUD-Monitor/1.0" },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `DolarAPI: ${response.statusText}` });
    }

    const data = await response.json();

    // If historical, process into daily format
    if (type === "historico") {
      const byDate = {};
      let lastPar = null;
      data.forEach(r => {
        if (!byDate[r.fecha]) byDate[r.fecha] = { d: r.fecha };
        if (r.fuente === "oficial") byDate[r.fecha].bcv = r.promedio;
        if (r.fuente === "paralelo") byDate[r.fecha].par = r.promedio;
      });
      const rates = Object.values(byDate)
        .filter(h => h.bcv || h.par)
        .sort((a, b) => a.d.localeCompare(b.d))
        .map(h => {
          if (h.par) lastPar = h.par;
          const bcv = h.bcv || null;
          const par = h.par || lastPar;
          const usdt = par ? par * 1.02 : null;
          const brecha = bcv && par ? ((par - bcv) / bcv) * 100 : null;
          return { d: h.d, bcv, par, usdt, brecha };
        });

      res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=300");
      return res.status(200).json({ rates, total: rates.length });
    }

    // Live
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
