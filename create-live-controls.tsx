"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useSolanaWallet } from "@/components/site/solana-wallet-provider";
import { WalletConnectButton } from "@/components/site/wallet-connect-button";
import type {
  GhostTabCreateStep,
  GhostTabCreateStepId,
} from "@/lib/domain/ghost-tab";
import type { AppLocale } from "@/lib/i18n/config";
import { getGhostTabEnvConfig } from "@/lib/config/ghost-tab-env";

type CreateLiveControlsProps = {
  locale: AppLocale;
  formId: string;
  submitLabel: string;
};

type CreateApiError = {
  ok: false;
  message?: string;
  failedStep?: GhostTabCreateStepId;
  steps?: GhostTabCreateStep[];
};

type CreateApiSuccess = {
  ok: true;
  result: {
    sessionId: string;
    steps: GhostTabCreateStep[];
  };
};

function stepTone(status: GhostTabCreateStep["status"]) {
  if (status === "completed") return "text-success-soft";
  if (status === "running") return "text-ghost-cyan";
  if (status === "failed") return "text-rose-300";
  if (status === "skipped") return "text-muted";
  return "text-secondary";
}

function parseNumber(value: FormDataEntryValue | null, fallback: number) {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function validateCreatePayload(payload: {
  recipient: string;
  mint: string;
  reserveUsdc: number;
  refillAmountUsdc: number;
  refillIntervalMinutes: number;
  sessionDurationMinutes: number;
  maxPullUsdc: number;
}) {
  if (!payload.recipient.trim()) return "Recipient is required.";
  if (!payload.mint.trim()) return "Mint is required.";
  if (payload.reserveUsdc <= 0) return "Reserve must be greater than zero.";
  if (payload.refillAmountUsdc <= 0) return "Refill amount must be greater than zero.";
  if (payload.refillIntervalMinutes <= 0) return "Refill interval must be greater than zero.";
  if (payload.sessionDurationMinutes <= 0) return "Session duration must be greater than zero.";
  if (payload.maxPullUsdc <= 0) return "Max pull must be greater than zero.";
  return null;
}

export function CreateLiveControls({ locale, formId, submitLabel }: CreateLiveControlsProps) {
  const router = useRouter();
  const env = useMemo(() => getGhostTabEnvConfig(), []);
  const {
    publicKey: wallet,
    connectedWalletName,
    error: walletError,
    disconnectWallet,
  } = useSolanaWallet();
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [steps, setSteps] = useState<GhostTabCreateStep[]>([]);

  async function createLiveSession() {
    if (!wallet) {
      setStatus("Connect wallet to create.");
      return;
    }

    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) {
      setStatus("Create form is unavailable.");
      return;
    }

    const formData = new FormData(form);
    const payload = {
      senderWallet: wallet,
      tabName: String(formData.get("tabName") ?? "").trim(),
      recipient: String(formData.get("recipient") ?? "").trim(),
      mint: String(formData.get("mint") ?? "").trim(),
      reserveUsdc: parseNumber(formData.get("reserveUsdc"), 0),
      refillAmountUsdc: parseNumber(formData.get("refillAmountUsdc"), 0),
      refillIntervalMinutes: parseNumber(formData.get("refillIntervalMinutes"), 0),
      sessionDurationMinutes: parseNumber(formData.get("sessionDurationMinutes"), 0),
      maxPullUsdc: parseNumber(formData.get("maxPullUsdc"), 0),
    };

    const payloadError = validateCreatePayload(payload);
    if (payloadError) {
      setStatus(payloadError);
      setSteps([]);
      return;
    }

    setPending(true);
    setStatus("Running live-beta create flow...");
    setSteps([
      { id: "checkMint", status: "running", message: "Checking mint..." },
      { id: "initializeMint", status: "pending", message: "Pending" },
      { id: "depositReserve", status: "pending", message: "Pending" },
      { id: "createSessionRecord", status: "pending", message: "Pending" },
    ]);

    try {
      const response = await fetch("/api/ghost-tab/create", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as CreateApiError | CreateApiSuccess;

      if (!response.ok || !json || !("ok" in json) || !json.ok) {
        const error = json as CreateApiError;
        if (error.steps && error.steps.length > 0) {
          setSteps(error.steps);
        }
        setStatus(error.message ?? "Live create failed.");
        return;
      }

      setSteps(json.result.steps);
      setStatus(`Session created: ${json.result.sessionId}`);
      router.push(`/${locale}/app/tab/${json.result.sessionId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Live create failed.";
      setStatus(message);
    } finally {
      setPending(false);
    }
  }

  const walletConnected = Boolean(wallet);
  const envReady = env.liveEnvReady;
  const liveModeAvailable = env.effectiveMode === "live";
  const canSubmit = walletConnected && liveModeAvailable && envReady;
  useEffect(() => {
    if (wallet && connectedWalletName) {
      setStatus(`Wallet connected: ${connectedWalletName}`);
      return;
    }
    if (walletError) {
      setStatus(walletError);
      return;
    }
    setStatus(null);
  }, [wallet, connectedWalletName, walletError]);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex flex-wrap items-center gap-2">
          <WalletConnectButton className="inline-flex h-11 min-w-[11rem] flex-1 items-center justify-center rounded-md border border-border/[0.14] bg-surface-2/[0.62] px-4 text-sm text-foreground transition-colors hover:border-border-strong sm:flex-none" />
          {wallet ? (
            <button
              type="button"
              onClick={() => void disconnectWallet()}
              className="inline-flex h-11 min-w-[8rem] flex-1 items-center justify-center rounded-md border border-border/[0.14] bg-surface-2/[0.62] px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-secondary transition-colors hover:border-border-strong hover:text-foreground sm:flex-none"
            >
              Disconnect
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={createLiveSession}
          disabled={!canSubmit || pending}
          className="inline-flex h-10 items-center justify-center rounded-md border border-ghost-cyan/[0.3] bg-ghost-cyan-dim px-3 text-sm text-foreground transition-colors hover:border-ghost-cyan/[0.45] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {pending ? "Creating..." : submitLabel}
        </button>
      </div>

      {steps.length > 0 ? (
        <ol className="space-y-1 font-mono text-[10px] uppercase tracking-[0.12em]">
          {steps.map((step) => (
            <li key={step.id} className={stepTone(step.status)}>
              {step.id}: {step.status}
            </li>
          ))}
        </ol>
      ) : null}

      {status ? (
        <p className="break-words font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          {status}
        </p>
      ) : null}
    </div>
  );
}
