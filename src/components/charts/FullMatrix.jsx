import { useState } from "react";
import { WEEKS } from "../../data/weekly.js";
import { SCENARIOS } from "../../data/static.js";
import { BG, BORDER, MUTED, SC, font } from "../../constants";

export function FullMatrix({ weekIdx, onClickWeek, onArrowClick }) {
  const W=560, H=400;
  const wk = WEEKS[weekIdx];
  const dom = wk.probs.reduce((a,b) => a.v>b.v?a:b);
  const domSc = SCENARIOS.find(s=>s.id===dom.sc);
  const trendSc = SCENARIOS.find(s=>s.id===(wk.trendSc||dom.sc));
  const trendColor = trendSc.color;

  // Trail points
  const trail = WEEKS.slice(0, weekIdx+1).map((w,i) => ({
    px: w.xy.x * W, py: (1-w.xy.y) * H, idx: i,
    dom: SCENARIOS.find(s=>s.id===w.probs.reduce((a,b)=>a.v>b.v?a:b).sc),
  }));
  const cur = trail[trail.length-1];

  // Compute drift direction based on trend scenario's quadrant center
  const trendTargets = { 1:{x:W*0.2,y:H*0.2}, 2:{x:W*0.8,y:H*0.2}, 3:{x:W*0.2,y:H*0.8}, 4:{x:W*0.8,y:H*0.8} };
  const target = trendTargets[wk.trendSc||dom.sc];
  let dx = target.x - cur.px, dy = target.y - cur.py;
  const mag = Math.sqrt(dx*dx + dy*dy);
  const arrowLen = Math.min(mag * 0.4, 75);
  if (mag > 1) { dx = (dx/mag)*arrowLen; dy = (dy/mag)*arrowLen; }
  const arrowEnd = { x: cur.px + dx, y: cur.py + dy };
  const isSameSc = (wk.trendSc||dom.sc) === dom.sc;

  // Breathing animation: normalized direction for the drift
  const driftX = mag > 1 ? (dx/arrowLen)*5 : 0;
  const driftY = mag > 1 ? (dy/arrowLen)*5 : 0;

  // Unique animation name for this render
  const animId = `drift-${weekIdx}`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", background:BG }}>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <polygon points="0 0, 10 4, 0 8" fill={trendColor} opacity="0.85" />
        </marker>
        <style>{`
          @keyframes ${animId} {
            0%, 100% { transform: translate(0px, 0px); }
            50% { transform: translate(${driftX}px, ${driftY}px); }
          }
        `}</style>
      </defs>
      {/* Quadrants */}
      <rect x={0} y={0} width={W/2} height={H/2} fill="rgba(76,159,56,0.05)" />
      <rect x={W/2} y={0} width={W/2} height={H/2} fill="rgba(229,36,59,0.05)" />
      <rect x={0} y={H/2} width={W/2} height={H/2} fill="rgba(10,151,217,0.05)" />
      <rect x={W/2} y={H/2} width={W/2} height={H/2} fill="rgba(252,195,11,0.05)" />
      {/* Axes */}
      <line x1={W/2} y1={0} x2={W/2} y2={H} stroke={BORDER} strokeWidth={1} />
      <line x1={0} y1={H/2} x2={W} y2={H/2} stroke={BORDER} strokeWidth={1} />
      {/* Grid */}
      <line x1={W/4} y1={0} x2={W/4} y2={H} stroke={BORDER} strokeWidth={0.5} strokeDasharray="3 4" opacity={0.4} />
      <line x1={3*W/4} y1={0} x2={3*W/4} y2={H} stroke={BORDER} strokeWidth={0.5} strokeDasharray="3 4" opacity={0.4} />
      <line x1={0} y1={H/4} x2={W} y2={H/4} stroke={BORDER} strokeWidth={0.5} strokeDasharray="3 4" opacity={0.4} />
      <line x1={0} y1={3*H/4} x2={W} y2={3*H/4} stroke={BORDER} strokeWidth={0.5} strokeDasharray="3 4" opacity={0.4} />
      {/* Quadrant labels */}
      <text x={12} y={16} fontSize={8} fill={MUTED} fontFamily={font} opacity={0.6}>CAMBIO SIN VIOLENCIA</text>
      <text x={W/2+12} y={16} fontSize={8} fill={MUTED} fontFamily={font} opacity={0.6}>CAMBIO CAÓTICO</text>
      <text x={12} y={H-8} fontSize={8} fill={MUTED} fontFamily={font} opacity={0.6}>ESTABILIDAD SIN TRANSFORMACIÓN</text>
      <text x={W/2+12} y={H-8} fontSize={8} fill={MUTED} fontFamily={font} opacity={0.6}>VIOLENCIA SIN CAMBIO</text>
      {/* Scenario labels */}
      <text x={16} y={50} fontSize={9} fontWeight={700} fill="#4C9F38" fontFamily="'Syne',sans-serif">E1: Transición pacífica</text>
      <text x={W/2+16} y={50} fontSize={9} fontWeight={700} fill="#E5243B" fontFamily="'Syne',sans-serif">E2: Colapso y fragmentación</text>
      <text x={16} y={H/2+40} fontSize={9} fontWeight={700} fill="#0A97D9" fontFamily="'Syne',sans-serif">E3: Continuidad negociada</text>
      <text x={W/2+16} y={H/2+40} fontSize={9} fontWeight={700} fill="#b8860b" fontFamily="'Syne',sans-serif">E4: Resistencia coercitiva</text>
      {/* Trail segments */}
      {trail.slice(1).map((p,i) => {
        const prev = trail[i];
        const alpha = 0.15 + ((i+1)/trail.length)*0.6;
        return <line key={i} x1={prev.px} y1={prev.py} x2={p.px} y2={p.py} stroke={p.dom.color} strokeWidth={2} strokeDasharray="5 3" opacity={alpha} />;
      })}
      {/* Ghost dots — bigger */}
      {trail.slice(0,-1).map((p,i) => (
        <g key={i} style={{ cursor:"pointer" }} onClick={() => onClickWeek && onClickWeek(p.idx)}>
          <circle cx={p.px} cy={p.py} r={14} fill="transparent" />
          <circle cx={p.px} cy={p.py} r={7} fill={p.dom.color} opacity={0.2 + (i/trail.length)*0.5} />
          <text x={p.px} y={p.py-11} textAnchor="middle" fontSize={7} fill={p.dom.color} fontFamily={font} opacity={0.6}>{WEEKS[p.idx].short}</text>
        </g>
      ))}
      {/* ── TREND ARROW — thicker and longer ── */}
      <line x1={cur.px} y1={cur.py} x2={arrowEnd.x} y2={arrowEnd.y}
        stroke={trendColor} strokeWidth={3.5} strokeDasharray="6 3" opacity={0.75} markerEnd="url(#arrowhead)" />
      {/* Arrow label */}
      <text x={arrowEnd.x + (dx > 0 ? 10 : -10)} y={arrowEnd.y - 8}
        textAnchor={dx >= 0 ? "start" : "end"} fontSize={9} fill={trendColor} fontFamily={font} fontWeight={700} opacity={0.9}>
        {isSameSc ? `→ E${trendSc.id}` : `↑ E${trendSc.id}`}
      </text>
      {/* Arrow hover target (invisible, wide for easy clicking) */}
      <line x1={cur.px} y1={cur.py} x2={arrowEnd.x} y2={arrowEnd.y}
        stroke="transparent" strokeWidth={28} style={{ cursor:"pointer" }}
        onClick={() => onArrowClick && onArrowClick()} />
      {/* Active point — bigger, with breathing animation toward arrow direction */}
      <g style={{ animation:`${animId} 2.5s ease-in-out infinite` }}>
        <circle cx={cur.px} cy={cur.py} r={22} fill={domSc.color} opacity={0.06} />
        <circle cx={cur.px} cy={cur.py} r={14} fill={domSc.color} opacity={0.12} />
        <circle cx={cur.px} cy={cur.py} r={9} fill={domSc.color} opacity={0.9} />
        <text x={cur.px} y={cur.py+3.5} textAnchor="middle" fontSize={8} fontWeight={700} fill={BG} fontFamily={font}>E{domSc.id}</text>
      </g>
      <text x={cur.px} y={cur.py-18} textAnchor="middle" fontSize={9} fill={domSc.color} fontFamily={font} fontWeight={700}>{wk.short}</text>
      {/* Axis labels */}
      <text x={W/2} y={H-2} textAnchor="middle" fontSize={7} fill={MUTED} fontFamily={font} letterSpacing="0.1em">VIOLENCIA →</text>
      <text x={4} y={H/2} fontSize={7} fill={MUTED} fontFamily={font} letterSpacing="0.1em" transform={`rotate(-90,8,${H/2})`}>CAMBIO ↑</text>
    </svg>
  );
}
