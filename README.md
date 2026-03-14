# Monitor de Contexto Situacional — Venezuela 2026

**PNUD Venezuela · Análisis Estratégico · Uso interno**

Dashboard de monitoreo en tiempo real del proceso de estabilización venezolano post-3 de enero de 2026. Integra análisis de escenarios, índice de inestabilidad compuesto (17 factores), índice de cohesión de gobierno (ICG) con clasificación IA por actor, conflictividad bilateral EE.UU.–Venezuela (PizzINT/GDELT), tracker de amnistía, conflictividad social semanal, indicadores semafóricos, señales por escenario, SITREPs semanales con análisis IA, Daily Brief con noticias frescas, alertas en vivo por umbral (8 triggers), mercados energéticos y condiciones macroeconómicas.

**Live**: https://dashboard-ven-monitor-app.vercel.app/

## Arquitectura

```
monitor-pnud/
├── src/
│   ├── App.jsx              # Aplicación completa (single-file, ~500 KB)
│   └── main.jsx             # Entry point React
├── api/                     # Vercel Serverless Functions (12 endpoints)
│   ├── ai/index.js          # Proxy IA: Mistral → Gemini → Groq → OpenRouter → HuggingFace → Claude
│   ├── bilateral/index.js   # Proxy PizzINT/GDELT bilateral threat index (USA↔VEN)
│   ├── gdelt/index.js       # Proxy GDELT DOC API v2 (3 señales + Google News RSS headlines)
│   ├── ioda/index.js        # Proxy IODA API v2 (Georgia Tech)
│   ├── oil-prices/index.js  # Híbrido: OilPriceAPI (live) + EIA (histórico)
│   ├── news/index.js        # RSS + Índice de Cohesión de Gobierno (?source=cohesion)
│   ├── articles/index.js    # Artículos (Supabase)
│   ├── polymarket/index.js  # Polymarket Gamma API (11 contratos Venezuela)
│   ├── socioeconomic/index.js # World Bank + IMF WEO + UNHCR/R4V
│   ├── dolar/index.js       # Dólar: paralelo + oficial (dual fetch)
│   ├── acled/index.js       # Datos de conflictividad (ACLED CAST)
│   └── cron/index.js        # Cron: sincronización diaria 6:00 UTC
├── index.html
├── vercel.json              # Config: rewrites + CORS + cron + maxDuration
├── vite.config.mjs
└── package.json
```

## Tabs del Dashboard

| # | Tab | Descripción | Fuentes |
|---|-----|-------------|---------|
| 1 | **Dashboard** | Alertas en vivo (8 triggers), escenarios, índice de inestabilidad (17 factores), conflictividad bilateral, **cohesión de gobierno (mini)**, amnistía tracker, KPIs, semáforo, tensiones, alertas IA | APIs en vivo + IA |
| 2 | **SITREP** | Análisis semanal (S1–S9), Briefing, Daily Brief, Análisis IA, documento descargable | SITREP_ALL + Google News + IA |
| 3 | **Matriz** | Matriz 2×2 (violencia × cambio), trayectoria, probabilidades | WEEKS |
| 4 | **Monitor** | 28 indicadores + 32 señales + noticias + verificación | INDICATORS + /api/news |
| 5 | **Cohesión** | Índice de Cohesión de Gobierno: 8 actores + 5 subgrupos chavistas, clasificación IA, GDELT, Polymarket, evolución S1→S9 | /api/news?source=cohesion |
| 6 | **Medios** | GDELT: volumen, tono, inestabilidad — 120 días | /api/gdelt |
| 7 | **Conflictividad** | Semanal 2026 (SITREP) + OVCS 2025 + ACLED: protestas, estados, motivos, represión | CONF_SEMANAL + CONF_* + /api/acled |
| 8 | **Internet** | IODA: conectividad, detección de cortes | /api/ioda |
| 9 | **Mercados** | Petróleo (Brent/WTI/Gas), Polymarket, bonos, producción VEN | /api/oil-prices + /api/polymarket |
| 10 | **Macro VEN** | Tipo de cambio BCV vs paralelo, brecha, World Bank, IMF, R4V | /api/dolar + /api/socioeconomic |

## Alertas en Vivo por Umbral (8 triggers)

| Dato | 🔴 Crítico | 🟡 Seguimiento | Fuente |
|------|-----------|----------------|--------|
| Brecha cambiaria | >55% | >45% | /api/dolar |
| Dólar paralelo | >700 Bs | >600 Bs | /api/dolar |
| Brent | <$60 | <$65 | /api/oil-prices |
| WTI | <$55 | <$60 | /api/oil-prices |
| Bilateral 🇺🇸🇻🇪 | >2.0σ | >1.0σ | /api/bilateral |
| Protestas semanales | >50/sem | >35/sem | CONF_SEMANAL |
| Cobertura territorial | >18 estados | >12 estados | CONF_SEMANAL |
| Aceleración protestas | >100% vs anterior | >50% vs anterior | CONF_SEMANAL |

## Índice de Inestabilidad Compuesto (17 factores)

| # | Input | Peso | Fuente | Actualización |
|---|-------|------|--------|---------------|
| 1 | Indicadores en rojo | 10% | INDICATORS | Semanal |
| 2 | Brecha cambiaria | 10% | /api/dolar | **5 min** |
| 3 | E2 Colapso | 8% | WEEKS | Semanal |
| 4 | E4 Resistencia | 7% | WEEKS | Semanal |
| 5 | Tensiones rojas | 6% | WEEKS | Semanal |
| 6 | Señales E4+E2 activas | 6% | SCENARIO_SIGNALS | Semanal |
| 7 | Protestas semanal | 5% | CONF_SEMANAL | Semanal (SITREP) |
| 8 | Bilateral 🇺🇸🇻🇪 | 5% | /api/bilateral | **Diario** |
| 9 | Cohesión GOB (invertido) | 5% | /api/news?source=cohesion | **Diario** |
| 10 | Cobertura territorial | 4% | CONF_SEMANAL | Semanal (SITREP) |
| 11 | Brent presión | 4% | /api/oil-prices | **5 min** |
| 12 | Brecha amnistía | 4% | AMNISTIA_TRACKER | Semanal |
| 13 | Tendencia mensual | 3% | CONF_SEMANAL (4 sem) vs 2025 | Semanal |
| 14 | Represión | 3% | CONF_SEMANAL | Semanal |
| 15 | Presos políticos | 3% | AMNISTIA_TRACKER | Semanal |
| 16 | E1 Transición | -6% | WEEKS | Semanal (resta) |
| 17 | E3 Continuidad | -3% | WEEKS | Semanal (resta) |

Zonas: 0–25 Estabilidad relativa · 26–50 Tensión moderada · 51–75 Inestabilidad alta · 76–100 Crisis inminente

## Índice de Cohesión de Gobierno (ICG)

Mide la alineación interna de la élite gobernante (0–100). Combina señales automáticas diarias con validación semanal del SITREP.

### Actores monitoreados (13)

**Individuales (8)**: Delcy Rodríguez · Jorge Rodríguez · Diosdado Cabello · FANB · Vladimir Padrino López · Jorge Arreaza · Nicolás Maduro Guerra · Asamblea Nacional

**Sistémicos (5)**: PSUV · Chavismo (movimiento) · Colectivos · Gobernadores chavistas · Sector militar amplio

### Pipeline por actor

Google News RSS → Mistral IA (ALINEADO/NEUTRO/TENSIÓN) → GDELT tono + menciones → Heurística relativa → Scoring compuesto

### Componentes del ICG

| Componente | Con SITREP | Sin SITREP | Fuente |
|------------|-----------|-----------|--------|
| Alineación IA (actores) | 25% | 35% | Mistral + Google News |
| Validación SITREP | 30% | — | ICG_HISTORY |
| Divergencia tono GDELT | 10% | 15% | GDELT API |
| Cohesión sistémica | 10% | 15% | Mistral + GDELT (5 subgrupos) |
| Señal Polymarket | 10% | 10% | Gamma API |
| Silencio mediático | 5% | 10% | GDELT menciones |

### Endpoint fusionado (zero funciones adicionales)

```
GET /api/news?source=cohesion              # IA + GDELT + Polymarket
GET /api/news?source=cohesion&sitrep=72    # Con ancla SITREP
GET /api/news?source=cohesion&skipai=true  # Solo GDELT + heurística
```

## Conflictividad Social — Semanal 2026

Datos semanales del SITREP. Sub-sección principal del tab Conflictividad.

```js
{ week:"S9", label:"6–13 mar", protestas:65, estados:23, reprimidas:0,
  motivos:["Aumento salarial","Jubilaciones","Pensiones","Laborales"],
  hecho:"RÉCORD: 39 movilizaciones 12/03 en 23 estados." }
```

Visualizaciones: 5 KPIs (con delta), hecho clave, motivos tags, gráfica barras S1→S9, cobertura territorial, tabla detallada.

## Cascada de Proveedores IA

| # | Proveedor | Modelo | Costo |
|---|-----------|--------|-------|
| 1 | Mistral | mistral-small-latest | Gratis |
| 2 | Gemini | gemini-1.5-flash | Gratis |
| 3 | Groq | llama-3.3-70b | Gratis |
| 4 | OpenRouter | llama-3.1-8b:free | Gratis |
| 5 | HuggingFace | Qwen2.5-72B | Gratis |
| 6 | Claude | claude-sonnet-4 | Pago |

## Variables de Entorno (Vercel)

| Variable | Requerida | Uso |
|----------|-----------|-----|
| `EIA_API_KEY` | Sí | Gráfico petróleo |
| `MISTRAL_API_KEY` | Sí | ICG + IA general |
| `GEMINI_API_KEY` | Opcional | IA fallback |
| `GROQ_API_KEY` | Opcional | IA fallback |
| `OPENROUTER_API_KEY` | Opcional | IA fallback |
| `HF_API_KEY` | Opcional | IA fallback |
| `ANTHROPIC_API_KEY` | Opcional | Claude (pago) |
| `OILPRICE_API_KEY` | Opcional | Precios intradía |
| `SUPABASE_URL` | Opcional | DB artículos |
| `SUPABASE_SECRET_KEY` | Opcional | Auth Supabase |
| `ACLED_API_KEY` | Opcional | ACLED conflicto |

## Actualización Semanal (Protocolo SITREP)

Editar `src/App.jsx`:

1. **WEEKS** — Nueva semana (probs, xy, sem, kpis, tensiones, lectura, trendSc)
2. **SITREP_ALL** — Nuevo informe (period, keyPoints, sintesis, actores)
3. **INDICATORS** — Acumular hist[]. Nuevos: addedWeek:N
4. **AMNISTIA_TRACKER** — Nueva entrada (gob + fp + hito)
5. **SCENARIO_SIGNALS** — Actualizar sem/val
6. **ICG_HISTORY** — Score cohesión (0–100, sitrep:true)
7. **CONF_SEMANAL** — Protestas, estados, reprimidas, motivos, hecho
8. **Auxiliares**: KPIS_LATEST, TENSIONS, GDELT_ANNOTATIONS, MONITOR_WEEKS

## Stack

- **Frontend**: React 18 + Vite 5 (single-file ~500 KB)
- **Hosting**: Vercel Hobby (12 serverless functions)
- **APIs**: PizzINT, GDELT, EIA, OilPriceAPI, IODA, DolarAPI, Google News RSS, ACLED, Polymarket Gamma, World Bank, IMF, UNHCR/R4V
- **IA**: Mistral (ICG + general) / Gemini / Groq / OpenRouter / HuggingFace / Claude
- **Diseño**: Space Mono + DM Sans + Playfair Display, paleta PNUD (#0468B1), responsive

## Créditos

- **PizzINT**: [pizzint.watch](https://www.pizzint.watch/) — Bilateral threat index
- **GDELT**: [gdeltproject.org](https://www.gdeltproject.org/) — Monitoreo global de medios
- **EIA**: [eia.gov](https://www.eia.gov/) — Energy Information Administration
- **IODA**: [ioda.inetintel.cc.gatech.edu](https://ioda.inetintel.cc.gatech.edu/) — Georgia Tech
- **OVCS**: [observatoriodeconflictos.org.ve](https://www.observatoriodeconflictos.org.ve/) — Conflictividad social
- **Polymarket**: [polymarket.com](https://polymarket.com) — Mercados de predicción
- **ACLED**: [acleddata.com](https://acleddata.com/) — Datos de conflicto
- **Foro Penal**: [@ForoPenal](https://twitter.com/ForoPenal) — Excarcelaciones verificadas
- **Umbral**: [umbral.watch](https://umbral.watch) — Pablo Hernández Borges
- **Mistral AI**: [mistral.ai](https://mistral.ai) — Clasificación IA actores ICG
- **World Bank**: [data.worldbank.org](https://data.worldbank.org) — Indicadores macro
- **IMF**: [imf.org](https://www.imf.org/en/Publications/WEO) — Proyecciones económicas

---

*Monitor de Contexto Situacional · PNUD Venezuela · Análisis Estratégico · Marzo 2026*
