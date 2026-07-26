"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bookmark,
  Heart,
  Lightbulb,
  MessageCircle,
  BadgeCheck,
  ExternalLink,
} from "lucide-react";
import type { FeedComment, FeedPost, FeedReaction } from "@/types/feed";
import {
  commentCountFromList,
  formatFeedTime,
  getPostComments,
} from "@/lib/feed";
import { peopleDirectory } from "@/lib/people-data";
import { linkPreviewImage } from "@/lib/og";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

interface FeedPostCardProps {
  post: FeedPost;
  index?: number;
  nowMs?: number;
  bookmarked?: boolean;
  onBookmarkChange?: (postId: string, bookmarked: boolean) => void;
  /** Open split detail / comments (post body or comment control). */
  onOpenDetail?: (postId: string) => void;
  /** Highlight when this post is focused in the split view */
  isFocused?: boolean;
  /** Controlled comment list (shared with side panel) */
  comments?: FeedComment[];
  onCommentsChange?: (comments: FeedComment[]) => void;
}

function reactionIcon(type: FeedReaction["type"]) {
  if (type === "like") return Heart;
  if (type === "insight") return Lightbulb;
  return Bookmark;
}

function withBookmarkActive(
  reactions: FeedReaction[],
  bookmarked?: boolean
): FeedReaction[] {
  if (bookmarked === undefined) return reactions;
  return reactions.map((r) =>
    r.type === "bookmark" ? { ...r, active: bookmarked } : r
  );
}

export function FeedPostCard({
  post,
  index = 0,
  nowMs,
  bookmarked,
  onBookmarkChange,
  onOpenDetail,
  isFocused,
  comments: controlledComments,
  onCommentsChange,
}: FeedPostCardProps) {
  const seedComments = useMemo(() => getPostComments(post), [post]);
  const [localComments, setLocalComments] =
    useState<FeedComment[]>(seedComments);
  const comments = controlledComments ?? localComments;
  const setComments = onCommentsChange ?? setLocalComments;

  const [reactions, setReactions] = useState(() =>
    withBookmarkActive(post.reactions, bookmarked)
  );
  const [imgFailed, setImgFailed] = useState(false);

  const displayReactions = withBookmarkActive(reactions, bookmarked);
  const commentTotal = commentCountFromList(
    post.comments,
    seedComments.length,
    comments.length
  );

  const toggle = (type: FeedReaction["type"]) => {
    setReactions((prev) =>
      prev.map((r) => {
        if (r.type !== type) return r;
        const wasActive =
          bookmarked !== undefined && type === "bookmark"
            ? bookmarked
            : !!r.active;
        const active = !wasActive;
        return {
          ...r,
          active,
          count: Math.max(0, r.count + (active ? 1 : -1)),
        };
      })
    );

    if (type === "bookmark") {
      const wasActive =
        bookmarked !== undefined
          ? bookmarked
          : !!displayReactions.find((r) => r.type === "bookmark")?.active;
      onBookmarkChange?.(post.id, !wasActive);
    }
  };

  const handleOpen = () => onOpenDetail?.(post.id);
  const time = formatFeedTime(post.createdAt, nowMs);

  return (
    <motion.article
      initial={isFocused || index > 3 ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: isFocused || index > 3 ? 0 : Math.min(index * 0.03, 0.12),
        duration: 0.22,
        ease: easeSpring,
      }}
      onClick={handleOpen}
      className={cn(
        "group relative cursor-pointer rounded-[20px]",
        "border border-[var(--glass-border-soft)]",
        "bg-[var(--glass-strong-solid)]",
        "shadow-[var(--shadow-sm)]",
        "transition-[border-color,box-shadow] duration-200",
        "hover:border-[var(--glass-border)] hover:shadow-[var(--shadow-md)]",
        /* No focus/selection ring — comments panel already signals open state */
        "outline-none"
      )}
      data-feed-post={post.id}
      data-feed-focused={isFocused ? "true" : undefined}
      aria-expanded={isFocused ? true : false}
    >
      <div className="relative overflow-hidden rounded-[20px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[var(--hover-fill)] to-transparent opacity-70"
        />

        <div className="relative px-4 pb-3.5 pt-4 sm:px-5">
          <div className="flex items-start gap-3">
            {(() => {
              const profile = peopleDirectory.find(
                (p) =>
                  p.handle === post.author.handle ||
                  p.name === post.author.name
              );
              const avatar = (
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-[var(--glass-border)] shadow-[var(--shadow-xs)]">
                  {post.author.avatarUrl && !imgFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.author.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={() => setImgFailed(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#4a5568] to-[#1e2530] text-[12px] font-semibold tracking-wide text-white">
                      {post.author.initials}
                    </div>
                  )}
                </div>
              );
              return profile ? (
                <Link
                  href={`/people/${profile.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0"
                  aria-label={`Open ${post.author.name} profile`}
                >
                  {avatar}
                </Link>
              ) : (
                avatar
              );
            })()}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                {(() => {
                  const profile = peopleDirectory.find(
                    (p) =>
                      p.handle === post.author.handle ||
                      p.name === post.author.name
                  );
                  const nameClass =
                    "truncate text-[14px] font-semibold tracking-[-0.015em] text-[var(--text-primary)]";
                  return profile ? (
                    <Link
                      href={`/people/${profile.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(nameClass, "hover:underline")}
                    >
                      {post.author.name}
                    </Link>
                  ) : (
                    <span className={nameClass}>{post.author.name}</span>
                  );
                })()}
                {post.author.verified && (
                  <BadgeCheck
                    className="h-3.5 w-3.5 shrink-0 text-[var(--accent-bright)]"
                    strokeWidth={ICON_STROKE}
                    aria-label="Verified"
                  />
                )}
                <span className="truncate text-[12.5px] text-[var(--text-muted)]">
                  @{post.author.handle}
                </span>
                <span className="text-[var(--text-muted)]">·</span>
                <time
                  dateTime={post.createdAt}
                  className="shrink-0 text-[12.5px] tabular-nums text-[var(--text-muted)]"
                >
                  {time}
                </time>
              </div>
              {(post.author.role || post.author.office) && (
                <p className="mt-0.5 truncate text-[12px] text-[var(--text-secondary)]">
                  {[post.author.role, post.author.office]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {post.headline && (
              <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                {post.headline}
              </h3>
            )}
            <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
              {post.body}
            </p>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {post.media?.kind === "image" && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--glass-border-soft)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.media.src}
                alt={post.media.alt}
                className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          )}

          {post.media?.kind === "video" && (
            <div
              className="mt-3 overflow-hidden rounded-2xl border border-[var(--glass-border-soft)]"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                src={post.media.src}
                poster={post.media.poster}
                controls
                className="aspect-[16/9] w-full bg-black object-cover"
              />
            </div>
          )}

          {post.media?.kind === "link" && (
            <a
              href={post.media.url}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "mt-3 block overflow-hidden rounded-2xl border border-[var(--glass-border-soft)]",
                "bg-[var(--hover-fill)] transition-colors hover:bg-[var(--hover-fill-strong)]"
              )}
              data-link-preview
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={linkPreviewImage(post.media.imageUrl)}
                alt=""
                className="aspect-[1.91/1] w-full object-cover object-center"
              />
              <div className="flex items-center gap-3 px-3.5 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--hover-fill-strong)] text-[var(--text-secondary)]">
                  <ExternalLink
                    className="h-4 w-4"
                    strokeWidth={ICON_STROKE}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                    {post.media.title}
                  </p>
                  <p className="truncate text-[11.5px] text-[var(--text-muted)]">
                    {post.media.domain}
                  </p>
                </div>
              </div>
            </a>
          )}

          <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-[var(--glass-border-soft)] pt-3">
            <div
              className="flex flex-wrap items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              {displayReactions.map((r) => {
                const Icon = reactionIcon(r.type);
                return (
                  <button
                    key={r.type}
                    type="button"
                    onClick={() => toggle(r.type)}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5",
                      "text-[12px] font-medium tabular-nums",
                      "transition-colors duration-150",
                      /* Neutral pill — only the icon takes reaction color */
                      "text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-secondary)]"
                    )}
                    aria-pressed={!!r.active}
                    aria-label={`${r.type} ${r.count}`}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 transition-colors duration-150",
                        r.active &&
                          r.type === "like" &&
                          "fill-current text-rose-400",
                        r.active &&
                          r.type === "insight" &&
                          "fill-current text-amber-400",
                        r.active &&
                          r.type === "bookmark" &&
                          "fill-current text-amber-500",
                        r.active &&
                          r.type !== "like" &&
                          r.type !== "insight" &&
                          r.type !== "bookmark" &&
                          "text-[var(--text-primary)]"
                      )}
                      strokeWidth={ICON_STROKE}
                    />
                    <span
                      className={cn(
                        r.active && "text-[var(--text-secondary)]"
                      )}
                    >
                      {r.count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div
              className="flex items-center gap-0.5 text-[var(--text-muted)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleOpen}
                aria-expanded={!!isFocused}
                aria-label={`Comments ${commentTotal}`}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-full px-2 text-[12px] font-medium",
                  "transition-colors duration-150",
                  isFocused
                    ? "text-[var(--select-text)]"
                    : "hover:bg-[var(--hover-fill)] hover:text-[var(--text-secondary)]"
                )}
                data-open-comments
              >
                <MessageCircle
                  className={cn(
                    "h-3.5 w-3.5 transition-colors duration-150",
                    isFocused && "text-[var(--select-text)]"
                  )}
                  strokeWidth={ICON_STROKE}
                />
                {commentTotal}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/** Expose seed helper for parent-controlled threads */
export function seedCommentsForPost(post: FeedPost): FeedComment[] {
  return getPostComments(post);
}
