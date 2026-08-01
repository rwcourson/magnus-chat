"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { History, Plus } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { Portal } from "@/components/ui/Portal";
import { RailIconButton } from "@/components/layout/RailItem";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

type Variant = "sidebar" | "sidebar-collapsed" | "header";

type FlyoutPos = { top: number; left: number };

/**
 * Magnus Chat (Plus) + History icon on the right.
 * Hovering the history icon (or the group) opens a clean portal flyout to the right.
 */
export function MagnusChatControl({
  variant = "sidebar",
  onNavigate,
  className,
}: {
  variant?: Variant;
  onNavigate?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    filteredChats,
    activeChatId,
    selectChat,
    newChat,
    setAppMode,
    isNewChatSurface,
  } = useChat();

  const rootRef = useRef<HTMLDivElement>(null);
  const historyBtnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<FlyoutPos | null>(null);
  const closeTimer = useRef<number | null>(null);

  const clearClose = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const measure = useCallback(() => {
    const el = historyBtnRef.current ?? rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 288;
    let left = r.right + 10;
    // Keep on-screen if near right edge
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, r.left - width - 10);
    }
    const maxH = Math.min(360, window.innerHeight * 0.5);
    // Prefer opening upward when control sits near the bottom (footer dock)
    let top = r.bottom - maxH;
    if (top < 12) top = 12;
    if (top + maxH > window.innerHeight - 12) {
      top = Math.max(12, window.innerHeight - maxH - 12);
    }
    setPos({ top, left });
  }, []);

  const show = () => {
    clearClose();
    measure();
    setOpen(true);
  };

  const hide = () => {
    clearClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => () => clearClose(), []);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const onMove = () => measure();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, measure]);

  const openNew = () => {
    setAppMode("chat");
    newChat();
    router.push("/");
    setOpen(false);
    onNavigate?.();
  };

  const openThread = (id: string) => {
    setAppMode("chat");
    selectChat(id);
    router.push("/");
    setOpen(false);
    onNavigate?.();
  };

  // Solid “active” only when the user intentionally opened a blank Magnus Chat —
  // not while Home→Chat is restoring the last channel / surface.
  const isNewActive = isNewChatSurface && activeChatId == null;
  const recent = filteredChats.slice(0, 10);

  const flyout = (
    <Portal>
      <AnimatePresence>
        {open && pos && (
          <motion.div
            key="magnus-hist-flyout"
            role="dialog"
            aria-label="Magnus chat history"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.16, ease: easeSpring }}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              zIndex: 200,
            }}
            className="w-[288px]"
            data-magnus-history-flyout
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <div
              className={cn(
                "overflow-hidden rounded-2xl",
                "border border-[var(--glass-border)]",
                "bg-[var(--glass-strong-solid)] shadow-[var(--shadow-menu)]"
              )}
            >
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <p className="text-[12px] font-semibold tracking-tight text-[var(--text-primary)]">
                  Chat history
                </p>
                <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
                  {filteredChats.length}
                </span>
              </div>

              <div className="scroll-thin max-h-[min(300px,45vh)] overflow-y-auto px-1.5 pb-1.5">
                {recent.length === 0 ? (
                  <p className="px-2.5 py-8 text-center text-[12.5px] text-[var(--text-muted)]">
                    No chats yet
                  </p>
                ) : (
                  <ul className="space-y-0.5" data-magnus-history-list>
                    {recent.map((chat) => {
                      const active =
                        chat.id === activeChatId && pathname === "/";
                      const masked = Boolean(chat.private) && !active;
                      return (
                        <li key={chat.id}>
                          <button
                            type="button"
                            onClick={() => openThread(chat.id)}
                            className={cn(
                              "flex w-full flex-col gap-0.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                              active
                                ? "bg-[var(--select-fill)] text-[var(--select-text)]"
                                : "text-[var(--text-secondary)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                            )}
                            data-history-chat={chat.id}
                            data-chat-masked={masked ? "true" : undefined}
                          >
                            <span
                              className={cn(
                                "truncate text-[13px] font-medium text-[var(--text-primary)]",
                                masked && "italic text-[var(--text-muted)]"
                              )}
                            >
                              {masked ? "Private" : chat.title}
                            </span>
                            {(masked || chat.preview) && (
                              <span className="truncate text-[11.5px] text-[var(--text-muted)]">
                                {masked
                                  ? "Hidden until opened"
                                  : chat.preview}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="px-1.5 pb-1.5">
                <button
                  type="button"
                  onClick={openNew}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--hover-fill)] py-2 text-[12.5px] font-semibold text-[var(--text-primary)] hover:bg-[var(--hover-fill-strong)]"
                  data-history-new
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                  New chat
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );

  /* ── Collapsed rail ── */
  if (variant === "sidebar-collapsed") {
    return (
      <div
        ref={rootRef}
        className={cn("flex w-full flex-col items-center gap-0.5", className)}
        onMouseLeave={hide}
      >
        <RailIconButton
          label="Magnus Chat"
          detail="Start a new AI chat"
          active={isNewActive}
          onClick={openNew}
          data-magnus-chat
        >
          <Plus className="h-4 w-4" strokeWidth={ICON_STROKE} />
        </RailIconButton>
        <RailIconButton
          label="Chat history"
          detail="Recent Magnus threads"
          active={open}
          showFlyout={false}
          onClick={show}
          onMouseEnter={show}
          onFocus={show}
          buttonRef={historyBtnRef}
          data-magnus-history
        >
          <History className="h-4 w-4" strokeWidth={ICON_STROKE} />
        </RailIconButton>
        {flyout}
      </div>
    );
  }

  /* ── Header / sidebar expanded: pill + history icon on the right ── */
  const isHeader = variant === "header";

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex w-full items-center gap-1",
        isHeader && "shrink-0",
        className
      )}
      onMouseLeave={hide}
      data-magnus-chat-control
    >
      <button
        type="button"
        onClick={openNew}
        data-magnus-chat
        data-new-magnus-chat={!isHeader ? undefined : true}
        data-sidebar-ask-magnus={!isHeader ? true : undefined}
        className={cn(
          "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 font-semibold transition-colors",
          isHeader
            ? "h-8 rounded-full px-3 text-[12px] btn-solid"
            : cn(
                "h-9 rounded-xl px-3 text-[13px]",
                isNewActive
                  ? "btn-solid"
                  : "border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] text-[var(--text-primary)] hover:border-[var(--glass-border)] hover:bg-[var(--hover-fill-strong)]"
              )
        )}
      >
        <Plus
          className={cn(isHeader ? "h-3.5 w-3.5" : "h-4 w-4", "shrink-0")}
          strokeWidth={ICON_STROKE}
        />
        <span className={cn(isHeader && "hidden sm:inline")}>Magnus Chat</span>
      </button>

      <button
        ref={historyBtnRef}
        type="button"
        onMouseEnter={show}
        onFocus={show}
        onClick={show}
        data-magnus-history
        title="Chat history"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
          isHeader
            ? cn(
                "h-8 w-8 rounded-full border border-[var(--glass-border-soft)]",
                "text-[var(--text-secondary)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
                open && "bg-[var(--hover-fill)] text-[var(--text-primary)]"
              )
            : cn(
                "border border-[var(--glass-border-soft)]",
                "text-[var(--text-secondary)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
                open && "bg-[var(--hover-fill)] text-[var(--text-primary)]"
              )
        )}
      >
        <History
          className={isHeader ? "h-3.5 w-3.5" : "h-4 w-4"}
          strokeWidth={ICON_STROKE}
        />
      </button>

      {flyout}
    </div>
  );
}
