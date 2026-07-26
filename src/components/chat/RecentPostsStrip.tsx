"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, MessageCircle } from "lucide-react";
import type { FeedPost } from "@/types/feed";
import { feedPosts } from "@/lib/feed-data";
import { selectRecentPosts } from "@/lib/welcome";
import { formatFeedTime } from "@/lib/feed";
import { PillAction } from "@/components/ui/PillAction";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

interface RecentPostsStripProps {
  posts?: FeedPost[];
  limit?: number;
  nowMs?: number;
  className?: string;
  /** Optional hide control for docked chat empty state */
  onHide?: () => void;
  /** Smaller cards that fit under the composer without clipping */
  compact?: boolean;
}

/**
 * Recent posts under chat empty state.
 * compact: smaller cards, no cutoff; full mode for roomier layouts.
 */
export function RecentPostsStrip({
  posts = feedPosts,
  limit = 4,
  nowMs,
  className,
  onHide,
  compact = false,
}: RecentPostsStripProps) {
  const items = selectRecentPosts(posts, limit);

  if (items.length === 0) return null;

  const header = (
    <div className="mb-2 flex w-full min-w-0 items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
          Recent posts
        </p>
        {!compact && (
          <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
            From the B&amp;G company feed
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {onHide && (
          <PillAction
            size={compact ? "sm" : "md"}
            arrow={false}
            onClick={onHide}
          >
            Hide
          </PillAction>
        )}
        <PillAction href="/feed" size={compact ? "sm" : "md"}>
          Open feed
        </PillAction>
      </div>
    </div>
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.35, ease: easeSpring }}
      className={cn(
        "mx-auto w-full",
        compact ? "max-w-full" : "max-w-[960px]",
        className
      )}
      aria-label="Recent posts"
      id="recent-posts-panel"
      data-recent-posts-strip
      data-compact={compact ? "true" : undefined}
    >
      {/*
        Compact: header matches the card row width. Horizontal gutters
        (px-3 / first-last origin) keep hover scale from clipping outer cards.
      */}
      {compact ? (
        <div className="mx-auto w-max max-w-full">
          <div className="px-3">{header}</div>
          <div
            className={cn(
              /* visible when the row fits; auto only if cards overflow width */
              "overflow-x-auto overflow-y-visible",
              "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            )}
            data-recent-posts-scroller
          >
            <div
              className={cn(
                /* Side pad ≈ card growth at scale 1.035 so first/last aren’t chopped */
                "flex gap-2.5 px-3 py-3",
                "scroll-smooth snap-x snap-mandatory"
              )}
            >
              {items.map((post, i) => (
                <StripCard
                  key={post.id}
                  post={post}
                  index={i}
                  nowMs={nowMs}
                  compact={compact}
                  edge={
                    i === 0
                      ? "start"
                      : i === items.length - 1
                        ? "end"
                        : "middle"
                  }
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {header}
          <div
            className="grid grid-cols-1 gap-3 px-1 py-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            data-recent-posts-scroller
          >
            {items.map((post, i) => (
              <StripCard
                key={post.id}
                post={post}
                index={i}
                nowMs={nowMs}
                compact={compact}
              />
            ))}
          </div>
        </>
      )}
    </motion.section>
  );
}

function StripCard({
  post,
  index,
  nowMs,
  compact,
  edge = "middle",
}: {
  post: FeedPost;
  index: number;
  nowMs?: number;
  compact?: boolean;
  /** Outer cards scale from the inner edge so they don’t clip the strip */
  edge?: "start" | "middle" | "end";
}) {
  const time = formatFeedTime(post.createdAt, nowMs);
  const title = post.headline ?? post.body;
  const likes = post.reactions.find((r) => r.type === "like")?.count ?? 0;
  const hasImage = post.media?.kind === "image";
  const origin =
    edge === "start"
      ? "left center"
      : edge === "end"
        ? "right center"
        : "center center";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.035,
        y: -4,
        zIndex: 20,
        transition: { type: "spring", stiffness: 420, damping: 26, mass: 0.65 },
      }}
      whileTap={{
        scale: 0.985,
        transition: { type: "spring", stiffness: 500, damping: 32 },
      }}
      transition={{
        delay: 0.12 + index * 0.03,
        duration: 0.3,
        ease: easeSpring,
      }}
      style={{ transformOrigin: origin }}
      className={cn(
        "relative",
        /* Fixed compact width so header can match the 4-card row */
        compact
          ? "w-[176px] max-w-[calc(50vw-1rem)] shrink-0 snap-start"
          : undefined
      )}
    >
      <Link
        href={`/feed?post=${encodeURIComponent(post.id)}`}
        className={cn(
          "group flex min-h-0 flex-col overflow-hidden rounded-xl outline-none",
          "border border-[var(--glass-border-soft)]",
          /* Keep one solid surface — bg change under image gradients causes hairline flicker */
          "bg-[var(--glass-strong-solid)]",
          "shadow-[var(--shadow-sm)]",
          "transition-[border-color,box-shadow] duration-200",
          "hover:border-[var(--glass-border)] hover:shadow-[var(--shadow-md)]",
          "focus-visible:border-[var(--select-border)]",
          // Fixed short height so image cards don’t stretch the row
          compact ? "h-full w-full" : "h-[148px]",
          /* Stable layer during parent hover scale */
          "transform-gpu [backface-visibility:hidden]"
        )}
        data-recent-post-card
        data-post-id={post.id}
        aria-label={`Open post: ${title}`}
      >
        {hasImage && post.media?.kind === "image" && (
          <div
            className={cn(
              "relative w-full shrink-0 overflow-hidden",
              /* Overlap body by 1px so subpixel scale never shows a seam */
              "-mb-px",
              compact ? "h-[44px]" : "h-[52px]"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.media.src}
              alt=""
              /* No second scale — parent hover already grows the card (dual scale = flicker) */
              className="pointer-events-none h-full w-full object-cover"
              draggable={false}
            />
            {/* Soft fade only at bottom edge into card surface (same token as bg) */}
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 h-[55%]",
                "bg-gradient-to-t from-[var(--glass-strong-solid)] from-[12%] via-[var(--glass-strong-solid)]/55 via-[45%] to-transparent"
              )}
            />
          </div>
        )}

        <div
          className={cn(
            "relative z-[1] flex min-h-0 flex-1 flex-col",
            "bg-[var(--glass-strong-solid)]",
            compact ? "gap-1 px-2.5 pb-2 pt-1.5" : "gap-1.5 px-3 pb-2.5 pt-2"
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-[#4a5568] to-[#1e2530] font-semibold text-white ring-1 ring-[var(--glass-border)]",
                compact ? "h-6 w-6 text-[8px]" : "h-7 w-7 text-[9px]"
              )}
            >
              {post.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                post.author.initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate font-semibold tracking-tight text-[var(--text-primary)]",
                  compact ? "text-[11.5px]" : "text-[12px]"
                )}
              >
                {post.author.name}
              </p>
              <p
                className={cn(
                  "truncate text-[var(--text-muted)]",
                  compact ? "text-[10px]" : "text-[10.5px]"
                )}
              >
                @{post.author.handle}
                <span className="mx-1 opacity-50">·</span>
                <time dateTime={post.createdAt}>{time}</time>
              </p>
            </div>
          </div>

          <p
            className={cn(
              "min-h-0 font-medium leading-snug tracking-[-0.01em] text-[var(--text-primary)]",
              compact
                ? "line-clamp-2 text-[11.5px]"
                : hasImage
                  ? "line-clamp-1 text-[12.5px]"
                  : "line-clamp-2 text-[12.5px]"
            )}
          >
            {title}
          </p>

          <div
            className={cn(
              "mt-auto flex items-center justify-between gap-2 border-t border-[var(--glass-border-soft)]",
              "pt-1.5"
            )}
          >
            {post.tags?.[0] ? (
              <span
                className={cn(
                  "rounded-full border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] font-medium text-[var(--text-muted)]",
                  compact
                    ? "px-1.5 py-0.5 text-[9px]"
                    : "px-1.5 py-0.5 text-[10px]"
                )}
              >
                {post.tags[0]}
              </span>
            ) : (
              <span />
            )}
            <span
              className={cn(
                "inline-flex items-center tabular-nums text-[var(--text-muted)]",
                compact ? "gap-1.5 text-[10px]" : "gap-2 text-[10.5px]"
              )}
            >
              <span className="inline-flex items-center gap-0.5">
                <Heart
                  className={compact ? "h-2.5 w-2.5" : "h-3 w-3"}
                  strokeWidth={ICON_STROKE}
                />
                {likes}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <MessageCircle
                  className={compact ? "h-2.5 w-2.5" : "h-3 w-3"}
                  strokeWidth={ICON_STROKE}
                />
                {post.comments}
              </span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
