"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Paperclip,
  Blocks,
  Brain,
  Plug,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { useMenuPosition } from "@/hooks/useMenuPosition";

const menuEase = [0.22, 1, 0.36, 1] as const;
const HOVER_OPEN_MS = 60;
const HOVER_CLOSE_MS = 140;

interface AttachMenuProps {
  disabled?: boolean;
}

/**
 * Composer + menu — opens on hover (and click), like the voice control.
 */
export function AttachMenu({ disabled }: AttachMenuProps) {
  const [open, setOpen] = useState(false);
  const [memoryOn, setMemoryOn] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuElRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Always open upward (same as model selector). estimatedHeight ≈ real menu so
  // maxHeight fits when space is short on mobile instead of flipping below.
  const pos = useMenuPosition(open, triggerRef, "left", 10, 220, 280, "above");

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
    openTimer.current = window.setTimeout(() => setOpen(true), HOVER_OPEN_MS);
  };

  const scheduleClose = () => {
    clearTimers();
    closeTimer.current = window.setTimeout(() => setOpen(false), HOVER_CLOSE_MS);
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuElRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          // Demo: selection closes menu; real upload wiring lives with composer later
          e.target.value = "";
          setOpen(false);
        }}
      />

      {/* Trigger only — never grows layout; taller hit on phone */}
      <div
        className="relative h-9 w-9 shrink-0 sm:h-8 sm:w-8"
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
      >
        <motion.button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-label="Add"
          aria-expanded={open}
          aria-haspopup="menu"
          whileHover={disabled ? undefined : { scale: 1.04 }}
          whileTap={disabled ? undefined : { scale: 0.94 }}
          transition={{ type: "spring", stiffness: 520, damping: 40, mass: 0.65 }}
          onClick={() => {
            if (disabled) return;
            clearTimers();
            setOpen((o) => !o);
          }}
          onFocus={scheduleOpen}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full sm:h-8 sm:w-8",
            "text-[var(--text-secondary)]",
            "transition-colors duration-150",
            "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
            "outline-none",
            open && "bg-[var(--hover-fill-strong)] text-[var(--text-primary)]",
            disabled && "pointer-events-none opacity-40"
          )}
          data-attach-menu-trigger
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.26, ease: menuEase }}
            className="flex"
          >
            <Plus className="h-4 w-4" strokeWidth={1.4} />
          </motion.span>
        </motion.button>
      </div>

      <Portal>
        <AnimatePresence>
          {open && pos.ready && (
            <motion.div
              key="attach-menu"
              ref={menuElRef}
              role="menu"
              aria-label="Add options"
              initial={{
                opacity: 0,
                /* Always open upward — slide up into place */
                y: 10,
                scale: 0.96,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: 6,
                scale: 0.98,
              }}
              transition={{
                type: "spring",
                stiffness: 440,
                damping: 34,
                mass: 0.7,
              }}
              onMouseEnter={scheduleOpen}
              onMouseLeave={scheduleClose}
              className={cn(
                /* z above popup (90) + jump control so it isn’t clipped under panels */
                "fixed z-[130] w-[min(220px,calc(100vw-1.25rem))]",
                "overflow-y-auto overflow-x-hidden rounded-2xl py-1.5",
                "glass-strong border border-[var(--glass-border-soft)]",
                "shadow-[var(--shadow-menu)]",
                "scroll-thin"
              )}
              style={{
                top: pos.top ?? undefined,
                bottom: pos.bottom ?? undefined,
                left: pos.left,
                maxHeight: pos.maxHeight,
                transformOrigin: pos.transformOrigin,
              }}
              data-attach-menu
              data-attach-placement={pos.placement}
            >
              <MenuRow
                icon={Paperclip}
                label="Add files or photos"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                delay={0.02}
              />
              <MenuRow
                icon={Blocks}
                label="Agent Skills"
                chevron
                onClick={() => setOpen(false)}
                delay={0.04}
              />
              <MenuRow
                icon={Brain}
                label="Memory"
                delay={0.06}
                trailing={
                  <button
                    type="button"
                    role="switch"
                    aria-checked={memoryOn}
                    aria-label="Toggle memory"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemoryOn((v) => !v);
                    }}
                    className={cn(
                      "relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-250",
                      memoryOn
                        ? "bg-[var(--btn-primary-bg)]"
                        : "bg-[var(--hover-fill-strong)]"
                    )}
                  >
                    <motion.span
                      className="absolute top-[3px] h-4 w-4 rounded-full bg-white ring-1 ring-[var(--glass-border-soft)]"
                      animate={{ left: memoryOn ? 18 : 3 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 32,
                      }}
                    />
                  </button>
                }
              />
              <MenuRow
                icon={Plug}
                label="Connectors"
                chevron
                onClick={() => setOpen(false)}
                delay={0.08}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}

function MenuRow({
  icon: Icon,
  label,
  chevron,
  trailing,
  onClick,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  chevron?: boolean;
  trailing?: React.ReactNode;
  onClick?: () => void;
  delay?: number;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.22, ease: menuEase }}
    >
      <Comp
        type={onClick ? "button" : undefined}
        role="menuitem"
        onClick={onClick}
        className={cn(
          "group flex w-full items-center gap-2.5 px-3 py-2.5 text-left",
          "text-[13px] font-medium text-[var(--text-primary)]",
          "transition-colors duration-150",
          "hover:bg-[var(--hover-fill)]",
          onClick && "cursor-pointer"
        )}
      >
        <Icon
          className="h-4 w-4 shrink-0 text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]"
          strokeWidth={1.4}
        />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {trailing}
        {chevron && !trailing && (
          <ChevronRight
            className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-secondary)]"
            strokeWidth={1.4}
          />
        )}
      </Comp>
    </motion.div>
  );
}
