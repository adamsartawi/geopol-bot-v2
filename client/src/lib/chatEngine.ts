// ============================================================
// GEOPOLITICAL INTELLIGENCE ENGINE — AI Chat Engine
// DATA-GROUNDED MODE: All answers must derive exclusively from
// the structured knowledge base embedded in this codebase.
// The LLM must NOT use general world knowledge.
// ============================================================

import {
  COUNTRIES,
  COUNTRY_PAIRS,
  MIDDLE_EAST_SCENARIOS,
  CountryPairAnalysis,
  CountryProfile,
} from "./geopoliticalData";

export interface MarketData {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  country: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  analysisType?: "country-pair" | "scenario" | "market" | "general";
  relatedPair?: string;
}
// ── Live KB data from DB (optional, overrides static data when available) ───
export interface LiveKBData {
  countries: Array<{
    countryId: string;
    name: string;
    economicPillars: string[];
    keyIndicators: string[];
    vulnerabilities: string[];
    strategicAssets: string[];
    currentPressures: string[];
    middleEastInterests: string[];
    geopoliticalPosture: string;
  }>;
  pairs: Array<{
    pairId: string;
    country1: string;
    country2: string;
    relationshipType: string;
    tensionScore: number;
    cooperationScore: number;
    middleEastImpactScore: number;
    economicInterdependency: string;
    tensionPoints: string[];
    cooperationAreas: string[];
    middleEastDimension: string;
    politicalAnticipation: string[];
    treatyViability: string;
    winnerAssessment: string;
    leverageHolder: string;
    leverageReason: string;
    dangerousScenario: string;
    remainingOptions: string[];
  }>;
  scenarios: Array<{
    scenarioId: string;
    title: string;
    riskLevel: string;
    probability: string;
    trigger: string;
    economicImpact: string;
    politicalImpact: string;
    marketSignals: string[];
    affectedCountries: string[];
    timeframe: string;
  }>;
}

// ── Full data serialization helpers ───────────────────────────────────────────
function serializeCountryProfile(c: CountryProfile): string {
  return [
    `=== ${c.name.toUpperCase()} ===`,
    `Economic Pillars: ${c.economicPillars.join(" | ")}`,
    `Key Indicators: ${c.keyIndicators.join(" | ")}`,
    `Vulnerabilities: ${c.vulnerabilities.join(" | ")}`,
    `Strategic Assets: ${c.strategicAssets.join(" | ")}`,
    `Current Pressures: ${c.currentPressures.join(" | ")}`,
    `Geopolitical Posture: ${c.geopoliticalPosture}`,
    `Middle East Interests: ${c.middleEastInterests.join(" | ")}`,
  ].join("\n");
}

function serializeCountryPair(p: CountryPairAnalysis): string {
  const c1 = COUNTRIES.find(c => c.id === p.country1);
  const c2 = COUNTRIES.find(c => c.id === p.country2);
  return [
    `=== ${c1?.name} / ${c2?.name} [${p.id}] ===`,
    `Relationship Type: ${p.relationshipType}`,
    `Tension Score: ${p.tensionScore}/100 | Cooperation Score: ${p.cooperationScore}/100 | Middle East Impact: ${p.middleEastImpactScore}/100`,
    `Economic Interdependency: ${p.economicInterdependency}`,
    `Tension Points: ${p.tensionPoints.join(" | ")}`,
    `Cooperation Areas: ${p.cooperationAreas.join(" | ")}`,
    `Middle East Dimension: ${p.middleEastDimension}`,
    `Political Anticipation: ${p.politicalAnticipation.join(" | ")}`,
    `Treaty Viability: ${p.treatyViability}`,
    `Winner Assessment: ${p.winnerAssessment}`,
    `Leverage Holder: ${p.leverageHolder} — ${p.leverageReason}`,
    `Dangerous Scenario: ${p.dangerousScenario}`,
    `Remaining Options: ${p.remainingOptions.join(" | ")}`,
  ].join("\n");
}

function serializeScenario(s: typeof MIDDLE_EAST_SCENARIOS[0]): string {
  return [
    `=== SCENARIO: ${s.title} [${s.riskLevel} risk | ${s.probability} probability] ===`,
    `Trigger: ${s.trigger}`,
    `Timeframe: ${s.timeframe}`,
    `Economic Impact: ${s.economicImpact}`,
    `Political Impact: ${s.politicalImpact}`,
    `Market Signals to Watch: ${s.marketSignals.join(" | ")}`,
    `Affected Countries: ${s.affectedCountries.join(", ")}`,
  ].join("\n");
}

function serializeLiveMarket(marketData: MarketData[]): string {
  const live = marketData.filter(d => d.price !== null);
  if (live.length === 0) return "Market data loading...";

  const byCountry: Record<string, MarketData[]> = {};
  for (const d of live) {
    if (!byCountry[d.country]) byCountry[d.country] = [];
    byCountry[d.country].push(d);
  }

  return Object.entries(byCountry).map(([country, items]) => {
    const countryName = COUNTRIES.find(c => c.id === country)?.name ?? country;
    const vals = items.map(d => {
      const pct = d.changePercent !== null
        ? ` (${d.changePercent > 0 ? "+" : ""}${d.changePercent.toFixed(2)}%)`
        : "";
      return `${d.name}: ${d.price?.toFixed(2)}${pct}`;
    }).join(", ");
    return `${countryName}: ${vals}`;
  }).join('\n');
}

// ── System prompt — full data injection, strict grounding ───────────────────────────────────────────

function buildSystemPrompt(marketData: MarketData[], liveKB?: LiveKBData): string {
  let allCountryProfiles: string;
  let allPairs: string;
  let allScenarios: string;

  // Use live DB data if available (post fact-check), otherwise fall back to static data
  if (liveKB && liveKB.countries.length > 0) {
    allCountryProfiles = liveKB.countries.map(c => [
      `=== ${c.name.toUpperCase()} ===`,
      `Economic Pillars: ${(c.economicPillars ?? []).join(" | ")}`,
      `Key Indicators: ${(c.keyIndicators ?? []).join(" | ")}`,
      `Vulnerabilities: ${(c.vulnerabilities ?? []).join(" | ")}`,
      `Strategic Assets: ${(c.strategicAssets ?? []).join(" | ")}`,
      `Current Pressures: ${(c.currentPressures ?? []).join(" | ")}`,
      `Geopolitical Posture: ${c.geopoliticalPosture}`,
      `Middle East Interests: ${(c.middleEastInterests ?? []).join(" | ")}`,
    ].join("\n")).join("\n\n");
    allPairs = liveKB.pairs.map(p => [
      `=== ${p.country1} / ${p.country2} [${p.pairId}] ===`,
      `Relationship Type: ${p.relationshipType}`,
      `Tension Score: ${p.tensionScore}/100 | Cooperation Score: ${p.cooperationScore}/100 | Middle East Impact: ${p.middleEastImpactScore}/100`,
      `Economic Interdependency: ${p.economicInterdependency}`,
      `Tension Points: ${(p.tensionPoints ?? []).join(" | ")}`,
      `Cooperation Areas: ${(p.cooperationAreas ?? []).join(" | ")}`,
      `Middle East Dimension: ${p.middleEastDimension}`,
      `Political Anticipation: ${(p.politicalAnticipation ?? []).join(" | ")}`,
      `Treaty Viability: ${p.treatyViability}`,
      `Winner Assessment: ${p.winnerAssessment}`,
      `Leverage Holder: ${p.leverageHolder} — ${p.leverageReason}`,
      `Dangerous Scenario: ${p.dangerousScenario}`,
      `Remaining Options: ${(p.remainingOptions ?? []).join(" | ")}`,
    ].join("\n")).join("\n\n");
    allScenarios = liveKB.scenarios.map(s => [
      `=== SCENARIO: ${s.title} [${s.riskLevel} risk | ${s.probability} probability] ===`,
      `Trigger: ${s.trigger}`,
      `Timeframe: ${s.timeframe}`,
      `Economic Impact: ${s.economicImpact}`,
      `Political Impact: ${s.politicalImpact}`,
      `Market Signals to Watch: ${(s.marketSignals ?? []).join(" | ")}`,
      `Affected Countries: ${(s.affectedCountries ?? []).join(", ")}`,
    ].join("\n")).join("\n\n");
  } else {
    allCountryProfiles = COUNTRIES.map(serializeCountryProfile).join("\n\n");
    allPairs = COUNTRY_PAIRS.map(serializeCountryPair).join("\n\n");
    allScenarios = MIDDLE_EAST_SCENARIOS.map(serializeScenario).join("\n\n");
  }

  const liveMarket = serializeLiveMarket(marketData);
  return `You are GEOPOL-INT, a geopolitical intelligence analyst. Your ONLY source of information is the structured knowledge base provided below. You must NOT use any general world knowledge, news, or training data beyond what is explicitly provided here.

STRICT RULES — YOU MUST FOLLOW THESE:
1. Every claim, score, assessment, or anticipation you state MUST come directly from the data below. Quote or paraphrase it.
2. If the user asks about something NOT covered in the data (a country pair not in the matrix, an event not in the scenarios, a country not in the profiles), say: "That's outside my current data coverage. I can only analyze what's in my knowledge base." Do not speculate.
3. When citing a WRDI score, political anticipation, or dangerous scenario, you are reading it from the data — be explicit: "According to the data..." or "The matrix shows..."
4. Do NOT invent statistics, dates, events, or relationships that are not in the data below.
5. If live market data is available, use it to contextualize the data — e.g., "The data identifies oil price as a key signal for Russia, and today WTI is at $X."

CONVERSATION STYLE:
- Be conversational and direct. Respond like a briefing analyst, not a report writer.
- Keep replies SHORT: 2–4 sentences for simple questions, one focused paragraph per topic for complex ones.
- End with ONE short follow-up question to keep the dialogue going.
- When referencing WRDI scores, cite them naturally: "Russia's military dimension is at 8.5/10..."
- Never write long bullet lists. Use at most 2–3 bullets only when listing specific named items from the data.

WRDI FRAMEWORK (for scoring context):
- Political/Diplomatic (25%) | Military/Security (30%) | Economic (25%) | Social (20%)
- Composite = (Pol×0.25) + (Mil×0.30) + (Econ×0.25) + (Soc×0.20)
- Scale: 1–2 Very Low | 3–4 Low | 5–6 Medium | 7–8 High | 9–10 Critical

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWLEDGE BASE — COUNTRY PROFILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${allCountryProfiles}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWLEDGE BASE — BILATERAL RELATIONSHIP MATRIX (10 PAIRS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${allPairs}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWLEDGE BASE — MIDDLE EAST SCENARIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${allScenarios}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LIVE MARKET DATA (as of ${new Date().toUTCString()})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${liveMarket}

Today: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REMINDER: Answer ONLY from the data above. If it is not in the knowledge base, say so.`;
}

// ── Stream response ──────────────────────────────────────────────────────────

export async function* streamChatResponse(
  messages: ChatMessage[],
  marketData: MarketData[],
  liveKB?: LiveKBData
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(marketData, liveKB);

  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...messages
      .filter(m => m.role !== "system")
      .slice(-12) // Keep last 12 turns for conversational context
      .map(m => ({ role: m.role, content: m.content }))
  ];

  const response = await fetch(`/api/geopol/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: apiMessages }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }
}

// ── Pair brief — conversational opener referencing actual pair data ───────────

export function generatePairBrief(pairId: string, marketData: MarketData[]): string {
  const pair = COUNTRY_PAIRS.find(p => p.id === pairId);
  if (!pair) return "Tell me about that country pair.";

  const c1 = COUNTRIES.find(c => c.id === pair.country1);
  const c2 = COUNTRIES.find(c => c.id === pair.country2);

  const relevantMarket = marketData.filter(d =>
    (d.country === pair.country1 || d.country === pair.country2) && d.price !== null
  );

  const marketNote = relevantMarket.length > 0
    ? ` Live markets: ${relevantMarket.slice(0, 2).map(d =>
        `${d.name} ${d.changePercent !== null ? (d.changePercent > 0 ? "+" : "") + d.changePercent.toFixed(1) + "%" : "N/A"}`
      ).join(", ")}.`
    : "";

  return `Based on the data, give me a quick read on ${c1?.name} vs ${c2?.name}. The matrix shows tension at ${pair.tensionScore}/100, relationship type: ${pair.relationshipType}, Middle East impact: ${pair.middleEastImpactScore}/100.${marketNote} What's the most important signal right now according to the data?`;
}

// ── Detect pair from question ────────────────────────────────────────────────

export function detectPairFromQuestion(question: string): CountryPairAnalysis | null {
  const q = question.toLowerCase();
  for (const pair of COUNTRY_PAIRS) {
    const c1 = COUNTRIES.find(c => c.id === pair.country1);
    const c2 = COUNTRIES.find(c => c.id === pair.country2);
    if (!c1 || !c2) continue;
    const c1Names = [c1.name.toLowerCase(), c1.id.toLowerCase()];
    const c2Names = [c2.name.toLowerCase(), c2.id.toLowerCase()];
    if (c1Names.some(n => q.includes(n)) && c2Names.some(n => q.includes(n))) return pair;
  }
  return null;
}

// ── Detect country from question ─────────────────────────────────────────────

export function detectCountryFromQuestion(question: string): CountryProfile | null {
  const q = question.toLowerCase();
  for (const country of COUNTRIES) {
    if (q.includes(country.name.toLowerCase()) || q.includes(country.id.toLowerCase())) {
      return country;
    }
  }
  return null;
}
