import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { geopolRouter } from "../geopol";
import { runPipeline } from "../pipeline";

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
    // Run immediately on startup (after 30s delay to let DB settle),
    // then every 6 hours.
    const PIPELINE_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
    const STARTUP_DELAY_MS = 30 * 1000; // 30 seconds

    setTimeout(() => {
      console.log("[Pipeline] Running initial pipeline on startup...");
      runPipeline()
        .then(result => console.log(`[Pipeline] Startup run complete: ${JSON.stringify(result)}`))
        .catch(e => console.error("[Pipeline] Startup run failed:", e));

      // Schedule recurring runs every 6 hours
      setInterval(() => {
        console.log("[Pipeline] Running scheduled pipeline...");
        runPipeline()
          .then(result => console.log(`[Pipeline] Scheduled run complete: ${JSON.stringify(result)}`))
          .catch(e => console.error("[Pipeline] Scheduled run failed:", e));
      }, PIPELINE_INTERVAL_MS);
    }, STARTUP_DELAY_MS);
  });
}

startServer().catch(console.error);
