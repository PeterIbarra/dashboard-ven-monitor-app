import { BG2, BORDER } from "../constants";

export function Card({ children, style, accent }) {
  return (
    <div style={{ background:BG2, border:`1px solid ${BORDER}`, padding:"18px 20px", position:"relative", borderRadius:6, boxShadow:"0 1px 3px rgba(0,0,0,0.06)", marginBottom:10, ...style }}>
      {accent && <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:accent, borderRadius:"6px 0 0 6px" }} />}
      {children}
    </div>
  );
}
