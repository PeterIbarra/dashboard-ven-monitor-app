import { WEEKS } from "../../data/weekly.js";
import { SCENARIOS } from "../../data/static.js";
import { BG, BORDER, MUTED, ACCENT, SC, font } from "../../constants";

export function MiniMatrix({ weekIdx }) {
  const W=280, H=180, pad=14;
  const cW=W-2*pad, cH=H-2*pad;
  const trail = WEEKS.slice(0, weekIdx+1).map(w => ({
    px: pad + w.xy.x * cW,
    py: pad + (1-w.xy.y) * cH,
  }));
  const cur = trail[trail.length-1];
  const dom = WEEKS[weekIdx].probs.reduce((a,b)=>a.v>b.v?a:b);
  const domC = SC[dom.sc];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}>
      {/* Quadrants */}
      <rect x={pad} y={pad} width={cW/2} height={cH/2} fill="rgba(76,159,56,0.06)" />
      <rect x={pad+cW/2} y={pad} width={cW/2} height={cH/2} fill="rgba(229,36,59,0.06)" />
      <rect x={pad} y={pad+cH/2} width={cW/2} height={cH/2} fill="rgba(10,151,217,0.06)" />
      <rect x={pad+cW/2} y={pad+cH/2} width={cW/2} height={cH/2} fill="rgba(252,195,11,0.06)" />
      <line x1={pad} y1={pad+cH/2} x2={pad+cW} y2={pad+cH/2} stroke={BORDER} strokeWidth={1} />
      <line x1={pad+cW/2} y1={pad} x2={pad+cW/2} y2={pad+cH} stroke={BORDER} strokeWidth={1} />
      {/* Labels */}
      <text x={pad+4} y={pad+10} fontSize={7} fill={MUTED} fontFamily={font}>E1</text>
      <text x={pad+cW/2+4} y={pad+10} fontSize={7} fill={MUTED} fontFamily={font}>E2</text>
      <text x={pad+4} y={pad+cH-4} fontSize={7} fill={MUTED} fontFamily={font}>E3</text>
      <text x={pad+cW/2+4} y={pad+cH-4} fontSize={7} fill={MUTED} fontFamily={font}>E4</text>
      {/* Trail */}
      {trail.slice(1).map((p,i) => (
        <line key={i} x1={trail[i].px} y1={trail[i].py} x2={p.px} y2={p.py}
          stroke={ACCENT} strokeWidth={1.5} strokeDasharray="3 2" opacity={0.2+((i+1)/trail.length)*0.5} />
      ))}
      {trail.slice(0,-1).map((p,i) => (
        <circle key={i} cx={p.px} cy={p.py} r={3} fill={ACCENT} opacity={0.3} />
      ))}
      {/* Active */}
      <circle cx={cur.px} cy={cur.py} r={7} fill={domC} opacity={0.15} />
      <circle cx={cur.px} cy={cur.py} r={5} fill={domC} opacity={0.9} />
      <text x={cur.px} y={cur.py+3} textAnchor="middle" fontSize={6} fontWeight={700} fill={BG} fontFamily={font}>E{dom.sc}</text>
    </svg>
  );
}

// ── ISV GAUGE (from monitor-venezuela.jsx) ───────────────────
