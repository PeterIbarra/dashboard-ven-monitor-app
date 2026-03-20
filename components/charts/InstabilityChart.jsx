import { memo, useRef, useCallback, useState } from "react";
import { BG2, BORDER, MUTED, font } from "../../constants";

export const InstabilityChart = memo(function InstabilityChart({ histIdx, index, zone }) {
  const [hover, setHover] = useState(null);
  if (!histIdx || histIdx.length < 2) return null;

  const W = 280, H = 90, PL = 28, PR = 8, PT = 6, PB = 16;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxV = Math.max(...histIdx, 50);
  const minV = Math.min(...histIdx, 0);
  const range = maxV - minV || 1;
  const toX = (i) => PL + (i / (histIdx.length - 1)) * cW;
  const toY = (v) => PT + cH - ((v - minV) / range) * cH;

  // MA4
  const ma4 = histIdx.map((_, i) => {
    if (i < 3) return null;
    return { i, avg: histIdx.slice(i - 3, i + 1).reduce((s,v) => s + v, 0) / 4 };
  }).filter(Boolean);

  // Zone boundaries
  const zones = [
    { from:0, to:25, color:"#16a34a", label:"Estable" },
    { from:25, to:50, color:"#ca8a04", label:"Tensión" },
    { from:50, to:75, color:"#f97316", label:"Alta" },
    { from:75, to:100, color:"#dc2626", label:"Crisis" },
  ];

  return (
    <div>
      <div style={{ fontSize:9, fontFamily:font, color:MUTED, marginBottom:3, display:"flex", justifyContent:"space-between" }}>
        <span>Evolución semanal · 19 factores</span>
        <span style={{ display:"flex", gap:8 }}>
          <span style={{ display:"flex", alignItems:"center", gap:2 }}><span style={{ display:"inline-block", width:10, height:2, background:zone.color }} /><span style={{ fontSize:7 }}>Índice</span></span>
          <span style={{ display:"flex", alignItems:"center", gap:2 }}><span style={{ display:"inline-block", width:10, height:2, background:"#22d3ee" }} /><span style={{ fontSize:7 }}>MA4</span></span>
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", cursor:"crosshair" }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = (e.clientX - rect.left) / rect.width * W;
          const idx = Math.round(((mx - PL) / cW) * (histIdx.length - 1));
          setHover(idx >= 0 && idx < histIdx.length ? idx : null);
        }}
        onMouseLeave={() => setHover(null)}>

        {/* Zone backgrounds */}
        {zones.map((z, i) => {
          const y1 = toY(Math.min(z.to, maxV));
          const y2 = toY(Math.max(z.from, minV));
          return y2 > y1 ? <rect key={i} x={PL} y={y1} width={cW} height={y2 - y1} fill={z.color} opacity={0.06} /> : null;
        })}

        {/* Y grid */}
        {[0, 25, 50, 75, 100].filter(v => v >= minV && v <= maxV).map(v => (
          <g key={v}>
            <line x1={PL} y1={toY(v)} x2={PL + cW} y2={toY(v)} stroke={BORDER} strokeWidth={0.3} />
            <text x={PL - 3} y={toY(v) + 3} fontSize={6} fill={MUTED} textAnchor="end" fontFamily={font}>{v}</text>
          </g>
        ))}

        {/* Area fill */}
        <path d={`M${toX(0)},${PT + cH} ${histIdx.map((v, i) => `L${toX(i)},${toY(v)}`).join(" ")} L${toX(histIdx.length - 1)},${PT + cH}Z`}
          fill={`${zone.color}15`} />

        {/* MA4 line */}
        {ma4.length > 1 && <polyline
          points={ma4.map(m => `${toX(m.i)},${toY(m.avg)}`).join(" ")}
          fill="none" stroke="#22d3ee" strokeWidth={1.5} strokeLinejoin="round" opacity={0.7} />}

        {/* Main line */}
        <polyline
          points={histIdx.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")}
          fill="none" stroke={zone.color} strokeWidth={2} strokeLinejoin="round" />

        {/* Data dots */}
        {histIdx.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r={hover === i ? 4 : 2.5}
            fill={i === histIdx.length - 1 ? zone.color : `${zone.color}80`} stroke="#fff" strokeWidth={1} />
        ))}

        {/* X labels */}
        {histIdx.map((v, i) => (
          <text key={i} x={toX(i)} y={H - 3} fontSize={6}
            fill={hover === i ? zone.color : (i === histIdx.length - 1 ? zone.color : MUTED)}
            textAnchor="middle" fontFamily={font} fontWeight={hover === i || i === histIdx.length - 1 ? 700 : 400}>
            S{i + 1}
          </text>
        ))}

        {/* Hover */}
        {hover !== null && hover < histIdx.length && (() => {
          const v = histIdx[hover];
          const hx = toX(hover);
          const hy = toY(v);
          const ma4Val = ma4.find(m => m.i === hover);
          const zLabel = v <= 25 ? "Estable" : v <= 50 ? "Tensión" : v <= 75 ? "Alta" : "Crisis";
          const tooltipW = 80;
          const tooltipX = hx > W * 0.6 ? hx - tooltipW - 6 : hx + 6;
          const tooltipY = Math.max(Math.min(hy - 16, PT + cH - 34), PT);
          return (
            <>
              <line x1={hx} y1={PT} x2={hx} y2={PT + cH} stroke={zone.color} strokeWidth={0.5} opacity={0.3} />
              {ma4Val && <circle cx={hx} cy={toY(ma4Val.avg)} r={2.5} fill="#22d3ee" stroke="#fff" strokeWidth={1} />}
              <rect x={tooltipX} y={tooltipY} width={tooltipW} height={ma4Val ? 28 : 22} rx={2} fill={BG2} stroke={BORDER} strokeWidth={0.5} opacity={0.95} />
              <text x={tooltipX + 4} y={tooltipY + 10} fontSize={7} fill={zone.color} fontFamily={font} fontWeight="700">
                S{hover + 1}: {v}/100 · {zLabel}
              </text>
              {ma4Val && <text x={tooltipX + 4} y={tooltipY + 21} fontSize={6} fill="#22d3ee" fontFamily={font}>MA4: {ma4Val.avg.toFixed(1)}/100</text>}
            </>
          );
        })()}

        {/* Current pulse dot */}
        <circle cx={toX(histIdx.length - 1)} cy={toY(index)} r={3.5} fill={zone.color} stroke="#fff" strokeWidth={1.5}>
          <animate attributeName="r" values="3.5;5;3.5" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// BILATERAL CHART — Interactive hover chart for PizzINT data
// ═══════════════════════════════════════════════════════════════
