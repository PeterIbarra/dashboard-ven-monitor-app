// ═══════════════════════════════════════════════════════════════
// DAILY BRIEF — AI-generated situational email via Resend
// Task: /api/cron?task=dailyBrief
// Schedule: 11:00 UTC (7:00 AM VET) via cron-job.org
// ═══════════════════════════════════════════════════════════════

const { SUPABASE_URL, SUPABASE_SECRET } = require("../config");
const { callAICascade } = require("../ai");

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

  // ═══ 1. FETCH ALL DATA FROM SUPABASE ═══
  const [readings, rates, alertRows, headlines, icgRows] = await Promise.allSettled([
    sbQuery("daily_readings", "select=*&order=date.desc&limit=2"),
    sbQuery("rates", "select=*&order=date.desc&limit=2"),
    sbQuery("news_alerts", `select=*&order=classified_at.desc&limit=1`),
    sbQuery("articles", `select=title,source,published_at&order=published_at.desc&limit=20&published_at=gte.${iso24hAgo()}`),
    sbQuery("daily_readings", "select=icg_score,icg_actors,date&icg_score=not.is.null&order=date.desc&limit=1"),
  ]);

  const rd = readings.status === "fulfilled" ? readings.value : [];
  const rt = rates.status === "fulfilled" ? rates.value : [];
  const al = alertRows.status === "fulfilled" ? alertRows.value : [];
  const hl = headlines.status === "fulfilled" ? headlines.value : [];
  const icg = icgRows.status === "fulfilled" && icgRows.value.length > 0 ? icgRows.value[0] : null;

  const r0 = rd[0] || {}; // today or latest
  const r1 = rd[1] || {}; // yesterday
  const rate0 = rt[0] || {};
  const rate1 = rt[1] || {};

  // Parse news alerts (stored as JSON string)
  let parsedAlerts = [];
  try {
    if (al[0]?.alerts) parsedAlerts = typeof al[0].alerts === "string" ? JSON.parse(al[0].alerts) : al[0].alerts;
  } catch {}

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

  const prompt = `Eres un analista senior del PNUD Venezuela. Genera un DAILY SITUATIONAL BRIEF para ${fecha}.

═══ MERCADOS ═══
Dólar BCV: ${rate0.bcv || "—"} Bs | Paralelo: ${rate0.paralelo || "—"} Bs | Brecha: ${rate0.brecha ? rate0.brecha.toFixed(1) + "%" : "—"}
Variación BCV: ${deltaBcv} Bs | Variación Paralelo: ${deltaPar} Bs
Brent: $${r0.brent || "—"} | WTI: $${r0.wti || "—"} | Gas Natural: $${r0.natgas || "—"}

═══ GDELT MEDIA (7d) ═══
Tono promedio: ${r0.gdelt_tone || "—"} (${toneLabel}) | Volumen: ${r0.gdelt_volume || "—"} artículos

═══ ÍNDICE BILATERAL EE.UU.-VEN ═══
${r0.bilateral_v ? `Valor: ${r0.bilateral_v}σ (${r0.bilateral_v > 1 ? "TENSIÓN" : "NORMAL"})` : "Sin datos"}

═══ ICG (Cohesión de Gobierno) ═══
${icg ? `Score: ${icg.icg_score}/100 (${icg.date})` : "Sin datos recientes"}

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
  "politico": "Párrafo de 60-80 palabras sobre dinámica política interna",
  "internacional": "Párrafo de 60-80 palabras sobre geopolítica y relación bilateral",
  "social": "Párrafo de 40-60 palabras sobre conflictividad y clima social",
  "alertas": ["Alerta 1 en una línea corta", "Alerta 2", "Alerta 3"],
  "riesgoDelDia": "BAJO o MEDIO o ALTO o CRÍTICO",
  "razonRiesgo": "Una línea explicativa del nivel de riesgo"
}

REGLAS:
- Usa SOLO los datos proporcionados. NO inventes hechos ni fuentes.
- Cita fuentes entre corchetes [Fuente] cuando sea posible.
- Tono: cable diplomático, profesional. Sin bullet points en los párrafos.
- Si no hay datos en alguna dimensión, escribe "Sin novedades significativas en las últimas 24 horas."
- Las alertas deben ser las 3 más relevantes, no más.`;

  // ═══ 3. AI SYNTHESIS ═══
  const aiResult = await callAICascade(prompt, 1200);
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

  // ═══ 4. RENDER HTML EMAIL ═══
  const riskColors = { BAJO: "#22c55e", MEDIO: "#ca8a04", ALTO: "#f97316", "CRÍTICO": "#dc2626" };
  const riskColor = riskColors[brief.riesgoDelDia] || "#ca8a04";
  const riskDots = { BAJO: "●○○○", MEDIO: "●●○○", ALTO: "●●●○", "CRÍTICO": "●●●●" };

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
    </div>
    <div style="font-size:12px;color:#8b949e;margin-top:4px;">${brief.razonRiesgo || ""}</div>
  </div>

  <!-- RESUMEN -->
  <div style="padding:20px 24px;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#58a6ff;margin-bottom:8px;">Resumen del Día</div>
    <div style="font-size:14px;color:#e6edf3;line-height:1.6;">${brief.resumen || "Sin resumen disponible."}</div>
  </div>

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

  <!-- POLÍTICO -->
  ${brief.politico ? `
  <div style="padding:16px 24px;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#58a6ff;margin-bottom:8px;">Político</div>
    <div style="font-size:13px;color:#c9d1d9;line-height:1.5;">${brief.politico}</div>
  </div>` : ""}

  <!-- INTERNACIONAL -->
  ${brief.internacional ? `
  <div style="padding:16px 24px;background:#161b22;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#22c55e;margin-bottom:8px;">Internacional</div>
    <div style="font-size:13px;color:#c9d1d9;line-height:1.5;">${brief.internacional}</div>
  </div>` : ""}

  <!-- SOCIAL -->
  ${brief.social && brief.social !== "Sin novedades significativas en las últimas 24 horas." ? `
  <div style="padding:16px 24px;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#f97316;margin-bottom:8px;">Social</div>
    <div style="font-size:13px;color:#c9d1d9;line-height:1.5;">${brief.social}</div>
  </div>` : ""}

  <!-- ALERTAS -->
  ${brief.alertas && brief.alertas.length > 0 ? `
  <div style="padding:16px 24px;background:#161b22;border-bottom:1px solid #21262d;">
    <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#dc2626;margin-bottom:8px;">Alertas Prioritarias</div>
    ${brief.alertas.map((a, i) => `<div style="font-size:12px;color:#c9d1d9;padding:4px 0;${i > 0 ? "border-top:1px solid #21262d;" : ""}">${i === 0 ? "🔴" : "🟡"} ${a}</div>`).join("")}
  </div>` : ""}

  <!-- ICG -->
  ${icg ? `
  <div style="padding:12px 24px;border-bottom:1px solid #21262d;">
    <div style="font-size:12px;color:#8b949e;">
      ICG (Cohesión de Gobierno): <span style="color:#e6edf3;font-weight:600;">${icg.icg_score}/100</span>
      <span style="color:#8b949e;margin-left:8px;">${icg.date}</span>
    </div>
  </div>` : ""}

  <!-- GDELT -->
  <div style="padding:12px 24px;background:#161b22;border-bottom:1px solid #21262d;">
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
  const fromAddr = process.env.DAILY_BRIEF_FROM || "onboarding@resend.dev";
  const subject = `🇻🇪 Daily Brief — ${today} | Riesgo: ${brief.riesgoDelDia || "MEDIO"}`;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: fromAddr,
      to: RECIPIENTS,
      subject,
      html,
    }),
    signal: AbortSignal.timeout(10000),
  });

  const resendBody = await resendRes.json().catch(() => ({}));
  if (!resendRes.ok) {
    errors.push(`Resend: ${resendRes.status} — ${JSON.stringify(resendBody)}`);
    return { sent: false, reason: "resend_error", status: resendRes.status, detail: resendBody };
  }

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
      }),
    });
  } catch (e) {
    errors.push(`Brief log: ${e.message}`);
  }

  return {
    sent: true,
    risk: brief.riesgoDelDia,
    recipients: RECIPIENTS.length,
    provider: aiResult.provider,
    emailId: resendBody.id || null,
  };
}

module.exports = { sendDailyBrief };
