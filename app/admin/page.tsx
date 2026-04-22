import {
  AlertTriangle,
  Check,
  Database,
  Eye,
  MousePointerClick,
  Play,
  Search,
  UsersRound,
} from "lucide-react";

import { runPipelineAction } from "@/app/admin/actions";
import { AdminInlineNotice, AdminNotice, AdminPageIntro, AdminSurface, MetricCard, StatusBadge } from "@/components/admin/admin-primitives";
import { getAdminAnalyticsSummary, getAdminJobs, getAdminOverview } from "@/lib/api";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string; noticeType?: "success" | "error" }>;
}) {
  const params = (await searchParams) ?? {};
  const [overviewResult, jobsResult, analyticsResult] = await Promise.all([
    getAdminOverview(),
    getAdminJobs(),
    getAdminAnalyticsSummary(5),
  ]);
  const overview = overviewResult.data;
  const jobs = jobsResult.data;
  const analytics = analyticsResult.data;
  const dashboardNotice = overviewResult.error || jobsResult.error || analyticsResult.error;

  const metricCards = [
    { label: "Published Jobs", value: formatMetricValue(overview.publishedJobs), detail: "approved jobs", icon: <Check className="size-4 text-emerald-600" />, tone: "success" as const },
    { label: "Active Sources", value: overview.activeSources, detail: `${toPercent(overview.activeSources, overview.totalSources)}% active`, icon: <Check className="size-4 text-emerald-600" />, tone: "success" as const },
    { label: "Total Jobs Scraped", value: formatMetricValue(overview.totalScrapedJobs), detail: "collected from sources", icon: <Database className="size-4 text-slate-500" />, tone: "neutral" as const },
    { label: "Normalized Jobs", value: formatMetricValue(overview.normalizedJobs), detail: "ready for review", icon: <AlertTriangle className="size-4 text-[#a44100]" />, tone: "warning" as const },
  ];

  return (
    <>
      <AdminNotice notice={params.notice} noticeType={params.noticeType} />
      <AdminInlineNotice message={dashboardNotice} />
      <AdminPageIntro
        title="System Status"
        description="Real-time overview of aggregation operations."
        action={
          <form action={runPipelineAction}>
            <input type="hidden" name="redirectTo" value="/admin" />
            <button
              type="submit"
              className="floating-soft inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3525cd] to-[#4f46e5] px-5 py-2.5 text-sm font-medium text-white shadow-[0_18px_38px_-18px_rgba(53,37,205,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_42px_-16px_rgba(53,37,205,0.85)]"
            >
              <Play className="size-4 fill-current" />
              Run Pipeline
            </button>
          </form>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card, index) => (
          <div key={card.label} className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2" style={{ animationDuration: `${220 + index * 90}ms` }}>
            <MetricCard {...card} />
          </div>
        ))}
      </div>

      <div className="mt-6">
        <AdminSurface
          title="Audience Analytics"
          subtitle="Today's public visitor activity from tracked end-user events."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Visitors Today"
              value={formatMetricValue(analytics.visitorsToday)}
              detail="unique visitor IDs"
              icon={<UsersRound className="size-4 text-[#4f46e5]" />}
              tone="primary"
            />
            <MetricCard
              label="Page Views Today"
              value={formatMetricValue(analytics.pageViewsToday)}
              detail="public page views"
              icon={<Eye className="size-4 text-slate-500" />}
            />
            <MetricCard
              label="Job Views Today"
              value={formatMetricValue(analytics.jobViewsToday)}
              detail="job detail opens"
              icon={<Eye className="size-4 text-slate-500" />}
            />
            <MetricCard
              label="Apply Clicks Today"
              value={formatMetricValue(analytics.applyClicksToday)}
              detail="source apply clicks"
              icon={<MousePointerClick className="size-4 text-emerald-600" />}
              tone="success"
            />
            <MetricCard
              label="Searches Today"
              value={formatMetricValue(analytics.searchesToday)}
              detail="keyword searches"
              icon={<Search className="size-4 text-[#a44100]" />}
              tone="warning"
            />
            <MetricCard
              label="Conversion Rate"
              value={`${analytics.conversionRate}%`}
              detail="apply clicks / job views"
              icon={<MousePointerClick className="size-4 text-[#4f46e5]" />}
              tone="primary"
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-[#eff4ff] p-4">
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Top Viewed Jobs
              </h4>
              <div className="mt-3 space-y-2">
                {analytics.topViewedJobs.length === 0 ? (
                  <p className="rounded-xl bg-white/80 px-4 py-5 text-sm text-slate-500">
                    No job view data yet.
                  </p>
                ) : (
                  analytics.topViewedJobs.map((job) => (
                    <div
                      key={job.jobId}
                      className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 text-sm shadow-[0_10px_20px_-16px_rgba(11,28,48,0.18)]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">{job.title}</p>
                        <p className="truncate text-xs text-slate-500">{job.company}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-[#eef2ff] px-2.5 py-1 text-xs font-bold text-[#4f46e5]">
                        {job.viewCount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-[#eff4ff] p-4">
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Top Search Keywords
              </h4>
              <div className="mt-3 space-y-2">
                {analytics.topSearchKeywords.length === 0 ? (
                  <p className="rounded-xl bg-white/80 px-4 py-5 text-sm text-slate-500">
                    No search keyword data yet.
                  </p>
                ) : (
                  analytics.topSearchKeywords.map((keyword) => (
                    <div
                      key={keyword.keyword}
                      className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 text-sm shadow-[0_10px_20px_-16px_rgba(11,28,48,0.18)]"
                    >
                      <p className="truncate font-semibold text-slate-800">{keyword.keyword}</p>
                      <span className="shrink-0 rounded-lg bg-[#eef2ff] px-2.5 py-1 text-xs font-bold text-[#4f46e5]">
                        {keyword.searchCount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </AdminSurface>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <AdminSurface title="Recent Jobs" className="xl:col-span-2">
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-500">
              Recent Jobs from the internal API. This list is not real-time and is meant to provide a quick snapshot of recent activity.
            </p>

            {jobs.length === 0 ? (
              <div className="rounded-2xl bg-[#eff4ff] px-6 py-10 text-center text-sm text-slate-500">
                Belum ada snapshot job yang bisa ditampilkan dari internal API.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl bg-[#eff4ff] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
                  <div>Job</div>
                  <div>Source</div>
                  <div>Status</div>
                  <div className="text-right">Collected</div>
                </div>
                <div className="space-y-1">
                  {jobs.slice(0, 4).map((job) => (
                    <div key={job.id} className="admin-card-hover grid grid-cols-1 gap-3 rounded-lg bg-white px-4 py-3 text-sm shadow-[0_10px_20px_-16px_rgba(11,28,48,0.16)] lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:items-center lg:gap-0 lg:py-2.5">
                      <div>
                        <p className="font-medium text-slate-800">{job.title}</p>
                        <p className="text-xs text-slate-500">{job.company}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-slate-500 lg:block">
                        <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 lg:hidden">Source</span>
                        {job.sourceName}
                      </div>
                      <div className="flex items-center justify-between gap-3 lg:block">
                        <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 lg:hidden">Status</span>
                        <StatusBadge tone={getStatusTone(job.status)}>{formatStatus(job.status)}</StatusBadge>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-slate-500 lg:block lg:text-right">
                        <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 lg:hidden">Collected</span>
                        {formatDateTime(job.collectedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AdminSurface>
      </div>
    </>
  );
}

function formatMetricValue(value: number) {
  if (value >= 1000) {
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  }
  return String(value);
}

function toPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusTone(status: string) {
  if (status === "normalized" || status === "approved") return "primary";
  if (status === "duplicate") return "warning";
  if (status === "rejected") return "danger";
  if (status === "archived") return "neutral";
  return "success";
}

function formatStatus(value: string) {
  return value.split("_").join(" ").replace(/\b\w/g, (char) => char.toUpperCase());
}
