"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type SessionLiveRefreshProps = {
  enabled: boolean;
  intervalMs?: number;
};

export function SessionLiveRefresh({ enabled, intervalMs = 12000 }: SessionLiveRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [enabled, intervalMs, router]);

  return null;
}
