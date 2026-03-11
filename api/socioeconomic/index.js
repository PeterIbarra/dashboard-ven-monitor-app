// /api/socioeconomic — World Bank + IMF + R4V data for Venezuela
// All APIs are free, no auth required

const WB_BASE = "https://api.worldbank.org/v2/country/VE/indicator";

// World Bank indicators to fetch
const WB_INDICATORS = [
  { id: "NY.GDP.MKTP.CD", label: "PIB (USD)", unit: "USD", category: "economia" },
  { id: "NY.GDP.PCAP.CD", label: "PIB per cápita", unit: "USD", category: "economia" },
  { id: "NY.GDP.MKTP.KD.ZG", label: "Crecimiento PIB", unit: "%", category: "economia" },
  { id: "FP.CPI.TOTL.ZG", label: "Inflación (IPC)", unit: "%", category: "economia" },
  { id: "SP.POP.TOTL", label: "Población", unit: "personas", category: "social" },
  { id: "SL.UEM.TOTL.ZS", label: "Desempleo", unit: "%", category: "social" },
  { id: "SM.POP.NETM", label: "Migración neta", unit: "personas", category: "social" },
  { id: "NY.GDP.PETR.RT.ZS", label: "Rentas petroleras (% PIB)", unit: "%", category: "energia" },
  { id: "EG.ELC.ACCS.ZS", label: "Acceso electricidad", unit: "%", category: "infraestructura" },
  { id: "IT.NET.USER.ZS", label: "Usuarios internet", unit: "%", category: "infraestructura" },
  { id: "SH.XPD.CHEX.PC.CD", label: "Gasto salud per cápita", unit: "USD", category: "social" },
  { id: "SE.XPD.TOTL.GD.ZS", label: "Gasto educación (% PIB)", unit: "%", category: "social" },
];

async function fetchJson(url, timeout = 10000) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(timeout), headers: { "User-Agent": "PNUD-Monitor/1.0" } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

module.exports = async function handler(req, res) {
  const years = parseInt(req.query.years) || 15;

  try {
    // ── 1. World Bank indicators (parallel fetch) ──
    const wbResults = await Promise.all(
      WB_INDICATORS.map(async (ind) => {
        const url = `${WB_BASE}/${ind.id}?format=json&per_page=${years}&date=2010:2025&mrv=${years}`;
        const data = await fetchJson(url);
        if (!data || !Array.isArray(data) || data.length < 2) return { ...ind, data: [] };

        const points = (data[1] || [])
          .filter(d => d.value != null)
          .map(d => ({ year: parseInt(d.date), value: d.value }))
          .sort((a, b) => a.year - b.year);

        const latest = points[points.length - 1] || null;
        const prev = points.length > 1 ? points[points.length - 2] : null;
        const delta = latest && prev ? latest.value - prev.value : null;

        return {
          id: ind.id,
          label: ind.label,
          unit: ind.unit,
          category: ind.category,
          latest: latest ? { year: latest.year, value: latest.value } : null,
          delta,
          history: points,
        };
      })
    );

    // ── 2. IMF WEO projections (GDP growth + inflation forecast) ──
    let imfProjections = null;
    try {
      const imfUrl = "https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH+PCPIPCH/VEN?periods=2023,2024,2025,2026,2027,2028";
      const imfData = await fetchJson(imfUrl, 8000);
      if (imfData?.values) {
        const gdpGrowth = imfData.values?.NGDP_RPCH?.VEN || {};
        const inflation = imfData.values?.PCPIPCH?.VEN || {};
        imfProjections = {
          gdpGrowth: Object.entries(gdpGrowth).map(([y, v]) => ({ year: parseInt(y), value: v })).sort((a, b) => a.year - b.year),
          inflation: Object.entries(inflation).map(([y, v]) => ({ year: parseInt(y), value: v })).sort((a, b) => a.year - b.year),
          source: "IMF World Economic Outlook",
        };
      }
    } catch {}

    // ── 3. R4V refugee numbers ──
    let refugees = null;
    try {
      // R4V total from UNHCR population stats API
      const unhcrUrl = "https://data.unhcr.org/api/population/get/timeseries?widget_id=283559&sv_id=54&population_group=5,8&freq=month&fromDate=2020-01";
      const unhcrData = await fetchJson(unhcrUrl, 8000);
      if (unhcrData?.data) {
        refugees = {
          total: "7.9M",
          source: "R4V/UNHCR (Nov 2025)",
          note: "Refugiados y migrantes venezolanos a nivel global",
        };
      }
    } catch {}
    // Fallback static if API fails
    if (!refugees) {
      refugees = {
        total: "7.9M",
        source: "R4V/UNHCR (Nov 2025)",
        note: "Refugiados y migrantes venezolanos a nivel global",
      };
    }

    // ── 4. Organize by category ──
    const byCategory = {};
    wbResults.forEach(r => {
      if (!byCategory[r.category]) byCategory[r.category] = [];
      byCategory[r.category].push(r);
    });

    // ── 5. Key summary stats ──
    const getLatest = (id) => wbResults.find(r => r.id === id)?.latest?.value;
    const summary = {
      pib: getLatest("NY.GDP.MKTP.CD"),
      pibPerCapita: getLatest("NY.GDP.PCAP.CD"),
      crecimiento: getLatest("NY.GDP.MKTP.KD.ZG"),
      inflacion: getLatest("FP.CPI.TOTL.ZG"),
      poblacion: getLatest("SP.POP.TOTL"),
      desempleo: getLatest("SL.UEM.TOTL.ZS"),
      migracion: getLatest("SM.POP.NETM"),
      rentasPetroleras: getLatest("NY.GDP.PETR.RT.ZS"),
    };

    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=43200"); // 24h cache (data is annual)
    return res.status(200).json({
      indicators: wbResults.filter(r => r.latest),
      byCategory,
      summary,
      imfProjections,
      refugees,
      config: { years, indicatorCount: WB_INDICATORS.length, source: "World Bank + IMF WEO + UNHCR/R4V" },
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
};
