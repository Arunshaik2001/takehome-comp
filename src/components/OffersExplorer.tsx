"use client";

import { Fragment, useMemo, useState } from "react";
import type { CompensationOffer } from "@/lib/types";
import {
  formatDate,
  formatMoney,
  formatPercent,
} from "@/lib/format";
import { DualRangeSlider } from "@/components/DualRangeSlider";
import { FilterSelect, filterInputClass as inputClass } from "@/components/FilterSelect";
import { PostedCompBlock } from "@/components/PostedCompBlock";
import {
  SortableTableHeader,
  SortableTableHeaderLeft,
} from "@/components/SortableTableHeader";
import {
  SORT_LABELS,
  type SortKey,
  buildFilterOptions,
  defaultFilters,
  filterOffers,
  numericBounds,
  postedCtcLpa,
  sortOffers,
} from "@/lib/offer-filters";

const PAGE_SIZES = [25, 50, 100] as const;

/** Shared th/td padding so headers line up with row cells */
const COL = {
  company: {
    th: "px-4 sm:px-6",
    td: "px-4 py-3 sm:px-6",
  },
  posted: {
    th: "px-3",
    td: "px-3 py-3",
  },
  comp: {
    th: "px-3",
    td: "px-3 py-3 align-top",
  },
  inhand: {
    th: "px-3",
    td: "px-3 py-3 text-right font-mono font-medium text-emerald-800 dark:text-emerald-400",
  },
  deduction: {
    th: "px-3 sm:pr-6",
    td: "px-3 py-3 text-right text-stone-600 dark:text-stone-400 sm:pr-6",
  },
} as const;

const labelClass =
  "text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400";

function leetcodeDiscussUrl(topicId: number): string {
  return `https://leetcode.com/discuss/post/${topicId}`;
}

function OfferDetail({ offer }: { offer: CompensationOffer }) {
  const th = offer.takeHome;
  return (
    <div className="animate-expand-in space-y-4 border-t border-stone-200/80 bg-stone-50/90 px-4 py-4 dark:border-stone-700 dark:bg-stone-900/50 sm:px-6">
      <div>
        <p className={labelClass}>Compensation (from post)</p>
        <div className="mt-2 max-w-md rounded-lg border border-stone-200/80 bg-white/60 p-3 dark:border-stone-700 dark:bg-stone-950/40">
          <PostedCompBlock offer={offer} />
          <p className="mt-2 text-[11px] leading-snug text-stone-500 dark:text-stone-400">
            Parsed from the public post when stated. Stock lines combine RSU and
            ESOP-style grants into a single stocks figure.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <p className={labelClass}>Deduction breakdown (annual)</p>
          <ul className="mt-2 space-y-2">
            {th.lines.map((line) => (
              <li
                key={line.id}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <span className="text-stone-800 dark:text-stone-200">
                    {line.label}
                  </span>
                  {line.note ? (
                    <p className="break-words text-xs text-stone-500 dark:text-stone-400">
                      {line.note}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 font-mono text-stone-700 dark:text-stone-300">
                  {formatMoney(line.amountAnnual, th.currency)}
                </span>
              </li>
            ))}
          </ul>
          <a
            href={leetcodeDiscussUrl(offer.leetcodeTopicId)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex text-xs font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            onClick={(e) => e.stopPropagation()}
          >
            View source on LeetCode Discuss
          </a>
        </div>
        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/80 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/40">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/70 dark:text-emerald-300/80">
            Estimated net pay
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-emerald-900 dark:text-emerald-100">
            {formatMoney(th.netMonthly, th.currency)}
            <span className="text-base font-normal text-emerald-800/80 dark:text-emerald-300/70">
              {" "}
              / mo
            </span>
          </p>
          <p className="mt-1 font-mono text-sm text-emerald-800 dark:text-emerald-200">
            {formatMoney(th.netAnnual, th.currency)} / yr
          </p>
          <p className="mt-3 text-xs leading-relaxed text-emerald-900/70 dark:text-emerald-200/60">
            {th.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  open,
  onToggle,
}: {
  offer: CompensationOffer;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      className={`rounded-xl border p-4 transition-all duration-200 md:hidden ${
        open
          ? "border-emerald-300/60 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/20"
          : "border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
      }`}
    >
      <button
        type="button"
        className="w-full text-left"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-stone-900 dark:text-stone-50">
              {offer.company}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">
              {offer.role}
              {offer.location ? ` · ${offer.location}` : ""}
            </p>
          </div>
          <span
            className={`shrink-0 text-stone-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▾
          </span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-stone-500">Posted comp</p>
            <div className="mt-1">
              <PostedCompBlock offer={offer} compact />
            </div>
          </div>
          <div>
            <p className="text-xs text-stone-500">Est. in-hand</p>
            <p className="mt-1 font-mono text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {formatMoney(offer.takeHome.netMonthly, offer.takeHome.currency)}/mo
            </p>
          </div>
        </div>
      </button>
      {open ? (
        <div className="mt-3 border-t border-stone-200 pt-3 dark:border-stone-700">
          <OfferDetail offer={offer} />
        </div>
      ) : null}
    </article>
  );
}

export function OffersExplorer({ offers }: { offers: CompensationOffer[] }) {
  const [filters, setFilters] = useState(defaultFilters);
  const [sortKey, setSortKey] = useState<SortKey>("date-desc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(25);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const { companies, locations } = useMemo(
    () => buildFilterOptions(offers, "IN"),
    [offers],
  );

  const ctcBounds = useMemo(
    () => numericBounds(offers, postedCtcLpa, { min: 0, max: 150 }),
    [offers],
  );
  const yoeBounds = useMemo(
    () => numericBounds(offers, (o) => o.yoe, { min: 0, max: 15 }),
    [offers],
  );

  const ctcLow = filters.minCtc
    ? parseFloat(filters.minCtc)
    : ctcBounds.min;
  const ctcHigh = filters.maxCtc
    ? parseFloat(filters.maxCtc)
    : ctcBounds.max;
  const yoeLow = filters.minYoe ? parseFloat(filters.minYoe) : yoeBounds.min;
  const yoeHigh = filters.maxYoe ? parseFloat(filters.maxYoe) : yoeBounds.max;

  const setCtcRange = (low: number, high: number) => {
    setFilters((f) => ({
      ...f,
      minCtc: low <= ctcBounds.min + 0.01 ? "" : String(low),
      maxCtc: high >= ctcBounds.max - 0.01 ? "" : String(high),
    }));
    setPage(1);
    setExpanded(null);
  };

  const setYoeRange = (low: number, high: number) => {
    setFilters((f) => ({
      ...f,
      minYoe: low <= yoeBounds.min + 0.01 ? "" : String(low),
      maxYoe: high >= yoeBounds.max - 0.01 ? "" : String(high),
    }));
    setPage(1);
    setExpanded(null);
  };

  const applySort = (key: SortKey) => {
    setSortKey(key);
    setPage(1);
  };

  const companySelectValue = companies.includes(filters.company)
    ? filters.company
    : "";
  const locationSelectValue = locations.includes(filters.location)
    ? filters.location
    : "";

  const filtered = useMemo(
    () =>
      sortOffers(
        filterOffers(offers, {
          ...filters,
          region: "IN",
          company: companySelectValue,
          location: locationSelectValue,
        }),
        sortKey,
      ),
    [offers, filters, sortKey, companySelectValue, locationSelectValue],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageOffers = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const updateFilter = <K extends keyof typeof filters>(
    key: K,
    value: (typeof filters)[K],
  ) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
    setExpanded(null);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSortKey("date-desc");
    setPage(1);
  };

  const activeFilterCount = [
    filters.query,
    filters.company,
    filters.location,
    filters.minCtc,
    filters.maxCtc,
    filters.minYoe,
    filters.maxYoe,
  ].filter(Boolean).length;

  return (
    <section className="min-w-0 rounded-2xl border border-stone-200/90 bg-white shadow-sm shadow-stone-200/40 dark:border-stone-700 dark:bg-stone-900 dark:shadow-none">
      <div className="border-b border-stone-100 px-4 py-4 dark:border-stone-800 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            India compensation reports
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {filtered.length} results · page {safePage} of {totalPages}
          </p>
        </div>
      </div>

      <div className="border-b border-stone-100 px-4 py-3 dark:border-stone-800 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="Search company, role, city…"
            value={filters.query}
            onChange={(e) => updateFilter("query", e.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="shrink-0 rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium transition hover:bg-stone-50 dark:border-stone-600 dark:hover:bg-stone-800"
          >
            {filtersOpen ? "Hide" : "Show"} filters
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>
      </div>

      {filtersOpen ? (
        <div className="animate-fade-in border-b border-stone-100 px-4 py-4 dark:border-stone-800 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block min-w-0">
              <span className={labelClass}>Company</span>
              <FilterSelect
                value={companySelectValue}
                onChange={(e) => updateFilter("company", e.target.value)}
              >
                <option value="">All companies</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </FilterSelect>
            </label>
            <label className="block min-w-0">
              <span className={labelClass}>Location</span>
              <FilterSelect
                value={locationSelectValue}
                onChange={(e) => updateFilter("location", e.target.value)}
              >
                <option value="">All locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </FilterSelect>
            </label>
            <div className="min-w-0 sm:col-span-2">
              <DualRangeSlider
                label="CTC range (LPA)"
                domainMin={ctcBounds.min}
                domainMax={ctcBounds.max}
                step={0.5}
                low={ctcLow}
                high={ctcHigh}
                onChange={setCtcRange}
                unit=" LPA"
              />
            </div>
            <div className="min-w-0 sm:col-span-2">
              <DualRangeSlider
                label="Experience (YOE)"
                domainMin={yoeBounds.min}
                domainMax={yoeBounds.max}
                step={0.5}
                low={yoeLow}
                high={yoeHigh}
                onChange={setYoeRange}
                unit=" yrs"
              />
            </div>
            <label className="block min-w-0 md:hidden">
              <span className={labelClass}>Sort (mobile)</span>
              <FilterSelect
                value={sortKey}
                onChange={(e) => applySort(e.target.value as SortKey)}
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </FilterSelect>
            </label>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 text-sm font-medium text-stone-600 underline-offset-2 hover:underline dark:text-stone-400"
          >
            Reset all filters
          </button>
        </div>
      ) : null}

      <div className="space-y-3 p-4 md:hidden">
        {pageOffers.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-500 dark:text-stone-400">
            No offers match your filters.
          </p>
        ) : (
          pageOffers.map((offer) => (
            <OfferCard
              key={offer.offerKey}
              offer={offer}
              open={expanded === offer.offerKey}
              onToggle={() =>
                setExpanded(
                  expanded === offer.offerKey ? null : offer.offerKey,
                )
              }
            />
          ))
        )}
      </div>

      <div className="hidden min-w-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col className="w-[32%]" />
              <col className="w-[12%]" />
              <col className="w-[30%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500 dark:bg-stone-950 dark:text-stone-400">
              <tr>
                <SortableTableHeaderLeft
                  label="Company"
                  ascKey="company-asc"
                  descKey="company-desc"
                  sortKey={sortKey}
                  onSort={applySort}
                  className={COL.company.th}
                />
                <SortableTableHeader
                  label="Posted"
                  ascKey="date-asc"
                  descKey="date-desc"
                  sortKey={sortKey}
                  onSort={applySort}
                  className={COL.posted.th}
                />
                <SortableTableHeader
                  label="Posted comp"
                  ascKey="ctc-asc"
                  descKey="ctc-desc"
                  sortKey={sortKey}
                  onSort={applySort}
                  className={COL.comp.th}
                />
                <SortableTableHeader
                  label="In-hand"
                  ascKey="inhand-asc"
                  descKey="inhand-desc"
                  sortKey={sortKey}
                  onSort={applySort}
                  className={COL.inhand.th}
                  align="right"
                />
                <SortableTableHeader
                  label="Deductions"
                  ascKey="deduction-asc"
                  descKey="deduction-desc"
                  sortKey={sortKey}
                  onSort={applySort}
                  className={COL.deduction.th}
                  align="right"
                />
              </tr>
            </thead>
            <tbody>
              {pageOffers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-stone-500 dark:text-stone-400"
                  >
                    No offers match your filters.
                  </td>
                </tr>
              ) : (
                pageOffers.map((offer) => {
                  const open = expanded === offer.offerKey;
                  return (
                    <Fragment key={offer.offerKey}>
                      <tr
                        onClick={() =>
                          setExpanded(open ? null : offer.offerKey)
                        }
                        className={`cursor-pointer border-t border-stone-100 transition-colors duration-150 dark:border-stone-800 ${
                          open
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                            : "hover:bg-stone-50/80 dark:hover:bg-stone-800/40"
                        }`}
                      >
                        <td className={COL.company.td}>
                          <div className="truncate font-medium text-stone-900 dark:text-stone-50">
                            {offer.company}
                          </div>
                          <div className="truncate text-xs text-stone-500 dark:text-stone-400">
                            {offer.role}
                            {offer.location ? ` · ${offer.location}` : ""}
                            {offer.yoe != null ? ` · ${offer.yoe}y` : ""}
                          </div>
                        </td>
                        <td
                          className={`${COL.posted.td} text-stone-600 dark:text-stone-400`}
                        >
                          {formatDate(offer.postedAt)}
                        </td>
                        <td className={COL.comp.td}>
                          <PostedCompBlock offer={offer} compact />
                        </td>
                        <td className={COL.inhand.td}>
                          {formatMoney(
                            offer.takeHome.netMonthly,
                            offer.takeHome.currency,
                          )}
                          <span className="text-xs font-normal text-stone-500">
                            /mo
                          </span>
                        </td>
                        <td className={COL.deduction.td}>
                          {formatPercent(offer.takeHome.effectiveRate)}
                        </td>
                      </tr>
                      {open ? (
                        <tr>
                          <td colSpan={5} className="p-0">
                            <OfferDetail offer={offer} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-stone-100 px-4 py-3 dark:border-stone-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Select a row for deductions and net pay detail. Sort columns using the
          header controls.
        </p>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <span className="text-xs uppercase tracking-wide">Per page</span>
            <FilterSelect
              className="!mt-0 w-[7rem]"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number]);
                setPage(1);
              }}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </FilterSelect>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm transition enabled:hover:bg-stone-50 disabled:opacity-40 dark:border-stone-600 dark:enabled:hover:bg-stone-800"
            >
              Previous
            </button>
            <span className="min-w-[4rem] text-center text-sm tabular-nums text-stone-600 dark:text-stone-400">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm transition enabled:hover:bg-stone-50 disabled:opacity-40 dark:border-stone-600 dark:enabled:hover:bg-stone-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
