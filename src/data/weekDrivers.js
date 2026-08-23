export const WEEK_DRIVERS = {
  "1": {
    "label": "Transición pacífica — 10% · −3pp",
    "drivers": [
      "La segunda fase del diálogo prevé discutir garantías políticas y civiles en septiembre.",
      "El nuevo Comité de Postulaciones Judiciales reinicia el proceso con 23 integrantes.",
      "La agenda electoral continúa sin un compromiso verificable ni cronograma vinculante.",
      "María Corina Machado permanece fuera del formato negociador.",
      "El Pacto por Venezuela de Enrique Márquez amplía la fragmentación opositora.",
      "E1 baja 3pp porque el avance institucional no garantiza competencia electoral."
    ],
    "signals": ["Cronograma electoral verificable", "Reformulación del CNE", "Incorporación de la Plataforma Unitaria", "Participación de María Corina Machado", "Implementación del nuevo TSJ"]
  },
  "2": {
    "label": "Colapso y fragmentación — 18% · +3pp",
    "drivers": [
      "Se registran 50 protestas, con un pico de 20 el 14 de agosto.",
      "El pico coincide con un acto oficial de entrega de viviendas.",
      "El balance sísmico sube a 6.438 fallecidos y 10.696 viviendas de alto riesgo.",
      "Solo se han entregado 335 viviendas frente a unas 24.400 afectadas y no existe PDNA.",
      "Las fallas eléctricas afectan 214 de 488 horas laborables de la industria.",
      "E2 sube 3pp, sin evidencia de fractura territorial, militar o de mando."
    ],
    "signals": ["Inflación y tipo de cambio", "Recurrencia territorial de protestas", "Publicación de PDNA", "Brecha de desaparecidos", "Fractura civil-militar"]
  },
  "3": {
    "label": "Continuidad negociada — 54% · +2pp",
    "drivers": [
      "La segunda fase del diálogo mantiene el canal transaccional y traslada las garantías políticas a septiembre.",
      "El nuevo procedimiento judicial sustituye el mecanismo anterior sin romper la coordinación.",
      "La omisión de Nicolás Maduro y Cilia Flores en cinco sesiones sugiere disciplina del aparato.",
      "Los activos en oro por unos USD 4.000M entran en un esquema auditado vinculado al Tesoro.",
      "Las exportaciones superan 700.000 b/d por segunda semana y atraen nuevos operadores.",
      "E3 sube 2pp por mayor capacidad de administración sin redistribución efectiva del poder."
    ],
    "signals": ["Resultados de la ronda de septiembre", "Auditoría de activos del Banco de Inglaterra", "Implementación del TSJ", "Nuevos acuerdos petroleros", "Compromiso electoral"]
  },
  "4": {
    "label": "Resistencia coercitiva — 18% · −2pp",
    "drivers": [
      "El aparato estatal conserva disciplina y capacidad de control sobre recursos estratégicos.",
      "La estructura militar y el mando coercitivo continúan sin fisuras públicas.",
      "La conexión de 160 MW de Tocoma mejora parcialmente la capacidad material del Estado.",
      "No se documenta represión masiva durante las 50 protestas del período.",
      "El control opera mediante procedimiento, renta y asignación de recursos.",
      "E4 baja 2pp al no observarse una escalada coercitiva autónoma frente al diálogo."
    ],
    "signals": ["Uso del Decreto 7.066", "Tratamiento de las protestas", "Fricción en la cúpula militar", "Escalada represiva", "Autonomía del aparato coercitivo"]
  }
};

// Archivo acumulativo de drivers detallados. Al incorporar una semana nueva,
// agregar una nueva clave y conservar todas las anteriores.
export const WEEK_DRIVERS_BY_WEEK = {
  S32: WEEK_DRIVERS,
};
