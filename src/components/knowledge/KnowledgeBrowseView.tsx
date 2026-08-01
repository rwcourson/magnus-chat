"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, ExternalLink } from "lucide-react";
import {
  browseKnowledge,
  knowledgeBrowseSources,
  knowledgeSnippet,
} from "@/lib/knowledge-browse";
import type { KnowledgeSource } from "@/lib/ai/knowledge";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  CatalogSearch,
} from "@/components/ui/CatalogSearch";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

const SOURCE_LABELS: Partial<Record<KnowledgeSource | "all", string>> = {
  all: "All",
  news: "News",
  feed: "Live",
  scout: "Scout",
  person: "People",
  channel: "Channels",
  dm: "DMs",
  approval: "Approvals",
  calendar: "Calendar",
  skill: "Skills",
  routine: "Routines",
  integration: "Integrations",
  workspace: "Workspaces",
  action: "Actions",
};

/**
 * Browseable company knowledge — search/filter the same corpus chat uses.
 */
export function KnowledgeBrowseView() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<KnowledgeSource | "all">("all");

  const sources = useMemo(() => knowledgeBrowseSources(), []);

  const result = useMemo(
    () => browseKnowledge(query, { source, limit: 40 }),
    [query, source]
  );

  const filters: (KnowledgeSource | "all")[] = ["all", ...sources];

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
      data-knowledge-browse
    >
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <PageHeader
            eyebrow="Knowledge"
            icon={BookOpen}
            title="Browse company knowledge"
            description="Search policies, people, projects, and tools without starting a chat — same corpus Magnus uses."
            className="mb-4"
          />

          <CatalogSearch
            value={query}
            onChange={setQuery}
            placeholder="Search knowledge…"
            aria-label="Search knowledge"
            className="mb-3"
            data-testid="knowledge-search"
          />

          <div
            className="mb-5 flex flex-wrap gap-1.5"
            role="tablist"
            aria-label="Knowledge sources"
            data-knowledge-source-filters
          >
            {filters.map((s) => {
              const active = source === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSource(s)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors duration-150",
                    active
                      ? "bg-[var(--select-fill)] text-[var(--select-text)] shadow-[var(--select-shadow)]"
                      : "border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                  data-knowledge-source={s}
                >
                  {SOURCE_LABELS[s] ?? s}
                </button>
              );
            })}
          </div>

          <p className="mb-3 text-[12px] text-[var(--text-muted)]">
            {result.isEmptyQuery
              ? `Browsing ${result.hits.length} of ${result.totalInCorpus} documents`
              : `${result.hits.length} match${result.hits.length === 1 ? "" : "es"} for “${result.query}”`}
          </p>

          {result.hits.length === 0 ? (
            <div
              className="rounded-[20px] border border-dashed border-[var(--glass-border)] px-4 py-12 text-center"
              data-knowledge-empty
            >
              <p className="text-[13.5px] text-[var(--text-muted)]">
                {result.isEmptyQuery
                  ? "No knowledge documents in this filter."
                  : `No knowledge matches “${result.query}”`}
              </p>
              {(!result.isEmptyQuery || source !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSource("all");
                  }}
                  className="mt-3 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-muted)] hover:bg-[var(--hover-fill)]"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <ul className="flex flex-col gap-2" data-knowledge-results>
              {result.hits.map((doc, i) => {
                const snippet = knowledgeSnippet(doc.body);
                const card = (
                  <motion.article
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(i * 0.02, 0.2),
                      duration: 0.3,
                      ease: easeSpring,
                    }}
                    className={cn(
                      "rounded-[16px] border border-[var(--glass-border-soft)]",
                      "bg-[var(--glass-strong-solid)] p-3.5 shadow-[var(--shadow-xs)]",
                      "transition-[border-color,box-shadow] duration-150",
                      "hover:border-[var(--glass-border)] hover:shadow-[var(--shadow-sm)]"
                    )}
                    data-knowledge-doc={doc.id}
                    data-knowledge-source-tag={doc.source}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-[14px] font-semibold tracking-tight text-[var(--text-primary)]">
                        {doc.title}
                      </h2>
                      <span className="shrink-0 rounded-full bg-[var(--hover-fill)] px-2 py-0.5 text-[10.5px] font-medium capitalize text-[var(--text-muted)]">
                        {doc.source}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-snug text-[var(--text-secondary)]">
                      {snippet}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--text-muted)]">
                      {doc.when && (
                        <span className="tabular-nums">{doc.when}</span>
                      )}
                      {doc.project && <span>· {doc.project}</span>}
                      {doc.href && (
                        <span className="inline-flex items-center gap-0.5 text-[var(--text-secondary)]">
                          <ExternalLink
                            className="h-3 w-3"
                            strokeWidth={ICON_STROKE}
                          />
                          Open source
                        </span>
                      )}
                    </div>
                  </motion.article>
                );

                return (
                  <li key={doc.id}>
                    {doc.href ? (
                      <Link href={doc.href} className="block">
                        {card}
                      </Link>
                    ) : (
                      card
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </ScrollFade>
    </div>
  );
}
