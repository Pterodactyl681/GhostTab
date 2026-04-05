import fs from "node:fs";
import path from "node:path";

import type {
  GhostTabPullSettlement,
  GhostTabSession,
  GhostTabSessionCollection,
} from "@/lib/domain/ghost-tab";

type LiveSessionStore = {
  byId: Map<string, GhostTabSession>;
  order: string[];
};

type PersistedLiveSessionStore = {
  order: string[];
  sessions: Array<Record<string, unknown>>;
};

declare global {
  // eslint-disable-next-line no-var
  var __ghostTabLiveSessionStore: LiveSessionStore | undefined;
  // eslint-disable-next-line no-var
  var __ghostTabLiveSessionStoreLoaded: boolean | undefined;
}

const STORE_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(STORE_DIR, "live-beta-sessions.json");

const KV_KEY = "ghosttab:live-beta-sessions:v1";

function kvConfig() {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) return null;
  return {
    url: url.replace(/\/+$/, ""),
    token,
  };
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function deserializeSession(raw: Record<string, unknown>): GhostTabSession | null {
  const id = asString(raw.id).trim();
  const recipientId = asString(raw.recipientId).trim();
  const recipientLabel = asString(raw.recipientLabel).trim();
  if (!id || !recipientId || !recipientLabel) return null;

  const reserveRaw = (raw.reserve ?? {}) as Record<string, unknown>;
  const allowanceRaw = (raw.activeAllowance ?? {}) as Record<string, unknown>;
  const refillRaw = (raw.refillSchedule ?? {}) as Record<string, unknown>;
  const expiryRaw = (raw.sessionExpiry ?? {}) as Record<string, unknown>;
  const clawbackRaw = (raw.clawback ?? {}) as Record<string, unknown>;
  const runtimeRaw = raw.runtime as Record<string, unknown> | undefined;

  const expiresAt = toDate(expiryRaw.expiresAt);
  if (!expiresAt) return null;

  const nextRefillAt = toDate(refillRaw.nextRefillAt);
  const clawbackExecutedAt = toDate(clawbackRaw.executedAt);

  const eventTapeRaw = Array.isArray(raw.eventTape) ? raw.eventTape : [];
  const eventTape = eventTapeRaw
    .map((event): GhostTabSession["eventTape"][number] | null => {
      const value = event as Record<string, unknown>;
      const eventId = asString(value.id).trim();
      const eventType = asString(value.type).trim();
      const at = toDate(value.at);
      if (!eventId || !eventType || !at) return null;

      return {
        id: eventId,
        type: eventType as GhostTabSession["eventTape"][number]["type"],
        at,
        amountUsdc:
          typeof value.amountUsdc === "number" && Number.isFinite(value.amountUsdc)
            ? value.amountUsdc
            : undefined,
        pullSettlement:
          typeof value.pullSettlement === "string"
            ? (value.pullSettlement as GhostTabSession["eventTape"][number]["pullSettlement"])
            : undefined,
        signature: typeof value.signature === "string" ? value.signature : undefined,
      };
    })
    .filter((event): event is GhostTabSession["eventTape"][number] => Boolean(event));

  return {
    id,
    title: asString(raw.title).trim() || undefined,
    recipientId,
    recipientLabel,
    reserve: {
      totalHiddenUsdc: asNumber(reserveRaw.totalHiddenUsdc),
      remainingHiddenUsdc: asNumber(reserveRaw.remainingHiddenUsdc),
      usedUsdc: asNumber(reserveRaw.usedUsdc),
    },
    activeAllowance: {
      availableNowUsdc: asNumber(allowanceRaw.availableNowUsdc),
      maxPullUsdc: asNumber(allowanceRaw.maxPullUsdc),
    },
    refillSchedule: {
      amountUsdc: asNumber(refillRaw.amountUsdc),
      intervalMinutes: asNumber(refillRaw.intervalMinutes),
      nextRefillAt,
      refillCount: asNumber(refillRaw.refillCount),
    },
    sessionExpiry: {
      expiresAt,
      status:
        asString(expiryRaw.status) === "expired" || asString(expiryRaw.status) === "expiring"
          ? (asString(expiryRaw.status) as "expired" | "expiring")
          : "live",
    },
    clawback: {
      isExecuted: Boolean(clawbackRaw.isExecuted),
      amountUsdc: asNumber(clawbackRaw.amountUsdc),
      executedAt: clawbackExecutedAt,
    },
    sessionDurationMinutes: asNumber(raw.sessionDurationMinutes),
    eventTape,
    runtime: runtimeRaw
      ? {
          mode:
            runtimeRaw.mode === "live" || runtimeRaw.mode === "demo"
              ? (runtimeRaw.mode as "live" | "demo")
              : "live-beta",
          appManaged: runtimeRaw.appManaged !== false,
          senderWallet: asString(runtimeRaw.senderWallet).trim() || undefined,
          recipientWallet: asString(runtimeRaw.recipientWallet).trim() || undefined,
          mint: asString(runtimeRaw.mint).trim() || undefined,
          depositSignature: asString(runtimeRaw.depositSignature).trim() || undefined,
        }
      : undefined,
  };
}

function serializeSession(session: GhostTabSession): Record<string, unknown> {
  return {
    ...session,
    sessionExpiry: {
      ...session.sessionExpiry,
      expiresAt: session.sessionExpiry.expiresAt.toISOString(),
    },
    refillSchedule: {
      ...session.refillSchedule,
      nextRefillAt: session.refillSchedule.nextRefillAt
        ? session.refillSchedule.nextRefillAt.toISOString()
        : null,
    },
    clawback: {
      ...session.clawback,
      executedAt: session.clawback.executedAt ? session.clawback.executedAt.toISOString() : null,
    },
    eventTape: session.eventTape.map((event) => ({
      ...event,
      at: event.at.toISOString(),
    })),
  };
}

function emptyStore(): LiveSessionStore {
  return {
    byId: new Map<string, GhostTabSession>(),
    order: [],
  };
}

function loadPersistedStoreFromFile(): LiveSessionStore {
  try {
    if (!fs.existsSync(STORE_FILE)) {
      return emptyStore();
    }

    const raw = fs.readFileSync(STORE_FILE, "utf8");
    if (!raw.trim()) {
      return emptyStore();
    }

    const parsed = JSON.parse(raw) as PersistedLiveSessionStore;
    const byId = new Map<string, GhostTabSession>();
    const sessionsRaw = Array.isArray(parsed.sessions) ? parsed.sessions : [];

    for (const row of sessionsRaw) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue;
      const session = deserializeSession(row as Record<string, unknown>);
      if (!session) continue;
      byId.set(session.id, session);
    }

    const orderRaw = Array.isArray(parsed.order) ? parsed.order : [];
    const order = orderRaw
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .filter((id, index, values) => values.indexOf(id) === index)
      .filter((id) => byId.has(id));

    for (const id of byId.keys()) {
      if (!order.includes(id)) {
        order.push(id);
      }
    }

    return { byId, order };
  } catch {
    return emptyStore();
  }
}

function toPersistedPayload(store: LiveSessionStore): PersistedLiveSessionStore {
  return {
    order: [...store.order],
    sessions: store.order
      .map((id) => store.byId.get(id))
      .filter((session): session is GhostTabSession => Boolean(session))
      .map((session) => serializeSession(session)),
  };
}

function parsePersistedPayload(rawJson: string): LiveSessionStore {
  try {
    const parsed = JSON.parse(rawJson) as PersistedLiveSessionStore;
    const byId = new Map<string, GhostTabSession>();
    const sessionsRaw = Array.isArray(parsed.sessions) ? parsed.sessions : [];
    for (const row of sessionsRaw) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue;
      const session = deserializeSession(row as Record<string, unknown>);
      if (session) byId.set(session.id, session);
    }
    const orderRaw = Array.isArray(parsed.order) ? parsed.order : [];
    const order = orderRaw
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .filter((id, index, values) => values.indexOf(id) === index)
      .filter((id) => byId.has(id));
    for (const id of byId.keys()) {
      if (!order.includes(id)) order.push(id);
    }
    return { byId, order };
  } catch {
    return emptyStore();
  }
}

async function loadPersistedStoreFromKv(): Promise<LiveSessionStore | null> {
  const cfg = kvConfig();
  if (!cfg) return null;

  try {
    const response = await fetch(`${cfg.url}/get/${encodeURIComponent(KV_KEY)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { result?: unknown };
    if (typeof payload.result !== "string" || payload.result.length === 0) {
      return emptyStore();
    }
    return parsePersistedPayload(payload.result);
  } catch {
    return null;
  }
}

async function persistStoreToKv(store: LiveSessionStore): Promise<void> {
  const cfg = kvConfig();
  if (!cfg) return;

  try {
    const json = JSON.stringify(toPersistedPayload(store));
    const url = `${cfg.url}/set/${encodeURIComponent(KV_KEY)}/${encodeURIComponent(json)}`;
    await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
      },
      cache: "no-store",
    });
  } catch {
    // non-fatal in beta mode
  }
}

async function persistStoreToFile(store: LiveSessionStore): Promise<void> {
  try {
    fs.mkdirSync(STORE_DIR, { recursive: true });
    const payload = toPersistedPayload(store);
    const tempFile = `${STORE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), "utf8");
    fs.renameSync(tempFile, STORE_FILE);
  } catch {
    // non-fatal in beta mode
  }
}

async function ensureStoreLoaded(): Promise<LiveSessionStore> {
  if (globalThis.__ghostTabLiveSessionStoreLoaded && globalThis.__ghostTabLiveSessionStore) {
    return globalThis.__ghostTabLiveSessionStore;
  }

  const fromKv = await loadPersistedStoreFromKv();
  globalThis.__ghostTabLiveSessionStore = fromKv ?? loadPersistedStoreFromFile();
  globalThis.__ghostTabLiveSessionStoreLoaded = true;
  return globalThis.__ghostTabLiveSessionStore;
}

async function persistStore(store: LiveSessionStore): Promise<void> {
  await Promise.all([persistStoreToKv(store), persistStoreToFile(store)]);
}

function toSessionStatus(expiresAt: Date, nowMs: number): GhostTabSession["sessionExpiry"]["status"] {
  const delta = expiresAt.getTime() - nowMs;
  if (delta <= 0) return "expired";
  if (delta <= 10 * 60_000) return "expiring";
  return "live";
}

function withDerivedState(session: GhostTabSession, nowMs: number): GhostTabSession {
  const expiresAtMs = session.sessionExpiry.expiresAt.getTime();
  const status = toSessionStatus(session.sessionExpiry.expiresAt, nowMs);
  const eventTape = [...session.eventTape];
  const hasExpiry = eventTape.some((event) => event.type === "expiry");
  const hasClawback = eventTape.some((event) => event.type === "clawback");
  let reserve = {
    ...session.reserve,
  };
  let clawback = {
    ...session.clawback,
  };

  if (nowMs >= expiresAtMs && !hasExpiry) {
    eventTape.push({
      id: `${session.id}-expiry`,
      type: "expiry",
      at: new Date(expiresAtMs),
    });
  }

  if (nowMs >= expiresAtMs + 30_000 && !hasClawback) {
    const reclaimable = Math.max(reserve.remainingHiddenUsdc, 0);
    if (reclaimable > 0) {
      eventTape.push({
        id: `${session.id}-clawback`,
        type: "clawback",
        at: new Date(expiresAtMs + 30_000),
        amountUsdc: reclaimable,
      });
      reserve = {
        ...reserve,
        remainingHiddenUsdc: 0,
      };
      clawback = {
        isExecuted: true,
        amountUsdc: reclaimable,
        executedAt: new Date(expiresAtMs + 30_000),
      };
    }
  }

  return {
    ...session,
    reserve,
    clawback,
    sessionExpiry: {
      ...session.sessionExpiry,
      status,
    },
    eventTape,
  };
}

function normalizeRecipientId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type CreateLiveBetaSessionInput = {
  senderWallet: string;
  tabName?: string;
  recipient: string;
  mint: string;
  reserveUsdc: number;
  refillAmountUsdc: number;
  refillIntervalMinutes: number;
  sessionDurationMinutes: number;
  maxPullUsdc: number;
  depositSignature?: string;
};

function isLikelyWalletAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());
}

export async function createLiveBetaSession(input: CreateLiveBetaSessionInput): Promise<GhostTabSession> {
  const store = await ensureStoreLoaded();
  const createdAt = Date.now();
  const id = `GT-LIVE-${createdAt}`;
  const recipientId = normalizeRecipientId(input.recipient || `recipient-${createdAt}`);
  const expiresAt = new Date(createdAt + input.sessionDurationMinutes * 60_000);
  const nextRefillAt = new Date(createdAt + input.refillIntervalMinutes * 60_000);

  const session: GhostTabSession = {
    id,
    title: input.tabName?.trim() || undefined,
    recipientId,
    recipientLabel: input.recipient,
    reserve: {
      totalHiddenUsdc: input.reserveUsdc,
      remainingHiddenUsdc: input.reserveUsdc,
      usedUsdc: 0,
    },
    activeAllowance: {
      availableNowUsdc: Math.min(input.refillAmountUsdc, input.maxPullUsdc),
      maxPullUsdc: input.maxPullUsdc,
    },
    refillSchedule: {
      amountUsdc: input.refillAmountUsdc,
      intervalMinutes: input.refillIntervalMinutes,
      nextRefillAt,
      refillCount: 0,
    },
    sessionExpiry: {
      expiresAt,
      status: "live",
    },
    clawback: {
      isExecuted: false,
      amountUsdc: 0,
      executedAt: null,
    },
    sessionDurationMinutes: input.sessionDurationMinutes,
    eventTape: [
      {
        id: `${id}-reserve`,
        type: "reserve",
        at: new Date(createdAt),
        amountUsdc: input.reserveUsdc,
      },
      {
        id: `${id}-open`,
        type: "open",
        at: new Date(createdAt + 600),
      },
      {
        id: `${id}-crank`,
        type: "crank",
        at: new Date(createdAt + 1200),
        amountUsdc: Math.min(input.refillAmountUsdc, input.maxPullUsdc),
      },
      ...(input.depositSignature
        ? [
            {
              id: `${id}-deposit`,
              type: "reserve" as const,
              at: new Date(createdAt + 1600),
              amountUsdc: input.reserveUsdc,
            },
          ]
        : []),
    ],
    runtime: {
      mode: "live-beta",
      appManaged: true,
      senderWallet: input.senderWallet,
      recipientWallet: isLikelyWalletAddress(input.recipient) ? input.recipient.trim() : undefined,
      mint: input.mint,
      depositSignature: input.depositSignature,
    },
  };

  store.byId.set(id, session);
  store.order.unshift(id);
  await persistStore(store);

  return session;
}

export async function listLiveBetaSessions(nowMs = Date.now()): Promise<GhostTabSessionCollection> {
  const store = await ensureStoreLoaded();
  const sessions = store.order
    .map((id) => store.byId.get(id))
    .filter((item): item is GhostTabSession => Boolean(item))
    .map((session) => withDerivedState(session, nowMs));

  return {
    activeSessions: sessions.filter((item) => item.sessionExpiry.status !== "expired"),
    historySessions: sessions.filter((item) => item.sessionExpiry.status === "expired"),
  };
}

export async function getLiveBetaSessionById(
  id: string,
  nowMs = Date.now(),
): Promise<GhostTabSession | null> {
  const store = await ensureStoreLoaded();
  const session = store.byId.get(id);
  return session ? withDerivedState(session, nowMs) : null;
}

export async function getLiveBetaSessionByRecipientId(
  recipientId: string,
  nowMs = Date.now(),
): Promise<GhostTabSession | null> {
  const normalized = normalizeRecipientId(recipientId);
  const store = await ensureStoreLoaded();

  for (const id of store.order) {
    const session = store.byId.get(id);
    if (session && normalizeRecipientId(session.recipientId) === normalized) {
      return withDerivedState(session, nowMs);
    }
  }

  return null;
}

export async function applyLiveBetaRecipientPull(
  args: {
    sessionId: string;
    amountUsdc: number;
    atMs?: number;
    pullSettlement: GhostTabPullSettlement;
    signature?: string;
  },
): Promise<{ session: GhostTabSession; event: GhostTabSession["eventTape"][number] } | null> {
  const store = await ensureStoreLoaded();
  const session = store.byId.get(args.sessionId);
  if (!session) return null;

  const pullAmount = Math.max(Math.min(args.amountUsdc, session.activeAllowance.availableNowUsdc), 0);
  if (pullAmount <= 0) return null;

  const at = new Date(args.atMs ?? Date.now());
  const event = {
    id: `${session.id}-pull-${at.getTime()}`,
    type: "pull" as const,
    at,
    amountUsdc: pullAmount,
    pullSettlement: args.pullSettlement,
    signature: args.signature,
  };

  const updated: GhostTabSession = {
    ...session,
    reserve: {
      ...session.reserve,
      remainingHiddenUsdc: Math.max(session.reserve.remainingHiddenUsdc - pullAmount, 0),
      usedUsdc: session.reserve.usedUsdc + pullAmount,
    },
    activeAllowance: {
      ...session.activeAllowance,
      availableNowUsdc: Math.max(session.activeAllowance.availableNowUsdc - pullAmount, 0),
    },
    eventTape: [...session.eventTape, event],
  };

  store.byId.set(session.id, updated);
  await persistStore(store);
  return { session: updated, event };
}
