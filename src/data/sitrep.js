// SITREP Weekly Reports — Update each week with new analysis

export const SITREP_ALL = [
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
  // S9: 6–13 marzo 2026
  { period:"6 – 13 de marzo de 2026", periodShort:"6–13 mar 2026",
    keyPoints:[
      { tag:"Diplomacia", color:"#0468B1", title:"Trump reconoce formalmente a Rodríguez", text:"Trump designa al gobierno de Delcy Rodríguez como «único interlocutor legítimo de Venezuela» y lo califica como «nuevo socio energético». El reconocimiento fue notificado al tribunal federal de Nueva York, debilitando la defensa legal de Maduro. Washington señala elecciones hacia 2027." },
      { tag:"Energía", color:"#ca8a04", title:"Venezuela supera 1 millón de barriles diarios", text:"Producción alcanza 1.021.000 bpd en febrero (+10,5%). GL-51 habilita oro venezolano; primer cargamento de USD 100M entregado a EE.UU. Chevron negocia Ayacucho 8, Shell firma Carito/Pirital, Repsol anuncia +200% a 2028 (>EUR 1.000M)." },
      { tag:"Social", color:"#E5243B", title:"Mayor jornada de protesta laboral del año", text:"El 12 de marzo: 39 movilizaciones coordinadas en 23 estados exigiendo aumento salarial. Superaron piquetes de la PNB. BCV publica inflación del 617% anualizada. 70% de la población percibe menos de USD 300 vs. canasta de USD 425-622." },
      { tag:"Oposición", color:"#8b5cf6", title:"MCM marginalizada por Washington", text:"Trump recibió a MCM «como cortesía» en la Casa Blanca y le aconsejó no regresar aún. Señaló elecciones hacia 2027. MCM realizó agenda internacional intensa (Kast, Milei, Felipe VI) sin modificar la prioridad estratégica de Washington." },
    ],
    sintesis:"E3 se consolida al 42% (+2pp) por el reconocimiento formal de EE.UU. al gobierno de Rodríguez — el hecho de mayor impacto estructural del período post-3 enero. La producción supera 1M bpd, la GL-51 habilita el oro, y Chevron/Shell/Repsol amplían inversiones. E1 retrocede a 33% (-5pp): Washington prioriza estabilidad sobre transición. E4 sube a 15% (+5pp) por la escalada laboral del 12 de marzo (39 movilizaciones, 23 estados). E2 baja a 10%, contenido por solidez del acuerdo bilateral.",
    actores:[
      { name:"EE.UU.", items:["Trump reconoce a Rodríguez como «único interlocutor legítimo»","GL-51 oro: primer cargamento USD 100M entregado","Burgum visitó Caracas — reuniones sector minero","SOUTHCOM patrulla F-35/P-8/KC-46 frente a costas (6/03)","Trump aconseja a MCM no regresar; elecciones 2027","Negocia extradición de Alex Saab (Miami)"] },
      { name:"Gobierno Interino", items:["7.727 beneficiados Ley de Amnistía","Decreto 5.266: absorción Minerven por CVM","Nueva Ministra Hidrocarburos: Paula Henao","Ley de Minas primera discusión — concesiones 30 años","Acuerdo gasoducto Ricaurte con Colombia","Producción 1.021 kbd (+10,5%) — supera 1M bpd"] },
      { name:"Oposición", items:["MCM: reunión breve con Trump (cortesía) + agenda Chile (Kast, Milei, Felipe VI)","Bancada Libertad salvó voto en Ley de Minas","PUD alerta sobre «acuerdos opacos» en Poder Ciudadano","Guanipa sobreseído · Williams Dávila libertad plena","Capriles defiende posición de Libertad","Centrados en la Gente marca distancia de Márquez"] },
      { name:"Sociedad", items:["12 de marzo: 39 movilizaciones en 23 estados — pico del año","65 protestas totales en la semana (prom. 16/día)","Demanda central: aumento salarial","Gremios, sindicatos, jubilados y pensionados","Superaron piquetes de la PNB","Diputados acompañaron demandas (Stalin González)"] },
    ],
    nacional: {
      amnistia: { solicitudes:null, libertadesPlenas:7727, privadosLiberados:null, cautelares:null, militares:null, fpVerificados:670, fpDetenidos:508, fpNota:"Foro Penal 9 mar: 670 excarcelaciones verificadas · 508 presos políticos activos · ONU: 87 nuevas detenciones post-3 enero" },
      rodriguez: [
        { title:"Reconocimiento formal de EE.UU.", text:"Trump designa a Rodríguez como «único interlocutor legítimo de Venezuela». Notificación al tribunal federal de NY." },
        { title:"Decreto N.° 5.266", text:"Absorción de Minerven por la Corporación Venezolana de Minería. Ministro Héctor José Silva a cargo." },
        { title:"Nueva Ministra de Hidrocarburos", text:"Ingeniera Paula Henao, con más de dos décadas en PDVSA, designada para dirigir la política petrolera." },
        { title:"Crecimiento proyectado", text:"Proyectó crecimiento de dos dígitos para 2026 en la Expo Fedecámaras Portuguesa." },
      ],
    },
    economia: {
      kpis: [
        { value:"1.021 kbd", label:"Producción petrolera feb. (+10,5%)", color:"#0468B1" },
        { value:"GL-51", label:"Licencia oro venezolano para EE.UU.", color:"#16a34a" },
        { value:"617%", label:"Inflación anualizada (BCV oficial)", color:"#E5243B" },
        { value:"$52,31", label:"Merey 16° API (USD/bbl, +$9,10)", color:"#ca8a04" },
      ],
      empresas: [
        { empresa:"Chevron", desarrollo:"Negocia expansión de Petropiar hacia bloque Ayacucho 8." },
        { empresa:"Shell", desarrollo:"Firma acuerdos para campos Carito y Pirital en Monagas Norte." },
        { empresa:"Repsol", desarrollo:"Plan +50% en 2026, +200% en 2028 con inversiones >EUR 1.000M." },
        { empresa:"PDVSA", desarrollo:"Reparación gasoducto binacional Antonio Ricaurte (225 km) con Colombia." },
      ],
    },
    escenarios: [
      { name:"Continuidad Negociada", prob:"42%", color:"#0468B1", text:"Reconocimiento formal EE.UU. + producción 1M bpd + GL-51 + inversiones Chevron/Shell/Repsol + Ley de Minas." },
      { name:"Transición Política Pacífica", prob:"33%", color:"#2d8a30", text:"Diferida por Washington: elecciones 2027. MCM marginalizada pero activa internacionalmente. E1 estructuralmente activo." },
      { name:"Resistencia Coercitiva", prob:"15%", color:"#ca8a04", text:"Sube por escalada laboral 12/03 (39 protestas, 23 estados) + tensiones Poder Ciudadano + 508 presos + 87 nuevas detenciones ONU." },
      { name:"Colapso y Fragmentación", prob:"10%", color:"#dc2626", text:"Contenido por solidez del acuerdo EE.UU.–Venezuela. Riesgo: inflación 617% + brecha salarial estructural." },
    ],
    comentarios: [
      { tag:"Factor 1", color:"#16a34a", title:"Reconocimiento formal cierra la ambigüedad", text:"El hecho estructurante de la semana: la legitimidad internacional del gobierno interino queda anclada a la cooperación energética, no al origen democrático. Produce estabilidad de corto plazo pero no resuelve tensiones de fondo." },
      { tag:"Factor 2", color:"#E5243B", title:"Conflictividad laboral cruza umbral cualitativo", text:"39 movilizaciones coordinadas en 23 estados no son reacción espontánea sino organización gremial con capacidad nacional. Si escala, la presión salarial pasa de variable social a variable política de primer orden." },
      { tag:"Factor 3", color:"#ca8a04", title:"Sostenibilidad del esquema en tres factores", text:"(1) Traducir el boom energético en mejoras salariales antes de que la conflictividad escale; (2) designaciones en Poder Ciudadano que muestren apertura real; (3) manejo del retorno de MCM sin fricciones con Washington." },
    ],
  },
];


