"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ClipboardCheck,
  FolderKanban,
  MessageCircle,
  Newspaper,
  Search,
  User,
  Zap,
  Blocks,
  type LucideIcon,
} from "lucide-react";
import {
  SEARCH_KIND_ORDER,
  buildSearchIndex,
  searchIndex,
  type SearchResult,
  type SearchResultKind,
} from "@/lib/search-index";
import { useChat } from "@/context/ChatContext";
import { useMessaging } from "@/context/MessagingContext";
import { MagnusLogo } from "@/components/brand/MagnusLogo";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

const KIND_META: Record<
  SearchResultKind,
  { label: string; icon: LucideIcon }
> = {
  page: { label: "Pages", icon: Search },
  chat: { label: "Magnus chats", icon: MessageCircle },
  message: { label: "Messages", icon: MessageCircle },
  post: { label: "Posts", icon: Newspaper },
  person: { label: "People", icon: User },
  skill: { label: "Skills", icon: Zap },
  integration: { label: "Integrations", icon: Blocks },
  workspace: { label: "Workspaces", icon: FolderKanban },
  approval: { label: "Approvals", icon: ClipboardCheck },
  event: { label: "Events", icon: CalendarDays },
};

/**
 * Unified search results — powered by search-index.
 */
export function SearchResultsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    chats,
    selectChat,
    setAppMode,
    enterChatMode,
    rememberLastChatPath,
    newChat,
    sendMessage,
  } = useChat();
  const { conversations, selectConversation } = useMessaging();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);

  const liveResults = useMemo(
    () =>
      searchIndex(
        query,
        buildSearchIndex({ chats, conversations })
      ),
    [query, chats, conversations]
  );

  const grouped = useMemo(() => {
    const map = new Map<SearchResultKind, SearchResult[]>();
    for (const kind of SEARCH_KIND_ORDER) map.set(kind, []);
    for (const r of liveResults) {
      map.get(r.kind)?.push(r);
    }
    return SEARCH_KIND_ORDER.map((kind) => ({
      kind,
      items: map.get(kind) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [liveResults]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.replace(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const openResult = (r: SearchResult) => {
    if (r.kind === "chat") {
      const id = r.chatId ?? r.href.replace("/?chat=", "");
      selectChat(id);
      setAppMode("chat");
      router.push("/");
      return;
    }
    if (r.kind === "message" && r.conversationId) {
      selectConversation(r.conversationId);
      rememberLastChatPath("/messages");
      enterChatMode();
      router.push("/messages");
      return;
    }
    router.push(r.href);
  };

  const askMagnus = () => {
    const q = query.trim();
    if (!q) return;
    newChat();
    setAppMode("chat");
    router.push("/");
    window.setTimeout(() => sendMessage(q), 50);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <PageHeader
            eyebrow="Search"
            icon={Search}
            title="Find anything"
            description="People, posts, approvals, calendar, chats, and tools — one place to jump in."
          />

          <form onSubmit={onSubmit} className="mt-2">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                strokeWidth={ICON_STROKE}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Magnus…"
                autoFocus
                data-search-input
                className={cn(
                  "w-full rounded-[14px] border border-[var(--glass-border-soft)]",
                  "bg-[var(--glass-strong-solid)] py-3 pl-10 pr-4 text-[14.5px]",
                  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                )}
              />
            </label>
          </form>

          <div className="mt-6 space-y-6" data-search-results>
            {query.trim() && liveResults.length === 0 ? (
              <div
                className="rounded-[16px] border border-[var(--glass-border-soft)] bg-[var(--glass-strong-solid)] px-5 py-10 text-center"
                data-search-empty
              >
                <p className="text-[14px] font-medium text-[var(--text-primary)]">
                  No matches for “{query.trim()}”
                </p>
                <p className="mt-1 text-[13px] text-[var(--text-muted)]">
                  Try a person name, project, or calendar — or ask Magnus.
                </p>
                <button
                  type="button"
                  onClick={askMagnus}
                  className={cn(
                    "btn-primary mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2.5",
                    "text-[13px] font-semibold",
                    "transition-transform duration-150 active:scale-[0.98]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                  )}
                  data-search-ask-magnus
                >
                  <MagnusLogo size={18} tone="white" />
                  Ask Magnus
                </button>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {["Maya", "approvals", "standup", "safety"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setQuery(s);
                        router.replace(`/search?q=${encodeURIComponent(s)}`);
                      }}
                      className="rounded-full border border-[var(--glass-border-soft)] px-3 py-1 text-[12px] text-[var(--text-secondary)] hover:bg-[var(--hover-fill)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              grouped.map((group) => {
                const meta = KIND_META[group.kind];
                const Icon = meta.icon;
                return (
                  <section key={group.kind} data-search-group={group.kind}>
                    <h2 className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                      <Icon className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                      {meta.label}
                    </h2>
                    <ul className="flex flex-col gap-1.5">
                      {group.items.map((r, i) => (
                        <motion.li
                          key={r.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: Math.min(i * 0.02, 0.16),
                            duration: 0.28,
                            ease: easeSpring,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => openResult(r)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-[14px] border border-[var(--glass-border-soft)]",
                              "bg-[var(--glass-strong-solid)] px-3.5 py-3 text-left",
                              "transition-[border-color] hover:border-[var(--glass-border)]"
                            )}
                            data-search-result={r.id}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                                {r.title}
                              </p>
                              {r.subtitle && (
                                <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">
                                  {r.subtitle}
                                </p>
                              )}
                            </div>
                          </button>
                        </motion.li>
                      ))}
                    </ul>
                  </section>
                );
              })
            )}

            {!query.trim() && (
              <div className="rounded-[16px] border border-[var(--glass-border-soft)] bg-[var(--glass-strong-solid)] px-5 py-8">
                <p className="text-[13px] text-[var(--text-secondary)]">
                  Start typing, or jump to common surfaces:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { href: "/approvals", label: "Approvals" },
                    { href: "/calendar", label: "Calendar" },
                    { href: "/people", label: "People" },
                    { href: "/feed", label: "Feed" },
                  ].map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="rounded-full border border-[var(--glass-border-soft)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] hover:bg-[var(--hover-fill)]"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollFade>
    </div>
  );
}
