import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BORDER } from "../constants";
import { getPrior } from "../lib/iodaElectric";

const GEOJSON_URL = "/data/venezuela-adm1.geojson";

// IODA's "Vargas" is the state now officially named "La Guaira" — the
// boundaries file (geoBoundaries/INE-OCHA) uses the current name.
const NAME_ALIASES = { "la guaira": "vargas" };

function normalize(value = "") {
  const n = value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
  return NAME_ALIASES[n] || n;
}

// Same blending rule as the old point-marker map: electricity takes
// precedence over raw connectivity once a real electric signal shows up,
// so the map reads the same way as the ranking table and detail panel.
function combinedSeverity(r) {
  const connectivity = r.connectivityHealth ?? r.healthPct ?? 100;
  const elecHealth = r.elecHealth ?? 100;
  const prior = getPrior(r.name);
  const elecForColor = r.elecConfidence === "baja" ? Math.max(65, elecHealth) : elecHealth;
  if (prior.tier === 0) return Math.round((connectivity + elecForColor) / 2);
  if (elecForColor < 80) return elecForColor;
  if (elecForColor < 100) return Math.min(elecForColor, connectivity + 15);
  return connectivity;
}

function severityColor(v) {
  return v >= 90 ? "#34d399" : v >= 70 ? "#fbbf24" : v >= 50 ? "#f97316" : "#ef4444";
}

export function IODAChoroplethMap({ regionScores, selectedState, onSelectState }) {
  const mapNode = useRef(null);
  const mapInstance = useRef(null);
  const geoLayer = useRef(null);
  const geojsonRef = useRef(null);

  const byName = useMemo(() => new Map((regionScores || []).map(r => [normalize(r.name), r])), [regionScores]);

  // Fetch the shared state-boundaries GeoJSON once.
  useEffect(() => {
    let cancelled = false;
    fetch(GEOJSON_URL).then(r => r.json()).then(gj => { if (!cancelled) { geojsonRef.current = gj; renderLayer(); } }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderLayer() {
    const geojson = geojsonRef.current;
    if (!geojson || !mapNode.current) return;
    if (!mapInstance.current) {
      const map = L.map(mapNode.current, { zoomControl: true, attributionControl: true, minZoom: 4, maxZoom: 9, scrollWheelZoom: true })
        .setView([7.5, -66.5], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
      mapInstance.current = map;
    }
    const map = mapInstance.current;
    if (geoLayer.current) geoLayer.current.remove();
    const layer = L.geoJSON(geojson, {
      style: feature => {
        const name = feature.properties?.shapeName;
        const datum = byName.get(normalize(name));
        const active = selectedState === name || (datum && selectedState === datum.name);
        return {
          color: active ? "#172033" : "#ffffff",
          weight: active ? 3 : 1,
          fillColor: datum ? severityColor(combinedSeverity(datum)) : "#cbd5e1",
          fillOpacity: selectedState && !active ? 0.42 : 0.8,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const name = feature.properties?.shapeName || "Entidad";
        const datum = byName.get(normalize(name));
        featureLayer.bindTooltip(
          datum
            ? `<strong>${datum.name}</strong><br/>Conectividad: <b>${datum.connectivityHealth ?? datum.healthPct ?? 100}%</b><br/>Electricidad: <b>${datum.elecHealth ?? 100}%</b> ${datum.elecLabel || ""}`
            : `<strong>${name}</strong><br/>Sin datos IODA para esta entidad`,
          { sticky: true, direction: "top" }
        );
        featureLayer.on({
          click: () => { if (datum) onSelectState(datum.name); },
          mouseover: e => e.target.setStyle({ weight: 3, color: "#172033" }),
          mouseout: () => layer.resetStyle(featureLayer),
        });
      },
    }).addTo(map);
    geoLayer.current = layer;
    if (!map._iodaFitted) { map.fitBounds(layer.getBounds(), { padding: [8, 8] }); map._iodaFitted = true; }
  }

  // Re-style whenever scores or selection change (layer already mounted).
  useEffect(() => { renderLayer(); }, [byName, selectedState]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } }, []);

  return <div ref={mapNode} style={{ width: "100%", height: 350, borderRadius: 4, border: `1px solid ${BORDER}`, zIndex: 0 }} />;
}
