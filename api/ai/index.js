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
      name: "groq/llama-3.3-70b",
      keyEnv: "GROQ_API_KEY",
      call: async (msgs, apiKey) => {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: msgs,
            tools: TOOL_DEFINITIONS,
            tool_choice: "auto",
            max_tokens: maxTokens,
            temperature: 0.4,
          }),
          signal: AbortSignal.timeout(25000),
        });
        if (!res.ok) return null;
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
        if (!res.ok) return null;
        return await res.json();
      }
    },
  ];

  for (const provider of toolProviders) {
    const apiKey = process.env[provider.keyEnv];
    if (!apiKey) continue;
    try {
      const data = await provider.call(messages, apiKey);
      if (!data) continue;
      const choice = data.choices?.[0];
      if (!choice) continue;

      // Tool calls requested
      if (choice.finish_reason === "tool_calls" && choice.message?.tool_calls?.length) {
        return {
          type: "tool_calls",
          tool_calls: choice.message.tool_calls,
          assistant_message: choice.message,
          provider: provider.name,
        };
      }

      // Direct text response
      const text = choice.message?.content;
      if (text && text.length > 10) {
        return { type: "text", text, provider: provider.name };
      }
    } catch (err) {
      console.error(`${provider.name} tool call error:`, err.message);
    }
  }
  return null; // signal fallback needed
}

// ── Injection fallback providers ──────────────────────────────────────────────

const INJECTION_PROVIDERS = [
  {
    name: "gemini-2.0-flash",
    keyEnv: "GEMINI_API_KEY",
    call: async (prompt, maxTokens, apiKey) => {
      for (const model of ["gemini-1.5-flash", "gemini-2.0-flash"]) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n");
        if (text) return text;
      }
      return null;
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
          model: "meta-llama/llama-3.1-8b-instruct:free",
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    },
  },
  {
    name: "huggingface/qwen-2.5-72b",
    keyEnv: "HF_API_KEY",
    call: async (prompt, maxTokens, apiKey) => {
      const res = await fetch("https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: maxTokens, temperature: 0.7, return_full_text: false },
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data) ? (data[0]?.generated_text || null) : (data.generated_text || null);
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
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n") || null;
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
    { name: "groq/llama-3.3-70b", keyEnv: "GROQ_API_KEY",
      call: async (p, mt, key) => {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
          body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: p }], max_tokens: mt, temperature: 0.7 }),
          signal: AbortSignal.timeout(30000),
        });
        if (!r.ok) return null;
        const d = await r.json();
        return d.choices?.[0]?.message?.content || null;
      }
    },
    { name: "mistral-small", keyEnv: "MISTRAL_API_KEY",
      call: async (p, mt, key) => {
        const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
          body: JSON.stringify({ model: "mistral-small-latest", messages: [{ role: "user", content: p }], max_tokens: mt, temperature: 0.7 }),
          signal: AbortSignal.timeout(30000),
        });
        if (!r.ok) return null;
        const d = await r.json();
        return d.choices?.[0]?.message?.content || null;
      }
    },
    ...INJECTION_PROVIDERS,
  ];

  const errors = [];
  for (const provider of allProviders) {
    const apiKey = process.env[provider.keyEnv];
    if (!apiKey) continue;
    try {
      const text = await provider.call(prompt, safeMaxTokens, apiKey);
      if (text && text.length > 20) {
        return res.status(200).json({ text, provider: provider.name });
      }
      errors.push(`${provider.name}: empty response`);
    } catch (err) {
      errors.push(`${provider.name}: ${err.name === "AbortError" ? "timeout" : err.message}`);
    }
  }

  return res.status(502).json({ error: "All AI providers failed.", details: errors });
};
