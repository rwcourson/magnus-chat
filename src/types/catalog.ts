/** Demo catalog shapes for Integrations, Skills, Routines, Workspaces. */

export type IntegrationStatus = "connected" | "available" | "pending";

export type IntegrationItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  /** Logo image URL (simpleicons / clearbit-style demo assets) */
  logoUrl: string;
  /** Fallback brand hex when logo fails */
  brandColor: string;
  status: IntegrationStatus;
  badge?: number;
};

export type SkillItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  /** Cover / illustration */
  imageUrl: string;
  author: {
    name: string;
    initials: string;
    avatarUrl?: string;
  };
  uses: number;
  pinned?: boolean;
};

export type RoutineItem = {
  id: string;
  name: string;
  description: string;
  schedule: string;
  active: boolean;
  imageUrl: string;
  owner: {
    name: string;
    initials: string;
    avatarUrl?: string;
  };
  lastRun?: string;
};

/** Scoped chat/thread inside a project workspace entity. */
export type WorkspaceChatEntry = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messageCount?: number;
};

/** File / document row for a workspace entity. */
export type WorkspaceFileEntry = {
  id: string;
  name: string;
  kind: string;
  updatedAt: string;
  sizeLabel?: string;
};

/** Recent activity on a workspace entity. */
export type WorkspaceActivityEntry = {
  id: string;
  summary: string;
  at: string;
  actor?: string;
};

export type WorkspaceMember = {
  name: string;
  initials: string;
  avatarUrl?: string;
  role?: string;
};

/**
 * Project workspace entity — list summary + nested chats, files, activity.
 * `chats` / `files` counts stay for list chrome; entity arrays are source of truth when present.
 */
export type WorkspaceItem = {
  id: string;
  name: string;
  description: string;
  projectCode?: string;
  coverUrl: string;
  members: WorkspaceMember[];
  chats: number;
  files: number;
  updatedAt: string;
  chatEntries?: WorkspaceChatEntry[];
  fileEntries?: WorkspaceFileEntry[];
  activity?: WorkspaceActivityEntry[];
};
