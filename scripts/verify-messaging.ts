/**
 * Gating tests for team messaging (Slack-like) helpers.
 * Run: npx tsx scripts/verify-messaging.ts
 *
 * Drives shipped functions in src/lib/messaging.ts + seed data — no re-implementation.
 */
import assert from "node:assert/strict";
import {
  appendTeamMessage,
  appendThreadReply,
  applyReactionToggle,
  buildMagnusTeamReplyBody,
  createMagnusTeamReply,
  filterConversations,
  getConversation,
  getMessage,
  isMagnusMention,
  listChannels,
  listDms,
  makeMockAttachment,
  makeTeamMessage,
  replyInThread,
  resolveConversationIdentity,
  resolveDmPeer,
  sendTeamMessage,
  sendTeamMessageWithMagnus,
  shouldMagnusRespond,
  threadReplyCount,
  toggleMessageReaction,
  totalUnread,
} from "../src/lib/messaging";
import {
  DEFAULT_CONVERSATION_ID,
  initialConversations,
  MAGNUS_AUTHOR,
} from "../src/lib/messaging-data";
import { peopleDirectory } from "../src/lib/people-data";
import { isCatchMeUpIntent } from "../src/lib/scout";

function main() {
  // --- seed surface ---
  assert.ok(initialConversations.length >= 10, "expected rich seeded conversations");
  const channels = listChannels(initialConversations);
  const dms = listDms(initialConversations);
  assert.ok(channels.length >= 4, "expected multiple channels");
  assert.ok(dms.length >= 4, "expected at least four DMs for demo variety");
  assert.ok(dms.length <= 6, "keep DM sidebar tight (≤6) for demos");
  assert.ok(
    peopleDirectory.length >= 12,
    "people directory needs a full demo cast"
  );
  assert.ok(
    channels.every((c) => c.kind === "channel"),
    "listChannels must only return channels"
  );
  assert.ok(
    dms.every((c) => c.kind === "dm"),
    "listDms must only return DMs"
  );
  assert.ok(
    channels.some((c) => c.slug === "downtown-tower" || c.name === "downtown-tower"),
    "B&G downtown-tower channel required"
  );
  assert.ok(
    channels.some((c) => c.name === "general" || c.slug === "general"),
    "general channel required"
  );

  // --- demo seed mix (internal walkthrough) ---
  const purposes = new Set(
    channels.map((c) => c.purpose).filter(Boolean) as string[]
  );
  assert.ok(purposes.has("company"), "seed needs company-wide channel");
  assert.ok(purposes.has("project"), "seed needs project channel");
  assert.ok(purposes.has("safety"), "seed needs EH&S/safety channel");
  assert.ok(
    channels.some((c) => c.imageUrl && c.imageUrl.length > 8),
    "at least one channel must carry image/mark data"
  );
  assert.ok(
    channels.some((c) => !c.imageUrl),
    "at least one channel should remain hash-only (no image)"
  );
  const unreadCounts = initialConversations.map((c) => c.unreadCount);
  assert.ok(
    unreadCounts.some((n) => n > 0) && unreadCounts.some((n) => n === 0),
    "seed must mix unread and read conversations"
  );
  assert.ok(
    initialConversations.some((c) =>
      c.messages.some((m) => (m.reactions?.length ?? 0) > 0)
    ),
    "seed should include reactions"
  );
  assert.ok(
    initialConversations.some((c) =>
      c.messages.some((m) => (m.threadReplies?.length ?? 0) > 0)
    ),
    "seed should include a thread"
  );
  assert.ok(
    initialConversations.some((c) =>
      c.messages.some((m) => m.author.isMagnus)
    ),
    "seed should include a Magnus in-channel message"
  );

  // Every seeded @magnus mention must be followed by a Magnus reply (demo-ready)
  for (const c of initialConversations) {
    for (let i = 0; i < c.messages.length; i++) {
      const m = c.messages[i]!;
      if (!m.mentionsMagnus || m.author.isMagnus) continue;
      const reply = c.messages
        .slice(i + 1)
        .find((x) => x.author.isMagnus || x.author.id === "magnus");
      assert.ok(
        reply,
        `seed ${c.id}: message ${m.id} tags @magnus but has no Magnus reply after it`
      );
      assert.ok(
        reply!.body.trim().length > 40,
        `seed ${c.id}: Magnus reply after ${m.id} should be a real demo response`
      );
    }
  }

  // --- identity resolvers (shipped pure helpers on real seed) ---
  for (const dm of dms) {
    const peer = resolveDmPeer(dm, peopleDirectory);
    assert.ok(peer, `DM ${dm.id} must resolve a peer`);
    assert.ok(peer!.initials.trim().length >= 1, `DM ${dm.id} needs initials`);
    assert.ok(
      peer!.name.trim().length >= 2,
      `DM ${dm.id} needs display name from directory`
    );
    // Real directory faces for demo people
    const fromDir = peopleDirectory.find((p) => p.id === peer!.id);
    assert.ok(fromDir, `DM peer ${peer!.id} must exist in peopleDirectory`);
    assert.ok(
      peer!.avatarUrl || peer!.initials,
      `DM ${dm.id} needs avatar URL and/or initials`
    );
    assert.ok(
      peer!.avatarUrl && peer!.avatarUrl.startsWith("http"),
      `DM ${dm.id} should resolve a portrait URL from directory for demo`
    );

    const id = resolveConversationIdentity(dm, peopleDirectory);
    assert.equal(id.kind, "dm");
    assert.equal(id.label, peer!.name);
    assert.equal(id.imageUrl, peer!.avatarUrl);
    assert.equal(id.hasChannelImage, false);
    assert.ok(id.peerId === peer!.id);
  }

  const imaged = channels.filter((c) => c.imageUrl);
  assert.ok(imaged.length >= 1);
  for (const ch of imaged) {
    const id = resolveConversationIdentity(ch, peopleDirectory);
    assert.equal(id.kind, "channel");
    assert.equal(id.hasChannelImage, true);
    assert.equal(id.imageUrl, ch.imageUrl);
    assert.ok(id.label.startsWith("#"));
  }
  const hashOnly = channels.find((c) => !c.imageUrl);
  assert.ok(hashOnly);
  const hashId = resolveConversationIdentity(hashOnly!, peopleDirectory);
  assert.equal(hashId.hasChannelImage, false);
  assert.ok(!hashId.imageUrl);

  const downtown = getConversation(DEFAULT_CONVERSATION_ID, initialConversations);
  assert.ok(downtown, "default conversation must exist");
  assert.ok(downtown!.messages.length >= 2, "seed messages required");

  // --- filter ---
  const filtered = filterConversations(initialConversations, "envelope");
  assert.ok(filtered.length >= 1, "filter should find envelope discussion");
  assert.equal(
    filterConversations(initialConversations, "zzzz-no-match").length,
    0
  );

  // --- append / send user message ---
  const beforeCount = downtown!.messages.length;
  const userMsg = makeTeamMessage({
    conversationId: downtown!.id,
    body: "Staging complete on north laydown.",
    createdAt: "2026-07-24T17:00:00Z",
    id: "test-user-1",
  });
  const afterAppend = appendTeamMessage(
    initialConversations,
    downtown!.id,
    userMsg
  );
  const updated = getConversation(downtown!.id, afterAppend)!;
  assert.equal(updated.messages.length, beforeCount + 1);
  assert.equal(updated.messages[updated.messages.length - 1]!.body, userMsg.body);
  assert.equal(updated.messages[updated.messages.length - 1]!.id, "test-user-1");
  // original seed unchanged
  assert.equal(
    getConversation(downtown!.id, initialConversations)!.messages.length,
    beforeCount
  );

  const sent = sendTeamMessage(
    initialConversations,
    downtown!.id,
    "Heads up — crane window confirmed."
  );
  assert.ok(sent);
  assert.equal(sent!.magnusShouldRespond, false);
  assert.ok(
    getConversation(downtown!.id, sent!.conversations)!.messages.some(
      (m) => m.body.includes("crane window")
    )
  );

  // --- mention detection ---
  assert.equal(isMagnusMention("@magnus hello"), true);
  assert.equal(isMagnusMention("hey @magnus catch me up"), true);
  assert.equal(isMagnusMention("email magnus@brasfieldgorrie.com"), false);
  assert.equal(isMagnusMention("no bot here"), false);
  assert.equal(shouldMagnusRespond("ping @magnus"), true);
  assert.equal(shouldMagnusRespond("ping Maya"), false);

  // --- catch-up intent on sample strings (shipped scout) ---
  assert.equal(isCatchMeUpIntent("catch me up on the day"), true);
  assert.equal(
    isCatchMeUpIntent("@magnus catch me up on the day"),
    true
  );
  assert.equal(isCatchMeUpIntent("what's for lunch"), false);

  // --- @magnus + catch-up path ---
  const body = "@magnus catch me up on the day";
  assert.equal(shouldMagnusRespond(body), true);
  assert.equal(isCatchMeUpIntent(body), true);

  const withBot = sendTeamMessageWithMagnus(
    initialConversations,
    downtown!.id,
    body,
    { createdAt: "2026-07-24T18:00:00Z" }
  );
  assert.ok(withBot);
  assert.equal(withBot!.magnusShouldRespond, true);
  assert.equal(withBot!.catchUp, true);
  assert.ok(withBot!.magnusMessage);
  assert.equal(withBot!.magnusMessage!.author.id, MAGNUS_AUTHOR.id);
  assert.ok(
    withBot!.magnusMessage!.body.trim().length > 40,
    "Magnus catch-up reply must be non-empty substantive brief"
  );
  assert.notEqual(
    withBot!.magnusMessage!.body,
    withBot!.userMessage.body,
    "assistant reply must differ from user text"
  );

  const convAfter = getConversation(downtown!.id, withBot!.conversations)!;
  const last = convAfter.messages[convAfter.messages.length - 1]!;
  assert.equal(last.author.isMagnus, true);
  assert.ok(last.body.length > 0);

  // generic @magnus (no catch-up) still replies
  const generic = sendTeamMessageWithMagnus(
    initialConversations,
    "ch-general",
    "@magnus what's the weather for pour?",
    { createdAt: "2026-07-24T18:05:00Z" }
  );
  assert.ok(generic?.magnusMessage);
  assert.ok(generic!.magnusMessage!.body.length > 10);
  assert.equal(generic!.catchUp, false);

  // createMagnusTeamReply / buildMagnusTeamReplyBody direct
  const replyBody = buildMagnusTeamReplyBody(body, downtown!);
  assert.ok(replyBody.length > 20);
  const created = createMagnusTeamReply(downtown!.id, body, initialConversations);
  assert.equal(created.author.id, "magnus");
  assert.ok(created.body.length > 0);

  // unread aggregate
  assert.ok(totalUnread(initialConversations) >= 1);

  // --- reactions (real path) ---
  const pure = applyReactionToggle(undefined, "👍");
  assert.equal(pure.length, 1);
  assert.equal(pure[0]!.emoji, "👍");
  assert.equal(pure[0]!.count, 1);
  assert.equal(pure[0]!.me, true);
  const toggledOff = applyReactionToggle(pure, "👍");
  assert.equal(toggledOff.length, 0);
  const multi = applyReactionToggle(
    [{ emoji: "👀", count: 2, me: false }],
    "👀"
  );
  assert.equal(multi[0]!.count, 3);
  assert.equal(multi[0]!.me, true);

  const msgId = downtown!.messages[0]!.id;
  const reacted = toggleMessageReaction(
    initialConversations,
    downtown!.id,
    msgId,
    "🚀"
  );
  const reactedMsg = getMessage(reacted, downtown!.id, msgId)!;
  assert.ok(
    reactedMsg.reactions?.some((r) => r.emoji === "🚀" && r.me && r.count >= 1),
    "toggleMessageReaction must add self reaction via shipped path"
  );
  // seed unchanged
  assert.ok(
    !getMessage(initialConversations, downtown!.id, msgId)?.reactions?.some(
      (r) => r.emoji === "🚀" && r.me
    )
  );
  // toggle off
  const unreacted = toggleMessageReaction(reacted, downtown!.id, msgId, "🚀");
  const afterOff = getMessage(unreacted, downtown!.id, msgId)!;
  assert.ok(
    !afterOff.reactions?.some((r) => r.emoji === "🚀" && r.me),
    "second toggle removes self reaction"
  );

  // --- threads ---
  const parentId = downtown!.messages[0]!.id;
  const seedThreadBase = threadReplyCount(
    getMessage(initialConversations, downtown!.id, parentId)!
  );
  assert.ok(
    seedThreadBase >= 1,
    "downtown seed should include at least one thread reply for demo"
  );
  const threadReply = makeTeamMessage({
    conversationId: downtown!.id,
    body: "Thread reply: staged north of pick radius.",
    id: "test-thread-1",
    createdAt: "2026-07-24T19:00:00Z",
  });
  const withThread = appendThreadReply(
    initialConversations,
    downtown!.id,
    parentId,
    threadReply
  );
  const parentAfter = getMessage(withThread, downtown!.id, parentId)!;
  assert.equal(threadReplyCount(parentAfter), seedThreadBase + 1);
  assert.ok(
    parentAfter.threadReplies!.some((r) => r.body.includes("staged north")),
    "appended thread reply must be present"
  );
  // seed unchanged
  assert.equal(
    threadReplyCount(getMessage(initialConversations, downtown!.id, parentId)!),
    seedThreadBase
  );

  const viaHelper = replyInThread(
    initialConversations,
    downtown!.id,
    parentId,
    "Via replyInThread helper"
  );
  assert.ok(viaHelper);
  assert.equal(
    threadReplyCount(
      getMessage(viaHelper!.conversations, downtown!.id, parentId)!
    ),
    seedThreadBase + 1
  );
  assert.equal(viaHelper!.reply.body, "Via replyInThread helper");

  // --- attachments ---
  const att = makeMockAttachment({ name: "pour-plan.pdf", sizeLabel: "88 KB" });
  const withAtt = sendTeamMessage(initialConversations, downtown!.id, "See plan", {
    attachments: [att],
    messageId: "test-att-msg",
  });
  assert.ok(withAtt);
  const attMsg = getMessage(
    withAtt!.conversations,
    downtown!.id,
    "test-att-msg"
  )!;
  assert.ok(attMsg.attachments);
  assert.equal(attMsg.attachments!.length, 1);
  assert.equal(attMsg.attachments![0]!.name, "pour-plan.pdf");
  assert.equal(attMsg.attachments![0]!.sizeLabel, "88 KB");

  // attach-only send
  const attachOnly = sendTeamMessage(initialConversations, downtown!.id, "  ", {
    attachments: [makeMockAttachment({ name: "photo.png" })],
    messageId: "test-att-only",
  });
  assert.ok(attachOnly);
  assert.equal(
    getMessage(attachOnly!.conversations, downtown!.id, "test-att-only")!
      .attachments![0]!.name,
    "photo.png"
  );

  console.log("verify-messaging: all assertions passed");
  console.log(
    `  channels=${channels.length} dms=${dms.length} unread=${totalUnread(initialConversations)}`
  );
  console.log(
    `  magnusCatchUpChars=${withBot!.magnusMessage!.body.length} default=${DEFAULT_CONVERSATION_ID}`
  );
  console.log(
    `  reactionsOk emoji=${reactedMsg.reactions?.find((r) => r.emoji === "🚀")?.count ?? 0}`
  );
  console.log(
    `  threadReplies=${threadReplyCount(parentAfter)} attachName=${attMsg.attachments![0]!.name}`
  );
  console.log(
    `  identity: dmPeers=${dms.length} channelImages=${imaged.length} hashOnly=${hashOnly!.name} purposes=${[...purposes].sort().join(",")}`
  );
  for (const dm of dms) {
    const p = resolveDmPeer(dm, peopleDirectory)!;
    console.log(
      `  dm ${dm.id} → ${p.name} avatar=${p.avatarUrl ? "yes" : "no"} initials=${p.initials}`
    );
  }
}

main();
