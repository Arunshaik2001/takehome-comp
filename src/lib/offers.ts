import type { CompensationOffer, OffersDataset } from "@/lib/types";
import dataset from "@/data/offers.json";

type OfferKeyInput = Pick<
  CompensationOffer,
  "id" | "company" | "role" | "baseLpa" | "totalLpa" | "baseUsd" | "totalUsd"
>;

export function makeOfferKey(offer: OfferKeyInput): string {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return [
    offer.id,
    slug(offer.company),
    slug(offer.role),
    offer.baseLpa ?? "b",
    offer.totalLpa ?? "t",
    offer.baseUsd ?? "",
    offer.totalUsd ?? "",
  ].join(":");
}

function withOfferKeys(offers: CompensationOffer[]): CompensationOffer[] {
  return offers.map((o) => ({
    ...o,
    offerKey: o.offerKey ?? makeOfferKey(o),
  }));
}

export function getOffersDataset(): OffersDataset {
  const raw = dataset as OffersDataset;
  const offers = withOfferKeys(raw.offers);
  return { ...raw, offers, offerCount: offers.length };
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function summarizeOffers(offers: CompensationOffer[]) {
  const inr = offers.filter((o) => o.currency === "INR");
  const netMonthly = inr.map((o) => o.takeHome.netMonthly);
  const postedTotal = inr
    .map((o) => o.totalLpa ?? o.baseLpa)
    .filter((v): v is number => v != null);

  return {
    count: offers.length,
    inrCount: inr.length,
    medianNetMonthly: median(netMonthly),
    medianPostedLpa: median(postedTotal),
  };
}
