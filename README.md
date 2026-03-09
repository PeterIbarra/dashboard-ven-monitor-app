# Monitor de Contexto Situacional — Venezuela 2026

**PNUD Venezuela · Análisis Estratégico · Uso interno**

Dashboard de monitoreo en tiempo real del proceso de estabilización venezolano post-3 de enero de 2026. Integra análisis de escenarios, indicadores semafóricos, señales por escenario, SITREPs semanales, tracker de amnistía, datos de medios internacionales (GDELT), conectividad (IODA), mercados energéticos y condiciones macroeconómicas.

## Arquitectura

```
monitor-pnud/
├── src/
│   ├── App.jsx              # Aplicación completa (single-file, ~340 KB)
│   └── main.jsx             # Entry point React
├── api/                     # Vercel Serverless Functions
│   ├── ai/index.js          # Proxy IA: Gemini → Groq → OpenRouter → Claude
│   ├── gdelt/index.js       # Proxy GDELT DOC API v2 (3 señales)
│   ├── ioda/index.js        # Proxy IODA API v2 (Georgia Tech)
│   ├── oil-prices/index.js  # Híbrido: OilPriceAPI (live) + EIA (histórico)
│   ├── news/index.js        # RSS: 7 medios + 5 fact-checkers
│   ├── articles/index.js    # Artículos (Supabase)
│   ├── rates/index.js       # Tipo de cambio VES/USD
│   ├── dolar/index.js       # Dólar: paralelo + oficial (dual fetch)
│   ├── acled/index.js       # Datos de conflictividad (ACLED)
│   └── cron/index.js        # Cron: sincronización automática
├── index.html
├── vercel.json              # Config: rewrites + CORS + cron + maxDuration
├── vite.config.mjs
└── package.json
```

## Tabs del Dashboard

| # | Tab | Icono | Descripción | Fuente | Auto-refresh |
|---|-----|-------|-------------|--------|--------------|
| 1 | **Dashboard** | 📊 | Escenarios, Amnistía Tracker, KPIs, semáforo, tensiones | Datos internos | — |
| 2 | **SITREP** | 📋 | Análisis semanal (8 semanas), Briefing, Análisis IA, documento descargable | SITREP_ALL + IA | — |
| 3 | **Matriz** | 🎯 | Matriz 2×2 (violencia × cambio), trayectoria, probabilidades | WEEKS | — |
| 4 | **Monitor** | 🚦 | 28 indicadores + 32 señales + noticias + verificación | INDICATORS + /api/news | — |
| 5 | **Medios** | 📡 | GDELT: volumen, tono, inestabilidad — 120 días | /api/gdelt | — |
| 6 | **Conflictividad** | ✊ | OVCS 2025 + ACLED: protestas, estados, represión | CONF_* + /api/acled | — |
| 7 | **Internet** | 🌐 | IODA: conectividad, detección de cortes | /api/ioda | — |
| 8 | **Mercados** | 📈 | Petróleo (Brent/WTI/Gas), Polymarket, bonos | /api/oil-prices | 5 min |
| 9 | **Macro VEN** | 💵 | Tipo de cambio BCV vs paralelo, brecha, indicadores macro | /api/dolar + /api/rates | 5 min |

## Modelo de datos

### 4 Escenarios

| ID | Escenario | Color | Cuadrante |
|----|-----------|-------|-----------|
| E1 | Transición política pacífica | 🟢 Verde | Top-left |
| E2 | Colapso y fragmentación | 🔴 Rojo | Top-right |
| E3 | Continuidad negociada | 🔵 Azul | Bottom-left |
| E4 | Resistencia coercitiva | 🟡 Amarillo | Bottom-right |

### Evolución de probabilidades (S1–S8)

```
Semana       E1    E2    E3    E4    Dominante
S1  3–15 ene  5%   45%   40%   10%   E2 (45%)
S2  16–22 ene 15%   25%   50%   10%   E3 (50%)
S3  23–29 ene 20%   10%   60%   10%   E3 (60%)
S4  30e–5f    30%    5%   50%   15%   E3 (50%)
S5  6–13 feb  30%    5%   45%   20%   E3 (45%)
S6  13–20 feb 35%   15%   40%   10%   E3 (40%)
S7  20–27 feb 35%   12%   43%   10%   E3 (43%)
S8  27f–6m    38%   12%   40%   10%   E3 (40%) ●
```

### 28 Indicadores del Monitor

| Dimensión | Indicadores | Nuevos (S8) |
|-----------|-------------|-------------|
| ⚡ Energético | 8 | Recaudación fiscal, Apertura minera |
| 🏛 Político | 8 | Cautelares vigentes, Liderazgo opositor |
| 📊 Económico | 6 | PIB trimestral |
| 🌐 Internacional | 6 | Presión legislativa EE.UU. |

Indicadores nuevos muestran badge **NUEVO**. Semanas anteriores sin dato muestran dot gris.

### 32 Señales por Escenario

| Escenario | Señales | Nuevas (S8) |
|-----------|---------|-------------|
| E3 Continuidad | 9 | PIB +7.07%, SENIAT +78% |
| E1 Transición | 9 | MCM 106.84 pts, H.R. 7674, Ramos Allup, apertura minera, Vamos Venezuela, retorno MCM |
| E4 Resistencia | 7 | Concentración territorial, >11.000 cautelares, oficialismo bajo |
| E2 Colapso | 7 | Pérdida mercado chino |

### Amnistía Tracker (Dashboard)

Panel dual Gobierno vs Foro Penal con evolución semanal S1–S8:
- **Gobierno**: Solicitudes, libertades plenas, cautelares, militares
- **Foro Penal**: Excarcelaciones verificadas, presos políticos activos
- **Brecha de verificación**: Barra visual con % de diferencia
- **Mini-chart**: Barras duales por semana

### Fuentes de noticias (RSS)

| Tipo | Medios |
|------|--------|
| Noticias | Efecto Cocuyo, El Pitazo, Runrunes, Tal Cual, El Estímulo, AlbertoNews, Caracas Chronicles |
| Fact-check | Cocuyo Chequea, Cotejo.info, EsPaja, Cazamos Fake News, Provea |

## Funcionalidades del SITREP

### Vista Briefing (📌)
Resumen ejecutivo de una página: barras de probabilidades, puntos clave, semáforo, tendencia, actores, síntesis, análisis IA.

### Generador de documento (📥)
Compila datos de la semana y genera HTML descargable con formato PNUD. Incluye análisis IA si fue generado. Imprimible a PDF con Ctrl+P.

### Análisis IA (🤖)
Genera análisis narrativo de 5-6 párrafos usando **todos los datos del dashboard**:

| Fuente | Prioridad | Datos que recibe |
|--------|-----------|------------------|
| WEEKS + SITREP_ALL | 🔴 Máxima | Escenarios, probabilidades, tendencia, drivers, síntesis, tensiones, KPIs, actores, lectura analítica |
| INDICATORS | 🟡 Alta | 28 indicadores con semáforo, tendencia, valor, badge NUEVO |
| SCENARIO_SIGNALS | 🟡 Alta | 32 señales por E1/E2/E3/E4 con estado y badge NUEVO |
| AMNISTIA_TRACKER | 🟡 Alta | Gobierno vs Foro Penal + hito del período |
| Dólar (live) | 🟢 Contexto | BCV, paralelo, brecha % |
| Petróleo (live) | 🟢 Contexto | Brent, WTI, Gas en USD |
| Noticias (live) | 🟢 Contexto | Top 5 titulares del día |

**Cascada de proveedores IA** (serverless `/api/ai`):

| Proveedor | Key | Costo | Análisis/día |
|-----------|-----|-------|--------------|
| Gemini 1.5 Flash | `GEMINI_API_KEY` | Gratis | ~150-200 |
| Groq Llama 3.3 70B | `GROQ_API_KEY` | Gratis | ~80-100 |
| OpenRouter Free | `OPENROUTER_API_KEY` | Gratis | 50 |
| Claude Sonnet 4 | `ANTHROPIC_API_KEY` | Pago | Ilimitado |

Basta configurar **una sola key**. Si un proveedor falla, salta al siguiente automáticamente. Badge dinámico: azul GEMINI, naranja GROQ, cyan OPENROUTER, violeta CLAUDE.

### API de petróleo (híbrida)

| Componente | Fuente | Uso |
|------------|--------|-----|
| Tarjetas (precio actual) | OilPriceAPI | Intradía, en vivo |
| Gráfico histórico | EIA (gov) | 365 días, diario, ilimitado |
| Punto de hoy en gráfico | OilPriceAPI | Se inyecta al final del historial EIA |

## Variables de entorno (Vercel)

| Variable | Requerida | Uso |
|----------|-----------|-----|
| `EIA_API_KEY` | Sí | Gráfico petróleo (gratuito, ilimitado) — [eia.gov/opendata](https://www.eia.gov/opendata/register.php) |
| `OILPRICE_API_KEY` | Opcional | Precios petróleo intradía (500 req/mes) |
| `GEMINI_API_KEY` | Opcional | 🤖 IA: Gemini Flash (gratuito) — [aistudio.google.com](https://aistudio.google.com) |
| `GROQ_API_KEY` | Opcional | 🤖 IA: Groq Llama 3.3 70B (gratuito) — [console.groq.com](https://console.groq.com) |
| `OPENROUTER_API_KEY` | Opcional | 🤖 IA: OpenRouter modelos free (gratuito) — [openrouter.ai](https://openrouter.ai) |
| `ANTHROPIC_API_KEY` | Opcional | 🤖 IA: Claude Sonnet (pago) — [console.anthropic.com](https://console.anthropic.com) |
| `NEWS_API_KEY` | Opcional | NewsAPI para noticias en vivo |
| `SUPABASE_URL` | Opcional | Base de datos de artículos |
| `SUPABASE_KEY` | Opcional | Auth Supabase |
| `ACLED_API_KEY` | Opcional | Datos de conflictividad ACLED |

> **Obtener keys gratuitas**: [aistudio.google.com](https://aistudio.google.com) (Gemini) · [console.groq.com](https://console.groq.com) (Groq) · [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys) (OpenRouter) · [eia.gov/opendata](https://www.eia.gov/opendata/register.php) (EIA). Ninguna requiere tarjeta de crédito.

## Actualización semanal (protocolo SITREP)

Editar `src/App.jsx`:

### 1. WEEKS — Nueva semana

```javascript
{ label:"FECHA", short:"S9",
  probs:[{sc:1,v:XX,t:"up|down|flat"},{sc:2,v:XX,...},{sc:3,v:XX,...},{sc:4,v:XX,...}],
  xy:{x:CALC,y:CALC},  // centroide ponderado
  sem:{g:N,y:N,r:N},   // semáforo tensiones
  kpis:{ energia:{...}, economico:{...}, opinion:{...} },
  tensiones:[{l:"green|yellow|red", t:"<b>Título:</b> Detalle."}],
  lectura:"Texto analítico...",
  trendSc:N, trendDrivers:["Factor 1","Factor 2","Factor 3"]
}
```

### 2. SITREP_ALL — Nuevo informe

```javascript
{ period:"Fecha larga", periodShort:"Fecha corta",
  keyPoints:[{tag, color, title, text}],
  sintesis:"...", actores:[{name, items:[...]}],
  // Opcionales: nacional, economia, escenarios, comentarios
}
```

### 3. INDICATORS — Acumular historial

Existentes: agregar al final de `hist[]`. Nuevos: `addedWeek:N`, `hist:[null,...,["color","trend","valor"]]`

### 4. AMNISTIA_TRACKER — Nueva entrada

```javascript
{ week:"S9", label:"...",
  gob:{ solicitudes:N, libertades:N, excarcelados:N, cautelares:N, militares:N },
  fp:{ verificados:N, detenidos:N },
  hito:"Descripción del hito del período"
}
```

### 5. Estructuras auxiliares

`KPIS_LATEST`, `TENSIONS`, `SCENARIO_SIGNALS` (quitar `isNew` anterior, poner en nuevas), `GDELT_ANNOTATIONS`, `MONITOR_WEEKS`

## Deploy

```bash
cd monitor-pnud
git init && git add . && git commit -m "Monitor PNUD v4"
git remote add origin https://github.com/TU_USUARIO/monitor-pnud.git
git push -u origin main
# Vercel: Add New Project → Seleccionar repo → Deploy
# Configurar Environment Variables en Settings
```

## Desarrollo local

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Stack técnico

- **Frontend**: React 18 + Vite 5 (single-file, ~340 KB)
- **Hosting**: Vercel (Edge + Serverless Functions)
- **APIs externas**: EIA, OilPriceAPI, GDELT, IODA, DolarAPI, NewsAPI, ACLED, Polymarket
- **IA**: Gemini Flash / Groq Llama / OpenRouter / Claude (cascada con fallback)
- **Diseño**: Space Mono + DM Sans, paleta PNUD (#0468B1), fully responsive

## Créditos

- **EIA**: [eia.gov](https://www.eia.gov/) — U.S. Energy Information Administration
- **GDELT**: [gdeltproject.org](https://www.gdeltproject.org/) — Monitoreo global de medios
- **IODA**: [ioda.inetintel.cc.gatech.edu](https://ioda.inetintel.cc.gatech.edu/) — Georgia Tech
- **OVCS**: [observatoriodeconflictos.org.ve](https://www.observatoriodeconflictos.org.ve/) — Conflictividad social
- **Polymarket**: [polymarket.com](https://polymarket.com) — Mercados de predicción
- **ACLED**: [acleddata.com](https://acleddata.com/) — Datos de conflicto armado
- **Foro Penal**: [@ForoPenal](https://twitter.com/ForoPenal) — Excarcelaciones verificadas
- **Umbral**: [umbral.watch](https://umbral.watch) — Pablo Hernández Borges

---

*Monitor de Contexto Situacional · PNUD Venezuela · Análisis Estratégico · Marzo 2026*
