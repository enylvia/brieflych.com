import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AdminPageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1 text-[2rem] font-bold tracking-tight text-[#0b1c30]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function AdminSurface({
  title,
  subtitle,
  action,
  className,
  contentClassName,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "admin-surface rounded-2xl border-0 bg-white/96 ring-1 ring-[#dce9ff] dark:bg-slate-900/88 dark:ring-slate-700/70",
        className,
      )}
    >
      <CardContent className={cn("p-6", contentClassName)}>
        {title || action ? (
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              {title ? (
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">{title}</h3>
              ) : null}
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            {action}
          </div>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
  icon,
  children,
}: {
  label: string;
  value: ReactNode;
  detail: ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning";
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "admin-surface admin-card-hover rounded-2xl border-0 bg-white/96 ring-1 ring-[#dce9ff]",
        tone === "primary" && "bg-gradient-to-br from-white to-[#eef2ff]",
        tone === "success" && "bg-gradient-to-br from-white to-[#edfdf4]",
        tone === "warning" && "bg-gradient-to-br from-white to-[#fff3eb]",
        "dark:bg-slate-900/88 dark:from-slate-900/95 dark:to-slate-800/82 dark:ring-slate-700/70",
        tone === "primary" && "dark:to-indigo-950/50",
        tone === "success" && "dark:to-emerald-950/36",
        tone === "warning" && "dark:to-amber-950/34",
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
          {icon}
        </div>
        <div className="mt-5">
          <div className="text-4xl font-bold tracking-tight text-[#0b1c30]">{value}</div>
          <p className="mt-2 text-sm text-slate-500">{detail}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function StatusBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "neutral" | "primary" | "success" | "warning" | "danger";
}) {
  return (
    <Badge
      className={cn(
        "rounded-md border px-2 py-0.5 text-xs font-medium shadow-none",
        tone === "neutral" && "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-100",
        tone === "primary" && "border-[#c3c0ff] bg-[#e2dfff] text-[#3525cd] hover:bg-[#e2dfff]",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
        tone === "warning" && "border-[#ffd9bf] bg-[#fff1e6] text-[#a44100] hover:bg-[#fff1e6]",
        tone === "danger" && "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50",
      )}
    >
      {children}
    </Badge>
  );
}

export function AdminNotice({
  notice,
  noticeType = "success",
}: {
  notice?: string;
  noticeType?: "success" | "error";
}) {
  if (!notice) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-6 rounded-2xl border px-4 py-3 text-sm shadow-[0_16px_30px_-24px_rgba(11,28,48,0.22)]",
        noticeType === "success" && "border-emerald-200 bg-emerald-50/90 text-emerald-700",
        noticeType === "error" && "border-rose-200 bg-rose-50/90 text-rose-700",
      )}
    >
      {notice}
    </div>
  );
}

export function AdminInlineNotice({
  message,
  tone = "warning",
}: {
  message?: string;
  tone?: "info" | "warning" | "error";
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-6 rounded-2xl border px-4 py-3 text-sm shadow-[0_16px_30px_-24px_rgba(11,28,48,0.22)]",
        tone === "info" && "border-sky-200 bg-sky-50/90 text-sky-700",
        tone === "warning" && "border-amber-200 bg-amber-50/90 text-amber-800",
        tone === "error" && "border-rose-200 bg-rose-50/90 text-rose-700",
      )}
    >
      {message}
    </div>
  );
}
