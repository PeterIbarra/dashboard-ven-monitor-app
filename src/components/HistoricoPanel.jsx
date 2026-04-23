import { useState, useMemo } from "react";
import { MACRO_SERIES, MACRO_SERIES_META, MACRO_GROUPS } from "../data/macroSeries.js";
import { BG2, BG3, BORDER, TEXT, MUTED, ACCENT, font } from "../constants";

const fontSans = "'Inter','Segoe UI',sans-serif";

// ── Mini sparkline SVG ──
function Sparkline({ data, color, height = 40, width = 120 }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle
        cx={(vals.length - 1) / (vals.length - 1) * width}
        cy={height - ((vals[vals.length - 1] - min) / range) * height}
        r={3} fill={color}
      />
    </svg>
  );
}

// ── Gráfico de línea principal ──
function LineChart({ data, color, unit, height = 180 }) {
  if (!data || data.length < 2) return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: 12 }}>Sin datos</div>;

  const vals = data.map(d => d.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 600, H = height;
  const pad = { t: 10, r: 10, b: 30, l: 55 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const pts = data.map((d, i) => {
    const x = pad.l + (i / (data.length - 1)) * cw;
    const y = pad.t + ch - ((d.v - min) / range) * ch;
    return { x, y, d };
  });

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${pad.t + ch} L ${pts[0].x} ${pad.t + ch} Z`;

  // Y axis labels
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    y: pad.t + ch - t * ch,
    v: min + t * range,
  }));

  // X axis: show ~6 labels
  const step = Math.max(1, Math.floor(data.length / 6));
  const xTicks = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  function fmt(v) {
    if (Math.abs(v) >= 1000) return `${(v/1000).toFixed(1)}k`;
    if (Math.abs(v) >= 1) return v.toFixed(1);
    return v.toFixed(3);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }}>
      {/* Grid */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={t.y} y2={t.y} stroke={BORDER} strokeWidth={0.5} strokeDasharray="3,3" />
          <text x={pad.l - 4} y={t.y + 4} textAnchor="end" fontSize={9} fill={MUTED} fontFamily={fontSans}>{fmt(t.v)}</text>
        </g>
      ))}
      {/* Area fill */}
      <path d={areaD} fill={color} opacity={0.08} />
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      {/* Last point */}
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r={4} fill={color} />
      {/* X labels */}
      {xTicks.map((d, i) => {
        const idx = data.indexOf(d);
        const x = pad.l + (idx / (data.length - 1)) * cw;
        return <text key={i} x={x} y={H - 8} textAnchor="middle" fontSize={9} fill={MUTED} fontFamily={fontSans}>{d.d.slice(0,7)}</text>;
      })}
      {/* Unit label */}
      <text x={pad.l - 4} y={pad.t - 2} textAnchor="end" fontSize={8} fill={MUTED} fontFamily={fontSans}>{unit}</text>
    </svg>
  );
}

// ── Panel principal ──
export function HistoricoPanel({ mob }) {
  const [grupo, setGrupo] = useState("cambiario");
  const [serieKey, setSerieKey] = useState(null);
  const [rango, setRango] = useState("5y");

  // Series del grupo seleccionado
  const seriesEnGrupo = useMemo(() =>
    Object.entries(MACRO_SERIES_META).filter(([, m]) => m.group === grupo),
    [grupo]
  );

  // Serie activa (primera del grupo si no hay selección)
  const activeKey = serieKey && MACRO_SERIES_META[serieKey]?.group === grupo
    ? serieKey
    : seriesEnGrupo[0]?.[0];
  const activeMeta = activeKey ? MACRO_SERIES_META[activeKey] : null;
  const activeData = activeKey ? MACRO_SERIES[activeKey] : [];

  // Filtrar por rango
  const filteredData = useMemo(() => {
    if (!activeData?.length) return [];
    const now = new Date();
    const cutoff = new Date(now);
    if (rango === "1y") cutoff.setFullYear(now.getFullYear() - 1);
    else if (rango === "3y") cutoff.setFullYear(now.getFullYear() - 3);
    else if (rango === "5y") cutoff.setFullYear(now.getFullYear() - 5);
    else if (rango === "10y") cutoff.setFullYear(now.getFullYear() - 10);
    else return activeData; // "max"
    return activeData.filter(d => new Date(d.d + "-01") >= cutoff);
  }, [activeData, rango]);

  const last = filteredData[filteredData.length - 1];
  const prev = filteredData[filteredData.length - 2];
  const delta = last && prev ? ((last.v - prev.v) / Math.abs(prev.v) * 100) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          📊 Series históricas — Base de datos macroeconómica Venezuela
        </div>
        <div style={{ fontSize: 10, fontFamily: font, color: MUTED }}>
          3,579 puntos de datos · 17 series · Fuentes: BCV, OPEP, SENIAT, LBMA, CENDAS
        </div>
      </div>

      {/* Selector de grupo */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {Object.entries(MACRO_GROUPS).map(([gid, g]) => (
          <button key={gid} onClick={() => { setGrupo(gid); setSerieKey(null); }}
            style={{
              fontSize: 11, fontFamily: font, padding: "5px 12px",
              border: `1px solid ${grupo === gid ? ACCENT : BORDER}`,
              background: grupo === gid ? `${ACCENT}15` : "transparent",
              color: grupo === gid ? ACCENT : MUTED,
              cursor: "pointer", borderRadius: 4, letterSpacing: "0.04em",
            }}>
            {g.icon} {g.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "220px 1fr", gap: 12 }}>

        {/* Lista de series del grupo */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {seriesEnGrupo.map(([key, meta]) => {
            const data = MACRO_SERIES[key] || [];
            const last = data[data.length - 1];
            const prev = data[data.length - 2];
            const delta = last && prev ? last.v - prev.v : null;
            const isActive = key === activeKey;
            return (
              <div key={key} onClick={() => setSerieKey(key)}
                style={{
                  padding: "10px 12px", border: `1px solid ${isActive ? meta.color : BORDER}`,
                  background: isActive ? `${meta.color}08` : BG2,
                  cursor: "pointer", borderRadius: 4,
                  transition: "all 0.15s",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: isActive ? meta.color : TEXT, fontFamily: fontSans }}>{meta.label}</div>
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{meta.unit} · {meta.source}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: meta.color, fontFamily: "'Playfair Display',serif" }}>
                      {last ? (last.v >= 1000 ? `${(last.v/1000).toFixed(1)}k` : last.v >= 1 ? last.v.toFixed(1) : last.v.toFixed(2)) : "—"}
                    </div>
                    {delta !== null && (
                      <div style={{ fontSize: 9, color: delta >= 0 ? "#22c55e" : "#E5243B", fontFamily: font }}>
                        {delta >= 0 ? "▲" : "▼"}{Math.abs(delta).toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
                {data.length > 2 && (
                  <div style={{ marginTop: 6 }}>
                    <Sparkline data={data.slice(-36)} color={meta.color} height={28} width={180} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Gráfico principal */}
        <div style={{ border: `1px solid ${BORDER}`, background: BG2, padding: "16px" }}>
          {activeMeta && (
            <>
              {/* Header del gráfico */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: activeMeta.color, fontFamily: "'Syne',sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {activeMeta.label}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2, fontFamily: font }}>
                    {activeMeta.unit} · Fuente: {activeMeta.source} · {filteredData[0]?.d} → {filteredData[filteredData.length-1]?.d}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  {last && (
                    <div style={{ fontSize: 22, fontWeight: 800, color: activeMeta.color, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>
                      {last.v >= 1000 ? `${(last.v/1000).toFixed(2)}k` : last.v >= 1 ? last.v.toFixed(2) : last.v.toFixed(4)}
                      <span style={{ fontSize: 12, fontFamily: font, color: MUTED, marginLeft: 4 }}>{activeMeta.unit}</span>
                    </div>
                  )}
                  {delta !== null && (
                    <div style={{ fontSize: 11, color: delta >= 0 ? "#22c55e" : "#E5243B", fontFamily: font }}>
                      {delta >= 0 ? "▲" : "▼"}{Math.abs(delta).toFixed(2)} vs mes anterior
                    </div>
                  )}
                </div>
              </div>

              {/* Selector de rango */}
              <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                {["1y","3y","5y","10y","max"].map(r => (
                  <button key={r} onClick={() => setRango(r)}
                    style={{
                      fontSize: 10, fontFamily: font, padding: "3px 10px",
                      border: `1px solid ${rango === r ? activeMeta.color : BORDER}`,
                      background: rango === r ? `${activeMeta.color}15` : "transparent",
                      color: rango === r ? activeMeta.color : MUTED,
                      cursor: "pointer", borderRadius: 3, letterSpacing: "0.06em",
                    }}>
                    {r.toUpperCase()}
                  </button>
                ))}
                <span style={{ marginLeft: "auto", fontSize: 10, color: MUTED, fontFamily: font }}>
                  {filteredData.length} observaciones
                </span>
              </div>

              {/* Gráfico */}
              <LineChart data={filteredData} color={activeMeta.color} unit={activeMeta.unit} height={200} />

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 12 }}>
                {[
                  { l: "Mínimo", v: Math.min(...filteredData.map(d => d.v)) },
                  { l: "Máximo", v: Math.max(...filteredData.map(d => d.v)) },
                  { l: "Promedio", v: filteredData.reduce((s, d) => s + d.v, 0) / (filteredData.length || 1) },
                  { l: "Último", v: last?.v },
                ].map((st, i) => (
                  <div key={i} style={{ background: BG3, padding: "8px 10px", borderRadius: 3 }}>
                    <div style={{ fontSize: 9, color: MUTED, fontFamily: font, letterSpacing: "0.08em", textTransform: "uppercase" }}>{st.l}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: activeMeta.color, fontFamily: "'Playfair Display',serif", marginTop: 2 }}>
                      {st.v != null ? (st.v >= 1000 ? `${(st.v/1000).toFixed(1)}k` : st.v >= 1 ? st.v.toFixed(1) : st.v.toFixed(3)) : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
