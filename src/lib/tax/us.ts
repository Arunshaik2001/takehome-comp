import type { DeductionLine, TakeHomeEstimate } from "@/lib/types";

/** 2024 federal brackets, single filer (USD). */
const FEDERAL_BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 11_600, rate: 0.1 },
  { upTo: 47_150, rate: 0.12 },
  { upTo: 100_525, rate: 0.22 },
  { upTo: 191_950, rate: 0.24 },
  { upTo: 243_725, rate: 0.32 },
  { upTo: 609_350, rate: 0.35 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
];

const SS_WAGE_BASE = 168_600;
const SS_RATE = 0.062;
const MEDICARE_RATE = 0.0145;
const STANDARD_DEDUCTION = 14_600;

function federalTax(taxable: number): number {
  if (taxable <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const b of FEDERAL_BRACKETS) {
    const band = Math.min(taxable, b.upTo) - prev;
    if (band > 0) tax += band * b.rate;
    prev = b.upTo;
    if (taxable <= b.upTo) break;
  }
  return Math.round(tax);
}

export function estimateUsTakeHome(params: {
  totalUsd: number;
  stateRate?: number;
}): TakeHomeEstimate {
  const grossAnnual = params.totalUsd;
  const ss = Math.min(grossAnnual, SS_WAGE_BASE) * SS_RATE;
  const medicare = grossAnnual * MEDICARE_RATE;
  const taxable = Math.max(0, grossAnnual - STANDARD_DEDUCTION - ss - medicare);
  const fed = federalTax(taxable);
  const stateRate = params.stateRate ?? 0.05;
  const stateTax = Math.round(taxable * stateRate);

  const lines: DeductionLine[] = [
    { id: "ss", label: "Social Security (employee)", amountAnnual: Math.round(ss) },
    { id: "medicare", label: "Medicare (employee)", amountAnnual: Math.round(medicare) },
    { id: "fed", label: "Federal income tax (est.)", amountAnnual: fed },
    {
      id: "state",
      label: "State income tax (est.)",
      amountAnnual: stateTax,
      note: `Flat ${(stateRate * 100).toFixed(1)}% placeholder — set per state later`,
    },
  ];

  const totalDeductions = lines.reduce((s, l) => s + l.amountAnnual, 0);
  const netAnnual = Math.max(0, grossAnnual - totalDeductions);

  return {
    region: "US",
    currency: "USD",
    grossAnnual,
    grossMonthly: Math.round(grossAnnual / 12),
    netAnnual,
    netMonthly: Math.round(netAnnual / 12),
    totalDeductionsAnnual: totalDeductions,
    effectiveRate: grossAnnual > 0 ? totalDeductions / grossAnnual : 0,
    lines,
    disclaimer:
      "Rough US estimate (single filer). Excludes 401(k), HSA, stock vesting timing, and local taxes.",
  };
}
