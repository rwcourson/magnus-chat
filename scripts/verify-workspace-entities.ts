/**
 * Workspace project entities — seed subsets + detail route wiring.
 * Run: npx tsx scripts/verify-workspace-entities.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getWorkspaceById,
  getWorkspaceEntitySubsets,
  listWorkspaces,
  resetWorkspaceRegistry,
  workspaceHasEntityContent,
  workspaces,
} from "../src/lib/catalog-data";
import {
  createAndRegisterWorkspace,
  createWorkspaceItem,
} from "../src/lib/catalog-create";

const root = join(__dirname, "..");

function main() {
  resetWorkspaceRegistry();
  assert.ok(workspaces.length >= 3, "expected seeded workspaces");

  for (const ws of workspaces) {
    assert.ok(
      workspaceHasEntityContent(ws),
      `${ws.id} must expose members + chats + files + activity (entity subsets)`
    );
    const subsets = getWorkspaceEntitySubsets(ws);
    assert.ok(subsets.members.length >= 1, `${ws.id} members`);
    assert.ok(subsets.chatEntries.length >= 1, `${ws.id} chatEntries`);
    assert.ok(subsets.fileEntries.length >= 1, `${ws.id} fileEntries`);
    assert.ok(subsets.activity.length >= 1, `${ws.id} activity`);
    // Entries tied to workspace id namespace
    for (const c of subsets.chatEntries) {
      assert.ok(
        c.id.includes(ws.id) || c.id.startsWith("ws-"),
        `chat ${c.id} should be scoped to workspace seed`
      );
    }
  }

  const tower = getWorkspaceById("ws-tower");
  assert.ok(tower, "getWorkspaceById(ws-tower)");
  assert.equal(tower!.name, "Downtown tower");
  const towerChats = getWorkspaceEntitySubsets(tower!).chatEntries;
  assert.ok(
    towerChats.some((c) => /crane|laydown/i.test(c.title + c.preview)),
    "tower entity chats reference project content"
  );

  // Create-only (no register) still builds entity shell
  const unregistered = createWorkspaceItem({
    name: "Unregistered job",
    projectCode: "U-1",
  });
  assert.ok(unregistered);
  assert.ok(Array.isArray(unregistered!.chatEntries));
  assert.ok(Array.isArray(unregistered!.fileEntries));
  assert.ok((unregistered!.activity ?? []).length >= 1);
  assert.equal(
    getWorkspaceById(unregistered!.id),
    undefined,
    "createWorkspaceItem alone must not appear in registry"
  );

  // Create → register → detail lookup (shipped list→detail path)
  const created = createAndRegisterWorkspace({
    name: "Verify job",
    projectCode: "V-1",
    id: "ws-verify-create-open",
  });
  assert.ok(created);
  const fromRegistry = getWorkspaceById("ws-verify-create-open");
  assert.ok(
    fromRegistry,
    "createAndRegisterWorkspace must make id resolvable via getWorkspaceById"
  );
  assert.equal(fromRegistry!.name, "Verify job");
  assert.ok(
    listWorkspaces().some((w) => w.id === "ws-verify-create-open"),
    "listWorkspaces includes created workspace"
  );

  // Detail route + view exist and reference entity by workspace id
  const detailPage = join(root, "src/app/workspaces/[id]/page.tsx");
  const detailView = join(
    root,
    "src/components/catalog/WorkspaceDetailView.tsx"
  );
  assert.ok(existsSync(detailPage), "workspaces/[id]/page.tsx required");
  assert.ok(existsSync(detailView), "WorkspaceDetailView.tsx required");

  const pageSrc = readFileSync(detailPage, "utf8");
  assert.ok(
    pageSrc.includes("getWorkspaceById") &&
      pageSrc.includes("WorkspaceDetailView"),
    "detail page must resolve entity by id into detail view"
  );
  assert.ok(!pageSrc.includes("Coming soon"), "detail must not be Coming soon");

  const viewSrc = readFileSync(detailView, "utf8");
  assert.ok(
    viewSrc.includes("getWorkspaceEntitySubsets") ||
      viewSrc.includes("chatEntries"),
    "detail view must render entity subsets"
  );
  assert.ok(
    viewSrc.includes("data-workspace-detail") &&
      viewSrc.includes("data-workspace-id"),
    "detail view marks workspace id for tests/DOM"
  );
  assert.ok(
    viewSrc.includes("data-workspace-chat") &&
      viewSrc.includes("data-workspace-file") &&
      viewSrc.includes("data-workspace-activity") &&
      viewSrc.includes("data-workspace-member"),
    "detail view exposes members/chats/files/activity hooks"
  );

  // List still links into entity detail and uses shared registry on create
  const listSrc = readFileSync(
    join(root, "src/components/catalog/WorkspacesView.tsx"),
    "utf8"
  );
  assert.ok(
    listSrc.includes("/workspaces/${ws.id}") ||
      listSrc.includes("`/workspaces/${ws.id}`") ||
      listSrc.includes("/workspaces/"),
    "list must open entity detail routes"
  );
  assert.ok(
    listSrc.includes("data-workspace-open") || listSrc.includes("href="),
    "list cards are openable"
  );
  assert.ok(
    listSrc.includes("createAndRegisterWorkspace") &&
      listSrc.includes("listWorkspaces"),
    "list create must write shared registry (not local-only state)"
  );

  const detailPageSrc = readFileSync(detailPage, "utf8");
  assert.ok(
    detailPageSrc.includes("getWorkspaceById"),
    "detail page reads shared getWorkspaceById"
  );

  resetWorkspaceRegistry();

  console.log("verify-workspace-entities: all assertions passed");
  console.log(
    `  workspaces=${workspaces.length} sample=${tower!.id} chats=${towerChats.length} createOpen=ok`
  );
}

main();
