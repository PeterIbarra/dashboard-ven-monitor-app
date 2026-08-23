import { useState, useEffect } from "react";
import { CURATED_FACTCHECK } from "../data/sitrep.js";
import { BG2, BG3, BORDER, TEXT, MUTED, ACCENT, font } from "../constants";
import { IS_DEPLOYED } from "../utils";
import { useIsMobile } from "../hooks/useIsMobile";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { TwitterTimeline } from "./TwitterTimeline";

export function MonitorFactCheck() {
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
