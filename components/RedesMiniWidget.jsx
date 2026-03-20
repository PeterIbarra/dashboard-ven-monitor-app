import { memo, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { REDES_TOTALS } from "../data/redes.js";
import { BG2, BG3, BORDER, TEXT, MUTED, ACCENT, font, fontSans } from "../constants";

export const RedesMiniWidget = memo(function RedesMiniWidget({ setTab }) {
  const mob = useIsMobile();
  const [hover, setHover] = useState(false);
  const R = REDES_TOTALS;
  const polAmPct = ((R.totPolA + R.totPolM) / R.total * 100).toFixed(0);
  const convAmPct = ((R.totConvA + R.totConvM) / R.total * 100).toFixed(0);

  return (
    <div style={{ border:`1px solid ${BORDER}`, background:BG2 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}>
      {/* Compact header row */}
      <div style={{ display:"flex", alignItems:"center", gap:0, cursor:"pointer" }}>
        {/* Left: Label + totals */}
        <div style={{ padding:mob?"8px 10px":"10px 14px", display:"flex", alignItems:"center", gap:8, borderRight:`1px solid ${BORDER}40`, minWidth:mob?"auto":180 }}>
          <span style={{ fontSize:14 }}>🌡️</span>
          <div>
            <div style={{ fontSize:8, fontFamily:font, letterSpacing:"0.12em", textTransform:"uppercase", color:MUTED }}>Clima Social · Redes X</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:6, marginTop:1 }}>
              <span style={{ fontSize:mob?11:13, fontWeight:700, fontFamily:font, color:"#dc2626" }}>{polAmPct}%</span>
              <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>pol.</span>
              <span style={{ fontSize:mob?11:13, fontWeight:700, fontFamily:font, color:"#16a34a" }}>{convAmPct}%</span>
              <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>conv.</span>
            </div>
          </div>
        </div>
        {/* Dual bars compact */}
        <div style={{ flex:1, padding:mob?"6px 8px":"8px 14px" }}>
          <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:3 }}>
            <span style={{ fontSize:8, fontFamily:font, color:"#dc2626", fontWeight:600, width:35 }}>POL</span>
            <div style={{ flex:1, height:8, background:`${BORDER}20`, borderRadius:3, overflow:"hidden", display:"flex" }}>
              <div style={{ width:`${R.polAltoPct}%`, background:"#dc2626", height:8 }} />
              <div style={{ width:`${(R.totPolM/R.total*100).toFixed(0)}%`, background:"#f59e0b", height:8 }} />
            </div>
            <span style={{ fontSize:8, fontFamily:font, color:MUTED, width:40, textAlign:"right" }}>{polAmPct}%</span>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <span style={{ fontSize:8, fontFamily:font, color:"#16a34a", fontWeight:600, width:35 }}>CONV</span>
            <div style={{ flex:1, height:8, background:`${BORDER}20`, borderRadius:3, overflow:"hidden", display:"flex" }}>
              <div style={{ width:`${R.convAltoPct}%`, background:"#16a34a", height:8 }} />
              <div style={{ width:`${(R.totConvM/R.total*100).toFixed(0)}%`, background:"#5DCAA5", height:8 }} />
            </div>
            <span style={{ fontSize:8, fontFamily:font, color:MUTED, width:40, textAlign:"right" }}>{convAmPct}%</span>
          </div>
        </div>
        {/* Right: period badge */}
        <div style={{ padding:mob?"6px 8px":"8px 14px", display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ fontSize:9, fontFamily:font, color:MUTED, textAlign:"right" }}>
            <div>{R.days} días</div>
            <div>{(R.total/1e6).toFixed(1)}M int.</div>
          </div>
        </div>
      </div>

      {/* Expanded on hover — detailed breakdown */}
      {hover && (
        <div style={{ padding:mob?"8px 10px":"10px 14px", borderTop:`1px solid ${BORDER}40`, animation:"fadeSlide 0.2s ease" }}>
          {/* Dual dimension cards */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10, marginBottom:10 }}>
            {/* Polarización breakdown */}
            <div style={{ background:BG3, padding:"8px 10px" }}>
              <div style={{ fontSize:10, fontFamily:font, color:"#dc2626", fontWeight:700, letterSpacing:"0.06em", marginBottom:6 }}>POLARIZACIÓN — lente 1</div>
              {[
                { k:"Alta", pct:R.polAltoPct, c:"#dc2626" },
                { k:"Moderada", pct:(R.totPolM/R.total*100).toFixed(1), c:"#f59e0b" },
                { k:"Baja/Ninguna", pct:(100 - parseFloat(R.polAltoPct) - R.totPolM/R.total*100).toFixed(1), c:`${MUTED}60` },
              ].map((item,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:item.c, flexShrink:0 }} />
                  <span style={{ fontSize:10, fontFamily:font, color:TEXT, width:70 }}>{item.k}</span>
                  <div style={{ flex:1, height:6, background:`${BORDER}30`, borderRadius:2, overflow:"hidden" }}>
                    <div style={{ width:`${item.pct}%`, height:6, background:item.c, borderRadius:2 }} />
                  </div>
                  <span style={{ fontSize:10, fontFamily:font, fontWeight:600, color:item.c, width:35, textAlign:"right" }}>{item.pct}%</span>
                </div>
              ))}
            </div>
            {/* Convivencia breakdown */}
            <div style={{ background:BG3, padding:"8px 10px" }}>
              <div style={{ fontSize:10, fontFamily:font, color:"#16a34a", fontWeight:700, letterSpacing:"0.06em", marginBottom:6 }}>CONVIVENCIA — lente 2</div>
              {[
                { k:"Alta", pct:R.convAltoPct, c:"#16a34a" },
                { k:"Moderada", pct:(R.totConvM/R.total*100).toFixed(1), c:"#5DCAA5" },
                { k:"Baja/Ninguna", pct:(100 - parseFloat(R.convAltoPct) - R.totConvM/R.total*100).toFixed(1), c:`${MUTED}60` },
              ].map((item,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:item.c, flexShrink:0 }} />
                  <span style={{ fontSize:10, fontFamily:font, color:TEXT, width:70 }}>{item.k}</span>
                  <div style={{ flex:1, height:6, background:`${BORDER}30`, borderRadius:2, overflow:"hidden" }}>
                    <div style={{ width:`${item.pct}%`, height:6, background:item.c, borderRadius:2 }} />
                  </div>
                  <span style={{ fontSize:10, fontFamily:font, fontWeight:600, color:item.c, width:35, textAlign:"right" }}>{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          {/* Key insight + weekly ratio */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"2fr 1fr", gap:10 }}>
            <div style={{ fontSize:11, fontFamily:fontSans, color:MUTED, lineHeight:1.5, padding:"4px 0" }}>
              <span style={{ fontWeight:600, color:TEXT }}>Dos lentes, un discurso:</span> Cada interacción se clasifica simultáneamente en ambas dimensiones. 91% tiene polarización mod+alta, pero 63% también tiene algún nivel de convivencia. El discurso es confrontativo <i>y</i> condicionalmente conciliador a la vez.
            </div>
            <div>
              <div style={{ fontSize:8, fontFamily:font, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>Ratio pol/conv alta semanal</div>
              <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:32 }}>
                {R.weekly.map((w, i) => {
                  const maxR = Math.max(...R.weekly.map(x => x.ratio || 0), 1);
                  const h = w.ratio ? Math.max(3, (Math.min(w.ratio, maxR) / maxR) * 28) : 3;
                  const col = !w.ratio ? MUTED : w.ratio > 10 ? "#dc2626" : w.ratio > 5 ? "#ca8a04" : w.ratio > 2 ? "#f59e0b" : "#16a34a";
                  return (
                    <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
                      <span style={{ fontSize:7, fontFamily:font, fontWeight:600, color:col }}>{w.ratio ? w.ratio+"x" : "—"}</span>
                      <div style={{ width:"100%", height:h, background:col, opacity:0.7, borderRadius:"2px 2px 0 0" }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ fontSize:8, fontFamily:font, color:`${MUTED}50`, marginTop:6, display:"flex", justifyContent:"space-between" }}>
            <span>{R.firstDay} – {R.lastDay} · {(R.total/1e6).toFixed(1)}M interacciones · Red X</span>
            <span onClick={() => setTab && setTab("clima")} style={{ color:ACCENT, cursor:"pointer" }}>Ver análisis completo →</span>
          </div>
        </div>
      )}
    </div>
  );
});
