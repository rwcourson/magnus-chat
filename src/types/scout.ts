/** Magnus scout / beat-reporter types — Catch me up + Insights story desk. */

export type ScoutSignalClass =
  | "safety"
  | "project"
  | "people"
  | "knowledge"
  | "ops"
  | "silence";

export type DraftStatus = "pending" | "approved" | "rejected" | "snoozed";

export type Confidence = "high" | "medium" | "low";

export type SuggestedChannel = "carousel" | "feed" | "email" | "toolbox";

export type CatchUpWindow = "yesterday" | "week" | "visit";

export interface ScoutSource {
  label: string;
  href?: string;
}

export interface ScoutSignal {
  id: string;
  signalClass: ScoutSignalClass;
  title: string;
  summary: string;
  /** Short why-now for briefs (1 line) */
  whyNow: string;
  whoCares: string;
  sources: ScoutSource[];
  confidence: Confidence;
  category: string;
  imageUrl?: string;
  timeLabel: string;
  window: CatchUpWindow;
  /** Lower = more important */
  rank: number;
  sensitive?: boolean;
  /** Personal “for you” line when this hits the user’s beat */
  forYou?: string;
}

export interface DraftEvidence {
  label: string;
  snippet: string;
  href?: string;
}

/** Story desk draft — human-approved before news slider or company feed. */
export interface HeadlineDraft {
  id: string;
  signalId: string;
  status: DraftStatus;
  headline: string;
  summary: string;
  /** One-line scout reason (high signal) */
  whySurfaced: string;
  evidence: DraftEvidence[];
  confidence: Confidence;
  suggestedChannel: SuggestedChannel;
  category: string;
  imageUrl: string;
  sources: ScoutSource[];
  createdAt: string;
}

/**
 * Leadership pulse card — company-level elevation (not always publishable).
 * Insights surface only.
 */
export interface LeadershipInsight {
  id: string;
  signalId: string;
  signalClass: ScoutSignalClass;
  title: string;
  /** One-line takeaway */
  takeaway: string;
  /** Why leadership should care */
  whyItMatters: string;
  evidence: DraftEvidence[];
  confidence: Confidence;
  category: string;
  timeLabel: string;
  /** e.g. “Seen across 3 surfaces” */
  surfacesLabel: string;
  sensitive?: boolean;
  /** Can IC turn this into a story draft? */
  storyReady?: boolean;
  pinned?: boolean;
}

/** Scout strip chrome for Insights header */
export interface ScoutActivitySummary {
  windowLabel: string;
  scannedCount: number;
  elevatedCount: number;
  storyDraftsReady: number;
  surfacesLabel: string;
  lastScanLabel: string;
}

export interface CatchUpCard {
  id: string;
  title: string;
  /** One-line takeaway */
  whyItMatters: string;
  sources: string[];
  category: string;
  timeLabel: string;
  href?: string;
  confidence?: Confidence;
  /** Personalization line, e.g. “Your project · Downtown tower” */
  forYou?: string;
}

export interface CatchUpBrief {
  windowLabel: string;
  /** e.g. “Robert” */
  firstName?: string;
  greeting: string;
  intro: string;
  cards: CatchUpCard[];
  closing?: string;
  followUps: string[];
  /** Short research chip label */
  scannedLabel: string;
}

export interface DraftEdits {
  headline?: string;
  summary?: string;
  category?: string;
}
