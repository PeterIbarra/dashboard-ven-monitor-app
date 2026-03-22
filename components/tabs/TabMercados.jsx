import { useState, useEffect, useRef, useCallback } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { POLYMARKET_SLUGS } from "../../data/static.js";
import { Card } from "../Card";
import { BG2, BORDER, TEXT, MUTED, ACCENT, font } from "../../constants";
import { IS_DEPLOYED, CORS_PROXIES } from "../../utils";
import { MarketOverviewWidget } from "../MarketOverviewWidget";
import { OilPriceTicker } from "../OilPriceTicker";
import { BrentChart } from "../charts/BrentChart";
import { VenProductionChart } from "../charts/VenProductionChart";
import { LivePriceCards } from "../LivePriceCards";
import { MereyEstimator } from "../MereyEstimator";

export function TabMercados() {
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
