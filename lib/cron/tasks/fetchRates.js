const { SUPABASE_URL, SUPABASE_SECRET } = require("../config");

async function fetchRates(errors) {
  let ratesSaved = false;
try {
  const rateRes = await fetch("https://ve.dolarapi.com/v1/dolares", { signal: AbortSignal.timeout(6000) });
  if (rateRes.ok) {
    const rateData = await rateRes.json();
    const oficial = rateData.find(d => d.fuente === "oficial");
    const paralelo = rateData.find(d => d.fuente === "paralelo");
    const bcv = oficial?.promedio || null;
    const par = paralelo?.promedio || null;
    if (bcv && par) {
      const today = new Date().toISOString().slice(0, 10);
      const brecha = ((par - bcv) / bcv) * 100;
      const usdt = par * 1.02;
      const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/rates?on_conflict=date`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SECRET,
          Authorization: `Bearer ${SUPABASE_SECRET}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({ date: today, bcv, paralelo: par, usdt, brecha }),
      });
      ratesSaved = upsertRes.ok;
      if (!upsertRes.ok) errors.push(`Rates: Supabase ${upsertRes.status}`);
    }
  }
} catch (e) {
  errors.push(`Rates: ${e.message}`);
}
  return { ratesSaved };
}

module.exports = { fetchRates };
