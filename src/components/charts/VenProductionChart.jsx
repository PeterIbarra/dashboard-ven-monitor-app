import { memo, useRef, useCallback, useState } from "react";
import { Card } from "../Card";
import { VEN_PRODUCTION_MANUAL } from "../../data/static.js";
import { ACCENT, BG2, BORDER, MUTED, font } from "../../constants";
import { exportChartToPDF } from "../../utils";

export const VenProductionChart = memo(function VenProductionChart({ data: apiData }) {
  const [hover, setHover] = useState(null);
  const [zoomRange, setZoomRange] = useState("2y");

  // Merge API data with manual OPEC MOMR data
  // value = Secondary Sources (EIA/OPEC), dc = Direct Communication (PDVSA)
  const merged = (() => {
    const byMonth = new Map();
    (apiData || []).forEach(d => {
      const month = d.time.slice(0, 7);
      byMonth.set(month, { ...d, source: "EIA", dc: null });
    });
    VEN_PRODUCTION_MANUAL.forEach(d => {
      const month = d.time.slice(0, 7);
      const existing = byMonth.get(month);
      if (existing) {
        // EIA already has this month — just add dc (PDVSA) value
        existing.dc = d.dc || null;
      } else {
        // EIA doesn't have this month yet — use manual secondary + dc
        byMonth.set(month, { value: d.value, time: d.time, source: d.source || "OPEC MOMR", dc: d.dc || null });
      }
    });
    return Array.from(byMonth.values()).sort((a, b) => new Date(a.time) - new Date(b.time));
  })();

  // Apply zoom range filter
  const rangeMap = { "2y": 730, "5y": 1825, "all": 99999 };
  const now = new Date();
  const cutoff = new Date(now.getTime() - (rangeMap[zoomRange] || 99999) * 86400000);
  const data = zoomRange === "all" ? merged : merged.filter(d => new Date(d.time) >= cutoff);
  if (!data || data.length < 3) return null;

  const manualCount = data.filter(d => d.source !== "EIA").length;
  const hasDC = data.some(d => d.dc != null);

  const values = data.map(d => d.value);
  const dcValues = data.filter(d => d.dc != null).map(d => d.dc);
  const allValues = [...values, ...dcValues];
  const min = Math.min(...allValues) * 0.9;
  const max = Math.max(...allValues) * 1.05;
  const range = max - min || 1;
  const latest = data[data.length - 1];
  const prev = data.length > 1 ? data[data.length - 2] : null;
  const delta = prev ? latest.value - prev.value : 0;
  const deltaPct = prev ? ((delta / prev.value) * 100).toFixed(1) : "0";
  const peak = Math.max(...values);
  const trough = Math.min(...values);

  const firstDate = new Date(data[0].time).toLocaleDateString("es", { month: "short", year: "numeric" });
  const lastDate = new Date(latest.time).toLocaleDateString("es", { month: "short", year: "numeric" });

  const W = 700, H = 150, PL = 50, PR = 10, PT = 10, PB = 25;
  const cW = W - PL - PR, cH = H - PT - PB;
  const toX = (i) => PL + (i / (data.length - 1)) * cW;
  const toY = (v) => PT + cH - ((v - min) / range) * cH;

  // Bar width
  const barW = Math.max(1, (cW / data.length) * 0.7);

  // Key thresholds
  const thresh1M = 1000;
  const thresh788 = 788; // Current SITREP level

  return (
    <Card>
      <div id="chart-venprod-export">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap:"wrap", gap:6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, fontFamily: font, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            🇻🇪 Producción Petrolera Venezuela · {firstDate} — {lastDate} · {data.length} meses
          </span>
          <Badge color={ACCENT}>EIA/OPEC</Badge>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {["2y","5y","all"].map(r => (
            <button key={r} onClick={() => { setZoomRange(r); setHover(null); }}
              style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid ${zoomRange===r ? ACCENT : BORDER}`,
                background: zoomRange===r ? `${ACCENT}12` : "transparent", color: zoomRange===r ? ACCENT : MUTED,
                cursor:"pointer", letterSpacing:"0.05em", textTransform:"uppercase" }}>
              {r === "all" ? "Todo" : r}
            </button>
          ))}
          <button onClick={() => exportChartToPDF("chart-venprod-export", "Produccion_Petrolera_Venezuela.pdf")}
            style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid #dc262640`,
              background:"transparent", color:"#dc2626", cursor:"pointer", letterSpacing:"0.05em" }}>
            📄 PDF
          </button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: ACCENT, fontFamily: "'Playfair Display',serif" }}>
            {latest.value.toFixed(0)}
          </span>
          <span style={{ fontSize: 10, fontFamily: font, color: MUTED }}>kbd</span>
          <span style={{ fontSize: 11, fontFamily: font, fontWeight: 600, color: delta >= 0 ? "#22c55e" : "#ef4444" }}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(0)} ({delta >= 0 ? "+" : ""}{deltaPct}%)
          </span>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", cursor: "crosshair" }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = (e.clientX - rect.left) / rect.width * W;
          const idx = Math.round(((mx - PL) / cW) * (data.length - 1));
          if (idx >= 0 && idx < data.length) setHover(idx);
        }}
        onMouseLeave={() => setHover(null)}>

        {/* Y grid + labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <g key={f}>
            <line x1={PL} y1={PT + f * cH} x2={PL + cW} y2={PT + f * cH} stroke="rgba(0,0,0,0.05)" />
            <text x={PL - 4} y={PT + f * cH + 3} textAnchor="end" fontSize={7} fill={MUTED} fontFamily={font}>
              {(max - f * range).toFixed(0)}
            </text>
          </g>
        ))}

        {/* 1M threshold line */}
        {thresh1M >= min && thresh1M <= max && (
          <>
            <line x1={PL} y1={toY(thresh1M)} x2={PL + cW} y2={toY(thresh1M)} stroke="#22c55e" strokeWidth={0.7} strokeDasharray="4,3" opacity={0.5} />
            <text x={PL + cW + 3} y={toY(thresh1M) + 3} fontSize={6} fill="#22c55e" fontFamily={font}>1M bpd</text>
          </>
        )}

        {/* Current 788 kbd level */}
        {thresh788 >= min && thresh788 <= max && (
          <>
            <line x1={PL} y1={toY(thresh788)} x2={PL + cW} y2={toY(thresh788)} stroke="#f97316" strokeWidth={0.7} strokeDasharray="3,3" opacity={0.4} />
            <text x={PL + cW + 3} y={toY(thresh788) + 3} fontSize={6} fill="#f97316" fontFamily={font}>788</text>
          </>
        )}

        {/* PDVSA Direct Communication bars (behind main bars, semi-transparent) */}
        {hasDC && data.map((d, i) => {
          if (d.dc == null) return null;
          const x = toX(i) - barW / 2 - barW * 0.15;
          const y = toY(d.dc);
          const h = PT + cH - y;
          return (
            <rect key={`dc-${i}`} x={x} y={y} width={barW * 0.4} height={Math.max(h, 0.5)}
              fill="#7c3aed" opacity={hover === i ? 0.6 : 0.3} rx={0.5} />
          );
        })}

        {/* Bars (Secondary Sources / EIA) */}
        {data.map((d, i) => {
          const x = toX(i) - barW / 2;
          const y = toY(d.value);
          const h = PT + cH - y;
          const isHovered = hover === i;
          const isManual = d.source !== "EIA";
          const color = d.value >= thresh1M ? "#22c55e" : d.value >= thresh788 ? ACCENT : "#f97316";
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={Math.max(h, 0.5)} fill={color} opacity={isHovered ? 0.9 : isManual ? 0.7 : 0.5} rx={0.5}
                strokeDasharray={isManual ? "2,1" : "none"} stroke={isManual ? color : "none"} strokeWidth={isManual ? 0.5 : 0} />
              {isManual && <text x={x + barW/2} y={y - 2} fontSize={4} fill={color} textAnchor="middle" fontFamily={font}>OPEC</text>}
              {d.dc != null && <text x={x - barW*0.05} y={toY(d.dc) - 2} fontSize={3.5} fill="#7c3aed" textAnchor="middle" fontFamily={font}>PDVSA</text>}
            </g>
          );
        })}

        {/* Trend line overlay */}
        <polyline
          points={data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(" ")}
          fill="none" stroke={ACCENT} strokeWidth={1.2} opacity={0.6} />

        {/* X labels */}
        {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 8)) === 0).map((d) => {
          const idx = data.indexOf(d);
          const dt = new Date(d.time);
          return (
            <text key={idx} x={toX(idx)} y={H - 4} textAnchor="middle" fontSize={7} fill={MUTED} fontFamily={font}>
              {dt.toLocaleDateString("es", { month: "short", year: "2-digit" })}
            </text>
          );
        })}

        {/* Hover */}
        {hover !== null && hover < data.length && (() => {
          const d = data[hover];
          const hx = toX(hover);
          const hy = toY(d.value);
          const dt = new Date(d.time);
          const tooltipW = 110;
          const tooltipX = hx > W * 0.65 ? hx - tooltipW - 8 : hx + 8;
          const hasBoth = d.dc != null;
          const tooltipH = hasBoth ? 46 : (d.source !== "EIA" ? 36 : 30);
          const tooltipY = Math.max(Math.min(hy - 18, PT + cH - tooltipH - 2), PT);
          const isManual = d.source !== "EIA";
          return (
            <>
              <line x1={hx} y1={PT} x2={hx} y2={PT + cH} stroke={ACCENT} strokeWidth={0.5} opacity={0.3} />
              <circle cx={hx} cy={hy} r={3} fill={ACCENT} stroke="#fff" strokeWidth={1.5} />
              {hasBoth && <circle cx={hx - barW*0.15} cy={toY(d.dc)} r={2.5} fill="#7c3aed" stroke="#fff" strokeWidth={1} />}
              <rect x={tooltipX} y={tooltipY} width={tooltipW} height={tooltipH} rx={2} fill={BG2} stroke={BORDER} strokeWidth={0.5} opacity={0.95} />
              <text x={tooltipX + 4} y={tooltipY + 11} fontSize={6} fill={MUTED} fontFamily={font}>
                {dt.toLocaleDateString("es", { month: "long", year: "numeric" })}
              </text>
              <text x={tooltipX + 4} y={tooltipY + 23} fontSize={8} fill={ACCENT} fontFamily={font} fontWeight="700">
                Sec: {d.value.toFixed(0)} kbd
              </text>
              {hasBoth && <text x={tooltipX + 4} y={tooltipY + 34} fontSize={8} fill="#7c3aed" fontFamily={font} fontWeight="700">
                PDVSA: {d.dc.toFixed(0)} kbd ({d.dc > d.value ? "+" : ""}{(d.dc - d.value).toFixed(0)})
              </text>}
              {isManual && !hasBoth && <text x={tooltipX + 4} y={tooltipY + 32} fontSize={5} fill="#eab308" fontFamily={font}>Fuente: {d.source}</text>}
              {isManual && hasBoth && <text x={tooltipX + 4} y={tooltipY + 43} fontSize={4.5} fill="#eab308" fontFamily={font}>{d.source}</text>}
            </>
          );
        })()}
      </svg>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 6 }}>
        {[
          { label: "Último", value: `${latest.value.toFixed(0)} kbd`, color: ACCENT },
          { label: "Máximo", value: `${peak.toFixed(0)} kbd`, color: "#22c55e" },
          { label: "Mínimo", value: `${trough.toFixed(0)} kbd`, color: "#ef4444" },
          { label: "Meses", value: data.length.toString(), color: MUTED },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 7, fontFamily: font, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: font, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 8, fontFamily: font, color: `${MUTED}50`, marginTop: 4, textAlign: "center" }}>
        Fuente: EIA / OPEC Secondary Sources{hasDC ? " + PDVSA (Comunicación Directa)" : ""} · Actualización mensual{manualCount > 0 ? ` · ${manualCount} punto${manualCount>1?"s":""} OPEC MOMR (pendiente EIA)` : ""}
      </div>
      </div>
    </Card>
  );
});
