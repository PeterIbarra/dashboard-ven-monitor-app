import { useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Card } from "../Card";
import { RedesChart } from "../charts/RedesChart";
import { TabCohesion } from "./TabCohesion";
import { REDES_DATA } from "../../data/redes.js";
import { REDES_TOTALS } from "../../data/redes.js";
import { BG2, BG3, BORDER, TEXT, MUTED, ACCENT, font, fontSans } from "../../constants";

export function TabClimaSocial({ liveData = {} }) {
  const mob = useIsMobile();
  const [seccion, setSeccion] = useState("cohesion");
  const [chartView, setChartView] = useState("mirror");
  const R = REDES_TOTALS;

  const netVal = parseFloat(R.netIdx);
  const thermoPos = Math.min(95, Math.max(5, 50 + netVal * 0.5));
  const thermoColor = netVal > 30 ? "#dc2626" : netVal > 15 ? "#ca8a04" : netVal > 0 ? "#f59e0b" : "#16a34a";

  const barColorPol = { a:"#dc2626", m:"#f59e0b", b:"#22c55e", n:`${MUTED}40` };
  const barColorConv = { a:"#16a34a", m:"#5DCAA5", b:"#f59e0b", n:`${MUTED}40` };
  const barLabel = { a:"Alto", m:"Moderado", b:"Bajo", n:"Ninguno" };

  const keyEvents = [
    { d:"Ene-3", label:"Operativo 3 de enero", desc:"Shock inicial: polarización 37% vs convivencia 35% — el día más equilibrado del ciclo.", color:"#dc2626" },
    { d:"Ene-8", label:"Pico máximo — amplificación", desc:"295K interacciones pol. alta (56% del total). Día con mayor volumen: 527K. Ratio pol/conv: 13.4x.", color:"#dc2626" },
    { d:"Ene-20", label:"Convivencia superó", desc:"69K conv. alta vs 25K pol. alta (ratio 0.4x). Excepción que confirma la regla.", color:"#16a34a" },
    { d:"Ene-30", label:"FANB reafirma lealtad", desc:"120K pol. alta (63%). Declaración institucional genera reacción polarizante masiva.", color:"#dc2626" },
    { d:"Feb-4", label:"Amnistía avanza", desc:"84K pol. alta (67%). Avances legislativos no reducen polarización.", color:"#ca8a04" },
    { d:"Feb-19", label:"Ley de Amnistía promulgada", desc:"45K pol. alta (82%). Hito normativo genera reacción proporcionalmente más polarizante.", color:"#ca8a04" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>🌡️</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600, color:TEXT }}>Clima Social — Redes y Cohesión</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED }}>Polarización y convivencia en X · Índice de Cohesión de Gobierno</div>
        </div>
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}` }}>
          {[{id:"cohesion",label:"🏛 Cohesión GOB"},{id:"redes",label:"📱 Redes"},{id:"analisis",label:"📊 Análisis"},{id:"metodologia",label:"📋 Metodología"}].map(s => (
            <button key={s.id} onClick={() => setSeccion(s.id)}
              style={{ fontSize:12, fontFamily:font, padding:"6px 14px", border:"none",
                background:seccion===s.id?ACCENT:"transparent", color:seccion===s.id?"#fff":MUTED,
                cursor:"pointer", letterSpacing:"0.06em" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ COHESIÓN GOB ═══ */}
      {seccion === "cohesion" && (
        <TabCohesion liveData={liveData} />
      )}

      {/* ═══ REDES ═══ */}
      {seccion === "redes" && (<>
        {/* KPIs — same font style as Conflictividad */}
        <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(5,1fr)", gap:10, marginBottom:16 }}>
          <Card accent={ACCENT}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Interacciones</div>
            <span style={{ fontSize:26, fontWeight:800, fontFamily:"'Playfair Display',serif", color:ACCENT }}>{(R.total/1e6).toFixed(1)}M</span>
            <div style={{ fontSize:10, color:MUTED }}>{R.days} días analizados</div>
          </Card>
          <Card accent="#dc2626">
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Polarización</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
              <span style={{ fontSize:26, fontWeight:800, fontFamily:"'Playfair Display',serif", color:"#dc2626" }}>{((R.totPolA + R.totPolM) / R.total * 100).toFixed(0)}%</span>
              <span style={{ fontSize:11, fontFamily:font, color:MUTED }}>mod+alta</span>
            </div>
            <div style={{ fontSize:10, color:MUTED }}>Alta {R.polAltoPct}% · Mod {(R.totPolM/R.total*100).toFixed(0)}%</div>
          </Card>
          <Card accent="#16a34a">
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Convivencia</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
              <span style={{ fontSize:26, fontWeight:800, fontFamily:"'Playfair Display',serif", color:"#16a34a" }}>{((R.totConvA + R.totConvM) / R.total * 100).toFixed(0)}%</span>
              <span style={{ fontSize:11, fontFamily:font, color:MUTED }}>mod+alta</span>
            </div>
            <div style={{ fontSize:10, color:MUTED }}>Alta {R.convAltoPct}% · Mod {(R.totConvM/R.total*100).toFixed(0)}%</div>
          </Card>
          <Card accent={thermoColor}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Índice neto</div>
            <span style={{ fontSize:26, fontWeight:800, fontFamily:"'Playfair Display',serif", color:thermoColor }}>+{R.netIdx}pp</span>
            <div style={{ fontSize:10, color:MUTED }}>Polarización domina</div>
          </Card>
          <Card accent="#dc2626">
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Pico</div>
            <span style={{ fontSize:26, fontWeight:800, fontFamily:"'Playfair Display',serif", color:"#dc2626" }}>Ene 8</span>
            <div style={{ fontSize:10, color:MUTED }}>295K pol. alta · 527K total</div>
          </Card>
        </div>

        {/* Thermometer */}
        <div style={{ marginBottom:16, padding:"10px 14px", background:BG2, border:`1px solid ${BORDER}` }}>
          <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Termómetro de polarización neta — promedio del período</div>
          <div style={{ position:"relative", height:14, background:"linear-gradient(to right, #16a34a, #ca8a04, #dc2626)", borderRadius:6, overflow:"hidden" }}>
            {[25,50,75].map(v => <div key={v} style={{ position:"absolute", left:`${v}%`, top:0, bottom:0, width:1, background:"rgba(255,255,255,0.35)" }} />)}
            <div style={{ position:"absolute", left:`${thermoPos}%`, top:"50%", transform:"translate(-50%,-50%)", width:10, height:10, borderRadius:"50%", background:"#fff", border:`2.5px solid ${thermoColor}`, boxShadow:`0 0 6px ${thermoColor}` }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, fontFamily:font, color:`${MUTED}60`, marginTop:3 }}>
            <span>Convivencia dominante</span><span>Equilibrio</span><span>Polarización dominante</span>
          </div>
        </div>

        {/* Dual dimension breakdown */}
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:12, marginBottom:16 }}>
          {/* Polarización */}
          <Card accent="#dc2626">
            <div style={{ fontSize:12, fontFamily:font, color:"#dc2626", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>Dimensión: polarización política</div>
            {[
              { k:"a", pct:(R.totPolA/R.total*100).toFixed(1), desc:"Insultos, descalificación, deslegitimación" },
              { k:"m", pct:(R.totPolM/R.total*100).toFixed(1), desc:"Crítica fuerte sin insultos" },
              { k:"b", pct:((R.total-R.totPolA-R.totPolM-REDES_DATA.reduce((s,d)=>s+d.pol.n,0))/R.total*100).toFixed(1), desc:"Postura leve, lenguaje neutro" },
              { k:"n", pct:(REDES_DATA.reduce((s,d)=>s+d.pol.n,0)/R.total*100).toFixed(1), desc:"Informativo, sin posición" },
            ].map((item,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:11, fontFamily:font, color:MUTED, minWidth:60 }}>{barLabel[item.k]}</span>
                <div style={{ flex:1, height:10, background:BG3, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:10, background:barColorPol[item.k], width:`${item.pct}%`, borderRadius:3 }} />
                </div>
                <span style={{ fontSize:11, fontFamily:font, fontWeight:600, color:barColorPol[item.k], minWidth:36, textAlign:"right" }}>{item.pct}%</span>
              </div>
            ))}
            <div style={{ fontSize:10, fontFamily:font, color:`${MUTED}60`, marginTop:6 }}>91% del discurso tiene polarización moderada o alta</div>
          </Card>
          {/* Convivencia */}
          <Card accent="#16a34a">
            <div style={{ fontSize:12, fontFamily:font, color:"#16a34a", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>Dimensión: convivencia</div>
            {[
              { k:"a", pct:(R.totConvA/R.total*100).toFixed(1), desc:"Llamados explícitos al diálogo, paz" },
              { k:"m", pct:(R.totConvM/R.total*100).toFixed(1), desc:"Intención conciliadora con reservas" },
              { k:"b", pct:((R.total-R.totConvA-R.totConvM-REDES_DATA.reduce((s,d)=>s+d.conv.n,0))/R.total*100).toFixed(1), desc:"Escasa voluntad de entendimiento" },
              { k:"n", pct:(REDES_DATA.reduce((s,d)=>s+d.conv.n,0)/R.total*100).toFixed(1), desc:"Sin elementos conciliadores" },
            ].map((item,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:11, fontFamily:font, color:MUTED, minWidth:60 }}>{barLabel[item.k]}</span>
                <div style={{ flex:1, height:10, background:BG3, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:10, background:barColorConv[item.k], width:`${item.pct}%`, borderRadius:3 }} />
                </div>
                <span style={{ fontSize:11, fontFamily:font, fontWeight:600, color:barColorConv[item.k], minWidth:36, textAlign:"right" }}>{item.pct}%</span>
              </div>
            ))}
            <div style={{ fontSize:10, fontFamily:font, color:`${MUTED}60`, marginTop:6 }}>63% tiene convivencia moderada o alta, pero solo 8% alta</div>
          </Card>
        </div>

        {/* Main chart with view toggle */}
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, flexWrap:"wrap", gap:6 }}>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
              Evolución diaria — dos lentes, un discurso
            </div>
            <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}` }}>
              {[{id:"mirror",l:"Espejo"},{id:"polarizacion",l:"Polarización"},{id:"convivencia",l:"Convivencia"},{id:"neto",l:"Neto"},{id:"composicion",l:"% Diario"}].map(v => (
                <button key={v.id} onClick={() => setChartView(v.id)}
                  style={{ fontSize:10, fontFamily:font, padding:"4px 10px", border:"none",
                    background:chartView===v.id?ACCENT:"transparent", color:chartView===v.id?"#fff":MUTED, cursor:"pointer" }}>
                  {v.l}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", gap:12, marginBottom:6, flexWrap:"wrap" }}>
            {[{c:"#dc2626",l:"Pol. alta"},{c:"#f59e0b",l:"Pol. moderada"},{c:"#16a34a",l:"Conv. alta"},{c:"#5DCAA5",l:"Conv. moderada"}].map((it,i) => (
              <span key={i} style={{ fontSize:11, fontFamily:font, color:MUTED, display:"flex", alignItems:"center", gap:3 }}>
                <span style={{ width:8, height:8, borderRadius:2, background:it.c }} />{it.l}
              </span>
            ))}
          </div>
          <div style={{ position:"relative", width:"100%", height:mob?220:280 }}>
            <RedesChart view={chartView} />
          </div>
        </Card>

        {/* Weekly ratio evolution */}
        <Card style={{ marginTop:12 }}>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
            Ratio semanal — polarización alta / convivencia alta
          </div>
          <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:100 }}>
            {R.weekly.map((w, i) => {
              const maxR = Math.max(...R.weekly.map(x => x.ratio || 0), 1);
              const h = w.ratio ? Math.max(4, (Math.min(w.ratio, maxR) / maxR) * 85) : 4;
              const col = !w.ratio ? MUTED : w.ratio > 10 ? "#dc2626" : w.ratio > 5 ? "#ca8a04" : w.ratio > 2 ? "#f59e0b" : "#16a34a";
              return (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                  <span style={{ fontSize:9, fontFamily:font, fontWeight:600, color:col }}>{w.ratio ? w.ratio+"x" : "—"}</span>
                  <div style={{ width:"100%", height:h, background:col, opacity:0.7, borderRadius:"3px 3px 0 0" }} />
                  <span style={{ fontSize:7, fontFamily:font, color:MUTED, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:"100%" }}>{w.label.split("–")[0]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize:9, fontFamily:font, color:`${MUTED}60`, marginTop:6 }}>Ratio = Interacciones pol. alta / conv. alta · {">"} 1x = polarización domina · La semana 3 (Ene 17-23) tuvo el ratio más bajo: 1.8x</div>
        </Card>

        {/* Key events */}
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Eventos clave y su huella en redes</div>
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:8 }}>
            {keyEvents.map((ev, i) => {
              const day = REDES_DATA.find(d => d.d === ev.d);
              return (
                <div key={i} style={{ background:BG2, border:`1px solid ${BORDER}`, borderLeft:`3px solid ${ev.color}`, padding:"10px 14px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                    <span style={{ fontSize:11, fontFamily:font, fontWeight:600, color:ev.color }}>{ev.d} — {ev.label}</span>
                    {day && <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>{(day.pol.t/1000).toFixed(0)}K int.</span>}
                  </div>
                  <div style={{ fontSize:11, fontFamily:fontSans, color:MUTED, lineHeight:1.5 }}>{ev.desc}</div>
                  {day && (
                    <div style={{ display:"flex", gap:8, marginTop:6 }}>
                      <span style={{ fontSize:9, fontFamily:font, color:"#dc2626" }}>Pol: {(day.pol.a/day.pol.t*100).toFixed(0)}%</span>
                      <span style={{ fontSize:9, fontFamily:font, color:"#16a34a" }}>Conv: {(day.conv.a/day.conv.t*100).toFixed(0)}%</span>
                      <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>Vol: {day.pol.t > 999 ? (day.pol.t/1000).toFixed(0)+"K" : day.pol.t}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </>)}

      {/* ═══ ANÁLISIS ═══ */}
      {seccion === "analisis" && (<>
        <Card accent="#dc2626" style={{ marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#dc2626", marginBottom:6 }}>El discurso confrontativo es la norma, no la excepción</div>
          <div style={{ fontSize:13, color:MUTED, lineHeight:1.7 }}>
            91.3% de las interacciones tiene polarización moderada o alta. Solo 1.3% es completamente neutral. El espacio digital venezolano post-3 de enero opera en modo confrontativo permanente — la polarización no es un pico, es el estado base del discurso en X.
          </div>
        </Card>
        <Card accent="#16a34a" style={{ marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#16a34a", marginBottom:6 }}>La convivencia existe, pero es tenue y condicional</div>
          <div style={{ fontSize:13, color:MUTED, lineHeight:1.7 }}>
            63.4% de las interacciones tiene algún nivel de convivencia (moderada + alta), pero solo 7.7% es convivencia alta — llamados explícitos al diálogo, unidad y respeto mutuo. La mayoría es convivencia condicional: "intención conciliadora acompañada de reservas".
          </div>
        </Card>
        <Card accent="#ca8a04" style={{ marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#ca8a04", marginBottom:6 }}>Los hitos legislativos polarizan más de lo esperado</div>
          <div style={{ fontSize:13, color:MUTED, lineHeight:1.7 }}>
            La promulgación de la Ley de Amnistía (Feb 19) generó 82% de polarización alta — el porcentaje más alto del período. Los avances normativos no desactivan la confrontación digital; la disputa sobre su alcance real intensifica la polarización.
          </div>
        </Card>
        <Card accent="#7c3aed" style={{ marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#7c3aed", marginBottom:6 }}>La convivencia necesita condiciones excepcionales para emerger</div>
          <div style={{ fontSize:13, color:MUTED, lineHeight:1.7 }}>
            De 52 días analizados, solo 2 días tuvieron más convivencia alta que polarización alta: Ene 16 y Ene 20. En los otros 50 días, la polarización alta superó a la convivencia alta — en muchos casos por ratios de 10x o más.
          </div>
        </Card>
        <Card accent={ACCENT}>
          <div style={{ fontSize:13, fontWeight:600, color:ACCENT, marginBottom:6 }}>Implicaciones para el análisis de escenarios</div>
          <div style={{ fontSize:13, color:MUTED, lineHeight:1.7 }}>
            El clima digital confrontativo es un factor de riesgo para E1 (transición pacífica): la base social para una transición consensuada es estrecha en el discurso digital. Sin embargo, la convivencia moderada mayoritaria (56%) sugiere que el rechazo a la violencia es amplio. Para E3 (continuidad negociada), los acuerdos pragmáticos pueden avanzar incluso con discurso confrontativo.
          </div>
        </Card>
      </>)}

      {/* ═══ METODOLOGÍA ═══ */}
      {seccion === "metodologia" && (<>
        <Card accent={ACCENT} style={{ marginBottom:12 }}>
          <div style={{ fontSize:14, fontWeight:600, color:TEXT, marginBottom:8 }}>Metodología de clasificación</div>
          <div style={{ fontSize:13, color:MUTED, lineHeight:1.7 }}>
            Los datos provienen de la red social X (antes Twitter). Cada interacción (posts + likes + reposts) se clasifica simultáneamente en <b style={{ color:"#dc2626" }}>dos dimensiones independientes</b>: polarización política y convivencia. No son fuerzas opuestas — un mensaje puede tener polarización alta y convivencia moderada al mismo tiempo.
          </div>
        </Card>
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:12, marginBottom:12 }}>
          <Card accent="#dc2626">
            <div style={{ fontSize:13, fontWeight:600, color:"#dc2626", marginBottom:8 }}>Niveles de polarización política</div>
            {[
              { n:"Alto", d:"Insultos, descalificaciones, deslegitimación total del adversario o tono abiertamente agresivo.", c:"#dc2626" },
              { n:"Moderado", d:"Crítica fuerte o confrontativa sin recurrir a insultos ni deshumanización.", c:"#f59e0b" },
              { n:"Bajo", d:"Postura leve, con lenguaje mayormente neutro y valoraciones limitadas.", c:"#22c55e" },
              { n:"Ninguno", d:"Contenido informativo o descriptivo, sin toma de posición.", c:MUTED },
            ].map((item,i) => (
              <div key={i} style={{ display:"flex", gap:8, padding:"6px 0", borderBottom:i<3?`1px solid ${BORDER}30`:"none" }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:item.c, marginTop:5, flexShrink:0 }} />
                <div><span style={{ fontSize:12, fontWeight:600, color:TEXT }}>{item.n}: </span><span style={{ fontSize:12, color:MUTED }}>{item.d}</span></div>
              </div>
            ))}
          </Card>
          <Card accent="#16a34a">
            <div style={{ fontSize:13, fontWeight:600, color:"#16a34a", marginBottom:8 }}>Niveles de convivencia</div>
            {[
              { n:"Alto", d:"Llamados explícitos al diálogo, la unidad, el respeto mutuo o la paz.", c:"#16a34a" },
              { n:"Moderado", d:"Manifestaciones de intención conciliadora acompañadas de reservas o condiciones.", c:"#5DCAA5" },
              { n:"Bajo", d:"Escasa voluntad de entendimiento o referencias débiles a la convivencia.", c:"#f59e0b" },
              { n:"Ninguno", d:"Ausencia de elementos asociados a la conciliación.", c:MUTED },
            ].map((item,i) => (
              <div key={i} style={{ display:"flex", gap:8, padding:"6px 0", borderBottom:i<3?`1px solid ${BORDER}30`:"none" }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:item.c, marginTop:5, flexShrink:0 }} />
                <div><span style={{ fontSize:12, fontWeight:600, color:TEXT }}>{item.n}: </span><span style={{ fontSize:12, color:MUTED }}>{item.d}</span></div>
              </div>
            ))}
          </Card>
        </div>
        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:TEXT, marginBottom:6 }}>Notas técnicas</div>
          <div style={{ fontSize:12, color:MUTED, lineHeight:1.7 }}>
            <b>Unidad de análisis:</b> Interacción = post original + likes + reposts. Un post viral altamente polarizante puede generar miles de interacciones clasificadas como "alto".
          </div>
          <div style={{ fontSize:12, color:MUTED, lineHeight:1.7, marginTop:6 }}>
            <b>Cobertura:</b> {R.days} días continuos ({R.firstDay} – {R.lastDay}). {(R.total/1e6).toFixed(1)} millones de interacciones totales. Los totales diarios son idénticos entre polarización y convivencia porque son dos clasificaciones del mismo universo de mensajes.
          </div>
          <div style={{ fontSize:12, color:MUTED, lineHeight:1.7, marginTop:6 }}>
            <b>Actualización:</b> Irregular — se actualiza cuando el proveedor entrega nuevos cortes de datos.
          </div>
          <div style={{ fontSize:12, color:MUTED, lineHeight:1.7, marginTop:6 }}>
            <b>Fuente:</b> Análisis especializado de redes sociales · Red X · Clasificación por niveles de contenido.
          </div>
        </Card>
      </>)}

      {/* Footer */}
      <div style={{ textAlign:"center", fontSize:9, fontFamily:font, color:`${MUTED}50`, marginTop:16 }}>
        Fuente: Análisis de redes sociales · Red X · {R.days} días · {R.firstDay} – {R.lastDay} · {(R.total/1e6).toFixed(1)}M interacciones
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// METHODOLOGY FOOTER — Expandable documentation for dummies
// ═══════════════════════════════════════════════════════════════
