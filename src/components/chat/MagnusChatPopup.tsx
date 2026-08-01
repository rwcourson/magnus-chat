"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  History,
  ChevronLeft,
  SquarePen,
  Maximize2,
} from "lucide-react";
import { MagnusLogo } from "@/components/brand/MagnusLogo";
import { Composer } from "@/components/chat/Composer";
import { MessageList } from "@/components/chat/MessageList";
import { answerFromKnowledge } from "@/lib/ai/knowledge";
import { useChat } from "@/context/ChatContext";
import type { ChatThread, Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { ICON_STROKE } from "@/lib/icons";
import { easeSpring } from "@/lib/motion";

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatRelative(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

type PanelView = "chat" | "history";

/**
 * Floating “Ask Magnus” pill + popup chat on Feed.
 * Local thread for new messages; can load previous chats from global history.
 */
export function MagnusChatPopup({ className }: { className?: string }) {
  const router = useRouter();
  const { chats, upsertChat, newChat } = useChat();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PanelView>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  /** When set, popup is continuing a global history thread */
  const [sourceChatId, setSourceChatId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  /** Generation id — ignore stale stream results after a newer send */
  const genRef = useRef(0);

  const closePanel = useCallback(() => {
    setOpen(false);
    setView("chat");
  }, []);

  const toggle = useCallback(() => {
    setOpen((v) => {
      if (v) setView("chat");
      return !v;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view === "history") setView("chat");
        else closePanel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, view, closePanel]);

  // Click outside the panel / FAB → collapse
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      // Stay open when interacting with the popup or floating pill
      if (t.closest("[data-magnus-fab-root]")) return;
      // Portaled menus from the popup composer (model / attach)
      if (t.closest("[data-model-menu], [data-attach-menu], [role='listbox'], [role='menu']"))
        return;
      closePanel();
    };
    // Capture so we run before other handlers steal the event
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  }, [open, closePanel]);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setActiveTitle(null);
    setSourceChatId(null);
    setIsTyping(false);
    setView("chat");
  }, []);

  const loadChat = useCallback((thread: ChatThread) => {
    setMessages(thread.messages.map((m) => ({ ...m })));
    setActiveTitle(thread.title);
    setSourceChatId(thread.id);
    setIsTyping(false);
    setView("chat");
  }, []);

  /** Promote popup conversation into the full Chat surface */
  const openInFullChat = useCallback(() => {
    if (messages.length === 0 && !sourceChatId) {
      newChat();
      closePanel();
      router.push("/");
      return;
    }

    const id = sourceChatId ?? uid("chat");
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    const title =
      activeTitle ??
      (messages[0]?.content
        ? messages[0].content.length > 36
          ? `${messages[0].content.slice(0, 34)}…`
          : messages[0].content
        : "Magnus");

    const thread: ChatThread = {
      id,
      title,
      updatedAt: new Date().toISOString(),
      messages: messages.map((m) => ({ ...m })),
      preview: lastAssistant?.content.slice(0, 80) || messages[0]?.content.slice(0, 80),
    };

    upsertChat(thread);
    closePanel();
    router.push(`/?chat=${encodeURIComponent(id)}`);
  }, [
    messages,
    sourceChatId,
    activeTitle,
    upsertChat,
    newChat,
    closePanel,
    router,
  ]);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isTyping) return;

      const userMsg: Message = {
        id: uid("u"),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const history = [...messages, userMsg];
      setMessages(history);
      if (!activeTitle) {
        setActiveTitle(
          trimmed.length > 36 ? `${trimmed.slice(0, 34)}…` : trimmed
        );
      }
      setIsTyping(true);
      const gen = ++genRef.current;

      const assistantId = uid("a");
      const createdAt = new Date().toISOString();

      void (async () => {
        // Prefer AI Gateway stream with feed/popup surface context
        const { streamChatCompletion } = await import("@/lib/ai/stream-client");
        if (gen !== genRef.current) return;

        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: "",
            createdAt,
          },
        ]);

        const result = await streamChatCompletion({
          messages: history,
          surface: "popup",
          onText: (text) => {
            if (gen !== genRef.current) return;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: text } : m
              )
            );
          },
        });

        if (gen !== genRef.current) return;

        if (result.ok) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: result.text,
                    followUps: [
                      "What's on the feed?",
                      "Any safety news?",
                      "Who should I talk to?",
                    ],
                  }
                : m
            )
          );
          setIsTyping(false);
          return;
        }

        // Offline / unconfigured → knowledge-grounded mock (news, feed, etc.)
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        window.setTimeout(() => {
          if (gen !== genRef.current) return;
          const reply = answerFromKnowledge(trimmed, {
            limit: 5,
            surface: "popup",
          });
          setMessages((prev) => [
            ...prev,
            {
              id: uid("a"),
              role: "assistant",
              content: reply,
              createdAt: new Date().toISOString(),
              followUps: [
                "What's on the feed?",
                "Any safety news?",
                "Who should I talk to?",
              ],
            },
          ]);
          setIsTyping(false);
        }, 400 + Math.random() * 400);
      })();
    },
    [isTyping, activeTitle, messages]
  );

  const hasMessages = messages.length > 0;
  const sortedChats = [...chats].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-5 right-5 z-[90] flex max-h-[calc(100dvh-1.25rem)] flex-col items-end sm:bottom-6 sm:right-6",
        className
      )}
      data-magnus-fab-root
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="magnus-popup"
            role="dialog"
            aria-label="Chat with Magnus"
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 34,
              mass: 0.75,
            }}
            className={cn(
              "pointer-events-auto mb-3 flex w-[min(calc(100vw-2.5rem),400px)] flex-col",
              "h-[min(68dvh,540px)] max-h-[calc(100dvh-5.5rem)] overflow-hidden rounded-[22px]",
              /* Soft, clear edge so the panel reads on white / busy feed */
              "border border-[var(--glass-border-strong)]",
              "bg-[var(--glass-strong-solid)]",
              "shadow-[var(--shadow-glass),0_0_0_1px_var(--glass-border-soft)]"
            )}
            data-magnus-popup
          >
            {/* Header */}
            <div className="flex shrink-0 items-center gap-2 border-b border-[var(--glass-border-soft)] px-3 py-2.5">
              {view === "history" ? (
                <button
                  type="button"
                  onClick={() => setView("chat")}
                  aria-label="Back to chat"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={ICON_STROKE} />
                </button>
              ) : (
                <MagnusLogo size={28} tone="white" />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold tracking-tight text-[var(--text-primary)]">
                  {view === "history"
                    ? "Previous chats"
                    : activeTitle ?? "Magnus"}
                </p>
                <p className="truncate text-[11px] text-[var(--text-muted)]">
                  {view === "history"
                    ? `${sortedChats.length} conversation${sortedChats.length === 1 ? "" : "s"}`
                    : activeTitle
                      ? "Continue conversation"
                      : "Ask anything about B&G"}
                </p>
              </div>

              {view === "chat" && (
                <>
                  <button
                    type="button"
                    onClick={openInFullChat}
                    aria-label="Open in full chat"
                    title="Open in full chat"
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      "text-[var(--text-muted)] transition-colors",
                      "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                    )}
                    data-open-full-chat
                  >
                    <Maximize2 className="h-4 w-4" strokeWidth={ICON_STROKE} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("history")}
                    aria-label="See previous chats"
                    title="See previous chats"
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      "text-[var(--text-muted)] transition-colors",
                      "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <History className="h-4 w-4" strokeWidth={ICON_STROKE} />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={closePanel}
                aria-label="Close chat"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" strokeWidth={ICON_STROKE} />
              </button>
            </div>

            {/* Body */}
            <ScrollFade
              className="min-h-0 flex-1"
              size="md"
              contentClassName="scroll-thin"
              color="var(--glass-strong-solid)"
            >
              <AnimatePresence mode="wait" initial={false}>
                {view === "history" ? (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.22, ease: easeSpring }}
                    className="flex h-full flex-col"
                  >
                    <div className="border-b border-[var(--glass-border-soft)] p-2">
                      <button
                        type="button"
                        onClick={startNewChat}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left",
                          "text-[13px] font-medium text-[var(--text-primary)]",
                          "transition-colors hover:bg-[var(--hover-fill)]"
                        )}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--hover-fill-strong)] text-[var(--text-secondary)]">
                          <SquarePen
                            className="h-3.5 w-3.5"
                            strokeWidth={ICON_STROKE}
                          />
                        </span>
                        New chat
                      </button>
                    </div>

                    <div className="flex-1 space-y-0.5 p-1.5">
                      {sortedChats.length === 0 ? (
                        <p className="px-3 py-8 text-center text-[12.5px] text-[var(--text-muted)]">
                          No previous chats yet
                        </p>
                      ) : (
                        sortedChats.map((chat, i) => (
                          <motion.button
                            key={chat.id}
                            type="button"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: Math.min(i * 0.02, 0.12),
                              duration: 0.2,
                            }}
                            onClick={() => loadChat(chat)}
                            className={cn(
                              "group flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left",
                              "transition-colors duration-150",
                              "hover:bg-[var(--hover-fill)]"
                            )}
                          >
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--hover-fill)] text-[11px] font-semibold text-[var(--text-muted)] group-hover:bg-[var(--hover-fill-strong)] group-hover:text-[var(--text-primary)]">
                              {chat.title.slice(0, 1).toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                                  {chat.title}
                                </span>
                                <span className="shrink-0 text-[10px] tabular-nums text-[var(--text-muted)]">
                                  {formatRelative(chat.updatedAt)}
                                </span>
                              </span>
                              {(chat.preview ||
                                chat.messages[chat.messages.length - 1]
                                  ?.content) && (
                                <span className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[var(--text-muted)]">
                                  {chat.preview ??
                                    chat.messages[chat.messages.length - 1]
                                      ?.content}
                                </span>
                              )}
                            </span>
                          </motion.button>
                        ))
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.22, ease: easeSpring }}
                    className="flex h-full min-h-0 flex-col"
                  >
                    {!hasMessages ? (
                      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                        <MagnusLogo size={40} tone="white" className="mb-1 opacity-90" />
                        <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                          How can I help?
                        </p>
                        <p className="max-w-[240px] text-[12.5px] leading-relaxed text-[var(--text-muted)]">
                          Schedules, knowledge, drafts — ask in plain language.
                        </p>
                        <button
                          type="button"
                          onClick={() => setView("history")}
                          className={cn(
                            "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
                            "border border-[var(--glass-border-soft)] bg-[var(--hover-fill)]",
                            "text-[12px] font-medium text-[var(--text-secondary)]",
                            "transition-colors hover:bg-[var(--hover-fill-strong)] hover:text-[var(--text-primary)]"
                          )}
                        >
                          <History
                            className="h-3.5 w-3.5"
                            strokeWidth={ICON_STROKE}
                          />
                          See previous chats
                        </button>
                      </div>
                    ) : (
                      /* Single scroll owner = ScrollFade parent — no nested overflow-y-auto */
                      <div className="min-h-0 flex-1 px-1">
                        <MessageList
                          messages={messages}
                          isTyping={isTyping}
                          onFollowUp={sendMessage}
                          compact
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollFade>

            {/* Composer only on chat view — overflow visible so menus portal cleanly */}
            {view === "chat" && (
              <div
                className="relative z-[2] shrink-0 overflow-visible border-t border-[var(--glass-border-soft)] px-3 pb-3 pt-2"
                data-popup-composer
              >
                <Composer
                  onSend={sendMessage}
                  disabled={isTyping}
                  compact
                  autoFocus={open && view === "chat"}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grok-style floating pill */}
      <motion.button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close Magnus chat" : "Ask Magnus"}
        onClick={toggle}
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className={cn(
          /* Uses shared .btn-primary tokens (same default blue as Catch me up) */
          "btn-primary pointer-events-auto group relative flex h-12 items-center gap-2 overflow-hidden",
          "rounded-full border pl-2 pr-4",
          "transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
        )}
        data-magnus-fab
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="close"
                initial={{ opacity: 0, rotate: -30, scale: 0.85 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex"
              >
                <X className="h-4 w-4" strokeWidth={ICON_STROKE} />
              </motion.span>
            ) : (
              <motion.span
                key="logo"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex"
              >
                <MagnusLogo size={20} tone="white" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className="relative text-[13.5px] font-semibold tracking-tight">
          {open ? "Close" : "Ask Magnus"}
        </span>
      </motion.button>
    </div>
  );
}
