"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Megaphone,
  Pencil,
  X,
  Clock3,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useScout } from "@/context/ScoutContext";
import type { DraftStatus, HeadlineDraft } from "@/types/scout";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";
import { ScrollFade } from "@/components/ui/ScrollFade";

type Tab = "pending" | "approved" | "rejected" | "snoozed";

const TABS: { id: Tab; label: string }[] = [
  { id: "pending", label: "To review" },
  { id: "approved", label: "Published" },
  { id: "snoozed", label: "Snoozed" },
  { id: "rejected", label: "Passed" },
];

function channelLabel(ch: HeadlineDraft["suggestedChannel"]): string {
  if (ch === "carousel") return "News slider";
  if (ch === "feed") return "Feed";
  if (ch === "toolbox") return "Toolbox";
  return "Email";
}

function DraftCard({
  draft,
  onApprove,
  onReject,
  onSnooze,
  onSaveEdits,
}: {
  draft: HeadlineDraft;
  onApprove: (id: string, headline: string, summary: string) => void;
  onReject: (id: string) => void;
  onSnooze: (id: string) => void;
  onSaveEdits: (id: string, headline: string, summary: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [headline, setHeadline] = useState(draft.headline);
  const [summary, setSummary] = useState(draft.summary);
  const isPending = draft.status === "pending" || draft.status === "snoozed";
  const topEvidence = draft.evidence[0];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.28, ease: easeSpring }}
      className={cn(
        "rounded-[16px] border border-[var(--glass-border-soft)]",
        "bg-[var(--glass-strong-solid)] p-4 shadow-[var(--shadow-xs)] sm:p-5",
        "transition-[border-color] duration-150",
        "hover:border-[var(--glass-border)]"
      )}
      data-draft-card={draft.id}
      data-draft-status={draft.status}
    >
      {/* Meta row — category + channel only */}
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
          {draft.category}
        </span>
        <span className="text-[11px] text-[var(--text-muted)]">·</span>
        <span className="text-[11px] text-[var(--text-muted)]">
          {channelLabel(draft.suggestedChannel)}
        </span>
        {draft.confidence === "high" && (
          <>
            <span className="text-[11px] text-[var(--text-muted)]">·</span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              High confidence
            </span>
          </>
        )}
      </div>

      {editing && isPending ? (
        <div className="space-y-2">
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className={cn(
              "w-full rounded-xl border border-[var(--glass-border)] bg-[var(--hover-fill)]",
              "px-3 py-2 text-[15px] font-semibold tracking-tight text-[var(--text-primary)]",
              "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
            )}
            aria-label="Draft headline"
          />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            className={cn(
              "w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--hover-fill)]",
              "px-3 py-2 text-[13.5px] leading-relaxed text-[var(--text-secondary)]",
              "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
            )}
            aria-label="Draft summary"
          />
        </div>
      ) : (
        <div>
          <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.02em] text-[var(--text-primary)]">
            {draft.headline}
          </h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
            {draft.summary}
          </p>
        </div>
      )}

      {/* Why — single line */}
      <p className="mt-3 text-[12.5px] leading-snug text-[var(--text-muted)]">
        <span className="font-medium text-[var(--text-secondary)]">Why now</span>
        {" — "}
        {draft.whySurfaced}
      </p>

      {/* One evidence line, not a stack */}
      {topEvidence && (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-xl bg-[var(--hover-fill)] px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
              {topEvidence.label}
            </p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--text-secondary)]">
              {topEvidence.snippet}
            </p>
          </div>
          {topEvidence.href && (
            <Link
              href={topEvidence.href}
              className="inline-flex shrink-0 items-center gap-0.5 pt-0.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Source
              <ExternalLink className="h-3 w-3" strokeWidth={ICON_STROKE} />
            </Link>
          )}
        </div>
      )}

      {/* Sources — quiet inline */}
      <p className="mt-3 text-[11px] font-medium text-[var(--text-muted)]">
        {draft.sources.map((s) => s.label).join(" · ")}
      </p>

      {isPending && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--glass-border-soft)] pt-3.5">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onSaveEdits(draft.id, headline, summary);
                  setEditing(false);
                }}
                className="btn-solid inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setHeadline(draft.headline);
                  setSummary(draft.summary);
                  setEditing(false);
                }}
                className="rounded-full px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-muted)] hover:bg-[var(--hover-fill)]"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onApprove(draft.id, headline, summary)}
                className="btn-solid inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
                data-approve-draft
              >
                <Check className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Publish to slider
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
                  "text-[12.5px] font-medium text-[var(--text-secondary)]",
                  "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                )}
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onSnooze(draft.id)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-muted)] hover:bg-[var(--hover-fill)]"
              >
                <Clock3 className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Later
              </button>
              <button
                type="button"
                onClick={() => onReject(draft.id)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Pass
              </button>
            </>
          )}
        </div>
      )}
    </motion.article>
  );
}

/**
 * Internal Comms — calm review queue for Magnus scout headlines.
 */
export function CommsReviewView() {
  const {
    drafts,
    pendingCount,
    editDraft,
    approveAndPublish,
    rejectDraft,
    snoozeDraft,
  } = useScout();
  const [tab, setTab] = useState<Tab>("pending");
  const [flash, setFlash] = useState<string | null>(null);

  const filtered = useMemo(
    () => drafts.filter((d) => d.status === (tab as DraftStatus)),
    [drafts, tab]
  );

  const counts = useMemo(() => {
    const c: Record<Tab, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      snoozed: 0,
    };
    for (const d of drafts) c[d.status] += 1;
    return c;
  }, [drafts]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[640px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <PageHeader
            eyebrow="Internal Comms"
            icon={Megaphone}
            title="Headline drafts"
            description={
              pendingCount > 0
                ? `${pendingCount} ready to review. Edit if needed, then publish to the news slider — nothing goes live without you.`
                : "Queue is clear. Magnus will surface the next high-signal stories here."
            }
          />

          <AnimatePresence>
            {flash && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-3.5 py-2.5 text-[13px] text-emerald-700 dark:text-emerald-300"
                role="status"
              >
                {flash}{" "}
                <Link href="/" className="font-semibold underline-offset-2 hover:underline">
                  View on Home
                </Link>
              </motion.p>
            )}
          </AnimatePresence>

          <div
            className="mb-5 flex gap-1 border-b border-[var(--glass-border-soft)] pb-px"
            role="tablist"
            aria-label="Draft status"
          >
            {TABS.map((t) => {
              const count = counts[t.id];
              const active = tab === t.id;
              if (t.id !== "pending" && count === 0 && !active) return null;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  {t.label}
                  {count > 0 && (
                    <span
                      className={cn(
                        "ml-1.5 tabular-nums text-[12px]",
                        active ? "text-[var(--text-secondary)]" : "opacity-70"
                      )}
                    >
                      {count}
                    </span>
                  )}
                  {active && (
                    <motion.span
                      layoutId="comms-tab"
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--text-primary)]"
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-1 py-12 text-center text-[13.5px] text-[var(--text-muted)]"
                >
                  {tab === "pending"
                    ? "Nothing waiting — you’re caught up."
                    : `No ${TABS.find((x) => x.id === tab)?.label.toLowerCase() ?? tab} items.`}
                </motion.p>
              ) : (
                filtered.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    onSaveEdits={(id, h, s) => {
                      editDraft(id, { headline: h, summary: s });
                    }}
                    onApprove={(id, h, s) => {
                      const story = approveAndPublish(id, {
                        headline: h,
                        summary: s,
                      });
                      if (story) {
                        setFlash(`Published “${story.title}”.`);
                        window.setTimeout(() => setFlash(null), 4000);
                      }
                    }}
                    onReject={rejectDraft}
                    onSnooze={snoozeDraft}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </ScrollFade>
    </div>
  );
}
