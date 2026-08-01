"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SquarePen } from "lucide-react";
import { useMessaging } from "@/context/MessagingContext";
import { useChat } from "@/context/ChatContext";
import { Portal } from "@/components/ui/Portal";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { ChatListItem } from "@/components/layout/ChatListItem";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

/** Shared AI history drawer — opened from sidebar or conversation header. */
export function MagnusHistoryDrawer() {
  const router = useRouter();
  const { historyOpen, setHistoryOpen } = useMessaging();
  const {
    filteredChats,
    activeChatId,
    selectChat,
    newChat,
    setAppMode,
  } = useChat();

  const openNewMagnus = () => {
    setHistoryOpen(false);
    setAppMode("chat");
    newChat();
    router.push("/");
  };

  const openThread = (id: string) => {
    setHistoryOpen(false);
    setAppMode("chat");
    selectChat(id);
    router.push("/");
  };

  return (
    <Portal>
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div
              key="hist-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[140] bg-black/40 backdrop-blur-sm"
              onClick={() => setHistoryOpen(false)}
              aria-hidden
            />
            <motion.aside
              key="hist"
              role="dialog"
              aria-label="Magnus AI history"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.22, ease: easeSpring }}
              className={cn(
                "fixed inset-y-0 right-0 z-[150] flex w-[min(100%,360px)] flex-col",
                "border-l border-[var(--glass-border)] bg-[var(--glass-strong-solid)] shadow-[var(--shadow-menu)]"
              )}
              data-magnus-history-drawer
            >
              <div className="flex items-center justify-between border-b border-[var(--glass-border-soft)] px-4 py-3">
                <div>
                  <p className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                    Magnus AI
                  </p>
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                    Chat history
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="rounded-lg px-2 py-1 text-[12px] text-[var(--text-muted)] hover:bg-[var(--hover-fill)]"
                >
                  Close
                </button>
              </div>
              <div className="border-b border-[var(--glass-border-soft)] px-3 py-2">
                <button
                  type="button"
                  onClick={openNewMagnus}
                  className="btn-solid flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-semibold"
                  data-new-magnus-chat
                >
                  <SquarePen className="h-4 w-4" strokeWidth={ICON_STROKE} />
                  New Magnus chat
                </button>
              </div>
              <ScrollFade
                className="min-h-0 flex-1"
                size="sm"
                contentClassName="scroll-thin space-y-0.5 p-2"
              >
                {filteredChats.length === 0 ? (
                  <p className="px-3 py-8 text-center text-[13px] text-[var(--text-muted)]">
                    No AI chats yet. Start a new Magnus chat.
                  </p>
                ) : (
                  filteredChats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      variant="popout"
                      active={chat.id === activeChatId}
                      onSelect={() => openThread(chat.id)}
                    />
                  ))
                )}
              </ScrollFade>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}
