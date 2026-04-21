import { useState } from "react";
import { useSignIn, SignedIn, SignedOut, useClerk, useUser, UserProfile } from "@clerk/clerk-react";
import { useIsMobile } from "../hooks/useIsMobile";

const BG       = "#f4f6f9";
const BG2      = "#ffffff";
const BORDER   = "#d0d7e0";
const TEXT     = "#1a202c";
const MUTED    = "#5a6a7a";
const ACCENT   = "#0468B1";
const RED      = "#dc2626";
const GREEN    = "#16a34a";
const font     = "'Space Mono', monospace";
const fontSans = "'DM Sans', sans-serif";

// ─────────────────────────────────────────
// Modal de perfil embebido
// ─────────────────────────────────────────
function ProfileModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:9999,
        background:"rgba(0,0,0,0.45)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:16,
        backdropFilter:"blur(2px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:BG2,
          borderRadius:10,
          border:`1px solid ${BORDER}`,
          boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
          overflow:"hidden",
          maxWidth:680,
          width:"100%",
          maxHeight:"90vh",
          overflowY:"auto",
          position:"relative",
        }}
      >
        {/* Header del modal */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"14px 20px",
          borderBottom:`1px solid ${BORDER}`,
          background:BG,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>🇺🇳</span>
            <div>
              <div style={{ fontSize:10, fontFamily:font, color:ACCENT, letterSpacing:"0.1em", textTransform:"uppercase" }}>Mi perfil</div>
              <div style={{ fontSize:9, color:MUTED, fontFamily:font }}>PNUD Venezuela Monitor</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background:"transparent", border:`1px solid ${BORDER}`,
              borderRadius:4, padding:"3px 8px",
              fontSize:9, fontFamily:font, color:MUTED,
              cursor:"pointer", letterSpacing:"0.06em", textTransform:"uppercase",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=RED; e.currentTarget.style.color=RED; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.color=MUTED; }}
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Componente de perfil de Clerk estilizado */}
        <div style={{ padding:"8px 0" }}>
          <UserProfile
            appearance={{
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
                fontSize: "13px",
              },
              elements: {
                rootBox: { width:"100%" },
                card: { boxShadow:"none", border:"none", borderRadius:0 },
                navbar: { borderRight:`1px solid ${BORDER}`, background:BG },
                navbarButton: { fontFamily:fontSans, fontSize:13 },
                headerTitle: { fontFamily:fontSans, fontSize:16, fontWeight:700 },
                headerSubtitle: { fontFamily:fontSans, fontSize:12, color:MUTED },
                formButtonPrimary: {
                  background:ACCENT, fontFamily:font,
                  fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase",
                },
                formFieldInput: {
                  fontFamily:fontSans, fontSize:13,
                  border:`1px solid ${BORDER}`, background:BG,
                },
                badge: { background:ACCENT },
                profileSectionPrimaryButton: { color:ACCENT },
                accordionTriggerButton: { fontFamily:fontSans },
                // Ocultar secciones no gestionables por el usuario
                profileSection__danger: { display:"none" },
                profileSectionContent__danger: { display:"none" },
                profileSection__password: { display:"none" },
                profileSectionContent__password: { display:"none" },
                footer: { display:"none" },
              },
            }}
          />
          {/* Aviso de cambio de contraseña */}
          <div style={{
            margin:"0 20px 20px",
            padding:"12px 16px",
            background:`${ACCENT}08`,
            border:`1px solid ${ACCENT}20`,
            borderRadius:6,
            display:"flex",
            gap:10,
            alignItems:"flex-start",
          }}>
            <span style={{ fontSize:16, flexShrink:0 }}>🔑</span>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:TEXT, fontFamily:fontSans, marginBottom:3 }}>
                ¿Necesitas cambiar tu contraseña?
              </div>
              <div style={{ fontSize:11, color:MUTED, fontFamily:fontSans, lineHeight:1.6 }}>
                Por razones de seguridad, los cambios de contraseña son gestionados por el administrador del sistema.
                Escribe a{" "}
                <a
                  href="mailto:peter.ibarra@undp.org?subject=Solicitud%20cambio%20de%20contrase%C3%B1a%20-%20Monitor%20PNUD"
                  style={{ color:ACCENT, textDecoration:"none", fontWeight:600 }}
                >
                  peter.ibarra@undp.org
                </a>
                {" "}indicando tu correo de acceso y te la actualizaremos a la brevedad.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Botón de usuario en el header
// ─────────────────────────────────────────
export function UserButton() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const mob = useIsMobile();
  const [showProfile, setShowProfile] = useState(false);

  if (!user) return null;

  const email = user.primaryEmailAddress?.emailAddress || "";
  const initials = email.slice(0,2).toUpperCase();

  return (
    <>
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        {/* Avatar + correo — abre el perfil */}
        <button
          onClick={() => setShowProfile(true)}
          title="Ver perfil"
          style={{
            display:"flex", alignItems:"center", gap:6,
            background:"transparent", border:`1px solid ${BORDER}`,
            borderRadius:4, padding:mob?"3px 6px":"3px 8px",
            cursor:"pointer", transition:"all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=ACCENT; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; }}
        >
          {/* Avatar circular */}
          <div style={{
            width:18, height:18, borderRadius:"50%",
            background:ACCENT, display:"flex",
            alignItems:"center", justifyContent:"center",
            fontSize:8, color:"#fff", fontWeight:700,
            fontFamily:font, flexShrink:0,
          }}>
            {initials}
          </div>
          {!mob && (
            <span style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.04em", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {email}
            </span>
          )}
        </button>

        {/* Botón salir */}
        <button
          onClick={() => signOut({ redirectUrl:"/" })}
          title="Cerrar sesión"
          style={{
            background:"transparent", border:`1px solid ${BORDER}`,
            borderRadius:4, padding:mob?"3px 6px":"3px 8px",
            fontSize:9, fontFamily:font, color:MUTED,
            cursor:"pointer", letterSpacing:"0.06em",
            textTransform:"uppercase", transition:"all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=RED; e.currentTarget.style.color=RED; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.color=MUTED; }}
        >
          Salir
        </button>
      </div>
    </>
  );
}


// ─────────────────────────────────────────
// Pantalla de login
// ─────────────────────────────────────────
function LoginScreen() {
  const { signIn, isLoaded } = useSignIn();
  const mob = useIsMobile();

  // method: "password" | "otp"
  // step:   "email" | "password" | "code" | "forgot"
  const [method, setMethod]   = useState("password");
  const [step, setStep]       = useState("email");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode]       = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [info, setInfo]       = useState("");

  function reset() {
    setStep("email"); setPassword(""); setCode("");
    setError(""); setInfo(""); setShowPwd(false);
  }

  function handleMethodSwitch(m) {
    setMethod(m); setStep("email");
    setPassword(""); setCode(""); setError(""); setInfo("");
  }

  // ── Continuar con correo (ambos métodos) ──
  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!isLoaded || !email.trim()) return;
    setLoading(true); setError(""); setInfo("");
    try {
      if (method === "password") {
        // Verificar que el correo existe antes de pedir contraseña
        await signIn.create({ identifier: email.trim() });
        setStep("password");
      } else {
        // OTP
        await signIn.create({ identifier: email.trim(), strategy: "email_code" });
        setStep("code");
      }
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "";
      if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("no account") || msg.toLowerCase().includes("identifier")) {
        setError("Este correo no tiene acceso autorizado. Contacta al administrador.");
      } else {
        setError(msg || "No se pudo continuar. Intenta de nuevo.");
      }
    } finally { setLoading(false); }
  }

  // ── Login con contraseña ──
  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!isLoaded || !password.trim()) return;
    setLoading(true); setError("");
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "password",
        password: password,
      });
      if (result.status === "complete") {
        window.location.href = "/";
      } else {
        setError("Autenticación incompleta. Intenta de nuevo.");
      }
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "";
      if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("invalid")) {
        setError("Contraseña incorrecta. Verifica e intenta de nuevo.");
      } else if (msg.toLowerCase().includes("locked")) {
        setError("Cuenta bloqueada temporalmente. Intenta más tarde o usa el código por correo.");
      } else {
        setError(msg || "Error de autenticación.");
      }
    } finally { setLoading(false); }
  }

  // ── Verificar código OTP ──
  async function handleCodeSubmit(e) {
    e.preventDefault();
    if (!isLoaded || code.length < 6) return;
    setLoading(true); setError("");
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code: code.trim(),
      });
      if (result.status === "complete") {
        window.location.href = "/";
      } else {
        setError("Verificación incompleta. Intenta de nuevo.");
      }
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "";
      if (msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("invalid")) {
        setError("Código incorrecto. Verifica e intenta de nuevo.");
      } else if (msg.toLowerCase().includes("expired")) {
        setError("El código expiró. Solicita uno nuevo.");
        setStep("email"); setCode("");
      } else {
        setError(msg || "Error de verificación.");
      }
    } finally { setLoading(false); }
  }

  // ── Olvidé mi contraseña → enviar OTP ──
  async function handleForgotPassword() {
    setLoading(true); setError(""); setInfo("");
    try {
      await signIn.create({ identifier: email.trim(), strategy: "email_code" });
      setStep("code");
      setMethod("otp");
      setInfo("Te enviamos un código de 6 dígitos para que puedas ingresar.");
    } catch {
      setError("No se pudo enviar el código. Intenta de nuevo.");
    } finally { setLoading(false); }
  }

  // ── Reenviar código OTP ──
  async function handleResend() {
    setLoading(true); setError(""); setCode(""); setInfo("");
    try {
      await signIn.create({ identifier: email.trim(), strategy: "email_code" });
      setInfo("Código reenviado.");
    } catch { setError("No se pudo reenviar el código."); }
    finally { setLoading(false); }
  }

  // ── Estilos reutilizables ──
  const inputStyle = {
    width:"100%", boxSizing:"border-box",
    padding:"10px 12px", fontSize:13,
    fontFamily:fontSans, color:TEXT,
    background:BG, border:`1px solid ${BORDER}`,
    borderRadius:4, outline:"none",
    transition:"border-color 0.15s",
  };
  const btnPrimary = {
    width:"100%", padding:"11px 0",
    background: loading ? `${ACCENT}70` : ACCENT,
    color:"#fff", border:"none", borderRadius:4,
    fontSize:11, fontFamily:font,
    letterSpacing:"0.1em", textTransform:"uppercase",
    cursor: loading ? "not-allowed" : "pointer",
    transition:"opacity 0.15s", marginTop:4,
  };
  const tabStyle = (active) => ({
    flex:1, padding:"8px 0",
    background: active ? BG2 : "transparent",
    border: active ? `1px solid ${BORDER}` : "1px solid transparent",
    borderRadius:4, fontSize:10,
    fontFamily:font, color: active ? ACCENT : MUTED,
    letterSpacing:"0.06em", textTransform:"uppercase",
    cursor:"pointer", transition:"all 0.15s",
    fontWeight: active ? 700 : 400,
  });

  return (
    <div style={{ minHeight:"100vh", background:BG, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:fontSans, padding:24 }}>

      {/* Fondo sutil */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", background:`radial-gradient(ellipse 70% 50% at 50% 0%, ${ACCENT}08 0%, transparent 70%)` }} />

      <div style={{ position:"relative", width:"100%", maxWidth:400, display:"flex", flexDirection:"column", alignItems:"center", gap:28 }}>

        {/* Badge institucional */}
        <div style={{ textAlign:"center" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"7px 16px", border:`1px solid ${BORDER}`, borderRadius:6, background:BG2, marginBottom:20 }}>
            <span style={{ fontSize:18 }}>🇺🇳</span>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontSize:10, fontFamily:font, color:ACCENT, letterSpacing:"0.1em", textTransform:"uppercase" }}>PNUD Venezuela</div>
              <div style={{ fontSize:9, color:MUTED, fontFamily:font }}>Uso interno · Acceso restringido</div>
            </div>
          </div>
          <h1 style={{ fontSize:24, fontWeight:800, color:TEXT, margin:"0 0 4px", lineHeight:1.2 }}>Monitor de Contexto</h1>
          <p style={{ fontSize:13, color:MUTED, margin:0 }}>Venezuela 2026 · Situacional</p>
        </div>

        {/* Card */}
        <div style={{ width:"100%", background:BG2, border:`1px solid ${BORDER}`, borderRadius:8, padding:mob?"24px 20px":"28px 28px", boxShadow:"0 2px 16px rgba(4,104,177,0.07)" }}>

          {/* Selector de método — solo en paso email */}
          {step === "email" && (
            <div style={{ display:"flex", gap:4, padding:4, background:BG, borderRadius:6, marginBottom:20 }}>
              <button type="button" onClick={() => handleMethodSwitch("password")} style={tabStyle(method==="password")}>
                🔑 Contraseña
              </button>
              <button type="button" onClick={() => handleMethodSwitch("otp")} style={tabStyle(method==="otp")}>
                📧 Código
              </button>
            </div>
          )}

          {/* ── PASO EMAIL (ambos métodos) ── */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.06em", marginBottom:8, textTransform:"uppercase" }}>
                  Correo electrónico
                </div>
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="nombre@undp.org"
                  required autoFocus style={inputStyle}
                  onFocus={e => e.target.style.borderColor=ACCENT}
                  onBlur={e => e.target.style.borderColor=BORDER}
                />
              </div>
              {error && <ErrorBox msg={error} />}
              <button type="submit" disabled={loading || !email.trim()} style={btnPrimary}>
                {loading ? "Verificando..." : "Continuar →"}
              </button>
              <div style={{ fontSize:11, fontFamily:font, color:MUTED, textAlign:"center", lineHeight:1.6 }}>
                {method === "password"
                  ? "Ingresa con tu contraseña de acceso"
                  : "Recibirás un código de 6 dígitos en tu correo"}
              </div>
            </form>
          )}

          {/* ── PASO CONTRASEÑA ── */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ fontSize:12, color:MUTED, fontFamily:fontSans, marginBottom:2 }}>
                Ingresando como <strong style={{ color:TEXT }}>{email}</strong>
              </div>
              <div>
                <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.06em", marginBottom:8, textTransform:"uppercase" }}>
                  Contraseña
                </div>
                <div style={{ position:"relative" }}>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••"
                    required autoFocus
                    style={{ ...inputStyle, paddingRight:38 }}
                    onFocus={e => e.target.style.borderColor=ACCENT}
                    onBlur={e => e.target.style.borderColor=BORDER}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:14, color:MUTED, padding:0, lineHeight:1 }}
                  >
                    {showPwd ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              {error && <ErrorBox msg={error} />}
              <button type="submit" disabled={loading || !password.trim()} style={btnPrimary}>
                {loading ? "Ingresando..." : "Ingresar →"}
              </button>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:2 }}>
                <button type="button" onClick={reset}
                  style={{ background:"none", border:"none", fontSize:11, fontFamily:font, color:MUTED, cursor:"pointer", letterSpacing:"0.04em" }}>
                  ← Cambiar correo
                </button>
                <button type="button" onClick={handleForgotPassword} disabled={loading}
                  style={{ background:"none", border:"none", fontSize:11, fontFamily:font, color:ACCENT, cursor:"pointer", letterSpacing:"0.04em" }}>
                  Olvidé mi contraseña
                </button>
              </div>
            </form>
          )}

          {/* ── PASO CÓDIGO OTP ── */}
          {step === "code" && (
            <form onSubmit={handleCodeSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ textAlign:"center", paddingBottom:4 }}>
                <div style={{ fontSize:11, fontFamily:font, color:GREEN, letterSpacing:"0.06em", marginBottom:6 }}>✓ CÓDIGO ENVIADO</div>
                <div style={{ fontSize:13, color:MUTED, lineHeight:1.5 }}>
                  Ingresa el código de 6 dígitos enviado a<br />
                  <strong style={{ color:TEXT }}>{email}</strong>
                </div>
              </div>
              {info && <div style={{ fontSize:11, color:GREEN, fontFamily:font, textAlign:"center", padding:"6px 10px", background:`${GREEN}08`, border:`1px solid ${GREEN}20`, borderRadius:4 }}>{info}</div>}
              <div>
                <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.06em", marginBottom:8, textTransform:"uppercase" }}>Código de verificación</div>
                <input
                  type="text" inputMode="numeric" pattern="[0-9]*"
                  maxLength={6} value={code}
                  onChange={e => { setCode(e.target.value.replace(/\D/g,"")); setError(""); }}
                  placeholder="000000" required autoFocus
                  style={{ ...inputStyle, fontSize:22, fontFamily:font, textAlign:"center", letterSpacing:"0.3em" }}
                  onFocus={e => e.target.style.borderColor=ACCENT}
                  onBlur={e => e.target.style.borderColor=BORDER}
                />
              </div>
              {error && <ErrorBox msg={error} />}
              <button type="submit" disabled={loading || code.length < 6} style={btnPrimary}>
                {loading ? "Verificando..." : "Ingresar al dashboard →"}
              </button>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:2 }}>
                <button type="button" onClick={reset}
                  style={{ background:"none", border:"none", fontSize:11, fontFamily:font, color:MUTED, cursor:"pointer", letterSpacing:"0.04em" }}>
                  ← Volver
                </button>
                <button type="button" onClick={handleResend} disabled={loading}
                  style={{ background:"none", border:"none", fontSize:11, fontFamily:font, color:ACCENT, cursor:"pointer", letterSpacing:"0.04em" }}>
                  Reenviar código
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p style={{ fontSize:10, color:MUTED, fontFamily:font, textAlign:"center", letterSpacing:"0.04em", lineHeight:1.6, margin:0 }}>
          Acceso autorizado únicamente para personal PNUD Venezuela<br />y colaboradores habilitados · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

function ErrorBox({ msg }) {
  const RED = "#dc2626";
  return (
    <div style={{ fontSize:11, color:RED, fontFamily:"'Space Mono', monospace", lineHeight:1.5, padding:"8px 10px", background:`${RED}08`, border:`1px solid ${RED}20`, borderRadius:4 }}>
      {msg}
    </div>
  );
}

// ─────────────────────────────────────────
// Gate principal
// ─────────────────────────────────────────
export function AuthGate({ children }) {
  return (
    <>
      <SignedOut><LoginScreen /></SignedOut>
      <SignedIn>{children}</SignedIn>
    </>
  );
}
