// Intelligence Terminal — Market Data Panel
import { MarketData } from "@/lib/chatEngine";
import { CountryProfile } from "@/lib/geopoliticalData";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MarketPanelProps {
  marketData: MarketData[];
  countries: CountryProfile[];
  loading: boolean;
}

export default function MarketPanel({ marketData, countries, loading }: MarketPanelProps) {
  const getByType = (type: string) => marketData.filter(d => d.type === type && d.price !== null);
  const getByCountry = (countryId: string) => marketData.filter(d => d.country === countryId && d.type === "index" && d.price !== null);

  const formatPrice = (price: number | null, type: string) => {
    if (price === null) return "—";
    if (type === "currency") return price.toFixed(4);
    if (price > 1000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
    return price.toFixed(2);
  };

  const ChangeIndicator = ({ value }: { value: number | null }) => {
    if (value === null) return <span className="text-muted-foreground">—</span>;
    const isPos = value > 0;
    const isNeg = value < 0;
    return (
      <span className={`flex items-center gap-0.5 ${isPos ? "text-emerald-400" : isNeg ? "text-red-400" : "text-muted-foreground"}`}>
        {isPos ? <TrendingUp size={9} /> : isNeg ? <TrendingDown size={9} /> : <Minus size={9} />}
        {Math.abs(value).toFixed(2)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <span className="font-mono text-xs tracking-wide text-muted-foreground text-xs animate-pulse">LOADING MARKET DATA...</span>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      {/* Indices by country */}
      {countries.map(country => {
        const indices = getByCountry(country.id);
        if (indices.length === 0) return null;
        return (
          <div key={country.id}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">{country.flag}</span>
              <span className="font-mono text-xs tracking-wide text-xs text-muted-foreground tracking-widest">
                {country.name === "Europe (EU+UK)" ? "EUROPE" : country.name.toUpperCase()}
              </span>
            </div>
            <div className="space-y-1">
              {indices.map(item => (
                <div key={item.symbol} className="flex items-center justify-between px-2 py-1 rounded-sm bg-secondary/30">
                  <span className="font-mono text-xs tracking-wide text-xs text-foreground/80">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs tracking-wide text-xs text-foreground font-medium">
                      {formatPrice(item.price, item.type)}
                    </span>
                    <span className="font-mono text-xs tracking-wide text-xs">
                      <ChangeIndicator value={item.changePercent} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Commodities */}
      <div>
        <div className="font-mono text-xs tracking-wide text-muted-foreground text-xs mb-1.5 tracking-widest">COMMODITIES</div>
        <div className="space-y-1">
          {getByType("commodity").map(item => (
            <div key={item.symbol} className="flex items-center justify-between px-2 py-1 rounded-sm bg-secondary/30">
              <span className="font-mono text-xs tracking-wide text-xs text-foreground/80">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs tracking-wide text-xs text-foreground font-medium">
                  ${formatPrice(item.price, item.type)}
                </span>
                <span className="font-mono text-xs tracking-wide text-xs">
                  <ChangeIndicator value={item.changePercent} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Currencies */}
      <div>
        <div className="font-mono text-xs tracking-wide text-muted-foreground text-xs mb-1.5 tracking-widest">CURRENCIES</div>
        <div className="space-y-1">
          {getByType("currency").map(item => (
            <div key={item.symbol} className="flex items-center justify-between px-2 py-1 rounded-sm bg-secondary/30">
              <span className="font-mono text-xs tracking-wide text-xs text-foreground/80">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs tracking-wide text-xs text-foreground font-medium">
                  {formatPrice(item.price, item.type)}
                </span>
                <span className="font-mono text-xs tracking-wide text-xs">
                  <ChangeIndicator value={item.changePercent} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
