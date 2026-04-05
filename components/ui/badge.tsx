import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
  {
    variants: {
      variant: {
        default: "border-border/[0.12] bg-surface-2/[0.72] text-secondary",
        cyan: "border-ghost-cyan/[0.24] bg-ghost-cyan/[0.12] text-ghost-cyan",
        purple: "border-violet-smoke/[0.24] bg-violet-smoke/[0.12] text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
