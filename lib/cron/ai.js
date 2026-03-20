const { AI_CASCADE_ALERTS } = require("./config");

async function callAICascade(prompt, maxTokens = 800) {
  for (const prov of AI_CASCADE_ALERTS) {
    const apiKey = process.env[prov.key];
    if (!apiKey) continue;
    try {
      let text = null;
      if (prov.name === "gemini") {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${prov.model}:generateContent?key=${apiKey}`;
        const r = await fetch(url, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 } }),
          signal: AbortSignal.timeout(25000),
        });
        if (r.ok) { const d = await r.json(); text = d.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n"); }
      } else {
        const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
        if (prov.name === "openrouter") {
          headers["HTTP-Referer"] = "https://dashboard-ven-monitor-app.vercel.app";
          headers["X-Title"] = "PNUD Monitor Alerts Cron";
        }
        const r = await fetch(prov.url, {
          method: "POST", headers,
          body: JSON.stringify({ model: prov.model, messages: [{ role: "user", content: prompt }], max_tokens: maxTokens, temperature: 0.3 }),
          signal: AbortSignal.timeout(25000),
        });
        if (r.ok) { const d = await r.json(); text = d.choices?.[0]?.message?.content?.trim(); }
      }
      if (text && text.length > 50) return { text, provider: prov.name };
    } catch {}
  }
  return null;
}


module.exports = { callAICascade };
