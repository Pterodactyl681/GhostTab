import type {
  GhostTabEventType,
  GhostTabSession,
  GhostTabSessionStatus,
} from "@/lib/domain/ghost-tab";
import { getGhostTabService } from "@/lib/services/ghost-tab";

export type AppSessionStatus = GhostTabSessionStatus;
export type AppSessionEventType = GhostTabEventType;

export type AppSessionEvent = {
  id: string;
  type: AppSessionEventType;
  at: Date;
  amount?: number;
};

export type AppSession = {
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
  nextRefillAt: Date | null;
  expiresAt: Date;
  status: AppSessionStatus;
  eventTape: AppSessionEvent[];
};

function mapSession(session: GhostTabSession): AppSession {
  return {
    id: session.id,
    recipientId: session.recipientId,
    recipientLabel: session.recipientLabel,
    reserveUsdc: session.reserve.totalHiddenUsdc,
    availableNowUsdc: session.activeAllowance.availableNowUsdc,
    refillAmountUsdc: session.refillSchedule.amountUsdc,
    refillIntervalMinutes: session.refillSchedule.intervalMinutes,
    sessionDurationMinutes: session.sessionDurationMinutes,
    maxPullUsdc: session.activeAllowance.maxPullUsdc,
    reserveUsedUsdc: session.reserve.usedUsdc,
    refillCount: session.refillSchedule.refillCount,
    clawbackUsdc: session.clawback.amountUsdc,
    nextRefillAt: session.refillSchedule.nextRefillAt,
    expiresAt: session.sessionExpiry.expiresAt,
    status: session.sessionExpiry.status,
    eventTape: session.eventTape.map((event) => ({
      id: event.id,
      type: event.type,
      at: event.at,
      amount: event.amountUsdc,
    })),
  };
}

export async function getAppShellData(nowMs = Date.now()) {
  const service = getGhostTabService();
  const sessions = await service.listSessions(nowMs);

  return {
    activeSessions: sessions.activeSessions.map(mapSession),
    historySessions: sessions.historySessions.map(mapSession),
  };
}

export async function getSessionById(id: string, nowMs = Date.now()) {
  const service = getGhostTabService();
  const session = await service.getSessionById(id, nowMs);
  return session ? mapSession(session) : null;
}

export async function getSessionByRecipientId(id: string, nowMs = Date.now()) {
  const service = getGhostTabService();
  const session = await service.getSessionByRecipientId(id, nowMs);
  return session ? mapSession(session) : null;
}
