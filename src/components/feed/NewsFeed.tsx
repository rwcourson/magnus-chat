"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Newspaper } from "lucide-react";
import type { FeedComment, FeedPost } from "@/types/feed";
import { feedCategories, feedPosts } from "@/lib/feed-data";
import {
  filterFeedByCategory,
  getPostComments,
  prependFeedPost,
  sortFeedNewest,
} from "@/lib/feed";
import { FeedPostCard } from "@/components/feed/FeedPostCard";
import { FeedComposer } from "@/components/feed/FeedComposer";
import { FeedDetailPanel } from "@/components/feed/FeedDetailPanel";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { cn } from "@/lib/utils";
import { easeOut, easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";
import { currentUser } from "@/lib/mock-data";
import { useScout } from "@/context/ScoutContext";
import { PERSIST_KEYS, readJson, writeJson } from "@/lib/persist";

type CategoryId = (typeof feedCategories)[number]["id"];
type FeedView = CategoryId | "bookmarks";

function initialBookmarks(posts: FeedPost[]): Set<string> {
  const ids = new Set<string>();
  for (const p of posts) {
    if (p.reactions.some((r) => r.type === "bookmark" && r.active)) {
      ids.add(p.id);
    }
  }
  const saved = readJson<string[]>(PERSIST_KEYS.bookmarks);
  if (Array.isArray(saved)) {
    for (const id of saved) ids.add(id);
  }
  return ids;
}

/** Enter: soft slide-in. Exit: slightly longer fade so layout can hold. */
const panelEnter = {
  duration: 0.36,
  ease: easeSpring,
};
const panelExit = {
  duration: 0.3,
  ease: easeOut,
};
/** Post column width — matches panel exit so collapse feels one motion */
const POST_WIDTH_MS = 320;

/**
 * Full news-feed surface — posts stay in the list; expand in place for comments.
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
  const [view, setView] = useState<FeedView>("all");
  const [bookmarkedIds, setBookmarkedIds] = useState(() =>
    initialBookmarks(initialPosts)
  );
  /** Which post’s comments panel is mounted (content / focus). */
  const [selectedId, setSelectedId] = useState<string | null>(postParam);
  /**
   * Which row keeps split layout. Stays set through panel exit so collapse
   * doesn’t snap the post width / flex row before the fade finishes.
   */
  const [splitId, setSplitId] = useState<string | null>(postParam);
  const [threads, setThreads] = useState<Record<string, FeedComment[]>>({});
  const feedRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<string | null>(selectedId);
  selectedRef.current = selectedId;

  /**
   * Deep link /feed?post=id — open comments and center the expanded row in
   * the feed scroller (not window). Re-run after layout so the side panel
   * doesn’t leave the post sitting too low.
   */
  useEffect(() => {
    if (!postParam || !posts.some((p) => p.id === postParam)) return;

    setSelectedId(postParam);
    setSplitId(postParam);

    const centerPost = (behavior: ScrollBehavior = "smooth") => {
      const row =
        document.querySelector<HTMLElement>(
          `[data-feed-expanded-row="${postParam}"]`
        ) ??
        document.querySelector<HTMLElement>(
          `[data-feed-post="${postParam}"]`
        );
      if (!row) return;

      const scroller = row.closest(
        "[data-scroll-fade-scroller]"
      ) as HTMLElement | null;

      if (!scroller) {
        row.scrollIntoView({ behavior, block: "center", inline: "nearest" });
        return;
      }

      const rowRect = row.getBoundingClientRect();
      const scRect = scroller.getBoundingClientRect();
      const rowMid = rowRect.top + rowRect.height / 2;
      const scMid = scRect.top + scRect.height / 2;
      const delta = rowMid - scMid;
      if (Math.abs(delta) < 4) return;
      scroller.scrollBy({ top: delta, behavior });
    };

    // Immediate (pre-panel), then after split layout / panel paint
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      centerPost("auto");
      raf2 = requestAnimationFrame(() => centerPost("smooth"));
    });
    const t1 = window.setTimeout(() => centerPost("smooth"), 120);
    const t2 = window.setTimeout(() => centerPost("smooth"), 360);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [postParam, posts]);

  useEffect(() => {
    writeJson(PERSIST_KEYS.bookmarks, Array.from(bookmarkedIds));
  }, [bookmarkedIds]);

  /** Story desk → company feed publishes land at the top of the timeline */
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

  const onBookmarkChange = useCallback((postId: string, bookmarked: boolean) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (bookmarked) next.add(postId);
      else next.delete(postId);
      return next;
    });
  }, []);

  const onComposerSubmit = useCallback((post: FeedPost) => {
    setPosts((prev) => prependFeedPost(prev, post));
    setView("all");
  }, []);

  const visible = useMemo(() => {
    if (view === "bookmarks") {
      return sortFeedNewest(posts.filter((p) => bookmarkedIds.has(p.id)));
    }
    return filterFeedByCategory(posts, view);
  }, [posts, view, bookmarkedIds]);

  const getThread = useCallback(
    (post: FeedPost) => threads[post.id] ?? getPostComments(post),
    [threads]
  );

  const setThread = useCallback((postId: string, next: FeedComment[]) => {
    setThreads((prev) => ({ ...prev, [postId]: next }));
  }, []);

  /**
   * Click post: expand if closed, collapse if already open, switch if another.
   * Do not scrollIntoView — that jumps the card; panel grows to the side in place.
   */
  const toggleDetail = useCallback((postId: string) => {
    setSelectedId((cur) => {
      if (cur === postId) {
        // Collapse — keep splitId until panel exit completes
        return null;
      }
      setSplitId(postId);
      return postId;
    });
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedId(null);
  }, []);

  /** After comments panel exit finishes, release split layout (post widens). */
  const onPanelExitComplete = useCallback(() => {
    if (!selectedRef.current) {
      setSplitId(null);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, closeDetail]);

  // Click blank space (or outside post + comments panel) collapses the reply view
  useEffect(() => {
    if (!selectedId && !splitId) return;
    const onPointer = (e: PointerEvent) => {
      if (!selectedRef.current) return; // already closing
      const t = e.target as HTMLElement | null;
      if (!t) return;
      // Stay open when interacting with the open comments panel
      if (t.closest("[data-feed-detail-panel]")) return;
      // Stay open when clicking the focused post card itself
      if (t.closest("[data-feed-post][data-feed-focused='true']")) return;
      // Composer modal / share strip
      if (t.closest("[data-feed-composer]")) return;
      if (t.closest("[data-feed-share-strip]")) return;
      // Another post’s toggle is handled by that card; blank canvas / filters / header → close
      closeDetail();
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [selectedId, splitId, closeDetail]);

  useEffect(() => {
    if (selectedId && !visible.some((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
    if (splitId && !visible.some((p) => p.id === splitId) && !selectedId) {
      setSplitId(null);
    }
  }, [visible, selectedId, splitId]);

  /** Comments open → wider canvas; otherwise center the 680 column */
  const splitMode = Boolean(splitId);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin overflow-x-hidden"
      >
        {/*
          Centered feed column by default (max 680).
          When comments open, widen to 1100 and keep the stack centered.
        */}
        <div
          className={cn(
            "mx-auto w-full min-w-0 px-3 pb-[max(7rem,env(safe-area-inset-bottom)+5.5rem)] pt-5 sm:px-6 sm:pb-32 sm:pt-8",
            "transition-[max-width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            splitMode ? "max-w-[1100px]" : "max-w-[680px]"
          )}
        >
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeSpring }}
            className="mb-6"
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--hover-fill)] bg-[var(--hover-fill)] px-2.5 py-1 text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
              <Newspaper className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
              Feed
            </div>
            <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-[2rem]">
              What&apos;s happening at B&amp;G
            </h1>
            <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
              Project updates, safety notes, and team insights — a calm timeline
              for field and office.
            </p>
          </motion.header>

          <FeedComposer
            onSubmit={onComposerSubmit}
            className={cn(splitMode && "mx-auto")}
          />

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35, ease: easeSpring }}
            className={cn(
              "mb-5 flex max-w-[680px] flex-wrap items-center gap-1.5",
              splitMode && "mx-auto w-full"
            )}
            role="tablist"
            aria-label="Feed filters"
          >
            {feedCategories.map((c) => {
              const active = view === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(c.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors duration-150",
                    active
                      ? "bg-[var(--select-fill)] text-[var(--select-text)] shadow-[var(--select-shadow)]"
                      : "border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {c.label}
                </button>
              );
            })}

            <span
              aria-hidden
              className="mx-0.5 hidden h-4 w-px bg-[var(--glass-border)] sm:inline-block"
            />

            <button
              type="button"
              role="tab"
              aria-selected={view === "bookmarks"}
              onClick={() => setView("bookmarks")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors duration-150",
                view === "bookmarks"
                  ? "bg-[var(--select-fill)] text-[var(--select-text)] shadow-[var(--select-shadow)]"
                  : "border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <Bookmark
                className={cn(
                  "h-3.5 w-3.5",
                  view === "bookmarks" && "fill-current"
                )}
                strokeWidth={ICON_STROKE}
              />
              Bookmarks
              {bookmarkedIds.size > 0 && (
                <span className="tabular-nums text-[var(--text-muted)]">
                  {bookmarkedIds.size}
                </span>
              )}
            </button>
          </motion.div>

          <div
            ref={feedRef}
            className="flex flex-col gap-3.5"
            role="feed"
            aria-label="News feed"
          >
            {visible.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[var(--glass-border)] px-4 py-10 text-center text-[13px] text-[var(--text-muted)]">
                {view === "bookmarks"
                  ? "No bookmarks yet. Tap the bookmark on a post to save it here."
                  : "No posts in this category yet."}
              </p>
            ) : (
              visible.map((post, i) => {
                const showPanel = selectedId === post.id;
                const splitLayout = splitId === post.id;
                const focused = showPanel || splitLayout;
                return (
                  <div
                    key={post.id}
                    className={cn(
                      "w-full",
                      focused && "relative z-[2]",
                      /* Non-expanded rows stay on the centered 680 track while one is split */
                      splitMode &&
                        !splitLayout &&
                        "mx-auto max-w-[680px]"
                    )}
                    data-feed-expanded-row={focused ? post.id : undefined}
                  >
                    <div
                      className={cn(
                        "flex flex-col gap-3",
                        /* Hold row layout through exit so panel doesn’t pop out of flow */
                        splitLayout &&
                          "lg:flex-row lg:items-stretch lg:overflow-hidden"
                      )}
                    >
                      {/* Fixed post column while split — width only eases after exit */}
                      <div
                        className={cn(
                          "min-w-0 transition-[width,max-width] ease-[cubic-bezier(0.22,1,0.36,1)]",
                          splitLayout
                            ? "w-full max-w-[680px] lg:w-[480px] lg:max-w-[480px] lg:shrink-0"
                            : "w-full max-w-[680px]"
                        )}
                        style={{
                          transitionDuration: `${POST_WIDTH_MS}ms`,
                        }}
                      >
                        <FeedPostCard
                          post={post}
                          index={i}
                          nowMs={nowMs}
                          bookmarked={bookmarkedIds.has(post.id)}
                          onBookmarkChange={onBookmarkChange}
                          onOpenDetail={toggleDetail}
                          /* Keep focus ring through exit so close doesn’t flash “unselected” mid-fade */
                          isFocused={focused}
                          comments={getThread(post)}
                          onCommentsChange={(c) => setThread(post.id, c)}
                        />
                      </div>

                      <AnimatePresence
                        initial={false}
                        onExitComplete={onPanelExitComplete}
                      >
                        {showPanel && (
                          <motion.div
                            key={`panel-${post.id}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{
                              opacity: 1,
                              x: 0,
                              transition: panelEnter,
                            }}
                            exit={{
                              opacity: 0,
                              x: 14,
                              transition: panelExit,
                            }}
                            className={cn(
                              "flex min-h-[320px] min-w-0 flex-1",
                              "lg:min-h-[min(70vh,560px)] lg:origin-right"
                            )}
                          >
                            <FeedDetailPanel
                              post={post}
                              comments={getThread(post)}
                              onCommentsChange={(c) => setThread(post.id, c)}
                              onClose={closeDetail}
                              nowMs={nowMs}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <p className="mt-8 text-center text-[11px] text-[var(--text-muted)]">
            End of feed · {visible.length} post
            {visible.length === 1 ? "" : "s"}
            {" · "}
            {currentUser.name.split(" ")[0]}
          </p>
        </div>
      </ScrollFade>
    </div>
  );
}
