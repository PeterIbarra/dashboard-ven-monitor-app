// /api/dolar — Proxy for DolarAPI Venezuela (live + historical)

module.exports = async function handler(req, res) {
  const { type = "live" } = req.query;

  try {
    // === LIVE: fetch paralelo + oficial in parallel ===
    if (type !== "historico") {
      const [resArr, resOficial] = await Promise.all([
        fetch("https://ve.dolarapi.com/v1/dolares", {
          signal: AbortSignal.timeout(10000),
          headers: { "User-Agent": "PNUD-Monitor/1.0" },
        }),
        fetch("https://ve.dolarapi.com/v1/dolares/oficial", {
          signal: AbortSignal.timeout(10000),
          headers: { "User-Agent": "PNUD-Monitor/1.0" },
        }),
      ]);

      const arr = resArr.ok ? await resArr.json() : [];
      const oficial = resOficial.ok ? await resOficial.json() : null;

      // Combine: ensure "oficial" is in the array
      const combined = Array.isArray(arr) ? arr : [];
      const hasOficial = combined.some(d => d.fuente === "oficial");
      if (oficial && !hasOficial) combined.push(oficial);

      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
      return res.status(200).json(combined);
    }

    // === HISTÓRICO ===
    if (type === "historico") {
      const response = await fetch("https://ve.dolarapi.com/v1/historicos/dolares", {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "PNUD-Monitor/1.0" },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `DolarAPI: ${response.statusText}` });
      }

      const data = await response.json();
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

    // === SUPABASE RATES (formerly /api/rates) ===
    if (type === "supabase") {
      const SUPABASE_URL = process.env.SUPABASE_URL;
      const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
      if (!SUPABASE_URL || !SUPABASE_ANON) {
        return res.status(500).json({ error: "Supabase not configured", rates: [] });
      }
      const limit = req.query.limit || "365";
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rates?select=*&order=date.asc&limit=${limit}`,
        {
          headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
          signal: AbortSignal.timeout(6000),
        }
      );
      if (!response.ok) {
        return res.status(response.status).json({ error: `Supabase: ${response.statusText}`, rates: [] });
      }
      const rates = await response.json();
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=120");
      return res.status(200).json({ rates, total: rates.length });
    }
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
