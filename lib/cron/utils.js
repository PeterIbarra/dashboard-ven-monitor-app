const { SUPABASE_URL, SUPABASE_SECRET, SCENARIO_TAGS, DIM_TAGS } = require("./config");

function classify(title, desc) {
  const text = `${title} ${desc}`;
  const scenarios = Object.entries(SCENARIO_TAGS).filter(([,p]) => p.test(text)).map(([k]) => k);
  const dims = Object.entries(DIM_TAGS).filter(([,p]) => p.test(text)).map(([k]) => k);
  return {
    scenarios: scenarios.length > 0 ? scenarios : ["E3"],
    dims: dims.length > 0 ? dims : ["Político"],
  };
}

function parseRSS(xml, sourceName, type) {
  const items = [];
  const regex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const c = match[1];
    const title = (c.match(/<title><!\[CDATA\[(.*?)\]\]>/) || c.match(/<title>(.*?)<\/title>/) || [])[1] || "";
    const link = (c.match(/<link>(.*?)<\/link>/) || [])[1] || "";
    const desc = (c.match(/<description><!\[CDATA\[(.*?)\]\]>/) || c.match(/<description>(.*?)<\/description>/) || [])[1] || "";
    const pubDate = (c.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";
    if (!title.trim()) continue;
    const clean = (s) => s.replace(/<[^>]*>/g, "").trim();
    const { scenarios, dims } = classify(title, desc);
    items.push({
      title: clean(title),
      link: link.trim(),
      description: clean(desc).substring(0, 300),
      source: sourceName,
      type,
      published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      scenarios,
      dims,
    });
  }
  return items;
}

async function upsertToSupabase(articles) {
  // Insert with on_conflict to handle duplicates by link
  const res = await fetch(`${SUPABASE_URL}/rest/v1/articles?on_conflict=link`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SECRET,
      Authorization: `Bearer ${SUPABASE_SECRET}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(articles),
  });
  return { ok: res.ok, status: res.status, text: res.ok ? "" : await res.text().catch(() => "") };
}


module.exports = { classify, parseRSS, upsertToSupabase };
