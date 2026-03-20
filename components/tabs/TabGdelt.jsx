import { useState, useEffect } from "react";
import { GDELT_ANNOTATIONS } from "../../data/static.js";
import { BG, BG3, BORDER, TEXT, MUTED, ACCENT, font } from "../../constants";
import { fetchAllGdelt, generateMockGdelt } from "../../utils";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Card } from "../Card";
import { GdeltChart } from "../charts/GdeltChart";

export function TabGdelt() {
  const mob = useIsMobile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("loading");
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null); setSource("loading");
    try {
      const live = await fetchAllGdelt();
      if (live && live.length > 10) { setData(live); setSource("live"); }
      else { setData(generateMockGdelt()); setSource("mock"); setError("GDELT no respondió — datos simulados"); }
    } catch (e) { setData(generateMockGdelt()); setSource("mock"); setError(`Fallback: ${e.message}`); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Compute KPI stats (like Umbral)
  const stats = useMemo(() => {
    if (!data || data.length < 30) return { instDelta:null, tone:null, phase:null };
    const baseline = data.slice(0, 30);
    const recent = data.slice(-14);
    const baseAvg = baseline.reduce((s,d) => s+(d.instability||0), 0) / baseline.length;
    const recentAvg = recent.reduce((s,d) => s+(d.instability||0), 0) / recent.length;
    const instDelta = baseAvg > 0 ? ((recentAvg-baseAvg)/baseAvg)*100 : null;
    const tone = data[data.length-1]?.tone ?? null;
    // Composite phase
    const rI = recent.reduce((s,d) => s+(d.instability||0), 0) / recent.length;
    const rT = recent.reduce((s,d) => s+(d.tone||0), 0) / recent.length;
    const rA = recent.reduce((s,d) => s+(d.artvolnorm||0), 0) / recent.length;
    const clamp = (v,mn,mx) => Math.min(mx,Math.max(mn,v));
    const composite = (clamp(rI/6,0,1) + clamp(-rT/8,0,1) + clamp(rA/4,0,1)) / 3;
    const phase = composite > 0.6 ? "CRISIS" : composite > 0.35 ? "ELEVADO" : "ESTABLE";
    return { instDelta, tone, phase };
  }, [data]);

  const tierColor = { CRITICAL:"#ff2222", HIGH:"#ff7733", MEDIUM:"#c49000", LOW:"#0e7490" };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>📡</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:TEXT, fontFamily:"'Syne',sans-serif", letterSpacing:"0.05em", textTransform:"uppercase" }}>Cobertura Mediática Internacional</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED }}>
            Señales mediáticas en tiempo real del Proyecto GDELT monitoreando la cobertura sobre Venezuela
          </div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {source === "mock" && !loading && (
            <button onClick={loadData} style={{ fontSize:12, fontFamily:font, padding:"4px 10px", background:"transparent",
              border:`1px solid ${ACCENT}40`, color:ACCENT, cursor:"pointer" }}>↻ Reintentar</button>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", border:`1px solid ${source==="live"?"#22c55e30":source==="mock"?"#a17d0830":"#4a709030"}` }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:source==="live"?"#22c55e":source==="mock"?"#a17d08":"#4a7090",
              boxShadow:source==="live"?"0 0 6px #22c55e":"none", animation:source==="live"?"pulse 1.5s infinite":"none" }} />
            <span style={{ fontSize:12, fontFamily:font, color:source==="live"?"#22c55e":source==="mock"?"#a17d08":"#4a7090" }}>
              {source==="live"?"EN VIVO":source==="mock"?"SIMULADO":"..."}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ fontSize:12, fontFamily:font, color:"#a17d08", padding:"6px 12px",
          background:"rgba(234,179,8,0.08)", border:"1px solid rgba(234,179,8,0.2)", marginBottom:12 }}>
          ⚠ {error}
        </div>
      )}

      {/* Explanation */}
      <Card accent={ACCENT} style={{ marginBottom:14 }}>
        <div style={{ fontSize:13, color:TEXT, lineHeight:1.7 }}>
          <strong>¿Qué es esto?</strong> Este panel analiza cómo los medios de comunicación internacionales cubren Venezuela. Usa el <strong>Proyecto GDELT</strong>, que procesa miles de noticias diarias y mide: <strong style={{ color:"#ff3b3b" }}>Conflicto</strong> (cuánto se habla de inestabilidad), <strong style={{ color:"#0e7490" }}>Tono</strong> (si la cobertura es positiva o negativa), y <strong style={{ color:"#c49000" }}>Atención</strong> (volumen de noticias). Cambios bruscos pueden indicar eventos significativos.
        </div>
      </Card>

      {loading ? (
        <Card><div style={{ textAlign:"center", padding:40, color:MUTED, fontSize:14, fontFamily:font }}>
          <div style={{ fontSize:20, marginBottom:8 }}>📡</div>
          Conectando con GDELT DOC API v2...
        </div></Card>
      ) : data ? (<>
        {/* KPI Cards */}
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
          <Card accent={stats.instDelta>0?"#ff3b3b":"#7c3aed"}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Inestabilidad Δ</div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:12 }}>{stats.instDelta>0?"📈":"📉"}</span>
              <span style={{ fontSize:20, fontWeight:800, fontFamily:"'Playfair Display',serif",
                color:stats.instDelta>0?"#ff3b3b":"#7c3aed" }}>
                {stats.instDelta!==null ? `${stats.instDelta>0?"+":""}${stats.instDelta.toFixed(1)}%` : "—"}
              </span>
            </div>
            <div style={{ fontSize:10, color:MUTED, marginTop:2 }}>vs línea base dic 2025</div>
          </Card>
          <Card accent={(stats.tone||0)<-5?"#ff3b3b":(stats.tone||0)<-2?"#f59e0b":"#7c3aed"}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Tono Mediático</div>
            <span style={{ fontSize:20, fontWeight:800, fontFamily:"'Playfair Display',serif",
              color:(stats.tone||0)<-5?"#ff3b3b":(stats.tone||0)<-2?"#f59e0b":"#7c3aed" }}>
              {stats.tone!==null ? stats.tone.toFixed(2) : "—"}
            </span>
            <div style={{ fontSize:10, color:MUTED, marginTop:2 }}>Actual</div>
          </Card>
          <Card accent={stats.phase==="CRISIS"?"#ff3b3b":stats.phase==="ELEVADO"?"#f59e0b":"#7c3aed"}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Señal Compuesta</div>
            <span style={{ fontSize:20, fontWeight:800, fontFamily:"'Playfair Display',serif",
              color:stats.phase==="CRISIS"?"#ff3b3b":stats.phase==="ELEVADO"?"#f59e0b":"#7c3aed" }}>
              {stats.phase || "—"}
            </span>
            <div style={{ fontSize:10, color:MUTED, marginTop:2 }}>Incluye inestabilidad, tono y oleada</div>
          </Card>
        </div>

        {/* Chart */}
        <Card><GdeltChart data={data} /></Card>

        {/* Event Timeline */}
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:13, fontWeight:700, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
            Línea de Tiempo de Eventos
          </div>
          {GDELT_ANNOTATIONS.map((a,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px",
              transition:"background 0.15s", cursor:"default", borderBottom:`1px solid ${BORDER}20` }}
              onMouseEnter={e=>e.currentTarget.style.background=`${BG3}`}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ width:10, height:10, borderRadius:"50%", background:tierColor[a.tier], flexShrink:0,
                boxShadow:`0 0 8px ${tierColor[a.tier]}50`, border:`2px solid ${BG}` }} />
              <span style={{ fontSize:13, fontFamily:font, color:MUTED, minWidth:100 }}>
                {new Date(a.date+"T00:00").toLocaleDateString("es",{day:"numeric",month:"short",year:"numeric"})}
              </span>
              <span style={{ fontSize:14, color:TEXT, flex:1 }}>{a.label}</span>
              <span style={{ fontSize:10, fontFamily:font, fontWeight:700, padding:"2px 8px", letterSpacing:"0.1em",
                color:tierColor[a.tier], background:`${tierColor[a.tier]}12`, border:`1px solid ${tierColor[a.tier]}30`,
                minWidth:60, textAlign:"center" }}>{a.tierEs}</span>
            </div>
          ))}
        </div>

        {/* Signal descriptions */}
        <div style={{ marginTop:16, display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:12 }}>
          <Card accent="#ff3b3b">
            <div style={{ fontSize:13, fontWeight:600, color:"#ff3b3b", marginBottom:6 }}>● Índice de Conflicto</div>
            <div style={{ fontSize:13, color:MUTED, lineHeight:1.6 }}>
              Volumen normalizado de artículos con Venezuela + conflicto/protesta/crisis/violencia. <span style={{color:"#ff3b3b"}}>Eje izquierdo · Línea sólida</span>
            </div>
          </Card>
          <Card accent="#c49000">
            <div style={{ fontSize:13, fontWeight:600, color:"#c49000", marginBottom:6 }}>● Oleada de Atención</div>
            <div style={{ fontSize:13, color:MUTED, lineHeight:1.6 }}>
              Atención mediática normalizada. Mide la intensidad del interés internacional. <span style={{color:"#c49000"}}>Eje izquierdo · Línea sólida</span>
            </div>
          </Card>
          <Card accent="#0e7490">
            <div style={{ fontSize:13, fontWeight:600, color:"#0e7490", marginBottom:6 }}>● Tono Mediático</div>
            <div style={{ fontSize:13, color:MUTED, lineHeight:1.6 }}>
              Sentimiento promedio de cobertura internacional (-10 a +2). Negativo = conflictivo. <span style={{color:"#0e7490"}}>Eje derecho · Línea punteada</span>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div style={{ marginTop:12, fontSize:10, fontFamily:font, color:`${MUTED}60`, lineHeight:1.8, display:"flex", justifyContent:"space-between" }}>
          <span>📡 Fuente: GDELT Project DOC API v2 · 3 queries paralelas via CORS proxy</span>
          <span>Última actualización: {new Date().toLocaleString("es",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span>
        </div>
      </>) : (
        <Card><div style={{ color:MUTED, fontSize:14, textAlign:"center", padding:20 }}>No se pudieron obtener datos</div></Card>
      )}
    </div>
  );
}
