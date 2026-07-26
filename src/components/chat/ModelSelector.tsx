"use client";

import { useEffect, useId, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";
import { Portal } from "@/components/ui/Portal";
import { useMenuPosition } from "@/hooks/useMenuPosition";

export const recentModels = [
  { id: "auto", name: "Auto", description: "Best for most tasks" },
  { id: "magnus-pro", name: "Magnus Pro", description: "Used recently" },
  { id: "magnus-fast", name: "Magnus Fast", description: "Used 2 days ago" },
  { id: "bg-research", name: "B&G Research", description: "Used last week" },
  { id: "site-assist", name: "Site Assist", description: "Used last week" },
] as const;

export type ModelId = (typeof recentModels)[number]["id"];

const MENU_W = 248;
const MENU_H = 300;
const GAP = 10;
const HOVER_OPEN_MS = 60;
const HOVER_CLOSE_MS = 140;

interface ModelSelectorProps {
  value: ModelId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (id: ModelId) => void;
  disabled?: boolean;
}

/**
 * Model picker — hover (and click) to open; prefers opening above the trigger.
 */
export function ModelSelector({
  value,
  open,
  onOpenChange,
  onChange,
  disabled,
}: ModelSelectorProps) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const selected = recentModels.find((m) => m.id === value) ?? recentModels[0];
  // Always open upward — match attach (+) menu / bottom composer UX
  const pos = useMenuPosition(open, triggerRef, "right", GAP, MENU_W, MENU_H, "above");

  const clearTimers = () => {
    if (openTimer.current != null) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleOpen = () => {
    if (disabled) return;
    clearTimers();
    openTimer.current = window.setTimeout(
      () => onOpenChange(true),
      HOVER_OPEN_MS
    );
  };

  const scheduleClose = () => {
    clearTimers();
    closeTimer.current = window.setTimeout(
      () => onOpenChange(false),
      HOVER_CLOSE_MS
    );
  };

  useEffect(() => () => clearTimers(), []);

  // Escape + outside click
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
        triggerRef.current?.focus();
      }
    };

    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      onOpenChange(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, onOpenChange]);

  const toggle = () => {
    if (disabled) return;
    clearTimers();
    onOpenChange(!open);
  };

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label="Select model"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        onFocus={scheduleOpen}
        className={cn(
          "group flex h-9 items-center gap-1 rounded-full pl-2.5 pr-2",
          "border-0 outline-none bg-transparent",
          "text-[12.5px] font-medium tracking-[-0.01em]",
          "text-[var(--text-secondary)]",
          "transition-[background,color,transform] duration-150 ease-out",
          "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
          "active:scale-[0.98]",
          open && "bg-[var(--select-fill)] text-[var(--select-text)]",
          disabled && "pointer-events-none opacity-40"
        )}
        data-model-selector-trigger
      >
        <span className="block min-w-0 max-w-[7.25rem] truncate">
          {selected.name}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] opacity-70 transition-transform duration-200",
            open && pos.placement === "above" && "rotate-180 opacity-100",
            open && pos.placement === "below" && "opacity-100"
          )}
          strokeWidth={ICON_STROKE}
        />
      </button>

      <Portal>
        {open && pos.ready && (
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label="Recent models"
            data-model-selector-menu
            onMouseEnter={scheduleOpen}
            onMouseLeave={scheduleClose}
            className={cn(
              "fixed z-[130] w-[min(248px,calc(100vw-1.25rem))]",
              "flex flex-col overflow-hidden rounded-2xl",
              "border border-[var(--glass-border)]",
              "bg-[var(--glass-strong-solid)]",
              "shadow-[var(--shadow-menu)]"
            )}
            style={{
              top: pos.top ?? undefined,
              bottom: pos.bottom ?? undefined,
              left: pos.left,
              maxHeight: pos.maxHeight,
              transformOrigin: pos.transformOrigin,
            }}
          >
            <div className="shrink-0 px-3 pb-1.5 pt-2">
              <p className="text-[10px] font-medium tracking-tight text-[var(--text-muted)]">
                Recent
              </p>
            </div>
            <ul className="scroll-thin min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-1 pb-1.5">
              {recentModels.map((m) => {
                const active = m.id === value;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onChange(m.id);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left",
                        "transition-colors duration-150",
                        active
                          ? "bg-[var(--select-fill)] text-[var(--select-text)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium leading-snug text-[var(--text-primary)]">
                          {m.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] leading-snug text-[var(--text-muted)]">
                          {m.description}
                        </span>
                      </span>
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {active && (
                          <Check
                            className="h-3.5 w-3.5 text-[var(--text-primary)] opacity-80"
                            strokeWidth={ICON_STROKE}
                          />
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Portal>
    </div>
  );
}
