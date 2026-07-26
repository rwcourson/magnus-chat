"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MagnusLogo } from "@/components/brand/MagnusLogo";
import type { MentionCandidate } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";

interface MentionPickerProps {
  open: boolean;
  candidates: MentionCandidate[];
  activeIndex: number;
  onActiveIndexChange: (i: number) => void;
  onSelect: (c: MentionCandidate) => void;
  /** Anchor: 'above' for bottom composers */
  placement?: "above" | "below";
  /** Horizontal alignment within the parent (thread uses center) */
  align?: "left" | "center" | "right";
  className?: string;
}

/**
 * Floating @ mention list — people avatars + Magnus mark.
 */
export function MentionPicker({
  open,
  candidates,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  placement = "above",
  align = "left",
  className,
}: MentionPickerProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(
      `[data-mention-index="${activeIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const shellAlign =
    align === "center"
      ? "left-0 right-0 flex justify-center"
      : align === "right"
        ? "right-0 flex justify-end"
        : "left-0 flex justify-start";

  return (
    <AnimatePresence>
      {open && candidates.length > 0 && (
        <div
          className={cn(
            "pointer-events-none absolute z-30",
            placement === "above" ? "bottom-full mb-2" : "top-full mt-2",
            shellAlign,
            // Inset so centered menu sits within the parent shell sides
            align === "center" && "px-0"
          )}
        >
          <motion.div
            key="mention-picker"
            role="listbox"
            aria-label="Mention someone"
            initial={{
              opacity: 0,
              y: placement === "above" ? 6 : -6,
              scale: 0.98,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: placement === "above" ? 4 : -4,
              scale: 0.98,
            }}
            transition={{ duration: 0.16, ease: easeSpring }}
            ref={listRef}
            className={cn(
              "pointer-events-auto w-[min(100%,280px)] overflow-hidden rounded-2xl",
              "border border-[var(--glass-border-soft)]",
              "bg-[var(--glass-strong-solid)] shadow-[var(--shadow-menu)]",
              className
            )}
            data-mention-picker
          >
            <div className="px-3 pb-1 pt-2">
              <p className="text-[10px] font-medium tracking-tight text-[var(--text-muted)]">
                People
              </p>
            </div>
            <ul className="scroll-thin max-h-[220px] space-y-0.5 overflow-y-auto px-1.5 pb-1.5">
              {candidates.map((c, i) => {
                const active = i === activeIndex;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      data-mention-index={i}
                      data-mention-id={c.id}
                      onMouseEnter={() => onActiveIndexChange(i)}
                      onMouseDown={(e) => {
                        // prevent textarea blur before select
                        e.preventDefault();
                        onSelect(c);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left",
                        "transition-colors duration-100",
                        active
                          ? "bg-[var(--select-fill)] text-[var(--select-text)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--hover-fill)]"
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--hover-fill-strong)] text-[10px] font-semibold text-[var(--text-muted)]">
                        {c.kind === "magnus" ? (
                          <MagnusLogo size={18} tone="sidebar" />
                        ) : c.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          c.initials
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-[var(--text-primary)]">
                          {c.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-[var(--text-muted)]">
                          @{c.handle}
                          {c.role ? ` · ${c.role}` : ""}
                        </span>
                      </span>
                      {c.kind === "magnus" && (
                        <span className="shrink-0 rounded bg-[var(--hover-fill-strong)] px-1.5 py-0.5 text-[9px] font-medium tracking-tight text-[var(--text-muted)]">
                          App
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
