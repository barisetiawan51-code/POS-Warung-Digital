import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  "neutral" | "primary" | "outline" | "success" | "warning" | "destructive";

const variantStyles: Record<BadgeVariant, string> = {
  neutral: "bg-muted text-foreground",
  primary: "bg-primary text-primary-foreground",
  outline: "border border-border bg-background text-foreground",
  success: "bg-success/15 text-success border border-success/30",
  warning: "bg-warning/15 text-warning border border-warning/30",
  destructive:
    "bg-destructive/15 text-destructive border border-destructive/30",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
