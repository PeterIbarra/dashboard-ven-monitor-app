import { useEffect, useRef } from "react";
import { VZ_STATE_COORDS } from "../../data/confMensual2026.js";
import { MUTED, font } from "../../constants";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}
function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = href;
  document.head.appendChild(l);
}

export function VenezuelaLeafletMap({ estados, height = 340 }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    loadCSS(LEAFLET_CSS);
    loadScript(LEAFLET_JS).then(() => {
      if (!mapRef.current || !window.L) return;
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }

      const map = window.L.map(mapRef.current, {
        center: [8.0, -66.0],
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      window.L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        maxZoom: 10, minZoom: 5,
      }).addTo(map);

      const maxN = Math.max(...estados.map(e => e.n), 1);

      estados.forEach(est => {
        const coords = VZ_STATE_COORDS[est.e];
        if (!coords || est.n === 0) return;

        const radius = Math.max(8, Math.min(32, (est.n / maxN) * 32));
        const intensity = Math.min(1, est.n / maxN);
        const color = intensity > 0.6 ? "#dc2626" : intensity > 0.3 ? "#ca8a04" : "#0468B1";

        const circle = window.L.circleMarker(coords, {
          radius,
          fillColor: color,
          color: color,
          weight: 1.5,
          opacity: 0.9,
          fillOpacity: 0.35 + intensity * 0.35,
        }).addTo(map);

        circle.bindTooltip(
          `<div style="font-family:${font};font-size:12px;line-height:1.4">` +
          `<strong>${est.e}</strong><br/>` +
          `<span style="font-size:16px;font-weight:700;color:${color}">${est.n}</span> protestas` +
          `</div>`,
          { direction: "top", offset: [0, -radius], className: "leaflet-tooltip-custom" }
        );
      });

      mapInstance.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [estados]);

  return (
    <div>
      <div ref={mapRef} style={{ height, width: "100%", borderRadius: 4, border: "1px solid #e2e8f0" }} />
      <div style={{ fontSize: 9, fontFamily: font, color: MUTED, marginTop: 4, textAlign: "right" }}>
        Tamaño del círculo proporcional al número de protestas · Fuente: OVCS
      </div>
    </div>
  );
}
