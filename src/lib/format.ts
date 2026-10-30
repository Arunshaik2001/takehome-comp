import type { CompensationOffer, Currency } from "@/lib/types";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number, currency: Currency): string {
  if (currency === "INR") return INR.format(amount);
  if (currency === "USD") return USD.format(amount);
  return `${amount.toLocaleString()} ${currency}`;
}

export function formatLpa(lpa: number): string {
  return `${lpa.toFixed(lpa % 1 === 0 ? 0 : 1)} LPA`;
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function roundLpa(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Posted comp breakdown (INR) with separate variable, joining, and stocks when parsed. */
export function inrCompBreakdown(offer: CompensationOffer) {
  const total = offer.totalLpa ?? offer.baseLpa;
  const base = offer.baseLpa;
  if (total == null) return null;

  const comp = offer.compComponents;
  const variableLpa = comp?.variableLpa ?? null;
  const joiningBonusLpa = comp?.joiningBonusLpa ?? null;
  const stocksLpa = comp?.stocksLpa ?? null;

  const hasSplit =
    variableLpa != null || joiningBonusLpa != null || stocksLpa != null;

  const extraLpa =
    !hasSplit && base != null && total > base + 0.05
      ? roundLpa(total - base)
      : null;

  return {
    totalLpa: total,
    baseLpa: base,
    variableLpa,
    joiningBonusLpa,
    stocksLpa,
    extraLpa,
    hasSplit,
  };
}
