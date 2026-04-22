export type JobStatus =
  | "scraped"
  | "normalized"
  | "review_pending"
  | "duplicate"
  | "approved"
  | "rejected"
  | "archived";

export type JobListItem = {
  id: number;
  slug: string;
  title: string;
  company: string;
  location: string;
  category: string;
  workType?: string;
  roleType?: string;
  employmentType: string;
  companyProfileImageUrl?: string;
  summary: string;
  salaryRange?: string;
};

export type JobDetail = JobListItem & {
  description: string;
  requirements: string[];
  benefits: string[];
  sourceApplyUrl: string;
  sourceJobUrl: string;
  postedAt: string;
  sourceName?: string;
  sourceWebsite?: string;
  workplaceType?: string;
  tags?: string[];
};

export type PublicJobsCatalog = {
  items: JobListItem[];
  total: number;
  limit: number;
  offset: number;
};

export type JobCategorySummary = {
  category: string;
  jobCount: number;
};

export type AboutEntry = {
  id: number;
  title: string;
  body: string;
};

export type AdminOverview = {
  totalSources: number;
  activeSources: number;
  publishedJobs: number;
  normalizedJobs: number;
  totalScrapedJobs: number;
};

export type AnalyticsTopViewedJob = {
  jobId: number;
  title: string;
  company: string;
  viewCount: number;
};

export type AnalyticsTopSearchKeyword = {
  keyword: string;
  searchCount: number;
};

export type AnalyticsSummary = {
  windowStartedAt: string;
  windowFinishedAt: string;
  visitorsToday: number;
  pageViewsToday: number;
  jobViewsToday: number;
  applyClicksToday: number;
  searchesToday: number;
  conversionRate: number;
  topViewedJobs: AnalyticsTopViewedJob[];
  topSearchKeywords: AnalyticsTopSearchKeyword[];
};

export type AdminJobListItem = JobListItem & {
  status: JobStatus;
  sourceId: number;
  sourceName: string;
  collectedAt: string;
  salaryRange?: string;
};

export type PaginatedAdminJobs = {
  items: AdminJobListItem[];
  total: number;
  limit: number;
  offset: number;
};

export type AdminJobDetail = JobDetail & {
  status: JobStatus;
  sourceId: number;
  sourceName: string;
  sourceWebsite: string;
  scraperType: string;
  collectedAt: string;
  parseConfidence: number;
  duplicateMatch?: number;
  duplicateReference?: string;
  extractedEntities: string[];
  workplaceType?: string;
  salaryRange?: string;
  tags: string[];
};

export type AdminSource = {
  id: number;
  name: string;
  domain: string;
  mode: string;
  active: boolean;
  lastScrapedAt: string | null;
  scrapeIntervalMinutes: number;
  successRate: number;
  statusLabel: string;
};

export type ScrapeHealthSummary = {
  windowStartedAt: string;
  windowFinishedAt: string;
  totalRuns: number;
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  totalJobsCollected: number;
  totalSavedJobs: number;
  totalSkippedJobs: number;
  averageRunDuration: string;
  successRatePercentage: number;
  scrapeHealthPercentage: number;
};

export type PipelineRun = {
  id: string;
  startedAt: string;
  finishedAt?: string;
  duration: string;
  jobsCollected: number;
  successCount: number;
  errorCount: number;
  savedJobs?: number;
  skippedJobs?: number;
  successRate?: number;
  scrapeHealth?: number;
  finalState: string;
};

export type PipelineStatus = {
  running: boolean;
  activeMessage: string;
  totalJobsCollected: number;
  totalSavedJobs: number;
  totalSkippedJobs: number;
  totalRuns: number;
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  averageRunDuration: string;
  successRate: number;
  scrapeHealthPercentage: number;
  failedAggregations: number;
  recentRuns: PipelineRun[];
  windowStartedAt?: string;
  windowFinishedAt?: string;
  lastStartedAt?: string;
  lastFinishedAt?: string;
  lastDuration?: string;
  lastError?: string;
};

export type SystemHealth = {
  status: string;
  database: string;
  timestamp: string;
};
