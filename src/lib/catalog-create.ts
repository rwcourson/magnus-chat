/**
 * Pure builders for demo catalog create actions.
 * Used by Routines / Workspaces / Skills QoL CTAs and unit tests.
 */

import type { RoutineItem, SkillItem, WorkspaceItem } from "@/types/catalog";
import { currentUser } from "@/lib/mock-data";

export type CreateRoutineInput = {
  name: string;
  description?: string;
  schedule?: string;
  id?: string;
};

export type CreateWorkspaceInput = {
  name: string;
  description?: string;
  projectCode?: string;
  id?: string;
};

export type CreateSkillInput = {
  name: string;
  description?: string;
  category?: string;
  id?: string;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Build a routine row from form fields (demo-local). */
export function createRoutineItem(input: CreateRoutineInput): RoutineItem | null {
  const name = input.name.trim();
  if (!name) return null;
  const description =
    input.description?.trim() ||
    "Custom automation you added in the demo — runs on the schedule below.";
  const schedule = input.schedule?.trim() || "Weekdays · 7:00 AM";
  return {
    id: input.id ?? uid("routine"),
    name,
    description,
    schedule,
    active: true,
    imageUrl:
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=480&fit=crop",
    owner: {
      name: currentUser.name,
      initials: currentUser.initials || initialsFromName(currentUser.name),
    },
    lastRun: "Never",
  };
}

/** Build a workspace row from form fields (demo-local). */
export function createWorkspaceItem(
  input: CreateWorkspaceInput
): WorkspaceItem | null {
  const name = input.name.trim();
  if (!name) return null;
  const description =
    input.description?.trim() ||
    "Shared chats, files, and people for this job or team.";
  const code =
    input.projectCode?.trim() ||
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 6) ||
    "NEW";
  return {
    id: input.id ?? uid("ws"),
    name,
    description,
    projectCode: code,
    coverUrl:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=480&fit=crop",
    members: [
      {
        name: currentUser.name,
        initials: currentUser.initials || initialsFromName(currentUser.name),
      },
    ],
    chats: 0,
    files: 0,
    updatedAt: new Date().toISOString(),
  };
}

/** Build a skill card from form fields (demo-local). */
export function createSkillItem(input: CreateSkillInput): SkillItem | null {
  const name = input.name.trim();
  if (!name) return null;
  const description =
    input.description?.trim() ||
    "Custom agent skill you created in the demo. Pin it for one-click starts.";
  const category = input.category?.trim() || "Custom";
  return {
    id: input.id ?? uid("skill"),
    name,
    description,
    category,
    imageUrl:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=480&fit=crop",
    author: {
      name: currentUser.name,
      initials: currentUser.initials || initialsFromName(currentUser.name),
    },
    uses: 0,
    pinned: true,
  };
}

/** Prepend a new item; skips null; replaces same id. */
export function prependCatalogItem<T extends { id: string }>(
  list: T[],
  item: T | null
): T[] {
  if (!item) return list;
  return [item, ...list.filter((x) => x.id !== item.id)];
}
