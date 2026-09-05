import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BORDER, TEXT, MUTED, ACCENT, font, BG2, BG3 } from "../constants";

const GEOJSON_URL = "/data/venezuela-adm1.geojson";

export function LeafletSemestreMap({ estados, mobile=false }) {
  const mapNode = useRef(null);
  const mapInstance = useRef(null);
  const geoLayer = useRef(null);
  const [geojson,setGeojson]=useState(null);
  const [selected,setSelected]=useState(null);
  const [error,setError]=useState(null);
  const max=Math.max(...estados.map(e=>e.total),1);
  const byName=useMemo(()=>new Map(estados.map(e=>[normalize(e.nombre),e])),[estados]);
  const selectedData=selected?byName.get(normalize(selected)):null;
  const rank=selectedData?estados.findIndex(e=>e.nombre===selectedData.nombre)+1:null;

  useEffect(()=>{fetch(GEOJSON_URL).then(r=>{if(!r.ok)throw new Error("GeoJSON no disponible");return r.json();}).then(setGeojson).catch(e=>setError(e.message));},[]);

  useEffect(()=>{
    if(!geojson||!mapNode.current)return;
    if(!mapInstance.current){
      const map=L.map(mapNode.current,{zoomControl:true,attributionControl:true,minZoom:4,maxZoom:9,scrollWheelZoom:true});
      mapInstance.current=map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(map);
    }
    const map=mapInstance.current;
    if(geoLayer.current)geoLayer.current.remove();
    const layer=L.geoJSON(geojson,{
      style:feature=>{
        const name=feature.properties?.shapeName;
        const datum=byName.get(normalize(name));
        const active=selected===name;
        return {color:active?"#172033":"#ffffff",weight:active?3:1,fillColor:datum?colorScale(datum.total,max):"#cbd5e1",fillOpacity:selected && !active ? 0.42 : 0.82};
      },
      onEachFeature:(feature,featureLayer)=>{
        const name=feature.properties?.shapeName||"Entidad";
        const datum=byName.get(normalize(name));
        featureLayer.bindTooltip(datum?`<strong>${datum.nombre}</strong><br>${datum.total.toLocaleString("es-VE")} protestas`:`<strong>${name}</strong><br>Sin registro en la serie`,{sticky:true,direction:"top"});
        featureLayer.on({click:()=>setSelected(current=>current===name?null:name),mouseover:e=>e.target.setStyle({weight:3,color:"#172033"}),mouseout:()=>layer.resetStyle(featureLayer)});
      }
    }).addTo(map);
    geoLayer.current=layer;
    if(!map._ovcsFitted){map.fitBounds(layer.getBounds(),{padding:[8,8]});map._ovcsFitted=true;}
  },[geojson,byName,max,selected]);

  useEffect(()=>()=>{if(mapInstance.current){mapInstance.current.remove();mapInstance.current=null;}},[]);

  return <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"minmax(0,1.65fr) minmax(250px,.7fr)",gap:12}}>
    <div>
      <div ref={mapNode} style={{height:mobile?390:500,width:"100%",border:`1px solid ${BORDER}`,background:"#e2e8f0",zIndex:0}} />
      {error&&<div style={{padding:8,color:"#dc2626",fontSize:9,fontFamily:font}}>No se pudo cargar el mapa: {error}</div>}
      <div style={{display:"flex",justifyContent:"center",gap:9,flexWrap:"wrap",marginTop:7}}>{[
        ["#7f1d1d",">350"],["#dc2626","251–350"],["#f97316","151–250"],["#f59e0b","76–150"],["#38bdf8","≤75"],["#cbd5e1","Sin dato"]
      ].map(([color,label])=><span key={label} style={{display:"flex",alignItems:"center",gap:4,fontSize:8,color:MUTED,fontFamily:font}}><i style={{width:10,height:10,background:color,display:"inline-block"}}/>{label}</span>)}</div>
    </div>
    <div style={{border:`1px solid ${BORDER}`,padding:12,background:BG3,minHeight:mobile?150:500}}>
      {selectedData?<>
        <div style={{fontSize:17,fontWeight:900,color:TEXT}}>{selectedData.nombre}</div>
        <div style={{fontSize:9,color:MUTED,fontFamily:font}}>Posición #{rank} de {estados.length} entidades</div>
        <div style={{marginTop:14,padding:"12px",background:BG2,border:`1px solid ${BORDER}`,borderTop:`3px solid ${colorScale(selectedData.total,max)}`}}><div style={{fontSize:8,color:MUTED,fontFamily:font,textTransform:"uppercase"}}>Protestas · enero–junio</div><div style={{fontSize:30,fontWeight:900,color:colorScale(selectedData.total,max),fontFamily:font}}>{selectedData.total.toLocaleString("es-VE")}</div><div style={{fontSize:9,color:MUTED}}>{(selectedData.total/3495*100).toFixed(1)}% del total nacional</div></div>
        <button onClick={()=>setSelected(null)} style={{marginTop:10,border:`1px solid ${BORDER}`,background:BG2,color:ACCENT,padding:"6px 9px",fontSize:9,cursor:"pointer"}}>Quitar selección</button>
        <div style={{marginTop:12,fontSize:9,color:MUTED,fontFamily:font,textTransform:"uppercase"}}>Todas las entidades</div>
        <div style={{maxHeight:250,overflowY:"auto",marginTop:4,paddingRight:4}}>{estados.map((e,i)=><button key={e.nombre} onClick={()=>setSelected(e.nombre)} style={{display:"flex",width:"100%",gap:7,alignItems:"center",border:0,borderBottom:`1px solid ${BORDER}`,background:e.nombre===selectedData.nombre?`${ACCENT}10`:"transparent",padding:"5px 2px",cursor:"pointer",textAlign:"left"}}><span style={{fontSize:9,color:MUTED,width:18,textAlign:"right"}}>{i+1}</span><span style={{fontSize:10,color:e.nombre===selectedData.nombre?ACCENT:TEXT,flex:1,fontWeight:e.nombre===selectedData.nombre?800:400}}>{e.nombre}</span><b style={{fontSize:10,color:ACCENT,width:28,textAlign:"right"}}>{e.total}</b></button>)}</div>
      </>:<>
        <div style={{fontSize:12,fontWeight:800,color:TEXT}}>Exploración territorial</div>
        <div style={{fontSize:10,color:MUTED,lineHeight:1.55,marginTop:6}}>Selecciona un estado para consultar su volumen, posición nacional y participación en las 3.495 protestas del semestre.</div>
        <div style={{marginTop:14,fontSize:9,color:MUTED,fontFamily:font,textTransform:"uppercase"}}>Todas las entidades · ranking completo</div>
        <div style={{maxHeight:mobile?330:355,overflowY:"auto",marginTop:4,paddingRight:4}}>{estados.map((e,i)=><button key={e.nombre} onClick={()=>setSelected(e.nombre)} style={{display:"flex",width:"100%",gap:7,alignItems:"center",border:0,borderBottom:`1px solid ${BORDER}`,background:"transparent",padding:"6px 2px",cursor:"pointer",textAlign:"left"}}><span style={{fontSize:9,color:MUTED,width:18,textAlign:"right"}}>{i+1}</span><span style={{fontSize:10,color:TEXT,flex:1}}>{e.nombre}</span><span style={{width:42,height:5,background:"#e2e8f0",overflow:"hidden",borderRadius:3}}><span style={{display:"block",height:"100%",width:`${e.total/max*100}%`,background:colorScale(e.total,max)}}/></span><b style={{fontSize:10,color:ACCENT,width:28,textAlign:"right"}}>{e.total}</b></button>)}</div>
      </>}
      <div style={{marginTop:14,paddingTop:9,borderTop:`1px solid ${BORDER}`,fontSize:8,color:MUTED,lineHeight:1.45,fontFamily:font}}>Límites administrativos: geoBoundaries/INE–OCHA, CC BY 3.0 IGO. Datos de conflictividad: OVCS.</div>
    </div>
  </div>;
}

function normalize(value=""){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();}
function colorScale(value,max){const t=value/max;if(t>.75)return "#7f1d1d";if(t>.5)return "#dc2626";if(t>.3)return "#f97316";if(t>.15)return "#f59e0b";return "#38bdf8";}
