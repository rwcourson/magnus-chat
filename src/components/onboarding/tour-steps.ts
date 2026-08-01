/**
 * First-run tour steps — light orientation only.
 * No search stop; includes Chat + Feed; Chat mode opens a Magnus chat.
 */

export type TourPlacement = "auto" | "right" | "left" | "bottom" | "top";

/** Side effects when leaving a step via Next (not Skip). */
export type TourAdvanceAction = "none" | "new-chat";

export type TourStep = {
  id: string;
  /** CSS selector for the highlight target */
  selector: string;
  title: string;
  body: string;
  placement?: TourPlacement;
  /**
   * Prefer expanding the sidebar (desktop) / opening the drawer (mobile)
   * so the target is visible.
   */
  needsSidebar?: boolean;
  /** Force Home mode so home nav targets exist */
  requireHomeMode?: boolean;
  /** Scroll the target into view before measuring */
  scrollIntoView?: boolean;
  /** Run when the user presses Next on this step (before advancing) */
  onAdvance?: TourAdvanceAction;
};

/**
 * Ordered tour (≤6).
 * Chat + Feed while still on Home, then Home/Chat switch → open a chat.
 * (Ask Magnus is the mode switch at the top — not the home page composer.)
 */
export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "home",
    selector: "[data-tour-home]",
    title: "Your home base",
    body: "News, actions, and updates — this is where the day starts.",
    placement: "bottom",
    requireHomeMode: true,
    scrollIntoView: true,
  },
  {
    id: "catch-me-up",
    selector: "[data-catch-me-up]",
    title: "Start here",
    body: "A personal brief of what matters — one tap, when you’re ready.",
    placement: "bottom",
    requireHomeMode: true,
    scrollIntoView: true,
  },
  {
    id: "messages",
    selector: "[data-sidebar-top-mode]",
    title: "Talk with Magnus",
    body: "Use the Home / Chat switch for AI conversations, history, skills, and routines.",
    placement: "right",
    needsSidebar: true,
    requireHomeMode: true,
    scrollIntoView: true,
  },
  {
    id: "feed",
    selector: '[data-tour-target="feed"]',
    title: "B&G Live",
    body: "Company-wide live chat — short updates, questions, and heads-ups. Not a social feed.",
    placement: "right",
    needsSidebar: true,
    requireHomeMode: true,
    scrollIntoView: true,
  },
  {
    id: "chat-mode",
    selector: "[data-sidebar-top-mode]",
    title: "Ask Magnus",
    body: "Switch to Chat anytime — history, skills, routines, and workspaces live here.",
    placement: "right",
    needsSidebar: true,
    requireHomeMode: true,
    scrollIntoView: true,
    /** Next opens a blank Magnus chat surface */
    onAdvance: "new-chat",
  },
] as const;

export function getTourSteps(): readonly TourStep[] {
  return TOUR_STEPS;
}

export function tourStepCount(): number {
  return TOUR_STEPS.length;
}

/** Clamp step index into valid range. */
export function clampTourStepIndex(index: number, total = TOUR_STEPS.length): number {
  if (total <= 0) return 0;
  if (index < 0) return 0;
  if (index >= total) return total - 1;
  return index;
}

/**
 * Keep a highlight rect fully inside the viewport so the hole never
 * hangs off-screen (zero-size / negative leftovers collapsed to a pad).
 */
export function clampRectToViewport(
  rect: { top: number; left: number; width: number; height: number },
  viewport: { width: number; height: number },
  minSize = 8,
  /** Keep a small inset so rings/shadows aren't clipped at screen edges */
  edgeInset = 0
): { top: number; left: number; width: number; height: number } {
  const vw = Math.max(minSize, viewport.width);
  const vh = Math.max(minSize, viewport.height);
  const inset = Math.max(0, Math.min(edgeInset, Math.floor(Math.min(vw, vh) / 4)));
  const maxL = inset;
  const maxT = inset;
  const maxR = vw - inset;
  const maxB = vh - inset;

  let left = rect.left;
  let top = rect.top;
  let right = rect.left + rect.width;
  let bottom = rect.top + rect.height;

  // Pull fully off-screen boxes back in
  if (right < maxL) {
    const d = maxL - right;
    left += d;
    right += d;
  }
  if (bottom < maxT) {
    const d = maxT - bottom;
    top += d;
    bottom += d;
  }
  if (left > maxR) {
    const d = left - maxR;
    left -= d;
    right -= d;
  }
  if (top > maxB) {
    const d = top - maxB;
    top -= d;
    bottom -= d;
  }

  left = Math.max(maxL, left);
  top = Math.max(maxT, top);
  right = Math.min(maxR, right);
  bottom = Math.min(maxB, bottom);

  let width = Math.max(0, right - left);
  let height = Math.max(0, bottom - top);

  if (width < minSize) {
    width = Math.min(minSize, maxR - maxL);
    left = Math.min(Math.max(maxL, left), maxR - width);
  }
  if (height < minSize) {
    height = Math.min(minSize, maxB - maxT);
    top = Math.min(Math.max(maxT, top), maxB - height);
  }

  return { top, left, width, height };
}

/**
 * Expand a target rect by pad, but only on sides that still have room
 * inside the viewport inset — avoids spotlight rings spilling past
 * the left/top of the screen (common for sidebar rows).
 */
export function padRectInViewport(
  rect: { top: number; left: number; width: number; height: number },
  pad: number,
  viewport: { width: number; height: number },
  edgeInset = 8
): { top: number; left: number; width: number; height: number } {
  const p = Math.max(0, pad);
  const expanded = {
    top: rect.top - p,
    left: rect.left - p,
    width: Math.max(rect.width, 8) + p * 2,
    height: Math.max(rect.height, 8) + p * 2,
  };
  return clampRectToViewport(expanded, viewport, 8, edgeInset);
}

/**
 * CSS mask-image URL: full-screen white with a rounded transparent hole.
 * Keeps veil blur continuous to screen edges; hole matches spotlight radius.
 */
export function buildTourVeilMask(opts: {
  spot: { top: number; left: number; width: number; height: number };
  viewport: { width: number; height: number };
  radius?: number;
}): string {
  const vw = Math.max(1, Math.round(opts.viewport.width));
  const vh = Math.max(1, Math.round(opts.viewport.height));
  const x = Math.round(opts.spot.left);
  const y = Math.round(opts.spot.top);
  const w = Math.max(1, Math.round(opts.spot.width));
  const h = Math.max(1, Math.round(opts.spot.height));
  const r = Math.max(
    0,
    Math.min(opts.radius ?? 16, Math.floor(w / 2), Math.floor(h / 2))
  );

  // evenodd: outer rect minus rounded rect = hole
  const d =
    `M0 0H${vw}V${vh}H0Z` +
    `M${x + r} ${y}` +
    `H${x + w - r}` +
    `A${r} ${r} 0 0 1 ${x + w} ${y + r}` +
    `V${y + h - r}` +
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
    `H${x + r}` +
    `A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
    `V${y + r}` +
    `A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}" viewBox="0 0 ${vw} ${vh}">` +
    `<path fill="white" fill-rule="evenodd" d="${d}"/>` +
    `</svg>`;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * Pure placement pick given target + card size + viewport.
 * Used by the overlay and unit-tested without DOM layout.
 */
export function pickTourCardPosition(opts: {
  target: { top: number; left: number; width: number; height: number };
  card: { width: number; height: number };
  viewport: { width: number; height: number };
  placement: TourPlacement;
  gap?: number;
  pad?: number;
}): { top: number; left: number; placement: Exclude<TourPlacement, "auto"> } {
  const gap = opts.gap ?? 14;
  const pad = opts.pad ?? 12;
  const { target, card, viewport } = opts;
  const t = target;
  const prefer =
    opts.placement === "auto"
      ? t.left + t.width / 2 < viewport.width * 0.45
        ? "right"
        : t.top + t.height / 2 < viewport.height * 0.4
          ? "bottom"
          : "left"
      : opts.placement;

  const candidates: Exclude<TourPlacement, "auto">[] = [
    prefer,
    "right",
    "left",
    "bottom",
    "top",
  ].filter((v, i, a) => a.indexOf(v) === i) as Exclude<TourPlacement, "auto">[];

  for (const p of candidates) {
    let top = 0;
    let left = 0;
    if (p === "right") {
      left = t.left + t.width + gap;
      top = t.top + t.height / 2 - card.height / 2;
    } else if (p === "left") {
      left = t.left - card.width - gap;
      top = t.top + t.height / 2 - card.height / 2;
    } else if (p === "bottom") {
      left = t.left + t.width / 2 - card.width / 2;
      top = t.top + t.height + gap;
    } else {
      left = t.left + t.width / 2 - card.width / 2;
      top = t.top - card.height - gap;
    }

    left = Math.min(
      Math.max(pad, left),
      Math.max(pad, viewport.width - card.width - pad)
    );
    top = Math.min(
      Math.max(pad, top),
      Math.max(pad, viewport.height - card.height - pad)
    );

    if (
      left >= pad - 1 &&
      top >= pad - 1 &&
      left + card.width <= viewport.width - pad + 1 &&
      top + card.height <= viewport.height - pad + 1
    ) {
      return { top, left, placement: p };
    }
  }

  const left = Math.min(
    Math.max(pad, t.left + t.width / 2 - card.width / 2),
    Math.max(pad, viewport.width - card.width - pad)
  );
  const top = Math.min(
    Math.max(pad, t.top + t.height + gap),
    Math.max(pad, viewport.height - card.height - pad)
  );
  return { top, left, placement: "bottom" };
}
