import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ReactNode } from "react";

import { AdminInlineNotice, AdminNotice, AdminPageIntro, AdminSurface, StatusBadge } from "@/components/admin/admin-primitives";
import { Input } from "@/components/ui/input";
import { getAdminJobsPage, getAdminSources, getPublicJobCategories } from "@/lib/api";

const PAGE_SIZE = 10;

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string;
    sourceId?: string;
    notice?: string;
    noticeType?: "success" | "error";
    q?: string;
    category?: string;
    location?: string;
    workType?: string;
    roleType?: string;
    sort?: "asc" | "desc";
    page?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const selectedStatus = params.status || "";
  const selectedSourceId = params.sourceId ? Number(params.sourceId) : undefined;
  const selectedCategory = params.category || "";
  const selectedLocation = params.location || "";
  const selectedWorkType = params.workType || "";
  const selectedRoleType = params.roleType || "";
  const selectedSort = params.sort === "asc" ? "asc" : "desc";
  const currentPage = normalizePage(params.page);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const [jobsResult, sourcesResult, categoriesResult] = await Promise.all([
    getAdminJobsPage({
      status: selectedStatus || undefined,
      sourceId: selectedSourceId || undefined,
      search: params.q || undefined,
      category: selectedCategory || undefined,
      location: selectedLocation || undefined,
      workType: selectedWorkType || undefined,
      roleType: selectedRoleType || undefined,
      sort: selectedSort,
      limit: PAGE_SIZE,
      offset,
    }),
    getAdminSources(),
    getPublicJobCategories(),
  ]);
  const jobsPage = jobsResult.data;
  const jobs = jobsPage.items;
  const sources = sourcesResult.data;
  const categories = categoriesResult.data;
  const jobsNotice = jobsResult.error || sourcesResult.error || categoriesResult.error;
  const total = jobsPage.total;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 0;
  const rangeStart = total === 0 ? 0 : jobsPage.offset + 1;
  const rangeEnd = total === 0 ? 0 : jobsPage.offset + jobs.length;
  const pageNumbers = getVisiblePages(currentPage, totalPages);

  return (
    <>
      <AdminNotice notice={params.notice} noticeType={params.noticeType} />
      <AdminInlineNotice message={jobsNotice} />
      <AdminPageIntro
        title="Jobs Pipeline"
        description="Manage and moderate incoming job listings from all aggregated sources."
      />

      <div className="mt-6">
        <AdminSurface>
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" action="/admin/jobs" method="get">
            <FilterCard label="Search Jobs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  name="q"
                  placeholder="Title, company, keywords"
                  defaultValue={params.q || ""}
                  className="h-11 rounded-xl border-0 bg-[#eef3ff] pl-9 shadow-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]/20"
                />
              </div>
            </FilterCard>
            <FilterCard label="Category">
              <SelectField
                name="category"
                value={selectedCategory}
                options={[
                  { value: "", label: "All Categories" },
                  ...categories.map((category) => ({
                    value: category.category,
                    label: `${category.category} (${category.jobCount})`,
                  })),
                ]}
              />
            </FilterCard>
            <FilterCard label="Location">
              <Input
                name="location"
                placeholder="Jakarta, Remote, Hybrid"
                defaultValue={selectedLocation}
                className="h-11 rounded-xl border-0 bg-[#eef3ff] px-4 shadow-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]/20"
              />
            </FilterCard>
            <FilterCard label="Work Type">
              <SelectField
                name="workType"
                value={selectedWorkType}
                options={[
                  { value: "", label: "All Work Types" },
                  { value: "remote", label: "Remote" },
                  { value: "hybrid", label: "Hybrid" },
                  { value: "on_site", label: "On-site" },
                ]}
              />
            </FilterCard>
            <FilterCard label="Role Type">
              <SelectField
                name="roleType"
                value={selectedRoleType}
                options={[
                  { value: "", label: "All Role Types" },
                  { value: "full_time", label: "Full-time" },
                  { value: "contract", label: "Contract" },
                  { value: "freelance", label: "Freelance" },
                  { value: "part_time", label: "Part-time" },
                ]}
              />
            </FilterCard>
            <FilterCard label="Status">
              <SelectField
                name="status"
                value={selectedStatus}
                options={[
                  { value: "", label: "All Statuses" },
                  { value: "normalized", label: "Normalized" },
                  { value: "approved", label: "Approved" },
                  { value: "duplicate", label: "Duplicate" },
                  { value: "rejected", label: "Rejected" },
                  { value: "archived", label: "Archived" },
                  { value: "review_pending", label: "Review Pending" },
                ]}
              />
            </FilterCard>
            <FilterCard label="Source">
              <SelectField
                name="sourceId"
                value={params.sourceId || ""}
                options={[
                  { value: "", label: "All Sources" },
                  ...sources.map((source) => ({ value: String(source.id), label: source.name })),
                ]}
              />
            </FilterCard>
            <FilterCard label="Sort">
              <SelectField
                name="sort"
                value={selectedSort}
                options={[
                  { value: "desc", label: "Newest First" },
                  { value: "asc", label: "Oldest First" },
                ]}
              />
            </FilterCard>
            <FilterCard label="Apply">
              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#3525cd] to-[#4f46e5] px-4 text-sm font-medium text-white shadow-[0_14px_28px_-18px_rgba(79,70,229,0.55)]"
              >
                Apply Filters
              </button>
            </FilterCard>
          </form>
        </AdminSurface>
      </div>

      <div className="mt-6">
        <AdminSurface>
          {jobs.length === 0 ? (
            <div className="rounded-2xl bg-[#eff4ff] px-6 py-12 text-center text-sm text-slate-500">
              No job rows returned by the internal API yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-[#eff4ff] p-2">
              <div className="hidden grid-cols-[0.4fr_2fr_1fr_1fr_1fr_0.5fr] gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
                <div>No.</div>
                <div>Job Title & Company</div>
                <div>Source</div>
                <div>Date Collected</div>
                <div>Status</div>
                <div className="text-right">Action</div>
              </div>

              <div className="space-y-2">
                {jobs.map((job, index) => (
                  <Link
                    key={job.id}
                    href={`/admin/jobs/${job.id}`}
                    className="admin-card-hover grid grid-cols-1 gap-3 rounded-xl bg-white px-4 py-4 shadow-[0_14px_28px_-22px_rgba(11,28,48,0.3)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 lg:grid-cols-[0.4fr_2fr_1fr_1fr_1fr_0.5fr]"
                    style={{ animationDuration: `${220 + index * 65}ms` }}
                  >
                    <div className="flex items-center justify-between gap-3 pt-0.5 text-sm font-semibold text-slate-500 lg:block">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 lg:hidden">No.</span>
                      {jobsPage.offset + index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {job.company} - {job.location}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:block">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 lg:hidden">Source</span>
                      <span className="inline-flex rounded-lg bg-[#e8efff] px-2.5 py-1 text-xs font-medium text-slate-600">
                        {job.sourceName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-500 lg:block">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 lg:hidden">Collected</span>
                      {formatDateTime(job.collectedAt)}
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:block">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400 lg:hidden">Status</span>
                      <StatusBadge tone={getStatusTone(job.status)}>{formatStatus(job.status)}</StatusBadge>
                    </div>
                    <div className="text-sm font-medium text-[#4f46e5] lg:text-right">Open</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
            <p>
              Showing {rangeStart} to {rangeEnd} of {total} result{total === 1 ? "" : "s"}.
            </p>

            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center gap-2">
                <PaginationNavLink
                  href={buildPageHref(params, currentPage - 1)}
                  disabled={currentPage <= 1}
                  ariaLabel="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </PaginationNavLink>

                {pageNumbers.map((entry, index) =>
                  entry === "ellipsis" ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                      ...
                    </span>
                  ) : (
                    <PaginationPageLink
                      key={entry}
                      href={buildPageHref(params, entry)}
                      active={entry === currentPage}
                    >
                      {entry}
                    </PaginationPageLink>
                  ),
                )}

                <PaginationNavLink
                  href={buildPageHref(params, currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  ariaLabel="Next page"
                >
                  <ChevronRight className="size-4" />
                </PaginationNavLink>
              </div>
            ) : null}
          </div>
        </AdminSurface>
      </div>
    </>
  );
}

function FilterCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      {children}
    </div>
  );
}

function SelectField({
  name,
  value,
  options,
}: {
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      name={name}
      defaultValue={value}
      className="h-11 w-full appearance-none rounded-xl border-0 bg-[#eef3ff] px-4 text-sm text-slate-700 shadow-none outline-none transition-colors hover:bg-[#e5ecff] focus-visible:ring-2 focus-visible:ring-[#4f46e5]/20"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
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

function normalizePage(value?: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function buildPageHref(
  params: {
    status?: string;
    sourceId?: string;
    q?: string;
    category?: string;
    location?: string;
    workType?: string;
    roleType?: string;
    sort?: string;
  },
  page: number,
) {
  const searchParams = new URLSearchParams();

  if (params.q) {
    searchParams.set("q", params.q);
  }
  if (params.status) {
    searchParams.set("status", params.status);
  }
  if (params.sourceId) {
    searchParams.set("sourceId", params.sourceId);
  }
  if (params.category) {
    searchParams.set("category", params.category);
  }
  if (params.location) {
    searchParams.set("location", params.location);
  }
  if (params.workType) {
    searchParams.set("workType", params.workType);
  }
  if (params.roleType) {
    searchParams.set("roleType", params.roleType);
  }
  if (params.sort) {
    searchParams.set("sort", params.sort);
  }
  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();
  return query ? `/admin/jobs?${query}` : "/admin/jobs";
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages] as const;
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages] as const;
}

function PaginationNavLink({
  href,
  disabled,
  ariaLabel,
  children,
}: {
  href: string;
  disabled?: boolean;
  ariaLabel: string;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="rounded-lg p-2 text-slate-300"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[#eef3ff] hover:text-slate-700"
    >
      {children}
    </Link>
  );
}

function PaginationPageLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-lg bg-[#4f46e5] px-3 py-1.5 text-white shadow-[0_14px_28px_-18px_rgba(79,70,229,0.6)]"
          : "rounded-lg px-3 py-1.5 text-slate-600 transition-colors hover:bg-[#eef3ff]"
      }
    >
      {children}
    </Link>
  );
}
