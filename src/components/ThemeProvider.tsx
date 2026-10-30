"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  applyThemeClass,
  DEFAULT_THEME,
  resolveThemeChoice,
  systemPrefersDark,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return DEFAULT_THEME;
}

function subscribeTheme(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("takehome-theme-change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("takehome-theme-change", onStoreChange);
  };
}

function subscribeSystemTheme(onChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    readTheme,
    (): Theme => DEFAULT_THEME,
  );

  const systemDark = useSyncExternalStore(
    subscribeSystemTheme,
    systemPrefersDark,
    (): boolean => false,
  );

  const resolved: "light" | "dark" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyThemeClass(resolveThemeChoice(next));
    window.dispatchEvent(new Event("takehome-theme-change"));
  }, []);

  useEffect(() => {
    applyThemeClass(resolved);
  }, [resolved]);

  const value = useMemo(
    () => ({ theme, resolved, setTheme }),
    [theme, resolved, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
