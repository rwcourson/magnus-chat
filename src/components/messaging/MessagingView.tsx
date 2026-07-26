"use client";

import { useEffect, useRef, useState } from "react";
import {
  AtSign,
  Check,
  Copy,
  MessagesSquare,
  Pencil,
  X,
} from "lucide-react";
import { useMessaging } from "@/context/MessagingContext";
import { useChat } from "@/context/ChatContext";
import { useToast } from "@/context/ToastContext";
import {
  attachmentFromFile,
  displayName,
  resolveConversationIdentity,
  revokeAttachmentPreviews,
  threadReplyCount,
} from "@/lib/messaging";
import { MAGNUS_AUTHOR } from "@/lib/messaging-data";
import { QUICK_REACTIONS } from "@/types/messaging";
import type { MessageAttachment, TeamMessage } from "@/types/messaging";
import { ScrollFade } from "@/components/ui/ScrollFade";
import {
  ThreadPanel,
  THREAD_PANEL_GUTTER_PX,
  THREAD_PANEL_WIDTH_PX,
} from "@/components/messaging/ThreadPanel";
import {
  ChannelDetailsPanel,
  DETAILS_PANEL_GUTTER_PX,
  DETAILS_PANEL_WIDTH_PX,
} from "@/components/messaging/ChannelDetailsPanel";
import {
  AttachmentChips,
  FileAttachButton,
} from "@/components/messaging/MessageAttachments";
import { MentionPicker } from "@/components/messaging/MentionPicker";
import { ConversationIdentityMark } from "@/components/messaging/ConversationIdentityMark";
import {
  plainTeamMessageText,
  TeamMessageBody,
} from "@/components/messaging/TeamMessageBody";
import { PersonHoverCard } from "@/components/social/PersonHoverCard";
import { MagnusLogo } from "@/components/brand/MagnusLogo";
import { useMentionInput } from "@/hooks/useMentionInput";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";

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



function MessageRow({
  message,
  onReact,
  onOpenThread,
  onEdit,
}: {
  message: TeamMessage;
  onReact: (emoji: string) => void;
  onOpenThread: () => void;
  onEdit: (messageId: string, body: string) => void;
}) {
  const { toast } = useToast();
  const isMagnus = message.author.isMagnus || message.author.id === "magnus";
  const isSelf = message.author.id === "self";
  const replies = threadReplyCount(message);
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
    onEdit(message.id, next);
    setEditing(false);
    toast({ title: "Message updated", tone: "success", duration: 1600 });
  };

  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-lg px-3 py-1.5 transition-colors",
        "hover:bg-[var(--hover-fill)]/70"
      )}
      data-team-message={message.id}
      data-from-magnus={isMagnus ? "true" : undefined}
    >
      {!editing && (
        <div
          className={cn(
            "absolute -top-3 right-3 z-10 flex items-center gap-0.5 rounded-lg",
            "bg-[var(--glass-strong-solid)] p-0.5 shadow-[var(--shadow-sm)]",
            "opacity-0 transition-opacity duration-150",
            "group-hover:opacity-100 focus-within:opacity-100"
          )}
          data-message-actions
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              title={`React ${emoji}`}
              onClick={() => onReact(emoji)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[14px] hover:bg-[var(--hover-fill)]"
              data-react-emoji={emoji}
            >
              {emoji}
            </button>
          ))}
          <span className="mx-0.5 h-4 w-px bg-[var(--hover-fill-strong)]" />
          <button
            type="button"
            title="Reply in thread"
            onClick={onOpenThread}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
            data-message-reply
            data-open-thread
          >
            <MessagesSquare className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
          </button>
          <button
            type="button"
            title="Copy message"
            onClick={copyBody}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
            data-message-copy
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
          </button>
          {isSelf && (
            <button
              type="button"
              title="Edit message"
              onClick={startEdit}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
              data-message-edit
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
            </button>
          )}
        </div>
      )}

      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--hover-fill-strong)] text-[11px] font-semibold text-[var(--text-secondary)]">
        {isMagnus ? (
          <MagnusLogo size={22} tone="sidebar" />
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

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
          <PersonHoverCard author={message.author}>
            <span className="text-[14px] font-semibold tracking-tight text-[var(--text-primary)] hover:underline">
              {message.author.name}
            </span>
          </PersonHoverCard>
          {isMagnus && (
            <span className="rounded bg-[var(--hover-fill-strong)] px-1 py-px text-[10px] font-medium tracking-tight text-[var(--text-muted)]">
              App
            </span>
          )}
          <time
            dateTime={message.createdAt}
            className="text-[11px] tabular-nums text-[var(--text-muted)]"
          >
            {formatTime(message.createdAt)}
          </time>
          {isSelf && (
            <span className="text-[11px] text-[var(--text-muted)]">you</span>
          )}
          {message.editedAt && (
            <span className="text-[11px] text-[var(--text-muted)]">(edited)</span>
          )}
        </div>
        {editing ? (
          <div className="mt-1.5 space-y-2" data-message-edit-form>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
              className={cn(
                "w-full resize-y rounded-xl border border-[var(--glass-border-soft)]",
                "bg-[var(--hover-fill)]/50 px-3 py-2 text-[14px] leading-relaxed",
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
                data-message-edit-save
              >
                <Check className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Save
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-medium text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                data-message-edit-cancel
              >
                <X className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Cancel
              </button>
            </div>
          </div>
        ) : message.body ? (
          <TeamMessageBody body={message.body} magnus={isMagnus} />
        ) : null}

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2">
            <AttachmentChips items={message.attachments} />
          </div>
        )}

        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1" data-reaction-row>
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onReact(r.emoji)}
                data-reaction={r.emoji}
                data-reaction-me={r.me ? "true" : undefined}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] transition-colors",
                  r.me
                    ? "bg-[var(--select-fill)] text-[var(--text-primary)]"
                    : "bg-[var(--hover-fill)] text-[var(--text-secondary)] hover:bg-[var(--hover-fill-strong)]"
                )}
              >
                <span>{r.emoji}</span>
                <span className="tabular-nums font-medium">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {replies > 0 && (
          <button
            type="button"
            onClick={onOpenThread}
            className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            data-thread-count
          >
            <MessagesSquare className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
            {replies} {replies === 1 ? "reply" : "replies"}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Slack-like conversation stage — borderless chrome, side threads, attachments.
 */
export function MessagingView() {
  const {
    activeId,
    activeConversation,
    sendMessage,
    isMagnusTyping,
    toggleReaction,
    openThread,
    openThreadId,
    closeThread,
    editMessage,
  } = useMessaging();
  const { setAppMode } = useChat();

  const [draft, setDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState<MessageAttachment[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mention = useMentionInput(draft, setDraft, inputRef);
  const threadOpen = Boolean(openThreadId);
  const sidePanelOpen = threadOpen || detailsOpen;

  /** Room for floating thread / details card so messages stay readable */
  const stagePadRight = sidePanelOpen
    ? (threadOpen
        ? THREAD_PANEL_WIDTH_PX + THREAD_PANEL_GUTTER_PX * 2
        : DETAILS_PANEL_WIDTH_PX + DETAILS_PANEL_GUTTER_PX * 2)
    : 0;

  // Close details when switching conversations
  useEffect(() => {
    setDetailsOpen(false);
  }, [activeId]);

  // Only one side card at a time
  useEffect(() => {
    if (threadOpen) setDetailsOpen(false);
  }, [threadOpen]);

  useEffect(() => {
    setAppMode("chat");
  }, [setAppMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeConversation?.messages.length, isMagnusTyping, activeId]);

  // Click blank stage closes thread or details
  useEffect(() => {
    if (!threadOpen && !detailsOpen) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest("[data-thread-panel]")) return;
      if (t.closest("[data-channel-details]")) return;
      if (t.closest("[data-messaging-composer]")) return;
      if (t.closest("[data-team-message]")) return;
      if (t.closest("[data-messaging-header]")) return;
      if (t.closest("[data-magnus-typing]")) return;
      if (t.closest("[data-open-channel-details]")) return;
      closeThread();
      setDetailsOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [threadOpen, detailsOpen, closeThread]);

  const onSend = () => {
    if (!draft.trim() && pendingFiles.length === 0) return;
    sendMessage(draft, pendingFiles.length ? pendingFiles : undefined);
    setDraft("");
    // Keep blob previews alive on the sent message; don't revoke here
    setPendingFiles([]);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention.onKeyDown(e)) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const headerIdentity = activeConversation
    ? resolveConversationIdentity(activeConversation)
    : null;
  const title = headerIdentity?.label ?? "Messages";

  const addFilesFromPicker = (list: FileList | File[]) => {
    const files = Array.from(list);
    if (!files.length) return;
    const next = files.map((f) => attachmentFromFile(f));
    setPendingFiles((p) => [...p, ...next]);
  };

  const removePending = (id: string) => {
    setPendingFiles((p) => {
      const doomed = p.filter((a) => a.id === id);
      revokeAttachmentPreviews(doomed);
      return p.filter((a) => a.id !== id);
    });
  };

  return (
    <div
      className="relative flex h-full min-h-0 w-full overflow-hidden"
      data-messaging-shell
    >
      {/*
        Side panels (details / thread) are absolute children of this column so
        their even top/bottom inset spans channel name → composer bottom.
      */}
      <div
        className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        data-messaging-main
      >
        {/* Channel header — flat on canvas, no band / edge under the bar */}
        <header
          className="relative z-[2] flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-5"
          data-messaging-header
        >
          <div
            className="flex min-w-0 items-center gap-2.5"
            data-messaging-header-identity-row
          >
            <button
              type="button"
              onClick={() => {
                if (threadOpen) closeThread();
                setDetailsOpen((v) => !v);
              }}
              className={cn(
                "h-8 w-8 shrink-0 overflow-hidden rounded-lg outline-none",
                "transition-opacity hover:opacity-90",
                detailsOpen && "ring-1 ring-[var(--glass-border)]"
              )}
              data-open-channel-details
              data-open-channel-details-avatar
              aria-expanded={detailsOpen}
              aria-haspopup="dialog"
              title="Channel details"
              aria-label={`${title} details`}
            >
              {headerIdentity ? (
                <ConversationIdentityMark identity={headerIdentity} size={32} />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--hover-fill)] text-[var(--text-muted)]">
                  <MessagesSquare
                    className="h-4 w-4"
                    strokeWidth={ICON_STROKE}
                  />
                </span>
              )}
            </button>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (threadOpen) closeThread();
                  setDetailsOpen((v) => !v);
                }}
                className={cn(
                  "block max-w-full truncate text-left text-[15px] font-semibold tracking-tight",
                  "text-[var(--text-primary)] outline-none",
                  "hover:underline",
                  detailsOpen && "underline"
                )}
                data-open-channel-details
                data-open-channel-details-name
                aria-expanded={detailsOpen}
                aria-haspopup="dialog"
                title="Channel details"
              >
                {title}
              </button>
              {headerIdentity?.subtitle ? (
                <p className="truncate text-[12px] text-[var(--text-muted)]">
                  {headerIdentity.subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        {/*
          Full-stage scroll under one continuous bottom veil (same as chat):
          fade runs from mid-stage solid at the bottom of the screen — no dock gradient edge.
          When a thread is open, content pads right so messages stay visible beside the card.
        */}
        <div className="relative min-h-0 flex-1" data-messaging-stage>
          <div
            className="absolute inset-0 z-[6] transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ paddingRight: stagePadRight }}
            data-messaging-stream
          >
            <ScrollFade
              className="h-full min-h-0"
              size="md"
              hideBottom
              contentClassName="scroll-thin px-1 py-3 sm:px-2"
            >
              {!activeConversation ? (
                <p className="py-16 text-center text-[13px] text-[var(--text-muted)]">
                  Select a channel or DM
                </p>
              ) : (
                <div
                  className="mx-auto max-w-[680px] space-y-0 pb-36"
                  data-message-list
                >
                  <div className="mb-4 flex justify-center px-3">
                    <span className="rounded-full bg-[var(--hover-fill)] px-3 py-1 text-[11px] font-medium tabular-nums text-[var(--text-muted)]">
                      Today
                    </span>
                  </div>

                  {activeConversation.messages.map((m) => (
                    <MessageRow
                      key={m.id}
                      message={m}
                      onReact={(emoji) => toggleReaction(m.id, emoji)}
                      onOpenThread={() => openThread(m.id)}
                      onEdit={(id, body) => editMessage(id, body)}
                    />
                  ))}
                  {isMagnusTyping && (
                    <div
                      className="flex items-center gap-2 px-3 py-2 text-[12.5px] text-[var(--text-muted)]"
                      data-magnus-typing
                    >
                      <MagnusLogo size={16} tone="sidebar" />
                      {MAGNUS_AUTHOR.name} is thinking…
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </ScrollFade>
          </div>

          {/* Continuous veil: transparent above → solid under composer */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex min-h-[min(38vh,280px)] flex-col justify-end"
            data-messaging-composer-dock
            style={{
              paddingRight: stagePadRight,
              transition: "padding-right 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <div className="composer-screen-veil" aria-hidden />
            <div
              className="pointer-events-auto relative mx-auto w-full min-w-0 max-w-[680px] px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-2 sm:px-4 sm:pb-4"
              data-messaging-composer-column
            >
              <div
                className={cn(
                  /* Same shell language as main Ask Magnus composer */
                  "glass-composer relative overflow-visible",
                  "rounded-[26px] px-3.5 pb-2 pt-3"
                )}
                data-messaging-composer
              >
                <MentionPicker
                  open={mention.open}
                  candidates={mention.candidates}
                  activeIndex={mention.activeIndex}
                  onActiveIndexChange={mention.setActiveIndex}
                  onSelect={mention.onSelect}
                  placement="above"
                />
                {pendingFiles.length > 0 && (
                  <div className="mb-2 px-1">
                    <AttachmentChips
                      items={pendingFiles}
                      onRemove={removePending}
                    />
                  </div>
                )}
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={mention.onChange}
                  onClick={mention.syncCaret}
                  onKeyUp={mention.syncCaret}
                  onSelect={mention.syncCaret}
                  onKeyDown={onKeyDown}
                  rows={1}
                  placeholder={
                    activeConversation
                      ? `Message ${displayName(activeConversation)}`
                      : "Message…"
                  }
                  className={cn(
                    "composer-input w-full resize-none bg-transparent",
                    "min-h-[28px] px-1.5 py-1 text-[15px] leading-relaxed",
                    "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                    "outline-none border-0"
                  )}
                  data-messaging-input
                />
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
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
                      }}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-full",
                        "text-[var(--text-secondary)] transition-colors",
                        "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                      )}
                      data-mention-magnus
                      title="Mention someone"
                      aria-label="Mention someone"
                    >
                      <AtSign
                        className="h-4 w-4"
                        strokeWidth={ICON_STROKE}
                      />
                    </button>
                    <FileAttachButton
                      onFiles={addFilesFromPicker}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-full !px-0",
                        "text-[var(--text-secondary)]"
                      )}
                      label=""
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onSend}
                    disabled={!draft.trim() && pendingFiles.length === 0}
                    className={cn(
                      "btn-primary inline-flex h-9 shrink-0 items-center justify-center rounded-full px-4",
                      "text-[13px] font-semibold disabled:opacity-40"
                    )}
                    data-send-message
                  >
                    Send
                  </button>
                </div>
              </div>
              <p className="mt-1.5 px-0.5 text-center text-[11px] text-[var(--text-muted)]">
                Enter send · Shift+Enter newline · @ to mention · Reply opens a
                thread
              </p>
            </div>
          </div>

        </div>

        {/* Even vertical inset relative to full main column (header + stage) */}
        <ThreadPanel />
        <ChannelDetailsPanel
          conversation={activeConversation}
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
        />
      </div>
    </div>
  );
}
