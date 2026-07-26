"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Blocks,
  CalendarDays,
  ClipboardCheck,
  FolderKanban,
  MessageCircle,
  Newspaper,
  Search,
  User,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Portal } from "@/components/ui/Portal";
import { useChat } from "@/context/ChatContext";
import { useTheme } from "@/context/ThemeContext";
import {
  chatToCommand,
  filterGlobalCommands,
  GROUP_ORDER,
  staticGlobalCommands,
  type GlobalCommand,
  type GlobalCommandGroup,
} from "@/lib/global-commands";
import {
  buildSearchIndex,
  searchIndex,
  type SearchResultKind,
} from "@/lib/search-index";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";
import { ShortcutsHelp } from "@/components/chat/ShortcutsHelp";

const RESULT_ICONS: Record<SearchResultKind, LucideIcon> = {
  page: Search,
  chat: MessageCircle,
  message: MessageCircle,
  post: Newspaper,
  person: User,
  skill: Zap,
  integration: Blocks,
  workspace: FolderKanban,
  approval: ClipboardCheck,
  event: CalendarDays,
};

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return Boolean(el.closest("[contenteditable='true']"));
}

function modKey(e: KeyboardEvent) {
  return e.metaKey || e.ctrlKey;
}

/**
 * Global ⌘K palette + app-wide keyboard shortcuts.
 */
export function GlobalCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    chats,
    newChat,
    goHome,
    catchMeUp,
    selectChat,
    sidebarCollapsed,
    setSidebarCollapsed,
    setSidebarOpen,
  } = useChat();
  const { toggleTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo(() => {
    const recent = chats
      .filter((c) => !c.archived)
      .slice(0, 8)
      .map(chatToCommand);
    const base = filterGlobalCommands(
      [...staticGlobalCommands, ...recent],
      query
    );

    const q = query.trim();
    if (!q) return base;

    const hits = searchIndex(q, buildSearchIndex(chats)).slice(0, 14);
    const results: GlobalCommand[] = hits.map((hit) => {
      if (hit.kind === "chat" && hit.href.startsWith("/?chat=")) {
        const chatId = hit.href.replace("/?chat=", "");
        return {
          id: `result-${hit.id}`,
          label: hit.title,
          description: hit.subtitle ?? "Chat",
          group: "Results" as const,
          icon: RESULT_ICONS[hit.kind],
          action: "select-chat" as const,
          chatId,
          keywords: [hit.keywords],
        };
      }
      return {
        id: `result-${hit.id}`,
        label: hit.title,
        description: hit.subtitle ?? hit.kind,
        group: "Results" as const,
        icon: RESULT_ICONS[hit.kind],
        action: "navigate" as const,
        href: hit.href,
        keywords: [hit.keywords],
      };
    });

    // Prefer search hits first when querying; de-dupe by label+href against base
    const baseKeys = new Set(
      base.map((c) => `${c.label}|${c.href ?? c.chatId ?? c.id}`)
    );
    const uniqueResults = results.filter(
      (r) => !baseKeys.has(`${r.label}|${r.href ?? r.chatId ?? r.id}`)
    );
    return [...uniqueResults, ...base];
  }, [chats, query]);

  const grouped = useMemo(() => {
    const map = new Map<GlobalCommandGroup, GlobalCommand[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    for (const c of commands) {
      map.get(c.group)?.push(c);
    }
    return GROUP_ORDER.map((g) => ({
      group: g,
      items: map.get(g) ?? [],
    })).filter((x) => x.items.length > 0);
  }, [commands]);

  const flat = useMemo(
    () => grouped.flatMap((g) => g.items),
    [grouped]
  );

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const run = useCallback(
    (cmd: GlobalCommand) => {
      close();
      switch (cmd.action) {
        case "new-chat":
          newChat();
          if (pathname !== "/") router.push("/");
          break;
        case "go-home":
          goHome();
          if (pathname !== "/") router.push("/");
          break;
        case "catch-me-up":
          catchMeUp();
          if (pathname !== "/") router.push("/");
          break;
        case "toggle-theme":
          toggleTheme();
          break;
        case "toggle-sidebar":
          if (window.matchMedia("(max-width: 767px)").matches) {
            setSidebarOpen(true);
          } else {
            setSidebarCollapsed(!sidebarCollapsed);
          }
          break;
        case "shortcuts-help":
          setHelpOpen(true);
          break;
        case "navigate":
          if (cmd.href === "/") goHome();
          if (cmd.href) router.push(cmd.href);
          break;
        case "select-chat":
          if (cmd.chatId) {
            selectChat(cmd.chatId);
            if (pathname !== "/") router.push("/");
          }
          break;
      }
    },
    [
      catchMeUp,
      close,
      goHome,
      newChat,
      pathname,
      router,
      selectChat,
      setSidebarCollapsed,
      setSidebarOpen,
      sidebarCollapsed,
      toggleTheme,
    ]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K
      if (modKey(e) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setHelpOpen(false);
        return;
      }

      // ⌘N new chat
      if (modKey(e) && e.key.toLowerCase() === "n" && !e.shiftKey) {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        newChat();
        if (pathname !== "/") router.push("/");
        return;
      }

      // ⌘B sidebar
      if (modKey(e) && e.key.toLowerCase() === "b") {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        if (window.matchMedia("(max-width: 767px)").matches) {
          setSidebarOpen(true);
        } else {
          setSidebarCollapsed(!sidebarCollapsed);
        }
        return;
      }

      // ⌘. theme
      if (modKey(e) && e.key === ".") {
        e.preventDefault();
        toggleTheme();
        return;
      }

      // ⌘/ shortcuts
      if (modKey(e) && e.key === "/") {
        e.preventDefault();
        setHelpOpen((v) => !v);
        setOpen(false);
        return;
      }

      // ? when not typing
      if (e.key === "?" && !modKey(e) && !isTypingTarget(e.target)) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }

      if (e.key === "Escape") {
        if (open) {
          e.preventDefault();
          close();
        } else if (helpOpen) {
          e.preventDefault();
          setHelpOpen(false);
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    close,
    helpOpen,
    newChat,
    open,
    pathname,
    router,
    setSidebarCollapsed,
    setSidebarOpen,
    sidebarCollapsed,
    toggleTheme,
  ]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-index="${active}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) =>
        flat.length ? (i - 1 + flat.length) % flat.length : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = flat[active];
      if (cmd) run(cmd);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  let runningIndex = -1;

  return (
    <>
      <Portal>
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="cmdk-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
                onClick={close}
                aria-hidden
              />
              <motion.div
                key="cmdk"
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: easeSpring }}
                className={cn(
                  "fixed left-1/2 top-[min(18vh,140px)] z-[160] w-[min(100%-1.5rem,560px)] -translate-x-1/2",
                  "overflow-hidden rounded-2xl border border-[var(--glass-border)]",
                  "bg-[var(--glass-strong-solid)] shadow-[var(--shadow-menu)]"
                )}
              >
                <div className="flex items-center gap-2 border-b border-[var(--glass-border-soft)] px-3.5 py-3">
                  <Search
                    className="h-4 w-4 shrink-0 text-[var(--text-muted)]"
                    strokeWidth={ICON_STROKE}
                  />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onInputKey}
                    placeholder="Search people, posts, approvals, chats…"
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                    aria-autocomplete="list"
                    aria-controls="global-cmd-list"
                  />
                  <kbd className="hidden rounded-md border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] sm:inline">
                    esc
                  </kbd>
                </div>

                <div
                  id="global-cmd-list"
                  ref={listRef}
                  role="listbox"
                  className="scroll-thin max-h-[min(52vh,380px)] overflow-y-auto p-1.5"
                >
                  {flat.length === 0 && (
                    <p className="px-3 py-8 text-center text-[13px] text-[var(--text-muted)]">
                      No matches for “{query}”
                    </p>
                  )}
                  {grouped.map(({ group, items }) => (
                    <div key={group} className="mb-1.5">
                      <p className="side-section px-2.5 py-1.5">{group}</p>
                      <div className="space-y-0.5">
                        {items.map((cmd) => {
                          runningIndex += 1;
                          const index = runningIndex;
                          const Icon = cmd.icon;
                          const isActive = index === active;
                          return (
                            <button
                              key={cmd.id}
                              type="button"
                              role="option"
                              aria-selected={isActive}
                              data-cmd-index={index}
                              onMouseEnter={() => setActive(index)}
                              onClick={() => run(cmd)}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left",
                                "transition-colors duration-100",
                                isActive
                                  ? "bg-[var(--select-fill)] text-[var(--select-text)]"
                                  : "text-[var(--text-secondary)] hover:bg-[var(--hover-fill)]"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                  isActive
                                    ? "bg-[var(--hover-fill-strong)]"
                                    : "bg-[var(--hover-fill)]"
                                )}
                              >
                                <Icon
                                  className="h-4 w-4"
                                  strokeWidth={ICON_STROKE}
                                />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13.5px] font-medium text-[var(--text-primary)]">
                                  {cmd.label}
                                </span>
                                {cmd.description && (
                                  <span className="mt-0.5 block truncate text-[11.5px] text-[var(--text-muted)]">
                                    {cmd.description}
                                  </span>
                                )}
                              </span>
                              {cmd.shortcut && (
                                <kbd className="shrink-0 rounded-md border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--text-muted)]">
                                  {cmd.shortcut}
                                </kbd>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-[var(--glass-border-soft)] px-3.5 py-2 text-[11px] text-[var(--text-muted)]">
                  <span>↑↓ navigate · ↵ open</span>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      setHelpOpen(true);
                    }}
                    className="font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    All shortcuts
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Portal>

      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
