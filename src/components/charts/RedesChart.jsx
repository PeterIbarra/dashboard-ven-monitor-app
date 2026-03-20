import { useEffect, useRef } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { REDES_DATA } from "../../data/redes.js";
import { BORDER, MUTED, font } from "../../constants";
import { loadScript } from "../../utils";

export function RedesChart({ view }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const mob = useIsMobile();

  useEffect(() => {
    let destroyed = false;
    const go = () => {
      if (destroyed || !canvasRef.current) return;
      if (!window.Chart) {
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js").then(() => { if (!destroyed) render(); });
      } else { render(); }
    };

    function render() {
      if (!canvasRef.current || destroyed) return;
      if (chartRef.current) chartRef.current.destroy();
      const labels = REDES_DATA.map(d => d.d);
      const Chart = window.Chart;
      let cfg;

      if (view === "mirror") {
        cfg = { type:"bar", data:{ labels, datasets:[
          { label:"Pol. alta", data:REDES_DATA.map(d=>d.pol.a), backgroundColor:"#dc2626", borderWidth:0, order:1 },
          { label:"Pol. moderada", data:REDES_DATA.map(d=>d.pol.m), backgroundColor:"#f59e0b80", borderWidth:0, order:2 },
          { label:"Conv. alta", data:REDES_DATA.map(d=>-d.conv.a), backgroundColor:"#16a34a", borderWidth:0, order:3 },
          { label:"Conv. moderada", data:REDES_DATA.map(d=>-d.conv.m), backgroundColor:"#5DCAA580", borderWidth:0, order:4 },
        ]}, options:{ responsive:true, maintainAspectRatio:false, interaction:{mode:"index",intersect:false},
          scales:{ x:{stacked:true,grid:{display:false},ticks:{autoSkip:true,maxTicksLimit:mob?8:14,font:{size:10},color:MUTED}},
            y:{stacked:true,grid:{color:`${BORDER}30`},ticks:{callback:v=>{const a=Math.abs(v);return a>999?(a/1000|0)+"K":a},font:{size:10},color:MUTED}}},
          plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.dataset.label+": "+Math.abs(c.raw).toLocaleString()}}}}};
      } else if (view === "polarizacion") {
        cfg = { type:"line", data:{ labels, datasets:[
          { label:"Pol. alta", data:REDES_DATA.map(d=>d.pol.a), borderColor:"#dc2626", backgroundColor:"#dc262618", fill:true, tension:.3, pointRadius:1.5, borderWidth:2 },
          { label:"Pol. moderada", data:REDES_DATA.map(d=>d.pol.m), borderColor:"#f59e0b", backgroundColor:"#f59e0b10", fill:true, tension:.3, pointRadius:1, borderWidth:1.5 },
        ]}, options:{ responsive:true, maintainAspectRatio:false, interaction:{mode:"index",intersect:false},
          scales:{ x:{grid:{display:false},ticks:{autoSkip:true,maxTicksLimit:mob?8:14,font:{size:10},color:MUTED}},
            y:{grid:{color:`${BORDER}30`},ticks:{callback:v=>v>999?(v/1000|0)+"K":v,font:{size:10},color:MUTED}}},
          plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.dataset.label+": "+c.raw.toLocaleString()}}}}};
      } else if (view === "convivencia") {
        cfg = { type:"line", data:{ labels, datasets:[
          { label:"Conv. alta", data:REDES_DATA.map(d=>d.conv.a), borderColor:"#16a34a", backgroundColor:"#16a34a18", fill:true, tension:.3, pointRadius:1.5, borderWidth:2 },
          { label:"Conv. moderada", data:REDES_DATA.map(d=>d.conv.m), borderColor:"#5DCAA5", backgroundColor:"#5DCAA510", fill:true, tension:.3, pointRadius:1, borderWidth:1.5 },
        ]}, options:{ responsive:true, maintainAspectRatio:false, interaction:{mode:"index",intersect:false},
          scales:{ x:{grid:{display:false},ticks:{autoSkip:true,maxTicksLimit:mob?8:14,font:{size:10},color:MUTED}},
            y:{grid:{color:`${BORDER}30`},ticks:{callback:v=>v>999?(v/1000|0)+"K":v,font:{size:10},color:MUTED}}},
          plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.dataset.label+": "+c.raw.toLocaleString()}}}}};
      } else if (view === "neto") {
        const net = REDES_DATA.map(d => d.pol.t > 0 ? Math.round((d.pol.a - d.conv.a) / d.pol.t * 100) : 0);
        cfg = { type:"bar", data:{ labels, datasets:[{ label:"Índice neto", data:net,
          backgroundColor:net.map(v => v > 0 ? "#dc262680" : "#16a34a80"), borderColor:net.map(v => v > 0 ? "#dc2626" : "#16a34a"), borderWidth:1 }]},
          options:{ responsive:true, maintainAspectRatio:false,
            scales:{ x:{grid:{display:false},ticks:{autoSkip:true,maxTicksLimit:mob?8:14,font:{size:10},color:MUTED}},
              y:{grid:{color:`${BORDER}30`},ticks:{callback:v=>v+"%",font:{size:10},color:MUTED}}},
            plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>"Neto: "+c.raw+"% "+(c.raw>0?"(polarización domina)":"(convivencia domina)")}}}}};
      } else if (view === "composicion") {
        const polPct = REDES_DATA.map(d => d.pol.t > 0 ? Math.round(d.pol.a/d.pol.t*100) : 0);
        const modPct = REDES_DATA.map(d => d.pol.t > 0 ? Math.round(d.pol.m/d.pol.t*100) : 0);
        const caPct = REDES_DATA.map(d => d.conv.t > 0 ? Math.round(d.conv.a/d.conv.t*100) : 0);
        const rest = REDES_DATA.map((_,i) => Math.max(0, 100 - polPct[i] - modPct[i] - caPct[i]));
        cfg = { type:"bar", data:{ labels, datasets:[
          { label:"Pol. alta %", data:polPct, backgroundColor:"#dc2626", borderWidth:0 },
          { label:"Pol. mod. %", data:modPct, backgroundColor:"#f59e0b", borderWidth:0 },
          { label:"Conv. alta %", data:caPct, backgroundColor:"#16a34a", borderWidth:0 },
          { label:"Resto", data:rest, backgroundColor:`${BORDER}40`, borderWidth:0 },
        ]}, options:{ responsive:true, maintainAspectRatio:false,
          scales:{ x:{stacked:true,grid:{display:false},ticks:{autoSkip:true,maxTicksLimit:mob?8:14,font:{size:10},color:MUTED}},
            y:{stacked:true,max:100,grid:{display:false},ticks:{callback:v=>v+"%",font:{size:9},color:MUTED}}},
          plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.dataset.label+": "+c.raw+"%"}}}}};
      }
      if (cfg) chartRef.current = new Chart(canvasRef.current, cfg);
    }
    go();
    return () => { destroyed = true; if (chartRef.current) chartRef.current.destroy(); };
  }, [view, mob]);

  return <canvas ref={canvasRef} />;
}

// ═══════════════════════════════════════════════════════════════
// TAB: CLIMA SOCIAL — Redes (Polarización/Convivencia) + Cohesión GOB
// ═══════════════════════════════════════════════════════════════
