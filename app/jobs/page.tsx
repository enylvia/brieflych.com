import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Search, Wifi } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AnalyticsPageView, JobsSearchFilterTracker } from "@/components/public/analytics-trackers";
import { CompanyAvatar } from "@/components/public/company-avatar";
import { PublicChrome } from "@/components/public/public-chrome";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPublicJobCategories, getPublicJobsCatalog } from "@/lib/api";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export const metadata: Metadata = {
  title: "Browse Jobs",
  description:
    "Browse curated job opportunities across engineering, product, design, operations, and modern business roles on BrieflyCH.",
  alternates: {
    canonical: "/jobs",
  },
  openGraph: {
    title: "Browse Jobs | BrieflyCH",
    description:
      "Discover curated, high-signal job opportunities from trusted hiring sources on BrieflyCH.",
    url: "/jobs",
  },
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string | string[];
    location?: string | string[];
    category?: string | string[];
    workType?: string | string[];
    roleType?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  }>;
}) {
  const params = (await searchParams) ?? {};
  const searchQuery = firstValue(params.q);
  const locationQuery = firstValue(params.location);
  const selectedCategory = firstValue(params.category);
  const selectedWorkType = firstValue(params.workType);
  const selectedRoleType = firstValue(params.roleType);
  const sortQuery = firstValue(params.sort);
  const selectedSort = normalizeSort(sortQuery);
  const requestedPage = normalizePage(firstValue(params.page));
  const offset = (requestedPage - 1) * PAGE_SIZE;

  const [catalogResult, categoriesResult] = await Promise.all([
    getPublicJobsCatalog({
      limit: PAGE_SIZE,
      offset,
      search: searchQuery || undefined,
      location: locationQuery || undefined,
      category: selectedCategory || undefined,
      workType: selectedWorkType || undefined,
      roleType: selectedRoleType || undefined,
      sort: selectedSort,
    }),
    getPublicJobCategories(),
  ]);

  const catalog = catalogResult.data;
  const categories = categoriesResult.data;
  const jobs = catalog.items;
  const total = catalog.total;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;
  const currentPage = Math.min(requestedPage, totalPages);
  const rangeStart = total === 0 ? 0 : catalog.offset + 1;
  const rangeEnd = total === 0 ? 0 : catalog.offset + jobs.length;
  const title = buildTitle(searchQuery, selectedCategory);
  const notice = catalogResult.error || categoriesResult.error;

  return (
    <PublicChrome active="jobs" contentClassName="space-y-8">
      <AnalyticsPageView
        page="jobs"
        path="/jobs"
        metadata={{
          page_number: currentPage,
          total_jobs: total,
        }}
      />
      <JobsSearchFilterTracker
        keyword={searchQuery}
        filters={[
          { name: "category", value: selectedCategory },
          { name: "location", value: locationQuery },
          { name: "work_type", value: selectedWorkType },
          { name: "role_type", value: selectedRoleType },
          { name: "sort", value: sortQuery },
        ]}
      />
      <section className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <Card className="rounded-[28px] border-white/80 bg-[#eef2ff] py-0 shadow-[0_28px_60px_-48px_rgba(17,24,39,0.26)]">
            <CardContent className="px-5 py-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#141b2d]">Filters</h2>
                <Link href="/jobs" className="text-sm font-semibold text-[#4b41e7] hover:text-[#3e35d2]">
                  Clear all
                </Link>
              </div>

              <form action="/jobs" method="get" className="mt-6 space-y-6">
                <FilterBlock label="Search">
                  <Input
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="Title, company, or keyword"
                    className="h-11 rounded-xl border-white/90 bg-white/90 text-sm shadow-none placeholder:text-[#9aa1b7]"
                  />
                </FilterBlock>

                <FilterBlock label="Location">
                  <Input
                    name="location"
                    defaultValue={locationQuery}
                    placeholder="City, state, or remote"
                    className="h-11 rounded-xl border-white/90 bg-white/90 text-sm shadow-none placeholder:text-[#9aa1b7]"
                  />
                </FilterBlock>

                <FilterBlock label="Category">
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
                </FilterBlock>

                <FilterBlock label="Work Type">
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
                </FilterBlock>

                <FilterBlock label="Role Type">
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
                </FilterBlock>

                <FilterBlock label="Sort">
                  <SelectField
                    name="sort"
                    value={selectedSort}
                    options={[
                      { value: "desc", label: "Newest First" },
                      { value: "asc", label: "Oldest First" },
                    ]}
                  />
                </FilterBlock>

                <button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-[#dfe7ff] text-sm font-semibold text-[#4b41e7] transition-colors hover:bg-[#d1dcff]"
                >
                  Apply Filters
                </button>
              </form>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#141b2d] sm:text-3xl">{title}</h1>
              <p className="mt-2 text-sm text-[#6d7489] sm:text-base">
                {total === 0
                  ? "404 jobs not found for your current filters"
                  : `Showing ${rangeStart}-${rangeEnd} of ${total} position${total === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          {notice ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800">
              {notice}
            </div>
          ) : null}

          <Card className="rounded-[30px] border-white/80 bg-white/92 py-0 shadow-[0_34px_80px_-48px_rgba(17,24,39,0.3)]">
            <CardContent className="px-0">
              {total === 0 ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mx-auto flex size-20 items-center justify-center rounded-[28px] bg-[#eef2ff] text-[#7e84a0]">
                    <Search className="size-9" />
                  </div>

                  <h2 className="mt-8 text-2xl font-black tracking-tight text-[#141b2d] sm:text-3xl">
                    404 jobs not found
                  </h2>

                  <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-[#6f768b]">
                    We couldn&apos;t find any positions matching your current filters. Try changing your
                    search keywords or clearing some filters.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    <Link
                      href="/jobs"
                      className={cn(
                        buttonVariants({ variant: "default", size: "lg" }),
                        "h-12 rounded-xl bg-[#4b41e7] px-6 text-white hover:bg-[#3e35d2]",
                      )}
                    >
                      View All Jobs
                    </Link>

                    <Link
                      href="/jobs"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "h-12 rounded-xl border-[#d8def0] bg-white px-6 text-[#4b41e7] hover:bg-[#f4f6ff]",
                      )}
                    >
                      Clear Filters
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="hidden grid-cols-[2.15fr_1.1fr_0.85fr_1fr_0.8fr] gap-6 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9197ad] lg:grid">
                    <div>Role & Company</div>
                    <div>Location</div>
                    <div>Mode</div>
                    <div>Compensation</div>
                    <div className="text-right">Action</div>
                  </div>

                  <div className="divide-y divide-[#edf0f7]">
                    {jobs.map((job) => (
                      <div
                        key={job.slug}
                        className="grid gap-5 px-6 py-5 lg:grid-cols-[2.15fr_1.1fr_0.85fr_1fr_0.8fr] lg:items-center"
                      >
                        <div className="flex items-start gap-4">
                          <CompanyAvatar
                            company={job.company}
                            imageUrl={job.companyProfileImageUrl}
                            className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eef1ff]"
                            imageClassName="h-full w-full object-cover"
                            fallbackClassName="text-base font-bold text-[#4b41e7]"
                          />
                          <div>
                            <p className="text-base font-bold text-[#141b2d] sm:text-lg">{job.title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6f768b] sm:text-sm">
                              <span>{job.company}</span>
                              <span className="text-[#bcc2d4]">/</span>
                              <Badge className="rounded-full bg-[#eefcf3] text-[#28915b] hover:bg-[#eefcf3]">
                                {job.category}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-[#5d657a] sm:text-sm">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9197ad] lg:hidden">
                            Location
                          </p>
                          <div className="flex items-center gap-2">
                            <MapPin className="size-4 text-[#7d84a0]" />
                            <span>{job.location}</span>
                          </div>
                        </div>

                        <div className="text-xs text-[#5d657a] sm:text-sm">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9197ad] lg:hidden">
                            Mode
                          </p>
                          <div className="flex items-center gap-2">
                            <Wifi className="size-4 text-[#7d84a0]" />
                            <span>{job.workType ?? "Not specified"}</span>
                          </div>
                        </div>

                        <div className="text-xs text-[#4e566c] sm:text-sm">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9197ad] lg:hidden">
                            Compensation
                          </p>
                          <p className="text-base font-bold text-[#141b2d] sm:text-lg">
                            {job.salaryRange ?? "Compensation not listed"}
                          </p>
                          <p className="mt-1 text-xs text-[#7d8398] sm:text-sm">{job.employmentType}</p>
                        </div>

                        <div className="lg:text-right">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9197ad] lg:hidden">
                            Action
                          </p>
                          <Link
                            href={`/jobs/${job.slug}`}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-[#4b41e7] hover:text-[#3e35d2] sm:text-sm"
                          >
                            View Details
                            <ArrowRight className="size-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-4 border-t border-[#edf0f7] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <PaginationNavLink
                      href={buildJobsHref(params, currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </PaginationNavLink>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {getVisiblePages(currentPage, totalPages).map((entry, index) =>
                        entry === "ellipsis" ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-[#8b91a7]">
                            ...
                          </span>
                        ) : (
                          <Link
                            key={entry}
                            href={buildJobsHref(params, entry)}
                            className={cn(
                              "flex size-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                              entry === currentPage
                                ? "bg-[#4b41e7] text-white shadow-[0_16px_30px_-22px_rgba(75,65,231,0.75)]"
                                : "text-[#5e667c] hover:bg-[#eef2ff]",
                            )}
                          >
                            {entry}
                          </Link>
                        ),
                      )}
                    </div>

                    <PaginationNavLink
                      href={buildJobsHref(params, currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </PaginationNavLink>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicChrome>
  );
}

function FilterBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a8096]">{label}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function SelectField({
  name,
  value,
  options,
}: {
  name: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      name={name}
      defaultValue={value ?? ""}
      className="h-11 w-full appearance-none rounded-xl border-white/90 bg-white/90 px-4 text-sm text-[#596176] shadow-none outline-none"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function PaginationNavLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-[#e0e5f2] px-4 py-2.5 text-sm text-[#b3b8c9]">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border border-[#dfe4f2] px-4 py-2.5 text-sm font-medium text-[#4c5368] transition-colors hover:bg-[#f5f7ff]"
    >
      {children}
    </Link>
  );
}

function firstValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizePage(value?: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function normalizeSort(value?: string): "asc" | "desc" {
  return value === "asc" ? "asc" : "desc";
}

function buildTitle(searchQuery?: string, category?: string) {
  if (category) {
    return `${category} Roles`;
  }

  if (searchQuery) {
    return `${toHeadline(searchQuery)} Roles`;
  }

  return "Explore Open Roles";
}

function toHeadline(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildJobsHref(
  params: {
    q?: string | string[];
    location?: string | string[];
    category?: string | string[];
    workType?: string | string[];
    roleType?: string | string[];
    sort?: string | string[];
  },
  page: number,
) {
  const searchParams = new URLSearchParams();

  const q = firstValue(params.q);
  const location = firstValue(params.location);
  const category = firstValue(params.category);
  const workType = firstValue(params.workType);
  const roleType = firstValue(params.roleType);
  const sort = firstValue(params.sort);

  if (q) {
    searchParams.set("q", q);
  }
  if (location) {
    searchParams.set("location", location);
  }
  if (category) {
    searchParams.set("category", category);
  }
  if (workType) {
    searchParams.set("workType", workType);
  }
  if (roleType) {
    searchParams.set("roleType", roleType);
  }
  if (sort) {
    searchParams.set("sort", sort);
  }
  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();
  return query ? `/jobs?${query}` : "/jobs";
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
