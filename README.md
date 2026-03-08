# Monitor de Contexto Situacional — Venezuela 2026
## PNUD Venezuela · Análisis Estratégico

Dashboard integrado con módulos de [Umbral](https://umbral.watch) (GDELT, IODA, Polymarket).

## Deploy en Vercel (3 pasos)

### Paso 1 — Sube a GitHub
```bash
cd monitor-pnud
git init
git add .
git commit -m "Monitor PNUD v2"
git remote add origin https://github.com/TU_USUARIO/monitor-pnud.git
git push -u origin main
```

### Paso 2 — Conecta con Vercel
1. Ve a [vercel.com](https://vercel.com) y haz login con GitHub
2. Click **"Add New Project"**
3. Selecciona el repo `monitor-pnud`
4. Framework: **Vite** (lo detecta automáticamente)
5. Click **Deploy**

### Paso 3 — Listo
Tu dashboard estará en `https://monitor-pnud.vercel.app` (o el nombre que elijas).

## Desarrollo local
```bash
npm install
npm run dev
# Abre http://localhost:5173
```

## Arquitectura

```
monitor-pnud/
├── api/                    # Vercel Serverless Functions
│   ├── gdelt/index.js      # Proxy GDELT DOC API v2 (3 señales)
│   └── ioda/index.js       # Proxy IODA API v2 (Georgia Tech)
├── src/
│   ├── App.jsx             # Dashboard principal (todo-en-uno)
│   └── main.jsx            # Entry point React
├── index.html              # HTML shell
├── vercel.json             # Config: rewrites + headers CORS
├── vite.config.js          # Vite + React
└── package.json
```

## Tabs

| Tab | Fuente | Conexión |
|-----|--------|----------|
| Dashboard | Datos internos | Estática |
| Matriz | Datos internos | Estática |
| Monitor | Datos internos | Estática |
| GDELT | api.gdeltproject.org | `/api/gdelt` (serverless) |
| Conflictividad | OVCS 2025 | Estática |
| IODA | Georgia Tech | `/api/ioda` (serverless) |
| Polymarket | polymarket.com | Embed directo (iframe) |

## Actualización semanal

Editar `src/App.jsx`:
1. Agregar nueva entrada en `WEEKS[]` con probabilidades
2. Actualizar `KPIS_LATEST`
3. Actualizar `TENSIONS`
4. Actualizar `INDICATORS` si hay cambios de semáforo

## Créditos
- GDELT: [gdeltproject.org](https://www.gdeltproject.org/)
- IODA: [ioda.inetintel.cc.gatech.edu](https://ioda.inetintel.cc.gatech.edu/)
- Umbral: [umbral.watch](https://umbral.watch) — Pablo Hernández Borges
- Polymarket: [polymarket.com](https://polymarket.com)
