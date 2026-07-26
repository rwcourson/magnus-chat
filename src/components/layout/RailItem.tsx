"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Portal } from "@/components/ui/Portal";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/lib/motion";

/** Collapsed rail: every control is the same square hit target */
export const RAIL_HIT =
  "group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl";

const flySpring = springSnappy;

type AnchorBox = {
  midY: number;
  top: number;
  left: number;
  height: number;
};

function useAnchorBox(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>
) {
  const [box, setBox] = useState<AnchorBox | null>(null);

  const update = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const target =
      (el.firstElementChild as HTMLElement | null) &&
      (el.firstElementChild as HTMLElement).getBoundingClientRect
        ? (el.firstElementChild as HTMLElement)
        : el;
    const r = target.getBoundingClientRect();
    setBox({
      midY: r.top + r.height / 2,
      top: r.top,
      left: r.right + 8,
      height: r.height,
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) {
      setBox(null);
      return;
    }
    update();
    const raf = requestAnimationFrame(update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, update]);

  return box;
}

/** Active / hover row chrome — clear on dark/light sidebar */
export function SideRowBg({ active }: { active?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-xl transition-[background,box-shadow,transform] duration-150 ease-out",
        active
          ? "bg-[var(--select-fill)] shadow-[var(--select-shadow)] group-hover:bg-[var(--select-fill-hover)]"
          : "bg-transparent group-hover:bg-[var(--hover-fill-strong)]"
      )}
    />
  );
}

/**
 * Collapsed-rail flyout label — portals beside the trigger.
 * Vertically centered on the parent row.
 */
export function CollapsedFlyout({
  open,
  anchorRef,
  label,
  detail,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  label: string;
  detail?: string;
}) {
  const box = useAnchorBox(open, anchorRef);

  return (
    <Portal>
      <AnimatePresence>
        {open && box && (
          <motion.div
            key="flyout"
            initial={{ opacity: 0, x: -6, scale: 0.97, y: "-50%" }}
            animate={{ opacity: 1, x: 0, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, x: -4, scale: 0.98, y: "-50%" }}
            transition={flySpring}
            style={{
              position: "fixed",
              top: box.midY,
              left: box.left,
              zIndex: 80,
              transformOrigin: "left center",
            }}
            className="pointer-events-none"
          >
            <div
              className={cn(
                "glass-strong flex min-h-9 items-center rounded-xl px-3 py-2",
                "border border-[var(--glass-border)]",
                "shadow-[var(--shadow-menu)]",
                "[--text-primary:var(--sidebar-text-primary)]",
                "[--text-secondary:var(--sidebar-text-secondary)]",
                "[--text-muted:var(--sidebar-text-muted)]"
              )}
            >
              <div className="min-w-0">
                <p className="side-label whitespace-nowrap text-[var(--text-primary)]">
                  {label}
                </p>
                {detail && (
                  <p className="side-preview mt-0.5 max-w-[220px] truncate">
                    {detail}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/** Row wrapper that tracks hover for collapsed flyouts */
export function FlyoutRow({
  collapsed,
  label,
  detail,
  children,
  className,
}: {
  collapsed: boolean;
  label: string;
  detail?: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const show = collapsed && hover;

  return (
    <div
      ref={ref}
      className={cn(
        "relative",
        collapsed ? "flex w-full justify-center" : "w-full",
        className
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) setHover(false);
      }}
    >
      {children}
      <CollapsedFlyout
        open={show}
        anchorRef={ref}
        label={label}
        detail={detail}
      />
    </div>
  );
}

/**
 * Collapsed-rail icon control with consistent hover fill + optional flyout label.
 * Use for channels, magnus +, history, etc.
 */
export function RailIconButton({
  label,
  detail,
  active,
  onClick,
  className,
  children,
  title,
  showFlyout = true,
  "aria-label": ariaLabel,
  "data-conversation": dataConversation,
  "data-magnus-chat": dataMagnusChat,
  "data-magnus-history": dataMagnusHistory,
  buttonRef,
  onMouseEnter,
  onFocus,
}: {
  label: string;
  detail?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  title?: string;
  /** When false, still gets hover chrome but no portal label (e.g. history opens its own panel) */
  showFlyout?: boolean;
  "aria-label"?: string;
  "data-conversation"?: string;
  "data-magnus-chat"?: boolean;
  "data-magnus-history"?: boolean;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  onMouseEnter?: () => void;
  onFocus?: () => void;
}) {
  const button = (
    <button
      ref={buttonRef}
      type="button"
      title={title ?? label}
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      data-conversation={dataConversation}
      data-magnus-chat={dataMagnusChat ? true : undefined}
      data-magnus-history={dataMagnusHistory ? true : undefined}
      className={cn(
        RAIL_HIT,
        "outline-none transition-[color] duration-150 ease-out",
        "focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
        active
          ? "text-[var(--select-text)]"
          : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]",
        className
      )}
    >
      <SideRowBg active={active} />
      {/* Full hit-area layer so badges/icons position to the 36×36 rail tile */}
      <span className="relative z-10 flex h-full w-full items-center justify-center">
        {children}
      </span>
    </button>
  );

  if (!showFlyout) {
    return <div className="relative flex w-full justify-center">{button}</div>;
  }

  return (
    <FlyoutRow collapsed label={label} detail={detail}>
      {button}
    </FlyoutRow>
  );
}
