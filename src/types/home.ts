/** Intranet home surface — presentation demo data. */

export type NewsStory = {
  id: string;
  title: string;
  summary: string;
  category: string;
  imageUrl: string;
  href: string;
  /** e.g. "2h", "Today" */
  timeLabel: string;
  /** Optional personalization hint */
  reason?: string;
};

export type ActionTile = {
  id: string;
  label: string;
  detail: string;
  /** Red badge count when action is needed */
  badge?: number;
  href: string;
  /** Short glyph / initials fallback */
  mark: string;
  /** Brand mark path under /public (preferred over initials) */
  logoUrl?: string;
  /** Fallback brand color when logo fails */
  brandColor?: string;
  accent: string;
};

export type AppMode = "home" | "chat";
