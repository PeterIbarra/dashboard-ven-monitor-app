import { useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { WEEKS } from "../../data/weekly.js";
import { INDICATORS, SCENARIO_SIGNALS } from "../../data/indicators.js";
import { SCENARIOS } from "../../data/static.js";
import { SITREP_ALL } from "../../data/sitrep.js";
import { AMNISTIA_TRACKER } from "../../data/amnistia.js";
import { BG2, BG3, BORDER, TEXT, MUTED, ACCENT, SEM, font, fontSans } from "../../constants";
import { IS_DEPLOYED, loadScript } from "../../utils";

export function TabSitrep({ liveData = {} }) {
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

      {/* SECTION 05: MARCO NORMATIVO (if available) */}
      {hasDetail && d.marcoNormativo && (
        <Section num="05" title="Marco Normativo" id="normativo">
          {d.marcoNormativo.titulo && (
            <div style={{ ...cardStyle, borderTop:`3px solid ${ACCENT}` }}>
              <div style={tagStyle(ACCENT)}>Reforma en curso</div>
              <div style={{ fontFamily:fontSans, fontSize:mob?15:17, fontWeight:700, color:TEXT, marginBottom:8 }}>{d.marcoNormativo.titulo}</div>
              {d.marcoNormativo.resumen && <div style={{ fontFamily:fontSans, fontSize:mob?12:13, color:MUTED, lineHeight:1.6, marginBottom:12 }}>{d.marcoNormativo.resumen}</div>}
            </div>
          )}
          {d.marcoNormativo.cambios && d.marcoNormativo.cambios.length > 0 && (
            <div style={gridStyle(mob ? 1 : 2)}>
              {d.marcoNormativo.cambios.map((c, i) => (
                <div key={i} style={{ ...cardStyle, borderLeft:`3px solid ${c.color || ACCENT}` }}>
                  <div style={{ fontFamily:fontSans, fontSize:mob?13:14, fontWeight:600, color:TEXT, marginBottom:4 }}>{c.titulo}</div>
                  <div style={tlBodyStyle}>{c.texto}</div>
                </div>
              ))}
            </div>
          )}
          {d.marcoNormativo.comparativa && d.marcoNormativo.comparativa.length > 0 && (
            <div style={cardStyle}>
              <div style={tagStyle("#ca8a04")}>Cuadro Comparativo</div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:fontSans, fontSize:mob?11:12 }}>
                  <thead>
                    <tr style={{ borderBottom:`2px solid ${BORDER}` }}>
                      <th style={{ textAlign:"left", padding:"6px 8px", color:MUTED, fontWeight:500, fontSize:mob?9:10, letterSpacing:"0.1em", textTransform:"uppercase" }}>Dimensión</th>
                      <th style={{ textAlign:"left", padding:"6px 8px", color:MUTED, fontWeight:500, fontSize:mob?9:10, letterSpacing:"0.1em", textTransform:"uppercase" }}>{d.marcoNormativo.comparativaHeaders?.[0] || "Anterior"}</th>
                      <th style={{ textAlign:"left", padding:"6px 8px", color:MUTED, fontWeight:500, fontSize:mob?9:10, letterSpacing:"0.1em", textTransform:"uppercase" }}>{d.marcoNormativo.comparativaHeaders?.[1] || "Reforma"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.marcoNormativo.comparativa.map((row, i) => (
                      <tr key={i} style={{ borderBottom:`1px solid ${BORDER}40` }}>
                        <td style={{ padding:"6px 8px", fontWeight:600, color:TEXT }}>{row.dim}</td>
                        <td style={{ padding:"6px 8px", color:MUTED }}>{row.antes}</td>
                        <td style={{ padding:"6px 8px", color:ACCENT, fontWeight:500 }}>{row.despues}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {d.marcoNormativo.lecturaAnalitica && (
            <div style={{ ...cardStyle, borderLeft:`3px solid #ca8a04`, background:"rgba(234,179,8,0.04)" }}>
              <div style={{ fontFamily:fontSans, fontSize:mob?11:12, color:"#92400e", fontStyle:"italic", lineHeight:1.6 }}>
                📋 <strong>Lectura analítica:</strong> {d.marcoNormativo.lecturaAnalitica}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* SECTION 06: ESCENARIOS (S8+) */}
      {hasDetail && d.escenarios && (
        <Section num="06" title="Escenarios Proyectados" id="escenarios">
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
        <Section num="07" title="Comentarios Analíticos" id="comentarios">
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
