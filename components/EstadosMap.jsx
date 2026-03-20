import { memo, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { CONF_ESTADOS } from "../data/static.js";
import { VZ_MAP } from "../data/static.js";
import { BG, BG2, BORDER, TEXT, MUTED, ACCENT, font } from "../constants";

export const EstadosMap = memo(function EstadosMap() {
  const mob = useIsMobile();
  const [selected, setSelected] = useState(null);
  const maxEst = Math.max(...CONF_ESTADOS.map(e=>e.p));
  const lider = CONF_ESTADOS[0]; // highest

  // Color scale: protestas -> intensity
  const getColor = (protestas) => {
    const t = protestas / maxEst;
    if (t > 0.8) return "#E5243B";
    if (t > 0.6) return "#ff6b35";
    if (t > 0.4) return "#f59e0b";
    if (t > 0.2) return "#0A97D9";
    return "#0A97D980";
  };

  const sel = selected ? CONF_ESTADOS.find(e => e.e === selected) : null;
  const selRank = sel ? CONF_ESTADOS.indexOf(sel) + 1 : null;

  return (
    <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 320px", gap:16 }}>
      {/* Map */}
      <div>
        <svg viewBox="0 0 600 420" style={{ width:"100%", background:BG2, border:`1px solid ${BORDER}`, padding:8 }}>
          {VZ_MAP.map(state => {
            const data = CONF_ESTADOS.find(e => e.e === state.id);
            const isSelected = selected === state.id;
            return (
              <g key={state.id}>
                <path d={state.d} fill={data ? getColor(data.p) : `${MUTED}30`}
                  stroke={isSelected ? "#fff" : `${BORDER}`} strokeWidth={isSelected ? 2 : 0.5}
                  style={{ cursor:"pointer", transition:"all 0.2s" }}
                  opacity={selected && !isSelected ? 0.4 : 1}
                  onClick={() => setSelected(isSelected ? null : state.id)}
                  onMouseEnter={e => { if(!isSelected) e.currentTarget.setAttribute("stroke","#fff"); e.currentTarget.setAttribute("stroke-width","1.5"); }}
                  onMouseLeave={e => { if(!isSelected) { e.currentTarget.setAttribute("stroke",BORDER); e.currentTarget.setAttribute("stroke-width","0.5"); }}}
                />
              </g>
            );
          })}
          {/* State labels */}
          {VZ_MAP.map(state => {
            const data = CONF_ESTADOS.find(e => e.e === state.id);
            if (!data) return null;
            // Calculate center of path bounding box approximately
            const nums = (state.d || "").match(/[\d.]+/g);
            if (!nums || nums.length < 4) return null;
            const nf = nums.map(Number);
            const xs = nf.filter((_,i) => i%2===0), ys = nf.filter((_,i) => i%2===1);
            const cx = (Math.min(...xs)+Math.max(...xs))/2, cy = (Math.min(...ys)+Math.max(...ys))/2;
            return (
              <text key={`l${state.id}`} x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                fontSize={data.p > 100 ? 7 : 5} fill={selected===state.id?"#fff":"rgba(255,255,255,0.7)"}
                fontFamily={font} fontWeight={selected===state.id?700:400} pointerEvents="none">
                {data.p}
              </text>
            );
          })}
        </svg>
        {/* Legend */}
        <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:8, flexWrap:"wrap" }}>
          {[{c:"#E5243B",l:">170"},{c:"#ff6b35",l:"130–170"},{c:"#f59e0b",l:"85–130"},{c:"#0A97D9",l:"45–85"},{c:"#0A97D980",l:"<45"}].map((l,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:10, height:10, background:l.c, borderRadius:2 }} />
              <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>{l.l}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize:9, fontFamily:font, color:`${MUTED}60`, textAlign:"center", marginTop:4 }}>Click en un estado para ver detalles</div>
      </div>

      {/* Detail panel */}
      <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
        {sel ? (<>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:TEXT, fontFamily:"'Syne',sans-serif" }}>{sel.e}</div>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED }}>Posición #{selRank} de {CONF_ESTADOS.length} estados</div>
          </div>

          {/* KPIs */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:8 }}>
            <div style={{ background:BG, padding:"10px", border:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Protestas</div>
              <div style={{ fontSize:20, fontWeight:800, color:ACCENT, fontFamily:"'Syne',sans-serif" }}>{sel.p}</div>
              <div style={{ fontSize:10, color:MUTED }}>{((sel.p/2219)*100).toFixed(1)}% del total nacional</div>
            </div>
            <div style={{ background:BG, padding:"10px", border:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Reprimidas</div>
              <div style={{ fontSize:20, fontWeight:800, color:sel.r>3?"#E5243B":sel.r>0?"#a17d08":"#22c55e", fontFamily:"'Syne',sans-serif" }}>{sel.r}</div>
              <div style={{ fontSize:10, color:MUTED }}>{sel.r > 0 ? `${((sel.r/55)*100).toFixed(1)}% de las 55 nacionales` : "Sin represión documentada"}</div>
            </div>
          </div>

          {sel.c > 0 && (
            <div style={{ background:BG, padding:"10px", border:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Por combustible</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#f59e0b", fontFamily:"'Syne',sans-serif" }}>{sel.c}</div>
              <div style={{ fontSize:10, color:MUTED }}>protestas por desabastecimiento</div>
            </div>
          )}

          {/* Comparativa vs líder */}
          <div style={{ background:BG, padding:"10px", border:`1px solid ${BORDER}` }}>
            <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Comparativa vs. {lider.e} (#1)</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ flex:1, height:6, background:BORDER, borderRadius:3, position:"relative" }}>
                <div style={{ width:`${(sel.p/lider.p)*100}%`, height:"100%", background:ACCENT, borderRadius:3 }} />
              </div>
              <span style={{ fontSize:12, fontFamily:font, color:ACCENT }}>{((sel.p/lider.p)*100).toFixed(0)}%</span>
            </div>
            <div style={{ fontSize:10, color:MUTED, marginTop:4 }}>
              {sel.e === lider.e ? "Estado líder en protestas" : `${lider.p - sel.p} protestas menos que ${lider.e}`}
            </div>
          </div>

          {/* Exigencias */}
          <div style={{ background:BG, padding:"10px", border:`1px solid ${BORDER}` }}>
            <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Principales exigencias</div>
            <div style={{ fontSize:13, color:TEXT, lineHeight:1.5 }}>{sel.x}</div>
          </div>
        </>) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, gap:8, padding:20 }}>
            <span style={{ fontSize:28, opacity:0.3 }}>🗺️</span>
            <div style={{ fontSize:13, color:MUTED, textAlign:"center" }}>Selecciona un estado en el mapa para ver sus detalles</div>
            <div style={{ fontSize:10, fontFamily:font, color:`${MUTED}60`, textAlign:"center", marginTop:8 }}>
              Top 3: {CONF_ESTADOS.slice(0,3).map(e=>`${e.e} (${e.p})`).join(" · ")}
            </div>
          </div>
        )}

        {/* Ranking mini table */}
        <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:4, paddingTop:8, borderTop:`1px solid ${BORDER}` }}>
          Top 10 estados
        </div>
        {CONF_ESTADOS.slice(0,10).map((e,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 0", cursor:"pointer",
            background:selected===e.e?`${ACCENT}15`:"transparent" }}
            onClick={() => setSelected(selected===e.e?null:e.e)}>
            <span style={{ fontSize:10, fontFamily:font, color:MUTED, width:16, textAlign:"right" }}>{i+1}</span>
            <span style={{ fontSize:12, color:selected===e.e?ACCENT:TEXT, flex:1, fontWeight:selected===e.e?600:400 }}>{e.e}</span>
            <span style={{ fontSize:12, fontFamily:font, color:ACCENT }}>{e.p}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
