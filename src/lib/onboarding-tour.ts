/**
 * First-run “show me around” tour gate.
 *
 * Completes once (completed | skipped) via localStorage — unlike the monogram
 * intro, which can re-play each hard refresh when enabled.
 */

export const ONBOARDING_TOUR_KEY = "magnus-onboarding-tour-v1";

/**
 * Session-only force flag — set by Settings Replay so a hard refresh mid-replay
 * still shows the tour once even if something re-wrote the completed key.
 */
export const ONBOARDING_TOUR_FORCE_SESSION_KEY = "magnus-onboarding-tour-force";

export type OnboardingTourStatus = "pending" | "completed" | "skipped";

export type OnboardingTourDoneReason = "completed" | "skipped";

/** Custom event to force-start the tour (Settings replay). */
export const ONBOARDING_TOUR_START_EVENT = "magnus-onboarding-tour-start";

/**
 * Brief handoff after monogram intro dismisses.
 * Keep short — logo exit already reads as a beat.
 */
export const ONBOARDING_TOUR_POST_INTRO_DELAY_MS = 180;

/** Reduced-motion post-intro delay. */
export const ONBOARDING_TOUR_POST_INTRO_DELAY_REDUCED_MS = 60;

/** Fired by MagnusIntro when dismiss starts (before exit animation ends). */
export const MAGNUS_INTRO_DISMISS_EVENT = "magnus-intro-dismiss";

export function readOnboardingTourStatus(): OnboardingTourStatus {
  if (typeof window === "undefined") return "pending";
  try {
    const v = localStorage.getItem(ONBOARDING_TOUR_KEY);
    if (v === "completed" || v === "skipped") return v;
  } catch {
    /* ignore */
  }
  return "pending";
}

function isForceSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(ONBOARDING_TOUR_FORCE_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearOnboardingTourForceSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ONBOARDING_TOUR_FORCE_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function setOnboardingTourForceSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ONBOARDING_TOUR_FORCE_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Whether the tour may auto-start.
 * Pending localStorage OR a session force (Settings Replay).
 */
export function shouldShowOnboardingTour(): boolean {
  if (isForceSession()) return true;
  return readOnboardingTourStatus() === "pending";
}

export function markOnboardingTourDone(
  reason: OnboardingTourDoneReason = "completed"
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ONBOARDING_TOUR_KEY, reason);
  } catch {
    /* ignore */
  }
  clearOnboardingTourForceSession();
}

/** Clear completion so the tour can run again (Settings / tests). */
export function resetOnboardingTour(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ONBOARDING_TOUR_KEY);
  } catch {
    /* ignore */
  }
}

/** Dispatch a client event so the tour controller can start immediately. */
export function requestOnboardingTourReplay(): void {
  resetOnboardingTour();
  setOnboardingTourForceSession();
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ONBOARDING_TOUR_START_EVENT));
}

/**
 * Pure gate for unit tests that inject storage.
 * pending → show; completed/skipped → hide.
 */
export function createOnboardingTourGate(opts?: {
  initial?: OnboardingTourStatus;
}) {
  let status: OnboardingTourStatus = opts?.initial ?? "pending";
  return {
    shouldShow(): boolean {
      return status === "pending";
    },
    status(): OnboardingTourStatus {
      return status;
    },
    markDone(reason: OnboardingTourDoneReason = "completed"): void {
      status = reason;
    },
    reset(): void {
      status = "pending";
    },
  };
}

/**
 * True when the monogram intro is still covering the app.
 *
 * IMPORTANT: boot cover (`magnus-intro-pending`) is removed as soon as the
 * React intro mounts — while the logo is still playing. Waiting only on that
 * class starts the tour *under* the intro (invisible). Also check the live
 * intro node.
 */
export function isMagnusIntroBlocking(): boolean {
  if (typeof document === "undefined") return false;
  try {
    if (document.documentElement.classList.contains("magnus-intro-pending")) {
      return true;
    }
    if (document.querySelector("[data-magnus-intro]")) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/** @deprecated use isMagnusIntroBlocking — name kept for older call sites */
export function isMagnusIntroCleared(): boolean {
  return !isMagnusIntroBlocking();
}

export function onboardingTourPostIntroDelayMs(reducedMotion: boolean): number {
  return reducedMotion
    ? ONBOARDING_TOUR_POST_INTRO_DELAY_REDUCED_MS
    : ONBOARDING_TOUR_POST_INTRO_DELAY_MS;
}
