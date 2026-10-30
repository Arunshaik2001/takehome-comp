import type { DeductionLine, TakeHomeEstimate } from "@/lib/types";

/** FY 2025–26 new tax regime slabs (₹). */
const SLABS: { upTo: number; rate: number }[] = [
  { upTo: 400_000, rate: 0 },
  { upTo: 800_000, rate: 0.05 },
  { upTo: 1_200_000, rate: 0.1 },
  { upTo: 1_600_000, rate: 0.15 },
  { upTo: 2_000_000, rate: 0.2 },
  { upTo: 2_400_000, rate: 0.25 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.3 },
];

const STANDARD_DEDUCTION = 75_000;
const PROFESSIONAL_TAX_ANNUAL = 2_400;
const PF_WAGE_CEILING_MONTHLY = 15_000;
const PF_RATE = 0.12;

function incomeTaxNewRegime(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  let prev = 0;
  for (const slab of SLABS) {
    const band = Math.min(taxableIncome, slab.upTo) - prev;
    if (band > 0) tax += band * slab.rate;
    prev = slab.upTo;
    if (taxableIncome <= slab.upTo) break;
  }

  if (taxableIncome <= 1_200_000) {
    tax = Math.max(0, tax - 60_000);
  }

  tax *= 1.04;
  return Math.round(tax);
}

function excludedCompLines(
  comp:
    | {
        variableLpa: number | null;
        joiningBonusLpa: number | null;
        stocksLpa: number | null;
      }
    | undefined,
  baseLpa: number | null,
  totalLpa: number | null,
): DeductionLine[] {
  const lines: DeductionLine[] = [];

  if (comp?.variableLpa != null && comp.variableLpa > 0) {
    lines.push({
      id: "variable",
      label: "Variable / annual bonus (not in monthly salary)",
      amountAnnual: comp.variableLpa * 100_000,
      note: "Target or performance pay — not in fixed monthly in-hand",
    });
  }
  if (comp?.stocksLpa != null && comp.stocksLpa > 0) {
    lines.push({
      id: "stocks",
      label: "Stocks (RSU / ESOP — not in monthly salary)",
      amountAnnual: comp.stocksLpa * 100_000,
      note: "Annualized from post; not split into RSU vs ESOP",
    });
  }

  const hasParsed =
    (comp?.variableLpa ?? 0) > 0 ||
    (comp?.joiningBonusLpa ?? 0) > 0 ||
    (comp?.stocksLpa ?? 0) > 0;

  if (
    !hasParsed &&
    totalLpa != null &&
    baseLpa != null &&
    totalLpa > baseLpa
  ) {
    lines.push({
      id: "other-comp",
      label: "Other CTC (not split in post text)",
      amountAnnual: (totalLpa - baseLpa) * 100_000,
      note: "Variable or stocks — not included in monthly in-hand",
    });
  }

  return lines;
}

/** Estimate in-hand from CTC / base figures posted on LeetCode (amounts in LPA). */
export function estimateIndiaTakeHome(params: {
  baseLpa: number | null;
  totalLpa: number | null;
  compComponents?: {
    variableLpa: number | null;
    joiningBonusLpa: number | null;
    stocksLpa: number | null;
  };
}): TakeHomeEstimate {
  const fixedLpa =
    params.baseLpa ?? (params.totalLpa != null ? params.totalLpa * 0.72 : null);

  if (fixedLpa == null) {
    throw new Error("India estimate requires base or total compensation");
  }

  const comp = params.compComponents;
  const joiningAnnual =
    comp?.joiningBonusLpa != null && comp.joiningBonusLpa > 0
      ? comp.joiningBonusLpa * 100_000
      : 0;

  const fixedAnnual = fixedLpa * 100_000;
  const year1CashGross = fixedAnnual + joiningAnnual;

  const basicAnnual = fixedAnnual * 0.4;
  const basicMonthly = basicAnnual / 12;
  const pfWageMonthly = Math.min(basicMonthly, PF_WAGE_CEILING_MONTHLY);
  const employeePfAnnual = Math.round(pfWageMonthly * PF_RATE * 12);

  const taxableBeforeStd =
    year1CashGross - employeePfAnnual - PROFESSIONAL_TAX_ANNUAL;
  const taxableIncome = Math.max(0, taxableBeforeStd - STANDARD_DEDUCTION);
  const incomeTax = incomeTaxNewRegime(taxableIncome);

  const tdsNote =
    joiningAnnual > 0
      ? "Taxable salary includes parsed joining bonus; after ₹75k standard deduction"
      : "After ₹75k standard deduction; excludes HRA/80C beyond PF";

  const lines: DeductionLine[] = [
    {
      id: "pf",
      label: "Employee PF (12%, wage ceiling)",
      amountAnnual: employeePfAnnual,
      note: "Assumes basic ≈ 40% of fixed cash; PF on ₹15k/month ceiling",
    },
    {
      id: "pt",
      label: "Professional tax",
      amountAnnual: PROFESSIONAL_TAX_ANNUAL,
      note: "Typical max in many states (~₹200/month)",
    },
    {
      id: "tds",
      label: "Income tax (TDS, new regime FY25–26)",
      amountAnnual: incomeTax,
      note: tdsNote,
    },
  ];

  if (joiningAnnual > 0) {
    lines.push({
      id: "joining",
      label: "Joining bonus (in year-1 estimate)",
      amountAnnual: joiningAnnual,
      note: "Taxed as salary; included in net and /mo below (spread over 12 months)",
    });
  }

  lines.push(
    ...excludedCompLines(comp, params.baseLpa, params.totalLpa),
  );

  const totalDeductionsAnnual =
    employeePfAnnual + PROFESSIONAL_TAX_ANNUAL + incomeTax;
  const netAnnual = Math.max(0, year1CashGross - totalDeductionsAnnual);

  const disclaimer =
    joiningAnnual > 0
      ? "Year-1 estimate includes parsed joining bonus in taxable income and net pay (monthly figure averages over 12 months). Variable and stock components are excluded from net pay."
      : "Estimated net pay from fixed base salary under simplified India assumptions. Variable and stock components excluded. Actual payslips may differ.";

  return {
    region: "IN",
    currency: "INR",
    grossAnnual: year1CashGross,
    grossMonthly: Math.round(year1CashGross / 12),
    netAnnual,
    netMonthly: Math.round(netAnnual / 12),
    totalDeductionsAnnual,
    effectiveRate:
      year1CashGross > 0 ? totalDeductionsAnnual / year1CashGross : 0,
    lines,
    disclaimer,
  };
}
