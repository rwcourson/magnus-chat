/**
 * Durable multi-kind activity inbox helpers + notifications wiring.
 * Run: npx tsx scripts/verify-activity-inbox.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  activityDeepLinks,
  activityItems,
  activityKindsPresent,
  markActivityRead,
  markAllActivityRead,
  unreadActivityCount,
} from "../src/lib/activity-data";

const root = join(__dirname, "..");

function main() {
  assert.ok(activityItems.length >= 6, "expected a rich activity seed");

  const kinds = activityKindsPresent(activityItems);
  const requiredKinds = ["approval", "routine", "knowledge", "news"] as const;
  for (const k of requiredKinds) {
    assert.ok(
      kinds.includes(k),
      `activity inbox must include kind ${k} (got ${kinds.join(",")})`
    );
  }
  // Social / feed-adjacent too
  assert.ok(
    kinds.some((k) =>
      ["feed", "comment", "like", "mention"].includes(k)
    ),
    "must mix social/feed kinds with work kinds"
  );

  const initialUnread = unreadActivityCount(activityItems);
  assert.ok(initialUnread >= 2, "seed should have unread items");

  const one = activityItems.find((i) => !i.read);
  assert.ok(one, "need an unread item");
  const afterOne = markActivityRead(activityItems, one!.id);
  assert.equal(
    unreadActivityCount(afterOne),
    initialUnread - 1,
    "mark one read decrements unread"
  );
  assert.ok(
    afterOne.find((i) => i.id === one!.id)?.read === true,
    "target item marked read"
  );
  // Original seed unchanged (pure)
  assert.equal(
    unreadActivityCount(activityItems),
    initialUnread,
    "markActivityRead must not mutate seed"
  );

  const allRead = markAllActivityRead(activityItems);
  assert.equal(
    unreadActivityCount(allRead),
    0,
    "mark all read leaves zero unread"
  );
  assert.ok(
    allRead.every((i) => i.read),
    "every item read after mark all"
  );

  const links = activityDeepLinks(activityItems);
  assert.ok(links.length >= 5, "deep links present");
  for (const href of links) {
    assert.ok(href.startsWith("/"), `href must be app-relative: ${href}`);
  }
  assert.ok(
    links.some((h) => h.includes("approvals")),
    "approval deep link"
  );
  assert.ok(
    links.some((h) => h.includes("workspaces") || h.includes("knowledge")),
    "workspace or knowledge deep link"
  );

  // Notifications route + view contract
  const pagePath = join(root, "src/app/notifications/page.tsx");
  const viewPath = join(root, "src/components/social/NotificationsView.tsx");
  assert.ok(existsSync(pagePath));
  assert.ok(existsSync(viewPath));
  const pageSrc = readFileSync(pagePath, "utf8");
  assert.ok(
    pageSrc.includes("NotificationsView") && !pageSrc.includes("Coming soon"),
    "notifications page renders inbox view"
  );
  const viewSrc = readFileSync(viewPath, "utf8");
  assert.ok(
    viewSrc.includes("activity-data") || viewSrc.includes("activityItems"),
    "view uses activity data module"
  );
  assert.ok(
    viewSrc.includes("markAllActivityRead") ||
      viewSrc.includes("markAllRead"),
    "mark all read wired"
  );
  assert.ok(
    viewSrc.includes("data-activity-inbox") ||
      viewSrc.includes("data-activity-list"),
    "inbox DOM contract"
  );

  console.log("verify-activity-inbox: all assertions passed");
  console.log(
    `  items=${activityItems.length} kinds=${kinds.join(",")} unread=${initialUnread}`
  );
}

main();
