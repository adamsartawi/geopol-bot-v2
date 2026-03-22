// ============================================================
// GEOPOLITICAL INTELLIGENCE ENGINE — AI Chat Engine
// Conversational mode: short, focused, dialogue-driven replies
// WRDI-aware: references the four-dimension risk framework
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

// ── System prompt — conversational, WRDI-aware ───────────────────────────────

function buildSystemPrompt(marketData: MarketData[]): string {
  const countryProfiles = COUNTRIES.map(c =>
    `${c.name}: pillars=${c.economicPillars.slice(0,2).join(",")}; ME_interests=${c.middleEastInterests.slice(0,2).join(",")}; posture=${c.geopoliticalPosture.substring(0,120)}`
  ).join("\n");

  const pairSummaries = COUNTRY_PAIRS.map(p => {
    const c1 = COUNTRIES.find(c => c.id === p.country1);
    const c2 = COUNTRIES.find(c => c.id === p.country2);
    return `${c1?.name}/${c2?.name}: ${p.relationshipType} | tension=${p.tensionScore} | ME_impact=${p.middleEastImpactScore} | leverage=${p.leverageHolder}`;
  }).join("\n");

  const topScenarios = MIDDLE_EAST_SCENARIOS.slice(0, 4).map(s =>
    `${s.title} [${s.riskLevel}/${s.probability}]: ${s.trigger}`
  ).join("\n");

  const liveMarket = marketData.filter(d => d.price !== null).slice(0, 12).map(d =>
    `${d.name}: ${d.price?.toFixed(2)} (${d.changePercent && d.changePercent > 0 ? "+" : ""}${d.changePercent?.toFixed(2)}%)`
  ).join(" | ");

  return `You are GEOPOL-INT, a sharp geopolitical intelligence analyst. You use the WRDI framework — four dimensions: Political/Diplomatic (25%), Military/Security (30%), Economic (25%), Social (20%) — to score risk from 1–10 and anticipate political moves.

CONVERSATION STYLE — CRITICAL:
- Be conversational and direct. Respond like a knowledgeable analyst in a briefing, not a report writer.
- Keep replies SHORT: 2–5 sentences for simple questions, 1 short paragraph per topic for complex ones.
- Never write long bullet lists. Use at most 2–3 bullets only when listing specific items.
- If the user asks a broad question, answer the most important point and ask a follow-up to go deeper.
- Use plain language. Replace jargon with clear statements.
- When referencing WRDI scores, cite them naturally: "Russia's military dimension is at 8.5/10 right now..."
- Always anchor your answer to live market data when relevant.
- End with ONE short follow-up question or observation to keep the dialogue going.

WRDI FRAMEWORK (reference when scoring):
- Political/Diplomatic: statements, UN resolutions, summit activity, alliance posture
- Military/Security: operations, arms transfers, incidents, readiness level  
- Economic: equity markets, currency, trade flows, sanctions
- Social: refugee flows, protests, human rights, demographic pressure
- Composite = (Pol×0.25) + (Mil×0.30) + (Econ×0.25) + (Soc×0.20)
- Scale: 1–2 Very Low | 3–4 Low | 5–6 Medium | 7–8 High | 9–10 Critical

COUNTRY PROFILES (compact):
${countryProfiles}

BILATERAL MATRIX:
${pairSummaries}

TOP MIDDLE EAST SCENARIOS:
${topScenarios}

LIVE MARKET DATA (${new Date().toUTCString()}):
${liveMarket || "Loading..."}

Today: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
}

// ── Stream response ──────────────────────────────────────────────────────────

export async function* streamChatResponse(
  messages: ChatMessage[],
  marketData: MarketData[]
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(marketData);

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

// ── Pair brief — now conversational opener, not a full report request ────────

export function generatePairBrief(pairId: string, marketData: MarketData[]): string {
  const pair = COUNTRY_PAIRS.find(p => p.id === pairId);
  if (!pair) return "Tell me about that country pair.";

  const c1 = COUNTRIES.find(c => c.id === pair.country1);
  const c2 = COUNTRIES.find(c => c.id === pair.country2);

  const relevantMarket = marketData.filter(d =>
    d.country === pair.country1 || d.country === pair.country2
  );

  const marketNote = relevantMarket.length > 0
    ? ` Markets: ${relevantMarket.slice(0, 2).map(d =>
        `${d.name} ${d.changePercent && d.changePercent > 0 ? "+" : ""}${d.changePercent?.toFixed(1)}%`
      ).join(", ")}.`
    : "";

  // Short conversational opener — the LLM will respond briefly and ask what to go deeper on
  return `Give me a quick read on ${c1?.name} vs ${c2?.name} right now. Relationship: ${pair.relationshipType}, tension ${pair.tensionScore}/100, ME impact ${pair.middleEastImpactScore}/100.${marketNote} What's the most important thing happening between them?`;
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
