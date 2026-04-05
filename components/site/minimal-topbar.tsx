import Link from "next/link";

import { GhostBrand } from "@/components/site/ghost-brand";
import { LocaleMenu } from "@/components/site/locale-menu";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/lib/i18n/config";

type MinimalTopbarProps = {
  locale: AppLocale;
  pathname: string;
  dictionary: {
    productName: string;
    languageLabel: string;
    localeNames: Record<AppLocale, string>;
  };
  ctaLabel: string;
  ctaHref: string;
};

export function MinimalTopbar({
  locale,
  pathname,
  dictionary,
  ctaLabel,
  ctaHref,
}: MinimalTopbarProps) {
  return (
    <header className="w-full px-3 pt-3 sm:px-4 sm:pt-4 md:px-8 md:pt-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-xl border border-border/10 bg-background-elevated/[0.48] px-3 py-2.5 sm:px-3.5 md:px-4.5 md:py-3">
        <GhostBrand locale={locale} label={dictionary.productName} />
        <div className="flex items-center gap-2.5">
          <LocaleMenu
            locale={locale}
            pathname={pathname}
            languageLabel={dictionary.languageLabel}
            localeNames={dictionary.localeNames}
          />
          <Button asChild size="sm" className="px-3.5">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
