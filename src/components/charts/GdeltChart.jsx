import { useState, useRef, useCallback } from "react";
import { GDELT_ANNOTATIONS } from "../../data/static.js";
import { BG, BG2, BORDER, TEXT, MUTED, font } from "../../constants";

export function GdeltChart({ data }) {
  const [hover, setHover] = useState(null);
  const [signals, setSignals] = useState({ instability:true, tone:true, artvolnorm:true });
  
  const maxInst = Math.max(...data.map(d=>d.instability||0));
  const maxArt = Math.max(...data.map(d=>d.artvolnorm||0));
  const maxLeft = Math.max(maxInst, maxArt, 1);
  const toneMin = -10, toneMax = 2;
  
  const W = 800, H = 280, padL = 45, padR = 45, padT = 15, padB = 35;
  const cW = W-padL-padR, cH = H-padT-padB;
  
  const toX = (i) => padL + (i/(data.length-1)) * cW;
  const toYLeft = (v) => padT + cH - (v/maxLeft)*cH;
  const toYRight = (v) => padT + cH - ((v-toneMin)/(toneMax-toneMin))*cH;
  
  const makePath = (key, yFn) => {
    return data.map((d,i) => d[key] != null ? `${i===0?"M":"L"}${toX(i)},${yFn(d[key])}` : "").filter(Boolean).join(" ");
  };
  
  const makeArea = (key, yFn) => {
    const indices = data.map((d,i) => d[key]!=null ? i : -1).filter(i=>i>=0);
    if (!indices.length) return "";
    let path = `M${toX(indices[0])},${yFn(data[indices[0]][key])}`;
    for (let j=1; j<indices.length; j++) path += ` L${toX(indices[j])},${yFn(data[indices[j]][key])}`;
    path += ` L${toX(indices[indices.length-1])},${padT+cH} L${toX(indices[0])},${padT+cH} Z`;
    return path;
  };

  const annotations = GDELT_ANNOTATIONS.map(a => {
    const idx = data.findIndex(d=>d.date===a.date);
    return idx >= 0 ? { ...a, x: toX(idx) } : null;
  }).filter(Boolean);

  const tierColor = { CRITICAL:"#ff2222", HIGH:"#ff7733", MEDIUM:"#c49000", LOW:"#0e7490" };
  const sigColor = { instability:"#ff3b3b", tone:"#0e7490", artvolnorm:"#c49000" };
  const sigLabel = { instability:"Índice de Conflicto", tone:"Tono Mediático", artvolnorm:"Oleada de Atención" };

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        {Object.keys(sigColor).map(k => (
          <button key={k} onClick={() => setSignals(p=>({...p,[k]:!p[k]}))}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20,
              fontSize:13, fontFamily:font, border:`1px solid ${signals[k]?sigColor[k]:BORDER}`,
              background:"transparent", color:sigColor[k], opacity:signals[k]?1:0.3, cursor:"pointer" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:sigColor[k] }} />
            {sigLabel[k]}
          </button>
        ))}
      </div>
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
        {/* Left Y axis labels */}
        {[0,0.25,0.5,0.75,1].map(f => (
          <text key={`l${f}`} x={padL-6} y={padT+(1-f)*cH+3} textAnchor="end" fontSize={8} fill={MUTED} fontFamily={font}>
            {(maxLeft*f).toFixed(0)}
          </text>
        ))}
        {/* Right Y axis labels (tone) */}
        {[0,0.25,0.5,0.75,1].map(f => {
          const v = toneMin + (toneMax-toneMin)*f;
          return <text key={`r${f}`} x={padL+cW+6} y={padT+(1-f)*cH+3} textAnchor="start" fontSize={8} fill="#0e7490" fontFamily={font}>
            {v.toFixed(0)}
          </text>;
        })}
        {/* Annotation lines */}
        {annotations.map((a,i) => (
          <g key={`ann${i}`}>
            <line x1={a.x} y1={padT} x2={a.x} y2={padT+cH} stroke={tierColor[a.tier]} strokeDasharray="4 3" opacity={0.4} />
            <polygon points={`${a.x-4},${padT+cH+6} ${a.x+4},${padT+cH+6} ${a.x},${padT+cH+1}`} fill={tierColor[a.tier]} opacity={0.8} />
            <polygon points={`${a.x-4},${padT-1} ${a.x+4},${padT-1} ${a.x},${padT+5}`} fill={tierColor[a.tier]} opacity={0.5} />
          </g>
        ))}
        {/* Areas */}
        {signals.artvolnorm && <path d={makeArea("artvolnorm",toYLeft)} fill="#c4900020" />}
        {signals.instability && <path d={makeArea("instability",toYLeft)} fill="#ff3b3b18" />}
        {signals.tone && <path d={makeArea("tone",toYRight)} fill="#0e749015" />}
        {/* Lines */}
        {signals.artvolnorm && <path d={makePath("artvolnorm",toYLeft)} fill="none" stroke="#c49000" strokeWidth={2} />}
        {signals.instability && <path d={makePath("instability",toYLeft)} fill="none" stroke="#ff3b3b" strokeWidth={2} />}
        {signals.tone && <path d={makePath("tone",toYRight)} fill="none" stroke="#0e7490" strokeWidth={1.5} strokeDasharray="4 2" />}
        {/* X labels */}
        {data.filter((_,i) => i % Math.floor(data.length/8) === 0).map((d,i) => {
          const idx = data.indexOf(d);
          return <text key={i} x={toX(idx)} y={H-4} textAnchor="middle" fontSize={8} fill={MUTED} fontFamily={font}>
            {new Date(d.date+"T00:00").toLocaleDateString("es",{month:"short",day:"numeric"})}
          </text>;
        })}
        {/* Hover */}
        {hover !== null && <>
          <line x1={toX(hover)} y1={padT} x2={toX(hover)} y2={padT+cH} stroke="rgba(255,255,255,0.25)" />
          {signals.instability && data[hover].instability!=null && <circle cx={toX(hover)} cy={toYLeft(data[hover].instability)} r={3.5} fill="#ff3b3b" stroke={BG} strokeWidth={2} />}
          {signals.tone && data[hover].tone!=null && <circle cx={toX(hover)} cy={toYRight(data[hover].tone)} r={3.5} fill="#0e7490" stroke={BG} strokeWidth={2} />}
          {signals.artvolnorm && data[hover].artvolnorm!=null && <circle cx={toX(hover)} cy={toYLeft(data[hover].artvolnorm)} r={3.5} fill="#c49000" stroke={BG} strokeWidth={2} />}
        </>}
      </svg>
      {/* Tooltip */}
      {hover !== null && data[hover] && (
        <div style={{ fontSize:13, fontFamily:font, color:TEXT, marginTop:6, padding:"8px 12px", background:BG2, border:`1px solid ${BORDER}`, display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ color:TEXT, fontWeight:600 }}>{new Date(data[hover].date+"T00:00").toLocaleDateString("es",{day:"numeric",month:"short",year:"numeric"})}</span>
          {signals.instability && <span style={{ color:"#ff3b3b" }}>Conflicto: {data[hover].instability?.toFixed(2)}</span>}
          {signals.tone && <span style={{ color:"#0e7490" }}>Tono: {data[hover].tone?.toFixed(2)}</span>}
          {signals.artvolnorm && <span style={{ color:"#c49000" }}>Atención: {data[hover].artvolnorm?.toFixed(2)}</span>}
          {GDELT_ANNOTATIONS.find(a=>a.date===data[hover].date) && (
            <span style={{ color:tierColor[GDELT_ANNOTATIONS.find(a=>a.date===data[hover].date).tier], fontWeight:600 }}>
              ● {GDELT_ANNOTATIONS.find(a=>a.date===data[hover].date).label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── CONFLICTIVIDAD MINI ─────────────────────────────────────
