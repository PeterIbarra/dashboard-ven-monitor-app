import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { BORDER, TEXT, MUTED, ACCENT, font, fontSans } from "../../constants";
import { IS_DEPLOYED, CORS_PROXIES } from "../../utils";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Badge } from "../Badge";
import { Card } from "../Card";
import { TwitterTimeline } from "../TwitterTimeline";
import { loadScript, loadCSS } from "../../utils";
import * as XLSX from "xlsx";

// ── IODA Venezuelan state codes (confirmed from API) ──
const VE_REGIONS = [
  { code:"4482", name:"Falcón" }, { code:"4483", name:"Apure" }, { code:"4484", name:"Barinas" },
  { code:"4485", name:"Mérida" }, { code:"4486", name:"Táchira" }, { code:"4487", name:"Trujillo" },
  { code:"4488", name:"Zulia" }, { code:"4489", name:"Cojedes" }, { code:"4490", name:"Carabobo" },
  { code:"4491", name:"Lara" }, { code:"4492", name:"Portuguesa" }, { code:"4493", name:"Yaracuy" },
  { code:"4494", name:"Amazonas" }, { code:"4495", name:"Bolívar" }, { code:"4496", name:"Anzoátegui" },
  { code:"4497", name:"Aragua" }, { code:"4498", name:"Vargas" }, { code:"4499", name:"Distrito Capital" },
  { code:"4501", name:"Guárico" }, { code:"4502", name:"Monagas" }, { code:"4503", name:"Miranda" },
  { code:"4504", name:"Nueva Esparta" }, { code:"4505", name:"Sucre" }, { code:"4506", name:"Delta Amacuro" },
];

const IODA_BASE = "https://api.ioda.inetintel.cc.gatech.edu/v2";
const hoursMap = { "24h":24, "48h":48, "7d":168, "30d":720 };

// ── Rationing prior: known CORPOELEC rationing schedule per state ──
// Update manually when new data is published (e.g. La Patilla / VeSinFiltro maps).
// tier: 1=severe(≥8h), 2=moderate(4-8h), 3=light(≤4h), 0=none
// thresholdMult: multiplier applied to detection thresholds (lower = more sensitive)
// confidenceBase: starting confidence level when an event is detected
// hoursPerDay: daily rationing hours (midpoint of range when variable)
// blockDurationSec: typical block duration in seconds (used for intra-day accumulation)
const RATIONING_PRIOR = {
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
const getPrior = (name) => RATIONING_PRIOR[name] || { tier:3, hoursPerDay:4, thresholdMult:0.88, confidenceBase:"baja", blockDurationSec:3600 };

// ── Helper: fetch with cascade (Vercel proxy → CORS proxies) ──
async function iodaFetch(path, params = {}) {
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

// ── Parse IODA signals into normalized array ──
function parseSignals(json) {
  const raw = Array.isArray(json?.data) ? json.data.flat() : [];
  if (!raw.length) return null;
  const bgp = raw.find(s => s.datasource === "bgp");
  const probing = raw.find(s => s.datasource === "ping-slash24");
  const telescope = raw.find(s => s.datasource === "ucsd-nt") || raw.find(s => s.datasource === "merit-nt");
  const loss = raw.find(s => s.datasource === "ping-slash24-loss");
  const latency = raw.find(s => s.datasource === "ping-slash24-latency");
  const anchor = [bgp, probing, telescope].filter(Boolean).sort((a,b) => b.values.length - a.values.length)[0];
  if (!anchor) return null;
  const valAt = (sig, ts) => {
    if (!sig) return null;
    const idx = Math.round((ts - sig.from) / sig.step);
    return (idx >= 0 && idx < sig.values.length) ? sig.values[idx] : null;
  };
  // Extract scalar from nested loss/latency objects: values[i] = [{agg_values:{loss_pct:X}}]
  const objValAt = (sig, ts, field) => {
    if (!sig) return null;
    const idx = Math.round((ts - sig.from) / sig.step);
    if (idx < 0 || idx >= sig.values.length) return null;
    const entry = sig.values[idx];
    const obj = Array.isArray(entry) ? entry[0] : entry;
    const v = obj?.agg_values?.[field];
    return typeof v === "number" ? v : null;
  };
  return anchor.values.map((_, i) => {
    const ts = anchor.from + i * anchor.step;
    return {
      ts,
      bgp: valAt(bgp, ts),
      probing: valAt(probing, ts),
      telescope: valAt(telescope, ts),
      lossPct: objValAt(loss, ts, "loss_pct"),
      medianLatency: objValAt(latency, ts, "median_latency"),
    };
  });
}

// ── Format helpers ──
const fmtVal = v => v == null ? "—" : v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(1)}K` : v.toFixed(0);
const fmtTime = epoch => new Date(epoch * 1000).toLocaleString("es-VE", { timeZone:"America/Caracas", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", hour12:false });
const fmtDuration = secs => { if (!secs || isNaN(secs) || secs <= 0) return "—"; if (secs < 3600) return `${Math.round(secs/60)}m`; const h = Math.floor(secs/3600), m = Math.round((secs%3600)/60); return m > 0 ? `${h}h ${m}m` : `${h}h`; };

// ── Interpret connectivity pattern from per-source data ──
function interpretPattern(perSource, telescopeMultiplier) {
  if (!perSource) return { emoji: "❓", text: "Sin datos suficientes para interpretar." };
  const prob = perSource.probing?.health ?? null;
  const bgp = perSource.bgp?.health ?? null;
  const loss = perSource.loss?.health ?? null;
  const lat = perSource.latency?.health ?? null;
  const tele = perSource.telescope?.health ?? null;
  const natTeleAnomaly = (telescopeMultiplier || 1) > 1;
  
  const vals = [prob, bgp, loss, lat].filter(v => v !== null);
  if (vals.length === 0) return { emoji: "❓", text: "Sin datos suficientes." };
  const worst = Math.min(...vals);
  
  if (worst >= 90) return { emoji: "✅", text: "Conectividad normal — sin anomalías detectadas en ningún indicador." };
  
  const probDown = prob !== null && prob < 80;
  const bgpDown = bgp !== null && bgp < 80;
  const lossHigh = loss !== null && loss < 70;
  const latHigh = lat !== null && lat < 70;
  
  // Probing down + national telescope anomaly → likely power outage
  if (probDown && natTeleAnomaly && !bgpDown) {
    return { emoji: "⚡", text: "Dispositivos inaccesibles con anomalía en telescopio nacional — patrón consistente con corte eléctrico regional. Las rutas BGP se mantienen (routers con UPS) pero los equipos finales no responden." };
  }
  // Probing down + BGP down → major disconnection
  if (probDown && bgpDown) {
    return { emoji: "🔴", text: "Desconexión generalizada — sondeo y rutas BGP afectados simultáneamente. Consistente con corte gubernamental deliberado o falla mayor de infraestructura troncal (CANTV)." };
  }
  // Only probing down, no telescope anomaly → congestion or ICMP block
  if (probDown && !natTeleAnomaly && !bgpDown) {
    return { emoji: "📡", text: "Caída en sondeo activo — los dispositivos no responden pero las rutas se mantienen y no hay anomalía en telescopio nacional. Posible congestión severa, mantenimiento de red, o bloqueo de ICMP." };
  }
  // High loss but probing count OK → network degradation
  if (lossHigh && !probDown) {
    return { emoji: "📉", text: `Packet loss elevado (${perSource.loss?.current || "?"}%) — los hosts responden pero con pérdida significativa de paquetes. Indica congestión de red, infraestructura degradada, o sobrecarga de CANTV regional.` };
  }
  // High latency → congestion
  if (latHigh && !probDown && !lossHigh) {
    return { emoji: "⏱", text: `Latencia elevada (${perSource.latency?.current || "?"}ms vs ${perSource.latency?.baseline || "?"}ms base) — los hosts responden pero con retrasos significativos. Indica saturación de ancho de banda o problemas de enrutamiento.` };
  }
  // Loss + latency both bad
  if (lossHigh && latHigh) {
    return { emoji: "🟠", text: "Degradación severa — packet loss alto y latencia elevada simultáneamente. La red está bajo estrés significativo. Posible saturación de infraestructura, corte parcial, o interferencia." };
  }
  // BGP down alone
  if (bgpDown && !probDown) {
    return { emoji: "🌐", text: "Pérdida de rutas upstream — el proveedor dejó de anunciar prefijos pero dispositivos locales funcionan. Posible problema con proveedor internacional o reconfiguración de red." };
  }
  
  // Mild degradation
  if (worst >= 70) return { emoji: "🟡", text: "Degradación leve — uno o más indicadores muestran reducción moderada. Puede ser congestión temporal, mantenimiento de red, o fluctuación normal." };
  return { emoji: "🟠", text: "Degradación significativa — múltiples indicadores afectados. Monitorear evolución para determinar si es transitorio o escalará." };
}

// ── Compute region scores: two indices per state ──
// INDEX 1 — Connectivity: probing health + loss + latency (internet quality)
// INDEX 2 — Electricity: abrupt probing drops + national telescope coincidence + BGP stable
function computeRegionScore(parsed, nationalTelescopeData, calibratedBaseline = null, prior = null) {
  if (!parsed || parsed.length === 0) return null;
  const pm = prior?.thresholdMult ?? 1.0; // threshold multiplier from rationing prior
  
  // ── Probing base metrics (shared by both indices) ──
  const probVals = parsed.map(p => p.probing).filter(v => v !== null);
  if (probVals.length < 5) return null;
  
  const probSorted = [...probVals].sort((a,b) => a - b);
  const probP95 = probSorted[Math.floor(probSorted.length * 0.95)];
  if (probP95 < 10) return null;
  
  const probTail = probVals.slice(-Math.min(36, probVals.length));
  const probWorst = Math.min(...probTail);
  const probHealth = Math.min(100, Math.round((probWorst / probP95) * 100));
  const probRecent = probVals.slice(-5);
  const probCurrent = probRecent.reduce((a,b) => a+b, 0) / probRecent.length;
  const probLiveDrop = Math.max(0, Math.round(probP95 - probCurrent));
  
  // Probing score
  const probThreshold = probP95 * 0.90;
  let probDropScore = 0;
  for (const v of probVals) {
    if (v < probThreshold) probDropScore += Math.round(probP95 - v);
  }
  
  // ══════ INDEX 1: CONNECTIVITY ══════
  const lossVals = parsed.map(p => p.lossPct).filter(v => v !== null);
  const latVals = parsed.map(p => p.medianLatency).filter(v => v !== null);
  
  let lossHealth = 100, lossPenalty = 0, lossInfo = null;
  let latHealth = 100, latPenalty = 0, latInfo = null;
  
  if (lossVals.length >= 5) {
    const lossTail = lossVals.slice(-Math.min(36, lossVals.length));
    const lossAvg6h = lossTail.reduce((a,b) => a+b, 0) / lossTail.length;
    lossHealth = lossAvg6h > 50 ? 30 : lossAvg6h > 35 ? 50 : lossAvg6h > 20 ? 70 : lossAvg6h > 10 ? 85 : 100;
    for (const v of lossVals) {
      if (v > 10) lossPenalty += Math.round((v - 10) * 2);
    }
    lossInfo = { health: lossHealth, current: Math.round(lossAvg6h * 10) / 10, baseline: 10 };
  }
  
  if (latVals.length >= 5) {
    const latSorted = [...latVals].sort((a,b) => a - b);
    const latP10 = latSorted[Math.floor(latSorted.length * 0.1)];
    const latTail = latVals.slice(-Math.min(36, latVals.length));
    const latWorst = Math.max(...latTail);
    const latRatio = latP10 > 0 ? latWorst / latP10 : 1;
    latHealth = latRatio > 3 ? 40 : latRatio > 2 ? 60 : latRatio > 1.5 ? 80 : 100;
    const latThresh = latP10 * 1.5;
    for (const v of latVals) {
      if (v > latThresh) latPenalty += Math.round((v - latP10) / 20);
    }
    latInfo = { health: latHealth, current: Math.round(latVals[latVals.length-1]), baseline: Math.round(latP10) };
  }
  
  const connectivityHealth = Math.min(probHealth, lossHealth, latHealth);
  const connectivityScore = probDropScore + lossPenalty + latPenalty;
  
  // ══════ INDEX 2: ELECTRICITY ══════
  // Detect probing drops vs P95 baseline (not moving average — avoids smoothing away events)
  // Threshold: >15% below P95 for 2+ consecutive points = potential power outage
  const step = parsed.length > 1 ? (parsed[parsed.length-1].ts - parsed[0].ts) / (parsed.length - 1) : 600;
  const elecThreshold = probP95 * 0.85; // 15% below baseline
  const elecRecovery = probP95 * 0.92; // recovered when back to within 8% of baseline
  
  let powerEvents = [];
  let inDrop = false, dropStart = null, dropMinVal = Infinity, consecutiveBelow = 0;
  
  for (let i = 0; i < probVals.length; i++) {
    const v = probVals[i];
    const dropPct = probP95 > 0 ? ((probP95 - v) / probP95) * 100 : 0;
    
    if (v < elecThreshold) {
      consecutiveBelow++;
      if (!inDrop && consecutiveBelow >= 2) {
        // Confirmed drop start (2+ consecutive points below threshold)
        inDrop = true;
        dropStart = i - 1; // include the first point that crossed
        dropMinVal = Math.min(v, probVals[i - 1] || v);
      } else if (inDrop) {
        if (v < dropMinVal) dropMinVal = v;
      }
    } else {
      consecutiveBelow = 0;
      if (inDrop && v >= elecRecovery) {
        // Event ended — recovered
        const durationPts = i - dropStart;
        const maxDropPct = probP95 > 0 ? Math.round(((probP95 - dropMinVal) / probP95) * 100) : 0;
        if (maxDropPct >= 15 && durationPts >= 2) {
          powerEvents.push({
            ts: parsed[dropStart]?.ts || 0,
            dropPct: maxDropPct,
            durationSec: Math.round(durationPts * step),
            recovered: true,
          });
        }
        inDrop = false; dropMinVal = Infinity;
      }
    }
  }
  // Still in drop at end of data
  if (inDrop) {
    const maxDropPct = probP95 > 0 ? Math.round(((probP95 - dropMinVal) / probP95) * 100) : 0;
    if (maxDropPct >= 15) {
      powerEvents.push({
        ts: parsed[dropStart]?.ts || 0,
        dropPct: maxDropPct,
        durationSec: Math.round((probVals.length - dropStart) * step),
        recovered: false,
      });
    }
  }
  
  // BGP stability check — if BGP also dropped, it's more likely censorship than power
  const bgpVals = parsed.map(p => p.bgp).filter(v => v !== null);
  let bgpInfo = null, bgpStable = true;
  if (bgpVals.length >= 5) {
    const bgpSorted = [...bgpVals].sort((a,b) => a - b);
    const bgpP95 = bgpSorted[Math.floor(bgpSorted.length * 0.95)];
    if (bgpP95 >= 10) {
      const bgpCurrent = bgpVals[bgpVals.length - 1];
      const bgpHealth = Math.min(100, Math.round((bgpCurrent / bgpP95) * 100));
      bgpInfo = { health: bgpHealth, current: Math.round(bgpCurrent), baseline: Math.round(bgpP95) };
      const bgpMin = Math.min(...bgpVals);
      bgpStable = (bgpMin / bgpP95) > 0.90; // BGP varied <10% = stable
    }
  }
  
  // National telescope coincidence
  let teleCoincidence = false;
  if (nationalTelescopeData && nationalTelescopeData.length > 0 && powerEvents.length > 0) {
    const ntVals = nationalTelescopeData.filter(v => v !== null);
    if (ntVals.length > 10) {
      const ntSorted = [...ntVals].sort((a,b) => a - b);
      const ntP95 = ntSorted[Math.floor(ntSorted.length * 0.95)];
      if (ntP95 > 5) {
        const ntStep = ntVals.length > 1 ? Math.round((parsed[parsed.length-1].ts - parsed[0].ts) / ntVals.length) : 600;
        for (const ev of powerEvents) {
          for (let i = 0; i < ntVals.length; i++) {
            if (ntVals[i] < ntP95 * 0.80) {
              const approxTs = parsed[0].ts + i * ntStep;
              if (Math.abs(ev.ts - approxTs) < 1800) { teleCoincidence = true; break; }
            }
          }
          if (teleCoincidence) break;
        }
      }
    }
  }
  
  // Telescope regional info
  const teleVals = parsed.map(p => p.telescope).filter(v => v !== null);
  let teleInfo = null;
  if (teleVals.length >= 5) {
    const teleSorted = [...teleVals].sort((a,b) => a - b);
    const teleP95 = teleSorted[Math.floor(teleSorted.length * 0.95)];
    if (teleP95 >= 0.2) {
      const teleTail = teleVals.slice(-Math.min(12, teleVals.length));
      const teleWorst = Math.min(...teleTail);
      const teleHealth = Math.min(100, Math.round((teleWorst / teleP95) * 100));
      const teleCurrent = teleVals[teleVals.length - 1];
      teleInfo = { health: teleHealth, current: Math.round(teleCurrent * 10) / 10, baseline: Math.round(teleP95 * 10) / 10 };
    }
  }
  
  // Electricity index: severity based on number of events, depth, and pattern
  // Per-event BGP check: only count events where BGP was stable during that specific drop
  let elecHealth = 100, elecLabel = "Normal", elecConfidence = null;
  const bgpValsForCheck = parsed.map(p => p.bgp).filter(v => v !== null);
  const bgpP95ForCheck = bgpValsForCheck.length >= 5 ? [...bgpValsForCheck].sort((a,b) => a - b)[Math.floor(bgpValsForCheck.length * 0.95)] : null;
  
  const confirmedPowerEvents = powerEvents.filter(ev => {
    // Per-event: check BGP stability during this specific event window
    if (!bgpP95ForCheck || bgpP95ForCheck < 10) return bgpStable; // fallback to global
    const evStartIdx = Math.max(0, Math.round((ev.ts - (parsed[0]?.ts || 0)) / step));
    const evEndIdx = Math.min(bgpValsForCheck.length - 1, evStartIdx + Math.max(2, Math.round((ev.durationSec || 600) / step)));
    const bgpDuringEvent = bgpValsForCheck.slice(evStartIdx, evEndIdx + 1);
    if (bgpDuringEvent.length === 0) return bgpStable;
    const bgpMinDuring = Math.min(...bgpDuringEvent);
    return (bgpMinDuring / bgpP95ForCheck) > 0.85; // BGP stable during THIS event
  });
  
  if (confirmedPowerEvents.length > 0) {
    const worstDrop = Math.max(...confirmedPowerEvents.map(e => e.dropPct));
    const hasTelescopeConfirm = teleCoincidence;
    // Scale severity thresholds by rationing prior
    const tSevere   = prior?.tier === 0 ? 50 : Math.round(35 * pm);
    const tModerate = prior?.tier === 0 ? 35 : Math.round(20 * pm);
    const tLeve     = prior?.tier === 0 ? 20 : Math.round(10 * pm);
    if (worstDrop > tSevere) elecHealth = 20;
    else if (worstDrop > tModerate) elecHealth = 40;
    else if (worstDrop > tLeve)     elecHealth = 60;
    else elecHealth = 80;
    if (hasTelescopeConfirm && elecHealth > 15) elecHealth = Math.max(15, elecHealth - 20);
    elecConfidence = prior?.tier === 0 ? "baja"
      : prior?.tier <= 1 ? "alta"
      : prior?.tier === 2 ? "media"
      : hasTelescopeConfirm ? "media" : "baja";

    // T0: label as network degradation, not electric
    if (prior?.tier === 0) {
      elecLabel = elecHealth <= 30 ? "Degradación severa de red"
        : elecHealth <= 50 ? "Degradación moderada de red"
        : "Degradación leve de red";
    } else {
      // Label with confidence
      if (elecHealth <= 30) elecLabel = elecConfidence === "baja" ? "Posible interrupción eléctrica severa (verificar)" : "Posible interrupción eléctrica severa";
      else if (elecHealth <= 50) elecLabel = "Posible interrupción eléctrica moderada";
      else if (elecHealth <= 70) elecLabel = "Posible interrupción eléctrica leve";
      else elecLabel = "Fluctuación";
    }
  }
  
  const elecScore = confirmedPowerEvents.reduce((a, e) => a + e.dropPct * Math.max(1, Math.round(e.durationSec / 600)), 0);
  
  // perSource for detail panel
  const perSource = {
    probing: { health: probHealth, current: Math.round(probCurrent), baseline: Math.round(probP95) },
    bgp: bgpInfo,
    telescope: teleInfo,
    loss: lossInfo,
    latency: latInfo,
  };
  
  return {
    // Combined (backwards compatible)
    healthPct: connectivityHealth,
    dropScore: connectivityScore,
    liveDrop: probLiveDrop,
    current: Math.round(probCurrent),
    baseAvg: Math.round(probP95),
    perSource,
    // Connectivity index
    connectivityHealth,
    connectivityScore,
    // Electricity index
    elecHealth,
    elecScore,
    elecLabel,
    elecConfidence,
    elecEvents: confirmedPowerEvents.length,
    teleCoincidence,
    bgpStable,
    powerEvents: confirmedPowerEvents,
  };
}

// ── Interactive multi-line chart with zoom/pan ──
function InteractiveChart({ states, timePreset, selectedState, onSelectState, palette, events, focusEvent, onClearFocus }) {
  const containerRef = useRef(null);
  const [zoomRange, setZoomRange] = useState(null); // {start, end} as fraction 0-1
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [chartHover, setChartHover] = useState(null); // { x, ts, values: [{name, pct, color}] }
  
  // Auto-zoom to focusEvent
  useEffect(() => {
    if (!focusEvent || !states.length) return;
    const anchor = states[0]?.series;
    if (!anchor?.length) return;
    const tMin = anchor[0].ts, tMax = anchor[anchor.length - 1].ts;
    const fullRange = tMax - tMin || 1;
    // Center on event with 2h window
    const center = (focusEvent - tMin) / fullRange;
    const span = Math.min(0.15, 7200 / fullRange); // ~2h window or 15% of range
    const start = Math.max(0, center - span / 2);
    const end = Math.min(1, start + span);
    setZoomRange({ start, end });
    if (onClearFocus) setTimeout(onClearFocus, 100);
  }, [focusEvent]);
  
  // Build chart data
  const chartData = states.map(st => {
    const vals = st.series.map(p => p.probing ?? p.bgp).filter(v => v !== null);
    // Baseline = P95 (95th percentile) — the normal plateau
    const sorted = [...vals].sort((a,b) => a - b);
    const baseAvg = sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1] || 1;
    return {
      name: st.name, health: st.healthPct,
      pctSeries: st.series.map(p => {
        const v = p.probing ?? p.bgp;
        return { ts: p.ts, pct: v !== null ? Math.min(100, Math.round((v / baseAvg) * 100)) : null };
      }),
    };
  });
  
  const W = 900, H = 250, pL = 42, pR = 80, pT = 10, pB = 30;
  const cW = W - pL - pR, cH = H - pT - pB;
  
  // Time range
  const anchor = chartData[0]?.pctSeries || [];
  const tMin = anchor[0]?.ts || 0, tMax = anchor[anchor.length - 1]?.ts || 1;
  const fullRange = tMax - tMin || 1;
  
  // Apply zoom
  const viewStart = zoomRange ? tMin + zoomRange.start * fullRange : tMin;
  const viewEnd = zoomRange ? tMin + zoomRange.end * fullRange : tMax;
  const viewRange = viewEnd - viewStart || 1;
  
  const toX = ts => pL + ((ts - viewStart) / viewRange) * cW;
  const toY = pct => pT + cH - (pct / 100) * cH;
  
  // Zoom with +/- buttons
  const zoomIn = () => {
    const currentSpan = zoomRange ? zoomRange.end - zoomRange.start : 1;
    const center = zoomRange ? (zoomRange.start + zoomRange.end) / 2 : 0.5;
    let newSpan = Math.max(0.05, currentSpan * 0.6);
    let newStart = center - newSpan / 2;
    let newEnd = newStart + newSpan;
    if (newStart < 0) { newEnd -= newStart; newStart = 0; }
    if (newEnd > 1) { newStart -= (newEnd - 1); newEnd = 1; }
    setZoomRange({ start: Math.max(0, newStart), end: Math.min(1, newEnd) });
  };
  const zoomOut = () => {
    if (!zoomRange) return;
    const currentSpan = zoomRange.end - zoomRange.start;
    const center = (zoomRange.start + zoomRange.end) / 2;
    let newSpan = Math.min(1, currentSpan * 1.5);
    if (newSpan >= 0.95) { setZoomRange(null); return; }
    let newStart = center - newSpan / 2;
    let newEnd = newStart + newSpan;
    if (newStart < 0) { newEnd -= newStart; newStart = 0; }
    if (newEnd > 1) { newStart -= (newEnd - 1); newEnd = 1; }
    setZoomRange({ start: Math.max(0, newStart), end: Math.min(1, newEnd) });
  };
  
  return (
    <div>
      <div ref={containerRef} style={{ cursor: "crosshair", touchAction: "none", position: "relative" }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mx = (e.clientX - rect.left) / rect.width * W;
            const ts = viewStart + ((mx - pL) / cW) * viewRange;
            if (ts < viewStart || ts > viewEnd) { setChartHover(null); return; }
            const values = chartData.map((st, si) => {
              const closest = st.pctSeries.reduce((best, p) => {
                if (p.pct === null) return best;
                const dist = Math.abs(p.ts - ts);
                return (!best || dist < best.dist) ? { pct: p.pct, dist } : best;
              }, null);
              return closest ? { name: st.name, pct: closest.pct, color: palette[si % palette.length] } : null;
            }).filter(Boolean);
            values.sort((a,b) => b.pct - a.pct);
            setChartHover({ x: mx, ts, values, clientX: e.clientX - rect.left, clientY: e.clientY - rect.top });
          }}
          onMouseLeave={() => setChartHover(null)}>
          {/* Hover crosshair */}
          {chartHover && <line x1={chartHover.x} y1={pT} x2={chartHover.x} y2={pT+cH} stroke="rgba(0,0,0,0.12)" strokeDasharray="2,2" />}
          {/* Grid */}
          {[0, 20, 40, 60, 80, 100].map(pct => (
            <g key={pct}>
              <line x1={pL} y1={toY(pct)} x2={pL+cW} y2={toY(pct)} 
                stroke={pct === 80 ? "rgba(220,38,38,0.2)" : "rgba(0,0,0,0.04)"} 
                strokeDasharray={pct === 80 ? "4,3" : "none"} />
              <text x={pL-4} y={toY(pct)+3} textAnchor="end" fontSize={8} fill={MUTED} fontFamily={font}>{pct}%</text>
            </g>
          ))}
          {/* Danger zone */}
          <rect x={pL} y={toY(80)} width={cW} height={toY(0) - toY(80)} fill="rgba(220,38,38,0.03)" />
          {/* X-axis labels */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map(f => {
            const ts = viewStart + f * viewRange;
            return <text key={f} x={toX(ts)} y={H-6} textAnchor="middle" fontSize={7} fill={`${MUTED}90`} fontFamily={font}>
              {fmtTime(ts)}
            </text>;
          })}
          {/* State lines */}
          {chartData.map((st, si) => {
            const color = palette[si % palette.length];
            const isSelected = selectedState === st.name;
            const opacity = selectedState ? (isSelected ? 1 : 0.15) : 0.8;
            let d = "";
            st.pctSeries.forEach(p => {
              if (p.pct === null || p.ts < viewStart || p.ts > viewEnd) return;
              const x = toX(p.ts), y = toY(p.pct);
              d += d === "" ? `M${x},${y}` : ` L${x},${y}`;
            });
            if (!d) return null;
            return <path key={st.name} d={d} fill="none" stroke={color} 
              strokeWidth={isSelected ? 2.5 : 1.5} opacity={opacity} />;
          })}
          {/* Event markers — red triangles at event timestamps */}
          {events && events.filter(ev => ev.time >= viewStart && ev.time <= viewEnd).map((ev, ei) => {
            const x = toX(ev.time);
            const sevColor = ev.condition === "critical" ? "#ef4444" : ev.condition === "high" ? "#f97316" : "#fbbf24";
            return (
              <g key={`ev-${ei}`}>
                <line x1={x} y1={pT} x2={x} y2={pT+cH} stroke={sevColor} strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
                <polygon points={`${x-5},${pT+cH+2} ${x+5},${pT+cH+2} ${x},${pT+cH-6}`} fill={sevColor} opacity={0.8} />
                <text x={x} y={pT+cH+12} textAnchor="middle" fontSize={6} fill={sevColor} fontFamily={font}>
                  {ev.region === "🇻🇪 Nacional" ? "NAC" : (ev.region || "").slice(0,4)}
                </text>
              </g>
            );
          })}
          {/* End labels with collision avoidance */}
          {(() => {
            // Collect label positions first
            const labels = [];
            chartData.forEach((st, si) => {
              const color = palette[si % palette.length];
              const isSelected = selectedState === st.name;
              if (selectedState && !isSelected) return;
              const visible = st.pctSeries.filter(p => p.pct !== null && p.ts >= viewStart && p.ts <= viewEnd);
              const lastPt = visible[visible.length - 1];
              if (!lastPt) return;
              labels.push({ name: st.name, pct: lastPt.pct, ts: lastPt.ts, color, si });
            });
            // Sort by Y position (top to bottom) and apply offset to avoid overlap
            labels.sort((a, b) => toY(a.pct) - toY(b.pct));
            const minGap = 10; // minimum px between label centers
            const positioned = [];
            labels.forEach(lb => {
              let y = toY(lb.pct);
              // Push down if too close to previous label
              for (const prev of positioned) {
                if (Math.abs(y - prev.y) < minGap) {
                  y = prev.y + minGap;
                }
              }
              // Clamp within chart area
              y = Math.max(pT + 6, Math.min(pT + cH - 2, y));
              positioned.push({ ...lb, y });
            });
            return positioned.map(lb => {
              const cx = toX(lb.ts);
              const x = Math.min(cx + 4, pL + cW + 4);
              return (
                <g key={`lbl-${lb.name}`}>
                  <circle cx={cx} cy={toY(lb.pct)} r={3} fill={lb.color} />
                  {/* Connector line if label was offset */}
                  {Math.abs(lb.y - toY(lb.pct)) > 2 && (
                    <line x1={cx + 3} y1={toY(lb.pct)} x2={x} y2={lb.y} stroke={`${lb.color}40`} strokeWidth={0.5} />
                  )}
                  <text x={x} y={lb.y + 3} fontSize={8} fill={lb.color} fontWeight={700} fontFamily={font}>
                    {lb.name} {lb.pct}%
                  </text>
                </g>
              );
            });
          })()}
        </svg>
        {/* Hover tooltip */}
        {chartHover && chartHover.values.length > 0 && (
          <div style={{
            position:"absolute", left: Math.min(chartHover.clientX + 12, (containerRef.current?.offsetWidth || 600) - 160),
            top: Math.max(0, chartHover.clientY - 20), background:"rgba(0,0,0,0.88)", color:"#fff", padding:"6px 10px",
            borderRadius:4, fontSize:10, fontFamily:font, pointerEvents:"none", zIndex:10, minWidth:120, maxHeight:200, overflowY:"auto",
            boxShadow:"0 2px 8px rgba(0,0,0,0.3)"
          }}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>{fmtTime(chartHover.ts)}</div>
            {chartHover.values.map(v => (
              <div key={v.name} style={{ display:"flex", justifyContent:"space-between", gap:12, padding:"1px 0" }}>
                <span style={{ color:v.color, fontWeight:600 }}>{v.name}</span>
                <span style={{ fontWeight:700 }}>{v.pct}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Legend + zoom controls */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6, flexWrap:"wrap", gap:6 }}>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {chartData.map((st, si) => (
            <div key={st.name} onClick={() => onSelectState(st.name)}
              style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer",
                opacity: selectedState && selectedState !== st.name ? 0.3 : 1 }}>
              <span style={{ width:12, height:3, borderRadius:1, background:palette[si % palette.length] }} />
              <span style={{ fontSize:10, fontFamily:font, color: selectedState === st.name ? TEXT : MUTED,
                fontWeight: selectedState === st.name ? 700 : 400 }}>{st.name}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          <button onClick={zoomIn} style={{ fontSize:12, fontFamily:font, padding:"2px 8px", background:"transparent",
            border:`1px solid ${BORDER}`, color:MUTED, cursor:"pointer", borderRadius:3 }}>+</button>
          <button onClick={zoomOut} style={{ fontSize:12, fontFamily:font, padding:"2px 8px", background:"transparent",
            border:`1px solid ${BORDER}`, color:MUTED, cursor:"pointer", borderRadius:3, opacity:zoomRange?1:0.3 }}>−</button>
          {zoomRange && (
            <button onClick={() => setZoomRange(null)}
              style={{ fontSize:10, fontFamily:font, padding:"2px 8px", background:"transparent",
                border:`1px solid ${BORDER}`, color:MUTED, cursor:"pointer", borderRadius:3 }}>Reset</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Venezuela state centroids for Leaflet ──
const STATE_COORDS = {
  "Amazonas":[3.4,-66.0],"Anzoátegui":[8.6,-64.2],"Apure":[7.0,-69.5],"Aragua":[10.2,-67.6],
  "Barinas":[8.4,-70.2],"Bolívar":[6.5,-63.5],"Carabobo":[10.2,-68.0],"Cojedes":[9.4,-68.6],
  "Delta Amacuro":[8.8,-61.3],"Distrito Capital":[10.5,-66.9],"Falcón":[11.2,-69.9],"Guárico":[8.7,-66.5],
  "Lara":[10.1,-69.8],"Mérida":[8.4,-71.1],"Miranda":[10.2,-66.4],"Monagas":[9.3,-63.2],
  "Nueva Esparta":[11.0,-63.9],"Portuguesa":[9.1,-69.3],"Sucre":[10.4,-63.1],"Táchira":[7.8,-72.2],
  "Trujillo":[9.4,-70.5],"Vargas":[10.6,-67.0],"Yaracuy":[10.3,-68.7],"Zulia":[9.8,-71.6],
};

// ── Leaflet map for IODA regional outages ──
function IODALeafletMap({ regionScores, selectedState, onSelectState, timePreset }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markersRef = useRef(null);
  const geoLayerRef = useRef(null);

  // Load Leaflet + init map
  useEffect(() => {
    loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
    loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js").then(() => {
      if (!mapRef.current || mapInst.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true, attributionControl: false }).setView([7.5, -66.5], 6);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", { maxZoom: 12 }).addTo(map);
      L.control.attribution({ prefix: false }).addTo(map).addAttribution("© OSM · CARTO · IODA");
      mapInst.current = map;
      // Try to load GeoJSON for state boundaries
      fetch("https://raw.githubusercontent.com/deldersveld/topojson/master/countries/venezuela/venezuela-estados.json")
        .then(r => r.json())
        .then(topo => {
          // Convert TopoJSON to GeoJSON if needed
          if (topo.type === "Topology" && window.topojson) {
            const key = Object.keys(topo.objects)[0];
            const geo = window.topojson.feature(topo, topo.objects[key]);
            geoLayerRef.current = geo;
          }
        }).catch(() => {});
    });
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, []);

  // Update markers when regionScores change
  useEffect(() => {
    if (!mapInst.current || !window.L || !regionScores || regionScores.length === 0) return;
    const L = window.L;
    const map = mapInst.current;
    // Force map to recalculate size (fixes invisible dots after tab switch)
    setTimeout(() => map.invalidateSize(), 100);
    if (markersRef.current) { map.removeLayer(markersRef.current); }
    const group = L.layerGroup();
    const scores = regionScores.map(r => r.displayScore || r.dropScore || 0);
    const maxScore = Math.max(...scores, 1);

    regionScores.forEach(r => {
      const coords = STATE_COORDS[r.name];
      if (!coords) return;
      const severity = r.connectivityHealth ?? r.healthPct ?? 100;
      const elecSev = r.elecHealth ?? 100;
      // Color: connectivity drives the dot color (as before), electricity shown via border
      // Use min of both only when elecHealth is explicitly detected (not inferred from connectivity)
      // This prevents double-penalizing states where elecHealth mirrors connectivityHealth
      const isInferred = r.elecLabel?.includes("racionamiento eléctrico") && !r.elecEvents;
      const worstSev = isInferred ? severity : Math.min(severity, elecSev);
      const color = worstSev >= 90 ? "#34d399" : worstSev >= 70 ? "#fbbf24" : worstSev >= 50 ? "#f97316" : "#ef4444";
      const ds = r.displayScore || r.dropScore || 0;
      // Radius: IODA score as base, boosted by electric tier and event count
      const prior = getPrior(r.name);
      const elecBonus = elecSev < 100 && prior.tier >= 1 ? (
        (prior.tier === 1 ? 5 : prior.tier === 2 ? 3 : 1) +
        Math.min(4, (r.elecEvents || 0) * 1)
      ) : 0;
      const baseRadius = ds > 0
        ? Math.max(6, Math.min(20, (ds / maxScore) * 20))
        : (worstSev >= 90 ? 6 : worstSev >= 70 ? 8 : worstSev >= 50 ? 12 : 16);
      const radius = Math.min(24, baseRadius + elecBonus);
      const circle = L.circleMarker(coords, {
        radius, fillColor: color, color: selectedState === r.name ? "#fff" : color,
        weight: selectedState === r.name ? 3 : 1.5, opacity: 0.9, fillOpacity: 0.65,
      });
      circle.bindPopup(
        `<div style="font-family:monospace;font-size:11px;min-width:160px">` +
        `<b style="font-size:13px">${r.name}</b><br/>` +
        `Conectividad: <b style="color:${color}">${severity}%</b><br/>` +
        `Electricidad: <b>${elecSev}%</b> ${r.elecLabel || ""}<br/>` +
        `Score IODA: <b>${ds > 0 ? ds.toLocaleString() : "0"}</b>` +
        `</div>`, { className: "ioda-popup" }
      );
      circle.on("click", () => onSelectState(r.name));
      group.addLayer(circle);

      // Add label for non-normal states (connectivity OR electricity)
      if (worstSev < 90 || ds > maxScore * 0.05) {
        const label = L.divIcon({
          className: "ioda-label",
          html: `<div style="font:bold 10px monospace;color:${color};text-shadow:0 0 3px #fff,0 0 3px #fff;white-space:nowrap">${r.name}</div>`,
          iconSize: [80, 14], iconAnchor: [40, -radius - 2],
        });
        L.marker(coords, { icon: label, interactive: false }).addTo(group);
      }
    });
    group.addTo(map);
    markersRef.current = group;
  }, [regionScores, selectedState, timePreset]);

  return <div ref={mapRef} style={{ width:"100%", height: 350, borderRadius:4, border:`1px solid ${BORDER}` }} />;
}

export function TabIODA() {
  const mob = useIsMobile();
  const [signals, setSignals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("loading");
  const [error, setError] = useState(null);
  const [hover, setHover] = useState(null);
  const [events, setEvents] = useState([]);
  const [regionScores, setRegionScores] = useState([]);
  const regionScoresRef = useRef([]);
  const eventsRef = useRef([]);
  // Keep refs in sync
  regionScoresRef.current = regionScores;
  eventsRef.current = events;
  const [regionLoading, setRegionLoading] = useState(false);
  const [rawEnriching, setRawEnriching] = useState(false);
  const [rawProgress, setRawProgress] = useState({ current: 0, total: 0 });
  const [selectedState, setSelectedState] = useState(null);
  const [selectedStateData, setSelectedStateData] = useState(null); // signals/raw for selected state
  const [selectedStateLoading, setSelectedStateLoading] = useState(false);
  const [aiExplain, setAiExplain] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [subView, setSubView] = useState("estados"); // estados | eventos | nacional
  const [focusEvent, setFocusEvent] = useState(null);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [eventsBack, setEventsBack] = useState(0);
  const [eventsStateFilter, setEventsStateFilter] = useState(null);
  // ── Export modal ──
  const [exportOpen, setExportOpen] = useState(false);
  const [exportPreset, setExportPreset] = useState("7d");
  const [exportCustomFrom, setExportCustomFrom] = useState("");
  const [exportCustomUntil, setExportCustomUntil] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState(null);

  // ── Unified time window (stable — only recalculates on user action) ──
  const [timePreset, setTimePreset] = useState("24h"); // 24h | 48h | 7d | 30d | custom
  const [customFrom, setCustomFrom] = useState("");
  const [customUntil, setCustomUntil] = useState("");
  const [timeEpoch, setTimeEpoch] = useState(() => Math.floor(Date.now() / 1000)); // frozen "now"
  
  // Refreeze "now" when preset changes (not on every render)
  const changePreset = (p) => { setTimePreset(p); setTimeEpoch(Math.floor(Date.now() / 1000)); setRegionScores([]); setEventsBack(0); setEventsStateFilter(null); setRawProgress({ current:0, total:0 }); setRawEnriching(false); };
  
  // Compute actual from/until epoch — memoized to prevent re-renders
  const twFrom = useMemo(() => {
    if (timePreset === "custom" && customFrom) return Math.floor(new Date(customFrom).getTime() / 1000);
    const hours = { "24h": 24, "48h": 48, "7d": 168, "30d": 720 }[timePreset] || 24;
    return timeEpoch - hours * 3600;
  }, [timePreset, timeEpoch, customFrom]);
  
  const twUntil = useMemo(() => {
    if (timePreset === "custom" && customUntil) return Math.floor(new Date(customUntil).getTime() / 1000);
    return timeEpoch;
  }, [timePreset, timeEpoch, customUntil]);

  const timeLabel = timePreset === "custom"
    ? `${new Date(twFrom * 1000).toLocaleDateString("es-VE")} — ${new Date(twUntil * 1000).toLocaleDateString("es-VE")}`
    : timePreset;

  // ── 1. Load national signals ──
  const loadNational = useCallback(async () => {
    setLoading(true); setError(null); setSource("loading");
    const json = await iodaFetch(`signals/raw/country/VE`, { from: twFrom, until: twUntil });
    const parsed = json ? parseSignals(json) : null;
    if (parsed) { setSignals(parsed); setSource("live"); }
    else { setSignals(null); setSource("failed"); setError("No se pudo conectar con IODA API."); }
    setLoading(false);
  }, [twFrom, twUntil]);

  // ── 2. Detect outage events from national + regional signal analysis ──
  const loadEvents = useCallback(async (backOffset = 0) => {
    const allEvents = [];
    // Compute time window — may differ from main window when navigating back
    const periodLen = twUntil - twFrom;
    const evFrom  = twFrom  - backOffset * periodLen;
    const evUntil = twUntil - backOffset * periodLen;

    // National events
    try {
      const natJson = await iodaFetch(`outages/events`, { entityType: "country", entityCode: "VE", from: evFrom, until: evUntil });
      const natEvents = Array.isArray(natJson?.data) ? natJson.data : [];
      natEvents.forEach(ev => {
        const severity = ev.score > 5000 ? "critical" : ev.score > 1000 ? "high" : "medium";
        allEvents.push({
          time: ev.start, datasource: ev.datasource, condition: severity, region: "🇻🇪 Nacional",
          value: ev.score ? Math.round(ev.score) : 0, duration: ev.duration, score: ev.score,
          dropAbsolute: 0, baseline: 0,
        });
      });
    } catch {}
    
    // Regional events — fetch top affected states from loaded data, or key states
    const cachedRegions = regionScoresRef.current;
    const statesToQuery = cachedRegions.length > 0
      ? cachedRegions.filter(r => r.eventCnt > 0).slice(0, 12)
      : VE_REGIONS.filter(s => ["4486","4491","4488","4484","4487"].includes(s.code));
    
    const regionResults = await Promise.allSettled(
      statesToQuery.map(async (st) => {
        const json = await iodaFetch(`outages/events`, { entityType: "region", entityCode: st.code, from: evFrom, until: evUntil });
        const evts = Array.isArray(json?.data) ? json.data : [];
        return evts.map(ev => {
          const severity = ev.score > 3000 ? "critical" : ev.score > 500 ? "high" : "medium";
          return {
            time: ev.start, datasource: ev.datasource, condition: severity, region: st.name,
            value: ev.score ? Math.round(ev.score) : 0, duration: ev.duration, score: ev.score,
            dropAbsolute: 0, baseline: 0,
          };
        });
      })
    );
    regionResults.forEach(r => { if (r.status === "fulfilled" && r.value) allEvents.push(...r.value); });
    
    allEvents.sort((a,b) => b.time - a.time);
    setEvents(allEvents.slice(0, 80));
  }, [twFrom, twUntil]);

  // ── 3. Load regional data using IODA outage endpoints (lightweight) ──
  const loadRegions = useCallback(async () => {
    setRegionLoading(true);
    try {
    
    // Fetch summary + alerts for all states in parallel
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
        
        // ── Connectivity: use IODA's own score directly ──
        // IODA computes this with weeks of historical context — we trust it over our own recalculation.
        // Convert overallScore to a 0-100 health index using IODA's documented thresholds.
        // If IODA emitted a critical ping alert, that overrides the score-based estimate.
        const lastPingAlert  = pingAlerts[pingAlerts.length - 1];
        const lastBgpAlert   = bgpAlerts[bgpAlerts.length - 1];
        const worstPingAlert = pingAlerts
          .filter(a => a.level === "critical" && a.historyValue > 0)
          .sort((a, b) => (a.value / a.historyValue) - (b.value / b.historyValue))[0];
        let pingHealth = 100, bgpHealth = 100; // preserved for perSource panel
        let connectivityHealth;
        if (worstPingAlert && worstPingAlert.historyValue > 0) {
          pingHealth = Math.min(100, Math.round((worstPingAlert.value / worstPingAlert.historyValue) * 100));
          connectivityHealth = pingHealth;
        } else if (lastPingAlert?.historyValue > 0) {
          pingHealth = Math.min(100, Math.round((lastPingAlert.value / lastPingAlert.historyValue) * 100));
          connectivityHealth = pingHealth;
        } else {
          // No alerts — use IODA overallScore as-is (their accumulated outage metric)
          connectivityHealth = overallScore > 50000 ? 20
            : overallScore > 30000 ? 35
            : overallScore > 15000 ? 50
            : overallScore > 7000  ? 65
            : overallScore > 3000  ? 75
            : overallScore > 1000  ? 85
            : overallScore > 0     ? 92
            : 100;
        }
        // BGP degradation can also affect connectivity
        const bgpHealthCalc = lastBgpAlert?.historyValue > 0
          ? Math.min(100, Math.round((lastBgpAlert.value / lastBgpAlert.historyValue) * 100))
          : 100;
        bgpHealth = bgpHealthCalc;
        connectivityHealth = Math.min(connectivityHealth, bgpHealth);
        
        // ── Electricity detection ── C1+C2+C3+C4 + RATIONING PRIOR ──

        // Apply rationing prior for this state
        const prior = getPrior(st.name);
        const pm = prior.thresholdMult; // threshold multiplier

        // Separate by level
        const pingCritical = pingAlerts.filter(a => a.level === "critical").sort((a,b) => a.time - b.time);
        const pingWarning  = pingAlerts.filter(a => a.level === "warning").sort((a,b) => a.time - b.time);
        const bgpCritical  = bgpAlerts.filter(a => a.level === "critical");

        // C1: BGP veto by magnitude — scaled by prior
        // Base raised to 0.35 (was 0.25) — during widespread rationing, BGP can show
        // secondary fluctuations from power recovery; we need larger drops to veto.
        // e.g. Táchira T1 (pm=0.60): BGP must drop > 0.35×0.60 = 21% to veto
        // e.g. Distrito Capital T0 (pm=1.0): BGP must drop > 35% to veto
        const bgpVetoThreshold = 0.35 * pm;
        const isBgpVeto = (t1, t2) => bgpCritical.some(b => {
          if (b.time < t1 - 1800 || b.time > t2 + 1800) return false;
          if (!b.historyValue || b.historyValue === 0) return false;
          return (b.historyValue - b.value) / b.historyValue > bgpVetoThreshold;
        });

        // Helper: cluster adjacent alerts (≤45min gap) into composite events
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

        // C4: use already-loaded events (eventsRef) as independent confirmation signal
        const cachedEvts = eventsRef.current;
        const iodaConfirmsState = (t1, t2) => cachedEvts.some(e =>
          e.region === st.name && e.datasource === "ping-slash24" &&
          e.time >= t1 - 3600 && e.time <= t2 + 3600
        );

        const processCluster = (cluster) => {
          const drops = cluster.alerts.map(a =>
            a.historyValue > 0 ? Math.round(((a.historyValue - a.value) / a.historyValue) * 100) : 0
          );
          const maxDrop   = Math.max(...drops);
          const firstDrop = drops[0];
          const durationSec = Math.max(600, cluster.lastTime - cluster.firstTime);
          const isAbrupt    = firstDrop >= maxDrop * 0.50; // C3 lowered from 0.80
          const bgpAlsoDown = isBgpVeto(cluster.firstTime, cluster.lastTime);
          const iodaConfirmed = iodaConfirmsState(cluster.firstTime, cluster.lastTime); // C4
          // C3: single alert with drop >35% counts as direct evidence
          const isSingleSevere = cluster.alerts.length === 1 && maxDrop > 25;
          // C2: warning clusters need ≥2 alerts or IODA confirmation
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
          // Don't overlap with an existing critical event
          if (!powerEvents.some(e => Math.abs(e.ts - ev.ts) < 1800)) powerEvents.push(ev);
        }
        powerEvents.sort((a,b) => a.ts - b.ts);

        const electricEvents = powerEvents.filter(e => e.isElectric);
        // R5: elecScore = Σ(dropPct × 10min-buckets)
        const elecScore = electricEvents.reduce((acc, e) =>
          acc + e.dropPct * Math.max(1, Math.round(e.durationSec / 600)), 0);

        let elecHealth = 100, elecLabel = "Normal", elecConfidence = null;
        if (electricEvents.length > 0) {
          const worstDrop   = Math.max(...electricEvents.map(e => e.dropPct));
          const critCount   = electricEvents.filter(e => !e.isWarningOnly).length;
          const warnOnly    = electricEvents.every(e => e.isWarningOnly);
          const hasAbrupt   = electricEvents.some(e => e.isAbrupt && e.dropPct >= 15);
          const hasIodaConf = electricEvents.some(e => e.iodaConfirmed);
          const hasSingle   = electricEvents.some(e => e.isSingleSevere);

          // Apply rationing prior — scale thresholds by state multiplier
          // e.g. Táchira (pm=0.60): severe threshold = 35×0.60 = 21% drop
          // T0 states (no declared rationing): higher thresholds — drops more likely congestion
          const tSevere   = prior.tier === 0 ? 50 : Math.round(35 * pm);
          const tModerate = prior.tier === 0 ? 35 : Math.round(20 * pm);
          const tLeve     = prior.tier === 0 ? 20 : Math.round(10 * pm);

          if (!warnOnly) {
            if (worstDrop > tSevere || hasSingle) elecHealth = 20;
            else if (worstDrop > tModerate)       elecHealth = 40;
            else if (worstDrop > tLeve)           elecHealth = 60;
            else if (critCount >= 3)              elecHealth = 50;
            else if (critCount >= 1)              elecHealth = 60;
            else elecHealth = 80;
            // Tier amplification: known heavy rationing → push severity one level lower
            // T1 (12h/day): same drop is more significant → -15pts
            // T2 (5-8h/day): moderate amplification → -10pts
            if (prior.tier === 1 && elecHealth > 20 && elecHealth <= 60) {
              elecHealth = Math.max(20, elecHealth - 15);
            } else if (prior.tier === 2 && elecHealth > 40 && elecHealth <= 60) {
              elecHealth = Math.max(30, elecHealth - 10);
            }
          } else {
            // C2: warning-only — cap tighter for high-tier states
            const warnCap = prior.tier <= 1 ? 45 : prior.tier === 2 ? 55 : 65;
            elecHealth = Math.max(warnCap, electricEvents.length >= 3 ? warnCap - 10 : electricEvents.length >= 2 ? warnCap - 5 : warnCap);
          }
          // Boosts
          if (hasAbrupt   && elecHealth > 20) elecHealth = Math.max(20, elecHealth - 10);
          if (hasIodaConf && elecHealth > 20) elecHealth = Math.max(20, elecHealth - 5);

          // Confidence: start from prior base; T0 capped at "baja"
          elecConfidence = prior.tier === 0 ? "baja" : prior.confidenceBase;
          if (hasIodaConf && elecConfidence === "baja" && prior.tier > 0) elecConfidence = "media";

          // Intra-day accumulation: repeated blocks confirm rationing pattern
          // T1 threshold lowered to 35% of expected — more sensitive
          const expectedDailyScore = prior.hoursPerDay > 0
            ? Math.round(prior.hoursPerDay * 6 * 15)
            : 9999;
          if (prior.tier === 1 && elecScore >= expectedDailyScore * 0.35) {
            elecConfidence = "alta";
            if (elecHealth > 40) elecHealth = Math.min(elecHealth, 40);
          } else if (prior.tier <= 2 && elecScore >= expectedDailyScore * 0.5) {
            if (elecConfidence === "baja") elecConfidence = "media";
            else if (elecConfidence === "media") elecConfidence = "alta";
          }

          if (prior.tier === 0) {
            // T0: no declared rationing — label as network degradation, not electric outage
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
        // Only runs when NO explicit electric events were detected.
        // Uses FIXED tier-based values — does NOT mirror connectivityHealth
        // (mirroring caused all states to converge on the same elecHealth value).
        // Thresholds raised significantly to avoid triggering on chronic degradation.
        if (elecHealth === 100 && prior.tier <= 2 && prior.hoursPerDay > 0) {
          const connDegradation = 100 - connectivityHealth;
          // Require meaningful degradation — raised from 9/15% to 20/30%
          const inferThreshold = prior.tier === 1 ? 20 : 30;

          if (connDegradation > inferThreshold && bgpStable) {
            // Fixed tier-based values (NOT derived from connectivityHealth)
            if (prior.tier === 1) {
              if      (connDegradation > 60) { elecHealth = 25; elecConfidence = "media"; }
              else if (connDegradation > 40) { elecHealth = 40; elecConfidence = "media"; }
              else if (connDegradation > 25) { elecHealth = 55; elecConfidence = "baja";  }
              else                           { elecHealth = 70; elecConfidence = "baja";  }
            } else { // T2
              if      (connDegradation > 50) { elecHealth = 35; elecConfidence = "baja";  }
              else if (connDegradation > 35) { elecHealth = 50; elecConfidence = "baja";  }
              else                           { elecHealth = 65; elecConfidence = "baja";  }
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
      if (affectedStates.length > scores.length * 0.25) { // lowered from 0.5
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
        // Count how many neighboring states had events at same time (±30min)
        const neighborCount = scores.filter(other => other !== s && other.powerEvents?.some(oev =>
          s.powerEvents.some(sev => Math.abs(oev.ts - sev.ts) < 1800)
        )).length;
        // Confidence: neighbors boost, national = high
        // T0 states (no rationing): capped at "baja" regardless of neighbors
        const prior = getPrior(s.name);
        let confidence = "baja";
        if (prior.tier === 0) {
          confidence = "baja"; // T0 never gets boosted by neighbors
        } else if (worstNatSev) {
          confidence = "alta";
        } else if (neighborCount >= 2) {
          confidence = "alta";
        } else if (neighborCount >= 1) {
          confidence = "media";
        }
        // Abrupt pattern or IODA confirmation upgrade baja → media (not for T0)
        const hasAbruptStrong = s.powerEvents.some(ev => ev.isAbrupt && ev.dropPct >= 15 && !ev.bgpAlsoDown);
        const hasIodaConf     = s.powerEvents.some(ev => ev.iodaConfirmed && !ev.bgpAlsoDown);
        if (prior.tier > 0 && (hasAbruptStrong || hasIodaConf) && confidence === "baja") confidence = "media";
        s.elecConfidence = confidence;
        if (hasRegional) {
          s.elecHealth = worstRegDrop > 35 ? 20 : worstRegDrop > 20 ? 40 : worstRegDrop > 10 ? 60 : 80;
          const sevWord = s.elecHealth <= 30 ? "severa" : s.elecHealth <= 50 ? "moderada" : s.elecHealth <= 70 ? "leve" : "";
          s.elecLabel = confidence === "alta" ? `Interrupción eléctrica regional ${sevWord}`.trim()
            : confidence === "media" ? `Posible interrupción eléctrica regional ${sevWord}`.trim()
            : `Posible interrupción eléctrica ${sevWord} (verificar)`.trim();
        } else if (worstNatSev === "blackout_severe") { s.elecHealth = 15; s.elecLabel = "Interrupción eléctrica nacional severa"; }
        else if (worstNatSev === "blackout_moderate") { s.elecHealth = 40; s.elecLabel = "Interrupción eléctrica nacional moderada"; }
        else if (worstNatSev === "network_mild") { s.elecHealth = 80; s.elecLabel = "Degradación leve (red)"; }
        s.elecEvents = s.powerEvents.length;
      });
    }
    
    scores.sort((a,b) => b.dropScore - a.dropScore || a.healthPct - b.healthPct);
    setRegionScores(scores);
    } catch(e) {
      console.error("loadRegions error:", e);
    } finally {
      setRegionLoading(false);
    }
  }, [twFrom, twUntil]);

  // ── Phase 2: Enrich with signals/raw ──
  // Runs in background after Phase 1 — never blocks UI.
  // Uses calibratedBaseline from IODA historyValue.
  // Telescope treated as PRIMARY indicator, not just confirmator.
  const enrichWithRaw = useCallback(async (scores) => {
    if (!scores || scores.length === 0) return;

    // Phase 2 queries all 24 states — raw signal gives deeper detection than alerts alone
    // Most affected states processed first so map updates with critical info earliest
    const candidates = [...scores].sort((a,b) =>
      Math.min(a.connectivityHealth, a.elecHealth) - Math.min(b.connectivityHealth, b.elecHealth)
    );

    if (candidates.length === 0) return;
    setRawEnriching(true);
    setRawProgress({ current: 0, total: candidates.length });

    // Get national telescope for coincidence check
    const natTeleData = signals ? signals.map(p => p.telescope).filter(v => v !== null) : [];

    const BATCH = 3;
    const DELAY = 400;

    for (let i = 0; i < candidates.length; i += BATCH) {
      const batch = candidates.slice(i, i + BATCH);
      await Promise.allSettled(batch.map(async (st) => {
        try {
          const json = await iodaFetch(`signals/raw/region/${st.code}`, { from: twFrom, until: twUntil });
          const parsed = json ? parseSignals(json) : null;
          if (!parsed || parsed.length < 10) return;

          // Calibrated baseline + rationing prior
          const pingAlerts = (st.alerts || []).filter(a => a.datasource === "ping-slash24");
          const hvs = pingAlerts.map(a => a.historyValue).filter(v => v > 0);
          const calibratedBaseline = hvs.length > 0 ? Math.max(...hvs) : null;
          const prior = getPrior(st.name);

          const rawResult = computeRegionScore(parsed, natTeleData, calibratedBaseline, prior);
          if (!rawResult) return;

          // ── Telescope as PRIMARY indicator ──
          // If telescope drops significantly with BGP stable → electric outage signal
          // independent of whether probing reached alert threshold
          const teleVals = parsed.map(p => p.telescope).filter(v => v !== null);
          let teleElecSignal = null;
          if (teleVals.length >= 10) {
            const teleSorted = [...teleVals].sort((a,b) => a - b);
            const teleP95 = teleSorted[Math.floor(teleSorted.length * 0.95)];
            if (teleP95 >= 0.2) {
              // Telescope drop threshold scaled by rationing prior
              // Tier 1 states: 70%×0.60=42% → only need 42% drop to trigger
              const teleDropThresh = teleP95 * (0.70 * prior.thresholdMult);
              const step = parsed.length > 1
                ? (parsed[parsed.length-1].ts - parsed[0].ts) / (parsed.length - 1) : 600;
              let teleEvents = [];
              let inDrop = false, dropStart = null, dropMin = Infinity;
              for (let j = 0; j < teleVals.length; j++) {
                if (teleVals[j] < teleDropThresh) {
                  if (!inDrop) { inDrop = true; dropStart = j; dropMin = teleVals[j]; }
                  else if (teleVals[j] < dropMin) dropMin = teleVals[j];
                } else if (inDrop) {
                  const dur = (j - dropStart) * step;
                  const dropPct = Math.round(((teleP95 - dropMin) / teleP95) * 100);
                  if (dur >= 1200 && dropPct >= 30) { // ≥20min, ≥30% drop
                    teleEvents.push({ ts: parsed[dropStart]?.ts || 0, dropPct, durationSec: dur });
                  }
                  inDrop = false; dropMin = Infinity;
                }
              }
              // Open event at end
              if (inDrop) {
                const dur = (teleVals.length - dropStart) * step;
                const dropPct = Math.round(((teleP95 - dropMin) / teleP95) * 100);
                if (dur >= 1200 && dropPct >= 30) {
                  teleEvents.push({ ts: parsed[dropStart]?.ts || 0, dropPct, durationSec: dur });
                }
              }
              // Check BGP stable during telescope events
              const bgpVals = parsed.map(p => p.bgp).filter(v => v !== null);
              const bgpP95 = bgpVals.length >= 5
                ? [...bgpVals].sort((a,b) => a - b)[Math.floor(bgpVals.length * 0.95)] : null;
              const confirmedTeleEvents = teleEvents.filter(ev => {
                if (!bgpP95 || bgpP95 < 10) return true; // no BGP data = assume stable
                const evIdx = Math.max(0, Math.round((ev.ts - (parsed[0]?.ts || 0)) / step));
                const window = bgpVals.slice(evIdx, evIdx + Math.max(2, Math.round(ev.durationSec / step)));
                return window.length === 0 || Math.min(...window) / bgpP95 > 0.85;
              });
              if (confirmedTeleEvents.length > 0) {
                const worstDrop = Math.max(...confirmedTeleEvents.map(e => e.dropPct));
                // Scale severity thresholds by prior
                const tS = Math.round(60 * prior.thresholdMult);
                const tM = Math.round(45 * prior.thresholdMult);
                const tL = Math.round(30 * prior.thresholdMult);
                const teleElecHealth = worstDrop > tS ? 25 : worstDrop > tM ? 40 : worstDrop > tL ? 60 : 75;
                const teleElecScore = confirmedTeleEvents.reduce((acc, e) =>
                  acc + e.dropPct * Math.max(1, Math.round(e.durationSec / 600)), 0);
                // Confidence: telescope is independent → start at prior base, min "media" for Tier 1
                const teleConf = prior.tier <= 1 ? "alta" : prior.tier === 2 ? "media" : "media";
                teleElecSignal = {
                  elecHealth: teleElecHealth, elecScore: teleElecScore,
                  elecEvents: confirmedTeleEvents.length,
                  elecLabel: teleElecHealth <= 30 ? "Posible interrupción eléctrica severa (telescopio)"
                    : teleElecHealth <= 50 ? "Posible interrupción eléctrica moderada (telescopio)"
                    : "Posible interrupción eléctrica leve (telescopio)",
                  elecConfidence: teleConf,
                  fromTelescope: true,
                };
              }
            }
          }

          // Merge: raw + telescope can only increase severity, cap at -15pts from Phase 1
          setRegionScores(prev => prev.map(r => {
            if (r.code !== st.code) return r;
            const phase1Elec = r.elecHealth ?? 100;
            const phase1Conn = r.connectivityHealth ?? 100;

            // Best electric signal: min of raw probing result and telescope result
            const rawElec  = rawResult.elecHealth ?? 100;
            const teleElec = teleElecSignal?.elecHealth ?? 100;
            const bestElec = Math.min(rawElec, teleElec);

            // Cap: raw cannot push more than 15pts below Phase 1
            const cappedElec = Math.max(phase1Elec - 15, bestElec);
            const mergedElec = Math.min(phase1Elec, cappedElec);
            const mergedConn = Math.min(phase1Conn, rawResult.connectivityHealth ?? 100);

            const improvedElec = mergedElec < phase1Elec;
            const improvedConn = mergedConn < phase1Conn;

            // Choose label and confidence from whichever source found worst
            let newLabel = r.elecLabel, newConf = r.elecConfidence, newScore = r.elecScore || 0;
            if (teleElecSignal && teleElec <= rawElec && teleElec < phase1Elec) {
              newLabel = teleElecSignal.elecLabel;
              newConf  = teleElecSignal.elecConfidence;
              newScore = Math.max(newScore, teleElecSignal.elecScore);
            } else if (rawElec < phase1Elec) {
              newLabel = rawResult.elecLabel || r.elecLabel;
              newConf  = r.elecConfidence === "alta" ? "alta" : "media";
              newScore = Math.max(newScore, rawResult.elecScore || 0);
            }

            return {
              ...r,
              connectivityHealth: mergedConn,
              healthPct: mergedConn,
              elecHealth: mergedElec,
              elecLabel: newLabel,
              elecConfidence: newConf,
              elecScore: newScore,
              elecEvents: Math.max(r.elecEvents || 0, rawResult.elecEvents || 0, teleElecSignal?.elecEvents || 0),
              perSource: {
                ...r.perSource,
                ...(rawResult.perSource?.loss      ? { loss:      rawResult.perSource.loss      } : {}),
                ...(rawResult.perSource?.latency   ? { latency:   rawResult.perSource.latency   } : {}),
                ...(rawResult.perSource?.telescope ? { telescope: rawResult.perSource.telescope } : {}),
              },
              rawEnriched: true,
              rawDetectedNew: improvedElec,
              teleDetected: teleElecSignal && teleElec < phase1Elec,
            };
          }));
        } catch { /* silent fail — Phase 1 data remains valid */ }
        finally { setRawProgress(p => ({ ...p, current: p.current + 1 })); }
      }));
      if (i + BATCH < candidates.length) await new Promise(r => setTimeout(r, DELAY));
    }
    setRawEnriching(false);
  }, [twFrom, twUntil]);

  useEffect(() => { loadNational(); loadEvents(0); }, [loadNational, loadEvents]);
  useEffect(() => { if (subView === "estados") loadRegions(); }, [subView, loadRegions]);
  useEffect(() => { loadEvents(eventsBack); }, [eventsBack]);
  // Phase 2: fire when Phase 1 just finished (regionLoading goes false with scores loaded)
  const prevRegionLoadingRef = useRef(false);
  useEffect(() => {
    if (prevRegionLoadingRef.current === true && regionLoading === false && regionScores.length > 0) {
      enrichWithRaw(regionScores);
    }
    prevRegionLoadingRef.current = regionLoading;
  }, [regionLoading]); // eslint-disable-line
  
  // Auto-refresh every 5 min for 24h/48h modes
  useEffect(() => {
    if (timePreset !== "24h" && timePreset !== "48h") return;
    const interval = setInterval(() => {
      changePreset(timePreset); // re-freezes epoch, triggers reload
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timePreset]);
  
  // Lazy-load signals/raw for selected state (chart + sparklines + loss/latency)
  useEffect(() => {
    if (!selectedState) { setSelectedStateData(null); return; }
    const st = VE_REGIONS.find(r => r.name === selectedState);
    if (!st) return;
    setSelectedStateLoading(true);
    (async () => {
      const json = await iodaFetch(`signals/raw/region/${st.code}`, { from: twFrom, until: twUntil });
      const parsed = json ? parseSignals(json) : null;
      setSelectedStateData(parsed ? { name: st.name, code: st.code, series: parsed } : null);
      
      // Update perSource with loss/latency from signals/raw
      if (parsed) {
        const lossVals = parsed.map(p => p.lossPct).filter(v => v !== null);
        const latVals = parsed.map(p => p.medianLatency).filter(v => v !== null);
        setRegionScores(prev => prev.map(r => {
          if (r.name !== selectedState) return r;
          const ps = { ...r.perSource };
          if (lossVals.length >= 5) {
            const lossTail = lossVals.slice(-Math.min(36, lossVals.length));
            const lossAvg = lossTail.reduce((a,b) => a+b, 0) / lossTail.length;
            const lossHealth = lossAvg > 60 ? 30 : lossAvg > 40 ? 50 : lossAvg > 25 ? 70 : lossAvg > 15 ? 85 : 100;
            ps.loss = { health: lossHealth, current: Math.round(lossAvg * 10) / 10, baseline: 10 };
          }
          if (latVals.length >= 5) {
            const latSorted = [...latVals].sort((a,b) => a - b);
            const latP10 = latSorted[Math.floor(latSorted.length * 0.1)];
            const latTail = latVals.slice(-Math.min(36, latVals.length));
            const latWorst = Math.max(...latTail);
            const latRatio = latP10 > 0 ? latWorst / latP10 : 1;
            const latHealth = latRatio > 3 ? 40 : latRatio > 2 ? 60 : latRatio > 1.5 ? 80 : 100;
            ps.latency = { health: latHealth, current: Math.round(latVals[latVals.length-1]), baseline: Math.round(latP10) };
          }
          // Also extract telescope
          const teleVals = parsed.map(p => p.telescope).filter(v => v !== null);
          if (teleVals.length >= 5) {
            const teleSorted = [...teleVals].sort((a,b) => a - b);
            const teleP95 = teleSorted[Math.floor(teleSorted.length * 0.95)];
            if (teleP95 >= 0.2) {
              const teleCurrent = teleVals[teleVals.length - 1];
              ps.telescope = { health: Math.min(100, Math.round((teleCurrent / teleP95) * 100)), current: Math.round(teleCurrent * 10) / 10, baseline: Math.round(teleP95 * 10) / 10 };
            }
          }
          // Connectivity = primarily probing, with loss/latency as secondary penalties (max -15 and -10 pts)
          // NOTE: we do NOT update connectivityHealth in regionScores from here —
          // that would cause visible jumps when clicking a state. perSource is for display only.
          return { ...r, perSource: ps };
        }));
      }
      setSelectedStateLoading(false);
    })();
  }, [selectedState, twFrom, twUntil]);

  // ── Auto-select worst state when regionScores loads ──
  useEffect(() => {
    if (selectedState) return; // don't override user selection
    if (regionScores.length === 0) return;
    const worst = [...regionScores].sort((a, b) => {
      const aScore = Math.min(a.connectivityHealth ?? 100, a.elecHealth ?? 100);
      const bScore = Math.min(b.connectivityHealth ?? 100, b.elecHealth ?? 100);
      return aScore - bScore;
    })[0];
    if (worst) setSelectedState(worst.name);
  }, [regionScores]);

  // ── 4. AI Explain ──
  const explainWithAI = async () => {
    setAiLoading(true); setAiExplain(null);
    const ctx = [];
    if (signals) {
      const last = signals[signals.length - 1];
      const first = signals[0];
      ctx.push(`Señales nacionales (${timeLabel}): BGP actual=${fmtVal(last?.bgp)}, Probing=${fmtVal(last?.probing)}, Telescope=${fmtVal(last?.telescope)}`);
      if (first?.bgp && last?.bgp) {
        const pct = ((last.bgp - first.bgp) / first.bgp * 100).toFixed(1);
        ctx.push(`Cambio BGP en el período: ${pct}%`);
      }
    }
    if (events.length > 0) {
      ctx.push(`Eventos detectados (7d): ${events.length}. Más reciente: ${events[0].condition || "?"} en ${events[0].datasource || "?"} (${events[0].time ? fmtTime(events[0].time) : "?"})`);
    }
    if (regionScores.length > 0) {
      const worst = regionScores.filter(r => r.healthPct < 90).slice(0, 5);
      if (worst.length > 0) {
        ctx.push(`Estados con conectividad degradada: ${worst.map(r => `${r.name} ${r.healthPct}%`).join(", ")}`);
      } else {
        ctx.push("Todos los estados con conectividad >90% (normal).");
      }
    }
    const prompt = `Eres un analista de conectividad de internet en Venezuela. Basándote en estos datos de IODA (Georgia Tech), explica de forma clara y concisa qué está ocurriendo con la conectividad en Venezuela en este momento. Si hay caídas, indica posibles causas (censura gubernamental, fallas de infraestructura CANTV, problemas regionales, cortes eléctricos). Si todo está normal, indícalo. Máximo 3 párrafos.\n\nDatos:\n${ctx.join("\n")}`;
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, max_tokens: 600 }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiExplain(data.text || data.choices?.[0]?.message?.content || "Sin respuesta.");
      } else setAiExplain("Error al conectar con IA.");
    } catch { setAiExplain("Error de conexión."); }
    setAiLoading(false);
  };

  // ── Severity helpers for map ──
  const getSeverityColor = (healthPct) => {
    if (healthPct >= 90) return "#34d399"; // Normal — green
    if (healthPct >= 70) return "#fbbf24"; // Degraded — amber
    if (healthPct >= 50) return "#f97316"; // High — orange
    return "#ef4444"; // Critical — red
  };
  const getSeverityLabel = (healthPct) => {
    if (healthPct >= 90) return "Normal";
    if (healthPct >= 70) return "Degradado";
    if (healthPct >= 50) return "Alto";
    return "Crítico";
  };

  // ── Signal chart renderer ──
  const renderSignalChart = (key, label, color, data) => {
    if (!data || data.length === 0) return null;
    const vals = data.map(d => d[key]).filter(v => v !== null);
    if (vals.length === 0) return (
      <Card accent={color}><div style={{ fontSize:13, fontWeight:600, color, marginBottom:4 }}>{label}</div>
        <div style={{ fontSize:13, color:MUTED, padding:"20px 0", textAlign:"center" }}>Sin datos</div></Card>
    );
    const max = Math.max(...vals), min = Math.min(...vals);
    const current = vals[vals.length - 1];
    const sortedNat = [...vals].sort((a,b) => a - b);
    const avg = sortedNat[Math.floor(sortedNat.length * 0.95)] || sortedNat[sortedNat.length - 1] || 1;
    const pctChange = avg !== 0 ? ((current - avg) / avg * 100) : 0;
    const W = 600, H = 130, pL = 50, pR = 10, pT = 5, pB = 5;
    const cW = W-pL-pR, cH = H-pT-pB;
    const toX = i => pL + (i/(data.length-1)) * cW;
    const toY = v => v === null ? null : pT + cH - ((v-min)/(max-min||1))*cH;
    let pathD = "", areaD = "", fX = null, lX = null;
    data.forEach((d, i) => { const v = d[key]; if (v === null) return; const x = toX(i), y = toY(v);
      if (fX === null) { pathD += `M${x},${y}`; fX = x; } else pathD += ` L${x},${y}`; lX = x; });
    if (fX !== null) areaD = pathD + ` L${lX},${pT+cH} L${fX},${pT+cH} Z`;
    return (
      <Card accent={color}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:color }} />
            <span style={{ fontSize:13, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>{label}</span>
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
            <span style={{ fontSize:16, fontWeight:700, fontFamily:font, color }}>{fmtVal(current)}</span>
            <span style={{ fontSize:12, fontFamily:font, color: pctChange < -5 ? "#dc2626" : pctChange > 5 ? "#7c3aed" : MUTED }}>
              {pctChange > 0 ? "+" : ""}{pctChange.toFixed(1)}%
            </span>
          </div>
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}
          onMouseMove={e => { const rect = e.currentTarget.getBoundingClientRect(); const mx = (e.clientX - rect.left) / rect.width * W;
            const idx = Math.round(((mx - pL) / cW) * (data.length-1)); if (idx >= 0 && idx < data.length) setHover({ key, idx }); }}
          onMouseLeave={() => setHover(null)}>
          {[0,0.5,1].map(f => <line key={f} x1={pL} y1={pT+f*cH} x2={pL+cW} y2={pT+f*cH} stroke="rgba(0,0,0,0.06)" />)}
          <text x={pL-4} y={pT+6} textAnchor="end" fontSize={7} fill={MUTED} fontFamily={font}>{fmtVal(max)}</text>
          <text x={pL-4} y={pT+cH} textAnchor="end" fontSize={7} fill={MUTED} fontFamily={font}>{fmtVal(min)}</text>
          <path d={areaD} fill={`${color}12`} /><path d={pathD} fill="none" stroke={color} strokeWidth={1.5} />
          {/* Baseline reference line */}
          {avg > 0 && <><line x1={pL} y1={toY(avg)} x2={pL+cW} y2={toY(avg)} stroke={`${color}40`} strokeDasharray="4,3" />
            <text x={pL+cW+2} y={toY(avg)+3} fontSize={6} fill={`${color}80`} fontFamily={font}>base</text></>}
          {/* X-axis time labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(f => {
            const idx = Math.round(f * (data.length - 1));
            if (idx >= data.length) return null;
            return <text key={f} x={toX(idx)} y={H-1} textAnchor="middle" fontSize={6} fill={`${MUTED}90`} fontFamily={font}>
              {fmtTime(data[idx].ts).replace(/,/g, "")}
            </text>;
          })}
          {/* Drop zone shading — highlight areas below 80% of baseline */}
          {avg > 0 && (() => {
            let zones = "";
            let inDrop = false, startX = 0;
            data.forEach((d, i) => {
              const v = d[key];
              if (v !== null && v < avg * 0.8) {
                if (!inDrop) { inDrop = true; startX = toX(i); }
              } else if (inDrop) {
                inDrop = false;
                zones += `<rect x="${startX}" y="${pT}" width="${toX(i) - startX}" height="${cH}" fill="rgba(220,38,38,0.06)" />`;
              }
            });
            if (inDrop) zones += `<rect x="${startX}" y="${pT}" width="${toX(data.length-1) - startX}" height="${cH}" fill="rgba(220,38,38,0.06)" />`;
            return zones ? <g dangerouslySetInnerHTML={{ __html: zones }} /> : null;
          })()}
          {/* Hover */}
          {hover && hover.key === key && hover.idx < data.length && data[hover.idx][key] !== null && (<>
            <line x1={toX(hover.idx)} y1={pT} x2={toX(hover.idx)} y2={pT+cH} stroke="rgba(0,0,0,0.15)" strokeDasharray="2,2" />
            <circle cx={toX(hover.idx)} cy={toY(data[hover.idx][key])} r={3.5} fill={color} stroke="#fff" strokeWidth={1.5} /></>)}
        </svg>
        {hover && hover.key === key && hover.idx < data.length && (
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, marginTop:4 }}>
            {fmtTime(data[hover.idx].ts)} · <span style={{ color }}>{data[hover.idx][key] !== null ? fmtVal(data[hover.idx][key]) : "—"}</span>
          </div>
        )}
      </Card>
    );
  };

  // Compute activeData at component level (used by estados + chart)
  const activeData = (regionScores || []).map(r => ({
    ...r,
    displayScore: r.dropScore || 0,
  })).sort((a,b) => b.displayScore - a.displayScore || a.healthPct - b.healthPct);

  // ── Export XLSX ──
  const runExport = async () => {
    setExportLoading(true); setExportError(null);
    try {
      const now = Math.floor(Date.now() / 1000);
      let expFrom, expUntil;
      if (exportPreset === "custom") {
        if (!exportCustomFrom || !exportCustomUntil) { setExportError("Selecciona fechas de inicio y fin."); setExportLoading(false); return; }
        expFrom  = Math.floor(new Date(exportCustomFrom).getTime()  / 1000);
        expUntil = Math.floor(new Date(exportCustomUntil).getTime() / 1000);
      } else {
        const hrs = { "24h":24, "48h":48, "7d":168, "30d":720 }[exportPreset] || 168;
        expFrom = now - hrs * 3600; expUntil = now;
      }
      const periodLabel = exportPreset === "custom"
        ? `${new Date(expFrom*1000).toLocaleDateString("es-VE")} — ${new Date(expUntil*1000).toLocaleDateString("es-VE")}`
        : exportPreset;
      const fmtDate = ts => ts ? new Date(ts*1000).toLocaleString("es-VE",{timeZone:"America/Caracas",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}) : "";

      // Fetch events
      const allEvts = [];
      try {
        const natJson = await iodaFetch("outages/events",{entityType:"country",entityCode:"VE",from:expFrom,until:expUntil});
        (Array.isArray(natJson?.data)?natJson.data:[]).forEach(ev => allEvts.push({time:ev.start,region:"🇻🇪 Nacional",datasource:ev.datasource,condition:ev.score>5000?"critical":ev.score>1000?"high":"medium",score:ev.score||0,duration:ev.duration||0}));
      } catch {}
      const regEvts = await Promise.allSettled(VE_REGIONS.map(async st => {
        const json = await iodaFetch("outages/events",{entityType:"region",entityCode:st.code,from:expFrom,until:expUntil});
        return (Array.isArray(json?.data)?json.data:[]).map(ev=>({time:ev.start,region:st.name,datasource:ev.datasource,condition:ev.score>3000?"critical":ev.score>500?"high":"medium",score:ev.score||0,duration:ev.duration||0}));
      }));
      regEvts.forEach(r=>{if(r.status==="fulfilled"&&r.value)allEvts.push(...r.value);});
      allEvts.sort((a,b)=>b.time-a.time);

      // Fetch region scores
      const regScores = await Promise.allSettled(VE_REGIONS.map(async st => {
        const [sumJson, altJson] = await Promise.all([
          iodaFetch("outages/summary",{entityType:"region",entityCode:st.code,from:expFrom,until:expUntil}),
          iodaFetch("outages/alerts", {entityType:"region",entityCode:st.code,from:expFrom,until:expUntil}),
        ]);
        const summary = sumJson?.data?.[0]||{};
        const alerts  = Array.isArray(altJson?.data)?altJson.data:[];
        const ping = alerts.filter(a=>a.datasource==="ping-slash24");
        const bgp  = alerts.filter(a=>a.datasource==="bgp");
        const critPing = ping.filter(a=>a.level==="critical");
        const critBgp  = bgp.filter(a=>a.level==="critical");
        const elecEvts = critPing.filter(a=>!critBgp.some(b=>Math.abs(b.time-a.time)<1800));
        const worstPing = critPing.sort((a,b)=>(a.value/a.historyValue)-(b.value/b.historyValue))[0];
        const lastPing  = ping[ping.length-1];
        const lastBgp   = bgp[bgp.length-1];
        const overallScore = summary.scores?.overall??0;
        let pingHealth = worstPing?.historyValue>0 ? Math.min(100,Math.round((worstPing.value/worstPing.historyValue)*100))
          : lastPing?.historyValue>0 ? Math.min(100,Math.round((lastPing.value/lastPing.historyValue)*100))
          : overallScore>50000?30:overallScore>20000?50:overallScore>10000?60:overallScore>5000?70:overallScore>1000?85:overallScore>0?90:100;
        const bgpHealth = lastBgp?.historyValue>0?Math.min(100,Math.round((lastBgp.value/lastBgp.historyValue)*100)):100;
        const connHealth = Math.min(pingHealth,bgpHealth);
        let elecHealth=100,elecLabel="Normal";
        if(elecEvts.length>0){const wd=Math.max(...elecEvts.map(e=>e.historyValue>0?Math.round(((e.historyValue-e.value)/e.historyValue)*100):0));elecHealth=wd>60?20:wd>40?40:wd>25?60:elecEvts.length>=3?50:60;elecLabel=elecHealth<=30?"Posible interrupción eléctrica severa":elecHealth<=50?"Posible interrupción eléctrica moderada":"Posible interrupción eléctrica leve";}
        return {name:st.name,connHealth,elecHealth,elecLabel,elecEvents:elecEvts.length,overallScore,eventCnt:summary.event_cnt??0};
      }));
      const regionRows = regScores.filter(r=>r.status==="fulfilled"&&r.value).map(r=>r.value).sort((a,b)=>a.connHealth-b.connHealth);

      // Build workbook
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(allEvts.length>0 ? allEvts.map(ev=>({
        "Fecha (VET)":fmtDate(ev.time),"Región":ev.region,"Fuente":ev.datasource||"",
        "Severidad":ev.condition==="critical"?"CRÍTICO":ev.condition==="high"?"ALTO":"MEDIO",
        "Score IODA":ev.score,"Duración":ev.duration>0?(ev.duration<3600?`${Math.round(ev.duration/60)}m`:`${Math.floor(ev.duration/3600)}h ${Math.round((ev.duration%3600)/60)}m`):"en curso",
      })) : [{"Fecha (VET)":"Sin eventos","Región":"","Fuente":"","Severidad":"","Score IODA":"","Duración":""}]);
      ws1["!cols"]=[{wch:18},{wch:20},{wch:12},{wch:10},{wch:12},{wch:10}];
      XLSX.utils.book_append_sheet(wb,ws1,"Eventos");
      const ws2 = XLSX.utils.json_to_sheet(regionRows.length>0 ? regionRows.map(r=>({
        "Estado":r.name,"Conectividad %":r.connHealth,"Electricidad %":r.elecHealth,
        "Estado eléctrico":r.elecLabel,"Eventos eléctricos":r.elecEvents,
        "Score IODA total":r.overallScore,"N° eventos IODA":r.eventCnt,
      })) : [{"Estado":"Sin datos"}]);
      ws2["!cols"]=[{wch:20},{wch:15},{wch:15},{wch:38},{wch:18},{wch:18},{wch:16}];
      XLSX.utils.book_append_sheet(wb,ws2,"Ranking Estados");
      const ws3 = XLSX.utils.json_to_sheet([
        {"Campo":"Fuente","Valor":"IODA — Georgia Tech INETINTEL"},
        {"Campo":"Período","Valor":periodLabel},
        {"Campo":"Desde (UTC)","Valor":new Date(expFrom*1000).toISOString()},
        {"Campo":"Hasta (UTC)","Valor":new Date(expUntil*1000).toISOString()},
        {"Campo":"Generado","Valor":new Date().toLocaleString("es-VE",{timeZone:"America/Caracas"})},
        {"Campo":"Total eventos","Valor":allEvts.length},
        {"Campo":"Estados analizados","Valor":regionRows.length},
      ]);
      ws3["!cols"]=[{wch:20},{wch:45}];
      XLSX.utils.book_append_sheet(wb,ws3,"Metadata");
      XLSX.writeFile(wb,`IODA_Venezuela_${exportPreset}_${new Date().toISOString().slice(0,10)}.xlsx`);
      setExportOpen(false);
    } catch(e) { setExportError("Error al generar el archivo: "+e.message); }
    setExportLoading(false);
  };

  const ExportModal = () => {
    if (!exportOpen) return null;
    return (
      <div onClick={e=>{if(e.target===e.currentTarget)setExportOpen(false);}}
        style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{background:"#fff",borderRadius:6,padding:24,minWidth:340,maxWidth:420,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",fontFamily:font}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:700,color:TEXT}}>📥 Exportar a XLSX</div>
            <button onClick={()=>setExportOpen(false)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:MUTED}}>✕</button>
          </div>
          <div style={{fontSize:11,color:MUTED,marginBottom:12,lineHeight:1.5}}>
            Genera un XLSX con datos directamente de IODA para el período seleccionado.<br/>
            Incluye: <b>Eventos</b>, <b>Ranking Estados</b> y <b>Metadata</b>.
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:MUTED,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Período</div>
            <div style={{display:"flex",gap:0,border:`1px solid ${BORDER}`,borderRadius:3,overflow:"hidden"}}>
              {["24h","48h","7d","30d","custom"].map(p=>(
                <button key={p} onClick={()=>setExportPreset(p)}
                  style={{flex:1,fontSize:11,fontFamily:font,padding:"6px 4px",border:"none",
                    background:exportPreset===p?ACCENT:"transparent",color:exportPreset===p?"#fff":MUTED,cursor:"pointer"}}>
                  {p==="custom"?"📅":p}
                </button>
              ))}
            </div>
            {exportPreset==="custom"&&(
              <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
                <div>
                  <div style={{fontSize:10,color:MUTED,marginBottom:2}}>Desde</div>
                  <input type="datetime-local" value={exportCustomFrom} onChange={e=>setExportCustomFrom(e.target.value)}
                    style={{width:"100%",fontSize:11,fontFamily:font,padding:"5px 8px",border:`1px solid ${BORDER}`,borderRadius:3,background:"transparent",color:TEXT,boxSizing:"border-box"}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:MUTED,marginBottom:2}}>Hasta</div>
                  <input type="datetime-local" value={exportCustomUntil} onChange={e=>setExportCustomUntil(e.target.value)}
                    style={{width:"100%",fontSize:11,fontFamily:font,padding:"5px 8px",border:`1px solid ${BORDER}`,borderRadius:3,background:"transparent",color:TEXT,boxSizing:"border-box"}}/>
                </div>
              </div>
            )}
          </div>
          <div style={{fontSize:11,color:MUTED,padding:"8px 10px",background:`${BORDER}12`,borderRadius:4,marginBottom:14,lineHeight:1.6}}>
            📊 <b>Eventos:</b> fecha, región, fuente, severidad, score, duración<br/>
            🗺 <b>Ranking Estados:</b> conectividad %, electricidad %, etiqueta, score IODA<br/>
            📋 <b>Metadata:</b> fuente, período, fecha de generación
          </div>
          {exportError&&<div style={{fontSize:11,color:"#dc2626",marginBottom:10,padding:"6px 10px",background:"#fef2f2",borderRadius:3}}>{exportError}</div>}
          <button onClick={runExport} disabled={exportLoading}
            style={{width:"100%",fontSize:13,fontFamily:font,padding:"10px",background:exportLoading?`${BORDER}30`:ACCENT,
              color:exportLoading?MUTED:"#fff",border:"none",borderRadius:4,cursor:exportLoading?"wait":"pointer",fontWeight:600}}>
            {exportLoading?"⏳ Generando archivo...":"⬇ Generar y descargar XLSX"}
          </button>
          {exportLoading&&<div style={{fontSize:10,color:MUTED,marginTop:8,textAlign:"center"}}>Puede tardar 20–30s (consulta 24 estados a IODA)</div>}
        </div>
      </div>
    );
  };

  return (
    <div>
      <ExportModal />
      {/* ── Header + Unified Time Picker ── */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>🌐</span>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontSize:15, fontWeight:600, color:TEXT }}>Monitor de Conectividad — Venezuela</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em" }}>
            Georgia Tech IODA · {source === "live" ? `${signals?.length || 0} puntos` : source === "failed" ? "Sin conexión" : "Conectando..."}
          </div>
        </div>
        <Badge color={source==="live"?"#7c3aed":source==="failed"?"#dc2626":"#a17d08"}>
          {source==="live"?"EN VIVO":source==="failed"?"OFFLINE":"..."}
        </Badge>
        <button onClick={() => changePreset(timePreset)} title="Refrescar datos"
          style={{ fontSize:14, padding:"4px 8px", background:"transparent", border:`1px solid ${BORDER}`,
            cursor:"pointer", borderRadius:4, color:MUTED, lineHeight:1 }}>🔄</button>
      </div>
      {/* Time controls */}
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}` }}>
          {["24h","48h","7d","30d"].map(r => (
            <button key={r} onClick={() => changePreset(r)}
              style={{ fontSize:12, fontFamily:font, padding:"5px 12px", border:"none",
                background:timePreset===r?ACCENT:"transparent", color:timePreset===r?"#fff":MUTED, cursor:"pointer", letterSpacing:"0.08em" }}>{r}</button>
          ))}
          <button onClick={() => changePreset("custom")}
            style={{ fontSize:12, fontFamily:font, padding:"5px 12px", border:"none",
              background:timePreset==="custom"?ACCENT:"transparent", color:timePreset==="custom"?"#fff":MUTED, cursor:"pointer", letterSpacing:"0.08em" }}>📅</button>
        </div>
        {timePreset === "custom" && (
          <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
            <input type="datetime-local" value={customFrom} onChange={e => { setCustomFrom(e.target.value); setRegionScores([]); }}
              style={{ fontSize:11, fontFamily:font, padding:"4px 8px", border:`1px solid ${BORDER}`, background:"transparent", color:TEXT, borderRadius:3 }} />
            <span style={{ fontSize:11, color:MUTED }}>→</span>
            <input type="datetime-local" value={customUntil} onChange={e => setCustomUntil(e.target.value)}
              style={{ fontSize:11, fontFamily:font, padding:"4px 8px", border:`1px solid ${BORDER}`, background:"transparent", color:TEXT, borderRadius:3 }} />
            <button onClick={() => { setTimeEpoch(Math.floor(Date.now() / 1000)); setRegionScores([]); }}
              style={{ fontSize:11, fontFamily:font, padding:"4px 10px", background:ACCENT, color:"#fff", border:"none", cursor:"pointer", borderRadius:3 }}>Cargar</button>
          </div>
        )}
        {timePreset === "custom" && customFrom && (
          <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>{timeLabel}</span>
        )}
      </div>

      {error && (
        <div style={{ fontSize:12, fontFamily:font, color:"#a17d08", padding:"6px 12px", background:"rgba(234,179,8,0.08)", border:"1px solid rgba(234,179,8,0.2)", marginBottom:12 }}>
          ⚠ {error}
          <button onClick={loadNational} style={{ marginLeft:8, fontSize:11, fontFamily:font, padding:"2px 8px", background:"transparent", border:`1px solid ${ACCENT}40`, color:ACCENT, cursor:"pointer" }}>↻ Reintentar</button>
        </div>
      )}

      {/* ── Sub-navigation ── */}
      <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}`, marginBottom:14 }}>
        {[{id:"estados",label:"🗺 Estados"},{id:"eventos",label:"⚡ Eventos"},{id:"nacional",label:"📡 Nacional"}].map(s => (
          <button key={s.id} onClick={() => setSubView(s.id)}
            style={{ fontSize:12, fontFamily:font, padding:"7px 16px", border:"none", flex:1,
              background:subView===s.id?ACCENT:"transparent", color:subView===s.id?"#fff":MUTED, cursor:"pointer", letterSpacing:"0.06em" }}>{s.label}</button>
        ))}
      </div>

      {/* ══════ NACIONAL ══════ */}
      {subView === "nacional" && (<>
        {loading ? (
          <Card><div style={{ textAlign:"center", padding:40, color:MUTED, fontSize:14, fontFamily:font }}>
            <div style={{ fontSize:20, marginBottom:8 }}>🌐</div>Conectando con IODA...<div style={{ fontSize:12, marginTop:4, color:`${MUTED}80` }}>Señales BGP + Active Probing + Telescope · {timeLabel}</div>
          </div></Card>
        ) : signals ? (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {renderSignalChart("bgp", "BGP Routes", "#7c3aed", signals)}
            {renderSignalChart("probing", "Active Probing (Sondeo)", "#f59e0b", signals)}
            {renderSignalChart("telescope", "Network Telescope", "#dc2626", signals)}
          </div>
        ) : (
          <Card><div style={{ textAlign:"center", padding:"30px 20px" }}>
            <div style={{ fontSize:24, marginBottom:10 }}>📡</div>
            <div style={{ fontSize:12, fontWeight:600, color:TEXT, marginBottom:8 }}>Conexión no disponible</div>
            <div style={{ fontSize:13, color:MUTED, lineHeight:1.6, maxWidth:500, margin:"0 auto", marginBottom:16 }}>
              Puedes ver los datos en tiempo real en IODA directamente.
            </div>
            <a href="https://ioda.inetintel.cc.gatech.edu/country/VE" target="_blank" rel="noopener noreferrer"
              style={{ fontSize:13, fontFamily:font, color:ACCENT, textDecoration:"none", padding:"6px 14px", border:`1px solid ${ACCENT}30`, borderRadius:4 }}>↗ IODA Venezuela</a>
          </div></Card>
        )}

        {/* Signal descriptions */}
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:12, marginTop:12 }}>
          {[{title:"BGP Routes",desc:"Rutas de red anunciadas. Una caída indica pérdida de conectividad upstream. Venezuela tiene ~4.500 prefijos BGP.",color:"#7c3aed"},
            {title:"Active Probing",desc:"Sondeo activo de ~85K hosts venezolanos. Mide reachability real de dispositivos finales.",color:"#f59e0b"},
            {title:"Network Telescope",desc:"Tráfico de fondo. Caídas abruptas indican interrupciones masivas a nivel de infraestructura.",color:"#dc2626"}
          ].map((s,i) => (
            <Card key={i} accent={s.color}><div style={{ fontSize:13, fontWeight:600, color:s.color, marginBottom:4 }}>{s.title}</div>
              <div style={{ fontSize:12, color:MUTED, lineHeight:1.5 }}>{s.desc}</div></Card>
          ))}
        </div>
      </>)}

      {/* ══════ ESTADOS ══════ */}
      {subView === "estados" && (() => {
        return (<>
        {regionLoading ? (
          <Card><div style={{ textAlign:"center", padding:40, color:MUTED, fontSize:14, fontFamily:font }}>
            <div style={{ fontSize:20, marginBottom:8 }}>🗺</div>Cargando datos por estado...<div style={{ fontSize:12, marginTop:4, color:`${MUTED}80` }}>24 estados · Probing + BGP · puede tardar 15-20s</div>
          </div></Card>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 320px", gap:14 }}>
            {/* Leaflet Map */}
            <Card accent="#7c3aed">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, flexWrap:"wrap", gap:8 }}>
                <div style={{ fontSize:13, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
                  Mapa de Interrupciones · {timeLabel}
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <button
                    onClick={() => { setSelectedState(null); setRegionScores([]); loadRegions(); }}
                    disabled={regionLoading}
                    style={{ fontSize:11, fontFamily:font, padding:"4px 10px", background:"transparent",
                      border:`1px solid ${BORDER}`, color:regionLoading ? `${MUTED}40` : MUTED,
                      cursor:regionLoading ? "wait" : "pointer", borderRadius:3 }}>
                    ↻ Actualizar
                  </button>
                  <button onClick={() => { setExportOpen(true); setExportError(null); }}
                    style={{ fontSize:11, fontFamily:font, padding:"4px 10px", background:"transparent",
                      border:`1px solid ${BORDER}`, color:MUTED, cursor:"pointer", borderRadius:3 }}>
                    ⬇ Exportar XLSX
                  </button>
                </div>
              </div>
              <div style={{ display:"flex", gap:12, marginBottom:6, flexWrap:"wrap" }}>
                <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>
                  Score acumulado · Color = severidad · Tamaño = impacto
                  {regionLoading && " · ⏳ cargando datos..."}
                </span>
                <div style={{ display:"flex", gap:8, marginLeft:"auto" }}>
                  {[{l:"Normal",c:"#34d399"},{l:"Degradado",c:"#fbbf24"},{l:"Alto",c:"#f97316"},{l:"Crítico",c:"#ef4444"}].map(lg => (
                    <div key={lg.l} style={{ display:"flex", alignItems:"center", gap:3 }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:lg.c }} />
                      <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>{lg.l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <IODALeafletMap regionScores={activeData} selectedState={selectedState} timePreset={timePreset}
                onSelectState={s => setSelectedState(selectedState === s ? null : s)} />
            </Card>

            {/* Rankings */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {/* Selected state detail */}
              {selectedState && (() => {
                const rd = activeData.find(r => r.name === selectedState);
                if (!rd) return <Card><div style={{ fontSize:12, color:MUTED }}>Sin datos para {selectedState}</div></Card>;
                const srcOrder = ["probing", "loss", "latency", "bgp", "telescope"];
                const srcLabels = { probing: "Sondeo Activo", bgp: "BGP Routes", telescope: "Telescopio", loss: "Packet Loss", latency: "Latencia" };
                const srcEmojis = { probing: "📡", bgp: "🌐", telescope: "🔭", loss: "📉", latency: "⏱" };
                const elecColor = rd.elecHealth >= 90 ? "#34d399" : rd.elecHealth >= 60 ? "#fbbf24" : rd.elecHealth >= 40 ? "#f97316" : "#ef4444";
                return (<>
                  {/* Dual index header */}
                  <Card accent={getSeverityColor(rd.connectivityHealth)}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:TEXT }}>{rd.name}</div>
                      <div style={{ display:"flex", gap:6 }}>
                        <Badge color={getSeverityColor(rd.connectivityHealth)}>Internet</Badge>
                        <Badge color={elecColor}>Electricidad</Badge>
                      </div>
                    </div>
                    {/* Two index boxes side by side */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                      {/* Connectivity */}
                      <div style={{ padding:"8px 10px", borderRadius:4, border:`1px solid ${getSeverityColor(rd.connectivityHealth)}30`, background:`${getSeverityColor(rd.connectivityHealth)}08` }}>
                        <div style={{ fontSize:10, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>🌐 Conectividad</div>
                        <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                          <span style={{ fontSize:24, fontWeight:900, fontFamily:"'Playfair Display',serif", color:getSeverityColor(rd.connectivityHealth) }}>{rd.connectivityHealth}%</span>
                          {rd.connectivityScore > 0 && <span style={{ fontSize:10, color:MUTED }}>Score: {fmtVal(rd.connectivityScore)}</span>}
                        </div>
                      </div>
                      {/* Electricity */}
                      <div style={{ padding:"8px 10px", borderRadius:4, border:`1px solid ${elecColor}30`, background:`${elecColor}08` }}>
                        <div style={{ fontSize:10, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>⚡ Electricidad</div>
                        <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                          <span style={{ fontSize:24, fontWeight:900, fontFamily:"'Playfair Display',serif", color:elecColor }}>{rd.elecHealth}%</span>
                        </div>
                        <div style={{ fontSize:10, color:elecColor, fontWeight:600 }}>
                          {rd.elecLabel}{rd.elecEvents > 0 ? ` · ${rd.elecEvents} evento${rd.elecEvents > 1 ? "s" : ""}` : ""}
                          {rd.teleCoincidence && " · 🔭"}
                          {rd.elecConfidence && rd.elecHealth < 100 && <span style={{ marginLeft:4, fontSize:9, padding:"1px 4px", borderRadius:3, background: rd.elecConfidence === "alta" ? "#16a34a20" : rd.elecConfidence === "media" ? "#ca8a0420" : "#ef444420", color: rd.elecConfidence === "alta" ? "#16a34a" : rd.elecConfidence === "media" ? "#ca8a04" : "#ef4444" }}>confianza {rd.elecConfidence}</span>}
                        </div>
                      </div>
                    </div>
                    {/* Per-source indicators */}
                    <div style={{ display:"flex", flexDirection:"column", gap:3, marginBottom:8 }}>
                      {srcOrder.map(src => {
                        const d = rd.perSource?.[src];
                        if (!d) return (
                          <div key={src} style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:`${MUTED}80`, padding:"2px 0" }}>
                            <span>{srcEmojis[src]} {srcLabels[src]}</span><span>—</span>
                          </div>
                        );
                        const c = getSeverityColor(d.health);
                        const detail = src === "loss" ? `${d.current}% (normal <${d.baseline}%)` :
                                       src === "latency" ? `${d.current}ms (base ${d.baseline}ms)` :
                                       src === "bgp" && d.current === 0 && d.baseline === 0 ? "Estable" :
                                       `(${d.current}/${d.baseline})`;
                        return (
                          <div key={src} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, padding:"2px 0", borderBottom:`1px solid ${BORDER}15` }}>
                            <span style={{ color:TEXT }}>{srcEmojis[src]} {srcLabels[src]}</span>
                            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                              <div style={{ width:36, height:4, background:`${BORDER}30`, borderRadius:2, overflow:"hidden" }}>
                                <div style={{ width:`${d.health}%`, height:4, background:c, borderRadius:2 }} />
                              </div>
                              <span style={{ fontWeight:700, color:c, minWidth:28, textAlign:"right", fontSize:10 }}>{d.health}%</span>
                              <span style={{ color:MUTED, fontSize:9 }}>{detail}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Electricity events detail */}
                    {rd.powerEvents && rd.powerEvents.length > 0 && (
                      <div style={{ fontSize:10, color:TEXT, padding:"6px 8px", background:`${elecColor}08`, borderRadius:4, borderLeft:`3px solid ${elecColor}`, marginBottom:6 }}>
                        <div style={{ fontWeight:600, marginBottom:3 }}>⚡ Eventos eléctricos detectados:</div>
                        {rd.powerEvents.slice(0, 5).map((ev, i) => (
                          <div key={i} style={{ color:MUTED, padding:"1px 0" }}>
                            {fmtTime(ev.ts)} · −{ev.dropPct}% · {fmtDuration(ev.durationSec)}
                            {!ev.recovered && " · ⚠ en curso"}
                            {ev.isNational && ev.nationalSeverity === "network_mild" && <span style={{ color:"#2563eb" }}> · 🌐 red (avg −{ev.nationalAvgDrop}%)</span>}
                            {ev.isNational && ev.nationalSeverity === "blackout_moderate" && <span style={{ color:"#f97316" }}> · ⚡ nacional (avg −{ev.nationalAvgDrop}%)</span>}
                            {ev.isNational && ev.nationalSeverity === "blackout_severe" && <span style={{ color:"#ef4444" }}> · ⚡⚡ nacional severo (avg −{ev.nationalAvgDrop}%)</span>}
                            {!ev.isNational && <span style={{ color:"#7c3aed" }}> · 📍 regional</span>}
                          </div>
                        ))}
                        {rd.bgpStable && <div style={{ color:"#34d399", marginTop:3 }}>✓ BGP estable — patrón consistente con interrupción eléctrica</div>}
                        {!rd.bgpStable && <div style={{ color:"#f97316", marginTop:3 }}>⚠ BGP inestable — posible corte deliberado</div>}
                      </div>
                    )}
                    {/* Interpretation */}
                    {(() => {
                      const interp = interpretPattern(rd.perSource, rd.teleCoincidence ? 1.5 : 1);
                      return (
                        <div style={{ fontSize:11, color:TEXT, lineHeight:1.5, padding:"6px 8px", background:`${BORDER}10`, borderRadius:4, borderLeft:`3px solid ${getSeverityColor(rd.connectivityHealth)}` }}>
                          <span style={{ marginRight:4 }}>{interp.emoji}</span>{interp.text}
                        </div>
                      );
                    })()}
                  </Card>
                </>);
              })()}

              {/* Ranking table — dual index */}
              <Card accent="#f59e0b">
                <div style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:13, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
                      Ranking por Estado · {timeLabel}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      {regionLoading && <span style={{ fontSize:9, fontFamily:font, color:"#a17d08" }}>⏳ fase 1...</span>}
                      {rawEnriching && (
                        <span style={{ fontSize:9, fontFamily:font, color:"#7c3aed", display:"flex", alignItems:"center", gap:4 }}>
                          🔬 refinando señal cruda · {rawProgress.current}/{rawProgress.total}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Phase 2 progress bar — only visible while enriching */}
                  {(rawEnriching || (rawProgress.total > 0 && rawProgress.current < rawProgress.total)) && (
                    <div style={{ marginTop:5 }}>
                      <div style={{ height:3, background:`${BORDER}30`, borderRadius:2, overflow:"hidden" }}>
                        <div style={{
                          height:3,
                          width: rawProgress.total > 0 ? `${Math.round((rawProgress.current / rawProgress.total) * 100)}%` : "0%",
                          background:"linear-gradient(90deg, #7c3aed, #a855f7)",
                          borderRadius:2, transition:"width 0.5s ease"
                        }} />
                      </div>
                      <div style={{ fontSize:9, fontFamily:font, color:`${MUTED}70`, marginTop:2 }}>
                        Análisis de señal cruda + telescopio · los scores se actualizan al completarse
                      </div>
                    </div>
                  )}
                </div>
                {activeData.length === 0 ? (
                  <div style={{ fontSize:12, color:MUTED, padding:8 }}>Cargando...</div>
                ) : (<>
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 8px", borderBottom:`1px solid ${BORDER}`, marginBottom:4 }}>
                    <span style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase", flex:1 }}>Región</span>
                    <span style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase", width:55, textAlign:"center" }}>🌐 Internet</span>
                    <span style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase", width:80, textAlign:"center" }}>⚡ Elec.</span>
                  </div>
                  <div style={{ maxHeight:400, overflowY:"auto" }}>
                    {activeData.map((r, i) => {
                      const elecC = r.elecHealth >= 90 ? "#34d399" : r.elecHealth >= 60 ? "#fbbf24" : r.elecHealth >= 40 ? "#f97316" : "#ef4444";
                      // R7: confidence badge
                      const confColor = r.elecConfidence === "alta" ? "#16a34a" : r.elecConfidence === "media" ? "#ca8a04" : "#94a3b8";
                      const confLabel = r.elecConfidence === "alta" ? "A" : r.elecConfidence === "media" ? "M" : "B";
                      const prior = getPrior(r.name);
                      // R3: abrupt pattern from worst event
                      const hasAbrupt = r.powerEvents?.some(ev => ev.isAbrupt && ev.dropPct >= 15 && !ev.bgpAlsoDown);
                      return (
                        <div key={r.code}
                          onClick={() => setSelectedState(selectedState === r.name ? null : r.name)}
                          title={r.elecScore > 0 ? `Score eléctrico: ${r.elecScore}${r.elecConfidence ? ` · Confianza ${r.elecConfidence}` : ""}${hasAbrupt ? " · Caída abrupta" : ""}` : ""}
                          style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 8px",
                            background: selectedState === r.name ? `${ACCENT}15`
                              : r.elecHealth < 80 && prior.tier === 1 ? `#ef444408`
                              : r.elecHealth < 80 && prior.tier === 2 ? `#f9731608`
                              : i % 2 ? "rgba(0,0,0,0.02)" : "transparent",
                            cursor:"pointer", borderRadius:3,
                            borderLeft: r.elecHealth < 80 && prior.tier === 1 ? "2px solid #ef444440"
                              : r.elecHealth < 80 && prior.tier === 2 ? "2px solid #f9731640"
                              : "2px solid transparent" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:5, flex:1, minWidth:0 }}>
                            <span style={{ width:7, height:7, borderRadius:"50%", background:getSeverityColor(r.connectivityHealth), flexShrink:0 }} />
                            <span style={{ fontSize:12, color:TEXT, fontWeight:r.connectivityHealth < 70 ? 700 : 400, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.name}</span>
                            {(() => {
                              const p = getPrior(r.name);
                              if (p.tier === 0) return null;
                              const tierColor = p.tier === 1 ? "#ef4444" : p.tier === 2 ? "#f97316" : "#fbbf24";
                              const tierBg = p.tier === 1 ? "#fef2f2" : p.tier === 2 ? "#fff7ed" : "#fffbeb";
                              return (
                                <span title={`Racionamiento T${p.tier}: ~${p.hoursPerDay}h/día`}
                                  style={{ fontSize:7, fontFamily:font, padding:"1px 3px", borderRadius:2,
                                    background:tierBg, color:tierColor, flexShrink:0, lineHeight:1.2, fontWeight:700 }}>
                                  T{p.tier}
                                </span>
                              );
                            })()}
                            {r.teleDetected && (
                              <span title="Detectado por telescopio de red"
                                style={{ fontSize:7, fontFamily:font, padding:"1px 3px", borderRadius:2,
                                  background:"#7c3aed20", color:"#7c3aed", flexShrink:0, lineHeight:1.2 }}>📡</span>
                            )}
                            {r.rawDetectedNew && !r.teleDetected && (
                              <span title="Detectado por señal cruda (sub-umbral IODA)"
                                style={{ fontSize:7, fontFamily:font, padding:"1px 3px", borderRadius:2,
                                  background:"#0891b220", color:"#0891b2", flexShrink:0, lineHeight:1.2 }}>RAW</span>
                            )}
                          </div>
                          <div style={{ width:55, textAlign:"center" }}>
                            <span style={{ fontSize:12, fontWeight:700, fontFamily:font, color:getSeverityColor(r.connectivityHealth) }}>
                              {r.connectivityHealth}%
                            </span>
                          </div>
                          <div style={{ width:80, textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap:3 }}>
                            <span style={{ fontSize:12, fontWeight:700, fontFamily:font, color:elecC }}>
                              {r.elecHealth}%
                            </span>
                            {r.elecEvents > 0 && <span style={{ fontSize:8, color:elecC }}>⚡{r.elecEvents}</span>}
                            {/* R7: confidence badge — only shown when there's an electric event */}
                            {r.elecConfidence && r.elecHealth < 100 && (
                              <span title={`Confianza ${r.elecConfidence}${hasAbrupt ? " · patrón abrupto" : ""}`}
                                style={{ fontSize:8, fontFamily:font, fontWeight:700, padding:"1px 3px",
                                  borderRadius:2, background:`${confColor}25`, color:confColor, lineHeight:1.2 }}>
                                {confLabel}{hasAbrupt ? "↓" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* R5+R7: legend */}
                  <div style={{ fontSize:9, fontFamily:font, color:`${MUTED}80`, marginTop:5, padding:"4px 8px",
                    borderTop:`1px solid ${BORDER}40`, display:"flex", gap:10, flexWrap:"wrap" }}>
                    <span>⚡N = N° eventos</span>
                    <span>A/M/B = confianza</span>
                    <span>↓ = caída abrupta</span>
                    <span>T1/T2/T3 = tier racionamiento</span>
                    <span>📡 = telescopio · RAW = señal cruda</span>
                  </div>
                </>)}
              </Card>
            </div>
          </div>
        )}
      </>);
      })()}

      {/* ══════ EVENTOS ══════ */}
      {subView === "eventos" && (
        <Card accent="#f59e0b">
          {/* Period navigation */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:8 }}>
            <div style={{ fontSize:13, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
              Eventos Detectados
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <button onClick={() => { setEventsBack(b => b + 1); setExpandedEvent(null); }}
                style={{ fontSize:11, fontFamily:font, padding:"4px 10px", background:"transparent",
                  border:`1px solid ${BORDER}`, color:MUTED, cursor:"pointer", borderRadius:3 }}>
                ← Anterior
              </button>
              <span style={{ fontSize:11, fontFamily:font, color:MUTED, minWidth:90, textAlign:"center" }}>
                {eventsBack === 0 ? "Período actual" : `−${eventsBack} período${eventsBack > 1 ? "s" : ""}`}
              </span>
              <button onClick={() => { setEventsBack(b => Math.max(0, b - 1)); setExpandedEvent(null); }}
                disabled={eventsBack === 0}
                style={{ fontSize:11, fontFamily:font, padding:"4px 10px", background:"transparent",
                  border:`1px solid ${BORDER}`, color:eventsBack === 0 ? `${MUTED}30` : MUTED,
                  cursor:eventsBack === 0 ? "default" : "pointer", borderRadius:3 }}>
                Siguiente →
              </button>
              <button onClick={() => { setExportOpen(true); setExportError(null); }}
                style={{ fontSize:11, fontFamily:font, padding:"4px 10px", background:"transparent",
                  border:`1px solid ${BORDER}`, color:MUTED, cursor:"pointer", borderRadius:3 }}>
                ⬇ Exportar XLSX
              </button>
              <span style={{ fontSize:11, fontFamily:font, color:events.length > 0 ? "#dc2626" : MUTED }}>
                {events.length} detectados
              </span>
            </div>
          </div>

          {/* Period date label when navigating back */}
          {eventsBack > 0 && (() => {
            const periodLen = twUntil - twFrom;
            const evFrom  = twFrom  - eventsBack * periodLen;
            const evUntil = twUntil - eventsBack * periodLen;
            const fmt = ts => new Date(ts * 1000).toLocaleString("es-VE", { timeZone:"America/Caracas",
              month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", hour12:false });
            return (
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, marginBottom:8,
                padding:"3px 8px", background:`${BORDER}15`, borderRadius:3 }}>
                📅 {fmt(evFrom)} — {fmt(evUntil)}
              </div>
            );
          })()}

          {/* State filter chips */}
          {events.length > 0 && (() => {
            const stateList = ["Todos",
              ...Array.from(new Set(events.map(e => e.region).filter(r => r !== "🇻🇪 Nacional"))).sort(),
              "🇻🇪 Nacional"];
            return (
              <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10,
                paddingBottom:8, borderBottom:`1px solid ${BORDER}30` }}>
                <span style={{ fontSize:10, fontFamily:font, color:MUTED, alignSelf:"center",
                  letterSpacing:"0.08em", flexShrink:0 }}>ESTADO:</span>
                {stateList.map(s => {
                  const isAll  = s === "Todos";
                  const active = isAll ? eventsStateFilter === null : eventsStateFilter === s;
                  return (
                    <button key={s}
                      onClick={() => setEventsStateFilter(isAll ? null : eventsStateFilter === s ? null : s)}
                      style={{ fontSize:10, fontFamily:font, padding:"2px 8px", borderRadius:12,
                        background: active ? ACCENT : `${BORDER}20`,
                        color: active ? "#fff" : MUTED,
                        border: active ? `1px solid ${ACCENT}` : `1px solid ${BORDER}40`,
                        cursor:"pointer", whiteSpace:"nowrap" }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {events.length === 0 ? (
            <div style={{ textAlign:"center", padding:"30px 0", color:MUTED, fontSize:13 }}>
              No se detectaron eventos de interrupción en este período.
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:font }}>
                <thead>
                  <tr style={{ borderBottom:`2px solid ${BORDER}` }}>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:MUTED, fontWeight:600 }}>Fecha</th>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:MUTED, fontWeight:600 }}>Región</th>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:MUTED, fontWeight:600 }}>Duración</th>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:MUTED, fontWeight:600 }}>Fuente</th>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:MUTED, fontWeight:600 }}>Severidad</th>
                    <th style={{ padding:"6px 8px", textAlign:"right", color:MUTED, fontWeight:600 }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {events.filter(ev => !eventsStateFilter || ev.region === eventsStateFilter).map((ev, i) => {
                    const sevColor = ev.condition === "critical" ? "#ef4444" : ev.condition === "high" ? "#f97316" : "#fbbf24";
                    const dsColor = ev.datasource === "bgp" ? "#7c3aed" : ev.datasource === "probing" || ev.datasource === "ping-slash24" ? "#f59e0b" : "#dc2626";
                    const dsLabel = ev.datasource === "bgp" ? "BGP" : ev.datasource === "probing" || ev.datasource === "ping-slash24" ? "SONDEO" : ev.datasource === "telescope" ? "TELESCOPIO" : ev.datasource === "packet-loss" ? "LOSS" : (ev.datasource || "?").toUpperCase();
                    const isExpanded = expandedEvent === i;
                    const explain = (() => {
                      const region = ev.region === "🇻🇪 Nacional" ? "a nivel nacional" : `en ${ev.region}`;
                      const src = ev.datasource === "probing" || ev.datasource === "ping-slash24" ? "sondeo activo"
                        : ev.datasource === "bgp" ? "rutas BGP" : ev.datasource === "telescope" ? "telescopio de red" : ev.datasource;
                      const sev = ev.condition === "critical" ? "Evento crítico" : ev.condition === "high" ? "Evento significativo" : "Evento moderado";
                      const dur = ev.duration ? `Duración: ${fmtDuration(ev.duration)}.` : "Evento posiblemente en curso.";
                      let cause = ev.datasource === "ping-slash24"
                        ? (ev.score > 3000 ? "Score alto — consistente con corte severo. Si BGP estable, posible interrupción eléctrica regional."
                          : ev.score > 500 ? "Score moderado — interrupción significativa. Posible falla eléctrica parcial o falla de CANTV."
                          : "Score bajo — interrupción breve o fluctuación de red.")
                        : ev.datasource === "bgp"
                          ? "Evento BGP — el proveedor dejó de anunciar prefijos. Más consistente con corte deliberado que con interrupción eléctrica."
                          : "Anomalía detectada por IODA en este indicador.";
                      return `${sev} ${region} detectado en ${src}. Score IODA: ${fmtVal(ev.score || ev.value)}. ${dur} ${cause}`;
                    })();
                    return (
                      <React.Fragment key={i}>
                        <tr onClick={() => { setExpandedEvent(isExpanded ? null : i); setFocusEvent(ev.time); if (ev.region !== "🇻🇪 Nacional") setSelectedState(ev.region); }}
                          style={{ borderBottom: isExpanded ? "none" : `1px solid ${BORDER}30`, cursor:"pointer", background: isExpanded ? `${ACCENT}06` : "transparent" }}
                          onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = `${ACCENT}08`; }}
                          onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}>
                          <td style={{ padding:"8px" }}><div style={{ color:TEXT, fontWeight:600 }}>{ev.time ? fmtTime(ev.time) : "—"}</div></td>
                          <td style={{ padding:"8px" }}>
                            <span style={{ fontSize:11, color: ev.region === "🇻🇪 Nacional" ? "#7c3aed" : TEXT, fontWeight: ev.region === "🇻🇪 Nacional" ? 600 : 400 }}>
                              {ev.region || "—"}
                            </span>
                          </td>
                          <td style={{ padding:"8px", color:MUTED, fontSize:11 }}>{ev.duration ? fmtDuration(ev.duration) : "en curso"}</td>
                          <td style={{ padding:"8px" }}><Badge color={dsColor}>{dsLabel}</Badge></td>
                          <td style={{ padding:"8px" }}>
                            <span style={{ fontSize:12, fontWeight:700, color:sevColor, textTransform:"uppercase" }}>
                              {ev.condition === "critical" ? "CRÍTICO" : ev.condition === "high" ? "ALTO" : "MEDIO"}
                            </span>
                          </td>
                          <td style={{ padding:"8px", textAlign:"right" }}>
                            <span style={{ fontWeight:700, color:sevColor, fontSize:13 }}>{fmtVal(ev.score || ev.value)}</span>
                            {ev.duration > 0 && <div style={{ fontSize:10, color:MUTED }}>{fmtDuration(ev.duration)}</div>}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr style={{ borderBottom:`1px solid ${BORDER}30` }}>
                            <td colSpan={6} style={{ padding:"8px 12px 12px", background:`${ACCENT}04` }}>
                              <div style={{ fontSize:12, color:TEXT, lineHeight:1.6, borderLeft:`3px solid ${sevColor}`, paddingLeft:10 }}>{explain}</div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ fontSize:10, color:`${MUTED}60`, marginTop:8, display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:4 }}>
            <span>Click en un evento para ver en la gráfica · Incluye eventos nacionales y regionales</span>
            {eventsStateFilter && (
              <span style={{ color:MUTED }}>
                Filtrado: {eventsStateFilter} ·{" "}
                <button onClick={() => setEventsStateFilter(null)}
                  style={{ fontSize:10, fontFamily:font, background:"none", border:"none", color:ACCENT, cursor:"pointer", padding:0 }}>
                  ver todos
                </button>
              </span>
            )}
          </div>
        </Card>
      )}

            {/* Interactive temporal chart — selected state */}
            {selectedState && selectedStateData?.series?.length > 10 && (() => {
              const palette = ["#2563eb","#dc2626","#f59e0b","#7c3aed","#059669","#ec4899","#84cc16","#06b6d4"];
              
              // Build chart states from selectedStateData
              const chartStates = [{ ...selectedStateData, healthPct: activeData.find(r => r.name === selectedState)?.connectivityHealth || 100 }];

              return (
                <Card accent="#2563eb" style={{ marginTop: 14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, flexWrap:"wrap", gap:6 }}>
                    <div style={{ fontSize:13, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
                      Conectividad Temporal · {timeLabel}
                    </div>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <select value={selectedState || ""} onChange={e => setSelectedState(e.target.value || null)}
                        style={{ fontSize:11, fontFamily:font, padding:"3px 8px", border:`1px solid ${BORDER}`, background:"transparent", color:TEXT, borderRadius:3 }}>
                        <option value="">Top afectados</option>
                        {activeData.map(r => <option key={r.code} value={r.name}>{r.name} ({r.connectivityHealth}%)</option>)}
                      </select>
                    </div>
                  </div>
                  <InteractiveChart states={chartStates} timePreset={timePreset} selectedState={selectedState}
                    onSelectState={s => setSelectedState(selectedState === s ? null : s)} palette={palette}
                    events={events} focusEvent={focusEvent} onClearFocus={() => setFocusEvent(null)} />
                  
                  {/* Per-source breakdown for selected state */}
                  {(() => {
                    const series = selectedStateData.series;
                    const sparkSources = [
                      { key:"probing", label:"Sondeo Activo", color:"#f59e0b", invert:false },
                      { key:"lossPct", label:"Packet Loss %", color:"#dc2626", invert:true },
                      { key:"medianLatency", label:"Latencia (ms)", color:"#7c3aed", invert:true },
                      { key:"bgp", label:"BGP Routes", color:"#7c3aed", invert:false },
                      { key:"telescope", label:"Telescopio", color:"#dc2626", invert:false },
                    ];
                    return (
                      <div style={{ marginTop:12, borderTop:`1px solid ${BORDER}30`, paddingTop:10 }}>
                        <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>
                          {selectedState} — Desglose por indicador
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:8 }}>
                          {sparkSources.map(({ key: src, label, color, invert }) => {
                            const vals = series.map(p => p[src]).filter(v => v !== null && typeof v === "number");
                            if (vals.length < 5) return (
                              <div key={src} style={{ padding:8, background:`${BORDER}08`, borderRadius:4, borderLeft:`3px solid ${MUTED}30` }}>
                                <div style={{ fontSize:11, fontWeight:600, color:MUTED }}>{label}</div>
                                <div style={{ fontSize:10, color:`${MUTED}60`, marginTop:4 }}>Sin datos suficientes</div>
                              </div>
                            );
                            const sortedV = [...vals].sort((a,b) => a - b);
                            const current = vals[vals.length - 1];
                            let health, baseRef;
                            if (invert) {
                              // For loss/latency: lower is better. Health = 100 when at P10, 0 when at 3× P10
                              const p10 = sortedV[Math.floor(sortedV.length * 0.1)] || 1;
                              baseRef = p10;
                              health = src === "lossPct"
                                ? (current > 60 ? 30 : current > 40 ? 50 : current > 25 ? 70 : current > 15 ? 85 : 100)
                                : (p10 > 0 ? Math.max(0, Math.min(100, Math.round(100 - ((current / p10 - 1) * 50)))) : 100);
                            } else {
                              const p95 = sortedV[Math.floor(sortedV.length * 0.95)] || sortedV[sortedV.length - 1] || 1;
                              baseRef = p95;
                              health = p95 > 0 ? Math.min(100, Math.round((current / p95) * 100)) : 100;
                            }
                            // Mini sparkline
                            const W2 = 200, H2 = 40, pL2 = 2, pR2 = 2, pT2 = 2, pB2 = 2;
                            const cW2 = W2-pL2-pR2, cH2 = H2-pT2-pB2;
                            const mn = Math.min(...vals), mx = Math.max(...vals);
                            let spark = "";
                            series.forEach((p, i) => {
                              const v = p[src]; if (v === null || typeof v !== "number") return;
                              const x = pL2 + (i / (series.length - 1)) * cW2;
                              const y = pT2 + cH2 - ((v - mn) / (mx - mn || 1)) * cH2;
                              spark += spark === "" ? `M${x},${y}` : ` L${x},${y}`;
                            });
                            const unit = src === "lossPct" ? "%" : src === "medianLatency" ? "ms" : "";
                            return (
                              <div key={src} style={{ padding:8, background:`${BORDER}08`, borderRadius:4, borderLeft:`3px solid ${color}` }}>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                  <span style={{ fontSize:11, fontWeight:600, color }}>{label}</span>
                                  <span style={{ fontSize:13, fontWeight:900, color:getSeverityColor(health) }}>{health}%</span>
                                </div>
                                <svg width="100%" viewBox={`0 0 ${W2} ${H2}`} style={{ display:"block", marginTop:4 }}>
                                  <path d={spark} fill="none" stroke={color} strokeWidth={1.5} />
                                </svg>
                                <div style={{ fontSize:9, color:MUTED, marginTop:2 }}>
                                  {invert ? `Actual: ${fmtVal(current)}${unit} · Base: ${fmtVal(baseRef)}${unit}` : `Base: ${fmtVal(baseRef)} · Actual: ${fmtVal(current)}`}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </Card>
              );
            })()}
            {/* State selector prompt when no state selected */}
            {!selectedState && activeData.length > 0 && (
              <Card accent="#2563eb" style={{ marginTop: 14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:13, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
                    Conectividad Temporal
                  </div>
                  <select value="" onChange={e => setSelectedState(e.target.value || null)}
                    style={{ fontSize:11, fontFamily:font, padding:"4px 10px", border:`1px solid ${BORDER}`, background:"transparent", color:TEXT, borderRadius:3 }}>
                    <option value="">Seleccionar estado para gráfica...</option>
                    {activeData.map(r => <option key={r.code} value={r.name}>{r.name} ({r.connectivityHealth}%)</option>)}
                  </select>
                </div>
              </Card>
            )}
            {/* Loading indicator for selected state */}
            {selectedState && selectedStateLoading && (
              <Card accent="#2563eb" style={{ marginTop: 14 }}>
                <div style={{ textAlign:"center", padding:30, color:MUTED, fontSize:13, fontFamily:font }}>⏳ Cargando datos temporales de {selectedState}...</div>
              </Card>
            )}

            {/* ── Explicar con IA (visible in all subviews) ── */}
      <Card accent={ACCENT} style={{ marginTop:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:aiExplain ? 10 : 0 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:TEXT }}>🤖 Análisis de Conectividad con IA</div>
            <div style={{ fontSize:11, color:MUTED }}>Genera un análisis contextual de la situación actual</div>
          </div>
          <button onClick={explainWithAI} disabled={aiLoading}
            style={{ fontSize:12, fontFamily:font, padding:"6px 14px", background:aiLoading?"transparent":ACCENT,
              color:aiLoading?MUTED:"#fff", border:aiLoading?`1px solid ${BORDER}`:"none", cursor:aiLoading?"wait":"pointer", borderRadius:4 }}>
            {aiLoading ? "Analizando..." : "Explicar situación"}
          </button>
        </div>
        {aiExplain && (
          <div style={{ fontSize:13, color:TEXT, lineHeight:1.7, whiteSpace:"pre-wrap", borderTop:`1px solid ${BORDER}30`, paddingTop:10 }}>
            {aiExplain}
          </div>
        )}
      </Card>

      {/* ── VeSinFiltro ── */}
      <Card accent="#1d9bf0" style={{ marginTop:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:TEXT }}>𝕏 @VeSinFiltro</div>
            <div style={{ fontSize:12, color:MUTED }}>Reportes de censura y bloqueos de internet en Venezuela</div>
          </div>
          <a href="https://x.com/vesinfiltro" target="_blank" rel="noopener noreferrer"
            style={{ fontSize:12, fontFamily:font, color:"#1d9bf0", textDecoration:"none", padding:"4px 12px", border:"1px solid rgba(29,155,240,0.3)", borderRadius:4 }}>Ver en 𝕏</a>
        </div>
        <TwitterTimeline handle="vesinfiltro" height={400} />
      </Card>

      <div style={{ marginTop:12, display:"flex", justifyContent:"space-between", fontSize:10, fontFamily:font, color:`${MUTED}80`, lineHeight:1.8 }}>
        <span>Fuente: IODA · Georgia Tech INETINTEL · CC BY 4.0</span>
        <span>Última actualización: {signals ? fmtTime(signals[signals.length-1]?.ts) : "—"}</span>
      </div>
    </div>
  );
}
