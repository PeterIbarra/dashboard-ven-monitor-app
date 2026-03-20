// ═══════════════════════════════════════════════════════════════
// GDELT FETCHER — Live via CORS proxy, fallback to mock
// ═══════════════════════════════════════════════════════════════

const GDELT_BASE = "https://api.gdeltproject.org/api/v2/doc/doc";
const GDELT_TIMESPAN = "120d";

// Detect if running on Vercel (has /api routes) vs local/Claude artifact
export const IS_DEPLOYED = typeof window !== "undefined" && (window.location.hostname.includes("vercel.app") || window.location.hostname.includes(".") && !window.location.hostname.includes("localhost"));

export const CORS_PROXIES = IS_DEPLOYED
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

export function parseGdeltCsv(csvText) {
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

export async function fetchAllGdelt() {
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

export function generateMockGdelt() {
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
