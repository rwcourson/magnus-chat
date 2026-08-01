/**
 * Thin transcript IA: auto-sourced Live, apps/resources catalogs, person→private chat.
 * Run: npx tsx scripts/verify-transcript-ia.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildAutoSourcedFeedPosts,
  feedPostFromNewsStory,
  isAutoSourcedPost,
} from "../src/lib/feed-auto-source";
import { feedPosts } from "../src/lib/feed-data";
import { newsStories } from "../src/lib/home-data";
import {
  employeeResourcesCatalog,
  magnusAppsCatalog,
  validAppHrefs,
  validResourceHrefs,
} from "../src/lib/magnus-apps";
import {
  buildPrivateChatWithPerson,
  ensurePrivateChatWithPerson,
  personChatId,
} from "../src/lib/person-chat";
import { peopleDirectory } from "../src/lib/people-data";
import { isValidFeedPost } from "../src/lib/feed";

const root = join(__dirname, "..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

function main() {
  // --- Auto-sourced feed ---
  const auto = buildAutoSourcedFeedPosts();
  assert.ok(auto.length >= 2, "auto builder yields ≥2 posts");
  const nonOrganic = auto.filter(isAutoSourcedPost);
  assert.ok(
    nonOrganic.length >= 2,
    "auto posts must have non-organic sourceKind"
  );
  for (const p of auto) {
    assert.ok(isValidFeedPost(p), `auto post ${p.id} valid`);
    assert.ok(
      p.sourceKind && p.sourceKind !== "organic",
      `${p.id} sourceKind`
    );
    assert.ok(p.sourceLabel, `${p.id} sourceLabel`);
  }
  // Known seed titles from home news
  const seedTitle = newsStories[0]!.title;
  const fromKnown = feedPostFromNewsStory(newsStories[0]!);
  assert.ok(
    fromKnown.headline === seedTitle || fromKnown.body.includes(seedTitle.slice(0, 12)),
    "news story title flows into auto post"
  );
  assert.equal(fromKnown.sourceKind, "news");

  // Merged into shipped feedPosts
  const liveAuto = feedPosts.filter(isAutoSourcedPost);
  assert.ok(
    liveAuto.length >= 2,
    `feedPosts must include auto-sourced items (got ${liveAuto.length})`
  );
  assert.ok(
    liveAuto.some((p) => p.sourceKind === "news"),
    "Live includes news-sourced posts"
  );
  assert.ok(
    liveAuto.some(
      (p) => p.sourceKind === "marketing" || p.sourceKind === "system"
    ),
    "Live includes marketing or system auto posts"
  );

  // --- Apps + resources catalogs ---
  assert.ok(magnusAppsCatalog.length >= 3);
  assert.ok(validAppHrefs(), "apps have valid internal hrefs");
  assert.ok(employeeResourcesCatalog.length >= 3);
  assert.ok(validResourceHrefs(), "resources have valid hrefs");
  for (const a of magnusAppsCatalog) {
    assert.ok(a.href.startsWith("/"), a.id);
  }

  // --- Person → private chat ---
  const person = peopleDirectory[0]!;
  const built = buildPrivateChatWithPerson(person);
  assert.equal(built.id, personChatId(person.id));
  assert.equal(built.private, true);
  assert.ok(built.title.includes(person.name) || built.title === person.name);
  assert.ok(built.messages.length >= 1);

  const first = ensurePrivateChatWithPerson([], person);
  assert.equal(first.created, true);
  const second = ensurePrivateChatWithPerson([first.chat], person);
  assert.equal(second.created, false);
  assert.equal(second.chat.id, first.chat.id);

  // --- Structural: home roles, profile message, apps routes ---
  const home = read("src/components/home/HomeLanding.tsx");
  assert.ok(
    home.includes("Official news") ||
      home.includes("official news") ||
      home.includes("Official company"),
    "home copy distinguishes official news"
  );
  assert.ok(
    home.includes("/apps") && home.includes("/resources"),
    "home links apps + resources"
  );
  assert.ok(
    !home.includes("Coming soon"),
    "home not placeholder"
  );

  const carousel = read("src/components/home/NewsCarousel.tsx");
  assert.ok(
    /Official company news|data-official-news/.test(carousel),
    "carousel labeled official news"
  );

  const strip = read("src/components/chat/RecentPostsStrip.tsx");
  assert.ok(
    /B&G Live|Live conversation/.test(strip),
    "strip explicitly Live (not unlabeled dual news)"
  );

  const profile = read("src/components/social/PersonProfileView.tsx");
  assert.ok(
    profile.includes("openPersonChat"),
    "profile Message uses private-chat path"
  );
  assert.ok(
    !profile.includes("Draft a quick Teams note") ||
      profile.includes("openPersonChat"),
    "primary message is not draft-only"
  );

  for (const route of ["apps", "resources"]) {
    const page = join(root, `src/app/${route}/page.tsx`);
    assert.ok(existsSync(page), `${route} page exists`);
    const src = read(`src/app/${route}/page.tsx`);
    assert.ok(
      !src.includes("Coming soon") && !src.includes("PlaceholderPage"),
      `${route} not Coming soon`
    );
  }

  const ctx = read("src/context/ChatContext.tsx");
  assert.ok(
    ctx.includes("openPersonChat") && ctx.includes("ensurePrivateChatWithPerson"),
    "ChatContext wires person private chat"
  );

  const card = read("src/components/feed/FeedPostCard.tsx");
  assert.ok(
    card.includes("sourceKind") || card.includes("data-feed-source"),
    "feed card surfaces auto-source kind"
  );

  console.log("verify-transcript-ia: all assertions passed");
  console.log(
    `  auto=${auto.length} liveAuto=${liveAuto.length} apps=${magnusAppsCatalog.length} resources=${employeeResourcesCatalog.length} personChat=${built.id}`
  );
}

main();
