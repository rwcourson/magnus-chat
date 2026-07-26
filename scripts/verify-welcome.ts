/**
 * Unit tests for welcome + recent-posts helpers (shipped entry points).
 * Run: npx tsx scripts/verify-welcome.ts
 */
import assert from "node:assert/strict";
import {
  firstName,
  selectRecentPosts,
  welcomeMessage,
} from "../src/lib/welcome";
import { feedPosts } from "../src/lib/feed-data";
import { isValidFeedPost } from "../src/lib/feed";

function main() {
  // firstName
  assert.equal(firstName("Robert Courson"), "Robert");
  assert.equal(firstName("  Robert  Courson "), "Robert");
  assert.equal(firstName(""), "");
  assert.equal(firstName("Madonna"), "Madonna");

  // welcomeMessage — AC requires “Welcome Robert” for current user shape
  assert.equal(welcomeMessage("Robert Courson"), "Welcome Robert");
  assert.equal(welcomeMessage("Robert"), "Welcome Robert");
  assert.equal(welcomeMessage(""), "Welcome");

  // selectRecentPosts uses real feed data + newest-first
  const recent = selectRecentPosts(feedPosts, 6);
  assert.ok(recent.length > 0 && recent.length <= 6);
  assert.ok(recent.length <= feedPosts.length);
  for (const p of recent) {
    assert.ok(isValidFeedPost(p), `invalid post ${p.id}`);
  }
  for (let i = 1; i < recent.length; i++) {
    const a = Date.parse(recent[i - 1]!.createdAt);
    const b = Date.parse(recent[i]!.createdAt);
    assert.ok(a >= b, "recent strip must be newest-first");
  }
  assert.deepEqual(selectRecentPosts(feedPosts, 0), []);
  assert.equal(selectRecentPosts(feedPosts, 3).length, 3);

  console.log("verify-welcome: all assertions passed");
  console.log(`  welcome="${welcomeMessage("Robert Courson")}" recent=${recent.length}`);
}

main();
