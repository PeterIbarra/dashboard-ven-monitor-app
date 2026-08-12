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

// ── Sismos significativos (últimas 24h, magnitud >= 4.0) ──
async function getSismos() {
  const now = new Date();
  const from = new Date(now.getTime() - 24 * 3600 * 1000);
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
    events.sort((a, b) => (b.mag || 0) - (a.mag || 0));
    return { ok: true, count: events.length, events: events.slice(0, 3) };
  } catch {
    return { ok: false, count: 0, events: [] };
  }
}

// ── Ambiental: incendios activos (NASA FIRMS VIIRS, últimas 24h) ──
// Umbral de 15 puntos de calor para evitar ruido de quemas agrícolas menores.
const FIRMS_SIGNIFICANT_THRESHOLD = 15;
async function getAmbiental() {
  try {
    const res = await fetch(`${APP_BASE_URL}/api/gdelt?source=firms&days=1&bbox=${encodeURIComponent(VE_BBOX)}`, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return { ok: false, count: 0, significant: false };
    const json = await res.json();
    if (json?.needsKey || !json?.csv) return { ok: false, count: 0, significant: false };
    const lines = json.csv.trim().split("\n");
    const count = Math.max(0, lines.length - 1); // menos la cabecera
    return { ok: true, count, significant: count >= FIRMS_SIGNIFICANT_THRESHOLD };
  } catch {
    return { ok: false, count: 0, significant: false };
  }
}

module.exports = { getConectividad, getConflictividad, getSismos, getAmbiental };
