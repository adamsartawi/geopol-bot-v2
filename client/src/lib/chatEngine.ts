// ============================================================
// GEOPOLITICAL INTELLIGENCE ENGINE — AI Chat Engine
// Uses Manus Forge API (LLM) for reasoning over structured data
// Design: Intelligence Terminal / Cold War Cartography
// ============================================================

import {
  COUNTRIES,
  COUNTRY_PAIRS,
  MIDDLE_EAST_SCENARIOS,
  CountryPairAnalysis,
  CountryProfile,
} from "./geopoliticalData";

// LLM calls are proxied through the backend to keep API keys server-side

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

// Build the system prompt with all research knowledge
function buildSystemPrompt(marketData: MarketData[]): string {
  const countryProfiles = COUNTRIES.map(c => `
**${c.name} (${c.id})**
- Economic Pillars: ${c.economicPillars.join(", ")}
- Key Vulnerabilities: ${c.vulnerabilities.slice(0, 3).join("; ")}
- Middle East Interests: ${c.middleEastInterests.slice(0, 3).join("; ")}
- Geopolitical Posture: ${c.geopoliticalPosture.substring(0, 300)}...
`).join("\n");

  const pairSummaries = COUNTRY_PAIRS.map(p => {
    const c1 = COUNTRIES.find(c => c.id === p.country1);
    const c2 = COUNTRIES.find(c => c.id === p.country2);
    return `
**${c1?.name} vs ${c2?.name}** [${p.relationshipType}] Tension: ${p.tensionScore}/100 | Cooperation: ${p.cooperationScore}/100
- Economic: ${p.economicInterdependency}
- Key Tensions: ${p.tensionPoints.slice(0, 2).join("; ")}
- Middle East: ${p.middleEastDimension.substring(0, 200)}...
- Political Anticipation: ${p.politicalAnticipation.slice(0, 2).join("; ")}
- Leverage: ${p.leverageHolder} — ${p.leverageReason.substring(0, 100)}
- Dangerous Scenario: ${p.dangerousScenario.substring(0, 150)}...
`;
  }).join("\n");

  const scenarioSummaries = MIDDLE_EAST_SCENARIOS.map(s => `
**${s.title}** [${s.riskLevel} Risk | ${s.probability} Probability]
- Trigger: ${s.trigger}
- Economic Impact: ${s.economicImpact}
- Political Impact: ${s.politicalImpact}
- Market Signals: ${s.marketSignals.join(", ")}
`).join("\n");

  const marketSummary = marketData.length > 0 
    ? `\n## CURRENT LIVE MARKET DATA (as of ${new Date().toUTCString()})\n` +
      marketData.filter(d => d.price !== null).map(d => 
        `${d.name} (${d.symbol}): ${d.price?.toFixed(2)} | Change: ${d.changePercent?.toFixed(2)}%`
      ).join("\n")
    : "\n## MARKET DATA: Live data loading...";

  return `You are GEOPOL-INT, an elite geopolitical intelligence analyst AI. Your role is to analyze the intersection of economic/market data and political decision-making, with a specific focus on the impact of global events on the Middle East.

You have deep expertise in:
- Economic intelligence: reading market signals as political indicators
- Bilateral relationship dynamics between major powers
- Middle East geopolitics and regional power dynamics
- Anticipating political decisions based on economic self-interest

## YOUR ANALYTICAL FRAMEWORK
When analyzing any situation, you assess:
1. **Economic Interests**: What does the market/economic data tell us about each country's priorities?
2. **Political Anticipation**: Based on best interests, what decisions are most likely?
3. **Treaty/Deal Viability**: Are current agreements still serving both parties?
4. **Winner Assessment**: Who holds leverage and why?
5. **Danger Assessment**: What is the highest-risk scenario?
6. **Remaining Options**: What strategic moves are still available?
7. **Middle East Impact**: How does this affect the Middle East specifically?

## COUNTRY PROFILES
${countryProfiles}

## BILATERAL RELATIONSHIP MATRIX
${pairSummaries}

## MIDDLE EAST RISK SCENARIOS
${scenarioSummaries}

${marketSummary}

## RESPONSE FORMAT
- Lead with a clear intelligence assessment headline
- Use structured sections with bold headers
- Cite specific market data when relevant (e.g., "Oil at $X signals...")
- Be direct and analytical — no diplomatic hedging
- Always include a "Middle East Impact" section
- End with "Strategic Outlook" — 2-3 specific anticipated moves
- Use intelligence terminology (assess, indicate, signal, anticipate, posture)
- Keep responses focused and actionable, 300-600 words unless a deep analysis is requested

Current date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

// Stream response from Forge API
export async function* streamChatResponse(
  messages: ChatMessage[],
  marketData: MarketData[]
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(marketData);
  
  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...messages
      .filter(m => m.role !== "system")
      .slice(-10) // Keep last 10 messages for context
      .map(m => ({ role: m.role, content: m.content }))
  ];

  const response = await fetch(`/api/geopol/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: apiMessages,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

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

// Generate a structured country-pair brief
export function generatePairBrief(pairId: string, marketData: MarketData[]): string {
  const pair = COUNTRY_PAIRS.find(p => p.id === pairId);
  if (!pair) return "Pair not found";
  
  const c1 = COUNTRIES.find(c => c.id === pair.country1);
  const c2 = COUNTRIES.find(c => c.id === pair.country2);
  
  // Find relevant market signals
  const relevantMarket = marketData.filter(d => 
    d.country === pair.country1 || d.country === pair.country2 || d.country === "GLOBAL"
  );
  
  const marketContext = relevantMarket.length > 0
    ? `\n\nCurrent market signals: ${relevantMarket.slice(0, 3).map(d => 
        `${d.name}: ${d.price?.toFixed(2)} (${d.changePercent && d.changePercent > 0 ? '+' : ''}${d.changePercent?.toFixed(2)}%)`
      ).join(", ")}`
    : "";
  
  return `Analyze the ${c1?.name} vs ${c2?.name} relationship in detail. Their current relationship type is ${pair.relationshipType} with a tension score of ${pair.tensionScore}/100 and cooperation score of ${pair.cooperationScore}/100. Economic interdependency: ${pair.economicInterdependency}.${marketContext}

Please provide:
1. Current state assessment based on latest market data
2. Most likely political moves in next 12-24 months
3. Treaty/deal viability assessment
4. Winner/leverage assessment
5. Most dangerous scenario
6. Middle East impact (score: ${pair.middleEastImpactScore}/100)
7. Remaining strategic options for each side`;
}

// Detect if a question is about a specific country pair
export function detectPairFromQuestion(question: string): CountryPairAnalysis | null {
  const q = question.toLowerCase();
  for (const pair of COUNTRY_PAIRS) {
    const c1 = COUNTRIES.find(c => c.id === pair.country1);
    const c2 = COUNTRIES.find(c => c.id === pair.country2);
    if (!c1 || !c2) continue;
    
    const c1Names = [c1.name.toLowerCase(), c1.id.toLowerCase()];
    const c2Names = [c2.name.toLowerCase(), c2.id.toLowerCase()];
    
    const hasC1 = c1Names.some(n => q.includes(n));
    const hasC2 = c2Names.some(n => q.includes(n));
    
    if (hasC1 && hasC2) return pair;
  }
  return null;
}

// Detect if a question is about a specific country
export function detectCountryFromQuestion(question: string): CountryProfile | null {
  const q = question.toLowerCase();
  for (const country of COUNTRIES) {
    if (q.includes(country.name.toLowerCase()) || q.includes(country.id.toLowerCase())) {
      return country;
    }
  }
  return null;
}
