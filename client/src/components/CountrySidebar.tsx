// Intelligence Terminal — Country Navigator Sidebar
import { CountryProfile } from "@/lib/geopoliticalData";
import { MarketData } from "@/lib/chatEngine";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CountrySidebarProps {
  countries: CountryProfile[];
  marketData: MarketData[];
  onCountrySelect: (countryId: string) => void;
}

export default function CountrySidebar({ countries, marketData, onCountrySelect }: CountrySidebarProps) {
  const getCountryMarket = (countryId: string) => {
    return marketData.filter(d => d.country === countryId && d.type === "index").slice(0, 1)[0];
  };

  const getGlobalCommodities = () => {
    return marketData.filter(d => d.country === "GLOBAL" && d.type === "commodity").slice(0, 3);
  };

  return (
    <div className="w-48 flex flex-col border-r border-border bg-sidebar overflow-y-auto">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663242656098/TUUWwTL3ccHREs8KDzAWzE/geopol-hero-bg-RJpWYPG9ZTGEkgzQ7L8ciy.webp"
            alt="GEOPOL-INT"
            className="w-full h-16 object-cover rounded-sm opacity-80"
          />
        </div>
        <div className="mt-2">
          <div className="font-bold tracking-tight text-xs text-amber-400 tracking-widest">GEOPOL-INT</div>
          <div className="font-mono text-xs tracking-wide text-muted-foreground text-xs mt-0.5">v2.0 // INTELLIGENCE ENGINE</div>
        </div>
      </div>

      {/* Countries */}
      <div className="px-2 py-2">
        <div className="font-mono text-xs tracking-wide text-muted-foreground text-xs px-1 mb-2 tracking-widest">MONITORED ACTORS</div>
        <div className="space-y-1">
          {countries.map((country) => {
            const market = getCountryMarket(country.id);
            const isPositive = market?.changePercent && market.changePercent > 0;
            const isNegative = market?.changePercent && market.changePercent < 0;

            return (
              <button
                key={country.id}
                onClick={() => onCountrySelect(country.id)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-sm hover:bg-secondary/50 transition-all duration-200 group text-left"
              >
                <span className="text-base flex-shrink-0">{country.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground group-hover:text-amber-400 transition-colors truncate">
                    {country.name === "Europe (EU+UK)" ? "Europe" : country.name}
                  </div>
                  {market && (
                    <div className={`font-mono text-xs text-xs flex items-center gap-0.5 ${
                      isPositive ? "text-emerald-400" : isNegative ? "text-red-400" : "text-muted-foreground"
                    }`}>
                      {isPositive ? <TrendingUp size={8} /> : isNegative ? <TrendingDown size={8} /> : null}
                      {market.changePercent !== null ? `${market.changePercent > 0 ? "+" : ""}${market.changePercent.toFixed(2)}%` : "—"}
                    </div>
                  )}
                </div>
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: country.color }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-border my-1" />

      {/* Key Commodities */}
      <div className="px-2 py-2">
        <div className="font-mono text-xs tracking-wide text-muted-foreground text-xs px-1 mb-2 tracking-widest">KEY COMMODITIES</div>
        <div className="space-y-1.5">
          {getGlobalCommodities().map((item) => {
            const isPositive = item.changePercent && item.changePercent > 0;
            const isNegative = item.changePercent && item.changePercent < 0;
            return (
              <div key={item.symbol} className="flex items-center justify-between px-2">
                <span className="font-mono text-xs tracking-wide text-xs text-muted-foreground">{item.name}</span>
                <div className={`font-mono text-xs text-xs ${isPositive ? "text-emerald-400" : isNegative ? "text-red-400" : "text-muted-foreground"}`}>
                  {item.price !== null ? `$${item.price.toFixed(1)}` : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle East Map Image */}
      <div className="mt-auto p-2 border-t border-border">
        <div className="font-mono text-xs tracking-wide text-muted-foreground text-xs px-1 mb-1.5 tracking-widest">FOCAL REGION</div>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663242656098/TUUWwTL3ccHREs8KDzAWzE/geopol-middle-east-map-Snr7qSSsXMqTsCyw8qRiQu.webp"
          alt="Middle East"
          className="w-full rounded-sm opacity-75 hover:opacity-100 transition-opacity"
        />
        <div className="font-mono text-xs tracking-wide text-muted-foreground text-xs text-center mt-1">MIDDLE EAST</div>
      </div>
    </div>
  );
}
