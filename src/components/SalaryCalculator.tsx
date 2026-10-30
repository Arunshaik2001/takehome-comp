"use client";

import { useMemo, useState } from "react";
import { estimateIndiaTakeHome } from "@/lib/tax/india";
import { formatLpa, formatMoney, formatPercent } from "@/lib/format";

const inputClass =
  "mt-1.5 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 py-2.5 font-mono text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100";

export function SalaryCalculator() {
  const [baseLpa, setBaseLpa] = useState("35");
  const [totalLpa, setTotalLpa] = useState("48");

  const result = useMemo(() => {
    const base = parseFloat(baseLpa);
    const total = parseFloat(totalLpa);
    if (Number.isNaN(base) && Number.isNaN(total)) return null;
    try {
      return estimateIndiaTakeHome({
        baseLpa: Number.isNaN(base) ? null : base,
        totalLpa: Number.isNaN(total) ? null : total,
      });
    } catch {
      return null;
    }
  }, [baseLpa, totalLpa]);

  return (
    <section className="h-full rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm shadow-stone-200/40 transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-900 dark:shadow-none">
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
        Salary estimator (India)
      </h2>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Uses fixed base and total CTC (LPA). Illustrative only—not a substitute
        for payslip or tax advice.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block min-w-0 text-sm">
          <span className="font-medium text-stone-700 dark:text-stone-300">
            Base (LPA)
          </span>
          <input
            type="number"
            step="0.5"
            value={baseLpa}
            onChange={(e) => setBaseLpa(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block min-w-0 text-sm">
          <span className="font-medium text-stone-700 dark:text-stone-300">
            Total CTC (LPA)
          </span>
          <input
            type="number"
            step="0.5"
            value={totalLpa}
            onChange={(e) => setTotalLpa(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {result ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="animate-fade-in rounded-xl bg-stone-50 p-4 dark:bg-stone-950">
            <p className="text-xs uppercase tracking-wide text-stone-500">
              Posted total
            </p>
            <p className="mt-1 font-mono text-xl font-semibold text-stone-900 dark:text-stone-100">
              {totalLpa ? formatLpa(parseFloat(totalLpa)) : "—"}
            </p>
          </div>
          <div className="animate-fade-in rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/50">
            <p className="text-xs uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/80">
              Est. in-hand
            </p>
            <p className="mt-1 font-mono text-xl font-semibold text-emerald-900 dark:text-emerald-100">
              {formatMoney(result.netMonthly, "INR")}
              <span className="text-sm font-normal"> /mo</span>
            </p>
          </div>
          <div className="animate-fade-in rounded-xl bg-amber-50 p-4 dark:bg-amber-950/40">
            <p className="text-xs uppercase tracking-wide text-amber-800/70 dark:text-amber-200/70">
              Deductions on fixed
            </p>
            <p className="mt-1 font-mono text-xl font-semibold text-amber-950 dark:text-amber-100">
              {formatPercent(result.effectiveRate)}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
