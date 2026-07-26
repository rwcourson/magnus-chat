"use client";

import {
  useCallback,
  useLayoutEffect,
  useState,
  type RefObject,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Globe,
  FileText,
  ImageIcon,
  Code2,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { SlashCommand } from "@/lib/commands";
import { Portal } from "@/components/ui/Portal";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";

const iconMap: Record<SlashCommand["icon"], LucideIcon> = {
  search: Search,
  web: Globe,
  file: FileText,
  image: ImageIcon,
  code: Code2,
  help: HelpCircle,
};

const EDGE = 10;
const GAP = 8;

interface CommandPaletteProps {
  open: boolean;
  commands: SlashCommand[];
  activeIndex: number;
  onSelect: (cmd: SlashCommand) => void;
  onHover: (index: number) => void;
  /** Composer shell — palette is portaled and aligned to this box */
  anchorRef: RefObject<HTMLElement | null>;
}

type PalettePos = {
  top: number | null;
  bottom: number | null;
  left: number;
  width: number;
  maxHeight: number;
  placement: "above" | "below";
  ready: boolean;
};

/**
 * Slash-command menu — fixed + portaled so parent overflow never clips it.
 */
export function CommandPalette({
  open,
  commands,
  activeIndex,
  onSelect,
  onHover,
  anchorRef,
}: CommandPaletteProps) {
  const [pos, setPos] = useState<PalettePos>({
    top: null,
    bottom: null,
    left: 0,
    width: 320,
    maxHeight: 320,
    placement: "above",
    ready: false,
  });

  const update = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(rect.width, vw - EDGE * 2);
    const left = Math.max(
      EDGE,
      Math.min(rect.left, vw - width - EDGE)
    );

    // Header ~36 + row ~56 each
    const estimated = Math.min(400, 40 + commands.length * 58 + 12);
    const spaceAbove = Math.max(0, rect.top - GAP - EDGE);
    const spaceBelow = Math.max(0, vh - rect.bottom - GAP - EDGE);

    let placement: "above" | "below";
    if (spaceAbove >= estimated || spaceAbove >= spaceBelow) {
      placement = "above";
    } else {
      placement = "below";
    }

    const available = placement === "above" ? spaceAbove : spaceBelow;
    // Never exceed available space (mobile: short viewport above composer)
    const maxHeight = Math.max(
      Math.min(72, available || 72),
      Math.min(estimated, available)
    );

    if (placement === "above") {
      setPos({
        top: null,
        bottom: vh - rect.top + GAP,
        left,
        width,
        maxHeight,
        placement,
        ready: true,
      });
    } else {
      setPos({
        top: rect.bottom + GAP,
        bottom: null,
        left,
        width,
        maxHeight,
        placement,
        ready: true,
      });
    }
  }, [anchorRef, commands.length]);

  useLayoutEffect(() => {
    if (!open || commands.length === 0) {
      setPos((p) => ({ ...p, ready: false }));
      return;
    }
    update();
    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, commands.length, update]);

  return (
    <Portal>
      <AnimatePresence>
        {open && commands.length > 0 && pos.ready && (
          <motion.div
            initial={{
              opacity: 0,
              y: pos.placement === "above" ? 10 : -10,
              scale: 0.98,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: pos.placement === "above" ? 8 : -8,
              scale: 0.98,
            }}
            transition={{ duration: 0.22, ease: easeSpring }}
            style={{
              position: "fixed",
              top: pos.top ?? undefined,
              bottom: pos.bottom ?? undefined,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
              zIndex: 130,
              transformOrigin:
                pos.placement === "above" ? "bottom center" : "top center",
            }}
            className="pointer-events-auto"
            data-command-palette
          >
            <div
              className={cn(
                "glass-strong flex max-h-[inherit] flex-col overflow-hidden rounded-2xl py-1.5",
                "border border-[var(--glass-border)] shadow-[var(--shadow-menu)]"
              )}
            >
              <div className="shrink-0 px-3 pb-1.5 pt-1">
                <p className="text-[10px] font-medium tracking-tight text-[var(--text-muted)]">
                  Commands
                </p>
              </div>
              <ul className="scroll-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                {commands.map((cmd, i) => {
                  const Icon = iconMap[cmd.icon];
                  const active = i === activeIndex;
                  return (
                    <motion.li
                      key={cmd.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: Math.min(i * 0.025, 0.1),
                        duration: 0.22,
                        ease: easeSpring,
                      }}
                    >
                      <button
                        type="button"
                        onMouseEnter={() => onHover(i)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onSelect(cmd);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150",
                          active
                            ? "bg-[var(--select-fill)] text-[var(--select-text)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border-soft)]",
                            active
                              ? "bg-[var(--hover-fill-strong)]"
                              : "bg-[var(--hover-fill)]"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.4} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-2">
                            <span className="text-[13px] font-medium text-[var(--text-primary)]">
                              {cmd.command}
                            </span>
                            <span className="truncate text-[12px] text-[var(--text-muted)]">
                              {cmd.label}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-[11.5px] text-[var(--text-muted)]">
                            {cmd.description}
                          </span>
                        </span>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
