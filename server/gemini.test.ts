import { describe, it, expect } from "vitest";

const GEMINI_API_KEY = "AIzaSyCHB8yYAs9K7ipHMTN-J-92JHlZFwn39D0";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

describe("Gemini API credentials", () => {
  it("should have a valid API key (not a client ID)", async () => {
    // Key must start with AIzaSy (valid API key format)
    expect(GEMINI_API_KEY).toMatch(/^AIzaSy/);

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Say hello in one word" }] }],
      }),
    });

    const data = await response.json() as { error?: { code: number; message: string } };

    // 429 = quota exceeded (key is valid, just rate limited) — still a pass
    // 400 with API_KEY_INVALID = bad key — fail
    if (!response.ok) {
      const isQuotaError = data.error?.code === 429;
      const isKeyInvalid = data.error?.message?.includes("API key not valid");

      if (isKeyInvalid) {
        throw new Error(`Invalid API key: ${data.error?.message}`);
      }

      if (isQuotaError) {
        console.log("[Gemini Test] Key is valid — quota temporarily exceeded (free tier). Will recover automatically.");
        return; // Pass: key is valid, quota will reset
      }

      throw new Error(`Unexpected error ${data.error?.code}: ${data.error?.message}`);
    }

    // If we get a successful response, verify the content
    const result = data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    expect(text.length).toBeGreaterThan(0);
    console.log("[Gemini Test] Response:", text.slice(0, 100));
  }, 30000);
});
