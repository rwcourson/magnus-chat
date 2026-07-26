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
import type {
  Conversation,
  MessageAttachment,
  TeamMessage,
} from "@/types/messaging";
import {
  DEFAULT_CONVERSATION_ID,
  initialConversations,
} from "@/lib/messaging-data";
import {
  appendTeamMessage,
  createChannelConversation,
  createMagnusTeamReply,
  leaveChannel,
  listChannels,
  listDms,
  markConversationRead,
  editTeamMessage,
  openOrCreateDm,
  reorderChannels,
  replyInThread,
  sendTeamMessage,
  toggleMessageReaction,
  totalUnread,
} from "@/lib/messaging";

interface MessagingContextValue {
  conversations: Conversation[];
  activeId: string;
  activeConversation: Conversation | null;
  channels: Conversation[];
  dms: Conversation[];
  unreadTotal: number;
  isMagnusTyping: boolean;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  /** Open side thread for this parent message id (in active conversation) */
  openThreadId: string | null;
  openThread: (messageId: string) => void;
  closeThread: () => void;
  threadParent: TeamMessage | null;
  selectConversation: (id: string) => void;
  createChannel: (name: string) => string | null;
  /** Leave a channel (remove from sidebar) */
  leaveChannelById: (channelId: string) => void;
  /** Persist channel order after drag-reorder */
  reorderChannelIds: (orderedIds: string[]) => void;
  openDm: (personId: string, personName: string) => string;
  sendMessage: (body: string, attachments?: MessageAttachment[]) => void;
  sendThreadReply: (body: string, attachments?: MessageAttachment[]) => void;
  /**
   * Edit own message. Pass parentMessageId when editing a thread reply.
   */
  editMessage: (
    messageId: string,
    body: string,
    opts?: { parentMessageId?: string }
  ) => void;
  insertMention: () => string;
  toggleReaction: (messageId: string, emoji: string) => void;
}

const MessagingContext = createContext<MessagingContextValue | null>(null);

export function MessagingProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId] = useState(DEFAULT_CONVERSATION_ID);
  const [isMagnusTyping, setIsMagnusTyping] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const magnusTimer = useRef<number | null>(null);

  const clearMagnusTimer = useCallback(() => {
    if (magnusTimer.current != null) {
      window.clearTimeout(magnusTimer.current);
      magnusTimer.current = null;
    }
  }, []);

  useEffect(() => () => clearMagnusTimer(), [clearMagnusTimer]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    setOpenThreadId(null);
    setConversations((prev) => markConversationRead(prev, id));
  }, []);

  const createChannel = useCallback((name: string) => {
    let createdId: string | null = null;
    setConversations((prev) => {
      const result = createChannelConversation(prev, name);
      if (!result) return prev;
      createdId = result.conversation.id;
      return result.conversations;
    });
    if (createdId) {
      setActiveId(createdId);
      setOpenThreadId(null);
    }
    return createdId;
  }, []);

  const leaveChannelById = useCallback((channelId: string) => {
    setConversations((prev) => {
      const next = leaveChannel(prev, channelId);
      const fallback =
        next.find((c) => c.kind === "channel") ??
        next.find((c) => c.kind === "dm") ??
        next[0];
      // Switch away if the open conversation was left
      setActiveId((cur) =>
        cur === channelId ? (fallback?.id ?? cur) : cur
      );
      setOpenThreadId(null);
      return next;
    });
  }, []);

  const reorderChannelIds = useCallback((orderedIds: string[]) => {
    setConversations((prev) => reorderChannels(prev, orderedIds));
  }, []);

  const openDm = useCallback((personId: string, personName: string) => {
    let id = "";
    setConversations((prev) => {
      const result = openOrCreateDm(prev, personId, personName);
      id = result.conversation.id;
      return markConversationRead(result.conversations, id);
    });
    setActiveId(id);
    setOpenThreadId(null);
    return id;
  }, []);

  const openThread = useCallback((messageId: string) => {
    setOpenThreadId(messageId);
  }, []);

  const closeThread = useCallback(() => {
    setOpenThreadId(null);
  }, []);

  /**
   * @magnus reply: prefer AI Gateway stream; else knowledge-grounded mock.
   * `historySnapshot` is the conversation *after* the user message is applied
   * so we never race on stale React state.
   */
  const scheduleMagnus = useCallback(
    (
      conversationId: string,
      userBody: string,
      historySnapshot: Conversation[]
    ) => {
      clearMagnusTimer();
      setIsMagnusTyping(true);

      void (async () => {
        const conv =
          historySnapshot.find((c) => c.id === conversationId) ??
          initialConversations.find((c) => c.id === conversationId);
        const label =
          conv?.kind === "channel"
            ? `#${conv.name}`
            : conv?.name ?? "channel";

        // Map recent team messages → AI chat history (snapshot includes new user msg)
        const history = (conv?.messages ?? []).slice(-12).map((m) => ({
          id: m.id,
          role: (m.author.isMagnus ? "assistant" : "user") as
            | "user"
            | "assistant",
          content: m.body,
        }));

        try {
          const { streamChatCompletion } = await import(
            "@/lib/ai/stream-client"
          );
          const result = await streamChatCompletion({
            messages: history,
            surface: conv?.kind === "dm" ? "dm" : "channel",
            conversationId,
            conversationLabel: label,
          });

          if (result.ok && result.text.trim()) {
            setConversations((prev) => {
              const reply = createMagnusTeamReply(
                conversationId,
                userBody,
                prev
              );
              return appendTeamMessage(prev, conversationId, {
                ...reply,
                body: result.text,
              });
            });
            setIsMagnusTyping(false);
            return;
          }
        } catch {
          /* fall through to knowledge mock */
        }

        // Offline / unconfigured: knowledge-grounded demo reply
        magnusTimer.current = window.setTimeout(() => {
          setConversations((prev) => {
            const reply = createMagnusTeamReply(
              conversationId,
              userBody,
              prev
            );
            return appendTeamMessage(prev, conversationId, reply);
          });
          setIsMagnusTyping(false);
          magnusTimer.current = null;
        }, 500 + Math.random() * 400);
      })();
    },
    [clearMagnusTimer]
  );

  const sendMessage = useCallback(
    (body: string, attachments?: MessageAttachment[]) => {
      setConversations((prev) => {
        const result = sendTeamMessage(prev, activeId, body, { attachments });
        if (!result) return prev;
        if (result.magnusShouldRespond) {
          const next = result.conversations;
          queueMicrotask(() => scheduleMagnus(activeId, body, next));
        }
        return result.conversations;
      });
    },
    [activeId, scheduleMagnus]
  );

  const sendThreadReply = useCallback(
    (body: string, attachments?: MessageAttachment[]) => {
      if (!openThreadId) return;
      setConversations((prev) => {
        const result = replyInThread(prev, activeId, openThreadId, body, {
          attachments,
        });
        return result ? result.conversations : prev;
      });
    },
    [activeId, openThreadId]
  );

  const insertMention = useCallback(() => "@magnus ", []);

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      setConversations((prev) =>
        toggleMessageReaction(prev, activeId, messageId, emoji)
      );
    },
    [activeId]
  );

  const editMessage = useCallback(
    (
      messageId: string,
      body: string,
      opts?: { parentMessageId?: string }
    ) => {
      setConversations((prev) =>
        editTeamMessage(prev, activeId, messageId, body, {
          parentMessageId: opts?.parentMessageId,
        })
      );
    },
    [activeId]
  );

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  const threadParent = useMemo(() => {
    if (!openThreadId || !activeConversation) return null;
    return (
      activeConversation.messages.find((m) => m.id === openThreadId) ?? null
    );
  }, [activeConversation, openThreadId]);

  const channels = useMemo(() => listChannels(conversations), [conversations]);
  const dms = useMemo(() => listDms(conversations), [conversations]);
  const unreadTotal = useMemo(
    () => totalUnread(conversations),
    [conversations]
  );

  const value: MessagingContextValue = {
    conversations,
    activeId,
    activeConversation,
    channels,
    dms,
    unreadTotal,
    isMagnusTyping,
    historyOpen,
    setHistoryOpen,
    openThreadId,
    openThread,
    closeThread,
    threadParent,
    selectConversation,
    createChannel,
    leaveChannelById,
    reorderChannelIds,
    openDm,
    sendMessage,
    sendThreadReply,
    editMessage,
    insertMention,
    toggleReaction,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error("useMessaging must be used within MessagingProvider");
  return ctx;
}

export type { TeamMessage };
