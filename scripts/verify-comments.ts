/**
 * Gating tests for feed comment helpers (shipped pure entry points).
 * Run: npx tsx scripts/verify-comments.ts
 */
import assert from "node:assert/strict";
import {
  appendFeedComment,
  commentCountFromList,
  getPostComments,
} from "../src/lib/feed";
import { feedPosts } from "../src/lib/feed-data";
import type { FeedAuthor, FeedComment } from "../src/types/feed";

const author: FeedAuthor = {
  name: "Robert Courson",
  handle: "rcourson",
  initials: "RC",
};

function main() {
  const post = feedPosts.find((p) => p.id === "fp-1");
  assert.ok(post, "fp-1 must exist in feedPosts");

  const initial = getPostComments(post);
  assert.ok(
    initial.length >= 1,
    "fp-1 must seed commentList for leave-comment demos"
  );
  for (const c of initial) {
    assert.equal(c.postId, "fp-1");
    assert.ok(c.author.name.length > 0);
    assert.ok(c.author.initials.length > 0);
    assert.ok(c.body.trim().length > 0);
    assert.ok(!Number.isNaN(Date.parse(c.createdAt)));
  }

  const seedLen = initial.length;
  const seedCount = post.comments;

  // Empty body is a no-op
  const unchanged = appendFeedComment(initial, {
    postId: "fp-1",
    body: "   ",
    author,
  });
  assert.equal(unchanged.length, seedLen);
  assert.equal(unchanged, initial);

  // Real append grows the list with author + content
  const next = appendFeedComment(initial, {
    postId: "fp-1",
    body: "Great work from the field teams!",
    author,
    createdAt: "2026-07-23T19:00:00Z",
    id: "test-c-1",
  });
  assert.equal(next.length, seedLen + 1);
  assert.notEqual(next, initial);
  const added = next[next.length - 1] as FeedComment;
  assert.equal(added.id, "test-c-1");
  assert.equal(added.postId, "fp-1");
  assert.equal(added.body, "Great work from the field teams!");
  assert.equal(added.author.name, "Robert Courson");
  assert.equal(added.author.initials, "RC");
  assert.equal(added.createdAt, "2026-07-23T19:00:00Z");

  // Count stays in sync with seed delta
  assert.equal(
    commentCountFromList(seedCount, seedLen, next.length),
    seedCount + 1
  );
  assert.equal(
    commentCountFromList(seedCount, seedLen, seedLen),
    seedCount
  );

  // Posts without commentList start empty
  const bare = feedPosts.find((p) => !p.commentList || p.commentList.length === 0);
  if (bare) {
    const empty = getPostComments(bare);
    assert.equal(empty.length, 0);
    const one = appendFeedComment(empty, {
      postId: bare.id,
      body: "First!",
      author,
      id: "test-c-2",
    });
    assert.equal(one.length, 1);
    assert.equal(one[0]!.body, "First!");
  }

  console.log("verify-comments: all assertions passed");
  console.log(
    `  seed=${seedLen} afterAppend=${next.length} count=${commentCountFromList(seedCount, seedLen, next.length)}`
  );
}

main();
