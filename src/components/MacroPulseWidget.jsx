import { Card } from "./Card";
import { BORDER, TEXT, MUTED, ACCENT, font } from "../constants";

export function MacroPulseWidget({ liveData, onOpen }) {
  const dolarLoading = liveData?.dolarStatus === "loading" || (!liveData?.dolarStatus && !liveData?.fetched && !liveData?.dolar);
  const dolarUnavailable = !dolarLoading && !liveData?.dolar;
  const bcv = Number(liveData?.dolar?.bcv);
  const market = Number(liveData?.dolar?.paralelo);
  const gapRaw = liveData?.dolar?.brecha;
  const gap = typeof gapRaw === "string" ? gapRaw : Number.isFinite(Number(gapRaw)) ? `${Number(gapRaw).toFixed(1)}%` : "—";
  const liveValue = value => dolarLoading ? "Cargando…" : dolarUnavailable ? "No disponible" : value;
  const liveStatus = dolarLoading ? "Consultando fuente en vivo" : dolarUnavailable ? "No se pudo actualizar" : "Actualizado en vivo";
  const items = [
    {k:"Dólar BCV",v:liveValue(Number.isFinite(bcv)?`${bcv.toFixed(2)} Bs` : "—"),c:"#0468B1",s:liveStatus,loading:dolarLoading},
    {k:"Tasa de mercado",v:liveValue(Number.isFinite(market)?`${market.toFixed(2)} Bs` : "—"),c:"#dc2626",s:liveStatus,loading:dolarLoading},
    {k:"Brecha",v:liveValue(gap),c:"#b45309",s:liveStatus,loading:dolarLoading},
    {k:"Inflación agosto",v:"8,9%",c:"#7c3aed",s:"BCV · dato mensual"},
    {k:"Intervención sep. (proy.)",v:"≈USD 1.400 MM",c:"#b45309",s:"Estimación S36 · no ejecutado"},
  ];
  const stateColor = dolarLoading ? "#d97706" : dolarUnavailable ? "#dc2626" : "#16a34a";
  const stateLabel = dolarLoading ? "Cargando datos" : dolarUnavailable ? "Actualización fallida" : "Datos cargados";
  return <Card>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:9,flexWrap:"wrap"}}><span>💱</span><div style={{fontSize:10,fontFamily:font,color:TEXT,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase"}}>Pulso cambiario e inflación</div><span style={{width:7,height:7,borderRadius:"50%",background:stateColor,animation:dolarLoading?"pulse 1.2s ease-in-out infinite":"none"}}/><span style={{fontSize:8,fontFamily:font,color:stateColor,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>{stateLabel}</span><button onClick={onOpen} style={{marginLeft:"auto",border:0,background:ACCENT,color:"#fff",padding:"5px 9px",fontSize:8,fontFamily:font,cursor:"pointer"}}>Ver intervención →</button></div>
    {dolarLoading && <div role="status" aria-live="polite" style={{display:"flex",alignItems:"center",gap:9,padding:"9px 10px",marginBottom:9,background:"#fffbeb",border:"1px solid #fbbf24",color:"#92400e",fontSize:10,fontFamily:font,fontWeight:700}}><span aria-hidden="true" style={{width:13,height:13,border:"2px solid #fcd34d",borderTopColor:"#b45309",borderRadius:"50%",animation:"spin .8s linear infinite",flexShrink:0}}/>Cargando dólar e indicadores macroeconómicos…</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(135px,1fr))",gap:1,background:BORDER,border:`1px solid ${BORDER}`}}>{items.map(item=><div key={item.k} style={{background:item.loading?"#fffcf5":"#fff",padding:"9px 10px",minHeight:64}}><div style={{fontSize:8,fontFamily:font,color:MUTED,textTransform:"uppercase",letterSpacing:"0.06em"}}>{item.k}</div><div style={{fontSize:item.v === "No disponible"?11:15,fontWeight:800,color:item.loading?"#b45309":item.c,fontFamily:font,margin:"3px 0",animation:item.loading?"pulse 1.2s ease-in-out infinite":"none"}}>{item.v}</div><div style={{fontSize:8,fontFamily:font,color:item.loading?"#92400e":MUTED}}>{item.s}</div></div>)}</div>
    <div style={{fontSize:9,fontFamily:font,color:MUTED,marginTop:7}}>Tipo de cambio: consulta en vivo cuando está disponible. La intervención de septiembre es una proyección del ACS S36, no un cierre nuevo de S37; el último desglose semanal registrado sigue siendo 24–28 ago (USD 350 MM). Inflación mensual: BCV, agosto 2026 (8,9%).</div>
  </Card>;
}
