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
  visibleHomeNav,
} from "../src/lib/sidebar-prefs";

function main() {
  const d = DEFAULT_SIDEBAR_PREFS;
  assert.ok(d.homeOrder.includes("home"));
  assert.ok(d.homeOrder.includes("feed"));
  assert.equal(d.homeVisible.home, true);
  // Notifications are header-only — excluded from sidebar visible list
  assert.equal(
    visibleHomeNav(d).length,
    d.homeOrder.filter((id) => id !== "notifications").length
  );
  assert.ok(!visibleHomeNav(d).includes("notifications"));

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

  // Reorder
  const moved = moveInOrder(["a", "b", "c"], "b", -1);
  assert.deepEqual(moved, ["b", "a", "c"]);
  const movedDown = moveInOrder(["a", "b", "c"], "a", 1);
  assert.deepEqual(movedDown, ["b", "a", "c"]);
  assert.deepEqual(moveInOrder(["a", "b"], "a", -1), ["a", "b"]);

  // Chat visibility
  assert.equal(isChatSectionVisible(d, "channels"), true);
  const noCh = normalizeSidebarPrefs({
    chatVisible: { ...d.chatVisible, channels: false },
  });
  assert.equal(isChatSectionVisible(noCh, "channels"), false);
  assert.equal(isChatSectionVisible(noCh, "dms"), true);

  // Unknown ids stripped / filled
  const messy = normalizeSidebarPrefs({
    homeOrder: ["feed", "nope" as never, "people"],
    chatOrder: ["dms"],
  });
  assert.ok(messy.homeOrder.includes("home"));
  assert.ok(messy.homeOrder.includes("feed"));
  assert.ok(messy.chatOrder.includes("magnusChat"));
  assert.ok(messy.chatOrder.includes("channels"));

  console.log("verify-sidebar-prefs: all assertions passed");
  console.log(
    `  homeItems=${visibleHomeNav(d).length} chatSections=${d.chatOrder.length}`
  );
}

main();
