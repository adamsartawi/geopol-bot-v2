// ============================================================
// GEOPOLITICAL INTELLIGENCE ENGINE — Live Market Data Hook
// Fetches real-time data from Yahoo Finance via CORS proxy
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { MarketData } from "../lib/chatEngine";
import { LIVE_DATA_CONFIGS } from "../lib/geopoliticalData";

// Market data is fetched via backend proxy to avoid CORS issues

// Fallback mock data for when API is unavailable
const MOCK_DATA: Record<string, { price: number; change: number; changePercent: number }> = {
  "^GSPC": { price: 5650.23, change: 12.45, changePercent: 0.22 },
  "^IXIC": { price: 18234.56, change: -45.23, changePercent: -0.25 },
  "^DJI": { price: 42150.78, change: 89.12, changePercent: 0.21 },
  "000001.SS": { price: 3245.67, change: -23.45, changePercent: -0.72 },
  "^HSI": { price: 19876.54, change: 123.45, changePercent: 0.63 },
  "^GDAXI": { price: 19234.56, change: -67.89, changePercent: -0.35 },
  "^FCHI": { price: 7456.78, change: 23.45, changePercent: 0.32 },
  "^FTSE": { price: 8234.56, change: -12.34, changePercent: -0.15 },
  "IMOEX.ME": { price: 2876.54, change: 45.67, changePercent: 1.61 },
  "TA35.TA": { price: 1987.65, change: -34.56, changePercent: -1.71 },
  "^GSPTSE": { price: 23456.78, change: 67.89, changePercent: 0.29 },
  "CL=F": { price: 72.45, change: -1.23, changePercent: -1.67 },
  "BZ=F": { price: 76.78, change: -0.98, changePercent: -1.26 },
  "GC=F": { price: 2987.65, change: 23.45, changePercent: 0.79 },
  "NG=F": { price: 3.45, change: 0.12, changePercent: 3.60 },
  "ZW=F": { price: 534.25, change: -8.75, changePercent: -1.61 },
  "EURUSD=X": { price: 1.0834, change: -0.0023, changePercent: -0.21 },
  "USDRUB=X": { price: 89.45, change: 0.67, changePercent: 0.75 },
  "USDCNY=X": { price: 7.2345, change: 0.0123, changePercent: 0.17 },
  "USDILS=X": { price: 3.7234, change: 0.0456, changePercent: 1.24 },
  "USDCAD=X": { price: 1.3845, change: 0.0023, changePercent: 0.17 },
};

async function fetchSingleQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const response = await fetch(`/api/market-data?symbol=${encodeURIComponent(symbol)}`, {
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    const price = meta?.regularMarketPrice;
    const prevClose = meta?.previousClose || meta?.chartPreviousClose;
    
    if (!price) return null;
    
    const change = prevClose ? price - prevClose : 0;
    const changePercent = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
    
    return { price, change, changePercent };
  } catch {
    return null;
  }
}

export function useMarketData() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    // Fetch a subset of key symbols to avoid rate limiting
    const keySymbols = [
      "^GSPC", "^IXIC", "000001.SS", "^GDAXI", "^FTSE",
      "CL=F", "GC=F", "NG=F", "ZW=F",
      "EURUSD=X", "USDRUB=X", "USDCNY=X", "USDILS=X",
      "IMOEX.ME", "TA35.TA", "^GSPTSE"
    ];
    
    const results: MarketData[] = [];
    let successCount = 0;
    
    // Fetch in parallel batches
    const batchSize = 4;
    for (let i = 0; i < keySymbols.length; i += batchSize) {
      const batch = keySymbols.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (symbol) => {
          const config = LIVE_DATA_CONFIGS.find(c => c.symbol === symbol);
          if (!config) return null;
          
          const quote = await fetchSingleQuote(symbol);
          if (quote) successCount++;
          
          const fallback = MOCK_DATA[symbol];
          const finalQuote = quote || fallback || null;
          
          return {
            symbol,
            name: config.name,
            price: finalQuote?.price ?? null,
            change: finalQuote?.change ?? null,
            changePercent: finalQuote?.changePercent ?? null,
            country: config.country,
            type: config.type,
          } as MarketData;
        })
      );
      
      results.push(...batchResults.filter((r): r is MarketData => r !== null));
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < keySymbols.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // Fill in remaining configs with mock data
    for (const config of LIVE_DATA_CONFIGS) {
      if (!results.find(r => r.symbol === config.symbol)) {
        const fallback = MOCK_DATA[config.symbol];
        results.push({
          symbol: config.symbol,
          name: config.name,
          price: fallback?.price ?? null,
          change: fallback?.change ?? null,
          changePercent: fallback?.changePercent ?? null,
          country: config.country,
          type: config.type,
        });
      }
    }
    
    setMarketData(results);
    setUsingMockData(successCount < 3);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getByCountry = (countryId: string) => 
    marketData.filter(d => d.country === countryId);
  
  const getByType = (type: string) => 
    marketData.filter(d => d.type === type);
  
  const getBySymbol = (symbol: string) => 
    marketData.find(d => d.symbol === symbol);

  return { 
    marketData, 
    loading, 
    lastUpdated, 
    usingMockData,
    refresh: fetchData,
    getByCountry,
    getByType,
    getBySymbol
  };
}
