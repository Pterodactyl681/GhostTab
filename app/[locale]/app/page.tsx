import { SessionsInboxOutbox } from "@/components/site/sessions-inbox-outbox";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

type AppOverviewPageProps = { params: Promise<{ locale: string }> };

export default async function AppOverviewPage({ params }: AppOverviewPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const dictionary = await getDictionary(safeLocale);

  return (
    <SessionsInboxOutbox
      locale={safeLocale}
      labels={dictionary.app.overview}
      statuses={dictionary.app.statuses}
      modeBadges={dictionary.app.tab.modeBadges}
      actorLabels={{
        sender: dictionary.common.labels.sender,
        recipient: dictionary.common.labels.recipient,
      }}
    />
  );
}
