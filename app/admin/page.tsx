import {
  AlertTriangle,
  Check,
  Copy,
  Database,
  Play,
} from "lucide-react";

import { runPipelineAction } from "@/app/admin/actions";
import { AdminInlineNotice, AdminNotice, AdminPageIntro, AdminSurface, MetricCard, StatusBadge } from "@/components/admin/admin-primitives";
import { getAdminJobs, getAdminOverview } from "@/lib/api";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string; noticeType?: "success" | "error" }>;
}) {
  const params = (await searchParams) ?? {};
  const [overviewResult, jobsResult] = await Promise.all([getAdminOverview(), getAdminJobs()]);
  const overview = overviewResult.data;
  const jobs = jobsResult.data;
  const dashboardNotice = overviewResult.error || jobsResult.error;

  const metricCards = [
    { label: "Total Sources", value: overview.totalSources, detail: "registered sources", icon: <Database className="size-4 text-slate-500" />, tone: "neutral" as const },
    { label: "Active Sources", value: overview.activeSources, detail: `${toPercent(overview.activeSources, overview.totalSources)}% active`, icon: <Check className="size-4 text-emerald-600" />, tone: "success" as const },
    { label: "Duplicate Jobs", value: formatMetricValue(overview.duplicateJobs), detail: "flagged by deduplicator", icon: <Copy className="size-4 text-slate-500" />, tone: "neutral" as const },
    { label: "Review Pending", value: formatMetricValue(overview.reviewPendingJobs), detail: "needs operator review", icon: <AlertTriangle className="size-4 text-[#a44100]" />, tone: "warning" as const },
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
