/** Team messaging (Slack-like) — separate from Magnus AI ChatThread. */

export type ConversationKind = "channel" | "dm";

export type TeamAuthor = {
  id: string;
  name: string;
  initials: string;
  handle?: string;
  avatarUrl?: string;
  /** Magnus AI bot in-channel */
  isMagnus?: boolean;
};

/** Slack-like emoji reaction on a team message */
export type MessageReaction = {
  emoji: string;
  count: number;
  /** Current user has reacted */
  me?: boolean;
};

/** File attachment metadata (local pick; preview via object URL when available) */
export type MessageAttachment = {
  id: string;
  name: string;
  sizeLabel: string;
  mime: string;
  /** Byte size when known */
  sizeBytes?: number;
  /** Object URL or remote URL for image preview */
  previewUrl?: string;
};

export type TeamMessage = {
  id: string;
  conversationId: string;
  author: TeamAuthor;
  body: string;
  createdAt: string;
  /** Set when the author edited the body */
  editedAt?: string;
  /** True when body mentions @magnus */
  mentionsMagnus?: boolean;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
  /** Nested thread replies (Slack-style) */
  threadReplies?: TeamMessage[];
};

/** Quick-pick reactions for hover bar */
export const QUICK_REACTIONS = ["👍", "👀", "✅", "🎉"] as const;

/** Demo / product purpose — used for walkthrough seed coverage */
export type ConversationPurpose =
  | "company"
  | "project"
  | "safety"
  | "social"
  | "estimating"
  | "dm";

export type Conversation = {
  id: string;
  kind: ConversationKind;
  /** Display name: channel without #, or DM peer name */
  name: string;
  /** Channel slug e.g. general, downtown-tower */
  slug?: string;
  topic?: string;
  /**
   * Optional channel cover/icon image (channels only).
   * DMs resolve portraits from the people directory — do not set on DMs.
   */
  imageUrl?: string;
  /** Seed taxonomy for demos / verification */
  purpose?: ConversationPurpose;
  memberIds: string[];
  unreadCount: number;
  messages: TeamMessage[];
  updatedAt: string;
};

/** Resolved row/header identity for sidebar + messaging chrome */
export type ConversationIdentity = {
  kind: ConversationKind;
  /** Display label: `#general` or peer full name */
  label: string;
  subtitle?: string;
  /** Portrait (DM) or channel cover when present */
  imageUrl?: string;
  /** Initials fallback for DM or channel mark */
  initials: string;
  /** Directory person id for DMs */
  peerId?: string;
  /** True when a channel has imageUrl to show instead of hash */
  hasChannelImage: boolean;
};

export type SendTeamMessageResult = {
  conversations: Conversation[];
  userMessage: TeamMessage;
  /** True when Magnus should reply in this conversation */
  magnusShouldRespond: boolean;
  catchUp: boolean;
};
