"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { BriefcaseBusiness, ChevronDown, FileText } from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Browse Jobs", href: "/jobs", key: "jobs" },
  { label: "Categories", href: "/#categories", key: "categories" },
  { label: "About Us", href: "/about", key: "about" },
];

const toolItems = [
  {
    label: "Skor CV ATS",
    description: "Struktur, readability, keyword, dan ATS readiness.",
    href: "/career-tools/ats-score",
    icon: FileText,
  },
  {
    label: "CV vs Lowongan",
    description: "Match CV dengan job target atau deskripsi manual.",
    href: "/career-tools/job-match",
    icon: BriefcaseBusiness,
  },
];

export function PublicChrome({
  children,
  active = "jobs",
  contentClassName,
}: {
  children: ReactNode;
  active?: string;
  contentClassName?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  return (
    <main
      key={routeKey}
      className="public-shell min-h-screen bg-[linear-gradient(180deg,#f7f8ff_0%,#f8f9ff_58%,#edf1fb_100%)] text-[#141b2d] transition-colors duration-300"
    >
      <PublicHeader active={active} />
      <div
        className={cn(
          "mx-auto w-full max-w-[1380px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 xl:px-10",
          contentClassName,
        )}
      >
        {children}
      </div>
      <PublicFooter />
    </main>
  );
}

function PublicHeader({ active }: { active: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#fbfcff]/96 shadow-[0_18px_44px_-26px_rgba(15,23,42,0.34)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1380px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between xl:px-10">
        <div className="flex items-center justify-between gap-4 lg:hidden">
          <Link href="/" className="text-2xl font-black tracking-tight text-[#141b2d]">
            BrieflyCH
          </Link>
          <ThemeToggle />
        </div>

        <div className="hidden items-center gap-6 lg:flex">
          <Link href="/" className="text-2xl font-black tracking-tight text-[#141b2d]">
            BrieflyCH
          </Link>
          <PublicNav active={active} />
        </div>

        <div className="lg:hidden">
          <PublicNav active={active} />
        </div>

        <ThemeToggle className="hidden lg:inline-flex" />
      </div>
    </header>
  );
}

function PublicNav({ active }: { active: string }) {
  return (
    <nav className="flex flex-wrap items-center gap-4 text-sm text-[#5c6478] sm:gap-5">
      {navigationItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "border-b-2 border-transparent pb-1 font-medium transition-colors hover:text-[#4b41e7] dark:text-slate-300 dark:hover:text-indigo-200",
            active === item.key && "border-[#4b41e7] text-[#4b41e7] dark:border-indigo-300 dark:text-indigo-200",
          )}
        >
          {item.label}
        </Link>
      ))}
      <div className="group relative">
        <Link
          href="/career-tools/ats-score"
          className={cn(
            "inline-flex items-center gap-1 border-b-2 border-transparent pb-1 font-medium transition-colors hover:text-[#4b41e7] dark:text-slate-300 dark:hover:text-indigo-200",
            active === "tools" && "border-[#4b41e7] text-[#4b41e7] dark:border-indigo-300 dark:text-indigo-200",
          )}
        >
          Tools
          <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" />
        </Link>
        <div className="invisible absolute left-0 top-full z-50 mt-3 w-[min(90vw,560px)] translate-y-1 rounded-2xl border border-[#dfe5f2] bg-white/98 p-3 opacity-0 shadow-[0_26px_70px_-42px_rgba(17,24,39,0.46)] backdrop-blur-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 dark:border-slate-700/70 dark:bg-slate-900/96">
          <div className="grid gap-2 sm:grid-cols-2">
            {toolItems.map((tool) => {
              const Icon = tool.icon;

              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="rounded-xl p-3 transition-colors hover:bg-[#f4f6ff] dark:hover:bg-slate-800/86"
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-[#141b2d]">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#eef2ff] text-[#4b41e7] dark:bg-indigo-500/16 dark:text-indigo-200">
                      <Icon className="size-4" />
                    </span>
                    {tool.label}
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-[#7a8096]">{tool.description}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-white/60 bg-[#e9eefb]">
      <div className="mx-auto flex max-w-[1380px] flex-col gap-6 px-4 py-7 sm:px-6 md:flex-row md:items-center md:justify-between xl:px-10">
        <div>
          <p className="text-xl font-black tracking-[0.04em] text-[#141b2d]">BRIEFLYCH</p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#8c90a5]">
            &copy; 2026 BrieflyCH. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
