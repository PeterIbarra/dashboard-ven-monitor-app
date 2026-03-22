import { SEM } from "../constants";

export function SemDot({ color, size = 8 }) {
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%",
    background:SEM[color]||color, boxShadow:`0 0 5px ${SEM[color]||color}`, flexShrink:0 }} />;
}
