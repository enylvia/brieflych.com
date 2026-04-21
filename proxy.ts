import { NextResponse, type NextRequest } from "next/server";

import {
  ADMIN_AUTH_COOKIE_PATH,
  ADMIN_AUTH_TOKEN_COOKIE,
  ADMIN_AUTH_USERNAME_COOKIE,
  ADMIN_DEFAULT_PATH,
  ADMIN_LOGIN_PATH,
} from "@/lib/auth-constants";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8080";

function redirectToLogin(request: NextRequest, reason?: string) {
  const url = request.nextUrl.clone();
  url.pathname = ADMIN_LOGIN_PATH;
  url.search = "";

  if (request.nextUrl.pathname !== ADMIN_LOGIN_PATH) {
    url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  }
  if (reason) {
    url.searchParams.set("reason", reason);
  }

  const response = NextResponse.redirect(url);
  expireAdminCookies(response);
  return response;
}

function expireAdminCookies(response: NextResponse) {
  const options = {
    path: ADMIN_AUTH_COOKIE_PATH,
    expires: new Date(0),
  };

  response.cookies.set(ADMIN_AUTH_TOKEN_COOKIE, "", options);
  response.cookies.set(ADMIN_AUTH_USERNAME_COOKIE, "", options);
}

async function tokenIsValid(token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/internal/auth/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ADMIN_AUTH_TOKEN_COOKIE)?.value;

  if (pathname === ADMIN_LOGIN_PATH) {
    if (request.nextUrl.searchParams.get("reason") === "expired") {
      const response = NextResponse.next();
      expireAdminCookies(response);
      return response;
    }

    if (!token) {
      return NextResponse.next();
    }

    const valid = await tokenIsValid(token);
    if (!valid) {
      return redirectToLogin(request, "expired");
    }

    return NextResponse.redirect(new URL(ADMIN_DEFAULT_PATH, request.url));
  }

  if (!token) {
    return redirectToLogin(request);
  }

  const valid = await tokenIsValid(token);
  if (!valid) {
    return redirectToLogin(request, "expired");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
