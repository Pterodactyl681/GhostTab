import { NextRequest, NextResponse } from "next/server";

import { getGhostTabEnvConfig } from "@/lib/config/ghost-tab-env";
import type { GhostTabRecipientPullInput } from "@/lib/domain/ghost-tab";
import { getGhostTabService } from "@/lib/services/ghost-tab";

type PullPayload = {
  sessionId?: string;
  recipientId?: string;
  callerWallet?: string;
  amountUsdc?: number;
};

function toNumber(value: unknown, fallback: number | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function parseInput(payload: PullPayload): GhostTabRecipientPullInput {
  return {
    sessionId: String(payload.sessionId ?? "").trim(),
    recipientId: String(payload.recipientId ?? "").trim(),
    callerWallet: String(payload.callerWallet ?? "").trim(),
    amountUsdc: toNumber(payload.amountUsdc, undefined),
  };
}

function assertInput(input: GhostTabRecipientPullInput) {
  if (!input.sessionId) throw new Error("Session id is required.");
  if (!input.recipientId) throw new Error("Recipient id is required.");
  if (!input.callerWallet) throw new Error("Connect recipient wallet.");
}

export async function POST(request: NextRequest) {
  const env = getGhostTabEnvConfig();
  const service = getGhostTabService();
  const mode = service.getModeStatus();

  if (mode.mode !== "live" || env.effectiveMode !== "live") {
    return NextResponse.json(
      {
        ok: false,
        code: "DEMO_FALLBACK",
        message:
          env.blockingLiveReasons.join("; ") ||
          "Live recipient pull unavailable in demo mode.",
      },
      { status: 409 },
    );
  }

  try {
    const payload = (await request.json()) as PullPayload;
    const input = parseInput(payload);
    assertInput(input);
    const result = await service.recipientPull(input);

    if (!result.accepted) {
      return NextResponse.json(
        {
          ok: false,
          code: "PULL_REJECTED",
          message: result.reason ?? "Pull was rejected.",
          result,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: "PULL_FLOW_ERROR",
        message: error instanceof Error ? error.message : "Pull failed.",
      },
      { status: 500 },
    );
  }
}
