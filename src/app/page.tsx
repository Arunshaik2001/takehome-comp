import { OffersExplorer } from "@/components/OffersExplorer";
import { SalaryCalculator } from "@/components/SalaryCalculator";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { formatLpa, formatMoney } from "@/lib/format";
import { getOffersDataset, summarizeOffers } from "@/lib/offers";

export default function Home() {
  const dataset = getOffersDataset();
  const indiaOffers = dataset.offers.filter((o) => o.region === "IN");
  const stats = summarizeOffers(indiaOffers);
  const refreshed = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dataset.generatedAt));

  return (
    <div className="min-h-full overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.1),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(120,113,108,0.06),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(0,0,0,0.4),_transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <SiteHeader />

        <p className="max-w-2xl text-lg leading-relaxed text-stone-600 dark:text-stone-400">
          Browse India tech compensation shared on LeetCode Discuss over the last{" "}
          {dataset.windowDays} days—with estimated monthly net pay after tax and
          statutory deductions, not headline CTC alone.
        </p>
        <p className="mt-2 max-w-2xl text-xs text-stone-500 dark:text-stone-500">
          Dataset last updated {refreshed} · {indiaOffers.length} India offers
          in window
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Offers in window"
            value={String(stats.inrCount)}
            hint="INR posts with net-pay estimate"
          />
          <StatCard
            label="Median est. net pay"
            value={
              stats.medianNetMonthly != null
                ? formatMoney(stats.medianNetMonthly, "INR")
                : "—"
            }
            hint="Monthly equivalent (year-1 model)"
          />
          <StatCard
            label="Median posted CTC"
            value={
              stats.medianPostedLpa != null
                ? formatLpa(stats.medianPostedLpa)
                : "—"
            }
            hint="Total comp as stated in posts"
          />
        </div>

        <div className="mt-8 flex min-w-0 flex-col gap-8">
          <div className="grid min-w-0 gap-6 md:grid-cols-2 md:items-stretch">
            <SalaryCalculator />
            <aside className="flex min-w-0 flex-col rounded-2xl border border-stone-200/80 bg-stone-900 p-5 text-stone-100 dark:border-stone-700">
              <h3 className="font-semibold">Methodology</h3>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-stone-300 marker:text-stone-500">
                <li>
                  India new tax regime (FY 2025–26), ₹75,000 standard deduction,
                  employee PF on the statutory wage ceiling, and professional tax
                  where applicable.
                </li>
                <li>
                  Year-1 net pay includes fixed base salary plus parsed joining
                  bonus (taxed, spread over 12 months for the monthly figure).
                  Variable pay and stock grants are shown separately and are not
                  included in monthly net pay.
                </li>
                <li>
                  Compensation components are parsed from post text when possible;
                  otherwise only base and total CTC are available.
                </li>
              </ul>
            </aside>
          </div>
          <OffersExplorer offers={indiaOffers} />
        </div>

        <SiteFooter />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="animate-fade-in rounded-2xl border border-stone-200/90 bg-white/90 p-5 backdrop-blur-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-900/90 dark:hover:shadow-stone-900/50">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <p className="mt-2 truncate font-mono text-2xl font-semibold text-stone-900 dark:text-stone-50">
        {value}
      </p>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{hint}</p>
    </div>
  );
}
