import { Card } from "./Card";
import { INTERVENTION_CUT, INTERVENTION_OBSERVED, INTERVENTION_DAILY, EXCHANGE_WEEK_SUMMARY, INTERVENTION_PROJECTIONS, INTERVENTION_SOURCE } from "../data/intervencion";
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
        {k:"Semana 17–21 ago",v:"USD 500 MM",s:"Dato registrado",c:"#0f766e"},
        {k:"Semana 24–28 ago",v:"USD 350 MM",s:"Dato registrado · previsión inicial USD 500 MM",c:"#b45309"},
      ].map(item=><Card key={item.k} accent={item.c}><div style={{fontSize:9,fontFamily:font,color:MUTED,textTransform:"uppercase",letterSpacing:"0.07em"}}>{item.k}</div><div style={{fontSize:19,fontWeight:800,color:item.c,fontFamily:font,margin:"4px 0"}}>{item.v}</div><div style={{fontSize:10,color:MUTED}}>{item.s}</div></Card>)}
    </div>

    <Card>
      <div style={{fontSize:10,fontFamily:font,color:MUTED,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Operaciones registradas · USD millones</div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(5,1fr)",gap:10,alignItems:"end"}}>
        {INTERVENTION_OBSERVED.map(item=><div key={item.period} style={{minWidth:0}}>
          <div style={{height:90,display:"flex",alignItems:"flex-end",justifyContent:"center",borderBottom:`1px solid ${BORDER}`}}><div style={{width:"52%",height:Math.max(8,item.value/maxObserved*82),background:ACCENT,opacity:item.value===maxObserved?1:.55,borderRadius:"3px 3px 0 0"}} /></div>
          <div style={{fontSize:14,fontWeight:800,color:item.value===maxObserved?ACCENT:TEXT,fontFamily:font,textAlign:"center",marginTop:5}}>{item.value.toLocaleString("es-VE")}</div>
          <div style={{fontSize:9,fontFamily:font,color:MUTED,textAlign:"center"}}>{item.period}</div>
          <div style={{fontSize:8,fontFamily:font,color:MUTED,textAlign:"center",marginTop:3,lineHeight:1.35}}>{item.note}</div>
        </div>)}
      </div>
    </Card>

    <Card accent="#0f766e">
      <div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap",marginBottom:9}}><div><div style={{fontSize:10,fontFamily:font,color:"#0f766e",textTransform:"uppercase",letterSpacing:".1em",fontWeight:800}}>Semana cambiaria · observado frente a previsión</div><div style={{fontSize:9,color:MUTED,marginTop:3}}>La previsión inicial de USD {EXCHANGE_WEEK_SUMMARY.initialForecast} MM se conserva como referencia; el resultado fue USD {EXCHANGE_WEEK_SUMMARY.intervention} MM.</div></div><div style={{fontSize:9,color:MUTED,fontFamily:font}}>{EXCHANGE_WEEK_SUMMARY.period}</div></div>
      <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:7,marginBottom:11}}>{[
        [`${EXCHANGE_WEEK_SUMMARY.marketClose.toLocaleString("es-VE")} Bs/$`,`Mercado · +${EXCHANGE_WEEK_SUMMARY.marketChange}%`,"#dc2626"],
        [`${EXCHANGE_WEEK_SUMMARY.officialClose.toLocaleString("es-VE")} Bs/$`,`BCV · +${EXCHANGE_WEEK_SUMMARY.officialChange}%`,ACCENT],
        [`${EXCHANGE_WEEK_SUMMARY.gapClose.toLocaleString("es-VE")}%`,`Brecha · +${EXCHANGE_WEEK_SUMMARY.gapChange.toLocaleString("es-VE")}pp`,"#b45309"],
        [`USD ${EXCHANGE_WEEK_SUMMARY.publicSpending} MM`,`Gasto público · ${EXCHANGE_WEEK_SUMMARY.spendingChange}%`,"#7c3aed"]
      ].map(([value,label,color])=><div key={label} style={{border:`1px solid ${BORDER}`,padding:"8px 9px",background:BG2}}><div style={{fontSize:17,fontWeight:900,color,fontFamily:font}}>{value}</div><div style={{fontSize:8,color:MUTED}}>{label}</div></div>)}</div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:9}}><thead><tr>{["Día","Intervención","Acumulado","Tasa de mercado","Brecha"].map(h=><th key={h} style={{textAlign:"left",padding:"5px 6px",color:MUTED,fontFamily:font,borderBottom:`1px solid ${BORDER}`}}>{h}</th>)}</tr></thead><tbody>{INTERVENTION_DAILY.map(row=><tr key={row.date}><td style={{padding:"6px",borderBottom:`1px solid ${BORDER}50`,fontWeight:700}}>{row.date}</td><td style={{padding:6}}>USD {row.value} MM</td><td style={{padding:6,color:ACCENT,fontWeight:700}}>USD {row.cumulative} MM</td><td style={{padding:6}}>{row.market.toLocaleString("es-VE")} Bs/$</td><td style={{padding:6,color:row.gap>=20?"#dc2626":"#b45309",fontWeight:700}}>{row.gap.toLocaleString("es-VE")}%</td></tr>)}</tbody></table></div>
      <div style={{fontSize:9,color:MUTED,lineHeight:1.5,marginTop:8}}>La tasa alcanzó un máximo intr semanal el jueves y retrocedió al cierre. La moderación del gasto y USD 36 MM esterilizados mediante TCC compensaron parcialmente la menor oferta de divisas.</div>
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
