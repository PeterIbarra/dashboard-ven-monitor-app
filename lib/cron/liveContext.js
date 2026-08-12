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

// Estados con racionamiento eléctrico declarado (Tier 1 — mayor prioridad analítica)
const T1_STATES = [
  { code: "4486", name: "Táchira" },
  { code: "4485", name: "Mérida" },
  { code: "4487", name: "Trujillo" },
  { code: "4505", name: "Sucre" },
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
async function getConectividad() {
  const now = Math.floor(Date.now() / 1000);
  const from = now - 24 * 3600;

  const [natEvents, ...stateSummaries] = await Promise.all([
    iodaFetch("outages/events", { entityType: "country", entityCode: "VE", from, until: now }),
    ...T1_STATES.map(st => iodaFetch("outages/summary", { entityType: "region", entityCode: st.code, from, until: now })),
  ]);

  const nationalEvents = Array.isArray(natEvents?.data) ? natEvents.data : [];
  const worstNational = nationalEvents.reduce((max, ev) => (ev.score > (max?.score || 0) ? ev : max), null);

  const stateScores = T1_STATES.map((st, i) => {
    const summary = stateSummaries[i]?.data?.[0];
    return { name: st.name, score: summary?.scores?.overall ?? null, eventCnt: summary?.event_cnt ?? 0 };
  }).filter(s => s.score != null && s.score > 0).sort((a, b) => b.score - a.score);

  return {
    ok: nationalEvents.length >= 0,
    nationalEventCount: nationalEvents.length,
    worstNationalScore: worstNational ? Math.round(worstNational.score) : null,
    topStates: stateScores.slice(0, 3),
  };
}

// ── Conflictividad / protestas (ACLED, vía endpoint propio ya desplegado) ──
async function getConflictividad() {
  try {
    const year = new Date().getFullYear();
    const res = await fetch(`${APP_BASE_URL}/api/acled?type=events&year=${year}&limit=200`, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return { ok: false, count: null, events: [] };
    const json = await res.json();
    const rows = Array.isArray(json?.data) ? json.data : [];
    const cutoff = Date.now() - 7 * 86400000;
    const recent = rows.filter(r => r.event_date && new Date(r.event_date).getTime() >= cutoff);
    recent.sort((a, b) => (b.fatalities || 0) - (a.fatalities || 0));
    return {
      ok: true,
      count: recent.length,
      events: recent.slice(0, 3).map(r => ({
        date: r.event_date, type: r.sub_event_type || r.event_type,
        location: r.location || r.admin1, fatalities: r.fatalities || 0,
        actor1: r.actor1,
      })),
    };
  } catch {
    return { ok: false, count: null, events: [] };
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

module.exports = { getConectividad, getConflictividad, getSismos };
