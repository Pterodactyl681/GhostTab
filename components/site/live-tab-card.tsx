"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { GhostTabEventType } from "@/lib/domain/ghost-tab";
import type { AppLocale } from "@/lib/i18n/config";
import { formatTokenAmount } from "@/lib/i18n/format";
import { getGhostTabService } from "@/lib/services/ghost-tab";

type LiveTabCardProps = {
  locale: AppLocale;
  className?: string;
  labels: {
    timeLeft: string;
    nextRefill: string;
    availableNow: string;
    hiddenReserve: string;
    pullNow: string;
    openTab: string;
    eventTape: string;
    reserveMask: string;
    demoMode?: string;
    resetDemo?: string;
    fastForward?: string;
    noRefill?: string;
    tapeTypes: Record<GhostTabEventType, string>;
  };
  actions: {
    openHref: string;
  };
};

const FAST_FORWARD_MS = 30_000;

function formatRemaining(ms: number) {
  const safe = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatTraceStamp(ms: number) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `T+${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function LiveTabCard({ locale, className, labels, actions }: LiveTabCardProps) {
  const ghostTabService = useMemo(() => getGhostTabService(), []);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [startedAtMs, setStartedAtMs] = useState(() => Date.now());
  const [fastForwardMs, setFastForwardMs] = useState(0);
  const [manualPullAtMs, setManualPullAtMs] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const elapsedMs = Math.max(nowMs - startedAtMs + fastForwardMs, 0);

  const session = useMemo(
    () =>
      ghostTabService.getDemoPlayback({
        elapsedMs,
        manualPullAtMs,
      }),
    [elapsedMs, ghostTabService, manualPullAtMs],
  );

  const timeLeft = formatRemaining(session.timeLeftMs);
  const nextRefill =
    session.nextRefillInMs === null
      ? (labels.noRefill ?? "--")
      : formatRemaining(session.nextRefillInMs);
  const latestEventId = session.eventTape.at(-1)?.id;

  function resetDemo() {
    setStartedAtMs(Date.now());
    setNowMs(Date.now());
    setFastForwardMs(0);
    setManualPullAtMs(null);
  }

  function fastForward() {
    setFastForwardMs((value) => value + FAST_FORWARD_MS);
  }

  function pullNow() {
    if (!session.canRecipientPull) return;
    setManualPullAtMs(elapsedMs);
  }

  return (
    <section
      className={[
        "mx-auto w-full max-w-3xl rounded-2xl border border-border/10 bg-surface/[0.92] p-5 shadow-panel md:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-md border border-border/[0.12] bg-surface-2/[0.58] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-secondary">
          {labels.demoMode ?? "DEMO MODE"}
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={fastForward}>
            {labels.fastForward ?? "+30s"}
          </Button>
          <Button size="sm" variant="ghost" onClick={resetDemo}>
            {labels.resetDemo ?? "Reset"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl border border-border/[0.12] bg-background-elevated/[0.66] px-4 py-3.5 md:px-4.5 md:py-4">
          <p className="ui-label">{labels.availableNow}</p>
          <p className="mt-2 text-3xl font-medium tracking-[-0.03em] text-ghost-cyan md:text-[2.1rem]">
            {formatTokenAmount(session.availableNowUsdc, locale)}
          </p>
        </div>
        <div className="rounded-xl border border-border/[0.12] bg-surface-2/[0.64] px-4 py-3.5 md:px-4.5 md:py-4">
          <p className="ui-label">{labels.nextRefill}</p>
          <div className="mt-2 flex items-center gap-2.5">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ghost-cyan/[0.38] [animation-duration:2.2s]" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ghost-cyan/[0.92]" />
            </span>
            <p className="font-mono text-xl tracking-[-0.02em] text-foreground">{nextRefill}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/[0.1] bg-surface-2/[0.5] px-4 py-3">
          <p className="ui-label">{labels.timeLeft}</p>
          <p className="mt-1.5 font-mono text-lg tracking-[-0.01em] text-foreground">{timeLeft}</p>
        </div>
        <div className="rounded-lg border border-border/[0.1] bg-surface-2/[0.5] px-4 py-3">
          <p className="ui-label">{labels.hiddenReserve}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                session.isClawedBack ? "bg-muted/80" : "bg-violet-smoke"
              }`}
            />
            <p className="font-mono text-lg tracking-[0.18em] text-foreground/92">
              {labels.reserveMask}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <Button
          size="default"
          className="h-11"
          onClick={pullNow}
          disabled={!session.canRecipientPull}
        >
          {labels.pullNow}
        </Button>
        <Button asChild size="default" variant="secondary" className="h-11">
          <Link href={actions.openHref}>{labels.openTab}</Link>
        </Button>
      </div>

      <div className="mt-4 border-t border-border/10 pt-3">
        <p className="ui-label">{labels.eventTape}</p>
        <ol className="mt-2 space-y-1">
          {session.eventTape.map((event) => (
            <li
              key={event.id}
              className={`grid grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-md border px-2.5 py-2 ${
                event.id === latestEventId
                  ? "border-border/[0.18] bg-surface-2/[0.58]"
                  : "border-border/[0.1] bg-surface-2/[0.42]"
              }`}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                {formatTraceStamp(event.atMs)}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-secondary">
                {labels.tapeTypes[event.type] ?? event.type.toUpperCase()}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                {event.amountUsdc ? event.amountUsdc.toFixed(2) : "--"}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
