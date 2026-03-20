const { SUPABASE_URL, SUPABASE_SECRET } = require("../config");
const { callAICascade } = require("../ai");

async function classifyNewsAlerts(errors) {
  // 1. Fetch recent articles from Supabase (last 8h)
  const since = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
  const articlesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?type=eq.news&published_at=gte.${since}&order=published_at.desc&limit=40`,
    { headers: { apikey: SUPABASE_SECRET, Authorization: `Bearer ${SUPABASE_SECRET}` }, signal: AbortSignal.timeout(8000) }
  );
  let articles = [];
  if (articlesRes.ok) articles = await articlesRes.json();

  // 2. Also try Google News RSS for fresh headlines
  let googleHeadlines = [];
  try {
    const gRes = await fetch("https://news.google.com/rss/search?q=venezuela&hl=es-419&gl=VE&ceid=VE:es-419", {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "PNUD-Monitor/1.0", Accept: "application/rss+xml, text/xml" },
    });
    if (gRes.ok) {
      const xml = await gRes.text();
      const regex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<source[^>]*>(.*?)<\/source>[\s\S]*?<\/item>/gi;
      let m;
      while ((m = regex.exec(xml)) !== null && googleHeadlines.length < 15) {
        const t = m[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]*>/g, "").trim();
        const s = m[2].replace(/<[^>]*>/g, "").trim();
        if (t.length > 20) googleHeadlines.push({ title: t, source: s });
      }
    }
  } catch {}

  // 3. Source classification
  const INTL_SOURCES = ["reuters", "bloomberg", "wsj", "wall street journal", "washington post", "cnn", "bbc", "abc", "associated press", "ap news", "france 24", "el país", "elpais", "nyt", "new york times", "the guardian", "financial times", "dw", "al jazeera", "mercopress"];
  const NAC_GOB = ["vtv", "correo del orinoco", "rnv", "telesur", "últimas noticias", "la iguana", "avn", "aporrea", "canal8"];
  const NAC_IND = ["efecto cocuyo", "el pitazo", "runrunes", "tal cual", "armando.info", "crónica uno", "prodavinci", "el estímulo", "caracas chronicles", "contrapunto", "provea"];

  function tagSource(source) {
    const s = (source || "").toLowerCase();
    if (INTL_SOURCES.some(p => s.includes(p))) return "INTL";
    if (NAC_GOB.some(p => s.includes(p))) return "NAC-GOB";
    if (NAC_IND.some(p => s.includes(p))) return "NAC-IND";
    return "NAC";
  }

  // 4. Merge headlines — Supabase articles + Google News, deduplicate, tag sources
  const allHeadlines = [];
  const seen = new Set();
  for (const a of articles) {
    const key = (a.title || "").toLowerCase().slice(0, 50);
    const tag = tagSource(a.source);
    if (!seen.has(key) && a.title?.length > 15) { seen.add(key); allHeadlines.push({ text: `[${tag}] "${a.title}" [${a.source}]`, tag }); }
  }
  for (const g of googleHeadlines) {
    const key = g.title.toLowerCase().slice(0, 50);
    const tag = tagSource(g.source);
    if (!seen.has(key)) { seen.add(key); allHeadlines.push({ text: `[${tag}] "${g.title}" [${g.source}]`, tag }); }
  }

  // Sort: INTL first, then NAC-IND, then NAC-GOB, then NAC
  const tagOrder = { "INTL": 0, "NAC-IND": 1, "NAC-GOB": 2, "NAC": 3 };
  allHeadlines.sort((a, b) => (tagOrder[a.tag] || 3) - (tagOrder[b.tag] || 3));

  if (allHeadlines.length < 5) {
    errors.push(`Alerts: Only ${allHeadlines.length} headlines found (need 5+)`);
    return { saved: false, provider: null, count: 0 };
  }

  // 5. Build prompt with source hierarchy context
  const prompt = `Eres un sistema de alerta del PNUD Venezuela. Tu ÚNICA función es identificar y clasificar noticias DIRECTAMENTE relacionadas con Venezuela.

REGLA CRÍTICA DE FILTRADO:
- SOLO incluye noticias donde Venezuela, un actor venezolano, o una institución venezolana sea el SUJETO PRINCIPAL del titular.
- DESCARTA COMPLETAMENTE: noticias sobre otros países (Colombia, Ecuador, Irán, Rusia, China, etc.) aunque mencionen la región, noticias de entretenimiento, deportes internacionales, farándula, sucesos locales sin relevancia política, y cualquier titular que no tenga impacto directo en la situación política, económica o social de Venezuela.
- En caso de duda sobre si un titular es relevante para Venezuela, NO lo incluyas. Es preferible devolver 3 alertas buenas que 8 con ruido.

JERARQUÍA DE FUENTES:
- [INTL] = Medios internacionales de referencia (Reuters, BBC, Bloomberg, WSJ, CNN). Si un medio [INTL] cubre algo de Venezuela, es casi seguro relevante.
- [NAC-IND] = Medios independientes venezolanos (Efecto Cocuyo, El Pitazo, Runrunes). Confiables para hechos en terreno y señales de tensión.
- [NAC-GOB] = Medios oficialistas (VTV, TeleSUR, Correo del Orinoco). Revelan la narrativa oficial — su cobertura o silencio es señal.
- [NAC] = Otros medios nacionales o regionales.
- Si un evento aparece en [INTL] + [NAC-IND], señal fuerte de relevancia.
- Si [NAC-GOB] y [NAC-IND] cubren el mismo evento con narrativas opuestas, considéralo para 🔴 (fractura informativa).

TITULARES:
${allHeadlines.slice(0, 25).map((h, i) => `${i + 1}. ${h.text}`).join("\n")}

INSTRUCCIONES:
1. Responde SOLO en formato JSON válido, sin markdown ni backticks.
2. Aplica el filtro estricto: si el titular no tiene a Venezuela como sujeto principal, EXCLÚYELO.
3. Cada alerta: "nivel" (🔴/🟡/🟢), "titular" (copia exacta del titular original, sin la etiqueta de fuente), "fuente" (nombre del medio), "dimension" (POLÍTICO/ECONÓMICO/INTERNACIONAL/DDHH/ENERGÍA), "impacto" (1 frase de por qué importa para Venezuela).
4. Niveles: 🔴 = Evento que podría mover escenarios (E1-E4) o requiere acción inmediata. 🟡 = Desarrollo relevante para seguimiento analítico. 🟢 = Contexto informativo útil.
5. Máximo 8 alertas, mínimo 2. Si hay pocas noticias relevantes, devuelve pocas — no llenes con ruido.
6. Ordena por relevancia: 🔴 primero, luego 🟡, luego 🟢.
7. Formato exacto:
[{"nivel":"🔴","titular":"...","fuente":"...","dimension":"...","impacto":"..."}]`;

  // 5. Call AI cascade
  const result = await callAICascade(prompt, 800);
  if (!result) {
    errors.push("Alerts: No AI provider responded");
    return { saved: false, provider: null, count: 0 };
  }

  // 6. Parse response
  let parsed = null;
  try {
    const clean = result.text.replace(/```json\s?|```/g, "").trim();
    const jsonMatch = clean.match(/\[[\s\S]*\]/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);
  } catch (e) {
    errors.push(`Alerts: JSON parse failed — ${e.message}`);
    return { saved: false, provider: result.provider, count: 0 };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    errors.push("Alerts: AI returned empty or invalid array");
    return { saved: false, provider: result.provider, count: 0 };
  }

  // 7. Save to Supabase — news_alerts table (upsert by date-slot)
  const now = new Date();
  const slot = `${now.toISOString().slice(0, 10)}-${String(Math.floor(now.getHours() / 6)).padStart(2, "0")}`; // e.g. "2026-03-17-02" = 3rd 6h slot
  const alertRecord = {
    slot,
    alerts: JSON.stringify(parsed.slice(0, 8)),
    provider: result.provider,
    headlines_count: allHeadlines.length,
    classified_at: now.toISOString(),
  };

  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/news_alerts?on_conflict=slot`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SECRET,
      Authorization: `Bearer ${SUPABASE_SECRET}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(alertRecord),
  });

  if (!upsertRes.ok) {
    const errText = await upsertRes.text().catch(() => "");
    errors.push(`Alerts Supabase: ${upsertRes.status} — ${errText}`);
    return { saved: false, provider: result.provider, count: parsed.length };
  }

  return { saved: true, provider: result.provider, count: parsed.length };
}


module.exports = { classifyNewsAlerts };
