const GDELT_BASE = "https://api.gdeltproject.org/api/v2/doc/doc";
const FIRMS_BASE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";
const OM_FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
const OM_ARCHIVE_BASE  = "https://archive-api.open-meteo.com/v1/archive";
const FOROPENAL_URL   = "https://foropenal.com/represion-en-cifras";
const SISMO_SUPABASE_URL = "https://buricxvfkunajzehyruu.supabase.co";
const SISMO_API_KEY = "sb_publishable_WYdU76C5OLEfuUlY6n9UEg_GoUoVY_k";
const SISMO_BUILDINGS_SUPABASE_URL = "https://jckifxsdlnsvbztxydes.supabase.co";
const SISMO_BUILDINGS_API_KEY = "sb_publishable_i7iEDrCVZcSt0k3RGFrY4g_WrtZBB4w";

module.exports = async function handler(req, res) {
  const { signal, source, days, bbox, key, lat, lon, past_days, forecast_days, start_date, end_date, building_id } = req.query;

  if (source === "sismovenezuela") {
    const data = await fetchSismoVenezuela(req.query.debug === "1");
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=60");
    return res.status(200).json(data);
  }

  if (source === "sismos") {
    const data = await fetchSismosConsolidado(req.query.debug === "1");
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=60");
    return res.status(200).json(data);
  }

  if (source === "sismoedificiodetalle") {
    const data = await fetchSismoBuildingDetail(building_id, req.query.debug === "1");
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=60");
    return res.status(200).json(data);
  }

  if (source === "usgs") {
    const data = await fetchUsgsQuakes(req.query);
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=60");
    return res.status(200).json(data);
  }

  if (source === "emsc") {
    const data = await fetchEmscQuakes(req.query);
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=60");
    return res.status(200).json(data);
  }

  if (source === "cdi") {
    const data = await fetchCrisisDamageIntelligence(req.query.debug === "1");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=120");
    return res.status(200).json(data);
  }

  if (source === "lhasa-identify") {
    const data = await fetchLhasaIdentify(req.query.lat, req.query.lng);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(data);
  }

  if (source === "escombros") {
    const data = await fetchEscombros(req.query.debug === "1");
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=60");
    return res.status(200).json(data);
  }

  if (source === "vantor-tiles") {
    const data = await fetchVantorTilesInfo(req.query.debug === "1");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    return res.status(200).json(data);
  }

  // ── Foro Penal scraper (?source=foropenal) ──
  if (source === "foropenal") {
    try {
      const r = await fetch(FOROPENAL_URL, {
        signal: AbortSignal.timeout(15000),
        headers: { "User-Agent": "PNUD-Monitor/1.0 (monitor@undp.org)" },
      });
      if (!r.ok) return res.status(200).json({ error: `Foro Penal HTTP ${r.status}` });
      const html = await r.text();

      // Helper: extract first integer after a label pattern
      const extractNum = (pattern) => {
        const m = html.match(pattern);
        return m ? parseInt(m[1].replace(/\./g, "").replace(/,/g, ""), 10) : null;
      };

      // Extract numbers from the page HTML
      // The page embeds numbers directly in text nodes like "404\npresos políticos"
      const grabNumber = (label) => {
        // Match a number (possibly with dots as thousands sep) near the label text
        const re = new RegExp(
          "([\\d][\\d\\.]*)[\\s\\S]{0,200}" + label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i"
        );
        const m = html.match(re);
        return m ? parseInt(m[1].replace(/\./g, ""), 10) : null;
      };

      const grabAfter = (label) => {
        const re = new RegExp(
          label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s\\S]{0,100}?([\\d][\\d\\.]*)",
          "i"
        );
        const m = html.match(re);
        return m ? parseInt(m[1].replace(/\./g, ""), 10) : null;
      };

      // Primary numbers visible in page header/hero
      const totalPresos   = grabNumber("presos pol[ií]ticos en Venezuela al");
      const hombres       = grabNumber("Hombres");
      const mujeres       = grabNumber("Mujeres");
      const civiles       = grabNumber("Civiles");
      const militares     = grabNumber("Militares");
      const adultos       = grabNumber("Adultos");
      const adolescentes  = grabNumber("Adolescentes");
      const condenados    = grabNumber("Condenados");
      const noCondenados  = grabNumber("No condenados");

      // Movimientos recientes
      const encarcelaciones  = grabNumber("Encarcelaciones");
      const excarcelaciones  = grabNumber("Excarcelaciones");
      const reportadosRecien = grabNumber("Presos reportados recientemente");
      const extranjeros      = grabNumber("nacionalidad extranjera");

      // Arrestos acumulados section
      const arrestosDesde2014 = grabNumber("detenciones pol[ií]ticas en Venezuela");
      const asistidos         = grabNumber("hoy excarcelados");
      const cautelares        = grabNumber("medidas restrictivas");
      const fallecidos        = grabNumber("Fallecidos en custodia");
      const presentadosTrib   = grabNumber("tribunales militares");

      // Ley de amnistía
      const amnistiaPrivados  = grabNumber("privados de libertad");
      const amnistiaCautelar  = grabAfter("Libertad plena");

      // Arrestos 2026
      const detenciones2026   = grabNumber("Detenciones");
      const liberaciones2026  = grabNumber("Liberaciones");

      // Extract update date from page text
      const fechaM = html.match(/al\s+([\d]{1,2}\s+de\s+\w+\s+de\s+[\d]{4})/i);
      const fechaActualizacion = fechaM ? fechaM[1] : null;

      const data = {
        fechaActualizacion,
        presosTotal: totalPresos,
        genero: { hombres, mujeres },
        tipo: { civiles, militares },
        edad: { adultos, adolescentes },
        situacionJudicial: { condenados, noCondenados },
        movimientosRecientes: { encarcelaciones, excarcelaciones, reportadosRecien, extranjeros },
        arrestosAcumulados: {
          desdeAnio: 2014,
          total: arrestosDesde2014,
          asistidosExcarcelados: asistidos,
          cautelaresVigentes: cautelares,
          fallecidosCustodia: fallecidos,
          presentadosTribunalesMilitares: presentadosTrib,
        },
        amnistia: {
          desde: "20 de febrero de 2026",
          libertadPlenaPrivados: amnistiaPrivados,
          libertadPlenaCautelar: amnistiaCautelar,
        },
        arrestos2026: {
          detenciones: detenciones2026,
          liberaciones: liberaciones2026,
        },
        fetchedAt: new Date().toISOString(),
      };

      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=1800");
      return res.status(200).json(data);
    } catch (e) {
      return res.status(200).json({ error: e.message });
    }
  }

  // ── Open-Meteo forecast proxy (?source=omforecast) ──
  if (source === "omforecast") {
    const url = `${OM_FORECAST_BASE}?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&timezone=America%2FCaracas&past_days=${past_days || 7}&forecast_days=${forecast_days || 7}`;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!r.ok) return res.status(200).json({ error: `Open-Meteo HTTP ${r.status}` });
      const data = await r.json();
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=1800");
      return res.status(200).json(data);
    } catch (e) {
      return res.status(200).json({ error: e.message });
    }
  }

  // ── Open-Meteo archive proxy (?source=omarchive) ──
  if (source === "omarchive") {
    const url = `${OM_ARCHIVE_BASE}?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&timezone=America%2FCaracas&start_date=${start_date}&end_date=${end_date}`;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!r.ok) return res.status(200).json({ error: `Open-Meteo archive HTTP ${r.status}` });
      const data = await r.json();
      res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=3600");
      return res.status(200).json(data);
    } catch (e) {
      return res.status(200).json({ error: e.message });
    }
  }

  // ── FIRMS proxy ──
  if (source === "firms") {
    const apiKey = key || process.env.FIRMS_API_KEY || "";
    if (!apiKey) {
      return res.status(200).json({ needsKey: true, csv: "" });
    }
    const d = parseInt(days) || 3;
    const b = bbox || "-73.4,0.6,-59.8,12.2";
    const url = `${FIRMS_BASE}/${apiKey}/VIIRS_SNPP_NRT/${b}/${d}`;
    try {
      const timeoutMs = d >= 7 ? 30000 : 18000;
      const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (r.status === 401 || r.status === 403) {
        return res.status(200).json({ needsKey: true, error: "Credencial inválida o expirada", csv: "" });
      }
      if (!r.ok) return res.status(200).json({ error: `FIRMS HTTP ${r.status}`, csv: "" });
      const csv = await r.text();
      res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=300");
      return res.status(200).json({ csv, fetchedAt: new Date().toISOString() });
    } catch (e) {
      return res.status(200).json({ error: e.message, csv: "" });
    }
  }

  
  const queries = {
    instability: `${GDELT_BASE}?query=venezuela+(protest+OR+conflict+OR+crisis+OR+violence+OR+unrest)&mode=timelinevol&timespan=120d&format=csv`,
    tone: `${GDELT_BASE}?query=venezuela&mode=timelinetone&timespan=120d&format=csv`,
    artvolnorm: `${GDELT_BASE}?query=venezuela&mode=timelinevol&timespan=120d&format=csv`,
  };

  // If specific signal requested
  if (signal === "headlines") {
    // Fetch fresh headlines from Google News RSS — 6 queries covering ES + EN sources
    try {
      const gnES = "https://news.google.com/rss/search?hl=es-419&gl=VE&ceid=VE:es-419&q=";
      const gnEN = "https://news.google.com/rss/search?hl=en&gl=US&ceid=US:en&q=";
      const queries = [
        // Spanish queries
        { dim: "politica", url: gnES + encodeURIComponent("venezuela+política+OR+amnistía+OR+elecciones+OR+oposición+OR+Maduro"), max: 6 },
        { dim: "economia", url: gnES + encodeURIComponent("venezuela+petróleo+OR+economía+OR+sanciones+OR+dólar+OR+PDVSA"), max: 6 },
        { dim: "internacional", url: gnES + encodeURIComponent("venezuela+EEUU+OR+Trump+OR+internacional+OR+diplomacia+OR+petróleo"), max: 6 },
        // English queries — premium international sources
        { dim: "intl_en", url: gnEN + encodeURIComponent("venezuela"), max: 8 },
        { dim: "energy_en", url: gnEN + encodeURIComponent("venezuela oil OR sanctions OR PDVSA OR crude"), max: 5 },
        { dim: "politics_en", url: gnEN + encodeURIComponent("venezuela Maduro OR opposition OR elections OR amnesty OR Trump"), max: 5 },
      ];

      // Premium sources to prioritize
      const premiumSources = ["reuters", "bloomberg", "wsj", "wall street journal", "washington post", "cnn", "bbc", "abc", "associated press", "ap news", "france 24", "el país", "nyt", "new york times", "the guardian", "financial times", "dw"];

      function parseGnRss(xml, maxItems) {
        const articles = [];
        const items = xml.split("<item>").slice(1);
        for (const item of items) {
          const title = (item.match(/<title>(.*?)<\/title>/s) || [])[1] || "";
          const link = (item.match(/<link>(.*?)<\/link>/) || [])[1] || (item.match(/<link\/>(.*?)</) || [])[1] || "";
          const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";
          const source = (item.match(/<source[^>]*>(.*?)<\/source>/) || [])[1] || "";
          const cleanTitle = title.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
          if (cleanTitle && cleanTitle.length > 15) {
            const isPremium = premiumSources.some(ps => source.toLowerCase().includes(ps));
            articles.push({ title: cleanTitle, url: link.trim(), source, date: pubDate, premium: isPremium });
          }
          if (articles.length >= maxItems) break;
        }
        // Sort premium sources first
        return articles.sort((a, b) => (b.premium ? 1 : 0) - (a.premium ? 1 : 0));
      }

      const results = await Promise.all(
        queries.map(async (q) => {
          try {
            const r = await fetch(q.url, {
              signal: AbortSignal.timeout(10000),
              headers: { "User-Agent": "PNUD-Monitor/1.0" },
            });
            if (!r.ok) return { dim: q.dim, articles: [] };
            const xml = await r.text();
            return { dim: q.dim, articles: parseGnRss(xml, q.max) };
          } catch { return { dim: q.dim, articles: [] }; }
        })
      );

      // Merge EN results into the main dimensions
      const politicaES = results.find(r => r.dim === "politica")?.articles || [];
      const economiaES = results.find(r => r.dim === "economia")?.articles || [];
      const intlES = results.find(r => r.dim === "internacional")?.articles || [];
      const intlEN = results.find(r => r.dim === "intl_en")?.articles || [];
      const energyEN = results.find(r => r.dim === "energy_en")?.articles || [];
      const politicsEN = results.find(r => r.dim === "politics_en")?.articles || [];

      // Merge: ES first, then EN premium sources
      const politicaMerged = [...politicaES, ...politicsEN];
      const economiaMerged = [...economiaES, ...energyEN];
      const intlMerged = [...intlES, ...intlEN];

      // Deduplicate by title similarity across all
      const seen = new Set();
      const dedup = (arr) => arr.filter(a => {
        const key = a.title.toLowerCase().slice(0, 40);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const politica = dedup(politicaMerged);
      const economia = dedup(economiaMerged);
      const internacional = dedup(intlMerged);
      const allArticles = [...politica.map(a => ({...a, dim:"politica"})), ...economia.map(a => ({...a, dim:"economia"})), ...internacional.map(a => ({...a, dim:"internacional"}))];

      res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=900");
      return res.status(200).json({
        politica,
        economia,
        internacional,
        all: allArticles,
        count: allArticles.length,
        source: "google-news-rss",
        fetchedAt: new Date().toISOString(),
      });
    } catch (e) {
      return res.status(502).json({ error: e.message, politica: [], economia: [], internacional: [], all: [] });
    }
  }

  if (signal && queries[signal]) {
    try {
      const response = await fetch(queries[signal], { signal: AbortSignal.timeout(8000) });
      if (!response.ok) return res.status(502).json({ error: `GDELT returned ${response.status}` });
      const csv = await response.text();
      if (csv.includes("<!")) return res.status(502).json({ error: "GDELT returned HTML instead of CSV" });
      const data = parseCsv(csv);
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=1800");
      return res.status(200).json({ signal, data, fetchedAt: new Date().toISOString() });
    } catch (e) {
      return res.status(502).json({ error: e.message });
    }
  }

  // Fetch all three in parallel
  try {
    const [instRes, toneRes, artRes] = await Promise.all(
      [queries.instability, queries.tone, queries.artvolnorm].map(url =>
        fetch(url, { signal: AbortSignal.timeout(8000) })
          .then(r => r.ok ? r.text() : "")
          .then(t => t.includes("<!") ? new Map() : parseCsv(t))
          .catch(() => new Map())
      )
    );

    const allDates = new Set([...instRes.keys(), ...toneRes.keys(), ...artRes.keys()]);
    const merged = Array.from(allDates).sort().map(date => ({
      date,
      instability: instRes.get(date) ?? null,
      tone: toneRes.get(date) ?? null,
      artvolnorm: artRes.get(date) ?? null,
    }));

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=1800");
    return res.status(200).json({ data: merged, fetchedAt: new Date().toISOString(), error: null });
  } catch (e) {
    return res.status(502).json({ data: [], fetchedAt: new Date().toISOString(), error: e.message });
  }
}

function parseCsv(csvText) {
  const map = new Map();
  const clean = csvText.replace(/^\uFEFF/, "").trim();
  const lines = clean.split("\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    const date = parts[0]?.trim();
    const value = parseFloat(parts[parts.length - 1]?.trim());
    if (date && !isNaN(value)) map.set(date, value);
  }
  return map;
}

async function fetchSismoVenezuela(debug) {
  const headers = {
    apikey: SISMO_API_KEY,
    authorization: `Bearer ${SISMO_API_KEY}`,
    "accept-profile": "public",
    accept: "application/json",
  };

  const reportsUrl = `${SISMO_SUPABASE_URL}/rest/v1/reports?select=id,lat,lng,severity,place,photo_url,note,created_at&order=created_at.desc&limit=5000`;
  const acopiosUrl = `${SISMO_SUPABASE_URL}/rest/v1/acopios?select=id,lat,lng,name,needs,contact,created_at&order=created_at.desc&limit=2000`;

  const [reportsRes, acopiosRes] = await Promise.all([
    fetch(reportsUrl, { headers, signal: AbortSignal.timeout(10000) }),
    fetch(acopiosUrl, { headers, signal: AbortSignal.timeout(10000) }),
  ]);

  const reports = reportsRes.ok ? await reportsRes.json() : [];
  const acopios = acopiosRes.ok ? await acopiosRes.json() : [];

  const result = {
    reports,
    acopios,
    counts: { reports: reports.length, acopios: acopios.length },
    fetchedAt: new Date().toISOString(),
    source: "sismovenezuela.org (Supabase)",
  };

  if (debug) {
    result._debug = {
      reportsStatus: reportsRes.status,
      acopiosStatus: acopiosRes.status,
      reportsOk: reportsRes.ok,
      acopiosOk: acopiosRes.ok,
    };
  }

  return result;
}

function sismoBuildingsHeaders() {
  return {
    apikey: SISMO_BUILDINGS_API_KEY,
    authorization: `Bearer ${SISMO_BUILDINGS_API_KEY}`,
    "accept-profile": "public",
    accept: "application/json",
  };
}

const MISSING_PERSONS_API = "https://desaparecidos-terremoto-api.theempire.tech/api/personas?page=1&pageSize=1";

// IMPORTANT: this endpoint returns full individual records (name, phone, address,
// physical description, photo) with no auth required. We deliberately request the
// smallest possible page (pageSize=1) and extract ONLY the pre-computed `counts`
// object the API itself returns. The `items` array — and anything inside it — is
// never read, never stored, and never forwarded past this function.
async function fetchMissingPersonsCount(debug) {
  const attempts = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(MISSING_PERSONS_API, {
        headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (compatible; MonitorVenezuelaBot/1.0)" },
        signal: AbortSignal.timeout(3500),
      });
      if (!res.ok) {
        attempts.push({ attempt, status: res.status, ok: false });
        continue;
      }
      const json = await res.json();
      const counts = json && json.counts ? {
        total: json.counts.total ?? null,
        sinContacto: json.counts.sinContacto ?? null,
        localizado: json.counts.localizado ?? null,
      } : null;
      // `json` (which includes `items`) goes out of scope here and is not returned.
      return { missingCounts: counts, _debugMissing: debug ? { status: res.status, ok: res.ok, attempts: attempt } : undefined };
    } catch (e) {
      attempts.push({
        attempt,
        error: e.message,
        cause: e.cause ? String(e.cause.code || e.cause.message || e.cause) : null,
      });
      if (attempt < 2) await new Promise(r => setTimeout(r, 250));
    }
  }
  return { missingCounts: null, _debugMissing: debug ? { attempts } : undefined };
}

async function fetchSismoExtras(debug) {
  const headers = {
    apikey: SISMO_API_KEY,
    authorization: `Bearer ${SISMO_API_KEY}`,
    "accept-profile": "public",
    accept: "application/json",
  };

  const casualtiesUrl = `${SISMO_SUPABASE_URL}/rest/v1/casualty_stats?select=id,deaths,injured,missing,source_name,source_url,auto_extracted,scraped_at&order=scraped_at.desc&limit=30`;
  const buildingDamageUrl = `${SISMO_SUPABASE_URL}/rest/v1/building_damage?select=id,external_id,external_source,lat,lng,place,damage_type,affected,needs,photo_url,confirmations,reported_at&order=reported_at.desc&limit=3000`;

  const [casRes, bdRes, missingResult] = await Promise.all([
    fetch(casualtiesUrl, { headers, signal: AbortSignal.timeout(10000) }),
    fetch(buildingDamageUrl, { headers, signal: AbortSignal.timeout(10000) }),
    fetchMissingPersonsCount(debug),
  ]);

  const casualtyHistory = casRes.ok ? await casRes.json() : [];
  const buildingDamageSocial = bdRes.ok ? await bdRes.json() : [];

  // Prefer manually-curated rows (auto_extracted=false) over scraped ones, most recent first —
  // mirrors the logic the source site itself uses for its own banner.
  const sortedCasualties = [...casualtyHistory].sort((a, b) => {
    if (!!a.auto_extracted !== !!b.auto_extracted) return a.auto_extracted ? 1 : -1;
    return new Date(b.scraped_at || 0) - new Date(a.scraped_at || 0);
  });
  const casualtiesLatest = sortedCasualties[0] || null;

  const result = {
    casualtiesLatest,
    casualtiesHistory: sortedCasualties.slice(0, 12),
    buildingDamageSocial,
    missingCounts: missingResult.missingCounts,
  };

  if (debug) {
    result._debugExtra = {
      casualtiesStatus: casRes.status,
      buildingDamageStatus: bdRes.status,
      casualtiesOk: casRes.ok,
      buildingDamageOk: bdRes.ok,
      missingPersons: missingResult._debugMissing,
    };
  }

  return result;
}

async function fetchSismoBuildings(debug) {
  const select = [
    "id",
    "name",
    "address",
    "city",
    "zone",
    "lat",
    "lng",
    "damage_level",
    "status",
    "main_photo_url",
    "media_urls",
    "general_source",
    "notes",
    "casualties_notes",
    "trapped_names",
    "has_missing_persons",
    "is_technically_evaluated",
    "last_updated_at",
  ].join(",");
  const url = `${SISMO_BUILDINGS_SUPABASE_URL}/rest/v1/buildings?select=${encodeURIComponent(select)}&order=last_updated_at.desc&limit=2000`;
  const res = await fetch(url, { headers: sismoBuildingsHeaders(), signal: AbortSignal.timeout(10000) });
  const buildings = res.ok ? await res.json() : [];
  const result = { buildings };

  if (debug) {
    result._debug = {
      buildingsStatus: res.status,
      buildingsOk: res.ok,
    };
  }

  return result;
}

async function fetchSismosConsolidado(debug) {
  const [base, buildingsResult, extras] = await Promise.all([
    fetchSismoVenezuela(debug),
    fetchSismoBuildings(debug),
    fetchSismoExtras(debug),
  ]);

  const buildings = buildingsResult.buildings || [];
  const counts = {
    reports: base.reports.length,
    acopios: base.acopios.length,
    buildings: buildings.length,
    damage: buildings.reduce((acc, b) => {
      const key = String(b.damage_level || "sin_dato").toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
    technicallyEvaluated: buildings.filter(b => b.is_technically_evaluated).length,
    missingPersons: buildings.filter(b => b.has_missing_persons).length,
    buildingDamageSocial: extras.buildingDamageSocial.length,
  };

  const result = {
    reports: base.reports,
    acopios: base.acopios,
    buildings,
    buildingDamageSocial: extras.buildingDamageSocial,
    casualtiesLatest: extras.casualtiesLatest,
    casualtiesHistory: extras.casualtiesHistory,
    missingCounts: extras.missingCounts,
    counts,
    fetchedAt: new Date().toISOString(),
    source: "consolidated-earthquake-public-data",
  };

  if (debug) {
    result._debug = {
      ...base._debug,
      ...buildingsResult._debug,
      ...extras._debugExtra,
    };
  }

  return result;
}

async function fetchSismoBuildingDetail(buildingId, debug) {
  if (!buildingId) {
    return { evaluations: [], timeline: [], error: "building_id requerido" };
  }

  const safeId = encodeURIComponent(String(buildingId));
  const headers = sismoBuildingsHeaders();
  const evalSelect = "id,building_id,evaluator_id,structural_damage_score,habitability,technical_report,required_actions,created_at";
  const timelineSelect = "id,building_id,status,damage_level,previous_status,previous_damage_level,update_notes,created_at";
  const evalUrl = `${SISMO_BUILDINGS_SUPABASE_URL}/rest/v1/structural_evaluations?select=${encodeURIComponent(evalSelect)}&building_id=eq.${safeId}&order=created_at.desc`;
  const timelineUrl = `${SISMO_BUILDINGS_SUPABASE_URL}/rest/v1/building_status_timeline?select=${encodeURIComponent(timelineSelect)}&building_id=eq.${safeId}&order=created_at.desc&limit=100`;

  const [evaluationsRes, timelineRes] = await Promise.all([
    fetch(evalUrl, { headers, signal: AbortSignal.timeout(10000) }),
    fetch(timelineUrl, { headers, signal: AbortSignal.timeout(10000) }),
  ]);

  const evaluations = evaluationsRes.ok ? await evaluationsRes.json() : [];
  const timeline = timelineRes.ok ? await timelineRes.json() : [];
  const result = {
    evaluations,
    timeline,
    counts: { evaluations: evaluations.length, timeline: timeline.length },
    fetchedAt: new Date().toISOString(),
  };

  if (debug) {
    result._debug = {
      evaluationsStatus: evaluationsRes.status,
      timelineStatus: timelineRes.status,
      evaluationsOk: evaluationsRes.ok,
      timelineOk: timelineRes.ok,
    };
  }

  return result;
}

const USGS_BASE = "https://earthquake.usgs.gov/fdsnws/event/1/query";
// Bounding box covering all of Venezuela with margin (same box used client-side for isVenezuelaPoint)
const VE_BBOX = { minlatitude: "0", maxlatitude: "13", minlongitude: "-74", maxlongitude: "-58" };

async function fetchUsgsQuakes(query) {
  const { starttime, endtime, minmagnitude } = query;
  const params = new URLSearchParams({
    format: "geojson",
    starttime: starttime || "2026-06-24",
    endtime: endtime || new Date().toISOString().slice(0, 19),
    ...VE_BBOX,
    minmagnitude: minmagnitude || "0",
    orderby: "time",
    limit: "5000",
  });
  const url = `${USGS_BASE}?${params.toString()}`;
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      return { features: [], error: `USGS HTTP ${res.status}`, fetchedAt: new Date().toISOString() };
    }
    const json = await res.json();
    return { features: Array.isArray(json.features) ? json.features : [], fetchedAt: new Date().toISOString() };
  } catch (e) {
    return { features: [], error: e.message, fetchedAt: new Date().toISOString() };
  }
}

// EMSC (European-Mediterranean Seismological Centre) aggregates ~65 national/regional seismic
// networks worldwide and is typically far more complete than USGS for events below M4.5 outside
// the US — this is the gap most third-party earthquake apps fill by using EMSC instead of/alongside USGS.
const EMSC_BASE = "https://www.seismicportal.eu/fdsnws/event/1/query";

async function fetchEmscQuakes(query) {
  const { starttime, endtime, minmagnitude } = query;
  const params = new URLSearchParams({
    format: "json",
    start: (starttime || "2026-06-24").slice(0, 19),
    end: (endtime || new Date().toISOString().slice(0, 19)).slice(0, 19),
    minlat: VE_BBOX.minlatitude,
    maxlat: VE_BBOX.maxlatitude,
    minlon: VE_BBOX.minlongitude,
    maxlon: VE_BBOX.maxlongitude,
    minmag: minmagnitude || "0",
    limit: "2000",
  });
  const url = `${EMSC_BASE}?${params.toString()}`;
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      return { features: [], error: `EMSC HTTP ${res.status}`, fetchedAt: new Date().toISOString() };
    }
    const json = await res.json();
    return { features: Array.isArray(json.features) ? json.features : [], fetchedAt: new Date().toISOString() };
  } catch (e) {
    return { features: [], error: e.message, fetchedAt: new Date().toISOString() };
  }
}

// Crisis Damage Intelligence: third-party platform built on top of the official Copernicus
// EMSR884 rapid-mapping activation for this earthquake, enriched with VLM (AI) review.
// catalog.json lists one entry per AOI (area of interest); each AOI links to its own
// damage.geojson (building-level damage vector) and a satellite tile pyramid for the
// post-event image. We fetch the catalog + every AOI's damage geojson server-side (small
// vector payloads); the satellite tiles themselves are NOT proxied here — they're loaded
// directly by the browser as a Leaflet tile layer, same as the basemap tiles, to avoid
// pulling tens of MB of imagery through this serverless function.
const CDI_BASE = "https://crisis-damage-intelligence.vercel.app";

async function fetchCrisisDamageIntelligence(debug) {
  try {
    const catalogRes = await fetch(`${CDI_BASE}/data/catalog.json`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!catalogRes.ok) {
      return { aois: [], error: `catalog HTTP ${catalogRes.status}`, fetchedAt: new Date().toISOString() };
    }
    const catalog = await catalogRes.json();
    const aoiList = Array.isArray(catalog.aois) ? catalog.aois : [];

    const damageResults = await Promise.all(
      aoiList.map(async aoi => {
        const damageUrl = aoi.layers?.damage;
        if (!damageUrl) return { id: aoi.id, features: [] };
        try {
          const url = damageUrl.startsWith("http") ? damageUrl : `${CDI_BASE}${damageUrl}`;
          const res = await fetch(url, {
            headers: { accept: "application/json" },
            signal: AbortSignal.timeout(10000),
          });
          if (!res.ok) return { id: aoi.id, features: [], error: `HTTP ${res.status}` };
          const geo = await res.json();
          return { id: aoi.id, features: Array.isArray(geo.features) ? geo.features : [] };
        } catch (e) {
          return { id: aoi.id, features: [], error: e.message };
        }
      })
    );
    const damageById = {};
    damageResults.forEach(d => { damageById[d.id] = d; });

    const aois = aoiList.map(aoi => ({
      id: aoi.id,
      country: aoi.country,
      event: aoi.event,
      nameEs: aoi.name?.es || aoi.id,
      status: aoi.status,
      source: aoi.source,
      bounds: aoi.bounds,
      center: aoi.center,
      metrics: aoi.metrics || {},
      afterTilesUrlTemplate: aoi.imagery?.after?.tilePyramid?.urlTemplate
        ? `${CDI_BASE}${aoi.imagery.after.tilePyramid.urlTemplate}`
        : null,
      tileMinZoom: aoi.imagery?.after?.tilePyramid?.minZoom ?? 12,
      tileMaxZoom: aoi.imagery?.after?.tilePyramid?.maxZoom ?? 18,
      sensor: aoi.imagery?.after?.sensor || null,
      acquisitionUtc: aoi.imagery?.after?.acquisitionUtc || null,
      features: damageById[aoi.id]?.features || [],
    }));

    const result = {
      updatedAt: catalog.updatedAt,
      aois,
      watchlist: catalog.watchlist || [],
      fetchedAt: new Date().toISOString(),
    };

    if (debug) {
      const sampleAoi = aois.find(a => a.features.length > 0);
      result._debug = {
        aoiCount: aois.length,
        damageErrors: damageResults.filter(d => d.error).map(d => ({ id: d.id, error: d.error })),
        sampleFeatureProperties: sampleAoi ? sampleAoi.features[0]?.properties || null : null,
        sampleFeatureGeometryType: sampleAoi ? sampleAoi.features[0]?.geometry?.type || null : null,
      };
    }

    return result;
  } catch (e) {
    return { aois: [], error: e.message, fetchedAt: new Date().toISOString() };
  }
}

const LHASA_BASE_SERVER = "https://maps.disasters.nasa.gov/ags03/rest/services/NRT/landslide_nowcast/ImageServer";

// Proxied server-side: the LHASA image overlay itself loads fine client-side as a plain <img>
// (no CORS needed for that), but the /identify operation is a real fetch() that NASA's server
// may not whitelist for arbitrary browser origins. Routing it through here sidesteps that.
async function fetchLhasaIdentify(lat, lng) {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return { value: null, error: "lat/lng invalidos" };
  }
  try {
    const geometry = JSON.stringify({ x: lngNum, y: latNum, spatialReference: { wkid: 4326 } });
    const params = new URLSearchParams({
      geometry,
      geometryType: "esriGeometryPoint",
      returnGeometry: "false",
      renderingRule: JSON.stringify({ rasterFunction: "Landslide_Nowcast_Index" }),
      f: "json",
    });
    const res = await fetch(`${LHASA_BASE_SERVER}/identify?${params.toString()}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { value: null, error: `HTTP ${res.status} ${text.slice(0, 140)}` };
    }
    const json = await res.json();
    if (json.error) {
      return { value: null, error: json.error.message || JSON.stringify(json.error).slice(0, 140) };
    }
    return json;
  } catch (e) {
    return { value: null, error: e.message };
  }
}

// ── DRP Venezuela - Escombros en Vías (La Guaira) ─────────────────────────
// FeatureServer público del Hub de Esri/DRP para el terremoto de Venezuela 2026.
// hasStaticData: false → datos operativos en vivo, actualizados por los equipos en campo.
const DRP_ORG = "w0z3NDBGLWwOLx2y";
const ESCOMBROS_BASE = `https://services8.arcgis.com/${DRP_ORG}/ArcGIS/rest/services/EscombrosEnVias/FeatureServer/0`;
const ESCOMBROS_PUNTOS_BASE = `https://services8.arcgis.com/${DRP_ORG}/ArcGIS/rest/services/Escombros_La_Guaira/FeatureServer/3`;

async function fetchEscombros(debug) {
  const headers = { accept: "application/json" };

  // Conteo por tipo de vía (para KPIs)
  const statsParams = new URLSearchParams({
    where: "1=1",
    outStatistics: JSON.stringify([
      { statisticType: "count", onStatisticField: "OBJECTID", outStatisticFieldName: "total" },
    ]),
    groupByFieldsForStatistics: "TipoVia",
    f: "json",
  });

  // Geometrías completas (para el mapa)
  const geoParams = new URLSearchParams({
    where: "1=1",
    outFields: "OBJECTID,TipoVia,Shape__Area",
    geometryPrecision: "5",
    outSR: "4326",
    f: "geojson",
  });

  try {
    const [statsRes, geoRes] = await Promise.all([
      fetch(`${ESCOMBROS_BASE}/query?${statsParams}`, { headers, signal: AbortSignal.timeout(10000) }),
      fetch(`${ESCOMBROS_BASE}/query?${geoParams}`, { headers, signal: AbortSignal.timeout(10000) }),
    ]);

    const statsJson = statsRes.ok ? await statsRes.json() : null;
    const geoJson = geoRes.ok ? await geoRes.json() : null;

    const counts = { principal: 0, secundaria: 0, otro: 0, total: 0 };
    if (statsJson && Array.isArray(statsJson.features)) {
      statsJson.features.forEach(f => {
        const tipo = String(f.attributes?.TipoVia || "").toLowerCase();
        const n = f.attributes?.total || 0;
        if (tipo.includes("principal")) counts.principal += n;
        else if (tipo.includes("secundaria")) counts.secundaria += n;
        else counts.otro += n;
        counts.total += n;
      });
    }

    const result = {
      counts,
      features: geoJson?.features || [],
      fetchedAt: new Date().toISOString(),
      source: "DRP Venezuela - EscombrosEnVias (FeatureServer)",
    };

    if (debug) {
      result._debug = { statsStatus: statsRes.status, geoStatus: geoRes.status };
    }

    return result;
  } catch (e) {
    return { counts: { principal: 0, secundaria: 0, otro: 0, total: 0 }, features: [], error: e.message };
  }
}

// ── Vantor (Maxar) - Tiles antes/después ──────────────────────────────────
// Tile services preprocesados del programa Vantor Open Data, publicados como
// MapServer de ArcGIS. No requieren autenticación. Las URLs reales de los tiles
// las devolvemos aquí para que el frontend las use directo en Leaflet como
// L.tileLayer (no proxy de imágenes — el browser las carga directo, igual que el basemap).
const VANTOR_ANTES = `https://tiles.arcgis.com/tiles/${DRP_ORG}/arcgis/rest/services/Vantor_Antes_WTL1/MapServer`;
const VANTOR_DESPUES = `https://tiles.arcgis.com/tiles/${DRP_ORG}/arcgis/rest/services/Vantor_Images_WTL1/MapServer`;

async function fetchVantorTilesInfo(debug) {
  const headers = { accept: "application/json" };
  try {
    const [antesRes, despuesRes] = await Promise.all([
      fetch(`${VANTOR_ANTES}?f=json`, { headers, signal: AbortSignal.timeout(10000) }),
      fetch(`${VANTOR_DESPUES}?f=json`, { headers, signal: AbortSignal.timeout(10000) }),
    ]);

    const antesJson = antesRes.ok ? await antesRes.json() : null;
    const despuesJson = despuesRes.ok ? await despuesRes.json() : null;

    // Extraer bounding box y rango de zoom de cada servicio
    function parseTileInfo(json, baseUrl) {
      if (!json) return null;
      const ext = json.initialExtent || json.fullExtent;
      const minScale = json.minScale || json.tileInfo?.lods?.[json.tileInfo.lods.length - 1]?.scale;
      const maxScale = json.maxScale || json.tileInfo?.lods?.[0]?.scale;
      return {
        url: baseUrl,
        tileUrl: `${baseUrl}/tile/{z}/{y}/{x}`,
        name: json.mapName || json.serviceDescription || baseUrl.split("/").slice(-2, -1)[0],
        extent: ext ? [ext.ymin, ext.xmin, ext.ymax, ext.xmax] : null,
        minZoom: json.tileInfo?.lods?.length ? Math.min(...json.tileInfo.lods.map(l => l.level)) : 10,
        maxZoom: json.tileInfo?.lods?.length ? Math.max(...json.tileInfo.lods.map(l => l.level)) : 20,
      };
    }

    const result = {
      antes: parseTileInfo(antesJson, VANTOR_ANTES),
      despues: parseTileInfo(despuesJson, VANTOR_DESPUES),
      fetchedAt: new Date().toISOString(),
      source: "Vantor/Maxar Open Data via DRP Venezuela ArcGIS",
    };

    if (debug) {
      result._debug = { antesStatus: antesRes.status, despuesStatus: despuesRes.status };
    }

    return result;
  } catch (e) {
    return { antes: null, despues: null, error: e.message };
  }
}

