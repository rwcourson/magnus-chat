/**
 * Gating tests for sidebar customization prefs.
 * Run: npx tsx scripts/verify-sidebar-prefs.ts
 */
import assert from "node:assert/strict";
import {
  DEFAULT_SIDEBAR_PREFS,
  isChatSectionVisible,
  moveInOrder,
  normalizeSidebarPrefs,
  visibleChatToolLinks,
  visibleHomeNav,
} from "../src/lib/sidebar-prefs";

function main() {
  const d = DEFAULT_SIDEBAR_PREFS;
  assert.ok(d.homeOrder.includes("home"));
  assert.ok(d.homeOrder.includes("feed"));
  assert.ok(d.homeOrder.includes("workspaces"));
  assert.ok(!d.homeOrder.includes("messages" as never));
  assert.ok(!d.homeOrder.includes("approvals" as never));
  assert.equal(d.homeVisible.home, true);
  // Notifications are header-only — excluded from sidebar visible list
  assert.equal(
    visibleHomeNav(d).length,
    d.homeOrder.filter((id) => id !== "notifications").length
  );
  assert.ok(!visibleHomeNav(d).includes("notifications"));
  assert.ok(visibleHomeNav(d).includes("workspaces"));
  assert.ok(!visibleHomeNav(d).includes("approvals" as never));

  // Hide feed
  const hiddenFeed = normalizeSidebarPrefs({
    homeVisible: { ...d.homeVisible, feed: false },
  });
  assert.ok(!visibleHomeNav(hiddenFeed).includes("feed"));
  assert.ok(visibleHomeNav(hiddenFeed).includes("home"));

  // Cannot hide home via normalize
  const tryHideHome = normalizeSidebarPrefs({
    homeVisible: { ...d.homeVisible, home: false },
  });
  assert.equal(tryHideHome.homeVisible.home, true);
  assert.ok(visibleHomeNav(tryHideHome).includes("home"));

  // Legacy knowledge → workspaces
  const legacy = normalizeSidebarPrefs({
    homeOrder: ["home", "knowledge" as never, "people"],
    homeVisible: { knowledge: false } as never,
  });
  assert.ok(legacy.homeOrder.includes("workspaces"));
  assert.equal(legacy.homeVisible.workspaces, false);

  // Reorder
  const moved = moveInOrder(["a", "b", "c"], "b", -1);
  assert.deepEqual(moved, ["b", "a", "c"]);
  const movedDown = moveInOrder(["a", "b", "c"], "a", 1);
  assert.deepEqual(movedDown, ["b", "a", "c"]);
  assert.deepEqual(moveInOrder(["a", "b"], "a", -1), ["a", "b"]);

  // Chat sections — Magnus-centric
  assert.equal(isChatSectionVisible(d, "history"), true);
  assert.equal(isChatSectionVisible(d, "skills"), true);
  assert.equal(isChatSectionVisible(d, "workspaces"), true);
  assert.equal(isChatSectionVisible(d, "integrations"), false);

  const noHist = normalizeSidebarPrefs({
    chatVisible: { ...d.chatVisible, history: false },
  });
  assert.equal(isChatSectionVisible(noHist, "history"), false);
  assert.equal(isChatSectionVisible(noHist, "skills"), true);

  const tools = visibleChatToolLinks(d);
  assert.ok(tools.some((t) => t.id === "skills"));
  assert.ok(tools.some((t) => t.id === "routines"));
  assert.ok(tools.some((t) => t.id === "workspaces"));
  assert.ok(!tools.some((t) => t.id === "integrations"));
  assert.ok(!tools.some((t) => t.id === "history"));
  assert.ok(!tools.some((t) => t.id === "magnusChat"));

  // Unknown ids stripped / filled
  const messy = normalizeSidebarPrefs({
    homeOrder: ["feed", "nope" as never, "people"],
    chatOrder: ["skills"],
  });
  assert.ok(messy.homeOrder.includes("home"));
  assert.ok(messy.homeOrder.includes("feed"));
  assert.ok(messy.chatOrder.includes("magnusChat"));
  assert.ok(messy.chatOrder.includes("history"));
  assert.ok(messy.chatOrder.includes("skills"));
  assert.ok(messy.chatOrder.includes("workspaces"));

  console.log("verify-sidebar-prefs: all assertions passed");
  console.log(
    `  homeItems=${visibleHomeNav(d).length} chatSections=${d.chatOrder.length} tools=${tools.length}`
  );
}

main();
