import type { ContentBlock, Message } from "@/types/chat";
import type { NewsStory } from "@/types/home";
import type {
  CatchUpBrief,
  CatchUpCard,
  CatchUpWindow,
  DraftEdits,
  DraftStatus,
  HeadlineDraft,
  LeadershipInsight,
  ScoutSignal,
} from "@/types/scout";
import { demoCatchUpPersona } from "@/lib/scout-data";

const WINDOW_LABELS: Record<CatchUpWindow, string> = {
  yesterday: "Since yesterday",
  week: "This week",
  visit: "Since you were last here",
};

/** Rank signals ascending (lower rank = more important). Stable by id. */
export function rankSignals(signals: ScoutSignal[]): ScoutSignal[] {
  return [...signals].sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.id.localeCompare(b.id);
  });
}

export function filterSignalsByWindow(
  signals: ScoutSignal[],
  window: CatchUpWindow | "all" = "all"
): ScoutSignal[] {
  if (window === "all") return [...signals];
  if (window === "week") {
    return signals.filter(
      (s) =>
        s.window === "week" || s.window === "yesterday" || s.window === "visit"
    );
  }
  return signals.filter((s) => s.window === window);
}

/** Prefer high confidence + personal forYou for Catch me up. */
export function selectCatchUpSignals(
  signals: ScoutSignal[],
  limit: number
): ScoutSignal[] {
  const ranked = rankSignals(signals);
  const preferred = ranked.filter(
    (s) => s.confidence === "high" || Boolean(s.forYou)
  );
  const pool = preferred.length >= Math.min(3, limit) ? preferred : ranked;
  return pool.slice(0, Math.max(1, limit));
}

export function signalToCatchUpCard(signal: ScoutSignal): CatchUpCard {
  return {
    id: signal.id,
    title: signal.title,
    whyItMatters: signal.whyNow || signal.summary,
    sources: signal.sources.map((s) => s.label).slice(0, 2),
    category: signal.category,
    timeLabel: signal.timeLabel,
    href: signal.sources.find((s) => s.href)?.href ?? "/feed",
    confidence: signal.confidence,
    forYou: signal.forYou,
  };
}

export interface BuildCatchUpOptions {
  window?: CatchUpWindow | "all";
  limit?: number;
  firstName?: string;
  projects?: string[];
}

function firstNameFrom(name?: string): string {
  if (!name?.trim()) return demoCatchUpPersona.firstName;
  return name.trim().split(/\s+/)[0] ?? demoCatchUpPersona.firstName;
}

function timeOfDayGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Build a personal Catch me up brief from scout signals.
 * Pure — safe for unit tests and demo chat seeding.
 */
export function buildCatchUpBrief(
  signals: ScoutSignal[],
  options: BuildCatchUpOptions = {}
): CatchUpBrief {
  const window = options.window ?? "week";
  const limit = options.limit ?? 3;
  const firstName = firstNameFrom(options.firstName);
  const filtered = filterSignalsByWindow(signals, window);
  const selected = selectCatchUpSignals(filtered, limit);
  const cards = selected.map(signalToCatchUpCard);
  const windowLabel =
    window === "all" ? WINDOW_LABELS.week : WINDOW_LABELS[window];

  const n = cards.length;
  const personalHits = cards.filter((c) => c.forYou).length;
  const projectHint =
    options.projects?.[0] ?? demoCatchUpPersona.projects[0] ?? "your projects";

  const greeting = `${timeOfDayGreeting()}, ${firstName}.`;
  const intro =
    personalHits > 0
      ? `Here’s a tight brief for ${windowLabel.toLowerCase()} — ${n} things that actually matter for you${projectHint ? `, with a focus on ${projectHint}` : ""}.`
      : `Here’s a tight brief for ${windowLabel.toLowerCase()} — ${n} high-signal items across safety, projects, and the field.`;

  const closing =
    "Want depth on any of these, or should I draft something for your team?";

  return {
    windowLabel,
    firstName,
    greeting,
    intro,
    cards,
    closing,
    scannedLabel: `Scouted feed · EH&S · ${projectHint} · knowledge`,
    followUps: [
      `Walk me through ${projectHint}`,
      "What should I tell my team?",
      "Anything urgent I should act on today?",
    ],
  };
}

/** Map brief → assistant message content blocks (personal, high-signal). */
export function briefToMessageBlocks(brief: CatchUpBrief): ContentBlock[] {
  const blocks: ContentBlock[] = [
    { type: "research", label: brief.scannedLabel },
    {
      type: "text",
      content: `${brief.greeting} ${brief.intro}`,
    },
    {
      type: "cards",
      items: brief.cards.map((card, i) => ({
        title: `${i + 1}. ${card.title}`,
        description: card.whyItMatters,
        forYou: card.forYou,
        meta: [card.sources.join(" · "), card.timeLabel]
          .filter(Boolean)
          .join(" · "),
        badge: card.category,
      })),
    },
  ];

  if (brief.closing) {
    blocks.push({ type: "text", content: brief.closing });
  }

  return blocks;
}

export function briefToAssistantMessage(
  brief: CatchUpBrief,
  id: string,
  createdAt: string
): Message {
  const plainIntro = `${brief.greeting} ${brief.intro}`.replace(/\*\*/g, "");
  return {
    id,
    role: "assistant",
    content: plainIntro,
    createdAt,
    blocks: briefToMessageBlocks(brief),
    followUps: brief.followUps,
  };
}

/** True when user text is a Catch me up intent (demo routing). */
export function isCatchMeUpIntent(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    t.includes("catch me up") ||
    t.includes("have magnus catch me up") ||
    t.includes("brief me on what matters") ||
    /^what did i miss\??$/.test(t) ||
    t === "catch-up" ||
    t === "catchup"
  );
}

export function filterDraftsByStatus(
  drafts: HeadlineDraft[],
  status: DraftStatus
): HeadlineDraft[] {
  return drafts.filter((d) => d.status === status);
}

export function pendingDraftCount(drafts: HeadlineDraft[]): number {
  return filterDraftsByStatus(drafts, "pending").length;
}

export function createHeadlineDraft(
  signal: ScoutSignal,
  id: string,
  createdAt: string
): HeadlineDraft {
  const whyMap: Record<ScoutSignal["signalClass"], string> = {
    safety: "Safety trend",
    project: "Project milestone",
    people: "People & culture",
    knowledge: "Knowledge theme",
    ops: "Ops pattern",
    silence: "Topic gone quiet",
  };

  return {
    id,
    signalId: signal.id,
    status: "pending",
    headline: signal.title,
    summary: signal.summary,
    whySurfaced: `${whyMap[signal.signalClass]} · ${signal.whyNow}`,
    evidence: signal.sources.slice(0, 2).map((s) => ({
      label: s.label,
      snippet: signal.whyNow,
      href: s.href,
    })),
    confidence: signal.confidence,
    suggestedChannel: "carousel",
    category: signal.category,
    imageUrl:
      signal.imageUrl ??
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=640&fit=crop",
    sources: signal.sources,
    createdAt,
  };
}

/**
 * Approve a draft → NewsStory for the home carousel.
 * Optional edits override headline/summary/category before publish.
 */
export function approveDraft(
  draft: HeadlineDraft,
  edits?: DraftEdits,
  storyId?: string
): NewsStory {
  if (draft.status === "rejected") {
    throw new Error("Cannot approve a rejected draft");
  }

  const headline = (edits?.headline ?? draft.headline).trim();
  const summary = (edits?.summary ?? draft.summary).trim();
  const category = (edits?.category ?? draft.category).trim() || draft.category;

  if (!headline) throw new Error("Headline is required to approve");
  if (!summary) throw new Error("Summary is required to approve");

  return {
    id: storyId ?? `ns-approved-${draft.id}`,
    title: headline,
    summary,
    category,
    imageUrl: draft.imageUrl,
    href: "/feed",
    timeLabel: "Just now",
    reason: "Published from Insights",
  };
}

/** Build a company-feed post from a story draft (demo publish path). */
export function draftToFeedPostInput(draft: HeadlineDraft): {
  body: string;
  headline: string;
  category: "company" | "project" | "safety" | "people" | "insight";
  tags?: string[];
} {
  const cat = draft.category.toLowerCase();
  let category: "company" | "project" | "safety" | "people" | "insight" =
    "insight";
  if (cat.includes("safety") || cat.includes("eh")) category = "safety";
  else if (cat.includes("project")) category = "project";
  else if (cat.includes("people")) category = "people";
  else if (cat.includes("knowledge")) category = "insight";
  else category = "company";

  return {
    headline: draft.headline,
    body: draft.summary,
    category,
    tags: [draft.category, "Insights"],
  };
}

/** Create a pending story draft from a leadership pulse card. */
export function insightToStoryDraft(
  insight: LeadershipInsight,
  id?: string
): HeadlineDraft {
  return {
    id: id ?? `draft-from-${insight.id}-${Date.now()}`,
    signalId: insight.signalId,
    status: "pending",
    headline: insight.title,
    summary: insight.takeaway,
    whySurfaced: insight.whyItMatters,
    evidence: insight.evidence,
    confidence: insight.confidence,
    suggestedChannel: insight.sensitive ? "email" : "carousel",
    category: insight.category,
    imageUrl:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=640&fit=crop",
    sources: insight.evidence.map((e) => ({
      label: e.label,
      href: e.href,
    })),
    createdAt: new Date().toISOString(),
  };
}

export function applyDraftStatus(
  draft: HeadlineDraft,
  status: DraftStatus
): HeadlineDraft {
  return { ...draft, status };
}

export function applyDraftEdits(
  draft: HeadlineDraft,
  edits: DraftEdits
): HeadlineDraft {
  return {
    ...draft,
    headline:
      edits.headline !== undefined ? edits.headline.trim() : draft.headline,
    summary:
      edits.summary !== undefined ? edits.summary.trim() : draft.summary,
    category:
      edits.category !== undefined
        ? edits.category.trim() || draft.category
        : draft.category,
  };
}

export function catchMeUpUserPrompt(firstName?: string): string {
  const name = firstNameFrom(firstName);
  return `Catch me up, Magnus — what should I know before I dig in today? Focus on what matters for ${name}.`;
}

export const CATCH_ME_UP_USER_PROMPT = catchMeUpUserPrompt(
  demoCatchUpPersona.firstName
);

export function catchMeUpThreadTitle(firstName?: string): string {
  const name = firstNameFrom(firstName);
  return `${name}'s brief · This week`;
}

export const CATCH_ME_UP_THREAD_TITLE = catchMeUpThreadTitle(
  demoCatchUpPersona.firstName
);
