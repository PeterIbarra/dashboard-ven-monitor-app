import { useEffect, useRef } from "react";

export function TradingViewMini({ symbol, height=280 }) {
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
