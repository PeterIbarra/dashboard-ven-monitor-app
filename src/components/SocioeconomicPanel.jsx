import { useState, useEffect } from "react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { BG2, BG3, BORDER, TEXT, MUTED, ACCENT, font } from "../constants";
import { IS_DEPLOYED } from "../utils";

export function SocioeconomicPanel({ mob }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!IS_DEPLOYED) { setLoading(false); return; }
    fetch("/api/socioeconomic", { signal: AbortSignal.timeout(15000) })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Card><div style={{ textAlign:"center", padding:20, fontFamily:font, color:MUTED }}>Cargando datos socioeconómicos...</div></Card>;
  if (!data) return <Card><div style={{ textAlign:"center", padding:20, fontFamily:font, color:MUTED }}>Sin datos disponibles. Solo en producción.</div></Card>;

  const fmt = (v, unit) => {
    if (v == null) return "—";
    if (unit === "USD" && v > 1e9) return `$${(v/1e9).toFixed(1)}B`;
    if (unit === "USD" && v > 1e6) return `$${(v/1e6).toFixed(0)}M`;
    if (unit === "USD") return `$${v.toFixed(0)}`;
    if (unit === "personas" && v > 1e6) return `${(v/1e6).toFixed(1)}M`;
    if (unit === "%") return `${v.toFixed(1)}%`;
    return v.toFixed(1);
  };

  const catLabels = { economia:"📊 Economía", social:"👥 Social", energia:"⚡ Energía", infraestructura:"🔌 Infraestructura" };
  const catColors = { economia:ACCENT, social:"#8b5cf6", energia:"#f59e0b", infraestructura:"#06b6d4" };

  // Mini sparkline for indicator history
  const MiniSpark = ({ history, color }) => {
    if (!history || history.length < 3) return null;
    const vals = history.map(h => h.value);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const w = 80, h = 24;
    const pts = vals.map((v, i) => `${(i/(vals.length-1))*w},${h-((v-min)/range)*h}`).join(" ");
    return <svg width={w} height={h} style={{ display:"block" }}><polyline points={pts} fill="none" stroke={color} strokeWidth={1.2} /></svg>;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Header */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, fontFamily:"'Syne',sans-serif", color:TEXT, textTransform:"uppercase", letterSpacing:"0.05em" }}>
              Indicadores Socioeconómicos — Venezuela
            </div>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED }}>
              World Bank · IMF WEO · UNHCR/R4V · Actualización automática
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <Badge color={ACCENT}>World Bank</Badge>
            <Badge color="#f59e0b">IMF</Badge>
            <Badge color="#8b5cf6">R4V</Badge>
          </div>
        </div>

        {/* Summary KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:8 }}>
          {[
            { label:"PIB", value:fmt(data.summary?.pib, "USD"), color:ACCENT, sub:"USD corrientes" },
            { label:"PIB per cápita", value:fmt(data.summary?.pibPerCapita, "USD"), color:ACCENT, sub:"USD" },
            { label:"Inflación IPC", value:fmt(data.summary?.inflacion, "%"), color:data.summary?.inflacion > 100 ? "#ef4444" : "#f59e0b", sub:"Anual" },
            { label:"Población", value:fmt(data.summary?.poblacion, "personas"), color:"#8b5cf6", sub:"Habitantes" },
            { label:"Crecimiento PIB", value:fmt(data.summary?.crecimiento, "%"), color:data.summary?.crecimiento > 0 ? "#22c55e" : "#ef4444", sub:"Anual" },
            { label:"Desempleo", value:fmt(data.summary?.desempleo, "%"), color:data.summary?.desempleo > 10 ? "#ef4444" : "#f59e0b", sub:"Tasa" },
            { label:"Migración neta", value:fmt(data.summary?.migracion, "personas"), color:"#ef4444", sub:"Personas/año" },
            { label:"Refugiados VEN", value:data.refugees?.total || "7.9M", color:"#8b5cf6", sub:data.refugees?.source || "UNHCR/R4V" },
          ].map((kpi, i) => (
            <div key={i} style={{ background:BG2, border:`1px solid ${BORDER}`, borderTop:`3px solid ${kpi.color}`, padding:mob?"8px":"10px 12px" }}>
              <div style={{ fontSize:8, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>{kpi.label}</div>
              <div style={{ fontSize:mob?16:20, fontWeight:800, color:kpi.color, fontFamily:"'Playfair Display',serif", lineHeight:1, marginTop:2 }}>{kpi.value}</div>
              <div style={{ fontSize:8, fontFamily:font, color:MUTED, marginTop:2 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* IMF Projections */}
      {data.imfProjections && (data.imfProjections.gdpGrowth?.length > 0 || data.imfProjections.inflation?.length > 0) && (
        <Card accent="#f59e0b">
          <div style={{ fontSize:11, fontFamily:font, color:"#f59e0b", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
            📈 Proyecciones FMI (World Economic Outlook)
          </div>
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:12 }}>
            {data.imfProjections.gdpGrowth?.length > 0 && (
              <div>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, marginBottom:4 }}>Crecimiento PIB (%)</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {data.imfProjections.gdpGrowth.map((p, i) => (
                    <div key={i} style={{ textAlign:"center", padding:"4px 8px", background:BG3, border:`1px solid ${BORDER}` }}>
                      <div style={{ fontSize:8, fontFamily:font, color:MUTED }}>{p.year}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:p.value > 0 ? "#22c55e" : "#ef4444", fontFamily:font }}>{p.value?.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.imfProjections.inflation?.length > 0 && (
              <div>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, marginBottom:4 }}>Inflación (%)</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {data.imfProjections.inflation.map((p, i) => (
                    <div key={i} style={{ textAlign:"center", padding:"4px 8px", background:BG3, border:`1px solid ${BORDER}` }}>
                      <div style={{ fontSize:8, fontFamily:font, color:MUTED }}>{p.year}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:p.value > 50 ? "#ef4444" : "#f59e0b", fontFamily:font }}>{p.value?.toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Indicators by category with sparklines */}
      {Object.entries(data.byCategory || {}).map(([catKey, indicators]) => (
        <Card key={catKey} accent={catColors[catKey]}>
          <div style={{ fontSize:11, fontFamily:font, color:catColors[catKey], letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
            {catLabels[catKey] || catKey}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:8 }}>
            {indicators.filter(ind => ind.latest).map((ind, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 8px", background:BG3, border:`1px solid ${BORDER}` }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, fontFamily:font, color:TEXT, fontWeight:600 }}>{ind.label}</div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:4, marginTop:2 }}>
                    <span style={{ fontSize:16, fontWeight:800, color:catColors[catKey], fontFamily:"'Playfair Display',serif" }}>
                      {fmt(ind.latest.value, ind.unit)}
                    </span>
                    <span style={{ fontSize:8, fontFamily:font, color:MUTED }}>({ind.latest.year})</span>
                    {ind.delta != null && (
                      <span style={{ fontSize:9, fontFamily:font, color:ind.delta > 0 ? "#22c55e" : "#ef4444" }}>
                        {ind.delta > 0 ? "▲" : "▼"} {Math.abs(ind.unit === "%" ? ind.delta : ind.delta).toFixed(1)}{ind.unit === "%" ? "pp" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <MiniSpark history={ind.history} color={catColors[catKey]} />
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Sources */}
      <div style={{ fontSize:8, fontFamily:font, color:`${MUTED}50`, textAlign:"center", padding:"4px 0" }}>
        Fuentes: World Bank Open Data (api.worldbank.org) · IMF World Economic Outlook · UNHCR/R4V · Datos anuales, actualización automática · {data.indicators?.length || 0} indicadores · Último fetch: {new Date(data.fetchedAt).toLocaleString("es")}
      </div>
    </div>
  );
}
