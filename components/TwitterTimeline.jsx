import { useEffect, useRef, useCallback } from "react";
import { loadScript } from "../utils";

export function TwitterTimeline({ handle, height=280 }) {
  const ref = useCallback((node) => {
    if (!node) return;
    node.innerHTML = "";
    const a = document.createElement("a");
    a.className = "twitter-timeline";
    a.href = `https://twitter.com/${handle}`;
    a.setAttribute("data-theme", "light");
    a.setAttribute("data-chrome", "noheader nofooter noborders");
    a.setAttribute("data-height", String(height));
    a.setAttribute("data-tweet-limit", "3");
    a.textContent = `@${handle}`;
    node.appendChild(a);
    if (!window.twttr) {
      loadScript("https://platform.twitter.com/widgets.js").then(() => {
        if (window.twttr) window.twttr.widgets.load(node);
      });
    } else {
      window.twttr.widgets.load(node);
    }
  }, [handle, height]);
  return <div ref={ref} style={{ minHeight:height, background:"#fff", borderRadius:4 }} />;
}
