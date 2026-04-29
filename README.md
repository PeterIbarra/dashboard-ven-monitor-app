# Monitor de Contexto Situacional — Venezuela 2026

**PNUD Venezuela · Programa de las Naciones Unidas para el Desarrollo · Análisis Estratégico**

Dashboard de inteligencia situacional para el monitoreo del proceso de estabilización venezolano post-3 de enero de 2026. Integra un marco de cuatro escenarios con probabilidades semanales, índice de inestabilidad compuesto (19 factores), índice de cohesión gubernamental con IA, asistente analítico conversacional con function calling, análisis prospectivo por sesiones, tracker de amnistía política, conflictividad social, conectividad e inferencia eléctrica vía IODA, mercados energéticos y condiciones macroeconómicas.

**Live**: [dashboard-ven-monitor-app.vercel.app](https://dashboard-ven-monitor-app.vercel.app/)

---

## Marco Analítico

El dashboard opera sobre un **marco de cuatro escenarios** con probabilidades asignadas semanalmente mediante un proceso human-in-the-loop:

| Escenario | Código | Descripción |
|-----------|--------|-------------|
| Transición política pacífica | E1 | Apertura democrática progresiva con calendario electoral |
| Colapso y fragmentación | E2 | Desintegración institucional, crisis económica terminal |
| Continuidad negociada | E3 | Estabilización bajo el esquema energético-diplomático actual |
| Resistencia coercitiva | E4 | Control discrecional con fachada de apertura |

**Workflow editorial**: Recolección de inteligencia humana → Estructuración asistida con IA (Claude) → Diálogo analítico conjunto → Asignación de probabilidades. La IA asiste pero no decide.

---

## Arquitectura

```
dashboard-ven-monitor-app/
│
├── src/
│   ├── App.jsx                   # Orquestador principal + liveData state
│   ├── constants.js              # Tokens de diseño (BG2, BG3, BORDER, TEXT, MUTED,
│   │                             #   ACCENT, SC, SEM, font, fontSans)
│   ├── utils.js                  # IS_DEPLOYED, CORS, GDELT fetcher, PDF export
│   │
│   ├── hooks/
│   │   └── useIsMobile.js
│   │
│   ├── data/                     # 20 archivos — datos editoriales + configuración
│   │   ├── weekly.js             # WEEKS (S1–S15), KPIS_LATEST, TENSIONS,
│   │   │                         #   MONITOR_WEEKS, ICG_HISTORY, CONF_SEMANAL
│   │   ├── indicators.js         # INDICATORS (38 indicadores) + SCENARIO_SIGNALS
│   │   ├── sitrep.js             # SITREP_ALL (S1–S15), CURATED_NEWS,
│   │   │                         #   CURATED_FACTCHECK
│   │   ├── weekDrivers.js        # WEEK_DRIVERS: drivers y señales semana actual
│   │   ├── prospectiva.js        # PROSPECTIVA_SESSIONS, PROSPECTIVA_ESCENARIOS,
│   │   │                         #   COMPARATIVE_TABLE, CONSIDERACIONES_FINALES
│   │   ├── conflictividad.js     # CONF_HISTORICO (2011–2025), CONF_MESES,
│   │   │                         #   CONF_DERECHOS, CONF_SERVICIOS, CONF_ESTADOS
│   │   ├── confMensual2026.js    # CONF_MENSUAL_2026, VZ_STATE_COORDS
│   │   ├── amnistia.js           # AMNISTIA_TRACKER (S1–S15)
│   │   ├── macroSeries.js        # MACRO_SERIES, MACRO_SERIES_META, MACRO_GROUPS
│   │   ├── redes.js              # REDES_DATA + REDES_TOTALS
│   │   ├── tensions.js           # TENSIONS (semaforizadas semana actual)
│   │   ├── kpis.js               # KPIS_LATEST snapshot
│   │   ├── static.js             # SCENARIOS, GDELT_ANNOTATIONS, POLYMARKET_SLUGS,
│   │   │                         #   CONF_HISTORICO legacy, VEN_PRODUCTION_MANUAL,
│   │   │                         #   VZ_MAP
│   │   ├── scenarios.js          # Definición de escenarios (id, name, color)
│   │   ├── tabs.js               # Configuración de 10 tabs
│   │   └── index.js              # Re-exports
│   │
│   └── components/
│       ├── tabs/
│       │   ├── TabDashboard.jsx  # Alertas, índice inestabilidad, bilateral, KPIs
│       │   ├── TabSitrep.jsx     # SITREP, Daily Brief IA, exportación PDF
│       │   ├── TabMatriz.jsx     # Subtabs: Escenarios | Prospectivas
│       │   ├── TabProspectiva.jsx# Proximidad escenarios + historial sesiones
│       │   ├── TabMonitor.jsx    # 38 indicadores + señales + noticias + factcheck
│       │   ├── TabClimaSocial.jsx# ICG + Redes: Cohesión | Redes | Análisis | Metodología
│       │   ├── TabCohesion.jsx   # Sub-componente ICG dentro de ClimaS
│       │   ├── TabGdelt.jsx      # GDELT medios
│       │   ├── TabConflictividad.jsx # OVCS + ACLED + mapas
│       │   ├── TabIODA.jsx       # Dual index: conectividad + electricidad
│       │   ├── TabMercados.jsx   # Petróleo + Polymarket
│       │   └── TabMacro.jsx      # BCV + paralelo + World Bank + IMF
│       ├── charts/               # Visualizaciones (Sparkline, FullMatrix,
│       │                         #   ConflictividadChart, RedesChart, etc.)
│       ├── ChatBot.jsx           # Asistente con function calling
│       ├── AuthGate.jsx          # Clerk auth: OTP + contraseña
│       ├── NewsTicker.jsx        # Barra noticias + Polymarket scroll
│       └── *.jsx                 # Widgets y componentes compartidos
│
├── api/                          # Vercel Serverless Functions (12/12 Hobby)
│   ├── ai/index.js               # Modo A: tool calling (Groq+Mistral)
│   │                             # Modo B: inyección clásica (cascada completa)
│   ├── bilateral/index.js        # PizzINT bilateral threat index USA↔VEN
│   ├── gdelt/index.js            # GDELT DOC API v2 + Google News RSS
│   ├── ioda/index.js             # IODA API v2 (Georgia Tech)
│   ├── oil-prices/index.js       # EIA histórico + STEO forecast + OilPriceAPI
│   ├── news/index.js             # RSS aggregator + motor cohesión gubernamental
│   ├── articles/index.js         # Artículos + alertas desde Supabase
│   ├── polymarket/index.js       # Polymarket Gamma API (11 contratos Venezuela)
│   ├── socioeconomic/index.js    # World Bank + IMF WEO + UNHCR/R4V + Supabase
│   ├── dolar/index.js            # BCV + paralelo (DolarAPI)
│   ├── acled/index.js            # ACLED CAST
│   └── cron/index.js             # Orquestador: ?task= routing
│
├── lib/cron/                     # Módulos cron (fuera de api/ — no consumen slots)
│   ├── config.js                 # Feeds RSS, tags, cascada IA
│   ├── utils.js                  # classify(), parseRSS(), upsertToSupabase()
│   ├── ai.js                     # callAICascade() genérico
│   └── tasks/
│       ├── fetchRates.js         # Task 1: DolarAPI → Supabase rates
│       ├── fetchRSS.js           # Task 2: 60+ feeds → artículos
│       ├── dailyReadings.js      # Task 3: GDELT + EIA + bilateral → snapshot
│       ├── icgAnalysis.js        # Task 4: ICG con IA (13 actores)
│       ├── newsAlerts.js         # Task 5: headlines + IA → alertas
│       └── dailyBrief.js         # Task 6: email diario 11:00 UTC (cron-job.org)
│
├── vercel.json                   # Rewrites, CORS, cron 6:00 UTC,
│                                 #   maxDuration: ai=60s, ioda=45s
└── package.json                  # React 18 + Vite 5
```

### Decisiones de arquitectura

**12 slots serverless ocupados**: Vercel Hobby tiene límite duro de 12 funciones. Todas están en uso. Nuevas funcionalidades se fusionan en endpoints existentes vía `?task=` o `?source=` parameters.

**Cron modular**: El cron nativo de Vercel (`0 6 * * *`) ejecuta las Tasks 1–5. La Task 6 (Daily Brief email) se ejecuta a las 11:00 UTC vía cron-job.org (el timeout de 30s del cliente no afecta — Vercel continúa ejecutando). `maxDuration` = 60s para `/api/ai`, 45s para `/api/ioda`.

**Datos editoriales en código**: Todos los datasets viven en `src/data/`. El protocolo SITREP edita solo estos archivos — nunca toca componentes ni App.jsx.

**Human-in-the-loop deliberado**: La IA clasifica noticias y calcula cohesión. Las probabilidades de escenario, lectura estratégica e indicadores son asignados por analistas humanos.

**liveData centralizado**: App.jsx gestiona un único objeto `liveData` con todo el estado live: `{ dolar, oil, gdeltSummary, news, bilateral, cohesion, ioda, fetched }`. Todos los tabs lo reciben como prop.

---

## Autenticación (Clerk)

Pantalla de login con fondo animado (gradiente + anillos pulsantes PNUD). Dos métodos:
- **OTP**: código de 6 dígitos por correo en cada sesión
- **Contraseña**: acceso directo con clave permanente

Sesión recordada 30 días. La sección de contraseña del perfil de Clerk está oculta por CSS custom para simplificar la interfaz. El badge "Secured by Clerk" también está oculto.

---

## Tabs del Dashboard

| # | Tab | Componente | Descripción |
|---|-----|-----------|-------------|
| 1 | **Dashboard** | TabDashboard | 10 triggers de alerta, índice inestabilidad (19 factores), bilateral USA↔VEN, tracker amnistía, KPIs, semáforo, tensiones, botón "Explicar IA" |
| 2 | **SITREP** | TabSitrep | Informe semanal (S1–S15), Daily Brief con IA, vista Informe / Briefing, exportación PDF |
| 3 | **Matriz** | TabMatriz | Subtab Escenarios: matriz 2×2 + trayectoria + drivers. Subtab Prospectivas: proximidad + sesiones + comparativo |
| 4 | **Monitor** | TabMonitor | 38 indicadores semafóricos, secciones: Indicadores / Señales E1–E4 / Noticias / Verificación |
| 5 | **Clima Social** | TabClimaSocial | Secciones: Cohesión GOB (ICG) / Redes / Análisis / Metodología |
| 6 | **Medios** | TabGdelt | GDELT: volumen, tono mediático, índice inestabilidad — 120 días |
| 7 | **Conflictividad** | TabConflictividad | OVCS anual 2011–2025, semanal 2026, ACLED: por derecho, servicio, estado, represión |
| 8 | **Conectividad** | TabIODA | Dual index: conectividad + electricidad por estado, alertas, BGP, mapa interactivo |
| 9 | **Mercados** | TabMercados | Brent/WTI/Merey, producción VEN dual-source, Polymarket 11 contratos |
| 10 | **Macro VEN** | TabMacro | BCV vs paralelo + brecha, serie histórica, KPIs macro, World Bank + IMF + UNHCR/R4V |

---

## Alertas en Vivo — 10 Triggers

El sistema de alertas en `TabDashboard` calcula triggers en tiempo real combinando datos live y datos editoriales:

| Trigger | 🔴 Crítico | 🟡 Seguimiento | Fuente |
|---------|-----------|----------------|--------|
| Brecha cambiaria | >55% | >45% / >40% | /api/dolar |
| Dólar paralelo | >700 Bs | >600 Bs | /api/dolar |
| Brent | <$60 o >$95 | <$65 o >$85 | OilPriceAPI / EIA |
| WTI | <$55 o >$90 | <$60 o >$80 | OilPriceAPI / EIA |
| Bilateral USA↔VEN | >2.0σ | >1.0σ | /api/bilateral (PizzINT) |
| Protestas semanales | >50/sem | >35/sem | CONF_SEMANAL |
| Cobertura territorial | >18 estados | >12 estados | CONF_SEMANAL |
| Aceleración protestas | >100% vs anterior | >50% vs anterior | CONF_SEMANAL |
| Internet 🌐 | avg nacional <70% | avg <85% o peor estado <50% | /api/ioda (IODA) |
| Electricidad ⚡ | caídas >40% con BGP estable | caídas 20–40% | /api/ioda (IODA) |

Las alertas de electricidad distinguen entre cortes eléctricos (BGP estable) y cortes deliberados de conectividad (BGP también cae). Cada alerta eléctrica genera además una fila individual por estado afectado.

---

## Índice de Inestabilidad Compuesto (19 factores)

Score 0–100. Los pesos se descuentan entre sí — los estabilizadores E1 y E3 restan del total:

| # | Factor | Peso | Fuente | Frecuencia |
|---|--------|------|--------|------------|
| 1 | Indicadores en rojo | 9% | INDICATORS | Semanal |
| 2 | E2 Colapso (prob.) | 7% | WEEKS | Semanal |
| 3 | E4 Resistencia (prob.) | 6% | WEEKS | Semanal |
| 4 | Brecha cambiaria | 9% | /api/dolar | ~5 min |
| 5 | Tensiones rojas | 5% | WEEKS | Semanal |
| 6 | Señales E4+E2 activas | 5% | SCENARIO_SIGNALS | Semanal |
| 7 | Brent presión | 4% | /api/oil-prices | ~5 min |
| 8 | Bilateral Threat Index | 4% | /api/bilateral | Diario |
| 9 | Cohesión GOB (invertida) | 4% | ICG vía Supabase | Diario |
| 10 | Protestas semanal | 5% | CONF_SEMANAL | Semanal |
| 11 | Cobertura territorial | 4% | CONF_SEMANAL | Semanal |
| 12 | Tendencia mensual vs 2025 | 3% | CONF_SEMANAL + CONF_MESES | Semanal |
| 13 | Represión | 3% | CONF_SEMANAL | Semanal |
| 14 | Brecha amnistía (gov vs FP) | 3% | AMNISTIA_TRACKER | Semanal |
| 15 | Presos políticos | 3% | AMNISTIA_TRACKER | Semanal |
| 16 | Polarización alta (Redes X) | 5% | REDES_TOTALS | Por período |
| 17 | Convivencia baja (Redes X) | 4% | REDES_TOTALS | Por período |
| 18 | E1 Transición (estabilizador) | **-6%** | WEEKS | Semanal |
| 19 | E3 Continuidad (estabilizador) | **-3%** | WEEKS | Semanal |

Zonas: 0–25 Estabilidad · 26–50 Tensión moderada · 51–75 Inestabilidad alta · 76–100 Crisis inminente

El botón **"🤖 Explicar IA"** genera un análisis narrativo de 2 párrafos en tiempo real usando la cascada de IA con todos los 19 factores como contexto.

---

## Tab Matriz — Subtabs

### Escenarios
Matriz 2×2 (eje X: cambio político / eje Y: violencia). Muestra la posición de Venezuela semana a semana con línea de trayectoria. Panel lateral con probabilidades, semáforo de drivers, tendencia de escenario y lectura analítica de la semana seleccionada.

### Prospectivas
Conecta los datos vivos con el marco de análisis prospectivo (sesiones anuales/semestrales):

- **Proximidad a escenarios**: 4 cards calculadas desde `SCENARIO_SIGNALS` — señales activas / total, badge Dominante/Latente, implicaciones PNUD y líneas de acción expandibles
- **Historial de sesiones**: línea de tiempo que crece con cada nueva sesión en `prospectiva.js`
- **Análisis comparativo**: tabla sesión anterior vs sesión actual (actualización automática)
- **Consideraciones finales**: hallazgos de la sesión más reciente

Mantenimiento: señales se actualizan cada SITREP (sin trabajo adicional). Contenido estático solo se toca al cerrar cada nueva sesión prospectiva.

---

## Tab Conectividad (IODA) — Dual Index

El tab implementa **dos índices independientes** por estado:

**Índice 1 — Conectividad**: Health score 0–100 basado en sondeo activo (`ping-slash24`), pérdida de paquetes y latencia. Detecta degradación de red, cortes parciales o totales.

**Índice 2 — Electricidad**: Detecta caídas abruptas en el telescopio pasivo de red nacional (`merit-nt`), correlacionadas con estabilidad BGP. Lógica: si los dispositivos finales dejan de responder pero las rutas BGP se mantienen, el patrón es consistente con corte eléctrico (los routers tienen UPS, los dispositivos de usuario no).

Etiquetado honesto: "Posible interrupción eléctrica" con niveles de confianza (baja/media) según si el telescopio confirma o no. No se usa "corte" como hecho sino como hipótesis.

Señales procesadas: `ping-slash24` (sondeo activo), `merit-nt` (telescopio pasivo, excluido si baseline <10), `bgp` (rutas Border Gateway Protocol).

Picker de tiempo unificado para ambos índices. Mapa interactivo Venezuela (Leaflet vía CDN) con puntos de color por estado. Tabla de ranking con score de outage IODA nativo (endpoints `/outages/alerts`, `/outages/events`, `/outages/summary`).

---

## Asistente IA (ChatBot)

Panel flotante accesible desde cualquier tab (💬 esquina inferior derecha). Soporta pantalla completa (⊞). Botón "limpiar" en el header.

### Function Calling

```
Usuario → /api/ai (use_tools: true, messages: [...])
              ↓
    Groq llama-3.3-70b o Mistral small-latest
    con 10 herramientas definidas
              ↓
    { tool_calls: ["get_conflictividad", "get_signals"] }  ← paralelo
              ↓
    Frontend ejecuta localmente (datos ya cargados en memoria)
              ↓
    /api/ai con tool results → respuesta final con badges 🔧
```

Máximo 3 rondas. Si Groq y Mistral fallan → fallback automático a inyección clásica con cascada completa.

### 10 Herramientas

| Herramienta | Datos |
|-------------|-------|
| `get_weekly_history` | Probabilidades S1–S15, lecturas analíticas, semáforos |
| `get_signals` | Señales activas por escenario (sem, val, isNew) |
| `get_sitrep` | SITREP completo de semana específica o última |
| `get_conflictividad` | Histórico anual, mensual 2026, por derecho/servicio/estado |
| `get_tensions` | Tensiones activas semaforizadas semana actual |
| `get_kpis` | KPIs por dimensión |
| `get_indicators` | 38 indicadores semafóricos por dimensión |
| `get_prospectiva` | Sesiones, dominante/latente, implicaciones PNUD |
| `get_amnistia` | Cifras gobierno vs Foro Penal S1–S15 |
| `get_live_data` | BCV, paralelo, brecha, Brent, WTI |

Las respuestas muestran badges 🔧 indicando qué herramientas consultó el modelo. El markdown se renderiza correctamente: tablas HTML, negritas, listas, headings — sin `**` ni `##` visibles en pantalla.

---

## Endpoint `/api/ai` — Dos Modos

### Modo A — Tool calling (ChatBot)
```json
POST /api/ai
{ "messages": [...], "use_tools": true, "max_tokens": 2500 }
```
Respuestas posibles:
- `{ "tool_calls": [...], "assistant_message": {...}, "provider": "groq/llama-3.3-70b" }`
- `{ "text": "...", "provider": "..." }`
- `{ "fallback": true }` → frontend activa inyección clásica

### Modo B — Inyección clásica (ICG, Daily Brief, SITREP IA, fallback ChatBot)
```json
POST /api/ai
{ "prompt": "texto con contexto completo", "max_tokens": 2000 }
```
Cascada: Groq → Mistral → Gemini (1.5-flash / 2.0-flash) → OpenRouter → HuggingFace → Claude

---

## Cascada IA

| # | Proveedor | Modelo | Tool calling | Uso |
|---|-----------|--------|-------------|-----|
| 1 | **Groq** | llama-3.3-70b-versatile | ✅ | ChatBot Modo A, ICG |
| 2 | **Mistral** | mistral-small-latest | ✅ | ChatBot Modo A, alertas |
| 3 | Gemini | gemini-1.5-flash / 2.0-flash | ❌ | Fallback inyección |
| 4 | OpenRouter | llama-3.1-8b-instruct:free | ❌ | Fallback inyección |
| 5 | HuggingFace | Qwen2.5-72B (+ Mistral-7B fallback) | ❌ | Fallback inyección |
| 6 | Claude | claude-sonnet-4-20250514 | ❌ | Premium / último recurso |

---

## Índice de Cohesión de Gobierno (ICG)

Mide la alineación interna de la élite gobernante (0–100). Calculado diariamente por el cron.

**13 actores**:
- Individuales: Delcy Rodríguez, Jorge Rodríguez, Diosdado Cabello, FANB, Vladimir Padrino López, Jorge Arreaza, Nicolás Maduro Guerra, Asamblea Nacional
- Sistémicos: PSUV, Chavismo, Colectivos, Gobernadores chavistas, Sector militar amplio

**Pipeline**: Fetch artículos 24h → Ordenar fuentes oficialistas primero (VTV, MINCI, RNV, Correo del Orinoco = indicadores primarios de cohesión) → Prompt IA → ALINEADO / NEUTRO / TENSIÓN → Scoring → Supabase

**Pesos del ICG**:

| Componente | Con SITREP | Sin SITREP |
|------------|-----------|-----------|
| Alineación IA (13 actores) | 25% | 35% |
| Validación SITREP (manual) | 30% | — |
| Divergencia tono GDELT | 10% | 15% |
| Cohesión sistémica | 10% | 15% |
| Señal Polymarket | 10% | 10% |
| Silencio mediático | 5% | 10% |

**Reglas críticas (en código, no solo en prompt)**:
- Actor reemplazado → nunca ALINEADO — post-procesamiento obligatorio
- Sin noticias / silencio → NEUTRO, no ALINEADO
- El frontend NUNCA escribe scores ICG a Supabase — solo el cron es fuente autoritativa

---

## Daily Brief (Email Diario)

Task 6 del cron, ejecutada a las **11:00 UTC (7:00 AM VET)** vía cron-job.org. Lee de Supabase los artículos de las últimas 24h, los datos del daily_reading más reciente y genera un email de resumen analítico con la cascada IA.

Estrategia de parsing JSON (3 capas): limpieza agresiva → extracción regex por campos → texto raw como fallback.

Proveedor de email: Mailgun (Resend y Brevo/SendGrid probados previamente — no funcionales en este entorno).

---

## Actualización Semanal (Protocolo SITREP)

### Proceso editorial

1. **Recolección** (lunes–jueves): inteligencia de fuentes abiertas, RSS, GDELT, ACLED, mercados, señales del dashboard
2. **Estructuración con IA** (jueves–viernes): sesión con Claude para estructurar hallazgos y asignar probabilidades preliminares
3. **Edición de datos** (viernes): solo se editan archivos en `src/data/`
4. **Deploy** (viernes): `git push` → Vercel build → dashboard actualizado en 1–2 min

### Archivos que se editan cada SITREP

| Archivo | Qué actualizar |
|---------|---------------|
| `weekly.js` → WEEKS | Nueva semana: probs E1–E4, xy, semáforo g/y/r, KPIs por dimensión, tensiones, lectura analítica, trendSc, trendDrivers |
| `weekly.js` → KPIS_LATEST | Snapshot KPIs semana actual |
| `weekly.js` → TENSIONS | Tensiones activas semaforizadas |
| `weekly.js` → ICG_HISTORY | Score ICG (0–100, `sitrep:true`) |
| `weekly.js` → CONF_SEMANAL | Protestas, estados, reprimidas, hecho de la semana |
| `sitrep.js` → SITREP_ALL | Informe completo: dims, keyPoints, sintesis |
| `sitrep.js` → CURATED_NEWS | Noticias curadas de la semana |
| `indicators.js` → INDICATORS | Nueva entrada `hist[]` en cada indicador |
| `indicators.js` → SCENARIO_SIGNALS | Actualizar sem, val; `vigpierde:true` cuando pierde relevancia |
| `weekDrivers.js` → WEEK_DRIVERS | Drivers y señales por escenario |
| `amnistia.js` → AMNISTIA_TRACKER | Cifras gobierno + Foro Penal + hito |

**Regla**: Tanto `CURATED_NEWS` como `SITREP_ALL` deben actualizarse en cada ciclo. Señales que pierden relevancia se marcan `vigpierde:true`, no se eliminan.

### Archivos que se editan por sesión prospectiva (no semanal)

| Archivo | Qué actualizar |
|---------|---------------|
| `prospectiva.js` → PROSPECTIVA_SESSIONS | Nueva sesión: label, date, escDominante, escLatente, nota |
| `prospectiva.js` → COMPARATIVE_TABLE | Nueva columna de comparación |
| `prospectiva.js` → CONSIDERACIONES_FINALES | Hallazgos de la nueva sesión |
| `prospectiva.js` → PROSPECTIVA_ESCENARIOS | Implicaciones PNUD y lineasAccion si cambian |

### Flujo de distribución

```
weekly.js ──────────┬──→ Dashboard (KPIs, 10 alertas, semáforo, tensiones, inestabilidad)
                    ├──→ SITREP (contexto para Daily Brief + IA)
                    ├──→ Matriz / Escenarios (probabilidades, trayectoria)
                    ├──→ Conflictividad (CONF_SEMANAL)
                    └──→ ChatBot (get_weekly_history, get_tensions, get_kpis)

indicators.js ──────┬──→ Dashboard (inestabilidad: factores 1, 6)
                    ├──→ Monitor (38 indicadores × semanas)
                    ├──→ Matriz / Prospectivas (barras de proximidad por escenario)
                    └──→ ChatBot (get_signals, get_indicators)

sitrep.js ──────────┬──→ SITREP (informe completo S1–S15, Daily Brief)
                    ├──→ Monitor (noticias curadas, fact-check)
                    └──→ ChatBot (get_sitrep)

weekDrivers.js ─────┬──→ Matriz / Escenarios (drivers y señales)
                    └──→ ChatBot (contexto en fallback de inyección)

prospectiva.js ─────┬──→ Matriz / Prospectivas (sesiones, comparativo, consideraciones)
                    └──→ ChatBot (get_prospectiva)

amnistia.js ────────┬──→ Dashboard (tracker: gov vs FP, factor 14 y 15 del índice)
                    └──→ ChatBot (get_amnistia)

conflictividad.js ──┬──→ Conflictividad (gráficas históricas, por derecho/estado)
confMensual2026.js  └──→ ChatBot (get_conflictividad)

redes.js ───────────┬──→ Dashboard (mini widget polarización, factores 16 y 17 del índice)
                    └──→ Clima Social / Redes (charts, KPIs, ratio semanal)
```

**Tabs que NO dependen del SITREP** (solo APIs live):
- Medios → GDELT API
- Conectividad → IODA API
- Mercados → OilPriceAPI + EIA + Polymarket
- Macro VEN → DolarAPI + Supabase rates + World Bank + IMF

---

## Backend: Cron Diario

Cron nativo Vercel: `0 6 * * *` → `/api/cron` (Tasks 1–5)
cron-job.org: 11:00 UTC → `/api/cron?task=dailyBrief` (Task 6)

| Task | Módulo | Qué hace |
|------|--------|----------|
| 1 | fetchRates.js | DolarAPI → Supabase `rates` |
| 2 | fetchRSS.js | 60+ feeds en batches de 10 → Supabase `articles` |
| 3 | dailyReadings.js | GDELT tone + EIA oil + PizzINT bilateral → Supabase `daily_readings` |
| 4 | icgAnalysis.js | Artículos (24h) + prompt IA → scoring 13 actores → Supabase `daily_readings` |
| 5 | newsAlerts.js | Headlines + IA → 8 alertas clasificadas → Supabase `news_alerts` |
| 6 | dailyBrief.js | Artículos + datos → email IA 11:00 UTC vía Mailgun |

Ejecutar manualmente: `GET /api/cron?task=alerts`, `GET /api/cron?task=dailyBrief`

---

## Persistencia (Supabase)

| Tabla | Qué guarda | Quién escribe |
|-------|-----------|--------------|
| `daily_readings` | Foto diaria: bilateral, ICG, GDELT tone, brecha, Brent, WTI | Cron Tasks 3–4 + frontend write-back |
| `articles` | Artículos RSS clasificados por escenario y dimensión | Cron Task 2 |
| `rates` | Tipo de cambio diario (BCV + paralelo) | Cron Task 1 |
| `news_alerts` | 8 alertas clasificadas por IA | Cron Task 5 |

**Write-back**: el frontend también escribe en `daily_readings` cuando obtiene datos live (bilateral, ICG, petróleo), construyendo el historial automáticamente sin esperar al cron.

**Nota de mantenimiento**: La variable de entorno se llama `SUPABASE_SECRET` en algunos módulos y `SUPABASE_SECRET_KEY` en otros — inconsistencia no crítica pero a resolver en refactor futuro.

---

## Funcionalidades Notables

### Splash Screen animado
Logo PNUD en pixel art SVG construido en `App.jsx`. El dashboard aparece solo cuando todos los datos iniciales (`liveData.fetched`) están listos — evita que el usuario vea información incompleta.

### News Ticker
Barra superior con scroll continuo: últimas noticias Google News sobre Venezuela + precios de contratos Polymarket. Actualización cada 5 minutos.

### Precios de petróleo — 3 niveles
1. **Browser-side OilPriceAPI** (IP del usuario, no bloqueada)
2. **Widget DOM** — monta widget oculto y extrae precios si falla lo anterior
3. **EIA** — fallback con 3–5 días de retraso

### Producción petrolera dual-source
68 puntos históricos 2016–2026 con dos valores: fuentes secundarias (OPEC/EIA/Venezuelanalysis/CEIC) vs comunicación directa PDVSA.

### Gráficas interactivas
Zoom: 1M / 3M / 6M / 1A / Todo. Exportación PDF con html2canvas + jsPDF. Tooltips en cada punto.

### Vista YoY — Macro VEN
Toggle Absoluto / Variación interanual (%) para BCV, paralelo y brecha cambiaria.

### Pausa inteligente
3 intervalos de actualización (petróleo, dólar, datos generales) se pausan cuando el usuario cambia de pestaña del navegador y se reactivan al volver.

### Componentes optimizados
11 componentes con `React.memo` para evitar re-renders innecesarios.

---

## Variables de Entorno

| Variable | Requerida | Uso |
|----------|-----------|-----|
| `SUPABASE_URL` | Sí | Persistencia |
| `SUPABASE_SECRET_KEY` / `SUPABASE_SECRET` | Sí | Auth Supabase |
| `EIA_API_KEY` | Sí | Petróleo + producción VEN |
| `MISTRAL_API_KEY` | Sí | IA Modo B + tool calling |
| `GROQ_API_KEY` | Recomendada | IA tool calling + ICG |
| `GEMINI_API_KEY` | Recomendada | Fallback inyección |
| `CLERK_SECRET_KEY` | Sí | Autenticación backend |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Sí | Autenticación frontend |
| `OILPRICE_API_KEY` | Opcional | Precios live browser-side |
| `OPENROUTER_API_KEY` | Opcional | Fallback IA |
| `ACLED_API_KEY` | Opcional | Conflicto armado |
| `HF_API_KEY` | Opcional | HuggingFace fallback |
| `ANTHROPIC_API_KEY` | Opcional | Claude premium |
| `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` | Opcional | Daily Brief email |

---

## Frecuencia de Actualización

| Dato | Frecuencia | Mecanismo |
|------|-----------|-----------|
| Brecha cambiaria, paralelo | ~5 min | Frontend → /api/dolar |
| Brent / WTI | ~5 min | OilPriceAPI browser / widget / EIA |
| Conectividad + electricidad IODA | Al cargar tab | /api/ioda |
| Bilateral USA↔VEN | Diario | Cron Task 3 |
| ICG cohesión | Diario | Cron Task 4 |
| Alertas IA | Diario | Cron Task 5 |
| Noticias RSS | Diario | Cron Task 2 |
| Daily Brief email | Diario 11:00 UTC | cron-job.org Task 6 |
| Polymarket | Al cargar tab | /api/polymarket |
| Escenarios, KPIs, indicadores | Semanal | Protocolo editorial |
| SITREP, lectura analítica | Semanal | Protocolo editorial |
| Prospectiva (sesiones) | Por sesión (~trimestral) | Edición manual |
| World Bank / IMF / R4V | Trimestral/anual | /api/socioeconomic |

---

## Limitaciones Conocidas

- **Vercel Hobby**: 12/12 slots ocupados. Todo nuevo endpoint debe fusionarse en uno existente.
- **Yahoo Finance**: Bloqueado desde IPs datacenter — no intentar.
- **IODA sin batch**: No existe endpoint batch — se hacen llamadas individuales por estado (23 estados × endpoints).
- **Google Trends**: Bloqueado desde IPs datacenter.
- **`merit-nt` excluido** si baseline < 10 para un estado (señal insuficiente).
- **Daily Brief email**: Resend (JSON issues) y Brevo/SendGrid (no funcionales) descartados. Mailgun activo.
- **Consistencia `SUPABASE_SECRET`**: Nombre de variable inconsistente entre módulos — no crítico pero pendiente.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite 5 |
| Auth | Clerk (OTP + contraseña) |
| Hosting | Vercel Hobby (12 functions) |
| DB | Supabase free tier |
| IA — tool calling | Groq llama-3.3-70b + Mistral small |
| IA — inyección | Gemini → OpenRouter → HuggingFace → Claude |
| APIs externas | PizzINT, GDELT, EIA, IODA, DolarAPI, ACLED, Polymarket, World Bank, IMF, UNHCR/R4V, OilPriceAPI |
| Email | Mailgun (cron-job.org scheduler) |
| Mapas | Leaflet vía CDN |
| Exportación | html2canvas + jsPDF |
| Tipografía | Space Mono + DM Sans |

---

## Fuentes y Créditos

| Fuente | Qué aporta |
|--------|-----------|
| PizzINT | Índice de amenaza bilateral USA↔VEN |
| GDELT (Georgia Tech) | Monitoreo global medios: volumen, tono, inestabilidad |
| EIA | Precios petróleo, producción VEN, forecast STEO |
| IODA (Georgia Tech) | Conectividad + inferencia de cortes eléctricos |
| OVCS | Conflictividad social Venezuela (anual + semanal) |
| Polymarket | Mercados de predicción (11 contratos Venezuela) |
| ACLED | Conflicto armado y protestas |
| Foro Penal | Excarcelaciones verificadas, presos políticos |
| DolarAPI | Tipo de cambio Venezuela (BCV + paralelo) |
| World Bank / IMF WEO / UNHCR R4V | Macro, proyecciones, migración |
| Supabase | Base de datos y persistencia |
| Clerk | Autenticación |

---

*Monitor de Contexto Situacional · PNUD Venezuela · Abril 2026 · S15*
