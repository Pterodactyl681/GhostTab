"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useSolanaWallet } from "@/components/site/solana-wallet-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GhostTabSessionStatus } from "@/lib/domain/ghost-tab";

type SessionRuntime = {
  senderWallet?: string;
  recipientWallet?: string;
};

type SessionRow = {
  id: string;
  title?: string;
  recipientLabel: string;
  activeAllowance: {
    availableNowUsdc: number;
  };
  refillSchedule: {
    nextRefillAt: string | null;
  };
  sessionExpiry: {
    status: GhostTabSessionStatus;
  };
  runtime?: SessionRuntime;
};

type SessionsApiResponse = {
  ok: boolean;
  result?: {
    activeSessions: SessionRow[];
  };
};

type OverviewLabels = {
  title: string;
  inbox: string;
  outbox: string;
  all: string;
  walletHint: string;
  empty: string;
  recipient: string;
  status: string;
  nextRefill: string;
  availableNow: string;
  openTab: string;
};

type StatusLabels = {
  live: string;
  expiring: string;
  expired: string;
};

type SessionsInboxOutboxProps = {
  locale: string;
  labels: OverviewLabels;
  statuses: StatusLabels;
};

type FilterMode = "all" | "inbox" | "outbox";

function getStatusVariant(status: GhostTabSessionStatus) {
  if (status === "live") return "cyan";
  if (status === "expiring") return "purple";
  return "default";
}

function formatCountdown(value: number) {
  const totalSeconds = Math.max(Math.floor(value / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function toIntlLocale(locale: string) {
  return locale === "ru" ? "ru-RU" : "en-US";
}

function formatToken(value: number, locale: string) {
  return `${new Intl.NumberFormat(toIntlLocale(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} USDC`;
}

function normalizeWallet(value: string | undefined | null) {
  return value?.trim().toLowerCase() ?? "";
}

export function SessionsInboxOutbox({ locale, labels, statuses }: SessionsInboxOutboxProps) {
  const { publicKey } = useSolanaWallet();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    let active = true;

    async function loadSessions() {
      try {
        const response = await fetch("/api/ghost-tab/sessions", {
          method: "GET",
          cache: "no-store",
        });
        const json = (await response.json()) as SessionsApiResponse;
        if (!active) return;
        if (response.ok && json.ok) {
          setSessions(json.result?.activeSessions ?? []);
        }
      } catch {
        if (!active) return;
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSessions();
    const timer = window.setInterval(loadSessions, 10000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const normalizedWallet = normalizeWallet(publicKey);

  const filteredSessions = useMemo(() => {
    if (filter === "all") return sessions;
    if (!normalizedWallet) return [];

    return sessions.filter((session) => {
      const sender = normalizeWallet(session.runtime?.senderWallet);
      const recipient = normalizeWallet(session.runtime?.recipientWallet);

      if (filter === "outbox") {
        return sender.length > 0 && sender === normalizedWallet;
      }

      return recipient.length > 0 && recipient === normalizedWallet;
    });
  }, [filter, normalizedWallet, sessions]);

  const tabs: Array<{ id: FilterMode; label: string }> = [
    { id: "all", label: labels.all },
    { id: "inbox", label: labels.inbox },
    { id: "outbox", label: labels.outbox },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display-copy text-3xl text-foreground md:text-4xl">{labels.title}</h1>
        <div className="flex items-center gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-md border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                filter === tab.id
                  ? "border-border/[0.16] bg-surface-2/[0.62] text-foreground"
                  : "border-border/[0.1] bg-surface/[0.26] text-secondary hover:border-border/[0.16] hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {!normalizedWallet && filter !== "all" ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          {labels.walletHint}
        </p>
      ) : null}

      <div className="surface-panel overflow-hidden">
        <div className="hidden grid-cols-[1.2fr_auto_auto_auto_auto] gap-3 border-b border-border/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-secondary md:grid md:px-6">
          <span>{labels.recipient}</span>
          <span>{labels.status}</span>
          <span>{labels.nextRefill}</span>
          <span>{labels.availableNow}</span>
          <span className="text-right">{labels.openTab}</span>
        </div>

        {!loading && filteredSessions.length === 0 ? (
          <div className="px-4 py-6 md:px-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              {labels.empty}
            </p>
          </div>
        ) : null}

        {filteredSessions.map((session) => {
          const nextRefillMs = session.refillSchedule.nextRefillAt
            ? new Date(session.refillSchedule.nextRefillAt).getTime() - Date.now()
            : 0;
          const title = session.title?.trim() || session.id;

          return (
            <div
              key={session.id}
              className="flex flex-col gap-3 border-b border-border/[0.08] px-4 py-3.5 last:border-b-0 md:grid md:grid-cols-[1.2fr_auto_auto_auto_auto] md:items-center md:px-6"
            >
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{title}</p>
                <p className="mt-1 truncate text-sm text-foreground">{session.recipientLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:contents">
                <Badge variant={getStatusVariant(session.sessionExpiry.status)}>
                  {statuses[session.sessionExpiry.status]}
                </Badge>
                <p className="font-mono text-sm text-foreground md:justify-self-start">
                  {formatCountdown(nextRefillMs)}
                </p>
                <p className="font-mono text-sm text-ghost-cyan md:justify-self-start">
                  {formatToken(session.activeAllowance.availableNowUsdc, locale)}
                </p>
              </div>
              <div className="flex justify-start md:justify-end">
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/${locale}/app/tab/${session.id}`}>{labels.openTab}</Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
