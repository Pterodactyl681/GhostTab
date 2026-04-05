import Link from "next/link";

import { GhostBrand } from "@/components/site/ghost-brand";
import { LocaleMenu } from "@/components/site/locale-menu";
import { Button } from "@/components/ui/button";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

function stripHeadingDot(value: string) {
  return value.replace(/[.гЂ‚]\s*$/, "");
}

export default async function LocaleHomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const dictionary = await getDictionary(safeLocale);
  const landing = dictionary.landing;
  const createHref = `/${safeLocale}/app/create`;
  const shellMax = "max-w-[72rem]";

  return (
    <>
      <header className="w-full px-3 pt-3 sm:px-4 sm:pt-4 md:px-6 md:pt-7">
        <div
          className={`mx-auto flex w-full ${shellMax} items-center justify-between rounded-xl border border-border/10 bg-background-elevated/[0.48] px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5`}
        >
          <GhostBrand locale={safeLocale} label={dictionary.common.productName} />
          <div className="flex items-center">
            <LocaleMenu
              locale={safeLocale}
              pathname=""
              languageLabel={dictionary.common.languageLabel}
              localeNames={dictionary.common.localeNames}
            />
          </div>
        </div>
      </header>

      <main
        id="content"
        className={`mx-auto flex w-full ${shellMax} flex-1 flex-col px-3 pb-6 pt-4 sm:px-4 sm:pt-5 md:px-6 md:pt-6`}
      >
        <section className="mx-auto flex w-full flex-1 items-center justify-center py-4 sm:py-8 md:py-10">
          <div className="mx-auto flex w-full max-w-[58rem] flex-col items-center text-center">
            <p className="eyebrow text-[11px] tracking-[0.18em] sm:text-xs md:text-sm">
              {landing.eyebrow}
            </p>
            <h1 className="display-copy mt-3 text-[clamp(2.3rem,8.2vw,5.2rem)] font-medium leading-[0.96] tracking-[-0.03em] text-foreground">
              {stripHeadingDot(landing.headline)}
            </h1>
            <p className="mt-3 text-[11px] uppercase tracking-[0.08em] text-secondary sm:text-xs md:mt-4 md:text-base">
              {landing.subheadline}
            </p>

            <div className="mt-5 flex w-full max-w-[16rem] items-stretch justify-center sm:mt-6">
              <Button asChild size="lg" variant="secondary" className="h-11 w-full px-5 text-base sm:h-12 sm:px-6 sm:text-lg">
                <Link href={createHref}>{landing.createTab}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
