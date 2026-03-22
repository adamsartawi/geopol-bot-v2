// ============================================================
// FACT-CHECK ENGINE — Unit Tests
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock articles for GDELT (non-empty so verifyClaim calls LLM) ──
const MOCK_ARTICLES = [
  { title: "Article 1 about geopolitics", url: "https://example.com/1", domain: "example.com", seendate: "20260322" },
  { title: "Article 2 about geopolitics", url: "https://example.com/2", domain: "example.com", seendate: "20260322" },
];

// ── Helper: build a mock LLM response ───────────────────────
function mockLLMResponse(content: object | string) {
  return {
    choices: [{ message: { content: typeof content === "string" ? content : JSON.stringify(content) } }],
  };
}

// ── Helper: get a fresh factcheck module with mocked LLM and fetch ──
async function getFreshFactcheck(llmResponses: object[], gdeltArticles = MOCK_ARTICLES) {
  vi.resetModules();

  let callIndex = 0;
  vi.doMock("./_core/llm", () => ({
    invokeLLM: vi.fn().mockImplementation(() => {
      const resp = llmResponses[callIndex] ?? mockLLMResponse({ hasClaim: false, claim: "", keywords: [], countries: [], eventType: "unknown" });
      callIndex++;
      return Promise.resolve(resp);
    }),
  }));

  vi.doMock("./db", () => ({
    getDb: vi.fn().mockResolvedValue(null),
  }));

  // Mock GDELT fetch to return articles so verifyClaim calls the LLM
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ articles: gdeltArticles }),
  } as any);

  const mod = await import("./factcheck");
  return mod.factCheckUserClaim;
}

// ── Tests ────────────────────────────────────────────────────

describe("Fact-Check Engine", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Claim extraction", () => {
    it("returns no_claim when message has no verifiable claim", async () => {
      const factCheckUserClaim = await getFreshFactcheck([
        mockLLMResponse({ hasClaim: false, claim: "", keywords: [], countries: [], eventType: "unknown" }),
      ]);

      const result = await factCheckUserClaim("What is the WRDI score for Russia?");

      expect(result.status).toBe("no_claim");
      expect(result.claim).toBe("");
      expect(result.kbUpdatesApplied).toBe(0);
    });

    it("returns unverified when GDELT finds no corroborating articles and LLM says unverified", async () => {
      // When GDELT returns empty → verifyClaim short-circuits to unverified without LLM call
      const factCheckUserClaim = await getFreshFactcheck(
        [
          mockLLMResponse({
            hasClaim: true,
            claim: "Trump warned about an attack on Iran's electrical grid within 48 hours",
            keywords: ["Trump", "Iran", "electrical grid", "attack"],
            countries: ["US", "IR"],
            eventType: "military",
          }),
          // No second LLM call needed — GDELT returns empty → short-circuit
        ],
        [] // Empty articles → verifyClaim returns unverified immediately
      );

      const result = await factCheckUserClaim(
        "Trump warned that within 48 hours Israel and the US will attack Iran's electrical grid"
      );

      expect(result.status).toBe("unverified");
      expect(result.claim).toContain("Trump");
      expect(result.confidence).toBeLessThan(0.6);
    });
  });

  describe("Verification logic", () => {
    it("returns contradicted status when LLM says sources contradict the claim", async () => {
      const factCheckUserClaim = await getFreshFactcheck([
        // Step 1: claim extraction
        mockLLMResponse({
          hasClaim: true,
          claim: "Russia withdrew all troops from Ukraine",
          keywords: ["Russia", "Ukraine", "troops", "withdrawal"],
          countries: ["RU", "UA"],
          eventType: "military",
        }),
        // Step 2: verification (articles present → LLM called)
        mockLLMResponse({
          verdict: "contradicted",
          confidence: 0.85,
          reasoning: "Multiple sources report ongoing Russian military operations in Ukraine.",
          relevantSources: ["1", "2"],
        }),
      ]);

      const result = await factCheckUserClaim("Russia has withdrawn all troops from Ukraine");

      expect(result.status).toBe("contradicted");
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it("returns unverified when confidence is below threshold (0.6)", async () => {
      const factCheckUserClaim = await getFreshFactcheck([
        mockLLMResponse({
          hasClaim: true,
          claim: "China deployed 50,000 troops to the Taiwan Strait",
          keywords: ["China", "Taiwan", "troops", "deployment"],
          countries: ["CN", "TW"],
          eventType: "military",
        }),
        mockLLMResponse({
          verdict: "confirmed",
          confidence: 0.45, // Below 0.6 threshold → treated as unverified
          reasoning: "Some reports mention increased activity but numbers unconfirmed.",
          relevantSources: [],
        }),
      ]);

      const result = await factCheckUserClaim("China deployed 50,000 troops to the Taiwan Strait");

      expect(result.status).toBe("unverified");
      expect(result.kbUpdatesApplied).toBe(0);
    });
  });

  describe("KB update logic", () => {
    it("returns verified (no update) when classification returns no KB updates", async () => {
      const factCheckUserClaim = await getFreshFactcheck([
        // Step 1: claim extraction
        mockLLMResponse({
          hasClaim: true,
          claim: "Israel conducted airstrikes in Syria",
          keywords: ["Israel", "Syria", "airstrikes"],
          countries: ["IL", "SY"],
          eventType: "military",
        }),
        // Step 2: verification
        mockLLMResponse({
          verdict: "confirmed",
          confidence: 0.80,
          reasoning: "Multiple credible sources confirm Israeli airstrikes in Syria.",
          relevantSources: ["1"],
        }),
        // Step 3: classification → no KB updates
        mockLLMResponse({
          affectedCountries: ["IL", "SY"],
          wrdiDimension: "military",
          severityScore: 3.5,
          relevanceScore: 0.75,
          kbUpdates: [],
        }),
      ]);

      const result = await factCheckUserClaim("Israel conducted airstrikes in Syria");

      expect(result.status).toBe("verified");
      expect(result.kbUpdatesApplied).toBe(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
    });

    it("returns kb_updated (0 applied) when DB is null but updates were generated", async () => {
      const factCheckUserClaim = await getFreshFactcheck([
        // Step 1: claim extraction
        mockLLMResponse({
          hasClaim: true,
          claim: "Russia deployed nuclear submarines to the Arctic",
          keywords: ["Russia", "nuclear", "submarines", "Arctic"],
          countries: ["RU"],
          eventType: "military",
        }),
        // Step 2: verification
        mockLLMResponse({
          verdict: "confirmed",
          confidence: 0.78,
          reasoning: "Multiple defense sources confirm the deployment.",
          relevantSources: ["1", "2"],
        }),
        // Step 3: classification → KB updates generated
        mockLLMResponse({
          affectedCountries: ["RU"],
          wrdiDimension: "military",
          severityScore: 7.5,
          relevanceScore: 0.85,
          kbUpdates: [
            {
              entityType: "country_profile",
              entityId: "RU",
              fieldName: "currentPressures",
              newValue: "Arctic nuclear submarine deployment escalating NATO tensions",
              reasoning: "High-severity military event affecting Russia's strategic posture",
            },
          ],
        }),
      ]);

      // DB is null → applyKBUpdate returns false → kbUpdatesApplied = 0 → status = "kb_updated"
      const result = await factCheckUserClaim("Russia deployed nuclear submarines to the Arctic");

      expect(result.status).toBe("kb_updated");
      expect(result.kbUpdatesApplied).toBe(0); // DB null → all updates fail gracefully
      expect(result.claim).toContain("Russia");
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
    });
  });

  describe("Edge cases", () => {
    it("handles LLM failure gracefully (returns no_claim)", async () => {
      vi.resetModules();
      vi.doMock("./_core/llm", () => ({
        invokeLLM: vi.fn().mockRejectedValue(new Error("LLM timeout")),
      }));
      vi.doMock("./db", () => ({
        getDb: vi.fn().mockResolvedValue(null),
      }));
      global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ articles: [] }) } as any);

      const { factCheckUserClaim } = await import("./factcheck");
      const result = await factCheckUserClaim("Some claim about geopolitics");

      expect(result.status).toBe("no_claim");
    });

    it("handles empty message with no claim", async () => {
      const factCheckUserClaim = await getFreshFactcheck([
        mockLLMResponse({ hasClaim: false, claim: "", keywords: [], countries: [], eventType: "unknown" }),
      ]);

      const result = await factCheckUserClaim("");

      expect(result.status).toBe("no_claim");
      expect(result.kbUpdatesApplied).toBe(0);
    });

    it("handles GDELT network failure gracefully (returns unverified)", async () => {
      vi.resetModules();

      let callIndex = 0;
      const responses = [
        mockLLMResponse({
          hasClaim: true,
          claim: "Iran launched missiles at Israel",
          keywords: ["Iran", "Israel", "missiles"],
          countries: ["IR", "IL"],
          eventType: "military",
        }),
        // No second LLM call — GDELT fails → articles = [] → verifyClaim short-circuits
      ];

      vi.doMock("./_core/llm", () => ({
        invokeLLM: vi.fn().mockImplementation(() => {
          const resp = responses[callIndex] ?? responses[responses.length - 1];
          callIndex++;
          return Promise.resolve(resp);
        }),
      }));

      vi.doMock("./db", () => ({
        getDb: vi.fn().mockResolvedValue(null),
      }));

      // GDELT fetch throws → searchGDELT catches → returns [] → verifyClaim returns unverified
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

      const { factCheckUserClaim } = await import("./factcheck");
      const result = await factCheckUserClaim("Iran launched missiles at Israel");

      expect(result.status).toBe("unverified");
    });
  });
});
