// ============================================================
// FACT-CHECK ENGINE — User Claim Verification & KB Update
// ============================================================
// When the user provides a factual claim about a real-world event
// that is outside the bot's current knowledge base, this module:
//   1. Extracts the core claim from the user message
//   2. Searches GDELT for corroborating evidence
//   3. Verifies the claim with an LLM judge
//   4. If verified, classifies and injects it into the KB
//   5. Returns a structured result for the chat endpoint
// ============================================================

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import {
  countryProfiles, countryPairs, middleEastScenarios, kbChangelog, pipelineEvents, pipelineRuns,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// ── Types ────────────────────────────────────────────────────────────────────

export type FactCheckStatus =
  | "no_claim"          // User message contains no verifiable factual claim
  | "searching"         // Actively searching for corroboration
  | "verified"          // Claim confirmed by external sources → KB updated
  | "unverified"        // Claim could not be confirmed
  | "contradicted"      // Sources actively contradict the claim
  | "kb_updated";       // KB was updated with verified information

export interface FactCheckResult {
  status: FactCheckStatus;
  claim: string;                  // The extracted claim
  confidence: number;             // 0-1 confidence in verification
  sources: string[];              // URLs of corroborating articles
  kbUpdatesApplied: number;       // Number of KB fields updated
  summary: string;                // Human-readable summary of what was found
  verifiedAt: Date;
}

interface ExtractedClaim {
  hasClaim: boolean;
  claim: string;
  keywords: string[];
  countries: string[];
  eventType: string;  // "military", "political", "economic", "social"
}

interface KBUpdate {
  entityType: "country_profile" | "country_pair" | "scenario";
  entityId: string;
  fieldName: string;
  newValue: string;
  reasoning: string;
}

interface ClassifiedClaim {
  affectedCountries: string[];
  wrdiDimension: string;
  severityScore: number;
  relevanceScore: number;
  kbUpdates: KBUpdate[];
}

// ── Step 1: Extract the factual claim from the user message ──────────────────

async function extractClaim(userMessage: string): Promise<ExtractedClaim> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You extract factual claims about real-world geopolitical events from user messages.
A "claim" is a specific, verifiable statement about something that happened or is happening in the real world.
Examples of claims: "Trump warned about an attack on Iran's grid in 48 hours", "Russia deployed troops to Belarus border", "Israel struck a Hezbollah target in Syria".
NOT claims: general questions, hypotheticals, requests for analysis, opinions.
Respond with JSON only.`,
      },
      {
        role: "user",
        content: `Extract any factual geopolitical claim from this message:\n\n"${userMessage}"`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "claim_extraction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            hasClaim: { type: "boolean", description: "Does the message contain a verifiable factual claim?" },
            claim: { type: "string", description: "The extracted claim in one clear sentence, or empty string if none" },
            keywords: { type: "array", items: { type: "string" }, description: "2-5 search keywords for this claim" },
            countries: { type: "array", items: { type: "string" }, description: "Country codes involved: US, CN, RU, IL, CA, EU, IR, SA, etc." },
            eventType: { type: "string", enum: ["military", "political", "economic", "social", "unknown"] },
          },
          required: ["hasClaim", "claim", "keywords", "countries", "eventType"],
          additionalProperties: false,
        },
      },
    },
  } as any);

  const content = response?.choices?.[0]?.message?.content;
  if (!content) return { hasClaim: false, claim: "", keywords: [], countries: [], eventType: "unknown" };
  const str = typeof content === "string" ? content : JSON.stringify(content);
  return JSON.parse(str) as ExtractedClaim;
}

// ── Step 2: Search GDELT for corroborating evidence ──────────────────────────

interface GDELTArticle {
  title: string;
  url: string;
  domain: string;
  seendate: string;
}

async function searchGDELT(keywords: string[], countries: string[]): Promise<GDELTArticle[]> {
  try {
    // Build a targeted GDELT query from keywords
    const keywordQuery = keywords.slice(0, 4).map(k => encodeURIComponent(k)).join("+");
    const countryPart = countries.length > 0
      ? `+country:${countries.slice(0, 3).join("+OR+country:")}`
      : "";
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${keywordQuery}${countryPart}&mode=artlist&maxrecords=10&format=json&timespan=10080`; // last 7 days
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const data = await res.json() as any;
    return (data?.articles ?? []).slice(0, 8) as GDELTArticle[];
  } catch (e) {
    console.warn("[FactCheck] GDELT search failed:", (e as Error).message);
    return [];
  }
}

// ── Step 3: Verify the claim against search results ──────────────────────────

interface VerificationResult {
  verdict: "confirmed" | "unverified" | "contradicted";
  confidence: number;
  reasoning: string;
  relevantSources: string[];
}

async function verifyClaim(claim: string, articles: GDELTArticle[]): Promise<VerificationResult> {
  if (articles.length === 0) {
    return {
      verdict: "unverified",
      confidence: 0,
      reasoning: "No corroborating articles found in recent news sources.",
      relevantSources: [],
    };
  }

  const articleSummaries = articles
    .map((a, i) => `[${i + 1}] "${a.title}" — ${a.domain} (${a.seendate?.slice(0, 8) ?? "recent"})`)
    .join("\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a fact-checking analyst. Given a claim and a list of news article titles, assess whether the articles support, contradict, or are inconclusive about the claim. Be conservative: only mark "confirmed" if multiple credible sources clearly support the claim. Respond with JSON only.`,
      },
      {
        role: "user",
        content: `CLAIM: "${claim}"\n\nRECENT NEWS ARTICLES:\n${articleSummaries}\n\nDoes the news evidence support this claim?`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "verification_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            verdict: { type: "string", enum: ["confirmed", "unverified", "contradicted"] },
            confidence: { type: "number", description: "0.0 to 1.0 confidence in the verdict" },
            reasoning: { type: "string", description: "1-2 sentence explanation of the verdict" },
            relevantSources: { type: "array", items: { type: "string" }, description: "Article indices (e.g. ['1','3']) that are most relevant" },
          },
          required: ["verdict", "confidence", "reasoning", "relevantSources"],
          additionalProperties: false,
        },
      },
    },
  } as any);

  const content = response?.choices?.[0]?.message?.content;
  if (!content) return { verdict: "unverified", confidence: 0, reasoning: "Verification failed.", relevantSources: [] };
  const str = typeof content === "string" ? content : JSON.stringify(content);
  const result = JSON.parse(str) as VerificationResult;

  // Map article indices back to URLs
  const sourceUrls = result.relevantSources
    .map(idx => articles[parseInt(idx) - 1]?.url)
    .filter(Boolean) as string[];
  result.relevantSources = sourceUrls;

  return result;
}

// ── Step 4: Classify verified claim and generate KB updates ──────────────────

async function classifyVerifiedClaim(
  claim: string,
  eventType: string,
  countries: string[],
  articles: GDELTArticle[]
): Promise<ClassifiedClaim | null> {
  const articleContext = articles.slice(0, 3).map(a => `- ${a.title}`).join("\n");

  const prompt = `You are a geopolitical intelligence analyst using the WRDI framework.
A user-submitted claim has been fact-checked and verified. Classify it and determine which knowledge base fields to update.

VERIFIED CLAIM: "${claim}"
EVENT TYPE: ${eventType}
COUNTRIES INVOLVED: ${countries.join(", ")}
SUPPORTING HEADLINES:
${articleContext}

WRDI DIMENSIONS:
- political (weight 25%): diplomatic incidents, elections, leadership changes, UN activity
- military (weight 30%): armed conflict, troop movements, arms deals, nuclear posturing
- economic (weight 25%): GDP, inflation, sanctions, trade, currency, commodities
- social (weight 20%): refugees, protests, human rights, food security

COUNTRIES TO MONITOR: US, CN (China), RU (Russia), IL (Israel), CA (Canada), EU (Europe)
MIDDLE EAST: SA, IR, SY, LB, PS, YE, IQ, AE, JO, EG

Return ONLY valid JSON:
{
  "affectedCountries": ["IL", "IR"],
  "wrdiDimension": "military",
  "severityScore": 8.0,
  "relevanceScore": 0.95,
  "kbUpdates": [
    {
      "entityType": "country_pair",
      "entityId": "IL-US",
      "fieldName": "dangerousScenario",
      "newValue": "Updated scenario based on verified user claim",
      "reasoning": "Why this field should be updated"
    }
  ]
}

Rules:
- severityScore: 1-10
- relevanceScore: 0-1
- Only include kbUpdates if severityScore >= 5
- fieldName for country_profile: geopoliticalPosture, currentPressures
- fieldName for country_pair: dangerousScenario, treatyViability, middleEastDimension, politicalAnticipation, remainingOptions
- fieldName for scenario: trigger, economicImpact, politicalImpact
- For country_pair entityId, use alphabetical order (e.g. IL-US not US-IL)
- Keep newValue concise (1-3 sentences)`;

  try {
    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "claim_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              affectedCountries: { type: "array", items: { type: "string" } },
              wrdiDimension: { type: "string", enum: ["political", "military", "economic", "social", "multiple"] },
              severityScore: { type: "number" },
              relevanceScore: { type: "number" },
              kbUpdates: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    entityType: { type: "string", enum: ["country_profile", "country_pair", "scenario"] },
                    entityId: { type: "string" },
                    fieldName: { type: "string" },
                    newValue: { type: "string" },
                    reasoning: { type: "string" },
                  },
                  required: ["entityType", "entityId", "fieldName", "newValue", "reasoning"],
                  additionalProperties: false,
                },
              },
            },
            required: ["affectedCountries", "wrdiDimension", "severityScore", "relevanceScore", "kbUpdates"],
            additionalProperties: false,
          },
        },
      },
    } as any);

    const content = response?.choices?.[0]?.message?.content;
    if (!content) return null;
    const str = typeof content === "string" ? content : JSON.stringify(content);
    return JSON.parse(str) as ClassifiedClaim;
  } catch (e) {
    console.warn("[FactCheck] Classification failed:", (e as Error).message);
    return null;
  }
}

// ── Step 5: Apply KB updates (reuses the same logic as pipeline) ─────────────

async function applyKBUpdate(
  db: Awaited<ReturnType<typeof getDb>>,
  update: KBUpdate,
  factCheckRunId: string
): Promise<boolean> {
  if (!db) return false;
  try {
    let previousValue = "";

    if (update.entityType === "country_profile") {
      const [profile] = await db.select().from(countryProfiles)
        .where(eq(countryProfiles.countryId, update.entityId)).limit(1);
      if (!profile) return false;
      previousValue = JSON.stringify((profile as any)[update.fieldName] ?? "");

      if (update.fieldName === "currentPressures") {
        const current = (profile.currentPressures as string[]) ?? [];
        const updated = [update.newValue, ...current.slice(0, 3)];
        await db.update(countryProfiles)
          .set({ currentPressures: updated, lastPipelineUpdate: new Date() })
          .where(eq(countryProfiles.countryId, update.entityId));
      } else if (update.fieldName === "geopoliticalPosture") {
        await db.update(countryProfiles)
          .set({ geopoliticalPosture: update.newValue, lastPipelineUpdate: new Date() })
          .where(eq(countryProfiles.countryId, update.entityId));
      } else {
        return false; // Field not updatable
      }
    } else if (update.entityType === "country_pair") {
      const [pair] = await db.select().from(countryPairs)
        .where(eq(countryPairs.pairId, update.entityId)).limit(1);
      if (!pair) return false;
      previousValue = JSON.stringify((pair as any)[update.fieldName] ?? "");

      const textFields = ["dangerousScenario", "treatyViability", "winnerAssessment", "middleEastDimension", "leverageReason"];
      const arrayFields = ["politicalAnticipation", "remainingOptions", "tensionPoints", "cooperationAreas"];

      if (textFields.includes(update.fieldName)) {
        await db.update(countryPairs)
          .set({ [update.fieldName]: update.newValue, lastPipelineUpdate: new Date() })
          .where(eq(countryPairs.pairId, update.entityId));
      } else if (arrayFields.includes(update.fieldName)) {
        const current = ((pair as any)[update.fieldName] as string[]) ?? [];
        const updated = [update.newValue, ...current.slice(0, 3)];
        await db.update(countryPairs)
          .set({ [update.fieldName]: updated, lastPipelineUpdate: new Date() })
          .where(eq(countryPairs.pairId, update.entityId));
      } else {
        return false;
      }
    } else if (update.entityType === "scenario") {
      const [scenario] = await db.select().from(middleEastScenarios)
        .where(eq(middleEastScenarios.scenarioId, update.entityId)).limit(1);
      if (!scenario) return false;
      previousValue = JSON.stringify((scenario as any)[update.fieldName] ?? "");

      const updatableFields = ["trigger", "economicImpact", "politicalImpact"];
      if (!updatableFields.includes(update.fieldName)) return false;
      await db.update(middleEastScenarios)
        .set({ [update.fieldName]: update.newValue, lastPipelineUpdate: new Date() })
        .where(eq(middleEastScenarios.scenarioId, update.entityId));
    }

    // Log the change
    await db.insert(kbChangelog).values({
      entityType: update.entityType,
      entityId: update.entityId,
      fieldChanged: update.fieldName,
      previousValue,
      newValue: update.newValue,
      triggeringEventIds: [],
      pipelineRunId: factCheckRunId,
      changedAt: new Date(),
    });

    return true;
  } catch (e) {
    console.warn("[FactCheck] KB update failed:", (e as Error).message);
    return false;
  }
}

// ── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Full fact-check pipeline for a user message.
 * Returns a FactCheckResult describing what was found and what was updated.
 */
export async function factCheckUserClaim(userMessage: string): Promise<FactCheckResult> {
  const verifiedAt = new Date();
  try {
  // Step 1: Extract claim
  const extracted = await extractClaim(userMessage);
  if (!extracted.hasClaim || !extracted.claim) {
    return {
      status: "no_claim",
      claim: "",
      confidence: 0,
      sources: [],
      kbUpdatesApplied: 0,
      summary: "No verifiable factual claim detected in the message.",
      verifiedAt,
    };
  }

  console.log(`[FactCheck] Claim extracted: "${extracted.claim}"`);

  // Step 2: Search GDELT
  const articles = await searchGDELT(extracted.keywords, extracted.countries);
  console.log(`[FactCheck] Found ${articles.length} articles for: ${extracted.keywords.join(", ")}`);

  // Step 3: Verify
  const verification = await verifyClaim(extracted.claim, articles);
  console.log(`[FactCheck] Verdict: ${verification.verdict} (confidence: ${verification.confidence})`);

  if (verification.verdict === "contradicted") {
    return {
      status: "contradicted",
      claim: extracted.claim,
      confidence: verification.confidence,
      sources: verification.relevantSources,
      kbUpdatesApplied: 0,
      summary: `Claim contradicted by sources: ${verification.reasoning}`,
      verifiedAt,
    };
  }

  if (verification.verdict === "unverified" || verification.confidence < 0.6) {
    return {
      status: "unverified",
      claim: extracted.claim,
      confidence: verification.confidence,
      sources: verification.relevantSources,
      kbUpdatesApplied: 0,
      summary: `Could not verify: ${verification.reasoning}`,
      verifiedAt,
    };
  }

  // Step 4: Classify and generate KB updates
  const classification = await classifyVerifiedClaim(
    extracted.claim,
    extracted.eventType,
    extracted.countries,
    articles
  );

  if (!classification || classification.kbUpdates.length === 0) {
    return {
      status: "verified",
      claim: extracted.claim,
      confidence: verification.confidence,
      sources: verification.relevantSources,
      kbUpdatesApplied: 0,
      summary: `Verified (confidence ${Math.round(verification.confidence * 100)}%) but no KB fields required updating. ${verification.reasoning}`,
      verifiedAt,
    };
  }

  // Step 5: Apply KB updates
  const db = await getDb();
  const factCheckRunId = `fc-${nanoid(12)}`;
  let kbUpdatesApplied = 0;

  for (const update of classification.kbUpdates) {
    const applied = await applyKBUpdate(db, update, factCheckRunId);
    if (applied) kbUpdatesApplied++;
  }

  console.log(`[FactCheck] KB updated: ${kbUpdatesApplied}/${classification.kbUpdates.length} fields`);

  return {
    status: "kb_updated",
    claim: extracted.claim,
    confidence: verification.confidence,
    sources: verification.relevantSources,
    kbUpdatesApplied,
    summary: `Verified and KB updated (${kbUpdatesApplied} field${kbUpdatesApplied !== 1 ? "s" : ""} updated). ${verification.reasoning}`,
    verifiedAt,
  };
  } catch (e) {
    console.warn("[FactCheck] Unexpected error:", (e as Error).message);
    return {
      status: "no_claim",
      claim: "",
      confidence: 0,
      sources: [],
      kbUpdatesApplied: 0,
      summary: "Fact-check failed due to an internal error.",
      verifiedAt,
    };
  }
}
