export type GhostTabMode = "demo" | "live";
export type GhostTabAdapterKind = "mock" | "magicblock";

export type GhostTabModeStatus = {
  mode: GhostTabMode;
  adapter: GhostTabAdapterKind;
  isReadOnly: boolean;
  canConnectWallet: boolean;
  privatePaymentsReady: boolean;
};

export type GhostTabReadinessState = "online" | "offline" | "unknown" | "beta";

export type GhostTabLiveReadiness = {
  solanaDevnet: GhostTabReadinessState;
  magicRouter: GhostTabReadinessState;
  privatePayments: GhostTabReadinessState;
  canCreateSession: boolean;
  reason?: string;
};

export type GhostTabSessionStatus = "live" | "expiring" | "expired";
export type GhostTabEventType =
  | "reserve"
  | "open"
  | "crank"
  | "pull"
  | "expiry"
  | "clawback";

export type GhostTabPullSettlement = "live-transfer" | "live-beta-shell";

export type GhostTabEvent = {
  id: string;
  type: GhostTabEventType;
  at: Date;
  amountUsdc?: number;
  pullSettlement?: GhostTabPullSettlement;
  signature?: string;
};

export type GhostTabReserve = {
  totalHiddenUsdc: number;
  remainingHiddenUsdc: number;
  usedUsdc: number;
};

export type GhostTabActiveAllowance = {
  availableNowUsdc: number;
  maxPullUsdc: number;
};

export type GhostTabRefillSchedule = {
  amountUsdc: number;
  intervalMinutes: number;
  nextRefillAt: Date | null;
  refillCount: number;
};

export type GhostTabSessionExpiry = {
  expiresAt: Date;
  status: GhostTabSessionStatus;
};

export type GhostTabClawback = {
  isExecuted: boolean;
  amountUsdc: number;
  executedAt: Date | null;
};

export type GhostTabSessionMode = "demo" | "live-beta" | "live";

export type GhostTabSessionRuntime = {
  mode: GhostTabSessionMode;
  appManaged: boolean;
  senderWallet?: string;
  recipientWallet?: string;
  mint?: string;
  depositSignature?: string;
};

export type GhostTabSession = {
  id: string;
  title?: string;
  recipientId: string;
  recipientLabel: string;
  reserve: GhostTabReserve;
  activeAllowance: GhostTabActiveAllowance;
  refillSchedule: GhostTabRefillSchedule;
  sessionExpiry: GhostTabSessionExpiry;
  clawback: GhostTabClawback;
  sessionDurationMinutes: number;
  eventTape: GhostTabEvent[];
  runtime?: GhostTabSessionRuntime;
};

export type GhostTabSessionCollection = {
  activeSessions: GhostTabSession[];
  historySessions: GhostTabSession[];
};

export type GhostTabDemoTraceEvent = {
  id: string;
  type: GhostTabEventType;
  atMs: number;
  amountUsdc?: number;
};

export type GhostTabDemoPlaybackState = {
  timeLeftMs: number;
  nextRefillInMs: number | null;
  availableNowUsdc: number;
  hiddenReserveRemainingUsdc: number;
  canRecipientPull: boolean;
  isExpired: boolean;
  isClawedBack: boolean;
  eventTape: GhostTabDemoTraceEvent[];
};

export type GhostTabDemoPlaybackInput = {
  elapsedMs: number;
  manualPullAtMs: number | null;
};

export type GhostTabCreateSessionInput = {
  senderWallet: string;
  tabName?: string;
  recipient: string;
  mint: string;
  reserveUsdc: number;
  refillAmountUsdc: number;
  refillIntervalMinutes: number;
  sessionDurationMinutes: number;
  maxPullUsdc: number;
};

export type GhostTabCreateStepId =
  | "checkMint"
  | "initializeMint"
  | "depositReserve"
  | "createSessionRecord";

export type GhostTabCreateStepStatus = "pending" | "running" | "completed" | "skipped" | "failed";

export type GhostTabCreateStep = {
  id: GhostTabCreateStepId;
  status: GhostTabCreateStepStatus;
  message: string;
};

export type GhostTabCreateSessionResult = {
  sessionId: string;
  liveBeta: boolean;
  steps: GhostTabCreateStep[];
};

export type GhostTabRecipientPullInput = {
  sessionId: string;
  recipientId: string;
  callerWallet: string;
  amountUsdc?: number;
};

export type GhostTabRecipientPullResult = {
  accepted: boolean;
  reason?: string;
  event?: GhostTabEvent;
  signature?: string;
  mode: GhostTabSessionMode;
  liveTransferExecuted: boolean;
};

export type GhostTabPrivateBalanceStatus = "available" | "partial" | "unavailable";

export type GhostTabPrivateBalanceSignal = {
  status: GhostTabPrivateBalanceStatus;
  amountUsdc: number | null;
  asOf: Date | null;
};

export type GhostTabSessionSignals = {
  mode: GhostTabSessionMode;
  ownerWallet: string | null;
  mint: string | null;
  privateBalance: GhostTabPrivateBalanceSignal;
};
