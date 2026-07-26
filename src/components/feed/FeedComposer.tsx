"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImageIcon, Video, X } from "lucide-react";
import type { FeedCategory, FeedMedia, FeedPost } from "@/types/feed";
import { createFeedPost } from "@/lib/feed";
import { feedCategories } from "@/lib/feed-data";
import { currentUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { easeOut, easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

const DEMO_IMAGE =
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=960&h=540&fit=crop";
const DEMO_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const DEMO_POSTER =
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=960&h=540&fit=crop";

const AVATAR_URL =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=faces";

const categories = feedCategories.filter((c) => c.id !== "all") as {
  id: FeedCategory;
  label: string;
}[];

interface FeedComposerProps {
  onSubmit: (post: FeedPost) => void;
  className?: string;
}

/**
 * Inline share strip → condensed X-style expand.
 * Body first; meta + media in one tight toolbar row.
 */
export function FeedComposer({ onSubmit, className }: FeedComposerProps) {
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const expandedRef = useRef(false);

  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState("");
  const [headline, setHeadline] = useState("");
  const [category, setCategory] = useState<FeedCategory>("company");
  const [tagsRaw, setTagsRaw] = useState("");
  const [media, setMedia] = useState<FeedMedia | undefined>();
  const [showTags, setShowTags] = useState(false);
  const [error, setError] = useState<string | null>(null);

  expandedRef.current = expanded;

  const hasDraft =
    body.trim().length > 0 ||
    headline.trim().length > 0 ||
    tagsRaw.trim().length > 0 ||
    Boolean(media);

  const resetForm = () => {
    setBody("");
    setHeadline("");
    setCategory("company");
    setTagsRaw("");
    setMedia(undefined);
    setShowTags(false);
    setError(null);
  };

  const collapse = (clear = false) => {
    setExpanded(false);
    setError(null);
    if (clear) resetForm();
  };

  const expand = () => {
    if (expandedRef.current) return;
    setExpanded(true);
  };

  useEffect(() => {
    if (!expanded) return;
    const t = window.setTimeout(() => bodyRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      collapse(!hasDraft);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded, hasDraft]);

  useEffect(() => {
    if (!expanded) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (rootRef.current?.contains(t)) return;
      collapse(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [expanded]);

  const submit = () => {
    if (!expanded) {
      expand();
      return;
    }
    const post = createFeedPost({
      body,
      headline: headline || undefined,
      category,
      tags: tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      media,
      author: {
        name: currentUser.name,
        handle: "rcourson",
        role: "Platform",
        office: "Birmingham",
        initials: currentUser.initials,
        avatarUrl: AVATAR_URL,
      },
    });
    if (!post) {
      setError("Add a message to post.");
      bodyRef.current?.focus();
      return;
    }
    onSubmit(post);
    collapse(true);
  };

  const toolBtn = cn(
    "inline-flex h-7 items-center justify-center gap-1 rounded-lg px-2",
    "text-[12px] font-medium text-[var(--text-muted)] transition-colors",
    "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
  );

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06, duration: 0.38, ease: easeSpring }}
      className={cn(
        "mb-4 w-full max-w-[680px] rounded-2xl",
        "border border-[var(--glass-border-soft)] bg-[var(--glass-strong-solid)]/90",
        "shadow-[var(--shadow-sm)] backdrop-blur-xl",
        "transition-[border-color,box-shadow] duration-200",
        expanded
          ? "border-[var(--glass-border)] shadow-[var(--shadow-md)]"
          : "hover:border-[var(--glass-border)] hover:shadow-[var(--shadow-md)]",
        className
      )}
      data-feed-share-strip
      data-feed-composer
      aria-expanded={expanded}
    >
      {/* Collapsed strip */}
      {!expanded && (
        <button
          type="button"
          onClick={expand}
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
        >
          <Avatar size={32} />
          <p className="min-w-0 flex-1 text-[13.5px] text-[var(--text-muted)]">
            Share an update with your team…
          </p>
          <span
            className={cn(
              "inline-flex h-7 shrink-0 items-center rounded-full px-3",
              "bg-[var(--btn-primary-bg)] text-[12px] font-medium text-[var(--btn-primary-fg)]"
            )}
          >
            Post
          </span>
        </button>
      )}

      {/* Expanded — dense compose */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="composer-expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: easeSpring }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2.5 pt-3">
              <p id={titleId} className="sr-only">
                Create a post
              </p>

              <div className="flex gap-2.5">
                <Avatar size={32} className="mt-0.5" />
                <div className="min-w-0 flex-1 space-y-2">
                  <textarea
                    ref={bodyRef}
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value);
                      setError(null);
                    }}
                    rows={2}
                    placeholder="Share an update with your team…"
                    className={cn(
                      "w-full resize-none bg-transparent text-[14.5px] leading-snug",
                      "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                      "outline-none"
                    )}
                    data-composer-body
                  />

                  <input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Headline · optional"
                    className={cn(
                      "h-8 w-full rounded-lg bg-[var(--hover-fill)] px-2.5",
                      "text-[13px] text-[var(--text-primary)]",
                      "placeholder:text-[var(--text-muted)] outline-none",
                      "ring-1 ring-transparent transition-[box-shadow] focus:ring-[var(--glass-border-soft)]"
                    )}
                    data-composer-headline
                  />

                  <div
                    className="flex flex-wrap gap-1"
                    role="radiogroup"
                    aria-label="Category"
                  >
                    {categories.map((c) => {
                      const active = category === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setCategory(c.id)}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                            active
                              ? "bg-[var(--select-fill)] text-[var(--select-text)] shadow-[var(--select-shadow)]"
                              : "bg-[var(--hover-fill)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          )}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence initial={false}>
                    {showTags && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: easeOut }}
                        className="overflow-hidden"
                      >
                        <input
                          value={tagsRaw}
                          onChange={(e) => setTagsRaw(e.target.value)}
                          placeholder="Tags · comma-separated"
                          autoFocus
                          className={cn(
                            "h-8 w-full rounded-lg bg-[var(--hover-fill)] px-2.5",
                            "text-[13px] text-[var(--text-primary)]",
                            "placeholder:text-[var(--text-muted)] outline-none",
                            "ring-1 ring-transparent focus:ring-[var(--glass-border-soft)]"
                          )}
                          data-composer-tags
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {media && (
                    <div className="relative overflow-hidden rounded-lg ring-1 ring-[var(--glass-border-soft)]">
                      {media.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={media.src}
                          alt={media.alt}
                          className="max-h-28 w-full object-cover"
                        />
                      ) : media.kind === "video" ? (
                        <video
                          src={media.src}
                          poster={media.poster}
                          controls
                          className="max-h-32 w-full bg-black"
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setMedia(undefined)}
                        className="absolute right-1.5 top-1.5 rounded-full bg-black/55 p-1 text-white"
                        aria-label="Remove media"
                      >
                        <X className="h-3 w-3" strokeWidth={ICON_STROKE} />
                      </button>
                    </div>
                  )}

                  {error && (
                    <p
                      className="text-[12px] text-[#e07070]"
                      data-composer-error
                    >
                      {error}
                    </p>
                  )}
                </div>
              </div>

              {/* Single dense footer toolbar */}
              <div
                className={cn(
                  "mt-2.5 flex items-center gap-0.5 border-t border-[var(--glass-border-soft)] pt-2",
                  "pl-[2.625rem]" /* avatar 32 + gap 10 */
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    setMedia({
                      kind: "image",
                      src: DEMO_IMAGE,
                      alt: "Attached photo",
                    })
                  }
                  className={toolBtn}
                  title="Add photo"
                  data-composer-attach-image
                >
                  <ImageIcon className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                  <span className="hidden sm:inline">Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMedia({
                      kind: "video",
                      src: DEMO_VIDEO,
                      poster: DEMO_POSTER,
                      alt: "Attached video",
                    })
                  }
                  className={toolBtn}
                  title="Add video"
                  data-composer-attach-video
                >
                  <Video className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                  <span className="hidden sm:inline">Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTags((s) => !s)}
                  className={cn(
                    toolBtn,
                    (showTags || tagsRaw.trim()) &&
                      "text-[var(--text-primary)]"
                  )}
                  title="Add tags"
                  aria-pressed={showTags}
                >
                  #
                  <span className="hidden sm:inline">Tags</span>
                </button>

                <div className="min-w-0 flex-1" />

                <button
                  type="button"
                  onClick={() => collapse(true)}
                  className="h-7 rounded-full px-2.5 text-[12.5px] font-medium text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  className={cn(
                    "h-7 rounded-full px-3.5 text-[12.5px] font-medium",
                    "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]",
                    "hover:bg-[var(--btn-primary-bg-hover)]"
                  )}
                  data-composer-submit
                >
                  Post
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Avatar({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-lg",
        "bg-gradient-to-br from-[#4a5568] to-[#1e2530]",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={AVATAR_URL} alt="" className="h-full w-full object-cover" />
    </div>
  );
}
