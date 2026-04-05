import Link from "next/link";

import type { AppLocale } from "@/lib/i18n/config";

type LocaleMenuProps = {
  locale: AppLocale;
  pathname: string;
  languageLabel: string;
  localeNames: Record<AppLocale, string>;
};

function localeOverrideHref(locale: AppLocale, pathname: string) {
  const redirectTo = `/${locale}${pathname}`;
  const params = new URLSearchParams({
    locale,
    redirectTo,
  });
  return `/api/locale?${params.toString()}`;
}

export function LocaleMenu({
  locale,
  pathname,
  languageLabel,
  localeNames,
}: LocaleMenuProps) {
  return (
    <details className="relative">
      <summary
        className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-md border border-border/[0.1] bg-transparent text-muted transition-colors hover:text-secondary"
        aria-label={languageLabel}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[13px] w-[13px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
        </svg>
      </summary>
      <div className="absolute right-0 z-30 mt-2 min-w-24 rounded-md border border-border/[0.12] bg-background-elevated/[0.98] p-1 shadow-panel">
        {(["en", "ru"] as const).map((item) => (
          <Link
            key={item}
            href={localeOverrideHref(item, pathname)}
            className={`block rounded-sm px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
              item === locale
                ? "text-ghost-cyan"
                : "text-secondary hover:bg-surface-2/[0.8] hover:text-foreground"
            }`}
          >
            {localeNames[item]}
          </Link>
        ))}
      </div>
    </details>
  );
}
