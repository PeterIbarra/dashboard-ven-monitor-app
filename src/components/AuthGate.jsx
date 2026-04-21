import { useState } from "react";
import { useSignIn, SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";
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

export function UserButton() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const mob = useIsMobile();
  if (!user) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      {!mob && (
        <span style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.04em", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {user.primaryEmailAddress?.emailAddress}
        </span>
      )}
      <button
        onClick={() => signOut({ redirectUrl:"/" })}
        title="Cerrar sesión"
        style={{ background:"transparent", border:`1px solid ${BORDER}`, borderRadius:4, padding:mob?"3px 6px":"3px 8px", fontSize:9, fontFamily:font, color:MUTED, cursor:"pointer", letterSpacing:"0.06em", textTransform:"uppercase", transition:"all 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor=ACCENT; e.currentTarget.style.color=ACCENT; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.color=MUTED; }}
      >
        Salir
      </button>
    </div>
  );
}

function LoginScreen() {
  const { signIn, isLoaded } = useSignIn();
  const mob = useIsMobile();
  const [step, setStep]       = useState("email");
  const [email, setEmail]     = useState("");
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSendCode(e) {
    e.preventDefault();
    if (!isLoaded || !email.trim()) return;
    setLoading(true); setError("");
    try {
      await signIn.create({ identifier: email.trim(), strategy: "email_code" });
      setStep("code");
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Error al enviar el código.";
      if (msg.includes("not allowed") || msg.includes("locked") || msg.includes("No se encontró") || msg.includes("not found") || msg.includes("identifier")) {
        setError("Este correo no tiene acceso autorizado. Contacta al administrador del sistema.");
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    if (!isLoaded || !code.trim()) return;
    setLoading(true); setError("");
    try {
      const result = await signIn.attemptFirstFactor({ strategy: "email_code", code: code.trim() });
      if (result.status === "complete") {
        window.location.href = "/";
      } else {
        setError("Verificación incompleta. Intenta de nuevo.");
      }
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "";
      if (msg.includes("incorrect") || msg.includes("invalid")) {
        setError("Código incorrecto. Verifica e intenta de nuevo.");
      } else if (msg.includes("expired")) {
        setError("El código expiró. Solicita uno nuevo.");
        setStep("email"); setCode("");
      } else {
        setError(msg || "Error de verificación.");
      }
    } finally { setLoading(false); }
  }

  async function handleResend() {
    setLoading(true); setError(""); setCode("");
    try {
      await signIn.create({ identifier: email.trim(), strategy: "email_code" });
    } catch { setError("No se pudo reenviar el código."); }
    finally { setLoading(false); }
  }

  const inputStyle = { width:"100%", boxSizing:"border-box", padding:"10px 12px", fontSize:13, fontFamily:fontSans, color:TEXT, background:BG, border:`1px solid ${BORDER}`, borderRadius:4, outline:"none", transition:"border-color 0.15s" };
  const btnStyle   = { width:"100%", padding:"11px 0", background:loading?`${ACCENT}80`:ACCENT, color:"#fff", border:"none", borderRadius:4, fontSize:11, fontFamily:font, letterSpacing:"0.1em", textTransform:"uppercase", cursor:loading?"not-allowed":"pointer", marginTop:4 };

  return (
    <div style={{ minHeight:"100vh", background:BG, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:fontSans, padding:24 }}>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", background:`radial-gradient(ellipse 70% 50% at 50% 0%, ${ACCENT}08 0%, transparent 70%)` }} />
      <div style={{ position:"relative", width:"100%", maxWidth:400, display:"flex", flexDirection:"column", alignItems:"center", gap:28 }}>

        {/* Badge */}
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

          {step === "email" && (
            <form onSubmit={handleSendCode} style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.06em", marginBottom:8, textTransform:"uppercase" }}>Correo electrónico</div>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="nombre@undp.org" required autoFocus style={inputStyle}
                  onFocus={e => e.target.style.borderColor=ACCENT} onBlur={e => e.target.style.borderColor=BORDER} />
              </div>
              {error && <div style={{ fontSize:11, color:RED, fontFamily:font, lineHeight:1.5, padding:"8px 10px", background:`${RED}08`, border:`1px solid ${RED}20`, borderRadius:4 }}>{error}</div>}
              <button type="submit" disabled={loading || !email.trim()} style={btnStyle}>{loading ? "Enviando..." : "Continuar →"}</button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleVerifyCode} style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ textAlign:"center", paddingBottom:4 }}>
                <div style={{ fontSize:11, fontFamily:font, color:GREEN, letterSpacing:"0.06em", marginBottom:6 }}>✓ CÓDIGO ENVIADO</div>
                <div style={{ fontSize:13, color:MUTED, lineHeight:1.5 }}>
                  Ingresa el código de 6 dígitos enviado a<br />
                  <strong style={{ color:TEXT }}>{email}</strong>
                </div>
              </div>
              <div>
                <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.06em", marginBottom:8, textTransform:"uppercase" }}>Código de verificación</div>
                <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={code}
                  onChange={e => { setCode(e.target.value.replace(/\D/g,"")); setError(""); }}
                  placeholder="000000" required autoFocus
                  style={{ ...inputStyle, fontSize:22, fontFamily:font, textAlign:"center", letterSpacing:"0.3em" }}
                  onFocus={e => e.target.style.borderColor=ACCENT} onBlur={e => e.target.style.borderColor=BORDER} />
              </div>
              {error && <div style={{ fontSize:11, color:RED, fontFamily:font, lineHeight:1.5, padding:"8px 10px", background:`${RED}08`, border:`1px solid ${RED}20`, borderRadius:4 }}>{error}</div>}
              <button type="submit" disabled={loading || code.length < 6} style={btnStyle}>{loading ? "Verificando..." : "Ingresar al dashboard →"}</button>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                <button type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }}
                  style={{ background:"none", border:"none", fontSize:11, fontFamily:font, color:MUTED, cursor:"pointer", letterSpacing:"0.04em" }}>
                  ← Cambiar correo
                </button>
                <button type="button" onClick={handleResend} disabled={loading}
                  style={{ background:"none", border:"none", fontSize:11, fontFamily:font, color:ACCENT, cursor:"pointer", letterSpacing:"0.04em" }}>
                  Reenviar código
                </button>
              </div>
            </form>
          )}
        </div>

        <p style={{ fontSize:10, color:MUTED, fontFamily:font, textAlign:"center", letterSpacing:"0.04em", lineHeight:1.6, margin:0 }}>
          Acceso autorizado únicamente para personal PNUD Venezuela<br />y colaboradores habilitados · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export function AuthGate({ children }) {
  return (
    <>
      <SignedOut><LoginScreen /></SignedOut>
      <SignedIn>{children}</SignedIn>
    </>
  );
}
