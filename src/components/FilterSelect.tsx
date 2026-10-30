"use client";

import type { SelectHTMLAttributes } from "react";

const fieldBase =
  "w-full min-w-0 max-w-full rounded-xl border border-stone-200 bg-white py-2 pl-3 text-sm text-stone-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-emerald-500";

export const filterInputClass = `${fieldBase} px-3`;

export function FilterSelect({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`relative mt-1 min-w-0 ${className}`}>
      <select {...props} className={`${fieldBase} appearance-none pr-10`} />
      <span
        className="pointer-events-none absolute inset-y-0 right-0 flex w-9 shrink-0 items-center justify-center text-stone-500 dark:text-stone-400"
        aria-hidden
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}
