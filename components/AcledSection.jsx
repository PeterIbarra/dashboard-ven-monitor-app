import { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { Card } from "./Card";
import { LeafletMap } from "./LeafletMap";
import { VZ_MAP } from "../data/static.js";
import { BG2, BG3, BORDER, TEXT, MUTED, ACCENT, font } from "../constants";
import { IS_DEPLOYED } from "../utils";

export function AcledSection() {
  const mob = useIsMobile();
  const [events, setEvents] = useState([]);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [acledPage, setAcledPage] = useState(1);
  const [acledView, setAcledView] = useState("overview");
  const [castState, setCastState] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/acled?type=events&limit=2000", { signal: AbortSignal.timeout(20000) });
        if (res.ok) {
          const data = await res.json();
          const evts = data.data || data || [];
          if (Array.isArray(evts)) setEvents(evts);
        } else {
          const err = await res.json().catch(() => ({}));
          setError(err.error || `HTTP ${res.status}`);
        }
      } catch (e) { setError(e.message); }
      try {
        const res = await fetch("/api/acled?type=cast", { signal: AbortSignal.timeout(15000) });
        if (res.ok) { const data = await res.json(); const p = data.data || data || []; if (Array.isArray(p)) setCast(p); }
      } catch {}
      setLoading(false);
    }
    if (IS_DEPLOYED) load();
    else { setLoading(false); setError("ACLED requiere deploy en Vercel"); }
  }, []);

  const EC = { "Protests":"#4C9F38","Riots":"#b8860b","Battles":"#E5243B","Violence against civilians":"#dc2626","Explosions/Remote violence":"#f97316","Strategic developments":"#0A97D9" };

  // Spanish translations
  const TR = {
    // Event types
    "Protests":"Protestas","Riots":"Disturbios","Battles":"Batallas",
    "Violence against civilians":"Violencia contra civiles",
    "Explosions/Remote violence":"Explosiones/Violencia remota",
    "Strategic developments":"Desarrollos estratégicos",
    // Sub-event types
    "Peaceful protest":"Protesta pacífica","Protest with intervention":"Protesta con intervención",
    "Excessive force against protesters":"Fuerza excesiva contra manifestantes",
    "Violent demonstration":"Manifestación violenta","Mob violence":"Violencia de multitud",
    "Armed clash":"Enfrentamiento armado","Attack":"Ataque",
    "Abduction/forced disappearance":"Secuestro/desaparición forzada",
    "Sexual violence":"Violencia sexual","Arrests":"Detenciones",
    "Change to group/activity":"Cambio de grupo/actividad",
    "Disrupted weapons use":"Uso de armas frustrado","Grenade":"Granada",
    "Shelling/artillery/missile attack":"Bombardeo/artillería/misil",
    "Air/drone strike":"Ataque aéreo/dron","Looting/property destruction":"Saqueo/destrucción",
    "Government regains territory":"Gobierno recupera territorio",
    "Non-state actor overtakes territory":"Actor no estatal toma territorio",
    "Agreement":"Acuerdo","Headquarters or base established":"Base establecida",
    "Other":"Otro",
  };
  const trad = (s) => TR[s] || s;

  const byType = {}, byAdmin = {}, byActor = {};
  let totalFatal = 0, totalExposure = 0;
  events.forEach(e => {
    byType[e.event_type] = (byType[e.event_type]||0) + 1;
    if (e.admin1) byAdmin[e.admin1] = (byAdmin[e.admin1]||0) + 1;
    if (e.actor1) { const a = e.actor1.slice(0,50); byActor[a] = (byActor[a]||0) + 1; }
    totalFatal += parseInt(e.fatalities)||0;
    totalExposure += parseInt(e.population_best)||0;
  });
  const thisWeek = events.filter(e => (Date.now() - new Date(e.event_date)) < 7*864e5).length;

  const filtered = events.filter(e => {
    if (filter !== "all" && e.event_type !== filter) return false;
    if (actorFilter !== "all" && !(e.actor1||"").includes(actorFilter)) return false;
    if (stateFilter !== "all" && e.admin1 !== stateFilter) return false;
    return true;
  });
  const sorted = [...filtered].sort((a,b) => (b.event_date||"").localeCompare(a.event_date||""));

  const weekMap = {};
  events.forEach(e => {
    const d = new Date(e.event_date); const ws = new Date(d); ws.setDate(d.getDate()-d.getDay());
    const wk = ws.toISOString().slice(0,10);
    if (!weekMap[wk]) weekMap[wk] = { d:wk, total:0, types:{} };
    weekMap[wk].total++; weekMap[wk].types[e.event_type] = (weekMap[wk].types[e.event_type]||0)+1;
  });
  const weekly = Object.values(weekMap).sort((a,b) => a.d.localeCompare(b.d));
  const typeOrder = Object.entries(byType).sort((a,b) => b[1]-a[1]).map(([t]) => t);
  const topActors = Object.entries(byActor).sort((a,b) => b[1]-a[1]).slice(0,15);

  // Aggregate CAST by state (API returns one row per state per month)
  const castByState = useMemo(() => {
    const agg = {};
    cast.forEach(p => {
      if (!p.admin1) return;
      if (!agg[p.admin1]) agg[p.admin1] = { admin1:p.admin1, total_forecast:0, total_observed:0, battles_forecast:0, vac_forecast:0, erv_forecast:0, months:0 };
      agg[p.admin1].total_forecast += (p.total_forecast||0);
      agg[p.admin1].total_observed += (p.total_observed||0);
      agg[p.admin1].battles_forecast += (p.battles_forecast||0);
      agg[p.admin1].vac_forecast += (p.vac_forecast||0);
      agg[p.admin1].erv_forecast += (p.erv_forecast||0);
      agg[p.admin1].months++;
    });
    return Object.values(agg).sort((a,b) => b.total_forecast - a.total_forecast);
  }, [cast]);

  if (loading) return <div style={{ textAlign:"center", padding:40, color:MUTED, fontFamily:font, fontSize:14 }}>Conectando con ACLED...</div>;
  if (error) return <Card><div style={{ color:"#E5243B", fontSize:14, fontFamily:font }}>⚠ {error}</div></Card>;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", animation:"pulse 2s infinite" }} />
        <span style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", flex:1 }}>
          ACLED · Venezuela {new Date().getFullYear()} · {events.length} eventos · Actualiza cada lunes
        </span>
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}`, flexWrap:"wrap" }}>
          {[{id:"overview",l:"Vista general"},{id:"map",l:"Mapa"},{id:"cast",l:"CAST"},{id:"events",l:"Eventos"}].map(s => (
            <button key={s.id} onClick={() => setAcledView(s.id)}
              style={{ fontSize:10, fontFamily:font, padding:"5px 10px", border:"none",
                background:acledView===s.id?ACCENT:"transparent", color:acledView===s.id?"#fff":MUTED, cursor:"pointer" }}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(5,1fr)", gap:8, marginBottom:12 }}>
        {[
          {l:"Eventos",v:events.length,c:"#E5243B"},
          {l:"Fatalidades",v:totalFatal,c:"#dc2626"},
          {l:"Esta semana",v:thisWeek,c:"#f59e0b"},
          {l:"Exposición civil",v:totalExposure>1e6?`${(totalExposure/1e6).toFixed(1)}M`:totalExposure>1e3?`${(totalExposure/1e3).toFixed(0)}K`:totalExposure||"—",c:"#9b59b6"},
          {l:"Estados activos",v:Object.keys(byAdmin).length,c:"#4C9F38"},
        ].map((k,i) => (
          <Card key={i} accent={k.c}>
            <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>{k.l}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.c, fontFamily:"'Playfair Display',serif" }}>{k.v}</div>
          </Card>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {acledView === "overview" && (<>
        {/* Stacked weekly bars — clickable */}
        {weekly.length > 1 && (
          <Card>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
              Eventos por semana · Click en una barra para ver detalle
            </div>
            <svg width="100%" viewBox="0 0 700 180" style={{ display:"block" }}>
              {(() => {
                const maxW = Math.max(...weekly.map(w => w.total),1);
                const bw = Math.max(6, (640/weekly.length)-2);
                return weekly.map((w,i) => {
                  const x = 45 + i*(650/weekly.length); let cy = 155;
                  const isSel = filter === `week:${w.d}`;
                  return (<g key={i} style={{ cursor:"pointer" }}
                    onClick={() => { setFilter(filter===`week:${w.d}` ? "all" : `week:${w.d}`); setAcledPage(1); }}>
                    <rect x={x-1} y={10} width={bw+2} height={165} fill={isSel ? "rgba(0,0,0,0.06)" : "transparent"} />
                    {typeOrder.map(t => { const c = w.types[t]||0; if (!c) return null; const h = (c/maxW)*130; cy -= h;
                      return <rect key={t} x={x} y={cy} width={bw} height={h} fill={EC[t]||ACCENT}
                        opacity={filter!=="all"&&!isSel&&!filter.startsWith("week:")?0.3:isSel?1:0.75} rx={1}><title>{w.d} · {t}: {c}</title></rect>; })}
                    {isSel && <line x1={x+bw/2} y1={155} x2={x+bw/2} y2={160} stroke={ACCENT} strokeWidth={2} />}
                    {i % Math.max(1,Math.floor(weekly.length/8)) === 0 && <text x={x+bw/2} y={172} textAnchor="middle" fontSize={7} fill={isSel?TEXT:MUTED} fontWeight={isSel?700:400} fontFamily={font}>{new Date(w.d+"T00:00").toLocaleDateString("es",{day:"numeric",month:"short"})}</text>}
                  </g>);
                });
              })()}
            </svg>
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:4 }}>
              {typeOrder.map(t => <span key={t} style={{ fontSize:9, fontFamily:font, color:EC[t] }}>■ {trad(t)}</span>)}
            </div>
          </Card>
        )}

        {/* Week detail panel */}
        {filter.startsWith("week:") && (() => {
          const wkDate = filter.replace("week:","");
          const wk = weekly.find(w => w.d === wkDate);
          if (!wk) return null;
          const wkEnd = new Date(wkDate); wkEnd.setDate(wkEnd.getDate()+7);
          const wkEvents = events.filter(e => e.event_date >= wkDate && e.event_date < wkEnd.toISOString().slice(0,10))
            .sort((a,b) => (b.event_date||"").localeCompare(a.event_date||""));
          const wkFatal = wkEvents.reduce((s,e) => s+(parseInt(e.fatalities)||0),0);
          const wkTypes = {}; wkEvents.forEach(e => { wkTypes[e.event_type]=(wkTypes[e.event_type]||0)+1; });
          return (<>
            <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:8 }}>
              {[{l:`Semana ${wkDate}`,v:wkEvents.length,c:ACCENT},{l:"Fatalidades",v:wkFatal,c:"#dc2626"},
                {l:"Tipos activos",v:Object.keys(wkTypes).length,c:"#4C9F38"},{l:"",v:<span style={{fontSize:10,cursor:"pointer",color:MUTED}} onClick={() => setFilter("all")}>✕ Cerrar</span>,c:MUTED}
              ].map((k,i) => <Card key={i} accent={k.c}><div style={{fontSize:9,fontFamily:font,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>{k.l}</div><div style={{fontSize:18,fontWeight:800,color:k.c,fontFamily:"'Playfair Display',serif"}}>{k.v}</div></Card>)}
            </div>
            <Card>
              {wkEvents.slice(0,15).map((e,i) => (
                <div key={i} style={{ padding:"5px 0", borderBottom:`1px solid ${BORDER}20`, display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div style={{ minWidth:62, fontSize:10, fontFamily:font, color:MUTED }}>{e.event_date}</div>
                  <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${EC[e.event_type]||ACCENT}15`, color:EC[e.event_type]||ACCENT, border:`1px solid ${EC[e.event_type]||ACCENT}25`, whiteSpace:"nowrap" }}>{trad(e.sub_event_type||e.event_type)}</span>
                  {parseInt(e.fatalities)>0 && <span style={{ fontSize:9, fontFamily:font, padding:"1px 4px", background:"#dc262615", color:"#dc2626" }}>💀{e.fatalities}</span>}
                  <div style={{ flex:1 }}><div style={{ fontSize:10, color:TEXT }}>{e.location}{e.admin1?`, ${e.admin1}`:""}</div>
                    <div style={{ fontSize:9, color:MUTED, marginTop:1, lineHeight:1.4 }}>{(e.notes||"").slice(0,180)}{(e.notes||"").length>180?"...":""}</div></div>
                </div>
              ))}
              {wkEvents.length > 15 && <div style={{ fontSize:10, fontFamily:font, color:MUTED, marginTop:6 }}>... y {wkEvents.length-15} más</div>}
            </Card>
          </>);
        })()}

        {/* Type + Actor — selectable with detail */}
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10 }}>
          <Card>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
              Por tipo de evento {filter !== "all" && !filter.startsWith("week:") && <span style={{ color:EC[filter]||ACCENT, cursor:"pointer" }} onClick={() => setFilter("all")}> · {filter} ✕</span>}
            </div>
            {Object.entries(byType).sort((a,b) => b[1]-a[1]).map(([t,c]) => {
              const isActive = filter === t;
              return (
                <div key={t} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, cursor:"pointer",
                  opacity:filter!=="all"&&!filter.startsWith("week:")&&!isActive?0.3:1, padding:"2px 4px",
                  background:isActive?`${EC[t]}15`:"transparent", border:isActive?`1px solid ${EC[t]}30`:"1px solid transparent" }}
                  onClick={() => { setFilter(isActive?"all":t); setAcledPage(1); }}>
                  <span style={{ fontSize:10, fontFamily:font, color:EC[t]||MUTED, minWidth:140 }}>{trad(t)}</span>
                  <div style={{ flex:1, height:14, background:`${BORDER}30`, position:"relative" }}>
                    <div style={{ width:`${(c/events.length)*100}%`, height:"100%", background:EC[t]||ACCENT, opacity:isActive?1:0.7 }} />
                    <span style={{ position:"absolute", right:4, top:1, fontSize:9, fontFamily:font, color:TEXT }}>{c}</span>
                  </div>
                </div>
              );
            })}
          </Card>
          <Card>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
              Top actores {actorFilter !== "all" && <span style={{ color:ACCENT, cursor:"pointer" }} onClick={() => setActorFilter("all")}> · {actorFilter.slice(0,30)} ✕</span>}
            </div>
            {topActors.map(([a,c]) => {
              const isActive = actorFilter === a;
              return (
                <div key={a} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3, cursor:"pointer",
                  opacity:actorFilter!=="all"&&!isActive?0.3:1, padding:"2px 4px",
                  background:isActive?`${ACCENT}15`:"transparent", border:isActive?`1px solid ${ACCENT}30`:"1px solid transparent" }}
                  onClick={() => { setActorFilter(isActive?"all":a); setAcledPage(1); }}>
                  <span style={{ fontSize:9, fontFamily:font, color:isActive?ACCENT:MUTED, minWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a}</span>
                  <div style={{ flex:1, height:12, background:`${BORDER}30`, position:"relative" }}>
                    <div style={{ width:`${(c/topActors[0][1])*100}%`, height:"100%", background:isActive?ACCENT:`${ACCENT}60` }} />
                    <span style={{ position:"absolute", right:3, top:0, fontSize:9, fontFamily:font, color:TEXT }}>{c}</span>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Type detail panel */}
        {filter !== "all" && !filter.startsWith("week:") && (() => {
          const tEvents = events.filter(e => e.event_type === filter).sort((a,b) => (b.event_date||"").localeCompare(a.event_date||""));
          const tFatal = tEvents.reduce((s,e) => s+(parseInt(e.fatalities)||0),0);
          const tStates = {}; tEvents.forEach(e => { if(e.admin1) tStates[e.admin1]=(tStates[e.admin1]||0)+1; });
          const tActors = {}; tEvents.forEach(e => { if(e.actor1) { const a=e.actor1.slice(0,50); tActors[a]=(tActors[a]||0)+1; }});
          const tPP = 15, tTotalP = Math.ceil(tEvents.length/tPP), tPage = tEvents.slice((acledPage-1)*tPP, acledPage*tPP);
          return (<>
            <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:8 }}>
              {[{l:filter,v:tEvents.length,c:EC[filter]||ACCENT},{l:"Fatalidades",v:tFatal,c:"#dc2626"},{l:"Estados",v:Object.keys(tStates).length,c:"#0A97D9"},{l:"Actores",v:Object.keys(tActors).length,c:"#9b59b6"}]
                .map((k,i) => <Card key={i} accent={k.c}><div style={{fontSize:9,fontFamily:font,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>{k.l}</div><div style={{fontSize:18,fontWeight:800,color:k.c,fontFamily:"'Playfair Display',serif"}}>{k.v}</div></Card>)}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10 }}>
              <Card>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Por estado</div>
                {Object.entries(tStates).sort((a,b) => b[1]-a[1]).slice(0,12).map(([s,c]) => (
                  <div key={s} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:TEXT, minWidth:110 }}>{s}</span>
                    <div style={{ flex:1, height:10, background:`${BORDER}30`, position:"relative" }}>
                      <div style={{ width:`${(c/Object.values(tStates).reduce((a,b)=>Math.max(a,b),1))*100}%`, height:"100%", background:EC[filter]||ACCENT, opacity:0.7 }} />
                    </div>
                    <span style={{ fontSize:9, fontWeight:600, color:EC[filter]||ACCENT, fontFamily:font }}>{c}</span>
                  </div>
                ))}
              </Card>
              <Card>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Actores principales</div>
                {Object.entries(tActors).sort((a,b) => b[1]-a[1]).slice(0,10).map(([a,c]) => (
                  <div key={a} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:MUTED, minWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a}</span>
                    <div style={{ flex:1, height:10, background:`${BORDER}30`, position:"relative" }}>
                      <div style={{ width:`${(c/Object.values(tActors).reduce((a,b)=>Math.max(a,b),1))*100}%`, height:"100%", background:`${ACCENT}70` }} />
                    </div>
                    <span style={{ fontSize:9, fontFamily:font, color:TEXT }}>{c}</span>
                  </div>
                ))}
              </Card>
            </div>
            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Eventos · {filter} · {tEvents.length}</div>
                {tTotalP>1 && <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <button onClick={() => setAcledPage(Math.max(1,acledPage-1))} disabled={acledPage===1} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:acledPage===1?`${MUTED}40`:TEXT, cursor:acledPage===1?"default":"pointer" }}>←</button>
                  <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>{acledPage}/{tTotalP}</span>
                  <button onClick={() => setAcledPage(Math.min(tTotalP,acledPage+1))} disabled={acledPage>=tTotalP} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:acledPage>=tTotalP?`${MUTED}40`:TEXT, cursor:acledPage>=tTotalP?"default":"pointer" }}>→</button>
                </div>}
              </div>
              {tPage.map((e,i) => (
                <div key={i} style={{ padding:"5px 0", borderBottom:`1px solid ${BORDER}20`, display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div style={{ minWidth:62, fontSize:10, fontFamily:font, color:MUTED }}>{e.event_date}</div>
                  <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${EC[e.event_type]||ACCENT}15`, color:EC[e.event_type]||ACCENT, whiteSpace:"nowrap" }}>{trad(e.sub_event_type||e.event_type)}</span>
                  {parseInt(e.fatalities)>0 && <span style={{ fontSize:9, fontFamily:font, padding:"1px 4px", background:"#dc262615", color:"#dc2626" }}>💀{e.fatalities}</span>}
                  <div style={{ flex:1 }}><div style={{ fontSize:10, color:TEXT }}>{e.location}{e.admin1?`, ${e.admin1}`:""}</div>
                    {e.actor1 && <div style={{ fontSize:9, color:ACCENT, marginTop:1 }}>{e.actor1}</div>}
                    <div style={{ fontSize:9, color:MUTED, marginTop:1, lineHeight:1.4 }}>{(e.notes||"").slice(0,180)}{(e.notes||"").length>180?"...":""}</div></div>
                </div>
              ))}
            </Card>
          </>);
        })()}

        {/* Actor detail panel */}
        {actorFilter !== "all" && (() => {
          const aEvents = events.filter(e => (e.actor1||"").includes(actorFilter)).sort((a,b) => (b.event_date||"").localeCompare(a.event_date||""));
          const aFatal = aEvents.reduce((s,e) => s+(parseInt(e.fatalities)||0),0);
          const aTypes = {}; aEvents.forEach(e => { aTypes[e.event_type]=(aTypes[e.event_type]||0)+1; });
          const aStates = {}; aEvents.forEach(e => { if(e.admin1) aStates[e.admin1]=(aStates[e.admin1]||0)+1; });
          const aPP = 15, aTotalP = Math.ceil(aEvents.length/aPP), aPage = aEvents.slice((acledPage-1)*aPP, acledPage*aPP);
          return (<>
            <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:8 }}>
              {[{l:actorFilter.slice(0,35),v:aEvents.length,c:ACCENT},{l:"Fatalidades",v:aFatal,c:"#dc2626"},{l:"Tipos",v:Object.keys(aTypes).length,c:"#4C9F38"},{l:"Estados",v:Object.keys(aStates).length,c:"#0A97D9"}]
                .map((k,i) => <Card key={i} accent={k.c}><div style={{fontSize:9,fontFamily:font,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>{k.l}</div><div style={{fontSize:18,fontWeight:800,color:k.c,fontFamily:"'Playfair Display',serif"}}>{k.v}</div></Card>)}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10 }}>
              <Card>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Tipos de evento</div>
                {Object.entries(aTypes).sort((a,b) => b[1]-a[1]).map(([t,c]) => (
                  <div key={t} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:EC[t]||MUTED, minWidth:130 }}>{trad(t)}</span>
                    <div style={{ flex:1, height:10, background:`${BORDER}30`, position:"relative" }}>
                      <div style={{ width:`${(c/aEvents.length)*100}%`, height:"100%", background:EC[t]||ACCENT, opacity:0.7 }} />
                    </div>
                    <span style={{ fontSize:9, fontWeight:600, color:EC[t]||ACCENT, fontFamily:font }}>{c}</span>
                  </div>
                ))}
              </Card>
              <Card>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Estados donde opera</div>
                {Object.entries(aStates).sort((a,b) => b[1]-a[1]).slice(0,10).map(([s,c]) => (
                  <div key={s} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:TEXT, minWidth:110 }}>{s}</span>
                    <div style={{ flex:1, height:10, background:`${BORDER}30`, position:"relative" }}>
                      <div style={{ width:`${(c/Object.values(aStates).reduce((a,b)=>Math.max(a,b),1))*100}%`, height:"100%", background:`${ACCENT}70` }} />
                    </div>
                    <span style={{ fontSize:9, fontFamily:font, color:TEXT }}>{c}</span>
                  </div>
                ))}
              </Card>
            </div>
            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Eventos · {actorFilter.slice(0,40)} · {aEvents.length}</div>
                {aTotalP>1 && <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <button onClick={() => setAcledPage(Math.max(1,acledPage-1))} disabled={acledPage===1} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:acledPage===1?`${MUTED}40`:TEXT, cursor:acledPage===1?"default":"pointer" }}>←</button>
                  <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>{acledPage}/{aTotalP}</span>
                  <button onClick={() => setAcledPage(Math.min(aTotalP,acledPage+1))} disabled={acledPage>=aTotalP} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:acledPage>=aTotalP?`${MUTED}40`:TEXT, cursor:acledPage>=aTotalP?"default":"pointer" }}>→</button>
                </div>}
              </div>
              {aPage.map((e,i) => (
                <div key={i} style={{ padding:"5px 0", borderBottom:`1px solid ${BORDER}20`, display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div style={{ minWidth:62, fontSize:10, fontFamily:font, color:MUTED }}>{e.event_date}</div>
                  <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${EC[e.event_type]||ACCENT}15`, color:EC[e.event_type]||ACCENT, whiteSpace:"nowrap" }}>{trad(e.sub_event_type||e.event_type)}</span>
                  {parseInt(e.fatalities)>0 && <span style={{ fontSize:9, fontFamily:font, padding:"1px 4px", background:"#dc262615", color:"#dc2626" }}>💀{e.fatalities}</span>}
                  <div style={{ flex:1 }}><div style={{ fontSize:10, color:TEXT }}>{e.location}{e.admin1?`, ${e.admin1}`:""}</div>
                    <div style={{ fontSize:9, color:MUTED, marginTop:1, lineHeight:1.4 }}>{(e.notes||"").slice(0,180)}{(e.notes||"").length>180?"...":""}</div></div>
                </div>
              ))}
            </Card>
          </>);
        })()}

        <Card>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
            Eventos por estado {stateFilter !== "all" && <span style={{ color:ACCENT, cursor:"pointer" }} onClick={() => setStateFilter("all")}>· {stateFilter} ✕</span>}
          </div>
          <div style={{ display:"flex", gap:12, flexDirection:mob?"column":"row" }}>
            {/* SVG Map */}
            <div style={{ flex:mob?"1 1 100%":"0 0 55%" }}>
              <svg viewBox="0 0 600 420" width="100%" style={{ background:BG3 }}>
                {VZ_MAP.map(state => {
                  const acledName = Object.keys(byAdmin).find(a =>
                    a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").includes(state.id.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")) ||
                    state.id.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").includes(a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""))
                  );
                  const count = acledName ? byAdmin[acledName] : 0;
                  const mx = Math.max(...Object.values(byAdmin), 1);
                  const intensity = count / mx;
                  const isSelected = stateFilter === acledName;
                  const fillColor = count === 0 ? `${MUTED}15` :
                    intensity > 0.7 ? "#E5243B" : intensity > 0.4 ? "#f59e0b" : intensity > 0.15 ? "#0A97D9" : "#4C9F38";
                  return (
                    <g key={state.id}>
                      <path d={state.d}
                        fill={isSelected ? fillColor : `${fillColor}${count > 0 ? "60" : "15"}`}
                        stroke={isSelected ? "#fff" : BORDER} strokeWidth={isSelected ? 2 : 0.5}
                        style={{ cursor: count > 0 ? "pointer" : "default", transition:"all 0.2s" }}
                        opacity={stateFilter !== "all" && !isSelected ? 0.25 : 1}
                        onClick={() => { if (acledName) { setStateFilter(stateFilter === acledName ? "all" : acledName); setAcledPage(1); }}}
                        onMouseEnter={e => { if(count>0) { e.currentTarget.setAttribute("stroke","#fff"); e.currentTarget.setAttribute("stroke-width","1.5"); }}}
                        onMouseLeave={e => { if(!isSelected) { e.currentTarget.setAttribute("stroke",BORDER); e.currentTarget.setAttribute("stroke-width","0.5"); }}}
                      ><title>{state.id}: {count} eventos</title></path>
                    </g>
                  );
                })}
              </svg>
              <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:4 }}>
                {[["Bajo","#4C9F38"],["Medio","#0A97D9"],["Alto","#f59e0b"],["Crítico","#E5243B"]].map(([l,c]) =>
                  <span key={l} style={{ fontSize:9, fontFamily:font, color:c }}>■ {l}</span>
                )}
              </div>
            </div>
            {/* Ranking */}
            <div style={{ flex:1, maxHeight:mob?250:400, overflowY:"auto" }}>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, marginBottom:6, letterSpacing:"0.08em", textTransform:"uppercase" }}>Ranking por eventos</div>
              {Object.entries(byAdmin).sort((a,b) => b[1]-a[1]).map(([st,ct], idx) => {
                const mx = Math.max(...Object.values(byAdmin),1);
                const int = ct/mx;
                const bg = int>0.7?"#E5243B":int>0.4?"#f59e0b":int>0.15?"#0A97D9":"#4C9F38";
                const isActive = stateFilter === st;
                return (
                  <div key={st} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3, cursor:"pointer",
                    opacity: stateFilter!=="all"&&!isActive?0.3:1, padding:"3px 4px",
                    background: isActive?`${bg}20`:"transparent", border: isActive?`1px solid ${bg}40`:"1px solid transparent" }}
                    onClick={() => { setStateFilter(isActive?"all":st); setAcledPage(1); }}>
                    <span style={{ fontSize:10, fontFamily:font, color:MUTED, minWidth:16 }}>{idx+1}</span>
                    <span style={{ fontSize:10, fontFamily:font, color:isActive?bg:TEXT, flex:1 }}>{st}</span>
                    <div style={{ width:60, height:10, background:`${BORDER}30`, position:"relative" }}>
                      <div style={{ width:`${(ct/mx)*100}%`, height:"100%", background:bg, opacity:0.7 }} />
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:bg, fontFamily:font, minWidth:24, textAlign:"right" }}>{ct}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* ── State detail panel ── */}
        {stateFilter !== "all" && (() => {
          const stEvents = events.filter(e => e.admin1 === stateFilter);
          const stFatal = stEvents.reduce((s,e) => s+(parseInt(e.fatalities)||0), 0);
          const stExposure = stEvents.reduce((s,e) => s+(parseInt(e.population_best)||0), 0);
          const stTypes = {}; stEvents.forEach(e => { stTypes[e.event_type] = (stTypes[e.event_type]||0)+1; });
          const stActors = {}; stEvents.forEach(e => { if(e.actor1) { const a=e.actor1.slice(0,60); stActors[a]=(stActors[a]||0)+1; }});
          const stSorted = [...stEvents].sort((a,b) => (b.event_date||"").localeCompare(a.event_date||""));
          const stPage = acledPage;
          const stPP = 15;
          const stTotalP = Math.ceil(stSorted.length/stPP);
          const stPageEvents = stSorted.slice((stPage-1)*stPP, stPage*stPP);
          return (<>
            {/* State KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:8, marginTop:0 }}>
              {[
                {l:"Eventos",v:stEvents.length,c:"#E5243B"},
                {l:"Fatalidades",v:stFatal,c:"#dc2626"},
                {l:"Exposición civil",v:stExposure>1e3?`${(stExposure/1e3).toFixed(0)}K`:stExposure||"—",c:"#9b59b6"},
                {l:"Tipos de evento",v:Object.keys(stTypes).length,c:"#4C9F38"},
              ].map((k,i) => (
                <Card key={i} accent={k.c}>
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>{k.l}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:k.c, fontFamily:"'Playfair Display',serif" }}>{k.v}</div>
                </Card>
              ))}
            </div>

            {/* State type + actors */}
            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10 }}>
              <Card>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Tipos en {stateFilter}</div>
                {Object.entries(stTypes).sort((a,b) => b[1]-a[1]).map(([t,c]) => (
                  <div key={t} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:EC[t]||MUTED, minWidth:130 }}>{trad(t)}</span>
                    <div style={{ flex:1, height:12, background:`${BORDER}30`, position:"relative" }}>
                      <div style={{ width:`${(c/stEvents.length)*100}%`, height:"100%", background:EC[t]||ACCENT, opacity:0.8 }} />
                      <span style={{ position:"absolute", right:3, top:0, fontSize:9, fontFamily:font, color:TEXT }}>{c}</span>
                    </div>
                  </div>
                ))}
              </Card>
              <Card>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Actores en {stateFilter}</div>
                {Object.entries(stActors).sort((a,b) => b[1]-a[1]).slice(0,10).map(([a,c]) => (
                  <div key={a} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:MUTED, minWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a}</span>
                    <div style={{ flex:1, height:12, background:`${BORDER}30`, position:"relative" }}>
                      <div style={{ width:`${(c/Object.values(stActors).reduce((a,b)=>Math.max(a,b),1))*100}%`, height:"100%", background:`${ACCENT}70` }} />
                      <span style={{ position:"absolute", right:3, top:0, fontSize:9, fontFamily:font, color:TEXT }}>{c}</span>
                    </div>
                  </div>
                ))}
              </Card>
            </div>

            {/* State events list */}
            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
                  Eventos en {stateFilter} · {stSorted.length} registros
                </div>
                {stTotalP > 1 && (
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <button onClick={() => setAcledPage(Math.max(1,stPage-1))} disabled={stPage===1} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:stPage===1?`${MUTED}40`:TEXT, cursor:stPage===1?"default":"pointer" }}>←</button>
                    <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>{stPage}/{stTotalP}</span>
                    <button onClick={() => setAcledPage(Math.min(stTotalP,stPage+1))} disabled={stPage>=stTotalP} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:stPage>=stTotalP?`${MUTED}40`:TEXT, cursor:stPage>=stTotalP?"default":"pointer" }}>→</button>
                  </div>
                )}
              </div>
              {stPageEvents.map((e,i) => (
                <div key={i} style={{ padding:"6px 0", borderBottom:`1px solid ${BORDER}20`, display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div style={{ minWidth:62, fontSize:10, fontFamily:font, color:MUTED }}>{e.event_date}</div>
                  <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${EC[e.event_type]||ACCENT}15`, color:EC[e.event_type]||ACCENT, border:`1px solid ${EC[e.event_type]||ACCENT}25`, whiteSpace:"nowrap" }}>
                    {trad(e.sub_event_type||e.event_type)}
                  </span>
                  {parseInt(e.fatalities)>0 && <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:"#dc262615", color:"#dc2626", border:"1px solid #dc262625" }}>💀{e.fatalities}</span>}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:TEXT }}>{e.location}{e.admin2?`, ${e.admin2}`:""}</div>
                    {e.actor1 && <div style={{ fontSize:9, color:ACCENT, marginTop:1 }}>{e.actor1}</div>}
                    <div style={{ fontSize:10, color:MUTED, marginTop:2, lineHeight:1.5 }}>{(e.notes||"").slice(0,200)}{(e.notes||"").length>200?"...":""}</div>
                  </div>
                </div>
              ))}
              {stTotalP > 1 && (
                <div style={{ display:"flex", justifyContent:"center", gap:3, marginTop:8 }}>
                  {Array.from({length:Math.min(7,stTotalP)},(_,i) => {
                    let p; if(stTotalP<=7) p=i+1; else if(stPage<=4) p=i+1; else if(stPage>=stTotalP-3) p=stTotalP-6+i; else p=stPage-3+i;
                    return <button key={p} onClick={() => setAcledPage(p)} style={{ fontSize:9, fontFamily:font, padding:"2px 6px", border:`1px solid ${p===stPage?ACCENT:BORDER}`, background:p===stPage?ACCENT:"transparent", color:p===stPage?"#fff":MUTED, cursor:"pointer", minWidth:20 }}>{p}</button>;
                  })}
                </div>
              )}
            </Card>
          </>);
        })()}
      </>)}

      {/* ═══ MAP ═══ */}
      {acledView === "map" && (
        <Card>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
            Mapa de eventos · {filtered.length} puntos {filter!=="all"?`(${filter})`:""} {actorFilter!=="all"?`· ${actorFilter}`:""} {stateFilter!=="all"?`· ${stateFilter}`:""}
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
            <button onClick={() => setFilter("all")} style={{ fontSize:9, fontFamily:font, padding:"2px 6px", border:`1px solid ${filter==="all"?ACCENT:BORDER}`, background:filter==="all"?ACCENT:"transparent", color:filter==="all"?"#fff":MUTED, cursor:"pointer" }}>Todos</button>
            {typeOrder.map(t => <button key={t} onClick={() => setFilter(filter===t?"all":t)} style={{ fontSize:9, fontFamily:font, padding:"2px 6px", border:`1px solid ${filter===t?EC[t]:BORDER}`, background:filter===t?`${EC[t]}20`:"transparent", color:EC[t], cursor:"pointer" }}>{t}</button>)}
          </div>
          <LeafletMap events={filtered} EC={EC} TR={TR} />
          <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:6 }}>
            {typeOrder.map(t => <span key={t} style={{ fontSize:9, fontFamily:font, color:EC[t] }}>● {t}</span>)}
            <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>· Tamaño = fatalidades</span>
          </div>
        </Card>
      )}

      {/* ═══ CAST ═══ */}
      {acledView === "cast" && (<>
        {/* Explainer */}
        <Card accent="#f59e0b">
          <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
            <span style={{ fontSize:22 }}>🔮</span>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:4 }}>Sistema de Alerta de Conflictos (CAST)</div>
              <div style={{ fontSize:12, color:MUTED, lineHeight:1.7 }}>
                ACLED usa inteligencia artificial para predecir cuántos eventos de conflicto ocurrirán en los próximos meses en cada estado de Venezuela.
                La predicción se compara con lo que realmente se observó para medir la precisión del modelo.
                <strong style={{ color:"#f59e0b" }}> Amarillo = predicción</strong>, <strong style={{ color:ACCENT }}> Azul = realidad observada</strong>.
                Si la predicción supera lo observado, significa que ACLED espera un <strong style={{ color:"#E5243B" }}>aumento de conflicto</strong>.
              </div>
            </div>
          </div>
        </Card>

        {cast.length === 0 ? <Card><div style={{ color:MUTED, fontSize:13, fontFamily:font, textAlign:"center", padding:20 }}>No hay predicciones disponibles actualmente.</div></Card> : (<>
          {/* Summary KPIs */}
          {(() => {
            const totalF = Math.round(castByState.reduce((s,p) => s+p.total_forecast,0));
            const totalO = Math.round(castByState.reduce((s,p) => s+p.total_observed,0));
            const battlesF = Math.round(castByState.reduce((s,p) => s+p.battles_forecast,0));
            const vacF = Math.round(castByState.reduce((s,p) => s+p.vac_forecast,0));
            const diff = totalF - totalO;
            const trend = diff > 10 ? "AUMENTO" : diff < -10 ? "DESCENSO" : "ESTABLE";
            const trendColor = diff > 10 ? "#E5243B" : diff < -10 ? "#4C9F38" : "#f59e0b";
            return (
              <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(5,1fr)", gap:8, marginBottom:12 }}>
                <Card accent="#f59e0b">
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>Eventos previstos</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#f59e0b", fontFamily:"'Playfair Display',serif" }}>{totalF}</div>
                  <div style={{ fontSize:9, color:MUTED }}>Próximos meses</div>
                </Card>
                <Card accent={ACCENT}>
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>Eventos observados</div>
                  <div style={{ fontSize:20, fontWeight:800, color:ACCENT, fontFamily:"'Playfair Display',serif" }}>{totalO}</div>
                  <div style={{ fontSize:9, color:MUTED }}>Hasta ahora</div>
                </Card>
                <Card accent={trendColor}>
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>Tendencia</div>
                  <div style={{ fontSize:16, fontWeight:800, color:trendColor, fontFamily:"'Syne',sans-serif" }}>{trend}</div>
                  <div style={{ fontSize:9, color:MUTED }}>{diff > 0 ? `+${diff}` : diff} vs observado</div>
                </Card>
                <Card accent="#E5243B">
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>Batallas previstas</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#E5243B", fontFamily:"'Playfair Display',serif" }}>{battlesF}</div>
                  <div style={{ fontSize:9, color:MUTED }}>Enfrentamientos armados</div>
                </Card>
                <Card accent="#dc2626">
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>Violencia civil prev.</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#dc2626", fontFamily:"'Playfair Display',serif" }}>{vacF}</div>
                  <div style={{ fontSize:9, color:MUTED }}>Contra civiles</div>
                </Card>
              </div>
            );
          })()}

          {/* State-by-state risk table */}
          <Card>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
              Nivel de riesgo por estado · Previsto vs Observado
            </div>
            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10 }}>
              {/* Risk map */}
              <div>
                {castByState.map((p,i) => {
                  const f = Math.round(p.total_forecast), o = Math.round(p.total_observed);
                  const maxBar = Math.max(...castByState.map(q => Math.max(q.total_forecast, q.total_observed)), 1);
                  const diff = f - o;
                  const riskColor = f > 20 ? "#E5243B" : f > 10 ? "#f59e0b" : f > 3 ? "#0A97D9" : "#4C9F38";
                  const riskLabel = f > 20 ? "ALTO" : f > 10 ? "MEDIO" : f > 3 ? "BAJO" : "MÍN.";
                  const isSel = castState === p.admin1;
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, padding:"3px 4px", cursor:"pointer",
                      background: isSel ? `${riskColor}15` : i < 3 ? `${riskColor}08` : "transparent",
                      border: isSel ? `1px solid ${riskColor}40` : "1px solid transparent",
                      opacity: castState && !isSel ? 0.35 : 1 }}
                      onClick={() => setCastState(isSel ? null : p.admin1)}>
                      <span style={{ fontSize:9, fontFamily:font, padding:"1px 4px", background:`${riskColor}20`, color:riskColor,
                        border:`1px solid ${riskColor}30`, minWidth:32, textAlign:"center", fontWeight:700 }}>{riskLabel}</span>
                      <span style={{ fontSize:10, fontFamily:font, color:isSel ? riskColor : TEXT, fontWeight:isSel?700:400, minWidth:100 }}>{p.admin1}</span>
                      <div style={{ flex:1, height:16, position:"relative", background:`${BORDER}20` }}>
                        <div style={{ position:"absolute", top:0, left:0, height:7, width:`${(f/maxBar)*100}%`, background:"#f59e0b", opacity:0.8, borderRadius:"1px 1px 0 0" }} />
                        <div style={{ position:"absolute", top:8, left:0, height:7, width:`${(o/maxBar)*100}%`, background:ACCENT, opacity:0.8, borderRadius:"0 0 1px 1px" }} />
                      </div>
                      <span style={{ fontSize:9, fontFamily:font, color:"#f59e0b", minWidth:20, textAlign:"right" }}>{f}</span>
                      <span style={{ fontSize:9, fontFamily:font, color:ACCENT, minWidth:20, textAlign:"right" }}>{o}</span>
                      <span style={{ fontSize:9, fontFamily:font, color: diff > 0 ? "#E5243B" : "#4C9F38", minWidth:28, textAlign:"right" }}>
                        {diff > 0 ? `↑${diff}` : diff < 0 ? `↓${Math.abs(diff)}` : "="}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Explanation sidebar OR selected state detail */}
              <div style={{ padding:8 }}>
                {!castState ? (<>
                  <div style={{ fontSize:12, fontWeight:600, color:TEXT, marginBottom:8 }}>¿Cómo leer esta tabla?</div>
                  <div style={{ fontSize:10, color:MUTED, lineHeight:1.8, marginBottom:12 }}>
                    Cada fila es un estado. Las barras muestran eventos previstos (amarillo) vs observados (azul). Click en un estado para ver el detalle.
                  </div>
                  <div style={{ fontSize:10, color:MUTED, lineHeight:1.8, marginBottom:12 }}>
                    La flecha indica si se espera <strong style={{ color:"#E5243B" }}>↑ más conflicto</strong> o <strong style={{ color:"#4C9F38" }}>↓ menos</strong>.
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:TEXT, marginBottom:6 }}>Niveles de riesgo</div>
                  {[
                    {l:"ALTO",c:"#E5243B",d:">20 eventos. Máxima alerta."},
                    {l:"MEDIO",c:"#f59e0b",d:"10-20 eventos. Monitoreo activo."},
                    {l:"BAJO",c:"#0A97D9",d:"3-10 eventos. Situación controlada."},
                    {l:"MÍN.",c:"#4C9F38",d:"<3 eventos. Sin alertas."},
                  ].map((r,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                      <span style={{ fontSize:9, fontFamily:font, padding:"1px 4px", background:`${r.c}20`, color:r.c, border:`1px solid ${r.c}30`, minWidth:36, textAlign:"center", fontWeight:700 }}>{r.l}</span>
                      <span style={{ fontSize:10, color:MUTED }}>{r.d}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", gap:12, marginTop:10 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:"#f59e0b" }}>■ Previsto</span>
                    <span style={{ fontSize:9, fontFamily:font, color:ACCENT }}>■ Observado</span>
                  </div>
                </>) : (<>
                  {/* Selected state detail */}
                  {(() => {
                    const cp = castByState.find(p => p.admin1 === castState);
                    if (!cp) return null;
                    const f = Math.round(cp.total_forecast), o = Math.round(cp.total_observed);
                    const bf = Math.round(cp.battles_forecast), vf = Math.round(cp.vac_forecast), ef = Math.round(cp.erv_forecast);
                    const diff = f - o;
                    const riskColor = f > 20 ? "#E5243B" : f > 10 ? "#f59e0b" : f > 3 ? "#0A97D9" : "#4C9F38";
                    const riskLabel = f > 20 ? "ALTO" : f > 10 ? "MEDIO" : f > 3 ? "BAJO" : "MÍNIMO";
                    // Real events from ACLED for this state
                    const stEvents = events.filter(e => e.admin1 && (
                      e.admin1.toLowerCase().includes(castState.toLowerCase()) ||
                      castState.toLowerCase().includes(e.admin1.toLowerCase())
                    )).sort((a,b) => (b.event_date||"").localeCompare(a.event_date||""));
                    const stTypes = {}; stEvents.forEach(e => { stTypes[e.event_type]=(stTypes[e.event_type]||0)+1; });
                    const stFatal = stEvents.reduce((s,e) => s+(parseInt(e.fatalities)||0), 0);
                    return (
                      <div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:riskColor }}>{castState}</div>
                          <span style={{ fontSize:10, fontFamily:font, color:MUTED, cursor:"pointer" }} onClick={() => setCastState(null)}>✕ Cerrar</span>
                        </div>
                        {/* Risk badge */}
                        <div style={{ display:"inline-block", padding:"3px 10px", background:`${riskColor}20`, color:riskColor, border:`1px solid ${riskColor}40`, fontSize:13, fontWeight:700, fontFamily:font, marginBottom:10 }}>
                          Riesgo {riskLabel}
                        </div>
                        {/* CAST predictions */}
                        <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Predicción CAST</div>
                        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:4, marginBottom:10 }}>
                          {[
                            {l:"Total previsto",v:f,c:"#f59e0b"},{l:"Total observado",v:o,c:ACCENT},
                            {l:"Batallas prev.",v:bf,c:"#E5243B"},{l:"Violencia civil",v:vf,c:"#dc2626"},
                          ].map((k,i) => (
                            <div key={i} style={{ padding:"4px 6px", background:BG2, border:`1px solid ${BORDER}` }}>
                              <div style={{ fontSize:8, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>{k.l}</div>
                              <div style={{ fontSize:16, fontWeight:800, color:k.c, fontFamily:"'Playfair Display',serif" }}>{k.v}</div>
                            </div>
                          ))}
                        </div>
                        {/* Trend */}
                        <div style={{ padding:"6px 8px", background:`${diff>0?"#E5243B":"#4C9F38"}10`, border:`1px solid ${diff>0?"#E5243B":"#4C9F38"}30`, marginBottom:10 }}>
                          <span style={{ fontSize:12, color:diff>0?"#E5243B":"#4C9F38", fontWeight:700 }}>
                            {diff > 0 ? `↑ Se esperan ${diff} eventos más de los observados` : diff < 0 ? `↓ Se esperan ${Math.abs(diff)} eventos menos` : "= Predicción alineada con lo observado"}
                          </span>
                        </div>
                        {/* Real events from ACLED */}
                        <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Datos reales ACLED · {stEvents.length} eventos</div>
                        {stEvents.length > 0 ? (<>
                          <div style={{ marginBottom:8 }}>
                            {Object.entries(stTypes).sort((a,b) => b[1]-a[1]).map(([t,c]) => (
                              <div key={t} style={{ display:"flex", alignItems:"center", gap:4, marginBottom:2 }}>
                                <span style={{ fontSize:9, fontFamily:font, color:EC[t]||MUTED, minWidth:100 }}>{trad(t)}</span>
                                <div style={{ flex:1, height:8, background:`${BORDER}30` }}>
                                  <div style={{ width:`${(c/stEvents.length)*100}%`, height:"100%", background:EC[t]||ACCENT, opacity:0.7 }} />
                                </div>
                                <span style={{ fontSize:9, color:EC[t]||TEXT, fontFamily:font }}>{c}</span>
                              </div>
                            ))}
                          </div>
                          {stFatal > 0 && <div style={{ fontSize:10, color:"#dc2626", marginBottom:6 }}>💀 {stFatal} fatalidades registradas</div>}
                          <div style={{ fontSize:9, fontFamily:font, color:MUTED, marginBottom:4 }}>Últimos eventos:</div>
                          {stEvents.slice(0,5).map((e,i) => (
                            <div key={i} style={{ padding:"3px 0", borderBottom:`1px solid ${BORDER}15`, fontSize:10 }}>
                              <span style={{ color:MUTED, fontFamily:font }}>{e.event_date}</span>
                              <span style={{ color:EC[e.event_type]||ACCENT, marginLeft:6 }}>{trad(e.sub_event_type||e.event_type)}</span>
                              {parseInt(e.fatalities)>0 && <span style={{ color:"#dc2626", marginLeft:4 }}>💀{e.fatalities}</span>}
                              <div style={{ fontSize:9, color:MUTED, marginTop:1 }}>{e.location}</div>
                            </div>
                          ))}
                          {stEvents.length > 5 && <div style={{ fontSize:9, color:ACCENT, marginTop:4, cursor:"pointer" }}
                            onClick={() => { setStateFilter(castState); setAcledView("overview"); }}>
                            Ver los {stEvents.length} eventos en Vista General →
                          </div>}
                        </>) : (
                          <div style={{ fontSize:10, color:MUTED }}>No hay eventos ACLED registrados para este estado en el período actual.</div>
                        )}
                      </div>
                    );
                  })()}
                </>)}
              </div>
            </div>
          </Card>
        </>)}
      </>)}

      {/* ═══ EVENTS ═══ */}
      {acledView === "events" && (<>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
          <button onClick={() => { setFilter("all"); setAcledPage(1); }} style={{ fontSize:9, fontFamily:font, padding:"3px 7px", border:`1px solid ${filter==="all"?ACCENT:BORDER}`, background:filter==="all"?ACCENT:"transparent", color:filter==="all"?"#fff":MUTED, cursor:"pointer" }}>Todos ({events.length})</button>
          {typeOrder.map(t => <button key={t} onClick={() => { setFilter(filter===t?"all":t); setAcledPage(1); }} style={{ fontSize:9, fontFamily:font, padding:"3px 7px", border:`1px solid ${filter===t?EC[t]:BORDER}`, background:filter===t?`${EC[t]}20`:"transparent", color:EC[t], cursor:"pointer" }}>{trad(t)} ({byType[t]})</button>)}
        </div>
        {actorFilter !== "all" && <div style={{ fontSize:10, fontFamily:font, color:ACCENT, marginBottom:8, cursor:"pointer" }} onClick={() => setActorFilter("all")}>Filtro actor: <strong>{actorFilter}</strong> ✕</div>}
        {stateFilter !== "all" && <div style={{ fontSize:10, fontFamily:font, color:"#f59e0b", marginBottom:8, cursor:"pointer" }} onClick={() => setStateFilter("all")}>Filtro estado: <strong>{stateFilter}</strong> ✕</div>}
        <Card>
          {(() => {
            const PP = 20, totalP = Math.ceil(sorted.length/PP), page = sorted.slice((acledPage-1)*PP, acledPage*PP);
            return (<>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>{sorted.length} eventos</div>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <button onClick={() => setAcledPage(Math.max(1,acledPage-1))} disabled={acledPage===1} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:acledPage===1?`${MUTED}40`:TEXT, cursor:acledPage===1?"default":"pointer" }}>←</button>
                  <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>{acledPage}/{totalP}</span>
                  <button onClick={() => setAcledPage(Math.min(totalP,acledPage+1))} disabled={acledPage>=totalP} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:acledPage>=totalP?`${MUTED}40`:TEXT, cursor:acledPage>=totalP?"default":"pointer" }}>→</button>
                </div>
              </div>
              {page.map((e,i) => (
                <div key={i} style={{ padding:"7px 0", borderBottom:`1px solid ${BORDER}20`, display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div style={{ minWidth:62, fontSize:10, fontFamily:font, color:MUTED }}>{e.event_date}</div>
                  <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${EC[e.event_type]||ACCENT}15`, color:EC[e.event_type]||ACCENT, border:`1px solid ${EC[e.event_type]||ACCENT}25`, whiteSpace:"nowrap" }}>{trad(e.sub_event_type||e.event_type)}</span>
                  {parseInt(e.fatalities)>0 && <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:"#dc262615", color:"#dc2626", border:"1px solid #dc262625" }}>💀{e.fatalities}</span>}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:TEXT }}>{e.location}{e.admin1?`, ${e.admin1}`:""}</div>
                    {e.actor1 && <div style={{ fontSize:9, color:ACCENT, marginTop:1, cursor:"pointer" }} onClick={() => { setActorFilter(e.actor1.slice(0,50)); setAcledPage(1); }}>{e.actor1}</div>}
                    <div style={{ fontSize:10, color:MUTED, marginTop:2, lineHeight:1.5 }}>{(e.notes||"").slice(0,220)}{(e.notes||"").length>220?"...":""}</div>
                  </div>
                </div>
              ))}
              {totalP > 1 && <div style={{ display:"flex", justifyContent:"center", gap:3, marginTop:10 }}>
                {Array.from({length:Math.min(9,totalP)},(_,i) => {
                  let p; if(totalP<=9) p=i+1; else if(acledPage<=5) p=i+1; else if(acledPage>=totalP-4) p=totalP-8+i; else p=acledPage-4+i;
                  return <button key={p} onClick={() => setAcledPage(p)} style={{ fontSize:9, fontFamily:font, padding:"2px 6px", border:`1px solid ${p===acledPage?ACCENT:BORDER}`, background:p===acledPage?ACCENT:"transparent", color:p===acledPage?"#fff":MUTED, cursor:"pointer", minWidth:20 }}>{p}</button>;
                })}
              </div>}
            </>);
          })()}
        </Card>
      </>)}
    </div>
  );
}
