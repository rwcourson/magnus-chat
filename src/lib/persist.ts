/** localStorage helpers with safe fallbacks for demo persistence. */

export function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export function readString(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export const PERSIST_KEYS = {
  chats: "magnus-chats-v1",
  activeChat: "magnus-active-chat-v1",
  /** Last Chat-mode surface — /messages, /?chat=id, /skills, etc. */
  lastChatPath: "magnus-last-chat-path-v1",
  sidebarCollapsed: "magnus-sidebar-collapsed-v1",
  bookmarks: "magnus-feed-bookmarks-v1",
  sidebarPrefs: "magnus-sidebar-prefs-v1",
} as const;
