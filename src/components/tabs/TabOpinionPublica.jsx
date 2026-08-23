import { useMemo, useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Card } from "../Card";
import { BG2, BORDER, TEXT, MUTED, ACCENT, font } from "../../constants";
import { OPINION_SNAPSHOT, LEADERSHIP, RODRIGUEZ_TREND, INSTITUTION_TRUST, SOCIAL_MOOD, US_RELATION, SURVEY_SOURCES, EARTHQUAKE_OPINION } from "../../data/opinionPublica";
import { SITREP_ALL } from "../../data/sitrep";

const sections = [
  { id:"panorama", label:"Panorama" },
  { id:"liderazgo", label:"Liderazgos" },
  { id:"instituciones", label:"Confianza y ánimo" },
  { id:"terremoto", label:"Terremoto" },
  { id:"archivo", label:"Archivo S1–S31" },
  { id:"metodologia", label:"Fuentes" },
];

const SURVEY_PATTERN = /Atlas|Megan|Mass Behavior|More Consulting|Poder y Estrategia|Atenas|ENCOVI|Hinterlaces|CB Global|Pulso Nacional/i;

function sourceNames(source="") {
  return source.split(/\s*\+\s*|\s*\/\s*/).map(s=>s.replace(/\s*[—,].*$/,"").trim()).filter(Boolean);
}

function Bar({ value, color=ACCENT, muted=false }) {
  return <div style={{ height:8, background:"#e7ebf0", borderRadius:8, overflow:"hidden" }}><div style={{ width:`${Math.min(100,value)}%`, height:"100%", background:color, opacity:muted?.55:1, borderRadius:8 }} /></div>;
}

function TrendChart() {
  const w=620, h=190, pad=28;
  const min=35, max=75;
  const pts=RODRIGUEZ_TREND.map((d,i)=>({ ...d, x:pad+i*((w-pad*2)/(RODRIGUEZ_TREND.length-1)), y:h-pad-((d.approval-min)/(max-min))*(h-pad*2) }));
  const path=pts.map((p,i)=>`${i?"L":"M"}${p.x},${p.y}`).join(" ");
  return <div style={{ overflowX:"auto" }}><svg viewBox={`0 0 ${w} ${h}`} style={{ width:"100%", minWidth:480, display:"block" }}>
    {[40,50,60,70].map(v=>{ const y=h-pad-((v-min)/(max-min))*(h-pad*2); return <g key={v}><line x1={pad} y1={y} x2={w-pad} y2={y} stroke="#d8dee6" strokeDasharray="3 4"/><text x={4} y={y+4} fontSize="10" fill={MUTED}>{v}%</text></g> })}
    <path d={path} fill="none" stroke={ACCENT} strokeWidth="3" />
    {pts.map(p=><g key={p.period}><circle cx={p.x} cy={p.y} r="5" fill={BG2} stroke={ACCENT} strokeWidth="3"/><text x={p.x} y={p.y-12} textAnchor="middle" fontSize="11" fontWeight="700" fill={TEXT}>{p.approval}%</text><text x={p.x} y={h-7} textAnchor="middle" fontSize="10" fill={MUTED}>{p.period}</text></g>)}
  </svg></div>;
}

export function TabOpinionPublica({ section, setSection }) {
  const mob=useIsMobile();
  const [archiveFilter,setArchiveFilter]=useState("encuestas");
  const archive=useMemo(()=>SITREP_ALL.map((s,index)=>{
    const perception=s.opinionPublica?.percepcion;
    return { week:`S${index+1}`, period:s.periodShort||s.period, perception, isSurvey:SURVEY_PATTERN.test(perception?.fuente||"") };
  }),[]);
  const archiveVisible=archive.filter(r=>archiveFilter==="todos"||r.isSurvey);
  const surveyRecords=archive.filter(r=>r.isSurvey&&r.perception);
  const distinctSources=[...new Set(surveyRecords.flatMap(r=>sourceNames(r.perception.fuente)))];
  return <div>
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
      <span style={{ fontSize:20 }}>◉</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:15, fontWeight:700, color:TEXT, fontFamily:"'Syne',sans-serif", letterSpacing:"0.05em", textTransform:"uppercase" }}>Opinión Pública — Venezuela</div>
        <div style={{ fontSize:11, fontFamily:font, color:MUTED }}>Último corte: {OPINION_SNAPSHOT.period} · múltiples encuestadoras</div>
      </div>
      <div style={{ display:"flex", border:`1px solid ${BORDER}`, flexWrap:"wrap" }}>{sections.map(s=><button key={s.id} onClick={()=>setSection(s.id)} style={{ border:"none", padding:"7px 11px", cursor:"pointer", fontFamily:font, fontSize:11, background:section===s.id?ACCENT:"transparent", color:section===s.id?"#fff":MUTED }}>{s.label}</button>)}</div>
    </div>

    {section==="panorama" && <>
      <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:10, marginBottom:12 }}>{OPINION_SNAPSHOT.cards.map(c=><Card key={c.label} accent={c.color}><div style={{ fontSize:9, fontFamily:font, color:MUTED, textTransform:"uppercase", minHeight:28 }}>{c.label}</div><div style={{ fontSize:mob?24:30, fontWeight:800, color:c.color, fontFamily:font }}>{c.value}{c.suffix}</div><div style={{ fontSize:10, color:MUTED }}>{c.delta}</div></Card>)}</div>
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1.45fr 1fr", gap:12 }}>
        <Card><div style={{ fontSize:11, fontFamily:font, color:MUTED, textTransform:"uppercase", marginBottom:8 }}>Aceptación de Delcy Rodríguez · serie comparable</div><TrendChart/><div style={{ fontSize:10, color:MUTED }}>Fuente: More Consulting. La serie muestra aceptación como presidenta encargada; no debe mezclarse con aprobación de gestión de otras firmas.</div></Card>
        <Card><div style={{ fontSize:11, fontFamily:font, color:MUTED, textTransform:"uppercase", marginBottom:12 }}>Relación Venezuela–EE. UU.</div>{US_RELATION.map(r=><div key={r.label} style={{ marginBottom:16 }}><div style={{ display:"flex", justifyContent:"space-between", gap:8, fontSize:11, marginBottom:5 }}><span>{r.label}</span><b>{r.value}%</b></div><Bar value={r.value} color={r.value>r.previous?"#dc2626":ACCENT}/><div style={{ fontSize:9, color:MUTED, marginTop:3 }}>Medición previa: {r.previous}% · {r.value-r.previous>0?"+":""}{r.value-r.previous}pp</div></div>)}</Card>
      </div>
      <Card accent="#dc2626" style={{ marginTop:12, background:"linear-gradient(135deg,#fff 55%,#fef2f2)" }}>
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1.1fr 1fr", gap:18, alignItems:"center" }}>
          <div><div style={{ fontSize:10, fontFamily:font, color:"#dc2626", textTransform:"uppercase", letterSpacing:".1em" }}>Opinión pública · terremoto</div><div style={{ fontSize:18, fontWeight:800, margin:"5px 0", color:TEXT }}>{EARTHQUAKE_OPINION.headline.title}</div><div style={{ fontSize:11, color:MUTED, lineHeight:1.6 }}>{EARTHQUAKE_OPINION.headline.text}</div><button onClick={()=>setSection("terremoto")} style={{ marginTop:10, border:"none", background:"#dc2626", color:"#fff", padding:"7px 11px", fontFamily:font, fontSize:10, cursor:"pointer", borderRadius:3 }}>Ver análisis del terremoto →</button></div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>{[{label:"Desconfianza oficial",value:94.1,color:"#dc2626"},{label:"Respuesta negativa",value:91.6,color:"#dc2626"},{label:"Solidaridad",value:90.3,color:"#2d8a30"},{label:"Crisis habitacional",value:64,color:"#ca8a04"}].map(x=><div key={x.label} style={{ border:`1px solid ${BORDER}`, background:"#fff", padding:"9px" }}><div style={{ fontSize:18, fontWeight:800, color:x.color, fontFamily:font }}>{x.value}%</div><div style={{ fontSize:9, color:MUTED }}>{x.label}</div></div>)}</div>
        </div>
      </Card>
      <div style={{ background:"#fff7ed", border:"1px solid #fdba7444", padding:"11px 14px", fontSize:11, color:"#9a3412", lineHeight:1.55 }}>Lectura: crece la brecha entre legitimidad de opinión y representación formal. El respaldo a Machado aumenta mientras la confianza en el Gobierno y en su información humanitaria cae. Esto describe presión social; no equivale por sí solo a intención de voto.</div>
    </>}

    {section==="liderazgo" && <Card><div style={{ fontSize:11, fontFamily:font, color:MUTED, textTransform:"uppercase", marginBottom:14 }}>Imagen de liderazgos · positiva, negativa y balance neto</div><div style={{ display:"grid", gap:12 }}>{LEADERSHIP.map(p=><div key={p.name} style={{ display:"grid", gridTemplateColumns:mob?"1fr":"190px 1fr 1fr 70px", gap:mob?5:12, alignItems:"center", borderBottom:`1px solid ${BORDER}`, paddingBottom:10 }}><b style={{ fontSize:12 }}>{p.name}</b><div><div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:MUTED }}><span>Positiva</span><span>{p.positive}%</span></div><Bar value={p.positive} color="#2d8a30"/></div><div><div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:MUTED }}><span>Negativa</span><span>{p.negative}%</span></div><Bar value={p.negative} color="#dc2626"/></div><div style={{ fontSize:12, fontWeight:800, color:p.balance>=0?"#2d8a30":"#dc2626", textAlign:mob?"left":"right" }}>{p.balance>0?"+":""}{p.balance} pp</div></div>)}</div><div style={{ fontSize:10, color:MUTED, marginTop:12 }}>Fuente común: AtlasIntel/Bloomberg LATAM Pulse. El balance es imagen positiva menos imagen negativa.</div></Card>}

    {section==="instituciones" && <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:12 }}>
      <Card><div style={{ fontSize:11, fontFamily:font, color:MUTED, textTransform:"uppercase", marginBottom:14 }}>Valoración institucional post-terremoto</div>{INSTITUTION_TRUST.map(i=><div key={i.name} style={{ marginBottom:11 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}><span>{i.name}</span><b>{i.value}%</b></div><Bar value={i.value} color={i.value>=60?"#2d8a30":"#dc2626"}/></div>)}<div style={{ fontSize:10, color:MUTED }}>Fuente: Poder y Estrategia.</div></Card>
      <Card><div style={{ fontSize:11, fontFamily:font, color:MUTED, textTransform:"uppercase", marginBottom:14 }}>Estado emocional y capital social</div>{SOCIAL_MOOD.map(i=><div key={i.name} style={{ marginBottom:14 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}><span>{i.name}</span><b style={{ color:i.positive?"#2d8a30":"#dc2626" }}>{i.value}%</b></div><Bar value={i.value} color={i.positive?"#2d8a30":"#ca8a04"}/></div>)}<div style={{ fontSize:10, color:MUTED }}>Fuente: Meganálisis. Las emociones admiten respuestas múltiples y no deben sumar 100%.</div></Card>
    </div>}

    {section==="terremoto" && <>
      <Card accent="#dc2626" style={{ background:"linear-gradient(135deg,#fff 50%,#fef2f2)" }}><div style={{ fontSize:10, fontFamily:font, color:"#dc2626", textTransform:"uppercase" }}>Clima social post-sismo</div><div style={{ fontSize:21, fontWeight:800, margin:"5px 0" }}>{EARTHQUAKE_OPINION.headline.title}</div><div style={{ fontSize:12, color:MUTED, lineHeight:1.65, maxWidth:900 }}>{EARTHQUAKE_OPINION.headline.text}</div></Card>
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"repeat(2,1fr)", gap:12 }}>
        {[{title:"Evaluación de la respuesta",items:EARTHQUAKE_OPINION.response,color:"#dc2626"},{title:"Estado emocional",items:EARTHQUAKE_OPINION.emotions,color:"#ca8a04"},{title:"Resiliencia y solidaridad",items:EARTHQUAKE_OPINION.resilience,color:"#2d8a30"},{title:"Prioridades ciudadanas",items:EARTHQUAKE_OPINION.priorities,color:"#7c3aed"}].map(group=><Card key={group.title}><div style={{ fontSize:11, fontFamily:font, color:MUTED, textTransform:"uppercase", marginBottom:13 }}>{group.title}</div>{group.items.map(i=><div key={i.label} style={{ marginBottom:12 }}><div style={{ display:"flex", justifyContent:"space-between", gap:10, fontSize:11, marginBottom:4 }}><span>{i.label}</span><b style={{ color:group.color }}>{i.value}%</b></div><Bar value={i.value} color={group.color}/><div style={{ fontSize:8, color:MUTED, marginTop:2 }}>{i.source}</div></div>)}</Card>)}
      </div>
      <Card><div style={{ fontSize:11, fontFamily:font, color:MUTED, textTransform:"uppercase", marginBottom:12 }}>Percepción de recuperación de servicios · La Guaira</div><div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"repeat(3,1fr)", gap:12 }}>{EARTHQUAKE_OPINION.services.map(i=><div key={i.label}><div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:5 }}><span>{i.label}</span><b style={{ color:ACCENT }}>{i.value}%</b></div><Bar value={i.value}/><div style={{ fontSize:8, color:MUTED, marginTop:3 }}>{i.source}</div></div>)}</div></Card>
      <div style={{ background:"#eff6ff", border:"1px solid #93c5fd66", padding:"11px 14px", fontSize:10, color:"#1e3a8a", lineHeight:1.6 }}><b>Nota metodológica:</b> los indicadores provienen de encuestas distintas y responden preguntas diferentes. Se agrupan temáticamente para describir el clima post-sismo, pero no se promedian ni se convierten en un índice compuesto.</div>
    </>}

    {section==="archivo" && <>
      <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:10, marginBottom:12 }}>
        <Card><div style={{ fontSize:9, color:MUTED, fontFamily:font, textTransform:"uppercase" }}>Semanas cubiertas</div><div style={{ fontSize:27, fontWeight:800, color:ACCENT, fontFamily:font }}>31</div><div style={{ fontSize:10, color:MUTED }}>S1–S31</div></Card>
        <Card><div style={{ fontSize:9, color:MUTED, fontFamily:font, textTransform:"uppercase" }}>Cortes estructurados</div><div style={{ fontSize:27, fontWeight:800, color:TEXT, fontFamily:font }}>{archive.filter(r=>r.perception).length}</div><div style={{ fontSize:10, color:MUTED }}>SITREP con bloque de percepción</div></Card>
        <Card><div style={{ fontSize:9, color:MUTED, fontFamily:font, textTransform:"uppercase" }}>Cortes con encuestas</div><div style={{ fontSize:27, fontWeight:800, color:"#2d8a30", fontFamily:font }}>{surveyRecords.length}</div><div style={{ fontSize:10, color:MUTED }}>mediciones o estudios identificados</div></Card>
        <Card><div style={{ fontSize:9, color:MUTED, fontFamily:font, textTransform:"uppercase" }}>Fuentes identificadas</div><div style={{ fontSize:27, fontWeight:800, color:"#7c3aed", fontFamily:font }}>{distinctSources.length}</div><div style={{ fontSize:10, color:MUTED }}>firmas y estudios distintos</div></Card>
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap", marginBottom:10 }}>
        <div style={{ fontSize:11, color:MUTED, lineHeight:1.5 }}>Archivo cronológico de los bloques de opinión contenidos en cada SITREP. Los valores se presentan como fueron reportados y no se fusionan en un índice único.</div>
        <div style={{ display:"flex", border:`1px solid ${BORDER}` }}>{[{id:"encuestas",label:"Solo encuestas"},{id:"todos",label:"Todo el archivo"}].map(f=><button key={f.id} onClick={()=>setArchiveFilter(f.id)} style={{ border:"none", padding:"6px 10px", fontFamily:font, fontSize:10, cursor:"pointer", background:archiveFilter===f.id?ACCENT:"transparent", color:archiveFilter===f.id?"#fff":MUTED }}>{f.label}</button>)}</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"repeat(2,1fr)", gap:10 }}>
        {archiveVisible.map(r=>r.perception?<Card key={r.week} accent={r.isSurvey?ACCENT:"#94a3b8"}>
          <div style={{ display:"flex", justifyContent:"space-between", gap:8, alignItems:"flex-start", marginBottom:7 }}><div><div style={{ fontSize:10, fontFamily:font, color:ACCENT }}>{r.week} · {r.period}</div><div style={{ fontSize:13, fontWeight:700, lineHeight:1.35 }}>{r.perception.titulo}</div></div><span style={{ fontSize:9, padding:"3px 6px", borderRadius:10, whiteSpace:"nowrap", color:r.isSurvey?"#166534":MUTED, background:r.isSurvey?"#dcfce7":"#eef1f5" }}>{r.isSurvey?"Encuesta/estudio":"Contexto"}</span></div>
          <div style={{ fontSize:9, color:MUTED, fontFamily:font, marginBottom:9 }}>{r.perception.fuente}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{(r.perception.datos||[]).map((d,i)=><span key={i} title={d.factor} style={{ fontSize:9, border:`1px solid ${BORDER}`, padding:"4px 6px", borderRadius:3, maxWidth:"100%" }}><b>{d.pct==null?"s/d":`${d.pct}%`}</b> · {d.factor}</span>)}</div>
          {r.perception.nota&&<div style={{ fontSize:9, color:MUTED, lineHeight:1.45, marginTop:9 }}>{r.perception.nota}</div>}
        </Card>:<Card key={r.week} style={{ opacity:.68 }}><div style={{ fontSize:10, fontFamily:font, color:MUTED }}>{r.week} · {r.period}</div><div style={{ fontSize:12, marginTop:6 }}>Sin bloque estructurado de opinión pública en el SITREP.</div></Card>)}
      </div>
    </>}

    {section==="metodologia" && <>
      <div style={{ background:"#eff6ff", border:"1px solid #93c5fd66", padding:"12px 14px", marginBottom:12, fontSize:11, color:"#1e3a8a", lineHeight:1.6 }}><b>Regla de lectura:</b> solo se representan como tendencia los puntos producidos por la misma encuestadora, con una pregunta y métrica equivalentes. Los datos de firmas diferentes se muestran como fotografías separadas.</div>
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"repeat(2,1fr)", gap:10 }}>{SURVEY_SOURCES.map(s=><Card key={s.name}><div style={{ fontSize:13, fontWeight:700, color:TEXT }}>{s.name}</div><div style={{ fontSize:10, color:ACCENT, fontFamily:font, margin:"4px 0 8px" }}>{s.period}</div><div style={{ fontSize:11, marginBottom:8 }}>{s.scope}</div><div style={{ fontSize:10, color:MUTED, lineHeight:1.5 }}>{s.note}</div></Card>)}</div>
    </>}
  </div>;
}
