import type { Currency, Region, TakeHomeEstimate } from "@/lib/types";
import { estimateIndiaTakeHome } from "@/lib/tax/india";
import { estimateUsTakeHome } from "@/lib/tax/us";

export function regionForCurrency(currency: Currency): Region {
  if (currency === "INR") return "IN";
  if (currency === "USD") return "US";
  return "OTHER";
}

export function estimateTakeHome(params: {
  currency: Currency;
  baseLpa: number | null;
  totalLpa: number | null;
  baseUsd: number | null;
  totalUsd: number | null;
}): TakeHomeEstimate | null {
  if (params.currency === "INR") {
    if (params.baseLpa == null && params.totalLpa == null) return null;
    return estimateIndiaTakeHome({
      baseLpa: params.baseLpa,
      totalLpa: params.totalLpa,
    });
  }

  if (params.currency === "USD") {
    const total =
      params.totalUsd ??
      (params.totalLpa != null ? params.totalLpa * 1000 : null) ??
      params.baseUsd;
    if (total == null) return null;
    return estimateUsTakeHome({ totalUsd: total });
  }

  return null;
}
