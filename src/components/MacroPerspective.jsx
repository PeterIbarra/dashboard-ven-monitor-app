import { useState } from "react";
import { Card } from "./Card";
import { BG2, BORDER, TEXT, MUTED, ACCENT, font } from "../constants";

const OBSERVED = [
  { k:"Inflación julio", v:"19,9%", s:"13,8% en junio", c:"#dc2626" },
  { k:"Inflación ene–jul", v:"176%", s:"643% interanual", c:"#b45309" },
  { k:"TC oficial julio", v:"+18,2%", s:"Traslado acelerado a precios", c:"#7c3aed" },
  { k:"Ventas BCV julio", v:"USD 2,2 mil MM", s:"Récord mensual estimado", c:"#0468B1" },
];

const OUTLOOK = [
  { year:"2026", inflation:"318%", official:"1.185 Bs/$", market:"1.293 Bs/$", gap:"9%", fxSales:"USD 19,3 mil MM" },
  { year:"2027", inflation:"206%", official:"3.552 Bs/$", market:"3.815 Bs/$", gap:"7–8%", fxSales:"USD 18,7 mil MM" },
];

export function MacroPerspective({ mob }) {
  const [open, setOpen] = useState(false);
  return <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
    <div style={{ border:`1px solid ${ACCENT}30`, background:`linear-gradient(135deg, ${ACCENT}0c, transparent)`, padding:"14px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:220 }}>
          <div style={{ fontSize:10, fontFamily:font, color:ACCENT, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase" }}>Perspectiva macro y financiera</div>
          <div style={{ fontSize:13, color:TEXT, lineHeight:1.55, marginTop:5 }}>La convergencia cambiaria depende de fuertes ventas de divisas y de una depreciación administrada del tipo oficial. El equilibrio reduce la brecha, pero transmite parte del ajuste a la inflación.</div>
        </div>
        <span style={{ fontSize:9, fontFamily:font, color:"#92400e", background:"#fffbeb", border:"1px solid #f59e0b40", padding:"4px 8px" }}>Equilibrio frágil</span>
      </div>
    </div>

    <div style={{ display:"grid", gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)", gap:8 }}>
      {OBSERVED.map(item => <Card key={item.k} accent={item.c}>
        <div style={{ fontSize:9, fontFamily:font, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em" }}>{item.k}</div>
        <div style={{ fontSize:20, fontWeight:800, color:item.c, fontFamily:font, margin:"3px 0" }}>{item.v}</div>
        <div style={{ fontSize:10, color:MUTED }}>{item.s}</div>
      </Card>)}
    </div>

    <Card>
      <div style={{ fontSize:10, fontFamily:font, color:MUTED, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Mecanismo de transmisión</div>
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"repeat(5,1fr)", gap:mob?5:1, background:mob?"transparent":BORDER }}>
        {["Gasto público y reconstrucción","Liquidez y demanda de cobertura","Presión sobre el dólar","Intervención BCV + ajuste oficial","Traslado a precios"].map((label,index) =>
          <div key={label} style={{ position:"relative", background:BG2, padding:"10px 12px", fontSize:10, fontFamily:font, color:index===4?"#dc2626":TEXT, fontWeight:index===4?700:600, lineHeight:1.4 }}>
            <span style={{ color:ACCENT, marginRight:5 }}>{index+1}</span>{label}{!mob && index<4 && <span style={{ position:"absolute", right:-7, zIndex:2, color:ACCENT }}>→</span>}
          </div>)}
      </div>
    </Card>

    <Card>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
        <div style={{ fontSize:10, fontFamily:font, color:MUTED, textTransform:"uppercase", letterSpacing:"0.1em" }}>Escenario central publicado</div>
        <span style={{ fontSize:8, fontFamily:font, color:"#7c3aed", background:"#7c3aed10", border:"1px solid #7c3aed25", padding:"2px 6px" }}>ESTIMACIÓN DE LA FUENTE · NO ES DATO REGISTRADO</span>
      </div>
      <div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, fontFamily:font }}>
        <thead><tr style={{ borderBottom:`2px solid ${BORDER}` }}>{["Año","Inflación","TC oficial","TC mercado","Brecha","Ventas BCV"].map(h=><th key={h} style={{ padding:"6px 8px", color:MUTED, textAlign:"left", fontSize:9, textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>)}</tr></thead>
        <tbody>{OUTLOOK.map(row=><tr key={row.year} style={{ borderBottom:`1px solid ${BORDER}40` }}>
          <td style={{ padding:"8px", fontWeight:800, color:ACCENT }}>{row.year}</td><td style={{ padding:"8px", color:"#dc2626", fontWeight:700 }}>{row.inflation}</td><td style={{ padding:"8px" }}>{row.official}</td><td style={{ padding:"8px" }}>{row.market}</td><td style={{ padding:"8px", color:"#0f766e", fontWeight:700 }}>{row.gap}</td><td style={{ padding:"8px" }}>{row.fxSales}</td>
        </tr>)}</tbody>
      </table></div>
    </Card>

    <div style={{ border:`1px solid ${BORDER}`, background:BG2 }}>
      <button onClick={()=>setOpen(value=>!value)} aria-expanded={open} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, border:0, background:"transparent", padding:"10px 12px", cursor:"pointer", textAlign:"left" }}>
        <span style={{ fontSize:10, fontFamily:font, color:TEXT, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase" }}>Supuestos, riesgos y corto plazo</span>
        <span style={{ marginLeft:"auto", color:ACCENT, fontSize:10 }}>{open?"Ocultar ▲":"Desplegar ▼"}</span>
      </button>
      {open && <div style={{ borderTop:`1px solid ${BORDER}`, padding:"12px", display:"grid", gridTemplateColumns:mob?"1fr":"repeat(3,1fr)", gap:10 }}>
        <div><b style={{ fontSize:10, color:ACCENT, fontFamily:font }}>17–21 AGO</b><p style={{ fontSize:11, color:MUTED, lineHeight:1.55, margin:"5px 0 0" }}>Gasto público proyectado en USD 836 millones e intervención cambiaria central de USD 550 millones. La presión se concentraría al inicio de la semana.</p></div>
        <div><b style={{ fontSize:10, color:"#15803d", fontFamily:font }}>FACTORES FAVORABLES</b><p style={{ fontSize:11, color:MUTED, lineHeight:1.55, margin:"5px 0 0" }}>Mayor producción o precio petrolero, financiamiento para reconstrucción, movilización de activos externos y avances con el FMI.</p></div>
        <div><b style={{ fontSize:10, color:"#dc2626", fontFamily:font }}>RIESGOS DE DETERIORO</b><p style={{ fontSize:11, color:MUTED, lineHeight:1.55, margin:"5px 0 0" }}>Menores ventas de divisas, caída petrolera, reconstrucción más costosa, mayor financiamiento monetario o reestructuración de deuda no sostenible.</p></div>
      </div>}
    </div>

    <div style={{ fontSize:9, color:MUTED, fontFamily:font, lineHeight:1.55, padding:"0 2px" }}>
      <strong>Fuentes:</strong> Síntesis Financiera, <em>Briefing Financiero</em>, 17 ago 2026; Síntesis Financiera, <em>Proyecciones de inflación y tipos de cambio</em>, 19 ago 2026. Los datos registrados son atribuidos en los informes al BCV y a cálculos de Síntesis Financiera. Las cifras 2026–2027 corresponden al escenario central de la fuente y no constituyen pronósticos del PNUD.
    </div>
  </div>;
}
