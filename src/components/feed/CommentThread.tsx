"use client";

import { useMemo, useState } from "react";
import { ImageIcon, Send, Video, X } from "lucide-react";
import type { CommentMedia, FeedAuthor, FeedComment } from "@/types/feed";
import {
  appendFeedComment,
  formatFeedTime,
  getReplies,
  getRootComments,
} from "@/lib/feed";
import { currentUser } from "@/lib/mock-data";
import { AvatarMark } from "@/components/ui/BrandMark";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";

const DEMO_IMAGE =
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=640&h=400&fit=crop";
const DEMO_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const DEMO_POSTER =
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=640&h=360&fit=crop";

const me: FeedAuthor = {
  name: currentUser.name,
  handle: "rcourson",
  initials: currentUser.initials,
  avatarUrl:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=faces",
};

interface CommentThreadProps {
  postId: string;
  comments: FeedComment[];
  onChange: (next: FeedComment[]) => void;
  nowMs?: number;
  /**
   * When true, list and composer are split so a parent can pin the composer
   * outside a scroll fade (no bottom gradient over the input).
   */
  pinComposer?: boolean;
  className?: string;
}

/**
 * Nested comment thread with reply + optional demo photo/video.
 */
export function CommentThread({
  postId,
  comments,
  onChange,
  nowMs,
  pinComposer = false,
  className,
}: CommentThreadProps) {
  const roots = useMemo(() => getRootComments(comments), [comments]);
  const [draft, setDraft] = useState("");
  const [media, setMedia] = useState<CommentMedia | undefined>();
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const submit = () => {
    const next = appendFeedComment(comments, {
      postId,
      body: draft,
      author: me,
      parentId: replyTo ?? undefined,
      media,
    });
    if (next === comments) return;
    onChange(next);
    setDraft("");
    setMedia(undefined);
    setReplyTo(null);
  };

  const attachImage = () => {
    setMedia({
      kind: "image",
      src: DEMO_IMAGE,
      alt: "Attached field photo",
    });
  };

  const attachVideo = () => {
    setMedia({
      kind: "video",
      src: DEMO_VIDEO,
      poster: DEMO_POSTER,
      alt: "Attached site video",
    });
  };

  const replyTarget = replyTo
    ? comments.find((c) => c.id === replyTo)
    : undefined;

  const list = (
    <div className="space-y-3 pt-2" data-comments-list>
      {roots.length === 0 ? (
        <p className="text-center text-[12.5px] text-[var(--text-muted)]">
          No comments yet — be the first.
        </p>
      ) : (
        roots.map((c) => (
          <CommentNode
            key={c.id}
            comment={c}
            replies={getReplies(comments, c.id)}
            nowMs={nowMs}
            onReply={() => {
              setReplyTo(c.id);
            }}
          />
        ))
      )}
    </div>
  );

  const composer = (
    <div className="space-y-2" data-comments-composer>
      {replyTarget && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-[var(--hover-fill)] px-3 py-1.5 text-[11.5px] text-[var(--text-muted)]">
          <span>
            Replying to{" "}
            <span className="font-medium text-[var(--text-secondary)]">
              @{replyTarget.author.handle}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="rounded-md p-0.5 hover:text-[var(--text-primary)]"
            aria-label="Cancel reply"
          >
            <X className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
          </button>
        </div>
      )}

      {media && (
        <div className="relative overflow-hidden rounded-xl border border-[var(--glass-border-soft)]">
          {media.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.src}
              alt={media.alt}
              className="max-h-36 w-full object-cover"
            />
          ) : (
            <video
              src={media.src}
              poster={media.poster}
              controls
              className="max-h-40 w-full bg-black"
            />
          )}
          <button
            type="button"
            onClick={() => setMedia(undefined)}
            className="absolute right-2 top-2 rounded-full bg-black/55 p-1 text-white"
            aria-label="Remove attachment"
          >
            <X className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <AvatarMark src={me.avatarUrl} initials={me.initials} size={32} />
        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] pl-3 pr-1">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={replyTo ? "Write a reply…" : "Leave a comment…"}
            aria-label={replyTo ? "Write a reply" : "Leave a comment"}
            className="h-9 min-w-0 flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            data-comment-input
          />
          <button
            type="button"
            onClick={attachImage}
            aria-label="Attach photo"
            title="Attach demo photo"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--hover-fill-strong)] hover:text-[var(--text-primary)]"
            data-attach-image
          >
            <ImageIcon className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
          </button>
          <button
            type="button"
            onClick={attachVideo}
            aria-label="Attach video"
            title="Attach demo video"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--hover-fill-strong)] hover:text-[var(--text-primary)]"
            data-attach-video
          >
            <Video className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() && !media}
            aria-label="Post comment"
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full",
              "transition-colors duration-150",
              draft.trim() || media
                ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-bg-hover)]"
                : "text-[var(--text-muted)] opacity-50"
            )}
            data-comment-submit
          >
            <Send className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
          </button>
        </div>
      </div>
    </div>
  );

  if (pinComposer) {
    return (
      <div
        className={cn("flex min-h-0 flex-1 flex-col", className)}
        data-comments-panel
        data-pin-composer
      >
        {/* Scroll list only — hideBottom so no fade over the reply bar */}
        <ScrollFade
          className="min-h-0 flex-1"
          size="sm"
          hideBottom
          contentClassName="scroll-thin px-3 pb-2 pt-1"
        >
          {list}
        </ScrollFade>
        <div
          className="shrink-0 border-t border-[var(--glass-border-soft)] bg-[var(--glass-strong-solid)] px-3 py-2.5"
          data-comments-composer-dock
        >
          {composer}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 pt-2", className)} data-comments-panel>
      {list}
      {composer}
    </div>
  );
}

function CommentNode({
  comment,
  replies,
  nowMs,
  onReply,
}: {
  comment: FeedComment;
  replies: FeedComment[];
  nowMs?: number;
  onReply: () => void;
}) {
  return (
    <div className="space-y-2" data-comment-id={comment.id}>
      <CommentBubble comment={comment} nowMs={nowMs} onReply={onReply} />
      {replies.length > 0 && (
        <div className="ml-4 space-y-2 border-l border-[var(--glass-border-soft)] pl-3 sm:ml-6">
          {replies.map((r) => (
            <CommentBubble
              key={r.id}
              comment={r}
              nowMs={nowMs}
              onReply={onReply}
              nested
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentBubble({
  comment,
  nowMs,
  onReply,
  nested,
}: {
  comment: FeedComment;
  nowMs?: number;
  onReply: () => void;
  nested?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-[var(--hover-fill)]/60 px-3 py-2.5",
        nested && "bg-[var(--hover-fill)]/40"
      )}
    >
      <div className="flex gap-2.5">
        <AvatarMark
          src={comment.author.avatarUrl}
          initials={comment.author.initials}
          size={nested ? 28 : 32}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] leading-snug">
            <span className="font-semibold text-[var(--text-primary)]">
              {comment.author.name}
            </span>{" "}
            <span className="text-[var(--text-muted)]">
              @{comment.author.handle}
            </span>{" "}
            <span className="text-[var(--text-muted)]">
              · {formatFeedTime(comment.createdAt, nowMs)}
            </span>
          </p>
          <p className="mt-0.5 text-[13.5px] leading-relaxed text-[var(--text-primary)]">
            {comment.body}
          </p>
          {comment.media?.kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={comment.media.src}
              alt={comment.media.alt}
              className="mt-2 max-h-52 w-full rounded-xl object-cover"
              data-comment-media="image"
            />
          )}
          {comment.media?.kind === "video" && (
            <video
              src={comment.media.src}
              poster={comment.media.poster}
              controls
              className="mt-2 max-h-52 w-full rounded-xl bg-black"
              data-comment-media="video"
            />
          )}
          <button
            type="button"
            onClick={onReply}
            className="mt-1.5 text-[11.5px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            data-comment-reply
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}
