import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  defaultLocale,
  getLocaleFromAcceptLanguage,
  getLocaleFromCountry,
  isLocale,
  localeOverrideCookieName,
} from "@/lib/i18n/config";

function getEdgeCountryHeader(headerStore: Headers): string | null {
  const country = (
    headerStore.get("x-vercel-ip-country") ??
    headerStore.get("cf-ipcountry") ??
    headerStore.get("x-country-code") ??
    headerStore.get("cloudfront-viewer-country")
  )?.toUpperCase();

  if (!country || country === "XX" || country === "ZZ" || country === "T1") {
    return null;
  }

  return country;
}

export default async function Home() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const manualLocale = cookieStore.get(localeOverrideCookieName)?.value;
  if (manualLocale && isLocale(manualLocale)) {
    redirect(`/${manualLocale}`);
  }

  const geoLocale = getLocaleFromCountry(getEdgeCountryHeader(headerStore));
  if (geoLocale) {
    redirect(`/${geoLocale}`);
  }

  const acceptedLocale = getLocaleFromAcceptLanguage(
    headerStore.get("accept-language"),
  );
  if (acceptedLocale) {
    redirect(`/${acceptedLocale}`);
  }

  redirect(`/${defaultLocale}`);
}
