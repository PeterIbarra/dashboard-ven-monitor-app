// ═══════════════════════════════════════════════════════════════
// CRON ORCHESTRATOR — Daily ingest, classify, persist
// Entry point for Vercel cron. Tasks in ./tasks/
// ═══════════════════════════════════════════════════════════════

const { SUPABASE_URL, SUPABASE_SECRET } = require("../../lib/cron/config");
const { fetchRates } = require("../../lib/cron/tasks/fetchRates");
const { fetchRSS } = require("../../lib/cron/tasks/fetchRSS");
const { dailyReadings } = require("../../lib/cron/tasks/dailyReadings");
const { icgAnalysis } = require("../../lib/cron/tasks/icgAnalysis");
const { classifyNewsAlerts } = require("../../lib/cron/tasks/newsAlerts");
const { sendDailyBrief } = require("../../lib/cron/tasks/dailyBrief");
const { requireCronSecret } = require("../../lib/apiSecurity");

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!requireCronSecret(req, res)) return;

  if (!SUPABASE_URL || !SUPABASE_SECRET) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  // ── Task routing ──
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

  if (task === "dailybrief") {
    const errors = [];
    try {
      const result = await sendDailyBrief(errors);
      return res.status(200).json({ task: "dailyBrief", ...result, errors: errors.length > 0 ? errors : null, fetchedAt: new Date().toISOString() });
    } catch (e) {
      return res.status(500).json({ task: "dailyBrief", error: e.message });
    }
  }

  // ── Full cron run ──
  const errors = [];
  const results = {};

  // Alert classification is time-sensitive and must run before the heavier
  // ingestion tasks. Otherwise a 60-second serverless timeout can leave the
  // dashboard serving the last successful classification indefinitely.
  try {
    results.alerts = await classifyNewsAlerts(errors);
  } catch (e) {
    errors.push(`News alerts: ${e.message}`);
    results.alerts = { error: e.message };
  }

  // Remaining daily ingestion tasks
  results.rates = await fetchRates(errors);
  results.rss = await fetchRSS(errors);
  results.readings = await dailyReadings(errors);
  results.icg = await icgAnalysis(errors);

  return res.status(200).json({
    ok: true,
    results,
    errors: errors.length > 0 ? errors : null,
    fetchedAt: new Date().toISOString(),
  });
};
