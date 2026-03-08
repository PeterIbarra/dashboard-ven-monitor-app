// /api/acled — Proxy for ACLED API with OAuth authentication
// Supports: events (default), cast (predictions)

const ACLED_EMAIL = process.env.ACLED_EMAIL;
const ACLED_PASSWORD = process.env.ACLED_PASSWORD;

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch("https://acleddata.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: ACLED_EMAIL,
      password: ACLED_PASSWORD,
      grant_type: "password",
      client_id: "acled",
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ACLED auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // refresh 1 min early
  return cachedToken;
}

module.exports = async function handler(req, res) {
  if (!ACLED_EMAIL || !ACLED_PASSWORD) {
    return res.status(500).json({ error: "ACLED credentials not configured" });
  }

  const { type = "events", year, limit = "500", event_type, admin1 } = req.query;

  try {
    const token = await getToken();

    let url;
    if (type === "cast") {
      url = `https://acleddata.com/api/cast/read?_format=json&country=Venezuela`;
    } else {
      // Events
      const currentYear = new Date().getFullYear();
      const y = year || currentYear;
      url = `https://acleddata.com/api/acled/read?_format=json&country=Venezuela&year=${y}&limit=${limit}`;
      url += `&fields=event_id_cnty|event_date|event_type|sub_event_type|actor1|actor2|fatalities|admin1|admin2|location|latitude|longitude|notes|civilian_targeting|disorder_type`;
      if (event_type) url += `&event_type=${encodeURIComponent(event_type)}`;
      if (admin1) url += `&admin1=${encodeURIComponent(admin1)}`;
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      // Token might be expired, retry once
      if (response.status === 401) {
        cachedToken = null;
        tokenExpiry = 0;
        const newToken = await getToken();
        const retry = await fetch(url, {
          headers: { Authorization: `Bearer ${newToken}` },
          signal: AbortSignal.timeout(15000),
        });
        if (!retry.ok) return res.status(retry.status).json({ error: `ACLED retry: ${retry.statusText}` });
        const data = await retry.json();
        res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=1800");
        return res.status(200).json(data);
      }
      return res.status(response.status).json({ error: `ACLED: ${response.statusText}` });
    }

    const data = await response.json();
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=1800");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
