# Monitor de Contexto Situacional — Venezuela 2026

**PNUD Venezuela · Análisis Estratégico · Uso interno**

Dashboard de monitoreo en tiempo real del proceso de estabilización venezolano post-3 de enero de 2026. Integra análisis de escenarios, indicadores semafóricos, señales por escenario, SITREPs semanales, datos de medios internacionales (GDELT), conectividad a internet (IODA), mercados energéticos y condiciones macroeconómicas.

## Arquitectura

```
monitor-pnud/
├── src/
│   ├── App.jsx              # Aplicación completa (single-file, ~330 KB)
│   └── main.jsx             # Entry point React
├── api/                     # Vercel Serverless Functions
│   ├── gdelt/index.js       # Proxy GDELT DOC API v2 (3 señales)
│   ├── ioda/index.js        # Proxy IODA API v2 (Georgia Tech)
│   ├── oil-prices/index.js  # Precios petroleros (Brent, WTI, Gas)
│   ├── news/index.js        # Noticias Venezuela (NewsAPI)
│   ├── articles/index.js    # Artículos (Supabase)
│   ├── rates/index.js       # Tipo de cambio VES/USD
│   ├── dolar/index.js       # Dólar paralelo
│   ├── acled/index.js       # Datos de conflictividad (ACLED)
│   └── cron/index.js        # Cron: sincronización automática
├── index.html               # HTML shell
├── vercel.json              # Config: rewrites + CORS + cron
├── vite.config.mjs          # Vite + React
└── package.json
```

## Tabs del Dashboard

| # | Tab | Icono | Descripción | Fuente de datos |
|---|-----|-------|-------------|-----------------|
| 1 | **Dashboard** | 📊 | Vista ejecutiva: KPIs, semáforo, tensiones, probabilidades | Datos internos (WEEKS, KPIS_LATEST, TENSIONS) |
| 2 | **SITREP** | 📋 | Análisis de Contexto Situacional semanal — 8 semanas navegables con selector | SITREP_ALL (8 informes, S1–S8) |
| 3 | **Matriz** | 🎯 | Matriz de escenarios 2×2 (violencia × cambio), trayectoria, probabilidades, lectura analítica | WEEKS (xy, probs, lectura, trendSc) |
| 4 | **Monitor** | 🚦 | 28 indicadores semafóricos con historial S1–S8, 32 señales E1/E2/E3/E4, noticias, verificación | INDICATORS, SCENARIO_SIGNALS, /api/news |
| 5 | **Medios** | 📡 | GDELT: volumen de artículos, tono mediático, índice de inestabilidad — 120 días | /api/gdelt → GDELT DOC API v2 |
| 6 | **Conflictividad** | ✊ | OVCS 2025: protestas por mes, tipo (DCP/DESCA), servicios públicos, estados, represión | Datos internos (CONF_*) + /api/acled |
| 7 | **Internet** | 🌐 | IODA: conectividad de red en Venezuela, detección de cortes | /api/ioda → Georgia Tech |
| 8 | **Mercados** | 📈 | Precios del petróleo (Brent/WTI/Gas), Polymarket (11 contratos), bonos | /api/oil-prices + Polymarket embeds |
| 9 | **Macro VEN** | 💵 | Tipo de cambio BCV vs paralelo, brecha cambiaria, indicadores macro | /api/rates + /api/dolar |

## Modelo de datos

### 4 Escenarios

| ID | Escenario | Color | Cuadrante en Matriz |
|----|-----------|-------|---------------------|
| E1 | Transición política pacífica | 🟢 Verde | Top-left (cambio alto, violencia baja) |
| E2 | Colapso y fragmentación | 🔴 Rojo | Top-right (cambio alto, violencia alta) |
| E3 | Continuidad negociada | 🔵 Azul | Bottom-left (cambio bajo, violencia baja) |
| E4 | Resistencia coercitiva | 🟡 Amarillo | Bottom-right (cambio bajo, violencia alta) |

### Coordenadas XY de la Matriz

Las coordenadas `xy` de cada semana se calculan como **centroide ponderado** por probabilidades:

```
x = Σ(prob_i × center_x_i) / 100    → eje de violencia (0=baja, 1=alta)
y = Σ(prob_i × center_y_i) / 100    → eje de cambio (0=bajo, 1=alto)

Centros: E1(0.25, 0.75)  E2(0.75, 0.75)  E3(0.25, 0.25)  E4(0.75, 0.25)
```

### Evolución de probabilidades (S1–S8)

```
Semana       E1-Trans  E2-Colapso  E3-Continuidad  E4-Resistencia  Dominante
─────────────────────────────────────────────────────────────────────────────
S1  3–15 ene     5%       45%          40%             10%          E2 (45%)
S2  16–22 ene   15%       25%          50%             10%          E3 (50%)
S3  23–29 ene   20%       10%          60%             10%          E3 (60%)
S4  30e–5f      30%        5%          50%             15%          E3 (50%)
S5  6–13 feb    30%        5%          45%             20%          E3 (45%)
S6  13–20 feb   35%       15%          40%             10%          E3 (40%)
S7  20–27 feb   35%       12%          43%             10%          E3 (43%)
S8  27f–6m      38%       12%          40%             10%          E3 (40%) ●
```

> **S8**: E3 (40%) y E1 (38%) coexisten a solo 2pp de distancia — la más estrecha del ciclo.

### 28 Indicadores del Monitor

Organizados en 4 dimensiones con historial semafórico de 8 semanas:

| Dimensión | Indicadores | Nuevos (S8) | Ejemplos |
|-----------|-------------|-------------|----------|
| ⚡ Energético | 8 | 2 | Exportaciones, ventas, licencias OFAC, refinación, taladros, **recaudación fiscal**, **minería** |
| 🏛 Político | 8 | 2 | Amnistía, excarcelaciones, FANB, ejecutivo, agenda electoral, marcos restrictivos, **cautelares**, **liderazgo opositor** |
| 📊 Económico | 6 | 1 | Brecha cambiaria, inflación, ingresos, electricidad, percepción, **PIB trimestral** |
| 🌐 Internacional | 6 | 1 | Cooperación EE.UU., sanciones UE, China/Rusia, FMI, normalización, **presión legislativa** |

Indicadores nuevos se marcan con badge **NUEVO** y muestran dots grises en semanas donde no existían.

### 32 Señales por Escenario

| Escenario | Señales | Nuevas (S8) | Ejemplo clave |
|-----------|---------|-------------|---------------|
| E3 Continuidad | 9 | 2 | 788 kbd récord, PIB +7.07%, SENIAT +78% |
| E1 Transición | 9 | 6 | MCM 106.84 pts, 66% exige elecciones, H.R. 7674 |
| E4 Resistencia | 7 | 3 | 568 presos, >11.000 cautelares, concentración territorial |
| E2 Colapso | 7 | 1 | Brecha >50%, inflación 174%, 14.8h sin electricidad |

Señales nuevas se marcan con badge **NUEVO**.

## Actualización semanal (protocolo SITREP)

Cuando llega un nuevo Análisis de Contexto Situacional + Matriz de Escenarios, se actualiza `src/App.jsx`:

### 1. WEEKS — Nueva semana

```javascript
// Agregar al final del array WEEKS[]
{ label:"FECHA", short:"S9",
  probs:[{sc:1,v:XX,t:"up|down|flat"},{sc:2,v:XX,...},{sc:3,v:XX,...},{sc:4,v:XX,...}],
  xy:{x:CALC,y:CALC},  // centroide ponderado (ver fórmula arriba)
  sem:{g:N,y:N,r:N},   // conteo semáforo de tensiones (green, yellow, red)
  kpis:{ energia:{...}, economico:{...}, opinion:{...} },
  tensiones:[{l:"green|yellow|red", t:"<b>Título:</b> Detalle."}],
  lectura:"Texto analítico del período...",
  trendSc:N,            // escenario al que empuja la tendencia (1-4)
  trendDrivers:["Factor 1","Factor 2","Factor 3"]
}
```

### 2. SITREP_ALL — Nuevo informe semanal

```javascript
// Agregar al final del array SITREP_ALL[]
{ period:"Fecha completa", periodShort:"Fecha corta",
  keyPoints:[{tag, color, title, text}, ...],  // 3 puntos clave
  sintesis:"Párrafo analítico principal...",
  actores:[
    {name:"EE.UU.", items:[...]},
    {name:"Gobierno Interino", items:[...]},
    {name:"Oposición", items:[...]},
    {name:"Internacional", items:[...]}
  ],
  // Secciones opcionales (detalle expandido — solo semana actual):
  nacional: { amnistia:{solicitudes,libertadesPlenas,...}, rodriguez:[...], allup:"...", mcmAgenda:[...] },
  economia: { kpis:[{value,label,color},...], empresas:[{empresa,desarrollo},...] },
  escenarios: [{name, prob, color, text}, ...],
  comentarios: [{tag, color, title, text}, ...]
}
```

> Las secciones detalladas (`nacional`, `economia`, `escenarios`, `comentarios`) solo se renderizan cuando existen. Las semanas anteriores muestran el formato compacto (síntesis + actores).

### 3. INDICATORS — Acumular historial

Para indicadores existentes, agregar entrada al final de `hist[]`:
```javascript
hist:[...existente, ["green|yellow|red", "up|down|flat", "Valor textual"]]
```

Para indicadores **nuevos**, usar `null` en semanas anteriores y `addedWeek`:
```javascript
{ dim:"Dimensión", icon:"⚡", esc:"E1-4", name:"Nombre",
  desc:"Descripción", umbral:"Regla de umbral...",
  addedWeek:9,  // semana de introducción → badge NUEVO
  hist:[null,null,null,null,null,null,null,null, ["green","up","Valor"]]
}
```

### 4. Estructuras auxiliares a actualizar

| Estructura | Descripción |
|------------|-------------|
| `KPIS_LATEST` | KPIs destacados en el header del Dashboard |
| `TENSIONS` | Lista de tensiones con semáforo para el Dashboard |
| `SCENARIO_SIGNALS` | Señales por escenario E1/E2/E3/E4 en el Monitor |
| `GDELT_ANNOTATIONS` | Eventos clave marcados en el timeline de medios |
| `MONITOR_WEEKS` | Array de labels `["S1","S2",...,"S9"]` — debe coincidir con `hist.length` |

### 5. Gestión de etiquetas NUEVO

```javascript
// Señales nuevas del período actual:
{ name:"Señal nueva", sem:"green", val:"Descripción", isNew:true }

// Indicadores nuevos del período actual:
{ ..., addedWeek:9, hist:[null,...,null, ["green","up","Valor"]] }
```

> **En el siguiente SITREP**: quitar `isNew:true` de las señales de la semana anterior y ponerlos solo en las nuevas. Los `addedWeek` se mantienen permanentemente (marcan cuándo se introdujo cada indicador).

## Variables de entorno (Vercel)

| Variable | Requerida | Uso |
|----------|-----------|-----|
| `EIA_API_KEY` | Sí | Precios petroleros EIA (gratuito, ilimitado) — [eia.gov/opendata](https://www.eia.gov/opendata/register.php) |
| `OILPRICE_API_KEY` | Opcional | Fallback: precios petroleros OilPriceAPI (500 req/mes) |
| `NEWS_API_KEY` | Opcional | NewsAPI para noticias en vivo |
| `SUPABASE_URL` | Opcional | Base de datos de artículos |
| `SUPABASE_KEY` | Opcional | Auth Supabase |
| `ACLED_API_KEY` | Opcional | Datos de conflictividad ACLED |
| `GEMINI_API_KEY` | Opcional | 🤖 IA: Gemini Flash (gratuito) — [aistudio.google.com](https://aistudio.google.com) |
| `GROQ_API_KEY` | Opcional | 🤖 IA: Groq Llama 3.3 70B (gratuito) — [console.groq.com](https://console.groq.com) |
| `OPENROUTER_API_KEY` | Opcional | 🤖 IA: OpenRouter modelos free (gratuito) — [openrouter.ai](https://openrouter.ai) |
| `ANTHROPIC_API_KEY` | Opcional | 🤖 IA: Claude Sonnet (pago) — [console.anthropic.com](https://console.anthropic.com) |

## Deploy

```bash
# 1. Subir a GitHub
cd monitor-pnud
git init && git add . && git commit -m "Monitor PNUD v3"
git remote add origin https://github.com/TU_USUARIO/monitor-pnud.git
git push -u origin main

# 2. Conectar en vercel.com → Add New Project → Seleccionar repo
#    Framework: Vite (autodetect) → Deploy

# 3. Configurar Environment Variables en Vercel Dashboard → Settings
```

## Desarrollo local

```bash
npm install
npm run dev
# → http://localhost:5173
```

> En desarrollo local, las APIs serverless (`/api/*`) no están disponibles. El dashboard usa proxies CORS como fallback para GDELT y muestra datos mock donde las APIs no responden.

## Stack técnico

- **Frontend**: React 18 + Vite 5 (single-file architecture, ~330 KB)
- **Hosting**: Vercel (Edge + Serverless Functions)
- **APIs externas**: GDELT, IODA (Georgia Tech), OilPrice API, NewsAPI, ACLED, Polymarket
- **Diseño**: Space Mono + DM Sans, paleta PNUD (#0468B1), fully responsive

## Créditos

- **GDELT Project**: [gdeltproject.org](https://www.gdeltproject.org/) — Monitoreo global de medios
- **IODA**: [ioda.inetintel.cc.gatech.edu](https://ioda.inetintel.cc.gatech.edu/) — Georgia Tech
- **OVCS**: [observatoriodeconflictos.org.ve](https://www.observatoriodeconflictos.org.ve/) — Conflictividad social
- **Polymarket**: [polymarket.com](https://polymarket.com) — Mercados de predicción
- **ACLED**: [acleddata.com](https://acleddata.com/) — Datos de conflicto armado
- **Umbral**: [umbral.watch](https://umbral.watch) — Pablo Hernández Borges

---

*Monitor de Contexto Situacional · PNUD Venezuela · Análisis Estratégico · Marzo 2026*

## Funcionalidades avanzadas del SITREP

El tab SITREP integra tres herramientas además del informe semanal:

### Vista Briefing (📌)

Botón en el toolbar del SITREP que cambia a un **briefing de una página** tipo resumen ejecutivo, mostrando en una sola vista:

- Barras de probabilidades por escenario con tendencia
- Puntos clave del período compactos
- Semáforo de tensiones (verde/amarillo/rojo)
- Tendencia dominante con drivers
- Actores principales (top 2 items cada uno)
- Síntesis del período
- Análisis IA si fue generado

Ideal para presentaciones rápidas o impresión en una página.

### Generador de documento (📥 Descargar SITREP)

Botón que compila los datos de la semana seleccionada y genera un **archivo HTML descargable** con formato PNUD que incluye:

- Header con gradiente azul y branding PNUD
- Puntos clave del período
- Tabla de escenarios con probabilidades y tendencias
- Síntesis del período
- Semáforo de tensiones
- Dinámicas por actor
- Análisis narrativo IA (si fue generado previamente)
- Footer institucional

El archivo HTML es imprimible, compatible con `Ctrl+P` → PDF, y se auto-nombra con el período (ej: `SITREP_27_feb_6_mar_2026.html`).

### SITREP con IA (🤖 Análisis IA)

Botón que llama a la API de Claude (Sonnet 4) directamente desde el dashboard para generar un **análisis narrativo automatizado** de 4-5 párrafos basado en los datos reales de la semana:

1. Panorama general y escenario dominante
2. Dinámica energética y económica
3. Dinámica política interna y DDHH
4. Factores internacionales y geopolíticos
5. Perspectiva de corto plazo y variables críticas

El análisis se genera en español profesional con tono institucional PNUD, usando exclusivamente los datos del período seleccionado (no inventa datos). Se muestra tanto en la vista Briefing como se incluye en el documento descargable.

> **En Vercel**: `/api/ai` prueba proveedores en cascada: Gemini → Groq → OpenRouter → Claude. Basta con configurar **una sola key** (recomendada: `GEMINI_API_KEY` por ser gratuita y estable). Si un proveedor falla, pasa al siguiente automáticamente.
>
> **En Claude.ai**: las llamadas van directas a la API de Anthropic (el entorno inyecta la autenticación).
>
> **Obtener keys gratuitas**: [aistudio.google.com](https://aistudio.google.com) (Gemini) · [console.groq.com](https://console.groq.com) (Groq) · [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys) (OpenRouter). Ninguna requiere tarjeta de crédito.
