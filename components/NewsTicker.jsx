import { useState, useEffect, useRef } from "react";
import { BG, BG2, BORDER, TEXT, MUTED, ACCENT, font, fontSans } from "../constants";
import { IS_DEPLOYED } from "../utils";

export function NewsTicker() {
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
