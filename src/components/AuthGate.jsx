import { SignIn, SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";
import { useIsMobile } from "../hooks/useIsMobile";

// ── Colores consistentes con el dashboard ──
const BG      = "#f4f6f9";
const BG2     = "#ffffff";
const BORDER  = "#d0d7e0";
const TEXT    = "#1a202c";
const MUTED   = "#5a6a7a";
const ACCENT  = "#0468B1";
const font    = "'Space Mono', monospace";
const fontSans= "'DM Sans', sans-serif";

// ── Botón de logout visible en el dashboard ──
export function UserButton() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const mob = useIsMobile();

  if (!user) return null;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      {!mob && (
        <span style={{
          fontSize: 10,
          fontFamily: font,
          color: MUTED,
          letterSpacing: "0.04em",
          maxWidth: 160,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {user.primaryEmailAddress?.emailAddress}
        </span>
      )}
      <button
        onClick={() => signOut()}
        title="Cerrar sesión"
        style={{
          background: "transparent",
          border: `1px solid ${BORDER}`,
          borderRadius: 4,
          padding: mob ? "3px 6px" : "3px 8px",
          fontSize: 9,
          fontFamily: font,
          color: MUTED,
          cursor: "pointer",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = ACCENT;
          e.currentTarget.style.color = ACCENT;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = BORDER;
          e.currentTarget.style.color = MUTED;
        }}
      >
        Salir
      </button>
    </div>
  );
}

// ── Pantalla de login ──
function LoginScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: BG,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: fontSans,
      padding: 24,
    }}>
      {/* Fondo sutil */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${ACCENT}08 0%, transparent 70%)`,
      }} />

      {/* Card principal */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 420,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
      }}>

        {/* Header institucional */}
        <div style={{ textAlign: "center", width: "100%" }}>
          {/* Logo / badge PNUD */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 16px",
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            background: BG2,
            marginBottom: 24,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: ACCENT,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: "#fff", fontWeight: 700,
            }}>
              🇺🇳
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 10, fontFamily: font, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase" }}>PNUD Venezuela</div>
              <div style={{ fontSize: 9, color: MUTED, fontFamily: font }}>Uso interno · Acceso restringido</div>
            </div>
          </div>

          <h1 style={{
            fontSize: 26,
            fontWeight: 800,
            color: TEXT,
            margin: "0 0 6px",
            fontFamily: fontSans,
            lineHeight: 1.2,
          }}>
            Monitor de Contexto
          </h1>
          <p style={{
            fontSize: 13,
            color: MUTED,
            margin: 0,
            fontFamily: fontSans,
            lineHeight: 1.5,
          }}>
            Venezuela 2026 · Situacional
          </p>
        </div>

        {/* Clerk SignIn embebido */}
        <div style={{ width: "100%" }}>
          <SignIn
            appearance={{
              layout: {
                logoPlacement: "none",
                socialButtonsPlacement: "bottom",
                socialButtonsVariant: "iconButton",
              },
              variables: {
                colorPrimary: ACCENT,
                colorBackground: BG2,
                colorInputBackground: BG,
                colorInputText: TEXT,
                colorText: TEXT,
                colorTextSecondary: MUTED,
                colorNeutral: BORDER,
                borderRadius: "6px",
                fontFamily: fontSans,
                fontSize: "14px",
              },
              elements: {
                card: {
                  boxShadow: `0 2px 16px rgba(4,104,177,0.08)`,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  padding: "28px 28px",
                },
                headerTitle: { display: "none" },
                headerSubtitle: {
                  fontSize: 12,
                  color: MUTED,
                  fontFamily: font,
                  letterSpacing: "0.04em",
                  textAlign: "center",
                  marginBottom: 16,
                },
                formFieldInput: {
                  fontSize: 13,
                  fontFamily: fontSans,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 4,
                  background: BG,
                },
                formButtonPrimary: {
                  background: ACCENT,
                  fontSize: 12,
                  fontFamily: font,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  borderRadius: 4,
                  height: 38,
                },
                footerAction: { display: "none" },
                identityPreviewEditButton: { color: ACCENT },
                formResendCodeLink: { color: ACCENT },
                otpCodeFieldInput: {
                  border: `1px solid ${BORDER}`,
                  borderRadius: 4,
                  background: BG,
                  fontSize: 20,
                  fontFamily: font,
                  color: TEXT,
                },
              },
            }}
          />
        </div>

        {/* Footer */}
        <p style={{
          fontSize: 10,
          color: MUTED,
          fontFamily: font,
          textAlign: "center",
          letterSpacing: "0.04em",
          lineHeight: 1.6,
          margin: 0,
        }}>
          Acceso autorizado únicamente para personal PNUD Venezuela
          <br />y colaboradores habilitados · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

// ── Componente principal que envuelve la app ──
export function AuthGate({ children }) {
  return (
    <>
      <SignedOut>
        <LoginScreen />
      </SignedOut>
      <SignedIn>
        {children}
      </SignedIn>
    </>
  );
}
