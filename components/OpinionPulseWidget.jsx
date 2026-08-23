import { useState } from "react";
import { Card } from "./Card";
import { useIsMobile } from "../hooks/useIsMobile";
import { BORDER, TEXT, MUTED, ACCENT, font } from "../constants";
import { OPINION_SNAPSHOT } from "../data/opinionPublica";

const ActionButton = ({ children, onClick, color=ACCENT }) => <button onClick={onClick} style={{ width:"100%", border:`1px solid ${color}35`, background:`${color}08`, color, padding:"6px 8px", fontFamily:font, fontSize:9, cursor:"pointer", borderRadius:3, textAlign:"left" }}>{children} →</button>;

export function OpinionPulseWidget({ onNavigate }) {
  const mob=useIsMobile();
  const [expanded,setExpanded]=useState(false);
  return <Card accent="#7c3aed" style={{ marginBottom:0, padding:0, overflow:"hidden" }}>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderBottom:`1px solid ${BORDER}`, gap:10, flexWrap:"wrap" }}>
      <div><div style={{ fontSize:10, fontFamily:font, color:"#7c3aed", textTransform:"uppercase", letterSpacing:".12em", fontWeight:700 }}>Pulso de Opinión Pública</div><div style={{ fontSize:9, color:MUTED, marginTop:2 }}>Último corte: {OPINION_SNAPSHOT.period} · fuentes múltiples</div></div>
      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
        <span style={{ fontSize:10, color:"#7c3aed", fontFamily:font, fontWeight:800 }}>Brecha de liderazgos: 110 puntos</span>
        <button onClick={()=>setExpanded(value=>!value)} aria-expanded={expanded} style={{ border:"1px solid #7c3aed50", background:expanded?"#f5f3ff":"#fff", color:"#7c3aed", padding:"6px 10px", fontFamily:font, fontSize:9, cursor:"pointer", borderRadius:3 }}>{expanded?"Ocultar ▲":"Desplegar ▼"}</button>
        <button onClick={()=>onNavigate("panorama")} style={{ border:"none", background:ACCENT, color:"#fff", padding:"6px 10px", fontFamily:font, fontSize:9, cursor:"pointer", borderRadius:3 }}>Ver panorama completo →</button>
      </div>
    </div>
    {expanded && <>
    <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr" }}>
      <div style={{ padding:"13px 14px", borderRight:mob?"none":`1px solid ${BORDER}`, borderBottom:mob?`1px solid ${BORDER}`:"none" }}>
        <div style={{ fontSize:9, color:MUTED, fontFamily:font, textTransform:"uppercase", marginBottom:8 }}>Brecha de liderazgos</div>
        <div style={{ display:"flex", justifyContent:"space-between", gap:8, fontSize:11, marginBottom:4 }}><span>María Corina Machado</span><b style={{ color:"#2d8a30", whiteSpace:"nowrap" }}>+58 pp</b></div>
        <div style={{ display:"flex", justifyContent:"space-between", gap:8, fontSize:11, marginBottom:8 }}><span>Delcy Rodríguez</span><b style={{ color:"#dc2626", whiteSpace:"nowrap" }}>−52 pp</b></div>
        <div style={{ background:"#f5f3ff", border:"1px solid #7c3aed22", padding:"6px 8px", marginBottom:9 }}><span style={{ fontSize:9, color:MUTED }}>Brecha neta</span><div style={{ fontSize:22, fontWeight:900, color:"#7c3aed", lineHeight:1.05 }}>110 puntos</div></div>
        <ActionButton onClick={()=>onNavigate("liderazgo")} color="#7c3aed">Ver liderazgos</ActionButton>
      </div>
      <div style={{ padding:"13px 14px", borderRight:mob?"none":`1px solid ${BORDER}`, borderBottom:mob?`1px solid ${BORDER}`:"none" }}>
        <div style={{ fontSize:9, color:MUTED, fontFamily:font, textTransform:"uppercase", marginBottom:8 }}>Percepción post-terremoto</div>
        {[{l:"Respuesta negativa",v:"91,6%",c:"#dc2626"},{l:"Crisis habitacional",v:"64%",c:"#ca8a04"},{l:"Solidaridad ciudadana",v:"90,3%",c:"#2d8a30"}].map(x=><div key={x.l} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"4px 0", borderBottom:`1px solid ${BORDER}80` }}><span>{x.l}</span><b style={{ color:x.c }}>{x.v}</b></div>)}
        <div style={{ height:9 }} />
        <ActionButton onClick={()=>onNavigate("terremoto")} color="#dc2626">Ver impacto del terremoto</ActionButton>
      </div>
      <div style={{ padding:"13px 14px" }}>
        <div style={{ fontSize:9, color:MUTED, fontFamily:font, textTransform:"uppercase", marginBottom:8 }}>Confianza institucional</div>
        <div style={{ display:"flex", alignItems:"baseline", gap:6 }}><span style={{ fontSize:30, fontWeight:900, color:"#dc2626" }}>94,1%</span><span style={{ fontSize:9, color:MUTED }}>desconfía</span></div>
        <div style={{ height:7, background:"#e7ebf0", borderRadius:5, overflow:"hidden", margin:"5px 0 7px" }}><div style={{ width:"94.1%", height:"100%", background:"#dc2626" }} /></div>
        <div style={{ fontSize:10, color:TEXT, lineHeight:1.45, marginBottom:9 }}>La credibilidad de la información oficial se encuentra en nivel crítico.</div>
        <ActionButton onClick={()=>onNavigate("instituciones")} color="#dc2626">Ver confianza y ánimo</ActionButton>
      </div>
    </div>
    <div style={{ padding:"8px 14px", background:"#f8fafc", borderTop:`1px solid ${BORDER}`, display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}><span style={{ fontSize:9, color:MUTED, lineHeight:1.45 }}>La legitimidad social se distancia de la representación formal, mientras la solidaridad contiene parcialmente el deterioro de confianza posterior al terremoto.</span><span style={{ fontSize:8, color:MUTED, fontFamily:font }}>Indicadores de encuestas diferentes · no constituyen un índice agregado</span></div>
    </>}
  </Card>;
}
