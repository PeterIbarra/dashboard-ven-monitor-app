import { getDataFreshness } from "../lib/apiClient.js";

const STATES = {
  fresh: { label:"ACTUALIZADO", color:"#15803d", symbol:"●" },
  stale: { label:"DESACTUALIZADO", color:"#b45309", symbol:"▲" },
  unknown: { label:"SIN FECHA", color:"#64748b", symbol:"○" },
};

function ageLabel(ageMs) {
  if (ageMs == null) return "La fuente no proporciona una fecha verificable";
  const minutes = Math.floor(ageMs / 60000);
  if (minutes < 1) return "Actualizado hace menos de un minuto";
  if (minutes < 60) return `Actualizado hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `Actualizado hace ${hours} h`;
  return `Actualizado hace ${Math.floor(hours / 24)} d`;
}

export function DataFreshnessBadge({ timestamp, payload, maxAgeMs, compact = false, freshLabel }) {
  const freshness = getDataFreshness(timestamp ? { updatedAt:timestamp } : payload, { maxAgeMs });
  const state = STATES[freshness.status];
  const label = freshness.status === "fresh"
    ? (freshLabel || (compact ? "AL DÍA" : state.label))
    : state.label;
  const detail = ageLabel(freshness.ageMs);
  return (
    <span title={detail} aria-label={`${state.label}. ${detail}`} style={{
      display:"inline-flex", alignItems:"center", gap:4, whiteSpace:"nowrap",
      padding:compact?"1px 5px":"2px 7px", border:`1px solid ${state.color}45`,
      background:`${state.color}12`, color:state.color, fontSize:compact?7:8,
      fontFamily:"'Space Mono',monospace", fontWeight:700, letterSpacing:"0.06em",
    }}>
      <span aria-hidden="true">{state.symbol}</span>{label}
    </span>
  );
}
