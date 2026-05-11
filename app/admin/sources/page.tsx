import { Plus, Radio } from "lucide-react";

import { AdminInlineNotice, AdminNotice, AdminPageIntro, AdminSurface, MetricCard, StatusBadge } from "@/components/admin/admin-primitives";
import { getAdminSources, getScrapeHealthSummary, getSystemHealth } from "@/lib/api";

export default async function SourcesPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string; noticeType?: "success" | "error" }>;
}) {
  const params = (await searchParams) ?? {};
  const [sourcesResult, healthResult, scrapeHealthResult] = await Promise.all([
    getAdminSources(),
    getSystemHealth(),
    getScrapeHealthSummary(),
  ]);
  const sources = sourcesResult.data;
  const health = healthResult.data;
  const scrapeHealth = scrapeHealthResult.data;
  const activeSources = sources.filter((source) => source.active);
  const sourcesNotice = sourcesResult.error || scrapeHealthResult.error || healthResult.error;
  const systemHealthLabel = formatSystemHealth(health.status, health.database, scrapeHealth.scrapeHealthPercentage);
  const systemHealthTone = getSystemHealthTone(health.status, health.database, scrapeHealth.scrapeHealthPercentage);

  return (
    <>
      <AdminNotice notice={params.notice} noticeType={params.noticeType} />
      <AdminInlineNotice message={sourcesNotice} />
      <AdminPageIntro
        eyebrow="Data Infrastructure"
        title="Scraping Sources"
        description="Manage and monitor target websites for job aggregation. Active sources run on configured schedules."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl bg-gradient-to-r from-[#3525cd] to-[#4f46e5] px-5 py-2.5 text-sm font-medium text-white shadow-[0_18px_38px_-18px_rgba(53,37,205,0.75)] transition-all duration-300 hover:-translate-y-0.5"
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="size-4" />
                Add Source
              </span>
            </button>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <MetricCard
          label="Active Sources"
          value={activeSources.length}
          detail={`/ ${sources.length} total`}
          icon={<Radio className="size-4 text-[#4f46e5]" />}
        >
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e5eeff]">
            <div className="rounded-full bg-gradient-to-r from-[#6e5dff] to-[#4f46e5]" style={{ width: `${(activeSources.length / Math.max(sources.length, 1)) * 100}%`, height: "100%" }} />
          </div>
        </MetricCard>
        <MetricCard
          label="24h Success Rate"
          value={`${scrapeHealth.successRatePercentage}%`}
          detail={`${scrapeHealth.successfulSources}/${scrapeHealth.totalSources} sources succeeded`}
          tone={scrapeHealth.failedSources > 0 ? "warning" : "success"}
        />
        <MetricCard
          label="System Health"
          value={systemHealthLabel}
          detail={`API: ${health.status} | DB: ${health.database} | Scrape health: ${scrapeHealth.scrapeHealthPercentage}%`}
          tone={systemHealthTone}
        />
      </div>

      <div className="mt-6">
        {sources.length === 0 ? (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-[0_16px_30px_-24px_rgba(11,28,48,0.18)] dark:border-slate-700/70 dark:bg-slate-900/84 dark:text-slate-300">
            Internal sources endpoint is connected, but no source rows are available yet.
          </div>
        ) : null}
        <AdminSurface title="Configured Targets">
          {sources.length === 0 ? (
            <div className="rounded-2xl bg-[#eff4ff] px-6 py-12 text-center text-sm text-slate-500 dark:bg-slate-950/40">
              No sources returned by the internal API yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-[#eff4ff] p-2 dark:bg-slate-950/40">
              <div className="hidden grid-cols-[1.5fr_0.95fr_0.95fr_0.75fr] gap-3 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 lg:grid">
                <div>Source Name & Domain</div>
                <div>Mode</div>
                <div>Last Scraped</div>
                <div>Status</div>
              </div>

              <div className="space-y-1.5">
                {sources.map((source, index) => (
                  <div
                    key={source.id}
                    className="admin-card-hover grid grid-cols-1 gap-3 rounded-lg bg-white px-3 py-3 shadow-[0_14px_28px_-22px_rgba(11,28,48,0.3)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 dark:bg-slate-900/84 lg:grid-cols-[1.5fr_0.95fr_0.95fr_0.75fr]"
                    style={{ animationDuration: `${220 + index * 65}ms` }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{source.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{source.domain}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:block">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 lg:hidden">Mode</span>
                      <span className="inline-flex rounded-lg bg-[#eef3ff] px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800/90 dark:text-slate-300">
                        {formatMode(source.mode)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-500 lg:block">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 lg:hidden">Last Scraped</span>
                      <span>
                        {source.lastScrapedAt ? formatRelative(source.lastScrapedAt) : "Paused"}
                        <span className="mt-0.5 block text-[11px] text-slate-400">Int: {source.scrapeIntervalMinutes}m</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:block">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 lg:hidden">Status</span>
                      <StatusBadge tone={source.active ? "primary" : "neutral"}>{source.active ? "Active" : "Paused"}</StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AdminSurface>
      </div>
    </>
  );
}

function formatSystemHealth(apiStatus: string, database: string, scrapeHealthPercentage: number) {
  if (apiStatus === "healthy" && database === "connected" && scrapeHealthPercentage >= 95) {
    return "Healthy";
  }
  if (apiStatus === "healthy" && database === "connected") {
    return "Warning";
  }
  if (database === "disabled") {
    return "DB Disabled";
  }
  if (apiStatus === "degraded" || database === "unhealthy") {
    return "Degraded";
  }
  return "?";
}

function getSystemHealthTone(
  apiStatus: string,
  database: string,
  scrapeHealthPercentage: number,
): "neutral" | "primary" | "success" | "warning" {
  if (apiStatus === "healthy" && database === "connected" && scrapeHealthPercentage >= 95) {
    return "success";
  }
  if (database === "disabled" || apiStatus === "degraded" || database === "unhealthy") {
    return "warning";
  }
  return "primary";
}

function formatMode(mode: string) {
  return mode.split("_").map((token) => token.charAt(0).toUpperCase() + token.slice(1)).join(" ");
}

function formatRelative(value: string) {
  const diffInMinutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  const hours = Math.round(diffInMinutes / 60);
  if (hours < 24) return `${hours} hrs ago`;
  return `${Math.round(hours / 24)} days ago`;
}
