// Intelligence Terminal — Market Ticker Bar
import { MarketData } from "@/lib/chatEngine";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MarketTickerProps {
  marketData: MarketData[];
  loading: boolean;
}

export default function MarketTicker({ marketData, loading }: MarketTickerProps) {
  const tickerItems = marketData.filter(d => d.price !== null).slice(0, 20);

  const formatPrice = (price: number | null, type: string) => {
    if (price === null) return "—";
    if (type === "currency") return price.toFixed(4);
    if (price > 1000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
    return price.toFixed(2);
  };

  const getChangeColor = (change: number | null) => {
    if (change === null) return "text-muted-foreground";
    if (change > 0) return "text-emerald-400";
    if (change < 0) return "text-red-400";
    return "text-muted-foreground";
  };

  return (
    <div className="h-8 bg-card border-b border-border flex items-center overflow-hidden relative">
      {/* Left label */}
      <div className="flex-shrink-0 px-3 border-r border-border h-full flex items-center bg-amber-500/5">
        <span className="font-mono text-xs tracking-wide text-amber-400 text-xs font-medium tracking-widest">LIVE</span>
      </div>

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center px-4">
            <span className="font-mono text-xs tracking-wide text-muted-foreground text-xs animate-pulse">LOADING MARKET DATA...</span>
          </div>
        ) : (
          <div className="flex items-center gap-0 whitespace-nowrap" style={{ animation: 'ticker 40s linear infinite' }}>
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <div key={`${item.symbol}-${i}`} className="flex items-center gap-1.5 px-4 border-r border-border/30 h-8">
                <span className="font-mono text-xs tracking-wide text-muted-foreground text-xs">{item.name}</span>
                <span className={`font-mono text-xs text-xs font-medium ${getChangeColor(item.changePercent)}`}>
                  {formatPrice(item.price, item.type)}
                </span>
                {item.changePercent !== null && (
                  <span className={`font-mono text-xs text-xs flex items-center gap-0.5 ${getChangeColor(item.changePercent)}`}>
                    {item.changePercent > 0 ? <TrendingUp size={9} /> : item.changePercent < 0 ? <TrendingDown size={9} /> : <Minus size={9} />}
                    {Math.abs(item.changePercent).toFixed(2)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right label */}
      <div className="flex-shrink-0 px-3 border-l border-border h-full flex items-center bg-card/80">
        <span className="font-mono text-xs tracking-wide text-muted-foreground text-xs">
          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} UTC
        </span>
      </div>
    </div>
  );
}
