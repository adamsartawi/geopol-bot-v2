// Intelligence Terminal — Middle East Scenario Panel
import { MiddleEastScenario } from "@/lib/geopoliticalData";
import { AlertTriangle, Zap, Shield } from "lucide-react";

interface ScenarioPanelProps {
  scenarios: MiddleEastScenario[];
  onScenarioSelect: (scenario: MiddleEastScenario) => void;
}

const RISK_CONFIG = {
  Critical: { color: "#EF4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", icon: AlertTriangle },
  High: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: Zap },
  Medium: { color: "#F59E0B", bg: "rgba(245,158,11,0.05)", border: "rgba(245,158,11,0.2)", icon: Shield },
  Low: { color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", icon: Shield },
};

const PROB_CONFIG = {
  High: { color: "#EF4444", label: "HIGH PROB" },
  Medium: { color: "#F59E0B", label: "MED PROB" },
  Low: { color: "#64748B", label: "LOW PROB" },
};

export default function ScenarioPanel({ scenarios, onScenarioSelect }: ScenarioPanelProps) {
  return (
    <div className="p-3">
      <div className="font-mono text-xs tracking-wide text-muted-foreground text-xs mb-3 tracking-widest">MIDDLE EAST RISK SCENARIOS</div>

      {/* Middle East map */}
      <div className="mb-3 rounded-sm overflow-hidden">
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663242656098/TUUWwTL3ccHREs8KDzAWzE/geopol-middle-east-map-Snr7qSSsXMqTsCyw8qRiQu.webp"
          alt="Middle East Intelligence Map"
          className="w-full h-32 object-cover opacity-80"
        />
      </div>

      <div className="space-y-2">
        {scenarios.map((scenario) => {
          const riskConfig = RISK_CONFIG[scenario.riskLevel];
          const probConfig = PROB_CONFIG[scenario.probability];
          const Icon = riskConfig.icon;

          return (
            <button
              key={scenario.id}
              onClick={() => onScenarioSelect(scenario)}
              className="w-full text-left p-2.5 rounded-sm border transition-all duration-200 hover:opacity-90"
              style={{
                backgroundColor: riskConfig.bg,
                borderColor: riskConfig.border,
              }}
            >
              <div className="flex items-start gap-2 mb-1.5">
                <Icon size={12} style={{ color: riskConfig.color }} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground leading-tight">{scenario.title}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="font-mono text-xs tracking-wide text-xs px-1.5 py-0.5 rounded-sm"
                  style={{ color: riskConfig.color, backgroundColor: `${riskConfig.color}20`, border: `1px solid ${riskConfig.border}` }}
                >
                  {scenario.riskLevel.toUpperCase()}
                </span>
                <span
                  className="font-mono text-xs tracking-wide text-xs px-1.5 py-0.5 rounded-sm"
                  style={{ color: probConfig.color, backgroundColor: `${probConfig.color}15`, border: `1px solid ${probConfig.color}30` }}
                >
                  {probConfig.label}
                </span>
              </div>

              <p className="font-mono text-xs tracking-wide text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {scenario.trigger}
              </p>

              {/* Market signals preview */}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {scenario.marketSignals.slice(0, 2).map((signal, i) => (
                  <span key={i} className="font-mono text-xs tracking-wide text-xs text-cyan-400/70 bg-cyan-500/5 border border-cyan-500/20 px-1.5 py-0.5 rounded-sm">
                    {signal.length > 25 ? signal.substring(0, 25) + "..." : signal}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Affected countries legend */}
      <div className="mt-3 p-2 bg-secondary/20 rounded-sm">
        <div className="font-mono text-xs tracking-wide text-muted-foreground text-xs mb-1.5">IMPACT ASSESSMENT FOCUS</div>
        <p className="text-xs text-foreground/70 leading-relaxed">
          All scenarios are assessed through the lens of their impact on the Middle East — energy markets, regional stability, and the balance of power between Iran, Israel, Gulf states, and external actors.
        </p>
      </div>
    </div>
  );
}
