export const INTERVENTION_CUT = "28 ago 2026";

export const INTERVENTION_OBSERVED = [
  { period:"2ª sem. jun", value:354, note:"USD 292 MM concentrados en una operación" },
  { period:"Julio", value:2200, note:"USD 1.200 MM en las dos últimas semanas" },
  { period:"10–14 ago", value:450, note:"USD 120 MM el viernes 14" },
  { period:"17–21 ago", value:500, note:"Gasto público estimado: USD 800 MM" },
  { period:"24–28 ago", value:350, note:"USD 150 MM menos que la semana anterior" },
];

export const INTERVENTION_DAILY = [
  { date:"Lun 24", value:120, cumulative:120, market:934.24, gap:19.1 },
  { date:"Mar 25", value:80, cumulative:200, market:943.38, gap:20.2 },
  { date:"Mié 26", value:50, cumulative:250, market:960.84, gap:21.4 },
  { date:"Jue 27", value:50, cumulative:300, market:964.18, gap:21.8 },
  { date:"Vie 28", value:50, cumulative:350, market:946.73, gap:19.1 },
];

export const EXCHANGE_WEEK_SUMMARY = {
  period:"24–28 ago 2026",
  intervention:350,
  interventionPrevious:500,
  initialForecast:500,
  publicSpending:650,
  spendingChange:-18,
  tccSterilization:36,
  marketClose:946.73,
  marketChange:1.8,
  officialClose:794.99,
  officialChange:1.3,
  gapClose:19.1,
  gapChange:0.6,
};

export const INTERVENTION_PROJECTIONS = [
  { period:"24–28 ago · previsión inicial", value:"USD 500 MM", note:"Caso central publicado el 24 de agosto; resultado observado: USD 350 MM" },
  { period:"Ago–dic 2026", value:"USD 9.000 MM", note:"Promedio supuesto de USD 1.800 MM mensuales" },
  { period:"Total 2026", value:"USD 19.300 MM", note:"Escenario central publicado" },
  { period:"Total 2027", value:"USD 18.700 MM", note:"USD 1.300–2.000 MM mensuales" },
];

export const INTERVENTION_SOURCE = "Síntesis Financiera · Briefing Financiero, 24 ago 2026 · boletines cambiarios 24–28 ago 2026";
