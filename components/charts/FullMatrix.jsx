import { useEffect, useState } from "react";
import { WEEKS } from "../../data/weekly.js";
import { SCENARIOS } from "../../data/static.js";
import { BG, BORDER, MUTED, SC, font } from "../../constants";
import { getScenarioCoordinates } from "../../utils/scenarioCoordinates.js";

function normalizeComposition(factors = []) {
  const scored = factors.map((factor,index) => ({
    ...factor,
    index,
    score:(factor.impact || 0) * (factor.persistence || 0) * (factor.evidence || 0),
  }));
  const total = scored.reduce((sum,factor)=>sum+factor.score,0);
  if (!total) return scored.map(factor=>({...factor,weight:0}));
  const normalized = scored.map(factor=>({
    ...factor,
    exactWeight:(factor.score/total)*100,
    weight:Math.floor((factor.score/total)*100),
  }));
  let remainder = 100-normalized.reduce((sum,factor)=>sum+factor.weight,0);
  [...normalized]
    .sort((a,b)=>(b.exactWeight-b.weight)-(a.exactWeight-a.weight))
    .forEach(factor=>{ if(remainder>0){ normalized[factor.index].weight+=1; remainder-=1; } });
  return normalized;
}

export function FullMatrix({ weekIdx, onClickWeek, onArrowClick }) {
  const W=560, H=400;
  const [range, setRange] = useState("recent");
  const [labels, setLabels] = useState("key");
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [compositionScenario, setCompositionScenario] = useState(3);
  const wk = WEEKS[weekIdx];
  const dom = wk.probs.reduce((a,b) => a.v>b.v?a:b);
  const domSc = SCENARIOS.find(s=>s.id===dom.sc);
  const trendSc = SCENARIOS.find(s=>s.id===(wk.trendSc||dom.sc));
  const trendColor = trendSc.color;

  // Trail points
  const fullTrail = WEEKS.slice(0, weekIdx+1).map((w,i) => {
    const coordinates = getScenarioCoordinates(w.probs);
    const dominant = w.probs.reduce((a,b)=>a.v>b.v?a:b);
    return {
      px: coordinates.x * W, py: (1-coordinates.y) * H, idx: i,
      coordinates,
      dom: SCENARIOS.find(s=>s.id===dominant.sc),
    };
  });
  const trail = range === "recent" ? fullTrail.slice(-10) : fullTrail;
  const cur = trail[trail.length-1];
  const changePct = Math.round(cur.coordinates.y * 100);
  const violencePct = Math.round(cur.coordinates.x * 100);
  const noChangePct = 100 - changePct;
  const nonCoercivePct = 100 - violencePct;
  useEffect(()=>setCompositionScenario(dom.sc),[weekIdx,dom.sc]);
  const selectedSc = SCENARIOS.find(s=>s.id===compositionScenario) || domSc;
  const selectedProb = wk.probs.find(p=>p.sc===selectedSc.id)?.v || 0;
  const composition = selectedSc.id === dom.sc
    ? wk.dominantComposition
    : wk.scenarioCompositions?.[selectedSc.id];
  const weightedFactors = normalizeComposition(composition?.factors || []);

  // Compute drift direction based on trend scenario's quadrant center
  const trendTargets = { 1:{x:W*0.2,y:H*0.2}, 2:{x:W*0.8,y:H*0.2}, 3:{x:W*0.2,y:H*0.8}, 4:{x:W*0.8,y:H*0.8} };
  const target = trendTargets[wk.trendSc||dom.sc];
  let dx = target.x - cur.px, dy = target.y - cur.py;
  const mag = Math.sqrt(dx*dx + dy*dy);
  const arrowLen = Math.min(mag * 0.4, 75);
  if (mag > 1) { dx = (dx/mag)*arrowLen; dy = (dy/mag)*arrowLen; }
  const arrowEnd = { x: cur.px + dx, y: cur.py + dy };
  const isSameSc = (wk.trendSc||dom.sc) === dom.sc;

  // Breathing animation: normalized direction for the drift
  const driftX = mag > 1 && arrowLen ? (dx/arrowLen)*5 : 0;
  const driftY = mag > 1 && arrowLen ? (dy/arrowLen)*5 : 0;

  // Unique animation name for this render
  const animId = `drift-${weekIdx}`;

  const isKeyLabel = (point, displayIndex) => {
    if (labels === "all") return true;
    if (displayIndex === trail.length - 2) return true;
    const previous = fullTrail[point.idx - 1];
    if (!previous) return true;
    const crossedAxis = (previous.coordinates.x < .5) !== (point.coordinates.x < .5)
      || (previous.coordinates.y < .5) !== (point.coordinates.y < .5);
    return previous.dom.id !== point.dom.id || crossedAxis;
  };

  const controlStyle = active => ({
    border:`1px solid ${active ? domSc.color : BORDER}`,
    background:active ? `${domSc.color}12` : "#fff",
    color:active ? domSc.color : MUTED,
    padding:"5px 8px", fontSize:8, fontFamily:font, cursor:"pointer",
    fontWeight:active ? 700 : 400,
  });

  return (
    <div style={{ background:BG }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, flexWrap:"wrap", padding:"8px 10px", borderBottom:`1px solid ${BORDER}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontFamily:font, color:MUTED, fontSize:8, marginRight:3 }}>TRAYECTORIA</span>
          <button onClick={()=>setRange("recent")} style={controlStyle(range==="recent")}>10 SEMANAS</button>
          <button onClick={()=>setRange("all")} style={controlStyle(range==="all")}>HISTÓRICO</button>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontFamily:font, color:MUTED, fontSize:8, marginRight:3 }}>ETIQUETAS</span>
          <button onClick={()=>setLabels("key")} style={controlStyle(labels==="key")}>HITOS</button>
          <button onClick={()=>setLabels("all")} style={controlStyle(labels==="all")}>TODAS</button>
        </div>
      </div>
      <div style={{ display:"flex", gap:10, alignItems:"center", padding:"8px 12px", borderBottom:`1px solid ${BORDER}`, background:`linear-gradient(90deg, ${domSc.color}10, transparent)` }}>
        <div style={{ fontFamily:font, color:domSc.color, fontWeight:700, fontSize:11, whiteSpace:"nowrap" }}>{wk.short} · E{domSc.id} DOMINANTE</div>
        <div style={{ fontSize:10, color:MUTED, lineHeight:1.4 }}>
          Curso no coercitivo <b style={{color:"#334155"}}>{nonCoercivePct}%</b> · Sin transformación <b style={{color:"#334155"}}>{noChangePct}%</b> · {domSc.name}
        </div>
      </div>
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", background:BG }}>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <polygon points="0 0, 10 4, 0 8" fill={trendColor} opacity="0.85" />
        </marker>
        <style>{`
          @keyframes ${animId} {
            0%, 100% { transform: translate(0px, 0px); }
            50% { transform: translate(${driftX}px, ${driftY}px); }
          }
        `}</style>
      </defs>
      {/* Quadrants */}
      <rect x={0} y={0} width={W/2} height={H/2} fill={domSc.id===1 ? "rgba(76,159,56,0.10)" : "rgba(76,159,56,0.035)"} />
      <rect x={W/2} y={0} width={W/2} height={H/2} fill={domSc.id===2 ? "rgba(229,36,59,0.10)" : "rgba(229,36,59,0.035)"} />
      <rect x={0} y={H/2} width={W/2} height={H/2} fill={domSc.id===3 ? "rgba(10,151,217,0.10)" : "rgba(10,151,217,0.035)"} />
      <rect x={W/2} y={H/2} width={W/2} height={H/2} fill={domSc.id===4 ? "rgba(252,195,11,0.10)" : "rgba(252,195,11,0.035)"} />
      {/* Axes */}
      <line x1={W/2} y1={0} x2={W/2} y2={H} stroke={BORDER} strokeWidth={1} />
      <line x1={0} y1={H/2} x2={W} y2={H/2} stroke={BORDER} strokeWidth={1} />
      {/* Grid */}
      <line x1={W/4} y1={0} x2={W/4} y2={H} stroke={BORDER} strokeWidth={0.5} strokeDasharray="3 4" opacity={0.4} />
      <line x1={3*W/4} y1={0} x2={3*W/4} y2={H} stroke={BORDER} strokeWidth={0.5} strokeDasharray="3 4" opacity={0.4} />
      <line x1={0} y1={H/4} x2={W} y2={H/4} stroke={BORDER} strokeWidth={0.5} strokeDasharray="3 4" opacity={0.4} />
      <line x1={0} y1={3*H/4} x2={W} y2={3*H/4} stroke={BORDER} strokeWidth={0.5} strokeDasharray="3 4" opacity={0.4} />
      {/* Quadrant labels */}
      <text x={12} y={16} fontSize={8} fill={MUTED} fontFamily={font} opacity={0.6}>CAMBIO SIN VIOLENCIA</text>
      <text x={W/2+12} y={16} fontSize={8} fill={MUTED} fontFamily={font} opacity={0.6}>CAMBIO CAÓTICO</text>
      <text x={12} y={H-19} fontSize={8} fill={MUTED} fontFamily={font} opacity={0.6}>ESTABILIDAD SIN TRANSFORMACIÓN</text>
      <text x={W/2+12} y={H-19} fontSize={8} fill={MUTED} fontFamily={font} opacity={0.6}>VIOLENCIA SIN CAMBIO</text>
      {/* Scenario labels */}
      <text x={16} y={50} fontSize={9} fontWeight={700} fill="#4C9F38" fontFamily="'Syne',sans-serif">E1: Transición pacífica</text>
      <text x={W/2+16} y={50} fontSize={9} fontWeight={700} fill="#E5243B" fontFamily="'Syne',sans-serif">E2: Colapso y fragmentación</text>
      <text x={16} y={H/2+40} fontSize={9} fontWeight={700} fill="#0A97D9" fontFamily="'Syne',sans-serif">E3: Continuidad negociada</text>
      <text x={W/2+16} y={H/2+40} fontSize={9} fontWeight={700} fill="#b8860b" fontFamily="'Syne',sans-serif">E4: Resistencia coercitiva</text>
      {/* Trail segments */}
      {trail.slice(1).map((p,i) => {
        const prev = trail[i];
        const isLatest = i === trail.length - 2;
        const alpha = 0.12 + ((i+1)/trail.length)*0.48;
        return <line key={p.idx} x1={prev.px} y1={prev.py} x2={p.px} y2={p.py}
          stroke={isLatest ? domSc.color : "#7f9db3"} strokeWidth={isLatest ? 3.5 : 1.5}
          strokeDasharray={isLatest ? undefined : "4 3"} opacity={isLatest ? .9 : alpha} />;
      })}
      {/* Historical points. Labels are limited to milestones by default. */}
      {trail.slice(0,-1).map((p,i) => (
        <g key={i} style={{ cursor:"pointer" }} onClick={() => onClickWeek && onClickWeek(p.idx)}>
          <title>{WEEKS[p.idx].short} · E{p.dom.id} · violencia {Math.round(p.coordinates.x*100)}% · cambio {Math.round(p.coordinates.y*100)}%</title>
          <circle cx={p.px} cy={p.py} r={14} fill="transparent" />
          <circle cx={p.px} cy={p.py} r={i===trail.length-2 ? 8 : 6} fill={i===trail.length-2 ? p.dom.color : "#77a9c7"} opacity={i===trail.length-2 ? .72 : .42} />
          {isKeyLabel(p,i) && <text x={p.px} y={p.py-10} textAnchor="middle" fontSize={7} fill={p.dom.color} fontFamily={font} opacity={0.78}>{WEEKS[p.idx].short}</text>}
        </g>
      ))}
      {/* ── TREND ARROW — thicker and longer ── */}
      <line x1={cur.px} y1={cur.py} x2={arrowEnd.x} y2={arrowEnd.y}
        stroke={trendColor} strokeWidth={3.5} strokeDasharray="6 3" opacity={0.75} markerEnd="url(#arrowhead)" />
      {/* Arrow label */}
      <text x={arrowEnd.x + (dx > 0 ? 10 : -10)} y={arrowEnd.y - 8}
        textAnchor={dx >= 0 ? "start" : "end"} fontSize={9} fill={trendColor} fontFamily={font} fontWeight={700} opacity={0.9}>
        {isSameSc ? `→ E${trendSc.id}` : `↑ E${trendSc.id}`}
      </text>
      {/* Arrow hover target (invisible, wide for easy clicking) */}
      <line x1={cur.px} y1={cur.py} x2={arrowEnd.x} y2={arrowEnd.y}
        stroke="transparent" strokeWidth={28} style={{ cursor:"pointer" }}
        onClick={() => onArrowClick && onArrowClick()} />
      {/* Active point — bigger, with breathing animation toward arrow direction */}
      <g style={{ animation:`${animId} 2.5s ease-in-out infinite` }}>
        <title>{wk.short} · E{domSc.id} dominante · violencia {violencePct}% · cambio estructural {changePct}%</title>
        <circle cx={cur.px} cy={cur.py} r={25} fill={domSc.color} opacity={0.06} />
        <circle cx={cur.px} cy={cur.py} r={17} fill={domSc.color} opacity={0.12} />
        <circle cx={cur.px} cy={cur.py} r={11} fill={domSc.color} opacity={0.92} />
        <text x={cur.px} y={cur.py+3.5} textAnchor="middle" fontSize={8} fontWeight={700} fill={BG} fontFamily={font}>E{domSc.id}</text>
      </g>
      <text x={cur.px} y={cur.py-18} textAnchor="middle" fontSize={9} fill={domSc.color} fontFamily={font} fontWeight={700}>{wk.short}</text>
      {/* Axis labels */}
      <text x={W/2} y={H-2} textAnchor="middle" fontSize={7} fill={MUTED} fontFamily={font} letterSpacing="0.08em">BAJA ← INTENSIDAD COERCITIVA → ALTA</text>
      <text x={0} y={0} textAnchor="middle" fontSize={7} fill={MUTED} fontFamily={font} letterSpacing="0.08em"
        transform={`translate(9,${H/2}) rotate(-90)`}>BAJO ← CAMBIO ESTRUCTURAL → ALTO</text>
    </svg>
    {weekIdx >= 31 && (
      <div style={{ borderTop:`1px solid ${BORDER}`, background:"#f8fafc" }}>
        <button onClick={()=>setAnalysisOpen(open=>!open)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, padding:"10px 12px", border:"none", background:"transparent", cursor:"pointer", fontFamily:font, color:"#334155", textAlign:"left" }}>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.08em" }}>COMPOSICIÓN, METODOLOGÍA Y LECTURA · {wk.short}</span>
          <span style={{ fontSize:9, color:domSc.color, whiteSpace:"nowrap" }}>{analysisOpen ? "OCULTAR ▲" : "DESPLEGAR ▼"}</span>
        </button>
        {analysisOpen && <div style={{ padding:"2px 12px 12px" }}>
        {/* 1 · Composition of the dominant scenario */}
        <div style={{ border:`1px solid ${selectedSc.color}30`, background:"#fff", padding:"10px 11px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8, flexWrap:"wrap", marginBottom:7 }}>
            <div style={{ fontFamily:font, fontSize:9, fontWeight:700, color:selectedSc.color, letterSpacing:"0.08em" }}>
              COMPOSICIÓN DEL ESCENARIO
            </div>
            <div style={{ fontFamily:font, fontSize:9, fontWeight:700, color:selectedSc.color }}>
              E{selectedSc.id} · {selectedProb}% {selectedSc.id===dom.sc ? "· DOMINANTE" : ""}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, minmax(0, 1fr))", gap:5, marginBottom:9 }}>
            {SCENARIOS.map(sc=>{
              const probability=wk.probs.find(p=>p.sc===sc.id)?.v||0;
              const active=sc.id===selectedSc.id;
              return <button key={sc.id} onClick={()=>setCompositionScenario(sc.id)} style={{ border:`1px solid ${active?sc.color:BORDER}`, background:active?`${sc.color}12`:"#fff", color:active?sc.color:MUTED, padding:"6px 4px", fontFamily:font, fontSize:8, fontWeight:active?700:400, cursor:"pointer" }}>E{sc.id} · {probability}%</button>;
            })}
          </div>
          <div style={{ fontSize:9, color:"#475569", lineHeight:1.5, marginBottom:8 }}>
            Peso interno normalizado mediante <b>{composition?.method || "evaluación cualitativa"}</b>. Los componentes suman 100% de la justificación interna de E{selectedSc.id}.
          </div>
          {weightedFactors.map((factor,index)=>(
            <div key={factor.name} style={{ display:"grid", gridTemplateColumns:"minmax(150px, 1.25fr) minmax(100px, .75fr) 32px", gap:8, alignItems:"center", padding:"6px 0", borderTop:index ? `1px solid ${BORDER}` : "none" }}>
              <div>
                <div style={{ fontSize:9, color:"#334155", fontWeight:700, lineHeight:1.4 }}>{factor.name}</div>
                <div style={{ fontSize:8, color:MUTED, lineHeight:1.4, marginTop:2 }}>{factor.detail}</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:4, fontFamily:font, fontSize:7, color:MUTED }}>
                  <span>I {factor.impact}/5</span><span>·</span><span>P {factor.persistence}/5</span><span>·</span><span>E {factor.evidence}/5</span><span>·</span><span>Conf. {factor.confidence}</span>
                </div>
              </div>
              <div style={{ height:7, background:"#e2e8f0", borderRadius:10, overflow:"hidden" }}>
                <div style={{ width:`${factor.weight}%`, height:"100%", background:selectedSc.color, borderRadius:10, opacity:.82 }} />
              </div>
              <div style={{ fontFamily:font, fontSize:10, fontWeight:700, textAlign:"right", color:selectedSc.color }}>{factor.weight}%</div>
            </div>
          ))}
          {!weightedFactors.length && (
            <div style={{ fontSize:9, color:MUTED }}>No hay ponderaciones archivadas para esta semana.</div>
          )}
          <div style={{ marginTop:8, paddingTop:7, borderTop:`1px solid ${BORDER}`, fontSize:8, color:MUTED, lineHeight:1.45 }}>
            <b>Alcance:</b> los pesos miden la contribución relativa a la justificación de E{selectedSc.id}; no son probabilidades estadísticas ni se suman directamente al {selectedProb}%. El {selectedProb}% continúa siendo el juicio analítico agregado entre los cuatro escenarios.
          </div>
        </div>

        {/* 2 · Methodology used to locate the point */}
        <div style={{ fontFamily:font, fontSize:8, fontWeight:700, color:"#334155", letterSpacing:"0.1em", marginTop:12, marginBottom:8 }}>
          METODOLOGÍA DE UBICACIÓN
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(185px, 1fr))", gap:8 }}>
          <div style={{ border:`1px solid ${BORDER}`, background:"#fff", padding:"8px 9px", fontSize:9, color:MUTED, lineHeight:1.55 }}>
            <b style={{color:"#334155"}}>1 · Intensidad coercitiva</b><br />
            <span style={{color:"#0f766e"}}>Curso no coercitivo: {nonCoercivePct}%</span> = E1 + E3.<br />
            <span style={{color:"#b45309"}}>Violencia o coerción: {violencePct}%</span> = E2 + E4.<br />
            La diferencia de {Math.abs(nonCoercivePct-violencePct)} puntos favorece un curso {nonCoercivePct >= violencePct ? "sin escalada coercitiva" : "con mayor presión coercitiva"}.
          </div>
          <div style={{ border:`1px solid ${BORDER}`, background:"#fff", padding:"8px 9px", fontSize:9, color:MUTED, lineHeight:1.55 }}>
            <b style={{color:"#334155"}}>2 · Cambio político estructural</b><br />
            <span style={{color:"#0A97D9"}}>Sin transformación: {noChangePct}%</span> = E3 + E4.<br />
            <span style={{color:"#4C9F38"}}>Con transformación: {changePct}%</span> = E1 + E2.<br />
            La diferencia de {Math.abs(noChangePct-changePct)} puntos favorece {noChangePct >= changePct ? "la preservación de la estructura de poder" : "una alteración sustantiva del poder"}.
          </div>
        </div>
        <div style={{ marginTop:7, fontSize:8, color:MUTED, lineHeight:1.5 }}>
          <b>Regla de ubicación:</b> eje horizontal = E2 + E4; eje vertical = E1 + E2. Las cuatro probabilidades siempre suman 100%. La posición sintetiza dos dimensiones; no sustituye la probabilidad individual de cada escenario.
        </div>

        {/* 3 · Weekly interpretation */}
        <div style={{ fontFamily:font, fontSize:8, fontWeight:700, color:"#334155", letterSpacing:"0.1em", marginTop:12, marginBottom:7 }}>
          LECTURA DE {wk.short}
        </div>
        <div style={{ borderLeft:`3px solid ${domSc.color}`, background:`${domSc.color}09`, padding:"9px 11px", fontSize:10, color:"#475569", lineHeight:1.6 }}>
          <b style={{color:domSc.color}}>E{domSc.id} — {domSc.name} ({dom.v}%)</b><br />
          El resultado más probable sigue siendo E{domSc.id}. En términos agregados, el {nonCoercivePct}% de los escenarios apunta a un curso sin violencia o coerción y el {noChangePct}% no contempla una transformación estructural. E3 explica simultáneamente {dom.v} puntos de ambos conjuntos: combina baja coerción con continuidad del arreglo institucional. Aunque el {violencePct}% contempla coerción y el {changePct}% algún tipo de cambio, ninguna de esas alternativas supera por sí sola la continuidad negociada.
        </div>
        </div>}
      </div>
    )}
    {weekIdx < 31 && (
      <div style={{ borderTop:`1px solid ${BORDER}`, padding:"9px 12px", background:"#f8fafc", fontSize:9, color:MUTED, lineHeight:1.5 }}>
        <b style={{color:"#334155"}}>Archivo histórico · {wk.short}.</b> La trayectoria, las probabilidades, los drivers y la lectura semanal permanecen disponibles. La composición cuantitativa por escenario se incorpora a la metodología desde S32 para evitar asignar ponderaciones retrospectivas sin una auditoría equivalente.
      </div>
    )}
    </div>
  );
}
