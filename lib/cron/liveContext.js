// ═══════════════════════════════════════════════════════════════
// LIVE CONTEXT — IODA (conectividad/electricidad), ACLED (conflictividad)
// y sismos (USGS/EMSC), para enriquecer el Daily Brief.
//
// IODA y USGS/EMSC se llaman directo al upstream (no hay CORS del
// lado del servidor, así que no hace falta pasar por /api/ioda o
// /api/gdelt). ACLED requiere OAuth — para no duplicar esa lógica,
// se llama al endpoint ya desplegado /api/acled (mismo patrón que
// exige el resto del proyecto: sin slots nuevos de Vercel).
// ═══════════════════════════════════════════════════════════════

const IODA_BASE = "https://api.ioda.inetintel.cc.gatech.edu/v2";
const APP_BASE_URL = process.env.APP_BASE_URL || "https://dashboard-ven-monitor-app.vercel.app";
const VE_BBOX = "-73.4,0.6,-59.8,12.2";

// Los 24 estados venezolanos con su código IODA (ver TabIODA.jsx / SITREP_UPDATE_PROTOCOL.md)
const VE_REGIONS = [
  { code: "4482", name: "Falcón" }, { code: "4483", name: "Apure" }, { code: "4484", name: "Barinas" },
  { code: "4485", name: "Mérida" }, { code: "4486", name: "Táchira" }, { code: "4487", name: "Trujillo" },
  { code: "4488", name: "Zulia" }, { code: "4489", name: "Cojedes" }, { code: "4490", name: "Carabobo" },
  { code: "4491", name: "Lara" }, { code: "4492", name: "Portuguesa" }, { code: "4493", name: "Yaracuy" },
  { code: "4494", name: "Amazonas" }, { code: "4495", name: "Bolívar" }, { code: "4496", name: "Anzoátegui" },
  { code: "4497", name: "Aragua" }, { code: "4498", name: "Vargas" }, { code: "4499", name: "Distrito Capital" },
  { code: "4501", name: "Guárico" }, { code: "4502", name: "Monagas" }, { code: "4503", name: "Miranda" },
  { code: "4504", name: "Nueva Esparta" }, { code: "4505", name: "Sucre" }, { code: "4506", name: "Delta Amacuro" },
];

async function iodaFetch(pathSeg, params) {
  const qs = new URLSearchParams(params).toString();
  const url = `${IODA_BASE}/${pathSeg}?${qs}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Conectividad / electricidad (últimas 24h) ──
// NOTA: se revisan las ALERTAS recientes (outages/alerts) de los 24 estados, no solo
// el conteo de eventos nacionales — un apagón regional puede no generar un evento
// nacional agregado pero sí alertas críticas a nivel de estado. No replicamos aquí el
// algoritmo completo de detección de racionamiento del tab IODA (veto BGP, prior por
// estado, clustering) — es demasiado para un resumen diario; esto es una señal más
// simple pero de cobertura completa: "¿qué estados tuvieron alertas críticas hoy?".
async function getConectividad() {
  const now = Math.floor(Date.now() / 1000);
  const from = now - 24 * 3600;

  const [natEvents, ...stateAlerts] = await Promise.all([
    iodaFetch("outages/events", { entityType: "country", entityCode: "VE", from, until: now }),
    ...VE_REGIONS.map(st => iodaFetch("outages/alerts", { entityType: "region", entityCode: st.code, from, until: now })),
  ]);

  const nationalEvents = Array.isArray(natEvents?.data) ? natEvents.data : [];

  const affectedStates = VE_REGIONS.map((st, i) => {
    const alerts = Array.isArray(stateAlerts[i]?.data) ? stateAlerts[i].data : [];
    const critical = alerts.filter(a => a.level === "critical");
    return { name: st.name, criticalCount: critical.length, totalAlerts: alerts.length };
  }).filter(s => s.criticalCount > 0).sort((a, b) => b.criticalCount - a.criticalCount);

  return {
    ok: true,
    nationalEventCount: nationalEvents.length,
    affectedStateCount: affectedStates.length,
    topStates: affectedStates.slice(0, 6),
  };
}

// ── Conflictividad / protestas (ACLED, vía endpoint propio ya desplegado) ──
// NOTA IMPORTANTE: ACLED actualiza su base de datos con cadencia semanal, no diaria —
// es normal que este conteo se repita varios días seguidos hasta el próximo lote de
// carga. Por eso reportamos también hace cuántos días es el evento más reciente
// registrado, para que el lector no lo confunda con "noticia de hoy".
async function getConflictividad() {
  try {
    const year = new Date().getFullYear();
    const res = await fetch(`${APP_BASE_URL}/api/acled?type=events&year=${year}&limit=200`, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return { ok: false, count: null, events: [], daysSinceLastEvent: null };
    const json = await res.json();
    const rows = Array.isArray(json?.data) ? json.data : [];
    const cutoff = Date.now() - 7 * 86400000;
    const recent = rows.filter(r => r.event_date && new Date(r.event_date).getTime() >= cutoff);
    recent.sort((a, b) => (b.fatalities || 0) - (a.fatalities || 0));

    const mostRecentDate = rows.reduce((max, r) => {
      const t = r.event_date ? new Date(r.event_date).getTime() : 0;
      return t > max ? t : max;
    }, 0);
    const daysSinceLastEvent = mostRecentDate > 0 ? Math.floor((Date.now() - mostRecentDate) / 86400000) : null;

    return {
      ok: true,
      count: recent.length,
      daysSinceLastEvent,
      events: recent.slice(0, 3).map(r => ({
        date: r.event_date, type: r.sub_event_type || r.event_type,
        location: r.location || r.admin1, fatalities: r.fatalities || 0,
        actor1: r.actor1,
      })),
    };
  } catch {
    return { ok: false, count: null, events: [], daysSinceLastEvent: null };
  }
}

// ── Sismos: últimos registrados en los últimos 7 días (M≥4.0) ──
async function getSismos() {
  const now = new Date();
  const from = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const params = new URLSearchParams({
    starttime: from.toISOString().slice(0, 19),
    endtime: now.toISOString().slice(0, 19),
    minmagnitude: "4.0",
  }).toString();

  try {
    const [usgsRes, emscRes] = await Promise.all([
      fetch(`${APP_BASE_URL}/api/gdelt?source=usgs&${params}`, { signal: AbortSignal.timeout(12000) }).catch(() => null),
      fetch(`${APP_BASE_URL}/api/gdelt?source=emsc&${params}`, { signal: AbortSignal.timeout(12000) }).catch(() => null),
    ]);
    const usgsJson = usgsRes && usgsRes.ok ? await usgsRes.json() : { features: [] };
    const emscJson = emscRes && emscRes.ok ? await emscRes.json() : { features: [] };

    const events = [];
    for (const f of usgsJson.features || []) {
      const mag = f.properties?.mag;
      const place = f.properties?.place;
      const time = f.properties?.time;
      if (mag != null) events.push({ mag, place, time: time ? new Date(time).toISOString() : null, source: "USGS" });
    }
    for (const f of emscJson.features || []) {
      const mag = f.properties?.mag;
      const place = f.properties?.flynn_region || f.properties?.place;
      const time = f.properties?.time;
      if (mag != null) events.push({ mag, place, time, source: "EMSC" });
    }
    // Más recientes primero (no por magnitud) — "los últimos registrados"
    events.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
    return { ok: true, count: events.length, events: events.slice(0, 5) };
  } catch {
    return { ok: false, count: 0, events: [] };
  }
}

// ── Límites aproximados por estado (mismos que usa TabAmbiental.jsx, para consistencia) ──
const VE_STATE_BOUNDS = {
  "Amazonas":        { minLat:0.6,  maxLat:6.5,  minLon:-68.0, maxLon:-61.5 },
  "Anzoátegui":      { minLat:7.8,  maxLat:10.5, minLon:-66.5, maxLon:-62.0 },
  "Apure":           { minLat:5.5,  maxLat:8.5,  minLon:-72.5, maxLon:-66.0 },
  "Aragua":          { minLat:9.5,  maxLat:10.8, minLon:-68.3, maxLon:-66.5 },
  "Barinas":         { minLat:7.0,  maxLat:9.5,  minLon:-71.5, maxLon:-68.5 },
  "Bolívar":         { minLat:3.6,  maxLat:8.8,  minLon:-64.5, maxLon:-60.0 },
  "Carabobo":        { minLat:9.8,  maxLat:10.7, minLon:-68.5, maxLon:-67.5 },
  "Cojedes":         { minLat:8.8,  maxLat:10.0, minLon:-69.0, maxLon:-67.8 },
  "Delta Amacuro":   { minLat:7.5,  maxLat:10.0, minLon:-62.5, maxLon:-59.8 },
  "Distrito Capital":{ minLat:10.3, maxLat:10.7, minLon:-67.1, maxLon:-66.6 },
  "Falcón":          { minLat:10.5, maxLat:12.2, minLon:-71.0, maxLon:-68.5 },
  "Guárico":         { minLat:7.5,  maxLat:10.0, minLon:-68.5, maxLon:-65.0 },
  "Lara":            { minLat:9.5,  maxLat:11.0, minLon:-70.5, maxLon:-68.5 },
  "Mérida":          { minLat:7.8,  maxLat:9.5,  minLon:-72.0, maxLon:-70.5 },
  "Miranda":         { minLat:9.8,  maxLat:10.8, minLon:-67.3, maxLon:-65.8 },
  "Monagas":         { minLat:8.5,  maxLat:10.5, minLon:-64.0, maxLon:-62.0 },
  "Nueva Esparta":   { minLat:10.6, maxLat:11.2, minLon:-64.5, maxLon:-63.5 },
  "Portuguesa":      { minLat:8.5,  maxLat:10.0, minLon:-70.2, maxLon:-68.5 },
  "Sucre":           { minLat:10.0, maxLat:11.0, minLon:-64.0, maxLon:-62.2 },
  "Táchira":         { minLat:6.9,  maxLat:8.5,  minLon:-73.4, maxLon:-71.5 },
  "Trujillo":        { minLat:9.0,  maxLat:10.5, minLon:-71.0, maxLon:-70.0 },
  "Vargas":          { minLat:10.4, maxLat:10.8, minLon:-67.4, maxLon:-66.7 },
  "Yaracuy":         { minLat:10.0, maxLat:10.9, minLon:-69.2, maxLon:-68.2 },
  "Zulia":           { minLat:7.8,  maxLat:12.2, minLon:-73.4, maxLon:-71.0 },
};
function pointToState(lat, lon) {
  for (const [name, b] of Object.entries(VE_STATE_BOUNDS)) {
    if (lat >= b.minLat && lat <= b.maxLat && lon >= b.minLon && lon <= b.maxLon) return name;
  }
  return null;
}

// Un punto representativo por estado, para consultar precipitación (mismos puntos que TabAmbiental.jsx)
const VE_ESTADOS_PUNTO = [
  { id:"Amazonas", lat:3.99, lon:-67.35 }, { id:"Anzoátegui", lat:9.36, lon:-64.18 },
  { id:"Apure", lat:7.89, lon:-68.52 }, { id:"Aragua", lat:10.24, lon:-67.60 },
  { id:"Barinas", lat:8.62, lon:-70.21 }, { id:"Bolívar", lat:8.12, lon:-63.55 },
  { id:"Carabobo", lat:10.18, lon:-68.00 }, { id:"Cojedes", lat:9.38, lon:-68.33 },
  { id:"Delta Amacuro", lat:8.60, lon:-61.01 }, { id:"Distrito Capital", lat:10.48, lon:-66.87 },
  { id:"Falcón", lat:11.41, lon:-69.67 }, { id:"Guárico", lat:8.75, lon:-66.23 },
  { id:"Lara", lat:10.07, lon:-69.32 }, { id:"Mérida", lat:8.59, lon:-71.14 },
  { id:"Miranda", lat:10.24, lon:-66.43 }, { id:"Monagas", lat:9.75, lon:-63.18 },
  { id:"Nueva Esparta", lat:10.99, lon:-63.91 }, { id:"Portuguesa", lat:9.09, lon:-69.35 },
  { id:"Sucre", lat:10.46, lon:-63.18 }, { id:"Táchira", lat:7.77, lon:-72.22 },
  { id:"Trujillo", lat:9.36, lon:-70.43 }, { id:"Vargas", lat:10.60, lon:-67.02 },
  { id:"Yaracuy", lat:10.34, lon:-68.79 }, { id:"Zulia", lat:10.65, lon:-71.64 },
];

// Umbral de lluvia acumulada (7 días) para considerarla relevante — mm
const RAIN_SIGNIFICANT_MM = 100;
// Umbral de focos de calor nacional para considerar la sección relevante
const FIRMS_SIGNIFICANT_THRESHOLD = 15;

// ── Ambiental: incendios por estado (NASA FIRMS VIIRS, 24h) + lluvias por estado (Open-Meteo, 7d) ──
async function getAmbiental() {
  const [firmsResult, rainResults] = await Promise.all([
    (async () => {
      try {
        const res = await fetch(`${APP_BASE_URL}/api/gdelt?source=firms&days=1&bbox=${encodeURIComponent(VE_BBOX)}`, { signal: AbortSignal.timeout(20000) });
        if (!res.ok) return { ok: false, count: 0, byState: [] };
        const json = await res.json();
        if (json?.needsKey || !json?.csv) return { ok: false, count: 0, byState: [] };
        const lines = json.csv.trim().split("\n");
        const header = lines[0].split(",").map(h => h.trim());
        const latIdx = header.indexOf("latitude"), lonIdx = header.indexOf("longitude");
        const counts = {};
        let total = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",");
          const lat = parseFloat(cols[latIdx]), lon = parseFloat(cols[lonIdx]);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
          total++;
          const state = pointToState(lat, lon);
          if (state) counts[state] = (counts[state] || 0) + 1;
        }
        const byState = Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        return { ok: true, count: total, byState: byState.slice(0, 6) };
      } catch {
        return { ok: false, count: 0, byState: [] };
      }
    })(),
    Promise.all(VE_ESTADOS_PUNTO.map(async st => {
      try {
        const url = `${APP_BASE_URL}/api/gdelt?source=omforecast&lat=${st.lat}&lon=${st.lon}&past_days=7&forecast_days=1`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) return null;
        const json = await res.json();
        const days = json?.daily?.precipitation_sum ?? [];
        const hist = days.slice(0, 7);
        const acum7d = hist.reduce((s, v) => s + (v ?? 0), 0);
        return { name: st.id, acum7d: Math.round(acum7d) };
      } catch {
        return null;
      }
    })),
  ]);

  const rainByState = rainResults.filter(r => r && r.acum7d >= RAIN_SIGNIFICANT_MM).sort((a, b) => b.acum7d - a.acum7d);

  return {
    ok: firmsResult.ok,
    count: firmsResult.count,
    significant: firmsResult.count >= FIRMS_SIGNIFICANT_THRESHOLD,
    byState: firmsResult.byState,
    rainOk: rainResults.some(r => r != null),
    rainByState: rainByState.slice(0, 6),
  };
}

module.exports = { getConectividad, getConflictividad, getSismos, getAmbiental };
