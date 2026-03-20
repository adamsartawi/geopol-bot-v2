// ============================================================
// GEOPOLITICAL INTELLIGENCE ENGINE — Server Routes
// Handles: LLM streaming chat, market data proxy
// ============================================================

import { Router, Request, Response } from "express";
import { ENV } from "./_core/env";

export const geopolRouter = Router();

// ── Market Data Proxy ──────────────────────────────────────
// Fetches Yahoo Finance data server-side to avoid CORS issues
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

// ── LLM Streaming Chat ─────────────────────────────────────
// Proxies streaming requests to Forge API using server-side key
geopolRouter.post("/api/geopol/chat", async (req: Request, res: Response) => {
  const { messages } = req.body as {
    messages: Array<{ role: string; content: string }>;
  };

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages array required" });
    return;
  }

  const forgeUrl = ENV.forgeApiUrl
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

  try {
    const response = await fetch(forgeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages,
        stream: true,
        max_tokens: 2000,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: errorText });
      return;
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Pipe the stream
    const reader = response.body?.getReader();
    if (!reader) {
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim()) {
              res.write(line + "\n");
            }
          }
          // Flush to client
          if (typeof (res as unknown as { flush?: () => void }).flush === "function") {
            (res as unknown as { flush: () => void }).flush();
          }
        }
      } catch {
        // Client disconnected
      } finally {
        res.write("data: [DONE]\n\n");
        res.end();
      }
    };

    pump();

    // Handle client disconnect
    req.on("close", () => {
      reader.cancel();
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
});
