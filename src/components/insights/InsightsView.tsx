"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Clock3,
  ExternalLink,
  Lock,
  MessageSquare,
  Pencil,
  Pin,
  Radar,
  Sparkles,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useScout } from "@/context/ScoutContext";
import { useChat } from "@/context/ChatContext";
import { canAccessInsights } from "@/lib/auth-demo";
import type {
  DraftStatus,
  HeadlineDraft,
  LeadershipInsight,
} from "@/types/scout";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";
import { ScrollFade } from "@/components/ui/ScrollFade";

type StoryTab = "pending" | "approved" | "rejected" | "snoozed";

const STORY_TABS: { id: StoryTab; label: string }[] = [
  { id: "pending", label: "To review" },
  { id: "approved", label: "Published" },
  { id: "snoozed", label: "Snoozed" },
  { id: "rejected", label: "Passed" },
];

function channelLabel(ch: HeadlineDraft["suggestedChannel"]): string {
  if (ch === "carousel") return "News slider";
  if (ch === "feed") return "Company feed";
  if (ch === "toolbox") return "Toolbox";
  return "Email";
}

function classLabel(c: LeadershipInsight["signalClass"]): string {
  if (c === "silence") return "Silence";
  if (c === "ops") return "Ops";
  if (c === "knowledge") return "Knowledge";
  if (c === "people") return "People";
  if (c === "project") return "Project";
  return "Safety";
}

function PulseCard({
  insight,
  onAskMagnus,
  onSuggestStory,
  onPin,
}: {
  insight: LeadershipInsight;
  onAskMagnus: (insight: LeadershipInsight) => void;
  onSuggestStory: (id: string) => void;
  onPin: (id: string) => void;
}) {
  const top = insight.evidence[0];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: easeSpring }}
      className={cn(
        "rounded-[16px] border border-[var(--glass-border-soft)]",
        "bg-[var(--glass-strong-solid)] p-4 shadow-[var(--shadow-xs)] sm:p-5",
        "transition-[border-color] duration-150 hover:border-[var(--glass-border)]",
        insight.pinned && "border-[var(--text-primary)]/25"
      )}
      data-pulse-card={insight.id}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
          {classLabel(insight.signalClass)}
        </span>
        <span className="text-[11px] text-[var(--text-muted)]">·</span>
        <span className="text-[11px] text-[var(--text-muted)]">
          {insight.timeLabel}
        </span>
        {insight.confidence === "high" && (
          <>
            <span className="text-[11px] text-[var(--text-muted)]">·</span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              High confidence
            </span>
          </>
        )}
        {insight.sensitive && (
          <>
            <span className="text-[11px] text-[var(--text-muted)]">·</span>
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              Sensitive
            </span>
          </>
        )}
        {insight.pinned && (
          <>
            <span className="text-[11px] text-[var(--text-muted)]">·</span>
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              Pinned
            </span>
          </>
        )}
      </div>

      <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.02em] text-[var(--text-primary)]">
        {insight.title}
      </h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
        {insight.takeaway}
      </p>

      <p className="mt-3 text-[12.5px] leading-snug text-[var(--text-muted)]">
        <span className="font-medium text-[var(--text-secondary)]">
          Why it matters
        </span>
        {" — "}
        {insight.whyItMatters}
      </p>

      {top && (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-xl bg-[var(--hover-fill)] px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
              {top.label}
            </p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--text-secondary)]">
              {top.snippet}
            </p>
          </div>
          {top.href && (
            <Link
              href={top.href}
              className="inline-flex shrink-0 items-center gap-0.5 pt-0.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Source
              <ExternalLink className="h-3 w-3" strokeWidth={ICON_STROKE} />
            </Link>
          )}
        </div>
      )}

      <p className="mt-3 text-[11px] font-medium text-[var(--text-muted)]">
        {insight.surfacesLabel}
        {insight.evidence.length > 1
          ? ` · ${insight.evidence.map((e) => e.label).join(" · ")}`
          : ""}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--glass-border-soft)] pt-3.5">
        <button
          type="button"
          onClick={() => onAskMagnus(insight)}
          className="btn-solid inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
          data-ask-magnus-insight
        >
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
          Ask Magnus
        </button>
        {insight.storyReady && (
          <button
            type="button"
            onClick={() => onSuggestStory(insight.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
              "text-[12.5px] font-medium text-[var(--text-secondary)]",
              "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
            )}
            data-suggest-story
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
            Suggest as story
          </button>
        )}
        <button
          type="button"
          onClick={() => onPin(insight.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium",
            insight.pinned
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-muted)] hover:bg-[var(--hover-fill)]"
          )}
        >
          <Pin className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
          {insight.pinned ? "Unpin" : "Pin for Monday"}
        </button>
      </div>
    </motion.article>
  );
}

function DraftCard({
  draft,
  onApproveSlider,
  onApproveFeed,
  onReject,
  onSnooze,
  onSaveEdits,
}: {
  draft: HeadlineDraft;
  onApproveSlider: (id: string, headline: string, summary: string) => void;
  onApproveFeed: (id: string, headline: string, summary: string) => void;
  onReject: (id: string) => void;
  onSnooze: (id: string) => void;
  onSaveEdits: (id: string, headline: string, summary: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [headline, setHeadline] = useState(draft.headline);
  const [summary, setSummary] = useState(draft.summary);
  const isPending = draft.status === "pending" || draft.status === "snoozed";
  const topEvidence = draft.evidence[0];
  const preferFeed = draft.suggestedChannel === "feed";

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
        "transition-[border-color] duration-150 hover:border-[var(--glass-border)]"
      )}
      data-draft-card={draft.id}
      data-draft-status={draft.status}
    >
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

      <p className="mt-3 text-[12.5px] leading-snug text-[var(--text-muted)]">
        <span className="font-medium text-[var(--text-secondary)]">
          Why surfaced
        </span>
        {" — "}
        {draft.whySurfaced}
      </p>

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
              className="inline-flex shrink-0 items-center gap-1 pt-0.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Source
              <ExternalLink className="h-3 w-3" strokeWidth={ICON_STROKE} />
            </Link>
          )}
        </div>
      )}

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
              {preferFeed ? (
                <button
                  type="button"
                  onClick={() => onApproveFeed(draft.id, headline, summary)}
                  className="btn-solid inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
                  data-publish-feed
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                  Publish to feed
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onApproveSlider(draft.id, headline, summary)}
                  className="btn-solid inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
                  data-approve-draft
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                  Publish to news
                </button>
              )}
              {!preferFeed && (
                <button
                  type="button"
                  onClick={() => onApproveFeed(draft.id, headline, summary)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
                    "text-[12.5px] font-medium text-[var(--text-secondary)]",
                    "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                  )}
                >
                  Publish to feed
                </button>
              )}
              {preferFeed && (
                <button
                  type="button"
                  onClick={() => onApproveSlider(draft.id, headline, summary)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
                    "text-[12.5px] font-medium text-[var(--text-secondary)]",
                    "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                  )}
                >
                  Publish to news
                </button>
              )}
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

function InsightsLocked() {
  return (
    <div className="relative flex h-full min-h-0 flex-col items-center justify-center px-6">
      <div
        className={cn(
          "max-w-md rounded-[20px] border border-[var(--glass-border-soft)]",
          "bg-[var(--glass-strong-solid)] p-8 text-center shadow-[var(--shadow-md)]"
        )}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hover-fill)]">
          <Lock
            className="h-5 w-5 text-[var(--text-muted)]"
            strokeWidth={ICON_STROKE}
          />
        </div>
        <h1 className="mt-4 text-[18px] font-semibold tracking-tight text-[var(--text-primary)]">
          Insights is limited
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
          Leadership pulse and the story desk are available to leadership and
          Internal Comms. Ask your Magnus admin if you need access.
        </p>
        <Link
          href="/"
          className="btn-solid mt-6 inline-flex rounded-full px-4 py-2 text-[13px] font-semibold"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

/**
 * Insights — privileged beat desk: leadership pulse + story review.
 * Magnus scout elevates company signals; humans approve publish.
 */
export function InsightsView() {
  const allowed = canAccessInsights();
  const router = useRouter();
  const { setAppMode, sendMessage, newChat } = useChat();
  const {
    drafts,
    pulse,
    scoutActivity,
    pendingCount,
    editDraft,
    approveAndPublish,
    publishToFeed,
    rejectDraft,
    snoozeDraft,
    suggestAsStory,
    pinInsight,
  } = useScout();

  const [storyTab, setStoryTab] = useState<StoryTab>("pending");
  const [flash, setFlash] = useState<string | null>(null);
  const [flashHref, setFlashHref] = useState<string>("/");

  const sortedPulse = useMemo(() => {
    return [...pulse].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return 0;
    });
  }, [pulse]);

  const filteredDrafts = useMemo(
    () => drafts.filter((d) => d.status === (storyTab as DraftStatus)),
    [drafts, storyTab]
  );

  const counts = useMemo(() => {
    const c: Record<StoryTab, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      snoozed: 0,
    };
    for (const d of drafts) c[d.status] += 1;
    return c;
  }, [drafts]);

  if (!allowed) return <InsightsLocked />;

  const showFlash = (msg: string, href = "/") => {
    setFlash(msg);
    setFlashHref(href);
    window.setTimeout(() => setFlash(null), 4500);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[680px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <PageHeader
            eyebrow="Insights"
            icon={Radar}
            title="Company beat"
            description="Magnus scouts feed, channels, knowledge, and systems — then elevates what leadership should see and what Internal Comms might publish. Nothing goes live without you."
          />

          {/* Scout strip */}
          <div
            className={cn(
              "mb-8 rounded-2xl border border-[var(--glass-border-soft)]",
              "bg-[var(--hover-fill)] px-4 py-3.5 sm:px-5"
            )}
            data-scout-strip
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-snug">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                <Radar className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Magnus scout · {scoutActivity.windowLabel}
              </span>
              <span className="text-[var(--text-muted)]">·</span>
              <span className="text-[var(--text-secondary)]">
                Scanned{" "}
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                  {scoutActivity.scannedCount}
                </span>{" "}
                signals across {scoutActivity.surfacesLabel}
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] text-[var(--text-muted)]">
              <span className="font-semibold tabular-nums text-[var(--text-secondary)]">
                {scoutActivity.elevatedCount}
              </span>{" "}
              elevated
              <span className="mx-1.5">·</span>
              <span className="font-semibold tabular-nums text-[var(--text-secondary)]">
                {scoutActivity.storyDraftsReady}
              </span>{" "}
              story drafts ready
              <span className="mx-1.5">·</span>
              Last scan {scoutActivity.lastScanLabel.toLowerCase()}
            </p>
          </div>

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
                <Link
                  href={flashHref}
                  className="font-semibold underline-offset-2 hover:underline"
                >
                  Open
                </Link>
              </motion.p>
            )}
          </AnimatePresence>

          {/* Leadership pulse */}
          <section className="mb-10" aria-label="Leadership pulse">
            <div className="mb-3 px-0.5">
              <p className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                Leadership pulse
              </p>
              <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
                Company-wide themes, wins, risks, and silence — not every item
                is a press release.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {sortedPulse.map((insight) => (
                <PulseCard
                  key={insight.id}
                  insight={insight}
                  onPin={pinInsight}
                  onSuggestStory={(id) => {
                    const draft = suggestAsStory(id);
                    if (draft) {
                      setStoryTab("pending");
                      showFlash(
                        `Added “${draft.headline}” to the story desk.`,
                        "#story-desk"
                      );
                    }
                  }}
                  onAskMagnus={(ins) => {
                    setAppMode("chat");
                    newChat();
                    router.push("/");
                    // Defer send so chat surface mounts
                    window.setTimeout(() => {
                      sendMessage(
                        `Tell me more about this company insight for leadership: ${ins.title}. ${ins.whyItMatters}`
                      );
                    }, 80);
                  }}
                />
              ))}
            </div>
          </section>

          {/* Story desk */}
          <section id="story-desk" aria-label="Story desk">
            <div className="mb-3 px-0.5">
              <p className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                Story desk
              </p>
              <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
                {pendingCount > 0
                  ? `${pendingCount} ready to review. Edit if needed, then publish to the news slider or company feed.`
                  : "Queue is clear. Magnus will surface the next story-ready items here."}
              </p>
            </div>

            <div
              className="mb-5 flex gap-1 border-b border-[var(--glass-border-soft)] pb-px"
              role="tablist"
              aria-label="Story draft status"
            >
              {STORY_TABS.map((t) => {
                const count = counts[t.id];
                const active = storyTab === t.id;
                if (t.id !== "pending" && count === 0 && !active) return null;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStoryTab(t.id)}
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
                          active
                            ? "text-[var(--text-secondary)]"
                            : "opacity-70"
                        )}
                      >
                        {count}
                      </span>
                    )}
                    {active && (
                      <motion.span
                        layoutId="insights-story-tab"
                        className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--text-primary)]"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 36,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {filteredDrafts.length === 0 ? (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-1 py-12 text-center text-[13.5px] text-[var(--text-muted)]"
                  >
                    {storyTab === "pending"
                      ? "Nothing waiting — you’re caught up."
                      : `No ${STORY_TABS.find((x) => x.id === storyTab)?.label.toLowerCase() ?? storyTab} items.`}
                  </motion.p>
                ) : (
                  filteredDrafts.map((draft) => (
                    <DraftCard
                      key={draft.id}
                      draft={draft}
                      onSaveEdits={(id, h, s) => {
                        editDraft(id, { headline: h, summary: s });
                      }}
                      onApproveSlider={(id, h, s) => {
                        const story = approveAndPublish(id, {
                          headline: h,
                          summary: s,
                        });
                        if (story) {
                          showFlash(`Published “${story.title}” to news.`, "/");
                        }
                      }}
                      onApproveFeed={(id, h, s) => {
                        const post = publishToFeed(id, {
                          headline: h,
                          summary: s,
                        });
                        if (post) {
                          showFlash(
                            `Published “${post.headline ?? "update"}” to the company feed.`,
                            "/feed"
                          );
                        }
                      }}
                      onReject={rejectDraft}
                      onSnooze={snoozeDraft}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </ScrollFade>
    </div>
  );
}
