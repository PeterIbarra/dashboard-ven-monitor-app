import { useState, useCallback } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { BG2, BORDER, MUTED, font } from "../constants";
import { TVMarketQuotes } from "./charts/TVMarketQuotes";

export function MarketOverviewWidget() {
  const mob = useIsMobile();
  const containerRef = useCallback((node) => {
    if (!node) return;
    node.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    wrapper.appendChild(widgetDiv);
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "light",
      dateRange: "1M",
      showChart: true,
      locale: "es",
      width: "100%",
      height: "660",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      plotLineColorGrowing: "rgba(34,197,94,1)",
      plotLineColorFalling: "rgba(239,68,68,1)",
      gridLineColor: "rgba(200,210,220,0.5)",
      scaleFontColor: "rgba(90,106,122,1)",
      belowLineFillColorGrowing: "rgba(34,197,94,0.08)",
      belowLineFillColorFalling: "rgba(239,68,68,0.08)",
      belowLineFillColorGrowingBottom: "rgba(34,197,94,0)",
      belowLineFillColorFallingBottom: "rgba(239,68,68,0)",
      symbolActiveColor: "rgba(10,151,217,0.12)",
      tabs: [
        {
          title: "Index",
          symbols: [
            { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
            { s: "FOREXCOM:NSXUSD", d: "NASDAQ" },
            { s: "FOREXCOM:DJI", d: "Dow Jones" },
            { s: "INDEX:DAX", d: "DAX" },
            { s: "TVC:DXY", d: "Dólar Index (DXY)" },
            { s: "TVC:VIX", d: "Volatilidad (VIX)" },
          ]
        },
        {
          title: "Stocks",
          symbols: [
            { s: "NYSE:XOM", d: "Exxon Mobil" },
            { s: "NYSE:CVX", d: "Chevron" },
            { s: "NYSE:SHEL", d: "Shell" },
            { s: "NYSE:E", d: "Eni" },
            { s: "BME:REP", d: "Repsol" },
            { s: "NYSE:BP", d: "BP" },
          ]
        },
        {
          title: "Forex",
          symbols: [
            { s: "FX_IDC:EURUSD", d: "EUR/USD" },
            { s: "FX_IDC:USDCOP", d: "USD/COP" },
            { s: "FX_IDC:USDBRL", d: "USD/BRL" },
            { s: "FX_IDC:USDMXN", d: "USD/MXN" },
            { s: "FX_IDC:USDCNY", d: "USD/CNY" },
            { s: "FX_IDC:USDRUB", d: "USD/RUB" },
          ]
        },
        {
          title: "Crypto",
          symbols: [
            { s: "BITSTAMP:BTCUSD", d: "Bitcoin" },
            { s: "BITSTAMP:ETHUSD", d: "Ethereum" },
            { s: "BINANCE:USDTDAI", d: "USDT/DAI" },
            { s: "COINBASE:SOLUSD", d: "Solana" },
          ]
        },
      ]
    });
    wrapper.appendChild(script);
    node.appendChild(wrapper);
  }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ background: BG2, border: `1px solid ${BORDER}`, padding: "12px", minHeight: 400 }}>
        <div style={{ fontSize: 8, fontFamily: font, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
          🌍 Mercados globales · TradingView · Index · Stocks · Forex · Crypto
        </div>
        <div ref={containerRef} />
      </div>
      {/* Commodity & Bond — TradingView Market Quotes widget with free CFD symbols */}
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:12 }}>
        <TVMarketQuotes
          title="📦 Commodity"
          height={350}
          groups={[
            { name:"Metals", symbols:[
              { name:"CMCMARKETS:GOLD", displayName:"Gold" },
              { name:"CMCMARKETS:SILVER", displayName:"Silver" },
              { name:"CMCMARKETS:COPPER", displayName:"Copper" },
            ]},
          ]}
        />
        <TVMarketQuotes
          title="📊 Bond Yields"
          height={350}
          groups={[
            { name:"US Treasuries", symbols:[
              { name:"FRED:DGS2", displayName:"US 2Y Yield" },
              { name:"FRED:DGS10", displayName:"US 10Y Yield" },
              { name:"FRED:DGS30", displayName:"US 30Y Yield" },
            ]},
            { name:"Europe", symbols:[
              { name:"FRED:IRLTLT01DEM156N", displayName:"Germany 10Y" },
              { name:"FRED:IRLTLT01GBM156N", displayName:"UK 10Y" },
            ]},
          ]}
        />
      </div>
    </div>
  );
}
