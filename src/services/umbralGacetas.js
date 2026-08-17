import { IS_DEPLOYED } from "../utils";

const UMBRAL_URL = "https://asbimzawahtyrhpwrrld.supabase.co";
const UMBRAL_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzYmltemF3YWh0eXJocHdycmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzUzMjAsImV4cCI6MjA4NjE1MTMyMH0.sF5JDpw6RC6vb9btaw8SPt78l17hkdphz-0tMWW4MsI";
const headers = { apikey:UMBRAL_ANON, Authorization:`Bearer ${UMBRAL_ANON}` };
const fields = "id,gazette_number,gazette_type,gazette_date,decree_number,change_type,change_label,person_name,post_or_position,institution,organism,is_military_person,military_rank,is_military_post,summary";

export async function fetchUmbralGacetas(limit=5000) {
  if (IS_DEPLOYED) {
    const response = await fetch(`/api/gacetas?limit=${limit}`, { signal:AbortSignal.timeout(18000) });
    if (!response.ok) throw new Error(`API Gacetas: ${response.status}`);
    return response.json();
  }
  const batchResponse = await fetch(`${UMBRAL_URL}/rest/v1/gazette_batches?select=id,uploaded_at&is_active=eq.true&order=uploaded_at.desc&limit=1`, { headers, signal:AbortSignal.timeout(10000) });
  if (!batchResponse.ok) throw new Error(`Umbral batches: ${batchResponse.status}`);
  const [batch] = await batchResponse.json();
  if (!batch) return { records:[], total:0, source:"Umbral / Gaceta Oficial", external:true };
  const records=[];
  const capped=Math.min(limit,5000);
  for(let offset=0;offset<capped;offset+=1000){
    const pageSize=Math.min(1000,capped-offset);
    const response = await fetch(`${UMBRAL_URL}/rest/v1/gazette_records?select=${fields}&batch_id=eq.${batch.id}&order=gazette_date.desc,id.desc&offset=${offset}&limit=${pageSize}`, { headers, signal:AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Umbral records: ${response.status}`);
    const page=await response.json(); records.push(...page);
    if(page.length<pageSize) break;
  }
  return { records, total:records.length, batchUpdatedAt:batch.uploaded_at, source:"Umbral / Gaceta Oficial", external:true, sourceUrl:"https://www.umbral.watch/installing-democracy" };
}

export const gacetaOfficialUrl = number => `http://www.gacetaoficial.gob.ve/gacetas/${number}`;
