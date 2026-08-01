"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "dark" | "magnus" | "light";

/** Default on first visit (no stored preference). */
export const DEFAULT_THEME: Theme = "magnus";

/** Cycle order for sidebar / command palette toggle. */
export const THEME_CYCLE: Theme[] = ["magnus", "dark", "light"];

export function nextTheme(current: Theme): Theme {
  const i = THEME_CYCLE.indexOf(current);
  return THEME_CYCLE[(i + 1) % THEME_CYCLE.length]!;
}

export function isDarkTheme(theme: Theme): boolean {
  return theme === "dark" || theme === "magnus";
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = "magnus-theme";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "magnus";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Init from storage when available so intro/app match without a dark→light flash
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setThemeState(readStoredTheme());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", isDarkTheme(theme));
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("magnus", theme === "magnus");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme, ready]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => {
    setThemeState((t) => nextTheme(t));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
