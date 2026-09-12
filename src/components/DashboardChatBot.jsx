import { ChatBot } from "./ChatBot";
import { WEEKS, TENSIONS, KPIS_LATEST } from "../data/weekly.js";
import { SITREP_ALL } from "../data/sitrep.js";
import { WEEK_DRIVERS } from "../data/weekDrivers.js";
import { SCENARIO_SIGNALS, INDICATORS } from "../data/indicators.js";
import { PROSPECTIVA_SESSIONS } from "../data/prospectiva.js";
import { CONF_HISTORICO, CONF_MESES, CONF_DERECHOS, CONF_SERVICIOS, CONF_ESTADOS } from "../data/conflictividad.js";
import { CONF_MENSUAL_2026 } from "../data/confMensual2026.js";
import { AMNISTIA_TRACKER } from "../data/amnistia.js";

export default function DashboardChatBot({ liveData }) {
  return (
    <ChatBot
      weeks={WEEKS}
      liveData={liveData}
      signals={SCENARIO_SIGNALS}
      weekDrivers={WEEK_DRIVERS}
      indicators={INDICATORS}
      sitrep={SITREP_ALL}
      prospectiva={PROSPECTIVA_SESSIONS}
      tensions={TENSIONS}
      kpis={KPIS_LATEST}
      conflictividad={{
        historico:CONF_HISTORICO,
        meses:CONF_MESES,
        derechos:CONF_DERECHOS,
        servicios:CONF_SERVICIOS,
        estados:CONF_ESTADOS,
      }}
      confMensual={CONF_MENSUAL_2026}
      amnistia={AMNISTIA_TRACKER}
    />
  );
}
