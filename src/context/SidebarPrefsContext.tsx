"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SIDEBAR_PREFS,
  SIDEBAR_PREFS_KEY,
  moveInOrder,
  normalizeSidebarPrefs,
  type ChatSidebarId,
  type HomeNavId,
  type SidebarPrefs,
} from "@/lib/sidebar-prefs";
import { readJson, writeJson } from "@/lib/persist";

interface SidebarPrefsContextValue {
  prefs: SidebarPrefs;
  hydrated: boolean;
  setHomeVisible: (id: HomeNavId, visible: boolean) => void;
  setChatVisible: (id: ChatSidebarId, visible: boolean) => void;
  moveHome: (id: HomeNavId, delta: -1 | 1) => void;
  moveChat: (id: ChatSidebarId, delta: -1 | 1) => void;
  resetPrefs: () => void;
}

const SidebarPrefsContext = createContext<SidebarPrefsContextValue | null>(
  null
);

export function SidebarPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<SidebarPrefs>(DEFAULT_SIDEBAR_PREFS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = readJson<Partial<SidebarPrefs>>(SIDEBAR_PREFS_KEY);
    setPrefs(normalizeSidebarPrefs(raw));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(SIDEBAR_PREFS_KEY, prefs);
  }, [prefs, hydrated]);

  const setHomeVisible = useCallback((id: HomeNavId, visible: boolean) => {
    if (id === "home") return;
    setPrefs((p) => ({
      ...p,
      homeVisible: { ...p.homeVisible, [id]: visible, home: true },
    }));
  }, []);

  const setChatVisible = useCallback((id: ChatSidebarId, visible: boolean) => {
    setPrefs((p) => ({
      ...p,
      chatVisible: { ...p.chatVisible, [id]: visible },
    }));
  }, []);

  const moveHome = useCallback((id: HomeNavId, delta: -1 | 1) => {
    setPrefs((p) => ({
      ...p,
      homeOrder: moveInOrder(p.homeOrder, id, delta),
    }));
  }, []);

  const moveChat = useCallback((id: ChatSidebarId, delta: -1 | 1) => {
    setPrefs((p) => ({
      ...p,
      chatOrder: moveInOrder(p.chatOrder, id, delta),
    }));
  }, []);

  const resetPrefs = useCallback(() => {
    setPrefs(structuredClone(DEFAULT_SIDEBAR_PREFS));
  }, []);

  const value = useMemo(
    () => ({
      prefs,
      hydrated,
      setHomeVisible,
      setChatVisible,
      moveHome,
      moveChat,
      resetPrefs,
    }),
    [
      prefs,
      hydrated,
      setHomeVisible,
      setChatVisible,
      moveHome,
      moveChat,
      resetPrefs,
    ]
  );

  return (
    <SidebarPrefsContext.Provider value={value}>
      {children}
    </SidebarPrefsContext.Provider>
  );
}

export function useSidebarPrefs() {
  const ctx = useContext(SidebarPrefsContext);
  if (!ctx) {
    throw new Error("useSidebarPrefs must be used within SidebarPrefsProvider");
  }
  return ctx;
}
