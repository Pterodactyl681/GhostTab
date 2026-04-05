import { NextRequest, NextResponse } from "next/server";

import {
  defaultLocale,
  getLocaleFromAcceptLanguage,
  getLocaleFromCountry,
  isLocale,
  localeOverrideCookieName,
  type AppLocale,
} from "@/lib/i18n/config";

function getEdgeCountry(request: NextRequest): string | null {
  const geoCountry = (
    request as NextRequest & { geo?: { country?: string } }
  ).geo?.country;
  const headerCountry =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-country-code") ??
    request.headers.get("cloudfront-viewer-country");

  const country = (geoCountry ?? headerCountry)?.toUpperCase() ?? null;
  if (!country || country === "XX" || country === "ZZ" || country === "T1") {
    return null;
  }

  return country;
}

function resolveLocale(request: NextRequest): AppLocale {
  const manualOverride = request.cookies.get(localeOverrideCookieName)?.value;
  if (manualOverride && isLocale(manualOverride)) {
    return manualOverride;
  }

  const geoLocale = getLocaleFromCountry(getEdgeCountry(request));
  if (geoLocale) {
    return geoLocale;
  }

  const acceptedLocale = getLocaleFromAcceptLanguage(
    request.headers.get("accept-language"),
  );
  if (acceptedLocale) {
    return acceptedLocale;
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const pathLocale = pathname.split("/")[1];

  if (isLocale(pathLocale)) {
    return NextResponse.next();
  }

  const locale = resolveLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
