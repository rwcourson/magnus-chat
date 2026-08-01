/**
 * Browseable knowledge surface — page + corpus search without chat.
 * Run: npx tsx scripts/verify-browseable-knowledge.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  browseKnowledge,
  KNOWLEDGE_BROWSE_SEED_QUERY,
  knowledgeSnippet,
  listAllKnowledgeDocs,
} from "../src/lib/knowledge-browse";
import {
  resetKnowledgeCorpus,
  searchKnowledge,
} from "../src/lib/ai/knowledge";

const root = join(__dirname, "..");

function main() {
  resetKnowledgeCorpus();

  const corpus = listAllKnowledgeDocs();
  assert.ok(corpus.length >= 20, `corpus too small: ${corpus.length}`);

  // Seed query drawn from product data must hit
  const seedHits = browseKnowledge(KNOWLEDGE_BROWSE_SEED_QUERY, { limit: 12 });
  assert.ok(
    seedHits.hits.length >= 1,
    `browse must return ≥1 hit for "${KNOWLEDGE_BROWSE_SEED_QUERY}"`
  );
  assert.ok(
    seedHits.hits.some(
      (h) =>
        /downtown|tower|crane|atl/i.test(
          `${h.title} ${h.body} ${h.keywords}`
        )
    ),
    "seed hits should relate to downtown tower corpus"
  );
  // Snippets for UI
  for (const h of seedHits.hits.slice(0, 3)) {
    const snip = knowledgeSnippet(h.body);
    assert.ok(snip.length > 0, "snippet non-empty");
    assert.ok(snip.length <= 160, "snippet bounded");
  }

  // Same retriever path as chat tools
  const chatPath = searchKnowledge(KNOWLEDGE_BROWSE_SEED_QUERY, { limit: 8 });
  assert.ok(chatPath.length >= 1, "searchKnowledge still works for chat path");

  // No-match query yields empty
  const none = browseKnowledge("zzzxqqq-no-such-knowledge-doc-999", {
    limit: 10,
  });
  assert.equal(none.hits.length, 0, "no-match must be empty");
  assert.equal(none.isEmptyQuery, false);

  // Empty query browses corpus
  const browseAll = browseKnowledge("", { limit: 5 });
  assert.ok(browseAll.isEmptyQuery);
  assert.ok(browseAll.hits.length >= 1, "empty query still lists docs");
  assert.ok(browseAll.totalInCorpus >= corpus.length);

  // Source filter
  const peopleOnly = browseKnowledge("", { source: "person", limit: 20 });
  assert.ok(
    peopleOnly.hits.every((h) => h.source === "person"),
    "source filter person"
  );

  // Route + view not Coming soon
  const pagePath = join(root, "src/app/knowledge/page.tsx");
  const viewPath = join(
    root,
    "src/components/knowledge/KnowledgeBrowseView.tsx"
  );
  assert.ok(existsSync(pagePath), "knowledge page required");
  assert.ok(existsSync(viewPath), "KnowledgeBrowseView required");
  const pageSrc = readFileSync(pagePath, "utf8");
  assert.ok(
    pageSrc.includes("KnowledgeBrowseView") &&
      !pageSrc.includes("Coming soon") &&
      !pageSrc.includes("PlaceholderPage"),
    "knowledge page is real browse view"
  );
  const viewSrc = readFileSync(viewPath, "utf8");
  assert.ok(
    viewSrc.includes("browseKnowledge"),
    "view uses browseKnowledge helper"
  );
  assert.ok(
    viewSrc.includes("data-knowledge-browse") ||
      viewSrc.includes("data-knowledge-results"),
    "browse DOM contract"
  );

  // Reachable from command palette / nav config
  const commands = readFileSync(
    join(root, "src/lib/global-commands.ts"),
    "utf8"
  );
  assert.ok(
    commands.includes('href: "/knowledge"') ||
      commands.includes("href: '/knowledge'"),
    "knowledge must be navigable via global commands"
  );

  console.log("verify-browseable-knowledge: all assertions passed");
  console.log(
    `  corpus=${corpus.length} seedHits=${seedHits.hits.length} none=${none.hits.length}`
  );
}

main();
