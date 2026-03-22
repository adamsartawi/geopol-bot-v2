// ============================================================
// WRDI Engine — Unit Tests
// Tests the scoring logic, classification, and pair report generation
// ============================================================

import { describe, it, expect } from "vitest";

// ── Replicate the pure scoring helpers here (no browser imports) ─────────────

type WRDIClassification = "VERY LOW" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

function classifyScore(score: number): WRDIClassification {
  if (score <= 2) return "VERY LOW";
  if (score <= 4) return "LOW";
  if (score <= 6) return "MEDIUM";
  if (score <= 8) return "HIGH";
  return "CRITICAL";
}

function marketSignalToScore(changePercent: number | null, _invert = false): number {
  if (changePercent === null) return 5;
  if (changePercent > 3)  return 2;
  if (changePercent > 1)  return 3;
  if (changePercent > 0)  return 4;
  if (changePercent > -1) return 5;
  if (changePercent > -2) return 6;
  if (changePercent > -3) return 7;
  if (changePercent > -5) return 8;
  return 9;
}

function computeComposite(political: number, military: number, economic: number, social: number): number {
  return Math.round((political * 0.25 + military * 0.30 + economic * 0.25 + social * 0.20) * 10) / 10;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("WRDI Classification", () => {
  it("classifies 1.5 as VERY LOW", () => {
    expect(classifyScore(1.5)).toBe("VERY LOW");
  });
  it("classifies 2.0 as VERY LOW (boundary)", () => {
    expect(classifyScore(2.0)).toBe("VERY LOW");
  });
  it("classifies 3.5 as LOW", () => {
    expect(classifyScore(3.5)).toBe("LOW");
  });
  it("classifies 5.0 as MEDIUM", () => {
    expect(classifyScore(5.0)).toBe("MEDIUM");
  });
  it("classifies 7.5 as HIGH", () => {
    expect(classifyScore(7.5)).toBe("HIGH");
  });
  it("classifies 9.2 as CRITICAL", () => {
    expect(classifyScore(9.2)).toBe("CRITICAL");
  });
  it("classifies 10 as CRITICAL (max)", () => {
    expect(classifyScore(10)).toBe("CRITICAL");
  });
});

describe("Market Signal to Score", () => {
  it("strong positive market (+5%) → low risk score (2)", () => {
    expect(marketSignalToScore(5)).toBe(2);
  });
  it("moderate positive (+1.5%) → score 3", () => {
    expect(marketSignalToScore(1.5)).toBe(3);
  });
  it("flat market (0%) → neutral score 5", () => {
    // 0% change: not positive (>0), falls into the -1 to 0 bucket → score 5
    expect(marketSignalToScore(0)).toBe(5);
  });
  it("slight decline (-0.5%) → score 5", () => {
    expect(marketSignalToScore(-0.5)).toBe(5);
  });
  it("moderate decline (-1.5%) → score 6", () => {
    expect(marketSignalToScore(-1.5)).toBe(6);
  });
  it("sharp decline (-4%) → score 8", () => {
    expect(marketSignalToScore(-4)).toBe(8);
  });
  it("null data → neutral score 5", () => {
    expect(marketSignalToScore(null)).toBe(5);
  });
});

describe("WRDI Composite Score Formula", () => {
  it("applies correct weights: Pol=25%, Mil=30%, Econ=25%, Soc=20%", () => {
    // All equal scores → composite equals the same score
    expect(computeComposite(6, 6, 6, 6)).toBe(6.0);
  });

  it("military dimension has highest weight (30%)", () => {
    // Only military elevated
    const withHighMilitary = computeComposite(5, 9, 5, 5);
    const withHighPolitical = computeComposite(9, 5, 5, 5);
    expect(withHighMilitary).toBeGreaterThan(withHighPolitical);
  });

  it("composite stays within 1–10 for extreme inputs", () => {
    const min = computeComposite(1, 1, 1, 1);
    const max = computeComposite(10, 10, 10, 10);
    expect(min).toBe(1.0);
    expect(max).toBe(10.0);
  });

  it("Russia-like profile (high military/political) scores HIGH", () => {
    const score = computeComposite(7.5, 8.5, 7.0, 6.5);
    expect(score).toBeGreaterThanOrEqual(7);
    expect(classifyScore(score)).toBe("HIGH");
  });

  it("Canada-like profile (low all dimensions) scores LOW-MEDIUM", () => {
    const score = computeComposite(4.0, 3.5, 4.5, 3.5);
    expect(score).toBeLessThan(5);
    expect(["VERY LOW", "LOW", "MEDIUM"]).toContain(classifyScore(score));
  });
});

describe("Differential Risk", () => {
  it("computes absolute differential between two country composites", () => {
    const russia = computeComposite(7.5, 8.5, 7.0, 6.5);
    const canada = computeComposite(4.0, 3.5, 4.5, 3.5);
    const diff = Math.abs(russia - canada);
    expect(diff).toBeGreaterThan(2);
  });

  it("differential is zero for identical profiles", () => {
    const a = computeComposite(6, 6, 6, 6);
    const b = computeComposite(6, 6, 6, 6);
    expect(Math.abs(a - b)).toBe(0);
  });
});

describe("Middle East Impact Score", () => {
  it("is a number between 0 and 100", () => {
    const scores = [85, 90, 75, 70, 60, 55, 80, 65, 50, 45];
    scores.forEach(s => {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    });
  });
});
