/**
 * Browseable knowledge helpers — same corpus as chat RAG, without a chat turn.
 */

import {
  buildKnowledgeCorpus,
  searchKnowledge,
  type KnowledgeDoc,
  type KnowledgeHit,
  type KnowledgeSource,
} from "@/lib/ai/knowledge";

export type BrowseKnowledgeOptions = {
  /** Max results when query is non-empty; default 24 */
  limit?: number;
  source?: KnowledgeSource | "all";
};

export type BrowseKnowledgeResult = {
  query: string;
  source: KnowledgeSource | "all";
  hits: KnowledgeHit[];
  totalInCorpus: number;
  isEmptyQuery: boolean;
};

/** Short body preview for list UI. */
export function knowledgeSnippet(body: string, max = 160): string {
  const cleaned = body.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

/**
 * List/filter company knowledge without chat.
 * Empty query → browse corpus (optionally by source).
 * Non-empty → rank via searchKnowledge (shipped retriever).
 */
export function browseKnowledge(
  query: string,
  opts: BrowseKnowledgeOptions = {}
): BrowseKnowledgeResult {
  const source = opts.source ?? "all";
  const limit = opts.limit ?? 24;
  const corpus = buildKnowledgeCorpus();
  const q = query.trim();
  const isEmptyQuery = q.length === 0;

  let hits: KnowledgeHit[];

  if (isEmptyQuery) {
    const filtered =
      source === "all" ? corpus : corpus.filter((d) => d.source === source);
    hits = filtered.slice(0, limit).map((d) => ({ ...d, score: 0 }));
  } else {
    hits = searchKnowledge(q, { limit: Math.max(limit, 8) });
    if (source !== "all") {
      hits = hits.filter((h) => h.source === source);
    }
    hits = hits.slice(0, limit);
  }

  return {
    query: q,
    source,
    hits,
    totalInCorpus: corpus.length,
    isEmptyQuery,
  };
}

/** Distinct sources present in the corpus (for filter chips). */
export function knowledgeBrowseSources(): KnowledgeSource[] {
  const set = new Set(buildKnowledgeCorpus().map((d) => d.source));
  return Array.from(set).sort();
}

/** Known query string that must hit seed data (for verify scripts). */
export const KNOWLEDGE_BROWSE_SEED_QUERY = "downtown tower";

export function listAllKnowledgeDocs(): KnowledgeDoc[] {
  return buildKnowledgeCorpus();
}
