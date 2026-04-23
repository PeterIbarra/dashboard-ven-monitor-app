import { useState, useEffect } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Card } from "../Card";
import { RateChart } from "../charts/RateChart";
import { BrechaChart } from "../charts/BrechaChart";
import { SocioeconomicPanel } from "../SocioeconomicPanel";
import { TradingViewMini } from "../charts/TradingViewMini";
import { BG2, BORDER, TEXT, MUTED, ACCENT, font } from "../../constants";
import { IS_DEPLOYED } from "../../utils";
import { MACRO_SERIES, MACRO_SERIES_META, MACRO_GROUPS } from "../../data/macroSeries.js";
import { HistoricoPanel } from "../HistoricoPanel.jsx";

export function TabMacro() {
  const mob = useIsMobile();
  const [dolar, setDolar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seccion, setSeccion] = useState("cambio");
  const [rateHistory, setRateHistory] = useState([]);

  useEffect(() => {
    async function fetchAll() {
      // Base historical data (monthly, from official BCV + Dólar Promedio table)
      const HIST_BASE = [
        // 2022
        {d:"2022-01-31",bcv:4.52,par:4.65},{d:"2022-02-28",bcv:4.46,par:4.61},{d:"2022-03-31",bcv:4.38,par:4.48},
        {d:"2022-04-30",bcv:4.49,par:4.57},{d:"2022-05-31",bcv:5.06,par:5.14},{d:"2022-06-30",bcv:5.53,par:5.78},
        {d:"2022-07-31",bcv:5.78,par:5.97},{d:"2022-08-31",bcv:7.89,par:8.15},{d:"2022-09-30",bcv:8.20,par:8.32},
        {d:"2022-10-31",bcv:8.59,par:9.03},{d:"2022-11-30",bcv:11.07,par:13.25},{d:"2022-12-31",bcv:17.48,par:18.60},
        // 2023
        {d:"2023-01-31",bcv:22.37,par:23.11},{d:"2023-02-28",bcv:24.36,par:24.75},{d:"2023-03-31",bcv:24.52,par:24.72},
        {d:"2023-04-30",bcv:24.75,par:25.63},{d:"2023-05-31",bcv:26.26,par:27.67},{d:"2023-06-30",bcv:28.01,par:29.04},
        {d:"2023-07-31",bcv:29.50,par:31.58},{d:"2023-08-31",bcv:32.59,par:34.17},{d:"2023-09-30",bcv:34.46,par:36.39},
        {d:"2023-10-31",bcv:35.58,par:36.92},{d:"2023-11-30",bcv:35.95,par:37.07},{d:"2023-12-31",bcv:35.95,par:39.57},
        // 2024
        {d:"2024-01-31",bcv:36.26,par:38.39},{d:"2024-02-29",bcv:36.15,par:38.33},{d:"2024-03-31",bcv:36.26,par:38.47},
        {d:"2024-04-30",bcv:36.47,par:39.40},{d:"2024-05-31",bcv:36.53,par:40.36},{d:"2024-06-30",bcv:36.44,par:40.23},
        {d:"2024-07-31",bcv:36.60,par:42.24},{d:"2024-08-31",bcv:36.62,par:42.50},{d:"2024-09-30",bcv:36.92,par:43.09},
        {d:"2024-10-31",bcv:42.56,par:52.43},{d:"2024-11-30",bcv:47.60,par:56.20},{d:"2024-12-31",bcv:51.93,par:66.25},
        // 2025
        {d:"2025-01-31",bcv:57.96,par:68.43},{d:"2025-02-28",bcv:64.48,par:79.35},{d:"2025-03-31",bcv:69.56,par:99.00},
        {d:"2025-04-30",bcv:87.56,par:108.90},{d:"2025-05-31",bcv:96.85,par:135.25},{d:"2025-06-30",bcv:107.62,par:140.23},
        {d:"2025-07-31",bcv:124.51,par:164.83},{d:"2025-08-31",bcv:147.08,par:207.33},{d:"2025-09-30",bcv:177.61,par:288.50},
        {d:"2025-10-31",bcv:223.64,par:308.10},{d:"2025-11-30",bcv:245.67,par:382.50},{d:"2025-12-31",bcv:301.37,par:587.00},
        // 2026 key points
        {d:"2026-01-06",bcv:382.6,par:896.6},{d:"2026-01-15",bcv:385.0,par:750.0},{d:"2026-01-27",bcv:388.0,par:650.0},
        {d:"2026-02-06",bcv:382.6,par:552.0},
      ];

      // 1. Get live rate
      let liveBcv = null, livePar = null;
      try {
        const liveUrl = IS_DEPLOYED ? "/api/dolar?type=live" : "https://ve.dolarapi.com/v1/dolares";
        const res = await fetch(liveUrl, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const data = await res.json();
          const oficial = data.find(d => d.fuente === "oficial");
          const paralelo = data.find(d => d.fuente === "paralelo");
          liveBcv = oficial?.promedio || null;
          livePar = paralelo?.promedio || null;
          const brecha = liveBcv && livePar ? (((livePar - liveBcv) / liveBcv) * 100) : null;
          setDolar({ bcv: liveBcv, par: livePar, brecha, updated: oficial?.fechaActualizacion || new Date().toISOString() });
        }
      } catch {}
      setLoading(false);

      // 2. Collect daily data from Supabase and/or DolarAPI
      let dailyData = [];

      // Try Supabase (accumulated daily history)
      if (IS_DEPLOYED) {
        try {
          const res = await fetch("/api/dolar?type=supabase&limit=365", { signal: AbortSignal.timeout(6000) });
          if (res.ok) {
            const data = await res.json();
            if (data.rates?.length > 0) {
              dailyData = data.rates.map(r => ({ d:r.date, bcv:Number(r.bcv), par:Number(r.paralelo) }));
            }
          }
        } catch {}
      }

      // Also try DolarAPI historical (adds recent ~30 days)
      try {
        const histUrl = IS_DEPLOYED ? "/api/dolar?type=historico" : "https://ve.dolarapi.com/v1/historicos/dolares";
        const res = await fetch(histUrl, { signal: AbortSignal.timeout(12000) });
        if (res.ok) {
          const data = await res.json();
          const apiRates = data.rates || [];
          if (apiRates.length > 0) {
            apiRates.forEach(r => {
              if (!dailyData.find(d => d.d === r.d)) {
                dailyData.push({ d: r.d, bcv: r.bcv, par: r.par });
              }
            });
          } else if (Array.isArray(data)) {
            const byDate = {};
            let lastPar = null;
            data.forEach(r => {
              if (!byDate[r.fecha]) byDate[r.fecha] = { d: r.fecha };
              if (r.fuente === "oficial") byDate[r.fecha].bcv = r.promedio;
              if (r.fuente === "paralelo") byDate[r.fecha].par = r.promedio;
            });
            Object.values(byDate).filter(h => h.bcv || h.par).forEach(h => {
              if (h.par) lastPar = h.par;
              const entry = { d: h.d, bcv: h.bcv||null, par: h.par||lastPar };
              if (!dailyData.find(d => d.d === entry.d)) dailyData.push(entry);
            });
          }
        }
      } catch {}

      // 3. Add today's live point
      if (liveBcv && livePar) {
        const today = new Date().toISOString().slice(0,10);
        dailyData = dailyData.filter(d => d.d !== today);
        dailyData.push({ d: today, bcv: liveBcv, par: livePar });
      }

      // 4. Merge: base historical + daily data (daily overrides base if same date)
      const merged = {};
      HIST_BASE.forEach(h => { merged[h.d] = h; });
      dailyData.forEach(h => { if (h.bcv && h.par) merged[h.d] = h; });

      const final = Object.values(merged).sort((a,b) => a.d.localeCompare(b.d));
      setRateHistory(final);
    }

    fetchAll();
    // Auto-refresh live rates every 5 minutes — pause when tab not visible
    const refreshRates = () => {
      const liveUrl = IS_DEPLOYED ? "/api/dolar?type=live" : "https://ve.dolarapi.com/v1/dolares";
      fetch(liveUrl, { signal: AbortSignal.timeout(8000) })
        .then(r => r.ok ? r.json() : null).then(data => {
          if (!data || !Array.isArray(data)) return;
          const o = data.find(d => d.fuente === "oficial"), p = data.find(d => d.fuente === "paralelo");
          const bcv = o?.promedio, par = p?.promedio;
          if (bcv && par) {
            setDolar({ bcv, par, brecha: ((par-bcv)/bcv)*100, updated: new Date().toISOString() });
            const today = new Date().toISOString().slice(0,10);
            setRateHistory(prev => {
              const filtered = prev.filter(h => h.d !== today);
              return [...filtered, { d:today, bcv, par, usdt:par*1.02, brecha:((par-bcv)/bcv)*100 }].sort((a,b) => a.d.localeCompare(b.d));
            });
          }
        }).catch(() => {});
    };
    let iv2 = setInterval(refreshRates, 300000);
    const onVis2 = () => {
      clearInterval(iv2);
      if (document.visibilityState === "visible") iv2 = setInterval(refreshRates, 300000);
    };
    document.addEventListener("visibilitychange", onVis2);
    return () => { clearInterval(iv2); document.removeEventListener("visibilitychange", onVis2); };
  }, []);

  // Static macro indicators (update weekly/monthly)
  const MACRO = [
    { k:"PIB proyectado 2025", v:"10–15%", c:"#22c55e", s:"FMI / Ecoanalítica · crecimiento estimado" },
    { k:"Inflación mensual (mar 2026)", v:"13.1%", c:"#E5243B", s:"BCV · var. mensual avance · INPC" },
    { k:"Reservas internacionales", v:"$13,239M", c:"#f59e0b", s:"BCV mar 2026 · incluye oro monetario" },
    { k:"Deuda externa", v:">$150B", c:"#E5243B", s:"FMI: >180% del PIB · en default" },
    { k:"Ingreso mínimo integral", v:"~$38.85", c:"#E5243B", s:"Mar 2026 · sector privado · BCV/IGTF" },
    { k:"Canasta básica (CENDAS)", v:"$503.73", c:"#f59e0b", s:"Abr 2025 · última publicación disponible" },
    { k:"Producción petrolera (OPEP)", v:"903 kbd", c:"#22c55e", s:"Feb 2026 · fuentes sec. OPEP" },
    { k:"Producción petrolera (PDVSA)", v:"1,021 kbd", c:"#22c55e", s:"Feb 2026 · cifras oficiales PDVSA" },
    { k:"Precio Merey (cesta VEN)", v:"$73.33/bl", c:"#f59e0b", s:"Mar 2026 · OPEP" },
    { k:"Crédito bancario", v:"$3,234M", c:"#22c55e", s:"Mar 2026 · SUDEBAN · cartera bruta total" },
    { k:"Recaudación SENIAT", v:"$1,606M", c:"#22c55e", s:"Mar 2026 · ingresos no petroleros" },
    { k:"Liquidez M2", v:"$2,430M", c:"#f59e0b", s:"Mar 2026 · BCV · agregados monetarios" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>💵</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:TEXT, fontFamily:"'Syne',sans-serif", letterSpacing:"0.05em", textTransform:"uppercase" }}>Macroeconomía — Venezuela</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED }}>Tipo de cambio en vivo · Actualiza cada 5 min · Mercado cambiario</div>
        </div>
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}`, flexWrap:"wrap" }}>
          {[{id:"cambio",label:"Tipo de cambio"},{id:"indicadores",label:"Indicadores"},{id:"charts",label:"Gráficos"},{id:"historico",label:"Series históricas"},{id:"socioeco",label:"Socioeconómico"}].map(s => (
            <button key={s.id} onClick={() => setSeccion(s.id)}
              style={{ fontSize:12, fontFamily:font, padding:"6px 12px", border:"none",
                background:seccion===s.id?ACCENT:"transparent", color:seccion===s.id?"#fff":MUTED, cursor:"pointer", letterSpacing:"0.06em" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TIPO DE CAMBIO ── */}
      {seccion === "cambio" && (<>
        {/* Live rates */}
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr 1fr", gap:10, marginBottom:16 }}>
          <Card accent="#0468B1">
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Dólar BCV (oficial)</div>
            <div style={{ fontSize:26, fontWeight:800, color:"#0468B1", fontFamily:"'Playfair Display',serif" }}>
              {loading ? "..." : dolar?.bcv ? `${dolar.bcv.toFixed(2)}` : "—"}
            </div>
            <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>Bs/USD · Fuente: BCV</div>
          </Card>
          <Card accent="#E5243B">
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Dólar Paralelo</div>
            <div style={{ fontSize:26, fontWeight:800, color:"#E5243B", fontFamily:"'Playfair Display',serif" }}>
              {loading ? "..." : dolar?.par ? `${dolar.par.toFixed(2)}` : "—"}
            </div>
            <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>Bs/USD · Mercado no oficial</div>
          </Card>
          <Card accent={dolar?.brecha > 50 ? "#E5243B" : dolar?.brecha > 30 ? "#f59e0b" : "#22c55e"}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Brecha cambiaria</div>
            <div style={{ fontSize:26, fontWeight:800, color:dolar?.brecha > 50 ? "#E5243B" : dolar?.brecha > 30 ? "#f59e0b" : "#22c55e", fontFamily:"'Playfair Display',serif" }}>
              {loading ? "..." : dolar?.brecha ? `${dolar.brecha.toFixed(1)}%` : "—"}
            </div>
            <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>{dolar?.brecha > 55 ? "⚠ Zona de alerta E2" : dolar?.brecha > 40 ? "Monitoreo activo" : "Rango aceptable"}</div>
          </Card>
          <Card accent="#7c3aed">
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>USDT/VES (ref.)</div>
            <div style={{ fontSize:26, fontWeight:800, color:"#7c3aed", fontFamily:"'Playfair Display',serif" }}>
              {loading ? "..." : dolar?.par ? `~${(dolar.par * 1.02).toFixed(0)}` : "—"}
            </div>
            <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>Estimado · Binance P2P +2%</div>
          </Card>
        </div>

        {/* Rate evolution chart */}
        {rateHistory.length > 2 && (
          <Card>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
              Evolución cambiaria · {rateHistory.length > 0 ? `${rateHistory[0].d.slice(0,7)} — ${rateHistory[rateHistory.length-1].d.slice(0,7)}` : "..."} · {rateHistory.length} puntos
            </div>
            <RateChart data={rateHistory} />
          </Card>
        )}

        {/* Explanation cards */}
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
          <Card accent="#0468B1">
            <div style={{ fontSize:13, fontWeight:600, color:"#0468B1", marginBottom:4 }}>🏦 Tasa BCV</div>
            <div style={{ fontSize:12, color:MUTED, lineHeight:1.6 }}>Publicada diariamente por el Banco Central. Referencia para operaciones formales, banca y comercio registrado.</div>
          </Card>
          <Card accent="#E5243B">
            <div style={{ fontSize:13, fontWeight:600, color:"#E5243B", marginBottom:4 }}>🔄 Tasa Paralela</div>
            <div style={{ fontSize:12, color:MUTED, lineHeight:1.6 }}>Precio del dólar en el mercado no oficial. Referencia real para la mayoría de transacciones cotidianas.</div>
          </Card>
          <Card accent="#7c3aed">
            <div style={{ fontSize:13, fontWeight:600, color:"#7c3aed", marginBottom:4 }}>₿ USDT / Binance P2P</div>
            <div style={{ fontSize:12, color:MUTED, lineHeight:1.6 }}>Precio del USDT en bolívares via Binance P2P. Usado masivamente para remesas y ahorro digital.</div>
          </Card>
        </div>

        {/* Semáforo escenarios */}
        <Card>
          <div style={{ fontSize:14, fontFamily:font, color:TEXT, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
            Implicaciones por escenario
          </div>
          {[
            { esc:"E1", label:"Transición", cond:"Brecha <20%", desc:"Convergencia cambiaria. Señal de estabilización y confianza.", color:"#1a7a1a" },
            { esc:"E3", label:"Continuidad", cond:"Brecha 20-40%", desc:"Brecha manejable. Subastas BCV sostienen la tasa. Equilibrio frágil.", color:"#0468B1" },
            { esc:"E4", label:"Resistencia", cond:"Brecha 40-55%", desc:"Presión cambiaria creciente. Riesgo de espiral si supera 55%.", color:"#b45309" },
            { esc:"E2", label:"Colapso", cond:"Brecha >55%", desc:"Zona de alerta. Pérdida de control cambiario. Activa indicador E2.", color:"#c92a2a" },
          ].map((e,i) => {
            const isActive = dolar?.brecha && (
              (e.esc==="E1" && dolar.brecha < 20) || (e.esc==="E3" && dolar.brecha >= 20 && dolar.brecha < 40) ||
              (e.esc==="E4" && dolar.brecha >= 40 && dolar.brecha < 55) || (e.esc==="E2" && dolar.brecha >= 55)
            );
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 8px", borderBottom:i<3?`1px solid ${BORDER}`:"none",
                opacity:isActive?1:0.5, background:isActive?`${e.color}10`:"transparent" }}>
                <span style={{ fontSize:11, fontFamily:font, padding:"3px 8px", fontWeight:700, color:"#fff", background:e.color, minWidth:28, textAlign:"center", borderRadius:3 }}>{e.esc}</span>
                <span style={{ fontSize:14, fontWeight:700, color:e.color, minWidth:110 }}>{e.label}</span>
                <span style={{ fontSize:13, fontFamily:font, color:e.color, fontWeight:600, minWidth:110 }}>{e.cond}</span>
                <span style={{ fontSize:13, color:TEXT, flex:1 }}>{e.desc}</span>
                {isActive && <span style={{ fontSize:11, fontFamily:font, color:"#fff", fontWeight:700, background:e.color, padding:"3px 10px", borderRadius:3 }}>◄ ACTUAL</span>}
              </div>
            );
          })}
        </Card>

        {dolar?.updated && (
          <div style={{ fontSize:9, fontFamily:font, color:`${MUTED}60`, marginTop:8 }}>
            Fuente: DolarAPI.com (ve.dolarapi.com) · Última actualización: {new Date(dolar.updated).toLocaleString("es")} · Refresco cada 2 min
          </div>
        )}
      </>)}

      {/* ── INDICADORES ── */}
      {seccion === "indicadores" && (
        <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:10 }}>
          {MACRO.map((m,i) => (
            <Card key={i} accent={m.c}>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{m.k}</div>
              <div style={{ fontSize:20, fontWeight:800, color:m.c, fontFamily:"'Syne',sans-serif" }}>{m.v}</div>
              <div style={{ fontSize:10, color:MUTED, marginTop:4, lineHeight:1.5 }}>{m.s}</div>
            </Card>
          ))}
        </div>
      )}

      {/* ── GRÁFICOS ── */}
      {seccion === "charts" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:12 }}>
          {/* Full historical chart using our data */}
          {rateHistory.length > 2 && (
            <Card>
              <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
                BCV Oficial vs Paralelo · Serie completa · {rateHistory.length} puntos
              </div>
              <RateChart data={rateHistory} />
            </Card>
          )}

          {/* 2026 zoom */}
          {rateHistory.length > 2 && (
            <Card>
              <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
                Zoom 2026 · Post-transición
              </div>
              <RateChart data={rateHistory.filter(r => r.d >= "2026-01-01")} />
            </Card>
          )}

          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:12 }}>
            {/* Brecha chart */}
            {rateHistory.length > 2 && (
              <Card>
                <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
                  Brecha cambiaria % · Histórico
                </div>
                <BrechaChart data={rateHistory} />
              </Card>
            )}

            {/* USD/COP */}
            <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:12, overflow:"hidden" }}>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>USD/COP · Peso Colombiano</div>
              <TradingViewMini symbol="FX_IDC:USDCOP" />
            </div>
          </div>
        </div>
      )}

      {/* ── SOCIOECONÓMICO (World Bank + IMF + R4V) ── */}
      {seccion === "socioeco" && <SocioeconomicPanel mob={mob} />}

      {/* ── SERIES HISTÓRICAS ── */}
      {seccion === "historico" && <HistoricoPanel mob={mob} />}
    </div>
  );
}
