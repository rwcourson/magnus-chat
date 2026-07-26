"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AtSign,
  Check,
  Copy,
  MessageSquareText,
  Pencil,
  X,
} from "lucide-react";
import { useMessaging } from "@/context/MessagingContext";
import { useToast } from "@/context/ToastContext";
import {
  attachmentFromFile,
  revokeAttachmentPreviews,
} from "@/lib/messaging";
import type { MessageAttachment, TeamMessage } from "@/types/messaging";
import { PersonHoverCard } from "@/components/social/PersonHoverCard";
import { MagnusLogo } from "@/components/brand/MagnusLogo";
import { MentionPicker } from "@/components/messaging/MentionPicker";
import {
  AttachmentChips,
  FileAttachButton,
} from "@/components/messaging/MessageAttachments";
import {
  plainTeamMessageText,
  TeamMessageBody,
} from "@/components/messaging/TeamMessageBody";
import { useMentionInput } from "@/hooks/useMentionInput";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";

/** Width reserved so the main stage can shift left while the card is open */
export const THREAD_PANEL_WIDTH_PX = 380;
export const THREAD_PANEL_GUTTER_PX = 16;

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function MiniMessage({
  message,
  isParent,
  parentMessageId,
}: {
  message: TeamMessage;
  isParent?: boolean;
  /** When editing a reply, parent of the thread */
  parentMessageId?: string;
}) {
  const { editMessage } = useMessaging();
  const { toast } = useToast();
  const isMagnus = message.author.isMagnus || message.author.id === "magnus";
  const isSelf = message.author.id === "self";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);

  const copyBody = async () => {
    try {
      await navigator.clipboard.writeText(
        isMagnus ? plainTeamMessageText(message.body) : message.body
      );
      toast({ title: "Copied", tone: "success", duration: 1800 });
    } catch {
      toast({ title: "Couldn’t copy", tone: "danger" });
    }
  };

  const startEdit = () => {
    setDraft(message.body);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(message.body);
    setEditing(false);
  };

  const saveEdit = () => {
    const next = draft.trim();
    if (!next || next === message.body) {
      setEditing(false);
      return;
    }
    editMessage(message.id, next, {
      parentMessageId: isParent ? undefined : parentMessageId,
    });
    setEditing(false);
    toast({ title: "Message updated", tone: "success", duration: 1600 });
  };

  const avatar = (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--hover-fill-strong)] text-[10px] font-semibold text-[var(--text-muted)]">
      {isMagnus ? (
        <MagnusLogo size={18} tone="sidebar" />
      ) : message.author.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={message.author.avatarUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        message.author.initials
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "group/msg relative flex gap-2.5 rounded-[14px] px-3 py-2.5",
        "border border-transparent transition-colors duration-150",
        /* Soft outline so hover actions sit inside the message frame */
        "hover:border-[var(--glass-border-soft)]",
        isParent &&
          "border-[var(--glass-border-soft)] bg-[var(--hover-fill)]/70"
      )}
      data-thread-message={message.id}
    >
      {!editing && (
        <div
          className={cn(
            /* Inside the message border — no chip / filled backdrop */
            "absolute right-2 top-2 z-10 flex items-center gap-0.5",
            "opacity-0 transition-opacity duration-150",
            "group-hover/msg:opacity-100 focus-within:opacity-100"
          )}
          data-thread-message-actions
        >
          <button
            type="button"
            title="Copy message"
            onClick={copyBody}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md",
              "bg-transparent text-[var(--text-muted)]",
              "hover:text-[var(--text-primary)]"
            )}
            data-message-copy
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
          </button>
          {isSelf && (
            <button
              type="button"
              title="Edit message"
              onClick={startEdit}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md",
                "bg-transparent text-[var(--text-muted)]",
                "hover:text-[var(--text-primary)]"
              )}
              data-message-edit
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
            </button>
          )}
        </div>
      )}

      {avatar}
      <div className="min-w-0 flex-1 pr-7">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
          <PersonHoverCard author={message.author}>
            <span className="text-[13px] font-semibold tracking-tight text-[var(--text-primary)] hover:underline">
              {message.author.name}
            </span>
          </PersonHoverCard>
          {isMagnus && (
            <span className="rounded bg-[var(--hover-fill-strong)] px-1 py-px text-[9px] font-medium tracking-tight text-[var(--text-muted)]">
              App
            </span>
          )}
          <time className="text-[11px] tabular-nums text-[var(--text-muted)]">
            {formatTime(message.createdAt)}
          </time>
          {message.editedAt && (
            <span className="text-[11px] text-[var(--text-muted)]">(edited)</span>
          )}
        </div>
        {editing ? (
          <div className="mt-1.5 space-y-2" data-message-edit-form>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              autoFocus
              className={cn(
                "w-full resize-y rounded-xl border border-[var(--glass-border-soft)]",
                "bg-[var(--hover-fill)]/50 px-2.5 py-1.5 text-[13.5px] leading-relaxed",
                "text-[var(--text-primary)] outline-none"
              )}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEdit();
                }
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  saveEdit();
                }
              }}
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={saveEdit}
                disabled={!draft.trim()}
                className="btn-solid inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-semibold disabled:opacity-40"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Save
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-medium text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Cancel
              </button>
            </div>
          </div>
        ) : message.body ? (
          <TeamMessageBody
            body={message.body}
            magnus={isMagnus}
            className="text-[13.5px]"
          />
        ) : null}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2">
            <AttachmentChips items={message.attachments} compact />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Thread as a floating card inside the conversation stage.
 * Bottom composer matches the main channel input (full-width section).
 */
export function ThreadPanel() {
  const { openThreadId, threadParent, closeThread, sendThreadReply } =
    useMessaging();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<MessageAttachment[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const open = Boolean(openThreadId && threadParent);
  const replyCount = threadParent?.threadReplies?.length ?? 0;

  const mention = useMentionInput(draft, setDraft, inputRef);

  useEffect(() => {
    if (!open) {
      setDraft("");
      setPending([]);
      return;
    }
    bottomRef.current?.scrollIntoView({ block: "end" });
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [open, threadParent?.threadReplies?.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !mention.open) closeThread();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeThread, mention.open]);

  const onSend = () => {
    if (!draft.trim() && pending.length === 0) return;
    sendThreadReply(draft, pending.length ? pending : undefined);
    setDraft("");
    setPending([]);
  };

  const addFilesFromPicker = (list: FileList | File[]) => {
    const files = Array.from(list);
    if (!files.length) return;
    setPending((p) => [...p, ...files.map((f) => attachmentFromFile(f))]);
  };

  const removePending = (id: string) => {
    setPending((p) => {
      const doomed = p.filter((a) => a.id === id);
      revokeAttachmentPreviews(doomed);
      return p.filter((a) => a.id !== id);
    });
  };

  const insertAt = () => {
    const base = draft.trimEnd();
    const next =
      base.length === 0
        ? "@"
        : /(?:^|[\s])@$/.test(base)
          ? base
          : `${base} @`;
    setDraft(next);
    window.setTimeout(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(next.length, next.length);
      mention.syncCaret();
    }, 0);
  };

  return (
    <AnimatePresence>
      {open && threadParent && (
        <motion.div
          key={threadParent.id}
          role="dialog"
          aria-label="Thread"
          initial={{ opacity: 0, x: 28, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 16, scale: 0.98 }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 34,
            mass: 0.75,
          }}
          className={cn(
            /*
             * Even top/bottom inset on the full messaging column
             * (channel title → composer bottom), same as ChannelDetailsPanel.
             */
            "absolute z-[45] flex flex-col overflow-hidden",
            "inset-y-3 right-3 w-[min(calc(100%-1.5rem),380px)] sm:inset-y-4 sm:right-4",
            "rounded-[22px]",
            "border border-[var(--glass-border-strong)]",
            "bg-[var(--glass-strong-solid)]",
            "shadow-[var(--shadow-glass),0_0_0_1px_var(--glass-border-soft),0_20px_40px_-18px_rgba(15,23,42,0.16)]"
          )}
          data-thread-panel
          data-thread-parent={threadParent.id}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--glass-border-soft)] px-3.5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--hover-fill)] text-[var(--text-secondary)]">
                <MessageSquareText
                  className="h-4 w-4"
                  strokeWidth={ICON_STROKE}
                />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold tracking-tight text-[var(--text-primary)]">
                  Thread
                </p>
                <p className="truncate text-[11.5px] text-[var(--text-muted)]">
                  {replyCount} {replyCount === 1 ? "reply" : "replies"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeThread}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
              data-thread-close
              aria-label="Close thread"
            >
              <X className="h-4 w-4" strokeWidth={ICON_STROKE} />
            </button>
          </div>

          <ScrollFade
            className="min-h-0 flex-1"
            size="sm"
            hideBottom
            contentClassName="scroll-thin px-3 py-2.5"
          >
            <MiniMessage message={threadParent} isParent />
            {(threadParent.threadReplies?.length ?? 0) > 0 && (
              <div className="my-2.5 flex items-center gap-2 px-0.5" aria-hidden>
                <span className="h-px flex-1 bg-[var(--glass-border-soft)]" />
                <span className="text-[10px] font-medium tracking-tight text-[var(--text-muted)]">
                  Replies
                </span>
                <span className="h-px flex-1 bg-[var(--glass-border-soft)]" />
              </div>
            )}
            <div className="space-y-0.5" data-thread-replies>
              {(threadParent.threadReplies ?? []).map((r) => (
                <MiniMessage
                  key={r.id}
                  message={r}
                  parentMessageId={threadParent.id}
                />
              ))}
            </div>
            <div ref={bottomRef} />
          </ScrollFade>

          {/*
            Floating composer — same language as main channel:
            soft bottom padding, rounded pill shell, tools row under textarea.
          */}
          <div
            className="relative shrink-0 border-t border-[var(--glass-border-soft)]"
            data-thread-composer-dock
          >
            <div className="px-3 pb-3 pt-2.5">
              {pending.length > 0 && (
                <div className="mb-2">
                  <AttachmentChips
                    items={pending}
                    onRemove={removePending}
                    compact
                  />
                </div>
              )}

              <div
                className={cn(
                  "glass-composer relative w-full overflow-visible",
                  "rounded-[22px] px-3 pb-2 pt-2.5"
                )}
                data-thread-composer
              >
                <MentionPicker
                  open={mention.open}
                  candidates={mention.candidates}
                  activeIndex={mention.activeIndex}
                  onActiveIndexChange={mention.setActiveIndex}
                  onSelect={mention.onSelect}
                  placement="above"
                  align="center"
                />
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={mention.onChange}
                  onClick={mention.syncCaret}
                  onKeyUp={mention.syncCaret}
                  onSelect={mention.syncCaret}
                  onKeyDown={(e) => {
                    if (mention.onKeyDown(e)) return;
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  rows={1}
                  placeholder="Reply…"
                  className={cn(
                    "composer-input w-full resize-none bg-transparent",
                    "min-h-[28px] px-1.5 py-1 text-[14.5px] leading-relaxed",
                    "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                    "outline-none border-0"
                  )}
                  data-thread-input
                />
                <div className="mt-1 flex w-full items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={insertAt}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-full",
                        "text-[var(--text-secondary)] transition-colors",
                        "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                      )}
                      title="Mention someone"
                      aria-label="Mention someone"
                      data-thread-mention
                    >
                      <AtSign className="h-4 w-4" strokeWidth={ICON_STROKE} />
                    </button>
                    <FileAttachButton
                      onFiles={addFilesFromPicker}
                      label=""
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onSend}
                    disabled={!draft.trim() && pending.length === 0}
                    className={cn(
                      "btn-primary inline-flex h-8 shrink-0 items-center justify-center rounded-full px-3.5",
                      "text-[12.5px] font-semibold disabled:opacity-40"
                    )}
                    data-thread-send
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
