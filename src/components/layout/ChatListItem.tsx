"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { ChatThread } from "@/types/chat";
import { useChat } from "@/context/ChatContext";
import { useToast } from "@/context/ToastContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useMenuPosition } from "@/hooks/useMenuPosition";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

type Variant = "sidebar" | "popout";

/** Minimal chat shape for list rows (full thread or list summary). */
export type ChatListEntry = Pick<
  ChatThread,
  "id" | "title" | "updatedAt" | "preview"
> & { archived?: boolean; private?: boolean };

interface ChatListItemProps {
  chat: ChatListEntry;
  active: boolean;
  variant?: Variant;
  /** Optional entrance index for sidebar stagger */
  index?: number;
  /** Relative time label (popout) */
  timeLabel?: string;
  onSelect: () => void;
  /** Extra class on the outer row */
  className?: string;
}

/**
 * Chat history row with hover ⋮ menu: rename, archive, delete.
 */
export function ChatListItem({
  chat,
  active,
  variant = "sidebar",
  index = 0,
  timeLabel,
  onSelect,
  className,
}: ChatListItemProps) {
  const {
    renameChat,
    setChatPrivate,
    archiveChat,
    unarchiveChat,
    deleteChat,
    restoreChat,
    chats,
  } = useChat();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState(chat.title);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Height must cover Rename + Private + Archive + divider + Delete (~220).
  // prefer "auto" so near-bottom rows open upward, near-top open downward.
  const pos = useMenuPosition(
    menuOpen,
    triggerRef,
    "right",
    6,
    168,
    220,
    "auto"
  );

  /** Mask title until open (or while renaming with the real name). */
  const masked = Boolean(chat.private) && !active && !renaming;
  const displayTitle = masked ? "Private" : chat.title;
  const displayPreview = masked ? "Hidden until opened" : chat.preview;
  const initial = masked ? "·" : chat.title.slice(0, 1).toUpperCase();

  useEffect(() => {
    if (!renaming) setDraft(chat.title);
  }, [chat.title, renaming]);

  useEffect(() => {
    if (renaming) {
      const t = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 20);
      return () => window.clearTimeout(t);
    }
  }, [renaming]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: globalThis.MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t))
        return;
      setMenuOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const commitRename = useCallback(() => {
    const next = draft.trim();
    if (next && next !== chat.title) renameChat(chat.id, next);
    else setDraft(chat.title);
    setRenaming(false);
  }, [chat.id, chat.title, draft, renameChat]);

  const onRenameKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setDraft(chat.title);
      setRenaming(false);
    }
  };

  const openMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen((v) => !v);
  };

  const run = (action: () => void) => (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    action();
  };

  const isPopout = variant === "popout";

  const row = (
    <div
      className={cn(
        "group/chat relative flex w-full items-start rounded-xl text-left",
        "transition-[color,background] duration-150 ease-out",
        isPopout ? "gap-2.5 px-2 py-2" : "gap-3 px-2.5 py-2",
        active
          ? "text-[var(--select-text)]"
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        className
      )}
      data-chat-row={chat.id}
      data-chat-private={chat.private ? "true" : undefined}
      data-chat-masked={masked ? "true" : undefined}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-xl transition-[background,box-shadow] duration-150",
          active
            ? "bg-[var(--select-fill)] shadow-[var(--select-shadow)]"
            : "group-hover/chat:bg-[var(--hover-fill)]"
        )}
      />

      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "relative z-10 flex min-w-0 flex-1 items-start gap-2.5 text-left outline-none rounded-lg",
          !isPopout && "gap-3"
        )}
        aria-current={active ? "true" : undefined}
      >
        <span
          className={cn(
            "mt-0.5 flex shrink-0 items-center justify-center font-semibold",
            isPopout
              ? "h-7 w-7 rounded-lg text-[11px]"
              : "h-5 w-5 rounded-md text-[10px] leading-none",
            "bg-[var(--hover-fill)] text-[var(--text-muted)]",
            "transition-colors duration-150",
            "group-hover/chat:bg-[var(--hover-fill-strong)] group-hover/chat:text-[var(--text-primary)]",
            active && "bg-[var(--hover-fill-strong)] text-[var(--text-primary)]"
          )}
        >
          {masked ? (
            <Lock className="h-3 w-3" strokeWidth={ICON_STROKE} aria-hidden />
          ) : (
            initial
          )}
        </span>

        <span className="min-w-0 flex-1 pr-1">
          {renaming ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={onRenameKey}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "side-label w-full rounded-md border border-[var(--glass-border)]",
                "bg-[var(--glass-strong-solid)] px-1.5 py-0.5",
                "text-[var(--text-primary)] outline-none"
              )}
              aria-label="Rename chat"
              data-chat-rename-input
            />
          ) : (
            <>
              {isPopout ? (
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "side-label truncate text-[var(--text-primary)]",
                      masked && "italic text-[var(--text-muted)]"
                    )}
                  >
                    {displayTitle}
                  </span>
                  {timeLabel && (
                    <span className="shrink-0 text-[10px] tabular-nums text-[var(--text-muted)]">
                      {timeLabel}
                    </span>
                  )}
                </span>
              ) : (
                <span
                  className={cn(
                    "side-label block truncate",
                    masked && "italic text-[var(--text-muted)]"
                  )}
                >
                  {displayTitle}
                </span>
              )}
              {displayPreview && !renaming && (
                <span className="side-preview mt-0.5 block truncate">
                  {displayPreview}
                </span>
              )}
            </>
          )}
        </span>
      </button>

      {/* ⋮ — visible on hover / focus / when menu open */}
      {!renaming && (
        <button
          ref={triggerRef}
          type="button"
          onClick={openMenu}
          aria-label="Chat actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          data-chat-menu-trigger
          className={cn(
            "relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            "text-[var(--text-muted)]",
            "transition-[opacity,background,color,transform] duration-150",
            "hover:bg-[var(--hover-fill-strong)] hover:text-[var(--text-primary)]",
            "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
            menuOpen
              ? "opacity-100 bg-[var(--hover-fill-strong)] text-[var(--text-primary)]"
              : "opacity-0 group-hover/chat:opacity-100 focus-visible:opacity-100"
          )}
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={ICON_STROKE} />
        </button>
      )}

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {menuOpen && pos.ready && (
              <motion.div
                ref={menuRef}
                role="menu"
                aria-label="Chat actions"
                initial={{ opacity: 0, scale: 0.96, y: pos.placement === "above" ? 4 : -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: pos.placement === "above" ? 2 : -2 }}
                transition={{ duration: 0.16, ease: easeSpring }}
                style={{
                  position: "fixed",
                  top: pos.top ?? undefined,
                  bottom: pos.bottom ?? undefined,
                  left: pos.left,
                  zIndex: 200,
                  width: 168,
                  maxHeight: pos.maxHeight,
                  transformOrigin: pos.transformOrigin,
                }}
                className={cn(
                  /* Scroll only if viewport is truly tight — never clip actions */
                  "overflow-y-auto overscroll-contain rounded-xl border border-[var(--glass-border)]",
                  "bg-[var(--glass-strong-solid)] py-1 shadow-[var(--shadow-menu)]",
                  "backdrop-blur-xl"
                )}
                data-chat-menu
              >
                <MenuItem
                  icon={Pencil}
                  label="Rename"
                  onClick={run(() => setRenaming(true))}
                />
                <MenuItem
                  icon={Lock}
                  label={chat.private ? "Show title" : "Make private"}
                  onClick={run(() => {
                    const next = !chat.private;
                    setChatPrivate(chat.id, next);
                    toast({
                      title: next ? "Marked private" : "Title visible",
                      description: next
                        ? "Title shows as Private until you open the chat."
                        : "Title is visible in the list again.",
                      tone: "success",
                      duration: 2200,
                    });
                  })}
                />
                <MenuItem
                  icon={Archive}
                  label={chat.archived ? "Unarchive" : "Archive"}
                  onClick={run(() => {
                    if (chat.archived) {
                      unarchiveChat(chat.id);
                      toast({
                        title: "Chat restored",
                        tone: "success",
                        duration: 2200,
                      });
                      return;
                    }
                    archiveChat(chat.id);
                    toast({
                      title: "Chat archived",
                      action: {
                        label: "Undo",
                        onClick: () => unarchiveChat(chat.id),
                      },
                    });
                  })}
                />
                <div className="my-1 h-px bg-[var(--glass-border-soft)]" />
                <MenuItem
                  icon={Trash2}
                  label="Delete"
                  danger
                  onClick={run(() => setConfirmDelete(true))}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this chat?"
        description={`“${chat.title}” will be removed from history. You can undo for a few seconds.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          const snapshot = chats.find((c) => c.id === chat.id);
          const index = chats.findIndex((c) => c.id === chat.id);
          setConfirmDelete(false);
          deleteChat(chat.id);
          if (snapshot) {
            toast({
              title: "Chat deleted",
              tone: "danger",
              action: {
                label: "Undo",
                onClick: () => restoreChat(snapshot, index >= 0 ? index : 0),
              },
            });
          }
        }}
      />
    </div>
  );

  if (variant === "sidebar" && index >= 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: Math.min(index * 0.015, 0.08),
          duration: 0.2,
          ease: easeSpring,
        }}
      >
        {row}
      </motion.div>
    );
  }

  return row;
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: (e: MouseEvent) => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium",
        "transition-colors duration-100",
        danger
          ? "text-[#e07070] hover:bg-[rgba(224,112,112,0.1)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={ICON_STROKE} />
      {label}
    </button>
  );
}
