import { nonCashCompLines } from "./extract-comp-components.mjs";

function incomeTaxIndia(taxableIncome) {
  const slabs = [
    [400_000, 0],
    [800_000, 0.05],
    [1_200_000, 0.1],
    [1_600_000, 0.15],
    [2_000_000, 0.2],
    [2_400_000, 0.25],
    [Infinity, 0.3],
  ];
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const [upTo, rate] of slabs) {
    const band = Math.min(taxableIncome, upTo) - prev;
    if (band > 0) tax += band * rate;
    prev = upTo;
    if (taxableIncome <= upTo) break;
  }
  if (taxableIncome <= 1_200_000) tax = Math.max(0, tax - 60_000);
  return Math.round(tax * 1.04); // Health & education cess (4% on income tax)
}

export function takeHomeIndia(baseLpa, totalLpa, compComponents) {
  const fixedLpa = baseLpa ?? (totalLpa != null ? totalLpa * 0.72 : null);
  const ctcLpa = totalLpa ?? baseLpa;
  if (fixedLpa == null || ctcLpa == null) return null;

  const joiningAnnual =
    compComponents?.joiningBonusLpa > 0
      ? compComponents.joiningBonusLpa * 100_000
      : 0;

  const fixedAnnual = fixedLpa * 100_000;
  const year1CashGross = fixedAnnual + joiningAnnual;
  const basicMonthly = (fixedAnnual * 0.4) / 12;
  const pfWage = Math.min(basicMonthly, 15_000);
  const employeePf = Math.round(pfWage * 0.12 * 12);
  const pt = 2400;
  const taxable = Math.max(0, year1CashGross - employeePf - pt - 75_000);
  const tds = incomeTaxIndia(taxable);
  const recurring = employeePf + pt + tds;
  const netAnnual = Math.max(0, year1CashGross - recurring);

  const lines = [
    {
      id: "pf",
      label: "Employee PF (12%, wage ceiling)",
      amountAnnual: employeePf,
    },
    { id: "pt", label: "Professional tax", amountAnnual: pt },
    {
      id: "tds",
      label: "Income tax (TDS, new regime FY25–26, incl. 4% cess)",
      amountAnnual: tds,
      note: "Includes 4% health & education cess on slab tax",
    },
  ];

  if (joiningAnnual > 0) {
    lines.push({
      id: "joining",
      label: "Joining bonus (in year-1 estimate)",
      amountAnnual: joiningAnnual,
    });
  }

  lines.push(...nonCashCompLines(compComponents, baseLpa, totalLpa));

  return {
    region: "IN",
    currency: "INR",
    grossAnnual: year1CashGross,
    grossMonthly: Math.round(year1CashGross / 12),
    netAnnual,
    netMonthly: Math.round(netAnnual / 12),
    totalDeductionsAnnual: recurring,
    effectiveRate: year1CashGross > 0 ? recurring / year1CashGross : 0,
    lines,
    disclaimer:
      joiningAnnual > 0
        ? "Year-1 estimate includes parsed joining bonus. Variable and stocks excluded from monthly net."
        : "Estimated net pay from fixed base. Variable and stocks excluded. Illustrative only.",
  };
}
