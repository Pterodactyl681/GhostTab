import { getGhostTabEnvConfig } from "@/lib/config/ghost-tab-env";
import type {
  GhostTabCreateSessionInput,
  GhostTabCreateSessionResult,
  GhostTabCreateStep,
  GhostTabCreateStepId,
  GhostTabDemoPlaybackInput,
  GhostTabDemoPlaybackState,
  GhostTabLiveReadiness,
  GhostTabModeStatus,
  GhostTabRecipientPullInput,
  GhostTabRecipientPullResult,
  GhostTabSessionSignals,
  GhostTabSession,
  GhostTabSessionCollection,
} from "@/lib/domain/ghost-tab";
import { createMockGhostTabService } from "@/lib/services/adapters/mock-ghost-tab-service";
import {
  applyLiveBetaRecipientPull,
  createLiveBetaSession,
  getLiveBetaSessionById,
  getLiveBetaSessionByRecipientId,
  listLiveBetaSessions,
} from "@/lib/services/live/live-beta-session-store";
import { getMagicBlockPaymentsClient } from "@/lib/services/magicblock/private-payments";
import { MagicBlockPaymentsError } from "@/lib/services/magicblock/private-payments-client";
import type { GhostTabService } from "@/lib/services/ghost-tab-service";

const modeStatus: GhostTabModeStatus = {
  mode: "live",
  adapter: "magicblock",
  isReadOnly: false,
  canConnectWallet: true,
  privatePaymentsReady: false,
};

type ReadinessSnapshot = {
  liveReady: boolean;
  paymentsReady: boolean;
  reason?: string;
};

export class GhostTabCreateFlowError extends Error {
  failedStep: GhostTabCreateStepId;
  steps: GhostTabCreateStep[];
  details?: Record<string, unknown>;

  constructor(
    message: string,
    failedStep: GhostTabCreateStepId,
    steps: GhostTabCreateStep[],
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "GhostTabCreateFlowError";
    this.failedStep = failedStep;
    this.steps = steps;
    this.details = details;
  }
}

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, timer };
}

async function probeSolanaDevnet(endpoint: string): Promise<boolean> {
  const { controller, timer } = withTimeout(4000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getHealth",
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return false;

    const data = (await response.json()) as { result?: string; error?: unknown };
    return data.result === "ok" || !data.error;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function probeHttpEndpoint(url: string): Promise<boolean> {
  const { controller, timer } = withTimeout(3500);
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function resolveReadinessSnapshot(): Promise<ReadinessSnapshot> {
  const env = getGhostTabEnvConfig();
  if (env.effectiveMode !== "live") {
    return {
      liveReady: false,
      paymentsReady: false,
      reason:
        env.requestedMode === "live"
          ? `Missing env: ${env.missingLiveKeys.join(", ")}`
          : "Demo mode active.",
    };
  }

  if (!env.magicRouterDevnetUrl || !env.privatePaymentsApiUrl) {
    return {
      liveReady: false,
      paymentsReady: false,
      reason: `Missing env: ${env.missingLiveKeys.join(", ")}`,
    };
  }

  const [solanaOnline, routerOnline, paymentsOnline] = await Promise.all([
    probeSolanaDevnet(env.solanaDevnetRpcUrl),
    probeHttpEndpoint(env.magicRouterDevnetUrl),
    getMagicBlockPaymentsClient()
      .health()
      .then((health) => health.ok)
      .catch(() => false),
  ]);

  const liveReady = solanaOnline && routerOnline;
  return {
    liveReady,
    paymentsReady: paymentsOnline,
    reason: liveReady
      ? paymentsOnline
        ? undefined
        : "Private Payments API unavailable."
      : "Devnet connectivity is not ready.",
  };
}

async function resolveLiveReadiness(): Promise<GhostTabLiveReadiness> {
  const env = getGhostTabEnvConfig();
  const snapshot = await resolveReadinessSnapshot();

  if (env.effectiveMode !== "live") {
    return {
      solanaDevnet: "unknown",
      magicRouter: "unknown",
      privatePayments: "beta",
      canCreateSession: false,
      reason: snapshot.reason,
    };
  }

  if (!env.magicRouterDevnetUrl || !env.privatePaymentsApiUrl) {
    return {
      solanaDevnet: "unknown",
      magicRouter: "offline",
      privatePayments: "offline",
      canCreateSession: false,
      reason: snapshot.reason,
    };
  }

  const [solanaOnline, routerOnline, paymentsOnline] = await Promise.all([
    probeSolanaDevnet(env.solanaDevnetRpcUrl),
    probeHttpEndpoint(env.magicRouterDevnetUrl),
    getMagicBlockPaymentsClient()
      .health()
      .then((health) => health.ok)
      .catch(() => false),
  ]);

  return {
    solanaDevnet: solanaOnline ? "online" : "offline",
    magicRouter: routerOnline ? "online" : "offline",
    privatePayments: paymentsOnline ? "online" : "offline",
    canCreateSession: solanaOnline && routerOnline && paymentsOnline,
    reason: solanaOnline && routerOnline && paymentsOnline ? undefined : snapshot.reason,
  };
}

function emptySteps(): GhostTabCreateStep[] {
  return [
    { id: "checkMint", status: "pending", message: "Pending" },
    { id: "initializeMint", status: "pending", message: "Pending" },
    { id: "depositReserve", status: "pending", message: "Pending" },
    { id: "createSessionRecord", status: "pending", message: "Pending" },
  ];
}

function updateStep(
  steps: GhostTabCreateStep[],
  id: GhostTabCreateStepId,
  status: GhostTabCreateStep["status"],
  message: string,
) {
  const index = steps.findIndex((step) => step.id === id);
  if (index >= 0) {
    steps[index] = { id, status, message };
  }
}

function assertCreateInput(input: GhostTabCreateSessionInput) {
  if (!input.senderWallet.trim()) {
    throw new Error("Connect wallet to create.");
  }
  if (!input.recipient.trim()) {
    throw new Error("Recipient is required.");
  }
  if (!input.mint.trim()) {
    throw new Error("Mint is required.");
  }
  if (input.reserveUsdc <= 0 || input.refillAmountUsdc <= 0 || input.maxPullUsdc <= 0) {
    throw new Error("Amounts must be greater than zero.");
  }
}

function isRouteNotFound(error: unknown) {
  if (!(error instanceof MagicBlockPaymentsError)) {
    return false;
  }

  if (error.status === 404) {
    return true;
  }

  return error.message.toLowerCase().includes("route not found");
}

function isMethodNotAllowed(error: unknown) {
  if (!(error instanceof MagicBlockPaymentsError)) {
    return false;
  }
  if (error.status === 405) {
    return true;
  }
  return error.message.toLowerCase().includes("method not allowed");
}

function isRetryableDepositError(error: unknown) {
  if (!(error instanceof MagicBlockPaymentsError)) {
    return false;
  }

  if (error.status === 0) {
    return true;
  }

  return [408, 409, 425, 429, 500, 502, 503, 504].includes(error.status);
}

function toErrorContext(error: unknown) {
  if (error instanceof MagicBlockPaymentsError) {
    return {
      type: error.name,
      message: error.message,
      status: error.status,
      code: error.code,
      requestId: error.requestId,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      type: error.name,
      message: error.message,
    };
  }

  return {
    type: "UnknownError",
    message: "Unknown error",
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSolMintValue(mint: string) {
  const value = mint.trim().toUpperCase();
  return value === "SOL" || value.endsWith("_SOL") || value.includes("SOL");
}

async function getSenderSolBalanceLamports(senderWallet: string): Promise<number | null> {
  const env = getGhostTabEnvConfig();
  const { controller, timer } = withTimeout(3500);

  try {
    const response = await fetch(env.solanaDevnetRpcUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [senderWallet, { commitment: "processed" }],
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      result?: {
        value?: number;
      };
    };

    const lamports = payload.result?.value;
    return typeof lamports === "number" && Number.isFinite(lamports) ? lamports : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function buildDepositFailureMessage(input: GhostTabCreateSessionInput, error: unknown) {
  const base =
    error instanceof Error
      ? error.message
      : "Deposit reserve failed.";

  const checks =
    `Check preconditions: sender wallet has devnet SOL for fees, ` +
    `sender wallet has enough ${input.mint} to cover reserve ${input.reserveUsdc.toFixed(2)}, ` +
    "and Private Payments endpoint is reachable.";

  return `${base} ${checks}`;
}

async function depositReserveWithRetry(
  input: GhostTabCreateSessionInput,
  steps: GhostTabCreateStep[],
) {
  const payments = getMagicBlockPaymentsClient();
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    updateStep(
      steps,
      "depositReserve",
      "running",
      `Depositing reserve (attempt ${attempt}/${maxAttempts})...`,
    );

    try {
      const deposit = await payments.deposit({
        mint: input.mint,
        owner: input.senderWallet,
        amount: input.reserveUsdc.toFixed(2),
        sessionId: undefined,
      });

      updateStep(
        steps,
        "depositReserve",
        "completed",
        deposit.statusMessage || "Reserve deposited.",
      );
      return deposit;
    } catch (error) {
      lastError = error;
      const retryable = isRetryableDepositError(error);
      const context = toErrorContext(error);

      console.warn("[ghost-tab:create] depositReserve attempt failed", {
        attempt,
        maxAttempts,
        retryable,
        mint: input.mint,
        reserveUsdc: input.reserveUsdc,
        senderWallet: input.senderWallet,
        ...context,
      });

      if (!retryable || attempt >= maxAttempts) {
        const message = buildDepositFailureMessage(input, error);
        throw new Error(message);
      }

      const waitMs = 600 * attempt;
      updateStep(
        steps,
        "depositReserve",
        "running",
        `Deposit delayed. Retrying in ${waitMs}ms...`,
      );
      await sleep(waitMs);
    }
  }

  throw new Error(buildDepositFailureMessage(input, lastError));
}

async function assertSenderMintFundingIfAvailable(
  input: GhostTabCreateSessionInput,
  payments: ReturnType<typeof getMagicBlockPaymentsClient>,
) {
  if (isSolMintValue(input.mint)) {
    return;
  }

  try {
    const balance = await payments.balance({
      mint: input.mint,
      owner: input.senderWallet,
    });
    const available = parseTokenAmount(balance.amount);
    if (available !== null && available + 1e-9 < input.reserveUsdc) {
      throw new Error(
        `Sender wallet ${input.mint} balance is too low (${available.toFixed(6)} < ${input.reserveUsdc.toFixed(6)}).`,
      );
    }
  } catch (error) {
    if (error instanceof MagicBlockPaymentsError) {
      if (isRouteNotFound(error) || error.status === 404) {
        console.warn("[ghost-tab:create] balance precheck skipped: route unavailable", {
          mint: input.mint,
          senderWallet: input.senderWallet,
          status: error.status,
          message: error.message,
        });
        return;
      }
      if (isMethodNotAllowed(error)) {
        console.warn("[ghost-tab:create] balance precheck skipped: method not allowed", {
          mint: input.mint,
          senderWallet: input.senderWallet,
          status: error.status,
          message: error.message,
        });
        return;
      }
      if (error.status === 0 && error.message.toLowerCase().includes("timed out")) {
        console.warn("[ghost-tab:create] balance precheck skipped: timeout", {
          mint: input.mint,
          senderWallet: input.senderWallet,
          message: error.message,
        });
        return;
      }
    }
    throw error;
  }
}

async function runCreateLiveSessionFlow(
  input: GhostTabCreateSessionInput,
): Promise<GhostTabCreateSessionResult> {
  assertCreateInput(input);

  const steps = emptySteps();

  try {
    console.info("[ghost-tab:create] starting flow", {
      senderWallet: input.senderWallet,
      tabName: input.tabName,
      recipient: input.recipient,
      mint: input.mint,
      reserveUsdc: input.reserveUsdc,
      refillAmountUsdc: input.refillAmountUsdc,
      refillIntervalMinutes: input.refillIntervalMinutes,
      sessionDurationMinutes: input.sessionDurationMinutes,
      maxPullUsdc: input.maxPullUsdc,
    });

    const senderSolLamports = await getSenderSolBalanceLamports(input.senderWallet);
    const minimumSolLamports = 1_000_000; // 0.001 SOL
    if (senderSolLamports !== null && senderSolLamports < minimumSolLamports) {
      throw new Error(
        `Sender wallet SOL is too low for fees (${(senderSolLamports / 1_000_000_000).toFixed(6)} SOL).`,
      );
    }

    if (isSolMintValue(input.mint) && senderSolLamports !== null) {
      const reserveLamports = Math.ceil(Math.max(input.reserveUsdc, 0) * 1_000_000_000);
      const feeHeadroomLamports = 5_000_000; // 0.005 SOL
      const requiredLamports = reserveLamports + feeHeadroomLamports;

      if (senderSolLamports < requiredLamports) {
        throw new Error(
          `Sender wallet SOL is too low (${(senderSolLamports / 1_000_000_000).toFixed(6)} SOL) for reserve ${input.reserveUsdc.toFixed(6)} SOL + fees.`,
        );
      }
    }

    const payments = getMagicBlockPaymentsClient();
    await assertSenderMintFundingIfAvailable(input, payments);
    let shouldInitializeMint = false;

    updateStep(steps, "checkMint", "running", "Checking mint initialization...");
    try {
      const mintState = await payments.isMintInitialized({ mint: input.mint });
      shouldInitializeMint = !mintState.initialized;
      updateStep(
        steps,
        "checkMint",
        "completed",
        mintState.initialized ? "Mint already initialized." : "Mint not initialized.",
      );
    } catch (error) {
      if (!isRouteNotFound(error)) {
        throw error;
      }
      updateStep(
        steps,
        "checkMint",
        "skipped",
        "Mint check endpoint unavailable; continuing live-beta flow.",
      );
      updateStep(
        steps,
        "initializeMint",
        "skipped",
        "Mint init endpoint unavailable; continuing to deposit.",
      );
    }

    if (shouldInitializeMint) {
      updateStep(steps, "initializeMint", "running", "Initializing mint...");
      try {
        const initialized = await payments.initializeMint({ mint: input.mint });
        updateStep(
          steps,
          "initializeMint",
          "completed",
          initialized.statusMessage || "Mint initialized.",
        );
      } catch (error) {
        if (!isRouteNotFound(error)) {
          throw error;
        }
        updateStep(
          steps,
          "initializeMint",
          "skipped",
          "Mint init endpoint unavailable; continuing to deposit.",
        );
      }
    } else if (steps.find((step) => step.id === "initializeMint")?.status === "pending") {
      updateStep(steps, "initializeMint", "skipped", "Skipped (mint already initialized).");
    }

    const deposit = await depositReserveWithRetry(input, steps);

    updateStep(steps, "createSessionRecord", "running", "Creating session record...");
    const created = await createLiveBetaSession({
      senderWallet: input.senderWallet,
      tabName: input.tabName,
      recipient: input.recipient,
      mint: input.mint,
      reserveUsdc: input.reserveUsdc,
      refillAmountUsdc: input.refillAmountUsdc,
      refillIntervalMinutes: input.refillIntervalMinutes,
      sessionDurationMinutes: input.sessionDurationMinutes,
      maxPullUsdc: input.maxPullUsdc,
      depositSignature: deposit.signature,
    });
    updateStep(steps, "createSessionRecord", "completed", "Live-beta session created.");
    console.info("[ghost-tab:create] flow completed", {
      sessionId: created.id,
      depositSignature: deposit.signature,
    });

    return {
      sessionId: created.id,
      liveBeta: true,
      steps,
    };
  } catch (error) {
    const running = steps.find((step) => step.status === "running");
    if (running) {
      const failureMessage = error instanceof Error ? error.message : "Step failed.";
      updateStep(
        steps,
        running.id,
        "failed",
        failureMessage,
      );
      console.error("[ghost-tab:create] flow failed", {
        failedStep: running.id,
        message: failureMessage,
        error: toErrorContext(error),
      });
      throw new GhostTabCreateFlowError(
        failureMessage,
        running.id,
        steps,
        {
          error: toErrorContext(error),
        },
      );
    }
    const fallbackFailureMessage = error instanceof Error ? error.message : "Create flow failed.";
    updateStep(steps, "depositReserve", "failed", fallbackFailureMessage);
    console.error("[ghost-tab:create] flow failed before running-step marker", {
      message: fallbackFailureMessage,
      error: toErrorContext(error),
    });
    throw new GhostTabCreateFlowError(
      fallbackFailureMessage,
      "depositReserve",
      steps,
      {
        error: toErrorContext(error),
      },
    );
  }
}

function parseTokenAmount(value: string): number | null {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRecipientId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isLikelyWalletAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());
}

export function createMagicBlockGhostTabService(): GhostTabService {
  const fallback = createMockGhostTabService();

  return {
    getModeStatus: () => modeStatus,
    getLiveReadiness: resolveLiveReadiness,
    async listSessions(nowMs?: number): Promise<GhostTabSessionCollection> {
      const live = await listLiveBetaSessions(nowMs);
      return {
        activeSessions: live.activeSessions,
        historySessions: live.historySessions,
      };
    },
    async getSessionById(id: string, nowMs?: number): Promise<GhostTabSession | null> {
      const live = await getLiveBetaSessionById(id, nowMs);
      if (live) return live;
      return fallback.getSessionById(id, nowMs);
    },
    async getSessionByRecipientId(id: string, nowMs?: number): Promise<GhostTabSession | null> {
      const live = await getLiveBetaSessionByRecipientId(id, nowMs);
      if (live) return live;
      return fallback.getSessionByRecipientId(id, nowMs);
    },
    async getSessionSignals(session: GhostTabSession): Promise<GhostTabSessionSignals> {
      const mode = session.runtime?.mode ?? "live-beta";
      const ownerWallet = session.runtime?.senderWallet ?? null;
      const mint = session.runtime?.mint ?? null;

      if (!ownerWallet || !mint) {
        return {
          mode,
          ownerWallet,
          mint,
          privateBalance: {
            status: "partial",
            amountUsdc: null,
            asOf: null,
          },
        };
      }

      try {
        const privateBalance = await getMagicBlockPaymentsClient().privateBalance({
          mint,
          owner: ownerWallet,
        });
        const amountUsdc = parseTokenAmount(privateBalance.amount);
        return {
          mode,
          ownerWallet,
          mint,
          privateBalance: {
            status: amountUsdc === null ? "partial" : "available",
            amountUsdc,
            asOf: new Date(),
          },
        };
      } catch {
        return {
          mode,
          ownerWallet,
          mint,
          privateBalance: {
            status: "unavailable",
            amountUsdc: null,
            asOf: null,
          },
        };
      }
    },
    getDemoPlayback(input: GhostTabDemoPlaybackInput): GhostTabDemoPlaybackState {
      return fallback.getDemoPlayback(input);
    },
    createSession(input: GhostTabCreateSessionInput): Promise<GhostTabCreateSessionResult> {
      return runCreateLiveSessionFlow(input);
    },
    async recipientPull(input: GhostTabRecipientPullInput): Promise<GhostTabRecipientPullResult> {
      const session = await getLiveBetaSessionById(input.sessionId);
      if (!session) {
        return {
          accepted: false,
          reason: "Session not found.",
          mode: "live-beta",
          liveTransferExecuted: false,
        };
      }

      if (session.sessionExpiry.status === "expired") {
        return {
          accepted: false,
          reason: "Session expired.",
          mode: "live-beta",
          liveTransferExecuted: false,
        };
      }

      if (normalizeRecipientId(input.recipientId) !== normalizeRecipientId(session.recipientId)) {
        return {
          accepted: false,
          reason: "Recipient does not match session.",
          mode: session.runtime?.mode ?? "live-beta",
          liveTransferExecuted: false,
        };
      }

      if (!input.callerWallet.trim()) {
        return {
          accepted: false,
          reason: "Connect recipient wallet.",
          mode: session.runtime?.mode ?? "live-beta",
          liveTransferExecuted: false,
        };
      }

      const availableNow = session.activeAllowance.availableNowUsdc;
      const maxPull = session.activeAllowance.maxPullUsdc;
      const requested = input.amountUsdc ?? maxPull;
      const pullAmount = Math.min(Math.max(requested, 0), maxPull, availableNow);
      if (pullAmount <= 0) {
        return {
          accepted: false,
          reason: "No active allowance available.",
          mode: session.runtime?.mode ?? "live-beta",
          liveTransferExecuted: false,
        };
      }

      const configuredRecipientWallet = session.runtime?.recipientWallet?.trim();
      const labelWallet = isLikelyWalletAddress(session.recipientLabel)
        ? session.recipientLabel.trim()
        : null;
      const recipientWallet = configuredRecipientWallet || labelWallet;
      const callerWallet = input.callerWallet.trim();

      if (recipientWallet && callerWallet.toLowerCase() !== recipientWallet.toLowerCase()) {
        return {
          accepted: false,
          reason: "Connected wallet is not the configured recipient.",
          mode: session.runtime?.mode ?? "live-beta",
          liveTransferExecuted: false,
        };
      }

      let liveTransferExecuted = false;
      let signature: string | undefined;

      if (recipientWallet && session.runtime?.senderWallet && session.runtime?.mint) {
        const transfer = await getMagicBlockPaymentsClient().transfer({
          mint: session.runtime.mint,
          from: session.runtime.senderWallet,
          to: recipientWallet,
          amount: pullAmount.toFixed(2),
          sessionId: session.id,
          memo: "ghost-tab recipient pull",
        });

        if (transfer.status === "failed") {
          return {
            accepted: false,
            reason: transfer.statusMessage || "Transfer failed.",
            mode: session.runtime?.mode ?? "live-beta",
            liveTransferExecuted: false,
          };
        }

        liveTransferExecuted = true;
        signature = transfer.signature;
      }

      const updated = await applyLiveBetaRecipientPull({
        sessionId: session.id,
        amountUsdc: pullAmount,
        pullSettlement: liveTransferExecuted ? "live-transfer" : "live-beta-shell",
        signature,
      });

      if (!updated) {
        return {
          accepted: false,
          reason: "Pull could not be applied.",
          mode: session.runtime?.mode ?? "live-beta",
          liveTransferExecuted,
        };
      }

      return {
        accepted: true,
        mode: session.runtime?.mode ?? "live-beta",
        liveTransferExecuted,
        signature,
        event: updated.event,
        reason: liveTransferExecuted
          ? "Pull settled via live transfer."
          : "Pull applied in live-beta session shell.",
      };
    },
  };
}
