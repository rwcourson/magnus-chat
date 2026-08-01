import { approvalItems } from "@/lib/approvals-data";
import { calendarDays } from "@/lib/calendar-data";
import {
  integrations,
  routines,
  skills,
  workspaces,
} from "@/lib/catalog-data";
import { feedPosts } from "@/lib/feed-data";
import { peopleDirectory } from "@/lib/people-data";
import { initialChats } from "@/lib/mock-data";
import { initialConversations } from "@/lib/messaging-data";
import type { ChatThread } from "@/types/chat";
import type { Conversation } from "@/types/messaging";

export type SearchResultKind =
  | "chat"
  | "message"
  | "post"
  | "person"
  | "skill"
  | "integration"
  | "workspace"
  | "approval"
  | "event"
  | "page";

export type SearchResult = {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle?: string;
  href: string;
  keywords: string;
  /** Team conversation id when kind === "message" */
  conversationId?: string;
  /** Magnus AI chat id when kind === "chat" */
  chatId?: string;
};

const pages: SearchResult[] = [
  {
    id: "page-home",
    kind: "page",
    title: "Home",
    subtitle: "Intranet landing",
    href: "/",
    keywords: "home intranet news",
  },
  {
    id: "page-messages",
    kind: "page",
    title: "Magnus Chat",
    subtitle: "AI chat and history",
    href: "/",
    keywords: "messages chat magnus ai history skills routines automations",
  },
  {
    id: "page-feed",
    kind: "page",
    title: "B&G Live",
    subtitle: "Company-wide updates and conversation",
    href: "/feed",
    keywords: "feed news social posts company room bulletin chat updates bg live",
  },
  {
    id: "page-approvals",
    kind: "page",
    title: "Approvals",
    subtitle: "Invoices, expenses, reviews",
    href: "/approvals",
    keywords: "approvals onbase concur invoices expenses",
  },
  {
    id: "page-calendar",
    kind: "page",
    title: "Calendar",
    subtitle: "Agenda and prep",
    href: "/calendar",
    keywords: "calendar schedule meetings outlook agenda",
  },
];

export type BuildSearchIndexOpts = {
  chats?: ChatThread[];
  conversations?: Conversation[];
};

export function buildSearchIndex(
  chatsOrOpts: ChatThread[] | BuildSearchIndexOpts = initialChats
): SearchResult[] {
  const opts: BuildSearchIndexOpts = Array.isArray(chatsOrOpts)
    ? { chats: chatsOrOpts }
    : chatsOrOpts;
  const chats = opts.chats ?? initialChats;
  const conversations = opts.conversations ?? initialConversations;

  const chatResults: SearchResult[] = chats
    .filter((c) => !c.archived)
    .map((c) => ({
      id: `chat-${c.id}`,
      kind: "chat" as const,
      title: c.title,
      subtitle: c.preview ?? "Magnus chat",
      href: `/?chat=${c.id}`,
      chatId: c.id,
      keywords: `${c.title} ${c.preview ?? ""} ${c.messages
        .map((m) => m.content)
        .join(" ")}`,
    }));

  // Team channels / DMs are not primary surfaces — omit from search for now.
  void conversations;

  const postResults: SearchResult[] = feedPosts.map((p) => ({
    id: `post-${p.id}`,
    kind: "post" as const,
    title: p.headline ?? p.body.slice(0, 72),
    subtitle: `${p.author.name} · ${p.tags?.[0] ?? "Feed"}`,
    href: `/feed?post=${p.id}`,
    keywords: `${p.headline ?? ""} ${p.body} ${p.author.name} ${(p.tags ?? []).join(" ")}`,
  }));

  const people: SearchResult[] = peopleDirectory.map((p) => ({
    id: `person-${p.id}`,
    kind: "person" as const,
    title: p.name,
    subtitle: [p.role, p.office].filter(Boolean).join(" · "),
    href: `/people/${p.id}`,
    keywords: `${p.name} ${p.handle} ${p.role ?? ""} ${p.office ?? ""} ${(p.projects ?? []).join(" ")} ${p.bio}`,
  }));

  const skillResults: SearchResult[] = skills.map((s) => ({
    id: `skill-${s.id}`,
    kind: "skill" as const,
    title: s.name,
    subtitle: s.category,
    href: `/skills`,
    keywords: `${s.name} ${s.description} ${s.category}`,
  }));

  const intResults: SearchResult[] = integrations.map((i) => ({
    id: `int-${i.id}`,
    kind: "integration" as const,
    title: i.name,
    subtitle: i.status,
    href: `/integrations`,
    keywords: `${i.name} ${i.description} ${i.category}`,
  }));

  const wsResults: SearchResult[] = workspaces.map((w) => ({
    id: `ws-${w.id}`,
    kind: "workspace" as const,
    title: w.name,
    subtitle: w.description,
    href: `/workspaces/${w.id}`,
    keywords: `${w.name} ${w.description} ${w.projectCode ?? ""}`,
  }));

  const apResults: SearchResult[] = approvalItems.map((a) => ({
    id: `ap-${a.id}`,
    kind: "approval" as const,
    title: a.title,
    subtitle: `${a.source} · ${a.amount ?? a.kind}`,
    href: `/approvals?id=${a.id}`,
    keywords: `${a.title} ${a.subtitle} ${a.project ?? ""} ${a.source} ${a.requester}`,
  }));

  const events: SearchResult[] = calendarDays.flatMap((d) =>
    d.events.map((e) => ({
      id: `ev-${e.id}`,
      kind: "event" as const,
      title: e.title,
      subtitle: `${d.weekday} ${d.dateLabel} · ${e.start}`,
      href: `/calendar`,
      keywords: `${e.title} ${e.location ?? ""} ${e.project ?? ""} ${e.withWhom ?? ""}`,
    }))
  );

  void routines; // available for future expansion

  return [
    ...pages,
    ...chatResults,
    ...postResults,
    ...people,
    ...skillResults,
    ...intResults,
    ...wsResults,
    ...apResults,
    ...events,
  ];
}

export function searchIndex(
  query: string,
  items: SearchResult[] = buildSearchIndex()
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, 24);
  const tokens = q.split(/\s+/).filter(Boolean);
  return items
    .map((item) => {
      const title = item.title.toLowerCase();
      const sub = (item.subtitle ?? "").toLowerCase();
      const hay = `${title} ${sub} ${item.keywords}`.toLowerCase();
      let score = 0;
      if (title.startsWith(q)) score += 14;
      if (title.includes(q)) score += 10;
      if (sub.includes(q)) score += 4;
      if (hay.includes(q)) score += 2;
      for (const tok of tokens) {
        if (tok && hay.includes(tok)) score += 1;
        // Prefix token match helps “jame” → James
        if (tok.length >= 2) {
          const words = hay.split(/[^a-z0-9@#]+/);
          if (words.some((w) => w.startsWith(tok))) score += 3;
        }
      }
      return { item, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item)
    .slice(0, 40);
}

export const SEARCH_KIND_ORDER: SearchResultKind[] = [
  "page",
  "person",
  "message",
  "chat",
  "post",
  "approval",
  "event",
  "skill",
  "workspace",
  "integration",
];

export const SEARCH_KIND_LABEL: Record<SearchResultKind, string> = {
  page: "Pages",
  person: "People",
  message: "Messages",
  chat: "Magnus chats",
  post: "Feed",
  approval: "Approvals",
  event: "Calendar",
  skill: "Skills",
  workspace: "Workspaces",
  integration: "Integrations",
};
