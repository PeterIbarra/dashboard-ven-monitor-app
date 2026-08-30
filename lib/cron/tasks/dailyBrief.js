// ═══════════════════════════════════════════════════════════════
// DAILY BRIEF — AI-generated situational email via Resend
// Task: /api/cron?task=dailyBrief
// Schedule: 11:00 UTC (7:00 AM VET) via cron-job.org
// NOTE: without a verified domain, Resend sandbox only delivers to the
// email address the Resend account was created with (RESEND_ACCOUNT_EMAIL).
// Peter forwards the brief manually to the rest of the team from there.
// ═══════════════════════════════════════════════════════════════

const { SUPABASE_URL, SUPABASE_SECRET, FEEDS } = require("../config");
const { callAICascade } = require("../ai");
const { getFrontendSnapshot } = require("../frontendData");
const { getConectividad, getConflictividad, getSismos, getAmbiental } = require("../liveContext");

// ── Supabase helper ──
async function sbQuery(table, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const r = await fetch(url, {
    headers: { apikey: SUPABASE_SECRET, Authorization: `Bearer ${SUPABASE_SECRET}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) return [];
  return r.json();
}

// ── Date helpers ──
function fmtDate(d) {
  return new Date(d).toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function iso24hAgo() {
  return new Date(Date.now() - 86400000).toISOString();
}

// ── Main task ──
async function sendDailyBrief(errors) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const RECIPIENTS = (process.env.DAILY_BRIEF_TO || "").split(",").map(e => e.trim()).filter(Boolean);

  if (!RESEND_KEY) { errors.push("RESEND_API_KEY not configured"); return { sent: false, reason: "no_key" }; }
  if (RECIPIENTS.length === 0) { errors.push("DAILY_BRIEF_TO not configured"); return { sent: false, reason: "no_recipients" }; }

  const today = new Date().toISOString().slice(0, 10);
  const fecha = fmtDate(new Date());

  // ═══ 1. FETCH ALL DATA FROM SUPABASE + FUENTES EN VIVO ═══
  const [readings, rates, alertRows, headlines, icgRows, prevBriefs, conectividad, conflictividad, sismos, ambiental] = await Promise.allSettled([
    sbQuery("daily_readings", "select=*&order=date.desc&limit=2"),
    sbQuery("rates", "select=*&order=date.desc&limit=2"),
    sbQuery("news_alerts", `select=*&order=classified_at.desc&limit=1`),
    sbQuery("articles", `select=title,link,description,source,dims,published_at&order=published_at.desc&limit=60&published_at=gte.${iso24hAgo()}`),
    sbQuery("daily_readings", "select=icg_score,icg_actors,date&icg_score=not.is.null&order=date.desc&limit=1"),
    sbQuery("daily_briefs", "select=date,risk_level,summary,created_at&order=created_at.desc&limit=5"),
    getConectividad(),
    getConflictividad(),
    getSismos(),
    getAmbiental(),
  ]);

  // Contexto SITREP estático (escenarios E1-E4, KPIs energético, amnistía) — se lee
  // directo de src/data/*.js, siempre sincronizado con el último ciclo SITREP.
  const snapshot = getFrontendSnapshot();

  const rd = readings.status === "fulfilled" ? readings.value : [];
  const rt = rates.status === "fulfilled" ? rates.value : [];
  const al = alertRows.status === "fulfilled" ? alertRows.value : [];
  const hl = headlines.status === "fulfilled" ? headlines.value : [];
  const icg = icgRows.status === "fulfilled" && icgRows.value.length > 0 ? icgRows.value[0] : null;
  const prevBriefRows = prevBriefs.status === "fulfilled" ? prevBriefs.value : [];
  const conn = conectividad.status === "fulfilled" ? conectividad.value : { ok: false, topStates: [] };
  const conf = conflictividad.status === "fulfilled" ? conflictividad.value : { ok: false, count: null, events: [], daysSinceLastEvent: null };
  const quakes = sismos.status === "fulfilled" ? sismos.value : { ok: false, count: 0, events: [] };
  const ambient = ambiental.status === "fulfilled" ? ambiental.value : { ok: false, count: 0, significant: false };

  const r0 = rd[0] || {}; // today or latest
  const r1 = rd[1] || {}; // yesterday
  const rate0 = rt[0] || {};
  const rate1 = rt[1] || {};

  // Parse news alerts (stored as JSON string)
  let parsedAlerts = [];
  try {
    if (al[0]?.alerts) parsedAlerts = typeof al[0].alerts === "string" ? JSON.parse(al[0].alerts) : al[0].alerts;
  } catch {}

  // Parse ICG actores (stored as JSON string)
  let icgActors = [];
  try {
    if (icg?.icg_actors) icgActors = typeof icg.icg_actors === "string" ? JSON.parse(icg.icg_actors) : icg.icg_actors;
  } catch {}
  const icgTension = icgActors.filter(a => a.alignment === "TENSION");

  // Escenario dominante (E1-E4) de la última semana SITREP
  const latestWeek = snapshot.latestWeek;
  const scenarioNames = Object.fromEntries((snapshot.scenarios || []).map(s => [s.id, s.name]));
  let dominantScenario = null;
  if (latestWeek?.probs?.length) {
    const dom = latestWeek.probs.reduce((max, p) => (p.v > (max?.v ?? -1) ? p : max), null);
    dominantScenario = dom ? { sc: dom.sc, name: scenarioNames[dom.sc] || `E${dom.sc}`, v: dom.v, trend: dom.t } : null;
  }

  // Amnistía — última semana
  const amn = snapshot.latestAmnistia;

  // Comparativa de riesgo día a día (busca el registro más reciente que NO sea el de hoy)
  const RISK_RANK = { BAJO: 1, MEDIO: 2, ALTO: 3, "CRÍTICO": 4 };
  const yesterdayBrief = prevBriefRows.find(r => r.date !== today);
  const yesterdayRisk = yesterdayBrief?.risk_level || null;

  // Envío(s) anterior(es) de HOY MISMO (si el brief corre más de una vez al día,
  // ej. mañana + mediodía) — se le pasa a la IA para que no repita literalmente
  // el mismo resumen/enfoque en cada envío sucesivo del mismo día.
  const lastTodayBrief = prevBriefRows.find(r => r.date === today && r.summary) || null;

  // Índice de Inestabilidad Compuesto (dashboard, 25 factores) — escrito por el
  // frontend cada vez que alguien tiene el dashboard abierto (src/lib/instabilityIndex.js
  // vía App.jsx). Puede faltar/estar desactualizado si nadie lo abrió recientemente;
  // en ese caso simplemente no actúa como piso del riesgo del día.
  const instabilityIndex = Number.isFinite(r0.instability_index) ? r0.instability_index : null;
  const instabilityZone = idx => idx <= 25 ? "BAJO" : idx <= 50 ? "MEDIO" : idx <= 75 ? "ALTO" : "CRÍTICO";

  // Nota de confiabilidad de medios: cuántas fuentes (de las configuradas) produjeron
  // al menos un artículo en las últimas 24h
  const distinctSources = new Set(hl.map(h => h.source)).size;
  const totalFeeds = Array.isArray(FEEDS) ? FEEDS.length : null;

  // Titulares agrupados por dimensión (dims ya viene clasificado desde la ingesta RSS)
  const DIM_LABELS = { politico: "Político", economico: "Económico", social: "Social", energetico: "Energético", internacional: "Internacional", seguridad: "Seguridad", ambiental: "Ambiental" };
  const groupedHeadlines = {};
  for (const h of hl.slice(0, 30)) {
    const dims = Array.isArray(h.dims) && h.dims.length > 0 ? h.dims : ["otros"];
    const primaryDim = dims[0];
    if (!groupedHeadlines[primaryDim]) groupedHeadlines[primaryDim] = [];
    if (groupedHeadlines[primaryDim].length < 4) groupedHeadlines[primaryDim].push(h);
  }

  // ═══ 2. BUILD CONTEXT STRING ═══
  const deltaBcv = rate0.bcv && rate1.bcv ? (rate0.bcv - rate1.bcv).toFixed(2) : "—";
  const deltaPar = rate0.paralelo && rate1.paralelo ? (rate0.paralelo - rate1.paralelo).toFixed(2) : "—";
  const toneLabel = r0.gdelt_tone < -3 ? "NEGATIVO ELEVADO" : r0.gdelt_tone > 1 ? "POSITIVO" : "NEUTRO-MIXTO";

  const alertsText = parsedAlerts.slice(0, 8).map(a =>
    `[${a.hierarchy || a.tag || "NAC"}] ${a.title || a.titular} — ${a.source || a.fuente}`
  ).join("\n") || "Sin alertas clasificadas";

  const headlinesText = hl.slice(0, 15).map(h =>
    `• ${h.title} [${h.source}]`
  ).join("\n") || "Sin headlines recientes";

  const icgActorsText = icgActors.length > 0
    ? icgActors.map(a => `${a.actor}: ${a.alignment}${a.confidence ? ` (${Math.round(a.confidence * 100)}% confianza)` : ""}`).join("\n")
    : "Sin datos de actores";

  const conectividadText = conn.ok
    ? `Eventos de conectividad nacional (24h): ${conn.nationalEventCount} | Estados con alertas críticas: ${conn.affectedStateCount}\n` +
      (conn.topStates.length > 0
        ? `Estados afectados: ${conn.topStates.map(s => `${s.name} (${s.criticalCount} alertas críticas)`).join(", ")}`
        : "Sin estados con alertas críticas en las últimas 24h")
    : "Sin datos de IODA disponibles";

  const confSemanal = snapshot.latestConfSemanal;
  const conflictividadText = `Tab Conflictividad (${confSemanal?.week || "semanal"}, ${confSemanal?.label || "—"}): ${confSemanal ? `${confSemanal.protestas} protestas en ${confSemanal.estados} estados, ${confSemanal.reprimidas || 0} reprimidas. Motivos: ${(confSemanal.motivos || []).join(", ")}. ${confSemanal.hecho || ""}` : "Sin datos"}\n` +
    (conf.ok
      ? `ACLED (últimos 7 días, vivo): ${conf.count}${conf.daysSinceLastEvent != null ? ` — dato más reciente cargado hace ${conf.daysSinceLastEvent} días (ACLED actualiza semanalmente, no es necesariamente de hoy)` : ""}` +
        (conf.events.length > 0 ? `\n${conf.events.map(e => `• ${e.type} en ${e.location} (${e.date?.slice(0, 10)})${e.fatalities > 0 ? ` — ${e.fatalities} fallecidos` : ""}`).join("\n")}` : "")
      : "ACLED: sin datos disponibles");

  const ambientalText = ambient.ok
    ? `Focos de calor VIIRS (24h, nacional): ${ambient.count}${ambient.significant ? " — ACTIVIDAD SIGNIFICATIVA" : ""}` +
      (ambient.byState.length > 0 ? `\nPor estado: ${ambient.byState.map(s => `${s.name} (${s.count})`).join(", ")}` : "") +
      (ambient.rainByState.length > 0 ? `\nLluvia acumulada 7d ≥100mm: ${ambient.rainByState.map(s => `${s.name} (${s.acum7d}mm)`).join(", ")}` : "")
    : "Sin datos de FIRMS disponibles";

  const sismosText = quakes.ok && quakes.count > 0
    ? quakes.events.map(e => `M${e.mag} — ${e.place || "ubicación no especificada"} (${e.time ? new Date(e.time).toISOString().slice(0, 10) : "—"}) [${e.source}]`).join("\n")
    : "Sin sismos M≥4.0 registrados en los últimos 7 días";

  const prompt = `Eres un analista senior del PNUD Venezuela. Genera un DAILY SITUATIONAL BRIEF para ${fecha}.

═══ ESCENARIO PROSPECTIVO DOMINANTE (contexto fijo, ciclo SITREP ${latestWeek?.short || "—"}) ═══
${dominantScenario ? `${dominantScenario.name} (E${dominantScenario.sc}) al ${dominantScenario.v}%` : "Sin datos de escenario disponibles"}
NOTA: esto es contexto de fondo de la semana, NO lo repitas como si fuera noticia del día — solo úsalo para enmarcar el análisis político si es relevante.

═══ ÍNDICE DE INESTABILIDAD COMPUESTO (dashboard, 25 factores, en vivo) ═══
${instabilityIndex != null ? `${instabilityIndex}/100 (${instabilityZone(instabilityIndex)})` : "Sin dato reciente — nadie tuvo el dashboard abierto en las últimas horas"}
IMPORTANTE: tu "riesgoDelDia" NUNCA puede ser más bajo que el nivel de este índice cuando esté disponible (0-25 BAJO, 26-50 MEDIO, 51-75 ALTO, 76-100 CRÍTICO) — sí puede ser más alto si el resto del contexto del día lo amerita. Esto se revisa automáticamente después de tu respuesta, pero decide ya alineado con el índice.

${lastTodayBrief ? `═══ BRIEF ANTERIOR DE HOY (enviado ${new Date(lastTodayBrief.created_at).toLocaleTimeString("es-VE", { timeZone: "America/Caracas", hour: "2-digit", minute: "2-digit", hour12: false })} VET, riesgo ${lastTodayBrief.risk_level || "—"}) ═══
"${(lastTodayBrief.summary || "").slice(0, 400)}"
IMPORTANTE: este es el mismo día. NO copies ni parafrasees este resumen anterior. Si la situación no cambió sustancialmente, dilo explícitamente ("sin cambios sustanciales desde el envío de las HH:MM") y en su lugar profundiza en secciones que el brief anterior no cubrió. Si algo sí cambió, destácalo primero.

` : ""}═══ MERCADOS ═══
Dólar BCV: ${rate0.bcv || "—"} Bs | Paralelo: ${rate0.paralelo || "—"} Bs | Brecha: ${rate0.brecha ? rate0.brecha.toFixed(1) + "%" : "—"}
Variación BCV: ${deltaBcv} Bs | Variación Paralelo: ${deltaPar} Bs
Brent: $${r0.brent || "—"} | WTI: $${r0.wti || "—"} | Gas Natural: $${r0.natgas || "—"}

═══ GDELT MEDIA (7d) ═══
Tono promedio: ${r0.gdelt_tone || "—"} (${toneLabel}) | Volumen: ${r0.gdelt_volume || "—"} artículos

═══ ÍNDICE BILATERAL EE.UU.-VEN ═══
${r0.bilateral_v ? `Valor: ${r0.bilateral_v}σ (${r0.bilateral_v > 1 ? "TENSIÓN" : "NORMAL"})` : "Sin datos"}

═══ ICG (Cohesión de Gobierno) — actores ═══
${icg ? `Score compuesto: ${icg.icg_score}/100 (${icg.date})` : "Sin datos recientes"}
${icgActorsText}

═══ CONECTIVIDAD Y ELECTRICIDAD (IODA, 24h) ═══
${conectividadText}

═══ CONFLICTIVIDAD Y PROTESTAS (ACLED, 7 días) ═══
${conflictividadText}

═══ SISMOS (USGS/EMSC, últimos 7 días, M≥4.0) ═══
${sismosText}

═══ AMBIENTAL (NASA FIRMS, 24h) ═══
${ambientalText}

═══ ALERTAS CLASIFICADAS (últimas 24h) ═══
${alertsText}

═══ HEADLINES RSS (últimas 24h) ═══
${headlinesText}

═══ INSTRUCCIONES ═══
Produce ÚNICAMENTE un objeto JSON válido. Sin backticks, sin markdown, sin texto antes ni después.
IMPORTANTE: Cada valor debe ser una sola línea sin saltos de línea internos. No uses comillas dobles dentro de los valores.
{
  "resumen": "Párrafo de 80-120 palabras con valoración general del día",
  "mercados": "Párrafo de 60-80 palabras sobre dólar, petróleo e impacto fiscal",
  "politico": "Párrafo de 60-80 palabras sobre dinámica política interna, considerando cohesión de gobierno (ICG) si hay tensión relevante",
  "internacional": "Párrafo de 60-80 palabras sobre geopolítica y relación bilateral",
  "social": "Párrafo de 40-60 palabras sobre conflictividad, clima social, y afectación de conectividad/electricidad si es relevante",
  "alertas": ["Alerta 1 en una línea corta", "Alerta 2", "Alerta 3", "Alerta 4", "Alerta 5"],
  "riesgoDelDia": "BAJO o MEDIO o ALTO o CRÍTICO",
  "razonRiesgo": "Una línea explicativa del nivel de riesgo"
}

REGLAS:
- Usa SOLO los datos proporcionados. NO inventes hechos ni fuentes.
- Cita fuentes entre corchetes [Fuente] cuando sea posible.
- Tono: cable diplomático, profesional. Sin bullet points en los párrafos.
- Si no hay datos en alguna dimensión, escribe "Sin novedades significativas en las últimas 24 horas."
- Las alertas deben ser las 5 más relevantes, no más.
- Si hay sismos significativos o focos de calor significativos, NO los narres en los párrafos — se muestran aparte automáticamente.
- SÍNTESIS OBLIGATORIA: no te concentres solo en los 2-3 temas más dramáticos (ej. apagones, tensión interna, acuerdo petrolero, presos políticos) repitiéndolos en cada sección. Cada sección de la lista de abajo tiene su bloque de datos correspondiente arriba — si ese bloque trae información sustantiva, "resumen" debe reflejarla aunque sea brevemente:
  · Mercados → dólar/brecha/petróleo
  · Político → ICG (actores en tensión, si los hay) y Escenario Prospectivo (solo como marco, no como noticia)
  · Internacional → GDELT (tono/volumen) e Índice Bilateral
  · Social → Conflictividad/ACLED y Conectividad/Electricidad (IODA)
  Si un bloque no trae nada relevante, sáltalo sin forzarlo — pero no ignores un bloque que sí trae datos solo por seguir el mismo ángulo del día anterior.
- "razonRiesgo" debe nombrar los 1-2 factores concretos que más pesaron HOY (puede ser distinto factor que ayer aunque el nivel de riesgo no cambie) — evita repetir la misma frase genérica de envíos anteriores si los datos ya evolucionaron.`;

  // ═══ 3. AI SYNTHESIS ═══
  // Temperatura algo más alta que el default (0.3) usado para clasificación de
  // alertas: acá buscamos que envíos sucesivos del mismo día (mañana/mediodía)
  // no salgan casi idénticos cuando los datos subyacentes apenas cambiaron.
  const aiResult = await callAICascade(prompt, 1200, 0.55);
  if (!aiResult) {
    errors.push("Daily Brief: AI cascade failed — no provider responded");
    return { sent: false, reason: "ai_failed" };
  }

  let brief;
  try {
    let cleaned = aiResult.text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
    // Extract JSON object if wrapped in extra text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];
    // Fix common Mistral issues: unescaped newlines inside string values
    cleaned = cleaned.replace(/\n\s*/g, " ").replace(/\r/g, "");
    // Fix unescaped quotes inside values (between key-value pairs)
    cleaned = cleaned.replace(/(?<=:\s*"[^"]{10,})"(?=[^,:}\]]*[a-záéíóúñ])/gi, '\\"');
    brief = JSON.parse(cleaned);
  } catch (e1) {
    // Fallback: extract fields with regex
    try {
      const t = aiResult.text;
      const extract = (key) => {
        const rx = new RegExp(`"${key}"\\s*:\\s*"([^"]*(?:\\\\"[^"]*)*)"`, "s");
        const m = t.replace(/\n/g, " ").match(rx);
        return m ? m[1].replace(/\\"/g, '"') : "";
      };
      const extractArr = (key) => {
        const rx = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]`, "s");
        const m = t.replace(/\n/g, " ").match(rx);
        if (!m) return [];
        return m[1].match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, "")) || [];
      };
      brief = {
        resumen: extract("resumen") || t.substring(0, 500),
        mercados: extract("mercados"),
        politico: extract("politico"),
        internacional: extract("internacional"),
        social: extract("social"),
        alertas: extractArr("alertas"),
        riesgoDelDia: extract("riesgoDelDia") || "MEDIO",
        razonRiesgo: extract("razonRiesgo") || "Análisis generado con extracción parcial",
      };
      if (!brief.resumen && !brief.mercados) throw new Error("No fields extracted");
    } catch (e2) {
      errors.push(`Daily Brief: JSON parse failed — ${e1.message}`);
      brief = {
        resumen: aiResult.text.substring(0, 500),
        mercados: "", politico: "", internacional: "", social: "",
        alertas: [], riesgoDelDia: "MEDIO", razonRiesgo: "Análisis disponible en formato texto"
      };
    }
  }

  // ═══ 3b. PISO DE RIESGO — Índice de Inestabilidad del dashboard ═══
  // La IA decide libremente, pero nunca puede reportar un riesgo MÁS BAJO que el
  // que ya muestra el dashboard. Si su nivel queda por debajo, se sube al piso del
  // índice y se deja constancia (se muestra en el email y se loguea en Supabase).
  let riskFloor = null;
  if (instabilityIndex != null) {
    const floorLevel = instabilityZone(instabilityIndex);
    const aiRank = RISK_RANK[brief.riesgoDelDia] || RISK_RANK.MEDIO;
    const floorRank = RISK_RANK[floorLevel];
    if (floorRank > aiRank) {
      riskFloor = { from: brief.riesgoDelDia, to: floorLevel, index: instabilityIndex };
      brief.riesgoDelDia = floorLevel;
    }
  }

  // ═══ 4. RENDER HTML EMAIL ═══
  const riskColors = { BAJO: "#22c55e", MEDIO: "#ca8a04", ALTO: "#f97316", "CRÍTICO": "#dc2626" };
  const riskColor = riskColors[brief.riesgoDelDia] || "#ca8a04";
  const riskDots = { BAJO: "●○○○", MEDIO: "●●○○", ALTO: "●●●○", "CRÍTICO": "●●●●" };

  let riskDelta = "";
  if (yesterdayRisk && RISK_RANK[yesterdayRisk] && RISK_RANK[brief.riesgoDelDia]) {
    const diff = RISK_RANK[brief.riesgoDelDia] - RISK_RANK[yesterdayRisk];
    riskDelta = diff > 0 ? `↑ subió desde ${yesterdayRisk} ayer` : diff < 0 ? `↓ bajó desde ${yesterdayRisk} ayer` : `= igual que ayer (${yesterdayRisk})`;
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:640px;margin:0 auto;background:#0d1117;color:#e6edf3;">

  <!-- HEADER -->
  <div style="background:#161b22;padding:20px 24px;border-bottom:2px solid #30363d;">
    <div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#8b949e;">🇻🇪 Monitor de Contexto Situacional</div>
    <div style="font-size:20px;font-weight:700;color:#e6edf3;margin-top:4px;">Daily Brief</div>
    <div style="font-size:13px;color:#8b949e;margin-top:2px;">${fecha} · PNUD Venezuela</div>
  </div>

  <!-- RISK LEVEL -->
  <div style="padding:16px 24px;background:#161b22;border-bottom:1px solid #30363d;">
    <div style="display:flex;align-items:center;">
      <span style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8b949e;margin-right:12px;">Nivel de Riesgo</span>
      <span style="font-size:18px;letter-spacing:4px;color:${riskColor};">${riskDots[brief.riesgoDelDia] || "●●○○"}</span>
      <span style="font-size:15px;font-weight:700;color:${riskColor};margin-left:12px;">${brief.riesgoDelDia || "MEDIO"}</span>
      ${riskDelta ? `<span style="font-size:12px;color:#8b949e;margin-left:10px;">${riskDelta}</span>` : ""}
    </div>
    <div style="font-size:12px;color:#8b949e;margin-top:4px;">${brief.razonRiesgo || ""}</div>
    ${instabilityIndex != null ? `<div style="font-size:11px;color:#6e7681;margin-top:6px;">Índice de Inestabilidad (dashboard, 25 factores): <span style="color:#c9d1d9;font-weight:600;">${instabilityIndex}/100</span>${riskFloor ? ` — <span style="color:${riskColor};">ajustado desde ${riskFloor.from} al piso del índice</span>` : ""}</div>` : ""}
  </div>

  <!-- ALERTAS PRIORITARIAS (subida arriba, junto al riesgo) -->
  ${brief.alertas && brief.alertas.length > 0 ? `
  <div style="padding:16px 24px;background:#1a1216;border-bottom:1px solid #30363d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#dc2626;margin-bottom:8px;">Alertas Prioritarias</div>
    ${brief.alertas.map((a, i) => `<div style="font-size:12px;color:#c9d1d9;padding:4px 0;${i > 0 ? "border-top:1px solid #2d1a1e;" : ""}">${i === 0 ? "🔴" : "🟡"} ${a}</div>`).join("")}
  </div>` : ""}

  <!-- RESUMEN -->
  <div style="padding:20px 24px;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#58a6ff;margin-bottom:8px;">Resumen del Día</div>
    <div style="font-size:14px;color:#e6edf3;line-height:1.6;">${brief.resumen || "Sin resumen disponible."}</div>
  </div>

  <!-- MONITOREO DE MEDIOS (titulares crudos, agrupados por dimensión, sin narrar por IA) -->
  ${hl.length > 0 ? `
  <div style="padding:16px 24px;background:#161b22;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#8b949e;margin-bottom:2px;">Monitoreo de Medios (últimas 24h)</div>
    ${totalFeeds ? `<div style="font-size:10px;color:#484f58;margin-bottom:10px;">${distinctSources}/${totalFeeds} fuentes con contenido en el período</div>` : ""}
    ${Object.entries(groupedHeadlines).map(([dim, arts]) => `
    <div style="margin-bottom:10px;">
      <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#58a6ff;margin-bottom:4px;">${DIM_LABELS[dim] || dim}</div>
      ${arts.map(a => `
      <div style="padding:4px 0;">
        <a href="${a.link || "https://dashboard-ven-monitor-app.vercel.app"}" style="font-size:12px;color:#c9d1d9;text-decoration:none;">${a.title}</a>
        <span style="color:#484f58;font-size:11px;"> [${a.source}]</span>
        ${a.description ? `<div style="font-size:11px;color:#6e7681;margin-top:1px;line-height:1.4;">${a.description.slice(0, 140)}${a.description.length > 140 ? "…" : ""}</div>` : ""}
      </div>`).join("")}
    </div>`).join("")}
  </div>` : ""}

  <!-- ESCENARIO PROSPECTIVO (contexto fijo, no narrado por IA) -->
  ${dominantScenario ? `
  <div style="padding:12px 24px;border-bottom:1px solid #21262d;">
    <div style="font-size:12px;color:#8b949e;">
      Escenario dominante (${latestWeek?.short || "SITREP"}): <span style="color:#e6edf3;font-weight:600;">E${dominantScenario.sc} · ${dominantScenario.name}</span>
      <span style="color:#8b949e;margin-left:8px;">${dominantScenario.v}%${dominantScenario.trend === "up" ? " ↑" : dominantScenario.trend === "down" ? " ↓" : ""}</span>
    </div>
  </div>` : ""}

  <!-- MERCADOS -->
  <div style="padding:16px 24px;background:#161b22;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#ca8a04;margin-bottom:8px;">Mercados</div>
    <div style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:10px;">
      <div style="font-size:12px;color:#8b949e;">BCV <span style="color:#e6edf3;font-weight:600;">${rate0.bcv || "—"} Bs</span></div>
      <div style="font-size:12px;color:#8b949e;">Paralelo <span style="color:#e6edf3;font-weight:600;">${rate0.paralelo || "—"} Bs</span></div>
      <div style="font-size:12px;color:#8b949e;">Brecha <span style="color:${rate0.brecha > 50 ? "#dc2626" : "#ca8a04"};font-weight:600;">${rate0.brecha ? rate0.brecha.toFixed(1) + "%" : "—"}</span></div>
      <div style="font-size:12px;color:#8b949e;">Brent <span style="color:#e6edf3;font-weight:600;">$${r0.brent || "—"}</span></div>
      <div style="font-size:12px;color:#8b949e;">WTI <span style="color:#e6edf3;font-weight:600;">$${r0.wti || "—"}</span></div>
    </div>
    <div style="font-size:13px;color:#c9d1d9;line-height:1.5;">${brief.mercados || "Sin novedades significativas."}</div>
  </div>

  <!-- ENERGÉTICO (KPIs semanales, contexto fijo) -->
  ${snapshot.kpisLatest?.energia?.length ? `
  <div style="padding:16px 24px;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#f59e0b;margin-bottom:8px;">Energético (${latestWeek?.short || "semanal"})</div>
    <div style="display:flex;flex-wrap:wrap;gap:16px;">
      ${snapshot.kpisLatest.energia.map(k => `<div style="font-size:12px;color:#8b949e;">${k.k} <span style="color:${k.c || "#e6edf3"};font-weight:600;">${k.v}</span></div>`).join("")}
    </div>
  </div>` : ""}

  <!-- POLÍTICO -->
  ${brief.politico ? `
  <div style="padding:16px 24px;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#58a6ff;margin-bottom:8px;">Político</div>
    <div style="font-size:13px;color:#c9d1d9;line-height:1.5;">${brief.politico}</div>
  </div>` : ""}

  <!-- ICG -->
  ${icg ? `
  <div style="padding:12px 24px;background:#161b22;border-bottom:1px solid #21262d;">
    <div style="font-size:12px;color:#8b949e;">
      ICG (Cohesión de Gobierno): <span style="color:#e6edf3;font-weight:600;">${icg.icg_score}/100</span>
      <span style="color:#8b949e;margin-left:8px;">${icg.date}</span>
    </div>
    ${icgTension.length > 0 ? `<div style="font-size:11px;color:#f97316;margin-top:4px;">Actores en tensión: ${icgTension.map(a => a.actor).join(", ")}</div>` : ""}
  </div>` : ""}

  <!-- INTERNACIONAL -->
  ${brief.internacional ? `
  <div style="padding:16px 24px;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#22c55e;margin-bottom:8px;">Internacional</div>
    <div style="font-size:13px;color:#c9d1d9;line-height:1.5;">${brief.internacional}</div>
  </div>` : ""}

  <!-- SOCIAL -->
  ${brief.social && brief.social !== "Sin novedades significativas en las últimas 24 horas." ? `
  <div style="padding:16px 24px;background:#161b22;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#f97316;margin-bottom:8px;">Social</div>
    <div style="font-size:13px;color:#c9d1d9;line-height:1.5;">${brief.social}</div>
  </div>` : ""}

  <!-- CONECTIVIDAD Y ELECTRICIDAD (IODA — cobertura de los 24 estados, no solo nacional) -->
  ${conn.ok && (conn.nationalEventCount > 0 || conn.affectedStateCount > 0) ? `
  <div style="padding:16px 24px;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#eab308;margin-bottom:8px;">Conectividad y Electricidad (24h)</div>
    <div style="font-size:12px;color:#8b949e;">Eventos nacionales: <span style="color:#e6edf3;font-weight:600;">${conn.nationalEventCount}</span> · Estados con alertas críticas: <span style="color:#e6edf3;font-weight:600;">${conn.affectedStateCount}</span></div>
    ${conn.topStates.length > 0 ? `<div style="font-size:12px;color:#c9d1d9;margin-top:6px;">${conn.topStates.map(s => `${s.name} (${s.criticalCount})`).join(" · ")}</div>` : ""}
    <a href="https://dashboard-ven-monitor-app.vercel.app/?tab=ioda" style="font-size:11px;color:#58a6ff;text-decoration:none;display:inline-block;margin-top:6px;">Ver tab Conectividad →</a>
  </div>` : ""}

  <!-- CONFLICTIVIDAD (tab semanal del dashboard + ACLED en vivo) -->
  ${confSemanal || (conf.ok && conf.count > 0) ? `
  <div style="padding:16px 24px;background:#161b22;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#dc2626;margin-bottom:8px;">Conflictividad</div>
    ${confSemanal ? `
    <div style="font-size:12px;color:#8b949e;margin-bottom:6px;">Tab semanal (${confSemanal.week}, ${confSemanal.label}): <span style="color:#e6edf3;font-weight:600;">${confSemanal.protestas} protestas</span> en ${confSemanal.estados} estados${confSemanal.reprimidas ? `, ${confSemanal.reprimidas} reprimidas` : ""}</div>
    ${confSemanal.motivos?.length ? `<div style="font-size:11px;color:#6e7681;margin-bottom:8px;">Motivos: ${confSemanal.motivos.join(", ")}</div>` : ""}
    ` : ""}
    ${conf.ok && conf.count > 0 ? `
    <div style="font-size:12px;color:#8b949e;margin-bottom:4px;border-top:1px solid #21262d;padding-top:8px;">ACLED en vivo (7 días): <span style="color:#e6edf3;font-weight:600;">${conf.count}</span> eventos${conf.daysSinceLastEvent != null ? ` <span style="color:#484f58;">· más reciente: hace ${conf.daysSinceLastEvent}d (carga semanal)</span>` : ""}</div>
    ${conf.events.map(e => `<div style="font-size:12px;color:#c9d1d9;padding:3px 0;">${e.type} — ${e.location}${e.fatalities > 0 ? ` <span style="color:#dc2626;">(${e.fatalities} fallecidos)</span>` : ""}</div>`).join("")}
    ` : ""}
    <a href="https://dashboard-ven-monitor-app.vercel.app/?tab=conflictividad" style="font-size:11px;color:#58a6ff;text-decoration:none;display:inline-block;margin-top:6px;">Ver tab Conflictividad →</a>
  </div>` : ""}

  <!-- SISMOS (últimos 7 días, M≥4.0) -->
  ${quakes.ok && quakes.count > 0 ? `
  <div style="padding:16px 24px;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#a855f7;margin-bottom:8px;">Sismos (últimos 7 días, M≥4.0)</div>
    ${quakes.events.map(e => `<div style="font-size:12px;color:#c9d1d9;padding:3px 0;">M${e.mag} — ${e.place || "ubicación no especificada"} <span style="color:#8b949e;">${e.time ? new Date(e.time).toLocaleDateString("es-VE", { day: "numeric", month: "short" }) : ""} · [${e.source}]</span></div>`).join("")}
    <a href="https://dashboard-ven-monitor-app.vercel.app/?tab=sismos" style="font-size:11px;color:#58a6ff;text-decoration:none;display:inline-block;margin-top:6px;">Ver tab Sismos →</a>
  </div>` : ""}

  <!-- AMBIENTAL (incendios por estado + lluvias por estado) -->
  ${ambient.ok && (ambient.significant || ambient.rainByState.length > 0) ? `
  <div style="padding:16px 24px;background:#161b22;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#f97316;margin-bottom:8px;">Ambiental</div>
    ${ambient.significant ? `
    <div style="font-size:12px;color:#8b949e;">Focos de calor (24h, NASA FIRMS): <span style="color:#e6edf3;font-weight:600;">${ambient.count}</span></div>
    ${ambient.byState.length > 0 ? `<div style="font-size:12px;color:#c9d1d9;margin-top:4px;">${ambient.byState.map(s => `${s.name} (${s.count})`).join(" · ")}</div>` : ""}
    ` : ""}
    ${ambient.rainByState.length > 0 ? `
    <div style="font-size:12px;color:#8b949e;margin-top:${ambient.significant ? "10px" : "0"};">Lluvia acumulada 7d ≥100mm (Open-Meteo):</div>
    <div style="font-size:12px;color:#c9d1d9;margin-top:4px;">${ambient.rainByState.map(s => `${s.name} (${s.acum7d}mm)`).join(" · ")}</div>
    ` : ""}
    <a href="https://dashboard-ven-monitor-app.vercel.app/?tab=ambiental" style="font-size:11px;color:#58a6ff;text-decoration:none;display:inline-block;margin-top:6px;">Ver tab Ambiental →</a>
  </div>` : ""}

  <!-- AMNISTÍA -->
  ${amn ? `
  <div style="padding:12px 24px;border-bottom:1px solid #21262d;">
    <div style="font-size:12px;color:#8b949e;">
      Amnistía (${amn.week}): Gobierno <span style="color:#e6edf3;font-weight:600;">${amn.gob?.libertades ?? amn.gob?.excarcelados ?? "—"}</span>
      <span style="margin-left:8px;">Foro Penal verificados <span style="color:#e6edf3;font-weight:600;">${amn.fp?.verificados ?? "—"}</span></span>
    </div>
  </div>` : ""}

  <!-- GDELT -->
  <div style="padding:12px 24px;border-bottom:1px solid #21262d;">
    <div style="font-size:12px;color:#8b949e;">
      GDELT Tono: <span style="color:${r0.gdelt_tone < -3 ? "#dc2626" : r0.gdelt_tone > 1 ? "#22c55e" : "#ca8a04"};font-weight:600;">${r0.gdelt_tone || "—"}</span>
      <span style="color:#8b949e;margin-left:12px;">Volumen: ${r0.gdelt_volume || "—"} artículos</span>
      ${r0.bilateral_v ? `<span style="color:#8b949e;margin-left:12px;">Bilateral: ${r0.bilateral_v}σ</span>` : ""}
    </div>
  </div>

  <!-- FOOTER -->
  <div style="padding:20px 24px;text-align:center;">
    <a href="https://dashboard-ven-monitor-app.vercel.app" style="color:#58a6ff;font-size:13px;text-decoration:none;">Ver dashboard completo →</a>
    <div style="font-size:10px;color:#484f58;margin-top:12px;line-height:1.4;">
      Generado automáticamente · ${aiResult.provider || "AI"} · ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC<br>
      Monitor de Contexto Situacional · PNUD Venezuela 2026
    </div>
  </div>

</div>
</body></html>`;

  // ═══ 5. SEND VIA RESEND ═══
  // Sandbox mode (no verified domain): sender MUST be onboarding@resend.dev,
  // and Resend will only deliver to the email address that owns the API key.
  const fromName = process.env.DAILY_BRIEF_FROM_NAME || "Monitor PNUD Venezuela";
  const fromEmail = process.env.DAILY_BRIEF_FROM || "onboarding@resend.dev";
  const horaVet = new Date().toLocaleTimeString("es-VE", { timeZone: "America/Caracas", hour: "2-digit", minute: "2-digit", hour12: false });
  const subject = `🇻🇪 Daily Brief — ${today} ${horaVet} | Monitor de Contexto PNUD Venezuela`;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: RECIPIENTS,
      subject,
      html,
    }),
    signal: AbortSignal.timeout(15000),
  });

  const resendBody = await resendRes.text().catch(() => "");
  if (!resendRes.ok) {
    errors.push(`Resend: ${resendRes.status} — ${resendBody}`);
    return { sent: false, reason: "resend_error", status: resendRes.status, detail: resendBody };
  }

  let resendJson = {};
  try { resendJson = JSON.parse(resendBody); } catch {}

  // ═══ 6. LOG TO SUPABASE ═══
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/daily_briefs`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SECRET, Authorization: `Bearer ${SUPABASE_SECRET}`,
        "Content-Type": "application/json", Prefer: "return=minimal",
      },
      body: JSON.stringify({
        date: today,
        risk_level: brief.riesgoDelDia || "MEDIO",
        summary: brief.resumen || "",
        alerts: brief.alertas || [],
        provider: aiResult.provider,
        sent_to: RECIPIENTS,
        instability_index: instabilityIndex,
      }),
    });
  } catch (e) {
    errors.push(`Brief log: ${e.message}`);
  }

  return {
    sent: true,
    risk: brief.riesgoDelDia,
    riskFloorApplied: riskFloor,
    instabilityIndex,
    recipients: RECIPIENTS.length,
    provider: aiResult.provider,
    emailId: resendJson.id || null,
  };
}

module.exports = { sendDailyBrief };
