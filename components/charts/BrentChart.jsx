import { memo, useRef, useCallback, useState } from "react";
import { Card } from "../Card";
import { Badge } from "../Badge";
import { ACCENT, BORDER, MUTED, font } from "../../constants";
import { exportChartToPDF } from "../../utils";

export const BrentChart = memo(function BrentChart({ history: rawHistory, forecast = [] }) {
  const [hover, setHover] = useState(null);
  const [zoomRange, setZoomRange] = useState("all");
  if (!rawHistory || rawHistory.length < 2) return null;

  // Downsample: group by day, take last price of each day
  const byDay = new Map();
  rawHistory.forEach(h => {
    const day = h.time ? h.time.split("T")[0] : new Date(h.time).toISOString().split("T")[0];
    byDay.set(day, h);
  });
  const allHistory = Array.from(byDay.values());
  if (allHistory.length < 2) return null;

  // Apply zoom range filter
  const now = new Date();
  const rangeMap = { "1m": 30, "3m": 90, "6m": 180, "1y": 365, "all": 99999 };
  const cutoff = new Date(now.getTime() - (rangeMap[zoomRange] || 99999) * 86400000);
  const history = zoomRange === "all" ? allHistory : allHistory.filter(h => new Date(h.time) >= cutoff);
  if (history.length < 2) return null;

  // Only show forecast in "all" or "1y" view
  const showForecast = (zoomRange === "all" || zoomRange === "1y") && forecast.length > 0;

  // Combine history + forecast for Y axis scaling
  const activeForecast = showForecast ? forecast : [];
  const allPrices = [...history.map(h => h.price), ...activeForecast.map(f => f.price)];
  const firstDate = history[0]?.time ? new Date(history[0].time).toLocaleDateString("es",{month:"short",year:"numeric"}) : "";
  const lastForecastDate = activeForecast.length > 0 ? new Date(activeForecast[activeForecast.length-1].time).toLocaleDateString("es",{month:"short",year:"numeric"}) : "";
  const lastDate = history[history.length-1]?.time ? new Date(history[history.length-1].time).toLocaleDateString("es",{month:"short",year:"numeric"}) : "";
  const chartLabel = activeForecast.length > 0
    ? `Brent Crude · ${firstDate} — ${lastForecastDate} · ${history.length} pts + ${activeForecast.length} pronóstico EIA`
    : `Brent Crude · ${firstDate} — ${lastDate} · ${history.length} puntos`;

  const prices = history.map(h => h.price);
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  const range = max - min || 1;
  
  // Extend chart width to accommodate forecast
  const totalPoints = history.length + (activeForecast.length > 0 ? Math.round(activeForecast.length * 4) : 0);
  const W = 700, H = 140, padL = 45, padR = 10, padT = 10, padB = 25;
  const cW = W - padL - padR, cH = H - padT - padB;

  const toX = (i) => padL + (i / (totalPoints - 1)) * cW;
  const toY = (v) => padT + cH - ((v - min) / range) * cH;

  const pathD = history.map((h, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(h.price)}`).join(" ");
  const areaD = pathD + ` L${toX(history.length - 1)},${padT + cH} L${toX(0)},${padT + cH} Z`;

  // Forecast path (dashed, starting from last historical point)
  let forecastPathD = "";
  let forecastAreaD = "";
  if (activeForecast.length > 0) {
    const lastHistX = toX(history.length - 1);
    const lastHistY = toY(history[history.length - 1].price);
    const forecastPts = activeForecast.map((f, i) => {
      const fi = history.length + Math.round((i + 1) * 4);
      return { x: toX(fi), y: toY(f.price), price: f.price, time: f.time };
    });
    forecastPathD = `M${lastHistX},${lastHistY} ` + forecastPts.map(p => `L${p.x},${p.y}`).join(" ");
    forecastAreaD = `M${lastHistX},${padT + cH} L${lastHistX},${lastHistY} ` + forecastPts.map(p => `L${p.x},${p.y}`).join(" ") + ` L${forecastPts[forecastPts.length-1].x},${padT + cH} Z`;
  }

  const first = prices[0], last = prices[prices.length - 1];
  const delta = last - first;
  const deltaPct = ((delta / first) * 100).toFixed(2);
  const isUp = delta >= 0;

  return (
    <Card>
      <div id="chart-brent-export">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap:"wrap", gap:6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, fontFamily: font, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {chartLabel}
          </span>
          <Badge color="#22c55e">EN VIVO</Badge>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {["1m","3m","6m","1y","all"].map(r => (
            <button key={r} onClick={() => { setZoomRange(r); setHover(null); }}
              style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid ${zoomRange===r ? ACCENT : BORDER}`,
                background: zoomRange===r ? `${ACCENT}12` : "transparent", color: zoomRange===r ? ACCENT : MUTED,
                cursor:"pointer", letterSpacing:"0.05em", textTransform:"uppercase" }}>
              {r === "all" ? "Todo" : r}
            </button>
          ))}
          <button onClick={() => exportChartToPDF("chart-brent-export", "Brent_Crude_Venezuela.pdf")}
            style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid #dc262640`,
              background:"transparent", color:"#dc2626", cursor:"pointer", letterSpacing:"0.05em" }}>
            📄 PDF
          </button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#22c55e", fontFamily: "'Playfair Display',serif" }}>
            ${last.toFixed(2)}
          </span>
          <span style={{ fontSize: 11, fontFamily: font, fontWeight: 600, color: isUp ? "#22c55e" : "#ef4444" }}>
            {isUp ? "▲" : "▼"} ${Math.abs(delta).toFixed(2)} ({isUp ? "+" : ""}{deltaPct}%)
          </span>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = (e.clientX - rect.left) / rect.width * W;
          const idx = Math.round(((mx - padL) / cW) * (totalPoints - 1));
          if (idx >= 0 && idx < history.length) setHover(idx);
        }}
        onMouseLeave={() => setHover(null)}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <g key={f}>
            <line x1={padL} y1={padT + f * cH} x2={padL + cW} y2={padT + f * cH} stroke="rgba(0,0,0,0.06)" />
            <text x={padL - 4} y={padT + f * cH + 3} textAnchor="end" fontSize={7} fill={MUTED} fontFamily={font}>
              {(max - f * range).toFixed(1)}
            </text>
          </g>
        ))}
        {/* Area + Line (historical) */}
        <path d={areaD} fill="rgba(34,197,94,0.08)" />
        <path d={pathD} fill="none" stroke="#22c55e" strokeWidth={1.8} />

        {/* Forecast overlay (EIA STEO) */}
        {forecastPathD && <>
          <path d={forecastAreaD} fill="rgba(234,179,8,0.06)" />
          <path d={forecastPathD} fill="none" stroke="#eab308" strokeWidth={1.5} strokeDasharray="5,3" />
          {/* Forecast dots with labels */}
          {activeForecast.map((f, i) => {
            const fi = history.length + Math.round((i + 1) * 4);
            const fx = toX(fi);
            const fy = toY(f.price);
            return (
              <g key={i}>
                <circle cx={fx} cy={fy} r={2.5} fill="#eab308" stroke="#fff" strokeWidth={1} />
                {i % 3 === 0 && <text x={fx} y={fy - 6} fontSize={6} fill="#eab308" textAnchor="middle" fontFamily={font}>${f.price.toFixed(0)}</text>}
              </g>
            );
          })}
          {/* Divider line between historical and forecast */}
          <line x1={toX(history.length - 1)} y1={padT} x2={toX(history.length - 1)} y2={padT + cH}
            stroke="#eab308" strokeWidth={0.5} strokeDasharray="2,3" opacity={0.5} />
          <text x={toX(history.length - 1) + 3} y={padT + 8} fontSize={6} fill="#eab308" fontFamily={font}>Pronóstico EIA →</text>
        </>}
        {/* X labels */}
        {history.filter((_, i) => i % Math.max(1, Math.floor(history.length / 7)) === 0).map((h) => {
          const idx = history.indexOf(h);
          const d = new Date(h.time);
          return (
            <text key={idx} x={toX(idx)} y={H - 4} textAnchor="middle" fontSize={7} fill={MUTED} fontFamily={font}>
              {d.toLocaleDateString("es", { month: "short", day: "numeric" })}
            </text>
          );
        })}
        {/* Hover */}
        {hover !== null && hover < history.length && (
          <>
            <line x1={toX(hover)} y1={padT} x2={toX(hover)} y2={padT + cH} stroke="rgba(0,0,0,0.1)" />
            <circle cx={toX(hover)} cy={toY(history[hover].price)} r={3.5} fill="#22c55e" />
          </>
        )}
      </svg>
      {hover !== null && hover < history.length && (
        <div style={{ fontSize: 9, fontFamily: font, color: MUTED, marginTop: 4, display: "flex", gap: 12 }}>
          <span>{new Date(history[hover].time).toLocaleString("es", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          <span style={{ color: "#22c55e", fontWeight: 700 }}>${history[hover].price.toFixed(2)}</span>
        </div>
      )}
      {/* Legend */}
      {activeForecast.length > 0 && (
        <div style={{ display:"flex", gap:14, justifyContent:"center", marginTop:4 }}>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:16, height:2, background:"#22c55e" }} />
            <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>Precio histórico (EIA)</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:16, height:2, background:"#eab308", borderTop:"1px dashed #eab308" }} />
            <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>Pronóstico EIA (STEO mensual)</span>
          </div>
        </div>
      )}
      </div>
    </Card>
  );
});

// ═══════════════════════════════════════════════════════════════
// VENEZUELA PRODUCTION CHART — Monthly crude oil production (EIA/OPEC)
// ═══════════════════════════════════════════════════════════════
