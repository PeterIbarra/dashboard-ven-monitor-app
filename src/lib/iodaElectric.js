// ═══════════════════════════════════════════════════════════════
// IODA Electric — shared Phase-1 electricity/rationing classifier
// ═══════════════════════════════════════════════════════════════
// Extracted from TabIODA.jsx so the SAME tier-aware, rationing-calibrated
// logic that powers the "Monitor de Conectividad y Energía" tab can also
// feed the background Composite Instability Index loader (App.jsx).
//
// This module intentionally contains ONLY Phase 1 (alert-based
// classification using outages/summary + outages/alerts, tier-normalized
// against CORPOELEC's known rationing schedule). Phase 2 (background
// enrichment against raw signals/raw per-state, used only to *increase*
// confidence in the IODA tab) is NOT replicated here — it is expensive
// (24 additional raw-signal fetches) and Phase 1 alone is what the tab
// already shows on first load, so it's the right cost/accuracy tradeoff
// for a background composite-index signal that must stay cheap.
//
// TabIODA.jsx imports VE_REGIONS / RATIONING_PRIOR / getPrior / iodaFetch
// / computeRegionElectric from here instead of defining its own copies,
// so both call sites can never drift out of calibration with each other.

import { IS_DEPLOYED, CORS_PROXIES } from "../utils";

const IODA_BASE = "https://api.ioda.inetintel.cc.gatech.edu/v2";

// ── IODA Venezuelan state codes (confirmed from API) ──
export const VE_REGIONS = [
  { code:"4482", name:"Falcón" }, { code:"4483", name:"Apure" }, { code:"4484", name:"Barinas" },
  { code:"4485", name:"Mérida" }, { code:"4486", name:"Táchira" }, { code:"4487", name:"Trujillo" },
  { code:"4488", name:"Zulia" }, { code:"4489", name:"Cojedes" }, { code:"4490", name:"Carabobo" },
  { code:"4491", name:"Lara" }, { code:"4492", name:"Portuguesa" }, { code:"4493", name:"Yaracuy" },
  { code:"4494", name:"Amazonas" }, { code:"4495", name:"Bolívar" }, { code:"4496", name:"Anzoátegui" },
  { code:"4497", name:"Aragua" }, { code:"4498", name:"Vargas" }, { code:"4499", name:"Distrito Capital" },
  { code:"4501", name:"Guárico" }, { code:"4502", name:"Monagas" }, { code:"4503", name:"Miranda" },
  { code:"4504", name:"Nueva Esparta" }, { code:"4505", name:"Sucre" }, { code:"4506", name:"Delta Amacuro" },
];

// ── Rationing prior: known CORPOELEC rationing schedule per state ──
// Update manually when new data is published (e.g. La Patilla / VeSinFiltro maps).
// tier: 1=severe(≥8h), 2=moderate(4-8h), 3=light(≤4h), 0=none
// thresholdMult: multiplier applied to detection thresholds (lower = more sensitive)
// confidenceBase: starting confidence level when an event is detected
// hoursPerDay: daily rationing hours (midpoint of range when variable)
// blockDurationSec: typical block duration in seconds (used for intra-day accumulation)
export const RATIONING_PRIOR = {
  // ── Tier 1: severe ≥8h/day ──
  "Táchira":          { tier:1, hoursPerDay:12,  thresholdMult:0.60, confidenceBase:"alta",  blockDurationSec:9000  },
  "Mérida":           { tier:1, hoursPerDay:8,   thresholdMult:0.62, confidenceBase:"alta",  blockDurationSec:9000  },
  "Trujillo":         { tier:1, hoursPerDay:9,   thresholdMult:0.65, confidenceBase:"alta",  blockDurationSec:10800 },
  "Sucre":            { tier:1, hoursPerDay:8,   thresholdMult:0.62, confidenceBase:"alta",  blockDurationSec:9000  },
  // ── Tier 2: moderate 4-8h/day ──
  "Miranda":          { tier:2, hoursPerDay:8,   thresholdMult:0.78, confidenceBase:"media", blockDurationSec:7200  },
  "Carabobo":         { tier:2, hoursPerDay:7,   thresholdMult:0.80, confidenceBase:"media", blockDurationSec:7200  },
  "Aragua":           { tier:2, hoursPerDay:7,   thresholdMult:0.80, confidenceBase:"media", blockDurationSec:7200  },
  "Guárico":          { tier:2, hoursPerDay:7,   thresholdMult:0.80, confidenceBase:"media", blockDurationSec:7200  },
  "Cojedes":          { tier:2, hoursPerDay:6.5, thresholdMult:0.80, confidenceBase:"media", blockDurationSec:7200  },
  "Nueva Esparta":    { tier:2, hoursPerDay:7,   thresholdMult:0.80, confidenceBase:"media", blockDurationSec:7200  },
  "Zulia":            { tier:2, hoursPerDay:6.5, thresholdMult:0.80, confidenceBase:"media", blockDurationSec:7200  },
  "Yaracuy":          { tier:2, hoursPerDay:6,   thresholdMult:0.80, confidenceBase:"media", blockDurationSec:7200  },
  "Lara":             { tier:2, hoursPerDay:5,   thresholdMult:0.82, confidenceBase:"media", blockDurationSec:5400  },
  "Portuguesa":       { tier:2, hoursPerDay:5,   thresholdMult:0.82, confidenceBase:"media", blockDurationSec:5400  },
  "Falcón":           { tier:2, hoursPerDay:5,   thresholdMult:0.82, confidenceBase:"media", blockDurationSec:5400  },
  "Barinas":          { tier:2, hoursPerDay:5.5, thresholdMult:0.82, confidenceBase:"media", blockDurationSec:5400  },
  // ── Tier 3: light ≤5h/day ──
  "Apure":            { tier:3, hoursPerDay:5.5, thresholdMult:0.88, confidenceBase:"baja",  blockDurationSec:5400  },
  "Amazonas":         { tier:3, hoursPerDay:4,   thresholdMult:0.88, confidenceBase:"baja",  blockDurationSec:3600  },
  "Anzoátegui":       { tier:3, hoursPerDay:4.5, thresholdMult:0.88, confidenceBase:"baja",  blockDurationSec:3600  },
  "Monagas":          { tier:3, hoursPerDay:4.5, thresholdMult:0.88, confidenceBase:"baja",  blockDurationSec:3600  },
  "Vargas":           { tier:3, hoursPerDay:4,   thresholdMult:0.88, confidenceBase:"baja",  blockDurationSec:3600  },
  // ── Tier 0: no rationing declared ──
  "Distrito Capital": { tier:0, hoursPerDay:0,   thresholdMult:1.0,  confidenceBase:"baja",  blockDurationSec:0     },
  "Bolívar":          { tier:0, hoursPerDay:0,   thresholdMult:1.0,  confidenceBase:"baja",  blockDurationSec:0     },
  "Delta Amacuro":    { tier:0, hoursPerDay:0,   thresholdMult:1.0,  confidenceBase:"baja",  blockDurationSec:0     },
};
// Helper: get prior for a state, defaulting to Tier 3 if not in list
export const getPrior = (name) => RATIONING_PRIOR[name] || { tier:3, hoursPerDay:4, thresholdMult:0.88, confidenceBase:"baja", blockDurationSec:3600 };

// ── Helper: fetch with cascade (Vercel proxy → CORS proxies) ──
export async function iodaFetch(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const directUrl = `${IODA_BASE}/${path}${qs ? "?" + qs : ""}`;
  const vercelUrl = `/api/ioda?path=${encodeURIComponent(path)}&${qs}`;
  const urls = IS_DEPLOYED
    ? [() => vercelUrl, ...CORS_PROXIES.map(fn => () => fn(directUrl))]
    : CORS_PROXIES.map(fn => () => fn(directUrl));
  // Try each URL, with one retry on failure
  for (let attempt = 0; attempt < 2; attempt++) {
    for (const getUrl of urls) {
      try {
        const res = await fetch(getUrl(), { signal: AbortSignal.timeout(15000), headers: { Accept: "application/json" } });
        if (!res.ok) continue;
        const json = await res.json();
        if (json?.error || !json?.data) continue; // proxy returned error JSON
        return json;
      } catch { continue; }
    }
    if (attempt === 0) await new Promise(r => setTimeout(r, 2000)); // wait 2s before retry
  }
  return null;
}

// ── Phase 1: per-state electricity/connectivity classification ──
// Same algorithm as TabIODA.jsx's loadRegions (C1 BGP-veto, C2 cluster
// admission, C3 abrupt-drop detection, tier-normalized thresholds) plus
// the national/regional cross-state post-processing pass.
//
// `iodaConfirmsState(stateName, t1, t2)` is the optional C4 independent
// confirmation check (cross-referencing outages/events). TabIODA.jsx can
// pass its real events-based check for full parity with the tab's UI;
// callers that don't have an events cache loaded (e.g. the background
// composite-index fetch) can omit it — it defaults to "never confirmed",
// which only makes classification slightly more conservative (single-alert
// warning-only clusters are dropped, and confidence isn't boosted via C4).
export async function computeRegionElectric({ twFrom, twUntil, iodaConfirmsState = () => false }) {
  const results = await Promise.allSettled(
    VE_REGIONS.map(async (st) => {
      const [summaryJson, alertsJson] = await Promise.all([
        iodaFetch(`outages/summary`, { entityType: "region", entityCode: st.code, from: twFrom, until: twUntil }),
        iodaFetch(`outages/alerts`, { entityType: "region", entityCode: st.code, from: twFrom, until: twUntil }),
      ]);

      // Parse summary
      const summary = summaryJson?.data?.[0] || {};
      const overallScore = summary.scores?.overall ?? 0;
      const pingScore = summary.scores?.["ping-slash24.median"] ?? 0;
      const bgpScore = summary.scores?.["bgp.median"] ?? 0;
      const eventCnt = summary.event_cnt ?? 0;

      // Parse alerts
      const alerts = Array.isArray(alertsJson?.data) ? alertsJson.data : [];
      const pingAlerts = alerts.filter(a => a.datasource === "ping-slash24");
      const bgpAlerts = alerts.filter(a => a.datasource === "bgp");

      // ── Connectivity: IODA current/recent alerts only ──
      const lastPingAlert  = pingAlerts[pingAlerts.length - 1];
      const lastBgpAlert   = bgpAlerts[bgpAlerts.length - 1];
      const isRecentAlert = (a) => !a?.time || twUntil - a.time <= 2 * 3600;
      const worstRecentPingAlert = pingAlerts
        .filter(a => a.level === "critical" && a.historyValue > 0)
        .filter(isRecentAlert)
        .sort((a, b) => (a.value / a.historyValue) - (b.value / b.historyValue))[0];
      let pingHealth = 100, bgpHealth = 100;
      let connectivityHealth = 100;
      if (worstRecentPingAlert && worstRecentPingAlert.historyValue > 0) {
        pingHealth = Math.min(100, Math.round((worstRecentPingAlert.value / worstRecentPingAlert.historyValue) * 100));
        connectivityHealth = pingHealth;
      } else if (lastPingAlert?.historyValue > 0 && isRecentAlert(lastPingAlert)) {
        pingHealth = Math.min(100, Math.round((lastPingAlert.value / lastPingAlert.historyValue) * 100));
        connectivityHealth = pingHealth;
      }
      if (lastBgpAlert?.historyValue > 0 && isRecentAlert(lastBgpAlert)) {
        bgpHealth = Math.min(100, Math.round((lastBgpAlert.value / lastBgpAlert.historyValue) * 100));
      }
      connectivityHealth = Math.min(connectivityHealth, bgpHealth);

      // ── Electricity detection ── C1+C2+C3+C4 + RATIONING PRIOR ──
      const prior = getPrior(st.name);
      const pm = prior.thresholdMult;

      const pingCritical = pingAlerts.filter(a => a.level === "critical").sort((a,b) => a.time - b.time);
      const pingWarning  = pingAlerts.filter(a => a.level === "warning").sort((a,b) => a.time - b.time);
      const bgpCritical  = bgpAlerts.filter(a => a.level === "critical");

      const bgpVetoThreshold = 0.35 * pm;
      const isBgpVeto = (t1, t2) => bgpCritical.some(b => {
        if (b.time < t1 - 1800 || b.time > t2 + 1800) return false;
        if (!b.historyValue || b.historyValue === 0) return false;
        return (b.historyValue - b.value) / b.historyValue > bgpVetoThreshold;
      });

      const buildClusters = (list, isCritical) => {
        const out = []; let cur = null;
        for (const a of list) {
          if (!cur || (a.time - cur.lastTime) > 3600) {
            cur = { alerts:[a], firstTime:a.time, lastTime:a.time, isCritical };
            out.push(cur);
          } else { cur.alerts.push(a); cur.lastTime = a.time; }
        }
        return out;
      };

      const processCluster = (cluster) => {
        const drops = cluster.alerts.map(a =>
          a.historyValue > 0 ? Math.round(((a.historyValue - a.value) / a.historyValue) * 100) : 0
        );
        const maxDrop   = Math.max(...drops);
        const firstDrop = drops[0];
        const durationSec = Math.max(600, cluster.lastTime - cluster.firstTime);
        const isAbrupt    = firstDrop >= maxDrop * 0.50;
        const bgpAlsoDown = isBgpVeto(cluster.firstTime, cluster.lastTime);
        const iodaConfirmed = iodaConfirmsState(st.name, cluster.firstTime, cluster.lastTime);
        const isSingleSevere = cluster.alerts.length === 1 && maxDrop > 25;
        if (!cluster.isCritical && cluster.alerts.length < 2 && !iodaConfirmed) return null;
        const peakAlert = cluster.alerts[drops.indexOf(maxDrop)];
        return {
          ts: cluster.firstTime, tsEnd: cluster.lastTime, durationSec,
          dropPct: maxDrop, firstDrop, isAbrupt, isSingleSevere, iodaConfirmed,
          isWarningOnly: !cluster.isCritical, alertCount: cluster.alerts.length,
          value: peakAlert.value, historyValue: peakAlert.historyValue,
          bgpAlsoDown, isElectric: !bgpAlsoDown,
        };
      };

      const powerEvents = [];
      const bgpStable = bgpCritical.length === 0;

      for (const c of buildClusters(pingCritical, true)) {
        const ev = processCluster(c); if (ev) powerEvents.push(ev);
      }
      for (const c of buildClusters(pingWarning, false)) {
        const ev = processCluster(c); if (!ev) continue;
        if (!powerEvents.some(e => Math.abs(e.ts - ev.ts) < 1800)) powerEvents.push(ev);
      }
      powerEvents.sort((a,b) => a.ts - b.ts);

      const electricEvents = powerEvents.filter(e => e.isElectric);
      const elecScore = electricEvents.reduce((acc, e) =>
        acc + e.dropPct * Math.max(1, Math.round(e.durationSec / 600)), 0);

      let elecHealth = 100, elecLabel = "Normal", elecConfidence = null;
      if (electricEvents.length > 0) {
        const worstDrop   = Math.max(...electricEvents.map(e => e.dropPct));
        const warnOnly    = electricEvents.every(e => e.isWarningOnly);
        const hasAbrupt   = electricEvents.some(e => e.isAbrupt && e.dropPct >= 15);
        const hasIodaConf = electricEvents.some(e => e.iodaConfirmed);

        {
          const evCount = warnOnly ? electricEvents.length * 0.6 : electricEvents.length;
          const nDrop   = worstDrop / pm;
          const nEvents = Math.max(0, evCount - 1) / pm;
          const tierMin = prior.tier === 0 ? 70 : prior.tier <= 1 ? 45 : prior.tier === 2 ? 50 : 60;
          elecHealth = Math.max(tierMin, Math.round(100 - nDrop * 0.75 - nEvents * 1.5));
        }
        if (hasAbrupt   && worstDrop >= 45 && elecHealth > 40) elecHealth = Math.max(40, elecHealth - 6);
        if (hasIodaConf && worstDrop >= 35 && elecHealth > 40) elecHealth = Math.max(40, elecHealth - 4);

        elecConfidence = prior.tier === 0 ? "baja" : prior.confidenceBase;
        if (hasIodaConf && elecConfidence === "baja" && prior.tier > 0) elecConfidence = "media";

        const expectedDailyScore = prior.hoursPerDay > 0
          ? Math.round(prior.hoursPerDay * 6 * 15)
          : 9999;
        if (prior.tier === 1 && elecScore >= expectedDailyScore * 0.75) {
          elecConfidence = "alta";
          if (elecHealth > 55) elecHealth = Math.min(elecHealth, 55);
        } else if (prior.tier <= 2 && elecScore >= expectedDailyScore * 0.9) {
          if (elecConfidence === "baja") elecConfidence = "media";
          else if (elecConfidence === "media") elecConfidence = "alta";
        }

        if (prior.tier === 0) {
          if (elecHealth <= 30) elecLabel = "Degradación severa de red (sin racionamiento declarado)";
          else if (elecHealth <= 50) elecLabel = "Degradación moderada de red";
          else if (elecHealth <= 70) elecLabel = "Degradación leve de red";
          else elecLabel = "Fluctuación de red";
        } else {
          if (elecHealth <= 30) elecLabel = "Posible interrupción eléctrica severa";
          else if (elecHealth <= 50) elecLabel = "Posible interrupción eléctrica moderada";
          else if (elecHealth <= 70) elecLabel = warnOnly
            ? "Posible interrupción eléctrica leve (señal débil)"
            : "Posible interrupción eléctrica leve";
          else elecLabel = "Fluctuación";
        }
      } else if (powerEvents.length > 0 && !bgpStable) {
        elecHealth = 100;
        elecLabel = "Normal (corte infra.)";
      }

      // ── Inferred electric from connectivity degradation (T1/T2 states only) ──
      if (elecHealth === 100 && prior.tier <= 2 && prior.hoursPerDay > 0) {
        const connDegradation = 100 - connectivityHealth;
        const inferThreshold = prior.tier === 1 ? 45 : 55;

        if (connDegradation > inferThreshold && bgpStable) {
          if (prior.tier === 1) {
            if      (connDegradation > 70) { elecHealth = 55; elecConfidence = "baja"; }
            else if (connDegradation > 55) { elecHealth = 65; elecConfidence = "baja"; }
            else                           { elecHealth = 75; elecConfidence = "baja"; }
          } else { // T2
            if      (connDegradation > 70) { elecHealth = 60; elecConfidence = "baja";  }
            else                           { elecHealth = 75; elecConfidence = "baja";  }
          }
          elecLabel = `Posible racionamiento eléctrico · ~${prior.hoursPerDay}h/día declaradas`;
        }
      }

      return {
        ...st,
        // Scores from IODA
        dropScore: overallScore,
        pingScore, bgpScore, eventCnt,
        // Health
        connectivityHealth,
        healthPct: connectivityHealth,
        pingHealth, bgpHealth,
        // Electricity
        elecHealth, elecLabel, elecConfidence,
        elecEvents: electricEvents.length,
        elecScore,
        powerEvents,
        bgpStable,
        // Raw alert data for detail panel
        alerts,
        // Compatibility fields
        displayScore: overallScore,
        current: lastPingAlert?.value ?? 0,
        baseAvg: lastPingAlert?.historyValue ?? 0,
        perSource: {
          probing: lastPingAlert ? { health: pingHealth, current: lastPingAlert.value, baseline: lastPingAlert.historyValue } : null,
          bgp: lastBgpAlert ? { health: bgpHealth, current: lastBgpAlert.value, baseline: lastBgpAlert.historyValue } : { health: 100, current: 0, baseline: 0 },
          telescope: null, loss: null, latency: null,
        },
      };
    })
  );

  const scores = results
    .filter(r => r.status === "fulfilled" && r.value)
    .map(r => r.value);

  // ── Post-processing: classify national vs regional events ──
  const allEventTimes = [];
  scores.forEach(s => {
    if (s.powerEvents) s.powerEvents.forEach(ev => allEventTimes.push(ev.ts));
  });

  const processedTimes = new Set();
  const nationalEvents = [];
  for (const t of allEventTimes) {
    let alreadyClustered = false;
    for (const pt of processedTimes) { if (Math.abs(t - pt) < 1800) { alreadyClustered = true; break; } }
    if (alreadyClustered) continue;

    const affectedStates = scores.filter(s => s.powerEvents?.some(ev => Math.abs(ev.ts - t) < 1800));
    if (affectedStates.length > scores.length * 0.25) {
      const drops = affectedStates.map(s => {
        const ev = s.powerEvents.find(ev => Math.abs(ev.ts - t) < 1800);
        return ev?.dropPct || 0;
      });
      const avgDrop = drops.reduce((a,b) => a+b, 0) / drops.length;
      const severity = avgDrop > 50 ? "blackout_severe" : avgDrop > 30 ? "blackout_moderate" : "network_mild";
      nationalEvents.push({ ts: t, statesAffected: affectedStates.length, avgDrop: Math.round(avgDrop), severity });
      processedTimes.add(t);
    }
  }

  if (nationalEvents.length > 0) {
    scores.forEach(s => {
      if (!s.powerEvents || s.powerEvents.length === 0) return;
      let hasRegional = false, worstRegDrop = 0, worstNatSev = null;
      s.powerEvents.forEach(ev => {
        const matched = nationalEvents.find(ne => Math.abs(ev.ts - ne.ts) < 1800);
        ev.isNational = !!matched;
        ev.nationalSeverity = matched?.severity || null;
        ev.nationalAvgDrop = matched?.avgDrop || 0;
        if (matched) {
          if (!worstNatSev || matched.severity === "blackout_severe" || (matched.severity === "blackout_moderate" && worstNatSev !== "blackout_severe"))
            worstNatSev = matched.severity;
        } else { hasRegional = true; if (ev.dropPct > worstRegDrop) worstRegDrop = ev.dropPct; }
      });
      const neighborCount = scores.filter(other => other !== s && other.powerEvents?.some(oev =>
        s.powerEvents.some(sev => Math.abs(oev.ts - sev.ts) < 1800)
      )).length;
      const prior = getPrior(s.name);
      let confidence = "baja";
      if (prior.tier === 0) {
        confidence = "baja";
      } else if (worstNatSev) {
        confidence = "alta";
      } else if (neighborCount >= 2) {
        confidence = "alta";
      } else if (neighborCount >= 1) {
        confidence = "media";
      }
      const hasAbruptStrong = s.powerEvents.some(ev => ev.isAbrupt && ev.dropPct >= 15 && !ev.bgpAlsoDown);
      const hasIodaConf     = s.powerEvents.some(ev => ev.iodaConfirmed && !ev.bgpAlsoDown);
      if (prior.tier > 0 && (hasAbruptStrong || hasIodaConf) && confidence === "baja") confidence = "media";
      s.elecConfidence = confidence;
      if (hasRegional) {
        const postElec = worstRegDrop > 35 ? 20 : worstRegDrop > 20 ? 40 : worstRegDrop > 10 ? 60 : 80;
        const postElecAdjusted = prior.tier === 1 && postElec > 20 && postElec <= 60
          ? Math.max(20, postElec - 15)
          : prior.tier === 2 && postElec > 40 && postElec <= 60
          ? Math.max(30, postElec - 10)
          : postElec;
        if (postElecAdjusted < s.elecHealth) {
          s.elecHealth = postElecAdjusted;
          const sevWord = s.elecHealth <= 30 ? "severa" : s.elecHealth <= 50 ? "moderada" : s.elecHealth <= 70 ? "leve" : "";
          s.elecLabel = confidence === "alta" ? `Interrupción eléctrica regional ${sevWord}`.trim()
            : confidence === "media" ? `Posible interrupción eléctrica regional ${sevWord}`.trim()
            : `Posible interrupción eléctrica ${sevWord} (verificar)`.trim();
        }
      } else if (worstNatSev === "blackout_severe") { s.elecHealth = Math.min(s.elecHealth, 15); s.elecLabel = "Interrupción eléctrica nacional severa"; }
      else if (worstNatSev === "blackout_moderate") { s.elecHealth = Math.min(s.elecHealth, 40); s.elecLabel = "Interrupción eléctrica nacional moderada"; }
      s.elecEvents = s.powerEvents.filter(ev => ev.isElectric).length;
    });
  }

  scores.sort((a,b) => b.dropScore - a.dropScore || a.healthPct - b.healthPct);
  return scores;
}

// ── National aggregate helper ──
// Reduces the 24-state score array to a single national electricity-severity
// summary suitable for feeding the Composite Instability Index as one factor.
// avgElecHealth is weighted by confidence (alta=1, media=0.6, baja=0.3) so
// low-confidence "posible" reads don't dominate the national number as much
// as confirmed ones — while still contributing something.
export function summarizeNationalElectric(scores) {
  if (!Array.isArray(scores) || scores.length === 0) return null;
  const confW = { alta: 1, media: 0.6, baja: 0.3 };
  let wSum = 0, wTotal = 0;
  let affectedCount = 0;
  let worst = null;
  for (const s of scores) {
    const w = s.elecHealth < 100 ? (confW[s.elecConfidence] ?? 0.3) : 1;
    wSum += s.elecHealth * w;
    wTotal += w;
    if (s.elecHealth < 100) affectedCount++;
    if (!worst || s.elecHealth < worst.elecHealth) worst = s;
  }
  const avgElecHealth = wTotal > 0 ? wSum / wTotal : 100;
  return {
    avgElecHealth: Math.round(avgElecHealth),
    affectedCount,
    worstState: worst?.name ?? null,
    worstElecHealth: worst?.elecHealth ?? 100,
    worstElecLabel: worst?.elecLabel ?? "Normal",
    worstElecConfidence: worst?.elecConfidence ?? null,
    states: scores,
  };
}
