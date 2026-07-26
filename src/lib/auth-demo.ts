/**
 * Demo access helpers — not real IAM.
 * Gates privileged surfaces (Insights) for the product demo.
 */

import type { AppUser, UserCapability } from "@/types/chat";
import { currentUser } from "@/lib/mock-data";

const STORAGE_KEY = "magnus-demo-capabilities";

/** Read optional capability overrides from session (settings demo toggle). */
export function readCapabilityOverrides(): UserCapability[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((x): x is UserCapability => x === "insights");
  } catch {
    return null;
  }
}

export function writeCapabilityOverrides(caps: UserCapability[] | null): void {
  if (typeof window === "undefined") return;
  if (caps == null) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(caps));
}

export function getDemoUser(): AppUser {
  const overrides = readCapabilityOverrides();
  if (overrides == null) return currentUser;
  return { ...currentUser, capabilities: overrides };
}

export function userHasCapability(
  user: AppUser | null | undefined,
  cap: UserCapability
): boolean {
  return Boolean(user?.capabilities?.includes(cap));
}

export function canAccessInsights(user?: AppUser | null): boolean {
  return userHasCapability(user ?? getDemoUser(), "insights");
}
