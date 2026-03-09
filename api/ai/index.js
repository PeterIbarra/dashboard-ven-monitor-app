// /api/ai — AI analysis proxy for SITREP generation
// Cascade: Gemini Flash (free) → Groq Llama (free) → OpenRouter (free) → Anthropic Claude (paid)
// All API keys stay server-side. No CORS issues.

const PROVIDERS = [
  {
    name: "gemini-2.0-flash",
    keyEnv: "GEMINI_API_KEY",
    call: async (prompt, maxTokens, apiKey) => {
      // Try gemini-2.0-flash first, fallback to gemini-1.5-flash if unavailable
      const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
      for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          console.error(`Gemini ${model} error ${res.status}: ${errText.slice(0, 200)}`);
          continue; // try next model
        }
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n");
        if (text) return text;
      }
      return null;
    },
  },
  {
    name: "groq/llama-3.3-70b",
    keyEnv: "GROQ_API_KEY",
    call: async (prompt, maxTokens, apiKey) => {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
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
    name: "openrouter/free",
    keyEnv: "OPENROUTER_API_KEY",
    call: async (prompt, maxTokens, apiKey) => {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://monitor-pnud.vercel.app",
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
    name: "claude-sonnet-4",
    keyEnv: "ANTHROPIC_API_KEY",
    call: async (prompt, maxTokens, apiKey) => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
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

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // Check if at least one key is configured
  const available = PROVIDERS.filter(p => process.env[p.keyEnv]);
  if (available.length === 0) {
    return res.status(500).json({
      error: "No AI API key configured. Set at least one: GEMINI_API_KEY (free), GROQ_API_KEY (free), OPENROUTER_API_KEY (free), or ANTHROPIC_API_KEY (paid).",
    });
  }

  try {
    const { prompt, max_tokens = 1500 } = req.body || {};
    if (!prompt || typeof prompt !== "string" || prompt.length < 10) {
      return res.status(400).json({ error: "Missing or invalid 'prompt' in request body." });
    }

    const safeMaxTokens = Math.min(Math.max(parseInt(max_tokens) || 1500, 100), 4000);
    const errors = [];

    // Try each provider in cascade order
    for (const provider of available) {
      try {
        const apiKey = process.env[provider.keyEnv];
        const text = await provider.call(prompt, safeMaxTokens, apiKey);
        if (text && text.length > 20) {
          res.setHeader("Cache-Control", "no-store");
          return res.status(200).json({ text, provider: provider.name, generatedAt: new Date().toISOString() });
        }
        errors.push(`${provider.name}: empty or short response`);
      } catch (err) {
        const msg = err.name === "TimeoutError" || err.name === "AbortError" ? "timeout 30s" : err.message;
        errors.push(`${provider.name}: ${msg}`);
      }
    }

    return res.status(502).json({
      error: "All AI providers failed. Check API keys and quotas in Vercel Environment Variables.",
      tried: available.map(p => p.name),
      details: errors,
    });
  } catch (err) {
    return res.status(502).json({ error: err.message || "Internal proxy error" });
  }
};
