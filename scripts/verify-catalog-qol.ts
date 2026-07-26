/**
 * Catalog QoL: create helpers + primary CTA wiring in shipped views.
 * Run: npx tsx scripts/verify-catalog-qol.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  createRoutineItem,
  createSkillItem,
  createWorkspaceItem,
  prependCatalogItem,
} from "../src/lib/catalog-create";
import { routines, skills, workspaces } from "../src/lib/catalog-data";

const root = process.cwd();

function read(rel: string): string {
  const p = join(root, rel);
  assert.ok(existsSync(p), `missing ${rel}`);
  return readFileSync(p, "utf8");
}

function main() {
  // ── Pure create helpers ──
  assert.equal(createRoutineItem({ name: "   " }), null);
  const routine = createRoutineItem({
    name: "Monday safety digest",
    schedule: "Mon · 6:30 AM",
    id: "routine-test-1",
  });
  assert.ok(routine);
  assert.equal(routine!.name, "Monday safety digest");
  assert.equal(routine!.schedule, "Mon · 6:30 AM");
  assert.equal(routine!.active, true);
  assert.ok(routine!.owner.name.length > 0);
  assert.ok(routine!.id === "routine-test-1");

  const nextRoutines = prependCatalogItem(routines, routine);
  assert.equal(nextRoutines[0]!.id, "routine-test-1");
  assert.equal(nextRoutines.length, routines.length + 1);

  assert.equal(createWorkspaceItem({ name: "" }), null);
  const ws = createWorkspaceItem({
    name: "Site logistics",
    projectCode: "LOG-1",
    id: "ws-test-1",
  });
  assert.ok(ws);
  assert.equal(ws!.name, "Site logistics");
  assert.equal(ws!.projectCode, "LOG-1");
  assert.ok(ws!.members.length >= 1);
  const nextWs = prependCatalogItem(workspaces, ws);
  assert.equal(nextWs[0]!.id, "ws-test-1");
  assert.equal(nextWs.length, workspaces.length + 1);

  assert.equal(createSkillItem({ name: "  " }), null);
  const skill = createSkillItem({
    name: "Pour checklist",
    category: "Field",
    id: "skill-test-1",
  });
  assert.ok(skill);
  assert.equal(skill!.name, "Pour checklist");
  assert.equal(skill!.category, "Field");
  assert.equal(skill!.pinned, true);
  const nextSkills = prependCatalogItem(skills, skill);
  assert.equal(nextSkills[0]!.id, "skill-test-1");
  assert.equal(nextSkills.length, skills.length + 1);

  // Defaults when optional fields omitted
  const r2 = createRoutineItem({ name: "Daily brief", id: "r2" });
  assert.ok(r2!.schedule.includes("Weekdays") || r2!.schedule.length > 0);
  const w2 = createWorkspaceItem({ name: "Alpha job", id: "w2" });
  assert.ok(w2!.projectCode && w2!.projectCode.length > 0);

  // ── PageHeader actions slot ──
  const pageHeader = read("src/components/ui/PageHeader.tsx");
  assert.ok(
    pageHeader.includes("actions") && pageHeader.includes("data-page-header-actions"),
    "PageHeader must expose actions slot"
  );

  // ── View CTAs + empty paths ──
  const routinesView = read("src/components/catalog/RoutinesView.tsx");
  assert.ok(
    /Add routine|data-add-routine/.test(routinesView),
    "RoutinesView needs Add routine CTA"
  );
  assert.ok(
    routinesView.includes("createRoutineItem"),
    "RoutinesView must call createRoutineItem"
  );
  assert.ok(
    /data-routines-empty|No routines yet/.test(routinesView),
    "Routines empty state with CTA path"
  );
  assert.ok(routinesView.includes("toast"), "Routines create feedback via toast");

  const workspacesView = read("src/components/catalog/WorkspacesView.tsx");
  assert.ok(
    /New workspace|data-new-workspace/.test(workspacesView),
    "WorkspacesView needs New workspace CTA"
  );
  assert.ok(
    workspacesView.includes("createWorkspaceItem"),
    "WorkspacesView must call createWorkspaceItem"
  );
  assert.ok(
    /data-workspaces-empty|data-workspaces-empty-cta/.test(workspacesView),
    "Workspaces empty/no-match CTA path"
  );

  const skillsView = read("src/components/catalog/SkillsView.tsx");
  assert.ok(
    /Create skill|data-create-skill/.test(skillsView),
    "SkillsView needs Create skill CTA"
  );
  assert.ok(
    skillsView.includes("createSkillItem"),
    "SkillsView must call createSkillItem"
  );
  assert.ok(
    /data-skills-empty|No skills yet/.test(skillsView),
    "Skills empty state path"
  );
  assert.ok(
    /data-skill-pin|togglePin|pinned/.test(skillsView),
    "Skills pin affordance present"
  );

  console.log("verify-catalog-qol: all assertions passed");
  console.log(
    `  routine=${routine!.name}; workspace=${ws!.name}; skill=${skill!.name}`
  );
  console.log(
    `  listLens r=${nextRoutines.length} w=${nextWs.length} s=${nextSkills.length}`
  );
}

main();
