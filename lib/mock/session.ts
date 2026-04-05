export type SessionEventType = "open" | "crank" | "pull" | "expiry";

export type SessionSnapshot = {
  id: string;
  budgetUsd: number;
  reserveUsdc: number;
  activeAllowanceUsdc: number;
  refillUsdc: number;
  pulledUsdc: number;
  createdAt: Date;
  lastRefillAt: Date;
  lastPullAt: Date;
  nextCrankAt: Date;
  expiresAt: Date;
  eventLog: Array<{
    id: string;
    type: SessionEventType;
    amount?: number;
    at: Date;
  }>;
  withdrawals: Array<{
    id: string;
    amount: number;
    at: Date;
  }>;
};

export function getSessionSnapshot(): SessionSnapshot {
  const now = new Date();
  const createdAt = new Date(now.getTime() - 34 * 60 * 1000);
  const lastRefillAt = new Date(now.getTime() - 3 * 60 * 1000);
  const lastPullAt = new Date(now.getTime() - 9 * 60 * 1000);
  const nextCrankAt = new Date(now.getTime() + 2 * 60 * 1000 + 18 * 1000);
  const expiresAt = new Date(now.getTime() + 46 * 60 * 1000);

  return {
    id: "GT-07",
    budgetUsd: 480,
    reserveUsdc: 336.25,
    activeAllowanceUsdc: 18.75,
    refillUsdc: 6.25,
    pulledUsdc: 125,
    createdAt,
    lastRefillAt,
    lastPullAt,
    nextCrankAt,
    expiresAt,
    eventLog: [
      {
        id: "open-1",
        type: "open",
        at: createdAt,
      },
      {
        id: "crank-1",
        type: "crank",
        amount: 6.25,
        at: new Date(now.getTime() - 18 * 60 * 1000),
      },
      {
        id: "pull-1",
        type: "pull",
        amount: 11.75,
        at: lastPullAt,
      },
      {
        id: "crank-2",
        type: "crank",
        amount: 6.25,
        at: lastRefillAt,
      },
      {
        id: "expiry-1",
        type: "expiry",
        at: expiresAt,
      },
    ],
    withdrawals: [
      {
        id: "wd-1",
        amount: 11.75,
        at: new Date(now.getTime() - 9 * 60 * 1000),
      },
      {
        id: "wd-2",
        amount: 16.25,
        at: new Date(now.getTime() - 21 * 60 * 1000),
      },
      {
        id: "wd-3",
        amount: 9.5,
        at: new Date(now.getTime() - 29 * 60 * 1000),
      },
    ],
  };
}
