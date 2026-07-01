import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { BG2, BG3, BORDER, TEXT, MUTED, ACCENT, font, fontSans } from "../../constants";
import { loadCSS, loadScript } from "../../utils";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

const SEVERITY = {
  low: { label: "Leve", color: "#f59e0b", weight: 0.4 },
  medium: { label: "Media", color: "#f97316", weight: 0.7 },
  high: { label: "Alta", color: "#dc2626", weight: 1 },
};

const DAMAGE = {
  parcial: { label: "Parcial", color: "#f59e0b", weight: 0.65 },
  severo: { label: "Severo", color: "#ef4444", weight: 0.9 },
  total: { label: "Total", color: "#7f1d1d", weight: 1 },
};

const LAYERS = [
  { id: "all", label: "Todo" },
  { id: "reports", label: "Reportes" },
  { id: "buildings", label: "Edificios" },
  { id: "acopios", label: "Acopios" },
];

const PERIODS = [
  { id: "all", label: "Todo" },
  { id: "24h", label: "24h" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "custom", label: "Fecha/hora" },
];

const REPORT_RANGES = [
  { id: "24h", label: "24h" },
  { id: "48h", label: "48h" },
  { id: "7d", label: "7 dias" },
  { id: "custom", label: "Fecha/hora" },
];

const REFRESH_INTERVAL_MS = 120000;

const MAINSHOCK_ISO = "2026-06-24T00:00:00Z";

const QUAKE_RANGES = [
  { id: "mainshock", label: "Desde el sismo" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "custom", label: "Fecha/hora" },
];

const QUAKE_MAG_OPTIONS = [
  { id: "0", label: "Todos" },
  { id: "2.5", label: "M2.5+" },
  { id: "4", label: "M4+" },
  { id: "5", label: "M5+" },
];

function magColor(mag) {
  if (mag >= 6) return "#7f1d1d";
  if (mag >= 5) return "#dc2626";
  if (mag >= 4) return "#f97316";
  if (mag >= 2.5) return "#f59e0b";
  return "#9ca3af";
}

function formatQuakeTime(value) {
  if (!value) return "Sin fecha";
  try {
    return new Intl.DateTimeFormat("es-VE", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function quakeTimeAgo(value) {
  if (!value) return "-";
  const diffMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diffMs)) return "-";
  const h = diffMs / 3600000;
  if (h < 1) return `hace ${Math.max(1, Math.round(h * 60))}min`;
  if (h < 48) return `hace ${Math.round(h)}h`;
  return `hace ${Math.round(h / 24)}d`;
}

function normalizeUsgsFeature(f) {
  return {
    id: `usgs_${f.id}`,
    mag: typeof f.properties?.mag === "number" ? f.properties.mag : null,
    place: f.properties?.place || "Sin lugar registrado",
    time: f.properties?.time ? new Date(f.properties.time).toISOString() : null,
    url: f.properties?.url || null,
    lat: f.geometry?.coordinates?.[1],
    lng: f.geometry?.coordinates?.[0],
    depth: typeof f.geometry?.coordinates?.[2] === "number" ? f.geometry.coordinates[2] : null,
    source: "USGS",
  };
}

function normalizeEmscFeature(f) {
  const depthRaw = f.geometry?.coordinates?.[2];
  return {
    id: `emsc_${f.id}`,
    mag: typeof f.properties?.mag === "number" ? f.properties.mag : null,
    place: f.properties?.flynn_region || "Sin lugar registrado",
    time: f.properties?.time ? new Date(f.properties.time).toISOString() : null,
    url: f.id ? `https://www.seismicportal.eu/eventdetails.html?unid=${f.id}` : null,
    lat: f.geometry?.coordinates?.[1],
    lng: f.geometry?.coordinates?.[0],
    depth: typeof depthRaw === "number" ? Math.abs(depthRaw) : null,
    source: "EMSC",
  };
}

// USGS and EMSC both catalog major events independently — merge and drop EMSC entries
// that clearly correspond to a USGS event already in the list (same rough time/place/magnitude),
// so the same physical earthquake doesn't show up twice with two different IDs.
function mergeQuakeSources(usgsList, emscList) {
  const merged = [...usgsList];
  emscList.forEach(e => {
    const isDuplicate = usgsList.some(u => {
      if (!u.time || !e.time) return false;
      const dtSec = Math.abs(new Date(u.time).getTime() - new Date(e.time).getTime()) / 1000;
      if (dtSec > 90) return false;
      if (Math.abs((u.lat ?? 999) - (e.lat ?? 0)) > 0.6) return false;
      if (Math.abs((u.lng ?? 999) - (e.lng ?? 0)) > 0.6) return false;
      if (u.mag != null && e.mag != null && Math.abs(u.mag - e.mag) > 0.8) return false;
      return true;
    });
    if (!isDuplicate) merged.push(e);
  });
  return merged;
}

function fetchTimeout(url, ms) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id));
}

const CDI_DAMAGE_COLORS = {
  destroyed: "#7f1d1d",
  damagedConfirmed: "#dc2626",
  possibleDamage: "#f59e0b",
  unclassified: "#9ca3af",
};

const CDI_DAMAGE_LABELS = {
  destroyed: "Destruido",
  damagedConfirmed: "Dano confirmado",
  possibleDamage: "Posible dano",
  unclassified: "Sin clasificar",
};

// Copernicus EMS "Grading" vectors use varying property names/labels depending on the
// activation; we try several common patterns and fall back to "unclassified" rather than
// guessing wrong. Verify against `_debug.sampleFeatureProperties` from the proxy after deploy.
function classifyCdiFeature(props) {
  const raw = String(
    props?.damage_grade ?? props?.damageClass ?? props?.damage_class ?? props?.grading ??
    props?.class_dama ?? props?.gridcode ?? props?.class ?? props?.status ?? ""
  ).toLowerCase();
  if (raw.includes("destr") || raw.includes("collapse")) return "destroyed";
  if (raw.includes("confirm") || raw.includes("damaged") || raw.includes("high")) return "damagedConfirmed";
  if (raw.includes("possib") || raw.includes("moderate") || raw.includes("low")) return "possibleDamage";
  return "unclassified";
}

// Microsoft AI for Good (Catia La Mar) uses a continuous damage_pct, not discrete categories —
// color scale matches the legend published with the dataset's own reference figure.
const MSAI4G_BUCKETS = [
  { id: "none", label: "0% (sin dano)", color: "#fef3c7" },
  { id: "b1", label: "0-20%", color: "#fde68a" },
  { id: "b2", label: "20-40%", color: "#fbbf24" },
  { id: "b3", label: "40-60%", color: "#f97316" },
  { id: "b4", label: "60-80%", color: "#ef4444" },
  { id: "b5", label: "80-100%", color: "#7f1d1d" },
];

function msai4gColor(d10, unknown) {
  if (unknown) return "#9ca3af";
  if (d10 <= 0) return "#fef3c7";
  if (d10 < 0.2) return "#fde68a";
  if (d10 < 0.4) return "#fbbf24";
  if (d10 < 0.6) return "#f97316";
  if (d10 < 0.8) return "#ef4444";
  return "#7f1d1d";
}

function normalizeSeverity(value) {
  const key = String(value || "").toLowerCase();
  if (SEVERITY[key]) return key;
  if (key.includes("alta") || key.includes("high") || key.includes("grave")) return "high";
  if (key.includes("media") || key.includes("medium") || key.includes("moder")) return "medium";
  return "low";
}

function normalizeDamage(value) {
  const key = String(value || "").toLowerCase();
  if (DAMAGE[key]) return key;
  if (key.includes("total") || key.includes("colap")) return "total";
  if (key.includes("sever")) return "severo";
  return "parcial";
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  try {
    return new Intl.DateTimeFormat("es-VE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function timeAgoFrom(date, now) {
  if (!date) return "sin datos";
  const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (diffSec < 5) return "justo ahora";
  if (diffSec < 60) return `hace ${diffSec}s`;
  const min = Math.floor(diffSec / 60);
  const sec = diffSec % 60;
  return sec ? `hace ${min}m ${sec}s` : `hace ${min}m`;
}

function countdownTo(target, now) {
  if (!target) return "--:--";
  const diffSec = Math.max(0, Math.round((target.getTime() - now) / 1000));
  const min = Math.floor(diffSec / 60);
  const sec = diffSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function itemDate(item) {
  return item?.created_at || item?.last_updated_at || item?.updated_at || item?.scraped_at || item?.reported_at || item?.submitted_at || null;
}

function isInPeriod(value, period, customStart, customEnd) {
  if (period === "all") return true;
  if (!value) return false;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return false;
  if (period === "custom") {
    const start = customStart ? new Date(customStart).getTime() : null;
    const end = customEnd ? new Date(customEnd).getTime() : null;
    if (Number.isFinite(start) && time < start) return false;
    if (Number.isFinite(end) && time > end) return false;
    return true;
  }
  const ranges = {
    "24h": 24 * 60 * 60 * 1000,
    "48h": 48 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  return Date.now() - time <= ranges[period];
}

function getLatLng(item) {
  const lat = Number(item?.lat);
  const lng = Number(item?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isVenezuelaPoint(lat, lng)) return null;
  return { lat, lng };
}

function formatCoord(value) {
  return Number(value).toFixed(6);
}

function googleMapsUrl(item) {
  const point = getLatLng(item);
  return point ? `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}` : null;
}

function mediaCount(building) {
  return Array.isArray(building.media_urls) ? building.media_urls.length : building.main_photo_url ? 1 : 0;
}

function isVenezuelaPoint(lat, lng) {
  return lat >= 0 && lat <= 13 && lng >= -74.5 && lng <= -58;
}

function heatGradient(value) {
  const core = value > 0.85 ? "#ef0000" : value > 0.65 ? "#ff6b00" : value > 0.45 ? "#d6ff00" : "#00e5ff";
  return `radial-gradient(circle, ${core} 0%, ${core} 18%, #00f5a0 32%, #00a8ff 48%, rgba(59,80,255,0.72) 64%, rgba(59,80,255,0) 78%)`;
}

function SismoMap({ reports, acopios, buildings, buildingDamageSocial = [], escombrosFeatures = [], selectedId, selectedPoint, onSelect, mob, layerMode, mapMode }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerRef = useRef(null);
  const viewportKeyRef = useRef("");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadCSS(LEAFLET_CSS);
    loadScript(LEAFLET_JS).then(() => {
      if (cancelled || !mapRef.current || !window.L || mapInstance.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [10.35, -66.9],
        zoom: mob ? 6 : 7,
        minZoom: 5,
        maxZoom: 14,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 18,
      }).addTo(map);
      mapInstance.current = map;
      setMapReady(true);
      setTimeout(() => map.invalidateSize(), 120);
    });

    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mob]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !window.L) return;
    const L = window.L;
    const map = mapInstance.current;
    if (layerRef.current) map.removeLayer(layerRef.current);

    const group = L.layerGroup();
    const bounds = [];
    const heatPoints = [];

    const includeReports = layerMode === "all" || layerMode === "reports";
    const includeAcopios = layerMode === "all" || layerMode === "acopios";
    const includeBuildings = layerMode === "all" || layerMode === "buildings";

    if (includeReports) {
      reports.forEach(report => {
        const lat = Number(report.lat);
        const lng = Number(report.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isVenezuelaPoint(lat, lng)) return;
        const severity = normalizeSeverity(report.severity);
        const meta = SEVERITY[severity];
        const selected = selectedId === `report:${report.id}`;
        bounds.push([lat, lng]);
        heatPoints.push({ lat, lng, weight: meta.weight, color: meta.color });
        if (mapMode === "heat") return;

        const marker = L.circleMarker([lat, lng], {
          radius: selected ? 10 : severity === "high" ? 8 : severity === "medium" ? 7 : 6,
          fillColor: meta.color,
          color: selected ? TEXT : "#ffffff",
          weight: selected ? 3 : 1,
          opacity: 0.95,
          fillOpacity: 0.72,
        });
        marker.bindPopup(
          `<div style="font-family:monospace;font-size:11px;max-width:260px;line-height:1.45">` +
          `<strong>${report.place || "Reporte ciudadano"}</strong><br/>` +
          `<span style="color:${meta.color};font-weight:700">Reporte ${meta.label}</span><br/>` +
          `${formatDate(report.created_at)}<br/>` +
          (report.note ? `<div style="margin-top:5px;color:#4b5563">${String(report.note).slice(0, 180)}</div>` : "") +
          (report.photo_url ? `<a href="${report.photo_url}" target="_blank" rel="noreferrer">Ver foto</a>` : "") +
          `</div>`
        );
        marker.on("click", () => onSelect({ type: "report", item: report }));
        group.addLayer(marker);
      });
    }

    if (includeBuildings) {
      buildings.forEach(building => {
        const lat = Number(building.lat);
        const lng = Number(building.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isVenezuelaPoint(lat, lng)) return;
        const damage = normalizeDamage(building.damage_level);
        const meta = DAMAGE[damage];
        const selected = selectedId === `building:${building.id}`;
        bounds.push([lat, lng]);
        heatPoints.push({ lat, lng, weight: meta.weight, color: meta.color });
        if (mapMode === "heat") return;

        const marker = L.circleMarker([lat, lng], {
          radius: selected ? 11 : damage === "total" ? 8 : damage === "severo" ? 7 : 6,
          fillColor: meta.color,
          color: selected ? TEXT : "#ffffff",
          weight: selected ? 3 : 1,
          opacity: 0.96,
          fillOpacity: 0.78,
        });
        marker.bindPopup(
          `<div style="font-family:monospace;font-size:11px;max-width:280px;line-height:1.45">` +
          `<strong>${building.name || "Edificio afectado"}</strong><br/>` +
          `<span style="color:${meta.color};font-weight:700">Daño ${meta.label}</span><br/>` +
          `${building.city || ""}${building.zone ? ` · ${building.zone}` : ""}<br/>` +
          `${formatDate(building.last_updated_at)}<br/>` +
          `</div>`
        );
        marker.on("click", () => onSelect({ type: "building", item: building }));
        group.addLayer(marker);
      });

      buildingDamageSocial.forEach(item => {
        const lat = Number(item.lat);
        const lng = Number(item.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isVenezuelaPoint(lat, lng)) return;
        const weight = 0.55 + Math.min(Number(item.confirmations) || 0, 10) * 0.04;
        const selected = selectedId === `buildingSocial:${item.id}`;
        bounds.push([lat, lng]);
        heatPoints.push({ lat, lng, weight, color: "#ea580c" });
        if (mapMode === "heat") return;

        const marker = L.circleMarker([lat, lng], {
          radius: selected ? 10 : 6,
          fillColor: "#ea580c",
          color: selected ? TEXT : "#ffffff",
          weight: selected ? 3 : 1,
          opacity: 0.92,
          fillOpacity: 0.7,
        });
        marker.bindPopup(
          `<div style="font-family:monospace;font-size:11px;max-width:280px;line-height:1.45">` +
          `<strong>${item.place || "Dano reportado (redes)"}</strong><br/>` +
          `<span style="color:#ea580c;font-weight:700">${item.damage_type || "Corroboracion social"} - ${item.confirmations || 0} confirmaciones</span><br/>` +
          `${formatDate(item.reported_at)}<br/>` +
          (item.needs ? `<div style="margin-top:5px;color:#4b5563">${String(item.needs).slice(0, 180)}</div>` : "") +
          `</div>`
        );
        marker.on("click", () => onSelect({ type: "buildingSocial", item }));
        group.addLayer(marker);
      });
    }

    if (includeAcopios) {
      acopios.forEach(acopio => {
        const lat = Number(acopio.lat);
        const lng = Number(acopio.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isVenezuelaPoint(lat, lng)) return;
        bounds.push([lat, lng]);
        heatPoints.push({ lat, lng, weight: 0.45, color: "#16a34a" });
        if (mapMode === "heat") return;
        const selected = selectedId === `acopio:${acopio.id}`;
        const marker = L.circleMarker([lat, lng], {
          radius: selected ? 12 : 9,
          fillColor: "#16a34a",
          color: selected ? TEXT : "#ffffff",
          weight: selected ? 3 : 1.5,
          opacity: 1,
          fillOpacity: 0.82,
        });
        marker.bindPopup(
          `<div style="font-family:monospace;font-size:11px;max-width:260px;line-height:1.45">` +
          `<strong>${acopio.name || "Centro de acopio"}</strong><br/>` +
          `<span style="color:#16a34a;font-weight:700">Acopio / apoyo</span><br/>` +
          (acopio.needs ? `<div>Necesidades: ${String(acopio.needs).slice(0, 180)}</div>` : "") +
          (acopio.contact ? `<div>Contacto: ${String(acopio.contact).slice(0, 120)}</div>` : "") +
          `</div>`
        );
        marker.on("click", () => onSelect({ type: "acopio", item: acopio }));
        group.addLayer(marker);
      });
    }

    if (mapMode === "heat") {
      heatPoints.forEach(point => {
        const size = Math.round((mob ? 44 : 62) + point.weight * (mob ? 28 : 46));
        const icon = L.divIcon({
          className: "sismo-heat-icon",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          html: `<span style="width:${size}px;height:${size}px;background:${heatGradient(point.weight)};opacity:${0.58 + point.weight * 0.2};"></span>`,
        });
        const marker = L.marker([point.lat, point.lng], {
          icon,
          interactive: false,
          keyboard: false,
        });
        group.addLayer(marker);
      });
    }

    // Capa de escombros en vías (siempre visible independientemente del layerMode —
    // es información operativa de bloqueo de acceso, no una capa de "daño" a alternar)
    if (escombrosFeatures.length > 0 && mapMode !== "heat") {
      const escombrosLayer = L.geoJSON(
        { type: "FeatureCollection", features: escombrosFeatures },
        {
          style: feature => {
            const tipo = String(feature.properties?.TipoVia || "").toLowerCase();
            const isPrincipal = tipo.includes("principal");
            // Colores exactos del drawingInfo del FeatureServer de DRP Venezuela
            return {
              color: isPrincipal ? "#ff0000" : "#ffaa00",
              weight: isPrincipal ? 2.5 : 1.5,
              fillColor: isPrincipal ? "#ff0000" : "#ffaa00",
              fillOpacity: 0.5,
              opacity: 1,
            };
          },
          onEachFeature: (feature, layer) => {
            const tipo = feature.properties?.TipoVia || "Sin clasificar";
            layer.bindPopup(
              `<div style="font-family:monospace;font-size:11px">` +
              `<strong>Escombro en vía</strong><br/>` +
              `<span style="color:${tipo.toLowerCase().includes("principal") ? "#dc2626" : "#f97316"}">` +
              `${tipo}</span><br/>` +
              `Fuente: DRP Venezuela / Esri (en vivo)` +
              `</div>`
            );
          },
        }
      );
      group.addLayer(escombrosLayer);
    }

    if (selectedId && selectedPoint && mapMode !== "heat") {
      const haloSize = mob ? 46 : 56;
      const dotSize = 8;
      const haloIcon = L.divIcon({
        className: "sismo-select-halo",
        iconSize: [haloSize, haloSize],
        iconAnchor: [haloSize / 2, haloSize / 2],
        html:
          `<span class="sismo-select-ring" style="position:absolute;top:50%;left:50%;width:${haloSize}px;height:${haloSize}px;margin-left:${-haloSize / 2}px;margin-top:${-haloSize / 2}px;border-radius:999px;border:3px solid #2563eb;box-shadow:0 0 0 2px rgba(37,99,235,0.25);"></span>` +
          `<span style="position:absolute;top:50%;left:50%;width:${dotSize}px;height:${dotSize}px;margin-left:${-dotSize / 2}px;margin-top:${-dotSize / 2}px;border-radius:999px;background:#2563eb;"></span>`,
      });
      const haloMarker = L.marker([selectedPoint.lat, selectedPoint.lng], {
        icon: haloIcon,
        interactive: false,
        keyboard: false,
        zIndexOffset: 1000,
      });
      group.addLayer(haloMarker);
    }

    group.addTo(map);
    layerRef.current = group;
    const viewportKey = `${layerMode}:${mapMode}:${reports.length}:${acopios.length}:${buildings.length}`;
    if (!selectedId && viewportKeyRef.current !== viewportKey && bounds.length > 1) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: mob ? 11 : 12 });
      viewportKeyRef.current = viewportKey;
    }
  }, [reports, acopios, buildings, buildingDamageSocial, escombrosFeatures, selectedId, selectedPoint, onSelect, mob, layerMode, mapMode, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !selectedId || !selectedPoint) return;
    const map = mapInstance.current;
    const targetZoom = Math.max(map.getZoom(), mob ? 12 : 13);
    map.flyTo([selectedPoint.lat, selectedPoint.lng], targetZoom, { duration: 0.65 });
  }, [selectedId, mapReady]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: mob ? 380 : 580,
        border: `1px solid ${BORDER}`,
        background: "#eef1f5",
        borderRadius: 4,
      }}
    />
  );
}

function Kpi({ label, value, tone }) {
  return (
    <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: "12px 14px" }}>
      <div style={{ fontSize: 10, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: tone || ACCENT, lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  );
}

function ToggleGroup({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 0, border: `1px solid ${BORDER}`, flexWrap: "wrap" }}>
      {options.map(option => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          style={{
            fontSize: 11,
            fontFamily: font,
            padding: "7px 12px",
            border: "none",
            background: value === option.id ? ACCENT : "transparent",
            color: value === option.id ? "#ffffff" : MUTED,
            cursor: "pointer",
            letterSpacing: "0.08em",
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function QuakeRegistry({ mob }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const [range, setRange] = useState("mainshock");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [minMagId, setMinMagId] = useState("0");
  const minMag = parseFloat(minMagId) || 0;

  const [quakes, setQuakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const { fromIso, toIso } = useMemo(() => {
    const now = new Date();
    if (range === "custom") {
      return {
        fromIso: customFrom ? new Date(customFrom).toISOString() : MAINSHOCK_ISO,
        toIso: customTo ? new Date(customTo).toISOString() : now.toISOString(),
      };
    }
    if (range === "mainshock") return { fromIso: MAINSHOCK_ISO, toIso: now.toISOString() };
    const days = range === "7d" ? 7 : 30;
    return { fromIso: new Date(now.getTime() - days * 24 * 3600 * 1000).toISOString(), toIso: now.toISOString() };
  }, [range, customFrom, customTo]);

  async function loadQuakes() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        starttime: fromIso.slice(0, 19),
        endtime: toIso.slice(0, 19),
        minmagnitude: String(minMag),
      });
      const [usgsRes, emscRes] = await Promise.all([
        fetchTimeout(`/api/gdelt?source=usgs&${params.toString()}`, 15000).catch(() => null),
        fetchTimeout(`/api/gdelt?source=emsc&${params.toString()}`, 15000).catch(() => null),
      ]);
      const usgsJson = usgsRes && usgsRes.ok ? await usgsRes.json() : { features: [], error: "sin respuesta" };
      const emscJson = emscRes && emscRes.ok ? await emscRes.json() : { features: [], error: "sin respuesta" };

      const usgsParsed = (Array.isArray(usgsJson.features) ? usgsJson.features : [])
        .map(normalizeUsgsFeature)
        .filter(q => Number.isFinite(q.lat) && Number.isFinite(q.lng));
      const emscParsed = (Array.isArray(emscJson.features) ? emscJson.features : [])
        .map(normalizeEmscFeature)
        .filter(q => Number.isFinite(q.lat) && Number.isFinite(q.lng));

      if (usgsParsed.length === 0 && emscParsed.length === 0 && usgsJson.error && emscJson.error) {
        throw new Error("No se pudo conectar con USGS ni con EMSC en este momento.");
      }

      setQuakes(mergeQuakeSources(usgsParsed, emscParsed));
    } catch (e) {
      setError(e.message || "No se pudo conectar con las fuentes sismicas en este momento.");
      setQuakes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadQuakes(); }, [fromIso, toIso, minMag]);

  useEffect(() => {
    let cancelled = false;
    loadCSS(LEAFLET_CSS);
    loadScript(LEAFLET_JS).then(() => {
      if (cancelled || !mapRef.current || !window.L || mapInstance.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [10.6, -67.0],
        zoom: mob ? 6 : 7,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 18 }).addTo(map);
      mapInstance.current = map;
      setMapReady(true);
      setTimeout(() => map.invalidateSize(), 120);
    });
    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [mob]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !window.L) return;
    const L = window.L;
    const map = mapInstance.current;
    if (layerRef.current) map.removeLayer(layerRef.current);
    const group = L.layerGroup();
    const bounds = [];
    quakes.forEach(q => {
      const color = magColor(q.mag || 0);
      const selected = selectedId === q.id;
      bounds.push([q.lat, q.lng]);
      const marker = L.circleMarker([q.lat, q.lng], {
        radius: selected ? Math.max(7, (q.mag || 1) * 2.6) : Math.max(4, (q.mag || 1) * 1.9),
        fillColor: color,
        color: selected ? "#111827" : "#ffffff",
        weight: selected ? 2.5 : 1,
        opacity: 0.92,
        fillOpacity: 0.62,
      });
      marker.bindPopup(
        `<div style="font-family:monospace;font-size:11px;max-width:240px;line-height:1.45">` +
        `<strong>M${q.mag != null ? q.mag.toFixed(1) : "?"}</strong> - ${q.place}<br/>` +
        `${formatQuakeTime(q.time)}<br/>` +
        `Profundidad: ${q.depth != null ? q.depth.toFixed(1) + " km" : "Sin dato"}<br/>` +
        `<span style="color:#6b7280">Fuente: ${q.source}</span>` +
        `</div>`
      );
      marker.on("click", () => setSelectedId(q.id));
      group.addLayer(marker);
    });
    group.addTo(map);
    layerRef.current = group;
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 10 });
  }, [quakes, selectedId, mapReady]);

  const sorted = useMemo(
    () => [...quakes].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)),
    [quakes]
  );
  const maxMag = quakes.reduce((m, q) => Math.max(m, q.mag || 0), 0);
  const aftershocksM45 = quakes.filter(q => (q.mag || 0) >= 4.5).length;
  const mostRecent = sorted[0];
  const selectedQuake = quakes.find(q => q.id === selectedId) || null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <ToggleGroup value={range} onChange={setRange} options={QUAKE_RANGES} />
        <ToggleGroup value={minMagId} onChange={setMinMagId} options={QUAKE_MAG_OPTIONS} />
      </div>

      {range === "custom" && (
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8, background: BG2, border: `1px solid ${BORDER}`, padding: 10 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 10, fontFamily: font, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Desde
            <input
              type="datetime-local"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              style={{ border: `1px solid ${BORDER}`, padding: "7px 9px", fontFamily: fontSans, fontSize: 12, color: TEXT, background: "#ffffff" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 10, fontFamily: font, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Hasta
            <input
              type="datetime-local"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              style={{ border: `1px solid ${BORDER}`, padding: "7px 9px", fontFamily: fontSans, fontSize: 12, color: TEXT, background: "#ffffff" }}
            />
          </label>
        </div>
      )}

      {error && !loading && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: 16, color: "#dc2626", fontFamily: fontSans }}>
          {error}{" "}
          <a href="https://earthquake.usgs.gov/earthquakes/map/?extent=0,-74&extent=13,-58" target="_blank" rel="noreferrer" style={{ color: ACCENT }}>
            Ver directamente en USGS ↗
          </a>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
        <Kpi label="Sismos registrados" value={loading ? "..." : quakes.length} />
        <Kpi label="Magnitud maxima" value={loading ? "..." : (maxMag ? `M${maxMag.toFixed(1)}` : "-")} tone="#7f1d1d" />
        <Kpi label="Replicas M4.5+" value={loading ? "..." : aftershocksM45} tone="#dc2626" />
        <Kpi label="Mas reciente" value={loading ? "..." : (mostRecent ? quakeTimeAgo(mostRecent.time) : "-")} tone={ACCENT} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 340px", gap: 12 }}>
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 8 }}>
          <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>
            Epicentros - USGS (fuente oficial){loading ? " - cargando..." : ""}
          </div>
          <div
            ref={mapRef}
            style={{ width: "100%", height: mob ? 320 : 480, border: `1px solid ${BORDER}`, background: "#eef1f5", borderRadius: 4 }}
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
            {[["M2.5-3.9", "#f59e0b"], ["M4-4.9", "#f97316"], ["M5-5.9", "#dc2626"], ["M6+", "#7f1d1d"]].map(([label, color]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
                <span style={{ width: 10, height: 10, borderRadius: 10, background: color, display: "inline-block" }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 14 }}>
          <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            Detalle seleccionado
          </div>
          {selectedQuake ? (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: magColor(selectedQuake.mag || 0) }}>
                M{selectedQuake.mag != null ? selectedQuake.mag.toFixed(1) : "?"}
              </div>
              <div style={{ fontSize: 13, fontFamily: fontSans, color: TEXT, marginTop: 4, lineHeight: 1.5 }}>
                {selectedQuake.place}
              </div>
              <div style={{ display: "inline-block", marginTop: 6, fontSize: 9, fontFamily: font, color: selectedQuake.source === "EMSC" ? "#0d9488" : "#2563eb", border: `1px solid ${selectedQuake.source === "EMSC" ? "#0d9488" : "#2563eb"}40`, padding: "2px 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {selectedQuake.source}
              </div>
              <div style={{ fontSize: 11, fontFamily: font, color: MUTED, marginTop: 8 }}>
                {formatQuakeTime(selectedQuake.time)}
              </div>
              <div style={{ fontSize: 11, fontFamily: font, color: MUTED, marginTop: 4 }}>
                Profundidad: {selectedQuake.depth != null ? `${selectedQuake.depth.toFixed(1)} km` : "Sin dato"}
              </div>
              <div style={{ fontSize: 11, fontFamily: font, color: MUTED, marginTop: 4 }}>
                {formatCoord(selectedQuake.lat)}, {formatCoord(selectedQuake.lng)}
              </div>
              {selectedQuake.url && (
                <a href={selectedQuake.url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 10, fontSize: 11, fontFamily: font, color: ACCENT }}>
                  Ver ficha en {selectedQuake.source} ↗
                </a>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, fontFamily: fontSans, color: MUTED, lineHeight: 1.5 }}>
              {loading ? "Cargando catalogo sismico..." : "Haz clic en un punto del mapa o una fila de la tabla para ver el detalle."}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 14 }}>
        <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          Listado ({sorted.length})
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: font }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
                <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Fecha</th>
                <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Magnitud</th>
                <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Profundidad</th>
                <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Lugar</th>
                <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Coordenadas</th>
                <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Fuente</th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 300).map(q => (
                <tr
                  key={q.id}
                  onClick={() => setSelectedId(q.id)}
                  style={{ borderBottom: `1px solid ${BORDER}30`, cursor: "pointer", background: selectedId === q.id ? `${ACCENT}08` : "transparent" }}
                >
                  <td style={{ padding: "6px 8px", color: TEXT }}>{formatQuakeTime(q.time)}</td>
                  <td style={{ padding: "6px 8px", color: magColor(q.mag || 0), fontWeight: 700 }}>
                    M{q.mag != null ? q.mag.toFixed(1) : "?"}
                  </td>
                  <td style={{ padding: "6px 8px", color: MUTED }}>{q.depth != null ? `${q.depth.toFixed(1)} km` : "-"}</td>
                  <td style={{ padding: "6px 8px", color: TEXT }}>{q.place}</td>
                  <td style={{ padding: "6px 8px", color: `${MUTED}cc` }}>{formatCoord(q.lat)}, {formatCoord(q.lng)}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <span style={{ fontSize: 9, fontFamily: font, color: q.source === "EMSC" ? "#0d9488" : "#2563eb", border: `1px solid ${q.source === "EMSC" ? "#0d9488" : "#2563eb"}40`, padding: "1px 5px" }}>
                      {q.source}
                    </span>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 16, textAlign: "center", color: MUTED }}>{loading ? "Cargando..." : "No se registraron sismos para este filtro."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {sorted.length > 300 && (
          <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}90`, marginTop: 8 }}>
            Mostrando los 300 mas recientes de {sorted.length} registros.
          </div>
        )}
      </div>

      <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}70`, textAlign: "center" }}>
        Fuente: USGS + EMSC (European-Mediterranean Seismological Centre) - catalogos oficiales fusionados, duplicados removidos
      </div>
    </div>
  );
}

function CopernicusDamage({ mob }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const damageLayerRef = useRef(null);
  const selectedLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const [data, setData] = useState({ aois: [], watchlist: [], updatedAt: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAoiId, setSelectedAoiId] = useState(null);
  const [showImagery, setShowImagery] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTimeout("/api/gdelt?source=cdi", 20000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error && (!json.aois || json.aois.length === 0)) throw new Error(json.error);
      const aois = Array.isArray(json.aois) ? json.aois : [];
      setData({ aois, watchlist: json.watchlist || [], updatedAt: json.updatedAt });
      if (aois.length > 0) {
        setSelectedAoiId(prev => prev && aois.some(a => a.id === prev) ? prev : (
          aois.find(a => a.status === "official-vector" && (a.features || []).length > 0)?.id || aois[0].id
        ));
      }
    } catch (e) {
      setError(e.message || "No se pudo conectar con Crisis Damage Intelligence.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let cancelled = false;
    loadCSS(LEAFLET_CSS);
    loadScript(LEAFLET_JS).then(() => {
      if (cancelled || !mapRef.current || !window.L || mapInstance.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [10.5, -67.0],
        zoom: mob ? 11 : 13,
        minZoom: 4,
        maxZoom: 19,
        zoomControl: true,
        attributionControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      mapInstance.current = map;
      setMapReady(true);
      setTimeout(() => map.invalidateSize(), 120);
    });
    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [mob]);

  const selectedAoi = data.aois.find(a => a.id === selectedAoiId) || null;

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !window.L || !selectedAoi) return;
    const L = window.L;
    const map = mapInstance.current;

    if (tileLayerRef.current) { map.removeLayer(tileLayerRef.current); tileLayerRef.current = null; }
    if (damageLayerRef.current) { map.removeLayer(damageLayerRef.current); damageLayerRef.current = null; }
    selectedLayerRef.current = null;

    if (showImagery && selectedAoi.afterTilesUrlTemplate) {
      const tileLayer = L.tileLayer(selectedAoi.afterTilesUrlTemplate, {
        minZoom: selectedAoi.tileMinZoom || 12,
        maxZoom: selectedAoi.tileMaxZoom || 18,
        maxNativeZoom: selectedAoi.tileMaxZoom || 18,
        opacity: 0.95,
      });
      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;
    }

    const features = selectedAoi.features || [];
    if (features.length > 0) {
      const geoLayer = L.geoJSON({ type: "FeatureCollection", features }, {
        style: feature => {
          const cls = classifyCdiFeature(feature.properties);
          return {
            color: "#ffffff",
            weight: 1,
            fillColor: CDI_DAMAGE_COLORS[cls],
            fillOpacity: 0.6,
          };
        },
        pointToLayer: (feature, latlng) => {
          const cls = classifyCdiFeature(feature.properties);
          return L.circleMarker(latlng, {
            radius: 6,
            color: "#ffffff",
            weight: 1,
            fillColor: CDI_DAMAGE_COLORS[cls],
            fillOpacity: 0.75,
          });
        },
        onEachFeature: (feature, layer) => {
          const cls = classifyCdiFeature(feature.properties);
          layer.bindPopup(
            `<div style="font-family:monospace;font-size:11px;max-width:220px;line-height:1.4">` +
            `<strong>${CDI_DAMAGE_LABELS[cls]}</strong><br/>` +
            `AOI: ${selectedAoi.nameEs}` +
            `</div>`
          );
          layer.on("click", () => {
            if (selectedLayerRef.current && selectedLayerRef.current !== layer) {
              selectedLayerRef.current.setStyle({ color: "#ffffff", weight: 1 });
            }
            layer.setStyle({ color: "#111827", weight: 2.5 });
            selectedLayerRef.current = layer;
            setSelectedFeature({ ...feature, __aoi: selectedAoi.id });
          });
        },
      });
      geoLayer.addTo(map);
      damageLayerRef.current = geoLayer;
      try {
        const b = geoLayer.getBounds();
        if (b.isValid()) map.fitBounds(b, { padding: [24, 24], maxZoom: selectedAoi.tileMaxZoom || 18 });
      } catch {
        if (Array.isArray(selectedAoi.bounds) && selectedAoi.bounds.length === 2) {
          map.fitBounds(selectedAoi.bounds, { padding: [24, 24] });
        }
      }
    } else if (Array.isArray(selectedAoi.bounds) && selectedAoi.bounds.length === 2) {
      map.fitBounds(selectedAoi.bounds, { padding: [24, 24] });
    }
  }, [selectedAoi, showImagery, mapReady]);

  const aoiOptions = data.aois.map(a => ({ id: a.id, label: a.nameEs.replace(/^AOI\d+\s*/, "") }));
  const damageCounts = selectedAoi?.metrics || {};
  const totalDestroyed = data.aois.reduce((sum, a) => sum + (a.metrics?.destroyed || 0), 0);
  const totalConfirmed = data.aois.reduce((sum, a) => sum + (a.metrics?.damagedConfirmed || 0), 0);
  const totalFeatures = data.aois.reduce((sum, a) => sum + (a.metrics?.features || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11, fontFamily: font, color: MUTED, lineHeight: 1.6, background: BG2, border: `1px solid ${BORDER}`, padding: 10 }}>
        Datos de <strong>Crisis Damage Intelligence</strong>, construidos sobre la activacion oficial <strong>Copernicus EMSR884</strong> (servicio europeo de mapeo de emergencias) con revision adicional por IA (VLM). Cobertura por zonas (AOI), no nacional completa.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
        <Kpi label="Zonas con datos" value={loading ? "..." : data.aois.length} />
        <Kpi label="Estructuras evaluadas" value={loading ? "..." : totalFeatures} />
        <Kpi label="Destruidas (total)" value={loading ? "..." : totalDestroyed} tone={CDI_DAMAGE_COLORS.destroyed} />
        <Kpi label="Dano confirmado (total)" value={loading ? "..." : totalConfirmed} tone={CDI_DAMAGE_COLORS.damagedConfirmed} />
      </div>

      {error && !loading && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: 16, color: "#dc2626", fontFamily: fontSans }}>
          {error}{" "}
          <a href="https://crisis-damage-intelligence.vercel.app/" target="_blank" rel="noreferrer" style={{ color: ACCENT }}>
            Ver plataforma directamente ↗
          </a>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <ToggleGroup value={selectedAoiId} onChange={id => { setSelectedAoiId(id); setSelectedFeature(null); }} options={aoiOptions} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: font, color: MUTED, cursor: "pointer" }}>
          <input type="checkbox" checked={showImagery} onChange={e => setShowImagery(e.target.checked)} />
          Mostrar imagen satelital
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 320px", gap: 12 }}>
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 8 }}>
          <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>
            {selectedAoi ? selectedAoi.nameEs : "Cargando zona..."}{loading ? " - cargando..." : ""}
          </div>
          <div ref={mapRef} style={{ width: "100%", height: mob ? 320 : 480, border: `1px solid ${BORDER}`, background: "#eef1f5", borderRadius: 4 }} />
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
            {Object.entries(CDI_DAMAGE_LABELS).map(([key, label]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
                <span style={{ width: 10, height: 10, borderRadius: 10, background: CDI_DAMAGE_COLORS[key], display: "inline-block" }} />
                {label}
              </div>
            ))}
          </div>
          {selectedAoi?.sensor && (
            <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}90`, textAlign: "center", marginTop: 6 }}>
              Imagen: {selectedAoi.sensor} - adquirida {formatQuakeTime(selectedAoi.acquisitionUtc)} (post-evento)
            </div>
          )}
        </div>

        <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 14 }}>
          <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            {selectedFeature ? "Estructura seleccionada" : `Resumen - ${selectedAoi?.nameEs || ""}`}
          </div>
          {selectedFeature ? (
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: CDI_DAMAGE_COLORS[classifyCdiFeature(selectedFeature.properties)] }}>
                {CDI_DAMAGE_LABELS[classifyCdiFeature(selectedFeature.properties)]}
              </div>
              <div style={{ fontSize: 11, fontFamily: font, color: MUTED, marginTop: 8 }}>
                Zona: {selectedAoi?.nameEs}
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                style={{ marginTop: 10, fontSize: 10, fontFamily: font, color: MUTED, background: "transparent", border: `1px solid ${BORDER}`, padding: "5px 10px", cursor: "pointer" }}
              >
                Volver al resumen
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, fontFamily: fontSans, color: TEXT }}>Estructuras evaluadas: <strong>{damageCounts.features ?? 0}</strong></div>
              <div style={{ fontSize: 12, fontFamily: fontSans, color: CDI_DAMAGE_COLORS.destroyed }}>Destruidas: <strong>{damageCounts.destroyed ?? 0}</strong></div>
              <div style={{ fontSize: 12, fontFamily: fontSans, color: CDI_DAMAGE_COLORS.damagedConfirmed }}>Dano confirmado: <strong>{damageCounts.damagedConfirmed ?? 0}</strong></div>
              <div style={{ fontSize: 12, fontFamily: fontSans, color: CDI_DAMAGE_COLORS.possibleDamage }}>Posible dano: <strong>{damageCounts.possibleDamage ?? 0}</strong></div>
              <div style={{ fontSize: 11, fontFamily: font, color: MUTED, marginTop: 4 }}>Revisadas por IA (VLM): {damageCounts.vlmReviewed ?? 0}</div>
              {selectedAoi?.status === "imagery-only" && (
                <div style={{ fontSize: 10, fontFamily: font, color: "#b45309", marginTop: 4 }}>
                  Solo imagen disponible - Copernicus aun no publico vector oficial de dano para esta zona.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 14 }}>
        <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          Comparativo por zona
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: font }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
                <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Zona</th>
                <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Estado</th>
                <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Estructuras</th>
                <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Destruidas</th>
                <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Dano confirmado</th>
                <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Posible dano</th>
              </tr>
            </thead>
            <tbody>
              {data.aois.map(a => (
                <tr
                  key={a.id}
                  onClick={() => { setSelectedAoiId(a.id); setSelectedFeature(null); }}
                  style={{ borderBottom: `1px solid ${BORDER}30`, cursor: "pointer", background: selectedAoiId === a.id ? `${ACCENT}08` : "transparent" }}
                >
                  <td style={{ padding: "6px 8px", color: TEXT }}>{a.nameEs}</td>
                  <td style={{ padding: "6px 8px", color: a.status === "official-vector" ? "#16a34a" : "#b45309", fontSize: 10 }}>
                    {a.status === "official-vector" ? "Vector oficial" : "Solo imagen"}
                  </td>
                  <td style={{ padding: "6px 8px", color: TEXT }}>{a.metrics?.features ?? 0}</td>
                  <td style={{ padding: "6px 8px", color: CDI_DAMAGE_COLORS.destroyed, fontWeight: 700 }}>{a.metrics?.destroyed ?? 0}</td>
                  <td style={{ padding: "6px 8px", color: CDI_DAMAGE_COLORS.damagedConfirmed }}>{a.metrics?.damagedConfirmed ?? 0}</td>
                  <td style={{ padding: "6px 8px", color: CDI_DAMAGE_COLORS.possibleDamage }}>{a.metrics?.possibleDamage ?? 0}</td>
                </tr>
              ))}
              {data.aois.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 16, textAlign: "center", color: MUTED }}>{loading ? "Cargando..." : "Sin datos disponibles."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data.watchlist.length > 0 && (
          <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}90`, marginTop: 10 }}>
            En espera de Copernicus: {data.watchlist.map(w => w.name?.es || w.id).join(", ")}
          </div>
        )}
      </div>

      <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}70`, textAlign: "center" }}>
        Fuente: Crisis Damage Intelligence sobre Copernicus EMSR884 - vectores oficiales + revision IA (VLM) - sin cobertura nacional completa
      </div>
    </div>
  );
}

function MicrosoftAI4GDamage({ mob }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const [points, setPoints] = useState([]);
  const [areaMask, setAreaMask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const dataRes = await fetchTimeout("/data/catia-la-mar-damage.json", 20000);
        if (!dataRes.ok) throw new Error(`HTTP ${dataRes.status}`);
        const json = await dataRes.json();
        if (cancelled) return;
        setPoints(Array.isArray(json.points) ? json.points : []);
        try {
          const areaRes = await fetchTimeout("/data/catia-la-mar-area.geojson", 10000);
          if (areaRes.ok && !cancelled) setAreaMask(await areaRes.json());
        } catch {
          // area outline is decorative only — safe to skip if unavailable
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "No se pudo cargar el dataset estatico.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCSS(LEAFLET_CSS);
    loadScript(LEAFLET_JS).then(() => {
      if (cancelled || !mapRef.current || !window.L || mapInstance.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [10.6, -67.04],
        zoom: mob ? 12 : 14,
        minZoom: 10,
        maxZoom: 18,
        preferCanvas: true,
        zoomControl: true,
        attributionControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      mapInstance.current = map;
      setMapReady(true);
      setTimeout(() => map.invalidateSize(), 120);
    });
    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [mob]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !window.L) return;
    const L = window.L;
    const map = mapInstance.current;
    if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }

    const group = L.layerGroup();
    const visible = showAll ? points : points.filter(p => p[2] > 0 || p[3] === 1);
    visible.forEach(([lat, lng, d10, unknown]) => {
      const marker = L.circleMarker([lat, lng], {
        radius: 2.5,
        stroke: false,
        fillColor: msai4gColor(d10, unknown),
        fillOpacity: 0.85,
      });
      marker.bindPopup(
        `<div style="font-family:monospace;font-size:11px">${unknown ? "Sin dato (cubierto por nubes)" : `Dano estimado: ${Math.round(d10 * 100)}%`}</div>`
      );
      group.addLayer(marker);
    });

    let areaLayer = null;
    if (areaMask) {
      areaLayer = L.geoJSON(areaMask, { style: { color: "#2563eb", weight: 2, fill: false, dashArray: "6 4" } });
      areaLayer.addTo(group);
    }

    group.addTo(map);
    layerRef.current = group;

    if (areaLayer) {
      try {
        const b = areaLayer.getBounds();
        if (b.isValid()) map.fitBounds(b, { padding: [16, 16] });
      } catch {
        // fall back to default center/zoom set at map init
      }
    }
  }, [points, areaMask, showAll, mapReady]);

  const total = points.length;
  const anyDamage = points.filter(p => p[2] > 0).length;
  const highConfidence = points.filter(p => p[2] >= 0.8).length;
  const cloudCovered = points.filter(p => p[3] === 1).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11, fontFamily: font, color: MUTED, lineHeight: 1.6, background: BG2, border: `1px solid ${BORDER}`, padding: 10 }}>
        Modelo de IA (<strong>Microsoft AI for Good Lab</strong>) sobre imagen satelital del 25 jun 2026, cruzado con huellas de edificios de Overture Maps.{" "}
        <strong>Snapshot estatico - no se actualiza.</strong> El propio proveedor advierte problemas de ortorectificacion en la imagen y recomienda usar el umbral de 80%+ como señal de alta confianza, en vez de "algun dano detectado" sin mas.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
        <Kpi label="Edificios analizados" value={loading ? "..." : total} />
        <Kpi label="Con algun dano" value={loading ? "..." : anyDamage} tone="#f97316" />
        <Kpi label="Dano alta confianza (80%+)" value={loading ? "..." : highConfidence} tone="#7f1d1d" />
        <Kpi label="Cubiertos por nubes" value={loading ? "..." : cloudCovered} tone="#6b7280" />
      </div>

      {error && !loading && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: 16, color: "#dc2626", fontFamily: fontSans }}>
          {error}
        </div>
      )}

      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: font, color: MUTED, cursor: "pointer" }}>
        <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} />
        Mostrar todos los edificios analizados (incluye sin dano detectado) - {total} en total
      </label>

      <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 8 }}>
        <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>
          Catia La Mar - dano por edificio{loading ? " - cargando..." : ""}
        </div>
        <div ref={mapRef} style={{ width: "100%", height: mob ? 360 : 520, border: `1px solid ${BORDER}`, background: "#eef1f5", borderRadius: 4 }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
          {MSAI4G_BUCKETS.map(b => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: b.color, display: "inline-block", border: "1px solid #d1d5db" }} />
              {b.label}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#9ca3af", display: "inline-block" }} />
            N/A (nubes)
          </div>
        </div>
      </div>

      <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}70`, textAlign: "center" }}>
        Fuente: Microsoft AI for Good Lab via HDX - "Venezuela Earthquakes: Building Damage Assessment in Catia La Mar" - CC BY - dato estatico (25 jun 2026), sin actualizacion
      </div>
    </div>
  );
}

// ── Datos de referencia estáticos por estado ──────────────────────────────
// GEM: perdida anual promedio historica (USD), leida de seismic_risk_profile_Venezuela.png
// RAPIDA/PNUD (Buro de Crisis): edificios expuestos >=MMI VI y dano economico estimado de ESTE
// sismo (jun 2026), leidos de la app oficial en geosmart.undp.org. Ninguna de las dos fuentes
// tiene API publica — son snapshots estaticos transcritos, no se actualizan solos.
const STATE_REFERENCE_DATA = {
  "Distrito Capital":      { gemAnnualLoss: 3300000, rapidaDamage: 5390.5, rapidaDamageLI: 3773.4, rapidaDamageLS: 7007.7, rapidaPctGDP: 7, rapidaBuildingsExposed: 389860 },
  "Miranda":               { gemAnnualLoss: 6100000, rapidaDamage:  677.7, rapidaDamageLI:  474.4, rapidaDamageLS:  881.1, rapidaPctGDP: 5, rapidaBuildingsExposed: 372391 },
  "Carabobo":              { gemAnnualLoss: 3700000, rapidaDamage:  284.2, rapidaDamageLI:  199.0, rapidaDamageLS:  369.5, rapidaPctGDP: 5, rapidaBuildingsExposed: 297575 },
  "La Guaira":             { gemAnnualLoss:  651700, rapidaDamage:  179.3, rapidaDamageLI:  125.5, rapidaDamageLS:  233.1, rapidaPctGDP: 7, rapidaBuildingsExposed:  44489 },
  "Aragua":                { gemAnnualLoss: 1800000, rapidaDamage:   91.9, rapidaDamageLI:   64.3, rapidaDamageLS:  119.4, rapidaPctGDP: 3, rapidaBuildingsExposed: 265225 },
  "Yaracuy":               { gemAnnualLoss:  709000, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 0, rapidaBuildingsExposed: 187392 },
  "Falcón":                { gemAnnualLoss:  602300, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 0, rapidaBuildingsExposed:  51756 },
  "Cojedes":               { gemAnnualLoss:  159000, rapidaDamage:    3.5, rapidaDamageLI:    2.4, rapidaDamageLS:    4.5, rapidaPctGDP: 2, rapidaBuildingsExposed:  51296 },
  "Lara":                  { gemAnnualLoss: 5100000, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 0, rapidaBuildingsExposed:  25470 },
  "Portuguesa":            { gemAnnualLoss: 1200000, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 0, rapidaBuildingsExposed:   8226 },
  "Guárico":               { gemAnnualLoss:  163500, rapidaDamage:    0.8, rapidaDamageLI:    0.6, rapidaDamageLS:    1.1, rapidaPctGDP: 1, rapidaBuildingsExposed:      1 },
  "Anzoátegui":            { gemAnnualLoss: 1400000, rapidaDamage:    2.3, rapidaDamageLI:    1.6, rapidaDamageLS:    3.0, rapidaPctGDP: 0, rapidaBuildingsExposed:      0 },
  "Barinas":               { gemAnnualLoss:  812400, rapidaDamage:    0.2, rapidaDamageLI:    0.1, rapidaDamageLS:    0.2, rapidaPctGDP: 0, rapidaBuildingsExposed:      0 },
  "Apure":                 { gemAnnualLoss:   27600, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 0, rapidaBuildingsExposed:      0 },
  "Dependencias Federales":{ gemAnnualLoss:     150, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 1, rapidaBuildingsExposed:      0 },
  "Nueva Esparta":         { gemAnnualLoss: 1200000, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 0, rapidaBuildingsExposed:      0 },
  "Sucre":                 { gemAnnualLoss: 5100000, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 0, rapidaBuildingsExposed:      0 },
  "Zulia":                 { gemAnnualLoss: 3200000, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 0, rapidaBuildingsExposed:      0 },
  "Táchira":               { gemAnnualLoss: 3300000, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 0, rapidaBuildingsExposed:      0 },
  "Trujillo":              { gemAnnualLoss: 2000000, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 0, rapidaBuildingsExposed:      0 },
  "Mérida":                { gemAnnualLoss: 5000000, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 0, rapidaBuildingsExposed:      0 },
  "Monagas":               { gemAnnualLoss:  743000, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 0, rapidaBuildingsExposed:      0 },
  "Bolívar":               { gemAnnualLoss:  330000, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 0, rapidaBuildingsExposed:      0 },
  "Amazonas":              { gemAnnualLoss:   92800, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 0, rapidaBuildingsExposed:      0 },
  "Delta Amacuro":         { gemAnnualLoss:   44000, rapidaDamage:    0.0, rapidaDamageLI:    0.0, rapidaDamageLS:    0.0, rapidaPctGDP: 0, rapidaBuildingsExposed:      0 },
};

// Catia La Mar (Microsoft AI4G) solo cubre un sector de La Guaira, no el estado completo —
// se muestra como detalle adicional unicamente en el panel de ese estado, no como columna nacional.
const CATIA_LA_MAR_SUMMARY = { total: 30761, conDano: 9134, altaConfianza: 1989, estado: "La Guaira" };

function rayCastInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeometry(lat, lng, geometry) {
  if (!geometry) return false;
  const polygons = geometry.type === "MultiPolygon" ? geometry.coordinates : [geometry.coordinates];
  for (const poly of polygons) {
    if (poly[0] && rayCastInRing(lng, lat, poly[0])) return true;
  }
  return false;
}

function findStateForPoint(lat, lng, statesGeo) {
  if (!statesGeo || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  for (const feature of statesGeo.features) {
    if (pointInGeometry(lat, lng, feature.geometry)) return feature.properties.name;
  }
  return null;
}

const METRIC_DEFS = {
  vivo: { label: "Severidad en vivo", colorSteps: ["#fee2e2", "#fca5a5", "#f87171", "#ef4444", "#b91c1c"] },
  expuestos: { label: "Edificios expuestos (RAPIDA)", colorSteps: ["#dbeafe", "#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8"] },
  economico: { label: "Dano economico (RAPIDA)", colorSteps: ["#ffedd5", "#fdba74", "#fb923c", "#f97316", "#c2410c"] },
  base: { label: "Riesgo de base (GEM)", colorSteps: ["#ede9fe", "#c4b5fd", "#a78bfa", "#8b5cf6", "#6d28d9"] },
};

function stepColor(value, maxValue, steps) {
  if (!value || value <= 0 || !maxValue || maxValue <= 0) return "#f3f4f6";
  const ratio = Math.sqrt(value / maxValue);
  const idx = Math.min(steps.length - 1, Math.floor(ratio * steps.length));
  return steps[idx];
}

function pointInBounds(lat, lng, bounds) {
  if (!Array.isArray(bounds) || bounds.length !== 2) return false;
  const [a, b] = bounds;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  const minLat = Math.min(a[0], b[0]);
  const maxLat = Math.max(a[0], b[0]);
  const minLng = Math.min(a[1], b[1]);
  const maxLng = Math.max(a[1], b[1]);
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

// Weighted composite: official satellite grading counts most, technical building evaluations
// next, raw citizen report volume least (unverified). If a zone lacks one input entirely,
// its weight is redistributed among whatever inputs ARE available, rather than penalizing
// the zone for a data gap that isn't about actual severity.
function compositeSeverityScore(parts) {
  const available = parts.filter(p => p.value != null);
  if (available.length === 0) return null;
  const totalWeight = available.reduce((s, p) => s + p.weight, 0);
  return available.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight;
}

function SeverityByZone({ buildings, reports, mob }) {
  const [aois, setAois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gemExpanded, setGemExpanded] = useState(true);
  const gemMapRef = useRef(null);
  const gemMapInstance = useRef(null);

  useEffect(() => {
    if (!gemExpanded || gemMapInstance.current || !gemMapRef.current) return;
    let cancelled = false;
    loadCSS(LEAFLET_CSS);
    loadScript(LEAFLET_JS).then(() => {
      if (cancelled || !gemMapRef.current || !window.L || gemMapInstance.current) return;
      const L = window.L;
      const map = L.map(gemMapRef.current, {
        center: [10.4, -67.0],
        zoom: mob ? 6 : 7,
        minZoom: 4,
        maxZoom: 11,
        zoomControl: true,
        attributionControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      const bounds = [[-2, -76], [14, -56]];
      L.imageOverlay("/data/gem-pga-venezuela.png", bounds, { opacity: 0.75, interactive: false }).addTo(map);
      gemMapInstance.current = map;
      setTimeout(() => map.invalidateSize(), 150);
    });
    return () => { cancelled = true; };
  }, [gemExpanded, mob]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchTimeout("/api/gdelt?source=cdi", 20000);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        setAois(Array.isArray(json.aois) ? json.aois.filter(a => a.status === "official-vector") : []);
      } catch (e) {
        if (!cancelled) setError(e.message || "No se pudo cargar Copernicus.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const zones = useMemo(() => {
    return aois.map(aoi => {
      const zoneBuildings = buildings.filter(b => {
        const p = getLatLng(b);
        return p && pointInBounds(p.lat, p.lng, aoi.bounds);
      });
      const zoneReports = reports.filter(r => {
        const p = getLatLng(r);
        return p && pointInBounds(p.lat, p.lng, aoi.bounds);
      });
      const techSevereTotal = zoneBuildings.filter(b => {
        const d = normalizeDamage(b.damage_level);
        return d === "severo" || d === "total";
      }).length;

      const m = aoi.metrics || {};
      const copernicusFeatures = m.features || 0;
      const copernicusSeverity = copernicusFeatures > 0
        ? ((m.destroyed || 0) + (m.damagedConfirmed || 0)) / copernicusFeatures
        : null;
      const technicalSeverity = zoneBuildings.length > 0 ? techSevereTotal / zoneBuildings.length : null;

      return {
        id: aoi.id,
        nameEs: aoi.nameEs,
        copernicusSeverity,
        copernicusFeatures,
        technicalSeverity,
        techEvaluated: zoneBuildings.length,
        reportCount: zoneReports.length,
      };
    });
  }, [aois, buildings, reports]);

  const maxReports = Math.max(1, ...zones.map(z => z.reportCount));

  const scored = useMemo(() => {
    return zones.map(z => {
      const reportNorm = z.reportCount / maxReports;
      const score = compositeSeverityScore([
        { value: z.copernicusSeverity, weight: 0.5 },
        { value: z.technicalSeverity, weight: 0.3 },
        { value: reportNorm, weight: 0.2 },
      ]);
      return { ...z, score };
    }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }, [zones, maxReports]);

  function scoreColor(score) {
    if (score == null) return "#9ca3af";
    if (score >= 0.6) return "#7f1d1d";
    if (score >= 0.35) return "#dc2626";
    if (score >= 0.15) return "#f97316";
    return "#16a34a";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <NationalSeverityMap buildings={buildings} reports={reports} mob={mob} />

      <div style={{ borderTop: `2px solid ${BORDER}`, marginTop: 8, paddingTop: 16, fontSize: 12, fontFamily: font, color: TEXT, fontWeight: 700 }}>
        Detalle adicional: 6 zonas con verificacion satelital Copernicus
      </div>

      <div style={{ fontSize: 11, fontFamily: font, color: MUTED, lineHeight: 1.6, background: BG2, border: `1px solid ${BORDER}`, padding: 10 }}>
        Score compuesto por zona (solo las 6 zonas con vector oficial de Copernicus — datos vivos, comparables entre si). Combina <strong>daño satelital oficial</strong> (peso 50%), <strong>edificios con evaluacion tecnica</strong> (peso 30%) y <strong>volumen de reportes ciudadanos</strong> (peso 20%, normalizado contra la zona con mas reportes). Si a una zona le falta un insumo, su peso se redistribuye entre los insumos disponibles — no se penaliza por vacio de datos.
        Catia La Mar (Microsoft AI4G) queda fuera de este ranking porque es un snapshot estatico del 25 jun, no comparable con zonas que se actualizan en vivo — esa fuente se mantiene en su propia sub-tab.
      </div>

      {loading && (
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 24, textAlign: "center", color: MUTED, fontFamily: font }}>
          Calculando severidad por zona...
        </div>

      )}

      {error && !loading && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: 16, color: "#dc2626", fontFamily: fontSans }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 14 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Zona</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Score compuesto</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Dano satelital oficial</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Edificios eval. tecnica</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>Reportes ciudadanos</th>
                </tr>
              </thead>
              <tbody>
                {scored.map(z => (
                  <tr key={z.id} style={{ borderBottom: `1px solid ${BORDER}30` }}>
                    <td style={{ padding: "8px", color: TEXT, fontWeight: 600 }}>{z.nameEs}</td>
                    <td style={{ padding: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 70, height: 8, background: `${BORDER}`, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${Math.round((z.score ?? 0) * 100)}%`, height: "100%", background: scoreColor(z.score) }} />
                        </div>
                        <span style={{ color: scoreColor(z.score), fontWeight: 700 }}>
                          {z.score != null ? `${Math.round(z.score * 100)}%` : "sin dato"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "8px", color: MUTED }}>
                      {z.copernicusSeverity != null ? `${Math.round(z.copernicusSeverity * 100)}% (${z.copernicusFeatures} estructuras)` : "sin dato"}
                    </td>
                    <td style={{ padding: "8px", color: MUTED }}>
                      {z.technicalSeverity != null ? `${Math.round(z.technicalSeverity * 100)}% (${z.techEvaluated} edificios)` : "sin dato"}
                    </td>
                    <td style={{ padding: "8px", color: MUTED }}>{z.reportCount}</td>
                  </tr>
                ))}
                {scored.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 16, textAlign: "center", color: MUTED }}>Sin zonas con vector oficial disponibles.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 14 }}>
        <div
          onClick={() => setGemExpanded(e => !e)}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        >
          <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Contexto: perfil de riesgo sismico de base — Venezuela (GEM Foundation)
          </div>
          <span style={{ fontSize: 11, fontFamily: font, color: ACCENT }}>{gemExpanded ? "Ocultar ▲" : "Ver perfil ▼"}</span>
        </div>
        <div style={{ fontSize: 11, fontFamily: fontSans, color: MUTED, marginTop: 6, lineHeight: 1.5 }}>
          Amenaza, exposicion y perdida anual promedio estimada por estado — modelo de base (no relacionado a este sismo especifico), simulando 100.000 anos de actividad sismica. Incluye el terremoto de 1812 en La Guaira (M7.7, ~26.000 fallecidos), el peor antecedente historico de la region.
        </div>
        {gemExpanded && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, fontFamily: font, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              Mapa interactivo — aceleracion maxima del suelo (PGA, 475 anos, roca de referencia)
            </div>
            <div ref={gemMapRef} style={{ width: "100%", height: mob ? 280 : 360, border: `1px solid ${BORDER}`, background: "#eef1f5", borderRadius: 4 }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
              {[
                ["<0.05g", "#8fb3ff"],
                ["0.05-0.13g", "#abcf63"],
                ["0.13-0.35g", "#fffa14"],
                ["0.35-0.90g", "#ffa30a"],
                ["0.90g+", "#ff4c00"],
              ].map(([label, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
                  <span style={{ width: 10, height: 10, background: color, display: "inline-block", border: "1px solid #d1d5db" }} />
                  {label}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}90`, marginTop: 6 }}>
              Capa estatica (GEM v2023.1, resolucion ~5.5km) — no se actualiza. Fuente: GEM Foundation, Global Seismic Hazard Map — licencia CC BY-NC-SA 4.0.
            </div>

            <div style={{ fontSize: 10, fontFamily: font, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 16, marginBottom: 6 }}>
              Perfil de riesgo de Venezuela (vista rapida)
            </div>
            <a href="/data/gem-venezuela-risk-profile.png" target="_blank" rel="noreferrer">
              <img
                src="/data/gem-venezuela-risk-profile.png"
                alt="Perfil de riesgo sismico de Venezuela - GEM Foundation"
                style={{ width: "100%", border: `1px solid ${BORDER}`, display: "block" }}
              />
            </a>
            <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}90`, marginTop: 6 }}>
              Clic en la imagen para verla a tamano completo. Fuente: GEM Foundation, Global Seismic Risk Model (v2026.0.0) — licencia CC BY-NC-SA 4.0. No debe usarse para diseno de estructuras sismorresistentes ni decisiones criticas individuales.
            </div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}70`, textAlign: "center" }}>
        Score relativo entre zonas, no una medida absoluta de gravedad humana — uso orientativo para priorizar revision, no para decisiones automatizadas.
      </div>
    </div>
  );
}

const LHASA_BASE = "https://maps.disasters.nasa.gov/ags03/rest/services/NRT/landslide_nowcast/ImageServer";

function buildLhasaImageUrl(bounds, width, height) {
  const params = new URLSearchParams({
    bbox: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
    bboxSR: "4326",
    imageSR: "4326",
    size: `${Math.max(1, Math.round(width))},${Math.max(1, Math.round(height))}`,
    format: "png32",
    transparent: "true",
    renderingRule: JSON.stringify({ rasterFunction: "Landslide_Nowcast_Index" }),
    f: "image",
  });
  return `${LHASA_BASE}/exportImage?${params.toString()}`;
}

function LandslideRisk({ buildings, mob }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const lhasaLayerRef = useRef(null);
  const buildingsLayerRef = useRef(null);
  const msai4gLayerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const [showBuildings, setShowBuildings] = useState(true);
  const [showMsai4g, setShowMsai4g] = useState(true);
  const [msai4gPoints, setMsai4gPoints] = useState([]);
  const [identifyResult, setIdentifyResult] = useState(null);
  const [identifyLoading, setIdentifyLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchTimeout("/data/catia-la-mar-damage.json", 15000)
      .then(res => (res.ok ? res.json() : { points: [] }))
      .then(json => { if (!cancelled) setMsai4gPoints(Array.isArray(json.points) ? json.points : []); })
      .catch(() => { if (!cancelled) setMsai4gPoints([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCSS(LEAFLET_CSS);
    loadScript(LEAFLET_JS).then(() => {
      if (cancelled || !mapRef.current || !window.L || mapInstance.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [10.4, -67.0],
        zoom: mob ? 7 : 8,
        minZoom: 5,
        maxZoom: 16,
        zoomControl: true,
        attributionControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);

      function refreshLhasa() {
        const bounds = map.getBounds();
        const size = map.getSize();
        const url = buildLhasaImageUrl(bounds, size.x, size.y);
        if (lhasaLayerRef.current) map.removeLayer(lhasaLayerRef.current);
        const overlay = L.imageOverlay(url, bounds, { opacity: 0.7, interactive: false, zIndex: 5 });
        overlay.addTo(map);
        lhasaLayerRef.current = overlay;
      }

      map.on("moveend", refreshLhasa);
      map.on("click", async e => {
        setIdentifyLoading(true);
        setIdentifyResult(null);
        try {
          const params = new URLSearchParams({
            source: "lhasa-identify",
            lat: String(e.latlng.lat),
            lng: String(e.latlng.lng),
          });
          const res = await fetchTimeout(`/api/gdelt?${params.toString()}`, 12000);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (json.error) throw new Error(json.error);
          const raw = json?.value;
          const val = raw != null && raw !== "NoData" ? parseInt(raw, 10) : null;
          setIdentifyResult({
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            label: val === 2 ? "Alto" : val === 1 ? "Moderado" : val === 0 ? "Sin senal" : "Sin dato",
            value: val,
          });
        } catch (err) {
          setIdentifyResult({
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            label: "No se pudo consultar",
            value: null,
            errorDetail: err && err.message ? err.message : String(err),
          });
        } finally {
          setIdentifyLoading(false);
        }
      });

      mapInstance.current = map;
      setMapReady(true);
      setTimeout(() => { map.invalidateSize(); refreshLhasa(); }, 150);
    });
    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [mob]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !window.L) return;
    const L = window.L;
    const map = mapInstance.current;
    if (buildingsLayerRef.current) { map.removeLayer(buildingsLayerRef.current); buildingsLayerRef.current = null; }
    if (!showBuildings) return;
    const group = L.layerGroup();
    buildings.forEach(b => {
      const p = getLatLng(b);
      if (!p) return;
      const d = normalizeDamage(b.damage_level);
      group.addLayer(L.circleMarker([p.lat, p.lng], {
        radius: 4,
        stroke: false,
        fillColor: DAMAGE[d]?.color || "#9ca3af",
        fillOpacity: 0.85,
      }).bindPopup(`<div style="font-family:monospace;font-size:11px">Edificio - dano ${DAMAGE[d]?.label || "sin clasificar"}</div>`));
    });
    group.addTo(map);
    buildingsLayerRef.current = group;
  }, [buildings, showBuildings, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !window.L) return;
    const L = window.L;
    const map = mapInstance.current;
    if (msai4gLayerRef.current) { map.removeLayer(msai4gLayerRef.current); msai4gLayerRef.current = null; }
    if (!showMsai4g) return;
    const group = L.layerGroup();
    msai4gPoints.forEach(([lat, lng, d10, unknown]) => {
      if (!(d10 > 0 || unknown === 1)) return;
      group.addLayer(L.circleMarker([lat, lng], {
        radius: 2.2,
        stroke: false,
        fillColor: msai4gColor(d10, unknown),
        fillOpacity: 0.85,
      }));
    });
    group.addTo(map);
    msai4gLayerRef.current = group;
  }, [msai4gPoints, showMsai4g, mapReady]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11, fontFamily: font, color: "#92400e", lineHeight: 1.6, background: "#fffbeb", border: "1px solid #fde68a", padding: 10 }}>
        <strong>Esto mide probabilidad de que la lluvia reciente active un deslizamiento, no confirma que uno haya ocurrido.</strong> Modelo NASA LHASA: combina lluvia satelital (GPM/IMERG, ultimos 7 dias) con susceptibilidad estatica del terreno (pendiente, geologia, fallas, perdida de cobertura forestal). Resolucion ~1km — no resuelve fallas locales a menor escala. Capa global, actualizacion con latencia de ~3h por el proveedor.
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: font, color: MUTED, cursor: "pointer" }}>
          <input type="checkbox" checked={showBuildings} onChange={e => setShowBuildings(e.target.checked)} />
          Edificios con evaluacion tecnica oficial
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: font, color: MUTED, cursor: "pointer" }}>
          <input type="checkbox" checked={showMsai4g} onChange={e => setShowMsai4g(e.target.checked)} />
          Dano detectado - Microsoft AI4G (Catia La Mar)
        </label>
      </div>

      <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 8 }}>
        <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>
          Riesgo de deslizamiento (NASA LHASA) + dano registrado - clic en el mapa para consultar un punto
        </div>
        <div ref={mapRef} style={{ width: "100%", height: mob ? 360 : 520, border: `1px solid ${BORDER}`, background: "#eef1f5", borderRadius: 4 }} />
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#facc15", display: "inline-block" }} />
            Deslizamiento moderado
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#dc2626", display: "inline-block" }} />
            Deslizamiento alto
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
            <span style={{ width: 10, height: 10, borderRadius: 10, background: DAMAGE.total.color, display: "inline-block" }} />
            Edificio dano severo/total
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
            <span style={{ width: 10, height: 10, borderRadius: 10, background: "#7f1d1d", display: "inline-block" }} />
            Catia La Mar - dano 80%+
          </div>
        </div>
      </div>

      <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 12 }}>
        <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
          Punto consultado
        </div>
        {identifyLoading && <div style={{ fontSize: 12, fontFamily: fontSans, color: MUTED }}>Consultando...</div>}
        {!identifyLoading && identifyResult && (
          <div style={{ fontSize: 13, fontFamily: fontSans, color: TEXT }}>
            {formatCoord(identifyResult.lat)}, {formatCoord(identifyResult.lng)} — riesgo de deslizamiento:{" "}
            <strong style={{ color: identifyResult.value === 2 ? "#dc2626" : identifyResult.value === 1 ? "#b45309" : MUTED }}>
              {identifyResult.label}
            </strong>
            {identifyResult.errorDetail && (
              <div style={{ fontSize: 11, fontFamily: font, color: "#dc2626", marginTop: 6, wordBreak: "break-word" }}>
                Detalle: {identifyResult.errorDetail}
              </div>
            )}
          </div>
        )}
        {!identifyLoading && !identifyResult && (
          <div style={{ fontSize: 12, fontFamily: fontSans, color: MUTED }}>Haz clic en cualquier punto del mapa.</div>
        )}
      </div>

      <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}70`, textAlign: "center" }}>
        Fuente: NASA GPM/LHASA Landslide Nowcast (NRT) - edificios: sismovenezuela.org / evaluacion tecnica oficial - Catia La Mar: Microsoft AI for Good Lab via HDX
      </div>
    </div>
  );
}

function NationalSeverityMap({ buildings, reports, mob }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const statesLayerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const [statesGeo, setStatesGeo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metric, setMetric] = useState("vivo");
  const [selectedStateName, setSelectedStateName] = useState(null);
  const [sortKey, setSortKey] = useState("vivo");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    let cancelled = false;
    fetchTimeout("/data/venezuela-states.geojson", 15000)
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(json => { if (!cancelled) setStatesGeo(json); })
      .catch(e => { if (!cancelled) setError(e.message || "No se pudo cargar el mapa de estados."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Agregacion de nuestros datos en vivo por estado real (point-in-polygon contra el GeoJSON)
  const liveByState = useMemo(() => {
    const acc = {};
    if (!statesGeo) return acc;
    statesGeo.features.forEach(f => { acc[f.properties.name] = { reports: 0, buildingsSevere: 0, buildingsTotal: 0 }; });
    reports.forEach(r => {
      const p = getLatLng(r);
      if (!p) return;
      const name = findStateForPoint(p.lat, p.lng, statesGeo);
      if (name && acc[name]) acc[name].reports += 1;
    });
    buildings.forEach(b => {
      const p = getLatLng(b);
      if (!p) return;
      const name = findStateForPoint(p.lat, p.lng, statesGeo);
      if (!name || !acc[name]) return;
      acc[name].buildingsTotal += 1;
      const d = normalizeDamage(b.damage_level);
      if (d === "severo" || d === "total") acc[name].buildingsSevere += 1;
    });
    return acc;
  }, [statesGeo, reports, buildings]);

  // Tabla combinada: las 25 filas, cada fuente en su propia columna, sin fusionar en un score
  const rows = useMemo(() => {
    if (!statesGeo) return [];
    return statesGeo.features.map(f => {
      const name = f.properties.name;
      const ref = STATE_REFERENCE_DATA[name] || { gemAnnualLoss: 0, rapidaDamage: 0, rapidaDamageLI: 0, rapidaDamageLS: 0, rapidaPctGDP: 0, rapidaBuildingsExposed: 0 };
      const live = liveByState[name] || { reports: 0, buildingsSevere: 0, buildingsTotal: 0 };
      const vivoValue = live.reports + live.buildingsSevere * 2;
      return { name, ...ref, ...live, vivoValue };
    });
  }, [statesGeo, liveByState]);

  const maxValues = useMemo(() => ({
    vivo: Math.max(1, ...rows.map(r => r.vivoValue)),
    expuestos: Math.max(1, ...rows.map(r => r.rapidaBuildingsExposed)),
    economico: Math.max(1, ...rows.map(r => r.rapidaDamage)),
    base: Math.max(1, ...rows.map(r => r.gemAnnualLoss)),
  }), [rows]);

  const valueForMetric = (row, m) => (
    m === "vivo" ? row.vivoValue :
    m === "expuestos" ? row.rapidaBuildingsExposed :
    m === "economico" ? row.rapidaDamage :
    row.gemAnnualLoss
  );

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = sortKey === "name" ? a.name : valueForMetric(a, sortKey) ?? valueForMetric(a, "vivo");
      const bv = sortKey === "name" ? b.name : valueForMetric(b, sortKey) ?? valueForMetric(b, "vivo");
      if (sortKey === "name") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  useEffect(() => {
    let cancelled = false;
    loadCSS(LEAFLET_CSS);
    loadScript(LEAFLET_JS).then(() => {
      if (cancelled || !mapRef.current || !window.L || mapInstance.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [8.0, -66.0],
        zoom: mob ? 5 : 6,
        minZoom: 4,
        maxZoom: 10,
        zoomControl: true,
        attributionControl: false,
      });
      mapInstance.current = map;
      setMapReady(true);
      setTimeout(() => map.invalidateSize(), 150);
    });
    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [mob]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !window.L || !statesGeo) return;
    const L = window.L;
    const map = mapInstance.current;
    if (statesLayerRef.current) { map.removeLayer(statesLayerRef.current); statesLayerRef.current = null; }

    const def = METRIC_DEFS[metric];
    const maxV = maxValues[metric];

    const layer = L.geoJSON(statesGeo, {
      style: feature => {
        const row = rows.find(r => r.name === feature.properties.name);
        const value = row ? valueForMetric(row, metric) : 0;
        const selected = selectedStateName === feature.properties.name;
        return {
          fillColor: stepColor(value, maxV, def.colorSteps),
          fillOpacity: 0.85,
          color: selected ? "#111827" : "#ffffff",
          weight: selected ? 2.5 : 1,
        };
      },
      onEachFeature: (feature, lyr) => {
        lyr.on("click", () => setSelectedStateName(feature.properties.name));
        lyr.bindTooltip(feature.properties.name, { sticky: true });
      },
    });
    layer.addTo(map);
    statesLayerRef.current = layer;
    try {
      const b = layer.getBounds();
      if (b.isValid() && !selectedStateName) map.fitBounds(b, { padding: [12, 12] });
    } catch {
      // ignore — keeps default center/zoom if bounds computation fails
    }
  }, [statesGeo, metric, rows, maxValues, selectedStateName, mapReady]);

  const selectedRow = rows.find(r => r.name === selectedStateName) || null;

  function divergenceInfo(row) {
    const liveNorm = row.vivoValue / maxValues.vivo;
    const expectedNorm = row.rapidaBuildingsExposed / maxValues.expuestos;
    if (expectedNorm <= 0) {
      return liveNorm > 0 ? { label: "Evidencia sin expectativa previa de RAPIDA", ratio: null } : { label: "Sin evidencia ni expectativa", ratio: null };
    }
    const ratio = liveNorm / expectedNorm;
    let label;
    if (ratio > 1.3) label = "Mas evidencia en terreno de la esperada";
    else if (ratio < 0.7) label = "Menos evidencia en terreno de la esperada (aun)";
    else label = "Consistente con lo esperado por RAPIDA";
    return { label, ratio };
  }

  function yearsRatioInfo(row) {
    if (!row.gemAnnualLoss || row.rapidaDamage <= 0) return null;
    const years = (row.rapidaDamage * 1000000) / row.gemAnnualLoss;
    return years;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11, fontFamily: font, color: MUTED, lineHeight: 1.6, background: BG2, border: `1px solid ${BORDER}`, padding: 10 }}>
        Cuatro fuentes, cada una midiendo algo distinto — <strong>no se fusionan en un solo score</strong> porque responden preguntas diferentes: <strong>Severidad en vivo</strong> es evidencia directa nuestra (reportes + edificios con dano confirmado, se actualiza solo); <strong>Edificios expuestos</strong> y <strong>Dano economico</strong> son del Buro de Crisis de PNUD (RAPIDA), estimaciones especificas de este sismo (modelo de exposicion sismica y modelo economico CLIMADA, respectivamente) — snapshot del 26 jun, no se actualiza; <strong>Riesgo de base</strong> es GEM, probabilidad de largo plazo (100.000 anos simulados), no relacionada a este evento especifico.
      </div>

      {loading && (
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 24, textAlign: "center", color: MUTED, fontFamily: font }}>
          Cargando limites estatales...
        </div>
      )}
      {error && !loading && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: 16, color: "#dc2626", fontFamily: fontSans }}>{error}</div>
      )}

      {!loading && !error && (
        <>
          <ToggleGroup
            value={metric}
            onChange={setMetric}
            options={Object.entries(METRIC_DEFS).map(([id, d]) => ({ id, label: d.label }))}
          />

          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 340px", gap: 12 }}>
            <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 8 }}>
              <div ref={mapRef} style={{ width: "100%", height: mob ? 400 : 560, border: `1px solid ${BORDER}`, background: "#eef1f5", borderRadius: 4 }} />
            </div>

            <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 14 }}>
              <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                {selectedRow ? selectedRow.name : "Selecciona un estado"}
              </div>
              {selectedRow ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: font, color: MUTED, textTransform: "uppercase" }}>Severidad en vivo</div>
                    <div style={{ fontSize: 13, fontFamily: fontSans, color: TEXT }}>
                      {selectedRow.reports} reportes - {selectedRow.buildingsSevere} edificios severo/total ({selectedRow.buildingsTotal} evaluados)
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: font, color: MUTED, textTransform: "uppercase" }}>Edificios expuestos (RAPIDA)</div>
                    <div style={{ fontSize: 13, fontFamily: fontSans, color: TEXT }}>{selectedRow.rapidaBuildingsExposed.toLocaleString()} edificios a intensidad ≥VI MMI</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: font, color: MUTED, textTransform: "uppercase" }}>Dano economico (RAPIDA)</div>
                    <div style={{ fontSize: 13, fontFamily: fontSans, color: TEXT }}>
                      ${selectedRow.rapidaDamage.toLocaleString()}M (rango ${selectedRow.rapidaDamageLI.toLocaleString()}M-${selectedRow.rapidaDamageLS.toLocaleString()}M) - {selectedRow.rapidaPctGDP}% del PIB estatal
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: font, color: MUTED, textTransform: "uppercase" }}>Riesgo de base (GEM)</div>
                    <div style={{ fontSize: 13, fontFamily: fontSans, color: TEXT }}>${selectedRow.gemAnnualLoss.toLocaleString()} perdida anual promedio historica</div>
                  </div>

                  {(() => {
                    const years = yearsRatioInfo(selectedRow);
                    if (years == null) return null;
                    const extreme = years > 100;
                    return (
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: 8 }}>
                        <div style={{ fontSize: 10, fontFamily: font, color: "#92400e", textTransform: "uppercase" }}>Equivalencia (RAPIDA / GEM)</div>
                        <div style={{ fontSize: 13, fontFamily: fontSans, color: "#92400e", fontWeight: 700 }}>
                          ~{years < 1 ? years.toFixed(2) : Math.round(years).toLocaleString()} anos de perdida anual promedio en un solo evento
                        </div>
                        {extreme && (
                          <div style={{ fontSize: 10, fontFamily: font, color: "#92400e", marginTop: 4 }}>
                            Ratio muy alto — refleja que la perdida anual promedio reparte el riesgo entre muchos escenarios posibles a lo largo del tiempo, mientras este sismo concentro el golpe en este estado. No es un error de calculo.
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {(() => {
                    const div = divergenceInfo(selectedRow);
                    return (
                      <div>
                        <div style={{ fontSize: 10, fontFamily: font, color: MUTED, textTransform: "uppercase" }}>Evidencia en terreno vs. esperado por RAPIDA</div>
                        <div style={{ fontSize: 13, fontFamily: fontSans, color: TEXT }}>
                          {div.label}{div.ratio != null ? ` (${div.ratio.toFixed(1)}x)` : ""}
                        </div>
                      </div>
                    );
                  })()}

                  {selectedRow.name === "La Guaira" && (
                    <div style={{ background: "#f0fdfa", border: "1px solid #99f6e4", padding: 8 }}>
                      <div style={{ fontSize: 10, fontFamily: font, color: "#0f766e", textTransform: "uppercase" }}>Catia La Mar — Microsoft AI4G (detalle, no todo el estado)</div>
                      <div style={{ fontSize: 12, fontFamily: fontSans, color: "#0f766e", marginTop: 2 }}>
                        {CATIA_LA_MAR_SUMMARY.total.toLocaleString()} edificios analizados - {CATIA_LA_MAR_SUMMARY.conDano.toLocaleString()} con dano detectado - {CATIA_LA_MAR_SUMMARY.altaConfianza.toLocaleString()} de alta confianza (≥80%)
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 12, fontFamily: fontSans, color: MUTED, lineHeight: 1.5 }}>
                  Haz clic en un estado del mapa o una fila de la tabla para ver el detalle completo.
                </div>
              )}
            </div>
          </div>

          <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 14 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: font }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
                    {[
                      ["name", "Estado"],
                      ["vivo", "Severidad en vivo"],
                      ["expuestos", "Edificios expuestos"],
                      ["economico", "Dano economico (USD M)"],
                      ["base", "Riesgo de base (USD)"],
                    ].map(([key, label]) => (
                      <th
                        key={key}
                        onClick={() => toggleSort(key)}
                        style={{ padding: "6px 8px", textAlign: "left", color: MUTED, fontWeight: 600, cursor: "pointer" }}
                      >
                        {label}{sortKey === key ? (sortDir === "desc" ? " ▼" : " ▲") : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map(r => (
                    <tr
                      key={r.name}
                      onClick={() => setSelectedStateName(r.name)}
                      style={{ borderBottom: `1px solid ${BORDER}30`, cursor: "pointer", background: selectedStateName === r.name ? `${ACCENT}08` : "transparent" }}
                    >
                      <td style={{ padding: "6px 8px", color: TEXT, fontWeight: 600 }}>{r.name}</td>
                      <td style={{ padding: "6px 8px", color: TEXT }}>{r.reports} rep. / {r.buildingsSevere} edif.</td>
                      <td style={{ padding: "6px 8px", color: TEXT }}>{r.rapidaBuildingsExposed.toLocaleString()}</td>
                      <td style={{ padding: "6px 8px", color: TEXT }}>${r.rapidaDamage.toLocaleString()}M</td>
                      <td style={{ padding: "6px 8px", color: TEXT }}>${r.gemAnnualLoss.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}70`, textAlign: "center" }}>
            Fuentes: GEM Foundation (riesgo de base, estatico) - RAPIDA/Buro de Crisis PNUD via geosmart.undp.org (estimaciones de este sismo, estatico, snapshot 26 jun 2026) - datos en vivo: sismovenezuela.org y evaluacion tecnica oficial
          </div>
        </>
      )}
    </div>
  );
}

function EscombrosMap({ features, counts, vantorDespues, mob }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const escLayerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadCSS(LEAFLET_CSS);
    loadScript(LEAFLET_JS).then(() => {
      if (cancelled || !mapRef.current || !window.L || mapInstance.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [10.595, -67.025],
        zoom: mob ? 13 : 14,
        minZoom: 10,
        maxZoom: 19,
        zoomControl: true,
        attributionControl: false,
      });
      // Imagen satelital post-evento de Vantor como basemap — igual al dashboard de Esri
      if (vantorDespues) {
        L.tileLayer(`${vantorDespues.url}/tile/{z}/{y}/{x}`, {
          maxZoom: vantorDespues.maxZoom || 20,
          maxNativeZoom: vantorDespues.maxZoom || 20,
          opacity: 1,
        }).addTo(map);
      } else {
        // Fallback: satelital de ESRI si no hay Vantor todavía
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          maxZoom: 19,
        }).addTo(map);
      }
      mapInstance.current = map;
      setMapReady(true);
      setTimeout(() => map.invalidateSize(), 150);
    });
    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [mob, vantorDespues]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !window.L || !features.length) return;
    const L = window.L;
    const map = mapInstance.current;
    if (escLayerRef.current) { map.removeLayer(escLayerRef.current); escLayerRef.current = null; }
    const layer = L.geoJSON(
      { type: "FeatureCollection", features },
      {
        style: f => {
          const isPrincipal = String(f.properties?.TipoVia || "").toLowerCase().includes("principal");
          return {
            color: isPrincipal ? "#ff0000" : "#ffaa00",
            weight: isPrincipal ? 2 : 1.5,
            fillColor: isPrincipal ? "#ff0000" : "#ffaa00",
            fillOpacity: 0.5,
            opacity: 1,
          };
        },
        onEachFeature: (f, lyr) => {
          const tipo = f.properties?.TipoVia || "Sin clasificar";
          lyr.bindPopup(`<div style="font-family:monospace;font-size:11px"><strong>Escombro en vía ${tipo}</strong></div>`);
        },
      }
    );
    layer.addTo(map);
    escLayerRef.current = layer;
    try {
      const b = layer.getBounds();
      if (b.isValid()) map.fitBounds(b, { padding: [20, 20] });
    } catch {
      // mantiene el center/zoom inicial
    }
  }, [features, mapReady]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Kpi label="Total bloqueadas" value={counts.total || "—"} tone="#b45309" />
        <Kpi label="Vías principales" value={counts.principal || "—"} tone="#ff0000" />
        <Kpi label="Vías secundarias" value={counts.secundaria || "—"} tone="#ffaa00" />
      </div>

      <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 8 }}>
        <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>
          Escombros en vías — La Guaira (imagen satelital Vantor post-evento)
          {counts.total === 0 && " - cargando datos..."}
        </div>
        <div ref={mapRef} style={{ width: "100%", height: mob ? 400 : 560, border: `1px solid ${BORDER}`, background: "#1a1a2e", borderRadius: 4 }} />
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
            <span style={{ width: 12, height: 12, background: "#ff0000", borderRadius: 2, display: "inline-block", opacity: 0.8 }} />
            Escombro en vía principal
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
            <span style={{ width: 12, height: 12, background: "#ffaa00", borderRadius: 2, display: "inline-block", opacity: 0.8 }} />
            Escombro en vía secundaria
          </div>
        </div>
      </div>

      <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}70`, textAlign: "center" }}>
        Fuente: DRP Venezuela / Esri (disastersesriven.hub.arcgis.com) — datos operativos en vivo, actualizados por equipos en campo. Imagen satelital: Vantor/Maxar Open Data (post-evento 24 jun 2026, estática).
      </div>
    </div>
  );
}

function VantorSwipe({ antes, despues, mob }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const antesLayerRef = useRef(null);
  const despuesLayerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [swipePos, setSwipePos] = useState(50); // % del ancho
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Inicialización del mapa — se monta siempre, independientemente de si ya llegaron los tiles
  useEffect(() => {
    let cancelled = false;
    loadCSS(LEAFLET_CSS);
    loadScript(LEAFLET_JS).then(() => {
      if (cancelled || !mapRef.current || !window.L || mapInstance.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [10.6, -67.04],
        zoom: mob ? 12 : 14,
        minZoom: 10,
        maxZoom: 19,
        zoomControl: true,
        attributionControl: false,
      });
      // Basemap de respaldo (visible hasta que carguen los tiles de Vantor)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      mapInstance.current = map;
      setMapReady(true);
      setTimeout(() => map.invalidateSize(), 150);
    });
    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [mob]);

  // Tiles de Vantor — se agregan cuando llegan (pueden llegar después del mapa)
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !window.L) return;
    const L = window.L;
    const map = mapInstance.current;

    if (despuesLayerRef.current) { map.removeLayer(despuesLayerRef.current); despuesLayerRef.current = null; }
    if (antesLayerRef.current) { map.removeLayer(antesLayerRef.current); antesLayerRef.current = null; }

    if (despues) {
      const dl = L.tileLayer(
        `${despues.url}/tile/{z}/{y}/{x}`,
        { maxZoom: despues.maxZoom || 20, maxNativeZoom: despues.maxZoom || 20, opacity: 1 }
      );
      dl.addTo(map);
      despuesLayerRef.current = dl;
    }
    if (antes) {
      const al = L.tileLayer(
        `${antes.url}/tile/{z}/{y}/{x}`,
        { maxZoom: antes.maxZoom || 20, maxNativeZoom: antes.maxZoom || 20, opacity: 1 }
      );
      al.addTo(map);
      antesLayerRef.current = al;
    }
  }, [antes, despues, mapReady]);

  // Clip del layer "antes" usando CSS clip-path según posición del swipe
  useEffect(() => {
    if (!antesLayerRef.current || !mapRef.current) return;
    const container = antesLayerRef.current.getContainer?.();
    if (container) {
      container.style.clipPath = `inset(0 ${100 - swipePos}% 0 0)`;
    }
  }, [swipePos, mapReady]);

  function handlePointerMove(e) {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    setSwipePos(Math.max(0, Math.min(100, (x / rect.width) * 100)));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, fontFamily: font, color: MUTED, lineHeight: 1.5, background: BG2, border: `1px solid ${BORDER}`, padding: 10 }}>
        Imágenes satelitales de <strong>Vantor (Maxar) Open Data</strong> — programa de datos abiertos para desastres. Arrastra la línea central para comparar <strong>antes</strong> (izquierda) y <strong>después</strong> (derecha) del sismo del 24 jun 2026. Las imágenes son snapshots fijos — no se actualizan.
      </div>

      <div
        ref={containerRef}
        style={{ position: "relative", userSelect: "none" }}
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        onMouseUp={() => setIsDragging(false)}
        onTouchEnd={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div ref={mapRef} style={{ width: "100%", height: mob ? 380 : 540, border: `1px solid ${BORDER}`, background: "#eef1f5", borderRadius: 4 }} />

        {mapReady && (
          <div
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${swipePos}%`,
              transform: "translateX(-50%)",
              width: 3,
              background: "#ffffff",
              boxShadow: "0 0 4px rgba(0,0,0,0.5)",
              cursor: "col-resize",
              zIndex: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 32,
              background: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "#374151", fontWeight: 700,
            }}>⇔</div>
          </div>
        )}

        {mapReady && (
          <>
            <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, fontFamily: font, padding: "4px 8px", zIndex: 501, pointerEvents: "none", borderRadius: 2 }}>
              ANTES (pre-evento)
            </div>
            <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(37,99,235,0.8)", color: "#fff", fontSize: 10, fontFamily: font, padding: "4px 8px", zIndex: 501, pointerEvents: "none", borderRadius: 2 }}>
              DESPUÉS (post-evento)
            </div>
          </>
        )}
      </div>

      {!antes && !despues && (
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 24, textAlign: "center", color: MUTED, fontFamily: font }}>
          Cargando información de tiles de Vantor...
        </div>
      )}

      <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}70`, textAlign: "center" }}>
        Fuente: Vantor/Maxar Open Data via DRP Venezuela (disastersesriven.hub.arcgis.com) — uso libre para respuesta humanitaria
      </div>
    </div>
  );
}

export function TabSismos() {
  const mob = useIsMobile();
  const [data, setData] = useState({
    reports: [],
    acopios: [],
    buildings: [],
    buildingDamageSocial: [],
    casualtiesLatest: null,
    casualtiesHistory: [],
    missingCounts: null,
    counts: { reports: 0, acopios: 0, buildings: 0, damage: {} },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [layerMode, setLayerMode] = useState("all");
  const [mapMode, setMapMode] = useState("points");
  const [period, setPeriod] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [activityLimit, setActivityLimit] = useState(14);
  const [selected, setSelected] = useState(null);
  const [buildingDetails, setBuildingDetails] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportRange, setReportRange] = useState("24h");
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");
  const [reportGenerating, setReportGenerating] = useState(false);
  const [escombros, setEscombros] = useState({ counts: { principal: 0, secundaria: 0, otro: 0, total: 0 }, features: [] });
  const [vantorTiles, setVantorTiles] = useState({ antes: null, despues: null });
  const [subView, setSubView] = useState("principal");
  const [damageProvider, setDamageProvider] = useState("copernicus");
  const [nextRefreshAt, setNextRefreshAt] = useState(null);
  const [now, setNow] = useState(Date.now());

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTimeout("/api/gdelt?source=sismos", 18000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData({
        reports: Array.isArray(json.reports) ? json.reports : [],
        acopios: Array.isArray(json.acopios) ? json.acopios : [],
        buildings: Array.isArray(json.buildings) ? json.buildings : [],
        buildingDamageSocial: Array.isArray(json.buildingDamageSocial) ? json.buildingDamageSocial : [],
        casualtiesLatest: json.casualtiesLatest || null,
        casualtiesHistory: Array.isArray(json.casualtiesHistory) ? json.casualtiesHistory : [],
        missingCounts: json.missingCounts || null,
        counts: json.counts || { reports: 0, acopios: 0, buildings: 0, damage: {} },
        fetchedAt: json.fetchedAt,
      });
      const completedAt = new Date();
      setLastUpdated(completedAt);
      setNextRefreshAt(new Date(completedAt.getTime() + REFRESH_INTERVAL_MS));
    } catch (e) {
      setError(e.message || "No se pudo cargar la data de sismos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Escombros: misma cadencia que data principal (2 min), datos operativos en vivo
  useEffect(() => {
    async function loadEscombros() {
      try {
        const res = await fetchTimeout("/api/gdelt?source=escombros", 15000);
        if (!res.ok) return;
        const json = await res.json();
        if (!json.error) setEscombros({ counts: json.counts, features: Array.isArray(json.features) ? json.features : [] });
      } catch {
        // non-blocking — escombros es complementario, no critico
      }
    }
    loadEscombros();
    const timer = setInterval(loadEscombros, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // Vantor tiles: cache 1h, los tiles no cambian frecuentemente
  useEffect(() => {
    fetchTimeout("/api/gdelt?source=vantor-tiles", 15000)
      .then(res => res.ok ? res.json() : null)
      .then(json => { if (json && !json.error) setVantorTiles({ antes: json.antes, despues: json.despues }); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selected?.type !== "building" || !selected.item?.id || buildingDetails[selected.item.id]) return;
    let cancelled = false;
    setDetailLoading(true);
    fetchTimeout(`/api/gdelt?source=sismoedificiodetalle&building_id=${encodeURIComponent(selected.item.id)}`, 12000)
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (!cancelled && json) {
          setBuildingDetails(prev => ({ ...prev, [selected.item.id]: json }));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => { cancelled = true; };
  }, [selected, buildingDetails]);

  const reportsWithSeverity = useMemo(
    () => data.reports.map(r => ({ ...r, _severity: normalizeSeverity(r.severity) })),
    [data.reports]
  );

  const buildingsWithDamage = useMemo(
    () => data.buildings.map(b => ({ ...b, _damage: normalizeDamage(b.damage_level) })),
    [data.buildings]
  );

  const filteredReports = useMemo(
    () => reportsWithSeverity.filter(item => isInPeriod(itemDate(item), period, customStart, customEnd)),
    [reportsWithSeverity, period, customStart, customEnd]
  );

  const filteredBuildings = useMemo(
    () => buildingsWithDamage.filter(item => isInPeriod(itemDate(item), period, customStart, customEnd)),
    [buildingsWithDamage, period, customStart, customEnd]
  );

  const filteredAcopios = useMemo(
    () => data.acopios.filter(item => isInPeriod(itemDate(item), period, customStart, customEnd)),
    [data.acopios, period, customStart, customEnd]
  );

  const filteredBuildingDamageSocial = useMemo(
    () => data.buildingDamageSocial.filter(item => isInPeriod(itemDate(item), period, customStart, customEnd)),
    [data.buildingDamageSocial, period, customStart, customEnd]
  );

  // ── Conjuntos para el reporte exportable: su propio rango, independiente del filtro de pantalla ──
  const reportReports = useMemo(
    () => reportsWithSeverity.filter(item => isInPeriod(itemDate(item), reportRange, reportFrom, reportTo)),
    [reportsWithSeverity, reportRange, reportFrom, reportTo]
  );
  const reportBuildings = useMemo(
    () => buildingsWithDamage.filter(item => isInPeriod(itemDate(item), reportRange, reportFrom, reportTo)),
    [buildingsWithDamage, reportRange, reportFrom, reportTo]
  );
  const reportAcopios = useMemo(
    () => data.acopios.filter(item => isInPeriod(itemDate(item), reportRange, reportFrom, reportTo)),
    [data.acopios, reportRange, reportFrom, reportTo]
  );
  const reportBuildingDamageSocial = useMemo(
    () => data.buildingDamageSocial.filter(item => isInPeriod(itemDate(item), reportRange, reportFrom, reportTo)),
    [data.buildingDamageSocial, reportRange, reportFrom, reportTo]
  );

  const damageCounts = useMemo(() => filteredBuildings.reduce((acc, building) => {
    acc[building._damage] = (acc[building._damage] || 0) + 1;
    return acc;
  }, { parcial: 0, severo: 0, total: 0 }), [filteredBuildings]);

  function reportRangeLabel() {
    if (reportRange === "24h") return "Ultimas 24 horas";
    if (reportRange === "48h") return "Ultimas 48 horas";
    if (reportRange === "7d") return "Ultimos 7 dias";
    const from = reportFrom ? formatDate(reportFrom) : "?";
    const to = reportTo ? formatDate(reportTo) : "ahora";
    return `${from} - ${to}`;
  }

  function buildReportHtml() {
    const rangeLabel = reportRangeLabel();
    const reportDamage = reportBuildings.reduce((acc, b) => {
      acc[b._damage] = (acc[b._damage] || 0) + 1;
      return acc;
    }, { parcial: 0, severo: 0, total: 0 });

    const row = (cells) => `<tr>${cells.map(c => `<td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;vertical-align:top;">${c}</td>`).join("")}</tr>`;
    const emptyRow = (cols) => `<tr><td colspan="${cols}" style="padding:8px;color:#9ca3af;">Sin registros en este periodo.</td></tr>`;
    const coordsOf = (item) => {
      const p = getLatLng(item);
      return p ? `${formatCoord(p.lat)}, ${formatCoord(p.lng)}` : "-";
    };

    const reportRows = reportReports.slice(0, 200).map(r => row([
      formatDate(itemDate(r)),
      r.place || "Sin ubicacion",
      SEVERITY[r._severity]?.label || "-",
      String(r.note || "").slice(0, 120),
      coordsOf(r),
    ])).join("") || emptyRow(5);

    const buildingRows = reportBuildings.slice(0, 200).map(b => row([
      formatDate(itemDate(b)),
      b.name || "Sin nombre",
      DAMAGE[b._damage]?.label || "-",
      b.address || b.zone || b.city || "-",
      b.is_technically_evaluated ? "Si" : "No",
      coordsOf(b),
    ])).join("") || emptyRow(6);

    const acopioRows = reportAcopios.slice(0, 200).map(a => row([
      formatDate(itemDate(a)),
      a.name || "Centro de acopio",
      String(a.needs || "").slice(0, 120),
      a.contact || "-",
      coordsOf(a),
    ])).join("") || emptyRow(5);

    const socialRows = reportBuildingDamageSocial.slice(0, 200).map(s => row([
      formatDate(itemDate(s)),
      s.place || "-",
      s.damage_type || "-",
      s.confirmations ?? 0,
      coordsOf(s),
    ])).join("") || emptyRow(5);

    const kpis = [
      ["Reportes", reportReports.length],
      ["Edificios", reportBuildings.length],
      ["Acopios", reportAcopios.length],
      ["Dano total", reportDamage.total],
      ["Dano severo", reportDamage.severo],
      ["Dano social (redes)", reportBuildingDamageSocial.length],
    ].map(([label, value]) => `
      <div style="border:1px solid #e5e7eb;padding:8px 12px;min-width:108px;">
        <div style="font-size:9px;text-transform:uppercase;color:#6b7280;">${label}</div>
        <div style="font-size:20px;font-weight:800;color:#111827;">${value}</div>
      </div>`).join("");

    const casualtiesBlock = data.casualtiesLatest ? `
      <div style="background:#fef2f2;border:1px solid #fecaca;padding:10px 14px;margin-bottom:14px;">
        <div style="font-size:10px;text-transform:uppercase;color:#991b1b;font-weight:700;">Cifras confirmadas (ultima lectura disponible, no acotada al periodo)</div>
        <div style="font-size:13px;margin-top:4px;color:#111827;">
          ${data.casualtiesLatest.deaths ?? "-"} muertos · ${data.casualtiesLatest.injured ?? "-"} heridos · ${data.casualtiesLatest.missing ?? "-"} desaparecidos (cifra oficial)
        </div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px;">Fuente: ${data.casualtiesLatest.source_name || "sin especificar"}</div>
      </div>` : "";

    const missingBlock = data.missingCounts ? `
      <div style="background:#f3f4f6;border:1px solid #d1d5db;padding:10px 14px;margin-bottom:14px;">
        <div style="font-size:10px;text-transform:uppercase;color:#374151;font-weight:700;">Registro comunitario de desaparecidos — sin verificar, solo conteo agregado</div>
        <div style="font-size:13px;margin-top:4px;color:#111827;">
          ${data.missingCounts.total ?? "-"} reportados · ${data.missingCounts.sinContacto ?? "-"} sin contacto · ${data.missingCounts.localizado ?? "-"} localizados
        </div>
      </div>` : "";

    return `<div style="font-family:Arial,sans-serif;color:#1f2937;width:760px;">
      <div style="border-bottom:3px solid #7f1d1d;padding-bottom:12px;margin-bottom:18px;">
        <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">PNUD Venezuela · Monitor de Contexto Situacional</div>
        <div style="font-size:20px;font-weight:800;margin-top:4px;color:#111827;">Reporte de Sismos — Impacto y Respuesta</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">Periodo: ${rangeLabel} · Generado: ${formatDate(new Date().toISOString())}</div>
      </div>

      ${casualtiesBlock}
      ${missingBlock}

      <div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;">${kpis}</div>

      <div style="font-size:14px;font-weight:700;margin:16px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;color:#111827;">Reportes ciudadanos (${reportReports.length})</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead><tr style="text-align:left;color:#6b7280;"><th style="padding:4px 6px;">Fecha</th><th style="padding:4px 6px;">Lugar</th><th style="padding:4px 6px;">Severidad</th><th style="padding:4px 6px;">Nota</th><th style="padding:4px 6px;">Coordenadas</th></tr></thead>
        <tbody>${reportRows}</tbody>
      </table>

      <div style="font-size:14px;font-weight:700;margin:16px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;color:#111827;">Edificios afectados (${reportBuildings.length})</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead><tr style="text-align:left;color:#6b7280;"><th style="padding:4px 6px;">Fecha</th><th style="padding:4px 6px;">Nombre</th><th style="padding:4px 6px;">Dano</th><th style="padding:4px 6px;">Direccion</th><th style="padding:4px 6px;">Evaluado</th><th style="padding:4px 6px;">Coordenadas</th></tr></thead>
        <tbody>${buildingRows}</tbody>
      </table>

      <div style="font-size:14px;font-weight:700;margin:16px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;color:#111827;">Acopios (${reportAcopios.length})</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead><tr style="text-align:left;color:#6b7280;"><th style="padding:4px 6px;">Fecha</th><th style="padding:4px 6px;">Nombre</th><th style="padding:4px 6px;">Necesidades</th><th style="padding:4px 6px;">Contacto</th><th style="padding:4px 6px;">Coordenadas</th></tr></thead>
        <tbody>${acopioRows}</tbody>
      </table>

      <div style="font-size:14px;font-weight:700;margin:16px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;color:#111827;">Dano social — corroboracion en redes (${reportBuildingDamageSocial.length})</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead><tr style="text-align:left;color:#6b7280;"><th style="padding:4px 6px;">Fecha</th><th style="padding:4px 6px;">Lugar</th><th style="padding:4px 6px;">Tipo</th><th style="padding:4px 6px;">Confirmaciones</th><th style="padding:4px 6px;">Coordenadas</th></tr></thead>
        <tbody>${socialRows}</tbody>
      </table>

      <div style="text-align:center;font-size:9px;color:#9ca3af;padding:20px 0;text-transform:uppercase;letter-spacing:0.1em;border-top:1px solid #e5e7eb;margin-top:22px;">
        PNUD Venezuela · Monitor de Contexto Situacional · Uso interno · Listas limitadas a 200 registros por seccion
      </div>
    </div>`;
  }

  async function handleGenerateReport() {
    setReportGenerating(true);
    try {
      await Promise.all([
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"),
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
      ]);
      const html = buildReportHtml();
      const container = document.createElement("div");
      container.innerHTML = html;
      container.style.cssText = "position:fixed;top:0;left:0;width:800px;background:#ffffff;z-index:99999;padding:32px;";
      document.body.appendChild(container);
      await new Promise(r => setTimeout(r, 400));
      const canvas = await window.html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      document.body.removeChild(container);
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const ratio = pdfW / canvas.width;
      const scaledH = canvas.height * ratio;
      let yOffset = 0;
      while (yOffset < scaledH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, -yOffset, pdfW, scaledH);
        yOffset += pdfH;
      }
      const rangeSlug = reportRange === "custom" ? "personalizado" : reportRange;
      pdf.save(`Reporte_Sismos_${rangeSlug}_${new Date().toISOString().slice(0, 10)}.pdf`);
      setReportOpen(false);
    } catch (e) {
      console.error("Error generando reporte de sismos:", e);
      alert("No se pudo generar el reporte. Intenta de nuevo.");
    } finally {
      setReportGenerating(false);
    }
  }

  const latestItems = useMemo(() => {
    const includeReports = layerMode === "all" || layerMode === "reports";
    const includeAcopios = layerMode === "all" || layerMode === "acopios";
    const includeBuildings = layerMode === "all" || layerMode === "buildings";
    return [
      ...(includeReports ? filteredReports.map(item => ({ type: "report", item, date: itemDate(item), label: "Reporte" })) : []),
      ...(includeAcopios ? filteredAcopios.map(item => ({ type: "acopio", item, date: itemDate(item), label: "Acopio" })) : []),
      ...(includeBuildings ? filteredBuildings.map(item => ({ type: "building", item, date: itemDate(item), label: "Edificio" })) : []),
      ...(includeBuildings ? filteredBuildingDamageSocial.map(item => ({ type: "buildingSocial", item, date: itemDate(item), label: "Dano (social)" })) : []),
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [filteredReports, filteredAcopios, filteredBuildings, filteredBuildingDamageSocial, layerMode]);

  const visibleActivityItems = useMemo(
    () => latestItems.slice(0, activityLimit),
    [latestItems, activityLimit]
  );

  const selectedId = selected ? `${selected.type}:${selected.item.id}` : null;

  useEffect(() => {
    setActivityLimit(14);
  }, [period, customStart, customEnd, layerMode]);

  useEffect(() => {
    if (!selected) return;
    const source =
      selected.type === "report" ? filteredReports :
      selected.type === "building" ? filteredBuildings :
      selected.type === "buildingSocial" ? filteredBuildingDamageSocial :
      filteredAcopios;
    const visible = source.some(item => item.id === selected.item.id);
    if (!visible && period !== "all") setSelected(null);
  }, [filteredReports, filteredBuildings, filteredAcopios, filteredBuildingDamageSocial, period, selected]);

  const selectedItem = selected?.item;
  const selectedSeverity = selected?.type === "report" ? SEVERITY[normalizeSeverity(selectedItem?.severity)] : null;
  const selectedDamage = selected?.type === "building" ? DAMAGE[normalizeDamage(selectedItem?.damage_level)] : null;
  const selectedPoint = getLatLng(selectedItem);
  const selectedMapsUrl = googleMapsUrl(selectedItem);
  const detail = selected?.type === "building" ? buildingDetails[selected.item.id] : null;

  return (
    <div>
      <style>{`
        .sismo-heat-icon {
          background: transparent !important;
          border: 0 !important;
          filter: blur(7px) saturate(1.8);
          mix-blend-mode: screen;
          pointer-events: none;
        }
        .sismo-heat-icon span {
          display: block;
          border-radius: 999px;
          transform: translateZ(0);
        }
        .sismo-select-halo {
          background: transparent !important;
          border: 0 !important;
          pointer-events: none;
        }
        .sismo-select-ring {
          animation: sismoSelectPulse 1.3s ease-out infinite;
        }
        @keyframes sismoSelectPulse {
          0% { transform: scale(0.55); opacity: 0.9; }
          70% { transform: scale(1.25); opacity: 0.15; }
          100% { transform: scale(1.25); opacity: 0; }
        }
        @keyframes sismoLivePulse {
          0% { opacity: 1; }
          50% { opacity: 0.35; }
          100% { opacity: 1; }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 16 }}>S</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>Sismos - Impacto y respuesta</div>
          <div style={{ fontSize: 12, fontFamily: font, color: MUTED, letterSpacing: "0.1em" }}>
            Terremoto 24 jun 2026 - reportes, acopios y edificios afectados
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontFamily: font, color: MUTED, letterSpacing: "0.06em" }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 7,
              background: loading ? "#f59e0b" : "#16a34a",
              display: "inline-block",
              animation: loading ? "none" : "sismoLivePulse 1.6s ease-in-out infinite",
            }}
          />
          <span>Actualizado {timeAgoFrom(lastUpdated, now)}</span>
          <span style={{ color: `${MUTED}80` }}>· proxima en {countdownTo(nextRefreshAt, now)}</span>
        </div>
        <button
          onClick={loadData}
          style={{
            fontSize: 11,
            fontFamily: font,
            padding: "6px 12px",
            border: `1px solid ${BORDER}`,
            background: "transparent",
            color: MUTED,
            cursor: "pointer",
            letterSpacing: "0.08em",
          }}
        >
          Actualizar
        </button>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setReportOpen(o => !o)}
            style={{
              fontSize: 11,
              fontFamily: font,
              padding: "6px 12px",
              border: `1px solid ${BORDER}`,
              background: reportOpen ? BG3 : "transparent",
              color: TEXT,
              cursor: "pointer",
              letterSpacing: "0.08em",
            }}
          >
            📄 Generar reporte
          </button>
          {reportOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 6px)",
                zIndex: 30,
                background: "#ffffff",
                border: `1px solid ${BORDER}`,
                padding: 12,
                width: 270,
                boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
              }}
            >
              <div style={{ fontSize: 10, fontFamily: font, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Periodo del reporte
              </div>
              <div style={{ display: "flex", gap: 0, border: `1px solid ${BORDER}`, marginBottom: 10 }}>
                {REPORT_RANGES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setReportRange(r.id)}
                    style={{
                      flex: 1,
                      fontSize: 10,
                      fontFamily: font,
                      padding: "6px 4px",
                      border: "none",
                      background: reportRange === r.id ? ACCENT : "transparent",
                      color: reportRange === r.id ? "#ffffff" : MUTED,
                      cursor: "pointer",
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {reportRange === "custom" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                  <label style={{ fontSize: 10, fontFamily: font, color: MUTED, display: "block" }}>
                    Desde
                    <input
                      type="datetime-local"
                      value={reportFrom}
                      onChange={e => setReportFrom(e.target.value)}
                      style={{ width: "100%", marginTop: 3, border: `1px solid ${BORDER}`, padding: "6px 8px", fontFamily: fontSans, fontSize: 12, color: TEXT, boxSizing: "border-box" }}
                    />
                  </label>
                  <label style={{ fontSize: 10, fontFamily: font, color: MUTED, display: "block" }}>
                    Hasta
                    <input
                      type="datetime-local"
                      value={reportTo}
                      onChange={e => setReportTo(e.target.value)}
                      style={{ width: "100%", marginTop: 3, border: `1px solid ${BORDER}`, padding: "6px 8px", fontFamily: fontSans, fontSize: 12, color: TEXT, boxSizing: "border-box" }}
                    />
                  </label>
                </div>
              )}
              <button
                onClick={handleGenerateReport}
                disabled={reportGenerating || (reportRange === "custom" && !reportFrom)}
                style={{
                  width: "100%",
                  fontSize: 11,
                  fontFamily: font,
                  padding: "8px 10px",
                  border: "none",
                  background: reportGenerating ? `${ACCENT}80` : ACCENT,
                  color: "#ffffff",
                  cursor: reportGenerating || (reportRange === "custom" && !reportFrom) ? "default" : "pointer",
                  letterSpacing: "0.08em",
                  opacity: reportRange === "custom" && !reportFrom ? 0.6 : 1,
                }}
              >
                {reportGenerating ? "Generando PDF..." : "Generar PDF"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <ToggleGroup
          value={subView}
          onChange={setSubView}
          options={[
            { id: "principal", label: "Vista principal" },
            { id: "registro", label: "Registro de sismos (USGS+EMSC)" },
            { id: "satelital", label: "Dano satelital (Copernicus)" },
            { id: "severidad", label: "Severidad por zona" },
            { id: "deslizamientos", label: "Riesgo de deslizamientos (NASA)" },
            { id: "escombros", label: "Escombros en vías (La Guaira)" },
          ]}
        />
      </div>

      {subView === "registro" && <QuakeRegistry mob={mob} />}
      {subView === "deslizamientos" && <LandslideRisk buildings={data.buildings} mob={mob} />}
      {subView === "escombros" && <EscombrosMap features={escombros.features} counts={escombros.counts} vantorDespues={vantorTiles.despues} mob={mob} />}
      {subView === "satelital" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ToggleGroup
            value={damageProvider}
            onChange={setDamageProvider}
            options={[
              { id: "copernicus", label: "Copernicus EMSR884 (multi-zona)" },
              { id: "msai4g", label: "Microsoft AI for Good - Catia La Mar" },
              { id: "vantor", label: "Vantor/Maxar — Antes/Después" },
            ]}
          />
          {damageProvider === "copernicus" && <CopernicusDamage mob={mob} />}
          {damageProvider === "msai4g" && <MicrosoftAI4GDamage mob={mob} />}
          {damageProvider === "vantor" && <VantorSwipe antes={vantorTiles.antes} despues={vantorTiles.despues} mob={mob} />}
        </div>
      )}
      {subView === "severidad" && <SeverityByZone buildings={data.buildings} reports={data.reports} mob={mob} />}

      {subView === "principal" && (<>
      {loading && (
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 24, textAlign: "center", color: MUTED, fontFamily: font }}>
          Cargando datos consolidados de sismos...
        </div>
      )}

      {error && !loading && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: 16, color: "#dc2626", fontFamily: fontSans }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.casualtiesLatest && (
            <div style={{ background: "#1f0a0a", border: "1px solid #7f1d1d", padding: "10px 14px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontFamily: font, color: "#fca5a5", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
                Cifras confirmadas
              </span>
              <span style={{ fontSize: 14, fontFamily: fontSans, color: "#ffffff", fontWeight: 800 }}>
                {data.casualtiesLatest.deaths ?? "—"} <span style={{ fontSize: 10, fontWeight: 400, color: "#fca5a5" }}>muertos</span>
              </span>
              {data.casualtiesLatest.injured != null && (
                <span style={{ fontSize: 14, fontFamily: fontSans, color: "#ffffff", fontWeight: 800 }}>
                  {data.casualtiesLatest.injured}+ <span style={{ fontSize: 10, fontWeight: 400, color: "#fca5a5" }}>heridos</span>
                </span>
              )}
              {data.casualtiesLatest.missing != null && (
                <span style={{ fontSize: 14, fontFamily: fontSans, color: "#ffffff", fontWeight: 800 }}>
                  {data.casualtiesLatest.missing} <span style={{ fontSize: 10, fontWeight: 400, color: "#fca5a5" }}>desaparecidos (cifra oficial)</span>
                </span>
              )}
              <span style={{ fontSize: 10, fontFamily: font, color: "#fca5a5cc", marginLeft: "auto" }}>
                {data.casualtiesLatest.source_url ? (
                  <a href={data.casualtiesLatest.source_url} target="_blank" rel="noreferrer" style={{ color: "#fca5a5", textDecoration: "underline" }}>
                    {data.casualtiesLatest.source_name || "Fuente"}
                  </a>
                ) : (data.casualtiesLatest.source_name || "Fuente sin especificar")}
                {data.casualtiesLatest.scraped_at ? ` - ${timeAgoFrom(new Date(data.casualtiesLatest.scraped_at), now)}` : ""}
              </span>
            </div>
          )}

          {data.casualtiesHistory?.length > 1 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 10, fontFamily: font, color: MUTED }}>
              <span style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>Otras fuentes:</span>
              {data.casualtiesHistory.slice(1, 5).map(c => (
                <span key={c.id}>
                  {c.source_name || "Fuente"}: {c.deaths ?? "—"}m / {c.injured ?? "—"}h / {c.missing ?? "—"}d
                </span>
              ))}
            </div>
          )}

          {data.missingCounts && (
            <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontFamily: font, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
                Registro comunitario de desaparecidos (sin verificar)
              </span>
              <span style={{ fontSize: 13, fontFamily: fontSans, color: TEXT, fontWeight: 800 }}>
                {data.missingCounts.total ?? "—"} <span style={{ fontSize: 10, fontWeight: 400, color: MUTED }}>reportados</span>
              </span>
              <span style={{ fontSize: 13, fontFamily: fontSans, color: TEXT, fontWeight: 800 }}>
                {data.missingCounts.sinContacto ?? "—"} <span style={{ fontSize: 10, fontWeight: 400, color: MUTED }}>sin contacto</span>
              </span>
              <span style={{ fontSize: 13, fontFamily: fontSans, color: "#16a34a", fontWeight: 800 }}>
                {data.missingCounts.localizado ?? "—"} <span style={{ fontSize: 10, fontWeight: 400, color: MUTED }}>localizados</span>
              </span>
              <span style={{ fontSize: 10, fontFamily: font, color: `${MUTED}cc`, marginLeft: "auto" }}>
                desaparecidosterremotovenezuela.com - solo conteo agregado, sin datos individuales
              </span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
            <Kpi label="Reportes" value={filteredReports.length} />
            <Kpi label="Edificios" value={filteredBuildings.length} tone="#7f1d1d" />
            <Kpi label="Acopios" value={filteredAcopios.length} tone="#16a34a" />
            <Kpi label="Evaluados" value={filteredBuildings.filter(item => item.is_technically_evaluated).length} tone={ACCENT} />
            <Kpi label="Daño total" value={damageCounts.total} tone={DAMAGE.total.color} />
            <Kpi label="Daño severo" value={damageCounts.severo} tone={DAMAGE.severo.color} />
            <Kpi label="Vías bloqueadas" value={escombros.counts.total > 0 ? escombros.counts.total : "—"} tone="#b45309" />
            <Kpi label="Vías principales" value={escombros.counts.principal > 0 ? escombros.counts.principal : "—"} tone="#dc2626" />
          </div>

          {escombros.counts.total > 0 && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "8px 12px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 11, fontFamily: font }}>
              <span style={{ color: "#92400e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Escombros en vías — La Guaira (en vivo)</span>
              <span style={{ color: "#dc2626" }}>{escombros.counts.principal} vías principales bloqueadas</span>
              <span style={{ color: "#b45309" }}>{escombros.counts.secundaria} vías secundarias bloqueadas</span>
              <span style={{ color: `${MUTED}90`, marginLeft: "auto" }}>DRP Venezuela / Esri — actualización automática</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <ToggleGroup value={layerMode} onChange={setLayerMode} options={LAYERS} />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <ToggleGroup value={period} onChange={setPeriod} options={PERIODS} />
              <ToggleGroup
                value={mapMode}
                onChange={setMapMode}
                options={[
                  { id: "points", label: "Puntos" },
                  { id: "heat", label: "Mapa de calor" },
                ]}
              />
            </div>
          </div>

          {period === "custom" && (
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr auto", gap: 8, alignItems: "end", background: BG2, border: `1px solid ${BORDER}`, padding: 10 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 10, fontFamily: font, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Desde
                <input
                  type="datetime-local"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  style={{ border: `1px solid ${BORDER}`, padding: "7px 9px", fontFamily: fontSans, fontSize: 12, color: TEXT, background: "#ffffff" }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 10, fontFamily: font, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Hasta
                <input
                  type="datetime-local"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  style={{ border: `1px solid ${BORDER}`, padding: "7px 9px", fontFamily: fontSans, fontSize: 12, color: TEXT, background: "#ffffff" }}
                />
              </label>
              <button
                onClick={() => { setCustomStart(""); setCustomEnd(""); }}
                style={{ fontSize: 11, fontFamily: font, padding: "8px 12px", border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, cursor: "pointer", letterSpacing: "0.08em" }}
              >
                Limpiar fechas
              </button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 350px", gap: 12 }}>
            <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 8 }}>
              <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>
                Mapa consolidado - {mapMode === "heat" ? "concentracion de dano y reportes" : "capas georreferenciadas"}
              </div>
              <SismoMap
                reports={filteredReports}
                acopios={filteredAcopios}
                buildings={filteredBuildings}
                buildingDamageSocial={filteredBuildingDamageSocial}
                escombrosFeatures={escombros.features}
                selectedId={selectedId}
                selectedPoint={selectedPoint}
                onSelect={setSelected}
                mob={mob}
                layerMode={layerMode}
                mapMode={mapMode}
              />
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
                {Object.entries(DAMAGE).map(([key, meta]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
                    <span style={{ width: 10, height: 10, borderRadius: 10, background: meta.color, display: "inline-block" }} />
                    Daño {meta.label}
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
                  <span style={{ width: 10, height: 10, borderRadius: 10, background: "#16a34a", display: "inline-block" }} />
                  Acopio
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
                  <span style={{ width: 10, height: 10, borderRadius: 10, background: "#ea580c", display: "inline-block" }} />
                  Dano (redes)
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
                  <span style={{ width: 10, height: 10, borderRadius: 10, background: SEVERITY.high.color, display: "inline-block" }} />
                  Reporte
                </div>
                {escombros.counts.total > 0 && (<>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#dc2626", display: "inline-block" }} />
                    Escombro vía principal
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: font, color: MUTED }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#f97316", display: "inline-block" }} />
                    Escombro vía secundaria
                  </div>
                </>)}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 14 }}>
                <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                  Detalle seleccionado
                </div>
                {selectedItem ? (
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 4 }}>
                      {selectedItem.place || selectedItem.name || (selected.type === "acopio" ? "Centro de acopio" : "Reporte ciudadano")}
                    </div>
                    <div style={{ fontSize: 11, fontFamily: font, color: selectedSeverity?.color || selectedDamage?.color || (selected.type === "buildingSocial" ? "#ea580c" : "#16a34a"), marginBottom: 8 }}>
                      {selected.type === "acopio" && "Acopio / apoyo"}
                      {selected.type === "report" && `Reporte ${selectedSeverity?.label}`}
                      {selected.type === "building" && `Edificio afectado - daño ${selectedDamage?.label}`}
                      {selected.type === "buildingSocial" && "Dano de edificio (corroboracion social)"}
                    </div>

                    {selected.type === "building" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontSize: 12, fontFamily: fontSans, color: MUTED, lineHeight: 1.55 }}>
                          {selectedItem.address || selectedItem.zone || selectedItem.city || "Sin direccion registrada."}
                        </div>
                        {(selectedItem.notes || selectedItem.casualties_notes || selectedItem.trapped_names) && (
                          <div style={{ background: BG3, border: `1px solid ${BORDER}`, padding: 10, fontSize: 12, fontFamily: fontSans, color: TEXT, lineHeight: 1.5 }}>
                            {selectedItem.notes || selectedItem.casualties_notes || selectedItem.trapped_names}
                          </div>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          <div style={{ background: BG3, border: `1px solid ${BORDER}`, padding: 8 }}>
                            <div style={{ fontSize: 9, fontFamily: font, color: MUTED, textTransform: "uppercase" }}>Fotos</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>{mediaCount(selectedItem)}</div>
                          </div>
                          <div style={{ background: BG3, border: `1px solid ${BORDER}`, padding: 8 }}>
                            <div style={{ fontSize: 9, fontFamily: font, color: MUTED, textTransform: "uppercase" }}>Evaluacion</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: selectedItem.is_technically_evaluated ? "#16a34a" : MUTED }}>
                              {selectedItem.is_technically_evaluated ? "Si" : "No"}
                            </div>
                          </div>
                        </div>
                        {detailLoading && <div style={{ fontSize: 11, fontFamily: font, color: MUTED }}>Cargando detalle tecnico...</div>}
                        {detail?.evaluations?.length > 0 && (
                          <div style={{ background: BG3, border: `1px solid ${BORDER}`, padding: 10 }}>
                            <div style={{ fontSize: 10, fontFamily: font, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>Evaluacion tecnica</div>
                            <div style={{ fontSize: 12, fontFamily: fontSans, color: TEXT, lineHeight: 1.5 }}>
                              Habitabilidad: <strong>{detail.evaluations[0].habitability || "Sin dato"}</strong><br />
                              Puntaje: <strong>{detail.evaluations[0].structural_damage_score ?? "Sin dato"}</strong>
                              {detail.evaluations[0].required_actions && <div style={{ marginTop: 5 }}>{detail.evaluations[0].required_actions}</div>}
                            </div>
                          </div>
                        )}
                        {detail?.timeline?.length > 0 && (
                          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}>
                            <div style={{ fontSize: 10, fontFamily: font, color: MUTED, textTransform: "uppercase", marginBottom: 5 }}>Actualizaciones</div>
                            {detail.timeline.slice(0, 3).map(item => (
                              <div key={item.id} style={{ fontSize: 11, fontFamily: fontSans, color: MUTED, lineHeight: 1.45, marginBottom: 5 }}>
                                <strong style={{ color: TEXT }}>{formatDate(item.created_at)}</strong> - {item.status || "estatus"} / {item.damage_level || "daño"}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {selected.type === "buildingSocial" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontSize: 12, fontFamily: fontSans, color: MUTED, lineHeight: 1.55 }}>
                          {selectedItem.damage_type || "Dano reportado en redes"}{selectedItem.affected ? ` - ${selectedItem.affected} afectados` : ""}
                        </div>
                        <div style={{ fontSize: 11, fontFamily: font, color: "#ea580c" }}>
                          {selectedItem.confirmations || 0} confirmaciones (redes sociales)
                        </div>
                        {selectedItem.needs && (
                          <div style={{ background: BG3, border: `1px solid ${BORDER}`, padding: 10, fontSize: 12, fontFamily: fontSans, color: TEXT, lineHeight: 1.5 }}>
                            <strong>Necesidad reportada:</strong> {selectedItem.needs}
                          </div>
                        )}
                      </div>
                    )}

                    {!["building", "buildingSocial"].includes(selected.type) && (
                      <div style={{ fontSize: 12, fontFamily: fontSans, color: MUTED, lineHeight: 1.55 }}>
                        {selectedItem.note || selectedItem.needs || "Sin nota descriptiva."}
                      </div>
                    )}
                    {selectedItem.contact && (
                      <div style={{ marginTop: 8, fontSize: 11, fontFamily: font, color: TEXT }}>
                        Contacto: {selectedItem.contact}
                      </div>
                    )}
                    {selectedPoint && (
                      <div style={{ marginTop: 10, background: BG3, border: `1px solid ${BORDER}`, padding: 9 }}>
                        <div style={{ fontSize: 9, fontFamily: font, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                          Coordenadas
                        </div>
                        <div style={{ fontSize: 12, fontFamily: font, color: TEXT, lineHeight: 1.5 }}>
                          {formatCoord(selectedPoint.lat)}, {formatCoord(selectedPoint.lng)}
                        </div>
                        {selectedMapsUrl && (
                          <a
                            href={selectedMapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: "inline-block", marginTop: 6, fontSize: 11, fontFamily: font, color: ACCENT }}
                          >
                            Abrir en Google Maps
                          </a>
                        )}
                      </div>
                    )}
                    {selectedItem.photo_url && (
                      <a href={selectedItem.photo_url} target="_blank" rel="noreferrer"
                        style={{ display: "inline-block", marginTop: 10, fontSize: 11, fontFamily: font, color: ACCENT }}>
                        Ver foto
                      </a>
                    )}
                    <div style={{ marginTop: 10, fontSize: 10, fontFamily: font, color: `${MUTED}90` }}>
                      {formatDate(selectedItem.created_at || selectedItem.last_updated_at)}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, fontFamily: fontSans, color: MUTED, lineHeight: 1.5 }}>
                    Haz clic en un punto del mapa para ver reporte, edificio afectado, fotos, acopio o evaluacion tecnica disponible.
                  </div>
                )}
              </div>

              <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: 14 }}>
                <div style={{ fontSize: 11, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                  Actividad reciente
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: mob ? 300 : 500, overflowY: "auto" }}>
                  {visibleActivityItems.map(({ type, item, label }) => {
                    const meta = type === "building"
                      ? DAMAGE[normalizeDamage(item.damage_level)]
                      : type === "buildingSocial"
                        ? { label: "Dano social", color: "#ea580c" }
                        : type === "acopio"
                          ? { label: "Acopio", color: "#16a34a" }
                          : SEVERITY[normalizeSeverity(item.severity)];
                    const point = getLatLng(item);
                    const mapsUrl = googleMapsUrl(item);
                    return (
                      <div
                        key={`${type}:${item.id}`}
                        style={{
                          border: `1px solid ${selectedId === `${type}:${item.id}` ? meta.color : BORDER}`,
                          background: selectedId === `${type}:${item.id}` ? BG3 : "#ffffff",
                        }}
                      >
                        <button
                          onClick={() => setSelected({ type, item })}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background: "transparent",
                            padding: "8px 10px",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.place || item.name || "Sin ubicacion"}
                            </span>
                            <span style={{ fontSize: 10, fontFamily: font, color: meta.color }}>{label}</span>
                          </div>
                          <div style={{ fontSize: 10, fontFamily: font, color: MUTED, marginTop: 3 }}>
                            {formatDate(item.created_at || item.last_updated_at)}
                          </div>
                          {point && (
                            <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}CC`, marginTop: 3 }}>
                              {formatCoord(point.lat)}, {formatCoord(point.lng)}
                            </div>
                          )}
                        </button>
                        {mapsUrl && (
                          <div style={{ borderTop: `1px solid ${BORDER}`, padding: "5px 10px 7px" }}>
                            <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ fontSize: 10, fontFamily: font, color: ACCENT }}>
                              Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {latestItems.length === 0 && (
                    <div style={{ fontSize: 12, fontFamily: fontSans, color: MUTED, lineHeight: 1.5, padding: 10, background: "#ffffff", border: `1px solid ${BORDER}` }}>
                      No hay registros para el filtro seleccionado.
                    </div>
                  )}
                  {latestItems.length > visibleActivityItems.length && (
                    <button
                      onClick={() => setActivityLimit(value => value + 25)}
                      style={{ fontSize: 11, fontFamily: font, padding: "8px 10px", border: `1px solid ${BORDER}`, background: BG3, color: TEXT, cursor: "pointer", letterSpacing: "0.08em" }}
                    >
                      Ver mas ({latestItems.length - visibleActivityItems.length})
                    </button>
                  )}
                  {visibleActivityItems.length > 14 && (
                    <button
                      onClick={() => setActivityLimit(14)}
                      style={{ fontSize: 11, fontFamily: font, padding: "7px 10px", border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, cursor: "pointer", letterSpacing: "0.08em" }}
                    >
                      Volver al inicio
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}90`, marginTop: 8 }}>
                  Mostrando {visibleActivityItems.length} de {latestItems.length} registros filtrados
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 10, fontFamily: font, color: `${MUTED}70`, textAlign: "center" }}>
            Datos publicos consolidados - sismovenezuela.org · actualizado {timeAgoFrom(lastUpdated, now)} · proxima actualizacion automatica en {countdownTo(nextRefreshAt, now)}
          </div>
        </div>
      )}
      </>)}
    </div>
  );
}
