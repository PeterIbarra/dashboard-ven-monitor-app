import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";

// ═══════════════════════════════════════════════════════════════
// DATA — Externalized to src/data/ for easier weekly updates
// ═══════════════════════════════════════════════════════════════
import { WEEKS, KPIS_LATEST, TENSIONS, MONITOR_WEEKS, ICG_HISTORY, CONF_SEMANAL } from "./data/weekly.js";
import { INDICATORS, SCENARIO_SIGNALS } from "./data/indicators.js";
import { AMNISTIA_TRACKER } from "./data/amnistia.js";
import { SITREP_ALL, CURATED_NEWS, CURATED_FACTCHECK } from "./data/sitrep.js";
import { SCENARIOS, GDELT_ANNOTATIONS, POLYMARKET_SLUGS, CONF_HISTORICO, VEN_PRODUCTION_MANUAL, CONF_MESES, CONF_DERECHOS, CONF_SERVICIOS, CONF_ESTADOS, VZ_MAP } from "./data/static.js";

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

// ── Lazy script/CSS loader — deduplicates, caches, returns promise ──
const _scriptCache = {};
function loadScript(src, opts = {}) {
  if (_scriptCache[src]) return _scriptCache[src];
  _scriptCache[src] = new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const el = document.createElement("script");
    el.src = src;
    if (opts.async !== false) el.async = true;
    el.onload = resolve;
    el.onerror = reject;
    document.head.appendChild(el);
  });
  return _scriptCache[src];
}
function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const el = document.createElement("link");
  el.rel = "stylesheet";
  el.href = href;
  document.head.appendChild(el);
}

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
const PNUD_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">' +
// Pixel art PNUD logo — 8-bit style globe + PNUD letters
// Top: UN globe emblem (simplified pixel grid)
'<rect width="48" height="34" fill="#0468B1"/>' +
// Globe outline (pixelated circle)
'<rect x="17" y="3" width="14" height="2" fill="white"/>' +
'<rect x="13" y="5" width="4" height="2" fill="white"/><rect x="31" y="5" width="4" height="2" fill="white"/>' +
'<rect x="11" y="7" width="2" height="2" fill="white"/><rect x="35" y="7" width="2" height="2" fill="white"/>' +
'<rect x="9" y="9" width="2" height="6" fill="white"/><rect x="37" y="9" width="2" height="6" fill="white"/>' +
'<rect x="9" y="15" width="2" height="6" fill="white"/><rect x="37" y="15" width="2" height="6" fill="white"/>' +
'<rect x="11" y="21" width="2" height="2" fill="white"/><rect x="35" y="21" width="2" height="2" fill="white"/>' +
'<rect x="13" y="23" width="4" height="2" fill="white"/><rect x="31" y="23" width="4" height="2" fill="white"/>' +
'<rect x="17" y="25" width="14" height="2" fill="white"/>' +
// Horizontal line through globe
'<rect x="11" y="14" width="26" height="2" fill="white" opacity="0.6"/>' +
// Vertical line through globe
'<rect x="23" y="5" width="2" height="22" fill="white" opacity="0.6"/>' +
// Equator curve dots
'<rect x="14" y="11" width="2" height="2" fill="white" opacity="0.5"/>' +
'<rect x="18" y="10" width="2" height="2" fill="white" opacity="0.5"/>' +
'<rect x="26" y="10" width="2" height="2" fill="white" opacity="0.5"/>' +
'<rect x="32" y="11" width="2" height="2" fill="white" opacity="0.5"/>' +
'<rect x="14" y="17" width="2" height="2" fill="white" opacity="0.5"/>' +
'<rect x="18" y="18" width="2" height="2" fill="white" opacity="0.5"/>' +
'<rect x="26" y="18" width="2" height="2" fill="white" opacity="0.5"/>' +
'<rect x="32" y="17" width="2" height="2" fill="white" opacity="0.5"/>' +
// Laurel leaves (simplified pixel)
'<rect x="6" y="11" width="2" height="2" fill="white" opacity="0.7"/>' +
'<rect x="5" y="13" width="2" height="2" fill="white" opacity="0.7"/>' +
'<rect x="4" y="15" width="2" height="4" fill="white" opacity="0.7"/>' +
'<rect x="5" y="19" width="2" height="2" fill="white" opacity="0.7"/>' +
'<rect x="6" y="21" width="2" height="2" fill="white" opacity="0.7"/>' +
'<rect x="40" y="11" width="2" height="2" fill="white" opacity="0.7"/>' +
'<rect x="41" y="13" width="2" height="2" fill="white" opacity="0.7"/>' +
'<rect x="42" y="15" width="2" height="4" fill="white" opacity="0.7"/>' +
'<rect x="41" y="19" width="2" height="2" fill="white" opacity="0.7"/>' +
'<rect x="40" y="21" width="2" height="2" fill="white" opacity="0.7"/>' +
// Bottom: P N U D in pixel font
'<rect y="36" width="22" height="13" fill="#0468B1"/>' +
'<rect x="26" y="36" width="22" height="13" fill="#0468B1"/>' +
'<rect y="51" width="22" height="13" fill="#0468B1"/>' +
'<rect x="26" y="51" width="22" height="13" fill="#0468B1"/>' +
// P (pixel)
'<rect x="4" y="39" width="2" height="8" fill="white"/>' +
'<rect x="6" y="39" width="4" height="2" fill="white"/>' +
'<rect x="10" y="39" width="2" height="4" fill="white"/>' +
'<rect x="6" y="43" width="4" height="2" fill="white"/>' +
// N (pixel)
'<rect x="30" y="39" width="2" height="8" fill="white"/>' +
'<rect x="32" y="40" width="2" height="2" fill="white"/>' +
'<rect x="34" y="42" width="2" height="2" fill="white"/>' +
'<rect x="36" y="44" width="2" height="2" fill="white"/>' +
'<rect x="38" y="39" width="2" height="8" fill="white"/>' +
// U (pixel)
'<rect x="4" y="54" width="2" height="8" fill="white"/>' +
'<rect x="14" y="54" width="2" height="8" fill="white"/>' +
'<rect x="6" y="60" width="8" height="2" fill="white"/>' +
// D (pixel)
'<rect x="30" y="54" width="2" height="8" fill="white"/>' +
'<rect x="32" y="54" width="4" height="2" fill="white"/>' +
'<rect x="36" y="56" width="2" height="4" fill="white"/>' +
'<rect x="32" y="60" width="4" height="2" fill="white"/>' +
'</svg>';
const PNUD_LOGO = "data:image/svg+xml," + encodeURIComponent(PNUD_LOGO_SVG);
const IS_DEPLOYED = typeof window !== "undefined" && (window.location.hostname.includes("vercel.app") || window.location.hostname.includes(".") && !window.location.hostname.includes("localhost"));

// ── PDF export helper for chart elements ──
async function exportChartToPDF(elementId, filename) {
  try {
    await Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
    ]);
    const el = document.getElementById(elementId);
    if (!el) return;
    const canvas = await window.html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new window.jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pdfW / canvas.width, pdfH / canvas.height);
    const imgW = canvas.width * ratio;
    const imgH = canvas.height * ratio;
    pdf.addImage(imgData, "PNG", (pdfW - imgW) / 2, (pdfH - imgH) / 2, imgW, imgH);
    pdf.save(filename);
  } catch (e) {
    console.error("Chart PDF export failed:", e);
  }
}

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
const ConflictividadChart = memo(function ConflictividadChart() {
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
});

// ═══════════════════════════════════════════════════════════════
// TAB VIEWS
// ═══════════════════════════════════════════════════════════════

const Sparkline = memo(function Sparkline({ scId, currentWeek }) {
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
});

// ═══════════════════════════════════════════════════════════════
// SITREP DATA
// ═══════════════════════════════════════════════════════════════

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
      // Direct PDF download using html2canvas + jsPDF
      try {
        // Load libraries dynamically
        await Promise.all([
          loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"),
          loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
        ]);
        // Create hidden container with the HTML
        const container = document.createElement("div");
        container.innerHTML = html;
        container.style.cssText = "position:fixed;top:0;left:0;width:800px;background:#fff;z-index:99999;padding:40px;";
        document.body.appendChild(container);
        // Wait for fonts/images to load
        await new Promise(r => setTimeout(r, 600));
        const canvas = await window.html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        document.body.removeChild(container);
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();
        const imgW = canvas.width;
        const imgH = canvas.height;
        const ratio = pdfW / imgW;
        const scaledH = imgH * ratio;
        // Multi-page support
        let yOffset = 0;
        while (yOffset < scaledH) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, -yOffset, pdfW, scaledH);
          yOffset += pdfH;
        }
        pdf.save(`SITREP_${d.periodShort.replace(/[^a-zA-Z0-9]/g,"_")}.pdf`);
      } catch (e) {
        console.error("PDF generation failed:", e);
        // Fallback to print dialog
        const win = window.open(URL.createObjectURL(blob), "_blank");
        if (win) win.addEventListener("load", () => setTimeout(() => win.print(), 500));
      }
    } else {
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
                  { v:d.nacional.amnistia.solicitudes?.toLocaleString() || d.nacional.amnistia.fpDetenidos?.toLocaleString() || "—", l:d.nacional.amnistia.solicitudes ? "Solicitudes recibidas" : "Presos políticos (FP)", c:d.nacional.amnistia.solicitudes ? ACCENT : "#dc2626" },
                  { v:d.nacional.amnistia.libertadesPlenas?.toLocaleString() || "—", l:"Libertades plenas", c:"#16a34a" },
                  { v:d.nacional.amnistia.privadosLiberados?.toLocaleString() || d.nacional.amnistia.fpVerificados?.toLocaleString() || "—", l:d.nacional.amnistia.privadosLiberados ? "Privados liberados" : "Excarcelaciones verif. (FP)", c:d.nacional.amnistia.privadosLiberados ? TEXT : "#ca8a04" },
                  { v:d.nacional.amnistia.cautelares?.toLocaleString() || "—", l:"Con cautelares", c:TEXT },
                ].map((item, i) => (
                  <div key={i} style={{ background:BG3, padding:mob?10:14, textAlign:"center" }}>
                    <div style={{ fontFamily:fontSans, fontSize:mob?22:28, fontWeight:700, color:item.c }}>{item.v}</div>
                    <div style={{ fontFamily:font, fontSize:mob?8:9, letterSpacing:"0.08em", color:MUTED, textTransform:"uppercase", marginTop:4 }}>{item.l}</div>
                  </div>
                ))}
              </div>
              {d.nacional.amnistia.fpNota && (
                <div style={{ fontFamily:fontSans, fontSize:mob?10:11, color:MUTED, marginTop:10, padding:"6px 8px", background:BG3, borderLeft:`3px solid #ca8a04` }}>
                  📋 {d.nacional.amnistia.fpNota}
                </div>
              )}
              {d.nacional.amnistia.militares && (
              <div style={{ fontFamily:fontSans, fontSize:mob?10:11, color:MUTED, marginTop:10 }}>
                Excarcelación de <strong style={{ color:TEXT }}>{d.nacional.amnistia.militares} militares</strong> en el marco de la amnistía.
              </div>
              )}
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

const InstabilityChart = memo(function InstabilityChart({ histIdx, index, zone }) {
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
});

// ═══════════════════════════════════════════════════════════════
// BILATERAL CHART — Interactive hover chart for PizzINT data
// ═══════════════════════════════════════════════════════════════

const BilateralChart = memo(function BilateralChart({ chartData, cfg, maxV, minV, W, H, PL, PR, PT, PB, cW, cH, toX, toY, mob }) {
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
});

// ═══════════════════════════════════════════════════════════════
// NEWS ALERTS — Classify headlines by relevance/urgency
// ═══════════════════════════════════════════════════════════════

const NewsAlerts = memo(function NewsAlerts({ liveData, mob }) {
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
});

const CohesionMiniWidget = memo(function CohesionMiniWidget({ liveData = {} }) {
  const mob = useIsMobile();
  const [hover, setHover] = useState(false);
  const [hoverActor, setHoverActor] = useState(null);

  const data = liveData?.cohesion || null;

  const statusColor = {ALINEADO:"#16a34a",NEUTRO:"#ca8a04",TENSION:"#dc2626",SILENCIO:"#6b7280"};
  const statusLabel = {ALINEADO:"Alineado",NEUTRO:"Neutro",TENSION:"Tensión",SILENCIO:"Silencio"};

  if (!data) {
    return (
      <div style={{ border:`1px solid ${BORDER}`, background:BG2, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:14 }}>🏛</span>
        <span style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em" }}>COHESIÓN DE GOBIERNO · Cargando...</span>
        <span style={{ width:6, height:6, borderRadius:"50%", background:MUTED, animation:"pulse 1.5s infinite", marginLeft:"auto" }} />
      </div>
    );
  }

  const score = data.index;
  const level = data.level;
  const levelColor = {ALTA:"#16a34a",MEDIA:"#ca8a04",BAJA:"#f97316",CRITICA:"#dc2626"};
  const col = levelColor[level] || MUTED;
  const aligned = data.actors?.filter(a => a.status === "ALINEADO").length || 0;
  const tension = data.actors?.filter(a => a.status === "TENSION").length || 0;
  const actors = data.actors || [];

  return (
    <div style={{ border:`1px solid ${BORDER}`, background:BG2 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setHoverActor(null); }}>
      {/* Compact header row */}
      <div style={{ display:"flex", alignItems:"center", gap:0, cursor:"pointer" }}>
        {/* Left: Score */}
        <div style={{ padding:mob?"8px 10px":"10px 14px", display:"flex", alignItems:"center", gap:8, borderRight:`1px solid ${BORDER}40`, minWidth:mob?"auto":160 }}>
          <span style={{ fontSize:14 }}>🏛</span>
          <div>
            <div style={{ fontSize:8, fontFamily:font, letterSpacing:"0.12em", textTransform:"uppercase", color:MUTED }}>Cohesión de Gobierno</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:4, marginTop:1 }}>
              <span style={{ fontSize:mob?20:26, fontWeight:900, fontFamily:"'Playfair Display',serif", color:col, lineHeight:1 }}>{score}</span>
              <span style={{ fontSize:10, fontFamily:font, color:MUTED }}>/100</span>
            </div>
          </div>
        </div>
        {/* Mini thermometer */}
        <div style={{ flex:1, padding:mob?"6px 8px":"8px 14px" }}>
          <div style={{ position:"relative", height:10, background:"linear-gradient(to right, #dc2626, #f97316, #ca8a04, #16a34a)", borderRadius:4, overflow:"hidden" }}>
            {[25,50,75].map(v => <div key={v} style={{ position:"absolute", left:`${v}%`, top:0, bottom:0, width:1, background:"rgba(255,255,255,0.3)" }} />)}
            <div style={{ position:"absolute", left:`${score}%`, top:"50%", transform:"translate(-50%,-50%)", width:8, height:8, borderRadius:"50%", background:"#fff", border:`2px solid ${col}`, boxShadow:`0 0 4px ${col}` }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:7, fontFamily:font, color:`${MUTED}60`, marginTop:2 }}>
            <span>Crítica</span><span>Baja</span><span>Media</span><span>Alta</span>
          </div>
        </div>
        {/* Actor dots + level badge */}
        <div style={{ padding:mob?"6px 8px":"8px 14px", display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ display:"flex", gap:2 }}>
            {actors.map(a => (
              <span key={a.actor} title={`${a.name}: ${statusLabel[a.status]||a.status}`}
                onMouseEnter={() => setHoverActor(a.actor)}
                style={{ width:7, height:7, borderRadius:"50%", background:statusColor[a.status]||BORDER,
                  transition:"transform 0.15s", transform:hoverActor===a.actor?"scale(1.6)":"scale(1)" }} />
            ))}
          </div>
          <div style={{ fontSize:10, fontFamily:fontSans, fontWeight:700, color:col, padding:"1px 8px",
            background:`${col}12`, border:`1px solid ${col}25` }}>{level}</div>
        </div>
      </div>

      {/* Expanded on hover */}
      {hover && actors.length > 0 && (
        <div style={{ padding:mob?"8px 10px":"10px 14px", borderTop:`1px solid ${BORDER}40`, animation:"fadeSlide 0.2s ease" }}>
          <style>{`@keyframes fadeSlide { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }`}</style>
          {/* Actor grid */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:5, marginBottom:8 }}>
            {actors.map(a => {
              const sc = statusColor[a.status]||MUTED;
              const isHov = hoverActor===a.actor;
              return (
                <div key={a.actor}
                  onMouseEnter={() => setHoverActor(a.actor)}
                  onMouseLeave={() => setHoverActor(null)}
                  style={{ background:isHov?`${sc}08`:BG3, borderLeft:`3px solid ${sc}`, padding:"6px 8px",
                    borderRadius:3, transition:"all 0.15s" }}>
                  <div style={{ fontSize:10, fontWeight:600, color:TEXT, lineHeight:1.2,
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.name}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:3, marginTop:2 }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:sc }} />
                    <span style={{ fontSize:9, fontFamily:font, color:sc, fontWeight:600 }}>{statusLabel[a.status]||a.status}</span>
                    {a.mentions!=null && <span style={{ fontSize:8, fontFamily:font, color:MUTED, marginLeft:"auto" }}>{a.mentions}m</span>}
                  </div>
                  {isHov && a.evidence && (
                    <div style={{ fontSize:9, color:MUTED, marginTop:3, lineHeight:1.3 }}>{a.evidence}</div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Component bars compact */}
          {data.components && (
            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:4 }}>
              {Object.entries(data.components).filter(([,v])=>v).map(([key,comp]) => {
                const meta = {
                  aiAlignment:{name:"IA Mistral",color:"#8b5cf6"},
                  gdeltToneDivergence:{name:"Tono GDELT",color:"#0e7490"},
                  mentionSilence:{name:"Menciones",color:"#f59e0b"},
                  systemicCohesion:{name:"Chavismo",color:"#dc2626"},
                  polymarketDelta:{name:"Polymarket",color:"#3b82f6"},
                  sitrepValidation:{name:"SITREP",color:"#16a34a"},
                }[key]||{name:key,color:MUTED};
                return (
                  <div key={key} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ fontSize:9, fontFamily:font, color:MUTED, width:70, flexShrink:0 }}>{meta.name}</span>
                    <div style={{ flex:1, height:4, background:BG3, borderRadius:2, overflow:"hidden" }}>
                      <div style={{ width:`${Math.max(2,comp.score)}%`, height:"100%", background:meta.color, borderRadius:2 }} />
                    </div>
                    <span style={{ fontSize:9, fontFamily:font, fontWeight:600, color:meta.color, width:20, textAlign:"right" }}>{comp.score}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ fontSize:8, fontFamily:font, color:`${MUTED}50`, marginTop:6, display:"flex", justifyContent:"space-between" }}>
            <span>{aligned}✓ alineados · {tension}⚠ tensión · {data.engine||"—"}</span>
            <span>{new Date(data.fetchedAt).toLocaleString("es-VE",{timeZone:"America/Caracas",hour:"2-digit",minute:"2-digit"})}</span>
          </div>
        </div>
      )}
    </div>
  );
});

function TabDashboard({ week, liveData = {} }) {
  const mob = useIsMobile();
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
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
          if (brent < 60) liveAlerts.push({ name:"Brent ⬇", val:`$${brent.toFixed(2)}`, umbral:"Brent <$60 presiona ingresos petroleros — riesgo fiscal E2", level:"red" });
          else if (brent < 65) liveAlerts.push({ name:"Brent ⬇", val:`$${brent.toFixed(2)}`, umbral:"Brent <$65 reduce margen fiscal venezolano", level:"yellow" });
          else if (brent > 95) liveAlerts.push({ name:"Brent ⬆", val:`$${brent.toFixed(2)}`, umbral:"Brent >$95 — ingresos récord pero posible shock geopolítico (Ormuz/Irán)", level:"red" });
          else if (brent > 85) liveAlerts.push({ name:"Brent ⬆", val:`$${brent.toFixed(2)}`, umbral:"Brent >$85 — favorable para ingresos VEN, monitorear volatilidad", level:"yellow" });
        }

        // WTI
        if (liveData?.oil?.wti) {
          const wti = parseFloat(liveData.oil.wti);
          if (wti < 55) liveAlerts.push({ name:"WTI ⬇", val:`$${wti.toFixed(2)}`, umbral:"WTI <$55 señal de debilidad en mercado energético", level:"red" });
          else if (wti < 60) liveAlerts.push({ name:"WTI ⬇", val:`$${wti.toFixed(2)}`, umbral:"WTI en zona de presión (<$60)", level:"yellow" });
          else if (wti > 90) liveAlerts.push({ name:"WTI ⬆", val:`$${wti.toFixed(2)}`, umbral:"WTI >$90 — tensión en mercado energético global, ingresos VEN al alza", level:"red" });
          else if (wti > 80) liveAlerts.push({ name:"WTI ⬆", val:`$${wti.toFixed(2)}`, umbral:"WTI >$80 — favorable para Venezuela, monitorear causa del alza", level:"yellow" });
        }

        // Bilateral Threat Index
        if (liveData?.bilateral?.latest?.v) {
          const bilV = liveData.bilateral.latest.v;
          if (bilV > 2.0) liveAlerts.push({ name:"Bilateral 🇺🇸🇻🇪", val:`${bilV.toFixed(2)}σ`, umbral:"Índice bilateral CRÍTICO (>2σ) — crisis activa en relación EE.UU.-Venezuela", level:"red" });
          else if (bilV > 1.0) liveAlerts.push({ name:"Bilateral 🇺🇸🇻🇪", val:`${bilV.toFixed(2)}σ`, umbral:"Índice bilateral ALTO (>1σ) — tensión significativa", level:"yellow" });
        }

        // Conflictividad social (CONF_SEMANAL)
        if (CONF_SEMANAL.length > 0) {
          const lastW = CONF_SEMANAL[CONF_SEMANAL.length - 1];
          const prevW = CONF_SEMANAL.length > 1 ? CONF_SEMANAL[CONF_SEMANAL.length - 2] : null;
          const accel = prevW && prevW.protestas > 0 ? ((lastW.protestas - prevW.protestas) / prevW.protestas) * 100 : 0;

          // Weekly volume thresholds
          if (lastW.protestas > 50) liveAlerts.push({ name:"Protestas ✊", val:`${lastW.protestas}/sem`, umbral:`>50 protestas semanales — presión política de primer orden (${lastW.label})`, level:"red" });
          else if (lastW.protestas > 35) liveAlerts.push({ name:"Protestas ✊", val:`${lastW.protestas}/sem`, umbral:`Escalada sobre promedio del ciclo (>35/sem) — seguimiento activo`, level:"yellow" });

          // Territorial spread thresholds
          if (lastW.estados > 18) liveAlerts.push({ name:"Cobertura territorial", val:`${lastW.estados}/24`, umbral:`Protestas en ${lastW.estados} estados — alcance casi nacional`, level:"red" });
          else if (lastW.estados > 12) liveAlerts.push({ name:"Cobertura territorial", val:`${lastW.estados}/24`, umbral:`Protestas en ${lastW.estados} estados — multi-regional`, level:"yellow" });

          // Acceleration trigger: >50% increase week-over-week
          if (accel > 50) liveAlerts.push({ name:"Aceleración ⚡", val:`+${Math.round(accel)}%`, umbral:`Protestas aumentaron ${Math.round(accel)}% vs semana anterior (${prevW.protestas}→${lastW.protestas}) — escalada rápida`, level: accel > 100 ? "red" : "yellow" });
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

      {/* ── ROW 1b: Índice de Inestabilidad Compuesto (17 factores) ── */}
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

        // Protests: weekly SITREP data (CONF_SEMANAL) — more current than monthly OVCS
        const lastWeekConf = CONF_SEMANAL[CONF_SEMANAL.length - 1];
        const maxWeekProtests = Math.max(...CONF_SEMANAL.map(w => w.protestas), 1);
        const protestPct = lastWeekConf ? (lastWeekConf.protestas / maxWeekProtests) * 100 : 50;
        // Territorial spread: 23/24 estados = almost national = high instability signal
        const spreadPct = lastWeekConf ? (lastWeekConf.estados / 24) * 100 : 30;
        const repressionPct = lastWeekConf?.reprimidas > 0 ? Math.min(lastWeekConf.reprimidas * 25, 100) : 0;
        // Monthly trend: sum last 4 weeks of CONF_SEMANAL, compare to 2025 monthly average
        const last4Weeks = CONF_SEMANAL.slice(-4);
        const monthlyTotal = last4Weeks.reduce((s, w) => s + w.protestas, 0);
        const avg2025Monthly = CONF_MESES.reduce((s, m) => s + m.t, 0) / CONF_MESES.length; // ~185
        const monthlyTrendPct = avg2025Monthly > 0 ? Math.min((monthlyTotal / avg2025Monthly) * 100, 150) : 50; // >100 = escalating vs 2025

        // Amnesty: verification gap + political prisoners
        const amnLatest = AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 1];
        const gobLib = amnLatest?.gob?.libertades || amnLatest?.gob?.excarcelados || 1;
        const fpVerif = amnLatest?.fp?.verificados || 0;
        const amnBrechaPct = Math.max(0, (1 - fpVerif / gobLib) * 100);
        const presosPct = amnLatest?.fp?.detenidos ? Math.min((amnLatest.fp.detenidos / 1000) * 100, 100) : 50;

        // Bilateral Threat Index (PizzINT/GDELT) — LIVE
        const bilV = liveData?.bilateral?.latest?.v || 0;
        const bilPct = Math.min(bilV / 4 * 100, 100); // 0-4σ mapped to 0-100%

        // Government Cohesion Index (ICG) — LIVE (inverted: low cohesion = high instability)
        const icgRaw = liveData?.cohesion?.index ?? null;
        const icgInverted = icgRaw != null ? Math.max(0, 100 - icgRaw) : null; // 100-ICG: 0=full cohesion, 100=no cohesion

        // ── FORMULA (17 inputs, weights sum to ~100 with stabilizers) ──
        const raw = (redCount/totalInds)*10            // Ind. rojos: 10%
          + (e2/100)*8                                  // E2 Colapso: 8%
          + (e4/100)*7                                  // E4 Resistencia: 7%
          + (Math.min(brechaLive,100)/100)*10           // Brecha cambiaria: 10% (LIVE)
          + (tensRed/totalTens)*6                        // Tensiones rojas: 6%
          + (sigActive/sigTotal)*6                       // Señales E4+E2: 6%
          + (brentFactor/100)*4                          // Brent presión: 4% (LIVE)
          + (bilPct/100)*5                               // Bilateral Threat: 5% (LIVE)
          + ((icgInverted != null ? icgInverted : 50)/100)*5  // Cohesión GOB (inv): 5% (LIVE)
          + (protestPct/100)*5                           // Protestas semanal: 5% (SITREP)
          + (spreadPct/100)*4                            // Cobertura territorial: 4% (SITREP)
          + (Math.min(monthlyTrendPct,150)/150)*3        // Tendencia mensual: 3% (vs 2025)
          + (repressionPct/100)*3                        // Represión: 3%
          + (amnBrechaPct/100)*4                         // Brecha amnistía: 4%
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
          const pRaw = (redCount/totalInds)*10 + (pe2/100)*8 + (pe4/100)*7
            + (Math.min(brechaLive,100)/100)*10 + (pTR/pTT)*6 + (sigActive/sigTotal)*6
            + (brentFactor/100)*4 + (bilPct/100)*5 + ((icgInverted != null ? icgInverted : 50)/100)*5
            + (protestPct/100)*5 + (spreadPct/100)*4 + (Math.min(monthlyTrendPct,150)/150)*3 + (repressionPct/100)*3
            + (amnBrechaPct/100)*4 + (presosPct/100)*3 - (pe1/100)*6 - (pe3/100)*3;
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
          const wIcg = (wi === WEEKS.length - 1 && icgInverted != null) ? icgInverted : 50;
          // Per-week protest data from CONF_SEMANAL
          const wConf = CONF_SEMANAL[Math.min(wi, CONF_SEMANAL.length - 1)];
          const wProtestPct = wConf ? (wConf.protestas / Math.max(...CONF_SEMANAL.map(c=>c.protestas), 1)) * 100 : 50;
          const wSpreadPct = wConf ? (wConf.estados / 24) * 100 : 30;
          const wReprPct = wConf?.reprimidas > 0 ? Math.min(wConf.reprimidas * 25, 100) : 0;
          // Monthly trend for this week's position — sum 4 weeks ending at wi
          const wMonthSlice = CONF_SEMANAL.slice(Math.max(0, wi - 3), wi + 1);
          const wMonthTotal = wMonthSlice.reduce((s, c) => s + c.protestas, 0);
          const wMonthlyTrend = avg2025Monthly > 0 ? Math.min((wMonthTotal / avg2025Monthly) * 100, 150) : 50;
          const wr = (wRedProxy/wTotalSem)*10 + (we2/100)*8 + (we4/100)*7
            + (Math.min(wBrecha,100)/100)*10 + (wtr/wtt)*6 + (sigActive/sigTotal)*6
            + (wBrent/100)*4 + (wBil/100)*5 + (wIcg/100)*5 + (wProtestPct/100)*5 + (wSpreadPct/100)*4
            + (Math.min(wMonthlyTrend,150)/150)*3 + (wReprPct/100)*3
            + (wAmnBrecha/100)*4 + (wPresos/100)*3 - (we1/100)*6 - (we3/100)*3;
          return Math.max(0, Math.min(100, Math.round(wr)));
        });

        // Breakdown items for display
        const breakdown = [
          { label:"Ind. rojos", value:`${redCount}/${totalInds}`, pct:Math.round(redCount/totalInds*100), w:"10%" },
          { label:"Brecha camb.", value:`${brechaLive.toFixed(0)}%`, pct:Math.min(brechaLive,100), w:"10%", live:true },
          { label:"E2 Colapso", value:`${e2}%`, pct:e2, w:"8%" },
          { label:"E4 Resistencia", value:`${e4}%`, pct:e4, w:"7%" },
          { label:"Tens. rojas", value:`${tensRed}/${totalTens}`, pct:Math.round(tensRed/totalTens*100), w:"6%" },
          { label:"Señales E4/E2", value:`${sigActive}/${sigTotal}`, pct:Math.round(sigActive/sigTotal*100), w:"6%" },
          { label:"Protestas sem.", value:`${lastWeekConf?.protestas||"—"}`, pct:Math.round(protestPct), w:"5%" },
          { label:"Bilateral 🇺🇸🇻🇪", value:`${bilV.toFixed(1)}σ`, pct:Math.round(bilPct), w:"5%", live:true },
          { label:"Cohesión GOB 🏛", value:icgRaw != null ? `${icgRaw}` : "—", pct:icgInverted != null ? Math.round(icgInverted) : 50, w:"5%", live:true },
          { label:"Cobertura terr.", value:`${lastWeekConf?.estados||"—"}/24`, pct:Math.round(spreadPct), w:"4%" },
          { label:"Brent", value:`$${brentPrice}`, pct:brentFactor, w:"4%", live:true },
          { label:"Brecha amnist.", value:`${amnBrechaPct.toFixed(0)}%`, pct:Math.round(amnBrechaPct), w:"4%" },
          { label:"Tend. mensual", value:`${monthlyTotal} (4sem)`, pct:Math.round(Math.min(monthlyTrendPct,150)/1.5), w:"3%" },
          { label:"Represión", value:`${lastWeekConf?.reprimidas||0}`, pct:Math.round(repressionPct), w:"3%" },
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
              {/* AI Explain button */}
              <button onClick={async () => {
                if (aiExplanation) { setAiExplanation(null); return; }
                setAiLoading(true);
                try {
                  const factorsSummary = breakdown.map(b => `${b.label}: ${b.value} (peso ${b.w})`).join(", ");
                  // Gather additional dashboard context for richer analysis
                  const alertsSummary = (() => {
                    try {
                      const el = document.querySelectorAll("[data-alert-name]");
                      return el.length > 0 ? Array.from(el).map(e => e.dataset.alertName).join(", ") : "";
                    } catch { return ""; }
                  })();
                  const tensionsSummary = (typeof TENSIONS !== "undefined" ? TENSIONS : []).slice(0, 6).map(t => `[${t.level}] ${t.text}`).join("; ");
                  const prompt = `Eres analista senior de riesgo político del PNUD Venezuela. Escribe un análisis de dos párrafos cortos en español sobre el Índice de Inestabilidad.

DATOS DEL ÍNDICE:
- Score: ${index}/100 (zona: ${zone.label})
- ${delta !== null && delta !== 0 ? `Cambio: ${delta > 0 ? "+" : ""}${delta}pp vs semana anterior` : "Sin cambio vs semana anterior"}
- Factores y pesos: ${factorsSummary}

CONTEXTO ADICIONAL DEL DASHBOARD:
- Precio Brent: $${brentPrice} (referencia Venezuela)
- Protestas semanales: ${lastWeekConf?.protestas || "N/D"} en ${lastWeekConf?.estados || "N/D"}/24 estados
- Cobertura territorial de protestas: ${lastWeekConf?.estados || "N/D"}/24 estados (más estados = mayor extensión geográfica del descontento)
- ICG (Cohesión de Gobierno): ${icgRaw || "N/D"}/100
- Tendencia mensual protestas (4 sem): ${monthlyTotal}
- Tensiones clave: ${tensionsSummary}

INSTRUCCIONES:
Párrafo 1: Explica por qué el índice está en ${index}/100. Identifica los 3-4 factores que más lo impulsan al alza (protestas, cobertura territorial de protestas, brecha cambiaria, señales de colapso, etc.) y los 2-3 factores que lo contienen (probabilidades E1/E3, Brent alto si aplica, amnistía si aplica). IMPORTANTE: la cobertura territorial (${lastWeekConf?.estados || "N/D"}/24 estados) mide la extensión geográfica de las protestas, NO es un factor estabilizador — a mayor cobertura, mayor inestabilidad.

Párrafo 2: Qué vigilar esta semana y qué podría hacer que el índice suba o baje. Menciona riesgos específicos basados en los datos.

No uses markdown, no uses asteriscos, no uses bullet points, no uses negritas. Escribe en prosa analítica fluida.`;
                  const res = await fetch("/api/ai", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt, max_tokens: 500 }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    let text = data.text || data.content || "Sin respuesta";
                    text = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/\*(.*?)\*/g, "<i>$1</i>");
                    setAiExplanation(text);
                  } else {
                    setAiExplanation("Error: no se pudo generar el análisis (" + res.status + ")");
                  }
                } catch (e) { setAiExplanation("Error: " + e.message); }
                setAiLoading(false);
              }}
                style={{ fontSize:10, fontFamily:font, padding:"4px 10px", marginTop:10, border:`1px solid ${ACCENT}30`,
                  background:aiExplanation ? `${ACCENT}10` : "transparent", color:ACCENT, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:5, letterSpacing:"0.04em" }}>
                {aiLoading ? (
                  <><span style={{ width:8, height:8, border:`2px solid ${ACCENT}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite", display:"inline-block" }} /> Analizando</>
                ) : aiExplanation ? "✕ Cerrar" : "🤖 Explicar IA"}
              </button>
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

                {/* AI Explanation panel (triggered from left panel button) */}
                {aiExplanation && (
                  <div style={{ margin:"8px 0", padding:"10px 14px", background:`${ACCENT}06`, border:`1px solid ${ACCENT}15`,
                    fontSize:12, fontFamily:fontSans, color:TEXT, lineHeight:1.7 }}>
                    <div style={{ fontSize:9, fontFamily:font, color:ACCENT, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>
                      🤖 Análisis IA · Índice de Inestabilidad
                    </div>
                    <span dangerouslySetInnerHTML={{ __html: aiExplanation }} />
                  </div>
                )}

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

      {/* ── ROW 1d: Cohesión de Gobierno (mini) ── */}
      <CohesionMiniWidget liveData={liveData} />

      {/* ── ROW 2: Amnistía Tracker ── */}
      {(() => {
        const latest = AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 1];
        const prev = AMNISTIA_TRACKER.length > 1 ? AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 2] : null;
        const gobLib = latest.gob.libertades || latest.gob.excarcelados || 0;
        const fpVerif = latest.fp.verificados || 0;
        const brecha = gobLib && fpVerif ? Math.round((1 - fpVerif / gobLib) * 100) : null;
        const fpDelta = (prev?.fp?.verificados && fpVerif !== prev.fp.verificados) ? fpVerif - prev.fp.verificados : null;
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
                    {item.v}{item.delta != null && item.delta > 0 ? <span style={{ fontSize:11, color:"#16a34a", marginLeft:4, display:"inline" }}> +{item.delta}</span> : null}
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
      loadScript("https://platform.twitter.com/widgets.js").then(() => {
        if (window.twttr) window.twttr.widgets.load(node);
      });
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

const BrentChart = memo(function BrentChart({ history: rawHistory, forecast = [] }) {
  const [hover, setHover] = useState(null);
  const [zoomRange, setZoomRange] = useState("all");
  if (!rawHistory || rawHistory.length < 2) return null;

  // Downsample: group by day, take last price of each day
  const byDay = new Map();
  rawHistory.forEach(h => {
    const day = h.time ? h.time.split("T")[0] : new Date(h.time).toISOString().split("T")[0];
    byDay.set(day, h);
  });
  const allHistory = Array.from(byDay.values());
  if (allHistory.length < 2) return null;

  // Apply zoom range filter
  const now = new Date();
  const rangeMap = { "1m": 30, "3m": 90, "6m": 180, "1y": 365, "all": 99999 };
  const cutoff = new Date(now.getTime() - (rangeMap[zoomRange] || 99999) * 86400000);
  const history = zoomRange === "all" ? allHistory : allHistory.filter(h => new Date(h.time) >= cutoff);
  if (history.length < 2) return null;

  // Only show forecast in "all" or "1y" view
  const showForecast = (zoomRange === "all" || zoomRange === "1y") && forecast.length > 0;

  // Combine history + forecast for Y axis scaling
  const activeForecast = showForecast ? forecast : [];
  const allPrices = [...history.map(h => h.price), ...activeForecast.map(f => f.price)];
  const firstDate = history[0]?.time ? new Date(history[0].time).toLocaleDateString("es",{month:"short",year:"numeric"}) : "";
  const lastForecastDate = activeForecast.length > 0 ? new Date(activeForecast[activeForecast.length-1].time).toLocaleDateString("es",{month:"short",year:"numeric"}) : "";
  const lastDate = history[history.length-1]?.time ? new Date(history[history.length-1].time).toLocaleDateString("es",{month:"short",year:"numeric"}) : "";
  const chartLabel = activeForecast.length > 0
    ? `Brent Crude · ${firstDate} — ${lastForecastDate} · ${history.length} pts + ${activeForecast.length} pronóstico EIA`
    : `Brent Crude · ${firstDate} — ${lastDate} · ${history.length} puntos`;

  const prices = history.map(h => h.price);
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  const range = max - min || 1;
  
  // Extend chart width to accommodate forecast
  const totalPoints = history.length + (activeForecast.length > 0 ? Math.round(activeForecast.length * 4) : 0);
  const W = 700, H = 140, padL = 45, padR = 10, padT = 10, padB = 25;
  const cW = W - padL - padR, cH = H - padT - padB;

  const toX = (i) => padL + (i / (totalPoints - 1)) * cW;
  const toY = (v) => padT + cH - ((v - min) / range) * cH;

  const pathD = history.map((h, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(h.price)}`).join(" ");
  const areaD = pathD + ` L${toX(history.length - 1)},${padT + cH} L${toX(0)},${padT + cH} Z`;

  // Forecast path (dashed, starting from last historical point)
  let forecastPathD = "";
  let forecastAreaD = "";
  if (activeForecast.length > 0) {
    const lastHistX = toX(history.length - 1);
    const lastHistY = toY(history[history.length - 1].price);
    const forecastPts = activeForecast.map((f, i) => {
      const fi = history.length + Math.round((i + 1) * 4);
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
      <div id="chart-brent-export">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap:"wrap", gap:6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, fontFamily: font, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {chartLabel}
          </span>
          <Badge color="#22c55e">EN VIVO</Badge>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {["1m","3m","6m","1y","all"].map(r => (
            <button key={r} onClick={() => { setZoomRange(r); setHover(null); }}
              style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid ${zoomRange===r ? ACCENT : BORDER}`,
                background: zoomRange===r ? `${ACCENT}12` : "transparent", color: zoomRange===r ? ACCENT : MUTED,
                cursor:"pointer", letterSpacing:"0.05em", textTransform:"uppercase" }}>
              {r === "all" ? "Todo" : r}
            </button>
          ))}
          <button onClick={() => exportChartToPDF("chart-brent-export", "Brent_Crude_Venezuela.pdf")}
            style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid #dc262640`,
              background:"transparent", color:"#dc2626", cursor:"pointer", letterSpacing:"0.05em" }}>
            📄 PDF
          </button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
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
          {activeForecast.map((f, i) => {
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
      {activeForecast.length > 0 && (
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
      </div>
    </Card>
  );
});

// ═══════════════════════════════════════════════════════════════
// VENEZUELA PRODUCTION CHART — Monthly crude oil production (EIA/OPEC)
// ═══════════════════════════════════════════════════════════════

const VenProductionChart = memo(function VenProductionChart({ data: apiData }) {
  const [hover, setHover] = useState(null);
  const [zoomRange, setZoomRange] = useState("2y");

  // Merge API data with manual OPEC MOMR data
  // value = Secondary Sources (EIA/OPEC), dc = Direct Communication (PDVSA)
  const merged = (() => {
    const byMonth = new Map();
    (apiData || []).forEach(d => {
      const month = d.time.slice(0, 7);
      byMonth.set(month, { ...d, source: "EIA", dc: null });
    });
    VEN_PRODUCTION_MANUAL.forEach(d => {
      const month = d.time.slice(0, 7);
      const existing = byMonth.get(month);
      if (existing) {
        // EIA already has this month — just add dc (PDVSA) value
        existing.dc = d.dc || null;
      } else {
        // EIA doesn't have this month yet — use manual secondary + dc
        byMonth.set(month, { value: d.value, time: d.time, source: d.source || "OPEC MOMR", dc: d.dc || null });
      }
    });
    return Array.from(byMonth.values()).sort((a, b) => new Date(a.time) - new Date(b.time));
  })();

  // Apply zoom range filter
  const rangeMap = { "2y": 730, "5y": 1825, "all": 99999 };
  const now = new Date();
  const cutoff = new Date(now.getTime() - (rangeMap[zoomRange] || 99999) * 86400000);
  const data = zoomRange === "all" ? merged : merged.filter(d => new Date(d.time) >= cutoff);
  if (!data || data.length < 3) return null;

  const manualCount = data.filter(d => d.source !== "EIA").length;
  const hasDC = data.some(d => d.dc != null);

  const values = data.map(d => d.value);
  const dcValues = data.filter(d => d.dc != null).map(d => d.dc);
  const allValues = [...values, ...dcValues];
  const min = Math.min(...allValues) * 0.9;
  const max = Math.max(...allValues) * 1.05;
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
      <div id="chart-venprod-export">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap:"wrap", gap:6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, fontFamily: font, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            🇻🇪 Producción Petrolera Venezuela · {firstDate} — {lastDate} · {data.length} meses
          </span>
          <Badge color={ACCENT}>EIA/OPEC</Badge>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {["2y","5y","all"].map(r => (
            <button key={r} onClick={() => { setZoomRange(r); setHover(null); }}
              style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid ${zoomRange===r ? ACCENT : BORDER}`,
                background: zoomRange===r ? `${ACCENT}12` : "transparent", color: zoomRange===r ? ACCENT : MUTED,
                cursor:"pointer", letterSpacing:"0.05em", textTransform:"uppercase" }}>
              {r === "all" ? "Todo" : r}
            </button>
          ))}
          <button onClick={() => exportChartToPDF("chart-venprod-export", "Produccion_Petrolera_Venezuela.pdf")}
            style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid #dc262640`,
              background:"transparent", color:"#dc2626", cursor:"pointer", letterSpacing:"0.05em" }}>
            📄 PDF
          </button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
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

        {/* PDVSA Direct Communication bars (behind main bars, semi-transparent) */}
        {hasDC && data.map((d, i) => {
          if (d.dc == null) return null;
          const x = toX(i) - barW / 2 - barW * 0.15;
          const y = toY(d.dc);
          const h = PT + cH - y;
          return (
            <rect key={`dc-${i}`} x={x} y={y} width={barW * 0.4} height={Math.max(h, 0.5)}
              fill="#7c3aed" opacity={hover === i ? 0.6 : 0.3} rx={0.5} />
          );
        })}

        {/* Bars (Secondary Sources / EIA) */}
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
              {d.dc != null && <text x={x - barW*0.05} y={toY(d.dc) - 2} fontSize={3.5} fill="#7c3aed" textAnchor="middle" fontFamily={font}>PDVSA</text>}
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
          const tooltipW = 110;
          const tooltipX = hx > W * 0.65 ? hx - tooltipW - 8 : hx + 8;
          const hasBoth = d.dc != null;
          const tooltipH = hasBoth ? 46 : (d.source !== "EIA" ? 36 : 30);
          const tooltipY = Math.max(Math.min(hy - 18, PT + cH - tooltipH - 2), PT);
          const isManual = d.source !== "EIA";
          return (
            <>
              <line x1={hx} y1={PT} x2={hx} y2={PT + cH} stroke={ACCENT} strokeWidth={0.5} opacity={0.3} />
              <circle cx={hx} cy={hy} r={3} fill={ACCENT} stroke="#fff" strokeWidth={1.5} />
              {hasBoth && <circle cx={hx - barW*0.15} cy={toY(d.dc)} r={2.5} fill="#7c3aed" stroke="#fff" strokeWidth={1} />}
              <rect x={tooltipX} y={tooltipY} width={tooltipW} height={tooltipH} rx={2} fill={BG2} stroke={BORDER} strokeWidth={0.5} opacity={0.95} />
              <text x={tooltipX + 4} y={tooltipY + 11} fontSize={6} fill={MUTED} fontFamily={font}>
                {dt.toLocaleDateString("es", { month: "long", year: "numeric" })}
              </text>
              <text x={tooltipX + 4} y={tooltipY + 23} fontSize={8} fill={ACCENT} fontFamily={font} fontWeight="700">
                Sec: {d.value.toFixed(0)} kbd
              </text>
              {hasBoth && <text x={tooltipX + 4} y={tooltipY + 34} fontSize={8} fill="#7c3aed" fontFamily={font} fontWeight="700">
                PDVSA: {d.dc.toFixed(0)} kbd ({d.dc > d.value ? "+" : ""}{(d.dc - d.value).toFixed(0)})
              </text>}
              {isManual && !hasBoth && <text x={tooltipX + 4} y={tooltipY + 32} fontSize={5} fill="#eab308" fontFamily={font}>Fuente: {d.source}</text>}
              {isManual && hasBoth && <text x={tooltipX + 4} y={tooltipY + 43} fontSize={4.5} fill="#eab308" fontFamily={font}>{d.source}</text>}
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
        Fuente: EIA / OPEC Secondary Sources{hasDC ? " + PDVSA (Comunicación Directa)" : ""} · Actualización mensual{manualCount > 0 ? ` · ${manualCount} punto${manualCount>1?"s":""} OPEC MOMR (pendiente EIA)` : ""}
      </div>
      </div>
    </Card>
  );
});

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
      // Try direct API with CORS proxy (for local dev — no auth, limited)
      for (const proxyFn of CORS_PROXIES) {
        try {
          const [brentRes, wtiRes, gasRes] = await Promise.all([
            fetch(proxyFn("https://api.oilpriceapi.com/v1/prices/latest?by_code=BRENT_CRUDE_USD"), {
              signal: AbortSignal.timeout(6000),
            }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(proxyFn("https://api.oilpriceapi.com/v1/prices/latest?by_code=WTI_USD"), {
              signal: AbortSignal.timeout(6000),
            }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(proxyFn("https://api.oilpriceapi.com/v1/prices/latest?by_code=NATURAL_GAS_USD"), {
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
    // Auto-refresh every 5 minutes — pause when tab not visible
    let iv = setInterval(fetchPrices, 300000);
    const onVis1 = () => {
      clearInterval(iv);
      if (document.visibilityState === "visible") iv = setInterval(fetchPrices, 300000);
    };
    document.addEventListener("visibilitychange", onVis1);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onVis1); };
  }, []);

  // ── Scrape OilPriceAPI widget for real-time prices (widget loads in browser, bypasses serverless limits) ──
  useEffect(() => {
    let attempts = 0;
    const scrapeWidget = () => {
      const ticker = document.getElementById("oilpriceapi-ticker");
      if (!ticker) return;
      const allText = ticker.innerText || ticker.textContent || "";
      const brentMatch = allText.match(/BRENT[^$]*\$([\d.]+)/i);
      const wtiMatch = allText.match(/WTI[^$]*\$([\d.]+)/i);
      const gasMatch = allText.match(/(?:NATURAL.?GAS|NAT.?GAS)[^$]*\$([\d.]+)/i);
      if (brentMatch || wtiMatch) {
        const now = new Date().toISOString();
        setPrices(prev => ({
          ...prev,
          brent: brentMatch ? { price: parseFloat(brentMatch[1]), created_at: now } : prev?.brent,
          wti: wtiMatch ? { price: parseFloat(wtiMatch[1]), created_at: now } : prev?.wti,
          natgas: gasMatch ? { price: parseFloat(gasMatch[1]), created_at: now } : prev?.natgas,
        }));
        setSource("live");
        // Append live Brent price to chart history
        if (brentMatch) {
          const livePrice = parseFloat(brentMatch[1]);
          const today = new Date().toISOString().slice(0, 10);
          setBrentHistory(prev => {
            if (!prev || prev.length === 0) return prev;
            const filtered = prev.filter(h => h.time?.slice(0, 10) !== today);
            return [...filtered, { price: livePrice, time: today + "T12:00:00Z" }];
          });
        }
        return true;
      }
      return false;
    };
    const iv = setInterval(() => {
      attempts++;
      if (scrapeWidget() || attempts > 15) clearInterval(iv);
    }, 2000);
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
              {i === 0 && <Badge color={source === "live" ? "#22c55e" : source === "yahoo" ? "#22c55e" : "#a17d08"}>{source === "live" || source === "yahoo" ? "EN VIVO" : source === "eia" ? "EIA" : "ESTÁTICO"}</Badge>}
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

const EstadosMap = memo(function EstadosMap() {
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
});

function TabConflictividad() {
  const mob = useIsMobile();
  const [seccion, setSeccion] = useState("semanal26");

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
          {[{id:"semanal26",label:"Semanal 2026"},{id:"resumen",label:"Resumen 2025"},{id:"mensual",label:"Mensual"},{id:"derechos",label:"Derechos"},{id:"estados",label:"Estados"},{id:"historico",label:"Histórico"},{id:"acled",label:"ACLED"}].map(s => (
            <button key={s.id} onClick={() => setSeccion(s.id)}
              style={{ fontSize:12, fontFamily:font, padding:"6px 12px", border:"none",
                background:seccion===s.id?ACCENT:"transparent", color:seccion===s.id?"#fff":MUTED, cursor:"pointer", letterSpacing:"0.06em" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SEMANAL 2026 ── */}
      {seccion === "semanal26" && (() => {
        const latest = CONF_SEMANAL[CONF_SEMANAL.length - 1];
        const prev = CONF_SEMANAL.length > 1 ? CONF_SEMANAL[CONF_SEMANAL.length - 2] : null;
        const maxP = Math.max(...CONF_SEMANAL.map(w => w.protestas), 1);
        const maxE = Math.max(...CONF_SEMANAL.map(w => w.estados), 1);
        const totalAcum = CONF_SEMANAL.reduce((s, w) => s + w.protestas, 0);
        const deltaP = prev ? latest.protestas - prev.protestas : null;
        const deltaPct = prev && prev.protestas > 0 ? Math.round(((latest.protestas - prev.protestas) / prev.protestas) * 100) : null;

        return (<>
          {/* KPI row */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(5,1fr)", gap:10, marginBottom:16 }}>
            <Card accent={latest.protestas > 50 ? "#dc2626" : latest.protestas > 30 ? "#ca8a04" : "#16a34a"}>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Protestas semana</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                <span style={{ fontSize:26, fontWeight:800, fontFamily:"'Playfair Display',serif", color:latest.protestas > 50 ? "#dc2626" : latest.protestas > 30 ? "#ca8a04" : TEXT }}>{latest.protestas}</span>
                {deltaP != null && deltaP !== 0 && (
                  <span style={{ fontSize:12, fontFamily:font, color:deltaP > 0 ? "#dc2626" : "#16a34a", fontWeight:600 }}>
                    {deltaP > 0 ? "▲" : "▼"}{Math.abs(deltaP)} ({deltaPct > 0 ? "+" : ""}{deltaPct}%)
                  </span>
                )}
              </div>
              <div style={{ fontSize:10, color:MUTED }}>{latest.label}</div>
            </Card>
            <Card>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Estados</div>
              <span style={{ fontSize:26, fontWeight:800, fontFamily:"'Playfair Display',serif", color:latest.estados > 18 ? "#dc2626" : TEXT }}>{latest.estados}</span>
              <div style={{ fontSize:10, color:MUTED }}>de 24 entidades</div>
            </Card>
            <Card>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Reprimidas</div>
              <span style={{ fontSize:26, fontWeight:800, fontFamily:"'Playfair Display',serif", color:latest.reprimidas > 0 ? "#dc2626" : "#16a34a" }}>{latest.reprimidas}</span>
              <div style={{ fontSize:10, color:MUTED }}>esta semana</div>
            </Card>
            <Card>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Acumulado 2026</div>
              <span style={{ fontSize:26, fontWeight:800, fontFamily:"'Playfair Display',serif", color:ACCENT }}>{totalAcum}</span>
              <div style={{ fontSize:10, color:MUTED }}>S1–{latest.week}</div>
            </Card>
            <Card>
              <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Prom. semanal</div>
              <span style={{ fontSize:26, fontWeight:800, fontFamily:"'Playfair Display',serif", color:TEXT }}>{Math.round(totalAcum / CONF_SEMANAL.length)}</span>
              <div style={{ fontSize:10, color:MUTED }}>protestas/semana</div>
            </Card>
          </div>

          {/* Hecho clave de la semana */}
          <div style={{ background:`linear-gradient(135deg, #dc262608, transparent)`, border:"1px solid #dc262620", padding:"10px 14px", marginBottom:16 }}>
            <div style={{ fontSize:10, fontFamily:font, color:"#dc2626", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>Hecho clave · {latest.label}</div>
            <div style={{ fontSize:13, color:TEXT, lineHeight:1.6 }}>{latest.hecho}</div>
          </div>

          {/* Motivos de la semana */}
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>Motivos principales · {latest.label}</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {latest.motivos.map((m, i) => (
                <span key={i} style={{ fontSize:12, padding:"4px 12px", background:`${ACCENT}10`, color:ACCENT, border:`1px solid ${ACCENT}25`, borderRadius:20, fontFamily:font }}>{m}</span>
              ))}
            </div>
          </Card>

          {/* Evolución semanal — gráfica de barras */}
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Evolución semanal · Protestas S1 → {latest.week}</div>
            <div style={{ display:"flex", gap:3, alignItems:"flex-end", height:140 }}>
              {CONF_SEMANAL.map((w, i) => {
                const h = Math.max(4, (w.protestas / maxP) * 120);
                const isLast = i === CONF_SEMANAL.length - 1;
                const barColor = w.protestas > 50 ? "#dc2626" : w.protestas > 30 ? "#ca8a04" : ACCENT;
                return (
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                    <span style={{ fontSize:9, fontFamily:font, fontWeight:isLast ? 700 : 400, color:isLast ? barColor : MUTED }}>{w.protestas}</span>
                    <div style={{ width:"100%", height:h, background:barColor, opacity:isLast ? 1 : 0.5, borderRadius:"3px 3px 0 0", transition:"height 0.3s", position:"relative" }}>
                      {isLast && <div style={{ position:"absolute", top:-2, left:"50%", transform:"translateX(-50%)", width:6, height:6, borderRadius:"50%", background:barColor, boxShadow:`0 0 6px ${barColor}` }} />}
                    </div>
                    <span style={{ fontSize:8, fontFamily:font, color:isLast ? barColor : MUTED, fontWeight:isLast ? 700 : 400 }}>{w.week}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Estados por semana — sparkline horizontal */}
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Cobertura territorial · Estados con protestas</div>
            <div style={{ display:"flex", gap:3, alignItems:"flex-end", height:80 }}>
              {CONF_SEMANAL.map((w, i) => {
                const h = Math.max(4, (w.estados / 24) * 70);
                const isLast = i === CONF_SEMANAL.length - 1;
                const barColor = w.estados > 18 ? "#dc2626" : w.estados > 12 ? "#ca8a04" : "#0e7490";
                return (
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                    <span style={{ fontSize:9, fontFamily:font, fontWeight:isLast ? 700 : 400, color:isLast ? barColor : MUTED }}>{w.estados}</span>
                    <div style={{ width:"100%", height:h, background:barColor, opacity:isLast ? 1 : 0.5, borderRadius:"3px 3px 0 0" }} />
                    <span style={{ fontSize:8, fontFamily:font, color:isLast ? barColor : MUTED, fontWeight:isLast ? 700 : 400 }}>{w.week}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:10, fontFamily:font, color:MUTED }}>
              <span>Cobertura: {latest.estados}/24 estados ({Math.round(latest.estados/24*100)}%)</span>
              <span>{latest.estados > 18 ? "⚠ Alcance nacional" : latest.estados > 12 ? "Alcance multi-regional" : "Alcance regional"}</span>
            </div>
          </Card>

          {/* Table: all weeks */}
          <Card>
            <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>Detalle semanal · Ciclo 2026</div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:font }}>
                <thead>
                  <tr style={{ borderBottom:`2px solid ${BORDER}` }}>
                    {["Semana","Período","Protestas","Estados","Repr.","Hecho clave"].map(h => (
                      <th key={h} style={{ padding:"6px 8px", textAlign:"left", color:MUTED, fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CONF_SEMANAL.map((w, i) => {
                    const isLast = i === CONF_SEMANAL.length - 1;
                    return (
                      <tr key={i} style={{ borderBottom:`1px solid ${BORDER}30`, background:isLast ? `${ACCENT}06` : "transparent" }}>
                        <td style={{ padding:"6px 8px", fontWeight:isLast ? 700 : 400, color:isLast ? ACCENT : TEXT }}>{w.week}</td>
                        <td style={{ padding:"6px 8px", color:MUTED }}>{w.label}</td>
                        <td style={{ padding:"6px 8px", fontWeight:600, color:w.protestas > 50 ? "#dc2626" : w.protestas > 30 ? "#ca8a04" : TEXT }}>{w.protestas}</td>
                        <td style={{ padding:"6px 8px", color:w.estados > 18 ? "#dc2626" : TEXT }}>{w.estados}/24</td>
                        <td style={{ padding:"6px 8px", color:w.reprimidas > 0 ? "#dc2626" : "#16a34a" }}>{w.reprimidas}</td>
                        <td style={{ padding:"6px 8px", color:MUTED, fontSize:11, maxWidth:250, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.hecho}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>);
      })()}

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

  // Load Leaflet CSS + JS from CDN (deduped)
  useEffect(() => {
    loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
    loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js").then(() => initMap());

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

function RateChart({ data: rawData }) {
  const [hover, setHover] = useState(null);
  const [zoomRange, setZoomRange] = useState("all");
  const [viewMode, setViewMode] = useState("abs"); // "abs" = absolute, "yoy" = year-over-year

  // Apply zoom range filter
  const rangeMap = { "1m": 30, "3m": 90, "6m": 180, "1y": 365, "all": 99999 };
  const now = new Date();
  const cutoff = new Date(now.getTime() - (rangeMap[zoomRange] || 99999) * 86400000);
  const data = zoomRange === "all" ? rawData : rawData.filter(d => new Date(d.d) >= cutoff);
  if (!data || data.length < 2) return null;

  // ── YoY calculation: find value ~365 days ago for each point ──
  const yoyData = data.map(d => {
    const dateMs = new Date(d.d).getTime();
    const targetMs = dateMs - 365 * 86400000;
    // Find closest point within ±15 days of 1 year ago
    let closest = null, bestDiff = Infinity;
    for (const r of rawData) {
      const diff = Math.abs(new Date(r.d).getTime() - targetMs);
      if (diff < bestDiff && diff < 15 * 86400000) { bestDiff = diff; closest = r; }
    }
    const bcvYoY = closest?.bcv && d.bcv ? ((d.bcv - closest.bcv) / closest.bcv) * 100 : null;
    const parYoY = closest?.par && d.par ? ((d.par - closest.par) / closest.par) * 100 : null;
    const brechaAbs = d.bcv && d.par ? ((d.par - d.bcv) / d.bcv) * 100 : null;
    const brechaYearAgo = closest?.bcv && closest?.par ? ((closest.par - closest.bcv) / closest.bcv) * 100 : null;
    const brechaYoY = brechaAbs != null && brechaYearAgo != null ? brechaAbs - brechaYearAgo : null;
    return { d: d.d, bcvYoY, parYoY, brechaYoY };
  });

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
    <div id="chart-rates-export">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, flexWrap:"wrap", gap:4 }}>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={() => setViewMode("abs")}
            style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid ${viewMode==="abs" ? ACCENT : BORDER}`,
              background: viewMode==="abs" ? `${ACCENT}12` : "transparent", color: viewMode==="abs" ? ACCENT : MUTED,
              cursor:"pointer", letterSpacing:"0.05em" }}>
            Absoluto
          </button>
          <button onClick={() => setViewMode("yoy")}
            style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid ${viewMode==="yoy" ? "#22c55e" : BORDER}`,
              background: viewMode==="yoy" ? "#22c55e12" : "transparent", color: viewMode==="yoy" ? "#22c55e" : MUTED,
              cursor:"pointer", letterSpacing:"0.05em" }}>
            Var. interanual
          </button>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {["1m","3m","6m","1y","all"].map(r => (
            <button key={r} onClick={() => { setZoomRange(r); setHover(null); }}
              style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid ${zoomRange===r ? ACCENT : BORDER}`,
                background: zoomRange===r ? `${ACCENT}12` : "transparent", color: zoomRange===r ? ACCENT : MUTED,
                cursor:"pointer", letterSpacing:"0.05em", textTransform:"uppercase" }}>
              {r === "all" ? "Todo" : r}
            </button>
          ))}
          <button onClick={() => exportChartToPDF("chart-rates-export", "Tipo_Cambio_Venezuela.pdf")}
            style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid #dc262640`,
              background:"transparent", color:"#dc2626", cursor:"pointer", letterSpacing:"0.05em" }}>
            📄 PDF
          </button>
        </div>
      </div>

      {viewMode === "yoy" ? (() => {
        // ── YoY View ──
        const validYoY = yoyData.filter(d => d.bcvYoY != null || d.parYoY != null);
        if (validYoY.length < 2) return <div style={{ padding:20, textAlign:"center", fontSize:11, fontFamily:font, color:MUTED }}>No hay suficientes datos para calcular variación interanual (se necesitan al menos 365 días de historial)</div>;
        const allVals = validYoY.flatMap(d => [d.bcvYoY, d.parYoY, d.brechaYoY].filter(v => v != null));
        const yoyMin = Math.min(...allVals, 0);
        const yoyMax = Math.max(...allVals, 0);
        const yoyRange = yoyMax - yoyMin || 1;
        const toXy = (i) => padL + (i/(validYoY.length-1)) * cW;
        const toYy = (v) => padT + cH - ((v - yoyMin) / yoyRange) * cH;
        const zeroY = toYy(0);
        const makeYoYPath = (key) => validYoY.map((d,i) => d[key] != null ? `${i===0?"M":"L"}${toXy(i)},${toYy(d[key])}` : "").filter(Boolean).join(" ");
        return (<>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mx = (e.clientX - rect.left) / rect.width * W;
              const idx = Math.round(((mx - padL) / cW) * (validYoY.length-1));
              if (idx >= 0 && idx < validYoY.length) setHover(idx);
            }}
            onMouseLeave={() => setHover(null)}>
            {[0,0.25,0.5,0.75,1].map(f => {
              const val = yoyMax - f * yoyRange;
              return <g key={f}>
                <line x1={padL} y1={padT+f*cH} x2={padL+cW} y2={padT+f*cH} stroke="rgba(0,0,0,0.06)" />
                <text x={padL-6} y={padT+f*cH+3} textAnchor="end" fontSize={8} fill={MUTED} fontFamily={font}>{val.toFixed(0)}%</text>
              </g>;
            })}
            {zeroY >= padT && zeroY <= padT+cH && <line x1={padL} y1={zeroY} x2={padL+cW} y2={zeroY} stroke="rgba(0,0,0,0.2)" strokeDasharray="4 2" />}
            <path d={makeYoYPath("bcvYoY")} fill="none" stroke="#0468B1" strokeWidth={2} />
            <path d={makeYoYPath("parYoY")} fill="none" stroke="#E5243B" strokeWidth={2} />
            <path d={makeYoYPath("brechaYoY")} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" />
            {validYoY.map((d,i) => i % Math.max(1,Math.floor(validYoY.length/6)) === 0 ? (
              <text key={i} x={toXy(i)} y={H-6} textAnchor="middle" fontSize={8} fill={MUTED} fontFamily={font}>
                {new Date(d.d+"T00:00").toLocaleDateString("es",{day:"numeric",month:"short"})}
              </text>
            ) : null)}
            {hover !== null && hover < validYoY.length && <>
              <line x1={toXy(hover)} y1={padT} x2={toXy(hover)} y2={padT+cH} stroke="rgba(0,0,0,0.12)" />
              {validYoY[hover].bcvYoY != null && <circle cx={toXy(hover)} cy={toYy(validYoY[hover].bcvYoY)} r={4} fill="#0468B1" stroke={BG} strokeWidth={2} />}
              {validYoY[hover].parYoY != null && <circle cx={toXy(hover)} cy={toYy(validYoY[hover].parYoY)} r={4} fill="#E5243B" stroke={BG} strokeWidth={2} />}
            </>}
          </svg>
          {hover !== null && hover < validYoY.length && (() => {
            const d = validYoY[hover];
            return d ? (
              <div style={{ fontSize:13, fontFamily:font, marginTop:4, padding:"6px 12px", background:BG2, border:`1px solid ${BORDER}`, display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
                <span style={{ color:TEXT, fontWeight:600 }}>{new Date(d.d+"T00:00").toLocaleDateString("es",{day:"numeric",month:"short",year:"numeric"})}</span>
                {d.bcvYoY != null && <span style={{ color:"#0468B1" }}>BCV: {d.bcvYoY > 0 ? "+" : ""}{d.bcvYoY.toFixed(1)}%</span>}
                {d.parYoY != null && <span style={{ color:"#E5243B" }}>Paralelo: {d.parYoY > 0 ? "+" : ""}{d.parYoY.toFixed(1)}%</span>}
                {d.brechaYoY != null && <span style={{ color:"#f59e0b" }}>Δ Brecha: {d.brechaYoY > 0 ? "+" : ""}{d.brechaYoY.toFixed(1)}pp</span>}
              </div>
            ) : null;
          })()}
        </>);
      })() : (<>
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
      </>)}

      {/* Legend */}
      <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:8 }}>
        <span style={{ fontSize:12, fontFamily:font, color:"#0468B1" }}>━ BCV {viewMode === "yoy" ? "YoY %" : "Oficial"}</span>
        <span style={{ fontSize:12, fontFamily:font, color:"#E5243B" }}>━ Paralelo {viewMode === "yoy" ? "YoY %" : ""}</span>
        {viewMode === "abs" && <span style={{ fontSize:12, fontFamily:font, color:"#7c3aed" }}>┅ USDT (est.)</span>}
        <span style={{ fontSize:12, fontFamily:font, color:"#f59e0b" }}>┅ {viewMode === "yoy" ? "Δ Brecha (pp)" : "Brecha % (eje der.)"}</span>
      </div>
    </div>
  );
}

function BrechaChart({ data: rawData }) {
  const [hover, setHover] = useState(null);
  const [zoomRange, setZoomRange] = useState("all");

  // Apply zoom range filter
  const rangeMap = { "1m": 30, "3m": 90, "6m": 180, "1y": 365, "all": 99999 };
  const now = new Date();
  const cutoff = new Date(now.getTime() - (rangeMap[zoomRange] || 99999) * 86400000);
  const data = zoomRange === "all" ? rawData : rawData.filter(d => new Date(d.d) >= cutoff);

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
    <div id="chart-brecha-export">
    <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:6, gap:4 }}>
      {["1m","3m","6m","1y","all"].map(r => (
        <button key={r} onClick={() => { setZoomRange(r); setHover(null); }}
          style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid ${zoomRange===r ? ACCENT : BORDER}`,
            background: zoomRange===r ? `${ACCENT}12` : "transparent", color: zoomRange===r ? ACCENT : MUTED,
            cursor:"pointer", letterSpacing:"0.05em", textTransform:"uppercase" }}>
          {r === "all" ? "Todo" : r}
        </button>
      ))}
      <button onClick={() => exportChartToPDF("chart-brecha-export", "Brecha_Cambiaria_Venezuela.pdf")}
        style={{ fontSize:9, fontFamily:font, padding:"2px 8px", border:`1px solid #dc262640`,
          background:"transparent", color:"#dc2626", cursor:"pointer", letterSpacing:"0.05em" }}>
        📄 PDF
      </button>
    </div>
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
    </div>
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
    // Auto-refresh live rates every 5 minutes — pause when tab not visible
    const refreshRates = () => {
      const liveUrl = IS_DEPLOYED ? "/api/dolar?type=live" : "https://ve.dolarapi.com/v1/dolares";
      fetch(liveUrl, { signal: AbortSignal.timeout(8000) })
        .then(r => r.ok ? r.json() : null).then(data => {
          if (!data || !Array.isArray(data)) return;
          const o = data.find(d => d.fuente === "oficial"), p = data.find(d => d.fuente === "paralelo");
          const bcv = o?.promedio, par = p?.promedio;
          if (bcv && par) {
            setDolar({ bcv, par, brecha: ((par-bcv)/bcv)*100, updated: new Date().toISOString() });
            const today = new Date().toISOString().slice(0,10);
            setRateHistory(prev => {
              const filtered = prev.filter(h => h.d !== today);
              return [...filtered, { d:today, bcv, par, usdt:par*1.02, brecha:((par-bcv)/bcv)*100 }].sort((a,b) => a.d.localeCompare(b.d));
            });
          }
        }).catch(() => {});
    };
    let iv2 = setInterval(refreshRates, 300000);
    const onVis2 = () => {
      clearInterval(iv2);
      if (document.visibilityState === "visible") iv2 = setInterval(refreshRates, 300000);
    };
    document.addEventListener("visibilitychange", onVis2);
    return () => { clearInterval(iv2); document.removeEventListener("visibilitychange", onVis2); };
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

// ═══════════════════════════════════════════════════════════════
// TAB: COHESIÓN DE GOBIERNO — Índice de Cohesión del Gobierno (ICG)
// ═══════════════════════════════════════════════════════════════

function TabCohesion({ liveData = {} }) {
  const mob = useIsMobile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  // Use liveData if already loaded, otherwise fetch directly, fallback to mock
  useEffect(() => {
    if (liveData?.cohesion) {
      setData(liveData.cohesion);
      setLoading(false);
      return;
    }
    async function fetchCohesion() {
      if (IS_DEPLOYED) {
        try {
          const latestSitrep = [...ICG_HISTORY].reverse().find(h => h.sitrep && h.score != null);
          const sitrepParam = latestSitrep ? `&sitrep=${latestSitrep.score}` : "";
          const res = await fetch(`/api/news?source=cohesion${sitrepParam}&_t=${Date.now()}`, { signal: AbortSignal.timeout(30000) });
          if (res.ok) { const json = await res.json(); if (json.index != null) { setData(json); setLoading(false); return; } }
        } catch (e) { setError(e.message); }
      }
      // Fallback: mock data so the tab always renders
      setData({
        index:66, level:"MEDIA",
        components:{
          aiAlignment:{score:62,weight:0.30}, gdeltToneDivergence:{score:70,weight:0.15},
          mentionSilence:{score:75,weight:0.15}, polymarketDelta:{score:55,weight:0.10},
          sitrepValidation:{score:66,weight:0.30},
        },
        hasSitrep:true,
        actors:[
          {actor:"delcy",name:"Delcy Rodríguez",status:"ALINEADO",confidence:0.88,evidence:"Conduce relaciones bilaterales y agenda legislativa",signals:["Reconocida por Trump","Firma Amnistía"],mentions:45,tone:-2.1,topHeadlines:[]},
          {actor:"jrodriguez",name:"Jorge Rodríguez",status:"ALINEADO",confidence:0.82,evidence:"Dirige AN. Legislación activa",signals:["Ley Amnistía","Ley Hidrocarburos"],mentions:32,tone:-1.8,topHeadlines:[]},
          {actor:"cabello",name:"Diosdado Cabello",status:"NEUTRO",confidence:0.65,evidence:"Perfil mediático reducido. Sin confrontación pública",signals:["Baja visibilidad","Sin declaraciones divergentes"],mentions:18,tone:-3.5,topHeadlines:[]},
          {actor:"fanb",name:"Fuerza Armada Nacional Bolivariana (FANB)",status:"TENSION",confidence:0.72,evidence:"Reafirma lealtad institucional pero presiones de oxigenación",signals:["Demandas internas","Cubanos retirándose"],mentions:28,tone:-4.2,topHeadlines:[]},
          {actor:"padrino",name:"Vladimir Padrino López",status:"TENSION",confidence:0.68,evidence:"12 años en el cargo. Señales de malestar por continuidad de cúpula",signals:["Padrino 12 años","Reportaje El País"],mentions:15,tone:-3.8,topHeadlines:[]},
          {actor:"arreaza",name:"Jorge Arreaza",status:"NEUTRO",confidence:0.55,evidence:"Perfil bajo post-reestructuración. Sin señales claras",signals:["Baja visibilidad reciente"],mentions:10,tone:-2.5,topHeadlines:[]},
          {actor:"maduroguerra",name:"Nicolás Maduro Guerra",status:"NEUTRO",confidence:0.50,evidence:"Baja exposición mediática desde captura del padre",signals:["Sin rol público visible"],mentions:8,tone:-3.0,topHeadlines:[]},
          {actor:"an",name:"Asamblea Nacional",status:"ALINEADO",confidence:0.85,evidence:"Legislando activamente bajo dirección de J.Rodríguez",signals:["Amnistía operativa","Poder Ciudadano"],mentions:38,tone:-1.5,topHeadlines:[]},
        ],
        systemic:[
          {actor:"psuv",name:"PSUV",status:"ALINEADO",confidence:0.70,evidence:"Partido activo en agenda legislativa y gobernaciones",signals:["Congreso PSUV","Gobernaciones activas"],mentions:25,tone:-2.8,topHeadlines:[]},
          {actor:"chavismo",name:"Chavismo (movimiento)",status:"NEUTRO",confidence:0.55,evidence:"Cobertura mixta: unidad declarada pero tensiones internas",signals:["Discurso unidad","Señales fractura"],mentions:30,tone:-4.1,topHeadlines:[]},
          {actor:"colectivos",name:"Colectivos",status:"TENSION",confidence:0.60,evidence:"Actividad reducida. Señales de reconfiguración post-Maduro",signals:["Baja visibilidad","Reconfiguración"],mentions:12,tone:-5.5,topHeadlines:[]},
          {actor:"gobernadores",name:"Gobernadores chavistas",status:"ALINEADO",confidence:0.65,evidence:"Alineados con ejecutivo central en gestión regional",signals:["Gestión coordinada"],mentions:18,tone:-2.2,topHeadlines:[]},
          {actor:"militares",name:"Sector militar amplio",status:"NEUTRO",confidence:0.58,evidence:"CEOFANB y GNB sin señales públicas de fractura",signals:["Perfil bajo","Sin pronunciamientos"],mentions:20,tone:-3.9,topHeadlines:[]},
        ],
        polymarket:{price:0.57,question:"Delcy líder fin de 2026"},
        fetchedAt:new Date().toISOString(), engine:"mock",
      });
      setLoading(false);
    }
    fetchCohesion();
  }, [liveData?.cohesion]);

  const statusColor = {ALINEADO:"#16a34a",NEUTRO:"#ca8a04",TENSION:"#dc2626",SILENCIO:"#6b7280"};
  const statusIcon = {ALINEADO:"✓",NEUTRO:"◉",TENSION:"⚠",SILENCIO:"○"};
  const statusLabel = {ALINEADO:"Alineado",NEUTRO:"Neutro",TENSION:"Tensión",SILENCIO:"Silencio"};
  const levelColor = {ALTA:"#16a34a",MEDIA:"#ca8a04",BAJA:"#f97316",CRITICA:"#dc2626"};

  const historyData = ICG_HISTORY.map((h,i) => ({
    ...h, score: i===ICG_HISTORY.length-1 && data?.index ? data.index : h.score,
  })).filter(h => h.score !== null);

  if (loading) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:60 }}>
        <div style={{ width:40, height:40, border:`3px solid ${BORDER}`, borderTopColor:ACCENT, borderRadius:"50%", animation:"pulse 1s linear infinite" }} />
        <div style={{ fontFamily:font, fontSize:13, color:MUTED, letterSpacing:"0.1em" }}>CALCULANDO ÍNDICE DE COHESIÓN...</div>
        <div style={{ fontFamily:font, fontSize:11, color:`${MUTED}80` }}>Analizando 8 actores · GDELT · Polymarket · Mistral IA</div>
      </div>
    );
  }

  if (!data) return <Card><div style={{ color:MUTED, fontFamily:font, fontSize:13, textAlign:"center", padding:20 }}>Error cargando índice{error && `: ${error}`}</div></Card>;

  const score = data.index;
  const level = data.level;
  const col = levelColor[level] || MUTED;
  const actors = data.actors || [];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* KPI ROW */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr 1fr", gap:12 }}>
        <Card accent={col}>
          <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Índice de Cohesión</div>
          <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
            <span style={{ fontSize:42, fontWeight:800, fontFamily:font, color:col, lineHeight:1 }}>{score}</span>
            <span style={{ fontSize:14, fontFamily:font, color:col }}>/ 100</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:col, boxShadow:`0 0 6px ${col}` }} />
            <span style={{ fontSize:13, fontFamily:font, fontWeight:600, color:col }}>{level}</span>
          </div>
        </Card>
        <Card>
          <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Actores alineados</div>
          <div style={{ fontSize:32, fontWeight:700, fontFamily:font, color:"#16a34a", lineHeight:1 }}>
            {actors.filter(a=>a.status==="ALINEADO").length}<span style={{ fontSize:16, color:MUTED }}> / {actors.length}</span>
          </div>
          <div style={{ display:"flex", gap:4, marginTop:8 }}>
            {actors.map(a => <span key={a.actor} style={{ width:20, height:6, borderRadius:3, background:statusColor[a.status]||BORDER }} />)}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Delcy líder (PM)</div>
          <div style={{ fontSize:32, fontWeight:700, fontFamily:font, color:ACCENT, lineHeight:1 }}>
            {data.polymarket?.price!=null ? `${(data.polymarket.price*100).toFixed(0)}%` : "—"}
          </div>
          <div style={{ fontSize:11, fontFamily:font, color:MUTED, marginTop:6 }}>Polymarket · Probabilidad implícita</div>
        </Card>
        <Card>
          <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>Motor</div>
          <div style={{ fontSize:14, fontWeight:600, fontFamily:font, color:TEXT, lineHeight:1.3 }}>{data.hasSitrep?"SITREP + IA":"Solo IA"}</div>
          <div style={{ fontSize:11, fontFamily:font, color:MUTED, marginTop:6, lineHeight:1.4 }}>
            {data.engine==="mistral+gdelt"?"Mistral + GDELT + Polymarket":data.engine==="gdelt-only"?"GDELT + Polymarket":"Datos en carga"}
          </div>
          <div style={{ fontSize:10, fontFamily:font, color:`${MUTED}80`, marginTop:4 }}>
            {new Date(data.fetchedAt).toLocaleString("es-VE",{timeZone:"America/Caracas"})}
          </div>
        </Card>
      </div>

      {/* THERMOMETER */}
      <Card>
        <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Termómetro de Cohesión</div>
        <div style={{ position:"relative", height:40, background:"linear-gradient(to right, #dc2626, #f97316, #ca8a04, #16a34a)", borderRadius:6, overflow:"hidden" }}>
          {[25,50,75].map(v => <div key={v} style={{ position:"absolute", left:`${v}%`, top:0, bottom:0, width:1, background:"rgba(255,255,255,0.4)" }} />)}
          <div style={{ position:"absolute", left:`${score}%`, top:-4, transform:"translateX(-50%)", width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:`10px solid ${TEXT}` }} />
          <div style={{ position:"absolute", left:`${score}%`, bottom:-4, transform:"translateX(-50%)", width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderBottom:`10px solid ${TEXT}` }} />
          <div style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", fontSize:9, fontFamily:font, color:"#fff", fontWeight:700, textShadow:"0 1px 2px rgba(0,0,0,0.5)" }}>CRÍTICA</div>
          <div style={{ position:"absolute", left:"27%", top:"50%", transform:"translateY(-50%)", fontSize:9, fontFamily:font, color:"#fff", fontWeight:700, textShadow:"0 1px 2px rgba(0,0,0,0.5)" }}>BAJA</div>
          <div style={{ position:"absolute", left:"52%", top:"50%", transform:"translateY(-50%)", fontSize:9, fontFamily:font, color:"#fff", fontWeight:700, textShadow:"0 1px 2px rgba(0,0,0,0.5)" }}>MEDIA</div>
          <div style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:9, fontFamily:font, color:"#fff", fontWeight:700, textShadow:"0 1px 2px rgba(0,0,0,0.5)" }}>ALTA</div>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontSize:9, fontFamily:font, color:MUTED }}>
          <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
        </div>
      </Card>

      {/* ACTOR SEMAPHORE */}
      <Card>
        <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>Semáforo por Actor</div>
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"repeat(auto-fill, minmax(180px, 1fr))", gap:10 }}>
          {actors.map(a => {
            const isExp = expanded===a.actor;
            const ac = statusColor[a.status]||MUTED;
            return (
              <div key={a.actor} onClick={()=>setExpanded(isExp?null:a.actor)}
                style={{ background:BG3, border:`1px solid ${isExp?ac:BORDER}`, borderRadius:8, padding:"14px 12px",
                  cursor:"pointer", transition:"all 0.2s", borderLeft:`4px solid ${ac}` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:TEXT }}>{a.name}</span>
                  <span style={{ fontSize:16, color:ac }}>{statusIcon[a.status]}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:ac, boxShadow:`0 0 4px ${ac}` }} />
                  <span style={{ fontSize:12, fontFamily:font, fontWeight:600, color:ac }}>{statusLabel[a.status]}</span>
                  {a.confidence!=null && <span style={{ fontSize:10, fontFamily:font, color:MUTED, marginLeft:"auto" }}>{(a.confidence*100).toFixed(0)}%</span>}
                </div>
                {isExp && (
                  <div style={{ marginTop:10, borderTop:`1px solid ${BORDER}`, paddingTop:10 }}>
                    {a.evidence && <div style={{ fontSize:12, color:TEXT, lineHeight:1.5, marginBottom:6 }}>{a.evidence}</div>}
                    {a.signals?.length>0 && (
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:6 }}>
                        {a.signals.map((s,i) => <span key={i} style={{ fontSize:10, fontFamily:font, padding:"2px 6px", background:`${ac}15`, color:ac, border:`1px solid ${ac}30`, borderRadius:10 }}>{s}</span>)}
                      </div>
                    )}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, fontSize:11, fontFamily:font, color:MUTED }}>
                      <div>Menciones 7d: <span style={{ color:TEXT, fontWeight:600 }}>{a.mentions}</span></div>
                      <div>Tono GDELT: <span style={{ color:a.tone!=null&&a.tone<-3?"#dc2626":a.tone!=null&&a.tone<-1?"#ca8a04":"#16a34a", fontWeight:600 }}>{a.tone?.toFixed(1)??"—"}</span></div>
                    </div>
                    {a.topHeadlines?.length>0 && (
                      <div style={{ marginTop:8 }}>
                        <div style={{ fontSize:10, fontFamily:font, color:MUTED, marginBottom:4 }}>Titulares recientes:</div>
                        {a.topHeadlines.slice(0,2).map((h,i) => (
                          <a key={i} href={h.link} target="_blank" rel="noopener noreferrer"
                            style={{ display:"block", fontSize:11, color:ACCENT, textDecoration:"none", lineHeight:1.4, marginBottom:2 }}>↗ {h.title?.substring(0,80)}</a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* SYSTEMIC COHESION — Chavismo as a bloc, same card format as actors */}
      {data.systemic?.length > 0 && (
        <Card>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>
            🔴 Cohesión Sistémica · Chavismo como Bloque
          </div>
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"repeat(auto-fill, minmax(180px, 1fr))", gap:10 }}>
            {data.systemic.map(a => {
              const isExp = expanded===a.actor;
              const ac = statusColor[a.status]||MUTED;
              return (
                <div key={a.actor} onClick={()=>setExpanded(isExp?null:a.actor)}
                  style={{ background:BG3, border:`1px solid ${isExp?ac:BORDER}`, borderRadius:8, padding:"14px 12px",
                    cursor:"pointer", transition:"all 0.2s", borderLeft:`4px solid ${ac}` }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:TEXT }}>{a.name}</span>
                    <span style={{ fontSize:16, color:ac }}>{statusIcon[a.status]}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:ac, boxShadow:`0 0 4px ${ac}` }} />
                    <span style={{ fontSize:12, fontFamily:font, fontWeight:600, color:ac }}>{statusLabel[a.status]}</span>
                    {a.confidence!=null && <span style={{ fontSize:10, fontFamily:font, color:MUTED, marginLeft:"auto" }}>{(a.confidence*100).toFixed(0)}%</span>}
                  </div>
                  {isExp && (
                    <div style={{ marginTop:10, borderTop:`1px solid ${BORDER}`, paddingTop:10 }}>
                      {a.evidence && <div style={{ fontSize:12, color:TEXT, lineHeight:1.5, marginBottom:6 }}>{a.evidence}</div>}
                      {a.signals?.length>0 && (
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:6 }}>
                          {a.signals.map((s,i) => <span key={i} style={{ fontSize:10, fontFamily:font, padding:"2px 6px", background:`${ac}15`, color:ac, border:`1px solid ${ac}30`, borderRadius:10 }}>{s}</span>)}
                        </div>
                      )}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, fontSize:11, fontFamily:font, color:MUTED }}>
                        <div>Menciones 7d: <span style={{ color:TEXT, fontWeight:600 }}>{a.mentions}</span></div>
                        <div>Tono GDELT: <span style={{ color:a.tone!=null&&a.tone<-3?"#dc2626":a.tone!=null&&a.tone<-1?"#ca8a04":"#16a34a", fontWeight:600 }}>{a.tone?.toFixed(1)??"—"}</span></div>
                      </div>
                      {a.topHeadlines?.length>0 && (
                        <div style={{ marginTop:8 }}>
                          <div style={{ fontSize:10, fontFamily:font, color:MUTED, marginBottom:4 }}>Titulares recientes:</div>
                          {a.topHeadlines.slice(0,2).map((h,i) => (
                            <a key={i} href={h.link} target="_blank" rel="noopener noreferrer"
                              style={{ display:"block", fontSize:11, color:ACCENT, textDecoration:"none", lineHeight:1.4, marginBottom:2 }}>↗ {h.title?.substring(0,80)}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* COMPONENTS BREAKDOWN */}
      <Card>
        <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>Descomposición del Índice</div>
        {data.components && Object.entries(data.components).filter(([,v])=>v).map(([key,comp]) => {
          const labels = {
            aiAlignment:{name:"Alineación IA (Mistral)",icon:"🤖",color:"#8b5cf6"},
            gdeltToneDivergence:{name:"Divergencia Tono GDELT",icon:"📡",color:"#0e7490"},
            mentionSilence:{name:"Silencio mediático",icon:"🔇",color:"#f59e0b"},
            systemicCohesion:{name:"Cohesión Chavismo",icon:"🔴",color:"#dc2626"},
            polymarketDelta:{name:"Señal Polymarket",icon:"📊",color:"#3b82f6"},
            sitrepValidation:{name:"Validación SITREP",icon:"📋",color:"#16a34a"},
          };
          const meta = labels[key]||{name:key,icon:"●",color:MUTED};
          return (
            <div key={key} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <span style={{ fontSize:12, color:TEXT }}>{meta.icon} {meta.name}</span>
                <span style={{ fontSize:12, fontFamily:font, fontWeight:700, color:meta.color }}>
                  {comp.score} <span style={{ fontWeight:400, color:MUTED, fontSize:10 }}>({(comp.weight*100).toFixed(0)}%)</span>
                </span>
              </div>
              <div style={{ height:8, background:BG3, borderRadius:4, overflow:"hidden" }}>
                <div style={{ width:`${Math.max(2,comp.score)}%`, height:"100%", background:`linear-gradient(90deg, ${meta.color}80, ${meta.color})`, borderRadius:4, transition:"width 0.6s ease" }} />
              </div>
            </div>
          );
        })}
      </Card>

      {/* EVOLUTION CHART */}
      {historyData.length>1 && (
        <Card>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Evolución ICG · S1 → Actual</div>
          <CohesionChart data={historyData} />
        </Card>
      )}

      {/* METHODOLOGY */}
      <Card>
        <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>Metodología</div>
        <div style={{ fontSize:13, color:TEXT, lineHeight:1.7 }}>
          El Índice de Cohesión del Gobierno (ICG) mide la alineación interna de la élite gobernante en una escala 0–100. Combina una capa automática diaria (clasificación IA de artículos por actor, divergencia de tono GDELT, detección de silencios mediáticos y señales de Polymarket) con una validación semanal anclada en el SITREP del equipo analítico. Entre actualizaciones semanales, la IA mantiene el pulso diario — ruidoso pero en tiempo real — y cada viernes el SITREP ancla y corrige.
        </div>
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10, marginTop:12 }}>
          <div style={{ background:BG3, padding:"10px 12px", borderRadius:6 }}>
            <div style={{ fontSize:11, fontFamily:font, color:ACCENT, fontWeight:600, marginBottom:4 }}>Capa Automática (70%)</div>
            <div style={{ fontSize:11, color:MUTED, lineHeight:1.5 }}>Alineación IA 30% · GDELT Tono 15% · Menciones 15% · Polymarket 10%</div>
          </div>
          <div style={{ background:BG3, padding:"10px 12px", borderRadius:6 }}>
            <div style={{ fontSize:11, fontFamily:font, color:"#16a34a", fontWeight:600, marginBottom:4 }}>Capa SITREP (30%)</div>
            <div style={{ fontSize:11, color:MUTED, lineHeight:1.5 }}>Votaciones AN · Designaciones · Declaraciones · Tensiones internas</div>
          </div>
        </div>
      </Card>

      {/* Status footer */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:10, fontFamily:font, color:`${MUTED}60` }}>
        <span>{data.engine==="mock" ? "⚠ Datos demo — conectar MISTRAL_API_KEY para datos en vivo" : `Motor: ${data.engine}`}</span>
        {error && <span style={{ color:"#ca8a04" }}>⚠ {error}</span>}
      </div>
    </div>
  );
}

const CohesionChart = memo(function CohesionChart({ data }) {
  const [hover, setHover] = useState(null);
  const W=700, H=280, padL=45, padR=30, padT=30, padB=32;
  const cW=W-padL-padR, cH=H-padT-padB;

  // Dynamic Y range with padding — don't waste space showing 0-60 if data is 65-82
  const scores = data.map(d => d.score);
  const dataMin = Math.min(...scores);
  const dataMax = Math.max(...scores);
  const rangePad = Math.max((dataMax - dataMin) * 0.25, 8);
  const yMin = Math.max(0, Math.floor((dataMin - rangePad) / 5) * 5); // snap to 5s
  const yMax = Math.min(100, Math.ceil((dataMax + rangePad) / 5) * 5);
  const yRange = yMax - yMin || 1;

  const toX = (i) => padL + (i / (data.length - 1)) * cW;
  const toY = (v) => padT + cH - ((v - yMin) / yRange) * cH;

  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d.score)}`).join(" ");
  const areaD = pathD + ` L${toX(data.length - 1)},${padT + cH} L${toX(0)},${padT + cH} Z`;

  // Zone bands clipped to visible range
  const zones = [
    { from: 75, to: 100, color: "#16a34a", label: "Alta" },
    { from: 50, to: 75, color: "#ca8a04", label: "Media" },
    { from: 25, to: 50, color: "#f97316", label: "Baja" },
    { from: 0, to: 25, color: "#dc2626", label: "Crítica" },
  ];

  // Grid lines at nice intervals within visible range
  const gridStep = yRange > 30 ? 10 : 5;
  const gridLines = [];
  for (let v = Math.ceil(yMin / gridStep) * gridStep; v <= yMax; v += gridStep) {
    gridLines.push(v);
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width * W;
        const idx = Math.round(((mx - padL) / cW) * (data.length - 1));
        if (idx >= 0 && idx < data.length) setHover(idx);
      }}
      onMouseLeave={() => setHover(null)}>
      {/* Zone backgrounds — clipped to visible range */}
      {zones.map(z => {
        const zTop = Math.min(z.to, yMax);
        const zBot = Math.max(z.from, yMin);
        if (zTop <= zBot) return null;
        return <rect key={z.from} x={padL} y={toY(zTop)} width={cW} height={toY(zBot) - toY(zTop)} fill={`${z.color}10`} />;
      })}
      {/* Zone labels on right edge */}
      {zones.map(z => {
        const mid = (Math.min(z.to, yMax) + Math.max(z.from, yMin)) / 2;
        if (mid < yMin || mid > yMax) return null;
        return <text key={z.label} x={padL + cW + 4} y={toY(mid) + 3} fontSize={8} fill={z.color} fontFamily={font} opacity={0.7}>{z.label}</text>;
      })}
      {/* Grid lines */}
      {gridLines.map(v => (
        <g key={v}>
          <line x1={padL} y1={toY(v)} x2={padL + cW} y2={toY(v)} stroke="rgba(0,0,0,0.06)" strokeDasharray="4 3" />
          <text x={padL - 4} y={toY(v) + 3} textAnchor="end" fontSize={9} fill={MUTED} fontFamily={font}>{v}</text>
        </g>
      ))}
      {/* Area gradient */}
      <defs>
        <linearGradient id="icgGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.20" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#icgGrad2)" />
      {/* Main line */}
      <path d={pathD} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Data points */}
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const isPrev = i === data.length - 2;
        return <circle key={i} cx={toX(i)} cy={toY(d.score)} r={isLast ? 6 : isPrev ? 4 : 3}
          fill={isLast ? ACCENT : BG2} stroke={ACCENT} strokeWidth={isLast ? 2.5 : 2} />;
      })}
      {/* Pulse on latest */}
      <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1].score)} r={10}
        fill="none" stroke={ACCENT} strokeWidth={1.5} opacity={0.3} style={{ animation: "pulse 2s ease-in-out infinite" }} />
      {/* Score label on latest point */}
      <text x={toX(data.length - 1)} y={toY(data[data.length - 1].score) - 12}
        textAnchor="middle" fontSize={11} fontWeight={700} fill={ACCENT} fontFamily={font}>
        {data[data.length - 1].score}
      </text>
      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize={9}
          fill={i === data.length - 1 ? ACCENT : MUTED} fontWeight={i === data.length - 1 ? 700 : 400} fontFamily={font}>
          {d.week}
        </text>
      ))}
      {/* Hover tooltip — smart positioning */}
      {hover != null && hover < data.length && (() => {
        const hx = toX(hover);
        const hy = toY(data[hover].score);
        const note = data[hover].note || "";
        const truncNote = note.length > 45 ? note.substring(0, 45) + "…" : note;
        const noteW = Math.max(truncNote.length * 5.5, 100);
        // Position tooltip: prefer above, but if too close to top, go below
        const above = hy - padT > 60;
        const ty = above ? hy - 28 : hy + 16;
        const noteY = above ? hy - 48 : hy + 38;
        // Clamp X to stay within chart
        const clampX = (x, w) => Math.max(padL + w / 2, Math.min(padL + cW - w / 2, x));
        return <>
          <line x1={hx} y1={padT} x2={hx} y2={padT + cH} stroke="rgba(0,0,0,0.08)" />
          <circle cx={hx} cy={hy} r={5} fill={ACCENT} stroke={BG} strokeWidth={2} />
          {/* Score badge */}
          <rect x={clampX(hx, 80) - 40} y={ty - 14} width={80} height={22} rx={4} fill={TEXT} opacity={0.92} />
          <text x={clampX(hx, 80)} y={ty + 1} textAnchor="middle" fontSize={12} fill="#fff" fontWeight={700} fontFamily={font}>
            {data[hover].week}: {data[hover].score}
          </text>
          {/* Note */}
          {truncNote && <>
            <rect x={clampX(hx, noteW + 12) - (noteW + 12) / 2} y={noteY - 12} width={noteW + 12} height={18} rx={3} fill={BG2} stroke={BORDER} opacity={0.95} />
            <text x={clampX(hx, noteW)} y={noteY + 1} textAnchor="middle" fontSize={8.5} fill={MUTED} fontFamily={font}>
              {truncNote}
            </text>
          </>}
        </>;
      })()}
    </svg>
  );
});

const TABS = [
  { id:"dashboard", label:"Dashboard", icon:"📊" },
  { id:"sitrep", label:"SITREP", icon:"📋" },
  { id:"matriz", label:"Matriz", icon:"🎯" },
  { id:"monitor", label:"Monitor", icon:"🚦" },
  { id:"cohesion", label:"Cohesión", icon:"🏛" },
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
  const [liveData, setLiveData] = useState({ dolar:null, oil:null, gdeltSummary:null, news:null, bilateral:null, cohesion:null, fetched:false });

  useEffect(() => {
    async function fetchLiveData() {
      const results = { dolar:null, oil:null, gdeltSummary:null, news:null, bilateral:null, cohesion:null, fetched:true };
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
        // GDELT tone via proxy (avoids CORS — proxy has the data)
        const gdeltUrl = IS_DEPLOYED ? "/api/gdelt" : null;
        if (gdeltUrl) {
          const gRes = await fetch(gdeltUrl, { signal:AbortSignal.timeout(8000) }).then(r=>r.ok?r.json():null).catch(()=>null);
          if (gRes?.data?.length > 0) {
            const last7 = gRes.data.slice(-7);
            const tones = last7.map(d => d.tone).filter(v => v != null);
            const vols = last7.map(d => d.instability).filter(v => v != null);
            results.gdeltSummary = {
              tone: tones.length > 0 ? tones.reduce((a,b)=>a+b,0)/tones.length : null,
              volume: vols.length > 0 ? Math.round(vols.reduce((a,b)=>a+b,0)) : null,
            };
          }
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
      try {
        // Government Cohesion Index (ICG)
        // Get latest SITREP score from ICG_HISTORY for cohesion anchor
        const latestSitrep = [...ICG_HISTORY].reverse().find(h => h.sitrep && h.score != null);
        const sitrepParam = latestSitrep ? `&sitrep=${latestSitrep.score}` : "";
        const cohUrl = IS_DEPLOYED ? `/api/news?source=cohesion${sitrepParam}&_t=${Math.floor(Date.now()/600000)}` : null;
        if (cohUrl) {
          const cRes = await fetch(cohUrl, { signal:AbortSignal.timeout(15000) }).then(r=>r.ok?r.json():null).catch(()=>null);
          if (cRes?.index != null) results.cohesion = cRes;
        }
      } catch {}
      setLiveData(results);

      // ── Write-back to Supabase: persist live data to fill daily_readings nulls ──
      if (IS_DEPLOYED) {
        try {
          const params = new URLSearchParams({ type: "write_reading" });
          if (results.bilateral?.latest?.v != null) params.set("bilateral_v", results.bilateral.latest.v.toFixed(2));
          if (results.cohesion?.index != null) {
            params.set("icg_score", results.cohesion.index);
            params.set("icg_level", results.cohesion.level || "");
          }
          if (results.gdeltSummary?.tone != null) params.set("gdelt_tone", results.gdeltSummary.tone.toFixed(2));
          if (results.gdeltSummary?.volume != null) params.set("gdelt_volume", results.gdeltSummary.volume);
          if (results.dolar?.brecha) params.set("brecha", parseFloat(results.dolar.brecha).toFixed(1));
          if (results.dolar?.paralelo) params.set("paralelo", results.dolar.paralelo);
          if (results.oil?.brent) params.set("brent", results.oil.brent);
          if (results.oil?.wti) params.set("wti", results.oil.wti);
          // Only write if we have at least 2 data points (avoid writing empty rows)
          const fieldCount = [...params.entries()].filter(([k]) => k !== "type").length;
          if (fieldCount >= 2) {
            fetch(`/api/socioeconomic?${params.toString()}`, { signal: AbortSignal.timeout(5000) }).catch(() => {});
          }
        } catch {}
      }
    }
    fetchLiveData();
    // Auto-refresh every 5 min — pause when tab not visible
    let iv3 = setInterval(fetchLiveData, 300000);
    const onVis3 = () => {
      clearInterval(iv3);
      if (document.visibilityState === "visible") {
        fetchLiveData(); // refresh immediately when tab becomes visible
        iv3 = setInterval(fetchLiveData, 300000);
      }
    };
    document.addEventListener("visibilitychange", onVis3);
    return () => { clearInterval(iv3); document.removeEventListener("visibilitychange", onVis3); };
  }, []);

  // ── Scrape OilPriceAPI widget to update liveData.oil with real-time prices ──
  // Mounts a hidden widget at App level so it loads regardless of which tab is open
  useEffect(() => {
    // Mount hidden OilPriceAPI ticker if not already present
    if (!document.getElementById("oilpriceapi-ticker")) {
      const container = document.createElement("div");
      container.id = "oilpriceapi-ticker-wrap";
      container.style.cssText = "position:fixed;bottom:0;right:0;width:400px;height:60px;clip:rect(0,0,0,0);clip-path:inset(50%);pointer-events:none;";
      const tickerDiv = document.createElement("div");
      tickerDiv.id = "oilpriceapi-ticker";
      tickerDiv.setAttribute("data-theme", "light");
      tickerDiv.setAttribute("data-commodities", "BRENT,WTI,NATURAL_GAS");
      tickerDiv.setAttribute("data-layout", "horizontal");
      container.appendChild(tickerDiv);
      const script = document.createElement("script");
      script.src = "https://www.oilpriceapi.com/widgets/ticker.js";
      script.async = true;
      container.appendChild(script);
      document.body.appendChild(container);
    }

    let oilScraped = false;
    const scrapeOilWidget = () => {
      // Try multiple selectors — widget might render differently
      const ticker = document.getElementById("oilpriceapi-ticker") || document.getElementById("oilpriceapi-ticker-global");
      if (!ticker) return false;
      // Get all text content including nested elements and iframes
      let allText = ticker.innerText || ticker.textContent || "";
      // Also check all span/div children for price patterns
      if (!allText || allText.length < 10) {
        const els = ticker.querySelectorAll("span, div, td, a");
        allText = Array.from(els).map(e => e.textContent).join(" ");
      }
      // Broader regex: match various price formats ($103.14, $ 103.14, 103.14 USD, etc.)
      const brentMatch = allText.match(/BRENT[^0-9$]*\$?\s*([\d,.]+)/i) || allText.match(/Brent[^0-9]*?([\d]{2,3}\.[\d]{1,2})/i);
      const wtiMatch = allText.match(/WTI[^0-9$]*\$?\s*([\d,.]+)/i) || allText.match(/WTI[^0-9]*?([\d]{2,3}\.[\d]{1,2})/i);
      if (brentMatch || wtiMatch) {
        const parsePr = (m) => m ? parseFloat(m[1].replace(",","")) : null;
        const bVal = parsePr(brentMatch);
        const wVal = parsePr(wtiMatch);
        // Sanity check: prices should be between $20-$200
        if ((bVal && bVal > 20 && bVal < 200) || (wVal && wVal > 20 && wVal < 200)) {
          setLiveData(prev => ({
            ...prev,
            oil: {
              ...prev?.oil,
              brent: bVal && bVal > 20 ? bVal : prev?.oil?.brent,
              wti: wVal && wVal > 20 ? wVal : prev?.oil?.wti,
              source: "oilpriceapi-widget",
            },
          }));
          oilScraped = true;
          return true;
        }
      }
      return false;
    };
    // Phase 1: aggressive retry every 2s for 40s
    let attempts = 0;
    const ivFast = setInterval(() => {
      attempts++;
      if (scrapeOilWidget() || attempts > 20) clearInterval(ivFast);
    }, 2000);
    // Phase 2: keep retrying every 30s indefinitely (widget might load late)
    const ivSlow = setInterval(() => {
      if (!oilScraped) scrapeOilWidget();
    }, 30000);
    return () => { clearInterval(ivFast); clearInterval(ivSlow); };
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
    loadScript('//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit');
  }, []);

  return (
    <div style={{ fontFamily:fontSans, background:BG, minHeight:"100vh", color:TEXT, overflowX:"hidden" }}>
      {/* Loading splash — shown until liveData finishes first fetch */}
      {!liveData.fetched && (
        <div style={{ position:"fixed", inset:0, zIndex:99999, background:BG, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:0, animation:"fadeIn 0.3s ease" }}>
          {/* Logo */}
          <img src={PNUD_LOGO} alt="PNUD" style={{ height:70, marginBottom:18, animation:"slideDown 0.6s ease" }} />
          {/* Title */}
          <div style={{ fontSize:30, fontWeight:900, fontFamily:"'Playfair Display',serif", color:ACCENT,
            letterSpacing:"0.02em", animation:"slideDown 0.6s ease 0.1s both" }}>
            Monitor de Contexto Situacional
          </div>
          <div style={{ fontSize:12, fontFamily:font, color:MUTED, letterSpacing:"0.2em", textTransform:"uppercase",
            marginTop:4, animation:"slideDown 0.6s ease 0.2s both" }}>
            Venezuela 2026
          </div>
          {/* Animated progress bar */}
          <div style={{ width:220, height:3, background:`${BORDER}40`, borderRadius:2, marginTop:24, overflow:"hidden",
            animation:"slideDown 0.6s ease 0.3s both" }}>
            <div style={{ width:"100%", height:"100%", background:`linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
              animation:"shimmer 1.5s ease infinite" }} />
          </div>
          {/* Status text */}
          <div style={{ marginTop:12, fontSize:10, fontFamily:font, color:MUTED, animation:"pulse 1.5s infinite",
            letterSpacing:"0.08em" }}>
            Cargando datos en vivo...
          </div>
          {/* Data source tags with staggered fade */}
          <div style={{ marginTop:20, display:"flex", gap:6, animation:"slideDown 0.6s ease 0.4s both" }}>
            {["Dólar","Petróleo","GDELT","Bilateral","ICG"].map((label,i) => (
              <span key={i} style={{ fontSize:8, fontFamily:font, color:`${MUTED}50`, padding:"2px 8px",
                border:`1px solid ${BORDER}50`, letterSpacing:"0.08em",
                animation:`fadeIn 0.4s ease ${0.5 + i*0.15}s both` }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(100%); } }
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
          <img src={PNUD_LOGO} alt="PNUD" style={{ height:mob?32:40 }} />
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
        {tab === "cohesion" && <TabCohesion liveData={liveData} />}
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
