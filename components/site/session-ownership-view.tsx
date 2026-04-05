"use client";

import { useMemo } from "react";

import { useSolanaWallet } from "@/components/site/solana-wallet-provider";
import { WalletConnectButton } from "@/components/site/wallet-connect-button";

type SessionOwnershipViewProps = {
  ownerWallet: string | null;
  labels: {
    title: string;
    owner: string;
    observer: string;
    unknown: string;
    connect: string;
  };
};

function shortWallet(value: string) {
  if (value.length <= 10) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function SessionOwnershipView({ ownerWallet, labels }: SessionOwnershipViewProps) {
  const { publicKey: connectedWallet } = useSolanaWallet();

  const relation = useMemo(() => {
    if (!ownerWallet || !connectedWallet) {
      return labels.unknown;
    }

    if (ownerWallet.toLowerCase() === connectedWallet.toLowerCase()) {
      return labels.owner;
    }

    return labels.observer;
  }, [connectedWallet, labels.observer, labels.owner, labels.unknown, ownerWallet]);

  return (
    <div className="rounded-md border border-border/[0.12] bg-surface-2/[0.56] px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="ui-label">{labels.title}</p>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-secondary">
          {relation}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          {connectedWallet ? shortWallet(connectedWallet) : "--"}
        </p>
        <WalletConnectButton className="inline-flex h-8 items-center justify-center rounded-md border border-border/[0.14] bg-surface-2/[0.62] px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-secondary transition-colors hover:border-border-strong" />
      </div>
    </div>
  );
}
