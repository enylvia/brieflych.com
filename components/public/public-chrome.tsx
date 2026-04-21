"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Browse Jobs", href: "/jobs", key: "jobs" },
  { label: "Categories", href: "/#categories", key: "categories" },
  { label: "About Us", href: "/about", key: "about" },
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
      className="min-h-screen bg-[linear-gradient(180deg,#f7f8ff_0%,#f8f9ff_58%,#edf1fb_100%)] text-[#141b2d]"
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
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/" className="text-2xl font-black tracking-tight text-[#141b2d]">
            BrieflyCH
          </Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm text-[#5c6478]">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "border-b-2 border-transparent pb-1 font-medium transition-colors hover:text-[#4b41e7]",
                  active === item.key && "border-[#4b41e7] text-[#4b41e7]",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
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
