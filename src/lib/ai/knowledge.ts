/**
 * Demo intranet knowledge layer for Magnus.
 *
 * Indexes news, feed, scout, people, channels, approvals, calendar, and catalog
 * so every chat surface can retrieve the same grounded facts for the walkthrough.
 *
 * Pure functions — safe for tests and server + client mock replies.
 */

import { approvalItems } from "@/lib/approvals-data";
import { calendarDays } from "@/lib/calendar-data";
import {
  integrations,
  routines,
  skills,
  workspaces,
} from "@/lib/catalog-data";
import { cleanReplyText } from "@/lib/ai/clean-reply";
import { feedPosts } from "@/lib/feed-data";
import { actionTiles, newsStories } from "@/lib/home-data";
import { initialConversations } from "@/lib/messaging-data";
import { peopleDirectory } from "@/lib/people-data";
import { scoutSignals } from "@/lib/scout-data";

export type KnowledgeSource =
  | "news"
  | "feed"
  | "scout"
  | "person"
  | "channel"
  | "dm"
  | "approval"
  | "calendar"
  | "skill"
  | "routine"
  | "integration"
  | "workspace"
  | "action";

export type KnowledgeDoc = {
  id: string;
  source: KnowledgeSource;
  title: string;
  body: string;
  /** Free-text for ranking */
  keywords: string;
  href?: string;
  when?: string;
  project?: string;
};

export type KnowledgeHit = KnowledgeDoc & {
  score: number;
};

export type ChatSurface = "main" | "popup" | "channel" | "dm";

export type RetrievalOptions = {
  limit?: number;
  surface?: ChatSurface;
  /** Active channel/DM label for boosts */
  conversationLabel?: string;
  conversationId?: string;
};

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "is",
  "are",
  "was",
  "were",
  "be",
  "with",
  "at",
  "by",
  "from",
  "as",
  "it",
  "this",
  "that",
  "you",
  "your",
  "we",
  "our",
  "me",
  "my",
  "can",
  "could",
  "would",
  "should",
  "what",
  "when",
  "where",
  "who",
  "how",
  "why",
  "about",
  "any",
  "do",
  "does",
  "did",
  "get",
  "got",
  "have",
  "has",
  "had",
  "please",
  "tell",
  "show",
  "give",
  "need",
  "want",
  "know",
  "latest",
  "magnus",
  "hey",
  "hi",
  "hello",
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9@#.\-\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/** Build full demo corpus once (module cache). */
let cachedCorpus: KnowledgeDoc[] | null = null;

export function buildKnowledgeCorpus(): KnowledgeDoc[] {
  if (cachedCorpus) return cachedCorpus;

  const docs: KnowledgeDoc[] = [];

  for (const n of newsStories) {
    docs.push({
      id: `news:${n.id}`,
      source: "news",
      title: n.title,
      body: n.summary,
      keywords: `${n.category} ${n.reason ?? ""} news carousel homepage`,
      href: n.href,
      when: n.timeLabel,
    });
  }

  for (const p of feedPosts) {
    const commentBits = (p.commentList ?? [])
      .slice(0, 4)
      .map((c) => `${c.author.name}: ${c.body}`)
      .join(" | ");
    docs.push({
      id: `feed:${p.id}`,
      source: "feed",
      title: p.headline?.trim() || p.body.slice(0, 72) || `Post ${p.id}`,
      body: `${p.body}${commentBits ? `\nComments: ${commentBits}` : ""}`,
      keywords: `${p.category} ${(p.tags ?? []).join(" ")} ${p.author.name} ${p.author.handle} feed post social`,
      href: "/feed",
      when: p.createdAt,
      project: p.tags?.find((t) => /tower|project|atl/i.test(t)),
    });
  }

  for (const s of scoutSignals) {
    docs.push({
      id: `scout:${s.id}`,
      source: "scout",
      title: s.title,
      body: `${s.summary} Why now: ${s.whyNow} Who cares: ${s.whoCares}`,
      keywords: `${s.signalClass} ${s.category} ${s.forYou ?? ""} scout brief catch-up`,
      href: s.sources[0]?.href ?? "/insights",
      when: s.timeLabel,
      project: s.forYou,
    });
  }

  for (const person of peopleDirectory) {
    docs.push({
      id: `person:${person.id}`,
      source: "person",
      title: person.name,
      body: `${person.role ?? ""} · ${person.office ?? ""} · @${person.handle}. ${person.bio}${
        person.projects?.length ? ` Projects: ${person.projects.join(", ")}` : ""
      }${person.division ? ` Division: ${person.division}` : ""}`,
      keywords: `${person.handle} ${person.role ?? ""} ${person.office ?? ""} ${person.division ?? ""} ${(person.projects ?? []).join(" ")} people directory`,
      href: `/people/${person.id}`,
    });
  }

  for (const conv of initialConversations) {
    const recent = conv.messages
      .slice(-6)
      .map((m) => `${m.author.name}: ${m.body}`)
      .join("\n");
    const isDm = conv.kind === "dm";
    docs.push({
      id: `conv:${conv.id}`,
      source: isDm ? "dm" : "channel",
      title: isDm ? `DM · ${conv.name}` : `#${conv.name}`,
      body: `${conv.topic ?? ""}\nRecent messages:\n${recent}`,
      keywords: `${conv.slug ?? ""} ${conv.purpose ?? ""} ${conv.name} ${conv.memberIds.join(" ")} messaging team chat`,
      href: "/messages",
      when: conv.updatedAt,
      project:
        conv.slug === "downtown-tower"
          ? "Downtown tower"
          : conv.purpose === "project"
            ? conv.name
            : undefined,
    });
  }

  for (const a of approvalItems) {
    docs.push({
      id: `approval:${a.id}`,
      source: "approval",
      title: a.title,
      body: `${a.subtitle ?? ""} ${a.amount ?? ""} · ${a.project ?? ""} · ${a.requester ?? ""} · ${a.status} via ${a.source}. ${a.detail ?? ""}`,
      keywords: `${a.kind} ${a.source} ${a.sourceKey} ${a.project ?? ""} onbase concur invoice expense approval`,
      href: `/approvals?source=${a.sourceKey}`,
      when: a.dueLabel,
      project: a.project,
    });
  }

  for (const day of calendarDays) {
    for (const ev of day.events) {
      docs.push({
        id: `cal:${ev.id}`,
        source: "calendar",
        title: ev.title,
        body: `${day.weekday} ${day.dateLabel} ${ev.start}–${ev.end}${ev.location ? ` @ ${ev.location}` : ""}${ev.withWhom ? ` with ${ev.withWhom}` : ""}. ${ev.prepHint ?? ""}`,
        keywords: `${ev.kind} ${ev.project ?? ""} ${ev.withWhom ?? ""} calendar schedule meeting agenda outlook`,
        href: "/calendar",
        when: `${day.dateLabel} ${ev.start}`,
        project: ev.project,
      });
    }
  }

  for (const sk of skills) {
    docs.push({
      id: `skill:${sk.id}`,
      source: "skill",
      title: sk.name,
      body: sk.description,
      keywords: `${sk.category ?? ""} agent skill prompt pack`,
      href: "/skills",
    });
  }

  for (const r of routines) {
    docs.push({
      id: `routine:${r.id}`,
      source: "routine",
      title: r.name,
      body: `${r.description} Schedule: ${r.schedule}. Last run: ${r.lastRun}`,
      keywords: "routine scheduled digest automation",
      href: "/routines",
      when: r.lastRun,
    });
  }

  for (const i of integrations) {
    docs.push({
      id: `integration:${i.id}`,
      source: "integration",
      title: i.name,
      body: `${i.description} Status: ${i.status}`,
      keywords: `${i.category ?? ""} connector integration app ${i.status}`,
      href: "/integrations",
    });
  }

  for (const w of workspaces) {
    docs.push({
      id: `workspace:${w.id}`,
      source: "workspace",
      title: w.name,
      body: w.description,
      keywords: "workspace knowledge hub project space",
      href: "/workspaces",
    });
  }

  for (const t of actionTiles) {
    docs.push({
      id: `action:${t.id}`,
      source: "action",
      title: t.label,
      body: `${t.detail}${t.badge != null ? ` · ${t.badge} pending` : ""}`,
      keywords: "home action tile badge inbox",
      href: t.href,
    });
  }

  cachedCorpus = docs;
  return docs;
}

/** Reset corpus cache (tests). */
export function resetKnowledgeCorpus(): void {
  cachedCorpus = null;
}

/**
 * Rank corpus docs against a free-text query.
 */
export function searchKnowledge(
  query: string,
  opts: RetrievalOptions = {}
): KnowledgeHit[] {
  const q = query.trim();
  const terms = tokens(q);
  const corpus = buildKnowledgeCorpus();
  const limit = opts.limit ?? 8;

  // Intent boosts for demo phrasing
  const wantsNews = /\b(news|headline|carousel|happening|trir|safety milestone)\b/i.test(
    q
  );
  const wantsFeed = /\b(feed|post|social|comment)\b/i.test(q);
  const wantsPeople = /\b(who is|find|person|people|directory|@)\b/i.test(q);
  const wantsApprovals = /\b(approv|invoice|expense|onbase|concur)\b/i.test(q);
  const wantsCal =
    /\b(calendar|schedule|meeting|agenda|today|tomorrow|availability|available|free|when is)\b/i.test(
      q
    );
  const wantsProject = /\b(downtown|tower|atl-?2841|project|crane|pour|envelope)\b/i.test(
    q
  );
  const wantsCatchUp = /\bcatch me up|brief|what did i miss|standup\b/i.test(q);

  const scored: KnowledgeHit[] = corpus.map((doc) => {
    const title = (doc.title ?? "").toLowerCase();
    const hay = `${doc.title ?? ""} ${doc.body ?? ""} ${doc.keywords ?? ""}`.toLowerCase();
    let score = 0;

    for (const t of terms) {
      if (title.includes(t)) score += 6;
      if (hay.includes(t)) score += 2;
      // multi-word soft match
      if (t.length > 4 && hay.includes(t.slice(0, -1))) score += 1;
    }

    // Phrase boost
    if (q.length > 8 && hay.includes(q.toLowerCase().slice(0, 40))) score += 8;

    if (wantsNews && doc.source === "news") score += 10;
    if (wantsNews && doc.source === "scout") score += 6;
    if (wantsFeed && doc.source === "feed") score += 10;
    if (wantsPeople && doc.source === "person") score += 10;
    if (wantsApprovals && doc.source === "approval") score += 12;
    if (wantsApprovals && doc.source === "action") score += 4;
    if (wantsCal && doc.source === "calendar") score += 12;
    if (wantsProject) {
      if (/downtown|tower|atl|crane|envelope|pour/i.test(hay)) score += 8;
      if (doc.source === "channel" && /downtown/i.test(doc.title)) score += 6;
    }
    if (wantsCatchUp) {
      if (doc.source === "scout" || doc.source === "news" || doc.source === "calendar")
        score += 7;
      if (doc.source === "approval") score += 4;
    }

    if (opts.conversationLabel) {
      const label = opts.conversationLabel.toLowerCase();
      if (title.includes(label.replace(/^#/, ""))) score += 5;
    }
    if (opts.conversationId && doc.id === `conv:${opts.conversationId}`) {
      score += 12;
    }

    // Surface-aware: popup on feed → boost social/news
    if (opts.surface === "popup") {
      if (doc.source === "feed" || doc.source === "news") score += 3;
    }
    if (opts.surface === "channel" || opts.surface === "dm") {
      if (doc.source === "channel" || doc.source === "dm") score += 2;
    }

    return { ...doc, score };
  });

  return scored
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Always-on “pulse” pack for demos when the query is vague.
 */
export function getDemoPulse(limit = 6): KnowledgeHit[] {
  const corpus = buildKnowledgeCorpus();
  const preferred: KnowledgeSource[] = [
    "news",
    "scout",
    "approval",
    "calendar",
    "feed",
    "channel",
  ];
  const hits: KnowledgeHit[] = [];
  for (const src of preferred) {
    const doc = corpus.find(
      (d) => d.source === src && !hits.some((h) => h.id === d.id)
    );
    if (doc) hits.push({ ...doc, score: 1 });
    if (hits.length >= limit) break;
  }
  return hits;
}

/** Format hits for system prompt injection. */
export function formatContextPack(
  hits: KnowledgeHit[],
  opts?: { query?: string; surface?: ChatSurface; conversationLabel?: string }
): string {
  if (hits.length === 0) {
    return "No specific intranet records matched this turn. Say so if asked for facts not in general B&G knowledge.";
  }

  const header = [
    "=== MAGNUS INTRANET CONTEXT (demo data — treat as current) ===",
    opts?.query ? `User ask: ${opts.query}` : null,
    opts?.surface ? `Surface: ${opts.surface}` : null,
    opts?.conversationLabel
      ? `Active conversation: ${opts.conversationLabel}`
      : null,
    "Use these records when answering. Cite source titles casually (e.g. “From the Q3 safety news…”).",
    "Do not invent numbers, names, or project facts outside this pack + the conversation.",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  const blocks = hits.map((h, i) => {
    const meta = [
      h.source,
      h.when,
      h.project,
      h.href,
    ]
      .filter(Boolean)
      .join(" · ");
    return `[${i + 1}] (${meta})\nTitle: ${h.title}\n${h.body}`;
  });

  return `${header}\n${blocks.join("\n\n")}\n=== END CONTEXT ===`;
}

/**
 * Retrieve context for a user message (query + optional pulse fill).
 */
export function retrieveContextForQuery(
  query: string,
  opts: RetrievalOptions = {}
): { hits: KnowledgeHit[]; pack: string } {
  const limit = opts.limit ?? 8;
  let hits = searchKnowledge(query, { ...opts, limit });

  // Vague prompts still get a useful demo pulse
  if (hits.length < 3) {
    const pulse = getDemoPulse(limit);
    const seen = new Set(hits.map((h) => h.id));
    for (const p of pulse) {
      if (!seen.has(p.id)) hits.push(p);
      if (hits.length >= limit) break;
    }
  }

  hits = hits.slice(0, limit);
  return {
    hits,
    pack: formatContextPack(hits, {
      query,
      surface: opts.surface,
      conversationLabel: opts.conversationLabel,
    }),
  };
}

/** Format today’s (or this week’s) agenda from seeded calendar data. */
export function formatCalendarAgendaAnswer(query: string): string {
  const q = query.toLowerCase();
  const preferToday =
    /\btoday\b/.test(q) ||
    (!/\btomorrow\b/.test(q) && !/\bweek\b/.test(q) && !/\bfriday\b|\bmonday\b/.test(q));
  const preferTomorrow = /\btomorrow\b/.test(q);

  let days = calendarDays;
  if (preferToday) {
    const today = calendarDays.filter((d) => d.isToday);
    if (today.length) days = today;
  } else if (preferTomorrow) {
    const idx = calendarDays.findIndex((d) => d.isToday);
    if (idx >= 0 && calendarDays[idx + 1]) days = [calendarDays[idx + 1]!];
  }

  const lines: string[] = [];
  if (preferToday && days[0]?.isToday) {
    lines.push(`Here’s what’s on your calendar today (${days[0].weekday} ${days[0].dateLabel}):`);
  } else if (days.length === 1) {
    const d = days[0]!;
    lines.push(`Here’s ${d.weekday} ${d.dateLabel}:`);
  } else {
    lines.push("Here’s the demo week on your calendar:");
  }
  lines.push("");

  for (const day of days.slice(0, 3)) {
    if (days.length > 1) {
      lines.push(`${day.weekday} ${day.dateLabel}${day.isToday ? " (today)" : ""}`);
    }
    for (const ev of day.events.slice(0, 6)) {
      const who = ev.withWhom ? ` · ${ev.withWhom}` : "";
      const loc = ev.location ? ` · ${ev.location}` : "";
      lines.push(
        `• ${ev.start}–${ev.end} — ${ev.title}${who}${loc}`
      );
    }
    lines.push("");
  }

  lines.push("I can dig into any of these or help find an open window — say which one.");
  return cleanReplyText(lines.join("\n"));
}

/** Availability-style answer grounded in calendar events + people directory. */
export function formatAvailabilityAnswer(query: string): string | null {
  const q = query.trim();
  if (
    !/\b(free|available|availability|when is|meet with|schedule with)\b/i.test(q)
  ) {
    return null;
  }

  const person = peopleDirectory.find((p) => {
    const first = p.name.split(/\s+/)[0] ?? "";
    return (
      new RegExp(`\\b${first}\\b`, "i").test(q) ||
      new RegExp(p.name.replace(/\s+/g, "\\s+"), "i").test(q) ||
      new RegExp(`\\b${p.handle}\\b`, "i").test(q)
    );
  });

  if (!person) return null;

  const related = calendarDays.flatMap((day) =>
    day.events
      .filter(
        (ev) =>
          (ev.withWhom ?? "").toLowerCase().includes(person.name.split(" ")[0]!.toLowerCase()) ||
          (ev.withWhom ?? "").toLowerCase().includes(person.name.toLowerCase())
      )
      .map((ev) => ({ day, ev }))
  );

  const lines: string[] = [
    `${person.name} (${person.role ?? "B&G"} · ${person.office ?? "—"}) shows up on the demo calendar here:`,
    "",
  ];

  if (related.length === 0) {
    // Fall back to a clean directory answer + calendar invite path
    lines.push(
      `I don’t see ${person.name.split(" ")[0]} booked on your personal agenda this week in the demo pack.`,
      `Role: ${person.role ?? "—"}. Office: ${person.office ?? "—"}.`,
      person.bio,
      "",
      "Open /people or Calendar if you want to propose a time."
    );
  } else {
    for (const { day, ev } of related.slice(0, 5)) {
      lines.push(
        `• ${day.weekday} ${day.dateLabel} · ${ev.start}–${ev.end} — ${ev.title}${ev.location ? ` · ${ev.location}` : ""}`
      );
    }
    lines.push(
      "",
      "Those are the holds I can see. Soft windows around them are usually the best places to book."
    );
  }

  return cleanReplyText(lines.join("\n"));
}

/**
 * Grounded mock reply when AI Gateway is offline — still uses real demo data.
 * Always returns clean plain-language text (no markdown markers).
 */
export function answerFromKnowledge(
  query: string,
  opts: RetrievalOptions = {}
): string {
  const q = query.trim();
  const { hits } = retrieveContextForQuery(query, { ...opts, limit: 6 });

  // Availability / free times for a named person
  const avail = formatAvailabilityAnswer(q);
  if (avail) return avail;

  // Calendar / agenda
  if (
    /\b(calendar|schedule|agenda|what.?s on|meetings? today|today.?s meetings)\b/i.test(
      q
    )
  ) {
    return formatCalendarAgendaAnswer(q);
  }

  if (/\bcatch me up|what did i miss|brief\b/i.test(q)) {
    const lines = [
      "Here’s a quick pulse from your intranet signals:",
      "",
      ...hits.slice(0, 4).map((h) => {
        const bit = (h.body.split("\n")[0] ?? h.body).trim();
        return `• ${h.title} — ${bit.slice(0, 160)}${bit.length > 160 ? "…" : ""}`;
      }),
      "",
      "I can open any of these in Feed, Approvals, or Messages — just say which one.",
    ];
    return cleanReplyText(lines.join("\n"));
  }

  // People directory
  if (/\bwho is\b|\bfind\b.*\b(person|people)\b/i.test(q) || hits[0]?.source === "person") {
    const personHit =
      hits.find((h) => h.source === "person") ??
      (hits[0]?.source === "person" ? hits[0] : null);
    if (personHit) {
      const lines = [
        personHit.title,
        personHit.body,
        personHit.href ? `Profile: ${personHit.href}` : null,
      ].filter(Boolean);
      return cleanReplyText(lines.join("\n"));
    }
  }

  if (hits.length === 0) {
    return cleanReplyText(
      "I don’t have a matching intranet record for that in this demo pack. " +
        "Try asking about safety/TRIR, downtown tower, approvals, today’s calendar, or people like Maya Chen."
    );
  }

  const top = hits[0]!;
  const extras = hits.slice(1, 3);

  // Calendar hit as top result → richer multi-event format when relevant
  if (top.source === "calendar" && /\b(calendar|schedule|meeting|agenda|today)\b/i.test(q)) {
    return formatCalendarAgendaAnswer(q);
  }

  const parts = [
    `From ${sourceLabel(top.source)} — ${top.title}:`,
    "",
    top.body.split("\n").slice(0, 4).join("\n"),
  ];

  if (extras.length) {
    parts.push("", "Also relevant:");
    for (const e of extras) {
      parts.push(`• ${e.title} (${sourceLabel(e.source)})`);
    }
  }

  if (top.href) {
    parts.push("", `Open: ${top.href}`);
  }

  return cleanReplyText(parts.join("\n"));
}

function sourceLabel(s: KnowledgeSource): string {
  const map: Record<KnowledgeSource, string> = {
    news: "company news",
    feed: "company feed",
    scout: "scout brief",
    person: "people directory",
    channel: "team channel",
    dm: "direct message",
    approval: "approvals",
    calendar: "calendar",
    skill: "agent skills",
    routine: "routines",
    integration: "integrations",
    workspace: "workspaces",
    action: "home actions",
  };
  return map[s] ?? s;
}

/** Last user text from UIMessage-like or plain messages. */
export function extractLastUserText(
  messages: { role?: string; content?: string; parts?: { type: string; text?: string }[] }[]
): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.role !== "user") continue;
    if (typeof m.content === "string" && m.content.trim()) return m.content.trim();
    if (Array.isArray(m.parts)) {
      const t = m.parts
        .filter((p) => p.type === "text" && p.text)
        .map((p) => p.text!)
        .join("");
      if (t.trim()) return t.trim();
    }
  }
  return "";
}

/** Corpus size helper for tests / health. */
export function knowledgeStats() {
  const corpus = buildKnowledgeCorpus();
  const bySource: Record<string, number> = {};
  for (const d of corpus) {
    bySource[d.source] = (bySource[d.source] ?? 0) + 1;
  }
  return { total: corpus.length, bySource };
}
