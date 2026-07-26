/**
 * Demo seed density + referential integrity.
 * Run: npx tsx scripts/verify-seed-demo.ts
 *
 * Asserts floors on shipped seed modules (people, feed, messaging) and
 * that DM peers / human authors resolve into peopleDirectory.
 */
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { peopleDirectory } from "../src/lib/people-data";
import { feedPosts } from "../src/lib/feed-data";
import { initialConversations, MAGNUS_AUTHOR } from "../src/lib/messaging-data";
import { listChannels, listDms, resolveDmPeer } from "../src/lib/messaging";

const FLOORS = {
  people: 12,
  posts: 12,
  dms: 4,
  channels: 4,
  totalMessages: 40,
  postsWithNestedComments: 3,
  offices: 4,
  divisions: 3,
} as const;

function main() {
  const people = peopleDirectory.length;
  const posts = feedPosts.length;
  const channels = listChannels(initialConversations);
  const dms = listDms(initialConversations);

  let totalMessages = 0;
  for (const c of initialConversations) {
    for (const m of c.messages) {
      totalMessages += 1;
      totalMessages += m.threadReplies?.length ?? 0;
    }
  }

  let nestedPosts = 0;
  for (const p of feedPosts) {
    const list = p.commentList ?? [];
    if (list.some((c) => c.parentId)) nestedPosts += 1;
  }

  const offices = new Set(
    peopleDirectory.map((p) => p.office).filter(Boolean) as string[]
  );
  const divisions = new Set(
    peopleDirectory.map((p) => p.division).filter(Boolean) as string[]
  );

  assert.ok(people >= FLOORS.people, `people ${people} < ${FLOORS.people}`);
  assert.ok(posts >= FLOORS.posts, `posts ${posts} < ${FLOORS.posts}`);
  assert.ok(dms.length >= FLOORS.dms, `dms ${dms.length} < ${FLOORS.dms}`);
  assert.ok(
    channels.length >= FLOORS.channels,
    `channels ${channels.length} < ${FLOORS.channels}`
  );
  assert.ok(
    totalMessages >= FLOORS.totalMessages,
    `totalMessages ${totalMessages} < ${FLOORS.totalMessages}`
  );
  assert.ok(
    nestedPosts >= FLOORS.postsWithNestedComments,
    `nestedPosts ${nestedPosts} < ${FLOORS.postsWithNestedComments}`
  );
  assert.ok(offices.size >= FLOORS.offices, `offices ${offices.size}`);
  assert.ok(divisions.size >= FLOORS.divisions, `divisions ${divisions.size}`);

  // DM peers must resolve to directory faces
  for (const dm of dms) {
    const peer = resolveDmPeer(dm, peopleDirectory);
    assert.ok(peer, `DM ${dm.id} peer`);
    assert.ok(
      peopleDirectory.some((p) => p.id === peer!.id),
      `DM peer ${peer!.id} in directory`
    );
  }

  // Human messaging authors (non-self, non-magnus) should exist in directory
  const dirIds = new Set(peopleDirectory.map((p) => p.id));
  for (const c of initialConversations) {
    for (const m of c.messages) {
      const a = m.author;
      if (a.isMagnus || a.id === MAGNUS_AUTHOR.id || a.id === "self") continue;
      if (a.id.startsWith("p-")) {
        assert.ok(dirIds.has(a.id), `author ${a.id} missing from directory`);
      }
    }
  }

  // Magnus bodies: no raw markdown emphasis
  for (const c of initialConversations) {
    for (const m of c.messages) {
      if (!m.author.isMagnus && m.author.id !== "magnus") continue;
      assert.ok(
        !m.body.includes("**"),
        `Magnus message ${m.id} still has markdown **`
      );
    }
  }

  // Required anchors for demos / other tests
  assert.ok(feedPosts.some((p) => p.id === "fp-1"));
  assert.ok(channels.some((c) => c.slug === "downtown-tower" || c.name === "downtown-tower"));
  assert.ok(channels.some((c) => c.slug === "general" || c.name === "general"));

  const snapshot = {
    people,
    posts,
    channels: channels.length,
    dms: dms.length,
    totalMessages,
    nestedPosts,
    offices: [...offices].sort(),
    divisions: [...divisions].sort(),
    floors: FLOORS,
    ok: true,
  };

  console.log("verify-seed-demo: all assertions passed");
  console.log(
    `  people=${people} posts=${posts} channels=${channels.length} dms=${dms.length} msgs=${totalMessages} nestedPosts=${nestedPosts}`
  );
  console.log(`  offices=${snapshot.offices.join(", ")}`);
  console.log(`  divisions=${snapshot.divisions.join(", ")}`);

  // Optional machine-readable dump for goal evidence (env SCRATCH or cwd)
  const out = process.env.SEED_COUNTS_OUT;
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(snapshot, null, 2));
    console.log(`  wrote ${out}`);
  }
}

main();
