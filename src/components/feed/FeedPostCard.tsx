"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Check,
  ExternalLink,
  Hand,
  Lightbulb,
  MessageCircle,
} from "lucide-react";
import type { FeedComment, FeedPost, FeedReaction } from "@/types/feed";
import {
  commentCountFromList,
  formatFeedTime,
  getPostComments,
} from "@/lib/feed";
import { peopleDirectory } from "@/lib/people-data";
import { linkPreviewImage } from "@/lib/og";
import { CommentThread } from "@/components/feed/CommentThread";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

interface FeedPostCardProps {
  post: FeedPost;
  index?: number;
  nowMs?: number;
  /** Controlled bookmark state from NewsFeed (accepted for API compat). */
  bookmarked?: boolean;
  onBookmarkChange?: (postId: string, bookmarked: boolean) => void;
  /** Open / close inline reply thread */
  onOpenDetail?: (postId: string) => void;
  isFocused?: boolean;
  comments?: FeedComment[];
  onCommentsChange?: (comments: FeedComment[]) => void;
}

/** Soft text reactions — no vanity counts by default */
const REACT_META: Record<
  Exclude<FeedReaction["type"], "bookmark">,
  { label: string; icon: typeof Hand }
> = {
  like: { label: "Thanks", icon: Hand },
  insight: { label: "Helpful", icon: Lightbulb },
};

/**
 * Chat-native B&G Live row — message density, not social card.
 */
export function FeedPostCard({
  post,
  index = 0,
  nowMs,
  bookmarked: _bookmarked,
  onBookmarkChange: _onBookmarkChange,
  onOpenDetail,
  isFocused,
  comments: controlledComments,
  onCommentsChange,
}: FeedPostCardProps) {
  void _bookmarked;
  void _onBookmarkChange;
  const seedComments = useMemo(() => getPostComments(post), [post]);
  const [localComments, setLocalComments] =
    useState<FeedComment[]>(seedComments);
  const comments = controlledComments ?? localComments;
  const setComments = onCommentsChange ?? setLocalComments;

  const [reactions, setReactions] = useState(() =>
    post.reactions.filter((r) => r.type !== "bookmark")
  );
  const [imgFailed, setImgFailed] = useState(false);

  const commentTotal = commentCountFromList(
    post.comments,
    seedComments.length,
    comments.length
  );

  const toggle = (type: FeedReaction["type"]) => {
    if (type === "bookmark") return;
    setReactions((prev) =>
      prev.map((r) => {
        if (r.type !== type) return r;
        const active = !r.active;
        return {
          ...r,
          active,
          count: Math.max(0, r.count + (active ? 1 : -1)),
        };
      })
    );
  };

  const handleOpen = () => onOpenDetail?.(post.id);
  const time = formatFeedTime(post.createdAt, nowMs);
  const place = post.author.office;
  const timeLine = place ? `${time} · ${place}` : time;

  const profile = peopleDirectory.find(
    (p) => p.handle === post.author.handle || p.name === post.author.name
  );

  const avatar = (
    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-[var(--glass-border-soft)]">
      {post.author.avatarUrl && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.author.avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--hover-fill-strong)] text-[11px] font-semibold text-[var(--text-secondary)]">
          {post.author.initials}
        </div>
      )}
    </div>
  );

  const hasMedia = Boolean(post.media);

  return (
    <motion.article
      initial={isFocused || index > 5 ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: isFocused || index > 5 ? 0 : Math.min(index * 0.02, 0.1),
        duration: 0.2,
        ease: easeSpring,
      }}
      className={cn(
        "group relative",
        "border-b border-[var(--glass-border-soft)]",
        "px-1 py-3.5 sm:px-1.5 sm:py-4",
        isFocused && "bg-[var(--hover-fill)]/40"
      )}
      data-feed-post={post.id}
      data-feed-focused={isFocused ? "true" : undefined}
      aria-expanded={isFocused ? true : false}
    >
      <div className="flex gap-2.5 sm:gap-3">
        {profile ? (
          <Link
            href={`/people/${profile.id}`}
            className="shrink-0"
            aria-label={`Open ${post.author.name} profile`}
          >
            {avatar}
          </Link>
        ) : (
          avatar
        )}

        <div className="min-w-0 flex-1">
          {/* Author · time (conversation chrome) */}
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
            {profile ? (
              <Link
                href={`/people/${profile.id}`}
                className="truncate text-[13.5px] font-semibold tracking-[-0.015em] text-[var(--text-primary)] hover:underline"
              >
                {post.author.name}
              </Link>
            ) : (
              <span className="truncate text-[13.5px] font-semibold tracking-[-0.015em] text-[var(--text-primary)]">
                {post.author.name}
              </span>
            )}
            {post.author.verified && (
              <BadgeCheck
                className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]"
                strokeWidth={ICON_STROKE}
                aria-label="Verified"
              />
            )}
            {post.author.role && (
              <span className="truncate text-[12px] text-[var(--text-muted)]">
                {post.author.role}
              </span>
            )}
            {post.sourceKind && post.sourceKind !== "organic" && (
              <span
                className="rounded-full bg-[var(--hover-fill-strong)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                data-feed-source={post.sourceKind}
              >
                {post.sourceLabel ?? post.sourceKind}
              </span>
            )}
            <span className="text-[12px] text-[var(--text-muted)]">·</span>
            <time
              dateTime={post.createdAt}
              className="shrink-0 text-[12px] tabular-nums text-[var(--text-muted)]"
            >
              {timeLine}
            </time>
          </div>

          {/* Message body */}
          <div className="mt-1 space-y-1">
            {post.headline && (
              <p className="text-[13.5px] font-medium tracking-[-0.01em] text-[var(--text-primary)]">
                {post.headline}
              </p>
            )}
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
              {post.body}
            </p>
          </div>

          {/* Soft topic chips — not social hashtags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium text-[var(--text-muted)]"
                >
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}

          {/* Media always visible (chat-native attachment, not collapsed) */}
          {hasMedia && post.media && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              {post.media.kind === "image" && (
                <div className="overflow-hidden rounded-xl border border-[var(--glass-border-soft)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.media.src}
                    alt={post.media.alt}
                    className="max-h-56 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              {post.media.kind === "video" && (
                <div className="overflow-hidden rounded-xl border border-[var(--glass-border-soft)]">
                  <video
                    src={post.media.src}
                    poster={post.media.poster}
                    controls
                    className="max-h-56 w-full bg-black object-cover"
                  />
                </div>
              )}
              {post.media.kind === "link" && (
                <a
                  href={post.media.url}
                  className={cn(
                    "flex items-center gap-2.5 overflow-hidden rounded-xl border border-[var(--glass-border-soft)]",
                    "bg-[var(--hover-fill)] px-3 py-2 transition-colors hover:bg-[var(--hover-fill-strong)]"
                  )}
                  data-link-preview
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={linkPreviewImage(post.media.imageUrl)}
                    alt=""
                    className="h-10 w-14 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-[var(--text-primary)]">
                      {post.media.title}
                    </p>
                    <p className="truncate text-[11px] text-[var(--text-muted)]">
                      {post.media.domain}
                    </p>
                  </div>
                  <ExternalLink
                    className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]"
                    strokeWidth={ICON_STROKE}
                  />
                </a>
              )}
            </div>
          )}

          {/* Actions: soft reacts + reply */}
          <div
            className="mt-2 flex flex-wrap items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {reactions.map((r) => {
              if (r.type === "bookmark") return null;
              const meta = REACT_META[r.type];
              if (!meta) return null;
              const Icon = r.active ? Check : meta.icon;
              return (
                <button
                  key={r.type}
                  type="button"
                  onClick={() => toggle(r.type)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1 rounded-full px-2",
                    "text-[11.5px] font-medium transition-colors duration-150",
                    r.active
                      ? "bg-[var(--select-fill)] text-[var(--select-text)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-secondary)]"
                  )}
                  aria-pressed={!!r.active}
                  aria-label={meta.label}
                  title={
                    r.active
                      ? meta.label
                      : r.count > 0
                        ? `${meta.label} · several people`
                        : meta.label
                  }
                >
                  <Icon className="h-3 w-3" strokeWidth={ICON_STROKE} />
                  <span>{meta.label}</span>
                  {/* Count only after you react (no vanity scoreboard) */}
                  {r.active && r.count > 0 && (
                    <span className="tabular-nums opacity-70">{r.count}</span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleOpen}
              aria-expanded={!!isFocused}
              aria-label={
                commentTotal > 0
                  ? `Replies ${commentTotal}`
                  : "Reply"
              }
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full px-2",
                "text-[11.5px] font-medium transition-colors duration-150",
                isFocused
                  ? "bg-[var(--select-fill)] text-[var(--select-text)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-secondary)]"
              )}
              data-open-comments
            >
              <MessageCircle className="h-3 w-3" strokeWidth={ICON_STROKE} />
              {commentTotal > 0 ? (
                <span className="tabular-nums">{commentTotal}</span>
              ) : (
                <span>Reply</span>
              )}
            </button>
          </div>

          {/* Inline thread — not a magazine side panel */}
          <AnimatePresence initial={false}>
            {isFocused && (
              <motion.div
                key="inline-thread"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: easeSpring }}
                className="overflow-hidden"
                data-feed-inline-thread
              >
                <div
                  className={cn(
                    "mt-3 rounded-2xl border border-[var(--glass-border-soft)]",
                    "bg-[var(--glass-fill)]/80 px-3 pb-3 pt-2 backdrop-blur-sm"
                  )}
                  onClick={(e) => e.stopPropagation()}
                  data-feed-detail-panel
                >
                  <p className="mb-1 px-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                    Thread
                  </p>
                  <CommentThread
                    postId={post.id}
                    comments={comments}
                    onChange={setComments}
                    nowMs={nowMs}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
}

/** Expose seed helper for parent-controlled threads */
export function seedCommentsForPost(post: FeedPost): FeedComment[] {
  return getPostComments(post);
}
