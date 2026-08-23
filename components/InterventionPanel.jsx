import { Card } from "./Card";
import { INTERVENTION_CUT, INTERVENTION_OBSERVED, INTERVENTION_PROJECTIONS, INTERVENTION_SOURCE } from "../data/intervencion";
import { BG2, BORDER, TEXT, MUTED, ACCENT, font } from "../constants";

export function InterventionPanel({ mob }) {
  const maxObserved = Math.max(...INTERVENTION_OBSERVED.map(item=>item.value));
  return <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
    <div style={{ border:"1px solid #0468B130", background:"linear-gradient(135deg,#0468B10c,transparent)", padding:"14px 16px" }}>
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, fontFamily:font, color:ACCENT, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase" }}>Intervención cambiaria del BCV</div>
          <div style={{ fontSize:13, color:TEXT, lineHeight:1.6, marginTop:5 }}>La oferta oficial de divisas contiene la tasa de mercado y absorbe liquidez, pero su sostenibilidad depende del flujo continuo de dólares y del ritmo del gasto público.</div>
        </div>
        <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>Corte: {INTERVENTION_CUT}</span>
      </div>
    </div>

    <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:8 }}>
      {[
        {k:"Julio 2026",v:"USD 2.200 MM",s:"Dato registrado",c:ACCENT},
        {k:"Enero–julio",v:"USD 9.200 MM",s:"≈4× igual período 2025",c:"#7c3aed"},
        {k:"Semana 10–14 ago",v:"USD 450 MM",s:"USD 120 MM el viernes",c:"#0f766e"},
        {k:"Semana 17–21 ago",v:"USD 550 MM",s:"Estimación de la fuente",c:"#b45309"},
      ].map(item=><Card key={item.k} accent={item.c}><div style={{fontSize:9,fontFamily:font,color:MUTED,textTransform:"uppercase",letterSpacing:"0.07em"}}>{item.k}</div><div style={{fontSize:19,fontWeight:800,color:item.c,fontFamily:"'Syne',sans-serif",margin:"4px 0"}}>{item.v}</div><div style={{fontSize:10,color:MUTED}}>{item.s}</div></Card>)}
    </div>

    <Card>
      <div style={{fontSize:10,fontFamily:font,color:MUTED,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Operaciones registradas · USD millones</div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(4,1fr)",gap:10,alignItems:"end"}}>
        {INTERVENTION_OBSERVED.map(item=><div key={item.period} style={{minWidth:0}}>
          <div style={{height:90,display:"flex",alignItems:"flex-end",justifyContent:"center",borderBottom:`1px solid ${BORDER}`}}><div style={{width:"52%",height:Math.max(8,item.value/maxObserved*82),background:ACCENT,opacity:item.value===maxObserved?1:.55,borderRadius:"3px 3px 0 0"}} /></div>
          <div style={{fontSize:14,fontWeight:800,color:item.value===maxObserved?ACCENT:TEXT,textAlign:"center",marginTop:5}}>{item.value.toLocaleString("es-VE")}</div>
          <div style={{fontSize:9,fontFamily:font,color:MUTED,textAlign:"center"}}>{item.period}</div>
          <div style={{fontSize:8,fontFamily:font,color:MUTED,textAlign:"center",marginTop:3,lineHeight:1.35}}>{item.note}</div>
        </div>)}
      </div>
    </Card>

    <Card>
      <div style={{fontSize:10,fontFamily:font,color:MUTED,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Estimaciones de la fuente</div>
      {INTERVENTION_PROJECTIONS.map((item,index)=><div key={item.period} style={{display:"grid",gridTemplateColumns:mob?"90px 1fr":"140px 150px 1fr",gap:8,padding:"8px 4px",borderTop:index?`1px solid ${BORDER}40`:"none",alignItems:"center"}}>
        <span style={{fontSize:10,fontFamily:font,color:MUTED}}>{item.period}</span><strong style={{fontSize:12,fontFamily:font,color:"#7c3aed"}}>{item.value}</strong><span style={{fontSize:10,fontFamily:font,color:MUTED,gridColumn:mob?"1 / -1":"auto"}}>{item.note}</span>
      </div>)}
      <div style={{marginTop:8,fontSize:9,fontFamily:font,color:"#7c3aed",background:"#7c3aed08",border:"1px solid #7c3aed20",padding:"7px 9px"}}>Estimaciones de Síntesis Financiera; no son datos registrados ni pronósticos del PNUD.</div>
    </Card>

    <div style={{fontSize:9,fontFamily:font,color:MUTED,lineHeight:1.55}}><strong>Fuente:</strong> {INTERVENTION_SOURCE}. Datos del BCV y cálculos de Síntesis Financiera.</div>
  </div>;
}
