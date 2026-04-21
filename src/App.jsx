import React, { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════
import { WEEKS } from "./data/weekly.js";
import { TABS } from "./data/tabs.js";

// ═══════════════════════════════════════════════════════════════
// SHARED
// ═══════════════════════════════════════════════════════════════
import { BG, BG2, BORDER, TEXT, MUTED, ACCENT, font, fontSans } from "./constants";
import { IS_DEPLOYED, loadScript } from "./utils";
import { useIsMobile } from "./hooks/useIsMobile";
import { Badge } from "./components/Badge";

// ═══════════════════════════════════════════════════════════════
// TABS & LAYOUT COMPONENTS
// ═══════════════════════════════════════════════════════════════
import { TabDashboard } from "./components/tabs/TabDashboard";
import { TabSitrep } from "./components/tabs/TabSitrep";
import { TabMatriz } from "./components/tabs/TabMatriz";
import { TabMonitor } from "./components/tabs/TabMonitor";
import { TabClimaSocial } from "./components/tabs/TabClimaSocial";
import { TabGdelt } from "./components/tabs/TabGdelt";
import { TabConflictividad } from "./components/tabs/TabConflictividad";
import { TabIODA } from "./components/tabs/TabIODA";
import { TabMercados } from "./components/tabs/TabMercados";
import { TabMacro } from "./components/tabs/TabMacro";
import { NewsTicker } from "./components/NewsTicker";
import { MethodologyFooter } from "./components/MethodologyFooter";
import { AuthGate, UserButton } from "./components/AuthGate";

const PNUD_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" shape-rendering="crispEdges"><rect width="32" height="22" fill="#0468B1"/><rect x="11" y="2" width="10" height="1" fill="white"/><rect x="9" y="3" width="2" height="1" fill="white"/><rect x="21" y="3" width="2" height="1" fill="white"/><rect x="8" y="4" width="1" height="1" fill="white"/><rect x="23" y="4" width="1" height="1" fill="white"/><rect x="7" y="5" width="1" height="3" fill="white"/><rect x="24" y="5" width="1" height="3" fill="white"/><rect x="7" y="8" width="1" height="3" fill="white"/><rect x="24" y="8" width="1" height="3" fill="white"/><rect x="7" y="11" width="1" height="3" fill="white"/><rect x="24" y="11" width="1" height="3" fill="white"/><rect x="8" y="14" width="1" height="1" fill="white"/><rect x="23" y="14" width="1" height="1" fill="white"/><rect x="9" y="15" width="2" height="1" fill="white"/><rect x="21" y="15" width="2" height="1" fill="white"/><rect x="11" y="16" width="10" height="1" fill="white"/><rect x="15" y="3" width="2" height="14" fill="white" opacity="0.5"/><rect x="8" y="9" width="16" height="1" fill="white" opacity="0.5"/><rect x="13" y="4" width="6" height="1" fill="white" opacity="0.4"/><rect x="12" y="5" width="1" height="1" fill="white" opacity="0.4"/><rect x="19" y="5" width="1" height="1" fill="white" opacity="0.4"/><rect x="11" y="6" width="1" height="2" fill="white" opacity="0.4"/><rect x="20" y="6" width="1" height="2" fill="white" opacity="0.4"/><rect x="11" y="10" width="1" height="2" fill="white" opacity="0.4"/><rect x="20" y="10" width="1" height="2" fill="white" opacity="0.4"/><rect x="12" y="13" width="1" height="1" fill="white" opacity="0.4"/><rect x="19" y="13" width="1" height="1" fill="white" opacity="0.4"/><rect x="13" y="14" width="6" height="1" fill="white" opacity="0.4"/><rect x="5" y="5" width="1" height="1" fill="white" opacity="0.6"/><rect x="4" y="6" width="1" height="2" fill="white" opacity="0.6"/><rect x="4" y="8" width="1" height="3" fill="white" opacity="0.6"/><rect x="4" y="11" width="1" height="2" fill="white" opacity="0.6"/><rect x="5" y="13" width="1" height="1" fill="white" opacity="0.6"/><rect x="26" y="5" width="1" height="1" fill="white" opacity="0.6"/><rect x="27" y="6" width="1" height="2" fill="white" opacity="0.6"/><rect x="27" y="8" width="1" height="3" fill="white" opacity="0.6"/><rect x="27" y="11" width="1" height="2" fill="white" opacity="0.6"/><rect x="26" y="13" width="1" height="1" fill="white" opacity="0.6"/><rect x="15" y="17" width="2" height="2" fill="white" opacity="0.5"/><rect x="13" y="18" width="1" height="1" fill="white" opacity="0.4"/><rect x="18" y="18" width="1" height="1" fill="white" opacity="0.4"/><rect y="22" width="32" height="1" fill="#e8ecf0"/><rect y="23" width="15" height="10" fill="#0468B1"/><rect x="17" y="23" width="15" height="10" fill="#0468B1"/><rect y="33" width="32" height="1" fill="#e8ecf0"/><rect y="34" width="15" height="10" fill="#0468B1"/><rect x="17" y="34" width="15" height="10" fill="#0468B1"/><rect x="3" y="25" width="1" height="6" fill="white"/><rect x="4" y="25" width="3" height="1" fill="white"/><rect x="7" y="25" width="1" height="3" fill="white"/><rect x="4" y="28" width="3" height="1" fill="white"/><rect x="20" y="25" width="1" height="6" fill="white"/><rect x="21" y="26" width="1" height="1" fill="white"/><rect x="22" y="27" width="1" height="1" fill="white"/><rect x="23" y="28" width="1" height="1" fill="white"/><rect x="24" y="29" width="1" height="1" fill="white"/><rect x="25" y="25" width="1" height="6" fill="white"/><rect x="3" y="36" width="1" height="6" fill="white"/><rect x="9" y="36" width="1" height="6" fill="white"/><rect x="4" y="41" width="5" height="1" fill="white"/><rect x="20" y="36" width="1" height="6" fill="white"/><rect x="21" y="36" width="3" height="1" fill="white"/><rect x="24" y="37" width="1" height="4" fill="white"/><rect x="21" y="41" width="3" height="1" fill="white"/></svg>';
const PNUD_LOGO = "data:image/svg+xml," + encodeURIComponent(PNUD_LOGO_SVG);
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

export default function MonitorPNUD() {
  const [tab, setTab] = useState("dashboard");
  const [week, setWeek] = useState(WEEKS.length - 1);
  const mob = useIsMobile();

  // ── Shared live data (fetched once, available to all tabs including AI) ──
  const [liveData, setLiveData] = useState({ dolar:null, oil:null, gdeltSummary:null, news:null, bilateral:null, cohesion:null, ioda:null, fetched:false });

  useEffect(() => {
    async function fetchLiveData() {
      const results = { dolar:null, oil:null, gdeltSummary:null, news:null, bilateral:null, cohesion:null, ioda:null, fetched:true };
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
          if (oRes) results.oil = { brent:oRes.brent?.price, wti:oRes.wti?.price, gas:oRes.natgas?.price, source:oRes.source || "unknown" };
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
        // Government Cohesion Index (ICG) — from Supabase cache (cron saves every 8h)
        if (IS_DEPLOYED) {
          const cRes = await fetch(`/api/articles?type=icg&_t=${Math.floor(Date.now()/600000)}`, { signal:AbortSignal.timeout(6000) }).then(r=>r.ok?r.json():null).catch(()=>null);
          if (cRes?.cached && cRes.icg?.index != null) {
            const icg = cRes.icg;
            const level = icg.index >= 75 ? "ALTA" : icg.index >= 55 ? "MEDIA" : icg.index >= 35 ? "BAJA" : "CRITICA";
            const actors = (icg.actors || []).map(a => ({
              actor: a.actor?.toLowerCase().replace(/\s+/g,"").slice(0,12) || "unknown",
              name: a.actor, status: a.alignment,
              confidence: a.confidence, evidence: a.evidence, signals: a.signals || [],
              mentions: 0, tone: 0, topHeadlines: [],
            }));
            const systemic = actors.filter(a => ["psuv","chavismo","colectivo","gobernador","militar","sector"].some(s => a.name?.toLowerCase().includes(s)));
            const individual = actors.filter(a => !systemic.includes(a));
            results.cohesion = {
              index: icg.index, level, actors: individual, systemic,
              engine: `cached/${icg.provider || "cron"}`, fetchedAt: icg.date + "T06:00:00Z",
              cachedDate: icg.date, hasSitrep: true,
            };
          }
        }
      } catch {}
      // IODA — national connectivity + electrical alerts (using outage endpoints)
      try {
        if (IS_DEPLOYED) {
          const now = Math.floor(Date.now() / 1000);
          const from6h = now - 6 * 3600;
          const from7d = now - 7 * 86400;
          
          // Helper: fetch IODA endpoint
          const iodaGet = async (path, params) => {
            const qs = Object.entries(params).map(([k,v])=>`${k}=${v}`).join("&");
            return fetch(`/api/ioda?path=${path}&${qs}`, { signal:AbortSignal.timeout(10000) }).then(r=>r.ok?r.json():null).catch(()=>null);
          };
          
          // National health from signals/raw (last 6h)
          const natRaw = await iodaGet("signals/raw/country/VE", { from:from6h, until:now });
          let natHealth = null;
          if (natRaw?.data) {
            const raw = Array.isArray(natRaw.data) ? natRaw.data.flat() : [];
            const probing = raw.find(s => s.datasource === "ping-slash24");
            if (probing?.values?.length) {
              const vals = probing.values.filter(v => v !== null);
              if (vals.length >= 5) {
                const current = vals[vals.length - 1];
                const sorted = [...vals].sort((a,b) => a - b);
                const p95 = sorted[Math.floor(sorted.length * 0.95)] || 1;
                natHealth = Math.min(100, Math.round((current / p95) * 100));
              }
            }
          }
          
          // All 24 Venezuelan states: IODA codes
          const keyStates = [
            { code:"4482", name:"Falcón" }, { code:"4483", name:"Apure" }, { code:"4484", name:"Barinas" },
            { code:"4485", name:"Mérida" }, { code:"4486", name:"Táchira" }, { code:"4487", name:"Trujillo" },
            { code:"4488", name:"Zulia" }, { code:"4489", name:"Cojedes" }, { code:"4490", name:"Carabobo" },
            { code:"4491", name:"Lara" }, { code:"4492", name:"Portuguesa" }, { code:"4493", name:"Yaracuy" },
            { code:"4494", name:"Amazonas" }, { code:"4495", name:"Bolívar" }, { code:"4496", name:"Anzoátegui" },
            { code:"4497", name:"Aragua" }, { code:"4498", name:"Vargas" }, { code:"4499", name:"Distrito Capital" },
            { code:"4501", name:"Guárico" }, { code:"4502", name:"Monagas" }, { code:"4503", name:"Miranda" },
            { code:"4504", name:"Nueva Esparta" }, { code:"4505", name:"Sucre" }, { code:"4506", name:"Delta Amacuro" },
          ];
          
          // Fetch alerts for key states (7d window for electricity persistence)
          const stateAlertResults = await Promise.allSettled(
            keyStates.map(async st => {
              const json = await iodaGet("outages/alerts", { entityType:"region", entityCode:st.code, from:from7d, until:now });
              const alerts = Array.isArray(json?.data) ? json.data : [];
              
              // Current connectivity from last alert
              const pingAlerts = alerts.filter(a => a.datasource === "ping-slash24");
              const bgpAlerts = alerts.filter(a => a.datasource === "bgp");
              const lastPing = pingAlerts[pingAlerts.length - 1];
              const pingH = lastPing?.historyValue > 0 ? Math.min(100, Math.round((lastPing.value / lastPing.historyValue) * 100)) : 100;
              
              // Electrical events: ping critical + BGP stable
              const critPing = pingAlerts.filter(a => a.level === "critical");
              const critBgp = bgpAlerts.filter(a => a.level === "critical");
              const electricAlerts = critPing.filter(cp => {
                const bgpDown = critBgp.some(cb => Math.abs(cb.time - cp.time) < 1800);
                return !bgpDown; // electric = ping down + BGP stable
              }).map(cp => ({
                time: cp.time,
                dropPct: cp.historyValue > 0 ? Math.round(((cp.historyValue - cp.value) / cp.historyValue) * 100) : 0,
                value: cp.value,
                historyValue: cp.historyValue,
              }));
              
              return {
                ...st, health: pingH,
                electricAlerts,
                hasElecEvent: electricAlerts.length > 0,
                worstElecDrop: electricAlerts.length > 0 ? Math.max(...electricAlerts.map(e => e.dropPct)) : 0,
                lastElecTime: electricAlerts.length > 0 ? Math.max(...electricAlerts.map(e => e.time)) : null,
              };
            })
          );
          
          const stateData = stateAlertResults.filter(r => r.status === "fulfilled" && r.value).map(r => r.value);
          const worstInternet = stateData.sort((a,b) => a.health - b.health)[0] || null;
          
          // Electrical events: filter to those within 7d, sorted by severity
          const elecStates = stateData.filter(s => s.hasElecEvent && s.lastElecTime > from7d)
            .sort((a,b) => b.worstElecDrop - a.worstElecDrop);
          
          results.ioda = {
            avgHealth: natHealth,
            worstState: worstInternet?.name || null,
            worstHealth: worstInternet?.health ?? null,
            states: stateData,
            // Electrical alerts (7d persistence)
            elecAlerts: elecStates.map(s => ({
              state: s.name, dropPct: s.worstElecDrop,
              lastTime: s.lastElecTime, events: s.electricAlerts.length,
            })),
            elecCount: elecStates.reduce((acc, s) => acc + s.electricAlerts.length, 0),
          };
        }
      } catch {}
      setLiveData(results);

      // ── Write-back to Supabase: persist live data to fill daily_readings nulls ──
      if (IS_DEPLOYED) {
        try {
          const params = new URLSearchParams({ type: "write_reading" });
          if (results.bilateral?.latest?.v != null) params.set("bilateral_v", results.bilateral.latest.v.toFixed(2));
          // ICG is NOT written back from frontend — cron is the authoritative source
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
    <AuthGate>
    <div style={{ fontFamily:fontSans, background:BG, minHeight:"100vh", color:TEXT, overflowX:"hidden" }}>
      {/* Loading splash — shown until liveData finishes first fetch */}
      {!liveData.fetched && (
        <div style={{ position:"fixed", inset:0, zIndex:99999, background:BG, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:0 }}>
          {/* Animated pixel art PNUD logo — builds itself piece by piece */}
          <div style={{ marginBottom:20, position:"relative" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="72" height="100" shapeRendering="crispEdges">
              <style>{`
                .px { opacity:0; animation: pxIn 0.15s ease forwards; }
                .gl { animation: glowPx 2s ease-in-out infinite alternate; }
                @keyframes pxIn { from { opacity:0; transform:scale(0); } to { opacity:1; transform:scale(1); } }
                @keyframes glowPx { 0% { filter:brightness(1); } 100% { filter:brightness(1.3); } }
                @keyframes globeSpin { 0% { transform:translateX(0); } 50% { transform:translateX(2px); } 100% { transform:translateX(0); } }
              `}</style>
              {/* Blue background - fades in first */}
              <rect width="32" height="22" fill={ACCENT} className="px" style={{animationDelay:"0s"}} />
              <rect y="23" width="15" height="10" fill={ACCENT} className="px" style={{animationDelay:"0.05s"}} />
              <rect x="17" y="23" width="15" height="10" fill={ACCENT} className="px" style={{animationDelay:"0.1s"}} />
              <rect y="34" width="15" height="10" fill={ACCENT} className="px" style={{animationDelay:"0.15s"}} />
              <rect x="17" y="34" width="15" height="10" fill={ACCENT} className="px" style={{animationDelay:"0.2s"}} />
              {/* Separators */}
              <rect y="22" width="32" height="1" fill="#e8ecf0" className="px" style={{animationDelay:"0.25s"}} />
              <rect y="33" width="32" height="1" fill="#e8ecf0" className="px" style={{animationDelay:"0.25s"}} />
              {/* Globe outer ring - draws clockwise */}
              {[
                [11,2,10,1],[9,3,2,1],[21,3,2,1],[8,4,1,1],[23,4,1,1],
                [7,5,1,3],[24,5,1,3],[7,8,1,3],[24,8,1,3],[7,11,1,3],[24,11,1,3],
                [8,14,1,1],[23,14,1,1],[9,15,2,1],[21,15,2,1],[11,16,10,1],
              ].map(([x,y,w,h],i) => (
                <rect key={`g${i}`} x={x} y={y} width={w} height={h} fill="white" className="px gl"
                  style={{animationDelay:`${0.3 + i*0.04}s`}} />
              ))}
              {/* Cross lines - appear after globe */}
              <rect x="15" y="3" width="2" height="14" fill="white" opacity="0.5" className="px" style={{animationDelay:"0.95s"}} />
              <rect x="8" y="9" width="16" height="1" fill="white" opacity="0.5" className="px" style={{animationDelay:"1.0s"}} />
              {/* Inner ring */}
              {[[13,4,6,1],[12,5,1,1],[19,5,1,1],[11,6,1,2],[20,6,1,2],[11,10,1,2],[20,10,1,2],[12,13,1,1],[19,13,1,1],[13,14,6,1]].map(([x,y,w,h],i) => (
                <rect key={`ir${i}`} x={x} y={y} width={w} height={h} fill="white" opacity="0.4" className="px"
                  style={{animationDelay:`${1.05 + i*0.03}s`}} />
              ))}
              {/* Laurel leaves - sprout outward */}
              {[[5,5],[4,6],[4,8],[4,11],[5,13],[26,5],[27,6],[27,8],[27,11],[26,13]].map(([x,y],i) => (
                <rect key={`l${i}`} x={x} y={y} width="1" height={y===6||y===8||y===11?2:1} fill="white" opacity="0.6" className="px"
                  style={{animationDelay:`${1.35 + i*0.05}s`}} />
              ))}
              {/* P N U D letters - type in one by one */}
              {/* P */}
              {[[3,25,1,6],[4,25,3,1],[7,25,1,3],[4,28,3,1]].map(([x,y,w,h],i) => (
                <rect key={`p${i}`} x={x} y={y} width={w} height={h} fill="white" className="px"
                  style={{animationDelay:`${1.9 + i*0.06}s`}} />
              ))}
              {/* N */}
              {[[20,25,1,6],[21,26,1,1],[22,27,1,1],[23,28,1,1],[24,29,1,1],[25,25,1,6]].map(([x,y,w,h],i) => (
                <rect key={`n${i}`} x={x} y={y} width={w} height={h} fill="white" className="px"
                  style={{animationDelay:`${2.2 + i*0.06}s`}} />
              ))}
              {/* U */}
              {[[3,36,1,6],[9,36,1,6],[4,41,5,1]].map(([x,y,w,h],i) => (
                <rect key={`u${i}`} x={x} y={y} width={w} height={h} fill="white" className="px"
                  style={{animationDelay:`${2.6 + i*0.08}s`}} />
              ))}
              {/* D */}
              {[[20,36,1,6],[21,36,3,1],[24,37,1,4],[21,41,3,1]].map(([x,y,w,h],i) => (
                <rect key={`d${i}`} x={x} y={y} width={w} height={h} fill="white" className="px"
                  style={{animationDelay:`${2.85 + i*0.06}s`}} />
              ))}
            </svg>
          </div>
          {/* Title - appears after logo finishes building */}
          <div style={{ fontSize:28, fontWeight:900, fontFamily:"'Playfair Display',serif", color:ACCENT,
            letterSpacing:"0.02em", opacity:0, animation:"slideDown 0.5s ease 3.2s forwards", textAlign:"center", padding:"0 20px" }}>
            Monitor de Contexto Situacional
          </div>
          <div style={{ fontSize:11, fontFamily:font, color:MUTED, letterSpacing:"0.2em", textTransform:"uppercase",
            marginTop:4, opacity:0, animation:"slideDown 0.5s ease 3.4s forwards", textAlign:"center" }}>
            Venezuela 2026
          </div>
          {/* Progress bar */}
          <div style={{ width:200, height:3, background:`${BORDER}30`, borderRadius:2, marginTop:20, overflow:"hidden",
            opacity:0, animation:"fadeIn 0.3s ease 3.5s forwards" }}>
            <div style={{ width:"100%", height:"100%", background:`linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
              animation:"shimmer 1.2s ease infinite" }} />
          </div>
          <div style={{ marginTop:10, fontSize:10, fontFamily:font, color:MUTED, opacity:0,
            animation:"fadeIn 0.3s ease 3.6s forwards" }}>
            <span style={{ animation:"pulse 1.5s infinite" }}>Cargando datos en vivo...</span>
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
          <img src={PNUD_LOGO} alt="PNUD" style={{ height:mob?28:36 }} />
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
          <UserButton />
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
        {tab === "dashboard" && <TabDashboard week={week} liveData={liveData} setTab={setTab} />}
        {tab === "sitrep" && <TabSitrep liveData={liveData} />}
        {tab === "matriz" && <TabMatriz week={week} setWeek={setWeek} />}
        {tab === "monitor" && <TabMonitor />}
        {tab === "clima" && <TabClimaSocial liveData={liveData} />}
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
      <MethodologyFooter mob={mob} />
    </div>
    </AuthGate>
  );
}
