import { getGhostTabEnvConfig } from "@/lib/config/ghost-tab-env";
import type { MagicBlockPaymentsClient } from "@/lib/domain/magicblock-payments";
import { createMagicBlockPaymentsClient } from "@/lib/services/magicblock/private-payments-client";
import { createMockMagicBlockPaymentsClient } from "@/lib/services/magicblock/private-payments-mock-client";

let cachedClient: MagicBlockPaymentsClient | null = null;
let cachedKey = "";

function buildCacheKey() {
  const env = getGhostTabEnvConfig();
  return [
    env.effectiveMode,
    env.solanaCluster,
    env.privatePaymentsApiUrl ?? "",
    env.magicRouterDevnetUrl ?? "",
  ].join("|");
}

export function getMagicBlockPaymentsClient(): MagicBlockPaymentsClient {
  const env = getGhostTabEnvConfig();
  const key = buildCacheKey();

  if (cachedClient && cachedKey === key) {
    return cachedClient;
  }

  if (env.effectiveMode !== "live" || !env.privatePaymentsApiUrl) {
    cachedClient = createMockMagicBlockPaymentsClient();
    cachedKey = key;
    return cachedClient;
  }

  cachedClient = createMagicBlockPaymentsClient({
    baseUrl: env.privatePaymentsApiUrl,
    fallbackBaseUrl: env.magicRouterDevnetUrl ?? undefined,
    cluster: env.solanaCluster,
  });
  cachedKey = key;
  return cachedClient;
}
