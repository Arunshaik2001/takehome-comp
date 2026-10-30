import { LogoWordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  return (
    <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 max-w-2xl">
        <LogoWordmark className="mb-5" />
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 sm:text-4xl lg:text-5xl">
          India offer estimates after tax
        </h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          Independent reference · not affiliated with LeetCode
        </p>
      </div>
      <ThemeToggle />
    </div>
  );
}
