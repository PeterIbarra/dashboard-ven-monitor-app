# Monitor de Contexto Situacional — Venezuela 2026

**PNUD Venezuela · Análisis Estratégico · Uso interno**

Dashboard de monitoreo en tiempo real del proceso de estabilización venezolano post-3 de enero de 2026. Integra análisis de escenarios, índice de inestabilidad compuesto (17 factores), índice de cohesión de gobierno (ICG) con clasificación IA por actor, conflictividad bilateral EE.UU.–Venezuela (PizzINT/GDELT), tracker de amnistía, conflictividad social semanal, indicadores semafóricos, señales por escenario, SITREPs semanales con análisis IA, Daily Brief con noticias frescas, alertas en vivo por umbral (8 triggers), mercados energéticos y condiciones macroeconómicas.

**Live**: https://dashboard-ven-monitor-app.vercel.app/

## Arquitectura

```
monitor-pnud/
├── src/
│   ├── App.jsx              # Aplicación completa (single-file, ~8,100 líneas)
│   ├── main.jsx             # Entry point React
│   └── data/                # Datos externalizados (~822 líneas)
│       ├── weekly.js        # WEEKS, KPIS_LATEST, TENSIONS, MONITOR_WEEKS, ICG_HISTORY, CONF_SEMANAL
│       ├── indicators.js    # INDICATORS (28 indicadores + 32 señales)
│       ├── sitrep.js        # SITREP_ALL (S1–S9)
│       ├── static.js        # VEN_PRODUCTION_MANUAL, constantes, SCENARIO_SIGNALS
│       └── amnistia.js      # AMNISTIA_TRACKER (tracker de excarcelaciones)
├── api/                     # Vercel Serverless Functions (12/12 max Hobby)
│   ├── ai/index.js          # Proxy IA: Mistral → Gemini → Groq → OpenRouter → HuggingFace → Claude
│   ├── bilateral/index.js   # Proxy PizzINT/GDELT bilateral threat index (USA↔VEN)
│   ├── gdelt/index.js       # Proxy GDELT DOC API v2 (3 señales + Google News RSS headlines)
│   ├── ioda/index.js        # Proxy IODA API v2 (Georgia Tech)
│   ├── oil-prices/index.js  # EIA histórico + STEO forecast
│   ├── news/index.js        # RSS + Índice de Cohesión de Gobierno (?source=cohesion)
│   ├── articles/index.js    # Artículos (Supabase)
│   ├── polymarket/index.js  # Polymarket Gamma API (11 contratos Venezuela)
│   ├── socioeconomic/index.js # World Bank + IMF WEO + UNHCR/R4V + Supabase write-back
│   ├── dolar/index.js       # Dólar: paralelo + oficial (DolarAPI)
│   ├── acled/index.js       # Datos de conflictividad (ACLED CAST)
│   └── cron/index.js        # Cron: sincronización diaria 6:00 UTC → Supabase
├── index.html
├── vercel.json              # Config: rewrites + CORS + cron + maxDuration
├── vite.config.mjs
└── package.json
```

## Tabs del Dashboard

| # | Tab | Descripción | Fuentes |
|---|-----|-------------|---------|
| 1 | **Dashboard** | Alertas en vivo (8 triggers), escenarios, índice de inestabilidad (17 factores), bilateral, cohesión (mini), amnistía, KPIs, semáforo, tensiones, alertas IA, news ticker | APIs en vivo + IA |
| 2 | **SITREP** | Análisis semanal (S1–S9), Briefing, Daily Brief, Análisis IA, exportación PDF directa | SITREP_ALL + Google News + IA |
| 3 | **Matriz** | Matriz 2×2 (violencia × cambio), trayectoria, probabilidades | WEEKS |
| 4 | **Monitor** | 28 indicadores + 32 señales + noticias + verificación | INDICATORS + /api/news |
| 5 | **Cohesión** | ICG: 8 actores + 5 subgrupos, clasificación IA, GDELT, Polymarket, evolución S1→S9 | /api/news?source=cohesion |
| 6 | **Medios** | GDELT: volumen, tono, inestabilidad — 120 días | /api/gdelt |
| 7 | **Conflictividad** | Semanal 2026 + OVCS 2025 + ACLED: protestas, estados, motivos, represión | CONF_SEMANAL + /api/acled |
| 8 | **Internet** | IODA: conectividad, detección de cortes | /api/ioda |
| 9 | **Mercados** | Petróleo (Brent/WTI/Gas), Polymarket, bonos, producción VEN dual-source | /api/oil-prices + /api/polymarket |
| 10 | **Macro VEN** | Tipo de cambio BCV vs paralelo, brecha, YoY interanual, World Bank, IMF, R4V | /api/dolar + /api/socioeconomic |

## Características Principales

### Splash Screen Animado
Logo PNUD pixel art SVG que se construye píxel por píxel (globo → laureles → P-N-U-D). Texto centrado en móvil. El dashboard aparece solo cuando todos los datos están listos.

### Precios de Petróleo en Vivo
Estrategia de 3 niveles para Brent/WTI en tiempo real:
1. **Browser-side API fetch** — el navegador del usuario llama directamente a OilPriceAPI (IP de usuario, no bloqueada)
2. **Widget DOM scraping** — fallback que monta widget oculto y extrae precios
3. **EIA** — fallback final con datos históricos (~3-5 días de delay)

Las alertas indican la fuente: sin etiqueta = live, "(EIA)" = datos con delay.

### Gráficas Interactivas con Zoom y PDF
4 gráficas (Brent, Producción VEN, Tipo de Cambio, Brecha) con:
- Zoom: 1M / 3M / 6M / 1Y / Todo (producción: 2Y / 5Y / Todo)
- Exportación PDF directa (html2canvas + jsPDF)
- Tooltips hover

### Producción Petrolera Dual-Source
68 datos (2016–2026) con dos valores por punto:
- `value`: fuentes secundarias (OPEC ASB, EIA, Venezuelanalysis, CEIC)
- `dc`: comunicación directa PDVSA
- Barras púrpura PDVSA + tooltip comparativo

### Vista YoY Tipo de Cambio
Toggle "Absoluto" ↔ "Var. interanual": BCV YoY%, Paralelo YoY%, Δ Brecha (pp), línea cero.

### Botón "Explicar con IA" (Índice de Inestabilidad)
Genera 2 párrafos analíticos con contexto completo: 17 factores, Brent, protestas, estados, ICG, tensiones. El prompt aclara que cobertura territorial = extensión geográfica del descontento (factor de inestabilidad, no estabilizador). Prioriza fuentes oficialistas como indicador primario de cohesión.

### Persistencia Supabase
- **daily_readings**: cron + write-back frontend (bilateral, ICG, GDELT tone, brecha, Brent, WTI)
- **Artículos RSS**: cache para lectura rápida
- **Write-back bidireccional**: frontend escribe datos live a Supabase

### Performance
- `visibilitychange` en 3 setIntervals (petróleo, dólar, liveData) — pausa cuando tab oculto
- `loadScript`/`loadCSS` helpers deduplicación
- `handleCohesion` timeout 25s anti-hang
- 10 componentes `React.memo`

## Alertas en Vivo por Umbral (8 triggers)

| Dato | 🔴 Crítico | 🟡 Seguimiento | Fuente |
|------|-----------|----------------|--------|
| Brecha cambiaria | >55% | >40–45% | /api/dolar |
| Dólar paralelo | >700 Bs | >600 Bs | /api/dolar |
| Brent | <$60 o >$95 | <$65 o >$85 | OilPriceAPI / EIA |
| WTI | <$55 o >$90 | <$60 o >$80 | OilPriceAPI / EIA |
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
| 7 | Protestas semanal | 5% | CONF_SEMANAL | Semanal |
| 8 | Bilateral 🇺🇸🇻🇪 | 5% | /api/bilateral | **Diario** |
| 9 | Cohesión GOB (invertido) | 5% | ICG | **Diario** |
| 10 | Cobertura territorial | 4% | CONF_SEMANAL | Semanal |
| 11 | Brent presión | 4% | /api/oil-prices | **5 min** |
| 12 | Brecha amnistía | 4% | AMNISTIA_TRACKER | Semanal |
| 13 | Tendencia mensual | 3% | CONF_SEMANAL (4 sem) vs 2025 | Semanal |
| 14 | Represión | 3% | CONF_SEMANAL | Semanal |
| 15 | Presos políticos | 3% | AMNISTIA_TRACKER | Semanal |
| 16 | E1 Transición | -6% | WEEKS | Semanal (resta) |
| 17 | E3 Continuidad | -3% | WEEKS | Semanal (resta) |

Zonas: 0–25 Estabilidad relativa · 26–50 Tensión moderada · 51–75 Inestabilidad alta · 76–100 Crisis inminente

## Índice de Cohesión de Gobierno (ICG)

Mide la alineación interna de la élite gobernante (0–100).

### Actores monitoreados (13)

**Individuales (8)**: Delcy Rodríguez · Jorge Rodríguez · Diosdado Cabello · FANB · Vladimir Padrino López · Jorge Arreaza · Nicolás Maduro Guerra · Asamblea Nacional

**Sistémicos (5)**: PSUV · Chavismo (movimiento) · Colectivos · Gobernadores chavistas · Sector militar amplio

### Pipeline

Google News RSS → Mistral IA (ALINEADO/NEUTRO/TENSIÓN) → GDELT tono + menciones → Heurística relativa → Scoring compuesto

### Componentes del ICG

| Componente | Con SITREP | Sin SITREP | Fuente |
|------------|-----------|-----------|--------|
| Alineación IA (actores) | 25% | 35% | Mistral + Google News |
| Validación SITREP | 30% | — | ICG_HISTORY |
| Divergencia tono GDELT | 10% | 15% | GDELT API |
| Cohesión sistémica | 10% | 15% | Mistral + GDELT |
| Señal Polymarket | 10% | 10% | Gamma API |
| Silencio mediático | 5% | 10% | GDELT menciones |

## Cascada de Proveedores IA

| # | Proveedor | Modelo | Free Tier | Estado |
|---|-----------|--------|-----------|--------|
| 1 | **Mistral** | mistral-small-latest | 2M tok/mes | ✅ Principal |
| 2 | Gemini | gemini-2.0-flash | 1M tok/día | ⚠️ No funcional |
| 3 | **Groq** | llama-3.3-70b-versatile | 500K tok/día | ✅ Respaldo |
| 4 | OpenRouter | llama-3.1-8b-instruct:free | 50–1,000 req/día | 🔄 Sin probar |
| 5 | HuggingFace | Qwen2.5-72B | ~200-500 req/día | 🔄 Sin probar |
| 6 | Claude | claude-sonnet-4 | Pago | 💰 Premium |

### Consumo estimado (73 personas, con optimización ICG planificada)

| Usuarios activos/día | Tok/día total | Mistral cubre | Groq cubre (% diario) | Costo |
|----------------------|---------------|---------------|-----------------------|-------|
| 5 | 45K | 30 días | — | $0 |
| 10 | 62K | 28 días | 2 días (12%) | $0 |
| 20 | 96K | 21 días | 9 días (19%) | $0 |
| **73** | **276K** | **7 días** | **23 días (55%)** | **$0** |

### Optimización planificada (próxima sesión)
- ICG vía cron 2x/día (no por usuario) — resultado en Supabase
- 1 solo prompt para 13 actores (en vez de 13 llamadas separadas)
- IA lee artículos completos (primeros 300 palabras, no solo titulares)
- Prioridad en fuentes oficialistas (VTV, Últimas Noticias, MINCI, Correo del Orinoco)
- Reducción total de consumo: **91%** vs diseño original

## Variables de Entorno (Vercel)

| Variable | Requerida | Uso |
|----------|-----------|-----|
| `EIA_API_KEY` | Sí | Petróleo histórico + producción VEN |
| `MISTRAL_API_KEY` | Sí | ICG + IA general (cascada #1) |
| `GROQ_API_KEY` | Recomendada | IA respaldo (cascada #2) |
| `SUPABASE_URL` | Sí | DB persistencia |
| `SUPABASE_SECRET_KEY` | Sí | Auth Supabase |
| `OILPRICE_API_KEY` | Opcional | Precios live (también en frontend) |
| `GEMINI_API_KEY` | Opcional | No funcional actualmente |
| `OPENROUTER_API_KEY` | Opcional | IA cascada #3 |
| `HF_API_KEY` | Opcional | IA cascada #4 |
| `ANTHROPIC_API_KEY` | Opcional | Claude pago |
| `ACLED_API_KEY` | Opcional | ACLED conflicto |

## Actualización Semanal (Protocolo SITREP)

Editar archivos en `src/data/`:

1. **weekly.js → WEEKS** — Nueva semana (probs, xy, sem, kpis, tensiones, lectura, trendSc)
2. **weekly.js → KPIS_LATEST** — KPIs de la semana
3. **weekly.js → TENSIONS** — Tensiones activas
4. **weekly.js → MONITOR_WEEKS** — Nuevas señales
5. **weekly.js → ICG_HISTORY** — Score cohesión (0–100, sitrep:true)
6. **weekly.js → CONF_SEMANAL** — Protestas, estados, reprimidas, motivos, hecho
7. **sitrep.js → SITREP_ALL** — Nuevo informe completo
8. **indicators.js → INDICATORS** — Acumular hist[]. Nuevos: addedWeek:N
9. **static.js → AMNISTIA_TRACKER** — Nueva entrada (gob + fp + hito)
10. **static.js → SCENARIO_SIGNALS** — Actualizar sem/val

## Limitaciones Conocidas

- **Vercel Hobby**: 12/12 serverless functions. Nuevos endpoints deben fusionarse.
- **Google Trends**: Bloqueado desde IPs datacenter Vercel.
- **eldiario.com**: Bloqueado desde IPs serverless.
- **EsPaja y Provea**: Feeds RSS no responden.
- **GDELT**: Ocasional 429 / CORS blocks.
- **OilPriceAPI key**: Expuesta en frontend (aceptable — free tier, datos públicos).
- **Gemini**: Configurado pero no funcional.

## Stack

- **Frontend**: React 18 + Vite 5 (single-file ~8,100 líneas + 822 líneas data)
- **Hosting**: Vercel Hobby (12 serverless functions, cron diario)
- **DB**: Supabase free tier (daily_readings + artículos)
- **APIs**: PizzINT, GDELT, EIA, OilPriceAPI, IODA, DolarAPI, Google News RSS, ACLED, Polymarket Gamma, World Bank, IMF, UNHCR/R4V
- **IA**: Mistral → Groq → OpenRouter → HuggingFace → Claude (cascada 6 proveedores)
- **Diseño**: Space Mono + DM Sans + Playfair Display, paleta PNUD (#0468B1), pixel art logo SVG
- **Exportación**: html2canvas + jsPDF

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
- **Mistral AI**: [mistral.ai](https://mistral.ai) — IA principal (ICG + análisis)
- **Groq**: [groq.com](https://groq.com) — IA respaldo (llama-3.3-70b)
- **OilPriceAPI**: [oilpriceapi.com](https://www.oilpriceapi.com/) — Precios petróleo en vivo
- **DolarAPI**: [ve.dolarapi.com](https://ve.dolarapi.com/) — Tipo de cambio Venezuela
- **World Bank**: [data.worldbank.org](https://data.worldbank.org) — Indicadores macro
- **IMF**: [imf.org](https://www.imf.org/en/Publications/WEO) — Proyecciones económicas
- **Supabase**: [supabase.com](https://supabase.com) — Persistencia

---

*Monitor de Contexto Situacional · PNUD Venezuela · Análisis Estratégico · Marzo 2026*
