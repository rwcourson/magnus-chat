/**
 * Gating tests for Magnus session intro helpers.
 * Run: npx tsx scripts/verify-intro.ts
 *
 * Product rule: intro shows on full page load when preference is enabled.
 * In-session dismiss is memory-only; opt-out persists via localStorage.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  INTRO_ENABLED_KEY,
  INTRO_SVG_PATH,
  createIntroGate,
  introDurationMs,
  isIntroEnabled,
  markIntroSeen,
  resetIntroForTests,
  setIntroEnabled,
  shouldShowIntro,
} from "../src/lib/intro";

function main() {
  // --- pure gate (new instance ≈ new document load / refresh) ---
  const load1 = createIntroGate();
  assert.equal(load1.shouldShow(), true, "fresh page load shows intro");
  load1.markSeen();
  assert.equal(
    load1.shouldShow(),
    false,
    "after dismiss on same load, hide intro"
  );

  // Simulate hard refresh: brand-new gate (module re-init / new document)
  const load2 = createIntroGate();
  assert.equal(
    load2.shouldShow(),
    true,
    "full page refresh (new load) must show intro again"
  );
  load2.markSeen();
  assert.equal(load2.shouldShow(), false);

  // Independent loads do not share state
  const load3 = createIntroGate();
  assert.equal(load3.shouldShow(), true, "third refresh still shows intro");

  // Preference off → never show
  const loadOff = createIntroGate({ enabled: false });
  assert.equal(
    loadOff.shouldShow(),
    false,
    "disabled preference never shows intro"
  );

  // --- module-level document gate (same as production) ---
  // Ensure preference on for module gate tests (node has no real storage)
  resetIntroForTests();
  // In node, isIntroEnabled defaults true (no window / no stored off)
  assert.equal(isIntroEnabled(), true, "default intro enabled in node");
  assert.equal(shouldShowIntro(), true, "module gate starts open");
  markIntroSeen();
  assert.equal(shouldShowIntro(), false, "module gate closed after mark");
  // Refresh simulation
  resetIntroForTests();
  assert.equal(
    shouldShowIntro(),
    true,
    "after resetIntroForTests (≈ reload), intro shows again"
  );

  // Durations
  assert.ok(introDurationMs(true) < introDurationMs(false));
  assert.ok(introDurationMs(false) >= 2000);

  // Asset (kept for brand parity / optional external use)
  assert.equal(INTRO_SVG_PATH, "/brand/magnus-intro.svg");
  assert.equal(INTRO_ENABLED_KEY, "magnus-intro-enabled");
  const svgPath = join(process.cwd(), "public", "brand", "magnus-intro.svg");
  assert.ok(existsSync(svgPath), "SVG must exist under public/brand");
  const svg = readFileSync(svgPath, "utf8");
  assert.ok(svg.includes("outlineFill"), "intro SVG has animation");
  assert.ok(
    /animation:\s*outlineFill[^;]*forwards/.test(svg),
    "intro SVG animation should end with forwards (one-shot)"
  );
  assert.ok(
    !/animation:[^;]*\binfinite\b/.test(svg),
    "intro SVG animation must not loop infinitely"
  );

  // Preference helpers exist (setIntroEnabled is a no-op without window storage)
  setIntroEnabled(true);
  setIntroEnabled(false);
  setIntroEnabled(true);

  // Component: no Skip button
  const introUi = readFileSync(
    join(process.cwd(), "src/components/brand/MagnusIntro.tsx"),
    "utf8"
  );
  assert.ok(
    !/data-magnus-intro-skip/.test(introUi) && !/>\s*Skip\s*</.test(introUi),
    "Skip control removed from intro UI"
  );
  assert.ok(
    /useTheme|data-theme/.test(introUi),
    "intro should be theme-aware"
  );

  console.log("verify-intro: all assertions passed");
  console.log(
    `  path=${INTRO_SVG_PATH} reducedMs=${introDurationMs(true)} prefKey=${INTRO_ENABLED_KEY}`
  );
}

main();
