import Link from "next/link";

import type { AppLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type GhostBrandProps = {
  locale: AppLocale;
  label: string;
  className?: string;
};

function GhostSigil({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.01 1.84c-3.58 0-6.33 2.88-6.33 6.53v3.99c0 1.86-.67 3.47-2 4.83-.23.24-.07.64.27.66 1.58.1 2.89-.52 3.94-1.85.4 1.49.04 2.95-1.07 4.4-.2.27.03.66.37.63 2.01-.21 3.55-1.08 4.62-2.6.43 1.39.09 2.78-1.01 4.17-.2.25.01.62.32.61 3.03-.1 5.18-1.79 6.45-5.06.74 1.05 1.8 1.66 3.17 1.84.35.05.58-.35.35-.62-1.23-1.47-1.84-3.08-1.84-4.84V8.37c0-3.65-2.75-6.53-6.24-6.53ZM9.12 7.4c.67 0 1.2.82 1.2 1.82s-.53 1.82-1.2 1.82c-.66 0-1.2-.82-1.2-1.82s.54-1.82 1.2-1.82Zm5.52 0c.67 0 1.2.82 1.2 1.82s-.53 1.82-1.2 1.82c-.66 0-1.2-.82-1.2-1.82s.54-1.82 1.2-1.82Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function GhostBrand({ locale, label, className }: GhostBrandProps) {
  return (
    <Link
      href={`/${locale}`}
      className={cn("group inline-flex items-center gap-3", className)}
      aria-label={label}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/[0.14] bg-surface-2/[0.8] text-ghost-cyan">
        <GhostSigil className="h-[18px] w-[18px]" />
      </span>
      <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-foreground transition-colors group-hover:text-ghost-cyan">
        {label}
      </span>
    </Link>
  );
}
