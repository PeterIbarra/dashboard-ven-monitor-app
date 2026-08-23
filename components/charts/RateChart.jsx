import { useState, useRef, useCallback } from "react";
import { BG, BG2, BORDER, TEXT, MUTED, ACCENT, font } from "../../constants";
import { exportChartToPDF } from "../../utils";

export function RateChart({ data: rawData }) {
  const [hover, setHover] = useState(null);
  const [zoomRange, setZoomRange] = useState("all");
  const [viewMode, setViewMode] = useState("abs"); // "abs" = absolute, "yoy" = year-over-year

  // Apply zoom range filter
  const rangeMap = { "1m": 30, "3m": 90, "6m": 180, "1y": 365, "all": 99999 };
  const now = new Date();
  const cutoff = new Date(now.getTime() - (rangeMap[zoomRange] || 99999) * 86400000);
  const data = zoomRange === "all" ? rawData : rawData.filter(d => new Date(d.d) >= cutoff);
  if (!data || data.length < 2) return null;

  // ── YoY calculation: find value ~365 days ago for each point ──
  const yoyData = data.map(d => {
    const dateMs = new Date(d.d).getTime();
    const targetMs = dateMs - 365 * 86400000;
    // Find closest point within ±15 days of 1 year ago
    let closest = null, bestDiff = Infinity;
    for (const r of rawData) {
      const diff = Math.abs(new Date(r.d).getTime() - targetMs);
      if (diff < bestDiff && diff < 15 * 86400000) { bestDiff = diff; closest = r; }
    }
    const bcvYoY = closest?.bcv && d.bcv ? ((d.bcv - closest.bcv) / closest.bcv) * 100 : null;
    const parYoY = closest?.par && d.par ? ((d.par - closest.par) / closest.par) * 100 : null;
    const brechaAbs = d.bcv && d.par ? ((d.par - d.bcv) / d.bcv) * 100 : null;
    const brechaYearAgo = closest?.bcv && closest?.par ? ((closest.par - closest.bcv) / closest.bcv) * 100 : null;
    const brechaYoY = brechaAbs != null && brechaYearAgo != null ? brechaAbs - brechaYearAgo : null;
    return { d: d.d, bcvYoY, parYoY, brechaYoY };
  });

  const W = 700, H = 250, padL = 50, padR = 60, padT = 15, padB = 30;
  const cW = W-padL-padR, cH = H-padT-padB;

  const maxRate = Math.max(...data.map(d => Math.max(d.bcv||0, d.par||0)));
  const toX = (i) => padL + (i/(data.length-1)) * cW;
  const toY = (v) => padT + cH - (v/maxRate)*cH;

  const makePath = (key) => data.map((d,i) => d[key]!=null ? `${i===0?"M":"L"}${toX(i)},${toY(d[key])}` : "").filter(Boolean).join(" ");
  const makeArea = (key) => {
    const pts = data.filter(d => d[key]!=null);
    if (pts.length < 2) return "";
    let p = `M${toX(data.indexOf(pts[0]))},${toY(pts[0][key])}`;
    pts.slice(1).forEach(d => { p += ` L${toX(data.indexOf(d))},${toY(d[key])}`; });
    p += ` L${toX(data.indexOf(pts[pts.length-1]))},${padT+cH} L${toX(data.indexOf(pts[0]))},${padT+cH} Z`;
    return p;
  };

  // Brecha as percentage
  const brechaData = data.map(d => d.bcv && d.par ? ((d.par-d.bcv)/d.bcv)*100 : null);
  const maxBrecha = Math.max(...brechaData.filter(Boolean), 1);

  return (
    <div id="chart-rates-export">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, flexWrap:"wrap", gap:4 }}>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={() => setViewMode("abs")}
            style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid ${viewMode==="abs" ? ACCENT : BORDER}`,
              background: viewMode==="abs" ? `${ACCENT}12` : "transparent", color: viewMode==="abs" ? ACCENT : MUTED,
              cursor:"pointer", letterSpacing:"0.05em" }}>
            Absoluto
          </button>
          <button onClick={() => setViewMode("yoy")}
            style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid ${viewMode==="yoy" ? "#22c55e" : BORDER}`,
              background: viewMode==="yoy" ? "#22c55e12" : "transparent", color: viewMode==="yoy" ? "#22c55e" : MUTED,
              cursor:"pointer", letterSpacing:"0.05em" }}>
            Var. interanual
          </button>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {["1m","3m","6m","1y","all"].map(r => (
            <button key={r} onClick={() => { setZoomRange(r); setHover(null); }}
              style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid ${zoomRange===r ? ACCENT : BORDER}`,
                background: zoomRange===r ? `${ACCENT}12` : "transparent", color: zoomRange===r ? ACCENT : MUTED,
                cursor:"pointer", letterSpacing:"0.05em", textTransform:"uppercase" }}>
              {r === "all" ? "Todo" : r}
            </button>
          ))}
          <button onClick={() => exportChartToPDF("chart-rates-export", "Tipo_Cambio_Venezuela.pdf")}
            style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid #dc262640`,
              background:"transparent", color:"#dc2626", cursor:"pointer", letterSpacing:"0.05em" }}>
            📄 PDF
          </button>
        </div>
      </div>

      {viewMode === "yoy" ? (() => {
        // ── YoY View ──
        const validYoY = yoyData.filter(d => d.bcvYoY != null || d.parYoY != null);
        if (validYoY.length < 2) return <div style={{ padding:20, textAlign:"center", fontSize:11, fontFamily:font, color:MUTED }}>No hay suficientes datos para calcular variación interanual (se necesitan al menos 365 días de historial)</div>;
        const allVals = validYoY.flatMap(d => [d.bcvYoY, d.parYoY, d.brechaYoY].filter(v => v != null));
        const yoyMin = Math.min(...allVals, 0);
        const yoyMax = Math.max(...allVals, 0);
        const yoyRange = yoyMax - yoyMin || 1;
        const toXy = (i) => padL + (i/(validYoY.length-1)) * cW;
        const toYy = (v) => padT + cH - ((v - yoyMin) / yoyRange) * cH;
        const zeroY = toYy(0);
        const makeYoYPath = (key) => validYoY.map((d,i) => d[key] != null ? `${i===0?"M":"L"}${toXy(i)},${toYy(d[key])}` : "").filter(Boolean).join(" ");
        return (<>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mx = (e.clientX - rect.left) / rect.width * W;
              const idx = Math.round(((mx - padL) / cW) * (validYoY.length-1));
              if (idx >= 0 && idx < validYoY.length) setHover(idx);
            }}
            onMouseLeave={() => setHover(null)}>
            {[0,0.25,0.5,0.75,1].map(f => {
              const val = yoyMax - f * yoyRange;
              return <g key={f}>
                <line x1={padL} y1={padT+f*cH} x2={padL+cW} y2={padT+f*cH} stroke="rgba(0,0,0,0.06)" />
                <text x={padL-6} y={padT+f*cH+3} textAnchor="end" fontSize={8} fill={MUTED} fontFamily={font}>{val.toFixed(0)}%</text>
              </g>;
            })}
            {zeroY >= padT && zeroY <= padT+cH && <line x1={padL} y1={zeroY} x2={padL+cW} y2={zeroY} stroke="rgba(0,0,0,0.2)" strokeDasharray="4 2" />}
            <path d={makeYoYPath("bcvYoY")} fill="none" stroke="#0468B1" strokeWidth={2} />
            <path d={makeYoYPath("parYoY")} fill="none" stroke="#E5243B" strokeWidth={2} />
            <path d={makeYoYPath("brechaYoY")} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" />
            {validYoY.map((d,i) => i % Math.max(1,Math.floor(validYoY.length/6)) === 0 ? (
              <text key={i} x={toXy(i)} y={H-6} textAnchor="middle" fontSize={8} fill={MUTED} fontFamily={font}>
                {new Date(d.d+"T00:00").toLocaleDateString("es",{day:"numeric",month:"short"})}
              </text>
            ) : null)}
            {hover !== null && hover < validYoY.length && <>
              <line x1={toXy(hover)} y1={padT} x2={toXy(hover)} y2={padT+cH} stroke="rgba(0,0,0,0.12)" />
              {validYoY[hover].bcvYoY != null && <circle cx={toXy(hover)} cy={toYy(validYoY[hover].bcvYoY)} r={4} fill="#0468B1" stroke={BG} strokeWidth={2} />}
              {validYoY[hover].parYoY != null && <circle cx={toXy(hover)} cy={toYy(validYoY[hover].parYoY)} r={4} fill="#E5243B" stroke={BG} strokeWidth={2} />}
            </>}
          </svg>
          {hover !== null && hover < validYoY.length && (() => {
            const d = validYoY[hover];
            return d ? (
              <div style={{ fontSize:13, fontFamily:font, marginTop:4, padding:"6px 12px", background:BG2, border:`1px solid ${BORDER}`, display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
                <span style={{ color:TEXT, fontWeight:600 }}>{new Date(d.d+"T00:00").toLocaleDateString("es",{day:"numeric",month:"short",year:"numeric"})}</span>
                {d.bcvYoY != null && <span style={{ color:"#0468B1" }}>BCV: {d.bcvYoY > 0 ? "+" : ""}{d.bcvYoY.toFixed(1)}%</span>}
                {d.parYoY != null && <span style={{ color:"#E5243B" }}>Paralelo: {d.parYoY > 0 ? "+" : ""}{d.parYoY.toFixed(1)}%</span>}
                {d.brechaYoY != null && <span style={{ color:"#f59e0b" }}>Δ Brecha: {d.brechaYoY > 0 ? "+" : ""}{d.brechaYoY.toFixed(1)}pp</span>}
              </div>
            ) : null;
          })()}
        </>);
      })() : (<>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = (e.clientX - rect.left) / rect.width * W;
          const idx = Math.round(((mx - padL) / cW) * (data.length-1));
          if (idx >= 0 && idx < data.length) setHover(idx);
        }}
        onMouseLeave={() => setHover(null)}>
        {/* Grid */}
        {[0,0.25,0.5,0.75,1].map(f => (
          <line key={f} x1={padL} y1={padT+f*cH} x2={padL+cW} y2={padT+f*cH} stroke="rgba(0,0,0,0.06)" />
        ))}
        {/* Left Y axis (Bs/USD) */}
        {[0,0.25,0.5,0.75,1].map(f => (
          <text key={`l${f}`} x={padL-6} y={padT+(1-f)*cH+3} textAnchor="end" fontSize={8} fill={MUTED} fontFamily={font}>
            {(maxRate*f).toFixed(0)}
          </text>
        ))}
        {/* Right Y axis (Brecha %) */}
        {[0,0.25,0.5,0.75,1].map(f => (
          <text key={`r${f}`} x={padL+cW+6} y={padT+(1-f)*cH+3} textAnchor="start" fontSize={8} fill="#f59e0b50" fontFamily={font}>
            {(maxBrecha*f).toFixed(0)}%
          </text>
        ))}
        {/* Areas */}
        <path d={makeArea("par")} fill="#E5243B08" />
        <path d={makeArea("bcv")} fill="#0468B108" />
        {/* Lines */}
        <path d={makePath("bcv")} fill="none" stroke="#0468B1" strokeWidth={2.5} />
        <path d={makePath("par")} fill="none" stroke="#E5243B" strokeWidth={2.5} />
        {/* Brecha line (right axis) */}
        {brechaData.filter(Boolean).length > 1 && (
          <path d={data.map((d,i) => brechaData[i]!=null ? `${i===0||brechaData[i-1]==null?"M":"L"}${toX(i)},${padT+cH-(brechaData[i]/maxBrecha)*cH}` : "").filter(Boolean).join(" ")}
            fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" />
        )}
        {/* USDT estimate (par * 1.02) */}
        <path d={data.map((d,i) => d.par ? `${i===0?"M":"L"}${toX(i)},${toY(d.par*1.02)}` : "").filter(Boolean).join(" ")}
          fill="none" stroke="#7c3aed" strokeWidth={1} strokeDasharray="2 2" opacity={0.6} />
        {/* X labels */}
        {data.map((d,i) => i % Math.max(1,Math.floor(data.length/6)) === 0 ? (
          <text key={i} x={toX(i)} y={H-6} textAnchor="middle" fontSize={8} fill={MUTED} fontFamily={font}>
            {new Date(d.d+"T00:00").toLocaleDateString("es",{day:"numeric",month:"short"})}
          </text>
        ) : null)}
        {/* Hover */}
        {hover !== null && hover < data.length && <>
          <line x1={toX(hover)} y1={padT} x2={toX(hover)} y2={padT+cH} stroke="rgba(0,0,0,0.12)" />
          {data[hover].bcv && <circle cx={toX(hover)} cy={toY(data[hover].bcv)} r={4} fill="#0468B1" stroke={BG} strokeWidth={2} />}
          {data[hover].par && <circle cx={toX(hover)} cy={toY(data[hover].par)} r={4} fill="#E5243B" stroke={BG} strokeWidth={2} />}
        </>}
      </svg>
      {/* Tooltip */}
      {hover !== null && hover < data.length && (
        <div style={{ fontSize:13, fontFamily:font, marginTop:4, padding:"6px 12px", background:BG2, border:`1px solid ${BORDER}`, display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ color:TEXT, fontWeight:600 }}>{new Date(data[hover].d+"T00:00").toLocaleDateString("es",{day:"numeric",month:"short",year:"numeric"})}</span>
          <span style={{ color:"#0468B1" }}>BCV: {data[hover].bcv?.toFixed(1)}</span>
          <span style={{ color:"#E5243B" }}>Paralelo: {data[hover].par?.toFixed(1)}</span>
          {data[hover].par && <span style={{ color:"#7c3aed" }}>USDT: ~{(data[hover].par*1.02).toFixed(0)}</span>}
          {brechaData[hover] && <span style={{ color:"#f59e0b" }}>Brecha: {brechaData[hover].toFixed(1)}%</span>}
        </div>
      )}
      </>)}

      {/* Legend */}
      <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:8 }}>
        <span style={{ fontSize:12, fontFamily:font, color:"#0468B1" }}>━ BCV {viewMode === "yoy" ? "YoY %" : "Oficial"}</span>
        <span style={{ fontSize:12, fontFamily:font, color:"#E5243B" }}>━ Paralelo {viewMode === "yoy" ? "YoY %" : ""}</span>
        {viewMode === "abs" && <span style={{ fontSize:12, fontFamily:font, color:"#7c3aed" }}>┅ USDT (est.)</span>}
        <span style={{ fontSize:12, fontFamily:font, color:"#f59e0b" }}>┅ {viewMode === "yoy" ? "Δ Brecha (pp)" : "Brecha % (eje der.)"}</span>
      </div>
    </div>
  );
}
