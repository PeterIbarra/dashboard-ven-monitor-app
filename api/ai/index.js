// /api/ai — AI analysis proxy for SITREP generation
// Primary: Google Gemini Flash (free tier) — GEMINI_API_KEY
// Fallback: Anthropic Claude (paid) — ANTHROPIC_API_KEY
// Keeps all API keys server-side, no CORS issues

module.exports = async function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!geminiKey && !anthropicKey) {
    return res.status(500).json({ error: "No AI API key configured. Set GEMINI_API_KEY (free) or ANTHROPIC_API_KEY in Vercel environment variables." });
  }

  try {
    const { prompt, max_tokens = 1500 } = req.body || {};

    if (!prompt || typeof prompt !== "string" || prompt.length < 10) {
      return res.status(400).json({ error: "Missing or invalid 'prompt' in request body." });
    }

    const safeMaxTokens = Math.min(Math.max(parseInt(max_tokens) || 1500, 100), 4000);
    let text = "";
    let provider = "";

    // ── Try Gemini first (free tier) ──
    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: safeMaxTokens,
              temperature: 0.7,
            },
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const candidate = data.candidates?.[0];
          if (candidate?.content?.parts?.length) {
            text = candidate.content.parts.map(p => p.text || "").join("\n");
            provider = "gemini-2.0-flash";
          }
        }
      } catch (geminiErr) {
        // Gemini failed, will try Anthropic fallback
        console.error("Gemini error:", geminiErr.message);
      }
    }

    // ── Fallback to Anthropic if Gemini failed or unavailable ──
    if (!text && anthropicKey) {
      try {
        const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: safeMaxTokens,
            messages: [{ role: "user", content: prompt }],
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (anthropicRes.ok) {
          const data = await anthropicRes.json();
          text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
          provider = "claude-sonnet-4";
        } else {
          const errBody = await anthropicRes.text().catch(() => "");
          throw new Error(`Anthropic API ${anthropicRes.status}: ${errBody.slice(0, 200)}`);
        }
      } catch (anthropicErr) {
        console.error("Anthropic error:", anthropicErr.message);
      }
    }

    if (!text) {
      return res.status(502).json({ error: "All AI providers failed. Check API keys and quotas." });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      text,
      provider,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return res.status(504).json({ error: "AI request timed out (30s limit)." });
    }
    return res.status(502).json({ error: err.message || "Internal proxy error" });
  }
};
