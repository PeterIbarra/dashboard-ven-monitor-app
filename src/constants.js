// ═══════════════════════════════════════════════════════════════
// CONSTANTS — Shared styles, colors, fonts
// ═══════════════════════════════════════════════════════════════
// Theming: this app renders colors as plain hex strings via inline
// styles (many with hand-appended hex alpha suffixes, e.g. `${MUTED}60`),
// so CSS custom properties aren't a drop-in fit. Instead we keep these
// as live, reassignable bindings — ES modules expose named exports as
// live references, so every file that does `import { BG } from
// "./constants"` will see the updated value the next time it renders.
// Toggling the theme mutates these bindings and then the app forces a
// full remount (see App.jsx) so every component re-reads them.

const STORAGE_KEY = "pnud-monitor-theme";

const LIGHT = {
  BG: "#f4f6f9",
  BG2: "#ffffff",
  BG3: "#eef1f5",
  BORDER: "#d0d7e0",
  TEXT: "#1a202c",
  MUTED: "#5a6a7a",
  ACCENT: "#0468B1",
};

const DARK = {
  BG: "#0b1220",
  BG2: "#141d2e",
  BG3: "#1b2740",
  BORDER: "#2c3a52",
  TEXT: "#e7ecf3",
  MUTED: "#8b9bb0",
  ACCENT: "#4fa8e0",
};

function readStoredTheme() {
  // Light is the default for everyone until they explicitly pick dark —
  // we deliberately ignore the OS/browser color-scheme preference here.
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return "light";
}

let _theme = (typeof window !== "undefined") ? readStoredTheme() : "light";
const _listeners = new Set();

export let BG = "";
export let BG2 = "";
export let BG3 = "";
export let BORDER = "";
export let TEXT = "";
export let MUTED = "";
export let ACCENT = "";

function applyPalette(theme) {
  const p = theme === "dark" ? DARK : LIGHT;
  BG = p.BG; BG2 = p.BG2; BG3 = p.BG3;
  BORDER = p.BORDER; TEXT = p.TEXT; MUTED = p.MUTED; ACCENT = p.ACCENT;
}
applyPalette(_theme);

export function getTheme() {
  return _theme;
}

export function setTheme(theme) {
  if (theme !== "light" && theme !== "dark") return;
  _theme = theme;
  applyPalette(theme);
  try { window.localStorage.setItem(STORAGE_KEY, theme); } catch {}
  try {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.background = BG;
    document.body.style.colorScheme = theme;
  } catch {}
  _listeners.forEach(fn => { try { fn(theme); } catch {} });
}

export function toggleTheme() {
  setTheme(_theme === "dark" ? "light" : "dark");
  return _theme;
}

// Subscribe to theme changes; returns an unsubscribe function.
export function onThemeChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// Apply once at module load so <body>/<html> reflect the initial theme
// before React mounts (avoids a flash of the wrong theme).
if (typeof window !== "undefined") {
  try {
    document.documentElement.setAttribute("data-theme", _theme);
  } catch {}
}

// Colors that stay legible on both light and dark backgrounds and are
// used to convey meaning (semaphore/status), not page chrome.
export const SC = { 1:"#2d8a30", 2:"#c92a2a", 3:"#0468B1", 4:"#d4850a" };
export const SEM = { green:"#16a34a", yellow:"#ca8a04", red:"#dc2626" };
export const FONT_DISPLAY = "'Syne', sans-serif";
export const FONT_BODY = "'DM Sans', sans-serif";
export const FONT_DATA = "'Space Mono', monospace";
export const FONT_KPI = FONT_DATA;
export const font = FONT_DATA;
export const fontSans = FONT_BODY;
