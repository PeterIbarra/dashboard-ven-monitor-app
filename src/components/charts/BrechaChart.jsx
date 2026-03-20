import { useState, useRef, useCallback } from "react";
import { BG, BORDER, TEXT, MUTED, ACCENT, font } from "../../constants";
import { exportChartToPDF } from "../../utils";

export function BrechaChart({ data: rawData }) {
  const [hover, setHover] = useState(null);
  const [zoomRange, setZoomRange] = useState("all");

  // Apply zoom range filter
  const rangeMap = { "1m": 30, "3m": 90, "6m": 180, "1y": 365, "all": 99999 };
  const now = new Date();
  const cutoff = new Date(now.getTime() - (rangeMap[zoomRange] || 99999) * 86400000);
  const data = zoomRange === "all" ? rawData : rawData.filter(d => new Date(d.d) >= cutoff);

  const W = 800, H = 500, padL = 55, padR = 25, padT = 20, padB = 36;
  const cW = W-padL-padR, cH = H-padT-padB;

  const brechas = data.map(d => d.bcv && d.par ? ((d.par-d.bcv)/d.bcv)*100 : null);
  const valid = brechas.filter(Boolean);
  if (valid.length < 2) return null;
  const maxB = Math.max(...valid);
  const toX = (i) => padL + (i/(data.length-1)) * cW;
  const toY = (v) => v != null ? padT + cH - (v/maxB)*cH : null;

  const pathD = data.map((d,i) => {
    const y = toY(brechas[i]);
    if (y == null) return "";
    return `${i===0||brechas[i-1]==null?"M":"L"}${toX(i)},${y}`;
  }).filter(Boolean).join(" ");

  // Area
  const validIdxs = data.map((d,i) => brechas[i]!=null ? i : null).filter(v=>v!=null);
  const areaD = validIdxs.length > 1 ? 
    `M${toX(validIdxs[0])},${toY(brechas[validIdxs[0]])} ` +
    validIdxs.slice(1).map(i => `L${toX(i)},${toY(brechas[i])}`).join(" ") +
    ` L${toX(validIdxs[validIdxs.length-1])},${padT+cH} L${toX(validIdxs[0])},${padT+cH} Z` : "";

  return (
    <div id="chart-brecha-export">
    <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:6, gap:4 }}>
      {["1m","3m","6m","1y","all"].map(r => (
        <button key={r} onClick={() => { setZoomRange(r); setHover(null); }}
          style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid ${zoomRange===r ? ACCENT : BORDER}`,
            background: zoomRange===r ? `${ACCENT}12` : "transparent", color: zoomRange===r ? ACCENT : MUTED,
            cursor:"pointer", letterSpacing:"0.05em", textTransform:"uppercase" }}>
          {r === "all" ? "Todo" : r}
        </button>
      ))}
      <button onClick={() => exportChartToPDF("chart-brecha-export", "Brecha_Cambiaria_Venezuela.pdf")}
        style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid #dc262640`,
          background:"transparent", color:"#dc2626", cursor:"pointer", letterSpacing:"0.05em" }}>
        📄 PDF
      </button>
    </div>
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width * W;
        const idx = Math.round(((mx - padL) / cW) * (data.length-1));
        if (idx >= 0 && idx < data.length) setHover(idx);
      }}
      onMouseLeave={() => setHover(null)}>
      {/* Alert zones */}
      <rect x={padL} y={toY(55)} width={cW} height={toY(40)-toY(55)} fill="#b8860b08" />
      <rect x={padL} y={padT} width={cW} height={toY(55)-padT} fill="#E5243B08" />
      {/* Threshold lines */}
      <line x1={padL} y1={toY(20)} x2={padL+cW} y2={toY(20)} stroke="#4C9F3830" strokeDasharray="3 3" />
      <text x={padL+cW+4} y={toY(20)+3} fontSize={7} fill="#4C9F38" fontFamily={font}>20%</text>
      <line x1={padL} y1={toY(40)} x2={padL+cW} y2={toY(40)} stroke="#0A97D930" strokeDasharray="3 3" />
      <text x={padL+cW+4} y={toY(40)+3} fontSize={7} fill="#0A97D9" fontFamily={font}>40%</text>
      <line x1={padL} y1={toY(55)} x2={padL+cW} y2={toY(55)} stroke="#E5243B30" strokeDasharray="3 3" />
      <text x={padL+cW+4} y={toY(55)+3} fontSize={7} fill="#E5243B" fontFamily={font}>55%</text>
      {/* Grid */}
      {[0,0.25,0.5,0.75,1].map(f => (
        <g key={f}>
          <line x1={padL} y1={padT+f*cH} x2={padL+cW} y2={padT+f*cH} stroke="rgba(0,0,0,0.04)" />
          <text x={padL-4} y={padT+(1-f)*cH+3} textAnchor="end" fontSize={7} fill={MUTED} fontFamily={font}>{(maxB*f).toFixed(0)}%</text>
        </g>
      ))}
      {/* Area + Line */}
      <path d={areaD} fill="#f59e0b10" />
      <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth={2} />
      {/* X labels */}
      {data.map((d,i) => i % Math.max(1,Math.floor(data.length/8)) === 0 ? (
        <text key={i} x={toX(i)} y={H-4} textAnchor="middle" fontSize={7} fill={MUTED} fontFamily={font}>
          {d.d.slice(0,7)}
        </text>
      ) : null)}
      {/* Hover */}
      {hover !== null && hover < data.length && brechas[hover] != null && <>
        <line x1={toX(hover)} y1={padT} x2={toX(hover)} y2={padT+cH} stroke="rgba(0,0,0,0.1)" />
        <circle cx={toX(hover)} cy={toY(brechas[hover])} r={4} fill="#f59e0b" stroke={BG} strokeWidth={2} />
        <text x={toX(hover)} y={toY(brechas[hover])-8} textAnchor="middle" fontSize={9} fill="#f59e0b" fontWeight={700} fontFamily={font}>
          {brechas[hover].toFixed(1)}%
        </text>
        <text x={toX(hover)} y={padT+cH+12} textAnchor="middle" fontSize={7} fill={TEXT} fontFamily={font}>{data[hover].d}</text>
      </>}
    </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SOCIOECONOMIC PANEL — World Bank + IMF + R4V data
// ═══════════════════════════════════════════════════════════════
