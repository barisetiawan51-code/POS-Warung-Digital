
"use client";

import { useEffect, useRef, useState } from "react";
import { LuCheck, LuChevronDown, LuSearch } from "react-icons/lu";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  group?: string;
}

export interface CustomSelectProps {
  id?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  leadingIcon?: React.ReactNode;
  searchable?: boolean;
  error?: boolean;
  className?: string;
  listClassName?: string;
  "aria-label"?: string;
}

export function CustomSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "Pilih…",
  leadingIcon,
  searchable = false,
  error = false,
  className,
  listClassName,
  "aria-label": ariaLabel,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = id ? `${id}-listbox` : undefined;

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (!open || !searchable) return;

    const frame = requestAnimationFrame(() => {
      searchRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open, searchable]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setQuery("");
    }

    if (
      (event.key === "Enter" || event.key === " ") &&
      !open
    ) {
      event.preventDefault();
      setOpen(true);
    }
  };

  const filtered = query.trim()
    ? options.filter((option) =>
        `${option.label} ${option.sublabel ?? ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : options;

  const groups: { key: string; items: SelectOption[] }[] = [];
  const groupMap = new Map<string, { key: string; items: SelectOption[] }>();

  for (const option of filtered) {
    const key = option.group ?? "__ungrouped__";

    if (!groupMap.has(key)) {
      const group = { key, items: [] as SelectOption[] };
      groupMap.set(key, group);
      groups.push(group);
    }

    groupMap.get(key)!.items.push(option);
  }

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setQuery("");
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
    >
      {/* Select trigger */}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        onKeyDown={handleKeyDown}
        onClick={() => setOpen((previous) => !previous)}
        className={cn(
          "group flex w-full items-center gap-2",
          "rounded-xl border bg-background px-3 py-2.5",
          "text-left text-sm text-foreground",
          "transition-all duration-200 ease-smooth",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring/25 focus-visible:ring-offset-1",
          "focus-visible:ring-offset-background",
          !error &&
            !open &&
            "border-border hover:border-ring/50 hover:bg-muted/30",
          open &&
            !error &&
            "border-primary ring-2 ring-ring/15 shadow-sm",
          error &&
            "border-destructive ring-2 ring-destructive/15",
        )}
      >
        {leadingIcon && (
          <span className="shrink-0 text-muted-foreground transition-colors group-hover:text-primary">
            {leadingIcon}
          </span>
        )}

        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !selected && "text-muted-foreground",
          )}
        >
          {selected ? selected.label : placeholder}
        </span>

        {selected?.sublabel && (
          <span className="hidden shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary sm:inline-block">
            {selected.sublabel.split("·")[0]?.trim()}
          </span>
        )}

        <LuChevronDown
          className={cn(
            "ml-1 size-4 shrink-0 text-muted-foreground",
            "transition-transform duration-200 ease-smooth",
            open && "rotate-180 text-primary",
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown panel */}
      <div
        id={listboxId}
        role="listbox"
        aria-label={ariaLabel}
        aria-hidden={!open}
        className={cn(
          "absolute z-50 mt-2 w-full overflow-hidden",
          "rounded-xl border border-border bg-background text-foreground",
          "shadow-lg shadow-foreground/5 ring-1 ring-foreground/5",
          "origin-top transition-all duration-200 ease-smooth",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0",
        )}
      >
        {/* Search input */}
        {searchable && (
          <div className="border-b border-border/70 px-3 pb-2 pt-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/10">
              <LuSearch
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />

              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari layanan…"
                aria-label="Cari pilihan"
                className="min-w-0 flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Options list */}
        <ul className={cn("scrollbar-thin max-h-72 overflow-y-auto overscroll-contain py-1.5", listClassName)}>
          {groups.length === 0 && (
            <li className="px-4 py-6 text-center text-xs text-muted-foreground">
              Tidak ada hasil ditemukan.
            </li>
          )}

          {groups.map(({ key, items }) => (
            <li key={key}>
              {key !== "__ungrouped__" && (
                <div className="sticky top-0 z-10 border-y border-border/40 bg-muted/90 px-4 py-2 backdrop-blur-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {key}
                  </span>
                </div>
              )}

              <ul>
                {items.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          "flex w-full items-center gap-3",
                          "px-3 py-2.5 text-left",
                          "transition-colors duration-150",
                          "focus-visible:outline-none focus-visible:bg-muted",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted/70",
                        )}
                      >
                        {option.icon && (
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm",
                              "transition-colors duration-150",
                              isSelected
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {option.icon}
                          </span>
                        )}

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium leading-snug">
                            {option.label}
                          </span>

                          {option.sublabel && (
                            <span
                              className={cn(
                                "mt-0.5 block truncate text-[11px] leading-tight",
                                isSelected
                                  ? "text-primary/80"
                                  : "text-muted-foreground",
                              )}
                            >
                              {option.sublabel}
                            </span>
                          )}
                        </span>

                        <LuCheck
                          className={cn(
                            "size-4 shrink-0",
                            isSelected
                              ? "text-primary opacity-100"
                              : "opacity-0",
                          )}
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
