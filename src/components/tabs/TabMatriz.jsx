import { useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { WEEKS } from "../../data/weekly.js";
import { SCENARIOS } from "../../data/static.js";
import { INDICATORS, SCENARIO_SIGNALS } from "../../data/indicators.js";
import { WEEK_DRIVERS } from "../../data/weekDrivers.js";
import { BG2, BG3, BORDER, TEXT, MUTED, ACCENT, SC, SEM, font } from "../../constants";
import { Card } from "../Card";
import { SemDot } from "../SemDot";
import { FullMatrix } from "../charts/FullMatrix";
import { Sparkline } from "../charts/Sparkline";

export function TabMatriz({ week, setWeek }) {
  const mob = useIsMobile();
  const [sel, setSel] = useState(3);
  const [showTrend, setShowTrend] = useState(false);
  const wk = WEEKS[week];
  const prevWk = week > 0 ? WEEKS[week-1] : null;
  const dom = wk.probs.reduce((a,b)=>a.v>b.v?a:b);
  const domSc = SCENARIOS.find(s=>s.id===dom.sc);
  const isCurrentWeek = week === WEEKS.length - 1;

  // Para la semana actual usar WEEK_DRIVERS (más detallados)
  // Para semanas anteriores usar los trendDrivers embebidos en WEEKS
  const selDrivers = isCurrentWeek
    ? (WEEK_DRIVERS[sel] || {})
    : {
        drivers: sel === (wk.trendSc || dom.sc)
          ? (wk.trendDrivers || [])
          : [],
        signals: [],
        _isArchive: true,
      };

  const trendSc = SCENARIOS.find(s=>s.id===(wk.trendSc||dom.sc));
  const trendDriversList = wk.trendDrivers || [];
  const isSameTrend = (wk.trendSc||dom.sc) === dom.sc;
  const trendIconMap = { up:"↑", down:"↓", flat:"→" };
  const trendColorMap = { up:"#22c55e", down:"#ef4444", flat:MUTED };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* ── ROW 1: Matrix + Sidebar ── */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 320px", gap:14 }}>

        {/* Matrix SVG */}
        <div>
          <div style={{ border:`1px solid ${BORDER}`, position:"relative" }}>
            <FullMatrix weekIdx={week} onClickWeek={setWeek} onArrowClick={() => setShowTrend(!showTrend)} />
          </div>

          {/* ── TREND PANEL (appears when arrow is clicked) ── */}
          {showTrend && (
            <div style={{ marginTop:8, background:`linear-gradient(135deg, ${trendSc.color}0a, transparent)`,
              border:`1px solid ${trendSc.color}25`, padding:"14px 18px", position:"relative" }}>
              <button onClick={() => setShowTrend(false)}
                style={{ position:"absolute", top:8, right:12, background:"transparent", border:"none",
                  color:MUTED, cursor:"pointer", fontSize:16, fontFamily:font }}>×</button>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:16 }}>{isSameTrend ? "→" : "↑"}</span>
                <div>
                  <div style={{ fontSize:12, fontFamily:font, color:trendSc.color, letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700 }}>
                    {isSameTrend ? "CONSOLIDANDO" : "PRESIÓN HACIA TRANSICIÓN"}
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:TEXT }}>
                    E{trendSc.id}: {trendSc.name}
                  </div>
                </div>
                <span style={{ marginLeft:"auto", fontSize:14, fontFamily:font, color:trendSc.color, fontWeight:700 }}>
                  {wk.probs.find(p=>p.sc===trendSc.id)?.v}%
                </span>
              </div>
              <div style={{ fontSize:12, fontFamily:font, color:trendSc.color, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>
                Factores que empujan en esta dirección
              </div>
              {trendDriversList.map((d,i) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:5, fontSize:13, color:"#3d4f5f", lineHeight:1.6 }}>
                  <span style={{ color:trendSc.color, flexShrink:0 }}>›</span>{d}
                </div>
              ))}
            </div>
          )}

          {/* Probability bars below matrix */}
          <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:6 }}>
            {wk.probs.map(p => {
              const sc = SCENARIOS.find(s=>s.id===p.sc);
              const delta = prevWk ? p.v - (prevWk.probs.find(pp=>pp.sc===p.sc)?.v||0) : null;
              return (
                <div key={p.sc} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"3px 0" }} onClick={()=>setSel(p.sc)}>
                  <span style={{ fontSize:13, fontFamily:font, color:sc.color, width:22, fontWeight:sel===p.sc?700:400 }}>E{sc.id}</span>
                  <div style={{ flex:1, height:6, background:BORDER, borderRadius:2 }}>
                    <div style={{ height:6, background:sc.color, width:`${p.v}%`, borderRadius:2, transition:"width 0.4s", opacity:sel===p.sc?1:0.6 }} />
                  </div>
                  <span style={{ fontSize:14, fontFamily:font, color:sc.color, width:32, textAlign:"right", fontWeight:700 }}>{p.v}%</span>
                  {delta !== null && delta !== 0 && (
                    <span style={{ fontSize:12, fontFamily:font, color:delta>0?"#22c55e":"#ef4444", width:32 }}>
                      {delta>0?"+":""}{delta}pp
                    </span>
                  )}
                  <span style={{ fontSize:12, color:trendColorMap[p.t] }}>{trendIconMap[p.t]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Scenario cards + detail */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {SCENARIOS.map(sc => {
            const p = wk.probs.find(p=>p.sc===sc.id);
            const isActive = sel === sc.id;
            return (
              <div key={sc.id} onClick={()=>setSel(sc.id)}
                style={{ background:isActive?`${sc.color}08`:BG2, border:`1px solid ${isActive?sc.color:BORDER}`, borderLeft:`3px solid ${sc.color}`,
                  padding:"10px 14px", cursor:"pointer", transition:"all 0.2s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                  <span style={{ fontSize:12, fontFamily:font, color:sc.color, letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700 }}>
                    E{sc.id} {p.sc===dom.sc?"· DOMINANTE":""}
                  </span>
                  <span style={{ fontSize:15, fontFamily:font, fontWeight:700, color:sc.color }}>{p.v}%</span>
                </div>
                <div style={{ fontSize:14, fontWeight:600, color:isActive?TEXT:`${TEXT}90`, lineHeight:1.3 }}>{sc.name}</div>
              </div>
            );
          })}

          {/* Detail panel for selected scenario */}
          <div style={{ background:BG3, border:`1px solid ${BORDER}`, padding:"14px 16px", flex:1 }}>
            <div style={{ fontSize:12, fontFamily:"'Syne',sans-serif", fontWeight:700, color:SC[sel], letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
              E{sel} — {SCENARIOS.find(s=>s.id===sel)?.name}
            </div>

            {/* Modo archivo — aviso + trendDrivers del escenario dominante */}
            {selDrivers._isArchive && (
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, background:`${MUTED}10`, border:`1px solid ${BORDER}`, borderRadius:4, padding:"6px 10px", marginBottom:10, lineHeight:1.5 }}>
                📁 Semana archivada · {wk.label} — mostrando drivers del escenario dominante (E{wk.trendSc || dom.sc})
              </div>
            )}

            {selDrivers.drivers && selDrivers.drivers.length > 0 && (
              <>
                <div style={{ fontSize:10, fontFamily:font, color:SC[sel], letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>
                  Drivers estructurales
                </div>
                {selDrivers.drivers.map((d,i) => (
                  <div key={i} style={{ display:"flex", gap:6, marginBottom:4, fontSize:13, color:"#3d4f5f", lineHeight:1.5 }}>
                    <span style={{ color:`${SC[sel]}80`, flexShrink:0 }}>›</span>{d}
                  </div>
                ))}
              </>
            )}

            {/* Modo archivo sin datos del escenario seleccionado */}
            {selDrivers._isArchive && selDrivers.drivers.length === 0 && (
              <div style={{ fontSize:12, color:MUTED, fontFamily:font, lineHeight:1.6, marginTop:8 }}>
                Los drivers detallados de E{sel} para esta semana están disponibles en la <strong>Lectura analítica</strong> ↓
              </div>
            )}

            {selDrivers.signals && selDrivers.signals.length > 0 && (
              <>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginTop:10, marginBottom:6 }}>
                  Señales de activación
                </div>
                {selDrivers.signals.map((s,i) => (
                  <div key={i} style={{ display:"flex", gap:6, marginBottom:4, fontSize:13, color:"#6b7280", lineHeight:1.5 }}>
                    <span style={{ color:`${MUTED}80`, flexShrink:0 }}>›</span>{s}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 2: Weekly evolution chart ── */}
      <div style={{ border:`1px solid ${BORDER}`, padding:"14px 16px" }}>
        <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:12 }}>
          Evolución de probabilidades por semana
        </div>
        <div style={{ display:"flex", gap:3, alignItems:"flex-end", height:90 }}>
          {WEEKS.map((w,i) => (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer" }}
              onClick={() => setWeek && setWeek(i)}>
              {/* Stacked bars */}
              <div style={{ display:"flex", flexDirection:"column", gap:1, width:"85%", alignItems:"center" }}>
                {w.probs.slice().sort((a,b)=>b.v-a.v).map(p => (
                  <div key={p.sc} style={{ width:"100%", height:Math.max(2, p.v*0.7), background:SC[p.sc], borderRadius:1,
                    opacity:i===week?1:0.4, transition:"opacity 0.2s" }} />
                ))}
              </div>
              {/* Label */}
              <span style={{ fontSize:10, fontFamily:font, color:i===week?ACCENT:MUTED, marginTop:6, fontWeight:i===week?700:400 }}>
                {w.short}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:14, marginTop:10, justifyContent:"center" }}>
          {SCENARIOS.map(sc => (
            <div key={sc.id} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:MUTED }}>
              <span style={{ width:8, height:8, background:sc.color, borderRadius:1, flexShrink:0 }} />
              E{sc.id}: {sc.short}
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 3: Lectura analítica ── */}
      {wk.lectura && (
        <div style={{ background:`linear-gradient(135deg, ${domSc.color}06, transparent)`, border:`1px solid ${domSc.color}15`, padding:"16px 20px" }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:10 }}>
            <span style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase" }}>
              Lectura analítica · {wk.label}
            </span>
            <span style={{ fontSize:14, fontWeight:700, color:domSc.color }}>E{domSc.id}: {domSc.name} · {dom.v}%</span>
          </div>
          <div style={{ fontSize:14, color:"#3d4f5f", lineHeight:1.75, fontStyle:"italic" }}>
            {wk.lectura}
          </div>
        </div>
      )}
    </div>
  );
}
