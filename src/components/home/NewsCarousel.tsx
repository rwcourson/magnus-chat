"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react";
import type { NewsStory } from "@/types/home";
import { newsStories as defaultStories } from "@/lib/home-data";
import { cn } from "@/lib/utils";
import { easeOut } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

interface NewsCarouselProps {
  stories?: NewsStory[];
  /** Auto-advance interval ms; 0 disables */
  autoMs?: number;
  className?: string;
}

const photoEase = easeOut;
const PHOTO_MS = 0.55;
const COPY_MS = 0.4;

/**
 * Compact company-updates carousel for home — single slide height, dots only.
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
  const busyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback(
    (nextDir: -1 | 1) => {
      if (n < 2) return;
      setDir(nextDir);
      setIndex((i) => (i + nextDir + n) % n);
      if (busyTimer.current) clearTimeout(busyTimer.current);
      busyTimer.current = setTimeout(() => {}, PHOTO_MS * 1000 * 0.85);
    },
    [n]
  );

  const goTo = useCallback(
    (i: number) => {
      if (i === index || i < 0 || i >= n) return;
      setDir(i > index ? 1 : -1);
      setIndex(i);
    },
    [index, n]
  );

  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!autoMs || n < 2 || paused) return;
    const t = window.setInterval(() => go(1), autoMs);
    return () => window.clearInterval(t);
  }, [autoMs, go, n, index, paused]);

  useEffect(() => {
    if (n < 2 || typeof window === "undefined") return;
    for (const s of [
      stories[(index + 1) % n],
      stories[(index - 1 + n) % n],
    ]) {
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
      aria-label="Official company news"
      data-news-carousel
      data-company-updates
      data-official-news
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
    >
      <div className="mb-2 flex flex-col gap-0.5 px-0.5">
        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
          <Newspaper
            className="h-3.5 w-3.5 shrink-0"
            strokeWidth={ICON_STROKE}
          />
          <p className="text-[12.5px] font-semibold tracking-tight">
            Official company news
          </p>
        </div>
        <p className="text-[11.5px] text-[var(--text-muted)]">
          Broadcast from communications — not the Live conversation
        </p>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "border border-[var(--glass-border-soft)]",
          "bg-[var(--glass-strong-solid)] shadow-[var(--shadow-sm)]"
        )}
      >
        {/* Compact fixed-height slide — carousel only, no list stack */}
        <div className="relative h-[168px] w-full sm:h-[188px]">
          <AnimatePresence mode="sync" initial={false} custom={dir}>
            <motion.div
              key={story.id}
              custom={dir}
              initial={{ opacity: 0, x: dir * 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -12 }}
              transition={{
                opacity: { duration: PHOTO_MS, ease: photoEase },
                x: { duration: PHOTO_MS, ease: photoEase },
              }}
              className="absolute inset-0 will-change-transform"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={story.imageUrl}
                alt=""
                draggable={false}
                className="h-full w-full select-none object-cover"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.28) 68%, transparent 100%)",
                }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Nav chrome at top — never over the copy band */}
          {n > 1 && (
            <div className="absolute inset-x-0 top-0 z-[2] flex items-center justify-between gap-2 p-2.5 sm:p-3">
              <button
                type="button"
                aria-label="Previous update"
                onClick={() => go(-1)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  "bg-black/45 text-white backdrop-blur-md",
                  "transition-colors hover:bg-black/60",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                )}
              >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
              </button>
              <div
                className="flex items-center gap-1 rounded-full bg-black/35 px-2 py-1.5 backdrop-blur-md"
                role="tablist"
                aria-label="Update slides"
              >
                {stories.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Show update ${i + 1}: ${s.title}`}
                    onClick={() => goTo(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200",
                      i === index
                        ? "w-4 bg-white"
                        : "w-1.5 bg-white/45 hover:bg-white/75"
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Next update"
                onClick={() => go(1)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  "bg-black/45 text-white backdrop-blur-md",
                  "transition-colors hover:bg-black/60",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                )}
              >
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
              </button>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 z-[1] p-3.5 pt-8 sm:p-4 sm:pt-10">
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={`copy-${story.id}`}
                custom={dir}
                initial={{ opacity: 0, y: 6 * dir }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 * dir }}
                transition={{ duration: COPY_MS, ease: photoEase }}
              >
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10.5px] font-medium text-white backdrop-blur-md">
                    {story.category}
                  </span>
                  <span className="text-[11px] tabular-nums text-white/75">
                    {story.timeLabel}
                  </span>
                </div>
                <Link href={story.href} className="group block max-w-xl">
                  <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.02em] text-white sm:text-[16px]">
                    <span className="decoration-white/30 underline-offset-2 group-hover:underline">
                      {story.title}
                    </span>
                  </h3>
                  <p className="mt-1 line-clamp-1 text-[12.5px] leading-snug text-white/88 sm:line-clamp-2 sm:text-[13px]">
                    {story.summary}
                  </p>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
