import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md border border-border/[0.14] font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ghost-cyan/[0.55] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default:
          "border-ghost-cyan/[0.28] bg-ghost-cyan/[0.12] text-ghost-cyan hover:bg-ghost-cyan/[0.18]",
        secondary:
          "bg-surface-2/[0.72] text-foreground hover:bg-surface-2/[0.92]",
        ghost:
          "border-border/10 bg-transparent text-secondary hover:bg-surface-2/[0.55] hover:text-foreground",
      },
      size: {
        default: "h-10 px-4 text-sm tracking-[-0.01em]",
        sm: "h-8 px-3 font-mono text-[10px] uppercase tracking-[0.14em]",
        lg: "h-11 px-5 text-sm tracking-[-0.01em]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
