import { getGhostTabEnvConfig } from "@/lib/config/ghost-tab-env";
import { createMagicBlockGhostTabService } from "@/lib/services/adapters/magicblock-ghost-tab-service";
import { createMockGhostTabService } from "@/lib/services/adapters/mock-ghost-tab-service";
import type { GhostTabService } from "@/lib/services/ghost-tab-service";

let cachedService: GhostTabService | null = null;
let cachedKey = "";

function buildCacheKey() {
  const env = getGhostTabEnvConfig();
  return [
    env.effectiveMode,
    env.adapter,
    env.solanaCluster,
    env.magicRouterDevnetUrl ?? "",
    env.privatePaymentsApiUrl ?? "",
  ].join("|");
}

export function getGhostTabService(): GhostTabService {
  const key = buildCacheKey();
  if (cachedService && cachedKey === key) {
    return cachedService;
  }

  const adapter = getGhostTabEnvConfig().adapter;
  cachedService =
    adapter === "magicblock"
      ? createMagicBlockGhostTabService()
      : createMockGhostTabService();
  cachedKey = key;

  return cachedService;
}
