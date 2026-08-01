"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";

/**
 * Shared search field for list/catalog surfaces (skills, routines, etc.).
 */
export function CatalogSearch({
  value,
  onChange,
  placeholder = "Search…",
  "aria-label": ariaLabel = "Search",
  className,
  inputClassName,
  autoFocus,
  "data-testid": dataTestId,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  "data-testid"?: string;
}) {
  return (
    <div className={cn("relative w-full", className)} data-catalog-search>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
        strokeWidth={ICON_STROKE}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        data-catalog-search-input
        data-testid={dataTestId}
        className={cn(
          "box-border h-10 w-full rounded-xl",
          "border border-[var(--glass-border-soft)] bg-[var(--glass-strong-solid)]",
          "py-0 pl-10 pr-3 text-[13.5px] font-medium leading-none",
          "text-[var(--text-primary)] placeholder:font-normal placeholder:text-[var(--text-muted)]",
          "shadow-[var(--shadow-sm)] outline-none",
          "transition-[border-color] duration-150",
          "hover:border-[var(--glass-border)] focus:border-[var(--glass-border)]",
          "focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
          inputClassName
        )}
      />
    </div>
  );
}

/** Case-insensitive substring match over joined string fields. */
export function matchesCatalogQuery(
  fields: (string | undefined | null)[],
  q: string
): boolean {
  if (!q) return true;
  const hay = fields
    .filter((f): f is string => Boolean(f && String(f).trim()))
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}
