export const OPINION_SNAPSHOT = {
  period: "Últimas encuestas disponibles al corte S37 · campo 24 ago–3 sep 2026; sin encuesta nueva en el ACS",
  source: "AtlasIntel/Bloomberg · Meganalisis",
  cards: [
    { label: "Desaprueba gestión de Delcy Rodríguez", value: 60.5, suffix: "%", delta: "AtlasIntel/Bloomberg · 30 ago–3 sep", color: "#dc2626" },
    { label: "Rechaza el acuerdo petrolero", value: 37.6, suffix: "%", delta: "35,4% a favor · AtlasIntel", color: "#ca8a04" },
    { label: "No confía en la mesa de diálogo", value: 82.4, suffix: "%", delta: "Meganalisis · 24–31 ago", color: "#dc2626" },
    { label: "Intención de voto por Machado", value: 61.2, suffix: "%", delta: "Meganalisis · pregunta electoral", color: "#7c3aed" },
  ],
};

export const LEADERSHIP = [
  { name: "María Corina Machado", positive: 53, negative: 25, balance: 28, source: "AtlasIntel/Bloomberg · 30 ago–3 sep" },
  { name: "Donald Trump", positive: 30, negative: 43, balance: -13, source: "AtlasIntel/Bloomberg · agosto" },
];

export const RODRIGUEZ_TREND = [
  { period: "Ene", approval: 69.9, metric: "Aceptación como presidenta encargada", source: "More Consulting" },
  { period: "Mar", approval: 66.8, metric: "Aceptación como presidenta encargada", source: "More Consulting" },
  { period: "Abr", approval: 65.7, metric: "Aceptación como presidenta encargada", source: "More Consulting" },
  { period: "Jun", approval: 55.6, metric: "Aceptación como presidenta encargada", source: "More Consulting" },
  { period: "Jul", approval: 40.2, metric: "Aceptación como presidenta encargada", source: "More Consulting" },
];

export const INSTITUTION_TRUST = [
  { name: "Rescatistas internacionales", value: 95 },
  { name: "Bomberos", value: 78 },
  { name: "Iglesias", value: 72 },
  { name: "Protección Civil", value: 68 },
  { name: "Empresas privadas", value: 67 },
  { name: "Universidades", value: 65 },
  { name: "Medios de comunicación", value: 64 },
  { name: "FAN", value: 17 },
  { name: "PNB", value: 16 },
];

export const SOCIAL_MOOD = [
  { name: "Indignación", value: 80.2 },
  { name: "Impotencia", value: 73.8 },
  { name: "Tristeza", value: 70.5 },
  { name: "Desesperanza", value: 68.6 },
  { name: "Solidaridad ciudadana", value: 90.3, positive: true },
  { name: "Apoyo internacional", value: 85.8, positive: true },
];

export const US_RELATION = [
  { label: "Sumisión / entrega de recursos", value: 34, previous: 17 },
  { label: "Relación ganar–ganar", value: 26, previous: 34 },
  { label: "Tutela hacia la democracia", value: 25, previous: 32 },
];

export const SURVEY_SOURCES = [
  { name: "AtlasIntel / Bloomberg LATAM Pulse", period: "30 ago–3 sep 2026", scope: "1.922 adultos · reclutamiento digital aleatorio", note: "Margen ±2pp, 95% de confianza. Diferenciar imagen de líderes, aprobación de gestión y opinión del acuerdo." },
  { name: "Meganalisis Verdad Venezuela", period: "24–31 ago 2026", scope: "1.129 adultos · entrevistas telefónicas CATI · 23 estados y Distrito Capital", note: "Margen ±2,92pp, 95% de confianza. La intención de voto no equivale a imagen positiva." },
  { name: "DatinCorp", period: "23 de agosto de 2026", scope: "1.200 entrevistas en hogares · Caracas y 16 estados · ≈90% de la población electoral", note: "Margen de error ±2,83% y 95% de confianza. Comparar cada pregunta con su formulación original." },
  { name: "AtlasIntel / Bloomberg LATAM Pulse", period: "Agosto 2026", scope: "Imagen de liderazgos y preocupaciones", note: "Comparar solo con olas de la misma firma y formulación." },
  { name: "More Consulting", period: "Enero–julio 2026", scope: "Aceptación de la presidenta encargada", note: "Serie longitudinal utilizada para mostrar tendencia interna." },
  { name: "Poder y Estrategia", period: "24–31 julio 2026", scope: "1.040 entrevistas presenciales en ocho ciudades", note: "Cobertura urbana; no equivale automáticamente a una muestra nacional rural." },
  { name: "Meganálisis", period: "Post-terremoto", scope: "Emociones, confianza informativa y respuesta pública", note: "Indicadores asociados a la emergencia; no son aprobación política general." },
  { name: "Atenas Grupo", period: "Julio 2026", scope: "1.208 hogares · clima social y consumo", note: "Se usa como contexto humanitario, no para construir una serie partidista." },
];

export const DATINCORP_2026 = {
  period: "23 de agosto de 2026",
  methodology: "1.200 entrevistas en hogares · Caracas y 16 estados · ±2,83% · 95% de confianza",
  findings: [
    { label:"Economía como prioridad", value:51.4 },
    { label:"Prefiere negociar acuerdos", value:50.2 },
    { label:"Considera limitada la negociación", value:41.4 },
    { label:"Ningún líder lo representa", value:59.0 },
    { label:"Necesita nuevos liderazgos", value:69.4 },
    { label:"Prefiere liderazgos completamente nuevos", value:65.9 },
    { label:"Independiente o no alineado", value:64.6 },
    { label:"María Corina Machado puede conducir transición", value:33.3 }
  ]
};

export const EARTHQUAKE_OPINION = {
  headline: {
    title: "La solidaridad resiste, pero la confianza institucional colapsa",
    text: "Las mediciones posteriores al doble sismo convergen en una evaluación negativa de la gestión y la información oficial, mientras la solidaridad ciudadana y el apoyo internacional conservan valoraciones muy altas.",
  },
  response: [
    { label: "Desconfía de la información oficial", value: 94.1, source: "Meganálisis", tone: "negative" },
    { label: "Respuesta gubernamental mala/muy mala", value: 91.6, source: "Meganálisis", tone: "negative" },
    { label: "Gestión deficiente/muy deficiente", value: 86, source: "Mass Behavior Research", tone: "negative" },
    { label: "Desaprueba la respuesta sísmica", value: 65, source: "AtlasIntel", tone: "negative" },
  ],
  emotions: [
    { label: "Indignación", value: 80.2, source: "Meganálisis" },
    { label: "Impotencia", value: 73.8, source: "Meganálisis" },
    { label: "Tristeza", value: 70.5, source: "Meganálisis" },
    { label: "Desesperanza", value: 68.6, source: "Meganálisis" },
    { label: "En duelo", value: 63, source: "Atenas Grupo" },
    { label: "En alerta o temor", value: 60, source: "Atenas Grupo" },
  ],
  resilience: [
    { label: "Solidaridad ciudadana", value: 90.3, source: "Meganálisis" },
    { label: "Apoyo de otros países", value: 85.8, source: "Meganálisis" },
    { label: "Hogares vinculados a donaciones", value: 67, source: "Atenas Grupo" },
    { label: "Confianza en EE.UU. para reconstrucción", value: 75, source: "AtlasIntel" },
  ],
  priorities: [
    { label: "Crisis habitacional", value: 64, source: "Atenas Grupo" },
    { label: "Vulnerabilidad de infancia y familia", value: 42, source: "Atenas Grupo" },
    { label: "Rescate y gestión de escombros", value: 31, source: "Atenas Grupo" },
    { label: "Riesgo sanitario", value: 25, source: "Atenas Grupo" },
  ],
  services: [
    { label: "Acceso vial restablecido", value: 90, source: "Mass Behavior Research" },
    { label: "Electricidad restablecida en La Guaira", value: 75, source: "Mass Behavior Research" },
    { label: "Agua restablecida en La Guaira", value: 68, source: "Mass Behavior Research" },
  ],
};

// Archivo acumulativo: cada estudio conserva su propia pregunta, universo y metodología.
// No se combinan porcentajes de firmas distintas en una serie única.
export const SURVEY_ARCHIVE = [
  {
    id:"atlas-bloomberg-2026-09", source:"AtlasIntel / Bloomberg LATAM Pulse", period:"30 ago–3 sep 2026",
    methodology:"1.922 adultos · reclutamiento digital aleatorio · ±2pp · 95% de confianza. Medición citada en ACS 4–11 sep.",
    results:[["Desaprueba gestión de Delcy Rodríguez",60.5],["Aprueba gestión de Delcy Rodríguez",24.6],["Rechaza acuerdo petrolero",37.6],["Apoya acuerdo petrolero",35.4],["Cree que EE.UU. será mayor beneficiario",50.2],["Imagen positiva de María Corina Machado",53],["Imagen negativa de María Corina Machado",25],["Imagen positiva de Edmundo González",47],["Aprobación de Donald Trump en agosto",30]]
  },
  {
    id:"meganalisis-2026-08", source:"Meganalisis · Verdad Venezuela", period:"24–31 ago 2026",
    methodology:"1.129 adultos · entrevistas telefónicas CATI · 23 estados y Distrito Capital · ±2,92pp · 95% de confianza. Medición citada en ACS 4–11 sep.",
    results:[["No confía en la mesa de diálogo",82.4],["Considera urgente que el chavismo deje el poder",88.4],["Identifica elección presidencial como prioritaria",79.3],["Intención de voto de María Corina Machado",61.2],["Percibe que su economía no mejoró con Delcy Rodríguez",93.2]]
  },
  {
    id:"datincorp-2026-08-23", source:"DatinCorp", period:"23 ago 2026",
    methodology:"1.200 entrevistas en hogares · Caracas y 16 estados · ±2,83% · 95% de confianza",
    results:[
      ["Gestión de Delcy Rodríguez: mal camino",53], ["Prefiere negociar acuerdos",50.2],
      ["Ningún líder lo representa",59], ["Necesita nuevos liderazgos",69.4],
      ["Independiente/no alineado",64.6], ["María Corina Machado puede conducir transición",33.3]
    ]
  },
  {
    id:"atlas-2026-08", source:"AtlasIntel / Bloomberg LATAM Pulse", period:"Agosto 2026",
    methodology:"Ola regional de imagen de liderazgos y preocupaciones; comparar solo con mediciones equivalentes de la misma firma",
    results:[
      ["Imagen positiva de María Corina Machado",72], ["Imagen positiva de Edmundo González",61],
      ["Imagen positiva de Lorenzo Mendoza",58], ["Imagen negativa de Delcy Rodríguez",71],
      ["Desaprueba la respuesta sísmica",65], ["Confía en EE.UU. para la reconstrucción",75]
    ]
  },
  {
    id:"more-2026-ene-jul", source:"More Consulting", period:"Enero–julio 2026",
    methodology:"Serie comparable de aceptación de Delcy Rodríguez como presidenta encargada",
    results:[["Enero",69.9],["Marzo",66.8],["Abril",65.7],["Junio",55.6],["Julio",40.2]]
  },
  {
    id:"poder-estrategia-2026-07", source:"Poder y Estrategia", period:"24–31 jul 2026",
    methodology:"1.040 entrevistas presenciales en ocho ciudades · cobertura principalmente urbana",
    results:[["Rescatistas internacionales",95],["Bomberos",78],["Iglesias",72],["Protección Civil",68],["FAN",17],["PNB",16]]
  },
  {
    id:"meganalisis-post-sismo", source:"Meganálisis", period:"Post-terremoto 2026",
    methodology:"Clima emocional, confianza informativa y evaluación de la emergencia; respuestas emocionales múltiples",
    results:[["Desconfía de la información oficial",94.1],["Respuesta gubernamental mala/muy mala",91.6],["Solidaridad ciudadana",90.3],["Indignación",80.2],["Impotencia",73.8]]
  },
  {
    id:"atenas-2026-07", source:"Atenas Grupo", period:"Julio 2026",
    methodology:"1.208 hogares · clima social, consumo y prioridades humanitarias",
    results:[["Hogares vinculados a donaciones",67],["Crisis habitacional como prioridad",64],["En duelo",63],["En alerta o temor",60]]
  },
  {
    id:"mass-behavior-post-sismo", source:"Mass Behavior Research", period:"Post-terremoto 2026",
    methodology:"Evaluación de gestión y recuperación de servicios; mantener separada de aprobación política general",
    results:[["Gestión deficiente/muy deficiente",86],["Acceso vial restablecido",90],["Electricidad restablecida en La Guaira",75],["Agua restablecida en La Guaira",68]]
  }
];
