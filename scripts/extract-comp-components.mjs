/** Parse variable, joining bonus, and stock comp (LPA) from LeetCode comp post text. */

const USD_TO_INR = 84;

function roundLpa(n) {
  return Math.round(n * 100) / 100;
}

function parseNumeric(s) {
  const m = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

/** Turn a captured amount fragment into LPA (INR). */
function amountFragmentToLpa(fragment, baseLpa, { perYearUsd = false, totalUsdVestYears = null } = {}) {
  if (!fragment) return null;
  const f = fragment.trim();
  const lower = f.toLowerCase();

  const pctBase = lower.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of\s*)?(?:base|fixed)/);
  if (pctBase && baseLpa != null) {
    return roundLpa((baseLpa * parseFloat(pctBase[1])) / 100);
  }

  if (/\$|usd|eur|euro/i.test(f)) {
    const num = parseNumeric(f);
    if (num == null) return null;
    const isEur = /eur|euro/i.test(f);
    const rate = isEur ? 90 : USD_TO_INR;
    let annualUsd = num;
    if (totalUsdVestYears && totalUsdVestYears > 0) {
      annualUsd = num / totalUsdVestYears;
    } else if (perYearUsd || /per\s*year|\/\s*yr|each\s*year|annual/i.test(f)) {
      annualUsd = num;
    } else if (/over\s*(\d+)\s*year/i.test(f)) {
      const yrs = parseInt(f.match(/over\s*(\d+)\s*year/i)[1], 10);
      annualUsd = num / yrs;
    } else if (/(\d+)\s*year/i.test(f) && /vest/i.test(f)) {
      const yrs = parseInt(f.match(/(\d+)\s*year/i)[1], 10);
      annualUsd = num / yrs;
    }
    return roundLpa((annualUsd * rate) / 100_000);
  }

  if (/crore|\bcr\b/i.test(f)) {
    const num = parseNumeric(f);
    return num != null ? roundLpa(num * 100) : null;
  }

  if (/lpa|lakh|lac|\bl\b(?!\w)/i.test(f) || /₹|inr|rs\.?/i.test(f)) {
    const num = parseNumeric(f);
    if (num == null) return null;
    if (/lpa|lakh|lac|\bl\b/i.test(f) || (num < 500 && /₹|inr/i.test(f))) {
      return roundLpa(num);
    }
    if (/inr|₹/i.test(f) && num >= 100_000) {
      return roundLpa(num / 100_000);
    }
    if (num < 500) return roundLpa(num);
  }

  const bare = parseNumeric(f);
  if (bare != null && bare < 500) return roundLpa(bare);
  return null;
}

function firstLineMatch(text, patterns) {
  const lines = text.split("\n");
  for (const line of lines) {
    for (const re of patterns) {
      const m = line.match(re);
      if (m) return { line, match: m };
    }
  }
  return null;
}

function amountFromEquityLine(capture, baseLpa) {
  const frag = capture;
  const perYear = /per\s*year|\/\s*yr|each\s*year|annual/i.test(frag);
  let vestYears = null;
  const vestM = frag.match(/(?:over|vest(?:ed)?(?:\s*equally)?\s*over?)\s*(\d+)\s*year/i);
  if (vestM) vestYears = parseInt(vestM[1], 10);
  return amountFragmentToLpa(frag, baseLpa, {
    perYearUsd: perYear,
    totalUsdVestYears: vestYears,
  });
}

function extractJoiningBonusLpa(text, baseLpa) {
  const hit = firstLineMatch(text, [
    /(?:joining|sign[\s-]?on|signing)\s*(?:bonus|booster)?\s*[:=\-–]?\s*(.+)$/i,
    /(?:jb)\s*[:=\-]?\s*(.+)$/i,
  ]);
  if (!hit) return null;
  if (/joining\s*by|conditional/i.test(hit.line) && !/\d/.test(hit.match[1])) {
    return null;
  }
  return amountFragmentToLpa(hit.match[1], baseLpa);
}

function extractVariableLpa(text, baseLpa) {
  const hit = firstLineMatch(text, [
    /(?:target\s*)?(?:annual\s*)?variable(?:\s*pay|\s*comp)?\s*[:=\-~]?\s*(.+)$/i,
    /performance\s*(?:bonus|pay)\s*[:=\-~]?\s*(.+)$/i,
    /variable\s*[:=\-~]\s*(.+)$/i,
    /(?:target\s*)?annual\s*bonus\s*[:=\-~]?\s*(.+)$/i,
  ]);
  if (hit) {
    if (/joining|signing|sign[\s-]?on/i.test(hit.line)) return null;
    const v = amountFragmentToLpa(hit.match[1], baseLpa);
    if (v != null) return v;
  }

  const pctOnly = text.match(
    /(?:variable|bonus|performance)\s*[^.\n]{0,40}?(\d+(?:\.\d+)?)\s*%\s*(?:of\s*)?(?:base|fixed)/i,
  );
  if (pctOnly && baseLpa != null) {
    return roundLpa((baseLpa * parseFloat(pctOnly[1])) / 100);
  }
  return null;
}

/** RSU, ESOP, stock bonus/grant — rolled into one stocks figure. */
function extractStocksLpa(text, baseLpa) {
  const patterns = [
    /(?:esop|esops)\s*[:=\-~]?\s*(.+)$/i,
    /employee\s*stock\s*(?:option|ownership)?\s*(?:plan|scheme)?\s*[:=\-~]?\s*(.+)$/i,
    /\brsu?s?\b\s*[:=\-~]?\s*(.+)$/i,
    /restricted\s*stock\s*(?:units?|grant)?\s*[:=\-~]?\s*(.+)$/i,
    /stock\s*(?:bonus|grant|options?)\s*[:=\-~]?\s*(.+)$/i,
    /equity\s*[:=\-~]?\s*(.+)$/i,
  ];

  const lines = text.split("\n");
  let total = 0;
  let found = false;

  for (const line of lines) {
    for (const re of patterns) {
      const m = line.match(re);
      if (!m) continue;
      const v = amountFromEquityLine(m[1], baseLpa);
      if (v != null && v > 0) {
        total += v;
        found = true;
      }
      break;
    }
  }

  return found ? roundLpa(total) : null;
}

const EMPTY_COMP = {
  variableLpa: null,
  joiningBonusLpa: null,
  stocksLpa: null,
};

/**
 * @param {string} text Post title + content
 * @param {number|null} baseLpa
 * @param {number|null} totalLpa
 */
export function extractCompComponents(text, baseLpa, totalLpa) {
  if (!text?.trim()) {
    return { ...EMPTY_COMP };
  }

  let joiningBonusLpa = extractJoiningBonusLpa(text, baseLpa);
  let variableLpa = extractVariableLpa(text, baseLpa);
  let stocksLpa = extractStocksLpa(text, baseLpa);

  if (totalLpa != null && baseLpa != null && totalLpa > baseLpa + 0.05) {
    const gap = roundLpa(totalLpa - baseLpa);
    const sumKnown = roundLpa(
      [variableLpa, joiningBonusLpa, stocksLpa]
        .filter((v) => v != null)
        .reduce((a, b) => a + b, 0),
    );
    const missing = [];
    if (variableLpa == null) missing.push("variable");
    if (joiningBonusLpa == null) missing.push("joining");
    if (stocksLpa == null) missing.push("stocks");

    if (missing.length === 1 && Math.abs(gap - sumKnown) > 0.05) {
      const remainder = roundLpa(gap - sumKnown);
      if (remainder > 0.05) {
        if (missing[0] === "variable") variableLpa = remainder;
        else if (missing[0] === "joining") joiningBonusLpa = remainder;
        else if (missing[0] === "stocks") stocksLpa = remainder;
      }
    }
  }

  return { variableLpa, joiningBonusLpa, stocksLpa };
}

/** Informational lines — variable & stocks only (joining is in take-home core). */
export function nonCashCompLines(comp, baseLpa, totalLpa) {
  const lines = [];
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
      note: "Annualized from post; RSU vs ESOP not distinguished here",
    });
  }

  const hasParsed =
    (comp?.variableLpa ?? 0) > 0 ||
    (comp?.joiningBonusLpa ?? 0) > 0 ||
    (comp?.stocksLpa ?? 0) > 0;

  if (!hasParsed && totalLpa != null && baseLpa != null && totalLpa > baseLpa) {
    lines.push({
      id: "other-comp",
      label: "Other CTC (not split in post text)",
      amountAnnual: (totalLpa - baseLpa) * 100_000,
      note: "Variable or stocks — not included in monthly in-hand",
    });
  }
  return lines;
}
