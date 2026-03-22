import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  pipelineRuns, pipelineEvents, kbChangelog,
  countryProfiles, countryPairs, middleEastScenarios,
  wrdiMetricDefinitions,
} from "../drizzle/schema";
import { desc, eq, and, gte } from "drizzle-orm";
import { runPipeline } from "./pipeline";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Knowledge Base ─────────────────────────────────────────────────────────
  kb: router({
    /** Get all country profiles with live WRDI scores */
    countries: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(countryProfiles).orderBy(countryProfiles.countryId);
    }),

    /** Get a single country profile */
    country: publicProcedure
      .input(z.object({ countryId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const [profile] = await db
          .select()
          .from(countryProfiles)
          .where(eq(countryProfiles.countryId, input.countryId))
          .limit(1);
        return profile ?? null;
      }),

    /** Get all country pairs */
    pairs: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(countryPairs).orderBy(countryPairs.pairId);
    }),

    /** Get a single country pair */
    pair: publicProcedure
      .input(z.object({ pairId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const [pair] = await db
          .select()
          .from(countryPairs)
          .where(eq(countryPairs.pairId, input.pairId))
          .limit(1);
        return pair ?? null;
      }),

    /** Get all Middle East scenarios */
    scenarios: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(middleEastScenarios).orderBy(middleEastScenarios.riskLevel);
    }),

    /** Get all WRDI metric definitions (for hover tooltips) */
    metricDefinitions: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(wrdiMetricDefinitions).orderBy(wrdiMetricDefinitions.dimension);
    }),

    /** Get a single metric definition by key */
    metricDefinition: publicProcedure
      .input(z.object({ metricKey: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const [def] = await db
          .select()
          .from(wrdiMetricDefinitions)
          .where(eq(wrdiMetricDefinitions.metricKey, input.metricKey))
          .limit(1);
        return def ?? null;
      }),
  }),

  // ── Pipeline ───────────────────────────────────────────────────────────────
  pipeline: router({
    /** Manually trigger a pipeline run (admin only) */
    trigger: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Admin access required");
      }
      // Run async — don't await so the response returns immediately
      runPipeline().catch(e => console.error("[Pipeline] Manual trigger failed:", e));
      return { triggered: true, message: "Pipeline started in background" };
    }),

    /** Get recent pipeline runs */
    runs: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db
          .select()
          .from(pipelineRuns)
          .orderBy(desc(pipelineRuns.startedAt))
          .limit(input.limit);
      }),

    /** Get the latest pipeline run status */
    latestRun: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return null;
      const [run] = await db
        .select()
        .from(pipelineRuns)
        .orderBy(desc(pipelineRuns.startedAt))
        .limit(1);
      return run ?? null;
    }),

    /** Get recent pipeline events */
    recentEvents: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(20),
        countryId: z.string().optional(),
        source: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db
          .select()
          .from(pipelineEvents)
          .orderBy(desc(pipelineEvents.fetchedAt))
          .limit(input.limit);
      }),

    /** Get knowledge base change log */
    changelog: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(20),
        entityType: z.enum(["country_profile", "country_pair", "scenario"]).optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db
          .select()
          .from(kbChangelog)
          .orderBy(desc(kbChangelog.changedAt))
          .limit(input.limit);
      }),

    /** Get pipeline statistics summary */
    stats: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return null;

      const [latestRun] = await db
        .select()
        .from(pipelineRuns)
        .where(eq(pipelineRuns.status, "completed"))
        .orderBy(desc(pipelineRuns.startedAt))
        .limit(1);

      const recentChanges = await db
        .select()
        .from(kbChangelog)
        .orderBy(desc(kbChangelog.changedAt))
        .limit(5);

      const recentEvents = await db
        .select()
        .from(pipelineEvents)
        .where(eq(pipelineEvents.processed, true))
        .orderBy(desc(pipelineEvents.fetchedAt))
        .limit(10);

      return {
        lastRunAt: latestRun?.completedAt ?? null,
        lastRunStatus: latestRun?.status ?? null,
        totalEventsLastRun: latestRun?.eventsIngested ?? 0,
        kbUpdatesLastRun: latestRun?.kbFieldsUpdated ?? 0,
        recentChanges,
        recentEvents,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
