"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
} from "react";
import { cn } from "@/lib/utils";

type Axis = "y" | "x" | "both";
type Size = "sm" | "md" | "lg";

const SIZE_PX: Record<Size, number> = {
  sm: 28,
  md: 48,
  lg: 100,
};

interface ScrollFadeProps {
  children: ReactNode;
  className?: string;
  /** Classes on the scrolling element */
  contentClassName?: string;
  /** Which edges can fade */
  axis?: Axis;
  size?: Size;
  /**
   * CSS color for the fade solid edge.
   * Defaults to var(--scroll-fade-color), then var(--bg-canvas).
   */
  color?: string;
  /**
   * Bottom dissolve is always on for vertical lists (not scroll-gated).
   * Pass hideBottom when a dock/veil owns the bottom edge (chat composer).
   */
  hideBottom?: boolean;
  /**
   * Top dissolve is off by default. Pass forceTop to enable (rare).
   */
  forceTop?: boolean;
  /** @deprecated Top is off by default; kept for API compatibility */
  hideTop?: boolean;
  /** @deprecated Bottom is always on unless hideBottom */
  forceBottom?: boolean;
  /** @deprecated use forceTop / hideBottom */
  force?: boolean;
}

/**
 * Scroll container with tasteful edge dissolves.
 * - Vertical: bottom fade always visible; top fade never (unless forceTop).
 * - Horizontal: left/right only when content overflows that side.
 */
export function ScrollFade({
  children,
  className,
  contentClassName,
  axis = "y",
  size = "md",
  color,
  hideBottom = false,
  forceTop = false,
  hideTop = true,
  forceBottom: _forceBottom = true,
  force = false,
}: ScrollFadeProps) {
  void _forceBottom;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(false);
  // Bottom starts visible so it never "pops in" on scroll
  const [bottom, setBottom] = useState(() => !hideBottom);
  const [left, setLeft] = useState(false);
  const [right, setRight] = useState(false);

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const eps = 2;
    const canX = el.scrollWidth > el.clientWidth + eps;

    if (axis === "y" || axis === "both") {
      // Top: never scroll-gated; only if explicitly forced
      setTop(!hideTop && (force || forceTop));
      // Bottom: always on unless a parent dock owns the edge
      setBottom(!hideBottom);
    }
    if (axis === "x" || axis === "both") {
      setLeft(force || (canX && el.scrollLeft > eps));
      setRight(
        force ||
          (canX && el.scrollLeft + el.clientWidth < el.scrollWidth - eps)
      );
    }
  }, [axis, force, forceTop, hideBottom, hideTop]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);

    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, children]);

  const onScroll = () => {
    measure();
  };

  const fadeStyle = {
    ["--scroll-fade-size" as string]: `${SIZE_PX[size]}px`,
    ...(color ? { ["--scroll-fade-color" as string]: color } : null),
  } as React.CSSProperties;

  const y = axis === "y" || axis === "both";
  const x = axis === "x" || axis === "both";

  return (
    <div
      className={cn("relative min-h-0 min-w-0", className)}
      style={fadeStyle}
      data-scroll-fade
      data-hide-bottom={hideBottom ? "true" : undefined}
      data-hide-top={hideTop && !forceTop ? "true" : undefined}
    >
      <div
        ref={scrollerRef}
        onScroll={onScroll as (e: UIEvent<HTMLDivElement>) => void}
        data-scroll-fade-scroller
        className={cn(
          "h-full min-h-0 w-full min-w-0 overscroll-contain",
          y && "overflow-y-auto",
          x && "overflow-x-auto",
          axis === "y" && "overflow-x-hidden",
          // Touch/trackpad: ensure the scroller is the wheel target
          "touch-pan-y",
          contentClassName
        )}
      >
        {children}
      </div>

      {y && (
        <>
          <div
            aria-hidden
            data-scroll-fade-edge="top"
            className={cn(
              "scroll-fade scroll-fade-top",
              top ? "scroll-fade-visible" : "scroll-fade-hidden"
            )}
          />
          <div
            aria-hidden
            data-scroll-fade-edge="bottom"
            className={cn(
              "scroll-fade scroll-fade-bottom",
              bottom ? "scroll-fade-visible" : "scroll-fade-hidden"
            )}
          />
        </>
      )}
      {x && (
        <>
          <div
            aria-hidden
            data-scroll-fade-edge="left"
            className={cn(
              "scroll-fade scroll-fade-left",
              left ? "scroll-fade-visible" : "scroll-fade-hidden"
            )}
          />
          <div
            aria-hidden
            data-scroll-fade-edge="right"
            className={cn(
              "scroll-fade scroll-fade-right",
              right ? "scroll-fade-visible" : "scroll-fade-hidden"
            )}
          />
        </>
      )}
    </div>
  );
}
