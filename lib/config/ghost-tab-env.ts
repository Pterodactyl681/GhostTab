export type GhostTabRuntimeMode = "demo" | "live";
export type GhostTabRuntimeAdapter = "mock" | "magicblock";
export type GhostTabSolanaCluster = "devnet" | "testnet" | "mainnet-beta" | "localnet";
export type GhostTabRequestedModeSource = "explicit" | "legacy" | "auto" | "default";

export type GhostTabEnvConfig = {
  requestedMode: GhostTabRuntimeMode;
  requestedModeSource: GhostTabRequestedModeSource;
  effectiveMode: GhostTabRuntimeMode;
  adapter: GhostTabRuntimeAdapter;
  liveEnvReady: boolean;
  liveModeAvailable: boolean;
  routerEnvReady: boolean;
  privatePaymentsEnvReady: boolean;
  solanaCluster: GhostTabSolanaCluster;
  solanaDevnetRpcUrl: string;
  magicRouterDevnetUrl: string | null;
  privatePaymentsApiUrl: string | null;
  teeHook: string | null;
  perHook: string | null;
  missingLiveKeys: string[];
  blockingLiveReasons: string[];
};

const DEFAULT_SOLANA_DEVNET_RPC_URL = "https://api.devnet.solana.com";

function readCluster(): GhostTabSolanaCluster {
  const value = clean(process.env.NEXT_PUBLIC_SOLANA_CLUSTER)?.toLowerCase();
  if (value === "testnet") return "testnet";
  if (value === "mainnet-beta") return "mainnet-beta";
  if (value === "localnet") return "localnet";
  return "devnet";
}

function clean(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getGhostTabEnvConfig(): GhostTabEnvConfig {
  const solanaCluster = readCluster();
  const explicitMode = clean(process.env.NEXT_PUBLIC_GHOSTTAB_MODE)?.toLowerCase();
  const legacyAdapter = clean(process.env.NEXT_PUBLIC_GHOSTTAB_ADAPTER)?.toLowerCase();

  const solanaDevnetRpcUrl =
    clean(process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL) ??
    DEFAULT_SOLANA_DEVNET_RPC_URL;
  const magicRouterDevnetUrl = clean(process.env.NEXT_PUBLIC_MAGIC_ROUTER_DEVNET_URL);
  const privatePaymentsApiUrl = clean(
    process.env.NEXT_PUBLIC_MAGICBLOCK_PRIVATE_PAYMENTS_URL,
  );
  const routerEnvReady = Boolean(magicRouterDevnetUrl);
  const privatePaymentsEnvReady = Boolean(privatePaymentsApiUrl);
  const teeHook = clean(process.env.NEXT_PUBLIC_MAGICBLOCK_TEE_HOOK);
  const perHook = clean(process.env.NEXT_PUBLIC_MAGICBLOCK_PER_HOOK);

  const missingLiveKeys: string[] = [];
  if (!routerEnvReady) {
    missingLiveKeys.push("NEXT_PUBLIC_MAGIC_ROUTER_DEVNET_URL");
  }
  if (!privatePaymentsEnvReady) {
    missingLiveKeys.push("NEXT_PUBLIC_MAGICBLOCK_PRIVATE_PAYMENTS_URL");
  }

  const liveEnvReady = missingLiveKeys.length === 0;
  let requestedMode: GhostTabRuntimeMode = "demo";
  let requestedModeSource: GhostTabRequestedModeSource = "default";

  if (explicitMode === "live" || explicitMode === "demo") {
    requestedMode = explicitMode;
    requestedModeSource = "explicit";
  } else if (legacyAdapter === "magicblock" || legacyAdapter === "mock") {
    requestedMode = legacyAdapter === "magicblock" ? "live" : "demo";
    requestedModeSource = "legacy";
  } else if (liveEnvReady) {
    requestedMode = "live";
    requestedModeSource = "auto";
  }

  const canRunLive = requestedMode === "live" && liveEnvReady;
  const effectiveMode: GhostTabRuntimeMode = canRunLive ? "live" : "demo";
  const blockingLiveReasons: string[] = [];

  if (!liveEnvReady) {
    blockingLiveReasons.push(...missingLiveKeys.map((key) => `Missing env: ${key}`));
  }
  if (requestedMode === "demo" && liveEnvReady) {
    blockingLiveReasons.push("Mode override is forcing demo.");
  }

  return {
    requestedMode,
    requestedModeSource,
    effectiveMode,
    adapter: effectiveMode === "live" ? "magicblock" : "mock",
    liveEnvReady,
    liveModeAvailable: canRunLive,
    routerEnvReady,
    privatePaymentsEnvReady,
    solanaCluster,
    solanaDevnetRpcUrl,
    magicRouterDevnetUrl,
    privatePaymentsApiUrl,
    teeHook,
    perHook,
    missingLiveKeys,
    blockingLiveReasons,
  };
}
