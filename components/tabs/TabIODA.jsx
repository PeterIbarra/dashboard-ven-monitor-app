import { useState, useEffect, useCallback } from "react";
import { BORDER, TEXT, MUTED, ACCENT, font } from "../../constants";
import { IS_DEPLOYED, CORS_PROXIES } from "../../utils";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Badge } from "../Badge";
import { Card } from "../Card";
import { TwitterTimeline } from "../TwitterTimeline";

export function TabIODA() {
  const mob = useIsMobile();
  const [signals, setSignals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("loading");
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("24h");
  const [hover, setHover] = useState(null);

  const IODA_BASE = "https://api.ioda.inetintel.cc.gatech.edu/v2";
  const hoursMap = { "24h":24, "48h":48, "7d":168 };

  const loadIODA = useCallback(async () => {
    setLoading(true); setError(null); setSource("loading");
    const hours = hoursMap[timeRange];
    const now = Math.floor(Date.now() / 1000);
    const from = now - hours * 3600;
    
    // Build URLs: Vercel serverless first, then direct via CORS proxy
    const directUrl = `${IODA_BASE}/signals/raw/country/VE?from=${from}&until=${now}`;
    const vercelUrl = `/api/ioda?path=signals/raw/country/VE&from=${from}&until=${now}`;
    
    const urlsToTry = IS_DEPLOYED
      ? [() => vercelUrl, ...CORS_PROXIES.map(fn => () => fn(directUrl))]
      : CORS_PROXIES.map(fn => () => fn(directUrl));

    for (const getUrl of urlsToTry) {
      try {
        const res = await fetch(getUrl(), {
          signal: AbortSignal.timeout(10000),
          headers: { Accept: "application/json" },
        });
        if (!res.ok) continue;
        const json = await res.json();
        const rawSignals = Array.isArray(json?.data) ? json.data.flat() : [];
        if (rawSignals.length === 0) continue;

        // Normalize: merge BGP, probing, telescope into unified series
        const bgp = rawSignals.find(s => s.datasource === "bgp");
        const probing = rawSignals.find(s => s.datasource === "ping-slash24");
        const telescope = rawSignals.find(s => s.datasource === "ucsd-nt") || rawSignals.find(s => s.datasource === "merit-nt");

        const anchor = [bgp, probing, telescope].filter(Boolean).sort((a,b) => b.values.length - a.values.length)[0];
        if (!anchor) continue;

        const valueAt = (sig, ts) => {
          if (!sig) return null;
          const idx = Math.round((ts - sig.from) / sig.step);
          return (idx >= 0 && idx < sig.values.length) ? sig.values[idx] : null;
        };

        const fmt = (epoch) => new Date(epoch * 1000).toLocaleString("es-VE", {
          timeZone:"America/Caracas", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", hour12:false
        });

        const normalized = anchor.values.map((_, i) => {
          const ts = anchor.from + i * anchor.step;
          return { time: fmt(ts), timestamp: ts, bgp: valueAt(bgp, ts), probing: valueAt(probing, ts), telescope: valueAt(telescope, ts) };
        });

        setSignals(normalized);
        setSource("live");
        setLoading(false);
        return;
      } catch { continue; }
    }

    // All proxies failed
    setSignals(null);
    setSource("failed");
    setError("No se pudo conectar con IODA API. Prueba los links directos abajo.");
    setLoading(false);
  }, [timeRange]);

  useEffect(() => { loadIODA(); }, [loadIODA]);

  // Signal chart renderer
  const renderSignalChart = (key, label, color, data) => {
    if (!data || data.length === 0) return null;
    const vals = data.map(d => d[key]).filter(v => v !== null);
    if (vals.length === 0) return (
      <Card accent={color}>
        <div style={{ fontSize:13, fontWeight:600, color, marginBottom:4 }}>{label}</div>
        <div style={{ fontSize:13, color:MUTED, padding:"20px 0", textAlign:"center" }}>Sin datos</div>
      </Card>
    );
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const current = vals[vals.length - 1];
    const baseline = vals.slice(0, Math.max(1, Math.floor(vals.length * 0.2)));
    const avg = baseline.reduce((a,b) => a+b, 0) / baseline.length;
    const pctChange = avg !== 0 ? ((current - avg) / avg * 100) : 0;

    const W = 600, H = 100, padL = 50, padR = 10, padT = 5, padB = 5;
    const cW = W-padL-padR, cH = H-padT-padB;
    const toX = (i) => padL + (i/(data.length-1)) * cW;
    const toY = (v) => v === null ? null : padT + cH - ((v-min)/(max-min||1))*cH;

    let pathD = "";
    let areaD = "";
    let firstX = null, lastX = null;
    data.forEach((d, i) => {
      const v = d[key];
      if (v === null) return;
      const x = toX(i), y = toY(v);
      if (firstX === null) { pathD += `M${x},${y}`; firstX = x; }
      else pathD += ` L${x},${y}`;
      lastX = x;
    });
    if (firstX !== null) areaD = pathD + ` L${lastX},${padT+cH} L${firstX},${padT+cH} Z`;

    const fmtVal = (v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(1)}K` : v.toFixed(0);

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
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mx = (e.clientX - rect.left) / rect.width * W;
            const idx = Math.round(((mx - padL) / cW) * (data.length-1));
            if (idx >= 0 && idx < data.length) setHover({ key, idx });
          }}
          onMouseLeave={() => setHover(null)}>
          {/* Grid */}
          {[0,0.5,1].map(f => (
            <line key={f} x1={padL} y1={padT+f*cH} x2={padL+cW} y2={padT+f*cH} stroke="rgba(0,0,0,0.06)" />
          ))}
          {/* Y axis labels */}
          <text x={padL-4} y={padT+6} textAnchor="end" fontSize={7} fill={MUTED} fontFamily={font}>{fmtVal(max)}</text>
          <text x={padL-4} y={padT+cH} textAnchor="end" fontSize={7} fill={MUTED} fontFamily={font}>{fmtVal(min)}</text>
          {/* Area + Line */}
          <path d={areaD} fill={`${color}12`} />
          <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} />
          {/* Hover */}
          {hover && hover.key === key && hover.idx < data.length && data[hover.idx][key] !== null && (
            <>
              <line x1={toX(hover.idx)} y1={padT} x2={toX(hover.idx)} y2={padT+cH} stroke="rgba(0,0,0,0.1)" />
              <circle cx={toX(hover.idx)} cy={toY(data[hover.idx][key])} r={3} fill={color} />
            </>
          )}
        </svg>
        {hover && hover.key === key && hover.idx < data.length && (
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, marginTop:4 }}>
            {data[hover.idx].time} · <span style={{ color }}>{data[hover.idx][key] !== null ? fmtVal(data[hover.idx][key]) : "—"}</span>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>🌐</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600, color:TEXT }}>Monitor de Internet — Venezuela</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em" }}>
            Detección de interrupciones de internet · Georgia Tech IODA · {source === "live" ? `${signals?.length || 0} puntos · EN VIVO` : source === "failed" ? "Sin conexión" : "Conectando..."}
          </div>
        </div>
        <Badge color={source==="live"?"#7c3aed":source==="failed"?"#dc2626":"#a17d08"}>
          {source==="live"?"EN VIVO":source==="failed"?"OFFLINE":"..."}
        </Badge>
        {/* Time range selector */}
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}`, flexWrap:"wrap" }}>
          {["24h","48h","7d"].map(r => (
            <button key={r} onClick={() => setTimeRange(r)}
              style={{ fontSize:12, fontFamily:font, padding:"5px 12px", border:"none",
                background:timeRange===r?ACCENT:"transparent", color:timeRange===r?"#fff":MUTED,
                cursor:"pointer", letterSpacing:"0.08em" }}>
              {r}
            </button>
          ))}
        </div>
        {source === "failed" && (
          <button onClick={loadIODA}
            style={{ fontSize:12, fontFamily:font, padding:"4px 10px", background:"transparent",
              border:`1px solid ${ACCENT}40`, color:ACCENT, cursor:"pointer" }}>
            ↻ Reintentar
          </button>
        )}
      </div>

      {error && (
        <div style={{ fontSize:12, fontFamily:font, color:"#a17d08", padding:"6px 12px",
          background:"rgba(234,179,8,0.08)", border:"1px solid rgba(234,179,8,0.2)", marginBottom:12 }}>
          ⚠ {error}
        </div>
      )}

      {/* Explanation */}
      <Card accent="#7c3aed" style={{ marginBottom:14 }}>
        <div style={{ fontSize:13, color:TEXT, lineHeight:1.7 }}>
          <strong>¿Qué es esto?</strong> Este panel monitorea en tiempo real si hay cortes o interrupciones de internet en Venezuela. Cuando se bloquean sitios, se restringen redes sociales o hay fallas de infraestructura, las señales caen. Una caída simultánea indica un corte generalizado. Para reportes de censura digital: <a href="https://x.com/vesinfiltro" target="_blank" rel="noopener" style={{ color:"#1d9bf0", textDecoration:"none", fontWeight:600 }}>@VeSinFiltro</a>.
        </div>
      </Card>

      {loading ? (
        <Card>
          <div style={{ textAlign:"center", padding:40, color:MUTED, fontSize:14, fontFamily:font }}>
            <div style={{ fontSize:20, marginBottom:8 }}>🌐</div>
            Conectando con IODA...
            <div style={{ fontSize:12, marginTop:4, color:`${MUTED}80` }}>
              Señales BGP + Active Probing + Telescope · Venezuela · {timeRange}
            </div>
          </div>
        </Card>
      ) : signals ? (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {renderSignalChart("bgp", "BGP Routes", "#7c3aed", signals)}
          {renderSignalChart("probing", "Active Probing", "#f59e0b", signals)}
          {renderSignalChart("telescope", "Network Telescope", "#dc2626", signals)}
        </div>
      ) : (
        <Card>
          <div style={{ textAlign:"center", padding:"30px 20px" }}>
            <div style={{ fontSize:24, marginBottom:10 }}>📡</div>
            <div style={{ fontSize:12, fontWeight:600, color:TEXT, marginBottom:8 }}>
              Conexión directa no disponible
            </div>
            <div style={{ fontSize:13, color:MUTED, lineHeight:1.6, maxWidth:500, margin:"0 auto", marginBottom:16 }}>
              La API de IODA bloquea requests cross-origin desde el navegador. 
              Puedes ver los datos en tiempo real en los links de abajo, o desplegar 
              el dashboard en Vercel con rutas API server-side.
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <a href="https://ioda.inetintel.cc.gatech.edu/country/VE" target="_blank" rel="noopener noreferrer"
                style={{ fontSize:13, fontFamily:font, color:ACCENT, textDecoration:"none", padding:"6px 14px", border:`1px solid ${ACCENT}30`, borderRadius:4 }}>
                ↗ IODA Venezuela
              </a>
              <a href="https://x.com/vesinfiltro" target="_blank" rel="noopener noreferrer"
                style={{ fontSize:13, fontFamily:font, color:"#1d9bf0", textDecoration:"none", padding:"6px 14px", border:"1px solid rgba(29,155,240,0.3)", borderRadius:4 }}>
                𝕏 @VeSinFiltro
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Signal descriptions */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:12, marginTop:12 }}>
        {[{title:"BGP Routes",desc:"Rutas de red anunciadas a nivel de proveedor. Una caída indica pérdida de conectividad upstream — Venezuela tiene ~4.500 prefijos BGP.",color:"#7c3aed"},
          {title:"Active Probing",desc:"Sondeo activo de ~85K hosts venezolanos. Mide reachability real de dispositivos finales. Más granular que BGP.",color:"#f59e0b"},
          {title:"Network Telescope",desc:"Tráfico de fondo no solicitado. Anomalías (caídas abruptas) indican interrupciones masivas a nivel de infraestructura nacional.",color:"#dc2626"}
        ].map((s,i) => (
          <Card key={i} accent={s.color}>
            <div style={{ fontSize:13, fontWeight:600, color:s.color, marginBottom:4 }}>{s.title}</div>
            <div style={{ fontSize:12, color:MUTED, lineHeight:1.5 }}>{s.desc}</div>
          </Card>
        ))}
      </div>

      {/* VeSinFiltro Timeline */}
      <Card accent="#1d9bf0" style={{ marginTop:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:TEXT }}>𝕏 @VeSinFiltro</div>
            <div style={{ fontSize:12, color:MUTED }}>Reportes de censura y bloqueos de internet en Venezuela</div>
          </div>
          <a href="https://x.com/vesinfiltro" target="_blank" rel="noopener noreferrer"
            style={{ fontSize:12, fontFamily:font, color:"#1d9bf0", textDecoration:"none", padding:"4px 12px", border:"1px solid rgba(29,155,240,0.3)", borderRadius:4 }}>
            Ver en 𝕏
          </a>
        </div>
        <TwitterTimeline handle="vesinfiltro" height={400} />
      </Card>

      <div style={{ marginTop:12, fontSize:10, fontFamily:font, color:`${MUTED}80`, lineHeight:1.8 }}>
        Fuente: IODA (Georgia Tech) · API v2 · Hora Venezuela (UTC-4) · 
        Reportes de censura: <a href="https://x.com/vesinfiltro" target="_blank" rel="noopener" style={{ color:"#1d9bf0", textDecoration:"none" }}>@VeSinFiltro</a>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
