const { SUPABASE_URL, SUPABASE_SECRET } = require("../config");

async function dailyReadings(errors) {
  let readingsSaved = false;
  let oilSaved = false;
let readingsSaved = false;
try {
  const today = new Date().toISOString().slice(0, 10);
  const reading = { date: today };

  // Fetch in parallel: GDELT tone (7d avg), oil prices, bilateral, dolar (for brecha)
  const [gdeltRes, oilRes, bilRes, dolarRes] = await Promise.allSettled([
    fetch("https://api.gdeltproject.org/api/v2/doc/doc?query=Venezuela&mode=timelinetone&timespan=7d&format=csv", { signal: AbortSignal.timeout(10000) }),
    fetch("https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=" + (process.env.EIA_API_KEY || "") + "&frequency=daily&data[0]=value&facets[product][]=EPCBRENT&facets[product][]=EPCWTI&sort[0][column]=period&sort[0][direction]=desc&length=1", { signal: AbortSignal.timeout(8000) }),
    fetch("https://www.pizzint.watch/api/aggregated-data?actorA=United%20States&actorB=Venezuela&days=7", { signal: AbortSignal.timeout(10000) }),
    fetch("https://ve.dolarapi.com/v1/dolares", { signal: AbortSignal.timeout(6000) }),
  ]);

  // Parse GDELT tone (7-day average — more reliable than 1d)
  if (gdeltRes.status === "fulfilled" && gdeltRes.value.ok) {
    try {
      const csv = await gdeltRes.value.text();
      const lines = csv.trim().split("\n").slice(1);
      let sum = 0, count = 0, vol = 0;
      for (const line of lines) {
        const parts = line.split(",");
        const val = parseFloat(parts[parts.length - 1]);
        if (!isNaN(val)) { sum += val; count++; }
        if (parts.length > 1) { const v = parseInt(parts[1]); if (!isNaN(v)) vol += v; }
      }
      if (count > 0) reading.gdelt_tone = parseFloat((sum / count).toFixed(2));
      reading.gdelt_volume = vol;
    } catch {}
  }

  // Parse oil prices — OilPriceAPI first (real-time, cron runs every 12h = ~180 req/mo), EIA fallback
  let oilParsed = false;
  const oilKey = process.env.OILPRICE_API_KEY;
  if (oilKey) {
    try {
      const oilHeaders = { Authorization: `Token ${oilKey}`, "Content-Type": "application/json" };
      const [bOP, wOP] = await Promise.allSettled([
        fetch(`https://api.oilpriceapi.com/v1/prices/latest?by_code=BRENT_CRUDE_USD`, { headers: oilHeaders, signal: AbortSignal.timeout(8000) }),
        fetch(`https://api.oilpriceapi.com/v1/prices/latest?by_code=WTI_USD`, { headers: oilHeaders, signal: AbortSignal.timeout(8000) }),
      ]);
      if (bOP.status === "fulfilled" && bOP.value.ok) {
        const d = await bOP.value.json();
        if (d?.data?.price > 10) { reading.brent = parseFloat(d.data.price.toFixed(2)); oilParsed = true; }
      }
      if (wOP.status === "fulfilled" && wOP.value.ok) {
        const d = await wOP.value.json();
        if (d?.data?.price > 10) { reading.wti = parseFloat(d.data.price.toFixed(2)); oilParsed = true; }
      }
    } catch {}
  }
  // EIA fallback for oil
  if (!oilParsed && oilRes.status === "fulfilled" && oilRes.value.ok) {
    try {
      const data = await oilRes.value.json();
      const items = data?.response?.data || [];
      for (const item of items) {
        if (item.product === "EPCBRENT") reading.brent = parseFloat(item.value);
        if (item.product === "EPCWTI") reading.wti = parseFloat(item.value);
      }
    } catch {}
  }

  // Parse bilateral (7-day window — take latest data point)
  if (bilRes.status === "fulfilled" && bilRes.value.ok) {
    try {
      const data = await bilRes.value.json();
      const points = data?.data || [];
      if (points.length > 0) {
        const latest = points[points.length - 1];
        if (latest?.v != null) reading.bilateral_v = parseFloat(Number(latest.v).toFixed(2));
      }
    } catch {}
  }

  // Parse dolar for brecha + paralelo
  if (dolarRes.status === "fulfilled" && dolarRes.value.ok) {
    try {
      const data = await dolarRes.value.json();
      const oficial = data.find(d => d.fuente === "oficial");
      const par = data.find(d => d.fuente === "paralelo");
      if (oficial?.promedio && par?.promedio) {
        reading.paralelo = par.promedio;
        reading.brecha = parseFloat(((par.promedio - oficial.promedio) / oficial.promedio * 100).toFixed(1));
      }
    } catch {}
  }

  // Build alerts array
  const alerts = [];
  if (reading.brecha > 55) alerts.push("brecha_rojo");
  else if (reading.brecha > 45) alerts.push("brecha_amarillo");
  if (reading.brent && reading.brent < 60) alerts.push("brent_bajo_rojo");
  else if (reading.brent && reading.brent > 95) alerts.push("brent_alto_rojo");
  if (reading.bilateral_v && reading.bilateral_v > 2.0) alerts.push("bilateral_rojo");
  else if (reading.bilateral_v && reading.bilateral_v > 1.0) alerts.push("bilateral_amarillo");
  if (alerts.length > 0) reading.alerts_fired = alerts;

  // Upsert to Supabase
  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/daily_readings?on_conflict=date`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SECRET,
      Authorization: `Bearer ${SUPABASE_SECRET}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(reading),
  });
  readingsSaved = upsertRes.ok;
  if (!upsertRes.ok) errors.push(`Readings: Supabase ${upsertRes.status} — ${await upsertRes.text().catch(() => "")}`);
} catch (e) {
  errors.push(`Readings: ${e.message}`);
}
  return { readingsSaved, oilSaved };
}

module.exports = { dailyReadings };
