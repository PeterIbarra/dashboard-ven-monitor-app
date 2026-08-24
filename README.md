# Monitor de Contexto Situacional — Venezuela 2026

**PNUD Venezuela · Análisis Estratégico · Uso institucional**

Plataforma de análisis situacional para el monitoreo del proceso de estabilización venezolano posterior al 3 de enero de 2026, bajo el liderazgo interino de Delcy Rodríguez (juramentada como presidenta encargada por el TSJ). Integra información editorial semanal, escenarios prospectivos, indicadores en vivo y series históricas para apoyar la lectura estratégica y la toma de decisiones.

**Último corte editorial:** S32 · 14–21 de agosto de 2026
**Cobertura:** S1–S32 · enero–agosto de 2026
**Producción:** [dashboard-ven-monitor-app.vercel.app](https://dashboard-ven-monitor-app.vercel.app/)

> El dashboard combina fuentes con frecuencias y alcances distintos. Las probabilidades, inferencias y resultados asistidos por IA no sustituyen la validación analítica humana.

---

## Capacidades

- Síntesis semanal con alertas, tensiones, KPI e índice compuesto de inestabilidad.
- Matriz de cuatro escenarios con probabilidades, trayectoria y explicación metodológica.
- SITREP semanal y briefing asistido por IA, con envío diario por correo (Daily Brief).
- Asistente conversacional con IA que consulta datos reales del dashboard mediante *tool calling* (historial semanal, señales, SITREP, conflictividad, KPIs, indicadores, prospectiva, amnistía y datos en vivo).
- Monitoreo institucional mediante Gacetas Oficiales (cambios, designaciones, actividad diaria).
- Conflictividad social semanal, mensual, semestral e histórica (OVCS, ACLED).
- Energía, conectividad e inferencias de interrupción eléctrica mediante IODA.
- Índice de tensión bilateral EE. UU.–Venezuela (PizzINT), integrado en alertas y cohesión gubernamental.
- Tipo de cambio, inflación, indicadores socioeconómicos e intervención cambiaria.
- Opinión pública, liderazgos, encuestas y percepción posterior al terremoto.
- Cohesión gubernamental, clima social y conversación digital.
- Medios internacionales, petróleo, mercados y producción energética.
- Monitoreo sísmico, evolución de la emergencia, daños territoriales y reportes de campo.
- Precipitación, anomalías, incendios y vigilancia ambiental por estado.
- Autenticación institucional (Clerk) con gestión de perfil de usuario.
- Exportación de visualizaciones, respaldos JSON/CSV y traducción mediante Google Translate.

---

## Navegación

| # | Módulo | Contenido principal |
|---:|---|---|
| 1 | **Dashboard** | Síntesis, escenarios, alertas, inestabilidad, protestas, opinión, macro y sismos |
| 2 | **SITREP** | Informe semanal, puntos clave y briefing asistido por IA |
| 3 | **Matriz** | Trayectoria, probabilidades, composición, metodología y sub-tab Prospectiva |
| 4 | **Monitor** | Indicadores, señales E1–E4, noticias y verificación |
| 5 | **Gacetas** | Cambios institucionales, designaciones, organismos y actividad diaria |
| 6 | **Conflictividad** | OVCS, ACLED, series 2026, semestre, estados y mapas Leaflet |
| 7 | **Energía y Red** | Electricidad, conectividad, IODA, BGP y alertas territoriales |
| 8 | **Macro VEN** | Tipo de cambio, socioeconómico, indicadores e intervención cambiaria |
| 9 | **Opinión Pública** | Liderazgos, confianza, encuestas y percepción post-sismo |
| 10 | **Clima Social** | Cohesión gubernamental (sub-tab Cohesión), polarización, convivencia y redes |
| 11 | **Medios** | Cobertura internacional, volumen y tono mediático |
| 12 | **Mercados** | Petróleo, producción, precios, estimaciones y mercados predictivos |
| 13 | **Sismos** | Eventos, evolución, daños, infraestructura y evidencia territorial |
| 14 | **Ambiental** | Lluvia, anomalías, pronósticos, incendios y seguimiento por estado |

Dos módulos adicionales viven como sub-tabs dentro de otros (no aparecen en la barra principal): **Cohesión** (dentro de Clima Social) y **Prospectiva** (dentro de Matriz).

El asistente conversacional (ChatBot) y el control de sesión (Clerk) están disponibles de forma persistente sobre los 14 módulos, no como un tab independiente.

---

## Ejecución local

Requisitos: Node.js 18 o superior y npm.

```bash
npm install
npm run dev
```

Vite mostrará la dirección local, normalmente:

```text
http://127.0.0.1:5173/
```

Para validar la versión de producción:

```bash
npm run build
npm run preview
```

No abrir `index.html` directamente mediante `file://`: los módulos, rutas y solicitudes del dashboard requieren un servidor local.

---

## Marco analítico

El sistema utiliza cuatro escenarios mutuamente comparables. Sus probabilidades semanales suman 100 %.

| Código | Escenario | Lectura |
|---|---|---|
| E1 | Transición política pacífica | Apertura institucional y cambio político sin violencia dominante |
| E2 | Colapso y fragmentación | Cambio desordenado, ruptura institucional y mayor riesgo de violencia |
| E3 | Continuidad negociada | Estabilización transaccional sin transformación estructural suficiente |
| E4 | Resistencia coercitiva | Continuidad con mayor coerción, cierre institucional o violencia |

### Metodología de la Matriz

La Matriz separa dos preguntas:

- **Probabilidad:** cuán plausible es cada escenario durante el horizonte analizado.
- **Ubicación:** dónde se sitúa la semana según cambio estructural y violencia/coerción.

Por eso, el escenario dominante no determina por sí solo la posición del punto. Desde S32, cada escenario incorpora una composición cuantitativa auditable basada en:

1. evidencia estructural;
2. señales y acontecimientos semanales;
3. consistencia de la trayectoria;
4. juicio analítico validado por el equipo.

El selector interno de la Matriz es independiente del selector general del Dashboard. La sección desplegable explica la composición de E1–E4, el método de ubicación y la lectura de la semana seleccionada. La serie puede respaldarse mediante JSON y CSV.

### Índice de inestabilidad (19 factores)

El índice compuesto se expresa en una escala de 0 a 100 (`TabDashboard.jsx`). Los factores de presión suman puntos; los dos estabilizadores (E1 y E3) restan:

| # | Factor | Peso | Fuente |
|---:|---|---:|---|
| 1 | Indicadores en rojo | 9 % | `INDICATORS` |
| 2 | E2 Colapso y fragmentación (prob.) | 7 % | `WEEKS` |
| 3 | E4 Resistencia coercitiva (prob.) | 6 % | `WEEKS` |
| 4 | Brecha cambiaria | 9 % | `/api/dolar` |
| 5 | Tensiones rojas | 5 % | `WEEKS` |
| 6 | Señales activas E4+E2 | 5 % | `SCENARIO_SIGNALS` |
| 7 | Presión del Brent | 4 % | `/api/oil-prices` |
| 8 | Índice bilateral (PizzINT) | 4 % | `/api/bilateral` |
| 9 | Cohesión gubernamental (invertida) | 4 % | ICG en vivo |
| 10 | Protestas semanales | 5 % | `CONF_SEMANAL` |
| 11 | Cobertura territorial de protestas | 4 % | `CONF_SEMANAL` |
| 12 | Tendencia mensual vs. 2025 | 3 % | `CONF_SEMANAL` + `CONF_MESES` |
| 13 | Represión | 3 % | `CONF_SEMANAL` |
| 14 | Brecha de amnistía (gobierno vs. Foro Penal) | 3 % | `AMNISTIA_TRACKER` |
| 15 | Presos políticos | 3 % | `AMNISTIA_TRACKER` |
| 16 | Polarización alta en redes (X) | 5 % | `REDES_TOTALS` |
| 17 | Convivencia baja en redes — invertida (X) | 4 % | `REDES_TOTALS` |
| 18 | E1 Transición pacífica (prob.) | **−6 %** (estabilizador) | `WEEKS` |
| 19 | E3 Continuidad negociada (prob.) | **−3 %** (estabilizador) | `WEEKS` |

| Rango | Lectura |
|---:|---|
| 0–25 | Estabilidad |
| 26–50 | Tensión moderada |
| 51–75 | Inestabilidad alta |
| 76–100 | Crisis inminente |

El botón "Explicar con IA" del panel genera, bajo demanda, un análisis narrativo de 2 párrafos citando los factores concretos que más influyen esa semana. El valor es una herramienta de síntesis, no un pronóstico determinista.

---

## Alertas en vivo

`TabDashboard.jsx` calcula 10 disparadores de alerta combinando datos en vivo y datos editoriales, cada uno con dos niveles (seguimiento / crítico):

| Alerta | 🟡 Seguimiento | 🔴 Crítico | Fuente |
|---|---|---|---|
| Brecha cambiaria | >40–45 % | >55 % | `/api/dolar` |
| Dólar paralelo | >600 Bs | >700 Bs | `/api/dolar` |
| Brent | <$65 o >$85 | <$60 o >$95 | OilPriceAPI / EIA |
| WTI | <$60 o >$80 | <$55 o >$90 | OilPriceAPI / EIA |
| Índice bilateral EE. UU.–Venezuela | >1.0σ | >2.0σ | `/api/bilateral` (PizzINT) |
| Protestas semanales | >35/semana | >50/semana | `CONF_SEMANAL` |
| Cobertura territorial | >12 estados | >18 estados | `CONF_SEMANAL` |
| Aceleración de protestas | >50 % vs. semana anterior | >100 % vs. semana anterior | `CONF_SEMANAL` |
| Conectividad (Internet) | degradación en un estado | promedio nacional <70 % | `/api/ioda` |
| Electricidad | fluctuaciones o interrupciones puntuales | caídas >40 % con BGP estable en varios estados | `/api/ioda` |

Las alertas de electricidad distinguen cortes eléctricos (rutas BGP estables, dispositivos de usuario sin respuesta) de cortes de conectividad deliberados (BGP también cae) — ver Conectividad e inferencia eléctrica (IODA) más abajo.

---

## Asistente de IA (ChatBot)

El dashboard incluye un asistente conversacional persistente (`src/components/ChatBot.jsx`) que responde preguntas analíticas citando datos reales del sistema, no desde memoria del modelo.

**Modo herramientas (tool calling):** el asistente tiene acceso a 10 funciones que consultan directamente los datos editoriales y en vivo del dashboard — historial semanal S1–S32 con probabilidades exactas, señales por escenario, SITREP de una semana puntual, conflictividad histórica y mensual, tensiones activas, KPIs recientes, indicadores por dimensión, sesiones prospectivas, tracker de amnistía y datos en vivo (BCV, paralelo, brecha, Brent, WTI). El modelo debe invocar estas herramientas antes de responder sobre cualquier dato del dashboard.

**Proveedores del modo herramientas:** Groq (`llama-3.3-70b-versatile`) → Mistral (`mistral-small-latest`).

**Cascada de respaldo (sin herramientas, inyección de contexto):** si ningún proveedor con *tool calling* responde, el sistema reintenta con Gemini (`gemini-1.5-flash` / `gemini-2.0-flash`) → OpenRouter (`llama-3.1-8b-instruct:free`) → HuggingFace (`Qwen2.5-72B-Instruct`) → Anthropic (Claude).

Flujo del modo herramientas:

```text
Usuario → /api/ai (use_tools: true, messages: [...])
              ↓
    Groq llama-3.3-70b o Mistral small-latest, con las 10 herramientas
              ↓
    Modelo devuelve qué herramientas necesita (puede pedir varias en paralelo)
              ↓
    El frontend las resuelve localmente (los datos ya están en memoria, sin nueva llamada a red)
              ↓
    Resultados de vuelta a /api/ai → respuesta final, con indicador de qué se consultó
```

Máximo 3 rondas de herramientas por conversación. `/api/ai` responde en uno de tres formatos: `{ tool_calls, assistant_message }` (el modelo pidió herramientas), `{ text }` (respuesta directa) o una señal de que ningún proveedor con *tool calling* respondió, momento en el que el frontend reintenta con la cascada de respaldo.

Este es un subsistema de IA distinto al que usa el cron diario (ver siguiente sección): el ChatBot vive en `api/ai/index.js` y opera bajo demanda del usuario; el cron usa `lib/cron/ai.js` para tareas de clasificación y síntesis programadas.

---

## Índice de Cohesión de Gobierno (ICG)

Mide la alineación interna de la élite gobernante en una escala de 0 a 100, sobre 13 actores: 8 individuales (Delcy Rodríguez, Jorge Rodríguez, Diosdado Cabello, FANB, Vladimir Padrino López, Jorge Arreaza, Nicolás Maduro Guerra, Asamblea Nacional) y 5 sistémicos (PSUV, Chavismo, Colectivos, Gobernadores chavistas, Sector militar amplio). El sistema tiene **dos motores separados**, no uno:

**Motor en vivo** (`api/news/index.js?source=cohesion`, el que alimenta el tab Clima Social → Cohesión): combina clasificación de artículos por IA con GDELT, Polymarket y — cuando hay un corte editorial disponible — una validación manual del SITREP:

| Componente | Con SITREP | Sin SITREP |
|---|---:|---:|
| Alineación IA (13 actores) | 25 % | 35 % |
| Validación SITREP | 30 % | — |
| Divergencia de tono GDELT | 10 % | 15 % |
| Silencio mediático | 5 % | 10 % |
| Cohesión sistémica | 10 % | 15 % |
| Señal Polymarket | 10 % | 10 % |

**Motor del cron diario** (`lib/cron/tasks/icgAnalysis.js`, el que persiste el histórico en Supabase): es más simple — promedio ponderado de la alineación de cada actor (ALINEADO=90, NEUTRO=50, TENSIÓN=15) usando como peso la confianza que la IA le asignó a esa clasificación, sin componentes de GDELT, Polymarket o SITREP. Ambos motores comparten el mismo prompt base y las mismas reglas de clasificación, pero producen el score por caminos distintos — si los números no coinciden exactamente entre el tab en vivo y el histórico persistido, esta es la razón.

Reglas de clasificación (aplicadas en código, no solo sugeridas al modelo):

- Un actor reemplazado de su cargo nunca puede quedar como ALINEADO, aunque el reemplazo se presente como "transición ordenada".
- Ausencia de noticias sobre un actor se clasifica como NEUTRO, nunca como ALINEADO — la ausencia de críticas no es evidencia de alineación.
- Solo el cron escribe el score histórico en Supabase; el frontend nunca lo hace directamente.

---

## Tipos de datos

| Tipo | Ejemplos | Frecuencia |
|---|---|---|
| Editorial | SITREP, probabilidades, drivers, tensiones y puntos clave | Semanal |
| API | Tipo de cambio, petróleo, GDELT, IODA, ACLED, Polymarket y bilateral | En vivo o según proveedor |
| Documental | OVCS, encuestas, intervención, sismos y balances institucionales | Según publicación |
| Calculado | Inestabilidad, brechas, agregaciones, tendencias e inferencias | Al cargar o actualizar datos |
| Persistido | Artículos, tasas, lecturas diarias, alertas, Daily Brief, gacetas e infraestructura sísmica | Cron y Supabase |

Los datos mostrados como "en vivo" pueden conservar el último valor disponible si una fuente externa no responde. Las inferencias de electricidad o conectividad deben leerse como señales técnicas, no como confirmaciones oficiales.

---

## Actualización semanal

### Flujo editorial

1. Revisar el Análisis de Contexto Situacional y la Matriz de Escenarios.
2. Extraer acontecimientos, puntos clave, tensiones, indicadores y señales.
3. Crear la nueva semana y asignar probabilidades E1–E4.
4. Validar la composición de los escenarios y sus coordenadas.
5. Actualizar SITREP, drivers y datos temáticos afectados.
6. Ejecutar `npm run build`.
7. Revisar localmente el Dashboard, SITREP, Matriz y los tabs modificados.
8. Descargar el respaldo JSON/CSV de la Matriz cuando corresponda.
9. Subir los cambios a GitHub y verificar el despliegue en Vercel.

El protocolo detallado archivo por archivo (estructura exacta de cada objeto, validaciones y errores frecuentes) se mantiene como documentación interna del equipo editorial y no forma parte de este repositorio.

### Archivos editoriales principales

| Archivo | Responsabilidad |
|---|---|
| `src/data/weekly.js` | Semanas, probabilidades, tensiones, KPI, ICG y conflictividad semanal |
| `src/data/weeks.js` | Barrel de `WEEKS` consumido junto con `weekly.js` |
| `src/data/sitrep.js` | Informe semanal, síntesis, puntos clave y `CURATED_FACTCHECK` |
| `src/data/indicators.js` | 38 indicadores por dimensión y `SCENARIO_SIGNALS` (autoritativo) |
| `src/data/signals.js` | Barrel secundario de señales — debe mantenerse sincronizado con `indicators.js` |
| `src/data/weekDrivers.js` | Drivers y señales de activación por escenario |
| `src/data/static.js` | `GDELT_ANNOTATIONS` que consumen `TabGdelt` y `GdeltChart` (duplica `gdeltAnnotations.js`) |
| `src/data/amnistia.js` | Seguimiento de amnistía, liberaciones y brechas de verificación |
| `src/data/conflictividad.js` | Series históricas y distribución territorial |
| `src/data/confMensual2026.js` | Conflictividad mensual de 2026 |
| `src/data/opinionPublica.js` | Encuestas, liderazgos y cortes de opinión |
| `src/data/intervencion.js` | Intervención cambiaria y cortes documentales |
| `src/data/macroLatest.js` | Último corte macroeconómico validado |
| `src/data/earthquakeHistory.js` | Evolución y balances de la emergencia sísmica |
| `src/data/prospectiva.js` | Sesiones, comparativos e implicaciones prospectivas |

Las señales que pierden vigencia deben conservarse como registro histórico y marcarse como no vigentes; no deben eliminarse sin una decisión editorial explícita.

> **Nota:** `static.js` y `gdeltAnnotations.js` mantienen el mismo array (`GDELT_ANNOTATIONS`) de forma duplicada por cómo importan los componentes de medios. Actualizar solo uno de los dos hace que el tab Medios no muestre los eventos nuevos.

---

## Arquitectura

```text
dashboard-ven-monitor-app-main/
├── src/
│   ├── App.jsx                 # Shell, navegación, liveData y splash (~560 líneas)
│   ├── main.jsx                # Entry point, ClerkProvider
│   ├── constants.js            # Colores y sistema tipográfico
│   ├── components/             # 66 archivos
│   │   ├── tabs/               # 16 (14 módulos de navegación + Cohesión + Prospectiva)
│   │   ├── charts/             # 17 (matrices, series y mapas)
│   │   ├── ChatBot.jsx         # Asistente conversacional con tool calling
│   │   ├── AuthGate.jsx        # Autenticación Clerk, perfil embebido
│   │   └── *.jsx                # 31 widgets y primitivos adicionales
│   ├── data/                   # 27 archivos, contenido editorial y series locales
│   ├── hooks/
│   ├── services/
│   │   └── umbralGacetas.js    # Cliente de Gacetas (API propia o Supabase de Umbral)
│   └── utils/
├── public/data/                 # GeoJSON, perfiles de riesgo y datos territoriales (sismos)
├── api/                          # 12 funciones serverless
├── lib/cron/                    # Lógica y tareas compartidas del cron
├── vercel.json
├── package.json
└── README.md
```

### Decisiones relevantes

- `App.jsx` centraliza `liveData` para evitar solicitudes duplicadas entre tabs.
- Los datos editoriales se mantienen en `src/data/` y no dentro de componentes visuales.
- Las funciones de cron compartidas viven fuera de `api/` para no consumir funciones adicionales.
- La IA asiste en clasificación, síntesis y explicación; las probabilidades y lecturas institucionales permanecen bajo validación humana.
- El frontend degrada de forma controlada cuando una API externa no está disponible.
- Las dependencias npm son deliberadamente mínimas (`@clerk/clerk-react`, `leaflet`, `react`, `react-dom`, `xlsx`). Leaflet CSS/JS, Chart.js, jsPDF y html2canvas se cargan bajo demanda vía CDN (`loadScript`/`loadCSS` en `utils.js`) para mantener liviano el bundle inicial.
- `AuthGate.jsx` envuelve toda la aplicación con Clerk, operando en modo de prueba por decisión de alcance del proyecto (el plan pago no es necesario en esta etapa). El login soporta dos métodos — contraseña directa o código de un solo uso (OTP) por correo — con verificación adicional por OTP cuando Clerk la exige y recuperación de contraseña también vía OTP. La sesión se recuerda por 30 días. La interfaz oculta por CSS el badge "Secured by Clerk" y la sección de cambio de contraseña del perfil, para mantener una experiencia institucional simple.
- Algunas integraciones (Clerk, Sismos, Gacetas) usan claves públicas (`publishable`, seguras de exponer en el cliente) definidas directamente en el código en lugar de variables de entorno. No representa un riesgo de seguridad, pero migrarlas facilitaría rotarlas sin un nuevo despliegue.

### Funciones serverless

El proyecto utiliza las 12 funciones admitidas por el plan Vercel Hobby:

```text
acled · ai · articles · bilateral · cron · dolar
gdelt · ioda · news · oil-prices · polymarket · socioeconomic
```

No se debe crear una carpeta adicional dentro de `api/` sin consolidar otra función. Las nuevas operaciones deben incorporarse a endpoints existentes mediante parámetros como `task`, `source` o `type`. Ejemplo real: `api/gdelt/index.js` sirve tanto los datos de cobertura mediática como los de infraestructura sísmica (reportes, edificios, acopios), y `api/articles/index.js` sirve además las Gacetas Oficiales vía `?type=gacetas`.

---

## Automatización y persistencia

El cron diario se ejecuta mediante `/api/cron` y coordina, en un único disparo (`0 6 * * *`, 6:00 UTC / 02:00 hora Venezuela):

1. tasas de cambio (`fetchRates`);
2. ingestión RSS de 61 feeds (`fetchRSS`);
3. lecturas diarias — GDELT, petróleo, bilateral (`dailyReadings`);
4. análisis de cohesión gubernamental con IA (`icgAnalysis`);
5. alertas de noticias clasificadas con IA (`newsAlerts`).

El **Daily Brief** (`lib/cron/tasks/dailyBrief.js`) no forma parte de este disparo automático: se ejecuta como una tarea separada vía `GET /api/cron?task=dailybrief`. Como Vercel Hobby permite un único `schedule` en `vercel.json`, este segundo envío se dispara mediante un servicio de cron externo (fuera de Vercel), configurado para llamar ese endpoint **tres veces al día**. El diseño completo (arquitectura, fuentes de datos, plantilla de email) está en `DAILY_BRIEF_DESIGN.md` y el esquema en `DAILY_BRIEF_SETUP.sql`.

Ejecutar solo alertas: `GET /api/cron?task=alerts`.

Supabase almacena, entre otras, las siguientes tablas:

| Tabla | Contenido |
|---|---|
| `daily_readings` | Lecturas diarias, ICG, GDELT, mercados y variables compuestas |
| `articles` | Artículos RSS clasificados |
| `rates` | Tipo de cambio oficial y de mercado |
| `news_alerts` | Alertas clasificadas con IA |
| `daily_briefs` | Registro de envíos del Daily Brief por correo |
| `gazette_batches` / `gazette_records` | Lotes y registros de Gaceta Oficial (fuente: Umbral, ver Fuentes principales) |
| `buildings` / `building_damage` / `building_status_timeline` | Inventario y estado de infraestructura afectada por la emergencia sísmica |
| `structural_evaluations` | Evaluaciones estructurales de edificaciones |
| `casualty_stats` | Estadísticas de víctimas de la emergencia sísmica |
| `acopios` | Puntos de acopio y ayuda humanitaria |
| `reports` | Reportes de campo geolocalizados |

Los datos sísmicos (edificios, daños, acopios, reportes) se consultan mediante claves de un proyecto Supabase dedicado, distinto al principal — ver la nota sobre `SISMO_API_KEY` en Variables de entorno.

---

## Variables de entorno

La aplicación puede operar parcialmente sin todas las integraciones. Configurar únicamente las variables necesarias y nunca subir archivos `.env` a GitHub.

| Grupo | Variables principales |
|---|---|
| Base de datos | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY` |
| Inteligencia artificial | `GROQ_API_KEY`, `MISTRAL_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `HF_API_KEY`, `ANTHROPIC_API_KEY` |
| Energía y mercados | `EIA_API_KEY`, `OILPRICE_API_KEY` |
| Conflictividad | `ACLED_EMAIL`, `ACLED_PASSWORD` |
| Ambiente | `FIRMS_API_KEY` |
| Sismos | `SISMO_API_KEY`, `SISMO_BUILDINGS_API_KEY` |
| Correo | `RESEND_API_KEY`, `DAILY_BRIEF_FROM`, `DAILY_BRIEF_FROM_NAME`, `DAILY_BRIEF_TO` |
| Aplicación | `APP_BASE_URL` |

Los nombres exactos deben comprobarse en el endpoint que consume cada integración antes de modificar la configuración de producción.

> **Nota:** `SISMO_API_KEY` y `SISMO_BUILDINGS_API_KEY` figuran en esta tabla como referencia, pero hoy no se leen de variables de entorno — ver la nota sobre claves públicas hardcodeadas en Arquitectura.

---

## Diseño visual

El sistema tipográfico utiliza:

- **Syne:** títulos y encabezados de sección.
- **DM Sans:** texto general, lectura y splash screen.
- **Space Mono:** KPI, tasas, porcentajes, fechas, controles y datos.

El splash institucional mantiene una secuencia mínima de cuatro segundos: el logotipo se construye en píxeles mientras título, subtítulo, barra y mensaje aparecen desde el comienzo.

Los colores de los escenarios son consistentes en todo el sistema:

- E1: verde;
- E2: rojo;
- E3: azul;
- E4: ámbar.

---

## Fuentes principales

| Fuente | Uso |
|---|---|
| Documentos de análisis situacional | Lectura semanal, drivers, escenarios y puntos clave |
| Gaceta Oficial (vía Umbral) | Cambios institucionales y designaciones — `umbral.watch`, servicio de terceros que clasifica y estructura la Gaceta Oficial |
| OVCS | Conflictividad social histórica, semestral y territorial |
| ACLED | Eventos, actores, estados y alertas de conflicto |
| IODA / Georgia Tech | Conectividad y señales técnicas de interrupción |
| GDELT | Cobertura y tono mediático internacional |
| PizzINT | Índice de tensión bilateral EE. UU.–Venezuela |
| EIA | Petróleo, producción y proyecciones energéticas |
| DolarAPI / BCV | Tipo de cambio oficial y de mercado |
| World Bank / IMF / R4V | Variables socioeconómicas y migratorias |
| Polymarket | Probabilidades implícitas de mercados predictivos |
| Foro Penal | Verificación de liberaciones y presos políticos |
| NASA POWER / FIRMS / Open-Meteo | Precipitación, incendios y pronósticos ambientales (Open-Meteo se consulta desde el navegador, un punto por estado) |
| Base sísmica dedicada (Supabase) | Reportes de campo, edificios, evaluaciones estructurales y acopios de la emergencia |
| Clerk | Autenticación y gestión de sesión/perfil de usuario |
| Resend | Envío del Daily Brief por correo |
| Supabase | Persistencia de lecturas, tasas, artículos, alertas, Daily Brief, Gacetas e infraestructura sísmica |

Cada tab muestra sus fuentes y fechas de corte cuando están disponibles.

---

## Funcionalidades técnicas notables

- **Precios de petróleo en 3 niveles:** el navegador del usuario intenta consultar OilPriceAPI directamente (su IP no está bloqueada, a diferencia de las IPs de servidor de Vercel); si falla, se monta un widget oculto que extrae el precio del DOM; como último recurso se usa EIA, con 3–5 días de retraso. Las alertas indican la fuente cuando el dato no es en vivo.
- **Producción petrolera de dos fuentes:** la serie histórica combina fuentes secundarias (OPEC, EIA, Venezuelanalysis, CEIC) con comunicación directa de PDVSA, mostradas por separado para comparar la cifra oficial contra fuentes independientes.
- **Vista año contra año (YoY):** en Macro VEN y en Conflictividad semestral, un toggle cambia entre valores absolutos y variación interanual.
- **Pausa inteligente:** los intervalos de actualización en vivo se pausan automáticamente cuando el usuario cambia de pestaña del navegador (`visibilitychange`) y se reanudan al volver, para ahorrar llamadas a APIs externas.

---

## Limitaciones y cautelas

- Las probabilidades de escenarios representan juicio analítico, no predicciones deterministas.
- Las fuentes externas pueden fallar, cambiar su contrato o presentar retrasos.
- IODA permite formular hipótesis técnicas sobre electricidad y conectividad, no confirmar causas por sí solo.
- Las cifras de documentos diferentes no deben agregarse sin revisar período, universo y metodología.
- Los resultados generados por IA requieren revisión humana antes de su uso institucional, tanto en el ChatBot como en el cron.
- El plan Vercel Hobby limita el despliegue a 12 funciones serverless y a un único `schedule` de cron — el envío del Daily Brief depende de un disparador externo (ver Automatización y persistencia).
- El bundle principal supera actualmente 500 kB; la división de código es una mejora pendiente.
- La autenticación (Clerk) opera en modo de prueba por decisión de costo/alcance — es el primer punto a revisar si el proyecto escala a un uso que lo requiera.
- Gacetas depende de un servicio externo (Umbral) fuera del control directo del equipo; si Umbral cambia su esquema o deja de operar, el tab Gacetas se degrada.
- Los datos sísmicos usan un proyecto Supabase separado del principal.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 |
| Autenticación | Clerk |
| Hosting | Vercel (plan Hobby) |
| Persistencia | Supabase (principal + proyecto dedicado de Umbral para Gacetas + proyecto dedicado para Sismos) |
| Mapas | Leaflet (cargado vía CDN) |
| Hojas de cálculo | SheetJS / XLSX |
| IA — asistente | Groq → Mistral (tool calling) · Gemini → OpenRouter → HuggingFace → Anthropic (respaldo) |
| IA — cron | Mistral → Gemini → Groq → OpenRouter |
| Correo | Resend |
| Tipografía | Syne + DM Sans + Space Mono |

---

## Verificación antes de publicar

```bash
npm run build
```

Comprobar además:

- navegación de los 14 tabs y los 2 sub-tabs (Cohesión, Prospectiva);
- selectores de semana del Dashboard, SITREP y Matriz;
- probabilidades E1–E4 y suma igual a 100 %;
- textos, fechas de corte y fuentes;
- comportamiento responsive;
- ausencia de credenciales sensibles (no públicas) en el repositorio;
- número total de carpetas dentro de `api/`;
- funcionamiento del despliegue después del push;
- si corresponde, que el disparador externo del Daily Brief siga activo.

---

*Monitor de Contexto Situacional · PNUD Venezuela · S32 · 14–21 de agosto de 2026*

