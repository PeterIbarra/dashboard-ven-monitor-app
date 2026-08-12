// ═══════════════════════════════════════════════════════════════
// FRONTEND DATA LOADER — reads the static SITREP data files
// (src/data/*.js) from the Node backend without duplicating content.
//
// Those files use ES module syntax ("export const X = [...]") for
// the Vite frontend, but contain pure data literals with NO imports.
// We can safely strip "export " and evaluate them to get plain JS
// objects — this means scenario probabilities, energy KPIs, and the
// amnesty tracker stay automatically in sync with every SITREP
// update, with zero manual duplication.
//
// IMPORTANT: only ever point this at files you've confirmed contain
// pure data (no imports, no side effects) — see SITREP_UPDATE_PROTOCOL.md.
// ═══════════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../src/data");

let _cache = null;

function loadExports(fileName, exportNames) {
  const filePath = path.join(DATA_DIR, fileName);
  const code = fs.readFileSync(filePath, "utf8").replace(/export\s+const\s+/g, "const ");
  const wrapper = `${code}\nmodule.exports = { ${exportNames.join(", ")} };`;
  const sandboxModule = { exports: {} };
  // eslint-disable-next-line no-new-func
  const runner = new Function("module", "exports", wrapper);
  runner(sandboxModule, sandboxModule.exports);
  return sandboxModule.exports;
}

function getFrontendSnapshot() {
  if (_cache) return _cache;
  const snapshot = { scenarios: null, latestWeek: null, kpisLatest: null, latestAmnistia: null, latestConfSemanal: null, error: null };
  try {
    const { SCENARIOS } = loadExports("scenarios.js", ["SCENARIOS"]);
    snapshot.scenarios = SCENARIOS;
  } catch (e) {
    snapshot.error = `scenarios.js: ${e.message}`;
  }
  try {
    const { WEEKS, KPIS_LATEST, CONF_SEMANAL } = loadExports("weekly.js", ["WEEKS", "KPIS_LATEST", "CONF_SEMANAL"]);
    snapshot.latestWeek = Array.isArray(WEEKS) && WEEKS.length > 0 ? WEEKS[WEEKS.length - 1] : null;
    snapshot.kpisLatest = KPIS_LATEST || null;
    snapshot.latestConfSemanal = Array.isArray(CONF_SEMANAL) && CONF_SEMANAL.length > 0 ? CONF_SEMANAL[CONF_SEMANAL.length - 1] : null;
  } catch (e) {
    snapshot.error = `${snapshot.error ? snapshot.error + " | " : ""}weekly.js: ${e.message}`;
  }
  try {
    const { AMNISTIA_TRACKER } = loadExports("amnistia.js", ["AMNISTIA_TRACKER"]);
    snapshot.latestAmnistia = Array.isArray(AMNISTIA_TRACKER) && AMNISTIA_TRACKER.length > 0
      ? AMNISTIA_TRACKER[AMNISTIA_TRACKER.length - 1] : null;
  } catch (e) {
    snapshot.error = `${snapshot.error ? snapshot.error + " | " : ""}amnistia.js: ${e.message}`;
  }
  _cache = snapshot;
  return snapshot;
}

module.exports = { getFrontendSnapshot };
