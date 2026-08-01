/**
 * Gating tests for first-run show-me-around tour.
 * Run: npx tsx scripts/verify-onboarding-tour.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  ONBOARDING_TOUR_KEY,
  ONBOARDING_TOUR_POST_INTRO_DELAY_MS,
  ONBOARDING_TOUR_START_EVENT,
  createOnboardingTourGate,
  markOnboardingTourDone,
  onboardingTourPostIntroDelayMs,
  readOnboardingTourStatus,
  resetOnboardingTour,
  shouldShowOnboardingTour,
} from "../src/lib/onboarding-tour";
import {
  TOUR_STEPS,
  buildTourVeilMask,
  clampRectToViewport,
  clampTourStepIndex,
  getTourSteps,
  padRectInViewport,
  pickTourCardPosition,
  tourStepCount,
} from "../src/components/onboarding/tour-steps";

function main() {
  // --- pure gate ---
  const g = createOnboardingTourGate();
  assert.equal(g.shouldShow(), true, "fresh user sees tour");
  assert.equal(g.status(), "pending");
  g.markDone("completed");
  assert.equal(g.shouldShow(), false, "completed hides tour");
  assert.equal(g.status(), "completed");

  const g2 = createOnboardingTourGate();
  g2.markDone("skipped");
  assert.equal(g2.shouldShow(), false, "skipped hides tour");
  assert.equal(g2.status(), "skipped");
  g2.reset();
  assert.equal(g2.shouldShow(), true, "reset shows tour again");

  resetOnboardingTour();
  assert.equal(shouldShowOnboardingTour(), true, "default pending in node");
  assert.equal(readOnboardingTourStatus(), "pending");
  markOnboardingTourDone("completed");
  assert.equal(shouldShowOnboardingTour(), true);

  assert.equal(ONBOARDING_TOUR_KEY, "magnus-onboarding-tour-v1");
  assert.equal(ONBOARDING_TOUR_START_EVENT, "magnus-onboarding-tour-start");
  assert.ok(
    onboardingTourPostIntroDelayMs(true) <
      onboardingTourPostIntroDelayMs(false)
  );
  assert.ok(
    ONBOARDING_TOUR_POST_INTRO_DELAY_MS <= 200,
    "post-intro delay should be short for fluid handoff"
  );
  assert.ok(ONBOARDING_TOUR_POST_INTRO_DELAY_MS >= 40);

  // --- steps: ≤6, no search, messages + feed, chat mode not home composer ---
  const steps = getTourSteps();
  assert.equal(steps.length, tourStepCount());
  assert.ok(steps.length >= 5 && steps.length <= 6, "5–6 stops");
  assert.ok(
    !steps.some(
      (s) =>
        /search/i.test(s.id) ||
        /search/i.test(s.title) ||
        /⌘|cmd-?k|command palette/i.test(s.body)
    ),
    "tour must not include a search / command-palette stop"
  );
  const ids = steps.map((s) => s.id);
  assert.ok(ids.includes("messages"), "includes Messages");
  assert.ok(ids.includes("feed"), "includes Feed");
  assert.ok(ids.includes("home"), "includes Home");
  assert.ok(ids.includes("catch-me-up"), "includes Catch me up");
  assert.ok(ids.includes("chat-mode"), "includes Chat mode (Ask Magnus)");

  // Ask Magnus = Home/Chat mode switch — NOT bottom home composer
  const chatMode = steps.find((s) => s.id === "chat-mode");
  assert.ok(chatMode);
  assert.equal(chatMode!.selector, "[data-sidebar-top-mode]");
  assert.equal(chatMode!.onAdvance, "new-chat");
  assert.ok(
    !steps.some((s) => s.selector === "[data-home-ask-magnus]"),
    "must not highlight bottom home Ask Magnus composer"
  );

  // Messages + Feed before chat-mode so home nav still exists
  assert.ok(
    ids.indexOf("messages") < ids.indexOf("chat-mode"),
    "Messages before Chat mode"
  );
  assert.ok(
    ids.indexOf("feed") < ids.indexOf("chat-mode"),
    "Feed before Chat mode"
  );

  assert.equal(steps.find((s) => s.id === "home")?.selector, "[data-tour-home]");
  assert.equal(
    steps.find((s) => s.id === "catch-me-up")?.selector,
    "[data-catch-me-up]"
  );
  assert.equal(
    steps.find((s) => s.id === "messages")?.selector,
    "[data-sidebar-top-mode]"
  );
  assert.equal(
    steps.find((s) => s.id === "feed")?.selector,
    '[data-tour-target="feed"]'
  );

  assert.equal(clampTourStepIndex(-1, 5), 0);
  assert.equal(clampTourStepIndex(99, 5), 4);
  assert.equal(clampTourStepIndex(2, 5), 2);

  // Viewport clamp — never leave rect outside
  const off = clampRectToViewport(
    { top: -40, left: -20, width: 200, height: 80 },
    { width: 1000, height: 800 }
  );
  assert.ok(off.top >= 0 && off.left >= 0);
  assert.ok(off.top + off.height <= 800);
  assert.ok(off.left + off.width <= 1000);

  const overflow = clampRectToViewport(
    { top: 750, left: 900, width: 200, height: 100 },
    { width: 1000, height: 800 }
  );
  assert.ok(overflow.left + overflow.width <= 1000 + 0.01);
  assert.ok(overflow.top + overflow.height <= 800 + 0.01);

  // Edge inset + pad — sidebar-style target near left must not go off-screen
  const nearLeft = padRectInViewport(
    { top: 200, left: 8, width: 240, height: 36 },
    12,
    { width: 1280, height: 800 },
    10
  );
  assert.ok(nearLeft.left >= 10, "spotlight stays inset from left edge");
  assert.ok(nearLeft.top >= 10);
  assert.ok(nearLeft.left + nearLeft.width <= 1280 - 10);

  const pos = pickTourCardPosition({
    target: { top: 80, left: 20, width: 200, height: 40 },
    card: { width: 300, height: 160 },
    viewport: { width: 1280, height: 800 },
    placement: "right",
  });
  assert.ok(pos.left > 20, "card to the right of sidebar target");
  assert.ok(pos.top >= 0 && pos.left >= 0);

  // --- structural: shipped wiring ---
  const root = process.cwd();
  const libPath = join(root, "src/lib/onboarding-tour.ts");
  const tourUi = join(root, "src/components/onboarding/OnboardingTour.tsx");
  const stepsPath = join(root, "src/components/onboarding/tour-steps.ts");
  assert.ok(existsSync(libPath));
  assert.ok(existsSync(tourUi));
  assert.ok(existsSync(stepsPath));

  const layout = readFileSync(join(root, "src/app/layout.tsx"), "utf8");
  assert.ok(/OnboardingTour/.test(layout));
  assert.ok(/MagnusIntro/.test(layout));

  const home = readFileSync(
    join(root, "src/components/home/HomeLanding.tsx"),
    "utf8"
  );
  assert.ok(/data-tour-home/.test(home));
  assert.ok(/data-catch-me-up/.test(home));

  const sidebar = readFileSync(
    join(root, "src/components/layout/Sidebar.tsx"),
    "utf8"
  );
  assert.ok(/data-tour-target/.test(sidebar));
  assert.ok(/data-sidebar-top-mode/.test(sidebar));

  const settings = readFileSync(
    join(root, "src/components/settings/SettingsView.tsx"),
    "utf8"
  );
  assert.ok(
    /requestOnboardingTourReplay|data-replay-onboarding-tour/.test(settings)
  );

  const tourSrc = readFileSync(tourUi, "utf8");
  assert.ok(/data-onboarding-tour/.test(tourSrc));
  assert.ok(/data-onboarding-skip/.test(tourSrc));
  assert.ok(/Skip tour/.test(tourSrc));
  assert.ok(!/data-onboarding-dismiss/.test(tourSrc));
  assert.ok(/backdrop-blur/.test(tourSrc));
  assert.ok(/padRectInViewport/.test(tourSrc));
  assert.ok(/buildTourVeilMask/.test(tourSrc));
  assert.ok(
    /backdrop-blur-\[5px\]|backdrop-blur-\[6px\]/.test(tourSrc),
    "veil blur stays light so context remains visible"
  );
  assert.ok(
    !/SpotlightBlurHole/.test(tourSrc),
    "four-panel SpotlightBlurHole removed"
  );

  // Rounded mask hole (no harsh rect corners)
  const mask = buildTourVeilMask({
    spot: { top: 100, left: 20, width: 200, height: 40 },
    viewport: { width: 1280, height: 800 },
    radius: 16,
  });
  assert.ok(mask.startsWith('url("data:image/svg+xml,'));
  assert.ok(mask.includes("evenodd") || mask.includes("fill-rule"));
  assert.ok(mask.includes("A16") || mask.includes("A16%20") || /A16/.test(decodeURIComponent(mask)));
  assert.ok(/newChat/.test(tourSrc), "tour opens chat via newChat");
  assert.ok(/onAdvance/.test(tourSrc) || /runAdvanceAction/.test(tourSrc));

  assert.ok(
    !/data-home-ask-magnus/.test(readFileSync(stepsPath, "utf8")),
    "step config must not target home composer"
  );

  const introUi = readFileSync(
    join(root, "src/components/brand/MagnusIntro.tsx"),
    "utf8"
  );
  assert.ok(/MAGNUS_INTRO_DISMISS_EVENT/.test(introUi));

  const gateSrc = readFileSync(libPath, "utf8");
  assert.ok(/magnus-intro-pending/.test(gateSrc));
  // Must block while logo node is still mounted (boot cover clears early)
  assert.ok(
    /data-magnus-intro/.test(gateSrc),
    "blocking check must include live intro node"
  );
  assert.ok(/isMagnusIntroBlocking/.test(gateSrc));

  assert.equal(TOUR_STEPS.length, 5);

  const tourSrcGate = readFileSync(tourUi, "utf8");
  assert.ok(
    /isMagnusIntroBlocking/.test(tourSrcGate),
    "tour waits until intro is not covering the shell"
  );

  console.log("verify-onboarding-tour: all assertions passed");
  console.log(
    `  steps=${ids.join(" → ")} key=${ONBOARDING_TOUR_KEY} delayMs=${onboardingTourPostIntroDelayMs(false)}`
  );
}

main();
