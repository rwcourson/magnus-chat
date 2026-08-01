"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ImageIcon, Video, X } from "lucide-react";
import type { FeedCategory, FeedMedia, FeedPost } from "@/types/feed";
import { createFeedPost } from "@/lib/feed";
import { currentUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { easeSpring, pressPrimary, springSnappy } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

const DEMO_IMAGE =
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=960&h=540&fit=crop";
const DEMO_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const DEMO_POSTER =
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=960&h=540&fit=crop";

const AVATAR_URL =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=faces";

/** Soft intent chips — not social categories */
const PROMPTS: { id: FeedCategory; label: string; starter: string }[] = [
  { id: "people", label: "Win", starter: "Quick win: " },
  { id: "safety", label: "Safety", starter: "Safety heads-up: " },
  { id: "company", label: "Question", starter: "Question for the company: " },
  { id: "project", label: "Looking for…", starter: "Looking for help with " },
];

interface FeedComposerProps {
  onSubmit: (post: FeedPost) => void;
  className?: string;
  /** Floating dock at bottom of B&G Live (chat-area principles) */
  docked?: boolean;
}

/**
 * B&G Live share field.
 * Docked mode matches main chat: glass-composer pill, no divider chrome, floating.
 */
export function FeedComposer({
  onSubmit,
  className,
  docked = false,
}: FeedComposerProps) {
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const expandedRef = useRef(false);

  const [expanded, setExpanded] = useState(docked);
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<FeedCategory>("company");
  const [media, setMedia] = useState<FeedMedia | undefined>();
  const [error, setError] = useState<string | null>(null);

  expandedRef.current = expanded;
  const hasDraft = body.trim().length > 0 || Boolean(media);
  const canSend = body.trim().length > 0 || Boolean(media);

  const resize = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [body, resize, expanded, docked]);

  const resetForm = () => {
    setBody("");
    setCategory("company");
    setMedia(undefined);
    setError(null);
  };

  const collapse = (clear = false) => {
    if (docked) {
      if (clear) resetForm();
      setError(null);
      return;
    }
    setExpanded(false);
    setError(null);
    if (clear) resetForm();
  };

  const expand = () => {
    if (expandedRef.current) return;
    setExpanded(true);
  };

  useEffect(() => {
    if (!expanded && !docked) return;
    const t = window.setTimeout(() => bodyRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [expanded, docked]);

  useEffect(() => {
    if (!expanded || docked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      collapse(!hasDraft);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded, hasDraft, docked]);

  useEffect(() => {
    if (!expanded || docked) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (rootRef.current?.contains(t)) return;
      collapse(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [expanded, docked]);

  const applyPrompt = (p: (typeof PROMPTS)[number]) => {
    setCategory(p.id);
    setBody((b) => (b.trim() ? b : p.starter));
    expand();
    window.setTimeout(() => {
      bodyRef.current?.focus();
      resize();
    }, 40);
  };

  const submit = () => {
    if (!expanded && !docked) {
      expand();
      return;
    }
    const post = createFeedPost({
      body,
      category,
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
      setError("Add a short message to share.");
      bodyRef.current?.focus();
      return;
    }
    onSubmit(post);
    collapse(true);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  /* ── Floating docked field (matches main chat Composer) ── */
  if (docked) {
    return (
      <div
        ref={rootRef}
        className={cn("relative w-full min-w-0", className)}
        data-feed-share-strip
        data-feed-composer
        data-company-room-composer
        aria-expanded
      >
        <p id={titleId} className="sr-only">
          Share on B&amp;G Live
        </p>

        <div
          className={cn(
            "glass-composer glass-composer-solid relative min-w-0 overflow-visible",
            "rounded-[26px] px-3 pt-2.5 pb-2 sm:px-3.5"
          )}
        >
          {/* Audience + prompts live inside the glass (not over the feed) */}
          <div
            className="mb-1.5 flex flex-wrap items-center gap-1 px-1"
            data-composer-prompts
          >
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                "bg-[var(--hover-fill-strong)] text-[var(--text-secondary)]"
              )}
            >
              Everyone · B&amp;G
            </span>
            {PROMPTS.map((p) => {
              const active = category === p.id && body.startsWith(p.starter);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPrompt(p)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
                    active
                      ? "bg-[var(--select-fill)] text-[var(--select-text)] shadow-[var(--select-shadow)]"
                      : "bg-[var(--hover-fill)] text-[var(--text-secondary)] hover:bg-[var(--hover-fill-strong)] hover:text-[var(--text-primary)]"
                  )}
                  data-composer-prompt={p.id}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setError(null);
            }}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Share on B&G Live… short is fine."
            className={cn(
              "composer-input w-full min-w-0 resize-none bg-transparent",
              "text-[16px] leading-relaxed text-[var(--text-primary)] sm:text-[15px]",
              "placeholder:text-[var(--text-muted)]",
              "outline-none border-0 px-1.5 py-1 min-h-[28px]"
            )}
            data-composer-body
          />

          {media && (
            <div className="relative mx-1.5 mb-2 overflow-hidden rounded-xl ring-1 ring-[var(--glass-border-soft)]">
              {media.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media.src}
                  alt={media.alt}
                  className="max-h-24 w-full object-cover"
                />
              ) : media.kind === "video" ? (
                <video
                  src={media.src}
                  poster={media.poster}
                  controls
                  className="max-h-28 w-full bg-black"
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
              className="px-1.5 pb-1 text-[12px] text-[#e07070]"
              data-composer-error
            >
              {error}
            </p>
          )}

          <div className="mt-1.5 flex min-w-0 items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() =>
                  setMedia({
                    kind: "image",
                    src: DEMO_IMAGE,
                    alt: "Attached photo",
                  })
                }
                className={iconBtn}
                title="Add photo"
                aria-label="Add photo"
                data-composer-attach-image
              >
                <ImageIcon className="h-4 w-4" strokeWidth={ICON_STROKE} />
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
                className={iconBtn}
                title="Add video"
                aria-label="Add video"
                data-composer-attach-video
              >
                <Video className="h-4 w-4" strokeWidth={ICON_STROKE} />
              </button>
            </div>

            <motion.button
              type="button"
              onClick={submit}
              disabled={!canSend}
              aria-label="Send to B&G Live"
              whileHover={canSend ? pressPrimary.hover : undefined}
              whileTap={canSend ? pressPrimary.tap : undefined}
              transition={springSnappy}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
                canSend
                  ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-bg-hover)]"
                  : "bg-[var(--hover-fill)] text-[var(--text-muted)] opacity-50"
              )}
              data-composer-submit
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Inline / non-docked (legacy expand strip) ── */
  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06, duration: 0.38, ease: easeSpring }}
      className={cn("relative w-full min-w-0", className)}
      data-feed-share-strip
      data-feed-composer
      aria-expanded={expanded}
    >
      {!expanded && (
        <button
          type="button"
          onClick={expand}
          className={cn(
            "glass-composer flex w-full items-center gap-2.5 rounded-[22px] px-3 py-2.5 text-left"
          )}
        >
          <Avatar size={32} />
          <p className="min-w-0 flex-1 text-[13.5px] text-[var(--text-muted)]">
            Share on B&amp;G Live…
          </p>
          <span
            className={cn(
              "inline-flex h-7 shrink-0 items-center rounded-full px-3",
              "bg-[var(--btn-primary-bg)] text-[12px] font-medium text-[var(--btn-primary-fg)]"
            )}
          >
            Share
          </span>
        </button>
      )}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="composer-expanded"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: easeSpring }}
          >
            <div
              className={cn(
                "glass-composer relative min-w-0 overflow-visible",
                "rounded-[26px] px-3 pt-3 pb-2 sm:px-3.5"
              )}
            >
              <p id={titleId} className="sr-only">
                Share on B&amp;G Live
              </p>
              <div className="mb-2 flex flex-wrap items-center gap-1">
                {PROMPTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPrompt(p)}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      "text-[var(--text-muted)] hover:bg-[var(--hover-fill)]"
                    )}
                    data-composer-prompt={p.id}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setError(null);
                }}
                onKeyDown={onKeyDown}
                rows={2}
                placeholder="Share on B&G Live… short is fine."
                className={cn(
                  "composer-input w-full min-w-0 resize-none bg-transparent",
                  "text-[15px] leading-relaxed text-[var(--text-primary)]",
                  "placeholder:text-[var(--text-muted)] outline-none border-0 px-1.5 py-1"
                )}
                data-composer-body
              />
              {error && (
                <p className="px-1.5 text-[12px] text-[#e07070]" data-composer-error>
                  {error}
                </p>
              )}
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setMedia({
                        kind: "image",
                        src: DEMO_IMAGE,
                        alt: "Attached photo",
                      })
                    }
                    className={iconBtn}
                    data-composer-attach-image
                  >
                    <ImageIcon className="h-4 w-4" strokeWidth={ICON_STROKE} />
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
                    className={iconBtn}
                    data-composer-attach-video
                  >
                    <Video className="h-4 w-4" strokeWidth={ICON_STROKE} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => collapse(true)}
                    className="h-8 rounded-full px-2.5 text-[12.5px] font-medium text-[var(--text-muted)] hover:bg-[var(--hover-fill)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={!canSend}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      canSend
                        ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]"
                        : "bg-[var(--hover-fill)] text-[var(--text-muted)] opacity-50"
                    )}
                    data-composer-submit
                  >
                    <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const iconBtn = cn(
  "inline-flex h-8 w-8 items-center justify-center rounded-full",
  "text-[var(--text-muted)] transition-colors",
  "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
);

function Avatar({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={AVATAR_URL}
      alt=""
      width={size}
      height={size}
      className={cn(
        "shrink-0 rounded-lg object-cover ring-1 ring-[var(--glass-border-soft)]",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
