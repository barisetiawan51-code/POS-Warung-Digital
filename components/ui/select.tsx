import type { SelectHTMLAttributes } from "react";
import { LuChevronDown } from "react-icons/lu";
import { cn } from "@/lib/utils";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full cursor-pointer appearance-none rounded-xl border border-border/60 bg-background px-3.5 pr-10 text-sm text-foreground transition-all duration-200 ease-smooth focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <LuChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground/60"
      />
    </div>
  );
}
