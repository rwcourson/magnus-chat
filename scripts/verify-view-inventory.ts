/**
 * Structural check: the gap-inventory analysis artifact is complete and
 * grounded in real app routes + known messaging identity gaps.
 *
 * Usage:
 *   npx tsx scripts/verify-view-inventory.ts [path-to-inventory.md]
 *
 * Default inventory path: env MAGNUS_INVENTORY_PATH or sibling scratch path is not used;
 * pass an explicit path, or place a copy at docs/magnus-view-gap-inventory.md.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(__dirname, "..");

function listPageRoutes(appDir: string, base = ""): string[] {
  const out: string[] = [];
  for (const name of readdirSync(appDir)) {
    if (name.startsWith(".") || name === "globals.css" || name === "layout.tsx") {
      continue;
    }
    const full = join(appDir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...listPageRoutes(full, `${base}/${name}`));
    } else if (name === "page.tsx") {
      out.push(base === "" ? "/" : base);
    }
  }
  return out.sort();
}

function main() {
  const inventoryPath =
    process.argv[2] ||
    process.env.MAGNUS_INVENTORY_PATH ||
    join(root, "docs/magnus-view-gap-inventory.md");

  if (!existsSync(inventoryPath)) {
    console.error("FAIL: inventory not found at", inventoryPath);
    console.error(
      "Pass path: npx tsx scripts/verify-view-inventory.ts /path/to/magnus-view-gap-inventory.md"
    );
    process.exit(1);
  }

  const inventory = readFileSync(inventoryPath, "utf8");
  const routes = listPageRoutes(join(root, "src/app"));

  const requiredSections = [
    "Current inventory",
    "Gaps",
    "Brand consistency",
    "Production Magnus",
    "Prioritized",
  ];

  const missingSections = requiredSections.filter(
    (s) => !inventory.toLowerCase().includes(s.toLowerCase())
  );

  // Every real route must appear as a path token in the inventory
  const missingRoutes = routes.filter((r) => {
    if (r === "/") {
      return !inventory.includes("`/`") && !inventory.includes("| `/` |");
    }
    return !inventory.includes(r);
  });

  // Identity gaps must be called out (channel image / Conversation fields)
  const identitySignals = [
    "imageUrl",
    "Hash",
    "avatar",
    "Conversation",
  ];
  const missingIdentity = identitySignals.filter(
    (s) => !inventory.includes(s)
  );

  // Brand anchors
  const brandSignals = ["HomeLanding", "MessagingView", "PageHeader", "MagnusLogo"];
  const missingBrand = brandSignals.filter((s) => !inventory.includes(s));

  // Grades for secondary surfaces (at least 5 graded)
  const gradeHits = (inventory.match(/\|\s*\*\*(Pass|Partial|Fail)\*\*/g) || [])
    .length;

  const errors: string[] = [];
  if (missingSections.length) {
    errors.push(`Missing sections: ${missingSections.join(", ")}`);
  }
  if (missingRoutes.length) {
    errors.push(
      `Inventory missing routes: ${missingRoutes.join(", ")} (found ${routes.length} page.tsx)`
    );
  }
  if (missingIdentity.length) {
    errors.push(`Identity gap signals missing: ${missingIdentity.join(", ")}`);
  }
  if (missingBrand.length) {
    errors.push(`Brand anchors missing: ${missingBrand.join(", ")}`);
  }
  if (gradeHits < 5) {
    errors.push(`Brand matrix grades found ${gradeHits}, need ≥5`);
  }

  // Source truth: Conversation type still lacks imageUrl (inventory claim must hold)
  const messagingTypes = readFileSync(
    join(root, "src/types/messaging.ts"),
    "utf8"
  );
  const convBlock = messagingTypes.slice(
    messagingTypes.indexOf("export type Conversation"),
    messagingTypes.indexOf("export type SendTeamMessageResult")
  );
  if (convBlock.includes("imageUrl") || convBlock.includes("iconUrl")) {
    // If types gain images later, inventory must not claim the opposite without update —
    // for now we only assert the gap language if fields absent.
  } else if (!inventory.toLowerCase().includes("no channel image") &&
    !inventory.includes("lacks image") &&
    !inventory.includes("no `imageUrl`") &&
    !inventory.includes("**no `imageUrl`")) {
    // soft: ensure gap discussion exists
    if (!inventory.includes("channel image") && !inventory.includes("Channel visual")) {
      errors.push("Inventory must discuss channel image identity gap");
    }
  }

  console.log("Routes in src/app:", routes.join(" "));
  console.log("Inventory:", relative(root, inventoryPath));
  console.log("Section check:", missingSections.length === 0 ? "ok" : missingSections);
  console.log("Route coverage:", missingRoutes.length === 0 ? "ok" : missingRoutes);
  console.log("Identity signals:", missingIdentity.length === 0 ? "ok" : missingIdentity);
  console.log("Brand anchors:", missingBrand.length === 0 ? "ok" : missingBrand);
  console.log("Brand grades counted:", gradeHits);

  if (errors.length) {
    console.error("\nFAIL");
    for (const e of errors) console.error(" -", e);
    process.exit(1);
  }

  console.log("\nOK: inventory grounded in routes + identity/brand sections");
}

main();
