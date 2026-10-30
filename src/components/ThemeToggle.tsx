"use client";

import { useTheme } from "@/components/ThemeProvider";

const options = [
  { id: "light" as const, label: "Light", icon: "☀️" },
  { id: "dark" as const, label: "Dark", icon: "🌙" },
  { id: "system" as const, label: "Auto", icon: "💻" },
];

export function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme();

  return (
    <div className="relative z-20 shrink-0">
      <div
        className="inline-flex rounded-full border border-stone-200/80 bg-white/90 p-0.5 shadow-sm backdrop-blur dark:border-stone-600 dark:bg-stone-900/90"
        role="group"
        aria-label="Color theme"
      >
        {options.map((opt) => {
          const selected = theme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              title={`${opt.label}${opt.id === "system" ? ` (${resolved})` : ""}`}
              aria-pressed={selected}
              onClick={() => setTheme(opt.id)}
              className={`rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                selected
                  ? "bg-stone-900 text-white shadow-sm dark:bg-stone-100 dark:text-stone-900"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              }`}
            >
              <span className="sr-only">{opt.label}</span>
              <span aria-hidden>{opt.icon}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-right text-[10px] uppercase tracking-wide text-stone-500 dark:text-stone-500">
        Active: {resolved}
      </p>
    </div>
  );
}
