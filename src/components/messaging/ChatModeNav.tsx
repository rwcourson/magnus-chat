"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Blocks,
  ChevronDown,
  Clock3,
  FolderKanban,
  Lock,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { useSidebarPrefs } from "@/context/SidebarPrefsContext";
import { ChatListItem } from "@/components/layout/ChatListItem";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { RailIconButton } from "@/components/layout/RailItem";
import {
  isChatSectionVisible,
  visibleChatToolLinks,
} from "@/lib/sidebar-prefs";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";
import { easeOut, easeSpring } from "@/lib/motion";

const TOOL_ICONS: Record<string, LucideIcon> = {
  skills: Zap,
  routines: Clock3,
  integrations: Blocks,
  workspaces: FolderKanban,
};

/** Collapsed recent list length before “Show more”. */
const RECENT_LIMIT = 5;

/**
 * Chat-mode sidebar body — tools first, then Magnus history.
 * Team channels and DMs are intentionally not shown.
 */
export function ChatModeNav({
  compact,
  onNavigate,
  searchQuery = "",
}: {
  compact?: boolean;
  onNavigate?: () => void;
  /** Optional filter from the shared sidebar search field */
  searchQuery?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { prefs } = useSidebarPrefs();
  const {
    filteredChats,
    activeChatId,
    selectChat,
    setAppMode,
    isNewChatSurface,
  } = useChat();

  const showHistory = isChatSectionVisible(prefs, "history");
  const tools = useMemo(() => visibleChatToolLinks(prefs), [prefs]);
  const q = searchQuery.trim().toLowerCase();
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const history = useMemo(() => {
    let list = filteredChats;
    if (q) {
      list = list.filter((c) => {
        // Private threads only match when already open or by literal “private”
        if (c.private && c.id !== activeChatId) {
          return "private".includes(q) || q === "private";
        }
        return (
          c.title.toLowerCase().includes(q) ||
          (c.preview?.toLowerCase().includes(q) ?? false)
        );
      });
    }
    return list;
  }, [filteredChats, q, activeChatId]);

  const visibleTools = useMemo(() => {
    if (!q) return tools;
    return tools.filter(
      (t) =>
        t.label.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
    );
  }, [tools, q]);

  // While searching, show full filtered list; otherwise cap until expanded
  const showAllHistory = historyExpanded || q.length > 0;
  const visibleHistory = showAllHistory
    ? history
    : history.slice(0, RECENT_LIMIT);
  const hiddenCount = Math.max(0, history.length - RECENT_LIMIT);
  const canExpand = !q && history.length > RECENT_LIMIT;

  const openThread = (id: string) => {
    setAppMode("chat");
    selectChat(id);
    router.push(`/?chat=${encodeURIComponent(id)}`);
    onNavigate?.();
  };

  const openTool = (href: string) => {
    setAppMode("chat");
    router.push(href);
    onNavigate?.();
  };

  if (compact) {
    return (
      <div
        className="flex w-full flex-col items-center gap-0.5"
        data-chat-mode-nav
        data-compact
      >
        {visibleTools.map((t) => {
          const Icon = TOOL_ICONS[t.id] ?? Zap;
          const active =
            pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <RailIconButton
              key={t.id}
              label={t.label}
              active={active}
              onClick={() => openTool(t.href)}
              data-chat-tool={t.id}
            >
              <Icon className="h-4 w-4" strokeWidth={ICON_STROKE} />
            </RailIconButton>
          );
        })}
        {showHistory &&
          history.slice(0, 4).map((chat) => {
            const active =
              chat.id === activeChatId &&
              (pathname === "/" || pathname.startsWith("/chat"));
            const masked = Boolean(chat.private) && !active;
            return (
              <RailIconButton
                key={chat.id}
                label={masked ? "Private" : chat.title}
                detail={
                  masked ? "Hidden until opened" : (chat.preview ?? "Magnus chat")
                }
                active={active}
                onClick={() => openThread(chat.id)}
                data-chat-history={chat.id}
              >
                {masked ? (
                  <Lock className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                ) : (
                  <span className="text-[10px] font-semibold leading-none">
                    {chat.title.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </RailIconButton>
            );
          })}
      </div>
    );
  }

  const empty =
    showHistory &&
    history.length === 0 &&
    visibleTools.length === 0 &&
    q.length > 0;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" data-chat-mode-nav>
      <ScrollFade
        className="min-h-0 flex-1"
        size="md"
        contentClassName="scroll-thin space-y-3 pb-2"
      >
        {empty && (
          <p className="px-2.5 py-6 text-center text-[12px] text-[var(--text-muted)]">
            No matches
          </p>
        )}

        {visibleTools.length > 0 && (
          <section data-section="tools">
            <div className="mb-1 flex items-center px-2.5 pt-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Tools
              </p>
            </div>
            <div className="space-y-px">
              {visibleTools.map((t) => {
                const Icon = TOOL_ICONS[t.id] ?? Zap;
                const active =
                  pathname === t.href || pathname.startsWith(`${t.href}/`);
                return (
                  <Link
                    key={t.id}
                    href={t.href}
                    onClick={() => {
                      setAppMode("chat");
                      onNavigate?.();
                    }}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-[13.5px] transition-colors",
                      active
                        ? "bg-[var(--select-fill)] font-medium text-[var(--select-text)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                    )}
                    data-chat-tool={t.id}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "opacity-100" : "opacity-80"
                      )}
                      strokeWidth={ICON_STROKE}
                    />
                    <span className="min-w-0 flex-1 truncate">{t.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {showHistory && (history.length > 0 || !q) && (
          <section
            className={cn(
              visibleTools.length > 0 &&
                "border-t border-[var(--glass-border-soft)]/60 pt-3"
            )}
            data-section="history"
          >
            <div className="mb-1 flex items-center px-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Recent chats
              </p>
            </div>
            {history.length === 0 ? (
              <p className="px-2.5 py-3 text-[12px] leading-relaxed text-[var(--text-muted)]">
                Start a Magnus chat — history shows up here.
              </p>
            ) : (
              <div className="space-y-px" data-chat-history-list>
                <AnimatePresence initial={false} mode="popLayout">
                  {visibleHistory.map((chat, i) => {
                    const active =
                      chat.id === activeChatId &&
                      !isNewChatSurface &&
                      (pathname === "/" || pathname.startsWith("/chat"));
                    return (
                      <motion.div
                        key={chat.id}
                        layout
                        initial={
                          i >= RECENT_LIMIT
                            ? { opacity: 0, y: -6, height: 0 }
                            : false
                        }
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        transition={{
                          duration: 0.22,
                          ease: easeSpring,
                          layout: { duration: 0.2, ease: easeOut },
                        }}
                        className="overflow-hidden"
                      >
                        <ChatListItem
                          chat={chat}
                          active={active}
                          index={i}
                          onSelect={() => openThread(chat.id)}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {canExpand && (
                  <button
                    type="button"
                    onClick={() => setHistoryExpanded((v) => !v)}
                    className={cn(
                      "mt-1 grid w-full grid-cols-[1fr_auto_1fr] items-center rounded-xl",
                      "px-2.5 py-2 text-[12px] font-medium text-[var(--text-muted)]",
                      "transition-colors hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                    )}
                    data-chat-history-expand
                    aria-expanded={historyExpanded}
                  >
                    {/* Equal side columns keep the label optically centered */}
                    <span aria-hidden />
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <span className="whitespace-nowrap">
                        {historyExpanded
                          ? "Show less"
                          : `Show ${hiddenCount} more`}
                      </span>
                      <motion.span
                        animate={{ rotate: historyExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: easeOut }}
                        className="inline-flex shrink-0"
                      >
                        <ChevronDown
                          className="h-3.5 w-3.5"
                          strokeWidth={ICON_STROKE}
                        />
                      </motion.span>
                    </span>
                    <span aria-hidden />
                  </button>
                )}
              </div>
            )}
          </section>
        )}
      </ScrollFade>
    </div>
  );
}
