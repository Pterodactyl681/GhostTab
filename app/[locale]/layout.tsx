import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Footer } from "@/components/site/footer";
import { defaultLocale, isLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const dictionary = await getDictionary(safeLocale);

  return {
    title: dictionary.seo.title,
    description: dictionary.seo.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:border-ghost-cyan/25 focus:bg-surface-2/90 focus:px-3 focus:py-2 focus:text-ghost-cyan"
      >
        {dictionary.common.skipToContent}
      </a>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ghost-cyan/[0.03] to-transparent" />
      {children}
      <Footer dictionary={dictionary.common.footer} productName={dictionary.common.productName} />
    </div>
  );
}
