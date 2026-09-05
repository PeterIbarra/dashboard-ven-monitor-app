import { useState } from "react";
import { Card } from "./Card";
import { useIsMobile } from "../hooks/useIsMobile";
import { BORDER, TEXT, MUTED, ACCENT, font, BG3 } from "../constants";

const indicators = [
  { label:"Fallecidos", value:"6.509", detail:"Balance oficial · 24 ago", color:"#dc2626" },
  { label:"Viviendas evaluadas", value:"60.785", detail:"35.545 habitables · 11.001 alto riesgo", color:"#ca8a04" },
  { label:"Escombros retirados", value:"28,61%", detail:"600.790,70 toneladas", color:"#f97316" },
  { label:"Personas rescatadas", value:"6.462", detail:"reportadas con vida", color:"#7c3aed" },
];

const extendedIndicators = [
  { label:"Atenciones hospitalarias", value:"226.696", detail:"Balance acumulado oficial" },
  { label:"Viviendas afectadas", value:"25.240", detail:"Con uso restringido o alto riesgo" },
  { label:"Viviendas alto riesgo", value:"11.001", detail:"18,1% de las evaluadas" },
  { label:"Viviendas entregadas", value:"377", detail:"≈1,5% de las afectadas" },
  { label:"Ciudad Caribia", value:"1.000", detail:"Viviendas en construcción" },
  { label:"PDNA", value:"Validada", detail:"12 sectores · 20–21 de agosto" },
];

export function EarthquakeIndicatorsWidget({ onOpen }) {
  const mob=useIsMobile();
  const [expanded,setExpanded]=useState(false);
  return <Card accent="#dc2626" style={{ marginBottom:0, padding:0, overflow:"hidden" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, flexWrap:"wrap", padding:"10px 14px", borderBottom:`1px solid ${BORDER}` }}>
      <div><div style={{ fontSize:10, fontFamily:font, color:"#dc2626", letterSpacing:".12em", textTransform:"uppercase", fontWeight:700 }}>Indicadores del Terremoto</div><div style={{ fontSize:9, color:MUTED, marginTop:2 }}>Doble sismo del 24 de junio · corte semanal 21–28 de agosto de 2026</div></div>
      <button onClick={onOpen} style={{ border:"none", background:"#dc2626", color:"#fff", padding:"6px 10px", fontFamily:font, fontSize:9, cursor:"pointer", borderRadius:3 }}>Ver monitor de sismos →</button>
    </div>
    <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)" }}>
      {indicators.map((item,index)=><div key={item.label} style={{ padding:"13px 14px", borderRight:(!mob&&index<3)||(mob&&index%2===0)?`1px solid ${BORDER}`:"none", borderBottom:mob&&index<2?`1px solid ${BORDER}`:"none" }}>
        <div style={{ fontSize:9, color:MUTED, fontFamily:font, textTransform:"uppercase", minHeight:24 }}>{item.label}</div>
        <div style={{ fontSize:mob?22:26, fontWeight:900, color:item.color, fontFamily:font, lineHeight:1.1 }}>{item.value}</div>
        <div style={{ fontSize:9, color:MUTED, marginTop:4 }}>{item.detail}</div>
      </div>)}
    </div>
    <div style={{ padding:"7px 14px", borderTop:`1px solid ${BORDER}`, textAlign:"center" }}><button onClick={()=>setExpanded(v=>!v)} style={{ border:"none", background:"transparent", color:ACCENT, fontFamily:font, fontSize:9, cursor:"pointer" }}>{expanded?"Ocultar indicadores adicionales ▲":"Ver más indicadores ▼"}</button></div>
    {expanded&&<div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(3,1fr)", borderTop:`1px solid ${BORDER}`, background:BG3 }}>{extendedIndicators.map((item,index)=><div key={item.label} style={{ padding:"10px 14px", borderRight:index%3<2&&!mob?`1px solid ${BORDER}`:mob&&index%2===0?`1px solid ${BORDER}`:"none", borderBottom:index<3&&!mob||index<4&&mob?`1px solid ${BORDER}`:"none" }}><div style={{ fontSize:8, color:MUTED, fontFamily:font, textTransform:"uppercase", minHeight:21 }}>{item.label}</div><div style={{ fontSize:18, fontWeight:800, color:TEXT, fontFamily:font }}>{item.value}</div><div style={{ fontSize:8, color:MUTED, marginTop:2 }}>{item.detail}</div></div>)}</div>}
    <div style={{ padding:"8px 14px", borderTop:`1px solid ${BORDER}`, background:"#fff7ed", display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
      <span style={{ fontSize:9, color:"#9a3412", lineHeight:1.45 }}><b>Alerta de reconstrucción:</b> 377 viviendas entregadas equivalen a alrededor de 1,5% de las 25.240 restringidas o en alto riesgo; la PDNA ya fue validada, pero la brecha de ejecución sigue abierta.</span>
      <span style={{ fontSize:8, color:MUTED, fontFamily:font }}>Fuente: Gobierno encargado · corte semanal 21–28 ago 2026</span>
    </div>
  </Card>;
}
