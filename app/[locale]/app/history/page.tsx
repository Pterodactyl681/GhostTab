import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatDateTime, formatTokenAmount } from "@/lib/i18n/format";
import { getGhostTabService } from "@/lib/services/ghost-tab";

type AppHistoryPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AppHistoryPage({ params }: AppHistoryPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const dictionary = await getDictionary(safeLocale);
  const app = dictionary.app;
  const ghostTabService = getGhostTabService();
  const { historySessions } = ghostTabService.listSessions(Date.now());

  return (
    <section className="space-y-4">
      <h1 className="display-copy text-3xl text-foreground md:text-4xl">{app.history.title}</h1>

      <div className="space-y-3">
        {historySessions.map((session) => (
          <div key={session.id} className="surface-panel p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                  {session.id}
                </p>
                <p className="mt-1 truncate text-sm text-foreground">{session.recipientLabel}</p>
              </div>
              <Badge variant="default">{app.statuses[session.sessionExpiry.status]}</Badge>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-border/[0.12] bg-surface-2/[0.56] px-3 py-2.5">
                <p className="ui-label">{app.history.reserveUsed}</p>
                <p className="mt-1 text-sm text-foreground">
                  {formatTokenAmount(session.reserve.usedUsdc, safeLocale)}
                </p>
              </div>
              <div className="rounded-md border border-border/[0.12] bg-surface-2/[0.56] px-3 py-2.5">
                <p className="ui-label">{app.history.refillCount}</p>
                <p className="mt-1 font-mono text-sm text-foreground">
                  {session.refillSchedule.refillCount}
                </p>
              </div>
              <div className="rounded-md border border-border/[0.12] bg-surface-2/[0.56] px-3 py-2.5">
                <p className="ui-label">{app.history.clawbackResult}</p>
                <p className="mt-1 text-sm text-foreground">
                  {formatTokenAmount(session.clawback.amountUsdc, safeLocale)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                {app.history.endedAt}: {formatDateTime(session.sessionExpiry.expiresAt, safeLocale)}
              </p>
              <Button asChild size="sm" variant="secondary">
                <Link href={`/${safeLocale}/app/tab/${session.id}`}>{app.history.openTab}</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
