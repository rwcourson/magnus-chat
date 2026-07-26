"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Portal } from "@/components/ui/Portal";
import { useChat } from "@/context/ChatContext";
import {
  MAGNUS_INTRO_DISMISS_EVENT,
  ONBOARDING_TOUR_START_EVENT,
  isMagnusIntroBlocking,
  markOnboardingTourDone,
  onboardingTourPostIntroDelayMs,
  shouldShowOnboardingTour,
  type OnboardingTourDoneReason,
} from "@/lib/onboarding-tour";
import { easeSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  TOUR_STEPS,
  buildTourVeilMask,
  clampTourStepIndex,
  padRectInViewport,
  pickTourCardPosition,
  type TourStep,
} from "@/components/onboarding/tour-steps";

const CARD_W = 300;
const CARD_H_EST = 168;
const SPOT_PAD = 10;
/** Keep spotlight + ring fully inside the screen (sidebar items sit near left) */
const SPOT_EDGE_INSET = 10;
/** Match spotlight ring — rounded hole so blur meets the border cleanly */
const SPOT_RADIUS = 16;

function readReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/**
 * First-run show-me-around — quiet glass spotlight after MagnusIntro.
 * Completes once unless replayed from Settings.
 */
export function OnboardingTour() {
  const router = useRouter();
  const {
    setSidebarOpen,
    setSidebarCollapsed,
    sidebarCollapsed,
    setAppMode,
    goHome,
    newChat,
    rememberLastChatPath,
  } = useChat();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [target, setTarget] = useState<TargetRect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const [reduced, setReduced] = useState(readReducedMotion);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const startedRef = useRef(false);
  const delayTimerRef = useRef<number | undefined>(undefined);
  const pollTimerRef = useRef<number | undefined>(undefined);
  const goHomeRef = useRef(goHome);
  const routerRef = useRef(router);

  useEffect(() => {
    goHomeRef.current = goHome;
    routerRef.current = router;
  }, [goHome, router]);

  const step: TourStep | undefined = TOUR_STEPS[stepIndex];
  const total = TOUR_STEPS.length;

  const finish = useCallback((reason: OnboardingTourDoneReason) => {
    markOnboardingTourDone(reason);
    setActive(false);
    setTarget(null);
    setCardPos(null);
    startedRef.current = false;
  }, []);

  const prepareShellForStep = useCallback(
    (s: TourStep) => {
      if (s.requireHomeMode || s.needsSidebar) {
        setAppMode("home");
        goHome();
      }
      if (s.needsSidebar) {
        if (sidebarCollapsed) setSidebarCollapsed(false);
        setSidebarOpen(true);
      }
    },
    [
      goHome,
      setAppMode,
      setSidebarCollapsed,
      setSidebarOpen,
      sidebarCollapsed,
    ]
  );

  const runAdvanceAction = useCallback(
    (s: TourStep) => {
      if (s.onAdvance === "new-chat") {
        rememberLastChatPath("/");
        newChat();
        try {
          router.push("/");
        } catch {
          /* ignore */
        }
      }
    },
    [newChat, rememberLastChatPath, router]
  );

  const measure = useCallback(() => {
    const s = TOUR_STEPS[stepIndex];
    if (!s || typeof document === "undefined") return;

    const el = document.querySelector(s.selector) as HTMLElement | null;
    if (!el) {
      setTarget(null);
      return;
    }

    if (s.scrollIntoView !== false) {
      try {
        el.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: reduced ? "auto" : "smooth",
        });
      } catch {
        /* ignore */
      }
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = el.getBoundingClientRect();
    // Edge-aware pad — never push the hole past the left/top of the screen
    const rect = padRectInViewport(
      {
        top: r.top,
        left: r.left,
        width: Math.max(r.width, 8),
        height: Math.max(r.height, 8),
      },
      SPOT_PAD,
      { width: vw, height: vh },
      SPOT_EDGE_INSET
    );
    setTarget(rect);

    const cardBox = cardRef.current?.getBoundingClientRect();
    const card = {
      width: cardBox?.width || CARD_W,
      height: cardBox?.height || CARD_H_EST,
    };
    const pos = pickTourCardPosition({
      target: rect,
      card,
      viewport: { width: vw, height: vh },
      placement: s.placement ?? "auto",
    });
    setCardPos({ top: pos.top, left: pos.left });
  }, [stepIndex, reduced]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduced(mq.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  /**
   * Start only when:
   *  - localStorage pending (first visit) OR session force (Settings Replay)
   *  - monogram intro is NOT covering the shell (unless dismiss just fired)
   *
   * Stable effect (refs for router/goHome) so remounts/context updates
   * don't cancel a pending first-run schedule.
   */
  useEffect(() => {
    let cancelled = false;

    const clearTimers = () => {
      if (delayTimerRef.current != null) {
        window.clearTimeout(delayTimerRef.current);
        delayTimerRef.current = undefined;
      }
      if (pollTimerRef.current != null) {
        window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = undefined;
      }
    };

    const activateTour = () => {
      if (cancelled) return;
      if (!shouldShowOnboardingTour()) return;
      startedRef.current = true;
      setStepIndex(0);
      setActive(true);
    };

    const scheduleBegin = (opts?: { ignoreIntroBlock?: boolean }) => {
      if (cancelled || startedRef.current) return;
      if (!shouldShowOnboardingTour()) return;
      if (!opts?.ignoreIntroBlock && isMagnusIntroBlocking()) return;
      if (delayTimerRef.current != null) {
        window.clearTimeout(delayTimerRef.current);
      }
      const ms = onboardingTourPostIntroDelayMs(readReducedMotion());
      delayTimerRef.current = window.setTimeout(() => {
        if (cancelled || startedRef.current) return;
        if (!shouldShowOnboardingTour()) return;
        // After dismiss we allow start while logo is still fading out
        if (!opts?.ignoreIntroBlock && isMagnusIntroBlocking()) return;
        activateTour();
      }, ms);
    };

    const trySchedule = () => {
      if (cancelled) return;
      if (!shouldShowOnboardingTour()) return;
      if (startedRef.current) return;
      if (isMagnusIntroBlocking()) {
        pollTimerRef.current = window.setTimeout(trySchedule, 80);
        return;
      }
      scheduleBegin();
    };

    trySchedule();

    const onIntroDismiss = () => {
      // Logo is leaving — start after a short beat (don't wait for full exit)
      scheduleBegin({ ignoreIntroBlock: true });
    };

    const onReplay = () => {
      if (cancelled) return;
      clearTimers();
      // Reset so Replay works even if a tour was already active / finished this session
      startedRef.current = false;
      setActive(false);
      setTarget(null);
      setCardPos(null);
      setStepIndex(0);
      try {
        goHomeRef.current();
        routerRef.current.push("/");
      } catch {
        /* ignore */
      }
      // Two frames: leave Settings route, land on home anchors, then open
      window.setTimeout(() => {
        if (cancelled) return;
        if (!shouldShowOnboardingTour()) return;
        activateTour();
      }, 120);
    };

    window.addEventListener(MAGNUS_INTRO_DISMISS_EVENT, onIntroDismiss);
    window.addEventListener(ONBOARDING_TOUR_START_EVENT, onReplay);

    return () => {
      cancelled = true;
      clearTimers();
      window.removeEventListener(MAGNUS_INTRO_DISMISS_EVENT, onIntroDismiss);
      window.removeEventListener(ONBOARDING_TOUR_START_EVENT, onReplay);
    };
    // Intentionally empty — listeners use refs; re-running would cancel first-visit timers
  }, []);

  useLayoutEffect(() => {
    if (!active || !step) return;
    prepareShellForStep(step);
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => measure());
    });
    const late = window.setTimeout(measure, reduced ? 40 : 160);
    const later = window.setTimeout(measure, reduced ? 80 : 320);
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
      window.clearTimeout(late);
      window.clearTimeout(later);
    };
  }, [active, step, prepareShellForStep, measure, reduced]);

  useEffect(() => {
    if (!active) return;
    const onWin = () => measure();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [active, measure]);

  const goNext = useCallback(() => {
    const current = TOUR_STEPS[stepIndex];
    if (current) runAdvanceAction(current);

    if (stepIndex >= total - 1) {
      finish("completed");
      return;
    }
    setStepIndex((i) => clampTourStepIndex(i + 1, total));
  }, [finish, runAdvanceAction, stepIndex, total]);

  const goBack = useCallback(() => {
    setStepIndex((i) => clampTourStepIndex(i - 1, total));
  }, [total]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      // Don't steal Escape while the monogram is still up
      if (isMagnusIntroBlocking()) return;
      if (e.key === "Escape") {
        e.preventDefault();
        finish("skipped");
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        if (
          e.target instanceof HTMLElement &&
          (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        ) {
          return;
        }
        if (e.key === "Enter" && e.target !== nextBtnRef.current) return;
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => nextBtnRef.current?.focus(), 40);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [active, finish, goNext, goBack]);

  if (!active || !step) return null;

  const isLast = stepIndex >= total - 1;
  const spot = target;

  const resolvedCard =
    cardPos ??
    (typeof window !== "undefined"
      ? {
          top: Math.max(24, window.innerHeight / 2 - CARD_H_EST / 2),
          left: Math.max(12, window.innerWidth / 2 - CARD_W / 2),
        }
      : { top: 80, left: 24 });

  const vw =
    typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh =
    typeof window !== "undefined" ? window.innerHeight : 800;

  const veilMask =
    spot != null
      ? buildTourVeilMask({
          spot,
          viewport: { width: vw, height: vh },
          radius: SPOT_RADIUS,
        })
      : undefined;

  return (
    <Portal>
      <motion.div
        className="fixed inset-0 z-[400] overflow-hidden"
        data-onboarding-tour
        role="dialog"
        aria-modal="true"
        aria-label="Show me around Magnus"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.22, ease: easeSpring }}
      >
        <div
          className="absolute inset-0 z-0"
          aria-hidden
          data-onboarding-blocker
        />

        {/*
          Light veil: soft dim + light blur so context stays readable.
          SVG mask = rounded hole edge-to-edge (no harsh rect corners).
        */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-[1]",
            // Lighter than before — user can still see where things are
            "bg-[color-mix(in_srgb,var(--bg-deep)_32%,transparent)]",
            "backdrop-blur-[5px] backdrop-saturate-110"
          )}
          style={
            veilMask
              ? {
                  WebkitMaskImage: veilMask,
                  maskImage: veilMask,
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }
              : undefined
          }
          aria-hidden
          data-onboarding-veil
        />

        {spot && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-[2] rounded-2xl"
            style={{
              top: spot.top,
              left: spot.left,
              width: spot.width,
              height: spot.height,
              borderRadius: SPOT_RADIUS,
              // Soft ring aligned with rounded mask hole
              boxShadow:
                "inset 0 0 0 1.5px color-mix(in srgb, var(--glass-border-strong) 90%, transparent), 0 0 0 1px color-mix(in srgb, var(--accent-ring) 28%, transparent)",
            }}
            data-onboarding-spotlight
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            ref={cardRef}
            initial={reduced ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: reduced ? 0 : 0.26, ease: easeSpring }}
            className={cn(
              "absolute z-10 w-[min(300px,calc(100vw-24px))]",
              "rounded-2xl border border-[var(--glass-border)]",
              "bg-[var(--glass-fill-strong)] backdrop-blur-xl",
              "shadow-[0_1px_0_0_var(--glass-specular-soft)_inset]",
              "px-4 pb-3.5 pt-3.5"
            )}
            style={{ top: resolvedCard.top, left: resolvedCard.left }}
            data-onboarding-card
          >
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              {stepIndex + 1} of {total}
            </p>

            <h2 className="mt-2 text-[15px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              {step.title}
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              {step.body}
            </p>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => finish("skipped")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12.5px] font-medium",
                  "text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-secondary)]",
                  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                )}
                data-onboarding-skip
              >
                Skip tour
              </button>

              <div className="flex items-center gap-1.5">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className={cn(
                      "rounded-full border border-[var(--glass-border-soft)] px-3 py-1.5",
                      "text-[12.5px] font-medium text-[var(--text-secondary)]",
                      "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
                      "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                    )}
                    data-onboarding-back
                  >
                    Back
                  </button>
                )}
                <button
                  ref={nextBtnRef}
                  type="button"
                  onClick={goNext}
                  className={cn(
                    "btn-primary rounded-full px-3.5 py-1.5",
                    "text-[12.5px] font-semibold",
                    "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                  )}
                  data-onboarding-next
                >
                  {isLast
                    ? step.onAdvance === "new-chat"
                      ? "Open Chat"
                      : "Done"
                    : "Next"}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </Portal>
  );
}


