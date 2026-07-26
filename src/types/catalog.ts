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

export type WorkspaceItem = {
  id: string;
  name: string;
  description: string;
  projectCode?: string;
  coverUrl: string;
  members: {
    name: string;
    initials: string;
    avatarUrl?: string;
  }[];
  chats: number;
  files: number;
  updatedAt: string;
};
