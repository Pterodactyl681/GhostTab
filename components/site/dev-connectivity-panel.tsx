"use client";

import { useEffect, useMemo, useState } from "react";

import { useSolanaWallet } from "@/components/site/solana-wallet-provider";
import { WalletConnectButton } from "@/components/site/wallet-connect-button";
import { getGhostTabEnvConfig } from "@/lib/config/ghost-tab-env";
import type { GhostTabLiveReadiness } from "@/lib/domain/ghost-tab";
import { getGhostTabService } from "@/lib/services/ghost-tab";

function tone(value: GhostTabLiveReadiness[keyof GhostTabLiveReadiness]) {
  if (value === "online") return "text-success-soft";
  if (value === "beta") return "text-warning-soft";
  if (value === "offline") return "text-rose-300";
  return "text-muted";
}

function statusTone(ok: boolean) {
  return ok ? "text-success-soft" : "text-rose-300";
}

export function DevConnectivityPanel() {
  const service = useMemo(() => getGhostTabService(), []);
  const env = useMemo(() => getGhostTabEnvConfig(), []);
  const { publicKey: wallet, error: walletError } = useSolanaWallet();
  const [readiness, setReadiness] = useState<GhostTabLiveReadiness | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const walletConnected = Boolean(wallet);
  const envReady = env.liveEnvReady;
  const routerEnvReady = env.routerEnvReady;
  const privatePaymentsEnvReady = env.privatePaymentsEnvReady;
  const liveModeActive = env.effectiveMode === "live";
  const liveCreateReady = Boolean(readiness?.canCreateSession);
  const createBlockers = [
    ...env.blockingLiveReasons,
    ...(!walletConnected ? ["Wallet not connected."] : []),
    ...(liveModeActive && !liveCreateReady && readiness?.reason ? [readiness.reason] : []),
  ];
  const pullBlockers = [
    ...env.blockingLiveReasons,
    ...(!walletConnected ? ["Wallet not connected."] : []),
    ...(!liveModeActive ? ["Live mode is not active."] : []),
  ];
  const envNote = createBlockers[0] ?? "Live create is ready.";

  useEffect(() => {
    let active = true;
    void service
      .getLiveReadiness()
      .then((value) => {
        if (active) setReadiness(value);
      })
      .catch(() => {
        if (active) setReadiness(null);
      });

    return () => {
      active = false;
    };
  }, [service]);

  useEffect(() => {
    if (walletError) {
      setNote(walletError);
    }
  }, [walletError]);

  return (
    <section className="mx-auto w-full max-w-5xl px-6 pt-3">
      <div className="rounded-lg border border-border/[0.12] bg-surface/[0.72] px-3.5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em]">
            <span className="rounded-md border border-border/[0.14] bg-surface-2/[0.62] px-2 py-1 text-secondary">
              {env.effectiveMode === "live" ? "Live beta" : "Demo fallback"}
            </span>
            <span className={`rounded-md px-1.5 ${tone(readiness?.solanaDevnet ?? "unknown")}`}>
              Devnet
            </span>
            <span className={`rounded-md px-1.5 ${tone(readiness?.magicRouter ?? "unknown")}`}>
              Router
            </span>
            <span className={`rounded-md px-1.5 ${tone(readiness?.privatePayments ?? "unknown")}`}>
              Private API
            </span>
            <span className="rounded-md px-1.5 text-muted">
              PER {env.perHook ? "set" : "pending"}
            </span>
            <span className="rounded-md px-1.5 text-muted">
              TEE {env.teeHook ? "set" : "pending"}
            </span>
          </div>

          <WalletConnectButton className="inline-flex h-8 items-center justify-center rounded-md border border-border/[0.14] bg-surface-2/[0.62] px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground transition-colors hover:border-border-strong" />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em]">
          <span className={`rounded-md px-1.5 ${statusTone(walletConnected)}`}>
            Wallet {walletConnected ? "connected" : "not connected"}
          </span>
          <span className={`rounded-md px-1.5 ${statusTone(envReady)}`}>
            Env {envReady ? "ready" : "not ready"}
          </span>
          <span className={`rounded-md px-1.5 ${statusTone(routerEnvReady)}`}>
            Router env {routerEnvReady ? "ready" : "not ready"}
          </span>
          <span className={`rounded-md px-1.5 ${statusTone(privatePaymentsEnvReady)}`}>
            Private env {privatePaymentsEnvReady ? "ready" : "not ready"}
          </span>
          <span className={`rounded-md px-1.5 ${statusTone(liveModeActive)}`}>
            Live mode {liveModeActive ? "active" : "inactive"}
          </span>
          <span className={`rounded-md px-1.5 ${statusTone(liveCreateReady)}`}>
            Live create {liveCreateReady ? "ready" : "blocked"}
          </span>
        </div>

        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          {note ?? readiness?.reason ?? envNote}
        </p>
        {(createBlockers.length > 0 || pullBlockers.length > 0) ? (
          <ul className="mt-1.5 space-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            <li>
              - create: {createBlockers[0] ?? "ready"}
            </li>
            <li>
              - pull: {pullBlockers[0] ?? "ready (requires recipient session page)"}
            </li>
          </ul>
        ) : null}
      </div>
    </section>
  );
}
