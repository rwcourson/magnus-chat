/**
 * Gating tests for feed helpers + mock data (shipped entry points).
 * Run: npx tsx scripts/verify-feed.ts
 */
import assert from "node:assert/strict";
import {
  filterFeedByCategory,
  formatFeedTime,
  isValidFeedPost,
  sortFeedNewest,
} from "../src/lib/feed";
import { feedPosts } from "../src/lib/feed-data";

const NOW = Date.parse("2026-07-23T19:00:00Z");

function main() {
  // formatFeedTime — real function, fixed clock
  assert.equal(formatFeedTime("2026-07-23T18:30:00Z", NOW), "30m");
  assert.equal(formatFeedTime("2026-07-23T17:00:00Z", NOW), "2h");
  assert.equal(formatFeedTime("2026-07-21T19:00:00Z", NOW), "2d");
  assert.equal(formatFeedTime("2026-07-23T19:00:00Z", NOW), "Just now");
  assert.equal(formatFeedTime("not-a-date", NOW), "");

  // mock posts are structurally valid for the timeline card
  assert.ok(feedPosts.length >= 12, "expected a rich demo timeline (≥12 posts)");
  for (const post of feedPosts) {
    assert.ok(
      isValidFeedPost(post),
      `post ${String((post as { id?: string }).id)} failed isValidFeedPost`
    );
    assert.ok(post.author.name.length > 0);
    assert.ok(post.body.trim().length > 0);
    assert.ok(Array.isArray(post.reactions) && post.reactions.length > 0);
  }

  // sort newest-first
  const sorted = sortFeedNewest(feedPosts);
  for (let i = 1; i < sorted.length; i++) {
    const newer = Date.parse(sorted[i - 1]!.createdAt);
    const older = Date.parse(sorted[i]!.createdAt);
    assert.ok(newer >= older, "sortFeedNewest must be descending by time");
  }

  // category filter uses real posts
  const safety = filterFeedByCategory(feedPosts, "safety");
  assert.ok(safety.length >= 1);
  assert.ok(safety.every((p) => p.category === "safety"));
  const all = filterFeedByCategory(feedPosts, "all");
  assert.equal(all.length, feedPosts.length);

  console.log("verify-feed: all assertions passed");
  console.log(`  posts=${feedPosts.length} safety=${safety.length}`);
}

main();
