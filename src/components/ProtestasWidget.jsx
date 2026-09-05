import { useState } from "react";
import { Card } from "./Card";
import { useIsMobile } from "../hooks/useIsMobile";
import { CONF_SEMANAL } from "../data/weekly.js";
import { BORDER, TEXT, MUTED, font, BG2 } from "../constants";

export function ProtestasWidget({ onOpen }) {
  const mob = useIsMobile();
  const history = CONF_SEMANAL.slice(-6);
  const latest = history.at(-1);
  const [selectedWeek, setSelectedWeek] = useState(latest?.week);
  const [expanded, setExpanded] = useState(false);
  const current = history.find(item => item.week === selectedWeek) || latest;
  const selectedIndex = CONF_SEMANAL.findIndex(item => item.week === current?.week);
  const previous = selectedIndex > 0 ? CONF_SEMANAL[selectedIndex - 1] : null;
  if (!latest || !current) return null;

  const delta = previous?.protestas > 0 ? ((current.protestas - previous.protestas) / previous.protestas) * 100 : null;
  const max = Math.max(...history.map(item => item.protestas), 1);
  const dailyRows = current.dias?.filter(item => !String(item.fecha).includes("–")) || [];
  const peak = current.week === "S31"
    ? current.dias?.find(item => item.fecha === "12 Agosto")
    : dailyRows.reduce((best, item) => item.protestas > (best?.protestas || 0) ? item : best, null);
  const motives = current.motivos || [];
  const demandStats = Object.values(history.reduce((acc, item) => {
    (item.motivos || []).forEach(name => {
      const key = name.toLocaleLowerCase("es");
      if (!acc[key]) acc[key] = { name, weeks:0, active:false };
      acc[key].weeks += 1;
      if (item.week === current.week) acc[key].active = true;
    });
    return acc;
  }, {})).sort((a,b) => Number(b.active) - Number(a.active) || b.weeks - a.weeks || a.name.localeCompare(b.name, "es")).slice(0, mob ? 8 : 10);

  return <Card accent="#dc2626" style={{ padding:0, overflow:"hidden" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, flexWrap:"wrap", padding:"10px 14px", borderBottom:`1px solid ${BORDER}` }}>
      <div>
        <div style={{ fontSize:10, fontFamily:font, color:"#dc2626", letterSpacing:".12em", textTransform:"uppercase", fontWeight:700 }}>Pulso de protestas</div>
        <div style={{ fontSize:9, color:MUTED, marginTop:2 }}>Conflictividad social · semana seleccionada: <b style={{ color:"#dc2626" }}>{current.week} · {current.label}</b></div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
        <span style={{ fontSize:10, color:delta > 0 ? "#dc2626" : "#16a34a", fontFamily:font, fontWeight:800 }}>{current.protestas} protestas · {delta == null ? "sin comparación" : `${delta > 0 ? "▲" : "▼"}${Math.abs(Math.round(delta))}% semanal`}</span>
        <button onClick={()=>setExpanded(value=>!value)} aria-expanded={expanded} style={{ border:`1px solid #dc262650`, background:expanded?"#fee2e2":"#fff", color:"#dc2626", padding:"6px 10px", fontFamily:font, fontSize:9, cursor:"pointer", borderRadius:3 }}>{expanded?"Ocultar ▲":"Desplegar ▼"}</button>
        <button onClick={onOpen} style={{ border:"none", background:"#dc2626", color:"#fff", padding:"6px 10px", fontFamily:font, fontSize:9, cursor:"pointer", borderRadius:3 }}>Ver conflictividad →</button>
      </div>
    </div>

    {expanded && <>
    <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"150px 150px 1fr", minHeight:112 }}>
      <div style={{ padding:"13px 14px", borderRight:`1px solid ${BORDER}`, borderBottom:mob?`1px solid ${BORDER}`:"none" }}>
        <div style={{ fontSize:9, color:MUTED, fontFamily:font, textTransform:"uppercase" }}>Protestas registradas</div>
        <div style={{ fontSize:34, fontWeight:900, color:"#dc2626", fontFamily:font, lineHeight:1.05 }}>{current.protestas}</div>
        <div style={{ fontSize:10, color:delta > 0 ? "#dc2626" : "#16a34a", fontFamily:font, marginTop:4 }}>{delta == null ? "Sin comparación" : `${delta > 0 ? "▲" : "▼"} ${Math.abs(Math.round(delta))}% vs ${previous.short || previous.week}`}</div>
      </div>

      <div style={{ padding:"13px 14px", borderRight:mob?"none":`1px solid ${BORDER}`, borderBottom:mob?`1px solid ${BORDER}`:"none" }}>
        <div style={{ fontSize:9, color:MUTED, fontFamily:font, textTransform:"uppercase" }}>Pico del período</div>
        <div style={{ fontSize:27, fontWeight:900, color:"#f97316", fontFamily:font, lineHeight:1.1 }}>{peak?.protestas || "—"}</div>
        <div style={{ fontSize:9, color:MUTED, marginTop:4 }}>{peak?.fecha || "Sin desglose diario"}</div>
        <div style={{ fontSize:9, color:TEXT, marginTop:3, lineHeight:1.35 }}>{peak ? (current.week === "S31" ? "Coincide con el cierre del diálogo" : peak.exigencias) : "El documento no ofrece desglose diario comparable"}</div>
      </div>

      <div style={{ padding:"11px 14px", gridColumn:mob?"1 / -1":"auto" }}>
        <div style={{ fontSize:9, color:MUTED, fontFamily:font, textTransform:"uppercase", marginBottom:6 }}>Evolución · selecciona una barra o semana</div>
        <div style={{ height:52, display:"flex", alignItems:"flex-end", gap:mob?6:10, borderBottom:`1px solid ${BORDER}` }}>
          {history.map(item => <button key={item.week} type="button" onClick={()=>setSelectedWeek(item.week)} aria-label={`Seleccionar ${item.week}: ${item.protestas} protestas`} title={`Seleccionar ${item.week}: ${item.protestas} protestas`} style={{ flex:1, height:`${Math.max(4,(item.protestas/max)*48)}px`, padding:0, border:item.week===current.week?"1px solid #991b1b":"none", background:item.week===current.week?"#dc2626":"#fca5a5", position:"relative", minWidth:12, cursor:"pointer", boxShadow:item.week===current.week?"0 0 0 2px #fecaca":"none", transition:"all .15s" }}><span style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", fontSize:8, color:item.week===current.week?"#dc2626":MUTED, fontFamily:font, fontWeight:item.week===current.week?800:400 }}>{item.protestas}</span></button>)}
        </div>
        <div style={{ display:"flex", gap:mob?6:10, marginTop:3 }}>{history.map(item => <button key={item.week} type="button" onClick={()=>setSelectedWeek(item.week)} style={{ flex:1, padding:"2px 0", border:"none", background:item.week===current.week?"#fee2e2":"transparent", textAlign:"center", fontSize:8, color:item.week===current.week?"#dc2626":MUTED, fontFamily:font, fontWeight:item.week===current.week?800:400, cursor:"pointer" }}>{item.week}</button>)}</div>
      </div>
    </div>

    <div style={{ padding:"8px 14px", borderTop:`1px solid ${BORDER}`, background:"#fff7ed", display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
      <span style={{ fontSize:9, color:"#9a3412", fontWeight:700, marginRight:3 }}>Demandas de {current.week}:</span>
      {motives.map(item => <span key={item} style={{ fontSize:8, color:"#9a3412", fontFamily:font, padding:"2px 6px", border:"1px solid #fdba7460", background:BG2 }}>{item}</span>)}
      <span style={{ width:"100%", fontSize:9, color:"#7c2d12", lineHeight:1.4 }}><b>Lectura semanal:</b> {current.hecho}</span>
      <span style={{ fontSize:8, color:MUTED, fontFamily:font, marginLeft:"auto" }}>Fuente: registro de conflictividad social · {current.label}</span>
    </div>

    <div style={{ padding:"10px 14px 12px", borderTop:`1px solid ${BORDER}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8, flexWrap:"wrap", marginBottom:8 }}>
        <div style={{ fontSize:9, color:MUTED, fontFamily:font, textTransform:"uppercase" }}>Gráfica de demandas · últimas 6 semanas</div>
        <div style={{ fontSize:8, color:MUTED, fontFamily:font }}>Unidad: semanas con presencia · no número de protestas</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:"6px 18px" }}>
        {demandStats.map(item => <button key={item.name} type="button" onClick={() => {
          const matchingWeek = [...history].reverse().find(week => (week.motivos || []).some(m => m.toLocaleLowerCase("es") === item.name.toLocaleLowerCase("es")));
          if (matchingWeek) setSelectedWeek(matchingWeek.week);
        }} title={`Presente en ${item.weeks} de 6 semanas${item.active ? ` · activa en ${current.week}` : ""}`} style={{ display:"grid", gridTemplateColumns:"minmax(105px,1fr) 2fr 28px", alignItems:"center", gap:7, padding:0, border:"none", background:"transparent", cursor:"pointer", textAlign:"left" }}>
          <span style={{ fontSize:9, color:item.active?"#991b1b":TEXT, fontWeight:item.active?800:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.name}</span>
          <span style={{ height:8, background:"#fee2e2", position:"relative", borderRadius:4, overflow:"hidden" }}><span style={{ display:"block", width:`${(item.weeks/6)*100}%`, height:"100%", background:item.active?"#dc2626":"#fca5a5", borderRadius:4 }} /></span>
          <span style={{ fontSize:9, color:item.active?"#dc2626":MUTED, fontFamily:font, textAlign:"right", fontWeight:700 }}>{item.weeks}/6</span>
        </button>)}
      </div>
      <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:12, fontSize:8, color:MUTED, fontFamily:font }}><span><i style={{ display:"inline-block", width:8, height:8, background:"#dc2626", borderRadius:4, marginRight:4 }} />Presente en {current.week}</span><span><i style={{ display:"inline-block", width:8, height:8, background:"#fca5a5", borderRadius:4, marginRight:4 }} />Presente en otras semanas</span><span>Pulsa una demanda para ir a su corte más reciente</span></div>
    </div>
    </>}
  </Card>;
}
