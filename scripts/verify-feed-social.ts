/**
 * Gating tests for nested replies + post composer helpers (shipped modules).
 * Run: npx tsx scripts/verify-feed-social.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  appendFeedComment,
  appendFeedReply,
  createFeedPost,
  getPostComments,
  getReplies,
  getRootComments,
  isValidFeedPost,
  prependFeedPost,
  totalCommentNodes,
  validateComposerInput,
} from "../src/lib/feed";
import { feedPosts } from "../src/lib/feed-data";
import type { FeedAuthor } from "../src/types/feed";

const root = join(__dirname, "..");
const author: FeedAuthor = {
  name: "Robert Courson",
  handle: "rcourson",
  initials: "RC",
};

function main() {
  const post = feedPosts.find((p) => p.id === "fp-1");
  assert.ok(post, "fp-1 required");

  const seed = getPostComments(post);
  assert.ok(seed.length >= 3, "seed comments");
  const roots = getRootComments(seed);
  assert.ok(roots.some((c) => c.id === "fc-1a"));
  const nested = getReplies(seed, "fc-1a");
  assert.ok(
    nested.some((r) => r.media?.kind === "image"),
    "seed reply should include image media"
  );

  // Nested reply with video media
  const withReply = appendFeedReply(seed, {
    postId: "fp-1",
    parentId: "fc-1a",
    body: "Here's a clip from the pour.",
    author,
    id: "test-reply-video",
    createdAt: "2026-07-23T19:00:00Z",
    media: {
      kind: "video",
      src: "https://example.com/clip.mp4",
      poster: "https://example.com/poster.jpg",
      alt: "Pour clip",
    },
  });
  assert.equal(withReply.length, seed.length + 1);
  const videoReply = withReply.find((c) => c.id === "test-reply-video");
  assert.ok(videoReply);
  assert.equal(videoReply!.parentId, "fc-1a");
  assert.equal(videoReply!.media?.kind, "video");
  assert.equal(videoReply!.body, "Here's a clip from the pour.");
  assert.equal(totalCommentNodes(withReply), seed.length + 1);

  // Invalid parent is no-op
  const unchanged = appendFeedReply(seed, {
    postId: "fp-1",
    parentId: "missing",
    body: "nope",
    author,
  });
  assert.equal(unchanged.length, seed.length);

  // Top-level still works via appendFeedComment
  const withRoot = appendFeedComment(seed, {
    postId: "fp-1",
    body: "Top level",
    author,
    id: "test-root",
  });
  assert.equal(getRootComments(withRoot).length, roots.length + 1);

  // Composer validation + create
  assert.equal(validateComposerInput({ body: "  " }).ok, false);
  assert.equal(validateComposerInput({ body: "Hello team" }).ok, true);

  const created = createFeedPost({
    body: "Crane window moved to 7 AM.",
    headline: "Logistics note",
    category: "project",
    tags: ["Logistics", "Field"],
    author,
    id: "fp-new-1",
    createdAt: "2026-07-23T19:05:00Z",
    media: {
      kind: "image",
      src: "https://example.com/crane.jpg",
      alt: "Crane",
    },
  });
  assert.ok(created);
  assert.ok(isValidFeedPost(created));
  assert.equal(created!.id, "fp-new-1");
  assert.equal(created!.headline, "Logistics note");
  assert.equal(created!.category, "project");
  assert.deepEqual(created!.tags, ["Logistics", "Field"]);
  assert.equal(created!.media?.kind, "image");
  assert.equal(created!.comments, 0);

  const timeline = prependFeedPost(feedPosts, created!);
  assert.equal(timeline[0]!.id, "fp-new-1");
  assert.equal(timeline.length, feedPosts.length + 1);

  // Empty body fails create
  assert.equal(createFeedPost({ body: "   ", author }), null);

  // Structural: views exist, no Coming soon
  for (const route of ["people", "notifications"]) {
    const page = readFileSync(join(root, "src/app", route, "page.tsx"), "utf8");
    assert.ok(!page.includes("PlaceholderPage"), `${route} not placeholder`);
    assert.ok(!page.includes("Coming soon"), `${route} not coming soon`);
  }
  assert.ok(existsSync(join(root, "src/components/feed/FeedComposer.tsx")));
  assert.ok(existsSync(join(root, "src/components/feed/CommentThread.tsx")));
  assert.ok(existsSync(join(root, "src/components/social/PeopleView.tsx")));
  assert.ok(
    existsSync(join(root, "src/components/social/NotificationsView.tsx"))
  );

  const newsFeed = readFileSync(
    join(root, "src/components/feed/NewsFeed.tsx"),
    "utf8"
  );
  assert.ok(newsFeed.includes("FeedComposer"));
  const composer = readFileSync(
    join(root, "src/components/feed/FeedComposer.tsx"),
    "utf8"
  );
  assert.ok(composer.includes("data-feed-share-strip"));
  assert.ok(composer.includes("data-feed-composer"));
  assert.ok(!composer.includes("Portal"), "composer is inline, not a modal");
  assert.ok(composer.includes("aria-expanded"));

  const commentUi = readFileSync(
    join(root, "src/components/feed/CommentThread.tsx"),
    "utf8"
  );
  assert.ok(commentUi.includes("appendFeedComment"));
  assert.ok(commentUi.includes("data-attach-image"));
  assert.ok(commentUi.includes("data-attach-video"));
  assert.ok(commentUi.includes("parentId"));

  console.log("verify-feed-social: all assertions passed");
  console.log(
    `  seedComments=${seed.length} afterReply=${withReply.length} roots=${roots.length} nestedWithMedia=${nested.length}`
  );
}

main();
