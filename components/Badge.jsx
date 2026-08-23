import { font } from "../constants";

export function Badge({ children, color }) {
  return (
    <span style={{ fontSize:12, fontFamily:font, letterSpacing:"0.12em", textTransform:"uppercase",
      padding:"2px 7px", background:`${color}18`, color, border:`1px solid ${color}30` }}>
      {children}
    </span>
  );
}
