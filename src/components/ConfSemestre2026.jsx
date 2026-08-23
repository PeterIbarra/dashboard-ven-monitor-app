import { useState } from "react";
import { Card } from "./Card";
import { OVCS_2026 } from "../data/confSemestre2026";
import { BG2, BORDER, TEXT, MUTED, ACCENT, font } from "../constants";
import { LeafletSemestreMap } from "./LeafletSemestreMap";

const CAT = { DCP:"#0A97D9", DESCA:"#4C9F38" };

function Kpi({ label, value, note, color=TEXT }) {
  return <Card accent={color}>
    <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:27, lineHeight:1.1, fontWeight:800, fontFamily:"'Space Mono',monospace", color }}>{value}</div>
    <div style={{ fontSize:10.5, color:MUTED, marginTop:4, lineHeight:1.4 }}>{note}</div>
  </Card>;
}

export function ConfSemestre2026({ mobile=false }) {
  const [vista, setVista] = useState("derechos");
  const d = OVCS_2026;
  const maxMes = Math.max(...d.meses.map(m=>m.total));
  const trimestre2Delta = Math.round((d.trimestre2.total / d.trimestre1.total - 1) * 100);
  const data = vista === "derechos" ? d.derechos : vista === "servicios" ? d.servicios : d.estados;
  const max = Math.max(...data.map(x=>x.total));

  return <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
    <div style={{ background:"linear-gradient(135deg, #0A97D912, #4C9F3808)", border:`1px solid ${BORDER}`, padding:"16px 18px" }}>
      <div style={{ fontSize:11, fontFamily:font, color:ACCENT, letterSpacing:"0.13em", textTransform:"uppercase", fontWeight:700 }}>Lectura integrada · informes OVCS</div>
      <div style={{ fontSize:19, fontWeight:750, color:TEXT, marginTop:5 }}>De la apertura política a la reactivación socioeconómica</div>
      <div style={{ fontSize:13, lineHeight:1.7, color:"#3d4f5f", marginTop:7 }}>
        El primer trimestre estuvo dominado por justicia, participación y libertad de presos políticos. Desde marzo, el centro de gravedad se desplazó hacia salarios, seguridad social, vivienda y servicios. El semestre termina en equilibrio casi exacto entre DCP y DESCA, señal de una conflictividad multidimensional, no de la desaparición de la agenda política.
      </div>
    </div>

    <div style={{ display:"grid", gridTemplateColumns:mobile?"repeat(2,1fr)":"repeat(auto-fit,minmax(155px,1fr))", gap:10 }}>
      <Kpi label="Protestas · 1er semestre" value={d.total.toLocaleString("es-VE")} note={`${d.promedioDiario} manifestaciones diarias`} color={ACCENT} />
      <Kpi label="Variación interanual" value={`+${d.variacionInteranual}%`} note={`${d.referencia2025.toLocaleString("es-VE")} en H1 2025`} color="#dc2626" />
      <Kpi label="DCP" value={`${d.semestre.dcp.toLocaleString("es-VE")} · 50%`} note="Derechos civiles y políticos" color={CAT.DCP} />
      <Kpi label="DESCA" value={`${d.semestre.desca.toLocaleString("es-VE")} · 50%`} note="Derechos económicos y sociales" color={CAT.DESCA} />
      <Kpi label="Protestas reprimidas" value={d.semestre.reprimidas} note={`${d.semestre.detenidos} personas detenidas`} color="#ca8a04" />
    </div>

    <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"1.35fr 1fr", gap:14 }}>
      <Card>
        <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Evolución mensual · enero-junio 2026</div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:170 }}>
          {d.meses.map((m,i) => {
            const color = CAT[m.foco];
            return <div key={m.mes} title={m.nota} style={{ flex:1, height:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", alignItems:"center", minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:700, color, fontFamily:font }}>{m.total}</div>
              <div style={{ width:"76%", maxWidth:58, height:`${(m.total/maxMes)*125}px`, background:`linear-gradient(180deg, ${color}, ${color}90)`, borderRadius:"4px 4px 0 0", position:"relative" }}>
                {i===2 && <span style={{ position:"absolute", top:-22, left:"50%", transform:"translateX(-50%)", fontSize:9, whiteSpace:"nowrap", color:"#ca8a04", fontFamily:font }}>Pico</span>}
              </div>
              <div style={{ fontSize:10, color:MUTED, fontFamily:font, marginTop:5 }}>{m.mes}</div>
            </div>;
          })}
        </div>
        <div style={{ display:"flex", gap:14, justifyContent:"center", marginTop:10, fontSize:10.5, color:MUTED, fontFamily:font }}>
          <span><b style={{ color:CAT.DCP }}>■</b> predominio DCP</span><span><b style={{ color:CAT.DESCA }}>■</b> predominio DESCA</span>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Cambio entre trimestres</div>
        {[{label:"1er trimestre",...d.trimestre1},{label:"2º trimestre",...d.trimestre2}].map((t,i)=><div key={t.label} style={{ marginBottom:i?0:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
            <span style={{ fontSize:13, fontWeight:700, color:TEXT }}>{t.label}</span>
            <span style={{ fontSize:18, fontWeight:800, color:i?CAT.DESCA:CAT.DCP, fontFamily:"'Space Mono',monospace" }}>{t.total.toLocaleString("es-VE")}</span>
          </div>
          <div style={{ height:18, display:"flex", overflow:"hidden", borderRadius:3, background:BG2 }}>
            <div style={{ width:`${t.dcp/t.total*100}%`, background:CAT.DCP }} />
            <div style={{ width:`${t.desca/t.total*100}%`, background:CAT.DESCA }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontSize:10.5, color:MUTED, fontFamily:font }}>
            <span>DCP {Math.round(t.dcp/t.total*100)}%</span><span>DESCA {Math.round(t.desca/t.total*100)}%</span>
          </div>
        </div>)}
        <div style={{ marginTop:14, padding:"8px 10px", background:"#ca8a0408", border:"1px solid #ca8a0425", fontSize:11, lineHeight:1.5, color:"#725a11" }}>
          El volumen bajó {Math.abs(trimestre2Delta)}% frente al primer trimestre, pero DESCA pasó de 36% a 67%: disminuyó la cantidad, cambió la naturaleza de la protesta.
        </div>
      </Card>
    </div>

    <Card>
      <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:12 }}>
        <div style={{ fontSize:10, fontFamily:font, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase" }}>
          {vista === "estados" ? "Distribución territorial · 24 entidades" : "Composición del semestre"}
        </div>
        <div style={{ display:"flex", border:`1px solid ${BORDER}`, marginLeft:mobile?0:"auto" }}>
          {[{id:"derechos",label:"Derechos"},{id:"servicios",label:"Servicios"},{id:"estados",label:"Territorio"}].map(v=><button key={v.id} onClick={()=>setVista(v.id)} style={{ border:0, padding:"5px 11px", fontSize:11, fontFamily:font, cursor:"pointer", background:vista===v.id?ACCENT:"transparent", color:vista===v.id?"#fff":MUTED }}>{v.label}</button>)}
        </div>
      </div>
      {vista === "estados" && <div style={{ fontSize:10, color:MUTED, fontFamily:font, marginBottom:10, lineHeight:1.5 }}>
        Protestas registradas entre enero y junio de 2026 · orden descendente. Distrito Capital encabeza la movilización; Amazonas presenta el menor registro.
      </div>}
      {vista === "estados" && <LeafletSemestreMap estados={d.estados} mobile={mobile} />}
      <div style={{ display:vista==="estados"?"none":"grid", gridTemplateColumns:mobile?"1fr":"repeat(2,1fr)", columnGap:22, rowGap:8 }}>
        {data.map((item,i)=>{
          const label=item.nombre;
          const color=item.cat?CAT[item.cat]:vista==="servicios"?"#dc2626":ACCENT;
          return <div key={label} style={{ display:"grid", gridTemplateColumns:"minmax(105px,160px) 1fr 42px", alignItems:"center", gap:8 }} title={item.trimestre1 ? `Primer trimestre: ${item.trimestre1}` : ""}>
            <span style={{ fontSize:11.5, color:TEXT, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.icono?`${item.icono} `:""}{label}</span>
            <div style={{ height:10, background:`${BORDER}50`, borderRadius:2, overflow:"hidden" }}><div style={{ height:"100%", width:`${item.total/max*100}%`, background:color, opacity:.78 }} /></div>
            <span style={{ fontSize:12, fontWeight:700, color, textAlign:"right", fontFamily:font }}>{item.total}</span>
          </div>;
        })}
      </div>
    </Card>

    <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)", gap:10 }}>
      <Card accent={CAT.DCP}><b style={{ color:CAT.DCP }}>1. Participación y justicia</b><div style={{ fontSize:12, lineHeight:1.55, color:MUTED, marginTop:5 }}>Enero-febrero concentraron la demanda de garantías democráticas, debido proceso, amnistía y libertad de presos políticos.</div></Card>
      <Card accent={CAT.DESCA}><b style={{ color:CAT.DESCA }}>2. Retorno de la agenda laboral</b><div style={{ fontSize:12, lineHeight:1.55, color:MUTED, marginTop:5 }}>Las 1.107 protestas laborales aumentaron 93% interanual y convirtieron el trabajo en la principal expresión DESCA.</div></Card>
      <Card accent="#ca8a04"><b style={{ color:"#9a6d00" }}>3. Presión territorial y servicios</b><div style={{ fontSize:12, lineHeight:1.55, color:MUTED, marginTop:5 }}>Distrito Capital y Miranda lideran; agua y electricidad concentran la protesta por servicios. Junio incorpora la emergencia sísmica.</div></Card>
    </div>

    <div style={{ fontSize:10.5, color:MUTED, lineHeight:1.55, borderTop:`1px solid ${BORDER}`, paddingTop:10 }}>
      Fuente: Observatorio Venezolano de Conflictividad Social (OVCS), informes del primer trimestre y primer semestre de 2026. Los derechos son categorías superpuestas: una protesta puede exigir varios derechos. El informe semestral presenta referencias internas distintas para las 46 protestas reprimidas (12 y 18 estados) y para seguridad social (314 y 413 protestas); se conserva el total de represión y, para seguridad social, la cifra de 413 desarrollada en la sección temática.
    </div>
  </div>;
}
