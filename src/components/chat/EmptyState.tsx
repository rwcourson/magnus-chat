"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { MagnusLogo } from "@/components/brand/MagnusLogo";
import { Composer } from "@/components/chat/Composer";
import { RecentPostsStrip } from "@/components/chat/RecentPostsStrip";
import { PillAction } from "@/components/ui/PillAction";
import { useChat } from "@/context/ChatContext";
import { currentUser } from "@/lib/mock-data";
import { welcomeMessage } from "@/lib/welcome";
import { easeSpring, pressChip, springSnappy } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";

interface EmptyStateProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

/** Chips under the composer — Catch me up is first-class scout action. */
const SUGGESTIONS = [
  { label: "Catch me up", action: "catchUp" as const },
  { label: "What's on my calendar today?", action: "calendar" as const },
  { label: "Draft a toolbox talk", action: "send" as const },
] as const;

const postsSpring = {
  type: "spring" as const,
  stiffness: 380,
  damping: 34,
  mass: 0.78,
};

const MOBILE_MQ = "(max-width: 767px)";

/**
 * Chat empty state — composer centers in available space;
 * recent posts dock is compact, never clips, auto-collapses on mobile.
 */
export function EmptyState({ onSend, disabled }: EmptyStateProps) {
  const welcome = welcomeMessage(currentUser.name);
  const router = useRouter();
  const { catchMeUp, isTyping, stopGeneration } = useChat();
  const [postsOpen, setPostsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile: collapse recent posts by default / when crossing into mobile
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const apply = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      if (mobile) setPostsOpen(false);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div className="relative flex h-full w-full min-h-0 flex-col overflow-hidden">
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        {/* Center stage grows into freed space when posts collapse */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-8 sm:py-6">
          {/*
            Opacity-only enter on the stage shell.
            glass-composer / chat-glass must not sit under y/layout transforms.
          */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.32, ease: easeSpring }}
            className="mx-auto flex w-full max-w-[680px] flex-col items-center text-center"
            data-empty-stage
          >
            <div className="mb-1 flex items-center justify-center">
              {/* Navy on light canvas, white on dark */}
              <MagnusLogo size={isMobile ? 44 : 52} tone="sidebar" />
            </div>

            <h1
              className="mt-2 text-[1.55rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-[2rem]"
              data-welcome-heading
            >
              {welcome}
            </h1>

            <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-secondary)] sm:text-[14.5px]">
              What can I help with? Knowledge, schedules, or a quick draft.
            </p>

            <div
              className="relative z-10 mt-5 w-full text-left sm:mt-7"
              data-home-composer
            >
              <Composer
                onSend={onSend}
                disabled={disabled}
                autoFocus
                isGenerating={isTyping}
                onStop={stopGeneration}
              />
            </div>

            <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-2 sm:mt-4">
              {SUGGESTIONS.map((chip, i) => (
                <motion.div
                  key={chip.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: 0.12 + i * 0.04,
                    duration: 0.28,
                    ease: easeSpring,
                  }}
                >
                  <motion.button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (chip.action === "catchUp") catchMeUp();
                      else if (chip.action === "calendar")
                        router.push("/calendar");
                      else onSend(chip.label);
                    }}
                    data-suggestion={
                      chip.action === "catchUp"
                        ? "catch-me-up"
                        : chip.action === "calendar"
                          ? "calendar"
                          : undefined
                    }
                    whileHover={disabled ? undefined : pressChip.hover}
                    whileTap={disabled ? undefined : pressChip.tap}
                    transition={springSnappy}
                    className={cn(
                      "chat-glass chat-glass-interactive rounded-full px-3 py-1.5 sm:px-3.5",
                      "text-[12px] font-medium text-[var(--text-secondary)] sm:text-[12.5px]",
                      "origin-center will-change-transform",
                      "disabled:pointer-events-none disabled:opacity-50",
                      "hover:text-[var(--text-primary)]",
                      chip.action === "catchUp" &&
                        "border-[var(--chat-glass-border-hover)] bg-[var(--chat-glass-bg-hover)] text-[var(--text-primary)]"
                    )}
                  >
                    {chip.label}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent posts dock — compact cards, auto-collapsed on mobile */}
        <div className="relative w-full shrink-0">
          <AnimatePresence initial={false}>
            {postsOpen && (
              <motion.div
                key="posts-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  height: postsSpring,
                  opacity: { duration: 0.2, ease: easeSpring },
                }}
                /*
                  Height collapse still needs a clip box, but side gutters on
                  the strip keep outer-card hover scale inside the clip rect.
                */
                className="overflow-x-clip overflow-y-visible"
              >
                <div className="px-4 pb-4 pt-1 sm:px-8 sm:pb-5">
                  <RecentPostsStrip
                    limit={4}
                    compact
                    onHide={() => setPostsOpen(false)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom pill only when collapsed — expanded uses top-right Hide */}
          {!postsOpen && (
            <div
              className="flex justify-center px-4 pb-3 pt-1 sm:px-6 sm:pb-4"
              data-recent-posts-toggle
            >
              <PillAction
                onClick={() => setPostsOpen(true)}
                icon={ChevronUp}
                arrow={false}
              >
                Show recent posts
              </PillAction>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
