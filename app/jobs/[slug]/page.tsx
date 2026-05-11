import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  BriefcaseBusiness,
  Gift,
  Building2,
  CalendarDays,
  ExternalLink,
  MapPin,
  Sparkles,
} from "lucide-react";

import {
  AnalyticsJobView,
  AnalyticsPageView,
  ApplyLinkButton,
} from "@/components/public/analytics-trackers";
import { CompanyAvatar } from "@/components/public/company-avatar";
import { PublicChrome } from "@/components/public/public-chrome";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJobById } from "@/lib/api";
import { normalizeListEntry, splitContentLines } from "@/lib/job-content";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import type { JobDetail } from "@/lib/types";
import { getSafeExternalUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

type JobDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data: job } = await getJobById(slug);

  if (!job) {
    return {
      title: "Job Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = truncateText(job.summary || firstParagraph(job.description), 155);
  const canonical = `/jobs/${job.id}`;

  return {
    title: `${job.title} at ${job.company}`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      title: `${job.title} at ${job.company}`,
      description,
      url: canonical,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: `${job.title} at ${job.company}`,
      description,
    },
  };
}

export default async function JobDetailPage({
  params,
}: JobDetailPageProps) {
  const { slug } = await params;
  const { data: job, error } = await getJobById(slug);

  if (!job) {
    if (error) {
      return (
        <PublicChrome active="jobs" contentClassName="flex min-h-[72vh] items-center">
          <Card className="mx-auto w-full max-w-3xl rounded-[30px] border-amber-200 bg-white/92 py-0 shadow-[0_10px_24px_-24px_rgba(17,24,39,0.18)]">
            <CardContent className="px-8 py-12 text-center">
              <Badge className="rounded-full bg-amber-100 text-amber-800 hover:bg-amber-100">
                API unavailable
              </Badge>
              <h1 className="mt-6 text-3xl font-black tracking-tight text-[#141b2d] sm:text-4xl">
                Job detail belum bisa dimuat.
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#687086] sm:text-base">
                {error}
              </p>
              <Link
                href="/jobs"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "mt-8 h-12 rounded-xl bg-[#4b41e7] px-6 text-white hover:bg-[#3e35d2]",
                )}
              >
                Back to jobs
              </Link>
            </CardContent>
          </Card>
        </PublicChrome>
      );
    }

    notFound();
  }

  const roleSummary = buildRoleSummary(job.description);
  const responsibilities = deriveResponsibilities(job.description);
  const aboutItems = humanizeEntries(job.requirements);
  const benefitItems = humanizeEntries(job.benefits);
  const skillTags = (
    job.tags && job.tags.length > 0
      ? job.tags
      : deriveSkills(job.requirements, job.category, job.employmentType, job.workType)
  ).slice(0, 6);
  const workModel = job.workType ?? inferWorkModel(job.workplaceType, job.location);
  const experience = inferExperience(job.title);
  const companySummary = job.summary || firstParagraph(job.description);
  const companyWebsite = normalizeWebsite(job.sourceWebsite);
  const companySize = inferCompanySize(job.employmentType, job.category);
  const industry = inferIndustry(job.category);
  const jobPostingJsonLd = buildJobPostingJsonLd(job);
  const safeApplyUrl = getSafeExternalUrl(job.sourceApplyUrl);
  const safeSourceJobUrl = getSafeExternalUrl(job.sourceJobUrl);
  const analyticsPath = `/jobs/${job.id}`;
  const jobAnalyticsMetadata = {
    title: job.title,
    company: job.company,
    category: job.category,
    work_type: job.workType,
    employment_type: job.employmentType,
    location: job.location,
  };

  return (
    <PublicChrome active="jobs" contentClassName="space-y-8 sm:space-y-10">
      <AnalyticsPageView page="job_detail" path={analyticsPath} />
      <AnalyticsJobView jobId={job.id} path={analyticsPath} metadata={jobAnalyticsMetadata} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
      />
      <section className="space-y-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl tracking-tight text-[#141b2d] sm:text-5xl lg:text-[4.2rem] lg:leading-[1.02]">
            {job.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#6f768b] sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <CompanyAvatar
                company={job.company}
                imageUrl={job.companyProfileImageUrl}
                className="flex size-5 items-center justify-center overflow-hidden rounded-md bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)]"
                imageClassName="h-full w-full object-cover"
                fallbackClassName="text-[10px] font-bold text-white"
              />
              {job.company}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-[#8f96ad]" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-[#8f96ad]" />
              Posted {formatPosted(job.postedAt)}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {safeApplyUrl ? (
              <ApplyLinkButton
                href={safeApplyUrl}
                event={{
                  event_name: "apply_clicked",
                  path: analyticsPath,
                  job_id: job.id,
                  metadata: jobAnalyticsMetadata,
                }}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 rounded-xl bg-[#4b41e7] px-6 text-sm text-white shadow-[0_16px_32px_-22px_rgba(75,65,231,0.7)] hover:bg-[#3e35d2]",
                )}
              >
                Apply on Source
                <ExternalLink className="size-4" />
              </ApplyLinkButton>
            ) : (
              <span
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 cursor-not-allowed rounded-xl bg-slate-300 px-6 text-sm text-white",
                )}
              >
                Apply link unavailable
              </span>
            )}
            <Link
              href={`/career-tools/job-match?job_id=${job.id}&job_title=${encodeURIComponent(job.title)}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d9dff0] bg-white px-4 text-sm font-medium text-[#4b41e7] hover:bg-[#f7f8ff] dark:border-slate-700/70 dark:bg-slate-900/78 dark:text-indigo-200 dark:hover:bg-slate-800/86"
            >
              Match CV
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_312px]">
          <div className="space-y-6">
            <DetailSectionCard icon={<BriefcaseBusiness className="size-4" />} title="The Role">
              <div className="space-y-4 text-[13px] leading-7 text-[#4f5670] sm:text-sm sm:leading-8">
                {roleSummary.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </DetailSectionCard>

            {responsibilities.length > 0 ? (
              <DetailSectionCard icon={<Sparkles className="size-4" />} title="Key Responsibilities">
                <ul className="space-y-4 text-[13px] leading-7 text-[#4f5670] sm:text-sm sm:leading-8">
                  {responsibilities.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2.5 size-1 rounded-full bg-[#4b41e7]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </DetailSectionCard>
            ) : null}

            {aboutItems.length > 0 ? (
              <DetailSectionCard icon={<Building2 className="size-4" />} title="About You">
                <ul className="space-y-4 text-[13px] leading-7 text-[#4f5670] sm:text-sm sm:leading-8">
                  {aboutItems.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2.5 size-1 rounded-full bg-[#4b41e7]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </DetailSectionCard>
            ) : null}

            {benefitItems.length > 0 ? (
              <DetailSectionCard icon={<Gift className="size-4" />} title="Benefits">
                <ul className="space-y-4 text-[13px] leading-7 text-[#4f5670] sm:text-sm sm:leading-8">
                  {benefitItems.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2.5 size-1 rounded-full bg-[#4b41e7]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </DetailSectionCard>
            ) : null}
          </div>

          <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <Card className="rounded-[22px] border-white/80 bg-[#eef2ff] py-0 shadow-[0_10px_24px_-24px_rgba(17,24,39,0.14)] dark:border-slate-700/70 dark:bg-slate-900/78">
              <CardHeader className="px-5 py-5">
                <CardTitle className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#5f667b]">
                  At A Glance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 px-5 pb-5 pt-0">
                <div className="grid grid-cols-2 gap-5">
                  <MetricPair label="Salary Range" value={job.salaryRange ?? "Not specified"} />
                  <MetricPair label="Experience" value={experience} />
                  <MetricPair label="Job Type" value={job.employmentType} />
                  <MetricPair label="Work Model" value={workModel} />
                </div>

                <div className="border-t border-white/60 pt-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6c7388]">
                    Required Skills
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skillTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="h-auto rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-[#555d73] hover:bg-white dark:bg-slate-800/88 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[22px] border-white/80 bg-white/92 py-0 shadow-[0_10px_24px_-24px_rgba(17,24,39,0.14)] dark:border-slate-700/70 dark:bg-slate-900/78">
              <CardHeader className="px-5 py-5">
                <CardTitle className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#5f667b]">
                  About The Company
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 px-5 pb-5 pt-0">
                <div className="flex items-center gap-3">
                  <CompanyAvatar
                    company={job.company}
                    imageUrl={job.companyProfileImageUrl}
                    className="flex size-12 items-center justify-center overflow-hidden rounded-xl bg-[#eef1ff]"
                    imageClassName="h-full w-full object-cover"
                    fallbackClassName="text-sm font-bold text-[#4b41e7]"
                  />
                  <div>
                    <p className="text-xl font-bold text-[#141b2d]">{job.company}</p>
                    <p className="text-xs text-[#7a8096]">{companyWebsite}</p>
                  </div>
                </div>

                <p className="text-[13px] leading-7 text-[#4f5670]">{companySummary}</p>

                <div className="grid grid-cols-2 gap-3">
                  <MetaBlock label="Size" value={companySize} />
                  <MetaBlock label="Industry" value={industry} />
                </div>

                {safeSourceJobUrl ? (
                  <a
                    href={safeSourceJobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "h-11 w-full rounded-xl border-[#d9dff0] bg-white text-sm text-[#4b41e7] hover:bg-[#f5f7ff] dark:border-slate-700/70 dark:bg-slate-900/78 dark:text-indigo-200 dark:hover:bg-slate-800/86",
                    )}
                  >
                    View Company Profile
                  </a>
                ) : (
                  <span
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "h-11 w-full cursor-not-allowed rounded-xl border-[#d9dff0] bg-white text-sm text-[#8b92a6]",
                    )}
                  >
                    Source link unavailable
                  </span>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}

function DetailSectionCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-[22px] border-white/80 bg-white/92 py-0 shadow-[0_10px_24px_-24px_rgba(17,24,39,0.14)] dark:border-slate-700/70 dark:bg-slate-900/78">
      <CardContent className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#eef1ff] text-[#4b41e7]">
              {icon}
            </span>
            <h2 className="text-[1.05rem] font-bold text-[#141b2d] sm:text-xl">{title}</h2>
          </div>
          <div>{children}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7a8096]">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#141b2d]">{value}</p>
    </div>
  );
}

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#edf0f7] bg-[#fbfcff] px-4 py-3 dark:border-slate-700/70 dark:bg-slate-950/35">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7a8096]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[#303850]">{value}</p>
    </div>
  );
}

function humanizeEntries(values: string[]) {
  return values
    .map((value) => normalizeListEntry(value))
    .map((value) => value.replace(/\s*[â€¢Â·]+\s*/g, " ").trim())
    .filter(Boolean);
}

function buildRoleSummary(description: string) {
  const lines = humanizeEntries(splitContentLines(description));
  if (lines.length === 0) {
    return ["No role summary available."];
  }

  if (lines.length <= 2) {
    return lines;
  }

  const mostlyShortLines = lines.filter((line) => line.length <= 120).length >= Math.ceil(lines.length * 0.6);
  if (mostlyShortLines) {
    return lines.slice(0, 3);
  }

  const joined = lines.join(". ").replace(/\.\s*\./g, ".").trim();
  const sentences = joined
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.slice(0, 2);
}

function deriveResponsibilities(description: string) {
  const lines = humanizeEntries(splitContentLines(description));
  if (lines.length === 0) {
    return [];
  }

  if (lines.length === 1) {
    return lines[0]
      .split(/(?<=[.!?])\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);
  }

  return lines.slice(0, 8);
}

function deriveSkills(requirements: string[], category: string, employmentType: string, workType?: string) {
  const skills = new Set<string>([category, employmentType, workType ?? ""]);

  for (const requirement of requirements) {
    const matches = requirement.match(/[A-Z][A-Za-z0-9+#/.&-]+(?:\s+[A-Z][A-Za-z0-9+#/.&-]+)*/g);
    for (const match of matches ?? []) {
      if (match.length > 1 && skills.size < 6) {
        skills.add(match);
      }
    }
  }

  return [...skills].filter(Boolean);
}

function inferWorkModel(workplaceType: string | undefined, location: string) {
  if (workplaceType && workplaceType !== "not_specified") {
    return workplaceType.replace(/_/g, " ");
  }

  const normalized = location.toLowerCase();
  if (normalized.includes("remote")) {
    return "Remote";
  }
  if (normalized.includes("hybrid")) {
    return "Hybrid";
  }
  return "On-site";
}

function inferExperience(title: string) {
  const normalized = title.toLowerCase();
  if (/\b(senior|staff|lead|principal|head|vp)\b/.test(normalized)) {
    return "5+ Years (Senior)";
  }
  if (/\b(junior|intern|graduate|entry)\b/.test(normalized)) {
    return "0-2 Years (Entry)";
  }
  return "3+ Years (Mid Level)";
}

function inferCompanySize(employmentType: string, category: string) {
  const normalized = `${employmentType} ${category}`.toLowerCase();
  if (normalized.includes("contract")) {
    return "50-200 Emp.";
  }
  if (normalized.includes("design") || normalized.includes("product")) {
    return "200-500 Emp.";
  }
  if (normalized.includes("engineering") || normalized.includes("data")) {
    return "500-1000 Emp.";
  }
  return "100-300 Emp.";
}

function inferIndustry(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("design") || normalized.includes("product")) {
    return "Product / SaaS";
  }
  if (normalized.includes("data")) {
    return "Data / Analytics";
  }
  if (normalized.includes("security")) {
    return "Cybersecurity";
  }
  if (normalized.includes("engineering")) {
    return "Fintech / SaaS";
  }
  return "Technology";
}

function normalizeWebsite(value?: string) {
  if (!value) {
    return "brieflych.com";
  }

  return value
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

function firstParagraph(value: string) {
  return buildRoleSummary(value)[0];
}

function formatPosted(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffInDays = Math.max(0, Math.round((Date.now() - date.getTime()) / 86400000));
  if (diffInDays <= 0) {
    return "today";
  }
  if (diffInDays === 1) {
    return "1 day ago";
  }
  return `${diffInDays} days ago`;
}

function truncateText(value: string, maxLength: number) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 1).trim()}...`;
}

function buildJobPostingJsonLd(job: JobDetail) {
  const siteUrl = getSiteUrl();
  const organizationUrl = buildAbsoluteUrl(job.sourceWebsite) ?? siteUrl;
  const description = [
    ...buildRoleSummary(job.description),
    ...humanizeEntries(job.requirements),
    ...humanizeEntries(job.benefits),
  ].join("\n");

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description,
    datePosted: toIsoDate(job.postedAt),
    employmentType: normalizeSchemaEmploymentType(job.employmentType),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      sameAs: organizationUrl,
      ...(job.companyProfileImageUrl ? { logo: job.companyProfileImageUrl } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
      },
    },
    applicantLocationRequirements:
      job.workType?.toLowerCase().includes("remote")
        ? {
            "@type": "Country",
            name: "Worldwide",
          }
        : undefined,
    jobLocationType: job.workType?.toLowerCase().includes("remote") ? "TELECOMMUTE" : undefined,
    industry: job.category,
    directApply: false,
    url: `${siteUrl}/jobs/${job.id}`,
  };
}

function buildAbsoluteUrl(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const withProtocol = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;

  try {
    const url = new URL(withProtocol);
    return url.toString();
  } catch {
    return undefined;
  }
}

function normalizeSchemaEmploymentType(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("full")) return "FULL_TIME";
  if (normalized.includes("part")) return "PART_TIME";
  if (normalized.includes("contract")) return "CONTRACTOR";
  if (normalized.includes("intern")) return "INTERN";
  if (normalized.includes("temporary")) return "TEMPORARY";
  return "OTHER";
}

function toIsoDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}
