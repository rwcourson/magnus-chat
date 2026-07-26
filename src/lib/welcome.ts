/**
 * Pure helpers for the personalized home empty state.
 * No React — unit-tested and used by EmptyState / recent strip.
 */

import type { FeedPost } from "@/types/feed";
import { sortFeedNewest } from "@/lib/feed";

/** First word of a display name; empty input → empty string. */
export function firstName(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? "";
}

/**
 * Personal welcome for the home chat surface.
 * e.g. "Robert Courson" → "Welcome Robert"
 */
export function welcomeMessage(displayName: string): string {
  const first = firstName(displayName);
  if (!first) return "Welcome";
  return `Welcome ${first}`;
}

/**
 * Newest N feed posts for the home “recent posts” strip.
 * Returns a new array; does not mutate input.
 */
export function selectRecentPosts(
  posts: FeedPost[],
  limit: number = 6
): FeedPost[] {
  if (limit <= 0) return [];
  return sortFeedNewest(posts).slice(0, limit);
}
