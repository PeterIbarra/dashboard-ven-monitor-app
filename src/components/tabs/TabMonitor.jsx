import { useState } from "react";
import { SCENARIOS } from "../../data/static.js";
import { INDICATORS, SCENARIO_SIGNALS } from "../../data/indicators.js";
import { MONITOR_WEEKS } from "../../data/weekly.js";
import { BORDER, TEXT, MUTED, ACCENT, SC, SEM, font } from "../../constants";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Card } from "../Card";
import { SemDot } from "../SemDot";
import { MonitorNoticias } from "../MonitorNoticias";
import { MonitorFactCheck } from "../MonitorFactCheck";

export function TabMonitor() {
  const mob = useIsMobile();
  const [seccion, setSeccion] = useState("indicadores");
  const [expanded, setExpanded] = useState(null);
  const dims = [...new Set(INDICATORS.map(i=>i.dim))];
  const grouped = dims.map(d => ({ dim:d, icon:INDICATORS.find(i=>i.dim===d).icon, inds:INDICATORS.filter(i=>i.dim===d) }));

  const trendIconMap = { up:"↑", down:"↓", flat:"→", stable:"→" };
  const trendColorMap = { up:"#22c55e", down:"#ef4444", flat:MUTED, stable:MUTED };

  // Count latest semaforos (filter out nulls for new indicators)
  const latest = INDICATORS.map(ind => ind.hist.filter(h => h !== null).pop()).filter(Boolean).map(h => h[0]);
  const indCounts = { green:latest.filter(s=>s==="green").length, yellow:latest.filter(s=>s==="yellow").length, red:latest.filter(s=>s==="red").length };

  // Count scenario signals
  const allSignals = SCENARIO_SIGNALS.flatMap(g => g.signals);
  const sigCounts = { green:allSignals.filter(s=>s.sem==="green").length, yellow:allSignals.filter(s=>s.sem==="yellow").length, red:allSignals.filter(s=>s.sem==="red").length };

  const counts = seccion === "senales" ? sigCounts : indCounts;
  const total = counts.green + counts.yellow + counts.red;

  return (
    <div>
      {/* Header + toggle */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>🚦</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600, color:TEXT }}>Monitor de Señales — {seccion === "senales" ? `${allSignals.length} señales · ${SCENARIO_SIGNALS.length} escenarios` : `${INDICATORS.length} indicadores · ${MONITOR_WEEKS.length} semanas`}</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED }}>Semáforos, umbrales y señales por escenario</div>
        </div>
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}`, flexWrap:"wrap" }}>
          {[{id:"indicadores",label:"Indicadores"},{id:"senales",label:"Señales E1/E2/E3/E4"},{id:"noticias",label:"Noticias"},{id:"factcheck",label:"Verificación"}].map(s => (
            <button key={s.id} onClick={() => setSeccion(s.id)}
              style={{ fontSize:12, fontFamily:font, padding:"6px 14px", border:"none",
                background:seccion===s.id?ACCENT:"transparent", color:seccion===s.id?"#fff":MUTED,
                cursor:"pointer", letterSpacing:"0.08em" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[{label:"Verde",count:counts.green,color:"green",desc:"Estables / confirmados"},
          {label:"Amarillo",count:counts.yellow,color:"yellow",desc:"En monitoreo"},
          {label:"Rojo",count:counts.red,color:"red",desc:"Alerta activa"},
          {label:"Total",count:total,color:ACCENT,desc:seccion==="senales"?`${SCENARIO_SIGNALS.length} escenarios`:`${dims.length} dimensiones`}
        ].map((c,i) => (
          <Card key={i} accent={typeof c.color==="string"&&c.color.startsWith("#")?c.color:SEM[c.color]}>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>{c.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:typeof c.color==="string"&&c.color.startsWith("#")?c.color:SEM[c.color], fontFamily:"'Syne',sans-serif" }}>{c.count}</div>
            <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>{c.desc}</div>
          </Card>
        ))}
      </div>

      {/* ── INDICADORES ── */}
      {seccion === "indicadores" && grouped.map(g => (
        <div key={g.dim} style={{ marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
            <span style={{ fontSize:16 }}>{g.icon}</span>
            <span style={{ fontSize:12, fontWeight:700, fontFamily:"'Syne',sans-serif", color:ACCENT, letterSpacing:"0.1em", textTransform:"uppercase" }}>{g.dim}</span>
            <span style={{ fontSize:12, color:MUTED, marginLeft:"auto" }}>{g.inds.length} indicadores</span>
          </div>
          {/* Column headers */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr auto":"1fr 100px auto 80px 40px", gap:8, padding:"2px 0 6px", borderBottom:`1px solid ${BORDER}30` }}>
            <span style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Indicador</span>
            <span style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Historial</span>
            <span style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Valor actual</span>
            <span style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Estado</span>
            <span style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", textAlign:"center" }}>Tend.</span>
          </div>
          {g.inds.map((ind,j) => {
            const lastEntry = ind.hist.filter(h => h !== null).pop();
            if (!lastEntry) return null;
            const sem = lastEntry[0], trend = lastEntry[1], val = lastEntry[2];
            const isNew = !!ind.addedWeek;
            const isExpanded = expanded === `${g.dim}-${j}`;
            return (
              <div key={j} style={{ borderBottom:`1px solid ${BORDER}30` }}>
                <div style={{ display:"grid", gridTemplateColumns:mob?"1fr auto":"1fr 100px auto 80px 40px", gap:8, padding:"8px 0", alignItems:"center",
                  cursor:"pointer" }} onClick={() => setExpanded(isExpanded ? null : `${g.dim}-${j}`)}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:14, fontWeight:600, color:TEXT }}>{ind.name}</span>
                      <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${SC[ind.esc.charAt(1)]||ACCENT}15`,
                        color:SC[ind.esc.charAt(1)]||ACCENT, border:`1px solid ${SC[ind.esc.charAt(1)]||ACCENT}30`, letterSpacing:"0.08em" }}>
                        {ind.esc}
                      </span>
                      {isNew && <span style={{ fontSize:8, fontFamily:font, padding:"1px 6px", background:"#22c55e18",
                        color:"#16a34a", border:"1px solid #22c55e30", letterSpacing:"0.12em", fontWeight:700 }}>NUEVO</span>}
                    </div>
                  </div>
                  {/* History dots */}
                  <div style={{ display:"flex", gap:3, alignItems:"center" }}>
                    {ind.hist.map((h,k) => (
                      <div key={k} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
                        <div style={{ fontSize:5, color:MUTED, fontFamily:font }}>{MONITOR_WEEKS[k]}</div>
                        {h ? <div style={{ width:7, height:7, borderRadius:"50%", background:SEM[h[0]],
                          boxShadow:k===ind.hist.length-1?`0 0 4px ${SEM[h[0]]}`:"none",
                          opacity:0.4+(k/ind.hist.length)*0.6 }} />
                        : <div style={{ width:7, height:7, borderRadius:"50%", background:`${BORDER}60`, opacity:0.3 }} />}
                      </div>
                    ))}
                  </div>
                  {/* Current value */}
                  <div style={{ fontSize:13, fontFamily:font, color:SEM[sem], maxWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{val}</div>
                  {/* Semaforo */}
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <SemDot color={sem} size={7} />
                    <span style={{ fontSize:12, fontFamily:font, color:SEM[sem] }}>{{green:"Verde",yellow:"Amarillo",red:"Rojo"}[sem]}</span>
                  </div>
                  {/* Trend */}
                  <div style={{ fontSize:16, fontWeight:700, color:trendColorMap[trend], textAlign:"center" }}>
                    {trendIconMap[trend]}
                  </div>
                </div>
                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ padding:"4px 0 12px 16px", borderLeft:`2px solid ${SC[ind.esc.charAt(1)]||ACCENT}30` }}>
                    <div style={{ fontSize:13, color:"#3d4f5f", marginBottom:6 }}>{ind.desc}</div>
                    <div style={{ fontSize:12, fontFamily:font, color:"#a17d08", marginBottom:8, padding:"4px 8px", background:"rgba(234,179,8,0.06)", border:"1px solid rgba(234,179,8,0.15)", display:"inline-block" }}>
                      ⚠ {ind.umbral}
                    </div>
                    <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Historial</div>
                    <div style={{ display:"flex", gap:6 }}>
                      {ind.hist.map((h,k) => (
                        <div key={k} style={{ fontSize:12, padding:"3px 8px", background:`${SEM[h[0]]}10`, border:`1px solid ${SEM[h[0]]}25`,
                          color:SEM[h[0]], fontFamily:font, whiteSpace:"nowrap" }}>
                          <span style={{ color:MUTED, marginRight:4 }}>{MONITOR_WEEKS[k]}</span>{h[2]}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* ── SEÑALES POR ESCENARIO ── */}
      {seccion === "senales" && SCENARIO_SIGNALS.map(group => {
        const sc = SCENARIOS.find(s => s.id === parseInt(group.esc.charAt(1)));
        const gCounts = { green:group.signals.filter(s=>s.sem==="green").length, yellow:group.signals.filter(s=>s.sem==="yellow").length, red:group.signals.filter(s=>s.sem==="red").length };
        return (
          <div key={group.esc} style={{ marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${sc?.color||BORDER}40` }}>
              <span style={{ fontSize:12, fontWeight:700, color:sc?.color, fontFamily:"'Syne',sans-serif" }}>
                {group.esc}: {sc?.name}
              </span>
              <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                {[["green",gCounts.green],["yellow",gCounts.yellow],["red",gCounts.red]].filter(([,c])=>c>0).map(([col,cnt]) => (
                  <span key={col} style={{ fontSize:12, fontFamily:font, color:SEM[col] }}>{cnt} {{green:"✓",yellow:"⚠",red:"✗"}[col]}</span>
                ))}
              </div>
            </div>
            {group.signals.map((sig,i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:mob?"1fr auto":"1fr 180px 80px", gap:8, padding:"6px 0", borderBottom:`1px solid ${BORDER}30`, alignItems:"center" }}>
                <span style={{ fontSize:14, color:TEXT, display:"flex", alignItems:"center", gap:6 }}>
                  {sig.name}
                  {sig.isNew && <span style={{ fontSize:8, fontFamily:font, padding:"1px 6px", background:"#22c55e18",
                    color:"#16a34a", border:"1px solid #22c55e30", letterSpacing:"0.12em", fontWeight:700, flexShrink:0 }}>NUEVO</span>}
                </span>
                <span style={{ fontSize:13, fontFamily:font, color:SEM[sig.sem] }}>{sig.val}</span>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <SemDot color={sig.sem} size={7} />
                  <span style={{ fontSize:12, fontFamily:font, color:SEM[sig.sem] }}>{{green:"Activa",yellow:"Parcial",red:"Bloqueada"}[sig.sem]}</span>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* ── NOTICIAS ── */}
      {seccion === "noticias" && <MonitorNoticias />}

      {/* ── VERIFICACIÓN ── */}
      {seccion === "factcheck" && <MonitorFactCheck />}
    </div>
  );
}
