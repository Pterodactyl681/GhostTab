"use client";

import { useEffect, useMemo, useState } from "react";

import { useSolanaWallet } from "@/components/site/solana-wallet-provider";
import type { SolanaWalletId } from "@/lib/wallet/solana-wallet";

type WalletConnectButtonProps = {
  className?: string;
  emptyStateClassName?: string;
};

type WalletCatalogItem = {
  id: SolanaWalletId;
  name: string;
  installUrl: string;
  iconUrl: string;
};

type WalletViewModel = {
  id: SolanaWalletId;
  name: string;
  installUrl?: string;
  iconUrl?: string;
  fallbackLabel: string;
};

const WALLET_CATALOG: WalletCatalogItem[] = [
  {
    id: "phantom",
    name: "Phantom",
    installUrl: "https://phantom.app/download",
    iconUrl: "https://static.phantom.app/assets/mwa-logo.png",
  },
  {
    id: "solflare",
    name: "Solflare",
    installUrl: "https://solflare.com/download",
    iconUrl: "https://www.solflare.com/wp-content/uploads/2024/11/App-Icon.svg",
  },
  {
    id: "backpack",
    name: "Backpack",
    installUrl: "https://backpack.app/download",
    iconUrl: "https://backpack.app/app-logo-rounded.svg",
  },
  {
    id: "glow",
    name: "Glow",
    installUrl: "https://glow.app/",
    iconUrl: "https://glow.app/landing/app-icons/barney.png",
  },
  {
    id: "metamask",
    name: "MetaMask (Solana)",
    installUrl: "https://metamask.io/download/",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
  },
  {
    id: "trust-wallet",
    name: "Trust Wallet",
    installUrl: "https://trustwallet.com/download",
    iconUrl: "https://trustwallet.com/assets/images/media/assets/TWT.png",
  },
  {
    id: "coinbase-wallet",
    name: "Coinbase Wallet",
    installUrl: "https://www.coinbase.com/wallet/downloads",
    iconUrl: "https://avatars.githubusercontent.com/u/18060234?s=200&v=4",
  },
  {
    id: "okx-wallet",
    name: "OKX Wallet",
    installUrl: "https://www.okx.com/web3",
    iconUrl: "https://static.okx.com/cdn/assets/imgs/247/5D71AD307A4EC7D6.png",
  },
  {
    id: "exodus",
    name: "Exodus",
    installUrl: "https://www.exodus.com/download/",
    iconUrl: "https://www.exodus.com/img/exodus-symbol.svg",
  },
];

const POPULAR_INSTALL_ORDER = ["solflare", "backpack", "glow", "phantom", "metamask"];

function shortKey(value: string) {
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function fallbackLabel(name: string) {
  const words = name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) return "SW";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

function normalizedWalletName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function knownOrder(id: string) {
  const index = WALLET_CATALOG.findIndex((item) => item.id === id);
  return index >= 0 ? index : 999;
}

function installOrder(id: string) {
  const index = POPULAR_INSTALL_ORDER.findIndex((item) => item === id);
  return index >= 0 ? index : 999;
}

export function WalletConnectButton({
  className,
  emptyStateClassName,
}: WalletConnectButtonProps) {
  const {
    wallets,
    publicKey,
    connectedWalletName,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
  } =
    useSolanaWallet();
  const [open, setOpen] = useState(false);
  const [showMoreInstall, setShowMoreInstall] = useState(false);
  const [brokenIcons, setBrokenIcons] = useState<Record<string, true>>({});

  const catalogById = useMemo(() => {
    const map = new Map<SolanaWalletId, WalletCatalogItem>();
    for (const item of WALLET_CATALOG) map.set(item.id, item);
    return map;
  }, []);

  const installedWallets = useMemo<WalletViewModel[]>(() => {
    const mapped = wallets.map((wallet) => {
      const known = catalogById.get(wallet.id);
      return {
        id: wallet.id,
        name: wallet.name,
        installUrl: known?.installUrl,
        iconUrl: known?.iconUrl ?? wallet.icon,
        fallbackLabel: fallbackLabel(wallet.name),
      };
    });

    mapped.sort((a, b) => {
      const orderDiff = knownOrder(a.id) - knownOrder(b.id);
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });

    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    return mapped.filter((wallet) => {
      const idKey = wallet.id.toLowerCase();
      const nameKey = normalizedWalletName(wallet.name);
      if (seenIds.has(idKey) || seenNames.has(nameKey)) return false;
      seenIds.add(idKey);
      seenNames.add(nameKey);
      return true;
    });
  }, [catalogById, wallets]);

  const installedIds = useMemo(
    () => new Set(installedWallets.map((wallet) => wallet.id)),
    [installedWallets],
  );

  const installableWallets = useMemo(
    () =>
      WALLET_CATALOG.filter((wallet) => !installedIds.has(wallet.id)).sort((a, b) => {
        const orderDiff = installOrder(a.id) - installOrder(b.id);
        if (orderDiff !== 0) return orderDiff;
        return a.name.localeCompare(b.name);
      }),
    [installedIds],
  );

  const visibleInstallableWallets = useMemo(
    () => (showMoreInstall ? installableWallets : installableWallets.slice(0, 3)),
    [installableWallets, showMoreInstall],
  );

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setShowMoreInstall(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && publicKey) setOpen(false);
  }, [open, publicKey]);

  function markIconBroken(key: string) {
    setBrokenIcons((previous) => {
      if (previous[key]) return previous;
      return { ...previous, [key]: true };
    });
  }

  function connectFromModal(id: SolanaWalletId) {
    setOpen(false);
    void connectWallet(id);
  }

  function disconnectFromModal() {
    setOpen(false);
    void disconnectWallet();
  }

  function openInstall(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const buttonClass =
    className ??
    "inline-flex h-10 items-center justify-center rounded-md border border-border/[0.14] bg-surface-2/[0.62] px-3 text-sm text-foreground transition-colors hover:border-border-strong";

  const buttonLabel = publicKey
    ? `${connectedWalletName ?? "Wallet"} ${shortKey(publicKey)}`
    : isConnecting
      ? "Waiting wallet..."
      : "Connect wallet";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={isConnecting}
        className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {buttonLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close wallet dialog"
            className="absolute inset-0 bg-black/75"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-connect-title"
            className="relative mx-auto mt-[5vh] w-[min(94vw,25rem)] rounded-[11px] border border-[#1A223A] bg-[#090f20] px-6 pb-6 pt-6 shadow-[0_30px_120px_rgba(0,0,0,0.72)]"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close wallet dialog"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#111A30] text-[#7F8AA3] transition-colors hover:text-white"
            >
              <span className="text-[20px] leading-none">X</span>
            </button>

            <h3
              id="wallet-connect-title"
              className="max-w-[16rem] pr-10 text-[28px] font-semibold leading-[1.08] tracking-[-0.025em] text-[#f4f7ff]"
            >
              Connect a wallet on Solana to continue
            </h3>

            {publicKey ? (
              <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-[#1A2744] bg-[#0d162b] px-3 py-2">
                <p className="text-xs text-[#c8d3ea]">
                  {connectedWalletName ?? "Wallet"} {shortKey(publicKey)}
                </p>
                <button
                  type="button"
                  onClick={disconnectFromModal}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-[#2b385a] bg-[#121d35] px-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#d9e3fa] transition-colors hover:border-[#3a4e7d]"
                >
                  Disconnect
                </button>
              </div>
            ) : null}

            {installedWallets.length > 0 ? (
              <div className="mt-8 space-y-2">
                {installedWallets.map((wallet) => {
                  const iconKey = `installed:${wallet.id}`;
                  const showImage = Boolean(wallet.iconUrl) && !brokenIcons[iconKey];

                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => connectFromModal(wallet.id)}
                      className="flex h-12 w-full items-center gap-3 rounded-md px-1 text-left transition-colors hover:bg-[#111a2e]"
                    >
                      {showImage ? (
                        <img
                          src={wallet.iconUrl}
                          alt={wallet.name}
                          width={30}
                          height={30}
                          className="h-[30px] w-[30px] rounded-[8px] object-cover"
                          onError={() => markIconBroken(iconKey)}
                        />
                      ) : (
                        <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-[#1a2440] font-mono text-[10px] uppercase tracking-[0.1em] text-[#dbe6ff]">
                          {wallet.fallbackLabel}
                        </span>
                      )}
                      <span className="text-[22px] leading-none text-[#f1f4fa]">
                        {wallet.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                className={
                  emptyStateClassName ??
                  "mt-7 rounded-lg border border-[#1A2744] bg-[#0d162b] px-4 py-3"
                }
              >
                <p className="text-sm font-medium text-[#f1f4fa]">No supported wallet found</p>
                <p className="mt-1 text-xs text-[#9aa6c2]">
                  Install one of these Solana wallets to continue
                </p>
              </div>
            )}

            {installableWallets.length > 0 ? (
              <div className="mt-6 space-y-1.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6f7d9e]">
                  Install a wallet
                </p>
                {visibleInstallableWallets.map((wallet) => {
                  const iconKey = `install:${wallet.id}`;
                  const showImage = !brokenIcons[iconKey];

                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => openInstall(wallet.installUrl)}
                      className="flex h-10 w-full items-center justify-between rounded-md px-1.5 text-left transition-colors hover:bg-[#111a2e]"
                    >
                      <span className="inline-flex items-center gap-2.5">
                        {showImage ? (
                          <img
                            src={wallet.iconUrl}
                            alt={wallet.name}
                            width={24}
                            height={24}
                            className="h-6 w-6 rounded-[6px] object-cover"
                            onError={() => markIconBroken(iconKey)}
                          />
                        ) : (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#1a2440] font-mono text-[9px] uppercase tracking-[0.1em] text-[#dbe6ff]">
                            {fallbackLabel(wallet.name)}
                          </span>
                        )}
                        <span className="text-sm text-[#d6deef]">{wallet.name}</span>
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.11em] text-[#8e9ab6]">
                        Install
                      </span>
                    </button>
                  );
                })}
                {installableWallets.length > 3 ? (
                  <button
                    type="button"
                    onClick={() => setShowMoreInstall((value) => !value)}
                    className="mt-1 inline-flex h-9 w-full items-center justify-center rounded-md border border-[#223052] bg-[#0f1931] px-3 font-mono text-[10px] uppercase tracking-[0.11em] text-[#9aa8c4] transition-colors hover:border-[#2f4371] hover:text-[#d6e2ff]"
                  >
                    {showMoreInstall ? "Show less" : "Show more"}
                  </button>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-rose-300">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
