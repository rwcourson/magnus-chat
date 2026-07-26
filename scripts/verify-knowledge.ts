/**
 * Verify intranet knowledge retrieval for Magnus demo Q&A.
 * Run: npx tsx scripts/verify-knowledge.ts
 */
import assert from "node:assert/strict";
import {
  answerFromKnowledge,
  buildKnowledgeCorpus,
  knowledgeStats,
  retrieveContextForQuery,
  searchKnowledge,
  resetKnowledgeCorpus,
} from "../src/lib/ai/knowledge";
import { buildMagnusTeamReplyBody } from "../src/lib/messaging";
import { initialConversations } from "../src/lib/messaging-data";

function main() {
  resetKnowledgeCorpus();
  const corpus = buildKnowledgeCorpus();
  const stats = knowledgeStats();

  assert.ok(stats.total >= 30, `expected rich corpus, got ${stats.total}`);
  for (const src of [
    "news",
    "feed",
    "scout",
    "person",
    "channel",
    "dm",
    "approval",
    "calendar",
  ] as const) {
    assert.ok(
      (stats.bySource[src] ?? 0) >= 1,
      `corpus must include ${src}`
    );
  }

  // News / safety
  const news = searchKnowledge("latest news TRIR safety milestone");
  assert.ok(news.length >= 1, "news query should hit");
  assert.ok(
    news.some(
      (h) =>
        h.source === "news" ||
        h.source === "feed" ||
        /TRIR|safety/i.test(h.title)
    ),
    "safety/TRIR should surface from news or feed"
  );

  // Project
  const project = searchKnowledge("downtown tower crane laydown");
  assert.ok(
    project.some((h) => /downtown|crane|envelope/i.test(h.title + h.body)),
    "downtown tower signals required"
  );

  // People
  const people = searchKnowledge("who is Maya Chen");
  assert.ok(
    people.some((h) => h.source === "person" && /Maya/i.test(h.title)),
    "people directory must resolve Maya"
  );

  // Approvals
  const appr = searchKnowledge("invoices to approve OnBase");
  assert.ok(
    appr.some((h) => h.source === "approval" || h.source === "action"),
    "approvals should rank for invoice queries"
  );

  // Calendar
  const cal = searchKnowledge("what's on my calendar today standup");
  assert.ok(
    cal.some((h) => h.source === "calendar"),
    "calendar events for schedule asks"
  );

  // Context pack for API injection
  const { pack, hits } = retrieveContextForQuery(
    "What's the latest safety news?",
    { surface: "main", limit: 6 }
  );
  assert.ok(hits.length >= 3, "context pack should include several hits");
  assert.ok(pack.includes("MAGNUS INTRANET CONTEXT"), "pack header present");
  assert.ok(pack.includes("Title:"), "pack includes titles");

  // Mock answers cite real demo content
  const ans = answerFromKnowledge("What's the latest news about safety?");
  assert.ok(ans.length > 40, "answer should be substantive");
  assert.ok(
    /TRIR|safety|observation|news|feed/i.test(ans),
    `answer should mention safety content, got: ${ans.slice(0, 120)}`
  );

  // Channel @magnus path uses knowledge
  const downtown = initialConversations.find((c) => c.id === "ch-downtown");
  assert.ok(downtown);
  const channelReply = buildMagnusTeamReplyBody(
    "@magnus what's blocking Level 3?",
    downtown
  );
  assert.ok(channelReply.length > 50);
  assert.ok(
    /downtown|level|pour|onbase|invoice|crane|laydown|channel/i.test(
      channelReply
    ),
    `channel magnus reply should be grounded: ${channelReply.slice(0, 160)}`
  );

  // Feed popup surface still retrieves news/feed
  const popup = searchKnowledge("team posts", { surface: "popup", limit: 5 });
  assert.ok(popup.length >= 1);

  console.log("verify-knowledge: all assertions passed");
  console.log(`  corpus=${stats.total}`, stats.bySource);
  console.log(
    `  sampleNewsHit=${news[0]?.title ?? "none"} score=${news[0]?.score}`
  );
  console.log(`  channelReplyChars=${channelReply.length}`);
}

main();
