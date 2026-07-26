/** Shared motion tokens — product-tight, not toy-bouncy */

export const easeOut = [0.16, 1, 0.3, 1] as const;
export const easeSpring = [0.22, 1, 0.36, 1] as const;

/** Buttons, menus, icon press */
export const springSnappy = {
  type: "spring" as const,
  stiffness: 520,
  damping: 40,
  mass: 0.65,
};

/** Panels, expand/collapse content */
export const springSoft = {
  type: "spring" as const,
  stiffness: 380,
  damping: 36,
  mass: 0.75,
};

/** Sidebar width, layoutId pills */
export const springLayout = {
  type: "spring" as const,
  stiffness: 420,
  damping: 38,
  mass: 0.7,
};

/** Icon buttons — subtle, not mushy */
export const pressIcon = {
  hover: { scale: 1.04 },
  tap: { scale: 0.94 },
};

/** Primary send / solid CTAs */
export const pressPrimary = {
  hover: { scale: 1.02 },
  tap: { scale: 0.96 },
};

/** Compact chips / follow-ups — tasteful grow on hover */
export const pressChip = {
  hover: { scale: 1.045 },
  tap: { scale: 0.97 },
};

/** @deprecated use pressPrimary.tap */
export const tapScale = pressPrimary.tap;
/** @deprecated use pressIcon.hover */
export const hoverLift = pressIcon.hover;

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18, ease: easeOut },
};

export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
  transition: { duration: 0.22, ease: easeSpring },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.18, ease: easeSpring },
};

/** Scene swaps (home ↔ chat) — short, opacity-first */
export const sceneTransition = {
  duration: 0.16,
  ease: easeOut,
};
