/**
 * User-customizable sidebar prefs for Home vs Chat modes.
 * Pure helpers — unit-testable without React.
 */

export type HomeNavId =
  | "home"
  | "messages"
  | "feed"
  | "people"
  | "notifications"
  | "comms" // legacy id — label Insights
  | "knowledge";

export type ChatSidebarId = "magnusChat" | "channels" | "dms";

export type SidebarPrefs = {
  homeOrder: HomeNavId[];
  homeVisible: Record<HomeNavId, boolean>;
  chatOrder: ChatSidebarId[];
  chatVisible: Record<ChatSidebarId, boolean>;
};

export const HOME_NAV_CATALOG: {
  id: HomeNavId;
  label: string;
  description: string;
  /** Always shown; toggle disabled */
  locked?: boolean;
}[] = [
  {
    id: "home",
    label: "Home",
    description: "Intranet landing",
    locked: true,
  },
  {
    id: "messages",
    label: "Messages",
    description: "Team channels & DMs",
  },
  { id: "feed", label: "Feed", description: "Company news" },
  { id: "people", label: "People", description: "Directory" },
  {
    id: "notifications",
    label: "Notifications",
    description: "Activity inbox",
  },
  {
    id: "comms",
    label: "Insights",
    description: "Leadership pulse & story desk",
  },
  {
    id: "knowledge",
    label: "Knowledge",
    description: "Workspaces hub",
  },
];

export const CHAT_SIDEBAR_CATALOG: {
  id: ChatSidebarId;
  label: string;
  description: string;
}[] = [
  {
    id: "magnusChat",
    label: "Magnus Chat",
    description: "New AI chat + history control",
  },
  {
    id: "channels",
    label: "Channels",
    description: "Team channel list",
  },
  {
    id: "dms",
    label: "Direct messages",
    description: "1:1 conversations",
  },
];

export const DEFAULT_SIDEBAR_PREFS: SidebarPrefs = {
  homeOrder: HOME_NAV_CATALOG.map((i) => i.id),
  homeVisible: Object.fromEntries(
    HOME_NAV_CATALOG.map((i) => [i.id, true])
  ) as Record<HomeNavId, boolean>,
  chatOrder: CHAT_SIDEBAR_CATALOG.map((i) => i.id),
  chatVisible: Object.fromEntries(
    CHAT_SIDEBAR_CATALOG.map((i) => [i.id, true])
  ) as Record<ChatSidebarId, boolean>,
};

export const SIDEBAR_PREFS_KEY = "magnus-sidebar-prefs-v1";

/** Merge stored partial prefs with defaults (safe hydrate). */
export function normalizeSidebarPrefs(
  raw: Partial<SidebarPrefs> | null | undefined
): SidebarPrefs {
  const base = structuredClone(DEFAULT_SIDEBAR_PREFS);
  if (!raw || typeof raw !== "object") return base;

  if (Array.isArray(raw.homeOrder)) {
    const known = new Set(HOME_NAV_CATALOG.map((i) => i.id));
    const order = raw.homeOrder.filter((id): id is HomeNavId =>
      known.has(id as HomeNavId)
    );
    for (const id of base.homeOrder) {
      if (!order.includes(id)) order.push(id);
    }
    base.homeOrder = order;
  }

  if (raw.homeVisible && typeof raw.homeVisible === "object") {
    for (const id of base.homeOrder) {
      if (typeof raw.homeVisible[id] === "boolean") {
        base.homeVisible[id] = raw.homeVisible[id]!;
      }
    }
  }
  // Home is always visible
  base.homeVisible.home = true;

  if (Array.isArray(raw.chatOrder)) {
    const known = new Set(CHAT_SIDEBAR_CATALOG.map((i) => i.id));
    const order = raw.chatOrder.filter((id): id is ChatSidebarId =>
      known.has(id as ChatSidebarId)
    );
    for (const id of base.chatOrder) {
      if (!order.includes(id)) order.push(id);
    }
    base.chatOrder = order;
  }

  if (raw.chatVisible && typeof raw.chatVisible === "object") {
    for (const id of base.chatOrder) {
      if (typeof raw.chatVisible[id] === "boolean") {
        base.chatVisible[id] = raw.chatVisible[id]!;
      }
    }
  }

  return base;
}

/** Ordered visible home nav ids (home always included). */
export function visibleHomeNav(prefs: SidebarPrefs): HomeNavId[] {
  // Notifications are header-only — never show in the sidebar list
  return prefs.homeOrder.filter(
    (id) =>
      id !== "notifications" && (id === "home" || prefs.homeVisible[id])
  );
}

export function isChatSectionVisible(
  prefs: SidebarPrefs,
  id: ChatSidebarId
): boolean {
  return prefs.chatVisible[id] !== false;
}

/** Move item in order array by delta (-1 up, +1 down). */
export function moveInOrder<T extends string>(
  order: T[],
  id: T,
  delta: -1 | 1
): T[] {
  const i = order.indexOf(id);
  if (i < 0) return order;
  const j = i + delta;
  if (j < 0 || j >= order.length) return order;
  const next = [...order];
  const tmp = next[i]!;
  next[i] = next[j]!;
  next[j] = tmp;
  return next;
}
