"use client";

import type { SortKey } from "@/lib/offer-filters";

function SortArrow({
  direction,
  active,
  onClick,
  label,
}: {
  direction: "up" | "down";
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`rounded p-0.5 leading-none transition ${
        active
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
      }`}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="currentColor"
        aria-hidden
      >
        {direction === "up" ? (
          <path d="M5 1.5 1.5 7h7L5 1.5z" />
        ) : (
          <path d="M5 8.5 8.5 3h-7L5 8.5z" />
        )}
      </svg>
    </button>
  );
}

function SortControls({
  label,
  ascKey,
  descKey,
  sortKey,
  onSort,
  align,
}: {
  label: string;
  ascKey: SortKey;
  descKey: SortKey;
  sortKey: SortKey;
  onSort: (key: SortKey) => void;
  align: "left" | "right";
}) {
  const arrows = (
    <span className="inline-flex shrink-0 flex-col gap-px">
      <SortArrow
        direction="up"
        active={sortKey === ascKey}
        label={`Sort ${label} ascending`}
        onClick={() => onSort(ascKey)}
      />
      <SortArrow
        direction="down"
        active={sortKey === descKey}
        label={`Sort ${label} descending`}
        onClick={() => onSort(descKey)}
      />
    </span>
  );

  if (align === "right") {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <span className="truncate">{label}</span>
        {arrows}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="min-w-0 truncate">{label}</span>
      {arrows}
    </div>
  );
}

export function SortableTableHeader({
  label,
  ascKey,
  descKey,
  sortKey,
  onSort,
  className = "",
  align = "left",
}: {
  label: string;
  ascKey: SortKey;
  descKey: SortKey;
  sortKey: SortKey;
  onSort: (key: SortKey) => void;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`py-2.5 font-medium ${align === "right" ? "text-right" : "text-left"} ${className}`}
    >
      <SortControls
        label={label}
        ascKey={ascKey}
        descKey={descKey}
        sortKey={sortKey}
        onSort={onSort}
        align={align}
      />
    </th>
  );
}

export function SortableTableHeaderLeft({
  label,
  ascKey,
  descKey,
  sortKey,
  onSort,
  className = "",
}: {
  label: string;
  ascKey: SortKey;
  descKey: SortKey;
  sortKey: SortKey;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  return (
    <SortableTableHeader
      label={label}
      ascKey={ascKey}
      descKey={descKey}
      sortKey={sortKey}
      onSort={onSort}
      className={className}
      align="left"
    />
  );
}
