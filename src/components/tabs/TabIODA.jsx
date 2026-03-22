import { useState, useEffect, useCallback } from "react";
import { BORDER, TEXT, MUTED, ACCENT, font, fontSans } from "../../constants";
import { IS_DEPLOYED, CORS_PROXIES } from "../../utils";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Badge } from "../Badge";
import { Card } from "../Card";
import { TwitterTimeline } from "../TwitterTimeline";
import { VZ_MAP } from "../../data/static";

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

  // ── 2. Load outage alerts from IODA + signal-based detection as fallback ──
  const loadEvents = useCallback(async () => {
    const now = Math.floor(Date.now() / 1000);
    const from = now - 7 * 86400;
    
    // Try IODA outages/alerts endpoint first (correct v2 path)
    const alertsJson = await iodaFetch(`outages/alerts/country/VE`, { from, until: now });
    if (alertsJson?.data && Array.isArray(alertsJson.data) && alertsJson.data.length > 0) {
      const evts = alertsJson.data
        .filter(e => e.level && e.level !== "normal")
        .map(e => ({
          time: e.time,
          datasource: e.datasource || "unknown",
          condition: e.level === "critical" ? "critical" : e.level === "warning" ? "medium" : "low",
          value: e.value,
          historyValue: e.historyValue,
          duration: null,
        }))
        .sort((a,b) => b.time - a.time)
        .slice(0, 20);
      if (evts.length > 0) { setEvents(evts); return; }
    }

    // Fallback: detect events from 7-day signal drops
    const json = await iodaFetch(`signals/raw/country/VE`, { from, until: now });
    const parsed = json ? parseSignals(json) : null;
    if (!parsed || parsed.length < 10) return;
    const detectedEvents = [];
    const windowSize = 12;
    for (let i = windowSize; i < parsed.length; i++) {
      const p = parsed[i];
      for (const key of ["bgp", "probing", "telescope"]) {
        if (p[key] === null) continue;
        const baseline = parsed.slice(Math.max(0, i - windowSize), i).map(x => x[key]).filter(v => v !== null);
        if (baseline.length < 3) continue;
        const avg = baseline.reduce((a,b) => a+b, 0) / baseline.length;
        if (avg === 0) continue;
        const dropPct = ((avg - p[key]) / avg) * 100;
        if (dropPct > 20) {
          const lastSame = detectedEvents.filter(e => e.datasource === key);
          if (lastSame.some(e => Math.abs(e.time - p.ts) < 7200)) continue;
          const severity = dropPct > 60 ? "critical" : dropPct > 40 ? "high" : "medium";
          let dur = 0;
          for (let j = i + 1; j < parsed.length; j++) {
            if (parsed[j][key] !== null && parsed[j][key] > avg * 0.8) break;
            dur += (parsed[j].ts - parsed[j-1].ts);
          }
          detectedEvents.push({ time: p.ts, datasource: key, condition: severity, value: Math.round(dropPct), duration: dur || null });
        }
      }
    }
    detectedEvents.sort((a,b) => b.time - a.time);
    setEvents(detectedEvents.slice(0, 20));
  }, []);

  // ── 3. Load regional scores (probing only, lighter) ──
  const loadRegions = useCallback(async () => {
    setRegionLoading(true);
    const now = Math.floor(Date.now() / 1000);
    const from = now - 24 * 3600;
    const scores = [];
    // Fetch top states in parallel (batch of 8 to avoid overload)
    const topStates = VE_REGIONS;
    const batches = [];
    for (let i = 0; i < topStates.length; i += 8) batches.push(topStates.slice(i, i + 8));
    for (const batch of batches) {
      const results = await Promise.allSettled(
        batch.map(async (st) => {
          const json = await iodaFetch(`signals/raw/region/${st.code}`, { from, until: now });
          if (!json) return null;
          const parsed = parseSignals(json);
          if (!parsed || parsed.length === 0) return null;
          // Calculate health: use probing (most granular), fallback to bgp
          const vals = parsed.map(p => p.probing ?? p.bgp).filter(v => v !== null);
          if (vals.length === 0) return null;
          const current = vals[vals.length - 1];
          const max = Math.max(...vals);
          const baseline = vals.slice(0, Math.max(1, Math.floor(vals.length * 0.1)));
          const baseAvg = baseline.reduce((a,b) => a+b, 0) / baseline.length || 1;
          const healthPct = baseAvg > 0 ? Math.round((current / baseAvg) * 100) : 100;
          // Drop score (how much it dropped from baseline)
          const dropScore = Math.max(0, Math.round(baseAvg - current));
          return { ...st, healthPct: Math.min(healthPct, 100), dropScore, current, baseAvg, series: parsed };
        })
      );
      results.forEach(r => { if (r.status === "fulfilled" && r.value) scores.push(r.value); });
    }
    scores.sort((a,b) => a.healthPct - b.healthPct); // worst first
    setRegionScores(scores);
    setRegionLoading(false);
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
      {subView === "estados" && (<>
        {regionLoading ? (
          <Card><div style={{ textAlign:"center", padding:40, color:MUTED, fontSize:14, fontFamily:font }}>
            <div style={{ fontSize:20, marginBottom:8 }}>🗺</div>Cargando datos por estado...<div style={{ fontSize:12, marginTop:4, color:`${MUTED}80` }}>24 estados · Probing + BGP · puede tardar 15-20s</div>
          </div></Card>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 320px", gap:14 }}>
            {/* Map */}
            <Card accent="#7c3aed">
              <div style={{ fontSize:13, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
                Mapa de Severidad de Interrupciones
              </div>
              <svg viewBox="0 0 600 420" style={{ width:"100%", background:"rgba(0,0,0,0.02)", borderRadius:4 }}>
                {VZ_MAP.map(state => {
                  const rData = regionScores.find(r => r.name === state.id);
                  const health = rData ? rData.healthPct : 100;
                  const fill = rData ? getSeverityColor(health) : `${MUTED}25`;
                  const isSelected = selectedState === state.id;
                  return (
                    <g key={state.id}>
                      <path d={state.d} fill={fill}
                        stroke={isSelected ? "#fff" : `${BORDER}`} strokeWidth={isSelected ? 2 : 0.5}
                        style={{ cursor:"pointer", transition:"all 0.2s" }}
                        opacity={selectedState && !isSelected ? 0.3 : 1}
                        onClick={() => setSelectedState(isSelected ? null : state.id)} />
                      {/* Label for affected states */}
                      {rData && health < 90 && !mob && (() => {
                        const match = state.d.match(/M\s*([\d.]+),([\d.]+)/);
                        if (!match) return null;
                        const bounds = state.d.match(/[\d.]+/g).map(Number);
                        const xs = bounds.filter((_, i) => i % 2 === 0), ys = bounds.filter((_, i) => i % 2 === 1);
                        const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
                        return <text x={cx} y={cy} textAnchor="middle" fontSize={8} fill="#fff" fontWeight={700} fontFamily={font}>{health}%</text>;
                      })()}
                    </g>
                  );
                })}
              </svg>
              {/* Legend */}
              <div style={{ display:"flex", gap:16, marginTop:8, justifyContent:"center", flexWrap:"wrap" }}>
                {[{l:"Normal",c:"#34d399"},{l:"Degradado",c:"#fbbf24"},{l:"Alto",c:"#f97316"},{l:"Crítico",c:"#ef4444"}].map(lg => (
                  <div key={lg.l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ width:10, height:10, borderRadius:"50%", background:lg.c }} />
                    <span style={{ fontSize:11, fontFamily:font, color:MUTED }}>{lg.l}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Rankings */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {/* Selected state detail */}
              {selectedState && (() => {
                const rd = regionScores.find(r => r.name === selectedState);
                if (!rd) return <Card><div style={{ fontSize:12, color:MUTED }}>Sin datos para {selectedState}</div></Card>;
                return (
                  <Card accent={getSeverityColor(rd.healthPct)}>
                    <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:4 }}>{rd.name}</div>
                    <div style={{ display:"flex", gap:12, alignItems:"baseline" }}>
                      <span style={{ fontSize:28, fontWeight:900, fontFamily:"'Playfair Display',serif", color:getSeverityColor(rd.healthPct) }}>{rd.healthPct}%</span>
                      <Badge color={getSeverityColor(rd.healthPct)}>{getSeverityLabel(rd.healthPct)}</Badge>
                    </div>
                    <div style={{ fontSize:11, color:MUTED, marginTop:4 }}>Baseline: {fmtVal(rd.baseAvg)} · Actual: {fmtVal(rd.current)}</div>
                  </Card>
                );
              })()}

              {/* Ranking table */}
              <Card accent="#f59e0b">
                <div style={{ fontSize:13, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
                  Puntajes de Interrupción
                </div>
                {regionScores.length === 0 ? (
                  <div style={{ fontSize:12, color:MUTED, padding:8 }}>Cargando...</div>
                ) : (
                  <div style={{ maxHeight:400, overflowY:"auto" }}>
                    {regionScores.map((r, i) => (
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
                          <span style={{ fontSize:13, fontWeight:700, fontFamily:font, color:getSeverityColor(r.healthPct) }}>
                            {r.healthPct}%
                          </span>
                          {r.dropScore > 0 && (
                            <span style={{ fontSize:10, fontFamily:font, color:"#dc2626" }}>↓{fmtVal(r.dropScore)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </>)}

      {/* ══════ EVENTOS ══════ */}
      {subView === "eventos" && (
        <Card accent="#f59e0b">
          <div style={{ fontSize:13, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
            Eventos Recientes · Últimos 7 días
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
                    <th style={{ padding:"6px 8px", textAlign:"left", color:MUTED, fontWeight:600 }}>Fuente</th>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:MUTED, fontWeight:600 }}>Severidad</th>
                    <th style={{ padding:"6px 8px", textAlign:"right", color:MUTED, fontWeight:600 }}>Score</th>
                    <th style={{ padding:"6px 8px", textAlign:"left", color:MUTED, fontWeight:600 }}>Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev, i) => {
                    const sevColor = ev.condition === "critical" ? "#ef4444" : ev.condition === "high" ? "#f97316" : ev.condition === "medium" ? "#fbbf24" : MUTED;
                    return (
                      <tr key={i} style={{ borderBottom:`1px solid ${BORDER}30` }}>
                        <td style={{ padding:"8px", color:TEXT }}>{ev.time ? fmtTime(ev.time) : "—"}</td>
                        <td style={{ padding:"8px" }}>
                          <Badge color={ev.datasource === "bgp" ? "#7c3aed" : ev.datasource?.includes("ping") ? "#f59e0b" : "#dc2626"}>
                            {(ev.datasource || "?").toUpperCase().replace("PING-SLASH24","SONDEO").replace("MERIT-NT","TELESCOPIO").replace("UCSD-NT","TELESCOPIO")}
                          </Badge>
                        </td>
                        <td style={{ padding:"8px" }}>
                          <span style={{ fontSize:12, fontWeight:600, color:sevColor, textTransform:"uppercase" }}>{ev.condition || "?"}</span>
                        </td>
                        <td style={{ padding:"8px", textAlign:"right", fontWeight:700, color:sevColor }}>{ev.historyValue ? `${fmtVal(ev.value)} / ${fmtVal(ev.historyValue)}` : ev.value ? `-${ev.value}%` : "—"}</td>
                        <td style={{ padding:"8px", color:MUTED }}>{ev.duration ? fmtDuration(ev.duration) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
