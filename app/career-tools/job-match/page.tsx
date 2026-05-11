import type { Metadata } from "next";

import { CareerToolsPanel } from "@/components/public/career-tools-panel";
import { AnalyticsPageView } from "@/components/public/analytics-trackers";
import { PublicChrome } from "@/components/public/public-chrome";

export const metadata: Metadata = {
  title: "Match CV dengan Lowongan",
  description:
    "Bandingkan CV dengan lowongan target untuk melihat match score, keyword overlap, skill gap, dan saran update CV.",
  alternates: {
    canonical: "/career-tools/job-match",
  },
};

export default async function JobMatchToolPage({
  searchParams,
}: {
  searchParams?: Promise<{
    job_id?: string | string[];
    job_title?: string | string[];
  }>;
}) {
  const params = (await searchParams) ?? {};
  const jobId = firstValue(params.job_id);
  const jobTitle = firstValue(params.job_title);

  return (
    <PublicChrome active="tools" contentClassName="space-y-8">
      <AnalyticsPageView page="career_tools_job_match" path="/career-tools/job-match" />
      <section className="mx-auto max-w-5xl space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4b41e7]">Career Tools</p>
        <h1 className="text-3xl font-black tracking-tight text-[#141b2d] sm:text-5xl">
          Match CV
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-7 text-[#687086] sm:text-base">
          Cocokkan CV dengan lowongan target untuk melihat kekuatan match, keyword yang kurang, dan update yang sebaiknya kamu lakukan.
        </p>
      </section>
      <CareerToolsPanel tool="match" initialJobId={jobId} initialJobTitle={jobTitle} />
    </PublicChrome>
  );
}

function firstValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}
