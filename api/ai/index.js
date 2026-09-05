// /api/ai — AI proxy: tool-calling mode (Groq/Mistral) + injection fallback
// Mode A: { messages, use_tools, max_tokens } → tool-capable providers → { text } | { tool_calls, assistant_message }
// Mode B: { prompt, max_tokens } → full cascade (backward compat for ICG/Daily Brief)

// ── Tool definitions (sent to AI providers) ──────────────────────────────────

const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "get_weekly_history",
      description: "Historial semanal S1–S15 con probabilidades exactas por escenario (E1 Transición, E2 Colapso, E3 Continuidad, E4 Resistencia), lectura analítica y semáforo. Llamar siempre que la pregunta involucre evolución, tendencias o comparación entre semanas.",
      parameters: {
        type: "object",
        properties: {
          semanas: { type: "array", items: { type: "string" }, description: "Semanas específicas ej ['S1','S15']. Vacío o ausente = todas." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_signals",
      description: "Señales activas de monitoreo por escenario con estado semafórico (green/yellow/red) y valor actual. Llamar para preguntas sobre qué está pasando en un escenario específico.",
      parameters: {
        type: "object",
        properties: {
          escenario: { type: "string", enum: ["E1","E2","E3","E4","all"], description: "Escenario a consultar. 'all' para todos." }
        },
        required: ["escenario"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_sitrep",
      description: "SITREP completo de semanas específicas: análisis narrativo, puntos clave, dimensiones, noticias curadas. Usar para preguntas sobre qué ocurrió en una semana puntual.",
      parameters: {
        type: "object",
        properties: {
          semana: { type: "string", description: "Semana específica ej 'S12', o 'ultima' para la más reciente." }
        },
        required: ["semana"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_conflictividad",
      description: "Datos de conflictividad social: histórico anual 2011–2025, protestas mensuales 2026, por tipo de derecho, por servicio público, por estado. Llamar para preguntas sobre protestas, conflictividad o tensión social.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_tensions",
      description: "Tensiones activas semaforizadas de la semana más reciente (verde/amarillo/rojo). Llamar para una vista rápida del estado de tensiones actual.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_kpis",
      description: "KPIs más recientes del dashboard por dimensión: energía, político, opinión pública. Llamar para preguntas sobre indicadores clave actuales.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_indicators",
      description: "Indicadores de seguimiento por dimensión (Energético, Económico, Político, Social, Internacional) con estado semafórico actual.",
      parameters: {
        type: "object",
        properties: {
          dimension: { type: "string", description: "Dimensión específica ej 'Energético'. Vacío = todas." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_prospectiva",
      description: "Sesiones prospectivas: escenario dominante/latente por sesión, implicaciones PNUD, tabla comparativa entre sesiones y consideraciones finales.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_amnistia",
      description: "Tracker de amnistía política semana a semana: cifras oficiales vs verificadas por Foro Penal, presos políticos, militares detenidos, hitos del proceso.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_live_data",
      description: "Datos en tiempo real: tasa BCV, dólar paralelo, brecha cambiaria, precio Brent y WTI.",
      parameters: { type: "object", properties: {} }
    }
  },
];

// ── System prompt (tool mode) ─────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres el asistente analítico del Monitor de Contexto Situacional Venezuela 2026 del PNUD.
Tienes herramientas para consultar datos reales del dashboard. SIEMPRE usa las herramientas antes de responder — nunca respondas desde memoria sobre datos del dashboard.
Puedes llamar varias herramientas en paralelo si la pregunta lo requiere.
Responde en español. Sé analítico, preciso y conciso. Cita los datos que obtienes de las herramientas.
Cuando hagas recomendaciones para el PNUD, diferencia por escenario y área programática.`;

// ── Tool-capable providers ────────────────────────────────────────────────────

async function callWithTools(messages, maxTokens) {
  const toolProviders = [
    {
      name: "groq/gpt-oss-120b",
      keyEnv: "GROQ_API_KEY",
      call: async (msgs, apiKey) => {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b", // llama-3.3-70b-versatile: retirado por Groq (404), reemplazado 2026-09-05
            messages: msgs,
            tools: TOOL_DEFINITIONS,
            tool_choice: "auto",
            max_tokens: maxTokens,
            temperature: 0.4,
          }),
          signal: AbortSignal.timeout(25000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
        return await res.json();
      }
    },
    {
      name: "mistral-small",
      keyEnv: "MISTRAL_API_KEY",
      call: async (msgs, apiKey) => {
        const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "mistral-small-latest",
            messages: msgs,
            tools: TOOL_DEFINITIONS,
            tool_choice: "auto",
            max_tokens: maxTokens,
            temperature: 0.4,
          }),
          signal: AbortSignal.timeout(25000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
        return await res.json();
      }
    },
  ];

  // Se prueban EN PARALELO (Promise.any), no en serie: en serie, la suma de
  // los timeouts de cada proveedor (25s + 25s = 50s) supera el maxDuration
  // de la función (ver vercel.json) y Vercel mata la función a medio camino
  // — eso hacía fallar el cascade completo aunque un proveedor más adelante
  // en la lista sí hubiera respondido bien. En paralelo, el peor caso es el
  // más lento de los dos (~25s), no la suma. Actualizado 2026-09-05.
  const configured = toolProviders.filter(p => process.env[p.keyEnv]);
  if (configured.length === 0) return null;

  try {
    return await Promise.any(configured.map(async (provider) => {
      const apiKey = process.env[provider.keyEnv];
      const data = await provider.call(messages, apiKey);
      const choice = data?.choices?.[0];
      if (!choice) throw new Error("respuesta sin choices");

      if (choice.finish_reason === "tool_calls" && choice.message?.tool_calls?.length) {
        return {
          type: "tool_calls",
          tool_calls: choice.message.tool_calls,
          assistant_message: choice.message,
          provider: provider.name,
        };
      }

      const text = choice.message?.content;
      if (text && text.length > 10) return { type: "text", text, provider: provider.name };
      throw new Error("respuesta demasiado corta");
    }));
  } catch (aggErr) {
    for (const e of (aggErr.errors || [aggErr])) console.error("tool call error:", e.message);
    return null; // signal fallback needed
  }
}

// ── Injection fallback providers ──────────────────────────────────────────────

const INJECTION_PROVIDERS = [
  {
    name: "gemini-3.6-flash",
    keyEnv: "GEMINI_API_KEY",
    call: async (prompt, maxTokens, apiKey) => {
      // gemini-1.5-flash y gemini-2.0-flash fueron retirados por Google (404
      // "no longer available") — actualizado 2026-09-05 tras confirmar en vivo.
      // Los dos modelos se intentan EN PARALELO (Promise.any), no en serie —
      // en serie, 30s + 30s por sí solo ya casi agota el maxDuration de la
      // función (ver nota en callWithTools / vercel.json).
      const tryModel = async (model) => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
          }),
          signal: AbortSignal.timeout(25000),
        });
        if (!res.ok) throw new Error(`${model} HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n");
        if (!text) throw new Error(`${model}: empty candidates — finishReason=${data.candidates?.[0]?.finishReason || "?"}`);
        return text;
      };
      try {
        return await Promise.any([tryModel("gemini-3.6-flash"), tryModel("gemini-2.5-flash")]);
      } catch (aggErr) {
        throw new Error((aggErr.errors || [aggErr]).map(e => e.message).join(" | "));
      }
    },
  },
  {
    name: "openrouter/free",
    keyEnv: "OPENROUTER_API_KEY",
    call: async (prompt, maxTokens, apiKey) => {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://dashboard-ven-monitor-app.vercel.app",
          "X-Title": "PNUD Venezuela Monitor",
        },
        body: JSON.stringify({
          // meta-llama/llama-3.1-8b-instruct:free ya no existe en el catálogo
          // gratuito de OpenRouter (404) — reemplazado 2026-09-05.
          model: "nvidia/nemotron-3.5-lightning:free",
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error(`empty choices — ${JSON.stringify(data).slice(0, 200)}`);
      return text;
    },
  },
  {
    name: "huggingface/qwen-2.5-72b",
    keyEnv: "HF_API_KEY",
    call: async (prompt, maxTokens, apiKey) => {
      // api-inference.huggingface.co fue retirado — HF movió todo a un router
      // OpenAI-compatible (router.huggingface.co) que reparte entre providers
      // de inferencia. Actualizado 2026-09-05 tras confirmar en vivo.
      const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-72B-Instruct",
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error(`empty choices — ${JSON.stringify(data).slice(0, 200)}`);
      return text;
    },
  },
  {
    name: "claude-sonnet-4",
    keyEnv: "ANTHROPIC_API_KEY",
    call: async (prompt, maxTokens, apiKey) => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: maxTokens,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
      const data = await res.json();
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      if (!text) throw new Error(`empty content — ${JSON.stringify(data).slice(0, 200)}`);
      return text;
    },
  },
];

// ── Handler ───────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== "object") body = {};

  res.setHeader("Cache-Control", "no-store");

  const { prompt, messages, use_tools, max_tokens = 2000 } = body;
  const safeMaxTokens = Math.min(Math.max(parseInt(max_tokens) || 2000, 100), 4000);

  // ── Mode A: tool-calling (ChatBot) ──
  if (use_tools && Array.isArray(messages)) {
    const fullMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
    const result = await callWithTools(fullMessages, safeMaxTokens);

    if (result?.type === "tool_calls") {
      return res.status(200).json({
        tool_calls: result.tool_calls,
        assistant_message: result.assistant_message,
        provider: result.provider,
      });
    }

    if (result?.type === "text") {
      return res.status(200).json({ text: result.text, provider: result.provider });
    }

    // Tool providers failed — signal frontend to use fallback injection
    return res.status(200).json({ fallback: true });
  }

  // ── Mode B: prompt injection (ICG, Daily Brief, ChatBot fallback) ──
  if (!prompt || typeof prompt !== "string" || prompt.length < 5) {
    return res.status(400).json({ error: "Missing 'prompt' or 'messages' in request body." });
  }

  const allProviders = [
    { name: "groq/gpt-oss-120b", keyEnv: "GROQ_API_KEY",
      call: async (p, mt, key) => {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
          body: JSON.stringify({ model: "openai/gpt-oss-120b", messages: [{ role: "user", content: p }], max_tokens: mt, temperature: 0.7 }),
          signal: AbortSignal.timeout(25000),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}`);
        const d = await r.json();
        const text = d.choices?.[0]?.message?.content;
        if (!text) throw new Error(`empty choices — ${JSON.stringify(d).slice(0, 200)}`);
        return text;
      }
    },
    { name: "mistral-small", keyEnv: "MISTRAL_API_KEY",
      call: async (p, mt, key) => {
        const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
          body: JSON.stringify({ model: "mistral-small-latest", messages: [{ role: "user", content: p }], max_tokens: mt, temperature: 0.7 }),
          signal: AbortSignal.timeout(25000),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}`);
        const d = await r.json();
        const text = d.choices?.[0]?.message?.content;
        if (!text) throw new Error(`empty choices — ${JSON.stringify(d).slice(0, 200)}`);
        return text;
      }
    },
    ...INJECTION_PROVIDERS,
  ];

  // Se prueban EN PARALELO (Promise.any), no en serie — actualizado 2026-09-05.
  // Con hasta 6 proveedores en serie, la SUMA de sus timeouts (hasta ~3 min)
  // superaba por mucho el maxDuration de la función (ver vercel.json), así
  // que Vercel mataba la función a medio cascade sin llegar nunca a probar
  // la mayoría de los proveedores — esa era la causa real de que la alerta
  // de noticias siguiera fallando incluso con los IDs de modelo corregidos.
  // En paralelo, el tiempo total es el del proveedor más lento (~25s), no
  // la suma de todos.
  const configured = allProviders.filter(p => process.env[p.keyEnv]);
  const attempted = configured.map(p => p.name);
  const skippedNoKey = allProviders
    .filter(p => !process.env[p.keyEnv])
    .map(p => `${p.name}: no API key configured (${p.keyEnv})`);

  if (configured.length === 0) {
    return res.status(502).json({ error: "All AI providers failed.", attempted, details: skippedNoKey });
  }

  // Modo diagnóstico temporal (2026-09-05): con { debug: true } en el body,
  // corre TODOS los proveedores configurados hasta que terminen (no se
  // detiene en el primero exitoso) y reporta éxito/error + tiempo de cada
  // uno. Solo se activa con el flag explícito — el comportamiento normal
  // (Promise.any, responde con el primero que gane) no cambia.
  if (body.debug === true) {
    const t0 = Date.now();
    const settled = await Promise.allSettled(configured.map(async (provider) => {
      const start = Date.now();
      const apiKey = process.env[provider.keyEnv];
      const text = await provider.call(prompt, safeMaxTokens, apiKey);
      return { ms: Date.now() - start, textLength: text?.length || 0, textPreview: (text || "").slice(0, 80) };
    }));
    const results = settled.map((r, i) => {
      const name = configured[i].name;
      if (r.status === "fulfilled") return { provider: name, ok: true, ...r.value };
      const err = r.reason;
      return { provider: name, ok: false, error: err?.name === "AbortError" ? "timeout" : (err?.message || String(err)) };
    });
    return res.status(200).json({ debug: true, totalMs: Date.now() - t0, skippedNoKey, results });
  }

  try {
    const winner = await Promise.any(configured.map(async (provider) => {
      const apiKey = process.env[provider.keyEnv];
      const text = await provider.call(prompt, safeMaxTokens, apiKey);
      if (!text || text.length <= 20) throw new Error(`response too short (${text?.length || 0} chars)`);
      return { text, provider: provider.name };
    }));
    return res.status(200).json({ text: winner.text, provider: winner.provider });
  } catch (aggErr) {
    const providerErrors = configured.map((p, i) => {
      const err = aggErr.errors?.[i];
      const msg = err ? (err.name === "AbortError" ? "timeout" : err.message) : "unknown error";
      return `${p.name}: ${msg}`;
    });
    return res.status(502).json({ error: "All AI providers failed.", attempted, details: [...skippedNoKey, ...providerErrors] });
  }
};
