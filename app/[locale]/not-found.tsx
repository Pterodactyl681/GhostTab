import Link from "next/link";
import { cookies, headers } from "next/headers";

import { Button } from "@/components/ui/button";
import {
  defaultLocale,
  getLocaleFromAcceptLanguage,
  isLocale,
  localeOverrideCookieName,
  type AppLocale,
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

function stripHeadingDot(value: string) {
  return value.replace(/[.。]\s*$/, "");
}

export default async function LocaleNotFound() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = cookieStore.get(localeOverrideCookieName)?.value;
  const acceptedLocale = getLocaleFromAcceptLanguage(
    headerStore.get("accept-language"),
  );
  const cookieResolvedLocale: AppLocale = isLocale(cookieLocale ?? "")
    ? (cookieLocale as AppLocale)
    : acceptedLocale ?? defaultLocale;
  const dictionary = await getDictionary(cookieResolvedLocale);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-6 py-20">
      <div className="surface-panel w-full p-8 md:p-12">
        <p className="eyebrow">{dictionary.notFound.eyebrow}</p>
        <h1 className="mt-4 display-copy text-4xl text-foreground md:text-5xl">
          {stripHeadingDot(dictionary.notFound.title)}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-secondary">
          {dictionary.notFound.description}
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link href={`/${cookieResolvedLocale}`}>{dictionary.notFound.cta}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
