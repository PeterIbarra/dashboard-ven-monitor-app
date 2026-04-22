import { useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Card } from "../Card";
import { Badge } from "../Badge";
import { SemDot } from "../SemDot";
import { Sparkline } from "../charts/Sparkline";
import { InstabilityChart } from "../charts/InstabilityChart";
import { BilateralChart } from "../charts/BilateralChart";
import { NewsAlerts } from "../NewsAlerts";
import { CohesionMiniWidget } from "../CohesionMiniWidget";
import { RedesMiniWidget } from "../RedesMiniWidget";
import { WEEKS, KPIS_LATEST, TENSIONS, CONF_SEMANAL } from "../../data/weekly.js";
import { INDICATORS, SCENARIO_SIGNALS } from "../../data/indicators.js";
import { SCENARIOS, CONF_MESES } from "../../data/static.js";
import { AMNISTIA_TRACKER } from "../../data/amnistia.js";
import { REDES_TOTALS } from "../../data/redes.js";
import { BG2, BG3, BORDER, TEXT, MUTED, ACCENT, SC, SEM, font, fontSans } from "../../constants";

export function TabDashboard({ week, liveData = {}, setTab }) {
  const mob = useIsMobile();
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const wk = WEEKS[week];
  const prevWk = week > 0 ? WEEKS[week-1] : null;
  const dom = wk.probs.reduce((a,b) => a.v > b.v ? a : b);
  const domSc = SCENARIOS.find(s=>s.id===dom.sc);
  const trendIcon = { up:"↑", down:"↓", flat:"→" };
  const trendColor = { up:"#22c55e", down:"#ef4444", flat:MUTED };
  const trendLabel = { up:"Al alza", down:"A la baja", flat:"Estable" };
  const semTotal = wk.sem.g + wk.sem.y + wk.sem.r || 1;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* ── ROW 0: Alertas en Vivo por Umbral ── */}
      {(() => {
        const liveAlerts = [];

        // Brecha cambiaria
        if (liveData?.dolar?.brecha) {
          const brecha = parseFloat(liveData.dolar.brecha);
          if (brecha > 55) liveAlerts.push({ name:"Brecha cambiaria", val:`${brecha.toFixed(1)}%`, umbral:"Brecha >55% activa presión E2 — riesgo de colapso económico", level:"red" });
          else if (brecha > 45) liveAlerts.push({ name:"Brecha cambiaria", val:`${brecha.toFixed(1)}%`, umbral:"Brecha en zona crítica (>45%) — presión social creciente", level:"yellow" });
          else if (brecha > 40) liveAlerts.push({ name:"Brecha cambiaria", val:`${brecha.toFixed(1)}%`, umbral:"Brecha >40% — seguimiento activo recomendado", level:"yellow" });
        }

        // Dólar paralelo
        if (liveData?.dolar?.paralelo) {
          const paralelo = parseFloat(liveData.dolar.paralelo);
          if (paralelo > 700) liveAlerts.push({ name:"Dólar paralelo", val:`${paralelo.toFixed(0)} Bs`, umbral:"Paralelo >700 Bs genera presión social y erosión salarial", level:"red" });
          else if (paralelo > 600) liveAlerts.push({ name:"Dólar paralelo", val:`${paralelo.toFixed(0)} Bs`, umbral:"Paralelo en zona de presión (>600 Bs)", level:"yellow" });
        }

        // Brent
        if (liveData?.oil?.brent) {
          const brent = parseFloat(liveData.oil.brent);
          if (brent < 60) liveAlerts.push({ name:"Brent \u2b07", val:`$${brent.toFixed(2)}`, umbral:"Brent <$60 presiona ingresos petroleros \u2014 riesgo fiscal E2", level:"red" });
          else if (brent < 65) liveAlerts.push({ name:"Brent \u2b07", val:`$${brent.toFixed(2)}`, umbral:"Brent <$65 reduce margen fiscal venezolano", level:"yellow" });
          else if (brent > 95) liveAlerts.push({ name:"Brent \u2b06", val:`$${brent.toFixed(2)}`, umbral:"Brent >$95 \u2014 ingresos r\u00e9cord pero posible shock geopol\u00edtico (Ormuz/Ir\u00e1n)", level:"red" });
          else if (brent > 85) liveAlerts.push({ name:"Brent \u2b06", val:`$${brent.toFixed(2)}`, umbral:"Brent >$85 \u2014 favorable para ingresos VEN, monitorear volatilidad", level:"yellow" });
        }

        // WTI
        if (liveData?.oil?.wti) {
          const wti = parseFloat(liveData.oil.wti);
          if (wti < 55) liveAlerts.push({ name:"WTI \u2b07", val:`$${wti.toFixed(2)}`, umbral:"WTI <$55 se\u00f1al de debilidad en mercado energ\u00e9tico", level:"red" });
          else if (wti < 60) liveAlerts.push({ name:"WTI \u2b07", val:`$${wti.toFixed(2)}`, umbral:"WTI en zona de presi\u00f3n (<$60)", level:"yellow" });
          else if (wti > 90) liveAlerts.push({ name:"WTI \u2b06", val:`$${wti.toFixed(2)}`, umbral:"WTI >$90 \u2014 tensi\u00f3n en mercado energ\u00e9tico global, ingresos VEN al alza", level:"red" });
          else if (wti > 80) liveAlerts.push({ name:"WTI \u2b06", val:`$${wti.toFixed(2)}`, umbral:"WTI >$80 \u2014 favorable para Venezuela, monitorear causa del alza", level:"yellow" });
        }

        // Bilateral Threat Index
        if (liveData?.bilateral?.latest?.v) {
          const bilV = liveData.bilateral.latest.v;
          if (bilV > 2.0) liveAlerts.push({ name:"Bilateral 🇺🇸🇻🇪", val:`${bilV.toFixed(2)}σ`, umbral:"Índice bilateral CRÍTICO (>2σ) — crisis activa en relación EE.UU.-Venezuela", level:"red" });
          else if (bilV > 1.0) liveAlerts.push({ name:"Bilateral 🇺🇸🇻🇪", val:`${bilV.toFixed(2)}σ`, umbral:"Índice bilateral ALTO (>1σ) — tensión significativa", level:"yellow" });
        }

        // Conflictividad social (CONF_SEMANAL)
        if (CONF_SEMANAL.length > 0) {
          const lastW = CONF_SEMANAL[CONF_SEMANAL.length - 1];
          const prevW = CONF_SEMANAL.length > 1 ? CONF_SEMANAL[CONF_SEMANAL.length - 2] : null;
          const accel = prevW && prevW.protestas > 0 ? ((lastW.protestas - prevW.protestas) / prevW.protestas) * 100 : 0;

          // Weekly volume thresholds
          if (lastW.protestas > 50) liveAlerts.push({ name:"Protestas ✊", val:`${lastW.protestas}/sem`, umbral:`>50 protestas semanales — presión política de primer orden (${lastW.label})`, level:"red" });
          else if (lastW.protestas > 35) liveAlerts.push({ name:"Protestas ✊", val:`${lastW.protestas}/sem`, umbral:`Escalada sobre promedio del ciclo (>35/sem) — seguimiento activo`, level:"yellow" });

          // Territorial spread thresholds
          if (lastW.estados > 18) liveAlerts.push({ name:"Cobertura territorial", val:`${lastW.estados}/24`, umbral:`Protestas en ${lastW.estados} estados — alcance casi nacional`, level:"red" });
          else if (lastW.estados > 12) liveAlerts.push({ name:"Cobertura territorial", val:`${lastW.estados}/24`, umbral:`Protestas en ${lastW.estados} estados — multi-regional`, level:"yellow" });

          // Acceleration trigger: >50% increase week-over-week
          if (accel > 50) liveAlerts.push({ name:"Aceleración ⚡", val:`+${Math.round(accel)}%`, umbral:`Protestas aumentaron ${Math.round(accel)}% vs semana anterior (${prevW.protestas}→${lastW.protestas}) — escalada rápida`, level: accel > 100 ? "red" : "yellow" });
        }

        // Internet connectivity (IODA) — 24h persistence
        if (liveData?.ioda) {
          const { avgHealth, worstState, worstHealth } = liveData.ioda;
          if (avgHealth !== undefined && avgHealth < 70) {
            liveAlerts.push({ name:"Internet 🌐", val:`${avgHealth}%`, umbral:`Conectividad nacional promedio ${avgHealth}% — ${worstState || "múltiples estados"} más afectado (${worstHealth || 0}%). Posible corte masivo.`, level:"red" });
          } else if (avgHealth !== undefined && avgHealth < 85) {
            liveAlerts.push({ name:"Internet 🌐", val:`${avgHealth}%`, umbral:`Degradación de conectividad — ${worstState || "varios estados"} con ${worstHealth || 0}%. Monitorear evolución.`, level:"yellow" });
          } else if (worstHealth !== undefined && worstHealth < 50) {
            liveAlerts.push({ name:"Internet 🌐", val:`${worstState} ${worstHealth}%`, umbral:`${worstState} con conectividad crítica (${worstHealth}%) — posible corte regional focalizado.`, level: worstHealth < 30 ? "red" : "yellow" });
          }
          
          // Electrical alerts (IODA) — 7d persistence
          const elec = liveData.ioda.elecAlerts;
          if (elec && elec.length > 0) {
            const totalEvents = liveData.ioda.elecCount || elec.reduce((a,s) => a + s.events, 0);
            const severe = elec.filter(s => s.dropPct > 40);
            const moderate = elec.filter(s => s.dropPct > 20 && s.dropPct <= 40);
            const fmtAgo = (ts) => {
              const h = Math.round((Date.now()/1000 - ts) / 3600);
              return h < 24 ? `hace ${h}h` : `hace ${Math.round(h/24)}d`;
            };
            
            // Summary alert
            if (severe.length > 0) {
              const top = severe.slice(0, 3).map(s => `${s.state} −${s.dropPct}%`).join(", ");
              liveAlerts.push({ name:"Electricidad ⚡", val:`${totalEvents} eventos`, umbral:`Apagones severos (7d): ${top}. BGP estable — patrón consistente con corte eléctrico regional.`, level:"red" });
            } else if (moderate.length > 0) {
              const top = moderate.slice(0, 3).map(s => `${s.state} −${s.dropPct}%`).join(", ");
              liveAlerts.push({ name:"Electricidad ⚡", val:`${totalEvents} eventos`, umbral:`Interrupciones eléctricas detectadas (7d): ${top}. Monitorear evolución.`, level:"yellow" });
            } else {
              const top = elec.slice(0, 3).map(s => `${s.state} (${fmtAgo(s.lastTime)})`).join(", ");
              liveAlerts.push({ name:"Electricidad ⚡", val:`${totalEvents} eventos`, umbral:`Fluctuaciones eléctricas en: ${top}. Impacto leve, seguimiento activo.`, level:"yellow" });
            }
            
            // Individual alerts per state
            elec.forEach(s => {
              if (s.dropPct > 40) {
                liveAlerts.push({ name:`⚡ ${s.state}`, val:`−${s.dropPct}%`, umbral:`Posible interrupción eléctrica severa (${fmtAgo(s.lastTime)}). ${s.events} evento${s.events>1?"s":""}. BGP estable — patrón consistente con corte eléctrico.`, level:"red" });
              } else if (s.dropPct > 20) {
                liveAlerts.push({ name:`⚡ ${s.state}`, val:`−${s.dropPct}%`, umbral:`Interrupción eléctrica (${fmtAgo(s.lastTime)}). ${s.events} evento${s.events>1?"s":""}. Monitorear evolución.`, level:"yellow" });
              } else {
                liveAlerts.push({ name:`⚡ ${s.state}`, val:`−${s.dropPct}%`, umbral:`Fluctuación eléctrica (${fmtAgo(s.lastTime)}). Impacto leve.`, level:"yellow" });
              }
            });
          }
        }

        if (liveAlerts.length === 0) return null;

        const reds = liveAlerts.filter(a => a.level === "red");

        return (
          <div style={{ border:`1px solid ${reds.length > 0 ? "#dc262640" : "#ca8a0440"}`,
            background:reds.length > 0 ? "#dc262608" : "#ca8a0408", padding:mob?"10px 12px":"12px 16px" }}>
            <div onClick={() => setAlertsOpen(p => !p)} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", userSelect:"none", flexWrap:"wrap" }}>
              <span style={{ fontSize:14 }}>{reds.length > 0 ? "🚨" : "⚠️"}</span>
              <span style={{ fontSize:10, fontFamily:font, letterSpacing:"0.12em", textTransform:"uppercase",
                color:reds.length > 0 ? "#dc2626" : "#ca8a04", fontWeight:700 }}>
                {liveAlerts.length} alerta{liveAlerts.length>1?"s":""} en vivo
                {reds.length > 0 && !alertsOpen ? ` · ${reds.length} roja${reds.length>1?"s":""}` : ""}
              </span>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", animation:"pulse 1.5s infinite" }} />
              <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>Datos en tiempo real · cada 5 min</span>
              <span style={{ marginLeft:"auto", fontSize:12, color:MUTED, transition:"transform 0.2s", transform:alertsOpen?"rotate(180deg)":"rotate(0deg)" }}>▼</span>
            </div>
            {alertsOpen && (
              <div style={{ marginTop:8 }}>
                {liveAlerts.map((a, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0",
                    borderTop:i>0?`1px solid ${BORDER}30`:"none", fontSize:12, fontFamily:font }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", flexShrink:0,
                      background:a.level==="red"?"#dc2626":"#ca8a04",
                      boxShadow:a.level==="red"?"0 0 4px #dc262660":"none",
                      animation:a.level==="red"?"pulse 1.5s infinite":"none" }} />
                    <span style={{ color:a.level==="red"?"#dc2626":"#ca8a04", fontWeight:700, minWidth:mob?90:130 }}>{a.name}</span>
                    <span style={{ color:TEXT, fontWeight:600, minWidth:60 }}>{a.val}</span>
                    <span style={{ color:MUTED, fontSize:11, flex:1 }}>{a.umbral}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── ROW 1: Scenario Hero Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:1, background:BORDER, border:`1px solid ${BORDER}` }}>
        {wk.probs.map(p => {
          const sc = SCENARIOS.find(s=>s.id===p.sc);
          const isDom = p.sc === dom.sc;
          const delta = prevWk ? p.v - (prevWk.probs.find(pp=>pp.sc===p.sc)?.v||0) : null;
          return (
            <div key={p.sc} style={{ background:isDom?BG3:BG2, padding:"14px 16px", borderTop:`3px solid ${sc.color}` }}>
              <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
                E{sc.id}
                {isDom && <Badge color={sc.color}>Dominante</Badge>}
              </div>
              <div style={{ fontSize:12, fontWeight:600, color:sc.color, marginBottom:6, lineHeight:1.2 }}>{sc.name}</div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:26, fontWeight:900, color:sc.color, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{p.v}%</span>
                {delta !== null && delta !== 0 && (
                  <span style={{ fontSize:13, fontFamily:font, fontWeight:600, color:delta>0?"#22c55e":"#ef4444", marginBottom:2 }}>
                    {delta>0?"▲":"▼"}{Math.abs(delta)}pp
                  </span>
                )}
              </div>
              <div style={{ height:3, background:BORDER, marginBottom:6 }}>
                <div style={{ height:3, background:sc.color, width:`${p.v}%`, transition:"width 0.5s" }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, fontFamily:font, color:trendColor[p.t] }}>
                  {trendIcon[p.t]} {trendLabel[p.t]}
                </span>
                <Sparkline scId={p.sc} currentWeek={week} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── ROW 1b: Índice de Inestabilidad Compuesto (19 factores) ── */}
      {(() => {
        // ── 19-input Composite Instability Index (0-100) ──
        const e1 = wk.probs.find(p=>p.sc===1)?.v || 0;
        const e2 = wk.probs.find(p=>p.sc===2)?.v || 0;
        const e3 = wk.probs.find(p=>p.sc===3)?.v || 0;
        const e4 = wk.probs.find(p=>p.sc===4)?.v || 0;

        // Indicators
        const latestInds = INDICATORS.map(ind => ind.hist.filter(h=>h!==null).pop()).filter(Boolean);
        const redCount = latestInds.filter(h=>h[0]==="red").length;
        const totalInds = latestInds.length || 1;

        // Tensions
        const tensRed = wk.tensiones.filter(t=>t.l==="red").length;
        const totalTens = wk.tensiones.length || 1;

        // Signals E4+E2 active
        const sigE4E2 = SCENARIO_SIGNALS.filter(g=>g.esc==="E4"||g.esc==="E2").flatMap(g=>g.signals);
        const sigActive = sigE4E2.filter(s=>s.sem==="red"||s.sem==="yellow").length;
        const sigTotal = sigE4E2.length || 1;

        // Live: brecha cambiaria (from liveData, fallback to 50)
        const brechaLive = liveData?.dolar?.brecha ? parseFloat(liveData.dolar.brecha) : 50;

        // Live: Brent pressure (below $65 = pressure, above $75 = stability)
        const brentPrice = liveData?.oil?.brent || 75;
        const brentFactor = brentPrice < 55 ? 100 : brentPrice < 65 ? 70 : brentPrice < 75 ? 30 : brentPrice < 85 ? 10 : 0;

        // Protests: weekly SITREP data (CONF_SEMANAL) — more current than monthly OVCS
        const lastWeekConf = CONF_SEMANAL[CONF_SEMANAL.length - 1];
        const maxWeekProtests = Math.max(...CONF_SEMANAL.map(w => w.protestas), 1);
        const protestPct = lastWeekConf ? (lastWeekConf.protestas / maxWeekProtests) * 100 : 50;
        // Territorial spread: 23/24 estados = almost national = high instability signal
        const spreadPct = lastWeekConf ? (lastWeekConf.estados / 24) * 100 : 30;
        const repressionPct = lastWeekConf?.reprimidas > 0 ? Math.min(lastWeekConf.reprimidas * 25, 100) : 0;
        // Monthly trend: sum last 4 weeks of CONF_SEMANAL, compare to 2025 monthly average
        const last4Weeks = CONF_SEMANAL.slice(-4);
        const monthlyTotal = last4Weeks.reduce((s, w) => s + w.protestas, 0);
        const avg2025Monthly = CONF_MESES.reduce((s, m) => s + m.t, 0) / CONF_MESES.length; // ~185
        const monthlyTrendPct = avg2025Monthly > 0 ? Math.min((monthlyTotal / avg2025Monthly) * 100, 150) : 50; // >100 = escalating vs 2025

        // Amnesty: verification gap + political prisoners
        const amnLatest = AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 1];
        const gobLib = amnLatest?.gob?.libertades || amnLatest?.gob?.excarcelados || 1;
        const fpVerif = amnLatest?.fp?.verificados || 0;
        const amnBrechaPct = Math.max(0, (1 - fpVerif / gobLib) * 100);
        const presosPct = amnLatest?.fp?.detenidos ? Math.min((amnLatest.fp.detenidos / 1000) * 100, 100) : 50;

        // Bilateral Threat Index (PizzINT/GDELT) — LIVE
        const bilV = liveData?.bilateral?.latest?.v || 0;
        const bilPct = Math.min(bilV / 4 * 100, 100); // 0-4σ mapped to 0-100%

        // Government Cohesion Index (ICG) — LIVE (inverted: low cohesion = high instability)
        const icgRaw = liveData?.cohesion?.index ?? null;
        const icgInverted = icgRaw != null ? Math.max(0, 100 - icgRaw) : null; // 100-ICG: 0=full cohesion, 100=no cohesion

        // Social Climate: Polarización & Convivencia from Redes X
        const polAltaPct = parseFloat(REDES_TOTALS.polAltoPct) || 50; // % polarización alta (0-100)
        const convAltaPct = parseFloat(REDES_TOTALS.convAltoPct) || 10; // % convivencia alta (0-100)
        const convInverted = Math.max(0, 100 - (convAltaPct * 5)); // Inverted + amplified: 8% conv alta → 60 risk, 0% → 100 risk

        // ── FORMULA (19 inputs, weights sum to ~100 with stabilizers) ──
        const raw = (redCount/totalInds)*9              // Ind. rojos: 9% (was 10)
          + (e2/100)*7                                    // E2 Colapso: 7% (was 8)
          + (e4/100)*6                                    // E4 Resistencia: 6% (was 7)
          + (Math.min(brechaLive,100)/100)*9             // Brecha cambiaria: 9% (was 10)
          + (tensRed/totalTens)*5                          // Tensiones rojas: 5% (was 6)
          + (sigActive/sigTotal)*5                         // Señales E4+E2: 5% (was 6)
          + (brentFactor/100)*4                            // Brent presión: 4%
          + (bilPct/100)*4                                 // Bilateral Threat: 4% (was 5)
          + ((icgInverted != null ? icgInverted : 50)/100)*4  // Cohesión GOB (inv): 4% (was 5)
          + (protestPct/100)*5                             // Protestas semanal: 5%
          + (spreadPct/100)*4                              // Cobertura territorial: 4%
          + (Math.min(monthlyTrendPct,150)/150)*3          // Tendencia mensual: 3%
          + (repressionPct/100)*3                          // Represión: 3%
          + (amnBrechaPct/100)*3                           // Brecha amnistía: 3% (was 4)
          + (presosPct/100)*3                              // Presos políticos: 3%
          + (polAltaPct/100)*5                             // Polarización alta redes: 5% (NEW)
          + (convInverted/100)*4                           // Convivencia baja redes (inv): 4% (NEW)
          - (e1/100)*6                                     // E1 Transición: -6% (estabilizador)
          - (e3/100)*3;                                    // E3 Continuidad: -3% (estabilizador)
        const index = Math.max(0, Math.min(100, Math.round(raw)));

        // Previous week index for delta (simplified: same formula with prev week probs)
        let prevIndex = null;
        if (prevWk) {
          const pe1=prevWk.probs.find(p=>p.sc===1)?.v||0, pe2=prevWk.probs.find(p=>p.sc===2)?.v||0;
          const pe3=prevWk.probs.find(p=>p.sc===3)?.v||0, pe4=prevWk.probs.find(p=>p.sc===4)?.v||0;
          const pTR=prevWk.tensiones.filter(t=>t.l==="red").length, pTT=prevWk.tensiones.length||1;
          const pRaw = (redCount/totalInds)*9 + (pe2/100)*7 + (pe4/100)*6
            + (Math.min(brechaLive,100)/100)*9 + (pTR/pTT)*5 + (sigActive/sigTotal)*5
            + (brentFactor/100)*4 + (bilPct/100)*4 + ((icgInverted != null ? icgInverted : 50)/100)*4
            + (protestPct/100)*5 + (spreadPct/100)*4 + (Math.min(monthlyTrendPct,150)/150)*3 + (repressionPct/100)*3
            + (amnBrechaPct/100)*3 + (presosPct/100)*3 + (polAltaPct/100)*5 + (convInverted/100)*4
            - (pe1/100)*6 - (pe3/100)*3;
          prevIndex = Math.max(0, Math.min(100, Math.round(pRaw)));
        }
        const deltaLive = prevIndex !== null ? index - prevIndex : null;

        const zone = index <= 25 ? { label:"Estabilidad relativa", color:"#16a34a" }
          : displayIndex <= 50 ? { label:"Tensión moderada", color:"#ca8a04" }
          : displayIndex <= 75 ? { label:"Inestabilidad alta", color:"#f97316" }
          : { label:"Crisis inminente", color:"#dc2626" };

        const segments = [
          { from:0, to:25, color:"#16a34a", label:"Estable" },
          { from:25, to:50, color:"#ca8a04", label:"Tensión" },
          { from:50, to:75, color:"#f97316", label:"Alta" },
          { from:75, to:100, color:"#dc2626", label:"Crisis" },
        ];

        // Historical index for sparkline — use per-week data where available
        const histIdx = WEEKS.map((w, wi) => {
          const we1=w.probs.find(p=>p.sc===1)?.v||0, we2=w.probs.find(p=>p.sc===2)?.v||0;
          const we3=w.probs.find(p=>p.sc===3)?.v||0, we4=w.probs.find(p=>p.sc===4)?.v||0;
          const wtr=w.tensiones.filter(t=>t.l==="red").length, wtt=w.tensiones.length||1;
          // Per-week amnesty brecha
          const wAmn = AMNISTIA_TRACKER[Math.min(wi, AMNISTIA_TRACKER.length-1)];
          const wGobLib = wAmn?.gob?.libertades || wAmn?.gob?.excarcelados || 1;
          const wFpVer = wAmn?.fp?.verificados || 0;
          const wAmnBrecha = (wGobLib > wFpVer && wGobLib > 1) ? Math.max(0, Math.min((1 - wFpVer / wGobLib) * 100, 100)) : 50;
          const wPresos = Math.min(Math.max((wAmn?.fp?.detenidos || 300) / 1500 * 100, 0), 100);
          // Per-week semaforo for indicator proxy
          const wSem = w.sem || { g:0, y:0, r:0 };
          const wRedProxy = wSem.r || 0;
          const wTotalSem = (wSem.g||0) + (wSem.y||0) + (wSem.r||0) || 1;
          // Use current-week live values only for current week, approximate for historical
          const wBrecha = (wi === WEEKS.length - 1) ? brechaLive : Math.max(20, 55 - we1 * 0.5 + we2 * 0.3);
          const wBrent = (wi === WEEKS.length - 1) ? brentFactor : 50;
          const wBil = (wi === WEEKS.length - 1) ? bilPct : Math.min(we2 * 1.5 + we4 * 0.5, 100);
          const wIcg = (wi === WEEKS.length - 1 && icgInverted != null) ? icgInverted : 50;
          // Per-week protest data from CONF_SEMANAL
          const wConf = CONF_SEMANAL[Math.min(wi, CONF_SEMANAL.length - 1)];
          const wProtestPct = wConf ? (wConf.protestas / Math.max(...CONF_SEMANAL.map(c=>c.protestas), 1)) * 100 : 50;
          const wSpreadPct = wConf ? (wConf.estados / 24) * 100 : 30;
          const wReprPct = wConf?.reprimidas > 0 ? Math.min(wConf.reprimidas * 25, 100) : 0;
          // Monthly trend for this week's position — sum 4 weeks ending at wi
          const wMonthSlice = CONF_SEMANAL.slice(Math.max(0, wi - 3), wi + 1);
          const wMonthTotal = wMonthSlice.reduce((s, c) => s + c.protestas, 0);
          const wMonthlyTrend = avg2025Monthly > 0 ? Math.min((wMonthTotal / avg2025Monthly) * 100, 150) : 50;
          const wr = (wRedProxy/wTotalSem)*9 + (we2/100)*7 + (we4/100)*6
            + (Math.min(wBrecha,100)/100)*9 + (wtr/wtt)*5 + (sigActive/sigTotal)*5
            + (wBrent/100)*4 + (wBil/100)*4 + (wIcg/100)*4 + (wProtestPct/100)*5 + (wSpreadPct/100)*4
            + (Math.min(wMonthlyTrend,150)/150)*3 + (wReprPct/100)*3
            + (wAmnBrecha/100)*3 + (wPresos/100)*3 + (polAltaPct/100)*5 + (convInverted/100)*4
            - (we1/100)*6 - (we3/100)*3;
          return Math.max(0, Math.min(100, Math.round(wr)));
        });

        // ── Para semanas de archivo: usar el valor histórico calculado (no el live)
        // ── Para la semana actual: usar el cálculo en vivo
        const isCurrentWeekIdx = week === WEEKS.length - 1;
        const displayIndex = isCurrentWeekIdx ? index : (histIdx[week] ?? index);
        const displayPrev  = isCurrentWeekIdx ? prevIndex : (week > 0 ? histIdx[week - 1] : null);
        const delta = displayPrev !== null ? displayIndex - displayPrev : deltaLive;

        // Breakdown items for display
        const breakdown = [
          { label:"Ind. rojos", value:`${redCount}/${totalInds}`, pct:Math.round(redCount/totalInds*100), w:"9%" },
          { label:"Brecha camb.", value:`${brechaLive.toFixed(0)}%`, pct:Math.min(brechaLive,100), w:"9%", live:true },
          { label:"E2 Colapso", value:`${e2}%`, pct:e2, w:"7%" },
          { label:"E4 Resistencia", value:`${e4}%`, pct:e4, w:"6%" },
          { label:"Tens. rojas", value:`${tensRed}/${totalTens}`, pct:Math.round(tensRed/totalTens*100), w:"5%" },
          { label:"Señales E4/E2", value:`${sigActive}/${sigTotal}`, pct:Math.round(sigActive/sigTotal*100), w:"5%" },
          { label:"Protestas sem.", value:`${lastWeekConf?.protestas||"—"}`, pct:Math.round(protestPct), w:"5%" },
          { label:"Pol. alta redes 🌡️", value:`${polAltaPct.toFixed(0)}%`, pct:Math.round(polAltaPct), w:"5%" },
          { label:"Bilateral 🇺🇸🇻🇪", value:`${bilV.toFixed(1)}σ`, pct:Math.round(bilPct), w:"4%", live:true },
          { label:"Cohesión GOB 🏛", value:icgRaw != null ? `${icgRaw}` : "—", pct:icgInverted != null ? Math.round(icgInverted) : 50, w:"4%", live:true },
          { label:"Conv. baja redes 🌡️", value:`${convAltaPct.toFixed(0)}% alta`, pct:Math.round(convInverted), w:"4%" },
          { label:"Cobertura terr.", value:`${lastWeekConf?.estados||"—"}/24`, pct:Math.round(spreadPct), w:"4%" },
          { label:"Brent", value:`$${brentPrice}`, pct:brentFactor, w:"4%", live:true },
          { label:"Brecha amnist.", value:`${amnBrechaPct.toFixed(0)}%`, pct:Math.round(amnBrechaPct), w:"3%" },
          { label:"Tend. mensual", value:`${monthlyTotal} (4sem)`, pct:Math.round(Math.min(monthlyTrendPct,150)/1.5), w:"3%" },
          { label:"Represión", value:`${lastWeekConf?.reprimidas||0}`, pct:Math.round(repressionPct), w:"3%" },
          { label:"Presos pol.", value:`${amnLatest?.fp?.detenidos||"—"}`, pct:Math.round(presosPct), w:"3%" },
          { label:"E1 Transición", value:`-${e1}%`, pct:0, w:"-6%", isNeg:true },
          { label:"E3 Continuidad", value:`-${e3}%`, pct:0, w:"-3%", isNeg:true },
        ];

        return (
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"auto 1fr", gap:0, border:`1px solid ${BORDER}`, background:BG2 }}>
            {/* Left: Big number */}
            <div style={{ padding:mob?"14px 16px":"18px 24px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              borderRight:mob?"none":`1px solid ${BORDER}`, borderBottom:mob?`1px solid ${BORDER}`:"none", minWidth:mob?"auto":160 }}>
              <div style={{ fontSize:9, fontFamily:font, letterSpacing:"0.15em", textTransform:"uppercase", color:MUTED, marginBottom:4 }}>
                Índice de Inestabilidad
              </div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:6 }}>
                <span style={{ fontSize:mob?40:52, fontWeight:900, fontFamily:"'Playfair Display',serif", color:zone.color, lineHeight:1 }}>
                  {displayIndex}
                </span>
                <span style={{ fontSize:14, fontFamily:font, color:MUTED, marginBottom:mob?4:8 }}>/100</span>
              </div>
              {delta !== null && delta !== 0 && (
                <div style={{ fontSize:12, fontFamily:font, color:delta>0?"#dc2626":"#16a34a", marginTop:2 }}>
                  {delta>0?"▲":"▼"}{Math.abs(delta)}pp vs anterior
                </div>
              )}
              <div style={{ fontSize:11, fontFamily:fontSans, fontWeight:600, color:zone.color, marginTop:4, padding:"2px 10px",
                background:`${zone.color}12`, border:`1px solid ${zone.color}25` }}>
                {zone.label}
              </div>
              {/* AI Explain button */}
              <button onClick={async () => {
                if (aiExplanation) { setAiExplanation(null); return; }
                setAiLoading(true);
                try {
                  const factorsSummary = breakdown.map(b => `${b.label}: ${b.value} (peso ${b.w})`).join(", ");
                  // Gather additional dashboard context for richer analysis
                  const alertsSummary = (() => {
                    try {
                      const el = document.querySelectorAll("[data-alert-name]");
                      return el.length > 0 ? Array.from(el).map(e => e.dataset.alertName).join(", ") : "";
                    } catch { return ""; }
                  })();
                  const tensionsSummary = (typeof TENSIONS !== "undefined" ? TENSIONS : []).slice(0, 6).map(t => `[${t.level}] ${t.text}`).join("; ");
                  const prompt = `Eres analista senior de riesgo político del PNUD Venezuela. Escribe un análisis de dos párrafos cortos en español sobre el Índice de Inestabilidad.

DATOS DEL ÍNDICE:
- Score: ${displayIndex}/100 (zona: ${zone.label})
- ${delta !== null && delta !== 0 ? `Cambio: ${delta > 0 ? "+" : ""}${delta}pp vs semana anterior` : "Sin cambio vs semana anterior"}
- Factores y pesos: ${factorsSummary}

CONTEXTO ADICIONAL DEL DASHBOARD:
- Precio Brent: $${brentPrice} (referencia Venezuela)
- Protestas semanales: ${lastWeekConf?.protestas || "N/D"} en ${lastWeekConf?.estados || "N/D"}/24 estados
- Cobertura territorial de protestas: ${lastWeekConf?.estados || "N/D"}/24 estados (más estados = mayor extensión geográfica del descontento)
- ICG (Cohesión de Gobierno): ${icgRaw || "N/D"}/100
- Tendencia mensual protestas (4 sem): ${monthlyTotal}
- Tensiones clave: ${tensionsSummary}

INSTRUCCIONES:
Párrafo 1: Explica por qué el índice está en ${displayIndex}/100. Identifica los 3-4 factores que más lo impulsan al alza (protestas, cobertura territorial de protestas, brecha cambiaria, señales de colapso, etc.) y los 2-3 factores que lo contienen (probabilidades E1/E3, Brent alto si aplica, amnistía si aplica). IMPORTANTE: la cobertura territorial (${lastWeekConf?.estados || "N/D"}/24 estados) mide la extensión geográfica de las protestas, NO es un factor estabilizador — a mayor cobertura, mayor inestabilidad.

Párrafo 2: Qué vigilar esta semana y qué podría hacer que el índice suba o baje. Menciona riesgos específicos basados en los datos.

No uses markdown, no uses asteriscos, no uses bullet points, no uses negritas. Escribe en prosa analítica fluida.`;
                  const res = await fetch("/api/ai", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt, max_tokens: 500 }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    let text = data.text || data.content || "Sin respuesta";
                    text = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/\*(.*?)\*/g, "<i>$1</i>");
                    setAiExplanation(text);
                  } else {
                    setAiExplanation("Error: no se pudo generar el análisis (" + res.status + ")");
                  }
                } catch (e) { setAiExplanation("Error: " + e.message); }
                setAiLoading(false);
              }}
                style={{ fontSize:10, fontFamily:font, padding:"4px 10px", marginTop:10, border:`1px solid ${ACCENT}30`,
                  background:aiExplanation ? `${ACCENT}10` : "transparent", color:ACCENT, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:5, letterSpacing:"0.04em" }}>
                {aiLoading ? (
                  <><span style={{ width:8, height:8, border:`2px solid ${ACCENT}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite", display:"inline-block" }} /> Analizando</>
                ) : aiExplanation ? "✕ Cerrar" : "🤖 Explicar IA"}
              </button>
            </div>

            {/* Right: Thermometer + breakdown */}
            <div style={{ padding:mob?"12px 14px":"16px 20px" }}>
              {/* Thermometer bar */}
              <div style={{ marginBottom:12 }}>
                <div style={{ display:"flex", height:12, borderRadius:6, overflow:"hidden", background:BG3, position:"relative" }}>
                  {segments.map((seg,i) => (
                    <div key={i} style={{ flex:1, background:seg.color, opacity:0.2 }} />
                  ))}
                  <div style={{ position:"absolute", left:`${displayIndex}%`, top:-2, transform:"translateX(-50%)", width:4, height:16,
                    background:zone.color, borderRadius:2, boxShadow:`0 0 6px ${zone.color}60`, transition:"left 0.5s" }} />
                </div>
                <div style={{ display:"flex", marginTop:3 }}>
                  {segments.map((seg,i) => (
                    <div key={i} style={{ flex:1, fontSize:8, fontFamily:font, color:displayIndex >= seg.from && displayIndex <= seg.to ? seg.color : `${MUTED}60`,
                      fontWeight:displayIndex >= seg.from && displayIndex <= seg.to ? 700 : 400, textAlign:"center" }}>
                      {seg.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Breakdown + sparkline */}
              <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:mob?8:16 }}>
                {/* Breakdown */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px 8px", fontSize:10, fontFamily:font }}>
                  {breakdown.map((item,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", color:item.isNeg?"#16a34a":MUTED, padding:"1px 0" }}>
                      <span style={{ display:"flex", alignItems:"center", gap:3 }}>
                        {item.label}
                        {item.live && <span style={{ width:4, height:4, borderRadius:"50%", background:"#22c55e", animation:"pulse 1.5s infinite" }} />}
                      </span>
                      <span style={{ fontWeight:600, color:item.isNeg?"#16a34a":item.pct>50?"#dc2626":item.pct>25?"#ca8a04":MUTED }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* AI Explanation panel (triggered from left panel button) */}
                {aiExplanation && (
                  <div style={{ margin:"8px 0", padding:"10px 14px", background:`${ACCENT}06`, border:`1px solid ${ACCENT}15`,
                    fontSize:12, fontFamily:fontSans, color:TEXT, lineHeight:1.7 }}>
                    <div style={{ fontSize:9, fontFamily:font, color:ACCENT, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>
                      🤖 Análisis IA · Índice de Inestabilidad
                    </div>
                    <span dangerouslySetInnerHTML={{ __html: aiExplanation }} />
                  </div>
                )}

                {/* Historical chart */}
                <div>
                  <InstabilityChart histIdx={histIdx} index={index} zone={zone} />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── ROW 1c: Conflictividad Bilateral EE.UU.–Venezuela ── */}
      {liveData?.bilateral?.latest && (() => {
        const bil = liveData.bilateral;
        const lat = bil.latest;
        const v = lat.v || 0;
        const level = lat.level || "LOW";
        const sentiment = lat.sentiment || 0;
        const conflictCount = lat.conflict || lat.conflictCount || 0;
        const totalArticles = lat.total || lat.totalArticles || 0;
        const hist = bil.history || [];

        const levelConfig = {
          LOW: { color:"#10b981", label:"BAJO", desc:"Relación bilateral estable" },
          MODERATE: { color:"#22d3ee", label:"MODERADO", desc:"Actividad mediática normal" },
          ELEVATED: { color:"#eab308", label:"ELEVADO", desc:"Tensión bilateral en aumento" },
          HIGH: { color:"#f97316", label:"ALTO", desc:"Tensión bilateral significativa" },
          CRITICAL: { color:"#ef4444", label:"CRÍTICO", desc:"Crisis bilateral activa" },
        };
        const cfg = levelConfig[level] || levelConfig.MODERATE;

        const chartData = hist.filter(d => !d.interp && d.v != null).slice(-90);
        const maxV = Math.max(...chartData.map(d=>d.v), 2.5);
        const minV = Math.min(...chartData.map(d=>d.v), 0);
        const W = 600, H = 85, PL = 25, PR = 10, PT = 4, PB = 14;
        const cW = W - PL - PR, cH = H - PT - PB;
        const toX = (i) => PL + (i / (chartData.length - 1)) * cW;
        const toY = (val) => PT + cH - ((val - minV) / (maxV - minV)) * cH;

        return (
          <div style={{ border:`1px solid ${BORDER}`, background:BG2 }}>
            {/* Header + KPIs combined row */}
            <div style={{ display:"flex", alignItems:"center", gap:0, borderBottom:`1px solid ${BORDER}40` }}>
              {/* Title */}
              <div style={{ display:"flex", alignItems:"center", gap:5, padding:mob?"6px 8px":"8px 12px", borderRight:`1px solid ${BORDER}40`, minWidth:mob?"auto":180 }}>
                <span style={{ fontSize:14 }}>🇺🇸</span>
                <span style={{ fontSize:9, color:MUTED }}>→</span>
                <span style={{ fontSize:14 }}>🇻🇪</span>
                <div>
                  <div style={{ fontSize:10, fontFamily:font, fontWeight:700, color:TEXT, letterSpacing:"0.03em" }}>Conflictividad Bilateral</div>
                  <div style={{ fontSize:7, fontFamily:font, color:MUTED }}>PizzINT/GDELT · {chartData.length}d</div>
                </div>
              </div>
              {/* 4 KPIs inline */}
              {[
                { label:"Índice", value:v.toFixed(2), unit:"σ", color:cfg.color },
                { label:"Sentimiento", value:sentiment.toFixed(1), unit:"", color:sentiment<-4?"#dc2626":sentiment<-2?"#ca8a04":"#16a34a" },
                { label:"Conflicto", value:conflictCount.toString(), unit:"", color:conflictCount>100?"#dc2626":conflictCount>50?"#ca8a04":TEXT },
                { label:"Artículos", value:totalArticles.toString(), unit:"", color:TEXT },
              ].map((kpi, i) => (
                <div key={i} style={{ flex:1, padding:mob?"5px 4px":"6px 8px", textAlign:"center", borderRight:i<3?`1px solid ${BORDER}40`:"none" }}>
                  <div style={{ fontSize:7, fontFamily:font, letterSpacing:"0.08em", textTransform:"uppercase", color:MUTED }}>{kpi.label}</div>
                  <div style={{ fontSize:mob?14:16, fontWeight:800, fontFamily:"'Playfair Display',serif", color:kpi.color, lineHeight:1, marginTop:1 }}>
                    {kpi.value}<span style={{ fontSize:8, fontWeight:400 }}>{kpi.unit}</span>
                  </div>
                </div>
              ))}
              {/* Level badge */}
              <div style={{ padding:mob?"5px 6px":"6px 10px", textAlign:"center" }}>
                <div style={{ fontSize:7, fontFamily:font, color:MUTED, letterSpacing:"0.08em" }}>NIVEL</div>
                <div style={{ fontSize:11, fontFamily:fontSans, fontWeight:700, color:cfg.color, marginTop:1 }}>{cfg.label}</div>
              </div>
            </div>

            {/* Compact chart */}
            <div style={{ padding:mob?"4px 4px":"6px 8px" }}>
              <BilateralChart chartData={chartData} cfg={cfg} maxV={maxV} minV={minV} W={W} H={H} PL={PL} PR={PR} PT={PT} PB={PB} cW={cW} cH={cH} toX={toX} toY={toY} mob={mob} />
              {/* Level bar */}
              <div style={{ marginTop:4 }}>
                <div style={{ display:"flex", height:4, borderRadius:2, overflow:"hidden", background:BG3, position:"relative" }}>
                  {Object.entries(levelConfig).map(([k,c]) => (
                    <div key={k} style={{ flex:1, background:c.color, opacity:0.2 }} />
                  ))}
                  <div style={{ position:"absolute", left:`${Math.min(v/4*100, 100)}%`, top:-1, transform:"translateX(-50%)",
                    width:3, height:6, background:cfg.color, borderRadius:1, boxShadow:`0 0 4px ${cfg.color}60`, transition:"left 0.5s" }} />
                </div>
                <div style={{ display:"flex", marginTop:1 }}>
                  {Object.entries(levelConfig).map(([k,c]) => (
                    <div key={k} style={{ flex:1, fontSize:6, fontFamily:font, textAlign:"center",
                      color:k===level?c.color:`${MUTED}40`, fontWeight:k===level?700:400 }}>
                      {c.label}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize:7, fontFamily:font, color:`${MUTED}50`, marginTop:3, display:"flex", justifyContent:"space-between" }}>
                <span>~{v.toFixed(1)}σ sobre baseline 2017–hoy (μ=0.14 · σ=1.15)</span>
                <span>PizzINT / GDELT</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── ROW 1d: Cohesión de Gobierno (mini) ── */}
      <CohesionMiniWidget liveData={liveData} />

      {/* ── ROW 1e: Clima Social Redes — Dos lentes, un discurso (expandible) ── */}
      <RedesMiniWidget setTab={setTab} />

      {/* ── ROW 2: Amnistía Tracker ── */}
      {(() => {
        // Mapear semana seleccionada al índice de AMNISTIA_TRACKER por short label
        const wkShort = wk?.short || `S${week + 1}`;
        const amnIdx = AMNISTIA_TRACKER.findIndex(t => t.week === wkShort);
        const latest = amnIdx >= 0 ? AMNISTIA_TRACKER[amnIdx] : AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 1];
        const prev = amnIdx > 0 ? AMNISTIA_TRACKER[amnIdx - 1] : null;
        const isCurrentWeek = week === WEEKS.length - 1;

        // Libertades: usar acumulado oficial (libertades plenas)
        const trkGobLib = latest.gob.libertades || 0;
        const trkFpVerif = latest.fp.verificados || 0;
        const trkFpPresos = latest.fp.detenidos || 0;

        // Brecha solo cuando trkGobLib > trkFpVerif (gobierno reporta más que FP verifica)
        const trkBrechaValida = trkGobLib > 0 && trkFpVerif > 0 && trkGobLib > trkFpVerif;
        const trkBrecha = trkBrechaValida ? Math.round((1 - trkFpVerif / trkGobLib) * 100) : null;

        // Detectar si los datos son carry-forward (sin nuevos datos oficiales)
        const sinDatosNuevos = latest.gob.solicitudes !== null && prev &&
          latest.gob.libertades === prev?.gob?.libertades &&
          latest.gob.solicitudes === prev?.gob?.solicitudes;

        // Delta de excarcelaciones nuevas esta semana
        const excNuevos = latest.gob.excarcelados || null;
        const trkFpDelta = (prev?.fp?.verificados && trkFpVerif !== prev.fp.verificados) ? trkFpVerif - prev.fp.verificados : null;
        return (
          <Card>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:10, fontFamily:font, color:ACCENT, letterSpacing:"0.15em", textTransform:"uppercase" }}>
                📋 Ley de Amnistía · Tracker Dual
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                {!isCurrentWeek && (
                  <span style={{ fontSize:8, fontFamily:font, color:MUTED, background:`${MUTED}15`, border:`1px solid ${BORDER}`, borderRadius:3, padding:"1px 5px", letterSpacing:"0.06em" }}>
                    ARCHIVO
                  </span>
                )}
                <div style={{ fontSize:9, fontFamily:font, color:MUTED }}>
                  {latest.label || wkShort}
                </div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr 1fr", gap:mob?6:8, marginBottom:12 }}>
              {[
                { v:latest.gob.solicitudes?.toLocaleString() || "—", l:"Solicitudes acum.", sub:"Gobierno", c:ACCENT },
                { v:trkGobLib ? trkGobLib.toLocaleString() : "—", l:"Libertades plenas acum.", sub:"Gobierno", c:"#16a34a", extra: excNuevos ? `+${excNuevos} sem.` : null },
                { v:trkFpVerif ? trkFpVerif.toLocaleString() : "—", l:"Excarcelaciones verif.", sub:"Foro Penal", c:"#ca8a04", extra: trkFpDelta ? `+${trkFpDelta}` : null },
                { v:latest.fp.detenidos?.toLocaleString() || "—", l:"Presos políticos", sub:"Foro Penal", c:"#dc2626" },
              ].map((item, i) => (
                <div key={i} style={{ background:BG3, padding:mob?8:12, textAlign:"center" }}>
                  <div style={{ fontFamily:fontSans, fontSize:mob?18:24, fontWeight:700, color:item.c }}>
                    {item.v}
                  </div>
                  {item.extra && (
                    <div style={{ fontSize:10, color:"#16a34a", fontFamily:font, marginTop:1 }}>{item.extra}</div>
                  )}
                  <div style={{ fontFamily:font, fontSize:mob?7:8, letterSpacing:"0.08em", color:MUTED, textTransform:"uppercase", marginTop:2 }}>{item.l}</div>
                  <div style={{ fontFamily:font, fontSize:mob?7:8, color:item.c, opacity:0.7 }}>{item.sub}</div>
                </div>
              ))}
            </div>

            {/* Nota carry-forward */}
            {sinDatosNuevos && (
              <div style={{ marginBottom:8, padding:"5px 10px", background:`${MUTED}08`, border:`1px solid ${BORDER}`, borderRadius:4, fontSize:10, fontFamily:font, color:MUTED }}>
                📋 Sin nuevos datos oficiales esta semana — cifras acumuladas del último reporte disponible
              </div>
            )}

            {trkBrecha !== null && (
              <div style={{ marginBottom:12, padding:mob?"8px 10px":"10px 14px", background:`#dc262608`, border:`1px solid #dc262620` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:11, fontFamily:font, color:"#dc2626", letterSpacing:"0.1em", textTransform:"uppercase" }}>Brecha verificación</span>
                  <span style={{ fontSize:16, fontFamily:fontSans, fontWeight:700, color:"#dc2626" }}>{trkBrecha}%</span>
                </div>
                <div style={{ height:6, background:BORDER, borderRadius:3 }}>
                  <div style={{ height:6, borderRadius:3, background:`linear-gradient(90deg, #16a34a ${100-trkBrecha}%, #dc2626 ${100-trkBrecha}%)`, width:"100%" }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                  <span style={{ fontSize:9, fontFamily:font, color:"#16a34a" }}>Foro Penal: {trkFpVerif.toLocaleString()}</span>
                  <span style={{ fontSize:9, fontFamily:font, color:ACCENT }}>Gobierno: {trkGobLib.toLocaleString()}</span>
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:50, marginBottom:8 }}>
              {AMNISTIA_TRACKER.map((w, i) => {
                const gVal = w.gob.libertades || w.gob.excarcelados || 0;
                const fVal = w.fp.verificados || 0;
                const maxVal = Math.max(...AMNISTIA_TRACKER.map(t => Math.max(t.gob.libertades||t.gob.excarcelados||0, 1)));
                const gH = Math.max(2, (gVal / maxVal) * 45);
                const fH = Math.max(2, (fVal / maxVal) * 45);
                const isLast = i === AMNISTIA_TRACKER.length - 1;
                return (
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
                    <div style={{ display:"flex", gap:1, alignItems:"flex-end", width:"100%" }}>
                      <div style={{ flex:1, height:gH, background:ACCENT, opacity:isLast?1:0.4, borderRadius:"2px 0 0 0", transition:"height 0.3s" }} />
                      <div style={{ flex:1, height:fH, background:"#ca8a04", opacity:isLast?1:0.4, borderRadius:"0 2px 0 0", transition:"height 0.3s" }} />
                    </div>
                    <span style={{ fontSize:7, fontFamily:font, color:isLast?ACCENT:MUTED }}>{w.week}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:8, height:8, background:ACCENT, borderRadius:1 }} />
                <span style={{ fontSize:10, color:MUTED }}>Gobierno</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:8, height:8, background:"#ca8a04", borderRadius:1 }} />
                <span style={{ fontSize:10, color:MUTED }}>Foro Penal</span>
              </div>
              {latest.gob.militares && (
                <span style={{ fontSize:10, fontFamily:font, color:MUTED, marginLeft:"auto" }}>
                  {latest.gob.militares} militares · {latest.gob.cautelares?.toLocaleString() || "—"} cautelares
                </span>
              )}
            </div>
            <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${BORDER}40`, fontSize:11, color:MUTED, fontStyle:"italic", lineHeight:1.4 }}>
              {latest.hito}
            </div>
          </Card>
        );
      })()}

      {/* ── ROW 3: KPIs + Semáforo ── */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 220px", gap:12 }}>

        {/* KPIs por dimensión — de la semana activa */}
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:1, background:BORDER, border:`1px solid ${BORDER}` }}>
          {[
            {title:"Energético",icon:"⚡",rows:[
              {k:"Exportaciones",v:wk.kpis.energia.exportaciones},
              {k:"Ingresos",v:wk.kpis.energia.ingresos},
              {k:"Licencias OFAC",v:wk.kpis.energia.licencias},
              {k:"Tipo de cambio",v:wk.kpis.energia.cambio},
            ]},
            {title:"Económico",icon:"📊",rows:[
              {k:"Inflación proy.",v:wk.kpis.economico.inflacion},
              {k:"Ingresos pob.",v:wk.kpis.economico.ingresos_pob},
              {k:"Electricidad",v:wk.kpis.economico.electricidad},
              {k:"PIB 2026",v:wk.kpis.economico.pib},
            ]},
            {title:"Opinión",icon:"🗳",rows:[
              {k:"Dirección país",v:wk.kpis.opinion.direccion},
              {k:"Dem. electoral",v:wk.kpis.opinion.elecciones},
              {k:"MCM / liderazgo",v:wk.kpis.opinion.mcm},
              {k:"Respaldo EE.UU.",v:wk.kpis.opinion.eeuu},
            ]},
          ].map((sec,i) => (
            <div key={i} style={{ background:BG2, padding:"14px 16px" }}>
              <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
                {sec.icon} {sec.title}
              </div>
              {sec.rows.map((r,j) => (
                <div key={j} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6, gap:8 }}>
                  <span style={{ fontSize:12, color:"#5a8aaa", flexShrink:0, paddingTop:1 }}>{r.k}</span>
                  <span title={r.v} style={{ fontSize:12, fontFamily:font, fontWeight:500, color:r.v==="—"?`${MUTED}60`:TEXT, textAlign:"right", lineHeight:1.4, wordBreak:"break-word" }}>{r.v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Semáforo resumen */}
        <Card>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
            🚦 Señales activas
          </div>
          {[{label:"Verde",count:wk.sem.g,color:"green"},
            {label:"Amarillo",count:wk.sem.y,color:"yellow"},
            {label:"Rojo",count:wk.sem.r,color:"red"}
          ].map((s,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:18, fontWeight:700, fontFamily:font, color:SEM[s.color], width:24, textAlign:"right" }}>{s.count}</span>
              <span style={{ fontSize:11, color:SEM[s.color], width:52, letterSpacing:"0.06em", textTransform:"uppercase" }}>{s.label}</span>
              <div style={{ flex:1, height:5, background:BORDER, borderRadius:2 }}>
                <div style={{ height:5, background:SEM[s.color], width:`${(s.count/semTotal)*100}%`, borderRadius:2, transition:"width 0.4s" }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${BORDER}`, textAlign:"center" }}>
            <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Dominante</div>
            <div style={{ fontSize:16, fontWeight:800, color:domSc.color, fontFamily:"'Syne',sans-serif" }}>E{domSc.id} · {dom.v}%</div>
            <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>{domSc.short}</div>
          </div>
        </Card>
      </div>

      {/* ── ROW 3: Lectura rápida ── */}
      {wk.lectura && (
        <div style={{ background:`linear-gradient(135deg, ${domSc.color}12, transparent)`, border:`1px solid ${domSc.color}25`, padding:"14px 18px" }}>
          <div style={{ fontSize:10, fontFamily:font, color:domSc.color, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:6 }}>
            Lectura de la semana · {wk.label}
          </div>
          <div style={{ fontSize:14, color:"#3d4f5f", lineHeight:1.7, fontStyle:"italic" }}>
            {wk.lectura}
          </div>
        </div>
      )}

      {/* ── ROW 4: Tensiones activas ── */}
      <Card>
        <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:10, paddingBottom:5, borderBottom:`1px solid ${BORDER}` }}>
          ⚠ Tensiones activas · {wk.label}
        </div>
        {wk.tensiones.map((t,i) => (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:7, paddingBottom:7, borderBottom:i<wk.tensiones.length-1?`1px solid ${BORDER}40`:"none" }}>
            <SemDot color={t.l} />
            <span style={{ fontSize:13, color:"#3d4f5f", lineHeight:1.6 }} dangerouslySetInnerHTML={{ __html:t.t }} />
          </div>
        ))}
      </Card>

      {/* ── ROW 5: Alertas Inteligentes de Noticias ── */}
      <NewsAlerts liveData={liveData} mob={mob} />

    </div>
  );
}
