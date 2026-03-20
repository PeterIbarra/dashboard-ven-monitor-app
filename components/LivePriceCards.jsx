import { useState, useEffect } from "react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { BrentChart } from "./charts/BrentChart";
import { VenProductionChart } from "./charts/VenProductionChart";
import { MUTED, font } from "../constants";
import { IS_DEPLOYED, CORS_PROXIES } from "../utils";

export function LivePriceCards() {
  const [prices, setPrices] = useState(null);
  const [brentHistory, setBrentHistory] = useState([]);
  const [steoForecast, setSteoForecast] = useState([]);
  const [venProduction, setVenProduction] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("loading");

  useEffect(() => {
    async function fetchPrices() {
      // Try our Vercel serverless function first (has API key server-side)
      if (IS_DEPLOYED) {
        try {
          const res = await fetch("/api/oil-prices", { signal: AbortSignal.timeout(20000) });
          if (res.ok) {
            const data = await res.json();
            if (data.brent || data.wti || data.natgas) {
              setPrices(data);
              if (data.brentHistory) setBrentHistory(data.brentHistory);
              if (data.steoForecast) setSteoForecast(data.steoForecast);
              if (data.venProduction) setVenProduction(data.venProduction);
              setSource("live");
              setLoading(false);
              return;
            }
          }
        } catch {}
      }
      // Try direct API with CORS proxy (for local dev — no auth, limited)
      for (const proxyFn of CORS_PROXIES) {
        try {
          const [brentRes, wtiRes, gasRes] = await Promise.all([
            fetch(proxyFn("https://api.oilpriceapi.com/v1/prices/latest?by_code=BRENT_CRUDE_USD"), {
              signal: AbortSignal.timeout(6000),
            }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(proxyFn("https://api.oilpriceapi.com/v1/prices/latest?by_code=WTI_USD"), {
              signal: AbortSignal.timeout(6000),
            }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(proxyFn("https://api.oilpriceapi.com/v1/prices/latest?by_code=NATURAL_GAS_USD"), {
              signal: AbortSignal.timeout(6000),
            }).then(r => r.ok ? r.json() : null).catch(() => null),
          ]);
          if (brentRes?.data || wtiRes?.data || gasRes?.data) {
            setPrices({ brent: brentRes?.data, wti: wtiRes?.data, natgas: gasRes?.data });
            setSource("live");
            setLoading(false);
            return;
          }
        } catch { continue; }
      }
      // Fallback static
      setPrices({ brent: { price: 72.50 }, wti: { price: 68.80 }, natgas: { price: 3.85 } });
      setSource("static");
      setLoading(false);
    }
    fetchPrices();
    // Auto-refresh every 5 minutes — pause when tab not visible
    let iv = setInterval(fetchPrices, 300000);
    const onVis1 = () => {
      clearInterval(iv);
      if (document.visibilityState === "visible") iv = setInterval(fetchPrices, 300000);
    };
    document.addEventListener("visibilitychange", onVis1);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onVis1); };
  }, []);

  // ── Scrape OilPriceAPI widget for real-time prices (widget loads in browser, bypasses serverless limits) ──
  useEffect(() => {
    let attempts = 0;
    const scrapeWidget = () => {
      const ticker = document.getElementById("oilpriceapi-ticker");
      if (!ticker) return;
      const allText = ticker.innerText || ticker.textContent || "";
      const brentMatch = allText.match(/BRENT[^$]*\$([\d.]+)/i);
      const wtiMatch = allText.match(/WTI[^$]*\$([\d.]+)/i);
      const gasMatch = allText.match(/(?:NATURAL.?GAS|NAT.?GAS)[^$]*\$([\d.]+)/i);
      if (brentMatch || wtiMatch) {
        const now = new Date().toISOString();
        setPrices(prev => ({
          ...prev,
          brent: brentMatch ? { price: parseFloat(brentMatch[1]), created_at: now } : prev?.brent,
          wti: wtiMatch ? { price: parseFloat(wtiMatch[1]), created_at: now } : prev?.wti,
          natgas: gasMatch ? { price: parseFloat(gasMatch[1]), created_at: now } : prev?.natgas,
        }));
        setSource("live");
        // Append live Brent price to chart history
        if (brentMatch) {
          const livePrice = parseFloat(brentMatch[1]);
          const today = new Date().toISOString().slice(0, 10);
          setBrentHistory(prev => {
            if (!prev || prev.length === 0) return prev;
            const filtered = prev.filter(h => h.time?.slice(0, 10) !== today);
            return [...filtered, { price: livePrice, time: today + "T12:00:00Z" }];
          });
        }
        return true;
      }
      return false;
    };
    const iv = setInterval(() => {
      attempts++;
      if (scrapeWidget() || attempts > 15) clearInterval(iv);
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const extract = (obj) => {
    if (!obj) return null;
    if (typeof obj === "number") return obj;
    if (obj.price != null) return typeof obj.price === "number" ? obj.price : parseFloat(obj.price);
    return null;
  };

  const brent = extract(prices?.brent) || 72.50;
  const wti = extract(prices?.wti) || 68.80;
  const natgas = extract(prices?.natgas) || 3.85;
  const brentTime = prices?.brent?.created_at || prices?.brent?.timestamp || null;
  const wtiTime = prices?.wti?.created_at || prices?.wti?.timestamp || null;
  const natgasTime = prices?.natgas?.created_at || prices?.natgas?.timestamp || null;

  const fmtTime = (t) => t ? new Date(t).toLocaleString("es", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

  const items = [
    { label: "Brent Crude", value: brent, unit: "USD/bbl", color: "#22c55e", desc: "Referencia internacional", time: brentTime },
    { label: "WTI Crude", value: wti, unit: "USD/bbl", color: "#38bdf8", desc: "Referencia EE.UU.", time: wtiTime },
    { label: "Natural Gas", value: natgas, unit: "USD/MMBtu", color: "#f59e0b", desc: "Henry Hub", time: natgasTime },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Price cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {loading ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 20, color: MUTED, fontSize: 10, fontFamily: font }}>
            Conectando con OilPriceAPI...
          </div>
        ) : items.map((item, i) => (
          <Card key={i} accent={item.color}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontFamily: font, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase" }}>{item.label}</span>
              {i === 0 && <Badge color={source === "live" ? "#22c55e" : source === "yahoo" ? "#22c55e" : "#a17d08"}>{source === "live" || source === "yahoo" ? "EN VIVO" : source === "eia" ? "EIA" : "ESTÁTICO"}</Badge>}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: item.color, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>
              ${item.value.toFixed(2)}
            </div>
            <div style={{ fontSize: 9, fontFamily: font, color: MUTED, marginTop: 6 }}>{item.unit} · {item.desc}</div>
            {item.time && <div style={{ fontSize: 7, fontFamily: font, color: `${MUTED}80`, marginTop: 3 }}>{fmtTime(item.time)}</div>}
          </Card>
        ))}
      </div>
      {/* Brent chart */}
      {brentHistory.length > 2 && <BrentChart history={brentHistory} forecast={steoForecast} />}
      {venProduction.length > 2 && <VenProductionChart data={venProduction} />}
      {/* Fallback notice */}
      {!loading && source === "static" && (
        <div style={{ fontSize: 8, fontFamily: font, color: "#a17d08", textAlign: "center" }}>
          ⚠ Precios de referencia estáticos — en vivo requiere deploy en Vercel con OILPRICE_API_KEY
        </div>
      )}
    </div>
  );
}
