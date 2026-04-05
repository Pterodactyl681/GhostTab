import Link from "next/link";
import { notFound } from "next/navigation";

import { SessionLiveRefresh } from "@/components/site/session-live-refresh";
import { SessionOwnershipView } from "@/components/site/session-ownership-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GhostTabSessionMode, GhostTabSessionSignals, GhostTabSessionStatus } from "@/lib/domain/ghost-tab";
import { isLocale, type AppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatCountdown, formatDateTime, formatTokenAmount, maskAmount } from "@/lib/i18n/format";
import { getGhostTabService } from "@/lib/services/ghost-tab";

type AppTabPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

function getStatusVariant(status: GhostTabSessionStatus) {
  if (status === "live") return "cyan";
  if (status === "expiring") return "purple";
  return "default";
}

function getModeVariant(mode: GhostTabSessionMode) {
  if (mode === "live") return "cyan";
  if (mode === "live-beta") return "purple";
  return "default";
}

function getPrivateBalanceDisplay(
  signals: GhostTabSessionSignals,
  locale: AppLocale,
  fallback: string,
) {
  if (signals.privateBalance.amountUsdc === null) {
    return fallback;
  }
  return formatTokenAmount(signals.privateBalance.amountUsdc, locale);
}

export default async function AppTabPage({ params }: AppTabPageProps) {
  const { locale, id } = await params;
  const safeLocale: AppLocale = isLocale(locale) ? locale : "en";
  const dictionary = await getDictionary(safeLocale);
  const app = dictionary.app;
  const ghostTabService = getGhostTabService();
  const session = await ghostTabService.getSessionById(id);

  if (!session) {
    notFound();
  }

  const sessionSignals = await ghostTabService.getSessionSignals(session);

  const nowMs = Date.now();
  const nextRefillMs = session.refillSchedule.nextRefillAt
    ? session.refillSchedule.nextRefillAt.getTime() - nowMs
    : 0;
  const timeLeftMs = session.sessionExpiry.expiresAt.getTime() - nowMs;
  const privateBalance = getPrivateBalanceDisplay(
    sessionSignals,
    safeLocale,
    app.tab.privateBalanceStates[sessionSignals.privateBalance.status],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ui-label">{app.tab.session}</p>
          <h1 className="display-copy mt-1 break-words text-3xl text-foreground md:text-4xl">
            {session.title?.trim() || session.id}
          </h1>
          <p className="ui-label mt-1 break-all">
            {app.tab.sessionId}: {session.id}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getStatusVariant(session.sessionExpiry.status)}>
            {app.statuses[session.sessionExpiry.status]}
          </Badge>
          <Badge variant={getModeVariant(sessionSignals.mode)}>
            {app.tab.modeBadges[sessionSignals.mode]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="surface-panel p-5 md:p-6">
          <p className="ui-label">{app.tab.availableNow}</p>
          <p className="mt-2 text-3xl text-ghost-cyan">
            {formatTokenAmount(session.activeAllowance.availableNowUsdc, safeLocale)}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border/[0.12] bg-surface-2/[0.56] px-3 py-2.5">
              <p className="ui-label">{app.tab.nextRefill}</p>
              <p className="mt-1 font-mono text-sm text-foreground">{formatCountdown(nextRefillMs)}</p>
            </div>
            <div className="rounded-md border border-border/[0.12] bg-surface-2/[0.56] px-3 py-2.5">
              <p className="ui-label">{app.tab.hiddenReserve}</p>
              <p className="mt-1 font-mono text-sm tracking-[0.18em] text-foreground">
                {maskAmount(session.reserve.totalHiddenUsdc)}
              </p>
            </div>
          </div>
        </div>

        <div className="surface-panel p-5 md:p-6">
          <p className="ui-label">{app.tab.pullRules}</p>
          <div className="mt-3 space-y-3">
            <SessionOwnershipView
              ownerWallet={sessionSignals.ownerWallet}
              labels={{
                title: app.tab.ownership,
                owner: app.tab.ownershipStates.owner,
                observer: app.tab.ownershipStates.observer,
                unknown: app.tab.ownershipStates.unknown,
                connect: app.tab.connectWallet,
              }}
            />
            <div className="rounded-md border border-border/[0.12] bg-surface-2/[0.56] px-3 py-2.5">
              <p className="ui-label">{app.tab.maxPull}</p>
              <p className="mt-1 text-sm text-foreground">
                {formatTokenAmount(session.activeAllowance.maxPullUsdc, safeLocale)}
              </p>
            </div>
            <div className="rounded-md border border-border/[0.12] bg-surface-2/[0.56] px-3 py-2.5">
              <p className="ui-label">{app.tab.interval}</p>
              <p className="mt-1 font-mono text-sm text-foreground">
                {session.refillSchedule.intervalMinutes}m
              </p>
            </div>
            <div className="rounded-md border border-border/[0.12] bg-surface-2/[0.56] px-3 py-2.5">
              <p className="ui-label">{app.tab.expiry}</p>
              <p className="mt-1 font-mono text-sm text-foreground">{formatCountdown(timeLeftMs)}</p>
            </div>
            <div className="rounded-md border border-border/[0.12] bg-surface-2/[0.56] px-3 py-2.5">
              <p className="ui-label">{app.tab.clawback}</p>
              <p className="mt-1 text-sm text-foreground">
                {formatTokenAmount(session.clawback.amountUsdc, safeLocale)}
              </p>
            </div>
            <div className="rounded-md border border-border/[0.12] bg-surface-2/[0.56] px-3 py-2.5">
              <p className="ui-label">{app.tab.privateBalance}</p>
              <p className="mt-1 text-sm text-foreground">{privateBalance}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                {app.tab.privateBalanceStates[sessionSignals.privateBalance.status]}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="surface-panel p-5 md:p-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="ui-label">{app.tab.eventTape}</p>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/${safeLocale}/app/recipient/${session.recipientId}`}>
              {app.tab.recipientView}
            </Link>
          </Button>
        </div>

        <ol className="space-y-2">
          {session.eventTape.map((event) => (
            <li
              key={event.id}
              className="grid gap-2 rounded-md border border-border/[0.1] bg-surface-2/[0.46] px-3 py-2 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-3"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                {formatDateTime(event.at, safeLocale)}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-secondary">
                  {app.tapeTypes[event.type]}
                </span>
                {event.type === "pull" ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                    {event.pullSettlement === "live-transfer"
                      ? app.recipient.pullSuccessLive
                      : app.recipient.pullSuccessBeta}
                  </span>
                ) : null}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                {event.amountUsdc ? event.amountUsdc.toFixed(2) : "--"}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <SessionLiveRefresh enabled={sessionSignals.mode !== "demo"} />
    </section>
  );
}
