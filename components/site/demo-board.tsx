import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AppLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  formatCountdown,
  formatDateTime,
  formatTokenAmount,
  formatUsd,
} from "@/lib/i18n/format";
import type { SessionSnapshot } from "@/lib/mock/session";

type DemoBoardProps = {
  locale: AppLocale;
  dictionary: Dictionary;
  snapshot: SessionSnapshot;
};

function stripHeadingDot(value: string) {
  return value.replace(/[.。]\s*$/, "");
}

export function DemoBoard({ locale, dictionary, snapshot }: DemoBoardProps) {
  const board = dictionary.demo.board;
  const remainingUsdc = snapshot.reserveUsdc + snapshot.activeAllowanceUsdc;
  const burnDown = Math.min((snapshot.pulledUsdc / snapshot.budgetUsd) * 100, 100);
  const timeToRefill = Math.max(snapshot.nextCrankAt.getTime() - Date.now(), 0);

  const metrics = [
    {
      label: board.reserve,
      value: formatTokenAmount(snapshot.reserveUsdc, locale),
      hint: board.reserveHint,
    },
    {
      label: board.active,
      value: formatTokenAmount(snapshot.activeAllowanceUsdc, locale),
      hint: board.activeHint,
    },
    {
      label: board.refillSize,
      value: formatTokenAmount(snapshot.refillUsdc, locale),
      hint: `${board.nextRefill}: ${formatCountdown(timeToRefill)}`,
    },
    {
      label: board.totalPulled,
      value: formatTokenAmount(snapshot.pulledUsdc, locale),
      hint: `${dictionary.common.labels.budget}: ${formatUsd(snapshot.budgetUsd, locale)}`,
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-3 py-8 sm:px-4 md:px-6 md:py-16">
      <div className="surface-panel p-6 md:p-8">
        <div className="flex flex-col gap-6 border-b border-border/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">{dictionary.demo.eyebrow}</p>
            <h1 className="display-copy mt-4 text-3xl leading-[0.95] text-foreground sm:text-4xl md:text-6xl">
              {stripHeadingDot(dictionary.demo.title)}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-secondary md:text-base">
              {dictionary.demo.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="cyan">{board.statusLive}</Badge>
            <Badge variant="purple">{board.statusPrivate}</Badge>
            <Button asChild variant="secondary">
              <Link href={`/${locale}`}>{board.ctaHome}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="bg-surface-2/[0.42]">
              <CardHeader className="pb-3">
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-2xl tracking-[-0.02em]">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-secondary">{metric.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardDescription>{board.progress}</CardDescription>
                <CardTitle>{board.remaining}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="relative h-3 overflow-hidden rounded-full bg-surface-2/[0.78]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-smoke/[0.52] to-ghost-cyan/[0.58]"
                    style={{ width: `${100 - burnDown}%` }}
                  />
                </div>
                <div className="grid gap-4 text-sm text-secondary md:grid-cols-2">
                  <div>
                    <p className="ui-label">{dictionary.common.labels.sender}</p>
                    <p className="mt-2 text-foreground">{board.participants.sender}</p>
                  </div>
                  <div>
                    <p className="ui-label">{dictionary.common.labels.recipient}</p>
                    <p className="mt-2 text-foreground">{board.participants.recipient}</p>
                  </div>
                  <div>
                    <p className="ui-label">{board.nextRefill}</p>
                    <p className="mt-2 text-foreground">{formatDateTime(snapshot.nextCrankAt, locale)}</p>
                  </div>
                  <div>
                    <p className="ui-label">{board.expires}</p>
                    <p className="mt-2 text-foreground">{formatDateTime(snapshot.expiresAt, locale)}</p>
                  </div>
                </div>
                <p className="text-sm text-secondary">
                  {formatTokenAmount(remainingUsdc, locale)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>{board.logTitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {snapshot.eventLog.map((event) => (
                    <li
                      key={event.id}
                      className="grid gap-2 border-b border-border/[0.08] pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[96px_1fr_auto] sm:gap-4"
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                        {formatDateTime(event.at, locale)}
                      </p>
                      <div>
                        <p className="text-sm text-foreground">{board.eventTypes[event.type]}</p>
                        <p className="mt-1 text-sm text-secondary">{board.eventNotes[event.type]}</p>
                      </div>
                      <p className="text-sm text-ghost-cyan">
                        {event.amount ? formatTokenAmount(event.amount, locale) : "-"}
                      </p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardDescription>{board.lifecycleTitle}</CardDescription>
                <CardTitle>{board.lifecycleBody}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {board.lifecycleItems.map((item, index) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 rounded-xl border border-border/10 bg-surface-2/[0.62] px-4 py-3"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-ghost-cyan/[0.24] bg-ghost-cyan/[0.12] font-mono text-[10px] uppercase tracking-[0.12em] text-ghost-cyan">
                        {index + 1}
                      </span>
                      <span className="text-sm text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>{board.noteTitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {board.noteItems.map((item) => (
                    <li key={item} className="text-sm leading-7 text-secondary">
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardDescription>{board.withdrawalTitle}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {snapshot.withdrawals.map((withdrawal, index) => (
                <div
                  key={withdrawal.id}
                  className="rounded-xl border border-border/10 bg-surface-2/[0.62] p-5"
                >
                  <p className="ui-label">{board.withdrawalLabels[index]}</p>
                  <p className="mt-3 text-xl tracking-[-0.02em] text-foreground">
                    {formatTokenAmount(withdrawal.amount, locale)}
                  </p>
                  <p className="mt-2 text-sm text-secondary">
                    {formatDateTime(withdrawal.at, locale)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
