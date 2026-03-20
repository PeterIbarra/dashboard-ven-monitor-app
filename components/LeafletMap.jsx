import { useEffect, useRef } from "react";
import { BORDER, font } from "../constants";
import { loadScript, loadCSS } from "../utils";

export function LeafletMap({ events, EC, TR }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef(null);

  // Load Leaflet CSS + JS from CDN (deduped)
  useEffect(() => {
    loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
    loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js").then(() => initMap());

    function initMap() {
      if (!mapRef.current || mapInstance.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true }).setView([7.5, -66.5], 6);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 18,
      }).addTo(map);
      mapInstance.current = map;
      addMarkers(map, L);
    }

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, []);

  // Update markers when events change
  useEffect(() => {
    if (mapInstance.current && window.L) addMarkers(mapInstance.current, window.L);
  }, [events]);

  function addMarkers(map, L) {
    if (markersRef.current) map.removeLayer(markersRef.current);
    const group = L.layerGroup();
    events.forEach(e => {
      const lat = parseFloat(e.latitude), lng = parseFloat(e.longitude);
      if (!lat || !lng) return;
      const fatal = parseInt(e.fatalities) || 0;
      const r = fatal > 5 ? 10 : fatal > 0 ? 6 : 4;
      const color = EC[e.event_type] || "#0A97D9";
      const circle = L.circleMarker([lat, lng], {
        radius: r, fillColor: color, color: color, weight: 1, opacity: 0.8, fillOpacity: 0.5,
      });
      circle.bindPopup(
        `<div style="font-family:monospace;font-size:11px;max-width:250px">` +
        `<b>${e.event_date}</b><br>` +
        `<span style="color:${color};font-weight:bold">${TR[e.sub_event_type]||TR[e.event_type]||e.sub_event_type||e.event_type}</span><br>` +
        `📍 ${e.location}${e.admin1 ? `, ${e.admin1}` : ""}<br>` +
        (fatal > 0 ? `💀 <b>${fatal} fatalidades</b><br>` : "") +
        (e.actor1 ? `👤 ${e.actor1}<br>` : "") +
        `<div style="margin-top:4px;font-size:10px;color:#888">${(e.notes || "").slice(0, 150)}${(e.notes || "").length > 150 ? "..." : ""}</div>` +
        `</div>`,
        { maxWidth: 280 }
      );
      group.addLayer(circle);
    });
    group.addTo(map);
    markersRef.current = group;
  }

  return <div ref={mapRef} style={{ width: "100%", height: typeof window !== "undefined" && window.innerWidth < 768 ? 300 : 450, border: `1px solid ${BORDER}`, background: "#eef1f5", borderRadius:6 }} />;
}
