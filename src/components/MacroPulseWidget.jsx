import { Card } from "./Card";
import { BORDER, TEXT, MUTED, ACCENT, font } from "../constants";

export function MacroPulseWidget({ liveData, onOpen }) {
  const bcv = Number(liveData?.dolar?.bcv);
  const market = Number(liveData?.dolar?.paralelo);
  const gapRaw = liveData?.dolar?.brecha;
  const gap = typeof gapRaw === "string" ? gapRaw : Number.isFinite(Number(gapRaw)) ? `${Number(gapRaw).toFixed(1)}%` : "—";
  const items = [
    {k:"Dólar BCV",v:Number.isFinite(bcv)?`${bcv.toFixed(2)} Bs` : "—",c:"#0468B1",s:"En vivo"},
    {k:"Tasa de mercado",v:Number.isFinite(market)?`${market.toFixed(2)} Bs` : "—",c:"#dc2626",s:"En vivo"},
    {k:"Brecha",v:gap,c:"#b45309",s:"En vivo"},
    {k:"Inflación julio",v:"19,9%",c:"#7c3aed",s:"Dato registrado"},
    {k:"Intervención cambiaria",v:"USD 200 MM",c:"#0f766e",s:"17 ago · última registrada"},
  ];
  return <Card>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:9,flexWrap:"wrap"}}><span>💱</span><div style={{fontSize:10,fontFamily:font,color:TEXT,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase"}}>Pulso cambiario e inflación</div><span style={{width:5,height:5,borderRadius:"50%",background:"#22c55e"}}/><button onClick={onOpen} style={{marginLeft:"auto",border:0,background:ACCENT,color:"#fff",padding:"5px 9px",fontSize:8,fontFamily:font,cursor:"pointer"}}>Ver intervención →</button></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(135px,1fr))",gap:1,background:BORDER,border:`1px solid ${BORDER}`}}>{items.map(item=><div key={item.k} style={{background:"#fff",padding:"9px 10px"}}><div style={{fontSize:8,fontFamily:font,color:MUTED,textTransform:"uppercase",letterSpacing:"0.06em"}}>{item.k}</div><div style={{fontSize:15,fontWeight:800,color:item.c,fontFamily:font,margin:"3px 0"}}>{item.v}</div><div style={{fontSize:8,fontFamily:font,color:MUTED}}>{item.s}</div></div>)}</div>
    <div style={{fontSize:9,fontFamily:font,color:MUTED,marginTop:7}}>Intervención: USD 450 MM en la semana 10–14 ago · USD 2.200 MM en julio completo. Fuentes: BCV/DolarAPI · Síntesis Financiera, 17 y 19 ago 2026.</div>
  </Card>;
}
