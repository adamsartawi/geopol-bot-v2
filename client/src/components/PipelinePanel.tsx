/**
 * PipelinePanel — Automated Intelligence Pipeline Monitor
 *
 * Shows pipeline run history, recent events ingested, KB changelog,
 * and allows admin to manually trigger a run.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Activity, RefreshCw, CheckCircle, XCircle, Clock,
  Database, Globe, FileText, ChevronDown, ChevronRight,
  Zap, AlertTriangle, Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(date: Date | string | null): string {
  if (!date) return "never";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === "completed") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
      style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)" }}>
      <CheckCircle size={10} /> COMPLETED
    </span>
  );
  if (status === "running") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono animate-pulse"
      style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }}>
      <Activity size={10} /> RUNNING
    </span>
  );
  if (status === "failed") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
      style={{ background: "rgba(255,59,48,0.1)", color: "#ff3b30", border: "1px solid rgba(255,59,48,0.3)" }}>
      <XCircle size={10} /> FAILED
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
      style={{ background: "rgba(255,255,255,0.05)", color: "#888", border: "1px solid rgba(255,255,255,0.1)" }}>
      <Clock size={10} /> PENDING
    </span>
  );
}

function DimensionBadge({ dimension }: { dimension: string | null }) {
  const colors: Record<string, { bg: string; text: string }> = {
    political: { bg: "rgba(0,212,255,0.1)", text: "#00d4ff" },
    military: { bg: "rgba(255,59,48,0.1)", text: "#ff3b30" },
    economic: { bg: "rgba(255,193,7,0.1)", text: "#ffc107" },
    social: { bg: "rgba(0,255,136,0.1)", text: "#00ff88" },
    multiple: { bg: "rgba(255,255,255,0.05)", text: "#aaa" },
  };
  const c = colors[dimension ?? "multiple"] ?? colors.multiple;
  return (
    <span className="px-1.5 py-0.5 rounded text-xs font-mono uppercase"
      style={{ background: c.bg, color: c.text }}>
      {dimension ?? "—"}
    </span>
  );
}

// ── Sub-panels ───────────────────────────────────────────────────────────────
function RunTypeBadge({ runId }: { runId: string }) {
  const isFast = runId.startsWith("fast-");
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
      style={isFast
        ? { background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }
        : { background: "rgba(255,193,7,0.08)", color: "#ffc107", border: "1px solid rgba(255,193,7,0.2)" }}>
      {isFast ? <Zap size={9} /> : <Database size={9} />}
      {isFast ? "FAST" : "FULL"}
    </span>
  );
}

function RunHistoryPanel() {
  const { data: runs, isLoading, refetch } = trpc.pipeline.runs.useQuery({ limit: 15 });

  if (isLoading) return (
    <div className="flex items-center justify-center py-8" style={{ color: "#555" }}>
      <Activity size={16} className="animate-spin mr-2" /> Loading run history...
    </div>
  );

  if (!runs?.length) return (
    <div className="text-center py-8" style={{ color: "#555", fontSize: "13px" }}>
      No pipeline runs yet. The first run starts 30 seconds after server startup.
    </div>
  );

  return (
    <div className="space-y-2">
      {runs.map(run => (
        <div key={run.runId} className="rounded-lg p-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <RunTypeBadge runId={run.runId} />
              <StatusBadge status={run.status} />
              <span className="font-mono text-xs" style={{ color: "#555" }}>
                {timeAgo(run.startedAt)}
              </span>
            </div>
            <span className="font-mono text-xs" style={{ color: "#444" }}>
              {run.runId.replace("fast-", "").slice(0, 8)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center">
              <div className="font-mono text-sm font-bold" style={{ color: "#00d4ff" }}>
                {run.eventsIngested ?? 0}
              </div>
              <div className="text-xs" style={{ color: "#555" }}>ingested</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-sm font-bold" style={{ color: "#ffc107" }}>
                {run.eventsClassified ?? 0}
              </div>
              <div className="text-xs" style={{ color: "#555" }}>classified</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-sm font-bold" style={{ color: "#00ff88" }}>
                {run.kbFieldsUpdated ?? 0}
              </div>
              <div className="text-xs" style={{ color: "#555" }}>KB updates</div>
            </div>
          </div>
          {run.sourcesQueried && (run.sourcesQueried as string[]).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {(run.sourcesQueried as string[]).map(s => (
                <span key={s} className="px-1.5 py-0.5 rounded text-xs font-mono"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#777" }}>
                  {s}
                </span>
              ))}
            </div>
          )}
          {run.errorMessage && (
            <div className="mt-2 text-xs font-mono rounded p-2"
              style={{ background: "rgba(255,59,48,0.08)", color: "#ff3b30" }}>
              {run.errorMessage}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EventLogPanel() {
  const { data: events, isLoading } = trpc.pipeline.recentEvents.useQuery({ limit: 20 });
  const [expanded, setExpanded] = useState<number | null>(null);

  if (isLoading) return (
    <div className="flex items-center justify-center py-8" style={{ color: "#555" }}>
      <Activity size={16} className="animate-spin mr-2" /> Loading events...
    </div>
  );

  if (!events?.length) return (
    <div className="text-center py-8" style={{ color: "#555", fontSize: "13px" }}>
      No events ingested yet. Waiting for first pipeline run.
    </div>
  );

  return (
    <div className="space-y-1.5">
      {events.map((event, idx) => (
        <div key={idx} className="rounded-lg overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            className="w-full text-left p-3 flex items-start gap-2"
            onClick={() => setExpanded(expanded === idx ? null : idx)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-1.5 py-0.5 rounded text-xs font-mono"
                  style={{
                    background: ["TASS","RT","Sputnik","Xinhua","GlobalTimes","CGTN","IRNA","PressTV","Mehr"].includes(event.source ?? "")
                      ? "rgba(255,59,48,0.08)" : "rgba(255,255,255,0.06)",
                    color: ["TASS","RT","Sputnik","Xinhua","GlobalTimes","CGTN","IRNA","PressTV","Mehr"].includes(event.source ?? "")
                      ? "#ff6b6b" : "#888",
                    border: ["TASS","RT","Sputnik","Xinhua","GlobalTimes","CGTN","IRNA","PressTV","Mehr"].includes(event.source ?? "")
                      ? "1px solid rgba(255,59,48,0.2)" : "none",
                  }}>
                  {["TASS","RT","Sputnik","Xinhua","GlobalTimes","CGTN","IRNA","PressTV","Mehr"].includes(event.source ?? "") ? "⚑ " : ""}{event.source}
                </span>
                {event.wrdiDimension && <DimensionBadge dimension={event.wrdiDimension} />}
                {event.severityScore != null && (
                  <span className="text-xs font-mono" style={{ color: event.severityScore >= 7 ? "#ff3b30" : event.severityScore >= 5 ? "#ffc107" : "#555" }}>
                    ⚡ {Number(event.severityScore).toFixed(1)}
                  </span>
                )}
                <span className="text-xs font-mono ml-auto" style={{ color: "#444" }}>
                  {timeAgo(event.fetchedAt)}
                </span>
              </div>
              <div className="text-xs font-mono truncate" style={{ color: "#aaa" }}>
                {event.eventTitle}
              </div>
            </div>
            {expanded === idx ? <ChevronDown size={12} style={{ color: "#555", flexShrink: 0 }} /> : <ChevronRight size={12} style={{ color: "#555", flexShrink: 0 }} />}
          </button>
          {expanded === idx && (
            <div className="px-3 pb-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: "#888" }}>
                {event.eventSummary}
              </p>
              {event.affectedCountries && (event.affectedCountries as string[]).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-xs" style={{ color: "#555" }}>Affects:</span>
                  {(event.affectedCountries as string[]).map(c => (
                    <span key={c} className="px-1.5 py-0.5 rounded text-xs font-mono"
                      style={{ background: "rgba(0,212,255,0.08)", color: "#00d4ff" }}>
                      {c}
                    </span>
                  ))}
                </div>
              )}
              {event.appliedToKnowledgeBase && (
                <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: "#00ff88" }}>
                  <CheckCircle size={10} /> Applied to knowledge base
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ChangelogPanel() {
  const { data: changes, isLoading } = trpc.pipeline.changelog.useQuery({ limit: 20 });

  if (isLoading) return (
    <div className="flex items-center justify-center py-8" style={{ color: "#555" }}>
      <Activity size={16} className="animate-spin mr-2" /> Loading changelog...
    </div>
  );

  if (!changes?.length) return (
    <div className="text-center py-8" style={{ color: "#555", fontSize: "13px" }}>
      No knowledge base changes yet. Changes appear after the first pipeline run classifies high-severity events.
    </div>
  );

  return (
    <div className="space-y-2">
      {changes.map((change, idx) => (
        <div key={idx} className="rounded-lg p-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-1.5 py-0.5 rounded text-xs font-mono"
              style={{ background: "rgba(0,255,136,0.08)", color: "#00ff88" }}>
              {change.entityType}
            </span>
            <span className="font-mono text-xs font-bold" style={{ color: "#00d4ff" }}>
              {change.entityId}
            </span>
            <span className="font-mono text-xs" style={{ color: "#ffc107" }}>
              .{change.fieldChanged}
            </span>
            <span className="text-xs font-mono ml-auto" style={{ color: "#444" }}>
              {timeAgo(change.changedAt)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded p-2" style={{ background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.15)" }}>
              <div className="text-xs mb-1" style={{ color: "#ff3b30" }}>PREVIOUS</div>
              <div className="text-xs font-mono leading-relaxed" style={{ color: "#888" }}>
                {(change.previousValue ?? "").slice(0, 120)}{(change.previousValue ?? "").length > 120 ? "…" : ""}
              </div>
            </div>
            <div className="rounded p-2" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.15)" }}>
              <div className="text-xs mb-1" style={{ color: "#00ff88" }}>UPDATED</div>
              <div className="text-xs font-mono leading-relaxed" style={{ color: "#ccc" }}>
                {(change.newValue ?? "").slice(0, 120)}{(change.newValue ?? "").length > 120 ? "…" : ""}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PipelinePanel() {
  const [activeTab, setActiveTab] = useState<"runs" | "events" | "changelog">("runs");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: latestRun, refetch: refetchLatest } = trpc.pipeline.latestRun.useQuery();
  const triggerMutation = trpc.pipeline.trigger.useMutation({
    onSuccess: () => {
      setTimeout(() => refetchLatest(), 2000);
    },
  });

  const tabs = [
    { id: "runs" as const, label: "RUNS", icon: Activity },
    { id: "events" as const, label: "EVENTS", icon: Globe },
    { id: "changelog" as const, label: "KB CHANGES", icon: Database },
  ];

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: "#ffc107" }} />
            <span className="text-sm font-bold tracking-widest" style={{ color: "#ffc107" }}>
              INTELLIGENCE PIPELINE
            </span>
          </div>
          {isAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => triggerMutation.mutate()}
                  disabled={triggerMutation.isPending || latestRun?.status === "running"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all"
                  style={{
                    background: triggerMutation.isPending ? "rgba(255,193,7,0.05)" : "rgba(255,193,7,0.1)",
                    border: "1px solid rgba(255,193,7,0.3)",
                    color: "#ffc107",
                    cursor: triggerMutation.isPending ? "not-allowed" : "pointer",
                    opacity: triggerMutation.isPending ? 0.6 : 1,
                  }}
                >
                  <RefreshCw size={10} className={triggerMutation.isPending ? "animate-spin" : ""} />
                  {triggerMutation.isPending ? "RUNNING..." : "RUN NOW"}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manually trigger a full pipeline run (admin only)</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Latest run summary */}
        {latestRun && (
          <div className="rounded-lg p-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge status={latestRun.status} />
                <span className="text-xs font-mono" style={{ color: "#555" }}>
                  Last run {timeAgo(latestRun.startedAt)}
                </span>
              </div>
              <span className="text-xs font-mono" style={{ color: "#555" }}>
                {latestRun.runId?.startsWith("fast-")
                  ? `Next fast: ~${Math.max(0, 15 - Math.floor((Date.now() - new Date(latestRun.startedAt ?? Date.now()).getTime()) / 60000))}m`
                  : `Next full: ~${Math.max(0, 360 - Math.floor((Date.now() - new Date(latestRun.startedAt ?? Date.now()).getTime()) / 60000))}m`
                }
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div className="text-center">
                <div className="font-mono text-lg font-bold" style={{ color: "#00d4ff" }}>
                  {latestRun.eventsIngested ?? 0}
                </div>
                <div className="text-xs" style={{ color: "#555" }}>events in</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-lg font-bold" style={{ color: "#ffc107" }}>
                  {latestRun.eventsClassified ?? 0}
                </div>
                <div className="text-xs" style={{ color: "#555" }}>classified</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-lg font-bold" style={{ color: "#00ff88" }}>
                  {latestRun.kbFieldsUpdated ?? 0}
                </div>
                <div className="text-xs" style={{ color: "#555" }}>KB updated</div>
              </div>
            </div>
          </div>
        )}

        {!latestRun && (
          <div className="rounded-lg p-3 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Clock size={14} className="mx-auto mb-1" style={{ color: "#555" }} />
            <p className="text-xs font-mono" style={{ color: "#555" }}>
              First run starts 30s after server startup
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono tracking-wider transition-all"
              style={{
                color: isActive ? "#ffc107" : "#555",
                borderBottom: isActive ? "2px solid #ffc107" : "2px solid transparent",
                background: isActive ? "rgba(255,193,7,0.04)" : "transparent",
              }}
            >
              <Icon size={10} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "runs" && <RunHistoryPanel />}
        {activeTab === "events" && <EventLogPanel />}
        {activeTab === "changelog" && <ChangelogPanel />}
      </div>

      {/* Footer note */}
      <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-start gap-2">
          <Info size={10} className="mt-0.5 shrink-0" style={{ color: "#444" }} />
          <p className="text-xs leading-relaxed" style={{ color: "#444" }}>
            Fast pipeline (RSS + GDELT) runs every 15 min. Full pipeline (+ ACLED, World Bank, IMF, UNHCR, EIA) runs every 6h.
            State media sources (⚑) are flagged. Events with severity ≥ 6 trigger knowledge base updates.
          </p>
        </div>
      </div>
    </div>
  );
}
