import { Play, RefreshCcw } from "lucide-react";

import { runPipelineAction } from "@/app/admin/actions";
import { AdminInlineNotice, AdminNotice, AdminPageIntro, AdminSurface, MetricCard, StatusBadge } from "@/components/admin/admin-primitives";
import { getPipelineStatus } from "@/lib/api";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string; noticeType?: "success" | "error" }>;
}) {
  const params = (await searchParams) ?? {};
  const { data: status, error } = await getPipelineStatus();

  return (
    <>
      <AdminNotice notice={params.notice} noticeType={params.noticeType} />
      <AdminInlineNotice message={error} />
      <AdminPageIntro
        title="Pipeline Status"
        description="Monitor worker execution and aggregate job data runs."
        action={
          <div className="flex items-center gap-2">
            <a
              href="/admin/pipeline"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[0_16px_28px_-24px_rgba(11,28,48,0.4)] transition-all duration-300 hover:-translate-y-0.5"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCcw className="size-4" />
                Refresh
              </span>
            </a>
            <form action={runPipelineAction}>
              <input type="hidden" name="redirectTo" value="/admin/pipeline" />
              <button
                type="submit"
                className="floating-soft rounded-xl bg-gradient-to-r from-[#3525cd] to-[#4f46e5] px-5 py-2.5 text-sm font-medium text-white shadow-[0_18px_38px_-18px_rgba(53,37,205,0.75)] transition-all duration-300 hover:-translate-y-0.5"
              >
                <span className="inline-flex items-center gap-2">
                  <Play className="size-4 fill-current" />
                  Trigger Run
                </span>
              </button>
            </form>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.45fr]">
        <AdminSurface className="min-h-[220px]">
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-5 rounded-3xl bg-[#eef3ff] p-6 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <RefreshCcw className="size-10" />
            </div>
            <p className="text-2xl font-semibold tracking-tight text-slate-900">
              {status.running ? "Pipeline Running" : "No Active Runs"}
            </p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">{status.activeMessage}</p>
            {status.lastError ? (
              <p className="mt-4 rounded-xl bg-rose-50 px-4 py-2 text-xs text-rose-700 shadow-[0_12px_24px_-20px_rgba(190,24,93,0.28)]">
                Last error: {status.lastError}
              </p>
            ) : null}
            {!status.running && !status.lastStartedAt ? (
              <p className="mt-4 rounded-xl bg-[#eef3ff] px-4 py-2 text-xs text-slate-600 shadow-[0_12px_24px_-20px_rgba(11,28,48,0.18)]">
                No worker execution snapshot has been recorded yet.
              </p>
            ) : null}
          </div>
        </AdminSurface>

        <AdminSurface title="Last 24 Hours" className="bg-gradient-to-br from-white to-[#eef3ff]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total Jobs Collected"
              value={status.totalJobsCollected.toLocaleString("en-US")}
              detail={`${status.totalSavedJobs.toLocaleString("en-US")} saved / ${status.totalSkippedJobs.toLocaleString("en-US")} skipped`}
            />
            <MetricCard
              label="Avg. Run Duration"
              value={status.averageRunDuration}
              detail={`${status.totalRuns} run${status.totalRuns === 1 ? "" : "s"} in the window`}
            />
            <MetricCard
              label="Success Rate"
              value={`${status.successRate}%`}
              detail={`${status.successfulSources}/${status.totalSources} sources succeeded`}
              tone="success"
            />
            <MetricCard
              label="Scrape Health"
              value={`${status.scrapeHealthPercentage}%`}
              detail={`${status.failedSources} failed source${status.failedSources === 1 ? "" : "s"}`}
              tone={status.failedSources > 0 ? "warning" : "success"}
            />
          </div>
          {status.windowStartedAt && status.windowFinishedAt ? (
            <p className="mt-4 text-xs text-slate-500">
              Window: {formatDateTime(status.windowStartedAt)} - {formatDateTime(status.windowFinishedAt)}
            </p>
          ) : null}
        </AdminSurface>
      </div>

      <div className="mt-6">
        <AdminSurface title="Recent Runs">
          {status.recentRuns.length === 0 ? (
            <div className="rounded-2xl bg-[#eff4ff] px-6 py-12 text-center text-sm text-slate-500">
              No worker run history has been returned yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-[#eff4ff] p-2">
              <div className="hidden grid-cols-[0.7fr_1fr_0.8fr_0.8fr_1fr_1fr_1fr] gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 xl:grid">
                <div>Run ID</div>
                <div>Start Time</div>
                <div>Duration</div>
                <div>Jobs</div>
                <div>Saved / Skipped</div>
                <div>Sources</div>
                <div>State</div>
              </div>

              <div className="space-y-2">
                {status.recentRuns.map((run, index) => (
                  <div
                    key={run.id}
                    className="admin-card-hover grid grid-cols-1 gap-3 rounded-xl bg-white px-4 py-4 shadow-[0_14px_28px_-22px_rgba(11,28,48,0.3)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 xl:grid-cols-[0.7fr_1fr_0.8fr_0.8fr_1fr_1fr_1fr]"
                    style={{ animationDuration: `${220 + index * 65}ms` }}
                  >
                    <div className="flex items-center justify-between gap-3 font-semibold text-slate-700 xl:block">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 xl:hidden">Run ID</span>
                      {run.id}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-500 xl:block">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 xl:hidden">Start Time</span>
                      {formatDateTime(run.startedAt)}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-500 xl:block">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 xl:hidden">Duration</span>
                      {run.duration}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700 xl:block">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 xl:hidden">Jobs</span>
                      {run.jobsCollected.toLocaleString("en-US")}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-500 xl:block">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 xl:hidden">Saved / Skipped</span>
                      <span>
                        <span className="font-medium text-emerald-600">{run.savedJobs?.toLocaleString("en-US") ?? 0}</span>
                        <span className="mx-1">/</span>
                        <span className="text-slate-400">{run.skippedJobs?.toLocaleString("en-US") ?? 0}</span>
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3 text-sm text-slate-500 xl:block">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 xl:hidden">Sources</span>
                      <span>
                        <span className="font-medium text-emerald-600">{run.successCount}</span>
                        <span className="mx-1">/</span>
                        <span className={run.errorCount > 0 ? "font-medium text-rose-600" : "text-slate-400"}>{run.errorCount}</span>
                        <span className="mt-1 block text-xs text-slate-400">
                          {run.scrapeHealth ?? 0}% health
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 xl:block">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 xl:hidden">State</span>
                      <StatusBadge tone={run.errorCount > 0 ? "warning" : "success"}>{run.finalState}</StatusBadge>
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
