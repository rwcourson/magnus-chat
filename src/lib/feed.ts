/**
 * Pure helpers for the news feed — no React / DOM.
 * Used by UI and unit tests.
 */

import type {
  CommentMedia,
  FeedAuthor,
  FeedCategory,
  FeedComment,
  FeedComposerInput,
  FeedPost,
} from "@/types/feed";

/** Format an ISO date as a short relative label (e.g. "2h", "3d", "Just now"). */
export function formatFeedTime(
  iso: string,
  nowMs: number = Date.now()
): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, nowMs - t);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Sort posts newest-first (stable for equal timestamps). */
export function sortFeedNewest(posts: FeedPost[]): FeedPost[] {
  return [...posts].sort((a, b) => {
    const d = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (d !== 0) return d;
    return a.id.localeCompare(b.id);
  });
}

/** Filter by category; "all" returns a sorted copy of the full list. */
export function filterFeedByCategory(
  posts: FeedPost[],
  category: FeedPost["category"] | "all"
): FeedPost[] {
  const sorted = sortFeedNewest(posts);
  if (category === "all") return sorted;
  return sorted.filter((p) => p.category === category);
}

/** Structural check: a post is display-ready for the timeline card. */
export function isValidFeedPost(post: unknown): post is FeedPost {
  if (!post || typeof post !== "object") return false;
  const p = post as Record<string, unknown>;
  if (typeof p.id !== "string" || !p.id) return false;
  if (typeof p.body !== "string" || !p.body.trim()) return false;
  if (typeof p.createdAt !== "string" || Number.isNaN(Date.parse(p.createdAt)))
    return false;
  if (!p.author || typeof p.author !== "object") return false;
  const a = p.author as Record<string, unknown>;
  if (typeof a.name !== "string" || !a.name) return false;
  if (typeof a.initials !== "string" || !a.initials) return false;
  if (!Array.isArray(p.reactions)) return false;
  return true;
}

/** Initial comment list for a post (seed data, immutable copy). */
export function getPostComments(post: FeedPost): FeedComment[] {
  return post.commentList ? post.commentList.map((c) => ({ ...c, media: c.media ? { ...c.media } : undefined })) : [];
}

export type AppendCommentInput = {
  postId: string;
  body: string;
  author: FeedAuthor;
  parentId?: string;
  media?: CommentMedia;
  /** ISO timestamp; defaults to now when omitted */
  createdAt?: string;
  id?: string;
};

/**
 * Append a top-level comment or nested reply. Pure — returns a new array.
 * Trims body; rejects empty comments without media (returns previous list).
 * Allows media-only replies when media is provided.
 */
export function appendFeedComment(
  comments: FeedComment[],
  input: AppendCommentInput
): FeedComment[] {
  const body = input.body.trim();
  if (!body && !input.media) return comments;

  if (input.parentId) {
    const parent = comments.find((c) => c.id === input.parentId);
    if (!parent || parent.postId !== input.postId) return comments;
    // Only one level of nesting for demo clarity
    if (parent.parentId) return comments;
  }

  const next: FeedComment = {
    id: input.id ?? `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    postId: input.postId,
    parentId: input.parentId,
    author: input.author,
    body: body || (input.media?.kind === "image" ? "Photo" : "Video"),
    createdAt: input.createdAt ?? new Date().toISOString(),
    media: input.media,
  };
  return [...comments, next];
}

/** Alias used by tests / UI for nested replies with media. */
export function appendFeedReply(
  comments: FeedComment[],
  input: AppendCommentInput & { parentId: string }
): FeedComment[] {
  return appendFeedComment(comments, input);
}

/** Top-level comments only (no parentId). */
export function getRootComments(comments: FeedComment[]): FeedComment[] {
  return comments.filter((c) => !c.parentId);
}

/** Direct replies under a parent comment. */
export function getReplies(
  comments: FeedComment[],
  parentId: string
): FeedComment[] {
  return comments.filter((c) => c.parentId === parentId);
}

/** Total nodes in the thread (roots + replies). */
export function totalCommentNodes(comments: FeedComment[]): number {
  return comments.length;
}

/** Count helper after local comments change (keeps UI badge in sync). */
export function commentCountFromList(
  seedCount: number,
  seedLen: number,
  currentLen: number
): number {
  const delta = currentLen - seedLen;
  return Math.max(0, seedCount + delta);
}

const CATEGORIES: FeedCategory[] = [
  "company",
  "project",
  "safety",
  "people",
  "insight",
];

export function isFeedCategory(v: unknown): v is FeedCategory {
  return typeof v === "string" && (CATEGORIES as string[]).includes(v);
}

/**
 * Validate composer fields before create.
 * Body is required (non-empty after trim).
 */
export function validateComposerInput(
  input: Pick<FeedComposerInput, "body" | "headline" | "category">
): { ok: true } | { ok: false; error: string } {
  if (!input.body || !input.body.trim()) {
    return { ok: false, error: "Body is required" };
  }
  if (input.category !== undefined && !isFeedCategory(input.category)) {
    return { ok: false, error: "Invalid category" };
  }
  if (input.headline !== undefined && typeof input.headline !== "string") {
    return { ok: false, error: "Invalid headline" };
  }
  return { ok: true };
}

/**
 * Build a new FeedPost from composer input. Pure.
 * Returns null when validation fails.
 */
export function createFeedPost(input: FeedComposerInput): FeedPost | null {
  const check = validateComposerInput(input);
  if (!check.ok) return null;

  const body = input.body.trim();
  const headline = input.headline?.trim() || undefined;
  const tags = input.tags
    ?.map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);

  return {
    id: input.id ?? `fp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    author: input.author,
    createdAt: input.createdAt ?? new Date().toISOString(),
    body,
    headline,
    tags: tags && tags.length > 0 ? tags : undefined,
    media: input.media,
    reactions: [
      { type: "like", count: 0 },
      { type: "insight", count: 0 },
      { type: "bookmark", count: 0 },
    ],
    comments: 0,
    shares: 0,
    commentList: [],
    category: input.category ?? "company",
  };
}

/** Prepend a post onto a timeline (immutable). */
export function prependFeedPost(
  posts: FeedPost[],
  post: FeedPost
): FeedPost[] {
  return [post, ...posts];
}
