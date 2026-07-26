"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion } from "framer-motion";
import { AudioLines, Mic, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";

export type VoiceAction = "dictation" | "voice";

interface VoiceActionButtonProps {
  disabled?: boolean;
  onSelect: (action: VoiceAction) => void;
  className?: string;
}

const WIDTH_COLLAPSED = 36;
const WIDTH_EXPANDED = 200;

const fluid = {
  type: "spring" as const,
  stiffness: 520,
  damping: 40,
  mass: 0.65,
};

const OPTIONS: {
  action: VoiceAction;
  label: string;
  icon: LucideIcon;
}[] = [
  { action: "dictation", label: "Dictation", icon: AudioLines },
  { action: "voice", label: "Voice", icon: Mic },
];

/**
 * 36×36 primary control — expands left into the composer.
 * Collapsed icon uses the same flex center pattern as the send button.
 */
export function VoiceActionButton({
  disabled,
  onSelect,
  className,
}: VoiceActionButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [active, setActive] = useState<VoiceAction | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<
    Partial<Record<VoiceAction, HTMLButtonElement | null>>
  >({});
  const leaveTimer = useRef<number | null>(null);
  const expandedRef = useRef(false);
  expandedRef.current = expanded;

  const clearLeave = useCallback(() => {
    if (leaveTimer.current) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }, []);

  const open = useCallback(() => {
    if (disabled) return;
    clearLeave();
    setExpanded(true);
  }, [disabled, clearLeave]);

  const close = useCallback(() => {
    clearLeave();
    leaveTimer.current = window.setTimeout(() => {
      setExpanded(false);
      setInteractive(false);
      setActive(null);
    }, 100);
  }, [clearLeave]);

  const pick = useCallback(
    (action: VoiceAction) => {
      clearLeave();
      setExpanded(false);
      setInteractive(false);
      setActive(null);
      onSelect(action);
    },
    [clearLeave, onSelect]
  );

  const hitTest = useCallback(
    (clientX: number, clientY: number): VoiceAction | null => {
      if (!interactive) return null;
      for (const { action } of OPTIONS) {
        const el = optionRefs.current[action];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (
          clientX >= r.left &&
          clientX <= r.right &&
          clientY >= r.top &&
          clientY <= r.bottom
        ) {
          return action;
        }
      }
      return null;
    },
    [interactive]
  );

  const onPanelPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!expandedRef.current || !interactive) return;
      const next = hitTest(e.clientX, e.clientY);
      setActive((prev) => (prev === next ? prev : next));
    },
    [hitTest, interactive]
  );

  useEffect(() => () => clearLeave(), [clearLeave]);

  useEffect(() => {
    if (!expanded) {
      setInteractive(false);
      setActive(null);
    }
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpanded(false);
        setInteractive(false);
        setActive(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  return (
    <div
      className={cn(
        "relative flex h-9 w-9 shrink-0 justify-end overflow-visible",
        className
      )}
    >
      <motion.div
        ref={panelRef}
        initial={false}
        animate={{ width: expanded ? WIDTH_EXPANDED : WIDTH_COLLAPSED }}
        transition={fluid}
        onUpdate={(latest) => {
          if (!expandedRef.current) return;
          const w =
            typeof latest.width === "number"
              ? latest.width
              : parseFloat(String(latest.width));
          if (!Number.isNaN(w) && w >= WIDTH_EXPANDED * 0.94) {
            setInteractive(true);
          }
        }}
        onAnimationComplete={() => {
          if (expandedRef.current) setInteractive(true);
        }}
        onMouseEnter={open}
        onMouseLeave={close}
        onPointerMove={onPanelPointerMove}
        onFocusCapture={open}
        onBlurCapture={(e) => {
          if (!panelRef.current?.contains(e.relatedTarget as Node)) close();
        }}
        className={cn(
          /* Match send button: flex box that truly centers its child */
          "relative z-20 flex h-9 shrink-0 items-center justify-center overflow-hidden rounded-full",
          "btn-primary",
          expanded && "z-30 justify-stretch",
          disabled && "pointer-events-none opacity-40"
        )}
        style={{
          marginLeft: "auto",
          transformOrigin: "right center",
          minWidth: WIDTH_COLLAPSED,
        }}
        data-voice-action-panel
        data-expanded={expanded ? "true" : "false"}
      >
        {/*
          Collapsed trigger — same geometry as send:
          h-9 w-9 flex items-center justify-center, icon h-4 w-4.
        */}
        <button
          type="button"
          disabled={disabled}
          aria-label="Dictation and voice options"
          aria-haspopup="menu"
          aria-expanded={expanded}
          onClick={() => (expanded ? undefined : open())}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full outline-none",
            "text-[var(--btn-primary-fg)]",
            expanded && "pointer-events-none absolute right-0 top-0 opacity-0"
          )}
        >
          <AudioLines
            className="h-4 w-4 shrink-0"
            strokeWidth={ICON_STROKE}
            aria-hidden
          />
        </button>

        {/* Expanded options — overlaid, right-aligned to the disc */}
        <div
          role="menu"
          aria-label="Dictation and voice"
          aria-hidden={!expanded}
          className={cn(
            "absolute inset-y-0 right-0 flex h-9 items-stretch gap-0.5 px-1",
            !expanded && "pointer-events-none"
          )}
          style={{
            width: WIDTH_EXPANDED,
            opacity: expanded ? 1 : 0,
            transition: "opacity 0.12s ease",
            pointerEvents: interactive ? "auto" : "none",
          }}
        >
          {OPTIONS.map(({ action, label, icon: Icon }) => {
            const isActive = active === action;
            return (
              <button
                key={action}
                ref={(el) => {
                  optionRefs.current[action] = el;
                }}
                type="button"
                role="menuitem"
                data-voice-action={action}
                tabIndex={expanded ? 0 : -1}
                aria-label={label}
                onPointerEnter={() => {
                  if (interactive) setActive(action);
                }}
                onClick={() => pick(action)}
                className={cn(
                  "flex h-full min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2",
                  "text-[12px] font-medium tracking-tight whitespace-nowrap",
                  "outline-none transition-colors duration-100",
                  "focus-visible:ring-0",
                  isActive
                    ? "text-[var(--btn-primary-fg)]"
                    : "text-[var(--btn-primary-fg)]/70"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-opacity duration-100",
                    isActive ? "opacity-100" : "opacity-80"
                  )}
                  strokeWidth={ICON_STROKE}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
