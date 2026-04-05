import { getRequestConfig } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";

import { messagesByLocale } from "@/lib/i18n/messages";
import { routing } from "@/i18n/routing";

function normalizeMessages(input: unknown): AbstractIntlMessages {
  if (Array.isArray(input)) {
    return input.reduce<AbstractIntlMessages>((acc, item, index) => {
      acc[String(index)] =
        typeof item === "string" ? item : normalizeMessages(item);
      return acc;
    }, {});
  }

  if (input && typeof input === "object") {
    const entries = Object.entries(input as Record<string, unknown>).map(
      ([key, value]) => [
        key,
        typeof value === "string" ? value : normalizeMessages(value),
      ] as const,
    );

    return Object.fromEntries(entries);
  }

  return {};
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = routing.locales.includes(
    requestedLocale as (typeof routing.locales)[number],
  )
    ? (requestedLocale as (typeof routing.locales)[number])
    : routing.defaultLocale;

  return {
    locale,
    messages: normalizeMessages(messagesByLocale[locale]),
  };
});
