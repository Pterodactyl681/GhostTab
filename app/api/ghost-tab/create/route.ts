import { NextRequest, NextResponse } from "next/server";

import { getGhostTabEnvConfig } from "@/lib/config/ghost-tab-env";
import type { GhostTabCreateSessionInput } from "@/lib/domain/ghost-tab";
import { GhostTabCreateFlowError } from "@/lib/services/adapters/magicblock-ghost-tab-service";
import { getGhostTabService } from "@/lib/services/ghost-tab";

type CreatePayload = {
  senderWallet?: string;
  tabName?: string;
  recipient?: string;
  mint?: string;
  reserveUsdc?: number;
  refillAmountUsdc?: number;
  refillIntervalMinutes?: number;
  sessionDurationMinutes?: number;
  maxPullUsdc?: number;
};

function toNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function parseInput(payload: CreatePayload): GhostTabCreateSessionInput {
  return {
    senderWallet: String(payload.senderWallet ?? "").trim(),
    tabName: String(payload.tabName ?? "").trim(),
    recipient: String(payload.recipient ?? "").trim(),
    mint: String(payload.mint ?? "").trim(),
    reserveUsdc: toNumber(payload.reserveUsdc, 0),
    refillAmountUsdc: toNumber(payload.refillAmountUsdc, 0),
    refillIntervalMinutes: toNumber(payload.refillIntervalMinutes, 0),
    sessionDurationMinutes: toNumber(payload.sessionDurationMinutes, 0),
    maxPullUsdc: toNumber(payload.maxPullUsdc, 0),
  };
}

export async function POST(request: NextRequest) {
  const env = getGhostTabEnvConfig();
  const service = getGhostTabService();
  const mode = service.getModeStatus();

  if (mode.mode !== "live" || env.effectiveMode !== "live") {
    const blocker = env.blockingLiveReasons.join("; ");
    return NextResponse.json(
      {
        ok: false,
        code: "DEMO_FALLBACK",
        message:
          (blocker.length > 0 ? blocker : undefined) ??
          (env.requestedMode === "live"
            ? `Live env incomplete: ${env.missingLiveKeys.join(", ")}`
            : "Live create unavailable in demo mode."),
      },
      { status: 409 },
    );
  }

  try {
    const payload = (await request.json()) as CreatePayload;
    const input = parseInput(payload);
    console.info("[api/ghost-tab/create] request", {
      senderWallet: input.senderWallet,
      recipient: input.recipient,
      mint: input.mint,
      reserveUsdc: input.reserveUsdc,
      mode: mode.mode,
      effectiveMode: env.effectiveMode,
    });
    const result = await service.createSession(input);
    console.info("[api/ghost-tab/create] success", {
      sessionId: result.sessionId,
      liveBeta: result.liveBeta,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof GhostTabCreateFlowError) {
      console.error("[api/ghost-tab/create] flow failed", {
        failedStep: error.failedStep,
        message: error.message,
        details: error.details,
      });
      return NextResponse.json(
        {
          ok: false,
          code: "CREATE_FLOW_FAILED",
          message: error.message,
          failedStep: error.failedStep,
          steps: error.steps,
          details: error.details,
        },
        { status: 422 },
      );
    }

    const message = error instanceof Error ? error.message : "Create flow failed.";
    console.error("[api/ghost-tab/create] unexpected error", {
      message,
      error,
    });
    return NextResponse.json(
      {
        ok: false,
        code: "CREATE_FLOW_ERROR",
        message,
      },
      { status: 500 },
    );
  }
}
