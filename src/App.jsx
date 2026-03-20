import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";

// ═══════════════════════════════════════════════════════════════
// DATA — Externalized to src/data/ for easier weekly updates
// ═══════════════════════════════════════════════════════════════
import { WEEKS, KPIS_LATEST, TENSIONS, MONITOR_WEEKS, ICG_HISTORY, CONF_SEMANAL } from "./data/weekly.js";
import { INDICATORS, SCENARIO_SIGNALS } from "./data/indicators.js";
import { AMNISTIA_TRACKER } from "./data/amnistia.js";
import { SITREP_ALL, CURATED_NEWS, CURATED_FACTCHECK } from "./data/sitrep.js";
import { SCENARIOS, GDELT_ANNOTATIONS, POLYMARKET_SLUGS, CONF_HISTORICO, VEN_PRODUCTION_MANUAL, CONF_MESES, CONF_DERECHOS, CONF_SERVICIOS, CONF_ESTADOS, VZ_MAP } from "./data/static.js";
import { REDES_DATA } from "./data/redes.js";
import { WEEK_DRIVERS } from "./data/weekDrivers.js";
import { TABS } from "./data/tabs.js";

// ═══════════════════════════════════════════════════════════════
// SHARED — Constants, utilities, primitives
// ═══════════════════════════════════════════════════════════════
import { BG, BG2, BG3, BORDER, TEXT, MUTED, ACCENT, SC, SEM, font, fontSans } from "./constants";
import { IS_DEPLOYED, CORS_PROXIES, loadScript, loadCSS, exportChartToPDF, fetchAllGdelt, generateMockGdelt } from "./utils";
import { useIsMobile } from "./hooks/useIsMobile";
import { Badge } from "./components/Badge";
import { Card } from "./components/Card";
import { SemDot } from "./components/SemDot";

// ═══════════════════════════════════════════════════════════════
// EXTRACTED COMPONENTS
// ═══════════════════════════════════════════════════════════════
import { MiniMatrix } from "./components/charts/MiniMatrix";
import { ISVGauge } from "./components/charts/ISVGauge";
import { GdeltChart } from "./components/charts/GdeltChart";
import { ConflictividadChart } from "./components/charts/ConflictividadChart";
import { Sparkline } from "./components/charts/Sparkline";
import { InstabilityChart } from "./components/charts/InstabilityChart";
import { BilateralChart } from "./components/charts/BilateralChart";
import { NewsAlerts } from "./components/NewsAlerts";
import { CohesionMiniWidget } from "./components/CohesionMiniWidget";
import { RedesMiniWidget } from "./components/RedesMiniWidget";
import { NewsTicker } from "./components/NewsTicker";
import { REDES_TOTALS } from "./data/redes.js";
import { TwitterTimeline } from "./components/TwitterTimeline";
import { MonitorNoticias } from "./components/MonitorNoticias";
import { MonitorFactCheck } from "./components/MonitorFactCheck";
import { TabMonitor } from "./components/tabs/TabMonitor";
import { TabGdelt } from "./components/tabs/TabGdelt";
import { TabIODA } from "./components/tabs/TabIODA";
import { FullMatrix } from "./components/charts/FullMatrix";
import { TabMatriz } from "./components/tabs/TabMatriz";
import { TVMarketQuotes } from "./components/charts/TVMarketQuotes";
import { MarketOverviewWidget } from "./components/MarketOverviewWidget";
import { OilPriceTicker } from "./components/OilPriceTicker";
import { BrentChart } from "./components/charts/BrentChart";
import { VenProductionChart } from "./components/charts/VenProductionChart";
import { LivePriceCards } from "./components/LivePriceCards";
import { MereyEstimator } from "./components/MereyEstimator";
import { TabMercados } from "./components/tabs/TabMercados";
import { EstadosMap } from "./components/EstadosMap";
import { LeafletMap } from "./components/LeafletMap";
import { AcledSection } from "./components/AcledSection";
import { TabConflictividad } from "./components/tabs/TabConflictividad";
import { RateChart } from "./components/charts/RateChart";
import { BrechaChart } from "./components/charts/BrechaChart";
import { SocioeconomicPanel } from "./components/SocioeconomicPanel";
import { TradingViewMini } from "./components/charts/TradingViewMini";
import { TabMacro } from "./components/tabs/TabMacro";


// ═══════════════════════════════════════════════════════════════
// STYLES — Light theme, high contrast, legible fonts

const PNUD_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" shape-rendering="crispEdges"><rect width="32" height="22" fill="#0468B1"/><rect x="11" y="2" width="10" height="1" fill="white"/><rect x="9" y="3" width="2" height="1" fill="white"/><rect x="21" y="3" width="2" height="1" fill="white"/><rect x="8" y="4" width="1" height="1" fill="white"/><rect x="23" y="4" width="1" height="1" fill="white"/><rect x="7" y="5" width="1" height="3" fill="white"/><rect x="24" y="5" width="1" height="3" fill="white"/><rect x="7" y="8" width="1" height="3" fill="white"/><rect x="24" y="8" width="1" height="3" fill="white"/><rect x="7" y="11" width="1" height="3" fill="white"/><rect x="24" y="11" width="1" height="3" fill="white"/><rect x="8" y="14" width="1" height="1" fill="white"/><rect x="23" y="14" width="1" height="1" fill="white"/><rect x="9" y="15" width="2" height="1" fill="white"/><rect x="21" y="15" width="2" height="1" fill="white"/><rect x="11" y="16" width="10" height="1" fill="white"/><rect x="15" y="3" width="2" height="14" fill="white" opacity="0.5"/><rect x="8" y="9" width="16" height="1" fill="white" opacity="0.5"/><rect x="13" y="4" width="6" height="1" fill="white" opacity="0.4"/><rect x="12" y="5" width="1" height="1" fill="white" opacity="0.4"/><rect x="19" y="5" width="1" height="1" fill="white" opacity="0.4"/><rect x="11" y="6" width="1" height="2" fill="white" opacity="0.4"/><rect x="20" y="6" width="1" height="2" fill="white" opacity="0.4"/><rect x="11" y="10" width="1" height="2" fill="white" opacity="0.4"/><rect x="20" y="10" width="1" height="2" fill="white" opacity="0.4"/><rect x="12" y="13" width="1" height="1" fill="white" opacity="0.4"/><rect x="19" y="13" width="1" height="1" fill="white" opacity="0.4"/><rect x="13" y="14" width="6" height="1" fill="white" opacity="0.4"/><rect x="5" y="5" width="1" height="1" fill="white" opacity="0.6"/><rect x="4" y="6" width="1" height="2" fill="white" opacity="0.6"/><rect x="4" y="8" width="1" height="3" fill="white" opacity="0.6"/><rect x="4" y="11" width="1" height="2" fill="white" opacity="0.6"/><rect x="5" y="13" width="1" height="1" fill="white" opacity="0.6"/><rect x="26" y="5" width="1" height="1" fill="white" opacity="0.6"/><rect x="27" y="6" width="1" height="2" fill="white" opacity="0.6"/><rect x="27" y="8" width="1" height="3" fill="white" opacity="0.6"/><rect x="27" y="11" width="1" height="2" fill="white" opacity="0.6"/><rect x="26" y="13" width="1" height="1" fill="white" opacity="0.6"/><rect x="15" y="17" width="2" height="2" fill="white" opacity="0.5"/><rect x="13" y="18" width="1" height="1" fill="white" opacity="0.4"/><rect x="18" y="18" width="1" height="1" fill="white" opacity="0.4"/><rect y="22" width="32" height="1" fill="#e8ecf0"/><rect y="23" width="15" height="10" fill="#0468B1"/><rect x="17" y="23" width="15" height="10" fill="#0468B1"/><rect y="33" width="32" height="1" fill="#e8ecf0"/><rect y="34" width="15" height="10" fill="#0468B1"/><rect x="17" y="34" width="15" height="10" fill="#0468B1"/><rect x="3" y="25" width="1" height="6" fill="white"/><rect x="4" y="25" width="3" height="1" fill="white"/><rect x="7" y="25" width="1" height="3" fill="white"/><rect x="4" y="28" width="3" height="1" fill="white"/><rect x="20" y="25" width="1" height="6" fill="white"/><rect x="21" y="26" width="1" height="1" fill="white"/><rect x="22" y="27" width="1" height="1" fill="white"/><rect x="23" y="28" width="1" height="1" fill="white"/><rect x="24" y="29" width="1" height="1" fill="white"/><rect x="25" y="25" width="1" height="6" fill="white"/><rect x="3" y="36" width="1" height="6" fill="white"/><rect x="9" y="36" width="1" height="6" fill="white"/><rect x="4" y="41" width="5" height="1" fill="white"/><rect x="20" y="36" width="1" height="6" fill="white"/><rect x="21" y="36" width="3" height="1" fill="white"/><rect x="24" y="37" width="1" height="4" fill="white"/><rect x="21" y="41" width="3" height="1" fill="white"/></svg>';
const PNUD_LOGO = "data:image/svg+xml," + encodeURIComponent(PNUD_LOGO_SVG);
// Top: UN globe emblem (simplified pixel grid)
'<rect width="48" height="34" fill="#0468B1"/>' +
// Globe outline (pixelated circle)
'<rect x="17" y="3" width="14" height="2" fill="white"/>' +
'<rect x="13" y="5" width="4" height="2" fill="white"/><rect x="31" y="5" width="4" height="2" fill="white"/>' +
'<rect x="11" y="7" width="2" height="2" fill="white"/><rect x="35" y="7" width="2" height="2" fill="white"/>' +
'<rect x="9" y="9" width="2" height="6" fill="white"/><rect x="37" y="9" width="2" height="6" fill="white"/>' +
'<rect x="9" y="15" width="2" height="6" fill="white"/><rect x="37" y="15" width="2" height="6" fill="white"/>' +
'<rect x="11" y="21" width="2" height="2" fill="white"/><rect x="35" y="21" width="2" height="2" fill="white"/>' +
'<rect x="13" y="23" width="4" height="2" fill="white"/><rect x="31" y="23" width="4" height="2" fill="white"/>' +
'<rect x="17" y="25" width="14" height="2" fill="white"/>' +
// Horizontal line through globe
'<rect x="11" y="14" width="26" height="2" fill="white" opacity="0.6"/>' +
// Vertical line through globe
'<rect x="23" y="5" width="2" height="22" fill="white" opacity="0.6"/>' +
// Equator curve dots
'<rect x="14" y="11" width="2" height="2" fill="white" opacity="0.5"/>' +
'<rect x="18" y="10" width="2" height="2" fill="white" opacity="0.5"/>' +
'<rect x="26" y="10" width="2" height="2" fill="white" opacity="0.5"/>' +
'<rect x="32" y="11" width="2" height="2" fill="white" opacity="0.5"/>' +
'<rect x="14" y="17" width="2" height="2" fill="white" opacity="0.5"/>' +
'<rect x="18" y="18" width="2" height="2" fill="white" opacity="0.5"/>' +
'<rect x="26" y="18" width="2" height="2" fill="white" opacity="0.5"/>' +
'<rect x="32" y="17" width="2" height="2" fill="white" opacity="0.5"/>' +
// Laurel leaves (simplified pixel)
'<rect x="6" y="11" width="2" height="2" fill="white" opacity="0.7"/>' +
'<rect x="5" y="13" width="2" height="2" fill="white" opacity="0.7"/>' +
'<rect x="4" y="15" width="2" height="4" fill="white" opacity="0.7"/>' +
'<rect x="5" y="19" width="2" height="2" fill="white" opacity="0.7"/>' +
'<rect x="6" y="21" width="2" height="2" fill="white" opacity="0.7"/>' +
'<rect x="40" y="11" width="2" height="2" fill="white" opacity="0.7"/>' +
'<rect x="41" y="13" width="2" height="2" fill="white" opacity="0.7"/>' +
'<rect x="42" y="15" width="2" height="4" fill="white" opacity="0.7"/>' +
'<rect x="41" y="19" width="2" height="2" fill="white" opacity="0.7"/>' +
'<rect x="40" y="21" width="2" height="2" fill="white" opacity="0.7"/>' +
// Bottom: P N U D in pixel font
'<rect y="36" width="22" height="13" fill="#0468B1"/>' +
'<rect x="26" y="36" width="22" height="13" fill="#0468B1"/>' +
'<rect y="51" width="22" height="13" fill="#0468B1"/>' +
'<rect x="26" y="51" width="22" height="13" fill="#0468B1"/>' +
// P (pixel)
'<rect x="4" y="39" width="2" height="8" fill="white"/>' +
'<rect x="6" y="39" width="4" height="2" fill="white"/>' +
'<rect x="10" y="39" width="2" height="4" fill="white"/>' +
'<rect x="6" y="43" width="4" height="2" fill="white"/>' +
// N (pixel)
'<rect x="30" y="39" width="2" height="8" fill="white"/>' +
'<rect x="32" y="40" width="2" height="2" fill="white"/>' +
'<rect x="34" y="42" width="2" height="2" fill="white"/>' +
'<rect x="36" y="44" width="2" height="2" fill="white"/>' +
'<rect x="38" y="39" width="2" height="8" fill="white"/>' +
// U (pixel)
'<rect x="4" y="54" width="2" height="8" fill="white"/>' +
'<rect x="14" y="54" width="2" height="8" fill="white"/>' +
'<rect x="6" y="60" width="8" height="2" fill="white"/>' +
// D (pixel)
'<rect x="30" y="54" width="2" height="8" fill="white"/>' +
'<rect x="32" y="54" width="4" height="2" fill="white"/>' +
'<rect x="36" y="56" width="2" height="4" fill="white"/>' +
'<rect x="32" y="60" width="4" height="2" fill="white"/>' +
'</svg>';
function TabSitrep({ liveData = {} }) {
  const mob = useIsMobile();
  const [sitrepWeek, setSitrepWeek] = useState(SITREP_ALL.length - 1);
  const d = SITREP_ALL[sitrepWeek];
  const isLatest = sitrepWeek === SITREP_ALL.length - 1;
  const hasDetail = !!d.nacional; // S8 has extra detail sections
  const [expandedSection, setExpandedSection] = useState(null);
  const [viewMode, setViewMode] = useState("informe"); // informe | briefing
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [dailyBrief, setDailyBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefProvider, setBriefProvider] = useState("");
  const [briefError, setBriefError] = useState("");

  const wk = WEEKS[sitrepWeek] || WEEKS[WEEKS.length - 1];

  // ── Daily Brief generator ──
  const generateDailyBrief = async () => {
    setBriefLoading(true); setBriefError(""); setDailyBrief("");
    const dom = wk.probs.reduce((a,b) => a.v > b.v ? a : b);
    const domSc = SCENARIOS.find(s=>s.id===dom.sc);
    const amnistia = AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 1];

    // Fetch fresh headlines from Google News RSS (3 dimensions)
    let newsPolitica = [], newsEconomia = [], newsInternacional = [];
    if (IS_DEPLOYED) {
      try {
        const headRes = await fetch("/api/gdelt?signal=headlines", { signal: AbortSignal.timeout(12000) });
        if (headRes.ok) {
          const h = await headRes.json();
          newsPolitica = (h.politica || []).filter(a => a.title?.length > 20).slice(0, 6);
          newsEconomia = (h.economia || []).filter(a => a.title?.length > 20).slice(0, 6);
          newsInternacional = (h.internacional || []).filter(a => a.title?.length > 20).slice(0, 6);
        }
      } catch {}
    }

    // RSS headlines as supplement
    const rssHeadlines = (liveData?.news || []).slice(0, 8).map(n => ({
      title: n.title || n.titulo || "", source: n.source || n.fuente || ""
    })).filter(n => n.title.length > 15);

    const fecha = new Date().toLocaleDateString("es", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

    const prompt = `Eres un analista senior del PNUD Venezuela. Genera un DAILY BRIEF para hoy ${fecha}.

═══ CONTEXTO ANALÍTICO ═══
Escenario dominante: ${domSc?.name} (E${dom.sc}) al ${dom.v}%
Escenarios: ${wk.probs.map(p => `E${p.sc}: ${p.v}%`).join(", ")}
${liveData?.dolar ? `Dólar BCV: ${liveData.dolar.bcv || "—"} Bs | Paralelo: ${liveData.dolar.paralelo || "—"} Bs | Brecha: ${liveData.dolar.brecha || "—"}%` : ""}
${liveData?.oil ? `Petróleo Brent: $${liveData.oil.brent || "—"} | WTI: $${liveData.oil.wti || "—"}` : ""}
${amnistia ? `Amnistía — Gobierno: ${amnistia.gob.libertades || amnistia.gob.excarcelados} libertades | Foro Penal: ${amnistia.fp.verificados} verificadas | Presos: ${amnistia.fp.detenidos}` : ""}
${wk.tensiones.filter(t=>t.l==="red").length > 0 ? `Tensiones rojas: ${wk.tensiones.filter(t=>t.l==="red").map(t=>t.t.replace(/<[^>]+>/g,"")).join("; ")}` : ""}

═══ NOTICIAS FRESCAS (últimas 24h) ═══

📌 POLÍTICA:
${newsPolitica.map(a => `• "${a.title}" [${a.source}]`).join("\n") || "Sin noticias recientes"}

📌 ECONOMÍA / ENERGÍA:
${newsEconomia.map(a => `• "${a.title}" [${a.source}]`).join("\n") || "Sin noticias recientes"}

📌 INTERNACIONAL / GEOPOLÍTICA:
${newsInternacional.map(a => `• "${a.title}" [${a.source}]`).join("\n") || "Sin noticias recientes"}

📌 RSS MONITOR PNUD (complementarias):
${rssHeadlines.map(a => `• "${a.title}" [${a.source}]`).join("\n") || "Sin noticias RSS"}

═══ INSTRUCCIONES ═══
1. Escribe 3-4 párrafos (250-350 palabras total), uno por dimensión:
   - POLÍTICO: Sintetiza las noticias políticas más relevantes. Conecta con el escenario dominante.
   - ECONÓMICO: Incluye datos de mercado (dólar, petróleo) y noticias económicas.
   - INTERNACIONAL: Sintetiza noticias geopolíticas y su impacto en Venezuela.
2. CITA las fuentes entre corchetes [Fuente] después de cada dato o hecho. Ejemplo: "El gobierno anunció nuevas medidas [Reuters]."
3. Usa SOLO las noticias proporcionadas. NO inventes hechos ni fuentes.
4. Ignora completamente titulares que no se relacionen con Venezuela.
5. Si no hay noticias en alguna dimensión, omite ese párrafo.
6. Tono: analítico, profesional, tipo cable diplomático. Sin bullet points.
7. Al final, una línea de cierre con la valoración general del día en relación al escenario dominante.`;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, max_tokens: 800 }),
        signal: AbortSignal.timeout(40000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.text) { setDailyBrief(data.text); setBriefProvider(data.provider || ""); }
        else { setBriefError("Respuesta vacía del proveedor de IA"); }
      } else {
        const errData = await res.json().catch(() => ({}));
        setBriefError(errData.error || `Error ${res.status}`);
      }
    } catch (e) {
      setBriefError(e.message || "Error de conexión");
    }
    setBriefLoading(false);
  };

  // ── AI Analysis generator ──
  const generateAiAnalysis = async () => {
    setAiLoading(true); setAiError(""); setAiAnalysis("");

    // ── PRIORITY 1: SITREP + WEEKS (core analysis) ──
    const weekData = {
      periodo: d.period,
      escenarios: wk.probs.map(p => { const sc = SCENARIOS.find(s=>s.id===p.sc); return { nombre:sc?.name, prob:p.v, tendencia:p.t }; }),
      tendencia: { escenario: SCENARIOS.find(s=>s.id===wk.trendSc)?.name, drivers: wk.trendDrivers },
      puntosClaveVen: d.keyPoints.map(kp => kp.title + ": " + kp.text),
      sintesis: d.sintesis,
      tensiones: wk.tensiones.map(t => t.t.replace(/<[^>]+>/g,"")),
      kpis: wk.kpis,
      semaforo: wk.sem,
      lecturaAnalitica: wk.lectura?.slice(0, 600) || "",
      actores: d.actores?.map(a => ({ nombre:a.name, items:a.items.slice(0,3) })) || [],
    };

    // ── PRIORITY 2: Indicadores y señales ──
    const lastIndicators = INDICATORS.map(ind => {
      const last = ind.hist.filter(h => h !== null).pop();
      if (!last) return null;
      return { dim:ind.dim, nombre:ind.name, semaforo:last[0], tendencia:last[1], valor:last[2], escenario:ind.esc, nuevo:!!ind.addedWeek };
    }).filter(Boolean);

    const signals = SCENARIO_SIGNALS.map(g => ({
      escenario: "E" + (SCENARIOS.find(s=>s.id===parseInt(g.esc.charAt(1)))?.id || g.esc),
      senales: g.signals.map(s => ({ nombre:s.name, estado:s.sem, valor:s.val, nuevo:!!s.isNew }))
    }));

    // ── PRIORITY 3: Amnistía ──
    const amnistia = AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 1];
    const amnistiaData = amnistia ? {
      gobierno: amnistia.gob,
      foroPenal: amnistia.fp,
      hito: amnistia.hito,
    } : null;

    // ── CONTEXT: Live data from shared state ──
    const liveContext = {};
    if (liveData?.dolar) liveContext.dolar = liveData.dolar;
    if (liveData?.oil) liveContext.petroleo = liveData.oil;
    if (liveData?.news?.length) liveContext.titulares = liveData.news;

    const prompt = `Eres un analista político-económico senior del PNUD especializado en Venezuela. Genera un análisis narrativo de contexto situacional de 5-6 párrafos para el período ${d.period}.

═══ DATOS PRINCIPALES DEL PERÍODO (prioridad máxima) ═══
${JSON.stringify(weekData, null, 2)}

═══ INDICADORES DEL MONITOR (28 indicadores, 4 dimensiones) ═══
${JSON.stringify(lastIndicators, null, 1)}

═══ SEÑALES POR ESCENARIO (32 señales activas) ═══
${JSON.stringify(signals, null, 1)}

═══ AMNISTÍA: GOBIERNO vs FORO PENAL ═══
${amnistiaData ? JSON.stringify(amnistiaData, null, 2) : "No disponible"}

═══ DATOS EN VIVO (mercados y contexto actual) ═══
${Object.keys(liveContext).length > 0 ? JSON.stringify(liveContext, null, 2) : "No disponible en este momento"}

═══ INSTRUCCIONES ═══
1. Escribe en español profesional, tono institucional PNUD, sin bullet points ni listas.
2. PRIORIZA los datos del SITREP (escenarios, síntesis, tensiones, actores) como eje narrativo.
3. USA los indicadores y señales para enriquecer el análisis con datos duros y tendencias.
4. Si hay DATOS EN VIVO disponibles (dólar, petróleo, titulares), incorpóralos como contexto de mercado actual. IMPORTANTE: de los titulares de noticias, usa SOLO los que se refieran directamente a Venezuela o que tengan relación con el contexto venezolano. Ignora titulares sobre otros países o temas no relacionados.
5. Estructura:
   - Párrafo 1: Panorama general — escenario dominante, probabilidades, tendencia y drivers principales.
   - Párrafo 2: Dinámica energética y económica — exportaciones, petróleo, PIB, recaudación, brecha cambiaria. Usa indicadores de las dimensiones Energético y Económico. Si hay datos en vivo de petróleo o dólar, menciónalos como contexto de mercado.
   - Párrafo 3: Dinámica política interna y DDHH — amnistía (contrasta cifras gobierno vs Foro Penal), presos políticos, cautelares, FANB, marcos restrictivos.
   - Párrafo 4: Factores internacionales — cooperación EE.UU., sanciones UE, FMI, normalización diplomática. Usa señales de E3 y E1.
   - Párrafo 5: Presiones y riesgos — tensiones activas, señales de E4 y E2, indicadores en rojo.
   - Párrafo 6: Perspectiva de corto plazo — variables críticas a monitorear, escenarios con mayor probabilidad de movimiento. Si hay titulares de noticias en vivo relacionados con Venezuela, úsalos para contextualizar la coyuntura inmediata.
6. Sé específico con cifras, nombres propios y datos del período. Menciona indicadores NUEVOS si los hay.
7. NO inventes datos. Usa EXCLUSIVAMENTE la información proporcionada.
8. Extensión: 500-700 palabras.`;

    try {
      let text = "";
      if (IS_DEPLOYED) {
        // On Vercel: use serverless proxy (Gemini free → Claude fallback)
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, max_tokens: 2000 }),
          signal: AbortSignal.timeout(40000),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `API error: ${res.status}`);
        }
        const data = await res.json();
        text = data.text || "Sin respuesta.";
        if (data.provider) text = `[${data.provider}]\n\n` + text;
      } else {
        // In Claude.ai artifact: direct call (API key injected by environment)
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2000,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        text = data.content?.map(c => c.text || "").join("\n") || "Sin respuesta.";
      }
      setAiAnalysis(text);
    } catch (err) {
      setAiError(err.message || "Error al generar análisis");
    } finally { setAiLoading(false); }
  };

  // ── Document generator ──
  const generateDocument = async (mode = "html") => {
    const escRows = wk.probs.map(p => {
      const sc = SCENARIOS.find(s=>s.id===p.sc);
      return `<tr><td style="padding:8px;border-bottom:1px solid #d0d7e0;font-weight:600;color:${sc?.color}">${sc?.name}</td><td style="padding:8px;border-bottom:1px solid #d0d7e0;text-align:center;font-size:18px;font-weight:700;color:${sc?.color}">${p.v}%</td><td style="padding:8px;border-bottom:1px solid #d0d7e0;color:#5a6a7a">${{up:"↑ Subiendo",down:"↓ Bajando",flat:"→ Estable"}[p.t]}</td></tr>`;
    }).join("");
    const kpCards = d.keyPoints.map(kp => `<div style="flex:1;min-width:200px;border-left:3px solid ${kp.color};padding:12px 16px;background:#f8fafc"><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:${kp.color};margin-bottom:4px">${kp.tag}</div><div style="font-weight:600;margin-bottom:6px">${kp.title}</div><div style="font-size:13px;color:#5a6a7a;line-height:1.5">${kp.text}</div></div>`).join("");
    const tensionRows = wk.tensiones.map(t => {
      const colors = {green:"#16a34a",yellow:"#ca8a04",red:"#dc2626"};
      return `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #eef1f5"><span style="width:8px;height:8px;border-radius:50%;background:${colors[t.l]};margin-top:5px;flex-shrink:0"></span><span style="font-size:13px;color:#3d4f5f;line-height:1.5">${t.t}</span></div>`;
    }).join("");
    const actorBlocks = d.actores.map(a => `<div style="margin-bottom:16px"><div style="font-weight:700;font-size:14px;margin-bottom:6px;color:#0468B1">${a.name}</div>${a.items.map(item=>`<div style="font-size:12px;color:#5a6a7a;padding:3px 0 3px 10px;border-left:2px solid #eef1f5;line-height:1.4">· ${item}</div>`).join("")}</div>`).join("");

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>SITREP — ${d.period}</title><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;color:#1a202c;line-height:1.6;background:#fff}@media print{body{font-size:11px}.no-print{display:none!important}}</style></head><body>
<div style="background:linear-gradient(135deg,#0468B1,#009edb);padding:20px 32px;color:#fff">
<div style="font-family:'Space Mono',monospace;font-size:10px;letter-spacing:0.2em;opacity:0.7;text-transform:uppercase;margin-bottom:4px">PNUD Venezuela · Análisis de Contexto Situacional</div>
<div style="font-size:22px;font-weight:700">SITREP Semanal</div>
<div style="font-family:'Space Mono',monospace;font-size:11px;margin-top:4px;opacity:0.8">${d.period}</div>
</div>
<div style="max-width:900px;margin:0 auto;padding:32px">
<h2 style="font-size:16px;color:#0468B1;border-bottom:2px solid #0468B1;padding-bottom:6px;margin-bottom:16px">Puntos Clave del Período</h2>
<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:32px">${kpCards}</div>
<h2 style="font-size:16px;color:#0468B1;border-bottom:2px solid #0468B1;padding-bottom:6px;margin-bottom:16px">Escenarios — Probabilidades</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:32px"><thead><tr style="border-bottom:2px solid #0468B1"><th style="text-align:left;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6a7a">Escenario</th><th style="text-align:center;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6a7a">Prob.</th><th style="text-align:left;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6a7a">Tendencia</th></tr></thead><tbody>${escRows}</tbody></table>
<h2 style="font-size:16px;color:#0468B1;border-bottom:2px solid #0468B1;padding-bottom:6px;margin-bottom:16px">Síntesis</h2>
<div style="font-size:14px;color:#3d4f5f;line-height:1.75;margin-bottom:32px;padding:16px;background:#f8fafc;border-left:3px solid #0468B1">${d.sintesis}</div>
<h2 style="font-size:16px;color:#0468B1;border-bottom:2px solid #0468B1;padding-bottom:6px;margin-bottom:16px">Semáforo de Tensiones</h2>
<div style="margin-bottom:32px">${tensionRows}</div>
<h2 style="font-size:16px;color:#0468B1;border-bottom:2px solid #0468B1;padding-bottom:6px;margin-bottom:16px">Dinámicas por Actor</h2>
<div style="margin-bottom:32px">${actorBlocks}</div>
${aiAnalysis ? `<h2 style="font-size:16px;color:#0468B1;border-bottom:2px solid #0468B1;padding-bottom:6px;margin-bottom:16px">Análisis Narrativo (IA)</h2><div style="font-size:14px;color:#3d4f5f;line-height:1.75;margin-bottom:32px;white-space:pre-wrap">${aiAnalysis}</div>` : ""}
<div style="text-align:center;font-family:'Space Mono',monospace;font-size:10px;color:#5a6a7a80;padding:24px 0;letter-spacing:0.1em;text-transform:uppercase;border-top:1px solid #d0d7e0;margin-top:32px">PNUD Venezuela · Monitor de Contexto Situacional · ${d.periodShort} · Uso interno</div>
</div></body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    if (mode === "pdf") {
      // Direct PDF download using html2canvas + jsPDF
      try {
        // Load libraries dynamically
        await Promise.all([
          loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"),
          loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
        ]);
        // Create hidden container with the HTML
        const container = document.createElement("div");
        container.innerHTML = html;
        container.style.cssText = "position:fixed;top:0;left:0;width:800px;background:#fff;z-index:99999;padding:40px;";
        document.body.appendChild(container);
        // Wait for fonts/images to load
        await new Promise(r => setTimeout(r, 600));
        const canvas = await window.html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        document.body.removeChild(container);
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();
        const imgW = canvas.width;
        const imgH = canvas.height;
        const ratio = pdfW / imgW;
        const scaledH = imgH * ratio;
        // Multi-page support
        let yOffset = 0;
        while (yOffset < scaledH) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, -yOffset, pdfW, scaledH);
          yOffset += pdfH;
        }
        pdf.save(`SITREP_${d.periodShort.replace(/[^a-zA-Z0-9]/g,"_")}.pdf`);
      } catch (e) {
        console.error("PDF generation failed:", e);
        // Fallback to print dialog
        const win = window.open(URL.createObjectURL(blob), "_blank");
        if (win) win.addEventListener("load", () => setTimeout(() => win.print(), 500));
      }
    } else {
      const a = document.createElement("a"); a.href = url;
      a.download = `SITREP_${d.periodShort.replace(/[^a-zA-Z0-9]/g,"_")}.html`;
      a.click(); URL.revokeObjectURL(url);
    }
  };

  const toggle = (id) => setExpandedSection(prev => prev === id ? null : id);

  const cardStyle = {
    background: BG2, border:`1px solid ${BORDER}`, padding: mob?14:20,
    marginBottom: mob?8:12, transition:"all 0.2s",
  };
  const tagStyle = (color) => ({
    display:"inline-block", fontSize:9, fontFamily:font, letterSpacing:"0.12em",
    textTransform:"uppercase", padding:"2px 8px", background:`${color}14`,
    color, border:`1px solid ${color}28`, marginBottom:8,
  });
  const sectionHeaderStyle = {
    display:"flex", alignItems:"center", gap:mob?8:12, cursor:"pointer",
    padding:mob?"12px 0":"16px 0", userSelect:"none",
  };
  const sectionNumStyle = {
    fontFamily:font, fontSize:mob?10:11, color:ACCENT, letterSpacing:"0.15em",
    opacity:0.5, minWidth:mob?24:30,
  };
  const sectionTitleStyle = {
    fontFamily:fontSans, fontSize:mob?15:18, fontWeight:600, color:TEXT,
    flex:1,
  };
  const chevronStyle = (open) => ({
    fontSize:mob?12:14, color:MUTED, transition:"transform 0.2s",
    transform: open ? "rotate(180deg)" : "rotate(0deg)",
  });
  const gridStyle = (cols) => ({
    display:"grid", gridTemplateColumns:mob?"1fr":`repeat(${cols}, 1fr)`,
    gap:mob?8:12,
  });
  const timelineItemStyle = {
    padding:"10px 0", borderBottom:`1px solid ${BORDER}40`,
  };
  const tlTitleStyle = {
    fontFamily:fontSans, fontSize:mob?12:13, fontWeight:600, color:TEXT,
    marginBottom:4,
  };
  const tlBodyStyle = {
    fontFamily:fontSans, fontSize:mob?11:12.5, color:MUTED, lineHeight:1.55,
  };

  const Section = ({ num, title, id, children, defaultOpen }) => {
    const isOpen = expandedSection === id || (expandedSection === null && defaultOpen);
    return (
      <div style={{ borderBottom:`1px solid ${BORDER}40` }}>
        <div style={sectionHeaderStyle} onClick={() => toggle(id)}>
          <span style={sectionNumStyle}>{num}</span>
          <span style={sectionTitleStyle}>{title}</span>
          <span style={chevronStyle(isOpen)}>▼</span>
        </div>
        {isOpen && <div style={{ paddingBottom:mob?16:24 }}>{children}</div>}
      </div>
    );
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ background:`linear-gradient(135deg, ${ACCENT} 0%, #009edb 100%)`, padding:mob?"16px 14px":"20px 24px",
        marginBottom:mob?16:24, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div>
          <div style={{ fontFamily:font, fontSize:mob?9:10, letterSpacing:"0.2em", color:"rgba(255,255,255,0.7)", textTransform:"uppercase", marginBottom:4 }}>
            PNUD Venezuela · Análisis de Contexto Situacional
          </div>
          <div style={{ fontFamily:fontSans, fontSize:mob?16:22, fontWeight:700, color:"#fff" }}>
            SITREP Semanal
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {isLatest && <span style={{ fontSize:9, fontFamily:font, letterSpacing:"0.1em", background:"rgba(255,255,255,0.2)", color:"#fff", padding:"2px 8px", textTransform:"uppercase" }}>Más reciente</span>}
          <select value={sitrepWeek} onChange={e => { setSitrepWeek(+e.target.value); setExpandedSection(null); }}
            style={{ fontFamily:font, fontSize:mob?10:12, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", color:"#fff",
              padding:mob?"4px 22px 4px 6px":"5px 28px 5px 10px", cursor:"pointer", outline:"none",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='white'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 6px center" }}>
            {SITREP_ALL.map((s, i) => <option key={i} value={i} style={{ color:TEXT, background:BG2 }}>{s.periodShort}</option>)}
          </select>
        </div>
      </div>

      {/* TOOLBAR: Mode toggle + Actions */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:mob?12:16, flexWrap:"wrap" }}>
        {/* View mode toggle */}
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}` }}>
          {[{id:"informe",label:"📄 Informe"},{id:"briefing",label:"📌 Briefing"}].map(m => (
            <button key={m.id} onClick={() => setViewMode(m.id)}
              style={{ fontSize:mob?10:12, fontFamily:font, padding:mob?"5px 10px":"6px 14px", border:"none",
                background:viewMode===m.id?ACCENT:"transparent", color:viewMode===m.id?"#fff":MUTED,
                cursor:"pointer", letterSpacing:"0.06em", transition:"all 0.15s" }}>
              {m.label}
            </button>
          ))}
        </div>
        <div style={{ flex:1 }} />
        {/* Action buttons */}
        <button onClick={generateDailyBrief} disabled={briefLoading}
          style={{ fontSize:mob?10:11, fontFamily:font, padding:mob?"5px 10px":"6px 14px",
            background:briefLoading?BG3:`linear-gradient(135deg, #0e7490, #0891b2)`, color:briefLoading?MUTED:"#fff",
            border:"none", cursor:briefLoading?"wait":"pointer", letterSpacing:"0.06em", transition:"all 0.15s" }}>
          {briefLoading ? "⏳ Buscando..." : "📰 Daily Brief"}
        </button>
        <button onClick={generateAiAnalysis} disabled={aiLoading}
          style={{ fontSize:mob?10:11, fontFamily:font, padding:mob?"5px 10px":"6px 14px",
            background:aiLoading?BG3:`linear-gradient(135deg, #8b5cf6, #6d28d9)`, color:aiLoading?MUTED:"#fff",
            border:"none", cursor:aiLoading?"wait":"pointer", letterSpacing:"0.06em", transition:"all 0.15s" }}>
          {aiLoading ? "⏳ Generando..." : "🤖 Análisis IA"}
        </button>
        <button onClick={generateDocument}
          style={{ fontSize:mob?10:11, fontFamily:font, padding:mob?"5px 10px":"6px 14px",
            background:ACCENT, color:"#fff", border:"none", cursor:"pointer", letterSpacing:"0.06em" }}>
          📥 HTML
        </button>
        <button onClick={() => {
          generateDocument("pdf");
        }}
          style={{ fontSize:mob?10:11, fontFamily:font, padding:mob?"5px 10px":"6px 14px",
            background:"#dc2626", color:"#fff", border:"none", cursor:"pointer", letterSpacing:"0.06em" }}>
          📄 PDF
        </button>
      </div>

      {/* ═══ DAILY BRIEF DISPLAY ═══ */}
      {(dailyBrief || briefLoading || briefError) && (
        <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:mob?12:16, marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:dailyBrief?10:0, flexWrap:"wrap" }}>
            <span style={{ fontSize:14 }}>📰</span>
            <div style={{ fontSize:10, fontFamily:font, letterSpacing:"0.12em", textTransform:"uppercase", color:"#0e7490" }}>Daily Brief</div>
            {dailyBrief && (
              <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>
                {new Date().toLocaleString("es", { hour:"2-digit", minute:"2-digit" })} · hoy
              </span>
            )}
            {briefProvider && (() => {
              const bc = briefProvider.includes("mistral") ? "#ff6f00" : briefProvider.includes("gemini") ? "#4285f4" : briefProvider.includes("groq")||briefProvider.includes("llama") ? "#f97316" : briefProvider.includes("openrouter")||briefProvider.includes("free") ? "#06b6d4" : "#8b5cf6";
              const bl = briefProvider.includes("mistral") ? "MISTRAL" : briefProvider.includes("gemini") ? "GEMINI" : briefProvider.includes("groq")||briefProvider.includes("llama") ? "GROQ" : briefProvider.includes("openrouter")||briefProvider.includes("free") ? "OPENROUTER" : "CLAUDE";
              return <span style={{ fontSize:7, fontFamily:font, padding:"1px 5px", background:`${bc}15`, color:bc, border:`1px solid ${bc}30`, letterSpacing:"0.08em" }}>{bl}</span>;
            })()}
            {briefLoading && <span style={{ fontSize:10, fontFamily:font, color:MUTED, animation:"pulse 1.5s infinite" }}>Buscando noticias y generando brief...</span>}
          </div>
          {briefError && (
            <div style={{ fontSize:12, fontFamily:font, color:"#dc2626", marginTop:6 }}>Error: {briefError}</div>
          )}
          {dailyBrief && (
            <div style={{ fontSize:mob?12:13, fontFamily:fontSans, color:TEXT, lineHeight:1.7 }}
              dangerouslySetInnerHTML={{ __html: dailyBrief
                .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.+?)\*/g, "<em>$1</em>")
                .replace(/\[([^\]]+)\]/g, '<span style="color:#0e7490;font-size:11px;font-family:\'Space Mono\',monospace">[$1]</span>')
                .replace(/\n/g, "<br/>")
              }} />
          )}
        </div>
      )}

      {/* ═══ BRIEFING VIEW ═══ */}
      {viewMode === "briefing" && (
        <div>
          {/* Briefing: One-page consolidated view */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"2fr 1fr", gap:mob?10:14 }}>
            {/* Left column */}
            <div>
              {/* Scenario probabilities */}
              <div style={{ ...cardStyle, marginBottom:mob?10:14 }}>
                <div style={{ fontSize:11, fontFamily:font, color:ACCENT, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>Escenarios — {d.periodShort}</div>
                {wk.probs.map(p => {
                  const sc = SCENARIOS.find(s=>s.id===p.sc);
                  return (
                    <div key={p.sc} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <span style={{ fontSize:12, fontFamily:font, color:sc.color, width:20, fontWeight:700 }}>E{sc.id}</span>
                      <div style={{ flex:1, height:8, background:BG3, borderRadius:3 }}>
                        <div style={{ height:8, background:sc.color, width:`${p.v}%`, borderRadius:3, transition:"width 0.4s" }} />
                      </div>
                      <span style={{ fontSize:14, fontFamily:font, color:sc.color, fontWeight:700, width:36, textAlign:"right" }}>{p.v}%</span>
                      <span style={{ fontSize:11, color:p.t==="up"?"#22c55e":p.t==="down"?"#ef4444":MUTED }}>
                        {{up:"↑",down:"↓",flat:"→"}[p.t]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Key Points */}
              {d.keyPoints.map((kp, i) => (
                <div key={i} style={{ ...cardStyle, borderLeft:`3px solid ${kp.color}`, marginBottom:mob?6:8, padding:mob?10:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:8, fontFamily:font, letterSpacing:"0.12em", textTransform:"uppercase", padding:"1px 6px",
                      background:`${kp.color}14`, color:kp.color, border:`1px solid ${kp.color}28` }}>{kp.tag}</span>
                    <span style={{ fontSize:mob?12:13, fontWeight:600, color:TEXT }}>{kp.title}</span>
                  </div>
                  <div style={{ fontSize:mob?11:12, color:MUTED, lineHeight:1.5 }}>{kp.text}</div>
                </div>
              ))}
            </div>

            {/* Right column */}
            <div>
              {/* Semáforo de tensiones */}
              <div style={{ ...cardStyle, marginBottom:mob?10:14 }}>
                <div style={{ fontSize:11, fontFamily:font, color:ACCENT, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Semáforo</div>
                <div style={{ display:"flex", gap:12, marginBottom:10 }}>
                  {[{l:"Verde",c:SEM.green,n:wk.sem.g},{l:"Amarillo",c:SEM.yellow,n:wk.sem.y},{l:"Rojo",c:SEM.red,n:wk.sem.r}].map((s,i) => (
                    <div key={i} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:18, fontWeight:800, color:s.c }}>{s.n}</div>
                      <div style={{ fontSize:9, fontFamily:font, color:MUTED }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                {wk.tensiones.map((t,i) => (
                  <div key={i} style={{ display:"flex", gap:6, padding:"4px 0", borderBottom:i<wk.tensiones.length-1?`1px solid ${BORDER}30`:"none", alignItems:"flex-start" }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:SEM[t.l], marginTop:5, flexShrink:0 }} />
                    <div style={{ fontSize:11, color:MUTED, lineHeight:1.4 }} dangerouslySetInnerHTML={{__html:t.t}} />
                  </div>
                ))}
              </div>

              {/* Tendencia */}
              <div style={{ ...cardStyle, marginBottom:mob?10:14, background:`${SCENARIOS.find(s=>s.id===wk.trendSc)?.color}08`,
                borderLeft:`3px solid ${SCENARIOS.find(s=>s.id===wk.trendSc)?.color}` }}>
                <div style={{ fontSize:11, fontFamily:font, color:SCENARIOS.find(s=>s.id===wk.trendSc)?.color, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>
                  Tendencia → E{wk.trendSc}
                </div>
                {wk.trendDrivers.map((dr,i) => (
                  <div key={i} style={{ fontSize:11, color:TEXT, lineHeight:1.5, padding:"2px 0" }}>› {dr}</div>
                ))}
              </div>

              {/* Actors compact */}
              <div style={cardStyle}>
                <div style={{ fontSize:11, fontFamily:font, color:ACCENT, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Actores</div>
                {d.actores.map((a,i) => (
                  <div key={i} style={{ marginBottom:i<d.actores.length-1?10:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:TEXT, marginBottom:3 }}>{a.name}</div>
                    {a.items.slice(0,2).map((item,j) => (
                      <div key={j} style={{ fontSize:10, color:MUTED, lineHeight:1.4, paddingLeft:8, borderLeft:`2px solid ${BG3}` }}>· {item}</div>
                    ))}
                    {a.items.length > 2 && <div style={{ fontSize:9, color:`${MUTED}80`, paddingLeft:8 }}>+{a.items.length-2} más</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Síntesis */}
          <div style={{ ...cardStyle, marginTop:mob?10:14, borderLeft:`3px solid ${ACCENT}` }}>
            <div style={{ fontSize:11, fontFamily:font, color:ACCENT, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Síntesis del período</div>
            <div style={{ fontSize:mob?12:13, color:TEXT, lineHeight:1.7 }}>{d.sintesis}</div>
          </div>

          {/* AI Analysis if generated */}
          {aiAnalysis && (() => {
            const providerMatch = aiAnalysis.match(/^\[([^\]]+)\]\n\n/);
            const provider = providerMatch ? providerMatch[1] : "claude";
            const displayText = providerMatch ? aiAnalysis.slice(providerMatch[0].length) : aiAnalysis;
            const badgeColor = provider.includes("mistral") ? "#ff6f00" : provider.includes("gemini") ? "#4285f4" : provider.includes("groq")||provider.includes("llama") ? "#f97316" : provider.includes("openrouter")||provider.includes("free") ? "#06b6d4" : provider.includes("hugging")||provider.includes("qwen")||provider.includes("hf") ? "#ffbf00" : "#8b5cf6";
            const badgeLabel = provider.includes("mistral") ? "MISTRAL" : provider.includes("gemini") ? "GEMINI" : provider.includes("groq")||provider.includes("llama") ? "GROQ" : provider.includes("openrouter")||provider.includes("free") ? "OPENROUTER" : provider.includes("hugging")||provider.includes("qwen")||provider.includes("hf") ? "HUGGINGFACE" : "CLAUDE";
            return (
              <div style={{ ...cardStyle, marginTop:mob?10:14, borderLeft:`3px solid ${badgeColor}`, background:`${badgeColor}08` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <span style={{ fontSize:11, fontFamily:font, color:badgeColor, letterSpacing:"0.12em", textTransform:"uppercase" }}>Análisis narrativo · IA</span>
                  <span style={{ fontSize:8, fontFamily:font, padding:"1px 6px", background:`${badgeColor}18`, color:badgeColor, border:`1px solid ${badgeColor}30` }}>{badgeLabel}</span>
                </div>
                <div style={{ fontSize:mob?12:13, color:TEXT, lineHeight:1.75, whiteSpace:"pre-wrap" }}>{displayText}</div>
              </div>
            );
          })()}
          {aiError && <div style={{ ...cardStyle, marginTop:8, color:"#dc2626", fontSize:12 }}>Error: {aiError}</div>}
        </div>
      )}

      {/* ═══ INFORME VIEW (original) ═══ */}
      {viewMode === "informe" && <>

      {/* SECTION 00: KEY POINTS */}
      <Section num="00" title="Puntos Clave del Período" id="keypoints" defaultOpen>
        <div style={gridStyle(3)}>
          {d.keyPoints.map((kp, i) => (
            <div key={i} style={{ ...cardStyle, borderLeft:`3px solid ${kp.color}` }}>
              <div style={tagStyle(kp.color)}>{kp.tag}</div>
              <div style={{ fontFamily:fontSans, fontSize:mob?13:14, fontWeight:600, color:TEXT, marginBottom:8 }}>{kp.title}</div>
              <div style={{ fontFamily:fontSans, fontSize:mob?11:12.5, color:MUTED, lineHeight:1.55 }}>{kp.text}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* SECTION 01: SÍNTESIS */}
      <Section num="01" title="Síntesis del Período" id="sintesis" defaultOpen={!hasDetail}>
        <div style={{ ...cardStyle, borderLeft:`3px solid ${ACCENT}` }}>
          <div style={{ fontFamily:fontSans, fontSize:mob?13:14, color:TEXT, lineHeight:1.7 }}>{d.sintesis}</div>
        </div>
      </Section>

      {/* SECTION 02: DINÁMICAS POR ACTOR */}
      <Section num="02" title="Dinámicas por Actor" id="actores">
        <div style={gridStyle(2)}>
          {d.actores.map((actor, i) => (
            <div key={i} style={{ ...cardStyle, borderLeft:`3px solid ${["#0468B1","#16a34a","#ca8a04","#dc2626"][i%4]}` }}>
              <div style={{ fontFamily:fontSans, fontSize:mob?13:15, fontWeight:700, color:TEXT }}>{actor.name}</div>
              {actor.items.map((item, j) => (
                <div key={j} style={{ padding:"5px 0", borderBottom: j === actor.items.length-1 ? "none" : `1px solid ${BORDER}30` }}>
                  <div style={{ fontFamily:fontSans, fontSize:mob?11:12, color:MUTED, lineHeight:1.5,
                    paddingLeft:10, borderLeft:`2px solid ${BG3}` }}>{item}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* SECTION 03: DETAIL SECTIONS (S8 only) */}
      {hasDetail && d.nacional && (
        <Section num="03" title="Dinámica Nacional — Detalle" id="nacional">
          <div style={gridStyle(2)}>
            <div style={cardStyle}>
              <div style={tagStyle("#0468B1")}>Ley de Amnistía</div>
              <div style={{ fontFamily:fontSans, fontSize:mob?13:14, fontWeight:600, color:TEXT, marginBottom:12 }}>Balance Comisión de Seguimiento</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { v:d.nacional.amnistia.solicitudes?.toLocaleString() || d.nacional.amnistia.fpDetenidos?.toLocaleString() || "—", l:d.nacional.amnistia.solicitudes ? "Solicitudes recibidas" : "Presos políticos (FP)", c:d.nacional.amnistia.solicitudes ? ACCENT : "#dc2626" },
                  { v:d.nacional.amnistia.libertadesPlenas?.toLocaleString() || "—", l:"Libertades plenas", c:"#16a34a" },
                  { v:d.nacional.amnistia.privadosLiberados?.toLocaleString() || d.nacional.amnistia.fpVerificados?.toLocaleString() || "—", l:d.nacional.amnistia.privadosLiberados ? "Privados liberados" : "Excarcelaciones verif. (FP)", c:d.nacional.amnistia.privadosLiberados ? TEXT : "#ca8a04" },
                  { v:d.nacional.amnistia.cautelares?.toLocaleString() || "—", l:"Con cautelares", c:TEXT },
                ].map((item, i) => (
                  <div key={i} style={{ background:BG3, padding:mob?10:14, textAlign:"center" }}>
                    <div style={{ fontFamily:fontSans, fontSize:mob?22:28, fontWeight:700, color:item.c }}>{item.v}</div>
                    <div style={{ fontFamily:font, fontSize:mob?8:9, letterSpacing:"0.08em", color:MUTED, textTransform:"uppercase", marginTop:4 }}>{item.l}</div>
                  </div>
                ))}
              </div>
              {d.nacional.amnistia.fpNota && (
                <div style={{ fontFamily:fontSans, fontSize:mob?10:11, color:MUTED, marginTop:10, padding:"6px 8px", background:BG3, borderLeft:`3px solid #ca8a04` }}>
                  📋 {d.nacional.amnistia.fpNota}
                </div>
              )}
              {d.nacional.amnistia.militares && (
              <div style={{ fontFamily:fontSans, fontSize:mob?10:11, color:MUTED, marginTop:10 }}>
                Excarcelación de <strong style={{ color:TEXT }}>{d.nacional.amnistia.militares} militares</strong> en el marco de la amnistía.
              </div>
              )}
            </div>
            <div style={cardStyle}>
              <div style={tagStyle(ACCENT)}>Asamblea Nacional — Jorge Rodríguez</div>
              {d.nacional.rodriguez.map((item, i) => (
                <div key={i} style={{ ...timelineItemStyle, borderBottom: i === d.nacional.rodriguez.length-1 ? "none" : `1px solid ${BORDER}40` }}>
                  <div style={tlTitleStyle}>{item.title}</div>
                  <div style={tlBodyStyle}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>
          {d.nacional.allup && (
            <div style={{ ...cardStyle, marginTop:mob?8:12, borderLeft:`3px solid #ca8a04` }}>
              <div style={{ fontFamily:fontSans, fontSize:mob?13:15, fontStyle:"italic", color:TEXT, lineHeight:1.6, padding:mob?"6px 8px":"8px 12px" }}>
                "{d.nacional.allup}"
                <div style={{ fontFamily:font, fontSize:mob?9:10, color:MUTED, marginTop:6, fontStyle:"normal" }}>— Henry Ramos Allup, AD "en resistencia"</div>
              </div>
            </div>
          )}
          {d.nacional.mcmAgenda && (
            <div style={{ ...cardStyle, marginTop:mob?8:12 }}>
              <div style={tagStyle("#16a34a")}>MCM — Agenda de tres prioridades</div>
              {d.nacional.mcmAgenda.map((item, i) => (
                <div key={i} style={{ ...timelineItemStyle, borderBottom: i === d.nacional.mcmAgenda.length-1 ? "none" : `1px solid ${BORDER}40` }}>
                  <div style={{ fontFamily:font, fontSize:9, color:ACCENT, letterSpacing:"0.1em", marginBottom:4 }}>PRIORIDAD {i+1}</div>
                  <div style={tlBodyStyle}>{item}</div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* SECTION 04: ECONOMÍA (S8 only) */}
      {hasDetail && d.economia && (
        <Section num="04" title="Economía y Petróleo" id="economia">
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr 1fr":`repeat(4, 1fr)`, gap:mob?8:12, marginBottom:mob?12:16 }}>
            {d.economia.kpis.map((kpi, i) => (
              <div key={i} style={{ ...cardStyle, textAlign:"center" }}>
                <div style={{ fontFamily:fontSans, fontSize:mob?22:28, fontWeight:700, color:kpi.color }}>{kpi.value}</div>
                <div style={{ fontFamily:font, fontSize:mob?8:9, letterSpacing:"0.08em", color:MUTED, textTransform:"uppercase", marginTop:6 }}>{kpi.label}</div>
              </div>
            ))}
          </div>
          {d.economia.empresas && (
            <div style={cardStyle}>
              <div style={tagStyle(ACCENT)}>Inversión Internacional</div>
              <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:fontSans, fontSize:mob?11:12 }}>
                <thead>
                  <tr style={{ borderBottom:`2px solid ${BORDER}` }}>
                    <th style={{ textAlign:"left", padding:"6px 8px", color:MUTED, fontWeight:500, fontSize:mob?9:10, letterSpacing:"0.1em", textTransform:"uppercase" }}>Empresa</th>
                    <th style={{ textAlign:"left", padding:"6px 8px", color:MUTED, fontWeight:500, fontSize:mob?9:10, letterSpacing:"0.1em", textTransform:"uppercase" }}>Desarrollo</th>
                  </tr>
                </thead>
                <tbody>
                  {d.economia.empresas.map((e, i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${BORDER}40` }}>
                      <td style={{ padding:"8px", color:TEXT, fontWeight:600, whiteSpace:"nowrap" }}>{e.empresa}</td>
                      <td style={{ padding:"8px", color:MUTED }}>{e.desarrollo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {/* SECTION 05: ESCENARIOS (S8 only) */}
      {hasDetail && d.escenarios && (
        <Section num="05" title="Escenarios Proyectados" id="escenarios">
          {d.escenarios.map((esc, i) => (
            <div key={i} style={{ ...cardStyle, marginBottom:mob?10:14, display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:fontSans, fontSize:mob?14:16, fontWeight:700, color:esc.color }}>{esc.name}</div>
                <div style={{ fontFamily:fontSans, fontSize:mob?11:12.5, color:MUTED, lineHeight:1.5, marginTop:4 }}>{esc.text}</div>
              </div>
              <div style={{ background:`${esc.color}12`, border:`1px solid ${esc.color}30`, padding:mob?"6px 10px":"8px 14px",
                textAlign:"center", minWidth:mob?60:80, flexShrink:0 }}>
                <div style={{ fontFamily:fontSans, fontSize:mob?14:18, fontWeight:700, color:esc.color }}>{esc.prob}</div>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* SECTION 06: COMENTARIOS (S8 only) */}
      {hasDetail && d.comentarios && (
        <Section num="06" title="Comentarios Analíticos" id="comentarios">
          <div style={gridStyle(3)}>
            {d.comentarios.map((c, i) => (
              <div key={i} style={{ ...cardStyle, borderTop:`3px solid ${c.color}` }}>
                <div style={tagStyle(c.color)}>{c.tag}</div>
                <div style={{ fontFamily:fontSans, fontSize:mob?13:14, fontWeight:600, color:TEXT, marginBottom:8 }}>{c.title}</div>
                <div style={tlBodyStyle}>{c.text}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* AI ANALYSIS within informe view */}
      {viewMode === "informe" && aiAnalysis && (() => {
        const providerMatch = aiAnalysis.match(/^\[([^\]]+)\]\n\n/);
        const provider = providerMatch ? providerMatch[1] : "claude";
        const displayText = providerMatch ? aiAnalysis.slice(providerMatch[0].length) : aiAnalysis;
        const badgeColor = provider.includes("mistral") ? "#ff6f00" : provider.includes("gemini") ? "#4285f4" : provider.includes("groq")||provider.includes("llama") ? "#f97316" : provider.includes("openrouter")||provider.includes("free") ? "#06b6d4" : provider.includes("hugging")||provider.includes("qwen")||provider.includes("hf") ? "#ffbf00" : "#8b5cf6";
        const badgeLabel = provider.includes("mistral") ? "MISTRAL" : provider.includes("gemini") ? "GEMINI" : provider.includes("groq")||provider.includes("llama") ? "GROQ" : provider.includes("openrouter")||provider.includes("free") ? "OPENROUTER" : provider.includes("hugging")||provider.includes("qwen")||provider.includes("hf") ? "HUGGINGFACE" : "CLAUDE";
        return (
        <div style={{ borderBottom:`1px solid ${BORDER}40` }}>
          <div style={{ display:"flex", alignItems:"center", gap:mob?8:12, cursor:"pointer",
            padding:mob?"12px 0":"16px 0", userSelect:"none" }} onClick={() => toggle("aianalysis")}>
            <span style={{ fontFamily:font, fontSize:mob?10:11, color:badgeColor, letterSpacing:"0.15em", opacity:0.5, minWidth:mob?24:30 }}>AI</span>
            <span style={{ fontFamily:fontSans, fontSize:mob?15:18, fontWeight:600, color:TEXT, flex:1 }}>Análisis Narrativo · Inteligencia Artificial</span>
            <span style={{ fontSize:8, fontFamily:font, padding:"1px 6px", background:`${badgeColor}18`, color:badgeColor, border:`1px solid ${badgeColor}30`, marginRight:8 }}>{badgeLabel}</span>
            <span style={{ fontSize:mob?12:14, color:MUTED, transition:"transform 0.2s", transform: expandedSection==="aianalysis" ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
          </div>
          {expandedSection === "aianalysis" && (
            <div style={{ paddingBottom:mob?16:24 }}>
              <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:mob?14:20, borderLeft:`3px solid ${badgeColor}` }}>
                <div style={{ fontSize:mob?13:14, fontFamily:fontSans, color:TEXT, lineHeight:1.75, whiteSpace:"pre-wrap" }}>{displayText}</div>
              </div>
            </div>
          )}
        </div>
        );
      })()}
      {viewMode === "informe" && aiError && <div style={{ background:BG2, border:`1px solid #dc262630`, padding:12, marginBottom:12, color:"#dc2626", fontSize:12 }}>Error IA: {aiError}</div>}

      </>}

      {/* SITREP FOOTER */}
      <div style={{ textAlign:"center", fontFamily:font, fontSize:mob?9:10, color:`${MUTED}70`,
        padding:"24px 0 8px", letterSpacing:"0.1em", textTransform:"uppercase" }}>
        PNUD Venezuela · Análisis de Contexto Situacional · {d.periodShort} · Uso interno
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INSTABILITY CHART — Interactive weekly index with MA4
// ═══════════════════════════════════════════════════════════════

function TabDashboard({ week, liveData = {}, setTab }) {
  const mob = useIsMobile();
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
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

        if (liveAlerts.length === 0) return null;

        const reds = liveAlerts.filter(a => a.level === "red");

        return (
          <div style={{ border:`1px solid ${reds.length > 0 ? "#dc262640" : "#ca8a0440"}`,
            background:reds.length > 0 ? "#dc262608" : "#ca8a0408", padding:mob?"10px 12px":"12px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:liveAlerts.length > 1 ? 8 : 0, flexWrap:"wrap" }}>
              <span style={{ fontSize:14 }}>{reds.length > 0 ? "🚨" : "⚠️"}</span>
              <span style={{ fontSize:10, fontFamily:font, letterSpacing:"0.12em", textTransform:"uppercase",
                color:reds.length > 0 ? "#dc2626" : "#ca8a04", fontWeight:700 }}>
                {liveAlerts.length} alerta{liveAlerts.length>1?"s":""} en vivo
              </span>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", animation:"pulse 1.5s infinite" }} />
              <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>Datos en tiempo real · cada 5 min</span>
            </div>
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
        const delta = prevIndex !== null ? index - prevIndex : null;

        const zone = index <= 25 ? { label:"Estabilidad relativa", color:"#16a34a" }
          : index <= 50 ? { label:"Tensión moderada", color:"#ca8a04" }
          : index <= 75 ? { label:"Inestabilidad alta", color:"#f97316" }
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
                  {index}
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
- Score: ${index}/100 (zona: ${zone.label})
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
Párrafo 1: Explica por qué el índice está en ${index}/100. Identifica los 3-4 factores que más lo impulsan al alza (protestas, cobertura territorial de protestas, brecha cambiaria, señales de colapso, etc.) y los 2-3 factores que lo contienen (probabilidades E1/E3, Brent alto si aplica, amnistía si aplica). IMPORTANTE: la cobertura territorial (${lastWeekConf?.estados || "N/D"}/24 estados) mide la extensión geográfica de las protestas, NO es un factor estabilizador — a mayor cobertura, mayor inestabilidad.

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
                  <div style={{ position:"absolute", left:`${index}%`, top:-2, transform:"translateX(-50%)", width:4, height:16,
                    background:zone.color, borderRadius:2, boxShadow:`0 0 6px ${zone.color}60`, transition:"left 0.5s" }} />
                </div>
                <div style={{ display:"flex", marginTop:3 }}>
                  {segments.map((seg,i) => (
                    <div key={i} style={{ flex:1, fontSize:8, fontFamily:font, color:index >= seg.from && index <= seg.to ? seg.color : `${MUTED}60`,
                      fontWeight:index >= seg.from && index <= seg.to ? 700 : 400, textAlign:"center" }}>
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
        const latest = AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 1];
        const prev = AMNISTIA_TRACKER.length > 1 ? AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 2] : null;
        const gobLib = latest.gob.libertades || latest.gob.excarcelados || 0;
        const fpVerif = latest.fp.verificados || 0;
        const brecha = gobLib && fpVerif ? Math.round((1 - fpVerif / gobLib) * 100) : null;
        const fpDelta = (prev?.fp?.verificados && fpVerif !== prev.fp.verificados) ? fpVerif - prev.fp.verificados : null;
        return (
          <Card>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:10, fontFamily:font, color:ACCENT, letterSpacing:"0.15em", textTransform:"uppercase" }}>
                📋 Ley de Amnistía · Tracker Dual
              </div>
              <div style={{ fontSize:9, fontFamily:font, color:MUTED }}>Act. {latest.label}</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr 1fr", gap:mob?6:8, marginBottom:12 }}>
              {[
                { v:latest.gob.solicitudes?.toLocaleString() || "—", l:"Solicitudes", sub:"Gobierno", c:ACCENT },
                { v:latest.gob.libertades?.toLocaleString() || latest.gob.excarcelados?.toLocaleString() || "—", l:"Libertades plenas", sub:"Gobierno", c:"#16a34a" },
                { v:fpVerif.toLocaleString(), l:"Excarcelaciones verif.", sub:"Foro Penal", c:"#ca8a04", delta:fpDelta },
                { v:latest.fp.detenidos?.toLocaleString() || "—", l:"Presos políticos", sub:"Foro Penal", c:"#dc2626" },
              ].map((item, i) => (
                <div key={i} style={{ background:BG3, padding:mob?8:12, textAlign:"center" }}>
                  <div style={{ fontFamily:fontSans, fontSize:mob?18:24, fontWeight:700, color:item.c }}>
                    {item.v}{item.delta != null && item.delta > 0 ? <span style={{ fontSize:11, color:"#16a34a", marginLeft:4, display:"inline" }}> +{item.delta}</span> : null}
                  </div>
                  <div style={{ fontFamily:font, fontSize:mob?7:8, letterSpacing:"0.08em", color:MUTED, textTransform:"uppercase" }}>{item.l}</div>
                  <div style={{ fontFamily:font, fontSize:mob?7:8, color:item.c, opacity:0.7 }}>{item.sub}</div>
                </div>
              ))}
            </div>
            {brecha !== null && (
              <div style={{ marginBottom:12, padding:mob?"8px 10px":"10px 14px", background:`#dc262608`, border:`1px solid #dc262620` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:11, fontFamily:font, color:"#dc2626", letterSpacing:"0.1em", textTransform:"uppercase" }}>Brecha verificación</span>
                  <span style={{ fontSize:16, fontFamily:fontSans, fontWeight:700, color:"#dc2626" }}>{brecha}%</span>
                </div>
                <div style={{ height:6, background:BORDER, borderRadius:3 }}>
                  <div style={{ height:6, borderRadius:3, background:`linear-gradient(90deg, #16a34a ${100-brecha}%, #dc2626 ${100-brecha}%)`, width:"100%" }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                  <span style={{ fontSize:9, fontFamily:font, color:"#16a34a" }}>Foro Penal: {fpVerif.toLocaleString()}</span>
                  <span style={{ fontSize:9, fontFamily:font, color:ACCENT }}>Gobierno: {gobLib.toLocaleString()}</span>
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
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 200px", gap:12 }}>

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
                <div key={j} style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6, gap:8 }}>
                  <span style={{ fontSize:13, color:"#5a8aaa", flexShrink:0 }}>{r.k}</span>
                  <span title={r.v} style={{ fontSize:13, fontFamily:font, fontWeight:500, color:r.v==="—"?`${MUTED}60`:TEXT, textAlign:"right", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", minWidth:0 }}>{r.v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Semáforo resumen */}
        <Card>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
            🚦 Señales
          </div>
          {[{label:"Verde",count:wk.sem.g,color:"green"},
            {label:"Amarillo",count:wk.sem.y,color:"yellow"},
            {label:"Rojo",count:wk.sem.r,color:"red"}
          ].map((s,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:18, fontWeight:700, fontFamily:font, color:SEM[s.color], width:24, textAlign:"right" }}>{s.count}</span>
              <span style={{ fontSize:12, color:SEM[s.color], width:46, letterSpacing:"0.06em", textTransform:"uppercase" }}>{s.label}</span>
              <div style={{ flex:1, height:5, background:BORDER, borderRadius:2 }}>
                <div style={{ height:5, background:SEM[s.color], width:`${(s.count/semTotal)*100}%`, borderRadius:2, transition:"width 0.4s" }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${BORDER}`, textAlign:"center" }}>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Dominante</div>
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


function TabCohesion({ liveData = {} }) {
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

const CohesionChart = memo(function CohesionChart({ data }) {
  const [hover, setHover] = useState(null);
  const W=700, H=280, padL=45, padR=30, padT=30, padB=32;
  const cW=W-padL-padR, cH=H-padT-padB;

  // Dynamic Y range with padding — don't waste space showing 0-60 if data is 65-82
  const scores = data.map(d => d.score);
  const dataMin = Math.min(...scores);
  const dataMax = Math.max(...scores);
  const rangePad = Math.max((dataMax - dataMin) * 0.25, 8);
  const yMin = Math.max(0, Math.floor((dataMin - rangePad) / 5) * 5); // snap to 5s
  const yMax = Math.min(100, Math.ceil((dataMax + rangePad) / 5) * 5);
  const yRange = yMax - yMin || 1;

  const toX = (i) => padL + (i / (data.length - 1)) * cW;
  const toY = (v) => padT + cH - ((v - yMin) / yRange) * cH;

  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d.score)}`).join(" ");
  const areaD = pathD + ` L${toX(data.length - 1)},${padT + cH} L${toX(0)},${padT + cH} Z`;

  // Zone bands clipped to visible range
  const zones = [
    { from: 75, to: 100, color: "#16a34a", label: "Alta" },
    { from: 50, to: 75, color: "#ca8a04", label: "Media" },
    { from: 25, to: 50, color: "#f97316", label: "Baja" },
    { from: 0, to: 25, color: "#dc2626", label: "Crítica" },
  ];

  // Grid lines at nice intervals within visible range
  const gridStep = yRange > 30 ? 10 : 5;
  const gridLines = [];
  for (let v = Math.ceil(yMin / gridStep) * gridStep; v <= yMax; v += gridStep) {
    gridLines.push(v);
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width * W;
        const idx = Math.round(((mx - padL) / cW) * (data.length - 1));
        if (idx >= 0 && idx < data.length) setHover(idx);
      }}
      onMouseLeave={() => setHover(null)}>
      {/* Zone backgrounds — clipped to visible range */}
      {zones.map(z => {
        const zTop = Math.min(z.to, yMax);
        const zBot = Math.max(z.from, yMin);
        if (zTop <= zBot) return null;
        return <rect key={z.from} x={padL} y={toY(zTop)} width={cW} height={toY(zBot) - toY(zTop)} fill={`${z.color}10`} />;
      })}
      {/* Zone labels on right edge */}
      {zones.map(z => {
        const mid = (Math.min(z.to, yMax) + Math.max(z.from, yMin)) / 2;
        if (mid < yMin || mid > yMax) return null;
        return <text key={z.label} x={padL + cW + 4} y={toY(mid) + 3} fontSize={8} fill={z.color} fontFamily={font} opacity={0.7}>{z.label}</text>;
      })}
      {/* Grid lines */}
      {gridLines.map(v => (
        <g key={v}>
          <line x1={padL} y1={toY(v)} x2={padL + cW} y2={toY(v)} stroke="rgba(0,0,0,0.06)" strokeDasharray="4 3" />
          <text x={padL - 4} y={toY(v) + 3} textAnchor="end" fontSize={9} fill={MUTED} fontFamily={font}>{v}</text>
        </g>
      ))}
      {/* Area gradient */}
      <defs>
        <linearGradient id="icgGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.20" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#icgGrad2)" />
      {/* Main line */}
      <path d={pathD} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Data points */}
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const isPrev = i === data.length - 2;
        return <circle key={i} cx={toX(i)} cy={toY(d.score)} r={isLast ? 6 : isPrev ? 4 : 3}
          fill={isLast ? ACCENT : BG2} stroke={ACCENT} strokeWidth={isLast ? 2.5 : 2} />;
      })}
      {/* Pulse on latest */}
      <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1].score)} r={10}
        fill="none" stroke={ACCENT} strokeWidth={1.5} opacity={0.3} style={{ animation: "pulse 2s ease-in-out infinite" }} />
      {/* Score label on latest point */}
      <text x={toX(data.length - 1)} y={toY(data[data.length - 1].score) - 12}
        textAnchor="middle" fontSize={11} fontWeight={700} fill={ACCENT} fontFamily={font}>
        {data[data.length - 1].score}
      </text>
      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize={9}
          fill={i === data.length - 1 ? ACCENT : MUTED} fontWeight={i === data.length - 1 ? 700 : 400} fontFamily={font}>
          {d.week}
        </text>
      ))}
      {/* Hover tooltip — smart positioning */}
      {hover != null && hover < data.length && (() => {
        const hx = toX(hover);
        const hy = toY(data[hover].score);
        const note = data[hover].note || "";
        const truncNote = note.length > 45 ? note.substring(0, 45) + "…" : note;
        const noteW = Math.max(truncNote.length * 5.5, 100);
        // Position tooltip: prefer above, but if too close to top, go below
        const above = hy - padT > 60;
        const ty = above ? hy - 28 : hy + 16;
        const noteY = above ? hy - 48 : hy + 38;
        // Clamp X to stay within chart
        const clampX = (x, w) => Math.max(padL + w / 2, Math.min(padL + cW - w / 2, x));
        return <>
          <line x1={hx} y1={padT} x2={hx} y2={padT + cH} stroke="rgba(0,0,0,0.08)" />
          <circle cx={hx} cy={hy} r={5} fill={ACCENT} stroke={BG} strokeWidth={2} />
          {/* Score badge */}
          <rect x={clampX(hx, 80) - 40} y={ty - 14} width={80} height={22} rx={4} fill={TEXT} opacity={0.92} />
          <text x={clampX(hx, 80)} y={ty + 1} textAnchor="middle" fontSize={12} fill="#fff" fontWeight={700} fontFamily={font}>
            {data[hover].week}: {data[hover].score}
          </text>
          {/* Note */}
          {truncNote && <>
            <rect x={clampX(hx, noteW + 12) - (noteW + 12) / 2} y={noteY - 12} width={noteW + 12} height={18} rx={3} fill={BG2} stroke={BORDER} opacity={0.95} />
            <text x={clampX(hx, noteW)} y={noteY + 1} textAnchor="middle" fontSize={8.5} fill={MUTED} fontFamily={font}>
              {truncNote}
            </text>
          </>}
        </>;
      })()}
    </svg>
  );
});

// ═══════════════════════════════════════════════════════════════
// REDES CHART — Chart.js multi-view (Espejo, Polarización, Convivencia, Neto, Composición)
// ═══════════════════════════════════════════════════════════════

function RedesChart({ view }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const mob = useIsMobile();

  useEffect(() => {
    let destroyed = false;
    const go = () => {
      if (destroyed || !canvasRef.current) return;
      if (!window.Chart) {
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js").then(() => { if (!destroyed) render(); });
      } else { render(); }
    };

    function render() {
      if (!canvasRef.current || destroyed) return;
      if (chartRef.current) chartRef.current.destroy();
      const labels = REDES_DATA.map(d => d.d);
      const Chart = window.Chart;
      let cfg;

      if (view === "mirror") {
        cfg = { type:"bar", data:{ labels, datasets:[
          { label:"Pol. alta", data:REDES_DATA.map(d=>d.pol.a), backgroundColor:"#dc2626", borderWidth:0, order:1 },
          { label:"Pol. moderada", data:REDES_DATA.map(d=>d.pol.m), backgroundColor:"#f59e0b80", borderWidth:0, order:2 },
          { label:"Conv. alta", data:REDES_DATA.map(d=>-d.conv.a), backgroundColor:"#16a34a", borderWidth:0, order:3 },
          { label:"Conv. moderada", data:REDES_DATA.map(d=>-d.conv.m), backgroundColor:"#5DCAA580", borderWidth:0, order:4 },
        ]}, options:{ responsive:true, maintainAspectRatio:false, interaction:{mode:"index",intersect:false},
          scales:{ x:{stacked:true,grid:{display:false},ticks:{autoSkip:true,maxTicksLimit:mob?8:14,font:{size:10},color:MUTED}},
            y:{stacked:true,grid:{color:`${BORDER}30`},ticks:{callback:v=>{const a=Math.abs(v);return a>999?(a/1000|0)+"K":a},font:{size:10},color:MUTED}}},
          plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.dataset.label+": "+Math.abs(c.raw).toLocaleString()}}}}};
      } else if (view === "polarizacion") {
        cfg = { type:"line", data:{ labels, datasets:[
          { label:"Pol. alta", data:REDES_DATA.map(d=>d.pol.a), borderColor:"#dc2626", backgroundColor:"#dc262618", fill:true, tension:.3, pointRadius:1.5, borderWidth:2 },
          { label:"Pol. moderada", data:REDES_DATA.map(d=>d.pol.m), borderColor:"#f59e0b", backgroundColor:"#f59e0b10", fill:true, tension:.3, pointRadius:1, borderWidth:1.5 },
        ]}, options:{ responsive:true, maintainAspectRatio:false, interaction:{mode:"index",intersect:false},
          scales:{ x:{grid:{display:false},ticks:{autoSkip:true,maxTicksLimit:mob?8:14,font:{size:10},color:MUTED}},
            y:{grid:{color:`${BORDER}30`},ticks:{callback:v=>v>999?(v/1000|0)+"K":v,font:{size:10},color:MUTED}}},
          plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.dataset.label+": "+c.raw.toLocaleString()}}}}};
      } else if (view === "convivencia") {
        cfg = { type:"line", data:{ labels, datasets:[
          { label:"Conv. alta", data:REDES_DATA.map(d=>d.conv.a), borderColor:"#16a34a", backgroundColor:"#16a34a18", fill:true, tension:.3, pointRadius:1.5, borderWidth:2 },
          { label:"Conv. moderada", data:REDES_DATA.map(d=>d.conv.m), borderColor:"#5DCAA5", backgroundColor:"#5DCAA510", fill:true, tension:.3, pointRadius:1, borderWidth:1.5 },
        ]}, options:{ responsive:true, maintainAspectRatio:false, interaction:{mode:"index",intersect:false},
          scales:{ x:{grid:{display:false},ticks:{autoSkip:true,maxTicksLimit:mob?8:14,font:{size:10},color:MUTED}},
            y:{grid:{color:`${BORDER}30`},ticks:{callback:v=>v>999?(v/1000|0)+"K":v,font:{size:10},color:MUTED}}},
          plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.dataset.label+": "+c.raw.toLocaleString()}}}}};
      } else if (view === "neto") {
        const net = REDES_DATA.map(d => d.pol.t > 0 ? Math.round((d.pol.a - d.conv.a) / d.pol.t * 100) : 0);
        cfg = { type:"bar", data:{ labels, datasets:[{ label:"Índice neto", data:net,
          backgroundColor:net.map(v => v > 0 ? "#dc262680" : "#16a34a80"), borderColor:net.map(v => v > 0 ? "#dc2626" : "#16a34a"), borderWidth:1 }]},
          options:{ responsive:true, maintainAspectRatio:false,
            scales:{ x:{grid:{display:false},ticks:{autoSkip:true,maxTicksLimit:mob?8:14,font:{size:10},color:MUTED}},
              y:{grid:{color:`${BORDER}30`},ticks:{callback:v=>v+"%",font:{size:10},color:MUTED}}},
            plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>"Neto: "+c.raw+"% "+(c.raw>0?"(polarización domina)":"(convivencia domina)")}}}}};
      } else if (view === "composicion") {
        const polPct = REDES_DATA.map(d => d.pol.t > 0 ? Math.round(d.pol.a/d.pol.t*100) : 0);
        const modPct = REDES_DATA.map(d => d.pol.t > 0 ? Math.round(d.pol.m/d.pol.t*100) : 0);
        const caPct = REDES_DATA.map(d => d.conv.t > 0 ? Math.round(d.conv.a/d.conv.t*100) : 0);
        const rest = REDES_DATA.map((_,i) => Math.max(0, 100 - polPct[i] - modPct[i] - caPct[i]));
        cfg = { type:"bar", data:{ labels, datasets:[
          { label:"Pol. alta %", data:polPct, backgroundColor:"#dc2626", borderWidth:0 },
          { label:"Pol. mod. %", data:modPct, backgroundColor:"#f59e0b", borderWidth:0 },
          { label:"Conv. alta %", data:caPct, backgroundColor:"#16a34a", borderWidth:0 },
          { label:"Resto", data:rest, backgroundColor:`${BORDER}40`, borderWidth:0 },
        ]}, options:{ responsive:true, maintainAspectRatio:false,
          scales:{ x:{stacked:true,grid:{display:false},ticks:{autoSkip:true,maxTicksLimit:mob?8:14,font:{size:10},color:MUTED}},
            y:{stacked:true,max:100,grid:{display:false},ticks:{callback:v=>v+"%",font:{size:9},color:MUTED}}},
          plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.dataset.label+": "+c.raw+"%"}}}}};
      }
      if (cfg) chartRef.current = new Chart(canvasRef.current, cfg);
    }
    go();
    return () => { destroyed = true; if (chartRef.current) chartRef.current.destroy(); };
  }, [view, mob]);

  return <canvas ref={canvasRef} />;
}

// ═══════════════════════════════════════════════════════════════
// TAB: CLIMA SOCIAL — Redes (Polarización/Convivencia) + Cohesión GOB
// ═══════════════════════════════════════════════════════════════

function TabClimaSocial({ liveData = {} }) {
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

function MethodologyFooter({ mob }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState(null);

  const toggle = (s) => setSection(section === s ? null : s);

  const sectionStyle = { padding:"12px 0", borderBottom:`1px solid ${BORDER}30` };
  const titleStyle = { fontSize:13, fontWeight:700, color:TEXT, cursor:"pointer", display:"flex", alignItems:"center", gap:8, userSelect:"none" };
  const bodyStyle = { fontSize:12, fontFamily:fontSans, color:MUTED, lineHeight:1.7, marginTop:8, paddingLeft:4 };

  return (
    <div style={{ borderTop:`1px solid ${BORDER}`, marginTop:8, padding:mob?"0 12px 20px":"0 20px 24px" }}>
      <div onClick={() => setOpen(!open)} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 0", cursor:"pointer", userSelect:"none" }}>
        <span style={{ fontSize:12, fontFamily:font, color:`${MUTED}60`, letterSpacing:"0.1em", textTransform:"uppercase" }}>
          {open ? "▼" : "▶"} Metodología, fuentes y cálculos
        </span>
      </div>

      {open && (
        <div style={{ maxWidth:800, margin:"0 auto" }}>

          {/* Intro */}
          <div style={{ fontSize:12, fontFamily:fontSans, color:MUTED, lineHeight:1.7, marginBottom:16, textAlign:"center", padding:"0 16px" }}>
            Este dashboard integra datos de múltiples fuentes públicas para monitorear la situación en Venezuela.
            A continuación explicamos cómo funciona cada componente, de dónde vienen los datos y cómo se calculan los índices.
          </div>

          {/* Section: Escenarios */}
          <div style={sectionStyle}>
            <div style={titleStyle} onClick={() => toggle("esc")}>
              <span>🎯</span> <span>Los 4 Escenarios</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="esc"?"▼":"▶"}</span>
            </div>
            {section==="esc" && <div style={bodyStyle}>
              El análisis se basa en <b>4 escenarios posibles</b> para Venezuela, cada uno con una probabilidad estimada que se actualiza semanalmente:<br/><br/>
              <b style={{color:"#16a34a"}}>E1 — Transición política pacífica</b>: El gobierno acepta negociaciones genuinas, se convocan elecciones con garantías, y se avanza hacia una apertura democrática.<br/><br/>
              <b style={{color:"#dc2626"}}>E2 — Colapso y fragmentación</b>: El régimen pierde control económico o político, se producen fracturas internas, y el país entra en una crisis más profunda.<br/><br/>
              <b style={{color:ACCENT}}>E3 — Continuidad negociada</b>: El gobierno mantiene el poder pero hace concesiones prácticas (energéticas, económicas) a cambio de legitimidad internacional y alivio de sanciones.<br/><br/>
              <b style={{color:"#ca8a04"}}>E4 — Resistencia coercitiva</b>: El gobierno endurece el control, aumenta la represión, y bloquea cualquier apertura real.<br/><br/>
              Las probabilidades se basan en el <b>reporte situacional semanal</b> construido por el equipo analítico del PNUD Venezuela y potenciado con inteligencia artificial. Cada semana se evalúan indicadores, señales y eventos del período para ajustar las probabilidades de cada escenario. La <b>Matriz de Escenarios</b> visualiza la posición en un mapa de 2 ejes: nivel de violencia (horizontal) y grado de cambio (vertical).
            </div>}
          </div>

          {/* Section: Índice de Inestabilidad */}
          <div style={sectionStyle}>
            <div style={titleStyle} onClick={() => toggle("idx")}>
              <span>🌡️</span> <span>Índice de Inestabilidad Compuesto</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="idx"?"▼":"▶"}</span>
            </div>
            {section==="idx" && <div style={bodyStyle}>
              Es un número de <b>0 a 100</b> que resume "qué tan inestable está la situación" combinando 19 factores diferentes. Funciona como un termómetro:<br/><br/>
              <b style={{color:"#16a34a"}}>0-25</b>: Estabilidad relativa — las cosas están relativamente calmadas.<br/>
              <b style={{color:"#ca8a04"}}>26-50</b>: Tensión moderada — hay presiones pero están contenidas.<br/>
              <b style={{color:"#f97316"}}>51-75</b>: Inestabilidad alta — múltiples factores de riesgo activos.<br/>
              <b style={{color:"#dc2626"}}>76-100</b>: Crisis inminente — situación crítica en varios frentes.<br/><br/>
              <b>¿Cómo se calcula?</b> Cada factor tiene un peso (%). Los factores de riesgo suman y los estabilizadores restan. Por ejemplo:<br/><br/>
              • Si la <b>brecha cambiaria</b> (diferencia entre dólar oficial y paralelo) es alta, el índice sube — porque indica presión económica.<br/>
              • Si el <b>precio del petróleo</b> baja mucho, el índice sube — porque Venezuela depende del petróleo para sus ingresos.<br/>
              • Si la probabilidad de <b>E1 (transición pacífica)</b> es alta, el índice baja — porque es un factor estabilizador.<br/><br/>
              <b>3 de los 19 factores se actualizan solos</b> en tiempo real (brecha cambiaria, petróleo, índice bilateral). Los demás se actualizan con cada informe semanal.
            </div>}
          </div>

          {/* Section: Bilateral */}
          <div style={sectionStyle}>
            <div style={titleStyle} onClick={() => toggle("bil")}>
              <span>🇺🇸🇻🇪</span> <span>Conflictividad Bilateral EE.UU.–Venezuela</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="bil"?"▼":"▶"}</span>
            </div>
            {section==="bil" && <div style={bodyStyle}>
              Este indicador mide <b>cuánta tensión hay entre EE.UU. y Venezuela</b> según lo que publican los medios de comunicación del mundo.<br/><br/>
              <b>¿De dónde vienen los datos?</b> De un proyecto llamado <b>PizzINT</b> que procesa datos de <b>GDELT</b> (una base de datos que analiza miles de noticias diarias en todo el mundo). Cada día, GDELT mide el "tono" de los artículos que mencionan a ambos países: si son hostiles, neutrales o positivos.<br/><br/>
              <b>¿Qué significa el número?</b> Se expresa en <b>desviaciones estándar (σ)</b> respecto al promedio histórico desde 2017. En términos simples:<br/><br/>
              • <b>0σ</b> = La relación bilateral está en su nivel normal histórico.<br/>
              • <b>1σ</b> = Hay más tensión de lo habitual.<br/>
              • <b>2σ</b> = La tensión es excepcionalmente alta (solo pasa en momentos de crisis).<br/>
              • <b>3σ+</b> = Crisis activa (como la semana del 3 de enero de 2026, cuando el índice llegó a 3.77).<br/><br/>
              Los <b>4 KPIs</b> del panel muestran: el índice actual, el sentimiento promedio de las noticias (más negativo = más hostil), cuántos artículos hablan de conflicto, y el total de artículos procesados ese día.
            </div>}
          </div>

          {/* Section: GDELT */}
          <div style={sectionStyle}>
            <div style={titleStyle} onClick={() => toggle("gdelt")}>
              <span>📡</span> <span>Medios Internacionales (GDELT)</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="gdelt"?"▼":"▶"}</span>
            </div>
            {section==="gdelt" && <div style={bodyStyle}>
              <b>GDELT</b> (Global Database of Events, Language, and Tone) es un proyecto que monitorea <b>todas las noticias del mundo</b> — miles de artículos por hora, en más de 100 idiomas. Es como tener un equipo de analistas leyendo todos los periódicos del planeta simultáneamente.<br/><br/>
              El tab <b>Medios</b> muestra 3 señales sobre Venezuela durante 120 días:<br/><br/>
              • <b style={{color:"#ff3b3b"}}>Índice de Conflicto</b>: ¿Cuántos artículos sobre Venezuela mencionan palabras como "protesta", "crisis", "violencia"? Si sube, significa que los medios están cubriendo más inestabilidad.<br/><br/>
              • <b style={{color:"#0e7490"}}>Tono Mediático</b>: ¿La cobertura es positiva o negativa? Va de -10 (muy negativo) a +2 (positivo). Venezuela suele estar en terreno negativo (-3 a -5).<br/><br/>
              • <b style={{color:"#c49000"}}>Oleada de Atención</b>: ¿Cuánto espacio le dedican los medios a Venezuela? Un pico indica un evento importante que captó la atención mundial.<br/><br/>
              Las <b>anotaciones</b> en el gráfico marcan eventos clave (ej: "Toma de posesión", "Licencia OFAC") para que puedas ver cómo impactaron la cobertura.
            </div>}
          </div>

          {/* Section: IODA */}
          <div style={sectionStyle}>
            <div style={titleStyle} onClick={() => toggle("ioda")}>
              <span>🌐</span> <span>Conectividad a Internet (IODA)</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="ioda"?"▼":"▶"}</span>
            </div>
            {section==="ioda" && <div style={bodyStyle}>
              <b>IODA</b> (Internet Outage Detection and Analysis) es un proyecto del <b>Georgia Institute of Technology</b> que detecta cortes de internet en tiempo real en todo el mundo.<br/><br/>
              <b>¿Por qué importa para Venezuela?</b> Los cortes de internet pueden indicar: censura gubernamental (bloquear acceso durante protestas), problemas de infraestructura eléctrica (apagones), o crisis económica (falta de mantenimiento en redes).<br/><br/>
              El tab <b>Internet</b> monitorea 3 señales técnicas:<br/><br/>
              • <b>BGP</b>: Mide cuántas "rutas" de internet están activas en Venezuela. Si caen muchas rutas de golpe, algo grave está pasando a nivel de infraestructura.<br/><br/>
              • <b>Active Probing</b>: Son "pings" que se envían a dispositivos en Venezuela para ver si responden. Si muchos dejan de responder, hay un corte.<br/><br/>
              • <b>Network Telescope</b>: Detecta tráfico inusual que suele aparecer cuando hay disrupciones de red.<br/><br/>
              Un <b>corte masivo</b> (las 3 señales caen al mismo tiempo) generalmente indica un apagón eléctrico nacional o una acción deliberada de censura.
            </div>}
          </div>

          {/* Section: Alertas */}
          <div style={sectionStyle}>
            <div style={titleStyle} onClick={() => toggle("alertas")}>
              <span>🚨</span> <span>Alertas en Vivo y Noticias Inteligentes</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="alertas"?"▼":"▶"}</span>
            </div>
            {section==="alertas" && <div style={bodyStyle}>
              <b>Alertas por Umbral</b>: El dashboard vigila datos económicos y geopolíticos en tiempo real. Si alguno cruza un nivel preocupante, aparece una alerta roja o amarilla arriba del todo. Por ejemplo: si la brecha cambiaria supera el 55%, es señal de presión económica seria. Estos umbrales están definidos por el equipo analítico basándose en la experiencia histórica.<br/><br/>
              <b>Alertas de Noticias</b>: Una inteligencia artificial lee los titulares más recientes sobre Venezuela (de Google News y de nuestros feeds RSS) y los clasifica automáticamente:<br/><br/>
              • 🔴 <b>Urgente</b>: Un evento que podría cambiar el rumbo de los escenarios.<br/>
              • 🟡 <b>Seguimiento</b>: Un desarrollo relevante que vale la pena monitorear.<br/>
              • 🟢 <b>Contexto</b>: Información de fondo útil para el análisis.<br/><br/>
              Cada alerta indica la <b>dimensión</b> (política, económica, internacional, DDHH, energía) y una frase corta explicando su relevancia.
            </div>}
          </div>

          {/* Section: IA */}
          <div style={sectionStyle}>
            <div style={titleStyle} onClick={() => toggle("ia")}>
              <span>🤖</span> <span>Inteligencia Artificial en el Dashboard</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="ia"?"▼":"▶"}</span>
            </div>
            {section==="ia" && <div style={bodyStyle}>
              El dashboard utiliza IA para <b>3 funciones específicas</b>:<br/><br/>
              <b>1. Daily Brief</b> (en el SITREP): Busca noticias frescas del día en Google News sobre Venezuela en 3 dimensiones (política, economía, internacional), las combina con datos en vivo del dólar y petróleo, y genera un resumen de 3-4 párrafos citando las fuentes.<br/><br/>
              <b>2. Análisis IA</b> (en el SITREP): Toma TODOS los datos del dashboard (escenarios, 28 indicadores, 32 señales, amnistía, mercados, noticias) y genera un análisis narrativo de 5-6 párrafos. Es como tener un analista que lee todo el dashboard y escribe un informe.<br/><br/>
              <b>3. Alertas de Noticias</b> (en el Dashboard): Clasifica los titulares del día por urgencia y dimensión.<br/><br/>
              <b>Importante</b>: La IA <b>no toma decisiones</b>. No mueve probabilidades ni cambia escenarios. Solo sintetiza la información disponible. Las decisiones analíticas las toma el equipo humano.<br/><br/>
              La IA usa una <b>cascada de 6 proveedores gratuitos</b> (Mistral, Gemini, Groq, OpenRouter, HuggingFace, Claude). Si uno no responde, automáticamente intenta con el siguiente. El badge de color indica cuál respondió.
            </div>}
          </div>

          {/* Section: Fuentes */}
          <div style={{ ...sectionStyle, borderBottom:"none" }}>
            <div style={titleStyle} onClick={() => toggle("fuentes")}>
              <span>📚</span> <span>Fuentes de Datos</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="fuentes"?"▼":"▶"}</span>
            </div>
            {section==="fuentes" && <div style={bodyStyle}>
              <b>Datos en tiempo real (se actualizan solos):</b><br/>
              • <b>Dólar</b>: pydolarvenezuela.org — tasa BCV y paralelo, cada 5 minutos.<br/>
              • <b>Petróleo</b>: U.S. Energy Information Administration (EIA) + OilPriceAPI — Brent, WTI, Gas Natural.<br/>
              • <b>Bilateral</b>: PizzINT/GDELT — índice de tensión EE.UU.-Venezuela, diario.<br/>
              • <b>Noticias</b>: 60+ feeds RSS de medios venezolanos e internacionales + Google News RSS.<br/><br/>
              <b>Datos analíticos (actualizados semanalmente):</b><br/>
              • <b>Escenarios y probabilidades</b>: Equipo analítico PNUD Venezuela.<br/>
              • <b>Indicadores y señales</b>: Recopilación de fuentes oficiales, Foro Penal, OVCS, FMI, SENIAT, BCV.<br/>
              • <b>Amnistía</b>: Cifras del gobierno vs verificaciones de Foro Penal.<br/><br/>
              <b>Datos de terceros (vía API):</b><br/>
              • <b>GDELT</b>: gdeltproject.org — Cobertura mediática global, financiado por Google Jigsaw.<br/>
              • <b>IODA</b>: Georgia Institute of Technology — Conectividad a internet.<br/>
              • <b>ACLED</b>: Armed Conflict Location & Event Data — Eventos de conflicto y protesta.<br/>
              • <b>Polymarket</b>: Mercados de predicción sobre Venezuela.<br/>
              • <b>OVCS</b>: Observatorio Venezolano de Conflictividad Social — Protestas mensuales.
            </div>}
          </div>

          <div style={{ textAlign:"center", fontSize:9, fontFamily:font, color:`${MUTED}40`, padding:"12px 0 4px" }}>
            Monitor de Contexto Situacional · PNUD Venezuela · Marzo 2026
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NEWS + POLYMARKET TICKER — Scrolling bar at the top
// ═══════════════════════════════════════════════════════════════

export default function MonitorPNUD() {
  const [tab, setTab] = useState("dashboard");
  const [week, setWeek] = useState(WEEKS.length - 1);
  const mob = useIsMobile();

  // ── Shared live data (fetched once, available to all tabs including AI) ──
  const [liveData, setLiveData] = useState({ dolar:null, oil:null, gdeltSummary:null, news:null, bilateral:null, cohesion:null, fetched:false });

  useEffect(() => {
    async function fetchLiveData() {
      const results = { dolar:null, oil:null, gdeltSummary:null, news:null, bilateral:null, cohesion:null, fetched:true };
      try {
        // Dolar
        const dolarUrl = IS_DEPLOYED ? "/api/dolar?type=live" : "https://ve.dolarapi.com/v1/dolares";
        const dRes = await fetch(dolarUrl, { signal:AbortSignal.timeout(8000) }).then(r=>r.ok?r.json():null).catch(()=>null);
        if (dRes && Array.isArray(dRes)) {
          const o = dRes.find(d=>d.fuente==="oficial"), p = dRes.find(d=>d.fuente==="paralelo");
          if (o?.promedio || p?.promedio) results.dolar = { bcv:o?.promedio, paralelo:p?.promedio, brecha: o?.promedio && p?.promedio ? (((p.promedio-o.promedio)/o.promedio)*100).toFixed(1)+"%" : null };
        }
      } catch {}
      try {
        // Oil prices
        const oilUrl = IS_DEPLOYED ? "/api/oil-prices" : null;
        if (oilUrl) {
          const oRes = await fetch(oilUrl, { signal:AbortSignal.timeout(12000) }).then(r=>r.ok?r.json():null).catch(()=>null);
          if (oRes) results.oil = { brent:oRes.brent?.price, wti:oRes.wti?.price, gas:oRes.natgas?.price, source:oRes.source || "unknown" };
        }
      } catch {}
      try {
        // News headlines (top 5)
        const newsUrl = IS_DEPLOYED ? "/api/news" : null;
        if (newsUrl) {
          const nRes = await fetch(newsUrl, { signal:AbortSignal.timeout(8000) }).then(r=>r.ok?r.json():null).catch(()=>null);
          if (nRes?.news?.length) results.news = nRes.news.slice(0,5).map(n => n.title || n.headline || "").filter(Boolean);
        }
      } catch {}
      try {
        // GDELT tone via proxy (avoids CORS — proxy has the data)
        const gdeltUrl = IS_DEPLOYED ? "/api/gdelt" : null;
        if (gdeltUrl) {
          const gRes = await fetch(gdeltUrl, { signal:AbortSignal.timeout(8000) }).then(r=>r.ok?r.json():null).catch(()=>null);
          if (gRes?.data?.length > 0) {
            const last7 = gRes.data.slice(-7);
            const tones = last7.map(d => d.tone).filter(v => v != null);
            const vols = last7.map(d => d.instability).filter(v => v != null);
            results.gdeltSummary = {
              tone: tones.length > 0 ? tones.reduce((a,b)=>a+b,0)/tones.length : null,
              volume: vols.length > 0 ? Math.round(vols.reduce((a,b)=>a+b,0)) : null,
            };
          }
        }
      } catch {}
      try {
        // Bilateral Threat Index (PizzINT/GDELT)
        const bilUrl = IS_DEPLOYED ? `/api/bilateral?_t=${Math.floor(Date.now()/600000)}` : null;
        if (bilUrl) {
          const bRes = await fetch(bilUrl, { signal:AbortSignal.timeout(12000) }).then(r=>r.ok?r.json():null).catch(()=>null);
          if (bRes?.latest) results.bilateral = bRes;
        }
      } catch {}
      try {
        // Government Cohesion Index (ICG) — from Supabase cache (cron saves every 8h)
        if (IS_DEPLOYED) {
          const cRes = await fetch(`/api/articles?type=icg&_t=${Math.floor(Date.now()/600000)}`, { signal:AbortSignal.timeout(6000) }).then(r=>r.ok?r.json():null).catch(()=>null);
          if (cRes?.cached && cRes.icg?.index != null) {
            const icg = cRes.icg;
            const level = icg.index >= 75 ? "ALTA" : icg.index >= 55 ? "MEDIA" : icg.index >= 35 ? "BAJA" : "CRITICA";
            const actors = (icg.actors || []).map(a => ({
              actor: a.actor?.toLowerCase().replace(/\s+/g,"").slice(0,12) || "unknown",
              name: a.actor, status: a.alignment,
              confidence: a.confidence, evidence: a.evidence, signals: a.signals || [],
              mentions: 0, tone: 0, topHeadlines: [],
            }));
            const systemic = actors.filter(a => ["psuv","chavismo","colectivo","gobernador","militar","sector"].some(s => a.name?.toLowerCase().includes(s)));
            const individual = actors.filter(a => !systemic.includes(a));
            results.cohesion = {
              index: icg.index, level, actors: individual, systemic,
              engine: `cached/${icg.provider || "cron"}`, fetchedAt: icg.date + "T06:00:00Z",
              cachedDate: icg.date, hasSitrep: true,
            };
          }
        }
      } catch {}
      setLiveData(results);

      // ── Write-back to Supabase: persist live data to fill daily_readings nulls ──
      if (IS_DEPLOYED) {
        try {
          const params = new URLSearchParams({ type: "write_reading" });
          if (results.bilateral?.latest?.v != null) params.set("bilateral_v", results.bilateral.latest.v.toFixed(2));
          // ICG is NOT written back from frontend — cron is the authoritative source
          if (results.gdeltSummary?.tone != null) params.set("gdelt_tone", results.gdeltSummary.tone.toFixed(2));
          if (results.gdeltSummary?.volume != null) params.set("gdelt_volume", results.gdeltSummary.volume);
          if (results.dolar?.brecha) params.set("brecha", parseFloat(results.dolar.brecha).toFixed(1));
          if (results.dolar?.paralelo) params.set("paralelo", results.dolar.paralelo);
          if (results.oil?.brent) params.set("brent", results.oil.brent);
          if (results.oil?.wti) params.set("wti", results.oil.wti);
          // Only write if we have at least 2 data points (avoid writing empty rows)
          const fieldCount = [...params.entries()].filter(([k]) => k !== "type").length;
          if (fieldCount >= 2) {
            fetch(`/api/socioeconomic?${params.toString()}`, { signal: AbortSignal.timeout(5000) }).catch(() => {});
          }
        } catch {}
      }
    }
    fetchLiveData();
    // Auto-refresh every 5 min — pause when tab not visible
    let iv3 = setInterval(fetchLiveData, 300000);
    const onVis3 = () => {
      clearInterval(iv3);
      if (document.visibilityState === "visible") {
        fetchLiveData(); // refresh immediately when tab becomes visible
        iv3 = setInterval(fetchLiveData, 300000);
      }
    };
    document.addEventListener("visibilitychange", onVis3);
    return () => { clearInterval(iv3); document.removeEventListener("visibilitychange", onVis3); };
  }, []);

  // Google Translate init
  useEffect(() => {
    if (window.googleTranslateElementInit) return;
    window.googleTranslateElementInit = function() {
      new window.google.translate.TranslateElement({
        pageLanguage: 'es',
        includedLanguages: 'es,en,fr,pt',
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false,
      }, 'google_translate_element');
    };
    loadScript('//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit');
  }, []);

  return (
    <div style={{ fontFamily:fontSans, background:BG, minHeight:"100vh", color:TEXT, overflowX:"hidden" }}>
      {/* Loading splash — shown until liveData finishes first fetch */}
      {!liveData.fetched && (
        <div style={{ position:"fixed", inset:0, zIndex:99999, background:BG, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:0 }}>
          {/* Animated pixel art PNUD logo — builds itself piece by piece */}
          <div style={{ marginBottom:20, position:"relative" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="72" height="100" shapeRendering="crispEdges">
              <style>{`
                .px { opacity:0; animation: pxIn 0.15s ease forwards; }
                .gl { animation: glowPx 2s ease-in-out infinite alternate; }
                @keyframes pxIn { from { opacity:0; transform:scale(0); } to { opacity:1; transform:scale(1); } }
                @keyframes glowPx { 0% { filter:brightness(1); } 100% { filter:brightness(1.3); } }
                @keyframes globeSpin { 0% { transform:translateX(0); } 50% { transform:translateX(2px); } 100% { transform:translateX(0); } }
              `}</style>
              {/* Blue background - fades in first */}
              <rect width="32" height="22" fill={ACCENT} className="px" style={{animationDelay:"0s"}} />
              <rect y="23" width="15" height="10" fill={ACCENT} className="px" style={{animationDelay:"0.05s"}} />
              <rect x="17" y="23" width="15" height="10" fill={ACCENT} className="px" style={{animationDelay:"0.1s"}} />
              <rect y="34" width="15" height="10" fill={ACCENT} className="px" style={{animationDelay:"0.15s"}} />
              <rect x="17" y="34" width="15" height="10" fill={ACCENT} className="px" style={{animationDelay:"0.2s"}} />
              {/* Separators */}
              <rect y="22" width="32" height="1" fill="#e8ecf0" className="px" style={{animationDelay:"0.25s"}} />
              <rect y="33" width="32" height="1" fill="#e8ecf0" className="px" style={{animationDelay:"0.25s"}} />
              {/* Globe outer ring - draws clockwise */}
              {[
                [11,2,10,1],[9,3,2,1],[21,3,2,1],[8,4,1,1],[23,4,1,1],
                [7,5,1,3],[24,5,1,3],[7,8,1,3],[24,8,1,3],[7,11,1,3],[24,11,1,3],
                [8,14,1,1],[23,14,1,1],[9,15,2,1],[21,15,2,1],[11,16,10,1],
              ].map(([x,y,w,h],i) => (
                <rect key={`g${i}`} x={x} y={y} width={w} height={h} fill="white" className="px gl"
                  style={{animationDelay:`${0.3 + i*0.04}s`}} />
              ))}
              {/* Cross lines - appear after globe */}
              <rect x="15" y="3" width="2" height="14" fill="white" opacity="0.5" className="px" style={{animationDelay:"0.95s"}} />
              <rect x="8" y="9" width="16" height="1" fill="white" opacity="0.5" className="px" style={{animationDelay:"1.0s"}} />
              {/* Inner ring */}
              {[[13,4,6,1],[12,5,1,1],[19,5,1,1],[11,6,1,2],[20,6,1,2],[11,10,1,2],[20,10,1,2],[12,13,1,1],[19,13,1,1],[13,14,6,1]].map(([x,y,w,h],i) => (
                <rect key={`ir${i}`} x={x} y={y} width={w} height={h} fill="white" opacity="0.4" className="px"
                  style={{animationDelay:`${1.05 + i*0.03}s`}} />
              ))}
              {/* Laurel leaves - sprout outward */}
              {[[5,5],[4,6],[4,8],[4,11],[5,13],[26,5],[27,6],[27,8],[27,11],[26,13]].map(([x,y],i) => (
                <rect key={`l${i}`} x={x} y={y} width="1" height={y===6||y===8||y===11?2:1} fill="white" opacity="0.6" className="px"
                  style={{animationDelay:`${1.35 + i*0.05}s`}} />
              ))}
              {/* P N U D letters - type in one by one */}
              {/* P */}
              {[[3,25,1,6],[4,25,3,1],[7,25,1,3],[4,28,3,1]].map(([x,y,w,h],i) => (
                <rect key={`p${i}`} x={x} y={y} width={w} height={h} fill="white" className="px"
                  style={{animationDelay:`${1.9 + i*0.06}s`}} />
              ))}
              {/* N */}
              {[[20,25,1,6],[21,26,1,1],[22,27,1,1],[23,28,1,1],[24,29,1,1],[25,25,1,6]].map(([x,y,w,h],i) => (
                <rect key={`n${i}`} x={x} y={y} width={w} height={h} fill="white" className="px"
                  style={{animationDelay:`${2.2 + i*0.06}s`}} />
              ))}
              {/* U */}
              {[[3,36,1,6],[9,36,1,6],[4,41,5,1]].map(([x,y,w,h],i) => (
                <rect key={`u${i}`} x={x} y={y} width={w} height={h} fill="white" className="px"
                  style={{animationDelay:`${2.6 + i*0.08}s`}} />
              ))}
              {/* D */}
              {[[20,36,1,6],[21,36,3,1],[24,37,1,4],[21,41,3,1]].map(([x,y,w,h],i) => (
                <rect key={`d${i}`} x={x} y={y} width={w} height={h} fill="white" className="px"
                  style={{animationDelay:`${2.85 + i*0.06}s`}} />
              ))}
            </svg>
          </div>
          {/* Title - appears after logo finishes building */}
          <div style={{ fontSize:28, fontWeight:900, fontFamily:"'Playfair Display',serif", color:ACCENT,
            letterSpacing:"0.02em", opacity:0, animation:"slideDown 0.5s ease 3.2s forwards", textAlign:"center", padding:"0 20px" }}>
            Monitor de Contexto Situacional
          </div>
          <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.2em", textTransform:"uppercase",
            marginTop:4, opacity:0, animation:"slideDown 0.5s ease 3.4s forwards", textAlign:"center" }}>
            Venezuela 2026
          </div>
          {/* Progress bar */}
          <div style={{ width:200, height:3, background:`${BORDER}30`, borderRadius:2, marginTop:20, overflow:"hidden",
            opacity:0, animation:"fadeIn 0.3s ease 3.5s forwards" }}>
            <div style={{ width:"100%", height:"100%", background:`linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
              animation:"shimmer 1.2s ease infinite" }} />
          </div>
          <div style={{ marginTop:10, fontSize:10, fontFamily:font, color:MUTED, opacity:0,
            animation:"fadeIn 0.3s ease 3.6s forwards" }}>
            <span style={{ animation:"pulse 1.5s infinite" }}>Cargando datos en vivo...</span>
          </div>
        </div>
      )}
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(100%); } }
        .goog-te-banner-frame, .skiptranslate > iframe { display:none !important; }
        body { top:0 !important; margin:0; overflow-x:hidden; }
        html { overflow-x:hidden; }
        .goog-te-gadget { font-family:${font} !important; font-size:0 !important; }
        .goog-te-gadget .goog-te-combo { font-family:${font}; font-size:11px; background:${BG2}; border:1px solid ${BORDER}; color:${ACCENT};
          padding:5px 10px; cursor:pointer; outline:none; border-radius:4px; }
        .goog-te-gadget > span { display:none !important; }
        #google_translate_element { display:inline-block; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${BORDER}; border-radius:3px; }
        svg { max-width:100%; }
        @media (max-width:768px) {
          .leaflet-container { height:300px !important; }
          table { font-size:11px; }
          svg text { font-size:9px !important; }
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,700;0,900;1,400&display=swap" rel="stylesheet" />

      {/* TICKER BAR */}
      <NewsTicker />

      {/* HEADER */}
      <div style={{ borderBottom:`2px solid ${ACCENT}`, padding:mob?"10px 12px":"12px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", background:BG2, boxShadow:"0 1px 4px rgba(0,0,0,0.08)", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:mob?8:14 }}>
          <img src={PNUD_LOGO} alt="PNUD" style={{ height:mob?28:36 }} />
          <div>
            <div style={{ fontSize:mob?12:16, fontWeight:600, color:TEXT, letterSpacing:"0.02em" }}>{mob?"Monitor Venezuela 2026":"Monitor de Contexto Situacional · Venezuela 2026"}</div>
            {!mob && <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.08em" }}>Programa de las Naciones Unidas para el Desarrollo</div>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:mob?6:10, flexWrap:"wrap" }}>
          {!mob && <div id="google_translate_element" />}
          <select value={week} onChange={e => setWeek(+e.target.value)}
            style={{ fontFamily:font, fontSize:mob?11:13, background:BG2, border:`1px solid ${BORDER}`, color:ACCENT,
              padding:mob?"4px 22px 4px 6px":"5px 28px 5px 10px", cursor:"pointer", outline:"none",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%230A97D9'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 6px center" }}>
            {WEEKS.map((w,i) => <option key={i} value={i}>{w.label}</option>)}
          </select>
          {!mob && <Badge color={week===WEEKS.length-1?"#22c55e":MUTED}>{week===WEEKS.length-1?"Más reciente":"Archivo"}</Badge>}
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ display:"flex", alignItems:"center", gap:0, padding:mob?"0 8px":"0 24px", background:BG2, borderBottom:`1px solid ${BORDER}`, overflowX:"auto", boxShadow:"0 1px 2px rgba(0,0,0,0.04)", WebkitOverflowScrolling:"touch" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ fontFamily:font, fontSize:mob?9:11, letterSpacing:"0.08em", textTransform:"uppercase",
              padding:mob?"10px 8px":"12px 16px", background:"transparent",
              border:"none", borderBottom:tab===t.id?`3px solid ${ACCENT}`:"3px solid transparent",
              color:tab===t.id?ACCENT:MUTED, fontWeight:tab===t.id?700:400, cursor:"pointer", transition:"all 0.15s",
              whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:mob?3:6 }}>
            <span style={{ fontSize:mob?12:15 }}>{t.icon}</span>
            {mob ? null : t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth:1340, margin:"0 auto", padding:mob?"12px 10px 40px":"24px 24px 60px" }}>
        {tab === "dashboard" && <TabDashboard week={week} liveData={liveData} setTab={setTab} />}
        {tab === "sitrep" && <TabSitrep liveData={liveData} />}
        {tab === "matriz" && <TabMatriz week={week} setWeek={setWeek} />}
        {tab === "monitor" && <TabMonitor />}
        {tab === "clima" && <TabClimaSocial liveData={liveData} />}
        {tab === "gdelt" && <TabGdelt />}
        {tab === "conflictividad" && <TabConflictividad />}
        {tab === "ioda" && <TabIODA />}
        {tab === "mercados" && <TabMercados />}
        {tab === "macro" && <TabMacro />}
      </div>

      {/* FOOTER + METHODOLOGY */}
      <div style={{ textAlign:"center", fontSize:12, fontFamily:font, color:`${MUTED}60`, padding:"8px 0 4px", letterSpacing:"0.1em", textTransform:"uppercase" }}>
        PNUD Venezuela · Monitor Situacional · Uso interno · {WEEKS[week].label}
      </div>
      <MethodologyFooter mob={useIsMobile()} />
    </div>
  );
}
