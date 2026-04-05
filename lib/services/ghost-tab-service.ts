import type {
  GhostTabCreateSessionResult,
  GhostTabCreateSessionInput,
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

export type GhostTabService = {
  getModeStatus(): GhostTabModeStatus;
  getLiveReadiness(): Promise<GhostTabLiveReadiness>;
  listSessions(nowMs?: number): Promise<GhostTabSessionCollection>;
  getSessionById(id: string, nowMs?: number): Promise<GhostTabSession | null>;
  getSessionByRecipientId(id: string, nowMs?: number): Promise<GhostTabSession | null>;
  getSessionSignals(session: GhostTabSession): Promise<GhostTabSessionSignals>;
  getDemoPlayback(input: GhostTabDemoPlaybackInput): GhostTabDemoPlaybackState;
  createSession(input: GhostTabCreateSessionInput): Promise<GhostTabCreateSessionResult>;
  recipientPull(input: GhostTabRecipientPullInput): Promise<GhostTabRecipientPullResult>;
};
