import type { CompensationOffer } from "@/lib/types";

export type SortKey =
  | "date-desc"
  | "date-asc"
  | "ctc-desc"
  | "ctc-asc"
  | "inhand-desc"
  | "inhand-asc"
  | "company-asc"
  | "company-desc"
  | "yoe-desc"
  | "yoe-asc"
  | "deduction-desc"
  | "deduction-asc";

export interface OfferFilters {
  query: string;
  region: "ALL" | "IN" | "US";
  company: string;
  location: string;
  minCtc: string;
  maxCtc: string;
  minYoe: string;
  maxYoe: string;
}

export const defaultFilters: OfferFilters = {
  query: "",
  region: "IN",
  company: "",
  location: "",
  minCtc: "",
  maxCtc: "",
  minYoe: "",
  maxYoe: "",
};

export function postedCtcLpa(offer: CompensationOffer): number | null {
  if (offer.currency === "INR") {
    return offer.totalLpa ?? offer.baseLpa;
  }
  const usd = offer.totalUsd ?? offer.baseUsd;
  if (usd == null) return null;
  return usd / 1000;
}

export function uniqueSorted(values: string[], limit = 200): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  ).slice(0, limit);
}

export function buildFilterOptions(
  offers: CompensationOffer[],
  region: OfferFilters["region"] = "ALL",
) {
  const scoped =
    region === "ALL" ? offers : offers.filter((o) => o.region === region);
  return {
    companies: uniqueSorted(scoped.map((o) => o.company)),
    locations: uniqueSorted(scoped.map((o) => o.location)),
  };
}

export function countByRegion(offers: CompensationOffer[]) {
  let inCount = 0;
  let usCount = 0;
  for (const o of offers) {
    if (o.region === "IN") inCount++;
    else if (o.region === "US") usCount++;
  }
  return { IN: inCount, US: usCount, ALL: offers.length };
}

function matchesQuery(offer: CompensationOffer, q: string): boolean {
  if (!q.trim()) return true;
  const hay = `${offer.company} ${offer.role} ${offer.location}`.toLowerCase();
  return hay.includes(q.trim().toLowerCase());
}

export function filterOffers(
  offers: CompensationOffer[],
  filters: OfferFilters,
): CompensationOffer[] {
  const minCtc = filters.minCtc ? parseFloat(filters.minCtc) : null;
  const maxCtc = filters.maxCtc ? parseFloat(filters.maxCtc) : null;
  const minYoe = filters.minYoe ? parseFloat(filters.minYoe) : null;
  const maxYoe = filters.maxYoe ? parseFloat(filters.maxYoe) : null;

  return offers.filter((o) => {
    if (filters.region !== "ALL" && o.region !== filters.region) return false;
    if (filters.company && o.company !== filters.company) return false;
    if (filters.location && o.location !== filters.location) return false;
    if (!matchesQuery(o, filters.query)) return false;

    const ctc = postedCtcLpa(o);
    if (minCtc != null && !Number.isNaN(minCtc)) {
      if (ctc == null || ctc < minCtc) return false;
    }
    if (maxCtc != null && !Number.isNaN(maxCtc)) {
      if (ctc == null || ctc > maxCtc) return false;
    }
    if (minYoe != null && !Number.isNaN(minYoe)) {
      if (o.yoe == null || o.yoe < minYoe) return false;
    }
    if (maxYoe != null && !Number.isNaN(maxYoe)) {
      if (o.yoe == null || o.yoe > maxYoe) return false;
    }
    return true;
  });
}

export function sortOffers(
  offers: CompensationOffer[],
  sortKey: SortKey,
): CompensationOffer[] {
  const sorted = [...offers];
  const byDate = (a: CompensationOffer, b: CompensationOffer) =>
    new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
  const byCompany = (a: CompensationOffer, b: CompensationOffer) =>
    a.company.localeCompare(b.company);
  const byCtc = (a: CompensationOffer, b: CompensationOffer) =>
    (postedCtcLpa(a) ?? -1) - (postedCtcLpa(b) ?? -1);
  const byInHand = (a: CompensationOffer, b: CompensationOffer) =>
    a.takeHome.netMonthly - b.takeHome.netMonthly;
  const byYoe = (a: CompensationOffer, b: CompensationOffer) =>
    (a.yoe ?? -1) - (b.yoe ?? -1);

  const byDeduction = (a: CompensationOffer, b: CompensationOffer) =>
    a.takeHome.effectiveRate - b.takeHome.effectiveRate;

  switch (sortKey) {
    case "date-asc":
      return sorted.sort(byDate);
    case "date-desc":
      return sorted.sort((a, b) => -byDate(a, b));
    case "company-asc":
      return sorted.sort(byCompany);
    case "company-desc":
      return sorted.sort((a, b) => -byCompany(a, b));
    case "ctc-asc":
      return sorted.sort(byCtc);
    case "ctc-desc":
      return sorted.sort((a, b) => -byCtc(a, b));
    case "inhand-asc":
      return sorted.sort(byInHand);
    case "inhand-desc":
      return sorted.sort((a, b) => -byInHand(a, b));
    case "yoe-desc":
      return sorted.sort((a, b) => -byYoe(a, b));
    case "yoe-asc":
      return sorted.sort(byYoe);
    case "deduction-asc":
      return sorted.sort(byDeduction);
    case "deduction-desc":
      return sorted.sort((a, b) => -byDeduction(a, b));
    default:
      return sorted;
  }
}

export function numericBounds(
  offers: CompensationOffer[],
  pick: (o: CompensationOffer) => number | null,
  fallback: { min: number; max: number },
) {
  const values = offers.map(pick).filter((v): v is number => v != null);
  if (!values.length) return fallback;
  return {
    min: Math.floor(Math.min(...values)),
    max: Math.ceil(Math.max(...values)),
  };
}

export const SORT_LABELS: Record<SortKey, string> = {
  "date-desc": "Newest first",
  "date-asc": "Oldest first",
  "ctc-desc": "Highest CTC",
  "ctc-asc": "Lowest CTC",
  "inhand-desc": "Highest in-hand",
  "inhand-asc": "Lowest in-hand",
  "company-asc": "Company A–Z",
  "company-desc": "Company Z–A",
  "yoe-desc": "Most experience",
  "yoe-asc": "Least experience",
  "deduction-desc": "Highest deductions",
  "deduction-asc": "Lowest deductions",
};
