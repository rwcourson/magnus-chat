"use client";

import { MessageCircle, X } from "lucide-react";
import type { FeedComment, FeedPost } from "@/types/feed";
import { CommentThread } from "@/components/feed/CommentThread";
import { ICON_STROKE } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface FeedDetailPanelProps {
  post: FeedPost;
  comments: FeedComment[];
  onCommentsChange: (next: FeedComment[]) => void;
  onClose: () => void;
  nowMs?: number;
}

/**
 * Side panel for comments — rendered inside NewsFeed’s animated shell.
 * No own enter/exit motion (parent AnimatePresence owns the transition).
 */
export function FeedDetailPanel({
  post,
  comments,
  onCommentsChange,
  onClose,
  nowMs,
}: FeedDetailPanelProps) {
  return (
    <aside
      className={cn(
        "flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden",
        "rounded-[20px] border border-[var(--glass-border-soft)]",
        "bg-[var(--glass-strong-solid)] shadow-[var(--shadow-md)]"
      )}
      data-feed-detail-panel
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--glass-border-soft)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <MessageCircle
            className="h-4 w-4 shrink-0 text-[var(--text-muted)]"
            strokeWidth={ICON_STROKE}
          />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
              Comments
            </p>
            <p className="truncate text-[11.5px] text-[var(--text-muted)]">
              {post.headline || post.body.slice(0, 48)}
              {(post.headline ? false : post.body.length > 48) ? "…" : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close comments"
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            "text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
          )}
          data-feed-detail-close
        >
          <X className="h-4 w-4" strokeWidth={ICON_STROKE} />
        </button>
      </div>

      <CommentThread
        postId={post.id}
        comments={comments}
        onChange={onCommentsChange}
        nowMs={nowMs}
        pinComposer
        className="min-h-0 flex-1"
      />
    </aside>
  );
}
