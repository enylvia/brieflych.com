import type { Metadata } from "next";

import { CareerToolsPanel } from "@/components/public/career-tools-panel";
import { AnalyticsPageView } from "@/components/public/analytics-trackers";
import { PublicChrome } from "@/components/public/public-chrome";

export const metadata: Metadata = {
  title: "Skor CV ATS",
  description:
    "Analisis CV untuk membaca skor ATS, struktur, readability, keyword match, dan rekomendasi perbaikan.",
  alternates: {
    canonical: "/career-tools/ats-score",
  },
};

export default function AtsScoreToolPage() {
  return (
    <PublicChrome active="tools" contentClassName="space-y-8">
      <AnalyticsPageView page="career_tools_ats_score" path="/career-tools/ats-score" />
      <section className="mx-auto max-w-5xl space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4b41e7]">Career Tools</p>
        <h1 className="text-3xl font-black tracking-tight text-[#141b2d] sm:text-5xl">
          Skor CV ATS
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-7 text-[#687086] sm:text-base">
          Upload CV kamu untuk melihat skor ATS, struktur, keyword match, dan rekomendasi perbaikan yang bisa langsung ditindaklanjuti.
        </p>
      </section>
      <CareerToolsPanel tool="ats" />
    </PublicChrome>
  );
}
