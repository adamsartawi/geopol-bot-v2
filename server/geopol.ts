// ============================================================
// GEOPOLITICAL INTELLIGENCE ENGINE — Server Routes
// Handles: LLM streaming chat, market data proxy, fact-check
// ============================================================

import { Router, Request, Response } from "express";
import { ENV } from "./_core/env";
import { factCheckUserClaim } from "./factcheck";
import { getDb } from "./db";
import { countryProfiles, countryPairs, middleEastScenarios } from "../drizzle/schema";

export const geopolRouter = Router();

// ── Market Data Proxy ──────────────────────────────────────
geopolRouter.get("/api/market-data", async (req: Request, res: Response) => {
  const { symbol } = req.query as { symbol?: string };
  if (!symbol) {
    res.status(400).json({ error: "symbol required" });
    return;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GeopolBot/1.0)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      res.status(response.status).json({ error: "Yahoo Finance error" });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "fetch error";
    res.status(500).json({ error: message });
  }
});

// ── Fact-Check Endpoint ────────────────────────────────────
// Verifies a user claim against external sources and updates KB
geopolRouter.post("/api/geopol/factcheck", async (req: Request, res: Response) => {
  const { message } = req.body as { message?: string };
  if (!message) {
    res.status(400).json({ error: "message required" });
    return;
  }
  try {
    const result = await factCheckUserClaim(message);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Fact-check error";
    console.error("[FactCheck] Error:", msg);
    res.status(500).json({ error: msg });
  }
});

// ── KB Snapshot Endpoint ───────────────────────────────────
// Returns live DB state for building the system prompt with fresh data
geopolRouter.get("/api/geopol/kb-snapshot", async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      res.json({ countries: [], pairs: [], scenarios: [] });
      return;
    }
    const [countries, pairs, scenarios] = await Promise.all([
      db.select().from(countryProfiles),
      db.select().from(countryPairs),
      db.select().from(middleEastScenarios),
    ]);
    res.json({ countries, pairs, scenarios });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "KB snapshot error";
    res.status(500).json({ error: msg });
  }
});

// ── LLM Chat via Gemini API (SSE-compatible) ──────────────
// Calls Gemini generateContent and streams the response as SSE
geopolRouter.post("/api/geopol/chat", async (req: Request, res: Response) => {
  const { messages } = req.body as {
    messages: Array<{ role: string; content: string }>;
  };

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages array required" });
    return;
  }

  const apiKey = ENV.geminiApiKey;
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    return;
  }

  try {
    // Separate system prompt from conversation
    let systemInstruction: { parts: Array<{ text: string }> } | undefined;
    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        systemInstruction = { parts: [{ text: msg.content }] };
        continue;
      }
      const geminiRole = msg.role === "assistant" ? "model" : "user";
      const last = contents[contents.length - 1];
      if (last && last.role === geminiRole) {
        last.parts.push({ text: msg.content });
      } else {
        contents.push({ role: geminiRole, parts: [{ text: msg.content }] });
      }
    }

    // Ensure last message is from user
    if (contents.length === 0 || contents[contents.length - 1].role !== "user") {
      contents.push({ role: "user", parts: [{ text: "Continue." }] });
    }

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: 1200,
        temperature: 0.3,
      },
    };
    if (systemInstruction) body.systemInstruction = systemInstruction;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: errorText });
      return;
    }

    const geminiRes = await response.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
    };

    const text = geminiRes.candidates?.[0]?.content?.parts
      ?.map(p => p.text ?? "")
      .join("") ?? "";

    // Emit as SSE stream (simulate streaming by chunking the text)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Stream in ~30-char chunks for smooth UI rendering
    const CHUNK_SIZE = 30;
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      const chunk = text.slice(i, i + CHUNK_SIZE);
      const sseData = JSON.stringify({
        choices: [{ delta: { content: chunk }, index: 0 }],
      });
      res.write(`data: ${sseData}\n\n`);
      if (typeof (res as unknown as { flush?: () => void }).flush === "function") {
        (res as unknown as { flush: () => void }).flush();
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
});
