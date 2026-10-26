"use client";

import { useSyncExternalStore } from "react";
import { LuMoon, LuSun } from "react-icons/lu";
import { cn } from "@/lib/utils";

export type ThemeToggleLabels = {
  toLight: string;
  toDark: string;
};

export type ThemeToggleProps = {
  labels: ThemeToggleLabels;
  className?: string;
  showLabel?: boolean;
};

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle({ labels, className, showLabel = false }: ThemeToggleProps) {
  const isDark = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <div className={cn(
      showLabel
        ? "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm"
        : "inline-flex",
      className,
    )}>
      {showLabel ? <span className="flex items-center gap-3" aria-hidden="true">
        {isDark ? <LuMoon className="size-4" /> : <LuSun className="size-4" />}
        <span>{isDark ? "Mode Gelap" : "Mode Terang"}</span>
      </span> : null}
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        aria-label={isDark ? labels.toLight : labels.toDark}
        className={cn(
          showLabel
            ? "relative inline-flex h-5 w-10 items-center rounded-full p-0 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            : "inline-flex size-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          showLabel && (isDark ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"),
        )}
      >
        {showLabel ? <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform", isDark ? "translate-x-5" : "translate-x-0.5")} /> : isDark ? <LuSun className="size-5" aria-hidden /> : <LuMoon className="size-5" aria-hidden />}
      </button>
    </div>
  );
}
