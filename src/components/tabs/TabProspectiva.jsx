import { useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { SCENARIO_SIGNALS } from "../../data/indicators.js";
import {
  PROSPECTIVA_SESSIONS,
  PROSPECTIVA_ESCENARIOS,
  COMPARATIVE_TABLE,
  CONSIDERACIONES_FINALES,
} from "../../data/prospectiva.js";
import { SC, SEM, BG2, BG3, BORDER, TEXT, MUTED, ACCENT, font, fontSans } from "../../constants";

// ── helpers ──────────────────────────────────────────────────────────────────

function activeSignals(escId, tipo) {
  const group = SCENARIO_SIGNALS.find((g) => g.esc === escId);
  if (!group) return { active: 0, total: 0, list: [] };
  const live = group.signals.filter((s) => !s.vigpierde);
  const active = live.filter((s) =>
    tipo === "positivo" ? s.sem === "green" : s.sem === "red"
  );
  return { active: active.length, total: live.length, list: live };
}

function ProxBar({ pct, color }) {
  return (
    <div style={{ background: BG3, borderRadius: 4, height: 6, overflow: "hidden", margin: "4px 0 8px" }}>
      <div style={{ width: `${Math.round(pct * 100)}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
    </div>
  );
}

function SigDot({ sem }) {
  const colors = { green: SEM.green, yellow: SEM.yellow, red: SEM.red };
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7, borderRadius: "50%",
      background: colors[sem] || BORDER, flexShrink: 0, marginTop: 2,
    }} />
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function TabProspectiva() {
  const mob = useIsMobile();
  const [selEsc, setSelEsc] = useState(null);

  const lastSession = PROSPECTIVA_SESSIONS[PROSPECTIVA_SESSIONS.length - 1];
  const prevSession = PROSPECTIVA_SESSIONS.length > 1
    ? PROSPECTIVA_SESSIONS[PROSPECTIVA_SESSIONS.length - 2]
    : null;

  const escColors = { E1: SC[1], E2: SC[2], E3: SC[3], E4: SC[4] };
  const escNums   = { E1: 1,     E2: 2,     E3: 3,     E4: 4 };

  const card = (children, extra = {}) => (
    <div style={{
      background: BG2, border: `1px solid ${BORDER}`,
      borderRadius: 10, padding: "16px 20px", ...extra,
    }}>
      {children}
    </div>
  );

  const sectionTitle = (icon, label) => (
    <div style={{
      fontFamily: fontSans, fontSize: 13, fontWeight: 700, color: MUTED,
      textTransform: "uppercase", letterSpacing: "0.06em",
      marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${BORDER}`,
      display: "flex", alignItems: "center", gap: 6,
    }}>
      <span>{icon}</span>{label}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── CABECERA ── */}
      <div style={{
        background: `linear-gradient(135deg, ${ACCENT}12, ${BG3})`,
        border: `1px solid ${ACCENT}30`, borderRadius: 10, padding: "14px 18px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8,
      }}>
        <div>
          <div style={{ fontFamily: font, fontSize: 12, color: ACCENT, marginBottom: 2 }}>
            SESIÓN ACTIVA — {lastSession.label.toUpperCase()} · {lastSession.date.toUpperCase()}
          </div>
          <div style={{ fontFamily: fontSans, fontSize: 14, color: TEXT }}>
            {lastSession.nota}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PROSPECTIVA_ESCENARIOS.map((e) => {
            const isDom = lastSession.escDominante === e.esc;
            const isLat = lastSession.escLatente === e.esc;
            if (!isDom && !isLat) return null;
            return (
              <span key={e.esc} style={{
                fontFamily: font, fontSize: 10,
                background: isDom ? escColors[e.esc] + "20" : BG3,
                color: isDom ? escColors[e.esc] : MUTED,
                border: `1px solid ${isDom ? escColors[e.esc] + "50" : BORDER}`,
                borderRadius: 20, padding: "3px 10px",
              }}>
                {e.esc} {isDom ? "Dominante" : "Latente"}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── GRID ESCENARIOS ── */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12 }}>
        {PROSPECTIVA_ESCENARIOS.map((e) => {
          const color = escColors[e.esc];
          const { active, total, list } = activeSignals(e.esc, e.tipo);
          const pct = total > 0 ? active / total : 0;
          const isDom = lastSession.escDominante === e.esc;
          const isLat = lastSession.escLatente === e.esc;
          const expanded = selEsc === e.esc;

          return (
            <div key={e.esc} style={{
              background: BG2,
              border: isDom ? `2px solid ${color}` : `1px solid ${BORDER}`,
              borderRadius: 10, padding: "14px 16px",
              cursor: "pointer", transition: "box-shadow 0.15s",
            }}
              onClick={() => setSelEsc(expanded ? null : e.esc)}
            >
              {/* header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div>
                  <span style={{
                    fontFamily: font, fontSize: 10, color,
                    background: color + "18", border: `1px solid ${color}40`,
                    borderRadius: 20, padding: "2px 8px", marginRight: 6,
                  }}>{e.esc}</span>
                  <span style={{ fontFamily: fontSans, fontSize: 13, fontWeight: 700, color: TEXT }}>{e.nombre}</span>
                </div>
                {isDom && (
                  <span style={{ fontFamily: font, fontSize: 9, color, background: color + "15", border: `1px solid ${color}40`, borderRadius: 20, padding: "2px 8px" }}>
                    Dominante
                  </span>
                )}
                {isLat && !isDom && (
                  <span style={{ fontFamily: font, fontSize: 9, color: "#d4850a", background: "#d4850a15", border: "1px solid #d4850a40", borderRadius: 20, padding: "2px 8px" }}>
                    Latente
                  </span>
                )}
              </div>
              <div style={{ fontFamily: fontSans, fontSize: 11, color: MUTED, marginBottom: 10 }}>{e.sub}</div>

              {/* barra proximidad */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontFamily: font, fontSize: 9, color: MUTED }}>SEÑALES ACTIVAS</span>
                <span style={{ fontFamily: font, fontSize: 10, color, fontWeight: 700 }}>{active} / {total}</span>
              </div>
              <ProxBar pct={pct} color={color} />

              {/* lista señales */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
                {list.slice(0, expanded ? list.length : 4).map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <SigDot sem={s.sem} />
                    <span style={{ fontFamily: fontSans, fontSize: 11, color: TEXT, lineHeight: 1.4 }}>{s.name}</span>
                    {s.isNew && (
                      <span style={{ fontFamily: font, fontSize: 8, color: ACCENT, background: ACCENT + "15", borderRadius: 10, padding: "1px 5px", marginLeft: 2, whiteSpace: "nowrap" }}>nuevo</span>
                    )}
                  </div>
                ))}
                {!expanded && list.length > 4 && (
                  <div style={{ fontFamily: font, fontSize: 9, color: ACCENT, marginTop: 2 }}>
                    + {list.length - 4} señales más — click para expandir
                  </div>
                )}
              </div>

              {/* implicaciones PNUD (expandido) */}
              {expanded && (
                <div style={{ marginTop: 12, background: BG3, borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ fontFamily: font, fontSize: 9, color: MUTED, marginBottom: 5 }}>IMPLICACIONES PNUD</div>
                  <div style={{ fontFamily: fontSans, fontSize: 11, color: TEXT, lineHeight: 1.5, marginBottom: 8 }}>
                    {e.implicacionesPNUD}
                  </div>
                  <div style={{ fontFamily: font, fontSize: 9, color: MUTED, marginBottom: 5 }}>LÍNEAS DE ACCIÓN</div>
                  {e.lineasAccion.map((l, i) => (
                    <div key={i} style={{ fontFamily: fontSans, fontSize: 11, color: TEXT, paddingLeft: 8, borderLeft: `2px solid ${color}40`, marginBottom: 4, lineHeight: 1.4 }}>
                      {l}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── HISTORIAL DE SESIONES ── */}
      {card(
        <>
          {sectionTitle("🗓", "Historial de sesiones prospectivas")}
          <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
            {PROSPECTIVA_SESSIONS.map((s, i) => {
              const domColor = s.escDominante ? escColors[s.escDominante] : MUTED;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: domColor, flexShrink: 0 }} />
                    <div style={{ fontFamily: font, fontSize: 10, color: domColor, whiteSpace: "nowrap" }}>{s.label}</div>
                    <div style={{ fontFamily: fontSans, fontSize: 10, color: MUTED, whiteSpace: "nowrap" }}>{s.date}</div>
                    <div style={{
                      fontFamily: fontSans, fontSize: 10, color: TEXT,
                      background: BG3, border: `1px solid ${BORDER}`, borderRadius: 6,
                      padding: "3px 8px", maxWidth: 160, textAlign: "center", lineHeight: 1.4,
                    }}>{s.nota}</div>
                  </div>
                  {i < PROSPECTIVA_SESSIONS.length - 1 && (
                    <div style={{ width: 48, height: 1, background: BORDER, margin: "0 8px", flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
            {/* sesión pendiente */}
            <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: 48, height: 1, background: BORDER, margin: "0 8px", borderStyle: "dashed", flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: BG3, border: `1px dashed ${BORDER}`, flexShrink: 0 }} />
                <div style={{ fontFamily: font, fontSize: 10, color: MUTED }}>Sesión 3</div>
                <div style={{ fontFamily: fontSans, fontSize: 10, color: MUTED }}>Pendiente</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── ANÁLISIS COMPARATIVO ── */}
      {prevSession && card(
        <>
          {sectionTitle("📊", `Análisis comparativo — ${prevSession.label} vs ${lastSession.label}`)}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: fontSans, fontSize: 12 }}>
              <thead>
                <tr style={{ background: BG3 }}>
                  <th style={{ textAlign: "left", padding: "7px 10px", color: MUTED, fontWeight: 700, borderBottom: `1px solid ${BORDER}`, fontSize: 11 }}>Dimensión</th>
                  <th style={{ textAlign: "left", padding: "7px 10px", color: MUTED, fontWeight: 700, borderBottom: `1px solid ${BORDER}`, fontSize: 11 }}>🗓 {prevSession.date}</th>
                  <th style={{ textAlign: "left", padding: "7px 10px", color: MUTED, fontWeight: 700, borderBottom: `1px solid ${BORDER}`, fontSize: 11 }}>🗓 {lastSession.date}</th>
                </tr>
              </thead>
              <tbody>
                {COMPARATIVE_TABLE.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 === 0 ? BG2 : BG3 + "60" }}>
                    <td style={{ padding: "7px 10px", color: MUTED, fontWeight: 600, fontSize: 11 }}>{row.dim}</td>
                    <td style={{ padding: "7px 10px", color: TEXT, lineHeight: 1.4 }}>{row.s1}</td>
                    <td style={{ padding: "7px 10px", color: TEXT, lineHeight: 1.4, fontWeight: 600 }}>{row.s2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── CONSIDERACIONES FINALES ── */}
      {card(
        <>
          {sectionTitle("💡", "Consideraciones finales — " + lastSession.date)}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CONSIDERACIONES_FINALES.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
                <div>
                  <div style={{ fontFamily: fontSans, fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{c.titulo}</div>
                  <div style={{ fontFamily: fontSans, fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{c.texto}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
