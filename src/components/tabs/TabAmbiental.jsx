import { useState, useEffect, useCallback, useRef } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { BG, BG2, BG3, BORDER, TEXT, MUTED, ACCENT, font, fontSans } from "../../constants";
import { VZ_MAP } from "../../data/static.js";

// ── Coordenadas de capitales para fetch Open-Meteo (una por estado) ──
const VE_ESTADOS = [
  { id:"Amazonas",         lat:3.99,  lon:-67.35 },
  { id:"Anzoátegui",       lat:9.36,  lon:-64.18 },
  { id:"Apure",            lat:7.89,  lon:-68.52 },
  { id:"Aragua",           lat:10.24, lon:-67.60 },
  { id:"Barinas",          lat:8.62,  lon:-70.21 },
  { id:"Bolívar",          lat:8.12,  lon:-63.55 },
  { id:"Carabobo",         lat:10.18, lon:-68.00 },
  { id:"Cojedes",          lat:9.38,  lon:-68.33 },
  { id:"Delta Amacuro",    lat:8.60,  lon:-61.01 },
  { id:"Distrito Capital", lat:10.48, lon:-66.87 },
  { id:"Falcón",           lat:11.41, lon:-69.67 },
  { id:"Guárico",          lat:8.75,  lon:-66.23 },
  { id:"Lara",             lat:10.07, lon:-69.32 },
  { id:"Mérida",           lat:8.59,  lon:-71.14 },
  { id:"Miranda",          lat:10.24, lon:-66.43 },
  { id:"Monagas",          lat:9.75,  lon:-63.18 },
  { id:"Nueva Esparta",    lat:10.99, lon:-63.91 },
  { id:"Portuguesa",       lat:9.09,  lon:-69.35 },
  { id:"Sucre",            lat:10.46, lon:-63.18 },
  { id:"Táchira",          lat:7.77,  lon:-72.22 },
  { id:"Trujillo",         lat:9.36,  lon:-70.43 },
  { id:"Vargas",           lat:10.60, lon:-67.02 },
  { id:"Yaracuy",          lat:10.34, lon:-68.79 },
  { id:"Zulia",            lat:10.65, lon:-71.64 },
];

// Periodo de análisis: últimos 7 días acumulados
const PAST_DAYS = 7;
// Umbrales de alerta (mm acumulados en 7 días)
const UMBRAL_SEQUIA = 5;    // menos de 5 mm/7d → sequía
const UMBRAL_LLUVIA = 100;  // más de 100 mm/7d → riesgo inundación
// Norma histórica mensual estimada por estado (mm/mes, fuente: climatología IDEAM/NOAA)
// Se usa para calcular anomalía aproximada. Valores representativos por región.
const NORMA_MENSUAL = {
  "Amazonas": 280, "Apure": 180, "Bolívar": 210, "Delta Amacuro": 240,
  "Anzoátegui": 110, "Monagas": 120, "Sucre": 130, "Nueva Esparta": 70,
  "Miranda": 100, "Aragua": 95, "Carabobo": 90, "Vargas": 105,
  "Distrito Capital": 90, "Yaracuy": 100, "Lara": 80, "Falcón": 55,
  "Zulia": 160, "Mérida": 150, "Táchira": 145, "Barinas": 175,
  "Portuguesa": 160, "Cojedes": 150, "Guárico": 130, "Trujillo": 120,
};
const norma7d = (id) => ((NORMA_MENSUAL[id] || 120) / 30) * PAST_DAYS;

// ── Escala de colores para precipitación ──
function precipColor(mm) {
  if (mm > 100) return "#1e40af"; // azul muy oscuro
  if (mm > 60)  return "#2563eb"; // azul fuerte
  if (mm > 30)  return "#60a5fa"; // azul medio
  if (mm > 10)  return "#93c5fd"; // azul claro
  if (mm > 2)   return "#bfdbfe"; // azul muy claro
  return "#fde68a";               // amarillo — sequía
}

function anomalyLabel(mm, id) {
  const norm = norma7d(id);
  const pct = norm > 0 ? ((mm - norm) / norm) * 100 : 0;
  if (pct > 50)  return { txt: `+${Math.round(pct)}% sobre norma`, col: "#1d4ed8" };
  if (pct > 10)  return { txt: `+${Math.round(pct)}% sobre norma`, col: "#3b82f6" };
  if (pct > -10) return { txt: "Dentro de norma", col: "#6b7280" };
  if (pct > -50) return { txt: `${Math.round(pct)}% bajo norma`, col: "#ca8a04" };
  return { txt: `${Math.round(pct)}% bajo norma`, col: "#dc2626" };
}

// ── Fetch Open-Meteo para un estado ──
async function fetchPrecip(estado) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${estado.lat}&longitude=${estado.lon}` +
    `&daily=precipitation_sum` +
    `&timezone=America%2FCaracas` +
    `&past_days=${PAST_DAYS}` +
    `&forecast_days=7`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const days = json?.daily?.precipitation_sum ?? [];
  // Los primeros PAST_DAYS son histórico, los siguientes son pronóstico
  const hist = days.slice(0, PAST_DAYS);
  const fcst = days.slice(PAST_DAYS);
  const acum7d = hist.reduce((s, v) => s + (v ?? 0), 0);
  const acumFcst7d = fcst.reduce((s, v) => s + (v ?? 0), 0);
  const fechas = json?.daily?.time ?? [];
  return { id: estado.id, acum7d, acumFcst7d, hist, fcst, fechas };
}

export function TabAmbiental() {
  const mob = useIsMobile();
  const [data, setData]       = useState({});   // { estadoId: { acum7d, acumFcst7d, hist, fcst, fechas } }
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState(0);
  const fetchedRef = useRef(false);

  const loadData = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);
    const results = {};
    let done = 0;
    // Fetch en paralelo en lotes de 8 para no saturar Open-Meteo
    const BATCH = 8;
    for (let i = 0; i < VE_ESTADOS.length; i += BATCH) {
      const batch = VE_ESTADOS.slice(i, i + BATCH);
      const settled = await Promise.allSettled(batch.map(fetchPrecip));
      settled.forEach((r, j) => {
        if (r.status === "fulfilled") results[batch[j].id] = r.value;
      });
      done += batch.length;
      setProgress(Math.round((done / VE_ESTADOS.length) * 100));
    }
    if (Object.keys(results).length === 0) {
      setError("No se pudo conectar con Open-Meteo. Verificá la conexión.");
    } else {
      setData(results);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const selData = selected ? data[selected] : null;

  // ── Alertas automáticas ──
  const alertas = Object.entries(data).filter(([id, d]) =>
    d.acum7d > UMBRAL_LLUVIA || d.acum7d < UMBRAL_SEQUIA
  ).map(([id, d]) => ({
    id,
    tipo: d.acum7d > UMBRAL_LLUVIA ? "lluvia" : "sequia",
    mm: d.acum7d,
  }));

  // ── Ranking por precipitación ──
  const ranking = Object.entries(data)
    .map(([id, d]) => ({ id, mm: d.acum7d }))
    .sort((a, b) => b.mm - a.mm);

  return (
    <div>
      {/* ── HEADER ── */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>🌧️</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600, color:TEXT }}>Ambiental — Precipitaciones</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em" }}>
            Lluvia acumulada 7 días por estado · Open-Meteo · Actualización automática
          </div>
        </div>
        <button
          onClick={() => { fetchedRef.current = false; setData({}); setProgress(0); loadData(); }}
          style={{ fontSize:11, fontFamily:font, padding:"5px 12px", border:`1px solid ${BORDER}`,
            background:"transparent", color:MUTED, cursor:"pointer", letterSpacing:"0.08em" }}>
          ↻ Actualizar
        </button>
      </div>

      {/* ── LOADING ── */}
      {loading && (
        <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:24, textAlign:"center" }}>
          <div style={{ fontSize:13, fontFamily:font, color:MUTED, marginBottom:10 }}>
            Consultando Open-Meteo — {progress}% ({Math.round(progress * VE_ESTADOS.length / 100)}/{VE_ESTADOS.length} estados)
          </div>
          <div style={{ background:BG3, height:6, borderRadius:3, overflow:"hidden" }}>
            <div style={{ width:`${progress}%`, height:"100%", background:ACCENT, transition:"width 0.3s" }} />
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && !loading && (
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", padding:16, color:"#dc2626",
          fontSize:13, fontFamily:font }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL ── */}
      {!loading && !error && Object.keys(data).length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* ── ALERTAS ── */}
          {alertas.length > 0 && (
            <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:"12px 16px" }}>
              <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.1em",
                textTransform:"uppercase", marginBottom:8 }}>Alertas activas</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {alertas.map(a => (
                  <div key={a.id} onClick={() => setSelected(a.id)}
                    style={{ fontSize:12, fontFamily:font, padding:"4px 10px", cursor:"pointer",
                      border:`1px solid ${a.tipo === "lluvia" ? "#2563eb" : "#ca8a04"}`,
                      color: a.tipo === "lluvia" ? "#1d4ed8" : "#b45309",
                      background: a.tipo === "lluvia" ? "#eff6ff" : "#fffbeb" }}>
                    {a.tipo === "lluvia" ? "🌊" : "🔥"} {a.id} · {Math.round(a.mm)} mm
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MAPA + PANEL DETALLE ── */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 300px", gap:12 }}>

            {/* Mapa coroplético */}
            <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:8 }}>
              <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.1em",
                textTransform:"uppercase", marginBottom:6, paddingLeft:4 }}>
                Lluvia acumulada — últimos 7 días (mm)
              </div>
              <svg viewBox="0 0 600 420" style={{ width:"100%", display:"block" }}>
                {VZ_MAP.map(state => {
                  const d = data[state.id];
                  const mm = d?.acum7d ?? null;
                  const isSelected = selected === state.id;
                  return (
                    <g key={state.id}>
                      <path
                        d={state.d}
                        fill={mm !== null ? precipColor(mm) : "#e5e7eb"}
                        stroke={isSelected ? TEXT : BORDER}
                        strokeWidth={isSelected ? 2 : 0.5}
                        style={{ cursor:"pointer", transition:"all 0.15s" }}
                        opacity={selected && !isSelected ? 0.55 : 1}
                        onClick={() => setSelected(isSelected ? null : state.id)}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.setAttribute("stroke", TEXT); }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.setAttribute("stroke", BORDER); }}
                      />
                    </g>
                  );
                })}
                {/* Etiquetas de mm sobre los estados */}
                {VZ_MAP.map(state => {
                  const d = data[state.id];
                  if (!d) return null;
                  const nums = (state.d || "").match(/[\d.]+/g);
                  if (!nums || nums.length < 4) return null;
                  const nf = nums.map(Number);
                  const xs = nf.filter((_, i) => i % 2 === 0);
                  const ys = nf.filter((_, i) => i % 2 === 1);
                  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
                  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
                  return (
                    <text key={`lbl-${state.id}`} x={cx} y={cy}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={d.acum7d > 50 ? 7 : 6}
                      fill={d.acum7d > 60 ? "white" : "#374151"}
                      fontFamily="monospace" pointerEvents="none">
                      {Math.round(d.acum7d)}
                    </text>
                  );
                })}
              </svg>
              {/* Leyenda */}
              <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:6, flexWrap:"wrap" }}>
                {[
                  { c:"#1e40af", l:">100mm 🌊" },
                  { c:"#2563eb", l:"60–100" },
                  { c:"#60a5fa", l:"30–60" },
                  { c:"#93c5fd", l:"10–30" },
                  { c:"#bfdbfe", l:"2–10" },
                  { c:"#fde68a", l:"<2mm 🔥" },
                ].map((l, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:3 }}>
                    <div style={{ width:10, height:10, background:l.c, border:`1px solid ${BORDER}` }} />
                    <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>{l.l}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:9, fontFamily:font, color:`${MUTED}80`,
                textAlign:"center", marginTop:4 }}>
                Click en un estado para ver detalles y pronóstico
              </div>
            </div>

            {/* Panel de detalle */}
            <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:16,
              display:"flex", flexDirection:"column", gap:10 }}>

              {selData ? (
                <>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:TEXT, fontFamily:"'Syne',sans-serif" }}>
                      {selected}
                    </div>
                    <div style={{ fontSize:11, fontFamily:font, color:MUTED }}>
                      Datos en tiempo real · Open-Meteo
                    </div>
                  </div>

                  {/* KPI acumulado */}
                  <div style={{ background:BG3, padding:"10px 12px", border:`1px solid ${BORDER}` }}>
                    <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em",
                      textTransform:"uppercase" }}>Lluvia acumulada 7d</div>
                    <div style={{ fontSize:26, fontWeight:800, color:precipColor(selData.acum7d) === "#fde68a" ? "#ca8a04" : "#1d4ed8",
                      fontFamily:"'Syne',sans-serif", lineHeight:1.2 }}>
                      {Math.round(selData.acum7d)} mm
                    </div>
                    <div style={{ fontSize:11, fontFamily:font, marginTop:4 }}>
                      {(() => { const a = anomalyLabel(selData.acum7d, selected); return <span style={{ color:a.col }}>{a.txt}</span>; })()}
                    </div>
                  </div>

                  {/* Pronóstico próximos 7d */}
                  <div style={{ background:BG3, padding:"10px 12px", border:`1px solid ${BORDER}` }}>
                    <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em",
                      textTransform:"uppercase", marginBottom:6 }}>Pronóstico próximos 7 días</div>
                    <div style={{ fontSize:22, fontWeight:700, color:ACCENT, fontFamily:"'Syne',sans-serif" }}>
                      {Math.round(selData.acumFcst7d)} mm
                    </div>
                    {/* Mini barras diarias del pronóstico */}
                    <div style={{ display:"flex", gap:3, marginTop:8, alignItems:"flex-end", height:36 }}>
                      {selData.fcst.map((mm, i) => {
                        const h = Math.min(Math.max(Math.round(((mm ?? 0) / 30) * 36), 2), 36);
                        return (
                          <div key={i} title={`${selData.fechas[PAST_DAYS + i] ?? ""}: ${Math.round(mm ?? 0)} mm`}
                            style={{ flex:1, height:h, background: precipColor(mm ?? 0),
                              border:`1px solid ${BORDER}`, borderRadius:1 }} />
                        );
                      })}
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between",
                      fontSize:8, fontFamily:font, color:MUTED, marginTop:2 }}>
                      <span>hoy+1</span><span>+7</span>
                    </div>
                  </div>

                  {/* Alerta contextual */}
                  {selData.acum7d > UMBRAL_LLUVIA && (
                    <div style={{ background:"#eff6ff", border:"1px solid #93c5fd", padding:"8px 12px",
                      fontSize:12, fontFamily:font, color:"#1d4ed8" }}>
                      ⚠️ Precipitación alta. Riesgo de deslaves y desbordamientos.
                    </div>
                  )}
                  {selData.acum7d < UMBRAL_SEQUIA && (
                    <div style={{ background:"#fffbeb", border:"1px solid #fcd34d", padding:"8px 12px",
                      fontSize:12, fontFamily:font, color:"#b45309" }}>
                      ⚠️ Déficit hídrico crítico. Posible impacto en abastecimiento y agricultura.
                    </div>
                  )}

                  {/* Nexo analítico */}
                  {selected && ["Bolívar","Caroní"].includes(selected) && (
                    <div style={{ background:"#f0fdf4", border:"1px solid #86efac", padding:"8px 12px",
                      fontSize:11, fontFamily:font, color:"#166534" }}>
                      💡 Bolívar concentra la cuenca del Caroní (Guri). Déficit sostenido presiona la generación eléctrica nacional.
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", flex:1, gap:8, padding:24 }}>
                  <span style={{ fontSize:28, opacity:0.25 }}>🗺️</span>
                  <div style={{ fontSize:13, color:MUTED, textAlign:"center", lineHeight:1.5 }}>
                    Selecciona un estado en el mapa para ver precipitación, anomalía y pronóstico
                  </div>
                  {ranking.length > 0 && (
                    <div style={{ fontSize:11, fontFamily:font, color:`${MUTED}80`, textAlign:"center", marginTop:4 }}>
                      Más lluvioso: {ranking[0]?.id} ({Math.round(ranking[0]?.mm ?? 0)} mm)<br/>
                      Más seco: {ranking[ranking.length-1]?.id} ({Math.round(ranking[ranking.length-1]?.mm ?? 0)} mm)
                    </div>
                  )}
                </div>
              )}

              {/* Ranking */}
              <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:8 }}>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em",
                  textTransform:"uppercase", marginBottom:6 }}>Ranking — precipitación 7d</div>
                {ranking.slice(0, 8).map((r, i) => (
                  <div key={r.id} onClick={() => setSelected(selected === r.id ? null : r.id)}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 0",
                      cursor:"pointer", borderBottom: i < 7 ? `1px solid ${BG3}` : "none" }}>
                    <span style={{ fontSize:9, fontFamily:font, color:MUTED, width:14, textAlign:"right" }}>{i+1}</span>
                    <span style={{ fontSize:11, color:selected===r.id?ACCENT:TEXT, flex:1,
                      fontWeight:selected===r.id?600:400 }}>{r.id}</span>
                    <div style={{ width:50, height:5, background:BG3, borderRadius:2 }}>
                      <div style={{ width:`${Math.min((r.mm / (ranking[0]?.mm || 1)) * 100, 100)}%`,
                        height:"100%", background:precipColor(r.mm), borderRadius:2 }} />
                    </div>
                    <span style={{ fontSize:10, fontFamily:font, color:MUTED, width:36, textAlign:"right" }}>
                      {Math.round(r.mm)}mm
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── NEXO ANALÍTICO ── */}
          <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:"12px 16px" }}>
            <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.1em",
              textTransform:"uppercase", marginBottom:8 }}>Relevancia para el análisis situacional</div>
            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:8 }}>
              {[
                { icon:"💧", titulo:"Guri / Energía", texto:"Déficit hídrico en cuenca del Caroní (Bolívar/Amazonas) reduce generación eléctrica. Indicador adelantado de crisis E2." },
                { icon:"⛰️", titulo:"Deslaves / Desplazamiento", texto:"Precipitaciones extremas en zonas montañosas (Mérida, Táchira, Vargas) generan deslaves y pueden forzar desplazamiento interno." },
                { icon:"🌾", titulo:"Seguridad alimentaria", texto:"Sequía sostenida en Apure, Barinas y Portuguesa impacta producción agrícola y puede escalar conflictividad en zonas rurales." },
              ].map((item, i) => (
                <div key={i} style={{ background:BG3, padding:"10px 12px", border:`1px solid ${BORDER}` }}>
                  <div style={{ fontSize:13, marginBottom:4 }}>{item.icon} <span style={{ fontWeight:600, color:TEXT, fontSize:12 }}>{item.titulo}</span></div>
                  <div style={{ fontSize:11, fontFamily:fontSans, color:MUTED, lineHeight:1.5 }}>{item.texto}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fuente */}
          <div style={{ fontSize:10, fontFamily:font, color:`${MUTED}60`, textAlign:"center", paddingBottom:4 }}>
            Fuente: Open-Meteo API (open-meteo.com) · Modelo meteorológico ERA5/GFS · Datos en UTC-4 · Sin key requerida
          </div>
        </div>
      )}
    </div>
  );
}
