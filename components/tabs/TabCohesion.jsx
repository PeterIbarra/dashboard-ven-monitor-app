import { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Card } from "../Card";
import { CohesionChart } from "../charts/CohesionChart";
import { ICG_HISTORY } from "../../data/weekly.js";
import { BG3, BORDER, TEXT, MUTED, ACCENT, font, fontSans } from "../../constants";
import { IS_DEPLOYED } from "../../utils";

export function TabCohesion({ liveData = {} }) {
  const mob = useIsMobile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [aiExplain, setAiExplain] = useState(null);
  const [aiExplainLoading, setAiExplainLoading] = useState(false);
  const [dataSource, setDataSource] = useState("");

  // Step 1: liveData → Supabase cached ICG → live API → mock
  useEffect(() => {
    if (liveData?.cohesion) {
      setData(liveData.cohesion);
      setDataSource("live");
      setLoading(false);
      return;
    }
    async function fetchCohesion() {
      // Try Supabase cached ICG first (from cron, no AI call)
      if (IS_DEPLOYED) {
        try {
          const cacheRes = await fetch("/api/articles?type=icg", { signal: AbortSignal.timeout(6000) });
          if (cacheRes.ok) {
            const cacheData = await cacheRes.json();
            if (cacheData.cached && cacheData.icg?.index != null) {
              const icg = cacheData.icg;
              const level = icg.index >= 75 ? "ALTA" : icg.index >= 55 ? "MEDIA" : icg.index >= 35 ? "BAJA" : "CRITICA";
              const actors = (icg.actors || []).map(a => ({
                actor: a.actor, name: a.actor, status: a.alignment,
                confidence: a.confidence, evidence: a.evidence, signals: a.signals || [],
                mentions: 0, tone: 0, topHeadlines: [],
              }));
              setData({
                index: icg.index, level, actors,
                systemic: actors.filter(a => ["psuv","chavismo","colectivos","gobernadores","militares"].some(s => a.actor?.toLowerCase().includes(s))),
                engine: `cached/${icg.provider || "cron"}`, fetchedAt: icg.date + "T06:00:00Z",
                cachedDate: icg.date,
              });
              setDataSource("supabase");
              setLoading(false);
              return;
            }
          }
        } catch {}

        // Fallback: live API (full computation with AI)
        try {
          const latestSitrep = [...ICG_HISTORY].reverse().find(h => h.sitrep && h.score != null);
          const sitrepParam = latestSitrep ? `&sitrep=${latestSitrep.score}` : "";
          const res = await fetch(`/api/news?source=cohesion${sitrepParam}&_t=${Date.now()}`, { signal: AbortSignal.timeout(30000) });
          if (res.ok) { const json = await res.json(); if (json.index != null) { setData(json); setDataSource("live"); setLoading(false); return; } }
        } catch (e) { setError(e.message); }
      }
      // Fallback: mock data so the tab always renders
      setData({
        index:66, level:"MEDIA",
        components:{
          aiAlignment:{score:62,weight:0.30}, gdeltToneDivergence:{score:70,weight:0.15},
          mentionSilence:{score:75,weight:0.15}, polymarketDelta:{score:55,weight:0.10},
          sitrepValidation:{score:66,weight:0.30},
        },
        hasSitrep:true,
        actors:[
          {actor:"delcy",name:"Delcy Rodríguez",status:"ALINEADO",confidence:0.88,evidence:"Conduce relaciones bilaterales y agenda legislativa",signals:["Reconocida por Trump","Firma Amnistía"],mentions:45,tone:-2.1,topHeadlines:[]},
          {actor:"jrodriguez",name:"Jorge Rodríguez",status:"ALINEADO",confidence:0.82,evidence:"Dirige AN. Legislación activa",signals:["Ley Amnistía","Ley Hidrocarburos"],mentions:32,tone:-1.8,topHeadlines:[]},
          {actor:"cabello",name:"Diosdado Cabello",status:"NEUTRO",confidence:0.65,evidence:"Perfil mediático reducido. Sin confrontación pública",signals:["Baja visibilidad","Sin declaraciones divergentes"],mentions:18,tone:-3.5,topHeadlines:[]},
          {actor:"fanb",name:"Fuerza Armada Nacional Bolivariana (FANB)",status:"TENSION",confidence:0.72,evidence:"Reafirma lealtad institucional pero presiones de oxigenación",signals:["Demandas internas","Cubanos retirándose"],mentions:28,tone:-4.2,topHeadlines:[]},
          {actor:"padrino",name:"Vladimir Padrino López",status:"TENSION",confidence:0.68,evidence:"12 años en el cargo. Señales de malestar por continuidad de cúpula",signals:["Padrino 12 años","Reportaje El País"],mentions:15,tone:-3.8,topHeadlines:[]},
          {actor:"arreaza",name:"Jorge Arreaza",status:"NEUTRO",confidence:0.55,evidence:"Perfil bajo post-reestructuración. Sin señales claras",signals:["Baja visibilidad reciente"],mentions:10,tone:-2.5,topHeadlines:[]},
          {actor:"maduroguerra",name:"Nicolás Maduro Guerra",status:"NEUTRO",confidence:0.50,evidence:"Baja exposición mediática desde captura del padre",signals:["Sin rol público visible"],mentions:8,tone:-3.0,topHeadlines:[]},
          {actor:"an",name:"Asamblea Nacional",status:"ALINEADO",confidence:0.85,evidence:"Legislando activamente bajo dirección de J.Rodríguez",signals:["Amnistía operativa","Poder Ciudadano"],mentions:38,tone:-1.5,topHeadlines:[]},
        ],
        systemic:[
          {actor:"psuv",name:"PSUV",status:"ALINEADO",confidence:0.70,evidence:"Partido activo en agenda legislativa y gobernaciones",signals:["Congreso PSUV","Gobernaciones activas"],mentions:25,tone:-2.8,topHeadlines:[]},
          {actor:"chavismo",name:"Chavismo (movimiento)",status:"NEUTRO",confidence:0.55,evidence:"Cobertura mixta: unidad declarada pero tensiones internas",signals:["Discurso unidad","Señales fractura"],mentions:30,tone:-4.1,topHeadlines:[]},
          {actor:"colectivos",name:"Colectivos",status:"TENSION",confidence:0.60,evidence:"Actividad reducida. Señales de reconfiguración post-Maduro",signals:["Baja visibilidad","Reconfiguración"],mentions:12,tone:-5.5,topHeadlines:[]},
          {actor:"gobernadores",name:"Gobernadores chavistas",status:"ALINEADO",confidence:0.65,evidence:"Alineados con ejecutivo central en gestión regional",signals:["Gestión coordinada"],mentions:18,tone:-2.2,topHeadlines:[]},
          {actor:"militares",name:"Sector militar amplio",status:"NEUTRO",confidence:0.58,evidence:"CEOFANB y GNB sin señales públicas de fractura",signals:["Perfil bajo","Sin pronunciamientos"],mentions:20,tone:-3.9,topHeadlines:[]},
        ],
        polymarket:{price:0.57,question:"Delcy líder fin de 2026"},
        fetchedAt:new Date().toISOString(), engine:"mock",
      });
      setDataSource("mock");
      setLoading(false);
    }
    fetchCohesion();
  }, [liveData?.cohesion]);

  // AI Explanation button handler
  async function handleAiExplain() {
    if (aiExplain || aiExplainLoading || !data) return;
    setAiExplainLoading(true);
    const allActors = [...(data.actors || []), ...(data.systemic || [])];
    const actorSummary = allActors.map(a => {
      const sigs = (a.signals || []).join(", ");
      return `- ${a.name}: ${a.status} (confianza ${(a.confidence*100).toFixed(0)}%)\n  Evidencia: ${a.evidence}${sigs ? `\n  Señales: ${sigs}` : ""}`;
    }).join("\n");

    const aligned = allActors.filter(a => a.status === "ALINEADO").length;
    const tension = allActors.filter(a => a.status === "TENSION").length;
    const neutral = allActors.filter(a => a.status === "NEUTRO").length;

    const prompt = `Eres analista senior de riesgo político del PNUD Venezuela. Debes explicar el puntaje actual del Índice de Cohesión de Gobierno (ICG).

DATOS DEL ICG:
- Puntaje: ${data.index}/100 (nivel: ${data.level})
- Actores alineados: ${aligned}/${allActors.length}
- En tensión: ${tension}/${allActors.length}
- Neutros: ${neutral}/${allActors.length}

DETALLE POR ACTOR:
${actorSummary}

INSTRUCCIONES:
1. Escribe un análisis de 4-5 párrafos explicando POR QUÉ el ICG tiene ${data.index} puntos.
2. Sé ESPECÍFICO: nombra actores concretos, cita las señales y evidencia proporcionadas, explica las dinámicas de poder.
3. Identifica los 2-3 principales factores de riesgo para la cohesión con ejemplos concretos.
4. Señala qué actores son los más críticos para vigilar en las próximas semanas y por qué.
5. Concluye con una frase sobre la tendencia probable (se fortalece, se debilita, se mantiene).
6. Lenguaje profesional, analítico, directo. No uses formato markdown (sin asteriscos, sin #, sin listas con guiones). Usa texto plano con párrafos separados.
7. Máximo 300 palabras.`;

    try {
      if (IS_DEPLOYED) {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, max_tokens: 600 }),
          signal: AbortSignal.timeout(30000),
        });
        if (res.ok) {
          const d = await res.json();
          if (d.text) { setAiExplain({ text: d.text, provider: d.provider }); }
        }
      }
    } catch {}
    setAiExplainLoading(false);
  }

  // Render AI text with **bold** markdown support
  function renderAiText(text) {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <b key={i} style={{ color:TEXT, fontWeight:600 }}>{part.slice(2, -2)}</b>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  const statusColor = {ALINEADO:"#16a34a",NEUTRO:"#ca8a04",TENSION:"#dc2626",SILENCIO:"#6b7280"};
  const statusIcon = {ALINEADO:"✓",NEUTRO:"◉",TENSION:"⚠",SILENCIO:"○"};
  const statusLabel = {ALINEADO:"Alineado",NEUTRO:"Neutro",TENSION:"Tensión",SILENCIO:"Silencio"};
  const levelColor = {ALTA:"#16a34a",MEDIA:"#ca8a04",BAJA:"#f97316",CRITICA:"#dc2626"};

  const [dailyICG, setDailyICG] = useState([]);

  // Fetch daily ICG readings from Supabase for chart (post-S9)
  useEffect(() => {
    if (!IS_DEPLOYED) return;
    async function fetchDailyICG() {
      try {
        const res = await fetch("/api/articles?type=icg_history", { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const d = await res.json();
          if (d.readings?.length) setDailyICG(d.readings);
        }
      } catch {}
    }
    fetchDailyICG();
  }, []);

  // Build chart data: weekly S1-S9 + daily readings after that
  const historyData = useMemo(() => {
    const weekly = ICG_HISTORY.map((h,i) => ({
      ...h, score: i===ICG_HISTORY.length-1 && data?.index && dailyICG.length === 0 ? data.index : h.score,
    })).filter(h => h.score !== null);
    // Append daily readings after last week
    if (dailyICG.length > 0) {
      dailyICG.forEach(r => {
        weekly.push({ week: r.date.slice(5), score: r.icg_score, note: `Diario · ${r.icg_provider || "cron"}`, daily: true });
      });
    }
    return weekly;
  }, [data?.index, dailyICG]);

  if (loading) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:60 }}>
        <div style={{ width:40, height:40, border:`3px solid ${BORDER}`, borderTopColor:ACCENT, borderRadius:"50%", animation:"pulse 1s linear infinite" }} />
        <div style={{ fontFamily:font, fontSize:13, color:MUTED, letterSpacing:"0.1em" }}>CALCULANDO ÍNDICE DE COHESIÓN...</div>
        <div style={{ fontFamily:font, fontSize:11, color:`${MUTED}80` }}>Analizando 8 actores · GDELT · Polymarket · Mistral IA</div>
      </div>
    );
  }

  if (!data) return <Card><div style={{ color:MUTED, fontFamily:font, fontSize:13, textAlign:"center", padding:20 }}>Error cargando índice{error && `: ${error}`}</div></Card>;

  const score = data.index;
  const level = data.level;
  const col = levelColor[level] || MUTED;
  const actors = data.actors || [];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* KPI ROW */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr 1fr", gap:12 }}>
        <Card accent={col}>
          <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Índice de Cohesión</div>
          <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
            <span style={{ fontSize:42, fontWeight:800, fontFamily:font, color:col, lineHeight:1 }}>{score}</span>
            <span style={{ fontSize:14, fontFamily:font, color:col }}>/ 100</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:col, boxShadow:`0 0 6px ${col}` }} />
            <span style={{ fontSize:13, fontFamily:font, fontWeight:600, color:col }}>{level}</span>
          </div>
        </Card>
        <Card>
          <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Actores alineados</div>
          <div style={{ fontSize:32, fontWeight:700, fontFamily:font, color:"#16a34a", lineHeight:1 }}>
            {actors.filter(a=>a.status==="ALINEADO").length}<span style={{ fontSize:16, color:MUTED }}> / {actors.length}</span>
          </div>
          <div style={{ display:"flex", gap:4, marginTop:8 }}>
            {actors.map(a => <span key={a.actor} style={{ width:20, height:6, borderRadius:3, background:statusColor[a.status]||BORDER }} />)}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Delcy líder (PM)</div>
          <div style={{ fontSize:32, fontWeight:700, fontFamily:font, color:ACCENT, lineHeight:1 }}>
            {data.polymarket?.price!=null ? `${(data.polymarket.price*100).toFixed(0)}%` : "—"}
          </div>
          <div style={{ fontSize:11, fontFamily:font, color:MUTED, marginTop:6 }}>Polymarket · Probabilidad implícita</div>
        </Card>
        <Card>
          <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Motor</div>
          <div style={{ fontSize:14, fontWeight:600, fontFamily:font, color:TEXT, lineHeight:1.3 }}>{data.hasSitrep?"SITREP + IA":"Solo IA"}</div>
          <div style={{ fontSize:11, fontFamily:font, color:MUTED, marginTop:6, lineHeight:1.4 }}>
            {data.engine==="mistral+gdelt"?"Mistral + GDELT + Polymarket":data.engine==="gdelt-only"?"GDELT + Polymarket":"Datos en carga"}
          </div>
          <div style={{ fontSize:10, fontFamily:font, color:`${MUTED}80`, marginTop:4 }}>
            {new Date(data.fetchedAt).toLocaleString("es-VE",{timeZone:"America/Caracas"})}
          </div>
        </Card>
      </div>

      {/* AI Explanation — top of section */}
      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        {!aiExplain && (
          <button onClick={handleAiExplain} disabled={aiExplainLoading}
            style={{ fontSize:11, fontFamily:font, padding:"7px 14px", border:`1px solid ${ACCENT}`,
              background:aiExplainLoading?BG3:"transparent", color:ACCENT, cursor:aiExplainLoading?"wait":"pointer",
              letterSpacing:"0.06em", display:"flex", alignItems:"center", gap:6 }}>
            {aiExplainLoading ? (
              <><span style={{ width:10, height:10, border:`2px solid ${BORDER}`, borderTopColor:ACCENT, borderRadius:"50%", animation:"pulse 1s linear infinite", display:"inline-block" }} /> Analizando con IA...</>
            ) : (
              <>🤖 Explicar puntaje con IA</>
            )}
          </button>
        )}
        {dataSource === "supabase" && <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>Datos cacheados · {data.cachedDate}</span>}
      </div>
      {aiExplain && (
        <Card accent="#8b5cf6">
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
            <span style={{ fontSize:12 }}>🤖</span>
            <span style={{ fontSize:10, fontFamily:font, fontWeight:700, color:"#8b5cf6", letterSpacing:"0.08em" }}>ANÁLISIS IA — ICG {data.index}/100 ({data.level})</span>
            {aiExplain.provider && (
              <span style={{ fontSize:7, fontFamily:font, padding:"1px 5px", background:"#8b5cf615", color:"#8b5cf6", border:"1px solid #8b5cf630" }}>
                {aiExplain.provider.toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ fontSize:12, fontFamily:fontSans, color:MUTED, lineHeight:1.7, whiteSpace:"pre-wrap" }}>
            {renderAiText(aiExplain.text)}
          </div>
        </Card>
      )}

      {/* THERMOMETER */}
      <Card>
        <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Termómetro de Cohesión</div>
        <div style={{ position:"relative", height:40, background:"linear-gradient(to right, #dc2626, #f97316, #ca8a04, #16a34a)", borderRadius:6, overflow:"hidden" }}>
          {[25,50,75].map(v => <div key={v} style={{ position:"absolute", left:`${v}%`, top:0, bottom:0, width:1, background:"rgba(255,255,255,0.4)" }} />)}
          <div style={{ position:"absolute", left:`${score}%`, top:-4, transform:"translateX(-50%)", width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:`10px solid ${TEXT}` }} />
          <div style={{ position:"absolute", left:`${score}%`, bottom:-4, transform:"translateX(-50%)", width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderBottom:`10px solid ${TEXT}` }} />
          <div style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", fontSize:9, fontFamily:font, color:"#fff", fontWeight:700, textShadow:"0 1px 2px rgba(0,0,0,0.5)" }}>CRÍTICA</div>
          <div style={{ position:"absolute", left:"27%", top:"50%", transform:"translateY(-50%)", fontSize:9, fontFamily:font, color:"#fff", fontWeight:700, textShadow:"0 1px 2px rgba(0,0,0,0.5)" }}>BAJA</div>
          <div style={{ position:"absolute", left:"52%", top:"50%", transform:"translateY(-50%)", fontSize:9, fontFamily:font, color:"#fff", fontWeight:700, textShadow:"0 1px 2px rgba(0,0,0,0.5)" }}>MEDIA</div>
          <div style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:9, fontFamily:font, color:"#fff", fontWeight:700, textShadow:"0 1px 2px rgba(0,0,0,0.5)" }}>ALTA</div>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontSize:9, fontFamily:font, color:MUTED }}>
          <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
        </div>
      </Card>

      {/* ACTOR SEMAPHORE */}
      <Card>
        <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>Semáforo por Actor</div>
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"repeat(auto-fill, minmax(180px, 1fr))", gap:10 }}>
          {actors.map(a => {
            const isExp = expanded===a.actor;
            const ac = statusColor[a.status]||MUTED;
            return (
              <div key={a.actor} onClick={()=>setExpanded(isExp?null:a.actor)}
                style={{ background:BG3, border:`1px solid ${isExp?ac:BORDER}`, borderRadius:8, padding:"14px 12px",
                  cursor:"pointer", transition:"all 0.2s", borderLeft:`4px solid ${ac}` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:TEXT }}>{a.name}</span>
                  <span style={{ fontSize:16, color:ac }}>{statusIcon[a.status]}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:ac, boxShadow:`0 0 4px ${ac}` }} />
                  <span style={{ fontSize:12, fontFamily:font, fontWeight:600, color:ac }}>{statusLabel[a.status]}</span>
                  {a.confidence!=null && <span style={{ fontSize:10, fontFamily:font, color:MUTED, marginLeft:"auto" }}>{(a.confidence*100).toFixed(0)}%</span>}
                </div>
                {isExp && (
                  <div style={{ marginTop:10, borderTop:`1px solid ${BORDER}`, paddingTop:10 }}>
                    {a.evidence && <div style={{ fontSize:12, color:TEXT, lineHeight:1.5, marginBottom:6 }}>{a.evidence}</div>}
                    {a.signals?.length>0 && (
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:6 }}>
                        {a.signals.map((s,i) => <span key={i} style={{ fontSize:10, fontFamily:font, padding:"2px 6px", background:`${ac}15`, color:ac, border:`1px solid ${ac}30`, borderRadius:10 }}>{s}</span>)}
                      </div>
                    )}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, fontSize:11, fontFamily:font, color:MUTED }}>
                      <div>Menciones 7d: <span style={{ color:TEXT, fontWeight:600 }}>{a.mentions}</span></div>
                      <div>Tono GDELT: <span style={{ color:a.tone!=null&&a.tone<-3?"#dc2626":a.tone!=null&&a.tone<-1?"#ca8a04":"#16a34a", fontWeight:600 }}>{a.tone?.toFixed(1)??"—"}</span></div>
                    </div>
                    {a.topHeadlines?.length>0 && (
                      <div style={{ marginTop:8 }}>
                        <div style={{ fontSize:10, fontFamily:font, color:MUTED, marginBottom:4 }}>Titulares recientes:</div>
                        {a.topHeadlines.slice(0,2).map((h,i) => (
                          <a key={i} href={h.link} target="_blank" rel="noopener noreferrer"
                            style={{ display:"block", fontSize:11, color:ACCENT, textDecoration:"none", lineHeight:1.4, marginBottom:2 }}>↗ {h.title?.substring(0,80)}</a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* SYSTEMIC COHESION — Chavismo as a bloc, same card format as actors */}
      {data.systemic?.length > 0 && (
        <Card>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>
            🔴 Cohesión Sistémica · Chavismo como Bloque
          </div>
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"repeat(auto-fill, minmax(180px, 1fr))", gap:10 }}>
            {data.systemic.map(a => {
              const isExp = expanded===a.actor;
              const ac = statusColor[a.status]||MUTED;
              return (
                <div key={a.actor} onClick={()=>setExpanded(isExp?null:a.actor)}
                  style={{ background:BG3, border:`1px solid ${isExp?ac:BORDER}`, borderRadius:8, padding:"14px 12px",
                    cursor:"pointer", transition:"all 0.2s", borderLeft:`4px solid ${ac}` }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:TEXT }}>{a.name}</span>
                    <span style={{ fontSize:16, color:ac }}>{statusIcon[a.status]}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:ac, boxShadow:`0 0 4px ${ac}` }} />
                    <span style={{ fontSize:12, fontFamily:font, fontWeight:600, color:ac }}>{statusLabel[a.status]}</span>
                    {a.confidence!=null && <span style={{ fontSize:10, fontFamily:font, color:MUTED, marginLeft:"auto" }}>{(a.confidence*100).toFixed(0)}%</span>}
                  </div>
                  {isExp && (
                    <div style={{ marginTop:10, borderTop:`1px solid ${BORDER}`, paddingTop:10 }}>
                      {a.evidence && <div style={{ fontSize:12, color:TEXT, lineHeight:1.5, marginBottom:6 }}>{a.evidence}</div>}
                      {a.signals?.length>0 && (
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:6 }}>
                          {a.signals.map((s,i) => <span key={i} style={{ fontSize:10, fontFamily:font, padding:"2px 6px", background:`${ac}15`, color:ac, border:`1px solid ${ac}30`, borderRadius:10 }}>{s}</span>)}
                        </div>
                      )}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, fontSize:11, fontFamily:font, color:MUTED }}>
                        <div>Menciones 7d: <span style={{ color:TEXT, fontWeight:600 }}>{a.mentions}</span></div>
                        <div>Tono GDELT: <span style={{ color:a.tone!=null&&a.tone<-3?"#dc2626":a.tone!=null&&a.tone<-1?"#ca8a04":"#16a34a", fontWeight:600 }}>{a.tone?.toFixed(1)??"—"}</span></div>
                      </div>
                      {a.topHeadlines?.length>0 && (
                        <div style={{ marginTop:8 }}>
                          <div style={{ fontSize:10, fontFamily:font, color:MUTED, marginBottom:4 }}>Titulares recientes:</div>
                          {a.topHeadlines.slice(0,2).map((h,i) => (
                            <a key={i} href={h.link} target="_blank" rel="noopener noreferrer"
                              style={{ display:"block", fontSize:11, color:ACCENT, textDecoration:"none", lineHeight:1.4, marginBottom:2 }}>↗ {h.title?.substring(0,80)}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* COMPONENTS BREAKDOWN */}
      <Card>
        <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>Descomposición del Índice</div>
        {data.components && Object.entries(data.components).filter(([,v])=>v).map(([key,comp]) => {
          const labels = {
            aiAlignment:{name:"Alineación IA (Mistral)",icon:"🤖",color:"#8b5cf6"},
            gdeltToneDivergence:{name:"Divergencia Tono GDELT",icon:"📡",color:"#0e7490"},
            mentionSilence:{name:"Silencio mediático",icon:"🔇",color:"#f59e0b"},
            systemicCohesion:{name:"Cohesión Chavismo",icon:"🔴",color:"#dc2626"},
            polymarketDelta:{name:"Señal Polymarket",icon:"📊",color:"#3b82f6"},
            sitrepValidation:{name:"Validación SITREP",icon:"📋",color:"#16a34a"},
          };
          const meta = labels[key]||{name:key,icon:"●",color:MUTED};
          return (
            <div key={key} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <span style={{ fontSize:12, color:TEXT }}>{meta.icon} {meta.name}</span>
                <span style={{ fontSize:12, fontFamily:font, fontWeight:700, color:meta.color }}>
                  {comp.score} <span style={{ fontWeight:400, color:MUTED, fontSize:10 }}>({(comp.weight*100).toFixed(0)}%)</span>
                </span>
              </div>
              <div style={{ height:8, background:BG3, borderRadius:4, overflow:"hidden" }}>
                <div style={{ width:`${Math.max(2,comp.score)}%`, height:"100%", background:`linear-gradient(90deg, ${meta.color}80, ${meta.color})`, borderRadius:4, transition:"width 0.6s ease" }} />
              </div>
            </div>
          );
        })}
      </Card>

      {/* EVOLUTION CHART */}
      {historyData.length>1 && (
        <Card>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Evolución ICG · S1 → Actual</div>
          <CohesionChart data={historyData} />
        </Card>
      )}

      {/* METHODOLOGY */}
      <Card>
        <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>Metodología</div>
        <div style={{ fontSize:13, color:TEXT, lineHeight:1.7 }}>
          El Índice de Cohesión del Gobierno (ICG) mide la alineación interna de la élite gobernante en una escala 0–100. Combina una capa automática diaria (clasificación IA de artículos por actor, divergencia de tono GDELT, detección de silencios mediáticos y señales de Polymarket) con una validación semanal anclada en el SITREP del equipo analítico. Entre actualizaciones semanales, la IA mantiene el pulso diario — ruidoso pero en tiempo real — y cada viernes el SITREP ancla y corrige.
        </div>
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10, marginTop:12 }}>
          <div style={{ background:BG3, padding:"10px 12px", borderRadius:6 }}>
            <div style={{ fontSize:11, fontFamily:font, color:ACCENT, fontWeight:600, marginBottom:4 }}>Capa Automática (70%)</div>
            <div style={{ fontSize:11, color:MUTED, lineHeight:1.5 }}>Alineación IA 30% · GDELT Tono 15% · Menciones 15% · Polymarket 10%</div>
          </div>
          <div style={{ background:BG3, padding:"10px 12px", borderRadius:6 }}>
            <div style={{ fontSize:11, fontFamily:font, color:"#16a34a", fontWeight:600, marginBottom:4 }}>Capa SITREP (30%)</div>
            <div style={{ fontSize:11, color:MUTED, lineHeight:1.5 }}>Votaciones AN · Designaciones · Declaraciones · Tensiones internas</div>
          </div>
        </div>
      </Card>

      {/* Status footer */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:10, fontFamily:font, color:`${MUTED}60` }}>
        <span>{data.engine==="mock" ? "⚠ Datos demo — conectar MISTRAL_API_KEY para datos en vivo" : `Motor: ${data.engine}`}{data.cachedDate ? ` · Datos del ${data.cachedDate}` : ""}</span>
        {error && <span style={{ color:"#ca8a04" }}>⚠ {error}</span>}
      </div>
    </div>
  );
}
