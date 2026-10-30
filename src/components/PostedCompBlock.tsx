import type { CompensationOffer } from "@/lib/types";
import { formatLpa, inrCompBreakdown } from "@/lib/format";

function CompLine({
  label,
  value,
  compact,
}: {
  label: string;
  value: number | null;
  compact?: boolean;
}) {
  if (value == null) return null;
  if (compact) {
    return (
      <div className="text-[11px] font-normal text-stone-600 dark:text-stone-400">
        {label}{" "}
        <span className="font-mono text-stone-700 dark:text-stone-300">
          {formatLpa(value)}
        </span>
      </div>
    );
  }
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-mono text-stone-700 dark:text-stone-300">
        {formatLpa(value)}
      </dd>
    </div>
  );
}

export function PostedCompBlock({
  offer,
  compact = false,
}: {
  offer: CompensationOffer;
  compact?: boolean;
}) {
  const breakdown = inrCompBreakdown(offer);
  if (!breakdown) {
    return <span className="font-mono text-stone-500">—</span>;
  }

  const {
    totalLpa,
    baseLpa,
    variableLpa,
    joiningBonusLpa,
    stocksLpa,
    extraLpa,
    hasSplit,
  } = breakdown;

  if (compact) {
    return (
      <div className="space-y-0.5 font-mono text-stone-800 dark:text-stone-200">
        <div className="font-medium">{formatLpa(totalLpa)} CTC</div>
        {baseLpa != null ? (
          <div className="text-[11px] font-normal text-stone-600 dark:text-stone-400">
            Base{" "}
            <span className="font-mono text-stone-700 dark:text-stone-300">
              {formatLpa(baseLpa)}
            </span>
          </div>
        ) : null}
        <CompLine label="Variable" value={variableLpa} compact />
        <CompLine label="Joining" value={joiningBonusLpa} compact />
        <CompLine label="Stocks" value={stocksLpa} compact />
        {!hasSplit && extraLpa != null ? (
          <div className="text-[11px] font-normal text-stone-500 dark:text-stone-500">
            +{formatLpa(extraLpa)} other CTC (unparsed)
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <dl className="space-y-1 text-xs">
      <div className="flex justify-between gap-2">
        <dt className="text-stone-500">CTC total</dt>
        <dd className="font-mono font-medium text-stone-800 dark:text-stone-200">
          {formatLpa(totalLpa)}
        </dd>
      </div>
      {baseLpa != null ? (
        <div className="flex justify-between gap-2">
          <dt className="text-stone-500">Base</dt>
          <dd className="font-mono text-stone-700 dark:text-stone-300">
            {formatLpa(baseLpa)}
          </dd>
        </div>
      ) : null}
      <CompLine label="Variable" value={variableLpa} />
      <CompLine label="Joining bonus" value={joiningBonusLpa} />
      <CompLine label="Stocks" value={stocksLpa} />
      {!hasSplit && extraLpa != null ? (
        <div className="flex justify-between gap-2">
          <dt className="text-stone-500">Other CTC</dt>
          <dd className="font-mono text-stone-700 dark:text-stone-300">
            {formatLpa(extraLpa)}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
