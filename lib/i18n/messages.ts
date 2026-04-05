import type { AppLocale } from "@/lib/i18n/config";
import en from "@/messages/en";
import ru from "@/messages/ru";

export type AppMessages = typeof en;

export const messagesByLocale: Record<AppLocale, AppMessages> = {
  en,
  ru,
};

