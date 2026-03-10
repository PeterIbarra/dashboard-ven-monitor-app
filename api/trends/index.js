// /api/trends — Google Trends "Índice de Ansiedad Ciudadana" for Venezuela
// Uses google-trends-api (npm) to scrape Google Trends data
// 55 queries across 4 dimensions, returns composite anxiety index

const googleTrends = require('google-trends-api');

const DIMENSIONS = {
  crisis: {
    weight: 0.35,
    label: "Crisis / Supervivencia",
    queries: [
      "emigrar de Venezuela", "pasaporte Venezuela", "apagón Venezuela",
      "sin agua Venezuela", "sin luz Venezuela", "gas doméstico Venezuela",
      "bombona de gas", "cola gasolina Venezuela", "transporte público Venezuela",
      "hospital Venezuela", "medicinas Venezuela", "Corpoelec",
      "Hidrocapital", "CANTV", "internet Venezuela"
    ]
  },
  economia: {
    weight: 0.30,
    label: "Presión Económica",
    queries: [
      "dólar paralelo", "precio dólar hoy Venezuela", "inflación Venezuela",
      "canasta básica Venezuela", "sueldo mínimo Venezuela", "bono de guerra",
      "bono patria", "cestaticket", "pensión IVSS",
      "Petro Venezuela", "remesas Venezuela", "Banco de Venezuela",
      "Patria plataforma", "empleo Venezuela", "PDVSA"
    ]
  },
  politica: {
    weight: 0.20,
    label: "Política / Actores",
    queries: [
      "elecciones Venezuela", "María Corina Machado", "Edmundo González",
      "Diosdado Cabello", "Delcy Rodríguez", "Jorge Rodríguez",
      "amnistía Venezuela", "sanciones Venezuela", "FANB Venezuela",
      "CNE Venezuela", "Asamblea Nacional Venezuela", "Ramos Allup",
      "Trump Venezuela", "Chevron Venezuela", "Vamos Venezuela"
    ]
  },
  seguridad: {
    weight: 0.15,
    label: "Seguridad / DDHH",
    queries: [
      "presos políticos Venezuela", "protesta Venezuela", "Foro Penal",
      "colectivos Venezuela", "inseguridad Venezuela", "CICPC",
      "operación TunTun", "SEBIN", "DGCIM", "Provea"
    ]
  },
};

// Fetch interest for a batch of up to 5 keywords (Google Trends limit)
async function fetchBatch(keywords, geo, startTime, endTime) {
  try {
    const data = await googleTrends.interestOverTime({
      keyword: keywords,
      startTime,
      endTime,
      geo,
    });
    const parsed = JSON.parse(data);
    const timeline = parsed.default?.timelineData || [];
    
    // Extract average value per keyword
    const avgs = keywords.map((_, ki) => {
      const vals = timeline.map(t => t.value[ki]).filter(v => v != null);
      return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    });
    
    // Also get the latest value per keyword
    const latest = keywords.map((_, ki) => {
      return timeline.length > 0 ? timeline[timeline.length - 1].value[ki] : 0;
    });

    // Get timeline for sparkline (weekly points)
    const timelinePts = timeline.map(t => ({
      time: t.formattedAxisTime || t.formattedTime,
      values: t.value,
    }));

    return {
      results: keywords.map((kw, ki) => ({
        keyword: kw,
        avg: Math.round(avgs[ki]),
        latest: latest[ki],
      })),
      timeline: timelinePts,
    };
  } catch (e) {
    return {
      results: keywords.map(kw => ({ keyword: kw, avg: 0, latest: 0, error: true })),
      timeline: [],
    };
  }
}

// Sleep helper
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = async function handler(req, res) {
  const days = parseInt(req.query.days) || 90;
  const geo = req.query.geo || "VE";
  const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const endTime = new Date();

  try {
    const dimensionResults = {};
    let totalWeightedScore = 0;
    const allTimelines = {};

    for (const [dimKey, dim] of Object.entries(DIMENSIONS)) {
      const queries = dim.queries;
      const allResults = [];
      const dimTimelines = [];

      // Process in batches of 5 (Google Trends limit)
      for (let i = 0; i < queries.length; i += 5) {
        const batch = queries.slice(i, i + 5);
        const batchData = await fetchBatch(batch, geo, startTime, endTime);
        allResults.push(...batchData.results);
        if (batchData.timeline.length > 0 && dimTimelines.length === 0) {
          dimTimelines.push(...batchData.timeline);
        }

        // Rate limit: wait between batches to avoid Google blocking
        if (i + 5 < queries.length) await sleep(2000);
      }

      // Dimension score = average of all query averages (0-100)
      const validResults = allResults.filter(r => !r.error);
      const dimAvg = validResults.length > 0
        ? validResults.reduce((s, r) => s + r.avg, 0) / validResults.length
        : 0;
      const dimLatest = validResults.length > 0
        ? validResults.reduce((s, r) => s + r.latest, 0) / validResults.length
        : 0;

      // Sort by latest value descending for "top concerns"
      const topQueries = [...allResults]
        .filter(r => !r.error)
        .sort((a, b) => b.latest - a.latest)
        .slice(0, 5)
        .map(r => ({ keyword: r.keyword, value: r.latest, avg: r.avg }));

      dimensionResults[dimKey] = {
        label: dim.label,
        weight: dim.weight,
        score: Math.round(dimAvg),
        latest: Math.round(dimLatest),
        queryCount: allResults.length,
        errors: allResults.filter(r => r.error).length,
        topQueries,
        allQueries: allResults,
      };

      // Store first batch timeline as representative for this dimension
      allTimelines[dimKey] = dimTimelines.slice(0, 13); // ~13 weeks for 90 days

      totalWeightedScore += dimAvg * dim.weight;

      // Wait between dimensions
      await sleep(3000);
    }

    const anxietyIndex = Math.round(totalWeightedScore);

    // Determine level
    const level = anxietyIndex >= 60 ? "CRÍTICO"
      : anxietyIndex >= 40 ? "ALTO"
      : anxietyIndex >= 25 ? "MODERADO"
      : "BAJO";

    const levelColor = anxietyIndex >= 60 ? "#ef4444"
      : anxietyIndex >= 40 ? "#f97316"
      : anxietyIndex >= 25 ? "#eab308"
      : "#22c55e";

    // 6h cache — Google Trends data is weekly granularity anyway
    res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=10800");
    return res.status(200).json({
      anxietyIndex,
      level,
      levelColor,
      dimensions: dimensionResults,
      timelines: allTimelines,
      config: { days, geo, totalQueries: 55, dimensionCount: 4 },
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(502).json({ error: e.message, anxietyIndex: null });
  }
};
