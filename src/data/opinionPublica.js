export const OPINION_SNAPSHOT = {
  period: "14–21 ago 2026",
  source: "AtlasIntel/Bloomberg · Poder y Estrategia · Meganálisis",
  cards: [
    { label: "Imagen positiva MCM", value: 72, suffix: "%", delta: "+19pp vs. junio", color: "#2d8a30" },
    { label: "Rechazo a D. Rodríguez", value: 71, suffix: "%", delta: "+10pp vs. junio", color: "#dc2626" },
    { label: "Desconfianza información oficial", value: 94.1, suffix: "%", delta: "Medición post-sismo", color: "#dc2626" },
    { label: "Corrupción: principal preocupación", value: 66.2, suffix: "%", delta: "LATAM Pulse", color: "#ca8a04" },
  ],
};

export const LEADERSHIP = [
  { name: "María Corina Machado", positive: 72, negative: 14, balance: 58, source: "AtlasIntel/Bloomberg" },
  { name: "Edmundo González", positive: 61, negative: 17, balance: 44, source: "AtlasIntel/Bloomberg" },
  { name: "Lorenzo Mendoza", positive: 58, negative: 20, balance: 38, source: "AtlasIntel/Bloomberg" },
  { name: "Marco Rubio", positive: 54, negative: 24, balance: 30, source: "AtlasIntel/Bloomberg" },
  { name: "Donald Trump", positive: 51, negative: 29, balance: 22, source: "AtlasIntel/Bloomberg" },
  { name: "Delcy Rodríguez", positive: 19, negative: 71, balance: -52, source: "AtlasIntel/Bloomberg" },
  { name: "Nicolás Maduro", positive: 11, negative: 79, balance: -68, source: "AtlasIntel/Bloomberg" },
  { name: "Diosdado Cabello", positive: 10, negative: 79, balance: -69, source: "AtlasIntel/Bloomberg" },
  { name: "Jorge Rodríguez", positive: 5, negative: 76, balance: -71, source: "AtlasIntel/Bloomberg" },
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
  { name: "AtlasIntel / Bloomberg LATAM Pulse", period: "Agosto 2026", scope: "Imagen de liderazgos y preocupaciones", note: "Comparar solo con olas de la misma firma y formulación." },
  { name: "More Consulting", period: "Enero–julio 2026", scope: "Aceptación de la presidenta encargada", note: "Serie longitudinal utilizada para mostrar tendencia interna." },
  { name: "Poder y Estrategia", period: "24–31 julio 2026", scope: "1.040 entrevistas presenciales en ocho ciudades", note: "Cobertura urbana; no equivale automáticamente a una muestra nacional rural." },
  { name: "Meganálisis", period: "Post-terremoto", scope: "Emociones, confianza informativa y respuesta pública", note: "Indicadores asociados a la emergencia; no son aprobación política general." },
  { name: "Atenas Grupo", period: "Julio 2026", scope: "1.208 hogares · clima social y consumo", note: "Se usa como contexto humanitario, no para construir una serie partidista." },
];

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
