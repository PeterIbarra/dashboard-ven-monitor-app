# Daily Brief por Email — Diseño Técnico

## Resumen Ejecutivo

Sistema automatizado que cada mañana a las **7:00 AM VET (11:00 UTC)** consulta todos los endpoints del dashboard, genera un análisis de situación con IA, y lo envía por email a 2-3 destinatarios del equipo PNUD via **Resend**.

---

## 1. ARQUITECTURA

```
┌─────────────────────────────────────────────────────────┐
│ Vercel Cron (11:00 UTC)                                 │
│   /api/cron?task=dailyBrief                             │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│ lib/cron/tasks/dailyBrief.js                            │
│                                                         │
│  1. Fetch data from all endpoints (internal calls)      │
│     ├── Supabase: daily_readings (último día)           │
│     ├── Supabase: news_alerts (últimas 24h)             │
│     ├── Supabase: rss_articles (últimos 20)             │
│     ├── GDELT API directa (tone + volume)               │
│     ├── IODA API directa (outages Venezuela)            │
│     └── Supabase: oil_prices (último registro)          │
│                                                         │
│  2. Compile data packet                                 │
│                                                         │
│  3. AI synthesis (callAICascade con prompt específico)   │
│     → Output: JSON estructurado con secciones           │
│                                                         │
│  4. Render HTML email template                          │
│                                                         │
│  5. Send via Resend API                                 │
│                                                         │
│  6. Log resultado en Supabase (daily_briefs table)      │
└─────────────────────────────────────────────────────────┘
```

**Sin nueva función serverless** — se añade como task dentro de `/api/cron` existente (slot ya consumido).

---

## 2. DATA COLLECTION

### Fuentes (todas desde Supabase, sin llamadas a endpoints HTTP)

```javascript
// Todas las queries van directo a Supabase — evita cold starts y timeouts
const data = {};

// 1. Último daily_readings (GDELT tone, bilateral, oil, natgas, snapshot)
data.readings = await supabase
  .from("daily_readings")
  .select("*")
  .order("date", { ascending: false })
  .limit(2); // hoy + ayer para calcular deltas

// 2. Alertas clasificadas (últimas 24h)
data.alerts = await supabase
  .from("news_alerts")
  .select("*")
  .gte("created_at", new Date(Date.now() - 86400000).toISOString())
  .order("created_at", { ascending: false })
  .limit(10);

// 3. Headlines RSS recientes (últimas 24h)
data.headlines = await supabase
  .from("rss_articles")
  .select("title, source, published_at, url")
  .gte("published_at", new Date(Date.now() - 86400000).toISOString())
  .order("published_at", { ascending: false })
  .limit(20);

// 4. Tasas de cambio (último registro)
data.rates = await supabase
  .from("exchange_rates")
  .select("*")
  .order("date", { ascending: false })
  .limit(2); // hoy + ayer

// 5. ICG score (último)
data.icg = await supabase
  .from("daily_readings")
  .select("icg_score, icg_actors, date")
  .not("icg_score", "is", null)
  .order("date", { ascending: false })
  .limit(1);

// 6. Oil prices (desde daily_readings)
// Ya incluido en data.readings
```

### Datos estáticos del código (importados directamente)

```javascript
const { WEEKS } = require("../../src/data/weeks");
// Último WEEKS entry → escenario dominante, probabilidades, tensiones, lectura
const currentWeek = WEEKS[WEEKS.length - 1];
```

**Ventaja**: Todo vía Supabase directo, sin HTTP requests a endpoints propios. Más rápido, sin cold starts, dentro del timeout de 60s.

---

## 3. AI SYNTHESIS PROMPT

```javascript
const prompt = `Eres un analista senior del PNUD Venezuela. Genera un DAILY SITUATIONAL BRIEF.

Fecha: ${fecha}

═══ ESCENARIO VIGENTE (semana ${currentWeek.short}) ═══
Dominante: E${dom.sc} (${domName}) al ${dom.v}%
${currentWeek.probs.map(p => `E${p.sc}: ${p.v}%`).join(" | ")}

═══ TENSIONES ACTIVAS ═══
${currentWeek.tensiones.map(t => `[${t.l.toUpperCase()}] ${t.t.replace(/<[^>]+>/g,"")}`).join("\n")}

═══ MERCADOS (${readings.date}) ═══
Dólar BCV: ${rates.bcv} Bs | Paralelo: ${rates.paralelo} Bs | Brecha: ${rates.brecha}%
${rates.delta ? `Variación: BCV ${rates.deltaBcv} | Paralelo ${rates.deltaParalelo}` : ""}
Brent: $${readings.brent} | WTI: $${readings.wti} | Merey: $${readings.merey || "—"}

═══ GDELT MEDIA (últimas 24h) ═══
Tono promedio: ${readings.gdelt_tone} | Volumen: ${readings.gdelt_volume} artículos
${readings.gdelt_tone < -3 ? "⚠ TONO NEGATIVO ELEVADO" : readings.gdelt_tone > 1 ? "✅ TONO POSITIVO" : "◐ TONO NEUTRO-MIXTO"}

═══ ICG (Índice de Cohesión de Gobierno) ═══
Score: ${icg.score}/100
${icg.actors ? `Actores clave: ${icg.actors}` : ""}

═══ ALERTAS CLASIFICADAS (últimas 24h) ═══
${alerts.map(a => `[${a.hierarchy}] ${a.title} — ${a.source}`).join("\n") || "Sin alertas nuevas"}

═══ HEADLINES RSS (últimas 24h) ═══
${headlines.map(h => `• ${h.title} [${h.source}]`).join("\n") || "Sin headlines nuevos"}

═══ INSTRUCCIONES ═══
Produce un JSON con esta estructura exacta (sin backticks, sin markdown):
{
  "resumen": "1 párrafo (80-120 palabras) — valoración general del día",
  "mercados": "1 párrafo (60-80 palabras) — dólar, petróleo, impacto fiscal",
  "politico": "1 párrafo (60-80 palabras) — dinámica política interna",
  "internacional": "1 párrafo (60-80 palabras) — geopolítica y relación bilateral",
  "social": "1 párrafo (40-60 palabras) — conflictividad y clima social",
  "alertas": ["Alerta 1 en una línea", "Alerta 2", "Alerta 3"],
  "riesgoDelDia": "BAJO|MEDIO|ALTO|CRÍTICO",
  "razonRiesgo": "1 línea explicativa del nivel de riesgo"
}

REGLAS:
- Usa SOLO los datos proporcionados. NO inventes hechos.
- Cita fuentes entre corchetes [Fuente].
- Tono: cable diplomático, profesional, sin bullet points en párrafos.
- Si no hay datos en alguna dimensión, escribe "Sin novedades significativas."
- Las alertas deben ser las 3 más relevantes del día, no más.`;
```

---

## 4. EMAIL TEMPLATE (HTML)

```
┌──────────────────────────────────────────────┐
│  🇻🇪 MONITOR DE CONTEXTO SITUACIONAL          │
│  Daily Brief — [fecha]                        │
│  PNUD Venezuela                               │
├──────────────────────────────────────────────┤
│                                               │
│  NIVEL DE RIESGO: [●●●○○] MEDIO              │
│  [razón en una línea]                         │
│                                               │
│  ─── RESUMEN DEL DÍA ─────────────────────── │
│  [párrafo resumen]                            │
│                                               │
│  ─── ESCENARIO VIGENTE ───────────────────── │
│  ■ E3 Continuidad 43%  ■ E1 Transición 30%   │
│  ■ E4 Resistencia 20%  ■ E2 Colapso 7%       │
│                                               │
│  ─── MERCADOS ────────────────────────────── │
│  BCV: 420 Bs | Paralelo: 680 Bs | Brecha: 62%│
│  Brent: $82.30 | WTI: $78.50                 │
│  [párrafo mercados]                           │
│                                               │
│  ─── POLÍTICO ────────────────────────────── │
│  [párrafo político]                           │
│                                               │
│  ─── INTERNACIONAL ───────────────────────── │
│  [párrafo internacional]                      │
│                                               │
│  ─── SOCIAL ──────────────────────────────── │
│  [párrafo social]                             │
│                                               │
│  ─── ALERTAS PRIORITARIAS ────────────────── │
│  🔴 [alerta 1]                                │
│  🟡 [alerta 2]                                │
│  🟡 [alerta 3]                                │
│                                               │
│  ─── ICG ─────────────────────────────────── │
│  Score: 66/100 | Tendencia: ↓                 │
│                                               │
├──────────────────────────────────────────────┤
│  Ver dashboard completo →                     │
│  dashboard-ven-monitor-app.vercel.app         │
│                                               │
│  Generado automáticamente · PNUD Venezuela    │
│  Monitor de Contexto Situacional 2026         │
└──────────────────────────────────────────────┘
```

Colores: fondo oscuro (#0d1117), texto claro (#e6edf3), bordes (#30363d) — consistente con el dashboard. Email responsive con fallback a texto plano.

---

## 5. IMPLEMENTACIÓN TÉCNICA

### 5.1 Nuevo archivo: `lib/cron/tasks/dailyBrief.js`

```javascript
// lib/cron/tasks/dailyBrief.js
const { SUPABASE_URL, SUPABASE_SECRET } = require("../config");
const { callAICascade } = require("../ai");

async function sendDailyBrief(errors) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) { errors.push("RESEND_API_KEY not set"); return { sent: false }; }

  // 1. Fetch all data from Supabase (ver sección 2)
  // 2. Build AI prompt (ver sección 3)
  // 3. Call AI cascade → parse JSON response
  // 4. Render HTML email
  // 5. Send via Resend

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({
      from: "Monitor PNUD <daily@[tu-dominio].com>",
      // O durante pruebas: "onboarding@resend.dev"
      to: RECIPIENTS,
      subject: `🇻🇪 Daily Brief — ${fecha} | Riesgo: ${riesgo}`,
      html: renderedHtml,
    }),
  });

  // 6. Log en Supabase
  await fetch(`${SUPABASE_URL}/rest/v1/daily_briefs`, {
    method: "POST",
    headers: { "apikey": SUPABASE_SECRET, "Authorization": `Bearer ${SUPABASE_SECRET}`,
               "Content-Type": "application/json" },
    body: JSON.stringify({
      date: new Date().toISOString().split("T")[0],
      risk_level: riesgo,
      summary: aiResult.resumen,
      alerts: aiResult.alertas,
      sent_to: RECIPIENTS,
      provider: aiResult.provider,
    }),
  });

  return { sent: true, risk: riesgo, recipients: RECIPIENTS.length };
}

module.exports = { sendDailyBrief };
```

### 5.2 Modificación: `api/cron/index.js`

```javascript
// Añadir al inicio:
const { sendDailyBrief } = require("../../lib/cron/tasks/dailyBrief");

// Añadir después del bloque task === "alerts":
if (task === "dailybrief") {
  const errors = [];
  try {
    const result = await sendDailyBrief(errors);
    return res.status(200).json({ task: "dailyBrief", ...result, errors: errors.length > 0 ? errors : null });
  } catch (e) {
    return res.status(500).json({ task: "dailyBrief", error: e.message });
  }
}
```

### 5.3 Modificación: `vercel.json` — Segundo cron

```json
"crons": [
  { "path": "/api/cron", "schedule": "0 6 * * *" },
  { "path": "/api/cron?task=dailyBrief", "schedule": "0 11 * * *" }
]
```

**Nota Vercel Hobby**: Solo permite 1 cron. Alternativa: usar **cron-job.org** para el daily brief a las 11:00 UTC, manteniendo el cron de Vercel para las tareas de ingest a las 06:00 UTC.

---

## 6. CONFIGURACIÓN REQUERIDA

### 6.1 Variables de entorno (Vercel Dashboard)

```
RESEND_API_KEY=re_xxxxxxxxxxxx     # Resend API key
DAILY_BRIEF_TO=email1@org,email2@org,email3@org  # Destinatarios separados por coma
```

### 6.2 Resend Setup

1. Crear cuenta en **resend.com** (gratis, sin tarjeta)
2. Dashboard → API Keys → Create API Key
3. **Opción A (pruebas)**: Enviar desde `onboarding@resend.dev` — funciona inmediatamente, solo a tu email verificado
4. **Opción B (producción)**: Agregar dominio propio → DNS verification → enviar a cualquier email

### 6.3 Supabase — Nueva tabla

```sql
CREATE TABLE daily_briefs (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  risk_level TEXT,
  summary TEXT,
  alerts JSONB,
  full_html TEXT,
  sent_to TEXT[],
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.4 Trigger externo (cron-job.org)

Ya que Vercel Hobby limita a 1 cron, crear un job en cron-job.org:
- **URL**: `https://dashboard-ven-monitor-app.vercel.app/api/cron?task=dailyBrief`
- **Schedule**: `0 11 * * *` (11:00 UTC = 7:00 AM VET)
- **Method**: GET

---

## 7. COSTOS

| Servicio | Límite gratuito | Uso estimado |
|----------|----------------|--------------|
| Resend | 100 emails/día, 3.000/mes | ~3/día (2-3 destinatarios) |
| Mistral (AI) | ~$0.002/call | ~$0.06/mes |
| Supabase | 500MB, 50K rows | Insignificante |
| cron-job.org | Ilimitado | 1 job/día |

**Costo total: $0/mes** (todo dentro de free tier)

---

## 8. SECUENCIA DE IMPLEMENTACIÓN

```
Paso 1: Crear cuenta Resend → obtener API key
Paso 2: Crear tabla daily_briefs en Supabase
Paso 3: Agregar RESEND_API_KEY y DAILY_BRIEF_TO a Vercel env vars
Paso 4: Crear lib/cron/tasks/dailyBrief.js
Paso 5: Modificar api/cron/index.js (añadir routing)
Paso 6: Test manual: /api/cron?task=dailyBrief
Paso 7: Configurar cron-job.org para 11:00 UTC
Paso 8: Verificar recepción del primer email
```

**Tiempo estimado de implementación**: ~30 minutos de sesión con Claude.

---

## 9. TESTING

```
# Test manual (ejecutar desde navegador)
https://dashboard-ven-monitor-app.vercel.app/api/cron?task=dailyBrief

# Respuesta esperada:
{
  "task": "dailyBrief",
  "sent": true,
  "risk": "MEDIO",
  "recipients": 3,
  "provider": "mistral",
  "fetchedAt": "2026-03-30T11:00:00.000Z"
}
```

---

*Documento de diseño — PNUD Venezuela · Monitor de Contexto Situacional 2026*
*Pendiente de implementación · Próxima sesión*
