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

export function ThemeToggle({ labels, className }: ThemeToggleProps) {
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
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? labels.toLight : labels.toDark}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
    >
      {isDark ? (
        <LuSun className="size-5" aria-hidden />
      ) : (
        <LuMoon className="size-5" aria-hidden />
      )}
    </button>
  );
}
