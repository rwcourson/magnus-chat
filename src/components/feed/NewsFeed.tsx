"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Hash } from "lucide-react";
import type { FeedComment, FeedPost } from "@/types/feed";
import { feedCategories, feedPosts } from "@/lib/feed-data";
import {
  filterFeedByCategory,
  getPostComments,
  prependFeedPost,
} from "@/lib/feed";
import { FeedPostCard } from "@/components/feed/FeedPostCard";
import { FeedComposer } from "@/components/feed/FeedComposer";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";
import { currentUser } from "@/lib/mock-data";
import { useScout } from "@/context/ScoutContext";

type CategoryId = (typeof feedCategories)[number]["id"];

/** Soft room topics (no “Insights” social filter) */
const ROOM_TOPICS = feedCategories.filter(
  (c) => c.id !== "insight"
) as { id: CategoryId; label: string }[];

/**
 * B&G Live — chat-native company-wide conversation.
 * One open stream, not a social media feed.
 */
export function NewsFeed({
  posts: initialPosts = feedPosts,
  nowMs,
}: {
  posts?: FeedPost[];
  nowMs?: number;
}) {
  const searchParams = useSearchParams();
  const postParam = searchParams.get("post");
  const { publishedFeedPosts } = useScout();

  const [posts, setPosts] = useState(initialPosts);
  const [view, setView] = useState<CategoryId>("all");
  /** Which message has the inline reply thread open */
  const [selectedId, setSelectedId] = useState<string | null>(postParam);
  const [threads, setThreads] = useState<Record<string, FeedComment[]>>({});

  /** Deep link /feed?post=id — open inline thread */
  useEffect(() => {
    if (!postParam || !posts.some((p) => p.id === postParam)) return;
    setSelectedId(postParam);
    const t = window.setTimeout(() => {
      const row = document.querySelector<HTMLElement>(
        `[data-feed-post="${postParam}"]`
      );
      row?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [postParam, posts]);

  /** Story desk publishes land at the top of the room */
  useEffect(() => {
    if (publishedFeedPosts.length === 0) return;
    setPosts((prev) => {
      let next = prev;
      for (const p of [...publishedFeedPosts].reverse()) {
        if (next.some((x) => x.id === p.id)) continue;
        next = prependFeedPost(next, p);
      }
      return next;
    });
  }, [publishedFeedPosts]);

  const onComposerSubmit = useCallback((post: FeedPost) => {
    setPosts((prev) => prependFeedPost(prev, post));
    setView("all");
  }, []);

  const visible = useMemo(
    () => filterFeedByCategory(posts, view),
    [posts, view]
  );

  const getThread = useCallback(
    (post: FeedPost) => threads[post.id] ?? getPostComments(post),
    [threads]
  );

  const setThread = useCallback((postId: string, next: FeedComment[]) => {
    setThreads((prev) => ({ ...prev, [postId]: next }));
  }, []);

  const toggleThread = useCallback((postId: string) => {
    setSelectedId((cur) => (cur === postId ? null : postId));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  useEffect(() => {
    if (selectedId && !visible.some((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [visible, selectedId]);

  const sinceLabel = useMemo(() => {
    if (visible.length === 0) return null;
    const newest = visible[0];
    if (!newest) return null;
    const hours =
      ((nowMs ?? Date.now()) - Date.parse(newest.createdAt)) / 3600000;
    if (hours < 24) return `${visible.length} updates in B&G Live`;
    return `${visible.length} messages · company-wide`;
  }, [visible, nowMs]);

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
      data-company-room
    >
      {/*
        Full-stage scroll under a continuous veil — same pattern as ChatView.
        No hard border above the input; fade dissolves into the canvas.
      */}
      <div className="relative z-[1] min-h-0 flex-1">
      <ScrollFade
        className="absolute inset-0"
        size="md"
        hideBottom
        contentClassName="scroll-thin overflow-x-hidden"
      >
        <div className="mx-auto w-full min-w-0 max-w-[640px] px-3 pb-[max(11rem,env(safe-area-inset-bottom)+9.5rem)] pt-5 sm:px-5 sm:pb-44 sm:pt-7">
          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: easeSpring }}
            className="mb-4"
          >
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] px-2.5 py-1 text-[12px] font-semibold tracking-tight text-[var(--text-muted)]">
              <Hash className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
              B&amp;G Live
              <span className="font-normal text-[var(--text-muted)]">·</span>
              <span className="font-medium text-[var(--text-secondary)]">
                Everyone
              </span>
            </div>
            <h1 className="text-[1.45rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-[1.65rem]">
              What&apos;s going on at B&amp;G
            </h1>
            <p className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
              Company-wide live chat — short updates, questions, and heads-ups.
              No algorithm. Say something useful; short is fine.
            </p>
            {sinceLabel && (
              <p className="mt-2 text-[12px] text-[var(--text-muted)]">
                {sinceLabel}
              </p>
            )}
          </motion.header>

          {/* Soft topic filters — room topics, not social tags */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.3, ease: easeSpring }}
            className="mb-3 flex flex-wrap items-center gap-1"
            role="tablist"
            aria-label="Room topics"
          >
            {ROOM_TOPICS.map((c) => {
              const active = view === c.id;
              const label =
                c.id === "all"
                  ? "All"
                  : c.id === "company"
                    ? "General"
                    : c.label;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(c.id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors duration-150",
                    active
                      ? "bg-[var(--select-fill)] text-[var(--select-text)] shadow-[var(--select-shadow)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </motion.div>

          {/* Message stream */}
          <div
            className="flex flex-col"
            role="log"
            aria-label="B&G Live messages"
            aria-live="polite"
            data-company-room-list
          >
            {visible.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--glass-border)] px-4 py-10 text-center text-[13px] text-[var(--text-muted)]">
                Nothing here yet — be the first to share on B&amp;G Live.
              </p>
            ) : (
              visible.map((post, i) => {
                const open = selectedId === post.id;
                return (
                  <div
                    key={post.id}
                    data-feed-expanded-row={open ? post.id : undefined}
                  >
                    <FeedPostCard
                      post={post}
                      index={i}
                      nowMs={nowMs}
                      onOpenDetail={toggleThread}
                      isFocused={open}
                      comments={getThread(post)}
                      onCommentsChange={(c) => setThread(post.id, c)}
                    />
                  </div>
                );
              })
            )}
          </div>

          <p className="mt-6 pb-4 text-center text-[11px] text-[var(--text-muted)]">
            End of B&amp;G Live · {visible.length} message
            {visible.length === 1 ? "" : "s"}
            {" · "}
            {currentUser.name.split(" ")[0]}
          </p>
        </div>
      </ScrollFade>

      {/* Floating composer + continuous veil (no divider line) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end">
        <div
          className="composer-screen-veil absolute inset-x-0 bottom-0 h-[min(28vh,220px)]"
          aria-hidden
        />
        <div
          className="pointer-events-auto relative px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-1.5 sm:px-6"
          data-company-room-composer-dock
        >
          <div className="mx-auto w-full min-w-0 max-w-[640px]">
            <FeedComposer onSubmit={onComposerSubmit} docked />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
