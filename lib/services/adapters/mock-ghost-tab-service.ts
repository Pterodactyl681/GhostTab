import type {
  GhostTabCreateSessionResult,
  GhostTabDemoPlaybackInput,
  GhostTabDemoPlaybackState,
  GhostTabEvent,
  GhostTabEventType,
  GhostTabLiveReadiness,
  GhostTabModeStatus,
  GhostTabRecipientPullInput,
  GhostTabRecipientPullResult,
  GhostTabSessionSignals,
  GhostTabSession,
  GhostTabSessionCollection,
} from "@/lib/domain/ghost-tab";
import { getGhostTabEnvConfig } from "@/lib/config/ghost-tab-env";
import type { GhostTabService } from "@/lib/services/ghost-tab-service";

type SeedRow = {
  id: string;
  recipientId: string;
  recipientLabel: string;
  reserveUsdc: number;
  availableNowUsdc: number;
  refillAmountUsdc: number;
  refillIntervalMinutes: number;
  sessionDurationMinutes: number;
  maxPullUsdc: number;
  reserveUsedUsdc: number;
  refillCount: number;
  clawbackUsdc: number;
  nextRefillInMs: number | null;
  expiresInMs: number;
  events: Array<{
    id: string;
    type: GhostTabEventType;
    atOffsetMs: number;
    amountUsdc?: number;
  }>;
};

type DemoSessionSeed = {
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

const modeStatus: GhostTabModeStatus = {
  mode: "demo",
  adapter: "mock",
  isReadOnly: true,
  canConnectWallet: false,
  privatePaymentsReady: false,
};

function resolveMockReadiness(): GhostTabLiveReadiness {
  const env = getGhostTabEnvConfig();
  if (env.requestedMode === "live" && env.effectiveMode !== "live") {
    return {
      solanaDevnet: "unknown",
      magicRouter: "offline",
      privatePayments: "offline",
      canCreateSession: false,
      reason: `Missing env: ${env.missingLiveKeys.join(", ")}`,
    };
  }

  return {
    solanaDevnet: "unknown",
    magicRouter: "unknown",
    privatePayments: "beta",
    canCreateSession: false,
    reason: "Demo adapter active. Switch to live env to enable devnet flows.",
  };
}

const ACTIVE_SEED: SeedRow[] = [
  {
    id: "GT-241",
    recipientId: "quiet-ops",
    recipientLabel: "quiet-ops.sol",
    reserveUsdc: 62.5,
    availableNowUsdc: 7.5,
    refillAmountUsdc: 6.25,
    refillIntervalMinutes: 5,
    sessionDurationMinutes: 90,
    maxPullUsdc: 8,
    reserveUsedUsdc: 24.75,
    refillCount: 4,
    clawbackUsdc: 0,
    nextRefillInMs: 88_000,
    expiresInMs: 27 * 60_000,
    events: [
      { id: "reserve-1", type: "reserve", atOffsetMs: -54 * 60_000, amountUsdc: 62.5 },
      { id: "open-1", type: "open", atOffsetMs: -53 * 60_000 },
      { id: "crank-1", type: "crank", atOffsetMs: -48 * 60_000, amountUsdc: 6.25 },
      { id: "pull-1", type: "pull", atOffsetMs: -45 * 60_000, amountUsdc: 5 },
      { id: "crank-2", type: "crank", atOffsetMs: -43 * 60_000, amountUsdc: 6.25 },
      { id: "pull-2", type: "pull", atOffsetMs: -39 * 60_000, amountUsdc: 4.5 },
    ],
  },
  {
    id: "GT-255",
    recipientId: "ops-night",
    recipientLabel: "ops-night.sol",
    reserveUsdc: 44,
    availableNowUsdc: 3.25,
    refillAmountUsdc: 3.25,
    refillIntervalMinutes: 5,
    sessionDurationMinutes: 60,
    maxPullUsdc: 4,
    reserveUsedUsdc: 30,
    refillCount: 6,
    clawbackUsdc: 0,
    nextRefillInMs: 33_000,
    expiresInMs: 6 * 60_000,
    events: [
      { id: "reserve-1", type: "reserve", atOffsetMs: -58 * 60_000, amountUsdc: 44 },
      { id: "open-1", type: "open", atOffsetMs: -57 * 60_000 },
      { id: "crank-1", type: "crank", atOffsetMs: -52 * 60_000, amountUsdc: 3.25 },
      { id: "pull-1", type: "pull", atOffsetMs: -49 * 60_000, amountUsdc: 3.25 },
      { id: "crank-2", type: "crank", atOffsetMs: -47 * 60_000, amountUsdc: 3.25 },
      { id: "pull-2", type: "pull", atOffsetMs: -44 * 60_000, amountUsdc: 3.25 },
    ],
  },
];

const HISTORY_SEED: SeedRow[] = [
  {
    id: "GT-198",
    recipientId: "support-burst",
    recipientLabel: "support-burst.sol",
    reserveUsdc: 40,
    availableNowUsdc: 0,
    refillAmountUsdc: 4,
    refillIntervalMinutes: 5,
    sessionDurationMinutes: 45,
    maxPullUsdc: 5,
    reserveUsedUsdc: 27,
    refillCount: 5,
    clawbackUsdc: 13,
    nextRefillInMs: null,
    expiresInMs: -75 * 60_000,
    events: [
      { id: "reserve-1", type: "reserve", atOffsetMs: -128 * 60_000, amountUsdc: 40 },
      { id: "open-1", type: "open", atOffsetMs: -127 * 60_000 },
      { id: "crank-1", type: "crank", atOffsetMs: -122 * 60_000, amountUsdc: 4 },
      { id: "pull-1", type: "pull", atOffsetMs: -118 * 60_000, amountUsdc: 5 },
      { id: "expiry-1", type: "expiry", atOffsetMs: -75 * 60_000 },
      { id: "clawback-1", type: "clawback", atOffsetMs: -74 * 60_000, amountUsdc: 13 },
    ],
  },
  {
    id: "GT-176",
    recipientId: "mod-shift",
    recipientLabel: "mod-shift.sol",
    reserveUsdc: 32,
    availableNowUsdc: 0,
    refillAmountUsdc: 2,
    refillIntervalMinutes: 5,
    sessionDurationMinutes: 30,
    maxPullUsdc: 3,
    reserveUsedUsdc: 22,
    refillCount: 4,
    clawbackUsdc: 10,
    nextRefillInMs: null,
    expiresInMs: -220 * 60_000,
    events: [
      { id: "reserve-1", type: "reserve", atOffsetMs: -254 * 60_000, amountUsdc: 32 },
      { id: "open-1", type: "open", atOffsetMs: -253 * 60_000 },
      { id: "crank-1", type: "crank", atOffsetMs: -248 * 60_000, amountUsdc: 2 },
      { id: "pull-1", type: "pull", atOffsetMs: -244 * 60_000, amountUsdc: 3 },
      { id: "expiry-1", type: "expiry", atOffsetMs: -220 * 60_000 },
      { id: "clawback-1", type: "clawback", atOffsetMs: -219 * 60_000, amountUsdc: 10 },
    ],
  },
];

const DEMO_SEED: DemoSessionSeed = {
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

function deriveStatus(expiresAt: Date, nowMs: number): GhostTabSession["sessionExpiry"]["status"] {
  const delta = expiresAt.getTime() - nowMs;
  if (delta <= 0) return "expired";
  if (delta <= 10 * 60_000) return "expiring";
  return "live";
}

function materializeEvent(row: SeedRow, nowMs: number): GhostTabEvent[] {
  return row.events.map((event) => ({
    id: event.id,
    type: event.type,
    at: new Date(nowMs + event.atOffsetMs),
    amountUsdc: event.amountUsdc,
  }));
}

function materializeSession(row: SeedRow, nowMs: number): GhostTabSession {
  const expiresAt = new Date(nowMs + row.expiresInMs);
  const nextRefillAt = row.nextRefillInMs === null ? null : new Date(nowMs + row.nextRefillInMs);

  return {
    id: row.id,
    recipientId: row.recipientId,
    recipientLabel: row.recipientLabel,
    reserve: {
      totalHiddenUsdc: row.reserveUsdc,
      remainingHiddenUsdc: Math.max(row.reserveUsdc - row.reserveUsedUsdc - row.clawbackUsdc, 0),
      usedUsdc: row.reserveUsedUsdc,
    },
    activeAllowance: {
      availableNowUsdc: row.availableNowUsdc,
      maxPullUsdc: row.maxPullUsdc,
    },
    refillSchedule: {
      amountUsdc: row.refillAmountUsdc,
      intervalMinutes: row.refillIntervalMinutes,
      nextRefillAt,
      refillCount: row.refillCount,
    },
    sessionExpiry: {
      expiresAt,
      status: deriveStatus(expiresAt, nowMs),
    },
    clawback: {
      isExecuted: row.clawbackUsdc > 0,
      amountUsdc: row.clawbackUsdc,
      executedAt: row.clawbackUsdc > 0 ? new Date(expiresAt.getTime() + 60_000) : null,
    },
    sessionDurationMinutes: row.sessionDurationMinutes,
    eventTape: materializeEvent(row, nowMs),
    runtime: {
      mode: "demo",
      appManaged: true,
    },
  };
}

function pushDemoEvent(
  eventTape: GhostTabDemoPlaybackState["eventTape"],
  id: string,
  type: GhostTabEventType,
  atMs: number,
  amountUsdc?: number,
) {
  eventTape.push({ id, type, atMs, amountUsdc });
}

function deriveDemoPlayback(input: GhostTabDemoPlaybackInput): GhostTabDemoPlaybackState {
  const elapsed = Math.max(0, input.elapsedMs);
  const eventTape: GhostTabDemoPlaybackState["eventTape"] = [];

  let hiddenReserveRemainingUsdc = DEMO_SEED.reserveDepositUsdc;
  let availableNowUsdc = 0;

  pushDemoEvent(eventTape, "reserve-1", "reserve", 0, DEMO_SEED.reserveDepositUsdc);

  if (elapsed >= DEMO_SEED.openAtMs) {
    pushDemoEvent(eventTape, "open-1", "open", DEMO_SEED.openAtMs);
  }

  if (elapsed >= DEMO_SEED.firstRefillAtMs) {
    availableNowUsdc += DEMO_SEED.refillAmountUsdc;
    hiddenReserveRemainingUsdc -= DEMO_SEED.refillAmountUsdc;
    pushDemoEvent(
      eventTape,
      "crank-1",
      "crank",
      DEMO_SEED.firstRefillAtMs,
      DEMO_SEED.refillAmountUsdc,
    );
  }

  const pullAtMs = input.manualPullAtMs ?? DEMO_SEED.autoPullAtMs;
  const pullTriggered = elapsed >= pullAtMs && pullAtMs >= DEMO_SEED.firstRefillAtMs;

  if (pullTriggered) {
    const pulledAmount = Math.min(DEMO_SEED.pullAmountUsdc, availableNowUsdc);
    if (pulledAmount > 0) {
      availableNowUsdc -= pulledAmount;
      pushDemoEvent(eventTape, "pull-1", "pull", pullAtMs, pulledAmount);
    }
  }

  if (elapsed >= DEMO_SEED.secondRefillAtMs) {
    availableNowUsdc += DEMO_SEED.refillAmountUsdc;
    hiddenReserveRemainingUsdc -= DEMO_SEED.refillAmountUsdc;
    pushDemoEvent(
      eventTape,
      "crank-2",
      "crank",
      DEMO_SEED.secondRefillAtMs,
      DEMO_SEED.refillAmountUsdc,
    );
  }

  const isExpired = elapsed >= DEMO_SEED.sessionDurationMs;
  if (isExpired) {
    availableNowUsdc = 0;
    pushDemoEvent(eventTape, "expiry-1", "expiry", DEMO_SEED.sessionDurationMs);
  }

  const isClawedBack = elapsed >= DEMO_SEED.clawbackAtMs;
  if (isClawedBack) {
    hiddenReserveRemainingUsdc = 0;
    pushDemoEvent(eventTape, "clawback-1", "clawback", DEMO_SEED.clawbackAtMs);
  }

  const nextRefillInMs =
    elapsed < DEMO_SEED.firstRefillAtMs
      ? DEMO_SEED.firstRefillAtMs - elapsed
      : elapsed < DEMO_SEED.secondRefillAtMs
        ? DEMO_SEED.secondRefillAtMs - elapsed
        : null;

  return {
    timeLeftMs: Math.max(DEMO_SEED.sessionDurationMs - elapsed, 0),
    nextRefillInMs,
    availableNowUsdc: Math.max(availableNowUsdc, 0),
    hiddenReserveRemainingUsdc: Math.max(hiddenReserveRemainingUsdc, 0),
    canRecipientPull: elapsed >= DEMO_SEED.firstRefillAtMs && !pullTriggered && !isExpired,
    isExpired,
    isClawedBack,
    eventTape,
  };
}

function listSessions(nowMs = Date.now()): GhostTabSessionCollection {
  return {
    activeSessions: ACTIVE_SEED.map((seed) => materializeSession(seed, nowMs)),
    historySessions: HISTORY_SEED.map((seed) => materializeSession(seed, nowMs)),
  };
}

function getSessionById(id: string, nowMs = Date.now()): GhostTabSession | null {
  const { activeSessions, historySessions } = listSessions(nowMs);
  return [...activeSessions, ...historySessions].find((session) => session.id === id) ?? null;
}

function getSessionByRecipientId(id: string, nowMs = Date.now()): GhostTabSession | null {
  const { activeSessions, historySessions } = listSessions(nowMs);
  return [...activeSessions, ...historySessions].find((session) => session.recipientId === id) ?? null;
}

export function createMockGhostTabService(): GhostTabService {
  return {
    getModeStatus: () => modeStatus,
    getLiveReadiness: async () => resolveMockReadiness(),
    listSessions: async (nowMs?: number) => listSessions(nowMs),
    getSessionById: async (id: string, nowMs?: number) => getSessionById(id, nowMs),
    getSessionByRecipientId: async (id: string, nowMs?: number) =>
      getSessionByRecipientId(id, nowMs),
    async getSessionSignals(session: GhostTabSession): Promise<GhostTabSessionSignals> {
      return {
        mode: session.runtime?.mode ?? "demo",
        ownerWallet: session.runtime?.senderWallet ?? null,
        mint: session.runtime?.mint ?? null,
        privateBalance: {
          status: "unavailable",
          amountUsdc: null,
          asOf: null,
        },
      };
    },
    getDemoPlayback: deriveDemoPlayback,
    async createSession(): Promise<GhostTabCreateSessionResult> {
      return {
        sessionId: "demo-pending",
        liveBeta: false,
        steps: [
          { id: "checkMint", status: "skipped", message: "Demo mode fallback." },
          { id: "initializeMint", status: "skipped", message: "Demo mode fallback." },
          { id: "depositReserve", status: "skipped", message: "Demo mode fallback." },
          { id: "createSessionRecord", status: "completed", message: "Demo session staged." },
        ],
      };
    },
    async recipientPull(_input: GhostTabRecipientPullInput): Promise<GhostTabRecipientPullResult> {
      return {
        accepted: false,
        reason: "Demo adapter is deterministic and does not persist writes.",
        mode: "demo",
        liveTransferExecuted: false,
      };
    },
  };
}
