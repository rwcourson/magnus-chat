/**
 * Structural + data checks for destination catalogs (shipped modules).
 * Run: npx tsx scripts/verify-catalog.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  integrations,
  routines,
  skills,
  workspaces,
} from "../src/lib/catalog-data";

const root = join(__dirname, "..");

function pageSource(route: string): string {
  return readFileSync(join(root, "src/app", route, "page.tsx"), "utf8");
}

/** PNG signature or SVG root — rejects empty / 404 HTML stubs. */
function assertLogoFileLooksReal(absPath: string, label: string) {
  assert.ok(existsSync(absPath), `${label}: missing file ${absPath}`);
  const st = statSync(absPath);
  assert.ok(
    st.size >= 300,
    `${label}: logo file too small (${st.size}b) — likely broken asset`
  );
  const buf = readFileSync(absPath);
  const head = buf.subarray(0, 16).toString("utf8");
  const isPng =
    buf.length >= 4 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47;
  const isSvg = head.includes("svg") || head.trimStart().startsWith("<");
  assert.ok(
    isPng || isSvg,
    `${label}: expected PNG or SVG logo at ${absPath}, got signature ${buf
      .subarray(0, 4)
      .toString("hex")}`
  );
}

function main() {
  // Pages must not be Coming soon placeholders
  for (const route of ["integrations", "skills", "routines", "workspaces"]) {
    const src = pageSource(route);
    assert.ok(
      !src.includes("PlaceholderPage"),
      `${route} must not use PlaceholderPage`
    );
    assert.ok(
      !src.includes("Coming soon"),
      `${route} must not say Coming soon`
    );
  }

  // Integrations: local logos that resolve on disk (not dead CDN)
  assert.ok(integrations.length >= 6, "expected a full integrations catalog");
  for (const item of integrations) {
    assert.ok(item.logoUrl.length > 0, `${item.id} needs logoUrl`);
    assert.ok(
      item.logoUrl.startsWith("/integrations/"),
      `${item.id} logoUrl must be a local /integrations/ asset (got ${item.logoUrl})`
    );
    assert.ok(item.name.length > 0);
    assert.ok(item.brandColor.startsWith("#"));
    assert.ok(
      ["connected", "available", "pending"].includes(item.status),
      `${item.id} invalid status`
    );
    const rel = item.logoUrl.replace(/^\//, "");
    assertLogoFileLooksReal(join(root, "public", rel), item.id);
  }

  // Skills: photos + authors
  assert.ok(skills.length >= 4);
  for (const s of skills) {
    assert.ok(s.imageUrl.startsWith("http"), `${s.id} needs imageUrl`);
    assert.ok(s.author.initials.length > 0);
  }

  // Routines: schedule + photos
  assert.ok(routines.length >= 3);
  for (const r of routines) {
    assert.ok(r.imageUrl.startsWith("http"));
    assert.ok(r.schedule.length > 0);
    assert.ok(r.owner.initials.length > 0);
  }

  // Workspaces: covers + members
  assert.ok(workspaces.length >= 3);
  for (const w of workspaces) {
    assert.ok(w.coverUrl.startsWith("http"));
    assert.ok(w.members.length >= 1);
    assert.ok(w.members.every((m) => m.initials.length > 0));
  }

  // Dark theme is mid-navy (TV-readable lift) + accents map to white
  const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
  assert.ok(css.includes("--bg-deep:"), "globals.css must define --bg-deep");
  assert.ok(
    css.includes("#121826") ||
      css.includes("#161e2e") ||
      css.includes("#070b14") ||
      css.includes("#0a0f1a"),
    "dark canvas should use navy tokens (lifted mid-navy or deep navy)"
  );
  assert.ok(
    css.includes("--brand-cyan: #ffffff") ||
      css.includes("--brand-cyan:#ffffff"),
    "brand accent aliases should be white (no cyan pop)"
  );

  console.log("verify-catalog: all assertions passed");
  console.log(
    `  integrations=${integrations.length} skills=${skills.length} routines=${routines.length} workspaces=${workspaces.length}`
  );
  console.log(
    `  logos=${integrations.map((i) => i.logoUrl.split("/").pop()).join(",")}`
  );
}

main();
