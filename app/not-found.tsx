import Link from "next/link";
import { Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8f3ea_0%,#faf8f4_45%,#ffffff_100%)] px-6">
      <section className="flex w-full max-w-5xl items-center justify-center">
        <Card className="w-full max-w-3xl rounded-[30px] border-white/80 bg-white/92 py-0 shadow-[0_34px_80px_-48px_rgba(17,24,39,0.42)]">
          <CardContent className="px-6 py-12 text-center sm:px-8 sm:py-14">
            <div className="mx-auto flex size-20 items-center justify-center rounded-[28px] bg-[#eef2ff] text-[#7e84a0]">
              <Search className="size-9" />
            </div>

            <h1 className="mt-8 text-2xl font-black tracking-tight text-[#141b2d] sm:text-4xl">
              404 - Jobs not found.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#6f768b] sm:text-lg">
              We couldn&apos;t find the job you&apos;re looking for. Try exploring all open roles instead.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
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
                href="/"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 rounded-xl border-[#d8def0] bg-white px-6 text-[#4b41e7] hover:bg-[#f4f6ff]",
                )}
              >
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}