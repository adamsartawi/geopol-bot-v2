// ============================================================
// WRDI Panel — World Risk & Dynamics Index
// Side panel showing live 4-dimension risk scores per country
// and country-pair differential reports
// ============================================================

import { useState, useMemo } from "react";
import { Streamdown } from "streamdown";
import {
  WRDIScore,
  WRDIPairReport,
  WRDIEvent,
  computeWRDIScore,
  computeWRDIPairReport,
  classificationColor,
  classificationBg,
  generateWeeklyReport,
} from "@/lib/wrdiEngine";
import { MarketData } from "@/lib/chatEngine";
import { COUNTRIES, COUNTRY_PAIRS } from "@/lib/geopoliticalData";
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  BarChart2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface WRDIPanelProps {
  marketData: MarketData[];
  selectedPair: string | null;
  loading: boolean;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreBar({ score, color }: { score: number; color: string }) {
  const pct = (score / 10) * 100;
  const barColor =
    score >= 9 ? "bg-red-500" :
    score >= 7 ? "bg-orange-400" :
    score >= 5 ? "bg-amber-400" :
    score >= 3 ? "bg-green-400" : "bg-emerald-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-mono text-xs font-bold w-6 text-right ${color}`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function TrendIcon({ trend }: { trend: "rising" | "falling" | "stable" }) {
  if (trend === "rising")  return <TrendingUp size={12} className="text-red-400" />;
  if (trend === "falling") return <TrendingDown size={12} className="text-emerald-400" />;
  return <Minus size={12} className="text-muted-foreground" />;
}

function DimensionRow({
  label, weight, score, color, expanded, onToggle
}: {
  label: string;
  weight: string;
  score: number;
  color: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 py-1 hover:bg-white/3 rounded-sm transition-colors"
    >
      <span className="font-mono text-[10px] text-muted-foreground w-4">
        {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      </span>
      <span className="text-xs text-foreground/80 flex-1 text-left">{label}</span>
      <span className="font-mono text-[10px] text-muted-foreground">{weight}</span>
      <span className={`font-mono text-xs font-bold w-7 text-right ${color}`}>
        {score.toFixed(1)}
      </span>
    </button>
  );
}

function CountryScoreCard({ score }: { score: WRDIScore }) {
  const [expandedDim, setExpandedDim] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(false);

  const dims = [
    { key: "political", label: "Political / Diplomatic", weight: "25%", dim: score.political },
    { key: "military",  label: "Military / Security",   weight: "30%", dim: score.military },
    { key: "economic",  label: "Economic",              weight: "25%", dim: score.economic },
    { key: "social",    label: "Social",                weight: "20%", dim: score.social },
  ];

  const country = COUNTRIES.find(c => c.id === score.countryId);

  return (
    <div className={`border rounded-sm p-3 mb-2 ${classificationBg(score.classification)}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{country?.flag}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-foreground">{score.countryName}</span>
              <TrendIcon trend={score.trend} />
            </div>
            <span className={`font-mono text-[10px] tracking-wide ${classificationColor(score.classification)}`}>
              WRDI {score.classification}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono text-xl font-bold ${classificationColor(score.classification)}`}>
            {score.composite.toFixed(1)}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">/10</div>
        </div>
      </div>

      {/* Composite bar */}
      <ScoreBar score={score.composite} color={classificationColor(score.classification)} />

      {/* Dimension breakdown */}
      <div className="mt-2 space-y-0.5">
        {dims.map(({ key, label, weight, dim }) => (
          <div key={key}>
            <DimensionRow
              label={label}
              weight={weight}
              score={dim.score}
              color={dim.color}
              expanded={expandedDim === key}
              onToggle={() => setExpandedDim(expandedDim === key ? null : key)}
            />
            {expandedDim === key && (
              <div className="ml-4 mt-1 mb-1 space-y-1 border-l border-white/10 pl-2">
                {dim.indicators.map((ind, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-muted-foreground">{ind.name}</div>
                      <div className={`text-[10px] font-medium ${
                        ind.signal === "negative" ? "text-red-400" :
                        ind.signal === "positive" ? "text-emerald-400" : "text-foreground/70"
                      }`}>{ind.value}</div>
                    </div>
                    <span className="font-mono text-[9px] text-muted-foreground/60 flex-shrink-0">{ind.source}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent events toggle */}
      {score.weeklyEvents.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowEvents(!showEvents)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-amber-400 transition-colors"
          >
            {showEvents ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            Recent Events ({score.weeklyEvents.length})
          </button>
          {showEvents && (
            <div className="mt-1 space-y-1">
              {score.weeklyEvents.map((ev, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px]">
                  <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    ev.classification === "negative" ? "bg-red-400" :
                    ev.classification === "positive" ? "bg-emerald-400" : "bg-amber-400"
                  }`} />
                  <div>
                    <span className="text-muted-foreground">{ev.date} · </span>
                    <span className="text-foreground/80">{ev.description}</span>
                    <span className="text-muted-foreground/60"> [{ev.source}]</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PairReportCard({ report }: { report: WRDIPairReport }) {
  const c1 = COUNTRIES.find(c => c.id === report.country1);
  const c2 = COUNTRIES.find(c => c.id === report.country2);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-amber-500/20 rounded-sm p-3 mb-2 bg-amber-500/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span>{c1?.flag}</span>
          <span className="font-mono text-xs text-muted-foreground">vs</span>
          <span>{c2?.flag}</span>
          <span className="text-xs font-semibold text-foreground ml-1">
            {c1?.name} / {c2?.name}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-amber-400 transition-colors"
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="text-center">
          <div className={`font-mono text-sm font-bold ${classificationColor(report.country1Score.classification)}`}>
            {report.country1Score.composite.toFixed(1)}
          </div>
          <div className="font-mono text-[9px] text-muted-foreground">{c1?.name.split(" ")[0]}</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-sm font-bold text-cyan-400">
            {report.middleEastImpact}
          </div>
          <div className="font-mono text-[9px] text-muted-foreground">ME Impact</div>
        </div>
        <div className="text-center">
          <div className={`font-mono text-sm font-bold ${classificationColor(report.country2Score.classification)}`}>
            {report.country2Score.composite.toFixed(1)}
          </div>
          <div className="font-mono text-[9px] text-muted-foreground">{c2?.name.split(" ")[0]}</div>
        </div>
      </div>

      {/* Dominant dimension */}
      <div className="flex items-center gap-1.5 mb-1">
        <AlertTriangle size={10} className="text-amber-400" />
        <span className="font-mono text-[10px] text-amber-400">
          Dominant: {report.dominantDimension}
        </span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
          <div>
            <div className="font-mono text-[10px] text-cyan-400 mb-1">ANTICIPATED MOVES</div>
            {report.anticipatedMoves.map((move, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px] text-foreground/80 mb-1">
                <ChevronRight size={9} className="text-amber-400 mt-0.5 flex-shrink-0" />
                {move}
              </div>
            ))}
          </div>
          <div>
            <div className="font-mono text-[10px] text-red-400 mb-1">DANGEROUS SCENARIO</div>
            <div className="text-[10px] text-foreground/80">{report.dangerousScenario}</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-muted-foreground">
              Risk differential: {report.differentialRisk.toFixed(1)} pts
            </span>
            <span className="font-mono text-[9px] text-muted-foreground">
              {report.lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function WRDIPanel({ marketData, selectedPair, loading }: WRDIPanelProps) {
  const [activeView, setActiveView] = useState<"scores" | "pairs" | "report">("scores");
  const [weeklyReport, setWeeklyReport] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Compute all country scores
  const countryScores = useMemo<WRDIScore[]>(() => {
    return COUNTRIES.map(c => {
      try {
        return computeWRDIScore(c.id, marketData);
      } catch {
        return null;
      }
    }).filter(Boolean) as WRDIScore[];
  }, [marketData]);

  // Compute all pair reports
  const pairReports = useMemo<WRDIPairReport[]>(() => {
    return COUNTRY_PAIRS.map(p => {
      try {
        return computeWRDIPairReport(
          p.id, p.country1, p.country2, marketData, p.middleEastImpactScore
        );
      } catch {
        return null;
      }
    }).filter(Boolean) as WRDIPairReport[];
  }, [marketData]);

  // Sort: selected pair first, then by ME impact
  const sortedPairReports = useMemo(() => {
    return [...pairReports].sort((a, b) => {
      if (a.pairId === selectedPair) return -1;
      if (b.pairId === selectedPair) return 1;
      return b.middleEastImpact - a.middleEastImpact;
    });
  }, [pairReports, selectedPair]);

  // Sort countries by composite score descending
  const sortedScores = useMemo(() =>
    [...countryScores].sort((a, b) => b.composite - a.composite),
    [countryScores]
  );

  const handleGenerateReport = () => {
    setGeneratingReport(true);
    setTimeout(() => {
      const report = generateWeeklyReport(countryScores, marketData);
      setWeeklyReport(report);
      setGeneratingReport(false);
    }, 300);
  };

  // Global average
  const globalAvg = countryScores.length > 0
    ? countryScores.reduce((s, c) => s + c.composite, 0) / countryScores.length
    : 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Panel header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <BarChart2 size={12} className="text-amber-400" />
            <span className="font-mono text-xs text-amber-400 tracking-wide font-bold">W.R.D.I</span>
            <span className="font-mono text-[10px] text-muted-foreground">WORLD RISK INDEX</span>
          </div>
          {loading && <RefreshCw size={10} className="text-muted-foreground animate-spin" />}
        </div>

        {/* Global average */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                globalAvg >= 7 ? "bg-red-500" : globalAvg >= 5 ? "bg-amber-400" : "bg-emerald-400"
              }`}
              style={{ width: `${(globalAvg / 10) * 100}%` }}
            />
          </div>
          <span className={`font-mono text-xs font-bold ${
            globalAvg >= 7 ? "text-red-400" : globalAvg >= 5 ? "text-amber-400" : "text-emerald-400"
          }`}>
            {globalAvg.toFixed(1)}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">GLOBAL AVG</span>
        </div>

        {/* View tabs */}
        <div className="flex gap-1">
          {[
            { id: "scores", label: "SCORES" },
            { id: "pairs",  label: "PAIRS"  },
            { id: "report", label: "REPORT" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveView(id as typeof activeView)}
              className={`flex-1 py-1 font-mono text-[10px] rounded-sm transition-all ${
                activeView === id
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-2">

        {/* ── SCORES view ── */}
        {activeView === "scores" && (
          <div>
            <div className="font-mono text-[10px] text-muted-foreground mb-2 px-1">
              WRDI = (Pol×0.25) + (Mil×0.30) + (Econ×0.25) + (Soc×0.20)
            </div>
            {sortedScores.map(score => (
              <CountryScoreCard key={score.countryId} score={score} />
            ))}
          </div>
        )}

        {/* ── PAIRS view ── */}
        {activeView === "pairs" && (
          <div>
            <div className="font-mono text-[10px] text-muted-foreground mb-2 px-1">
              Sorted by Middle East impact · Click to expand
            </div>
            {sortedPairReports.map(report => (
              <PairReportCard key={report.pairId} report={report} />
            ))}
          </div>
        )}

        {/* ── REPORT view ── */}
        {activeView === "report" && (
          <div>
            {!weeklyReport ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <FileText size={32} className="text-muted-foreground/40" />
                <div className="text-center">
                  <div className="text-sm text-foreground/70 mb-1">Weekly Intelligence Report</div>
                  <div className="font-mono text-[10px] text-muted-foreground mb-3">
                    WRDI composite analysis across all 6 actors
                  </div>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport || loading}
                    className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-sm text-amber-400 font-mono text-xs hover:bg-amber-500/20 transition-all disabled:opacity-40"
                  >
                    {generatingReport ? "GENERATING..." : "GENERATE REPORT"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="font-mono text-[10px] text-amber-400">WEEKLY REPORT</span>
                  <button
                    onClick={() => setWeeklyReport(null)}
                    className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    REGENERATE
                  </button>
                </div>
                <div className="prose prose-invert prose-xs max-w-none
                  prose-headings:text-amber-400 prose-headings:font-mono prose-headings:text-xs prose-headings:font-bold
                  prose-h2:border-b prose-h2:border-amber-500/20 prose-h2:pb-1 prose-h2:mb-2
                  prose-h3:text-cyan-400 prose-h3:text-[11px]
                  prose-p:text-foreground/80 prose-p:text-[11px] prose-p:leading-relaxed
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-li:text-foreground/75 prose-li:text-[11px]
                  prose-table:text-[10px] prose-th:text-amber-400 prose-th:font-mono
                  prose-td:text-foreground/80 prose-td:border-white/10
                  prose-code:text-cyan-400 prose-code:text-[10px]">
                  <Streamdown>{weeklyReport}</Streamdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
