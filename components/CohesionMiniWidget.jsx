import { memo, useState, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { BG2, BG3, BORDER, TEXT, MUTED, font, fontSans } from "../constants";
import { IS_DEPLOYED } from "../utils";

export const CohesionMiniWidget = memo(function CohesionMiniWidget({ liveData = {} }) {
  const mob = useIsMobile();
  const [hover, setHover] = useState(false);
  const [hoverActor, setHoverActor] = useState(null);

  const data = liveData?.cohesion || null;

  const statusColor = {ALINEADO:"#16a34a",NEUTRO:"#ca8a04",TENSION:"#dc2626",SILENCIO:"#6b7280"};
  const statusLabel = {ALINEADO:"Alineado",NEUTRO:"Neutro",TENSION:"Tensión",SILENCIO:"Silencio"};

  if (!data) {
    return (
      <div style={{ border:`1px solid ${BORDER}`, background:BG2, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:14 }}>🏛</span>
        <span style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em" }}>COHESIÓN DE GOBIERNO · Cargando...</span>
        <span style={{ width:6, height:6, borderRadius:"50%", background:MUTED, animation:"pulse 1.5s infinite", marginLeft:"auto" }} />
      </div>
    );
  }

  const score = data.index;
  const level = data.level;
  const levelColor = {ALTA:"#16a34a",MEDIA:"#ca8a04",BAJA:"#f97316",CRITICA:"#dc2626"};
  const col = levelColor[level] || MUTED;
  const aligned = data.actors?.filter(a => a.status === "ALINEADO").length || 0;
  const tension = data.actors?.filter(a => a.status === "TENSION").length || 0;
  const actors = data.actors || [];

  return (
    <div style={{ border:`1px solid ${BORDER}`, background:BG2 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setHoverActor(null); }}>
      {/* Compact header row */}
      <div style={{ display:"flex", alignItems:"center", gap:0, cursor:"pointer" }}>
        {/* Left: Score */}
        <div style={{ padding:mob?"8px 10px":"10px 14px", display:"flex", alignItems:"center", gap:8, borderRight:`1px solid ${BORDER}40`, minWidth:mob?"auto":160 }}>
          <span style={{ fontSize:14 }}>🏛</span>
          <div>
            <div style={{ fontSize:8, fontFamily:font, letterSpacing:"0.12em", textTransform:"uppercase", color:MUTED }}>Cohesión de Gobierno</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:4, marginTop:1 }}>
              <span style={{ fontSize:mob?20:26, fontWeight:900, fontFamily:"'Playfair Display',serif", color:col, lineHeight:1 }}>{score}</span>
              <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>/100</span>
            </div>
          </div>
        </div>
        {/* Mini thermometer */}
        <div style={{ flex:1, padding:mob?"6px 8px":"8px 14px" }}>
          <div style={{ position:"relative", height:10, background:"linear-gradient(to right, #dc2626, #f97316, #ca8a04, #16a34a)", borderRadius:4, overflow:"hidden" }}>
            {[25,50,75].map(v => <div key={v} style={{ position:"absolute", left:`${v}%`, top:0, bottom:0, width:1, background:"rgba(255,255,255,0.3)" }} />)}
            <div style={{ position:"absolute", left:`${score}%`, top:"50%", transform:"translate(-50%,-50%)", width:8, height:8, borderRadius:"50%", background:"#fff", border:`2px solid ${col}`, boxShadow:`0 0 4px ${col}` }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:7, fontFamily:font, color:`${MUTED}60`, marginTop:2 }}>
            <span>Crítica</span><span>Baja</span><span>Media</span><span>Alta</span>
          </div>
        </div>
        {/* Actor dots + level badge */}
        <div style={{ padding:mob?"6px 8px":"8px 14px", display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ display:"flex", gap:2 }}>
            {actors.map(a => (
              <span key={a.actor} title={`${a.name}: ${statusLabel[a.status]||a.status}`}
                onMouseEnter={() => setHoverActor(a.actor)}
                style={{ width:7, height:7, borderRadius:"50%", background:statusColor[a.status]||BORDER,
                  transition:"transform 0.15s", transform:hoverActor===a.actor?"scale(1.6)":"scale(1)" }} />
            ))}
          </div>
          <div style={{ fontSize:10, fontFamily:fontSans, fontWeight:700, color:col, padding:"1px 8px",
            background:`${col}12`, border:`1px solid ${col}25` }}>{level}</div>
        </div>
      </div>

      {/* Expanded on hover */}
      {hover && actors.length > 0 && (
        <div style={{ padding:mob?"8px 10px":"10px 14px", borderTop:`1px solid ${BORDER}40`, animation:"fadeSlide 0.2s ease" }}>
          <style>{`@keyframes fadeSlide { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }`}</style>
          {/* Actor grid */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:5, marginBottom:8 }}>
            {actors.map(a => {
              const sc = statusColor[a.status]||MUTED;
              const isHov = hoverActor===a.actor;
              return (
                <div key={a.actor}
                  onMouseEnter={() => setHoverActor(a.actor)}
                  onMouseLeave={() => setHoverActor(null)}
                  style={{ background:isHov?`${sc}08`:BG3, borderLeft:`3px solid ${sc}`, padding:"6px 8px",
                    borderRadius:3, transition:"all 0.15s" }}>
                  <div style={{ fontSize:10, fontWeight:600, color:TEXT, lineHeight:1.2,
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.name}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:3, marginTop:2 }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:sc }} />
                    <span style={{ fontSize:9, fontFamily:font, color:sc, fontWeight:600 }}>{statusLabel[a.status]||a.status}</span>
                    {a.mentions!=null && <span style={{ fontSize:8, fontFamily:font, color:MUTED, marginLeft:"auto" }}>{a.mentions}m</span>}
                  </div>
                  {isHov && a.evidence && (
                    <div style={{ fontSize:9, color:MUTED, marginTop:3, lineHeight:1.3 }}>{a.evidence}</div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Component bars compact */}
          {data.components && (
            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:4 }}>
              {Object.entries(data.components).filter(([,v])=>v).map(([key,comp]) => {
                const meta = {
                  aiAlignment:{name:"IA Mistral",color:"#8b5cf6"},
                  gdeltToneDivergence:{name:"Tono GDELT",color:"#0e7490"},
                  mentionSilence:{name:"Menciones",color:"#f59e0b"},
                  systemicCohesion:{name:"Chavismo",color:"#dc2626"},
                  polymarketDelta:{name:"Polymarket",color:"#3b82f6"},
                  sitrepValidation:{name:"SITREP",color:"#16a34a"},
                }[key]||{name:key,color:MUTED};
                return (
                  <div key={key} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:MUTED, width:70, flexShrink:0 }}>{meta.name}</span>
                    <div style={{ flex:1, height:4, background:BG3, borderRadius:2, overflow:"hidden" }}>
                      <div style={{ width:`${Math.max(2,comp.score)}%`, height:"100%", background:meta.color, borderRadius:2 }} />
                    </div>
                    <span style={{ fontSize:9, fontFamily:font, fontWeight:600, color:meta.color, width:20, textAlign:"right" }}>{comp.score}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ fontSize:8, fontFamily:font, color:`${MUTED}50`, marginTop:6, display:"flex", justifyContent:"space-between" }}>
            <span>{aligned}✓ alineados · {tension}⚠ tensión · {data.engine||"—"}</span>
            <span>{new Date(data.fetchedAt).toLocaleString("es-VE",{timeZone:"America/Caracas",hour:"2-digit",minute:"2-digit"})}</span>
          </div>
        </div>
      )}
    </div>
  );
});
