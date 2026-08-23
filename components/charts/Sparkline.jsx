import { memo } from "react";
import { WEEKS } from "../../data/weekly.js";
import { SC } from "../../constants";

export const Sparkline = memo(function Sparkline({ scId, currentWeek }) {
  const vals = WEEKS.map(w => w.probs.find(p=>p.sc===scId)?.v || 0);
  const max = Math.max(...vals, 1);
  const W = 80, H = 24;
  const color = SC[scId];
  const pts = vals.map((v,i) => `${(i/(vals.length-1))*W},${H-(v/max)*H}`).join(" ");
  return (
    <svg width={W} height={H} style={{ display:"block", overflow:"visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.2} strokeLinejoin="round" opacity={0.6} />
      {currentWeek < vals.length && (
        <circle cx={(currentWeek/(vals.length-1))*W} cy={H-(vals[currentWeek]/max)*H} r={2.5} fill={color} />
      )}
    </svg>
  );
});

// ═══════════════════════════════════════════════════════════════
// SITREP DATA
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// TAB: SITREP
// ═══════════════════════════════════════════════════════════════
