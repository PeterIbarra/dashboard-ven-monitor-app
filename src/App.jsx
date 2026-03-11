import { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// DATA — All inline for single-file artifact
// ═══════════════════════════════════════════════════════════════

const SCENARIOS = [
  { id:1, name:"Transición política pacífica", short:"Transición", color:"#4C9F38" },
  { id:2, name:"Colapso y fragmentación", short:"Colapso", color:"#E5243B" },
  { id:3, name:"Continuidad negociada", short:"Continuidad", color:"#0A97D9" },
  { id:4, name:"Resistencia coercitiva", short:"Resistencia", color:"#b8860b" },
];

const WEEKS = [
  { label:"3–15 ene", short:"S1", probs:[{sc:1,v:5,t:"flat"},{sc:2,v:45,t:"flat"},{sc:3,v:40,t:"flat"},{sc:4,v:10,t:"flat"}], xy:{x:0.53,y:0.50},
    sem:{g:2,y:4,r:7},
    kpis:{ energia:{exportaciones:"Interrumpidas",ingresos:"—",licencias:"En proceso",cambio:"—"}, economico:{inflacion:"567% (2025)",ingresos_pob:"< USD 300",electricidad:"Sin datos",pib:"—"}, opinion:{direccion:"—",elecciones:"93.5% rechaza trans. chav.",mcm:"—",eeuu:"47%"} },
    tensiones:[{l:"red",t:"<b>Operativo 3 ene:</b> Captura de Maduro. Alta fragilidad institucional."},{l:"red",t:"<b>Exportaciones:</b> Interrupción casi total primeros días."},{l:"yellow",t:"<b>Excarcelaciones:</b> 101 confirmadas, 14 periodistas."}],
    lectura:"El operativo del 3 de enero inaugura el ciclo en condiciones de fragilidad máxima. La captura de Maduro por fuerzas estadounidenses genera un shock institucional sin precedentes: las exportaciones petroleras se interrumpen casi totalmente en los primeros días, la opacidad sobre víctimas del operativo es elevada, y las restricciones a la prensa extranjera configuran un entorno de alta incertidumbre. E2 (Colapso y fragmentación) domina con 45% porque el riesgo de desintegración institucional es real — pero la rápida designación de Delcy Rodríguez como autoridad interina, avalada por el TSJ y reconocida funcionalmente por Washington, impide que el vacío de poder se convierta en crisis terminal. Las 101 excarcelaciones confirmadas, incluidos 14 periodistas, son la primera señal de distensión selectiva. El 47% de aprobación interna a la operación estadounidense y el 79% de opinión favorable hacia Delcy (Hinterlaces) revelan que la ciudadanía procesa el shock con pragmatismo más que con rechazo. E3 (Continuidad negociada) ya está al 40%, emergiendo como alternativa viable si el flujo petrolero se restablece. La clave de esta semana es que el operativo no desencadenó el colapso que muchos anticipaban: la cohesión civil-militar se preservó, la continuidad institucional condicionada fue avalada, y las primeras señales de cooperación energética con EE.UU. aparecen hacia el final del período.",
    trendSc:3, trendDrivers:["Estabilización post-operativo: continuidad institucional bajo tutela EE.UU.","Exportaciones petroleras reactivándose; orden ejecutiva Trump protege ingresos","Excarcelaciones graduales señalan distensión selectiva"] },
  { label:"16–22 ene", short:"S2", probs:[{sc:1,v:15,t:"up"},{sc:2,v:25,t:"down"},{sc:3,v:50,t:"up"},{sc:4,v:10,t:"flat"}], xy:{x:0.42,y:0.45},
    sem:{g:3,y:5,r:5},
    kpis:{ energia:{exportaciones:"En recuperación",ingresos:"Divisas a banca",licencias:"LG-46 en proceso",cambio:"Relativa estabilidad"}, economico:{inflacion:"Alta (3 dígitos)",ingresos_pob:"< USD 300",electricidad:"Sin datos",pib:"—"}, opinion:{direccion:"—",elecciones:"—",mcm:"51.6% prefiere MCM",eeuu:"47%"} },
    tensiones:[{l:"yellow",t:"<b>Doble canal EE.UU.:</b> Reconocimiento a Delcy + interlocución MCM."},{l:"yellow",t:"<b>DDHH:</b> Excarcelaciones + nuevas detenciones simultáneas."},{l:"green",t:"<b>Divisas:</b> Flujo hacia banca privada iniciado."}],
    lectura:"La semana del 16 al 22 de enero marca el punto de inflexión decisivo del ciclo: el tránsito desde la fragilidad máxima hacia la estabilización incipiente. Tres hitos cambian estructuralmente el mapa de riesgos. La visita a Caracas del Director de la CIA John Ratcliffe establece que el vínculo bilateral tiene profundidad de inteligencia, no solo económica. La Licencia General 46 de la OFAC crea por primera vez un marco normativo claro para la cooperación energética bilateral. Y la reapertura del espacio aéreo normaliza el vínculo a nivel cotidiano. E3 sube a 50% dominante porque el acoplamiento energético-financiero ya tiene mecanismos concretos funcionando: USD 300 millones colocados a través de banca privada, BCV publica tipo de cambio oficial por primera vez desde agosto 2024. El doble canal estratégico de Washington — reconocer a Delcy para energía y seguridad, mantener interlocución con MCM sin trasladarle control — es un diseño deliberado, no una contradicción. E2 cae a 25% porque el riesgo de colapso se desvanece al regularizarse las exportaciones. La reestructuración de 28 cargos intermedios de la FANB, manteniendo intacta la cúpula, es señal de control preventivo sin ruptura.",
    trendSc:3, trendDrivers:["LG-46 OFAC: marco normativo para cooperación energética bilateral","Doble canal EE.UU.: reconocimiento a Delcy + interlocución con MCM","USD 300M en divisas a banca privada consolidan el esquema financiero"] },
  { label:"23–29 ene", short:"S3", probs:[{sc:1,v:20,t:"up"},{sc:2,v:10,t:"down"},{sc:3,v:60,t:"up"},{sc:4,v:10,t:"flat"}], xy:{x:0.35,y:0.40},
    sem:{g:5,y:5,r:3},
    kpis:{ energia:{exportaciones:"~800 kbd (+60.6%)",ingresos:"Divisas regulares",licencias:"LG-46 emitida",cambio:"Estabilizando"}, economico:{inflacion:"Alta (3 dígitos)",ingresos_pob:"< USD 300",electricidad:"Afectaciones",pib:"Proy. al alza"}, opinion:{direccion:"—",elecciones:"Reunión Rubio–MCM",mcm:"78% intención voto",eeuu:"—"} },
    tensiones:[{l:"green",t:"<b>LG-46:</b> Licencia OFAC emitida — hito operativo clave."},{l:"green",t:"<b>Reforma Hidrocarburos:</b> Cambio más profundo en 50 años."},{l:"yellow",t:"<b>Agenda electoral:</b> Sin fechas. Presión opositora activa."}],
    lectura:"E3 consolida su probabilidad más alta del ciclo — 60% — porque el esquema de estabilización deja de ser promesa y se convierte en mecanismo operativo verificable. La LG-46 está efectiva: Vitol carga ~460.000 barriles de nafta pesada desde Houston reactivando la producción de la Faja del Orinoco. Las exportaciones supervisadas se incrementan sostenidamente. La reforma a la Ley Orgánica de Hidrocarburos — aprobada en segunda discusión — representa el cambio estructural más profundo en el sector petrolero venezolano en 50 años. La reunión Rubio-MCM en Washington institucionaliza el doble canal hacia la transición, y la Ley de Amnistía entra en primera discusión. El 78.3% de intención de voto por MCM configura la base opositora más sólida del ciclo. Sin embargo, Washington es explícito en sus reservas sobre el retorno inmediato de MCM: Rubio compara el proceso con la transición española post-Franco — 'los cambios profundos requieren tiempo'. E2 cae a 10% porque sin interrupción del esquema petrolero-financiero, el riesgo de fragmentación está estructuralmente contenido.",
    trendSc:1, trendDrivers:["MCM con 78.3% intención de voto: base opositora más sólida del ciclo","Reunión Rubio-MCM institucionaliza el canal hacia transición","Ley de Amnistía en primera discusión: apertura política avanza"] },
  { label:"30e–5f", short:"S4", probs:[{sc:1,v:30,t:"up"},{sc:2,v:5,t:"down"},{sc:3,v:50,t:"down"},{sc:4,v:15,t:"up"}], xy:{x:0.35,y:0.42},
    sem:{g:5,y:5,r:3},
    kpis:{ energia:{exportaciones:"~800 kbd",ingresos:"USD >800M acum.",licencias:"LG-46 operativa",cambio:"420–430 VEB/USD"}, economico:{inflacion:"~200% proy.",ingresos_pob:"69.5% < USD 300",electricidad:"Deterioro",pib:"10.4–15.2% proy."}, opinion:{direccion:"—",elecciones:"93.5% rechaza trans.",mcm:"78.3%",eeuu:"—"} },
    tensiones:[{l:"yellow",t:"<b>Amnistía 1ª discusión:</b> Arts. 7–13 diferidos."},{l:"yellow",t:"<b>Excarcelaciones:</b> Patrón con medidas cautelares."},{l:"red",t:"<b>FANB:</b> Reafirma lealtad al Proyecto Bolivariano."}],
    lectura:"Primera tensión sistémica del ciclo de estabilización. E3 cede levemente a 50%, E1 sube a 30% y E4 gana terreno hasta 15%. La contradicción central es entre la aceleración de la normalización energético-diplomática — ampliación de licencias OFAC, bonos soberanos al alza, trayectoria hacia 800K bpd — y la resistencia del Ejecutivo a las aperturas políticas que esa misma lógica comienza a demandar. El cierre de El Helicoide como centro policial es presentado como señal de apertura, pero 949 personas detenidas por motivos políticos al 21 de enero contextualizan la señal. La FANB reafirma el 4 de febrero su lealtad al Proyecto Bolivariano. Jorge Rodríguez descarta públicamente elecciones inmediatas. El 93.5% de rechazo a una transición chavista y el 78.3% de intención de voto por MCM representan una demanda que E3 no puede ignorar indefinidamente. 14 jefes de Estado europeos presionan hacia un cronograma electoral. Trump propone reunir a representantes del chavismo y la oposición. E4 sube a 15% por acumulación de señales de control discrecional: aplazamiento del proceso contra Maduro, opacidad en cooperación con autoridades de Álex Saab y Raúl Gorrín.",
    trendSc:1, trendDrivers:["93.5% rechaza transición chavista: presión social máxima hacia cambio","MCM con 78.3%: mandato popular claro hacia transición","14 jefes de Estado europeos refuerzan presión hacia elecciones"] },
  { label:"6–13 feb", short:"S5", probs:[{sc:1,v:30,t:"flat"},{sc:2,v:5,t:"flat"},{sc:3,v:45,t:"down"},{sc:4,v:20,t:"up"}], xy:{x:0.38,y:0.42},
    sem:{g:6,y:6,r:4},
    kpis:{ energia:{exportaciones:"~800 kbd · EE.UU.",ingresos:"USD >1.000M",licencias:"GL49+GL50/50A",cambio:"420–430 VEB/USD"}, economico:{inflacion:"174% proy. 2026",ingresos_pob:"69.5% < USD 300",electricidad:"14.8h sin suministro",pib:"10.4–15.2%"}, opinion:{direccion:"80% (Hinterlaces)",elecciones:"67% votaría MCM",mcm:"Alta",eeuu:">90% respalda"} },
    tensiones:[{l:"yellow",t:"<b>Amnistía 2ª discusión:</b> Diferida arts. 7–13."},{l:"red",t:"<b>Excarcelaciones:</b> 897 oficial vs 430 ONG — brecha >50%."},{l:"yellow",t:"<b>Visita Chris Wright:</b> Agenda energética de largo plazo."}],
    lectura:"La semana de mayor ambigüedad estructural del ciclo. E3 continúa dominante al 45% pero la distancia sobre E1 se reduce (30%) y E4 sube a 20%, configurando el mapa más distribuido. Tres dinámicas operan simultáneamente sin converger. La visita del secretario de Energía Chris Wright consolida la cooperación de largo plazo: GL49, GL46A, GL48 y GL50 operativas, con BP, Chevron, Eni, Repsol y Shell autorizadas bajo condiciones estrictas. Repsol obtiene autorización para extraer crudo. 50 millones de barriles hacia Houston confirman escala real. Pero la Ley de Amnistía revela sus límites: la segunda discusión es diferida para los artículos 7 al 13 — los más sensibles. El patrón de excarcelaciones con medidas cautelares genera percepción de reversibilidad. La brecha entre 897 liberaciones oficiales y ~430 verificadas por ONG mantiene activa la disputa narrativa. E4 sube por señales específicas de control discrecional: Delcy reafirma en NBC la legitimidad formal de Maduro pese a su detención, mientras ejerce conducción interina — un equilibrio retórico que revela la fragilidad del marco político subyacente.",
    trendSc:1, trendDrivers:["67% votaría por MCM (Financial Times): demanda electoral sostenida","75% percibe país en dirección correcta: base de expectativa","Hoja de ruta EE.UU. de tres fases incluye 'transición' como fase 3"] },
  { label:"13–20 feb", short:"S6", probs:[{sc:1,v:35,t:"up"},{sc:2,v:15,t:"flat"},{sc:3,v:40,t:"down"},{sc:4,v:10,t:"down"}], xy:{x:0.38,y:0.50},
    sem:{g:9,y:8,r:5},
    kpis:{ energia:{exportaciones:"~800 kbd · ↑60.6%",ingresos:"USD >1.000M · ac. USD 5.000M",licencias:"GL49+GL50/50A plenas",cambio:"420–430 VEB/USD"}, economico:{inflacion:"174% (vs 567% 2025)",ingresos_pob:"69.5% < USD 300",electricidad:"14.8h sin suministro",pib:"10.4–15.2%"}, opinion:{direccion:"75% dirección correcta",elecciones:"2/3 exige elecciones",mcm:"52% favorabilidad",eeuu:">90% respalda"} },
    tensiones:[{l:"green",t:"<b>Ley de Amnistía:</b> Promulgada 19 feb."},{l:"yellow",t:"<b>FANB:</b> Tensiones. Demandas de oxigenación. Padrino 12 años."},{l:"yellow",t:"<b>Excarcelaciones:</b> 895 oficial vs 383 verif."},{l:"red",t:"<b>Electoral:</b> Sin fecha. 2/3 exige. EE.UU.: 9–10 meses."}],
    lectura:"La promulgación de la Ley de Amnistía el 19 de febrero es el hito normativo más significativo desde la operación de enero: por primera vez el marco legal reconoce formalmente a los perseguidos políticos de 26 años y establece mecanismos de extinción de acciones penales, civiles y disciplinarias. E1 alcanza su punto más alto del ciclo — 35% — porque la promulgación abre un vector de institucionalización que antes era solo retórico. Dos tercios de la población exige elecciones este año. La encuesta Atlantic Council-Gold Glove muestra que el 75% percibe el país en dirección correcta, pero con una paradoja estructural: la prioridad es la economía sobre la democracia en proporción 8:1. Las tensiones en la FANB — reportaje de El País sobre malestar por continuidad de la cúpula, Padrino López 12 años en el cargo — revelan que la estabilización tiene costos internos que aún no se procesan. España propone ante la UE levantar sanciones a Delcy, Qatar visita Caracas, el FMI señala disposición a iniciar contactos. El sector energético se confirma como ancla: EIA proyecta retorno a 1.1-1.2M bpd hacia mediados de 2026. Pero la brecha entre cifras oficiales de amnistía (895) y verificadas por ONG (383) es la expresión más concreta de que E3 y E4 coexisten: apertura selectiva y control discrecional operan simultáneamente.",
    trendSc:3, trendDrivers:["Amnistía promulgada: vector de institucionalización consolidado","Sector energético como ancla: EIA proyecta 1.1-1.2M bpd","Presión por cronograma electoral crece pero sin catalizar ruptura"] },
  { label:"20–27 feb", short:"S7", probs:[{sc:1,v:35,t:"flat"},{sc:2,v:12,t:"down"},{sc:3,v:43,t:"up"},{sc:4,v:10,t:"flat"}], xy:{x:0.36,y:0.48},
    sem:{g:6,y:7,r:5},
    kpis:{ energia:{exportaciones:"~800 kbd · VLCC",ingresos:"Proy. USD 6.000M",licencias:"GL49+GL50/50A · FAQ 1238",cambio:"Mdo 631 / BCV 414 Bs/$"}, economico:{inflacion:"3 dígitos · FMI",ingresos_pob:"Canasta 550 vs 270 USD",electricidad:"Sin datos nuevos",pib:"Ancla petrolera"}, opinion:{direccion:"51,5% mejor s/ Maduro",elecciones:"Rubio: req. elecciones",mcm:"MCM +28 imagen neta",eeuu:"62,4% valora EE.UU."} },
    tensiones:[{l:"green",t:"<b>Amnistía operativa:</b> 4.203 solicitudes · Trump: \"nuevo amigo y socio\"."},{l:"green",t:"<b>Petróleo:</b> ~800K bpd · Vitol/Trafigura · Eni USD 3B."},{l:"yellow",t:"<b>Brecha cambiaria:</b> 52,6% ↑6,5pp · 47 meses sin ajuste."},{l:"yellow",t:"<b>Poder Ciudadano:</b> Renuncias Saab/Ruiz · plazo 30 días."},{l:"red",t:"<b>Electoral:</b> Rubio condiciona · Caso Magalli Meda."}],
    lectura:"E3 se consolida en su nivel más alto del ciclo — 50% — a través del hecho simbólico más significativo del período: Donald Trump califica a Venezuela como 'nuevo amigo y socio' en el Estado de la Unión, con Enrique Márquez presente en el hemiciclo. La coexistencia de ambas referencias condensa la lógica del doble canal que ha estructurado toda la relación bilateral desde enero. Las exportaciones se sitúan en ~800.000 bpd, Vitol y Trafigura tienen tres buques fletados para marzo, refinerías indias incrementan compras usando VLCC, y la proyección de ingresos alcanza USD 6.000 millones. La amnistía pasa de aprobada a operativa: 4.203 solicitudes procesadas, 3.231 libertades plenas en el primer corte. El Poder Ciudadano se reconfigura con renuncias de Saab y Ruiz. Colombia activa el canal diplomático con Petro-Delcy para el 14 de marzo.\n\nSin embargo, el mapa no es de consolidación lineal sino de consolidación con tensiones no resueltas. E1 baja a 30% porque no hay compromisos electorales concretos: Rubio afirma que la legitimación electoral es requisito para inversión, pero el Ejecutivo no anuncia calendario. La disputa de cifras sobre amnistía es aguda: Foro Penal registra 568 presos verificados frente a 4.151 oficiales. El caso Magalli Meda — 16 hombres armados en 6 camionetas — revela que la coerción paralela al discurso de reconciliación no ha sido desmantelada. La brecha cambiaria supera el 52.6%, el salario mínimo lleva 47 meses sin cambios, y el FMI clasifica a Venezuela en 'Intensa Fragilidad'. La coexistencia de los cuatro escenarios en tensión — y no la desaparición de los riesgos — es la característica definitoria del momento.",
    trendSc:3, trendDrivers:["Trump 'nuevo amigo y socio': acoplamiento EE.UU. sin precedentes","~800K bpd + USD 6B consolidan ancla energética","Amnistía operativa refuerza narrativa de reconciliación como pilar"] },
  { label:"27f–6m", short:"S8", probs:[{sc:1,v:38,t:"up"},{sc:2,v:12,t:"down"},{sc:3,v:40,t:"flat"},{sc:4,v:10,t:"flat"}], xy:{x:0.36,y:0.50},
    sem:{g:8,y:6,r:4},
    kpis:{ energia:{exportaciones:"788 kbd feb. (récord 7a)",ingresos:"+78% SENIAT · crudo +10%",licencias:"GL49+GL50/50A+GL129A",cambio:"Alza crudo · proy. USD 100"}, economico:{inflacion:"174% proy. 2026",ingresos_pob:"USD 256 vs canasta 550",electricidad:"14,8h sin suministro",pib:"+7,07% Q4 2025"}, opinion:{direccion:">50% dirección correcta",elecciones:"66% exige elecciones",mcm:"106,84/137 pts liderazgo",eeuu:"Relaciones restablecidas"} },
    tensiones:[{l:"green",t:"<b>Energía:</b> Exportaciones 788 kbd · récord 7 años Puerto José · SENIAT +78%."},{l:"green",t:"<b>Diplomacia:</b> Relaciones EE.UU.–VEN restablecidas. Trump: \"escenario perfecto\"."},{l:"green",t:"<b>Amnistía:</b> 9.060 solicitudes · 5.628 libertades plenas · 31 militares."},{l:"yellow",t:"<b>E1 a 2pp de E3:</b> MCM retorno inminente · 66% exige elecciones · H.R. 7674."},{l:"yellow",t:"<b>Brecha social:</b> Salario USD 256 vs canasta USD 550 · >47 meses sin ajuste."},{l:"red",t:"<b>Electoral:</b> Sin fecha. 568 presos. >11.000 cautelares vigentes."}],
    lectura:"E3 se mantiene como escenario dominante al 40%, pero la distancia con E1 (38%) se reduce a apenas 2 puntos porcentuales — la más estrecha desde el inicio del período de análisis. Tres anclas simultáneas sostienen E3: la expansión energética récord (Venezuela duplica exportaciones a 788.000 bpd, acercándose al nivel más alto en el Puerto de José en siete años), el PIB creció 7,07% en Q4 2025 y la recaudación SENIAT se incrementó un 78% en febrero. El marco regulatorio OFAC consolidado (GL49, GL50/50A, GL129A, Monómeros renovada hasta 2028) crea seguridad jurídica para Exxon, Shell, Gold Reserve y Ecopetrol. Washington sigue priorizando la recuperación energética sobre la agenda electoral.\n\nSin embargo, E1 sube a 38% (+3pp) impulsado por el retorno inminente de MCM con agenda de tres prioridades, su liderazgo consolidado (106,84/137 puntos en el Índice MassBehaviorResearch), el respaldo de Ramos Allup, y la exigencia electoral del 66% de la población. El proyecto H.R. 7674 en el Congreso EE.UU. demanda una estrategia de transición en 180 días. La apertura minera (Gold Reserve, Ecopetrol) amplía el marco de reformas. E2 baja a 12% (-3pp) por la solidez del repunte energético y el PIB confirmado. E4 se mantiene latente en 10%. La brecha entre el pragmatismo transaccional de EE.UU. y las expectativas electorales internas es la tensión estructural del período.",
    trendSc:1, trendDrivers:["MCM lidera con 106,84/137 pts; retorno inminente con agenda estructurada","66% exige elecciones; H.R. 7674 en Congreso EE.UU.","Apertura minera + Gold Reserve + Ecopetrol: señal de reformas ampliadas"] },
];

const KPIS_LATEST = {
  energia: [
    { k:"Exportaciones feb.", v:"788 kbd", c:"#22c55e" },
    { k:"Crudo +10%", v:"Proy. USD 100/bbl", c:"#22c55e" },
    { k:"Licencias OFAC", v:"GL49+GL50/50A+129A", c:"#38bdf8" },
    { k:"Recaudación SENIAT", v:"+78% vs enero", c:"#22c55e" },
  ],
  politico: [
    { k:"Amnistía", v:"9.060 solicitudes", c:"#22c55e" },
    { k:"Libertades plenas", v:"5.628", c:"#22c55e" },
    { k:"Presos políticos", v:"568 (Foro Penal)", c:"#ef4444" },
    { k:"Relaciones EE.UU.", v:"Restablecidas", c:"#22c55e" },
  ],
  opinion: [
    { k:"MCM liderazgo", v:"106,84/137 pts", c:"#22c55e" },
    { k:"Exigen elecciones", v:"66%", c:"#a17d08" },
    { k:"Brecha social", v:"256 vs 550 USD", c:"#ef4444" },
    { k:"Sin ajuste salarial", v:">47 meses", c:"#ef4444" },
  ],
};

const TENSIONS = [
  { level:"green", text:"Exportaciones récord: 788 kbd feb. · Puerto José nivel más alto en 7 años" },
  { level:"green", text:"PIB +7,07% Q4 2025 · Recaudación SENIAT +78% · Crudo +10% por Irán" },
  { level:"green", text:"Relaciones diplomáticas EE.UU.–VEN restablecidas · Exxon, Shell, Gold Reserve entran" },
  { level:"green", text:"Amnistía: 9.060 solicitudes · 5.628 libertades plenas · 31 militares" },
  { level:"yellow", text:"E1 a solo 2pp de E3: MCM retorno + 66% exige elecciones + H.R. 7674" },
  { level:"yellow", text:"Brecha social: salario USD 256 vs canasta USD 550 · >47 meses sin ajuste" },
  { level:"red", text:"568 presos (Foro Penal) · >11.000 cautelares · Sin calendario electoral" },
];

const MONITOR_WEEKS = ["S1","S2","S3","S4","S5","S6","S7","S8"];

const INDICATORS = [
  // ── ENERGÉTICO ──
  { dim:"Energético", icon:"⚡", esc:"E3", name:"Exportaciones de crudo", desc:"Volumen semanal bajo licencias OFAC",
    umbral:"Sostenimiento >750 kbd. Caída <600 kbd activa alerta.",
    hist:[["green","up","~500 kbd"],["green","up","~620 kbd"],["green","up","~700 kbd"],["green","up","~740 kbd"],["green","up","~770 kbd"],["green","up","~800 kbd ↑60.6%"],["green","up","~800 kbd · VLCC"],["green","up","788 kbd · récord 7 años"]] },
  { dim:"Energético", icon:"⚡", esc:"E3", name:"Ventas petroleras (ingresos)", desc:"Acuerdos bajo GL49 y GL50/50A",
    umbral:"Flujo regular a banca PDVSA. Interrupción >2 sem activa E2.",
    hist:[["yellow","flat","En negociación"],["yellow","up","Acuerdos Vitol/Trafigura"],["green","up","Proy. USD 3-4B"],["green","up","Contratos activos"],["green","up","India + EE.UU."],["green","up","Proy. USD 6.000M"],["green","up","Proy. USD 6.000M"],["green","up","+USD 24-120M/mes · crudo +10%"]] },
  { dim:"Energético", icon:"⚡", esc:"E3", name:"Licencias OFAC activas", desc:"GL49, GL50, GL50A — cobertura operativa",
    umbral:"Revocación activa E2/E4. FAQ 1238 incluye Cuba condicionado.",
    hist:[["green","flat","GL49 activa"],["green","flat","GL49 + GL50"],["green","flat","Sin cambios"],["green","flat","Sin cambios"],["green","flat","GL50/50A vigentes"],["green","flat","FAQ 1238 Cuba"],["green","flat","GL49+GL50/50A+FAQ1238"],["green","up","GL129A Rosneft · Monómeros 2028"]] },
  { dim:"Energético", icon:"⚡", esc:"E3", name:"Producción Chevron / Majors", desc:"Operaciones de empresas occidentales en bloques venezolanos",
    umbral:"Expansión confirma E3. Suspensión reactiva E2.",
    hist:[["yellow","flat","Operación básica"],["yellow","up","Autorización ampliada"],["green","up","Incremento confirmado"],["green","up","Ampliación activa"],["yellow","flat","Revisión 19 contratos"],["yellow","up","Expansión anunciada"],["yellow","up","Expansión anunciada"],["green","up","Exxon equipo · Shell acuerdos"]] },
  { dim:"Energético", icon:"⚡", esc:"E2", name:"Infraestructura de refinación", desc:"Capacidad operativa refinerías nacionales",
    umbral:"Operación <25% capacidad instalada. Mantenimiento diferido.",
    hist:[["red","flat","<20% capacidad"],["red","flat","Sin mejora"],["red","flat","Mantenimiento pendiente"],["red","flat","Exportación compensa"],["red","flat","Crítica pero estable"],["yellow","up","~35% capacidad (Reuters)"],["yellow","flat","~35% capacidad"],["yellow","flat","~35% capacidad"]] },
  { dim:"Energético", icon:"⚡", esc:"E2", name:"Taladros activos", desc:"Operaciones de perforación nuevas",
    umbral:"<30 taladros activos. Recuperación <5% anual vs 2014.",
    hist:[["red","flat","Bajo histórico"],["red","flat","Sin variación"],["red","flat","Sin variación"],["red","flat","Sin variación"],["red","flat","Sin variación"],["red","flat","2-4 activos (Monaldi)"],["red","flat","2-4 activos"],["red","flat","2-4 activos"]] },
  { dim:"Energético", icon:"⚡", esc:"E3", name:"Recaudación fiscal", desc:"SENIAT y flujo tributario asociado al repunte energético",
    umbral:"Caída >20% mensual activa E2. Crecimiento sostenido confirma E3.", addedWeek:8,
    hist:[null,null,null,null,null,null,null,["green","up","+78% SENIAT feb. vs enero"]] },
  { dim:"Energético", icon:"⚡", esc:"E3", name:"Apertura sector minero", desc:"Reformas y licencias para inversión extranjera en minería",
    umbral:"Aprobación reforma + inversiones verificables = E3 consolidado.", addedWeek:8,
    hist:[null,null,null,null,null,null,null,["green","up","Gold Reserve · reforma legislativa"]] },

  // ── POLÍTICO ──
  { dim:"Político", icon:"🏛", esc:"E3", name:"Ley de Amnistía", desc:"Operativización y verificación independiente",
    umbral:"Brecha oficial vs. verificado. >50% sin verificar activa E4.",
    hist:[["yellow","flat","Anunciada"],["yellow","up","Aprobada AN"],["yellow","up","Primeras excarcelaciones"],["green","up","Comisión operativa"],["green","up","1.200+ beneficiados"],["green","up","Promulgada 19 feb"],["green","up","4.203 sol. · 3.231 plenas"],["green","up","9.060 sol. · 5.628 plenas"]] },
  { dim:"Político", icon:"🏛", esc:"E3", name:"Excarcelaciones verificadas", desc:"Foro Penal: presos políticos activos",
    umbral:"Ritmo <20/sem o reversión activa E4.",
    hist:[["yellow","flat","0 verificadas"],["yellow","up","12 verificadas"],["yellow","up","45 verificadas"],["yellow","up","78 verificadas"],["yellow","up","108 verificadas"],["yellow","flat","383 verif. · 895 oficial"],["yellow","up","568 activos (FP)"],["yellow","up","568 presos · 245 liberados"]] },
  { dim:"Político", icon:"🏛", esc:"E4", name:"Cautelares vigentes", desc:"Personas bajo medidas restrictivas no resueltas",
    umbral:">10.000 cautelares sin resolver activa E4.", addedWeek:8,
    hist:[null,null,null,null,null,null,null,["red","flat",">11.000 personas"]] },
  { dim:"Político", icon:"🏛", esc:"E4", name:"Cohesión FANB", desc:"Señales de fractura o lealtad institucional",
    umbral:"Fractura visible = E4/E2 inmediato.",
    hist:[["yellow","flat","Sin señales fractura"],["yellow","flat","Sin señales fractura"],["yellow","flat","Ajustes menores"],["yellow","down","Presión cooperación EE.UU."],["yellow","down","Cubanos retirándose"],["yellow","down","Padrino 12 años · malestar"],["yellow","flat","Sin señales nuevas"],["yellow","flat","Sin señales nuevas"]] },
  { dim:"Político", icon:"🏛", esc:"E3", name:"Reorganización del Ejecutivo", desc:"Capacidad de gestión institucional",
    umbral:"Reconfiguración técnica → E1. Política → E4.",
    hist:[["yellow","flat","Maduro removido"],["yellow","up","Delcy consolida"],["green","up","Gabinete activo"],["green","up","Estructura operativa"],["green","up","Cancillería reestructurada"],["green","up","Poder Ciudadano: encargados"],["green","up","Poder Ciudadano: 30 días"],["green","up","Relaciones diplomáticas plenas"]] },
  { dim:"Político", icon:"🏛", esc:"E1", name:"Agenda electoral", desc:"Calendario y compromisos electorales concretos",
    umbral:"Anuncio formal de fecha = E1 gana probabilidad.",
    hist:[["red","flat","Sin agenda"],["red","flat","Sin agenda"],["yellow","flat","Señales vagas"],["yellow","up","Rubio: legitimación req."],["yellow","up","Presión EE.UU. activa"],["yellow","up","2/3 exige elecciones"],["yellow","up","Rubio reitera exigencia"],["yellow","up","66% exige · H.R. 7674"]] },
  { dim:"Político", icon:"🏛", esc:"E4", name:"Marcos restrictivos vigentes", desc:"Leyes de odio, terrorismo, delitos de expresión",
    umbral:"Activación contra oposición = E4. Derogación = E1.",
    hist:[["red","flat","Ley Odio vigente"],["red","flat","Sin cambio"],["red","flat","Sin cambio"],["red","flat","Sin cambio"],["red","flat","Sin cambio"],["red","flat","Sin cambio"],["red","flat","Stalin exige derogar"],["yellow","up","J.Rodríguez: revisión Ley Odio"]] },
  { dim:"Político", icon:"🏛", esc:"E1", name:"Liderazgo opositor", desc:"Índice de liderazgo y capacidad de articulación opositora",
    umbral:"MCM >100 pts consolida E1. Fragmentación debilita.", addedWeek:8,
    hist:[null,null,null,null,null,null,null,["green","up","MCM 106,84/137 · Guanipa 102"]] },

  // ── ECONÓMICO ──
  { dim:"Económico", icon:"📊", esc:"E2", name:"Brecha cambiaria", desc:"Diferencial BCV vs. mercado paralelo",
    umbral:"Brecha >55% activa E2. <30% fortalece E3.",
    hist:[["green","flat","~15%"],["green","flat","~18%"],["yellow","down","~28%"],["yellow","down","~35%"],["yellow","down","~46%"],["yellow","down","~46%"],["yellow","down","52,6% · 631 vs 414"],["yellow","flat",">50% · persistente"]] },
  { dim:"Económico", icon:"📊", esc:"E2", name:"Inflación", desc:"Tasa mensual proyectada",
    umbral:"Retorno a >30% mensual activa E2.",
    hist:[["yellow","flat","~12% mensual"],["yellow","flat","~10% mensual"],["yellow","up","~8% mensual"],["yellow","up","Desacelerando"],["yellow","up","~6% proyectado"],["yellow","up","174% proy. anual (UCAB)"],["yellow","flat","FMI: tres dígitos anual"],["yellow","flat","174% proy. 2026"]] },
  { dim:"Económico", icon:"📊", esc:"E2", name:"Ingresos de la población", desc:"Salario mínimo y poder adquisitivo real",
    umbral:"47 meses sin ajuste. Ingreso ~USD 256 vs canasta USD 550.",
    hist:[["red","flat","Sin ajuste"],["red","flat","Sin ajuste"],["red","flat","Sin ajuste"],["red","flat","Sin ajuste"],["red","flat","47 meses sin ajuste"],["red","flat","69,5% < USD 300"],["red","flat","Canasta 550 vs 270"],["red","flat","USD 256 vs canasta 550"]] },
  { dim:"Económico", icon:"📊", esc:"E2", name:"Sistema eléctrico", desc:"Disponibilidad y frecuencia de cortes",
    umbral:"Cortes >4h/día en zonas urbanas activa presión social.",
    hist:[["red","flat","Cortes frecuentes"],["red","flat","Sin mejora"],["red","flat","Sin mejora"],["red","flat","Sin mejora"],["red","flat","Crítico"],["red","flat","14,8h sin suministro"],["red","flat","Crítico · sin inversión"],["red","flat","14,8h sin suministro"]] },
  { dim:"Económico", icon:"📊", esc:"E3", name:"Percepción dirección del país", desc:"Encuestas de opinión pública",
    umbral:">60% percepción positiva sostiene E3.",
    hist:[["yellow","flat","~35% positivo"],["yellow","up","~40% positivo"],["yellow","up","~44% positivo"],["green","up","~48% positivo"],["green","up","~50% positivo"],["green","up","75% dirección correcta"],["green","flat","51,5% mejor s/ Maduro"],["green","flat",">50% dirección correcta"]] },
  { dim:"Económico", icon:"📊", esc:"E3", name:"PIB trimestral", desc:"Crecimiento económico confirmado",
    umbral:"Crecimiento positivo sostiene E3. Contracción activa E2.", addedWeek:8,
    hist:[null,null,null,null,null,null,null,["green","up","+7,07% Q4 2025"]] },

  // ── INTERNACIONAL ──
  { dim:"Internacional", icon:"🌐", esc:"E3", name:"Cooperación EE.UU.–Venezuela", desc:"Nivel operativo de acuerdos bilaterales",
    umbral:"Ruptura = E4/E2. Profundización = E1.",
    hist:[["yellow","up","Negociaciones iniciales"],["yellow","up","Petróleo fluye"],["green","up","SOUTHCOM reunión"],["green","up","Visitas técnicas"],["green","up","Plan 3 fases"],["green","up","Chris Wright visita"],["green","up","Trump \"nuevo amigo\""],["green","up","Relaciones restablecidas"]] },
  { dim:"Internacional", icon:"🌐", esc:"E3", name:"Sanciones UE", desc:"Estado de sanciones europeas",
    umbral:"Levantamiento parcial fortalece E3.",
    hist:[["red","flat","Sanciones plenas"],["red","flat","Sin cambio"],["red","flat","Sin cambio"],["yellow","up","Señales apertura"],["yellow","up","Diálogo España"],["yellow","up","España propone levantar"],["yellow","up","España propone levantar"],["yellow","up","España: solicitud ante UE"]] },
  { dim:"Internacional", icon:"🌐", esc:"E3", name:"China y Rusia", desc:"Balanza estratégica en contexto acercamiento EE.UU.",
    umbral:"Ruptura con China/Rusia por presión EE.UU. fragiliza E3.",
    hist:[["green","flat","Alineación plena"],["green","flat","Sin cambio"],["green","down","Señales tensión"],["yellow","down","Rebalanceo activo"],["yellow","down","Reducción presencia rusa"],["yellow","down","Cuba retira asesores"],["yellow","down","Cuba retira asesores"],["yellow","flat","China: cooperación bilateral"]] },
  { dim:"Internacional", icon:"🌐", esc:"E1", name:"FMI y reinserción financiera", desc:"Diálogo con IFIs y acceso a mercados",
    umbral:"Acuerdo FMI = E1 clave. 'Intensa Fragilidad' sostiene E2.",
    hist:[["red","flat","Fragmentación total"],["red","flat","Sin diálogo"],["red","flat","Sin diálogo"],["yellow","up","Señales apertura"],["yellow","up","Reuniones técnicas"],["yellow","up","FMI: Intensa Fragilidad"],["yellow","up","FMI: Intensa Fragilidad"],["yellow","up","FMI: disposición si solicita"]] },
  { dim:"Internacional", icon:"🌐", esc:"E3", name:"Normalización diplomática", desc:"Reapertura embajadas y relaciones bilaterales",
    umbral:"Reapertura embajada EE.UU. = E1/E3 consolidado.",
    hist:[["yellow","flat","Limitada"],["yellow","up","Señales apertura"],["green","up","Múltiples contactos"],["green","up","Visitas ministros"],["green","up","Cancillería reestructurada"],["green","up","Tajani · Qatar"],["green","up","Petro-Delcy 14 mar"],["green","up","Burgum visita · Nahuel Gallo"]] },
  { dim:"Internacional", icon:"🌐", esc:"E1", name:"Presión legislativa EE.UU.", desc:"Proyectos de ley y condicionalidades del Congreso",
    umbral:"Aprobación legislativa condiciona E3 y empuja E1.", addedWeek:8,
    hist:[null,null,null,null,null,null,null,["yellow","up","H.R. 7674 · transición 180 días"]] },
];

// Señales por escenario (solo semana más reciente)
const SCENARIO_SIGNALS = [
  { esc:"E3", signals:[
    { name:"Exportaciones récord feb.", sem:"green", val:"788 kbd · Puerto José récord 7 años" },
    { name:"PIB Q4 2025", sem:"green", val:"+7,07% confirmado", isNew:true },
    { name:"Recaudación fiscal", sem:"green", val:"SENIAT +78% feb. vs enero", isNew:true },
    { name:"Marco OFAC consolidado", sem:"green", val:"GL49+GL50/50A+GL129A · Monómeros 2028" },
    { name:"Inversión internacional", sem:"green", val:"Exxon, Shell, Gold Reserve, Ecopetrol" },
    { name:"Trump reconoce a Delcy", sem:"green", val:"\"Presidenta electa\" · cooperación plena" },
    { name:"Amnistía operativa", sem:"green", val:"9.060 solicitudes · 5.628 libertades" },
    { name:"Flujo divisas a banca", sem:"yellow", val:"30–45 días de consolidación" },
    { name:"Brecha cambiaria", sem:"yellow", val:">50% persistente · riesgo estructural" },
  ]},
  { esc:"E1", signals:[
    { name:"MCM liderazgo consolidado", sem:"green", val:"106,84/137 pts · retorno inminente", isNew:true },
    { name:"Exigencia electoral", sem:"green", val:"66% exige elecciones este año" },
    { name:"H.R. 7674 Congreso EE.UU.", sem:"green", val:"Estrategia transición en 180 días", isNew:true },
    { name:"Ramos Allup respalda MCM", sem:"green", val:"AD Resistencia se alinea", isNew:true },
    { name:"Apertura minera", sem:"green", val:"Gold Reserve + reforma legislativa", isNew:true },
    { name:"Fracción Vamos Venezuela", sem:"yellow", val:"Comité recibe Fiscal y Defensor", isNew:true },
    { name:"Calendario electoral", sem:"red", val:"Sin fecha · EE.UU. prioriza economía" },
    { name:"Retorno MCM", sem:"yellow", val:"Anunciado pero no concretado", isNew:true },
    { name:"Marcos restrictivos", sem:"yellow", val:"Ley Odio en revisión — no derogada" },
  ]},
  { esc:"E4", signals:[
    { name:"Brecha cifras amnistía", sem:"yellow", val:"568 presos (FP) vs 5.628 oficiales" },
    { name:"Concentración territorial", sem:"yellow", val:"135/179 excarcelaciones en Caracas", isNew:true },
    { name:">11.000 cautelares vigentes", sem:"red", val:"Medidas restrictivas masivas", isNew:true },
    { name:"Tensiones FANB", sem:"yellow", val:"Malestar por cúpula · Padrino 12 años" },
    { name:"58% percibe deterioro seguridad", sem:"yellow", val:"Desde el 3 de enero" },
    { name:"Concentración poder civil", sem:"yellow", val:"J. Rodríguez · D. Rodríguez · Cabello" },
    { name:"Oficialismo bajo en liderazgo", sem:"yellow", val:"Delcy 25,3 · Diosdado 10,6 · JR 7,1", isNew:true },
  ]},
  { esc:"E2", signals:[
    { name:"Brecha cambiaria >50%", sem:"yellow", val:"Diferencial estructural persistente" },
    { name:"Inflación ~174% proyectada", sem:"yellow", val:"Tres dígitos anual 2026" },
    { name:"69,5% ingresos < USD 300", sem:"red", val:"Canasta USD 550 vs ingreso USD 256" },
    { name:"Sistema eléctrico", sem:"red", val:"14,8h sin suministro promedio" },
    { name:">47 meses sin ajuste salarial", sem:"red", val:"Presión social latente" },
    { name:"Pérdida mercado chino", sem:"yellow", val:"No compensada plenamente", isNew:true },
    { name:"Dependencia licencias OFAC", sem:"yellow", val:"Reversibilidad como riesgo" },
  ]},
];

// ═══════════════════════════════════════════════════════════════
// CURATED NEWS & FACTCHECK — Accumulated from weekly SITREPs
// ═══════════════════════════════════════════════════════════════

const CURATED_NEWS = [
  // S1: 3-15 enero
  { title:"Operación militar de EE.UU. resulta en captura de Nicolás Maduro", date:"2026-01-03", source:"Reuters", scenarios:["E2","E3"], dims:["Internacional"], week:"S1" },
  { title:"Delcy Rodríguez juramentada como presidenta encargada por el TSJ", date:"2026-01-05", source:"AP", scenarios:["E3"], dims:["Político"], week:"S1" },
  { title:"Trump firma orden ejecutiva para proteger ingresos petroleros venezolanos", date:"2026-01-12", source:"White House", scenarios:["E3"], dims:["Energético"], week:"S1" },
  { title:"101 excarcelaciones confirmadas, incluidos 14 periodistas (SNTP)", date:"2026-01-15", source:"SNTP", scenarios:["E1","E3"], dims:["Político"], week:"S1" },
  { title:"Italia reanuda relaciones diplomáticas plenas con Venezuela", date:"2026-01-13", source:"ANSA", scenarios:["E3"], dims:["Internacional"], week:"S1" },
  { title:"Acuerdos para venta de 30-50 millones de barriles de crudo a EE.UU.", date:"2026-01-10", source:"Reuters", scenarios:["E3"], dims:["Energético"], week:"S1" },
  // S2: 16-22 enero
  { title:"Director de la CIA John Ratcliffe visita Caracas — primer alto funcionario post-captura", date:"2026-01-17", source:"Reuters", scenarios:["E3"], dims:["Internacional"], week:"S2" },
  { title:"Licencia General 46 de OFAC crea marco normativo para cooperación energética", date:"2026-01-18", source:"OFAC/Tesoro", scenarios:["E3"], dims:["Energético"], week:"S2" },
  { title:"USD 300 millones canalizados a banca privada venezolana", date:"2026-01-19", source:"BCV", scenarios:["E3"], dims:["Económico"], week:"S2" },
  { title:"Reestructuración de 28 cargos intermedios de la FANB sin alterar cúpula", date:"2026-01-20", source:"El País", scenarios:["E4"], dims:["Político"], week:"S2" },
  { title:"Laura F. Dogu designada como Jefa de Misión de EE.UU. para Venezuela", date:"2026-01-21", source:"Dept. of State", scenarios:["E3"], dims:["Internacional"], week:"S2" },
  // S3: 23-29 enero
  { title:"Reforma de Ley Orgánica de Hidrocarburos aprobada en 2ª discusión — cambio más profundo en 50 años", date:"2026-01-27", source:"AN Venezuela", scenarios:["E3"], dims:["Energético"], week:"S3" },
  { title:"Vitol carga ~460.000 barriles de nafta pesada desde Houston para Faja del Orinoco", date:"2026-01-25", source:"Reuters", scenarios:["E3"], dims:["Energético"], week:"S3" },
  { title:"Reunión Marco Rubio – María Corina Machado en Washington", date:"2026-01-28", source:"Dept. of State", scenarios:["E1"], dims:["Político","Internacional"], week:"S3" },
  { title:"MCM con 78,3% de intención de voto según encuesta", date:"2026-01-26", source:"Encuestadoras", scenarios:["E1"], dims:["Político"], week:"S3" },
  { title:"Primera exportación de gas natural venezolano confirmada", date:"2026-01-24", source:"PDVSA", scenarios:["E3"], dims:["Energético"], week:"S3" },
  // S4: 30 enero - 5 febrero
  { title:"FANB reafirma lealtad al Proyecto Bolivariano el 4 de febrero", date:"2026-02-04", source:"FANB", scenarios:["E4"], dims:["Político"], week:"S4" },
  { title:"Jorge Rodríguez descarta públicamente elecciones inmediatas", date:"2026-02-02", source:"AN Venezuela", scenarios:["E4"], dims:["Político"], week:"S4" },
  { title:"Cierre de El Helicoide como centro de detención policial", date:"2026-02-01", source:"Min. Interior", scenarios:["E3"], dims:["Político"], week:"S4" },
  { title:"14 jefes de Estado europeos presionan hacia cronograma electoral", date:"2026-02-03", source:"UE", scenarios:["E1"], dims:["Internacional"], week:"S4" },
  { title:"Bonos soberanos venezolanos al alza en mercados internacionales", date:"2026-02-05", source:"Bloomberg", scenarios:["E3"], dims:["Económico"], week:"S4" },
  // S5: 6-13 febrero
  { title:"Secretario de Energía Chris Wright visita Venezuela — ventas >USD 1.000M", date:"2026-02-11", source:"DOE", scenarios:["E3"], dims:["Energético","Internacional"], week:"S5" },
  { title:"GL49 y GL50/50A entran en vigor — BP, Chevron, Eni, Repsol, Shell autorizadas", date:"2026-02-08", source:"OFAC", scenarios:["E3"], dims:["Energético"], week:"S5" },
  { title:"Jefe del SOUTHCOM se reúne con Delcy, Padrino y Cabello en Caracas", date:"2026-02-10", source:"SOUTHCOM", scenarios:["E3"], dims:["Internacional"], week:"S5" },
  { title:"Ley de Amnistía: artículos 7-13 diferidos en segunda discusión", date:"2026-02-09", source:"AN Venezuela", scenarios:["E4"], dims:["Político"], week:"S5" },
  { title:"Brecha de excarcelaciones: 897 oficiales vs ~430 verificadas por ONG", date:"2026-02-12", source:"Foro Penal", scenarios:["E4"], dims:["Político"], week:"S5" },
  // S6: 13-20 febrero
  { title:"Ley de Amnistía promulgada el 19 de febrero — hito normativo del ciclo", date:"2026-02-19", source:"Gaceta Oficial", scenarios:["E3","E1"], dims:["Político"], week:"S6" },
  { title:"Foro UCAB: PIB proyectado 10,4-15,2% para 2026; producción 1,22-1,32M bpd", date:"2026-02-17", source:"UCAB", scenarios:["E3"], dims:["Económico"], week:"S6" },
  { title:"Reportaje El País: malestar en FANB por continuidad de Padrino López (12 años)", date:"2026-02-16", source:"El País", scenarios:["E4"], dims:["Político"], week:"S6" },
  { title:"Encuesta Atlantic Council: 75% considera país en dirección correcta", date:"2026-02-18", source:"Atlantic Council", scenarios:["E3"], dims:["Económico"], week:"S6" },
  { title:"España anunciará solicitud ante UE para levantar sanciones a Delcy Rodríguez", date:"2026-02-15", source:"Govt. España", scenarios:["E3"], dims:["Internacional"], week:"S6" },
  // S7: 20-27 febrero
  { title:"Trump califica a Venezuela como 'nuevo amigo y socio' en Estado de la Unión", date:"2026-02-25", source:"White House", scenarios:["E3"], dims:["Internacional"], week:"S7" },
  { title:"Amnistía operativa: 4.203 solicitudes procesadas, 3.231 libertades plenas", date:"2026-02-24", source:"AN Venezuela", scenarios:["E3"], dims:["Político"], week:"S7" },
  { title:"Brecha cambiaria sube a 52,6% — 47 meses sin ajuste salarial", date:"2026-02-23", source:"BCV/Monitor", scenarios:["E2"], dims:["Económico"], week:"S7" },
  { title:"Foro Penal: 568 presos políticos verificados vs 4.151 oficiales", date:"2026-02-25", source:"Foro Penal", scenarios:["E4"], dims:["Político"], week:"S7" },
  { title:"Caso Magalli Meda: operativo con 16 hombres armados en 6 camionetas", date:"2026-02-22", source:"Sociedad Civil", scenarios:["E4"], dims:["Político"], week:"S7" },
  // S8: 27 febrero - 6 marzo
  { title:"EE.UU. y Venezuela restablecen relaciones diplomáticas y consulares (suspendidas desde 2019)", date:"2026-03-01", source:"Dept. of State", scenarios:["E3"], dims:["Internacional"], week:"S8" },
  { title:"Venezuela duplica exportaciones petroleras en febrero: 788.000 bpd — récord 7 años en Puerto de José", date:"2026-03-02", source:"Reuters", scenarios:["E3"], dims:["Energético"], week:"S8" },
  { title:"MCM anuncia retorno a Venezuela con agenda de tres prioridades", date:"2026-03-04", source:"MCM/Oposición", scenarios:["E1"], dims:["Político"], week:"S8" },
  { title:"Petróleo sube 10% por conflicto con Irán — analistas proyectan USD 100/barril", date:"2026-03-05", source:"Bloomberg", scenarios:["E3"], dims:["Energético"], week:"S8" },
  { title:"Recaudación SENIAT +78% en febrero vs. enero — PIB +7,07% Q4 2025", date:"2026-03-03", source:"SENIAT/BCV", scenarios:["E3"], dims:["Económico"], week:"S8" },
  { title:"Doug Burgum visita Venezuela con empresarios del sector energético y minero", date:"2026-03-02", source:"Dept. Interior", scenarios:["E3"], dims:["Energético","Internacional"], week:"S8" },
  { title:"H.R. 7674: Congreso EE.UU. exige estrategia de transición democrática en 180 días", date:"2026-03-03", source:"Congress.gov", scenarios:["E1"], dims:["Internacional"], week:"S8" },
  { title:"Henry Ramos Allup (AD Resistencia) declara respaldo a candidatura de MCM", date:"2026-03-04", source:"Prensa", scenarios:["E1"], dims:["Político"], week:"S8" },
  { title:"Exxon enviará equipo técnico a Venezuela; Shell firma acuerdos de exploración", date:"2026-03-05", source:"Reuters", scenarios:["E3"], dims:["Energético"], week:"S8" },
  { title:"Índice MassBehaviorResearch: MCM lidera con 106,84/137 pts; Maduro en 5,02", date:"2026-03-06", source:"MassBehavior", scenarios:["E1"], dims:["Político"], week:"S8" },
];

const CURATED_FACTCHECK = [
  // S1
  { title:"Verificación: cifras de excarcelaciones — 101 confirmadas vs '400+' declaradas por J. Rodríguez", date:"2026-01-14", source:"Foro Penal", scenarios:["E4"], dims:["Político"], week:"S1", verdict:"Discrepancia" },
  { title:"Opacidad informativa: fallecimiento bajo custodia del Estado sin balance oficial", date:"2026-01-12", source:"Provea", scenarios:["E4"], dims:["Político"], week:"S1", verdict:"Sin verificar" },
  // S3
  { title:"Verificación: MCM con 78,3% intención de voto — muestra y metodología revisadas", date:"2026-01-27", source:"Cotejo.info", scenarios:["E1"], dims:["Político"], week:"S3", verdict:"Confirmado" },
  // S5
  { title:"Brecha de cifras: 897 excarcelaciones oficiales vs ~430 verificadas por ONG", date:"2026-02-12", source:"Foro Penal", scenarios:["E4"], dims:["Político"], week:"S5", verdict:"Discrepancia >50%" },
  { title:"Delcy Rodríguez reafirma en NBC legitimidad formal de Maduro pese a detención", date:"2026-02-11", source:"EsPaja", scenarios:["E4"], dims:["Político"], week:"S5", verdict:"Contradictorio" },
  // S6
  { title:"Ley de Amnistía: solo ~20 meses cubiertos de los 26 años declarados", date:"2026-02-19", source:"Sociedad Civil", scenarios:["E4"], dims:["Político"], week:"S6", verdict:"Parcialmente cierto" },
  { title:"Brecha: 895 liberaciones oficiales vs 383 verificadas por ONG independientes", date:"2026-02-18", source:"Foro Penal", scenarios:["E4"], dims:["Político"], week:"S6", verdict:"Discrepancia" },
  // S7
  { title:"Cifras amnistía: 4.203 solicitudes oficiales vs 568 presos verificados por Foro Penal", date:"2026-02-25", source:"Foro Penal", scenarios:["E4"], dims:["Político"], week:"S7", verdict:"Discrepancia" },
  { title:"FMI clasifica a Venezuela en 'Intensa Fragilidad' — deuda >180% del PIB", date:"2026-02-24", source:"FMI", scenarios:["E2"], dims:["Económico"], week:"S7", verdict:"Confirmado" },
  // S8
  { title:"Trump confirma extracción de 100 millones de barriles — cifra sin verificación independiente", date:"2026-03-04", source:"Cazamos Fake News", scenarios:["E3"], dims:["Energético"], week:"S8", verdict:"Sin verificar" },
  { title:"568 presos políticos (Foro Penal) vs 5.628 libertades plenas oficiales — brecha estructural", date:"2026-03-05", source:"Foro Penal", scenarios:["E4"], dims:["Político"], week:"S8", verdict:"Discrepancia" },
  { title:">11.000 personas bajo medidas cautelares vigentes según estimaciones de ONG", date:"2026-03-06", source:"Provea", scenarios:["E4"], dims:["Político"], week:"S8", verdict:"Confirmado" },
  { title:"MCM Índice 106,84/137 pts — metodología MassBehaviorResearch verificada", date:"2026-03-06", source:"Cotejo.info", scenarios:["E1"], dims:["Político"], week:"S8", verdict:"Confirmado" },
];

// ═══════════════════════════════════════════════════════════════
// AMNISTÍA TRACKER — Datos duales: Gobierno vs Foro Penal
// Se actualiza con cada SITREP semanal
// ═══════════════════════════════════════════════════════════════

const AMNISTIA_TRACKER = [
  // { week, label, gobierno (cifras oficiales), fp (Foro Penal verificado), detenidos (FP), cautelares, militares, hito }
  { week:"S1", label:"3–15 ene", gob:{ solicitudes:null, libertades:null, excarcelados:101 }, fp:{ verificados:0, detenidos:null }, hito:"Primeras 101 excarcelaciones (14 periodistas)" },
  { week:"S2", label:"16–22 ene", gob:{ solicitudes:null, libertades:null, excarcelados:400 }, fp:{ verificados:12, detenidos:null }, hito:"Rodríguez: '400 excarcelaciones'. FP: 12 verificadas" },
  { week:"S3", label:"23–29 ene", gob:{ solicitudes:null, libertades:null, excarcelados:null }, fp:{ verificados:45, detenidos:null }, hito:"Ley de Amnistía en primera discusión" },
  { week:"S4", label:"30e–5f", gob:{ solicitudes:null, libertades:null, excarcelados:null }, fp:{ verificados:78, detenidos:949 }, hito:"Amnistía arts. 7-13 diferidos. Cierre El Helicoide" },
  { week:"S5", label:"6–13 feb", gob:{ solicitudes:null, libertades:897, excarcelados:448 }, fp:{ verificados:108, detenidos:626 }, hito:"Amnistía 2ª discusión. Brecha: 897 vs ~430" },
  { week:"S6", label:"13–20 feb", gob:{ solicitudes:null, libertades:895, excarcelados:448 }, fp:{ verificados:126, detenidos:568 }, hito:"Ley promulgada 19 feb. 895 oficial vs 383 verif." },
  { week:"S7", label:"20–27 feb", gob:{ solicitudes:4203, libertades:3231, excarcelados:null }, fp:{ verificados:126, detenidos:568 }, hito:"Amnistía operativa: 4.203 solicitudes procesadas" },
  { week:"S8", label:"27f–6m", gob:{ solicitudes:9060, libertades:5628, excarcelados:245, cautelares:5383, militares:31 }, fp:{ verificados:670, detenidos:568 }, hito:"9.060 solicitudes · FP: 670 excarcelaciones verificadas (8 mar)" },
];

const GDELT_ANNOTATIONS = [
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
];

const POLYMARKET_SLUGS = [
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

const CONF_HISTORICO = [
  {y:2011,p:5338,h:"Inicio monitoreo OVCS. Gobierno Chávez."},{y:2012,p:5483,h:"Año electoral. Reelección de Chávez."},
  {y:2013,p:4410,h:"Muerte de Chávez. Maduro asume."},{y:2014,p:9286,h:"Protestas masivas 'La Salida'. 43 muertos."},
  {y:2015,p:5851,h:"AN elegida con mayoría opositora."},{y:2016,p:6917,h:"Revocatorio bloqueado. Hiperinflación."},
  {y:2017,p:9787,h:"112 días de protestas. 125+ muertos."},{y:2018,p:12715,h:"Elecciones cuestionadas. Éxodo masivo."},
  {y:2019,p:16739,h:"PICO HISTÓRICO. Apagones. Guaidó."},{y:2020,p:9633,h:"Pandemia COVID-19."},
  {y:2021,p:6560,h:"Elecciones regionales."},{y:2022,p:7032,h:"Negociaciones en México."},
  {y:2023,p:6956,h:"Acuerdo de Barbados. Primarias."},{y:2024,p:5226,h:"Elecciones julio 28. Operación TunTun."},
  {y:2025,p:2219,h:"MÍNIMO HISTÓRICO. Captura Maduro ene 2026."},
];

// ═══ Venezuela Oil Production — Manual OPEC MOMR data (auto-replaced by EIA when available) ═══
// Source: OPEC Monthly Oil Market Reports (Secondary Sources)
// MOMR Jan 2026 (ref 3), MOMR Feb 2026 (ref 2), MOMR Mar 2026 (ref 1)
const VEN_PRODUCTION_MANUAL = [
  { time:"2025-11-15T00:00:00Z", value:956, source:"OPEC MOMR Ene 2026" },
  { time:"2025-12-15T00:00:00Z", value:917, source:"OPEC MOMR Feb 2026" },
  { time:"2026-01-15T00:00:00Z", value:830, source:"OPEC MOMR Feb 2026" },
  { time:"2026-02-15T00:00:00Z", value:903, source:"OPEC MOMR Mar 2026" },
];

const CONF_MESES = [
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

const CONF_DERECHOS = [
  {d:"Participación política",cat:"DCP",p:648,pct:29.2},{d:"Derechos laborales",cat:"DESCA",p:573,pct:25.8},
  {d:"Vivienda/hábitat",cat:"DESCA",p:556,pct:25.1},{d:"Justicia",cat:"DCP",p:504,pct:22.7},
  {d:"Servicios básicos",cat:"DESCA",p:275,pct:12.4},{d:"Salud",cat:"DESCA",p:189,pct:8.5},
  {d:"Educación",cat:"DESCA",p:186,pct:8.4},{d:"Seguridad social",cat:"DESCA",p:151,pct:6.8},
];

const CONF_SERVICIOS = [
  {s:"Electricidad",i:"⚡",p:160,pct:58.2},{s:"Agua potable",i:"💧",p:98,pct:35.6},
  {s:"Aguas servidas",i:"🚰",p:88,pct:32.0},{s:"Vialidad",i:"🛣️",p:85,pct:30.9},
  {s:"Desechos sólidos",i:"🗑️",p:38,pct:13.8},{s:"Combustible/gas",i:"⛽",p:29,pct:10.5},
  {s:"Gas doméstico",i:"🔥",p:16,pct:5.8},{s:"Alumbrado",i:"💡",p:11,pct:4.0},
];

const CONF_ESTADOS = [
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
const VZ_MAP = [
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

// ═══════════════════════════════════════════════════════════════
// STYLES — Light theme, high contrast, legible fonts
// ═══════════════════════════════════════════════════════════════
const BG = "#f4f6f9";
const BG2 = "#ffffff";
const BG3 = "#eef1f5";
const BORDER = "#d0d7e0";
const TEXT = "#1a202c";
const MUTED = "#5a6a7a";
const ACCENT = "#0468B1";
const SC = { 1:"#2d8a30", 2:"#c92a2a", 3:"#0468B1", 4:"#d4850a" };
const SEM = { green:"#16a34a", yellow:"#ca8a04", red:"#dc2626" };

const font = "'Space Mono', monospace";
const fontSans = "'DM Sans', sans-serif";

// Responsive hook
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

// ═══════════════════════════════════════════════════════════════
// GDELT FETCHER — Live via CORS proxy, fallback to mock
// ═══════════════════════════════════════════════════════════════

const GDELT_BASE = "https://api.gdeltproject.org/api/v2/doc/doc";
const GDELT_TIMESPAN = "120d";

// Detect if running on Vercel (has /api routes) vs local/Claude artifact
const IS_DEPLOYED = typeof window !== "undefined" && (window.location.hostname.includes("vercel.app") || window.location.hostname.includes(".") && !window.location.hostname.includes("localhost"));

const CORS_PROXIES = IS_DEPLOYED
  ? [(url) => url] // On Vercel, no proxy needed (serverless functions handle it)
  : [
      (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    ];

const GDELT_QUERIES = IS_DEPLOYED
  ? { all: "/api/gdelt" } // Use Vercel serverless function
  : {
      instability: `${GDELT_BASE}?query=venezuela+(protest+OR+conflict+OR+crisis+OR+violence+OR+unrest)&mode=timelinevol&timespan=${GDELT_TIMESPAN}&format=csv`,
      tone: `${GDELT_BASE}?query=venezuela&mode=timelinetone&timespan=${GDELT_TIMESPAN}&format=csv`,
      artvolnorm: `${GDELT_BASE}?query=venezuela&mode=timelinevol&timespan=${GDELT_TIMESPAN}&format=csv`,
    };

function parseGdeltCsv(csvText) {
  const map = new Map();
  const clean = csvText.replace(/^\uFEFF/, "").trim();
  const lines = clean.split("\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    const date = parts[0]?.trim();
    const value = parseFloat(parts[parts.length - 1]?.trim());
    if (date && !isNaN(value)) map.set(date, value);
  }
  return map;
}

async function fetchGdeltSignal(url) {
  for (const proxyFn of CORS_PROXIES) {
    try {
      const res = await fetch(proxyFn(url), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.includes("<!") || text.length < 20) continue;
      return parseGdeltCsv(text);
    } catch { continue; }
  }
  return new Map();
}

async function fetchAllGdelt() {
  // If deployed on Vercel, use the serverless function (no CORS issues)
  if (IS_DEPLOYED && GDELT_QUERIES.all) {
    try {
      const res = await fetch(GDELT_QUERIES.all, { signal: AbortSignal.timeout(12000) });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) return json.data;
      }
    } catch { /* fall through to proxy method */ }
  }

  // Fallback: direct fetch via CORS proxies
  const [instMap, toneMap, artMap] = await Promise.all([
    fetchGdeltSignal(GDELT_QUERIES.instability || `${GDELT_BASE}?query=venezuela+(protest+OR+conflict+OR+crisis+OR+violence+OR+unrest)&mode=timelinevol&timespan=${GDELT_TIMESPAN}&format=csv`),
    fetchGdeltSignal(GDELT_QUERIES.tone || `${GDELT_BASE}?query=venezuela&mode=timelinetone&timespan=${GDELT_TIMESPAN}&format=csv`),
    fetchGdeltSignal(GDELT_QUERIES.artvolnorm || `${GDELT_BASE}?query=venezuela&mode=timelinevol&timespan=${GDELT_TIMESPAN}&format=csv`),
  ]);

  const allDates = new Set([...instMap.keys(), ...toneMap.keys(), ...artMap.keys()]);
  if (allDates.size === 0) return null;

  return Array.from(allDates).sort().map(date => ({
    date,
    instability: instMap.get(date) ?? null,
    tone: toneMap.get(date) ?? null,
    artvolnorm: artMap.get(date) ?? null,
  }));
}

function generateMockGdelt() {
  const pts = [];
  const start = new Date("2025-11-01");
  for (let i = 0; i < 120; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i);
    const ds = d.toISOString().split("T")[0];
    let inst = 2.5 + Math.sin(i*0.1)*0.3 + (Math.random()-0.5)*0.4;
    let tone = -3.5 + Math.sin(i*0.08)*0.5 + (Math.random()-0.5)*0.6;
    let art = 1.2 + Math.sin(i*0.12)*0.2 + (Math.random()-0.5)*0.3;
    const d3 = i - 63;
    if (Math.abs(d3) <= 10) { const s = Math.exp(-0.25*Math.abs(d3)); inst+=4.5*s; tone-=5.5*s; art+=3.5*s; }
    if (Math.abs(i-65) <= 5) { const s = Math.exp(-0.4*Math.abs(i-65)); inst+=2*s; tone-=2*s; art+=1.5*s; }
    if (i > 75) { const dc = (i-75)*0.02; inst -= Math.min(dc,1.5); tone += Math.min(dc*0.5,0.8); }
    pts.push({ date:ds, instability:Math.max(0,+inst.toFixed(2)), tone:+tone.toFixed(2), artvolnorm:Math.max(0,+art.toFixed(2)) });
  }
  return pts;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

function Badge({ children, color }) {
  return (
    <span style={{ fontSize:12, fontFamily:font, letterSpacing:"0.12em", textTransform:"uppercase",
      padding:"2px 7px", background:`${color}18`, color, border:`1px solid ${color}30` }}>
      {children}
    </span>
  );
}

function Card({ children, style, accent }) {
  return (
    <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:"18px 20px", position:"relative", borderRadius:6, boxShadow:"0 1px 3px rgba(0,0,0,0.06)", marginBottom:10, ...style }}>
      {accent && <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:accent, borderRadius:"6px 0 0 6px" }} />}
      {children}
    </div>
  );
}

function SemDot({ color, size=8 }) {
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%",
    background:SEM[color]||color, boxShadow:`0 0 5px ${SEM[color]||color}`, flexShrink:0 }} />;
}

// ── MINI MATRIX SVG ─────────────────────────────────────────
function MiniMatrix({ weekIdx }) {
  const W=280, H=180, pad=14;
  const cW=W-2*pad, cH=H-2*pad;
  const trail = WEEKS.slice(0, weekIdx+1).map(w => ({
    px: pad + w.xy.x * cW,
    py: pad + (1-w.xy.y) * cH,
  }));
  const cur = trail[trail.length-1];
  const dom = WEEKS[weekIdx].probs.reduce((a,b)=>a.v>b.v?a:b);
  const domC = SC[dom.sc];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}>
      {/* Quadrants */}
      <rect x={pad} y={pad} width={cW/2} height={cH/2} fill="rgba(76,159,56,0.06)" />
      <rect x={pad+cW/2} y={pad} width={cW/2} height={cH/2} fill="rgba(229,36,59,0.06)" />
      <rect x={pad} y={pad+cH/2} width={cW/2} height={cH/2} fill="rgba(10,151,217,0.06)" />
      <rect x={pad+cW/2} y={pad+cH/2} width={cW/2} height={cH/2} fill="rgba(252,195,11,0.06)" />
      <line x1={pad} y1={pad+cH/2} x2={pad+cW} y2={pad+cH/2} stroke={BORDER} strokeWidth={1} />
      <line x1={pad+cW/2} y1={pad} x2={pad+cW/2} y2={pad+cH} stroke={BORDER} strokeWidth={1} />
      {/* Labels */}
      <text x={pad+4} y={pad+10} fontSize={7} fill={MUTED} fontFamily={font}>E1</text>
      <text x={pad+cW/2+4} y={pad+10} fontSize={7} fill={MUTED} fontFamily={font}>E2</text>
      <text x={pad+4} y={pad+cH-4} fontSize={7} fill={MUTED} fontFamily={font}>E3</text>
      <text x={pad+cW/2+4} y={pad+cH-4} fontSize={7} fill={MUTED} fontFamily={font}>E4</text>
      {/* Trail */}
      {trail.slice(1).map((p,i) => (
        <line key={i} x1={trail[i].px} y1={trail[i].py} x2={p.px} y2={p.py}
          stroke={ACCENT} strokeWidth={1.5} strokeDasharray="3 2" opacity={0.2+((i+1)/trail.length)*0.5} />
      ))}
      {trail.slice(0,-1).map((p,i) => (
        <circle key={i} cx={p.px} cy={p.py} r={3} fill={ACCENT} opacity={0.3} />
      ))}
      {/* Active */}
      <circle cx={cur.px} cy={cur.py} r={7} fill={domC} opacity={0.15} />
      <circle cx={cur.px} cy={cur.py} r={5} fill={domC} opacity={0.9} />
      <text x={cur.px} y={cur.py+3} textAnchor="middle" fontSize={6} fontWeight={700} fill={BG} fontFamily={font}>E{dom.sc}</text>
    </svg>
  );
}

// ── ISV GAUGE (from monitor-venezuela.jsx) ───────────────────
function ISVGauge({ score=67, prev=63 }) {
  const delta = score - prev;
  const angle = -135 + (score/100)*270;
  const c = score >= 70 ? "#ef4444" : score >= 50 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ textAlign:"center" }}>
      <svg width="160" height="100" viewBox="0 0 200 130">
        <defs><linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" /><stop offset="50%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ef4444" />
        </linearGradient></defs>
        <path d="M 20 110 A 80 80 0 1 1 180 110" fill="none" stroke={BG3} strokeWidth="10" strokeLinecap="round" />
        <path d="M 20 110 A 80 80 0 1 1 180 110" fill="none" stroke="url(#gg)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(score/100)*251.2} 251.2`} />
        <g transform={`rotate(${angle}, 100, 110)`}>
          <line x1="100" y1="110" x2="100" y2="45" stroke={c} strokeWidth="2" strokeLinecap="round" />
          <circle cx="100" cy="110" r="5" fill={c} /><circle cx="100" cy="110" r="2.5" fill={BG} />
        </g>
        <text x="100" y="96" textAnchor="middle" fill={c} fontSize="24" fontWeight="700" fontFamily={font}>{score}</text>
        <text x="100" y="112" textAnchor="middle" fill={MUTED} fontSize="9" fontFamily={font}>/100</text>
      </svg>
      <div style={{ fontSize:14, color:delta>0?"#ef4444":"#22c55e", fontFamily:font, fontWeight:600 }}>
        {delta>0?"▲":"▼"} {Math.abs(delta)} pts vs anterior
      </div>
    </div>
  );
}

// ── GDELT CHART ─────────────────────────────────────────────
function GdeltChart({ data }) {
  const [hover, setHover] = useState(null);
  const [signals, setSignals] = useState({ instability:true, tone:true, artvolnorm:true });
  
  const maxInst = Math.max(...data.map(d=>d.instability||0));
  const maxArt = Math.max(...data.map(d=>d.artvolnorm||0));
  const maxLeft = Math.max(maxInst, maxArt, 1);
  const toneMin = -10, toneMax = 2;
  
  const W = 800, H = 280, padL = 45, padR = 45, padT = 15, padB = 35;
  const cW = W-padL-padR, cH = H-padT-padB;
  
  const toX = (i) => padL + (i/(data.length-1)) * cW;
  const toYLeft = (v) => padT + cH - (v/maxLeft)*cH;
  const toYRight = (v) => padT + cH - ((v-toneMin)/(toneMax-toneMin))*cH;
  
  const makePath = (key, yFn) => {
    return data.map((d,i) => d[key] != null ? `${i===0?"M":"L"}${toX(i)},${yFn(d[key])}` : "").filter(Boolean).join(" ");
  };
  
  const makeArea = (key, yFn) => {
    const indices = data.map((d,i) => d[key]!=null ? i : -1).filter(i=>i>=0);
    if (!indices.length) return "";
    let path = `M${toX(indices[0])},${yFn(data[indices[0]][key])}`;
    for (let j=1; j<indices.length; j++) path += ` L${toX(indices[j])},${yFn(data[indices[j]][key])}`;
    path += ` L${toX(indices[indices.length-1])},${padT+cH} L${toX(indices[0])},${padT+cH} Z`;
    return path;
  };

  const annotations = GDELT_ANNOTATIONS.map(a => {
    const idx = data.findIndex(d=>d.date===a.date);
    return idx >= 0 ? { ...a, x: toX(idx) } : null;
  }).filter(Boolean);

  const tierColor = { CRITICAL:"#ff2222", HIGH:"#ff7733", MEDIUM:"#c49000", LOW:"#0e7490" };
  const sigColor = { instability:"#ff3b3b", tone:"#0e7490", artvolnorm:"#c49000" };
  const sigLabel = { instability:"Índice de Conflicto", tone:"Tono Mediático", artvolnorm:"Oleada de Atención" };

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        {Object.keys(sigColor).map(k => (
          <button key={k} onClick={() => setSignals(p=>({...p,[k]:!p[k]}))}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20,
              fontSize:13, fontFamily:font, border:`1px solid ${signals[k]?sigColor[k]:BORDER}`,
              background:"transparent", color:sigColor[k], opacity:signals[k]?1:0.3, cursor:"pointer" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:sigColor[k] }} />
            {sigLabel[k]}
          </button>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = (e.clientX - rect.left) / rect.width * W;
          const idx = Math.round(((mx - padL) / cW) * (data.length-1));
          if (idx >= 0 && idx < data.length) setHover(idx);
        }}
        onMouseLeave={() => setHover(null)}>
        {/* Grid */}
        {[0,0.25,0.5,0.75,1].map(f => (
          <line key={f} x1={padL} y1={padT+f*cH} x2={padL+cW} y2={padT+f*cH} stroke="rgba(0,0,0,0.06)" />
        ))}
        {/* Left Y axis labels */}
        {[0,0.25,0.5,0.75,1].map(f => (
          <text key={`l${f}`} x={padL-6} y={padT+(1-f)*cH+3} textAnchor="end" fontSize={8} fill={MUTED} fontFamily={font}>
            {(maxLeft*f).toFixed(0)}
          </text>
        ))}
        {/* Right Y axis labels (tone) */}
        {[0,0.25,0.5,0.75,1].map(f => {
          const v = toneMin + (toneMax-toneMin)*f;
          return <text key={`r${f}`} x={padL+cW+6} y={padT+(1-f)*cH+3} textAnchor="start" fontSize={8} fill="#0e7490" fontFamily={font}>
            {v.toFixed(0)}
          </text>;
        })}
        {/* Annotation lines */}
        {annotations.map((a,i) => (
          <g key={`ann${i}`}>
            <line x1={a.x} y1={padT} x2={a.x} y2={padT+cH} stroke={tierColor[a.tier]} strokeDasharray="4 3" opacity={0.4} />
            <polygon points={`${a.x-4},${padT+cH+6} ${a.x+4},${padT+cH+6} ${a.x},${padT+cH+1}`} fill={tierColor[a.tier]} opacity={0.8} />
            <polygon points={`${a.x-4},${padT-1} ${a.x+4},${padT-1} ${a.x},${padT+5}`} fill={tierColor[a.tier]} opacity={0.5} />
          </g>
        ))}
        {/* Areas */}
        {signals.artvolnorm && <path d={makeArea("artvolnorm",toYLeft)} fill="#c4900020" />}
        {signals.instability && <path d={makeArea("instability",toYLeft)} fill="#ff3b3b18" />}
        {signals.tone && <path d={makeArea("tone",toYRight)} fill="#0e749015" />}
        {/* Lines */}
        {signals.artvolnorm && <path d={makePath("artvolnorm",toYLeft)} fill="none" stroke="#c49000" strokeWidth={2} />}
        {signals.instability && <path d={makePath("instability",toYLeft)} fill="none" stroke="#ff3b3b" strokeWidth={2} />}
        {signals.tone && <path d={makePath("tone",toYRight)} fill="none" stroke="#0e7490" strokeWidth={1.5} strokeDasharray="4 2" />}
        {/* X labels */}
        {data.filter((_,i) => i % Math.floor(data.length/8) === 0).map((d,i) => {
          const idx = data.indexOf(d);
          return <text key={i} x={toX(idx)} y={H-4} textAnchor="middle" fontSize={8} fill={MUTED} fontFamily={font}>
            {new Date(d.date+"T00:00").toLocaleDateString("es",{month:"short",day:"numeric"})}
          </text>;
        })}
        {/* Hover */}
        {hover !== null && <>
          <line x1={toX(hover)} y1={padT} x2={toX(hover)} y2={padT+cH} stroke="rgba(255,255,255,0.25)" />
          {signals.instability && data[hover].instability!=null && <circle cx={toX(hover)} cy={toYLeft(data[hover].instability)} r={3.5} fill="#ff3b3b" stroke={BG} strokeWidth={2} />}
          {signals.tone && data[hover].tone!=null && <circle cx={toX(hover)} cy={toYRight(data[hover].tone)} r={3.5} fill="#0e7490" stroke={BG} strokeWidth={2} />}
          {signals.artvolnorm && data[hover].artvolnorm!=null && <circle cx={toX(hover)} cy={toYLeft(data[hover].artvolnorm)} r={3.5} fill="#c49000" stroke={BG} strokeWidth={2} />}
        </>}
      </svg>
      {/* Tooltip */}
      {hover !== null && data[hover] && (
        <div style={{ fontSize:13, fontFamily:font, color:TEXT, marginTop:6, padding:"8px 12px", background:BG2, border:`1px solid ${BORDER}`, display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ color:TEXT, fontWeight:600 }}>{new Date(data[hover].date+"T00:00").toLocaleDateString("es",{day:"numeric",month:"short",year:"numeric"})}</span>
          {signals.instability && <span style={{ color:"#ff3b3b" }}>Conflicto: {data[hover].instability?.toFixed(2)}</span>}
          {signals.tone && <span style={{ color:"#0e7490" }}>Tono: {data[hover].tone?.toFixed(2)}</span>}
          {signals.artvolnorm && <span style={{ color:"#c49000" }}>Atención: {data[hover].artvolnorm?.toFixed(2)}</span>}
          {GDELT_ANNOTATIONS.find(a=>a.date===data[hover].date) && (
            <span style={{ color:tierColor[GDELT_ANNOTATIONS.find(a=>a.date===data[hover].date).tier], fontWeight:600 }}>
              ● {GDELT_ANNOTATIONS.find(a=>a.date===data[hover].date).label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── CONFLICTIVIDAD MINI ─────────────────────────────────────
function ConflictividadChart() {
  const max = Math.max(...CONF_HISTORICO.map(h=>h.p));
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:160, paddingBottom:20, position:"relative" }}>
      {CONF_HISTORICO.map((h,i) => {
        const pct = (h.p/max)*100;
        const isLast = i === CONF_HISTORICO.length-1;
        const isPeak = h.p === max;
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%" }}>
            <div style={{ fontSize:9, fontFamily:font, color:isLast?ACCENT:isPeak?"#E5243B":MUTED, marginBottom:2 }}>
              {(h.p/1000).toFixed(1)}k
            </div>
            <div style={{ width:"100%", height:`${pct}%`, background:isLast?ACCENT:isPeak?"#E5243B":`${ACCENT}40`,
              borderRadius:"2px 2px 0 0", transition:"height 0.5s", minHeight:2 }} />
            <div style={{ fontSize:9, fontFamily:font, color:isLast?ACCENT:MUTED, marginTop:4, transform:"rotate(-45deg)", transformOrigin:"top left", whiteSpace:"nowrap" }}>
              {String(h.y).slice(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB VIEWS
// ═══════════════════════════════════════════════════════════════

function Sparkline({ scId, currentWeek }) {
  const vals = WEEKS.map(w => w.probs.find(p=>p.sc===scId)?.v || 0);
  const max = Math.max(...vals, 1);
  const W = 80, H = 24;
  const color = SC[scId];
  const pts = vals.map((v,i) => `${(i/(vals.length-1))*W},${H-(v/max)*H}`).join(" ");
  return (
    <svg width={W} height={H} style={{ display:"block", overflow:"visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.2} strokeLinejoin="round" opacity={0.6} />
      {currentWeek < vals.length && (
        <circle cx={(currentWeek/(vals.length-1))*W} cy={H-(vals[currentWeek]/max)*H} r={2.5} fill={color} />
      )}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// SITREP DATA
// ═══════════════════════════════════════════════════════════════

const SITREP_ALL = [
  // S1: 3-15 enero
  { period:"3 – 15 de enero de 2026", periodShort:"3–15 ene 2026",
    keyPoints:[
      { tag:"Operación", color:"#dc2626", title:"Captura de Maduro por fuerzas de EE.UU.", text:"El 3 de enero fuerzas estadounidenses capturan a Nicolás Maduro. Designación de Delcy Rodríguez como presidenta encargada, avalada por el TSJ y reconocida por Washington." },
      { tag:"Energía", color:"#ca8a04", title:"Interrupción y reactivación petrolera", text:"Interrupción casi total de exportaciones en primeros días, seguida de reanudación progresiva. Acuerdos para 30–50 millones de barriles. Primera venta de USD 500M." },
      { tag:"Distensión", color:"#16a34a", title:"101 excarcelaciones confirmadas", text:"101 privados de libertad excarcelados, incluidos 14 periodistas. Persisten lagunas informativas y ausencia de listas verificables." },
    ],
    sintesis:"Venezuela transitó de una fase de choque coercitivo hacia un equilibrio frágil de estabilización negociada, altamente dependiente del control energético. EE.UU. articuló un eje de tres fases: control de venta de petróleo, soporte a gobierno interino y transición eventual. El 47% aprobó la operación y el 79% tiene opinión favorable hacia Delcy.",
    actores:[
      { name:"EE.UU.", items:["Acuerdos para 30-50M barriles (USD 4.200M est.)","Orden ejecutiva protege ingresos petroleros venezolanos","Esquema escrow supervisado para distribución condicionada","Trump se reúne con MCM el 15 de enero"] },
      { name:"Gobierno Interino", items:["Delcy Rodríguez designada presidenta encargada","Reforma parcial Ley Orgánica de Hidrocarburos propuesta","Creación de dos Fondos Soberanos (protección social + infraestructura)","Ajustes ministeriales: Ecosocialismo y Despacho de la Presidencia"] },
      { name:"Oposición", items:["MCM se reúne con Trump en la Casa Blanca","101 excarcelaciones confirmadas (14 periodistas)","Oposición con presencia minoritaria en AN 2026-2031","Solicitudes de listas verificables y cronogramas"] },
      { name:"Internacional", items:["Italia reanuda relaciones diplomáticas plenas","Embajadores UE/UK/Suiza se reúnen con autoridades","China y Rusia rechazan operación militar","FMI/BM evalúan utilización de USD 5.000M en DEG"] },
    ],
  },
  // S2: 16-22 enero
  { period:"16 – 22 de enero de 2026", periodShort:"16–22 ene 2026",
    keyPoints:[
      { tag:"Diplomacia", color:"#0468B1", title:"Director de la CIA visita Caracas", text:"John Ratcliffe visita a Delcy Rodríguez — primer alto funcionario del gabinete en Venezuela tras la captura. Se consolida el doble canal: reconocimiento a Delcy + interlocución con MCM." },
      { tag:"Energía", color:"#16a34a", title:"Licencia General 46 y flujo de divisas", text:"LG-46 de OFAC crea marco normativo para cooperación energética. USD 300M canalizados a banca privada. BCV publica tipo de cambio por primera vez desde agosto 2024." },
      { tag:"Institucional", color:"#ca8a04", title:"Reconfiguración gabinete y FANB", text:"Reestructuración de 28 cargos intermedios de la FANB manteniendo cúpula. Salida de Álex Saab del CIIP. Aprobación inicial de leyes de hidrocarburos y trámites." },
    ],
    sintesis:"Venezuela avanzó hacia institucionalización progresiva del esquema interino. El período confirmó un modelo de continuidad condicionada: el Estado mantiene funcionamiento pero con márgenes definidos por la arquitectura energética-financiera supervisada. La canalización de divisas a la banca privada comenzó a reflejarse en reducción de brechas cambiarias.",
    actores:[
      { name:"EE.UU.", items:["Visita del Director de la CIA John Ratcliffe a Caracas","Doble canal: reconocimiento Delcy + interlocución MCM","Ampliación de licencias petroleras para Chevron","Designación de Laura F. Dogu como Jefa de Misión"] },
      { name:"Gobierno Interino", items:["USD 300M distribuidos a 5 bancos privados","Reforma Ley de Hidrocarburos en primera discusión","Reestructuración 28 cargos intermedios FANB","Salida de Álex Saab del CIIP"] },
      { name:"Oposición", items:["MCM concentra acción en plano internacional","Capriles/González demandan atención a salarios y pensiones","Fragmentación estratégica persiste","Capacidad de incidencia interna limitada"] },
      { name:"Internacional", items:["Reapertura del espacio aéreo comercial","Superpetroleros chinos regresan al Atlántico","Operaciones de interdicción marítima continúan","Contactos exploratorios para reenganche económico"] },
    ],
  },
  // S3: 23-29 enero
  { period:"23 – 29 de enero de 2026", periodShort:"23–29 ene 2026",
    keyPoints:[
      { tag:"Legislativo", color:"#16a34a", title:"Reforma de Hidrocarburos aprobada en 2ª discusión", text:"Cambio estructural más profundo en el sector petrolero venezolano en 50 años. Formaliza un nuevo modelo de gobernanza del sector energético." },
      { tag:"Energía", color:"#0468B1", title:"LG-46 operativa: Vitol carga desde Houston", text:"Vitol carga ~460.000 barriles de nafta pesada desde Houston para la Faja del Orinoco. Exportaciones se incrementan sostenidamente. Primera exportación de gas natural confirmada." },
      { tag:"Oposición", color:"#ca8a04", title:"Reunión Rubio-MCM en Washington", text:"Marco Rubio se reúne con MCM. 78,3% de intención de voto por MCM. Rubio compara con transición española: 'los cambios profundos requieren tiempo'." },
    ],
    sintesis:"E3 consolida su probabilidad más alta del ciclo — 60%. El esquema de estabilización deja de ser promesa y se convierte en mecanismo operativo verificable. La LG-46 está efectiva, la reforma de hidrocarburos es el cambio más profundo en 50 años, y la reunión Rubio-MCM institucionaliza el doble canal hacia la transición.",
    actores:[
      { name:"EE.UU.", items:["LG-46 OFAC emitida y operativa","Reunión Rubio-MCM institucionaliza canal hacia transición","Rubio: 'cambios profundos requieren tiempo'","Reapertura espacio aéreo y conectividad"] },
      { name:"Gobierno Interino", items:["Reforma Ley Orgánica de Hidrocarburos en 2ª discusión","Ley de Amnistía en primera discusión","Exportaciones creciendo sostenidamente","Gestión de normalización operativa"] },
      { name:"Oposición", items:["MCM con 78,3% intención de voto","Reunión Rubio-MCM en Washington","Ley de Amnistía entra en discusión","Presión opositora activa sin fechas electorales"] },
      { name:"Internacional", items:["Gas natural: primera exportación confirmada","Conectividad aérea restablecida","Normalización multilateral progresiva","Estabilización energética más allá del petróleo"] },
    ],
  },
  // S4: 30 enero - 5 febrero
  { period:"30 de enero – 5 de febrero de 2026", periodShort:"30 ene–5 feb 2026",
    keyPoints:[
      { tag:"Político", color:"#ca8a04", title:"Primera tensión sistémica del ciclo", text:"FANB reafirma lealtad al Proyecto Bolivariano. Jorge Rodríguez descarta elecciones inmediatas. El 93,5% rechaza una transición chavista y 78,3% apoya a MCM." },
      { tag:"Energía", color:"#16a34a", title:"Exportaciones ~800 kbd · USD >800M acumulados", text:"Las exportaciones alcanzan ~800.000 barriles diarios. Bonos soberanos al alza. Trayectoria hacia la meta petrolera sostenida." },
      { tag:"DDHH", color:"#0468B1", title:"Amnistía en 1ª discusión · Cierre de El Helicoide", text:"Ley de Amnistía diferida en artículos 7-13. Cierre de El Helicoide como centro policial presentado como señal de apertura. 949 detenidos por motivos políticos al 21 de enero." },
    ],
    sintesis:"Primera tensión sistémica del ciclo de estabilización. E3 cede levemente a 50%, E1 sube a 30% y E4 gana terreno hasta 15%. La contradicción central es entre la aceleración de la normalización energético-diplomática y la resistencia del Ejecutivo a las aperturas políticas que esa misma lógica comienza a demandar.",
    actores:[
      { name:"EE.UU.", items:["Ampliación de licencias OFAC continúa","14 jefes de Estado europeos presionan cronograma electoral","Trump propone reunir representantes chavismo y oposición","Cooperación energética en expansión"] },
      { name:"Gobierno Interino", items:["FANB reafirma lealtad al Proyecto Bolivariano","Jorge Rodríguez descarta elecciones inmediatas","Cierre de El Helicoide como centro policial","Amnistía arts. 7-13 diferidos"] },
      { name:"Oposición", items:["93,5% rechaza transición chavista","MCM con 78,3% intención de voto","Presión para cronograma electoral","Crítica al alcance real de la amnistía"] },
      { name:"Internacional", items:["14 jefes de Estado europeos presionan","Bonos soberanos al alza","Normalización económica avanza","FMI evalúa contactos"] },
    ],
  },
  // S5: 6-13 febrero
  { period:"6 – 13 de febrero de 2026", periodShort:"6–13 feb 2026",
    keyPoints:[
      { tag:"Energía", color:"#16a34a", title:"Visita Chris Wright · GL49+GL50 operativas", text:"El secretario de Energía Chris Wright visita Venezuela. Ventas superan USD 1.000M con acuerdos de USD 5.000M. BP, Chevron, Eni, Repsol y Shell autorizadas." },
      { tag:"Legislativo", color:"#0468B1", title:"Amnistía en 2ª discusión · Arts. 7-13 diferidos", text:"Ley de Amnistía avanza pero artículos más sensibles diferidos. Brecha entre 897 liberaciones oficiales y ~430 verificadas por ONG." },
      { tag:"Seguridad", color:"#ca8a04", title:"SOUTHCOM en Caracas · Hoja de ruta de 3 fases", text:"Jefe del SOUTHCOM se reúne con Delcy, Padrino y Cabello. Cooperación en narcotráfico, terrorismo y migración. Hoja de ruta de tres fases incluye 'transición' como fase 3." },
    ],
    sintesis:"La semana de mayor ambigüedad estructural del ciclo. E3 continúa dominante al 45% pero la distancia sobre E1 se reduce y E4 sube a 20%. La Ley de Amnistía revela sus límites con artículos diferidos. Delcy reafirma en NBC la legitimidad formal de Maduro pese a su detención — equilibrio retórico frágil.",
    actores:[
      { name:"EE.UU.", items:["Chris Wright visita: ventas >USD 1.000M","GL49+GL50/50A operativas con condiciones estrictas","SOUTHCOM reuniones en Caracas","Hoja de ruta: estabilización → recuperación → transición"] },
      { name:"Gobierno Interino", items:["Delcy reafirma legitimidad de Maduro en NBC","Reorganización Ministerio del Despacho","Excarcelaciones con medidas cautelares","Supresión de CESPPA y Misión Robert Serra"] },
      { name:"Oposición", items:["MCM: elecciones libres en 9-10 meses","Guanipa liberado; demanda liberación total","67% votaría por MCM (Financial Times)","Brecha cifras: 897 oficiales vs ~430 verificadas"] },
      { name:"Internacional", items:["España propone levantar sanciones a Delcy ante UE","China: cooperación bilateral, crítica sanciones","FMI dispuesto a contactos si Venezuela solicita","Qatar PM visita Caracas"] },
    ],
  },
  // S6: 13-20 febrero
  { period:"13 – 20 de febrero de 2026", periodShort:"13–20 feb 2026",
    keyPoints:[
      { tag:"Legislativo", color:"#16a34a", title:"Ley de Amnistía promulgada el 19 de febrero", text:"Hito normativo más significativo del ciclo. Cobertura de 26 años (1999-2026). Extinción de acciones penales, civiles y disciplinarias. Comisión Especial de Seguimiento designada." },
      { tag:"Economía", color:"#0468B1", title:"PIB 10,4-15,2% proyectado · USD 22,7B en ingresos", text:"Foro UCAB proyecta crecimiento récord. Producción estimada 1,22-1,32M bpd. Inflación baja de 567% a 174%. Pero canasta básica USD 550 vs ingreso USD 270." },
      { tag:"Militar", color:"#ca8a04", title:"Tensiones FANB · Padrino López 12 años", text:"Reportaje El País: malestar por continuidad de cúpula militar. Solicitudes de retiro incluso entre generales. Demandas de 'oxigenación' en los cuarteles." },
    ],
    sintesis:"E1 alcanza 35% (máximo del ciclo hasta esta semana). Dos tercios exigen elecciones este año. 75% percibe país en dirección correcta pero con paradoja: prioridad economía sobre democracia 8:1. Las tensiones en FANB y la brecha de cifras de amnistía (895 vs 383 verificadas) configuran un mapa complejo.",
    actores:[
      { name:"EE.UU.", items:["GL49+GL50/50A en plena operación","Ventas >USD 1.000M · acuerdos USD 5.000M","Chris Wright: priorizar recuperación antes que elecciones","SOUTHCOM: plan 3 fases activo"] },
      { name:"Gobierno Interino", items:["Ley de Amnistía promulgada 19 febrero","Reorganización Ministerio del Despacho","Motta Domínguez nombrado Viceministro","Posible viaje Delcy a Colombia (Petro)"] },
      { name:"Oposición", items:["2/3 exigen elecciones este año","52% favorabilidad MCM","Crítica: solo ~20 meses cubiertos de los 26 declarados","Brecha: 895 oficiales vs 383 verificadas"] },
      { name:"Internacional", items:["España: solicitud UE levantar sanciones Delcy","FMI: disposición a contactos formales","Qatar PM Al-Thani visita Caracas","Encuesta Atlantic Council: 75% dirección correcta"] },
    ],
  },
  // S7: 20-27 febrero
  { period:"20 – 27 de febrero de 2026", periodShort:"20–27 feb 2026",
    keyPoints:[
      { tag:"Diplomacia", color:"#16a34a", title:"Trump: 'nuevo amigo y socio' · Estado de la Unión", text:"Trump califica a Venezuela como 'nuevo amigo y socio' en el Estado de la Unión. Enrique Márquez presente en el hemiciclo. Doble canal consolidado." },
      { tag:"Energía", color:"#0468B1", title:"~800K bpd · Proy. USD 6.000M", text:"Exportaciones ~800.000 bpd sostenidas. Vitol/Trafigura con 3 buques para marzo. Refinerías indias incrementan compras. Proyección de ingresos USD 6.000M." },
      { tag:"Institucional", color:"#ca8a04", title:"Amnistía operativa · 4.203 solicitudes", text:"Amnistía pasa de aprobada a operativa: 4.203 solicitudes, 3.231 libertades plenas. Poder Ciudadano se reconfigura: renuncias de Saab y Ruiz con plazo de 30 días." },
    ],
    sintesis:"E3 se consolida en 50% a través del hecho simbólico más significativo del período. Sin embargo, Rubio afirma que legitimación electoral es requisito para inversión. Foro Penal registra 568 presos vs 4.151 oficiales. Brecha cambiaria 52,6%. FMI clasifica a Venezuela en 'Intensa Fragilidad'.",
    actores:[
      { name:"EE.UU.", items:["Trump: 'nuevo amigo y socio' en Estado de la Unión","Enrique Márquez presente en hemiciclo","Rubio: legitimación electoral como requisito","80M barriles recibidos; asistencia médica entregada"] },
      { name:"Gobierno Interino", items:["Amnistía operativa: 4.203 solicitudes procesadas","Poder Ciudadano: renuncias Saab/Ruiz","3.231 libertades plenas en primer corte","Brecha cambiaria 52,6% preocupa"] },
      { name:"Oposición", items:["MCM +28 imagen neta","51,5% percibe país mejor sin Maduro","568 presos políticos verificados (Foro Penal)","Caso Magalli Meda: coerción paralela activa"] },
      { name:"Internacional", items:["Colombia activa canal Petro-Delcy (14 marzo)","España propone levantar sanciones UE","FMI: 'Intensa Fragilidad'","Tajani visita programada"] },
    ],
  },
  // S8: 27 febrero - 6 marzo (detailed - original SITREP_DATA)
  { period:"27 de febrero – 6 de marzo de 2026", periodShort:"27 feb–6 mar 2026",
    keyPoints:[
      { tag:"Diplomacia", color:"#0468B1", title:"Restablecimiento relaciones EE.UU.–Venezuela", text:"Estados Unidos y las autoridades interinas de Venezuela acuerdan restablecer relaciones diplomáticas y consulares, suspendidas desde 2019, abriendo un nuevo marco de cooperación política y económica." },
      { tag:"Energía", color:"#ca8a04", title:"Alza del petróleo por tensiones geopolíticas", text:"El crudo sube un 10% impulsado por el conflicto con Irán, con proyecciones de analistas que sitúan el barril en torno a USD 100. Venezuela posicionada en cuarto lugar de exportaciones petroleras a EE.UU." },
      { tag:"Oposición", color:"#16a34a", title:"María Corina Machado anuncia regreso", text:"MCM señala que retornará a Venezuela en las próximas semanas para trabajar en una transición \"ordenada, sostenible e indetenible\". Presenta agenda de tres prioridades para su movimiento." },
    ],
    sintesis:"E3 (40%) y E1 (38%) coexisten en equilibrio inestable — la distancia más estrecha del ciclo (2pp). El repunte energético récord (788 kbd, PIB +7,07%, SENIAT +78%) refuerza el anclaje transaccional. La presión política acumulada — MCM 106,84/137 pts, 66% exige elecciones, H.R. 7674 — acorta la distancia hacia una transición.",
    actores:[
      { name:"EE.UU.", items:["Restablecimiento relaciones diplomáticas y consulares","Trump: 'escenario perfecto' · Delcy 'presidenta electa'","Doug Burgum visita: agenda energética y minera","H.R. 7674: estrategia transición en 180 días","OFAC niega fondos para defensa de Cilia Flores"] },
      { name:"Gobierno Interino", items:["5.628 libertades plenas (245 privados + 5.383 cautelares)","31 militares excarcelados","PDVSA contratos con comercializadoras EE.UU.","Shell acuerdos exploración · Exxon equipo técnico","Paquete ~34 leyes · revisión Ley contra el Odio"] },
      { name:"Oposición", items:["MCM anuncia retorno con agenda 3 prioridades","MCM lidera 106,84/137 pts (MassBehaviorResearch)","Henry Ramos Allup respalda candidatura MCM","Enrique Márquez condiciona a garantías electorales","568 presos (Foro Penal) · >11.000 cautelares"] },
      { name:"Internacional", items:["España: solicitud UE levantar sanciones Delcy","Nahuel Gallo liberado tras 448 días","FMI: disposición si Venezuela solicita","Qatar PM Al-Thani visita Caracas","Gold Reserve: licencia temporal minería"] },
    ],
    // S8 has extra detailed data
    nacional: {
      amnistia: { solicitudes:9060, libertadesPlenas:5628, privadosLiberados:245, cautelares:5383, militares:31 },
      rodriguez: [
        { title:"Revisión de la Ley contra el Odio", text:"Rodríguez señaló que la normativa podría ser revisada, considerando que requiere ajustes en su aplicación y enfoque." },
        { title:"Paquete de ~34 leyes en proceso", text:"El Parlamento trabaja en un conjunto de leyes destinadas a acompañar la agenda de reformulación económica del Ejecutivo." },
        { title:"Reversión de la curva migratoria", text:"Por primera vez en 12 años, más venezolanos estarían considerando regresar al país que emigrar." },
        { title:"Diálogo político abierto", text:"Mantiene contactos con sectores opositores; el único límite al diálogo sería con quienes promuevan intervenciones extranjeras o violencia extrema." },
      ],
      allup: "Si en determinado momento la candidata tiene que ser María Corina, es María Corina, y haremos una campaña generosa y entregada para que sea la presidenta.",
      mcmAgenda: [
        "Fortalecer la unidad surgida de las primarias y las organizaciones sociales y políticas.",
        "Consolidar un Gran Acuerdo Nacional que garantice gobernabilidad durante una transición democrática.",
        "Prepararse para una nueva victoria electoral. MCM señala que regresará al país \"en las próximas semanas\".",
      ],
    },
    economia: {
      kpis: [
        { value:"+10%", label:"Alza del crudo por conflicto con Irán", color:"#ca8a04" },
        { value:"788 kb/d", label:"Exportaciones feb. (récord 7 años)", color:"#0468B1" },
        { value:"4.°", label:"Lugar ranking exportaciones a EE.UU.", color:"#16a34a" },
        { value:"+78%", label:"Recaudación SENIAT vs. enero", color:"#0468B1" },
      ],
      empresas: [
        { empresa:"Exxon", desarrollo:"Enviará equipo técnico a Venezuela para evaluar terreno." },
        { empresa:"Shell", desarrollo:"Firma acuerdos de exploración de petróleo y gas." },
        { empresa:"PDVSA", desarrollo:"Contratos con comercializadoras para mercado EE.UU." },
        { empresa:"American Airlines", desarrollo:"EE.UU. autoriza vuelos directos." },
      ],
    },
    escenarios: [
      { name:"Continuidad Negociada", prob:"40%", color:"#0468B1", text:"Expansión energética récord + marco OFAC consolidado + prioridad EE.UU. en recuperación económica." },
      { name:"Transición Política Pacífica", prob:"38%", color:"#2d8a30", text:"MCM 106,84/137 pts + 66% exige elecciones + H.R. 7674 + Ramos Allup respalda." },
      { name:"Fragmentación Institucional", prob:"12%", color:"#dc2626", text:"Contenida por expansión energética. Brecha cambiaria >50% y canasta inalcanzable persisten." },
      { name:"Resistencia Coercitiva", prob:"10%", color:"#ca8a04", text:"Latente. 568 presos + >11.000 cautelares + concentración territorial + tensiones FANB." },
    ],
    comentarios: [
      { tag:"Factor 1", color:"#16a34a", title:"Reconfiguración geopolítica acelerada", text:"El restablecimiento diplomático marca punto de inflexión. Trump usa Venezuela como 'escenario perfecto' para Irán — valor estratégico más allá de lo energético." },
      { tag:"Factor 2", color:"#ca8a04", title:"Tensión apertura económica vs. agenda política", text:"EE.UU. prioriza recuperación económica antes de reformas políticas. Genera ventana para gobierno interino pero frustración en sectores opositores." },
      { tag:"Factor 3", color:"#dc2626", title:"Fragilidad estructural persiste", text:"Salario USD 256 vs canasta USD 550. Inflación 174%. 69,5% bajo USD 300. Déficit servicios públicos. Principal vector de inestabilidad social." },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// TAB: SITREP
// ═══════════════════════════════════════════════════════════════

function TabSitrep({ liveData = {} }) {
  const mob = useIsMobile();
  const [sitrepWeek, setSitrepWeek] = useState(SITREP_ALL.length - 1);
  const d = SITREP_ALL[sitrepWeek];
  const isLatest = sitrepWeek === SITREP_ALL.length - 1;
  const hasDetail = !!d.nacional; // S8 has extra detail sections
  const [expandedSection, setExpandedSection] = useState(null);
  const [viewMode, setViewMode] = useState("informe"); // informe | briefing
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [dailyBrief, setDailyBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefProvider, setBriefProvider] = useState("");
  const [briefError, setBriefError] = useState("");

  const wk = WEEKS[sitrepWeek] || WEEKS[WEEKS.length - 1];

  // ── Daily Brief generator ──
  const generateDailyBrief = async () => {
    setBriefLoading(true); setBriefError(""); setDailyBrief("");
    const dom = wk.probs.reduce((a,b) => a.v > b.v ? a : b);
    const domSc = SCENARIOS.find(s=>s.id===dom.sc);
    const amnistia = AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 1];

    // Fetch fresh headlines from Google News RSS (3 dimensions)
    let newsPolitica = [], newsEconomia = [], newsInternacional = [];
    if (IS_DEPLOYED) {
      try {
        const headRes = await fetch("/api/gdelt?signal=headlines", { signal: AbortSignal.timeout(12000) });
        if (headRes.ok) {
          const h = await headRes.json();
          newsPolitica = (h.politica || []).filter(a => a.title?.length > 20).slice(0, 6);
          newsEconomia = (h.economia || []).filter(a => a.title?.length > 20).slice(0, 6);
          newsInternacional = (h.internacional || []).filter(a => a.title?.length > 20).slice(0, 6);
        }
      } catch {}
    }

    // RSS headlines as supplement
    const rssHeadlines = (liveData?.news || []).slice(0, 8).map(n => ({
      title: n.title || n.titulo || "", source: n.source || n.fuente || ""
    })).filter(n => n.title.length > 15);

    const fecha = new Date().toLocaleDateString("es", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

    const prompt = `Eres un analista senior del PNUD Venezuela. Genera un DAILY BRIEF para hoy ${fecha}.

═══ CONTEXTO ANALÍTICO ═══
Escenario dominante: ${domSc?.name} (E${dom.sc}) al ${dom.v}%
Escenarios: ${wk.probs.map(p => `E${p.sc}: ${p.v}%`).join(", ")}
${liveData?.dolar ? `Dólar BCV: ${liveData.dolar.bcv || "—"} Bs | Paralelo: ${liveData.dolar.paralelo || "—"} Bs | Brecha: ${liveData.dolar.brecha || "—"}%` : ""}
${liveData?.oil ? `Petróleo Brent: $${liveData.oil.brent || "—"} | WTI: $${liveData.oil.wti || "—"}` : ""}
${amnistia ? `Amnistía — Gobierno: ${amnistia.gob.libertades || amnistia.gob.excarcelados} libertades | Foro Penal: ${amnistia.fp.verificados} verificadas | Presos: ${amnistia.fp.detenidos}` : ""}
${wk.tensiones.filter(t=>t.l==="red").length > 0 ? `Tensiones rojas: ${wk.tensiones.filter(t=>t.l==="red").map(t=>t.t.replace(/<[^>]+>/g,"")).join("; ")}` : ""}

═══ NOTICIAS FRESCAS (últimas 24h) ═══

📌 POLÍTICA:
${newsPolitica.map(a => `• "${a.title}" [${a.source}]`).join("\n") || "Sin noticias recientes"}

📌 ECONOMÍA / ENERGÍA:
${newsEconomia.map(a => `• "${a.title}" [${a.source}]`).join("\n") || "Sin noticias recientes"}

📌 INTERNACIONAL / GEOPOLÍTICA:
${newsInternacional.map(a => `• "${a.title}" [${a.source}]`).join("\n") || "Sin noticias recientes"}

📌 RSS MONITOR PNUD (complementarias):
${rssHeadlines.map(a => `• "${a.title}" [${a.source}]`).join("\n") || "Sin noticias RSS"}

═══ INSTRUCCIONES ═══
1. Escribe 3-4 párrafos (250-350 palabras total), uno por dimensión:
   - POLÍTICO: Sintetiza las noticias políticas más relevantes. Conecta con el escenario dominante.
   - ECONÓMICO: Incluye datos de mercado (dólar, petróleo) y noticias económicas.
   - INTERNACIONAL: Sintetiza noticias geopolíticas y su impacto en Venezuela.
2. CITA las fuentes entre corchetes [Fuente] después de cada dato o hecho. Ejemplo: "El gobierno anunció nuevas medidas [Reuters]."
3. Usa SOLO las noticias proporcionadas. NO inventes hechos ni fuentes.
4. Ignora completamente titulares que no se relacionen con Venezuela.
5. Si no hay noticias en alguna dimensión, omite ese párrafo.
6. Tono: analítico, profesional, tipo cable diplomático. Sin bullet points.
7. Al final, una línea de cierre con la valoración general del día en relación al escenario dominante.`;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, max_tokens: 800 }),
        signal: AbortSignal.timeout(40000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.text) { setDailyBrief(data.text); setBriefProvider(data.provider || ""); }
        else { setBriefError("Respuesta vacía del proveedor de IA"); }
      } else {
        const errData = await res.json().catch(() => ({}));
        setBriefError(errData.error || `Error ${res.status}`);
      }
    } catch (e) {
      setBriefError(e.message || "Error de conexión");
    }
    setBriefLoading(false);
  };

  // ── AI Analysis generator ──
  const generateAiAnalysis = async () => {
    setAiLoading(true); setAiError(""); setAiAnalysis("");

    // ── PRIORITY 1: SITREP + WEEKS (core analysis) ──
    const weekData = {
      periodo: d.period,
      escenarios: wk.probs.map(p => { const sc = SCENARIOS.find(s=>s.id===p.sc); return { nombre:sc?.name, prob:p.v, tendencia:p.t }; }),
      tendencia: { escenario: SCENARIOS.find(s=>s.id===wk.trendSc)?.name, drivers: wk.trendDrivers },
      puntosClaveVen: d.keyPoints.map(kp => kp.title + ": " + kp.text),
      sintesis: d.sintesis,
      tensiones: wk.tensiones.map(t => t.t.replace(/<[^>]+>/g,"")),
      kpis: wk.kpis,
      semaforo: wk.sem,
      lecturaAnalitica: wk.lectura?.slice(0, 600) || "",
      actores: d.actores?.map(a => ({ nombre:a.name, items:a.items.slice(0,3) })) || [],
    };

    // ── PRIORITY 2: Indicadores y señales ──
    const lastIndicators = INDICATORS.map(ind => {
      const last = ind.hist.filter(h => h !== null).pop();
      if (!last) return null;
      return { dim:ind.dim, nombre:ind.name, semaforo:last[0], tendencia:last[1], valor:last[2], escenario:ind.esc, nuevo:!!ind.addedWeek };
    }).filter(Boolean);

    const signals = SCENARIO_SIGNALS.map(g => ({
      escenario: "E" + (SCENARIOS.find(s=>s.id===parseInt(g.esc.charAt(1)))?.id || g.esc),
      senales: g.signals.map(s => ({ nombre:s.name, estado:s.sem, valor:s.val, nuevo:!!s.isNew }))
    }));

    // ── PRIORITY 3: Amnistía ──
    const amnistia = AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 1];
    const amnistiaData = amnistia ? {
      gobierno: amnistia.gob,
      foroPenal: amnistia.fp,
      hito: amnistia.hito,
    } : null;

    // ── CONTEXT: Live data from shared state ──
    const liveContext = {};
    if (liveData?.dolar) liveContext.dolar = liveData.dolar;
    if (liveData?.oil) liveContext.petroleo = liveData.oil;
    if (liveData?.news?.length) liveContext.titulares = liveData.news;

    const prompt = `Eres un analista político-económico senior del PNUD especializado en Venezuela. Genera un análisis narrativo de contexto situacional de 5-6 párrafos para el período ${d.period}.

═══ DATOS PRINCIPALES DEL PERÍODO (prioridad máxima) ═══
${JSON.stringify(weekData, null, 2)}

═══ INDICADORES DEL MONITOR (28 indicadores, 4 dimensiones) ═══
${JSON.stringify(lastIndicators, null, 1)}

═══ SEÑALES POR ESCENARIO (32 señales activas) ═══
${JSON.stringify(signals, null, 1)}

═══ AMNISTÍA: GOBIERNO vs FORO PENAL ═══
${amnistiaData ? JSON.stringify(amnistiaData, null, 2) : "No disponible"}

═══ DATOS EN VIVO (mercados y contexto actual) ═══
${Object.keys(liveContext).length > 0 ? JSON.stringify(liveContext, null, 2) : "No disponible en este momento"}

═══ INSTRUCCIONES ═══
1. Escribe en español profesional, tono institucional PNUD, sin bullet points ni listas.
2. PRIORIZA los datos del SITREP (escenarios, síntesis, tensiones, actores) como eje narrativo.
3. USA los indicadores y señales para enriquecer el análisis con datos duros y tendencias.
4. Si hay DATOS EN VIVO disponibles (dólar, petróleo, titulares), incorpóralos como contexto de mercado actual. IMPORTANTE: de los titulares de noticias, usa SOLO los que se refieran directamente a Venezuela o que tengan relación con el contexto venezolano. Ignora titulares sobre otros países o temas no relacionados.
5. Estructura:
   - Párrafo 1: Panorama general — escenario dominante, probabilidades, tendencia y drivers principales.
   - Párrafo 2: Dinámica energética y económica — exportaciones, petróleo, PIB, recaudación, brecha cambiaria. Usa indicadores de las dimensiones Energético y Económico. Si hay datos en vivo de petróleo o dólar, menciónalos como contexto de mercado.
   - Párrafo 3: Dinámica política interna y DDHH — amnistía (contrasta cifras gobierno vs Foro Penal), presos políticos, cautelares, FANB, marcos restrictivos.
   - Párrafo 4: Factores internacionales — cooperación EE.UU., sanciones UE, FMI, normalización diplomática. Usa señales de E3 y E1.
   - Párrafo 5: Presiones y riesgos — tensiones activas, señales de E4 y E2, indicadores en rojo.
   - Párrafo 6: Perspectiva de corto plazo — variables críticas a monitorear, escenarios con mayor probabilidad de movimiento. Si hay titulares de noticias en vivo relacionados con Venezuela, úsalos para contextualizar la coyuntura inmediata.
6. Sé específico con cifras, nombres propios y datos del período. Menciona indicadores NUEVOS si los hay.
7. NO inventes datos. Usa EXCLUSIVAMENTE la información proporcionada.
8. Extensión: 500-700 palabras.`;

    try {
      let text = "";
      if (IS_DEPLOYED) {
        // On Vercel: use serverless proxy (Gemini free → Claude fallback)
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, max_tokens: 2000 }),
          signal: AbortSignal.timeout(40000),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `API error: ${res.status}`);
        }
        const data = await res.json();
        text = data.text || "Sin respuesta.";
        if (data.provider) text = `[${data.provider}]\n\n` + text;
      } else {
        // In Claude.ai artifact: direct call (API key injected by environment)
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2000,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        text = data.content?.map(c => c.text || "").join("\n") || "Sin respuesta.";
      }
      setAiAnalysis(text);
    } catch (err) {
      setAiError(err.message || "Error al generar análisis");
    } finally { setAiLoading(false); }
  };

// ── Document generator ──
  const generateDocument = (mode = "html") => {
  const generateDocument = async (mode = "html") => {
    const escRows = wk.probs.map(p => {
      const sc = SCENARIOS.find(s=>s.id===p.sc);
      return `<tr><td style="padding:8px;border-bottom:1px solid #d0d7e0;font-weight:600;color:${sc?.color}">${sc?.name}</td><td style="padding:8px;border-bottom:1px solid #d0d7e0;text-align:center;font-size:18px;font-weight:700;color:${sc?.color}">${p.v}%</td><td style="padding:8px;border-bottom:1px solid #d0d7e0;color:#5a6a7a">${{up:"↑ Subiendo",down:"↓ Bajando",flat:"→ Estable"}[p.t]}</td></tr>`;
    }).join("");
    const kpCards = d.keyPoints.map(kp => `<div style="flex:1;min-width:200px;border-left:3px solid ${kp.color};padding:12px 16px;background:#f8fafc"><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:${kp.color};margin-bottom:4px">${kp.tag}</div><div style="font-weight:600;margin-bottom:6px">${kp.title}</div><div style="font-size:13px;color:#5a6a7a;line-height:1.5">${kp.text}</div></div>`).join("");
    const tensionRows = wk.tensiones.map(t => {
      const colors = {green:"#16a34a",yellow:"#ca8a04",red:"#dc2626"};
      return `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #eef1f5"><span style="width:8px;height:8px;border-radius:50%;background:${colors[t.l]};margin-top:5px;flex-shrink:0"></span><span style="font-size:13px;color:#3d4f5f;line-height:1.5">${t.t}</span></div>`;
    }).join("");
    const actorBlocks = d.actores.map(a => `<div style="margin-bottom:16px"><div style="font-weight:700;font-size:14px;margin-bottom:6px;color:#0468B1">${a.name}</div>${a.items.map(item=>`<div style="font-size:12px;color:#5a6a7a;padding:3px 0 3px 10px;border-left:2px solid #eef1f5;line-height:1.4">· ${item}</div>`).join("")}</div>`).join("");

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>SITREP — ${d.period}</title><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;color:#1a202c;line-height:1.6;background:#fff}@media print{body{font-size:11px}.no-print{display:none!important}}</style></head><body>
<div style="background:linear-gradient(135deg,#0468B1,#009edb);padding:20px 32px;color:#fff">
<div style="font-family:'Space Mono',monospace;font-size:10px;letter-spacing:0.2em;opacity:0.7;text-transform:uppercase;margin-bottom:4px">PNUD Venezuela · Análisis de Contexto Situacional</div>
<div style="font-size:22px;font-weight:700">SITREP Semanal</div>
<div style="font-family:'Space Mono',monospace;font-size:11px;margin-top:4px;opacity:0.8">${d.period}</div>
</div>
<div style="max-width:900px;margin:0 auto;padding:32px">
<h2 style="font-size:16px;color:#0468B1;border-bottom:2px solid #0468B1;padding-bottom:6px;margin-bottom:16px">Puntos Clave del Período</h2>
<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:32px">${kpCards}</div>
<h2 style="font-size:16px;color:#0468B1;border-bottom:2px solid #0468B1;padding-bottom:6px;margin-bottom:16px">Escenarios — Probabilidades</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:32px"><thead><tr style="border-bottom:2px solid #0468B1"><th style="text-align:left;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6a7a">Escenario</th><th style="text-align:center;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6a7a">Prob.</th><th style="text-align:left;padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6a7a">Tendencia</th></tr></thead><tbody>${escRows}</tbody></table>
<h2 style="font-size:16px;color:#0468B1;border-bottom:2px solid #0468B1;padding-bottom:6px;margin-bottom:16px">Síntesis</h2>
<div style="font-size:14px;color:#3d4f5f;line-height:1.75;margin-bottom:32px;padding:16px;background:#f8fafc;border-left:3px solid #0468B1">${d.sintesis}</div>
<h2 style="font-size:16px;color:#0468B1;border-bottom:2px solid #0468B1;padding-bottom:6px;margin-bottom:16px">Semáforo de Tensiones</h2>
<div style="margin-bottom:32px">${tensionRows}</div>
<h2 style="font-size:16px;color:#0468B1;border-bottom:2px solid #0468B1;padding-bottom:6px;margin-bottom:16px">Dinámicas por Actor</h2>
<div style="margin-bottom:32px">${actorBlocks}</div>
${aiAnalysis ? `<h2 style="font-size:16px;color:#0468B1;border-bottom:2px solid #0468B1;padding-bottom:6px;margin-bottom:16px">Análisis Narrativo (IA)</h2><div style="font-size:14px;color:#3d4f5f;line-height:1.75;margin-bottom:32px;white-space:pre-wrap">${aiAnalysis}</div>` : ""}
<div style="text-align:center;font-family:'Space Mono',monospace;font-size:10px;color:#5a6a7a80;padding:24px 0;letter-spacing:0.1em;text-transform:uppercase;border-top:1px solid #d0d7e0;margin-top:32px">PNUD Venezuela · Monitor de Contexto Situacional · ${d.periodShort} · Uso interno</div>
</div></body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    if (mode === "pdf") {
      // Open in new window and trigger print (save as PDF)
      const win = window.open(url, "_blank");
      if (win) {
        win.addEventListener("load", () => {
          setTimeout(() => win.print(), 500);
      const sanitize = (text = "") => text
        .toString()
        .replace(/<[^>]*>/g, " ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/[–—]/g, "-")
        .replace(/[^\x20-\x7E\n]/g, " ")
        .replace(/[()\\]/g, "\\$&")
        .replace(/\s+/g, " ")
        .trim();
      const wrapLine = (text, maxChars = 92) => {
        const words = sanitize(text).split(" ");
        const lines = [];
        let line = "";
        words.forEach((word) => {
          if (!word) return;
          const next = line ? `${line} ${word}` : word;
          if (next.length <= maxChars) {
            line = next;
          } else {
            if (line) lines.push(line);
            line = word;
          }
        });
        if (line) lines.push(line);
        return lines;
      };

      const contentLines = [
        "SITREP Semanal",
        d.period,
        "",
        "Puntos Clave del Periodo",
        ...d.keyPoints.flatMap((kp) => wrapLine(`${kp.tag}: ${kp.title}. ${kp.text}`)),
        "",
        "Escenarios - Probabilidades",
        ...wk.probs.flatMap((p) => {
          const sc = SCENARIOS.find((s) => s.id === p.sc);
          const trend = { up: "Subiendo", down: "Bajando", flat: "Estable" }[p.t];
          return wrapLine(`${sc?.name || "Escenario"}: ${p.v}% (${trend})`);
        }),
        "",
        "Sintesis",
        ...wrapLine(d.sintesis),
        "",
        "Semaforo de Tensiones",
        ...wk.tensiones.flatMap((t) => wrapLine(`- ${t.t}`)),
        "",
        "Dinamicas por Actor",
        ...d.actores.flatMap((a) => [a.name, ...a.items.map((item) => `- ${item}`)]).flatMap((line) => wrapLine(line)),
      ];

      if (aiAnalysis) {
        contentLines.push("", "Analisis Narrativo (IA)", ...wrapLine(aiAnalysis));
      }

      const linesPerPage = 44;
      const pages = [];
      for (let i = 0; i < contentLines.length; i += linesPerPage) {
        pages.push(contentLines.slice(i, i + linesPerPage));
      }

      let objectNumber = 1;
      const objects = [];
      const pageObjects = [];

      const fontObj = objectNumber++;
      objects.push({ id: fontObj, body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" });

      const contentObjIds = pages.map(() => objectNumber++);
      const pageObjIds = pages.map(() => objectNumber++);
      const pagesObj = objectNumber++;
      const catalogObj = objectNumber++;

      pages.forEach((page, idx) => {
        const textOps = ["BT", "/F1 11 Tf", "50 792 Td", "14 TL"];
        page.forEach((line, lineIdx) => {
          const safeLine = sanitize(line);
          if (lineIdx === 0) textOps.push(`(${safeLine}) Tj`);
          else textOps.push(`T* (${safeLine}) Tj`);
        });
        textOps.push("ET");
        const stream = textOps.join("\n");
        objects.push({
          id: contentObjIds[idx],
          body: `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
        });
      });

      pageObjIds.forEach((id, idx) => {
        const body = `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentObjIds[idx]} 0 R >>`;
        objects.push({ id, body });
        pageObjects.push(`${id} 0 R`);
      });

      objects.push({ id: pagesObj, body: `<< /Type /Pages /Kids [${pageObjects.join(" ")}] /Count ${pageObjIds.length} >>` });
      objects.push({ id: catalogObj, body: `<< /Type /Catalog /Pages ${pagesObj} 0 R >>` });

      objects.sort((a, b) => a.id - b.id);

      let pdfContent = "%PDF-1.4\n";
      const offsets = [0];
      objects.forEach((obj) => {
        offsets[obj.id] = pdfContent.length;
        pdfContent += `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
      });
      const xrefOffset = pdfContent.length;
      pdfContent += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
      for (let i = 1; i <= objects.length; i += 1) {
        const off = String(offsets[i] || 0).padStart(10, "0");
        pdfContent += `${off} 00000 n \n`;
      }
      pdfContent += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

      const pdfBlob = new Blob([pdfContent], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = `SITREP_${d.periodShort.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(pdfUrl);
    } else {
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `SITREP_${d.periodShort.replace(/[^a-zA-Z0-9]/g,"_")}.html`;
      a.click(); URL.revokeObjectURL(url);
    }
  };

  const toggle = (id) => setExpandedSection(prev => prev === id ? null : id);

  const cardStyle = {
    background: BG2, border:`1px solid ${BORDER}`, padding: mob?14:20,
    marginBottom: mob?8:12, transition:"all 0.2s",
  };
  const tagStyle = (color) => ({
    display:"inline-block", fontSize:9, fontFamily:font, letterSpacing:"0.12em",
    textTransform:"uppercase", padding:"2px 8px", background:`${color}14`,
    color, border:`1px solid ${color}28`, marginBottom:8,
  });
  const sectionHeaderStyle = {
    display:"flex", alignItems:"center", gap:mob?8:12, cursor:"pointer",
    padding:mob?"12px 0":"16px 0", userSelect:"none",
  };
  const sectionNumStyle = {
    fontFamily:font, fontSize:mob?10:11, color:ACCENT, letterSpacing:"0.15em",
    opacity:0.5, minWidth:mob?24:30,
  };
  const sectionTitleStyle = {
    fontFamily:fontSans, fontSize:mob?15:18, fontWeight:600, color:TEXT,
    flex:1,
  };
  const chevronStyle = (open) => ({
    fontSize:mob?12:14, color:MUTED, transition:"transform 0.2s",
    transform: open ? "rotate(180deg)" : "rotate(0deg)",
  });
  const gridStyle = (cols) => ({
    display:"grid", gridTemplateColumns:mob?"1fr":`repeat(${cols}, 1fr)`,
    gap:mob?8:12,
  });
  const timelineItemStyle = {
    padding:"10px 0", borderBottom:`1px solid ${BORDER}40`,
  };
  const tlTitleStyle = {
    fontFamily:fontSans, fontSize:mob?12:13, fontWeight:600, color:TEXT,
    marginBottom:4,
  };
  const tlBodyStyle = {
    fontFamily:fontSans, fontSize:mob?11:12.5, color:MUTED, lineHeight:1.55,
  };

  const Section = ({ num, title, id, children, defaultOpen }) => {
    const isOpen = expandedSection === id || (expandedSection === null && defaultOpen);
    return (
      <div style={{ borderBottom:`1px solid ${BORDER}40` }}>
        <div style={sectionHeaderStyle} onClick={() => toggle(id)}>
          <span style={sectionNumStyle}>{num}</span>
          <span style={sectionTitleStyle}>{title}</span>
          <span style={chevronStyle(isOpen)}>▼</span>
        </div>
        {isOpen && <div style={{ paddingBottom:mob?16:24 }}>{children}</div>}
      </div>
    );
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ background:`linear-gradient(135deg, ${ACCENT} 0%, #009edb 100%)`, padding:mob?"16px 14px":"20px 24px",
        marginBottom:mob?16:24, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div>
          <div style={{ fontFamily:font, fontSize:mob?9:10, letterSpacing:"0.2em", color:"rgba(255,255,255,0.7)", textTransform:"uppercase", marginBottom:4 }}>
            PNUD Venezuela · Análisis de Contexto Situacional
          </div>
          <div style={{ fontFamily:fontSans, fontSize:mob?16:22, fontWeight:700, color:"#fff" }}>
            SITREP Semanal
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {isLatest && <span style={{ fontSize:9, fontFamily:font, letterSpacing:"0.1em", background:"rgba(255,255,255,0.2)", color:"#fff", padding:"2px 8px", textTransform:"uppercase" }}>Más reciente</span>}
          <select value={sitrepWeek} onChange={e => { setSitrepWeek(+e.target.value); setExpandedSection(null); }}
            style={{ fontFamily:font, fontSize:mob?10:12, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", color:"#fff",
              padding:mob?"4px 22px 4px 6px":"5px 28px 5px 10px", cursor:"pointer", outline:"none",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='white'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 6px center" }}>
            {SITREP_ALL.map((s, i) => <option key={i} value={i} style={{ color:TEXT, background:BG2 }}>{s.periodShort}</option>)}
          </select>
        </div>
      </div>

      {/* TOOLBAR: Mode toggle + Actions */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:mob?12:16, flexWrap:"wrap" }}>
        {/* View mode toggle */}
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}` }}>
          {[{id:"informe",label:"📄 Informe"},{id:"briefing",label:"📌 Briefing"}].map(m => (
            <button key={m.id} onClick={() => setViewMode(m.id)}
              style={{ fontSize:mob?10:12, fontFamily:font, padding:mob?"5px 10px":"6px 14px", border:"none",
                background:viewMode===m.id?ACCENT:"transparent", color:viewMode===m.id?"#fff":MUTED,
                cursor:"pointer", letterSpacing:"0.06em", transition:"all 0.15s" }}>
              {m.label}
            </button>
          ))}
        </div>
        <div style={{ flex:1 }} />
        {/* Action buttons */}
        <button onClick={generateDailyBrief} disabled={briefLoading}
          style={{ fontSize:mob?10:11, fontFamily:font, padding:mob?"5px 10px":"6px 14px",
            background:briefLoading?BG3:`linear-gradient(135deg, #0e7490, #0891b2)`, color:briefLoading?MUTED:"#fff",
            border:"none", cursor:briefLoading?"wait":"pointer", letterSpacing:"0.06em", transition:"all 0.15s" }}>
          {briefLoading ? "⏳ Buscando..." : "📰 Daily Brief"}
        </button>
        <button onClick={generateAiAnalysis} disabled={aiLoading}
          style={{ fontSize:mob?10:11, fontFamily:font, padding:mob?"5px 10px":"6px 14px",
            background:aiLoading?BG3:`linear-gradient(135deg, #8b5cf6, #6d28d9)`, color:aiLoading?MUTED:"#fff",
            border:"none", cursor:aiLoading?"wait":"pointer", letterSpacing:"0.06em", transition:"all 0.15s" }}>
          {aiLoading ? "⏳ Generando..." : "🤖 Análisis IA"}
        </button>
        <button onClick={generateDocument}
          style={{ fontSize:mob?10:11, fontFamily:font, padding:mob?"5px 10px":"6px 14px",
            background:ACCENT, color:"#fff", border:"none", cursor:"pointer", letterSpacing:"0.06em" }}>
          📥 HTML
        </button>
        <button onClick={() => {
          generateDocument("pdf");
        }}
          style={{ fontSize:mob?10:11, fontFamily:font, padding:mob?"5px 10px":"6px 14px",
            background:"#dc2626", color:"#fff", border:"none", cursor:"pointer", letterSpacing:"0.06em" }}>
          📄 PDF
        </button>
      </div>

      {/* ═══ DAILY BRIEF DISPLAY ═══ */}
      {(dailyBrief || briefLoading || briefError) && (
        <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:mob?12:16, marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:dailyBrief?10:0, flexWrap:"wrap" }}>
            <span style={{ fontSize:14 }}>📰</span>
            <div style={{ fontSize:10, fontFamily:font, letterSpacing:"0.12em", textTransform:"uppercase", color:"#0e7490" }}>Daily Brief</div>
            {dailyBrief && (
              <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>
                {new Date().toLocaleString("es", { hour:"2-digit", minute:"2-digit" })} · hoy
              </span>
            )}
            {briefProvider && (() => {
              const bc = briefProvider.includes("mistral") ? "#ff6f00" : briefProvider.includes("gemini") ? "#4285f4" : briefProvider.includes("groq")||briefProvider.includes("llama") ? "#f97316" : briefProvider.includes("openrouter")||briefProvider.includes("free") ? "#06b6d4" : "#8b5cf6";
              const bl = briefProvider.includes("mistral") ? "MISTRAL" : briefProvider.includes("gemini") ? "GEMINI" : briefProvider.includes("groq")||briefProvider.includes("llama") ? "GROQ" : briefProvider.includes("openrouter")||briefProvider.includes("free") ? "OPENROUTER" : "CLAUDE";
              return <span style={{ fontSize:7, fontFamily:font, padding:"1px 5px", background:`${bc}15`, color:bc, border:`1px solid ${bc}30`, letterSpacing:"0.08em" }}>{bl}</span>;
            })()}
            {briefLoading && <span style={{ fontSize:10, fontFamily:font, color:MUTED, animation:"pulse 1.5s infinite" }}>Buscando noticias y generando brief...</span>}
          </div>
          {briefError && (
            <div style={{ fontSize:12, fontFamily:font, color:"#dc2626", marginTop:6 }}>Error: {briefError}</div>
          )}
          {dailyBrief && (
            <div style={{ fontSize:mob?12:13, fontFamily:fontSans, color:TEXT, lineHeight:1.7 }}
              dangerouslySetInnerHTML={{ __html: dailyBrief
                .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.+?)\*/g, "<em>$1</em>")
                .replace(/\[([^\]]+)\]/g, '<span style="color:#0e7490;font-size:11px;font-family:\'Space Mono\',monospace">[$1]</span>')
                .replace(/\n/g, "<br/>")
              }} />
          )}
        </div>
      )}

      {/* ═══ BRIEFING VIEW ═══ */}
      {viewMode === "briefing" && (
        <div>
          {/* Briefing: One-page consolidated view */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"2fr 1fr", gap:mob?10:14 }}>
            {/* Left column */}
            <div>
              {/* Scenario probabilities */}
              <div style={{ ...cardStyle, marginBottom:mob?10:14 }}>
                <div style={{ fontSize:11, fontFamily:font, color:ACCENT, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>Escenarios — {d.periodShort}</div>
                {wk.probs.map(p => {
                  const sc = SCENARIOS.find(s=>s.id===p.sc);
                  return (
                    <div key={p.sc} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <span style={{ fontSize:12, fontFamily:font, color:sc.color, width:20, fontWeight:700 }}>E{sc.id}</span>
                      <div style={{ flex:1, height:8, background:BG3, borderRadius:3 }}>
                        <div style={{ height:8, background:sc.color, width:`${p.v}%`, borderRadius:3, transition:"width 0.4s" }} />
                      </div>
                      <span style={{ fontSize:14, fontFamily:font, color:sc.color, fontWeight:700, width:36, textAlign:"right" }}>{p.v}%</span>
                      <span style={{ fontSize:11, color:p.t==="up"?"#22c55e":p.t==="down"?"#ef4444":MUTED }}>
                        {{up:"↑",down:"↓",flat:"→"}[p.t]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Key Points */}
              {d.keyPoints.map((kp, i) => (
                <div key={i} style={{ ...cardStyle, borderLeft:`3px solid ${kp.color}`, marginBottom:mob?6:8, padding:mob?10:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:8, fontFamily:font, letterSpacing:"0.12em", textTransform:"uppercase", padding:"1px 6px",
                      background:`${kp.color}14`, color:kp.color, border:`1px solid ${kp.color}28` }}>{kp.tag}</span>
                    <span style={{ fontSize:mob?12:13, fontWeight:600, color:TEXT }}>{kp.title}</span>
                  </div>
                  <div style={{ fontSize:mob?11:12, color:MUTED, lineHeight:1.5 }}>{kp.text}</div>
                </div>
              ))}
            </div>

            {/* Right column */}
            <div>
              {/* Semáforo de tensiones */}
              <div style={{ ...cardStyle, marginBottom:mob?10:14 }}>
                <div style={{ fontSize:11, fontFamily:font, color:ACCENT, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Semáforo</div>
                <div style={{ display:"flex", gap:12, marginBottom:10 }}>
                  {[{l:"Verde",c:SEM.green,n:wk.sem.g},{l:"Amarillo",c:SEM.yellow,n:wk.sem.y},{l:"Rojo",c:SEM.red,n:wk.sem.r}].map((s,i) => (
                    <div key={i} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:18, fontWeight:800, color:s.c }}>{s.n}</div>
                      <div style={{ fontSize:9, fontFamily:font, color:MUTED }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                {wk.tensiones.map((t,i) => (
                  <div key={i} style={{ display:"flex", gap:6, padding:"4px 0", borderBottom:i<wk.tensiones.length-1?`1px solid ${BORDER}30`:"none", alignItems:"flex-start" }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:SEM[t.l], marginTop:5, flexShrink:0 }} />
                    <div style={{ fontSize:11, color:MUTED, lineHeight:1.4 }} dangerouslySetInnerHTML={{__html:t.t}} />
                  </div>
                ))}
              </div>

              {/* Tendencia */}
              <div style={{ ...cardStyle, marginBottom:mob?10:14, background:`${SCENARIOS.find(s=>s.id===wk.trendSc)?.color}08`,
                borderLeft:`3px solid ${SCENARIOS.find(s=>s.id===wk.trendSc)?.color}` }}>
                <div style={{ fontSize:11, fontFamily:font, color:SCENARIOS.find(s=>s.id===wk.trendSc)?.color, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>
                  Tendencia → E{wk.trendSc}
                </div>
                {wk.trendDrivers.map((dr,i) => (
                  <div key={i} style={{ fontSize:11, color:TEXT, lineHeight:1.5, padding:"2px 0" }}>› {dr}</div>
                ))}
              </div>

              {/* Actors compact */}
              <div style={cardStyle}>
                <div style={{ fontSize:11, fontFamily:font, color:ACCENT, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Actores</div>
                {d.actores.map((a,i) => (
                  <div key={i} style={{ marginBottom:i<d.actores.length-1?10:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:TEXT, marginBottom:3 }}>{a.name}</div>
                    {a.items.slice(0,2).map((item,j) => (
                      <div key={j} style={{ fontSize:10, color:MUTED, lineHeight:1.4, paddingLeft:8, borderLeft:`2px solid ${BG3}` }}>· {item}</div>
                    ))}
                    {a.items.length > 2 && <div style={{ fontSize:9, color:`${MUTED}80`, paddingLeft:8 }}>+{a.items.length-2} más</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Síntesis */}
          <div style={{ ...cardStyle, marginTop:mob?10:14, borderLeft:`3px solid ${ACCENT}` }}>
            <div style={{ fontSize:11, fontFamily:font, color:ACCENT, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Síntesis del período</div>
            <div style={{ fontSize:mob?12:13, color:TEXT, lineHeight:1.7 }}>{d.sintesis}</div>
          </div>

          {/* AI Analysis if generated */}
          {aiAnalysis && (() => {
            const providerMatch = aiAnalysis.match(/^\[([^\]]+)\]\n\n/);
            const provider = providerMatch ? providerMatch[1] : "claude";
            const displayText = providerMatch ? aiAnalysis.slice(providerMatch[0].length) : aiAnalysis;
            const badgeColor = provider.includes("mistral") ? "#ff6f00" : provider.includes("gemini") ? "#4285f4" : provider.includes("groq")||provider.includes("llama") ? "#f97316" : provider.includes("openrouter")||provider.includes("free") ? "#06b6d4" : provider.includes("hugging")||provider.includes("qwen")||provider.includes("hf") ? "#ffbf00" : "#8b5cf6";
            const badgeLabel = provider.includes("mistral") ? "MISTRAL" : provider.includes("gemini") ? "GEMINI" : provider.includes("groq")||provider.includes("llama") ? "GROQ" : provider.includes("openrouter")||provider.includes("free") ? "OPENROUTER" : provider.includes("hugging")||provider.includes("qwen")||provider.includes("hf") ? "HUGGINGFACE" : "CLAUDE";
            return (
              <div style={{ ...cardStyle, marginTop:mob?10:14, borderLeft:`3px solid ${badgeColor}`, background:`${badgeColor}08` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <span style={{ fontSize:11, fontFamily:font, color:badgeColor, letterSpacing:"0.12em", textTransform:"uppercase" }}>Análisis narrativo · IA</span>
                  <span style={{ fontSize:8, fontFamily:font, padding:"1px 6px", background:`${badgeColor}18`, color:badgeColor, border:`1px solid ${badgeColor}30` }}>{badgeLabel}</span>
                </div>
                <div style={{ fontSize:mob?12:13, color:TEXT, lineHeight:1.75, whiteSpace:"pre-wrap" }}>{displayText}</div>
              </div>
            );
          })()}
          {aiError && <div style={{ ...cardStyle, marginTop:8, color:"#dc2626", fontSize:12 }}>Error: {aiError}</div>}
        </div>
      )}

      {/* ═══ INFORME VIEW (original) ═══ */}
      {viewMode === "informe" && <>

      {/* SECTION 00: KEY POINTS */}
      <Section num="00" title="Puntos Clave del Período" id="keypoints" defaultOpen>
        <div style={gridStyle(3)}>
          {d.keyPoints.map((kp, i) => (
            <div key={i} style={{ ...cardStyle, borderLeft:`3px solid ${kp.color}` }}>
              <div style={tagStyle(kp.color)}>{kp.tag}</div>
              <div style={{ fontFamily:fontSans, fontSize:mob?13:14, fontWeight:600, color:TEXT, marginBottom:8 }}>{kp.title}</div>
              <div style={{ fontFamily:fontSans, fontSize:mob?11:12.5, color:MUTED, lineHeight:1.55 }}>{kp.text}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* SECTION 01: SÍNTESIS */}
      <Section num="01" title="Síntesis del Período" id="sintesis" defaultOpen={!hasDetail}>
        <div style={{ ...cardStyle, borderLeft:`3px solid ${ACCENT}` }}>
          <div style={{ fontFamily:fontSans, fontSize:mob?13:14, color:TEXT, lineHeight:1.7 }}>{d.sintesis}</div>
        </div>
      </Section>

      {/* SECTION 02: DINÁMICAS POR ACTOR */}
      <Section num="02" title="Dinámicas por Actor" id="actores">
        <div style={gridStyle(2)}>
          {d.actores.map((actor, i) => (
            <div key={i} style={{ ...cardStyle, borderLeft:`3px solid ${["#0468B1","#16a34a","#ca8a04","#dc2626"][i%4]}` }}>
              <div style={{ fontFamily:fontSans, fontSize:mob?13:15, fontWeight:700, color:TEXT }}>{actor.name}</div>
              {actor.items.map((item, j) => (
                <div key={j} style={{ padding:"5px 0", borderBottom: j === actor.items.length-1 ? "none" : `1px solid ${BORDER}30` }}>
                  <div style={{ fontFamily:fontSans, fontSize:mob?11:12, color:MUTED, lineHeight:1.5,
                    paddingLeft:10, borderLeft:`2px solid ${BG3}` }}>{item}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* SECTION 03: DETAIL SECTIONS (S8 only) */}
      {hasDetail && d.nacional && (
        <Section num="03" title="Dinámica Nacional — Detalle" id="nacional">
          <div style={gridStyle(2)}>
            <div style={cardStyle}>
              <div style={tagStyle("#0468B1")}>Ley de Amnistía</div>
              <div style={{ fontFamily:fontSans, fontSize:mob?13:14, fontWeight:600, color:TEXT, marginBottom:12 }}>Balance Comisión de Seguimiento</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { v:d.nacional.amnistia.solicitudes.toLocaleString(), l:"Solicitudes recibidas", c:ACCENT },
                  { v:d.nacional.amnistia.libertadesPlenas.toLocaleString(), l:"Libertades plenas", c:"#16a34a" },
                  { v:d.nacional.amnistia.privadosLiberados, l:"Privados liberados", c:TEXT },
                  { v:d.nacional.amnistia.cautelares.toLocaleString(), l:"Con cautelares", c:TEXT },
                ].map((item, i) => (
                  <div key={i} style={{ background:BG3, padding:mob?10:14, textAlign:"center" }}>
                    <div style={{ fontFamily:fontSans, fontSize:mob?22:28, fontWeight:700, color:item.c }}>{item.v}</div>
                    <div style={{ fontFamily:font, fontSize:mob?8:9, letterSpacing:"0.08em", color:MUTED, textTransform:"uppercase", marginTop:4 }}>{item.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily:fontSans, fontSize:mob?10:11, color:MUTED, marginTop:10 }}>
                Excarcelación de <strong style={{ color:TEXT }}>{d.nacional.amnistia.militares} militares</strong> en el marco de la amnistía.
              </div>
            </div>
            <div style={cardStyle}>
              <div style={tagStyle(ACCENT)}>Asamblea Nacional — Jorge Rodríguez</div>
              {d.nacional.rodriguez.map((item, i) => (
                <div key={i} style={{ ...timelineItemStyle, borderBottom: i === d.nacional.rodriguez.length-1 ? "none" : `1px solid ${BORDER}40` }}>
                  <div style={tlTitleStyle}>{item.title}</div>
                  <div style={tlBodyStyle}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>
          {d.nacional.allup && (
            <div style={{ ...cardStyle, marginTop:mob?8:12, borderLeft:`3px solid #ca8a04` }}>
              <div style={{ fontFamily:fontSans, fontSize:mob?13:15, fontStyle:"italic", color:TEXT, lineHeight:1.6, padding:mob?"6px 8px":"8px 12px" }}>
                "{d.nacional.allup}"
                <div style={{ fontFamily:font, fontSize:mob?9:10, color:MUTED, marginTop:6, fontStyle:"normal" }}>— Henry Ramos Allup, AD "en resistencia"</div>
              </div>
            </div>
          )}
          {d.nacional.mcmAgenda && (
            <div style={{ ...cardStyle, marginTop:mob?8:12 }}>
              <div style={tagStyle("#16a34a")}>MCM — Agenda de tres prioridades</div>
              {d.nacional.mcmAgenda.map((item, i) => (
                <div key={i} style={{ ...timelineItemStyle, borderBottom: i === d.nacional.mcmAgenda.length-1 ? "none" : `1px solid ${BORDER}40` }}>
                  <div style={{ fontFamily:font, fontSize:9, color:ACCENT, letterSpacing:"0.1em", marginBottom:4 }}>PRIORIDAD {i+1}</div>
                  <div style={tlBodyStyle}>{item}</div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* SECTION 04: ECONOMÍA (S8 only) */}
      {hasDetail && d.economia && (
        <Section num="04" title="Economía y Petróleo" id="economia">
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr 1fr":`repeat(4, 1fr)`, gap:mob?8:12, marginBottom:mob?12:16 }}>
            {d.economia.kpis.map((kpi, i) => (
              <div key={i} style={{ ...cardStyle, textAlign:"center" }}>
                <div style={{ fontFamily:fontSans, fontSize:mob?22:28, fontWeight:700, color:kpi.color }}>{kpi.value}</div>
                <div style={{ fontFamily:font, fontSize:mob?8:9, letterSpacing:"0.08em", color:MUTED, textTransform:"uppercase", marginTop:6 }}>{kpi.label}</div>
              </div>
            ))}
          </div>
          {d.economia.empresas && (
            <div style={cardStyle}>
              <div style={tagStyle(ACCENT)}>Inversión Internacional</div>
              <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:fontSans, fontSize:mob?11:12 }}>
                <thead>
                  <tr style={{ borderBottom:`2px solid ${BORDER}` }}>
                    <th style={{ textAlign:"left", padding:"6px 8px", color:MUTED, fontWeight:500, fontSize:mob?9:10, letterSpacing:"0.1em", textTransform:"uppercase" }}>Empresa</th>
                    <th style={{ textAlign:"left", padding:"6px 8px", color:MUTED, fontWeight:500, fontSize:mob?9:10, letterSpacing:"0.1em", textTransform:"uppercase" }}>Desarrollo</th>
                  </tr>
                </thead>
                <tbody>
                  {d.economia.empresas.map((e, i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${BORDER}40` }}>
                      <td style={{ padding:"8px", color:TEXT, fontWeight:600, whiteSpace:"nowrap" }}>{e.empresa}</td>
                      <td style={{ padding:"8px", color:MUTED }}>{e.desarrollo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {/* SECTION 05: ESCENARIOS (S8 only) */}
      {hasDetail && d.escenarios && (
        <Section num="05" title="Escenarios Proyectados" id="escenarios">
          {d.escenarios.map((esc, i) => (
            <div key={i} style={{ ...cardStyle, marginBottom:mob?10:14, display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:fontSans, fontSize:mob?14:16, fontWeight:700, color:esc.color }}>{esc.name}</div>
                <div style={{ fontFamily:fontSans, fontSize:mob?11:12.5, color:MUTED, lineHeight:1.5, marginTop:4 }}>{esc.text}</div>
              </div>
              <div style={{ background:`${esc.color}12`, border:`1px solid ${esc.color}30`, padding:mob?"6px 10px":"8px 14px",
                textAlign:"center", minWidth:mob?60:80, flexShrink:0 }}>
                <div style={{ fontFamily:fontSans, fontSize:mob?14:18, fontWeight:700, color:esc.color }}>{esc.prob}</div>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* SECTION 06: COMENTARIOS (S8 only) */}
      {hasDetail && d.comentarios && (
        <Section num="06" title="Comentarios Analíticos" id="comentarios">
          <div style={gridStyle(3)}>
            {d.comentarios.map((c, i) => (
              <div key={i} style={{ ...cardStyle, borderTop:`3px solid ${c.color}` }}>
                <div style={tagStyle(c.color)}>{c.tag}</div>
                <div style={{ fontFamily:fontSans, fontSize:mob?13:14, fontWeight:600, color:TEXT, marginBottom:8 }}>{c.title}</div>
                <div style={tlBodyStyle}>{c.text}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* AI ANALYSIS within informe view */}
      {viewMode === "informe" && aiAnalysis && (() => {
        const providerMatch = aiAnalysis.match(/^\[([^\]]+)\]\n\n/);
        const provider = providerMatch ? providerMatch[1] : "claude";
        const displayText = providerMatch ? aiAnalysis.slice(providerMatch[0].length) : aiAnalysis;
        const badgeColor = provider.includes("mistral") ? "#ff6f00" : provider.includes("gemini") ? "#4285f4" : provider.includes("groq")||provider.includes("llama") ? "#f97316" : provider.includes("openrouter")||provider.includes("free") ? "#06b6d4" : provider.includes("hugging")||provider.includes("qwen")||provider.includes("hf") ? "#ffbf00" : "#8b5cf6";
        const badgeLabel = provider.includes("mistral") ? "MISTRAL" : provider.includes("gemini") ? "GEMINI" : provider.includes("groq")||provider.includes("llama") ? "GROQ" : provider.includes("openrouter")||provider.includes("free") ? "OPENROUTER" : provider.includes("hugging")||provider.includes("qwen")||provider.includes("hf") ? "HUGGINGFACE" : "CLAUDE";
        return (
        <div style={{ borderBottom:`1px solid ${BORDER}40` }}>
          <div style={{ display:"flex", alignItems:"center", gap:mob?8:12, cursor:"pointer",
            padding:mob?"12px 0":"16px 0", userSelect:"none" }} onClick={() => toggle("aianalysis")}>
            <span style={{ fontFamily:font, fontSize:mob?10:11, color:badgeColor, letterSpacing:"0.15em", opacity:0.5, minWidth:mob?24:30 }}>AI</span>
            <span style={{ fontFamily:fontSans, fontSize:mob?15:18, fontWeight:600, color:TEXT, flex:1 }}>Análisis Narrativo · Inteligencia Artificial</span>
            <span style={{ fontSize:8, fontFamily:font, padding:"1px 6px", background:`${badgeColor}18`, color:badgeColor, border:`1px solid ${badgeColor}30`, marginRight:8 }}>{badgeLabel}</span>
            <span style={{ fontSize:mob?12:14, color:MUTED, transition:"transform 0.2s", transform: expandedSection==="aianalysis" ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
          </div>
          {expandedSection === "aianalysis" && (
            <div style={{ paddingBottom:mob?16:24 }}>
              <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:mob?14:20, borderLeft:`3px solid ${badgeColor}` }}>
                <div style={{ fontSize:mob?13:14, fontFamily:fontSans, color:TEXT, lineHeight:1.75, whiteSpace:"pre-wrap" }}>{displayText}</div>
              </div>
            </div>
          )}
        </div>
        );
      })()}
      {viewMode === "informe" && aiError && <div style={{ background:BG2, border:`1px solid #dc262630`, padding:12, marginBottom:12, color:"#dc2626", fontSize:12 }}>Error IA: {aiError}</div>}

      </>}

      {/* SITREP FOOTER */}
      <div style={{ textAlign:"center", fontFamily:font, fontSize:mob?9:10, color:`${MUTED}70`,
        padding:"24px 0 8px", letterSpacing:"0.1em", textTransform:"uppercase" }}>
        PNUD Venezuela · Análisis de Contexto Situacional · {d.periodShort} · Uso interno
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INSTABILITY CHART — Interactive weekly index with MA4
// ═══════════════════════════════════════════════════════════════

function InstabilityChart({ histIdx, index, zone }) {
  const [hover, setHover] = useState(null);
  if (!histIdx || histIdx.length < 2) return null;

  const W = 280, H = 90, PL = 28, PR = 8, PT = 6, PB = 16;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxV = Math.max(...histIdx, 50);
  const minV = Math.min(...histIdx, 0);
  const range = maxV - minV || 1;
  const toX = (i) => PL + (i / (histIdx.length - 1)) * cW;
  const toY = (v) => PT + cH - ((v - minV) / range) * cH;

  // MA4
  const ma4 = histIdx.map((_, i) => {
    if (i < 3) return null;
    return { i, avg: histIdx.slice(i - 3, i + 1).reduce((s,v) => s + v, 0) / 4 };
  }).filter(Boolean);

  // Zone boundaries
  const zones = [
    { from:0, to:25, color:"#16a34a", label:"Estable" },
    { from:25, to:50, color:"#ca8a04", label:"Tensión" },
    { from:50, to:75, color:"#f97316", label:"Alta" },
    { from:75, to:100, color:"#dc2626", label:"Crisis" },
  ];

  return (
    <div>
      <div style={{ fontSize:9, fontFamily:font, color:MUTED, marginBottom:3, display:"flex", justifyContent:"space-between" }}>
        <span>Evolución semanal · 14 factores</span>
        <span style={{ display:"flex", gap:8 }}>
          <span style={{ display:"flex", alignItems:"center", gap:2 }}><span style={{ display:"inline-block", width:10, height:2, background:zone.color }} /><span style={{ fontSize:7 }}>Índice</span></span>
          <span style={{ display:"flex", alignItems:"center", gap:2 }}><span style={{ display:"inline-block", width:10, height:2, background:"#22d3ee" }} /><span style={{ fontSize:7 }}>MA4</span></span>
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", cursor:"crosshair" }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = (e.clientX - rect.left) / rect.width * W;
          const idx = Math.round(((mx - PL) / cW) * (histIdx.length - 1));
          setHover(idx >= 0 && idx < histIdx.length ? idx : null);
        }}
        onMouseLeave={() => setHover(null)}>

        {/* Zone backgrounds */}
        {zones.map((z, i) => {
          const y1 = toY(Math.min(z.to, maxV));
          const y2 = toY(Math.max(z.from, minV));
          return y2 > y1 ? <rect key={i} x={PL} y={y1} width={cW} height={y2 - y1} fill={z.color} opacity={0.06} /> : null;
        })}

        {/* Y grid */}
        {[0, 25, 50, 75, 100].filter(v => v >= minV && v <= maxV).map(v => (
          <g key={v}>
            <line x1={PL} y1={toY(v)} x2={PL + cW} y2={toY(v)} stroke={BORDER} strokeWidth={0.3} />
            <text x={PL - 3} y={toY(v) + 3} fontSize={6} fill={MUTED} textAnchor="end" fontFamily={font}>{v}</text>
          </g>
        ))}

        {/* Area fill */}
        <path d={`M${toX(0)},${PT + cH} ${histIdx.map((v, i) => `L${toX(i)},${toY(v)}`).join(" ")} L${toX(histIdx.length - 1)},${PT + cH}Z`}
          fill={`${zone.color}15`} />

        {/* MA4 line */}
        {ma4.length > 1 && <polyline
          points={ma4.map(m => `${toX(m.i)},${toY(m.avg)}`).join(" ")}
          fill="none" stroke="#22d3ee" strokeWidth={1.5} strokeLinejoin="round" opacity={0.7} />}

        {/* Main line */}
        <polyline
          points={histIdx.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")}
          fill="none" stroke={zone.color} strokeWidth={2} strokeLinejoin="round" />

        {/* Data dots */}
        {histIdx.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r={hover === i ? 4 : 2.5}
            fill={i === histIdx.length - 1 ? zone.color : `${zone.color}80`} stroke="#fff" strokeWidth={1} />
        ))}

        {/* X labels */}
        {histIdx.map((v, i) => (
          <text key={i} x={toX(i)} y={H - 3} fontSize={6}
            fill={hover === i ? zone.color : (i === histIdx.length - 1 ? zone.color : MUTED)}
            textAnchor="middle" fontFamily={font} fontWeight={hover === i || i === histIdx.length - 1 ? 700 : 400}>
            S{i + 1}
          </text>
        ))}

        {/* Hover */}
        {hover !== null && hover < histIdx.length && (() => {
          const v = histIdx[hover];
          const hx = toX(hover);
          const hy = toY(v);
          const ma4Val = ma4.find(m => m.i === hover);
          const zLabel = v <= 25 ? "Estable" : v <= 50 ? "Tensión" : v <= 75 ? "Alta" : "Crisis";
          const tooltipW = 80;
          const tooltipX = hx > W * 0.6 ? hx - tooltipW - 6 : hx + 6;
          const tooltipY = Math.max(Math.min(hy - 16, PT + cH - 34), PT);
          return (
            <>
              <line x1={hx} y1={PT} x2={hx} y2={PT + cH} stroke={zone.color} strokeWidth={0.5} opacity={0.3} />
              {ma4Val && <circle cx={hx} cy={toY(ma4Val.avg)} r={2.5} fill="#22d3ee" stroke="#fff" strokeWidth={1} />}
              <rect x={tooltipX} y={tooltipY} width={tooltipW} height={ma4Val ? 28 : 22} rx={2} fill={BG2} stroke={BORDER} strokeWidth={0.5} opacity={0.95} />
              <text x={tooltipX + 4} y={tooltipY + 10} fontSize={7} fill={zone.color} fontFamily={font} fontWeight="700">
                S{hover + 1}: {v}/100 · {zLabel}
              </text>
              {ma4Val && <text x={tooltipX + 4} y={tooltipY + 21} fontSize={6} fill="#22d3ee" fontFamily={font}>MA4: {ma4Val.avg.toFixed(1)}/100</text>}
            </>
          );
        })()}

        {/* Current pulse dot */}
        <circle cx={toX(histIdx.length - 1)} cy={toY(index)} r={3.5} fill={zone.color} stroke="#fff" strokeWidth={1.5}>
          <animate attributeName="r" values="3.5;5;3.5" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BILATERAL CHART — Interactive hover chart for PizzINT data
// ═══════════════════════════════════════════════════════════════

function BilateralChart({ chartData, cfg, maxV, minV, W, H, PL, PR, PT, PB, cW, cH, toX, toY, mob }) {
  const [hover, setHover] = useState(null);
  if (!chartData || chartData.length < 2) return null;

  // Threshold Y positions
  const y1sigma = toY(1.0);
  const y2sigma = toY(2.0);

  // Area path
  const areaPath = `M${toX(0)},${PT+cH} ${chartData.map((d,i) => `L${toX(i)},${toY(d.v)}`).join(" ")} L${toX(chartData.length-1)},${PT+cH}Z`;
  // Line path
  const linePath = chartData.map((d,i) => `${i===0?"M":"L"}${toX(i)},${toY(d.v)}`).join(" ");

  // MA 30 days
  const ma30 = chartData.map((_, i) => {
    if (i < 29) return null;
    const slice = chartData.slice(i - 29, i + 1);
    const avg = slice.reduce((s, d) => s + d.v, 0) / slice.length;
    return { i, avg };
  }).filter(Boolean);
  const ma30Path = ma30.map((m, j) => `${j === 0 ? "M" : "L"}${toX(m.i)},${toY(m.avg)}`).join(" ");

  // Date labels (every ~15 days)
  const step = Math.max(Math.floor(chartData.length / 6), 1);
  const dateLabels = chartData.filter((_,i) => i % step === 0 || i === chartData.length - 1);

  // Y axis labels
  const yTicks = [];
  for (let yv = Math.ceil(minV * 2) / 2; yv <= maxV; yv += 0.5) {
    yTicks.push(yv);
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", overflow:"visible", cursor:"crosshair" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * W;
        const idx = Math.round(((x - PL) / cW) * (chartData.length - 1));
        setHover(idx >= 0 && idx < chartData.length ? idx : null);
      }}
      onMouseLeave={() => setHover(null)}>

      {/* Zone backgrounds */}
      {y2sigma > PT && <rect x={PL} y={PT} width={cW} height={Math.max(y2sigma - PT, 0)} fill="#ef4444" opacity={0.04} />}
      <rect x={PL} y={y2sigma} width={cW} height={Math.max(y1sigma - y2sigma, 0)} fill="#f97316" opacity={0.04} />
      <rect x={PL} y={y1sigma} width={cW} height={Math.max(PT + cH - y1sigma, 0)} fill="#10b981" opacity={0.04} />

      {/* Y grid + labels */}
      {yTicks.map((yv, i) => (
        <g key={i}>
          <line x1={PL} y1={toY(yv)} x2={PL+cW} y2={toY(yv)} stroke={BORDER} strokeWidth={0.3} />
          <text x={PL-4} y={toY(yv)+2} fontSize={5.5} fill={MUTED} textAnchor="end" fontFamily={font}>{yv.toFixed(1)}</text>
        </g>
      ))}

      {/* Threshold lines */}
      <line x1={PL} y1={y1sigma} x2={PL+cW} y2={y1sigma} stroke="#eab308" strokeWidth={0.7} strokeDasharray="4,3" opacity={0.5} />
      <text x={PL+cW+3} y={y1sigma+2} fontSize={5} fill="#eab308" fontFamily={font}>1.0σ</text>
      <line x1={PL} y1={y2sigma} x2={PL+cW} y2={y2sigma} stroke="#ef4444" strokeWidth={0.7} strokeDasharray="4,3" opacity={0.5} />
      <text x={PL+cW+3} y={y2sigma+2} fontSize={5} fill="#ef4444" fontFamily={font}>2.0σ</text>

      {/* Area fill */}
      <path d={areaPath} fill={`${cfg.color}12`} />

      {/* Main line */}
      <path d={linePath} fill="none" stroke={cfg.color} strokeWidth={1.5} strokeLinejoin="round" />

      {/* MA 30 line */}
      {ma30Path && <path d={ma30Path} fill="none" stroke="#22d3ee" strokeWidth={1.2} strokeLinejoin="round" opacity={0.7} />}
      {ma30.length > 0 && <text x={toX(ma30[ma30.length-1].i)+3} y={toY(ma30[ma30.length-1].avg)+3} fontSize={5} fill="#22d3ee" fontFamily={font}>MA30</text>}

      {/* X date labels */}
      {dateLabels.map((d, i) => {
        const idx = chartData.indexOf(d);
        const dateStr = d.t ? new Date(d.t).toLocaleDateString("es", { day:"numeric", month:"short" }) : "";
        return (
          <text key={i} x={toX(idx)} y={H-2} fontSize={5.5} fill={MUTED} textAnchor="middle" fontFamily={font}>
            {dateStr}
          </text>
        );
      })}

      {/* Hover interaction */}
      {hover !== null && chartData[hover] && (() => {
        const d = chartData[hover];
        const hx = toX(hover);
        const hy = toY(d.v);
        const dateStr = d.t ? new Date(d.t).toLocaleDateString("es", { day:"numeric", month:"short", year:"numeric" }) : "";
        const hLevel = d.v > 2.0 ? "CRÍTICO" : d.v > 1.0 ? "ALTO" : d.v > 0.5 ? "ELEVADO" : d.v > 0 ? "MODERADO" : "BAJO";
        const ma30Val = ma30.find(m => m.i === hover);
        const tooltipW = 92;
        const tooltipH = ma30Val ? 47 : 40;
        const tooltipX = hx > W * 0.65 ? hx - tooltipW - 8 : hx + 8;
        const tooltipY = Math.max(Math.min(hy - tooltipH/2, PT + cH - tooltipH), PT);
        return (
          <>
            <line x1={hx} y1={PT} x2={hx} y2={PT+cH} stroke={cfg.color} strokeWidth={0.6} opacity={0.3} />
            <circle cx={hx} cy={hy} r={3} fill={cfg.color} stroke="#fff" strokeWidth={1.5} />
            {ma30Val && <circle cx={hx} cy={toY(ma30Val.avg)} r={2.5} fill="#22d3ee" stroke="#fff" strokeWidth={1} />}
            {/* Tooltip box */}
            <rect x={tooltipX} y={tooltipY} width={tooltipW} height={tooltipH} rx={2} fill={BG2} stroke={BORDER} strokeWidth={0.5} opacity={0.95} />
            <text x={tooltipX+4} y={tooltipY+9} fontSize={5.5} fill={MUTED} fontFamily={font}>{dateStr}</text>
            <text x={tooltipX+4} y={tooltipY+18} fontSize={7} fill={cfg.color} fontFamily={font} fontWeight="700">{d.v.toFixed(2)}σ · {hLevel}</text>
            <text x={tooltipX+4} y={tooltipY+26} fontSize={5} fill={MUTED} fontFamily={font}>Sent: {(d.sentiment||0).toFixed(1)} · Conf: {d.conflict||"—"}</text>
            <text x={tooltipX+4} y={tooltipY+33} fontSize={5} fill={MUTED} fontFamily={font}>Artículos: {d.total||"—"}</text>
            {ma30Val && <text x={tooltipX+4} y={tooltipY+41} fontSize={5} fill="#22d3ee" fontFamily={font}>MA30: {ma30Val.avg.toFixed(2)}σ</text>}
          </>
        );
      })()}

      {/* Current dot (latest) */}
      <circle cx={toX(chartData.length-1)} cy={toY(chartData[chartData.length-1].v)} r={3} fill={cfg.color} stroke="#fff" strokeWidth={1.5}>
        <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// NEWS ALERTS — Classify headlines by relevance/urgency
// ═══════════════════════════════════════════════════════════════

function NewsAlerts({ liveData, mob }) {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("");
  const generated = useRef(false);

  useEffect(() => {
    if (generated.current || !liveData?.fetched) return;
    generated.current = true;

    async function classifyNews() {
      setLoading(true);

      // Gather headlines from RSS + Google News
      let googleNews = [];
      if (IS_DEPLOYED) {
        try {
          const res = await fetch("/api/gdelt?signal=headlines", { signal: AbortSignal.timeout(12000) });
          if (res.ok) {
            const h = await res.json();
            googleNews = (h.all || []).filter(a => a.title?.length > 20).slice(0, 15);
          }
        } catch {}
      }

      const rssNews = (liveData?.news || []).slice(0, 10).map(n => ({
        title: n.title || n.titulo || "", source: n.source || n.fuente || ""
      })).filter(n => n.title.length > 15);

      const allHeadlines = [
        ...googleNews.map(a => `"${a.title}" [${a.source}]`),
        ...rssNews.map(a => `"${a.title}" [${a.source}]`)
      ];

      if (allHeadlines.length < 3) { setLoading(false); return; }

      const prompt = `Eres un sistema de alerta del PNUD Venezuela. Clasifica estos titulares de noticias según su relevancia para el monitoreo de Venezuela.

TITULARES:
${allHeadlines.map((h,i) => `${i+1}. ${h}`).join("\n")}

INSTRUCCIONES:
1. Responde SOLO en formato JSON válido, sin markdown ni backticks.
2. Clasifica SOLO titulares directamente relacionados con Venezuela (política, economía, geopolítica, DDHH, energía, migración).
3. Ignora completamente titulares sobre otros países o temas no venezolanos.
4. Cada alerta tiene: "nivel" (🔴/🟡/🟢), "titular", "fuente", "dimension" (POLÍTICO/ECONÓMICO/INTERNACIONAL/DDHH/ENERGÍA), "impacto" (1 frase corta de por qué es relevante).
5. 🔴 = Evento urgente que podría mover escenarios. 🟡 = Desarrollo relevante para seguimiento. 🟢 = Contexto informativo.
6. Máximo 8 alertas. Prioriza las más relevantes.
7. Formato exacto:
[{"nivel":"🔴","titular":"...","fuente":"...","dimension":"...","impacto":"..."}]`;

      try {
        if (IS_DEPLOYED) {
          const res = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, max_tokens: 600 }),
            signal: AbortSignal.timeout(35000),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.provider) setProvider(data.provider);
            if (data.text) {
              try {
                const clean = data.text.replace(/```json\s?|```/g, "").trim();
                const parsed = JSON.parse(clean);
                if (Array.isArray(parsed) && parsed.length > 0) setAlerts(parsed.slice(0, 8));
              } catch {
                // Try to extract JSON array from text
                const match = data.text.match(/\[[\s\S]*\]/);
                if (match) {
                  try { const p = JSON.parse(match[0]); if (Array.isArray(p)) setAlerts(p.slice(0, 8)); } catch {}
                }
              }
            }
          }
        }
      } catch {}
      setLoading(false);
    }

    const timer = setTimeout(classifyNews, 4000);
    return () => clearTimeout(timer);
  }, [liveData?.fetched]);

  if (!alerts && !loading) return null;

  const nivelColor = { "🔴":"#dc2626", "🟡":"#ca8a04", "🟢":"#16a34a" };
  const nivelBg = { "🔴":"#dc262608", "🟡":"#ca8a0408", "🟢":"#16a34a08" };
  const dimColor = { "POLÍTICO":"#7c3aed", "ECONÓMICO":"#0e7490", "INTERNACIONAL":"#0468B1", "DDHH":"#dc2626", "ENERGÍA":"#ca8a04" };

  const badgeColor = provider.includes("mistral") ? "#ff6f00" : provider.includes("gemini") ? "#4285f4" : provider.includes("groq")||provider.includes("llama") ? "#f97316" : provider.includes("openrouter")||provider.includes("free") ? "#06b6d4" : provider.includes("hugging")||provider.includes("qwen")||provider.includes("hf") ? "#ffbf00" : "#8b5cf6";
  const badgeLabel = provider.includes("mistral") ? "MISTRAL" : provider.includes("gemini") ? "GEMINI" : provider.includes("groq")||provider.includes("llama") ? "GROQ" : provider.includes("openrouter")||provider.includes("free") ? "OPENROUTER" : provider.includes("hugging")||provider.includes("qwen")||provider.includes("hf") ? "HUGGINGFACE" : "CLAUDE";

  return (
    <Card>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
        <span style={{ fontSize:14 }}>🔔</span>
        <span style={{ fontSize:10, fontFamily:font, letterSpacing:"0.12em", textTransform:"uppercase", color:TEXT, fontWeight:700 }}>Alertas de Noticias</span>
        {provider && (
          <span style={{ fontSize:7, fontFamily:font, padding:"1px 5px", background:`${badgeColor}15`, color:badgeColor, border:`1px solid ${badgeColor}30`, letterSpacing:"0.08em" }}>{badgeLabel}</span>
        )}
        <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>Google News + RSS · Clasificación IA</span>
        {loading && <span style={{ fontSize:10, fontFamily:font, color:MUTED, marginLeft:"auto", animation:"pulse 1.5s infinite" }}>Clasificando noticias...</span>}
      </div>
      {alerts && alerts.map((a, i) => (
        <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"6px 0",
          borderTop:i>0?`1px solid ${BORDER}30`:"none", background:nivelBg[a.nivel] || "transparent" }}>
          <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{a.nivel}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontFamily:fontSans, color:TEXT, lineHeight:1.4 }}>
              {a.titular}
              <span style={{ fontSize:10, fontFamily:font, color:MUTED, marginLeft:6 }}>[{a.fuente}]</span>
            </div>
            <div style={{ display:"flex", gap:6, marginTop:3, alignItems:"center", flexWrap:"wrap" }}>
              {a.dimension && (
                <span style={{ fontSize:8, fontFamily:font, padding:"1px 6px", letterSpacing:"0.06em",
                  color:dimColor[a.dimension] || MUTED, background:`${dimColor[a.dimension] || MUTED}12`,
                  border:`1px solid ${dimColor[a.dimension] || MUTED}25` }}>
                  {a.dimension}
                </span>
              )}
              {a.impacto && <span style={{ fontSize:10, fontFamily:font, color:MUTED, fontStyle:"italic" }}>{a.impacto}</span>}
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}

function TabDashboard({ week, liveData = {} }) {
  const mob = useIsMobile();
  const wk = WEEKS[week];
  const prevWk = week > 0 ? WEEKS[week-1] : null;
  const dom = wk.probs.reduce((a,b) => a.v > b.v ? a : b);
  const domSc = SCENARIOS.find(s=>s.id===dom.sc);
  const trendIcon = { up:"↑", down:"↓", flat:"→" };
  const trendColor = { up:"#22c55e", down:"#ef4444", flat:MUTED };
  const trendLabel = { up:"Al alza", down:"A la baja", flat:"Estable" };
  const semTotal = wk.sem.g + wk.sem.y + wk.sem.r || 1;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* ── ROW 0: Alertas en Vivo por Umbral ── */}
      {(() => {
        const liveAlerts = [];

        // Brecha cambiaria
        if (liveData?.dolar?.brecha) {
          const brecha = parseFloat(liveData.dolar.brecha);
          if (brecha > 55) liveAlerts.push({ name:"Brecha cambiaria", val:`${brecha.toFixed(1)}%`, umbral:"Brecha >55% activa presión E2 — riesgo de colapso económico", level:"red" });
          else if (brecha > 45) liveAlerts.push({ name:"Brecha cambiaria", val:`${brecha.toFixed(1)}%`, umbral:"Brecha en zona crítica (>45%) — presión social creciente", level:"yellow" });
          else if (brecha > 40) liveAlerts.push({ name:"Brecha cambiaria", val:`${brecha.toFixed(1)}%`, umbral:"Brecha >40% — seguimiento activo recomendado", level:"yellow" });
        }

        // Dólar paralelo
        if (liveData?.dolar?.paralelo) {
          const paralelo = parseFloat(liveData.dolar.paralelo);
          if (paralelo > 700) liveAlerts.push({ name:"Dólar paralelo", val:`${paralelo.toFixed(0)} Bs`, umbral:"Paralelo >700 Bs genera presión social y erosión salarial", level:"red" });
          else if (paralelo > 600) liveAlerts.push({ name:"Dólar paralelo", val:`${paralelo.toFixed(0)} Bs`, umbral:"Paralelo en zona de presión (>600 Bs)", level:"yellow" });
        }

        // Brent
        if (liveData?.oil?.brent) {
          const brent = parseFloat(liveData.oil.brent);
          if (brent < 60) liveAlerts.push({ name:"Brent", val:`$${brent.toFixed(2)}`, umbral:"Brent <$60 presiona ingresos petroleros — riesgo fiscal E2", level:"red" });
          else if (brent < 65) liveAlerts.push({ name:"Brent", val:`$${brent.toFixed(2)}`, umbral:"Brent <$65 reduce margen fiscal venezolano", level:"yellow" });
        }

        // WTI
        if (liveData?.oil?.wti) {
          const wti = parseFloat(liveData.oil.wti);
          if (wti < 55) liveAlerts.push({ name:"WTI", val:`$${wti.toFixed(2)}`, umbral:"WTI <$55 señal de debilidad en mercado energético", level:"red" });
          else if (wti < 60) liveAlerts.push({ name:"WTI", val:`$${wti.toFixed(2)}`, umbral:"WTI en zona de presión (<$60)", level:"yellow" });
        }

        // Bilateral Threat Index
        if (liveData?.bilateral?.latest?.v) {
          const bilV = liveData.bilateral.latest.v;
          if (bilV > 2.0) liveAlerts.push({ name:"Bilateral 🇺🇸🇻🇪", val:`${bilV.toFixed(2)}σ`, umbral:"Índice bilateral CRÍTICO (>2σ) — crisis activa en relación EE.UU.-Venezuela", level:"red" });
          else if (bilV > 1.0) liveAlerts.push({ name:"Bilateral 🇺🇸🇻🇪", val:`${bilV.toFixed(2)}σ`, umbral:"Índice bilateral ALTO (>1σ) — tensión significativa", level:"yellow" });
        }

        if (liveAlerts.length === 0) return null;

        const reds = liveAlerts.filter(a => a.level === "red");

        return (
          <div style={{ border:`1px solid ${reds.length > 0 ? "#dc262640" : "#ca8a0440"}`,
            background:reds.length > 0 ? "#dc262608" : "#ca8a0408", padding:mob?"10px 12px":"12px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:liveAlerts.length > 1 ? 8 : 0, flexWrap:"wrap" }}>
              <span style={{ fontSize:14 }}>{reds.length > 0 ? "🚨" : "⚠️"}</span>
              <span style={{ fontSize:10, fontFamily:font, letterSpacing:"0.12em", textTransform:"uppercase",
                color:reds.length > 0 ? "#dc2626" : "#ca8a04", fontWeight:700 }}>
                {liveAlerts.length} alerta{liveAlerts.length>1?"s":""} en vivo
              </span>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", animation:"pulse 1.5s infinite" }} />
              <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>Datos en tiempo real · cada 5 min</span>
            </div>
            {liveAlerts.map((a, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0",
                borderTop:i>0?`1px solid ${BORDER}30`:"none", fontSize:12, fontFamily:font }}>
                <span style={{ width:7, height:7, borderRadius:"50%", flexShrink:0,
                  background:a.level==="red"?"#dc2626":"#ca8a04",
                  boxShadow:a.level==="red"?"0 0 4px #dc262660":"none",
                  animation:a.level==="red"?"pulse 1.5s infinite":"none" }} />
                <span style={{ color:a.level==="red"?"#dc2626":"#ca8a04", fontWeight:700, minWidth:mob?90:130 }}>{a.name}</span>
                <span style={{ color:TEXT, fontWeight:600, minWidth:60 }}>{a.val}</span>
                <span style={{ color:MUTED, fontSize:11, flex:1 }}>{a.umbral}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── ROW 1: Scenario Hero Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:1, background:BORDER, border:`1px solid ${BORDER}` }}>
        {wk.probs.map(p => {
          const sc = SCENARIOS.find(s=>s.id===p.sc);
          const isDom = p.sc === dom.sc;
          const delta = prevWk ? p.v - (prevWk.probs.find(pp=>pp.sc===p.sc)?.v||0) : null;
          return (
            <div key={p.sc} style={{ background:isDom?BG3:BG2, padding:"14px 16px", borderTop:`3px solid ${sc.color}` }}>
              <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
                E{sc.id}
                {isDom && <Badge color={sc.color}>Dominante</Badge>}
              </div>
              <div style={{ fontSize:12, fontWeight:600, color:sc.color, marginBottom:6, lineHeight:1.2 }}>{sc.name}</div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:26, fontWeight:900, color:sc.color, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{p.v}%</span>
                {delta !== null && delta !== 0 && (
                  <span style={{ fontSize:13, fontFamily:font, fontWeight:600, color:delta>0?"#22c55e":"#ef4444", marginBottom:2 }}>
                    {delta>0?"▲":"▼"}{Math.abs(delta)}pp
                  </span>
                )}
              </div>
              <div style={{ height:3, background:BORDER, marginBottom:6 }}>
                <div style={{ height:3, background:sc.color, width:`${p.v}%`, transition:"width 0.5s" }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, fontFamily:font, color:trendColor[p.t] }}>
                  {trendIcon[p.t]} {trendLabel[p.t]}
                </span>
                <Sparkline scId={p.sc} currentWeek={week} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── ROW 1b: Índice de Inestabilidad Compuesto ── */}
      {(() => {
        // ── 13-input Composite Instability Index (0-100) ──
        const e1 = wk.probs.find(p=>p.sc===1)?.v || 0;
        const e2 = wk.probs.find(p=>p.sc===2)?.v || 0;
        const e3 = wk.probs.find(p=>p.sc===3)?.v || 0;
        const e4 = wk.probs.find(p=>p.sc===4)?.v || 0;

        // Indicators
        const latestInds = INDICATORS.map(ind => ind.hist.filter(h=>h!==null).pop()).filter(Boolean);
        const redCount = latestInds.filter(h=>h[0]==="red").length;
        const totalInds = latestInds.length || 1;

        // Tensions
        const tensRed = wk.tensiones.filter(t=>t.l==="red").length;
        const totalTens = wk.tensiones.length || 1;

        // Signals E4+E2 active
        const sigE4E2 = SCENARIO_SIGNALS.filter(g=>g.esc==="E4"||g.esc==="E2").flatMap(g=>g.signals);
        const sigActive = sigE4E2.filter(s=>s.sem==="red"||s.sem==="yellow").length;
        const sigTotal = sigE4E2.length || 1;

        // Live: brecha cambiaria (from liveData, fallback to 50)
        const brechaLive = liveData?.dolar?.brecha ? parseFloat(liveData.dolar.brecha) : 50;

        // Live: Brent pressure (below $65 = pressure, above $75 = stability)
        const brentPrice = liveData?.oil?.brent || 75;
        const brentFactor = brentPrice < 55 ? 100 : brentPrice < 65 ? 70 : brentPrice < 75 ? 30 : brentPrice < 85 ? 10 : 0;

        // OVCS: protests intensity (last month vs max)
        const lastMonth = CONF_MESES[CONF_MESES.length - 1];
        const maxProtests = Math.max(...CONF_MESES.map(m=>m.t), 1);
        const protestPct = lastMonth ? (lastMonth.t / maxProtests) * 100 : 50;
        const repressionPct = lastMonth?.rep > 0 ? Math.min(lastMonth.rep * 25, 100) : 0;

        // Amnesty: verification gap + political prisoners
        const amnLatest = AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 1];
        const gobLib = amnLatest?.gob?.libertades || amnLatest?.gob?.excarcelados || 1;
        const fpVerif = amnLatest?.fp?.verificados || 0;
        const amnBrechaPct = Math.max(0, (1 - fpVerif / gobLib) * 100);
        const presosPct = amnLatest?.fp?.detenidos ? Math.min((amnLatest.fp.detenidos / 1000) * 100, 100) : 50;

        // Bilateral Threat Index (PizzINT/GDELT) — LIVE
        const bilV = liveData?.bilateral?.latest?.v || 0;
        const bilPct = Math.min(bilV / 4 * 100, 100); // 0-4σ mapped to 0-100%

        // ── FORMULA (14 inputs, weights sum to ~100 with stabilizers) ──
        const raw = (redCount/totalInds)*11            // Ind. rojos: 11%
          + (e2/100)*9                                  // E2 Colapso: 9%
          + (e4/100)*7                                  // E4 Resistencia: 7%
          + (Math.min(brechaLive,100)/100)*11           // Brecha cambiaria: 11% (LIVE)
          + (tensRed/totalTens)*7                        // Tensiones rojas: 7%
          + (sigActive/sigTotal)*7                       // Señales E4+E2: 7%
          + (brentFactor/100)*5                          // Brent presión: 5% (LIVE)
          + (bilPct/100)*5                               // Bilateral Threat: 5% (LIVE)
          + (protestPct/100)*5                           // Protestas OVCS: 5%
          + (repressionPct/100)*4                        // Represión OVCS: 4%
          + (amnBrechaPct/100)*5                         // Brecha amnistía: 5%
          + (presosPct/100)*3                            // Presos políticos: 3%
          - (e1/100)*6                                   // E1 Transición: -6% (estabilizador)
          - (e3/100)*3;                                  // E3 Continuidad: -3% (estabilizador)
        const index = Math.max(0, Math.min(100, Math.round(raw)));

        // Previous week index for delta (simplified: same formula with prev week probs)
        let prevIndex = null;
        if (prevWk) {
          const pe1=prevWk.probs.find(p=>p.sc===1)?.v||0, pe2=prevWk.probs.find(p=>p.sc===2)?.v||0;
          const pe3=prevWk.probs.find(p=>p.sc===3)?.v||0, pe4=prevWk.probs.find(p=>p.sc===4)?.v||0;
          const pTR=prevWk.tensiones.filter(t=>t.l==="red").length, pTT=prevWk.tensiones.length||1;
          const pRaw = (redCount/totalInds)*11 + (pe2/100)*9 + (pe4/100)*7
            + (Math.min(brechaLive,100)/100)*11 + (pTR/pTT)*7 + (sigActive/sigTotal)*7
            + (brentFactor/100)*5 + (bilPct/100)*5 + (protestPct/100)*5 + (repressionPct/100)*4
            + (amnBrechaPct/100)*5 + (presosPct/100)*3 - (pe1/100)*6 - (pe3/100)*3;
          prevIndex = Math.max(0, Math.min(100, Math.round(pRaw)));
        }
        const delta = prevIndex !== null ? index - prevIndex : null;

        const zone = index <= 25 ? { label:"Estabilidad relativa", color:"#16a34a" }
          : index <= 50 ? { label:"Tensión moderada", color:"#ca8a04" }
          : index <= 75 ? { label:"Inestabilidad alta", color:"#f97316" }
          : { label:"Crisis inminente", color:"#dc2626" };

        const segments = [
          { from:0, to:25, color:"#16a34a", label:"Estable" },
          { from:25, to:50, color:"#ca8a04", label:"Tensión" },
          { from:50, to:75, color:"#f97316", label:"Alta" },
          { from:75, to:100, color:"#dc2626", label:"Crisis" },
        ];

        // Historical index for sparkline — use per-week data where available
        const histIdx = WEEKS.map((w, wi) => {
          const we1=w.probs.find(p=>p.sc===1)?.v||0, we2=w.probs.find(p=>p.sc===2)?.v||0;
          const we3=w.probs.find(p=>p.sc===3)?.v||0, we4=w.probs.find(p=>p.sc===4)?.v||0;
          const wtr=w.tensiones.filter(t=>t.l==="red").length, wtt=w.tensiones.length||1;
          // Per-week amnesty brecha
          const wAmn = AMNISTIA_TRACKER[Math.min(wi, AMNISTIA_TRACKER.length-1)];
          const wGobLib = wAmn?.gob?.libertades || wAmn?.gob?.excarcelados || 1;
          const wFpVer = wAmn?.fp?.verificados || 0;
          const wAmnBrecha = (wGobLib > wFpVer && wGobLib > 1) ? Math.max(0, Math.min((1 - wFpVer / wGobLib) * 100, 100)) : 50;
          const wPresos = Math.min(Math.max((wAmn?.fp?.detenidos || 300) / 1500 * 100, 0), 100);
          // Per-week semaforo for indicator proxy
          const wSem = w.sem || { g:0, y:0, r:0 };
          const wRedProxy = wSem.r || 0;
          const wTotalSem = (wSem.g||0) + (wSem.y||0) + (wSem.r||0) || 1;
          // Use current-week live values only for current week, approximate for historical
          const wBrecha = (wi === WEEKS.length - 1) ? brechaLive : Math.max(20, 55 - we1 * 0.5 + we2 * 0.3);
          const wBrent = (wi === WEEKS.length - 1) ? brentFactor : 50;
          const wBil = (wi === WEEKS.length - 1) ? bilPct : Math.min(we2 * 1.5 + we4 * 0.5, 100);
          const wr = (wRedProxy/wTotalSem)*11 + (we2/100)*9 + (we4/100)*7
            + (Math.min(wBrecha,100)/100)*11 + (wtr/wtt)*7 + (sigActive/sigTotal)*7
            + (wBrent/100)*5 + (wBil/100)*5 + (protestPct/100)*5 + (repressionPct/100)*4
            + (wAmnBrecha/100)*5 + (wPresos/100)*3 - (we1/100)*6 - (we3/100)*3;
          return Math.max(0, Math.min(100, Math.round(wr)));
        });

        // Breakdown items for display
        const breakdown = [
          { label:"Ind. rojos", value:`${redCount}/${totalInds}`, pct:Math.round(redCount/totalInds*100), w:"11%" },
          { label:"Brecha camb.", value:`${brechaLive.toFixed(0)}%`, pct:Math.min(brechaLive,100), w:"11%", live:true },
          { label:"E2 Colapso", value:`${e2}%`, pct:e2, w:"9%" },
          { label:"Señales E4/E2", value:`${sigActive}/${sigTotal}`, pct:Math.round(sigActive/sigTotal*100), w:"7%" },
          { label:"E4 Resistencia", value:`${e4}%`, pct:e4, w:"7%" },
          { label:"Tens. rojas", value:`${tensRed}/${totalTens}`, pct:Math.round(tensRed/totalTens*100), w:"7%" },
          { label:"Bilateral 🇺🇸🇻🇪", value:`${bilV.toFixed(1)}σ`, pct:Math.round(bilPct), w:"5%", live:true },
          { label:"Brent", value:`$${brentPrice}`, pct:brentFactor, w:"5%", live:true },
          { label:"Protestas", value:`${lastMonth?.t||"—"}`, pct:Math.round(protestPct), w:"5%" },
          { label:"Brecha amnist.", value:`${amnBrechaPct.toFixed(0)}%`, pct:Math.round(amnBrechaPct), w:"5%" },
          { label:"Represión", value:`${lastMonth?.rep||0}`, pct:Math.round(repressionPct), w:"4%" },
          { label:"Presos pol.", value:`${amnLatest?.fp?.detenidos||"—"}`, pct:Math.round(presosPct), w:"3%" },
          { label:"E1 Transición", value:`-${e1}%`, pct:0, w:"-6%", isNeg:true },
          { label:"E3 Continuidad", value:`-${e3}%`, pct:0, w:"-3%", isNeg:true },
        ];

        return (
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"auto 1fr", gap:0, border:`1px solid ${BORDER}`, background:BG2 }}>
            {/* Left: Big number */}
            <div style={{ padding:mob?"14px 16px":"18px 24px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              borderRight:mob?"none":`1px solid ${BORDER}`, borderBottom:mob?`1px solid ${BORDER}`:"none", minWidth:mob?"auto":160 }}>
              <div style={{ fontSize:9, fontFamily:font, letterSpacing:"0.15em", textTransform:"uppercase", color:MUTED, marginBottom:4 }}>
                Índice de Inestabilidad
              </div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:6 }}>
                <span style={{ fontSize:mob?40:52, fontWeight:900, fontFamily:"'Playfair Display',serif", color:zone.color, lineHeight:1 }}>
                  {index}
                </span>
                <span style={{ fontSize:14, fontFamily:font, color:MUTED, marginBottom:mob?4:8 }}>/100</span>
              </div>
              {delta !== null && delta !== 0 && (
                <div style={{ fontSize:12, fontFamily:font, color:delta>0?"#dc2626":"#16a34a", marginTop:2 }}>
                  {delta>0?"▲":"▼"}{Math.abs(delta)}pp vs anterior
                </div>
              )}
              <div style={{ fontSize:11, fontFamily:fontSans, fontWeight:600, color:zone.color, marginTop:4, padding:"2px 10px",
                background:`${zone.color}12`, border:`1px solid ${zone.color}25` }}>
                {zone.label}
              </div>
            </div>

            {/* Right: Thermometer + breakdown */}
            <div style={{ padding:mob?"12px 14px":"16px 20px" }}>
              {/* Thermometer bar */}
              <div style={{ marginBottom:12 }}>
                <div style={{ display:"flex", height:12, borderRadius:6, overflow:"hidden", background:BG3, position:"relative" }}>
                  {segments.map((seg,i) => (
                    <div key={i} style={{ flex:1, background:seg.color, opacity:0.2 }} />
                  ))}
                  <div style={{ position:"absolute", left:`${index}%`, top:-2, transform:"translateX(-50%)", width:4, height:16,
                    background:zone.color, borderRadius:2, boxShadow:`0 0 6px ${zone.color}60`, transition:"left 0.5s" }} />
                </div>
                <div style={{ display:"flex", marginTop:3 }}>
                  {segments.map((seg,i) => (
                    <div key={i} style={{ flex:1, fontSize:8, fontFamily:font, color:index >= seg.from && index <= seg.to ? seg.color : `${MUTED}60`,
                      fontWeight:index >= seg.from && index <= seg.to ? 700 : 400, textAlign:"center" }}>
                      {seg.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Breakdown + sparkline */}
              <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:mob?8:16 }}>
                {/* Breakdown */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px 8px", fontSize:10, fontFamily:font }}>
                  {breakdown.map((item,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", color:item.isNeg?"#16a34a":MUTED, padding:"1px 0" }}>
                      <span style={{ display:"flex", alignItems:"center", gap:3 }}>
                        {item.label}
                        {item.live && <span style={{ width:4, height:4, borderRadius:"50%", background:"#22c55e", animation:"pulse 1.5s infinite" }} />}
                      </span>
                      <span style={{ fontWeight:600, color:item.isNeg?"#16a34a":item.pct>50?"#dc2626":item.pct>25?"#ca8a04":MUTED }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Historical chart */}
                <div>
                  <InstabilityChart histIdx={histIdx} index={index} zone={zone} />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── ROW 1c: Conflictividad Bilateral EE.UU.–Venezuela ── */}
      {liveData?.bilateral?.latest && (() => {
        const bil = liveData.bilateral;
        const lat = bil.latest;
        const v = lat.v || 0;
        const level = lat.level || "LOW";
        const sentiment = lat.sentiment || 0;
        const conflictCount = lat.conflict || lat.conflictCount || 0;
        const totalArticles = lat.total || lat.totalArticles || 0;
        const hist = bil.history || [];

        const levelConfig = {
          LOW: { color:"#10b981", label:"BAJO", desc:"Relación bilateral estable" },
          MODERATE: { color:"#22d3ee", label:"MODERADO", desc:"Actividad mediática normal" },
          ELEVATED: { color:"#eab308", label:"ELEVADO", desc:"Tensión bilateral en aumento" },
          HIGH: { color:"#f97316", label:"ALTO", desc:"Tensión bilateral significativa" },
          CRITICAL: { color:"#ef4444", label:"CRÍTICO", desc:"Crisis bilateral activa" },
        };
        const cfg = levelConfig[level] || levelConfig.MODERATE;

        const chartData = hist.filter(d => !d.interp && d.v != null).slice(-90);
        const maxV = Math.max(...chartData.map(d=>d.v), 2.5);
        const minV = Math.min(...chartData.map(d=>d.v), 0);
        const W = 600, H = 85, PL = 25, PR = 10, PT = 4, PB = 14;
        const cW = W - PL - PR, cH = H - PT - PB;
        const toX = (i) => PL + (i / (chartData.length - 1)) * cW;
        const toY = (val) => PT + cH - ((val - minV) / (maxV - minV)) * cH;

        return (
          <div style={{ border:`1px solid ${BORDER}`, background:BG2 }}>
            {/* Header + KPIs combined row */}
            <div style={{ display:"flex", alignItems:"center", gap:0, borderBottom:`1px solid ${BORDER}40` }}>
              {/* Title */}
              <div style={{ display:"flex", alignItems:"center", gap:5, padding:mob?"6px 8px":"8px 12px", borderRight:`1px solid ${BORDER}40`, minWidth:mob?"auto":180 }}>
                <span style={{ fontSize:14 }}>🇺🇸</span>
                <span style={{ fontSize:9, color:MUTED }}>→</span>
                <span style={{ fontSize:14 }}>🇻🇪</span>
                <div>
                  <div style={{ fontSize:10, fontFamily:font, fontWeight:700, color:TEXT, letterSpacing:"0.03em" }}>Conflictividad Bilateral</div>
                  <div style={{ fontSize:7, fontFamily:font, color:MUTED }}>PizzINT/GDELT · {chartData.length}d</div>
                </div>
              </div>
              {/* 4 KPIs inline */}
              {[
                { label:"Índice", value:v.toFixed(2), unit:"σ", color:cfg.color },
                { label:"Sentimiento", value:sentiment.toFixed(1), unit:"", color:sentiment<-4?"#dc2626":sentiment<-2?"#ca8a04":"#16a34a" },
                { label:"Conflicto", value:conflictCount.toString(), unit:"", color:conflictCount>100?"#dc2626":conflictCount>50?"#ca8a04":TEXT },
                { label:"Artículos", value:totalArticles.toString(), unit:"", color:TEXT },
              ].map((kpi, i) => (
                <div key={i} style={{ flex:1, padding:mob?"5px 4px":"6px 8px", textAlign:"center", borderRight:i<3?`1px solid ${BORDER}40`:"none" }}>
                  <div style={{ fontSize:7, fontFamily:font, letterSpacing:"0.08em", textTransform:"uppercase", color:MUTED }}>{kpi.label}</div>
                  <div style={{ fontSize:mob?14:16, fontWeight:800, fontFamily:"'Playfair Display',serif", color:kpi.color, lineHeight:1, marginTop:1 }}>
                    {kpi.value}<span style={{ fontSize:8, fontWeight:400 }}>{kpi.unit}</span>
                  </div>
                </div>
              ))}
              {/* Level badge */}
              <div style={{ padding:mob?"5px 6px":"6px 10px", textAlign:"center" }}>
                <div style={{ fontSize:7, fontFamily:font, color:MUTED, letterSpacing:"0.08em" }}>NIVEL</div>
                <div style={{ fontSize:11, fontFamily:fontSans, fontWeight:700, color:cfg.color, marginTop:1 }}>{cfg.label}</div>
              </div>
            </div>

            {/* Compact chart */}
            <div style={{ padding:mob?"4px 4px":"6px 8px" }}>
              <BilateralChart chartData={chartData} cfg={cfg} maxV={maxV} minV={minV} W={W} H={H} PL={PL} PR={PR} PT={PT} PB={PB} cW={cW} cH={cH} toX={toX} toY={toY} mob={mob} />
              {/* Level bar */}
              <div style={{ marginTop:4 }}>
                <div style={{ display:"flex", height:4, borderRadius:2, overflow:"hidden", background:BG3, position:"relative" }}>
                  {Object.entries(levelConfig).map(([k,c]) => (
                    <div key={k} style={{ flex:1, background:c.color, opacity:0.2 }} />
                  ))}
                  <div style={{ position:"absolute", left:`${Math.min(v/4*100, 100)}%`, top:-1, transform:"translateX(-50%)",
                    width:3, height:6, background:cfg.color, borderRadius:1, boxShadow:`0 0 4px ${cfg.color}60`, transition:"left 0.5s" }} />
                </div>
                <div style={{ display:"flex", marginTop:1 }}>
                  {Object.entries(levelConfig).map(([k,c]) => (
                    <div key={k} style={{ flex:1, fontSize:6, fontFamily:font, textAlign:"center",
                      color:k===level?c.color:`${MUTED}40`, fontWeight:k===level?700:400 }}>
                      {c.label}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize:7, fontFamily:font, color:`${MUTED}50`, marginTop:3, display:"flex", justifyContent:"space-between" }}>
                <span>~{v.toFixed(1)}σ sobre baseline 2017–hoy (μ=0.14 · σ=1.15)</span>
                <span>PizzINT / GDELT</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── ROW 2: Amnistía Tracker ── */}
      {(() => {
        const latest = AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 1];
        const prev = AMNISTIA_TRACKER.length > 1 ? AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 2] : null;
        const gobLib = latest.gob.libertades || latest.gob.excarcelados || 0;
        const fpVerif = latest.fp.verificados || 0;
        const brecha = gobLib && fpVerif ? Math.round((1 - fpVerif / gobLib) * 100) : null;
        const fpDelta = prev?.fp?.verificados ? fpVerif - prev.fp.verificados : null;
        return (
          <Card>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:10, fontFamily:font, color:ACCENT, letterSpacing:"0.15em", textTransform:"uppercase" }}>
                📋 Ley de Amnistía · Tracker Dual
              </div>
              <div style={{ fontSize:9, fontFamily:font, color:MUTED }}>Act. {latest.label}</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr 1fr", gap:mob?6:8, marginBottom:12 }}>
              {[
                { v:latest.gob.solicitudes?.toLocaleString() || "—", l:"Solicitudes", sub:"Gobierno", c:ACCENT },
                { v:latest.gob.libertades?.toLocaleString() || latest.gob.excarcelados?.toLocaleString() || "—", l:"Libertades plenas", sub:"Gobierno", c:"#16a34a" },
                { v:fpVerif.toLocaleString(), l:"Excarcelaciones verif.", sub:"Foro Penal", c:"#ca8a04", delta:fpDelta },
                { v:latest.fp.detenidos?.toLocaleString() || "—", l:"Presos políticos", sub:"Foro Penal", c:"#dc2626" },
              ].map((item, i) => (
                <div key={i} style={{ background:BG3, padding:mob?8:12, textAlign:"center" }}>
                  <div style={{ fontFamily:fontSans, fontSize:mob?18:24, fontWeight:700, color:item.c }}>
                    {item.v}
                    {item.delta && item.delta > 0 && <span style={{ fontSize:11, color:"#16a34a", marginLeft:4 }}>+{item.delta}</span>}
                  </div>
                  <div style={{ fontFamily:font, fontSize:mob?7:8, letterSpacing:"0.08em", color:MUTED, textTransform:"uppercase" }}>{item.l}</div>
                  <div style={{ fontFamily:font, fontSize:mob?7:8, color:item.c, opacity:0.7 }}>{item.sub}</div>
                </div>
              ))}
            </div>
            {brecha !== null && (
              <div style={{ marginBottom:12, padding:mob?"8px 10px":"10px 14px", background:`#dc262608`, border:`1px solid #dc262620` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:11, fontFamily:font, color:"#dc2626", letterSpacing:"0.1em", textTransform:"uppercase" }}>Brecha verificación</span>
                  <span style={{ fontSize:16, fontFamily:fontSans, fontWeight:700, color:"#dc2626" }}>{brecha}%</span>
                </div>
                <div style={{ height:6, background:BORDER, borderRadius:3 }}>
                  <div style={{ height:6, borderRadius:3, background:`linear-gradient(90deg, #16a34a ${100-brecha}%, #dc2626 ${100-brecha}%)`, width:"100%" }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                  <span style={{ fontSize:9, fontFamily:font, color:"#16a34a" }}>Foro Penal: {fpVerif.toLocaleString()}</span>
                  <span style={{ fontSize:9, fontFamily:font, color:ACCENT }}>Gobierno: {gobLib.toLocaleString()}</span>
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:50, marginBottom:8 }}>
              {AMNISTIA_TRACKER.map((w, i) => {
                const gVal = w.gob.libertades || w.gob.excarcelados || 0;
                const fVal = w.fp.verificados || 0;
                const maxVal = Math.max(...AMNISTIA_TRACKER.map(t => Math.max(t.gob.libertades||t.gob.excarcelados||0, 1)));
                const gH = Math.max(2, (gVal / maxVal) * 45);
                const fH = Math.max(2, (fVal / maxVal) * 45);
                const isLast = i === AMNISTIA_TRACKER.length - 1;
                return (
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
                    <div style={{ display:"flex", gap:1, alignItems:"flex-end", width:"100%" }}>
                      <div style={{ flex:1, height:gH, background:ACCENT, opacity:isLast?1:0.4, borderRadius:"2px 0 0 0", transition:"height 0.3s" }} />
                      <div style={{ flex:1, height:fH, background:"#ca8a04", opacity:isLast?1:0.4, borderRadius:"0 2px 0 0", transition:"height 0.3s" }} />
                    </div>
                    <span style={{ fontSize:7, fontFamily:font, color:isLast?ACCENT:MUTED }}>{w.week}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:8, height:8, background:ACCENT, borderRadius:1 }} />
                <span style={{ fontSize:10, color:MUTED }}>Gobierno</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:8, height:8, background:"#ca8a04", borderRadius:1 }} />
                <span style={{ fontSize:10, color:MUTED }}>Foro Penal</span>
              </div>
              {latest.gob.militares && (
                <span style={{ fontSize:10, fontFamily:font, color:MUTED, marginLeft:"auto" }}>
                  {latest.gob.militares} militares · {latest.gob.cautelares?.toLocaleString() || "—"} cautelares
                </span>
              )}
            </div>
            <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${BORDER}40`, fontSize:11, color:MUTED, fontStyle:"italic", lineHeight:1.4 }}>
              {latest.hito}
            </div>
          </Card>
        );
      })()}

      {/* ── ROW 3: KPIs + Semáforo ── */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 200px", gap:12 }}>

        {/* KPIs por dimensión — de la semana activa */}
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:1, background:BORDER, border:`1px solid ${BORDER}` }}>
          {[
            {title:"Energético",icon:"⚡",rows:[
              {k:"Exportaciones",v:wk.kpis.energia.exportaciones},
              {k:"Ingresos",v:wk.kpis.energia.ingresos},
              {k:"Licencias OFAC",v:wk.kpis.energia.licencias},
              {k:"Tipo de cambio",v:wk.kpis.energia.cambio},
            ]},
            {title:"Económico",icon:"📊",rows:[
              {k:"Inflación proy.",v:wk.kpis.economico.inflacion},
              {k:"Ingresos pob.",v:wk.kpis.economico.ingresos_pob},
              {k:"Electricidad",v:wk.kpis.economico.electricidad},
              {k:"PIB 2026",v:wk.kpis.economico.pib},
            ]},
            {title:"Opinión",icon:"🗳",rows:[
              {k:"Dirección país",v:wk.kpis.opinion.direccion},
              {k:"Dem. electoral",v:wk.kpis.opinion.elecciones},
              {k:"MCM / liderazgo",v:wk.kpis.opinion.mcm},
              {k:"Respaldo EE.UU.",v:wk.kpis.opinion.eeuu},
            ]},
          ].map((sec,i) => (
            <div key={i} style={{ background:BG2, padding:"14px 16px" }}>
              <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
                {sec.icon} {sec.title}
              </div>
              {sec.rows.map((r,j) => (
                <div key={j} style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6, gap:8 }}>
                  <span style={{ fontSize:13, color:"#5a8aaa" }}>{r.k}</span>
                  <span style={{ fontSize:13, fontFamily:font, fontWeight:500, color:r.v==="—"?`${MUTED}60`:TEXT, whiteSpace:"nowrap", textAlign:"right", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis" }}>{r.v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Semáforo resumen */}
        <Card>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
            🚦 Señales
          </div>
          {[{label:"Verde",count:wk.sem.g,color:"green"},
            {label:"Amarillo",count:wk.sem.y,color:"yellow"},
            {label:"Rojo",count:wk.sem.r,color:"red"}
          ].map((s,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:18, fontWeight:700, fontFamily:font, color:SEM[s.color], width:24, textAlign:"right" }}>{s.count}</span>
              <span style={{ fontSize:12, color:SEM[s.color], width:46, letterSpacing:"0.06em", textTransform:"uppercase" }}>{s.label}</span>
              <div style={{ flex:1, height:5, background:BORDER, borderRadius:2 }}>
                <div style={{ height:5, background:SEM[s.color], width:`${(s.count/semTotal)*100}%`, borderRadius:2, transition:"width 0.4s" }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${BORDER}`, textAlign:"center" }}>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Dominante</div>
            <div style={{ fontSize:16, fontWeight:800, color:domSc.color, fontFamily:"'Syne',sans-serif" }}>E{domSc.id} · {dom.v}%</div>
            <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>{domSc.short}</div>
          </div>
        </Card>
      </div>

      {/* ── ROW 3: Lectura rápida ── */}
      {wk.lectura && (
        <div style={{ background:`linear-gradient(135deg, ${domSc.color}12, transparent)`, border:`1px solid ${domSc.color}25`, padding:"14px 18px" }}>
          <div style={{ fontSize:10, fontFamily:font, color:domSc.color, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:6 }}>
            Lectura de la semana · {wk.label}
          </div>
          <div style={{ fontSize:14, color:"#3d4f5f", lineHeight:1.7, fontStyle:"italic" }}>
            {wk.lectura}
          </div>
        </div>
      )}

      {/* ── ROW 4: Tensiones activas ── */}
      <Card>
        <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:10, paddingBottom:5, borderBottom:`1px solid ${BORDER}` }}>
          ⚠ Tensiones activas · {wk.label}
        </div>
        {wk.tensiones.map((t,i) => (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:7, paddingBottom:7, borderBottom:i<wk.tensiones.length-1?`1px solid ${BORDER}40`:"none" }}>
            <SemDot color={t.l} />
            <span style={{ fontSize:13, color:"#3d4f5f", lineHeight:1.6 }} dangerouslySetInnerHTML={{ __html:t.t }} />
          </div>
        ))}
      </Card>

      {/* ── ROW 5: Alertas Inteligentes de Noticias ── */}
      <NewsAlerts liveData={liveData} mob={mob} />

    </div>
  );
}

// Drivers/Signals for the latest week (S7) — for sidebar detail
const WEEK_DRIVERS = {
  1: { label:"Media", drivers:["Rubio: legitimación electoral = requisito inversión","60,3% considera país más democrático","España propone levantar sanciones a Delcy","Disputa cifras amnistía: 568 verif. vs 4.151 oficiales"], signals:["Calendario electoral verificable","Listados consolidados de amnistía","Designaciones Poder Ciudadano con perfil técnico","Reunión Petro-Delcy con declaración conjunta"] },
  2: { label:"Contenida", drivers:["Brecha cambiaria 52,6% ↑6,5pp semanal","47 meses sin ajuste salarial · canasta USD 550","FMI: deuda >180% PIB · Intensa Fragilidad","Corrupción: 56,7% problema principal"], signals:["Brecha >55% sin intervención BCV","Movilizaciones gremiales","Retraso en ingresos petroleros proyectados","Fractura relación EE.UU. / suspensión licencias"] },
  3: { label:"Alta (dominante)", drivers:["Trump: \"nuevo amigo y socio\" · Estado de la Unión","~800K bpd · Vitol/Trafigura 3 buques · USD 6.000M proy.","Amnistía operativa: 4.203 solicitudes · 3.231 libertades","SOUTHCOM plan 3 fases · 71.000 kg asistencia médica","62,4% valora influencia EE.UU. · 51,5% país mejor","Eni USD 3B compensación · Shell gas · Petro-Delcy 14 mar"], signals:["Flujo sostenido exportaciones India + EE.UU.","Plan SOUTHCOM: segunda visita Donovan","Excarcelaciones ampliadas con listas públicas","Estabilización brecha cambiaria","Designaciones Poder Ciudadano en plazo 30 días"] },
  4: { label:"Media-baja", drivers:["135 de 179 excarcelaciones en Caracas (inequidad territorial)","Caso Magalli Meda: 16 armados, 6 camionetas","11.000+ bajo medidas restrictivas (Foro Penal)","Poder Ciudadano: designaciones encargadas","Destitución embajadora Nicaragua sin explicación"], signals:["Suspensión de excarcelaciones","Operativos contra opositores","Discurso confrontativo (Cabello)","Poder Ciudadano: control sin pluralismo"] },
};

function FullMatrix({ weekIdx, onClickWeek, onArrowClick }) {
  const W=560, H=400;
  const wk = WEEKS[weekIdx];
  const dom = wk.probs.reduce((a,b) => a.v>b.v?a:b);
  const domSc = SCENARIOS.find(s=>s.id===dom.sc);
  const trendSc = SCENARIOS.find(s=>s.id===(wk.trendSc||dom.sc));
  const trendColor = trendSc.color;

  // Trail points
  const trail = WEEKS.slice(0, weekIdx+1).map((w,i) => ({
    px: w.xy.x * W, py: (1-w.xy.y) * H, idx: i,
    dom: SCENARIOS.find(s=>s.id===w.probs.reduce((a,b)=>a.v>b.v?a:b).sc),
  }));
  const cur = trail[trail.length-1];

  // Compute drift direction based on trend scenario's quadrant center
  const trendTargets = { 1:{x:W*0.2,y:H*0.2}, 2:{x:W*0.8,y:H*0.2}, 3:{x:W*0.2,y:H*0.8}, 4:{x:W*0.8,y:H*0.8} };
  const target = trendTargets[wk.trendSc||dom.sc];
  let dx = target.x - cur.px, dy = target.y - cur.py;
  const mag = Math.sqrt(dx*dx + dy*dy);
  const arrowLen = Math.min(mag * 0.4, 75);
  if (mag > 1) { dx = (dx/mag)*arrowLen; dy = (dy/mag)*arrowLen; }
  const arrowEnd = { x: cur.px + dx, y: cur.py + dy };
  const isSameSc = (wk.trendSc||dom.sc) === dom.sc;

  // Breathing animation: normalized direction for the drift
  const driftX = mag > 1 ? (dx/arrowLen)*5 : 0;
  const driftY = mag > 1 ? (dy/arrowLen)*5 : 0;

  // Unique animation name for this render
  const animId = `drift-${weekIdx}`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", background:BG }}>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <polygon points="0 0, 10 4, 0 8" fill={trendColor} opacity="0.85" />
        </marker>
        <style>{`
          @keyframes ${animId} {
            0%, 100% { transform: translate(0px, 0px); }
            50% { transform: translate(${driftX}px, ${driftY}px); }
          }
        `}</style>
      </defs>
      {/* Quadrants */}
      <rect x={0} y={0} width={W/2} height={H/2} fill="rgba(76,159,56,0.05)" />
      <rect x={W/2} y={0} width={W/2} height={H/2} fill="rgba(229,36,59,0.05)" />
      <rect x={0} y={H/2} width={W/2} height={H/2} fill="rgba(10,151,217,0.05)" />
      <rect x={W/2} y={H/2} width={W/2} height={H/2} fill="rgba(252,195,11,0.05)" />
      {/* Axes */}
      <line x1={W/2} y1={0} x2={W/2} y2={H} stroke={BORDER} strokeWidth={1} />
      <line x1={0} y1={H/2} x2={W} y2={H/2} stroke={BORDER} strokeWidth={1} />
      {/* Grid */}
      <line x1={W/4} y1={0} x2={W/4} y2={H} stroke={BORDER} strokeWidth={0.5} strokeDasharray="3 4" opacity={0.4} />
      <line x1={3*W/4} y1={0} x2={3*W/4} y2={H} stroke={BORDER} strokeWidth={0.5} strokeDasharray="3 4" opacity={0.4} />
      <line x1={0} y1={H/4} x2={W} y2={H/4} stroke={BORDER} strokeWidth={0.5} strokeDasharray="3 4" opacity={0.4} />
      <line x1={0} y1={3*H/4} x2={W} y2={3*H/4} stroke={BORDER} strokeWidth={0.5} strokeDasharray="3 4" opacity={0.4} />
      {/* Quadrant labels */}
      <text x={12} y={16} fontSize={8} fill={MUTED} fontFamily={font} opacity={0.6}>CAMBIO SIN VIOLENCIA</text>
      <text x={W/2+12} y={16} fontSize={8} fill={MUTED} fontFamily={font} opacity={0.6}>CAMBIO CAÓTICO</text>
      <text x={12} y={H-8} fontSize={8} fill={MUTED} fontFamily={font} opacity={0.6}>ESTABILIDAD SIN TRANSFORMACIÓN</text>
      <text x={W/2+12} y={H-8} fontSize={8} fill={MUTED} fontFamily={font} opacity={0.6}>VIOLENCIA SIN CAMBIO</text>
      {/* Scenario labels */}
      <text x={16} y={50} fontSize={9} fontWeight={700} fill="#4C9F38" fontFamily="'Syne',sans-serif">E1: Transición pacífica</text>
      <text x={W/2+16} y={50} fontSize={9} fontWeight={700} fill="#E5243B" fontFamily="'Syne',sans-serif">E2: Colapso y fragmentación</text>
      <text x={16} y={H/2+40} fontSize={9} fontWeight={700} fill="#0A97D9" fontFamily="'Syne',sans-serif">E3: Continuidad negociada</text>
      <text x={W/2+16} y={H/2+40} fontSize={9} fontWeight={700} fill="#b8860b" fontFamily="'Syne',sans-serif">E4: Resistencia coercitiva</text>
      {/* Trail segments */}
      {trail.slice(1).map((p,i) => {
        const prev = trail[i];
        const alpha = 0.15 + ((i+1)/trail.length)*0.6;
        return <line key={i} x1={prev.px} y1={prev.py} x2={p.px} y2={p.py} stroke={p.dom.color} strokeWidth={2} strokeDasharray="5 3" opacity={alpha} />;
      })}
      {/* Ghost dots — bigger */}
      {trail.slice(0,-1).map((p,i) => (
        <g key={i} style={{ cursor:"pointer" }} onClick={() => onClickWeek && onClickWeek(p.idx)}>
          <circle cx={p.px} cy={p.py} r={14} fill="transparent" />
          <circle cx={p.px} cy={p.py} r={7} fill={p.dom.color} opacity={0.2 + (i/trail.length)*0.5} />
          <text x={p.px} y={p.py-11} textAnchor="middle" fontSize={7} fill={p.dom.color} fontFamily={font} opacity={0.6}>{WEEKS[p.idx].short}</text>
        </g>
      ))}
      {/* ── TREND ARROW — thicker and longer ── */}
      <line x1={cur.px} y1={cur.py} x2={arrowEnd.x} y2={arrowEnd.y}
        stroke={trendColor} strokeWidth={3.5} strokeDasharray="6 3" opacity={0.75} markerEnd="url(#arrowhead)" />
      {/* Arrow label */}
      <text x={arrowEnd.x + (dx > 0 ? 10 : -10)} y={arrowEnd.y - 8}
        textAnchor={dx >= 0 ? "start" : "end"} fontSize={9} fill={trendColor} fontFamily={font} fontWeight={700} opacity={0.9}>
        {isSameSc ? `→ E${trendSc.id}` : `↑ E${trendSc.id}`}
      </text>
      {/* Arrow hover target (invisible, wide for easy clicking) */}
      <line x1={cur.px} y1={cur.py} x2={arrowEnd.x} y2={arrowEnd.y}
        stroke="transparent" strokeWidth={28} style={{ cursor:"pointer" }}
        onClick={() => onArrowClick && onArrowClick()} />
      {/* Active point — bigger, with breathing animation toward arrow direction */}
      <g style={{ animation:`${animId} 2.5s ease-in-out infinite` }}>
        <circle cx={cur.px} cy={cur.py} r={22} fill={domSc.color} opacity={0.06} />
        <circle cx={cur.px} cy={cur.py} r={14} fill={domSc.color} opacity={0.12} />
        <circle cx={cur.px} cy={cur.py} r={9} fill={domSc.color} opacity={0.9} />
        <text x={cur.px} y={cur.py+3.5} textAnchor="middle" fontSize={8} fontWeight={700} fill={BG} fontFamily={font}>E{domSc.id}</text>
      </g>
      <text x={cur.px} y={cur.py-18} textAnchor="middle" fontSize={9} fill={domSc.color} fontFamily={font} fontWeight={700}>{wk.short}</text>
      {/* Axis labels */}
      <text x={W/2} y={H-2} textAnchor="middle" fontSize={7} fill={MUTED} fontFamily={font} letterSpacing="0.1em">VIOLENCIA →</text>
      <text x={4} y={H/2} fontSize={7} fill={MUTED} fontFamily={font} letterSpacing="0.1em" transform={`rotate(-90,8,${H/2})`}>CAMBIO ↑</text>
    </svg>
  );
}

function TabMatriz({ week, setWeek }) {
  const mob = useIsMobile();
  const [sel, setSel] = useState(3);
  const [showTrend, setShowTrend] = useState(false);
  const wk = WEEKS[week];
  const prevWk = week > 0 ? WEEKS[week-1] : null;
  const dom = wk.probs.reduce((a,b)=>a.v>b.v?a:b);
  const domSc = SCENARIOS.find(s=>s.id===dom.sc);
  const selDrivers = WEEK_DRIVERS[sel] || {};
  const trendSc = SCENARIOS.find(s=>s.id===(wk.trendSc||dom.sc));
  const trendDriversList = wk.trendDrivers || [];
  const isSameTrend = (wk.trendSc||dom.sc) === dom.sc;
  const trendIconMap = { up:"↑", down:"↓", flat:"→" };
  const trendColorMap = { up:"#22c55e", down:"#ef4444", flat:MUTED };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* ── ROW 1: Matrix + Sidebar ── */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 320px", gap:14 }}>

        {/* Matrix SVG */}
        <div>
          <div style={{ border:`1px solid ${BORDER}`, position:"relative" }}>
            <FullMatrix weekIdx={week} onClickWeek={setWeek} onArrowClick={() => setShowTrend(!showTrend)} />
          </div>

          {/* ── TREND PANEL (appears when arrow is clicked) ── */}
          {showTrend && (
            <div style={{ marginTop:8, background:`linear-gradient(135deg, ${trendSc.color}0a, transparent)`,
              border:`1px solid ${trendSc.color}25`, padding:"14px 18px", position:"relative" }}>
              <button onClick={() => setShowTrend(false)}
                style={{ position:"absolute", top:8, right:12, background:"transparent", border:"none",
                  color:MUTED, cursor:"pointer", fontSize:16, fontFamily:font }}>×</button>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:16 }}>{isSameTrend ? "→" : "↑"}</span>
                <div>
                  <div style={{ fontSize:12, fontFamily:font, color:trendSc.color, letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700 }}>
                    {isSameTrend ? "CONSOLIDANDO" : "PRESIÓN HACIA TRANSICIÓN"}
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:TEXT }}>
                    E{trendSc.id}: {trendSc.name}
                  </div>
                </div>
                <span style={{ marginLeft:"auto", fontSize:14, fontFamily:font, color:trendSc.color, fontWeight:700 }}>
                  {wk.probs.find(p=>p.sc===trendSc.id)?.v}%
                </span>
              </div>
              <div style={{ fontSize:12, fontFamily:font, color:trendSc.color, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>
                Factores que empujan en esta dirección
              </div>
              {trendDriversList.map((d,i) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:5, fontSize:13, color:"#3d4f5f", lineHeight:1.6 }}>
                  <span style={{ color:trendSc.color, flexShrink:0 }}>›</span>{d}
                </div>
              ))}
            </div>
          )}

          {/* Probability bars below matrix */}
          <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:6 }}>
            {wk.probs.map(p => {
              const sc = SCENARIOS.find(s=>s.id===p.sc);
              const delta = prevWk ? p.v - (prevWk.probs.find(pp=>pp.sc===p.sc)?.v||0) : null;
              return (
                <div key={p.sc} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"3px 0" }} onClick={()=>setSel(p.sc)}>
                  <span style={{ fontSize:13, fontFamily:font, color:sc.color, width:22, fontWeight:sel===p.sc?700:400 }}>E{sc.id}</span>
                  <div style={{ flex:1, height:6, background:BORDER, borderRadius:2 }}>
                    <div style={{ height:6, background:sc.color, width:`${p.v}%`, borderRadius:2, transition:"width 0.4s", opacity:sel===p.sc?1:0.6 }} />
                  </div>
                  <span style={{ fontSize:14, fontFamily:font, color:sc.color, width:32, textAlign:"right", fontWeight:700 }}>{p.v}%</span>
                  {delta !== null && delta !== 0 && (
                    <span style={{ fontSize:12, fontFamily:font, color:delta>0?"#22c55e":"#ef4444", width:32 }}>
                      {delta>0?"+":""}{delta}pp
                    </span>
                  )}
                  <span style={{ fontSize:12, color:trendColorMap[p.t] }}>{trendIconMap[p.t]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Scenario cards + detail */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {SCENARIOS.map(sc => {
            const p = wk.probs.find(p=>p.sc===sc.id);
            const isActive = sel === sc.id;
            return (
              <div key={sc.id} onClick={()=>setSel(sc.id)}
                style={{ background:isActive?`${sc.color}08`:BG2, border:`1px solid ${isActive?sc.color:BORDER}`, borderLeft:`3px solid ${sc.color}`,
                  padding:"10px 14px", cursor:"pointer", transition:"all 0.2s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                  <span style={{ fontSize:12, fontFamily:font, color:sc.color, letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700 }}>
                    E{sc.id} {p.sc===dom.sc?"· DOMINANTE":""}
                  </span>
                  <span style={{ fontSize:15, fontFamily:font, fontWeight:700, color:sc.color }}>{p.v}%</span>
                </div>
                <div style={{ fontSize:14, fontWeight:600, color:isActive?TEXT:`${TEXT}90`, lineHeight:1.3 }}>{sc.name}</div>
              </div>
            );
          })}

          {/* Detail panel for selected scenario */}
          <div style={{ background:BG3, border:`1px solid ${BORDER}`, padding:"14px 16px", flex:1 }}>
            <div style={{ fontSize:12, fontFamily:"'Syne',sans-serif", fontWeight:700, color:SC[sel], letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
              E{sel} — {SCENARIOS.find(s=>s.id===sel)?.name}
            </div>
            {selDrivers.drivers && (
              <>
                <div style={{ fontSize:10, fontFamily:font, color:SC[sel], letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>
                  Drivers estructurales
                </div>
                {selDrivers.drivers.map((d,i) => (
                  <div key={i} style={{ display:"flex", gap:6, marginBottom:4, fontSize:13, color:"#3d4f5f", lineHeight:1.5 }}>
                    <span style={{ color:`${SC[sel]}80`, flexShrink:0 }}>›</span>{d}
                  </div>
                ))}
              </>
            )}
            {selDrivers.signals && (
              <>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginTop:10, marginBottom:6 }}>
                  Señales de activación
                </div>
                {selDrivers.signals.map((s,i) => (
                  <div key={i} style={{ display:"flex", gap:6, marginBottom:4, fontSize:13, color:"#6b7280", lineHeight:1.5 }}>
                    <span style={{ color:`${MUTED}80`, flexShrink:0 }}>›</span>{s}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 2: Weekly evolution chart ── */}
      <div style={{ border:`1px solid ${BORDER}`, padding:"14px 16px" }}>
        <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:12 }}>
          Evolución de probabilidades por semana
        </div>
        <div style={{ display:"flex", gap:3, alignItems:"flex-end", height:90 }}>
          {WEEKS.map((w,i) => (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer" }}
              onClick={() => setWeek && setWeek(i)}>
              {/* Stacked bars */}
              <div style={{ display:"flex", flexDirection:"column", gap:1, width:"85%", alignItems:"center" }}>
                {w.probs.slice().sort((a,b)=>b.v-a.v).map(p => (
                  <div key={p.sc} style={{ width:"100%", height:Math.max(2, p.v*0.7), background:SC[p.sc], borderRadius:1,
                    opacity:i===week?1:0.4, transition:"opacity 0.2s" }} />
                ))}
              </div>
              {/* Label */}
              <span style={{ fontSize:10, fontFamily:font, color:i===week?ACCENT:MUTED, marginTop:6, fontWeight:i===week?700:400 }}>
                {w.short}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:14, marginTop:10, justifyContent:"center" }}>
          {SCENARIOS.map(sc => (
            <div key={sc.id} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:MUTED }}>
              <span style={{ width:8, height:8, background:sc.color, borderRadius:1, flexShrink:0 }} />
              E{sc.id}: {sc.short}
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 3: Lectura analítica ── */}
      {wk.lectura && (
        <div style={{ background:`linear-gradient(135deg, ${domSc.color}06, transparent)`, border:`1px solid ${domSc.color}15`, padding:"16px 20px" }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:10 }}>
            <span style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase" }}>
              Lectura analítica · {wk.label}
            </span>
            <span style={{ fontSize:14, fontWeight:700, color:domSc.color }}>E{domSc.id}: {domSc.name} · {dom.v}%</span>
          </div>
          <div style={{ fontSize:14, color:"#3d4f5f", lineHeight:1.75, fontStyle:"italic" }}>
            {wk.lectura}
          </div>
        </div>
      )}
    </div>
  );
}

function TabMonitor() {
  const mob = useIsMobile();
  const [seccion, setSeccion] = useState("indicadores");
  const [expanded, setExpanded] = useState(null);
  const dims = [...new Set(INDICATORS.map(i=>i.dim))];
  const grouped = dims.map(d => ({ dim:d, icon:INDICATORS.find(i=>i.dim===d).icon, inds:INDICATORS.filter(i=>i.dim===d) }));

  const trendIconMap = { up:"↑", down:"↓", flat:"→", stable:"→" };
  const trendColorMap = { up:"#22c55e", down:"#ef4444", flat:MUTED, stable:MUTED };

  // Count latest semaforos (filter out nulls for new indicators)
  const latest = INDICATORS.map(ind => ind.hist.filter(h => h !== null).pop()).filter(Boolean).map(h => h[0]);
  const indCounts = { green:latest.filter(s=>s==="green").length, yellow:latest.filter(s=>s==="yellow").length, red:latest.filter(s=>s==="red").length };

  // Count scenario signals
  const allSignals = SCENARIO_SIGNALS.flatMap(g => g.signals);
  const sigCounts = { green:allSignals.filter(s=>s.sem==="green").length, yellow:allSignals.filter(s=>s.sem==="yellow").length, red:allSignals.filter(s=>s.sem==="red").length };

  const counts = seccion === "senales" ? sigCounts : indCounts;
  const total = counts.green + counts.yellow + counts.red;

  return (
    <div>
      {/* Header + toggle */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>🚦</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600, color:TEXT }}>Monitor de Señales — {seccion === "senales" ? `${allSignals.length} señales · ${SCENARIO_SIGNALS.length} escenarios` : `${INDICATORS.length} indicadores · ${MONITOR_WEEKS.length} semanas`}</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED }}>Semáforos, umbrales y señales por escenario</div>
        </div>
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}`, flexWrap:"wrap" }}>
          {[{id:"indicadores",label:"Indicadores"},{id:"senales",label:"Señales E1/E2/E3/E4"},{id:"noticias",label:"Noticias"},{id:"factcheck",label:"Verificación"}].map(s => (
            <button key={s.id} onClick={() => setSeccion(s.id)}
              style={{ fontSize:12, fontFamily:font, padding:"6px 14px", border:"none",
                background:seccion===s.id?ACCENT:"transparent", color:seccion===s.id?"#fff":MUTED,
                cursor:"pointer", letterSpacing:"0.08em" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[{label:"Verde",count:counts.green,color:"green",desc:"Estables / confirmados"},
          {label:"Amarillo",count:counts.yellow,color:"yellow",desc:"En monitoreo"},
          {label:"Rojo",count:counts.red,color:"red",desc:"Alerta activa"},
          {label:"Total",count:total,color:ACCENT,desc:seccion==="senales"?`${SCENARIO_SIGNALS.length} escenarios`:`${dims.length} dimensiones`}
        ].map((c,i) => (
          <Card key={i} accent={typeof c.color==="string"&&c.color.startsWith("#")?c.color:SEM[c.color]}>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>{c.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:typeof c.color==="string"&&c.color.startsWith("#")?c.color:SEM[c.color], fontFamily:"'Syne',sans-serif" }}>{c.count}</div>
            <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>{c.desc}</div>
          </Card>
        ))}
      </div>

      {/* ── INDICADORES ── */}
      {seccion === "indicadores" && grouped.map(g => (
        <div key={g.dim} style={{ marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
            <span style={{ fontSize:16 }}>{g.icon}</span>
            <span style={{ fontSize:12, fontWeight:700, fontFamily:"'Syne',sans-serif", color:ACCENT, letterSpacing:"0.1em", textTransform:"uppercase" }}>{g.dim}</span>
            <span style={{ fontSize:12, color:MUTED, marginLeft:"auto" }}>{g.inds.length} indicadores</span>
          </div>
          {/* Column headers */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr auto":"1fr 100px auto 80px 40px", gap:8, padding:"2px 0 6px", borderBottom:`1px solid ${BORDER}30` }}>
            <span style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Indicador</span>
            <span style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Historial</span>
            <span style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Valor actual</span>
            <span style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Estado</span>
            <span style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", textAlign:"center" }}>Tend.</span>
          </div>
          {g.inds.map((ind,j) => {
            const lastEntry = ind.hist.filter(h => h !== null).pop();
            if (!lastEntry) return null;
            const sem = lastEntry[0], trend = lastEntry[1], val = lastEntry[2];
            const isNew = !!ind.addedWeek;
            const isExpanded = expanded === `${g.dim}-${j}`;
            return (
              <div key={j} style={{ borderBottom:`1px solid ${BORDER}30` }}>
                <div style={{ display:"grid", gridTemplateColumns:mob?"1fr auto":"1fr 100px auto 80px 40px", gap:8, padding:"8px 0", alignItems:"center",
                  cursor:"pointer" }} onClick={() => setExpanded(isExpanded ? null : `${g.dim}-${j}`)}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:14, fontWeight:600, color:TEXT }}>{ind.name}</span>
                      <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${SC[ind.esc.charAt(1)]||ACCENT}15`,
                        color:SC[ind.esc.charAt(1)]||ACCENT, border:`1px solid ${SC[ind.esc.charAt(1)]||ACCENT}30`, letterSpacing:"0.08em" }}>
                        {ind.esc}
                      </span>
                      {isNew && <span style={{ fontSize:8, fontFamily:font, padding:"1px 6px", background:"#22c55e18",
                        color:"#16a34a", border:"1px solid #22c55e30", letterSpacing:"0.12em", fontWeight:700 }}>NUEVO</span>}
                    </div>
                  </div>
                  {/* History dots */}
                  <div style={{ display:"flex", gap:3, alignItems:"center" }}>
                    {ind.hist.map((h,k) => (
                      <div key={k} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
                        <div style={{ fontSize:5, color:MUTED, fontFamily:font }}>{MONITOR_WEEKS[k]}</div>
                        {h ? <div style={{ width:7, height:7, borderRadius:"50%", background:SEM[h[0]],
                          boxShadow:k===ind.hist.length-1?`0 0 4px ${SEM[h[0]]}`:"none",
                          opacity:0.4+(k/ind.hist.length)*0.6 }} />
                        : <div style={{ width:7, height:7, borderRadius:"50%", background:`${BORDER}60`, opacity:0.3 }} />}
                      </div>
                    ))}
                  </div>
                  {/* Current value */}
                  <div style={{ fontSize:13, fontFamily:font, color:SEM[sem], maxWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{val}</div>
                  {/* Semaforo */}
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <SemDot color={sem} size={7} />
                    <span style={{ fontSize:12, fontFamily:font, color:SEM[sem] }}>{{green:"Verde",yellow:"Amarillo",red:"Rojo"}[sem]}</span>
                  </div>
                  {/* Trend */}
                  <div style={{ fontSize:16, fontWeight:700, color:trendColorMap[trend], textAlign:"center" }}>
                    {trendIconMap[trend]}
                  </div>
                </div>
                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ padding:"4px 0 12px 16px", borderLeft:`2px solid ${SC[ind.esc.charAt(1)]||ACCENT}30` }}>
                    <div style={{ fontSize:13, color:"#3d4f5f", marginBottom:6 }}>{ind.desc}</div>
                    <div style={{ fontSize:12, fontFamily:font, color:"#a17d08", marginBottom:8, padding:"4px 8px", background:"rgba(234,179,8,0.06)", border:"1px solid rgba(234,179,8,0.15)", display:"inline-block" }}>
                      ⚠ {ind.umbral}
                    </div>
                    <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Historial</div>
                    <div style={{ display:"flex", gap:6 }}>
                      {ind.hist.map((h,k) => (
                        <div key={k} style={{ fontSize:12, padding:"3px 8px", background:`${SEM[h[0]]}10`, border:`1px solid ${SEM[h[0]]}25`,
                          color:SEM[h[0]], fontFamily:font, whiteSpace:"nowrap" }}>
                          <span style={{ color:MUTED, marginRight:4 }}>{MONITOR_WEEKS[k]}</span>{h[2]}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* ── SEÑALES POR ESCENARIO ── */}
      {seccion === "senales" && SCENARIO_SIGNALS.map(group => {
        const sc = SCENARIOS.find(s => s.id === parseInt(group.esc.charAt(1)));
        const gCounts = { green:group.signals.filter(s=>s.sem==="green").length, yellow:group.signals.filter(s=>s.sem==="yellow").length, red:group.signals.filter(s=>s.sem==="red").length };
        return (
          <div key={group.esc} style={{ marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${sc?.color||BORDER}40` }}>
              <span style={{ fontSize:12, fontWeight:700, color:sc?.color, fontFamily:"'Syne',sans-serif" }}>
                {group.esc}: {sc?.name}
              </span>
              <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                {[["green",gCounts.green],["yellow",gCounts.yellow],["red",gCounts.red]].filter(([,c])=>c>0).map(([col,cnt]) => (
                  <span key={col} style={{ fontSize:12, fontFamily:font, color:SEM[col] }}>{cnt} {{green:"✓",yellow:"⚠",red:"✗"}[col]}</span>
                ))}
              </div>
            </div>
            {group.signals.map((sig,i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:mob?"1fr auto":"1fr 180px 80px", gap:8, padding:"6px 0", borderBottom:`1px solid ${BORDER}30`, alignItems:"center" }}>
                <span style={{ fontSize:14, color:TEXT, display:"flex", alignItems:"center", gap:6 }}>
                  {sig.name}
                  {sig.isNew && <span style={{ fontSize:8, fontFamily:font, padding:"1px 6px", background:"#22c55e18",
                    color:"#16a34a", border:"1px solid #22c55e30", letterSpacing:"0.12em", fontWeight:700, flexShrink:0 }}>NUEVO</span>}
                </span>
                <span style={{ fontSize:13, fontFamily:font, color:SEM[sig.sem] }}>{sig.val}</span>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <SemDot color={sig.sem} size={7} />
                  <span style={{ fontSize:12, fontFamily:font, color:SEM[sig.sem] }}>{{green:"Activa",yellow:"Parcial",red:"Bloqueada"}[sig.sem]}</span>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* ── NOTICIAS ── */}
      {seccion === "noticias" && <MonitorNoticias />}

      {/* ── VERIFICACIÓN ── */}
      {seccion === "factcheck" && <MonitorFactCheck />}
    </div>
  );
}

function MonitorNoticias() {
  const [liveNews, setLiveNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [weekFilter, setWeekFilter] = useState("all");
  const [source, setSource] = useState("loading");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const BLOCKED_SOURCES = ["2001 Online", "2001Online", "2001online"];

  useEffect(() => {
    const filterBlocked = (articles) => articles.filter(a => !BLOCKED_SOURCES.some(b => (a.source||"").toLowerCase().includes(b.toLowerCase())));
    async function fetchNews() {
      if (IS_DEPLOYED) {
        try {
          const res = await fetch("/api/articles?type=news&limit=30", { signal: AbortSignal.timeout(8000) });
          if (res.ok) { const data = await res.json(); if (data.articles?.length) { setLiveNews(filterBlocked(data.articles.map(a => ({...a, date:a.published_at, isLive:true})))); setSource("supabase"); setLoading(false); return; } }
        } catch {}
        try {
          const res = await fetch("/api/news", { signal: AbortSignal.timeout(12000) });
          if (res.ok) { const data = await res.json(); if (data.news?.length) { setLiveNews(filterBlocked(data.news.map(n => ({...n, isLive:true})))); setSource("live"); setLoading(false); return; } }
        } catch {}
      }
      setSource("curated"); setLoading(false);
    }
    fetchNews();
  }, []);

  const escColors = { E1:"#4C9F38", E2:"#E5243B", E3:"#0A97D9", E4:"#b8860b" };
  const dimColors = { "Energético":"#0A97D9", "Político":"#4C9F38", "Económico":"#b8860b", "Internacional":"#9B59B6" };
  const dimIcons = { "Energético":"⚡", "Político":"🏛", "Económico":"📊", "Internacional":"🌐" };

  // Merge curated + live, deduplicate by title similarity, sort by date desc
  const allNews = [...liveNews, ...CURATED_NEWS.map(n => ({...n, isCurated:true}))];
  const seen = new Set();
  const deduped = allNews.filter(n => {
    const key = n.title.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = deduped.filter(n => {
    if (filter !== "all" && !(n.scenarios||n.tags||[]).includes(filter)) return false;
    if (weekFilter !== "all" && n.week !== weekFilter && !n.isLive) return false;
    return true;
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const weeks = [...new Set(CURATED_NEWS.map(n => n.week))];

  return (
    <div>
      {/* Filter */}
      <div style={{ display:"flex", gap:6, marginBottom:12, alignItems:"center", flexWrap:"wrap" }}>
        <Badge color={source==="supabase"||source==="live"?"#22c55e":source==="curated"?"#0468B1":"#ef4444"}>
          {source==="supabase"?"EN VIVO + ARCHIVO":source==="live"?"EN VIVO + ARCHIVO":source==="curated"?"ARCHIVO":"OFFLINE"}
        </Badge>
        {["all","E1","E2","E3","E4"].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            style={{ fontSize:12, fontFamily:font, padding:"3px 10px", border:`1px solid ${f==="all"?BORDER:escColors[f]||BORDER}`,
              background:filter===f?(f==="all"?ACCENT:escColors[f]):"transparent",
              color:filter===f?"#fff":(f==="all"?MUTED:escColors[f]||MUTED), cursor:"pointer", borderRadius:0 }}>
            {f === "all" ? "Todas" : f}
          </button>
        ))}
        <select value={weekFilter} onChange={e => { setWeekFilter(e.target.value); setPage(1); }}
          style={{ fontSize:11, fontFamily:font, padding:"3px 8px", border:`1px solid ${BORDER}`, background:"transparent", color:MUTED, cursor:"pointer" }}>
          <option value="all">Todas las semanas</option>
          {weeks.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <span style={{ fontSize:12, color:MUTED, marginLeft:"auto" }}>{filtered.length} noticias · pág {page}/{totalPages||1}</span>
      </div>
      {/* News list */}
      {loading ? (
        <Card><div style={{ textAlign:"center", padding:30, color:MUTED, fontSize:13, fontFamily:font }}>
          Cargando noticias de Venezuela...
        </div></Card>
      ) : filtered.length === 0 ? (
        <Card><div style={{ textAlign:"center", padding:20, color:MUTED, fontSize:13 }}>No se encontraron noticias</div></Card>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {paginated.map((n,i) => (
            <a key={i} href={n.link||"#"} target={n.link?"_blank":undefined} rel="noopener noreferrer" style={{ textDecoration:"none" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, padding:"10px 0", borderBottom:`1px solid ${BORDER}30`,
                cursor:n.link?"pointer":"default" }}
                onMouseEnter={e=>e.currentTarget.style.background=`${BG3}`}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:TEXT, lineHeight:1.4, marginBottom:4 }}>{n.title}</div>
                  <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, fontFamily:font, color:ACCENT }}>{n.source}</span>
                    {n.date && <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>
                      {new Date(n.date).toLocaleDateString("es",{day:"numeric",month:"short"})}
                    </span>}
                    {n.week && <span style={{ fontSize:8, fontFamily:font, padding:"1px 5px", background:`${ACCENT}12`,
                      color:ACCENT, border:`1px solid ${ACCENT}25`, letterSpacing:"0.08em" }}>{n.week}</span>}
                    {n.isLive && <span style={{ fontSize:8, fontFamily:font, padding:"1px 5px", background:"#22c55e15",
                      color:"#16a34a", border:"1px solid #22c55e30", letterSpacing:"0.08em" }}>EN VIVO</span>}
                    {n.scenarios?.map((t,k) => (
                      <span key={`sc${k}`} style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${escColors[t]||ACCENT}15`,
                        color:escColors[t]||ACCENT, border:`1px solid ${escColors[t]||ACCENT}30` }}>{t}</span>
                    ))}
                    {n.tags?.map((t,k) => (
                      <span key={`s${k}`} style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${escColors[t]||ACCENT}15`,
                        color:escColors[t]||ACCENT, border:`1px solid ${escColors[t]||ACCENT}30` }}>{t}</span>
                    ))}
                    {n.dims?.map((d,k) => (
                      <span key={`d${k}`} style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${dimColors[d]||MUTED}15`,
                        color:dimColors[d]||MUTED, border:`1px solid ${dimColors[d]||MUTED}30` }}>{dimIcons[d]||""} {d}</span>
                    ))}
                  </div>
                  {n.desc && <div style={{ fontSize:12, color:MUTED, marginTop:4, lineHeight:1.4 }}>{n.desc}</div>}
                </div>
                <span style={{ fontSize:12, color:ACCENT, fontFamily:font, whiteSpace:"nowrap" }}>{n.link ? "↗" : ""}</span>
              </div>
            </a>
          ))}
        </div>
      )}
      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:"flex", justifyContent:"center", gap:4, marginTop:12 }}>
          <button onClick={() => setPage(Math.max(1,page-1))} disabled={page===1}
            style={{ fontSize:12, fontFamily:font, padding:"4px 12px", border:`1px solid ${BORDER}`,
              background:page===1?"transparent":BG2, color:page===1?`${MUTED}50`:MUTED, cursor:page===1?"default":"pointer" }}>← Anterior</button>
          {Array.from({length:totalPages},(_,i)=>i+1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{ fontSize:12, fontFamily:font, padding:"4px 8px", border:`1px solid ${page===p?ACCENT:BORDER}`,
                background:page===p?ACCENT:"transparent", color:page===p?"#fff":MUTED, cursor:"pointer", minWidth:28 }}>{p}</button>
          ))}
          <button onClick={() => setPage(Math.min(totalPages,page+1))} disabled={page===totalPages}
            style={{ fontSize:12, fontFamily:font, padding:"4px 12px", border:`1px solid ${BORDER}`,
              background:page===totalPages?"transparent":BG2, color:page===totalPages?`${MUTED}50`:MUTED, cursor:page===totalPages?"default":"pointer" }}>Siguiente →</button>
        </div>
      )}
      <div style={{ fontSize:9, fontFamily:font, color:`${MUTED}60`, marginTop:10 }}>
        Fuentes: Efecto Cocuyo · El Pitazo · Runrunes · Tal Cual · El Estímulo · Caracas Chronicles · Tags por keywords
      </div>
    </div>
  );
}


// Fact-check tweet data — update weekly from @cazamosfakenews, @cotejoinfo, @EsPajaVe, @_provea

function TwitterTimeline({ handle, height=280 }) {
  const ref = useCallback((node) => {
    if (!node) return;
    node.innerHTML = "";
    const a = document.createElement("a");
    a.className = "twitter-timeline";
    a.href = `https://twitter.com/${handle}`;
    a.setAttribute("data-theme", "light");
    a.setAttribute("data-chrome", "noheader nofooter noborders");
    a.setAttribute("data-height", String(height));
    a.setAttribute("data-tweet-limit", "3");
    a.textContent = `@${handle}`;
    node.appendChild(a);
    if (!window.twttr) {
      const s = document.createElement("script");
      s.src = "https://platform.twitter.com/widgets.js";
      s.async = true;
      document.head.appendChild(s);
    } else {
      window.twttr.widgets.load(node);
    }
  }, [handle, height]);
  return <div ref={ref} style={{ minHeight:height, background:"#fff", borderRadius:4 }} />;
}

function MonitorFactCheck() {
  const mob = useIsMobile();
  const [liveArticles, setLiveArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("loading");
  const [showTwitter, setShowTwitter] = useState(false);
  const [page, setPage] = useState(1);
  const [weekFilter, setWeekFilter] = useState("all");
  const PER_PAGE = 20;

  const FACTCHECK_SOURCES = [
    { name:"Cazamos Fake News", handle:"cazamosfakenews", url:"https://www.cazadoresdefakenews.info", color:"#ef4444" },
    { name:"Cotejo.info", handle:"cotejoinfo", url:"https://cotejo.info", color:"#3b82f6" },
    { name:"EsPaja", handle:"EsPajaVe", url:"https://espaja.com", color:"#f59e0b" },
    { name:"Provea", handle:"_provea", url:"https://provea.org", color:"#9333ea" },
  ];
  const escColors = { E1:"#4C9F38", E2:"#E5243B", E3:"#0A97D9", E4:"#b8860b" };
  const verdictColors = { "Confirmado":"#16a34a", "Parcialmente cierto":"#ca8a04", "Discrepancia":"#ef4444", "Discrepancia >50%":"#ef4444", "Contradictorio":"#ef4444", "Sin verificar":"#6b7280" };

  useEffect(() => {
    async function fetchFactCheck() {
      if (IS_DEPLOYED) {
        try {
          const res = await fetch("/api/articles?type=factcheck&limit=20", { signal: AbortSignal.timeout(8000) });
          if (res.ok) { const data = await res.json(); if (data.articles?.length) { setLiveArticles(data.articles.map(a => ({...a, date:a.published_at, isLive:true}))); setSource("supabase"); setLoading(false); return; } }
        } catch {}
      }
      setSource("curated"); setLoading(false);
    }
    fetchFactCheck();
  }, []);

  // Merge curated + live
  const allArticles = [...liveArticles, ...CURATED_FACTCHECK.map(a => ({...a, isCurated:true}))];
  const seen = new Set();
  const articles = allArticles.filter(a => {
    const key = a.title.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).filter(a => weekFilter === "all" || a.week === weekFilter || a.isLive)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const weeks = [...new Set(CURATED_FACTCHECK.map(n => n.week))];

  return (
    <div>
      {/* Source cards */}
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${FACTCHECK_SOURCES.length},1fr)`, gap:8, marginBottom:16 }}>
        {FACTCHECK_SOURCES.map((s,i) => (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
            <div style={{ background:BG2, border:`1px solid ${BORDER}`, borderTop:`2px solid ${s.color}`, padding:"10px 12px", cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=s.color} onMouseLeave={e=>e.currentTarget.style.borderColor=BORDER}>
              <div style={{ fontSize:13, fontWeight:600, color:s.color, marginBottom:2 }}>{s.name}</div>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED }}>@{s.handle}</div>
            </div>
          </a>
        ))}
      </div>

      {/* Twitter Timelines — collapsible, before articles */}
      <div style={{ marginBottom:16 }}>
        <button onClick={() => setShowTwitter(!showTwitter)}
          style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"10px 14px",
            background:BG2, border:`1px solid ${BORDER}`, cursor:"pointer", transition:"border-color 0.2s" }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=ACCENT}
          onMouseLeave={e=>e.currentTarget.style.borderColor=BORDER}>
          <span style={{ fontSize:12 }}>𝕏</span>
          <span style={{ fontSize:13, fontFamily:font, color:TEXT, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" }}>
            Timelines verificadores
          </span>
          <span style={{ fontSize:10, color:MUTED }}>@cazamosfakenews · @cotejoinfo · @EsPajaVe · @_provea</span>
          <span style={{ fontSize:12, color:MUTED, marginLeft:"auto" }}>{showTwitter ? "▲" : "▼"}</span>
        </button>
        {showTwitter && (
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:8, marginTop:8 }}>
            {FACTCHECK_SOURCES.map((s,i) => (
              <div key={i} style={{ background:BG2, border:`1px solid ${BORDER}`, borderTop:`2px solid ${s.color}`, padding:"8px", overflow:"hidden" }}>
                <div style={{ fontSize:12, fontFamily:font, color:s.color, fontWeight:600, marginBottom:4 }}>@{s.handle}</div>
                <TwitterTimeline handle={s.handle} height={280} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RSS Articles */}
      {(() => { const totalPages = Math.ceil(articles.length / PER_PAGE); const paginated = articles.slice((page-1)*PER_PAGE, page*PER_PAGE); return (<>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${BORDER}`, flexWrap:"wrap" }}>
        <span style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase" }}>📰 Artículos de verificación</span>
        <Badge color={source==="supabase"?"#22c55e":source==="curated"?"#0468B1":"#ef4444"}>
          {source==="supabase"?"EN VIVO + ARCHIVO":source==="curated"?"ARCHIVO":"OFFLINE"}
        </Badge>
        <select value={weekFilter} onChange={e => { setWeekFilter(e.target.value); setPage(1); }}
          style={{ fontSize:11, fontFamily:font, padding:"3px 8px", border:`1px solid ${BORDER}`, background:"transparent", color:MUTED, cursor:"pointer" }}>
          <option value="all">Todas las semanas</option>
          {weeks.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <span style={{ fontSize:12, color:MUTED, marginLeft:"auto" }}>{articles.length} artículos · pág {page}/{totalPages||1}</span>
      </div>
      {loading ? (
        <Card><div style={{ textAlign:"center", padding:20, color:MUTED, fontSize:13, fontFamily:font }}>Cargando verificaciones...</div></Card>
      ) : articles.length === 0 ? (
        <Card><div style={{ textAlign:"center", padding:20, color:MUTED, fontSize:13 }}>Sin artículos. Visita los sitios directamente.</div></Card>
      ) : paginated.map((a,i) => (
        <a key={i} href={a.link||"#"} target={a.link?"_blank":undefined} rel="noopener noreferrer" style={{ textDecoration:"none" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, padding:"8px 0", borderBottom:`1px solid ${BORDER}30` }}
            onMouseEnter={e=>e.currentTarget.style.background=BG3} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:TEXT, lineHeight:1.4, marginBottom:3 }}>{a.title}</div>
              <div style={{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
                <span style={{ fontSize:10, fontFamily:font, color:FACTCHECK_SOURCES.find(s=>s.name===a.source)?.color||ACCENT, fontWeight:600 }}>{a.source}</span>
                {a.date && <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>{new Date(a.date).toLocaleDateString("es",{day:"numeric",month:"short"})}</span>}
                {a.week && <span style={{ fontSize:8, fontFamily:font, padding:"1px 5px", background:`${ACCENT}12`,
                  color:ACCENT, border:`1px solid ${ACCENT}25`, letterSpacing:"0.08em" }}>{a.week}</span>}
                {a.verdict && <span style={{ fontSize:8, fontFamily:font, padding:"1px 6px", 
                  background:`${verdictColors[a.verdict]||MUTED}15`,
                  color:verdictColors[a.verdict]||MUTED, 
                  border:`1px solid ${verdictColors[a.verdict]||MUTED}30`, fontWeight:600, letterSpacing:"0.06em" }}>
                  {a.verdict}
                </span>}
                {(a.scenarios||[]).map((t,k) => (
                  <span key={`s${k}`} style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${escColors[t]||ACCENT}15`, color:escColors[t]||ACCENT, border:`1px solid ${escColors[t]||ACCENT}30` }}>{t}</span>
                ))}
                {(a.dims||[]).map((d,k) => (
                  <span key={`d${k}`} style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${{Energético:"#0A97D9",Político:"#4C9F38",Económico:"#b8860b",Internacional:"#9B59B6"}[d]||MUTED}15`,
                    color:{Energético:"#0A97D9",Político:"#4C9F38",Económico:"#b8860b",Internacional:"#9B59B6"}[d]||MUTED }}>
                    {{Energético:"⚡",Político:"🏛",Económico:"📊",Internacional:"🌐"}[d]||""} {d}
                  </span>
                ))}
              </div>
            </div>
            <span style={{ fontSize:12, color:ACCENT, fontFamily:font }}>{a.link ? "↗" : ""}</span>
          </div>
        </a>
      ))}
      {totalPages > 1 && (
        <div style={{ display:"flex", justifyContent:"center", gap:4, marginTop:12 }}>
          <button onClick={() => setPage(Math.max(1,page-1))} disabled={page===1}
            style={{ fontSize:12, fontFamily:font, padding:"4px 12px", border:`1px solid ${BORDER}`,
              background:page===1?"transparent":BG2, color:page===1?`${MUTED}50`:MUTED, cursor:page===1?"default":"pointer" }}>← Anterior</button>
          {Array.from({length:totalPages},(_,i)=>i+1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{ fontSize:12, fontFamily:font, padding:"4px 8px", border:`1px solid ${page===p?ACCENT:BORDER}`,
                background:page===p?ACCENT:"transparent", color:page===p?"#fff":MUTED, cursor:"pointer", minWidth:28 }}>{p}</button>
          ))}
          <button onClick={() => setPage(Math.min(totalPages,page+1))} disabled={page===totalPages}
            style={{ fontSize:12, fontFamily:font, padding:"4px 12px", border:`1px solid ${BORDER}`,
              background:page===totalPages?"transparent":BG2, color:page===totalPages?`${MUTED}50`:MUTED, cursor:page===totalPages?"default":"pointer" }}>Siguiente →</button>
        </div>
      )}
      </>); })()}
    </div>
  );
}



function TabGdelt() {
  const mob = useIsMobile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("loading");
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null); setSource("loading");
    try {
      const live = await fetchAllGdelt();
      if (live && live.length > 10) { setData(live); setSource("live"); }
      else { setData(generateMockGdelt()); setSource("mock"); setError("GDELT no respondió — datos simulados"); }
    } catch (e) { setData(generateMockGdelt()); setSource("mock"); setError(`Fallback: ${e.message}`); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Compute KPI stats (like Umbral)
  const stats = useMemo(() => {
    if (!data || data.length < 30) return { instDelta:null, tone:null, phase:null };
    const baseline = data.slice(0, 30);
    const recent = data.slice(-14);
    const baseAvg = baseline.reduce((s,d) => s+(d.instability||0), 0) / baseline.length;
    const recentAvg = recent.reduce((s,d) => s+(d.instability||0), 0) / recent.length;
    const instDelta = baseAvg > 0 ? ((recentAvg-baseAvg)/baseAvg)*100 : null;
    const tone = data[data.length-1]?.tone ?? null;
    // Composite phase
    const rI = recent.reduce((s,d) => s+(d.instability||0), 0) / recent.length;
    const rT = recent.reduce((s,d) => s+(d.tone||0), 0) / recent.length;
    const rA = recent.reduce((s,d) => s+(d.artvolnorm||0), 0) / recent.length;
    const clamp = (v,mn,mx) => Math.min(mx,Math.max(mn,v));
    const composite = (clamp(rI/6,0,1) + clamp(-rT/8,0,1) + clamp(rA/4,0,1)) / 3;
    const phase = composite > 0.6 ? "CRISIS" : composite > 0.35 ? "ELEVADO" : "ESTABLE";
    return { instDelta, tone, phase };
  }, [data]);

  const tierColor = { CRITICAL:"#ff2222", HIGH:"#ff7733", MEDIUM:"#c49000", LOW:"#0e7490" };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>📡</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:TEXT, fontFamily:"'Syne',sans-serif", letterSpacing:"0.05em", textTransform:"uppercase" }}>Cobertura Mediática Internacional</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED }}>
            Señales mediáticas en tiempo real del Proyecto GDELT monitoreando la cobertura sobre Venezuela
          </div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {source === "mock" && !loading && (
            <button onClick={loadData} style={{ fontSize:12, fontFamily:font, padding:"4px 10px", background:"transparent",
              border:`1px solid ${ACCENT}40`, color:ACCENT, cursor:"pointer" }}>↻ Reintentar</button>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", border:`1px solid ${source==="live"?"#22c55e30":source==="mock"?"#a17d0830":"#4a709030"}` }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:source==="live"?"#22c55e":source==="mock"?"#a17d08":"#4a7090",
              boxShadow:source==="live"?"0 0 6px #22c55e":"none", animation:source==="live"?"pulse 1.5s infinite":"none" }} />
            <span style={{ fontSize:12, fontFamily:font, color:source==="live"?"#22c55e":source==="mock"?"#a17d08":"#4a7090" }}>
              {source==="live"?"EN VIVO":source==="mock"?"SIMULADO":"..."}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ fontSize:12, fontFamily:font, color:"#a17d08", padding:"6px 12px",
          background:"rgba(234,179,8,0.08)", border:"1px solid rgba(234,179,8,0.2)", marginBottom:12 }}>
          ⚠ {error}
        </div>
      )}

      {/* Explanation */}
      <Card accent={ACCENT} style={{ marginBottom:14 }}>
        <div style={{ fontSize:13, color:TEXT, lineHeight:1.7 }}>
          <strong>¿Qué es esto?</strong> Este panel analiza cómo los medios de comunicación internacionales cubren Venezuela. Usa el <strong>Proyecto GDELT</strong>, que procesa miles de noticias diarias y mide: <strong style={{ color:"#ff3b3b" }}>Conflicto</strong> (cuánto se habla de inestabilidad), <strong style={{ color:"#0e7490" }}>Tono</strong> (si la cobertura es positiva o negativa), y <strong style={{ color:"#c49000" }}>Atención</strong> (volumen de noticias). Cambios bruscos pueden indicar eventos significativos.
        </div>
      </Card>

      {loading ? (
        <Card><div style={{ textAlign:"center", padding:40, color:MUTED, fontSize:14, fontFamily:font }}>
          <div style={{ fontSize:20, marginBottom:8 }}>📡</div>
          Conectando con GDELT DOC API v2...
        </div></Card>
      ) : data ? (<>
        {/* KPI Cards */}
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
          <Card accent={stats.instDelta>0?"#ff3b3b":"#7c3aed"}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Inestabilidad Δ</div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:12 }}>{stats.instDelta>0?"📈":"📉"}</span>
              <span style={{ fontSize:20, fontWeight:800, fontFamily:"'Playfair Display',serif",
                color:stats.instDelta>0?"#ff3b3b":"#7c3aed" }}>
                {stats.instDelta!==null ? `${stats.instDelta>0?"+":""}${stats.instDelta.toFixed(1)}%` : "—"}
              </span>
            </div>
            <div style={{ fontSize:10, color:MUTED, marginTop:2 }}>vs línea base dic 2025</div>
          </Card>
          <Card accent={(stats.tone||0)<-5?"#ff3b3b":(stats.tone||0)<-2?"#f59e0b":"#7c3aed"}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Tono Mediático</div>
            <span style={{ fontSize:20, fontWeight:800, fontFamily:"'Playfair Display',serif",
              color:(stats.tone||0)<-5?"#ff3b3b":(stats.tone||0)<-2?"#f59e0b":"#7c3aed" }}>
              {stats.tone!==null ? stats.tone.toFixed(2) : "—"}
            </span>
            <div style={{ fontSize:10, color:MUTED, marginTop:2 }}>Actual</div>
          </Card>
          <Card accent={stats.phase==="CRISIS"?"#ff3b3b":stats.phase==="ELEVADO"?"#f59e0b":"#7c3aed"}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Señal Compuesta</div>
            <span style={{ fontSize:20, fontWeight:800, fontFamily:"'Playfair Display',serif",
              color:stats.phase==="CRISIS"?"#ff3b3b":stats.phase==="ELEVADO"?"#f59e0b":"#7c3aed" }}>
              {stats.phase || "—"}
            </span>
            <div style={{ fontSize:10, color:MUTED, marginTop:2 }}>Incluye inestabilidad, tono y oleada</div>
          </Card>
        </div>

        {/* Chart */}
        <Card><GdeltChart data={data} /></Card>

        {/* Event Timeline */}
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:13, fontWeight:700, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
            Línea de Tiempo de Eventos
          </div>
          {GDELT_ANNOTATIONS.map((a,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px",
              transition:"background 0.15s", cursor:"default", borderBottom:`1px solid ${BORDER}20` }}
              onMouseEnter={e=>e.currentTarget.style.background=`${BG3}`}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ width:10, height:10, borderRadius:"50%", background:tierColor[a.tier], flexShrink:0,
                boxShadow:`0 0 8px ${tierColor[a.tier]}50`, border:`2px solid ${BG}` }} />
              <span style={{ fontSize:13, fontFamily:font, color:MUTED, minWidth:100 }}>
                {new Date(a.date+"T00:00").toLocaleDateString("es",{day:"numeric",month:"short",year:"numeric"})}
              </span>
              <span style={{ fontSize:14, color:TEXT, flex:1 }}>{a.label}</span>
              <span style={{ fontSize:10, fontFamily:font, fontWeight:700, padding:"2px 8px", letterSpacing:"0.1em",
                color:tierColor[a.tier], background:`${tierColor[a.tier]}12`, border:`1px solid ${tierColor[a.tier]}30`,
                minWidth:60, textAlign:"center" }}>{a.tierEs}</span>
            </div>
          ))}
        </div>

        {/* Signal descriptions */}
        <div style={{ marginTop:16, display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:12 }}>
          <Card accent="#ff3b3b">
            <div style={{ fontSize:13, fontWeight:600, color:"#ff3b3b", marginBottom:6 }}>● Índice de Conflicto</div>
            <div style={{ fontSize:13, color:MUTED, lineHeight:1.6 }}>
              Volumen normalizado de artículos con Venezuela + conflicto/protesta/crisis/violencia. <span style={{color:"#ff3b3b"}}>Eje izquierdo · Línea sólida</span>
            </div>
          </Card>
          <Card accent="#c49000">
            <div style={{ fontSize:13, fontWeight:600, color:"#c49000", marginBottom:6 }}>● Oleada de Atención</div>
            <div style={{ fontSize:13, color:MUTED, lineHeight:1.6 }}>
              Atención mediática normalizada. Mide la intensidad del interés internacional. <span style={{color:"#c49000"}}>Eje izquierdo · Línea sólida</span>
            </div>
          </Card>
          <Card accent="#0e7490">
            <div style={{ fontSize:13, fontWeight:600, color:"#0e7490", marginBottom:6 }}>● Tono Mediático</div>
            <div style={{ fontSize:13, color:MUTED, lineHeight:1.6 }}>
              Sentimiento promedio de cobertura internacional (-10 a +2). Negativo = conflictivo. <span style={{color:"#0e7490"}}>Eje derecho · Línea punteada</span>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div style={{ marginTop:12, fontSize:10, fontFamily:font, color:`${MUTED}60`, lineHeight:1.8, display:"flex", justifyContent:"space-between" }}>
          <span>📡 Fuente: GDELT Project DOC API v2 · 3 queries paralelas via CORS proxy</span>
          <span>Última actualización: {new Date().toLocaleString("es",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span>
        </div>
      </>) : (
        <Card><div style={{ color:MUTED, fontSize:14, textAlign:"center", padding:20 }}>No se pudieron obtener datos</div></Card>
      )}
    </div>
  );
}

function TVMarketQuotes({ title, height=350, groups }) {
  const containerId = useMemo(() => `tvmq-${Math.random().toString(36).slice(2,8)}`, []);
  
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    wrapper.appendChild(widgetDiv);
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: height,
      symbolsGroups: groups,
      showSymbolLogo: true,
      isTransparent: true,
      colorTheme: "light",
      locale: "es",
    });
    wrapper.appendChild(script);
    container.appendChild(wrapper);
  }, [containerId, height, groups]);

  return (
    <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:"12px", overflow:"hidden" }}>
      <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>
        {title} · En vivo
      </div>
      <div id={containerId} style={{ width:"100%", height }} />
    </div>
  );
}

function MarketOverviewWidget() {
  const mob = useIsMobile();
  const containerRef = useCallback((node) => {
    if (!node) return;
    node.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    wrapper.appendChild(widgetDiv);
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "light",
      dateRange: "1M",
      showChart: true,
      locale: "es",
      width: "100%",
      height: "660",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      plotLineColorGrowing: "rgba(34,197,94,1)",
      plotLineColorFalling: "rgba(239,68,68,1)",
      gridLineColor: "rgba(200,210,220,0.5)",
      scaleFontColor: "rgba(90,106,122,1)",
      belowLineFillColorGrowing: "rgba(34,197,94,0.08)",
      belowLineFillColorFalling: "rgba(239,68,68,0.08)",
      belowLineFillColorGrowingBottom: "rgba(34,197,94,0)",
      belowLineFillColorFallingBottom: "rgba(239,68,68,0)",
      symbolActiveColor: "rgba(10,151,217,0.12)",
      tabs: [
        {
          title: "Index",
          symbols: [
            { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
            { s: "FOREXCOM:NSXUSD", d: "NASDAQ" },
            { s: "FOREXCOM:DJI", d: "Dow Jones" },
            { s: "INDEX:DAX", d: "DAX" },
            { s: "TVC:DXY", d: "Dólar Index (DXY)" },
            { s: "TVC:VIX", d: "Volatilidad (VIX)" },
          ]
        },
        {
          title: "Stocks",
          symbols: [
            { s: "NYSE:XOM", d: "Exxon Mobil" },
            { s: "NYSE:CVX", d: "Chevron" },
            { s: "NYSE:SHEL", d: "Shell" },
            { s: "NYSE:E", d: "Eni" },
            { s: "BME:REP", d: "Repsol" },
            { s: "NYSE:BP", d: "BP" },
          ]
        },
        {
          title: "Forex",
          symbols: [
            { s: "FX_IDC:EURUSD", d: "EUR/USD" },
            { s: "FX_IDC:USDCOP", d: "USD/COP" },
            { s: "FX_IDC:USDBRL", d: "USD/BRL" },
            { s: "FX_IDC:USDMXN", d: "USD/MXN" },
            { s: "FX_IDC:USDCNY", d: "USD/CNY" },
            { s: "FX_IDC:USDRUB", d: "USD/RUB" },
          ]
        },
        {
          title: "Crypto",
          symbols: [
            { s: "BITSTAMP:BTCUSD", d: "Bitcoin" },
            { s: "BITSTAMP:ETHUSD", d: "Ethereum" },
            { s: "BINANCE:USDTDAI", d: "USDT/DAI" },
            { s: "COINBASE:SOLUSD", d: "Solana" },
          ]
        },
      ]
    });
    wrapper.appendChild(script);
    node.appendChild(wrapper);
  }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: "12px", minHeight: 400 }}>
        <div style={{ fontSize: 8, fontFamily: font, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
          🌍 Mercados globales · TradingView · Index · Stocks · Forex · Crypto
        </div>
        <div ref={containerRef} />
      </div>
      {/* Commodity & Bond — TradingView Market Quotes widget with free CFD symbols */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:12 }}>
        <TVMarketQuotes
          title="📦 Commodity"
          height={350}
          groups={[
            { name:"Metals", symbols:[
              { name:"CMCMARKETS:GOLD", displayName:"Gold" },
              { name:"CMCMARKETS:SILVER", displayName:"Silver" },
              { name:"CMCMARKETS:COPPER", displayName:"Copper" },
            ]},
          ]}
        />
        <TVMarketQuotes
          title="📊 Bond Yields"
          height={350}
          groups={[
            { name:"US Treasuries", symbols:[
              { name:"FRED:DGS2", displayName:"US 2Y Yield" },
              { name:"FRED:DGS10", displayName:"US 10Y Yield" },
              { name:"FRED:DGS30", displayName:"US 30Y Yield" },
            ]},
            { name:"Europe", symbols:[
              { name:"FRED:IRLTLT01DEM156N", displayName:"Germany 10Y" },
              { name:"FRED:IRLTLT01GBM156N", displayName:"UK 10Y" },
            ]},
          ]}
        />
      </div>
    </div>
  );
}

function OilPriceTicker() {
  const tickerRef = useCallback((node) => {
    if (!node) return;
    // Clear previous
    node.innerHTML = "";
    // Create the OilPriceAPI ticker div
    const div = document.createElement("div");
    div.id = "oilpriceapi-ticker";
    div.setAttribute("data-theme", "light");
    div.setAttribute("data-commodities", "BRENT,WTI,NATURAL_GAS");
    div.setAttribute("data-layout", "horizontal");
    node.appendChild(div);
    // Load the script
    const script = document.createElement("script");
    script.src = "https://www.oilpriceapi.com/widgets/ticker.js";
    script.async = true;
    node.appendChild(script);
  }, []);

  return (
    <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:"12px 16px", minHeight:60 }}>
      <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>
        🛢 Precios en tiempo real · OilPriceAPI · Actualiza cada 5 min
      </div>
      <div ref={tickerRef} />
    </div>
  );
}

function BrentChart({ history: rawHistory, forecast = [] }) {
  const [hover, setHover] = useState(null);
  if (!rawHistory || rawHistory.length < 2) return null;

  // Downsample: group by day, take last price of each day
  const byDay = new Map();
  rawHistory.forEach(h => {
    const day = h.time ? h.time.split("T")[0] : new Date(h.time).toISOString().split("T")[0];
    byDay.set(day, h);
  });
  const history = Array.from(byDay.values());
  if (history.length < 2) return null;

  // Combine history + forecast for Y axis scaling
  const allPrices = [...history.map(h => h.price), ...forecast.map(f => f.price)];
  const firstDate = history[0]?.time ? new Date(history[0].time).toLocaleDateString("es",{month:"short",year:"numeric"}) : "";
  const lastForecastDate = forecast.length > 0 ? new Date(forecast[forecast.length-1].time).toLocaleDateString("es",{month:"short",year:"numeric"}) : "";
  const lastDate = history[history.length-1]?.time ? new Date(history[history.length-1].time).toLocaleDateString("es",{month:"short",year:"numeric"}) : "";
  const chartLabel = forecast.length > 0
    ? `Brent Crude · ${firstDate} — ${lastForecastDate} · ${history.length} pts + ${forecast.length} pronóstico EIA`
    : `Brent Crude · ${firstDate} — ${lastDate} · ${history.length} puntos`;

  const prices = history.map(h => h.price);
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  const range = max - min || 1;
  
  // Extend chart width to accommodate forecast
  const totalPoints = history.length + (forecast.length > 0 ? Math.round(forecast.length * 4) : 0); // ~4 days per month forecast point
  const W = 700, H = 140, padL = 45, padR = 10, padT = 10, padB = 25;
  const cW = W - padL - padR, cH = H - padT - padB;

  const toX = (i) => padL + (i / (totalPoints - 1)) * cW;
  const toY = (v) => padT + cH - ((v - min) / range) * cH;

  const pathD = history.map((h, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(h.price)}`).join(" ");
  const areaD = pathD + ` L${toX(history.length - 1)},${padT + cH} L${toX(0)},${padT + cH} Z`;

  // Forecast path (dashed, starting from last historical point)
  let forecastPathD = "";
  let forecastAreaD = "";
  if (forecast.length > 0) {
    const lastHistX = toX(history.length - 1);
    const lastHistY = toY(history[history.length - 1].price);
    const forecastPts = forecast.map((f, i) => {
      const fi = history.length + Math.round((i + 1) * 4); // ~4 days spacing per month
      return { x: toX(fi), y: toY(f.price), price: f.price, time: f.time };
    });
    forecastPathD = `M${lastHistX},${lastHistY} ` + forecastPts.map(p => `L${p.x},${p.y}`).join(" ");
    forecastAreaD = `M${lastHistX},${padT + cH} L${lastHistX},${lastHistY} ` + forecastPts.map(p => `L${p.x},${p.y}`).join(" ") + ` L${forecastPts[forecastPts.length-1].x},${padT + cH} Z`;
  }

  const first = prices[0], last = prices[prices.length - 1];
  const delta = last - first;
  const deltaPct = ((delta / first) * 100).toFixed(2);
  const isUp = delta >= 0;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, fontFamily: font, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {chartLabel}
          </span>
          <Badge color="#22c55e">EN VIVO</Badge>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#22c55e", fontFamily: "'Playfair Display',serif" }}>
            ${last.toFixed(2)}
          </span>
          <span style={{ fontSize: 11, fontFamily: font, fontWeight: 600, color: isUp ? "#22c55e" : "#ef4444" }}>
            {isUp ? "▲" : "▼"} ${Math.abs(delta).toFixed(2)} ({isUp ? "+" : ""}{deltaPct}%)
          </span>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = (e.clientX - rect.left) / rect.width * W;
          const idx = Math.round(((mx - padL) / cW) * (totalPoints - 1));
          if (idx >= 0 && idx < history.length) setHover(idx);
        }}
        onMouseLeave={() => setHover(null)}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <g key={f}>
            <line x1={padL} y1={padT + f * cH} x2={padL + cW} y2={padT + f * cH} stroke="rgba(0,0,0,0.06)" />
            <text x={padL - 4} y={padT + f * cH + 3} textAnchor="end" fontSize={7} fill={MUTED} fontFamily={font}>
              {(max - f * range).toFixed(1)}
            </text>
          </g>
        ))}
        {/* Area + Line (historical) */}
        <path d={areaD} fill="rgba(34,197,94,0.08)" />
        <path d={pathD} fill="none" stroke="#22c55e" strokeWidth={1.8} />

        {/* Forecast overlay (EIA STEO) */}
        {forecastPathD && <>
          <path d={forecastAreaD} fill="rgba(234,179,8,0.06)" />
          <path d={forecastPathD} fill="none" stroke="#eab308" strokeWidth={1.5} strokeDasharray="5,3" />
          {/* Forecast dots with labels */}
          {forecast.map((f, i) => {
            const fi = history.length + Math.round((i + 1) * 4);
            const fx = toX(fi);
            const fy = toY(f.price);
            return (
              <g key={i}>
                <circle cx={fx} cy={fy} r={2.5} fill="#eab308" stroke="#fff" strokeWidth={1} />
                {i % 3 === 0 && <text x={fx} y={fy - 6} fontSize={6} fill="#eab308" textAnchor="middle" fontFamily={font}>${f.price.toFixed(0)}</text>}
              </g>
            );
          })}
          {/* Divider line between historical and forecast */}
          <line x1={toX(history.length - 1)} y1={padT} x2={toX(history.length - 1)} y2={padT + cH}
            stroke="#eab308" strokeWidth={0.5} strokeDasharray="2,3" opacity={0.5} />
          <text x={toX(history.length - 1) + 3} y={padT + 8} fontSize={6} fill="#eab308" fontFamily={font}>Pronóstico EIA →</text>
        </>}
        {/* X labels */}
        {history.filter((_, i) => i % Math.max(1, Math.floor(history.length / 7)) === 0).map((h) => {
          const idx = history.indexOf(h);
          const d = new Date(h.time);
          return (
            <text key={idx} x={toX(idx)} y={H - 4} textAnchor="middle" fontSize={7} fill={MUTED} fontFamily={font}>
              {d.toLocaleDateString("es", { month: "short", day: "numeric" })}
            </text>
          );
        })}
        {/* Hover */}
        {hover !== null && hover < history.length && (
          <>
            <line x1={toX(hover)} y1={padT} x2={toX(hover)} y2={padT + cH} stroke="rgba(0,0,0,0.1)" />
            <circle cx={toX(hover)} cy={toY(history[hover].price)} r={3.5} fill="#22c55e" />
          </>
        )}
      </svg>
      {hover !== null && hover < history.length && (
        <div style={{ fontSize: 9, fontFamily: font, color: MUTED, marginTop: 4, display: "flex", gap: 12 }}>
          <span>{new Date(history[hover].time).toLocaleString("es", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          <span style={{ color: "#22c55e", fontWeight: 700 }}>${history[hover].price.toFixed(2)}</span>
        </div>
      )}
      {/* Legend */}
      {forecast.length > 0 && (
        <div style={{ display:"flex", gap:14, justifyContent:"center", marginTop:4 }}>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:16, height:2, background:"#22c55e" }} />
            <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>Precio histórico (EIA)</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:16, height:2, background:"#eab308", borderTop:"1px dashed #eab308" }} />
            <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>Pronóstico EIA (STEO mensual)</span>
          </div>
        </div>
      )}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// VENEZUELA PRODUCTION CHART — Monthly crude oil production (EIA/OPEC)
// ═══════════════════════════════════════════════════════════════

function VenProductionChart({ data: apiData }) {
  const [hover, setHover] = useState(null);

  // Merge API data with manual OPEC MOMR data
  // Manual data only fills gaps — if EIA already has the month, EIA wins
  const merged = (() => {
    const byMonth = new Map();
    // API data first (authoritative)
    (apiData || []).forEach(d => {
      const month = d.time.slice(0, 7); // "YYYY-MM"
      byMonth.set(month, { ...d, source: "EIA" });
    });
    // Manual data fills gaps only
    VEN_PRODUCTION_MANUAL.forEach(d => {
      const month = d.time.slice(0, 7);
      if (!byMonth.has(month)) {
        byMonth.set(month, { value: d.value, time: d.time, source: d.source || "OPEC MOMR" });
      }
    });
    return Array.from(byMonth.values()).sort((a, b) => new Date(a.time) - new Date(b.time));
  })();

  const data = merged;
  if (!data || data.length < 3) return null;

  const manualCount = data.filter(d => d.source !== "EIA").length;

  const values = data.map(d => d.value);
  const min = Math.min(...values) * 0.9;
  const max = Math.max(...values) * 1.05;
  const range = max - min || 1;
  const latest = data[data.length - 1];
  const prev = data.length > 1 ? data[data.length - 2] : null;
  const delta = prev ? latest.value - prev.value : 0;
  const deltaPct = prev ? ((delta / prev.value) * 100).toFixed(1) : "0";
  const peak = Math.max(...values);
  const trough = Math.min(...values);

  const firstDate = new Date(data[0].time).toLocaleDateString("es", { month: "short", year: "numeric" });
  const lastDate = new Date(latest.time).toLocaleDateString("es", { month: "short", year: "numeric" });

  const W = 700, H = 150, PL = 50, PR = 10, PT = 10, PB = 25;
  const cW = W - PL - PR, cH = H - PT - PB;
  const toX = (i) => PL + (i / (data.length - 1)) * cW;
  const toY = (v) => PT + cH - ((v - min) / range) * cH;

  // Bar width
  const barW = Math.max(1, (cW / data.length) * 0.7);

  // Key thresholds
  const thresh1M = 1000;
  const thresh788 = 788; // Current SITREP level

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, fontFamily: font, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            🇻🇪 Producción Petrolera Venezuela · {firstDate} — {lastDate} · {data.length} meses
          </span>
          <Badge color={ACCENT}>EIA/OPEC</Badge>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: ACCENT, fontFamily: "'Playfair Display',serif" }}>
            {latest.value.toFixed(0)}
          </span>
          <span style={{ fontSize: 10, fontFamily: font, color: MUTED }}>kbd</span>
          <span style={{ fontSize: 11, fontFamily: font, fontWeight: 600, color: delta >= 0 ? "#22c55e" : "#ef4444" }}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(0)} ({delta >= 0 ? "+" : ""}{deltaPct}%)
          </span>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", cursor: "crosshair" }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = (e.clientX - rect.left) / rect.width * W;
          const idx = Math.round(((mx - PL) / cW) * (data.length - 1));
          if (idx >= 0 && idx < data.length) setHover(idx);
        }}
        onMouseLeave={() => setHover(null)}>

        {/* Y grid + labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <g key={f}>
            <line x1={PL} y1={PT + f * cH} x2={PL + cW} y2={PT + f * cH} stroke="rgba(0,0,0,0.05)" />
            <text x={PL - 4} y={PT + f * cH + 3} textAnchor="end" fontSize={7} fill={MUTED} fontFamily={font}>
              {(max - f * range).toFixed(0)}
            </text>
          </g>
        ))}

        {/* 1M threshold line */}
        {thresh1M >= min && thresh1M <= max && (
          <>
            <line x1={PL} y1={toY(thresh1M)} x2={PL + cW} y2={toY(thresh1M)} stroke="#22c55e" strokeWidth={0.7} strokeDasharray="4,3" opacity={0.5} />
            <text x={PL + cW + 3} y={toY(thresh1M) + 3} fontSize={6} fill="#22c55e" fontFamily={font}>1M bpd</text>
          </>
        )}

        {/* Current 788 kbd level */}
        {thresh788 >= min && thresh788 <= max && (
          <>
            <line x1={PL} y1={toY(thresh788)} x2={PL + cW} y2={toY(thresh788)} stroke="#f97316" strokeWidth={0.7} strokeDasharray="3,3" opacity={0.4} />
            <text x={PL + cW + 3} y={toY(thresh788) + 3} fontSize={6} fill="#f97316" fontFamily={font}>788</text>
          </>
        )}

        {/* Bars */}
        {data.map((d, i) => {
          const x = toX(i) - barW / 2;
          const y = toY(d.value);
          const h = PT + cH - y;
          const isHovered = hover === i;
          const isManual = d.source !== "EIA";
          const color = d.value >= thresh1M ? "#22c55e" : d.value >= thresh788 ? ACCENT : "#f97316";
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={Math.max(h, 0.5)} fill={color} opacity={isHovered ? 0.9 : isManual ? 0.7 : 0.5} rx={0.5}
                strokeDasharray={isManual ? "2,1" : "none"} stroke={isManual ? color : "none"} strokeWidth={isManual ? 0.5 : 0} />
              {isManual && <text x={x + barW/2} y={y - 2} fontSize={4} fill={color} textAnchor="middle" fontFamily={font}>OPEC</text>}
            </g>
          );
        })}

        {/* Trend line overlay */}
        <polyline
          points={data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(" ")}
          fill="none" stroke={ACCENT} strokeWidth={1.2} opacity={0.6} />

        {/* X labels */}
        {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 8)) === 0).map((d) => {
          const idx = data.indexOf(d);
          const dt = new Date(d.time);
          return (
            <text key={idx} x={toX(idx)} y={H - 4} textAnchor="middle" fontSize={7} fill={MUTED} fontFamily={font}>
              {dt.toLocaleDateString("es", { month: "short", year: "2-digit" })}
            </text>
          );
        })}

        {/* Hover */}
        {hover !== null && hover < data.length && (() => {
          const d = data[hover];
          const hx = toX(hover);
          const hy = toY(d.value);
          const dt = new Date(d.time);
          const tooltipW = 90;
          const tooltipX = hx > W * 0.65 ? hx - tooltipW - 8 : hx + 8;
          const tooltipY = Math.max(Math.min(hy - 18, PT + cH - 38), PT);
          const isManual = d.source !== "EIA";
          return (
            <>
              <line x1={hx} y1={PT} x2={hx} y2={PT + cH} stroke={ACCENT} strokeWidth={0.5} opacity={0.3} />
              <circle cx={hx} cy={hy} r={3} fill={ACCENT} stroke="#fff" strokeWidth={1.5} />
              <rect x={tooltipX} y={tooltipY} width={tooltipW} height={isManual ? 36 : 30} rx={2} fill={BG2} stroke={BORDER} strokeWidth={0.5} opacity={0.95} />
              <text x={tooltipX + 4} y={tooltipY + 11} fontSize={6} fill={MUTED} fontFamily={font}>
                {dt.toLocaleDateString("es", { month: "long", year: "numeric" })}
              </text>
              <text x={tooltipX + 4} y={tooltipY + 23} fontSize={8} fill={ACCENT} fontFamily={font} fontWeight="700">
                {d.value.toFixed(0)} kbd ({d.value >= 1000 ? (d.value / 1000).toFixed(2) + "M" : d.value.toFixed(0) + "K"} bpd)
              </text>
              {isManual && <text x={tooltipX + 4} y={tooltipY + 32} fontSize={5} fill="#eab308" fontFamily={font}>Fuente: {d.source} (pendiente EIA)</text>}
            </>
          );
        })()}
      </svg>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 6 }}>
        {[
          { label: "Último", value: `${latest.value.toFixed(0)} kbd`, color: ACCENT },
          { label: "Máximo", value: `${peak.toFixed(0)} kbd`, color: "#22c55e" },
          { label: "Mínimo", value: `${trough.toFixed(0)} kbd`, color: "#ef4444" },
          { label: "Meses", value: data.length.toString(), color: MUTED },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 7, fontFamily: font, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: font, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 8, fontFamily: font, color: `${MUTED}50`, marginTop: 4, textAlign: "center" }}>
        Fuente: EIA / OPEC Secondary Sources · Actualización mensual{manualCount > 0 ? ` · ${manualCount} punto${manualCount>1?"s":""} OPEC MOMR (pendiente EIA)` : ""}
      </div>
    </Card>
  );
}

function LivePriceCards() {
  const [prices, setPrices] = useState(null);
  const [brentHistory, setBrentHistory] = useState([]);
  const [steoForecast, setSteoForecast] = useState([]);
  const [venProduction, setVenProduction] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("loading");

  useEffect(() => {
    async function fetchPrices() {
      // Try our Vercel serverless function first (has API key server-side)
      if (IS_DEPLOYED) {
        try {
          const res = await fetch("/api/oil-prices", { signal: AbortSignal.timeout(20000) });
          if (res.ok) {
            const data = await res.json();
            if (data.brent || data.wti || data.natgas) {
              setPrices(data);
              if (data.brentHistory) setBrentHistory(data.brentHistory);
              if (data.steoForecast) setSteoForecast(data.steoForecast);
              if (data.venProduction) setVenProduction(data.venProduction);
              setSource("live");
              setLoading(false);
              return;
            }
          }
        } catch {}
      }
      // Try direct API with CORS proxy (for Claude artifact / local dev)
      for (const proxyFn of CORS_PROXIES) {
        try {
          const [brentRes, wtiRes, gasRes] = await Promise.all([
            fetch(proxyFn("https://api.oilpriceapi.com/v1/prices/latest?by_code=BRENT_CRUDE_USD"), {
              headers: { Authorization: "Token ee08dc36b7a3ff883080dfe426bffd6ed1a392b53d3818c60a57c84b50858f93" },
              signal: AbortSignal.timeout(6000),
            }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(proxyFn("https://api.oilpriceapi.com/v1/prices/latest?by_code=WTI_USD"), {
              headers: { Authorization: "Token ee08dc36b7a3ff883080dfe426bffd6ed1a392b53d3818c60a57c84b50858f93" },
              signal: AbortSignal.timeout(6000),
            }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(proxyFn("https://api.oilpriceapi.com/v1/prices/latest?by_code=NATURAL_GAS_USD"), {
              headers: { Authorization: "Token ee08dc36b7a3ff883080dfe426bffd6ed1a392b53d3818c60a57c84b50858f93" },
              signal: AbortSignal.timeout(6000),
            }).then(r => r.ok ? r.json() : null).catch(() => null),
          ]);
          if (brentRes?.data || wtiRes?.data || gasRes?.data) {
            setPrices({ brent: brentRes?.data, wti: wtiRes?.data, natgas: gasRes?.data });
            setSource("live");
            setLoading(false);
            return;
          }
        } catch { continue; }
      }
      // Fallback static
      setPrices({ brent: { price: 72.50 }, wti: { price: 68.80 }, natgas: { price: 3.85 } });
      setSource("static");
      setLoading(false);
    }
    fetchPrices();
    // Auto-refresh every 5 minutes
    const iv = setInterval(fetchPrices, 300000);
    return () => clearInterval(iv);
  }, []);

  const extract = (obj) => {
    if (!obj) return null;
    if (typeof obj === "number") return obj;
    if (obj.price != null) return typeof obj.price === "number" ? obj.price : parseFloat(obj.price);
    return null;
  };

  const brent = extract(prices?.brent) || 72.50;
  const wti = extract(prices?.wti) || 68.80;
  const natgas = extract(prices?.natgas) || 3.85;
  const brentTime = prices?.brent?.created_at || prices?.brent?.timestamp || null;
  const wtiTime = prices?.wti?.created_at || prices?.wti?.timestamp || null;
  const natgasTime = prices?.natgas?.created_at || prices?.natgas?.timestamp || null;

  const fmtTime = (t) => t ? new Date(t).toLocaleString("es", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

  const items = [
    { label: "Brent Crude", value: brent, unit: "USD/bbl", color: "#22c55e", desc: "Referencia internacional", time: brentTime },
    { label: "WTI Crude", value: wti, unit: "USD/bbl", color: "#38bdf8", desc: "Referencia EE.UU.", time: wtiTime },
    { label: "Natural Gas", value: natgas, unit: "USD/MMBtu", color: "#f59e0b", desc: "Henry Hub", time: natgasTime },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Price cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {loading ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 20, color: MUTED, fontSize: 10, fontFamily: font }}>
            Conectando con OilPriceAPI...
          </div>
        ) : items.map((item, i) => (
          <Card key={i} accent={item.color}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase" }}>{item.label}</span>
              {i === 0 && <Badge color={source === "live" ? "#22c55e" : "#a17d08"}>{source === "live" ? "EN VIVO" : "ESTÁTICO"}</Badge>}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: item.color, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>
              ${item.value.toFixed(2)}
            </div>
            <div style={{ fontSize: 9, fontFamily: font, color: MUTED, marginTop: 6 }}>{item.unit} · {item.desc}</div>
            {item.time && <div style={{ fontSize: 7, fontFamily: font, color: `${MUTED}80`, marginTop: 3 }}>{fmtTime(item.time)}</div>}
          </Card>
        ))}
      </div>
      {/* Brent chart */}
      {brentHistory.length > 2 && <BrentChart history={brentHistory} forecast={steoForecast} />}
      {venProduction.length > 2 && <VenProductionChart data={venProduction} />}
      {/* Fallback notice */}
      {!loading && source === "static" && (
        <div style={{ fontSize: 8, fontFamily: font, color: "#a17d08", textAlign: "center" }}>
          ⚠ Precios de referencia estáticos — en vivo requiere deploy en Vercel con OILPRICE_API_KEY
        </div>
      )}
    </div>
  );
}




function MereyEstimator() {
  const mob = useIsMobile();
  const [brentPrice, setBrentPrice] = useState(72.5);
  const [discount, setDiscount] = useState(12);
  const merey = Math.max(0, brentPrice - discount);
  const revenue800k = (merey * 800000 / 1e6).toFixed(1);
  const revenueYear = (merey * 800000 * 365 / 1e9).toFixed(1);
  
  return (
    <Card accent="#b8860b">
      <div style={{ fontSize:12, fontFamily:font, color:"#b8860b", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
        Estimador Merey venezolano
      </div>
      <div style={{ fontSize:12, color:MUTED, marginBottom:10, lineHeight:1.5 }}>
        El crudo Merey 16° API no tiene feed público. Se estima como Brent menos descuento por gravedad y riesgo país.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10, marginBottom:12 }}>
        <div>
          <label style={{ fontSize:10, fontFamily:font, color:MUTED, display:"block", marginBottom:4, letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Brent (USD/bbl)
          </label>
          <input type="number" value={brentPrice} onChange={e => setBrentPrice(+e.target.value)}
            style={{ width:"100%", padding:"6px 10px", fontSize:15, fontFamily:font, fontWeight:700,
              background:BG, border:`1px solid ${BORDER}`, color:"#22c55e", outline:"none" }} />
        </div>
        <div>
          <label style={{ fontSize:10, fontFamily:font, color:MUTED, display:"block", marginBottom:4, letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Descuento (USD)
          </label>
          <input type="number" value={discount} onChange={e => setDiscount(+e.target.value)}
            style={{ width:"100%", padding:"6px 10px", fontSize:15, fontFamily:font, fontWeight:700,
              background:BG, border:`1px solid ${BORDER}`, color:"#ef4444", outline:"none" }} />
          <div style={{ fontSize:9, color:MUTED, marginTop:3 }}>Rango típico: 10-15 (abierto) · 18-25 (sanciones)</div>
        </div>
      </div>
      <div style={{ background:BG, border:`1px solid ${BORDER}`, padding:"12px 14px", display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:12 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:22, fontWeight:900, color:"#b8860b", fontFamily:"'Playfair Display',serif" }}>${merey.toFixed(1)}</div>
          <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase" }}>Merey est. /bbl</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:22, fontWeight:900, color:ACCENT, fontFamily:"'Playfair Display',serif" }}>${revenue800k}M</div>
          <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase" }}>Ingreso diario 800K bpd</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:22, fontWeight:900, color:"#22c55e", fontFamily:"'Playfair Display',serif" }}>${revenueYear}B</div>
          <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase" }}>Proyección anualizada</div>
        </div>
      </div>
      <div style={{ fontSize:10, color:MUTED, marginTop:8, lineHeight:1.5, fontStyle:"italic" }}>
        Merey = Brent − descuento · Producción actual ~800K bpd · Compradores: India (Reliance, BPCL, HPCL), Vitol, Trafigura, Valero, Phillips 66
      </div>
    </Card>
  );
}

function TabMercados() {
  const mob = useIsMobile();
  const [seccion, setSeccion] = useState("petroleo");

  return (
    <div>
      {/* Header + section toggle */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>📈</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600, color:TEXT }}>Mercados — Petróleo · Commodities · Predicción</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em" }}>
            Indicadores de mercado relevantes para el análisis de contexto Venezuela
          </div>
        </div>
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}`, flexWrap:"wrap" }}>
          {[{id:"petroleo",label:"Petróleo",icon:"🛢"},{id:"global",label:"Global",icon:"🌍"},{id:"prediccion",label:"Predicción",icon:"🔮"}].map(s => (
            <button key={s.id} onClick={() => setSeccion(s.id)}
              style={{ fontSize:12, fontFamily:font, padding:"6px 14px", border:"none",
                background:seccion===s.id?ACCENT:"transparent", color:seccion===s.id?"#fff":MUTED,
                cursor:"pointer", letterSpacing:"0.08em", display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:14 }}>{s.icon}</span>{s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PETRÓLEO ── */}
      {seccion === "petroleo" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* OilPriceAPI live ticker */}
          <OilPriceTicker />

          {/* Price cards */}
          <LivePriceCards />

          {/* Merey estimator */}
          <MereyEstimator />

          {/* Context cards */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:10 }}>
            <Card accent="#22c55e">
              <div style={{ fontSize:13, fontWeight:600, color:"#22c55e", marginBottom:6 }}>Exportaciones Venezuela</div>
              <div style={{ fontSize:18, fontWeight:900, color:"#22c55e", fontFamily:"'Playfair Display',serif" }}>~800K bpd</div>
              <div style={{ fontSize:12, color:MUTED, marginTop:4, lineHeight:1.5 }}>
                Destino: India (Reliance, BPCL, HPCL-Mittal), EE.UU. (Valero, Phillips 66, Citgo). 
                VLCC de hasta 2M barriles. Vitol/Trafigura 3 buques marzo.
              </div>
            </Card>
            <Card accent={ACCENT}>
              <div style={{ fontSize:13, fontWeight:600, color:ACCENT, marginBottom:6 }}>Licencias OFAC activas</div>
              <div style={{ fontSize:14, fontWeight:700, color:ACCENT, fontFamily:font }}>GL49 · GL50 · GL50A</div>
              <div style={{ fontSize:12, color:MUTED, marginTop:4, lineHeight:1.5 }}>
                FAQ 1238: marco regulado para licencias a Cuba condicionado. 
                BP, Chevron, Eni, Repsol, Shell autorizadas bajo ley EE.UU.
                19 contratos en revisión de solvencia.
              </div>
            </Card>
            <Card accent="#ef4444">
              <div style={{ fontSize:13, fontWeight:600, color:"#ef4444", marginBottom:6 }}>Infraestructura</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#ef4444", fontFamily:font }}>&lt;20% capacidad refinación</div>
              <div style={{ fontSize:12, color:MUTED, marginTop:4, lineHeight:1.5 }}>
                Paraguaná: 5 de 9 unidades (~287K bpd). 
                2-4 taladros activos (vs 100+ históricos).
                Inversión requerida: +USD 100B para alcanzar 3-4 Mbpd en 10 años.
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── GLOBAL MARKETS ── */}
      {seccion === "global" && <MarketOverviewWidget />}

      {/* ── PREDICCIÓN ── */}
      {seccion === "prediccion" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Embeddable markets */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:12 }}>
            {POLYMARKET_SLUGS.filter(m => m.embed).map((m,i) => (
              <Card key={i}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:TEXT, lineHeight:1.3 }}>{m.title}</span>
                  <a href={`https://polymarket.com/event/${m.slug}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:12, color:ACCENT, textDecoration:"none", fontFamily:font }}>↗</a>
                </div>
                <iframe
                  src={`https://embed.polymarket.com/market.html?market=${m.slug}&theme=light&features=volume,chart&width=380`}
                  style={{ width:"100%", height:300, border:"none", borderRadius:4 }}
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                  title={m.title}
                />
              </Card>
            ))}
          </div>
          {/* Multi-outcome markets (can't embed — link cards) */}
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginTop:4, marginBottom:2 }}>
            Mercados multi-resultado · Ver en Polymarket
          </div>
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:10 }}>
            {POLYMARKET_SLUGS.filter(m => m.multi).map((m,i) => (
              <a key={i} href={`https://polymarket.com/event/${m.slug}`} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration:"none" }}>
                <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:"14px 16px", cursor:"pointer",
                  transition:"border-color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor=ACCENT}
                  onMouseLeave={e => e.currentTarget.style.borderColor=BORDER}>
                  <div style={{ fontSize:14, fontWeight:600, color:TEXT, lineHeight:1.4, marginBottom:6 }}>{m.title}</div>
                  <div style={{ fontSize:12, fontFamily:font, color:MUTED, lineHeight:1.5 }}>{m.desc}</div>
                  <div style={{ fontSize:10, fontFamily:font, color:ACCENT, marginTop:8, letterSpacing:"0.08em" }}>↗ VER EN POLYMARKET</div>
                </div>
              </a>
            ))}
          </div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, textAlign:"center", marginTop:4 }}>
            Fuente: Polymarket · Precios = probabilidad implícita del mercado · No son predicciones
          </div>
        </div>
      )}
    </div>
  );
}

function EstadosMap() {
  const mob = useIsMobile();
  const [selected, setSelected] = useState(null);
  const maxEst = Math.max(...CONF_ESTADOS.map(e=>e.p));
  const lider = CONF_ESTADOS[0]; // highest

  // Color scale: protestas -> intensity
  const getColor = (protestas) => {
    const t = protestas / maxEst;
    if (t > 0.8) return "#E5243B";
    if (t > 0.6) return "#ff6b35";
    if (t > 0.4) return "#f59e0b";
    if (t > 0.2) return "#0A97D9";
    return "#0A97D980";
  };

  const sel = selected ? CONF_ESTADOS.find(e => e.e === selected) : null;
  const selRank = sel ? CONF_ESTADOS.indexOf(sel) + 1 : null;

  return (
    <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 320px", gap:16 }}>
      {/* Map */}
      <div>
        <svg viewBox="0 0 600 420" style={{ width:"100%", background:BG2, border:`1px solid ${BORDER}`, padding:8 }}>
          {VZ_MAP.map(state => {
            const data = CONF_ESTADOS.find(e => e.e === state.id);
            const isSelected = selected === state.id;
            return (
              <g key={state.id}>
                <path d={state.d} fill={data ? getColor(data.p) : `${MUTED}30`}
                  stroke={isSelected ? "#fff" : `${BORDER}`} strokeWidth={isSelected ? 2 : 0.5}
                  style={{ cursor:"pointer", transition:"all 0.2s" }}
                  opacity={selected && !isSelected ? 0.4 : 1}
                  onClick={() => setSelected(isSelected ? null : state.id)}
                  onMouseEnter={e => { if(!isSelected) e.currentTarget.setAttribute("stroke","#fff"); e.currentTarget.setAttribute("stroke-width","1.5"); }}
                  onMouseLeave={e => { if(!isSelected) { e.currentTarget.setAttribute("stroke",BORDER); e.currentTarget.setAttribute("stroke-width","0.5"); }}}
                />
              </g>
            );
          })}
          {/* State labels */}
          {VZ_MAP.map(state => {
            const data = CONF_ESTADOS.find(e => e.e === state.id);
            if (!data) return null;
            // Calculate center of path bounding box approximately
            const nums = (state.d || "").match(/[\d.]+/g);
            if (!nums || nums.length < 4) return null;
            const nf = nums.map(Number);
            const xs = nf.filter((_,i) => i%2===0), ys = nf.filter((_,i) => i%2===1);
            const cx = (Math.min(...xs)+Math.max(...xs))/2, cy = (Math.min(...ys)+Math.max(...ys))/2;
            return (
              <text key={`l${state.id}`} x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                fontSize={data.p > 100 ? 7 : 5} fill={selected===state.id?"#fff":"rgba(255,255,255,0.7)"}
                fontFamily={font} fontWeight={selected===state.id?700:400} pointerEvents="none">
                {data.p}
              </text>
            );
          })}
        </svg>
        {/* Legend */}
        <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:8, flexWrap:"wrap" }}>
          {[{c:"#E5243B",l:">170"},{c:"#ff6b35",l:"130–170"},{c:"#f59e0b",l:"85–130"},{c:"#0A97D9",l:"45–85"},{c:"#0A97D980",l:"<45"}].map((l,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:10, height:10, background:l.c, borderRadius:2 }} />
              <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>{l.l}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize:9, fontFamily:font, color:`${MUTED}60`, textAlign:"center", marginTop:4 }}>Click en un estado para ver detalles</div>
      </div>

      {/* Detail panel */}
      <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
        {sel ? (<>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:TEXT, fontFamily:"'Syne',sans-serif" }}>{sel.e}</div>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED }}>Posición #{selRank} de {CONF_ESTADOS.length} estados</div>
          </div>

          {/* KPIs */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:8 }}>
            <div style={{ background:BG, padding:"10px", border:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Protestas</div>
              <div style={{ fontSize:20, fontWeight:800, color:ACCENT, fontFamily:"'Syne',sans-serif" }}>{sel.p}</div>
              <div style={{ fontSize:10, color:MUTED }}>{((sel.p/2219)*100).toFixed(1)}% del total nacional</div>
            </div>
            <div style={{ background:BG, padding:"10px", border:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Reprimidas</div>
              <div style={{ fontSize:20, fontWeight:800, color:sel.r>3?"#E5243B":sel.r>0?"#a17d08":"#22c55e", fontFamily:"'Syne',sans-serif" }}>{sel.r}</div>
              <div style={{ fontSize:10, color:MUTED }}>{sel.r > 0 ? `${((sel.r/55)*100).toFixed(1)}% de las 55 nacionales` : "Sin represión documentada"}</div>
            </div>
          </div>

          {sel.c > 0 && (
            <div style={{ background:BG, padding:"10px", border:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Por combustible</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#f59e0b", fontFamily:"'Syne',sans-serif" }}>{sel.c}</div>
              <div style={{ fontSize:10, color:MUTED }}>protestas por desabastecimiento</div>
            </div>
          )}

          {/* Comparativa vs líder */}
          <div style={{ background:BG, padding:"10px", border:`1px solid ${BORDER}` }}>
            <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Comparativa vs. {lider.e} (#1)</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ flex:1, height:6, background:BORDER, borderRadius:3, position:"relative" }}>
                <div style={{ width:`${(sel.p/lider.p)*100}%`, height:"100%", background:ACCENT, borderRadius:3 }} />
              </div>
              <span style={{ fontSize:12, fontFamily:font, color:ACCENT }}>{((sel.p/lider.p)*100).toFixed(0)}%</span>
            </div>
            <div style={{ fontSize:10, color:MUTED, marginTop:4 }}>
              {sel.e === lider.e ? "Estado líder en protestas" : `${lider.p - sel.p} protestas menos que ${lider.e}`}
            </div>
          </div>

          {/* Exigencias */}
          <div style={{ background:BG, padding:"10px", border:`1px solid ${BORDER}` }}>
            <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Principales exigencias</div>
            <div style={{ fontSize:13, color:TEXT, lineHeight:1.5 }}>{sel.x}</div>
          </div>
        </>) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, gap:8, padding:20 }}>
            <span style={{ fontSize:28, opacity:0.3 }}>🗺️</span>
            <div style={{ fontSize:13, color:MUTED, textAlign:"center" }}>Selecciona un estado en el mapa para ver sus detalles</div>
            <div style={{ fontSize:10, fontFamily:font, color:`${MUTED}60`, textAlign:"center", marginTop:8 }}>
              Top 3: {CONF_ESTADOS.slice(0,3).map(e=>`${e.e} (${e.p})`).join(" · ")}
            </div>
          </div>
        )}

        {/* Ranking mini table */}
        <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:4, paddingTop:8, borderTop:`1px solid ${BORDER}` }}>
          Top 10 estados
        </div>
        {CONF_ESTADOS.slice(0,10).map((e,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 0", cursor:"pointer",
            background:selected===e.e?`${ACCENT}15`:"transparent" }}
            onClick={() => setSelected(selected===e.e?null:e.e)}>
            <span style={{ fontSize:10, fontFamily:font, color:MUTED, width:16, textAlign:"right" }}>{i+1}</span>
            <span style={{ fontSize:12, color:selected===e.e?ACCENT:TEXT, flex:1, fontWeight:selected===e.e?600:400 }}>{e.e}</span>
            <span style={{ fontSize:12, fontFamily:font, color:ACCENT }}>{e.p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabConflictividad() {
  const mob = useIsMobile();
  const [seccion, setSeccion] = useState("resumen");

  const maxMes = Math.max(...CONF_MESES.map(m=>m.t));
  const maxEst = Math.max(...CONF_ESTADOS.map(e=>e.p));
  const maxHist = Math.max(...CONF_HISTORICO.map(h=>h.p));
  const catColor = { DCP:"#0A97D9", DESCA:"#4C9F38" };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>📊</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:TEXT, fontFamily:"'Syne',sans-serif", letterSpacing:"0.05em", textTransform:"uppercase" }}>Conflictividad Social — Venezuela 2025</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED }}>Fuente: OVCS · Informe Anual 2025 · 2.219 protestas documentadas</div>
        </div>
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}`, flexWrap:"wrap" }}>
          {[{id:"resumen",label:"Resumen"},{id:"mensual",label:"Mensual"},{id:"derechos",label:"Derechos"},{id:"estados",label:"Estados"},{id:"historico",label:"Histórico"},{id:"acled",label:"ACLED"}].map(s => (
            <button key={s.id} onClick={() => setSeccion(s.id)}
              style={{ fontSize:12, fontFamily:font, padding:"6px 12px", border:"none",
                background:seccion===s.id?ACCENT:"transparent", color:seccion===s.id?"#fff":MUTED, cursor:"pointer", letterSpacing:"0.06em" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── RESUMEN ── */}
      {seccion === "resumen" && (<>
        <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:10, marginBottom:16 }}>
          {[{k:"Total 2025",v:"2.219",c:ACCENT,s:"-57% vs 2024 · Mínimo histórico"},{k:"DESCA",v:"1.248",c:"#4C9F38",s:"56% · Laborales, vivienda, servicios"},
            {k:"DCP",v:"971",c:"#0A97D9",s:"44% · Políticos, justicia"},{k:"Reprimidas",v:"55",c:"#E5243B",s:"2,5% · Patrón selectivo"}
          ].map((d,i) => (
            <Card key={i} accent={d.c}>
              <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{d.k}</div>
              <div style={{ fontSize:22, fontWeight:800, color:d.c, fontFamily:"'Syne',sans-serif" }}>{d.v}</div>
              <div style={{ fontSize:10, color:MUTED, marginTop:2 }}>{d.s}</div>
            </Card>
          ))}
        </div>
        {/* Servicios básicos */}
        <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
          Protestas por servicios básicos · 275 total
        </div>
        <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:8, marginBottom:16 }}>
          {CONF_SERVICIOS.map((s,i) => (
            <div key={i} style={{ background:BG2, border:`1px solid ${BORDER}`, padding:"10px 12px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <span style={{ fontSize:16 }}>{s.i}</span>
                <span style={{ fontSize:13, fontWeight:600, color:TEXT }}>{s.s}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ flex:1, height:4, background:`${BORDER}`, borderRadius:2 }}>
                  <div style={{ width:`${s.pct}%`, height:"100%", background:ACCENT, borderRadius:2 }} />
                </div>
                <span style={{ fontSize:12, fontFamily:font, color:ACCENT, minWidth:30 }}>{s.p}</span>
              </div>
              <div style={{ fontSize:10, color:MUTED, marginTop:4 }}>{s.pct}%</div>
            </div>
          ))}
        </div>
        {/* Mini histórico */}
        <Card>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
            Serie histórica 2011–2025
          </div>
          <ConflictividadChart />
        </Card>
      </>)}

      {/* ── MENSUAL ── */}
      {seccion === "mensual" && (<>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
          <Card accent="#E5243B">
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Mes pico</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#E5243B", fontFamily:"'Syne',sans-serif" }}>Enero · 401</div>
            <div style={{ fontSize:10, color:MUTED, marginTop:2 }}>36 reprimidas · DCP dominante</div>
          </Card>
          <Card accent="#4C9F38">
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Mes mínimo</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#4C9F38", fontFamily:"'Syne',sans-serif" }}>Diciembre · 123</div>
            <div style={{ fontSize:10, color:MUTED, marginTop:2 }}>1 reprimida · DESCA dominante</div>
          </Card>
        </div>
        {/* Monthly bar chart */}
        <Card>
          <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:200, paddingBottom:20 }}>
            {CONF_MESES.map((m,i) => {
              const pct = (m.t/maxMes)*100;
              const descaPct = (m.desca/m.t)*100;
              return (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%", position:"relative" }}>
                  <div style={{ fontSize:9, fontFamily:font, color:m.rep>0?"#E5243B":MUTED, marginBottom:2 }}>{m.t}</div>
                  <div style={{ width:"100%", height:`${pct}%`, position:"relative", borderRadius:"2px 2px 0 0", overflow:"hidden", minHeight:2 }}>
                    <div style={{ position:"absolute", bottom:0, width:"100%", height:`${descaPct}%`, background:"#4C9F38" }} />
                    <div style={{ position:"absolute", top:0, width:"100%", height:`${100-descaPct}%`, background:"#0A97D9" }} />
                  </div>
                  {m.rep > 0 && <div style={{ fontSize:8, color:"#E5243B", marginTop:1 }}>{m.rep}R</div>}
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, marginTop:3 }}>{m.m}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:8 }}>
            <span style={{ fontSize:10, fontFamily:font, color:"#4C9F38" }}>● DESCA</span>
            <span style={{ fontSize:10, fontFamily:font, color:"#0A97D9" }}>● DCP</span>
            <span style={{ fontSize:10, fontFamily:font, color:"#E5243B" }}>● R = Reprimidas</span>
          </div>
        </Card>
        {/* Monthly detail */}
        <div style={{ marginTop:12 }}>
          {CONF_MESES.map((m,i) => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"60px 50px 1fr", gap:12, padding:"8px 0", borderBottom:`1px solid ${BORDER}30`, alignItems:"center" }}>
              <span style={{ fontSize:13, fontWeight:600, color:TEXT }}>{m.m}</span>
              <span style={{ fontSize:13, fontFamily:font, color:ACCENT }}>{m.t}</span>
              <span style={{ fontSize:12, color:MUTED, lineHeight:1.4 }}>{m.hecho}</span>
            </div>
          ))}
        </div>
      </>)}

      {/* ── DERECHOS ── */}
      {seccion === "derechos" && (
        <div>
          {CONF_DERECHOS.map((d,i) => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"30px 1fr 60px 50px", gap:10, padding:"10px 0", borderBottom:`1px solid ${BORDER}30`, alignItems:"center" }}>
              <span style={{ fontSize:16, fontWeight:800, color:catColor[d.cat], fontFamily:"'Syne',sans-serif", textAlign:"center" }}>#{i+1}</span>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:TEXT }}>{d.d}</div>
                <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${catColor[d.cat]}15`, color:catColor[d.cat], border:`1px solid ${catColor[d.cat]}30` }}>{d.cat}</span>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:16, fontWeight:700, color:catColor[d.cat], fontFamily:"'Syne',sans-serif" }}>{d.p}</div>
                <div style={{ fontSize:10, color:MUTED }}>{d.pct}%</div>
              </div>
              <div style={{ height:6, background:BORDER, borderRadius:3 }}>
                <div style={{ width:`${(d.pct/30)*100}%`, height:"100%", background:catColor[d.cat], borderRadius:3, maxWidth:"100%" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ESTADOS ── */}
      {seccion === "estados" && (
        <EstadosMap />
      )}

      {/* ── HISTÓRICO ── */}
      {seccion === "historico" && (<>
        <Card>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
            Serie histórica 2011–2025 · OVCS
          </div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:200, paddingBottom:20 }}>
            {CONF_HISTORICO.map((h,i) => {
              const pct = (h.p/maxHist)*100;
              const isLast = i === CONF_HISTORICO.length-1;
              const isPeak = h.p === maxHist;
              return (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%" }}>
                  <div style={{ fontSize:9, fontFamily:font, color:isLast?ACCENT:isPeak?"#E5243B":MUTED, marginBottom:2 }}>
                    {(h.p/1000).toFixed(1)}k
                  </div>
                  <div style={{ width:"100%", height:`${pct}%`, background:isLast?ACCENT:isPeak?"#E5243B":`${ACCENT}40`,
                    borderRadius:"2px 2px 0 0", minHeight:2 }} />
                  <div style={{ fontSize:9, fontFamily:font, color:isLast?ACCENT:MUTED, marginTop:4, transform:"rotate(-45deg)", transformOrigin:"top left", whiteSpace:"nowrap" }}>
                    {String(h.y).slice(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        {/* Year detail */}
        <div style={{ marginTop:12 }}>
          {CONF_HISTORICO.slice().reverse().map((h,i) => {
            const prev = CONF_HISTORICO.find(x=>x.y===h.y-1);
            const delta = prev ? h.p - prev.p : null;
            return (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"50px 70px 1fr 60px", gap:10, padding:"8px 0", borderBottom:`1px solid ${BORDER}30`, alignItems:"center" }}>
                <span style={{ fontSize:14, fontWeight:h.y===2025||h.y===2019?700:400, color:h.y===2025?ACCENT:h.y===2019?"#E5243B":TEXT }}>{h.y}</span>
                <span style={{ fontSize:14, fontFamily:font, color:h.y===2025?ACCENT:h.y===2019?"#E5243B":TEXT, fontWeight:600 }}>{h.p.toLocaleString()}</span>
                <span style={{ fontSize:12, color:MUTED, lineHeight:1.4 }}>{h.h}</span>
                {delta !== null && (
                  <span style={{ fontSize:12, fontFamily:font, color:delta>0?"#E5243B":"#22c55e", textAlign:"right" }}>
                    {delta>0?"+":""}{delta.toLocaleString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </>)}

      {seccion === "acled" && <AcledSection />}
    </div>
  );
}

function LeafletMap({ events, EC, TR }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef(null);

  // Load Leaflet CSS + JS from CDN
  useEffect(() => {
    if (document.getElementById("leaflet-css")) return;
    const css = document.createElement("link");
    css.id = "leaflet-css";
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);

    const js = document.createElement("script");
    js.id = "leaflet-js";
    js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    js.onload = () => initMap();
    document.head.appendChild(js);

    function initMap() {
      if (!mapRef.current || mapInstance.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true }).setView([7.5, -66.5], 6);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 18,
      }).addTo(map);
      mapInstance.current = map;
      addMarkers(map, L);
    }

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, []);

  // Update markers when events change
  useEffect(() => {
    if (mapInstance.current && window.L) addMarkers(mapInstance.current, window.L);
  }, [events]);

  function addMarkers(map, L) {
    if (markersRef.current) map.removeLayer(markersRef.current);
    const group = L.layerGroup();
    events.forEach(e => {
      const lat = parseFloat(e.latitude), lng = parseFloat(e.longitude);
      if (!lat || !lng) return;
      const fatal = parseInt(e.fatalities) || 0;
      const r = fatal > 5 ? 10 : fatal > 0 ? 6 : 4;
      const color = EC[e.event_type] || "#0A97D9";
      const circle = L.circleMarker([lat, lng], {
        radius: r, fillColor: color, color: color, weight: 1, opacity: 0.8, fillOpacity: 0.5,
      });
      circle.bindPopup(
        `<div style="font-family:monospace;font-size:11px;max-width:250px">` +
        `<b>${e.event_date}</b><br>` +
        `<span style="color:${color};font-weight:bold">${TR[e.sub_event_type]||TR[e.event_type]||e.sub_event_type||e.event_type}</span><br>` +
        `📍 ${e.location}${e.admin1 ? `, ${e.admin1}` : ""}<br>` +
        (fatal > 0 ? `💀 <b>${fatal} fatalidades</b><br>` : "") +
        (e.actor1 ? `👤 ${e.actor1}<br>` : "") +
        `<div style="margin-top:4px;font-size:10px;color:#888">${(e.notes || "").slice(0, 150)}${(e.notes || "").length > 150 ? "..." : ""}</div>` +
        `</div>`,
        { maxWidth: 280 }
      );
      group.addLayer(circle);
    });
    group.addTo(map);
    markersRef.current = group;
  }

  return <div ref={mapRef} style={{ width: "100%", height: typeof window !== "undefined" && window.innerWidth < 768 ? 300 : 450, border: `1px solid ${BORDER}`, background: "#eef1f5", borderRadius:6 }} />;
}

function AcledSection() {
  const mob = useIsMobile();
  const [events, setEvents] = useState([]);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [acledPage, setAcledPage] = useState(1);
  const [acledView, setAcledView] = useState("overview");
  const [castState, setCastState] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/acled?type=events&limit=2000", { signal: AbortSignal.timeout(20000) });
        if (res.ok) {
          const data = await res.json();
          const evts = data.data || data || [];
          if (Array.isArray(evts)) setEvents(evts);
        } else {
          const err = await res.json().catch(() => ({}));
          setError(err.error || `HTTP ${res.status}`);
        }
      } catch (e) { setError(e.message); }
      try {
        const res = await fetch("/api/acled?type=cast", { signal: AbortSignal.timeout(15000) });
        if (res.ok) { const data = await res.json(); const p = data.data || data || []; if (Array.isArray(p)) setCast(p); }
      } catch {}
      setLoading(false);
    }
    if (IS_DEPLOYED) load();
    else { setLoading(false); setError("ACLED requiere deploy en Vercel"); }
  }, []);

  const EC = { "Protests":"#4C9F38","Riots":"#b8860b","Battles":"#E5243B","Violence against civilians":"#dc2626","Explosions/Remote violence":"#f97316","Strategic developments":"#0A97D9" };

  // Spanish translations
  const TR = {
    // Event types
    "Protests":"Protestas","Riots":"Disturbios","Battles":"Batallas",
    "Violence against civilians":"Violencia contra civiles",
    "Explosions/Remote violence":"Explosiones/Violencia remota",
    "Strategic developments":"Desarrollos estratégicos",
    // Sub-event types
    "Peaceful protest":"Protesta pacífica","Protest with intervention":"Protesta con intervención",
    "Excessive force against protesters":"Fuerza excesiva contra manifestantes",
    "Violent demonstration":"Manifestación violenta","Mob violence":"Violencia de multitud",
    "Armed clash":"Enfrentamiento armado","Attack":"Ataque",
    "Abduction/forced disappearance":"Secuestro/desaparición forzada",
    "Sexual violence":"Violencia sexual","Arrests":"Detenciones",
    "Change to group/activity":"Cambio de grupo/actividad",
    "Disrupted weapons use":"Uso de armas frustrado","Grenade":"Granada",
    "Shelling/artillery/missile attack":"Bombardeo/artillería/misil",
    "Air/drone strike":"Ataque aéreo/dron","Looting/property destruction":"Saqueo/destrucción",
    "Government regains territory":"Gobierno recupera territorio",
    "Non-state actor overtakes territory":"Actor no estatal toma territorio",
    "Agreement":"Acuerdo","Headquarters or base established":"Base establecida",
    "Other":"Otro",
  };
  const trad = (s) => TR[s] || s;

  const byType = {}, byAdmin = {}, byActor = {};
  let totalFatal = 0, totalExposure = 0;
  events.forEach(e => {
    byType[e.event_type] = (byType[e.event_type]||0) + 1;
    if (e.admin1) byAdmin[e.admin1] = (byAdmin[e.admin1]||0) + 1;
    if (e.actor1) { const a = e.actor1.slice(0,50); byActor[a] = (byActor[a]||0) + 1; }
    totalFatal += parseInt(e.fatalities)||0;
    totalExposure += parseInt(e.population_best)||0;
  });
  const thisWeek = events.filter(e => (Date.now() - new Date(e.event_date)) < 7*864e5).length;

  const filtered = events.filter(e => {
    if (filter !== "all" && e.event_type !== filter) return false;
    if (actorFilter !== "all" && !(e.actor1||"").includes(actorFilter)) return false;
    if (stateFilter !== "all" && e.admin1 !== stateFilter) return false;
    return true;
  });
  const sorted = [...filtered].sort((a,b) => (b.event_date||"").localeCompare(a.event_date||""));

  const weekMap = {};
  events.forEach(e => {
    const d = new Date(e.event_date); const ws = new Date(d); ws.setDate(d.getDate()-d.getDay());
    const wk = ws.toISOString().slice(0,10);
    if (!weekMap[wk]) weekMap[wk] = { d:wk, total:0, types:{} };
    weekMap[wk].total++; weekMap[wk].types[e.event_type] = (weekMap[wk].types[e.event_type]||0)+1;
  });
  const weekly = Object.values(weekMap).sort((a,b) => a.d.localeCompare(b.d));
  const typeOrder = Object.entries(byType).sort((a,b) => b[1]-a[1]).map(([t]) => t);
  const topActors = Object.entries(byActor).sort((a,b) => b[1]-a[1]).slice(0,15);

  // Aggregate CAST by state (API returns one row per state per month)
  const castByState = useMemo(() => {
    const agg = {};
    cast.forEach(p => {
      if (!p.admin1) return;
      if (!agg[p.admin1]) agg[p.admin1] = { admin1:p.admin1, total_forecast:0, total_observed:0, battles_forecast:0, vac_forecast:0, erv_forecast:0, months:0 };
      agg[p.admin1].total_forecast += (p.total_forecast||0);
      agg[p.admin1].total_observed += (p.total_observed||0);
      agg[p.admin1].battles_forecast += (p.battles_forecast||0);
      agg[p.admin1].vac_forecast += (p.vac_forecast||0);
      agg[p.admin1].erv_forecast += (p.erv_forecast||0);
      agg[p.admin1].months++;
    });
    return Object.values(agg).sort((a,b) => b.total_forecast - a.total_forecast);
  }, [cast]);

  if (loading) return <div style={{ textAlign:"center", padding:40, color:MUTED, fontFamily:font, fontSize:14 }}>Conectando con ACLED...</div>;
  if (error) return <Card><div style={{ color:"#E5243B", fontSize:14, fontFamily:font }}>⚠ {error}</div></Card>;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", animation:"pulse 2s infinite" }} />
        <span style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", flex:1 }}>
          ACLED · Venezuela {new Date().getFullYear()} · {events.length} eventos · Actualiza cada lunes
        </span>
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}`, flexWrap:"wrap" }}>
          {[{id:"overview",l:"Vista general"},{id:"map",l:"Mapa"},{id:"cast",l:"CAST"},{id:"events",l:"Eventos"}].map(s => (
            <button key={s.id} onClick={() => setAcledView(s.id)}
              style={{ fontSize:10, fontFamily:font, padding:"5px 10px", border:"none",
                background:acledView===s.id?ACCENT:"transparent", color:acledView===s.id?"#fff":MUTED, cursor:"pointer" }}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(5,1fr)", gap:8, marginBottom:12 }}>
        {[
          {l:"Eventos",v:events.length,c:"#E5243B"},
          {l:"Fatalidades",v:totalFatal,c:"#dc2626"},
          {l:"Esta semana",v:thisWeek,c:"#f59e0b"},
          {l:"Exposición civil",v:totalExposure>1e6?`${(totalExposure/1e6).toFixed(1)}M`:totalExposure>1e3?`${(totalExposure/1e3).toFixed(0)}K`:totalExposure||"—",c:"#9b59b6"},
          {l:"Estados activos",v:Object.keys(byAdmin).length,c:"#4C9F38"},
        ].map((k,i) => (
          <Card key={i} accent={k.c}>
            <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>{k.l}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.c, fontFamily:"'Playfair Display',serif" }}>{k.v}</div>
          </Card>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {acledView === "overview" && (<>
        {/* Stacked weekly bars — clickable */}
        {weekly.length > 1 && (
          <Card>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
              Eventos por semana · Click en una barra para ver detalle
            </div>
            <svg width="100%" viewBox="0 0 700 180" style={{ display:"block" }}>
              {(() => {
                const maxW = Math.max(...weekly.map(w => w.total),1);
                const bw = Math.max(6, (640/weekly.length)-2);
                return weekly.map((w,i) => {
                  const x = 45 + i*(650/weekly.length); let cy = 155;
                  const isSel = filter === `week:${w.d}`;
                  return (<g key={i} style={{ cursor:"pointer" }}
                    onClick={() => { setFilter(filter===`week:${w.d}` ? "all" : `week:${w.d}`); setAcledPage(1); }}>
                    <rect x={x-1} y={10} width={bw+2} height={165} fill={isSel ? "rgba(0,0,0,0.06)" : "transparent"} />
                    {typeOrder.map(t => { const c = w.types[t]||0; if (!c) return null; const h = (c/maxW)*130; cy -= h;
                      return <rect key={t} x={x} y={cy} width={bw} height={h} fill={EC[t]||ACCENT}
                        opacity={filter!=="all"&&!isSel&&!filter.startsWith("week:")?0.3:isSel?1:0.75} rx={1}><title>{w.d} · {t}: {c}</title></rect>; })}
                    {isSel && <line x1={x+bw/2} y1={155} x2={x+bw/2} y2={160} stroke={ACCENT} strokeWidth={2} />}
                    {i % Math.max(1,Math.floor(weekly.length/8)) === 0 && <text x={x+bw/2} y={172} textAnchor="middle" fontSize={7} fill={isSel?TEXT:MUTED} fontWeight={isSel?700:400} fontFamily={font}>{new Date(w.d+"T00:00").toLocaleDateString("es",{day:"numeric",month:"short"})}</text>}
                  </g>);
                });
              })()}
            </svg>
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:4 }}>
              {typeOrder.map(t => <span key={t} style={{ fontSize:9, fontFamily:font, color:EC[t] }}>■ {trad(t)}</span>)}
            </div>
          </Card>
        )}

        {/* Week detail panel */}
        {filter.startsWith("week:") && (() => {
          const wkDate = filter.replace("week:","");
          const wk = weekly.find(w => w.d === wkDate);
          if (!wk) return null;
          const wkEnd = new Date(wkDate); wkEnd.setDate(wkEnd.getDate()+7);
          const wkEvents = events.filter(e => e.event_date >= wkDate && e.event_date < wkEnd.toISOString().slice(0,10))
            .sort((a,b) => (b.event_date||"").localeCompare(a.event_date||""));
          const wkFatal = wkEvents.reduce((s,e) => s+(parseInt(e.fatalities)||0),0);
          const wkTypes = {}; wkEvents.forEach(e => { wkTypes[e.event_type]=(wkTypes[e.event_type]||0)+1; });
          return (<>
            <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:8 }}>
              {[{l:`Semana ${wkDate}`,v:wkEvents.length,c:ACCENT},{l:"Fatalidades",v:wkFatal,c:"#dc2626"},
                {l:"Tipos activos",v:Object.keys(wkTypes).length,c:"#4C9F38"},{l:"",v:<span style={{fontSize:10,cursor:"pointer",color:MUTED}} onClick={() => setFilter("all")}>✕ Cerrar</span>,c:MUTED}
              ].map((k,i) => <Card key={i} accent={k.c}><div style={{fontSize:9,fontFamily:font,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>{k.l}</div><div style={{fontSize:18,fontWeight:800,color:k.c,fontFamily:"'Playfair Display',serif"}}>{k.v}</div></Card>)}
            </div>
            <Card>
              {wkEvents.slice(0,15).map((e,i) => (
                <div key={i} style={{ padding:"5px 0", borderBottom:`1px solid ${BORDER}20`, display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div style={{ minWidth:62, fontSize:10, fontFamily:font, color:MUTED }}>{e.event_date}</div>
                  <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${EC[e.event_type]||ACCENT}15`, color:EC[e.event_type]||ACCENT, border:`1px solid ${EC[e.event_type]||ACCENT}25`, whiteSpace:"nowrap" }}>{trad(e.sub_event_type||e.event_type)}</span>
                  {parseInt(e.fatalities)>0 && <span style={{ fontSize:9, fontFamily:font, padding:"1px 4px", background:"#dc262615", color:"#dc2626" }}>💀{e.fatalities}</span>}
                  <div style={{ flex:1 }}><div style={{ fontSize:10, color:TEXT }}>{e.location}{e.admin1?`, ${e.admin1}`:""}</div>
                    <div style={{ fontSize:9, color:MUTED, marginTop:1, lineHeight:1.4 }}>{(e.notes||"").slice(0,180)}{(e.notes||"").length>180?"...":""}</div></div>
                </div>
              ))}
              {wkEvents.length > 15 && <div style={{ fontSize:10, fontFamily:font, color:MUTED, marginTop:6 }}>... y {wkEvents.length-15} más</div>}
            </Card>
          </>);
        })()}

        {/* Type + Actor — selectable with detail */}
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10 }}>
          <Card>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
              Por tipo de evento {filter !== "all" && !filter.startsWith("week:") && <span style={{ color:EC[filter]||ACCENT, cursor:"pointer" }} onClick={() => setFilter("all")}> · {filter} ✕</span>}
            </div>
            {Object.entries(byType).sort((a,b) => b[1]-a[1]).map(([t,c]) => {
              const isActive = filter === t;
              return (
                <div key={t} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, cursor:"pointer",
                  opacity:filter!=="all"&&!filter.startsWith("week:")&&!isActive?0.3:1, padding:"2px 4px",
                  background:isActive?`${EC[t]}15`:"transparent", border:isActive?`1px solid ${EC[t]}30`:"1px solid transparent" }}
                  onClick={() => { setFilter(isActive?"all":t); setAcledPage(1); }}>
                  <span style={{ fontSize:10, fontFamily:font, color:EC[t]||MUTED, minWidth:140 }}>{trad(t)}</span>
                  <div style={{ flex:1, height:14, background:`${BORDER}30`, position:"relative" }}>
                    <div style={{ width:`${(c/events.length)*100}%`, height:"100%", background:EC[t]||ACCENT, opacity:isActive?1:0.7 }} />
                    <span style={{ position:"absolute", right:4, top:1, fontSize:9, fontFamily:font, color:TEXT }}>{c}</span>
                  </div>
                </div>
              );
            })}
          </Card>
          <Card>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
              Top actores {actorFilter !== "all" && <span style={{ color:ACCENT, cursor:"pointer" }} onClick={() => setActorFilter("all")}> · {actorFilter.slice(0,30)} ✕</span>}
            </div>
            {topActors.map(([a,c]) => {
              const isActive = actorFilter === a;
              return (
                <div key={a} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3, cursor:"pointer",
                  opacity:actorFilter!=="all"&&!isActive?0.3:1, padding:"2px 4px",
                  background:isActive?`${ACCENT}15`:"transparent", border:isActive?`1px solid ${ACCENT}30`:"1px solid transparent" }}
                  onClick={() => { setActorFilter(isActive?"all":a); setAcledPage(1); }}>
                  <span style={{ fontSize:9, fontFamily:font, color:isActive?ACCENT:MUTED, minWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a}</span>
                  <div style={{ flex:1, height:12, background:`${BORDER}30`, position:"relative" }}>
                    <div style={{ width:`${(c/topActors[0][1])*100}%`, height:"100%", background:isActive?ACCENT:`${ACCENT}60` }} />
                    <span style={{ position:"absolute", right:3, top:0, fontSize:9, fontFamily:font, color:TEXT }}>{c}</span>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Type detail panel */}
        {filter !== "all" && !filter.startsWith("week:") && (() => {
          const tEvents = events.filter(e => e.event_type === filter).sort((a,b) => (b.event_date||"").localeCompare(a.event_date||""));
          const tFatal = tEvents.reduce((s,e) => s+(parseInt(e.fatalities)||0),0);
          const tStates = {}; tEvents.forEach(e => { if(e.admin1) tStates[e.admin1]=(tStates[e.admin1]||0)+1; });
          const tActors = {}; tEvents.forEach(e => { if(e.actor1) { const a=e.actor1.slice(0,50); tActors[a]=(tActors[a]||0)+1; }});
          const tPP = 15, tTotalP = Math.ceil(tEvents.length/tPP), tPage = tEvents.slice((acledPage-1)*tPP, acledPage*tPP);
          return (<>
            <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:8 }}>
              {[{l:filter,v:tEvents.length,c:EC[filter]||ACCENT},{l:"Fatalidades",v:tFatal,c:"#dc2626"},{l:"Estados",v:Object.keys(tStates).length,c:"#0A97D9"},{l:"Actores",v:Object.keys(tActors).length,c:"#9b59b6"}]
                .map((k,i) => <Card key={i} accent={k.c}><div style={{fontSize:9,fontFamily:font,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>{k.l}</div><div style={{fontSize:18,fontWeight:800,color:k.c,fontFamily:"'Playfair Display',serif"}}>{k.v}</div></Card>)}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10 }}>
              <Card>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Por estado</div>
                {Object.entries(tStates).sort((a,b) => b[1]-a[1]).slice(0,12).map(([s,c]) => (
                  <div key={s} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:TEXT, minWidth:110 }}>{s}</span>
                    <div style={{ flex:1, height:10, background:`${BORDER}30`, position:"relative" }}>
                      <div style={{ width:`${(c/Object.values(tStates).reduce((a,b)=>Math.max(a,b),1))*100}%`, height:"100%", background:EC[filter]||ACCENT, opacity:0.7 }} />
                    </div>
                    <span style={{ fontSize:9, fontWeight:600, color:EC[filter]||ACCENT, fontFamily:font }}>{c}</span>
                  </div>
                ))}
              </Card>
              <Card>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Actores principales</div>
                {Object.entries(tActors).sort((a,b) => b[1]-a[1]).slice(0,10).map(([a,c]) => (
                  <div key={a} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:MUTED, minWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a}</span>
                    <div style={{ flex:1, height:10, background:`${BORDER}30`, position:"relative" }}>
                      <div style={{ width:`${(c/Object.values(tActors).reduce((a,b)=>Math.max(a,b),1))*100}%`, height:"100%", background:`${ACCENT}70` }} />
                    </div>
                    <span style={{ fontSize:9, fontFamily:font, color:TEXT }}>{c}</span>
                  </div>
                ))}
              </Card>
            </div>
            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Eventos · {filter} · {tEvents.length}</div>
                {tTotalP>1 && <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <button onClick={() => setAcledPage(Math.max(1,acledPage-1))} disabled={acledPage===1} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:acledPage===1?`${MUTED}40`:TEXT, cursor:acledPage===1?"default":"pointer" }}>←</button>
                  <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>{acledPage}/{tTotalP}</span>
                  <button onClick={() => setAcledPage(Math.min(tTotalP,acledPage+1))} disabled={acledPage>=tTotalP} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:acledPage>=tTotalP?`${MUTED}40`:TEXT, cursor:acledPage>=tTotalP?"default":"pointer" }}>→</button>
                </div>}
              </div>
              {tPage.map((e,i) => (
                <div key={i} style={{ padding:"5px 0", borderBottom:`1px solid ${BORDER}20`, display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div style={{ minWidth:62, fontSize:10, fontFamily:font, color:MUTED }}>{e.event_date}</div>
                  <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${EC[e.event_type]||ACCENT}15`, color:EC[e.event_type]||ACCENT, whiteSpace:"nowrap" }}>{trad(e.sub_event_type||e.event_type)}</span>
                  {parseInt(e.fatalities)>0 && <span style={{ fontSize:9, fontFamily:font, padding:"1px 4px", background:"#dc262615", color:"#dc2626" }}>💀{e.fatalities}</span>}
                  <div style={{ flex:1 }}><div style={{ fontSize:10, color:TEXT }}>{e.location}{e.admin1?`, ${e.admin1}`:""}</div>
                    {e.actor1 && <div style={{ fontSize:9, color:ACCENT, marginTop:1 }}>{e.actor1}</div>}
                    <div style={{ fontSize:9, color:MUTED, marginTop:1, lineHeight:1.4 }}>{(e.notes||"").slice(0,180)}{(e.notes||"").length>180?"...":""}</div></div>
                </div>
              ))}
            </Card>
          </>);
        })()}

        {/* Actor detail panel */}
        {actorFilter !== "all" && (() => {
          const aEvents = events.filter(e => (e.actor1||"").includes(actorFilter)).sort((a,b) => (b.event_date||"").localeCompare(a.event_date||""));
          const aFatal = aEvents.reduce((s,e) => s+(parseInt(e.fatalities)||0),0);
          const aTypes = {}; aEvents.forEach(e => { aTypes[e.event_type]=(aTypes[e.event_type]||0)+1; });
          const aStates = {}; aEvents.forEach(e => { if(e.admin1) aStates[e.admin1]=(aStates[e.admin1]||0)+1; });
          const aPP = 15, aTotalP = Math.ceil(aEvents.length/aPP), aPage = aEvents.slice((acledPage-1)*aPP, acledPage*aPP);
          return (<>
            <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:8 }}>
              {[{l:actorFilter.slice(0,35),v:aEvents.length,c:ACCENT},{l:"Fatalidades",v:aFatal,c:"#dc2626"},{l:"Tipos",v:Object.keys(aTypes).length,c:"#4C9F38"},{l:"Estados",v:Object.keys(aStates).length,c:"#0A97D9"}]
                .map((k,i) => <Card key={i} accent={k.c}><div style={{fontSize:9,fontFamily:font,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>{k.l}</div><div style={{fontSize:18,fontWeight:800,color:k.c,fontFamily:"'Playfair Display',serif"}}>{k.v}</div></Card>)}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10 }}>
              <Card>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Tipos de evento</div>
                {Object.entries(aTypes).sort((a,b) => b[1]-a[1]).map(([t,c]) => (
                  <div key={t} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:EC[t]||MUTED, minWidth:130 }}>{trad(t)}</span>
                    <div style={{ flex:1, height:10, background:`${BORDER}30`, position:"relative" }}>
                      <div style={{ width:`${(c/aEvents.length)*100}%`, height:"100%", background:EC[t]||ACCENT, opacity:0.7 }} />
                    </div>
                    <span style={{ fontSize:9, fontWeight:600, color:EC[t]||ACCENT, fontFamily:font }}>{c}</span>
                  </div>
                ))}
              </Card>
              <Card>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Estados donde opera</div>
                {Object.entries(aStates).sort((a,b) => b[1]-a[1]).slice(0,10).map(([s,c]) => (
                  <div key={s} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:TEXT, minWidth:110 }}>{s}</span>
                    <div style={{ flex:1, height:10, background:`${BORDER}30`, position:"relative" }}>
                      <div style={{ width:`${(c/Object.values(aStates).reduce((a,b)=>Math.max(a,b),1))*100}%`, height:"100%", background:`${ACCENT}70` }} />
                    </div>
                    <span style={{ fontSize:9, fontFamily:font, color:TEXT }}>{c}</span>
                  </div>
                ))}
              </Card>
            </div>
            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>Eventos · {actorFilter.slice(0,40)} · {aEvents.length}</div>
                {aTotalP>1 && <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <button onClick={() => setAcledPage(Math.max(1,acledPage-1))} disabled={acledPage===1} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:acledPage===1?`${MUTED}40`:TEXT, cursor:acledPage===1?"default":"pointer" }}>←</button>
                  <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>{acledPage}/{aTotalP}</span>
                  <button onClick={() => setAcledPage(Math.min(aTotalP,acledPage+1))} disabled={acledPage>=aTotalP} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:acledPage>=aTotalP?`${MUTED}40`:TEXT, cursor:acledPage>=aTotalP?"default":"pointer" }}>→</button>
                </div>}
              </div>
              {aPage.map((e,i) => (
                <div key={i} style={{ padding:"5px 0", borderBottom:`1px solid ${BORDER}20`, display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div style={{ minWidth:62, fontSize:10, fontFamily:font, color:MUTED }}>{e.event_date}</div>
                  <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${EC[e.event_type]||ACCENT}15`, color:EC[e.event_type]||ACCENT, whiteSpace:"nowrap" }}>{trad(e.sub_event_type||e.event_type)}</span>
                  {parseInt(e.fatalities)>0 && <span style={{ fontSize:9, fontFamily:font, padding:"1px 4px", background:"#dc262615", color:"#dc2626" }}>💀{e.fatalities}</span>}
                  <div style={{ flex:1 }}><div style={{ fontSize:10, color:TEXT }}>{e.location}{e.admin1?`, ${e.admin1}`:""}</div>
                    <div style={{ fontSize:9, color:MUTED, marginTop:1, lineHeight:1.4 }}>{(e.notes||"").slice(0,180)}{(e.notes||"").length>180?"...":""}</div></div>
                </div>
              ))}
            </Card>
          </>);
        })()}

        <Card>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
            Eventos por estado {stateFilter !== "all" && <span style={{ color:ACCENT, cursor:"pointer" }} onClick={() => setStateFilter("all")}>· {stateFilter} ✕</span>}
          </div>
          <div style={{ display:"flex", gap:12, flexDirection:mob?"column":"row" }}>
            {/* SVG Map */}
            <div style={{ flex:mob?"1 1 100%":"0 0 55%" }}>
              <svg viewBox="0 0 600 420" width="100%" style={{ background:BG3 }}>
                {VZ_MAP.map(state => {
                  const acledName = Object.keys(byAdmin).find(a =>
                    a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").includes(state.id.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")) ||
                    state.id.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").includes(a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""))
                  );
                  const count = acledName ? byAdmin[acledName] : 0;
                  const mx = Math.max(...Object.values(byAdmin), 1);
                  const intensity = count / mx;
                  const isSelected = stateFilter === acledName;
                  const fillColor = count === 0 ? `${MUTED}15` :
                    intensity > 0.7 ? "#E5243B" : intensity > 0.4 ? "#f59e0b" : intensity > 0.15 ? "#0A97D9" : "#4C9F38";
                  return (
                    <g key={state.id}>
                      <path d={state.d}
                        fill={isSelected ? fillColor : `${fillColor}${count > 0 ? "60" : "15"}`}
                        stroke={isSelected ? "#fff" : BORDER} strokeWidth={isSelected ? 2 : 0.5}
                        style={{ cursor: count > 0 ? "pointer" : "default", transition:"all 0.2s" }}
                        opacity={stateFilter !== "all" && !isSelected ? 0.25 : 1}
                        onClick={() => { if (acledName) { setStateFilter(stateFilter === acledName ? "all" : acledName); setAcledPage(1); }}}
                        onMouseEnter={e => { if(count>0) { e.currentTarget.setAttribute("stroke","#fff"); e.currentTarget.setAttribute("stroke-width","1.5"); }}}
                        onMouseLeave={e => { if(!isSelected) { e.currentTarget.setAttribute("stroke",BORDER); e.currentTarget.setAttribute("stroke-width","0.5"); }}}
                      ><title>{state.id}: {count} eventos</title></path>
                    </g>
                  );
                })}
              </svg>
              <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:4 }}>
                {[["Bajo","#4C9F38"],["Medio","#0A97D9"],["Alto","#f59e0b"],["Crítico","#E5243B"]].map(([l,c]) =>
                  <span key={l} style={{ fontSize:9, fontFamily:font, color:c }}>■ {l}</span>
                )}
              </div>
            </div>
            {/* Ranking */}
            <div style={{ flex:1, maxHeight:mob?250:400, overflowY:"auto" }}>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, marginBottom:6, letterSpacing:"0.08em", textTransform:"uppercase" }}>Ranking por eventos</div>
              {Object.entries(byAdmin).sort((a,b) => b[1]-a[1]).map(([st,ct], idx) => {
                const mx = Math.max(...Object.values(byAdmin),1);
                const int = ct/mx;
                const bg = int>0.7?"#E5243B":int>0.4?"#f59e0b":int>0.15?"#0A97D9":"#4C9F38";
                const isActive = stateFilter === st;
                return (
                  <div key={st} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3, cursor:"pointer",
                    opacity: stateFilter!=="all"&&!isActive?0.3:1, padding:"3px 4px",
                    background: isActive?`${bg}20`:"transparent", border: isActive?`1px solid ${bg}40`:"1px solid transparent" }}
                    onClick={() => { setStateFilter(isActive?"all":st); setAcledPage(1); }}>
                    <span style={{ fontSize:10, fontFamily:font, color:MUTED, minWidth:16 }}>{idx+1}</span>
                    <span style={{ fontSize:10, fontFamily:font, color:isActive?bg:TEXT, flex:1 }}>{st}</span>
                    <div style={{ width:60, height:10, background:`${BORDER}30`, position:"relative" }}>
                      <div style={{ width:`${(ct/mx)*100}%`, height:"100%", background:bg, opacity:0.7 }} />
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:bg, fontFamily:font, minWidth:24, textAlign:"right" }}>{ct}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* ── State detail panel ── */}
        {stateFilter !== "all" && (() => {
          const stEvents = events.filter(e => e.admin1 === stateFilter);
          const stFatal = stEvents.reduce((s,e) => s+(parseInt(e.fatalities)||0), 0);
          const stExposure = stEvents.reduce((s,e) => s+(parseInt(e.population_best)||0), 0);
          const stTypes = {}; stEvents.forEach(e => { stTypes[e.event_type] = (stTypes[e.event_type]||0)+1; });
          const stActors = {}; stEvents.forEach(e => { if(e.actor1) { const a=e.actor1.slice(0,60); stActors[a]=(stActors[a]||0)+1; }});
          const stSorted = [...stEvents].sort((a,b) => (b.event_date||"").localeCompare(a.event_date||""));
          const stPage = acledPage;
          const stPP = 15;
          const stTotalP = Math.ceil(stSorted.length/stPP);
          const stPageEvents = stSorted.slice((stPage-1)*stPP, stPage*stPP);
          return (<>
            {/* State KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:8, marginTop:0 }}>
              {[
                {l:"Eventos",v:stEvents.length,c:"#E5243B"},
                {l:"Fatalidades",v:stFatal,c:"#dc2626"},
                {l:"Exposición civil",v:stExposure>1e3?`${(stExposure/1e3).toFixed(0)}K`:stExposure||"—",c:"#9b59b6"},
                {l:"Tipos de evento",v:Object.keys(stTypes).length,c:"#4C9F38"},
              ].map((k,i) => (
                <Card key={i} accent={k.c}>
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>{k.l}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:k.c, fontFamily:"'Playfair Display',serif" }}>{k.v}</div>
                </Card>
              ))}
            </div>

            {/* State type + actors */}
            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10 }}>
              <Card>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Tipos en {stateFilter}</div>
                {Object.entries(stTypes).sort((a,b) => b[1]-a[1]).map(([t,c]) => (
                  <div key={t} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:EC[t]||MUTED, minWidth:130 }}>{trad(t)}</span>
                    <div style={{ flex:1, height:12, background:`${BORDER}30`, position:"relative" }}>
                      <div style={{ width:`${(c/stEvents.length)*100}%`, height:"100%", background:EC[t]||ACCENT, opacity:0.8 }} />
                      <span style={{ position:"absolute", right:3, top:0, fontSize:9, fontFamily:font, color:TEXT }}>{c}</span>
                    </div>
                  </div>
                ))}
              </Card>
              <Card>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Actores en {stateFilter}</div>
                {Object.entries(stActors).sort((a,b) => b[1]-a[1]).slice(0,10).map(([a,c]) => (
                  <div key={a} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:MUTED, minWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a}</span>
                    <div style={{ flex:1, height:12, background:`${BORDER}30`, position:"relative" }}>
                      <div style={{ width:`${(c/Object.values(stActors).reduce((a,b)=>Math.max(a,b),1))*100}%`, height:"100%", background:`${ACCENT}70` }} />
                      <span style={{ position:"absolute", right:3, top:0, fontSize:9, fontFamily:font, color:TEXT }}>{c}</span>
                    </div>
                  </div>
                ))}
              </Card>
            </div>

            {/* State events list */}
            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>
                  Eventos en {stateFilter} · {stSorted.length} registros
                </div>
                {stTotalP > 1 && (
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <button onClick={() => setAcledPage(Math.max(1,stPage-1))} disabled={stPage===1} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:stPage===1?`${MUTED}40`:TEXT, cursor:stPage===1?"default":"pointer" }}>←</button>
                    <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>{stPage}/{stTotalP}</span>
                    <button onClick={() => setAcledPage(Math.min(stTotalP,stPage+1))} disabled={stPage>=stTotalP} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:stPage>=stTotalP?`${MUTED}40`:TEXT, cursor:stPage>=stTotalP?"default":"pointer" }}>→</button>
                  </div>
                )}
              </div>
              {stPageEvents.map((e,i) => (
                <div key={i} style={{ padding:"6px 0", borderBottom:`1px solid ${BORDER}20`, display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div style={{ minWidth:62, fontSize:10, fontFamily:font, color:MUTED }}>{e.event_date}</div>
                  <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${EC[e.event_type]||ACCENT}15`, color:EC[e.event_type]||ACCENT, border:`1px solid ${EC[e.event_type]||ACCENT}25`, whiteSpace:"nowrap" }}>
                    {trad(e.sub_event_type||e.event_type)}
                  </span>
                  {parseInt(e.fatalities)>0 && <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:"#dc262615", color:"#dc2626", border:"1px solid #dc262625" }}>💀{e.fatalities}</span>}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:TEXT }}>{e.location}{e.admin2?`, ${e.admin2}`:""}</div>
                    {e.actor1 && <div style={{ fontSize:9, color:ACCENT, marginTop:1 }}>{e.actor1}</div>}
                    <div style={{ fontSize:10, color:MUTED, marginTop:2, lineHeight:1.5 }}>{(e.notes||"").slice(0,200)}{(e.notes||"").length>200?"...":""}</div>
                  </div>
                </div>
              ))}
              {stTotalP > 1 && (
                <div style={{ display:"flex", justifyContent:"center", gap:3, marginTop:8 }}>
                  {Array.from({length:Math.min(7,stTotalP)},(_,i) => {
                    let p; if(stTotalP<=7) p=i+1; else if(stPage<=4) p=i+1; else if(stPage>=stTotalP-3) p=stTotalP-6+i; else p=stPage-3+i;
                    return <button key={p} onClick={() => setAcledPage(p)} style={{ fontSize:9, fontFamily:font, padding:"2px 6px", border:`1px solid ${p===stPage?ACCENT:BORDER}`, background:p===stPage?ACCENT:"transparent", color:p===stPage?"#fff":MUTED, cursor:"pointer", minWidth:20 }}>{p}</button>;
                  })}
                </div>
              )}
            </Card>
          </>);
        })()}
      </>)}

      {/* ═══ MAP ═══ */}
      {acledView === "map" && (
        <Card>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
            Mapa de eventos · {filtered.length} puntos {filter!=="all"?`(${filter})`:""} {actorFilter!=="all"?`· ${actorFilter}`:""} {stateFilter!=="all"?`· ${stateFilter}`:""}
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
            <button onClick={() => setFilter("all")} style={{ fontSize:9, fontFamily:font, padding:"2px 6px", border:`1px solid ${filter==="all"?ACCENT:BORDER}`, background:filter==="all"?ACCENT:"transparent", color:filter==="all"?"#fff":MUTED, cursor:"pointer" }}>Todos</button>
            {typeOrder.map(t => <button key={t} onClick={() => setFilter(filter===t?"all":t)} style={{ fontSize:9, fontFamily:font, padding:"2px 6px", border:`1px solid ${filter===t?EC[t]:BORDER}`, background:filter===t?`${EC[t]}20`:"transparent", color:EC[t], cursor:"pointer" }}>{t}</button>)}
          </div>
          <LeafletMap events={filtered} EC={EC} TR={TR} />
          <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:6 }}>
            {typeOrder.map(t => <span key={t} style={{ fontSize:9, fontFamily:font, color:EC[t] }}>● {t}</span>)}
            <span style={{ fontSize:9, fontFamily:font, color:MUTED }}>· Tamaño = fatalidades</span>
          </div>
        </Card>
      )}

      {/* ═══ CAST ═══ */}
      {acledView === "cast" && (<>
        {/* Explainer */}
        <Card accent="#f59e0b">
          <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
            <span style={{ fontSize:22 }}>🔮</span>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:TEXT, marginBottom:4 }}>Sistema de Alerta de Conflictos (CAST)</div>
              <div style={{ fontSize:12, color:MUTED, lineHeight:1.7 }}>
                ACLED usa inteligencia artificial para predecir cuántos eventos de conflicto ocurrirán en los próximos meses en cada estado de Venezuela.
                La predicción se compara con lo que realmente se observó para medir la precisión del modelo.
                <strong style={{ color:"#f59e0b" }}> Amarillo = predicción</strong>, <strong style={{ color:ACCENT }}> Azul = realidad observada</strong>.
                Si la predicción supera lo observado, significa que ACLED espera un <strong style={{ color:"#E5243B" }}>aumento de conflicto</strong>.
              </div>
            </div>
          </div>
        </Card>

        {cast.length === 0 ? <Card><div style={{ color:MUTED, fontSize:13, fontFamily:font, textAlign:"center", padding:20 }}>No hay predicciones disponibles actualmente.</div></Card> : (<>
          {/* Summary KPIs */}
          {(() => {
            const totalF = Math.round(castByState.reduce((s,p) => s+p.total_forecast,0));
            const totalO = Math.round(castByState.reduce((s,p) => s+p.total_observed,0));
            const battlesF = Math.round(castByState.reduce((s,p) => s+p.battles_forecast,0));
            const vacF = Math.round(castByState.reduce((s,p) => s+p.vac_forecast,0));
            const diff = totalF - totalO;
            const trend = diff > 10 ? "AUMENTO" : diff < -10 ? "DESCENSO" : "ESTABLE";
            const trendColor = diff > 10 ? "#E5243B" : diff < -10 ? "#4C9F38" : "#f59e0b";
            return (
              <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(5,1fr)", gap:8, marginBottom:12 }}>
                <Card accent="#f59e0b">
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>Eventos previstos</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#f59e0b", fontFamily:"'Playfair Display',serif" }}>{totalF}</div>
                  <div style={{ fontSize:9, color:MUTED }}>Próximos meses</div>
                </Card>
                <Card accent={ACCENT}>
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>Eventos observados</div>
                  <div style={{ fontSize:20, fontWeight:800, color:ACCENT, fontFamily:"'Playfair Display',serif" }}>{totalO}</div>
                  <div style={{ fontSize:9, color:MUTED }}>Hasta ahora</div>
                </Card>
                <Card accent={trendColor}>
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>Tendencia</div>
                  <div style={{ fontSize:16, fontWeight:800, color:trendColor, fontFamily:"'Syne',sans-serif" }}>{trend}</div>
                  <div style={{ fontSize:9, color:MUTED }}>{diff > 0 ? `+${diff}` : diff} vs observado</div>
                </Card>
                <Card accent="#E5243B">
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>Batallas previstas</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#E5243B", fontFamily:"'Playfair Display',serif" }}>{battlesF}</div>
                  <div style={{ fontSize:9, color:MUTED }}>Enfrentamientos armados</div>
                </Card>
                <Card accent="#dc2626">
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>Violencia civil prev.</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#dc2626", fontFamily:"'Playfair Display',serif" }}>{vacF}</div>
                  <div style={{ fontSize:9, color:MUTED }}>Contra civiles</div>
                </Card>
              </div>
            );
          })()}

          {/* State-by-state risk table */}
          <Card>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
              Nivel de riesgo por estado · Previsto vs Observado
            </div>
            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10 }}>
              {/* Risk map */}
              <div>
                {castByState.map((p,i) => {
                  const f = Math.round(p.total_forecast), o = Math.round(p.total_observed);
                  const maxBar = Math.max(...castByState.map(q => Math.max(q.total_forecast, q.total_observed)), 1);
                  const diff = f - o;
                  const riskColor = f > 20 ? "#E5243B" : f > 10 ? "#f59e0b" : f > 3 ? "#0A97D9" : "#4C9F38";
                  const riskLabel = f > 20 ? "ALTO" : f > 10 ? "MEDIO" : f > 3 ? "BAJO" : "MÍN.";
                  const isSel = castState === p.admin1;
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, padding:"3px 4px", cursor:"pointer",
                      background: isSel ? `${riskColor}15` : i < 3 ? `${riskColor}08` : "transparent",
                      border: isSel ? `1px solid ${riskColor}40` : "1px solid transparent",
                      opacity: castState && !isSel ? 0.35 : 1 }}
                      onClick={() => setCastState(isSel ? null : p.admin1)}>
                      <span style={{ fontSize:9, fontFamily:font, padding:"1px 4px", background:`${riskColor}20`, color:riskColor,
                        border:`1px solid ${riskColor}30`, minWidth:32, textAlign:"center", fontWeight:700 }}>{riskLabel}</span>
                      <span style={{ fontSize:10, fontFamily:font, color:isSel ? riskColor : TEXT, fontWeight:isSel?700:400, minWidth:100 }}>{p.admin1}</span>
                      <div style={{ flex:1, height:16, position:"relative", background:`${BORDER}20` }}>
                        <div style={{ position:"absolute", top:0, left:0, height:7, width:`${(f/maxBar)*100}%`, background:"#f59e0b", opacity:0.8, borderRadius:"1px 1px 0 0" }} />
                        <div style={{ position:"absolute", top:8, left:0, height:7, width:`${(o/maxBar)*100}%`, background:ACCENT, opacity:0.8, borderRadius:"0 0 1px 1px" }} />
                      </div>
                      <span style={{ fontSize:9, fontFamily:font, color:"#f59e0b", minWidth:20, textAlign:"right" }}>{f}</span>
                      <span style={{ fontSize:9, fontFamily:font, color:ACCENT, minWidth:20, textAlign:"right" }}>{o}</span>
                      <span style={{ fontSize:9, fontFamily:font, color: diff > 0 ? "#E5243B" : "#4C9F38", minWidth:28, textAlign:"right" }}>
                        {diff > 0 ? `↑${diff}` : diff < 0 ? `↓${Math.abs(diff)}` : "="}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Explanation sidebar OR selected state detail */}
              <div style={{ padding:8 }}>
                {!castState ? (<>
                  <div style={{ fontSize:12, fontWeight:600, color:TEXT, marginBottom:8 }}>¿Cómo leer esta tabla?</div>
                  <div style={{ fontSize:10, color:MUTED, lineHeight:1.8, marginBottom:12 }}>
                    Cada fila es un estado. Las barras muestran eventos previstos (amarillo) vs observados (azul). Click en un estado para ver el detalle.
                  </div>
                  <div style={{ fontSize:10, color:MUTED, lineHeight:1.8, marginBottom:12 }}>
                    La flecha indica si se espera <strong style={{ color:"#E5243B" }}>↑ más conflicto</strong> o <strong style={{ color:"#4C9F38" }}>↓ menos</strong>.
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:TEXT, marginBottom:6 }}>Niveles de riesgo</div>
                  {[
                    {l:"ALTO",c:"#E5243B",d:">20 eventos. Máxima alerta."},
                    {l:"MEDIO",c:"#f59e0b",d:"10-20 eventos. Monitoreo activo."},
                    {l:"BAJO",c:"#0A97D9",d:"3-10 eventos. Situación controlada."},
                    {l:"MÍN.",c:"#4C9F38",d:"<3 eventos. Sin alertas."},
                  ].map((r,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                      <span style={{ fontSize:9, fontFamily:font, padding:"1px 4px", background:`${r.c}20`, color:r.c, border:`1px solid ${r.c}30`, minWidth:36, textAlign:"center", fontWeight:700 }}>{r.l}</span>
                      <span style={{ fontSize:10, color:MUTED }}>{r.d}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", gap:12, marginTop:10 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:"#f59e0b" }}>■ Previsto</span>
                    <span style={{ fontSize:9, fontFamily:font, color:ACCENT }}>■ Observado</span>
                  </div>
                </>) : (<>
                  {/* Selected state detail */}
                  {(() => {
                    const cp = castByState.find(p => p.admin1 === castState);
                    if (!cp) return null;
                    const f = Math.round(cp.total_forecast), o = Math.round(cp.total_observed);
                    const bf = Math.round(cp.battles_forecast), vf = Math.round(cp.vac_forecast), ef = Math.round(cp.erv_forecast);
                    const diff = f - o;
                    const riskColor = f > 20 ? "#E5243B" : f > 10 ? "#f59e0b" : f > 3 ? "#0A97D9" : "#4C9F38";
                    const riskLabel = f > 20 ? "ALTO" : f > 10 ? "MEDIO" : f > 3 ? "BAJO" : "MÍNIMO";
                    // Real events from ACLED for this state
                    const stEvents = events.filter(e => e.admin1 && (
                      e.admin1.toLowerCase().includes(castState.toLowerCase()) ||
                      castState.toLowerCase().includes(e.admin1.toLowerCase())
                    )).sort((a,b) => (b.event_date||"").localeCompare(a.event_date||""));
                    const stTypes = {}; stEvents.forEach(e => { stTypes[e.event_type]=(stTypes[e.event_type]||0)+1; });
                    const stFatal = stEvents.reduce((s,e) => s+(parseInt(e.fatalities)||0), 0);
                    return (
                      <div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:riskColor }}>{castState}</div>
                          <span style={{ fontSize:10, fontFamily:font, color:MUTED, cursor:"pointer" }} onClick={() => setCastState(null)}>✕ Cerrar</span>
                        </div>
                        {/* Risk badge */}
                        <div style={{ display:"inline-block", padding:"3px 10px", background:`${riskColor}20`, color:riskColor, border:`1px solid ${riskColor}40`, fontSize:13, fontWeight:700, fontFamily:font, marginBottom:10 }}>
                          Riesgo {riskLabel}
                        </div>
                        {/* CAST predictions */}
                        <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Predicción CAST</div>
                        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:4, marginBottom:10 }}>
                          {[
                            {l:"Total previsto",v:f,c:"#f59e0b"},{l:"Total observado",v:o,c:ACCENT},
                            {l:"Batallas prev.",v:bf,c:"#E5243B"},{l:"Violencia civil",v:vf,c:"#dc2626"},
                          ].map((k,i) => (
                            <div key={i} style={{ padding:"4px 6px", background:BG2, border:`1px solid ${BORDER}` }}>
                              <div style={{ fontSize:8, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>{k.l}</div>
                              <div style={{ fontSize:16, fontWeight:800, color:k.c, fontFamily:"'Playfair Display',serif" }}>{k.v}</div>
                            </div>
                          ))}
                        </div>
                        {/* Trend */}
                        <div style={{ padding:"6px 8px", background:`${diff>0?"#E5243B":"#4C9F38"}10`, border:`1px solid ${diff>0?"#E5243B":"#4C9F38"}30`, marginBottom:10 }}>
                          <span style={{ fontSize:12, color:diff>0?"#E5243B":"#4C9F38", fontWeight:700 }}>
                            {diff > 0 ? `↑ Se esperan ${diff} eventos más de los observados` : diff < 0 ? `↓ Se esperan ${Math.abs(diff)} eventos menos` : "= Predicción alineada con lo observado"}
                          </span>
                        </div>
                        {/* Real events from ACLED */}
                        <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Datos reales ACLED · {stEvents.length} eventos</div>
                        {stEvents.length > 0 ? (<>
                          <div style={{ marginBottom:8 }}>
                            {Object.entries(stTypes).sort((a,b) => b[1]-a[1]).map(([t,c]) => (
                              <div key={t} style={{ display:"flex", alignItems:"center", gap:4, marginBottom:2 }}>
                                <span style={{ fontSize:9, fontFamily:font, color:EC[t]||MUTED, minWidth:100 }}>{trad(t)}</span>
                                <div style={{ flex:1, height:8, background:`${BORDER}30` }}>
                                  <div style={{ width:`${(c/stEvents.length)*100}%`, height:"100%", background:EC[t]||ACCENT, opacity:0.7 }} />
                                </div>
                                <span style={{ fontSize:9, color:EC[t]||TEXT, fontFamily:font }}>{c}</span>
                              </div>
                            ))}
                          </div>
                          {stFatal > 0 && <div style={{ fontSize:10, color:"#dc2626", marginBottom:6 }}>💀 {stFatal} fatalidades registradas</div>}
                          <div style={{ fontSize:9, fontFamily:font, color:MUTED, marginBottom:4 }}>Últimos eventos:</div>
                          {stEvents.slice(0,5).map((e,i) => (
                            <div key={i} style={{ padding:"3px 0", borderBottom:`1px solid ${BORDER}15`, fontSize:10 }}>
                              <span style={{ color:MUTED, fontFamily:font }}>{e.event_date}</span>
                              <span style={{ color:EC[e.event_type]||ACCENT, marginLeft:6 }}>{trad(e.sub_event_type||e.event_type)}</span>
                              {parseInt(e.fatalities)>0 && <span style={{ color:"#dc2626", marginLeft:4 }}>💀{e.fatalities}</span>}
                              <div style={{ fontSize:9, color:MUTED, marginTop:1 }}>{e.location}</div>
                            </div>
                          ))}
                          {stEvents.length > 5 && <div style={{ fontSize:9, color:ACCENT, marginTop:4, cursor:"pointer" }}
                            onClick={() => { setStateFilter(castState); setAcledView("overview"); }}>
                            Ver los {stEvents.length} eventos en Vista General →
                          </div>}
                        </>) : (
                          <div style={{ fontSize:10, color:MUTED }}>No hay eventos ACLED registrados para este estado en el período actual.</div>
                        )}
                      </div>
                    );
                  })()}
                </>)}
              </div>
            </div>
          </Card>
        </>)}
      </>)}

      {/* ═══ EVENTS ═══ */}
      {acledView === "events" && (<>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
          <button onClick={() => { setFilter("all"); setAcledPage(1); }} style={{ fontSize:9, fontFamily:font, padding:"3px 7px", border:`1px solid ${filter==="all"?ACCENT:BORDER}`, background:filter==="all"?ACCENT:"transparent", color:filter==="all"?"#fff":MUTED, cursor:"pointer" }}>Todos ({events.length})</button>
          {typeOrder.map(t => <button key={t} onClick={() => { setFilter(filter===t?"all":t); setAcledPage(1); }} style={{ fontSize:9, fontFamily:font, padding:"3px 7px", border:`1px solid ${filter===t?EC[t]:BORDER}`, background:filter===t?`${EC[t]}20`:"transparent", color:EC[t], cursor:"pointer" }}>{trad(t)} ({byType[t]})</button>)}
        </div>
        {actorFilter !== "all" && <div style={{ fontSize:10, fontFamily:font, color:ACCENT, marginBottom:8, cursor:"pointer" }} onClick={() => setActorFilter("all")}>Filtro actor: <strong>{actorFilter}</strong> ✕</div>}
        {stateFilter !== "all" && <div style={{ fontSize:10, fontFamily:font, color:"#f59e0b", marginBottom:8, cursor:"pointer" }} onClick={() => setStateFilter("all")}>Filtro estado: <strong>{stateFilter}</strong> ✕</div>}
        <Card>
          {(() => {
            const PP = 20, totalP = Math.ceil(sorted.length/PP), page = sorted.slice((acledPage-1)*PP, acledPage*PP);
            return (<>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>{sorted.length} eventos</div>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <button onClick={() => setAcledPage(Math.max(1,acledPage-1))} disabled={acledPage===1} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:acledPage===1?`${MUTED}40`:TEXT, cursor:acledPage===1?"default":"pointer" }}>←</button>
                  <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>{acledPage}/{totalP}</span>
                  <button onClick={() => setAcledPage(Math.min(totalP,acledPage+1))} disabled={acledPage>=totalP} style={{ fontSize:10, fontFamily:font, padding:"3px 7px", border:`1px solid ${BORDER}`, background:"transparent", color:acledPage>=totalP?`${MUTED}40`:TEXT, cursor:acledPage>=totalP?"default":"pointer" }}>→</button>
                </div>
              </div>
              {page.map((e,i) => (
                <div key={i} style={{ padding:"7px 0", borderBottom:`1px solid ${BORDER}20`, display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div style={{ minWidth:62, fontSize:10, fontFamily:font, color:MUTED }}>{e.event_date}</div>
                  <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:`${EC[e.event_type]||ACCENT}15`, color:EC[e.event_type]||ACCENT, border:`1px solid ${EC[e.event_type]||ACCENT}25`, whiteSpace:"nowrap" }}>{trad(e.sub_event_type||e.event_type)}</span>
                  {parseInt(e.fatalities)>0 && <span style={{ fontSize:9, fontFamily:font, padding:"1px 5px", background:"#dc262615", color:"#dc2626", border:"1px solid #dc262625" }}>💀{e.fatalities}</span>}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:TEXT }}>{e.location}{e.admin1?`, ${e.admin1}`:""}</div>
                    {e.actor1 && <div style={{ fontSize:9, color:ACCENT, marginTop:1, cursor:"pointer" }} onClick={() => { setActorFilter(e.actor1.slice(0,50)); setAcledPage(1); }}>{e.actor1}</div>}
                    <div style={{ fontSize:10, color:MUTED, marginTop:2, lineHeight:1.5 }}>{(e.notes||"").slice(0,220)}{(e.notes||"").length>220?"...":""}</div>
                  </div>
                </div>
              ))}
              {totalP > 1 && <div style={{ display:"flex", justifyContent:"center", gap:3, marginTop:10 }}>
                {Array.from({length:Math.min(9,totalP)},(_,i) => {
                  let p; if(totalP<=9) p=i+1; else if(acledPage<=5) p=i+1; else if(acledPage>=totalP-4) p=totalP-8+i; else p=acledPage-4+i;
                  return <button key={p} onClick={() => setAcledPage(p)} style={{ fontSize:9, fontFamily:font, padding:"2px 6px", border:`1px solid ${p===acledPage?ACCENT:BORDER}`, background:p===acledPage?ACCENT:"transparent", color:p===acledPage?"#fff":MUTED, cursor:"pointer", minWidth:20 }}>{p}</button>;
                })}
              </div>}
            </>);
          })()}
        </Card>
      </>)}
    </div>
  );
}


function TabIODA() {
  const mob = useIsMobile();
  const [signals, setSignals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("loading");
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("24h");
  const [hover, setHover] = useState(null);

  const IODA_BASE = "https://api.ioda.inetintel.cc.gatech.edu/v2";
  const hoursMap = { "24h":24, "48h":48, "7d":168 };

  const loadIODA = useCallback(async () => {
    setLoading(true); setError(null); setSource("loading");
    const hours = hoursMap[timeRange];
    const now = Math.floor(Date.now() / 1000);
    const from = now - hours * 3600;
    
    // Build URLs: Vercel serverless first, then direct via CORS proxy
    const directUrl = `${IODA_BASE}/signals/raw/country/VE?from=${from}&until=${now}`;
    const vercelUrl = `/api/ioda?path=signals/raw/country/VE&from=${from}&until=${now}`;
    
    const urlsToTry = IS_DEPLOYED
      ? [() => vercelUrl, ...CORS_PROXIES.map(fn => () => fn(directUrl))]
      : CORS_PROXIES.map(fn => () => fn(directUrl));

    for (const getUrl of urlsToTry) {
      try {
        const res = await fetch(getUrl(), {
          signal: AbortSignal.timeout(10000),
          headers: { Accept: "application/json" },
        });
        if (!res.ok) continue;
        const json = await res.json();
        const rawSignals = Array.isArray(json?.data) ? json.data.flat() : [];
        if (rawSignals.length === 0) continue;

        // Normalize: merge BGP, probing, telescope into unified series
        const bgp = rawSignals.find(s => s.datasource === "bgp");
        const probing = rawSignals.find(s => s.datasource === "ping-slash24");
        const telescope = rawSignals.find(s => s.datasource === "ucsd-nt") || rawSignals.find(s => s.datasource === "merit-nt");

        const anchor = [bgp, probing, telescope].filter(Boolean).sort((a,b) => b.values.length - a.values.length)[0];
        if (!anchor) continue;

        const valueAt = (sig, ts) => {
          if (!sig) return null;
          const idx = Math.round((ts - sig.from) / sig.step);
          return (idx >= 0 && idx < sig.values.length) ? sig.values[idx] : null;
        };

        const fmt = (epoch) => new Date(epoch * 1000).toLocaleString("es-VE", {
          timeZone:"America/Caracas", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", hour12:false
        });

        const normalized = anchor.values.map((_, i) => {
          const ts = anchor.from + i * anchor.step;
          return { time: fmt(ts), timestamp: ts, bgp: valueAt(bgp, ts), probing: valueAt(probing, ts), telescope: valueAt(telescope, ts) };
        });

        setSignals(normalized);
        setSource("live");
        setLoading(false);
        return;
      } catch { continue; }
    }

    // All proxies failed
    setSignals(null);
    setSource("failed");
    setError("No se pudo conectar con IODA API. Prueba los links directos abajo.");
    setLoading(false);
  }, [timeRange]);

  useEffect(() => { loadIODA(); }, [loadIODA]);

  // Signal chart renderer
  const renderSignalChart = (key, label, color, data) => {
    if (!data || data.length === 0) return null;
    const vals = data.map(d => d[key]).filter(v => v !== null);
    if (vals.length === 0) return (
      <Card accent={color}>
        <div style={{ fontSize:13, fontWeight:600, color, marginBottom:4 }}>{label}</div>
        <div style={{ fontSize:13, color:MUTED, padding:"20px 0", textAlign:"center" }}>Sin datos</div>
      </Card>
    );
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const current = vals[vals.length - 1];
    const baseline = vals.slice(0, Math.max(1, Math.floor(vals.length * 0.2)));
    const avg = baseline.reduce((a,b) => a+b, 0) / baseline.length;
    const pctChange = avg !== 0 ? ((current - avg) / avg * 100) : 0;

    const W = 600, H = 100, padL = 50, padR = 10, padT = 5, padB = 5;
    const cW = W-padL-padR, cH = H-padT-padB;
    const toX = (i) => padL + (i/(data.length-1)) * cW;
    const toY = (v) => v === null ? null : padT + cH - ((v-min)/(max-min||1))*cH;

    let pathD = "";
    let areaD = "";
    let firstX = null, lastX = null;
    data.forEach((d, i) => {
      const v = d[key];
      if (v === null) return;
      const x = toX(i), y = toY(v);
      if (firstX === null) { pathD += `M${x},${y}`; firstX = x; }
      else pathD += ` L${x},${y}`;
      lastX = x;
    });
    if (firstX !== null) areaD = pathD + ` L${lastX},${padT+cH} L${firstX},${padT+cH} Z`;

    const fmtVal = (v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(1)}K` : v.toFixed(0);

    return (
      <Card accent={color}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:color }} />
            <span style={{ fontSize:13, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>{label}</span>
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
            <span style={{ fontSize:16, fontWeight:700, fontFamily:font, color }}>{fmtVal(current)}</span>
            <span style={{ fontSize:12, fontFamily:font, color: pctChange < -5 ? "#dc2626" : pctChange > 5 ? "#7c3aed" : MUTED }}>
              {pctChange > 0 ? "+" : ""}{pctChange.toFixed(1)}%
            </span>
          </div>
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mx = (e.clientX - rect.left) / rect.width * W;
            const idx = Math.round(((mx - padL) / cW) * (data.length-1));
            if (idx >= 0 && idx < data.length) setHover({ key, idx });
          }}
          onMouseLeave={() => setHover(null)}>
          {/* Grid */}
          {[0,0.5,1].map(f => (
            <line key={f} x1={padL} y1={padT+f*cH} x2={padL+cW} y2={padT+f*cH} stroke="rgba(0,0,0,0.06)" />
          ))}
          {/* Y axis labels */}
          <text x={padL-4} y={padT+6} textAnchor="end" fontSize={7} fill={MUTED} fontFamily={font}>{fmtVal(max)}</text>
          <text x={padL-4} y={padT+cH} textAnchor="end" fontSize={7} fill={MUTED} fontFamily={font}>{fmtVal(min)}</text>
          {/* Area + Line */}
          <path d={areaD} fill={`${color}12`} />
          <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} />
          {/* Hover */}
          {hover && hover.key === key && hover.idx < data.length && data[hover.idx][key] !== null && (
            <>
              <line x1={toX(hover.idx)} y1={padT} x2={toX(hover.idx)} y2={padT+cH} stroke="rgba(0,0,0,0.1)" />
              <circle cx={toX(hover.idx)} cy={toY(data[hover.idx][key])} r={3} fill={color} />
            </>
          )}
        </svg>
        {hover && hover.key === key && hover.idx < data.length && (
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, marginTop:4 }}>
            {data[hover.idx].time} · <span style={{ color }}>{data[hover.idx][key] !== null ? fmtVal(data[hover.idx][key]) : "—"}</span>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>🌐</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600, color:TEXT }}>Monitor de Internet — Venezuela</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.1em" }}>
            Detección de interrupciones de internet · Georgia Tech IODA · {source === "live" ? `${signals?.length || 0} puntos · EN VIVO` : source === "failed" ? "Sin conexión" : "Conectando..."}
          </div>
        </div>
        <Badge color={source==="live"?"#7c3aed":source==="failed"?"#dc2626":"#a17d08"}>
          {source==="live"?"EN VIVO":source==="failed"?"OFFLINE":"..."}
        </Badge>
        {/* Time range selector */}
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}`, flexWrap:"wrap" }}>
          {["24h","48h","7d"].map(r => (
            <button key={r} onClick={() => setTimeRange(r)}
              style={{ fontSize:12, fontFamily:font, padding:"5px 12px", border:"none",
                background:timeRange===r?ACCENT:"transparent", color:timeRange===r?"#fff":MUTED,
                cursor:"pointer", letterSpacing:"0.08em" }}>
              {r}
            </button>
          ))}
        </div>
        {source === "failed" && (
          <button onClick={loadIODA}
            style={{ fontSize:12, fontFamily:font, padding:"4px 10px", background:"transparent",
              border:`1px solid ${ACCENT}40`, color:ACCENT, cursor:"pointer" }}>
            ↻ Reintentar
          </button>
        )}
      </div>

      {error && (
        <div style={{ fontSize:12, fontFamily:font, color:"#a17d08", padding:"6px 12px",
          background:"rgba(234,179,8,0.08)", border:"1px solid rgba(234,179,8,0.2)", marginBottom:12 }}>
          ⚠ {error}
        </div>
      )}

      {/* Explanation */}
      <Card accent="#7c3aed" style={{ marginBottom:14 }}>
        <div style={{ fontSize:13, color:TEXT, lineHeight:1.7 }}>
          <strong>¿Qué es esto?</strong> Este panel monitorea en tiempo real si hay cortes o interrupciones de internet en Venezuela. Cuando se bloquean sitios, se restringen redes sociales o hay fallas de infraestructura, las señales caen. Una caída simultánea indica un corte generalizado. Para reportes de censura digital: <a href="https://x.com/vesinfiltro" target="_blank" rel="noopener" style={{ color:"#1d9bf0", textDecoration:"none", fontWeight:600 }}>@VeSinFiltro</a>.
        </div>
      </Card>

      {loading ? (
        <Card>
          <div style={{ textAlign:"center", padding:40, color:MUTED, fontSize:14, fontFamily:font }}>
            <div style={{ fontSize:20, marginBottom:8 }}>🌐</div>
            Conectando con IODA...
            <div style={{ fontSize:12, marginTop:4, color:`${MUTED}80` }}>
              Señales BGP + Active Probing + Telescope · Venezuela · {timeRange}
            </div>
          </div>
        </Card>
      ) : signals ? (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {renderSignalChart("bgp", "BGP Routes", "#7c3aed", signals)}
          {renderSignalChart("probing", "Active Probing", "#f59e0b", signals)}
          {renderSignalChart("telescope", "Network Telescope", "#dc2626", signals)}
        </div>
      ) : (
        <Card>
          <div style={{ textAlign:"center", padding:"30px 20px" }}>
            <div style={{ fontSize:24, marginBottom:10 }}>📡</div>
            <div style={{ fontSize:12, fontWeight:600, color:TEXT, marginBottom:8 }}>
              Conexión directa no disponible
            </div>
            <div style={{ fontSize:13, color:MUTED, lineHeight:1.6, maxWidth:500, margin:"0 auto", marginBottom:16 }}>
              La API de IODA bloquea requests cross-origin desde el navegador. 
              Puedes ver los datos en tiempo real en los links de abajo, o desplegar 
              el dashboard en Vercel con rutas API server-side.
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <a href="https://ioda.inetintel.cc.gatech.edu/country/VE" target="_blank" rel="noopener noreferrer"
                style={{ fontSize:13, fontFamily:font, color:ACCENT, textDecoration:"none", padding:"6px 14px", border:`1px solid ${ACCENT}30`, borderRadius:4 }}>
                ↗ IODA Venezuela
              </a>
              <a href="https://x.com/vesinfiltro" target="_blank" rel="noopener noreferrer"
                style={{ fontSize:13, fontFamily:font, color:"#1d9bf0", textDecoration:"none", padding:"6px 14px", border:"1px solid rgba(29,155,240,0.3)", borderRadius:4 }}>
                𝕏 @VeSinFiltro
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Signal descriptions */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:12, marginTop:12 }}>
        {[{title:"BGP Routes",desc:"Rutas de red anunciadas a nivel de proveedor. Una caída indica pérdida de conectividad upstream — Venezuela tiene ~4.500 prefijos BGP.",color:"#7c3aed"},
          {title:"Active Probing",desc:"Sondeo activo de ~85K hosts venezolanos. Mide reachability real de dispositivos finales. Más granular que BGP.",color:"#f59e0b"},
          {title:"Network Telescope",desc:"Tráfico de fondo no solicitado. Anomalías (caídas abruptas) indican interrupciones masivas a nivel de infraestructura nacional.",color:"#dc2626"}
        ].map((s,i) => (
          <Card key={i} accent={s.color}>
            <div style={{ fontSize:13, fontWeight:600, color:s.color, marginBottom:4 }}>{s.title}</div>
            <div style={{ fontSize:12, color:MUTED, lineHeight:1.5 }}>{s.desc}</div>
          </Card>
        ))}
      </div>

      {/* VeSinFiltro Timeline */}
      <Card accent="#1d9bf0" style={{ marginTop:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:TEXT }}>𝕏 @VeSinFiltro</div>
            <div style={{ fontSize:12, color:MUTED }}>Reportes de censura y bloqueos de internet en Venezuela</div>
          </div>
          <a href="https://x.com/vesinfiltro" target="_blank" rel="noopener noreferrer"
            style={{ fontSize:12, fontFamily:font, color:"#1d9bf0", textDecoration:"none", padding:"4px 12px", border:"1px solid rgba(29,155,240,0.3)", borderRadius:4 }}>
            Ver en 𝕏
          </a>
        </div>
        <TwitterTimeline handle="vesinfiltro" height={400} />
      </Card>

      <div style={{ marginTop:12, fontSize:10, fontFamily:font, color:`${MUTED}80`, lineHeight:1.8 }}>
        Fuente: IODA (Georgia Tech) · API v2 · Hora Venezuela (UTC-4) · 
        Reportes de censura: <a href="https://x.com/vesinfiltro" target="_blank" rel="noopener" style={{ color:"#1d9bf0", textDecoration:"none" }}>@VeSinFiltro</a>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════

function RateChart({ data }) {
  const [hover, setHover] = useState(null);
  const W = 700, H = 250, padL = 50, padR = 60, padT = 15, padB = 30;
  const cW = W-padL-padR, cH = H-padT-padB;

  const maxRate = Math.max(...data.map(d => Math.max(d.bcv||0, d.par||0)));
  const toX = (i) => padL + (i/(data.length-1)) * cW;
  const toY = (v) => padT + cH - (v/maxRate)*cH;

  const makePath = (key) => data.map((d,i) => d[key]!=null ? `${i===0?"M":"L"}${toX(i)},${toY(d[key])}` : "").filter(Boolean).join(" ");
  const makeArea = (key) => {
    const pts = data.filter(d => d[key]!=null);
    if (pts.length < 2) return "";
    let p = `M${toX(data.indexOf(pts[0]))},${toY(pts[0][key])}`;
    pts.slice(1).forEach(d => { p += ` L${toX(data.indexOf(d))},${toY(d[key])}`; });
    p += ` L${toX(data.indexOf(pts[pts.length-1]))},${padT+cH} L${toX(data.indexOf(pts[0]))},${padT+cH} Z`;
    return p;
  };

  // Brecha as percentage
  const brechaData = data.map(d => d.bcv && d.par ? ((d.par-d.bcv)/d.bcv)*100 : null);
  const maxBrecha = Math.max(...brechaData.filter(Boolean), 1);

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = (e.clientX - rect.left) / rect.width * W;
          const idx = Math.round(((mx - padL) / cW) * (data.length-1));
          if (idx >= 0 && idx < data.length) setHover(idx);
        }}
        onMouseLeave={() => setHover(null)}>
        {/* Grid */}
        {[0,0.25,0.5,0.75,1].map(f => (
          <line key={f} x1={padL} y1={padT+f*cH} x2={padL+cW} y2={padT+f*cH} stroke="rgba(0,0,0,0.06)" />
        ))}
        {/* Left Y axis (Bs/USD) */}
        {[0,0.25,0.5,0.75,1].map(f => (
          <text key={`l${f}`} x={padL-6} y={padT+(1-f)*cH+3} textAnchor="end" fontSize={8} fill={MUTED} fontFamily={font}>
            {(maxRate*f).toFixed(0)}
          </text>
        ))}
        {/* Right Y axis (Brecha %) */}
        {[0,0.25,0.5,0.75,1].map(f => (
          <text key={`r${f}`} x={padL+cW+6} y={padT+(1-f)*cH+3} textAnchor="start" fontSize={8} fill="#f59e0b50" fontFamily={font}>
            {(maxBrecha*f).toFixed(0)}%
          </text>
        ))}
        {/* Areas */}
        <path d={makeArea("par")} fill="#E5243B08" />
        <path d={makeArea("bcv")} fill="#0468B108" />
        {/* Lines */}
        <path d={makePath("bcv")} fill="none" stroke="#0468B1" strokeWidth={2.5} />
        <path d={makePath("par")} fill="none" stroke="#E5243B" strokeWidth={2.5} />
        {/* Brecha line (right axis) */}
        {brechaData.filter(Boolean).length > 1 && (
          <path d={data.map((d,i) => brechaData[i]!=null ? `${i===0||brechaData[i-1]==null?"M":"L"}${toX(i)},${padT+cH-(brechaData[i]/maxBrecha)*cH}` : "").filter(Boolean).join(" ")}
            fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" />
        )}
        {/* USDT estimate (par * 1.02) */}
        <path d={data.map((d,i) => d.par ? `${i===0?"M":"L"}${toX(i)},${toY(d.par*1.02)}` : "").filter(Boolean).join(" ")}
          fill="none" stroke="#7c3aed" strokeWidth={1} strokeDasharray="2 2" opacity={0.6} />
        {/* X labels */}
        {data.map((d,i) => i % Math.max(1,Math.floor(data.length/6)) === 0 ? (
          <text key={i} x={toX(i)} y={H-6} textAnchor="middle" fontSize={8} fill={MUTED} fontFamily={font}>
            {new Date(d.d+"T00:00").toLocaleDateString("es",{day:"numeric",month:"short"})}
          </text>
        ) : null)}
        {/* Hover */}
        {hover !== null && hover < data.length && <>
          <line x1={toX(hover)} y1={padT} x2={toX(hover)} y2={padT+cH} stroke="rgba(0,0,0,0.12)" />
          {data[hover].bcv && <circle cx={toX(hover)} cy={toY(data[hover].bcv)} r={4} fill="#0468B1" stroke={BG} strokeWidth={2} />}
          {data[hover].par && <circle cx={toX(hover)} cy={toY(data[hover].par)} r={4} fill="#E5243B" stroke={BG} strokeWidth={2} />}
        </>}
      </svg>
      {/* Tooltip */}
      {hover !== null && hover < data.length && (
        <div style={{ fontSize:13, fontFamily:font, marginTop:4, padding:"6px 12px", background:BG2, border:`1px solid ${BORDER}`, display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ color:TEXT, fontWeight:600 }}>{new Date(data[hover].d+"T00:00").toLocaleDateString("es",{day:"numeric",month:"short",year:"numeric"})}</span>
          <span style={{ color:"#0468B1" }}>BCV: {data[hover].bcv?.toFixed(1)}</span>
          <span style={{ color:"#E5243B" }}>Paralelo: {data[hover].par?.toFixed(1)}</span>
          {data[hover].par && <span style={{ color:"#7c3aed" }}>USDT: ~{(data[hover].par*1.02).toFixed(0)}</span>}
          {brechaData[hover] && <span style={{ color:"#f59e0b" }}>Brecha: {brechaData[hover].toFixed(1)}%</span>}
        </div>
      )}
      {/* Legend */}
      <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:8 }}>
        <span style={{ fontSize:12, fontFamily:font, color:"#0468B1" }}>━ BCV Oficial</span>
        <span style={{ fontSize:12, fontFamily:font, color:"#E5243B" }}>━ Paralelo</span>
        <span style={{ fontSize:12, fontFamily:font, color:"#7c3aed" }}>┅ USDT (est.)</span>
        <span style={{ fontSize:12, fontFamily:font, color:"#f59e0b" }}>┅ Brecha % (eje der.)</span>
      </div>
    </div>
  );
}

function BrechaChart({ data }) {
  const [hover, setHover] = useState(null);
  const W = 800, H = 500, padL = 55, padR = 25, padT = 20, padB = 36;
  const cW = W-padL-padR, cH = H-padT-padB;

  const brechas = data.map(d => d.bcv && d.par ? ((d.par-d.bcv)/d.bcv)*100 : null);
  const valid = brechas.filter(Boolean);
  if (valid.length < 2) return null;
  const maxB = Math.max(...valid);
  const toX = (i) => padL + (i/(data.length-1)) * cW;
  const toY = (v) => v != null ? padT + cH - (v/maxB)*cH : null;

  const pathD = data.map((d,i) => {
    const y = toY(brechas[i]);
    if (y == null) return "";
    return `${i===0||brechas[i-1]==null?"M":"L"}${toX(i)},${y}`;
  }).filter(Boolean).join(" ");

  // Area
  const validIdxs = data.map((d,i) => brechas[i]!=null ? i : null).filter(v=>v!=null);
  const areaD = validIdxs.length > 1 ? 
    `M${toX(validIdxs[0])},${toY(brechas[validIdxs[0]])} ` +
    validIdxs.slice(1).map(i => `L${toX(i)},${toY(brechas[i])}`).join(" ") +
    ` L${toX(validIdxs[validIdxs.length-1])},${padT+cH} L${toX(validIdxs[0])},${padT+cH} Z` : "";

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width * W;
        const idx = Math.round(((mx - padL) / cW) * (data.length-1));
        if (idx >= 0 && idx < data.length) setHover(idx);
      }}
      onMouseLeave={() => setHover(null)}>
      {/* Alert zones */}
      <rect x={padL} y={toY(55)} width={cW} height={toY(40)-toY(55)} fill="#b8860b08" />
      <rect x={padL} y={padT} width={cW} height={toY(55)-padT} fill="#E5243B08" />
      {/* Threshold lines */}
      <line x1={padL} y1={toY(20)} x2={padL+cW} y2={toY(20)} stroke="#4C9F3830" strokeDasharray="3 3" />
      <text x={padL+cW+4} y={toY(20)+3} fontSize={7} fill="#4C9F38" fontFamily={font}>20%</text>
      <line x1={padL} y1={toY(40)} x2={padL+cW} y2={toY(40)} stroke="#0A97D930" strokeDasharray="3 3" />
      <text x={padL+cW+4} y={toY(40)+3} fontSize={7} fill="#0A97D9" fontFamily={font}>40%</text>
      <line x1={padL} y1={toY(55)} x2={padL+cW} y2={toY(55)} stroke="#E5243B30" strokeDasharray="3 3" />
      <text x={padL+cW+4} y={toY(55)+3} fontSize={7} fill="#E5243B" fontFamily={font}>55%</text>
      {/* Grid */}
      {[0,0.25,0.5,0.75,1].map(f => (
        <g key={f}>
          <line x1={padL} y1={padT+f*cH} x2={padL+cW} y2={padT+f*cH} stroke="rgba(0,0,0,0.04)" />
          <text x={padL-4} y={padT+(1-f)*cH+3} textAnchor="end" fontSize={7} fill={MUTED} fontFamily={font}>{(maxB*f).toFixed(0)}%</text>
        </g>
      ))}
      {/* Area + Line */}
      <path d={areaD} fill="#f59e0b10" />
      <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth={2} />
      {/* X labels */}
      {data.map((d,i) => i % Math.max(1,Math.floor(data.length/8)) === 0 ? (
        <text key={i} x={toX(i)} y={H-4} textAnchor="middle" fontSize={7} fill={MUTED} fontFamily={font}>
          {d.d.slice(0,7)}
        </text>
      ) : null)}
      {/* Hover */}
      {hover !== null && hover < data.length && brechas[hover] != null && <>
        <line x1={toX(hover)} y1={padT} x2={toX(hover)} y2={padT+cH} stroke="rgba(0,0,0,0.1)" />
        <circle cx={toX(hover)} cy={toY(brechas[hover])} r={4} fill="#f59e0b" stroke={BG} strokeWidth={2} />
        <text x={toX(hover)} y={toY(brechas[hover])-8} textAnchor="middle" fontSize={9} fill="#f59e0b" fontWeight={700} fontFamily={font}>
          {brechas[hover].toFixed(1)}%
        </text>
        <text x={toX(hover)} y={padT+cH+12} textAnchor="middle" fontSize={7} fill={TEXT} fontFamily={font}>{data[hover].d}</text>
      </>}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// SOCIOECONOMIC PANEL — World Bank + IMF + R4V data
// ═══════════════════════════════════════════════════════════════

function SocioeconomicPanel({ mob }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!IS_DEPLOYED) { setLoading(false); return; }
    fetch("/api/socioeconomic", { signal: AbortSignal.timeout(15000) })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Card><div style={{ textAlign:"center", padding:20, fontFamily:font, color:MUTED }}>Cargando datos socioeconómicos...</div></Card>;
  if (!data) return <Card><div style={{ textAlign:"center", padding:20, fontFamily:font, color:MUTED }}>Sin datos disponibles. Solo en producción.</div></Card>;

  const fmt = (v, unit) => {
    if (v == null) return "—";
    if (unit === "USD" && v > 1e9) return `$${(v/1e9).toFixed(1)}B`;
    if (unit === "USD" && v > 1e6) return `$${(v/1e6).toFixed(0)}M`;
    if (unit === "USD") return `$${v.toFixed(0)}`;
    if (unit === "personas" && v > 1e6) return `${(v/1e6).toFixed(1)}M`;
    if (unit === "%") return `${v.toFixed(1)}%`;
    return v.toFixed(1);
  };

  const catLabels = { economia:"📊 Economía", social:"👥 Social", energia:"⚡ Energía", infraestructura:"🔌 Infraestructura" };
  const catColors = { economia:ACCENT, social:"#8b5cf6", energia:"#f59e0b", infraestructura:"#06b6d4" };

  // Mini sparkline for indicator history
  const MiniSpark = ({ history, color }) => {
    if (!history || history.length < 3) return null;
    const vals = history.map(h => h.value);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const w = 80, h = 24;
    const pts = vals.map((v, i) => `${(i/(vals.length-1))*w},${h-((v-min)/range)*h}`).join(" ");
    return <svg width={w} height={h} style={{ display:"block" }}><polyline points={pts} fill="none" stroke={color} strokeWidth={1.2} /></svg>;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Header */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, fontFamily:"'Syne',sans-serif", color:TEXT, textTransform:"uppercase", letterSpacing:"0.05em" }}>
              Indicadores Socioeconómicos — Venezuela
            </div>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED }}>
              World Bank · IMF WEO · UNHCR/R4V · Actualización automática
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <Badge color={ACCENT}>World Bank</Badge>
            <Badge color="#f59e0b">IMF</Badge>
            <Badge color="#8b5cf6">R4V</Badge>
          </div>
        </div>

        {/* Summary KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:8 }}>
          {[
            { label:"PIB", value:fmt(data.summary?.pib, "USD"), color:ACCENT, sub:"USD corrientes" },
            { label:"PIB per cápita", value:fmt(data.summary?.pibPerCapita, "USD"), color:ACCENT, sub:"USD" },
            { label:"Inflación IPC", value:fmt(data.summary?.inflacion, "%"), color:data.summary?.inflacion > 100 ? "#ef4444" : "#f59e0b", sub:"Anual" },
            { label:"Población", value:fmt(data.summary?.poblacion, "personas"), color:"#8b5cf6", sub:"Habitantes" },
            { label:"Crecimiento PIB", value:fmt(data.summary?.crecimiento, "%"), color:data.summary?.crecimiento > 0 ? "#22c55e" : "#ef4444", sub:"Anual" },
            { label:"Desempleo", value:fmt(data.summary?.desempleo, "%"), color:data.summary?.desempleo > 10 ? "#ef4444" : "#f59e0b", sub:"Tasa" },
            { label:"Migración neta", value:fmt(data.summary?.migracion, "personas"), color:"#ef4444", sub:"Personas/año" },
            { label:"Refugiados VEN", value:data.refugees?.total || "7.9M", color:"#8b5cf6", sub:data.refugees?.source || "UNHCR/R4V" },
          ].map((kpi, i) => (
            <div key={i} style={{ background:BG2, border:`1px solid ${BORDER}`, borderTop:`3px solid ${kpi.color}`, padding:mob?"8px":"10px 12px" }}>
              <div style={{ fontSize:8, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>{kpi.label}</div>
              <div style={{ fontSize:mob?16:20, fontWeight:800, color:kpi.color, fontFamily:"'Playfair Display',serif", lineHeight:1, marginTop:2 }}>{kpi.value}</div>
              <div style={{ fontSize:8, fontFamily:font, color:MUTED, marginTop:2 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* IMF Projections */}
      {data.imfProjections && (data.imfProjections.gdpGrowth?.length > 0 || data.imfProjections.inflation?.length > 0) && (
        <Card accent="#f59e0b">
          <div style={{ fontSize:11, fontFamily:font, color:"#f59e0b", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
            📈 Proyecciones FMI (World Economic Outlook)
          </div>
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:12 }}>
            {data.imfProjections.gdpGrowth?.length > 0 && (
              <div>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, marginBottom:4 }}>Crecimiento PIB (%)</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {data.imfProjections.gdpGrowth.map((p, i) => (
                    <div key={i} style={{ textAlign:"center", padding:"4px 8px", background:BG3, border:`1px solid ${BORDER}` }}>
                      <div style={{ fontSize:8, fontFamily:font, color:MUTED }}>{p.year}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:p.value > 0 ? "#22c55e" : "#ef4444", fontFamily:font }}>{p.value?.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.imfProjections.inflation?.length > 0 && (
              <div>
                <div style={{ fontSize:10, fontFamily:font, color:MUTED, marginBottom:4 }}>Inflación (%)</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {data.imfProjections.inflation.map((p, i) => (
                    <div key={i} style={{ textAlign:"center", padding:"4px 8px", background:BG3, border:`1px solid ${BORDER}` }}>
                      <div style={{ fontSize:8, fontFamily:font, color:MUTED }}>{p.year}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:p.value > 50 ? "#ef4444" : "#f59e0b", fontFamily:font }}>{p.value?.toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Indicators by category with sparklines */}
      {Object.entries(data.byCategory || {}).map(([catKey, indicators]) => (
        <Card key={catKey} accent={catColors[catKey]}>
          <div style={{ fontSize:11, fontFamily:font, color:catColors[catKey], letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
            {catLabels[catKey] || catKey}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:8 }}>
            {indicators.filter(ind => ind.latest).map((ind, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 8px", background:BG3, border:`1px solid ${BORDER}` }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, fontFamily:font, color:TEXT, fontWeight:600 }}>{ind.label}</div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:4, marginTop:2 }}>
                    <span style={{ fontSize:16, fontWeight:800, color:catColors[catKey], fontFamily:"'Playfair Display',serif" }}>
                      {fmt(ind.latest.value, ind.unit)}
                    </span>
                    <span style={{ fontSize:8, fontFamily:font, color:MUTED }}>({ind.latest.year})</span>
                    {ind.delta != null && (
                      <span style={{ fontSize:9, fontFamily:font, color:ind.delta > 0 ? "#22c55e" : "#ef4444" }}>
                        {ind.delta > 0 ? "▲" : "▼"} {Math.abs(ind.unit === "%" ? ind.delta : ind.delta).toFixed(1)}{ind.unit === "%" ? "pp" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <MiniSpark history={ind.history} color={catColors[catKey]} />
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Sources */}
      <div style={{ fontSize:8, fontFamily:font, color:`${MUTED}50`, textAlign:"center", padding:"4px 0" }}>
        Fuentes: World Bank Open Data (api.worldbank.org) · IMF World Economic Outlook · UNHCR/R4V · Datos anuales, actualización automática · {data.indicators?.length || 0} indicadores · Último fetch: {new Date(data.fetchedAt).toLocaleString("es")}
      </div>
    </div>
  );
}

function TabMacro() {
  const mob = useIsMobile();
  const [dolar, setDolar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seccion, setSeccion] = useState("cambio");
  const [rateHistory, setRateHistory] = useState([]);

  useEffect(() => {
    async function fetchAll() {
      // Base historical data (monthly, from official BCV + Dólar Promedio table)
      const HIST_BASE = [
        // 2022
        {d:"2022-01-31",bcv:4.52,par:4.65},{d:"2022-02-28",bcv:4.46,par:4.61},{d:"2022-03-31",bcv:4.38,par:4.48},
        {d:"2022-04-30",bcv:4.49,par:4.57},{d:"2022-05-31",bcv:5.06,par:5.14},{d:"2022-06-30",bcv:5.53,par:5.78},
        {d:"2022-07-31",bcv:5.78,par:5.97},{d:"2022-08-31",bcv:7.89,par:8.15},{d:"2022-09-30",bcv:8.20,par:8.32},
        {d:"2022-10-31",bcv:8.59,par:9.03},{d:"2022-11-30",bcv:11.07,par:13.25},{d:"2022-12-31",bcv:17.48,par:18.60},
        // 2023
        {d:"2023-01-31",bcv:22.37,par:23.11},{d:"2023-02-28",bcv:24.36,par:24.75},{d:"2023-03-31",bcv:24.52,par:24.72},
        {d:"2023-04-30",bcv:24.75,par:25.63},{d:"2023-05-31",bcv:26.26,par:27.67},{d:"2023-06-30",bcv:28.01,par:29.04},
        {d:"2023-07-31",bcv:29.50,par:31.58},{d:"2023-08-31",bcv:32.59,par:34.17},{d:"2023-09-30",bcv:34.46,par:36.39},
        {d:"2023-10-31",bcv:35.58,par:36.92},{d:"2023-11-30",bcv:35.95,par:37.07},{d:"2023-12-31",bcv:35.95,par:39.57},
        // 2024
        {d:"2024-01-31",bcv:36.26,par:38.39},{d:"2024-02-29",bcv:36.15,par:38.33},{d:"2024-03-31",bcv:36.26,par:38.47},
        {d:"2024-04-30",bcv:36.47,par:39.40},{d:"2024-05-31",bcv:36.53,par:40.36},{d:"2024-06-30",bcv:36.44,par:40.23},
        {d:"2024-07-31",bcv:36.60,par:42.24},{d:"2024-08-31",bcv:36.62,par:42.50},{d:"2024-09-30",bcv:36.92,par:43.09},
        {d:"2024-10-31",bcv:42.56,par:52.43},{d:"2024-11-30",bcv:47.60,par:56.20},{d:"2024-12-31",bcv:51.93,par:66.25},
        // 2025
        {d:"2025-01-31",bcv:57.96,par:68.43},{d:"2025-02-28",bcv:64.48,par:79.35},{d:"2025-03-31",bcv:69.56,par:99.00},
        {d:"2025-04-30",bcv:87.56,par:108.90},{d:"2025-05-31",bcv:96.85,par:135.25},{d:"2025-06-30",bcv:107.62,par:140.23},
        {d:"2025-07-31",bcv:124.51,par:164.83},{d:"2025-08-31",bcv:147.08,par:207.33},{d:"2025-09-30",bcv:177.61,par:288.50},
        {d:"2025-10-31",bcv:223.64,par:308.10},{d:"2025-11-30",bcv:245.67,par:382.50},{d:"2025-12-31",bcv:301.37,par:587.00},
        // 2026 key points
        {d:"2026-01-06",bcv:382.6,par:896.6},{d:"2026-01-15",bcv:385.0,par:750.0},{d:"2026-01-27",bcv:388.0,par:650.0},
        {d:"2026-02-06",bcv:382.6,par:552.0},
      ];

      // 1. Get live rate
      let liveBcv = null, livePar = null;
      try {
        const liveUrl = IS_DEPLOYED ? "/api/dolar?type=live" : "https://ve.dolarapi.com/v1/dolares";
        const res = await fetch(liveUrl, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const data = await res.json();
          const oficial = data.find(d => d.fuente === "oficial");
          const paralelo = data.find(d => d.fuente === "paralelo");
          liveBcv = oficial?.promedio || null;
          livePar = paralelo?.promedio || null;
          const brecha = liveBcv && livePar ? (((livePar - liveBcv) / liveBcv) * 100) : null;
          setDolar({ bcv: liveBcv, par: livePar, brecha, updated: oficial?.fechaActualizacion || new Date().toISOString() });
        }
      } catch {}
      setLoading(false);

      // 2. Collect daily data from Supabase and/or DolarAPI
      let dailyData = [];

      // Try Supabase (accumulated daily history)
      if (IS_DEPLOYED) {
        try {
          const res = await fetch("/api/dolar?type=supabase&limit=365", { signal: AbortSignal.timeout(6000) });
          if (res.ok) {
            const data = await res.json();
            if (data.rates?.length > 0) {
              dailyData = data.rates.map(r => ({ d:r.date, bcv:Number(r.bcv), par:Number(r.paralelo) }));
            }
          }
        } catch {}
      }

      // Also try DolarAPI historical (adds recent ~30 days)
      try {
        const histUrl = IS_DEPLOYED ? "/api/dolar?type=historico" : "https://ve.dolarapi.com/v1/historicos/dolares";
        const res = await fetch(histUrl, { signal: AbortSignal.timeout(12000) });
        if (res.ok) {
          const data = await res.json();
          const apiRates = data.rates || [];
          if (apiRates.length > 0) {
            apiRates.forEach(r => {
              if (!dailyData.find(d => d.d === r.d)) {
                dailyData.push({ d: r.d, bcv: r.bcv, par: r.par });
              }
            });
          } else if (Array.isArray(data)) {
            const byDate = {};
            let lastPar = null;
            data.forEach(r => {
              if (!byDate[r.fecha]) byDate[r.fecha] = { d: r.fecha };
              if (r.fuente === "oficial") byDate[r.fecha].bcv = r.promedio;
              if (r.fuente === "paralelo") byDate[r.fecha].par = r.promedio;
            });
            Object.values(byDate).filter(h => h.bcv || h.par).forEach(h => {
              if (h.par) lastPar = h.par;
              const entry = { d: h.d, bcv: h.bcv||null, par: h.par||lastPar };
              if (!dailyData.find(d => d.d === entry.d)) dailyData.push(entry);
            });
          }
        }
      } catch {}

      // 3. Add today's live point
      if (liveBcv && livePar) {
        const today = new Date().toISOString().slice(0,10);
        dailyData = dailyData.filter(d => d.d !== today);
        dailyData.push({ d: today, bcv: liveBcv, par: livePar });
      }

      // 4. Merge: base historical + daily data (daily overrides base if same date)
      const merged = {};
      HIST_BASE.forEach(h => { merged[h.d] = h; });
      dailyData.forEach(h => { if (h.bcv && h.par) merged[h.d] = h; });

      const final = Object.values(merged).sort((a,b) => a.d.localeCompare(b.d));
      setRateHistory(final);
    }

    fetchAll();
    // Auto-refresh live rates every 5 minutes
    const iv = setInterval(() => {
      const liveUrl = IS_DEPLOYED ? "/api/dolar?type=live" : "https://ve.dolarapi.com/v1/dolares";
      fetch(liveUrl, { signal: AbortSignal.timeout(8000) })
        .then(r => r.ok ? r.json() : null).then(data => {
          if (!data || !Array.isArray(data)) return;
          const o = data.find(d => d.fuente === "oficial"), p = data.find(d => d.fuente === "paralelo");
          const bcv = o?.promedio, par = p?.promedio;
          if (bcv && par) {
            setDolar({ bcv, par, brecha: ((par-bcv)/bcv)*100, updated: new Date().toISOString() });
            // Update today's point in history
            const today = new Date().toISOString().slice(0,10);
            setRateHistory(prev => {
              const filtered = prev.filter(h => h.d !== today);
              return [...filtered, { d:today, bcv, par, usdt:par*1.02, brecha:((par-bcv)/bcv)*100 }].sort((a,b) => a.d.localeCompare(b.d));
            });
          }
        }).catch(() => {});
    }, 300000); // 5 minutes
    return () => clearInterval(iv);
  }, []);

  // Static macro indicators (update weekly/monthly)
  const MACRO = [
    { k:"PIB proyectado 2025", v:"10–15%", c:"#22c55e", s:"FMI / Ecoanalítica · crecimiento estimado" },
    { k:"Inflación anual", v:"~100%", c:"#E5243B", s:"FMI: tres dígitos · BCV sin publicar" },
    { k:"Reservas internacionales", v:"~$9.5B", c:"#f59e0b", s:"BCV · incluye oro monetario" },
    { k:"Deuda externa", v:">$150B", c:"#E5243B", s:"FMI: >180% del PIB · en default" },
    { k:"Salario mínimo", v:"130 Bs", c:"#E5243B", s:"~$0.30 al paralelo · 47+ meses sin ajuste" },
    { k:"Canasta alimentaria", v:"~$550", c:"#f59e0b", s:"CENDA · ingreso promedio ~$270" },
    { k:"Producción petrolera", v:"903 kbd", c:"#22c55e", s:"Feb 2026 · OPEC MOMR fuentes sec. · ↑80 kbd vs ene" },
    { k:"Liquidez monetaria", v:"Expansión", c:"#f59e0b", s:"BCV inyecta vía subastas semanales" },
    { k:"Crudo Merey", v:"$52.31/b", c:"#f59e0b", s:"Feb 2026 · Cesta OPEC · ↑$9.10 vs ene" },
    { k:"Plataformas (Rigs)", v:"2", c:"#E5243B", s:"Ene 2026 · Mínimo operativo · OPEC" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
        <span style={{ fontSize:16 }}>💵</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:TEXT, fontFamily:"'Syne',sans-serif", letterSpacing:"0.05em", textTransform:"uppercase" }}>Macroeconomía — Venezuela</div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED }}>Tipo de cambio en vivo · Actualiza cada 5 min · Mercado cambiario</div>
        </div>
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}`, flexWrap:"wrap" }}>
          {[{id:"cambio",label:"Tipo de cambio"},{id:"indicadores",label:"Indicadores"},{id:"charts",label:"Gráficos"},{id:"socioeco",label:"Socioeconómico"}].map(s => (
            <button key={s.id} onClick={() => setSeccion(s.id)}
              style={{ fontSize:12, fontFamily:font, padding:"6px 12px", border:"none",
                background:seccion===s.id?ACCENT:"transparent", color:seccion===s.id?"#fff":MUTED, cursor:"pointer", letterSpacing:"0.06em" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TIPO DE CAMBIO ── */}
      {seccion === "cambio" && (<>
        {/* Live rates */}
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr 1fr", gap:10, marginBottom:16 }}>
          <Card accent="#0468B1">
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Dólar BCV (oficial)</div>
            <div style={{ fontSize:26, fontWeight:800, color:"#0468B1", fontFamily:"'Playfair Display',serif" }}>
              {loading ? "..." : dolar?.bcv ? `${dolar.bcv.toFixed(2)}` : "—"}
            </div>
            <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>Bs/USD · Fuente: BCV</div>
          </Card>
          <Card accent="#E5243B">
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Dólar Paralelo</div>
            <div style={{ fontSize:26, fontWeight:800, color:"#E5243B", fontFamily:"'Playfair Display',serif" }}>
              {loading ? "..." : dolar?.par ? `${dolar.par.toFixed(2)}` : "—"}
            </div>
            <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>Bs/USD · Mercado no oficial</div>
          </Card>
          <Card accent={dolar?.brecha > 50 ? "#E5243B" : dolar?.brecha > 30 ? "#f59e0b" : "#22c55e"}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Brecha cambiaria</div>
            <div style={{ fontSize:26, fontWeight:800, color:dolar?.brecha > 50 ? "#E5243B" : dolar?.brecha > 30 ? "#f59e0b" : "#22c55e", fontFamily:"'Playfair Display',serif" }}>
              {loading ? "..." : dolar?.brecha ? `${dolar.brecha.toFixed(1)}%` : "—"}
            </div>
            <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>{dolar?.brecha > 55 ? "⚠ Zona de alerta E2" : dolar?.brecha > 40 ? "Monitoreo activo" : "Rango aceptable"}</div>
          </Card>
          <Card accent="#7c3aed">
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>USDT/VES (ref.)</div>
            <div style={{ fontSize:26, fontWeight:800, color:"#7c3aed", fontFamily:"'Playfair Display',serif" }}>
              {loading ? "..." : dolar?.par ? `~${(dolar.par * 1.02).toFixed(0)}` : "—"}
            </div>
            <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>Estimado · Binance P2P +2%</div>
          </Card>
        </div>

        {/* Rate evolution chart */}
        {rateHistory.length > 2 && (
          <Card>
            <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
              Evolución cambiaria · {rateHistory.length > 0 ? `${rateHistory[0].d.slice(0,7)} — ${rateHistory[rateHistory.length-1].d.slice(0,7)}` : "..."} · {rateHistory.length} puntos
            </div>
            <RateChart data={rateHistory} />
          </Card>
        )}

        {/* Explanation cards */}
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
          <Card accent="#0468B1">
            <div style={{ fontSize:13, fontWeight:600, color:"#0468B1", marginBottom:4 }}>🏦 Tasa BCV</div>
            <div style={{ fontSize:12, color:MUTED, lineHeight:1.6 }}>Publicada diariamente por el Banco Central. Referencia para operaciones formales, banca y comercio registrado.</div>
          </Card>
          <Card accent="#E5243B">
            <div style={{ fontSize:13, fontWeight:600, color:"#E5243B", marginBottom:4 }}>🔄 Tasa Paralela</div>
            <div style={{ fontSize:12, color:MUTED, lineHeight:1.6 }}>Precio del dólar en el mercado no oficial. Referencia real para la mayoría de transacciones cotidianas.</div>
          </Card>
          <Card accent="#7c3aed">
            <div style={{ fontSize:13, fontWeight:600, color:"#7c3aed", marginBottom:4 }}>₿ USDT / Binance P2P</div>
            <div style={{ fontSize:12, color:MUTED, lineHeight:1.6 }}>Precio del USDT en bolívares via Binance P2P. Usado masivamente para remesas y ahorro digital.</div>
          </Card>
        </div>

        {/* Semáforo escenarios */}
        <Card>
          <div style={{ fontSize:14, fontFamily:font, color:TEXT, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
            Implicaciones por escenario
          </div>
          {[
            { esc:"E1", label:"Transición", cond:"Brecha <20%", desc:"Convergencia cambiaria. Señal de estabilización y confianza.", color:"#1a7a1a" },
            { esc:"E3", label:"Continuidad", cond:"Brecha 20-40%", desc:"Brecha manejable. Subastas BCV sostienen la tasa. Equilibrio frágil.", color:"#0468B1" },
            { esc:"E4", label:"Resistencia", cond:"Brecha 40-55%", desc:"Presión cambiaria creciente. Riesgo de espiral si supera 55%.", color:"#b45309" },
            { esc:"E2", label:"Colapso", cond:"Brecha >55%", desc:"Zona de alerta. Pérdida de control cambiario. Activa indicador E2.", color:"#c92a2a" },
          ].map((e,i) => {
            const isActive = dolar?.brecha && (
              (e.esc==="E1" && dolar.brecha < 20) || (e.esc==="E3" && dolar.brecha >= 20 && dolar.brecha < 40) ||
              (e.esc==="E4" && dolar.brecha >= 40 && dolar.brecha < 55) || (e.esc==="E2" && dolar.brecha >= 55)
            );
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 8px", borderBottom:i<3?`1px solid ${BORDER}`:"none",
                opacity:isActive?1:0.5, background:isActive?`${e.color}10`:"transparent" }}>
                <span style={{ fontSize:11, fontFamily:font, padding:"3px 8px", fontWeight:700, color:"#fff", background:e.color, minWidth:28, textAlign:"center", borderRadius:3 }}>{e.esc}</span>
                <span style={{ fontSize:14, fontWeight:700, color:e.color, minWidth:110 }}>{e.label}</span>
                <span style={{ fontSize:13, fontFamily:font, color:e.color, fontWeight:600, minWidth:110 }}>{e.cond}</span>
                <span style={{ fontSize:13, color:TEXT, flex:1 }}>{e.desc}</span>
                {isActive && <span style={{ fontSize:11, fontFamily:font, color:"#fff", fontWeight:700, background:e.color, padding:"3px 10px", borderRadius:3 }}>◄ ACTUAL</span>}
              </div>
            );
          })}
        </Card>

        {dolar?.updated && (
          <div style={{ fontSize:9, fontFamily:font, color:`${MUTED}60`, marginTop:8 }}>
            Fuente: DolarAPI.com (ve.dolarapi.com) · Última actualización: {new Date(dolar.updated).toLocaleString("es")} · Refresco cada 2 min
          </div>
        )}
      </>)}

      {/* ── INDICADORES ── */}
      {seccion === "indicadores" && (
        <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:10 }}>
          {MACRO.map((m,i) => (
            <Card key={i} accent={m.c}>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{m.k}</div>
              <div style={{ fontSize:20, fontWeight:800, color:m.c, fontFamily:"'Syne',sans-serif" }}>{m.v}</div>
              <div style={{ fontSize:10, color:MUTED, marginTop:4, lineHeight:1.5 }}>{m.s}</div>
            </Card>
          ))}
        </div>
      )}

      {/* ── GRÁFICOS ── */}
      {seccion === "charts" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:12 }}>
          {/* Full historical chart using our data */}
          {rateHistory.length > 2 && (
            <Card>
              <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
                BCV Oficial vs Paralelo · Serie completa · {rateHistory.length} puntos
              </div>
              <RateChart data={rateHistory} />
            </Card>
          )}

          {/* 2026 zoom */}
          {rateHistory.length > 2 && (
            <Card>
              <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
                Zoom 2026 · Post-transición
              </div>
              <RateChart data={rateHistory.filter(r => r.d >= "2026-01-01")} />
            </Card>
          )}

          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:12 }}>
            {/* Brecha chart */}
            {rateHistory.length > 2 && (
              <Card>
                <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
                  Brecha cambiaria % · Histórico
                </div>
                <BrechaChart data={rateHistory} />
              </Card>
            )}

            {/* USD/COP */}
            <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:12, overflow:"hidden" }}>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>USD/COP · Peso Colombiano</div>
              <TradingViewMini symbol="FX_IDC:USDCOP" />
            </div>
          </div>
        </div>
      )}

      {/* ── SOCIOECONÓMICO (World Bank + IMF + R4V) ── */}
      {seccion === "socioeco" && <SocioeconomicPanel mob={mob} />}
    </div>
  );
}

function TradingViewMini({ symbol, height=280 }) {
  const id = useMemo(() => `tv-${Math.random().toString(36).slice(2,8)}`, []);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    const w = document.createElement("div");
    w.className = "tradingview-widget-container";
    const d = document.createElement("div");
    d.className = "tradingview-widget-container__widget";
    w.appendChild(d);
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    s.async = true;
    s.innerHTML = JSON.stringify({
      symbol, width:"100%", height, dateRange:"3M",
      colorTheme:"light", isTransparent:true, autosize:false, locale:"es"
    });
    w.appendChild(s);
    el.appendChild(w);
  }, [id, symbol, height]);
  return <div id={id} style={{ width:"100%", height }} />;
}

const TABS = [
  { id:"dashboard", label:"Dashboard", icon:"📊" },
  { id:"sitrep", label:"SITREP", icon:"📋" },
  { id:"matriz", label:"Matriz", icon:"🎯" },
  { id:"monitor", label:"Monitor", icon:"🚦" },
  { id:"gdelt", label:"Medios", icon:"📡" },
  { id:"conflictividad", label:"Conflictividad", icon:"✊" },
  { id:"ioda", label:"Internet", icon:"🌐" },
  { id:"mercados", label:"Mercados", icon:"📈" },
  { id:"macro", label:"Macro VEN", icon:"💵" },
];

// ═══════════════════════════════════════════════════════════════
// METHODOLOGY FOOTER — Expandable documentation for dummies
// ═══════════════════════════════════════════════════════════════

function MethodologyFooter({ mob }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState(null);

  const toggle = (s) => setSection(section === s ? null : s);

  const sectionStyle = { padding:"12px 0", borderBottom:`1px solid ${BORDER}30` };
  const titleStyle = { fontSize:13, fontWeight:700, color:TEXT, cursor:"pointer", display:"flex", alignItems:"center", gap:8, userSelect:"none" };
  const bodyStyle = { fontSize:12, fontFamily:fontSans, color:MUTED, lineHeight:1.7, marginTop:8, paddingLeft:4 };

  return (
    <div style={{ borderTop:`1px solid ${BORDER}`, marginTop:8, padding:mob?"0 12px 20px":"0 20px 24px" }}>
      <div onClick={() => setOpen(!open)} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 0", cursor:"pointer", userSelect:"none" }}>
        <span style={{ fontSize:12, fontFamily:font, color:`${MUTED}60`, letterSpacing:"0.1em", textTransform:"uppercase" }}>
          {open ? "▼" : "▶"} Metodología, fuentes y cálculos
        </span>
      </div>

      {open && (
        <div style={{ maxWidth:800, margin:"0 auto" }}>

          {/* Intro */}
          <div style={{ fontSize:12, fontFamily:fontSans, color:MUTED, lineHeight:1.7, marginBottom:16, textAlign:"center", padding:"0 16px" }}>
            Este dashboard integra datos de múltiples fuentes públicas para monitorear la situación en Venezuela.
            A continuación explicamos cómo funciona cada componente, de dónde vienen los datos y cómo se calculan los índices.
          </div>

          {/* Section: Escenarios */}
          <div style={sectionStyle}>
            <div style={titleStyle} onClick={() => toggle("esc")}>
              <span>🎯</span> <span>Los 4 Escenarios</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="esc"?"▼":"▶"}</span>
            </div>
            {section==="esc" && <div style={bodyStyle}>
              El análisis se basa en <b>4 escenarios posibles</b> para Venezuela, cada uno con una probabilidad estimada que se actualiza semanalmente:<br/><br/>
              <b style={{color:"#16a34a"}}>E1 — Transición política pacífica</b>: El gobierno acepta negociaciones genuinas, se convocan elecciones con garantías, y se avanza hacia una apertura democrática.<br/><br/>
              <b style={{color:"#dc2626"}}>E2 — Colapso y fragmentación</b>: El régimen pierde control económico o político, se producen fracturas internas, y el país entra en una crisis más profunda.<br/><br/>
              <b style={{color:ACCENT}}>E3 — Continuidad negociada</b>: El gobierno mantiene el poder pero hace concesiones prácticas (energéticas, económicas) a cambio de legitimidad internacional y alivio de sanciones.<br/><br/>
              <b style={{color:"#ca8a04"}}>E4 — Resistencia coercitiva</b>: El gobierno endurece el control, aumenta la represión, y bloquea cualquier apertura real.<br/><br/>
              Las probabilidades se basan en el <b>reporte situacional semanal</b> construido por el equipo analítico del PNUD Venezuela y potenciado con inteligencia artificial. Cada semana se evalúan indicadores, señales y eventos del período para ajustar las probabilidades de cada escenario. La <b>Matriz de Escenarios</b> visualiza la posición en un mapa de 2 ejes: nivel de violencia (horizontal) y grado de cambio (vertical).
            </div>}
          </div>

          {/* Section: Índice de Inestabilidad */}
          <div style={sectionStyle}>
            <div style={titleStyle} onClick={() => toggle("idx")}>
              <span>🌡️</span> <span>Índice de Inestabilidad Compuesto</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="idx"?"▼":"▶"}</span>
            </div>
            {section==="idx" && <div style={bodyStyle}>
              Es un número de <b>0 a 100</b> que resume "qué tan inestable está la situación" combinando 14 factores diferentes. Funciona como un termómetro:<br/><br/>
              <b style={{color:"#16a34a"}}>0-25</b>: Estabilidad relativa — las cosas están relativamente calmadas.<br/>
              <b style={{color:"#ca8a04"}}>26-50</b>: Tensión moderada — hay presiones pero están contenidas.<br/>
              <b style={{color:"#f97316"}}>51-75</b>: Inestabilidad alta — múltiples factores de riesgo activos.<br/>
              <b style={{color:"#dc2626"}}>76-100</b>: Crisis inminente — situación crítica en varios frentes.<br/><br/>
              <b>¿Cómo se calcula?</b> Cada factor tiene un peso (%). Los factores de riesgo suman y los estabilizadores restan. Por ejemplo:<br/><br/>
              • Si la <b>brecha cambiaria</b> (diferencia entre dólar oficial y paralelo) es alta, el índice sube — porque indica presión económica.<br/>
              • Si el <b>precio del petróleo</b> baja mucho, el índice sube — porque Venezuela depende del petróleo para sus ingresos.<br/>
              • Si la probabilidad de <b>E1 (transición pacífica)</b> es alta, el índice baja — porque es un factor estabilizador.<br/><br/>
              <b>3 de los 14 factores se actualizan solos</b> en tiempo real (brecha cambiaria, petróleo, índice bilateral). Los demás se actualizan con cada informe semanal.
            </div>}
          </div>

          {/* Section: Bilateral */}
          <div style={sectionStyle}>
            <div style={titleStyle} onClick={() => toggle("bil")}>
              <span>🇺🇸🇻🇪</span> <span>Conflictividad Bilateral EE.UU.–Venezuela</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="bil"?"▼":"▶"}</span>
            </div>
            {section==="bil" && <div style={bodyStyle}>
              Este indicador mide <b>cuánta tensión hay entre EE.UU. y Venezuela</b> según lo que publican los medios de comunicación del mundo.<br/><br/>
              <b>¿De dónde vienen los datos?</b> De un proyecto llamado <b>PizzINT</b> que procesa datos de <b>GDELT</b> (una base de datos que analiza miles de noticias diarias en todo el mundo). Cada día, GDELT mide el "tono" de los artículos que mencionan a ambos países: si son hostiles, neutrales o positivos.<br/><br/>
              <b>¿Qué significa el número?</b> Se expresa en <b>desviaciones estándar (σ)</b> respecto al promedio histórico desde 2017. En términos simples:<br/><br/>
              • <b>0σ</b> = La relación bilateral está en su nivel normal histórico.<br/>
              • <b>1σ</b> = Hay más tensión de lo habitual.<br/>
              • <b>2σ</b> = La tensión es excepcionalmente alta (solo pasa en momentos de crisis).<br/>
              • <b>3σ+</b> = Crisis activa (como la semana del 3 de enero de 2026, cuando el índice llegó a 3.77).<br/><br/>
              Los <b>4 KPIs</b> del panel muestran: el índice actual, el sentimiento promedio de las noticias (más negativo = más hostil), cuántos artículos hablan de conflicto, y el total de artículos procesados ese día.
            </div>}
          </div>

          {/* Section: GDELT */}
          <div style={sectionStyle}>
            <div style={titleStyle} onClick={() => toggle("gdelt")}>
              <span>📡</span> <span>Medios Internacionales (GDELT)</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="gdelt"?"▼":"▶"}</span>
            </div>
            {section==="gdelt" && <div style={bodyStyle}>
              <b>GDELT</b> (Global Database of Events, Language, and Tone) es un proyecto que monitorea <b>todas las noticias del mundo</b> — miles de artículos por hora, en más de 100 idiomas. Es como tener un equipo de analistas leyendo todos los periódicos del planeta simultáneamente.<br/><br/>
              El tab <b>Medios</b> muestra 3 señales sobre Venezuela durante 120 días:<br/><br/>
              • <b style={{color:"#ff3b3b"}}>Índice de Conflicto</b>: ¿Cuántos artículos sobre Venezuela mencionan palabras como "protesta", "crisis", "violencia"? Si sube, significa que los medios están cubriendo más inestabilidad.<br/><br/>
              • <b style={{color:"#0e7490"}}>Tono Mediático</b>: ¿La cobertura es positiva o negativa? Va de -10 (muy negativo) a +2 (positivo). Venezuela suele estar en terreno negativo (-3 a -5).<br/><br/>
              • <b style={{color:"#c49000"}}>Oleada de Atención</b>: ¿Cuánto espacio le dedican los medios a Venezuela? Un pico indica un evento importante que captó la atención mundial.<br/><br/>
              Las <b>anotaciones</b> en el gráfico marcan eventos clave (ej: "Toma de posesión", "Licencia OFAC") para que puedas ver cómo impactaron la cobertura.
            </div>}
          </div>

          {/* Section: IODA */}
          <div style={sectionStyle}>
            <div style={titleStyle} onClick={() => toggle("ioda")}>
              <span>🌐</span> <span>Conectividad a Internet (IODA)</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="ioda"?"▼":"▶"}</span>
            </div>
            {section==="ioda" && <div style={bodyStyle}>
              <b>IODA</b> (Internet Outage Detection and Analysis) es un proyecto del <b>Georgia Institute of Technology</b> que detecta cortes de internet en tiempo real en todo el mundo.<br/><br/>
              <b>¿Por qué importa para Venezuela?</b> Los cortes de internet pueden indicar: censura gubernamental (bloquear acceso durante protestas), problemas de infraestructura eléctrica (apagones), o crisis económica (falta de mantenimiento en redes).<br/><br/>
              El tab <b>Internet</b> monitorea 3 señales técnicas:<br/><br/>
              • <b>BGP</b>: Mide cuántas "rutas" de internet están activas en Venezuela. Si caen muchas rutas de golpe, algo grave está pasando a nivel de infraestructura.<br/><br/>
              • <b>Active Probing</b>: Son "pings" que se envían a dispositivos en Venezuela para ver si responden. Si muchos dejan de responder, hay un corte.<br/><br/>
              • <b>Network Telescope</b>: Detecta tráfico inusual que suele aparecer cuando hay disrupciones de red.<br/><br/>
              Un <b>corte masivo</b> (las 3 señales caen al mismo tiempo) generalmente indica un apagón eléctrico nacional o una acción deliberada de censura.
            </div>}
          </div>

          {/* Section: Alertas */}
          <div style={sectionStyle}>
            <div style={titleStyle} onClick={() => toggle("alertas")}>
              <span>🚨</span> <span>Alertas en Vivo y Noticias Inteligentes</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="alertas"?"▼":"▶"}</span>
            </div>
            {section==="alertas" && <div style={bodyStyle}>
              <b>Alertas por Umbral</b>: El dashboard vigila datos económicos y geopolíticos en tiempo real. Si alguno cruza un nivel preocupante, aparece una alerta roja o amarilla arriba del todo. Por ejemplo: si la brecha cambiaria supera el 55%, es señal de presión económica seria. Estos umbrales están definidos por el equipo analítico basándose en la experiencia histórica.<br/><br/>
              <b>Alertas de Noticias</b>: Una inteligencia artificial lee los titulares más recientes sobre Venezuela (de Google News y de nuestros feeds RSS) y los clasifica automáticamente:<br/><br/>
              • 🔴 <b>Urgente</b>: Un evento que podría cambiar el rumbo de los escenarios.<br/>
              • 🟡 <b>Seguimiento</b>: Un desarrollo relevante que vale la pena monitorear.<br/>
              • 🟢 <b>Contexto</b>: Información de fondo útil para el análisis.<br/><br/>
              Cada alerta indica la <b>dimensión</b> (política, económica, internacional, DDHH, energía) y una frase corta explicando su relevancia.
            </div>}
          </div>

          {/* Section: IA */}
          <div style={sectionStyle}>
            <div style={titleStyle} onClick={() => toggle("ia")}>
              <span>🤖</span> <span>Inteligencia Artificial en el Dashboard</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="ia"?"▼":"▶"}</span>
            </div>
            {section==="ia" && <div style={bodyStyle}>
              El dashboard utiliza IA para <b>3 funciones específicas</b>:<br/><br/>
              <b>1. Daily Brief</b> (en el SITREP): Busca noticias frescas del día en Google News sobre Venezuela en 3 dimensiones (política, economía, internacional), las combina con datos en vivo del dólar y petróleo, y genera un resumen de 3-4 párrafos citando las fuentes.<br/><br/>
              <b>2. Análisis IA</b> (en el SITREP): Toma TODOS los datos del dashboard (escenarios, 28 indicadores, 32 señales, amnistía, mercados, noticias) y genera un análisis narrativo de 5-6 párrafos. Es como tener un analista que lee todo el dashboard y escribe un informe.<br/><br/>
              <b>3. Alertas de Noticias</b> (en el Dashboard): Clasifica los titulares del día por urgencia y dimensión.<br/><br/>
              <b>Importante</b>: La IA <b>no toma decisiones</b>. No mueve probabilidades ni cambia escenarios. Solo sintetiza la información disponible. Las decisiones analíticas las toma el equipo humano.<br/><br/>
              La IA usa una <b>cascada de 6 proveedores gratuitos</b> (Mistral, Gemini, Groq, OpenRouter, HuggingFace, Claude). Si uno no responde, automáticamente intenta con el siguiente. El badge de color indica cuál respondió.
            </div>}
          </div>

          {/* Section: Fuentes */}
          <div style={{ ...sectionStyle, borderBottom:"none" }}>
            <div style={titleStyle} onClick={() => toggle("fuentes")}>
              <span>📚</span> <span>Fuentes de Datos</span> <span style={{ marginLeft:"auto", fontSize:10, color:MUTED }}>{section==="fuentes"?"▼":"▶"}</span>
            </div>
            {section==="fuentes" && <div style={bodyStyle}>
              <b>Datos en tiempo real (se actualizan solos):</b><br/>
              • <b>Dólar</b>: pydolarvenezuela.org — tasa BCV y paralelo, cada 5 minutos.<br/>
              • <b>Petróleo</b>: U.S. Energy Information Administration (EIA) + OilPriceAPI — Brent, WTI, Gas Natural.<br/>
              • <b>Bilateral</b>: PizzINT/GDELT — índice de tensión EE.UU.-Venezuela, diario.<br/>
              • <b>Noticias</b>: 60+ feeds RSS de medios venezolanos e internacionales + Google News RSS.<br/><br/>
              <b>Datos analíticos (actualizados semanalmente):</b><br/>
              • <b>Escenarios y probabilidades</b>: Equipo analítico PNUD Venezuela.<br/>
              • <b>Indicadores y señales</b>: Recopilación de fuentes oficiales, Foro Penal, OVCS, FMI, SENIAT, BCV.<br/>
              • <b>Amnistía</b>: Cifras del gobierno vs verificaciones de Foro Penal.<br/><br/>
              <b>Datos de terceros (vía API):</b><br/>
              • <b>GDELT</b>: gdeltproject.org — Cobertura mediática global, financiado por Google Jigsaw.<br/>
              • <b>IODA</b>: Georgia Institute of Technology — Conectividad a internet.<br/>
              • <b>ACLED</b>: Armed Conflict Location & Event Data — Eventos de conflicto y protesta.<br/>
              • <b>Polymarket</b>: Mercados de predicción sobre Venezuela.<br/>
              • <b>OVCS</b>: Observatorio Venezolano de Conflictividad Social — Protestas mensuales.
            </div>}
          </div>

          <div style={{ textAlign:"center", fontSize:9, fontFamily:font, color:`${MUTED}40`, padding:"12px 0 4px" }}>
            Monitor de Contexto Situacional · PNUD Venezuela · Marzo 2026
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NEWS + POLYMARKET TICKER — Scrolling bar at the top
// ═══════════════════════════════════════════════════════════════

function NewsTicker() {
  const [items, setItems] = useState([]);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    async function loadTicker() {
      const tickerItems = [];

      // Fetch Google News headlines
      if (IS_DEPLOYED) {
        try {
          const newsRes = await fetch("/api/gdelt?signal=headlines", { signal: AbortSignal.timeout(10000) });
          if (newsRes.ok) {
            const h = await newsRes.json();
            const allNews = (h.all || []).filter(a => a.title?.length > 20).slice(0, 6);
            allNews.forEach(a => {
              tickerItems.push({ type:"news", text:a.title, source:a.source });
            });
          }
        } catch {}

        // Fetch Polymarket prices
        try {
          const pmRes = await fetch("/api/polymarket", { signal: AbortSignal.timeout(10000) });
          if (pmRes.ok) {
            const pm = await pmRes.json();
            (pm.markets || []).slice(0, 6).forEach(m => {
              const shortQ = m.question.length > 50 ? m.question.slice(0, 47) + "..." : m.question;
              tickerItems.push({ type:"market", text:shortQ, price:m.price, slug:m.slug });
            });
          }
        } catch {}
      }

      if (tickerItems.length > 0) setItems(tickerItems);
    }

    setTimeout(loadTicker, 1500);
  }, []);

  if (items.length === 0) return null;

  // Interleave news and markets
  const news = items.filter(i => i.type === "news");
  const markets = items.filter(i => i.type === "market");
  const interleaved = [];
  const maxLen = Math.max(news.length, markets.length);
  for (let i = 0; i < maxLen; i++) {
    if (news[i]) interleaved.push(news[i]);
    if (markets[i]) interleaved.push(markets[i]);
  }

  // Duplicate for seamless loop
  const tickerContent = [...interleaved, ...interleaved];

  return (
    <div style={{ background:"#0f172a", overflow:"hidden", height:28, display:"flex", alignItems:"center", position:"relative" }}>
      <div style={{
        display:"flex", alignItems:"center", gap:32, whiteSpace:"nowrap",
        animation:`tickerScroll ${tickerContent.length * 4}s linear infinite`,
        paddingLeft:"100%",
      }}>
        {tickerContent.map((item, i) => (
          <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:11, fontFamily:font }}>
            {item.type === "news" ? (
              <>
                <span style={{ color:"#22d3ee", fontSize:9, fontWeight:700 }}>📰</span>
                <span style={{ color:"#e2e8f0" }}>{item.text}</span>
                <span style={{ color:"#64748b", fontSize:9 }}>[{item.source}]</span>
              </>
            ) : (
              <>
                <span style={{ color:"#a78bfa", fontSize:9, fontWeight:700 }}>📊</span>
                <span style={{ color:"#e2e8f0" }}>{item.text}</span>
                <span style={{ color:item.price > 50 ? "#22c55e" : item.price < 20 ? "#ef4444" : "#eab308", fontWeight:700, fontSize:12 }}>{item.price}%</span>
              </>
            )}
            <span style={{ color:"#334155", margin:"0 8px" }}>·</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

export default function MonitorPNUD() {
  const [tab, setTab] = useState("dashboard");
  const [week, setWeek] = useState(WEEKS.length - 1);
  const mob = useIsMobile();

  // ── Shared live data (fetched once, available to all tabs including AI) ──
  const [liveData, setLiveData] = useState({ dolar:null, oil:null, gdeltSummary:null, news:null, bilateral:null, fetched:false });

  useEffect(() => {
    async function fetchLiveData() {
      const results = { dolar:null, oil:null, gdeltSummary:null, news:null, bilateral:null, fetched:true };
      try {
        // Dolar
        const dolarUrl = IS_DEPLOYED ? "/api/dolar?type=live" : "https://ve.dolarapi.com/v1/dolares";
        const dRes = await fetch(dolarUrl, { signal:AbortSignal.timeout(8000) }).then(r=>r.ok?r.json():null).catch(()=>null);
        if (dRes && Array.isArray(dRes)) {
          const o = dRes.find(d=>d.fuente==="oficial"), p = dRes.find(d=>d.fuente==="paralelo");
          if (o?.promedio || p?.promedio) results.dolar = { bcv:o?.promedio, paralelo:p?.promedio, brecha: o?.promedio && p?.promedio ? (((p.promedio-o.promedio)/o.promedio)*100).toFixed(1)+"%" : null };
        }
      } catch {}
      try {
        // Oil prices
        const oilUrl = IS_DEPLOYED ? "/api/oil-prices" : null;
        if (oilUrl) {
          const oRes = await fetch(oilUrl, { signal:AbortSignal.timeout(12000) }).then(r=>r.ok?r.json():null).catch(()=>null);
          if (oRes) results.oil = { brent:oRes.brent?.price, wti:oRes.wti?.price, gas:oRes.natgas?.price };
        }
      } catch {}
      try {
        // News headlines (top 5)
        const newsUrl = IS_DEPLOYED ? "/api/news" : null;
        if (newsUrl) {
          const nRes = await fetch(newsUrl, { signal:AbortSignal.timeout(8000) }).then(r=>r.ok?r.json():null).catch(()=>null);
          if (nRes?.news?.length) results.news = nRes.news.slice(0,5).map(n => n.title || n.headline || "").filter(Boolean);
        }
      } catch {}
      try {
        // Bilateral Threat Index (PizzINT/GDELT)
        const bilUrl = IS_DEPLOYED ? `/api/bilateral?_t=${Math.floor(Date.now()/600000)}` : null;
        if (bilUrl) {
          const bRes = await fetch(bilUrl, { signal:AbortSignal.timeout(12000) }).then(r=>r.ok?r.json():null).catch(()=>null);
          if (bRes?.latest) results.bilateral = bRes;
        }
      } catch {}
      setLiveData(results);
    }
    fetchLiveData();
    const iv = setInterval(fetchLiveData, 300000); // refresh every 5 min
    return () => clearInterval(iv);
  }, []);

  // Google Translate init
  useEffect(() => {
    if (window.googleTranslateElementInit) return;
    window.googleTranslateElementInit = function() {
      new window.google.translate.TranslateElement({
        pageLanguage: 'es',
        includedLanguages: 'es,en,fr,pt',
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false,
      }, 'google_translate_element');
    };
    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return (
    <div style={{ fontFamily:fontSans, background:BG, minHeight:"100vh", color:TEXT, overflowX:"hidden" }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .goog-te-banner-frame, .skiptranslate > iframe { display:none !important; }
        body { top:0 !important; margin:0; overflow-x:hidden; }
        html { overflow-x:hidden; }
        .goog-te-gadget { font-family:${font} !important; font-size:0 !important; }
        .goog-te-gadget .goog-te-combo { font-family:${font}; font-size:11px; background:${BG2}; border:1px solid ${BORDER}; color:${ACCENT};
          padding:5px 10px; cursor:pointer; outline:none; border-radius:4px; }
        .goog-te-gadget > span { display:none !important; }
        #google_translate_element { display:inline-block; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${BORDER}; border-radius:3px; }
        svg { max-width:100%; }
        @media (max-width:768px) {
          .leaflet-container { height:300px !important; }
          table { font-size:11px; }
          svg text { font-size:9px !important; }
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,700;0,900;1,400&display=swap" rel="stylesheet" />

      {/* TICKER BAR */}
      <NewsTicker />

      {/* HEADER */}
      <div style={{ borderBottom:`2px solid ${ACCENT}`, padding:mob?"10px 12px":"12px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", background:BG2, boxShadow:"0 1px 4px rgba(0,0,0,0.08)", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:mob?8:14 }}>
          <div style={{ background:ACCENT, color:"#fff", fontFamily:font, fontSize:mob?11:14, fontWeight:700, letterSpacing:"0.15em", padding:mob?"3px 6px":"5px 10px", borderRadius:3 }}>PNUD</div>
          <div>
            <div style={{ fontSize:mob?12:16, fontWeight:600, color:TEXT, letterSpacing:"0.02em" }}>{mob?"Monitor Venezuela 2026":"Monitor de Contexto Situacional · Venezuela 2026"}</div>
            {!mob && <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.08em" }}>Programa de las Naciones Unidas para el Desarrollo</div>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:mob?6:10, flexWrap:"wrap" }}>
          {!mob && <div id="google_translate_element" />}
          <select value={week} onChange={e => setWeek(+e.target.value)}
            style={{ fontFamily:font, fontSize:mob?11:13, background:BG2, border:`1px solid ${BORDER}`, color:ACCENT,
              padding:mob?"4px 22px 4px 6px":"5px 28px 5px 10px", cursor:"pointer", outline:"none",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%230A97D9'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 6px center" }}>
            {WEEKS.map((w,i) => <option key={i} value={i}>{w.label}</option>)}
          </select>
          {!mob && <Badge color={week===WEEKS.length-1?"#22c55e":MUTED}>{week===WEEKS.length-1?"Más reciente":"Archivo"}</Badge>}
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ display:"flex", alignItems:"center", gap:0, padding:mob?"0 8px":"0 24px", background:BG2, borderBottom:`1px solid ${BORDER}`, overflowX:"auto", boxShadow:"0 1px 2px rgba(0,0,0,0.04)", WebkitOverflowScrolling:"touch" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ fontFamily:font, fontSize:mob?9:11, letterSpacing:"0.08em", textTransform:"uppercase",
              padding:mob?"10px 8px":"12px 16px", background:"transparent",
              border:"none", borderBottom:tab===t.id?`3px solid ${ACCENT}`:"3px solid transparent",
              color:tab===t.id?ACCENT:MUTED, fontWeight:tab===t.id?700:400, cursor:"pointer", transition:"all 0.15s",
              whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:mob?3:6 }}>
            <span style={{ fontSize:mob?12:15 }}>{t.icon}</span>
            {mob ? null : t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth:1340, margin:"0 auto", padding:mob?"12px 10px 40px":"24px 24px 60px" }}>
        {tab === "dashboard" && <TabDashboard week={week} liveData={liveData} />}
        {tab === "sitrep" && <TabSitrep liveData={liveData} />}
        {tab === "matriz" && <TabMatriz week={week} setWeek={setWeek} />}
        {tab === "monitor" && <TabMonitor />}
        {tab === "gdelt" && <TabGdelt />}
        {tab === "conflictividad" && <TabConflictividad />}
        {tab === "ioda" && <TabIODA />}
        {tab === "mercados" && <TabMercados />}
        {tab === "macro" && <TabMacro />}
      </div>

      {/* FOOTER + METHODOLOGY */}
      <div style={{ textAlign:"center", fontSize:12, fontFamily:font, color:`${MUTED}60`, padding:"8px 0 4px", letterSpacing:"0.1em", textTransform:"uppercase" }}>
        PNUD Venezuela · Monitor Situacional · Uso interno · {WEEKS[week].label}
      </div>
      <MethodologyFooter mob={useIsMobile()} />
    </div>
  );
}
