import { memo, useState, useEffect, useRef } from "react";
import { Card } from "./Card";
import { BORDER, TEXT, MUTED, font, fontSans } from "../constants";

export const NewsAlerts = memo(function NewsAlerts({ liveData, mob }) {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState("waiting"); // waiting | loading | done | error
  const attempted = useRef(false);

  const [cachedAge, setCachedAge] = useState(null);

  useEffect(() => {
    if (attempted.current || !liveData?.fetched) return;
    attempted.current = true;

    // ── Step 1: Try cached alerts from Supabase (saved by cron every 6-8h) ──
    async function tryCached() {
      if (!IS_DEPLOYED) return false;
      try {
        const res = await fetch("/api/articles?type=alerts", { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return false;
        const data = await res.json();
        if (data.cached && data.alerts?.length > 0 && !data.stale) {
          setAlerts(data.alerts.slice(0, 8));
          setProvider(data.provider || "cached");
          setCachedAge(data.age_hours);
          setStatus("done");
          return true;
        }
      } catch {}
      return false;
    }

    // ── Step 2: Live AI classification (fallback) ──
    async function classifyNewsLive() {
      setLoading(true);
      setStatus("loading");

      let googleNews = [];
      if (IS_DEPLOYED) {
        try {
          const res = await fetch("/api/gdelt?signal=headlines", { signal: AbortSignal.timeout(12000) });
          if (res.ok) {
            const h = await res.json();
            googleNews = (h.all || []).filter(a => a.title?.length > 20).slice(0, 15);
          }
        } catch {}
      }

      const rssNews = (liveData?.news || []).slice(0, 10).map(n => ({
        title: n.title || n.titulo || "", source: n.source || n.fuente || ""
      })).filter(n => n.title.length > 15);

      const allHeadlines = [
        ...googleNews.map(a => `"${a.title}" [${a.source}]`),
        ...rssNews.map(a => `"${a.title}" [${a.source}]`)
      ];

      if (allHeadlines.length < 3) { setLoading(false); setStatus("error"); return false; }

      const prompt = `Eres un sistema de alerta del PNUD Venezuela. Tu ÚNICA función es identificar noticias DIRECTAMENTE relacionadas con Venezuela.

REGLA CRÍTICA: SOLO incluye noticias donde Venezuela, un actor venezolano, o una institución venezolana sea el SUJETO PRINCIPAL. DESCARTA noticias sobre otros países, entretenimiento, deportes internacionales, farándula, o sucesos sin impacto en Venezuela. Es preferible devolver 3 alertas buenas que 8 con ruido.

TITULARES:
${allHeadlines.map((h,i) => `${i+1}. ${h}`).join("\n")}

INSTRUCCIONES:
1. Responde SOLO en formato JSON válido, sin markdown ni backticks.
2. Aplica el filtro estricto: si Venezuela no es el sujeto principal, EXCLÚYELO.
3. Cada alerta: "nivel" (🔴/🟡/🟢), "titular", "fuente", "dimension" (POLÍTICO/ECONÓMICO/INTERNACIONAL/DDHH/ENERGÍA), "impacto" (1 frase de por qué importa).
4. 🔴 = Evento que podría mover escenarios. 🟡 = Desarrollo para seguimiento. 🟢 = Contexto informativo.
5. Máximo 8, mínimo 2. Ordena: 🔴 primero, luego 🟡, luego 🟢.
6. Formato: [{"nivel":"🔴","titular":"...","fuente":"...","dimension":"...","impacto":"..."}]`;

      try {
        if (IS_DEPLOYED) {
          const res = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, max_tokens: 600 }),
            signal: AbortSignal.timeout(35000),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.provider) setProvider(data.provider);
            if (data.text) {
              try {
                const clean = data.text.replace(/```json\s?|```/g, "").trim();
                const parsed = JSON.parse(clean);
                if (Array.isArray(parsed) && parsed.length > 0) { setAlerts(parsed.slice(0, 8)); setLoading(false); setStatus("done"); return true; }
              } catch {
                const match = data.text.match(/\[[\s\S]*\]/);
                if (match) {
                  try { const p = JSON.parse(match[0]); if (Array.isArray(p) && p.length > 0) { setAlerts(p.slice(0, 8)); setLoading(false); setStatus("done"); return true; } } catch {}
                }
              }
            }
          }
        }
      } catch {}
      setLoading(false);
      setStatus("error");
      return false;
    }

    // ── Orchestrate: cached first, then live with retries ──
    async function run() {
      const cached = await tryCached();
      if (cached) return;
      // Live fallback with retries: 4s, then 60s, then 180s
      const attempt = (delay, remaining) => {
        setTimeout(async () => {
          const success = await classifyNewsLive();
          if (!success && remaining > 0) {
            attempt(remaining > 1 ? 60000 : 180000, remaining - 1);
          }
        }, delay);
      };
      attempt(4000, 2);
    }
    run();
  }, [liveData?.fetched]);

  if (status === "waiting") return null;

  const nivelColor = { "🔴":"#dc2626", "🟡":"#ca8a04", "🟢":"#16a34a" };
  const nivelBg = { "🔴":"#dc262608", "🟡":"#ca8a0408", "🟢":"#16a34a08" };
  const dimColor = { "POLÍTICO":"#7c3aed", "ECONÓMICO":"#0e7490", "INTERNACIONAL":"#0468B1", "DDHH":"#dc2626", "ENERGÍA":"#ca8a04" };

  const badgeColor = provider.includes("mistral") ? "#ff6f00" : provider.includes("gemini") ? "#4285f4" : provider.includes("groq")||provider.includes("llama") ? "#f97316" : provider.includes("openrouter")||provider.includes("free") ? "#06b6d4" : provider.includes("hugging")||provider.includes("qwen")||provider.includes("hf") ? "#ffbf00" : provider === "cached" ? "#64748b" : "#8b5cf6";
  const badgeLabel = provider.includes("mistral") ? "MISTRAL" : provider.includes("gemini") ? "GEMINI" : provider.includes("groq")||provider.includes("llama") ? "GROQ" : provider.includes("openrouter")||provider.includes("free") ? "OPENROUTER" : provider.includes("hugging")||provider.includes("qwen")||provider.includes("hf") ? "HUGGINGFACE" : provider === "cached" ? "CACHED" : "CLAUDE";

  return (
    <Card>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
        <span style={{ fontSize:14 }}>🔔</span>
        <span style={{ fontSize:10, fontFamily:font, letterSpacing:"0.12em", textTransform:"uppercase", color:TEXT, fontWeight:700 }}>Alertas de Noticias</span>
        {provider && (
          <span style={{ fontSize:7, fontFamily:font, padding:"1px 5px", background:`${badgeColor}15`, color:badgeColor, border:`1px solid ${badgeColor}30`, letterSpacing:"0.08em" }}>{badgeLabel}</span>
        )}
        {cachedAge != null && (
          <span style={{ fontSize:7, fontFamily:font, padding:"1px 5px", background:`${MUTED}10`, color:MUTED, border:`1px solid ${MUTED}20`, letterSpacing:"0.06em" }}>
            hace {cachedAge < 1 ? "<1h" : cachedAge.toFixed(0) + "h"}
          </span>
        )}
        <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>Google News + RSS · Clasificación IA</span>
        {loading && <span style={{ fontSize:10, fontFamily:font, color:MUTED, marginLeft:"auto", animation:"pulse 1.5s infinite" }}>Clasificando noticias...</span>}
        {status === "error" && !alerts && !loading && <span style={{ fontSize:9, fontFamily:font, color:MUTED, marginLeft:"auto", animation:"pulse 1.5s infinite" }}>Reintentando...</span>}
      </div>
      {status === "error" && !alerts && !loading && (
        <div style={{ fontSize:11, fontFamily:font, color:MUTED, padding:"12px", textAlign:"center", border:`1px dashed ${BORDER}`, borderRadius:4 }}>
          Esperando clasificación IA — reintentando automáticamente
        </div>
      )}
      {alerts && alerts.map((a, i) => (
        <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"6px 0",
          borderTop:i>0?`1px solid ${BORDER}30`:"none", background:nivelBg[a.nivel] || "transparent" }}>
          <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{a.nivel}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontFamily:fontSans, color:TEXT, lineHeight:1.4 }}>
              {a.titular}
              <span style={{ fontSize:10, fontFamily:font, color:MUTED, marginLeft:6 }}>[{a.fuente}]</span>
            </div>
            <div style={{ display:"flex", gap:6, marginTop:3, alignItems:"center", flexWrap:"wrap" }}>
              {a.dimension && (
                <span style={{ fontSize:8, fontFamily:font, padding:"1px 6px", letterSpacing:"0.06em",
                  color:dimColor[a.dimension] || MUTED, background:`${dimColor[a.dimension] || MUTED}12`,
                  border:`1px solid ${dimColor[a.dimension] || MUTED}25` }}>
                  {a.dimension}
                </span>
              )}
              {a.impacto && <span style={{ fontSize:10, fontFamily:font, color:MUTED, fontStyle:"italic" }}>{a.impacto}</span>}
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
});
