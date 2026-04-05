import { defaultLocale, type AppLocale } from "@/lib/i18n/config";
import en from "@/messages/en";
import ru from "@/messages/ru";

export type Dictionary = typeof en;

const dictionaries: Record<AppLocale, Dictionary> = {
  en,
  ru,
};

export async function getDictionary(locale: AppLocale): Promise<Dictionary> {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
