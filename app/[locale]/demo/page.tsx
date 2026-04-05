import { DemoBoard } from "@/components/site/demo-board";
import { MinimalTopbar } from "@/components/site/minimal-topbar";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getSessionSnapshot } from "@/lib/mock/session";

type DemoPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DemoPage({ params }: DemoPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const dictionary = await getDictionary(safeLocale);
  const snapshot = getSessionSnapshot();
  const landing = dictionary.landing;

  return (
    <>
      <MinimalTopbar
        locale={safeLocale}
        pathname="/demo"
        dictionary={dictionary.common}
        ctaLabel={landing.createTab}
        ctaHref={`/${safeLocale}/create`}
      />
      <main id="content" className="pb-20">
        <DemoBoard locale={safeLocale} dictionary={dictionary} snapshot={snapshot} />
      </main>
    </>
  );
}
