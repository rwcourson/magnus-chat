"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, X } from "lucide-react";
import { Portal } from "@/components/ui/Portal";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

export type ToastTone = "default" | "success" | "danger";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
  action?: ToastAction;
}

interface ToastItem extends Required<Pick<ToastInput, "title">> {
  id: string;
  description?: string;
  tone: ToastTone;
  duration: number;
  action?: ToastAction;
}

interface ToastContextValue {
  toast: (input: ToastInput | string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function uid() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) {
      window.clearTimeout(t);
      timers.current.delete(id);
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput | string) => {
      const payload: ToastInput =
        typeof input === "string" ? { title: input } : input;
      const id = uid();
      const duration = payload.duration ?? (payload.action ? 6000 : 3200);
      const item: ToastItem = {
        id,
        title: payload.title,
        description: payload.description,
        tone: payload.tone ?? "default",
        duration,
        action: payload.action,
      };
      setItems((prev) => [...prev.slice(-3), item]);
      if (duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Portal>
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4"
          aria-live="polite"
          aria-relevant="additions"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18, ease: easeSpring }}
                className={cn(
                  "pointer-events-auto flex w-full max-w-[380px] items-start gap-2.5 rounded-2xl border px-3.5 py-3",
                  "bg-[var(--glass-strong-solid)] shadow-[var(--shadow-menu)] backdrop-blur-xl",
                  item.tone === "danger"
                    ? "border-[rgba(208,136,140,0.35)]"
                    : "border-[var(--glass-border)]"
                )}
                role="status"
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
                    item.tone === "success" &&
                      "bg-emerald-500/15 text-emerald-400",
                    item.tone === "danger" && "bg-[rgba(208,136,140,0.15)] text-[var(--danger)]",
                    item.tone === "default" &&
                      "bg-[var(--hover-fill)] text-[var(--text-secondary)]"
                  )}
                >
                  {item.tone === "success" ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                  ) : (
                    <Info className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="mt-0.5 text-[12px] leading-snug text-[var(--text-secondary)]">
                      {item.description}
                    </p>
                  )}
                </div>
                {item.action && (
                  <button
                    type="button"
                    onClick={() => {
                      item.action?.onClick();
                      dismiss(item.id);
                    }}
                    className={cn(
                      "shrink-0 rounded-lg px-2 py-1 text-[12px] font-semibold",
                      "text-[var(--text-primary)]",
                      "hover:bg-[var(--hover-fill)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                    )}
                  >
                    {item.action.label}
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => dismiss(item.id)}
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
                    "text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                  )}
                >
                  <X className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Portal>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
