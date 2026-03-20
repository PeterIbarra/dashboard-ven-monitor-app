import { useEffect, useRef } from "react";
import { BG2, BORDER, MUTED, font } from "../../constants";

export function TVMarketQuotes({ title, height=350, groups }) {
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
