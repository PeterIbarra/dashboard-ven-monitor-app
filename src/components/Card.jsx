import { BG2, BORDER } from "../constants";

export function Card({ children, style, accent }) {
  return (
    <div style={{ background:BG2, border:`1px solid ${accent || BORDER}`, padding:"14px 16px",
      ...style }}>
      {children}
    </div>
  );
}
