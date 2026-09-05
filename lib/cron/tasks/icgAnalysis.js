const { SUPABASE_URL, SUPABASE_SECRET } = require("../config");

async function icgAnalysis(errors) {
  let icgSaved = false;
  let icgProvider = null;
try {
  // Fetch recent articles from Supabase (last 24h, Venezuela-focused)
  const since = new Date(Date.now() - 24*60*60*1000).toISOString();
  const articlesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?type=eq.news&published_at=gte.${since}&order=published_at.desc&limit=50`,
    { headers: { apikey: SUPABASE_SECRET, Authorization: `Bearer ${SUPABASE_SECRET}` }, signal: AbortSignal.timeout(8000) }
  );

  let articles = [];
  if (articlesRes.ok) articles = await articlesRes.json();

  if (articles.length >= 5) {
    // Build article summaries — title + first 300 chars of description, with source
    const OFICIALISTAS = ["VTV","Correo del Orinoco","RNV","TeleSUR","VTV Canal8","Últimas Noticias","La Iguana TV","AVN","Aporrea"];
    
    // Sort: oficialistas first (they reveal internal cohesion dynamics)
    articles.sort((a, b) => {
      const aOf = OFICIALISTAS.includes(a.source) ? 0 : 1;
      const bOf = OFICIALISTAS.includes(b.source) ? 0 : 1;
      return aOf - bOf;
    });

    const articleTexts = articles.slice(0, 40).map((a, i) => {
      const bias = OFICIALISTAS.includes(a.source) ? "[OFICIALISTA]" : "[INDEPENDIENTE]";
      const desc = a.description ? a.description.substring(0, 300) : "";
      return `${i+1}. ${bias} [${a.source}] "${a.title}"${desc ? "\n   " + desc : ""}`;
    }).join("\n\n");

    // Pre-process: detect critical signals automatically from headlines
    const CRITICAL_PATTERNS = [
      { pattern: /design[ao]|nombr[ao]|asume|nuevo.{0,15}ministr|reemplaz|sustitu|relev[ao]|cambi[ao].{0,15}ministr|destitu/i, type: "CAMBIO_GABINETE" },
      { pattern: /detenid|arrest|captur|pres[ao].{0,10}polític|SEBIN|DGCIM|allanam/i, type: "REPRESION" },
      { pattern: /protest|movilizaci|march[ao]|manifestaci/i, type: "PROTESTA" },
      { pattern: /fractur|disidencia|ruptur|desert|renunci/i, type: "FRACTURA" },
      { pattern: /sancion|OFAC|licencia|bloque/i, type: "SANCION" },
      { pattern: /FANB|militar|general|almirante|coronel|defensa/i, type: "MILITAR" },
    ];
    const criticalSignals = [];
    for (const a of articles.slice(0, 40)) {
      const text = `${a.title} ${a.description || ""}`;
      for (const cp of CRITICAL_PATTERNS) {
        if (cp.pattern.test(text)) {
          criticalSignals.push(`[${cp.type}] "${a.title}" [${a.source}]`);
          break;
        }
      }
    }

    const ICG_ACTORS = [
      "Delcy Rodríguez (líder interina)",
      "Jorge Rodríguez (AN)",
      "Diosdado Cabello",
      "FANB",
      "Vladimir Padrino López",
      "Jorge Arreaza",
      "Nicolás Maduro Guerra (hijo)",
      "Asamblea Nacional",
      "PSUV (partido)",
      "Chavismo (movimiento)",
      "Colectivos",
      "Gobernadores chavistas",
      "Sector militar amplio",
    ];

    const criticalBlock = criticalSignals.length > 0
      ? `\n\n╔══════════════════════════════════════════════════════════╗
║  SEÑALES CRÍTICAS — REGLAS OBLIGATORIAS (NO NEGOCIABLES) ║
╚══════════════════════════════════════════════════════════╝
${criticalSignals.map((s, i) => `⚠ ${i+1}. ${s}`).join("\n")}

REGLAS ABSOLUTAS QUE NO PUEDES VIOLAR:
- Si un titular dice que se DESIGNÓ un NUEVO ministro de Defensa → Vladimir Padrino López fue REEMPLAZADO → Padrino = "TENSION" obligatorio. No importa si fue "ordenado" o "con agradecimiento". Un reemplazo es TENSION, punto.
- Si un titular dice "designan nuevo ministro" de cualquier cartera → el anterior titular de esa cartera = "TENSION".
- Un "relevo ordenado" o "transición suave" sigue siendo TENSION — el actor perdió su cargo.
- NUNCA clasifiques a un actor reemplazado como "ALINEADO". Eso es una contradicción lógica.
- Si no estás seguro de quién fue reemplazado, pon "TENSION" en los actores más cercanos al cargo.`
      : "";

    const prompt = `Eres analista senior de riesgo político del PNUD Venezuela. Evalúas la COHESIÓN INTERNA del gobierno de Delcy Rodríguez post-captura de Maduro (enero 2026).

ARTÍCULOS DE LAS ÚLTIMAS 24 HORAS (${articles.length} noticias):
${articleTexts}
${criticalBlock}

REGLAS DE EVALUACIÓN ESTRICTAS:

CAMBIOS DE GABINETE: Si un actor fue REEMPLAZADO, REMOVIDO, o su cargo fue asignado a otra persona → ese actor es TENSION (no ALINEADO ni NEUTRO). Un reemplazo ministerial siempre indica reestructuración de poder. El nuevo designado es ALINEADO (fue elegido por Delcy). El actor reemplazado NUNCA puede ser ALINEADO.

SILENCIO: Si un actor NO aparece mencionado en NINGÚN artículo → es NEUTRO (no ALINEADO). ALINEADO requiere evidencia POSITIVA, no ausencia de evidencia negativa. "No hay críticas" NO es evidencia de alineación — es ausencia de información.

FUENTES: [OFICIALISTA] revela la narrativa oficial. Si un medio oficialista cubre el reemplazo de un funcionario, eso CONFIRMA el cambio. [INDEPENDIENTE] complementa con contexto.

Para CADA uno de estos 13 actores, evalúa su alineación:

${ICG_ACTORS.map((a, i) => `${i+1}. ${a}`).join("\n")}

Criterios:
- ALINEADO: Evidencia POSITIVA de acciones coordinadas, declaraciones de apoyo, participación activa en agenda de Delcy, mencionado positivamente en medios oficialistas. Requiere al menos 1 señal concreta.
- NEUTRO: Sin menciones, perfil bajo, sin señales claras en ninguna dirección, o señales mixtas.
- TENSION: Reemplazado/removido de cargo, declaraciones divergentes, ausencias notables en eventos donde debería estar, omitido de medios oficialistas en contexto donde debería aparecer, señales de fractura o disidencia.

Responde SOLO con un JSON array válido (sin markdown, sin backticks):
[{"actor":"Delcy Rodríguez","alignment":"ALINEADO","confidence":0.9,"evidence":"razón corta basada en artículos concretos","signals":["señal1","señal2"]},...]`;

    // Call AI cascade — Groq Llama 70B first (better political reasoning), Mistral as fallback
    const AI_CASCADE = [
      { name: "groq", key: "GROQ_API_KEY", url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile", format: "openai" },
      { name: "mistral", key: "MISTRAL_API_KEY", url: "https://api.mistral.ai/v1/chat/completions", model: "mistral-small-latest", format: "openai" },
      { name: "openrouter", key: "OPENROUTER_API_KEY", url: "https://openrouter.ai/api/v1/chat/completions", model: "meta-llama/llama-3.1-8b-instruct:free", format: "openai" },
    ];

    let aiText = null;
    for (const prov of AI_CASCADE) {
      const apiKey = process.env[prov.key];
      if (!apiKey) continue;
      try {
        const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
        if (prov.name === "openrouter") {
          headers["HTTP-Referer"] = "https://dashboard-ven-monitor-app.vercel.app";
          headers["X-Title"] = "PNUD Monitor ICG Cron";
        }
        const aiRes = await fetch(prov.url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: prov.model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1500,
            temperature: 0.1,
          }),
          signal: AbortSignal.timeout(25000),
        });
        if (aiRes.ok) {
          const data = await aiRes.json();
          const text = data.choices?.[0]?.message?.content?.trim();
          if (text && text.length > 50) {
            aiText = text;
            icgProvider = prov.name;
            break;
          }
        }
      } catch (e) {
        errors.push(`ICG ${prov.name}: ${e.message}`);
      }
    }

    if (aiText) {
      try {
        const clean = aiText.replace(/```json|```/g, "").trim();
        // Extract JSON array
        const jsonMatch = clean.match(/\[[\s\S]*\]/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);

        if (Array.isArray(parsed) && parsed.length > 0) {
          // POST-PROCESSING: Force TENSION on actors involved in cabinet changes
          // Generic: maps ministry keywords → actors who hold those roles
          const ROLE_MAP = [
            { keywords: ["defensa", "defense", "militar"], actors: ["padrino"] },
            { keywords: ["interior", "justicia", "seguridad"], actors: ["cabello"] },
            { keywords: ["petróleo", "pdvsa", "energía", "petrol"], actors: [] },
            { keywords: ["exterior", "cancill", "relaciones exteriores"], actors: ["arreaza"] },
            { keywords: ["asamblea", "parlamento", "legislat"], actors: ["jorge rodríguez"] },
          ];

          const cabinetSignals = criticalSignals.filter(s => s.startsWith("[CAMBIO_GABINETE]"));
          if (cabinetSignals.length > 0) {
            const cabinetText = cabinetSignals.join(" ").toLowerCase();

            for (const actor of parsed) {
              if (actor.alignment !== "ALINEADO") continue;
              const actorName = (actor.actor || "").toLowerCase();

              // Check if any ROLE_MAP entry matches: cabinet change mentions the ministry AND actor holds that role
              for (const role of ROLE_MAP) {
                const ministryMentioned = role.keywords.some(kw => cabinetText.includes(kw));
                const actorMatchesRole = role.actors.some(a => actorName.includes(a));
                if (ministryMentioned && actorMatchesRole) {
                  actor.alignment = "TENSION";
                  actor.confidence = Math.max(actor.confidence || 0.5, 0.85);
                  actor.evidence = (actor.evidence || "") + " [OVERRIDE: Cambio de gabinete detectado en su área — nuevo designado implica remoción]";
                  actor.signals = [...(actor.signals || []), "POST-PROCESO: Cambio ministerial en su cartera"];
                  break;
                }
              }

              // Generic fallback: if actor's own name appears near "reemplaz/sustitu/relev/nuevo" in cabinet signals
              if (actor.alignment === "ALINEADO") {
                const nameWords = actorName.split(" ").filter(w => w.length > 3);
                for (const signal of cabinetSignals) {
                  const sigLow = signal.toLowerCase();
                  const nameInSignal = nameWords.some(w => sigLow.includes(w));
                  if (nameInSignal && (sigLow.includes("reemplaz") || sigLow.includes("sustitu") || sigLow.includes("relev") || sigLow.includes("saliente"))) {
                    actor.alignment = "TENSION";
                    actor.confidence = Math.max(actor.confidence || 0.5, 0.9);
                    actor.evidence = (actor.evidence || "") + " [OVERRIDE: Mencionado directamente en señal de cambio de gabinete]";
                    actor.signals = [...(actor.signals || []), "POST-PROCESO: Nombre aparece en titular de cambio ministerial"];
                    break;
                  }
                }
              }
            }

            // Also: if 3+ cabinet changes in same cycle → FANB and Sector militar go to max NEUTRO
            if (cabinetSignals.length >= 3) {
              for (const actor of parsed) {
                const name = (actor.actor || "").toLowerCase();
                if ((name.includes("fanb") || name.includes("sector militar")) && actor.alignment === "ALINEADO") {
                  actor.alignment = "NEUTRO";
                  actor.confidence = Math.min(actor.confidence || 0.5, 0.65);
                  actor.evidence = (actor.evidence || "") + " [AJUSTE: Reestructuración masiva de gabinete (3+ cambios) genera incertidumbre en sector militar]";
                }
              }
            }
          }

          // Compute composite ICG score
          const ALIGN_SCORES = { "ALINEADO": 90, "NEUTRO": 50, "TENSION": 15 };
          let totalScore = 0, totalWeight = 0;
          const actorScores = parsed.map(a => {
            const score = ALIGN_SCORES[a.alignment] || 50;
            const weight = a.confidence || 0.5;
            totalScore += score * weight;
            totalWeight += weight;
            return {
              actor: a.actor,
              alignment: a.alignment,
              confidence: a.confidence,
              evidence: a.evidence,
              signals: a.signals,
            };
          });
          const compositeICG = totalWeight > 0 ? Math.round(totalScore / totalWeight) : null;

          // Save to daily_readings
          const today = new Date().toISOString().slice(0, 10);
          const icgData = {
            date: today,
            icg_score: compositeICG,
            icg_actors: JSON.stringify(actorScores),
            icg_provider: icgProvider,
            icg_articles_count: articles.length,
          };
          const icgUpsert = await fetch(`${SUPABASE_URL}/rest/v1/daily_readings?on_conflict=date`, {
            method: "POST",
            headers: {
              apikey: SUPABASE_SECRET,
              Authorization: `Bearer ${SUPABASE_SECRET}`,
              "Content-Type": "application/json",
              Prefer: "resolution=merge-duplicates,return=minimal",
            },
            body: JSON.stringify(icgData),
          });
          icgSaved = icgUpsert.ok;
          if (!icgUpsert.ok) errors.push(`ICG Supabase: ${icgUpsert.status}`);
        }
      } catch (e) {
        errors.push(`ICG parse: ${e.message}`);
      }
    } else {
      errors.push("ICG: No AI provider responded");
    }
  } else {
    errors.push(`ICG: Only ${articles.length} articles found (need 5+)`);
  }
} catch (e) {
  errors.push(`ICG: ${e.message}`);
}
  return { icgSaved, icgProvider };
}

module.exports = { icgAnalysis };
