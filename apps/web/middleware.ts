import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, locales } from "./i18n";

const handleI18nRouting = createMiddleware({
  locales: [...locales],
  defaultLocale,
  // cookie NEXT_LOCALE → Accept-Language → defaultLocale
  localeDetection: true,
  localeCookie: true,
});

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // a) Locale resolution FIRST (cookie → Accept-Language → "ar").
  //    Unprefixed/invalid paths come back as a redirect — return as-is.
  //
  //    IMPORTANT: for paths that already carry a valid locale, this response
  //    is NOT a plain next() — it carries the X-NEXT-INTL-LOCALE request-header
  //    override (read by getRequestConfig's `requestLocale`), the NEXT_LOCALE
  //    sync cookie and Link: rel=alternate headers. Every proceed path below
  //    MUST return this exact response, never a bare NextResponse.next().
  const i18nResponse = handleI18nRouting(request);
  if (i18nResponse.headers.get("location")) return i18nResponse;

  // Path now carries a valid locale prefix (or intl chose to pass through).
  const [, locale = defaultLocale, ...rest] = pathname.split("/");
  const hasRefreshToken = request.cookies.has("mgs_admin_rt");
  const isAdminArea = rest[0] === "admin";

  // Customer area (B2C auth) — presence-only check at the edge; real JWT/
  // session validation happens server-side in the API.
  const isAccountArea = rest[0] === "account";
  const isCustomerLogin = rest[0] === "login" && rest.length === 1;
  const isCustomerRegister = rest[0] === "register" && rest.length === 1;

  if (isAccountArea) {
    if (!hasRefreshToken) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return i18nResponse;
  }

  // Logged-in customers skip login/register pages — EXCEPT the Google OAuth
  // success landing (?google=success), which must reach the login page so its
  // handler can run initAuth() and honor the stored `next` destination.
  const isGoogleSuccess = request.nextUrl.searchParams.get("google") === "success";
  if ((isCustomerLogin || isCustomerRegister) && hasRefreshToken && !isGoogleSuccess) {
    return NextResponse.redirect(new URL(`/${locale}/account`, request.url));
  }

  if (!isAdminArea) return i18nResponse;

  // Admin auth routes (login) must never be protected — they are the
  // destination for unauthenticated users, so redirecting them would loop.
  // rest = ["admin", "login"] for /<locale>/admin/login
  const isAdminAuthRoute = rest[0] === "admin" && rest[1] === "login";

  // b) /<locale>/admin/* (except auth routes) requires the auth cookie.
  if (!isAdminAuthRoute) {
    if (!hasRefreshToken) {
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      // Never set `next` to a login/auth URL — that would cause an infinite
      // redirect loop (login → login → …). Fall back to the admin dashboard.
      let next = pathname;
      if (
        next === "/admin/login" ||
        next.startsWith(`/${locale}/admin/login`)
      ) {
        next = `/${locale}/admin`;
      }
      loginUrl.searchParams.set("next", next);
      return NextResponse.redirect(loginUrl);
    }
    return i18nResponse;
  }

  // d) Logged-in users skip the login page.
  if (hasRefreshToken) {
    const nextParam = request.nextUrl.searchParams.get("next");
    const fallback = `/${locale}/admin`;
    const target =
      nextParam &&
      nextParam.startsWith("/") &&
      !nextParam.startsWith("//") &&
      nextParam !== "/admin/login" &&
      !nextParam.startsWith(`/${locale}/admin/login`)
        ? nextParam
        : fallback;
    return NextResponse.redirect(new URL(target, request.url));
  }

  // c) /<locale>/admin/login without auth → proceed.
  return i18nResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
