import { memo, useRef, useCallback, useState } from "react";
import { BG2, BORDER, MUTED, font } from "../../constants";

export const BilateralChart = memo(function BilateralChart({ chartData, cfg, maxV, minV, W, H, PL, PR, PT, PB, cW, cH, toX, toY, mob }) {
  const [hover, setHover] = useState(null);
  if (!chartData || chartData.length < 2) return null;

  // Threshold Y positions
  const y1sigma = toY(1.0);
  const y2sigma = toY(2.0);

  // Area path
  const areaPath = `M${toX(0)},${PT+cH} ${chartData.map((d,i) => `L${toX(i)},${toY(d.v)}`).join(" ")} L${toX(chartData.length-1)},${PT+cH}Z`;
  // Line path
  const linePath = chartData.map((d,i) => `${i===0?"M":"L"}${toX(i)},${toY(d.v)}`).join(" ");

  // MA 30 days
  const ma30 = chartData.map((_, i) => {
    if (i < 29) return null;
    const slice = chartData.slice(i - 29, i + 1);
    const avg = slice.reduce((s, d) => s + d.v, 0) / slice.length;
    return { i, avg };
  }).filter(Boolean);
  const ma30Path = ma30.map((m, j) => `${j === 0 ? "M" : "L"}${toX(m.i)},${toY(m.avg)}`).join(" ");

  // Date labels (every ~15 days)
  const step = Math.max(Math.floor(chartData.length / 6), 1);
  const dateLabels = chartData.filter((_,i) => i % step === 0 || i === chartData.length - 1);

  // Y axis labels
  const yTicks = [];
  for (let yv = Math.ceil(minV * 2) / 2; yv <= maxV; yv += 0.5) {
    yTicks.push(yv);
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", overflow:"visible", cursor:"crosshair" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * W;
        const idx = Math.round(((x - PL) / cW) * (chartData.length - 1));
        setHover(idx >= 0 && idx < chartData.length ? idx : null);
      }}
      onMouseLeave={() => setHover(null)}>

      {/* Zone backgrounds */}
      {y2sigma > PT && <rect x={PL} y={PT} width={cW} height={Math.max(y2sigma - PT, 0)} fill="#ef4444" opacity={0.04} />}
      <rect x={PL} y={y2sigma} width={cW} height={Math.max(y1sigma - y2sigma, 0)} fill="#f97316" opacity={0.04} />
      <rect x={PL} y={y1sigma} width={cW} height={Math.max(PT + cH - y1sigma, 0)} fill="#10b981" opacity={0.04} />

      {/* Y grid + labels */}
      {yTicks.map((yv, i) => (
        <g key={i}>
          <line x1={PL} y1={toY(yv)} x2={PL+cW} y2={toY(yv)} stroke={BORDER} strokeWidth={0.3} />
          <text x={PL-4} y={toY(yv)+2} fontSize={5.5} fill={MUTED} textAnchor="end" fontFamily={font}>{yv.toFixed(1)}</text>
        </g>
      ))}

      {/* Threshold lines */}
      <line x1={PL} y1={y1sigma} x2={PL+cW} y2={y1sigma} stroke="#eab308" strokeWidth={0.7} strokeDasharray="4,3" opacity={0.5} />
      <text x={PL+cW+3} y={y1sigma+2} fontSize={5} fill="#eab308" fontFamily={font}>1.0σ</text>
      <line x1={PL} y1={y2sigma} x2={PL+cW} y2={y2sigma} stroke="#ef4444" strokeWidth={0.7} strokeDasharray="4,3" opacity={0.5} />
      <text x={PL+cW+3} y={y2sigma+2} fontSize={5} fill="#ef4444" fontFamily={font}>2.0σ</text>

      {/* Area fill */}
      <path d={areaPath} fill={`${cfg.color}12`} />

      {/* Main line */}
      <path d={linePath} fill="none" stroke={cfg.color} strokeWidth={1.5} strokeLinejoin="round" />

      {/* MA 30 line */}
      {ma30Path && <path d={ma30Path} fill="none" stroke="#22d3ee" strokeWidth={1.2} strokeLinejoin="round" opacity={0.7} />}
      {ma30.length > 0 && <text x={toX(ma30[ma30.length-1].i)+3} y={toY(ma30[ma30.length-1].avg)+3} fontSize={5} fill="#22d3ee" fontFamily={font}>MA30</text>}

      {/* X date labels */}
      {dateLabels.map((d, i) => {
        const idx = chartData.indexOf(d);
        const dateStr = d.t ? new Date(d.t).toLocaleDateString("es", { day:"numeric", month:"short" }) : "";
        return (
          <text key={i} x={toX(idx)} y={H-2} fontSize={5.5} fill={MUTED} textAnchor="middle" fontFamily={font}>
            {dateStr}
          </text>
        );
      })}

      {/* Hover interaction */}
      {hover !== null && chartData[hover] && (() => {
        const d = chartData[hover];
        const hx = toX(hover);
        const hy = toY(d.v);
        const dateStr = d.t ? new Date(d.t).toLocaleDateString("es", { day:"numeric", month:"short", year:"numeric" }) : "";
        const hLevel = d.v > 2.0 ? "CRÍTICO" : d.v > 1.0 ? "ALTO" : d.v > 0.5 ? "ELEVADO" : d.v > 0 ? "MODERADO" : "BAJO";
        const ma30Val = ma30.find(m => m.i === hover);
        const tooltipW = 92;
        const tooltipH = ma30Val ? 47 : 40;
        const tooltipX = hx > W * 0.65 ? hx - tooltipW - 8 : hx + 8;
        const tooltipY = Math.max(Math.min(hy - tooltipH/2, PT + cH - tooltipH), PT);
        return (
          <>
            <line x1={hx} y1={PT} x2={hx} y2={PT+cH} stroke={cfg.color} strokeWidth={0.6} opacity={0.3} />
            <circle cx={hx} cy={hy} r={3} fill={cfg.color} stroke="#fff" strokeWidth={1.5} />
            {ma30Val && <circle cx={hx} cy={toY(ma30Val.avg)} r={2.5} fill="#22d3ee" stroke="#fff" strokeWidth={1} />}
            {/* Tooltip box */}
            <rect x={tooltipX} y={tooltipY} width={tooltipW} height={tooltipH} rx={2} fill={BG2} stroke={BORDER} strokeWidth={0.5} opacity={0.95} />
            <text x={tooltipX+4} y={tooltipY+9} fontSize={5.5} fill={MUTED} fontFamily={font}>{dateStr}</text>
            <text x={tooltipX+4} y={tooltipY+18} fontSize={7} fill={cfg.color} fontFamily={font} fontWeight="700">{d.v.toFixed(2)}σ · {hLevel}</text>
            <text x={tooltipX+4} y={tooltipY+26} fontSize={5} fill={MUTED} fontFamily={font}>Sent: {(d.sentiment||0).toFixed(1)} · Conf: {d.conflict||"—"}</text>
            <text x={tooltipX+4} y={tooltipY+33} fontSize={5} fill={MUTED} fontFamily={font}>Artículos: {d.total||"—"}</text>
            {ma30Val && <text x={tooltipX+4} y={tooltipY+41} fontSize={5} fill="#22d3ee" fontFamily={font}>MA30: {ma30Val.avg.toFixed(2)}σ</text>}
          </>
        );
      })()}

      {/* Current dot (latest) */}
      <circle cx={toX(chartData.length-1)} cy={toY(chartData[chartData.length-1].v)} r={3} fill={cfg.color} stroke="#fff" strokeWidth={1.5}>
        <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
});

// ═══════════════════════════════════════════════════════════════
// NEWS ALERTS — Classify headlines by relevance/urgency
// ═══════════════════════════════════════════════════════════════
