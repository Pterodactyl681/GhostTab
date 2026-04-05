import { CreateTabComposer } from "@/components/site/create-tab-composer";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

type AppCreatePageProps = {
  params: Promise<{ locale: string }>;
};

const defaults = {
  tabName: "",
  recipient: "9xQeWvG816bUx9EPf9Y8fX6f6S8Aec4x2D3fN6xA7JQg",
  mint: "USDC_DEVNET",
  reserveUsdc: 64,
  refillAmountUsdc: 6.25,
  refillIntervalMinutes: 5,
  sessionDurationMinutes: 90,
  maxPullUsdc: 8,
};

export default async function AppCreatePage({ params }: AppCreatePageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const dictionary = await getDictionary(safeLocale);
  const app = dictionary.app;

  return (
    <section className="space-y-4">
      <h1 className="display-copy text-3xl text-foreground md:text-4xl">{app.create.title}</h1>
      <CreateTabComposer locale={safeLocale} defaults={defaults} labels={app.create} />
    </section>
  );
}
