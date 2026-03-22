import { useState, useEffect, useCallback, useRef } from "react";
import { BORDER, TEXT, MUTED, ACCENT, font, fontSans } from "../../constants";
import { IS_DEPLOYED, CORS_PROXIES } from "../../utils";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Badge } from "../Badge";
import { Card } from "../Card";
import { TwitterTimeline } from "../TwitterTimeline";
import { loadScript, loadCSS } from "../../utils";

// ── IODA Venezuelan state FIPS codes ──
const VE_REGIONS = [
  { code:"4001", name:"Amazonas" }, { code:"4002", name:"Anzoátegui" }, { code:"4003", name:"Apure" },
  { code:"4004", name:"Aragua" }, { code:"4005", name:"Barinas" }, { code:"4006", name:"Bolívar" },
  { code:"4007", name:"Carabobo" }, { code:"4008", name:"Cojedes" }, { code:"4009", name:"Delta Amacuro" },
  { code:"4010", name:"Distrito Capital" }, { code:"4011", name:"Falcón" }, { code:"4012", name:"Guárico" },
  { code:"4013", name:"Lara" }, { code:"4014", name:"Mérida" }, { code:"4015", name:"Miranda" },
  { code:"4016", name:"Monagas" }, { code:"4017", name:"Nueva Esparta" }, { code:"4018", name:"Portuguesa" },
  { code:"4019", name:"Sucre" }, { code:"4020", name:"Táchira" }, { code:"4021", name:"Trujillo" },
  { code:"4022", name:"Vargas" }, { code:"4023", name:"Yaracuy" }, { code:"4024", name:"Zulia" },
];

const IODA_BASE = "https://api.ioda.inetintel.cc.gatech.edu/v2";
const hoursMap = { "24h":24, "48h":48, "7d":168, "30d":720 };

// ── Helper: fetch with cascade (Vercel proxy → CORS proxies) ──
async function iodaFetch(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const directUrl = `${IODA_BASE}/${path}${qs ? "?" + qs : ""}`;
  const vercelUrl = `/api/ioda?path=${encodeURIComponent(path)}&${qs}`;
  const urls = IS_DEPLOYED
    ? [() => vercelUrl, ...CORS_PROXIES.map(fn => () => fn(directUrl))]
    : CORS_PROXIES.map(fn => () => fn(directUrl));
  for (const getUrl of urls) {
    try {
      const res = await fetch(getUrl(), { signal: AbortSignal.timeout(12000), headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      return await res.json();
    } catch { continue; }
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
const fmtDuration = secs => { if (secs < 3600) return `${Math.round(secs/60)}m`; const h = Math.floor(secs/3600), m = Math.round((secs%3600)/60); return m > 0 ? `${h}h ${m}m` : `${h}h`; };

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

// ── Compute region scores: 3-layer approach ──
// Layer 1: Probing (primary signal) — P95 baseline, 10% noise threshold
// Layer 2: Loss/Latency (complementary) — penalizes high packet loss and latency spikes
// Layer 3: National telescope (amplifier) — boosts scores when national anomaly coincides
function computeRegionScore(parsed, nationalTelescopeData) {
  if (!parsed || parsed.length === 0) return null;
  
  // ── Layer 1: Probing ──
  const probVals = parsed.map(p => p.probing).filter(v => v !== null);
  if (probVals.length < 5) return null; // need probing as minimum
  
  const probSorted = [...probVals].sort((a,b) => a - b);
  const probP95 = probSorted[Math.floor(probSorted.length * 0.95)];
  if (probP95 < 10) return null;
  
  // Probing health: worst of last 6h (~36 points at 10min step)
  const probTail = probVals.slice(-Math.min(36, probVals.length));
  const probWorst = Math.min(...probTail);
  const probHealth = Math.min(100, Math.round((probWorst / probP95) * 100));
  
  // Probing score: sum drops >10% below P95 (noise threshold)
  const probThreshold = probP95 * 0.90;
  let probDropScore = 0;
  for (const v of probVals) {
    if (v < probThreshold) {
      probDropScore += Math.round(probP95 - v);
    }
  }
  
  // Current probing (avg last 5)
  const probRecent = probVals.slice(-5);
  const probCurrent = probRecent.reduce((a,b) => a+b, 0) / probRecent.length;
  const probLiveDrop = Math.max(0, Math.round(probP95 - probCurrent));
  
  // ── Layer 2: Loss & Latency ──
  const lossVals = parsed.map(p => p.lossPct).filter(v => v !== null);
  const latVals = parsed.map(p => p.medianLatency).filter(v => v !== null);
  
  let lossHealth = 100, lossPenalty = 0;
  let latHealth = 100, latPenalty = 0;
  let lossInfo = null, latInfo = null;
  
  if (lossVals.length >= 5) {
    // Loss: normal is <5%. Above 10% is degraded, above 25% is critical
    const lossTail = lossVals.slice(-Math.min(36, lossVals.length));
    const lossWorst = Math.max(...lossTail); // worst = highest loss
    const lossAvg = lossVals.reduce((a,b) => a+b, 0) / lossVals.length;
    lossHealth = lossWorst > 30 ? 30 : lossWorst > 20 ? 50 : lossWorst > 10 ? 70 : lossWorst > 5 ? 90 : 100;
    // Penalty: each point above 5% loss adds to score
    for (const v of lossVals) {
      if (v > 5) lossPenalty += Math.round((v - 5) * 10); // scale up for visibility
    }
    lossInfo = { health: lossHealth, current: Math.round(lossVals[lossVals.length-1] * 10) / 10, baseline: 5 };
  }
  
  if (latVals.length >= 5) {
    // Latency: compute P10 as "good" baseline, flag spikes above 2× baseline
    const latSorted = [...latVals].sort((a,b) => a - b);
    const latP10 = latSorted[Math.floor(latSorted.length * 0.1)];
    const latTail = latVals.slice(-Math.min(36, latVals.length));
    const latWorst = Math.max(...latTail);
    const latRatio = latP10 > 0 ? latWorst / latP10 : 1;
    latHealth = latRatio > 3 ? 40 : latRatio > 2 ? 60 : latRatio > 1.5 ? 80 : 100;
    // Penalty: each point with latency > 1.5× baseline
    const latThresh = latP10 * 1.5;
    for (const v of latVals) {
      if (v > latThresh) latPenalty += Math.round((v - latP10) / 10);
    }
    latInfo = { health: latHealth, current: Math.round(latVals[latVals.length-1]), baseline: Math.round(latP10) };
  }
  
  // ── Layer 3: National telescope amplifier (temporally coincident) ──
  // Only amplifies when national telescope AND regional probing drop at the SAME time
  let telescopeMultiplier = 1.0;
  if (nationalTelescopeData && nationalTelescopeData.length > 0 && parsed.length > 0) {
    const ntVals = nationalTelescopeData.filter(v => v !== null);
    if (ntVals.length > 10) {
      const ntSorted = [...ntVals].sort((a,b) => a - b);
      const ntP95 = ntSorted[Math.floor(ntSorted.length * 0.95)];
      if (ntP95 > 5) {
        // Find timestamps where probing dropped >10%
        const probDropTimes = new Set();
        for (const p of parsed) {
          const v = p.probing;
          if (v !== null && v < probP95 * 0.90) probDropTimes.add(p.ts);
        }
        if (probDropTimes.size > 0) {
          // Check if national telescope also dipped during those same timestamps (±30min)
          const ntStep = ntVals.length > 1 ? Math.round((parsed[parsed.length-1].ts - parsed[0].ts) / ntVals.length) : 600;
          let coincidentDrops = 0;
          for (let i = 0; i < ntVals.length; i++) {
            if (ntVals[i] < ntP95 * 0.80) { // national telescope >20% drop
              // Check if any probing drop within ±30min of this telescope reading
              const approxTs = parsed[0].ts + i * ntStep;
              for (const pt of probDropTimes) {
                if (Math.abs(pt - approxTs) < 1800) { coincidentDrops++; break; }
              }
            }
          }
          if (coincidentDrops >= 3) telescopeMultiplier = 1.8; // strong coincidence
          else if (coincidentDrops >= 1) telescopeMultiplier = 1.3; // mild coincidence
        }
      }
    }
  }
  
  // ── BGP (informational only — usually flat) ──
  const bgpVals = parsed.map(p => p.bgp).filter(v => v !== null);
  let bgpInfo = null;
  if (bgpVals.length >= 5) {
    const bgpSorted = [...bgpVals].sort((a,b) => a - b);
    const bgpP95 = bgpSorted[Math.floor(bgpSorted.length * 0.95)];
    if (bgpP95 >= 10) {
      const bgpCurrent = bgpVals[bgpVals.length - 1];
      const bgpHealth = Math.min(100, Math.round((bgpCurrent / bgpP95) * 100));
      bgpInfo = { health: bgpHealth, current: Math.round(bgpCurrent), baseline: Math.round(bgpP95) };
    }
  }
  
  // ── Telescope regional (low values but relative drops matter) ──
  const teleVals = parsed.map(p => p.telescope).filter(v => v !== null);
  let teleInfo = null, teleHealth = 100, telePenalty = 0;
  if (teleVals.length >= 5) {
    const teleSorted = [...teleVals].sort((a,b) => a - b);
    const teleP95 = teleSorted[Math.floor(teleSorted.length * 0.95)];
    if (teleP95 >= 0.5) { // very low threshold — even values of 1-2 are meaningful
      const teleTail = teleVals.slice(-Math.min(12, teleVals.length));
      const teleWorst = Math.min(...teleTail);
      teleHealth = Math.min(100, Math.round((teleWorst / teleP95) * 100));
      const teleCurrent = teleVals[teleVals.length - 1];
      teleInfo = { health: teleHealth, current: Math.round(teleCurrent * 10) / 10, baseline: Math.round(teleP95 * 10) / 10 };
      // Telescope drops contribute to score (scaled up since values are small)
      const teleThresh = teleP95 * 0.7; // 30% drop threshold for telescope
      for (const v of teleVals) {
        if (v < teleThresh) telePenalty += Math.round((teleP95 - v) * 50); // scale up
      }
    }
  }
  
  // ── Combine: Health = worst of all indicators ──
  const healthPct = Math.min(probHealth, lossHealth, latHealth, teleHealth);
  
  // ── Combined score with amplifier ──
  const rawScore = probDropScore + lossPenalty + latPenalty + telePenalty;
  const dropScore = Math.round(rawScore * telescopeMultiplier);
  
  // perSource for detail panel
  const perSource = {
    probing: { health: probHealth, current: Math.round(probCurrent), baseline: Math.round(probP95) },
    bgp: bgpInfo,
    telescope: teleInfo,
    loss: lossInfo,
    latency: latInfo,
  };
  
  return {
    healthPct,
    dropScore,
    liveDrop: probLiveDrop,
    current: Math.round(probCurrent),
    baseAvg: Math.round(probP95),
    perSource,
    telescopeMultiplier,
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
  
  // Zoom with scroll wheel
  const handleWheel = (e) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left) / rect.width;
    const center = zoomRange ? zoomRange.start + mx * (zoomRange.end - zoomRange.start) : mx;
    const currentSpan = zoomRange ? zoomRange.end - zoomRange.start : 1;
    const factor = e.deltaY > 0 ? 1.2 : 0.8; // scroll down = zoom out
    let newSpan = Math.min(1, Math.max(0.05, currentSpan * factor));
    let newStart = center - newSpan * (mx);
    let newEnd = newStart + newSpan;
    if (newStart < 0) { newEnd -= newStart; newStart = 0; }
    if (newEnd > 1) { newStart -= (newEnd - 1); newEnd = 1; }
    newStart = Math.max(0, newStart);
    if (newSpan >= 0.95) { setZoomRange(null); return; }
    setZoomRange({ start: newStart, end: newEnd });
  };
  
  return (
    <div>
      <div ref={containerRef} onWheel={handleWheel} style={{ cursor: "crosshair", touchAction: "none", position: "relative" }}>
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
        <div style={{ display:"flex", gap:4 }}>
          {zoomRange && (
            <button onClick={() => setZoomRange(null)}
              style={{ fontSize:10, fontFamily:font, padding:"2px 8px", background:"transparent",
                border:`1px solid ${BORDER}`, color:MUTED, cursor:"pointer" }}>Reset zoom</button>
          )}
          <span style={{ fontSize:9, fontFamily:font, color:`${MUTED}60` }}>
            Ponderación: Sondeo 50% · BGP 30% · Telescopio 20%
          </span>
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
    if (markersRef.current) { map.removeLayer(markersRef.current); }
    const group = L.layerGroup();
    const scores = regionScores.map(r => r.displayScore || r.dropScore || 0);
    const maxScore = Math.max(...scores, 1);

    regionScores.forEach(r => {
      const coords = STATE_COORDS[r.name];
      if (!coords) return;
      const isAffected = (r.displayScore || r.dropScore || 0) > 0;
      const severity = r.healthPct;
      const color = severity >= 90 ? "#34d399" : severity >= 70 ? "#fbbf24" : severity >= 50 ? "#f97316" : "#ef4444";
      // Size proportional to outage score, fallback to severity
      const ds = r.displayScore || r.dropScore || 0;
      const radius = ds > 0 ? Math.max(8, Math.min(40, (ds / maxScore) * 40)) : (severity >= 90 ? 6 : severity >= 70 ? 12 : severity >= 50 ? 20 : 30);
      const circle = L.circleMarker(coords, {
        radius, fillColor: color, color: selectedState === r.name ? "#fff" : color,
        weight: selectedState === r.name ? 3 : 1.5, opacity: 0.9, fillOpacity: isAffected ? 0.7 : 0.3,
      });
      circle.bindPopup(
        `<div style="font-family:monospace;font-size:11px;min-width:160px">` +
        `<b style="font-size:13px">${r.name}</b><br/>` +
        `Conectividad: <b style="color:${color}">${r.healthPct}%</b><br/>` +
        `Outage Score: <b>${ds > 0 ? ds.toLocaleString() : "0"}</b><br/>` +
        `Baseline: ${Math.round(r.baseAvg).toLocaleString()} · Actual: ${Math.round(r.current).toLocaleString()}` +
        `</div>`, { className: "ioda-popup" }
      );
      circle.on("click", () => onSelectState(r.name));
      group.addLayer(circle);

      // Add label for affected states
      if (isAffected && (r.displayScore || 0) > maxScore * 0.05) {
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
  const [regionLoading, setRegionLoading] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [aiExplain, setAiExplain] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [subView, setSubView] = useState("nacional"); // nacional | estados | eventos
  const [scoreView, setScoreView] = useState("outage"); // outage | health
  const [focusEvent, setFocusEvent] = useState(null); // timestamp to zoom chart to

  // ── Unified time window (stable — only recalculates on user action) ──
  const [timePreset, setTimePreset] = useState("24h"); // 24h | 48h | 7d | 30d | custom
  const [customFrom, setCustomFrom] = useState("");
  const [customUntil, setCustomUntil] = useState("");
  const [timeEpoch, setTimeEpoch] = useState(() => Math.floor(Date.now() / 1000)); // frozen "now"
  
  // Refreeze "now" when preset changes (not on every render)
  const changePreset = (p) => { setTimePreset(p); setTimeEpoch(Math.floor(Date.now() / 1000)); setRegionScores([]); };
  
  // Compute actual from/until epoch — stable between renders
  const timeWindow = (() => {
    if (timePreset === "custom" && customFrom) {
      const f = Math.floor(new Date(customFrom).getTime() / 1000);
      const u = customUntil ? Math.floor(new Date(customUntil).getTime() / 1000) : timeEpoch;
      return { from: f, until: u };
    }
    const hours = { "24h": 24, "48h": 48, "7d": 168, "30d": 720 }[timePreset] || 24;
    return { from: timeEpoch - hours * 3600, until: timeEpoch };
  })();

  const timeLabel = timePreset === "custom"
    ? `${new Date(timeWindow.from * 1000).toLocaleDateString("es-VE")} — ${new Date(timeWindow.until * 1000).toLocaleDateString("es-VE")}`
    : timePreset;

  // ── 1. Load national signals ──
  const loadNational = useCallback(async () => {
    setLoading(true); setError(null); setSource("loading");
    const json = await iodaFetch(`signals/raw/country/VE`, { from: timeWindow.from, until: timeWindow.until });
    const parsed = json ? parseSignals(json) : null;
    if (parsed) { setSignals(parsed); setSource("live"); }
    else { setSignals(null); setSource("failed"); setError("No se pudo conectar con IODA API."); }
    setLoading(false);
  }, [timeWindow.from, timeWindow.until]);

  // ── 2. Detect outage events from national + regional signal analysis ──
  const loadEvents = useCallback(async () => {
    const detectedEvents = [];
    
    // Helper: detect events in a signal series
    const detectDrops = (parsed, sourceName, regionLabel) => {
      if (!parsed || parsed.length < 10) return;
      for (const key of ["probing", "bgp", "telescope"]) {
        const allVals = parsed.map(p => p[key]).filter(v => v !== null);
        if (allVals.length < 10) continue;
        const sorted = [...allVals].sort((a,b) => a - b);
        const baseAvg = sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1];
        if (baseAvg === 0 || baseAvg < 10) continue;
        
        let inEvent = false, eventStart = null, eventMinVal = Infinity, eventMaxDrop = 0;
        for (let i = 0; i < parsed.length; i++) {
          const v = parsed[i][key];
          if (v === null) continue;
          const dropPct = ((baseAvg - v) / baseAvg) * 100;
          if (dropPct > 10 && !inEvent) {
            inEvent = true; eventStart = parsed[i].ts; eventMinVal = v; eventMaxDrop = dropPct;
          } else if (inEvent && dropPct > 10) {
            if (v < eventMinVal) eventMinVal = v;
            if (dropPct > eventMaxDrop) eventMaxDrop = dropPct;
          } else if (inEvent && dropPct <= 5) {
            const duration = parsed[i].ts - eventStart;
            if (eventMaxDrop > 15 && duration > 300) {
              const severity = eventMaxDrop > 60 ? "critical" : eventMaxDrop > 30 ? "high" : "medium";
              detectedEvents.push({ time: eventStart, datasource: key, condition: severity, region: regionLabel,
                value: Math.round(eventMaxDrop), dropAbsolute: Math.round(baseAvg - eventMinVal), baseline: Math.round(baseAvg), duration });
            }
            inEvent = false; eventMinVal = Infinity; eventMaxDrop = 0;
          }
        }
        if (inEvent && eventMaxDrop > 15) {
          const duration = parsed[parsed.length-1].ts - eventStart;
          const severity = eventMaxDrop > 60 ? "critical" : eventMaxDrop > 30 ? "high" : "medium";
          detectedEvents.push({ time: eventStart, datasource: key, condition: severity, region: regionLabel,
            value: Math.round(eventMaxDrop), dropAbsolute: Math.round(baseAvg - eventMinVal), baseline: Math.round(baseAvg), duration: duration > 0 ? duration : null });
        }
      }
      // Also detect loss spikes
      const lossVals = parsed.map(p => p.lossPct).filter(v => v !== null);
      if (lossVals.length >= 10) {
        const lossSorted = [...lossVals].sort((a,b) => a - b);
        const lossBase = lossSorted[Math.floor(lossSorted.length * 0.1)]; // P10 = normal low
        let inLoss = false, lossStart = null, lossMax = 0;
        for (let i = 0; i < parsed.length; i++) {
          const v = parsed[i].lossPct;
          if (v === null) continue;
          if (v > 15 && !inLoss) { inLoss = true; lossStart = parsed[i].ts; lossMax = v; }
          else if (inLoss && v > 15) { if (v > lossMax) lossMax = v; }
          else if (inLoss && v <= 10) {
            const duration = parsed[i].ts - lossStart;
            if (lossMax > 20 && duration > 300) {
              detectedEvents.push({ time: lossStart, datasource: "packet-loss", condition: lossMax > 40 ? "high" : "medium", region: regionLabel,
                value: Math.round(lossMax), dropAbsolute: 0, baseline: Math.round(lossBase), duration });
            }
            inLoss = false; lossMax = 0;
          }
        }
      }
    };
    
    // National events
    const natJson = await iodaFetch(`signals/raw/country/VE`, { from: timeWindow.from, until: timeWindow.until });
    const natParsed = natJson ? parseSignals(natJson) : null;
    detectDrops(natParsed, "national", "🇻🇪 Nacional");
    
    // Regional events (from already loaded region data, or fetch top states)
    if (regionScores.length > 0) {
      for (const r of regionScores) {
        if (r.series) detectDrops(r.series, "regional", r.name);
      }
    } else {
      // Fetch a few key states
      const keyStates = VE_REGIONS.filter(s => ["4020","4013","4024","4005","4021"].includes(s.code));
      for (const st of keyStates) {
        try {
          const json = await iodaFetch(`signals/raw/region/${st.code}`, { from: timeWindow.from, until: timeWindow.until });
          if (json) { const parsed = parseSignals(json); detectDrops(parsed, "regional", st.name); }
        } catch {}
      }
    }
    
    detectedEvents.sort((a,b) => b.time - a.time);
    setEvents(detectedEvents.slice(0, 50));
  }, [timeWindow.from, timeWindow.until, regionScores]);

  // ── 3. Load regional scores ──
  const loadRegions = useCallback(async () => {
    setRegionLoading(true);
    
    // Fetch national telescope data first (Layer 3)
    let nationalTelescope = null;
    try {
      const natJson = await iodaFetch(`signals/raw/country/VE`, { from: timeWindow.from, until: timeWindow.until });
      if (natJson) {
        const natRaw = Array.isArray(natJson?.data) ? natJson.data.flat() : [];
        const ntSrc = natRaw.find(s => s.datasource === "ucsd-nt") || natRaw.find(s => s.datasource === "merit-nt");
        if (ntSrc?.values) nationalTelescope = ntSrc.values.filter(v => v !== null);
      }
    } catch {}
    
    const scores = [];
    const batches = [];
    for (let i = 0; i < VE_REGIONS.length; i += 8) batches.push(VE_REGIONS.slice(i, i + 8));
    for (const batch of batches) {
      const results = await Promise.allSettled(
        batch.map(async (st) => {
          const json = await iodaFetch(`signals/raw/region/${st.code}`, { from: timeWindow.from, until: timeWindow.until });
          if (!json) return null;
          const parsed = parseSignals(json);
          const result = computeRegionScore(parsed, nationalTelescope);
          if (!result) return null;
          return { ...st, ...result, series: parsed };
        })
      );
      results.forEach(r => { if (r.status === "fulfilled" && r.value) scores.push(r.value); });
    }
    scores.sort((a,b) => b.dropScore - a.dropScore || a.healthPct - b.healthPct);
    setRegionScores(scores);
    setRegionLoading(false);
  }, [timeWindow.from, timeWindow.until]);

  useEffect(() => { loadNational(); }, [loadNational]);
  useEffect(() => { if (subView === "estados") loadRegions(); }, [subView, loadRegions]);
  useEffect(() => { loadEvents(); }, [loadEvents]);

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

  return (
    <div>
      {/* ── Header + Unified Time Picker ── */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>🌐</span>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontSize:15, fontWeight:600, color:TEXT }}>Monitor de Internet — Venezuela</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em" }}>
            Georgia Tech IODA · {source === "live" ? `${signals?.length || 0} puntos` : source === "failed" ? "Sin conexión" : "Conectando..."}
          </div>
        </div>
        <Badge color={source==="live"?"#7c3aed":source==="failed"?"#dc2626":"#a17d08"}>
          {source==="live"?"EN VIVO":source==="failed"?"OFFLINE":"..."}
        </Badge>
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
        {[{id:"nacional",label:"📡 Nacional"},{id:"estados",label:"🗺 Estados"},{id:"eventos",label:"⚡ Eventos"}].map(s => (
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
                const interp = interpretPattern(rd.perSource, rd.telescopeMultiplier);
                const srcOrder = ["probing", "loss", "latency", "bgp", "telescope"];
                const srcLabels = { probing: "Sondeo Activo", bgp: "BGP Routes", telescope: "Telescopio", loss: "Packet Loss", latency: "Latencia" };
                const srcEmojis = { probing: "📡", bgp: "🌐", telescope: "🔭", loss: "📉", latency: "⏱" };
                const srcUnits = { probing: "", bgp: "", telescope: "", loss: "%", latency: "ms" };
                return (
                  <Card accent={getSeverityColor(rd.healthPct)}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:TEXT }}>{rd.name}</div>
                      <Badge color={getSeverityColor(rd.healthPct)}>{getSeverityLabel(rd.healthPct)}</Badge>
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"baseline", marginBottom:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:28, fontWeight:900, fontFamily:"'Playfair Display',serif", color:getSeverityColor(rd.healthPct) }}>{rd.healthPct}%</span>
                      <span style={{ fontSize:11, color:MUTED }}>peor indicador</span>
                      {rd.displayScore > 0 && <span style={{ fontSize:12, color:"#dc2626", fontWeight:600 }}>Score: {fmtVal(rd.displayScore)}</span>}
                      {rd.telescopeMultiplier > 1 && <span style={{ fontSize:10, color:"#7c3aed", fontWeight:600 }}>🔭 ×{rd.telescopeMultiplier}</span>}
                    </div>
                    {/* Per-source breakdown */}
                    <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
                      {srcOrder.map(src => {
                        const d = rd.perSource?.[src];
                        if (!d) return (
                          <div key={src} style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:`${MUTED}80`, padding:"3px 0" }}>
                            <span>{srcEmojis[src]} {srcLabels[src]}</span><span>— sin datos</span>
                          </div>
                        );
                        const c = getSeverityColor(d.health);
                        const unit = srcUnits[src] || "";
                        // For loss, display is inverted: high loss = bad, so show "current/baseline" as "actual vs normal"
                        const detail = src === "loss" ? `${d.current}% (normal <${d.baseline}%)` :
                                       src === "latency" ? `${d.current}ms (base ${d.baseline}ms)` :
                                       `(${d.current}/${d.baseline})`;
                        return (
                          <div key={src} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, padding:"3px 0", borderBottom:`1px solid ${BORDER}20` }}>
                            <span style={{ color:TEXT }}>{srcEmojis[src]} {srcLabels[src]}</span>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <div style={{ width:40, height:4, background:`${BORDER}30`, borderRadius:2, overflow:"hidden" }}>
                                <div style={{ width:`${d.health}%`, height:4, background:c, borderRadius:2 }} />
                              </div>
                              <span style={{ fontWeight:700, color:c, minWidth:32, textAlign:"right" }}>{d.health}%</span>
                              <span style={{ color:MUTED, fontSize:10 }}>{detail}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Interpretation */}
                    <div style={{ fontSize:11, color:TEXT, lineHeight:1.5, padding:"6px 8px", background:`${BORDER}10`, borderRadius:4, borderLeft:`3px solid ${getSeverityColor(rd.healthPct)}` }}>
                      <span style={{ marginRight:4 }}>{interp.emoji}</span>{interp.text}
                    </div>
                  </Card>
                );
              })()}

              {/* Ranking table */}
              <Card accent="#f59e0b">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ fontSize:13, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
                    {scoreView === "outage" ? "Outage Score" : "Salud %"}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {regionLoading && <span style={{ fontSize:9, fontFamily:font, color:"#a17d08" }}>⏳ cargando {timePreset}...</span>}
                    <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}` }}>
                    {[{id:"outage",label:"Score"},{id:"health",label:"Salud %"}].map(v => (
                      <button key={v.id} onClick={() => setScoreView(v.id)}
                        style={{ fontSize:10, fontFamily:font, padding:"3px 10px", border:"none",
                          background:scoreView===v.id?ACCENT:"transparent", color:scoreView===v.id?"#fff":MUTED, cursor:"pointer" }}>{v.label}</button>
                    ))}
                  </div>
                  </div>
                </div>
                {activeData.length === 0 ? (
                  <div style={{ fontSize:12, color:MUTED, padding:8 }}>Cargando...</div>
                ) : (<>
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 8px", borderBottom:`1px solid ${BORDER}`, marginBottom:4 }}>
                    <span style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase" }}>Región</span>
                    <span style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase" }}>
                      {scoreView === "outage" ? "Puntaje" : "Salud"}
                    </span>
                  </div>
                  <div style={{ maxHeight:400, overflowY:"auto" }}>
                    {activeData.map((r, i) => (
                      <div key={r.code}
                        onClick={() => setSelectedState(selectedState === r.name ? null : r.name)}
                        style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 8px",
                          background:selectedState === r.name ? `${ACCENT}15` : i % 2 ? "rgba(0,0,0,0.02)" : "transparent",
                          cursor:"pointer", borderRadius:3 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ width:8, height:8, borderRadius:"50%", background:getSeverityColor(r.healthPct) }} />
                          <span style={{ fontSize:13, color:TEXT, fontWeight:r.healthPct < 70 ? 700 : 400 }}>{r.name}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          {scoreView === "outage" ? (<>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              {r.displayScore > 0 && (() => {
                                const maxScore = Math.max(...activeData.map(x => x.displayScore), 1);
                                const barW = Math.max(4, (r.displayScore / maxScore) * 60);
                                return <div style={{ width:barW, height:4, background:getSeverityColor(r.healthPct), borderRadius:2 }} />;
                              })()}
                              <span style={{ fontSize:13, fontWeight:700, fontFamily:font, color:r.displayScore > 0 ? getSeverityColor(r.healthPct) : MUTED }}>
                                {r.displayScore > 0 ? fmtVal(r.displayScore) : "0.0"}
                              </span>
                            </div>
                          </>) : (<>
                            <span style={{ fontSize:13, fontWeight:700, fontFamily:font, color:getSeverityColor(r.healthPct) }}>
                              {r.healthPct}%
                            </span>
                            {r.displayScore > 0 && (
                              <span style={{ fontSize:10, fontFamily:font, color:"#dc2626" }}>↓{fmtVal(r.displayScore)}</span>
                            )}
                          </>)}
                        </div>
                      </div>
                    ))}
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
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:13, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
              Eventos Detectados · {timeLabel}
            </div>
            <span style={{ fontSize:12, fontFamily:font, color:events.length > 0 ? "#dc2626" : MUTED }}>
              {events.length} detectados
            </span>
          </div>
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
                    <th style={{ padding:"6px 8px", textAlign:"right", color:MUTED, fontWeight:600 }}>Caída</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev, i) => {
                    const sevColor = ev.condition === "critical" ? "#ef4444" : ev.condition === "high" ? "#f97316" : ev.condition === "medium" ? "#fbbf24" : MUTED;
                    const dsColor = ev.datasource === "bgp" ? "#7c3aed" : ev.datasource === "probing" || ev.datasource === "ping-slash24" ? "#f59e0b" : ev.datasource === "packet-loss" ? "#dc2626" : "#dc2626";
                    const dsLabel = ev.datasource === "bgp" ? "BGP" : ev.datasource === "probing" || ev.datasource === "ping-slash24" ? "SONDEO" : ev.datasource === "telescope" ? "TELESCOPIO" : ev.datasource === "packet-loss" ? "LOSS" : (ev.datasource || "?").toUpperCase();
                    return (
                      <tr key={i} onClick={() => { setFocusEvent(ev.time); if (ev.region !== "🇻🇪 Nacional") setSelectedState(ev.region); }}
                        style={{ borderBottom:`1px solid ${BORDER}30`, cursor:"pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = `${ACCENT}08`}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding:"8px" }}>
                          <div style={{ color:TEXT, fontWeight:600 }}>{ev.time ? fmtTime(ev.time) : "—"}</div>
                        </td>
                        <td style={{ padding:"8px" }}>
                          <span style={{ fontSize:11, color: ev.region === "🇻🇪 Nacional" ? "#7c3aed" : TEXT, fontWeight: ev.region === "🇻🇪 Nacional" ? 600 : 400 }}>
                            {ev.region || "—"}
                          </span>
                        </td>
                        <td style={{ padding:"8px", color:MUTED, fontSize:11 }}>{ev.duration ? fmtDuration(ev.duration) : "en curso"}</td>
                        <td style={{ padding:"8px" }}>
                          <Badge color={dsColor}>{dsLabel}</Badge>
                        </td>
                        <td style={{ padding:"8px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:12, fontWeight:700, color:sevColor, textTransform:"uppercase" }}>{ev.condition === "critical" ? "CRÍTICO" : ev.condition === "high" ? "ALTO" : "MEDIO"}</span>
                            <div style={{ width:60, height:4, background:`${BORDER}40`, borderRadius:2, overflow:"hidden" }}>
                              <div style={{ width:`${Math.min(ev.value || 0, 100)}%`, height:4, background:sevColor, borderRadius:2 }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"8px", textAlign:"right" }}>
                          <span style={{ fontWeight:700, color:sevColor, fontSize:13 }}>-{ev.value}%</span>
                          {ev.dropAbsolute > 0 && <div style={{ fontSize:10, color:MUTED }}>↓{fmtVal(ev.dropAbsolute)}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ fontSize:10, color:`${MUTED}60`, marginTop:8 }}>
            Click en un evento para ver en la gráfica · Incluye eventos nacionales y regionales
          </div>
        </Card>
      )}

            {/* Interactive multi-line temporal chart */}
            {activeData.length > 0 && activeData.some(r => r.series?.length > 10) && (() => {
              // Selected states for chart: use selectedState or top 8
              const chartStates = selectedState 
                ? activeData.filter(r => r.name === selectedState || r.healthPct < 95).slice(0, 8)
                : activeData.filter(r => r.series && r.series.length > 5).slice(0, 8);
              if (chartStates.length === 0) return null;

              // Palette
              const palette = ["#dc2626","#f59e0b","#7c3aed","#2563eb","#059669","#ec4899","#84cc16","#06b6d4"];
              const srcColors = { bgp: "#7c3aed", probing: "#f59e0b", telescope: "#dc2626" };

              return (
                <Card accent="#dc2626" style={{ marginTop: 14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4, flexWrap:"wrap", gap:6 }}>
                    <div style={{ fontSize:13, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
                      Conectividad por Estado
                    </div>
                    <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>
                      {timeLabel} · Scroll para zoom · Click estado en mapa para filtrar
                    </span>
                  </div>
                  {/* Main probing-based multi-line chart */}
                  <InteractiveChart states={chartStates} timePreset={timePreset} selectedState={selectedState}
                    onSelectState={s => setSelectedState(selectedState === s ? null : s)} palette={palette}
                    events={events} focusEvent={focusEvent} onClearFocus={() => setFocusEvent(null)} />
                  
                  {/* Per-source breakdown for selected state */}
                  {selectedState && (() => {
                    const st = activeData.find(r => r.name === selectedState);
                    if (!st?.series?.length) return null;
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
                            const vals = st.series.map(p => p[src]).filter(v => v !== null && typeof v === "number");
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
                                ? (current > 30 ? 20 : current > 20 ? 40 : current > 10 ? 60 : current > 5 ? 85 : 100)
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
                            st.series.forEach((p, i) => {
                              const v = p[src]; if (v === null || typeof v !== "number") return;
                              const x = pL2 + (i / (st.series.length - 1)) * cW2;
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
