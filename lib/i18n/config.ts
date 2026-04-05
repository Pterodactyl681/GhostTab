export const locales = ["en", "ru"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";
export const localeOverrideCookieName = "ghosttab-locale-override";

export function isLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale);
}

const geoRuCountries = new Set<string>([
  "RU",
  "BY",
  "KZ",
  "KG",
  "UZ",
  "TJ",
  "TM",
  "AM",
  "AZ",
  "MD",
]);

export function getLocaleFromCountry(country: string | null | undefined): AppLocale | null {
  if (!country) return null;
  return geoRuCountries.has(country.toUpperCase()) ? "ru" : "en";
}

export function getLocaleFromAcceptLanguage(
  value: string | null | undefined,
): AppLocale | null {
  if (!value) return null;

  const ranked = value
    .split(",")
    .map((item, index) => {
      const [rawTag, ...params] = item.trim().split(";");
      const tag = rawTag?.trim().toLowerCase();

      if (!tag) {
        return null;
      }

      const qParam = params.find((param) => param.trim().startsWith("q="));
      const qValue = qParam ? Number.parseFloat(qParam.split("=")[1] ?? "1") : 1;
      const weight = Number.isFinite(qValue) ? qValue : 1;

      if (weight <= 0) {
        return null;
      }

      let locale: AppLocale | null = null;

      if (tag === "*" || tag.startsWith("en")) {
        locale = "en";
      } else if (tag.startsWith("ru")) {
        locale = "ru";
      }

      if (!locale) {
        return null;
      }

      return { locale, weight, index };
    })
    .filter((item): item is { locale: AppLocale; weight: number; index: number } => !!item)
    .sort((a, b) => {
      if (b.weight !== a.weight) {
        return b.weight - a.weight;
      }

      return a.index - b.index;
    });

  return ranked[0]?.locale ?? null;
}

export function getIntlLocale(locale: AppLocale) {
  return locale === "ru" ? "ru-RU" : "en-US";
}
