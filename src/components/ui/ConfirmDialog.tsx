"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Portal } from "@/components/ui/Portal";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => confirmRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="confirm-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="fixed inset-0 z-[160] bg-black/50 backdrop-blur-sm"
              aria-hidden
              onClick={onCancel}
            />
            <motion.div
              key="confirm-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={description ? descId : undefined}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: easeSpring }}
              className={cn(
                "fixed left-1/2 top-1/2 z-[170] w-[min(100%-2rem,380px)] -translate-x-1/2 -translate-y-1/2",
                "rounded-2xl border border-[var(--glass-border)]",
                "bg-[var(--glass-strong-solid)] p-5 shadow-[var(--shadow-menu)]"
              )}
            >
              <h2
                id={titleId}
                className="text-[16px] font-semibold tracking-tight text-[var(--text-primary)]"
              >
                {title}
              </h2>
              {description && (
                <p
                  id={descId}
                  className="mt-2 text-[13.5px] leading-relaxed text-[var(--text-secondary)]"
                >
                  {description}
                </p>
              )}
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className={cn(
                    "rounded-xl px-3.5 py-2 text-[13px] font-medium",
                    "text-[var(--text-secondary)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                  )}
                >
                  {cancelLabel}
                </button>
                <button
                  ref={confirmRef}
                  type="button"
                  onClick={onConfirm}
                  className={cn(
                    "rounded-xl px-3.5 py-2 text-[13px] font-semibold",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
                    danger
                      ? "bg-[#c45c5c] text-white hover:bg-[#b04f4f]"
                      : "btn-solid"
                  )}
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}
