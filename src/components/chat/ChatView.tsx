"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/chat/EmptyState";
import { HomeLanding } from "@/components/home/HomeLanding";
import { MessageList } from "@/components/chat/MessageList";
import { Composer } from "@/components/chat/Composer";
import { MagnusChatPopup } from "@/components/chat/MagnusChatPopup";
import { ThreadHeader } from "@/components/chat/ThreadHeader";
import { useChat } from "@/context/ChatContext";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { sceneTransition } from "@/lib/motion";

export function ChatView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const chatParam = searchParams.get("chat");
  const {
    activeChat,
    chats,
    isTyping,
    sendMessage,
    appMode,
    selectChat,
    isNewChatSurface,
    lastChatPath,
    stopGeneration,
    regenerate,
    editAndResend,
  } = useChat();

  useEffect(() => {
    if (!chatParam) return;
    if (chats.some((c) => c.id === chatParam)) {
      selectChat(chatParam);
    }
  }, [chatParam, chats, selectChat]);

  const hasMessages = !!activeChat && activeChat.messages.length > 0;
  // Home→Chat navigates to catalog tools while still on `/` for a frame —
  // hold home so we never flash a blank composer mid-route.
  // Only for non-Magnus destinations; bare `/` is a real new-chat surface.
  const restoringOtherSurface =
    appMode === "chat" &&
    !isNewChatSurface &&
    pathname === "/" &&
    lastChatPath !== "/" &&
    !lastChatPath.includes("chat=") &&
    lastChatPath.startsWith("/");

  // Chat mode on `/` with no thread → always the new-chat empty state
  // (never the intranet home landing — that was the Home/Chat mix-up).
  const showChatEmpty =
    appMode === "chat" &&
    !restoringOtherSurface &&
    (pathname === "/" || pathname.startsWith("/chat")) &&
    !hasMessages;

  const showIntranetHome =
    appMode === "home" || restoringOtherSurface;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        {showIntranetHome ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={sceneTransition}
            className="min-h-0 flex-1 overflow-hidden"
          >
            <HomeLanding onSend={sendMessage} disabled={isTyping} />
          </motion.div>
        ) : showChatEmpty ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={sceneTransition}
            className="min-h-0 flex-1 overflow-hidden"
          >
            <EmptyState onSend={sendMessage} disabled={isTyping} />
          </motion.div>
        ) : (
          <motion.div
            key={activeChat!.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={sceneTransition}
            className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
            data-chat-stage
          >
            <ThreadHeader chat={activeChat!} />

            {/*
              Full-stage scroll under a single continuous veil:
              fade starts above the input and runs solid to the bottom of the screen.
              No separate scroll-bottom fade (that created the harsh line).
            */}
            <div className="relative min-h-0 flex-1">
              {/* hideBottom: continuous composer-screen-veil owns the bottom dissolve */}
              <ScrollFade
                className="absolute inset-0"
                size="md"
                hideBottom
                contentClassName="scroll-thin"
              >
                <MessageList
                  messages={activeChat!.messages}
                  isTyping={isTyping}
                  onFollowUp={sendMessage}
                  onRegenerate={() => regenerate(activeChat!.id)}
                  onEditUser={editAndResend}
                />
              </ScrollFade>

              {/*
                Composer dock + continuous veil. Height tracks the input
                (not a tall 42vh band) so finished threads don’t leave a
                huge empty gap above the field.
              */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end">
                <div
                  className="composer-screen-veil absolute inset-x-0 bottom-0 h-[min(28vh,220px)]"
                  aria-hidden
                />
                <div className="pointer-events-auto relative px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-1.5 sm:px-6">
                  <div
                    className="mx-auto w-full min-w-0 max-w-[680px]"
                    data-composer-column
                  >
                    <Composer
                      onSend={sendMessage}
                      disabled={isTyping}
                      isGenerating={isTyping}
                      onStop={stopGeneration}
                    />
                    <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">
                      Magnus can make mistakes. Verify important information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showIntranetHome && <MagnusChatPopup />}
    </div>
  );
}
