import { getIntlLocale, type AppLocale } from "@/lib/i18n/config";

export function formatUsd(value: number, locale: AppLocale) {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTokenAmount(
  value: number,
  locale: AppLocale,
  token = "USDC",
) {
  return `${new Intl.NumberFormat(getIntlLocale(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} ${token}`;
}

export function formatDateTime(value: Date, locale: AppLocale) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function formatCountdown(value: number) {
  const totalSeconds = Math.max(Math.floor(value / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function maskAmount(value: number) {
  const characters = Math.max(Math.round(value / 7), 4);
  return "*".repeat(Math.min(characters, 8));
}

