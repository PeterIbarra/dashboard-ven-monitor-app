// Static reference data — rarely changes

export const SCENARIOS = [
  { id:1, name:"Transición política pacífica", short:"Transición", color:"#4C9F38" },
  { id:2, name:"Colapso y fragmentación", short:"Colapso", color:"#E5243B" },
  { id:3, name:"Continuidad negociada", short:"Continuidad", color:"#0A97D9" },
  { id:4, name:"Resistencia coercitiva", short:"Resistencia", color:"#b8860b" },
];

export const GDELT_ANNOTATIONS = [
  { date:"2026-01-03", tier:"CRITICAL", label:"Operación EE.UU. / Maduro capturado", tierEs:"CRÍTICO" },
  { date:"2026-01-05", tier:"HIGH", label:"Delcy Rodríguez juramentada", tierEs:"ALTA" },
  { date:"2026-01-10", tier:"HIGH", label:"Decreto emergencia + represión", tierEs:"ALTA" },
  { date:"2026-01-15", tier:"MEDIUM", label:"Machado se reúne con Trump", tierEs:"MEDIA" },
  { date:"2026-01-20", tier:"MEDIUM", label:"Acuerdo petrolero $300M", tierEs:"MEDIA" },
  { date:"2026-01-29", tier:"MEDIUM", label:"Ley de hidrocarburos firmada", tierEs:"MEDIA" },
  { date:"2026-02-05", tier:"LOW", label:"Comienza debate de amnistía", tierEs:"BAJA" },
  { date:"2026-02-11", tier:"HIGH", label:"Visita Secretario de Energía EE.UU.", tierEs:"ALTA" },
  { date:"2026-02-12", tier:"LOW", label:"Rodríguez promete elecciones (NBC)", tierEs:"BAJA" },
  { date:"2026-02-13", tier:"MEDIUM", label:"Nuevas licencias petroleras", tierEs:"MEDIA" },
  { date:"2026-02-19", tier:"HIGH", label:"Ley de Amnistía aprobada y firmada", tierEs:"ALTA" },
  { date:"2026-02-25", tier:"LOW", label:"Trump: \"nuevo amigo\"", tierEs:"BAJA" },
  { date:"2026-03-01", tier:"HIGH", label:"Restablecimiento relaciones EE.UU.–VEN", tierEs:"ALTA" },
  { date:"2026-03-02", tier:"MEDIUM", label:"Visita Doug Burgum — energía y minería", tierEs:"MEDIA" },
  { date:"2026-03-04", tier:"MEDIUM", label:"MCM anuncia retorno a Venezuela", tierEs:"MEDIA" },
  { date:"2026-03-05", tier:"MEDIUM", label:"Crudo +10% por tensión Irán", tierEs:"MEDIA" },
  { date:"2026-03-07", tier:"HIGH", label:"Trump reconoce a Rodríguez como interlocutor legítimo", tierEs:"ALTA" },
  { date:"2026-03-08", tier:"MEDIUM", label:"GL-51 oro · Primer cargamento USD 100M a EE.UU.", tierEs:"MEDIA" },
  { date:"2026-03-10", tier:"MEDIUM", label:"Producción supera 1M bpd · Shell y Repsol amplían", tierEs:"MEDIA" },
  { date:"2026-03-12", tier:"HIGH", label:"39 movilizaciones laborales en 23 estados", tierEs:"ALTA" },
  { date:"2026-03-13", tier:"MEDIUM", label:"BCV: inflación 617% anualizada · Ley de Minas 1ra discusión", tierEs:"MEDIA" },
  // S10
  { date:"2026-03-14", tier:"HIGH", label:"Bandera EE.UU. izada en Caracas (7 años)", tierEs:"ALTA" },
  { date:"2026-03-18", tier:"HIGH", label:"11 cambios gabinete · Padrino López sale · nueva cúpula FANB", tierEs:"ALTA" },
  // S11
  { date:"2026-03-20", tier:"MEDIUM", label:"LG-53 OFAC: misiones diplomáticas venezolanas", tierEs:"MEDIA" },
  { date:"2026-03-21", tier:"HIGH", label:"Trump: Rodríguez «presidenta electa» · modelo para Irán", tierEs:"ALTA" },
  { date:"2026-03-22", tier:"HIGH", label:"FII Priority Miami · Signum Caracas: ofensiva de inversión", tierEs:"ALTA" },
  { date:"2026-03-24", tier:"HIGH", label:"MCM en CERAWeek Houston: 5M b/d, $150B inversión", tierEs:"ALTA" },
  { date:"2026-03-25", tier:"HIGH", label:"97 protestas en 4 días · pico 41 (25 mar) · 22+ estados", tierEs:"ALTA" },
  { date:"2026-03-26", tier:"MEDIUM", label:"Audiencia Maduro: rechazo desestimación · cargos adicionales", tierEs:"MEDIA" },
  { date:"2026-03-28", tier:"MEDIUM", label:"OFAC: nuevas licencias sector minero (oro, minerales)", tierEs:"MEDIA" },

  // ── S12: 29 marzo – 06 abril 2026 ──
  { date:"2026-03-31", tier:"HIGH", label:"Reunión Machado-Rubio en Departamento de Estado", tierEs:"ALTA" },
  { date:"2026-04-01", tier:"CRITICAL", label:"OFAC levanta sanciones a Delcy Rodríguez · Trump «empresa conjunta»", tierEs:"CRÍTICO" },
  { date:"2026-04-01", tier:"HIGH", label:"Rubio: estabilización «lograda en gran medida» · fase recuperación", tierEs:"ALTA" },
  { date:"2026-04-01", tier:"MEDIUM", label:"Exportaciones >1,09M bpd marzo · USD 2.398M ingresos causados", tierEs:"MEDIA" },
  { date:"2026-04-02", tier:"HIGH", label:"Reapertura embajada EE.UU. en Caracas · Laura F. Dogu", tierEs:"ALTA" },
  { date:"2026-04-03", tier:"MEDIUM", label:"90 días cumplidos: debate constitucional continuidad interinato", tierEs:"MEDIA" },
  { date:"2026-04-03", tier:"MEDIUM", label:"Embajador iraní con colectivos en 23 de Enero: antisemitismo + llamados a violencia", tierEs:"MEDIA" },

  // ── S13: 03 abril – 10 abril 2026 ──
  { date:"2026-04-07", tier:"CRITICAL", label:"FMI inicia consulta formal sobre Venezuela — primer movimiento en 2 décadas", tierEs:"CRÍTICO" },
  { date:"2026-04-08", tier:"HIGH", label:"EE.UU. evalúa levantar sanciones al BCV (Bloomberg) · +40% producción potencial", tierEs:"ALTA" },
  { date:"2026-04-08", tier:"HIGH", label:"AN designa Devoe (Fiscal) + González Lobato (Defensora) · Poder Ciudadano completo bajo Rodríguez", tierEs:"ALTA" },
  { date:"2026-04-09", tier:"HIGH", label:"9 de abril: 72 protestas en 4 días · represión PNB · 10 periodistas agredidos · detención PJ", tierEs:"ALTA" },
  { date:"2026-04-09", tier:"HIGH", label:"Shell confirma primer gas Loran-Manatee mid-2027 · ConocoPhillips envía equipo evaluación Venezuela", tierEs:"ALTA" },
  { date:"2026-04-07", tier:"MEDIUM", label:"Rodríguez anuncia aumento salarial 1° mayo + Consejo Nacional de Economía + peregrinación anti-sanciones 19-abr", tierEs:"MEDIA" },
  { date:"2026-04-08", tier:"MEDIUM", label:"Bonos venezolanos 2027 cerca de 48 ctvs/USD · expectativas de normalización financiera", tierEs:"MEDIA" },
  { date:"2026-04-10", tier:"MEDIUM", label:"PUD presenta hoja de ruta con 8 condiciones · MCM retorno 'decisión definitiva' · Madrid 18-abr", tierEs:"MEDIA" },

  // ── S14: 10 abril – 17 abril 2026 ──
  { date:"2026-04-11", tier:"CRITICAL", label:"OFAC emite GL-56 y GL-57: apertura financiera condicionada BCV y banca pública venezolana", tierEs:"CRÍTICO" },
  { date:"2026-04-13", tier:"HIGH", label:"MCM recibida por Macron en el Elíseo · reunión PM Países Bajos La Haya (15 abr) · gira europea respaldo internacional", tierEs:"ALTA" },
  { date:"2026-04-14", tier:"HIGH", label:"Haustveit (Depto. Energía EE.UU.) visita Caracas · acuerdos Chevron–PDVSA: Petroindependencia 49% + Ayacucho 8", tierEs:"ALTA" },
  { date:"2026-04-15", tier:"HIGH", label:"Kozak: Fase 1 'básicamente cumplida' · Fase 2 = recuperación + reconciliación + condiciones electorales (CNE, KPMG, MCM)", tierEs:"ALTA" },
  { date:"2026-04-16", tier:"CRITICAL", label:"FMI y Banco Mundial reanudan relaciones con Venezuela simultáneamente — primera vez en más de dos décadas", tierEs:"CRÍTICO" },
  { date:"2026-04-16", tier:"HIGH", label:"Movilización sindical hacia embajada EE.UU. (16 abr): primer caso de presión dirigida a actor internacional", tierEs:"ALTA" },
  { date:"2026-04-11", tier:"MEDIUM", label:"Luis Pérez nuevo presidente BCV · Obregón ratificado PDVSA · Ley Orgánica de Minas promulgada · Padrino López al gabinete", tierEs:"MEDIA" },
  { date:"2026-04-11", tier:"MEDIUM", label:"Registro FARA: Smaili agente extranjero de Rodríguez para cabildeo EE.UU. + 'campaña política' 2027", tierEs:"MEDIA" },
  { date:"2026-04-12", tier:"MEDIUM", label:"47 protestas OVCS (10–16 abr) · 15 estados · desaceleración vs. pico 9-abr · politización creciente exigencias", tierEs:"MEDIA" },
];

export const POLYMARKET_SLUGS = [
  // Original contracts (keep these)
  { slug:"will-venezuela-become-51st-state", title:"¿Venezuela 51° estado?", embed:true },
  { slug:"will-mara-corina-machado-enter-venezuela-by-march-31-426-698-771", title:"¿MCM entra a Venezuela antes del 31 mar?", embed:true },
  { slug:"will-delcy-rodrguez-be-the-leader-of-venezuela-end-of-2026", title:"¿Delcy líder a fin de 2026?", embed:true },
  { slug:"will-the-us-embassy-in-venezuela-reopen-by-march-31", title:"¿Embajada EE.UU. reabre antes del 31 mar?", embed:true },
  // New contracts
  { slug:"venezuela-leader-end-of-2026", title:"¿Quién lidera Venezuela a fin de 2026?", embed:false, multi:true, desc:"Edmundo 33% · Delcy 29% · MCM 21%" },
  { slug:"will-the-us-invade-venezuela-in-2025", title:"¿EE.UU. invade Venezuela?", embed:false, multi:true, desc:"Multi-fecha: ene 31, mar 31, dic 31" },
  { slug:"another-us-strike-on-venezuela-by", title:"¿Otro operativo EE.UU. en Venezuela?", embed:false, multi:true, desc:"Multi-fecha" },
  { slug:"venezuela-presidential-election-scheduled-by", title:"¿Elecciones presidenciales programadas?", embed:false, multi:true, desc:"Multi-fecha" },
  { slug:"delcy-rodrguez-out-as-leader-of-venezuela-by", title:"¿Delcy Rodríguez sale del poder?", embed:false, multi:true, desc:"Multi-fecha" },
  { slug:"venezuela-coup-attempt-by-january-31-428", title:"¿Intento de golpe en Venezuela?", embed:true },
  { slug:"will-venezuelan-crude-oil-production-reach-barrels-per-day-in-2026", title:"¿Producción petrolera alcanza meta 2026?", embed:false, multi:true, desc:"1M: 89% · 1.1M: 74% · 1.2M: 51% · 1.3M: 36% · 1.5M: 11%" },
  { slug:"will-venezuelan-crude-oil-production-reach-1pt2m-barrels-per-day-in-2026", title:"¿Producción petrolera 1.2M bpd en 2026?", embed:true },
  { slug:"nicols-maduro-released-from-custody-by", title:"¿Maduro liberado de custodia?", embed:false, multi:true, desc:"15% al 31 dic 2026 · $2.5M volumen" },
  { slug:"nicols-maduro-released-from-custody-by-december-31-2026", title:"¿Maduro liberado antes del 31 dic 2026?", embed:true },
  { slug:"maduro-prison-time-527", title:"¿Sentencia de prisión para Maduro?", embed:false, multi:true, desc:"60+: 39% · Sin prisión: 30% · 40-60: 16% · <20: 12%" },
  { slug:"will-nicols-maduro-be-sentenced-to-no-prison-time-974", title:"¿Maduro sin sentencia de prisión?", embed:true },
  { slug:"maduro-guilty-of-all-counts", title:"¿Maduro culpable de todos los cargos?", embed:true },
];

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

export const VEN_PRODUCTION_MANUAL = [
  // value = Secondary Sources (OPEC/EIA kbd), dc = Direct Communication (PDVSA kbd)
  // Sources: OPEC MOMR, OPEC ASB 2024/2025, OPEC Annual Report 2024, Venezuelanalysis, EAI, CEIC
  // EIA API provides secondary sources automatically — manual entries fill gaps + add dc
  // 2016-2023: quarterly dc estimates from OPEC ASB annual averages
  // 2024+: monthly dc from OPEC MOMR tables
  // ── 2016 (annual avg dc ~2,370) ──
  { time:"2016-01-15T00:00:00Z", dc:2410, source:"OPEC ASB" },
  { time:"2016-04-15T00:00:00Z", dc:2390, source:"OPEC ASB" },
  { time:"2016-07-15T00:00:00Z", dc:2360, source:"OPEC ASB" },
  { time:"2016-10-15T00:00:00Z", dc:2320, source:"OPEC ASB" },
  // ── 2017 (annual avg dc ~2,072) ──
  { time:"2017-01-15T00:00:00Z", dc:2200, source:"OPEC ASB" },
  { time:"2017-04-15T00:00:00Z", dc:2100, source:"OPEC ASB" },
  { time:"2017-07-15T00:00:00Z", dc:2050, source:"OPEC ASB" },
  { time:"2017-10-15T00:00:00Z", dc:1940, source:"OPEC ASB" },
  // ── 2018 (annual avg dc ~1,510) ──
  { time:"2018-01-15T00:00:00Z", dc:1750, source:"OPEC ASB" },
  { time:"2018-04-15T00:00:00Z", dc:1550, source:"OPEC ASB" },
  { time:"2018-07-15T00:00:00Z", dc:1450, source:"OPEC ASB" },
  { time:"2018-10-15T00:00:00Z", dc:1280, source:"OPEC ASB" },
  // ── 2019 (annual avg dc ~1,010) — sanctions + blackout ──
  { time:"2019-01-15T00:00:00Z", dc:1350, source:"OPEC ASB" },
  { time:"2019-04-15T00:00:00Z", dc:1030, source:"OPEC ASB" },
  { time:"2019-07-15T00:00:00Z", dc:940, source:"OPEC ASB" },
  { time:"2019-10-15T00:00:00Z", dc:720, source:"OPEC ASB" },
  // ── 2020 (annual avg dc 569) — pandemic nadir ──
  { time:"2020-01-15T00:00:00Z", dc:730, source:"OPEC AR 2024" },
  { time:"2020-04-15T00:00:00Z", dc:420, source:"OPEC AR 2024" },
  { time:"2020-07-15T00:00:00Z", dc:480, source:"OPEC AR 2024" },
  { time:"2020-10-15T00:00:00Z", dc:640, source:"OPEC AR 2024" },
  // ── 2021 (annual avg dc 636) ──
  { time:"2021-01-15T00:00:00Z", dc:560, source:"OPEC AR 2024" },
  { time:"2021-04-15T00:00:00Z", dc:590, source:"OPEC AR 2024" },
  { time:"2021-07-15T00:00:00Z", dc:680, source:"OPEC AR 2024" },
  { time:"2021-10-15T00:00:00Z", dc:710, source:"OPEC AR 2024" },
  // ── 2022 (annual avg dc 716) ──
  { time:"2022-01-15T00:00:00Z", dc:690, source:"OPEC AR 2024" },
  { time:"2022-04-15T00:00:00Z", dc:710, source:"OPEC AR 2024" },
  { time:"2022-07-15T00:00:00Z", dc:720, source:"OPEC AR 2024" },
  { time:"2022-10-15T00:00:00Z", dc:740, source:"OPEC AR 2024" },
  // ── 2023 (annual avg dc 783) ──
  { time:"2023-01-15T00:00:00Z", dc:740, source:"OPEC AR 2024" },
  { time:"2023-04-15T00:00:00Z", dc:780, source:"OPEC AR 2024" },
  { time:"2023-07-15T00:00:00Z", dc:790, source:"OPEC AR 2024" },
  { time:"2023-10-15T00:00:00Z", dc:820, source:"OPEC AR 2024" },
  // ── 2024 (OPEC AR quarterly dc: 864, 904, 933, 982) ──
  { time:"2024-01-15T00:00:00Z", value:793, dc:856, source:"OPEC MOMR" },
  { time:"2024-02-15T00:00:00Z", value:811, dc:870, source:"OPEC MOMR" },
  { time:"2024-03-15T00:00:00Z", value:820, dc:866, source:"OPEC MOMR" },
  { time:"2024-04-15T00:00:00Z", value:839, dc:900, source:"OPEC MOMR" },
  { time:"2024-05-15T00:00:00Z", value:830, dc:910, source:"OPEC MOMR" },
  { time:"2024-06-15T00:00:00Z", value:851, dc:922, source:"OPEC MOMR" },
  { time:"2024-07-15T00:00:00Z", value:880, dc:930, source:"OPEC MOMR" },
  { time:"2024-08-15T00:00:00Z", value:891, dc:935, source:"OPEC MOMR" },
  { time:"2024-09-15T00:00:00Z", value:897, dc:935, source:"OPEC MOMR" },
  { time:"2024-10-15T00:00:00Z", value:908, dc:972, source:"OPEC MOMR" },
  { time:"2024-11-15T00:00:00Z", value:901, dc:978, source:"OPEC MOMR" },
  { time:"2024-12-15T00:00:00Z", value:917, dc:998, source:"OPEC MOMR" },
  // ── 2025 ──
  { time:"2025-01-15T00:00:00Z", value:830, dc:924, source:"OPEC MOMR / CEIC" },
  { time:"2025-02-15T00:00:00Z", value:919, dc:985, source:"OPEC MOMR" },
  { time:"2025-03-15T00:00:00Z", value:922, dc:1010, source:"OPEC MOMR" },
  { time:"2025-04-15T00:00:00Z", value:888, dc:1005, source:"OPEC MOMR / EAI" },
  { time:"2025-05-15T00:00:00Z", value:900, dc:1020, source:"OPEC MOMR" },
  { time:"2025-06-15T00:00:00Z", value:910, dc:1050, source:"OPEC MOMR" },
  { time:"2025-07-15T00:00:00Z", value:924, dc:1084, source:"Venezuelanalysis" },
  { time:"2025-08-15T00:00:00Z", value:936, dc:1098, source:"Venezuelanalysis" },
  { time:"2025-09-15T00:00:00Z", value:940, dc:1100, source:"OPEC MOMR" },
  { time:"2025-10-15T00:00:00Z", value:935, dc:1080, source:"OPEC MOMR" },
  { time:"2025-11-15T00:00:00Z", value:956, dc:963, source:"OPEC MOMR Ene 2026" },
  { time:"2025-12-15T00:00:00Z", value:917, dc:959, source:"OPEC MOMR Feb 2026" },
  // ── 2026 ──
  { time:"2026-01-15T00:00:00Z", value:924, dc:998, source:"OPEC MOMR Mar 2026" },
  { time:"2026-02-15T00:00:00Z", value:903, dc:1021, source:"OPEC MOMR Mar 2026" },
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

export const VZ_MAP = [
  {id:"Zulia",d:"M 28,95 L 40,78 L 55,72 L 72,80 L 82,95 L 88,115 L 90,140 L 85,165 L 75,180 L 60,188 L 45,182 L 33,170 L 25,148 L 22,125Z"},
  {id:"Falcón",d:"M 82,58 L 100,42 L 125,32 L 155,28 L 180,35 L 195,48 L 185,62 L 165,72 L 145,76 L 125,74 L 108,78 L 90,72Z"},
  {id:"Lara",d:"M 90,78 L 115,74 L 135,78 L 145,92 L 140,108 L 125,115 L 108,112 L 95,104 L 86,92Z"},
  {id:"Yaracuy",d:"M 140,76 L 158,72 L 168,82 L 162,94 L 150,98 L 142,92Z"},
  {id:"Carabobo",d:"M 162,72 L 178,68 L 188,80 L 182,92 L 170,96 L 162,90Z"},
  {id:"Aragua",d:"M 182,68 L 200,64 L 212,75 L 206,90 L 192,94 L 182,88Z"},
  {id:"Vargas",d:"M 192,52 L 220,46 L 240,50 L 235,60 L 210,66 L 194,62Z"},
  {id:"Distrito Capital",d:"M 210,62 L 224,58 L 232,66 L 224,74 L 212,70Z"},
  {id:"Miranda",d:"M 224,70 L 248,64 L 268,74 L 262,92 L 242,100 L 225,96 L 215,86Z"},
  {id:"Trujillo",d:"M 88,104 L 108,98 L 118,110 L 110,124 L 95,126 L 86,116Z"},
  {id:"Mérida",d:"M 60,125 L 82,112 L 96,125 L 90,145 L 74,152 L 58,146Z"},
  {id:"Táchira",d:"M 38,152 L 58,140 L 72,152 L 66,172 L 52,182 L 36,175Z"},
  {id:"Barinas",d:"M 90,125 L 128,115 L 148,126 L 145,155 L 122,168 L 95,158 L 82,145Z"},
  {id:"Portuguesa",d:"M 128,98 L 158,92 L 172,102 L 168,124 L 150,132 L 130,125Z"},
  {id:"Cojedes",d:"M 168,90 L 192,86 L 200,100 L 192,118 L 175,122 L 165,110Z"},
  {id:"Guárico",d:"M 200,86 L 262,82 L 282,92 L 288,118 L 272,145 L 238,155 L 205,142 L 192,122 L 195,102Z"},
  {id:"Anzoátegui",d:"M 282,68 L 338,58 L 365,68 L 360,95 L 340,110 L 310,115 L 288,108 L 278,92Z"},
  {id:"Sucre",d:"M 338,48 L 385,40 L 405,52 L 395,70 L 370,78 L 342,72Z"},
  {id:"Nueva Esparta",d:"M 385,30 L 408,26 L 416,36 L 405,44 L 388,42Z"},
  {id:"Monagas",d:"M 340,75 L 380,68 L 400,82 L 392,105 L 368,115 L 342,108Z"},
  {id:"Delta Amacuro",d:"M 392,72 L 430,62 L 458,75 L 452,105 L 430,118 L 400,110 L 388,95Z"},
  {id:"Bolívar",d:"M 288,118 L 368,110 L 430,122 L 448,165 L 442,225 L 415,270 L 370,288 L 315,275 L 280,245 L 268,200 L 265,158Z"},
  {id:"Amazonas",d:"M 148,170 L 265,158 L 272,210 L 268,265 L 255,310 L 230,348 L 200,365 L 172,348 L 155,310 L 145,255 L 142,210Z"},
  {id:"Apure",d:"M 55,185 L 148,170 L 158,210 L 148,245 L 120,255 L 85,245 L 62,225 L 50,205Z"},
];
