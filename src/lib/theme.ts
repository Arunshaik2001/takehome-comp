export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "takehome-comp-theme";
export const DEFAULT_THEME: Theme = "dark";

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveThemeChoice(theme: Theme): "light" | "dark" {
  if (theme === "system") return systemPrefersDark() ? "dark" : "light";
  return theme;
}

export function applyThemeClass(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}
