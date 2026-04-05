import Link from "next/link";
import { notFound } from "next/navigation";

import { RecipientPullControls } from "@/components/site/recipient-pull-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatCountdown, formatTokenAmount } from "@/lib/i18n/format";
import { getGhostTabService } from "@/lib/services/ghost-tab";

type AppRecipientPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function AppRecipientPage({ params }: AppRecipientPageProps) {
  const { locale, id } = await params;
  const safeLocale: AppLocale = isLocale(locale) ? locale : "en";
  const dictionary = await getDictionary(safeLocale);
  const app = dictionary.app;
  const ghostTabService = getGhostTabService();
  const session = ghostTabService.getSessionByRecipientId(id);

  if (!session) {
    notFound();
  }

  const nowMs = Date.now();
  const nextRefillMs = session.refillSchedule.nextRefillAt
    ? session.refillSchedule.nextRefillAt.getTime() - nowMs
    : 0;
  const timeLeftMs = session.sessionExpiry.expiresAt.getTime() - nowMs;
  const mode = session.runtime?.mode ?? "demo";
  const expectedRecipientWallet = session.runtime?.recipientWallet?.trim() || null;
  const canPull =
    mode !== "demo" &&
    session.activeAllowance.availableNowUsdc > 0 &&
    session.sessionExpiry.status !== "expired";
  const disabledHint =
    mode === "demo"
      ? app.recipient.modeBadges.demo
      : session.sessionExpiry.status === "expired"
        ? app.statuses.expired
        : app.recipient.locked;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ui-label">{app.recipient.session}</p>
          <h1 className="display-copy mt-1 break-words text-3xl text-foreground md:text-4xl">
            {session.recipientLabel}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={canPull ? "cyan" : "default"}>
            {canPull ? app.recipient.ready : app.recipient.locked}
          </Badge>
          <Badge variant={mode === "live" ? "cyan" : mode === "live-beta" ? "purple" : "default"}>
            {mode === "live"
              ? app.recipient.modeBadges.live
              : mode === "live-beta"
                ? app.recipient.modeBadges.liveBeta
                : app.recipient.modeBadges.demo}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="surface-panel p-5 md:p-6">
          <p className="ui-label">{app.recipient.availableNow}</p>
          <p className="mt-2 text-3xl text-ghost-cyan">
            {formatTokenAmount(session.activeAllowance.availableNowUsdc, safeLocale)}
          </p>
        </div>
        <div className="surface-panel p-5 md:p-6">
          <p className="ui-label">{app.recipient.nextRefill}</p>
          <p className="mt-2 font-mono text-xl text-foreground">{formatCountdown(nextRefillMs)}</p>
        </div>
        <div className="surface-panel p-5 md:p-6">
          <p className="ui-label">{app.recipient.timeLeft}</p>
          <p className="mt-2 font-mono text-xl text-foreground">{formatCountdown(timeLeftMs)}</p>
        </div>
      </div>

      <div className="surface-panel px-5 py-3 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="ui-label">{app.create.fields.recipient}</p>
          <Badge variant={expectedRecipientWallet ? "cyan" : "default"}>
            {expectedRecipientWallet
              ? app.recipient.modeBadges.live
              : app.recipient.modeBadges.liveBeta}
          </Badge>
        </div>
        <p className="mt-2 font-mono text-xs text-foreground">
          {expectedRecipientWallet ?? session.recipientLabel}
        </p>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <RecipientPullControls
          sessionId={session.id}
          recipientId={session.recipientId}
          expectedRecipientWallet={expectedRecipientWallet}
          disabledHint={disabledHint}
          canPull={canPull}
          mode={mode}
          pullLabel={app.recipient.pullNow}
          labels={{
            connectWallet: app.recipient.connectWallet,
            walletRequired: app.recipient.walletRequired,
            pulling: app.recipient.pulling,
            pullFailed: app.recipient.pullFailed,
            pullSuccessLive: app.recipient.pullSuccessLive,
            pullSuccessBeta: app.recipient.pullSuccessBeta,
            modeBadges: app.recipient.modeBadges,
          }}
        />
        <Button asChild size="lg" variant="secondary" className="sm:flex-1">
          <Link href={`/${safeLocale}/app/tab/${session.id}`}>{app.recipient.openTab}</Link>
        </Button>
      </div>
    </section>
  );
}
