"use client";

import { useEffect, useRef, useState } from "react";

import { CreateLiveControls } from "@/components/site/create-live-controls";
import type { AppLocale } from "@/lib/i18n/config";

type MintOption = {
  value: string;
  label: string;
};

type CreateTabDefaults = {
  tabName: string;
  recipient: string;
  mint: string;
  reserveUsdc: number;
  refillAmountUsdc: number;
  refillIntervalMinutes: number;
  sessionDurationMinutes: number;
  maxPullUsdc: number;
};

type CreateTabComposerProps = {
  locale: AppLocale;
  defaults: CreateTabDefaults;
  labels: {
    submit: string;
    fields: {
      tabName: string;
      recipient: string;
      reserve: string;
      refillAmount: string;
      refillInterval: string;
      sessionDuration: string;
      maxPull: string;
    };
    preview: {
      title: string;
      nextRefill: string;
      expiry: string;
    };
  };
};

const MINT_OPTIONS: MintOption[] = [
  {
    value: "USDC_DEVNET",
    label: "USDC",
  },
  {
    value: "SOL",
    label: "SOL",
  },
];

const MINT_PROFILES: Record<
  string,
  Pick<CreateTabDefaults, "reserveUsdc" | "refillAmountUsdc" | "maxPullUsdc">
> = {
  USDC_DEVNET: {
    reserveUsdc: 64,
    refillAmountUsdc: 6.25,
    maxPullUsdc: 8,
  },
  SOL: {
    reserveUsdc: 1.5,
    refillAmountUsdc: 0.15,
    maxPullUsdc: 0.25,
  },
};

export function CreateTabComposer({ locale, defaults, labels }: CreateTabComposerProps) {
  const [mintMenuOpen, setMintMenuOpen] = useState(false);
  const mintMenuRef = useRef<HTMLDivElement | null>(null);

  const [mint, setMint] = useState(defaults.mint);
  const [tabName, setTabName] = useState(defaults.tabName);
  const [recipient, setRecipient] = useState(defaults.recipient);
  const [reserveUsdc, setReserveUsdc] = useState(String(defaults.reserveUsdc));
  const [refillAmountUsdc, setRefillAmountUsdc] = useState(String(defaults.refillAmountUsdc));
  const [refillIntervalMinutes, setRefillIntervalMinutes] = useState(
    String(defaults.refillIntervalMinutes),
  );
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(
    String(defaults.sessionDurationMinutes),
  );
  const [maxPullUsdc, setMaxPullUsdc] = useState(String(defaults.maxPullUsdc));

  const selectedMint =
    MINT_OPTIONS.find((option) => option.value === mint) ?? MINT_OPTIONS[0];

  useEffect(() => {
    function onWindowClick(event: MouseEvent) {
      if (!mintMenuRef.current) return;
      const target = event.target as Node | null;
      if (target && !mintMenuRef.current.contains(target)) {
        setMintMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", onWindowClick);
    return () => {
      window.removeEventListener("mousedown", onWindowClick);
    };
  }, []);

  function applyMintProfile(nextMint: string) {
    const profile = MINT_PROFILES[nextMint];
    if (!profile) return;

    setReserveUsdc(String(profile.reserveUsdc));
    setRefillAmountUsdc(String(profile.refillAmountUsdc));
    setMaxPullUsdc(String(profile.maxPullUsdc));
  }

  function chooseMint(nextMint: string) {
    setMint(nextMint);
    setMintMenuOpen(false);
    applyMintProfile(nextMint);
  }

  return (
    <div className="surface-panel p-5 md:p-6">
      <form id="create-tab-form" autoComplete="off" className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2">
          <span className="ui-label">{labels.fields.tabName}</span>
          <input
            name="tabName"
            value={tabName}
            onChange={(event) => setTabName(event.target.value)}
            autoComplete="off"
            className="h-10 w-full rounded-md border border-border/[0.14] bg-surface-2/[0.62] px-3 text-sm text-foreground outline-none focus:border-ghost-cyan/[0.4]"
          />
        </label>

        <label className="space-y-2">
          <span className="ui-label">{labels.fields.recipient}</span>
          <input
            name="recipient"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            autoComplete="off"
            className="h-10 w-full rounded-md border border-border/[0.14] bg-surface-2/[0.62] px-3 text-sm text-foreground outline-none focus:border-ghost-cyan/[0.4]"
          />
        </label>

        <label className="space-y-2">
          <span className="ui-label">Mint</span>
          <div className="relative" ref={mintMenuRef}>
            <button
              type="button"
              onClick={() => setMintMenuOpen((value) => !value)}
              className="inline-flex h-10 w-full items-center justify-between rounded-md border border-border/[0.14] bg-surface-2/[0.62] px-3 text-sm text-foreground transition-colors hover:border-border-strong"
            >
              <span>{selectedMint.label}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-secondary">
                Select
              </span>
            </button>
            {mintMenuOpen ? (
              <div className="absolute right-0 z-20 mt-2 min-w-full rounded-md border border-border/[0.12] bg-background-elevated/[0.98] p-1 shadow-panel">
                {MINT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => chooseMint(option.value)}
                    className={`block w-full rounded-sm px-2.5 py-1.5 text-left font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                      option.value === mint
                        ? "text-ghost-cyan"
                        : "text-secondary hover:bg-surface-2/[0.8] hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <input type="hidden" name="mint" value={mint} />
        </label>

        <label className="space-y-2">
          <span className="ui-label">{labels.fields.reserve}</span>
          <input
            name="reserveUsdc"
            value={reserveUsdc}
            onChange={(event) => setReserveUsdc(event.target.value)}
            autoComplete="off"
            className="h-10 w-full rounded-md border border-border/[0.14] bg-surface-2/[0.62] px-3 text-sm text-foreground outline-none focus:border-ghost-cyan/[0.4]"
          />
        </label>
        <label className="space-y-2">
          <span className="ui-label">{labels.fields.refillAmount}</span>
          <input
            name="refillAmountUsdc"
            value={refillAmountUsdc}
            onChange={(event) => setRefillAmountUsdc(event.target.value)}
            autoComplete="off"
            className="h-10 w-full rounded-md border border-border/[0.14] bg-surface-2/[0.62] px-3 text-sm text-foreground outline-none focus:border-ghost-cyan/[0.4]"
          />
        </label>
        <label className="space-y-2">
          <span className="ui-label">{labels.fields.refillInterval}</span>
          <input
            name="refillIntervalMinutes"
            value={refillIntervalMinutes}
            onChange={(event) => setRefillIntervalMinutes(event.target.value)}
            autoComplete="off"
            className="h-10 w-full rounded-md border border-border/[0.14] bg-surface-2/[0.62] px-3 text-sm text-foreground outline-none focus:border-ghost-cyan/[0.4]"
          />
        </label>
        <label className="space-y-2">
          <span className="ui-label">{labels.fields.sessionDuration}</span>
          <input
            name="sessionDurationMinutes"
            value={sessionDurationMinutes}
            onChange={(event) => setSessionDurationMinutes(event.target.value)}
            autoComplete="off"
            className="h-10 w-full rounded-md border border-border/[0.14] bg-surface-2/[0.62] px-3 text-sm text-foreground outline-none focus:border-ghost-cyan/[0.4]"
          />
        </label>
        <label className="space-y-2">
          <span className="ui-label">{labels.fields.maxPull}</span>
          <input
            name="maxPullUsdc"
            value={maxPullUsdc}
            onChange={(event) => setMaxPullUsdc(event.target.value)}
            autoComplete="off"
            className="h-10 w-full rounded-md border border-border/[0.14] bg-surface-2/[0.62] px-3 text-sm text-foreground outline-none focus:border-ghost-cyan/[0.4]"
          />
        </label>
      </form>

      <div className="mt-4">
        <CreateLiveControls locale={locale} formId="create-tab-form" submitLabel={labels.submit} />
      </div>
    </div>
  );
}
