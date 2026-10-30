/** Parse variable, joining bonus, and stock comp (LPA) from LeetCode comp post text. */

const USD_TO_INR = 84;

function roundLpa(n) {
  return Math.round(n * 100) / 100;
}

function parseNumeric(s) {
  const m = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

/** Parse ₹ / Rs amounts (incl. 70,00,000) to LPA. */
function inrFragmentToLpa(fragment) {
  if (!fragment) return null;
  const f = fragment.trim();
  if (/crore|\bcr\b/i.test(f)) {
    const n = parseNumeric(f);
    return n != null ? roundLpa(n * 100) : null;
  }
  const num = parseNumeric(f);
  if (num == null) return null;
  if (/lpa|lakh|lac|\bl\b/i.test(f) && num < 500) return roundLpa(num);
  if (num >= 100_000) return roundLpa(num / 100_000);
  if (num < 500) return roundLpa(num);
  return null;
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
    let num = parseNumeric(f);
    if (num == null) return null;
    if (/\d\s*k\b/i.test(f.replace(/,/g, "")) || /\d\s*k\b/i.test(lower)) {
      num *= 1000;
    }
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
    const lpa = inrFragmentToLpa(f);
    if (lpa != null) return lpa;
  }

  const bare = parseNumeric(f);
  if (bare != null && bare < 500) return roundLpa(bare);
  return null;
}

function normalizeCompanyKey(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Search terms for locating one offer block inside a multi-company post. */
function companySearchTerms(company) {
  const normalized = normalizeCompanyKey(company);
  const terms = new Set();
  if (normalized) terms.add(normalized);
  for (const p of normalized.split(/\s+/).filter((p) => p.length >= 4)) {
    terms.add(p);
  }
  return [...terms];
}

function lineHasPrimaryCompany(line, company) {
  const primary = normalizeCompanyKey(company);
  if (!primary) return false;
  const l = line.toLowerCase();
  if (l.includes(primary)) return true;
  const first = primary.split(/\s+/)[0];
  return first.length >= 4 && l.includes(first);
}

function lineHasCompany(line, terms, company) {
  return lineHasPrimaryCompany(line, company);
}

function isOfferBoundaryLine(line) {
  const t = line.trim();
  return (
    /^\*\*\d+\.\s/.test(t) ||
    /^#{1,3}\s+\d+\./.test(t) ||
    /^Company\s*:/i.test(t) ||
    /^Offer\s*\d+\s*[:.\-]/i.test(t) ||
    /^Offer\s+from\s+/i.test(t) ||
    /^[A-Z][A-Za-z0-9.&-]+\s+Title\/Level\s*:/i.test(t)
  );
}

function lineMatchesOfferHeader(line, terms, company) {
  const t = line.trim();
  if (!lineHasPrimaryCompany(line, company)) return false;
  if (/^\*\*\d+\.\s/.test(t)) return true;
  if (/^\*\*[^*]+—/.test(t) || /^\*\*[^*]+\*\*/.test(t)) return true;
  if (/^Company\s*:/i.test(t)) return true;
  if (/^#{1,3}\s/.test(t)) return true;
  return false;
}

/**
 * Limit parsing to the offer block for one company (multi-offer posts).
 * @param {string} fullText
 * @param {{ company?: string, role?: string }} ctx
 */
export function extractOfferSection(fullText, ctx) {
  if (!fullText?.trim() || !ctx?.company) return fullText ?? "";

  const terms = companySearchTerms(ctx.company);
  const lines = fullText.split("\n");

  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lineMatchesOfferHeader(lines[i], terms, ctx.company)) {
      start = i;
      break;
    }
  }

  if (start < 0) {
    for (let i = 0; i < lines.length; i++) {
      if (!lineHasPrimaryCompany(lines[i], ctx.company)) continue;
      const window = lines.slice(i, Math.min(lines.length, i + 12)).join("\n");
      if (/base|ctc|tc|lpa|lakh|lac|₹|rsu|bonus|fixed|comp/i.test(window)) {
        start = i;
        break;
      }
    }
  }

  if (start < 0) return fullText;

  let end = lines.length;
  for (let j = start + 1; j < lines.length; j++) {
    if (!isOfferBoundaryLine(lines[j])) continue;
    if (lineMatchesOfferHeader(lines[j], terms, ctx.company)) continue;
    end = j;
    break;
  }

  return lines.slice(start, end).join("\n");
}

export function parseCompanyFromHeader(line) {
  const t = line.trim();
  let m = t.match(/^\*\*\d+\.\s*([^—\-–*|]+)/);
  if (m) return m[1].trim();
  m = t.match(/^Company\s*:\s*(.+)$/i);
  if (m) return m[1].trim();
  m = t.match(/^#{1,3}\s+\d+\.\s*([^—\-–|]+)/);
  if (m) return m[1].trim();
  m = t.match(/^([A-Z][A-Za-z0-9.&-]+)\s+Title\/Level\s*:/i);
  if (m) return m[1].trim();
  m = t.match(/\boffer\s+from\s+([A-Za-z0-9][A-Za-z0-9.&'-]+)/i);
  if (m) return m[1].trim();
  return null;
}

function blocksFromLineStarts(fullText, lineTest, headerParser) {
  const lines = fullText.split("\n");
  const starts = [];
  for (let i = 0; i < lines.length; i++) {
    if (lineTest(lines[i])) starts.push(i);
  }
  if (starts.length === 0) return null;
  const blocks = [];
  for (let s = 0; s < starts.length; s++) {
    const start = starts[s];
    const end = starts[s + 1] ?? lines.length;
    const header = lines[start];
    blocks.push({
      company: headerParser(header),
      header,
      sectionText: lines.slice(start, end).join("\n"),
    });
  }
  return blocks;
}

function previousNonEmptyIndex(lines, from) {
  for (let j = from - 1; j >= 0; j--) {
    if (lines[j].trim()) return j;
  }
  return from;
}

function looksLikeCompanyLabel(line) {
  const t = (line || "").trim();
  if (!t || t.length > 40 || t.includes(":")) return false;
  if (/education|experience|location|salary|bonus|stock|total|catch|prior|compensation|interview|round|overall|finally|questions/i.test(t)) {
    return false;
  }
  return /^[A-Z][A-Za-z0-9.&' -]{1,40}$/.test(t);
}

/** LeetCode often renders "Uber" and "Title/Level:" on separate lines. */
function blocksFromTitleLevel(fullText) {
  const lines = fullText.split("\n");
  const titleIdx = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^Title\/Level\s*:/i.test(lines[i].trim())) titleIdx.push(i);
  }
  if (titleIdx.length === 0) return null;

  const blocks = [];
  for (let s = 0; s < titleIdx.length; s++) {
    const titleAt = titleIdx[s];
    const prev = previousNonEmptyIndex(lines, titleAt);
    const companyLine = lines[prev];
    const start = looksLikeCompanyLabel(companyLine) ? prev : titleAt;
    const nextTitle = titleIdx[s + 1];
    let end = lines.length;
    if (nextTitle != null) {
      const nextPrev = previousNonEmptyIndex(lines, nextTitle);
      end = looksLikeCompanyLabel(lines[nextPrev]) ? nextPrev : nextTitle;
    }
    blocks.push({
      company: looksLikeCompanyLabel(companyLine) ? companyLine.trim() : null,
      header: lines[titleAt],
      sectionText: lines.slice(start, end).join("\n"),
    });
  }
  return blocks;
}

function lineIsPreviousPay(line) {
  return (
    /\b(?:current|currently|previous|prior|existing|old|present)\b/i.test(line) &&
    /\b(?:ctc|tc|salary|package|compensation|comp|pay|in-?hand|drawing)\b/i.test(
      line,
    )
  );
}

function windowHasPay(lines, start) {
  const chunk = lines.slice(start, start + 10).join("\n");
  return /\b(?:base|salary|fixed|ctc|package|total\s*comp|title\/level)\b/i.test(
    chunk,
  );
}

/** "Google" then Salary/Base within a few lines — a second company starts a new offer. */
function blocksFromCompanyPay(fullText) {
  const lines = fullText.split("\n");
  const starts = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    const companyish =
      looksLikeCompanyLabel(t) || /^offer\s+from\s+\S+/i.test(t);
    if (!companyish || lineIsPreviousPay(t)) continue;
    if (!windowHasPay(lines, i)) continue;
    if (starts.length && i - starts[starts.length - 1] < 3) continue;
    starts.push(i);
  }
  if (starts.length < 2) return null;
  const blocks = [];
  for (let s = 0; s < starts.length; s++) {
    const start = starts[s];
    const end = starts[s + 1] ?? lines.length;
    const header = lines[start].trim();
    blocks.push({
      company: parseCompanyFromHeader(header) || header.replace(/:$/, ""),
      header,
      sectionText: lines.slice(start, end).join("\n"),
    });
  }
  return blocks;
}

/** Split a post into per-offer sections (multi-company threads). */
export function detectOfferBlocks(fullText) {
  if (!fullText?.trim()) return [];

  const companyPay = blocksFromCompanyPay(fullText);
  if (companyPay?.length >= 2) return companyPay;

  const splitTitles = blocksFromTitleLevel(fullText);
  if (splitTitles?.length) return splitTitles;

  const titleLevel = blocksFromLineStarts(
    fullText,
    (line) => /^[A-Z][A-Za-z0-9.&-]+\s+Title\/Level\s*:/i.test(line.trim()),
    parseCompanyFromHeader,
  );
  if (titleLevel && titleLevel.length >= 1) return titleLevel;

  const numbered = blocksFromLineStarts(
    fullText,
    (line) => isOfferBoundaryLine(line),
    parseCompanyFromHeader,
  );
  if (numbered && numbered.length >= 1) return numbered;

  return [{ company: null, header: null, sectionText: fullText }];
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

function firstLineMatchFiltered(text, patterns, lineFilter) {
  const lines = text.split("\n");
  for (const line of lines) {
    if (lineFilter && !lineFilter(line)) continue;
    for (const re of patterns) {
      const m = line.match(re);
      if (m) return { line, match: m };
    }
  }
  return null;
}

/**
 * Drop previous-job pay so free-text posts don't mix "current CTC" with the offer.
 * Only labeled amounts are read. YOE, interview rounds, and notice period are ignored.
 */
function withoutPreviousComp(text) {
  return text
    .split("\n")
    .map((line) =>
      line.replace(
        /\b(?:current|previous|prior|existing|old|currently)\s+(?:company\s*:\s*[A-Za-z0-9 .&'-]{1,40}\s*)?(?:ctc|tc|salary|package|compensation|comp|pay|in-?hand)\s*(?:is|was|of|:|=|~|-)?\s*(?:₹|rs\.?|inr|about|around|approx\.?|~)?\s*[\d,.]+\s*(?:lpa|l\b|lac|lakhs?|cr|crore|k)?(?:\s*\([^)]*\))?/gi,
        " ",
      ),
    )
    .join("\n");
}

function isNonOfferTotalLine(line) {
  return /current\s*(?:tc|ctc)|previous\s*(?:tc|ctc)|existing\s*(?:tc|ctc)|prior\s*(?:tc|ctc)|old\s*(?:tc|ctc)/i.test(
    line,
  );
}

function amountOnPayLine(line) {
  const labeled = [
    /\bbase(?:\s*salary)?\s*[:=~\-]?\s*(.+)$/i,
    /\bsalary\s*[:=~\-]?\s*(.+)$/i,
    /\bfixed(?:\s*(?:pay|salary|component))?\s*[:=~\-]?\s*(.+)$/i,
  ];
  for (const re of labeled) {
    const m = line.match(re);
    if (!m) continue;
    if (/\bsalary\b/i.test(line) && /\bbase\b/i.test(line) && re.source.startsWith("\\bsalary")) {
      continue;
    }
    const v = parseLpaFromCompLine(m[1], null);
    if (v != null && v > 0 && v < 500) return v;
  }
  const trail = line.match(/(\d+(?:\.\d+)?)\s*(?:lpa|l)\b[^\n]{0,12}\b(?:base|fixed)\b/i);
  if (trail) return roundLpa(parseFloat(trail[1]));
  return null;
}

function extractBaseFromSection(sectionText) {
  for (const line of sectionText.split("\n")) {
    if (lineIsPreviousPay(line)) continue;
    const v = amountOnPayLine(line);
    if (v != null) return v;
  }
  return null;
}

function parseLpaFromCompLine(capture, baseLpa) {
  const range = capture.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/);
  if (range) {
    return roundLpa((parseFloat(range[1]) + parseFloat(range[2])) / 2);
  }
  return amountFragmentToLpa(capture, baseLpa);
}

function extractTotalFromSection(sectionText, baseLpa) {
  const lines = sectionText.split("\n");
  const totalPriorities = [
    /\bfirst\s*year\s*tc[^:]*[:=~]\s*(.+)$/i,
    /\bestimated\s*total\s*compensation(?:\s*\([^)]*\))?\s*[:=~]\s*(.+)$/i,
    /\btotal\s*comp(?:ensation)?\s*(?:\([^)]*\))?\s*[:=~]\s*(.+)$/i,
    /\btotal\s*compensation(?:\s*\([^)]*\))?\s*[:=~]\s*(.+)$/i,
    /\btc\s*[:=~]\s*(.+)$/i,
    /\btotal\s*(?:comp(?:ensation)?)?\s*[:=~]\s*(.+)$/i,
    /\bctc\s*[:=~]\s*(.+)$/i,
  ];

  for (const re of totalPriorities) {
    for (const line of lines) {
      if (isNonOfferTotalLine(line) || lineIsPreviousPay(line)) continue;
      const m = line.match(re);
      if (!m) continue;
      const totalLpa = parseLpaFromCompLine(m[1], baseLpa);
      if (totalLpa != null) return totalLpa;
    }
  }
  return null;
}

/** Base / total (CTC) from a single offer section. */
export function extractBaseTotalFromSection(sectionText) {
  const offerText = withoutPreviousComp(sectionText);
  const baseLpa = extractBaseFromSection(offerText);
  const totalLpa = extractTotalFromSection(offerText, baseLpa);
  return { baseLpa, totalLpa };
}

function amountFromEquityLine(capture, baseLpa) {
  const frag = capture;
  const perYear = /per\s*year|\/\s*yr|each\s*year|annual/i.test(frag);
  let vestYears = null;
  const vestM = frag.match(/(?:\/|over|vest(?:ed)?(?:\s*equally)?\s*over?)\s*(\d+)\s*year/i);
  if (vestM) vestYears = parseInt(vestM[1], 10);
  return amountFragmentToLpa(frag, baseLpa, {
    perYearUsd: perYear,
    totalUsdVestYears: vestYears,
  });
}

function extractJoiningBonusLpa(text, baseLpa) {
  const joiningRs = text.match(
    /\bjoining\s+bonus\s*:\s*(Rs?\.?\s*[\d,]+(?:\.\d+)?)/i,
  );
  if (joiningRs) {
    const v = inrFragmentToLpa(joiningRs[1]);
    if (v != null) return v;
  }

  for (const line of text.split("\n")) {
    const inline = line.match(/\bjb\s*[:=~]\s*(\d+(?:\.\d+)?)\s*l(?:pa)?/i);
    if (inline) return roundLpa(parseFloat(inline[1]));
  }

  const hit = firstLineMatch(text, [
    /year\s*1\s*joining\s*bonus\s*[:=\-~]?\s*(.+)$/i,
    /(?:joining|sign[\s-]?on|signing)\s*(?:bonus|booster)?\s*[:=\-–]?\s*(.+)$/i,
    /(?:^|\s)(?:jb)\s*[:=\-]?\s*(.+)$/i,
  ]);
  if (!hit) return null;
  if (/joining\s*by|conditional/i.test(hit.line) && !/\d/.test(hit.match[1])) {
    return null;
  }
  return amountFragmentToLpa(hit.match[1], baseLpa);
}

function extractVariableLpa(text, baseLpa) {
  const annualRs = text.match(
    /\bannual\s+bonus\s*:\s*(Rs?\.?\s*[\d,]+(?:\.\d+)?)/i,
  );
  if (annualRs) {
    const v = inrFragmentToLpa(annualRs[1]);
    if (v != null) return v;
  }

  const hit = firstLineMatch(text, [
    /target\s*bonus\s*[:=\-~]?\s*(.+)$/i,
    /(?:target\s*)?(?:annual\s*)?variable(?:\s*pay|\s*comp)?\s*[:=\-~]?\s*(.+)$/i,
    /performance\s*(?:bonus|pay)\s*[:=\-~]?\s*(.+)$/i,
    /variable\s*[:=\-~]\s*(.+)$/i,
    /(?:target\s*)?annual\s*bonus\s*[:=\-~]?\s*(.+)$/i,
    /bonus\s*[:=\-~]\s*~?\s*(\d+(?:\.\d+)?)\s*%/i,
  ]);
  if (hit) {
    if (/joining|signing|sign[\s-]?on/i.test(hit.line)) return null;
    if (/bonus\s*[:=\-~]?\s*~?\s*(\d+(?:\.\d+)?)\s*%/i.test(hit.line) && baseLpa != null) {
      const pct = parseFloat(hit.match[1]);
      return roundLpa((baseLpa * pct) / 100);
    }
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
    /\brsus?\b\s*[:=\-~]?\s*(.+)$/i,
    /restricted\s*stock\s*(?:units?|grant)?\s*[:=\-~]?\s*(.+)$/i,
    /stock\s*(?:bonus|grant|options?)\s*[:=\-~]?\s*(.+)$/i,
    /equity\s*[:=\-~]?\s*(.+)$/i,
  ];

  const lines = text.split("\n");
  let total = 0;
  let found = false;

  for (const line of lines) {
    const inlineRe =
      /\b(?:rsu?s?|esop?s?|stock\s*bonus)\s*[:=~]\s*(\d+(?:\.\d+)?)\s*l(?:pa)?/gi;
    let inline;
    let hadInline = false;
    while ((inline = inlineRe.exec(line)) !== null) {
      hadInline = true;
      const v = roundLpa(parseFloat(inline[1]));
      if (v > 0) {
        total += v;
        found = true;
      }
    }
    if (hadInline) continue;

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
 * @param {{ company?: string, role?: string }|null} offerContext
 */
export function extractCompComponents(text, baseLpa, totalLpa, offerContext = null) {
  if (!text?.trim()) {
    return { ...EMPTY_COMP };
  }

  const scoped = withoutPreviousComp(
    offerContext?.company != null && String(offerContext.company).trim()
      ? extractOfferSection(text, offerContext)
      : text,
  );

  const joiningBonusLpa = extractJoiningBonusLpa(scoped, baseLpa);
  const variableLpa = extractVariableLpa(scoped, baseLpa);
  const stocksLpa = extractStocksLpa(scoped, baseLpa);

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
