import Link from "next/link";
import type { Metadata } from "next";
import {
  BriefcaseBusiness,
  Code2,
  Database,
  Layers3,
  MapPin,
  MonitorPlay,
  ShieldCheck,
} from "lucide-react";

import { PublicChrome } from "@/components/public/public-chrome";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPublicJobCategories } from "@/lib/api";
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
  const { data: categories, error } = await getPublicJobCategories();
  const visibleCategories = categories.slice(0, 5);
  const websiteJsonLd = buildWebsiteJsonLd();

  return (
    <PublicChrome active="jobs" contentClassName="space-y-12 sm:space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <section className="pt-2 sm:pt-8">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="mt-6 text-3xl font-black tracking-tight text-[#141b2d] sm:text-5xl lg:text-6xl">
            The modern standard for{" "}
            <span className="text-[#4b41e7]">technical hiring.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#687086] sm:text-lg">
            Connect with top-tier companies. High-signal roles for engineers, designers, and
            product leaders.
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
                <Link
                  key={category.category}
                  href={`/jobs?category=${encodeURIComponent(category.category)}`}
                  className={cn(
                    "group rounded-[28px] border border-white/80 bg-[#eef2ff] p-6 shadow-[0_28px_60px_-48px_rgba(17,24,39,0.42)] transition-transform hover:-translate-y-1",
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
                </Link>
              );
            })}
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
              <button
                type="button"
                disabled
                className="h-12 rounded-xl bg-white px-6 text-xs font-black uppercase tracking-[0.16em] text-[#4b41e7] opacity-90 shadow-[0_18px_36px_-26px_rgba(15,23,42,0.5)]"
              >
                Subscribe
              </button>
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
