/**
 * Demo auto-source pipeline for B&G Live — company news / marketing / system
 * items become feed posts so Live is not only organic people posts.
 * Pure helpers; no CMS.
 */

import type { FeedPost, FeedSourceKind } from "@/types/feed";
import type { NewsStory } from "@/types/home";
import { newsStories } from "@/lib/home-data";

export type AutoSourceInput = {
  id: string;
  kind: Exclude<FeedSourceKind, "organic">;
  title: string;
  body: string;
  createdAt: string;
  category?: FeedPost["category"];
  imageUrl?: string;
  href?: string;
};

const CORP_AUTHOR = {
  name: "Brasfield & Gorrie",
  handle: "bgcorp",
  role: "Corporate Communications",
  office: "Birmingham",
  initials: "BG",
  verified: true as const,
  avatarUrl:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&h=128&fit=crop",
};

const KIND_LABEL: Record<Exclude<FeedSourceKind, "organic">, string> = {
  news: "Official news",
  marketing: "Marketing",
  system: "System",
};

/** Map a home carousel / article story into a Live post. */
export function feedPostFromNewsStory(
  story: NewsStory,
  opts?: { createdAt?: string; id?: string }
): FeedPost {
  return autoSourceToFeedPost({
    id: opts?.id ?? `auto-news-${story.id}`,
    kind: "news",
    title: story.title,
    body: story.summary,
    createdAt: opts?.createdAt ?? "2026-07-23T16:00:00Z",
    category: mapNewsCategory(story.category),
    imageUrl: story.imageUrl,
    href: story.href,
  });
}

function mapNewsCategory(cat: string): FeedPost["category"] {
  const c = cat.toLowerCase();
  if (c.includes("safe") || c.includes("eh")) return "safety";
  if (c.includes("project")) return "project";
  if (c.includes("people") || c.includes("hr")) return "people";
  return "company";
}

/** Build one auto-sourced FeedPost from a generic input. */
export function autoSourceToFeedPost(input: AutoSourceInput): FeedPost {
  const sourceLabel = KIND_LABEL[input.kind];
  const media = input.imageUrl
    ? ({
        kind: "image" as const,
        src: input.imageUrl,
        alt: input.title,
      } as const)
    : input.href
      ? ({
          kind: "link" as const,
          url: input.href.startsWith("http")
            ? input.href
            : `https://magnus.demo${input.href}`,
          title: input.title,
          domain: "Company",
        } as const)
      : undefined;

  return {
    id: input.id,
    category: input.category ?? "company",
    createdAt: input.createdAt,
    author: { ...CORP_AUTHOR },
    headline: input.title,
    body: input.body,
    tags: [sourceLabel],
    media,
    reactions: [
      { type: "like", count: 12, active: false },
      { type: "insight", count: 3 },
      { type: "bookmark", count: 2 },
    ],
    comments: 0,
    shares: 4,
    sourceKind: input.kind,
    sourceLabel,
  };
}

/**
 * Demo auto-sourced Live posts from known company seeds.
 * Includes ≥2 news-derived items plus marketing + system samples.
 */
export function buildAutoSourcedFeedPosts(
  stories: NewsStory[] = newsStories
): FeedPost[] {
  const fromNews = stories.slice(0, 3).map((s, i) =>
    feedPostFromNewsStory(s, {
      id: `auto-news-${s.id}`,
      createdAt: `2026-07-23T${String(15 - i).padStart(2, "0")}:20:00Z`,
    })
  );

  const marketing = autoSourceToFeedPost({
    id: "auto-mkt-1",
    kind: "marketing",
    title: "Benefits open enrollment — targeted note",
    body: "What used to go out as a targeted all-hands email now lands in Live for the same audience. Review your elections by Friday.",
    createdAt: "2026-07-23T14:00:00Z",
    category: "people",
  });

  const system = autoSourceToFeedPost({
    id: "auto-sys-1",
    kind: "system",
    title: "Magnus · Safety digest published",
    body: "Your weekday safety routine finished. Three observations from Southeast jobs are ready in Routines.",
    createdAt: "2026-07-23T07:05:00Z",
    category: "safety",
    href: "/routines",
  });

  return [...fromNews, marketing, system];
}

export function isAutoSourcedPost(post: FeedPost): boolean {
  return Boolean(
    post.sourceKind && post.sourceKind !== "organic"
  );
}
