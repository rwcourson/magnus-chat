/**
 * Durable activity inbox — multi-kind items with read state + deep links.
 * Pure helpers shared by NotificationsView and verify scripts.
 */

export type ActivityKind =
  | "feed"
  | "comment"
  | "like"
  | "mention"
  | "approval"
  | "routine"
  | "knowledge"
  | "news"
  | "system"
  | "workspace";

export type ActivityActor = {
  name: string;
  initials: string;
  avatarUrl?: string;
};

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
  actor?: ActivityActor;
};

/** Seed activity inbox — survives after view; not toast-only. */
export const activityItems: ActivityItem[] = [
  {
    id: "act-feed-1",
    kind: "comment",
    title: "Maya Chen replied to you",
    body: "Thanks Derek — attaching the morning huddle photo from Atlanta.",
    createdAt: "2026-07-23T18:12:00Z",
    read: false,
    actor: {
      name: "Maya Chen",
      initials: "MC",
      avatarUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&h=128&fit=crop&crop=faces",
    },
    href: "/feed",
  },
  {
    id: "act-feed-2",
    kind: "like",
    title: "James Courson liked your post",
    body: "Q3 safety milestone",
    createdAt: "2026-07-23T17:50:00Z",
    read: false,
    actor: {
      name: "James Courson",
      initials: "JC",
      avatarUrl:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=128&h=128&fit=crop&crop=faces",
    },
    href: "/feed",
  },
  {
    id: "act-mention-1",
    kind: "mention",
    title: "You were mentioned",
    body: "Priya Nair mentioned you in Submittal process FAQ",
    createdAt: "2026-07-23T15:20:00Z",
    read: true,
    actor: {
      name: "Priya Nair",
      initials: "PN",
      avatarUrl:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128&h=128&fit=crop&crop=faces",
    },
    href: "/feed",
  },
  {
    id: "act-approval-1",
    kind: "approval",
    title: "OnBase · 2 invoices need approval",
    body: "Steel package invoice and crane rental still waiting on your sign-off.",
    createdAt: "2026-07-23T12:00:00Z",
    read: false,
    href: "/approvals?source=onbase",
  },
  {
    id: "act-routine-1",
    kind: "routine",
    title: "Routine finished · Morning safety digest",
    body: "Weekday digest posted — 3 items need a glance before stand-up.",
    createdAt: "2026-07-23T07:05:00Z",
    read: false,
    href: "/routines",
  },
  {
    id: "act-knowledge-1",
    kind: "knowledge",
    title: "Knowledge updated · Crane laydown policy",
    body: "Enterprise EH&S published a revised laydown SOP in company knowledge.",
    createdAt: "2026-07-22T21:00:00Z",
    read: true,
    href: "/knowledge",
  },
  {
    id: "act-news-1",
    kind: "news",
    title: "Company news · Q3 TRIR milestone",
    body: "Official carousel story is live — share with crews if useful.",
    createdAt: "2026-07-23T09:30:00Z",
    read: true,
    href: "/",
  },
  {
    id: "act-workspace-1",
    kind: "workspace",
    title: "Downtown tower · new file",
    body: "Derek Walsh uploaded Crane logistics plan v4.pdf",
    createdAt: "2026-07-23T10:05:00Z",
    read: false,
    actor: {
      name: "Derek Walsh",
      initials: "DW",
      avatarUrl:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&crop=faces",
    },
    href: "/workspaces/ws-tower",
  },
  {
    id: "act-system-1",
    kind: "system",
    title: "Magnus catch-up ready",
    body: "Overnight brief has 4 items across Live, approvals, and calendar.",
    createdAt: "2026-07-23T06:30:00Z",
    read: true,
    href: "/",
  },
  {
    id: "act-feed-3",
    kind: "feed",
    title: "Lena Ortiz replied on Downtown tower — week 28",
    body: "Flagger plan draft is in the thread — review before Friday pick.",
    createdAt: "2026-07-23T16:40:00Z",
    read: false,
    actor: {
      name: "Lena Ortiz",
      initials: "LO",
    },
    href: "/feed?post=fp-2",
  },
];

export function unreadActivityCount(items: ActivityItem[]): number {
  return items.filter((i) => !i.read).length;
}

export function markActivityRead(
  items: ActivityItem[],
  id: string
): ActivityItem[] {
  return items.map((i) => (i.id === id ? { ...i, read: true } : i));
}

export function markAllActivityRead(items: ActivityItem[]): ActivityItem[] {
  return items.map((i) => ({ ...i, read: true }));
}

export function activityKindsPresent(items: ActivityItem[]): ActivityKind[] {
  return Array.from(new Set(items.map((i) => i.kind)));
}

/** Deep links that should still resolve when revisited. */
export function activityDeepLinks(items: ActivityItem[]): string[] {
  return items.map((i) => i.href).filter((h): h is string => Boolean(h));
}
