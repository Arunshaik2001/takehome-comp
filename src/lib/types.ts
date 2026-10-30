export type Currency = "INR" | "USD" | "EUR" | "GBP";

export type Region = "IN" | "US" | "OTHER";

export interface DeductionLine {
  id: string;
  label: string;
  amountAnnual: number;
  note?: string;
}

export interface TakeHomeEstimate {
  region: Region;
  currency: Currency;
  grossAnnual: number;
  grossMonthly: number;
  netAnnual: number;
  netMonthly: number;
  totalDeductionsAnnual: number;
  effectiveRate: number;
  lines: DeductionLine[];
  disclaimer: string;
}

export interface CompComponents {
  variableLpa: number | null;
  joiningBonusLpa: number | null;
  stocksLpa: number | null;
}

export interface CompensationOffer {
  offerKey: string;
  id: number;
  postedAt: string;
  company: string;
  role: string;
  location: string;
  currency: Currency;
  region: Region;
  yoe: number | null;
  baseLpa: number | null;
  totalLpa: number | null;
  compComponents?: CompComponents;
  baseUsd: number | null;
  totalUsd: number | null;
  leetcodeTopicId: number;
  takeHome: TakeHomeEstimate;
}

export interface OffersDataset {
  generatedAt: string;
  windowDays: number;
  source: string;
  leetcodeCompPostsTotal?: number | null;
  parsedRecordsScanned?: number;
  offerCount: number;
  offers: CompensationOffer[];
}
