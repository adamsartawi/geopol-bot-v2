// ============================================================
// GEOPOL-INT — Glossary Page
// Searchable reference for all terms, indicators, and UI elements
// ============================================================

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, ArrowLeft, BookOpen, BarChart2, Globe, Layers } from "lucide-react";

// ── Types ────────────────────────────────────────────────────
interface GlossaryEntry {
  term: string;
  definition: string;
  section: "wrdi" | "ui" | "geopolitical";
  tags?: string[];
}

// ── Glossary Data ─────────────────────────────────────────────
const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  // ── WRDI Indicators ──────────────────────────────────────
  {
    term: "WRDI — World Risk Differential Index",
    definition:
      "A composite score from 1 to 10 measuring a country's overall geopolitical risk across four weighted dimensions: Political/Diplomatic (25%), Military/Security (30%), Economic/Financial (25%), and Social/Humanitarian (20%). Higher scores indicate greater instability and risk.",
    section: "wrdi",
    tags: ["score", "composite", "index"],
  },
  {
    term: "Political / Diplomatic Dimension (25%)",
    definition:
      "Measures the stability of a country's governance, diplomatic relations, and international standing. Factors include regime stability, alliance cohesion, diplomatic incidents, sanctions exposure, and treaty compliance. Weight: 25% of the WRDI composite score.",
    section: "wrdi",
    tags: ["political", "diplomatic", "governance"],
  },
  {
    term: "Military / Security Dimension (30%)",
    definition:
      "The highest-weighted WRDI dimension. Measures active conflict intensity, military mobilization, arms procurement, border tensions, and involvement in regional security crises. Armed conflict events from ACLED are the primary data source for this dimension. Weight: 30% of the WRDI composite score.",
    section: "wrdi",
    tags: ["military", "security", "conflict", "ACLED"],
  },
  {
    term: "Economic / Financial Dimension (25%)",
    definition:
      "Measures economic vulnerability through live market data: equity index performance, currency depreciation, commodity exposure (oil, gold), trade disruption risk, and sanctions impact. Live Yahoo Finance data feeds directly into this dimension. Weight: 25% of the WRDI composite score.",
    section: "wrdi",
    tags: ["economic", "financial", "markets", "sanctions"],
  },
  {
    term: "Social / Humanitarian Dimension (20%)",
    definition:
      "Measures internal social stability: displacement levels (UNHCR data), civil unrest indicators, population vulnerability, and humanitarian crisis severity. Weight: 20% of the WRDI composite score.",
    section: "wrdi",
    tags: ["social", "humanitarian", "UNHCR", "displacement"],
  },
  {
    term: "WRDI Score Bands",
    definition:
      "Classification of composite WRDI scores into five risk levels: VERY LOW (1.0–2.9) — stable, minimal risk; LOW (3.0–4.4) — manageable tensions; MEDIUM (4.5–5.9) — elevated risk requiring monitoring; HIGH (6.0–7.4) — significant instability with active risk factors; CRITICAL (7.5–10.0) — severe instability, active conflict or crisis.",
    section: "wrdi",
    tags: ["score", "bands", "classification", "risk level"],
  },
  {
    term: "WRDI Differential",
    definition:
      "The difference between two countries' WRDI scores in a bilateral pair analysis. A high differential (e.g., Russia 7.4 vs. Canada 3.1 = differential of 4.3) indicates asymmetric risk and potential for destabilizing interaction. The dominant dimension driving the differential is highlighted in the PAIRS tab.",
    section: "wrdi",
    tags: ["differential", "pairs", "bilateral"],
  },
  {
    term: "WRDI Formula",
    definition:
      "WRDI = (Political × 0.25) + (Military × 0.30) + (Economic × 0.25) + (Social × 0.20). Each dimension is scored 1–10 based on live data inputs. The composite score is recalculated every time the intelligence pipeline runs (every 6 hours).",
    section: "wrdi",
    tags: ["formula", "calculation", "weights"],
  },
  {
    term: "Global Average WRDI",
    definition:
      "The mean WRDI score across all monitored countries, displayed at the top of the WRDI panel. Provides a baseline for comparing individual country risk levels. A rising global average indicates increasing systemic geopolitical stress.",
    section: "wrdi",
    tags: ["average", "global", "baseline"],
  },

  // ── UI Elements ───────────────────────────────────────────
  {
    term: "MATRIX Tab",
    definition:
      "Displays the bilateral relationship matrix for all monitored country pairs. Each cell shows a Tension Score (0–100) and a Cooperation Score (0–100) for the relationship between two countries, along with a Middle East Impact Score indicating how much the relationship affects regional stability.",
    section: "ui",
    tags: ["matrix", "bilateral", "tension", "cooperation"],
  },
  {
    term: "MARKETS Tab",
    definition:
      "Shows live market data for all monitored countries: equity index performance, currency exchange rates, and key commodity prices (WTI Crude, Brent, Gold, Natural Gas). Data is sourced from Yahoo Finance and refreshed every 5 minutes.",
    section: "ui",
    tags: ["markets", "live data", "Yahoo Finance", "commodities"],
  },
  {
    term: "RISKS Tab",
    definition:
      "Displays the eight Middle East risk scenarios ranked by probability and severity. Each scenario includes a risk level (LOW / MEDIUM / HIGH / CRITICAL), estimated probability, potential market impact, and the key trigger conditions that would activate it.",
    section: "ui",
    tags: ["risks", "scenarios", "Middle East", "probability"],
  },
  {
    term: "PIPELINE Tab",
    definition:
      "Shows the real-time intelligence pipeline log: every event ingested from GDELT, ACLED, UNHCR, World Bank, IMF, and EIA is displayed here with its source, classification, affected country/dimension, severity score, and the KB fields it updated. The pipeline runs automatically every 6 hours.",
    section: "ui",
    tags: ["pipeline", "GDELT", "ACLED", "log", "automation"],
  },
  {
    term: "WRDI Panel — SCORES Tab",
    definition:
      "Shows the current WRDI composite score for each monitored country, broken down by the four dimensions. Scores are driven by live market data and the latest pipeline events. Click the arrow next to any country to expand its dimension breakdown and recent events.",
    section: "ui",
    tags: ["scores", "WRDI", "country", "breakdown"],
  },
  {
    term: "WRDI Panel — PAIRS Tab",
    definition:
      "Ranks all bilateral country pairs by their Middle East impact score. Each pair shows both countries' WRDI scores, the differential, and the dominant dimension driving tension between them. Pairs are sorted by their potential to destabilize the Middle East region.",
    section: "ui",
    tags: ["pairs", "bilateral", "differential", "Middle East"],
  },
  {
    term: "WRDI Panel — REPORT Tab",
    definition:
      "Generates a structured weekly intelligence report summarizing the top-risk countries, most volatile pairs, key market movements, and recommended monitoring priorities. The report is generated on demand using the current WRDI scores and live market data.",
    section: "ui",
    tags: ["report", "weekly", "intelligence", "summary"],
  },
  {
    term: "Country Sidebar",
    definition:
      "The left panel showing all monitored countries with their national flags, live equity index performance (percentage change), and a color-coded risk indicator dot. Click any country to pre-load it as context for your next question to GEOPOL-INT.",
    section: "ui",
    tags: ["sidebar", "countries", "flags", "live data"],
  },
  {
    term: "Market Ticker Bar",
    definition:
      "The scrolling bar at the top of the screen showing live prices for key global indicators: S&P 500, NASDAQ, Shanghai Composite, DAX, FTSE 100, WTI Crude, Gold, and Natural Gas. Updated every 5 minutes from Yahoo Finance.",
    section: "ui",
    tags: ["ticker", "live", "markets", "prices"],
  },
  {
    term: "Intelligence Channel",
    definition:
      "The central chat interface where you interact with GEOPOL-INT. The bot uses the full knowledge base (country profiles, WRDI scores, bilateral pairs, live market data, and real-time news) to answer geopolitical analysis questions. Supports Arabic and English.",
    section: "ui",
    tags: ["chat", "AI", "analysis", "interface"],
  },
  {
    term: "Fact-Check Indicator",
    definition:
      "A status indicator that appears in the chat header when you ask about a recent event. The system automatically searches GDELT for corroborating news articles before answering. Green = verified and KB updated; Red = contradicted by sources; Cyan = articles found but below verification threshold; Grey = no articles found.",
    section: "ui",
    tags: ["fact-check", "GDELT", "verification", "status"],
  },

  // ── Geopolitical Terms ────────────────────────────────────
  {
    term: "Tension Score",
    definition:
      "A 0–100 score measuring the level of adversarial friction between two countries in a bilateral relationship. Factors include military incidents, diplomatic expulsions, sanctions, territorial disputes, and proxy conflicts. 0 = no tension; 100 = active armed conflict.",
    section: "geopolitical",
    tags: ["tension", "bilateral", "score"],
  },
  {
    term: "Cooperation Score",
    definition:
      "A 0–100 score measuring the level of collaborative engagement between two countries. Factors include trade volume, treaty participation, intelligence sharing, joint military exercises, and diplomatic alignment. 0 = no cooperation; 100 = full strategic alliance.",
    section: "geopolitical",
    tags: ["cooperation", "bilateral", "alliance"],
  },
  {
    term: "Middle East Impact Score",
    definition:
      "A 0–100 score measuring how much a bilateral relationship or country's instability affects the Middle East region specifically. Used to rank country pairs by their regional relevance. High scores indicate that changes in that relationship directly affect oil prices, regional security, or the Israel-Palestine dynamic.",
    section: "geopolitical",
    tags: ["Middle East", "impact", "regional"],
  },
  {
    term: "Iran-Aligned Forces",
    definition:
      "Armed factions and political movements that maintain strategic, ideological, or operational alignment with Iran's foreign policy objectives. Includes Hezbollah (Lebanon), Houthi forces (Yemen), and various Iraqi armed factions. These groups are distinct from the Iranian state but coordinate on shared regional objectives. This system uses neutral terminology — 'Iran-aligned forces' rather than 'proxies' — to reflect their independent agency.",
    section: "geopolitical",
    tags: ["Iran", "aligned forces", "Hezbollah", "Houthi", "neutral language"],
  },
  {
    term: "Strait of Hormuz",
    definition:
      "A critical maritime chokepoint between Iran and Oman through which approximately 20% of global oil supply passes. Closure or disruption of the Strait is a key risk scenario monitored by this system. Iranian threats to close the Strait are a recurring pressure tactic in nuclear and sanctions negotiations.",
    section: "geopolitical",
    tags: ["Hormuz", "chokepoint", "oil", "Iran", "maritime"],
  },
  {
    term: "Nuclear Breakout",
    definition:
      "The scenario in which Iran accumulates sufficient highly-enriched uranium to construct a nuclear weapon before international intervention can prevent it. Estimated breakout time is a key metric in US-Israel-Iran strategic calculations. This system tracks this as a HIGH-probability critical risk scenario.",
    section: "geopolitical",
    tags: ["nuclear", "Iran", "breakout", "enrichment"],
  },
  {
    term: "Abraham Accords",
    definition:
      "Normalization agreements signed in 2020 between Israel and the UAE, Bahrain, Sudan, and Morocco, brokered by the United States. The Accords represent a strategic realignment of Gulf Arab states toward Israel against a shared concern about Iranian regional influence. Saudi-Israel normalization remains a key pending development.",
    section: "geopolitical",
    tags: ["Abraham Accords", "normalization", "Israel", "Gulf", "UAE"],
  },
  {
    term: "GDELT Project",
    definition:
      "The Global Database of Events, Language, and Tone — a real-time open-data platform that monitors global news in 100+ languages and codes geopolitical events. GEOPOL-INT uses GDELT as its primary real-time news source for event classification and fact-checking user claims.",
    section: "geopolitical",
    tags: ["GDELT", "data source", "news", "events"],
  },
  {
    term: "ACLED",
    definition:
      "The Armed Conflict Location and Event Data project — a disaggregated data collection, analysis, and crisis mapping project. GEOPOL-INT uses ACLED's API to ingest real-time armed conflict events, which feed directly into the Military/Security dimension of WRDI scores.",
    section: "geopolitical",
    tags: ["ACLED", "conflict", "data source", "military"],
  },
  {
    term: "Intelligence Pipeline",
    definition:
      "The automated data ingestion and analysis system that runs every 6 hours. It fetches events from GDELT, ACLED, UNHCR, World Bank, IMF, and EIA; classifies each event by country, dimension, and severity using an LLM; updates the knowledge base fields; and recalculates WRDI scores. All changes are logged in the PIPELINE tab.",
    section: "geopolitical",
    tags: ["pipeline", "automation", "data ingestion", "LLM"],
  },
  {
    term: "Knowledge Base (KB)",
    definition:
      "The structured database of country profiles, bilateral pair analyses, and Middle East scenarios that GEOPOL-INT uses to answer questions. The KB is updated automatically by the intelligence pipeline every 6 hours and can also be updated in real time when a user's claim is verified by the fact-check system.",
    section: "geopolitical",
    tags: ["knowledge base", "KB", "database", "profiles"],
  },
];

// ── Section Config ─────────────────────────────────────────────
const SECTIONS = [
  {
    id: "all",
    label: "All Terms",
    icon: BookOpen,
    color: "text-cyan-400",
    count: GLOSSARY_ENTRIES.length,
  },
  {
    id: "wrdi",
    label: "WRDI Indicators",
    icon: BarChart2,
    color: "text-amber-400",
    count: GLOSSARY_ENTRIES.filter((e) => e.section === "wrdi").length,
  },
  {
    id: "ui",
    label: "UI Elements",
    icon: Layers,
    color: "text-emerald-400",
    count: GLOSSARY_ENTRIES.filter((e) => e.section === "ui").length,
  },
  {
    id: "geopolitical",
    label: "Geopolitical Terms",
    icon: Globe,
    color: "text-violet-400",
    count: GLOSSARY_ENTRIES.filter((e) => e.section === "geopolitical").length,
  },
];

const SECTION_COLORS: Record<string, string> = {
  wrdi: "border-amber-500/40 bg-amber-500/5",
  ui: "border-emerald-500/40 bg-emerald-500/5",
  geopolitical: "border-violet-500/40 bg-violet-500/5",
};

const SECTION_BADGE: Record<string, string> = {
  wrdi: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  ui: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  geopolitical: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
};

const SECTION_LABEL: Record<string, string> = {
  wrdi: "WRDI",
  ui: "UI",
  geopolitical: "GEOPOLITICAL",
};

// ── Component ─────────────────────────────────────────────────
export default function Glossary() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string>("all");
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return GLOSSARY_ENTRIES.filter((entry) => {
      const matchesSection =
        activeSection === "all" || entry.section === activeSection;
      const matchesQuery =
        !q ||
        entry.term.toLowerCase().includes(q) ||
        entry.definition.toLowerCase().includes(q) ||
        entry.tags?.some((t) => t.toLowerCase().includes(q));
      return matchesSection && matchesQuery;
    });
  }, [query, activeSection]);

  return (
    <div className="min-h-screen bg-[#0a0c0f] text-gray-100 font-mono">
      {/* ── Header ── */}
      <div className="border-b border-gray-800 bg-[#0d1117]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO INTELLIGENCE CHANNEL</span>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-cyan-400">
            <BookOpen className="w-5 h-5" />
            <span className="text-sm font-bold tracking-widest">GLOSSARY</span>
          </div>
        </div>
      </div>

      {/* ── Title ── */}
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
          GEOPOL-INT Reference Glossary
        </h1>
        <p className="text-gray-400 text-sm">
          Definitions for all indicators, interface elements, and geopolitical
          terminology used in this system.
        </p>
      </div>

      {/* ── Search + Filter ── */}
      <div className="max-w-5xl mx-auto px-6 pb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search terms, definitions, or tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#0d1117] border border-gray-700 rounded pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Section Filter */}
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all border ${
                  active
                    ? `${s.color} border-current bg-current/10`
                    : "text-gray-500 border-gray-700 hover:text-gray-300 hover:border-gray-600"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                    active ? "bg-current/20" : "bg-gray-800"
                  }`}
                >
                  {s.id === "all"
                    ? filtered.length
                    : GLOSSARY_ENTRIES.filter((e) => e.section === s.id).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Result count */}
        <p className="text-xs text-gray-600">
          {filtered.length === 0
            ? "No terms found."
            : `${filtered.length} term${filtered.length !== 1 ? "s" : ""} found`}
          {query && ` for "${query}"`}
        </p>
      </div>

      {/* ── Entries ── */}
      <div className="max-w-5xl mx-auto px-6 pb-16 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No matching terms found.</p>
            <button
              onClick={() => {
                setQuery("");
                setActiveSection("all");
              }}
              className="mt-3 text-xs text-cyan-500 hover:text-cyan-400"
            >
              Clear filters
            </button>
          </div>
        )}

        {filtered.map((entry) => {
          const isExpanded = expandedTerm === entry.term;
          return (
            <div
              key={entry.term}
              className={`border rounded-lg overflow-hidden transition-all cursor-pointer ${SECTION_COLORS[entry.section]}`}
              onClick={() =>
                setExpandedTerm(isExpanded ? null : entry.term)
              }
            >
              <div className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">
                      {entry.term}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium tracking-wider ${SECTION_BADGE[entry.section]}`}
                    >
                      {SECTION_LABEL[entry.section]}
                    </span>
                  </div>
                  {!isExpanded && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {entry.definition}
                    </p>
                  )}
                </div>
                <span className="text-gray-600 text-xs mt-0.5 shrink-0">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {entry.definition}
                  </p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuery(tag);
                            setActiveSection("all");
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors border border-gray-700"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
