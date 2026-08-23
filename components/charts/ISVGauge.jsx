import { BG, BG3, MUTED, font } from "../../constants";

export function ISVGauge({ score=67, prev=63 }) {
  const delta = score - prev;
  const angle = -135 + (score/100)*270;
  const c = score >= 70 ? "#ef4444" : score >= 50 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ textAlign:"center" }}>
      <svg width="160" height="100" viewBox="0 0 200 130">
        <defs><linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" /><stop offset="50%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ef4444" />
        </linearGradient></defs>
        <path d="M 20 110 A 80 80 0 1 1 180 110" fill="none" stroke={BG3} strokeWidth="10" strokeLinecap="round" />
        <path d="M 20 110 A 80 80 0 1 1 180 110" fill="none" stroke="url(#gg)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(score/100)*251.2} 251.2`} />
        <g transform={`rotate(${angle}, 100, 110)`}>
          <line x1="100" y1="110" x2="100" y2="45" stroke={c} strokeWidth="2" strokeLinecap="round" />
          <circle cx="100" cy="110" r="5" fill={c} /><circle cx="100" cy="110" r="2.5" fill={BG} />
        </g>
        <text x="100" y="96" textAnchor="middle" fill={c} fontSize="24" fontWeight="700" fontFamily={font}>{score}</text>
        <text x="100" y="112" textAnchor="middle" fill={MUTED} fontSize="9" fontFamily={font}>/100</text>
      </svg>
      <div style={{ fontSize:14, color:delta>0?"#ef4444":"#22c55e", fontFamily:font, fontWeight:600 }}>
        {delta>0?"▲":"▼"} {Math.abs(delta)} pts vs anterior
      </div>
    </div>
  );
}

// ── GDELT CHART ─────────────────────────────────────────────
