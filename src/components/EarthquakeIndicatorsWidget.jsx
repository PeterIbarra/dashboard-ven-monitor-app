import { useState } from "react";
import { Card } from "./Card";
import { useIsMobile } from "../hooks/useIsMobile";
import { BORDER, TEXT, MUTED, ACCENT, font } from "../constants";

const indicators = [
  { label:"Fallecidos", value:"6.125", detail:"Balance oficial · 3 ago", color:"#dc2626" },
  { label:"Viviendas afectadas", value:"41.624", detail:"de 43.679 evaluadas", color:"#ca8a04" },
  { label:"Escombros retirados", value:"16,51%", detail:"del total estimado", color:"#f97316" },
  { label:"Desaparecidos", value:"157 / 1.338", detail:"Nacional / La Guaira", color:"#7c3aed" },
];

const extendedIndicators = [
  { label:"Heridos", value:"16.740", detail:"Último balance desagregado disponible" },
  { label:"Personas en campamentos", value:"≈24.477", detail:"107 campamentos transitorios" },
  { label:"Niños fuera de las aulas", value:"≈24.000", detail:"Consecuencia de la emergencia" },
  { label:"Viviendas en construcción", value:"1.875", detail:"Para familias damnificadas" },
  { label:"Necesidad habitacional", value:"≥25.000", detail:"Frente a meta oficial de 4.000" },
  { label:"Pista principal de Maiquetía", value:"3 nov", detail:"Fecha prevista de reapertura" },
];

export function EarthquakeIndicatorsWidget({ onOpen }) {
  const mob=useIsMobile();
  const [expanded,setExpanded]=useState(false);
  return <Card accent="#dc2626" style={{ marginBottom:0, padding:0, overflow:"hidden" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, flexWrap:"wrap", padding:"10px 14px", borderBottom:`1px solid ${BORDER}` }}>
      <div><div style={{ fontSize:10, fontFamily:font, color:"#dc2626", letterSpacing:".12em", textTransform:"uppercase", fontWeight:700 }}>Indicadores del Terremoto</div><div style={{ fontSize:9, color:MUTED, marginTop:2 }}>Doble sismo del 24 de junio · corte semanal 03–07 de agosto de 2026</div></div>
      <button onClick={onOpen} style={{ border:"none", background:"#dc2626", color:"#fff", padding:"6px 10px", fontFamily:font, fontSize:9, cursor:"pointer", borderRadius:3 }}>Ver monitor de sismos →</button>
    </div>
    <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)" }}>
      {indicators.map((item,index)=><div key={item.label} style={{ padding:"13px 14px", borderRight:(!mob&&index<3)||(mob&&index%2===0)?`1px solid ${BORDER}`:"none", borderBottom:mob&&index<2?`1px solid ${BORDER}`:"none" }}>
        <div style={{ fontSize:9, color:MUTED, fontFamily:font, textTransform:"uppercase", minHeight:24 }}>{item.label}</div>
        <div style={{ fontSize:mob?22:26, fontWeight:900, color:item.color, lineHeight:1.1 }}>{item.value}</div>
        <div style={{ fontSize:9, color:MUTED, marginTop:4 }}>{item.detail}</div>
      </div>)}
    </div>
    <div style={{ padding:"7px 14px", borderTop:`1px solid ${BORDER}`, textAlign:"center" }}><button onClick={()=>setExpanded(v=>!v)} style={{ border:"none", background:"transparent", color:ACCENT, fontFamily:font, fontSize:9, cursor:"pointer" }}>{expanded?"Ocultar indicadores adicionales ▲":"Ver más indicadores ▼"}</button></div>
    {expanded&&<div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(3,1fr)", borderTop:`1px solid ${BORDER}`, background:"#f8fafc" }}>{extendedIndicators.map((item,index)=><div key={item.label} style={{ padding:"10px 14px", borderRight:index%3<2&&!mob?`1px solid ${BORDER}`:mob&&index%2===0?`1px solid ${BORDER}`:"none", borderBottom:index<3&&!mob||index<4&&mob?`1px solid ${BORDER}`:"none" }}><div style={{ fontSize:8, color:MUTED, fontFamily:font, textTransform:"uppercase", minHeight:21 }}>{item.label}</div><div style={{ fontSize:18, fontWeight:800, color:TEXT }}>{item.value}</div><div style={{ fontSize:8, color:MUTED, marginTop:2 }}>{item.detail}</div></div>)}</div>}
    <div style={{ padding:"8px 14px", borderTop:`1px solid ${BORDER}`, background:"#fff7ed", display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
      <span style={{ fontSize:9, color:"#9a3412", lineHeight:1.45 }}><b>Alerta de calidad de datos:</b> el balance nacional reporta 157 desaparecidos, frente a 1.338 registrados únicamente en La Guaira; la diferencia permanece sin explicación.</span>
      <span style={{ fontSize:8, color:MUTED, fontFamily:font }}>Fuente: Gobierno encargado · corte semanal 03–07 ago 2026</span>
    </div>
  </Card>;
}
