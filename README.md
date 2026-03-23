# Monitor de Contexto Situacional — Venezuela 2026

**PNUD Venezuela · Programa de las Naciones Unidas para el Desarrollo · Análisis Estratégico**

Dashboard de inteligencia situacional para el monitoreo en tiempo real del proceso de estabilización venezolano post-3 de enero de 2026. Diseñado como herramienta analítica para el equipo de PNUD Venezuela, integra un marco de cuatro escenarios con probabilidades semanales, índices compuestos de inestabilidad y cohesión gubernamental, monitoreo de medios con IA, conflictividad social, mercados energéticos y condiciones macroeconómicas.

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

**Workflow editorial**: Recolección de inteligencia humana → Estructuración asistida con IA (Claude) → Diálogo analítico conjunto → Asignación de probabilidades. Este es un diseño deliberado, no una limitación — la IA asiste pero no decide.

---

## Arquitectura

### Vista general

```
dashboard-ven-monitor-app/
│
├── src/                          # Frontend React (70 archivos)
│   ├── App.jsx                   # Orquestador principal (410 líneas)
│   ├── main.jsx                  # Entry point React
│   ├── constants.js              # Tokens de diseño (colores, fonts)
│   ├── utils.js                  # Env detection, CORS, GDELT fetcher, PDF export
│   │
│   ├── hooks/
│   │   └── useIsMobile.js        # Hook responsive
│   │
│   ├── data/                     # Datos editoriales (18 archivos, ~1,170 líneas)
│   │   ├── weekly.js             # WEEKS, KPIS_LATEST, TENSIONS, MONITOR_WEEKS,
│   │   │                         #   ICG_HISTORY, CONF_SEMANAL
│   │   ├── indicators.js         # 28 indicadores × 4 dimensiones + 32 señales
│   │   ├── sitrep.js             # SITREP_ALL (informes S1–S9), CURATED_NEWS,
│   │   │                         #   CURATED_FACTCHECK
│   │   ├── static.js             # SCENARIOS, GDELT_ANNOTATIONS, POLYMARKET_SLUGS,
│   │   │                         #   CONF_HISTORICO, VEN_PRODUCTION_MANUAL, mapas
│   │   ├── redes.js              # REDES_DATA + REDES_TOTALS (polarización/convivencia)
│   │   ├── amnistia.js           # AMNISTIA_TRACKER
│   │   ├── weekDrivers.js        # Drivers y señales por escenario (semana actual)
│   │   └── tabs.js               # Configuración de 10 tabs
│   │
│   └── components/               # UI modular (46 archivos)
│       ├── tabs/ (11)            # Un archivo por tab del dashboard
│       ├── charts/ (16)          # Visualizaciones SVG/canvas
│       └── *.jsx (19)            # Widgets, primitivos, secciones
│
├── api/                          # Vercel Serverless Functions (12/12 Hobby)
│   ├── ai/index.js               # Proxy IA con cascada de proveedores
│   ├── bilateral/index.js        # PizzINT bilateral threat index (USA↔VEN)
│   ├── gdelt/index.js            # GDELT DOC API v2 + Google News RSS headlines
│   ├── ioda/index.js             # IODA API v2 (Georgia Tech, conectividad)
│   ├── oil-prices/index.js       # EIA histórico + STEO forecast + OilPriceAPI live
│   ├── news/index.js             # RSS aggregator + motor de cohesión gubernamental
│   ├── articles/index.js         # Lectura de artículos/alertas desde Supabase
│   ├── polymarket/index.js       # Polymarket Gamma API (11 contratos Venezuela)
│   ├── socioeconomic/index.js    # World Bank + IMF WEO + UNHCR/R4V + Supabase
│   ├── dolar/index.js            # Tipo de cambio BCV + paralelo (DolarAPI)
│   ├── acled/index.js            # ACLED CAST (conflicto armado, protestas)
│   └── cron/index.js             # Orquestador cron diario (60 líneas)
│
├── lib/cron/                     # Módulos del cron (fuera de api/ — no consumen slots)
│   ├── config.js                 # Feeds RSS, tags de escenario, cascada IA
│   ├── utils.js                  # classify(), parseRSS(), upsertToSupabase()
│   ├── ai.js                     # callAICascade() genérico
│   └── tasks/
│       ├── fetchRates.js         # Task 1: DolarAPI → Supabase rates
│       ├── fetchRSS.js           # Task 2: RSS en batches → artículos
│       ├── dailyReadings.js      # Task 3: GDELT + oil + bilateral → snapshot
│       ├── icgAnalysis.js        # Task 4: ICG con IA (13 actores)
│       └── newsAlerts.js         # Task 5: Clasificación de headlines con IA
│
├── index.html                    # Shell HTML (entry point Vite)
├── vercel.json                   # Rewrites, CORS, cron schedule, maxDuration
├── vite.config.js                # Configuración Vite
└── package.json                  # React 18 + Vite 5
```

### Decisiones de arquitectura

**Frontend modular**: App.jsx fue refactorizado de 8,817 líneas (monolito) a 410 líneas (orquestador puro) + 70 archivos con responsabilidades claras. Cada tab, chart y widget vive en su propio archivo.

**Backend serverless con límite duro**: Vercel Hobby permite máximo 12 serverless functions. Los 12 slots están ocupados. Cualquier funcionalidad nueva debe fusionarse en endpoints existentes vía query parameters (ej: `/api/news?source=cohesion`, `/api/dolar?type=live`).

**Cron modular**: El cron diario (`api/cron/index.js`) es un orquestador de 60 líneas que delega a 5 tasks en `lib/cron/`. Los módulos viven fuera de `api/` para no consumir slots de serverless functions.

**Datos editoriales en código**: Los datasets semanales viven en `src/data/`. El protocolo SITREP semanal edita solo estos archivos — nunca toca componentes ni App.jsx.

**Human-in-the-loop**: La IA clasifica noticias, calcula cohesión gubernamental y genera borradores analíticos. Pero las probabilidades de escenario, la lectura estratégica y los indicadores son asignados por analistas humanos.

---

## Tabs del Dashboard

| # | Tab | Componente | Descripción |
|---|-----|-----------|-------------|
| 1 | **Dashboard** | TabDashboard | Alertas en vivo (8 triggers), índice de inestabilidad (17 factores), bilateral USA↔VEN, cohesión mini, amnistía, KPIs, semáforo, señales, news ticker |
| 2 | **SITREP** | TabSitrep | Informe semanal completo, Daily Brief con IA, análisis interactivo, exportación PDF |
| 3 | **Matriz** | TabMatriz | Matriz 2×2 (violencia × cambio político), trayectoria semanal, probabilidades |
| 4 | **Monitor** | TabMonitor | 28 indicadores semafóricos + 32 señales + noticias live + fact-checking |
| 5 | **Clima Social** | TabClimaSocial | Cohesión gubernamental (ICG, sub-módulo TabCohesion) + Redes/Polarización |
| 6 | **Medios** | TabGdelt | GDELT: volumen de artículos, tono mediático, índice de inestabilidad — 120 días |
| 7 | **Conflictividad** | TabConflictividad | Semanal 2026 + OVCS anual 2025 + ACLED: protestas, estados, derechos, represión |
| 8 | **Conectividad** | TabIODA | IODA: conectividad nacional + electricidad, detección de cortes, alertas por estado |
| 9 | **Mercados** | TabMercados | Petróleo (Brent/WTI/Merey), producción VEN, Polymarket, mercados globales |
| 10 | **Macro VEN** | TabMacro | Tipo de cambio BCV vs paralelo, brecha, World Bank, IMF WEO, UNHCR/R4V |

### Clima Social — en detalle

El tab "Clima Social" es uno de los más complejos del dashboard. Agrupa dos dimensiones de análisis bajo un mismo techo, con 4 sub-secciones accesibles mediante botones:

**🏛 Cohesión GOB** — Índice de Cohesión de Gobierno (ICG). Mide qué tan alineada está la élite gobernante. Usa IA para clasificar 13 actores políticos como ALINEADO, NEUTRO o en TENSIÓN a partir de artículos de prensa recientes. Se complementa con datos de GDELT (tono mediático), Polymarket (mercados de predicción) y validación manual del analista. Score de 0 a 100 donde 100 = cohesión total. Se detalla más abajo en su propia sección.

**📱 Redes** — Análisis de polarización y convivencia en la red social X (antes Twitter). Cada interacción (post + likes + reposts) se clasifica simultáneamente en dos dimensiones independientes:

- **Polarización**: ¿Qué tan confrontativo es el mensaje? (Alto → insultos y descalificación / Moderado → crítica fuerte sin deshumanización / Bajo → postura leve / Ninguno → informativo)
- **Convivencia**: ¿Hay voluntad de diálogo? (Alto → llamados a la paz y el diálogo / Moderado → intención conciliadora con reservas / Bajo → escasa voluntad / Ninguno → sin elementos conciliadores)

Estas no son fuerzas opuestas: un mensaje puede ser altamente polarizante y tener convivencia moderada al mismo tiempo (por ejemplo: "este gobierno es corrupto pero debemos dialogar").

KPIs principales:
- **Polarización mod+alta**: ~91% de las interacciones (el discurso confrontativo es la norma, no la excepción)
- **Convivencia mod+alta**: ~63% (existe, pero es tenue y condicional — solo 7.7% es convivencia alta)
- **Índice neto**: Diferencia entre polarización alta y convivencia alta. Positivo = la polarización domina

Visualizaciones disponibles: gráfica espejo (polarización arriba, convivencia abajo), vista solo polarización, solo convivencia, neto, y composición porcentual diaria. Incluye evolución semanal del ratio polarización/convivencia.

**📊 Análisis** — Hallazgos interpretativos del período: por qué los hitos legislativos (como la Ley de Amnistía) polarizan más de lo esperado, por qué la convivencia solo emerge en condiciones excepcionales, y qué implica esto para los 4 escenarios del marco analítico.

**📋 Metodología** — Explicación técnica completa: definición de cada nivel de polarización y convivencia, unidad de análisis (interacción, no mensaje), cobertura temporal, fuente de datos y notas sobre actualización.

Datos: ~4.2 millones de interacciones, 52 días continuos (enero–febrero 2026). Se actualiza cuando el equipo del PNUD entrega nuevos cortes — no es automático.

---

## Índice de Inestabilidad Compuesto (17 factores)

Score 0–100 combinando datos semanales manuales y datos live de APIs:

| # | Factor | Peso | Fuente | Frecuencia |
|---|--------|------|--------|------------|
| 1 | Indicadores en rojo | 10% | INDICATORS | Semanal |
| 2 | Brecha cambiaria | 10% | /api/dolar | ~5 min |
| 3 | E2 Colapso (prob.) | 8% | WEEKS | Semanal |
| 4 | E4 Resistencia (prob.) | 7% | WEEKS | Semanal |
| 5 | Tensiones rojas | 6% | WEEKS | Semanal |
| 6 | Señales E4+E2 activas | 6% | SCENARIO_SIGNALS | Semanal |
| 7 | Protestas semanal | 5% | CONF_SEMANAL | Semanal |
| 8 | Bilateral USA↔VEN | 5% | /api/bilateral | Diario |
| 9 | Cohesión GOB (invertido) | 5% | ICG | Diario |
| 10 | Cobertura territorial | 4% | CONF_SEMANAL | Semanal |
| 11 | Presión Brent | 4% | /api/oil-prices | ~5 min |
| 12 | Brecha amnistía | 4% | AMNISTIA_TRACKER | Semanal |
| 13 | Tendencia mensual | 3% | CONF_SEMANAL | Semanal |
| 14 | Represión | 3% | CONF_SEMANAL | Semanal |
| 15 | Presos políticos | 3% | AMNISTIA_TRACKER | Semanal |
| 16 | E1 Transición (prob.) | -6% | WEEKS | Semanal (resta) |
| 17 | E3 Continuidad (prob.) | -3% | WEEKS | Semanal (resta) |

Zonas: 0–25 Estabilidad relativa · 26–50 Tensión moderada · 51–75 Inestabilidad alta · 76–100 Crisis inminente

---

## Índice de Cohesión de Gobierno (ICG)

Mide la alineación interna de la élite gobernante (0–100). Calculado diariamente por el cron vía IA.

### Actores (13)

**Individuales**: Delcy Rodríguez · Jorge Rodríguez · Diosdado Cabello · FANB · Vladimir Padrino López · Jorge Arreaza · Nicolás Maduro Guerra · Asamblea Nacional

**Sistémicos**: PSUV · Chavismo · Colectivos · Gobernadores chavistas · Sector militar amplio

### Pipeline

Fetch artículos (24h) → Ordenar oficialistas primero → Prompt IA (40 artículos → ALINEADO/NEUTRO/TENSIÓN) → Scoring compuesto → Supabase

### Pesos del ICG

| Componente | Con SITREP | Sin SITREP |
|------------|-----------|-----------|
| Alineación IA (actores) | 25% | 35% |
| Validación SITREP | 30% | — |
| Divergencia tono GDELT | 10% | 15% |
| Cohesión sistémica | 10% | 15% |
| Señal Polymarket | 10% | 10% |
| Silencio mediático | 5% | 10% |

---

## Alertas en Vivo (8 triggers)

| Dato | 🔴 Crítico | 🟡 Seguimiento | Fuente |
|------|-----------|----------------|--------|
| Brecha cambiaria | >55% | >40–45% | /api/dolar |
| Dólar paralelo | >700 Bs | >600 Bs | /api/dolar |
| Brent | <$60 o >$95 | <$65 o >$85 | OilPriceAPI / EIA |
| WTI | <$55 o >$90 | <$60 o >$80 | OilPriceAPI / EIA |
| Bilateral USA↔VEN | >2.0σ | >1.0σ | /api/bilateral |
| Protestas semanales | >50/sem | >35/sem | CONF_SEMANAL |
| Cobertura territorial | >18 estados | >12 estados | CONF_SEMANAL |
| Aceleración protestas | >100% vs anterior | >50% vs anterior | CONF_SEMANAL |

---

## Backend: Cron Diario (6:00 UTC)

5 tasks en secuencia, cada una como módulo independiente en `lib/cron/tasks/`:

| Task | Módulo | Qué hace |
|------|--------|----------|
| 1 | fetchRates.js | DolarAPI → Supabase rates |
| 2 | fetchRSS.js | 60+ feeds en batches de 10 → artículos en Supabase |
| 3 | dailyReadings.js | GDELT tone + EIA oil + PizzINT bilateral → daily_readings |
| 4 | icgAnalysis.js | Artículos + prompt IA → scoring 13 actores → Supabase |
| 5 | newsAlerts.js | Headlines + IA → 8 alertas clasificadas → Supabase |

Ejecutar solo alertas: `GET /api/cron?task=alerts`

---

## Cascada IA

| # | Proveedor | Modelo | Uso principal |
|---|-----------|--------|--------------|
| 1 | **Mistral** | mistral-small-latest | Alertas, clasificación general |
| 2 | **Groq** | llama-3.3-70b-versatile | ICG (razonamiento político) |
| 3 | OpenRouter | llama-3.1-8b-instruct:free | Fallback |
| 4 | HuggingFace | Qwen2.5-72B | Fallback final |
| 5 | Claude | claude-sonnet-4 | Premium (SITREP interactivo) |

---

## Actualización Semanal (Protocolo SITREP)

### Proceso editorial

El ciclo semanal sigue un flujo de 4 pasos:

1. **Recolección** (lunes–jueves): El analista acumula inteligencia de fuentes abiertas, feeds RSS, GDELT, ACLED, mercados y señales del dashboard en vivo.
2. **Estructuración con IA** (jueves–viernes): Sesión con Claude para estructurar hallazgos, contrastar hipótesis y asignar probabilidades preliminares a los 4 escenarios.
3. **Edición de datos** (viernes): Se editan los archivos en `src/data/` con los resultados del análisis. Solo estos archivos cambian — nunca componentes ni App.jsx.
4. **Deploy** (viernes): `git push` → Vercel build automático → dashboard actualizado en 1-2 minutos.

### Archivos que se editan

| Archivo | Datos a actualizar |
|---------|-------------------|
| `weekly.js` → WEEKS | Nueva semana: probabilidades (E1–E4), posición en matriz (xy), semáforo (g/y/r), KPIs por dimensión, tensiones, lectura analítica completa, escenario tendencia (trendSc), drivers de tendencia |
| `weekly.js` → KPIS_LATEST | Snapshot de KPIs de la semana actual (energético, político, opinión) |
| `weekly.js` → TENSIONS | Tensiones activas con semáforo (verde/amarillo/rojo) |
| `weekly.js` → MONITOR_WEEKS | Etiquetas cortas de semanas para el tab Monitor |
| `weekly.js` → ICG_HISTORY | Score de cohesión gubernamental (0–100, sitrep:true) |
| `weekly.js` → CONF_SEMANAL | Protestas totales, estados afectados, reprimidas, motivos, hecho de la semana |
| `sitrep.js` → SITREP_ALL | Informe completo: resumen, puntos clave, análisis por actor, economía, escenarios proyectados |
| `indicators.js` → INDICATORS | Nueva entrada en hist[] de cada uno de los 28 indicadores (semáforo + tendencia + dato) |
| `indicators.js` → SCENARIO_SIGNALS | Actualizar sem y val de las 32 señales por escenario |
| `weekDrivers.js` → WEEK_DRIVERS | Drivers estructurales y señales de activación por cada escenario |
| `amnistia.js` → AMNISTIA_TRACKER | Nueva entrada con cifras gobierno, Foro Penal verificadas, y hito de la semana |
| `redes.js` → REDES_DATA | Datos diarios de polarización/convivencia (se acumulan 7 entradas por semana) |

### Cómo cada archivo alimenta el dashboard

Un solo SITREP semanal actualiza **8 de los 10 tabs** del dashboard. Este es el flujo de distribución:

```
weekly.js ──────────┬──→ Dashboard (KPIs, alertas, semáforo, tensiones)
(WEEKS, KPIS,       ├──→ SITREP (contexto semanal para Daily Brief + IA)
 TENSIONS,          ├──→ Matriz (probabilidades E1–E4, trayectoria, posición xy)
 ICG_HISTORY,       ├──→ Monitor (semanas de referencia)
 CONF_SEMANAL)      ├──→ Cohesión (ICG_HISTORY para validación SITREP)
                    └──→ Conflictividad (CONF_SEMANAL: protestas 2026)

indicators.js ──────┬──→ Dashboard (índice de inestabilidad, 17 factores)
(INDICATORS,        ├──→ SITREP (contexto para análisis IA)
 SCENARIO_SIGNALS)  ├──→ Matriz (señales por escenario)
                    └──→ Monitor (28 indicadores × 4 dimensiones)

sitrep.js ──────────┬──→ SITREP (informe completo, briefing, Daily Brief)
(SITREP_ALL,        └──→ Monitor (noticias curadas + fact-check)
 CURATED_NEWS)

weekDrivers.js ─────────→ Matriz (drivers y señales por escenario)

amnistia.js ────────┬──→ Dashboard (tracker amnistía, brecha oficial vs verificado)
(AMNISTIA_TRACKER)  └──→ SITREP (contexto para análisis IA)

redes.js ───────────┬──→ Dashboard (mini widget polarización)
(REDES_DATA,        └──→ Clima Social (charts, KPIs, tendencias)
 REDES_TOTALS)
```

**Tabs que NO dependen del SITREP** (se alimentan solo de APIs live):
- **Medios** → GDELT API (120 días de datos, actualización automática)
- **Conectividad** → IODA API (conectividad + electricidad en tiempo real)
- **Mercados** → OilPriceAPI + EIA + Polymarket (datos live + históricos)
- **Macro VEN** → DolarAPI + World Bank + IMF (parcialmente, las tasas de cambio son live)

### Ejemplo de impacto de un SITREP

Cuando actualizas `weekly.js` con una nueva semana (ej: S10), esto es lo que cambia automáticamente en el dashboard:

- **Dashboard**: Las 8 alertas se recalculan, el índice de inestabilidad se actualiza, los KPIs muestran datos nuevos, el semáforo cambia, las tensiones se refrescan
- **SITREP**: La nueva lectura aparece en el informe, el Daily Brief con IA tiene nuevo contexto
- **Matriz**: La probabilidad de cada escenario se actualiza, el punto se mueve en la matriz 2×2, la trayectoria se extiende
- **Monitor**: Los indicadores muestran la nueva semana en sus historiales
- **Cohesión**: El ICG_HISTORY se extiende, la validación SITREP pesa 30% del scoring

Todo con un solo `git push`.

---

## Funcionalidades Principales

### Splash Screen animado
Al abrir el dashboard, un logo PNUD en pixel art SVG se construye píxel por píxel (globo ONU → laureles → letras P-N-U-D). El dashboard aparece solo cuando todos los datos iniciales están listos — esto evita que el usuario vea información incompleta.

### News Ticker (barra de noticias)
Una barra superior con scroll continuo muestra las últimas noticias de Google News sobre Venezuela junto con precios live de contratos Polymarket. Se actualiza automáticamente cada 5 minutos.

### Precios de petróleo en vivo
El dashboard usa una estrategia de 3 niveles para obtener precios Brent/WTI lo más actualizados posible:

1. **Directo desde el navegador** — el navegador del usuario consulta OilPriceAPI directamente (la IP del usuario no está bloqueada, a diferencia de las IPs de servidores)
2. **Widget DOM** — si lo anterior falla, monta un widget oculto y extrae los precios automáticamente
3. **EIA** — como último recurso, usa datos de la Agencia de Energía de EE.UU. (con 3-5 días de retraso)

Las alertas del dashboard indican la fuente: sin etiqueta = datos en vivo, "(EIA)" = datos con delay.

### Gráficas interactivas
4 gráficas principales (Brent, Producción VEN, Tipo de Cambio, Brecha Cambiaria) con:
- **Zoom temporal**: 1 mes / 3 meses / 6 meses / 1 año / Todo el historial
- **Exportación PDF**: un botón genera un PDF de la gráfica para incluir en informes
- **Tooltips**: al pasar el cursor muestra el valor exacto de cada punto

### Producción petrolera dual-source
68 datos históricos (2016–2026) con dos valores por punto temporal:
- **Fuentes secundarias**: OPEC ASB, EIA, Venezuelanalysis, CEIC (barras azules)
- **Comunicación directa PDVSA**: datos oficiales del gobierno (barras púrpura)

Esto permite comparar la narrativa oficial vs fuentes independientes visualmente.

### Vista YoY (año contra año) de tipo de cambio
Un toggle que cambia entre vista "Absoluto" (valores en bolívares) y "Variación interanual" (porcentaje de cambio respecto al año anterior) para BCV, paralelo y la diferencia entre ambos.

### Botón "Explicar con IA"
Disponible en el panel del Índice de Inestabilidad. Genera un análisis de 2 párrafos usando IA con contexto completo: los 17 factores del índice, precio del Brent, protestas, estados afectados, cohesión gubernamental y tensiones activas. El análisis se genera en tiempo real cada vez que se presiona.

### Análisis SITREP con IA
En el tab SITREP, el "Daily Brief" genera un resumen analítico de la situación actual usando:
- Noticias frescas de Google News (últimas horas)
- Datos live del dashboard (brecha, bilateral, petróleo)
- Contexto semanal del analista (WEEKS, INDICATORS)
- Cascada de proveedores IA (Mistral → Groq → Claude)

El resultado es un borrador que el analista revisa y complementa — nunca se publica automáticamente.

---

## Persistencia de Datos (Supabase)

El dashboard usa Supabase (base de datos en la nube) para almacenar datos que necesitan persistir entre sesiones:

| Tabla | Qué guarda | Quién escribe | Para qué |
|-------|-----------|--------------|----------|
| `daily_readings` | Foto diaria: bilateral, ICG, tono GDELT, brecha, Brent, WTI | Cron diario + frontend (write-back) | Gráficas longitudinales y tendencias |
| `articles` | Artículos RSS clasificados por escenario y dimensión | Cron (Task 2) | Noticias curadas + input para ICG |
| `rates` | Tipo de cambio diario (BCV + paralelo) | Cron (Task 1) | Historial de brecha cambiaria |
| `news_alerts` | 8 alertas clasificadas por IA | Cron (Task 5) | Panel de alertas del Dashboard |

**Write-back bidireccional**: El frontend no solo lee de Supabase — también escribe. Cuando el dashboard obtiene datos live (bilateral, ICG, petróleo), los guarda en `daily_readings` para que el historial se vaya construyendo automáticamente, incluso sin esperar al cron.

---

## Rendimiento y Optimización

- **Pausa inteligente**: Cuando el usuario cambia a otra pestaña del navegador, los 3 intervalos de actualización (petróleo, dólar, datos generales) se pausan automáticamente y se reactivan cuando vuelve. Esto ahorra recursos y llamadas a APIs.
- **Carga bajo demanda**: Scripts externos (Leaflet para mapas, html2canvas para PDFs, Chart.js para gráficas) se cargan solo cuando se necesitan, no al inicio.
- **Componentes optimizados**: 10+ componentes usan `React.memo` para evitar re-renders innecesarios — es decir, solo se vuelven a dibujar cuando sus datos cambian.
- **Timeout de seguridad**: La función de cohesión tiene un timeout de 25 segundos para evitar que una API lenta bloquee todo el dashboard.

---

## Fuentes de Datos: ¿Qué tan frescos son?

No todos los datos del dashboard se actualizan a la misma velocidad. Es importante saber qué es "en vivo" y qué tiene retraso:

| Dato | Frecuencia real | Mecanismo |
|------|----------------|-----------|
| Brecha cambiaria, dólar paralelo | ~5 minutos | Frontend consulta /api/dolar periódicamente |
| Precios Brent/WTI | ~5 minutos | Browser-side OilPriceAPI o EIA (delay 3-5 días) |
| Bilateral USA↔VEN | Diario | Cron + PizzINT API |
| Cohesión gubernamental (ICG) | Diario | Cron + IA + Supabase |
| Alertas clasificadas | Diario + manual | Cron Task 5, o `GET /api/cron?task=alerts` |
| Noticias RSS | Diario | Cron Task 2 (60+ feeds) |
| GDELT medios | Diario | Cron Task 3 + API directa |
| ACLED conflicto | Semanal (fuente) | /api/acled bajo demanda |
| IODA conectividad | En vivo | Frontend consulta /api/ioda |
| Polymarket | En vivo | Frontend consulta /api/polymarket |
| Escenarios, KPIs, indicadores | Semanal | Edición manual (Protocolo SITREP) |
| SITREP, lectura analítica | Semanal | Edición manual |
| World Bank, IMF, R4V | Trimestral/anual | /api/socioeconomic |

---

## Variables de Entorno

| Variable | Requerida | Uso |
|----------|-----------|-----|
| `SUPABASE_URL` | Sí | Persistencia |
| `SUPABASE_SECRET_KEY` | Sí | Auth Supabase |
| `EIA_API_KEY` | Sí | Petróleo + producción VEN |
| `MISTRAL_API_KEY` | Sí | IA principal |
| `GROQ_API_KEY` | Recomendada | IA / ICG |
| `OILPRICE_API_KEY` | Opcional | Precios live |
| `OPENROUTER_API_KEY` | Opcional | IA fallback |
| `ACLED_API_KEY` | Opcional | Conflicto (OAuth) |
| `ANTHROPIC_API_KEY` | Opcional | Claude premium |

---

## Limitaciones

- **Vercel Hobby**: 12/12 slots ocupados. Nuevas funcionalidades se fusionan en endpoints existentes.
- **Google Trends**: Bloqueado desde IPs datacenter Vercel.
- **Feeds RSS**: VTV, Tal Cual, Infobae fallan frecuentemente.
- **Near-real-time, no real-time**: Datos live tienen cache de 5-10 min. El cron es diario.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite 5 (70 archivos, App.jsx 410 líneas) |
| Hosting | Vercel Hobby (12 functions, cron 6:00 UTC) |
| DB | Supabase free tier |
| APIs | PizzINT, GDELT, EIA, IODA, DolarAPI, ACLED, Polymarket, World Bank, IMF, UNHCR/R4V |
| IA | Mistral → Groq → OpenRouter → HuggingFace → Claude |
| Tipografía | Space Mono + DM Sans + Playfair Display + Syne |
| Exportación | html2canvas + jsPDF |

---

## Créditos y Fuentes Externas

| Fuente | URL | Qué aporta |
|--------|-----|-----------|
| PizzINT | [pizzint.watch](https://www.pizzint.watch/) | Índice de amenaza bilateral USA↔VEN |
| GDELT | [gdeltproject.org](https://www.gdeltproject.org/) | Monitoreo global de medios (volumen, tono, inestabilidad) |
| EIA | [eia.gov](https://www.eia.gov/) | Precios petróleo, producción VEN, forecast STEO |
| IODA | [ioda.inetintel.cc.gatech.edu](https://ioda.inetintel.cc.gatech.edu/) | Conectividad internet + inferencia eléctrica (Georgia Tech) |
| OVCS | [observatoriodeconflictos.org.ve](https://www.observatoriodeconflictos.org.ve/) | Conflictividad social Venezuela |
| Polymarket | [polymarket.com](https://polymarket.com) | Mercados de predicción |
| ACLED | [acleddata.com](https://acleddata.com/) | Datos de conflicto armado y protestas |
| Foro Penal | [@ForoPenal](https://twitter.com/ForoPenal) | Excarcelaciones verificadas, presos políticos |
| Mistral AI | [mistral.ai](https://mistral.ai) | IA principal (clasificación, ICG, análisis) |
| Groq | [groq.com](https://groq.com) | IA respaldo (llama-3.3-70b, razonamiento político) |
| OilPriceAPI | [oilpriceapi.com](https://www.oilpriceapi.com/) | Precios petróleo en vivo |
| DolarAPI | [ve.dolarapi.com](https://ve.dolarapi.com/) | Tipo de cambio Venezuela (BCV + paralelo) |
| World Bank | [data.worldbank.org](https://data.worldbank.org) | Indicadores macroeconómicos |
| IMF | [imf.org](https://www.imf.org/en/Publications/WEO) | Proyecciones económicas WEO |
| UNHCR/R4V | [r4v.info](https://www.r4v.info/) | Datos de migración venezolana |
| Supabase | [supabase.com](https://supabase.com) | Base de datos y persistencia |

---

*Monitor de Contexto Situacional · PNUD Venezuela · Programa de las Naciones Unidas para el Desarrollo · Marzo 2026*
