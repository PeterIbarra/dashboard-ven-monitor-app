import { memo, useState } from "react";
import { BG, BG2, BORDER, TEXT, MUTED, ACCENT, font } from "../../constants";

export const CohesionChart = memo(function CohesionChart({ data }) {
  const [hover, setHover] = useState(null);
  const W=700, H=280, padL=45, padR=30, padT=30, padB=32;
  const cW=W-padL-padR, cH=H-padT-padB;

  // Dynamic Y range with padding — don't waste space showing 0-60 if data is 65-82
  const scores = data.map(d => d.score);
  const dataMin = Math.min(...scores);
  const dataMax = Math.max(...scores);
  const rangePad = Math.max((dataMax - dataMin) * 0.25, 8);
  const yMin = Math.max(0, Math.floor((dataMin - rangePad) / 5) * 5); // snap to 5s
  const yMax = Math.min(100, Math.ceil((dataMax + rangePad) / 5) * 5);
  const yRange = yMax - yMin || 1;

  const toX = (i) => padL + (i / (data.length - 1)) * cW;
  const toY = (v) => padT + cH - ((v - yMin) / yRange) * cH;

  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d.score)}`).join(" ");
  const areaD = pathD + ` L${toX(data.length - 1)},${padT + cH} L${toX(0)},${padT + cH} Z`;

  // Zone bands clipped to visible range
  const zones = [
    { from: 75, to: 100, color: "#16a34a", label: "Alta" },
    { from: 50, to: 75, color: "#ca8a04", label: "Media" },
    { from: 25, to: 50, color: "#f97316", label: "Baja" },
    { from: 0, to: 25, color: "#dc2626", label: "Crítica" },
  ];

  // Grid lines at nice intervals within visible range
  const gridStep = yRange > 30 ? 10 : 5;
  const gridLines = [];
  for (let v = Math.ceil(yMin / gridStep) * gridStep; v <= yMax; v += gridStep) {
    gridLines.push(v);
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width * W;
        const idx = Math.round(((mx - padL) / cW) * (data.length - 1));
        if (idx >= 0 && idx < data.length) setHover(idx);
      }}
      onMouseLeave={() => setHover(null)}>
      {/* Zone backgrounds — clipped to visible range */}
      {zones.map(z => {
        const zTop = Math.min(z.to, yMax);
        const zBot = Math.max(z.from, yMin);
        if (zTop <= zBot) return null;
        return <rect key={z.from} x={padL} y={toY(zTop)} width={cW} height={toY(zBot) - toY(zTop)} fill={`${z.color}10`} />;
      })}
      {/* Zone labels on right edge */}
      {zones.map(z => {
        const mid = (Math.min(z.to, yMax) + Math.max(z.from, yMin)) / 2;
        if (mid < yMin || mid > yMax) return null;
        return <text key={z.label} x={padL + cW + 4} y={toY(mid) + 3} fontSize={8} fill={z.color} fontFamily={font} opacity={0.7}>{z.label}</text>;
      })}
      {/* Grid lines */}
      {gridLines.map(v => (
        <g key={v}>
          <line x1={padL} y1={toY(v)} x2={padL + cW} y2={toY(v)} stroke="rgba(0,0,0,0.06)" strokeDasharray="4 3" />
          <text x={padL - 4} y={toY(v) + 3} textAnchor="end" fontSize={9} fill={MUTED} fontFamily={font}>{v}</text>
        </g>
      ))}
      {/* Area gradient */}
      <defs>
        <linearGradient id="icgGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.20" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#icgGrad2)" />
      {/* Main line */}
      <path d={pathD} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Data points */}
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const isPrev = i === data.length - 2;
        return <circle key={i} cx={toX(i)} cy={toY(d.score)} r={isLast ? 6 : isPrev ? 4 : 3}
          fill={isLast ? ACCENT : BG2} stroke={ACCENT} strokeWidth={isLast ? 2.5 : 2} />;
      })}
      {/* Pulse on latest */}
      <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1].score)} r={10}
        fill="none" stroke={ACCENT} strokeWidth={1.5} opacity={0.3} style={{ animation: "pulse 2s ease-in-out infinite" }} />
      {/* Score label on latest point */}
      <text x={toX(data.length - 1)} y={toY(data[data.length - 1].score) - 12}
        textAnchor="middle" fontSize={11} fontWeight={700} fill={ACCENT} fontFamily={font}>
        {data[data.length - 1].score}
      </text>
      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize={9}
          fill={i === data.length - 1 ? ACCENT : MUTED} fontWeight={i === data.length - 1 ? 700 : 400} fontFamily={font}>
          {d.week}
        </text>
      ))}
      {/* Hover tooltip — smart positioning */}
      {hover != null && hover < data.length && (() => {
        const hx = toX(hover);
        const hy = toY(data[hover].score);
        const note = data[hover].note || "";
        const truncNote = note.length > 45 ? note.substring(0, 45) + "…" : note;
        const noteW = Math.max(truncNote.length * 5.5, 100);
        // Position tooltip: prefer above, but if too close to top, go below
        const above = hy - padT > 60;
        const ty = above ? hy - 28 : hy + 16;
        const noteY = above ? hy - 48 : hy + 38;
        // Clamp X to stay within chart
        const clampX = (x, w) => Math.max(padL + w / 2, Math.min(padL + cW - w / 2, x));
        return <>
          <line x1={hx} y1={padT} x2={hx} y2={padT + cH} stroke="rgba(0,0,0,0.08)" />
          <circle cx={hx} cy={hy} r={5} fill={ACCENT} stroke={BG} strokeWidth={2} />
          {/* Score badge */}
          <rect x={clampX(hx, 80) - 40} y={ty - 14} width={80} height={22} rx={4} fill={TEXT} opacity={0.92} />
          <text x={clampX(hx, 80)} y={ty + 1} textAnchor="middle" fontSize={12} fill="#fff" fontWeight={700} fontFamily={font}>
            {data[hover].week}: {data[hover].score}
          </text>
          {/* Note */}
          {truncNote && <>
            <rect x={clampX(hx, noteW + 12) - (noteW + 12) / 2} y={noteY - 12} width={noteW + 12} height={18} rx={3} fill={BG2} stroke={BORDER} opacity={0.95} />
            <text x={clampX(hx, noteW)} y={noteY + 1} textAnchor="middle" fontSize={8.5} fill={MUTED} fontFamily={font}>
              {truncNote}
            </text>
          </>}
        </>;
      })()}
    </svg>
  );
});

// ═══════════════════════════════════════════════════════════════
// REDES CHART — Chart.js multi-view (Espejo, Polarización, Convivencia, Neto, Composición)
// ═══════════════════════════════════════════════════════════════
