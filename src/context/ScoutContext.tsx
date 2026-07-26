"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { newsStories as seedNewsStories } from "@/lib/home-data";
import {
  seedHeadlineDrafts,
  seedLeadershipPulse,
  seedScoutActivity,
} from "@/lib/scout-data";
import {
  applyDraftEdits,
  applyDraftStatus,
  approveDraft,
  draftToFeedPostInput,
  insightToStoryDraft,
  pendingDraftCount,
} from "@/lib/scout";
import { createFeedPost } from "@/lib/feed";
import type { NewsStory } from "@/types/home";
import type { FeedPost } from "@/types/feed";
import type {
  DraftEdits,
  DraftStatus,
  HeadlineDraft,
  LeadershipInsight,
  ScoutActivitySummary,
} from "@/types/scout";

interface ScoutContextValue {
  drafts: HeadlineDraft[];
  pulse: LeadershipInsight[];
  scoutActivity: ScoutActivitySummary;
  /** Seed carousel stories + Insights-approved (approved first). */
  publishedStories: NewsStory[];
  /** Feed posts published from Story desk (demo). */
  publishedFeedPosts: FeedPost[];
  pendingCount: number;
  editDraft: (id: string, edits: DraftEdits) => void;
  setDraftStatus: (id: string, status: DraftStatus) => void;
  /** Approve → NewsStory prepended to carousel; draft marked approved. */
  approveAndPublish: (id: string, edits?: DraftEdits) => NewsStory | null;
  /** Approve → company feed post; draft marked approved. */
  publishToFeed: (id: string, edits?: DraftEdits) => FeedPost | null;
  rejectDraft: (id: string) => void;
  snoozeDraft: (id: string) => void;
  /** Promote a leadership pulse card into the story desk. */
  suggestAsStory: (pulseId: string) => HeadlineDraft | null;
  pinInsight: (pulseId: string) => void;
}

const ScoutContext = createContext<ScoutContextValue | null>(null);

const insightsAuthor = {
  name: "Internal Comms",
  handle: "comms",
  role: "Insights",
  office: "Enterprise",
  initials: "IC",
  verified: true as const,
};

export function ScoutProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<HeadlineDraft[]>(seedHeadlineDrafts);
  const [pulse, setPulse] = useState<LeadershipInsight[]>(seedLeadershipPulse);
  const [extraStories, setExtraStories] = useState<NewsStory[]>([]);
  const [publishedFeedPosts, setPublishedFeedPosts] = useState<FeedPost[]>([]);

  const publishedStories = useMemo(
    () => [...extraStories, ...seedNewsStories],
    [extraStories]
  );

  const pendingCount = useMemo(() => pendingDraftCount(drafts), [drafts]);

  const scoutActivity = useMemo<ScoutActivitySummary>(
    () => ({
      ...seedScoutActivity,
      elevatedCount: pulse.length,
      storyDraftsReady: pendingCount,
    }),
    [pulse.length, pendingCount]
  );

  const editDraft = useCallback((id: string, edits: DraftEdits) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? applyDraftEdits(d, edits) : d))
    );
  }, []);

  const setDraftStatus = useCallback((id: string, status: DraftStatus) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? applyDraftStatus(d, status) : d))
    );
  }, []);

  const approveAndPublish = useCallback(
    (id: string, edits?: DraftEdits): NewsStory | null => {
      const draft = drafts.find((d) => d.id === id);
      if (!draft || draft.status === "rejected") return null;

      const withEdits = edits ? applyDraftEdits(draft, edits) : draft;
      let story: NewsStory;
      try {
        story = approveDraft(
          withEdits,
          undefined,
          `ns-approved-${id}-${Date.now()}`
        );
      } catch {
        return null;
      }

      setDrafts((prev) =>
        prev.map((d) =>
          d.id === id
            ? applyDraftStatus(
                edits ? applyDraftEdits(d, edits) : d,
                "approved"
              )
            : d
        )
      );
      setExtraStories((prev) => [
        story,
        ...prev.filter((s) => s.id !== story.id),
      ]);
      return story;
    },
    [drafts]
  );

  const publishToFeed = useCallback(
    (id: string, edits?: DraftEdits): FeedPost | null => {
      const draft = drafts.find((d) => d.id === id);
      if (!draft || draft.status === "rejected") return null;

      const withEdits = edits ? applyDraftEdits(draft, edits) : draft;
      const input = draftToFeedPostInput(withEdits);
      const post = createFeedPost({
        ...input,
        author: insightsAuthor,
        id: `fp-insights-${id}-${Date.now()}`,
        createdAt: new Date().toISOString(),
      });
      if (!post) return null;

      setDrafts((prev) =>
        prev.map((d) =>
          d.id === id
            ? applyDraftStatus(
                edits ? applyDraftEdits(d, edits) : d,
                "approved"
              )
            : d
        )
      );
      setPublishedFeedPosts((prev) => [post, ...prev]);
      return post;
    },
    [drafts]
  );

  const rejectDraft = useCallback(
    (id: string) => {
      setDraftStatus(id, "rejected");
    },
    [setDraftStatus]
  );

  const snoozeDraft = useCallback(
    (id: string) => {
      setDraftStatus(id, "snoozed");
    },
    [setDraftStatus]
  );

  const suggestAsStory = useCallback(
    (pulseId: string): HeadlineDraft | null => {
      const insight = pulse.find((p) => p.id === pulseId);
      if (!insight) return null;
      // Avoid duplicate pending drafts for same signal
      const existing = drafts.find(
        (d) =>
          d.signalId === insight.signalId &&
          (d.status === "pending" || d.status === "snoozed")
      );
      if (existing) return existing;

      const draft = insightToStoryDraft(insight);
      setDrafts((prev) => [draft, ...prev]);
      return draft;
    },
    [pulse, drafts]
  );

  const pinInsight = useCallback((pulseId: string) => {
    setPulse((prev) =>
      prev.map((p) =>
        p.id === pulseId ? { ...p, pinned: !p.pinned } : p
      )
    );
  }, []);

  const value: ScoutContextValue = {
    drafts,
    pulse,
    scoutActivity,
    publishedStories,
    publishedFeedPosts,
    pendingCount,
    editDraft,
    setDraftStatus,
    approveAndPublish,
    publishToFeed,
    rejectDraft,
    snoozeDraft,
    suggestAsStory,
    pinInsight,
  };

  return (
    <ScoutContext.Provider value={value}>{children}</ScoutContext.Provider>
  );
}

export function useScout() {
  const ctx = useContext(ScoutContext);
  if (!ctx) throw new Error("useScout must be used within ScoutProvider");
  return ctx;
}
