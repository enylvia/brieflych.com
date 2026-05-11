"use client";

import Link from "next/link";
import { useEffect, type MouseEvent, type ReactNode } from "react";

import { trackEvent, type TrackEventPayload } from "@/lib/analytics";

export function AnalyticsPageView({
  page,
  path,
  metadata,
}: {
  page: string;
  path?: string;
  metadata?: Record<string, unknown>;
}) {
  useEffect(() => {
    void trackEvent({
      event_name: "page_view",
      path,
      metadata: {
        page,
        ...metadata,
      },
    });
  }, [metadata, page, path]);

  return null;
}

export function AnalyticsJobView({
  jobId,
  path,
  metadata,
}: {
  jobId: string;
  path: string;
  metadata: Record<string, unknown>;
}) {
  useEffect(() => {
    void trackEvent({
      event_name: "job_view",
      path,
      job_id: jobId,
      metadata,
    });
  }, [jobId, metadata, path]);

  return null;
}

export function JobsSearchFilterTracker({
  keyword,
  filters,
}: {
  keyword?: string;
  filters: Array<{ name: string; value?: string }>;
}) {
  useEffect(() => {
    const normalizedKeyword = keyword?.trim();
    if (normalizedKeyword) {
      void trackEvent({
        event_name: "search_performed",
        path: "/jobs",
        metadata: {
          keyword: normalizedKeyword,
        },
      });
    }

    for (const filter of filters) {
      if (!filter.value) {
        continue;
      }

      void trackEvent({
        event_name: "filter_used",
        path: "/jobs",
        metadata: {
          filter_name: filter.name,
          filter_value: filter.value,
        },
      });
    }
  }, [filters, keyword]);

  return null;
}

export function AnalyticsLink({
  href,
  event,
  className,
  children,
}: {
  href: string;
  event: TrackEventPayload;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        void trackEvent(event);
      }}
    >
      {children}
    </Link>
  );
}

export function AnalyticsButton({
  event,
  className,
  children,
}: {
  event: TrackEventPayload;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void trackEvent(event);
      }}
    >
      {children}
    </button>
  );
}

export function ApplyLinkButton({
  href,
  event,
  className,
  children,
}: {
  href: string;
  event: TrackEventPayload;
  className?: string;
  children: ReactNode;
}) {
  function handleClick(eventObject: MouseEvent<HTMLAnchorElement>) {
    eventObject.preventDefault();

    void trackEvent(event);
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
