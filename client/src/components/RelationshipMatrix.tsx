// Intelligence Terminal — Country-Pair Relationship Matrix
import { CountryPairAnalysis, CountryProfile } from "@/lib/geopoliticalData";

interface RelationshipMatrixProps {
  pairs: CountryPairAnalysis[];
  countries: CountryProfile[];
  selectedPair: string | null;
  onPairSelect: (pairId: string) => void;
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  Allied: "#10B981",
  Competitive: "#F59E0B",
  Transactional: "#06B6D4",
  Hostile: "#EF4444",
  Mixed: "#8B5CF6",
};

const RELATIONSHIP_BG: Record<string, string> = {
  Allied: "rgba(16, 185, 129, 0.15)",
  Competitive: "rgba(245, 158, 11, 0.15)",
  Transactional: "rgba(6, 182, 212, 0.15)",
  Hostile: "rgba(239, 68, 68, 0.15)",
  Mixed: "rgba(139, 92, 246, 0.15)",
};

export default function RelationshipMatrix({ pairs, countries, selectedPair, onPairSelect }: RelationshipMatrixProps) {
  const getPair = (id1: string, id2: string) => {
    return pairs.find(p =>
      (p.country1 === id1 && p.country2 === id2) ||
      (p.country1 === id2 && p.country2 === id1)
    );
  };

  const getTensionLabel = (score: number) => {
    if (score >= 80) return "CRITICAL";
    if (score >= 60) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  };

  return (
    <div className="p-3">
      <div className="font-mono text-xs tracking-wide text-muted-foreground text-xs mb-3 tracking-widest">BILATERAL RELATIONSHIP MATRIX</div>

      {/* Legend */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.entries(RELATIONSHIP_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
            <span className="font-mono text-xs tracking-wide text-xs text-muted-foreground">{type}</span>
          </div>
        ))}
      </div>

      {/* Matrix grid */}
      <div className="space-y-1.5">
        {pairs.map((pair) => {
          const c1 = countries.find(c => c.id === pair.country1);
          const c2 = countries.find(c => c.id === pair.country2);
          if (!c1 || !c2) return null;

          const isSelected = selectedPair === pair.id;
          const color = RELATIONSHIP_COLORS[pair.relationshipType] || "#64748B";
          const bg = RELATIONSHIP_BG[pair.relationshipType] || "rgba(100, 116, 139, 0.1)";

          return (
            <button
              key={pair.id}
              onClick={() => onPairSelect(pair.id)}
              className={`w-full text-left p-2.5 rounded-sm border transition-all duration-200 ${
                isSelected
                  ? "border-amber-500/50 bg-amber-500/5"
                  : "border-border hover:border-border/80"
              }`}
              style={!isSelected ? { backgroundColor: bg } : undefined}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{c1.flag}</span>
                  <span className="font-mono text-xs tracking-wide text-xs text-muted-foreground">vs</span>
                  <span className="text-sm">{c2.flag}</span>
                </div>
                <span
                  className="font-mono text-xs tracking-wide text-xs px-1.5 py-0.5 rounded-sm"
                  style={{ color, backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
                >
                  {pair.relationshipType.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-xs text-foreground/80 font-medium">
                  {c1.name === "Europe (EU+UK)" ? "Europe" : c1.name} / {c2.name === "Europe (EU+UK)" ? "Europe" : c2.name}
                </span>
              </div>

              {/* Tension/Cooperation bars */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs tracking-wide text-xs text-muted-foreground w-12">TENSION</span>
                  <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pair.tensionScore}%`,
                        backgroundColor: pair.tensionScore >= 80 ? "#EF4444" : pair.tensionScore >= 60 ? "#F59E0B" : "#64748B"
                      }}
                    />
                  </div>
                  <span className="font-mono text-xs tracking-wide text-xs" style={{
                    color: pair.tensionScore >= 80 ? "#EF4444" : pair.tensionScore >= 60 ? "#F59E0B" : "#64748B"
                  }}>
                    {getTensionLabel(pair.tensionScore)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs tracking-wide text-xs text-muted-foreground w-12">ME IMPACT</span>
                  <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                      style={{ width: `${pair.middleEastImpactScore}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs tracking-wide text-xs text-cyan-400">{pair.middleEastImpactScore}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected pair detail */}
      {selectedPair && (() => {
        const pair = pairs.find(p => p.id === selectedPair);
        if (!pair) return null;
        return (
          <div className="mt-3 p-2.5 bg-card border border-amber-500/20 rounded-sm rounded-sm">
            <div className="font-mono text-xs tracking-wide text-amber-400 text-xs mb-1.5">LEVERAGE ASSESSMENT</div>
            <div className="text-xs text-foreground/80">
              <span className="font-semibold text-amber-400">{pair.leverageHolder}</span>
              {" — "}{pair.leverageReason.substring(0, 120)}...
            </div>
          </div>
        );
      })()}
    </div>
  );
}
