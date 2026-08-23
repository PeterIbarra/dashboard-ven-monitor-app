import { useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Card } from "../Card";
import { ConflictividadChart } from "../charts/ConflictividadChart";
import { EstadosMap } from "../EstadosMap";
import { AcledSection } from "../AcledSection";
import { ConfMensual2026 } from "../ConfMensual2026";
import { ConfSemestre2026 } from "../ConfSemestre2026";
import { CONF_HISTORICO, CONF_MESES, CONF_DERECHOS, CONF_SERVICIOS, CONF_ESTADOS } from "../../data/static.js";
import { CONF_SEMANAL } from "../../data/weekly.js";
import { BG2, BORDER, TEXT, MUTED, ACCENT, font } from "../../constants";

const SECCIONES = [
  { id:"semanal26", label:"Semanal 2026" },
  { id:"semestre26", label:"1er semestre 2026" },
  { id:"mensual26", label:"Mensual 2026" },
  { id:"resumen", label:"Resumen 2025" },
  { id:"mensual", label:"Mensual 2025" },
  { id:"derechos", label:"Derechos 2025" },
  { id:"estados", label:"Estados 2025" },
  { id:"historico", label:"Histórico" },
  { id:"acled", label:"ACLED" },
];

export function TabConflictividad() {
  const mob = useIsMobile();
  const [seccion, setSeccion] = useState("semanal26");
  const [weekDetail, setWeekDetail] = useState(null);
  const [weeklyHistoryOpen, setWeeklyHistoryOpen] = useState(false);
  const [dailyDetailOpen, setDailyDetailOpen] = useState(false);

  const maxMes = Math.max(...CONF_MESES.map(m=>m.t));
  const maxEst = Math.max(...CONF_ESTADOS.map(e=>e.p));
  const maxHist = Math.max(...CONF_HISTORICO.map(h=>h.p));
  const catColor = { DCP:"#0A97D9", DESCA:"#4C9F38" };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>📊</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:TEXT, fontFamily:"'Syne',sans-serif", letterSpacing:"0.05em", textTransform:"uppercase" }}>Conflictividad Social — Venezuela</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED }}>Fuente: OVCS · <span style={{ fontSize:10 }}>DCP: Derechos Civiles y Políticos · DESCA: Derechos Económicos, Sociales, Culturales y Ambientales</span></div>
        </div>
        <div style={{ minWidth:mob?"100%":230 }}>
          <label htmlFor="conflictividad-vista" style={{ display:"block", fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>
            Vista del monitor
          </label>
          <div style={{ position:"relative" }}>
            <select id="conflictividad-vista" value={seccion} onChange={e=>setSeccion(e.target.value)}
              style={{ width:"100%", appearance:"none", WebkitAppearance:"none", background:BG2, color:TEXT,
                border:`1px solid ${BORDER}`, borderLeft:`3px solid ${ACCENT}`, padding:"8px 34px 8px 11px",
                fontSize:12, fontFamily:font, fontWeight:600, letterSpacing:"0.04em", cursor:"pointer", outline:"none" }}>
              {SECCIONES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <span aria-hidden="true" style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", color:ACCENT, fontSize:11, pointerEvents:"none" }}>▼</span>
          </div>
        </div>
      </div>

      {seccion === "semestre26" && <ConfSemestre2026 mobile={mob} />}

      {/* ── SEMANAL 2026 ── */}
      {seccion === "semanal26" && (() => {
        const latest = CONF_SEMANAL[CONF_SEMANAL.length - 1];
        const prev = CONF_SEMANAL.length > 1 ? CONF_SEMANAL[CONF_SEMANAL.length - 2] : null;
        const maxP = Math.max(...CONF_SEMANAL.map(w => w.protestas), 1);
        const maxE = Math.max(...CONF_SEMANAL.map(w => w.estados), 1);
        const totalAcum = CONF_SEMANAL.reduce((s, w) => s + w.protestas, 0);
        const deltaP = prev ? latest.protestas - prev.protestas : null;
        const deltaPct = prev && prev.protestas > 0 ? Math.round(((latest.protestas - prev.protestas) / prev.protestas) * 100) : null;

        return (<>
          {/* KPI row */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(5,1fr)", gap:10, marginBottom:16 }}>
            <Card accent={latest.protestas > 50 ? "#dc2626" : latest.protestas > 30 ? "#ca8a04" : "#16a34a"}>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Protestas semana</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                <span style={{ fontSize:26, fontWeight:800, fontFamily:"'Space Mono',monospace", color:latest.protestas > 50 ? "#dc2626" : latest.protestas > 30 ? "#ca8a04" : TEXT }}>{latest.protestas}</span>
                {deltaP != null && deltaP !== 0 && (
                  <span style={{ fontSize:12, fontFamily:font, color:deltaP > 0 ? "#dc2626" : "#16a34a", fontWeight:600 }}>
                    {deltaP > 0 ? "▲" : "▼"}{Math.abs(deltaP)} ({deltaPct > 0 ? "+" : ""}{deltaPct}%)
                  </span>
                )}
              </div>
              <div style={{ fontSize:10, color:MUTED }}>{latest.label}</div>
            </Card>
            <Card>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Estados</div>
              <span style={{ fontSize:26, fontWeight:800, fontFamily:"'Space Mono',monospace", color:latest.estados > 18 ? "#dc2626" : TEXT }}>{latest.estados}</span>
              <div style={{ fontSize:10, color:MUTED }}>de 24 entidades</div>
            </Card>
            <Card>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Reprimidas</div>
              <span style={{ fontSize:26, fontWeight:800, fontFamily:"'Space Mono',monospace", color:latest.reprimidas > 0 ? "#dc2626" : "#16a34a" }}>{latest.reprimidas}</span>
              <div style={{ fontSize:10, color:MUTED }}>esta semana</div>
            </Card>
            <Card>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Acumulado 2026</div>
              <span style={{ fontSize:26, fontWeight:800, fontFamily:"'Space Mono',monospace", color:ACCENT }}>{totalAcum}</span>
              <div style={{ fontSize:10, color:MUTED }}>S1–{latest.week}</div>
            </Card>
            <Card>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Prom. semanal</div>
              <span style={{ fontSize:26, fontWeight:800, fontFamily:"'Space Mono',monospace", color:TEXT }}>{Math.round(totalAcum / CONF_SEMANAL.length)}</span>
              <div style={{ fontSize:10, color:MUTED }}>protestas/semana</div>
            </Card>
          </div>

          {/* Hecho clave de la semana */}
          <div style={{ background:`linear-gradient(135deg, #dc262608, transparent)`, border:"1px solid #dc262620", padding:"10px 14px", marginBottom:16 }}>
            <div style={{ fontSize:10, fontFamily:font, color:"#dc2626", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Hecho clave · {latest.label}</div>
            <div style={{ fontSize:13, color:TEXT, lineHeight:1.6 }}>{latest.hecho}</div>
          </div>

          {/* Motivos de la semana */}
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>Motivos principales · {latest.label}</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {latest.motivos.map((m, i) => (
                <span key={i} style={{ fontSize:12, padding:"4px 12px", background:`${ACCENT}10`, color:ACCENT, border:`1px solid ${ACCENT}25`, borderRadius:20, fontFamily:font }}>{m}</span>
              ))}
            </div>
          </Card>

          {/* Evolución semanal — gráfica de barras */}
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Evolución semanal · Protestas S1 → {latest.week}</div>
            <div style={{ display:"flex", gap:3, alignItems:"flex-end", height:140 }}>
              {CONF_SEMANAL.map((w, i) => {
                const h = Math.max(4, (w.protestas / maxP) * 120);
                const isLast = i === CONF_SEMANAL.length - 1;
                const barColor = w.protestas > 50 ? "#dc2626" : w.protestas > 30 ? "#ca8a04" : ACCENT;
                return (
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                    <span style={{ fontSize:9, fontFamily:font, fontWeight:isLast ? 700 : 400, color:isLast ? barColor : MUTED }}>{w.protestas}</span>
                    <div style={{ width:"100%", height:h, background:barColor, opacity:isLast ? 1 : 0.5, borderRadius:"3px 3px 0 0", transition:"height 0.3s", position:"relative" }}>
                      {isLast && <div style={{ position:"absolute", top:-2, left:"50%", transform:"translateX(-50%)", width:6, height:6, borderRadius:"50%", background:barColor, boxShadow:`0 0 6px ${barColor}` }} />}
                    </div>
                    <span style={{ fontSize:8, fontFamily:font, color:isLast ? barColor : MUTED, fontWeight:isLast ? 700 : 400 }}>{w.week}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Estados por semana — sparkline horizontal */}
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Cobertura territorial · Estados con protestas</div>
            <div style={{ display:"flex", gap:3, alignItems:"flex-end", height:80 }}>
              {CONF_SEMANAL.map((w, i) => {
                const h = Math.max(4, (w.estados / 24) * 70);
                const isLast = i === CONF_SEMANAL.length - 1;
                const barColor = w.estados > 18 ? "#dc2626" : w.estados > 12 ? "#ca8a04" : "#0e7490";
                return (
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                    <span style={{ fontSize:9, fontFamily:font, fontWeight:isLast ? 700 : 400, color:isLast ? barColor : MUTED }}>{w.estados}</span>
                    <div style={{ width:"100%", height:h, background:barColor, opacity:isLast ? 1 : 0.5, borderRadius:"3px 3px 0 0" }} />
                    <span style={{ fontSize:8, fontFamily:font, color:isLast ? barColor : MUTED, fontWeight:isLast ? 700 : 400 }}>{w.week}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:10, fontFamily:font, color:MUTED }}>
              <span>Cobertura: {latest.estados}/24 estados ({Math.round(latest.estados/24*100)}%)</span>
              <span>{latest.estados > 18 ? "⚠ Alcance nacional" : latest.estados > 12 ? "Alcance multi-regional" : "Alcance regional"}</span>
            </div>
          </Card>

          {/* Table: all weeks */}
          <Card>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase" }}>
                Detalle semanal · {weeklyHistoryOpen ? "Ciclo 2026 completo" : `Últimas ${Math.min(6, CONF_SEMANAL.length)} semanas`}
              </div>
              <button onClick={() => setWeeklyHistoryOpen(value => !value)} aria-expanded={weeklyHistoryOpen}
                style={{ marginLeft:"auto", border:`1px solid ${ACCENT}45`, background:weeklyHistoryOpen?`${ACCENT}10`:"#fff", color:ACCENT, padding:"5px 10px", fontSize:9, fontFamily:font, fontWeight:700, cursor:"pointer" }}>
                {weeklyHistoryOpen ? "Mostrar solo recientes ▲" : `Ver ciclo completo (${CONF_SEMANAL.length}) ▼`}
              </button>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:font }}>
                <thead>
                  <tr style={{ borderBottom:`2px solid ${BORDER}` }}>
                    {["Semana","Período","Protestas","Estados","Repr.","Hecho clave"].map(h => (
                      <th key={h} style={{ padding:"6px 8px", textAlign:"left", color:MUTED, fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(weeklyHistoryOpen ? CONF_SEMANAL : CONF_SEMANAL.slice(-6)).map((w) => {
                    const isLast = w.week === latest.week;
                    return (
                      <tr key={w.week} style={{ borderBottom:`1px solid ${BORDER}30`, background:isLast ? `${ACCENT}06` : "transparent" }}>
                        <td style={{ padding:"6px 8px", fontWeight:isLast ? 700 : 400, color:isLast ? ACCENT : TEXT }}>{w.week}</td>
                        <td style={{ padding:"6px 8px", color:MUTED }}>{w.label}</td>
                        <td style={{ padding:"6px 8px", fontWeight:600, color:w.protestas > 50 ? "#dc2626" : w.protestas > 30 ? "#ca8a04" : TEXT }}>{w.protestas}</td>
                        <td style={{ padding:"6px 8px", color:w.estados > 18 ? "#dc2626" : TEXT }}>{w.estados}/24</td>
                        <td style={{ padding:"6px 8px", color:w.reprimidas > 0 ? "#dc2626" : "#16a34a" }}>{w.reprimidas}</td>
                        <td style={{ padding:"6px 8px", color:MUTED, fontSize:11, maxWidth:250, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.hecho}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Weekly detail selector — daily breakdown */}
          {(() => {
            const weeksWithDays = CONF_SEMANAL.filter(w => w.dias && w.dias.length > 0);
            if (weeksWithDays.length === 0) return null;
            const selWeek = weeksWithDays.find(w => w.week === weekDetail) || weeksWithDays[weeksWithDays.length - 1];
            const maxDayP = Math.max(...selWeek.dias.map(d => d.protestas), 1);
            return (
              <Card>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, flexWrap:"wrap" }}>
                  <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase" }}>Detalle diario</div>
                  <select aria-label="Semana para detalle diario" value={selWeek.week} onChange={event => setWeekDetail(event.target.value)}
                    style={{ marginLeft:"auto", minWidth:mob?"100%":210, border:`1px solid ${BORDER}`, borderLeft:`3px solid ${ACCENT}`, background:BG2, color:TEXT, padding:"6px 9px", fontSize:10, fontFamily:font, fontWeight:600, cursor:"pointer" }}>
                    {weeksWithDays.map(w => <option key={w.week} value={w.week}>{w.week} · {w.label}</option>)}
                  </select>
                  <button onClick={() => setDailyDetailOpen(value => !value)} aria-expanded={dailyDetailOpen}
                    style={{ border:`1px solid ${ACCENT}45`, background:dailyDetailOpen?`${ACCENT}10`:ACCENT, color:dailyDetailOpen?ACCENT:"#fff", padding:"6px 10px", fontSize:9, fontFamily:font, fontWeight:700, cursor:"pointer" }}>
                    {dailyDetailOpen ? "Ocultar desglose ▲" : "Ver desglose diario ▼"}
                  </button>
                </div>

                {/* Compact summary */}
                <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"110px 110px 110px 1fr", gap:1, background:BORDER, border:`1px solid ${BORDER}` }}>
                  {[
                    { value:selWeek.protestas, label:"Protestas", color:selWeek.protestas>50?"#dc2626":TEXT },
                    { value:`${selWeek.estados}/24`, label:"Estados", color:selWeek.estados>18?"#dc2626":TEXT },
                    { value:selWeek.reprimidas, label:"Reprimidas", color:selWeek.reprimidas>0?"#dc2626":"#16a34a" },
                  ].map(item => <div key={item.label} style={{ background:BG2, padding:"8px 10px", textAlign:"center" }}>
                    <span style={{ fontSize:18, fontWeight:800, color:item.color, fontFamily:"'Space Mono',monospace" }}>{item.value}</span>
                    <div style={{ fontSize:8, fontFamily:font, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase" }}>{item.label}</div>
                  </div>)}
                  <div style={{ background:BG2, padding:"8px 12px", display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                    <span style={{ fontSize:8, fontFamily:font, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase", flexShrink:0 }}>Motivos</span>
                    <span style={{ fontSize:10, fontFamily:font, color:ACCENT, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{selWeek.motivos.slice(0,3).join(" · ")}</span>
                  </div>
                </div>

                {dailyDetailOpen && <>
                <div style={{ fontSize:9, fontFamily:font, color:MUTED, margin:"10px 0 12px", lineHeight:1.5 }}>
                  <strong style={{ color:"#0A97D9" }}>ESCP</strong> = Exigencias Económicas, Sociales, Culturales y Políticas · <strong style={{ color:"#4C9F38" }}>CPP</strong> = Civiles y Políticas Puras · <strong style={{ color:"#0A97D9" }}>DCP</strong> = Derechos Civiles y Políticos · <strong style={{ color:"#4C9F38" }}>DESCA</strong> = Derechos Económicos, Sociales, Culturales y Ambientales
                </div>
                {/* Bar chart + table */}
                <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:100, marginBottom:6, padding:"0 4px" }}>
                  {selWeek.dias.map((d, i) => {
                    const h = Math.max((d.protestas / maxDayP) * 90, 4);
                    const isMax = d.protestas === maxDayP;
                    return (
                      <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                        <span style={{ fontSize:10, fontWeight:isMax?700:400, color:isMax?ACCENT:TEXT, fontFamily:font }}>{d.protestas}</span>
                        <div style={{ width:"100%", maxWidth:50, height:h, background:isMax?ACCENT:`${ACCENT}60`, borderRadius:"2px 2px 0 0", transition:"height 0.3s" }} />
                      </div>
                    );
                  })}
                </div>
                <div style={{ display:"flex", gap:4, marginBottom:14, padding:"0 4px" }}>
                  {selWeek.dias.map((d, i) => (
                    <div key={i} style={{ flex:1, textAlign:"center", fontSize:9, fontFamily:font, color:MUTED }}>{d.fecha}</div>
                  ))}
                </div>

                {/* Daily table */}
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, fontFamily:font }}>
                    <thead>
                      <tr style={{ borderBottom:`2px solid ${BORDER}` }}>
                        {["Fecha","Protestas","Estados","Tipo","Exigencias principales"].map(h => (
                          <th key={h} style={{ padding:"5px 8px", textAlign:"left", color:MUTED, fontSize:9, letterSpacing:"0.08em", textTransform:"uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selWeek.dias.map((d, i) => {
                        const isMax = d.protestas === maxDayP;
                        return (
                          <tr key={i} style={{ borderBottom:`1px solid ${BORDER}30`, background:isMax?`${ACCENT}06`:"transparent" }}>
                            <td style={{ padding:"5px 8px", fontWeight:isMax?700:400, color:isMax?ACCENT:TEXT, whiteSpace:"nowrap" }}>{d.fecha}</td>
                            <td style={{ padding:"5px 8px", fontWeight:600, color:d.protestas > 20 ? "#dc2626" : d.protestas > 10 ? "#ca8a04" : TEXT }}>{d.protestas}</td>
                            <td style={{ padding:"5px 8px", color:d.estados > 15 ? "#dc2626" : TEXT }}>{d.estados}</td>
                            <td style={{ padding:"5px 8px", color:MUTED, fontSize:10 }}>{d.tipo}</td>
                            <td style={{ padding:"5px 8px", color:MUTED, fontSize:10 }}>{d.exigencias}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Hecho clave */}
                <div style={{ marginTop:10, padding:"8px 12px", background:`${ACCENT}06`, border:`1px solid ${BORDER}`, fontSize:12, fontFamily:font, color:TEXT }}>
                  📋 <strong>Hecho clave:</strong> {selWeek.hecho}
                </div>
                </>}
              </Card>
            );
          })()}
        </>);
      })()}

      {/* ── MENSUAL 2026 (OVCS) ── */}
      {seccion === "mensual26" && <ConfMensual2026 />}

      {/* ── RESUMEN ── */}
      {seccion === "resumen" && (<>
        <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:10, marginBottom:16 }}>
          {[{k:"Total 2025",v:"2.219",c:ACCENT,s:"-57% vs 2024 · Mínimo histórico"},{k:"DESCA",v:"1.248",c:"#4C9F38",s:"56% · Laborales, vivienda, servicios"},
            {k:"DCP",v:"971",c:"#0A97D9",s:"44% · Políticos, justicia"},{k:"Reprimidas",v:"55",c:"#E5243B",s:"2,5% · Patrón selectivo"}
          ].map((d,i) => (
            <Card key={i} accent={d.c}>
              <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{d.k}</div>
              <div style={{ fontSize:22, fontWeight:800, color:d.c, fontFamily:font }}>{d.v}</div>
              <div style={{ fontSize:10, color:MUTED, marginTop:2 }}>{d.s}</div>
            </Card>
          ))}
        </div>
        {/* Servicios básicos */}
        <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
          Protestas por servicios básicos · 275 total
        </div>
        <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:8, marginBottom:16 }}>
          {CONF_SERVICIOS.map((s,i) => (
            <div key={i} style={{ background:BG2, border:`1px solid ${BORDER}`, padding:"10px 12px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <span style={{ fontSize:16 }}>{s.i}</span>
                <span style={{ fontSize:13, fontWeight:600, color:TEXT }}>{s.s}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ flex:1, height:4, background:`${BORDER}`, borderRadius:2 }}>
                  <div style={{ width:`${s.pct}%`, height:"100%", background:ACCENT, borderRadius:2 }} />
                </div>
                <span style={{ fontSize:12, fontFamily:font, color:ACCENT, minWidth:30 }}>{s.p}</span>
              </div>
              <div style={{ fontSize:10, color:MUTED, marginTop:4 }}>{s.pct}%</div>
            </div>
          ))}
        </div>
        {/* Mini histórico */}
        <Card>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
            Serie histórica 2011–2025
          </div>
          <ConflictividadChart />
        </Card>
      </>)}

      {/* ── MENSUAL ── */}
      {seccion === "mensual" && (<>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
          <Card accent="#E5243B">
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Mes pico</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#E5243B", fontFamily:font }}>Enero · 401</div>
            <div style={{ fontSize:10, color:MUTED, marginTop:2 }}>36 reprimidas · DCP dominante</div>
          </Card>
          <Card accent="#4C9F38">
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Mes mínimo</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#4C9F38", fontFamily:font }}>Diciembre · 123</div>
            <div style={{ fontSize:10, color:MUTED, marginTop:2 }}>1 reprimida · DESCA dominante</div>
          </Card>
        </div>
        {/* Monthly bar chart */}
        <Card>
          <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:200, paddingBottom:20 }}>
            {CONF_MESES.map((m,i) => {
              const pct = (m.t/maxMes)*100;
              const descaPct = (m.desca/m.t)*100;
              return (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%", position:"relative" }}>
                  <div style={{ fontSize:9, fontFamily:font, color:m.rep>0?"#E5243B":MUTED, marginBottom:2 }}>{m.t}</div>
                  <div style={{ width:"100%", height:`${pct}%`, position:"relative", borderRadius:"2px 2px 0 0", overflow:"hidden", minHeight:2 }}>
                    <div style={{ position:"absolute", bottom:0, width:"100%", height:`${descaPct}%`, background:"#4C9F38" }} />
                    <div style={{ position:"absolute", top:0, width:"100%", height:`${100-descaPct}%`, background:"#0A97D9" }} />
                  </div>
                  {m.rep > 0 && <div style={{ fontSize:8, color:"#E5243B", marginTop:1 }}>{m.rep}R</div>}
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, marginTop:3 }}>{m.m}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:8 }}>
            <span style={{ fontSize:10, fontFamily:font, color:"#4C9F38" }}>● DESCA</span>
            <span style={{ fontSize:10, fontFamily:font, color:"#0A97D9" }}>● DCP</span>
            <span style={{ fontSize:10, fontFamily:font, color:"#E5243B" }}>● R = Reprimidas</span>
          </div>
        </Card>
        {/* Monthly detail */}
        <div style={{ marginTop:12 }}>
          {CONF_MESES.map((m,i) => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"60px 50px 1fr", gap:12, padding:"8px 0", borderBottom:`1px solid ${BORDER}30`, alignItems:"center" }}>
              <span style={{ fontSize:13, fontWeight:600, color:TEXT }}>{m.m}</span>
              <span style={{ fontSize:13, fontFamily:font, color:ACCENT }}>{m.t}</span>
              <span style={{ fontSize:12, color:MUTED, lineHeight:1.4 }}>{m.hecho}</span>
            </div>
          ))}
        </div>
      </>)}

      {/* ── DERECHOS ── */}
      {seccion === "derechos" && (
        <div>
          {CONF_DERECHOS.map((d,i) => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"30px 1fr 60px 50px", gap:10, padding:"10px 0", borderBottom:`1px solid ${BORDER}30`, alignItems:"center" }}>
              <span style={{ fontSize:16, fontWeight:800, color:catColor[d.cat], fontFamily:font, textAlign:"center" }}>#{i+1}</span>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:TEXT }}>{d.d}</div>
                <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${catColor[d.cat]}15`, color:catColor[d.cat], border:`1px solid ${catColor[d.cat]}30` }}>{d.cat}</span>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:16, fontWeight:700, color:catColor[d.cat], fontFamily:font }}>{d.p}</div>
                <div style={{ fontSize:10, color:MUTED }}>{d.pct}%</div>
              </div>
              <div style={{ height:6, background:BORDER, borderRadius:3 }}>
                <div style={{ width:`${(d.pct/30)*100}%`, height:"100%", background:catColor[d.cat], borderRadius:3, maxWidth:"100%" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ESTADOS ── */}
      {seccion === "estados" && (
        <EstadosMap />
      )}

      {/* ── HISTÓRICO ── */}
      {seccion === "historico" && (<>
        <Card>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
            Serie histórica 2011–2025 · OVCS
          </div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:200, paddingBottom:20 }}>
            {CONF_HISTORICO.map((h,i) => {
              const pct = (h.p/maxHist)*100;
              const isLast = i === CONF_HISTORICO.length-1;
              const isPeak = h.p === maxHist;
              return (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%" }}>
                  <div style={{ fontSize:9, fontFamily:font, color:isLast?ACCENT:isPeak?"#E5243B":MUTED, marginBottom:2 }}>
                    {(h.p/1000).toFixed(1)}k
                  </div>
                  <div style={{ width:"100%", height:`${pct}%`, background:isLast?ACCENT:isPeak?"#E5243B":`${ACCENT}40`,
                    borderRadius:"2px 2px 0 0", minHeight:2 }} />
                  <div style={{ fontSize:9, fontFamily:font, color:isLast?ACCENT:MUTED, marginTop:4, transform:"rotate(-45deg)", transformOrigin:"top left", whiteSpace:"nowrap" }}>
                    {String(h.y).slice(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        {/* Year detail */}
        <div style={{ marginTop:12 }}>
          {CONF_HISTORICO.slice().reverse().map((h,i) => {
            const prev = CONF_HISTORICO.find(x=>x.y===h.y-1);
            const delta = prev ? h.p - prev.p : null;
            return (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"50px 70px 1fr 60px", gap:10, padding:"8px 0", borderBottom:`1px solid ${BORDER}30`, alignItems:"center" }}>
                <span style={{ fontSize:14, fontWeight:h.y===2025||h.y===2019?700:400, color:h.y===2025?ACCENT:h.y===2019?"#E5243B":TEXT }}>{h.y}</span>
                <span style={{ fontSize:14, fontFamily:font, color:h.y===2025?ACCENT:h.y===2019?"#E5243B":TEXT, fontWeight:600 }}>{h.p.toLocaleString()}</span>
                <span style={{ fontSize:12, color:MUTED, lineHeight:1.4 }}>{h.h}</span>
                {delta !== null && (
                  <span style={{ fontSize:12, fontFamily:font, color:delta>0?"#E5243B":"#22c55e", textAlign:"right" }}>
                    {delta>0?"+":""}{delta.toLocaleString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </>)}

      {seccion === "acled" && <AcledSection />}
    </div>
  );
}
