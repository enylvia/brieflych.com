"use client";

export type AnalyticsEventName =
  | "page_view"
  | "job_view"
  | "search_performed"
  | "filter_used"
  | "apply_clicked"
  | "category_clicked"
  | "newsletter_interest"
  | "career_tool_opened"
  | "career_tool_submitted"
  | "career_tool_completed"
  | "career_tool_failed";

export type TrackEventPayload = {
  event_name: AnalyticsEventName;
  path?: string;
  job_id?: string;
  metadata?: Record<string, unknown>;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const VISITOR_ID_KEY = "visitor_id";
const SESSION_ID_KEY = "session_id";

function getStoredId(storage: Storage, key: string) {
  let id = storage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    storage.setItem(key, id);
  }

  return id;
}

function getVisitorId() {
  return getStoredId(localStorage, VISITOR_ID_KEY);
}

function getSessionId() {
  return getStoredId(sessionStorage, SESSION_ID_KEY);
}

export async function trackEvent(payload: TrackEventPayload) {
  try {
    await fetch(`${API_BASE_URL}/analytics/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_name: payload.event_name,
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
        path: payload.path ?? window.location.pathname,
        job_id: payload.job_id,
        metadata: payload.metadata ?? {},
      }),
      keepalive: true,
    });
  } catch (error) {
    console.warn("Failed to track analytics event", error);
  }
}
