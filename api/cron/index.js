// ═══════════════════════════════════════════════════════════════
// CRON ORCHESTRATOR — Daily ingest, classify, persist
// Entry point for Vercel cron. Tasks in ./tasks/
// ═══════════════════════════════════════════════════════════════

const { SUPABASE_URL, SUPABASE_SECRET } = require("./config");
const { fetchRates } = require("./tasks/fetchRates");
const { fetchRSS } = require("./tasks/fetchRSS");
const { dailyReadings } = require("./tasks/dailyReadings");
const { icgAnalysis } = require("./tasks/icgAnalysis");
const { classifyNewsAlerts } = require("./tasks/newsAlerts");

module.exports = async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SECRET) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  // ── Task routing: ?task=alerts runs ONLY news alerts classification ──
  const task = (req.query?.task || "").toLowerCase();
  if (task === "alerts") {
    const errors = [];
    try {
      const result = await classifyNewsAlerts(errors);
      return res.status(200).json({ task: "alerts", ...result, errors: errors.length > 0 ? errors : null, fetchedAt: new Date().toISOString() });
    } catch (e) {
      return res.status(500).json({ task: "alerts", error: e.message });
    }
  }

  // ── Full cron run ──
  const errors = [];
  const results = {};

  // 1. Exchange rates
  results.rates = await fetchRates(errors);

  // 2. RSS articles
  results.rss = await fetchRSS(errors);

  // 3. Daily readings (GDELT, oil, bilateral, snapshot)
  results.readings = await dailyReadings(errors);

  // 4. ICG via AI
  results.icg = await icgAnalysis(errors);

  // 5. News alerts classification
  try {
    results.alerts = await classifyNewsAlerts(errors);
  } catch (e) {
    errors.push(`News alerts: ${e.message}`);
    results.alerts = { error: e.message };
  }

  return res.status(200).json({
    ok: true,
    results,
    errors: errors.length > 0 ? errors : null,
    fetchedAt: new Date().toISOString(),
  });
};
