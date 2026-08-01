"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  currentUser,
  initialChats,
  mergeSeedChatMeta,
} from "@/lib/mock-data";
import { demoCatchUpPersona, scoutSignals } from "@/lib/scout-data";
import {
  briefToAssistantMessage,
  buildCatchUpBrief,
  catchMeUpThreadTitle,
  catchMeUpUserPrompt,
  isCatchMeUpIntent,
} from "@/lib/scout";
import {
  PERSIST_KEYS,
  readJson,
  readString,
  writeJson,
  writeString,
} from "@/lib/persist";
import { answerFromKnowledge } from "@/lib/ai/knowledge";
import { ensurePrivateChatWithPerson } from "@/lib/person-chat";
import type { PersonProfile } from "@/lib/people-data";
import type { ChatThread, Message } from "@/types/chat";
import type { AppMode } from "@/types/home";

const MODE_KEY = "magnus-app-mode";

interface ChatContextValue {
  chats: ChatThread[];
  activeChatId: string | null;
  activeChat: ChatThread | null;
  isTyping: boolean;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  searchQuery: string;
  /** Intranet home vs clean chat assistant (James / channel split). */
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  /**
   * True only after the user opens a blank Magnus Chat (not during Home→Chat).
   * Drives the solid “active” style on + Magnus Chat.
   */
  isNewChatSurface: boolean;
  /** Last Chat-mode route to restore (messages, AI thread, catalog, …). */
  lastChatPath: string;
  /** Remember where the user was while in Chat mode. */
  rememberLastChatPath: (path: string) => void;
  /**
   * Switch into Chat mode and return the path to navigate to
   * (always a blank new-chat surface on `/`).
   */
  enterChatMode: () => string;
  setSearchQuery: (q: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  selectChat: (id: string | null) => void;
  newChat: () => void;
  /**
   * Insert or replace a thread and select it (e.g. promote popup chat to full).
   */
  upsertChat: (chat: ChatThread) => void;
  /**
   * Open (or create) a private 1:1 chat with a directory person.
   * Returns the chat id for navigation.
   */
  openPersonChat: (
    person: Pick<PersonProfile, "id" | "name" | "handle" | "role">
  ) => string;
  /** Intranet home landing (does not wipe last chat surface). */
  goHome: () => void;
  sendMessage: (content: string) => void;
  /** Personal beat report: new chat thread with structured scout brief. */
  catchMeUp: () => void;
  /** Cancel in-flight mock generation. */
  stopGeneration: () => void;
  /** Replace last assistant reply for a thread. */
  regenerate: (chatId?: string) => void;
  /** Edit a user message and resubmit from that point. */
  editAndResend: (messageId: string, content: string) => void;
  renameChat: (id: string, title: string) => void;
  /** Mask title as “Private” in lists until the chat is open. */
  setChatPrivate: (id: string, isPrivate: boolean) => void;
  archiveChat: (id: string) => void;
  unarchiveChat: (id: string) => void;
  deleteChat: (id: string) => void;
  /** Soft-restore a deleted chat (for undo). */
  restoreChat: (chat: ChatThread, index?: number) => void;
  filteredChats: ChatThread[];
  archivedChats: ChatThread[];
}

const ChatContext = createContext<ChatContextValue | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<ChatThread[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appMode, setAppModeState] = useState<AppMode>("home");
  const [hydrated, setHydrated] = useState(false);
  /** Intentional blank Magnus composer — not the Home→Chat transition. */
  const [isNewChatSurface, setIsNewChatSurface] = useState(false);
  const [lastChatPath, setLastChatPath] = useState("/");
  const lastChatPathRef = useRef("/");

  const typingTimerRef = useRef<number | null>(null);
  const typingTargetRef = useRef<string | null>(null);
  /** Abort in-flight AI Gateway stream (stop button). */
  const streamAbortRef = useRef<AbortController | null>(null);

  const clearTypingTimer = useCallback(() => {
    if (typingTimerRef.current != null) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    typingTargetRef.current = null;
  }, []);

  const abortStream = useCallback(() => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
  }, []);

  const setAppMode = useCallback((mode: AppMode) => {
    setAppModeState(mode);
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  const rememberLastChatPath = useCallback((path: string) => {
    let next = path.trim() || "/";
    // Legacy team-messaging surface → Magnus chat home
    if (next.startsWith("/messages")) next = "/";
    lastChatPathRef.current = next;
    setLastChatPath(next);
    writeString(PERSIST_KEYS.lastChatPath, next);
  }, []);

  /**
   * Enter Chat mode and return the path the shell should open.
   * Always lands on a blank new-chat screen (never restores a prior thread
   * or catalog page). History remains available from the sidebar.
   */
  const enterChatMode = useCallback(() => {
    setAppMode("chat");
    setIsNewChatSurface(true);
    setActiveChatId(null);
    lastChatPathRef.current = "/";
    setLastChatPath("/");
    writeString(PERSIST_KEYS.lastChatPath, "/");
    try {
      localStorage.removeItem(PERSIST_KEYS.activeChat);
    } catch {
      /* ignore */
    }
    return "/";
  }, [setAppMode]);

  const setSidebarCollapsedPersist = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    writeString(PERSIST_KEYS.sidebarCollapsed, collapsed ? "1" : "0");
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved === "home" || saved === "chat") setAppModeState(saved);
    } catch {
      /* ignore */
    }

    const savedChats = readJson<ChatThread[]>(PERSIST_KEYS.chats);
    const list =
      Array.isArray(savedChats) && savedChats.length > 0
        ? mergeSeedChatMeta(savedChats)
        : initialChats;
    if (Array.isArray(savedChats) && savedChats.length > 0) {
      setChats(list);
    }

    const savedActive = readString(PERSIST_KEYS.activeChat);
    if (savedActive) {
      if (list.some((c) => c.id === savedActive)) {
        setActiveChatId(savedActive);
      }
    }

    const savedPath = readString(PERSIST_KEYS.lastChatPath);
    if (savedPath && savedPath.startsWith("/")) {
      // Legacy team Messages path → Magnus chat
      const path = savedPath.startsWith("/messages") ? "/" : savedPath;
      lastChatPathRef.current = path;
      setLastChatPath(path);
    }

    const collapsed = readString(PERSIST_KEYS.sidebarCollapsed);
    if (collapsed === "1") setSidebarCollapsed(true);
    if (collapsed === "0") setSidebarCollapsed(false);

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(PERSIST_KEYS.chats, chats);
  }, [chats, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (activeChatId) writeString(PERSIST_KEYS.activeChat, activeChatId);
    else {
      try {
        localStorage.removeItem(PERSIST_KEYS.activeChat);
      } catch {
        /* ignore */
      }
    }
  }, [activeChatId, hydrated]);

  useEffect(
    () => () => {
      clearTypingTimer();
      abortStream();
    },
    [abortStream, clearTypingTimer]
  );

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? null,
    [chats, activeChatId]
  );

  const filteredChats = useMemo(() => {
    const active = chats.filter((c) => !c.archived);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return active;
    return active.filter((c) => {
      if (c.title.toLowerCase().includes(q)) return true;
      if (c.preview?.toLowerCase().includes(q)) return true;
      return c.messages.some((m) => m.content.toLowerCase().includes(q));
    });
  }, [chats, searchQuery]);

  const archivedChats = useMemo(
    () => chats.filter((c) => c.archived),
    [chats]
  );

  const selectChat = useCallback(
    (id: string | null) => {
      setIsNewChatSurface(false);
      setActiveChatId(id);
      setAppMode("chat");
      setSidebarOpen(false);
      if (id) rememberLastChatPath(`/?chat=${encodeURIComponent(id)}`);
    },
    [setAppMode, rememberLastChatPath]
  );

  const newChat = useCallback(() => {
    setIsNewChatSurface(true);
    setActiveChatId(null);
    setAppMode("chat");
    setSidebarOpen(false);
    rememberLastChatPath("/");
  }, [setAppMode, rememberLastChatPath]);

  const upsertChat = useCallback(
    (chat: ChatThread) => {
      setChats((prev) => {
        const i = prev.findIndex((c) => c.id === chat.id);
        if (i >= 0) {
          const next = [...prev];
          next[i] = chat;
          return next;
        }
        return [chat, ...prev];
      });
      setActiveChatId(chat.id);
      setIsNewChatSurface(false);
      setAppMode("chat");
      setSidebarOpen(false);
      rememberLastChatPath(`/?chat=${encodeURIComponent(chat.id)}`);
    },
    [setAppMode, rememberLastChatPath]
  );

  const openPersonChat = useCallback(
    (person: Pick<PersonProfile, "id" | "name" | "handle" | "role">) => {
      const { chat } = ensurePrivateChatWithPerson(chats, person);
      upsertChat(chat);
      return chat.id;
    },
    [chats, upsertChat]
  );

  const goHome = useCallback(() => {
    // Clear thread selection so returning to Chat shows new-chat empty state
    setIsNewChatSurface(false);
    setActiveChatId(null);
    setAppMode("home");
    setSidebarOpen(false);
  }, [setAppMode]);

  const renameChat = useCallback((id: string, title: string) => {
    const next = title.trim();
    if (!next) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              title: next.length > 80 ? `${next.slice(0, 78)}…` : next,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  }, []);

  const setChatPrivate = useCallback((id: string, isPrivate: boolean) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              private: isPrivate,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  }, []);

  const archiveChat = useCallback((id: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archived: true } : c))
    );
    setActiveChatId((cur) => (cur === id ? null : cur));
  }, []);

  const unarchiveChat = useCallback((id: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archived: false } : c))
    );
  }, []);

  const deleteChat = useCallback((id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    setActiveChatId((cur) => (cur === id ? null : cur));
  }, []);

  const restoreChat = useCallback((chat: ChatThread, index = 0) => {
    setChats((prev) => {
      if (prev.some((c) => c.id === chat.id)) return prev;
      const next = [...prev];
      const at = Math.max(0, Math.min(index, next.length));
      next.splice(at, 0, chat);
      return next;
    });
  }, []);

  const stopGeneration = useCallback(() => {
    abortStream();
    clearTypingTimer();
    setIsTyping(false);
  }, [abortStream, clearTypingTimer]);

  /** Local mock assistant — catch-up briefs or knowledge-grounded replies. */
  const scheduleMockAssistant = useCallback(
    (
      targetId: string,
      opts: {
        catchUp: boolean;
        firstName: string;
        delay?: number;
        /** Last user text for retrieval */
        query?: string;
      }
    ) => {
      clearTypingTimer();
      setIsTyping(true);
      typingTargetRef.current = targetId;
      const delay =
        opts.delay ??
        (opts.catchUp
          ? 900 + Math.random() * 500
          : 700 + Math.random() * 500);

      typingTimerRef.current = window.setTimeout(() => {
        if (typingTargetRef.current !== targetId) return;
        let assistantMsg: Message;
        if (opts.catchUp) {
          const brief = buildCatchUpBrief(scoutSignals, {
            window: "week",
            limit: 3,
            firstName: opts.firstName,
            projects: [...demoCatchUpPersona.projects],
          });
          assistantMsg = briefToAssistantMessage(
            brief,
            uid("a"),
            new Date().toISOString()
          );
        } else {
          const reply = answerFromKnowledge(
            opts.query?.trim() || "intranet pulse",
            { limit: 5, surface: "main" }
          );
          assistantMsg = {
            id: uid("a"),
            role: "assistant",
            content: reply,
            createdAt: new Date().toISOString(),
            followUps: [
              "What's the latest news?",
              "Any approvals waiting?",
              "Show related B&G knowledge",
            ],
          };
        }
        setChats((prev) =>
          prev.map((c) =>
            c.id === targetId
              ? {
                  ...c,
                  updatedAt: new Date().toISOString(),
                  messages: [...c.messages, assistantMsg],
                }
              : c
          )
        );
        setIsTyping(false);
        typingTimerRef.current = null;
        typingTargetRef.current = null;
      }, delay);
    },
    [clearTypingTimer]
  );

  /**
   * Prefer AI Gateway stream via /api/chat (AI SDK 7).
   * Falls back to mock when gateway is not configured or stream fails.
   * Catch-me-up stays on structured mock brief (product-specific layout).
   */
  const scheduleAssistant = useCallback(
    (
      targetId: string,
      opts: {
        catchUp: boolean;
        firstName: string;
        delay?: number;
        query?: string;
      },
      history?: Message[]
    ) => {
      const lastUserText =
        opts.query ??
        [...(history ?? [])].reverse().find((m) => m.role === "user")
          ?.content ??
        "";

      if (opts.catchUp) {
        scheduleMockAssistant(targetId, {
          ...opts,
          query: lastUserText,
        });
        return;
      }

      clearTypingTimer();
      abortStream();
      setIsTyping(true);
      typingTargetRef.current = targetId;

      const assistantId = uid("a");
      const createdAt = new Date().toISOString();

      // Placeholder assistant bubble for streaming tokens
      setChats((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? {
                ...c,
                updatedAt: createdAt,
                messages: [
                  ...c.messages,
                  {
                    id: assistantId,
                    role: "assistant" as const,
                    content: "",
                    createdAt,
                  },
                ],
              }
            : c
        )
      );

      const controller = new AbortController();
      streamAbortRef.current = controller;

      const messagesForApi = history ?? [];

      void (async () => {
        const { streamChatCompletion } = await import("@/lib/ai/stream-client");
        const result = await streamChatCompletion({
          messages: messagesForApi,
          surface: "main",
          signal: controller.signal,
          onText: (text) => {
            if (typingTargetRef.current !== targetId) return;
            setChats((prev) =>
              prev.map((c) =>
                c.id === targetId
                  ? {
                      ...c,
                      updatedAt: new Date().toISOString(),
                      messages: c.messages.map((m) =>
                        m.id === assistantId ? { ...m, content: text } : m
                      ),
                    }
                  : c
              )
            );
          },
        });

        if (typingTargetRef.current !== targetId) return;

        if (result.ok) {
          setChats((prev) =>
            prev.map((c) =>
              c.id === targetId
                ? {
                    ...c,
                    updatedAt: new Date().toISOString(),
                    messages: c.messages.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            content: result.text,
                            followUps: [
                              "What's the latest news?",
                              "Any approvals waiting?",
                              "Show related B&G knowledge",
                            ],
                          }
                        : m
                    ),
                  }
                : c
            )
          );
          setIsTyping(false);
          typingTargetRef.current = null;
          streamAbortRef.current = null;
          return;
        }

        if (result.reason === "aborted") {
          // Drop empty / partial assistant bubble so Stop never leaves a blank row
          setChats((prev) =>
            prev.map((c) =>
              c.id === targetId
                ? {
                    ...c,
                    messages: c.messages.filter(
                      (m) =>
                        m.id !== assistantId ||
                        (m.role === "assistant" && m.content.trim().length > 0)
                    ),
                  }
                : c
            )
          );
          setIsTyping(false);
          typingTargetRef.current = null;
          streamAbortRef.current = null;
          return;
        }

        // Gateway missing or stream failed → drop empty bubble, use knowledge mock
        setChats((prev) =>
          prev.map((c) =>
            c.id === targetId
              ? {
                  ...c,
                  messages: c.messages.filter((m) => m.id !== assistantId),
                }
              : c
          )
        );
        streamAbortRef.current = null;
        scheduleMockAssistant(targetId, {
          catchUp: false,
          firstName: opts.firstName,
          delay: opts.delay ?? 350,
          query: lastUserText,
        });
      })();
    },
    [abortStream, clearTypingTimer, scheduleMockAssistant]
  );

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

      const catchUp = isCatchMeUpIntent(trimmed);
      let chatId = activeChatId;
      const firstName =
        currentUser.name.split(/\s+/)[0] ?? demoCatchUpPersona.firstName;

      let historyForApi: Message[] = [];

      if (!chatId) {
        chatId = uid("chat");
        const title = catchUp
          ? catchMeUpThreadTitle(firstName)
          : trimmed.length > 36
            ? `${trimmed.slice(0, 34)}…`
            : trimmed;
        const thread: ChatThread = {
          id: chatId,
          title,
          preview: catchUp ? `Personal brief for ${firstName}` : undefined,
          updatedAt: new Date().toISOString(),
          messages: [userMsg],
        };
        historyForApi = [userMsg];
        setChats((prev) => [thread, ...prev]);
        setActiveChatId(chatId);
      } else {
        const existing = chats.find((c) => c.id === chatId);
        historyForApi = [...(existing?.messages ?? []), userMsg];
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  updatedAt: new Date().toISOString(),
                  messages: [...c.messages, userMsg],
                }
              : c
          )
        );
      }

      setAppMode("chat");
      scheduleAssistant(
        chatId,
        { catchUp, firstName, query: trimmed },
        historyForApi
      );
    },
    [activeChatId, chats, isTyping, scheduleAssistant, setAppMode]
  );

  const catchMeUp = useCallback(() => {
    if (isTyping) return;

    const firstName =
      currentUser.name.split(/\s+/)[0] ?? demoCatchUpPersona.firstName;
    const now = new Date().toISOString();
    const chatId = uid("chat");
    const userMsg: Message = {
      id: uid("u"),
      role: "user",
      content: catchMeUpUserPrompt(firstName),
      createdAt: now,
    };

    const thread: ChatThread = {
      id: chatId,
      title: catchMeUpThreadTitle(firstName),
      preview: `Personal brief for ${firstName}`,
      updatedAt: now,
      messages: [userMsg],
    };

    setChats((prev) => [thread, ...prev]);
    setActiveChatId(chatId);
    setAppMode("chat");
    setSidebarOpen(false);
    scheduleAssistant(chatId, {
      catchUp: true,
      firstName,
      delay: 1100,
    });
  }, [isTyping, scheduleAssistant, setAppMode]);

  const regenerate = useCallback(
    (chatId?: string) => {
      if (isTyping) return;
      const id = chatId ?? activeChatId;
      if (!id) return;

      const firstName =
        currentUser.name.split(/\s+/)[0] ?? demoCatchUpPersona.firstName;

      const thread = chats.find((c) => c.id === id);
      const msgs = [...(thread?.messages ?? [])];
      while (msgs.length && msgs[msgs.length - 1]?.role === "assistant") {
        msgs.pop();
      }
      const lastUser = [...msgs].reverse().find((m) => m.role === "user");
      const catchUp = lastUser ? isCatchMeUpIntent(lastUser.content) : false;

      setChats((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                messages: msgs,
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );

      scheduleAssistant(
        id,
        { catchUp, firstName, delay: 700 + Math.random() * 500 },
        msgs
      );
    },
    [activeChatId, chats, isTyping, scheduleAssistant]
  );

  const editAndResend = useCallback(
    (messageId: string, content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isTyping || !activeChatId) return;

      const firstName =
        currentUser.name.split(/\s+/)[0] ?? demoCatchUpPersona.firstName;
      const catchUp = isCatchMeUpIntent(trimmed);
      const chatId = activeChatId;

      let historyForApi: Message[] = [];

      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          const idx = c.messages.findIndex((m) => m.id === messageId);
          if (idx < 0 || c.messages[idx]?.role !== "user") return c;
          const kept = c.messages.slice(0, idx);
          const edited: Message = {
            ...c.messages[idx]!,
            content: trimmed,
            createdAt: new Date().toISOString(),
          };
          historyForApi = [...kept, edited];
          return {
            ...c,
            title:
              c.messages.length <= 2
                ? catchUp
                  ? catchMeUpThreadTitle(firstName)
                  : trimmed.length > 36
                    ? `${trimmed.slice(0, 34)}…`
                    : trimmed
                : c.title,
            updatedAt: new Date().toISOString(),
            messages: historyForApi,
          };
        })
      );

      scheduleAssistant(chatId, { catchUp, firstName }, historyForApi);
    },
    [activeChatId, isTyping, scheduleAssistant]
  );

  const value: ChatContextValue = {
    chats,
    activeChatId,
    activeChat,
    isTyping,
    sidebarOpen,
    sidebarCollapsed,
    searchQuery,
    appMode,
    setAppMode,
    isNewChatSurface,
    lastChatPath,
    rememberLastChatPath,
    enterChatMode,
    setSearchQuery,
    setSidebarOpen,
    setSidebarCollapsed: setSidebarCollapsedPersist,
    selectChat,
    newChat,
    upsertChat,
    openPersonChat,
    goHome,
    sendMessage,
    catchMeUp,
    stopGeneration,
    regenerate,
    editAndResend,
    renameChat,
    setChatPrivate,
    archiveChat,
    unarchiveChat,
    deleteChat,
    restoreChat,
    filteredChats,
    archivedChats,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
