import { NextRequest, NextResponse } from "next/server";

import {
  isLocale,
  localeOverrideCookieName,
  locales,
  type AppLocale,
} from "@/lib/i18n/config";

function sanitizeRedirectPath(path: string | null): string {
  if (!path || !path.startsWith("/")) {
    return "/";
  }

  // Prevent open redirects and protocol-relative redirects.
  if (path.startsWith("//")) {
    return "/";
  }

  return path;
}

function ensureLocalePrefix(path: string, locale: AppLocale): string {
  const hasLocalePrefix = locales.some(
    (item) => path === `/${item}` || path.startsWith(`/${item}/`),
  );

  if (hasLocalePrefix) {
    return path.replace(/^\/(en|ru)(?=\/|$)/, `/${locale}`);
  }

  return `/${locale}${path === "/" ? "" : path}`;
}

export function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get("locale");
  const redirectToParam = request.nextUrl.searchParams.get("redirectTo");

  if (!localeParam || !isLocale(localeParam)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const cleanPath = sanitizeRedirectPath(redirectToParam);
  const targetPath = ensureLocalePrefix(cleanPath, localeParam);
  const response = NextResponse.redirect(new URL(targetPath, request.url));

  response.cookies.set(localeOverrideCookieName, localeParam, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

