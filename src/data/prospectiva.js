// Prospectiva — Sesiones y marcos analíticos
// Actualizar PROSPECTIVA_SESSIONS al cerrar cada sesión de prospectiva

export const PROSPECTIVA_SESSIONS = [
  {
    id: "S1",
    label: "Sesión 1",
    date: "Enero 2026",
    escDominante: null,
    escLatente: null,
    nota: "Equidad prospectiva · 4 escenarios sin dominancia clara",
  },
  {
    id: "S2",
    label: "Sesión 2",
    date: "22 abr 2026",
    escDominante: "E3",
    escLatente: "E4",
    nota: "E3 dominante · E4 latente · prescriptivo hacia E1",
  },
];

// Información estática por escenario — actualizar por sesión
// tipo: "positivo" → proximidad = señales verdes activas
// tipo: "negativo" → proximidad = señales rojas activas
export const PROSPECTIVA_ESCENARIOS = [
  {
    esc: "E1",
    nombre: "Transición democrática",
    sub: "Cambio institucional negociado, apertura gradual",
    tipo: "positivo",
    implicacionesPNUD:
      "Socio natural BM/BID · proyectos eléctricos · apoyo en censos y protección social",
    lineasAccion: [
      "Relacionamiento estratégico con IFIs",
      "Fortalecer datos y MEL competitivo",
      "Apoyo a paz y DDHH",
    ],
  },
  {
    esc: "E2",
    nombre: "Colapso y fragmentación",
    sub: "Cambio caótico por rupturas internas en el bloque de poder",
    tipo: "negativo",
    implicacionesPNUD:
      "Triple Nexo · retrasos operativos · apostar por capacitación en entornos hostiles",
    lineasAccion: [
      "Capacitación en entornos hostiles y negociación en conflicto",
      "PNUD como espacio neutral y de diálogo",
      "Censos y sistema eléctrico como áreas resilientes",
    ],
  },
  {
    esc: "E3",
    nombre: "Continuidad negociada",
    sub: "Permanencia con ajustes pragmáticos, gobernanza petrolera tutelada",
    tipo: "positivo",
    implicacionesPNUD:
      "Articulador técnico del Estado ante IFIs · datos sólidos y MEL · sector privado como nuevo actor",
    lineasAccion: [
      "Ofertas programáticas diferenciadas por territorio y financiadores",
      "Plan mancomunado de recaudación de fondos anual",
      "Capacidades transversales del equipo",
    ],
  },
  {
    esc: "E4",
    nombre: "Resistencia y escalada",
    sub: "Violencia sin cambio institucional, control político-militar reforzado",
    tipo: "negativo",
    implicacionesPNUD:
      "Neutralidad técnica como mayor activo · PNUD como facilitador de diálogo · enfoque comunitario",
    lineasAccion: [
      "Mantener neutralidad y formación en paz/seguridad",
      "PNUD como facilitador de diálogo",
      "Enfoque comunitario y protocolos de continuidad operativa",
    ],
  },
];

// Tabla comparativa entre sesiones — ampliar con cada nueva sesión
export const COMPARATIVE_TABLE = [
  {
    dim: "Escenario dominante",
    s1: "Equidad prospectiva entre los 4 escenarios",
    s2: "E3 dominante · E4 latente",
  },
  {
    dim: "Sector eléctrico",
    s1: "Área de mejora potencial",
    s2: "Condicionante estructural de recuperación económica",
  },
  {
    dim: "Movilidad humana",
    s1: "Énfasis en diáspora y retorno exterior",
    s2: "Movilidad interna · expulsiones desde Colombia",
  },
  {
    dim: "PNUD vs IFIs",
    s1: "Competencia BM/BID como riesgo",
    s2: "PNUD como socio natural y articulador técnico",
  },
  {
    dim: "Influencia EE.UU.",
    s1: "Factor externo en sanciones",
    s2: "Mayor incidencia en política interna de lo previsto",
  },
  {
    dim: "Datos y MEL",
    s1: "Necesidad de fortalecer",
    s2: "Urgencia: censos como área programática concreta",
  },
];

// Consideraciones finales — actualizar por sesión
export const CONSIDERACIONES_FINALES = [
  {
    icon: "🗺️",
    titulo: "Transición entre escenarios",
    texto:
      "Venezuela transita entre continuidad negociada y escalada coercitiva según territorio y dimensión analizada.",
  },
  {
    icon: "⚡",
    titulo: "Recuperación eléctrica como condicionante estructural",
    texto:
      "El sector eléctrico implica una estrategia programática central, no sectorial.",
  },
  {
    icon: "💰",
    titulo: "Demanda ciudadana es económica",
    texto:
      "Inflación, salarios y servicios priman sobre demandas políticas en la agenda ciudadana.",
  },
  {
    icon: "🔄",
    titulo: "PNUD en transición programática",
    texto:
      "De contención a gestión de oportunidades · competencia con IFIs · retención de talento.",
  },
  {
    icon: "🧭",
    titulo: "Preparación > predicción",
    texto:
      "Flexibilidad estratégica para múltiples futuros simultáneos es más valiosa que la predicción exacta.",
  },
];
