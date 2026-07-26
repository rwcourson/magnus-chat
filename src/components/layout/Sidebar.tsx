"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Bell,
  Zap,
  Clock3,
  Blocks,
  FolderKanban,
  MessageCircle,
  ChevronsUpDown,
  X,
  PanelLeft,
  PanelLeftOpen,
  HelpCircle,
  Settings,
  Moon,
  Sun,
  Newspaper,
  House,
  Users,
  Radar,
  Search,
  type LucideIcon,
} from "lucide-react";
import { MagnusLogo } from "@/components/brand/MagnusLogo";
import { Portal } from "@/components/ui/Portal";
import { useChat } from "@/context/ChatContext";
import { useScout } from "@/context/ScoutContext";
import { useTheme } from "@/context/ThemeContext";
import { currentUser } from "@/lib/mock-data";
import { canAccessInsights } from "@/lib/auth-demo";
import { ConversationNav } from "@/components/messaging/ConversationNav";
import { MagnusChatControl } from "@/components/messaging/MagnusChatControl";
import { MagnusHistoryDrawer } from "@/components/messaging/MagnusHistoryDrawer";
import { useMessaging } from "@/context/MessagingContext";
import { useSidebarPrefs } from "@/context/SidebarPrefsContext";
import { visibleHomeNav, isChatSectionVisible } from "@/lib/sidebar-prefs";
import {
  buildSearchIndex,
  searchIndex,
  SEARCH_KIND_LABEL,
  type SearchResult,
} from "@/lib/search-index";
import {
  CollapsedFlyout,
  FlyoutRow,
  RAIL_HIT,
  SideRowBg,
} from "@/components/layout/RailItem";
import { cn } from "@/lib/utils";
import { springLayout, springSnappy } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";
import type { AppMode } from "@/types/home";

/* ── Uniform sidebar metrics ──────────────────────────────
 * Icon glyph:     16×16
 * Icon slot:      20×20
 * Hit target:     36×36 (h-9 w-9)
 * Rail gap:       4px (gap-1)
 * Collapsed rail: 72px, icons centered
 * Top chrome:     shared horizontal inset so logo / Home·Chat /
 *                 Magnus Chat+history / Search share one width
 * ──────────────────────────────────────────────────────── */

const ICON = 16;
const STROKE = ICON_STROKE;
const railHit = RAIL_HIT;
/** Shared X inset for header, mode switch, Magnus Chat, search */
const TOP_X = "px-2.5";

const spring = springLayout;
const flySpring = springSnappy;

/** Intranet mode — social / news first (order/visibility from sidebar prefs) */
const homeNavItems: {
  id: import("@/lib/sidebar-prefs").HomeNavId;
  href: string;
  label: string;
  icon: LucideIcon;
  action?: "home" | "messages";
  badgeKey?: "comms";
}[] = [
  { id: "home", href: "/", label: "Home", icon: House, action: "home" },
  {
    id: "messages",
    href: "/messages",
    label: "Messages",
    icon: MessageCircle,
    action: "messages",
  },
  { id: "feed", href: "/feed", label: "Feed", icon: Newspaper },
  { id: "people", href: "/people", label: "People", icon: Users },
  // Notifications live in the top header — not duplicated in the sidebar
  {
    id: "comms",
    href: "/insights",
    label: "Insights",
    icon: Radar,
    badgeKey: "comms",
  },
  {
    id: "knowledge",
    href: "/workspaces",
    label: "Knowledge",
    icon: FolderKanban,
  },
];

const homeNavById = Object.fromEntries(
  homeNavItems.map((i) => [i.id, i])
) as Record<(typeof homeNavItems)[number]["id"], (typeof homeNavItems)[number]>;

/** Account menu — secondary tools live here (not Chat primary nav) */
const moreItems: {
  href: string;
  label: string;
  icon: LucideIcon;
  detail?: string;
}[] = [
  {
    href: "/skills",
    label: "Agent Skills",
    icon: Zap,
    detail: "Prompts & agents",
  },
  {
    href: "/routines",
    label: "Routines",
    icon: Clock3,
    detail: "Scheduled runs",
  },
  {
    href: "/workspaces",
    label: "Workspaces",
    icon: FolderKanban,
    detail: "Knowledge hubs",
  },
  {
    href: "/integrations",
    label: "Integrations",
    icon: Blocks,
    detail: "Connectors & apps",
  },
  { href: "/help", label: "Help center", icon: HelpCircle, detail: "Guides & FAQ" },
  { href: "/settings", label: "Settings", icon: Settings, detail: "Preferences" },
];

function IconSlot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center",
        className
      )}
    >
      {children}
    </span>
  );
}

function SideIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <IconSlot>
      <Icon
        size={ICON}
        strokeWidth={STROKE}
        absoluteStrokeWidth
        className={cn("block", className)}
      />
    </IconSlot>
  );
}

function HeaderIconBtn({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
        "text-[var(--text-secondary)]",
        "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
        "active:scale-[0.96]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
        "transition-[background,color,transform] duration-150 ease-out",
        className
      )}
    >
      <IconSlot>{children}</IconSlot>
    </button>
  );
}

function SidebarPanel({
  collapsed,
  onCloseMobile,
  modeLayoutId = "mode-switch-pill-desktop",
}: {
  collapsed: boolean;
  onCloseMobile?: () => void;
  modeLayoutId?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    goHome,
    appMode,
    setAppMode,
    setSidebarCollapsed,
    enterChatMode,
    rememberLastChatPath,
    activeChatId,
    isNewChatSurface,
    chats,
    selectChat,
  } = useChat();
  const { conversations, selectConversation } = useMessaging();
  const { pendingCount } = useScout();
  const { theme, toggleTheme } = useTheme();
  const { prefs } = useSidebarPrefs();
  const navLayoutId = useId();
  /** Team messaging owns the sidebar when Chat mode *or* on /messages */
  const messagingSidebar =
    appMode === "chat" || pathname.startsWith("/messages");
  /** Home destinations only when not in messaging shell — respect user prefs */
  const navItems = messagingSidebar
    ? []
    : visibleHomeNav(prefs)
        .map((id) => homeNavById[id])
        .filter(Boolean)
        // Insights is capability-gated (leadership / IC demo access)
        .filter((item) =>
          item.id === "comms" ? canAccessInsights() : true
        );
  const showMagnusChat = isChatSectionVisible(prefs, "magnusChat");
  const showChannels = isChatSectionVisible(prefs, "channels");
  const showDms = isChatSectionVisible(prefs, "dms");
  /** Shared sidebar search — under Home/Chat, both modes */
  const [sidebarSearch, setSidebarSearch] = useState("");
  const searchQ = sidebarSearch.trim();
  /** Global hits — same index in Home and Chat so “James” works everywhere */
  const globalHits = useMemo(() => {
    if (!searchQ) return [] as SearchResult[];
    return searchIndex(
      searchQ,
      buildSearchIndex({ chats, conversations })
    ).slice(0, 16);
  }, [searchQ, chats, conversations]);

  const openSearchResult = useCallback(
    (r: SearchResult) => {
      if (r.kind === "chat") {
        const id = r.chatId ?? r.href.replace("/?chat=", "");
        selectChat(id);
        setAppMode("chat");
        router.push("/");
        setSidebarSearch("");
        onCloseMobile?.();
        return;
      }
      if (r.kind === "message" && r.conversationId) {
        selectConversation(r.conversationId);
        rememberLastChatPath("/messages");
        enterChatMode();
        router.push("/messages");
        setSidebarSearch("");
        onCloseMobile?.();
        return;
      }
      if (r.kind === "person" && r.href.startsWith("/people")) {
        router.push(r.href);
        setSidebarSearch("");
        onCloseMobile?.();
        return;
      }
      router.push(r.href);
      setSidebarSearch("");
      onCloseMobile?.();
    },
    [
      selectChat,
      setAppMode,
      router,
      selectConversation,
      rememberLastChatPath,
      enterChatMode,
      onCloseMobile,
    ]
  );

  const expandSidebar = useCallback(() => {
    setSidebarCollapsed(false);
  }, [setSidebarCollapsed]);

  const collapseSidebar = useCallback(() => {
    setSidebarCollapsed(true);
  }, [setSidebarCollapsed]);

  /** Collapsed rail: empty chrome expands; buttons/links keep their own actions */
  const onCollapsedShellClick = useCallback(
    (e: React.MouseEvent) => {
      if (!collapsed) return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (
        t.closest(
          'button, a, input, textarea, select, [role="button"], [role="menuitem"], [data-conversation], [data-magnus-chat], [data-magnus-history], [data-no-sidebar-expand]'
        )
      ) {
        return;
      }
      expandSidebar();
    },
    [collapsed, expandSidebar]
  );

  const rowBase = cn(
    "transition-[color,background] duration-150 ease-out",
    "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
    collapsed
      ? cn(railHit, "group")
      : "side-label group relative flex h-9 w-full items-center gap-3 rounded-xl px-2.5"
  );

  // Remember last Chat-mode surface so Home → Chat restores it cleanly
  useEffect(() => {
    if (appMode !== "chat") return;
    if (pathname.startsWith("/messages")) {
      rememberLastChatPath("/messages");
      return;
    }
    for (const base of [
      "/skills",
      "/routines",
      "/workspaces",
      "/integrations",
      "/approvals",
      "/calendar",
    ] as const) {
      if (pathname === base || pathname.startsWith(`${base}/`)) {
        rememberLastChatPath(pathname);
        return;
      }
    }
    if (pathname === "/" || pathname.startsWith("/chat")) {
      if (activeChatId) {
        rememberLastChatPath(`/?chat=${encodeURIComponent(activeChatId)}`);
      } else if (isNewChatSurface) {
        rememberLastChatPath("/");
      }
    }
  }, [
    appMode,
    pathname,
    activeChatId,
    isNewChatSurface,
    rememberLastChatPath,
  ]);

  const onModeChange = (mode: AppMode) => {
    if (mode === "home") {
      goHome();
      if (pathname !== "/") router.push("/");
    } else {
      // Always leave Home for a Chat surface: last session view, or new chat
      const dest = enterChatMode();
      const onMessages =
        pathname.startsWith("/messages") && dest.startsWith("/messages");
      const onSameCatalog =
        dest !== "/messages" &&
        dest !== "/" &&
        !dest.includes("chat=") &&
        (pathname === dest || pathname.startsWith(`${dest}/`));
      const onSameAiThread =
        dest.includes("chat=") &&
        pathname === "/" &&
        activeChatId != null &&
        dest.includes(activeChatId);
      // New Magnus empty state lives on `/` — already there after enterChatMode
      const onNewChatSurface = dest === "/" && pathname === "/";

      if (!onMessages && !onSameCatalog && !onSameAiThread && !onNewChatSurface) {
        router.push(dest.startsWith("/") ? dest : `/${dest}`);
      }
    }
    onCloseMobile?.();
  };

  return (
    <div
      className={cn(
        "glass-sidebar relative z-0 flex h-full w-full flex-col",
        collapsed && "overflow-visible cursor-pointer"
      )}
      onClick={onCollapsedShellClick}
      data-sidebar-collapsed={collapsed ? "true" : undefined}
    >
      {/* ── Header — same content width as Home/Chat + Magnus Chat ── */}
      <div
        className={cn(
          "relative z-10 flex shrink-0 items-center",
          collapsed
            ? "flex-col gap-0.5 px-2 pt-2.5 pb-1"
            : cn("h-12 justify-between gap-1", TOP_X)
        )}
        data-sidebar-top-header
      >
        {/* Logo — always Home (collapse is a dedicated control) */}
        <button
          type="button"
          data-no-sidebar-expand
          onClick={() => {
            goHome();
            onCloseMobile?.();
            if (pathname !== "/") router.push("/");
          }}
          className={cn(
            "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
            "inline-flex shrink-0 items-center justify-center text-[var(--text-secondary)]",
            "h-9 w-9 rounded-xl",
            "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
            "transition-colors duration-150"
          )}
          aria-label="Home"
        >
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
            <MagnusLogo size={20} tone="sidebar" />
          </span>
        </button>

        {!collapsed && (
          <div className="flex h-9 shrink-0 items-center gap-1">
            <HeaderIconBtn
              label="Notifications"
              onClick={() => {
                router.push("/notifications");
                onCloseMobile?.();
              }}
            >
              <Bell
                size={ICON}
                strokeWidth={STROKE}
                absoluteStrokeWidth
                className="block"
              />
            </HeaderIconBtn>
            <HeaderIconBtn
              label="Collapse sidebar"
              onClick={collapseSidebar}
              className="hidden md:inline-flex"
            >
              <PanelLeft
                size={ICON}
                strokeWidth={STROKE}
                absoluteStrokeWidth
                className="block"
              />
            </HeaderIconBtn>
            {onCloseMobile && (
              <HeaderIconBtn
                label="Close menu"
                onClick={onCloseMobile}
                className="md:hidden"
              >
                <X
                  size={ICON}
                  strokeWidth={STROKE}
                  absoluteStrokeWidth
                  className="block"
                />
              </HeaderIconBtn>
            )}
          </div>
        )}

        {collapsed && onCloseMobile && (
          <button
            type="button"
            aria-label="Close menu"
            title="Close menu"
            data-no-sidebar-expand
            onClick={onCloseMobile}
            className={cn(
              railHit,
              "md:hidden text-[var(--text-secondary)]",
              "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
            )}
          >
            <SideIcon icon={X} />
          </button>
        )}
      </div>

      {/* ── Mode: full switch expanded; single toggle when collapsed ── */}
      {!collapsed ? (
        <div
          className={cn("relative z-10 pb-2 pt-0.5", TOP_X)}
          data-sidebar-top-mode
        >
          <ModeSwitch
            mode={appMode}
            onChange={onModeChange}
            layoutId={modeLayoutId}
          />
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center px-2 pb-1.5">
          <FlyoutRow
            collapsed
            label={appMode === "home" ? "Home mode" : "Chat mode"}
            detail={
              appMode === "home" ? "Click for Chat" : "Click for Home"
            }
          >
            <button
              type="button"
              aria-label={
                appMode === "home"
                  ? "Home mode — switch to Chat"
                  : "Chat mode — switch to Home"
              }
              title={appMode === "home" ? "Home · switch to Chat" : "Chat · switch to Home"}
              onClick={() =>
                onModeChange(appMode === "home" ? "chat" : "home")
              }
              className={cn(
                railHit,
                "text-[var(--select-text)]",
                "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
              )}
            >
              <SideRowBg active />
              <span className="relative z-10">
                <SideIcon
                  icon={appMode === "home" ? House : MessageCircle}
                />
              </span>
            </button>
          </FlyoutRow>
          {/* Subtle divider under mode */}
          <span
            aria-hidden
            className="mt-1.5 h-px w-6 bg-[var(--glass-border-soft)]"
          />
        </div>
      )}

      {/* ── Search — under Home/Chat, both modes ── */}
      {!collapsed && (
        <div
          className={cn("relative z-10 pb-2", TOP_X)}
          data-sidebar-top-search
        >
          <label className="relative block w-full">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              strokeWidth={STROKE}
            />
            <input
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const q = sidebarSearch.trim();
                if (!q) return;
                // Full unified results surface
                router.push(`/search?q=${encodeURIComponent(q)}`);
                onCloseMobile?.();
              }}
              placeholder="Search people, messages…"
              className={cn(
                "h-9 w-full rounded-xl",
                "border border-[var(--glass-border-soft)] bg-[var(--hover-fill)]",
                "py-0 pl-9 pr-3 text-[13px] font-medium leading-none text-[var(--text-primary)]",
                "placeholder:font-normal placeholder:text-[var(--text-muted)] outline-none",
                "transition-colors duration-150",
                "hover:border-[var(--glass-border)] hover:bg-[var(--hover-fill-strong)]",
                "focus-visible:border-[var(--glass-border)] focus-visible:bg-[var(--hover-fill-strong)]"
              )}
              data-messaging-search
              data-sidebar-search
              aria-label="Search people, messages, chats, and more"
            />
          </label>
        </div>
      )}

      {/* ── Primary nav (mode-specific) — hide when global search is active ── */}
      <LayoutGroup id={navLayoutId}>
        <nav
          className={cn(
            "relative z-10 flex flex-col",
            collapsed ? "items-center gap-0.5 px-2" : cn("gap-0.5", TOP_X),
            !collapsed && searchQ && "hidden"
          )}
        >
          {navItems
            .filter((item) => {
              if (collapsed) return true;
              return true;
            })
            .map((item) => {
            // Collapsed: mode toggle already covers “Home” — skip duplicate house icon
            if (collapsed && item.action === "home") return null;

            const active =
              item.action === "home"
                ? pathname === "/" && appMode === "home"
                : item.action === "messages"
                  ? false // switches to Chat mode; highlight there via channels
                  : item.href === "/feed"
                    ? pathname === "/feed" || pathname.startsWith("/feed/")
                    : item.href === "/insights"
                      ? pathname === "/insights" ||
                        pathname.startsWith("/insights/") ||
                        pathname === "/comms" ||
                        pathname.startsWith("/comms/")
                      : pathname.startsWith(item.href);
            const badge =
              "badgeKey" in item && item.badgeKey === "comms" && pendingCount > 0
                ? pendingCount
                : null;

            return (
              <FlyoutRow
                key={`${appMode}-${item.label}`}
                collapsed={collapsed}
                label={badge ? `${item.label} (${badge})` : item.label}
              >
                <Link
                  href={item.href}
                  data-tour-target={
                    item.id === "messages" || item.id === "feed"
                      ? item.id
                      : item.id === "home"
                        ? "home"
                        : undefined
                  }
                  onClick={() => {
                    if (item.action === "home") goHome();
                    else if (item.action === "messages") {
                      rememberLastChatPath("/messages");
                      enterChatMode();
                      if (!pathname.startsWith("/messages")) {
                        router.push("/messages");
                      }
                    }
                    onCloseMobile?.();
                  }}
                  className={cn(
                    rowBase,
                    active
                      ? "text-[var(--select-text)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <SideRowBg active={active} />
                  {collapsed ? (
                    /* Icon-only — perfectly centered in the 36×36 rail hit */
                    <span className="relative z-10">
                      <SideIcon
                        icon={item.icon}
                        className={cn(
                          "transition-opacity duration-150",
                          active
                            ? "opacity-100"
                            : "opacity-80 group-hover:opacity-100"
                        )}
                      />
                      {badge != null && (
                        <span className="btn-solid absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[8px] font-bold leading-none shadow-none">
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="relative z-10 flex w-full items-center gap-3">
                      <span className="relative">
                        <SideIcon
                          icon={item.icon}
                          className={cn(
                            "transition-opacity duration-150",
                            active
                              ? "opacity-100"
                              : "opacity-80 group-hover:opacity-100"
                          )}
                        />
                      </span>
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-2 truncate">
                        <span className="truncate">{item.label}</span>
                        {badge != null && (
                          <span className="shrink-0 rounded-full bg-[var(--hover-fill-strong)] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[var(--text-secondary)]">
                            {badge}
                          </span>
                        )}
                      </span>
                    </span>
                  )}
                </Link>
              </FlyoutRow>
            );
          })}
        </nav>
      </LayoutGroup>

      {/* ── Main body: global search hits OR mode body ── */}
      <div
        className={cn(
          "relative z-10 flex min-h-0 flex-1 flex-col",
          collapsed ? "mt-1 items-center px-2" : cn("mt-0.5", TOP_X)
        )}
        data-sidebar-top-body
      >
        {!collapsed && searchQ ? (
          <div
            className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-thin pb-2"
            data-sidebar-global-results
          >
            {globalHits.length === 0 ? (
              <p className="px-2.5 py-4 text-[12px] leading-relaxed text-[var(--text-muted)]">
                No matches for “{searchQ}”. Try a person, channel, or page
                name.
              </p>
            ) : (
              <ul className="flex flex-col gap-0.5 px-0.5">
                {globalHits.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => openSearchResult(r)}
                      className={cn(
                        "flex w-full flex-col gap-0.5 rounded-xl px-2.5 py-2 text-left",
                        "text-[var(--text-secondary)] transition-colors",
                        "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                      )}
                      data-sidebar-search-result={r.id}
                      data-search-kind={r.kind}
                    >
                      <span className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                        {r.title}
                      </span>
                      <span className="truncate text-[11px] text-[var(--text-muted)]">
                        {SEARCH_KIND_LABEL[r.kind]}
                        {r.subtitle ? ` · ${r.subtitle}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => {
                router.push(`/search?q=${encodeURIComponent(searchQ)}`);
                onCloseMobile?.();
              }}
              className="mx-2 mt-2 rounded-xl px-2.5 py-2 text-left text-[12px] font-medium text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
              data-sidebar-search-all
            >
              View all results
            </button>
          </div>
        ) : messagingSidebar ? (
          <>
            {(showChannels || showDms) && (
              <ConversationNav
                compact={collapsed}
                onNavigate={() => onCloseMobile?.()}
                showChannels={showChannels}
                showDms={showDms}
                hideSearch={!collapsed}
                searchQuery={sidebarSearch}
                onSearchQueryChange={setSidebarSearch}
              />
            )}
            {!showChannels && !showDms && !showMagnusChat && !collapsed && (
              <p className="py-4 text-[12px] leading-relaxed text-[var(--text-muted)]">
                Chat sidebar is empty. Enable sections in{" "}
                <Link
                  href="/settings"
                  className="font-medium text-[var(--text-secondary)] underline-offset-2 hover:underline"
                >
                  Settings
                </Link>
                .
              </p>
            )}
            {/* Full drawer still available if opened programmatically */}
            <MagnusHistoryDrawer />
          </>
        ) : collapsed ? (
          /* Free space — click shell expands; this fills height between nav and expand control */
          <div
            className="min-h-0 flex-1"
            aria-hidden
            title="Click to expand sidebar"
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col px-1 pt-3">
            <p className="px-2.5 text-[11.5px] leading-relaxed text-[var(--text-muted)]">
              Search people, messages, and Magnus chats from either mode — or
              open{" "}
              <button
                type="button"
                onClick={() => {
                  rememberLastChatPath("/messages");
                  enterChatMode();
                  router.push("/messages");
                }}
                className="font-medium text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
              >
                Messages
              </button>{" "}
              for channels.
            </p>
          </div>
        )}
      </div>

      {/* ── Collapsed: expand control above account (always visible) ── */}
      <AnimatePresence initial={false}>
        {collapsed && (
          <motion.div
            key="expand-rail"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex justify-center px-2 pb-1"
          >
            <FlyoutRow collapsed label="Expand sidebar" detail="Show full navigation">
              <button
                type="button"
                data-no-sidebar-expand
                aria-label="Expand sidebar"
                title="Expand sidebar"
                onClick={(e) => {
                  e.stopPropagation();
                  expandSidebar();
                }}
                className={cn(
                  railHit,
                  "group text-[var(--text-secondary)]",
                  "outline-none transition-colors duration-150",
                  "hover:text-[var(--text-primary)]",
                  "focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                )}
              >
                <SideRowBg />
                <span className="relative z-10">
                  <PanelLeftOpen
                    size={ICON}
                    strokeWidth={STROKE}
                    absoluteStrokeWidth
                    className="block"
                  />
                </span>
              </button>
            </FlyoutRow>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        Magnus Chat + history — docked above the account name on both Home and
        Chat sidebars so users can start/open chats from either mode.
        No divider here; only the user footer has a top border.
      */}
      {showMagnusChat && (
        <div
          className={cn(
            "relative z-10 shrink-0",
            collapsed
              ? "flex justify-center px-2 pb-3 pt-1.5"
              : cn(TOP_X, "pb-3.5 pt-2")
          )}
          data-sidebar-bottom-magnus
          data-no-sidebar-expand
        >
          <div className={cn(collapsed ? "w-auto" : "w-full")}>
            <MagnusChatControl
              variant={collapsed ? "sidebar-collapsed" : "sidebar"}
              onNavigate={() => onCloseMobile?.()}
            />
          </div>
        </div>
      )}

      {/* ── User footer — click name for More menu (sole bottom divider) ── */}
      <div
        className={cn(
          "relative z-10 border-t border-[var(--glass-border-soft)]",
          collapsed ? "flex justify-center p-2" : "p-2"
        )}
        data-no-sidebar-expand
      >
        <UserMenuButton
          collapsed={collapsed}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigate={() => onCloseMobile?.()}
        />
      </div>
    </div>
  );
}

function ModeSwitch({
  mode,
  onChange,
  layoutId = "mode-switch-pill",
}: {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
  /** Unique per shell instance — avoids dual layoutId glitches mobile+desktop */
  layoutId?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="App mode"
      className={cn(
        "flex rounded-xl p-0.5",
        "border border-[var(--glass-border-soft)] bg-[var(--hover-fill)]"
      )}
    >
      {(
        [
          {
            id: "home" as const,
            label: "Home",
            hint: "News & team",
            icon: House,
          },
          {
            id: "chat" as const,
            label: "Chat",
            hint: "Messages & Magnus",
            icon: MessageCircle,
          },
        ] as const
      ).map((tab) => {
        const active = mode === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            title={tab.hint}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[10px]",
              "text-[12px] font-medium transition-colors duration-150",
              active
                ? "text-[var(--select-text)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-[10px] bg-[var(--select-fill)] shadow-[var(--select-shadow)]"
                transition={spring}
              />
            )}
            <Icon
              className="relative z-[1] h-3.5 w-3.5"
              strokeWidth={STROKE}
            />
            <span className="relative z-[1]">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Bottom account control. Click name/avatar to open More menu.
 * Same row metrics as sidebar nav (h-9 · 16px icons · side-label).
 * Close via: click name again, click outside, or Escape.
 */
function UserMenuButton({
  collapsed,
  theme,
  onToggleTheme,
  onNavigate,
}: {
  collapsed: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{
    bottom: number;
    left: number;
    width: number;
  } | null>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  const updatePos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Match expanded sidebar content width; collapsed: compact panel to the right
    const width = collapsed ? 220 : Math.max(r.width, 220);
    let left = collapsed ? r.right + 8 : r.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }
    setPos({
      // Sit just above the trigger (gap matches other flyouts)
      bottom: window.innerHeight - r.top + 6,
      left,
      width,
    });
  }, [collapsed]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    updatePos();
    const raf = requestAnimationFrame(updatePos);
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    // pointerdown so outside-close feels instant; skip trigger (name toggles on click)
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open, close]);

  /** Same geometry as primary nav rows */
  const menuRowClass = cn(
    "group relative flex h-9 w-full items-center gap-3 rounded-xl px-2.5",
    "side-label text-left",
    "text-[var(--text-secondary)]",
    "transition-colors duration-150",
    "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
    "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
  );

  return (
    <>
      <FlyoutRow
        collapsed={collapsed}
        label={currentUser.name}
        detail="Account & more"
      >
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={open ? "Close account menu" : "Open account menu"}
          onClick={toggle}
          className={cn(
            "group relative flex items-center rounded-xl",
            "transition-[color,background] duration-150 ease-out",
            "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
            collapsed
              ? cn(railHit)
              : "side-label h-9 w-full gap-3 px-2.5",
            "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]",
            open && "text-[var(--text-primary)]"
          )}
        >
          <SideRowBg active={open} />
          <span className="relative z-10 inline-flex h-5 w-5 shrink-0 items-center justify-center">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--btn-primary-bg)] text-[8px] font-semibold leading-none text-[var(--btn-primary-fg)] shadow-[0_0_0_1px_var(--btn-primary-border)_inset]">
              {currentUser.initials}
            </span>
          </span>
          {!collapsed && (
            <span className="relative z-10 flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              <span className="side-label min-w-0 flex-1 truncate text-left text-[var(--text-primary)]">
                {currentUser.name}
              </span>
              <IconSlot
                className={cn(
                  "text-[var(--text-muted)] transition-transform duration-200",
                  open && "rotate-180"
                )}
              >
                <ChevronsUpDown
                  size={ICON}
                  strokeWidth={STROKE}
                  absoluteStrokeWidth
                  className="block"
                />
              </IconSlot>
            </span>
          )}
        </button>
      </FlyoutRow>

      <Portal>
        <AnimatePresence>
          {open && pos && (
            <>
              {/* Full-screen dismiss layer (click off) */}
              <motion.div
                key="user-menu-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="fixed inset-0 z-[99]"
                aria-hidden
                onClick={close}
              />
              <motion.div
                ref={menuRef}
                key="user-menu"
                role="menu"
                aria-label="Account and more"
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={flySpring}
                style={{
                  position: "fixed",
                  bottom: pos.bottom,
                  left: pos.left,
                  width: pos.width,
                  zIndex: 100,
                  transformOrigin: collapsed ? "bottom left" : "bottom center",
                }}
              >
                <div
                  className={cn(
                    "glass-strong overflow-hidden rounded-2xl py-1",
                    "border border-[var(--glass-border)]",
                    "shadow-[var(--shadow-menu)]",
                    "[--text-primary:var(--sidebar-text-primary)]",
                    "[--text-secondary:var(--sidebar-text-secondary)]",
                    "[--text-muted:var(--sidebar-text-muted)]"
                  )}
                >
                  <div className="px-2.5 pb-1 pt-1.5">
                    <p className="side-section px-0.5">More</p>
                  </div>

                  <div className="flex flex-col gap-0.5 px-1">
                    {moreItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          role="menuitem"
                          onClick={() => {
                            close();
                            onNavigate();
                          }}
                          className={menuRowClass}
                        >
                          <SideIcon
                            icon={Icon}
                            className="opacity-85 transition-opacity group-hover:opacity-100"
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="my-1 border-t border-[var(--glass-border-soft)]" />

                  <div className="px-1 pb-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => onToggleTheme()}
                      className={menuRowClass}
                    >
                      <SideIcon
                        icon={theme === "dark" ? Sun : Moon}
                        className="opacity-85 transition-opacity group-hover:opacity-100"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {theme === "dark" ? "Light mode" : "Dark mode"}
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useChat();

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 280 }}
        transition={spring}
        className={cn(
          "relative z-30 hidden h-full shrink-0 md:block",
          // Allow flyouts to escape when rail is collapsed
          sidebarCollapsed ? "overflow-visible" : "overflow-hidden"
        )}
      >
        <SidebarPanel
          collapsed={sidebarCollapsed}
          modeLayoutId="mode-switch-pill-desktop"
        />
      </motion.aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-md md:hidden"
              onClick={() => setSidebarOpen(false)}
              data-mobile-drawer-backdrop
              aria-hidden
            />
            <motion.aside
              initial={{ x: "-100%", opacity: 0.96 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0.96 }}
              transition={spring}
              className={cn(
                "fixed inset-y-0 left-0 z-50 w-[min(100%,min(300px,100vw-2.5rem))] overflow-hidden",
                "border-r border-[var(--glass-border)] md:hidden",
                "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
              )}
              data-mobile-drawer
            >
              <SidebarPanel
                collapsed={false}
                onCloseMobile={() => setSidebarOpen(false)}
                modeLayoutId="mode-switch-pill-mobile"
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
