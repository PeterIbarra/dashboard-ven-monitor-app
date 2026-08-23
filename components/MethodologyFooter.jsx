import { useState } from "react";
import { BORDER, TEXT, MUTED, ACCENT, font, fontSans } from "../constants";

export function MethodologyFooter({ mob }) {
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
              Es un número de <b>0 a 100</b> que resume "qué tan inestable está la situación" combinando 19 factores diferentes. Funciona como un termómetro:<br/><br/>
              <b style={{color:"#16a34a"}}>0-25</b>: Estabilidad relativa — las cosas están relativamente calmadas.<br/>
              <b style={{color:"#ca8a04"}}>26-50</b>: Tensión moderada — hay presiones pero están contenidas.<br/>
              <b style={{color:"#f97316"}}>51-75</b>: Inestabilidad alta — múltiples factores de riesgo activos.<br/>
              <b style={{color:"#dc2626"}}>76-100</b>: Crisis inminente — situación crítica en varios frentes.<br/><br/>
              <b>¿Cómo se calcula?</b> Cada factor tiene un peso (%). Los factores de riesgo suman y los estabilizadores restan. Por ejemplo:<br/><br/>
              • Si la <b>brecha cambiaria</b> (diferencia entre dólar oficial y paralelo) es alta, el índice sube — porque indica presión económica.<br/>
              • Si el <b>precio del petróleo</b> baja mucho, el índice sube — porque Venezuela depende del petróleo para sus ingresos.<br/>
              • Si la probabilidad de <b>E1 (transición pacífica)</b> es alta, el índice baja — porque es un factor estabilizador.<br/><br/>
              <b>3 de los 19 factores se actualizan solos</b> en tiempo real (brecha cambiaria, petróleo, índice bilateral). Los demás se actualizan con cada informe semanal.
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
