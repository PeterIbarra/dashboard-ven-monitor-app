import { useState, useRef, useEffect } from "react";
import { BG2, BG3, BORDER, TEXT, MUTED, ACCENT, SEM, font, fontSans } from "../constants";

const SYSTEM_PROMPT = `Eres el asistente analítico del Monitor de Contexto Situacional Venezuela 2026 del PNUD.
Tienes acceso completo al dashboard: historial semanal S1–S15, señales activas por escenario, indicadores, drivers semanales, SITREPs y análisis prospectivos.
Responde siempre en español. Sé analítico, preciso y conciso. Cita datos del dashboard cuando los tengas.
Cuando hagas recomendaciones para el PNUD, diferencia por escenario y área programática.
No inventes datos — si no tienes información suficiente, indícalo.`;

const SUGGESTED = [
  "¿Cuál es el escenario dominante esta semana y por qué?",
  "¿Qué implicaciones tiene E3 para el portafolio del PNUD?",
  "¿Cómo ha evolucionado la situación desde enero?",
  "¿Qué señales deberían preocuparnos más esta semana?",
  "¿Qué pasó con las IFIs en las últimas semanas?",
];

// ── context builder ──────────────────────────────────────────────────────────

function buildContext({ weeks, liveData, signals, weekDrivers, indicators, sitrep, prospectiva }) {
  const lines = [];

  // Historial semanal compacto
  lines.push("=== HISTORIAL SEMANAL (S1–S" + weeks.length + ") ===");
  weeks.forEach((w, i) => {
    const dom = w.probs?.reduce((a, b) => (a.v > b.v ? a : b));
    const prob = dom ? `E${dom.sc} ${dom.v}%` : "";
    const sintesis = w.lectura ? w.lectura.slice(0, 130) + "..." : "";
    lines.push(`S${i + 1} (${w.label}): dom ${prob} | ${sintesis}`);
  });

  // Señales activas por escenario
  lines.push("\n=== SEÑALES ACTIVAS (semana actual) ===");
  signals.forEach((group) => {
    const live = group.signals.filter((s) => !s.vigpierde);
    lines.push(`\n${group.esc} — ${live.length} señales:`);
    live.forEach((s) => {
      lines.push(`  [${s.sem}] ${s.name}: ${s.val}`);
    });
  });

  // Drivers semana actual (primeros 3 por escenario)
  lines.push("\n=== DRIVERS SEMANA ACTUAL ===");
  Object.entries(weekDrivers).forEach(([escId, data]) => {
    if (!data.drivers?.length) return;
    lines.push(`\nE${escId} (${data.label}):`);
    data.drivers.slice(0, 3).forEach((d) => {
      const txt = typeof d === "string" ? d : d.text || "";
      lines.push("  · " + txt.slice(0, 180));
    });
    if (data.signals?.length) {
      lines.push("  Señales a monitorear:");
      data.signals.slice(0, 3).forEach((s) => lines.push("    → " + s.slice(0, 120)));
    }
  });

  // Indicadores (estado actual)
  lines.push("\n=== INDICADORES (estado S actual) ===");
  const dims = {};
  indicators.forEach((ind) => {
    if (!dims[ind.dim]) dims[ind.dim] = [];
    dims[ind.dim].push(`[${ind.sem || "?"}] ${ind.name}`);
  });
  Object.entries(dims).forEach(([dim, items]) => {
    lines.push(`${dim}: ${items.join(" · ")}`);
  });

  // SITREP — síntesis de todas las semanas
  lines.push("\n=== SÍNTESIS SITREP POR SEMANA ===");
  sitrep.forEach((s) => {
    const pts = (s.keyPoints || []).map((k) => k.title).join(" · ");
    lines.push(`${s.periodShort}: ${s.sintesis ? s.sintesis.slice(0, 200) : pts}`);
  });

  // Prospectiva
  if (prospectiva?.length) {
    lines.push("\n=== PROSPECTIVA ===");
    prospectiva.forEach((sess) => {
      lines.push(
        `${sess.label} (${sess.date}): dom=${sess.escDominante || "equidad"} lat=${sess.escLatente || "N/A"} — ${sess.nota}`
      );
    });
  }

  // Live data
  if (liveData?.fetched) {
    lines.push("\n=== DATOS EN TIEMPO REAL ===");
    if (liveData.dolar?.bcv) lines.push(`BCV: ${liveData.dolar.bcv} Bs/$`);
    if (liveData.dolar?.paralelo) lines.push(`Paralelo: ${liveData.dolar.paralelo} Bs/$`);
    if (liveData.dolar?.brecha) lines.push(`Brecha cambiaria: ${liveData.dolar.brecha}`);
    if (liveData.oil?.brent) lines.push(`Brent: $${liveData.oil.brent}`);
    if (liveData.oil?.wti) lines.push(`WTI: $${liveData.oil.wti}`);
  }

  return lines.join("\n");
}

// ── prompt assembler ─────────────────────────────────────────────────────────

function buildPrompt(messages, context) {
  const history = messages
    .map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`)
    .join("\n\n");

  return `${SYSTEM_PROMPT}

${context}

=== CONVERSACIÓN ===
${history}

Asistente:`;
}

// ── component ─────────────────────────────────────────────────────────────────

export function ChatBot({ weeks, liveData, signals, weekDrivers, indicators, sitrep, prospectiva }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const context = buildContext({ weeks, liveData, signals, weekDrivers, indicators, sitrep, prospectiva });

  async function send(text) {
    const question = text.trim();
    if (!question || loading) return;

    const newMessages = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const prompt = buildPrompt(newMessages, context);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, max_tokens: 1200 }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Error al consultar la IA");
        setMessages((prev) => prev.slice(0, -1)); // remove failed user msg
        return;
      }

      setProvider(data.provider);
      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (err) {
      setError("Sin conexión con el servidor.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  // ── styles ──

  const panelStyle = {
    position: "fixed",
    bottom: 80,
    right: 20,
    width: 380,
    maxWidth: "calc(100vw - 32px)",
    maxHeight: "70vh",
    background: BG2,
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    display: "flex",
    flexDirection: "column",
    zIndex: 1000,
    overflow: "hidden",
  };

  const fabStyle = {
    position: "fixed",
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: ACCENT,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1001,
    boxShadow: "0 4px 12px rgba(4,104,177,0.35)",
    transition: "transform 0.15s",
    color: "white",
    fontSize: 22,
  };

  return (
    <>
      {/* ── FAB button ── */}
      <button
        style={fabStyle}
        onClick={() => setOpen((v) => !v)}
        title="Asistente del Monitor"
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open ? "✕" : "💬"}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div style={panelStyle}>

          {/* Header */}
          <div style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${BORDER}`,
            background: `linear-gradient(135deg, ${ACCENT}12, ${BG3})`,
            flexShrink: 0,
          }}>
            <div style={{ fontFamily: font, fontSize: 12, color: ACCENT, marginBottom: 2 }}>
              ASISTENTE · MONITOR VEN 2026
            </div>
            <div style={{ fontFamily: fontSans, fontSize: 12, color: MUTED }}>
              Consultas sobre el dashboard · S1–S{weeks.length} en contexto
            </div>
            {provider && (
              <div style={{ fontFamily: font, fontSize: 9, color: MUTED, marginTop: 4 }}>
                vía {provider}
              </div>
            )}
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Empty state — suggested questions */}
            {messages.length === 0 && (
              <div>
                <div style={{ fontFamily: fontSans, fontSize: 12, color: MUTED, marginBottom: 10 }}>
                  Pregunta sobre el contexto situacional, escenarios o implicaciones para el portafolio del PNUD.
                </div>
                {SUGGESTED.map((q, i) => (
                  <button key={i} onClick={() => send(q)} style={{
                    display: "block", width: "100%", textAlign: "left",
                    fontFamily: fontSans, fontSize: 11, color: ACCENT,
                    background: `${ACCENT}08`, border: `1px solid ${ACCENT}25`,
                    borderRadius: 8, padding: "7px 10px", marginBottom: 6,
                    cursor: "pointer", lineHeight: 1.4,
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = `${ACCENT}15`)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = `${ACCENT}08`)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                flexDirection: "column",
                alignItems: m.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "88%",
                  fontFamily: fontSans,
                  fontSize: 12,
                  lineHeight: 1.6,
                  padding: "8px 12px",
                  borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                  background: m.role === "user" ? ACCENT : BG3,
                  color: m.role === "user" ? "white" : TEXT,
                  border: m.role === "user" ? "none" : `1px solid ${BORDER}`,
                  whiteSpace: "pre-wrap",
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{
                  background: BG3, border: `1px solid ${BORDER}`,
                  borderRadius: "12px 12px 12px 3px", padding: "8px 14px",
                  fontFamily: font, fontSize: 11, color: MUTED,
                }}>
                  <span style={{ animation: "pulse 1.2s infinite" }}>analizando</span>
                  <span style={{ display: "inline-block", width: 18, overflow: "hidden", animation: "dots 1.2s steps(4,end) infinite" }}>...</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                fontFamily: fontSans, fontSize: 11, color: SEM.red,
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 8, padding: "7px 10px",
              }}>
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{
            padding: "10px 12px",
            borderTop: `1px solid ${BORDER}`,
            display: "flex",
            gap: 8,
            flexShrink: 0,
            background: BG2,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Pregunta sobre el dashboard..."
              rows={1}
              style={{
                flex: 1,
                fontFamily: fontSans,
                fontSize: 12,
                color: TEXT,
                background: BG3,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: "8px 10px",
                resize: "none",
                outline: "none",
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              style={{
                fontFamily: font,
                fontSize: 11,
                background: input.trim() && !loading ? ACCENT : BG3,
                color: input.trim() && !loading ? "white" : MUTED,
                border: `1px solid ${input.trim() && !loading ? ACCENT : BORDER}`,
                borderRadius: 8,
                padding: "0 14px",
                cursor: input.trim() && !loading ? "pointer" : "default",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              ↑
            </button>
          </div>

          {/* Clear conversation */}
          {messages.length > 0 && (
            <div style={{
              padding: "4px 12px 8px",
              textAlign: "right",
              background: BG2,
              flexShrink: 0,
            }}>
              <button onClick={() => { setMessages([]); setProvider(null); setError(null); }} style={{
                fontFamily: font, fontSize: 9, color: MUTED,
                background: "transparent", border: "none", cursor: "pointer",
              }}>
                limpiar conversación
              </button>
            </div>
          )}

        </div>
      )}

      <style>{`
        @keyframes dots {
          0%, 20% { content: '.'; }
          40% { content: '..'; }
          60%, 100% { content: '...'; }
        }
      `}</style>
    </>
  );
}
