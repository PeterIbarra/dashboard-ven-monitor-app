// Read-only proxy for Umbral's public Gazette dataset.
// External integration: schema and availability are controlled by Umbral.
const UMBRAL_URL = "https://asbimzawahtyrhpwrrld.supabase.co";
const UMBRAL_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzYmltemF3YWh0eXJocHdycmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzUzMjAsImV4cCI6MjA4NjE1MTMyMH0.sF5JDpw6RC6vb9btaw8SPt78l17hkdphz-0tMWW4MsI";
const headers = { apikey: UMBRAL_ANON, Authorization: `Bearer ${UMBRAL_ANON}` };

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error:"Method not allowed" });
  try {
    const batchResponse = await fetch(`${UMBRAL_URL}/rest/v1/gazette_batches?select=id,uploaded_at&is_active=eq.true&order=uploaded_at.desc&limit=1`, { headers, signal:AbortSignal.timeout(10000) });
    if (!batchResponse.ok) throw new Error(`Umbral batches: ${batchResponse.status}`);
    const [batch] = await batchResponse.json();
    if (!batch) return res.status(200).json({ records:[], total:0, source:"Umbral", external:true });

    const limit = Math.min(Math.max(parseInt(req.query.limit) || 5000, 1), 5000);
    const fields = "id,gazette_number,gazette_type,gazette_date,decree_number,change_type,change_label,person_name,post_or_position,institution,organism,is_military_person,military_rank,is_military_post,summary";
    const records = [];
    for (let offset=0; offset<limit; offset+=1000) {
      const pageSize=Math.min(1000,limit-offset);
      const recordsResponse = await fetch(`${UMBRAL_URL}/rest/v1/gazette_records?select=${fields}&batch_id=eq.${batch.id}&order=gazette_date.desc,id.desc&offset=${offset}&limit=${pageSize}`, { headers, signal:AbortSignal.timeout(15000) });
      if (!recordsResponse.ok) throw new Error(`Umbral records: ${recordsResponse.status}`);
      const page=await recordsResponse.json(); records.push(...page);
      if(page.length<pageSize) break;
    }
    const total = records.length;
    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
    return res.status(200).json({ records, total, batchUpdatedAt:batch.uploaded_at, source:"Umbral / Gaceta Oficial", external:true, sourceUrl:"https://www.umbral.watch/installing-democracy" });
  } catch (error) {
    return res.status(502).json({ error:error.message, records:[], total:0, sourceUrl:"https://www.umbral.watch/installing-democracy" });
  }
};
