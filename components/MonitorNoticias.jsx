import { useState, useEffect } from "react";
import { CURATED_NEWS } from "../data/sitrep.js";
import { BG2, BG3, BORDER, TEXT, MUTED, ACCENT, font } from "../constants";
import { IS_DEPLOYED } from "../utils";
import { Badge } from "./Badge";
import { Card } from "./Card";

export function MonitorNoticias() {
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
