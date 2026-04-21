"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_AUTH_COOKIE_PATH,
  ADMIN_AUTH_TOKEN_COOKIE,
  ADMIN_AUTH_USERNAME_COOKIE,
  ADMIN_DEFAULT_PATH,
  ADMIN_LOGIN_PATH,
} from "@/lib/auth-constants";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8080";

export type LoginActionState = {
  message?: string;
};

type BackendEnvelope<T> = {
  api_message?: string;
  count?: number;
  data: T;
};

type LoginResponseData = {
  token_type: string;
  token: string;
  expires_at: string;
  admin: {
    username: string;
  };
};

function readApiMessage(payload: unknown) {
  if (payload && typeof payload === "object" && "api_message" in payload) {
    const message = (payload as { api_message?: unknown }).api_message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return undefined;
}

async function mutate(path: string, init?: RequestInit) {
  const token = await getAdminToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {}

  const apiMessage = readApiMessage(payload);
  const fallbackMessage = response.ok ? "ok" : `request failed: ${response.status}`;

  if (response.status === 401) {
    await clearAdminSession();
    redirectWithNotice(ADMIN_LOGIN_PATH, apiMessage || "Session expired. Please login again.", "error");
  }

  return {
    ok: response.ok,
    message: apiMessage || fallbackMessage,
  };
}

async function getAdminToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_AUTH_TOKEN_COOKIE)?.value;
}

async function setAdminSession(data: LoginResponseData) {
  const cookieStore = await cookies();
  const expires = new Date(data.expires_at);
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: ADMIN_AUTH_COOKIE_PATH,
    ...(Number.isNaN(expires.getTime()) ? {} : { expires }),
  };

  cookieStore.set(ADMIN_AUTH_TOKEN_COOKIE, data.token, cookieOptions);
  cookieStore.set(ADMIN_AUTH_USERNAME_COOKIE, data.admin.username, cookieOptions);
}

async function clearAdminSession() {
  const cookieStore = await cookies();
  const expiredCookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: ADMIN_AUTH_COOKIE_PATH,
    expires: new Date(0),
  };

  cookieStore.set(ADMIN_AUTH_TOKEN_COOKIE, "", expiredCookieOptions);
  cookieStore.set(ADMIN_AUTH_USERNAME_COOKIE, "", expiredCookieOptions);
}

function revalidateAdminViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/jobs");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/sources");
  revalidatePath("/admin/settings");
  revalidatePath("/about");
}

function redirectWithNotice(path: string, notice: string, noticeType: "success" | "error") {
  const target = new URL(`http://local${path.startsWith("/") ? path : `/${path}`}`);
  target.searchParams.set("notice", notice);
  target.searchParams.set("noticeType", noticeType);
  redirect(`${target.pathname}?${target.searchParams.toString()}`);
}

export async function loginAdminAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const nextPath = String(formData.get("next") || ADMIN_DEFAULT_PATH);

  if (!username || !password) {
    return {
      message: "Username and password are required.",
    };
  }

  const response = await fetch(`${API_BASE_URL}/internal/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  });

  let payload: BackendEnvelope<LoginResponseData> | null = null;
  try {
    payload = await response.json();
  } catch {}

  if (!response.ok || !payload?.data?.token) {
    return {
      message: readApiMessage(payload) || `Login failed: ${response.status}`,
    };
  }

  await setAdminSession(payload.data);
  revalidatePath("/admin");
  redirect(nextPath.startsWith("/admin") && nextPath !== ADMIN_LOGIN_PATH ? nextPath : ADMIN_DEFAULT_PATH);
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect(`${ADMIN_LOGIN_PATH}?reason=logged_out`);
}

export async function runPipelineAction(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") || "/admin/pipeline");
  const result = await mutate("/internal/worker/run", { method: "POST" });
  revalidateAdminViews();
  redirectWithNotice(
    redirectTo,
    result.ok ? "Pipeline trigger sent successfully." : result.message,
    result.ok ? "success" : "error",
  );
}

export async function updateJobStatusAction(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") || "/admin/jobs");
  const jobId = String(formData.get("jobId") || "");
  const statusAction = String(formData.get("statusAction") || "");

  const pathMap: Record<string, string> = {
    approve: `/internal/jobs/${jobId}/approve`,
    reject: `/internal/jobs/${jobId}/reject`,
    archive: `/internal/jobs/${jobId}/archive`,
  };

  if (!pathMap[statusAction]) {
    redirectWithNotice(redirectTo, "Unsupported job action.", "error");
  }

  const result = await mutate(pathMap[statusAction], { method: "POST" });
  revalidateAdminViews();
  revalidatePath(`/admin/jobs/${jobId}`);
  redirectWithNotice(
    redirectTo,
    result.ok ? `Job ${statusAction} action completed.` : result.message,
    result.ok ? "success" : "error",
  );
}

export async function createAboutAction(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") || "/admin/settings");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!title || !body) {
    redirectWithNotice(redirectTo, "Title and body are required.", "error");
  }

  const result = await mutate("/internal/about", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, body }),
  });

  revalidateAdminViews();
  redirectWithNotice(
    redirectTo,
    result.ok ? "About entry created successfully." : result.message,
    result.ok ? "success" : "error",
  );
}

export async function updateAboutAction(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") || "/admin/settings");
  const aboutId = String(formData.get("aboutId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!aboutId || !title || !body) {
    redirectWithNotice(redirectTo, "About entry, title, and body are required.", "error");
  }

  const result = await mutate(`/internal/about/${aboutId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, body }),
  });

  revalidateAdminViews();
  redirectWithNotice(
    redirectTo,
    result.ok ? "About entry updated successfully." : result.message,
    result.ok ? "success" : "error",
  );
}

export async function deleteAboutAction(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") || "/admin/settings");
  const aboutId = String(formData.get("aboutId") || "").trim();

  if (!aboutId) {
    redirectWithNotice(redirectTo, "About entry is required.", "error");
  }

  const result = await mutate(`/internal/about/${aboutId}`, {
    method: "DELETE",
  });

  revalidateAdminViews();
  redirectWithNotice(
    redirectTo,
    result.ok ? "About entry deleted successfully." : result.message,
    result.ok ? "success" : "error",
  );
}
