/**
 * Pure viewport clamp for floating menus (composer attach/model, etc.).
 * Unit-tested without React — keep hook thin.
 */

export type MenuAlign = "left" | "right";
export type MenuPlacement = "above" | "below";
export type MenuPrefer = "above" | "below" | "auto";

export type MenuRect = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
};

export type MenuPositionResult = {
  /** When placement is "below" — distance from viewport top */
  top: number | null;
  /** When placement is "above" — distance from viewport bottom */
  bottom: number | null;
  left: number;
  /** Cap height so long menus scroll instead of clipping */
  maxHeight: number;
  placement: MenuPlacement;
  transformOrigin: string;
};

export const MENU_EDGE = 10;
/** Prefer this much room when deciding flip; never force taller than available */
export const MENU_MIN_USABLE = 140;
/** Absolute floor so a tiny sliver still scrolls */
export const MENU_MIN_HARD = 72;

export type ComputeMenuPositionOpts = {
  rect: MenuRect;
  viewportWidth: number;
  viewportHeight: number;
  align?: MenuAlign;
  gap?: number;
  menuWidth?: number;
  estimatedHeight?: number;
  prefer?: MenuPrefer;
  edge?: number;
  minUsable?: number;
  minHard?: number;
};

/**
 * Compute fixed-position coords so a menu stays fully on-screen.
 * - Horizontal: clamp left into [edge, vw - menuWidth - edge]
 * - Vertical: prefer `prefer` side when usable; flip only if needed
 * - maxHeight never exceeds available space on the chosen side
 */
export function computeMenuPosition(
  opts: ComputeMenuPositionOpts
): MenuPositionResult {
  const {
    rect,
    viewportWidth: vw,
    viewportHeight: vh,
    align = "left",
    gap = 8,
    menuWidth = 240,
    estimatedHeight = 300,
    prefer = "above",
    edge = MENU_EDGE,
    minUsable = MENU_MIN_USABLE,
    minHard = MENU_MIN_HARD,
  } = opts;

  // On very narrow viewports, shrink effective menu width so left clamp works
  const effectiveWidth = Math.min(menuWidth, Math.max(0, vw - edge * 2));

  let left = align === "right" ? rect.right - effectiveWidth : rect.left;
  left = Math.max(edge, Math.min(left, vw - effectiveWidth - edge));

  const spaceAbove = Math.max(0, rect.top - gap - edge);
  const spaceBelow = Math.max(0, vh - rect.bottom - gap - edge);

  let placement: MenuPlacement;
  if (prefer === "above") {
    // Composer attach (+) and model menus must always open UP — never flip
    // below the field (user expects both controls to match).
    placement = "above";
  } else if (prefer === "below") {
    placement = "below";
  } else if (spaceAbove >= estimatedHeight) {
    placement = "above";
  } else if (spaceBelow >= estimatedHeight) {
    placement = "below";
  } else {
    placement = spaceAbove >= spaceBelow ? "above" : "below";
  }

  const available = placement === "above" ? spaceAbove : spaceBelow;
  // Prefer fitting in available space; never exceed it when space exists
  const maxHeight =
    available > 0
      ? Math.min(estimatedHeight, available)
      : Math.min(estimatedHeight, Math.max(minHard, vh - edge * 2));

  if (placement === "above") {
    // Bottom edge of menu sits just above the trigger → grows upward
    const bottom = Math.max(edge, vh - rect.top + gap);
    return {
      top: null,
      bottom,
      left,
      maxHeight,
      placement,
      transformOrigin: align === "right" ? "bottom right" : "bottom left",
    };
  }

  const top = rect.bottom + gap;
  return {
    top,
    bottom: null,
    left,
    maxHeight,
    placement,
    transformOrigin: align === "right" ? "top right" : "top left",
  };
}
