import type { GhostTabEventType } from "@/lib/domain/ghost-tab";
import { getGhostTabService } from "@/lib/services/ghost-tab";

export type DemoSessionEventType = GhostTabEventType;

export type DemoSessionEvent = {
  id: string;
  type: DemoSessionEventType;
  atMs: number;
  amount?: number;
};

export type DemoSessionSeed = {
  reserveDepositUsdc: number;
  refillAmountUsdc: number;
  pullAmountUsdc: number;
  sessionDurationMs: number;
  openAtMs: number;
  firstRefillAtMs: number;
  autoPullAtMs: number;
  secondRefillAtMs: number;
  clawbackAtMs: number;
};

export const ghostTabDemoSeed: DemoSessionSeed = {
  reserveDepositUsdc: 62.5,
  refillAmountUsdc: 6.25,
  pullAmountUsdc: 4.5,
  sessionDurationMs: 180_000,
  openAtMs: 8_000,
  firstRefillAtMs: 35_000,
  autoPullAtMs: 70_000,
  secondRefillAtMs: 110_000,
  clawbackAtMs: 195_000,
};

export type DemoSessionState = {
  timeLeftMs: number;
  nextRefillInMs: number | null;
  availableUsdc: number;
  reserveRemainingUsdc: number;
  canPull: boolean;
  isExpired: boolean;
  isClawedBack: boolean;
  events: DemoSessionEvent[];
};

type DeriveDemoSessionOptions = {
  elapsedMs: number;
  manualPullAtMs: number | null;
  seed?: DemoSessionSeed;
};

export function deriveDemoSessionState({
  elapsedMs,
  manualPullAtMs,
}: DeriveDemoSessionOptions): DemoSessionState {
  const service = getGhostTabService();
  const session = service.getDemoPlayback({ elapsedMs, manualPullAtMs });

  return {
    timeLeftMs: session.timeLeftMs,
    nextRefillInMs: session.nextRefillInMs,
    availableUsdc: session.availableNowUsdc,
    reserveRemainingUsdc: session.hiddenReserveRemainingUsdc,
    canPull: session.canRecipientPull,
    isExpired: session.isExpired,
    isClawedBack: session.isClawedBack,
    events: session.eventTape.map((event) => ({
      id: event.id,
      type: event.type,
      atMs: event.atMs,
      amount: event.amountUsdc,
    })),
  };
}
