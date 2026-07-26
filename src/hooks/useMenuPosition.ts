"use client";

import { useCallback, useLayoutEffect, useState, type RefObject } from "react";
import {
  computeMenuPosition,
  type MenuAlign,
  type MenuPlacement,
  type MenuPrefer,
  type MenuPositionResult,
} from "@/lib/menu-position";

export type { MenuAlign, MenuPlacement, MenuPrefer };

export interface MenuPosition extends MenuPositionResult {
  ready: boolean;
}

/**
 * Viewport-aware fixed coords for floating menus.
 * Composer controls default to opening above so + and model menus match.
 * Only flips when the preferred side can’t fit a usable menu.
 */
export function useMenuPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  align: MenuAlign = "left",
  gap = 8,
  menuWidth = 240,
  /** Estimated full menu height for sizing / flip decisions */
  estimatedHeight = 300,
  prefer: MenuPrefer = "above"
): MenuPosition {
  const [pos, setPos] = useState<MenuPosition>({
    top: null,
    bottom: null,
    left: 0,
    maxHeight: estimatedHeight,
    placement: "above",
    transformOrigin: "bottom left",
    ready: false,
  });

  const update = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = computeMenuPosition({
      rect: {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      },
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      align,
      gap,
      menuWidth,
      estimatedHeight,
      prefer,
    });
    setPos({ ...next, ready: true });
  }, [triggerRef, align, gap, menuWidth, estimatedHeight, prefer]);

  useLayoutEffect(() => {
    if (!open) {
      setPos((p) => ({ ...p, ready: false }));
      return;
    }
    update();
    // Second frame after paint so layout/fonts settle
    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    // iOS keyboard / visualViewport shifts
    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
    };
  }, [open, update]);

  return pos;
}
