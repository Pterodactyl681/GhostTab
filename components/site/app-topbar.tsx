"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { GhostBrand } from "@/components/site/ghost-brand";
import { LocaleMenu } from "@/components/site/locale-menu";
import type { AppLocale } from "@/lib/i18n/config";

type AppTopbarProps = {
  locale: AppLocale;
  dictionary: {
    productName: string;
    languageLabel: string;
    localeNames: Record<AppLocale, string>;
  };
  nav: {
    app: string;
    create: string;
    history: string;
  };
};

type NavItem = {
  href: string;
  label: string;
  isActive(pathname: string): boolean;
};

export function AppTopbar({ locale, dictionary, nav }: AppTopbarProps) {
  const pathname = usePathname() ?? `/${locale}/app`;
  const localPathname = pathname.replace(new RegExp(`^/${locale}`), "") || "/app";

  const navItems: NavItem[] = [
    {
      href: `/${locale}/app`,
      label: nav.app,
      isActive: (pathname) => pathname === "/app",
    },
    {
      href: `/${locale}/app/create`,
      label: nav.create,
      isActive: (pathname) => pathname === "/app/create" || pathname.startsWith("/app/create/"),
    },
    {
      href: `/${locale}/app/history`,
      label: nav.history,
      isActive: (pathname) => pathname === "/app/history" || pathname.startsWith("/app/history/"),
    },
  ];

  return (
    <header className="w-full px-3 pt-3 sm:px-4 sm:pt-4 md:px-6 md:pt-8">
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between rounded-xl border border-border/10 bg-background-elevated/[0.48] px-3 py-2.5 sm:px-3.5 md:px-4.5 md:py-3">
        <div className="flex items-center">
          <GhostBrand locale={locale} label={dictionary.productName} />
        </div>

        <nav className="absolute left-1/2 hidden w-[23.5rem] -translate-x-1/2 grid-cols-3 gap-1.5 md:grid">
          {navItems.map((item) => {
            const active = item.isActive(localPathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full rounded-lg px-2.5 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.12em] transition-all duration-150 ${
                  active
                    ? "border border-border/[0.16] bg-surface-2/[0.62] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                    : "border border-border/[0.1] bg-surface/[0.26] text-secondary hover:border-border/[0.16] hover:bg-surface-2/[0.38] hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center">
          <LocaleMenu
            locale={locale}
            pathname={localPathname}
            languageLabel={dictionary.languageLabel}
            localeNames={dictionary.localeNames}
          />
        </div>
      </div>
      <nav className="mx-auto mt-2 grid w-full max-w-6xl grid-cols-3 gap-1.5 md:hidden">
        {navItems.map((item) => {
          const active = item.isActive(localPathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full rounded-lg px-2 py-2 text-center font-mono text-[10px] uppercase tracking-[0.12em] transition-all duration-150 ${
                active
                  ? "border border-border/[0.16] bg-surface-2/[0.62] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                  : "border border-border/[0.1] bg-surface/[0.26] text-secondary hover:border-border/[0.16] hover:bg-surface-2/[0.38] hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
