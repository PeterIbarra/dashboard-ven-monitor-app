const ALLOWED_TAGS = new Set(["B", "BR", "CODE", "DIV", "EM", "I", "LI", "OL", "P", "SPAN", "STRONG", "TABLE", "TBODY", "TD", "TH", "THEAD", "TR", "UL"]);
const ALLOWED_STYLES = new Set([
  "background", "border", "border-collapse", "border-radius", "color", "font-family",
  "font-size", "font-weight", "height", "line-height", "margin", "padding",
  "padding-left", "text-align", "vertical-align", "width",
]);

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatPlainText(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

export function sanitizeHtml(value) {
  if (typeof document === "undefined") return escapeHtml(value);
  const template = document.createElement("template");
  template.innerHTML = String(value ?? "");

  const clean = node => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(document.createTextNode(child.textContent || ""));
        continue;
      }
      for (const attribute of [...child.attributes]) {
        if (attribute.name !== "style") child.removeAttribute(attribute.name);
      }
      if (child.hasAttribute("style")) {
        const safeDeclarations = child.getAttribute("style").split(";").map(part => part.trim()).filter(Boolean)
          .filter(part => ALLOWED_STYLES.has(part.split(":", 1)[0].trim().toLowerCase()));
        if (safeDeclarations.length) child.setAttribute("style", safeDeclarations.join(";"));
        else child.removeAttribute("style");
      }
      clean(child);
    }
  };
  clean(template.content);
  return template.innerHTML;
}
