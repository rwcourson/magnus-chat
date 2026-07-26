/** Social-style news feed post shape (presentation-only demo). */

export type FeedReaction = {
  type: "like" | "insight" | "bookmark";
  count: number;
  active?: boolean;
};

export type FeedMedia =
  | { kind: "image"; src: string; alt: string }
  | { kind: "video"; src: string; poster?: string; alt?: string }
  | {
      kind: "link";
      url: string;
      title: string;
      domain: string;
      /** Optional preview image (defaults to /og.png for Magnus links) */
      imageUrl?: string;
    };

/** Media attachable to a comment or reply (no link cards). */
export type CommentMedia =
  | { kind: "image"; src: string; alt: string }
  | { kind: "video"; src: string; poster?: string; alt?: string };

export type FeedAuthor = {
  name: string;
  handle: string;
  role?: string;
  office?: string;
  initials: string;
  /** Optional portrait URL */
  avatarUrl?: string;
  verified?: boolean;
};

/** A comment or nested reply on a feed post (demo / local state). */
export type FeedComment = {
  id: string;
  postId: string;
  /** When set, this is a reply under another comment */
  parentId?: string;
  author: FeedAuthor;
  body: string;
  /** ISO timestamp */
  createdAt: string;
  media?: CommentMedia;
};

export type FeedCategory =
  | "company"
  | "project"
  | "safety"
  | "people"
  | "insight";

export type FeedPost = {
  id: string;
  author: FeedAuthor;
  /** ISO timestamp */
  createdAt: string;
  body: string;
  /** Optional short headline above body */
  headline?: string;
  tags?: string[];
  media?: FeedMedia;
  reactions: FeedReaction[];
  comments: number;
  shares: number;
  /** Seed comments shown when the thread opens (flat list; nest via parentId) */
  commentList?: FeedComment[];
  /** Category for filter chips */
  category: FeedCategory;
};

/** Composer field bag for creating a new timeline post. */
export type FeedComposerInput = {
  body: string;
  headline?: string;
  category?: FeedCategory;
  tags?: string[];
  media?: FeedMedia;
  author: FeedAuthor;
  /** Optional fixed id / createdAt for tests */
  id?: string;
  createdAt?: string;
};
