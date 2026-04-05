"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useSolanaWallet } from "@/components/site/solana-wallet-provider";
import { WalletConnectButton } from "@/components/site/wallet-connect-button";
import type { GhostTabSessionMode } from "@/lib/domain/ghost-tab";

type PullControlLabels = {
  connectWallet: string;
  walletRequired: string;
  pulling: string;
  pullFailed: string;
  pullSuccessLive: string;
  pullSuccessBeta: string;
  modeBadges: {
    demo: string;
    liveBeta: string;
    live: string;
  };
};

type RecipientPullControlsProps = {
  sessionId: string;
  recipientId: string;
  expectedRecipientWallet?: string | null;
  disabledHint?: string;
  canPull: boolean;
  mode: GhostTabSessionMode;
  pullLabel: string;
  labels: PullControlLabels;
};

type PullApiError = {
  ok: false;
  message?: string;
  result?: {
    reason?: string;
  };
};

type PullApiSuccess = {
  ok: true;
  result: {
    accepted: boolean;
    reason?: string;
    liveTransferExecuted: boolean;
    signature?: string;
  };
};

function shortKey(value: string) {
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function RecipientPullControls({
  sessionId,
  recipientId,
  expectedRecipientWallet,
  disabledHint,
  canPull,
  mode,
  pullLabel,
  labels,
}: RecipientPullControlsProps) {
  const router = useRouter();
  const { publicKey: wallet } = useSolanaWallet();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const expectedWallet = expectedRecipientWallet?.trim() || null;
  const walletMatchesRecipient =
    !expectedWallet ||
    !wallet ||
    wallet.toLowerCase() === expectedWallet.toLowerCase();
  const walletConnected = Boolean(wallet);
  const canExecutePull = canPull && walletConnected && walletMatchesRecipient;

  async function pullNow() {
    if (!wallet) {
      setStatus(labels.walletRequired);
      return;
    }
    if (expectedWallet && wallet.toLowerCase() !== expectedWallet.toLowerCase()) {
      setStatus(`${labels.walletRequired}: ${shortKey(expectedWallet)}`);
      return;
    }

    setPending(true);
    setStatus(labels.pulling);

    try {
      const response = await fetch("/api/ghost-tab/pull", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          recipientId,
          callerWallet: wallet,
        }),
      });
      const json = (await response.json()) as PullApiError | PullApiSuccess;

      if (!response.ok || !json || !("ok" in json) || !json.ok) {
        const error = json as PullApiError;
        setStatus(error.result?.reason ?? error.message ?? labels.pullFailed);
        return;
      }

      const success = json as PullApiSuccess;
      setStatus(
        success.result.liveTransferExecuted
          ? success.result.signature
            ? `${labels.pullSuccessLive}: ${shortKey(success.result.signature)}`
            : labels.pullSuccessLive
          : labels.pullSuccessBeta,
      );
      router.refresh();
    } catch {
      setStatus(labels.pullFailed);
    } finally {
      setPending(false);
    }
  }

  const modeLabel =
    mode === "live"
      ? labels.modeBadges.live
      : mode === "live-beta"
        ? labels.modeBadges.liveBeta
        : labels.modeBadges.demo;

  return (
    <div className="space-y-2.5 sm:flex-1">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md border border-border/[0.12] bg-surface-2/[0.62] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-secondary">
          {modeLabel}
        </span>
        <WalletConnectButton className="inline-flex h-8 items-center justify-center rounded-md border border-border/[0.14] bg-surface-2/[0.62] px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground transition-colors hover:border-border-strong" />
      </div>
      <button
        type="button"
        onClick={pullNow}
        disabled={!canExecutePull || pending}
        className="inline-flex h-11 w-full items-center justify-center rounded-md border border-ghost-cyan/[0.3] bg-ghost-cyan-dim px-3 text-sm text-foreground transition-colors hover:border-ghost-cyan/[0.45] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {pending ? labels.pulling : pullLabel}
      </button>
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
        {status ??
          (!canPull
            ? (disabledHint ?? labels.pullFailed)
            : expectedWallet
              ? `${labels.walletRequired}: ${shortKey(expectedWallet)}`
              : labels.walletRequired)}
      </p>
    </div>
  );
}
