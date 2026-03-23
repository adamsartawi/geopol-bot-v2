import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { geopolRouter } from "../geopol";
import { runPipeline, runFastPipeline } from "../pipeline";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Geopolitical intelligence routes (LLM streaming + market data proxy)
  app.use(geopolRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // ── Automated Intelligence Pipeline Scheduler ────────────────────────────
    //
    // TWO-CADENCE DESIGN:
    //   FAST  (every 15 min) — RSS feeds + GDELT only. Low cost, high freshness.
    //   FULL  (every 6 hrs)  — All sources: ACLED, World Bank, IMF, UNHCR, EIA + RSS + GDELT.
    //
    // On startup: run FULL once (after 30s), then start both intervals.

    const FAST_INTERVAL_MS  = 15 * 60 * 1000;       // 15 minutes
    const FULL_INTERVAL_MS  = 6 * 60 * 60 * 1000;   // 6 hours
    const STARTUP_DELAY_MS  = 30 * 1000;             // 30 seconds

    // Track whether a fast run is currently in progress to avoid overlap
    let fastRunning = false;
    let fullRunning = false;

    setTimeout(() => {
      // ── Startup: run FULL pipeline once ──────────────────────────────────
      console.log("[Pipeline] Running initial FULL pipeline on startup...");
      fullRunning = true;
      runPipeline()
        .then(result => {
          fullRunning = false;
          console.log(`[Pipeline:FULL] Startup run complete: ${JSON.stringify(result)}`);
        })
        .catch(e => {
          fullRunning = false;
          console.error("[Pipeline:FULL] Startup run failed:", e);
        });

      // ── Fast pipeline: every 15 minutes ──────────────────────────────────
      setInterval(() => {
        if (fastRunning || fullRunning) {
          console.log("[Pipeline:FAST] Skipping — another run already in progress");
          return;
        }
        console.log("[Pipeline:FAST] Running scheduled fast pipeline (RSS + GDELT)...");
        fastRunning = true;
        runFastPipeline()
          .then(result => {
            fastRunning = false;
            console.log(`[Pipeline:FAST] Scheduled run complete: ${JSON.stringify(result)}`);
          })
          .catch(e => {
            fastRunning = false;
            console.error("[Pipeline:FAST] Scheduled run failed:", e);
          });
      }, FAST_INTERVAL_MS);

      // ── Full pipeline: every 6 hours ──────────────────────────────────────
      setInterval(() => {
        if (fullRunning) {
          console.log("[Pipeline:FULL] Skipping — full run already in progress");
          return;
        }
        console.log("[Pipeline:FULL] Running scheduled full pipeline (all sources)...");
        fullRunning = true;
        runPipeline()
          .then(result => {
            fullRunning = false;
            console.log(`[Pipeline:FULL] Scheduled run complete: ${JSON.stringify(result)}`);
          })
          .catch(e => {
            fullRunning = false;
            console.error("[Pipeline:FULL] Scheduled run failed:", e);
          });
      }, FULL_INTERVAL_MS);

    }, STARTUP_DELAY_MS);
  });
}

startServer().catch(console.error);
