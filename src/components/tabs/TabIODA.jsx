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
const hoursMap = { "24h":24, "48h":48, "7d":168 };

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
  const anchor = [bgp, probing, telescope].filter(Boolean).sort((a,b) => b.values.length - a.values.length)[0];
  if (!anchor) return null;
  const valAt = (sig, ts) => {
    if (!sig) return null;
    const idx = Math.round((ts - sig.from) / sig.step);
    return (idx >= 0 && idx < sig.values.length) ? sig.values[idx] : null;
  };
  return anchor.values.map((_, i) => {
    const ts = anchor.from + i * anchor.step;
    return { ts, bgp: valAt(bgp, ts), probing: valAt(probing, ts), telescope: valAt(telescope, ts) };
  });
}

// ── Format helpers ──
const fmtVal = v => v == null ? "—" : v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(1)}K` : v.toFixed(0);
const fmtTime = epoch => new Date(epoch * 1000).toLocaleString("es-VE", { timeZone:"America/Caracas", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", hour12:false });
const fmtDuration = secs => { if (secs < 3600) return `${Math.round(secs/60)}m`; const h = Math.floor(secs/3600), m = Math.round((secs%3600)/60); return m > 0 ? `${h}h ${m}m` : `${h}h`; };

// ── Interpret connectivity pattern from per-source data ──
function interpretPattern(perSource) {
  if (!perSource) return { emoji: "❓", text: "Sin datos suficientes para interpretar." };
  const bgp = perSource.bgp?.health ?? null;
  const prob = perSource.probing?.health ?? null;
  const tele = perSource.telescope?.health ?? null;
  
  const vals = [bgp, prob, tele].filter(v => v !== null);
  if (vals.length === 0) return { emoji: "❓", text: "Sin datos suficientes." };
  const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
  
  if (avg >= 90) return { emoji: "✅", text: "Conectividad normal — sin anomalías detectadas en ningún indicador." };
  
  const bgpDown = bgp !== null && bgp < 70;
  const probDown = prob !== null && prob < 70;
  const teleDown = tele !== null && tele < 70;
  
  if (bgpDown && probDown && teleDown) return { emoji: "🔴", text: "Desconexión generalizada — los tres indicadores registran caídas significativas. Consistente con corte gubernamental deliberado o falla mayor de infraestructura troncal (CANTV)." };
  if (!bgpDown && probDown && teleDown) return { emoji: "⚡", text: "Dispositivos inaccesibles pero rutas activas — las rutas de red se anuncian pero los equipos no responden. Consistente con corte eléctrico regional o falla de último kilómetro." };
  if (bgpDown && !probDown && !teleDown) return { emoji: "🌐", text: "Pérdida de rutas upstream — el proveedor dejó de anunciar prefijos pero dispositivos locales funcionan. Posible problema con proveedor internacional o reconfiguración de red." };
  if (!bgpDown && !probDown && teleDown) return { emoji: "🔍", text: "Anomalía en tráfico de fondo — el telescopio detecta cambios pero BGP y sondeo están normales. Posible filtrado selectivo de tráfico o cambio en patrones de red." };
  if (!bgpDown && probDown && !teleDown) return { emoji: "📡", text: "Caída en sondeo activo — los dispositivos no responden al probing pero las rutas y tráfico de fondo están normales. Posible congestión severa o bloqueo de ICMP." };
  if (bgpDown && probDown && !teleDown) return { emoji: "🔗", text: "Pérdida de rutas y dispositivos — el tráfico de fondo persiste pero las rutas y hosts caen. Posible falla de peering o desconexión parcial de proveedor." };
  if (bgpDown && !probDown && teleDown) return { emoji: "⚠️", text: "Rutas y tráfico de fondo afectados — combinación inusual que puede indicar una reconfiguración de red en progreso o ataque a infraestructura BGP." };
  
  // Mild degradation
  if (avg >= 70) return { emoji: "🟡", text: "Degradación leve — uno o más indicadores muestran reducción moderada. Puede ser congestión temporal, mantenimiento de red, o fluctuación normal." };
  return { emoji: "🟠", text: "Degradación significativa — múltiples indicadores afectados parcialmente. Monitorear evolución para determinar si es transitorio o escalará." };
}

// ── Interactive multi-line chart with zoom/pan ──
function InteractiveChart({ states, mapMode, selectedState, onSelectState, palette }) {
  const containerRef = useRef(null);
  const [zoomRange, setZoomRange] = useState(null); // {start, end} as fraction 0-1
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  
  // Build chart data
  const chartData = states.map(st => {
    const vals = st.series.map(p => p.probing ?? p.bgp).filter(v => v !== null);
    const baseline = vals.slice(0, Math.max(1, Math.floor(vals.length * 0.1)));
    const baseAvg = baseline.reduce((a,b) => a+b, 0) / baseline.length || 1;
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
      <div ref={containerRef} onWheel={handleWheel} style={{ cursor: "crosshair", touchAction: "none" }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}>
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
          {/* End labels */}
          {chartData.map((st, si) => {
            const color = palette[si % palette.length];
            const isSelected = selectedState === st.name;
            if (selectedState && !isSelected) return null;
            const visible = st.pctSeries.filter(p => p.pct !== null && p.ts >= viewStart && p.ts <= viewEnd);
            const lastPt = visible[visible.length - 1];
            if (!lastPt) return null;
            const x = Math.min(toX(lastPt.ts) + 4, pL + cW + 4);
            return (
              <g key={`lbl-${st.name}`}>
                <circle cx={toX(lastPt.ts)} cy={toY(lastPt.pct)} r={3} fill={color} />
                <text x={x} y={toY(lastPt.pct) + 3} fontSize={8} fill={color} fontWeight={700} fontFamily={font}>
                  {st.name} {lastPt.pct}%
                </text>
              </g>
            );
          })}
        </svg>
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
function IODALeafletMap({ regionScores, selectedState, onSelectState, mapMode }) {
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
    const scores = regionScores.map(r => r.displayScore || r.dropScore90 || 0);
    const maxScore = Math.max(...scores, 1);

    regionScores.forEach(r => {
      const coords = STATE_COORDS[r.name];
      if (!coords) return;
      const isAffected = (r.displayScore || r.dropScore90 || 0) > 0;
      const severity = r.healthPct;
      const color = severity >= 90 ? "#34d399" : severity >= 70 ? "#fbbf24" : severity >= 50 ? "#f97316" : "#ef4444";
      // Size: in "live" mode based on severity, in accumulated modes based on score
      let radius;
      if (mapMode === "live") {
        // Live: size reflects how bad it is RIGHT NOW
        radius = severity >= 90 ? 6 : severity >= 70 ? 14 : severity >= 50 ? 22 : 32;
      } else {
        // Accumulated: size proportional to outage score
        const ds = r.displayScore || r.dropScore90 || 0;
        radius = ds > 0 ? Math.max(8, Math.min(40, (ds / maxScore) * 40)) : 5;
      }
      const circle = L.circleMarker(coords, {
        radius, fillColor: color, color: selectedState === r.name ? "#fff" : color,
        weight: selectedState === r.name ? 3 : 1.5, opacity: 0.9, fillOpacity: isAffected ? 0.7 : 0.3,
      });
      const modeLabel = mapMode === "live" ? "En Vivo" : mapMode === "24h" ? "24h" : "7 días";
      circle.bindPopup(
        `<div style="font-family:monospace;font-size:11px;min-width:160px">` +
        `<b style="font-size:13px">${r.name}</b> <span style="color:#888">(${modeLabel})</span><br/>` +
        `Conectividad: <b style="color:${color}">${r.healthPct}%</b><br/>` +
        `${mapMode === "live" ? "Caída actual" : "Outage Score"}: <b>${(r.displayScore || 0) > 0 ? (r.displayScore || 0).toLocaleString() : "0.0"}</b><br/>` +
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
  }, [regionScores, selectedState, mapMode]);

  return <div ref={mapRef} style={{ width:"100%", height: 350, borderRadius:4, border:`1px solid ${BORDER}` }} />;
}

export function TabIODA() {
  const mob = useIsMobile();
  const [signals, setSignals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("loading");
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("24h");
  const [hover, setHover] = useState(null);
  const [events, setEvents] = useState([]);
  const [regionScores, setRegionScores] = useState([]);
  const [regionLoading, setRegionLoading] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [aiExplain, setAiExplain] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [subView, setSubView] = useState("nacional"); // nacional | estados | eventos
  const [scoreView, setScoreView] = useState("outage"); // outage | health
  const [mapMode, setMapMode] = useState("live"); // live | 24h | 7d

  // ── 1. Load national signals ──
  const loadNational = useCallback(async () => {
    setLoading(true); setError(null); setSource("loading");
    const hours = hoursMap[timeRange];
    const now = Math.floor(Date.now() / 1000);
    const from = now - hours * 3600;
    const json = await iodaFetch(`signals/raw/country/VE`, { from, until: now });
    const parsed = json ? parseSignals(json) : null;
    if (parsed) { setSignals(parsed); setSource("live"); }
    else { setSignals(null); setSource("failed"); setError("No se pudo conectar con IODA API."); }
    setLoading(false);
  }, [timeRange]);

  // ── 2. Detect outage events from signal analysis ──
  const loadEvents = useCallback(async () => {
    const now = Math.floor(Date.now() / 1000);
    const from = now - 7 * 86400; // always scan 7 days for events

    // Detect events from signal drops (IODA outage endpoints return 404 on v2)
    const json = await iodaFetch(`signals/raw/country/VE`, { from, until: now });
    const parsed = json ? parseSignals(json) : null;
    if (!parsed || parsed.length < 10) return;
    const detectedEvents = [];
    // Use wider baseline window for 7-day data
    const windowSize = Math.min(48, Math.floor(parsed.length * 0.1));
    // Calculate global baseline from first 10% of data
    for (const key of ["bgp", "probing", "telescope"]) {
      const allVals = parsed.map(p => p[key]).filter(v => v !== null);
      if (allVals.length < 10) continue;
      const globalBase = allVals.slice(0, Math.max(10, Math.floor(allVals.length * 0.1)));
      const baseAvg = globalBase.reduce((a,b) => a+b, 0) / globalBase.length;
      if (baseAvg === 0) continue;
      
      let inEvent = false, eventStart = null, eventMinVal = Infinity, eventMaxDrop = 0;
      for (let i = 0; i < parsed.length; i++) {
        const v = parsed[i][key];
        if (v === null) continue;
        const dropPct = ((baseAvg - v) / baseAvg) * 100;
        if (dropPct > 10 && !inEvent) {
          // Start of event
          inEvent = true;
          eventStart = parsed[i].ts;
          eventMinVal = v;
          eventMaxDrop = dropPct;
        } else if (inEvent && dropPct > 10) {
          // Continue event
          if (v < eventMinVal) eventMinVal = v;
          if (dropPct > eventMaxDrop) eventMaxDrop = dropPct;
        } else if (inEvent && dropPct <= 5) {
          // End of event — record it
          const duration = parsed[i].ts - eventStart;
          if (eventMaxDrop > 15 && duration > 300) { // >15% drop lasting >5min
            const severity = eventMaxDrop > 60 ? "critical" : eventMaxDrop > 30 ? "high" : "medium";
            detectedEvents.push({
              time: eventStart,
              datasource: key,
              condition: severity,
              value: Math.round(eventMaxDrop),
              dropAbsolute: Math.round(baseAvg - eventMinVal),
              baseline: Math.round(baseAvg),
              duration,
            });
          }
          inEvent = false; eventMinVal = Infinity; eventMaxDrop = 0;
        }
      }
      // If still in event at end of data
      if (inEvent && eventMaxDrop > 15) {
        const duration = parsed[parsed.length-1].ts - eventStart;
        const severity = eventMaxDrop > 60 ? "critical" : eventMaxDrop > 30 ? "high" : "medium";
        detectedEvents.push({
          time: eventStart, datasource: key, condition: severity,
          value: Math.round(eventMaxDrop), dropAbsolute: Math.round(baseAvg - eventMinVal),
          baseline: Math.round(baseAvg), duration: duration > 0 ? duration : null,
        });
      }
    }
    detectedEvents.sort((a,b) => b.time - a.time);
    setEvents(detectedEvents.slice(0, 30));
  }, []);

  // ── 3. Load regional scores (probing only, lighter) ──
  // Store separate datasets for different time ranges
  const [regionData7d, setRegionData7d] = useState([]);

  const loadRegions = useCallback(async () => {
    setRegionLoading(true);
    const now = Math.floor(Date.now() / 1000);

    // Helper: fetch and compute scores for a time range
    const fetchRange = async (hours) => {
      const from = now - hours * 3600;
      const scores = [];
      const batches = [];
      for (let i = 0; i < VE_REGIONS.length; i += 8) batches.push(VE_REGIONS.slice(i, i + 8));
      for (const batch of batches) {
        const results = await Promise.allSettled(
          batch.map(async (st) => {
            const json = await iodaFetch(`signals/raw/region/${st.code}`, { from, until: now });
            if (!json) return null;
            const parsed = parseSignals(json);
            if (!parsed || parsed.length === 0) return null;
            // Analyze ALL 3 signal sources, compute average health + per-source detail
            const srcKeys = ["probing", "bgp", "telescope"];
            const srcLabels = { probing: "Sondeo", bgp: "BGP", telescope: "Telescopio" };
            let totalDrop75 = 0, totalDrop90 = 0, maxLiveDrop = 0;
            const perSource = {};
            let validSources = 0, healthSum = 0;
            let refCurrent = null, refBaseAvg = null, refWorstHealth = 999;
            
            for (const src of srcKeys) {
              const sVals = parsed.map(p => p[src]).filter(v => v !== null);
              if (sVals.length < 5) { perSource[src] = null; continue; }
              const sCurrent = sVals[sVals.length - 1];
              const sBaseline = sVals.slice(0, Math.max(1, Math.floor(sVals.length * 0.1)));
              const sBaseAvg = sBaseline.reduce((a,b) => a+b, 0) / sBaseline.length;
              if (sBaseAvg < 10) { perSource[src] = null; continue; } // Skip sources with too little coverage
              
              const sHealth = Math.min(100, Math.round((sCurrent / sBaseAvg) * 100));
              perSource[src] = { health: sHealth, current: Math.round(sCurrent), baseline: Math.round(sBaseAvg) };
              validSources++;
              healthSum += sHealth;
              
              if (sHealth < refWorstHealth) {
                refCurrent = sCurrent; refBaseAvg = sBaseAvg;
                refWorstHealth = sHealth;
              }
              
              for (const v of sVals) {
                if (v < sBaseAvg * 0.75) totalDrop75 += Math.round(sBaseAvg - v);
                if (v < sBaseAvg * 0.90) totalDrop90 += Math.round(sBaseAvg - v);
              }
              const sLiveDrop = Math.max(0, Math.round(sBaseAvg - sCurrent));
              if (sLiveDrop > maxLiveDrop) maxLiveDrop = sLiveDrop;
            }
            
            if (validSources === 0) return null;
            // Weighted average: Probing 50%, BGP 30%, Telescope 20%
            const weights = { probing: 50, bgp: 30, telescope: 20 };
            let wSum = 0, wTotal = 0;
            for (const src of srcKeys) {
              if (perSource[src]) {
                wSum += perSource[src].health * weights[src];
                wTotal += weights[src];
              }
            }
            const avgHealth = wTotal > 0 ? Math.round(wSum / wTotal) : Math.round(healthSum / validSources);
            return { ...st, healthPct: avgHealth, dropScore75: totalDrop75, dropScore90: totalDrop90, liveDrop: maxLiveDrop, current: refCurrent, baseAvg: refBaseAvg, perSource, series: parsed };
          })
        );
        results.forEach(r => { if (r.status === "fulfilled" && r.value) scores.push(r.value); });
      }
      scores.sort((a,b) => b.dropScore90 - a.dropScore90 || a.healthPct - b.healthPct);
      return scores;
    };

    // Fetch 24h first (faster, shown by default in live/24h modes)
    const data24h = await fetchRange(24);
    setRegionScores(data24h);
    setRegionLoading(false);

    // Then fetch 7d in background (slower, 7 days of data per state)
    fetchRange(168).then(data7d => setRegionData7d(data7d));
  }, []);

  useEffect(() => { loadNational(); loadEvents(); }, [loadNational, loadEvents]);
  useEffect(() => { if (subView === "estados") loadRegions(); }, [subView, loadRegions]);

  // ── 4. AI Explain ──
  const explainWithAI = async () => {
    setAiLoading(true); setAiExplain(null);
    const ctx = [];
    if (signals) {
      const last = signals[signals.length - 1];
      const first = signals[0];
      ctx.push(`Señales nacionales (${timeRange}): BGP actual=${fmtVal(last?.bgp)}, Probing=${fmtVal(last?.probing)}, Telescope=${fmtVal(last?.telescope)}`);
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
    const baseline = vals.slice(0, Math.max(1, Math.floor(vals.length * 0.2)));
    const avg = baseline.reduce((a,b) => a+b, 0) / baseline.length;
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
  const rawRegionData = mapMode === "7d" && regionData7d.length > 0 ? regionData7d : regionScores;
  const activeData = (rawRegionData || []).map(r => ({
    ...r,
    displayScore: mapMode === "live" ? (r.liveDrop || 0) :
                  mapMode === "24h" ? (r.dropScore90 || 0) :
                  (r.dropScore75 || 0),
  })).sort((a,b) => b.displayScore - a.displayScore || a.healthPct - b.healthPct);

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>🌐</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600, color:TEXT }}>Monitor de Internet — Venezuela</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em" }}>
            Detección de interrupciones · Georgia Tech IODA · {source === "live" ? `${signals?.length || 0} puntos · EN VIVO` : source === "failed" ? "Sin conexión" : "Conectando..."}
          </div>
        </div>
        <Badge color={source==="live"?"#7c3aed":source==="failed"?"#dc2626":"#a17d08"}>
          {source==="live"?"EN VIVO":source==="failed"?"OFFLINE":"..."}
        </Badge>
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}` }}>
          {["24h","48h","7d"].map(r => (
            <button key={r} onClick={() => setTimeRange(r)}
              style={{ fontSize:12, fontFamily:font, padding:"5px 12px", border:"none",
                background:timeRange===r?ACCENT:"transparent", color:timeRange===r?"#fff":MUTED, cursor:"pointer", letterSpacing:"0.08em" }}>{r}</button>
          ))}
        </div>
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
            <div style={{ fontSize:20, marginBottom:8 }}>🌐</div>Conectando con IODA...<div style={{ fontSize:12, marginTop:4, color:`${MUTED}80` }}>Señales BGP + Active Probing + Telescope · {timeRange}</div>
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
                  Mapa de Interrupciones
                </div>
                <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}` }}>
                  {[{id:"live",label:"🔴 En Vivo"},{id:"24h",label:"24h"},{id:"7d",label:"7 días"}].map(m => (
                    <button key={m.id} onClick={() => setMapMode(m.id)}
                      style={{ fontSize:11, fontFamily:font, padding:"4px 12px", border:"none",
                        background:mapMode===m.id?ACCENT:"transparent", color:mapMode===m.id?"#fff":MUTED, cursor:"pointer" }}>{m.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", gap:12, marginBottom:6, flexWrap:"wrap" }}>
                <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>
                  {mapMode === "live" ? "Color = severidad actual · Tamaño = impacto" :
                   mapMode === "24h" ? "Score acumulado últimas 24 horas" : "Score acumulado últimos 7 días"}
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
              <IODALeafletMap regionScores={activeData} selectedState={selectedState} mapMode={mapMode}
                onSelectState={s => setSelectedState(selectedState === s ? null : s)} />
            </Card>

            {/* Rankings */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {/* Selected state detail */}
              {selectedState && (() => {
                const rd = activeData.find(r => r.name === selectedState);
                if (!rd) return <Card><div style={{ fontSize:12, color:MUTED }}>Sin datos para {selectedState}</div></Card>;
                const interp = interpretPattern(rd.perSource);
                const srcOrder = ["bgp", "probing", "telescope"];
                const srcLabels = { bgp: "BGP Routes", probing: "Sondeo Activo", telescope: "Telescopio" };
                const srcEmojis = { bgp: "🌐", probing: "📡", telescope: "🔭" };
                return (
                  <Card accent={getSeverityColor(rd.healthPct)}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:TEXT }}>{rd.name}</div>
                      <Badge color={getSeverityColor(rd.healthPct)}>{getSeverityLabel(rd.healthPct)}</Badge>
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"baseline", marginBottom:8 }}>
                      <span style={{ fontSize:28, fontWeight:900, fontFamily:"'Playfair Display',serif", color:getSeverityColor(rd.healthPct) }}>{rd.healthPct}%</span>
                      <span style={{ fontSize:11, color:MUTED }}>promedio</span>
                      {rd.displayScore > 0 && <span style={{ fontSize:12, color:"#dc2626", fontWeight:600 }}>Score: {fmtVal(rd.displayScore)}</span>}
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
                        return (
                          <div key={src} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, padding:"3px 0", borderBottom:`1px solid ${BORDER}20` }}>
                            <span style={{ color:TEXT }}>{srcEmojis[src]} {srcLabels[src]}</span>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <div style={{ width:40, height:4, background:`${BORDER}30`, borderRadius:2, overflow:"hidden" }}>
                                <div style={{ width:`${d.health}%`, height:4, background:c, borderRadius:2 }} />
                              </div>
                              <span style={{ fontWeight:700, color:c, minWidth:32, textAlign:"right" }}>{d.health}%</span>
                              <span style={{ color:MUTED, fontSize:10 }}>({d.current}/{d.baseline})</span>
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
                    {scoreView === "outage" ? (mapMode === "live" ? "Caída Actual" : "Outage Score") : "Salud %"}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {mapMode === "7d" && regionData7d.length === 0 && <span style={{ fontSize:9, fontFamily:font, color:AM }}>cargando 7d...</span>}
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
                      {scoreView === "outage" ? (mapMode === "live" ? "Caída" : "Puntaje") : "Salud"}
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
              Eventos Recientes
            </div>
            <span style={{ fontSize:12, fontFamily:font, color:events.length > 0 ? "#dc2626" : MUTED }}>
              {events.length} detectados · 7 días
            </span>
          </div>
          {events.length === 0 ? (
            <div style={{ textAlign:"center", padding:"30px 0", color:MUTED, fontSize:13 }}>
              No se detectaron eventos de interrupción en los últimos 7 días.
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:font }}>
                <thead>
                  <tr style={{ borderBottom:`2px solid ${BORDER}` }}>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:MUTED, fontWeight:600 }}>Fecha</th>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:MUTED, fontWeight:600 }}>Duración</th>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:MUTED, fontWeight:600 }}>Fuente</th>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:MUTED, fontWeight:600 }}>Severidad</th>
                    <th style={{ padding:"6px 8px", textAlign:"right", color:MUTED, fontWeight:600 }}>Caída</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev, i) => {
                    const sevColor = ev.condition === "critical" ? "#ef4444" : ev.condition === "high" ? "#f97316" : ev.condition === "medium" ? "#fbbf24" : MUTED;
                    return (
                      <tr key={i} style={{ borderBottom:`1px solid ${BORDER}30` }}>
                        <td style={{ padding:"8px" }}>
                          <div style={{ color:TEXT, fontWeight:600 }}>{ev.time ? fmtTime(ev.time) : "—"}</div>
                        </td>
                        <td style={{ padding:"8px", color:MUTED, fontSize:11 }}>{ev.duration ? fmtDuration(ev.duration) : "en curso"}</td>
                        <td style={{ padding:"8px" }}>
                          <Badge color={ev.datasource === "bgp" ? "#7c3aed" : ev.datasource === "probing" ? "#f59e0b" : "#dc2626"}>
                            {ev.datasource === "bgp" ? "BGP" : ev.datasource === "probing" ? "SONDEO" : ev.datasource === "telescope" ? "TELESCOPIO" : (ev.datasource || "?").toUpperCase()}
                          </Badge>
                        </td>
                        <td style={{ padding:"8px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:12, fontWeight:700, color:sevColor, textTransform:"uppercase" }}>{ev.condition === "critical" ? "CRÍTICO" : ev.condition === "high" ? "ALTO" : "MEDIO"}</span>
                            {/* Severity bar */}
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
                      {mapMode === "live" ? "24h" : mapMode === "24h" ? "24h" : "7 días"} · Scroll para zoom · Click estado en mapa para filtrar
                    </span>
                  </div>
                  {/* Main probing-based multi-line chart */}
                  <InteractiveChart states={chartStates} mapMode={mapMode} selectedState={selectedState}
                    onSelectState={s => setSelectedState(selectedState === s ? null : s)} palette={palette} />
                  
                  {/* Per-source breakdown for selected state */}
                  {selectedState && (() => {
                    const st = activeData.find(r => r.name === selectedState);
                    if (!st?.series?.length) return null;
                    return (
                      <div style={{ marginTop:12, borderTop:`1px solid ${BORDER}30`, paddingTop:10 }}>
                        <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>
                          {selectedState} — Desglose por indicador
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:8 }}>
                          {["bgp","probing","telescope"].map(src => {
                            const label = src === "bgp" ? "BGP Routes" : src === "probing" ? "Sondeo Activo" : "Telescopio";
                            const color = srcColors[src];
                            const vals = st.series.map(p => p[src]).filter(v => v !== null);
                            if (vals.length < 5) return (
                              <div key={src} style={{ padding:8, background:`${BORDER}08`, borderRadius:4, borderLeft:`3px solid ${MUTED}30` }}>
                                <div style={{ fontSize:11, fontWeight:600, color:MUTED }}>{label}</div>
                                <div style={{ fontSize:10, color:`${MUTED}60`, marginTop:4 }}>Sin datos suficientes</div>
                              </div>
                            );
                            const baseline = vals.slice(0, Math.max(1, Math.floor(vals.length * 0.1)));
                            const baseAvg = baseline.reduce((a,b) => a+b, 0) / baseline.length || 1;
                            const current = vals[vals.length - 1];
                            const health = Math.min(100, Math.round((current / baseAvg) * 100));
                            // Mini sparkline
                            const W2 = 200, H2 = 40, pL2 = 2, pR2 = 2, pT2 = 2, pB2 = 2;
                            const cW2 = W2-pL2-pR2, cH2 = H2-pT2-pB2;
                            const mn = Math.min(...vals), mx = Math.max(...vals);
                            let spark = "";
                            st.series.forEach((p, i) => {
                              const v = p[src]; if (v === null) return;
                              const x = pL2 + (i / (st.series.length - 1)) * cW2;
                              const y = pT2 + cH2 - ((v - mn) / (mx - mn || 1)) * cH2;
                              spark += spark === "" ? `M${x},${y}` : ` L${x},${y}`;
                            });
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
                                  Base: {fmtVal(baseAvg)} · Actual: {fmtVal(current)}
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
