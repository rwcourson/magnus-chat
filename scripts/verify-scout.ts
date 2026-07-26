/**
 * Gating tests for Magnus scout helpers (Catch me up + Comms drafts).
 * Run: npx tsx scripts/verify-scout.ts
 */
import assert from "node:assert/strict";
import {
  applyDraftEdits,
  applyDraftStatus,
  approveDraft,
  briefToMessageBlocks,
  buildCatchUpBrief,
  CATCH_ME_UP_USER_PROMPT,
  createHeadlineDraft,
  filterDraftsByStatus,
  isCatchMeUpIntent,
  pendingDraftCount,
  rankSignals,
  selectCatchUpSignals,
} from "../src/lib/scout";
import { scoutSignals, seedHeadlineDrafts } from "../src/lib/scout-data";

function main() {
  assert.ok(scoutSignals.length >= 5, "expected demo scout signals");
  assert.ok(seedHeadlineDrafts.length >= 3, "expected seed Comms drafts");

  // ranking
  const ranked = rankSignals(scoutSignals);
  for (let i = 1; i < ranked.length; i++) {
    assert.ok(
      ranked[i - 1]!.rank <= ranked[i]!.rank,
      "rankSignals must sort ascending by rank"
    );
  }

  // personal catch-up brief — high signal, limited cards
  const brief = buildCatchUpBrief(scoutSignals, {
    window: "week",
    limit: 3,
    firstName: "Robert",
    projects: ["Downtown tower"],
  });
  assert.ok(brief.cards.length >= 2 && brief.cards.length <= 3);
  assert.ok(brief.greeting.includes("Robert"));
  assert.ok(brief.intro.toLowerCase().includes("downtown tower") || brief.intro.includes("**"));
  assert.ok(brief.followUps.length >= 2);
  assert.ok(brief.scannedLabel.length > 0);
  assert.ok(
    brief.cards.some((c) => c.forYou),
    "at least one card should feel personal"
  );
  for (const card of brief.cards) {
    assert.ok(card.title.length > 0);
    assert.ok(card.whyItMatters.length > 0);
    assert.ok(card.sources.length >= 1);
  }

  const selected = selectCatchUpSignals(scoutSignals, 3);
  assert.equal(selected.length, 3);
  assert.ok(selected.every((s) => s.confidence === "high" || s.forYou));

  const blocks = briefToMessageBlocks(brief);
  assert.ok(blocks.some((b) => b.type === "research"));
  assert.ok(blocks.some((b) => b.type === "cards"));
  assert.ok(blocks.some((b) => b.type === "text"));
  // No noisy “demo sources” callout
  assert.ok(!blocks.some((b) => b.type === "callout"));

  // intent detection
  assert.equal(isCatchMeUpIntent(CATCH_ME_UP_USER_PROMPT), true);
  assert.equal(isCatchMeUpIntent("Catch me up"), true);
  assert.equal(isCatchMeUpIntent("what did i miss?"), true);
  assert.equal(isCatchMeUpIntent("Draft a toolbox talk"), false);

  // drafts — calm queue
  const pending = filterDraftsByStatus(seedHeadlineDrafts, "pending");
  assert.ok(pending.length >= 2 && pending.length <= 4);
  assert.equal(pendingDraftCount(seedHeadlineDrafts), pending.length);

  const draft = pending[0]!;
  const story = approveDraft(draft, {
    headline: "Edited safety headline",
    summary: "Comms-owned summary for the carousel.",
  });
  assert.equal(story.title, "Edited safety headline");
  assert.equal(story.reason, "Published by Internal Comms");

  const rejected = applyDraftStatus(draft, "rejected");
  assert.throws(() => approveDraft(rejected), /rejected/i);

  const edited = applyDraftEdits(draft, { headline: "  New title  " });
  assert.equal(edited.headline, "New title");

  const fromSignal = createHeadlineDraft(
    scoutSignals[0]!,
    "draft-x",
    "2026-07-23T12:00:00Z"
  );
  assert.equal(fromSignal.status, "pending");
  assert.ok(fromSignal.evidence.length >= 1);

  for (const d of seedHeadlineDrafts) {
    assert.ok(d.evidence.length >= 1, `draft ${d.id} missing evidence`);
    assert.ok(d.whySurfaced.length > 0);
  }

  console.log("verify-scout: all assertions passed");
  console.log(
    `  signals=${scoutSignals.length} drafts=${seedHeadlineDrafts.length} briefCards=${brief.cards.length} greeting="${brief.greeting}"`
  );
}

main();
