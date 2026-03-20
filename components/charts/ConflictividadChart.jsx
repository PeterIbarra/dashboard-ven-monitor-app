import { memo, useState } from "react";
import { CONF_SEMANAL } from "../../data/weekly.js";
import { BORDER, MUTED, font } from "../../constants";

export const ConflictividadChart = memo(function ConflictividadChart() {
  const max = Math.max(...CONF_HISTORICO.map(h=>h.p));
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:160, paddingBottom:20, position:"relative" }}>
      {CONF_HISTORICO.map((h,i) => {
        const pct = (h.p/max)*100;
        const isLast = i === CONF_HISTORICO.length-1;
        const isPeak = h.p === max;
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%" }}>
            <div style={{ fontSize:9, fontFamily:font, color:isLast?ACCENT:isPeak?"#E5243B":MUTED, marginBottom:2 }}>
              {(h.p/1000).toFixed(1)}k
            </div>
            <div style={{ width:"100%", height:`${pct}%`, background:isLast?ACCENT:isPeak?"#E5243B":`${ACCENT}40`,
              borderRadius:"2px 2px 0 0", transition:"height 0.5s", minHeight:2 }} />
            <div style={{ fontSize:9, fontFamily:font, color:isLast?ACCENT:MUTED, marginTop:4, transform:"rotate(-45deg)", transformOrigin:"top left", whiteSpace:"nowrap" }}>
              {String(h.y).slice(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// TAB VIEWS
// ═══════════════════════════════════════════════════════════════
