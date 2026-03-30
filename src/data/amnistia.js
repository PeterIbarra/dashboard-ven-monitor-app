// Amnistía tracker — updated weekly

export const AMNISTIA_TRACKER = [
  // { week, label, gobierno (cifras oficiales), fp (Foro Penal verificado), detenidos (FP), cautelares, militares, hito }
  { week:"S1", label:"3–15 ene", gob:{ solicitudes:null, libertades:null, excarcelados:101 }, fp:{ verificados:0, detenidos:null }, hito:"Primeras 101 excarcelaciones (14 periodistas)" },
  { week:"S2", label:"16–22 ene", gob:{ solicitudes:null, libertades:null, excarcelados:400 }, fp:{ verificados:12, detenidos:null }, hito:"Rodríguez: '400 excarcelaciones'. FP: 12 verificadas" },
  { week:"S3", label:"23–29 ene", gob:{ solicitudes:null, libertades:null, excarcelados:null }, fp:{ verificados:45, detenidos:null }, hito:"Ley de Amnistía en primera discusión" },
  { week:"S4", label:"30e–5f", gob:{ solicitudes:null, libertades:null, excarcelados:null }, fp:{ verificados:78, detenidos:949 }, hito:"Amnistía arts. 7-13 diferidos. Cierre El Helicoide" },
  { week:"S5", label:"6–13 feb", gob:{ solicitudes:null, libertades:897, excarcelados:448 }, fp:{ verificados:108, detenidos:626 }, hito:"Amnistía 2ª discusión. Brecha: 897 vs ~430" },
  { week:"S6", label:"13–20 feb", gob:{ solicitudes:null, libertades:895, excarcelados:448 }, fp:{ verificados:126, detenidos:568 }, hito:"Ley promulgada 19 feb. 895 oficial vs 383 verif." },
  { week:"S7", label:"20–27 feb", gob:{ solicitudes:4203, libertades:3231, excarcelados:null }, fp:{ verificados:126, detenidos:568 }, hito:"Amnistía operativa: 4.203 solicitudes procesadas" },
  { week:"S8", label:"27f–6m", gob:{ solicitudes:9060, libertades:5628, excarcelados:245, cautelares:5383, militares:31 }, fp:{ verificados:670, detenidos:568 }, hito:"9.060 solicitudes · FP: 670 excarcelaciones verificadas (8 mar)" },
  { week:"S9", label:"6–13m", gob:{ solicitudes:null, libertades:7727, excarcelados:null, cautelares:null, militares:null }, fp:{ verificados:670, detenidos:508 }, hito:"7.727 beneficiados Ley de Amnistía · 508 presos políticos · Guanipa sobreseído · Dávila libertad plena" },
  { week:"S10", label:"13–20m", gob:{ solicitudes:null, libertades:7580, excarcelados:690, cautelares:null, militares:null }, fp:{ verificados:690, detenidos:515 }, hito:"7.580 beneficiados · 690 excarcelados (FP) · 515 presos · 24% solicitudes rechazadas · mecanismo exterior habilitado" },
  { week:"S11", label:"20–29m", gob:{ solicitudes:11559, libertades:8146, excarcelados:310, cautelares:7836, militares:null }, fp:{ verificados:690, detenidos:515, militares:179 }, hito:"8.146 libertades plenas · 11.559 solicitudes · prórroga 30 días · MCM denuncia 179 presos militares · Pilieri libre" },
];
