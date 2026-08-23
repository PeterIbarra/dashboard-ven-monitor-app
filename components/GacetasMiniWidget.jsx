import { useEffect,useState } from "react";
import { Card } from "./Card";
import { fetchUmbralGacetas } from "../services/umbralGacetas";
import { BORDER,MUTED,TEXT,font } from "../constants";

export function GacetasMiniWidget({setTab}){
  const [data,setData]=useState(null);
  const [expanded,setExpanded]=useState(false);
  useEffect(()=>{fetchUmbralGacetas().then(setData).catch(()=>{});},[]);
  const records=data?.records||[];
  const latestDate=records[0]?.gazette_date;
  const latest=latestDate?records.filter(r=>r.gazette_date===latestDate):[];
  const designations=records.filter(r=>r.change_label==="Designación").length;
  const militaryPeople=records.filter(r=>r.is_military_person).length;
  const militaryPosts=records.filter(r=>r.is_military_post).length;
  const ordinary=new Set(records.filter(r=>r.gazette_type==="Ordinaria").map(r=>r.gazette_number)).size;
  const extraordinary=new Set(records.filter(r=>r.gazette_type==="Extraordinaria").map(r=>r.gazette_number)).size;
  const militaryPct=designations?records.filter(r=>r.change_label==="Designación"&&r.is_military_person).length/designations*100:0;
  const topTypes=Object.entries(records.reduce((acc,r)=>{const key=r.change_label||"Otro";acc[key]=(acc[key]||0)+1;return acc;},{})).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxType=Math.max(...topTypes.map(([,count])=>count),1);

  return <Card accent="#0f766e" style={{padding:0,overflow:"hidden"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",padding:"10px 14px",borderBottom:expanded?`1px solid ${BORDER}`:"none"}}>
      <div><div style={{fontSize:10,color:"#0f766e",fontFamily:font,fontWeight:800,textTransform:"uppercase",letterSpacing:".12em"}}>Monitor de Gacetas Oficiales</div><div style={{fontSize:9,color:MUTED}}>Designaciones y cambios en la administración pública</div></div>
      <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}><span style={{fontSize:10,color:"#0f766e",fontFamily:font,fontWeight:800}}>{data?`${records.length} cambios · ${latestDate}`:"Consultando…"}</span><button onClick={()=>setExpanded(value=>!value)} aria-expanded={expanded} style={{border:"1px solid #0f766e50",background:expanded?"#ecfdf5":"#fff",color:"#0f766e",padding:"6px 10px",fontSize:9,fontFamily:font,cursor:"pointer"}}>{expanded?"Ocultar ▲":"Desplegar ▼"}</button><button onClick={()=>{setTab("gacetas");window.scrollTo({top:0,behavior:"smooth"});}} style={{border:0,background:"#0f766e",color:"#fff",padding:"6px 10px",fontSize:9,fontFamily:font,cursor:"pointer"}}>Ver monitor →</button></div>
    </div>
    {expanded&&<>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(125px,1fr))",borderBottom:`1px solid ${BORDER}`}}>{[[records.length,"Cambios totales"],[ordinary,"Ordinarias"],[extraordinary,"Extraordinarias"],[designations,"Designaciones"],[militaryPeople,"Personas militares"],[militaryPosts,"Cargos militares"],[`${militaryPct.toFixed(0)}%`,"Designaciones militares"]].map(([value,label],index)=><div key={label} style={{padding:"10px 12px",borderRight:index<6?`1px solid ${BORDER}`:"none"}}><div style={{fontSize:20,fontWeight:900,color:index>3?"#ca8a04":"#0f766e"}}>{value}</div><div style={{fontSize:8,color:MUTED,fontFamily:font,textTransform:"uppercase"}}>{label}</div></div>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))"}}>
        <div style={{padding:"11px 14px",borderRight:`1px solid ${BORDER}`}}><div style={{fontSize:8,color:MUTED,fontFamily:font,textTransform:"uppercase",marginBottom:7}}>Cambios más frecuentes</div>{topTypes.map(([label,count])=><div key={label} style={{display:"grid",gridTemplateColumns:"85px 1fr 34px",gap:6,alignItems:"center",marginBottom:5}}><span style={{fontSize:8,color:TEXT}}>{label}</span><span style={{height:7,background:"#e7ebf0",borderRadius:4,overflow:"hidden"}}><span style={{display:"block",height:"100%",width:`${count/maxType*100}%`,background:"#0f766e"}}/></span><b style={{fontSize:8,textAlign:"right"}}>{count}</b></div>)}</div>
        <div style={{padding:"11px 14px"}}><div style={{fontSize:8,color:MUTED,fontFamily:font,textTransform:"uppercase",marginBottom:7}}>Últimos cambios · {latestDate||"—"}</div>{latest.slice(0,4).map(r=><div key={r.id} style={{padding:"5px 0",borderBottom:`1px solid ${BORDER}`}}><div style={{fontSize:8,color:"#0f766e",fontFamily:font}}>{r.change_label} · Gaceta {r.gazette_number}</div><div style={{fontSize:9,color:TEXT,fontWeight:700}}>{r.person_name||r.post_or_position||r.organism||"Cambio institucional"}</div><div style={{fontSize:8,color:MUTED,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.organism||r.summary}</div></div>)}</div>
      </div>
    </>}
  </Card>;
}
