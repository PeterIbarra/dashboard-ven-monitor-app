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

// ── markdown renderer ─────────────────────────────────────────────────────────

function renderMarkdown(raw) {
  const lines = raw.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table block: starts with |
    if (line.trim().startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      // filter out separator rows (---|---)
      const rows = tableLines.filter(l => !/^\s*\|[\s\-|:]+\|\s*$/.test(l));
      if (rows.length > 0) {
        const tableStyle = `style="width:100%;border-collapse:collapse;font-size:11px;margin:8px 0"`;
        const cellStyle = (header) =>
          header
            ? `style="text-align:left;padding:5px 8px;border:1px solid #d0d7e0;background:#eef1f5;font-weight:600;color:#5a6a7a;white-space:nowrap"`
            : `style="text-align:left;padding:5px 8px;border:1px solid #d0d7e0;color:#1a202c;vertical-align:top"`;
        let tableHtml = `<table ${tableStyle}>`;
        rows.forEach((row, ri) => {
          const cells = row.split("|").map(c => c.trim()).filter((c, ci, arr) => ci > 0 && ci < arr.length - 1);
          const tag = ri === 0 ? "th" : "td";
          tableHtml += `<tr>${cells.map(c => `<${tag} ${cellStyle(ri === 0)}>${renderInline(c)}</${tag}>`).join("")}</tr>`;
        });
        tableHtml += "</table>";
        out.push(tableHtml);
      }
      continue;
    }

    // Headings (####, ###, ##, #) — render as bold text, no literal #
    const headingMatch = line.match(/^#{1,4} (.+)$/);
    if (headingMatch) {
      out.push(`<div style="font-weight:700;margin:8px 0 4px;color:#1a202c">${renderInline(headingMatch[1])}</div>`);
      i++;
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[\-\*] (.+)$/);
    if (ulMatch) {
      out.push(`<div style="padding-left:12px;margin:2px 0">&#8226;&nbsp;${renderInline(ulMatch[1])}</div>`);
      i++;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\d+)\. (.+)$/);
    if (olMatch) {
      out.push(`<div style="padding-left:12px;margin:2px 0">${olMatch[1]}.&nbsp;${renderInline(olMatch[2])}</div>`);
      i++;
      continue;
    }

    // Blank line → paragraph break
    if (line.trim() === "") {
      out.push("<div style='height:6px'></div>");
      i++;
      continue;
    }

    // Normal paragraph
    out.push(`<div style="margin:2px 0">${renderInline(line)}</div>`);
    i++;
  }

  return out.join("");
}

function renderInline(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, `<code style="background:#eef1f5;padding:1px 4px;border-radius:3px;font-size:10px">$1</code>`);
}

// ── context builder ──────────────────────────────────────────────────────────

function buildContext({ weeks, liveData, signals, weekDrivers, indicators, sitrep, prospectiva }) {
  const lines = [];

  // Historial semanal con probabilidades explícitas por escenario
  lines.push("=== HISTORIAL SEMANAL (S1–S" + weeks.length + ") ===");
  lines.push("NOTA: Las probabilidades son E1=Transición, E2=Colapso, E3=Continuidad, E4=Resistencia.");
  weeks.forEach((w, i) => {
    const sNum = `S${i + 1}`;
    // Probabilities: build full breakdown, not just dominant
    const probStr = w.probs
      ? w.probs
          .slice()
          .sort((a, b) => b.v - a.v)
          .map((p) => `E${p.sc}=${p.v}%`)
          .join(", ")
      : "sin datos";
    const sintesis = w.lectura ? w.lectura.slice(0, 130) + "..." : "";
    lines.push(`${sNum} (${w.label}) → Probabilidades: [${probStr}] | ${sintesis}`);
  });
  // Resumen explícito de semana actual
  const lastWeek = weeks[weeks.length - 1];
  if (lastWeek?.probs) {
    const sorted = [...lastWeek.probs].sort((a, b) => b.v - a.v);
    lines.push(`\nSEMANA ACTUAL (${lastWeek.label}) — desglose exacto:`);
    sorted.forEach((p) => {
      const names = { 1: "Transición democrática", 2: "Colapso y fragmentación", 3: "Continuidad negociada", 4: "Resistencia y escalada" };
      lines.push(`  E${p.sc} (${names[p.sc] || ""}): ${p.v}%`);
    });
  }

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
  const [expanded, setExpanded] = useState(false);
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
        body: JSON.stringify({ prompt, max_tokens: 2500 }),
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

  const panelStyle = expanded ? {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    width: "100vw", height: "100vh",
    maxWidth: "none", maxHeight: "none",
    background: BG2,
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    display: "flex",
    flexDirection: "column",
    zIndex: 1000,
    overflow: "hidden",
  } : {
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
      {/* ── FAB button — oculto en pantalla completa ── */}
      {!expanded && (
        <button
          style={fabStyle}
          onClick={() => setOpen((v) => !v)}
          title="Asistente del Monitor"
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {open ? "✕" : "💬"}
        </button>
      )}

      {/* ── Chat panel ── */}
      {open && (
        <div style={panelStyle}>

          {/* Header */}
          <div style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${BORDER}`,
            background: `linear-gradient(135deg, ${ACCENT}12, ${BG3})`,
            flexShrink: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}>
            <div>
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
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
              {messages.length > 0 && (
                <button onClick={() => { setMessages([]); setProvider(null); setError(null); }} style={{
                  fontFamily: font, fontSize: 9, color: MUTED,
                  background: "transparent", border: `1px solid ${BORDER}`,
                  borderRadius: 6, padding: "3px 8px", cursor: "pointer",
                }}>
                  limpiar
                </button>
              )}
              <button
                onClick={() => setExpanded(v => !v)}
                title={expanded ? "Modo ventana" : "Pantalla completa"}
                style={{
                  background: "transparent", border: `1px solid ${BORDER}`,
                  borderRadius: 6, width: 26, height: 26, cursor: "pointer",
                  color: MUTED, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {expanded ? "⊡" : "⊞"}
              </button>
              <button
                onClick={() => { setOpen(false); setExpanded(false); }}
                title="Cerrar"
                style={{
                  background: "transparent", border: `1px solid ${BORDER}`,
                  borderRadius: 6, width: 26, height: 26, cursor: "pointer",
                  color: MUTED, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: "auto", padding: expanded ? "20px calc(50% - 380px)" : "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>

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
                  whiteSpace: m.role === "user" ? "pre-wrap" : "normal",
                }}
                  dangerouslySetInnerHTML={m.role === "assistant"
                    ? { __html: renderMarkdown(m.content) }
                    : undefined
                  }
                >
                  {m.role === "user" ? m.content : undefined}
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
