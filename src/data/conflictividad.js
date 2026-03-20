// Conflictividad data — OVCS annual, monthly, rights, services, states

export const CONF_HISTORICO = [
  {y:2011,p:5338,h:"Inicio monitoreo OVCS. Gobierno Chávez."},{y:2012,p:5483,h:"Año electoral. Reelección de Chávez."},
  {y:2013,p:4410,h:"Muerte de Chávez. Maduro asume."},{y:2014,p:9286,h:"Protestas masivas 'La Salida'. 43 muertos."},
  {y:2015,p:5851,h:"AN elegida con mayoría opositora."},{y:2016,p:6917,h:"Revocatorio bloqueado. Hiperinflación."},
  {y:2017,p:9787,h:"112 días de protestas. 125+ muertos."},{y:2018,p:12715,h:"Elecciones cuestionadas. Éxodo masivo."},
  {y:2019,p:16739,h:"PICO HISTÓRICO. Apagones. Guaidó."},{y:2020,p:9633,h:"Pandemia COVID-19."},
  {y:2021,p:6560,h:"Elecciones regionales."},{y:2022,p:7032,h:"Negociaciones en México."},
  {y:2023,p:6956,h:"Acuerdo de Barbados. Primarias."},{y:2024,p:5226,h:"Elecciones julio 28. Operación TunTun."},
  {y:2025,p:2219,h:"MÍNIMO HISTÓRICO. Captura Maduro ene 2026."},
];


export const CONF_MESES = [
  {m:"Ene",t:401,desca:96,dcp:305,rep:36,hecho:"Rechazo juramentación. Colectivos en 17 protestas."},
  {m:"Feb",t:170,desca:107,dcp:63,rep:0,hecho:"Ruta por la Justicia y la Libertad."},
  {m:"Mar",t:217,desca:130,dcp:87,rep:2,hecho:"Rechazo deportaciones desde EE.UU."},
  {m:"Abr",t:146,desca:95,dcp:51,rep:3,hecho:"Movilizaciones por elecciones parlamentarias."},
  {m:"May",t:163,desca:119,dcp:44,rep:3,hecho:"Restricciones al derecho a manifestar."},
  {m:"Jun",t:152,desca:91,dcp:61,rep:6,hecho:"Persona non grata al Alto Comisionado ONU."},
  {m:"Jul",t:144,desca:97,dcp:47,rep:0,hecho:"Exigencia aumento salarial real."},
  {m:"Ago",t:168,desca:75,dcp:93,rep:1,hecho:"Rechazo sanciones. Alistamiento militar."},
  {m:"Sep",t:187,desca:134,dcp:53,rep:0,hecho:"Ruta Global por la Justicia."},
  {m:"Oct",t:186,desca:109,dcp:77,rep:3,hecho:"Vigilias presos políticos."},
  {m:"Nov",t:162,desca:121,dcp:41,rep:0,hecho:"Exigencia aguinaldos. Rechazo Constituyente Obrera."},
  {m:"Dic",t:123,desca:74,dcp:49,rep:1,hecho:"Reclamos bajos aguinaldos."},
];


export const CONF_DERECHOS = [
  {d:"Participación política",cat:"DCP",p:648,pct:29.2},{d:"Derechos laborales",cat:"DESCA",p:573,pct:25.8},
  {d:"Vivienda/hábitat",cat:"DESCA",p:556,pct:25.1},{d:"Justicia",cat:"DCP",p:504,pct:22.7},
  {d:"Servicios básicos",cat:"DESCA",p:275,pct:12.4},{d:"Salud",cat:"DESCA",p:189,pct:8.5},
  {d:"Educación",cat:"DESCA",p:186,pct:8.4},{d:"Seguridad social",cat:"DESCA",p:151,pct:6.8},
];


export const CONF_SERVICIOS = [
  {s:"Electricidad",i:"⚡",p:160,pct:58.2},{s:"Agua potable",i:"💧",p:98,pct:35.6},
  {s:"Aguas servidas",i:"🚰",p:88,pct:32.0},{s:"Vialidad",i:"🛣️",p:85,pct:30.9},
  {s:"Desechos sólidos",i:"🗑️",p:38,pct:13.8},{s:"Combustible/gas",i:"⛽",p:29,pct:10.5},
  {s:"Gas doméstico",i:"🔥",p:16,pct:5.8},{s:"Alumbrado",i:"💡",p:11,pct:4.0},
];


export const CONF_ESTADOS = [
  {e:"Anzoátegui",p:214,r:1,c:2,x:"Servicios básicos, empleo y derechos fundamentales"},
  {e:"Táchira",p:202,r:2,c:5,x:"Combustible y servicios básicos"},
  {e:"Distrito Capital",p:201,r:9,c:0,x:"Dinámicas políticas y servicios básicos"},
  {e:"Sucre",p:181,r:5,c:7,x:"Desabastecimiento combustible y servicios"},
  {e:"Bolívar",p:166,r:3,c:0,x:"Servicios básicos, empleo y derechos"},
  {e:"Lara",p:166,r:2,c:2,x:"Servicios básicos, empleo y derechos"},
  {e:"Falcón",p:112,r:1,c:1,x:"Derechos fundamentales y servicios"},
  {e:"Mérida",p:107,r:1,c:1,x:"Derechos fundamentales"},
  {e:"Aragua",p:102,r:7,c:1,x:"Derechos fundamentales y servicios"},
  {e:"Portuguesa",p:98,r:0,c:0,x:"Derechos fundamentales"},
  {e:"Monagas",p:95,r:1,c:1,x:"Derechos fundamentales"},
  {e:"Miranda",p:90,r:4,c:0,x:"Derechos fundamentales y servicios"},
  {e:"Carabobo",p:88,r:7,c:0,x:"Derechos fundamentales y servicios"},
  {e:"Nueva Esparta",p:82,r:2,c:6,x:"Suministro combustible y servicios"},
  {e:"Zulia",p:61,r:2,c:0,x:"Derechos fundamentales"},
  {e:"Cojedes",p:52,r:2,c:0,x:"Derechos fundamentales"},
  {e:"Vargas",p:51,r:3,c:3,x:"Combustible y servicios básicos"},
  {e:"Barinas",p:34,r:0,c:0,x:"Derechos fundamentales"},
  {e:"Guárico",p:31,r:0,c:0,x:"Derechos fundamentales"},
  {e:"Trujillo",p:28,r:1,c:0,x:"Derechos fundamentales"},
  {e:"Yaracuy",p:28,r:0,c:0,x:"Derechos fundamentales"},
  {e:"Delta Amacuro",p:14,r:2,c:0,x:"Servicios básicos y derechos"},
  {e:"Apure",p:10,r:0,c:0,x:"Servicios básicos, empleo y derechos"},
  {e:"Amazonas",p:6,r:0,c:0,x:"Servicios básicos, empleo y derechos"},
];

// Venezuela map — clean hand-drawn state polygons (viewBox 0 0 600 420)
