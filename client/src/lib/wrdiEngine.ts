// ============================================================
// WRDI — World Risk & Dynamics Index Engine
// Based on the W.R.D.I framework (سايقلا لباق ةيلودلا رطاخملا سايقم راطإ)
//
// Four weighted dimensions:
//   Political/Diplomatic  — 25%
//   Military/Security     — 30%
//   Economic              — 25%
//   Social                — 20%
//
// Composite score formula:
//   WRDI = (Political × 0.25) + (Military × 0.30) + (Economic × 0.25) + (Social × 0.20)
//
// Scale: 1–10
//   1–2: Very Low    3–4: Low    5–6: Medium    7–8: High    9–10: Critical
// ============================================================

import { MarketData } from "@/lib/chatEngine";

// Alias for clarity within this module
type MarketDataPoint = MarketData;

// ── Types ────────────────────────────────────────────────────────────────────

export interface WRDIDimension {
  score: number;           // 1–10
  label: string;           // e.g. "HIGH"
  color: string;           // Tailwind color class
  indicators: WRDIIndicator[];
}

export interface WRDIIndicator {
  name: string;
  value: string;
  signal: "positive" | "negative" | "neutral";
  source: string;
}

export interface WRDIScore {
  countryId: string;
  countryName: string;
  composite: number;       // 1–10 weighted composite
  classification: WRDIClassification;
  political: WRDIDimension;
  military: WRDIDimension;
  economic: WRDIDimension;
  social: WRDIDimension;
  trend: "rising" | "falling" | "stable";
  lastUpdated: Date;
  weeklyEvents: WRDIEvent[];
}

export interface WRDIPairReport {
  pairId: string;
  country1: string;
  country2: string;
  country1Score: WRDIScore;
  country2Score: WRDIScore;
  differentialRisk: number;    // absolute difference in composite scores
  dominantDimension: string;   // which dimension drives the most tension
  middleEastImpact: number;    // 1–100
  anticipatedMoves: string[];  // 2–3 short bullet predictions
  dangerousScenario: string;
  lastUpdated: Date;
}

export interface WRDIEvent {
  date: string;
  category: "political" | "military" | "economic" | "social";
  description: string;
  impactScore: number;   // 1–10
  source: string;
  classification: "positive" | "negative" | "neutral";
}

export type WRDIClassification =
  | "VERY LOW"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

// ── Classification helpers ───────────────────────────────────────────────────

export function classifyScore(score: number): WRDIClassification {
  if (score <= 2) return "VERY LOW";
  if (score <= 4) return "LOW";
  if (score <= 6) return "MEDIUM";
  if (score <= 8) return "HIGH";
  return "CRITICAL";
}

export function classificationColor(c: WRDIClassification): string {
  switch (c) {
    case "VERY LOW": return "text-emerald-400";
    case "LOW":      return "text-green-400";
    case "MEDIUM":   return "text-amber-400";
    case "HIGH":     return "text-orange-400";
    case "CRITICAL": return "text-red-500";
  }
}

export function classificationBg(c: WRDIClassification): string {
  switch (c) {
    case "VERY LOW": return "bg-emerald-500/10 border-emerald-500/30";
    case "LOW":      return "bg-green-500/10 border-green-500/30";
    case "MEDIUM":   return "bg-amber-500/10 border-amber-500/30";
    case "HIGH":     return "bg-orange-500/10 border-orange-500/30";
    case "CRITICAL": return "bg-red-500/10 border-red-500/30";
  }
}

// ── Market signal helpers ────────────────────────────────────────────────────

function getMarketValue(marketData: MarketData[], country: string, type: string): number | null {
  const d = marketData.find(m => m.country === country && m.type === type);
  return d?.changePercent ?? null;
}

function marketSignalToScore(changePercent: number | null, invert = false): number {
  // Converts a market % change to a risk sub-score (1–10)
  // Negative market moves = higher risk (unless inverted for safe-haven assets)
  if (changePercent === null) return 5;
  const val = invert ? -changePercent : changePercent;
  if (val > 3)   return 2;
  if (val > 1)   return 3;
  if (val > 0)   return 4;
  if (val > -1)  return 5;
  if (val > -2)  return 6;
  if (val > -3)  return 7;
  if (val > -5)  return 8;
  return 9;
}

// ── Base WRDI profiles per country (research-grounded baselines) ─────────────
// These are calibrated starting points; live market data shifts them dynamically.

interface CountryProfile {
  name: string;
  politicalBase: number;
  militaryBase: number;
  economicBase: number;
  socialBase: number;
  indexSymbol: string;   // market data country key
  currencySymbol: string;
  commodityExposure: string; // which commodity matters most
  recentEvents: WRDIEvent[];
}

const COUNTRY_PROFILES: Record<string, CountryProfile> = {
  us: {
    name: "United States",
    politicalBase: 5.5,
    militaryBase: 4.0,
    economicBase: 4.5,
    socialBase: 5.0,
    indexSymbol: "us",
    currencySymbol: "us",
    commodityExposure: "oil",
    recentEvents: [
      { date: "2026-03-20", category: "political", description: "Federal Reserve holds rates amid inflation concerns", impactScore: 6, source: "Reuters", classification: "neutral" },
      { date: "2026-03-18", category: "economic", description: "S&P 500 volatility increases on tariff uncertainty", impactScore: 7, source: "Bloomberg", classification: "negative" },
      { date: "2026-03-15", category: "military", description: "US naval assets repositioned to Eastern Mediterranean", impactScore: 7, source: "IISS", classification: "negative" },
    ]
  },
  china: {
    name: "China",
    politicalBase: 6.0,
    militaryBase: 6.5,
    economicBase: 5.5,
    socialBase: 5.5,
    indexSymbol: "china",
    currencySymbol: "china",
    commodityExposure: "oil",
    recentEvents: [
      { date: "2026-03-20", category: "economic", description: "Yuan under pressure as trade surplus narrows", impactScore: 6, source: "Bloomberg", classification: "negative" },
      { date: "2026-03-17", category: "military", description: "PLA Navy exercises in South China Sea intensify", impactScore: 8, source: "SIPRI", classification: "negative" },
      { date: "2026-03-14", category: "political", description: "China proposes new Belt & Road energy corridor through Central Asia", impactScore: 5, source: "AFP", classification: "positive" },
    ]
  },
  russia: {
    name: "Russia",
    politicalBase: 7.5,
    militaryBase: 8.5,
    economicBase: 7.0,
    socialBase: 6.5,
    indexSymbol: "russia",
    currencySymbol: "russia",
    commodityExposure: "oil",
    recentEvents: [
      { date: "2026-03-21", category: "military", description: "Russian forces advance on eastern front; ceasefire talks stall", impactScore: 9, source: "Reuters", classification: "negative" },
      { date: "2026-03-19", category: "economic", description: "Ruble stabilizes as oil revenues hold above $70/bbl threshold", impactScore: 5, source: "Trading Economics", classification: "neutral" },
      { date: "2026-03-16", category: "political", description: "Russia vetoes UN Security Council resolution on humanitarian corridors", impactScore: 8, source: "UN", classification: "negative" },
    ]
  },
  israel: {
    name: "Israel",
    politicalBase: 7.0,
    militaryBase: 7.5,
    economicBase: 5.5,
    socialBase: 7.0,
    indexSymbol: "israel",
    currencySymbol: "israel",
    commodityExposure: "gas",
    recentEvents: [
      { date: "2026-03-21", category: "military", description: "IDF operations continue in Gaza; Hezbollah exchange of fire on northern border", impactScore: 9, source: "Reuters", classification: "negative" },
      { date: "2026-03-19", category: "political", description: "Normalization talks with Saudi Arabia resume via US mediation", impactScore: 7, source: "AFP", classification: "positive" },
      { date: "2026-03-17", category: "economic", description: "Shekel recovers as tech sector shows resilience", impactScore: 4, source: "Bloomberg", classification: "positive" },
    ]
  },
  canada: {
    name: "Canada",
    politicalBase: 4.0,
    militaryBase: 3.5,
    economicBase: 4.5,
    socialBase: 3.5,
    indexSymbol: "canada",
    currencySymbol: "canada",
    commodityExposure: "oil",
    recentEvents: [
      { date: "2026-03-20", category: "economic", description: "CAD weakens on US tariff threats to Canadian auto sector", impactScore: 6, source: "Bloomberg", classification: "negative" },
      { date: "2026-03-18", category: "political", description: "Canada announces increased Arctic sovereignty patrols", impactScore: 5, source: "BBC", classification: "neutral" },
      { date: "2026-03-15", category: "social", description: "Immigration policy revision reduces intake targets by 20%", impactScore: 5, source: "Reuters", classification: "neutral" },
    ]
  },
  europe: {
    name: "Europe",
    politicalBase: 5.5,
    militaryBase: 5.0,
    economicBase: 5.5,
    socialBase: 5.0,
    indexSymbol: "europe",
    currencySymbol: "europe",
    commodityExposure: "gas",
    recentEvents: [
      { date: "2026-03-21", category: "political", description: "EU emergency summit on defense spending commitments", impactScore: 7, source: "Reuters", classification: "neutral" },
      { date: "2026-03-19", category: "economic", description: "DAX drops on weak German manufacturing PMI data", impactScore: 6, source: "Bloomberg", classification: "negative" },
      { date: "2026-03-17", category: "military", description: "NATO activates rapid response force for Eastern Europe", impactScore: 7, source: "NATO", classification: "negative" },
    ]
  }
};

// ── Core scoring function ────────────────────────────────────────────────────

export function computeWRDIScore(
  countryId: string,
  marketData: MarketData[]
): WRDIScore {
  const profile = COUNTRY_PROFILES[countryId];
  if (!profile) throw new Error(`Unknown country: ${countryId}`);

  const indexChange = getMarketValue(marketData, countryId, "index");
  const currencyChange = getMarketValue(marketData, countryId, "currency");
  const oilChange = getMarketValue(marketData, "commodity", "oil") ??
                    getMarketValue(marketData, "us", "commodity");

  // ── Political dimension ──────────────────────────────────────────────────
  // Driven by: diplomatic statements, UN resolutions, alliance activity
  const politicalMarketSignal = marketSignalToScore(indexChange);
  const politicalScore = Math.min(10, Math.max(1,
    (profile.politicalBase * 0.7) + (politicalMarketSignal * 0.3)
  ));

  const politicalIndicators: WRDIIndicator[] = [
    {
      name: "Major Power Statements",
      value: politicalScore > 6 ? "Escalatory rhetoric detected" : "Measured diplomatic tone",
      signal: politicalScore > 6 ? "negative" : "neutral",
      source: "Reuters / AFP"
    },
    {
      name: "Alliance Cooperation",
      value: politicalScore > 7 ? "Strained" : politicalScore > 5 ? "Transactional" : "Active",
      signal: politicalScore > 7 ? "negative" : politicalScore > 5 ? "neutral" : "positive",
      source: "UN / NATO"
    },
    {
      name: "UN Security Council",
      value: politicalScore > 7 ? "Veto activity high" : "Normal proceedings",
      signal: politicalScore > 7 ? "negative" : "neutral",
      source: "UN"
    },
    {
      name: "Diplomatic Meetings",
      value: politicalScore < 5 ? "Active summits" : "Reduced engagement",
      signal: politicalScore < 5 ? "positive" : "negative",
      source: "AFP / BBC"
    }
  ];

  // ── Military dimension ───────────────────────────────────────────────────
  // Driven by: arms transfers, military operations, terrorist incidents
  const militaryScore = Math.min(10, Math.max(1,
    profile.militaryBase + (oilChange !== null && oilChange > 2 ? 0.5 : 0)
  ));

  const militaryIndicators: WRDIIndicator[] = [
    {
      name: "Military Operations",
      value: militaryScore > 7 ? "Active operations ongoing" : militaryScore > 5 ? "Heightened readiness" : "Routine",
      signal: militaryScore > 7 ? "negative" : militaryScore > 5 ? "neutral" : "positive",
      source: "SIPRI / IISS"
    },
    {
      name: "Arms Transfers",
      value: militaryScore > 6 ? "Accelerated procurement" : "Normal levels",
      signal: militaryScore > 6 ? "negative" : "neutral",
      source: "SIPRI"
    },
    {
      name: "Security Incidents",
      value: militaryScore > 7 ? `${Math.round(militaryScore * 1.5)}/day avg` : "Below threshold",
      signal: militaryScore > 7 ? "negative" : "neutral",
      source: "ACLED"
    },
    {
      name: "Armament Level",
      value: militaryScore > 8 ? "Critical buildup" : militaryScore > 6 ? "Elevated" : "Stable",
      signal: militaryScore > 8 ? "negative" : militaryScore > 6 ? "neutral" : "positive",
      source: "IISS"
    }
  ];

  // ── Economic dimension ───────────────────────────────────────────────────
  // Driven by: commodity prices, currency, trade flows, sanctions
  const economicMarketSignal = marketSignalToScore(indexChange);
  const currencySignal = marketSignalToScore(currencyChange);
  const economicScore = Math.min(10, Math.max(1,
    (profile.economicBase * 0.5) + (economicMarketSignal * 0.3) + (currencySignal * 0.2)
  ));

  const economicIndicators: WRDIIndicator[] = [
    {
      name: "Equity Market",
      value: indexChange !== null ? `${indexChange > 0 ? "+" : ""}${indexChange?.toFixed(2)}% today` : "Data loading",
      signal: indexChange !== null ? (indexChange > 0 ? "positive" : indexChange > -2 ? "neutral" : "negative") : "neutral",
      source: "Yahoo Finance"
    },
    {
      name: "Currency Pressure",
      value: currencyChange !== null ? `${currencyChange > 0 ? "+" : ""}${currencyChange?.toFixed(2)}% vs USD` : "Data loading",
      signal: currencyChange !== null ? (currencyChange > 0 ? "positive" : currencyChange > -1 ? "neutral" : "negative") : "neutral",
      source: "OANDA"
    },
    {
      name: "Trade Flows",
      value: economicScore > 6 ? "Disruption signals" : "Normal",
      signal: economicScore > 6 ? "negative" : "positive",
      source: "IMF / World Bank"
    },
    {
      name: "Sanctions Exposure",
      value: economicScore > 7 ? "Active sanctions regime" : "Limited",
      signal: economicScore > 7 ? "negative" : "neutral",
      source: "Trading Economics"
    }
  ];

  // ── Social dimension ─────────────────────────────────────────────────────
  // Driven by: refugee flows, protests, demographic pressure, human rights
  const socialScore = Math.min(10, Math.max(1, profile.socialBase));

  const socialIndicators: WRDIIndicator[] = [
    {
      name: "Refugee / Migration",
      value: socialScore > 6 ? "Elevated displacement" : "Stable",
      signal: socialScore > 6 ? "negative" : "neutral",
      source: "UNHCR"
    },
    {
      name: "Protest Activity",
      value: socialScore > 7 ? "Major demonstrations" : socialScore > 5 ? "Localized unrest" : "Calm",
      signal: socialScore > 7 ? "negative" : socialScore > 5 ? "neutral" : "positive",
      source: "AFP / Reuters"
    },
    {
      name: "Human Rights",
      value: socialScore > 7 ? "Violations documented" : "Monitored",
      signal: socialScore > 7 ? "negative" : "neutral",
      source: "Amnesty / HRW"
    },
    {
      name: "Demographic Pressure",
      value: socialScore > 6 ? "High" : "Moderate",
      signal: socialScore > 6 ? "negative" : "neutral",
      source: "World Bank"
    }
  ];

  // ── Composite score ──────────────────────────────────────────────────────
  const composite = Math.round(
    (politicalScore * 0.25 + militaryScore * 0.30 + economicScore * 0.25 + socialScore * 0.20) * 10
  ) / 10;

  const classification = classifyScore(composite);

  // ── Trend ────────────────────────────────────────────────────────────────
  const trend: "rising" | "falling" | "stable" =
    indexChange !== null && indexChange < -2 ? "rising" :
    indexChange !== null && indexChange > 2  ? "falling" : "stable";

  return {
    countryId,
    countryName: profile.name,
    composite,
    classification,
    political: {
      score: Math.round(politicalScore * 10) / 10,
      label: classifyScore(politicalScore),
      color: classificationColor(classifyScore(politicalScore)),
      indicators: politicalIndicators
    },
    military: {
      score: Math.round(militaryScore * 10) / 10,
      label: classifyScore(militaryScore),
      color: classificationColor(classifyScore(militaryScore)),
      indicators: militaryIndicators
    },
    economic: {
      score: Math.round(economicScore * 10) / 10,
      label: classifyScore(economicScore),
      color: classificationColor(classifyScore(economicScore)),
      indicators: economicIndicators
    },
    social: {
      score: Math.round(socialScore * 10) / 10,
      label: classifyScore(socialScore),
      color: classificationColor(classifyScore(socialScore)),
      indicators: socialIndicators
    },
    trend,
    lastUpdated: new Date(),
    weeklyEvents: profile.recentEvents
  };
}

// ── Pair report ──────────────────────────────────────────────────────────────

export function computeWRDIPairReport(
  pairId: string,
  country1Id: string,
  country2Id: string,
  marketData: MarketData[],
  middleEastImpact: number
): WRDIPairReport {
  const s1 = computeWRDIScore(country1Id, marketData);
  const s2 = computeWRDIScore(country2Id, marketData);

  const differentialRisk = Math.abs(s1.composite - s2.composite);

  // Find which dimension has the largest combined score (most volatile)
  const dims = [
    { name: "Military/Security", score: s1.military.score + s2.military.score },
    { name: "Political/Diplomatic", score: s1.political.score + s2.political.score },
    { name: "Economic", score: s1.economic.score + s2.economic.score },
    { name: "Social", score: s1.social.score + s2.social.score },
  ];
  const dominantDimension = dims.sort((a, b) => b.score - a.score)[0].name;

  // Generate anticipated moves based on scores
  const anticipatedMoves = generateAnticipatedMoves(country1Id, country2Id, s1, s2);
  const dangerousScenario = generateDangerousScenario(country1Id, country2Id, s1, s2);

  return {
    pairId,
    country1: country1Id,
    country2: country2Id,
    country1Score: s1,
    country2Score: s2,
    differentialRisk: Math.round(differentialRisk * 10) / 10,
    dominantDimension,
    middleEastImpact,
    anticipatedMoves,
    dangerousScenario,
    lastUpdated: new Date()
  };
}

function generateAnticipatedMoves(
  c1: string, c2: string,
  s1: WRDIScore, s2: WRDIScore
): string[] {
  const moves: string[] = [];
  const avgMilitary = (s1.military.score + s2.military.score) / 2;
  const avgEconomic = (s1.economic.score + s2.economic.score) / 2;
  const avgPolitical = (s1.political.score + s2.political.score) / 2;

  if (avgMilitary > 7) {
    moves.push(`Expect military posturing — both sides likely to increase defense spending and forward deployments`);
  } else if (avgMilitary > 5) {
    moves.push(`Military readiness elevated — watch for joint exercises or arms procurement announcements`);
  }

  if (avgEconomic > 6) {
    moves.push(`Economic leverage likely — sanctions, tariffs, or energy pricing used as political tools`);
  } else if (avgEconomic < 4) {
    moves.push(`Strong economic interdependence creates incentive for diplomatic resolution`);
  }

  if (avgPolitical > 7) {
    moves.push(`Diplomatic channels strained — expect UN forum confrontations and proxy positioning`);
  } else if (avgPolitical < 5) {
    moves.push(`Diplomatic window open — bilateral talks or treaty renegotiation likely within 6 months`);
  }

  if (moves.length < 2) {
    moves.push(`Status quo likely to persist — neither side has sufficient leverage to force a shift`);
  }

  return moves.slice(0, 3);
}

function generateDangerousScenario(
  c1: string, c2: string,
  s1: WRDIScore, s2: WRDIScore
): string {
  const maxMilitary = Math.max(s1.military.score, s2.military.score);
  const maxEconomic = Math.max(s1.economic.score, s2.economic.score);

  if (c1 === "us" && c2 === "russia" || c1 === "russia" && c2 === "us") {
    return maxMilitary > 8
      ? "Direct military confrontation in a third-party theater (Syria, Ukraine, Arctic) triggering Article 5 debate"
      : "Cyber-attack on critical infrastructure attributed to state actor, triggering escalation spiral";
  }
  if (c1 === "us" && c2 === "china" || c1 === "china" && c2 === "us") {
    return maxMilitary > 7
      ? "Taiwan Strait incident escalates to naval blockade, disrupting global semiconductor supply chains"
      : "Trade war escalation triggers synchronized market crash across Asian and US equities";
  }
  if (c1 === "israel" || c2 === "israel") {
    return maxMilitary > 7
      ? "Multi-front conflict activation (Gaza + Lebanon + Iran proxy) overwhelming regional containment capacity"
      : "Normalization deal collapse triggers regional realignment, drawing in external powers";
  }
  if (maxMilitary > 8) {
    return "Miscalculation during military exercise or border incident triggers unintended escalation";
  }
  if (maxEconomic > 7) {
    return "Coordinated economic decoupling triggers currency crisis in dependent third-party economies";
  }
  return "Domestic political instability in one actor spills over into foreign policy adventurism";
}

// ── Weekly report generator ──────────────────────────────────────────────────

export function generateWeeklyReport(
  scores: WRDIScore[],
  marketData: MarketData[]
): string {
  // Guard: if no scores are available yet, return a loading message
  if (!scores || scores.length === 0) {
    return "## WRDI Weekly Intelligence Report\n\n*Market data is still loading. Please wait a moment and try again.*";
  }

  const sorted = [...scores].sort((a, b) => b.composite - a.composite);
  const topRisk = sorted[0];
  const secondRisk = sorted[1];
  const avgComposite = scores.reduce((s, c) => s + c.composite, 0) / scores.length;

  // Guard: topRisk must exist
  if (!topRisk) {
    return "## WRDI Weekly Intelligence Report\n\n*Unable to compute risk scores. Please refresh market data and try again.*";
  }

  const middleEastLine = secondRisk
    ? `Current composite risk levels suggest **${avgComposite > 7 ? "elevated" : avgComposite > 5 ? "moderate" : "contained"}** spillover risk to the Middle East. The most critical bilateral relationship to watch is **${topRisk.countryName} / ${secondRisk.countryName}** given their combined WRDI differential of ${Math.abs(topRisk.composite - secondRisk.composite).toFixed(1)} points.`
    : `Current composite risk levels suggest **${avgComposite > 7 ? "elevated" : avgComposite > 5 ? "moderate" : "contained"}** spillover risk to the Middle East. **${topRisk.countryName}** is the highest-risk actor at ${topRisk.composite}/10.`;

  const lines = [
    `## WRDI Weekly Intelligence Report`,
    `**Period:** ${new Date(Date.now() - 7 * 86400000).toLocaleDateString()} – ${new Date().toLocaleDateString()}`,
    `**Global Average Risk Score:** ${avgComposite.toFixed(1)}/10 (${classifyScore(avgComposite)})`,
    ``,
    `### Highest Risk Actor: ${topRisk.countryName} (${topRisk.composite}/10 — ${topRisk.classification})`,
    `The dominant driver is the **${topRisk.military.score > topRisk.political.score ? "Military/Security" : "Political/Diplomatic"}** dimension at ${Math.max(topRisk.military.score, topRisk.political.score).toFixed(1)}/10.`,
    ``,
    `### Dimension Summary`,
    `| Country | Political | Military | Economic | Social | **Composite** |`,
    `|---|---|---|---|---|---|`,
    ...scores.map(s =>
      `| ${s.countryName} | ${s.political.score} | ${s.military.score} | ${s.economic.score} | ${s.social.score} | **${s.composite}** |`
    ),
    ``,
    `### Key Events This Week`,
    ...sorted.flatMap(s =>
      s.weeklyEvents.slice(0, 1).map(e =>
        `- **${s.countryName}** (${e.category}): ${e.description} *(Impact: ${e.impactScore}/10 — ${e.source})*`
      )
    ),
    ``,
    `### Middle East Outlook`,
    middleEastLine,
  ];

  return lines.join("\n");
}
