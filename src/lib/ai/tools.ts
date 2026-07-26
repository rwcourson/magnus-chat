/**
 * AI SDK 7 tools that read the demo intranet knowledge corpus.
 * Used by /api/chat so the model can pull news, feed, people, etc. on demand.
 */
import { tool } from "ai";
import { z } from "zod";
import {
  getDemoPulse,
  searchKnowledge,
  type ChatSurface,
} from "@/lib/ai/knowledge";
import { newsStories } from "@/lib/home-data";
import { feedPosts } from "@/lib/feed-data";
import { approvalItems } from "@/lib/approvals-data";
import { calendarDays } from "@/lib/calendar-data";
import { peopleDirectory } from "@/lib/people-data";
import { listChannels, listDms } from "@/lib/messaging";

export function buildMagnusTools(opts?: {
  surface?: ChatSurface;
  conversationId?: string;
  conversationLabel?: string;
}) {
  const surface = opts?.surface;
  const conversationId = opts?.conversationId;
  const conversationLabel = opts?.conversationLabel;

  return {
    searchIntranet: tool({
      description:
        "Search B&G intranet demo data: news, feed posts, people, channels, approvals, calendar, skills, integrations. Use when the user asks about current events, projects, people, or status.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("Search query, e.g. 'downtown tower crane' or 'TRIR safety'"),
        limit: z.number().min(1).max(12).optional(),
      }),
      execute: async ({ query, limit }) => {
        const hits = searchKnowledge(query, {
          limit: limit ?? 6,
          surface,
          conversationId,
          conversationLabel,
        });
        return {
          query,
          count: hits.length,
          results: hits.map((h) => ({
            id: h.id,
            source: h.source,
            title: h.title,
            excerpt: h.body.slice(0, 320),
            href: h.href,
            when: h.when,
            project: h.project,
            score: h.score,
          })),
        };
      },
    }),

    getLatestNews: tool({
      description:
        "Get the latest company news carousel stories (homepage headlines).",
      inputSchema: z.object({}),
      execute: async () => ({
        stories: newsStories.map((n) => ({
          id: n.id,
          title: n.title,
          summary: n.summary,
          category: n.category,
          timeLabel: n.timeLabel,
          reason: n.reason,
          href: n.href,
        })),
      }),
    }),

    getFeedPosts: tool({
      description:
        "List recent team feed posts (social / company communications).",
      inputSchema: z.object({
        limit: z.number().min(1).max(10).optional(),
      }),
      execute: async ({ limit }) => {
        const n = limit ?? 5;
        return {
          posts: feedPosts.slice(0, n).map((p) => ({
            id: p.id,
            headline: p.headline,
            author: p.author.name,
            body: p.body.slice(0, 280),
            tags: p.tags,
            comments: p.comments,
            category: p.category,
          })),
        };
      },
    }),

    getApprovals: tool({
      description:
        "List pending approvals (OnBase invoices, Concur expenses, reviews).",
      inputSchema: z.object({}),
      execute: async () => ({
        items: approvalItems
          .filter((a) => a.status === "pending")
          .map((a) => ({
            id: a.id,
            title: a.title,
            amount: a.amount,
            project: a.project,
            source: a.source,
            due: a.dueLabel,
            requester: a.requester,
            detail: a.detail,
          })),
      }),
    }),

    getCalendar: tool({
      description:
        "Get this week’s calendar agenda with day labels and clock times. Use for schedule, availability, and “what’s on my calendar” questions. Always quote the returned day/time strings verbatim in the reply.",
      inputSchema: z.object({}),
      execute: async () => ({
        days: calendarDays.map((d) => ({
          label: `${d.weekday} ${d.dateLabel}`,
          isToday: Boolean(d.isToday),
          events: d.events.map((e) => ({
            title: e.title,
            /** Prefer this exact string in user-facing replies */
            timeLabel: `${d.weekday} ${d.dateLabel} · ${e.start}–${e.end}`,
            time: `${e.start}–${e.end}`,
            start: e.start,
            end: e.end,
            project: e.project,
            withWhom: e.withWhom,
            prep: e.prepHint,
            location: e.location,
          })),
        })),
      }),
    }),

    findPeople: tool({
      description: "Find colleagues in the people directory by name or role.",
      inputSchema: z.object({
        query: z.string().describe("Name, role, office, or project"),
      }),
      execute: async ({ query }) => {
        const q = query.toLowerCase();
        const matches = peopleDirectory.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.handle.toLowerCase().includes(q) ||
            (p.role ?? "").toLowerCase().includes(q) ||
            (p.office ?? "").toLowerCase().includes(q) ||
            (p.projects ?? []).some((pr) => pr.toLowerCase().includes(q))
        );
        return {
          people: matches.map((p) => ({
            id: p.id,
            name: p.name,
            handle: p.handle,
            role: p.role,
            office: p.office,
            bio: p.bio,
            projects: p.projects,
            href: `/people/${p.id}`,
          })),
        };
      },
    }),

    getChannelsSnapshot: tool({
      description:
        "Snapshot of team messaging channels and DMs (topics + unread).",
      inputSchema: z.object({}),
      execute: async () => ({
        channels: listChannels().map((c) => ({
          id: c.id,
          name: `#${c.name}`,
          topic: c.topic,
          unread: c.unreadCount,
          purpose: c.purpose,
        })),
        dms: listDms().map((c) => ({
          id: c.id,
          name: c.name,
          unread: c.unreadCount,
        })),
      }),
    }),

    getIntranetPulse: tool({
      description:
        "High-signal cross-surface pulse (news + scout + approvals + calendar) when the user wants a broad catch-up.",
      inputSchema: z.object({}),
      execute: async () => ({
        pulse: getDemoPulse(8).map((h) => ({
          source: h.source,
          title: h.title,
          excerpt: h.body.slice(0, 200),
          href: h.href,
        })),
      }),
    }),
  };
}
