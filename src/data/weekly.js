export const KPIS_LATEST = {
  "energia": [
    {
      "k": "Producción OPEP",
      "v": "1,07–1,187M b/d",
      "c": "#22c55e"
    },
    {
      "k": "Meta oficial",
      "v": "1,5M b/d · 30 acuerdos",
      "c": "#22c55e"
    },
    {
      "k": "Merey junio",
      "v": "USD 71,13 · −14,1%",
      "c": "#f59e0b"
    },
    {
      "k": "Electricidad",
      "v": "+6.400 MW acordados",
      "c": "#22c55e"
    }
  ],
  "politico": [
    {
      "k": "E3 dominante",
      "v": "48% · +2pp",
      "c": "#38bdf8"
    },
    {
      "k": "E1",
      "v": "27% · −6pp",
      "c": "#22c55e"
    },
    {
      "k": "E4",
      "v": "16% · +3pp",
      "c": "#ca8a04"
    },
    {
      "k": "Hoja de ruta",
      "v": "AN2015 · 1° agosto",
      "c": "#ef4444"
    }
  ],
  "opinion": [
    {
      "k": "Balance oficial",
      "v": "4.930 fallecidos",
      "c": "#ef4444"
    },
    {
      "k": "Campamentos",
      "v": "21.210 personas · 107",
      "c": "#f59e0b"
    },
    {
      "k": "Inflación junio",
      "v": "13,8% · 129,82% acum.",
      "c": "#ef4444"
    },
    {
      "k": "Brecha E3–E1",
      "v": "21 puntos",
      "c": "#f59e0b"
    }
  ]
};

export const WEEKS = [
  {
    "label": "3–15 ene",
    "short": "S1",
    "probs": [
      {
        "sc": 1,
        "v": 5,
        "t": "flat"
      },
      {
        "sc": 2,
        "v": 45,
        "t": "flat"
      },
      {
        "sc": 3,
        "v": 40,
        "t": "flat"
      },
      {
        "sc": 4,
        "v": 10,
        "t": "flat"
      }
    ],
    "xy": {
      "x": 0.53,
      "y": 0.5
    },
    "sem": {
      "g": 2,
      "y": 4,
      "r": 7
    },
    "kpis": {
      "energia": {
        "exportaciones": "Interrumpidas",
        "ingresos": "—",
        "licencias": "En proceso",
        "cambio": "—"
      },
      "economico": {
        "inflacion": "567% (2025)",
        "ingresos_pob": "< USD 300",
        "electricidad": "Sin datos",
        "pib": "—"
      },
      "opinion": {
        "direccion": "—",
        "elecciones": "93.5% rechaza trans. chav.",
        "mcm": "—",
        "eeuu": "47%"
      }
    },
    "tensiones": [
      {
        "l": "red",
        "t": "<b>Operativo 3 ene:</b> Captura de Maduro. Alta fragilidad institucional."
      },
      {
        "l": "red",
        "t": "<b>Exportaciones:</b> Interrupción casi total primeros días."
      },
      {
        "l": "yellow",
        "t": "<b>Excarcelaciones:</b> 101 confirmadas, 14 periodistas."
      }
    ],
    "lectura": "El operativo del 3 de enero inaugura el ciclo en condiciones de fragilidad máxima. La captura de Maduro por fuerzas estadounidenses genera un shock institucional sin precedentes: las exportaciones petroleras se interrumpen casi totalmente en los primeros días, la opacidad sobre víctimas del operativo es elevada, y las restricciones a la prensa extranjera configuran un entorno de alta incertidumbre. E2 (Colapso y fragmentación) domina con 45% porque el riesgo de desintegración institucional es real — pero la rápida designación de Delcy Rodríguez como autoridad interina, avalada por el TSJ y reconocida funcionalmente por Washington, impide que el vacío de poder se convierta en crisis terminal. Las 101 excarcelaciones confirmadas, incluidos 14 periodistas, son la primera señal de distensión selectiva. El 47% de aprobación interna a la operación estadounidense y el 79% de opinión favorable hacia Delcy (Hinterlaces) revelan que la ciudadanía procesa el shock con pragmatismo más que con rechazo. E3 (Continuidad negociada) ya está al 40%, emergiendo como alternativa viable si el flujo petrolero se restablece. La clave de esta semana es que el operativo no desencadenó el colapso que muchos anticipaban: la cohesión civil-militar se preservó, la continuidad institucional condicionada fue avalada, y las primeras señales de cooperación energética con EE.UU. aparecen hacia el final del período.",
    "trendSc": 3,
    "trendDrivers": [
      "Estabilización post-operativo: continuidad institucional bajo tutela EE.UU.",
      "Exportaciones petroleras reactivándose; orden ejecutiva Trump protege ingresos",
      "Excarcelaciones graduales señalan distensión selectiva"
    ]
  },
  {
    "label": "16–22 ene",
    "short": "S2",
    "probs": [
      {
        "sc": 1,
        "v": 15,
        "t": "up"
      },
      {
        "sc": 2,
        "v": 25,
        "t": "down"
      },
      {
        "sc": 3,
        "v": 50,
        "t": "up"
      },
      {
        "sc": 4,
        "v": 10,
        "t": "flat"
      }
    ],
    "xy": {
      "x": 0.42,
      "y": 0.45
    },
    "sem": {
      "g": 3,
      "y": 5,
      "r": 5
    },
    "kpis": {
      "energia": {
        "exportaciones": "En recuperación",
        "ingresos": "Divisas a banca",
        "licencias": "LG-46 en proceso",
        "cambio": "Relativa estabilidad"
      },
      "economico": {
        "inflacion": "Alta (3 dígitos)",
        "ingresos_pob": "< USD 300",
        "electricidad": "Sin datos",
        "pib": "—"
      },
      "opinion": {
        "direccion": "—",
        "elecciones": "—",
        "mcm": "51.6% prefiere MCM",
        "eeuu": "47%"
      }
    },
    "tensiones": [
      {
        "l": "yellow",
        "t": "<b>Doble canal EE.UU.:</b> Reconocimiento a Delcy + interlocución MCM."
      },
      {
        "l": "yellow",
        "t": "<b>DDHH:</b> Excarcelaciones + nuevas detenciones simultáneas."
      },
      {
        "l": "green",
        "t": "<b>Divisas:</b> Flujo hacia banca privada iniciado."
      }
    ],
    "lectura": "La semana del 16 al 22 de enero marca el punto de inflexión decisivo del ciclo: el tránsito desde la fragilidad máxima hacia la estabilización incipiente. Tres hitos cambian estructuralmente el mapa de riesgos. La visita a Caracas del Director de la CIA John Ratcliffe establece que el vínculo bilateral tiene profundidad de inteligencia, no solo económica. La Licencia General 46 de la OFAC crea por primera vez un marco normativo claro para la cooperación energética bilateral. Y la reapertura del espacio aéreo normaliza el vínculo a nivel cotidiano. E3 sube a 50% dominante porque el acoplamiento energético-financiero ya tiene mecanismos concretos funcionando: USD 300 millones colocados a través de banca privada, BCV publica tipo de cambio oficial por primera vez desde agosto 2024. El doble canal estratégico de Washington — reconocer a Delcy para energía y seguridad, mantener interlocución con MCM sin trasladarle control — es un diseño deliberado, no una contradicción. E2 cae a 25% porque el riesgo de colapso se desvanece al regularizarse las exportaciones. La reestructuración de 28 cargos intermedios de la FANB, manteniendo intacta la cúpula, es señal de control preventivo sin ruptura.",
    "trendSc": 3,
    "trendDrivers": [
      "LG-46 OFAC: marco normativo para cooperación energética bilateral",
      "Doble canal EE.UU.: reconocimiento a Delcy + interlocución con MCM",
      "USD 300M en divisas a banca privada consolidan el esquema financiero"
    ]
  },
  {
    "label": "23–29 ene",
    "short": "S3",
    "probs": [
      {
        "sc": 1,
        "v": 20,
        "t": "up"
      },
      {
        "sc": 2,
        "v": 10,
        "t": "down"
      },
      {
        "sc": 3,
        "v": 60,
        "t": "up"
      },
      {
        "sc": 4,
        "v": 10,
        "t": "flat"
      }
    ],
    "xy": {
      "x": 0.35,
      "y": 0.4
    },
    "sem": {
      "g": 5,
      "y": 5,
      "r": 3
    },
    "kpis": {
      "energia": {
        "exportaciones": "~800 kbd (+60.6%)",
        "ingresos": "Divisas regulares",
        "licencias": "LG-46 emitida",
        "cambio": "Estabilizando"
      },
      "economico": {
        "inflacion": "Alta (3 dígitos)",
        "ingresos_pob": "< USD 300",
        "electricidad": "Afectaciones",
        "pib": "Proy. al alza"
      },
      "opinion": {
        "direccion": "—",
        "elecciones": "Reunión Rubio–MCM",
        "mcm": "78% intención voto",
        "eeuu": "—"
      }
    },
    "tensiones": [
      {
        "l": "green",
        "t": "<b>LG-46:</b> Licencia OFAC emitida — hito operativo clave."
      },
      {
        "l": "green",
        "t": "<b>Reforma Hidrocarburos:</b> Cambio más profundo en 50 años."
      },
      {
        "l": "yellow",
        "t": "<b>Agenda electoral:</b> Sin fechas. Presión opositora activa."
      }
    ],
    "lectura": "E3 consolida su probabilidad más alta del ciclo — 60% — porque el esquema de estabilización deja de ser promesa y se convierte en mecanismo operativo verificable. La LG-46 está efectiva: Vitol carga ~460.000 barriles de nafta pesada desde Houston reactivando la producción de la Faja del Orinoco. Las exportaciones supervisadas se incrementan sostenidamente. La reforma a la Ley Orgánica de Hidrocarburos — aprobada en segunda discusión — representa el cambio estructural más profundo en el sector petrolero venezolano en 50 años. La reunión Rubio-MCM en Washington institucionaliza el doble canal hacia la transición, y la Ley de Amnistía entra en primera discusión. El 78.3% de intención de voto por MCM configura la base opositora más sólida del ciclo. Sin embargo, Washington es explícito en sus reservas sobre el retorno inmediato de MCM: Rubio compara el proceso con la transición española post-Franco — 'los cambios profundos requieren tiempo'. E2 cae a 10% porque sin interrupción del esquema petrolero-financiero, el riesgo de fragmentación está estructuralmente contenido.",
    "trendSc": 1,
    "trendDrivers": [
      "MCM con 78.3% intención de voto: base opositora más sólida del ciclo",
      "Reunión Rubio-MCM institucionaliza el canal hacia transición",
      "Ley de Amnistía en primera discusión: apertura política avanza"
    ]
  },
  {
    "label": "30e–5f",
    "short": "S4",
    "probs": [
      {
        "sc": 1,
        "v": 30,
        "t": "up"
      },
      {
        "sc": 2,
        "v": 5,
        "t": "down"
      },
      {
        "sc": 3,
        "v": 50,
        "t": "down"
      },
      {
        "sc": 4,
        "v": 15,
        "t": "up"
      }
    ],
    "xy": {
      "x": 0.35,
      "y": 0.42
    },
    "sem": {
      "g": 5,
      "y": 5,
      "r": 3
    },
    "kpis": {
      "energia": {
        "exportaciones": "~800 kbd",
        "ingresos": "USD >800M acum.",
        "licencias": "LG-46 operativa",
        "cambio": "420–430 VEB/USD"
      },
      "economico": {
        "inflacion": "~200% proy.",
        "ingresos_pob": "69.5% < USD 300",
        "electricidad": "Deterioro",
        "pib": "10.4–15.2% proy."
      },
      "opinion": {
        "direccion": "—",
        "elecciones": "93.5% rechaza trans.",
        "mcm": "78.3%",
        "eeuu": "—"
      }
    },
    "tensiones": [
      {
        "l": "yellow",
        "t": "<b>Amnistía 1ª discusión:</b> Arts. 7–13 diferidos."
      },
      {
        "l": "yellow",
        "t": "<b>Excarcelaciones:</b> Patrón con medidas cautelares."
      },
      {
        "l": "red",
        "t": "<b>FANB:</b> Reafirma lealtad al Proyecto Bolivariano."
      }
    ],
    "lectura": "Primera tensión sistémica del ciclo de estabilización. E3 cede levemente a 50%, E1 sube a 30% y E4 gana terreno hasta 15%. La contradicción central es entre la aceleración de la normalización energético-diplomática — ampliación de licencias OFAC, bonos soberanos al alza, trayectoria hacia 800K bpd — y la resistencia del Ejecutivo a las aperturas políticas que esa misma lógica comienza a demandar. El cierre de El Helicoide como centro policial es presentado como señal de apertura, pero 949 personas detenidas por motivos políticos al 21 de enero contextualizan la señal. La FANB reafirma el 4 de febrero su lealtad al Proyecto Bolivariano. Jorge Rodríguez descarta públicamente elecciones inmediatas. El 93.5% de rechazo a una transición chavista y el 78.3% de intención de voto por MCM representan una demanda que E3 no puede ignorar indefinidamente. 14 jefes de Estado europeos presionan hacia un cronograma electoral. Trump propone reunir a representantes del chavismo y la oposición. E4 sube a 15% por acumulación de señales de control discrecional: aplazamiento del proceso contra Maduro, opacidad en cooperación con autoridades de Álex Saab y Raúl Gorrín.",
    "trendSc": 1,
    "trendDrivers": [
      "93.5% rechaza transición chavista: presión social máxima hacia cambio",
      "MCM con 78.3%: mandato popular claro hacia transición",
      "14 jefes de Estado europeos refuerzan presión hacia elecciones"
    ]
  },
  {
    "label": "6–13 feb",
    "short": "S5",
    "probs": [
      {
        "sc": 1,
        "v": 30,
        "t": "flat"
      },
      {
        "sc": 2,
        "v": 5,
        "t": "flat"
      },
      {
        "sc": 3,
        "v": 45,
        "t": "down"
      },
      {
        "sc": 4,
        "v": 20,
        "t": "up"
      }
    ],
    "xy": {
      "x": 0.38,
      "y": 0.42
    },
    "sem": {
      "g": 6,
      "y": 6,
      "r": 4
    },
    "kpis": {
      "energia": {
        "exportaciones": "~800 kbd · EE.UU.",
        "ingresos": "USD >1.000M",
        "licencias": "GL49+GL50/50A",
        "cambio": "420–430 VEB/USD"
      },
      "economico": {
        "inflacion": "174% proy. 2026",
        "ingresos_pob": "69.5% < USD 300",
        "electricidad": "14.8h sin suministro",
        "pib": "10.4–15.2%"
      },
      "opinion": {
        "direccion": "80% (Hinterlaces)",
        "elecciones": "67% votaría MCM",
        "mcm": "Alta",
        "eeuu": ">90% respalda"
      }
    },
    "tensiones": [
      {
        "l": "yellow",
        "t": "<b>Amnistía 2ª discusión:</b> Diferida arts. 7–13."
      },
      {
        "l": "red",
        "t": "<b>Excarcelaciones:</b> 897 oficial vs 430 ONG — brecha >50%."
      },
      {
        "l": "yellow",
        "t": "<b>Visita Chris Wright:</b> Agenda energética de largo plazo."
      }
    ],
    "lectura": "La semana de mayor ambigüedad estructural del ciclo. E3 continúa dominante al 45% pero la distancia sobre E1 se reduce (30%) y E4 sube a 20%, configurando el mapa más distribuido. Tres dinámicas operan simultáneamente sin converger. La visita del secretario de Energía Chris Wright consolida la cooperación de largo plazo: GL49, GL46A, GL48 y GL50 operativas, con BP, Chevron, Eni, Repsol y Shell autorizadas bajo condiciones estrictas. Repsol obtiene autorización para extraer crudo. 50 millones de barriles hacia Houston confirman escala real. Pero la Ley de Amnistía revela sus límites: la segunda discusión es diferida para los artículos 7 al 13 — los más sensibles. El patrón de excarcelaciones con medidas cautelares genera percepción de reversibilidad. La brecha entre 897 liberaciones oficiales y ~430 verificadas por ONG mantiene activa la disputa narrativa. E4 sube por señales específicas de control discrecional: Delcy reafirma en NBC la legitimidad formal de Maduro pese a su detención, mientras ejerce conducción interina — un equilibrio retórico que revela la fragilidad del marco político subyacente.",
    "trendSc": 1,
    "trendDrivers": [
      "67% votaría por MCM (Financial Times): demanda electoral sostenida",
      "75% percibe país en dirección correcta: base de expectativa",
      "Hoja de ruta EE.UU. de tres fases incluye 'transición' como fase 3"
    ]
  },
  {
    "label": "13–20 feb",
    "short": "S6",
    "probs": [
      {
        "sc": 1,
        "v": 35,
        "t": "up"
      },
      {
        "sc": 2,
        "v": 15,
        "t": "flat"
      },
      {
        "sc": 3,
        "v": 40,
        "t": "down"
      },
      {
        "sc": 4,
        "v": 10,
        "t": "down"
      }
    ],
    "xy": {
      "x": 0.38,
      "y": 0.5
    },
    "sem": {
      "g": 9,
      "y": 8,
      "r": 5
    },
    "kpis": {
      "energia": {
        "exportaciones": "~800 kbd · ↑60.6%",
        "ingresos": "USD >1.000M · ac. USD 5.000M",
        "licencias": "GL49+GL50/50A plenas",
        "cambio": "420–430 VEB/USD"
      },
      "economico": {
        "inflacion": "174% (vs 567% 2025)",
        "ingresos_pob": "69.5% < USD 300",
        "electricidad": "14.8h sin suministro",
        "pib": "10.4–15.2%"
      },
      "opinion": {
        "direccion": "75% dirección correcta",
        "elecciones": "2/3 exige elecciones",
        "mcm": "52% favorabilidad",
        "eeuu": ">90% respalda"
      }
    },
    "tensiones": [
      {
        "l": "green",
        "t": "<b>Ley de Amnistía:</b> Promulgada 19 feb."
      },
      {
        "l": "yellow",
        "t": "<b>FANB:</b> Tensiones. Demandas de oxigenación. Padrino 12 años."
      },
      {
        "l": "yellow",
        "t": "<b>Excarcelaciones:</b> 895 oficial vs 383 verif."
      },
      {
        "l": "red",
        "t": "<b>Electoral:</b> Sin fecha. 2/3 exige. EE.UU.: 9–10 meses."
      }
    ],
    "lectura": "La promulgación de la Ley de Amnistía el 19 de febrero es el hito normativo más significativo desde la operación de enero: por primera vez el marco legal reconoce formalmente a los perseguidos políticos de 26 años y establece mecanismos de extinción de acciones penales, civiles y disciplinarias. E1 alcanza su punto más alto del ciclo — 35% — porque la promulgación abre un vector de institucionalización que antes era solo retórico. Dos tercios de la población exige elecciones este año. La encuesta Atlantic Council-Gold Glove muestra que el 75% percibe el país en dirección correcta, pero con una paradoja estructural: la prioridad es la economía sobre la democracia en proporción 8:1. Las tensiones en la FANB — reportaje de El País sobre malestar por continuidad de la cúpula, Padrino López 12 años en el cargo — revelan que la estabilización tiene costos internos que aún no se procesan. España propone ante la UE levantar sanciones a Delcy, Qatar visita Caracas, el FMI señala disposición a iniciar contactos. El sector energético se confirma como ancla: EIA proyecta retorno a 1.1-1.2M bpd hacia mediados de 2026. Pero la brecha entre cifras oficiales de amnistía (895) y verificadas por ONG (383) es la expresión más concreta de que E3 y E4 coexisten: apertura selectiva y control discrecional operan simultáneamente.",
    "trendSc": 3,
    "trendDrivers": [
      "Amnistía promulgada: vector de institucionalización consolidado",
      "Sector energético como ancla: EIA proyecta 1.1-1.2M bpd",
      "Presión por cronograma electoral crece pero sin catalizar ruptura"
    ]
  },
  {
    "label": "20–27 feb",
    "short": "S7",
    "probs": [
      {
        "sc": 1,
        "v": 35,
        "t": "flat"
      },
      {
        "sc": 2,
        "v": 12,
        "t": "down"
      },
      {
        "sc": 3,
        "v": 43,
        "t": "up"
      },
      {
        "sc": 4,
        "v": 10,
        "t": "flat"
      }
    ],
    "xy": {
      "x": 0.36,
      "y": 0.48
    },
    "sem": {
      "g": 6,
      "y": 7,
      "r": 5
    },
    "kpis": {
      "energia": {
        "exportaciones": "~800 kbd · VLCC",
        "ingresos": "Proy. USD 6.000M",
        "licencias": "GL49+GL50/50A · FAQ 1238",
        "cambio": "Mdo 631 / BCV 414 Bs/$"
      },
      "economico": {
        "inflacion": "3 dígitos · FMI",
        "ingresos_pob": "Canasta 550 vs 270 USD",
        "electricidad": "Sin datos nuevos",
        "pib": "Ancla petrolera"
      },
      "opinion": {
        "direccion": "51,5% mejor s/ Maduro",
        "elecciones": "Rubio: req. elecciones",
        "mcm": "MCM +28 imagen neta",
        "eeuu": "62,4% valora EE.UU."
      }
    },
    "tensiones": [
      {
        "l": "green",
        "t": "<b>Amnistía operativa:</b> 4.203 solicitudes · Trump: \"nuevo amigo y socio\"."
      },
      {
        "l": "green",
        "t": "<b>Petróleo:</b> ~800K bpd · Vitol/Trafigura · Eni USD 3B."
      },
      {
        "l": "yellow",
        "t": "<b>Brecha cambiaria:</b> 52,6% ↑6,5pp · 47 meses sin ajuste."
      },
      {
        "l": "yellow",
        "t": "<b>Poder Ciudadano:</b> Renuncias Saab/Ruiz · plazo 30 días."
      },
      {
        "l": "red",
        "t": "<b>Electoral:</b> Rubio condiciona · Caso Magalli Meda."
      }
    ],
    "lectura": "E3 se consolida en su nivel más alto del ciclo — 50% — a través del hecho simbólico más significativo del período: Donald Trump califica a Venezuela como 'nuevo amigo y socio' en el Estado de la Unión, con Enrique Márquez presente en el hemiciclo. La coexistencia de ambas referencias condensa la lógica del doble canal que ha estructurado toda la relación bilateral desde enero. Las exportaciones se sitúan en ~800.000 bpd, Vitol y Trafigura tienen tres buques fletados para marzo, refinerías indias incrementan compras usando VLCC, y la proyección de ingresos alcanza USD 6.000 millones. La amnistía pasa de aprobada a operativa: 4.203 solicitudes procesadas, 3.231 libertades plenas en el primer corte. El Poder Ciudadano se reconfigura con renuncias de Saab y Ruiz. Colombia activa el canal diplomático con Petro-Delcy para el 14 de marzo.\n\nSin embargo, el mapa no es de consolidación lineal sino de consolidación con tensiones no resueltas. E1 baja a 30% porque no hay compromisos electorales concretos: Rubio afirma que la legitimación electoral es requisito para inversión, pero el Ejecutivo no anuncia calendario. La disputa de cifras sobre amnistía es aguda: Foro Penal registra 568 presos verificados frente a 4.151 oficiales. El caso Magalli Meda — 16 hombres armados en 6 camionetas — revela que la coerción paralela al discurso de reconciliación no ha sido desmantelada. La brecha cambiaria supera el 52.6%, el salario mínimo lleva 47 meses sin cambios, y el FMI clasifica a Venezuela en 'Intensa Fragilidad'. La coexistencia de los cuatro escenarios en tensión — y no la desaparición de los riesgos — es la característica definitoria del momento.",
    "trendSc": 3,
    "trendDrivers": [
      "Trump 'nuevo amigo y socio': acoplamiento EE.UU. sin precedentes",
      "~800K bpd + USD 6B consolidan ancla energética",
      "Amnistía operativa refuerza narrativa de reconciliación como pilar"
    ]
  },
  {
    "label": "27f–6m",
    "short": "S8",
    "probs": [
      {
        "sc": 1,
        "v": 38,
        "t": "up"
      },
      {
        "sc": 2,
        "v": 12,
        "t": "down"
      },
      {
        "sc": 3,
        "v": 40,
        "t": "flat"
      },
      {
        "sc": 4,
        "v": 10,
        "t": "flat"
      }
    ],
    "xy": {
      "x": 0.36,
      "y": 0.5
    },
    "sem": {
      "g": 8,
      "y": 6,
      "r": 4
    },
    "kpis": {
      "energia": {
        "exportaciones": "788 kbd feb. (récord 7a)",
        "ingresos": "+78% SENIAT · crudo +10%",
        "licencias": "GL49+GL50/50A+GL129A",
        "cambio": "Alza crudo · proy. USD 100"
      },
      "economico": {
        "inflacion": "174% proy. 2026",
        "ingresos_pob": "USD 256 vs canasta 550",
        "electricidad": "14,8h sin suministro",
        "pib": "+7,07% Q4 2025"
      },
      "opinion": {
        "direccion": ">50% dirección correcta",
        "elecciones": "66% exige elecciones",
        "mcm": "106,84/137 pts liderazgo",
        "eeuu": "Relaciones restablecidas"
      }
    },
    "tensiones": [
      {
        "l": "green",
        "t": "<b>Energía:</b> Exportaciones 788 kbd · récord 7 años Puerto José · SENIAT +78%."
      },
      {
        "l": "green",
        "t": "<b>Diplomacia:</b> Relaciones EE.UU.–VEN restablecidas. Trump: \"escenario perfecto\"."
      },
      {
        "l": "green",
        "t": "<b>Amnistía:</b> 9.060 solicitudes · 5.628 libertades plenas · 31 militares."
      },
      {
        "l": "yellow",
        "t": "<b>E1 a 2pp de E3:</b> MCM retorno inminente · 66% exige elecciones · H.R. 7674."
      },
      {
        "l": "yellow",
        "t": "<b>Brecha social:</b> Salario USD 256 vs canasta USD 550 · >47 meses sin ajuste."
      },
      {
        "l": "red",
        "t": "<b>Electoral:</b> Sin fecha. 568 presos. >11.000 cautelares vigentes."
      }
    ],
    "lectura": "E3 se mantiene como escenario dominante al 40%, pero la distancia con E1 (38%) se reduce a apenas 2 puntos porcentuales — la más estrecha desde el inicio del período de análisis. Tres anclas simultáneas sostienen E3: la expansión energética récord (Venezuela duplica exportaciones a 788.000 bpd, acercándose al nivel más alto en el Puerto de José en siete años), el PIB creció 7,07% en Q4 2025 y la recaudación SENIAT se incrementó un 78% en febrero. El marco regulatorio OFAC consolidado (GL49, GL50/50A, GL129A, Monómeros renovada hasta 2028) crea seguridad jurídica para Exxon, Shell, Gold Reserve y Ecopetrol. Washington sigue priorizando la recuperación energética sobre la agenda electoral.\n\nSin embargo, E1 sube a 38% (+3pp) impulsado por el retorno inminente de MCM con agenda de tres prioridades, su liderazgo consolidado (106,84/137 puntos en el Índice MassBehaviorResearch), el respaldo de Ramos Allup, y la exigencia electoral del 66% de la población. El proyecto H.R. 7674 en el Congreso EE.UU. demanda una estrategia de transición en 180 días. La apertura minera (Gold Reserve, Ecopetrol) amplía el marco de reformas. E2 baja a 12% (-3pp) por la solidez del repunte energético y el PIB confirmado. E4 se mantiene latente en 10%. La brecha entre el pragmatismo transaccional de EE.UU. y las expectativas electorales internas es la tensión estructural del período.",
    "trendSc": 1,
    "trendDrivers": [
      "MCM lidera con 106,84/137 pts; retorno inminente con agenda estructurada",
      "66% exige elecciones; H.R. 7674 en Congreso EE.UU.",
      "Apertura minera + Gold Reserve + Ecopetrol: señal de reformas ampliadas"
    ]
  },
  {
    "label": "6–13m",
    "short": "S9",
    "probs": [
      {
        "sc": 1,
        "v": 33,
        "t": "down"
      },
      {
        "sc": 2,
        "v": 10,
        "t": "down"
      },
      {
        "sc": 3,
        "v": 42,
        "t": "up"
      },
      {
        "sc": 4,
        "v": 15,
        "t": "up"
      }
    ],
    "xy": {
      "x": 0.38,
      "y": 0.46
    },
    "sem": {
      "g": 9,
      "y": 5,
      "r": 5
    },
    "kpis": {
      "energia": {
        "exportaciones": "1.021 kbd feb. (+10,5%)",
        "ingresos": "GL-51 oro · USD 100M 1er cargamento",
        "licencias": "GL49+GL50/50A+GL51",
        "cambio": "Merey USD 52,31/bbl (+9,10)"
      },
      "economico": {
        "inflacion": "617% anualizada (BCV)",
        "ingresos_pob": "USD 300 vs canasta 425–622",
        "electricidad": "Sin datos nuevos",
        "pib": "Proy. dos dígitos 2026"
      },
      "opinion": {
        "direccion": "Reconocimiento EE.UU. a Rodríguez",
        "elecciones": "Washington señala 2027",
        "mcm": "Trump aconseja no regresar",
        "eeuu": "\"Nuevo socio energético\""
      }
    },
    "tensiones": [
      {
        "l": "green",
        "t": "<b>Energía:</b> Producción supera 1M bpd por primera vez. Chevron, Shell, Repsol amplían inversiones >EUR 1.000M."
      },
      {
        "l": "green",
        "t": "<b>Diplomacia:</b> Trump reconoce formalmente a Rodríguez como «único interlocutor legítimo». GL-51 oro operativa."
      },
      {
        "l": "green",
        "t": "<b>Minería:</b> Primer cargamento oro USD 100M a EE.UU. Decreto 5.266 absorción Minerven. Ley de Minas primera discusión."
      },
      {
        "l": "yellow",
        "t": "<b>Conflictividad laboral:</b> 39 movilizaciones en 23 estados el 12/03. Mayor jornada del año. Superaron piquetes PNB."
      },
      {
        "l": "yellow",
        "t": "<b>Inflación:</b> BCV publica 51,9% acumulado ene-feb (617% anualizada). 70% población <USD 300 vs canasta USD 425-622."
      },
      {
        "l": "red",
        "t": "<b>DDHH:</b> 508 presos políticos (Foro Penal). ONU: 87 nuevas detenciones post-3 enero, 14 periodistas."
      }
    ],
    "lectura": "E3 se consolida como escenario dominante al 42% (+2pp), impulsado por el reconocimiento formal de EE.UU. al gobierno de Rodríguez como «único interlocutor legítimo» — el hecho de mayor impacto estructural de la semana y de todo el período post-3 de enero. La producción petrolera superó por primera vez el millón de barriles diarios (1.021.000 bpd en febrero, +10,5%), la GL-51 habilitó el oro venezolano, y el primer cargamento aurífero de USD 100M fue entregado a EE.UU. Chevron, Shell y Repsol consolidan inversiones sin precedentes.\n\nE1 retrocede a 33% (-5pp): Washington priorizó estabilidad sobre transición acelerada. Trump aconsejó a MCM no regresar y señaló elecciones hacia 2027, reduciendo su margen de acción. E4 sube a 15% (+5pp) por la escalada laboral del 12 de marzo — 39 movilizaciones en 23 estados, la mayor jornada del año — y las tensiones en designaciones del Poder Ciudadano. E2 baja a 10% (-2pp), contenido por la solidez del acuerdo bilateral.\n\nEl equilibrio es funcional pero frágil: depende de que la redistribución del boom energético comience a materializarse antes de que la conflictividad laboral supere el umbral político. La inflación anualizada del 617% (BCV oficial) confirma que la estabilización macroeconómica no se ha consolidado.",
    "trendSc": 3,
    "trendDrivers": [
      "Reconocimiento formal EE.UU. a Rodríguez: «único interlocutor legítimo»",
      "Producción supera 1M bpd + GL-51 oro + USD 100M primer cargamento",
      "39 movilizaciones laborales en 23 estados: mayor jornada del año"
    ]
  },
  {
    "label": "13–20m",
    "short": "S10",
    "probs": [
      {
        "sc": 1,
        "v": 30,
        "t": "down"
      },
      {
        "sc": 2,
        "v": 8,
        "t": "down"
      },
      {
        "sc": 3,
        "v": 47,
        "t": "up"
      },
      {
        "sc": 4,
        "v": 15,
        "t": "flat"
      }
    ],
    "xy": {
      "x": 0.36,
      "y": 0.44
    },
    "sem": {
      "g": 10,
      "y": 5,
      "r": 4
    },
    "kpis": {
      "energia": {
        "exportaciones": "Export. a EE.UU. duplicadas",
        "ingresos": "Cardón IV · LG-52 · Repsol +50%",
        "licencias": "GL46B+48A+49A+51+52",
        "cambio": "Ingresos PDVSA −46% 1er bim."
      },
      "economico": {
        "inflacion": "197% proy. 2026",
        "ingresos_pob": "Bono 150 USD + 300M Fondo",
        "electricidad": "Sin datos nuevos",
        "pib": "+6,9% proy. 2026"
      },
      "opinion": {
        "direccion": "71% salida «a cualquier costo»",
        "elecciones": "Washington: 2027",
        "mcm": "MCM en CERAWeek Houston",
        "eeuu": "Trump: «fantástica»"
      }
    },
    "tensiones": [
      {
        "l": "green",
        "t": "<b>Gabinete:</b> 42% modificado · nueva cúpula FANB · Padrino López sale tras 11+ años."
      },
      {
        "l": "green",
        "t": "<b>Diplomacia:</b> Bandera EE.UU. izada (7 años) · Senado en Miraflores · alerta nivel 3."
      },
      {
        "l": "green",
        "t": "<b>Energía:</b> Cardón IV (gas) · LG-52 · export. duplicadas · Repsol +50%/+200% · Maurel & Prom Maracaibo."
      },
      {
        "l": "yellow",
        "t": "<b>Contención social:</b> Bono 150 USD + 300M Fondo. Protestas 65→46. Efecto temporal."
      },
      {
        "l": "yellow",
        "t": "<b>Amnistía:</b> 7.580 beneficiados · 690 excarcelados (FP) · 515 presos · art.9 exclusiones."
      },
      {
        "l": "red",
        "t": "<b>Jurídico:</b> Jueza Netburn · PDV Holding/Citgo sin efecto sin OFAC · gasoducto Ricaurte."
      }
    ],
    "lectura": "E3 se consolida como escenario dominante con fuerza inédita — 47% (+5pp) — impulsado por la convergencia de cuatro factores de primer orden. La reconfiguración institucional más amplia desde el 3 de enero: 11 cambios ministeriales y nueva cúpula FANB, con la salida de Padrino López tras más de 11 años en Defensa y su reemplazo por González López, quien centraliza el aparato de seguridad. Con 14 ministros cambiados, Delcy Rodríguez ha modificado el 42% del gabinete heredado de Maduro. La incorporación de opositores (Ríos, Blanco) y técnicos (Sanjuán, Alcalá) amplía la base de gobernabilidad.\n\nLa normalización diplomática entró en fase operativa: el izado de bandera en Caracas (primera vez en 7 años), la delegación del Senado en Miraflores, la reducción de alerta de viaje a nivel 3, y Trump calificando la relación como «fantástica». La expansión energética se diversifica: acuerdo gasífero Cardón IV (PDVSA-Repsol-Eni), LG-52 para transacciones con PDVSA, exportaciones a EE.UU. duplicadas, Repsol proyecta +50% en 2026 y +200% para 2028, Maurel & Prom reactiva taladro en Maracaibo tras 8 años.\n\nE1 retrocede a 30% (-3pp): la incorporación de opositores al Ejecutivo y la ausencia de retorno de MCM difuminan las fronteras entre oficialismo y oposición. E4 se mantiene estable en 15%: las protestas bajan de 65 a 46 por el bono de 150 USD y los 300M al Fondo de Protección Social, pero la brecha salarial estructural persiste. E2 baja a 8% (-2pp), contenido por la solidez creciente del eje bilateral. Sin embargo, la ambigüedad jurídica sobre representación legal (jueza Netburn) y las disputas PDV Holding/Citgo que carecen de efecto sin OFAC evidencian que la normalización política avanza más rápido que la normalización legal y corporativa.",
    "trendSc": 3,
    "trendDrivers": [
      "42% gabinete modificado + nueva cúpula FANB: reconfiguración institucional sin precedentes",
      "Bandera EE.UU. + Senado + nivel 3 + «fantástica»: normalización diplomática operativa",
      "Cardón IV + LG-52 + export. duplicadas + Repsol/Maurel & Prom: diversificación energética"
    ]
  },
  {
    "label": "20–29m",
    "short": "S11",
    "probs": [
      {
        "sc": 1,
        "v": 30,
        "t": "flat"
      },
      {
        "sc": 2,
        "v": 7,
        "t": "down"
      },
      {
        "sc": 3,
        "v": 43,
        "t": "down"
      },
      {
        "sc": 4,
        "v": 20,
        "t": "up"
      }
    ],
    "xy": {
      "x": 0.35,
      "y": 0.42
    },
    "sem": {
      "g": 8,
      "y": 6,
      "r": 5
    },
    "kpis": {
      "energia": {
        "exportaciones": "Repsol x3 meta 2029 (150K b/d)",
        "ingresos": "FII Priority · Signum · incentivos",
        "licencias": "GL-53 + OFAC minero",
        "cambio": "Exp. pet. $18.212M (BCV 2025)"
      },
      "economico": {
        "inflacion": ">600% interanual",
        "ingresos_pob": "97 protestas 4 días · brecha salarial",
        "electricidad": "Siemens/GE evalúan · CAF reactiva",
        "pib": "19 trim. crecimiento consecutivo"
      },
      "opinion": {
        "direccion": "58% país más democrático (AtlasIntel)",
        "elecciones": "180 días Congreso → plan Rubio",
        "mcm": "MCM CERAWeek: 5M b/d · $150B inv.",
        "eeuu": "Trump: «presidenta electa»"
      }
    },
    "tensiones": [
      {
        "l": "green",
        "t": "<b>Ofensiva económica:</b> FII Priority Miami · Signum Caracas · CERAWeek Houston · Repsol x3 · Petropymi-Alep Texas."
      },
      {
        "l": "green",
        "t": "<b>Normalización bilateral:</b> Misión diplomática Washington · sedes consulares · LG-53 · Trump «presidenta electa» · Comando Sur confirma."
      },
      {
        "l": "green",
        "t": "<b>Apertura sectorial:</b> OFAC licencias mineras · Siemens/GE evalúan eléctrico · CAF financiamiento · Cardón IV gas."
      },
      {
        "l": "yellow",
        "t": "<b>Conflictividad:</b> 97 protestas 23–26 mar en 22+ estados · pico 41 (25 mar) · eje laboral-salarial dominante."
      },
      {
        "l": "yellow",
        "t": "<b>Encuestas contradictorias:</b> Hinterlaces 73% vs AtlasIntel 34,6% aprobación DR · MassBehavior: DR 32/33 (9,12 pts)."
      },
      {
        "l": "red",
        "t": "<b>Caso Maduro:</b> Audiencia 26 mar · rechazo desestimación · cargos adicionales · financiamiento defensa sin resolver."
      },
      {
        "l": "red",
        "t": "<b>Amenazas MCM:</b> Colectivos: «detención por traición» · 5.000 combatientes. 515 presos + 179 militares."
      }
    ],
    "lectura": "E3 se mantiene como escenario dominante pero cede 4pp (47%→43%), erosionado por el escalamiento de la conflictividad social (97 protestas en 4 días, 22+ estados, pico de 41 el 25 de marzo) y el control de EE.UU. sobre los ingresos petroleros (Rubio/Tesoro), que limita el margen fiscal del Ejecutivo. La doble ofensiva económica — Rodríguez en FII Priority Miami con incentivos fiscales directos y MCM en CERAWeek Houston ante petroleras (meta 5M b/d, $150B inversión, nueva ley petrolera) — marca el tránsito de la estabilización a la ofensiva internacional para captar inversión. Signum Global Advisors reunió a decenas de fondos de cobertura en Caracas. Repsol proyecta triplicar producción para 2029. La apertura sectorial se amplía: OFAC emite licencias para minería, Siemens y GE evalúan el sistema eléctrico del Bajo Caroní, la CAF reactiva financiamiento para termoeléctricas y renovables, y se firma el primer acuerdo empresarial Texas-Venezuela (Petropymi-Alep).\n\nLa normalización bilateral alcanza su punto más avanzado: misión diplomática en Washington, recuperación de sedes consulares, LG-53 para misiones diplomáticas, Trump califica a Rodríguez de «presidenta electa», y el Comando Sur confirma cumplimiento de directrices. Sin embargo, ConocoPhillips califica las reformas de «lamentablemente inadecuadas» y Chevron demanda legislación adicional.\n\nE4 sube de 15% a 20% (+5pp), impulsado por la reactivación de la conflictividad laboral, las amenazas de colectivos contra MCM, la persistencia del esquema coercitivo (515 presos, 179 militares denunciados por MCM) y los apagones en el occidente (Táchira al 8,70%). E1 se mantiene en 30%: MCM lidera MassBehaviorResearch (123,68 pts), Guanipa segundo (119,80), Vente reabre sede. El Congreso da 180 días a Rubio para plan de transición. E2 baja a 7% (-1pp), contenido por solidez bilateral. La paradoja central: MCM (123,68) carece de poder institucional; DR (9,12) detenta la Presidencia pero ocupa posición 32/33 en apoyo popular.",
    "trendSc": 3,
    "trendDrivers": [
      "Ofensiva económica multisectorial: FII Priority + Signum + CERAWeek + Petropymi-Alep + OFAC minero",
      "Normalización bilateral máxima: misión Washington + sedes + LG-53 + «presidenta electa»",
      "97 protestas en 4 días (22+ estados): conflictividad social supera mecanismos de contención"
    ]
  },
  {
    "label": "29m–6a",
    "short": "S12",
    "probs": [
      {
        "sc": 1,
        "v": 32,
        "t": "up"
      },
      {
        "sc": 2,
        "v": 6,
        "t": "down"
      },
      {
        "sc": 3,
        "v": 45,
        "t": "up"
      },
      {
        "sc": 4,
        "v": 17,
        "t": "down"
      }
    ],
    "xy": {
      "x": 0.34,
      "y": 0.44
    },
    "sem": {
      "g": 9,
      "y": 5,
      "r": 5
    },
    "kpis": {
      "energia": {
        "exportaciones": ">1,09M bpd marzo (máx. 6 meses)",
        "ingresos": "USD 2.398M causados marzo",
        "licencias": "Sanciones DR levantadas · Citgo en disputa",
        "cambio": "Brent 102 · WTI 90,8 · Merey 73,3"
      },
      "economico": {
        "inflacion": ">600% interanual",
        "ingresos_pob": "Salario <1 USD · 4 años congelado",
        "electricidad": "CAF reactiva plan 7 años",
        "pib": "SENIAT Q1 USD 3.512M (+26,6%)"
      },
      "opinion": {
        "direccion": "Rubio: estabilización «lograda»",
        "elecciones": "90 días cumplidos · debate interinato",
        "mcm": "Machado-Rubio en Dept. Estado",
        "eeuu": "Trump: «empresa conjunta» energética"
      }
    },
    "tensiones": [
      {
        "l": "green",
        "t": "<b>Sanciones:</b> OFAC retira a Rodríguez de lista de bloqueados · desbloquea activos · cooperación directa."
      },
      {
        "l": "green",
        "t": "<b>Embajada:</b> Reapertura formal EE.UU. en Caracas · Laura F. Dogu · SOUTHCOM: «hito histórico»."
      },
      {
        "l": "green",
        "t": "<b>Energía:</b> Exportaciones >1,09M bpd · USD 2.398M ingresos · Shell negocia Loran (~20 Tcf) · vuelos reanudados."
      },
      {
        "l": "yellow",
        "t": "<b>90 días:</b> Vencimiento «ausencia forzosa» · debate falta temporal vs. absoluta · prórroga AN escenario base."
      },
      {
        "l": "yellow",
        "t": "<b>Brecha cambiaria:</b> Convergencia USDT-banca ~10% · pero ~30% vs. oficial · mercado segmentado."
      },
      {
        "l": "red",
        "t": "<b>Conflictividad:</b> 11 protestas en 4 días · 9 estados · marcha a Miraflores 9 abril · salario <1 USD."
      },
      {
        "l": "red",
        "t": "<b>Irán:</b> Embajador iraní con colectivos en 23 de Enero · tensión con normalización Washington."
      }
    ],
    "lectura": "E3 se fortalece a 45% (+2pp) por la convergencia de tres factores decisivos: el levantamiento de sanciones a Delcy Rodríguez por la OFAC, que la valida como interlocutora plena; Trump calificando la relación como «empresa conjunta» energética; y la reapertura formal de la embajada en Caracas. Rubio declara estabilización «lograda en gran medida». Exportaciones >1,09M bpd, Shell negocia Loran (~20 Tcf), 10+ aerolíneas previstas.\\n\\nEl vencimiento de los 90 días de «ausencia forzosa» introduce presión institucional sin precedente. E1 sube a 32% (+2pp) por reunión Machado-Rubio y reloj constitucional. E4 baja a 17% (-3pp) sin señales coercitivas directas, pero marcha 9 abril y embajador iraní con colectivos mantienen riesgo. E2 se contrae a 6% (-1pp), aunque Q1 cierra con -14,2% y detención Ruperti señala inestabilidad.",
    "trendSc": 3,
    "trendDrivers": [
      "OFAC levanta sanciones a Rodríguez + Trump «empresa conjunta»: cooperación bilateral operativa",
      "Reapertura embajada Caracas + Rubio «estabilización lograda» + Shell Loran: normalización institucionalizada",
      "90 días constitucionales cumplidos: debate interinato como primer test institucional de la transición"
    ]
  },
  {
    "label": "3–10 abr",
    "short": "S13",
    "probs": [
      {
        "sc": 1,
        "v": 32,
        "t": "flat"
      },
      {
        "sc": 2,
        "v": 6,
        "t": "flat"
      },
      {
        "sc": 3,
        "v": 47,
        "t": "up"
      },
      {
        "sc": 4,
        "v": 15,
        "t": "down"
      }
    ],
    "xy": {
      "x": 0.09,
      "y": 0.43
    },
    "sem": {
      "g": 9,
      "y": 4,
      "r": 6
    },
    "kpis": {
      "energia": {
        "exportaciones": "1,09M bpd marzo (récord 6 meses)",
        "ingresos": "USD 2.398M causados",
        "licencias": "BCV sanciones bajo evaluación EE.UU.",
        "cambio": "Brent ~102 · Q1 -14,2% acum."
      },
      "economico": {
        "inflacion": "13,1% mensual · 649,5% anual (BCV)",
        "ingresos_pob": "Salario <1 USD · 4 años congelado",
        "electricidad": "Refinación PDVSA al 31%",
        "pib": "PIB 2025 = 35,7% del nivel 2012"
      },
      "opinion": {
        "direccion": "Aprobación Rodríguez 34,6% (AtlasIntel)",
        "elecciones": "MCM 68,9% intención voto (Meganálisis)",
        "mcm": "Madrid 18 abr · retorno planificado",
        "eeuu": "83,8% rechaza elogios Trump a Rodríguez"
      }
    },
    "tensiones": [
      {
        "l": "red",
        "t": "<b>9 de abril — 72 protestas:</b> Escalada laboral histórica. PNB con gas pimienta, 10 periodistas agredidos, detención PJ."
      },
      {
        "l": "red",
        "t": "<b>Vacío constitucional:</b> 90 días cumplidos. Prórroga formal ante AN necesaria antes de julio."
      },
      {
        "l": "yellow",
        "t": "<b>FMI consulta miembros:</b> Primer movimiento en dos décadas. Bonos cerca de 48 ctvs/USD. BCV evaluado."
      },
      {
        "l": "yellow",
        "t": "<b>Anuncio salarial 1° mayo:</b> Sin monto ni mecanismo de indexación. Inflación 649,5% puede absorberlo."
      },
      {
        "l": "green",
        "t": "<b>Poder Ciudadano renovado:</b> Devoe (Fiscal, 275 votos) + González Lobato (Defensora). Control institucional completo."
      },
      {
        "l": "green",
        "t": "<b>Reinserción financiera:</b> Bonos +, COP+XOM evalúan retorno, Shell Loran primer gas 2027."
      }
    ],
    "lectura": "La semana del 3 al 10 de abril consolida E3 como escenario dominante con 47% (+2pp), impulsada por la convergencia de dos avances institucionales: la designación del Fiscal General Larry Devoe (275 votos) y la Defensora del Pueblo Eglée González Lobato, que completan el control del Poder Ciudadano; y las señales más claras de reinserción financiera del período — la consulta formal del FMI entre sus miembros y la evaluación por Washington del levantamiento de sanciones al BCV, que podría desbloquear hasta un 40% adicional en producción petrolera. El hecho estructurante es la jornada del 9 de abril: 72 protestas en 4 días, escalada de 3 a 15 estados, represión con gas pimienta, agresión a 10 periodistas del SNTP y primera detención política del período (Ort Betancourt Villamizar, PJ). El anuncio de aumento salarial para el 1° de mayo sin montos ni indexación frente a 649,5% de inflación anual enfrenta el riesgo de ser absorbido de inmediato. E1 se mantiene en 32% sostenido por la presión social y la hoja de ruta opositora del 12 de abril. E4 baja a 15% por ausencia de escalada coercitiva sistémica, aunque el vector iraní-colectivos y la movilización del 16 de abril mantienen el riesgo latente. La paradoja del período: ConocoPhillips y ExxonMobil envían equipos de evaluación por primera vez desde 2007 mientras los modelos de contratos siguen sin publicarse y la refinación cae al 31%.",
    "trendSc": 3,
    "trendDrivers": [
      "Poder Ciudadano completo bajo Rodríguez + FMI consulta formal + evaluación sanciones BCV: reinserción financiera avanza",
      "Conflictividad laboral 9-abr (72 protestas, 15 estados) erosiona narrativa estabilización pero no desplaza E3",
      "Hoja de ruta PUD 12-abr + retorno planificado Machado mantiene E1 en 32% como presión de transición activa"
    ]
  },
  {
    "label": "10–17 abr",
    "short": "S14",
    "probs": [
      {
        "sc": 1,
        "v": 35,
        "t": "up"
      },
      {
        "sc": 2,
        "v": 5,
        "t": "down"
      },
      {
        "sc": 3,
        "v": 47,
        "t": "flat"
      },
      {
        "sc": 4,
        "v": 13,
        "t": "down"
      }
    ],
    "xy": {
      "x": 0.08,
      "y": 0.44
    },
    "sem": {
      "g": 10,
      "y": 4,
      "r": 5
    },
    "kpis": {
      "energia": {
        "exportaciones": "1,09M bpd mar (ofic.) · 988 kbd OPEP sec.",
        "ingresos": "150M bbl desde ene · Merey USD 85,92/b",
        "licencias": "GL-56 + GL-57 OFAC emitidas",
        "cambio": "570,75 Bs/USD ofic. · ~636 par · brecha ~30%"
      },
      "economico": {
        "inflacion": "13,1% mensual (BCV) · 649,5% anual",
        "ingresos_pob": "Salario <1 USD · aumento 1° mayo sin monto",
        "electricidad": "Sin datos nuevos · fallas refinación",
        "pib": "BCV publica balanza pagos: sup. cta. corriente USD 3.336M"
      },
      "opinion": {
        "direccion": "83,8% rechaza elogios Trump a Rodríguez (Meganálisis)",
        "elecciones": "EE.UU. Fase 2: CNE + KPMG + retorno libre MCM",
        "mcm": "MCM en Elíseo con Macron (13 abr) · retorno inminente",
        "eeuu": "GL-56/57 + Kozak: Fase 1 cumplida → Fase 2"
      }
    },
    "tensiones": [
      {
        "l": "green",
        "t": "<b>FMI + BM reanudan relaciones (16 abr):</b> Mayor avance de reinserción multilateral en más de dos décadas. DEG ~USD 5.000M potenciales."
      },
      {
        "l": "green",
        "t": "<b>GL-56 y GL-57 OFAC:</b> Apertura financiera condicionada. GL-57 habilita BCV y banca pública. Conindustria: 'puente hacia normalización'."
      },
      {
        "l": "green",
        "t": "<b>Haustveit Caracas + Chevron–PDVSA:</b> Primer Depto. Energía EE.UU. 150M bbl desde enero. Petroindependencia 49% + Ayacucho 8."
      },
      {
        "l": "yellow",
        "t": "<b>Kozak: Fase 1 cumplida → Fase 2:</b> Condiciones electorales explícitas: CNE, auditorías KPMG, retorno libre MCM. Wright: elecciones no son prioridad inmediata."
      },
      {
        "l": "yellow",
        "t": "<b>MCM en Elíseo + retorno inminente:</b> Macron (13 abr) + PM Países Bajos La Haya (15 abr). Test de garantías del acuerdo bilateral."
      },
      {
        "l": "red",
        "t": "<b>81% indicadores transición en rojo:</b> 100 días gestión Rodríguez. Más de 400 presos políticos. Debate 180 días sin resolver. FARA: candidatura 2027 en paralelo."
      },
      {
        "l": "red",
        "t": "<b>47 protestas OVCS (10–16 abr):</b> 15 estados. Politización creciente. Crisis sanitaria: fiebre amarilla (55,3% letalidad) + 25.000 casos malaria."
      }
    ],
    "lectura": "La semana del 10 al 17 de abril marca el punto de mayor avance en la reinserción internacional de Venezuela en más de dos décadas: la reanudación simultánea de relaciones con el FMI y el Banco Mundial, la emisión de las licencias GL-56 y GL-57, la primera visita oficial del Departamento de Energía de EE.UU. a Caracas y la declaración de la Fase 1 cumplida por Kozak configuran una acumulación sin precedente. E3 se sostiene en 47% (=0pp) absorbiendo estos eventos como confirmación del escenario de continuidad negociada. E1 sube a 35% (+3pp) impulsado por la tracción internacional de MCM — recibida por Macron en el Elíseo, con reunión en La Haya — y por las condiciones electorales explícitas que fija EE.UU. en la Fase 2. Esta subida no desplaza a E3 porque Washington no prioriza elecciones inmediatas (Chris Wright) y el CNE no muestra movimientos concretos. E4 baja a 13% (−2pp): la movilización del 16 de abril fue absorbida sin represión mayor y la detención de Paparoni fue breve y sin cargos. E2 cede a 5% (−1pp) por la solidez del eje multilateral recién activado. La tensión estructural persiste: apertura económica bajo vigilancia internacional coexiste con sistema político cerrado — 81% indicadores de transición en rojo, más de 400 presos políticos, debate constitucional de 180 días sin resolver, registro FARA de Rodríguez confirma candidatura 2027 avanzando en paralelo.",
    "trendSc": 3,
    "trendDrivers": [
      "FMI + BM reanudan relaciones + GL-56/57 + Haustveit Caracas: mayor acumulación de señales de reinserción internacional del proceso",
      "MCM en Elíseo + condiciones Fase 2 EE.UU. (CNE, KPMG, retorno MCM): E1 sube a 35% como presión de transición activa",
      "81% indicadores transición en rojo + vacío constitucional 180 días + candidatura FARA Rodríguez: sistema político permanece cerrado"
    ]
  },
  {
    "label": "17–24 abr",
    "short": "S15",
    "probs": [
      {
        "sc": 1,
        "v": 38,
        "t": "up"
      },
      {
        "sc": 2,
        "v": 4,
        "t": "down"
      },
      {
        "sc": 3,
        "v": 46,
        "t": "down"
      },
      {
        "sc": 4,
        "v": 12,
        "t": "down"
      }
    ],
    "xy": {
      "x": 0.07,
      "y": 0.44
    },
    "sem": {
      "g": 9,
      "y": 5,
      "r": 4
    },
    "kpis": {
      "energia": {
        "exportaciones": "1,1M bpd · meta 1,37M dic 2026",
        "ingresos": "USD 3.000M fondo bajo EE.UU. · KPMG",
        "licencias": "GL-56/57 + GL-55 minería",
        "cambio": "Halliburton evalúa retorno · Brent ~100"
      },
      "economico": {
        "inflacion": "~650% anualizada · FMI: camino «muy difícil»",
        "ingresos_pob": "Salario <1 USD · 1° mayo sin montos ni indexación",
        "electricidad": "Siemens/GE conversan Zulia · CAF activa",
        "pib": "7,4% proy. 2026 (PNUD) · base 35,7% nivel 2012"
      },
      "opinion": {
        "direccion": "Brecha E3-E1 de 8pp — la más estrecha del ciclo",
        "elecciones": "MCM: 40 sem. · Cabello: «cuando sean» · Petro: cogob.",
        "mcm": "«Hoy comienza el regreso a casa» Puerta del Sol",
        "eeuu": "Barrett Fase 2 + Kozak-Figuera + Rubio negocia BCV"
      }
    },
    "tensiones": [
      {
        "l": "green",
        "t": "<b>FMI + BM + BID:</b> 3 multilaterales reanudan vínculos simultáneamente — mayor consolidación multilateral del período."
      },
      {
        "l": "green",
        "t": "<b>Barrett llega (23 abr):</b> Nuevo encargado EE.UU. confirma Fase 2 — mensaje centrado en resultados concretos."
      },
      {
        "l": "green",
        "t": "<b>Reconfiguración institucional:</b> Ley de Minas G.O. 7.020 + Comisión Activos Públicos + Comisión TSJ + 100 días gestión."
      },
      {
        "l": "yellow",
        "t": "<b>Gran Peregrinación 19 abr – 1° mayo:</b> Legitimación interna del interinato. 1° mayo como test de colisión de agendas."
      },
      {
        "l": "yellow",
        "t": "<b>MCM: «hoy comienza el regreso a casa»:</b> Puerta del Sol — retorno inminente como próximo test real del acuerdo bilateral."
      },
      {
        "l": "red",
        "t": "<b>46 protestas · motín Yare III:</b> Pico 27 (22 abr) paro universitario · 5 fallecidos · 473 presos políticos (Foro Penal)."
      }
    ],
    "lectura": "E3 cede 1pp a 46% sin perder su posición dominante, en una semana de consolidación institucional y diplomática que profundiza la arquitectura de continuidad negociada. La llegada de John Barrett confirma la continuidad estratégica de la Fase 2; los tres organismos multilaterales —FMI, Banco Mundial y BID— reanudan vínculos de forma simultánea; y la batería de reformas institucionales (Ley de Minas G.O. 7.020, Comisión de Activos Públicos, Comisión Preliminar del TSJ) consolida la arquitectura del interinato con apertura selectiva al capital privado. La propuesta de cogobernanza de Petro refuerza la lógica de transición gestionada. E1 sube 3pp a 38% —brecha más estrecha del período— impulsado por el anuncio de retorno de MCM desde la Puerta del Sol, la reunión con el primer ministro de Portugal y la propuesta de acuerdo nacional con rutas simultáneas. E4 baja 1pp a 12% por ausencia de escalada coercitiva sistémica. E2 cede a 4% por la solidez del entramado multilateral. El 1° de mayo y el retorno inminente de MCM son los dos test más críticos del proceso.",
    "trendSc": 3,
    "trendDrivers": [
      "FMI + BM + BID simultáneos + Barrett Fase 2: mayor acumulación multilateral del período",
      "Brecha E3-E1 de 8pp — mínima del ciclo: MCM anuncia regreso desde Puerta del Sol",
      "1° mayo: convergencia Gran Peregrinación + movilización laboral — próximo test decisivo del acuerdo de estabilización"
    ]
  },
  {
    "label": "24 abr–1 may",
    "short": "S16",
    "probs": [
      {
        "sc": 1,
        "v": 35,
        "t": "down"
      },
      {
        "sc": 2,
        "v": 4,
        "t": "flat"
      },
      {
        "sc": 3,
        "v": 50,
        "t": "up"
      },
      {
        "sc": 4,
        "v": 11,
        "t": "down"
      }
    ],
    "xy": {
      "x": 0.05,
      "y": 0.46
    },
    "sem": {
      "g": 11,
      "y": 4,
      "r": 3
    },
    "kpis": {
      "energia": {
        "exportaciones": "499k bpd a EE.UU. · 26,3M bbl acum.",
        "ingresos": "Shell Monagas · Eni Junín 5 · BP Deltana · Repsol x3",
        "licencias": "MOU Casa Blanca: petróleo, gas, oro, aluminio, carbón",
        "cambio": "BCV ~570 Bs/USD · USDT ~630 · brecha ofic. ~29%"
      },
      "economico": {
        "inflacion": "FMI 4% · CEPAL 6,5% · PNUD 7,4% proy. 2026",
        "ingresos_pob": "$240 ingreso mínimo (bonos) · base Bs 130 (~$0,27)",
        "electricidad": "BCV 20 trim. crecimiento · auditorías paralelas EE.UU.-Vzla",
        "pib": "Reservas ~USD 13.600M · 5.000M DEG FMI"
      },
      "opinion": {
        "direccion": "AtlasIntel: 31,4% aprueba DR · 47,1% desaprueba",
        "elecciones": "Polymarket: 45% elecciones 2026 · MCM candidatura confirmada",
        "mcm": "Meganálisis: MCM 71,25% intención voto · 84,36% vs. DR",
        "eeuu": "OEA reconoce a Rodríguez como interlocutora operativa"
      }
    },
    "tensiones": [
      {
        "l": "green",
        "t": "<b>Delegación Casa Blanca:</b> Jarrod Agen + vuelo AA directo Miami-Caracas + MOU petróleo, gas, oro, aluminio y carbón."
      },
      {
        "l": "green",
        "t": "<b>Acuerdos energéticos:</b> Shell Monagas · Eni Junín 5 · BP Deltana · Repsol CEO: producción x3."
      },
      {
        "l": "green",
        "t": "<b>Diplomacia activa:</b> Rodríguez-Petro USD 1.200M · Barbados · Iberoamericana · Zambrano-España."
      },
      {
        "l": "yellow",
        "t": "<b>$240 sin reforma salarial:</b> Base Bs 130 (~$0,27) · bloqueo marchas laborales Caracas (30 abr)."
      },
      {
        "l": "yellow",
        "t": "<b>TSJ jubila 8 magistrados:</b> Moreno + 7 más · 227 sentencias 1 semana · postulaciones bajo AN interinato."
      },
      {
        "l": "red",
        "t": "<b>Conflictividad laboral:</b> 33 protestas 24–29 abr · 9 estados · politización creciente."
      },
      {
        "l": "red",
        "t": "<b>Eurocámara 507–31:</b> Sanciones condicionadas a avances democráticos — contraste con normalización EE.UU."
      }
    ],
    "lectura": "E3 sube 4pp a 50% —el nivel más alto desde el inicio del período post-Maduro— sobre la base de la semana de mayor densidad bilateral y energética del ciclo. Delegación de la Casa Blanca en el primer vuelo directo de AA en 7 años, MOU en petróleo/gas/minerales, Shell instalada en Monagas, Eni firmando Junín 5, BP con Plataforma Deltana y Repsol anunciando triplicar producción configuran la masa crítica de compromisos más significativa del proceso. La jubilación extraoficial de 8 magistrados del TSJ —incluido Maikel Moreno— precedida de 227 sentencias en una semana completa la reconfiguración del Poder Judicial bajo control del interinato. E1 cede 3pp a 35% pese a la confirmación de candidatura de MCM y 1,5M inscritos en el RE: la dinámica de 'normalización sin transición' (Americas Quarterly) absorbe el espacio político sin condicionamientos verificables. La brecha E3-E1 se amplía a 15pp, la mayor del ciclo. E4 baja 1pp a 11%; E2 se mantiene en 4% contenido por el compromiso bilateral más robusto del período.",
    "trendSc": 3,
    "trendDrivers": [
      "Delegación Casa Blanca + vuelo AA + 5 acuerdos energéticos: semana de mayor densidad bilateral del período post-Maduro",
      "Jubilación 8 magistrados TSJ + 227 sentencias + postulaciones bajo AN: reconfiguración judicial como acumulación institucional",
      "'Normalización sin transición' (Americas Quarterly): E3 alcanza 50%, el máximo del ciclo"
    ]
  },
  {
    "label": "1–8 may",
    "short": "S17",
    "probs": [
      {
        "sc": 1,
        "v": 38,
        "t": "up"
      },
      {
        "sc": 2,
        "v": 3,
        "t": "down"
      },
      {
        "sc": 3,
        "v": 48,
        "t": "down"
      },
      {
        "sc": 4,
        "v": 11,
        "t": "flat"
      }
    ],
    "xy": {
      "x": 0.04,
      "y": 0.44
    },
    "sem": {
      "g": 10,
      "y": 5,
      "r": 3
    },
    "kpis": {
      "energia": {
        "exportaciones": "1,23 mbd abril (máx. desde ene. 2019)",
        "ingresos": "Merey USD 90,4/b · Brent USD 117,3/b · +87% bonos",
        "licencias": "GL-58 OFAC: asesoría reestructuración deuda soberana",
        "cambio": "BCV ~Bs 493,4/USD · intervención Bs ~715/EUR"
      },
      "economico": {
        "inflacion": "10,6% mensual abril (3er mes ↓)",
        "ingresos_pob": "USD 240 ingreso integral · base Bs 130 (~$0,27)",
        "electricidad": "Pico 15.579 MW (7 may) · máx. en 9 años",
        "pib": "ENCOVI 2025: 68,5% pobreza · 31,7% extrema"
      },
      "opinion": {
        "direccion": "Wright: Fase 2 iniciada · elecciones Fase 3",
        "elecciones": "Brecha E3-E1: 10pp — compresión más significativa 2 meses",
        "mcm": "MCM: retorno antes fin 2026 · CNE renovado",
        "eeuu": "GL-58 + 6 actos masivos PUD · 500+ presos políticos"
      }
    },
    "tensiones": [
      {
        "l": "green",
        "t": "<b>GL-58 OFAC:</b> Asesoría técnica reestructuración deuda soberana y PDVSA · bonos acum. +87% en 2026 · rally +7,1% diario."
      },
      {
        "l": "green",
        "t": "<b>Exportaciones récord:</b> 1,23 mbd abril (máx. ene. 2019) · ExxonMobil: de «ininvertible» a «recurso inmenso» · Trump coordina con Chevron y Exxon."
      },
      {
        "l": "green",
        "t": "<b>FMI/DEG USD 5.000M:</b> Ortega designado Gobernador · destino Gran Misión Vivienda y hospitales."
      },
      {
        "l": "yellow",
        "t": "<b>Reforma TSJ 20→32 magistrados:</b> Comité de Postulaciones activado · Caryslia presidenta · reconfiguración judicial más profunda del interinato."
      },
      {
        "l": "yellow",
        "t": "<b>42 protestas 1–6 mayo:</b> Pico 35 el 1° mayo · 16 estados · demandas laborales y cambio de gobierno · contenidas con «murciélagos» y PNB."
      },
      {
        "l": "red",
        "t": "<b>Brecha salarial:</b> Ingreso integral USD 240 vs. base Bs 130 (~USD 0,27) · ENCOVI 2025: 68,5% pobreza · 31,7% extrema."
      },
      {
        "l": "red",
        "t": "<b>Caso Quero Navas + pico eléctrico:</b> Muerto jul. 2025 pero informado vivo por Defensoría oct. 2025 · 15.579 MW el 7 may — infraestructura bajo presión crítica."
      }
    ],
    "lectura": "E3 desciende 2pp a 48% no porque el escenario pierda consistencia, sino porque la GL-58 y el plan de tres fases de Wright operacionalizan un horizonte temporal que antes era solo retórico. Al declarar la Fase 1 completada y fijar las elecciones como Fase 3, Washington delimita el alcance de E3 y convierte a E1 en un endpoint planificado del cronograma bilateral. Sin embargo, la brecha E3–E1 se estrecha de 15 a 10pp, la compresión más significativa en dos meses. E1 sube 3pp a 38% por la GL-58, el roadmap de Wright y la intensificación territorial opositora. E4 se mantiene en 11% por la ausencia de escalada sistémica. E2 baja a 3%, mínimo del período.",
    "trendSc": 3,
    "trendDrivers": [
      "GL-58 OFAC + rally bonos +87%: normalización financiera acelera hacia Fase 2 del plan de tres fases de Washington",
      "Exportaciones 1,23 mbd (máx. 2019) + ExxonMobil de «ininvertible» a «recurso inmenso»: reposicionamiento energético hemisférico",
      "Brecha E3–E1 se estrecha a 10pp: Wright fija elecciones como Fase 3 — transición ya en cronograma de Washington"
    ]
  },
  {
    "label": "8–15 may",
    "short": "S18",
    "probs": [
      {
        "sc": 1,
        "v": 40,
        "t": "up"
      },
      {
        "sc": 2,
        "v": 2,
        "t": "down"
      },
      {
        "sc": 3,
        "v": 47,
        "t": "down"
      },
      {
        "sc": 4,
        "v": 11,
        "t": "flat"
      }
    ],
    "xy": {
      "x": 0.03,
      "y": 0.43
    },
    "sem": {
      "g": 9,
      "y": 6,
      "r": 3
    },
    "kpis": {
      "energia": {
        "exportaciones": "1,031 M bpd OPEP abril",
        "ingresos": "Merey USD 90,47/b",
        "licencias": "Reestructuración: Centerview + White & Case",
        "cambio": "Cardón IV 580→640 MMpcd"
      },
      "economico": {
        "inflacion": "Base monetaria +18% en 2 sem.",
        "ingresos_pob": "Salarios universitarios bajo tensión",
        "electricidad": "Sin dato IODA nuevo",
        "pib": "Deuda USD 150–170B"
      },
      "opinion": {
        "direccion": "E3-E1: brecha 7pp",
        "elecciones": "MCM coordina retorno con Rubio",
        "mcm": "Retorno ligado a cronograma electoral",
        "eeuu": "Qatar revela diseño pos-Maduro sin MCM"
      }
    },
    "tensiones": [
      {
        "l": "green",
        "t": "<b>Reestructuración operacional:</b> Centerview Partners y White & Case convierten la GL-58 en arquitectura concreta de negociación de deuda."
      },
      {
        "l": "green",
        "t": "<b>Energía y conectividad:</b> Agen en Caracas, MOU Hunt/HKN/Crossover, United Houston–Caracas y Qatar Airways amplían la normalización externa."
      },
      {
        "l": "green",
        "t": "<b>Petróleo:</b> Producción OPEP de 1,031 M bpd y cesta Merey en USD 90,47/b sostienen el ancla fiscal del interinato."
      },
      {
        "l": "yellow",
        "t": "<b>TSJ 32 magistrados:</b> La reforma sancionada define el árbitro institucional de controversias electorales futuras."
      },
      {
        "l": "yellow",
        "t": "<b>Conflictividad:</b> 44 protestas en 14 entidades entre 8–13 mayo; demandas laborales, justicia, vivienda, agua y derechos de detenidos."
      },
      {
        "l": "red",
        "t": "<b>Presos políticos:</b> Foro Penal registra 457 detenidos y primer aumento desde enero; 746 excarcelaciones verificadas desde el 8 de enero."
      },
      {
        "l": "red",
        "t": "<b>Garantías procesales:</b> Denuncias de tortura de Tarek El Aissami y caso Quero Navas tensionan la credibilidad de la amnistía."
      }
    ],
    "lectura": "La semana del 8 al 15 de mayo produce el estrechamiento más relevante de la brecha E3–E1 en todo el ciclo reciente: E3 baja a 47% y E1 sube a 40%, dejando apenas 7 puntos entre continuidad negociada y transición política pacífica. La continuidad negociada sigue siendo dominante porque Washington y el interinato operan sobre una arquitectura de normalización ya concreta: Venezuela anuncia formalmente la reestructuración de deuda soberana y de PDVSA, designa a Centerview Partners como asesor financiero, incorpora a White & Case en la defensa de CITGO y prepara un DSA para junio. Esa secuencia confirma que la GL-58 pasó de instrumento potencial a mecanismo operativo. Al mismo tiempo, la reforma del TSJ a 32 magistrados consolida el control del árbitro institucional de futuras controversias electorales y preserva el margen de maniobra de Rodríguez. Sin embargo, cada avance operativo de E3 acorta su propio horizonte: MCM coordina con Rubio el protocolo de su retorno, Alviarez lo vincula a un cronograma electoral, y Rubio declara que la riqueza venezolana empieza a beneficiar a la población. Por eso E1 sube: ya no depende solo de presión opositora, sino de una transición que Washington empieza a organizar como destino de la normalización financiera. E4 se mantiene en 11% porque no hay escalada represiva sistémica, pero la presión coercitiva sigue activa: Foro Penal registra 457 presos políticos, el primer aumento desde enero; las excarcelaciones verificadas desde el 8 de enero llegan a 746, pero el proceso se estanca; el juicio de Tarek El Aissami incorpora denuncias detalladas de tortura; y el caso Quero Navas expone fallas graves de trazabilidad penitenciaria. E2 baja a 2%, mínimo del período, por la acumulación de factores anti-colapso: deuda en reestructuración, petróleo por encima del millón de barriles, United y Qatar Airways, BCV en ruta a Washington y coordinación energética activa. La tensión central queda nítida: la normalización económica avanza más rápido que las garantías políticas, sociales y judiciales que deberían sostenerla.",
    "trendSc": 3,
    "trendDrivers": [
      "Reestructuración formal de deuda y DSA en junio convierten la GL-58 en arquitectura operativa de continuidad negociada",
      "MCM–Rubio y retorno ligado a cronograma electoral elevan E1 a 40%, la probabilidad más alta del ciclo",
      "457 presos políticos y 44 protestas muestran que la normalización financiera coexiste con presión social y déficit de garantías"
    ]
  },
  {
    "label": "15–22 may",
    "short": "S19",
    "probs": [
      {
        "sc": 1,
        "v": 36,
        "t": "down"
      },
      {
        "sc": 2,
        "v": 4,
        "t": "up"
      },
      {
        "sc": 3,
        "v": 49,
        "t": "up"
      },
      {
        "sc": 4,
        "v": 11,
        "t": "flat"
      }
    ],
    "xy": {
      "x": 0.12,
      "y": 0.45
    },
    "sem": {
      "g": 8,
      "y": 6,
      "r": 4
    },
    "kpis": {
      "energia": {
        "exportaciones": "1,2 M bpd al cierre de abril",
        "ingresos": "CITGO Q1: USD 157M utilidad",
        "licencias": "Exxon negocia hasta 6 campos",
        "cambio": "Conoco rechaza contrato PDVSA"
      },
      "economico": {
        "inflacion": "Canasta USD 730,59",
        "ingresos_pob": "Ingreso USD 240 cubre 32,8%",
        "electricidad": "103 eventos IODA; Zulia epicentro",
        "pib": "PIB Q1 +2,51%; petróleo -2,12%"
      },
      "opinion": {
        "direccion": "E3-E1: brecha 13pp",
        "elecciones": "E1 retrocede: retorno MCM pendiente",
        "mcm": "Retornos opositores y debate de cronograma",
        "eeuu": "Saab + BM/FMI/Erebor consolidan E3"
      }
    },
    "tensiones": [
      {
        "l": "green",
        "t": "<b>E3 reforzada:</b> Continuidad Negociada sube a 49% (+2pp) por cohesión táctica sobre Saab y normalización multilateral simultánea."
      },
      {
        "l": "green",
        "t": "<b>Normalización operativa:</b> BM, FMI-Ortega, BDV-Erebor y ExxonMobil consolidan apertura gestionada desde el régimen/interinato."
      },
      {
        "l": "green",
        "t": "<b>Contención del paro:</b> El paro universitario más masivo del período fue absorbido sin escalada coercitiva sistémica."
      },
      {
        "l": "yellow",
        "t": "<b>E1 retrocede:</b> Baja a 36% porque retorno MCM, condicionamiento electoral y respuesta salarial siguen pendientes o ambiguos."
      },
      {
        "l": "yellow",
        "t": "<b>E2 sube:</b> Llega a 4% por deterioro acumulativo en infraestructura, ingreso, señoreaje y desaceleración del PIB."
      },
      {
        "l": "red",
        "t": "<b>Conflictividad:</b> 47 protestas en 19 entidades, con pico de 26 el 19 de mayo por el paro universitario nacional."
      },
      {
        "l": "red",
        "t": "<b>Represión calibrada:</b> Heridos frente al SEBIN el 18 de mayo son señal cualitativa relevante, pero compatible con E3."
      }
    ],
    "lectura": "La matriz semanal del 15 al 22 de mayo corrige el balance prospectivo hacia una consolidación más clara de E3: Continuidad Negociada sube a 49% (+2pp) y amplía la brecha frente a E1 a 13 puntos. La razón central no es ausencia de tensión, sino capacidad de gestión: el giro coordinado sobre Alex Saab, la visita del Banco Mundial, la formalización de Calixto Ortega ante el FMI, la corresponsalía BDV-Erebor y las negociaciones de ExxonMobil muestran que el régimen/interinato administra la apertura sin concederla. E1 retrocede a 36% (-4pp) porque los tres elementos decisivos de la watchlist previa se resolvieron de forma ambigua: el paro universitario fue absorbido sin respuesta salarial estructural, el retorno de MCM permanece pendiente y el canal financiero en Washington no vino acompañado de condicionamiento electoral verificable. E2 sube a 4% (+2pp), no por fragmentación inmediata, sino por deterioro acumulativo de infraestructura, ingreso real, señoreaje y desaceleración económica: PIB Q1 de 2,51%, canasta alimentaria de USD 730,59 e ingreso integral que cubre solo 32,8%. E4 se mantiene en 11%: la represión del 18 de mayo frente al SEBIN, con heridos, es una señal cualitativa importante y primera represión documentada de una protesta de derechos humanos en el período post-Maduro, pero sigue siendo calibrada y compatible con E3, sin escalada coercitiva sistémica. La semana produce señales máximas en todas las dimensiones —apertura multilateral, acción judicial estadounidense, conflictividad organizada y represión puntual— y aun así E3 sale reforzada. El segundo semestre determinará si el deterioro social alcanza un umbral que la negociación de cúpula ya no pueda absorber.",
    "trendSc": 3,
    "trendDrivers": [
      "E3 sube a 49% por cohesión táctica sobre Saab y normalización BM/FMI/Erebor/Exxon",
      "E1 cae a 36% porque retorno MCM, condicionamiento electoral y respuesta salarial siguen pendientes",
      "E2 sube a 4% por deterioro acumulativo de infraestructura, ingreso y señoreaje"
    ]
  },
  {
    "label": "22–29 may",
    "short": "S20",
    "probs": [
      {
        "sc": 1,
        "v": 37,
        "t": "up"
      },
      {
        "sc": 2,
        "v": 4,
        "t": "flat"
      },
      {
        "sc": 3,
        "v": 47,
        "t": "down"
      },
      {
        "sc": 4,
        "v": 12,
        "t": "up"
      }
    ],
    "xy": {
      "x": 0.16,
      "y": 0.43
    },
    "sem": {
      "g": 7,
      "y": 7,
      "r": 4
    },
    "kpis": {
      "energia": {
        "exportaciones": ">10M barriles a EE.UU.; India 4° proveedor",
        "ingresos": "PDVSA Q1: USD 6.855M facturados",
        "licencias": "GL-58 permite asesores; Centerview contratado",
        "cambio": "Producción neta ~980K bpd; meta 1,4M en riesgo"
      },
      "economico": {
        "inflacion": "Inflación anualizada ~600%; ene-abr 90%",
        "ingresos_pob": "Canasta USD 730,59 vs ingreso USD 240",
        "electricidad": "Ley eléctrica: USD 20.000M requeridos",
        "pib": "PIB Q1 +2,51% vs +7,19% en Q1 2025"
      },
      "opinion": {
        "direccion": "E3-E1: brecha 10pp",
        "elecciones": "Manifiesto Panamá pide CNE y cronograma",
        "mcm": "MCM 55% positiva; retorno coordinado con Washington",
        "eeuu": "SOUTHCOM + Centerview + DOJ sostienen E3"
      }
    },
    "tensiones": [
      {
        "l": "green",
        "t": "<b>Andamiaje externo:</b> SOUTHCOM, Centerview, India, Tesoro/KPMG y corresponsalías bancarias sostienen la continuidad negociada."
      },
      {
        "l": "green",
        "t": "<b>Manifiesto Panamá:</b> La PUD y Alianza Con Venezuela formalizan hoja de ruta y reconocen el Plan de Tres Fases de Washington."
      },
      {
        "l": "green",
        "t": "<b>Retornos opositores:</b> Ocariz, Toledo y Marrero reconstruyen presencia territorial bajo concesiones calibradas."
      },
      {
        "l": "yellow",
        "t": "<b>E3 cede:</b> Baja a 47% por divergencia entre normalización externa y legitimidad doméstica en mínimo histórico."
      },
      {
        "l": "yellow",
        "t": "<b>TSJ y justicia penal:</b> Ampliación a 32 magistrados y consulta del 1 de junio tensionan credibilidad institucional."
      },
      {
        "l": "red",
        "t": "<b>Sector duro:</b> Iris Varela descarta presidenciales y la filtración “estamos caídos” eleva presión E4."
      },
      {
        "l": "red",
        "t": "<b>Presión social:</b> 43 protestas en 17 entidades, ICC -8,1 y aprobación de Rodríguez en 25,2%."
      }
    ],
    "lectura": "La semana del 22 al 29 de mayo redefine la calidad de E3 sin desplazar su dominancia. Continuidad Negociada baja de 49% a 47% porque el proceso exhibe su mayor divergencia del ciclo: máximo andamiaje externo y mínimo de legitimidad doméstica. La segunda visita del SOUTHCOM, la contratación de Centerview para gestionar cerca de USD 150.000 millones de deuda, el rol de Claver-Carone como enlace informal, la protección operativa de Washington a Delcy Rodríguez, el flujo petrolero supervisado por Tesoro/KPMG y Venezuela como cuarto proveedor de India hacen que los pilares externos de E3 sigan siendo robustos. Sin embargo, el soporte interno se erosiona: aprobación de Rodríguez en 25,2%, ICC en -8,1, PIB Q1 desacelerado a 2,51%, PIB petrolero negativo y conflictividad de 43 protestas en 17 entidades.\n\nE1 sube a 37% por el Manifiesto de Panamá, el primer documento estratégico conjunto en dos años firmado por Machado y González Urrutia, y por el retorno progresivo de dirigentes como Ocariz, Toledo y Marrero. Pero su avance es limitado: al reconocer el Plan de Tres Fases de Washington como marco esencial, la oposición acepta operar dentro del calendario del árbitro externo. MCM no ha retornado, el CNE no se renueva y las movilizaciones del 30 de mayo y 3 de junio serán la primera prueba territorial real. E4 sube a 12% por señales cualitativas del sector duro: Iris Varela habla de guardar la silla de Maduro, circula la filtración interna “estamos caídos” y se detiene a trabajadores de PDVSA. Aun así, no hay escalada sistémica. E2 permanece en 4%: el deterioro macro y social se acumula, pero los mercados y la arquitectura financiera internacional apuestan contra un colapso inmediato.",
    "trendSc": 3,
    "trendDrivers": [
      "E3 baja a 47% por divergencia entre máximo andamiaje externo y erosión doméstica",
      "E1 sube a 37% por Manifiesto de Panamá y retornos opositores, pero subordinado al calendario de Washington",
      "E4 sube a 12% por señales del sector duro sin escalada coercitiva sistémica"
    ]
  },
  {
    "label": "29 may–5 jun",
    "short": "S21",
    "probs": [
      { "sc": 1, "v": 34, "t": "down" },
      { "sc": 2, "v": 4, "t": "flat" },
      { "sc": 3, "v": 49, "t": "up" },
      { "sc": 4, "v": 13, "t": "up" }
    ],
    "xy": { "x": 0.15, "y": 0.46 },
    "sem": { "g": 8, "y": 6, "r": 4 },
    "kpis": {
      "energia": {
        "exportaciones": "1,25M bpd; India compra 427K bpd",
        "ingresos": "PDVSA–Tesoro centraliza flujos y supervisión",
        "licencias": "Hogan Lovells y FMI refuerzan arquitectura financiera",
        "cambio": "Chevron baja a 269K bpd; diversificación hacia India"
      },
      "economico": {
        "inflacion": "Mayo 9,2–12,2%; anualizada 541–559%",
        "ingresos_pob": "Ingreso cubre 32,8% de la canasta alimentaria",
        "electricidad": "Reforma aprobada en 1ª discusión; 42 artículos",
        "pib": "Desaceleración Q1 y fragilidad acumulativa sin colapso"
      },
      "opinion": {
        "direccion": "E3–E1: brecha 15pp",
        "elecciones": "Sin nuevo CNE ni cronograma vinculante",
        "mcm": "Retorno efectivo sigue siendo indicador decisivo",
        "eeuu": "Primera visita de Dan Caine consolida cooperación"
      }
    },
    "tensiones": [
      { "l": "green", "t": "<b>E3 reforzada:</b> Sube a 49% por centralización PDVSA–Tesoro, primera visita del CJCS y avance de la arquitectura financiera." },
      { "l": "green", "t": "<b>Diversificación energética:</b> Exportaciones de 1,25M bpd e India como segundo comprador amplían los amortiguadores externos." },
      { "l": "green", "t": "<b>Reforma eléctrica:</b> La aprobación unánime en primera discusión abre capital privado y mixto bajo conducción estatal." },
      { "l": "yellow", "t": "<b>E1 retrocede:</b> Baja a 34% por ausencia de retorno de MCM, renovación del CNE y calendario electoral verificable." },
      { "l": "yellow", "t": "<b>Fragilidad macro:</b> Inflación mensual de 9,2–12,2%, brecha cambiaria de 35% y caída bursátil de 33%." },
      { "l": "red", "t": "<b>Coerción selectiva:</b> El Helicoide continúa operativo y persisten detenciones focalizadas y uso de bienes opositores." },
      { "l": "red", "t": "<b>Presión social:</b> 42 protestas en 15 entidades sostienen demandas laborales, de servicios, justicia y derechos políticos." }
    ],
    "lectura": "La semana del 29 de mayo al 5 de junio consolida nuevamente a E3 como escenario dominante, con 49% (+2pp), y amplía a 15 puntos su brecha frente a E1. Cuatro desarrollos estructurales explican el movimiento: la instrucción PDVSA–Tesoro del 28 de mayo centraliza la supervisión de flujos petroleros; la primera visita a Caracas del jefe del Estado Mayor Conjunto de EE.UU., Dan Caine, eleva la cooperación de seguridad; la incorporación de Álvaro Piris y Hogan Lovells profundiza la arquitectura financiera y multilateral; y la reforma eléctrica, aprobada por unanimidad en primera discusión, abre concesiones y capital privado o mixto bajo conducción estatal. Las exportaciones de 1,25 millones de bpd e India como segundo comprador refuerzan los amortiguadores externos.\n\nE1 baja a 34% (-3pp). El Manifiesto de Panamá y los retornos de dirigentes mantienen capacidad de articulación, pero no se traducen todavía en un mecanismo endógeno de transición: María Corina Machado no ha retornado, el CNE no ha sido renovado y no existe calendario electoral vinculante. La marcha del 3 de junio fue absorbida sin represión sistémica, pero tampoco produjo concesiones institucionales. E4 sube a 13% (+1pp) por coerción selectiva: detenciones de trabajadores de PDVSA y del abogado Moreno, continuidad operativa de El Helicoide y uso de la vivienda de Leopoldo López, junto con tensiones internas del chavismo. E2 permanece en 4%: inflación, ingreso insuficiente, desaceleración y deterioro eléctrico acumulan fragilidad, aunque la arquitectura financiera externa y el nivel exportador contienen un colapso inmediato.",
    "trendSc": 3,
    "trendDrivers": [
      "E3 sube a 49% por PDVSA–Tesoro, visita de Dan Caine, arquitectura financiera y reforma eléctrica",
      "E1 baja a 34% ante ausencia de retorno de MCM, nuevo CNE y calendario vinculante",
      "E4 sube a 13% por coerción selectiva compatible todavía con la normalización"
    ]
  },
  {
    "label": "5–12 jun",
    "short": "S22",
    "probs": [
      { "sc": 1, "v": 33, "t": "down" },
      { "sc": 2, "v": 4, "t": "flat" },
      { "sc": 3, "v": 50, "t": "up" },
      { "sc": 4, "v": 13, "t": "flat" }
    ],
    "xy": { "x": 0.14, "y": 0.48 },
    "sem": { "g": 8, "y": 7, "r": 4 },
    "kpis": {
      "energia": {
        "exportaciones": "1,25M bpd; Reliance evalúa hasta 400K bpd",
        "ingresos": "Flujo de divisas estimado en ~USD 1.500M/mes",
        "licencias": "OFAC amplía 7 licencias y arbitraje UK/Francia/Singapur",
        "cambio": "PDVSA–SLB firma MOU tecnológico; IMPSA proyecta 672 MW"
      },
      "economico": {
        "inflacion": "Mayo 6,3%; mínimo en 19 meses; interanual 525%",
        "ingresos_pob": "68% de hogares en o bajo el ingreso mínimo",
        "electricidad": "81% apoya capital privado; 66% evalúa mal el servicio",
        "pib": "Bonos +60% anual; inversión ejecutable aún pendiente"
      },
      "opinion": {
        "direccion": "E3–E1: brecha 16pp",
        "elecciones": "Rubio y sindicatos exigen nuevo CNE y cronograma",
        "mcm": "Cabello descarta negociación directa con Machado",
        "eeuu": "Delegación técnica evaluará marco petrolero"
      }
    },
    "tensiones": [
      { "l": "green", "t": "<b>E3 cruza 50%:</b> OFAC amplía siete licencias y mejora las jurisdicciones de arbitraje para contratos petroleros y mineros." },
      { "l": "green", "t": "<b>Diversificación asiática:</b> India y Türkiye amplían la agenda con Reliance, Tata, Essar y una meta comercial de USD 3.000M." },
      { "l": "green", "t": "<b>Capacidad operativa:</b> PDVSA–SLB, IMPSA y el despliegue FANB en el Arco Minero refuerzan gestión sectorial y territorial." },
      { "l": "yellow", "t": "<b>E1 retrocede:</b> La presión por nuevo CNE aumenta, pero Cabello cierra la negociación con Machado y no hay calendario." },
      { "l": "yellow", "t": "<b>Divergencia social:</b> Inflación mensual de 6,3% y bonos al alza coexisten con 75 protestas, máximo del ciclo reciente." },
      { "l": "red", "t": "<b>Derechos humanos:</b> CorteIDH ordena cerrar El Helicoide en 18 meses; la reacción estatal será un indicador estructural." },
      { "l": "red", "t": "<b>Riesgo territorial:</b> El operativo en Las Claritas puede habilitar inversión minera, pero mantiene riesgos humanitarios y ambientales." }
    ],
    "lectura": "La semana del 5 al 12 de junio lleva a E3 al 50% (+1pp), primer cruce de ese umbral y máxima brecha histórica frente a E1, con 16 puntos. El movimiento responde a la mayor densidad jurídico-contractual e institucional del ciclo: OFAC amplía siete licencias generales y admite arbitraje en Reino Unido, Francia y Singapur; se elimina la cláusula de interés público del contrato modelo petrolero; PDVSA y SLB firman un memorando tecnológico; IMPSA avanza en Tocoma y Macagua; y la gira India–Türkiye abre perspectivas con Reliance, Tata, Essar y una meta comercial bilateral de USD 3.000 millones. El operativo de la FANB en el Arco Minero añade capacidad territorial al servicio de la apertura extractiva. Sin embargo, estos avances todavía son arquitectura y señalización, no capital comprometido.\n\nE1 baja a 33% (-1pp) pese a la presión de Marco Rubio, sindicatos y familiares de presos políticos por un nuevo CNE, cronograma y libertades. El cierre categórico de Diosdado Cabello a negociar con María Corina Machado, la ausencia de renovación electoral y la falta de compromisos vinculantes mantienen estancado el vector político. E4 permanece en 13%: el caso PDVSA Cripto, el Plan de 100 Días de la FANB y el operativo en Las Claritas muestran coerción selectiva, mientras la CorteIDH ordena cerrar El Helicoide en 18 meses. E2 sigue en 4% porque inflación mensual de 6,3%, bonos +60%, flujo de divisas y reconexión financiera contienen un colapso inmediato, aunque 75 protestas, inflación interanual de 525% y 68% de hogares con ingresos bajos acumulan riesgo social.",
    "trendSc": 3,
    "trendDrivers": [
      "E3 alcanza 50% por licencias OFAC, arbitraje ampliado, gira India–Türkiye y control territorial",
      "E1 baja a 33% porque la presión por nuevo CNE no produce calendario ni negociación política",
      "E4 queda en 13%: coerción selectiva y Arco Minero sin escalada sistémica contra la oposición"
    ]
  },
  {
    "label": "12–19 jun",
    "short": "S23",
    "probs": [
      { "sc": 1, "v": 37, "t": "up" },
      { "sc": 2, "v": 4, "t": "flat" },
      { "sc": 3, "v": 47, "t": "down" },
      { "sc": 4, "v": 12, "t": "down" }
    ],
    "xy": { "x": 0.18, "y": 0.44 },
    "sem": { "g": 8, "y": 7, "r": 4 },
    "kpis": {
      "energia": {
        "exportaciones": "~1,25M bpd; PDVSA–Repsol +20.000 bpd",
        "ingresos": "Bonos al alza; Vanguard aumenta tenencias",
        "licencias": "IMPSA 672 MW/2.640 MW; GE Vernova 1 GW/5 GW",
        "cambio": "Operación SOUTHCOM–FANB contra Tren de Aragua"
      },
      "economico": {
        "inflacion": "Mayo 6,3%; mínimo en más de un año",
        "ingresos_pob": "27 protestas en 13 estados",
        "electricidad": "IODA: 12 eventos en 6 estados; Guárico 50%",
        "pib": "Bonos ~USD 110.300M; disputa Centerview–Lazard"
      },
      "opinion": {
        "direccion": "E3–E1: brecha baja de 16pp a 10pp",
        "elecciones": "Mesa técnica AN–Figuera instalada el 18 jun",
        "mcm": "Retorno de MCM queda como prueba crítica",
        "eeuu": "Departamento de Estado respalda agenda de transición"
      }
    },
    "tensiones": [
      { "l": "green", "t": "<b>Canal político formal:</b> La mesa técnica AN–Figuera instala el primer canal verificable de diálogo sobre transición democrática." },
      { "l": "green", "t": "<b>Apertura operativa:</b> IMPSA, GE Vernova y PDVSA–Repsol elevan la densidad contractual del ciclo, aunque sin capex plenamente verificable." },
      { "l": "green", "t": "<b>Seguridad bilateral:</b> La operación SOUTHCOM–FANB contra el Tren de Aragua profundiza la coordinación operativa con Washington." },
      { "l": "yellow", "t": "<b>E3 cede terreno relativo:</b> La continuidad negociada sigue dominante, pero transfiere probabilidad hacia E1 por el canal político abierto." },
      { "l": "yellow", "t": "<b>Fricción financiera:</b> La disputa Centerview–Lazard introduce ruido en la arquitectura de reestructuración de deuda." },
      { "l": "red", "t": "<b>Servicios y conflictividad:</b> 27 protestas en 13 estados e IODA registra 12 eventos eléctricos en 6 estados." },
      { "l": "red", "t": "<b>Prueba de garantías:</b> Una represalia ante el retorno de MCM reactivaría de inmediato el escenario coercitivo." }
    ],
    "lectura": "La semana del 12 al 19 de junio registra el avance institucional más significativo del proceso desde enero: el retorno de Dinorah Figuera y la instalación de una mesa técnica con la Asamblea Nacional de mayoría gubernamental, respaldada por la AN de 2015 y por el Departamento de Estado de EE.UU. E3 baja a 47% (-3pp) pero conserva el liderazgo porque la arquitectura de continuidad negociada sigue apoyada en cooperación de seguridad, apertura energética y normalización financiera. La novedad es que, por primera vez, parte de esa probabilidad se transfiere hacia E1: la mesa técnica activa un canal político formal con agenda electoral concreta, aunque todavía sin cronograma vinculante, CNE renovado ni incorporación verificada de los actores opositores de mayor capital político.\n\nE1 sube a 37% (+4pp), el movimiento más relevante de la semana, por el respaldo explícito de Washington a un proceso de transición democrática y por retornos opositores sin represalia documentada. E4 baja a 12% (-1pp) porque no hubo respuesta coercitiva frente a Figuera o Pérez Vivas, aunque persisten instrumentos selectivos como la revisión de más de 12.000 expedientes judiciales y la amenaza latente ante un eventual retorno de MCM. E2 permanece en 4%: inflación mensual de 6,3%, bonos al alza y expectativas de reestructuración contienen el colapso inmediato, mientras 27 protestas, fragilidad eléctrica y disputa de asesores financieros mantienen riesgo de mediano plazo.",
    "trendSc": 1,
    "trendDrivers": [
      "E1 sube a 37% por mesa técnica AN–Figuera y respaldo del Departamento de Estado",
      "E3 baja a 47% pero sigue dominante por energía, seguridad bilateral y normalización financiera",
      "La brecha E3–E1 se comprime de 16pp a 10pp, la contracción más rápida del ciclo"
    ]
  },
  {
    "label": "19–26 jun",
    "short": "S24",
    "probs": [
      { "sc": 1, "v": 39, "t": "up" },
      { "sc": 2, "v": 3, "t": "down" },
      { "sc": 3, "v": 49, "t": "up" },
      { "sc": 4, "v": 9, "t": "down" }
    ],
    "xy": { "x": 0.20, "y": 0.47 },
    "sem": { "g": 8, "y": 6, "r": 5 },
    "kpis": {
      "energia": {
        "exportaciones": "PDVSA: USD 9.400M ene–may; +54% interanual",
        "ingresos": "Exportaciones petroleras +25%; precio prom. USD 71,25/b",
        "licencias": "FMI/BID activan asistencia; fondo inicial USD 200M",
        "cambio": "BCV flexibiliza mercado cambiario; brecha 36%"
      },
      "economico": {
        "inflacion": "Costo sismo: 1%–7% del PIB (USGS)",
        "ingresos_pob": "Deuda externa reportada: USD 240.000M",
        "electricidad": "Afectación eléctrica en eje oriental y zona epicentral",
        "pib": "PIB Q1 +2,1%; consumo real +28% ene–may"
      },
      "opinion": {
        "direccion": "E3–E1: brecha estable en 10pp",
        "elecciones": "OEA lista para apoyar transición electoral",
        "mcm": "Figuera deslinda comisión negociadora del liderazgo de MCM",
        "eeuu": "Más de 25 países movilizan ayuda humanitaria"
      }
    },
    "tensiones": [
      { "l": "green", "t": "<b>E3 se refuerza:</b> El doblete sísmico prolonga la necesidad operativa del gobierno encargado para gestionar ayuda, réplicas y reconstrucción." },
      { "l": "green", "t": "<b>Cooperación internacional:</b> Más de 25 países y organismos movilizan asistencia; FMI/BID canalizan apoyo por vías institucionales." },
      { "l": "green", "t": "<b>E1 avanza en paralelo:</b> El canal AN2015–Figuera y la disposición de la OEA sostienen la transición pacífica en 39%." },
      { "l": "yellow", "t": "<b>Shock fiscal:</b> El costo estimado del sismo (1%–7% del PIB) se cruza con la negociación de deuda externa de USD 240.000M." },
      { "l": "yellow", "t": "<b>Cifras a consolidar:</b> El balance oficial de víctimas y daños difiere de las proyecciones probabilísticas del USGS." },
      { "l": "red", "t": "<b>Réplicas y servicios:</b> USGS estima 24% de probabilidad de M6 adicional y 3% de M7+; electricidad y telecomunicaciones siguen bajo monitoreo." },
      { "l": "red", "t": "<b>Riesgo social posterior:</b> Una respuesta insuficiente en servicios básicos podría desplazar presión hacia E2 en julio." }
    ],
    "lectura": "La semana del 19 al 26 de junio interrumpe la tendencia de contracción de la brecha E3–E1: ambos escenarios avanzan en paralelo y la distancia queda estable en 10pp. E3 sube a 49% (+2pp) porque la emergencia sísmica del 24 de junio no compite con la continuidad negociada sino que se le sobrepone. La magnitud del doblete Mw 7.2/7.5 exige continuidad operativa del gobierno encargado para gestionar réplicas, reconstrucción, distribución de ayuda y coordinación internacional. La asistencia de más de 25 países, el fondo inicial de USD 200M y la activación de instrumentos del FMI y el BID refuerzan los canales institucionales existentes en vez de sustituirlos.\n\nE1 sube a 39% (+2pp) porque el canal AN2015–Figuera sigue en curso pese a la emergencia: la comisión negociadora, el deslinde institucional de Figuera frente a MCM y la disposición de la OEA a apoyar una transición electoral sostienen la probabilidad de una salida pacífica. E4 baja a 9% (-3pp) por ausencia de securitización de la emergencia, tono oficial de reconciliación y falta de señales de tensión en la FANB. E2 baja a 3% (-1pp) porque el sistema absorbió el shock sin fractura institucional inmediata, aunque el costo de reconstrucción estimado entre 1% y 7% del PIB, la deuda externa de USD 240.000M y la evolución de réplicas sísmicas serán variables críticas de julio.",
    "trendSc": 3,
    "trendDrivers": [
      "E3 sube a 49% porque el sismo refuerza la centralidad operativa del gobierno encargado y la coordinación internacional",
      "E1 sube a 39% porque el canal AN2015–Figuera y la OEA siguen activos pese a la emergencia",
      "E4 cae a 9% y E2 a 3% por ausencia de cierre coercitivo o fractura institucional inmediata"
    ]
  },
  {
    "label": "26 jun–3 jul",
    "short": "S25",
    "probs": [
      { "sc": 1, "v": 36, "t": "down", "reportedDelta": -2 },
      { "sc": 2, "v": 8, "t": "up", "reportedDelta": 2 },
      { "sc": 3, "v": 44, "t": "down", "reportedDelta": -2 },
      { "sc": 4, "v": 12, "t": "up", "reportedDelta": 2 }
    ],
    "xy": { "x": 0.24, "y": 0.44 },
    "sem": { "g": 5, "y": 8, "r": 7 },
    "kpis": {
      "energia": {
        "exportaciones": "1,20M b/d en junio; −0,04–0,05M b/d vs. mayo",
        "ingresos": "Flujo petrolero USD 1.110M; −USD 260M vs. mayo",
        "licencias": "Cesta venezolana USD 69,8/barril",
        "cambio": "El Palito y Complejo Morón condicionados por suministro eléctrico"
      },
      "economico": {
        "inflacion": "Junio: 11,4%–13,8% mensual; 125,0%–129,9% acumulada",
        "ingresos_pob": "SENIAT: USD 866M en junio; −7,5% vs. mayo",
        "electricidad": "La Guaira: 75% electricidad, 68% agua y 90% vialidad",
        "pib": "Pérdidas del sismo: 4%–20% del PIB (USGS)"
      },
      "opinion": {
        "direccion": "E3–E1: brecha estable en 8pp",
        "elecciones": "Vencimiento del segundo plazo del interinato: 3–5 jul",
        "mcm": "Dos intentos de retorno bloqueados; fricción abierta con Washington",
        "eeuu": "86% califica la gestión como deficiente o muy deficiente"
      }
    },
    "tensiones": [
      { "l": "green", "t": "<b>Cohesión de élite:</b> No se documentan fracturas en PSUV/FANB durante la respuesta a la emergencia." },
      { "l": "green", "t": "<b>Cooperación internacional:</b> 147 países y 31 organismos expresan solidaridad; SOUTHCOM despliega cerca de 2.000 efectivos." },
      { "l": "yellow", "t": "<b>Continuidad bajo presión:</b> E3 conserva el liderazgo en 44%, pero cede por erosión fiscal y de legitimidad." },
      { "l": "yellow", "t": "<b>Interinato:</b> El segundo plazo constitucional vence entre el 3 y el 5 de julio sin mecanismo formal resuelto al corte." },
      { "l": "red", "t": "<b>Securitización humanitaria:</b> Registro de voluntarios, restricciones a periodistas y retención denunciada de ayuda elevan E4." },
      { "l": "red", "t": "<b>Trilema fiscal:</b> Reconstrucción, deuda de USD 240.000M y menor flujo petrolero elevan E2 a 8%." },
      { "l": "red", "t": "<b>Daño humanitario:</b> 2.295 fallecidos, 12.400 heridos y 11.546 personas sin vivienda atendidas en campamentos." }
    ],
    "lectura": "La semana del 26 de junio al 3 de julio confirma que la emergencia sísmica se convirtió en un factor estructural superpuesto a la agenda política y económica. E3 continúa dominante en 44% (−2pp): la cohesión del PSUV/FANB y la coordinación operativa con Estados Unidos se mantienen, pero el costo de reconstrucción, la caída del flujo petrolero y la desaprobación ciudadana erosionan la sostenibilidad de la continuidad negociada.\n\nE1 baja a 36% (−2pp) porque dos intentos de retorno de María Corina Machado fueron bloqueados y la comisión AN2015–Gobierno no registró avances verificables. E4 sube a 12% (+2pp) por señales de securitización del acceso a la ayuda y a la información. E2 sube a 8% (+2pp) porque el USGS amplió las pérdidas estimadas a 4%–20% del PIB, mientras el fondo de reconstrucción de USD 200M y el flujo petrolero de junio resultan insuficientes frente al nuevo estrés fiscal. No se declara movimiento disruptivo: todos los ajustes permanecen dentro del techo de ±5pp.",
    "trendSc": 3,
    "trendDrivers": [
      "E3 conserva el liderazgo en 44%, sostenido por cohesión de élite y continuidad operativa",
      "E1 baja a 36% tras el bloqueo de dos intentos de retorno de MCM y la falta de avances negociadores",
      "E4 y E2 suben a 12% y 8% por securitización humanitaria y ampliación del riesgo fiscal"
    ]
  },
  {
    "label": "3–9 jul",
    "short": "S26",
    "probs": [
      { "sc": 1, "v": 33, "t": "down" },
      { "sc": 2, "v": 8, "t": "flat" },
      { "sc": 3, "v": 46, "t": "up" },
      { "sc": 4, "v": 13, "t": "up" }
    ],
    "xy": { "x": 0.23, "y": 0.46 },
    "sem": { "g": 6, "y": 8, "r": 7 },
    "kpis": {
      "energia": {
        "exportaciones": "64% vía traders; Citgo retoma crudo venezolano",
        "ingresos": "Flujo de efectivo esperado en julio: ~USD 1.869M",
        "licencias": "Reglamento de Hidrocarburos tras revisar 1.389 resoluciones",
        "cambio": "Producción 1,18M bpd en mayo; meta 1,37M bpd"
      },
      "economico": {
        "inflacion": "Sin dato semanal nuevo; vigilar transmisión fiscal-cambiaria",
        "ingresos_pob": "Deuda USD 150.000–240.000M sin DSA del FMI",
        "electricidad": "Starlink autorizado para prueba piloto de conectividad",
        "pib": "Daños: USD 6.700M PNUD vs. USD 37.000M UNDRR"
      },
      "opinion": {
        "direccion": "E3–E1: brecha se amplía a 13pp",
        "elecciones": "46% prioriza elecciones vs. 33% reconstrucción",
        "mcm": "Imagen positiva 53%; dos intentos de retorno bloqueados",
        "eeuu": "75% confía en EE.UU. para la reconstrucción"
      }
    },
    "tensiones": [
      { "l": "green", "t": "<b>Cohesión de élite:</b> El enroque SENIAT–Pequiven–Banco de Venezuela–CIIP ocurre sin renuncias ni disidencias." },
      { "l": "green", "t": "<b>Apertura energética:</b> El nuevo Reglamento de Hidrocarburos amplía participación privada bajo regulación centralizada." },
      { "l": "green", "t": "<b>Respaldo externo:</b> Washington, Israel, China, UE y organismos multilaterales sostienen la capacidad operativa del gobierno encargado." },
      { "l": "yellow", "t": "<b>Vacío formal:</b> El silencio de TSJ, AN y MP tras cumplirse 180 días opera como continuidad tácita, no como solución constitucional." },
      { "l": "yellow", "t": "<b>Legitimidad:</b> La desaprobación de Delcy Rodríguez llega a 63,3% y la de la respuesta sísmica a 65%." },
      { "l": "red", "t": "<b>Riesgo fiscal:</b> El EMBI sube 836pb hasta 7.098 puntos en ocho jornadas." },
      { "l": "red", "t": "<b>Reconstrucción discrecional:</b> Venezuela Renace concentra presupuesto sin una PDNA formal ni arbitraje técnico validado." }
    ],
    "lectura": "La semana del 3 al 9 de julio consolida la continuidad negociada como escenario dominante. E3 sube a 46% (+2pp) porque el reacomodo del equipo económico ocurre sin fracturas, el silencio institucional tras el vencimiento de los 180 días sostiene de facto al gobierno encargado y una coalición amplia de actores externos continúa financiando y reconociendo su capacidad operativa.\n\nE1 baja a 33% (−3pp) porque dos intentos documentados de regreso de María Corina Machado fueron bloqueados por Washington y el canal AN2015–Ejecutivo no produjo avances verificables. E4 sube a 13% (+1pp) al trasladarse la securitización desde el acceso físico hacia el control presupuestario de la reconstrucción mediante la Gran Misión Venezuela Renace. E2 permanece en 8%: el EMBI sube 836 puntos básicos y los daños oscilan entre USD 6.700M y USD 37.000M, pero no se observa fractura civil-militar ni pérdida de control territorial. La brecha E3–E1 se amplía a 13pp.",
    "trendSc": 3,
    "trendDrivers": [
      "E3 sube a 46% por cohesión de élite, silencio institucional coordinado y respaldo operativo externo",
      "E1 baja a 33% por el bloqueo reiterado al retorno de MCM y la falta de avances negociadores",
      "E4 sube a 13% por control discrecional de la reconstrucción; E2 permanece en 8%"
    ]
  },
  {
    "label": "10–17 jul",
    "short": "S27",
    "probs": [
      { "sc": 1, "v": 27, "t": "down" },
      { "sc": 2, "v": 9, "t": "up" },
      { "sc": 3, "v": 48, "t": "up" },
      { "sc": 4, "v": 16, "t": "up" }
    ],
    "xy": { "x": 0.27, "y": 0.48 },
    "sem": { "g": 6, "y": 8, "r": 8 },
    "kpis": {
      "energia": {
        "exportaciones": "OPEP: 1,070M b/d fuentes secundarias; 1,187M b/d comunicación directa",
        "ingresos": "Merey USD 71,13/barril en junio; −14,1% vs. mayo",
        "licencias": "Meta 1,5M b/d; 30 acuerdos con Chevron, Repsol y otros",
        "cambio": "GE +4.000 MW; IMSA/Tocoma–Macagua +2.400 MW"
      },
      "economico": {
        "inflacion": "Junio 13,8%; acumulado semestral 129,82%",
        "ingresos_pob": "TPS de ~600.000 venezolanos bajo revisión en Corte Suprema de EE.UU.",
        "electricidad": "Acuerdos para recuperar o añadir más de 6.400 MW",
        "pib": "Financiamiento total de reconstrucción aún sin precisar"
      },
      "opinion": {
        "direccion": "E3–E1: brecha se amplía a 21pp",
        "elecciones": "Hoja de ruta AN2015–Ejecutivo inicia 1° agosto",
        "mcm": "Amnistía sin garantías suficientes; PUD sin posición común",
        "eeuu": "Tutela operativa documentada por NYT y Financial Times"
      }
    },
    "tensiones": [
      { "l": "green", "t": "<b>Continuidad tutelada:</b> NYT y FT documentan control operativo de Washington sobre personal, comunicación y política exterior." },
      { "l": "green", "t": "<b>Disciplina de élite:</b> La mayor reestructuración de gabinete se ejecuta sin renuncias, fugas ni disidencia pública." },
      { "l": "green", "t": "<b>Ancla petrolera:</b> Meta de 1,5M b/d, 30 acuerdos y nuevos compromisos eléctricos sostienen capacidad rentista." },
      { "l": "yellow", "t": "<b>Canal paralelo:</b> La hoja de ruta AN2015–Ejecutivo avanza hacia un nuevo CNE sin Machado ni González Urrutia." },
      { "l": "yellow", "t": "<b>Brecha productiva:</b> OPEP registra 1,070M b/d por fuentes secundarias frente a 1,187M b/d por comunicación directa." },
      { "l": "red", "t": "<b>Movimiento disruptivo:</b> E1 cae 6pp porque Washington reconoce que la amnistía no garantiza un retorno seguro de Machado." },
      { "l": "red", "t": "<b>Presión sociofiscal:</b> Inflación de 13,8%, financiamiento de reconstrucción incierto y amenaza al TPS/remesas elevan E2." },
      { "l": "red", "t": "<b>Control centralizado:</b> Cabello consolida el aparato coercitivo y la Presidencia absorbe fundaciones sociales de reconstrucción." }
    ],
    "lectura": "El corte del 10 al 17 de julio profundiza el patrón de continuidad tutelada. E3 sube a 48% (+2pp) porque NYT y Financial Times documentan el control operativo de Washington sobre decisiones del gobierno encargado, mientras la mayor reestructuración del gabinete se ejecuta sin fracturas y la apertura energética sostiene la capacidad rentista.\n\nE1 cae a 27% (−6pp), Movimiento Disruptivo Justificado, porque la propia administración estadounidense reconoce ante el Congreso que la ley de amnistía no ofrece garantías suficientes para el regreso de María Corina Machado, mientras respalda un canal AN2015–Ejecutivo que excluye a la coalición opositora de mayor legitimidad electoral. E4 sube a 16% (+3pp) por la consolidación de Cabello y la centralización de fundaciones sociales bajo la Presidencia. E2 sube a 9% (+1pp) ante inflación de 13,8%, amenaza al TPS/remesas y financiamiento de reconstrucción incierto, sin fractura civil-militar ni pérdida territorial.",
    "trendSc": 3,
    "trendDrivers": [
      "E3 sube a 48% por tutela operativa de Washington, disciplina de gabinete y ancla energética",
      "E1 cae a 27% en Movimiento Disruptivo Justificado por falta de garantías para MCM y exclusión del canal institucional",
      "E4 sube a 16% y E2 a 9% por centralización coercitiva, inflación y riesgo sobre remesas"
    ]
  }
];

export const TENSIONS = [
  {
    "level": "green",
    "text": "La mayor reestructuración del gabinete se ejecuta por decreto sin renuncias, fugas ni disidencias."
  },
  {
    "level": "green",
    "text": "La meta de 1,5M b/d, 30 acuerdos petroleros y más de 6.400 MW comprometidos sostienen la continuidad."
  },
  {
    "level": "yellow",
    "text": "La hoja de ruta AN2015–Ejecutivo avanza hacia un nuevo CNE con respaldo de Washington, sin la PUD unificada."
  },
  {
    "level": "yellow",
    "text": "Washington reconoce que la ley de amnistía no garantiza el retorno seguro de Machado; E1 cae 6pp."
  },
  {
    "level": "yellow",
    "text": "Cabello consolida control de seguridad y la Presidencia centraliza fundaciones sociales de reconstrucción."
  },
  {
    "level": "red",
    "text": "La inflación de junio alcanza 13,8% y 129,82% acumulado en el primer semestre."
  },
  {
    "level": "red",
    "text": "La revisión del TPS amenaza las remesas de cerca de 600.000 venezolanos mientras el financiamiento de reconstrucción sigue impreciso."
  }
];

export const MONITOR_WEEKS = [
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
  "S7",
  "S8",
  "S9",
  "S10",
  "S11",
  "S12",
  "S13",
  "S14",
  "S15",
  "S16",
  "S17",
  "S18",
  "S19",
  "S20",
  "S21",
  "S22",
  "S23",
  "S24",
  "S25",
  "S26",
  "S27"
];

export const ICG_HISTORY = [
  {
    "week": "S1",
    "score": 82,
    "sitrep": true,
    "note": "Post-operativo: élite cierra filas bajo presión externa"
  },
  {
    "week": "S2",
    "score": 78,
    "sitrep": true,
    "note": "Delcy consolida. FANB sin señales de fractura"
  },
  {
    "week": "S3",
    "score": 80,
    "sitrep": true,
    "note": "Gabinete activo. Cohesión institucional alta"
  },
  {
    "week": "S4",
    "score": 72,
    "sitrep": true,
    "note": "FANB reafirma lealtad pero tensiones internas"
  },
  {
    "week": "S5",
    "score": 68,
    "sitrep": true,
    "note": "Delcy reafirma legitimidad Maduro. Cabello activo"
  },
  {
    "week": "S6",
    "score": 65,
    "sitrep": true,
    "note": "Tensiones FANB: Padrino 12 años. Presión oxigenación"
  },
  {
    "week": "S7",
    "score": 70,
    "sitrep": true,
    "note": "Poder Ciudadano: renuncias Saab/Ruiz. Trump 'amigo'"
  },
  {
    "week": "S8",
    "score": 66,
    "sitrep": true,
    "note": "Brecha entre discurso amnistía y control paralelo"
  },
  {
    "week": "S9",
    "score": 72,
    "sitrep": true,
    "note": "Reconocimiento formal EE.UU. + 39 protestas 23 estados"
  },
  {
    "week": "S10",
    "score": 68,
    "sitrep": true,
    "note": "Reconfiguración gabinete 42% + nueva cúpula FANB. Padrino sale. Normalización diplomática operativa"
  },
  {
    "week": "S11",
    "score": 66,
    "sitrep": true,
    "note": "González López giro institucional FANB. Ofensiva económica. 97 protestas en 4 días. Colectivos amenazan MCM"
  },
  {
    "week": "S12",
    "score": 68,
    "sitrep": true,
    "note": "OFAC levanta sanciones DR. Trump «empresa conjunta». Embajada reabierta. 90 días cumplidos. Marcha 9 abril convocada"
  },
  {
    "week": "S13",
    "score": 70,
    "sitrep": true,
    "note": "Poder Ciudadano completo: Devoe Fiscal (275 votos) + González Lobato Defensora. FMI consulta miembros. 72 protestas 9-abr. Sanciones BCV evaluadas"
  },
  {
    "week": "S14",
    "score": 72,
    "sitrep": true,
    "note": "FMI + BM reanudan relaciones (16 abr). GL-56/GL-57 emitidas. Haustveit Caracas. Kozak: Fase 1 cumplida. Padrino López regresa al gabinete. Registro FARA Rodríguez candidatura 2027"
  },
  {
    "week": "S15",
    "score": 68,
    "sitrep": true,
    "note": "Barrett Fase 2 + FMI/BM/BID simultáneos + Peregrinación Nacional + Ley Minas G.O.7.020. MCM anuncia regreso desde Puerta del Sol. Petro propone cogobernanza 1-2 años. 46 protestas pico 27 (22 abr) paro universitario. Motín Yare III 5 fallecidos. 473 presos políticos"
  },
  {
    "week": "S16",
    "score": 71,
    "sitrep": true,
    "note": "Delegación Casa Blanca + MOU energéticos (Shell/Eni/BP/Repsol) + TSJ jubilación 8 magistrados (incl. Moreno). E3 sube a 50%. $240 ingreso mínimo gestiona expectativas 1° mayo. 33 protestas; marchas laborales bloqueadas en Caracas."
  },
  {
    "week": "S17",
    "score": 60,
    "sitrep": true,
    "note": "GL-58 OFAC habilita asesoría técnica para reestructuración de deuda soberana y PDVSA. Reforma del TSJ de 20 a 32 magistrados con Comité de Postulaciones activado. Wright declara elecciones como Fase 3 del plan de tres fases. Brecha E3–E1 se estrecha a 10pp."
  },
  {
    "week": "S18",
    "score": 62,
    "sitrep": true,
    "note": "Reestructuración formal de deuda + TSJ 32 magistrados consolidan control institucional. Pero 457 presos políticos, denuncias de tortura y 44 protestas elevan presión sobre garantías."
  },
  {
    "week": "S19",
    "score": 60,
    "sitrep": true,
    "note": "E3 se consolida en 49% por cohesión táctica sobre Saab y normalización BM/FMI/Erebor/Exxon. La conflictividad universitaria y la represión frente al SEBIN elevan presión, pero sin fractura coercitiva sistémica."
  },
  {
    "week": "S20",
    "score": 57,
    "sitrep": true,
    "note": "E3 sigue dominante pero cede por primera vez en cuatro semanas: el andamiaje externo se fortalece mientras la aprobación de Rodríguez cae a 25,2% y el ICC a -8,1. Señales del sector duro, caso Zapatero y detenciones selectivas elevan tensión interna sin ruptura sistémica."
  },
  {
    "week": "S21",
    "score": 59,
    "sitrep": true,
    "note": "La centralización PDVSA–Tesoro, la primera visita del CJCS y la reforma eléctrica refuerzan cohesión y capacidad de gestión. Persisten tensiones internas y coerción selectiva, pero sin fractura sistémica."
  },
  {
    "week": "S22",
    "score": 61,
    "sitrep": true,
    "note": "OFAC, la gira India–Türkiye, el seguimiento al Plan de 100 Días y el operativo en el Arco Minero elevan capacidad institucional y territorial. La tensión electoral y de derechos humanos crece sin fractura del mando."
  },
  {
    "week": "S23",
    "score": 64,
    "sitrep": true,
    "note": "La mesa técnica AN–Figuera abre un canal político formal y la operación SOUTHCOM–FANB refuerza coordinación de seguridad. La cohesión mejora, aunque el retorno de MCM y la disputa Centerview–Lazard quedan como pruebas sensibles."
  },
  {
    "week": "S24",
    "score": 67,
    "sitrep": true,
    "note": "El doblete sísmico activa respuesta institucional y cooperación internacional sin fractura civil-militar visible. La cohesión sube por gestión coordinada, con riesgo fiscal y de servicios en observación."
  },
  {
    "week": "S25",
    "score": 65,
    "sitrep": true,
    "note": "La cohesión PSUV/FANB se mantiene durante la emergencia, pero el 86% de desaprobación, la presión fiscal y la securitización de la ayuda erosionan la legitimidad operativa."
  },
  {
    "week": "S26",
    "score": 68,
    "sitrep": true,
    "note": "El enroque económico y el silencio institucional tras los 180 días confirman disciplina de élite. La cohesión mejora pese a la erosión de legitimidad y al aumento del riesgo fiscal."
  },
  {
    "week": "S27",
    "score": 71,
    "sitrep": true,
    "note": "La reestructuración del gabinete sin disidencias, la tutela operativa de Washington y la consolidación de Cabello refuerzan cohesión de élite, aunque amplían la distancia con la oposición de mayor legitimidad electoral."
  }
];

export const CONF_SEMANAL = [
  {
    "week": "S1",
    "label": "3–15 ene",
    "protestas": 28,
    "estados": 8,
    "reprimidas": 3,
    "motivos": [
      "Rechazo operativo 3 ene",
      "Servicios básicos",
      "Presos políticos"
    ],
    "hecho": "Post-operativo. Protestas reactivas. Colectivos activos."
  },
  {
    "week": "S2",
    "label": "16–22 ene",
    "protestas": 22,
    "estados": 6,
    "reprimidas": 1,
    "motivos": [
      "Servicios básicos",
      "Derechos laborales",
      "Electricidad"
    ],
    "hecho": "Baja intensidad. Estabilización post-shock."
  },
  {
    "week": "S3",
    "label": "23–29 ene",
    "protestas": 18,
    "estados": 7,
    "reprimidas": 0,
    "motivos": [
      "Derechos laborales",
      "Vivienda",
      "Agua potable"
    ],
    "hecho": "Mínimo del ciclo. Expectativa por Ley Hidrocarburos."
  },
  {
    "week": "S4",
    "label": "30e–5f",
    "protestas": 25,
    "estados": 9,
    "reprimidas": 2,
    "motivos": [
      "Salarios",
      "Servicios básicos",
      "Participación política"
    ],
    "hecho": "FANB reafirma lealtad. Amnistía 1ª discusión diferida."
  },
  {
    "week": "S5",
    "label": "6–13 feb",
    "protestas": 30,
    "estados": 11,
    "reprimidas": 1,
    "motivos": [
      "Salarios",
      "Electricidad",
      "Presos políticos",
      "Justicia"
    ],
    "hecho": "Visita Chris Wright. 14.8h sin suministro eléctrico."
  },
  {
    "week": "S6",
    "label": "13–20 feb",
    "protestas": 35,
    "estados": 12,
    "reprimidas": 2,
    "motivos": [
      "Salarios",
      "Jubilaciones",
      "Electricidad",
      "Servicios"
    ],
    "hecho": "Amnistía promulgada. Tensiones FANB: Padrino 12 años."
  },
  {
    "week": "S7",
    "label": "20–27 feb",
    "protestas": 32,
    "estados": 10,
    "reprimidas": 1,
    "motivos": [
      "Salarios",
      "Servicios básicos",
      "Brecha cambiaria"
    ],
    "hecho": "Trump 'nuevo amigo'. Brecha cambiaria 52.6%."
  },
  {
    "week": "S8",
    "label": "28f–5m",
    "protestas": 38,
    "estados": 14,
    "reprimidas": 1,
    "motivos": [
      "Salarios",
      "Jubilaciones",
      "Pensiones",
      "Educación"
    ],
    "hecho": "Relaciones EE.UU.-VEN restablecidas. Presión salarial crece."
  },
  {
    "week": "S9",
    "label": "6–13 mar",
    "protestas": 65,
    "estados": 23,
    "reprimidas": 0,
    "motivos": [
      "Aumento salarial",
      "Jubilaciones",
      "Pensiones",
      "Laborales"
    ],
    "hecho": "RÉCORD: 39 movilizaciones 12/03 en 23 estados. Inflación 617%.",
    "dias": [
      {
        "fecha": "6 Mar",
        "protestas": 8,
        "estados": 5,
        "tipo": "ESCP",
        "exigencias": "Salarios, jubilaciones, servicios básicos"
      },
      {
        "fecha": "7 Mar",
        "protestas": 6,
        "estados": 4,
        "tipo": "ESCP",
        "exigencias": "Pensiones, salud, vivienda"
      },
      {
        "fecha": "8 Mar",
        "protestas": 4,
        "estados": 3,
        "tipo": "Mixto",
        "exigencias": "Día de la Mujer, laboral, DDHH"
      },
      {
        "fecha": "9 Mar",
        "protestas": 3,
        "estados": 3,
        "tipo": "CPP",
        "exigencias": "Justicia, presos políticos"
      },
      {
        "fecha": "10 Mar",
        "protestas": 5,
        "estados": 4,
        "tipo": "ESCP",
        "exigencias": "Salarios, educación, servicios"
      },
      {
        "fecha": "12 Mar",
        "protestas": 39,
        "estados": 23,
        "tipo": "ESCP dominante",
        "exigencias": "RÉCORD: Aumento salarial coordinado en 23 estados. Superaron piquetes PNB"
      }
    ]
  },
  {
    "week": "S10",
    "label": "13–20 mar",
    "protestas": 46,
    "estados": 14,
    "reprimidas": 0,
    "motivos": [
      "Salarios",
      "Vivienda",
      "Agua",
      "Laborales",
      "DDHH",
      "Participación política"
    ],
    "hecho": "Bono 150 USD + 300M Fondo contienen protestas (65→46). Demandas ESCP 60-65%.",
    "dias": [
      {
        "fecha": "13 Mar",
        "protestas": 14,
        "estados": 6,
        "tipo": "Mixto (ESCP + CPP)",
        "exigencias": "Vivienda, agua, laborales, justicia, DDHH, libertad de expresión"
      },
      {
        "fecha": "16 Mar",
        "protestas": 14,
        "estados": 11,
        "tipo": "Mixto (ESCP + CPP)",
        "exigencias": "Laborales, salud, alimentación, participación política"
      },
      {
        "fecha": "17 Mar",
        "protestas": 5,
        "estados": 4,
        "tipo": "ESCP",
        "exigencias": "Seguridad social, laborales, vivienda"
      },
      {
        "fecha": "18 Mar",
        "protestas": 8,
        "estados": 7,
        "tipo": "Mixto (ESCP + CPP)",
        "exigencias": "Laborales, justicia, educación, participación política"
      },
      {
        "fecha": "19 Mar",
        "protestas": 5,
        "estados": 3,
        "tipo": "CPP dominante",
        "exigencias": "Justicia, presos, DDHH, participación política"
      }
    ]
  },
  {
    "week": "S11",
    "label": "20–29 mar",
    "protestas": 97,
    "estados": 22,
    "reprimidas": 0,
    "motivos": [
      "Aumento salarial",
      "Laborales",
      "Pensiones",
      "Servicios públicos",
      "Presos políticos",
      "Participación política"
    ],
    "hecho": "ESCALAMIENTO: 97 protestas 23–26 mar en 22+ estados. Pico 41 (25 mar, 16 estados). Marcha gremial a CTV en Caracas.",
    "dias": [
      {
        "fecha": "23 Mar (1er)",
        "protestas": 12,
        "estados": 11,
        "tipo": "ESCP",
        "exigencias": "Laborales: salario, bono, OIT, ONAPRE"
      },
      {
        "fecha": "23 Mar (2do)",
        "protestas": 27,
        "estados": 22,
        "tipo": "Mixto (ESCP + DESCA)",
        "exigencias": "Laborales + servicios: agua, electricidad"
      },
      {
        "fecha": "24 Mar",
        "protestas": 15,
        "estados": 9,
        "tipo": "Mixto (ESCP + CPP)",
        "exigencias": "Laborales + libertad de presos políticos"
      },
      {
        "fecha": "25 Mar",
        "protestas": 41,
        "estados": 16,
        "tipo": "ESCP dominante",
        "exigencias": "PICO: Aumento salarial, pensiones + electricidad"
      },
      {
        "fecha": "26 Mar",
        "protestas": 2,
        "estados": 2,
        "tipo": "CPP + DESCA",
        "exigencias": "Participación política + acceso al agua"
      }
    ]
  },
  {
    "week": "S12",
    "label": "30 mar–02 abr",
    "protestas": 11,
    "estados": 9,
    "reprimidas": 0,
    "motivos": [
      "Vivienda",
      "Ambiente sano",
      "Justicia",
      "Laborales",
      "Derechos detenidos",
      "Participación política"
    ],
    "hecho": "Conflictividad sostenida y dispersa: 11 protestas en 4 días, 9 estados. Marcha a Miraflores convocada 9 abril. Salario <1 USD.",
    "dias": [
      {
        "fecha": "30 Mar",
        "protestas": 4,
        "estados": 3,
        "tipo": "ESCP + DESCA",
        "exigencias": "Vivienda, ambiente sano, justicia, laborales"
      },
      {
        "fecha": "31 Mar",
        "protestas": 3,
        "estados": 3,
        "tipo": "ESCP + DESCA",
        "exigencias": "Vivienda, justicia, ambiente sano"
      },
      {
        "fecha": "02 Abr",
        "protestas": 4,
        "estados": 3,
        "tipo": "Mixto (ESCP + CPP)",
        "exigencias": "Laborales, derechos detenidos, participación política"
      }
    ]
  },
  {
    "week": "S13",
    "label": "6–9 abr",
    "protestas": 72,
    "estados": 15,
    "reprimidas": 1,
    "motivos": [
      "Laborales",
      "Pensiones",
      "Salarios",
      "HCM/IPASME",
      "ONAPRE",
      "Justicia",
      "Presos políticos",
      "Vivienda",
      "Educación",
      "Alimentación",
      "Agua"
    ],
    "hecho": "Jornada 9-abr: mayor escalada laboral del período. PNB desplegada con gas pimienta. 10 periodistas SNTP agredidos. Detención Ort Betancourt (PJ). Cabello convoca marcha simultánea oficialista.",
    "dias": [
      {
        "fecha": "6 Abr",
        "protestas": 4,
        "estados": 3,
        "tipo": "CPP + DESCA",
        "exigencias": "Laborales, justicia, vivienda, educación"
      },
      {
        "fecha": "7 Abr",
        "protestas": 4,
        "estados": 3,
        "tipo": "CPP + DESCA",
        "exigencias": "Laborales, justicia, presos políticos, educación"
      },
      {
        "fecha": "8 Abr",
        "protestas": 10,
        "estados": 8,
        "tipo": "DESCA + CPP",
        "exigencias": "Laborales, justicia, presos políticos, alimentación, agua, vivienda"
      },
      {
        "fecha": "9 Abr",
        "protestas": 54,
        "estados": 15,
        "tipo": "Laboral + CPP",
        "exigencias": "Salarios, pensiones, HCM, IPASME, ONAPRE, contratación colectiva, eliminación ONAPRE, rechazo bonos"
      }
    ]
  },
  {
    "week": "S14",
    "label": "10–16 abr",
    "protestas": 47,
    "estados": 15,
    "reprimidas": 0,
    "motivos": [
      "Laborales",
      "Participación política",
      "Justicia",
      "Vivienda",
      "Agua",
      "Alimentación",
      "Libertad de detenidos",
      "Presos políticos",
      "Salud"
    ],
    "hecho": "47 protestas (10–16 abr) en 15 estados — conflictividad sostenida en desaceleración respecto al pico 9-abr (72). Movilización sindical hacia embajada EE.UU. (16 abr): primer caso de presión dirigida a actores internacionales. Politización creciente de exigencias.",
    "dias": [
      {
        "fecha": "10 Abr",
        "protestas": 10,
        "estados": 7,
        "tipo": "DESCA + CPP",
        "exigencias": "Vivienda, agua, justicia, educación, laborales, participación política"
      },
      {
        "fecha": "13 Abr",
        "protestas": 12,
        "estados": 7,
        "tipo": "ESCP + CPP",
        "exigencias": "Laborales, participación política, justicia, libertad de detenidos, vivienda, agua"
      },
      {
        "fecha": "14 Abr",
        "protestas": 8,
        "estados": 7,
        "tipo": "ESCP + DESCA",
        "exigencias": "Laborales, salud, vivienda, educación, agua, justicia, libertad de detenidos"
      },
      {
        "fecha": "15 Abr",
        "protestas": 10,
        "estados": 8,
        "tipo": "Mixto (ESCP + CPP + DESCA)",
        "exigencias": "Laborales, alimentación, participación política, vivienda, agua, justicia"
      },
      {
        "fecha": "16 Abr",
        "protestas": 7,
        "estados": 5,
        "tipo": "ESCP + CPP",
        "exigencias": "Laborales, alimentación, participación política, vivienda, justicia, presos políticos"
      }
    ]
  },
  {
    "week": "S15",
    "label": "17–23 abr",
    "protestas": 46,
    "estados": 18,
    "reprimidas": 0,
    "motivos": [
      "Laborales",
      "Seguridad social",
      "Contratación colectiva",
      "Justicia",
      "Presos políticos",
      "Educación",
      "Vivienda",
      "Gasolina",
      "Derechos de la mujer"
    ],
    "hecho": "46 protestas (17–23 abr). Pico 27 el 22 de abril — paro universitario nacional en 18 estados: mayor coordinación sectorial del mes. Motín Yare III (20 abr): 5 fallecidos en centro de máxima seguridad. Convergencia 1° mayo: Gran Peregrinación oficialista vs. movilización laboral con salario <1 USD.",
    "dias": [
      {
        "fecha": "17 Abr",
        "protestas": 5,
        "estados": 5,
        "tipo": "DESCA + CPP",
        "exigencias": "Vivienda, agua, laborales, salud"
      },
      {
        "fecha": "21 Abr",
        "protestas": 8,
        "estados": 7,
        "tipo": "Mixto (ESCP + CPP)",
        "exigencias": "Laborales, seguridad social, justicia, presos políticos, educación"
      },
      {
        "fecha": "22 Abr",
        "protestas": 27,
        "estados": 18,
        "tipo": "Laboral + ESCP",
        "exigencias": "PARO UNIVERSITARIO: salario ajustado, seguridad social, contratación colectiva"
      },
      {
        "fecha": "23 Abr",
        "protestas": 6,
        "estados": 6,
        "tipo": "Mixto (DESCA + CPP)",
        "exigencias": "Laborales, justicia, vivienda, gasolina, derechos de la mujer"
      }
    ]
  },
  {
    "week": "S16",
    "label": "24–29 abr",
    "protestas": 33,
    "estados": 9,
    "reprimidas": 1,
    "motivos": [
      "Vivienda",
      "Agua",
      "Laborales",
      "Participación política",
      "Seguridad social",
      "Justicia",
      "Seguridad ciudadana"
    ],
    "hecho": "Bloqueo policial de marchas laborales en Caracas (30 abr): cordón PNB impide llegada de trabajadores a Miraflores. Convocatorias escalonadas: marcha laboral 30 abr + movilización 1° mayo. Transición cualitativa: demandas ESCP clásicas hacia participación política y justicia.",
    "dias": [
      {
        "fecha": "24 Abr",
        "protestas": 10,
        "estados": 9,
        "tipo": "ESCP + CPP",
        "exigencias": "Vivienda, agua, justicia, laborales; docentes en Amazonas exigen reincorporación y salario"
      },
      {
        "fecha": "27 Abr",
        "protestas": 1,
        "estados": 1,
        "tipo": "DESCA",
        "exigencias": "Vivienda, agua (Cumaná, Sucre)"
      },
      {
        "fecha": "28 Abr",
        "protestas": 11,
        "estados": 8,
        "tipo": "Mixto (ESCP + CPP)",
        "exigencias": "Vivienda, agua, laborales, participación política, seguridad social; convocatoria marcha laboral 30 abr"
      },
      {
        "fecha": "29 Abr",
        "protestas": 11,
        "estados": 7,
        "tipo": "Mixto (ESCP + CPP)",
        "exigencias": "Vivienda, agua, laborales, justicia, seguridad ciudadana; jubilados convocan protesta 1° mayo"
      }
    ]
  },
  {
    "week": "S17",
    "label": "1–8 may",
    "protestas": 42,
    "estados": 16,
    "reprimidas": 1,
    "motivos": [
      "Exigencias laborales y salariales",
      "Seguridad social y pensiones",
      "Vivienda",
      "Cambio de gobierno",
      "Participación política"
    ],
    "hecho": "El 1° de mayo (Día del Trabajo), 35 protestas simultáneas en 16 estados — pico más alto del período — fueron contenidas mediante despliegue de camiones «murciélagos» del PNB/GNB. El OVCS registró por primera vez exigencias de cambio de gobierno junto con demandas laborales, señalando politización creciente de la conflictividad.",
    "dias": [
      {
        "fecha": "1 Mayo",
        "protestas": 35,
        "estados": 16,
        "tipo": "Mixto",
        "exigencias": "Vivienda, derechos laborales, seguridad social, participación política, cambio de gobierno"
      },
      {
        "fecha": "5 Mayo",
        "protestas": 3,
        "estados": 3,
        "tipo": "Laboral",
        "exigencias": "Derechos laborales, seguridad social, educación"
      },
      {
        "fecha": "6 Mayo",
        "protestas": 4,
        "estados": 4,
        "tipo": "Laboral",
        "exigencias": "Vivienda, participación política, derechos laborales"
      }
    ]
  },
  {
    "week": "S18",
    "label": "8–13 may",
    "protestas": 44,
    "estados": 14,
    "reprimidas": 1,
    "motivos": [
      "Derechos laborales",
      "Justicia",
      "Vivienda",
      "Agua",
      "Salud",
      "Derechos de detenidos",
      "Educación"
    ],
    "hecho": "44 protestas entre el 8 y el 13 de mayo en 14 entidades. Pico de 19 protestas el 8 de mayo. La conflictividad cruza demandas ESCP con justicia, presos políticos, fe de vida y derechos de detenidos.",
    "dias": [
      {
        "fecha": "8 Mayo",
        "protestas": 19,
        "estados": 11,
        "tipo": "Mixto",
        "exigencias": "Vivienda, agua, justicia, educación, derechos laborales, participación política; Lara: libertad, fe de vida y caso Quero Navas"
      },
      {
        "fecha": "11 Mayo",
        "protestas": 8,
        "estados": 6,
        "tipo": "Mixto",
        "exigencias": "Vivienda, agua, justicia, derechos laborales, salud, derechos de detenidos, seguridad social"
      },
      {
        "fecha": "12 Mayo",
        "protestas": 8,
        "estados": 6,
        "tipo": "Laboral",
        "exigencias": "Vivienda, laborales, seguridad social, justicia, derechos de detenidos; docentes APUCV frente al MPPEU"
      },
      {
        "fecha": "13 Mayo",
        "protestas": 9,
        "estados": 7,
        "tipo": "Mixto",
        "exigencias": "Alimentación, educación, laborales, vivienda, salud, agua; estudiantes UCV exigen libertad de presos políticos"
      }
    ]
  },
  {
    "week": "S19",
    "label": "15–21 may",
    "protestas": 47,
    "estados": 19,
    "reprimidas": 1,
    "motivos": [
      "Laborales",
      "Educación",
      "Justicia",
      "Vivienda",
      "Agua",
      "Derechos de detenidos",
      "Participación política"
    ],
    "hecho": "47 protestas en al menos 19 entidades entre el 15 y el 21 de mayo. El 19 de mayo concentra 26 protestas en 16 estados por el paro universitario nacional; el 18 de mayo se documenta represión frente al SEBIN en una movilización por el caso Quero Navas-Carmen Navas.",
    "dias": [
      {
        "fecha": "15 Mayo",
        "protestas": 5,
        "estados": 4,
        "tipo": "Mixto",
        "exigencias": "Vivienda, agua, justicia, vida y derechos de personas detenidas"
      },
      {
        "fecha": "18 Mayo",
        "protestas": 10,
        "estados": 7,
        "tipo": "Mixto",
        "exigencias": "Justicia, libertad de presos políticos, salud, vivienda, electricidad y combustible"
      },
      {
        "fecha": "19 Mayo",
        "protestas": 26,
        "estados": 16,
        "tipo": "Laboral/educación",
        "exigencias": "Paro universitario nacional; laborales, educación, justicia, participación política, vivienda y agua"
      },
      {
        "fecha": "21 Mayo",
        "protestas": 6,
        "estados": 4,
        "tipo": "Laboral",
        "exigencias": "Laborales, educación, vivienda y participación política; UCV y autopista Gran Cacique Guaicaipuro"
      }
    ]
  },
  {
    "week": "S20",
    "label": "22–27 may",
    "protestas": 43,
    "estados": 17,
    "reprimidas": 0,
    "motivos": [
      "Vivienda",
      "Agua",
      "Justicia",
      "Educación",
      "Laborales",
      "Salud",
      "Derechos de detenidos",
      "Participación política",
      "Medio ambiente"
    ],
    "hecho": "43 protestas entre el 22 y el 27 de mayo en 17 entidades. Las demandas de agua, vivienda y justicia aparecen durante todo el período; desde el 25 de mayo se sostiene la categoría de derechos de personas detenidas y encarceladas.",
    "dias": [
      {
        "fecha": "22 Mayo",
        "protestas": 13,
        "estados": 8,
        "tipo": "Mixto",
        "exigencias": "Vivienda, agua, justicia, educación, laborales, participación política, derechos de la mujer, salud y medio ambiente"
      },
      {
        "fecha": "25 Mayo",
        "protestas": 11,
        "estados": 11,
        "tipo": "Mixto",
        "exigencias": "Vivienda, agua, justicia, educación, laborales, salud y derechos de personas detenidas"
      },
      {
        "fecha": "26 Mayo",
        "protestas": 7,
        "estados": 6,
        "tipo": "Mixto",
        "exigencias": "Vivienda, agua, justicia y derechos de personas detenidas y encarceladas"
      },
      {
        "fecha": "27 Mayo",
        "protestas": 12,
        "estados": 9,
        "tipo": "Mixto",
        "exigencias": "Vivienda, agua, justicia, laborales, derechos de detenidos, participación política y salud"
      }
    ]
  },
  {
    "week": "S21",
    "label": "29 may–4 jun",
    "protestas": 42,
    "estados": 15,
    "reprimidas": 0,
    "motivos": [
      "Laborales",
      "Seguridad social",
      "Vivienda",
      "Agua",
      "Justicia",
      "Salud",
      "Educación",
      "Participación política",
      "Derechos de detenidos"
    ],
    "hecho": "42 protestas entre el 29 de mayo y el 4 de junio en 15 entidades. La marcha del 3 de junio desde Chacaíto hasta la Embajada de EE.UU. concentró demandas por presos políticos, calendario electoral y salarios, sin represión sistémica documentada.",
    "dias": [
      { "fecha": "29 Mayo", "protestas": 15, "estados": 12, "tipo": "Mixto", "exigencias": "Laborales, seguridad social, vivienda, agua, justicia, salud, educación y derechos de detenidos" },
      { "fecha": "2 Junio", "protestas": 8, "estados": 5, "tipo": "Mixto", "exigencias": "Servicios básicos, laborales, vivienda, salud y justicia" },
      { "fecha": "3 Junio", "protestas": 10, "estados": 7, "tipo": "Político/laboral", "exigencias": "Marcha Chacaíto–Embajada de EE.UU.; presos políticos, calendario electoral y salarios" },
      { "fecha": "4 Junio", "protestas": 9, "estados": 8, "tipo": "Mixto", "exigencias": "Laborales, educación, agua, vivienda, salud y justicia" }
    ]
  },
  {
    "week": "S22",
    "label": "4–10 jun",
    "protestas": 75,
    "estados": 19,
    "reprimidas": 0,
    "motivos": [
      "Laborales",
      "Seguridad social",
      "Vivienda",
      "Agua",
      "Justicia",
      "Salud",
      "Educación",
      "Participación política",
      "Derechos de detenidos",
      "Propiedad"
    ],
    "hecho": "75 protestas entre el 4 y el 10 de junio en 19 entidades, máximo del ciclo reciente. Las vigilias de familiares de presos políticos frente a la Embajada de EE.UU. y la concentración sindical ante el CNE elevaron el peso político de la conflictividad.",
    "dias": [
      { "fecha": "4 Junio", "protestas": 9, "estados": 8, "tipo": "Mixto", "exigencias": "Laborales, seguridad social, vivienda, justicia, salud, educación, participación política y derechos de detenidos" },
      { "fecha": "5 Junio", "protestas": 15, "estados": 8, "tipo": "Mixto", "exigencias": "Vivienda, agua, justicia, participación política, seguridad social y laborales" },
      { "fecha": "8 Junio", "protestas": 19, "estados": 13, "tipo": "Mixto", "exigencias": "Vivienda, agua, justicia, derechos de detenidos, participación política, laborales, educación y propiedad" },
      { "fecha": "9 Junio", "protestas": 12, "estados": 9, "tipo": "Derechos humanos", "exigencias": "Justicia, derechos de detenidos, participación política, laborales, educación y vivienda" },
      { "fecha": "10 Junio", "protestas": 20, "estados": 13, "tipo": "Laboral/político", "exigencias": "Justicia, derechos de detenidos, participación política, laborales, educación y defensa de derechos" }
    ]
  },
  {
    "week": "S23",
    "label": "12–17 jun",
    "protestas": 27,
    "estados": 13,
    "reprimidas": 0,
    "motivos": [
      "Laborales",
      "Seguridad social",
      "Servicios básicos",
      "Electricidad",
      "Justicia",
      "Participación política"
    ],
    "hecho": "27 protestas en 13 estados durante el período 12–17 de junio. La conflictividad social se mantiene desacoplada de la apertura de élites: demandas laborales, seguridad social y servicios coinciden con el inicio de la mesa técnica AN–Figuera.",
    "dias": [
      { "fecha": "12–17 Junio", "protestas": 27, "estados": 13, "tipo": "Mixto", "exigencias": "Laborales, seguridad social, servicios básicos, electricidad, justicia y participación política" }
    ]
  },
  {
    "week": "S24",
    "label": "19–26 jun",
    "protestas": 0,
    "estados": 0,
    "reprimidas": 0,
    "motivos": [
      "Emergencia sísmica",
      "Servicios básicos",
      "Reconstrucción",
      "Ayuda humanitaria",
      "Electricidad",
      "Telecomunicaciones"
    ],
    "hecho": "La agenda social del período queda dominada por el doblete sísmico del 24 de junio: víctimas, daños, electricidad, telecomunicaciones, réplicas y acceso a ayuda humanitaria pasan a ser los principales vectores de seguimiento.",
    "dias": [
      { "fecha": "24 Junio", "protestas": 0, "estados": 0, "tipo": "Emergencia", "exigencias": "Atención a víctimas, reconstrucción, servicios básicos, electricidad, telecomunicaciones y coordinación de ayuda" }
    ]
  },
  {
    "week": "S25",
    "label": "26 jun–3 jul",
    "protestas": 0,
    "estados": 0,
    "reprimidas": 0,
    "motivos": [
      "Ayuda humanitaria",
      "Vivienda",
      "Servicios básicos",
      "Transparencia",
      "Libertad de información"
    ],
    "hecho": "Sin conteo semanal verificable de protestas en el documento fuente. La presión social se expresa en una desaprobación superior al 86% de la gestión de la emergencia y en disputas por el acceso a la ayuda y a la información.",
    "dias": [
      { "fecha": "26 Junio–3 Julio", "protestas": 0, "estados": 0, "tipo": "Emergencia/legitimidad", "exigencias": "Ayuda humanitaria, vivienda, servicios, transparencia y acceso de prensa" }
    ]
  },
  {
    "week": "S26",
    "label": "3–9 jul",
    "protestas": 15,
    "estados": 10,
    "reprimidas": 0,
    "motivos": ["Justicia", "Derechos laborales", "Participación política", "Salud", "Vivienda", "Derechos de niños y adolescentes"],
    "hecho": "El OVCS registra 15 protestas en tres jornadas y 10 entidades. Las demandas sociales se conectan con la controversia constitucional y la exigencia de elecciones.",
    "dias": [
      { "fecha": "3 Julio", "protestas": 5, "estados": 5, "tipo": "Político/social", "exigencias": "Justicia, participación política, derechos laborales y vivienda" },
      { "fecha": "6 Julio", "protestas": 5, "estados": 4, "tipo": "Social", "exigencias": "Justicia, derechos laborales y salud" },
      { "fecha": "8 Julio", "protestas": 5, "estados": 4, "tipo": "Político/social", "exigencias": "Justicia, trabajo, participación política, salud y derechos de NNA" }
    ]
  },
  {
    "week": "S27",
    "label": "10–17 jul",
    "protestas": 0,
    "estados": 0,
    "reprimidas": 0,
    "motivos": ["Sin conteo verificable", "Reconstrucción", "Inflación", "Garantías electorales", "TPS y remesas"],
    "hecho": "El documento fuente no incorpora un conteo de protestas para el período. El monitoreo social se concentra en inflación, campamentos, garantías electorales y la amenaza sobre TPS y remesas.",
    "dias": [
      { "fecha": "10–17 Julio", "protestas": 0, "estados": 0, "tipo": "Sin conteo verificable", "exigencias": "Reconstrucción, precios, garantías electorales y protección migratoria" }
    ]
  }
];
