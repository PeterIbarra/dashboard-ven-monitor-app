import React from "react";
import { BG2, BORDER, MUTED, ACCENT, TEXT, font, fontSans } from "../constants";

export class ModuleBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error:null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`Module failed: ${this.props.name}`, error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" style={{ background:BG2, border:`1px solid ${BORDER}`, padding:24, textAlign:"center" }}>
        <div style={{ fontFamily:font, fontSize:12, color:ACCENT, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
          Módulo no disponible
        </div>
        <div style={{ fontFamily:fontSans, fontSize:14, color:TEXT, marginBottom:6 }}>
          No fue posible cargar {this.props.name}.
        </div>
        <div style={{ fontFamily:fontSans, fontSize:12, color:MUTED, marginBottom:14 }}>
          El resto del monitor continúa disponible.
        </div>
        <button onClick={() => window.location.reload()} style={{ fontFamily:font, fontSize:11, color:"white", background:ACCENT,
          border:"none", padding:"8px 14px", borderRadius:4, cursor:"pointer" }}>
          Reintentar
        </button>
      </div>
    );
  }
}

export function ModuleLoading({ name }) {
  return (
    <div role="status" aria-live="polite" style={{ minHeight:180, display:"flex", alignItems:"center", justifyContent:"center",
      background:BG2, border:`1px solid ${BORDER}` }}>
      <div style={{ fontFamily:font, fontSize:11, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase" }}>
        Cargando {name}…
      </div>
    </div>
  );
}
