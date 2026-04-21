import Link from "next/link";
import { ArrowLeft, Archive, CheckCircle2, Copy, ExternalLink, ShieldAlert } from "lucide-react";
import { notFound } from "next/navigation";

import { updateJobStatusAction } from "@/app/admin/actions";
import { AdminInlineNotice, AdminNotice, AdminPageIntro, AdminSurface, StatusBadge } from "@/components/admin/admin-primitives";
import { RichTextContent } from "@/components/job/rich-text";
import { buttonVariants } from "@/components/ui/button";
import { getAdminJobById } from "@/lib/api";
import { cn } from "@/lib/utils";

export default async function AdminJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ notice?: string; noticeType?: "success" | "error" }>;
}) {
  const { id } = await params;
  const pageParams = (await searchParams) ?? {};
  const { data: job, error } = await getAdminJobById(Number(id));

  if (!job) {
    if (error) {
      return (
        <>
          <AdminNotice notice={pageParams.notice} noticeType={pageParams.noticeType} />
          <AdminInlineNotice message={error} tone="error" />
          <AdminPageIntro
            eyebrow="Back Office Review"
            title="Job Detail Review"
            description="Inspect normalized job content before approval or downstream publishing."
          />

          <div className="mt-6">
            <AdminSurface>
              <div className="rounded-2xl bg-[#eff4ff] px-6 py-12 text-center text-sm text-slate-500">
                Detail job tidak bisa dimuat dari internal API saat ini.
              </div>
            </AdminSurface>
          </div>
        </>
      );
    }

    notFound();
  }

  return (
    <>
      <AdminNotice notice={pageParams.notice} noticeType={pageParams.noticeType} />
      <AdminInlineNotice message={error} />
      <AdminPageIntro
        eyebrow="Back Office Review"
        title="Job Detail Review"
        description="Inspect normalized job content before approval or downstream publishing."
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/jobs"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "rounded-xl bg-white/70 px-3 text-slate-600 shadow-[0_14px_28px_-24px_rgba(11,28,48,0.4)] hover:bg-white",
            )}
          >
            <ArrowLeft className="size-4" />
            Back to Pipeline
          </Link>
          <span className="rounded-lg bg-[#eef3ff] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-slate-500">
            ID: JOB-{job.id}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusActionForm jobId={job.id} redirectTo={`/admin/jobs/${job.id}`} statusAction="reject">
            Reject
          </StatusActionForm>
          <StatusActionForm jobId={job.id} redirectTo={`/admin/jobs/${job.id}`} statusAction="archive" icon={<Archive className="size-4" />}>
            Archive
          </StatusActionForm>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 text-sm font-medium text-[#a44100]/65 shadow-[0_16px_28px_-24px_rgba(11,28,48,0.4)]"
          >
            <Copy className="size-4" />
            Mark as Duplicate
          </button>
          <StatusActionForm
            jobId={job.id}
            redirectTo={`/admin/jobs/${job.id}`}
            statusAction="approve"
            primary
            icon={<CheckCircle2 className="size-4" />}
          >
            Approve Job
          </StatusActionForm>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <AdminSurface>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{job.title}</h2>
                <p className="mt-2 text-base text-slate-500">
                  <span className="font-semibold text-[#4f46e5]">{job.company}</span>
                  <span className="mx-2">-</span>
                  {job.location}
                  <span className="mx-2">-</span>
                  {formatStatus(job.employmentType)}
                </p>
              </div>
              <StatusBadge tone={getStatusTone(job.status)}>{formatStatus(job.status)}</StatusBadge>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-[#eef3ff] px-3 py-1.5 text-xs font-medium text-slate-600 shadow-[0_8px_20px_-18px_rgba(11,28,48,0.3)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </AdminSurface>

          <AdminSurface title="Job Description">
            <div className="space-y-6 text-[15px] leading-8 text-slate-600">
              <RichTextContent
                value={job.description}
                paragraphClassName="leading-8 text-slate-600"
                listClassName="space-y-3 pl-6 leading-8 text-slate-600"
              />

              <div>
                <h3 className="mb-3 text-lg font-semibold text-slate-900">We&apos;re looking for someone who has:</h3>
                <ul className="space-y-3 pl-6">
                  {job.requirements.map((item) => (
                    <li key={item} className="list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold text-slate-900">What you&apos;ll get:</h3>
                <ul className="space-y-3 pl-6">
                  {job.benefits.map((item) => (
                    <li key={item} className="list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AdminSurface>
        </div>

        <div className="space-y-6">
          <AdminSurface title="Aggregation Metadata" className="bg-gradient-to-br from-white to-[#eef3ff]">
            <div className="space-y-4 text-sm text-slate-600">
              <MetadataField label="Source Website" value={job.sourceWebsite} />
              <MetadataField
                label="Original URL"
                value={
                  <a href={job.sourceJobUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#4f46e5] hover:underline">
                    {formatUrlHost(job.sourceJobUrl)}
                    <ExternalLink className="size-3.5" />
                  </a>
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <MetadataField label="Collection Time" value={formatDateTime(job.collectedAt)} />
                <MetadataField label="Scraper Type" value={job.scraperType} />
              </div>
            </div>
          </AdminSurface>

          <AdminSurface title="Quality Analysis" className="bg-gradient-to-br from-white to-[#edf5ff]">
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>Parse Confidence</span>
                  <span className="font-semibold text-emerald-600">{job.parseConfidence}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#dfe8ff]">
                  <div className="pipeline-bar h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: `${job.parseConfidence}%` }} />
                </div>
              </div>

              {job.duplicateMatch ? (
                <div className="rounded-xl border border-[#ffd9bf] bg-[#fff7f2] p-4 text-sm text-[#8a4510] shadow-[0_16px_30px_-26px_rgba(164,65,0,0.35)]">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="font-semibold">Duplicate Warning</p>
                      <p className="mt-1">95% match with Job #{job.duplicateMatch}</p>
                      <p className="mt-1 text-xs text-[#a75a1e]">{job.duplicateReference}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {job.extractedEntities.map((entity) => (
                  <span key={entity} className="rounded-md bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 shadow-[0_10px_24px_-20px_rgba(11,28,48,0.35)]">
                    {entity.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          </AdminSurface>
        </div>
      </div>
    </>
  );
}

function MetadataField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/80 p-3 shadow-[0_14px_28px_-24px_rgba(11,28,48,0.28)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="mt-2 text-sm font-medium text-slate-700">{value}</div>
    </div>
  );
}

function StatusActionForm({
  jobId,
  redirectTo,
  statusAction,
  disabled,
  primary,
  icon,
  children,
}: {
  jobId: number;
  redirectTo: string;
  statusAction: "approve" | "reject" | "archive";
  disabled?: boolean;
  primary?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <form action={updateJobStatusAction}>
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="statusAction" value={statusAction} />
      <button
        type="submit"
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300",
          primary
            ? "bg-gradient-to-r from-[#3525cd] to-[#4f46e5] text-white shadow-[0_18px_34px_-18px_rgba(53,37,205,0.75)] hover:-translate-y-0.5 hover:shadow-[0_24px_40px_-18px_rgba(53,37,205,0.85)]"
            : "bg-white text-slate-700 shadow-[0_16px_28px_-24px_rgba(11,28,48,0.4)] hover:-translate-y-0.5 hover:bg-white",
          disabled && "cursor-not-allowed opacity-50 hover:translate-y-0",
        )}
      >
        {icon}
        {children}
      </button>
    </form>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
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

function formatUrlHost(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}
