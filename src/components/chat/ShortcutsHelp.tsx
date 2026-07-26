"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { Portal } from "@/components/ui/Portal";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "⌘K", label: "Open command palette" },
  { keys: "⌘N", label: "New chat" },
  { keys: "⌘B", label: "Toggle sidebar" },
  { keys: "⌘.", label: "Toggle light / dark" },
  { keys: "⌘/", label: "Show keyboard shortcuts" },
  { keys: "?", label: "Show keyboard shortcuts" },
  { keys: "Esc", label: "Close menus and palettes" },
  { keys: "Enter", label: "Send message (composer)" },
  { keys: "⇧Enter", label: "New line in composer" },
  { keys: "/", label: "Slash commands in composer" },
];

interface ShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsHelp({ open, onClose }: ShortcutsHelpProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="help-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
              onClick={onClose}
              aria-hidden
            />
            <motion.div
              key="help-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Keyboard shortcuts"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: easeSpring }}
              className={cn(
                "fixed left-1/2 top-1/2 z-[160] w-[min(100%-1.5rem,420px)] -translate-x-1/2 -translate-y-1/2",
                "rounded-2xl border border-[var(--glass-border)]",
                "bg-[var(--glass-strong-solid)] shadow-[var(--shadow-menu)]"
              )}
            >
              <div className="flex items-center justify-between border-b border-[var(--glass-border-soft)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Keyboard
                    className="h-4 w-4 text-[var(--text-muted)]"
                    strokeWidth={ICON_STROKE}
                  />
                  <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">
                    Keyboard shortcuts
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" strokeWidth={ICON_STROKE} />
                </button>
              </div>
              <ul className="max-h-[min(60vh,420px)] space-y-1 overflow-y-auto p-3">
                {SHORTCUTS.map((s) => (
                  <li
                    key={s.keys + s.label}
                    className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2"
                  >
                    <span className="text-[13px] text-[var(--text-secondary)]">
                      {s.label}
                    </span>
                    <kbd className="shrink-0 rounded-md border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] px-2 py-1 text-[11px] font-medium tabular-nums text-[var(--text-primary)]">
                      {s.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}
