"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  connectWalletProvider,
  detectSolanaWallets,
  resolvePublicKey,
  type SolanaWalletDescriptor,
  type SolanaWalletProvider,
} from "@/lib/wallet/solana-wallet";

const WALLET_DISCONNECT_LOCK_KEY = "ghosttab_wallet_disconnect_lock";

type SolanaWalletContextValue = {
  wallets: SolanaWalletDescriptor[];
  publicKey: string | null;
  connectedWalletName: string | null;
  isConnecting: boolean;
  error: string | null;
  refreshWallets(): void;
  connectWallet(id: SolanaWalletDescriptor["id"]): Promise<void>;
  disconnectWallet(): Promise<void>;
};

const SolanaWalletContext = createContext<SolanaWalletContextValue | null>(null);

function readDisconnectLock() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(WALLET_DISCONNECT_LOCK_KEY) === "1";
}

function writeDisconnectLock(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(WALLET_DISCONNECT_LOCK_KEY, "1");
    return;
  }
  window.localStorage.removeItem(WALLET_DISCONNECT_LOCK_KEY);
}

function walletNameFromProvider(provider: SolanaWalletProvider): string | null {
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
  return null;
}

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<SolanaWalletDescriptor[]>([]);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connectedWalletName, setConnectedWalletName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refreshWallets() {
    if (typeof window === "undefined") {
      setWallets([]);
      return;
    }

    const detected = detectSolanaWallets(window);
    setWallets(detected);

    if (readDisconnectLock()) {
      setPublicKey(null);
      setConnectedWalletName(null);
      return;
    }

    const active = detected.find((item) => item.provider.publicKey?.toString());
    if (active) {
      setPublicKey(active.provider.publicKey?.toString() ?? null);
      setConnectedWalletName(active.name);
    }
  }

  useEffect(() => {
    refreshWallets();
    const timer = window.setInterval(refreshWallets, 1500);
    return () => {
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connectWallet(id: SolanaWalletDescriptor["id"]) {
    const target = wallets.find((wallet) => wallet.id === id);
    if (!target) {
      setError("No supported wallet found.");
      return;
    }

    setIsConnecting(true);
    setError(null);
    writeDisconnectLock(false);
    try {
      const result = await connectWalletProvider(target.provider);
      const key = resolvePublicKey(target.provider, result);
      if (!key) {
        setError("Wallet connected, but public key is unavailable.");
        return;
      }
      setPublicKey(key);
      setConnectedWalletName(target.name);
    } catch (connectError) {
      const message =
        connectError instanceof Error ? connectError.message : "Wallet connection failed.";
      setError(message);
    } finally {
      setIsConnecting(false);
      refreshWallets();
    }
  }

  async function disconnectWallet() {
    const target =
      wallets.find((wallet) => wallet.name === connectedWalletName) ??
      wallets.find((wallet) => wallet.provider.publicKey?.toString() === publicKey);

    if (target?.provider.disconnect) {
      try {
        await target.provider.disconnect();
      } catch {
        // ignore disconnect failures, we still clear local state
      }
    }

    setPublicKey(null);
    setConnectedWalletName(null);
    setError(null);
    writeDisconnectLock(true);
    refreshWallets();
  }

  useEffect(() => {
    if (typeof window === "undefined" || !window.solana?.on) {
      return;
    }

    function onDisconnect() {
      setPublicKey(null);
      setConnectedWalletName(null);
    }

    function onAccountChanged(nextKey: unknown) {
      if (readDisconnectLock()) {
        setPublicKey(null);
        setConnectedWalletName(null);
        return;
      }
      if (
        nextKey &&
        typeof nextKey === "object" &&
        "toString" in (nextKey as Record<string, unknown>)
      ) {
        const key = (nextKey as { toString(): string }).toString();
        setPublicKey(key);
        setConnectedWalletName(walletNameFromProvider(window.solana!) ?? connectedWalletName);
      } else {
        setPublicKey(null);
      }
    }

    window.solana.on?.("disconnect", onDisconnect);
    window.solana.on?.("accountChanged", onAccountChanged);
    return () => {
      window.solana?.off?.("disconnect", onDisconnect);
      window.solana?.off?.("accountChanged", onAccountChanged);
    };
  }, [connectedWalletName]);

  const value = useMemo<SolanaWalletContextValue>(
    () => ({
      wallets,
      publicKey,
      connectedWalletName,
      isConnecting,
      error,
      refreshWallets,
      connectWallet,
      disconnectWallet,
    }),
    [wallets, publicKey, connectedWalletName, isConnecting, error],
  );

  return <SolanaWalletContext.Provider value={value}>{children}</SolanaWalletContext.Provider>;
}

export function useSolanaWallet() {
  const value = useContext(SolanaWalletContext);
  if (!value) {
    throw new Error("useSolanaWallet must be used within SolanaWalletProvider");
  }
  return value;
}
