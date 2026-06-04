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

// ── Descarga la serie diaria 1981-2025 completa para un sentinel (una sola vez) ──
async function fetchPowerSentinelSeries(sentinel) {
  const cacheKey = `${POWER_CACHE_VERSION}:series:${sentinel.lat}:${sentinel.lon}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const url =
    `https://power.larc.nasa.gov/api/temporal/daily/point` +
    `?parameters=PRECTOTCORR` +
    `&community=AG` +
    `&longitude=${sentinel.lon}&latitude=${sentinel.lat}` +
    `&start=${POWER_START_YEAR}0101&end=${POWER_END_YEAR}1231` +
    `&format=JSON&time-standard=UTC`;
  const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (!res.ok) {
    if (res.status === 429) throw new Error("NASA POWER rate limit (429)");
    throw new Error(`NASA POWER HTTP ${res.status}`);
  }
  const json = await res.json();
  const series = json?.properties?.parameter?.PRECTOTCORR || {};
  cacheSet(cacheKey, series);
  return series;
}

// ── Calcula norma 7d para una ventana a partir de la serie ya descargada ──
function calcNormFromSeries(series, windowDays) {
  const maxOffset = Math.max(...windowDays.map(d => d.yearOffset), 0);
  const sums = [];
  for (let year = POWER_START_YEAR; year <= POWER_END_YEAR - maxOffset; year++) {
    let sum = 0, valid = true;
    windowDays.forEach(({ key, yearOffset }) => {
      const value = series[`${year + yearOffset}${key}`];
      if (value == null || value < 0) { valid = false; } else { sum += value; }
    });
    if (valid) sums.push(sum);
  }
  if (!sums.length) return null;
  return sums.reduce((a, v) => a + v, 0) / sums.length;
}

// ── Calcula norma 7d para el estado actual (lazy, solo al seleccionar) ──
// Descarga cada sentinel una vez, calcula en memoria. Sin requests redundantes.
async function fetchPowerClimatology(estado, fechas) {
  const windowDays = calendarWindow(fechas);
  if (!windowDays.length) return null;
  const sentinels = sentinelsForState(estado);
  const cacheKey = `${POWER_CACHE_VERSION}:clim:${estado.id}:${windowDays.map(d => `${d.yearOffset}${d.key}`).join("-")}`;
  const cached = cacheGet(cacheKey);
  if (cached?.norm7d != null) return cached;

  const settled = await Promise.allSettled(sentinels.map(fetchPowerSentinelSeries));
  const norms = settled
    .filter(r => r.status === "fulfilled" && r.value)
    .map(r => calcNormFromSeries(r.value, windowDays))
    .filter(v => v != null);
  if (!norms.length) return null;

  const result = {
    norm7d: norms.reduce((a, v) => a + v, 0) / norms.length,
    sentinels: sentinels.map(s => s.name),
    source: `NASA POWER PRECTOTCORR ${POWER_START_YEAR}-${POWER_END_YEAR}`,
  };
  cacheSet(cacheKey, result);
  return result;
}

// ── Historial N semanas: descarga series una vez, calcula todas las ventanas en memoria ──
async function fetchPowerHistory(estado, rangeWeeks = DEFAULT_HISTORY_WEEKS) {
  const windows = buildHistoryWindows(rangeWeeks);
  const sentinels = sentinelsForState(estado);
  const cacheKey = `${POWER_CACHE_VERSION}:history:${estado.id}:${rangeWeeks}:${windows.map(w => toIsoDate(w.end)).join("-")}`;
  const cached = cacheGet(cacheKey);
  if (cached?.weeks?.length) return cached;

  // 1. Descargar serie histórica completa por sentinel (1 request/sentinel, no N×sentinel)
  const seriesSettled = await Promise.allSettled(sentinels.map(fetchPowerSentinelSeries));
  const allSeries = seriesSettled
    .filter(r => r.status === "fulfilled" && r.value)
    .map(r => r.value);

  // 2. Descargar observado reciente (rango completo de N semanas, 1 request/sentinel)
  const start = windows[0].start;
  const end = windows[windows.length - 1].end;
  const recentSettled = await Promise.allSettled(
    sentinels.map(sentinel => {
      const url =
        `https://power.larc.nasa.gov/api/temporal/daily/point` +
        `?parameters=PRECTOTCORR&community=AG` +
        `&longitude=${sentinel.lon}&latitude=${sentinel.lat}` +
        `&start=${formatPowerDate(start)}&end=${formatPowerDate(end)}` +
        `&format=JSON&time-standard=UTC`;
      return fetch(url, { signal: AbortSignal.timeout(16000) })
        .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
        .then(j => j?.properties?.parameter?.PRECTOTCORR || {});
    })
  );
  const recentSeries = recentSettled
    .filter(r => r.status === "fulfilled")
    .map(r => r.value);

  // 3. Calcular todas las ventanas en memoria (cero requests adicionales)
  const weeks = windows.map(window => {
    const observedVals = recentSeries.map(series =>
      window.fechas.reduce((acc, iso) => {
        const key = iso.replace(/-/g, "");
        const v = series[key];
        return v == null || v < 0 ? acc : acc + v;
      }, 0)
    );
    const normVals = allSeries
      .map(series => calcNormFromSeries(series, window.windowDays))
      .filter(v => v != null);

    const observed = observedVals.length ? observedVals.reduce((a, v) => a + v, 0) / observedVals.length : null;
    const norm = normVals.length ? normVals.reduce((a, v) => a + v, 0) / normVals.length : null;
    const anomalyPct = observed != null && norm ? ((observed - norm) / norm) * 100 : null;
    return {
      label: window.label,
      start: toIsoDate(window.start),
      end: toIsoDate(window.end),
      observed,
      norm,
      anomalyPct,
    };
  });

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
    weeks, rangeWeeks: weeks.length, persistentThreshold,
    status, below, above,
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

// ── Fetch Open-Meteo archive para historial reciente (past_days hasta 92) ──
async function fetchOMHistory(estado, pastDays) {
  const cacheKey = `om_hist:${estado.id}:${pastDays}:${new Date().toISOString().slice(0,10)}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;
  const url =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${estado.lat}&longitude=${estado.lon}` +
    `&daily=precipitation_sum` +
    `&timezone=America%2FCaracas` +
    `&start_date=${toIsoDate(new Date(Date.now() - pastDays * 86400000))}` +
    `&end_date=${toIsoDate(new Date(Date.now() - 86400000))}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Open-Meteo archive HTTP ${res.status}`);
  const json = await res.json();
  const dates = json?.daily?.time ?? [];
  const vals  = json?.daily?.precipitation_sum ?? [];
  const result = dates.map((d, i) => ({ date: d, mm: vals[i] ?? 0 }));
  cacheSet(cacheKey, result);
  return result;
}

// ── Calcula norma mensual de la serie NASA POWER ya descargada ──
function calcMonthlyNormsFromSeries(series) {
  const monthly = {};
  for (const [key, val] of Object.entries(series)) {
    if (!key || val == null || val < 0) continue;
    const m = key.slice(4, 6); // YYYYMMDD → MM
    if (!monthly[m]) monthly[m] = [];
    monthly[m].push(val);
  }
  const norms = {};
  for (const [m, vals] of Object.entries(monthly)) {
    norms[m] = vals.reduce((a, v) => a + v, 0) / vals.length;
  }
  return norms; // { "01": avg_daily_mm, ... }
}

// ── RainHistoryPanel — versión interactiva con tabs OM/NASA ──
function RainHistoryPanel({ estado, history, historyLoading, data }) {
  const [activeTab, setActiveTab] = React.useState("om");
  const [omDays, setOmDays]       = React.useState(30);
  const [omData, setOmData]       = React.useState(null);
  const [omLoading, setOmLoading] = React.useState(false);
  const [omError, setOmError]     = React.useState(null);
  const [nasaFrom, setNasaFrom]   = React.useState(() => `${new Date().getFullYear() - 1}-01-01`);
  const [nasaTo, setNasaTo]       = React.useState(() => `${new Date().getFullYear() - 1}-12-31`);
  const [nasaResult, setNasaResult] = React.useState(null);
  const [nasaLoading, setNasaLoading] = React.useState(false);
  const [nasaError, setNasaError]   = React.useState(null);
  const omCanvasRef   = React.useRef(null);
  const nasaCanvasRef = React.useRef(null);
  const [omPin, setOmPin]   = React.useState(null);
  const [nasaPin, setNasaPin] = React.useState(null);
  const [omHov, setOmHov]   = React.useState(null);
  const [nasaHov, setNasaHov] = React.useState(null);

  // ── Carga OM cuando cambia estado u omDays ──
  React.useEffect(() => {
    if (!estado) return;
    let cancelled = false;
    setOmLoading(true); setOmError(null); setOmData(null); setOmPin(null);
    fetchOMHistory(estado, omDays)
      .then(d => { if (!cancelled) setOmData(d); })
      .catch(e => { if (!cancelled) setOmError(e.message); })
      .finally(() => { if (!cancelled) setOmLoading(false); });
    return () => { cancelled = true; };
  }, [estado?.id, omDays]);

  // ── Carga NASA POWER rango fechas ──
  const loadNasa = React.useCallback(async () => {
    if (!estado) return;
    setNasaLoading(true); setNasaError(null); setNasaResult(null); setNasaPin(null);
    try {
      const sentinels = sentinelsForState(estado);
      const seriesArr = await Promise.all(sentinels.map(fetchPowerSentinelSeries));
      // Agrupar por mes en el rango seleccionado
      const from = new Date(nasaFrom + "T12:00:00");
      const to   = new Date(nasaTo   + "T12:00:00");
      const monthlyNorms = seriesArr.map(calcMonthlyNormsFromSeries);
      const months = [];
      let cur = new Date(from.getFullYear(), from.getMonth(), 1);
      while (cur <= to) {
        const yyyy = cur.getFullYear();
        const mm   = String(cur.getMonth() + 1).padStart(2, "0");
        const daysInMonth = new Date(yyyy, cur.getMonth() + 1, 0).getDate();
        // Observado: suma de días del mes en la serie (usa solo años en rango)
        let obsSum = 0, obsCount = 0;
        for (let d = 1; d <= daysInMonth; d++) {
          const key = `${yyyy}${mm}${String(d).padStart(2,"0")}`;
          const vals = seriesArr.map(s => s[key]).filter(v => v != null && v >= 0);
          if (vals.length) { obsSum += vals.reduce((a,v)=>a+v,0)/vals.length; obsCount++; }
        }
        // Norma: promedio de todos los años 1981-2025 para ese mes
        const normDaily = monthlyNorms.map(n => n[mm]).filter(v => v != null);
        const normAvg   = normDaily.length ? normDaily.reduce((a,v)=>a+v,0)/normDaily.length : null;
        const norm = normAvg != null ? normAvg * daysInMonth : null;
        const obs  = obsCount ? obsSum : null;
        months.push({
          label: `${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][cur.getMonth()]}'${String(yyyy).slice(2)}`,
          obs, norm,
          anomPct: obs != null && norm ? Math.round((obs - norm) / norm * 100) : null,
        });
        cur.setMonth(cur.getMonth() + 1);
      }
      setNasaResult(months);
    } catch(e) { setNasaError(e.message); }
    setNasaLoading(false);
  }, [estado?.id, nasaFrom, nasaTo]);

  // ── Render Canvas OM ──
  React.useEffect(() => {
    if (!omCanvasRef.current || !omData?.length) return;
    const canvas = omCanvasRef.current;
    drawOMChart(canvas, omData, omPin, omHov);
  }, [omData, omPin, omHov]);

  // ── Render Canvas NASA ──
  React.useEffect(() => {
    if (!nasaCanvasRef.current || !nasaResult?.length) return;
    drawNasaChart(nasaCanvasRef.current, nasaResult, nasaPin, nasaHov);
  }, [nasaResult, nasaPin, nasaHov]);

  if (!estado) {
    return (
      <div style={{ background:BG3, border:`1px solid ${BORDER}`, padding:"10px 14px",
        fontSize:12, fontFamily:fontSans, color:MUTED }}>
        Seleccioná un estado en el mapa para ver el historial de lluvias.
      </div>
    );
  }

  const omTotal = omData ? Math.round(omData.reduce((s,d)=>s+(d.mm??0),0)) : null;
  const omMax   = omData ? Math.round(Math.max(...omData.map(d=>d.mm??0))) : null;
  const omDry   = omData ? omData.filter(d=>(d.mm??0)<1).length : null;
  const omAvg   = omData && omData.length ? omTotal/omData.length : null;
  const pinnedOM = omPin != null && omData ? omData[omPin] : null;

  const nasaTotal = nasaResult ? Math.round(nasaResult.reduce((s,m)=>s+(m.obs??0),0)) : null;
  const nasaNorm  = nasaResult ? Math.round(nasaResult.reduce((s,m)=>s+(m.norm??0),0)) : null;
  const nasaAnom  = nasaTotal != null && nasaNorm ? Math.round((nasaTotal-nasaNorm)/nasaNorm*100) : null;
  const pinnedNasa = nasaPin != null && nasaResult ? nasaResult[nasaPin] : null;

  const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  return (
    <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:"12px 16px" }}>

      {/* Título */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, flexWrap:"wrap", gap:8 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:TEXT }}>📅 Historial de lluvias — {estado.id}</div>
          <div style={{ fontSize:12, fontFamily:fontSans, color:MUTED, marginTop:2 }}>
            Consultá lluvia reciente o explorá años anteriores comparados con el promedio histórico.
          </div>
        </div>
      </div>

      {/* Toggle tabs */}
      <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}`, width:"fit-content", marginBottom:14 }}>
        {[
          { id:"om",   label:"📡 Reciente (Open-Meteo)" },
          { id:"nasa", label:"🛰 Histórico (NASA POWER)" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ fontSize:12, fontFamily:fontSans, padding:"6px 16px", border:"none",
              background:activeTab===t.id?ACCENT:"transparent",
              color:activeTab===t.id?"#fff":MUTED, cursor:"pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB OPEN-METEO ── */}
      {activeTab === "om" && (
        <div>
          {/* Controles período */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, fontFamily:fontSans, color:MUTED }}>Ver los últimos:</span>
            <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}` }}>
              {[[7,"7 días"],[30,"1 mes"],[90,"3 meses"]].map(([d,l]) => (
                <button key={d} onClick={() => setOmDays(d)}
                  style={{ fontSize:11, fontFamily:font, padding:"5px 12px", border:"none",
                    background:omDays===d?ACCENT:"transparent",
                    color:omDays===d?"#fff":MUTED, cursor:"pointer" }}>
                  {l}
                </button>
              ))}
            </div>
            <span style={{ fontSize:10, fontFamily:font, color:`${MUTED}80` }}>
              Open-Meteo archive · sin key · datos a las 24h
            </span>
          </div>

          {omLoading && (
            <div style={{ fontSize:12, fontFamily:fontSans, color:MUTED, padding:"10px 0" }}>
              Consultando Open-Meteo…
            </div>
          )}
          {omError && (
            <div style={{ fontSize:12, fontFamily:fontSans, color:"#dc2626", padding:"8px 12px",
              background:"#fef2f2", border:"1px solid #fecaca" }}>
              ⚠️ {omError}
            </div>
          )}

          {omData && !omLoading && (<>
            {/* KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
              {[
                { val:`${omTotal} mm`, sub:"Total acumulado", col:ACCENT },
                { val:`${omMax} mm`,   sub:"Día más lluvioso", col:"#2563eb" },
                { val:omDry,           sub:"Días sin lluvia",  col:"#ca8a04" },
              ].map((k,i) => (
                <div key={i} style={{ background:BG3, padding:"8px 12px", border:`1px solid ${BORDER}` }}>
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, textTransform:"uppercase",
                    letterSpacing:"0.1em", marginBottom:3 }}>{k.sub}</div>
                  <div style={{ fontSize:20, fontWeight:700, color:k.col, fontFamily:"'Syne',sans-serif" }}>{k.val}</div>
                </div>
              ))}
            </div>

            {/* Canvas */}
            <div style={{ position:"relative", marginBottom:6 }}>
              <canvas ref={omCanvasRef} width={600} height={160}
                style={{ width:"100%", height:160, cursor:"crosshair", display:"block" }}
                onMouseMove={e => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const mx = (e.clientX - r.left) * (600 / r.width);
                  const pad = {l:32,r:8,b:22,t:8};
                  const step = (600-pad.l-pad.r) / omData.length;
                  const idx = Math.floor((mx - pad.l) / step);
                  setOmHov(idx >= 0 && idx < omData.length ? idx : null);
                }}
                onMouseLeave={() => setOmHov(null)}
                onClick={e => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const mx = (e.clientX - r.left) * (600 / r.width);
                  const pad = {l:32,r:8,b:22,t:8};
                  const step = (600-pad.l-pad.r) / omData.length;
                  const idx = Math.floor((mx - pad.l) / step);
                  if (idx >= 0 && idx < omData.length)
                    setOmPin(p => p === idx ? null : idx);
                }}
              />
              {/* Tooltip */}
              {(omHov != null || pinnedOM) && (() => {
                const d = pinnedOM ?? (omHov != null ? omData[omHov] : null);
                if (!d) return null;
                const pad = {l:32,r:8,b:22,t:8};
                const step = (600-pad.l-pad.r) / omData.length;
                const idx = pinnedOM ? omPin : omHov;
                const xPct = ((pad.l + idx * step + step/2) / 600) * 100;
                return (
                  <div style={{
                    position:"absolute", top:4,
                    left:`${Math.min(Math.max(xPct,15),75)}%`,
                    background:BG2, border:`1px solid ${BORDER}`,
                    padding:"6px 10px", fontSize:11, fontFamily:font,
                    pointerEvents:"none", zIndex:10, whiteSpace:"nowrap",
                    boxShadow: pinnedOM ? `0 0 0 2px ${ACCENT}` : "none",
                  }}>
                    <div style={{ color:TEXT, fontWeight:600 }}>{d.date}</div>
                    <div style={{ color:ACCENT }}>{Math.round(d.mm ?? 0)} mm</div>
                    {pinnedOM && <div style={{ fontSize:9, color:MUTED }}>Anclado · clic para soltar</div>}
                  </div>
                );
              })()}
            </div>

            {/* Leyenda */}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center", fontSize:11 }}>
              <span style={{ fontFamily:fontSans, color:MUTED }}>
                <span style={{ display:"inline-block", width:10, height:10, background:"#2563eb", marginRight:4, verticalAlign:"middle" }}/>
                Lluvia diaria
              </span>
              <span style={{ fontFamily:fontSans, color:MUTED }}>
                <span style={{ display:"inline-block", width:10, height:2, background:"#185FA580", marginRight:4, verticalAlign:"middle" }}/>
                Media del período ({omAvg?.toFixed(1)} mm/día)
              </span>
              <span style={{ fontFamily:font, color:`${MUTED}80`, marginLeft:"auto", fontSize:10 }}>
                Hover para ver valor · Clic para anclar
              </span>
            </div>
          </>)}
        </div>
      )}

      {/* ── TAB NASA POWER ── */}
      {activeTab === "nasa" && (
        <div>
          {/* Controles de fecha */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, fontFamily:fontSans, color:MUTED }}>Desde:</span>
            <input type="date" value={nasaFrom} onChange={e => setNasaFrom(e.target.value)}
              style={{ fontFamily:font, fontSize:11, padding:"4px 8px",
                border:`1px solid ${BORDER}`, background:BG3, color:TEXT, outline:"none" }} />
            <span style={{ fontSize:12, fontFamily:fontSans, color:MUTED }}>Hasta:</span>
            <input type="date" value={nasaTo} onChange={e => setNasaTo(e.target.value)}
              style={{ fontFamily:font, fontSize:11, padding:"4px 8px",
                border:`1px solid ${BORDER}`, background:BG3, color:TEXT, outline:"none" }} />
            <button onClick={loadNasa}
              style={{ fontFamily:font, fontSize:11, padding:"5px 14px",
                border:`1px solid ${BORDER}`, background:ACCENT, color:"#fff", cursor:"pointer" }}>
              Consultar
            </button>
          </div>
          {/* Accesos rápidos */}
          <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, fontFamily:fontSans, color:MUTED, alignSelf:"center" }}>Año rápido:</span>
            {[2025,2024,2023,2022,2020,2015,2010].map(y => (
              <button key={y} onClick={() => {
                setNasaFrom(`${y}-01-01`); setNasaTo(`${y}-12-31`);
                setTimeout(loadNasa, 0);
              }}
                style={{ fontFamily:font, fontSize:11, padding:"3px 10px",
                  border:`1px solid ${BORDER}`, background:"transparent",
                  color:MUTED, cursor:"pointer" }}>
                {y}
              </button>
            ))}
          </div>

          {nasaLoading && (
            <div style={{ fontSize:12, fontFamily:fontSans, color:MUTED, padding:"10px 0" }}>
              Consultando NASA POWER 1981-2025…
            </div>
          )}
          {nasaError && (
            <div style={{ fontSize:12, fontFamily:fontSans, color:"#dc2626", padding:"8px 12px",
              background:"#fef2f2", border:"1px solid #fecaca" }}>
              ⚠️ {nasaError}
            </div>
          )}

          {nasaResult && !nasaLoading && (<>
            {/* KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
              <div style={{ background:BG3, padding:"8px 12px", border:`1px solid ${BORDER}` }}>
                <div style={{ fontSize:9, fontFamily:font, color:MUTED, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:3 }}>Lluvia total</div>
                <div style={{ fontSize:20, fontWeight:700, color:ACCENT, fontFamily:"'Syne',sans-serif" }}>{nasaTotal?.toLocaleString()} mm</div>
              </div>
              <div style={{ background:BG3, padding:"8px 12px", border:`1px solid ${BORDER}` }}>
                <div style={{ fontSize:9, fontFamily:font, color:MUTED, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:3 }}>vs. norma histórica</div>
                <div style={{ fontSize:20, fontWeight:700, fontFamily:"'Syne',sans-serif",
                  color: nasaAnom < -20 ? "#ca8a04" : nasaAnom > 20 ? "#1d4ed8" : "#16a34a" }}>
                  {nasaAnom != null ? (nasaAnom >= 0 ? "+" : "") + nasaAnom + "%" : "—"}
                </div>
              </div>
              <div style={{ background:BG3, padding:"8px 12px", border:`1px solid ${BORDER}` }}>
                <div style={{ fontSize:9, fontFamily:font, color:MUTED, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:3 }}>Diagnóstico</div>
                <div style={{ fontSize:12, fontWeight:600, fontFamily:fontSans,
                  color: nasaAnom < -30 ? "#dc2626" : nasaAnom < -10 ? "#ca8a04" : nasaAnom > 30 ? "#1d4ed8" : nasaAnom > 10 ? "#3b82f6" : "#16a34a" }}>
                  {nasaAnom < -30 ? "Déficit severo" : nasaAnom < -10 ? "Déficit leve" : nasaAnom > 30 ? "Exceso severo" : nasaAnom > 10 ? "Exceso leve" : "Dentro de norma"}
                </div>
              </div>
            </div>

            {/* Canvas NASA */}
            <div style={{ position:"relative", marginBottom:6 }}>
              <canvas ref={nasaCanvasRef} width={600} height={160}
                style={{ width:"100%", height:160, cursor:"crosshair", display:"block" }}
                onMouseMove={e => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const mx = (e.clientX - r.left) * (600 / r.width);
                  const pad = {l:36,r:8,b:22,t:8};
                  const gW = (600-pad.l-pad.r) / nasaResult.length;
                  const idx = Math.floor((mx - pad.l) / gW);
                  setNasaHov(idx >= 0 && idx < nasaResult.length ? idx : null);
                }}
                onMouseLeave={() => setNasaHov(null)}
                onClick={e => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const mx = (e.clientX - r.left) * (600 / r.width);
                  const pad = {l:36,r:8,b:22,t:8};
                  const gW = (600-pad.l-pad.r) / nasaResult.length;
                  const idx = Math.floor((mx - pad.l) / gW);
                  if (idx >= 0 && idx < nasaResult.length)
                    setNasaPin(p => p === idx ? null : idx);
                }}
              />
              {/* Tooltip NASA */}
              {(nasaHov != null || pinnedNasa) && (() => {
                const m = pinnedNasa ?? (nasaHov != null ? nasaResult[nasaHov] : null);
                if (!m) return null;
                const pad = {l:36,r:8,b:22,t:8};
                const gW = (600-pad.l-pad.r) / nasaResult.length;
                const idx = pinnedNasa ? nasaPin : nasaHov;
                const xPct = ((pad.l + idx * gW + gW/2) / 600) * 100;
                return (
                  <div style={{
                    position:"absolute", top:4,
                    left:`${Math.min(Math.max(xPct,15),70)}%`,
                    background:BG2, border:`1px solid ${BORDER}`,
                    padding:"6px 10px", fontSize:11, fontFamily:font,
                    pointerEvents:"none", zIndex:10, whiteSpace:"nowrap",
                    boxShadow: pinnedNasa ? `0 0 0 2px ${ACCENT}` : "none",
                  }}>
                    <div style={{ color:TEXT, fontWeight:600 }}>{m.label}</div>
                    <div style={{ color:ACCENT }}>Observado: {Math.round(m.obs ?? 0)} mm</div>
                    <div style={{ color:`${MUTED}` }}>Norma: {Math.round(m.norm ?? 0)} mm</div>
                    {m.anomPct != null && (
                      <div style={{ color: m.anomPct < -20 ? "#ca8a04" : m.anomPct > 20 ? "#1d4ed8" : "#16a34a" }}>
                        Anomalía: {m.anomPct >= 0 ? "+" : ""}{m.anomPct}%
                      </div>
                    )}
                    {pinnedNasa && <div style={{ fontSize:9, color:MUTED }}>Anclado · clic para soltar</div>}
                  </div>
                );
              })()}
            </div>

            {/* Leyenda NASA */}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", fontSize:11, alignItems:"center" }}>
              <span style={{ fontFamily:fontSans, color:MUTED }}>
                <span style={{ display:"inline-block", width:10, height:10, background:"#2563eb", marginRight:4, verticalAlign:"middle" }}/>
                Observado
              </span>
              <span style={{ fontFamily:fontSans, color:MUTED }}>
                <span style={{ display:"inline-block", width:10, height:10, background:"#88808080", marginRight:4, verticalAlign:"middle" }}/>
                Norma 1981-2025
              </span>
              <span style={{ fontFamily:fontSans, color:"#ca8a04" }}>
                <span style={{ display:"inline-block", width:10, height:10, background:"#ca8a04", marginRight:4, verticalAlign:"middle" }}/>
                Déficit &gt;20%
              </span>
              <span style={{ fontFamily:fontSans, color:"#1d4ed8" }}>
                <span style={{ display:"inline-block", width:10, height:10, background:"#1d4ed8", marginRight:4, verticalAlign:"middle" }}/>
                Exceso &gt;20%
              </span>
              <span style={{ fontFamily:font, color:`${MUTED}80`, marginLeft:"auto", fontSize:10 }}>
                Hover para ver valor · Clic para anclar
              </span>
            </div>

            <div style={{ marginTop:10, paddingTop:8, borderTop:`1px solid ${BORDER}70`,
              fontSize:12, fontFamily:fontSans, color:MUTED, lineHeight:1.55 }}>
              Los datos de NASA POWER cubren 1981-2025. Para el período seleccionado, la barra de color muestra la lluvia real y la barra gris el promedio histórico de ese mismo mes. Azul = más lluvia de lo normal · Amarillo = menos lluvia · Verde = dentro del rango esperado.
            </div>
          </>)}

          {!nasaResult && !nasaLoading && !nasaError && (
            <div style={{ fontSize:12, fontFamily:fontSans, color:MUTED, padding:"12px 0" }}>
              Seleccioná un rango de fechas y presioná Consultar para ver el historial comparado con la norma 1981-2025.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Funciones Canvas para RainHistoryPanel ──
function drawOMChart(canvas, data, pinned, hovered) {
  const ctx = canvas.getContext("2d");
  const W = 600, H = 160;
  const pad = {l:32,r:8,b:22,t:8};
  const maxVal = Math.max(...data.map(d => d.mm ?? 0), 1);
  const avg    = data.reduce((s,d)=>s+(d.mm??0),0) / data.length;
  ctx.clearRect(0,0,W,H);
  const step = (W-pad.l-pad.r) / data.length;
  const barW = Math.max(1, Math.floor(step * 0.72));
  const scY = v => H - pad.b - Math.round((v/maxVal)*(H-pad.t-pad.b));
  // Grid
  ctx.strokeStyle="rgba(130,130,130,0.12)"; ctx.lineWidth=0.5;
  for(let i=1;i<=4;i++){const y=H-pad.b-((H-pad.t-pad.b)/4*i);ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();}
  // Avg line
  ctx.strokeStyle="#185FA550"; ctx.lineWidth=1; ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.moveTo(pad.l,scY(avg)); ctx.lineTo(W-pad.r,scY(avg)); ctx.stroke();
  ctx.setLineDash([]);
  // Bars
  data.forEach((d, i) => {
    const x  = pad.l + i*step + (step-barW)/2;
    const y  = scY(d.mm??0);
    const bH = Math.max(1, H-pad.b-y);
    const isHov = i===hovered; const isPin = i===pinned;
    const mm = d.mm ?? 0;
    ctx.fillStyle = isPin ? "#185FA5" : isHov ? "#378ADD" : mm > avg*1.3 ? "#2563eb" : mm < avg*0.4 ? "#ca8a04" : "#60a5fa";
    ctx.globalAlpha = isPin||isHov ? 1 : 0.85;
    ctx.fillRect(x, y, barW, bH);
    ctx.globalAlpha = 1;
    if(isPin){ctx.strokeStyle="#185FA5";ctx.lineWidth=1.5;ctx.strokeRect(x-1,y-1,barW+2,bH+2);}
  });
  // Labels x-axis (cada 7 días para 90d, cada día para 7d)
  const labelEvery = data.length > 60 ? 14 : data.length > 20 ? 7 : data.length > 10 ? 3 : 1;
  ctx.fillStyle="rgba(110,110,110,0.7)"; ctx.font="9px monospace"; ctx.textAlign="center";
  data.forEach((d,i)=>{
    if(i%labelEvery===0){
      const x=pad.l+i*step+step/2;
      ctx.fillText(d.date.slice(5), x, H-pad.b+12);
    }
  });
  // Y labels
  ctx.textAlign="right";
  ctx.fillText(Math.round(maxVal), pad.l-3, pad.t+9);
  ctx.fillText("0", pad.l-3, H-pad.b);
}

function drawNasaChart(canvas, data, pinned, hovered) {
  const ctx = canvas.getContext("2d");
  const W = 600, H = 160;
  const pad = {l:36,r:8,b:22,t:8};
  const maxVal = Math.max(...data.flatMap(d=>[d.obs??0,d.norm??0]),1);
  ctx.clearRect(0,0,W,H);
  const gW = (W-pad.l-pad.r) / data.length;
  const bW = Math.max(2, Math.floor(gW*0.36));
  const scY = v => H-pad.b-Math.round((v/maxVal)*(H-pad.t-pad.b));
  ctx.strokeStyle="rgba(130,130,130,0.12)"; ctx.lineWidth=0.5;
  for(let i=1;i<=4;i++){const y=H-pad.b-((H-pad.t-pad.b)/4*i);ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();}
  data.forEach((d,i) => {
    const cx = pad.l + i*gW + gW/2;
    const isHov=i===hovered; const isPin=i===pinned;
    const ap = d.anomPct ?? 0;
    const obsCol = ap < -20 ? "#ca8a04" : ap > 20 ? "#2563eb" : "#60a5fa";
    // Barra observado
    const x1=cx-bW-1; const y1=scY(d.obs??0); const h1=Math.max(2,H-pad.b-y1);
    ctx.fillStyle = isPin||isHov ? obsCol : obsCol+"cc";
    ctx.fillRect(x1,y1,bW,h1);
    // Barra norma
    const x2=cx+1; const y2=scY(d.norm??0); const h2=Math.max(2,H-pad.b-y2);
    ctx.fillStyle="rgba(140,140,140,0.28)";
    ctx.fillRect(x2,y2,bW,h2);
    if(isPin){ctx.strokeStyle=obsCol;ctx.lineWidth=1.5;ctx.strokeRect(x1-1,y1-1,bW*2+4,h1+2);}
    ctx.fillStyle="rgba(110,110,110,0.7)"; ctx.font="9px monospace"; ctx.textAlign="center";
    ctx.fillText(d.label, cx, H-pad.b+12);
  });
  ctx.textAlign="right"; ctx.fillStyle="rgba(110,110,110,0.7)"; ctx.font="9px monospace";
  ctx.fillText(Math.round(maxVal)+"mm", pad.l-3, pad.t+9);
  ctx.fillText("0", pad.l-3, H-pad.b);
}


// ════════════════════════════════════════════════════════════════
// SECCIÓN INCENDIOS — NASA FIRMS VIIRS
// ════════════════════════════════════════════════════════════════

// Bounding box Venezuela para FIRMS
const VE_BBOX = "-73.4,0.6,-59.8,12.2";
const FIRMS_DAYS_OPTIONS = [1, 2, 7];
const FIRMS_DEFAULT_DAYS = 2;

// Polígonos simplificados por estado para point-in-polygon
// (bounding boxes aproximados — suficiente para agregación estatal)
const VE_STATE_BOUNDS = {
  "Amazonas":        { minLat:0.6,  maxLat:6.5,  minLon:-68.0, maxLon:-61.5 },
  "Anzoátegui":      { minLat:7.8,  maxLat:10.5, minLon:-66.5, maxLon:-62.0 },
  "Apure":           { minLat:5.5,  maxLat:8.5,  minLon:-72.5, maxLon:-66.0 },
  "Aragua":          { minLat:9.5,  maxLat:10.8, minLon:-68.3, maxLon:-66.5 },
  "Barinas":         { minLat:7.0,  maxLat:9.5,  minLon:-71.5, maxLon:-68.5 },
  "Bolívar":         { minLat:3.6,  maxLat:8.8,  minLon:-64.5, maxLon:-60.0 },
  "Carabobo":        { minLat:9.8,  maxLat:10.7, minLon:-68.5, maxLon:-67.5 },
  "Cojedes":         { minLat:8.8,  maxLat:10.0, minLon:-69.0, maxLon:-67.8 },
  "Delta Amacuro":   { minLat:7.5,  maxLat:10.0, minLon:-62.5, maxLon:-59.8 },
  "Distrito Capital":{ minLat:10.3, maxLat:10.7, minLon:-67.1, maxLon:-66.6 },
  "Falcón":          { minLat:10.5, maxLat:12.2, minLon:-71.0, maxLon:-68.5 },
  "Guárico":         { minLat:7.5,  maxLat:10.0, minLon:-68.5, maxLon:-65.0 },
  "Lara":            { minLat:9.5,  maxLat:11.0, minLon:-70.5, maxLon:-68.5 },
  "Mérida":          { minLat:7.8,  maxLat:9.5,  minLon:-72.0, maxLon:-70.5 },
  "Miranda":         { minLat:9.8,  maxLat:10.8, minLon:-67.3, maxLon:-65.8 },
  "Monagas":         { minLat:8.5,  maxLat:10.5, minLon:-64.0, maxLon:-62.0 },
  "Nueva Esparta":   { minLat:10.6, maxLat:11.2, minLon:-64.5, maxLon:-63.5 },
  "Portuguesa":      { minLat:8.5,  maxLat:10.0, minLon:-70.2, maxLon:-68.5 },
  "Sucre":           { minLat:10.0, maxLat:11.0, minLon:-64.0, maxLon:-62.2 },
  "Táchira":         { minLat:6.9,  maxLat:8.5,  minLon:-73.4, maxLon:-71.5 },
  "Trujillo":        { minLat:9.0,  maxLat:10.5, minLon:-71.0, maxLon:-70.0 },
  "Vargas":          { minLat:10.4, maxLat:10.8, minLon:-67.4, maxLon:-66.7 },
  "Yaracuy":         { minLat:10.0, maxLat:10.9, minLon:-69.2, maxLon:-68.2 },
  "Zulia":           { minLat:7.8,  maxLat:12.2, minLon:-73.4, maxLon:-71.0 },
};

function pointToState(lat, lon) {
  for (const [name, b] of Object.entries(VE_STATE_BOUNDS)) {
    if (lat >= b.minLat && lat <= b.maxLat && lon >= b.minLon && lon <= b.maxLon) return name;
  }
  return null;
}

// ── Fetch FIRMS vía proxy Vercel ──
async function fetchFirms(days = FIRMS_DEFAULT_DAYS) {
  const url = `/api/gdelt?source=firms&days=${days}&bbox=${encodeURIComponent(VE_BBOX)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`FIRMS proxy HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.features || [];
}

// ── Parsear CSV FIRMS y agregar por estado ──
function parseFirmsCsv(csv) {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map(h => h.trim());
  const latIdx  = header.indexOf("latitude");
  const lonIdx  = header.indexOf("longitude");
  const frpIdx  = header.indexOf("frp");
  const confIdx = header.indexOf("confidence");
  const dateIdx = header.indexOf("acq_date");
  const dnIdx   = header.indexOf("daynight");
  const points = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    const lat  = parseFloat(parts[latIdx]);
    const lon  = parseFloat(parts[lonIdx]);
    const frp  = parseFloat(parts[frpIdx]);
    const conf = parts[confIdx]?.trim();
    const date = parts[dateIdx]?.trim();
    const dn   = parts[dnIdx]?.trim();
    if (isNaN(lat) || isNaN(lon)) continue;
    points.push({ lat, lon, frp: isNaN(frp) ? 0 : frp, conf, date, dn });
  }
  return points;
}

// ── Agregar puntos por estado ──
function aggregateByState(points) {
  const byState = {};
  for (const p of points) {
    const state = pointToState(p.lat, p.lon);
    if (!state) continue;
    if (!byState[state]) byState[state] = { count: 0, frpTotal: 0, high: 0, points: [] };
    byState[state].count++;
    byState[state].frpTotal += p.frp;
    if (p.conf === "h" || p.conf === "high" || Number(p.conf) > 80) byState[state].high++;
    byState[state].points.push(p);
  }
  return byState;
}

// ── Color por intensidad FRP ──
function fireFrpColor(frpTotal, count) {
  if (count === 0) return "#e5e7eb";
  const frpAvg = frpTotal / count;
  if (frpAvg > 100 || count > 50) return "#991b1b";
  if (frpAvg > 50  || count > 20) return "#dc2626";
  if (frpAvg > 20  || count > 10) return "#f97316";
  if (frpAvg > 5   || count > 3)  return "#fbbf24";
  return "#fef08a";
}

// ── Componente mapa Leaflet para incendios ──
function FireLeafletMap({ fireData, rawPoints, selected, onSelect, mob }) {
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
        maxZoom: 10,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
        maxZoom: 10,
      }).addTo(map);
      mapInstance.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    });
    return () => {
      cancelled = true;
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [mob]);

  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    const L = window.L;
    const map = mapInstance.current;
    if (layerRef.current) map.removeLayer(layerRef.current);
    const group = L.layerGroup();

    // Puntos individuales VIIRS
    for (const p of rawPoints) {
      const radius = Math.max(3, Math.min(10, 3 + (p.frp / 30)));
      const color = p.frp > 100 ? "#991b1b" : p.frp > 50 ? "#dc2626" : p.frp > 10 ? "#f97316" : "#fbbf24";
      const marker = L.circleMarker([p.lat, p.lon], {
        radius,
        fillColor: color,
        color: "#000",
        weight: 0.3,
        opacity: 0.9,
        fillOpacity: 0.75,
      });
      marker.bindTooltip(
        `<div style="font-family:monospace;font-size:10px;line-height:1.4">` +
        `<b>${pointToState(p.lat, p.lon) || "Venezuela"}</b><br/>` +
        `FRP: <b>${Math.round(p.frp)} MW</b> · ${p.date}<br/>` +
        `Confianza: ${p.conf} · ${p.dn === "D" ? "Diurno" : "Nocturno"}` +
        `</div>`,
        { direction: "top" }
      );
      group.addLayer(marker);
    }

    // Círculos por estado (resumen)
    const maxCount = Math.max(...Object.values(fireData).map(d => d.count), 1);
    for (const estado of VE_ESTADOS) {
      const d = fireData[estado.id];
      if (!d || d.count === 0) continue;
      const radius = Math.max(8, Math.min(30, 8 + (d.count / maxCount) * 22));
      const isSelected = selected === estado.id;
      const sumMarker = L.circleMarker([estado.lat, estado.lon], {
        radius: isSelected ? radius + 4 : radius,
        fillColor: fireFrpColor(d.frpTotal, d.count),
        color: isSelected ? "#fff" : "#00000050",
        weight: isSelected ? 2 : 0.5,
        opacity: 0.9,
        fillOpacity: isSelected ? 0.4 : 0.25,
      });
      sumMarker.bindTooltip(
        `<div style="font-family:monospace;font-size:11px;line-height:1.45">` +
        `<b>${estado.id}</b><br/>` +
        `Focos: <b>${d.count}</b> · Alta confianza: ${d.high}<br/>` +
        `FRP total: ${Math.round(d.frpTotal)} MW` +
        `</div>`,
        { direction: "top" }
      );
      sumMarker.on("click", () => onSelect(isSelected ? null : estado.id));
      group.addLayer(sumMarker);
    }

    group.addTo(map);
    layerRef.current = group;
  }, [fireData, rawPoints, selected, onSelect]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: mob ? 330 : 470,
        border: `1px solid ${BORDER}`,
        background: "#1a1a2e",
        borderRadius: 4,
      }}
    />
  );
}

// ── Panel de incendios ──
function TabIncendios({ mob }) {
  const [fireDays, setFireDays]     = useState(FIRMS_DEFAULT_DAYS);
  const [fireData, setFireData]     = useState({});
  const [rawPoints, setRawPoints]   = useState([]);
  const [fireLoading, setFireLoading] = useState(false);
  const [fireError, setFireError]   = useState(null);
  const [fireSel, setFireSel]       = useState(null);
  const [needsKey, setNeedsKey]     = useState(false);
  const [firmsKey, setFirmsKey]     = useState(() => {
    try { return localStorage.getItem("firms_api_key") || ""; } catch { return ""; }
  });
  const [keyInput, setKeyInput]     = useState("");

  const loadFire = useCallback(async (days, key) => {
    setFireLoading(true);
    setFireError(null);
    setFireData({});
    setRawPoints([]);
    try {
      const url = `/api/gdelt?source=firms&days=${days}&bbox=${encodeURIComponent(VE_BBOX)}&key=${encodeURIComponent(key || "")}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      const json = await res.json();
      if (json.needsKey) { setNeedsKey(true); setFireLoading(false); return; }
      if (json.error) throw new Error(json.error);
      const csv = json.csv || "";
      const points = parseFirmsCsv(csv);
      setRawPoints(points);
      setFireData(aggregateByState(points));
    } catch (e) {
      setFireError(e.message);
    }
    setFireLoading(false);
  }, []);

  // Carga inicial
  useEffect(() => {
    if (firmsKey) loadFire(fireDays, firmsKey);
    else setNeedsKey(true);
  }, []); // eslint-disable-line

  // Recargar al cambiar período — siempre, sin condición
  useEffect(() => {
    if (firmsKey && !needsKey) loadFire(fireDays, firmsKey);
  }, [fireDays]); // eslint-disable-line

  const saveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    try { localStorage.setItem("firms_api_key", k); } catch {}
    setFirmsKey(k);
    setNeedsKey(false);
    loadFire(fireDays, k);
  };

  const fireRanking = Object.entries(fireData)
    .map(([id, d]) => ({ id, count: d.count, frp: d.frpTotal, high: d.high }))
    .sort((a, b) => b.count - a.count)
    .filter(r => r.count > 0);

  const selFire = fireSel ? fireData[fireSel] : null;
  const totalFocos = rawPoints.length;
  const totalFrp   = rawPoints.reduce((s, p) => s + p.frp, 0);

  // ── Pantalla de key ──
  if (needsKey && !firmsKey) {
    return (
      <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:24, maxWidth:520 }}>
        <div style={{ fontSize:14, fontWeight:600, color:TEXT, marginBottom:8 }}>
          🔑 Se requiere API key de NASA FIRMS
        </div>
        <div style={{ fontSize:13, fontFamily:fontSans, color:MUTED, lineHeight:1.65, marginBottom:16 }}>
          NASA FIRMS requiere una key gratuita para acceder a datos VIIRS en tiempo real.
          El registro es inmediato en{" "}
          <a href="https://firms.modaps.eosdis.nasa.gov/api/" target="_blank" rel="noreferrer"
            style={{ color:ACCENT }}>firms.modaps.eosdis.nasa.gov/api/</a>.
          La key se guarda en tu browser y no se envía a ningún servidor externo salvo NASA.
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input
            type="text"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && saveKey()}
            placeholder="Pega tu MAP_KEY aquí"
            style={{ flex:1, fontFamily:font, fontSize:12, padding:"6px 10px",
              border:`1px solid ${BORDER}`, background:BG3, color:TEXT, outline:"none" }}
          />
          <button onClick={saveKey}
            style={{ fontFamily:font, fontSize:12, padding:"6px 14px",
              background:ACCENT, color:"#fff", border:"none", cursor:"pointer" }}>
            Guardar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

      {/* Controles */}
      <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
          Período
        </div>
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}` }}>
          {FIRMS_DAYS_OPTIONS.map(d => (
            <button key={d} onClick={() => setFireDays(d)}
              style={{ fontSize:11, fontFamily:font, padding:"5px 12px", border:"none",
                background:fireDays===d?ACCENT:"transparent", color:fireDays===d?"#fff":MUTED,
                cursor:"pointer" }}>
              {d === 1 ? "24 horas" : d === 2 ? "48 horas" : "7 días"}
            </button>
          ))}
        </div>
        <button onClick={() => loadFire(fireDays, firmsKey)}
          style={{ fontSize:11, fontFamily:font, padding:"5px 12px", border:`1px solid ${BORDER}`,
            background:"transparent", color:MUTED, cursor:"pointer" }}>
          ↻ Actualizar
        </button>
        <button onClick={() => { setFirmsKey(""); setNeedsKey(true); }}
          style={{ fontSize:10, fontFamily:font, padding:"4px 8px", border:`1px solid ${BORDER}`,
            background:"transparent", color:`${MUTED}80`, cursor:"pointer" }}>
          Cambiar key
        </button>

        {/* KPIs globales */}
        {!fireLoading && totalFocos > 0 && (
          <div style={{ marginLeft:"auto", display:"flex", gap:12, flexWrap:"wrap" }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:18, fontWeight:800, color:"#dc2626", fontFamily:"'Syne',sans-serif" }}>{totalFocos}</div>
              <div style={{ fontSize:9, fontFamily:font, color:MUTED, textTransform:"uppercase" }}>focos VIIRS</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:18, fontWeight:800, color:"#f97316", fontFamily:"'Syne',sans-serif" }}>{Math.round(totalFrp)}</div>
              <div style={{ fontSize:9, fontFamily:font, color:MUTED, textTransform:"uppercase" }}>MW FRP total</div>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {fireLoading && (
        <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:20, textAlign:"center" }}>
          <div style={{ fontSize:13, fontFamily:font, color:MUTED }}>
            Consultando NASA FIRMS VIIRS…
          </div>
          <div style={{ marginTop:8, width:40, height:4, background:ACCENT, margin:"8px auto 0",
            animation:"pulse 1s infinite alternate", borderRadius:2 }} />
        </div>
      )}

      {/* Error */}
      {fireError && !fireLoading && (
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", padding:12,
          fontSize:12, fontFamily:font, color:"#dc2626" }}>
          ⚠️ {fireError}
        </div>
      )}

      {/* Contenido */}
      {!fireLoading && !fireError && (
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 280px", gap:12 }}>

          {/* Mapa */}
          <div style={{ background:"#111827", border:`1px solid ${BORDER}`, padding:8 }}>
            <div style={{ fontSize:11, fontFamily:font, color:"#9ca3af", letterSpacing:"0.1em",
              textTransform:"uppercase", marginBottom:6, paddingLeft:4 }}>
              Focos activos VIIRS · últimas {fireDays === 1 ? "24 horas" : fireDays === 2 ? "48 horas" : "7 días"}
            </div>
            <FireLeafletMap
              fireData={fireData} rawPoints={rawPoints}
              selected={fireSel} onSelect={setFireSel} mob={mob}
            />
            {/* Leyenda */}
            <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:6, flexWrap:"wrap" }}>
              {[
                { c:"#991b1b", l:"FRP >100MW" },
                { c:"#dc2626", l:">50MW" },
                { c:"#f97316", l:">10MW" },
                { c:"#fbbf24", l:"<10MW" },
              ].map((l, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:3 }}>
                  <div style={{ width:8, height:8, background:l.c, borderRadius:"50%" }} />
                  <span style={{ fontSize:9, fontFamily:font, color:"#9ca3af" }}>{l.l}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize:9, fontFamily:font, color:"#6b7280", textAlign:"center", marginTop:3 }}>
              Puntos = focos individuales · Círculos semitransparentes = resumen por estado
            </div>
          </div>

          {/* Panel detalle */}
          <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:16,
            display:"flex", flexDirection:"column", gap:10 }}>

            {selFire ? (
              <>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:TEXT, fontFamily:"'Syne',sans-serif" }}>
                    {fireSel}
                  </div>
                  <div style={{ fontSize:11, fontFamily:font, color:MUTED }}>
                    Últimas {fireDays === 1 ? "24 horas" : fireDays === 2 ? "48 horas" : "7 días"} · Satélite VIIRS
                  </div>
                </div>
                <div style={{ background:BG3, padding:"10px 12px", border:`1px solid ${BORDER}` }}>
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, textTransform:"uppercase", letterSpacing:"0.1em" }}>Focos activos</div>
                  <div style={{ fontSize:26, fontWeight:800, color:"#dc2626", fontFamily:"'Syne',sans-serif" }}>
                    {selFire.count}
                  </div>
                  <div style={{ fontSize:11, fontFamily:font, color:MUTED, marginTop:2 }}>
                    Alta confianza: {selFire.high} · FRP: {Math.round(selFire.frpTotal)} MW
                  </div>
                </div>

                {/* Barra de FRP */}
                <div style={{ background:BG3, padding:"10px 12px", border:`1px solid ${BORDER}` }}>
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>
                    Fire Radiative Power (intensidad)
                  </div>
                  <div style={{ height:8, background:BORDER, borderRadius:4 }}>
                    <div style={{
                      width:`${Math.min((selFire.frpTotal / Math.max(totalFrp, 1)) * 100, 100)}%`,
                      height:"100%", background:"#dc2626", borderRadius:4,
                    }} />
                  </div>
                  <div style={{ fontSize:10, fontFamily:font, color:MUTED, marginTop:4 }}>
                    {((selFire.frpTotal / Math.max(totalFrp, 1)) * 100).toFixed(1)}% del FRP nacional
                  </div>
                </div>

                {/* Alerta contextual */}
                {selFire.count > 20 && (
                  <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", padding:"8px 12px",
                    fontSize:13, fontFamily:fontSans, color:"#c2410c" }}>
                    ⚠️ Actividad alta: más de 20 focos detectados. Puede haber humo que afecte comunidades cercanas.
                  </div>
                )}
                {["Bolívar","Amazonas"].includes(fireSel) && selFire.count > 5 && (
                  <div style={{ background:"#fefce8", border:"1px solid #fde047", padding:"8px 12px",
                    fontSize:12, fontFamily:fontSans, color:"#854d0e" }}>
                    💡 Este estado está en la zona del Arco Minero. Los incendios aquí suelen asociarse a actividad de minería ilegal y pueden generar conflictos con comunidades indígenas.
                  </div>
                )}
              </>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", flex:1, gap:8, padding:20 }}>
                <span style={{ fontSize:28, opacity:0.25 }}>🔥</span>
                <div style={{ fontSize:13, fontFamily:fontSans, color:MUTED, textAlign:"center", lineHeight:1.6 }}>
                  Haz clic en un círculo del mapa para ver el detalle de focos e intensidad por estado
                </div>
                {fireRanking.length > 0 && (
                  <div style={{ fontSize:11, fontFamily:font, color:`${MUTED}80`, textAlign:"center", marginTop:4 }}>
                    Más activo: {fireRanking[0]?.id} ({fireRanking[0]?.count} focos)
                  </div>
                )}
              </div>
            )}

            {/* Ranking */}
            {fireRanking.length > 0 && (
              <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:8 }}>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em",
                  textTransform:"uppercase", marginBottom:6 }}>
                  Ranking — focos activos
                </div>
                {fireRanking.slice(0, 8).map((r, i) => (
                  <div key={r.id} onClick={() => setFireSel(fireSel === r.id ? null : r.id)}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 0",
                      cursor:"pointer", borderBottom: i < 7 ? `1px solid ${BG3}` : "none" }}>
                    <span style={{ fontSize:9, fontFamily:font, color:MUTED, width:14, textAlign:"right" }}>{i+1}</span>
                    <span style={{ fontSize:11, color:fireSel===r.id?ACCENT:TEXT, flex:1,
                      fontWeight:fireSel===r.id?600:400 }}>{r.id}</span>
                    <div style={{ width:40, height:5, background:BG3, borderRadius:2 }}>
                      <div style={{ width:`${Math.min((r.count / (fireRanking[0]?.count || 1)) * 100, 100)}%`,
                        height:"100%", background:"#dc2626", borderRadius:2 }} />
                    </div>
                    <span style={{ fontSize:10, fontFamily:font, color:"#dc2626", width:24, textAlign:"right" }}>
                      {r.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {fireRanking.length === 0 && !fireLoading && (
              <div style={{ fontSize:12, fontFamily:font, color:MUTED, textAlign:"center", padding:12 }}>
                Sin focos detectados en el período seleccionado
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nexo analítico */}
      <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:"12px 16px" }}>
        <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.1em",
          textTransform:"uppercase", marginBottom:8 }}>Relevancia para el análisis situacional</div>
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:8 }}>
          {[
            { icon:"⛏️", titulo:"Minería ilegal / Arco Minero", texto:"Los incendios en Bolívar y Amazonas suelen ocurrir donde hay minería ilegal. Cuando aumentan, pueden indicar que esa actividad se está expandiendo hacia territorios indígenas." },
            { icon:"🌬️", titulo:"Calidad del aire / Salud", texto:"Muchos focos seguidos producen humo que afecta la salud de comunidades que ya tienen poco acceso a atención médica. Empeora situaciones de vulnerabilidad que el monitor sigue en el escenario E2." },
            { icon:"🌧️", titulo:"Nexo lluvia-incendio", texto:"La mayoría de incendios ocurren entre enero y abril, cuando hay menos lluvia. Si el tab de Lluvias muestra déficit en los mismos estados, el riesgo de incendio es mayor." },
          ].map((item, i) => (
            <div key={i} style={{ background:BG3, padding:"10px 12px", border:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:13, marginBottom:4 }}>{item.icon} <span style={{ fontWeight:600, color:TEXT, fontSize:12 }}>{item.titulo}</span></div>
              <div style={{ fontSize:12, fontFamily:fontSans, color:MUTED, lineHeight:1.6 }}>{item.texto}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize:10, fontFamily:font, color:`${MUTED}60`, textAlign:"center", paddingBottom:4 }}>
        Fuente de datos: NASA FIRMS (sistema de alerta de incendios) · Satélite VIIRS 375m · Actualización cada ~3 horas · Requiere clave gratuita de NASA
      </div>
    </div>
  );
}


export function TabAmbiental() {
  const mob = useIsMobile();
  const [seccion, setSeccion] = useState("lluvia");
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
      setData(results);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Carga lazy de climatología al seleccionar un estado ──
  useEffect(() => {
    if (!selected || !data[selected] || data[selected]?.climatology) return;
    const estado = VE_ESTADOS.find(e => e.id === selected);
    if (!estado) return;
    let cancelled = false;
    fetchPowerClimatology(estado, data[selected].fechas)
      .then(clim => {
        if (!cancelled && clim) {
          setData(prev => ({
            ...prev,
            [selected]: { ...prev[selected], climatology: clim },
          }));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selected, data]);

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
        <span style={{ fontSize:16 }}>🌿</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600, color:TEXT }}>Ambiental — Riesgos Naturales</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em" }}>
            {seccion === "lluvia"
              ? "Lluvia 7 días por estado · Open-Meteo + norma NASA POWER 1981-2025"
              : "Focos activos VIIRS · NASA FIRMS · Tiempo casi real"}
          </div>
        </div>
        {/* Toggle sección */}
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}` }}>
          {[{ id:"lluvia", icon:"🌧️", label:"Lluvias" }, { id:"incendios", icon:"🔥", label:"Incendios" }].map(s => (
            <button key={s.id} onClick={() => setSeccion(s.id)}
              style={{ fontSize:12, fontFamily:font, padding:"6px 14px", border:"none",
                background:seccion===s.id?ACCENT:"transparent",
                color:seccion===s.id?"#fff":MUTED,
                cursor:"pointer", letterSpacing:"0.08em",
                display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:13 }}>{s.icon}</span>{s.label}
            </button>
          ))}
        </div>
        {seccion === "lluvia" && (
          <button
            onClick={() => { fetchedRef.current = false; setData({}); setHistory({}); setProgress(0); setLoadingLabel("Consultando Open-Meteo"); loadData(); }}
            style={{ fontSize:11, fontFamily:font, padding:"5px 12px", border:`1px solid ${BORDER}`,
              background:"transparent", color:MUTED, cursor:"pointer", letterSpacing:"0.08em" }}>
            ↻ Actualizar
          </button>
        )}
      </div>

      {/* ── SECCIÓN LLUVIAS ── */}
      {seccion === "lluvia" && (<>
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
                      textTransform:"uppercase" }}>Lluvia acumulada — últimos 7 días</div>
                    <div style={{ fontSize:26, fontWeight:800, color:precipColor(selData.acum7d) === "#fde68a" ? "#ca8a04" : "#1d4ed8",
                      fontFamily:"'Syne',sans-serif", lineHeight:1.2 }}>
                      {Math.round(selData.acum7d)} mm
                    </div>
                    <div style={{ fontSize:11, fontFamily:font, marginTop:4 }}>
                      {(() => { const a = anomalyLabel(selData.acum7d, selData.climatology?.norm7d); return <span style={{ color:a.col }}>{a.txt}</span>; })()}
                    </div>
                    {selData.climatology?.norm7d != null && (
                      <div style={{ fontSize:9, fontFamily:font, color:`${MUTED}90`, marginTop:3 }}>
                        Promedio histórico (NASA, 1981-2025): {Math.round(selData.climatology.norm7d)} mm · Puntos de medición: {selData.climatology.sentinels.join(", ")}
                      </div>
                    )}
                  </div>

                  {/* Pronóstico próximos 7d */}
                  <div style={{ background:BG3, padding:"10px 12px", border:`1px solid ${BORDER}` }}>
                    <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em",
                      textTransform:"uppercase", marginBottom:6 }}>Lluvia esperada — próximos 7 días</div>
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
                    Haz clic en un estado del mapa para ver cuánta lluvia cayó, si está por encima o por debajo de lo normal, y el pronóstico para los próximos 7 días
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
            <RainHistoryPanel
              estado={VE_ESTADOS.find(e => e.id === selected) ?? null}
              history={selHistory}
              historyLoading={historyLoading}
              data={data}
            />
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
                  <div style={{ fontSize:12, fontFamily:fontSans, color:MUTED, lineHeight:1.6 }}>{item.texto}</div>
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
      </>)}

      {/* ── SECCIÓN INCENDIOS ── */}
      {seccion === "incendios" && <TabIncendios mob={mob} />}
    </div>
  );
}
