import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  Code2,
  Database,
  Layers3,
  MapPin,
  MonitorPlay,
  ShieldCheck,
  Wifi,
} from "lucide-react";

import {
  AnalyticsButton,
  AnalyticsLink,
  AnalyticsPageView,
} from "@/components/public/analytics-trackers";
import { CompanyAvatar } from "@/components/public/company-avatar";
import { PublicChrome } from "@/components/public/public-chrome";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPublicJobCategories, getPublicJobsCatalog } from "@/lib/api";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

const categoryIcons = [Code2, Layers3, Database, MonitorPlay, ShieldCheck];

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} - Curated Job Discovery`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} - Curated Job Discovery`,
    description: SITE_DESCRIPTION,
    url: "/",
  },
};

export default async function Home() {
  const [categoriesResult, latestJobsResult] = await Promise.all([
    getPublicJobCategories(),
    getPublicJobsCatalog({ limit: 6, sort: "desc" }),
  ]);
  const categories = categoriesResult.data;
  const latestJobs = latestJobsResult.data.items;
  const error = categoriesResult.error || latestJobsResult.error;
  const visibleCategories = categories.slice(0, 5);
  const websiteJsonLd = buildWebsiteJsonLd();

  return (
    <PublicChrome active="jobs" contentClassName="space-y-12 sm:space-y-16">
      <AnalyticsPageView page="home" path="/" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <section className="pt-2 sm:pt-8">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="mt-6 text-3xl font-black tracking-tight text-[#141b2d] sm:text-5xl lg:text-6xl">
            Find better opportunities,{" "}
            <span className="text-[#4b41e7]">faster.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#687086] sm:text-lg">
            Explore curated job openings from trusted sources, and apply directly where they were
            posted.
          </p>
        </div>

        <Card className="mx-auto mt-10 max-w-5xl rounded-[28px] border-white/80 bg-white/88 py-3 shadow-[0_34px_80px_-48px_rgba(17,24,39,0.42)]">
          <CardContent className="px-3">
            <form action="/jobs" method="get" className="grid gap-3 lg:grid-cols-[1.2fr_1fr_auto]">
              <div className="relative">
                <BriefcaseBusiness className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#969cb0]" />
                <Input
                  name="q"
                  placeholder="Job title, keywords, or company"
                  className="h-14 rounded-2xl border-[#eef1f8] bg-[#fafbff] pl-11 text-sm shadow-none placeholder:text-[#9ca4bb]"
                />
              </div>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#969cb0]" />
                <Input
                  name="location"
                  placeholder="City, state, zip code, or remote"
                  className="h-14 rounded-2xl border-[#eef1f8] bg-[#fafbff] pl-11 text-sm shadow-none placeholder:text-[#9ca4bb]"
                />
              </div>
              <button
                type="submit"
                className="h-14 rounded-2xl bg-[#4b41e7] px-7 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(75,65,231,0.75)] transition-all hover:-translate-y-0.5 hover:bg-[#3e35d2]"
              >
                Find Jobs
              </button>
            </form>
          </CardContent>
        </Card>
        {error ? (
          <div className="mx-auto mt-6 max-w-3xl rounded-3xl border border-amber-200 bg-amber-50/90 px-5 py-4 text-sm text-amber-800">
            {error}
          </div>
        ) : null}
      </section>

      <section id="categories" className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#141b2d]">Explore Categories</p>
            <p className="mt-1 text-sm text-[#7d8398]">
              Discover roles across key engineering and design disciplines.
            </p>
          </div>
          <Link href="/jobs" className="text-sm font-semibold text-[#4b41e7] hover:text-[#3e35d2]">
            All Categories
          </Link>
        </div>

        {visibleCategories.length === 0 ? (
          <Card className="rounded-[28px] border-dashed border-[#d8deef] bg-white/70 py-0">
            <CardContent className="px-6 py-12 text-center text-sm text-[#687086]">
              No public job categories are available yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleCategories.map((category, index) => {
              const Icon = categoryIcons[index % categoryIcons.length];

              return (
                <AnalyticsLink
                  key={category.category}
                  href={`/jobs?category=${encodeURIComponent(category.category)}`}
                  event={{
                    event_name: "category_clicked",
                    path: "/",
                    metadata: {
                      category: category.category,
                      job_count: category.jobCount,
                    },
                  }}
                  className={cn(
                    "group rounded-[28px] border border-white/80 bg-[#eef2ff] p-6 shadow-[0_28px_60px_-48px_rgba(17,24,39,0.42)] transition-transform hover:-translate-y-1 dark:border-slate-700/70 dark:bg-slate-900/78",
                    index === 0 && "sm:col-span-2 xl:min-h-[220px]",
                  )}
                >
                  <div className="flex h-full flex-col justify-between gap-6">
                    <div>
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-[#4b41e7] text-white shadow-[0_18px_28px_-22px_rgba(75,65,231,0.9)]">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="mt-5 text-xl font-bold text-[#141b2d]">{category.category}</h3>
                      <p className="mt-2 max-w-md text-sm leading-6 text-[#6e7488]">
                        Explore currently active openings across {category.category.toLowerCase()} roles.
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#4b41e7]">{category.jobCount} openings</p>
                  </div>
                </AnalyticsLink>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="latest-jobs-heading" className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p id="latest-jobs-heading" className="text-sm font-semibold text-[#141b2d]">
              Latest Jobs
            </p>
            <p className="mt-1 text-sm text-[#7d8398]">
              Freshly collected openings from trusted hiring sources.
            </p>
          </div>
          <Link
            href="/jobs?sort=desc"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#4b41e7] hover:text-[#3e35d2]"
          >
            View all jobs
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {latestJobs.length === 0 ? (
          <Card className="rounded-[28px] border-dashed border-[#d8deef] bg-white/70 py-0">
            <CardContent className="px-6 py-12 text-center text-sm text-[#687086]">
              No latest jobs are available yet. Please check back soon.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {latestJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="group rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_28px_70px_-52px_rgba(17,24,39,0.38)] transition-all hover:-translate-y-1 hover:bg-white dark:border-slate-700/70 dark:bg-slate-900/78 dark:hover:bg-slate-800/88"
              >
                <div className="flex h-full flex-col gap-5">
                  <div className="flex items-start gap-4">
                    <CompanyAvatar
                      company={job.company}
                      imageUrl={job.companyProfileImageUrl}
                      className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eef1ff]"
                      imageClassName="h-full w-full object-cover"
                      fallbackClassName="text-base font-bold text-[#4b41e7]"
                    />
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-lg font-black leading-6 text-[#141b2d]">
                        {job.title}
                      </h3>
                      <p className="mt-1 truncate text-sm text-[#687086]">{job.company}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-[#626a80]">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 shrink-0 text-[#8d94aa]" />
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wifi className="size-4 shrink-0 text-[#8d94aa]" />
                      <span>{job.workType ?? "Not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Banknote className="size-4 shrink-0 text-[#8d94aa]" />
                      <span>{job.salaryRange ?? "Salary not listed"}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#eef1f8] pt-4">
                    <Badge className="h-auto rounded-full bg-[#eef2ff] px-3 py-1 text-xs text-[#4b41e7] hover:bg-[#eef2ff] dark:bg-indigo-500/16 dark:text-indigo-200 dark:hover:bg-indigo-500/20">
                      {job.category}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#4b41e7]">
                      Details
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="newsletter-heading">
        <div className="overflow-hidden rounded-[28px] bg-[#4b41e7] px-6 py-7 text-white shadow-[0_28px_70px_-44px_rgba(75,65,231,0.76)] sm:px-8 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] lg:items-center">
            <div>
              <h2 id="newsletter-heading" className="text-2xl font-black tracking-tight sm:text-3xl">
                Stay ahead of the curve.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
                Get the latest high-signal technical roles, hiring trends, and career insights
                delivered to your inbox once a week.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                type="email"
                placeholder="Enter your work email"
                disabled
                aria-label="Work email for future newsletter subscription"
                className="h-12 rounded-xl border-white/10 bg-white/12 px-4 text-sm text-white shadow-none placeholder:text-white/50 disabled:cursor-not-allowed disabled:opacity-100"
              />
              <AnalyticsButton
                event={{
                  event_name: "newsletter_interest",
                  path: "/",
                  metadata: {
                    action: "subscribe_button_clicked",
                  },
                }}
                className="h-12 rounded-xl bg-white px-6 text-xs font-black uppercase tracking-[0.16em] text-[#4b41e7] opacity-90 shadow-[0_18px_36px_-26px_rgba(15,23,42,0.5)] transition-opacity hover:opacity-100 dark:bg-slate-950/86 dark:text-indigo-200"
              >
                Subscribe
              </AnalyticsButton>
            </div>
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}

function buildWebsiteJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/jobs?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
    },
  };
}
