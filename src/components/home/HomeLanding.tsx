"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutGrid, LifeBuoy, ListChecks } from "lucide-react";
import { NewsCarousel } from "@/components/home/NewsCarousel";
import { RecentPostsStrip } from "@/components/chat/RecentPostsStrip";
import { Composer } from "@/components/chat/Composer";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { useChat } from "@/context/ChatContext";
import { useScout } from "@/context/ScoutContext";
import { easeSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";

interface HomeLandingProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

/**
 * Intranet home — company updates hero, room pulse, Ask Magnus.
 */
export function HomeLanding({ onSend, disabled }: HomeLandingProps) {
  const { catchMeUp, isTyping, stopGeneration } = useChat();
  const { publishedStories } = useScout();

  return (
    <div className="relative flex h-full w-full min-h-0 flex-col">
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin overflow-x-hidden"
      >
        <div className="mx-auto w-full min-w-0 max-w-[820px] px-3 pb-[max(7rem,env(safe-area-inset-bottom)+5.5rem)] pt-6 sm:px-6 sm:pb-32 sm:pt-9">
          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeSpring }}
            className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
            data-tour-home
          >
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[var(--text-muted)]">
                Good to see you
              </p>
              <h1 className="mt-0.5 text-[1.65rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-[1.85rem]">
                Your home
              </h1>
              <p className="mt-1.5 max-w-lg text-[14px] leading-relaxed text-[var(--text-secondary)]">
                Official news up top, Live conversation below, Magnus when you
                need help — start here.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={disabled || isTyping}
                onClick={() => catchMeUp()}
                data-catch-me-up
                className={cn(
                  "btn-primary inline-flex items-center gap-1.5 rounded-full px-3.5 py-2",
                  "text-[12.5px] font-semibold",
                  "transition-transform duration-150 active:scale-[0.98]",
                  "disabled:pointer-events-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                )}
              >
                <ListChecks className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Catch me up
              </button>
            </div>
          </motion.header>

          {/* Top hero: recent company news / updates tool */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.42, ease: easeSpring }}
          >
            <NewsCarousel stories={publishedStories} />
          </motion.div>

          <div className="mt-8">
            <RecentPostsStrip />
          </div>

          {/* Thin entry points — apps vs external resources (not a dashboard) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.35, ease: easeSpring }}
            className="mt-6 flex flex-wrap gap-2"
            data-home-apps-resources
          >
            <Link
              href="/apps"
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold",
                "border border-[var(--glass-border-soft)] bg-[var(--glass-strong-solid)]",
                "text-[var(--text-secondary)] shadow-[var(--shadow-xs)]",
                "hover:border-[var(--glass-border)] hover:text-[var(--text-primary)]"
              )}
              data-home-apps-link
            >
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
              Magnus apps
            </Link>
            <Link
              href="/resources"
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold",
                "border border-[var(--glass-border-soft)] bg-[var(--glass-strong-solid)]",
                "text-[var(--text-secondary)] shadow-[var(--shadow-xs)]",
                "hover:border-[var(--glass-border)] hover:text-[var(--text-primary)]"
              )}
              data-home-resources-link
            >
              <LifeBuoy className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
              Employee resources
            </Link>
          </motion.div>

          {/* Sticky-feel ask bar at end of content / always reachable */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4, ease: easeSpring }}
            className="mt-10"
            data-home-ask-magnus
          >
            <div className="mb-2.5 px-0.5">
              <p className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                Ask Magnus
              </p>
              <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
                Knowledge, schedules, drafts — without leaving home.
              </p>
            </div>
            <Composer
              onSend={onSend}
              disabled={disabled}
              isGenerating={isTyping}
              onStop={stopGeneration}
            />
          </motion.div>
        </div>
      </ScrollFade>
    </div>
  );
}
