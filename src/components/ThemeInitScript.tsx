import { THEME_STORAGE_KEY } from "@/lib/theme";

const themeInitScript = `
(function () {
  try {
    var key = ${JSON.stringify(THEME_STORAGE_KEY)};
    var stored = localStorage.getItem(key);
    var theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    var resolved =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light";
    var root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
  } catch (e) {}
})();
`.trim();

export function ThemeInitScript() {
  return (
    <script
      id="theme-init"
      dangerouslySetInnerHTML={{ __html: themeInitScript }}
    />
  );
}
