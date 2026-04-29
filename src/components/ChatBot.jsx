import { useState, useRef, useEffect } from "react";
import { BG2, BG3, BORDER, TEXT, MUTED, ACCENT, SEM, font, fontSans } from "../constants";

const MAX_TOOL_ROUNDS = 3;

const SUGGESTED = [
  "¿Cuál es el escenario dominante esta semana y por qué?",
  "¿Qué implicaciones tiene E3 para el portafolio del PNUD?",
  "¿Cómo ha evolucionado la conflictividad en relación con los escenarios?",
  "¿Qué señales deberían preocuparnos más esta semana?",
  "¿Cómo avanza el proceso de amnistía política?",
];

// ── Markdown renderer ─────────────────────────────────────────────────────────

function renderMarkdown(raw) {
  const lines = raw.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { tableLines.push(lines[i]); i++; }
      const rows = tableLines.filter(l => !/^\s*\|[\s\-|:]+\|\s*$/.test(l));
      if (rows.length > 0) {
        let html = `<table style="width:100%;border-collapse:collapse;font-size:11px;margin:8px 0">`;
        rows.forEach((row, ri) => {
          const cells = row.split("|").map(c => c.trim()).filter((_, ci, a) => ci > 0 && ci < a.length - 1);
          const tag = ri === 0 ? "th" : "td";
          const cs = ri === 0
            ? "text-align:left;padding:5px 8px;border:1px solid #d0d7e0;background:#eef1f5;font-weight:600;color:#5a6a7a"
            : "text-align:left;padding:5px 8px;border:1px solid #d0d7e0;color:#1a202c;vertical-align:top";
          html += `<tr>${cells.map(c => `<${tag} style="${cs}">${renderInline(c)}</${tag}>`).join("")}</tr>`;
        });
        out.push(html + "</table>");
      }
      continue;
    }
    const h = line.match(/^#{1,4} (.+)$/);
    if (h) { out.push(`<div style="font-weight:700;margin:8px 0 4px;color:#1a202c">${renderInline(h[1])}</div>`); i++; continue; }
    const ul = line.match(/^[\-\*] (.+)$/);
    if (ul) { out.push(`<div style="padding-left:12px;margin:2px 0">&#8226;&nbsp;${renderInline(ul[1])}</div>`); i++; continue; }
    const ol = line.match(/^(\d+)\. (.+)$/);
    if (ol) { out.push(`<div style="padding-left:12px;margin:2px 0">${ol[1]}.&nbsp;${renderInline(ol[2])}</div>`); i++; continue; }
    if (line.trim() === "") { out.push("<div style='height:6px'></div>"); i++; continue; }
    out.push(`<div style="margin:2px 0">${renderInline(line)}</div>`);
    i++;
  }
  return out.join("");
}

function renderInline(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:#eef1f5;padding:1px 4px;border-radius:3px;font-size:10px">$1</code>');
}

// ── Tool executors ────────────────────────────────────────────────────────────

function buildExecutors({ weeks, liveData, signals, indicators, sitrep,
  prospectiva, tensions, kpis, conflictividad, confMensual, amnistia }) {

  const names = { 1:"Transición democrática", 2:"Colapso y fragmentación", 3:"Continuidad negociada", 4:"Resistencia y escalada" };

  function buildFallbackContext() {
    const lines = [];
    lines.push("=== HISTORIAL SEMANAL ===");
    weeks?.forEach((w, i) => {
      const probStr = w.probs?.slice().sort((a,b)=>b.v-a.v).map(p=>`E${p.sc}=${p.v}%`).join(", ")||"";
      lines.push(`S${i+1} (${w.label}): [${probStr}] ${w.lectura?.slice(0,120)||""}`);
    });
    lines.push("\n=== SEÑALES ACTIVAS ===");
    signals?.forEach(g=>{
      const live=g.signals.filter(s=>!s.vigpierde);
      lines.push(`${g.esc}: ${live.map(s=>`[${s.sem}] ${s.name}`).join(" · ")}`);
    });
    if (tensions?.length) {
      lines.push("\n=== TENSIONES ===");
      tensions.forEach(t=>lines.push(`[${t.level}] ${t.text?.replace(/<[^>]+>/g,"").slice(0,100)}`));
    }
    return lines.join("\n");
  }

  return {
    buildFallbackContext,

    get_weekly_history: ({ semanas }={}) => {
      const data = semanas?.length ? weeks?.filter((_,i)=>semanas.includes(`S${i+1}`)) : weeks;
      return JSON.stringify(data?.map((w,i)=>({
        semana:`S${i+1}`, label:w.label,
        probabilidades: w.probs?.slice().sort((a,b)=>b.v-a.v).map(p=>({ escenario:`E${p.sc}`, nombre:names[p.sc], porcentaje:p.v })),
        dominante: (()=>{ const d=w.probs?.reduce((a,b)=>a.v>b.v?a:b); return d?`E${d.sc} (${names[d.sc]}) ${d.v}%`:null; })(),
        lectura: w.lectura?.slice(0,400),
      })));
    },

    get_signals: ({ escenario }={}) => {
      const data = (!escenario||escenario==="all") ? signals : signals?.filter(g=>g.esc===escenario);
      return JSON.stringify(data?.map(g=>({
        escenario:g.esc,
        senales:g.signals.filter(s=>!s.vigpierde).map(s=>({ nombre:s.name, estado:s.sem, valor:s.val, nueva:!!s.isNew }))
      })));
    },

    get_sitrep: ({ semana }={}) => {
      if (!sitrep?.length) return JSON.stringify({ error:"Sin datos SITREP" });
      const entry = (!semana||semana==="ultima")
        ? sitrep[sitrep.length-1]
        : sitrep.find((s,i)=>
            `s${i+1}`===semana.toLowerCase() ||
            s.periodShort?.toLowerCase().includes(semana.toLowerCase()) ||
            s.period?.toLowerCase().includes(semana.toLowerCase()));
      if (!entry) return JSON.stringify({ error:`SITREP ${semana} no encontrado` });
      return JSON.stringify({
        periodo: entry.periodShort||entry.period,
        sintesis: entry.sintesis,
        puntosClave: (entry.keyPoints||[]).map(k=>({ titulo:k.title, detalle:k.detail })),
        dimensiones: entry.dims,
      });
    },

    get_conflictividad: () => JSON.stringify({
      historico_anual: conflictividad?.historico,
      meses_2026: conflictividad?.meses,
      por_derecho: conflictividad?.derechos,
      por_servicio: conflictividad?.servicios,
      por_estado: conflictividad?.estados,
      mensual_2026: confMensual,
    }),

    get_tensions: () => JSON.stringify(tensions?.map(t=>({
      nivel:t.level, descripcion:t.text?.replace(/<[^>]+>/g,"")
    }))),

    get_kpis: () => JSON.stringify(kpis),

    get_indicators: ({ dimension }={}) => {
      const data = dimension ? indicators?.filter(ind=>ind.dim?.toLowerCase().includes(dimension.toLowerCase())) : indicators;
      return JSON.stringify(data?.map(ind=>({ dimension:ind.dim, nombre:ind.name, descripcion:ind.desc, estado:ind.sem, escenario:ind.esc })));
    },

    get_prospectiva: () => JSON.stringify(prospectiva),

    get_amnistia: () => JSON.stringify(amnistia),

    get_live_data: () => {
      if (!liveData?.fetched) return JSON.stringify({ nota:"Datos en tiempo real no disponibles aún" });
      return JSON.stringify({ tasa_bcv:liveData.dolar?.bcv, dolar_paralelo:liveData.dolar?.paralelo, brecha:liveData.dolar?.brecha, brent:liveData.oil?.brent, wti:liveData.oil?.wti });
    },
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatBot({ weeks, liveData, signals, weekDrivers, indicators, sitrep,
  prospectiva, tensions, kpis, conflictividad, confMensual, amnistia }) {

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [display, setDisplay] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [display, open, loading]);
  useEffect(() => { if (open) setTimeout(()=>inputRef.current?.focus(), 100); }, [open]);

  const executors = buildExecutors({ weeks, liveData, signals, indicators, sitrep,
    prospectiva, tensions, kpis, conflictividad, confMensual, amnistia });

  const toolLabel = n => ({ get_weekly_history:"historial", get_signals:"señales", get_sitrep:"SITREP",
    get_conflictividad:"conflictividad", get_tensions:"tensiones", get_kpis:"KPIs",
    get_indicators:"indicadores", get_prospectiva:"prospectiva", get_amnistia:"amnistía",
    get_live_data:"datos en vivo" }[n] || n.replace("get_",""));

  async function send(text) {
    const question = text.trim();
    if (!question || loading) return;
    setInput(""); setError(null); setLoading(true);

    const userMsg = { role:"user", content:question };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setDisplay(prev => [...prev, { role:"user", content:question }]);

    let cur = newMessages;
    let rounds = 0;
    let toolsUsed = [];

    try {
      while (rounds < MAX_TOOL_ROUNDS) {
        rounds++;
        setLoadingMsg(rounds === 1 ? "analizando consulta..." : `consultando herramientas (ronda ${rounds})...`);

        const res = await fetch("/api/ai", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ messages:cur, use_tools:true, max_tokens:2500 }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Fallback: tool providers failed
        if (data.fallback) {
          setLoadingMsg("modo alternativo...");
          const ctx = executors.buildFallbackContext();
          const fp = `${ctx}\n\n=== CONVERSACIÓN ===\n${cur.map(m=>`${m.role==="user"?"Usuario":"Asistente"}: ${m.content}`).join("\n\n")}\n\nAsistente:`;
          const fr = await fetch("/api/ai", { method:"POST", headers:{"Content-Type":"application/json"},
            body:JSON.stringify({ prompt:fp, max_tokens:2500 }) });
          const fd = await fr.json();
          if (fd.text) {
            setProvider(fd.provider+" (fallback)");
            const aMsg = { role:"assistant", content:fd.text };
            setDisplay(prev=>[...prev, { ...aMsg }]);
            setMessages(prev=>[...prev, aMsg]);
          } else setError("Sin respuesta disponible.");
          break;
        }

        // Text response: done
        if (data.text) {
          setProvider(data.provider);
          setDisplay(prev=>[...prev, { role:"assistant", content:data.text, toolsUsed:toolsUsed.length?toolsUsed:null }]);
          setMessages(prev=>[...prev, { role:"assistant", content:data.text }]);
          break;
        }

        // Tool calls: execute locally in parallel
        if (data.tool_calls?.length) {
          setProvider(data.provider);
          data.tool_calls.forEach(tc=>{ if (!toolsUsed.includes(tc.function?.name)) toolsUsed.push(tc.function?.name); });
          setLoadingMsg(`consultando: ${toolsUsed.map(toolLabel).join(", ")}...`);

          cur = [...cur, data.assistant_message];
          const toolResults = await Promise.all(data.tool_calls.map(async tc => {
            const name = tc.function?.name;
            const args = (() => { try { return JSON.parse(tc.function?.arguments||"{}"); } catch { return {}; } })();
            let result = "{}";
            try { result = executors[name] ? executors[name](args) : JSON.stringify({ error:`Herramienta '${name}' no encontrada` }); }
            catch (e) { result = JSON.stringify({ error:e.message }); }
            return { role:"tool", tool_call_id:tc.id, content:result };
          }));
          cur = [...cur, ...toolResults];
          continue;
        }

        setError("Respuesta inesperada del modelo."); break;
      }
    } catch (err) {
      setError("Error de conexión: "+err.message);
    } finally {
      setLoading(false); setLoadingMsg("");
    }
  }

  const handleKey = e => { if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); send(input); } };

  const panelStyle = expanded ? {
    position:"fixed", top:0, left:0, right:0, bottom:0, width:"100vw", height:"100vh",
    maxWidth:"none", maxHeight:"none", background:BG2, border:"none", borderRadius:0,
    boxShadow:"none", display:"flex", flexDirection:"column", zIndex:1000, overflow:"hidden",
  } : {
    position:"fixed", bottom:80, right:20, width:390, maxWidth:"calc(100vw - 32px)", maxHeight:"70vh",
    background:BG2, border:`1px solid ${BORDER}`, borderRadius:12,
    boxShadow:"0 8px 32px rgba(0,0,0,0.12)", display:"flex", flexDirection:"column", zIndex:1000, overflow:"hidden",
  };

  return (
    <>
      {!expanded && (
        <button style={{
          position:"fixed", bottom:20, right:20, width:52, height:52, borderRadius:"50%",
          background:ACCENT, border:"none", cursor:"pointer", display:"flex",
          alignItems:"center", justifyContent:"center", zIndex:1001,
          boxShadow:"0 4px 12px rgba(4,104,177,0.35)", transition:"transform 0.15s", color:"white", fontSize:22,
        }} onClick={()=>setOpen(v=>!v)} title="Asistente del Monitor"
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.08)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
          {open?"✕":"💬"}
        </button>
      )}

      {open && (
        <div style={panelStyle}>

          {/* Header */}
          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${BORDER}`,
            background:`linear-gradient(135deg, ${ACCENT}12, ${BG3})`,
            flexShrink:0, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontFamily:font, fontSize:12, color:ACCENT, marginBottom:2 }}>ASISTENTE · MONITOR VEN 2026</div>
              <div style={{ fontFamily:fontSans, fontSize:12, color:MUTED }}>S1–S{weeks?.length} en contexto · function calling</div>
              {provider && <div style={{ fontFamily:font, fontSize:9, color:MUTED, marginTop:3 }}>vía {provider}</div>}
            </div>
            <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
              {display.length > 0 && (
                <button onClick={()=>{ setMessages([]); setDisplay([]); setProvider(null); setError(null); }} style={{
                  fontFamily:font, fontSize:9, color:MUTED, background:"transparent",
                  border:`1px solid ${BORDER}`, borderRadius:6, padding:"3px 8px", cursor:"pointer" }}>limpiar</button>
              )}
              <button onClick={()=>setExpanded(v=>!v)} style={{
                background:"transparent", border:`1px solid ${BORDER}`, borderRadius:6,
                width:26, height:26, cursor:"pointer", color:MUTED, fontSize:13,
                display:"flex", alignItems:"center", justifyContent:"center" }}>{expanded?"⊡":"⊞"}</button>
              <button onClick={()=>{ setOpen(false); setExpanded(false); }} style={{
                background:"transparent", border:`1px solid ${BORDER}`, borderRadius:6,
                width:26, height:26, cursor:"pointer", color:MUTED, fontSize:14,
                display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto",
            padding: expanded ? "20px calc(50% - 400px)" : "12px 14px",
            display:"flex", flexDirection:"column", gap:10 }}>

            {display.length === 0 && (
              <div>
                <div style={{ fontFamily:fontSans, fontSize:12, color:MUTED, marginBottom:10 }}>
                  Pregunta sobre escenarios, conflictividad, amnistía, portafolio PNUD o cualquier dato del dashboard.
                </div>
                {SUGGESTED.map((q,i)=>(
                  <button key={i} onClick={()=>send(q)} style={{
                    display:"block", width:"100%", textAlign:"left", fontFamily:fontSans, fontSize:11,
                    color:ACCENT, background:`${ACCENT}08`, border:`1px solid ${ACCENT}25`,
                    borderRadius:8, padding:"7px 10px", marginBottom:6, cursor:"pointer",
                    lineHeight:1.4, transition:"background 0.15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background=`${ACCENT}15`}
                    onMouseLeave={e=>e.currentTarget.style.background=`${ACCENT}08`}>{q}</button>
                ))}
              </div>
            )}

            {display.map((m,i)=>(
              <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:m.role==="user"?"flex-end":"flex-start" }}>
                {m.toolsUsed?.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:4 }}>
                    {m.toolsUsed.map((t,ti)=>(
                      <span key={ti} style={{ fontFamily:font, fontSize:9, color:MUTED,
                        background:BG3, border:`1px solid ${BORDER}`, borderRadius:10, padding:"2px 6px" }}>
                        🔧 {toolLabel(t)}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{
                  maxWidth:"90%", fontFamily:fontSans, fontSize:12, lineHeight:1.6,
                  padding:"8px 12px",
                  borderRadius:m.role==="user"?"12px 12px 3px 12px":"12px 12px 12px 3px",
                  background:m.role==="user"?ACCENT:BG3, color:m.role==="user"?"white":TEXT,
                  border:m.role==="user"?"none":`1px solid ${BORDER}`,
                  whiteSpace:m.role==="user"?"pre-wrap":"normal" }}
                  dangerouslySetInnerHTML={m.role==="assistant"?{ __html:renderMarkdown(m.content) }:undefined}>
                  {m.role==="user"?m.content:undefined}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display:"flex", alignItems:"flex-start" }}>
                <div style={{ background:BG3, border:`1px solid ${BORDER}`,
                  borderRadius:"12px 12px 12px 3px", padding:"8px 14px",
                  fontFamily:font, fontSize:11, color:MUTED }}>{loadingMsg||"procesando..."}</div>
              </div>
            )}

            {error && (
              <div style={{ fontFamily:fontSans, fontSize:11, color:SEM.red,
                background:"#fef2f2", border:"1px solid #fecaca",
                borderRadius:8, padding:"7px 10px" }}>{error}</div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding:"10px 12px", borderTop:`1px solid ${BORDER}`,
            display:"flex", gap:8, flexShrink:0, background:BG2 }}>
            <textarea ref={inputRef} value={input}
              onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Pregunta sobre el dashboard..." rows={1}
              style={{ flex:1, fontFamily:fontSans, fontSize:12, color:TEXT,
                background:BG3, border:`1px solid ${BORDER}`,
                borderRadius:8, padding:"8px 10px", resize:"none", outline:"none", lineHeight:1.5 }} />
            <button onClick={()=>send(input)} disabled={!input.trim()||loading} style={{
              fontFamily:font, fontSize:11,
              background:input.trim()&&!loading?ACCENT:BG3,
              color:input.trim()&&!loading?"white":MUTED,
              border:`1px solid ${input.trim()&&!loading?ACCENT:BORDER}`,
              borderRadius:8, padding:"0 14px",
              cursor:input.trim()&&!loading?"pointer":"default",
              transition:"all 0.15s", flexShrink:0 }}>↑</button>
          </div>
        </div>
      )}
    </>
  );
}
