import { useEffect, useCallback } from "react";
import { BG2, BORDER, MUTED, font } from "../constants";

export function OilPriceTicker() {
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
