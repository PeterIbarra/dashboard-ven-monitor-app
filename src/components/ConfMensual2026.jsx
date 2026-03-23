import { useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Card } from "../Card";
import { VenezuelaLeafletMap } from "../charts/VenezuelaLeafletMap";
import { CONF_MENSUAL_2026 } from "../../data/confMensual2026.js";
import { BG2, BORDER, TEXT, MUTED, ACCENT, font } from "../../constants";

const catColor = { DCP:"#0A97D9", DESCA:"#4C9F38" };

export function ConfMensual2026() {
  const mob = useIsMobile();
  const [mesIdx, setMesIdx] = useState(CONF_MENSUAL_2026.length - 1);
  const d = CONF_MENSUAL_2026[mesIdx];
  const maxDer = Math.max(...d.derechos.map(r => r.n), 1);
  const maxSvc = Math.max(...d.servicios.map(s => s.n), 1);
  const maxMod = Math.max(...d.modalidades.map(m => m.n), 1);

  return (
    <div>
      {/* Month selector */}
      <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}`, marginBottom:8, width:"fit-content" }}>
        {CONF_MENSUAL_2026.map((m, i) => (
          <button key={i} onClick={() => setMesIdx(i)}
            style={{ fontSize:12, fontFamily:font, padding:"6px 16px", border:"none",
              background:mesIdx===i?ACCENT:"transparent", color:mesIdx===i?"#fff":MUTED,
              cursor:"pointer", letterSpacing:"0.06em", fontWeight:mesIdx===i?700:400 }}>
            {m.mes} 2026
          </button>
        ))}
      </div>
      <div style={{ fontSize:10, fontFamily:font, color:MUTED, marginBottom:14, lineHeight:1.5 }}>
        <strong style={{ color:catColor.DCP }}>DCP</strong> = Derechos Civiles y Políticos · <strong style={{ color:catColor.DESCA }}>DESCA</strong> = Derechos Económicos, Sociales, Culturales y Ambientales · Fuente: OVCS
      </div>

      {/* KPI cards */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(5,1fr)", gap:mob?8:10, marginBottom:16 }}>
        {[
          { v:d.total, l:"Total protestas", c:ACCENT },
          { v:`${d.promDiario}/día`, l:"Promedio diario", c:TEXT },
          { v:d.varInteranual, l:`vs ${d.mesShort} 2025`, c:"#16a34a" },
          { v:d.reprimidas, l:"Reprimidas", c:d.reprimidas > 5 ? "#dc2626" : "#16a34a" },
          { v:`${d.combinadasPct}%`, l:"Combinadas", c:"#ca8a04" },
        ].map((k, i) => (
          <Card key={i}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:mob?20:26, fontWeight:800, color:k.c, fontFamily:"'Playfair Display',serif" }}>{k.v}</div>
              <div style={{ fontSize:9, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:4 }}>{k.l}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* DCP vs DESCA donut + breakdown */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:12, marginBottom:16 }}>
        <Card>
          <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
            Composición DCP vs DESCA
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:20, justifyContent:"center" }}>
            {/* Simple SVG donut */}
            <svg viewBox="0 0 120 120" width={mob?100:120} height={mob?100:120}>
              {(() => {
                const r = 45, cx = 60, cy = 60;
                const dcpAngle = (d.dcpPct / 100) * 360;
                const dcpRad = (dcpAngle - 90) * Math.PI / 180;
                const startRad = -90 * Math.PI / 180;
                const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
                const x2 = cx + r * Math.cos(dcpRad), y2 = cy + r * Math.sin(dcpRad);
                const large = dcpAngle > 180 ? 1 : 0;
                return (<>
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke={catColor.DESCA} strokeWidth={18} />
                  <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
                    fill="none" stroke={catColor.DCP} strokeWidth={18} />
                  <text x={cx} y={cy-4} textAnchor="middle" fill={TEXT} fontSize={12} fontWeight={700} fontFamily="'Syne',sans-serif">
                    {d.mesShort.toUpperCase()}
                  </text>
                  <text x={cx} y={cy+10} textAnchor="middle" fill={MUTED} fontSize={9} fontFamily={font}>
                    {d.total}
                  </text>
                </>);
              })()}
            </svg>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:12, height:12, background:catColor.DCP, borderRadius:2 }} />
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:catColor.DCP }}>{d.dcp} ({d.dcpPct}%)</div>
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED }}>Derechos Civiles y Políticos</div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:12, height:12, background:catColor.DESCA, borderRadius:2 }} />
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:catColor.DESCA }}>{d.desca} ({d.descaPct}%)</div>
                  <div style={{ fontSize:9, fontFamily:font, color:MUTED }}>Derechos Económicos, Sociales</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Modalidades */}
        <Card>
          <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
            Modalidades de protesta
          </div>
          {d.modalidades.map((m, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <div style={{ width:70, fontSize:11, fontFamily:font, color:TEXT, fontWeight:i===0?600:400 }}>{m.tipo}</div>
              <div style={{ flex:1, height:16, background:`${BORDER}30`, borderRadius:2, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(m.n/maxMod)*100}%`, background:i===0?ACCENT:`${ACCENT}80`, borderRadius:2, transition:"width 0.4s" }} />
              </div>
              <div style={{ width:50, textAlign:"right", fontSize:12, fontWeight:600, color:TEXT, fontFamily:font }}>{m.n}</div>
              <div style={{ width:30, textAlign:"right", fontSize:10, color:MUTED, fontFamily:font }}>{m.pct}%</div>
            </div>
          ))}
        </Card>
      </div>

      {/* Derechos más exigidos */}
      <Card>
        <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
          Derechos más exigidos — {d.mes} 2026
        </div>
        <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:6 }}>
          {d.derechos.map((r, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderBottom:`1px solid ${BORDER}30` }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:catColor[r.cat], flexShrink:0 }} />
              <div style={{ flex:1, fontSize:12, fontFamily:font, color:TEXT }}>{r.d}</div>
              <div style={{ flex:1, height:14, background:`${BORDER}30`, borderRadius:2, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(r.n/maxDer)*100}%`, background:catColor[r.cat], opacity:0.6, borderRadius:2 }} />
              </div>
              <div style={{ width:40, textAlign:"right", fontSize:13, fontWeight:700, color:catColor[r.cat], fontFamily:font }}>{r.n}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Mapa + Servicios */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"2fr 1fr", gap:12, marginTop:12 }}>
        {/* Map */}
        <Card>
          <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>
            Distribución geográfica — {d.mes} 2026
          </div>
          <VenezuelaLeafletMap estados={d.estados} height={mob ? 260 : 340} />
        </Card>

        {/* Servicios básicos */}
        <Card>
          <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>
            Protestas por servicios básicos
          </div>
          {d.servicios.map((s, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <div style={{ flex:1, fontSize:12, fontFamily:font, color:TEXT }}>{s.s}</div>
              <div style={{ flex:1, height:14, background:`${BORDER}30`, borderRadius:2, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(s.n/maxSvc)*100}%`, background:"#dc2626", opacity:0.5, borderRadius:2 }} />
              </div>
              <div style={{ width:24, textAlign:"right", fontSize:13, fontWeight:700, color:TEXT, fontFamily:font }}>{s.n}</div>
            </div>
          ))}
        </Card>
      </div>

      {/* Contexto */}
      <Card style={{ marginTop:12 }}>
        <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>
          Contexto del período
        </div>
        <div style={{ fontSize:12.5, fontFamily:"'Libre Baskerville','Georgia',serif", color:TEXT, lineHeight:1.65 }}>
          {d.contexto}
        </div>
        <div style={{ fontSize:11, fontFamily:font, color:MUTED, marginTop:8, padding:"6px 10px", background:`${ACCENT}06`, border:`1px solid ${BORDER}` }}>
          📋 {d.hecho}
        </div>
      </Card>
    </div>
  );
}
