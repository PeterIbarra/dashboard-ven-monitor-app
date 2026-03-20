import { useState } from "react";
import { Card } from "./Card";
import { BG, ACCENT, BORDER, MUTED, font } from "../constants";

export function MereyEstimator() {
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
