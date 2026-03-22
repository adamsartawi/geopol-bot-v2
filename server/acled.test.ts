/**
 * ACLED API credentials validation test.
 * Verifies that the stored ACLED_EMAIL and ACLED_PASSWORD can successfully
 * obtain an OAuth2 access token from the ACLED authentication endpoint.
 */
import { describe, it, expect } from "vitest";

describe("ACLED API credentials", () => {
  it("should have ACLED_EMAIL and ACLED_PASSWORD environment variables set", () => {
    const email = process.env.ACLED_EMAIL;
    const password = process.env.ACLED_PASSWORD;
    expect(email, "ACLED_EMAIL must be set").toBeTruthy();
    expect(password, "ACLED_PASSWORD must be set").toBeTruthy();
    expect(email).toMatch(/@/); // basic email format check
    expect(password!.length).toBeGreaterThan(6);
  });

  it("should successfully authenticate with ACLED OAuth2 endpoint", async () => {
    const email = process.env.ACLED_EMAIL;
    const password = process.env.ACLED_PASSWORD;

    if (!email || !password) {
      console.warn("Skipping ACLED live auth test — credentials not set");
      return;
    }

    const authBody = new URLSearchParams({
      username: email,
      password: password,
      grant_type: "password",
      client_id: "acled",
    });

    const authRes = await fetch("https://acleddata.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: authBody.toString(),
      signal: AbortSignal.timeout(20000),
    });

    expect(authRes.ok, `ACLED auth HTTP status should be 2xx, got ${authRes.status}`).toBe(true);

    const authData = await authRes.json() as any;
    expect(authData, "ACLED auth response should be an object").toBeTruthy();
    expect(authData.access_token, "ACLED auth should return an access_token").toBeTruthy();
    expect(typeof authData.access_token).toBe("string");
    expect(authData.access_token.length).toBeGreaterThan(10);

    console.log("[ACLED Test] Authentication successful — token received");
  }, 30000); // 30s timeout for live network call
});
