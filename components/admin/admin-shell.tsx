"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  BriefcaseBusiness,
  Database,
  FileText,
  FolderGit2,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

import { logoutAdminAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Dashboard", href: "/admin", icon: FolderGit2 },
  { label: "Jobs", href: "/admin/jobs", icon: BriefcaseBusiness },
  { label: "Sources", href: "/admin/sources", icon: Database },
  { label: "Pipeline", href: "/admin/pipeline", icon: Sparkles },
  { label: "About", href: "/admin/settings", icon: FileText },
];

const titleMap = [
  { match: (pathname: string) => pathname === "/admin", title: "Dashboard Overview" },
  { match: (pathname: string) => pathname === "/admin/jobs", title: "Jobs Pipeline" },
  { match: (pathname: string) => pathname.startsWith("/admin/jobs/"), title: "Job Review" },
  { match: (pathname: string) => pathname === "/admin/sources", title: "Scraping Sources" },
  { match: (pathname: string) => pathname === "/admin/pipeline", title: "Pipeline Status" },
  { match: (pathname: string) => pathname === "/admin/settings", title: "About Page Content" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = titleMap.find((item) => item.match(pathname))?.title ?? "BrieflyCH";

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <aside className="hidden h-screen w-64 flex-col border-r border-white/60 bg-[#eff4ff] px-4 py-4 shadow-[inset_-1px_0_0_rgba(255,255,255,0.35)] md:fixed md:left-0 md:top-0 md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-[#3525cd] text-sm font-bold text-white shadow-[0_10px_24px_-14px_rgba(53,37,205,0.75)]">
            BC
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-[#4f46e5]">BrieflyCH</p>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Operational
            </p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1">
          {navigationItems.map((item, index) => {
            return (
              <AdminNavLink
                key={item.label}
                item={item}
                pathname={pathname}
                style={{ animationDuration: `${220 + index * 70}ms` }}
              />
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="space-y-1 border-t border-slate-200/80 pt-4">
            <FooterAction icon={LogOut} label="Logout" />
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Close admin menu overlay"
            className="absolute inset-0 bg-slate-950/38 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(20rem,86vw)] flex-col border-r border-white/70 bg-[#eff4ff] px-4 py-4 shadow-[24px_0_60px_-34px_rgba(15,23,42,0.72)]">
            <div className="mb-8 flex items-start justify-between gap-3 px-2">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-[#3525cd] text-sm font-bold text-white shadow-[0_10px_24px_-14px_rgba(53,37,205,0.75)]">
                  BC
                </div>
                <div>
                  <p className="text-lg font-black tracking-tight text-[#4f46e5]">BrieflyCH</p>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Operational
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close admin menu"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl bg-white/80 p-2 text-slate-500 shadow-[0_12px_24px_-20px_rgba(11,28,48,0.38)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {navigationItems.map((item, index) => (
                <AdminNavLink
                  key={item.label}
                  item={item}
                  pathname={pathname}
                  onClick={() => setMobileOpen(false)}
                  style={{ animationDuration: `${220 + index * 70}ms` }}
                />
              ))}
            </nav>

            <div className="mt-auto space-y-1 border-t border-slate-200/80 pt-4">
              <FooterAction icon={LogOut} label="Logout" />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="md:ml-64">
        <header className="sticky top-0 z-40 border-b border-white/70 bg-[#f8f9ff]/90 px-4 py-3 shadow-[0_14px_32px_-28px_rgba(15,23,42,0.32)] backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open admin menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(true)}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-[0_12px_24px_-20px_rgba(11,28,48,0.36)] md:hidden"
              >
                <Menu className="size-5" />
              </button>
              <h1 className="truncate text-xl font-black tracking-tight text-slate-900">{pageTitle}</h1>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">{children}</section>
      </div>
    </main>
  );
}

function AdminNavLink({
  item,
  pathname,
  onClick,
  style,
}: {
  item: (typeof navigationItems)[number];
  pathname: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const Icon = item.icon;
  const active =
    item.href === "/admin"
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex scale-[0.985] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold tracking-tight transition-all duration-300 hover:scale-100",
        active
          ? "bg-white text-[#4f46e5] shadow-[0_10px_24px_-18px_rgba(11,28,48,0.45)]"
          : "text-slate-500 hover:bg-indigo-50/70 hover:text-[#4f46e5]",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2",
      )}
      style={style}
    >
      <Icon className="size-4" />
      {item.label}
    </Link>
  );
}

function FooterAction({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <form action={logoutAdminAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors duration-300 hover:bg-white/60 hover:text-[#4f46e5]"
      >
        <Icon className="size-4" />
        {label}
      </button>
    </form>
  );
}
