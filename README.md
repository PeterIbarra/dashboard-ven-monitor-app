# Monitor de Contexto Situacional — Venezuela 2026

**PNUD Venezuela · Análisis Estratégico · Uso interno**

Dashboard de monitoreo en tiempo real del proceso de estabilización venezolano post-3 de enero de 2026. Integra análisis de escenarios, índice de inestabilidad compuesto (14 factores), conflictividad bilateral EE.UU.–Venezuela (PizzINT/GDELT), tracker de amnistía, indicadores semafóricos, señales por escenario, SITREPs semanales con análisis IA, Daily Brief con noticias frescas, alertas en vivo por umbral, clasificación inteligente de noticias, datos de medios internacionales (GDELT), conectividad (IODA), mercados energéticos y condiciones macroeconómicas.

**Live**: https://dashboard-ven-monitor-app.vercel.app/

## Arquitectura

```
monitor-pnud/
├── src/
│   ├── App.jsx              # Aplicación completa (single-file, ~400 KB)
│   └── main.jsx             # Entry point React
├── api/                     # Vercel Serverless Functions (12 endpoints)
│   ├── ai/index.js          # Proxy IA: Mistral → Gemini → Groq → OpenRouter → HuggingFace → Claude
│   ├── bilateral/index.js   # Proxy PizzINT/GDELT bilateral threat index (USA↔VEN)
│   ├── gdelt/index.js       # Proxy GDELT DOC API v2 (3 señales + Google News RSS headlines)
│   ├── ioda/index.js        # Proxy IODA API v2 (Georgia Tech)
│   ├── oil-prices/index.js  # Híbrido: OilPriceAPI (live) + EIA (histórico)
│   ├── news/index.js        # RSS: 7 medios + 5 fact-checkers
│   ├── articles/index.js    # Artículos (Supabase)
│   ├── rates/index.js       # Tipo de cambio VES/USD
│   ├── dolar/index.js       # Dólar: paralelo + oficial (dual fetch)
│   ├── acled/index.js       # Datos de conflictividad (ACLED)
│   ├── cron/index.js        # Cron: sincronización diaria 6:00 UTC
│   └── bilateral/index.js   # PizzINT bilateral threat index
├── index.html
├── vercel.json              # Config: rewrites + CORS + cron + maxDuration
├── vite.config.mjs
└── package.json
```

## Tabs del Dashboard

| # | Tab | Descripción | Fuentes | Auto-refresh |
|---|-----|-------------|---------|--------------|
| 1 | **Dashboard** | Alertas en vivo, escenarios, índice de inestabilidad (14 factores), conflictividad bilateral, amnistía tracker, KPIs, semáforo, tensiones, alertas inteligentes de noticias | Datos internos + APIs en vivo + IA | 5 min |
| 2 | **SITREP** | Análisis semanal (8 semanas), Briefing, Daily Brief con Google News, Análisis IA, documento descargable | SITREP_ALL + Google News RSS + IA | — |
| 3 | **Matriz** | Matriz 2×2 (violencia × cambio), trayectoria, probabilidades | WEEKS | — |
| 4 | **Monitor** | 28 indicadores + 32 señales + noticias + verificación | INDICATORS + /api/news | — |
| 5 | **Medios** | GDELT: volumen, tono, inestabilidad — 120 días | /api/gdelt | — |
| 6 | **Conflictividad** | OVCS 2025 + ACLED: protestas, estados, represión | CONF_* + /api/acled | — |
| 7 | **Internet** | IODA: conectividad, detección de cortes | /api/ioda | — |
| 8 | **Mercados** | Petróleo (Brent/WTI/Gas), Polymarket, bonos | /api/oil-prices | 5 min |
| 9 | **Macro VEN** | Tipo de cambio BCV vs paralelo, brecha, indicadores macro | /api/dolar + /api/rates | 5 min |

## Dashboard: Componentes en Tiempo Real

### Alertas en Vivo por Umbral (ROW 0)

| Dato | 🔴 Crítico | 🟡 Seguimiento | Fuente |
|------|-----------|----------------|--------|
| Brecha cambiaria | >55% | >45% | /api/dolar |
| Dólar paralelo | >700 Bs | >600 Bs | /api/dolar |
| Brent | <$60 | <$65 | /api/oil-prices |
| WTI | <$55 | <$60 | /api/oil-prices |
| Bilateral 🇺🇸🇻🇪 | >2.0σ | >1.0σ | /api/bilateral |

### Índice de Inestabilidad Compuesto (14 factores)

| # | Input | Peso | Fuente | Actualización |
|---|-------|------|--------|---------------|
| 1 | Indicadores en rojo | 11% | INDICATORS | Semanal |
| 2 | Brecha cambiaria | 11% | /api/dolar | **5 min** |
| 3 | E2 Colapso | 9% | WEEKS | Semanal |
| 4 | Señales E4+E2 activas | 7% | SCENARIO_SIGNALS | Semanal |
| 5 | E4 Resistencia | 7% | WEEKS | Semanal |
| 6 | Tensiones rojas | 7% | WEEKS | Semanal |
| 7 | Bilateral 🇺🇸🇻🇪 | 5% | /api/bilateral | **Diario** |
| 8 | Brent presión | 5% | /api/oil-prices | **5 min** |
| 9 | Protestas OVCS | 5% | CONF_MESES | Mensual |
| 10 | Brecha amnistía | 5% | AMNISTIA_TRACKER | Semanal |
| 11 | Represión OVCS | 4% | CONF_MESES | Mensual |
| 12 | Presos políticos | 3% | AMNISTIA_TRACKER | Semanal |
| 13 | E1 Transición | -6% | WEEKS | Semanal (resta) |
| 14 | E3 Continuidad | -3% | WEEKS | Semanal (resta) |

Zonas: 0-25 Estabilidad · 26-50 Tensión moderada · 51-75 Inestabilidad alta · 76-100 Crisis inminente

### Conflictividad Bilateral 🇺🇸→🇻🇪 (PizzINT/GDELT)

Panel interactivo con datos de PizzINT. KPIs: Índice (σ), Sentimiento, Eventos Conflicto, Artículos. Gráfica ~90 días con hover. Niveles: BAJO · MODERADO · ELEVADO · ALTO · CRÍTICO. Baseline μ=0.14, σ=1.15 (2017–presente).

### Alertas Inteligentes de Noticias (IA)

Genera automáticamente al cargar: Google News RSS (3 dimensiones) + RSS internos → IA clasifica 🔴/🟡/🟢 por dimensión.

## Cascada de Proveedores IA (6 proveedores)

| # | Proveedor | Modelo | Key | Costo |
|---|-----------|--------|-----|-------|
| 1 | 🟠 Mistral | mistral-small-latest | `MISTRAL_API_KEY` | Gratis (~1B tok/mes) |
| 2 | 🔵 Gemini | gemini-1.5-flash | `GEMINI_API_KEY` | Gratis |
| 3 | 🟤 Groq | llama-3.3-70b | `GROQ_API_KEY` | Gratis |
| 4 | 🟦 OpenRouter | llama-3.1-8b:free | `OPENROUTER_API_KEY` | Gratis |
| 5 | 🟡 HuggingFace | Qwen2.5-72B / Mistral-7B | `HF_API_KEY` | Gratis |
| 6 | 🟣 Claude | claude-sonnet-4 | `ANTHROPIC_API_KEY` | Pago |

Consumo estimado: ~247K tokens/mes. Con Mistral gratis alcanza para ~4.000 meses.

## SITREP: Daily Brief + Análisis IA

- **📰 Daily Brief**: Noticias frescas (Google News 3 dimensiones) + datos de mercado + amnistía → 3-4 párrafos con citas [Fuente]
- **🤖 Análisis IA**: Todos los datos del dashboard → 5-6 párrafos analíticos (500-700 palabras)
- **📌 Briefing**: Resumen ejecutivo de una página
- **📥 Descargar**: HTML con formato PNUD, imprimible a PDF

## Modelo de Datos

### 4 Escenarios

| ID | Escenario | Color | Cuadrante |
|----|-----------|-------|-----------|
| E1 | Transición política pacífica | 🟢 Verde | Top-left |
| E2 | Colapso y fragmentación | 🔴 Rojo | Top-right |
| E3 | Continuidad negociada | 🔵 Azul | Bottom-left |
| E4 | Resistencia coercitiva | 🟡 Amarillo | Bottom-right |

### Probabilidades S1–S8

```
Semana       E1    E2    E3    E4    Dominante
S1  3–15 ene  5%   45%   40%   10%   E2 (45%)
S2  16–22 ene 15%   25%   50%   10%   E3 (50%)
S3  23–29 ene 20%   10%   60%   10%   E3 (60%)
S4  30e–5f    30%    5%   50%   15%   E3 (50%)
S5  6–13 feb  30%    5%   45%   20%   E3 (45%)
S6  13–20 feb 35%   15%   40%   10%   E3 (40%)
S7  20–27 feb 35%   12%   43%   10%   E3 (43%)
S8  27f–6m    38%   12%   40%   10%   E3 (40%)
```

### 28 Indicadores · 32 Señales · Amnistía Tracker

- Indicadores: 4 dimensiones (Energético, Político, Económico, Internacional)
- Señales: agrupadas por E1/E2/E3/E4
- Amnistía S8: Gobierno 5.628 libertades vs Foro Penal 670 verificadas (brecha ~88%)

## Serverless API Routes (12 endpoints)

| Route | Fuente | Cache |
|-------|--------|-------|
| `/api/ai` | Mistral/Gemini/Groq/OpenRouter/HF/Claude | — |
| `/api/bilateral` | PizzINT (pizzint.watch) | 2h |
| `/api/gdelt` | GDELT DOC API v2 | 1h |
| `/api/gdelt?signal=headlines` | Google News RSS (3 queries) | 30 min |
| `/api/oil-prices` | OilPriceAPI + EIA | 5 min / 1h |
| `/api/dolar` | pydolarvenezuela.org | 5 min |
| `/api/ioda` | Georgia Tech IODA | 1h |
| `/api/news` | 60+ RSS feeds | 30 min |
| `/api/acled` | ACLED | 1h |
| `/api/articles` | Supabase | — |
| `/api/rates` | Varios | 1h |
| `/api/cron` | RSS → Supabase | Diario 6:00 UTC |

## Variables de Entorno (Vercel)

| Variable | Requerida | Uso |
|----------|-----------|-----|
| `EIA_API_KEY` | Sí | Gráfico petróleo — [eia.gov/opendata](https://www.eia.gov/opendata/register.php) |
| `MISTRAL_API_KEY` | Recomendada | IA Mistral (gratis) — [console.mistral.ai](https://console.mistral.ai) |
| `GEMINI_API_KEY` | Opcional | IA Gemini (gratis) — [aistudio.google.com](https://aistudio.google.com) |
| `GROQ_API_KEY` | Opcional | IA Groq (gratis) — [console.groq.com](https://console.groq.com) |
| `OPENROUTER_API_KEY` | Opcional | IA OpenRouter (gratis) — [openrouter.ai](https://openrouter.ai) |
| `HF_API_KEY` | Opcional | IA HuggingFace (gratis) — [huggingface.co](https://huggingface.co/settings/tokens) |
| `ANTHROPIC_API_KEY` | Opcional | IA Claude (pago) — [console.anthropic.com](https://console.anthropic.com) |
| `OILPRICE_API_KEY` | Opcional | Precios petróleo intradía |
| `SUPABASE_URL` | Opcional | Base de datos artículos |
| `SUPABASE_SECRET_KEY` | Opcional | Auth Supabase |
| `ACLED_API_KEY` | Opcional | Datos conflictividad |

## Actualización Semanal (Protocolo SITREP)

Editar `src/App.jsx`:

1. **WEEKS** — Nueva semana (probs, xy, sem, kpis, tensiones, lectura, trendSc)
2. **SITREP_ALL** — Nuevo informe (period, keyPoints, sintesis, actores)
3. **INDICATORS** — Acumular hist[]. Nuevos: addedWeek:N
4. **AMNISTIA_TRACKER** — Nueva entrada (gob + fp + hito)
5. **SCENARIO_SIGNALS** — Actualizar sem/val. Nuevas: isNew:true
6. **CONF_MESES** — Agregar mes (cuando salga informe OVCS)
7. **Auxiliares**: KPIS_LATEST, TENSIONS, GDELT_ANNOTATIONS, MONITOR_WEEKS

## Deploy

```bash
cd monitor-pnud
git init && git add . && git commit -m "Monitor PNUD"
git remote add origin https://github.com/USER/monitor-pnud.git
git push -u origin main
# Vercel: New Project → repo → Deploy → Settings → Env vars
```

## Stack

- **Frontend**: React 18 + Vite 5 (single-file ~400 KB)
- **Hosting**: Vercel (Edge + Serverless)
- **APIs**: PizzINT, GDELT, EIA, OilPriceAPI, IODA, DolarAPI, Google News RSS, ACLED, Polymarket
- **IA**: Mistral / Gemini / Groq / OpenRouter / HuggingFace / Claude (cascada 6 proveedores)
- **Diseño**: Space Mono + DM Sans, paleta PNUD (#0468B1), responsive

## Créditos

- **PizzINT/PolyPulse**: [pizzint.watch](https://www.pizzint.watch/) — Bilateral threat index
- **EIA**: [eia.gov](https://www.eia.gov/) — Energy Information Administration
- **GDELT**: [gdeltproject.org](https://www.gdeltproject.org/) — Monitoreo global de medios
- **IODA**: [ioda.inetintel.cc.gatech.edu](https://ioda.inetintel.cc.gatech.edu/) — Georgia Tech
- **OVCS**: [observatoriodeconflictos.org.ve](https://www.observatoriodeconflictos.org.ve/) — Conflictividad social
- **Polymarket**: [polymarket.com](https://polymarket.com) — Mercados de predicción
- **ACLED**: [acleddata.com](https://acleddata.com/) — Datos de conflicto
- **Foro Penal**: [@ForoPenal](https://twitter.com/ForoPenal) — Excarcelaciones verificadas
- **Umbral**: [umbral.watch](https://umbral.watch) — Pablo Hernández Borges
- **Google News**: RSS público — Titulares frescos

---

*Monitor de Contexto Situacional · PNUD Venezuela · Análisis Estratégico · Marzo 2026*
