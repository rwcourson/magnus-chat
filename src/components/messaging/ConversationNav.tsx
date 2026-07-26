"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  GripVertical,
  Hash,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { useMessaging } from "@/context/MessagingContext";
import { useChat } from "@/context/ChatContext";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { RailIconButton } from "@/components/layout/RailItem";
import { ConversationIdentityMark } from "@/components/messaging/ConversationIdentityMark";
import { MagnusLogo } from "@/components/brand/MagnusLogo";
import { resolveConversationIdentity } from "@/lib/messaging";
import { peopleDirectory } from "@/lib/people-data";
import type { Conversation } from "@/types/messaging";
import type { ChatThread } from "@/types/chat";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";
import { easeOut, easeSpring } from "@/lib/motion";

/** Shared horizontal inset — search, section +, rows, create panels all line up */
const GUTTER = "px-2";
/** Leading drag-handle column (channels) */
const LEAD = "w-3.5 shrink-0";
/** Trailing column for section +, unread, and ··· menu */
const TRAIL = "w-5 shrink-0";

function ConversationRow({
  conv,
  active,
  onSelect,
  reorderable,
  onLeave,
  dragId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragOver,
}: {
  conv: Conversation;
  active: boolean;
  onSelect: () => void;
  /** Channel-only: grip + leave menu */
  reorderable?: boolean;
  onLeave?: () => void;
  dragId?: string;
  onDragStart?: (id: string) => void;
  onDragOver?: (id: string, e: DragEvent) => void;
  onDrop?: (id: string) => void;
  onDragEnd?: () => void;
  isDragOver?: boolean;
}) {
  const unread = conv.unreadCount > 0;
  const identity = resolveConversationIdentity(conv);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isChannel = conv.kind === "channel";

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  return (
    <div
      data-conversation={conv.id}
      data-conversation-kind={conv.kind}
      data-identity-kind={identity.kind}
      data-has-portrait={
        identity.kind === "dm" && identity.imageUrl ? "true" : undefined
      }
      data-has-channel-image={identity.hasChannelImage ? "true" : undefined}
      draggable={Boolean(reorderable)}
      onDragStart={(e) => {
        if (!reorderable || !dragId) return;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", dragId);
        onDragStart?.(dragId);
      }}
      onDragOver={(e) => {
        if (!reorderable || !dragId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver?.(dragId, e);
      }}
      onDrop={(e) => {
        if (!reorderable || !dragId) return;
        e.preventDefault();
        onDrop?.(dragId);
      }}
      onDragEnd={() => onDragEnd?.()}
      className={cn(
        "group relative flex w-full items-center gap-1 rounded-md py-[5px] text-[13.5px] transition-colors",
        GUTTER,
        active
          ? "bg-[var(--select-fill)] font-medium text-[var(--select-text)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
        isDragOver && "bg-[var(--hover-fill-strong)] ring-1 ring-[var(--glass-border)]",
        reorderable && "cursor-default"
      )}
    >
      {/* Drag handle — channels only, reveals on hover */}
      {reorderable ? (
        <span
          className={cn(
            LEAD,
            "flex items-center justify-center",
            "cursor-grab active:cursor-grabbing",
            "opacity-0 transition-opacity duration-150",
            "group-hover:opacity-100 group-focus-within:opacity-100",
            isDragOver && "opacity-100"
          )}
          aria-hidden
          data-channel-drag-handle
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GripVertical
            className="h-3.5 w-3.5 text-[var(--text-muted)]"
            strokeWidth={ICON_STROKE}
          />
        </span>
      ) : (
        <span className={LEAD} aria-hidden />
      )}

      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none"
      >
        <ConversationIdentityMark identity={identity} size={20} />
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            unread && !active && "font-semibold text-[var(--text-primary)]"
          )}
        >
          {isChannel ? conv.name : identity.label}
        </span>
      </button>

      {/* Trail: ··· on hover (channels) · unread when idle */}
      <span
        className={cn(TRAIL, "relative flex items-center justify-center")}
        ref={menuRef}
      >
        {isChannel && onLeave ? (
          <>
            {unread && (
              <span
                className={cn(
                  "flex h-4 min-w-4 items-center justify-center rounded-full",
                  "bg-[var(--text-primary)] px-1 text-[10px] font-semibold tabular-nums text-[var(--bg-canvas)]",
                  "group-hover:hidden group-focus-within:hidden",
                  menuOpen && "hidden"
                )}
                data-unread
                aria-label={`${conv.unreadCount} unread`}
              >
                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
              </span>
            )}
            <button
              type="button"
              aria-label={`More options for ${conv.name}`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              data-channel-more={conv.id}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
              className={cn(
                "h-5 w-5 items-center justify-center rounded-md",
                "text-[var(--text-muted)] transition-colors duration-150",
                "hover:bg-[var(--hover-fill-strong)] hover:text-[var(--text-primary)]",
                menuOpen
                  ? "flex bg-[var(--hover-fill-strong)] text-[var(--text-primary)]"
                  : "hidden group-hover:flex group-focus-within:flex"
              )}
            >
              <MoreHorizontal
                className="h-3.5 w-3.5"
                strokeWidth={ICON_STROKE}
              />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -3, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: easeOut }}
                  className={cn(
                    "absolute right-0 top-[calc(100%+4px)] z-30 min-w-[148px]",
                    "rounded-xl border border-[var(--glass-border-soft)]",
                    "bg-[var(--glass-strong-solid)] p-1 shadow-[var(--shadow-menu)]"
                  )}
                  data-channel-menu={conv.id}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onLeave();
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px]",
                      "text-[var(--text-secondary)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                    )}
                    data-leave-channel={conv.id}
                  >
                    <LogOut
                      className="h-3.5 w-3.5 shrink-0"
                      strokeWidth={ICON_STROKE}
                    />
                    Leave channel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : unread ? (
          <span
            className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--text-primary)] px-1 text-[10px] font-semibold tabular-nums text-[var(--bg-canvas)]"
            data-unread
            aria-label={`${conv.unreadCount} unread`}
          >
            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/** Minimal section label + optional + action (sentence case — no all caps) */
function SectionHead({
  label,
  onAdd,
  addLabel,
  className,
}: {
  label: string;
  onAdd?: () => void;
  addLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-1 flex items-center gap-1.5 pb-0.5 pt-0.5",
        GUTTER,
        className
      )}
    >
      <p className="min-w-0 flex-1 text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
        {label}
      </p>
      {onAdd ? (
        <span className={cn(TRAIL, "flex items-center justify-center")}>
          <button
            type="button"
            onClick={onAdd}
            aria-label={addLabel ?? `Add ${label}`}
            title={addLabel}
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-md",
              "text-[var(--text-muted)] transition-colors",
              "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
            )}
            data-section-add={label.toLowerCase()}
          >
            <Plus className="h-3 w-3" strokeWidth={ICON_STROKE} />
          </button>
        </span>
      ) : (
        <span className={TRAIL} aria-hidden />
      )}
    </div>
  );
}

/**
 * Slack-density conversation list for the Chat-mode app sidebar.
 * Search can live here or be lifted to the shell (hideSearch + controlled query).
 */
export function ConversationNav({
  onNavigate,
  compact,
  showChannels = true,
  showDms = true,
  /** When true, omit the local search field (parent owns it). */
  hideSearch = false,
  /** Controlled search string (used with hideSearch or alone). */
  searchQuery,
  onSearchQueryChange,
}: {
  onNavigate?: () => void;
  compact?: boolean;
  showChannels?: boolean;
  showDms?: boolean;
  hideSearch?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    channels,
    dms,
    activeId,
    selectConversation,
    createChannel,
    leaveChannelById,
    reorderChannelIds,
    openDm,
  } = useMessaging();
  const { setAppMode, selectChat, activeChatId, chats } = useChat();
  const [internalQuery, setInternalQuery] = useState("");
  const listQuery = searchQuery ?? internalQuery;
  const setListQuery = onSearchQueryChange ?? setInternalQuery;
  const [panel, setPanel] = useState<"channel" | "dm" | null>(null);
  const [channelName, setChannelName] = useState("");
  const [dmQuery, setDmQuery] = useState("");
  const [dmHighlight, setDmHighlight] = useState(0);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const channelInputRef = useRef<HTMLInputElement>(null);
  const dmInputRef = useRef<HTMLInputElement>(null);

  const q = listQuery.trim().toLowerCase();
  const searching = q.length > 0;
  const dmQ = dmQuery.trim().toLowerCase();

  const filterList = (list: Conversation[]) => {
    if (!q) return list;
    return list.filter((c) => {
      const id = resolveConversationIdentity(c);
      return (
        c.name.toLowerCase().includes(q) ||
        (c.topic ?? "").toLowerCase().includes(q) ||
        id.label.toLowerCase().includes(q) ||
        (id.subtitle ?? "").toLowerCase().includes(q)
      );
    });
  };

  const visibleChannels = useMemo(
    () => (showChannels ? filterList(channels) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channels, listQuery, showChannels]
  );
  const visibleDms = useMemo(
    () => (showDms ? filterList(dms) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dms, listQuery, showDms]
  );

  const magnusHits = useMemo(() => {
    if (!searching) return [] as ChatThread[];
    return chats
      .filter((c) => !c.archived)
      .filter((c) => {
        if (c.title.toLowerCase().includes(q)) return true;
        if (c.preview?.toLowerCase().includes(q)) return true;
        return c.messages.some((m) => m.content.toLowerCase().includes(q));
      })
      .slice(0, 8);
  }, [chats, q, searching]);

  const availablePeople = useMemo(() => {
    const taken = new Set(
      dms.flatMap((c) => c.memberIds.filter((id) => id !== "self"))
    );
    return peopleDirectory.filter((p) => !taken.has(p.id));
  }, [dms]);

  /** Global search: people not already in a 1:1 */
  const dmCandidates = useMemo(() => {
    if (!searching) return [];
    return availablePeople.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.handle.toLowerCase().includes(q) ||
        (p.role?.toLowerCase().includes(q) ?? false)
    );
  }, [availablePeople, q, searching]);

  /** Create-DM panel: type-to-match (empty query → no list) */
  const dmMatches = useMemo(() => {
    if (!dmQ) return [];
    return availablePeople
      .filter(
        (p) =>
          p.name.toLowerCase().includes(dmQ) ||
          p.handle.toLowerCase().includes(dmQ) ||
          (p.role?.toLowerCase().includes(dmQ) ?? false)
      )
      .slice(0, 8);
  }, [availablePeople, dmQ]);

  const closePanel = () => {
    setPanel(null);
    setChannelName("");
    setDmQuery("");
    setDmHighlight(0);
  };

  const openPanel = (next: "channel" | "dm") => {
    setPanel((p) => {
      if (p === next) {
        setChannelName("");
        setDmQuery("");
        setDmHighlight(0);
        return null;
      }
      setChannelName("");
      setDmQuery("");
      setDmHighlight(0);
      return next;
    });
  };

  const pick = (id: string) => {
    setAppMode("chat");
    selectConversation(id);
    if (!pathname.startsWith("/messages")) router.push("/messages");
    onNavigate?.();
    closePanel();
    setListQuery("");
  };

  const pickMagnus = (id: string) => {
    setAppMode("chat");
    selectChat(id);
    router.push(`/chat?chat=${encodeURIComponent(id)}`);
    onNavigate?.();
    closePanel();
    setListQuery("");
  };

  const startDm = (personId: string, name: string) => {
    const id = openDm(personId, name);
    pick(id);
  };

  const submitChannel = () => {
    const id = createChannel(channelName);
    if (!id) return;
    setChannelName("");
    pick(id);
  };

  /** HTML5 reorder — only when not filtering (full channel list) */
  const canReorderChannels = showChannels && !searching;

  const applyChannelReorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const ids = channels.map((c) => c.id);
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from < 0 || to < 0) return;
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    reorderChannelIds(next);
  };

  useEffect(() => {
    if (panel === "channel") {
      window.setTimeout(() => channelInputRef.current?.focus(), 50);
    } else if (panel === "dm") {
      window.setTimeout(() => dmInputRef.current?.focus(), 50);
    }
  }, [panel]);

  useEffect(() => {
    setDmHighlight(0);
  }, [dmQuery]);

  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if ((e.target as HTMLElement)?.closest?.("[data-section-add]")) return;
      closePanel();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [panel]);

  if (compact) {
    const compactList = [
      ...(showChannels ? channels.slice(0, 3) : []),
      ...(showDms ? dms.slice(0, 3) : []),
    ].slice(0, 6);
    return (
      <div
        className="flex w-full flex-col items-center gap-0.5"
        data-messaging-list
        data-channel-list={showChannels ? true : undefined}
      >
        {compactList.map((c) => {
          const active = c.id === activeId && pathname.startsWith("/messages");
          const unread = c.unreadCount > 0;
          const identity = resolveConversationIdentity(c);
          return (
            <RailIconButton
              key={c.id}
              label={identity.label}
              detail={
                unread
                  ? `${c.unreadCount} unread`
                  : identity.subtitle ??
                    (c.kind === "channel" ? "Channel" : "Direct message")
              }
              active={active}
              onClick={() => pick(c.id)}
              data-conversation={c.id}
            >
              <ConversationIdentityMark identity={identity} size={22} />
              {unread && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--text-primary)]" />
              )}
            </RailIconButton>
          );
        })}
      </div>
    );
  }

  const emptySearch =
    searching &&
    visibleChannels.length === 0 &&
    visibleDms.length === 0 &&
    magnusHits.length === 0;

  const createShellClass = cn(
    "rounded-xl border border-[var(--glass-border-soft)]",
    "bg-[var(--glass-strong-solid)] shadow-[var(--shadow-menu)]"
  );

  const channelCreate = (
    <motion.div
      key="create-channel"
      ref={panel === "channel" ? panelRef : undefined}
      initial={{ height: 0, opacity: 0, y: -4 }}
      animate={{ height: "auto", opacity: 1, y: 0 }}
      exit={{ height: 0, opacity: 0, y: -3 }}
      transition={{ duration: 0.26, ease: easeSpring }}
      className={cn("overflow-hidden", GUTTER, "pb-1.5")}
      data-create-panel="channel"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitChannel();
        }}
        className={cn(createShellClass, "flex items-center gap-2 px-2.5 py-2")}
      >
        <Hash
          className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]"
          strokeWidth={ICON_STROKE}
        />
        <input
          ref={channelInputRef}
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder="Name a new channel…"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-[13px] text-[var(--text-primary)]",
            "placeholder:text-[var(--text-muted)] outline-none"
          )}
          data-create-channel-input
        />
        <button
          type="submit"
          disabled={!channelName.trim()}
          className={cn(
            "shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-opacity",
            "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]",
            "disabled:opacity-40"
          )}
        >
          Create
        </button>
      </form>
    </motion.div>
  );

  const dmCreate = (
    <motion.div
      key="create-dm"
      ref={panel === "dm" ? panelRef : undefined}
      initial={{ height: 0, opacity: 0, y: -4 }}
      animate={{ height: "auto", opacity: 1, y: 0 }}
      exit={{ height: 0, opacity: 0, y: -3 }}
      transition={{ duration: 0.26, ease: easeSpring }}
      className={cn("overflow-hidden", GUTTER, "pb-1.5")}
      data-create-panel="dm"
    >
      <div className={cn(createShellClass, "p-1.5")}>
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1.5",
            "bg-[var(--hover-fill)]"
          )}
        >
          <Search
            className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]"
            strokeWidth={ICON_STROKE}
          />
          <input
            ref={dmInputRef}
            value={dmQuery}
            onChange={(e) => setDmQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                if (dmMatches.length === 0) return;
                setDmHighlight((i) => (i + 1) % dmMatches.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (dmMatches.length === 0) return;
                setDmHighlight(
                  (i) => (i - 1 + dmMatches.length) % dmMatches.length
                );
              } else if (e.key === "Enter") {
                e.preventDefault();
                const hit = dmMatches[dmHighlight] ?? dmMatches[0];
                if (hit) startDm(hit.id, hit.name);
              }
            }}
            placeholder="Type a name or @handle…"
            className={cn(
              "min-w-0 flex-1 bg-transparent text-[13px] text-[var(--text-primary)]",
              "placeholder:text-[var(--text-muted)] outline-none"
            )}
            data-create-dm-input
            aria-label="Find someone to message"
            aria-autocomplete="list"
            aria-controls="dm-create-results"
          />
        </div>

        <AnimatePresence initial={false} mode="popLayout">
          {!dmQ ? (
            <motion.p
              key="dm-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: easeOut }}
              className="px-2 py-2.5 text-[11.5px] leading-snug text-[var(--text-muted)]"
            >
              Start typing to find people
            </motion.p>
          ) : dmMatches.length === 0 ? (
            <motion.p
              key="dm-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: easeOut }}
              className="px-2 py-2.5 text-[11.5px] text-[var(--text-muted)]"
            >
              No one matches “{dmQuery.trim()}”
            </motion.p>
          ) : (
            <motion.ul
              key="dm-results"
              id="dm-create-results"
              role="listbox"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: easeSpring }}
              className="mt-1 max-h-[200px] space-y-px overflow-y-auto scroll-thin"
            >
              {dmMatches.map((p, i) => {
                const active = i === dmHighlight;
                return (
                  <li key={p.id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => startDm(p.id, p.name)}
                      onMouseEnter={() => setDmHighlight(i)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors",
                        active
                          ? "bg-[var(--hover-fill-strong)]"
                          : "hover:bg-[var(--hover-fill)]"
                      )}
                      data-create-dm-person={p.id}
                    >
                      <span className="flex h-7 w-7 shrink-0 overflow-hidden rounded-md bg-[var(--hover-fill-strong)]">
                        {p.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-[var(--text-muted)]">
                            {p.initials}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-[var(--text-primary)]">
                          {p.name}
                        </span>
                        <span className="block truncate text-[11px] text-[var(--text-muted)]">
                          @{p.handle}
                          {p.role ? ` · ${p.role}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" data-messaging-list>
      {!hideSearch && (
        <div className="w-full pb-2" data-sidebar-top-search>
          <label className="relative block w-full">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              strokeWidth={ICON_STROKE}
            />
            <input
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
              placeholder="Search"
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
              aria-label="Search channels, messages, and Magnus chats"
            />
          </label>
        </div>
      )}

      <ScrollFade
        className="min-h-0 flex-1"
        size="md"
        contentClassName="scroll-thin space-y-0.5 pb-2"
      >
        {emptySearch && (
          <p className={cn(GUTTER, "py-6 text-center text-[12px] text-[var(--text-muted)]")}>
            No matches
          </p>
        )}

        {showChannels && (visibleChannels.length > 0 || !searching) && (
          <section className="pb-1" data-section="channels">
            <SectionHead
              label="Channels"
              className="pt-0.5"
              onAdd={() => openPanel("channel")}
              addLabel="Create channel"
            />
            <AnimatePresence initial={false}>
              {panel === "channel" && channelCreate}
            </AnimatePresence>
            <div className="space-y-px" data-channel-list>
              {visibleChannels.map((c) => (
                <ConversationRow
                  key={c.id}
                  conv={c}
                  active={c.id === activeId && pathname.startsWith("/messages")}
                  onSelect={() => pick(c.id)}
                  reorderable={canReorderChannels}
                  dragId={c.id}
                  isDragOver={overId === c.id && dragId !== c.id}
                  onDragStart={(id) => {
                    setDragId(id);
                    setOverId(id);
                  }}
                  onDragOver={(id) => {
                    if (dragId && id !== dragId) setOverId(id);
                  }}
                  onDrop={(id) => {
                    if (dragId) applyChannelReorder(dragId, id);
                    setDragId(null);
                    setOverId(null);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  onLeave={() => leaveChannelById(c.id)}
                />
              ))}
              {!searching && visibleChannels.length === 0 && (
                <p
                  className={cn(
                    GUTTER,
                    "py-2 text-[12px] text-[var(--text-muted)]"
                  )}
                >
                  No channels
                </p>
              )}
            </div>
          </section>
        )}

        {showDms && (visibleDms.length > 0 || !searching) && (
          <section
            className={cn(showChannels && "mt-4 border-t border-[var(--glass-border-soft)]/60 pt-4")}
            data-section="dms"
          >
            <SectionHead
              label="Direct messages"
              onAdd={() => openPanel("dm")}
              addLabel="New message"
            />
            <AnimatePresence initial={false}>
              {panel === "dm" && dmCreate}
            </AnimatePresence>
            <div className="space-y-px" data-dm-list>
              {visibleDms.map((c) => (
                <ConversationRow
                  key={c.id}
                  conv={c}
                  active={c.id === activeId && pathname.startsWith("/messages")}
                  onSelect={() => pick(c.id)}
                />
              ))}
              {!searching && visibleDms.length === 0 && (
                <p
                  className={cn(
                    GUTTER,
                    "py-2 text-[12px] text-[var(--text-muted)]"
                  )}
                >
                  No messages
                </p>
              )}
            </div>
          </section>
        )}

        {/* Unified search: also surface Magnus AI threads */}
        {searching && magnusHits.length > 0 && (
          <>
            <SectionHead label="Magnus" className="mt-4" />
            <div className="space-y-px" data-magnus-search-list>
              {magnusHits.map((chat) => {
                const active =
                  chat.id === activeChatId && pathname.startsWith("/chat");
                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => pickMagnus(chat.id)}
                    className={cn(
                      "group flex w-full items-center gap-2 rounded-md py-[5px] text-left text-[13.5px] transition-colors",
                      GUTTER,
                      active
                        ? "bg-[var(--select-fill)] font-medium text-[var(--select-text)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                    )}
                    data-magnus-search-hit={chat.id}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--hover-fill-strong)]">
                      <MagnusLogo size={14} tone="sidebar" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{chat.title}</span>
                    <span className={cn(TRAIL, "flex items-center justify-center")}>
                      <MessageSquare
                        className="h-3 w-3 shrink-0 opacity-40"
                        strokeWidth={ICON_STROKE}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* When searching for a person not yet in DMs, offer start DM */}
        {searching && dmCandidates.length > 0 && visibleDms.length === 0 && (
          <>
            <SectionHead label="People" className="mt-4" />
            <div className="space-y-px">
              {dmCandidates.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => startDm(p.id, p.name)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md py-[5px] text-left text-[13.5px]",
                    GUTTER,
                    "text-[var(--text-secondary)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <span className="flex h-5 w-5 shrink-0 overflow-hidden rounded-md bg-[var(--hover-fill-strong)]">
                    {p.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[8px] font-semibold">
                        {p.initials}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span
                    className={cn(
                      TRAIL,
                      "flex items-center justify-center text-[10px] text-[var(--text-muted)]"
                    )}
                  >
                    {/* keep trail width; label sits in flex-1 via optional hide */}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </ScrollFade>
    </div>
  );
}
