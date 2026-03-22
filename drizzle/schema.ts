import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ── Core user table ──────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Country profiles ─────────────────────────────────────────────────────────
// Stores the live, updatable version of each country's intelligence profile.
// The static geopoliticalData.ts seeds this table on first run.
export const countryProfiles = mysqlTable("country_profiles", {
  id: int("id").autoincrement().primaryKey(),
  countryId: varchar("countryId", { length: 8 }).notNull().unique(), // "US", "CN", etc.
  name: varchar("name", { length: 64 }).notNull(),
  flag: varchar("flag", { length: 8 }),
  color: varchar("color", { length: 16 }),
  // JSON arrays stored as text
  economicPillars: json("economicPillars").$type<string[]>().notNull(),
  keyIndicators: json("keyIndicators").$type<string[]>().notNull(),
  vulnerabilities: json("vulnerabilities").$type<string[]>().notNull(),
  strategicAssets: json("strategicAssets").$type<string[]>().notNull(),
  currentPressures: json("currentPressures").$type<string[]>().notNull(),
  middleEastInterests: json("middleEastInterests").$type<string[]>().notNull(),
  geopoliticalPosture: text("geopoliticalPosture").notNull(),
  // WRDI dimension scores (1–10), recalculated by pipeline
  wrdiPolitical: float("wrdiPolitical").default(5.0),
  wrdiMilitary: float("wrdiMilitary").default(5.0),
  wrdiEconomic: float("wrdiEconomic").default(5.0),
  wrdiSocial: float("wrdiSocial").default(5.0),
  wrdiComposite: float("wrdiComposite").default(5.0),
  wrdiTrend: mysqlEnum("wrdiTrend", ["rising", "falling", "stable"]).default("stable"),
  lastPipelineUpdate: timestamp("lastPipelineUpdate"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CountryProfile = typeof countryProfiles.$inferSelect;

// ── Country pair analyses ────────────────────────────────────────────────────
// All 10 bilateral relationships, fully updatable by the pipeline.
export const countryPairs = mysqlTable("country_pairs", {
  id: int("id").autoincrement().primaryKey(),
  pairId: varchar("pairId", { length: 16 }).notNull().unique(), // "US-CN", "US-RU", etc.
  country1: varchar("country1", { length: 8 }).notNull(),
  country2: varchar("country2", { length: 8 }).notNull(),
  relationshipType: mysqlEnum("relationshipType", [
    "Allied", "Competitive", "Hostile", "Transactional", "Mixed"
  ]).notNull(),
  tensionScore: int("tensionScore").notNull(),       // 0–100
  cooperationScore: int("cooperationScore").notNull(), // 0–100
  middleEastImpactScore: int("middleEastImpactScore").notNull(), // 0–100
  economicInterdependency: text("economicInterdependency").notNull(),
  tensionPoints: json("tensionPoints").$type<string[]>().notNull(),
  cooperationAreas: json("cooperationAreas").$type<string[]>().notNull(),
  middleEastDimension: text("middleEastDimension").notNull(),
  politicalAnticipation: json("politicalAnticipation").$type<string[]>().notNull(),
  treatyViability: text("treatyViability").notNull(),
  winnerAssessment: text("winnerAssessment").notNull(),
  leverageHolder: varchar("leverageHolder", { length: 64 }),
  leverageReason: text("leverageReason"),
  dangerousScenario: text("dangerousScenario").notNull(),
  remainingOptions: json("remainingOptions").$type<string[]>().notNull(),
  lastPipelineUpdate: timestamp("lastPipelineUpdate"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CountryPair = typeof countryPairs.$inferSelect;

// ── Middle East scenarios ────────────────────────────────────────────────────
export const middleEastScenarios = mysqlTable("middle_east_scenarios", {
  id: int("id").autoincrement().primaryKey(),
  scenarioId: varchar("scenarioId", { length: 32 }).notNull().unique(),
  title: varchar("title", { length: 256 }).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["Critical", "High", "Medium", "Low"]).notNull(),
  probability: mysqlEnum("probability", ["High", "Medium", "Low"]).notNull(),
  trigger: text("trigger").notNull(),
  economicImpact: text("economicImpact").notNull(),
  politicalImpact: text("politicalImpact").notNull(),
  marketSignals: json("marketSignals").$type<string[]>().notNull(),
  affectedCountries: json("affectedCountries").$type<string[]>().notNull(),
  timeframe: varchar("timeframe", { length: 128 }).notNull(),
  lastPipelineUpdate: timestamp("lastPipelineUpdate"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MiddleEastScenario = typeof middleEastScenarios.$inferSelect;

// ── Pipeline events ──────────────────────────────────────────────────────────
// Every raw event ingested from external sources (GDELT, ACLED, World Bank, etc.)
export const pipelineEvents = mysqlTable("pipeline_events", {
  id: int("id").autoincrement().primaryKey(),
  source: varchar("source", { length: 64 }).notNull(),      // "GDELT", "ACLED", "WorldBank", etc.
  sourceUrl: text("sourceUrl"),
  eventTitle: text("eventTitle").notNull(),
  eventSummary: text("eventSummary"),
  eventDate: timestamp("eventDate"),
  affectedCountries: json("affectedCountries").$type<string[]>().notNull(),
  // WRDI classification
  wrdiDimension: mysqlEnum("wrdiDimension", [
    "political", "military", "economic", "social", "multiple"
  ]),
  severityScore: float("severityScore"),   // 1–10
  relevanceScore: float("relevanceScore"), // 0–1, how relevant to Middle East
  // Processing status
  processed: boolean("processed").default(false),
  appliedToKnowledgeBase: boolean("appliedToKnowledgeBase").default(false),
  rawData: json("rawData"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
});

export type PipelineEvent = typeof pipelineEvents.$inferSelect;

// ── Knowledge base change log ────────────────────────────────────────────────
// Audit trail: every automated update to country profiles, pairs, or scenarios.
export const kbChangelog = mysqlTable("kb_changelog", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", [
    "country_profile", "country_pair", "scenario"
  ]).notNull(),
  entityId: varchar("entityId", { length: 32 }).notNull(), // countryId, pairId, or scenarioId
  fieldChanged: varchar("fieldChanged", { length: 128 }).notNull(),
  previousValue: text("previousValue"),
  newValue: text("newValue"),
  triggeringEventIds: json("triggeringEventIds").$type<number[]>(),
  pipelineRunId: varchar("pipelineRunId", { length: 64 }),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type KbChangelog = typeof kbChangelog.$inferSelect;

// ── Pipeline run log ─────────────────────────────────────────────────────────
// One record per scheduled pipeline execution.
export const pipelineRuns = mysqlTable("pipeline_runs", {
  id: int("id").autoincrement().primaryKey(),
  runId: varchar("runId", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["running", "completed", "failed"]).notNull(),
  sourcesQueried: json("sourcesQueried").$type<string[]>(),
  eventsIngested: int("eventsIngested").default(0),
  eventsClassified: int("eventsClassified").default(0),
  kbFieldsUpdated: int("kbFieldsUpdated").default(0),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type PipelineRun = typeof pipelineRuns.$inferSelect;

// ── WRDI metric definitions ──────────────────────────────────────────────────
// Definitions shown on hover for every metric in the UI.
export const wrdiMetricDefinitions = mysqlTable("wrdi_metric_definitions", {
  id: int("id").autoincrement().primaryKey(),
  metricKey: varchar("metricKey", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 128 }).notNull(),
  dimension: mysqlEnum("dimension", [
    "political", "military", "economic", "social", "composite"
  ]).notNull(),
  weight: float("weight"),           // e.g. 0.25 for political
  definition: text("definition").notNull(),
  dataSource: varchar("dataSource", { length: 256 }),
  scaleDescription: text("scaleDescription"), // What 1, 5, 10 mean for this metric
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WrdiMetricDefinition = typeof wrdiMetricDefinitions.$inferSelect;
