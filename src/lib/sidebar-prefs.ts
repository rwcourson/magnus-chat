/**
 * User-customizable sidebar prefs for Home vs Chat modes.
 * Pure helpers — unit-testable without React.
 */

export type HomeNavId =
  | "home"
  | "feed"
  | "people"
  | "notifications"
  | "workspaces";

/** Chat-mode sections (Magnus-centric; team channels/DMs removed for now). */
export type ChatSidebarId =
  | "magnusChat"
  | "history"
  | "skills"
  | "routines"
  | "integrations"
  | "workspaces";

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
  { id: "feed", label: "B&G Live", description: "Company-wide live chat" },
  { id: "people", label: "People", description: "Directory" },
  {
    id: "workspaces",
    label: "Workspaces",
    description: "Knowledge hubs",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Activity inbox",
  },
];

export const CHAT_SIDEBAR_CATALOG: {
  id: ChatSidebarId;
  label: string;
  description: string;
  href?: string;
}[] = [
  {
    id: "magnusChat",
    label: "Magnus Chat",
    description: "New AI chat control (footer)",
  },
  {
    id: "skills",
    label: "Skills",
    description: "Agent skills & prompts",
    href: "/skills",
  },
  {
    id: "routines",
    label: "Routines",
    description: "Scheduled Magnus runs",
    href: "/routines",
  },
  {
    id: "workspaces",
    label: "Workspaces",
    description: "Knowledge hubs",
    href: "/workspaces",
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Connectors & apps",
    href: "/integrations",
  },
  {
    id: "history",
    label: "Chat history",
    description: "Recent Magnus threads",
  },
];

export const DEFAULT_SIDEBAR_PREFS: SidebarPrefs = {
  homeOrder: ["home", "feed", "people", "workspaces", "notifications"],
  homeVisible: {
    home: true,
    feed: true,
    people: true,
    workspaces: true,
    notifications: true,
  },
  // Tools first, history last; integrations off by default (setup-ish)
  chatOrder: [
    "magnusChat",
    "skills",
    "routines",
    "workspaces",
    "integrations",
    "history",
  ],
  chatVisible: {
    magnusChat: true,
    skills: true,
    routines: true,
    workspaces: true,
    integrations: false,
    history: true,
  },
};

/** v3: Home = company nav; Chat = Magnus tools + history. */
export const SIDEBAR_PREFS_KEY = "magnus-sidebar-prefs-v3";

/** Map legacy home ids from older pref versions. */
function mapLegacyHomeId(id: string): HomeNavId | null {
  if (id === "knowledge" || id === "messages" || id === "approvals") {
    // knowledge → workspaces; messages/approvals dropped from home nav
    return id === "knowledge" ? "workspaces" : null;
  }
  const known = new Set(HOME_NAV_CATALOG.map((i) => i.id));
  return known.has(id as HomeNavId) ? (id as HomeNavId) : null;
}

/** Merge stored partial prefs with defaults (safe hydrate). */
export function normalizeSidebarPrefs(
  raw: Partial<SidebarPrefs> | null | undefined
): SidebarPrefs {
  const base = structuredClone(DEFAULT_SIDEBAR_PREFS);
  if (!raw || typeof raw !== "object") return base;

  if (Array.isArray(raw.homeOrder)) {
    const order: HomeNavId[] = [];
    for (const id of raw.homeOrder) {
      const mapped = mapLegacyHomeId(String(id));
      if (mapped && !order.includes(mapped)) order.push(mapped);
    }
    for (const id of base.homeOrder) {
      if (!order.includes(id)) order.push(id);
    }
    base.homeOrder = order;
  }

  if (raw.homeVisible && typeof raw.homeVisible === "object") {
    const vis = raw.homeVisible as Record<string, boolean | undefined>;
    // Legacy knowledge visibility → workspaces
    if (typeof vis.knowledge === "boolean" && vis.workspaces === undefined) {
      base.homeVisible.workspaces = vis.knowledge;
    }
    for (const id of base.homeOrder) {
      if (typeof vis[id] === "boolean") {
        base.homeVisible[id] = vis[id]!;
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

/** Catalog tool rows for Chat mode (excludes magnusChat footer + history list). */
export function visibleChatToolLinks(
  prefs: SidebarPrefs
): { id: ChatSidebarId; label: string; href: string }[] {
  return prefs.chatOrder
    .filter(
      (id) =>
        id !== "magnusChat" &&
        id !== "history" &&
        isChatSectionVisible(prefs, id)
    )
    .map((id) => {
      const meta = CHAT_SIDEBAR_CATALOG.find((c) => c.id === id)!;
      return {
        id,
        label: meta.label,
        href: meta.href ?? `/${id}`,
      };
    });
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
