import type {
  AboutEntry,
  AdminJobDetail,
  AdminJobListItem,
  AdminOverview,
  AdminSource,
  JobDetail,
  JobCategorySummary,
  JobListItem,
  PaginatedAdminJobs,
  PipelineStatus,
  PublicJobsCatalog,
  ScrapeHealthSummary,
  SystemHealth,
} from "@/lib/types";
import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

import { ADMIN_AUTH_TOKEN_COOKIE, ADMIN_LOGIN_PATH } from "@/lib/auth-constants";
import { normalizeListEntry, splitContentLines } from "@/lib/job-content";

const API_BASE_URL =
  (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

export type ApiResult<T> = {
  data: T;
  error?: string;
};

type BackendEnvelope<T> = {
  api_message?: string;
  count?: number;
  data: T;
};

type BackendJob = {
  id: number;
  source_id: number;
  source_job_url: string;
  source_apply_url: string;
  source_name?: string | null;
  source_website?: string | null;
  title: string;
  slug: string;
  company: string;
  company_profile_image_url?: string | null;
  location: string;
  work_type?: string | null;
  role_type?: string | null;
  employment_type: string;
  category: string;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string;
  description: string;
  requirements: string;
  benefits: string;
  posted_at?: string | null;
  status: string;
  created_at: string;
  duplicate_of_job_id?: number | null;
};

type BackendCategorySummary = {
  category: string;
  job_count: number;
};

type BackendAboutEntry = {
  id: number;
  title: string;
  body: string;
};

type BackendSource = {
  id: number;
  name: string;
  base_url: string;
  mode: string;
  active: boolean;
  scrape_interval_minutes: number;
  last_scraped_at?: string | null;
};

type BackendWorkerStatus = {
  running: boolean;
  last_started_at?: string;
  last_finished_at?: string;
  last_duration?: string;
  last_error?: string;
};

type BackendWorkerRun = {
  id: number;
  started_at: string;
  finished_at?: string | null;
  duration_seconds?: number | null;
  total_sources: number;
  successful_sources: number;
  failed_sources: number;
  total_jobs_collected: number;
  saved_jobs: number;
  skipped_jobs: number;
  success_rate_percentage: number;
  scrape_health_percentage: number;
  created_at?: string;
};

type BackendScrapeHealth = {
  window_started_at: string;
  window_finished_at: string;
  total_runs: number;
  total_sources: number;
  successful_sources: number;
  failed_sources: number;
  total_jobs_collected: number;
  total_saved_jobs: number;
  total_skipped_jobs: number;
  avg_run_duration_seconds: number;
  success_rate_percentage: number;
  scrape_health_percentage: number;
};

type BackendHealth = {
  status: string;
  database: string;
  timestamp: string;
};

type BackendJobCollectionPayload =
  | BackendJob[]
  | {
      api_message?: string;
      data?: BackendJob[] | { items?: BackendJob[]; rows?: BackendJob[]; total?: number; limit?: number; offset?: number };
      total?: number;
      count?: number;
      limit?: number;
      offset?: number;
      meta?: {
        total?: number;
        count?: number;
        limit?: number;
        offset?: number;
      };
      pagination?: {
        total?: number;
        count?: number;
        limit?: number;
        offset?: number;
      };
    };

type JobQueryOptions = {
  status?: string;
  sourceId?: number;
  search?: string;
  category?: string;
  location?: string;
  workType?: string;
  roleType?: string;
  sort?: "asc" | "desc";
  offset?: number;
};

class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

function readApiMessage(payload: unknown) {
  if (payload && typeof payload === "object" && "api_message" in payload) {
    const message = (payload as { api_message?: unknown }).api_message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return undefined;
}

async function fetchJSON<T>(path: string): Promise<T> {
  const authHeaders = await getInternalAuthHeaders(path);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      ...authHeaders,
    },
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {}

  if (!response.ok) {
    const message = readApiMessage(payload) || `request failed: ${response.status}`;

    if (response.status === 401 && "Authorization" in authHeaders) {
      redirect(`${ADMIN_LOGIN_PATH}?reason=expired`);
    }

    throw new ApiRequestError(response.status, message);
  }

  return payload as T;
}

async function getInternalAuthHeaders(path: string): Promise<Record<string, string>> {
  if (!path.startsWith("/internal/")) {
    return {};
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_AUTH_TOKEN_COOKIE)?.value;

    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

function splitParagraphs(value: string) {
  return splitContentLines(value).map(normalizeListEntry).filter(Boolean);
}

function formatDisplayValue(value: string) {
  const humanized = value
    .split("_")
    .join(" ")
    .split("-")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return humanized
    .replace(/\bOn Site\b/g, "On-site")
    .replace(/\bFull Time\b/g, "Full-time")
    .replace(/\bPart Time\b/g, "Part-time");
}

function formatSalaryRange(min?: number | null, max?: number | null, currency?: string) {
  if (!min && !max) {
    return undefined;
  }

  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  });

  const prefix = currency ? `${currency} ` : "";
  if (min && max) {
    return `${prefix}${formatter.format(min)} - ${formatter.format(max)}`;
  }
  if (min) {
    return `${prefix}${formatter.format(min)}+`;
  }

  return `${prefix}${formatter.format(max ?? 0)}`;
}

function inferSourceName(sourceId: number, sources: AdminSource[] = []) {
  const source = sources.find((item) => item.id === sourceId);
  return source?.name ?? `Source ${sourceId}`;
}

function inferSourceWebsite(sourceId: number, sources: AdminSource[] = []) {
  const source = sources.find((item) => item.id === sourceId);
  return source?.domain;
}

function inferDomainFromUrl(value?: string | null) {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function inferWorkType(rawWorkType: string | null | undefined, location: string) {
  if (rawWorkType && rawWorkType.trim().length > 0) {
    return formatDisplayValue(rawWorkType);
  }

  const normalizedLocation = location.toLowerCase();
  if (normalizedLocation.includes("remote")) {
    return "Remote";
  }
  if (normalizedLocation.includes("hybrid")) {
    return "Hybrid";
  }

  return "On-site";
}

function mapBackendJobToList(job: BackendJob, sources: AdminSource[] = []): AdminJobListItem {
  const summarySource = splitParagraphs(job.description)[0] ?? "Incoming normalized job listing.";

  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    company: job.company,
    location: job.location,
    category: job.category || "General",
    workType: inferWorkType(job.work_type, job.location),
    roleType: job.role_type ? formatDisplayValue(job.role_type) : undefined,
    employmentType: formatDisplayValue(job.employment_type || job.role_type || "full_time"),
    companyProfileImageUrl: job.company_profile_image_url ?? undefined,
    summary: summarySource,
    status: (job.status as AdminJobListItem["status"]) || "normalized",
    sourceId: job.source_id,
    sourceName: inferSourceName(job.source_id, sources),
    collectedAt: job.created_at,
    salaryRange: formatSalaryRange(job.salary_min, job.salary_max, job.currency),
  };
}

function mapBackendJobToDetail(job: BackendJob, sources: AdminSource[] = []): AdminJobDetail {
  const list = mapBackendJobToList(job, sources);

  return {
    ...list,
    description: job.description,
    requirements: splitParagraphs(job.requirements),
    benefits: splitParagraphs(job.benefits),
    sourceApplyUrl: job.source_apply_url || job.source_job_url,
    sourceJobUrl: job.source_job_url,
    postedAt: job.posted_at || job.created_at,
    sourceName: job.source_name ?? inferSourceName(job.source_id, sources),
    sourceWebsite:
      job.source_website ??
      inferSourceWebsite(job.source_id, sources) ??
      inferDomainFromUrl(job.source_job_url) ??
      "brieflych.com",
    scraperType: "pipeline_worker",
    collectedAt: job.created_at,
    parseConfidence: 96,
    duplicateMatch: job.duplicate_of_job_id ?? undefined,
    duplicateReference: job.duplicate_of_job_id ? `Potential match with job #${job.duplicate_of_job_id}` : undefined,
    extractedEntities: ["title", "location", "employment_type"],
    workplaceType: inferWorkType(job.work_type, job.location),
    salaryRange: formatSalaryRange(job.salary_min, job.salary_max, job.currency),
    tags: [
      job.category || "General",
      inferWorkType(job.work_type, job.location),
      formatDisplayValue(job.employment_type || job.role_type || "full_time"),
    ].filter(Boolean),
  };
}

function mapBackendSource(source: BackendSource): AdminSource {
  let statusLabel = "Healthy";
  if (!source.active) {
    statusLabel = "Paused";
  } else if (source.mode.includes("browser")) {
    statusLabel = "Warning";
  }

  return {
    id: source.id,
    name: source.name,
    domain: source.base_url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    mode: source.mode,
    active: source.active,
    lastScrapedAt: source.last_scraped_at ?? null,
    scrapeIntervalMinutes: source.scrape_interval_minutes,
    successRate: source.active ? (source.mode.includes("browser") ? 89.2 : 97.8) : 0,
    statusLabel,
  };
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    return `${fallback} (${error.message})`;
  }

  if (error instanceof Error && error.message) {
    return `${fallback} (${error.message})`;
  }

  return fallback;
}

function readNumericField(
  value: unknown,
  keys: string[],
): number | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  for (const key of keys) {
    const candidate = (value as Record<string, unknown>)[key];
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function unwrapJobCollection(payload: BackendJobCollectionPayload): {
  items: BackendJob[];
  total?: number;
  limit?: number;
  offset?: number;
} {
  if (Array.isArray(payload)) {
    return {
      items: payload,
    };
  }

  const topLevelTotal = readNumericField(payload, ["total", "count"]);
  const topLevelLimit = readNumericField(payload, ["limit"]);
  const topLevelOffset = readNumericField(payload, ["offset"]);
  const meta =
    readNumericField(payload.meta, ["total", "count"]) ??
    readNumericField(payload.pagination, ["total", "count"]);
  const metaLimit =
    readNumericField(payload.meta, ["limit"]) ??
    readNumericField(payload.pagination, ["limit"]);
  const metaOffset =
    readNumericField(payload.meta, ["offset"]) ??
    readNumericField(payload.pagination, ["offset"]);

  if (Array.isArray(payload.data)) {
    return {
      items: payload.data,
      total: topLevelTotal ?? meta,
      limit: topLevelLimit ?? metaLimit,
      offset: topLevelOffset ?? metaOffset,
    };
  }

  if (payload.data && typeof payload.data === "object") {
    const nestedItems =
      payload.data.items ??
      payload.data.rows;

    if (Array.isArray(nestedItems)) {
      return {
        items: nestedItems,
        total: readNumericField(payload.data, ["total", "count"]) ?? topLevelTotal ?? meta,
        limit: readNumericField(payload.data, ["limit"]) ?? topLevelLimit ?? metaLimit,
        offset: readNumericField(payload.data, ["offset"]) ?? topLevelOffset ?? metaOffset,
      };
    }
  }

  return {
    items: [],
    total: topLevelTotal ?? meta,
    limit: topLevelLimit ?? metaLimit,
    offset: topLevelOffset ?? metaOffset,
  };
}

function isNotFoundError(error: unknown) {
  return error instanceof ApiRequestError && error.status === 404;
}

function emptyOverview(): AdminOverview {
  return {
    totalSources: 0,
    activeSources: 0,
    normalizedJobs: 0,
    reviewPendingJobs: 0,
    duplicateJobs: 0,
  };
}

function emptyPipelineStatus(): PipelineStatus {
  return {
    running: false,
    activeMessage: "Pipeline snapshot is unavailable right now.",
    totalJobsCollected: 0,
    totalSavedJobs: 0,
    totalSkippedJobs: 0,
    totalRuns: 0,
    totalSources: 0,
    successfulSources: 0,
    failedSources: 0,
    averageRunDuration: "-",
    successRate: 0,
    scrapeHealthPercentage: 0,
    failedAggregations: 0,
    recentRuns: [],
  };
}

function getSettledValue<T>(result: PromiseSettledResult<T>) {
  return result.status === "fulfilled" ? result.value : null;
}

function getSettledReason<T>(result: PromiseSettledResult<T>) {
  return result.status === "rejected" ? result.reason : null;
}

async function fetchBackendJobsPayload(limit = 50, options?: JobQueryOptions) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (options?.status) {
    params.set("status", options.status);
  }
  if (options?.sourceId) {
    params.set("source_id", String(options.sourceId));
  }
  if (options?.search) {
    params.set("search", options.search);
  }
  if (options?.category) {
    params.set("category", options.category);
  }
  if (options?.location) {
    params.set("location", options.location);
  }
  if (options?.workType) {
    params.set("work_type", options.workType);
  }
  if (options?.roleType) {
    params.set("role_type", options.roleType);
  }
  if (options?.sort) {
    params.set("sort", options.sort);
  }
  if (typeof options?.offset === "number" && options.offset >= 0) {
    params.set("offset", String(options.offset));
  }

  return fetchJSON<BackendJobCollectionPayload>(`/internal/jobs?${params.toString()}`);
}

async function fetchBackendJobsPage(
  limit = 50,
  options?: JobQueryOptions,
): Promise<PaginatedAdminJobs> {
  const [payload, sources] = await Promise.all([
    fetchBackendJobsPayload(limit, options),
    fetchBackendSources().catch(() => []),
  ]);
  const collection = unwrapJobCollection(payload);
  const items = collection.items.map((job) => mapBackendJobToList(job, sources));

  return {
    items,
    total: collection.total ?? items.length,
    limit: collection.limit ?? limit,
    offset: collection.offset ?? options?.offset ?? 0,
  };
}

async function fetchBackendJobs(limit = 50, options?: JobQueryOptions): Promise<AdminJobListItem[]> {
  const page = await fetchBackendJobsPage(limit, options);
  return page.items;
}

async function fetchBackendJob(id: number): Promise<AdminJobDetail | null> {
  try {
    const [payload, sources] = await Promise.all([
      fetchJSON<BackendEnvelope<BackendJob> | BackendJob>(`/internal/jobs/${id}`),
      fetchBackendSources().catch(() => []),
    ]);
    const job = unwrapData<BackendJob>(payload);
    return mapBackendJobToDetail(job, sources);
  } catch (error) {
    unstable_rethrow(error);
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

async function fetchBackendJobBySlug(slug: string): Promise<JobDetail | null> {
  const sourcesPromise = fetchBackendSources().catch(() => []);
  let matchedJob: BackendJob | undefined;

  try {
    const searchedCollection = unwrapJobCollection(await fetchBackendJobsPayload(50, { search: slug }));
    matchedJob = searchedCollection.items.find((job) => job.slug === slug);
  } catch (error) {
    unstable_rethrow(error);
    if (!isNotFoundError(error)) {
      throw error;
    }
  }

  if (!matchedJob) {
    const pageSize = 100;
    let offset = 0;
    let total = Number.POSITIVE_INFINITY;

    while (!matchedJob && offset < total) {
      let collection: ReturnType<typeof unwrapJobCollection>;
      try {
        collection = unwrapJobCollection(await fetchBackendJobsPayload(pageSize, { offset }));
      } catch (error) {
        unstable_rethrow(error);
        if (isNotFoundError(error)) {
          break;
        }
        throw error;
      }

      matchedJob = collection.items.find((job) => job.slug === slug);
      if (matchedJob || collection.items.length === 0) {
        break;
      }

      total = collection.total ?? collection.items.length;
      offset += collection.items.length;
    }
  }

  if (!matchedJob) {
    return null;
  }

  const sources = await sourcesPromise;
  const detail = mapBackendJobToDetail(matchedJob, sources);
  return {
    id: detail.id,
    slug: detail.slug,
    title: detail.title,
    company: detail.company,
    location: detail.location,
    category: detail.category,
    workType: detail.workType,
    roleType: detail.roleType,
    employmentType: detail.employmentType,
    companyProfileImageUrl: detail.companyProfileImageUrl,
    summary: detail.summary,
    salaryRange: detail.salaryRange,
    description: detail.description,
    requirements: detail.requirements,
    benefits: detail.benefits,
    sourceApplyUrl: detail.sourceApplyUrl,
    sourceJobUrl: detail.sourceJobUrl,
    postedAt: detail.postedAt,
    sourceName: detail.sourceName,
    sourceWebsite: detail.sourceWebsite,
    workplaceType: detail.workplaceType,
    tags: detail.tags,
  };
}

async function fetchBackendSources(): Promise<AdminSource[]> {
  const payload = await fetchJSON<BackendEnvelope<BackendSource[]> | BackendSource[]>("/internal/sources");
  const sources = unwrapData<BackendSource[]>(payload);
  return sources.map(mapBackendSource);
}

async function fetchBackendJobCategories(): Promise<JobCategorySummary[]> {
  const payload = await fetchJSON<BackendEnvelope<BackendCategorySummary[]> | BackendCategorySummary[]>(
    "/internal/jobs/categories",
  );
  const categories = unwrapData<BackendCategorySummary[]>(payload);

  return categories.map((entry) => ({
    category: entry.category,
    jobCount: entry.job_count,
  }));
}

async function fetchBackendAboutEntries(): Promise<AboutEntry[]> {
  const payload = await fetchJSON<BackendEnvelope<BackendAboutEntry[]> | BackendAboutEntry[]>("/internal/about");
  const entries = unwrapData<BackendAboutEntry[]>(payload);

  return entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    body: entry.body,
  }));
}

async function fetchBackendAboutEntry(id: number): Promise<AboutEntry | null> {
  try {
    const payload = await fetchJSON<BackendEnvelope<BackendAboutEntry> | BackendAboutEntry>(`/internal/about/${id}`);
    const entry = unwrapData<BackendAboutEntry>(payload);

    return {
      id: entry.id,
      title: entry.title,
      body: entry.body,
    };
  } catch (error) {
    unstable_rethrow(error);
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

async function fetchBackendWorkerStatus(): Promise<BackendWorkerStatus> {
  const payload = await fetchJSON<BackendEnvelope<BackendWorkerStatus> | BackendWorkerStatus>("/internal/worker/status");
  return unwrapData<BackendWorkerStatus>(payload);
}

async function fetchBackendWorkerRuns(): Promise<BackendWorkerRun[]> {
  const payload = await fetchJSON<BackendEnvelope<BackendWorkerRun[]> | BackendWorkerRun[]>("/internal/worker/runs");
  return unwrapData<BackendWorkerRun[]>(payload);
}

async function fetchBackendScrapeHealth(): Promise<BackendScrapeHealth> {
  const payload = await fetchJSON<BackendEnvelope<BackendScrapeHealth> | BackendScrapeHealth>("/internal/worker/scrape-health");
  return unwrapData<BackendScrapeHealth>(payload);
}

async function fetchBackendHealth(): Promise<SystemHealth> {
  const payload = await fetchJSON<BackendEnvelope<BackendHealth> | BackendHealth>("/health");
  const health = unwrapData<BackendHealth>(payload);
  return {
    status: health.status,
    database: health.database,
    timestamp: health.timestamp,
  };
}

export async function getPublicJobs(): Promise<ApiResult<JobListItem[]>> {
  const result = await getPublicJobsCatalog({ limit: 9 });
  return {
    data: result.data.items,
    error: result.error,
  };
}

export async function getPublicJobsCatalog(options?: {
  limit?: number;
  search?: string;
  category?: string;
  location?: string;
  workType?: string;
  roleType?: string;
  sort?: "asc" | "desc";
  offset?: number;
}): Promise<ApiResult<PublicJobsCatalog>> {
  const limit = options?.limit ?? 24;
  const offset = options?.offset ?? 0;

  try {
    const page = await fetchBackendJobsPage(limit, {
      search: options?.search,
      category: options?.category,
      location: options?.location,
      workType: options?.workType,
      roleType: options?.roleType,
      sort: options?.sort,
      offset,
    });
    return {
      data: {
        items: page.items.map((job) => ({
          id: job.id,
          slug: job.slug,
          title: job.title,
          company: job.company,
          location: job.location,
          category: job.category,
          workType: job.workType,
          roleType: job.roleType,
          employmentType: job.employmentType,
          companyProfileImageUrl: job.companyProfileImageUrl,
          summary: job.summary,
          salaryRange: job.salaryRange,
        })),
        total: page.total,
        limit: page.limit,
        offset: page.offset,
      },
    };
  } catch (error) {
    unstable_rethrow(error);
    if (isNotFoundError(error)) {
      return {
        data: {
          items: [],
          total: 0,
          limit,
          offset,
        },
      };
    }

    return {
      data: {
        items: [],
        total: 0,
        limit,
        offset,
      },
      error: toErrorMessage(error, "Public jobs could not be loaded from the internal API."),
    };
  }
}

export async function getPublicJobCategories(): Promise<ApiResult<JobCategorySummary[]>> {
  try {
    return {
      data: await fetchBackendJobCategories(),
    };
  } catch (error) {
    unstable_rethrow(error);
    return {
      data: [],
      error: toErrorMessage(error, "Job categories could not be loaded from the internal API."),
    };
  }
}

export async function getJobBySlug(slug: string): Promise<ApiResult<JobDetail | null>> {
  try {
    return {
      data: await fetchBackendJobBySlug(slug),
    };
  } catch (error) {
    unstable_rethrow(error);
    return {
      data: null,
      error: toErrorMessage(error, "Job detail could not be loaded from the internal API."),
    };
  }
}

export async function getAdminOverview(): Promise<ApiResult<AdminOverview>> {
  const [sourcesResult, jobsResult] = await Promise.allSettled([fetchBackendSources(), fetchBackendJobs(200)]);
  const sources = getSettledValue(sourcesResult) ?? [];
  const jobs = getSettledValue(jobsResult) ?? [];
  const errors = [getSettledReason(sourcesResult), getSettledReason(jobsResult)].filter(Boolean);
  if (errors[0]) {
    unstable_rethrow(errors[0]);
  }

  const data: AdminOverview = {
    totalSources: sources.length,
    activeSources: sources.filter((source) => source.active).length,
    normalizedJobs: jobs.filter((job) => job.status === "normalized" || job.status === "approved").length,
    reviewPendingJobs: jobs.filter((job) => job.status === "review_pending").length,
    duplicateJobs: jobs.filter((job) => job.status === "duplicate").length,
  };

  return {
    data: errors.length > 0 ? { ...emptyOverview(), ...data } : data,
    error: errors.length > 0 ? toErrorMessage(errors[0], "Dashboard metrics are partially unavailable.") : undefined,
  };
}

export async function getAdminJobs(options?: {
  status?: string;
  sourceId?: number;
  limit?: number;
  search?: string;
  category?: string;
  location?: string;
  workType?: string;
  roleType?: string;
  sort?: "asc" | "desc";
  offset?: number;
}): Promise<ApiResult<AdminJobListItem[]>> {
  try {
    return {
      data: await fetchBackendJobs(options?.limit ?? 24, options),
    };
  } catch (error) {
    unstable_rethrow(error);
    return {
      data: [],
      error: toErrorMessage(error, "Jobs list could not be loaded from the internal API."),
    };
  }
}

export async function getAdminJobsPage(options?: {
  status?: string;
  sourceId?: number;
  limit?: number;
  search?: string;
  category?: string;
  location?: string;
  workType?: string;
  roleType?: string;
  sort?: "asc" | "desc";
  offset?: number;
}): Promise<ApiResult<PaginatedAdminJobs>> {
  const limit = options?.limit ?? 10;
  const offset = options?.offset ?? 0;

  try {
    return {
      data: await fetchBackendJobsPage(limit, {
        status: options?.status,
        sourceId: options?.sourceId,
        search: options?.search,
        category: options?.category,
        location: options?.location,
        workType: options?.workType,
        roleType: options?.roleType,
        sort: options?.sort,
        offset,
      }),
    };
  } catch (error) {
    unstable_rethrow(error);
    return {
      data: {
        items: [],
        total: 0,
        limit,
        offset,
      },
      error: toErrorMessage(error, "Jobs list could not be loaded from the internal API."),
    };
  }
}

export async function getAdminJobById(id: number): Promise<ApiResult<AdminJobDetail | null>> {
  try {
    return {
      data: await fetchBackendJob(id),
    };
  } catch (error) {
    unstable_rethrow(error);
    return {
      data: null,
      error: toErrorMessage(error, "Job detail could not be loaded from the internal API."),
    };
  }
}

export async function getAdminSources(): Promise<ApiResult<AdminSource[]>> {
  try {
    return {
      data: await fetchBackendSources(),
    };
  } catch (error) {
    unstable_rethrow(error);
    return {
      data: [],
      error: toErrorMessage(error, "Sources could not be loaded from the internal API."),
    };
  }
}

export async function getAboutEntries(): Promise<ApiResult<AboutEntry[]>> {
  try {
    return {
      data: await fetchBackendAboutEntries(),
    };
  } catch (error) {
    unstable_rethrow(error);
    return {
      data: [],
      error: toErrorMessage(error, "About content could not be loaded from the internal API."),
    };
  }
}

export async function getAboutEntryById(id: number): Promise<ApiResult<AboutEntry | null>> {
  try {
    return {
      data: await fetchBackendAboutEntry(id),
    };
  } catch (error) {
    unstable_rethrow(error);
    return {
      data: null,
      error: toErrorMessage(error, "About entry detail could not be loaded from the internal API."),
    };
  }
}

export async function getPipelineStatus(): Promise<ApiResult<PipelineStatus>> {
  const [workerResult, recentRunsResult, scrapeHealthResult] = await Promise.allSettled([
    fetchBackendWorkerStatus(),
    fetchBackendWorkerRuns(),
    fetchBackendScrapeHealth(),
  ]);
  const workerStatus = getSettledValue(workerResult);
  const recentWorkerRuns = getSettledValue(recentRunsResult) ?? [];
  const scrapeHealth = getSettledValue(scrapeHealthResult);
  const errors = [
    getSettledReason(workerResult),
    getSettledReason(recentRunsResult),
    getSettledReason(scrapeHealthResult),
  ].filter(Boolean);
  if (errors[0]) {
    unstable_rethrow(errors[0]);
  }

  const recentRuns = recentWorkerRuns.map((run) => ({
    id: `RUN-${run.id}`,
    startedAt: run.started_at,
    finishedAt: run.finished_at ?? undefined,
    duration: formatDurationSeconds(run.duration_seconds),
    jobsCollected: run.total_jobs_collected,
    successCount: run.successful_sources,
    errorCount: run.failed_sources,
    savedJobs: run.saved_jobs,
    skippedJobs: run.skipped_jobs,
    successRate: run.success_rate_percentage,
    scrapeHealth: run.scrape_health_percentage,
    finalState: run.failed_sources > 0 ? "Completed w/ Errors" : "Completed",
  }));

  const data: PipelineStatus = {
    ...emptyPipelineStatus(),
    running: workerStatus?.running ?? false,
    activeMessage: workerStatus
      ? workerStatus.running
        ? "Worker pipeline is currently running across active sources."
        : "No active runs. The worker pool is currently idle and waiting for the next trigger."
      : "Worker status is unavailable right now.",
    totalJobsCollected: scrapeHealth?.total_jobs_collected ?? 0,
    totalSavedJobs: scrapeHealth?.total_saved_jobs ?? 0,
    totalSkippedJobs: scrapeHealth?.total_skipped_jobs ?? 0,
    totalRuns: scrapeHealth?.total_runs ?? recentRuns.length,
    totalSources: scrapeHealth?.total_sources ?? 0,
    successfulSources: scrapeHealth?.successful_sources ?? 0,
    failedSources: scrapeHealth?.failed_sources ?? 0,
    averageRunDuration: scrapeHealth?.avg_run_duration_seconds
      ? formatDurationSeconds(scrapeHealth.avg_run_duration_seconds)
      : workerStatus?.last_duration || "-",
    successRate: scrapeHealth?.success_rate_percentage ?? 0,
    scrapeHealthPercentage: scrapeHealth?.scrape_health_percentage ?? 0,
    failedAggregations: scrapeHealth?.failed_sources ?? 0,
    recentRuns,
    windowStartedAt: scrapeHealth?.window_started_at,
    windowFinishedAt: scrapeHealth?.window_finished_at,
    lastStartedAt: workerStatus?.last_started_at,
    lastFinishedAt: workerStatus?.last_finished_at,
    lastDuration: workerStatus?.last_duration ?? formatDurationSeconds(recentWorkerRuns[0]?.duration_seconds),
    lastError: workerStatus?.last_error,
  };

  return {
    data,
    error: errors.length > 0 ? toErrorMessage(errors[0], "Pipeline status is partially unavailable.") : undefined,
  };
}

export async function getSystemHealth(): Promise<ApiResult<SystemHealth>> {
  try {
    return {
      data: await fetchBackendHealth(),
    };
  } catch (error) {
    unstable_rethrow(error);
    return {
      data: {
        status: "degraded",
        database: "unknown",
        timestamp: new Date().toISOString(),
      },
      error: toErrorMessage(error, "Health status could not be loaded from the internal API."),
    };
  }
}

export async function getScrapeHealthSummary(): Promise<ApiResult<ScrapeHealthSummary>> {
  try {
    const health = await fetchBackendScrapeHealth();

    return {
      data: {
        windowStartedAt: health.window_started_at,
        windowFinishedAt: health.window_finished_at,
        totalRuns: health.total_runs,
        totalSources: health.total_sources,
        successfulSources: health.successful_sources,
        failedSources: health.failed_sources,
        totalJobsCollected: health.total_jobs_collected,
        totalSavedJobs: health.total_saved_jobs,
        totalSkippedJobs: health.total_skipped_jobs,
        averageRunDuration: formatDurationSeconds(health.avg_run_duration_seconds),
        successRatePercentage: health.success_rate_percentage,
        scrapeHealthPercentage: health.scrape_health_percentage,
      },
    };
  } catch (error) {
    unstable_rethrow(error);
    return {
      data: {
        windowStartedAt: "",
        windowFinishedAt: "",
        totalRuns: 0,
        totalSources: 0,
        successfulSources: 0,
        failedSources: 0,
        totalJobsCollected: 0,
        totalSavedJobs: 0,
        totalSkippedJobs: 0,
        averageRunDuration: "-",
        successRatePercentage: 0,
        scrapeHealthPercentage: 0,
      },
      error: toErrorMessage(error, "24h scrape summary could not be loaded from the internal API."),
    };
  }
}

function formatDurationSeconds(value?: number | null) {
  if (!value || value <= 0) {
    return "-";
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  if (seconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
}
