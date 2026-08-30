// ═══════════════════════════════════════════════════════════════
// COMPOSITE INSTABILITY INDEX — single source of truth
//
// Extracted from TabDashboard.jsx so the exact same 25-input formula
// can be computed from two places without drifting apart:
//   1. TabDashboard.jsx — displays the live "Índice de Inestabilidad" card.
//   2. App.jsx — writes the current value back to Supabase (daily_readings)
//      so the Daily Brief email can ground its risk level in the real
//      dashboard number instead of an independent AI guess.
//
// Only computes the CURRENT week's live index (raw factors + 0-100
// score). Previous-week delta and the historical sparkline stay in
// TabDashboard.jsx — they're presentation concerns that reuse the
// `factors` this function returns, not part of the shared formula.
// ═══════════════════════════════════════════════════════════════

import { CONF_SEMANAL } from "../data/weekly.js";
import { INDICATORS, SCENARIO_SIGNALS } from "../data/indicators.js";
import { CONF_MESES } from "../data/static.js";
import { AMNISTIA_TRACKER } from "../data/amnistia.js";
import { REDES_TOTALS } from "../data/redes.js";
import { OPINION_SNAPSHOT, RODRIGUEZ_TREND } from "../data/opinionPublica.js";
import { MACRO_LATEST } from "../data/macroLatest.js";
import { WEEKLY_INSTITUTIONAL } from "../data/weeklyInstitutional.js";

// Same zone thresholds used everywhere the index is displayed or
// classified (TabDashboard's colored bar, the Daily Brief risk level).
export const INSTABILITY_ZONES = [
  { max: 25, key: "BAJO", label: "Estabilidad relativa", color: "#16a34a" },
  { max: 50, key: "MEDIO", label: "Tensión moderada", color: "#ca8a04" },
  { max: 75, key: "ALTO", label: "Inestabilidad alta", color: "#f97316" },
  { max: 100, key: "CRÍTICO", label: "Crisis inminente", color: "#dc2626" },
];

export function instabilityZoneFor(index) {
  return INSTABILITY_ZONES.find(z => index <= z.max) || INSTABILITY_ZONES[INSTABILITY_ZONES.length - 1];
}

// `wk` — a WEEKS[] entry (needs .probs, .tensiones). `liveData` — the same
// live-data bag both TabDashboard and App.jsx already carry (dolar, oil,
// bilateral, cohesion, ioda.{avgHealth, electric}).
export function computeInstabilityIndex(wk, liveData) {
  const e1 = wk.probs.find(p=>p.sc===1)?.v || 0;
  const e2 = wk.probs.find(p=>p.sc===2)?.v || 0;
  const e3 = wk.probs.find(p=>p.sc===3)?.v || 0;
  const e4 = wk.probs.find(p=>p.sc===4)?.v || 0;

  // Indicators
  const latestInds = INDICATORS.map(ind => ind.hist.filter(h=>h!==null).pop()).filter(Boolean);
  const redCount = latestInds.filter(h=>h[0]==="red").length;
  const totalInds = latestInds.length || 1;

  // Tensions
  const tensRed = wk.tensiones.filter(t=>t.l==="red").length;
  const totalTens = wk.tensiones.length || 1;

  // Signals E4+E2 active
  const sigE4E2 = SCENARIO_SIGNALS.filter(g=>g.esc==="E4"||g.esc==="E2").flatMap(g=>g.signals);
  const sigActive = sigE4E2.filter(s=>s.sem==="red"||s.sem==="yellow").length;
  const sigTotal = sigE4E2.length || 1;

  // Live: brecha cambiaria (from liveData, fallback to 50)
  const brechaLive = liveData?.dolar?.brecha ? parseFloat(liveData.dolar.brecha) : 50;

  // Live: Brent pressure (below $65 = pressure, above $75 = stability)
  const brentPrice = liveData?.oil?.brent || 75;
  const brentFactor = brentPrice < 55 ? 100 : brentPrice < 65 ? 70 : brentPrice < 75 ? 30 : brentPrice < 85 ? 10 : 0;

  // Protests: weekly SITREP data (CONF_SEMANAL) — more current than monthly OVCS
  const lastWeekConf = CONF_SEMANAL[CONF_SEMANAL.length - 1];
  const maxWeekProtests = Math.max(...CONF_SEMANAL.map(w => w.protestas), 1);
  const protestPct = lastWeekConf ? (lastWeekConf.protestas / maxWeekProtests) * 100 : 50;
  // Territorial spread: 23/24 estados = almost national = high instability signal
  const spreadPct = lastWeekConf ? (lastWeekConf.estados / 24) * 100 : 30;
  const repressionPct = lastWeekConf?.reprimidas > 0 ? Math.min(lastWeekConf.reprimidas * 25, 100) : 0;
  // Monthly trend: sum last 4 weeks of CONF_SEMANAL, compare to 2025 monthly average
  const last4Weeks = CONF_SEMANAL.slice(-4);
  const monthlyTotal = last4Weeks.reduce((s, w) => s + w.protestas, 0);
  const avg2025Monthly = CONF_MESES.reduce((s, m) => s + m.t, 0) / CONF_MESES.length; // ~185
  const monthlyTrendPct = avg2025Monthly > 0 ? Math.min((monthlyTotal / avg2025Monthly) * 100, 150) : 50; // >100 = escalating vs 2025

  // Amnesty: verification gap + political prisoners
  const amnLatest = AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 1];
  const gobLib = amnLatest?.gob?.libertades || amnLatest?.gob?.excarcelados || 1;
  const fpVerif = amnLatest?.fp?.verificados || 0;
  const recentBatch = amnLatest?.recentBatch;
  const amnBrechaPct = recentBatch?.official
    ? Math.max(0, (1 - recentBatch.foroPenal / recentBatch.official) * 100)
    : Math.max(0, (1 - fpVerif / gobLib) * 100);
  const presosPct = amnLatest?.fp?.detenidos ? Math.min((amnLatest.fp.detenidos / 1000) * 100, 100) : 50;

  // Bilateral Threat Index (PizzINT/GDELT) — LIVE
  const bilV = liveData?.bilateral?.latest?.v || 0;
  const bilPct = Math.min(bilV / 4 * 100, 100); // 0-4σ mapped to 0-100%

  // Government Cohesion Index (ICG) — LIVE (inverted: low cohesion = high instability)
  const icgRaw = liveData?.cohesion?.index ?? null;
  const icgInverted = icgRaw != null ? Math.max(0, 100 - icgRaw) : null; // 100-ICG: 0=full cohesion, 100=no cohesion

  // Social Climate: Polarización & Convivencia from Redes X
  const polAltaPct = parseFloat(REDES_TOTALS.polAltoPct) || 50; // % polarización alta (0-100)
  const convAltaPct = parseFloat(REDES_TOTALS.convAltoPct) || 10; // % convivencia alta (0-100)
  const convInverted = Math.max(0, 100 - (convAltaPct * 5)); // Inverted + amplified: 8% conv alta → 60 risk, 0% → 100 risk

  // Internet connectivity health (IODA) — LIVE (inverted: low health = high instability)
  const iodaHealth = liveData?.ioda?.avgHealth;
  const iodaInverted = iodaHealth != null ? Math.max(0, 100 - iodaHealth) : null;

  // Electric-outage severity (IODA tier-aware rationing model) — LIVE (inverted)
  // Distinct from "Conectividad IODA" above: this uses the CORPOELEC rationing-prior
  // classifier (src/lib/iodaElectric.js) that separates real power outages from
  // ordinary internet/BGP congestion, normalized against each state's known
  // rationing schedule so chronic scheduled blackouts don't saturate the signal.
  const elecHealth = liveData?.ioda?.electric?.avgElecHealth;
  const elecInverted = elecHealth != null ? Math.max(0, 100 - elecHealth) : null;

  // Electric-outage breadth — a SEPARATE signal from severity above: how many
  // states currently have a confirmed electric-event cluster (direct IODA
  // evidence, not just inferred rationing), regardless of how deep any single
  // state's drop is. A localized-but-severe outage and a shallow-but-national
  // one read very differently, so this gets its own weighted factor instead of
  // being folded into (and diluted by) the national average health above.
  const elecStatesList = liveData?.ioda?.electric?.states;
  const hasDirectElecEvidence = s => (s.powerEvents || []).some(ev => ev.isElectric);
  const elecDetected = Array.isArray(elecStatesList) ? elecStatesList.filter(hasDirectElecEvidence) : null;
  const elecDetectedCount = elecDetected?.length ?? null;
  const elecTotalStates = Array.isArray(elecStatesList) ? elecStatesList.length : null;
  const elecDetectedPct = elecDetectedCount != null && elecTotalStates > 0 ? (elecDetectedCount / elecTotalStates) * 100 : null;
  const elecDetectedNames = elecDetected?.map(s => s.name).join(", ") || "";

  // Public disapproval of government management ("mal camino" — DatinCorp, corte semanal)
  const desaprobacionCard = OPINION_SNAPSHOT?.cards?.find(c => /mal camino/i.test(c.label));
  const desaprobacionPct = desaprobacionCard?.value
    ?? (RODRIGUEZ_TREND?.length ? Math.max(0, 100 - RODRIGUEZ_TREND[RODRIGUEZ_TREND.length - 1].approval) : 50);

  // Inflation pressure: latest monthly BCV inflation (% → 0-100 risk, saturates at 20%)
  const inflacionRaw = MACRO_LATEST?.find(m => m.k === "Inflación mensual")?.v || "";
  const inflacionPct = parseFloat(String(inflacionRaw).replace(",", ".")) || 0;
  const inflacionFactor = Math.min(inflacionPct * 5, 100);

  // Institutional/regulatory volatility: nº de cambios normativos relevantes en la semana
  const institucionalCount = WEEKLY_INSTITUTIONAL?.items?.length || 0;
  const institucionalFactor = Math.min((institucionalCount / 6) * 100, 100); // 6+ cambios/semana = saturado

  // ── FORMULA (25 inputs, weights sum to ~100 with stabilizers) ──
  const raw = (redCount/totalInds)*8              // Ind. rojos: 8% (was 9)
    + (e2/100)*6                                    // E2 Colapso: 6% (was 7)
    + (e4/100)*5                                    // E4 Resistencia: 5% (was 6)
    + (Math.min(brechaLive,100)/100)*8              // Brecha cambiaria: 8% (was 9)
    + (tensRed/totalTens)*4                          // Tensiones rojas: 4% (was 5)
    + (sigActive/sigTotal)*4                         // Señales E4+E2: 4% (was 5)
    + (brentFactor/100)*3                            // Brent presión: 3% (was 4)
    + (bilPct/100)*2                                 // Bilateral Threat: 2% (was 3)
    + ((icgInverted != null ? icgInverted : 50)/100)*2  // Cohesión GOB (inv): 2% (was 3)
    + (protestPct/100)*4                             // Protestas semanal: 4% (was 5)
    + (spreadPct/100)*3                              // Cobertura territorial: 3% (was 4)
    + (Math.min(monthlyTrendPct,150)/150)*1          // Tendencia mensual: 1% (was 2)
    + (repressionPct/100)*1                          // Represión: 1% (was 2)
    + (amnBrechaPct/100)*1                            // Brecha amnistía: 1% (was 2)
    + (presosPct/100)*2                              // Presos políticos: 2%
    + (polAltaPct/100)*4                             // Polarización alta redes: 4% (was 5)
    + (convInverted/100)*2                           // Convivencia baja redes (inv): 2% (was 3)
    + ((iodaInverted != null ? iodaInverted : 15)/100)*5  // Conectividad IODA (inv): 5%
    + (desaprobacionPct/100)*5                       // Desaprobación de gestión: 5%
    + (inflacionFactor/100)*6                        // Presión inflacionaria: 6%
    + (institucionalFactor/100)*4                    // Volatilidad institucional: 4%
    + ((elecInverted != null ? elecInverted : 10)/100)*4  // Cortes eléctricos (severidad promedio, IODA racionamiento): 4% (was 6)
    + ((elecDetectedPct != null ? elecDetectedPct : 8)/100)*2  // Estados con evento eléctrico detectado (alcance): 2% (NEW)
    - (e1/100)*5                                     // E1 Transición: -5% (estabilizador, was -6)
    - (e3/100)*2;                                    // E3 Continuidad: -2% (estabilizador, was -3)
  const index = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    index,
    zone: instabilityZoneFor(index),
    factors: {
      e1, e2, e3, e4, redCount, totalInds, tensRed, totalTens, sigActive, sigTotal,
      brechaLive, brentFactor, lastWeekConf, protestPct, spreadPct, repressionPct,
      avg2025Monthly, monthlyTotal, monthlyTrendPct, amnLatest, amnBrechaPct, presosPct,
      bilV, bilPct, icgRaw, icgInverted, polAltaPct, convAltaPct, convInverted,
      iodaHealth, iodaInverted, elecHealth, elecInverted,
      elecDetectedCount, elecTotalStates, elecDetectedPct, elecDetectedNames,
      desaprobacionPct, inflacionPct, inflacionFactor, institucionalCount, institucionalFactor,
    },
  };
}
