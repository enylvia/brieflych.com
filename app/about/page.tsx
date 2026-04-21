import type { Metadata } from "next";

import { PublicChrome } from "@/components/public/public-chrome";
import { Card, CardContent } from "@/components/ui/card";
import { getAboutEntries } from "@/lib/api";
import { splitContentLines } from "@/lib/job-content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about BrieflyCH, a curated job discovery platform built to help candidates find high-signal opportunities faster.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About BrieflyCH",
    description:
      "Learn about BrieflyCH and how we help candidates discover curated, high-signal job opportunities.",
    url: "/about",
  },
};

export default async function AboutPage() {
  const { data: entries, error } = await getAboutEntries();

  return (
    <PublicChrome active="about" contentClassName="space-y-8 sm:space-y-10">
      <section className="mx-auto max-w-5xl space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4b41e7]">About BrieflyCH</p>
        <h1 className="text-3xl font-black tracking-tight text-[#141b2d] sm:text-5xl">
          The story, values, and purpose behind BrieflyCH.
        </h1>
      </section>

      {error ? (
        <div className="mx-auto max-w-4xl rounded-3xl border border-amber-200 bg-amber-50/90 px-5 py-4 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      {entries.length === 0 ? (
        <Card className="mx-auto max-w-4xl rounded-[30px] border-dashed border-[#d7dff1] bg-white/84 py-0">
          <CardContent className="px-6 py-14 text-center text-sm leading-7 text-[#687086] sm:text-base">
            About content belum tersedia. Silakan tambahkan section pertama dari admin panel.
          </CardContent>
        </Card>
      ) : (
        <div className="mx-auto grid max-w-5xl gap-5">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="rounded-[30px] border-white/80 bg-white/92 py-0 shadow-[0_28px_60px_-48px_rgba(17,24,39,0.24)]"
            >
              <CardContent className="px-6 py-7 sm:px-8 sm:py-8">
                <h2 className="text-2xl font-bold tracking-tight text-[#141b2d]">{entry.title}</h2>
                <div className="mt-5 space-y-4 text-sm leading-7 text-[#545c73] sm:text-base sm:leading-8">
                  {splitContentLines(entry.body).map((line, index) => (
                    <p key={`${entry.id}-${index}`}>{line}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PublicChrome>
  );
}
