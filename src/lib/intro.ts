/**
 * Magnus monogram intro gate.
 *
 * Shows on full page load / hard refresh when the preference is on.
 * In-session dismiss is memory-only (resets on reload).
 * Preference to hide forever lives in localStorage (Settings).
 */

export const INTRO_SVG_PATH = "/brand/magnus-intro.svg";

/** localStorage key — "0" = disabled, anything else / missing = enabled */
export const INTRO_ENABLED_KEY = "magnus-intro-enabled";

/** In-document only — resets on full page reload (module re-evaluation). */
let seenThisDocumentLoad = false;

/**
 * Whether the user wants the startup intro (Settings).
 * Default: true (show).
 */
export function isIntroEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = localStorage.getItem(INTRO_ENABLED_KEY);
    if (v === "0" || v === "false") return false;
  } catch {
    /* ignore */
  }
  return true;
}

/** Persist intro on/off from Settings. */
export function setIntroEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INTRO_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/**
 * Whether to show the intro for this document load.
 * False if already dismissed this load, or if preference is off.
 */
export function shouldShowIntro(): boolean {
  if (seenThisDocumentLoad) return false;
  if (!isIntroEnabled()) return false;
  return true;
}

/** Mark intro dismissed for the current document load only. */
export function markIntroSeen(): void {
  seenThisDocumentLoad = true;
}

/**
 * Test helper: simulate a fresh page load (module re-init after refresh).
 * Production code never needs this — the browser reload clears module state.
 */
export function resetIntroForTests(): void {
  seenThisDocumentLoad = false;
}

/**
 * Hold time before dismiss starts.
 * Full path leaves room for logo draw + wordmark in, then a long soft fade-out
 * is handled by Framer exit (~0.7s) after this timer.
 */
export function introDurationMs(reducedMotion: boolean): number {
  return reducedMotion ? 320 : 2800;
}

/**
 * Pure gate for unit tests that inject their own “document load” store.
 * A new store instance ≈ a new page load (refresh).
 */
export function createIntroGate(opts?: { enabled?: boolean }) {
  let seen = false;
  const enabled = opts?.enabled ?? true;
  return {
    shouldShow(): boolean {
      if (!enabled) return false;
      return !seen;
    },
    markSeen(): void {
      seen = true;
    },
  };
}
