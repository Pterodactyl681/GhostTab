export type SolanaPublicKeyLike = {
  toString(): string;
};

export type SolanaConnectResult = {
  publicKey?: SolanaPublicKeyLike;
};

export type SolanaWalletProvider = {
  isPhantom?: boolean;
  isBackpack?: boolean;
  isSolflare?: boolean;
  isGlow?: boolean;
  isMetaMask?: boolean;
  isConnected?: boolean;
  name?: string;
  walletName?: string;
  icon?: string;
  walletIcon?: string;
  publicKey?: SolanaPublicKeyLike | null;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<SolanaConnectResult | void>;
  disconnect?: () => Promise<void>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  off?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export type SolanaWalletId = string;

export type SolanaWalletDescriptor = {
  id: SolanaWalletId;
  name: string;
  icon?: string;
  provider: SolanaWalletProvider;
};

declare global {
  interface Window {
    solana?: SolanaWalletProvider;
    phantom?: { solana?: SolanaWalletProvider };
    backpack?: { solana?: SolanaWalletProvider };
    solflare?: SolanaWalletProvider;
    glowSolana?: SolanaWalletProvider;
    glow?: { solana?: SolanaWalletProvider };
    metamask?: { solana?: SolanaWalletProvider };
    ethereum?: {
      isMetaMask?: boolean;
      solana?: SolanaWalletProvider;
      providers?: Array<Record<string, unknown>>;
    } & Record<string, unknown>;
    trustwallet?: { solana?: SolanaWalletProvider };
    coinbaseWalletExtension?: { solana?: SolanaWalletProvider };
    coinbaseSolana?: SolanaWalletProvider;
    okxwallet?: { solana?: SolanaWalletProvider };
    exodus?: { solana?: SolanaWalletProvider };
    braveSolana?: SolanaWalletProvider;
    xnft?: { solana?: SolanaWalletProvider };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function isProvider(value: unknown): value is SolanaWalletProvider {
  return Boolean(
    isRecord(value) &&
      typeof (value as Record<string, unknown>).connect === "function",
  );
}

function providerLabel(provider: SolanaWalletProvider, fallback: string) {
  if (provider.isPhantom) return "Phantom";
  if (provider.isBackpack) return "Backpack";
  if (provider.isSolflare) return "Solflare";
  if (provider.isGlow) return "Glow";
  if (provider.isMetaMask) return "MetaMask (Solana)";
  if (typeof provider.walletName === "string" && provider.walletName.trim()) {
    return provider.walletName.trim();
  }
  if (typeof provider.name === "string" && provider.name.trim()) {
    return provider.name.trim();
  }
  return fallback;
}

function addWallet(
  items: SolanaWalletDescriptor[],
  dedupe: Set<SolanaWalletProvider>,
  id: SolanaWalletId,
  name: string,
  provider: SolanaWalletProvider | undefined,
) {
  if (!provider || !isProvider(provider) || dedupe.has(provider)) {
    return;
  }

  dedupe.add(provider);
  const iconCandidate =
    typeof provider.icon === "string" && provider.icon.trim()
      ? provider.icon.trim()
      : typeof provider.walletIcon === "string" && provider.walletIcon.trim()
        ? provider.walletIcon.trim()
        : undefined;

  items.push({
    id,
    name: providerLabel(provider, name),
    icon: iconCandidate,
    provider,
  });
}

function addEthereumSolanaWallets(
  win: Window,
  items: SolanaWalletDescriptor[],
  dedupe: Set<SolanaWalletProvider>,
) {
  const eth = win.ethereum;
  if (!eth || !isRecord(eth)) {
    return;
  }

  addWallet(items, dedupe, "metamask", "MetaMask (Solana)", eth.solana);

  if (Array.isArray(eth.providers)) {
    for (const item of eth.providers) {
      if (!isRecord(item)) continue;
      const maybeSolana = item.solana;
      if (isProvider(maybeSolana)) {
        const isMetaMaskProvider = Boolean(item.isMetaMask);
        addWallet(
          items,
          dedupe,
          isMetaMaskProvider ? "metamask" : "ethereum-solana",
          isMetaMaskProvider ? "MetaMask (Solana)" : "Detected Solana Wallet",
          maybeSolana,
        );
      }
    }
  }
}

export function detectSolanaWallets(win: Window): SolanaWalletDescriptor[] {
  const wallets: SolanaWalletDescriptor[] = [];
  const dedupe = new Set<SolanaWalletProvider>();

  addWallet(wallets, dedupe, "phantom", "Phantom", win.phantom?.solana);
  addWallet(wallets, dedupe, "backpack", "Backpack", win.backpack?.solana);
  addWallet(wallets, dedupe, "solflare", "Solflare", win.solflare);
  addWallet(wallets, dedupe, "glow", "Glow", win.glowSolana);
  addWallet(wallets, dedupe, "glow", "Glow", win.glow?.solana);
  addWallet(wallets, dedupe, "metamask", "MetaMask (Solana)", win.metamask?.solana);
  addWallet(wallets, dedupe, "trust-wallet", "Trust Wallet (Solana)", win.trustwallet?.solana);
  addWallet(
    wallets,
    dedupe,
    "coinbase-wallet",
    "Coinbase Wallet (Solana)",
    win.coinbaseWalletExtension?.solana,
  );
  addWallet(wallets, dedupe, "coinbase-wallet", "Coinbase Wallet (Solana)", win.coinbaseSolana);
  addWallet(wallets, dedupe, "okx-wallet", "OKX Wallet (Solana)", win.okxwallet?.solana);
  addWallet(wallets, dedupe, "exodus", "Exodus (Solana)", win.exodus?.solana);
  addWallet(wallets, dedupe, "brave-wallet", "Brave Wallet (Solana)", win.braveSolana);
  addWallet(wallets, dedupe, "xnft", "xNFT Wallet (Solana)", win.xnft?.solana);

  const injected = win.solana;
  if (injected) {
    if (injected.isPhantom) addWallet(wallets, dedupe, "phantom", "Phantom", injected);
    if (injected.isBackpack) addWallet(wallets, dedupe, "backpack", "Backpack", injected);
    if (injected.isSolflare) addWallet(wallets, dedupe, "solflare", "Solflare", injected);
    if (injected.isGlow) addWallet(wallets, dedupe, "glow", "Glow", injected);
    if (injected.isMetaMask) {
      addWallet(wallets, dedupe, "metamask", "MetaMask (Solana)", injected);
    }

    if (
      !injected.isPhantom &&
      !injected.isBackpack &&
      !injected.isSolflare &&
      !injected.isGlow &&
      !injected.isMetaMask
    ) {
      addWallet(wallets, dedupe, "detected-solana", "Detected Solana Wallet", injected);
    }
  }

  addEthereumSolanaWallets(win, wallets, dedupe);

  return wallets;
}

export async function connectWalletProvider(provider: SolanaWalletProvider) {
  try {
    return await provider.connect({ onlyIfTrusted: false });
  } catch {
    return provider.connect();
  }
}

export function resolvePublicKey(
  provider: SolanaWalletProvider,
  result: SolanaConnectResult | void,
) {
  const key = result?.publicKey ?? provider.publicKey;
  const value = key?.toString()?.trim();
  return value && value.length > 0 ? value : null;
}
