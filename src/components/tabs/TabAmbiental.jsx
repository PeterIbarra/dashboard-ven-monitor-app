import { useState, useEffect, useCallback, useRef } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { BG, BG2, BG3, BORDER, TEXT, MUTED, ACCENT, font, fontSans } from "../../constants";
import { loadScript, loadCSS } from "../../utils";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

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
// Puntos sentinela para climatología NASA POWER. Los estados grandes o
// analíticamente sensibles tienen más de un punto para reducir sesgo territorial.
const NASA_SENTINELS = {
  "Amazonas": [
    { name:"Puerto Ayacucho", lat:5.66, lon:-67.62 },
    { name:"Alto Orinoco", lat:2.72, lon:-65.86 },
  ],
  "Apure": [
    { name:"San Fernando", lat:7.89, lon:-67.47 },
    { name:"Elorza", lat:7.06, lon:-69.50 },
  ],
  "Bolívar": [
    { name:"Ciudad Bolívar", lat:8.12, lon:-63.55 },
    { name:"Guri / Caroní", lat:7.76, lon:-62.98 },
    { name:"Gran Sabana", lat:5.97, lon:-61.43 },
  ],
  "Zulia": [
    { name:"Maracaibo", lat:10.65, lon:-71.64 },
    { name:"Sur del Lago", lat:8.95, lon:-71.92 },
    { name:"Guajira", lat:11.85, lon:-71.32 },
  ],
  "Barinas": [
    { name:"Barinas", lat:8.62, lon:-70.21 },
    { name:"Llanos agrícolas", lat:8.22, lon:-69.72 },
  ],
  "Portuguesa": [
    { name:"Guanare", lat:9.04, lon:-69.75 },
    { name:"Acarigua", lat:9.56, lon:-69.20 },
  ],
  "Mérida": [
    { name:"Mérida", lat:8.59, lon:-71.14 },
    { name:"El Vigía", lat:8.61, lon:-71.65 },
  ],
  "Táchira": [
    { name:"San Cristóbal", lat:7.77, lon:-72.22 },
    { name:"Sur andino", lat:7.25, lon:-72.45 },
  ],
};
const POWER_START_YEAR = 1981;
const POWER_END_YEAR = 2025;
const POWER_CACHE_VERSION = "power-prectotcorr-1981-2025-v1";
const DEFAULT_SELECTED_STATE = "Bolívar";
const HISTORY_RANGE_OPTIONS = [8, 12, 16];
const DEFAULT_HISTORY_WEEKS = 8;

// ── Escala de colores para precipitación ──
function precipColor(mm) {
  if (mm > 100) return "#1e40af"; // azul muy oscuro
  if (mm > 60)  return "#2563eb"; // azul fuerte
  if (mm > 30)  return "#60a5fa"; // azul medio
  if (mm > 10)  return "#93c5fd"; // azul claro
  if (mm > 2)   return "#bfdbfe"; // azul muy claro
  return "#fde68a";               // amarillo — sequía
}

function anomalyLabel(mm, norm) {
  if (!norm) return { txt: "Climatología NASA pendiente", col: MUTED };
  const pct = norm > 0 ? ((mm - norm) / norm) * 100 : 0;
  if (pct > 50)  return { txt: `+${Math.round(pct)}% sobre norma`, col: "#1d4ed8" };
  if (pct > 10)  return { txt: `+${Math.round(pct)}% sobre norma`, col: "#3b82f6" };
  if (pct > -10) return { txt: "Dentro de norma", col: "#6b7280" };
  if (pct > -50) return { txt: `${Math.round(pct)}% bajo norma`, col: "#ca8a04" };
  return { txt: `${Math.round(pct)}% bajo norma`, col: "#dc2626" };
}

function sentinelsForState(estado) {
  return NASA_SENTINELS[estado.id] || [{ name: estado.id, lat: estado.lat, lon: estado.lon }];
}

function calendarWindow(fechas, limit = PAST_DAYS) {
  let yearOffset = 0;
  let prevKey = null;
  return (fechas || [])
    .slice(0, limit)
    .map(d => String(d || "").slice(5, 10).replace("-", ""))
    .filter(Boolean)
    .map(key => {
      if (prevKey && key < prevKey) yearOffset += 1;
      prevKey = key;
      return { key, yearOffset };
    });
}

function formatPowerDate(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function buildHistoryWindows(weeks = DEFAULT_HISTORY_WEEKS, anchorDate = new Date()) {
  const windows = [];
  const anchor = new Date(anchorDate);
  anchor.setHours(12, 0, 0, 0);
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const end = new Date(anchor);
    end.setDate(anchor.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - (PAST_DAYS - 1));
    const fechas = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      fechas.push(toIsoDate(d));
    }
    windows.push({
      label: `${start.getDate()}/${start.getMonth() + 1}`,
      start,
      end,
      fechas,
      windowDays: calendarWindow(fechas),
    });
  }
  return windows;
}

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cacheSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

async function fetchPowerSentinelNorm(sentinel, windowDays) {
  const url =
    `https://power.larc.nasa.gov/api/temporal/daily/point` +
    `?parameters=PRECTOTCORR` +
    `&community=AG` +
    `&longitude=${sentinel.lon}&latitude=${sentinel.lat}` +
    `&start=${POWER_START_YEAR}0101&end=${POWER_END_YEAR}1231` +
    `&format=JSON&time-standard=UTC`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`NASA POWER HTTP ${res.status}`);
  const json = await res.json();
  const series = json?.properties?.parameter?.PRECTOTCORR || {};
  const maxOffset = Math.max(...windowDays.map(d => d.yearOffset), 0);
  const sums = [];
  for (let year = POWER_START_YEAR; year <= POWER_END_YEAR - maxOffset; year += 1) {
    let sum = 0;
    let valid = true;
    windowDays.forEach(({ key, yearOffset }) => {
      const value = series[`${year + yearOffset}${key}`];
      if (value == null || value < 0) {
        valid = false;
      } else {
        sum += value;
      }
    });
    if (valid) sums.push(sum);
  }
  if (!sums.length) return null;
  return sums.reduce((acc, v) => acc + v, 0) / sums.length;
}

async function fetchPowerSentinelRecent(sentinel, start, end) {
  const url =
    `https://power.larc.nasa.gov/api/temporal/daily/point` +
    `?parameters=PRECTOTCORR` +
    `&community=AG` +
    `&longitude=${sentinel.lon}&latitude=${sentinel.lat}` +
    `&start=${formatPowerDate(start)}&end=${formatPowerDate(end)}` +
    `&format=JSON&time-standard=UTC`;
  const res = await fetch(url, { signal: AbortSignal.timeout(16000) });
  if (!res.ok) throw new Error(`NASA POWER HTTP ${res.status}`);
  const json = await res.json();
  return json?.properties?.parameter?.PRECTOTCORR || {};
}

async function fetchPowerClimatology(estado, fechas) {
  const windowDays = calendarWindow(fechas);
  if (!windowDays.length) return null;
  const sentinels = sentinelsForState(estado);
  const cacheKey = `${POWER_CACHE_VERSION}:${estado.id}:${windowDays.map(d => `${d.yearOffset}${d.key}`).join("-")}`;
  const cached = cacheGet(cacheKey);
  if (cached?.norm7d != null) return cached;

  const settled = await Promise.allSettled(
    sentinels.map(sentinel => fetchPowerSentinelNorm(sentinel, windowDays))
  );
  const norms = settled
    .filter(r => r.status === "fulfilled" && r.value != null)
    .map(r => r.value);
  if (!norms.length) return null;

  const result = {
    norm7d: norms.reduce((acc, v) => acc + v, 0) / norms.length,
    sentinels: sentinels.map(s => s.name),
    source: `NASA POWER PRECTOTCORR ${POWER_START_YEAR}-${POWER_END_YEAR}`,
  };
  cacheSet(cacheKey, result);
  return result;
}

async function fetchPowerHistory(estado, rangeWeeks = DEFAULT_HISTORY_WEEKS) {
  const windows = buildHistoryWindows(rangeWeeks);
  const sentinels = sentinelsForState(estado);
  const cacheKey = `${POWER_CACHE_VERSION}:history:${estado.id}:${rangeWeeks}:${windows.map(w => toIsoDate(w.end)).join("-")}`;
  const cached = cacheGet(cacheKey);
  if (cached?.weeks?.length) return cached;

  const start = windows[0].start;
  const end = windows[windows.length - 1].end;
  const recentSettled = await Promise.allSettled(
    sentinels.map(sentinel => fetchPowerSentinelRecent(sentinel, start, end))
  );
  const recentSeries = recentSettled
    .filter(r => r.status === "fulfilled")
    .map(r => r.value);

  const weeks = await Promise.all(windows.map(async window => {
    const observedVals = recentSeries.map(series => {
      const sum = window.fechas.reduce((acc, iso) => {
        const key = iso.replace(/-/g, "");
        const value = series[key];
        return value == null || value < 0 ? acc : acc + value;
      }, 0);
      return sum;
    });
    const normSettled = await Promise.allSettled(
      sentinels.map(sentinel => fetchPowerSentinelNorm(sentinel, window.windowDays))
    );
    const normVals = normSettled
      .filter(r => r.status === "fulfilled" && r.value != null)
      .map(r => r.value);
    const observed = observedVals.length ? observedVals.reduce((acc, v) => acc + v, 0) / observedVals.length : null;
    const norm = normVals.length ? normVals.reduce((acc, v) => acc + v, 0) / normVals.length : null;
    const anomalyPct = observed != null && norm ? ((observed - norm) / norm) * 100 : null;
    return {
      label: window.label,
      start: toIsoDate(window.start),
      end: toIsoDate(window.end),
      observed,
      norm,
      anomalyPct,
    };
  }));

  const below = weeks.filter(w => w.anomalyPct != null && w.anomalyPct < -20).length;
  const above = weeks.filter(w => w.anomalyPct != null && w.anomalyPct > 20).length;
  const latest = weeks[weeks.length - 1];
  const persistentThreshold = Math.ceil(weeks.length * 0.6);
  const status =
    below >= persistentThreshold ? "Déficit persistente" :
    above >= persistentThreshold ? "Exceso persistente" :
    latest?.anomalyPct < -30 ? "Déficit reciente" :
    latest?.anomalyPct > 30 ? "Exceso reciente" :
    "Variabilidad dentro de rango";
  const result = {
    weeks,
    rangeWeeks: weeks.length,
    persistentThreshold,
    status,
    below,
    above,
    sentinels: sentinels.map(s => s.name),
    source: `NASA POWER PRECTOTCORR ${POWER_START_YEAR}-${POWER_END_YEAR} / 2026`,
  };
  cacheSet(cacheKey, result);
  return result;
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

function AmbientalLeafletMap({ data, selected, onSelect, mob }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadCSS(LEAFLET_CSS);
    loadScript(LEAFLET_JS).then(() => {
      if (cancelled || !mapRef.current || !window.L || mapInstance.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [7.8, -66.5],
        zoom: mob ? 5 : 6,
        minZoom: 5,
        maxZoom: 9,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        maxZoom: 10,
      }).addTo(map);
      mapInstance.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mob]);

  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    const L = window.L;
    const map = mapInstance.current;
    if (layerRef.current) map.removeLayer(layerRef.current);
    const group = L.layerGroup();
    const maxMm = Math.max(...Object.values(data).map(d => d.acum7d || 0), 1);

    VE_ESTADOS.forEach(estado => {
      const d = data[estado.id];
      if (!d) return;
      const norm = d.climatology?.norm7d;
      const anomaly = norm ? Math.round(((d.acum7d - norm) / norm) * 100) : null;
      const radius = Math.max(7, Math.min(28, 7 + (d.acum7d / maxMm) * 24));
      const isSelected = selected === estado.id;
      const color = precipColor(d.acum7d);
      const marker = L.circleMarker([estado.lat, estado.lon], {
        radius: isSelected ? radius + 4 : radius,
        fillColor: color,
        color: isSelected ? TEXT : color,
        weight: isSelected ? 3 : 1.5,
        opacity: 0.95,
        fillOpacity: isSelected ? 0.75 : 0.55,
      });
      marker.bindTooltip(
        `<div style="font-family:${font};font-size:11px;line-height:1.45">` +
        `<strong>${estado.id}</strong><br/>` +
        `<span style="font-size:15px;font-weight:700;color:#1d4ed8">${Math.round(d.acum7d)} mm</span> últimos 7d<br/>` +
        (norm ? `Norma NASA: ${Math.round(norm)} mm<br/>Anomalía: ${anomaly > 0 ? "+" : ""}${anomaly}%` : `Norma NASA: pendiente`) +
        `</div>`,
        { direction: "top", offset: [0, -radius] }
      );
      marker.on("click", () => onSelect(isSelected ? null : estado.id));
      group.addLayer(marker);
    });

    if (selected) {
      const estado = VE_ESTADOS.find(e => e.id === selected);
      if (estado) {
        sentinelsForState(estado).forEach(sentinel => {
          const sentinelMarker = L.circleMarker([sentinel.lat, sentinel.lon], {
            radius: 4,
            fillColor: "#111827",
            color: "#ffffff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.85,
          });
          sentinelMarker.bindTooltip(
            `<div style="font-family:${font};font-size:10px"><strong>${sentinel.name}</strong><br/>Punto sentinela NASA POWER</div>`,
            { direction: "top" }
          );
          group.addLayer(sentinelMarker);
        });
      }
    }

    group.addTo(map);
    layerRef.current = group;
  }, [data, selected, onSelect]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: mob ? 330 : 470,
        border: `1px solid ${BORDER}`,
        background: "#eef1f5",
        borderRadius: 4,
      }}
    />
  );
}

function RainHistoryPanel({ history, loading }) {
  if (loading) {
    return (
      <div style={{ background:BG3, padding:"10px 12px", border:`1px solid ${BORDER}` }}>
        <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
          Historial NASA POWER
        </div>
        <div style={{ fontSize:12, fontFamily:font, color:MUTED, marginTop:6 }}>
          Calculando observado vs norma histórica...
        </div>
      </div>
    );
  }
  if (!history?.weeks?.length) {
    return (
      <div style={{ background:BG3, padding:"10px 12px", border:`1px solid ${BORDER}` }}>
        <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
          Historial NASA POWER
        </div>
        <div style={{ fontSize:11, fontFamily:font, color:MUTED, marginTop:6 }}>
          Selecciona un estado para calcular tendencia histórica.
        </div>
      </div>
    );
  }

  const maxVal = Math.max(...history.weeks.flatMap(w => [w.observed || 0, w.norm || 0]), 1);
  const statusColor =
    history.status.includes("Déficit") ? "#ca8a04" :
    history.status.includes("Exceso") ? "#1d4ed8" :
    "#16a34a";
  const statusExplanation =
    history.status === "Déficit persistente" ? `${history.persistentThreshold} o más de las últimas ${history.rangeWeeks} semanas estuvieron al menos 20% bajo la norma. Indica estrés hídrico acumulado, no solo una semana seca.` :
    history.status === "Exceso persistente" ? `${history.persistentThreshold} o más de las últimas ${history.rangeWeeks} semanas estuvieron al menos 20% sobre la norma. Sugiere saturación progresiva de suelos y mayor sensibilidad a inundaciones o deslaves.` :
    history.status === "Déficit reciente" ? "La semana más reciente está al menos 30% bajo la norma, pero todavía no hay persistencia suficiente para clasificarlo como patrón acumulado." :
    history.status === "Exceso reciente" ? "La semana más reciente está al menos 30% sobre la norma, pero el exceso aún no domina la secuencia de ocho semanas." :
    "La secuencia reciente alterna semanas secas y húmedas sin desviación sostenida. Conviene mirar el pronóstico antes de activar alerta.";

  return (
    <div style={{ background:BG3, padding:"14px 16px", border:`1px solid ${BORDER}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8 }}>
        <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
          Historial {history.rangeWeeks} semanas
        </div>
        <div style={{ fontSize:12, fontFamily:font, color:statusColor, fontWeight:700 }}>
          {history.status}
        </div>
      </div>
      <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:160, marginTop:14 }}>
        {history.weeks.map((w, i) => {
          const obsH = Math.max(3, Math.round(((w.observed || 0) / maxVal) * 132));
          const normH = Math.max(3, Math.round(((w.norm || 0) / maxVal) * 132));
          const anomalyColor = w.anomalyPct < -20 ? "#ca8a04" : w.anomalyPct > 20 ? "#1d4ed8" : "#16a34a";
          return (
            <div key={`${w.start}-${i}`} title={`${w.start} a ${w.end}: obs ${Math.round(w.observed || 0)}mm / norma ${Math.round(w.norm || 0)}mm`}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
              <div style={{ height:136, width:"100%", display:"flex", alignItems:"flex-end", justifyContent:"center", gap:2 }}>
                <div style={{ width:history.rangeWeeks > 12 ? 8 : 12, height:obsH, background:anomalyColor, borderRadius:"3px 3px 0 0" }} />
                <div style={{ width:history.rangeWeeks > 12 ? 5 : 7, height:normH, background:`${MUTED}55`, borderRadius:"3px 3px 0 0" }} />
              </div>
              <div style={{ fontSize:history.rangeWeeks > 12 ? 8 : 9, fontFamily:font, color:MUTED }}>{w.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10, gap:8 }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontSize:11, fontFamily:font, color:MUTED }}><b style={{ color:"#1d4ed8" }}>■</b> Observado coloreado por anomalía</span>
          <span style={{ fontSize:11, fontFamily:font, color:MUTED }}><b style={{ color:`${MUTED}99` }}>■</b> Norma</span>
        </div>
        <div style={{ fontSize:11, fontFamily:font, color:MUTED }}>
          {history.below} bajo norma · {history.above} sobre norma
        </div>
      </div>
      <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${BORDER}70`,
        fontSize:12, fontFamily:fontSans, color:MUTED, lineHeight:1.55 }}>
        <strong style={{ color:statusColor }}>{history.status}:</strong> {statusExplanation}
      </div>
      <div style={{ marginTop:6, fontSize:10, fontFamily:font, color:`${MUTED}90`, lineHeight:1.45 }}>
        Cómo leer la gráfica: cada par de barras compara lluvia observada 2026 (barra izquierda) con la norma NASA POWER 1981-2025 para la misma semana calendario (barra derecha). Azul indica exceso, amarillo déficit y verde rango normal.
      </div>
    </div>
  );
}

export function TabAmbiental() {
  const mob = useIsMobile();
  const [data, setData]       = useState({});   // { estadoId: { acum7d, acumFcst7d, hist, fcst, fechas } }
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [selected, setSelected] = useState(DEFAULT_SELECTED_STATE);
  const [historyWeeks, setHistoryWeeks] = useState(DEFAULT_HISTORY_WEEKS);
  const [history, setHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingLabel, setLoadingLabel] = useState("Consultando Open-Meteo");
  const fetchedRef = useRef(false);

  const loadData = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);
    setLoadingLabel("Consultando Open-Meteo");
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
      setLoadingLabel("Calculando norma NASA POWER 1981-2025");
      setProgress(0);
      let climDone = 0;
      const CLIM_BATCH = 3;
      for (let i = 0; i < VE_ESTADOS.length; i += CLIM_BATCH) {
        const batch = VE_ESTADOS.slice(i, i + CLIM_BATCH).filter(estado => results[estado.id]);
        const settled = await Promise.allSettled(
          batch.map(async estado => {
            const clim = await fetchPowerClimatology(estado, results[estado.id].fechas);
            return { id: estado.id, clim };
          })
        );
        settled.forEach(r => {
          if (r.status === "fulfilled" && r.value.clim) {
            results[r.value.id] = { ...results[r.value.id], climatology: r.value.clim };
          }
        });
        climDone += batch.length;
        setProgress(Math.round((climDone / VE_ESTADOS.length) * 100));
      }
      setData(results);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const historyKey = `${selected}:${historyWeeks}`;
    if (!selected || history[historyKey]) return;
    const estado = VE_ESTADOS.find(e => e.id === selected);
    if (!estado) return;
    let cancelled = false;
    setHistoryLoading(true);
    fetchPowerHistory(estado, historyWeeks)
      .then(result => {
        if (!cancelled) setHistory(prev => ({ ...prev, [historyKey]: result }));
      })
      .catch(() => {
        if (!cancelled) setHistory(prev => ({ ...prev, [historyKey]: { error: true, weeks: [] } }));
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => { cancelled = true; };
  }, [selected, historyWeeks, history]);

  const selData = selected ? data[selected] : null;
  const selHistory = selected ? history[`${selected}:${historyWeeks}`] : null;

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
            Lluvia 7 días por estado · Open-Meteo + norma NASA POWER 1981-2025
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
            {loadingLabel} — {progress}% ({Math.round(progress * VE_ESTADOS.length / 100)}/{VE_ESTADOS.length} estados)
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

            {/* Mapa Leaflet */}
            <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:8 }}>
              <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.1em",
                textTransform:"uppercase", marginBottom:6, paddingLeft:4 }}>
                Lluvia acumulada — últimos 7 días (mm)
              </div>
              <AmbientalLeafletMap data={data} selected={selected} onSelect={setSelected} mob={mob} />
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
                Click en un círculo para ver detalles, pronóstico y puntos sentinela NASA
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
                      Observado/pronóstico · Open-Meteo | Norma histórica · NASA POWER
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
                      {(() => { const a = anomalyLabel(selData.acum7d, selData.climatology?.norm7d); return <span style={{ color:a.col }}>{a.txt}</span>; })()}
                    </div>
                    {selData.climatology?.norm7d != null && (
                      <div style={{ fontSize:9, fontFamily:font, color:`${MUTED}90`, marginTop:3 }}>
                        Norma 7d: {Math.round(selData.climatology.norm7d)} mm · {selData.climatology.sentinels.join(", ")}
                      </div>
                    )}
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

          {selected && (
            <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:"12px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:12, marginBottom:8, flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
                    Historial pluviométrico · {selected}
                  </div>
                  <div style={{ fontSize:12, fontFamily:fontSans, color:MUTED, marginTop:2 }}>
                    Observado 2026 frente a norma NASA POWER 1981-2025 para la misma ventana semanal.
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", justifyContent:mob?"flex-start":"flex-end" }}>
                  {selHistory?.sentinels?.length > 0 && (
                    <div style={{ fontSize:10, fontFamily:font, color:`${MUTED}90`, textAlign:mob?"left":"right" }}>
                      Puntos: {selHistory.sentinels.join(", ")}
                    </div>
                  )}
                  <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, fontFamily:font, color:MUTED }}>
                    Período
                    <select
                      value={historyWeeks}
                      onChange={e => setHistoryWeeks(Number(e.target.value))}
                      style={{ fontFamily:font, fontSize:11, background:BG3, border:`1px solid ${BORDER}`,
                        color:ACCENT, padding:"4px 8px", outline:"none", cursor:"pointer" }}
                    >
                      {HISTORY_RANGE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt} semanas</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <RainHistoryPanel history={selHistory} loading={historyLoading && !selHistory} />
            </div>
          )}

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
            Fuentes: Open-Meteo API para lluvia reciente/pronóstico · NASA POWER PRECTOTCORR para norma histórica 1981-2025 por puntos sentinela · Sin key requerida
          </div>
        </div>
      )}
    </div>
  );
}
