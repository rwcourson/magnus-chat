"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NewsStory } from "@/types/home";
import { newsStories as defaultStories } from "@/lib/home-data";
import { PillAction } from "@/components/ui/PillAction";
import { cn } from "@/lib/utils";
import { easeOut } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

interface NewsCarouselProps {
  stories?: NewsStory[];
  /** Auto-advance interval ms; 0 disables */
  autoMs?: number;
  className?: string;
}

/** Long, even crossfade — no spring bounce on photo swaps */
const photoEase = easeOut;
const PHOTO_MS = 0.72;
const COPY_MS = 0.55;

/**
 * Photo-forward news hero — channel “must have” above the fold.
 * Transitions: overlapping opacity crossfade + soft scale so slides feel continuous.
 */
export function NewsCarousel({
  stories = defaultStories,
  autoMs = 7000,
  className,
}: NewsCarouselProps) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const n = stories.length;
  const story = stories[index] ?? stories[0];
  const busyRef = useRef(false);
  const busyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback(
    (nextDir: -1 | 1) => {
      if (n < 2) return;
      // Allow mid-transition re-click but keep direction coherent
      setDir(nextDir);
      setIndex((i) => (i + nextDir + n) % n);
      busyRef.current = true;
      if (busyTimer.current) clearTimeout(busyTimer.current);
      busyTimer.current = setTimeout(() => {
        busyRef.current = false;
      }, PHOTO_MS * 1000 * 0.85);
    },
    [n]
  );

  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!autoMs || n < 2 || paused) return;
    const t = window.setInterval(() => go(1), autoMs);
    return () => window.clearInterval(t);
  }, [autoMs, go, n, index, paused]);

  // Prefetch adjacent images so the next slide never pops in blank
  useEffect(() => {
    if (n < 2 || typeof window === "undefined") return;
    const targets = [
      stories[(index + 1) % n],
      stories[(index - 1 + n) % n],
    ];
    for (const s of targets) {
      if (!s?.imageUrl) continue;
      const img = new window.Image();
      img.src = s.imageUrl;
    }
  }, [index, n, stories]);

  useEffect(
    () => () => {
      if (busyTimer.current) clearTimeout(busyTimer.current);
    },
    []
  );

  if (!story) return null;

  return (
    <section
      className={cn("relative w-full", className)}
      aria-roledescription="carousel"
      aria-label="Company news"
      data-news-carousel
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
    >
      <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
        <div>
          <p className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
            News
          </p>
          <h2 className="mt-0.5 text-[15px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            What&apos;s happening at B&amp;G
          </h2>
        </div>
        <PillAction href="/feed">All news</PillAction>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-[22px]",
          "border border-[var(--glass-border-soft)]",
          "bg-[var(--glass-strong-solid)] shadow-[var(--shadow-md)]"
        )}
      >
        <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
          {/*
            Crossfade stack: exit + enter both paint (mode=sync).
            Slight scale + directional drift keeps motion fluid without a hard cut.
          */}
          <AnimatePresence mode="sync" initial={false} custom={dir}>
            <motion.div
              key={story.id}
              custom={dir}
              initial={{
                opacity: 0,
                scale: 1.045,
                x: dir * 18,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                scale: 1.02,
                x: dir * -14,
              }}
              transition={{
                opacity: { duration: PHOTO_MS, ease: photoEase },
                scale: { duration: PHOTO_MS * 1.05, ease: photoEase },
                x: { duration: PHOTO_MS, ease: photoEase },
              }}
              className="absolute inset-0 will-change-transform"
              style={{ zIndex: 0 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={story.imageUrl}
                alt=""
                draggable={false}
                className="h-full w-full select-none object-cover"
              />
              {/* Clean dark scrim under copy — solid at text band, soft fade into photo */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.78) 28%, rgba(0,0,0,0.42) 52%, rgba(0,0,0,0.12) 72%, transparent 88%)",
                }}
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-x-0 bottom-0 z-[1] p-4 sm:p-6 sm:pb-6">
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={`copy-${story.id}`}
                custom={dir}
                initial={{ opacity: 0, y: 10 * dir }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 * dir }}
                transition={{
                  duration: COPY_MS,
                  ease: photoEase,
                  delay: 0.06,
                }}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium tracking-tight text-white backdrop-blur-md">
                    {story.category}
                  </span>
                  <span className="text-[11.5px] tabular-nums text-white/80">
                    {story.timeLabel}
                  </span>
                  {story.reason && (
                    <span className="hidden text-[11.5px] text-white/70 sm:inline">
                      · {story.reason}
                    </span>
                  )}
                </div>
                <Link href={story.href} className="group block max-w-2xl">
                  <h3 className="text-[1.15rem] font-semibold leading-snug tracking-[-0.025em] text-white drop-shadow-sm sm:text-[1.35rem]">
                    <span className="decoration-white/30 underline-offset-4 group-hover:underline">
                      {story.title}
                    </span>
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-white/92 sm:text-[14px]">
                    {story.summary}
                  </p>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>

          {n > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous story"
                onClick={() => go(-1)}
                className={cn(
                  "absolute left-2 top-1/2 z-[2] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full",
                  "bg-black/35 text-white backdrop-blur-md",
                  "transition-colors duration-200 hover:bg-black/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                )}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={ICON_STROKE} />
              </button>
              <button
                type="button"
                aria-label="Next story"
                onClick={() => go(1)}
                className={cn(
                  "absolute right-2 top-1/2 z-[2] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full",
                  "bg-black/35 text-white backdrop-blur-md",
                  "transition-colors duration-200 hover:bg-black/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                )}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={ICON_STROKE} />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
