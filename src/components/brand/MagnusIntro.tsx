"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  introDurationMs,
  isIntroEnabled,
  markIntroSeen,
  shouldShowIntro,
} from "@/lib/intro";
import { MAGNUS_INTRO_DISMISS_EVENT } from "@/lib/onboarding-tour";
import { useTheme } from "@/context/ThemeContext";
import { easeSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

function readReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function clearBootCover() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("magnus-intro-pending");
}

/**
 * Full-screen monogram intro on page load (when enabled in Settings).
 *
 * Hydration-safe: server + first client paint render nothing; boot CSS cover
 * (`html.magnus-intro-pending`) blocks the app until we mount the real intro.
 */
export function MagnusIntro() {
  const { theme } = useTheme();
  // Always false on SSR and first client render — matches server HTML
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const show = shouldShowIntro() && isIntroEnabled();
    setReduced(readReducedMotion());
    setVisible(show);
    setMounted(true);

    if (!show) {
      clearBootCover();
      markIntroSeen();
      // Intro skipped/disabled — let the tour know the shell is free
      try {
        window.dispatchEvent(new CustomEvent(MAGNUS_INTRO_DISMISS_EVENT));
      } catch {
        /* ignore */
      }
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduced(mq.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  // Drop boot cover only after the React intro is on screen (or skipped)
  useEffect(() => {
    if (!mounted) return;
    if (!visible) {
      clearBootCover();
      return;
    }
    const id = requestAnimationFrame(() => clearBootCover());
    return () => cancelAnimationFrame(id);
  }, [mounted, visible]);

  useEffect(() => {
    if (!visible) return;

    const dismiss = () => {
      markIntroSeen();
      clearBootCover();
      setVisible(false);
      // Let the tour hand off as soon as dismiss starts (not after exit fade)
      try {
        window.dispatchEvent(new CustomEvent(MAGNUS_INTRO_DISMISS_EVENT));
      } catch {
        /* ignore */
      }
    };

    const t = window.setTimeout(dismiss, introDurationMs(reduced));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [visible, reduced]);

  const exitEase = [0.22, 1, 0.36, 1] as const;

  // Nothing on SSR / first paint — boot CSS cover handles the gap
  if (!mounted) return null;

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key="magnus-intro"
          role="dialog"
          aria-label="Magnus loading"
          aria-live="polite"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: {
              duration: reduced ? 0.2 : 0.7,
              ease: exitEase,
            },
          }}
          className={cn(
            "fixed inset-0 z-[500] flex flex-col items-center justify-center",
            "bg-[var(--bg-deep)]",
            theme === "light"
              ? "text-[var(--navy,#0c2048)]"
              : "text-white"
          )}
          data-magnus-intro
          data-theme={theme}
        >
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reduced ? 0.15 : 0.45,
              ease: exitEase,
            }}
          >
            <IntroMonogram
              reduced={reduced}
              className="h-[min(28vw,160px)] w-[min(28vw,160px)] select-none"
            />
            <motion.p
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      delay: 1.1,
                      duration: 0.5,
                      ease: easeSpring,
                    }
              }
              className={cn(
                "mt-0.5 font-sans text-[22px] font-semibold tracking-[-0.03em] sm:text-[24px]",
                "select-none text-current"
              )}
              data-magnus-intro-wordmark
            >
              Magnus
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function IntroMonogram({
  reduced,
  className,
}: {
  reduced: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      width={160}
      height={160}
      className={className}
      aria-hidden
      data-magnus-intro-mark
    >
      <style>{`
        .magnus-intro-logo {
          fill: currentColor;
          stroke: currentColor;
          stroke-width: 2.2;
          stroke-linejoin: round;
          stroke-linecap: round;
          stroke-dasharray: 1400;
          animation: magnusIntroOutlineFill 2.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes magnusIntroOutlineFill {
          0% { stroke-dashoffset: 1400; fill-opacity: 0; }
          35% { stroke-dashoffset: 0; fill-opacity: 0; }
          55% { stroke-dashoffset: 0; fill-opacity: 1; }
          100% { stroke-dashoffset: 0; fill-opacity: 1; }
        }
        .magnus-intro-logo-static {
          fill: currentColor;
          stroke: currentColor;
          stroke-width: 2.2;
          stroke-linejoin: round;
          stroke-linecap: round;
          stroke-dashoffset: 0;
          fill-opacity: 1;
        }
      `}</style>
      <g transform="translate(2, 73)">
        <path
          d="M 0 254 L 0 0 L 222 0 L 307 85 L 239 85 L 239 254 L 154 254 L 154 85 L 85 85 L 85 254 Z"
          fillRule="evenodd"
          className={reduced ? "magnus-intro-logo-static" : "magnus-intro-logo"}
        />
        <rect
          height="85"
          width="86"
          y="0"
          x="310"
          className={reduced ? "magnus-intro-logo-static" : "magnus-intro-logo"}
        />
        <path
          d="M 309 254 L 396 254 L 396 171 L 309 85 Z"
          className={reduced ? "magnus-intro-logo-static" : "magnus-intro-logo"}
        />
      </g>
    </svg>
  );
}
