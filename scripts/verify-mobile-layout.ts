/**
 * Mobile layout safety — pure positioning + structural source gates.
 * Viewport fixture: 390×844 (iPhone-class CSS px).
 *
 * Run: npx tsx scripts/verify-mobile-layout.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  computeMenuPosition,
  MENU_EDGE,
  MENU_MIN_USABLE,
} from "../src/lib/menu-position";

const root = process.cwd();
const VW = 390;
const VH = 844;

function read(rel: string): string {
  const p = join(root, rel);
  assert.ok(existsSync(p), `missing source ${rel}`);
  return readFileSync(p, "utf8");
}

function main() {
  // ── Pure positioning @ 390×844 ──
  // Composer-like trigger near bottom center (typical chat dock)
  const trigger = {
    top: VH - 120,
    bottom: VH - 80,
    left: 24,
    right: 64,
    width: 40,
    height: 40,
  };

  const above = computeMenuPosition({
    rect: trigger,
    viewportWidth: VW,
    viewportHeight: VH,
    align: "left",
    gap: 10,
    menuWidth: 220,
    estimatedHeight: 260,
    prefer: "above",
  });

  assert.equal(above.placement, "above", "prefer above when spaceAbove is large");
  assert.ok(
    above.left >= MENU_EDGE,
    `left >= EDGE (${above.left})`
  );
  assert.ok(
    above.left + 220 <= VW - MENU_EDGE || above.left <= VW - MENU_EDGE,
    `left clamped for viewport (${above.left})`
  );
  assert.ok(
    above.left <= VW - MENU_EDGE - 1,
    "left not past right edge"
  );
  // maxHeight must not exceed available space above trigger
  const spaceAbove = Math.max(0, trigger.top - 10 - MENU_EDGE);
  assert.ok(
    above.maxHeight <= spaceAbove + 0.5,
    `maxHeight (${above.maxHeight}) must be ≤ available above (${spaceAbove})`
  );
  assert.ok(
    above.maxHeight >= Math.min(MENU_MIN_USABLE, spaceAbove) ||
      above.maxHeight >= 72,
    "maxHeight has usable floor when space allows"
  );
  assert.ok(above.bottom != null && above.top == null, "above uses bottom offset");

  // Composer menus: prefer "above" is strict — never open under the field
  const shortAbove = computeMenuPosition({
    rect: { ...trigger, top: 100, bottom: 140 },
    viewportWidth: VW,
    viewportHeight: VH,
    prefer: "above",
    menuWidth: 220,
    estimatedHeight: 400,
    gap: 10,
  });
  assert.equal(shortAbove.placement, "above", "prefer above is always above");
  assert.ok(shortAbove.bottom != null && shortAbove.top == null);

  // Mid-screen welcome composer: attach must still open up (not into chips below)
  const midScreen = computeMenuPosition({
    rect: {
      top: VH / 2,
      bottom: VH / 2 + 36,
      left: 80,
      right: 116,
      width: 36,
      height: 36,
    },
    viewportWidth: VW,
    viewportHeight: VH,
    prefer: "above",
    align: "left",
    menuWidth: 220,
    estimatedHeight: 280,
    gap: 10,
  });
  assert.equal(midScreen.placement, "above", "mid-screen + menu opens up");
  assert.ok(midScreen.bottom != null, "uses bottom anchor when above");

  // Even near top of screen, force above (scroll inside menu)
  const nearTop = computeMenuPosition({
    rect: { top: 20, bottom: 56, left: 24, right: 64, width: 40, height: 36 },
    viewportWidth: VW,
    viewportHeight: VH,
    prefer: "above",
    menuWidth: 220,
    estimatedHeight: 260,
    gap: 10,
  });
  assert.equal(nearTop.placement, "above", "prefer above never flips below");

  // Right-aligned model menu near right edge must clamp left
  const rightTrigger = {
    top: VH - 110,
    bottom: VH - 74,
    left: VW - 48,
    right: VW - 12,
    width: 36,
    height: 36,
  };
  const modelMenu = computeMenuPosition({
    rect: rightTrigger,
    viewportWidth: VW,
    viewportHeight: VH,
    align: "right",
    menuWidth: 248,
    estimatedHeight: 300,
    prefer: "above",
    gap: 10,
  });
  assert.ok(modelMenu.left >= MENU_EDGE, "right-align still clamps left ≥ EDGE");
  assert.ok(
    modelMenu.left + Math.min(248, VW - MENU_EDGE * 2) <= VW - MENU_EDGE + 1,
    "menu does not extend past right EDGE"
  );

  // Narrow viewport: menu width effectively shrinks for clamp math
  const tiny = computeMenuPosition({
    rect: { top: 400, bottom: 440, left: 10, right: 50, width: 40, height: 40 },
    viewportWidth: 320,
    viewportHeight: VH,
    menuWidth: 280,
    prefer: "above",
  });
  assert.ok(tiny.left >= MENU_EDGE);
  assert.ok(tiny.left <= 320 - MENU_EDGE);

  // Preferred above wins when spaceAbove ≥ min usable
  const roomy = computeMenuPosition({
    rect: { top: 400, bottom: 440, left: 40, right: 80, width: 40, height: 40 },
    viewportWidth: VW,
    viewportHeight: VH,
    prefer: "above",
    estimatedHeight: 200,
  });
  assert.equal(roomy.placement, "above");
  assert.ok(roomy.maxHeight >= MENU_MIN_USABLE || roomy.maxHeight >= 200 - 1);

  // ── Structural: desktop chrome preserved, mobile gates present ──
  const appShell = read("src/components/layout/AppShell.tsx");
  assert.ok(
    appShell.includes("md:hidden"),
    "AppShell mobile header must be md:hidden"
  );
  assert.ok(
    /safe-area-inset-top/.test(appShell),
    "mobile header respects safe-area-inset-top"
  );

  const sidebar = read("src/components/layout/Sidebar.tsx");
  assert.ok(
    /hidden h-full shrink-0 md:block|hidden.*md:block/.test(sidebar),
    "desktop sidebar remains hidden md:block"
  );
  assert.ok(
    sidebar.includes("md:hidden") && sidebar.includes("fixed inset-y-0 left-0"),
    "mobile drawer remains fixed + md:hidden"
  );

  const chatView = read("src/components/chat/ChatView.tsx");
  assert.ok(
    /safe-area-inset-bottom/.test(chatView),
    "ChatView composer dock uses safe-area-inset-bottom"
  );

  const messaging = read("src/components/messaging/MessagingView.tsx");
  assert.ok(
    /safe-area-inset-bottom/.test(messaging),
    "MessagingView composer dock uses safe-area-inset-bottom"
  );

  const layout = read("src/app/layout.tsx");
  assert.ok(
    /viewportFit:\s*["']cover["']/.test(layout) ||
      layout.includes('viewportFit: "cover"'),
    "root layout exports viewportFit cover for iOS safe-area"
  );

  // Portal menus clamp width on narrow screens
  const attach = read("src/components/chat/AttachMenu.tsx");
  assert.ok(
    /min\(220px|100vw/.test(attach),
    "AttachMenu width uses min(…, 100vw…) clamp"
  );
  const model = read("src/components/chat/ModelSelector.tsx");
  assert.ok(
    /min\(248px|100vw/.test(model),
    "ModelSelector width uses min(…, 100vw…) clamp"
  );
  const gcmd = read("src/components/chat/GlobalCommandPalette.tsx");
  assert.ok(
    /min\(100%/.test(gcmd) || /100%-1\.5rem/.test(gcmd),
    "GlobalCommandPalette uses viewport-relative width"
  );
  const confirm = read("src/components/ui/ConfirmDialog.tsx");
  assert.ok(
    /min\(100%/.test(confirm),
    "ConfirmDialog uses viewport-relative width"
  );

  // Composer avoids fixed overflow on dictation cluster
  const composer = read("src/components/chat/Composer.tsx");
  assert.ok(
    /max-w-\[268px\]|max-w-\[280px\]/.test(composer),
    "dictation/voice clusters use max-w not fixed overflowing width alone"
  );
  assert.ok(
    composer.includes("min-w-0"),
    "composer shell allows flex shrink (min-w-0)"
  );

  // Message list prevents flex overflow
  const msgList = read("src/components/chat/MessageList.tsx");
  assert.ok(msgList.includes("min-w-0"), "MessageList has min-w-0");

  // Hook still wires pure helper
  const hook = read("src/hooks/useMenuPosition.ts");
  assert.ok(
    hook.includes("computeMenuPosition"),
    "useMenuPosition must call computeMenuPosition"
  );

  console.log("verify-mobile-layout: all assertions passed");
  console.log(`  fixture=${VW}x${VH}`);
  console.log(
    `  above: left=${above.left.toFixed(1)} maxH=${above.maxHeight.toFixed(0)} placement=${above.placement}`
  );
  console.log(
    `  modelMenu: left=${modelMenu.left.toFixed(1)} placement=${modelMenu.placement}`
  );
}

main();
