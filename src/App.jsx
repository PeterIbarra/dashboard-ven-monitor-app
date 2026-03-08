import { useState, useEffect, useMemo, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// DATA — All inline for single-file artifact
// ═══════════════════════════════════════════════════════════════

const SCENARIOS = [
  { id:1, name:"Transición política pacífica", short:"Transición", color:"#4C9F38" },
  { id:2, name:"Colapso y fragmentación", short:"Colapso", color:"#E5243B" },
  { id:3, name:"Continuidad negociada", short:"Continuidad", color:"#0A97D9" },
  { id:4, name:"Resistencia coercitiva", short:"Resistencia", color:"#FCC30B" },
];

const WEEKS = [
  { label:"3–15 ene", short:"S1", probs:[{sc:1,v:5},{sc:2,v:45},{sc:3,v:40},{sc:4,v:10}], xy:{x:0.43,y:0.44} },
  { label:"16–22 ene", short:"S2", probs:[{sc:1,v:15},{sc:2,v:25},{sc:3,v:50},{sc:4,v:10}], xy:{x:0.25,y:0.28} },
  { label:"23–29 ene", short:"S3", probs:[{sc:1,v:20},{sc:2,v:10},{sc:3,v:60},{sc:4,v:10}], xy:{x:0.21,y:0.33} },
  { label:"30e–5f", short:"S4", probs:[{sc:1,v:30},{sc:2,v:5},{sc:3,v:50},{sc:4,v:15}], xy:{x:0.19,y:0.35} },
  { label:"6–13 feb", short:"S5", probs:[{sc:1,v:30},{sc:2,v:5},{sc:3,v:45},{sc:4,v:20}], xy:{x:0.18,y:0.40} },
  { label:"13–20 feb", short:"S6", probs:[{sc:1,v:35},{sc:2,v:15},{sc:3,v:40},{sc:4,v:10}], xy:{x:0.17,y:0.46} },
  { label:"20–27 feb", short:"S7", probs:[{sc:1,v:30},{sc:2,v:10},{sc:3,v:50},{sc:4,v:10}], xy:{x:0.16,y:0.48} },
];

const KPIS_LATEST = {
  energia: [
    { k:"Exportaciones", v:"~800 kbd", c:"#22c55e" },
    { k:"Ingresos proy.", v:"USD 6.000M", c:"#22c55e" },
    { k:"Licencias OFAC", v:"GL49+GL50/50A", c:"#38bdf8" },
    { k:"Brecha cambiaria", v:"52,6%", c:"#ef4444" },
  ],
  politico: [
    { k:"Amnistía", v:"4.203 solicitudes", c:"#22c55e" },
    { k:"Presos políticos", v:"568 (Foro Penal)", c:"#ef4444" },
    { k:"Agenda electoral", v:"Sin fecha", c:"#ef4444" },
    { k:"Poder Ciudadano", v:"Encargados", c:"#eab308" },
  ],
  opinion: [
    { k:"País mejor s/ Maduro", v:"51,5%", c:"#22c55e" },
    { k:"Influencia EE.UU.", v:"62,4% positiva", c:"#22c55e" },
    { k:"Aprobación Delcy", v:"37,0%", c:"#eab308" },
    { k:"Corrupción #1", v:"56,7%", c:"#ef4444" },
  ],
};

const TENSIONS = [
  { level:"green", text:"Amnistía operativa · 4.203 solicitudes · Trump: \"nuevo amigo y socio\"" },
  { level:"green", text:"Petróleo ~800K bpd · Vitol/Trafigura · Eni USD 3B · Shell gas" },
  { level:"yellow", text:"Brecha cambiaria 52,6% ↑6,5pp · 47 meses sin ajuste salarial" },
  { level:"yellow", text:"Poder Ciudadano: renuncias Saab/Ruiz · plazo 30 días" },
  { level:"red", text:"Agenda electoral: Rubio condiciona · Sin calendario · Caso Magalli Meda" },
];

const INDICATORS = [
  { dim:"Energético", icon:"⚡", name:"Exportaciones de crudo", sem:"green", val:"~800 kbd ↑60.6%", trend:"up" },
  { dim:"Energético", icon:"⚡", name:"Ventas petroleras", sem:"green", val:"Proy. USD 6.000M", trend:"up" },
  { dim:"Energético", icon:"⚡", name:"Licencias OFAC", sem:"green", val:"FAQ 1238 Cuba", trend:"flat" },
  { dim:"Energético", icon:"⚡", name:"Infraestructura refinación", sem:"red", val:"<20% capacidad", trend:"flat" },
  { dim:"Político", icon:"🏛", name:"Ley de Amnistía", sem:"green", val:"4.203 sol. · 568 verif.", trend:"up" },
  { dim:"Político", icon:"🏛", name:"Excarcelaciones verificadas", sem:"yellow", val:"126 verificadas", trend:"flat" },
  { dim:"Político", icon:"🏛", name:"Cohesión FANB", sem:"yellow", val:"Cuba sale · SOUTHCOM", trend:"down" },
  { dim:"Político", icon:"🏛", name:"Agenda electoral", sem:"red", val:"Sin fecha · Rubio exige", trend:"up" },
  { dim:"Económico", icon:"📊", name:"Brecha cambiaria", sem:"red", val:"52,6% — límite umbral", trend:"up" },
  { dim:"Económico", icon:"📊", name:"Salario mínimo", sem:"red", val:"47 meses sin ajuste", trend:"flat" },
  { dim:"Económico", icon:"📊", name:"PIB proyectado", sem:"green", val:"10,4–15,2%", trend:"up" },
  { dim:"Internacional", icon:"🌐", name:"Normalización diplomática", sem:"green", val:"Tajani · Petro 14 mar", trend:"up" },
  { dim:"Internacional", icon:"🌐", name:"FMI", sem:"yellow", val:"Intensa Fragilidad · >180%", trend:"up" },
  { dim:"Internacional", icon:"🌐", name:"China/Rusia", sem:"yellow", val:"Cuba retira asesores", trend:"down" },
];

const GDELT_ANNOTATIONS = [
  { date:"2026-01-03", tier:"CRITICAL", label:"Operación EE.UU. / Captura Maduro" },
  { date:"2026-01-05", tier:"HIGH", label:"Delcy Rodríguez juramentada" },
  { date:"2026-01-10", tier:"HIGH", label:"Decreto emergencia + represión" },
  { date:"2026-01-15", tier:"MEDIUM", label:"Machado se reúne con Trump" },
  { date:"2026-01-20", tier:"MEDIUM", label:"Acuerdo petrolero $300M" },
  { date:"2026-01-29", tier:"MEDIUM", label:"Ley de hidrocarburos firmada" },
  { date:"2026-02-05", tier:"LOW", label:"Debate amnistía" },
  { date:"2026-02-12", tier:"LOW", label:"Rodríguez promete elecciones" },
  { date:"2026-02-19", tier:"MEDIUM", label:"Amnistía promulgada" },
  { date:"2026-02-25", tier:"LOW", label:"Trump: \"nuevo amigo\"" },
];

const POLYMARKET_SLUGS = [
  { slug:"will-venezuela-become-51st-state", title:"¿Venezuela 51° estado?" },
  { slug:"will-mara-corina-machado-enter-venezuela-by-march-31-426-698-771", title:"¿MCM entra a Venezuela antes del 31 mar?" },
  { slug:"will-delcy-rodrguez-be-the-leader-of-venezuela-end-of-2026", title:"¿Delcy líder a fin de 2026?" },
  { slug:"will-the-us-embassy-in-venezuela-reopen-by-march-31", title:"¿Embajada EE.UU. reabre antes del 31 mar?" },
];

const CONF_HISTORICO = [
  {y:2011,p:5338},{y:2012,p:5483},{y:2013,p:4410},{y:2014,p:9286},{y:2015,p:5851},
  {y:2016,p:6917},{y:2017,p:9787},{y:2018,p:12715},{y:2019,p:16739},{y:2020,p:9633},
  {y:2021,p:6560},{y:2022,p:7032},{y:2023,p:6956},{y:2024,p:5226},{y:2025,p:2219},
];

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const BG = "#060c14";
const BG2 = "#091628";
const BG3 = "#0d1e35";
const BORDER = "#1a3050";
const TEXT = "#e2e8f0";
const MUTED = "#4a7090";
const ACCENT = "#0A97D9";
const SC = { 1:"#4C9F38", 2:"#E5243B", 3:"#0A97D9", 4:"#FCC30B" };
const SEM = { green:"#22c55e", yellow:"#eab308", red:"#ef4444" };

const font = "'Space Mono', monospace";
const fontSans = "'DM Sans', sans-serif";

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
    <span style={{ fontSize:9, fontFamily:font, letterSpacing:"0.12em", textTransform:"uppercase",
      padding:"2px 7px", background:`${color}18`, color, border:`1px solid ${color}30` }}>
      {children}
    </span>
  );
}

function Card({ children, style, accent }) {
  return (
    <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:"16px 18px", position:"relative", ...style }}>
      {accent && <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:accent }} />}
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
      <div style={{ fontSize:11, color:delta>0?"#ef4444":"#22c55e", fontFamily:font, fontWeight:600 }}>
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
  const maxY = Math.max(maxInst, maxArt, 1);
  
  const W = 800, H = 200, padL = 40, padR = 10, padT = 10, padB = 30;
  const cW = W-padL-padR, cH = H-padT-padB;
  
  const toX = (i) => padL + (i/(data.length-1)) * cW;
  const toY = (v, max) => padT + cH - (v/max)*cH;
  
  const makePath = (key, max) => {
    const pts = data.map((d,i) => d[key] != null ? `${i===0?"M":"L"}${toX(i)},${toY(d[key],max)}` : "").filter(Boolean);
    return pts.join(" ");
  };
  
  const makeArea = (key, max) => {
    const pts = data.filter(d => d[key] != null);
    if (!pts.length) return "";
    const indices = data.map((d,i) => d[key]!=null ? i : -1).filter(i=>i>=0);
    let path = `M${toX(indices[0])},${toY(pts[0][key],max)}`;
    for (let j=1; j<indices.length; j++) path += ` L${toX(indices[j])},${toY(pts[j][key],max)}`;
    path += ` L${toX(indices[indices.length-1])},${padT+cH} L${toX(indices[0])},${padT+cH} Z`;
    return path;
  };

  const annotations = GDELT_ANNOTATIONS.map(a => {
    const idx = data.findIndex(d=>d.date===a.date);
    return idx >= 0 ? { ...a, x: toX(idx) } : null;
  }).filter(Boolean);

  const tierColor = { CRITICAL:"#ff2222", HIGH:"#ff7733", MEDIUM:"#f5c842", LOW:"#3bf0ff" };
  const sigColor = { instability:"#ff3b3b", tone:"#3bf0ff", artvolnorm:"#f5c842" };
  const sigLabel = { instability:"Inestabilidad", tone:"Tono mediático", artvolnorm:"Vol. artículos" };

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        {Object.keys(sigColor).map(k => (
          <button key={k} onClick={() => setSignals(p=>({...p,[k]:!p[k]}))}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20,
              fontSize:10, fontFamily:font, border:`1px solid ${signals[k]?sigColor[k]:BORDER}`,
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
          <line key={f} x1={padL} y1={padT+f*cH} x2={padL+cW} y2={padT+f*cH} stroke="rgba(255,255,255,0.04)" />
        ))}
        {/* Annotations */}
        {annotations.map((a,i) => (
          <line key={i} x1={a.x} y1={padT} x2={a.x} y2={padT+cH} stroke={tierColor[a.tier]} strokeDasharray="3 3" opacity={0.4} />
        ))}
        {/* Areas */}
        {signals.artvolnorm && <path d={makeArea("artvolnorm",maxY)} fill="#f5c84210" />}
        {signals.instability && <path d={makeArea("instability",maxY)} fill="#ff3b3b10" />}
        {/* Lines */}
        {signals.artvolnorm && <path d={makePath("artvolnorm",maxY)} fill="none" stroke="#f5c842" strokeWidth={1.5} />}
        {signals.instability && <path d={makePath("instability",maxY)} fill="none" stroke="#ff3b3b" strokeWidth={1.5} />}
        {signals.tone && <path d={makePath("tone",10)} fill="none" stroke="#3bf0ff" strokeWidth={1.5} />}
        {/* X labels */}
        {data.filter((_,i) => i % Math.floor(data.length/8) === 0).map((d,i,arr) => {
          const idx = data.indexOf(d);
          return <text key={i} x={toX(idx)} y={H-4} textAnchor="middle" fontSize={8} fill={MUTED} fontFamily={font}>
            {new Date(d.date+"T00:00").toLocaleDateString("es",{month:"short",day:"numeric"})}
          </text>;
        })}
        {/* Hover line */}
        {hover !== null && <line x1={toX(hover)} y1={padT} x2={toX(hover)} y2={padT+cH} stroke="rgba(255,255,255,0.2)" />}
      </svg>
      {hover !== null && data[hover] && (
        <div style={{ fontSize:10, fontFamily:font, color:TEXT, marginTop:6, display:"flex", gap:16, flexWrap:"wrap" }}>
          <span style={{ color:MUTED }}>{data[hover].date}</span>
          {signals.instability && <span style={{ color:"#ff3b3b" }}>Inest: {data[hover].instability?.toFixed(2)}</span>}
          {signals.tone && <span style={{ color:"#3bf0ff" }}>Tono: {data[hover].tone?.toFixed(2)}</span>}
          {signals.artvolnorm && <span style={{ color:"#f5c842" }}>Vol: {data[hover].artvolnorm?.toFixed(2)}</span>}
          {GDELT_ANNOTATIONS.find(a=>a.date===data[hover].date) && (
            <span style={{ color:tierColor[GDELT_ANNOTATIONS.find(a=>a.date===data[hover].date).tier] }}>
              ● {GDELT_ANNOTATIONS.find(a=>a.date===data[hover].date).label}
            </span>
          )}
        </div>
      )}
      {/* Annotations timeline */}
      <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:4 }}>
        {GDELT_ANNOTATIONS.map((a,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:10, fontFamily:font }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:tierColor[a.tier], flexShrink:0 }} />
            <span style={{ color:MUTED, minWidth:68 }}>{a.date.slice(5)}</span>
            <span style={{ color:TEXT }}>{a.label}</span>
          </div>
        ))}
      </div>
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
            <div style={{ fontSize:7, fontFamily:font, color:isLast?ACCENT:isPeak?"#E5243B":MUTED, marginBottom:2 }}>
              {(h.p/1000).toFixed(1)}k
            </div>
            <div style={{ width:"100%", height:`${pct}%`, background:isLast?ACCENT:isPeak?"#E5243B":`${ACCENT}40`,
              borderRadius:"2px 2px 0 0", transition:"height 0.5s", minHeight:2 }} />
            <div style={{ fontSize:7, fontFamily:font, color:isLast?ACCENT:MUTED, marginTop:4, transform:"rotate(-45deg)", transformOrigin:"top left", whiteSpace:"nowrap" }}>
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

function TabDashboard({ week }) {
  const wk = WEEKS[week];
  const dom = wk.probs.reduce((a,b) => a.v > b.v ? a : b);
  const domSc = SCENARIOS.find(s=>s.id===dom.sc);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Scenario cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, background:BORDER, border:`1px solid ${BORDER}` }}>
        {wk.probs.map(p => {
          const sc = SCENARIOS.find(s=>s.id===p.sc);
          const isDom = p.sc === dom.sc;
          return (
            <div key={p.sc} style={{ background:isDom?BG3:BG2, padding:"16px 18px", borderTop:`3px solid ${sc.color}` }}>
              <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
                E{sc.id}
                {isDom && <Badge color={sc.color}>Dominante</Badge>}
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:sc.color, marginBottom:8 }}>{sc.name}</div>
              <div style={{ fontSize:28, fontWeight:900, color:sc.color, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{p.v}%</div>
              <div style={{ height:3, background:`${BORDER}`, marginTop:8 }}>
                <div style={{ height:3, background:sc.color, width:`${p.v}%`, transition:"width 0.5s" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* KPIs + ISV + Matrix */}
      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr 240px", gap:16 }}>
        <Card><ISVGauge /></Card>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:1, background:BORDER, border:`1px solid ${BORDER}` }}>
          {[{title:"Energético",icon:"⚡",data:KPIS_LATEST.energia},{title:"Político",icon:"🏛",data:KPIS_LATEST.politico},{title:"Opinión",icon:"🗳",data:KPIS_LATEST.opinion}].map((sec,i) => (
            <div key={i} style={{ background:BG2, padding:"14px 16px" }}>
              <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:10, borderBottom:`1px solid ${BORDER}`, paddingBottom:6 }}>
                {sec.icon} {sec.title}
              </div>
              {sec.data.map((k,j) => (
                <div key={j} style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6, gap:8 }}>
                  <span style={{ fontSize:10, color:"#7a9ab0" }}>{k.k}</span>
                  <span style={{ fontSize:11, fontFamily:font, fontWeight:500, color:k.c, whiteSpace:"nowrap" }}>{k.v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <Card>
          <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:8 }}>
            📍 Posición en la matriz
          </div>
          <MiniMatrix weekIdx={week} />
        </Card>
      </div>

      {/* Tensions */}
      <Card>
        <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:10, borderBottom:`1px solid ${BORDER}`, paddingBottom:6 }}>
          ⚠ Tensiones activas · {wk.label}
        </div>
        {TENSIONS.map((t,i) => (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:8, paddingBottom:8, borderBottom:i<TENSIONS.length-1?`1px solid ${BORDER}`:"none" }}>
            <SemDot color={t.level} />
            <span style={{ fontSize:11, color:"#7a9ab0", lineHeight:1.5 }} dangerouslySetInnerHTML={{ __html:t.text }} />
          </div>
        ))}
      </Card>
    </div>
  );
}

function TabMatriz({ week }) {
  const [sel, setSel] = useState(3);
  const wk = WEEKS[week];
  const dom = wk.probs.reduce((a,b)=>a.v>b.v?a:b);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16 }}>
      <div>
        <div style={{ border:`1px solid ${BORDER}`, marginBottom:16 }}>
          <MiniMatrix weekIdx={week} />
        </div>
        {/* Probability bars */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {wk.probs.map(p => {
            const sc = SCENARIOS.find(s=>s.id===p.sc);
            return (
              <div key={p.sc} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>setSel(p.sc)}>
                <span style={{ fontSize:10, fontFamily:font, color:sc.color, width:20 }}>E{sc.id}</span>
                <div style={{ flex:1, height:6, background:BORDER, borderRadius:2 }}>
                  <div style={{ height:6, background:sc.color, width:`${p.v}%`, borderRadius:2, transition:"width 0.4s" }} />
                </div>
                <span style={{ fontSize:11, fontFamily:font, color:sc.color, width:30, textAlign:"right" }}>{p.v}%</span>
              </div>
            );
          })}
        </div>
        {/* Weekly evolution */}
        <div style={{ marginTop:16, border:`1px solid ${BORDER}`, padding:12 }}>
          <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:10 }}>
            Evolución de probabilidades
          </div>
          <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:80 }}>
            {WEEKS.map((w,i) => (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", gap:1, alignItems:"center" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:1, width:"100%", alignItems:"center" }}>
                  {w.probs.slice().sort((a,b)=>b.v-a.v).map(p => (
                    <div key={p.sc} style={{ width:"80%", height:Math.max(2, p.v*0.6), background:SC[p.sc], borderRadius:1, opacity:i===week?1:0.5 }} />
                  ))}
                </div>
                <span style={{ fontSize:7, fontFamily:font, color:i===week?ACCENT:MUTED, marginTop:4 }}>{w.short}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Sidebar */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {SCENARIOS.map(sc => {
          const p = wk.probs.find(p=>p.sc===sc.id);
          return (
            <Card key={sc.id} style={{ cursor:"pointer", borderColor:sel===sc.id?sc.color:BORDER, borderLeft:`3px solid ${sc.color}` }}
              onClick={()=>setSel(sc.id)}>
              <div style={{ fontSize:9, fontFamily:font, color:sc.color, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:4 }}>
                Escenario {sc.id}
              </div>
              <div style={{ fontSize:12, fontWeight:600, color:TEXT, marginBottom:4 }}>{sc.name}</div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, fontFamily:font }}>
                <span style={{ color:MUTED }}>{p.v}%</span>
                <span style={{ color:p.sc===dom.sc?sc.color:MUTED }}>{p.sc===dom.sc?"● Dominante":"—"}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function TabMonitor() {
  const [view, setView] = useState("dim");
  const dims = [...new Set(INDICATORS.map(i=>i.dim))];
  const grouped = dims.map(d => ({ dim:d, icon:INDICATORS.find(i=>i.dim===d).icon, inds:INDICATORS.filter(i=>i.dim===d) }));

  const semLabel = { green:"Verde", yellow:"Amarillo", red:"Rojo" };
  const trendIcon = { up:"↑", down:"↓", flat:"→" };
  const trendColor = { up:"#22c55e", down:"#ef4444", flat:MUTED };

  const counts = { green:INDICATORS.filter(i=>i.sem==="green").length, yellow:INDICATORS.filter(i=>i.sem==="yellow").length, red:INDICATORS.filter(i=>i.sem==="red").length };

  return (
    <div>
      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[{label:"Verde",count:counts.green,color:"green",desc:"Confirmados / estables"},
          {label:"Amarillo",count:counts.yellow,color:"yellow",desc:"En monitoreo"},
          {label:"Rojo",count:counts.red,color:"red",desc:"Alerta activa"},
          {label:"Dominante",count:"E3·50%",color:ACCENT,desc:"Continuidad negociada"}
        ].map((c,i) => (
          <Card key={i} accent={typeof c.color==="string" && c.color.startsWith("#")?c.color:SEM[c.color]}>
            <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>{c.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:typeof c.color==="string" && c.color.startsWith("#")?c.color:SEM[c.color], fontFamily:"'Syne',sans-serif" }}>{c.count}</div>
            <div style={{ fontSize:9, color:MUTED, marginTop:4 }}>{c.desc}</div>
          </Card>
        ))}
      </div>

      {/* Table */}
      {grouped.map(g => (
        <div key={g.dim} style={{ marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>
            <span style={{ fontSize:14 }}>{g.icon}</span>
            <span style={{ fontSize:12, fontWeight:700, fontFamily:"'Syne',sans-serif", color:ACCENT, letterSpacing:"0.1em", textTransform:"uppercase" }}>{g.dim}</span>
            <span style={{ fontSize:9, color:MUTED, marginLeft:"auto" }}>{g.inds.length} indicadores</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {g.inds.map((ind,j) => (
              <div key={j} style={{ display:"grid", gridTemplateColumns:"1fr 140px 80px 40px", gap:8, padding:"8px 0", borderBottom:`1px solid ${BORDER}40`, alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:TEXT }}>{ind.name}</div>
                </div>
                <div style={{ fontSize:10, fontFamily:font, color:SEM[ind.sem] }}>{ind.val}</div>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <SemDot color={ind.sem} size={7} />
                  <span style={{ fontSize:9, fontFamily:font, color:SEM[ind.sem] }}>{semLabel[ind.sem]}</span>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:trendColor[ind.trend], textAlign:"center" }}>
                  {trendIcon[ind.trend]}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TabGdelt() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("loading");
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSource("loading");
    try {
      const live = await fetchAllGdelt();
      if (live && live.length > 10) {
        setData(live);
        setSource("live");
      } else {
        setData(generateMockGdelt());
        setSource("mock");
        setError("GDELT no respondió — usando datos simulados");
      }
    } catch (e) {
      setData(generateMockGdelt());
      setSource("mock");
      setError(`Fallback a mock: ${e.message}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const dataPoints = data?.length || 0;
  const dateRange = data && data.length > 0
    ? `${data[0].date} → ${data[data.length-1].date}`
    : "";

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <span style={{ fontSize:14 }}>📡</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:TEXT }}>GDELT Media Signals — Venezuela</div>
          <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em" }}>
            {source === "live"
              ? `EN VIVO · ${dataPoints} puntos · ${dateRange} · via CORS proxy`
              : source === "mock"
              ? `Datos simulados · ${dataPoints} puntos · Fallback local`
              : "Conectando con GDELT DOC API v2..."}
          </div>
        </div>
        <Badge color={source==="live"?"#22c55e":source==="mock"?"#eab308":"#4a7090"}>
          {source==="live"?"EN VIVO":source==="mock"?"SIMULADO":"..."}
        </Badge>
        {source === "mock" && !loading && (
          <button onClick={loadData}
            style={{ fontSize:9, fontFamily:font, padding:"4px 10px", background:"transparent",
              border:`1px solid ${ACCENT}40`, color:ACCENT, cursor:"pointer", letterSpacing:"0.08em" }}>
            ↻ Reintentar
          </button>
        )}
      </div>

      {/* Status bar */}
      {error && (
        <div style={{ fontSize:9, fontFamily:font, color:"#eab308", padding:"6px 12px",
          background:"rgba(234,179,8,0.08)", border:"1px solid rgba(234,179,8,0.2)",
          marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
          <span>⚠</span> {error}
          <span style={{ marginLeft:"auto", color:MUTED }}>
            Proxies intentados: corsproxy.io, allorigins.win
          </span>
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <Card>
          <div style={{ textAlign:"center", padding:40, color:MUTED, fontSize:11, fontFamily:font }}>
            <div style={{ fontSize:20, marginBottom:8, animation:"pulse 1.5s infinite" }}>📡</div>
            Conectando con GDELT DOC API v2...
            <div style={{ fontSize:9, marginTop:4, color:`${MUTED}80` }}>
              3 queries paralelas · instabilidad + tono + volumen · 120 días
            </div>
          </div>
        </Card>
      ) : data ? (
        <Card><GdeltChart data={data} /></Card>
      ) : (
        <Card><div style={{ color:MUTED, fontSize:11, textAlign:"center", padding:20 }}>
          No se pudieron obtener datos de GDELT
        </div></Card>
      )}

      {/* Signal descriptions */}
      <div style={{ marginTop:16, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
        <Card accent="#ff3b3b">
          <div style={{ fontSize:10, fontWeight:600, color:"#ff3b3b", marginBottom:6 }}>Índice de Inestabilidad</div>
          <div style={{ fontSize:10, color:MUTED, lineHeight:1.6 }}>
            Volumen normalizado de artículos con Venezuela + conflicto/protesta/crisis/violencia. 
            Pico el 3 de enero por la captura de Maduro.
          </div>
        </Card>
        <Card accent="#3bf0ff">
          <div style={{ fontSize:10, fontWeight:600, color:"#3bf0ff", marginBottom:6 }}>Tono Mediático</div>
          <div style={{ fontSize:10, color:MUTED, lineHeight:1.6 }}>
            Sentimiento promedio de cobertura internacional (-10 a +2). 
            Recuperación gradual desde el shock de enero.
          </div>
        </Card>
        <Card accent="#f5c842">
          <div style={{ fontSize:10, fontWeight:600, color:"#f5c842", marginBottom:6 }}>Volumen de Artículos</div>
          <div style={{ fontSize:10, color:MUTED, lineHeight:1.6 }}>
            Atención mediática normalizada. Mide la intensidad del interés 
            internacional en Venezuela como tema noticioso.
          </div>
        </Card>
      </div>

      {/* Technical details */}
      <div style={{ marginTop:12, fontSize:8, fontFamily:font, color:`${MUTED}60`, lineHeight:1.8 }}>
        Fuente: GDELT Project DOC API v2 · 3 queries paralelas via CORS proxy · 
        Instabilidad = timelinevol (protest|conflict|crisis|violence|unrest) · 
        Tono = timelinetone · Volumen = timelinevol general · 
        Actualización: cada carga de página
      </div>
    </div>
  );
}

function TabPolymarket() {
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <span style={{ fontSize:14 }}>🔮</span>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:TEXT }}>Mercados de Predicción — Polymarket</div>
          <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em" }}>
            Contratos activos relacionados con Venezuela · Precios = probabilidad implícita del mercado
          </div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {POLYMARKET_SLUGS.map((m,i) => (
          <Card key={i}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:11, fontWeight:600, color:TEXT, lineHeight:1.3 }}>{m.title}</span>
              <a href={`https://polymarket.com/event/${m.slug}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:9, color:ACCENT, textDecoration:"none", fontFamily:font }}>↗</a>
            </div>
            <iframe
              src={`https://embed.polymarket.com/market.html?market=${m.slug}&theme=dark&features=volume,chart&width=380`}
              style={{ width:"100%", height:360, border:"none", borderRadius:4 }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              title={m.title}
            />
          </Card>
        ))}
      </div>
      <div style={{ marginTop:12, fontSize:9, fontFamily:font, color:MUTED, textAlign:"center" }}>
        Fuente: Polymarket · Los precios reflejan probabilidades implícitas del mercado, no predicciones
      </div>
    </div>
  );
}

function TabConflictividad() {
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <span style={{ fontSize:14 }}>📊</span>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:TEXT }}>Conflictividad Social — Venezuela 2025</div>
          <div style={{ fontSize:9, fontFamily:font, color:MUTED }}>Fuente: OVCS · Informe Anual 2025</div>
        </div>
      </div>
      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[{k:"Total 2025",v:"2.219",c:ACCENT,s:"-57% vs 2024"},{k:"DESCA",v:"1.248",c:"#0468B1",s:"56% del total"},
          {k:"DCP",v:"971",c:ACCENT,s:"44% del total"},{k:"Reprimidas",v:"55",c:"#E5243B",s:"2,5% patrón selectivo"}
        ].map((d,i) => (
          <Card key={i}>
            <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{d.k}</div>
            <div style={{ fontSize:22, fontWeight:800, color:d.c, fontFamily:"'Syne',sans-serif" }}>{d.v}</div>
            <div style={{ fontSize:9, color:MUTED, marginTop:2 }}>{d.s}</div>
          </Card>
        ))}
      </div>
      {/* Historical chart */}
      <Card>
        <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
          Serie histórica 2011–2025
        </div>
        <ConflictividadChart />
      </Card>
    </div>
  );
}

function TabIODA() {
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
        <div style={{ fontSize:10, fontWeight:600, color, marginBottom:4 }}>{label}</div>
        <div style={{ fontSize:10, color:MUTED, padding:"20px 0", textAlign:"center" }}>Sin datos</div>
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
            <span style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase" }}>{label}</span>
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
            <span style={{ fontSize:14, fontWeight:700, fontFamily:font, color }}>{fmtVal(current)}</span>
            <span style={{ fontSize:9, fontFamily:font, color: pctChange < -5 ? "#dc2626" : pctChange > 5 ? "#14b8a6" : MUTED }}>
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
            <line key={f} x1={padL} y1={padT+f*cH} x2={padL+cW} y2={padT+f*cH} stroke="rgba(255,255,255,0.04)" />
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
              <line x1={toX(hover.idx)} y1={padT} x2={toX(hover.idx)} y2={padT+cH} stroke="rgba(255,255,255,0.15)" />
              <circle cx={toX(hover.idx)} cy={toY(data[hover.idx][key])} r={3} fill={color} />
            </>
          )}
        </svg>
        {hover && hover.key === key && hover.idx < data.length && (
          <div style={{ fontSize:9, fontFamily:font, color:MUTED, marginTop:4 }}>
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
        <span style={{ fontSize:14 }}>🌐</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:TEXT }}>Monitor de Conectividad — IODA Venezuela</div>
          <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em" }}>
            Internet Outage Detection & Analysis · Georgia Tech · {source === "live" ? `${signals?.length || 0} puntos · EN VIVO` : source === "failed" ? "Sin conexión" : "Conectando..."}
          </div>
        </div>
        <Badge color={source==="live"?"#14b8a6":source==="failed"?"#dc2626":"#eab308"}>
          {source==="live"?"EN VIVO":source==="failed"?"OFFLINE":"..."}
        </Badge>
        {/* Time range selector */}
        <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}` }}>
          {["24h","48h","7d"].map(r => (
            <button key={r} onClick={() => setTimeRange(r)}
              style={{ fontSize:9, fontFamily:font, padding:"5px 12px", border:"none",
                background:timeRange===r?ACCENT:"transparent", color:timeRange===r?"#fff":MUTED,
                cursor:"pointer", letterSpacing:"0.08em" }}>
              {r}
            </button>
          ))}
        </div>
        {source === "failed" && (
          <button onClick={loadIODA}
            style={{ fontSize:9, fontFamily:font, padding:"4px 10px", background:"transparent",
              border:`1px solid ${ACCENT}40`, color:ACCENT, cursor:"pointer" }}>
            ↻ Reintentar
          </button>
        )}
      </div>

      {error && (
        <div style={{ fontSize:9, fontFamily:font, color:"#eab308", padding:"6px 12px",
          background:"rgba(234,179,8,0.08)", border:"1px solid rgba(234,179,8,0.2)", marginBottom:12 }}>
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <Card>
          <div style={{ textAlign:"center", padding:40, color:MUTED, fontSize:11, fontFamily:font }}>
            <div style={{ fontSize:20, marginBottom:8 }}>🌐</div>
            Conectando con IODA API v2 (Georgia Tech)...
            <div style={{ fontSize:9, marginTop:4, color:`${MUTED}80` }}>
              Señales BGP + Active Probing + Telescope · Venezuela · {timeRange}
            </div>
          </div>
        </Card>
      ) : signals ? (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {renderSignalChart("bgp", "BGP Routes", "#14b8a6", signals)}
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
            <div style={{ fontSize:10, color:MUTED, lineHeight:1.6, maxWidth:500, margin:"0 auto", marginBottom:16 }}>
              La API de IODA bloquea requests cross-origin desde el navegador. 
              Puedes ver los datos en tiempo real en los links de abajo, o desplegar 
              el dashboard en Vercel con rutas API server-side.
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <a href="https://ioda.inetintel.cc.gatech.edu/country/VE" target="_blank" rel="noopener noreferrer"
                style={{ fontSize:10, fontFamily:font, color:ACCENT, textDecoration:"none", padding:"6px 14px", border:`1px solid ${ACCENT}30` }}>
                ↗ IODA Venezuela
              </a>
              <a href="https://umbral.watch" target="_blank" rel="noopener noreferrer"
                style={{ fontSize:10, fontFamily:font, color:"#4C9F38", textDecoration:"none", padding:"6px 14px", border:"1px solid rgba(76,159,56,0.3)" }}>
                ↗ Umbral (mapa subnacional)
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Signal descriptions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginTop:12 }}>
        {[{title:"BGP Routes",desc:"Rutas de red anunciadas a nivel de proveedor. Una caída indica pérdida de conectividad upstream — Venezuela tiene ~4.500 prefijos BGP.",color:"#14b8a6"},
          {title:"Active Probing",desc:"Sondeo activo de ~85K hosts venezolanos. Mide reachability real de dispositivos finales. Más granular que BGP.",color:"#f59e0b"},
          {title:"Network Telescope",desc:"Tráfico de fondo no solicitado. Anomalías (caídas abruptas) indican interrupciones masivas a nivel de infraestructura nacional.",color:"#dc2626"}
        ].map((s,i) => (
          <Card key={i} accent={s.color}>
            <div style={{ fontSize:10, fontWeight:600, color:s.color, marginBottom:4 }}>{s.title}</div>
            <div style={{ fontSize:9, color:MUTED, lineHeight:1.5 }}>{s.desc}</div>
          </Card>
        ))}
      </div>

      <div style={{ marginTop:12, fontSize:8, fontFamily:font, color:`${MUTED}60`, lineHeight:1.8 }}>
        Fuente: IODA (Internet Outage Detection & Analysis) · Georgia Tech INETINTEL · API v2 · 
        Señales en tiempo real via CORS proxy (corsproxy.io / allorigins.win) · 
        Hora Venezuela (UTC-4)
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════

const TABS = [
  { id:"dashboard", label:"Dashboard", icon:"📊" },
  { id:"matriz", label:"Matriz", icon:"🎯" },
  { id:"monitor", label:"Monitor", icon:"🚦" },
  { id:"gdelt", label:"GDELT", icon:"📡" },
  { id:"conflictividad", label:"Conflictividad", icon:"✊" },
  { id:"ioda", label:"IODA", icon:"🌐" },
  { id:"polymarket", label:"Polymarket", icon:"🔮" },
];

export default function MonitorPNUD() {
  const [tab, setTab] = useState("dashboard");
  const [week, setWeek] = useState(WEEKS.length - 1);

  return (
    <div style={{ fontFamily:fontSans, background:BG, minHeight:"100vh", color:TEXT }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,700;0,900;1,400&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ borderBottom:`1px solid ${BORDER}`, padding:"10px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", background:BG }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ background:ACCENT, color:"#fff", fontFamily:font, fontSize:10, fontWeight:700, letterSpacing:"0.15em", padding:"4px 8px" }}>PNUD</div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:TEXT, letterSpacing:"0.02em" }}>Monitor de Contexto Situacional · Venezuela 2026</div>
            <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.08em" }}>Programa de las Naciones Unidas para el Desarrollo</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <select value={week} onChange={e => setWeek(+e.target.value)}
            style={{ fontFamily:font, fontSize:10, background:BG2, border:`1px solid ${BORDER}`, color:ACCENT,
              padding:"5px 28px 5px 10px", cursor:"pointer", outline:"none",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%230A97D9'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center" }}>
            {WEEKS.map((w,i) => <option key={i} value={i}>{w.label}</option>)}
          </select>
          <Badge color={week===WEEKS.length-1?"#22c55e":MUTED}>{week===WEEKS.length-1?"Más reciente":"Archivo"}</Badge>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ display:"flex", alignItems:"center", gap:0, padding:"0 20px", background:BG, borderBottom:`1px solid ${BORDER}`, overflowX:"auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ fontFamily:font, fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase",
              padding:"10px 14px", background:tab===t.id?ACCENT:"transparent",
              border:"none", borderBottom:tab===t.id?`2px solid ${ACCENT}`:"2px solid transparent",
              color:tab===t.id?"#fff":MUTED, cursor:"pointer", transition:"all 0.15s",
              whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ fontSize:11 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth:1300, margin:"0 auto", padding:"20px 20px 60px" }}>
        {tab === "dashboard" && <TabDashboard week={week} />}
        {tab === "matriz" && <TabMatriz week={week} />}
        {tab === "monitor" && <TabMonitor />}
        {tab === "gdelt" && <TabGdelt />}
        {tab === "conflictividad" && <TabConflictividad />}
        {tab === "ioda" && <TabIODA />}
        {tab === "polymarket" && <TabPolymarket />}
      </div>

      {/* FOOTER */}
      <div style={{ textAlign:"center", fontSize:9, fontFamily:font, color:`${MUTED}60`, padding:"8px 0 16px", letterSpacing:"0.1em", textTransform:"uppercase" }}>
        PNUD Venezuela · Monitor Situacional · Uso interno · {WEEKS[week].label}
      </div>
    </div>
  );
}
